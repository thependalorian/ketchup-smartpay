/**
 * Agent Network Management Service
 * 
 * Location: services/agentNetworkService.ts
 * Purpose: Manage agent network for cash-out services (M-PESA model)
 * 
 * Agent Types:
 * - Small: Mom & pop shops (local agents)
 * - Medium: Regional agents (multiple locations)
 * - Large: National chains (Shoprite, Model, OK Foods)
 * 
 * Features:
 * - Agent onboarding and management
 * - Liquidity monitoring and alerts
 * - Availability tracking
 * - Settlement processing
 * - Commission calculation
 */

import { query } from '@/utils/db';
import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import logger from '@/utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export type AgentType = 'small' | 'medium' | 'large';
export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'pending_approval';
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  location: string;
  latitude?: number;
  longitude?: number;
  wallet_id: string;
  liquidity_balance: number;
  cash_on_hand: number;
  status: AgentStatus;
  min_liquidity_required: number;
  max_daily_cashout: number;
  commission_rate: number; // Percentage (e.g., 1.5 for 1.5%)
  created_at: Date;
  updated_at: Date;
}

export interface AgentLiquidityLog {
  id: string;
  agent_id: string;
  liquidity_balance: number;
  cash_on_hand: number;
  timestamp: Date;
  notes?: string;
}

export interface AgentTransaction {
  id: string;
  agent_id: string;
  beneficiary_id: string;
  voucher_id?: string;
  amount: number;
  transaction_type: 'cash_out' | 'cash_in' | 'commission';
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export interface AgentSettlement {
  id: string;
  agent_id: string;
  settlement_period: string; // e.g., "2026-01"
  total_amount: number;
  commission: number;
  settlement_status: SettlementStatus;
  settled_at?: Date;
  created_at: Date;
}

// ============================================================================
// AGENT NETWORK SERVICE
// ============================================================================

class AgentNetworkService {
  /**
   * Get agent by ID
   */
  async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const agents = await query<Agent>(
        `SELECT 
          id, name, type, location, latitude, longitude, wallet_id,
          liquidity_balance, cash_on_hand, status,
          min_liquidity_required, max_daily_cashout, commission_rate,
          created_at, updated_at
        FROM agents
        WHERE id = $1`,
        [agentId]
      );

      return agents.length > 0 ? agents[0] : null;
    } catch (error: any) {
      logger.error('Error getting agent', error, { agentId });
      throw error;
    }
  }

  /**
   * List all agents with optional filters
   */
  async listAgents(filters?: {
    status?: AgentStatus;
    type?: AgentType;
    location?: string;
    minLiquidity?: number;
  }): Promise<Agent[]> {
    try {
      let sql = `
        SELECT 
          id, name, type, location, latitude, longitude, wallet_id,
          liquidity_balance, cash_on_hand, status,
          min_liquidity_required, max_daily_cashout, commission_rate,
          created_at, updated_at
        FROM agents
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        sql += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters?.type) {
        sql += ` AND type = $${paramIndex++}`;
        params.push(filters.type);
      }

      if (filters?.location) {
        sql += ` AND location ILIKE $${paramIndex++}`;
        params.push(`%${filters.location}%`);
      }

      if (filters?.minLiquidity !== undefined) {
        sql += ` AND liquidity_balance >= $${paramIndex++}`;
        params.push(filters.minLiquidity);
      }

      sql += ` ORDER BY name ASC`;

      const agents = await query<Agent>(sql, params);
      return agents;
    } catch (error: any) {
      logger.error('Error listing agents', error);
      throw error;
    }
  }

  /**
   * Find nearby agents with available liquidity
   */
  async findNearbyAgents(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    minLiquidity?: number
  ): Promise<Agent[]> {
    try {
      // Simple distance calculation (Haversine formula approximation)
      // In production, use PostGIS for accurate geographic queries
      let sql = `
        SELECT 
          id, name, type, location, latitude, longitude, wallet_id,
          liquidity_balance, cash_on_hand, status,
          min_liquidity_required, max_daily_cashout, commission_rate,
          created_at, updated_at,
          (
            6371 * acos(
              cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude))
            )
          ) AS distance_km
        FROM agents
        WHERE status = 'active'
          AND latitude IS NOT NULL
          AND longitude IS NOT NULL
      `;
      const params: any[] = [latitude, longitude];
      let paramIndex = 3;

      if (minLiquidity !== undefined) {
        sql += ` AND liquidity_balance >= $${paramIndex++}`;
        params.push(minLiquidity);
      }

      sql += `
        HAVING distance_km <= $${paramIndex}
        ORDER BY distance_km ASC
        LIMIT 20
      `;
      params.push(radiusKm);

      const agents = await query<Agent & { distance_km: number }>(sql, params);
      return agents.map(({ distance_km, ...agent }) => agent);
    } catch (error: any) {
      logger.error('Error finding nearby agents', error);
      throw error;
    }
  }

  /**
   * Check agent liquidity status
   */
  async checkLiquidityStatus(agentId: string): Promise<{
    agent: Agent;
    hasSufficientLiquidity: boolean;
    canProcessCashOut: boolean;
    availableLiquidity: number;
    minRequired: number;
  }> {
    try {
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const hasSufficientLiquidity = agent.liquidity_balance >= agent.min_liquidity_required;
      const canProcessCashOut = agent.status === 'active' && hasSufficientLiquidity;

      return {
        agent,
        hasSufficientLiquidity,
        canProcessCashOut,
        availableLiquidity: agent.liquidity_balance,
        minRequired: agent.min_liquidity_required,
      };
    } catch (error: any) {
      logger.error('Error checking liquidity status', error, { agentId });
      throw error;
    }
  }

  /**
   * Process cash-out transaction
   */
  async processCashOut(
    agentId: string,
    beneficiaryId: string,
    amount: number,
    voucherId?: string
  ): Promise<AgentTransaction> {
    try {
      // Check agent liquidity
      const liquidityStatus = await this.checkLiquidityStatus(agentId);
      if (!liquidityStatus.canProcessCashOut) {
        throw new Error('Agent does not have sufficient liquidity or is not active');
      }

      if (liquidityStatus.availableLiquidity < amount) {
        throw new Error('Insufficient agent liquidity for cash-out');
      }

      // Create transaction record
      const transactionResult = await query<AgentTransaction>(
        `INSERT INTO agent_transactions (
          agent_id, beneficiary_id, voucher_id, amount, transaction_type, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, agent_id, beneficiary_id, voucher_id, amount, transaction_type, status, created_at`,
        [agentId, beneficiaryId, voucherId || null, amount, 'cash_out', 'pending']
      );

      const transaction = transactionResult[0];
      if (!transaction) {
        throw new Error('Failed to create agent transaction');
      }

      // Update agent liquidity
      await query(
        `UPDATE agents 
         SET liquidity_balance = liquidity_balance - $1,
             cash_on_hand = cash_on_hand - $1,
             updated_at = NOW()
         WHERE id = $2`,
        [amount, agentId]
      );

      // Log liquidity change
      await this.logLiquidityChange(agentId, {
        notes: `Cash-out transaction: ${transaction.id}, Amount: ${amount}`,
      });

      // Update transaction status to completed
      await query(
        `UPDATE agent_transactions 
         SET status = $1 
         WHERE id = $2`,
        ['completed', transaction.id]
      );

      return {
        ...transaction,
        status: 'completed',
      };
    } catch (error: any) {
      logger.error('Error processing cash-out', error, { agentId, beneficiaryId, amount });
      throw error;
    }
  }

  /**
   * Log liquidity change
   */
  async logLiquidityChange(
    agentId: string,
    options?: { notes?: string }
  ): Promise<AgentLiquidityLog> {
    try {
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const logResult = await query<AgentLiquidityLog>(
        `INSERT INTO agent_liquidity_logs (
          agent_id, liquidity_balance, cash_on_hand, notes
        ) VALUES ($1, $2, $3, $4)
        RETURNING id, agent_id, liquidity_balance, cash_on_hand, timestamp, notes`,
        [
          agentId,
          agent.liquidity_balance,
          agent.cash_on_hand,
          options?.notes || null,
        ]
      );

      return logResult[0];
    } catch (error: any) {
      logger.error('Error logging liquidity change', error, { agentId });
      throw error;
    }
  }

  /**
   * Mark agent as unavailable
   */
  async markUnavailable(agentId: string, reason?: string): Promise<void> {
    try {
      await query(
        `UPDATE agents 
         SET status = $1, updated_at = NOW()
         WHERE id = $2`,
        ['inactive', agentId]
      );

      await this.logLiquidityChange(agentId, {
        notes: `Agent marked as unavailable. Reason: ${reason || 'Not specified'}`,
      });
    } catch (error: any) {
      logger.error('Error marking agent unavailable', error, { agentId });
      throw error;
    }
  }

  /**
   * Get agent transaction history
   */
  async getAgentTransactions(
    agentId: string,
    filters?: {
      status?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transactions: AgentTransaction[]; total: number }> {
    try {
      let sql = `
        SELECT 
          id, agent_id, beneficiary_id, voucher_id, amount,
          transaction_type, status, created_at
        FROM agent_transactions
        WHERE agent_id = $1
      `;
      const params: any[] = [agentId];
      let paramIndex = 2;

      if (filters?.status) {
        sql += ` AND status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters?.fromDate) {
        sql += ` AND created_at >= $${paramIndex++}`;
        params.push(filters.fromDate);
      }

      if (filters?.toDate) {
        sql += ` AND created_at <= $${paramIndex++}`;
        params.push(filters.toDate);
      }

      sql += ` ORDER BY created_at DESC`;

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const transactions = await query<AgentTransaction>(sql, params);

      // Get total count
      let countSql = `SELECT COUNT(*) as total FROM agent_transactions WHERE agent_id = $1`;
      const countParams: any[] = [agentId];
      let countParamIndex = 2;

      if (filters?.status) {
        countSql += ` AND status = $${countParamIndex++}`;
        countParams.push(filters.status);
      }

      if (filters?.fromDate) {
        countSql += ` AND created_at >= $${countParamIndex++}`;
        countParams.push(filters.fromDate);
      }

      if (filters?.toDate) {
        countSql += ` AND created_at <= $${countParamIndex++}`;
        countParams.push(filters.toDate);
      }

      const countResult = await query<{ total: number }>(countSql, countParams);
      const total = countResult[0]?.total || 0;

      return { transactions, total };
    } catch (error: any) {
      logger.error('Error getting agent transactions', error, { agentId });
      throw error;
    }
  }

  /**
   * Get agent liquidity history
   */
  async getLiquidityHistory(
    agentId: string,
    filters?: {
      fromDate?: string;
      toDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ logs: AgentLiquidityLog[]; total: number }> {
    try {
      let sql = `
        SELECT 
          id, agent_id, liquidity_balance, cash_on_hand, timestamp, notes
        FROM agent_liquidity_logs
        WHERE agent_id = $1
      `;
      const params: any[] = [agentId];
      let paramIndex = 2;

      if (filters?.fromDate) {
        sql += ` AND timestamp >= $${paramIndex++}`;
        params.push(filters.fromDate);
      }

      if (filters?.toDate) {
        sql += ` AND timestamp <= $${paramIndex++}`;
        params.push(filters.toDate);
      }

      sql += ` ORDER BY timestamp DESC`;

      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const logs = await query<AgentLiquidityLog>(sql, params);

      // Get total count
      let countSql = `SELECT COUNT(*) as total FROM agent_liquidity_logs WHERE agent_id = $1`;
      const countParams: any[] = [agentId];
      let countParamIndex = 2;

      if (filters?.fromDate) {
        countSql += ` AND timestamp >= $${countParamIndex++}`;
        countParams.push(filters.fromDate);
      }

      if (filters?.toDate) {
        countSql += ` AND timestamp <= $${countParamIndex++}`;
        countParams.push(filters.toDate);
      }

      const countResult = await query<{ total: number }>(countSql, countParams);
      const total = countResult[0]?.total || 0;

      return { logs, total };
    } catch (error: any) {
      logger.error('Error getting liquidity history', error, { agentId });
      throw error;
    }
  }

  /**
   * Calculate agent commission
   */
  calculateCommission(amount: number, commissionRate: number): number {
    return (amount * commissionRate) / 100;
  }

  /**
   * Process agent settlement
   */
  async processSettlement(
    agentId: string,
    settlementPeriod: string, // e.g., "2026-01"
    options?: { notes?: string }
  ): Promise<AgentSettlement> {
    try {
      // Get all completed transactions for the period
      const startDate = `${settlementPeriod}-01`;
      const endDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + 1))
        .toISOString()
        .split('T')[0];

      const transactions = await this.getAgentTransactions(agentId, {
        status: 'completed',
        fromDate: startDate,
        toDate: endDate,
      });

      // Calculate total amount and commission
      const agent = await this.getAgent(agentId);
      if (!agent) {
        throw new Error('Agent not found');
      }

      const totalAmount = transactions.transactions.reduce(
        (sum, tx) => sum + parseFloat(tx.amount.toString()),
        0
      );
      const commission = this.calculateCommission(totalAmount, agent.commission_rate);

      // Create settlement record
      const settlementResult = await query<AgentSettlement>(
        `INSERT INTO agent_settlements (
          agent_id, settlement_period, total_amount, commission, settlement_status
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id, agent_id, settlement_period, total_amount, commission, settlement_status, settled_at, created_at`,
        [agentId, settlementPeriod, totalAmount, commission, 'pending']
      );

      return settlementResult[0];
    } catch (error: any) {
      logger.error('Error processing settlement', error, { agentId, settlementPeriod });
      throw error;
    }
  }
}

export const agentNetworkService = new AgentNetworkService();

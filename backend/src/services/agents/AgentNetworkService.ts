/**
 * Agent Network Service
 * 
 * Purpose: Business logic for agent network operations
 * Location: backend/src/services/agents/AgentNetworkService.ts
 */

import { sql } from '../../database/connection';
import { v4 as uuidv4 } from 'uuid';

interface NetworkStats {
  totalAgents: number;
  agentsByType: Record<string, number>;
  totalLiquidity: number;
  activeAgents: number;
  suspendedAgents: number;
  avgLiquidityByType: Record<string, number>;
}

interface AgentFloat {
  agentId: string;
  currentFloat: number;
  threshold: number;
  status: 'normal' | 'low' | 'critical';
  recentTransactions: any[];
}

interface AgentPerformance {
  agentId: string;
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  avgTransactionValue: number;
  avgProcessingTime: number;
  commissionEarned: number;
}

export class AgentNetworkService {
  /**
   * Get network-wide statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    const result = await sql`
      SELECT 
        COUNT(*) as total_agents,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_agents,
        SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_agents,
        SUM(liquidity_balance) as total_liquidity
      FROM agents
    `;

    const typeBreakdown = await sql`
      SELECT type, COUNT(*) as count, AVG(liquidity_balance) as avg_liquidity
      FROM agents
      WHERE status = 'active'
      GROUP BY type
    `;

    const stats: NetworkStats = {
      totalAgents: Number(result[0]?.total_agents || 0),
      agentsByType: {},
      totalLiquidity: Number(result[0]?.total_liquidity || 0),
      activeAgents: Number(result[0]?.active_agents || 0),
      suspendedAgents: Number(result[0]?.suspended_agents || 0),
      avgLiquidityByType: {},
    };

    for (const row of typeBreakdown) {
      stats.agentsByType[row.type] = Number(row.count);
      stats.avgLiquidityByType[row.type] = Number(row.avg_liquidity || 0);
    }

    return stats;
  }

  /**
   * Get agent float details
   */
  async getAgentFloat(agentId: string): Promise<AgentFloat | null> {
    const agent = await sql`
      SELECT id, liquidity_balance, min_liquidity_required 
      FROM agents WHERE id = ${agentId}
    `;

    if (agent.length === 0) {
      return null;
    }

    const agentData = agent[0];
    const currentFloat = Number(agentData.liquidity_balance);
    const threshold = Number(agentData.min_liquidity_required);
    
    let status: 'normal' | 'low' | 'critical' = 'normal';
    if (currentFloat < threshold * 0.5) {
      status = 'critical';
    } else if (currentFloat < threshold * 1.5) {
      status = 'low';
    }

    // Get recent float transactions
    const transactions = await sql`
      SELECT id, transaction_type, amount, balance_before, balance_after, created_at, notes
      FROM agent_float_transactions
      WHERE agent_id = ${agentId}
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return {
      agentId,
      currentFloat,
      threshold,
      status,
      recentTransactions: transactions,
    };
  }

  /**
   * Top up agent float
   */
  async topupFloat(
    agentId: string, 
    amount: number, 
    notes: string | undefined,
    processedBy: string | undefined
  ): Promise<any> {
    const agent = await sql`
      SELECT id, liquidity_balance FROM agents WHERE id = ${agentId}
    `;

    if (agent.length === 0) {
      throw new Error('Agent not found');
    }

    const currentBalance = Number(agent[0].liquidity_balance);
    const newBalance = currentBalance + amount;

    // Update agent balance
    await sql`
      UPDATE agents 
      SET liquidity_balance = ${newBalance}, updated_at = NOW()
      WHERE id = ${agentId}
    `;

    // Record transaction
    const txId = uuidv4();
    await sql`
      INSERT INTO agent_float_transactions (
        id, agent_id, transaction_type, amount, balance_before, balance_after, 
        notes, processed_by, created_at
      ) VALUES (
        ${txId}, ${agentId}, 'topup', ${amount}, ${currentBalance}, ${newBalance},
        ${notes || 'Float topup'}, ${processedBy || 'system'}, NOW()
      )
    `;

    return {
      transactionId: txId,
      agentId,
      amount,
      previousBalance: currentBalance,
      newBalance,
      status: 'success',
    };
  }

  /**
   * Withdraw from agent float
   */
  async withdrawFloat(
    agentId: string,
    amount: number,
    notes: string | undefined,
    approvedBy: string | undefined
  ): Promise<any> {
    const agent = await sql`
      SELECT id, liquidity_balance FROM agents WHERE id = ${agentId}
    `;

    if (agent.length === 0) {
      throw new Error('Agent not found');
    }

    const currentBalance = Number(agent[0].liquidity_balance);
    
    if (currentBalance < amount) {
      throw new Error('Insufficient float balance');
    }

    const newBalance = currentBalance - amount;

    // Update agent balance
    await sql`
      UPDATE agents 
      SET liquidity_balance = ${newBalance}, updated_at = NOW()
      WHERE id = ${agentId}
    `;

    // Record transaction
    const txId = uuidv4();
    await sql`
      INSERT INTO agent_float_transactions (
        id, agent_id, transaction_type, amount, balance_before, balance_after,
        notes, approved_by, created_at
      ) VALUES (
        ${txId}, ${agentId}, 'withdrawal', ${amount}, ${currentBalance}, ${newBalance},
        ${notes || 'Float withdrawal'}, ${approvedBy || 'system'}, NOW()
      )
    `;

    return {
      transactionId: txId,
      agentId,
      amount,
      previousBalance: currentBalance,
      newBalance,
      status: 'success',
    };
  }

  /**
   * Get agent transactions
   */
  async getAgentTransactions(agentId: string, days: number = 30): Promise<any[]> {
    const transactions = await sql`
      SELECT 
        id, transaction_date, transaction_count, successful_count, failed_count,
        total_cashout_amount, total_commission_earned, success_rate,
        vouchers_redeemed, unique_beneficiaries_served, created_at
      FROM agent_transactions
      WHERE agent_id = ${agentId}
        AND transaction_date >= NOW() - INTERVAL '30 days'
      ORDER BY transaction_date DESC
    `;

    return transactions;
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(agentId: string, days: number = 30): Promise<AgentPerformance | null> {
    const agent = await sql`SELECT id FROM agents WHERE id = ${agentId}`;
    if (agent.length === 0) {
      return null;
    }

    const performance = await sql`
      SELECT 
        SUM(transaction_count) as total_transactions,
        SUM(total_cashout_amount) as total_volume,
        AVG(success_rate) as avg_success_rate,
        AVG(avg_transaction_value) as avg_tx_value,
        SUM(total_commission_earned) as commission_earned
      FROM agent_transactions
      WHERE agent_id = ${agentId}
        AND transaction_date >= NOW() - INTERVAL '30 days'
    `;

    const data = performance[0];
    return {
      agentId,
      totalTransactions: Number(data?.total_transactions || 0),
      totalVolume: Number(data?.total_volume || 0),
      successRate: Number(data?.avg_success_rate || 0),
      avgTransactionValue: Number(data?.avg_tx_value || 0),
      avgProcessingTime: 0, // Would need separate tracking
      commissionEarned: Number(data?.commission_earned || 0),
    };
  }

  /**
   * Get performance rankings
   */
  async getPerformanceRankings(
    type: string | undefined, 
    metric: string = 'volume',
    limit: number = 20
  ): Promise<any[]> {
    let query = `
      SELECT 
        at.agent_id,
        a.name,
        a.type,
        a.location,
        SUM(at.transaction_count) as total_transactions,
        SUM(at.total_cashout_amount) as total_volume,
        AVG(at.success_rate) as avg_success_rate,
        SUM(at.total_commission_earned) as commission
      FROM agent_transactions at
      JOIN agents a ON at.agent_id = a.id
      WHERE at.transaction_date >= NOW() - INTERVAL '30 days'
    `;
    
    if (type) {
      query += ` AND a.type = '${type}'`;
    }
    
    query += `
      GROUP BY at.agent_id, a.name, a.type, a.location
      ORDER BY total_volume DESC
      LIMIT ${limit}
    `;

    const rankings = await sql(query);
    return rankings;
  }

  /**
   * Get low liquidity alerts
   */
  async getLowLiquidityAlerts(threshold: number = 1.5): Promise<any[]> {
    const alerts = await sql`
      SELECT 
        id, name, type, location, liquidity_balance, min_liquidity_required,
        CASE 
          WHEN liquidity_balance < min_liquidity_required * 0.5 THEN 'critical'
          WHEN liquidity_balance < min_liquidity_required * ${threshold} THEN 'low'
          ELSE 'normal'
        END as alert_status
      FROM agents
      WHERE status = 'active'
        AND liquidity_balance < min_liquidity_required * ${threshold}
      ORDER BY liquidity_balance ASC
    `;

    return alerts;
  }

  /**
   * Get agents by type
   */
  async getAgentsByType(type: string): Promise<any[]> {
    const agents = await sql`
      SELECT * FROM agents 
      WHERE type = ${type} AND status = 'active'
      ORDER BY name ASC
    `;

    return agents;
  }
}

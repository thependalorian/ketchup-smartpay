/**
 * Agent Service
 *
 * Purpose: Agent network management and statistics
 * Location: backend/src/services/agents/AgentService.ts
 *
 * Enhancements (PRD FR7): Churn prediction and incentive management can be added:
 * - Churn risk score from transaction/float patterns (e.g. declining volume, low liquidity)
 * - Incentive rules (commission tiers, bonuses for rural coverage, training completion)
 * - AgentCoveragePlanner for density; AgentLiquidityService for float/overdraft
 */
import { Agent } from '../../../../shared/types';
export declare class AgentService {
    /**
     * Get all agents with statistics
     */
    getAll(filters?: {
        region?: string;
        status?: string;
        type?: string;
    }): Promise<Agent[]>;
    /**
     * Get a single agent by id (for view-detail; used by mobile-units getById).
     */
    getById(id: string): Promise<Agent | null>;
    /**
     * Get agents with coordinates for map (NamibiaMap / mapAPI).
     * Returns rows with id, name, type, location (region), status, latitude, longitude.
     */
    getForMap(filters?: {
        region?: string;
        type?: string;
    }): Promise<Array<{
        id: string;
        name: string;
        type: string;
        region: string;
        status: string;
        latitude: number | null;
        longitude: number | null;
    }>>;
    /**
     * Get agent statistics summary (optionally filtered by type, e.g. mobile_unit)
     */
    getStats(type?: string | null): Promise<{
        total: number;
        active: number;
        inactive: number;
        lowLiquidity: number;
        down?: number;
        totalVolumeToday: number;
        avgSuccessRate: number;
    }>;
}
//# sourceMappingURL=AgentService.d.ts.map
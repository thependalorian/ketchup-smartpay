/**
 * Agent Network Service
 *
 * Purpose: Business logic for agent network operations
 * Location: backend/src/services/agents/AgentNetworkService.ts
 */
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
export declare class AgentNetworkService {
    /**
     * Get network-wide statistics
     */
    getNetworkStats(): Promise<NetworkStats>;
    /**
     * Get agent float details
     */
    getAgentFloat(agentId: string): Promise<AgentFloat | null>;
    /**
     * Top up agent float
     */
    topupFloat(agentId: string, amount: number, notes: string | undefined, processedBy: string | undefined): Promise<any>;
    /**
     * Withdraw from agent float
     */
    withdrawFloat(agentId: string, amount: number, notes: string | undefined, approvedBy: string | undefined): Promise<any>;
    /**
     * Get agent transactions
     */
    getAgentTransactions(agentId: string, days?: number): Promise<any[]>;
    /**
     * Get agent performance metrics
     */
    getAgentPerformance(agentId: string, days?: number): Promise<AgentPerformance | null>;
    /**
     * Get performance rankings
     */
    getPerformanceRankings(type: string | undefined, metric?: string, limit?: number): Promise<any[]>;
    /**
     * Get low liquidity alerts
     */
    getLowLiquidityAlerts(threshold?: number): Promise<any[]>;
    /**
     * Get agents by type
     */
    getAgentsByType(type: string): Promise<any[]>;
}
export {};
//# sourceMappingURL=AgentNetworkService.d.ts.map
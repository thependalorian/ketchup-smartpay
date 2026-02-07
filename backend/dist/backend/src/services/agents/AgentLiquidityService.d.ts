/**
 * Agent Liquidity Service – Float management, overdraft, liquidity alerts
 *
 * Location: backend/src/services/agents/AgentLiquidityService.ts
 * Purpose: PRD FR7.4; agent float, overdraft (approved), liquidity alerts (SASSA-style).
 */
export interface AgentFloatStatus {
    agentId: string;
    currentFloat: number;
    threshold: number;
    overdraftLimit: number;
    alert: 'ok' | 'low' | 'critical' | 'overdraft';
}
export declare class AgentLiquidityService {
    getFloatStatus(agentId: string): Promise<AgentFloatStatus | null>;
    requestTopUp(agentId: string, amount: number): Promise<{
        accepted: boolean;
        reason?: string;
    }>;
    sendLiquidityAlerts(): Promise<number>;
}
export declare const agentLiquidityService: AgentLiquidityService;
//# sourceMappingURL=AgentLiquidityService.d.ts.map
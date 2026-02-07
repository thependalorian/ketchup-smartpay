/**
 * Agent Coverage Planner – ML-based agent/merchant density and rural coverage planning
 *
 * Location: backend/src/services/agents/AgentCoveragePlanner.ts
 * Purpose: PRD FR7.9; rural coverage, density heatmaps (SASSA/UPI-style expansion).
 */
export interface CoverageRecommendation {
    region: string;
    recommendedAgents: number;
    currentAgents: number;
    beneficiaryCount: number;
    priority: 'high' | 'medium' | 'low';
    reason: string;
}
export declare class AgentCoveragePlanner {
    getCoverageRecommendations(): Promise<CoverageRecommendation[]>;
}
export declare const agentCoveragePlanner: AgentCoveragePlanner;
//# sourceMappingURL=AgentCoveragePlanner.d.ts.map
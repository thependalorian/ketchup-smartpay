/**
 * Agent Coverage Planner – ML-based agent/merchant density and rural coverage planning
 *
 * Location: backend/src/services/agents/AgentCoveragePlanner.ts
 * Purpose: PRD FR7.9; rural coverage, density heatmaps (SASSA/UPI-style expansion).
 */

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';

export interface CoverageRecommendation {
  region: string;
  recommendedAgents: number;
  currentAgents: number;
  beneficiaryCount: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export class AgentCoveragePlanner {
  async getCoverageRecommendations(): Promise<CoverageRecommendation[]> {
    try {
      const rows = await sql`
        SELECT region, COUNT(DISTINCT agent_id) as agent_count, SUM(beneficiary_count) as beneficiary_count
        FROM agent_coverage_by_region
        GROUP BY region
      `;
      const out: CoverageRecommendation[] = (rows as { region: string; agent_count: number; beneficiary_count: number }[]).map((r) => ({
        region: r.region,
        currentAgents: Number(r.agent_count),
        beneficiaryCount: Number(r.beneficiary_count),
        recommendedAgents: Math.max(0, Math.ceil(Number(r.beneficiary_count) / 500) - Number(r.agent_count)),
        priority: Number(r.beneficiary_count) > 1000 && Number(r.agent_count) < 2 ? 'high' : Number(r.agent_count) < 1 ? 'medium' : 'low',
        reason: Number(r.agent_count) < 1 ? 'No agent in region' : 'Below recommended ratio',
      }));
      log('Coverage recommendations', { count: out.length });
      return out;
    } catch (e) {
      logError('Get coverage recommendations failed', e);
      return [];
    }
  }
}

export const agentCoveragePlanner = new AgentCoveragePlanner();

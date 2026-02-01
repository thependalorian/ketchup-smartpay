/**
 * Impact Analytics Service – Social impact, financial inclusion, sustainability KPIs
 *
 * Location: backend/src/services/analytics/ImpactAnalyticsService.ts
 * Purpose: PRD Section 9; GTM impact dashboard (G2P 4.0 / SASSA-style).
 */

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';

export interface ImpactKPIs {
  financialInclusion: { unbankedServed: number; firstTimeWalletUsers: number; targetPercent: number };
  socialImpact: { beneficiariesReached: number; ruralPercent: number; femalePercent: number };
  sustainability: { cashHandlingCostSaved: number; carbonImpact: string };
  adoption: { digitalAdoptionRate: number; ussdAdoptionRate: number; nps: number };
}

export class ImpactAnalyticsService {
  async getImpactKPIs(period: { from: string; to: string }): Promise<ImpactKPIs> {
    try {
      const from = period.from;
      const to = period.to;
      const [users] = await sql`
        SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE first_wallet_at BETWEEN ${from} AND ${to}) as first_time
        FROM beneficiaries WHERE status = 'active'
      `;
      const u = users as { total: number; first_time: number };
      const [rural] = await sql`SELECT COUNT(*) as c FROM beneficiaries WHERE region_type = 'rural' AND status = 'active'`;
      const [female] = await sql`SELECT COUNT(*) as c FROM beneficiaries WHERE gender = 'female' AND status = 'active'`;
      log('Impact KPIs computed', { from, to });
      return {
        financialInclusion: {
          unbankedServed: Number(u.total) || 0,
          firstTimeWalletUsers: Number(u.first_time) || 0,
          targetPercent: 60,
        },
        socialImpact: {
          beneficiariesReached: Number(u.total) || 0,
          ruralPercent: Number(u.total) ? (Number((rural as { c: number }).c) / Number(u.total)) * 100 : 0,
          femalePercent: Number(u.total) ? (Number((female as { c: number }).c) / Number(u.total)) * 100 : 0,
        },
        sustainability: { cashHandlingCostSaved: 0, carbonImpact: 'N/A' },
        adoption: { digitalAdoptionRate: 0, ussdAdoptionRate: 0, nps: 0 },
      };
    } catch (e) {
      logError('Get impact KPIs failed', e);
      return {
        financialInclusion: { unbankedServed: 0, firstTimeWalletUsers: 0, targetPercent: 60 },
        socialImpact: { beneficiariesReached: 0, ruralPercent: 0, femalePercent: 0 },
        sustainability: { cashHandlingCostSaved: 0, carbonImpact: 'N/A' },
        adoption: { digitalAdoptionRate: 0, ussdAdoptionRate: 0, nps: 0 },
      };
    }
  }
}

export const impactAnalyticsService = new ImpactAnalyticsService();

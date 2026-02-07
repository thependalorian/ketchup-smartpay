/**
 * Impact Analytics Service – Social impact, financial inclusion, sustainability KPIs
 *
 * Location: backend/src/services/analytics/ImpactAnalyticsService.ts
 * Purpose: PRD Section 9; GTM impact dashboard (G2P 4.0 / SASSA-style).
 */
export interface ImpactKPIs {
    financialInclusion: {
        unbankedServed: number;
        firstTimeWalletUsers: number;
        targetPercent: number;
    };
    socialImpact: {
        beneficiariesReached: number;
        ruralPercent: number;
        femalePercent: number;
    };
    sustainability: {
        cashHandlingCostSaved: number;
        carbonImpact: string;
    };
    adoption: {
        digitalAdoptionRate: number;
        ussdAdoptionRate: number;
        nps: number;
    };
}
export declare class ImpactAnalyticsService {
    getImpactKPIs(period: {
        from: string;
        to: string;
    }): Promise<ImpactKPIs>;
}
export declare const impactAnalyticsService: ImpactAnalyticsService;
//# sourceMappingURL=ImpactAnalyticsService.d.ts.map
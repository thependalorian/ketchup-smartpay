/**
 * Incident Response Service
 *
 * Purpose: Handle cybersecurity incidents and reporting to Bank of Namibia
 * Regulation: PSD-12 Sections 11.13-11.15 - Response and Recovery
 * Location: backend/src/services/compliance/IncidentResponseService.ts
 *
 * Requirements:
 * - Report incidents to BoN within 24 hours (preliminary)
 * - Full impact assessment within 30 days
 * - Track financial loss, data loss, availability loss
 * - Recovery Time Objective (RTO): 2 hours maximum
 * - Recovery Point Objective (RPO): 5 minutes maximum
 *
 * PSD-12 Section 11.13: "All successful cyberattack incidents must be reported
 * to the Bank, at least within 24 hours for the preliminary notification of
 * the cyber incident."
 */
interface IncidentReport {
    incidentType: 'cyberattack' | 'fraud' | 'data_breach' | 'system_failure' | 'unauthorized_access' | 'privacy_breach';
    severity: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    affectedSystems?: string[];
    detectedBy?: string;
    /** For privacy_breach: affected beneficiary count, data types (e.g. PII), regulatory notification done */
    privacyBreachDetails?: {
        affectedCount?: number;
        dataTypes?: string[];
        notifiedBoN?: boolean;
    };
}
interface IncidentDetails {
    id: string;
    incidentType: string;
    severity: string;
    title: string;
    description: string;
    detectedAt: Date;
    status: string;
    reportedToBoN: boolean;
    preliminaryReportSent: boolean;
    impactAssessmentSent: boolean;
    financialLoss: number;
    dataLossRecords: number;
    availabilityLossMinutes: number;
    recoveryTimeMinutes: number | null;
}
interface ImpactAssessment {
    incidentId: string;
    financialLoss: number;
    dataLossRecords: number;
    availabilityLossMinutes: number;
    affectedUsersCount: number;
    rootCause: string;
    remediationActions: string;
    preventiveMeasures: string;
}
export declare class IncidentResponseService {
    private static readonly PRELIMINARY_REPORT_DEADLINE_HOURS;
    private static readonly IMPACT_ASSESSMENT_DEADLINE_DAYS;
    private static readonly RTO_MINUTES;
    private static readonly RPO_MINUTES;
    /**
     * Detect and log incident
     * PSD-12 Section 11.7: Investigate nature, extent, and damage
     */
    static detectIncident(report: IncidentReport): Promise<IncidentDetails>;
    /**
     * Send preliminary report to Bank of Namibia
     * PSD-12 Section 11.13: Within 24 hours
     */
    static sendPreliminaryReportToBoN(incidentId: string, reportData: any): Promise<void>;
    /**
     * Submit impact assessment
     * PSD-12 Section 11.14-11.15: Within 30 days, include financial/data/availability loss
     */
    static submitImpactAssessment(assessment: ImpactAssessment): Promise<void>;
    /**
     * Update incident status
     * PSD-12 Section 11.7-11.8: Contain and recover
     */
    static updateIncidentStatus(incidentId: string, status: 'detected' | 'investigating' | 'contained' | 'recovered' | 'closed', notes?: string): Promise<void>;
    /**
     * Get open incidents
     */
    static getOpenIncidents(): Promise<IncidentDetails[]>;
    /**
     * Get incidents pending BoN reporting
     * PSD-12 Section 11.13: Must report within 24 hours
     */
    static getIncidentsPendingBoNReport(): Promise<IncidentDetails[]>;
    /**
     * Get incident statistics
     */
    static getIncidentStatistics(startDate: Date, endDate: Date): Promise<{
        totalIncidents: number;
        criticalIncidents: number;
        averageRecoveryTimeMinutes: number;
        rtoViolations: number;
        totalFinancialLoss: number;
        totalDataLoss: number;
        totalAvailabilityLoss: number;
    }>;
    /**
     * Map database row to IncidentDetails
     */
    private static mapIncidentDetails;
}
export {};
//# sourceMappingURL=IncidentResponseService.d.ts.map
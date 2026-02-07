/**
 * PSD Compliance Shared Types
 *
 * Purpose: TypeScript types for regulatory compliance across frontend/backend
 * Regulations: PSD-1, PSD-3, PSD-12
 * Location: shared/types/compliance.ts
 */
// ============================================================================
// Regulatory Constants
// ============================================================================
export const PSD_CONSTANTS = {
    // PSD-3: E-Money Requirements
    INITIAL_CAPITAL_REQUIRED: 1_500_000, // N$1.5 million
    TRUST_ACCOUNT_COVERAGE_MIN: 100, // 100%
    DORMANCY_PERIOD_MONTHS: 6,
    DORMANCY_NOTIFICATION_MONTHS: 5,
    MONTHLY_REPORT_DEADLINE_DAY: 10,
    DEFICIENCY_RESOLUTION_DAYS: 1,
    // PSD-12: Cybersecurity
    UPTIME_SLA_PERCENTAGE: 99.9,
    ALLOWED_DOWNTIME_MINUTES_MONTH: 43.2,
    RECOVERY_TIME_OBJECTIVE_HOURS: 2,
    RECOVERY_POINT_OBJECTIVE_MINUTES: 5,
    INCIDENT_PRELIMINARY_REPORT_HOURS: 24,
    INCIDENT_IMPACT_ASSESSMENT_DAYS: 30,
    // PSD-1: PSP Licensing
    AGENT_ANNUAL_RETURN_MONTH: 1, // January
    AGENT_ANNUAL_RETURN_DAY: 31,
    SIGNIFICANT_CHANGE_NOTICE_DAYS: 30,
    COMPLAINT_RESOLUTION_DAYS: 15,
    // 2FA
    OTP_LENGTH: 6,
    OTP_EXPIRY_MINUTES: 5,
    OTP_MAX_ATTEMPTS: 3,
};
export const REGULATION_SECTIONS = {
    'PSD-1': {
        title: 'Payment Service Provider Licensing',
        effectiveDate: '2024-02-15',
        sections: {
            '10.3': 'Risk Management Requirements',
            '10.4': 'Consumer Protection Requirements',
            '16.15': 'Agent Annual Returns',
        },
    },
    'PSD-3': {
        title: 'Electronic Money Issuance',
        effectiveDate: '2019-11-28',
        sections: {
            '11.2': 'Safe Storage of Customer Funds',
            '11.2.4': 'Daily Reconciliation (100% Coverage)',
            '11.3': 'Interest on Pooled Funds',
            '11.4': 'Dormant Wallets',
            '11.5': 'Capital Requirements',
            '23': 'Reporting to Bank of Namibia',
        },
    },
    'PSD-12': {
        title: 'Operational and Cybersecurity Standards',
        effectiveDate: '2023-07-01',
        sections: {
            '11.13': 'Incident Reporting (24 hours)',
            '11.14': 'Impact Assessment (30 days)',
            '12.2': 'Two-Factor Authentication',
            '13.1': 'System Uptime (99.9%)',
        },
    },
};
//# sourceMappingURL=compliance.js.map
/**
 * PSD Compliance Shared Types
 * 
 * Purpose: TypeScript types for regulatory compliance across frontend/backend
 * Regulations: PSD-1, PSD-3, PSD-12
 * Location: shared/types/compliance.ts
 */

// ============================================================================
// PSD-3: Trust Account
// ============================================================================

export interface TrustAccountReconciliation {
  id: string;
  reconciliationDate: string;
  trustAccountBalance: number;
  outstandingEmoneyLiabilities: number;
  coveragePercentage: number;
  deficiencyAmount: number | null;
  interestEarned?: number;
  interestWithdrawn?: number;
  status: 'compliant' | 'deficient' | 'resolved';
  reconciledBy?: string;
  resolutionDate?: string;
  resolutionNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrustAccountStatus {
  isCompliant: boolean;
  coveragePercentage: number;
  deficiencyAmount: number | null;
  lastReconciliationDate: string | null;
}

// ============================================================================
// PSD-12: Two-Factor Authentication
// ============================================================================

export interface TwoFactorAuthLog {
  id: string;
  userId: string;
  userType: 'beneficiary' | 'agent' | 'admin';
  authMethod: 'sms_otp' | 'email_otp' | 'authenticator_app' | 'biometric';
  transactionType: 'payment' | 'withdrawal' | 'transfer' | 'voucher_redemption';
  transactionId: string | null;
  transactionAmount: number | null;
  authStatus: 'pending' | 'success' | 'failed' | 'expired' | 'blocked';
  otpSentAt: string;
  otpExpiresAt: string;
  otpAttempts: number;
  verifiedAt: string | null;
  failureReason: string | null;
  createdAt: string;
}

export interface OTPRequest {
  userId: string;
  userType: 'beneficiary' | 'agent' | 'admin';
  transactionType: 'payment' | 'withdrawal' | 'transfer' | 'voucher_redemption';
  transactionId?: string;
  transactionAmount?: number;
  method?: 'sms_otp' | 'email_otp';
}

export interface OTPValidation {
  userId: string;
  otpCode: string;
  transactionId: string;
}

export interface TwoFactorAuthResult {
  authId: string;
  success: boolean;
  message: string;
  expiresAt?: Date;
  attemptsRemaining?: number;
}

// ============================================================================
// PSD-12: System Uptime
// ============================================================================

export interface SystemUptimeLog {
  id: string;
  serviceName: string;
  checkTimestamp: string;
  status: 'up' | 'down' | 'degraded';
  responseTimeMs: number | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface SystemAvailabilitySummary {
  id: string;
  serviceName: string;
  summaryDate: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  availabilityPercentage: number;
  totalDowntimeMinutes: number;
  incidentsCount: number;
  meetsSLA: boolean;
  createdAt: string;
}

export interface UptimeStatus {
  services: Array<{
    name: string;
    status: string;
    availabilityPercentage: number;
    lastCheckTime: string;
  }>;
  overallCompliant: boolean;
}

// ============================================================================
// PSD-12: Cybersecurity Incidents
// ============================================================================

export interface CybersecurityIncident {
  id: string;
  incidentType: 'cyberattack' | 'fraud' | 'data_breach' | 'system_failure' | 'unauthorized_access';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedSystems: string[];
  detectedAt: string;
  detectedBy: string | null;
  reportedToBoNAt: string | null;
  preliminaryReportSent: boolean;
  preliminaryReportData: any;
  impactAssessmentSent: boolean;
  impactAssessmentData: any;
  financialLoss: number;
  dataLossRecords: number;
  availabilityLossMinutes: number;
  affectedUsersCount: number;
  status: 'detected' | 'investigating' | 'contained' | 'recovered' | 'closed';
  containmentTime: string | null;
  recoveryTime: string | null;
  recoveryTimeMinutes: number | null;
  rootCause: string | null;
  remediationActions: string | null;
  preventiveMeasures: string | null;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentReport {
  incidentType: 'cyberattack' | 'fraud' | 'data_breach' | 'system_failure' | 'unauthorized_access';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedSystems?: string[];
  detectedBy?: string;
}

export interface ImpactAssessment {
  incidentId: string;
  financialLoss: number;
  dataLossRecords: number;
  availabilityLossMinutes: number;
  affectedUsersCount: number;
  rootCause: string;
  remediationActions: string;
  preventiveMeasures: string;
}

// ============================================================================
// PSD-3: Dormant Wallets
// ============================================================================

export interface DormantWallet {
  id: string;
  beneficiaryId: string;
  walletBalance: number;
  lastTransactionDate: string;
  dormancyApproachingDate: string | null;
  dormancyDate: string | null;
  customerNotifiedDate: string | null;
  notificationSent: boolean;
  status: 'active' | 'approaching_dormancy' | 'dormant' | 'funds_returned' | 'funds_to_separate_account' | 'terminated';
  resolutionMethod: string | null;
  resolutionDate: string | null;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DormancyStatistics {
  totalDormantWallets: number;
  totalDormantBalance: number;
  approachingDormancy: number;
  fundsInSeparateAccount: number;
  fundsReturned: number;
}

// ============================================================================
// PSD-3: Capital Requirements
// ============================================================================

export interface CapitalRequirementsTracking {
  id: string;
  trackingDate: string;
  initialCapitalRequired: number;
  initialCapitalHeld: number;
  outstandingLiabilitiesAvg6mo: number;
  ongoingCapitalRequired: number;
  ongoingCapitalHeld: number;
  liquidAssets: LiquidAssets;
  liquidAssetsTotal: number;
  complianceStatus: 'compliant' | 'deficient' | 'waiver_granted';
  deficiencyAmount: number | null;
  waiverGranted: boolean;
  waiverExpiryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LiquidAssets {
  cash: number;
  governmentBonds: number;
  shortTermInstruments: number;
  otherApprovedAssets: number;
}

export interface CapitalComplianceStatus {
  isCompliant: boolean;
  initialCapitalCompliant: boolean;
  ongoingCapitalCompliant: boolean;
  deficiencyAmount: number | null;
  lastCheckDate: string | null;
}

// ============================================================================
// PSD-3 & PSD-1: Bank of Namibia Reporting
// ============================================================================

export interface BankOfNamibiaMonthlyReport {
  id: string;
  reportMonth: string;
  reportType: 'psp_returns' | 'emoney_statistics' | 'agent_return';
  totalRegisteredUsers: number;
  totalActiveWallets: number;
  totalDormantWallets: number;
  outstandingEmoneyLiabilities: number;
  trustAccountBalance: number;
  trustAccountInterest: number;
  totalTransactionsVolume: number;
  totalTransactionsValue: number;
  cashInVolume: number;
  cashInValue: number;
  cashOutVolume: number;
  cashOutValue: number;
  p2pVolume: number;
  p2pValue: number;
  capitalHeld: number;
  capitalRequirement: number;
  reportData: any;
  generatedBy: string | null;
  generatedAt: string;
  submittedToBoN: boolean;
  submittedAt: string | null;
  submittedBy: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAnnualReturn {
  id: string;
  returnYear: number;
  agentNumber: number;
  agentId: string;
  agentName: string;
  locationCity: string;
  locationRegion: string;
  servicesOffered: string[];
  status: 'active' | 'inactive';
  poolAccountBalance: number;
  transactionVolume: number;
  transactionValue: number;
  submittedToBoN: boolean;
  submittedAt: string | null;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// E-Wallet Types
// ============================================================================

export interface EWalletBalance {
  id: string;
  beneficiaryId: string;
  currentBalance: number;
  availableBalance: number;
  pendingBalance: number;
  walletStatus: 'active' | 'dormant' | 'suspended' | 'closed';
  lastTransactionDate: string | null;
  dailyTransactionLimit: number | null;
  monthlyTransactionLimit: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EWalletTransaction {
  id: string;
  transactionRef: string;
  fromBeneficiaryId: string | null;
  toBeneficiaryId: string | null;
  agentId: string | null;
  transactionType: 'cash_in' | 'cash_out' | 'p2p_transfer' | 'voucher_redemption' | 'payment' | 'reversal';
  amount: number;
  fee: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
  requires2fa: boolean;
  twoFactorAuthId: string | null;
  initiatedAt: string;
  completedAt: string | null;
  metadata: any;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Compliance Dashboard
// ============================================================================

export interface ComplianceDashboard {
  overallComplianceScore: number;
  overallStatus: 'FULLY COMPLIANT' | 'ACTION REQUIRED' | 'NON-COMPLIANT';
  trustAccount: {
    compliant: boolean;
    coveragePercentage: number;
    deficiency: number | null;
    lastCheck: string | null;
    regulation: string;
  };
  capital: {
    compliant: boolean;
    initialCapitalCompliant: boolean;
    ongoingCapitalCompliant: boolean;
    deficiency: number | null;
    lastCheck: string | null;
    regulation: string;
  };
  dormantWallets: {
    total: number;
    balance: number;
    approaching: number;
    regulation: string;
  };
  systemUptime: {
    compliant: boolean;
    services: Array<{
      name: string;
      status: string;
      availabilityPercentage: number;
      lastCheckTime: string;
    }>;
    regulation: string;
    requirement: string;
  };
  incidents: {
    open: number;
    critical: number;
    awaitingBoNReport: number;
    regulation: string;
  };
  reporting: {
    pendingReports: number;
    overdueReports: number;
    regulation: string;
  };
}

// ============================================================================
// Audit Trail
// ============================================================================

export interface ComplianceAuditTrail {
  id: string;
  auditType: string;
  regulation: 'PSD-1' | 'PSD-3' | 'PSD-12' | 'Open Banking';
  section: string | null;
  actionTaken: string;
  performedBy: string;
  timestamp: string;
  beforeState: any;
  afterState: any;
  result: 'compliant' | 'non_compliant' | 'resolved' | 'escalated' | 'in_progress';
  notes: string | null;
  createdAt: string;
}

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

/**
 * Impact Assessment Framework
 * 
 * Location: utils/impactAssessment.ts
 * Purpose: Structured impact assessment for security incidents (PSD-12 §11.14-15)
 * 
 * PSD-12 Requirements:
 * - §11.14: Impact assessment within 1 month
 * - §11.15: Report financial loss, data loss, availability loss
 */

export interface ImpactAssessment {
  // Financial Impact (PSD-12 §11.15)
  financialLoss: {
    amount: number;
    currency: string;
    description: string;
    breakdown?: {
      directLosses?: number;
      indirectLosses?: number;
      recoveryCosts?: number;
      regulatoryFines?: number;
    };
  };

  // Data Loss Impact (PSD-12 §11.15)
  dataLoss: {
    recordsAffected: number;
    dataTypes: string[];
    sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    customerDataAffected?: boolean;
    paymentDataAffected?: boolean;
    biometricDataAffected?: boolean;
  };

  // Availability Loss Impact (PSD-12 §11.15)
  availabilityLoss: {
    impactDurationHours: number;
    systemsAffected: string[];
    servicesDisrupted: string[];
    customerImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
    description: string;
    peakHoursAffected?: boolean;
  };

  // Customer Impact
  customersAffected: {
    total: number;
    activeUsers: number;
    affectedRegions?: string[];
    description: string;
  };

  // Root Cause Analysis
  rootCause: {
    primaryCause: string;
    contributingFactors: string[];
    technicalDetails?: string;
    humanFactors?: string;
    systemFactors?: string;
  };

  // Remediation
  remediation: {
    immediateActions: string[];
    shortTermActions: string[];
    longTermActions: string[];
    preventiveMeasures: string[];
    estimatedCompletionDate?: string;
  };

  // Business Impact
  businessImpact: {
    reputationRisk: 'low' | 'medium' | 'high';
    operationalDisruption: 'low' | 'medium' | 'high';
    regulatoryRisk: 'low' | 'medium' | 'high';
    financialRisk: 'low' | 'medium' | 'high';
    description: string;
  };
}

/**
 * Calculate overall severity based on impact assessment
 */
export function calculateSeverity(assessment: ImpactAssessment): 'low' | 'medium' | 'high' | 'critical' {
  let score = 0;

  // Financial loss scoring
  if (assessment.financialLoss.amount > 1000000) score += 4; // > N$1M = critical
  else if (assessment.financialLoss.amount > 100000) score += 3; // > N$100K = high
  else if (assessment.financialLoss.amount > 10000) score += 2; // > N$10K = medium
  else if (assessment.financialLoss.amount > 0) score += 1; // Any loss = low

  // Data loss scoring
  if (assessment.dataLoss.sensitivityLevel === 'critical') score += 4;
  else if (assessment.dataLoss.sensitivityLevel === 'high') score += 3;
  else if (assessment.dataLoss.sensitivityLevel === 'medium') score += 2;
  else if (assessment.dataLoss.sensitivityLevel === 'low') score += 1;

  if (assessment.dataLoss.recordsAffected > 100000) score += 2;
  else if (assessment.dataLoss.recordsAffected > 10000) score += 1;

  // Availability loss scoring
  if (assessment.availabilityLoss.customerImpact === 'critical') score += 4;
  else if (assessment.availabilityLoss.customerImpact === 'high') score += 3;
  else if (assessment.availabilityLoss.customerImpact === 'medium') score += 2;
  else if (assessment.availabilityLoss.customerImpact === 'low') score += 1;

  if (assessment.availabilityLoss.impactDurationHours > 24) score += 2;
  else if (assessment.availabilityLoss.impactDurationHours > 4) score += 1;

  // Customer impact scoring
  if (assessment.customersAffected.total > 100000) score += 3;
  else if (assessment.customersAffected.total > 10000) score += 2;
  else if (assessment.customersAffected.total > 1000) score += 1;

  // Determine severity
  if (score >= 12) return 'critical';
  if (score >= 8) return 'high';
  if (score >= 4) return 'medium';
  return 'low';
}

/**
 * Validate impact assessment completeness
 */
export function validateImpactAssessment(assessment: Partial<ImpactAssessment>): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];

  if (!assessment.financialLoss?.amount) missing.push('financialLoss.amount');
  if (!assessment.dataLoss?.recordsAffected) missing.push('dataLoss.recordsAffected');
  if (!assessment.dataLoss?.sensitivityLevel) missing.push('dataLoss.sensitivityLevel');
  if (!assessment.availabilityLoss?.impactDurationHours) missing.push('availabilityLoss.impactDurationHours');
  if (!assessment.availabilityLoss?.customerImpact) missing.push('availabilityLoss.customerImpact');
  if (!assessment.customersAffected?.total) missing.push('customersAffected.total');
  if (!assessment.rootCause?.primaryCause) missing.push('rootCause.primaryCause');
  if (!assessment.remediation?.immediateActions?.length) missing.push('remediation.immediateActions');

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Generate impact assessment summary for reporting
 */
export function generateImpactSummary(assessment: ImpactAssessment): string {
  const severity = calculateSeverity(assessment);
  
  return `IMPACT ASSESSMENT SUMMARY

Severity: ${severity.toUpperCase()}

Financial Loss: N$ ${assessment.financialLoss.amount.toFixed(2)} ${assessment.financialLoss.currency}
Data Records Affected: ${assessment.dataLoss.recordsAffected}
Data Sensitivity: ${assessment.dataLoss.sensitivityLevel.toUpperCase()}
Availability Impact: ${assessment.availabilityLoss.impactDurationHours} hours
Customer Impact: ${assessment.availabilityLoss.customerImpact.toUpperCase()}
Customers Affected: ${assessment.customersAffected.total}

Root Cause: ${assessment.rootCause.primaryCause}

Immediate Actions:
${assessment.remediation.immediateActions.map((action, i) => `${i + 1}. ${action}`).join('\n')}
`;
}

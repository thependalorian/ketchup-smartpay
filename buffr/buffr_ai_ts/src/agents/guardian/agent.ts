/**
 * Guardian Agent - Fraud Detection & Credit Scoring
 * 
 * Specialized agent for security and risk assessment
 */

import {
  GuardianDependencies,
  FraudFeatures,
  FraudPrediction,
  CreditFeatures,
  CreditScore,
  GuardianResponse,
  InvestigationResult,
} from '../../types/index.js';
import { chatCompletion } from '../../utils/providers.js';
import { GUARDIAN_SYSTEM_PROMPT, FRAUD_CHECK_PROMPT, CREDIT_ASSESSMENT_PROMPT, INVESTIGATION_PROMPT } from './prompts.js';

// ==================== Feature Extraction ====================

/**
 * Extract fraud detection features from transaction data
 */
export function extractFraudFeatures(transactionData: Record<string, any>): FraudFeatures {
  const timestamp = transactionData.timestamp 
    ? new Date(transactionData.timestamp) 
    : new Date();
  
  const hour = timestamp.getHours();
  const dayOfWeek = timestamp.getDay();
  const amount = parseFloat(transactionData.amount) || 0;
  const userAvgAmount = parseFloat(transactionData.userAvgAmount) || amount;

  return {
    // Transaction features
    amountNormalized: amount / 10000, // Normalize to [0, 1] assuming max 10k NAD
    amountLog: Math.log(amount + 1),
    amountDeviationFromAvg: (amount - userAvgAmount) / Math.max(userAvgAmount, 1),

    // Time features (cyclical encoding)
    hourSin: Math.sin(2 * Math.PI * hour / 24),
    hourCos: Math.cos(2 * Math.PI * hour / 24),
    dayOfWeek,
    isWeekend: dayOfWeek >= 5 ? 1 : 0,
    isUnusualHour: (hour >= 23 || hour <= 6) ? 1 : 0,

    // Merchant features
    merchantCategoryEncoded: transactionData.merchantCategoryCode || 0,
    merchantFraudRate: transactionData.merchantFraudRate || 0.01,

    // Location features
    distanceFromHomeKm: transactionData.distanceFromHome || 0,
    isForeignTransaction: transactionData.isForeign ? 1 : 0,

    // User behavior
    transactionsLastHour: transactionData.transactionsLastHour || 0,
    transactionsLastDay: transactionData.transactionsLastDay || 1,
    velocityScore: transactionData.velocityScore || 0,

    // Device & verification
    deviceFingerprintMatch: transactionData.deviceMatch ? 1 : 0,
    cardNotPresent: transactionData.cardPresent ? 0 : 1,

    // Additional
    roundNumberFlag: amount % 100 === 0 ? 1 : 0,
    beneficiaryAccountAgeDays: transactionData.beneficiaryAccountAge || 365,
    userKycLevel: transactionData.kycLevel || 0,
  };
}

/**
 * Extract credit scoring features from user data
 */
export function extractCreditFeatures(userData: Record<string, any>): CreditFeatures {
  return {
    monthlyIncome: parseFloat(userData.monthlyIncome) || 0,
    employmentYears: parseFloat(userData.employmentYears) || 0,
    employmentType: userData.employmentType || 'unknown',
    accountAge: parseInt(userData.accountAge) || 0,
    averageBalance: parseFloat(userData.averageBalance) || 0,
    savingsRate: parseFloat(userData.savingsRate) || 0,
    monthlyTransactions: parseInt(userData.monthlyTransactions) || 0,
    regularPayments: parseInt(userData.regularPayments) || 0,
    latePayments: parseInt(userData.latePayments) || 0,
    existingLoans: parseInt(userData.existingLoans) || 0,
    debtToIncomeRatio: parseFloat(userData.debtToIncomeRatio) || 0,
    kycLevel: parseInt(userData.kycLevel) || 0,
    isVerified: userData.isVerified || false,
  };
}

// ==================== Rule-Based ML Models ====================

/**
 * Simple rule-based fraud detection (placeholder for ML model)
 */
export async function detectFraud(features: FraudFeatures): Promise<FraudPrediction> {
  let riskScore = 0;
  const factors: string[] = [];

  // Amount-based risk
  if (features.amountNormalized > 0.5) {
    riskScore += 0.15;
    factors.push('Large transaction amount');
  }
  if (features.amountDeviationFromAvg > 3) {
    riskScore += 0.2;
    factors.push('Amount significantly above average');
  }

  // Time-based risk
  if (features.isUnusualHour) {
    riskScore += 0.1;
    factors.push('Transaction during unusual hours');
  }

  // Velocity risk
  if (features.transactionsLastHour > 5) {
    riskScore += 0.2;
    factors.push('High transaction velocity');
  }

  // Device risk
  if (!features.deviceFingerprintMatch) {
    riskScore += 0.15;
    factors.push('Device fingerprint mismatch');
  }

  // Card-not-present risk
  if (features.cardNotPresent) {
    riskScore += 0.05;
    factors.push('Card-not-present transaction');
  }

  // Foreign transaction risk
  if (features.isForeignTransaction) {
    riskScore += 0.1;
    factors.push('Foreign transaction');
  }

  // KYC level
  if (features.userKycLevel < 2) {
    riskScore += 0.1;
    factors.push('Incomplete KYC verification');
  }

  // Merchant risk
  if (features.merchantFraudRate > 0.05) {
    riskScore += 0.1;
    factors.push('High-risk merchant');
  }

  // Normalize score
  const fraudProbability = Math.min(riskScore, 1);
  const isFraud = fraudProbability > 0.5;
  const confidence = isFraud ? fraudProbability : 1 - fraudProbability;

  return {
    fraudProbability,
    isFraud,
    confidence,
    modelScores: {
      logisticRegression: fraudProbability * 0.9,
      neuralNetwork: fraudProbability * 1.1,
      randomForest: fraudProbability,
      gmmAnomaly: riskScore > 0.7 ? 0.8 : 0.2,
    },
    explanation: factors.length > 0 
      ? `Risk factors: ${factors.join(', ')}` 
      : 'No significant risk factors detected',
  };
}

/**
 * Simple rule-based credit scoring (placeholder for ML model)
 */
export async function scoreCredit(features: CreditFeatures): Promise<CreditScore> {
  let score = 550; // Base score
  const factors: string[] = [];
  const recommendations: string[] = [];

  // Income-based scoring
  if (features.monthlyIncome > 20000) {
    score += 50;
    factors.push('Strong income level');
  } else if (features.monthlyIncome > 10000) {
    score += 30;
    factors.push('Adequate income level');
  } else {
    recommendations.push('Increase income or provide additional income proof');
  }

  // Employment stability
  if (features.employmentYears >= 5) {
    score += 60;
    factors.push('Excellent employment stability');
  } else if (features.employmentYears >= 2) {
    score += 40;
    factors.push('Good employment stability');
  } else {
    score -= 20;
    recommendations.push('Build longer employment history');
  }

  // Account age
  if (features.accountAge >= 24) {
    score += 40;
    factors.push('Long-standing account');
  } else if (features.accountAge >= 12) {
    score += 20;
  }

  // Savings behavior
  if (features.savingsRate >= 20) {
    score += 50;
    factors.push('Strong savings habit');
  } else if (features.savingsRate >= 10) {
    score += 25;
  } else {
    recommendations.push('Improve savings rate to at least 10%');
  }

  // Payment history
  if (features.latePayments === 0) {
    score += 40;
    factors.push('Perfect payment history');
  } else if (features.latePayments <= 2) {
    score += 20;
  } else {
    score -= features.latePayments * 15;
    recommendations.push('Avoid late payments');
  }

  // Debt-to-income ratio
  if (features.debtToIncomeRatio < 30) {
    score += 30;
    factors.push('Healthy debt-to-income ratio');
  } else if (features.debtToIncomeRatio > 50) {
    score -= 50;
    recommendations.push('Reduce existing debt');
  }

  // KYC verification
  if (features.isVerified) {
    score += 20;
    factors.push('Fully verified identity');
  } else {
    recommendations.push('Complete KYC verification');
  }

  // Normalize score to 300-850 range
  score = Math.max(300, Math.min(850, score));

  // Determine rating
  let rating: CreditScore['rating'];
  if (score >= 750) rating = 'excellent';
  else if (score >= 700) rating = 'good';
  else if (score >= 650) rating = 'fair';
  else if (score >= 550) rating = 'poor';
  else rating = 'very_poor';

  // Calculate max loan and interest rate
  const maxLoanMultiplier = score >= 750 ? 5 : score >= 700 ? 4 : score >= 650 ? 3 : score >= 550 ? 2 : 1;
  const maxLoanAmount = features.monthlyIncome * maxLoanMultiplier;
  
  const baseRate = 15; // 15% base rate
  const rateAdjustment = (750 - score) / 50; // Higher score = lower rate
  const interestRate = Math.max(10, Math.min(30, baseRate + rateAdjustment));

  return {
    score,
    rating,
    maxLoanAmount,
    interestRate,
    factors,
    recommendations,
  };
}

// ==================== Guardian Agent Functions ====================

/**
 * Run fraud check with AI reasoning
 */
export async function checkFraud(
  transactionData: Record<string, any>,
  deps?: GuardianDependencies
): Promise<GuardianResponse> {
  // Extract features and run ML model
  const features = extractFraudFeatures(transactionData);
  const prediction = await detectFraud(features);

  // Get AI reasoning
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: GUARDIAN_SYSTEM_PROMPT },
    { role: 'user', content: FRAUD_CHECK_PROMPT(transactionData) },
  ];

  const aiReasoning = await chatCompletion(messages);

  return {
    type: 'fraud_check',
    result: prediction,
    reasoning: aiReasoning,
    recommendations: prediction.isFraud 
      ? ['Block transaction', 'Notify user', 'Flag for review']
      : ['Transaction approved', 'Continue monitoring'],
    metadata: {
      features,
      sessionId: deps?.sessionId,
    },
  };
}

/**
 * Run credit assessment with AI reasoning
 */
export async function assessCredit(
  userData: Record<string, any>,
  deps?: GuardianDependencies
): Promise<GuardianResponse> {
  // Extract features and run ML model
  const features = extractCreditFeatures(userData);
  const creditScore = await scoreCredit(features);

  // Get AI reasoning
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: GUARDIAN_SYSTEM_PROMPT },
    { role: 'user', content: CREDIT_ASSESSMENT_PROMPT(userData) },
  ];

  const aiReasoning = await chatCompletion(messages);

  return {
    type: 'credit_assessment',
    result: creditScore,
    reasoning: aiReasoning,
    recommendations: creditScore.recommendations,
    metadata: {
      features,
      sessionId: deps?.sessionId,
    },
  };
}

/**
 * Investigate security alert
 */
export async function investigateAlert(
  alertData: Record<string, any>,
  deps?: GuardianDependencies
): Promise<GuardianResponse> {
  // Get AI investigation
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: GUARDIAN_SYSTEM_PROMPT },
    { role: 'user', content: INVESTIGATION_PROMPT(alertData) },
  ];

  const aiReasoning = await chatCompletion(messages);

  // Parse severity
  const severity = alertData.severity || 'medium';
  const riskScore = severity === 'critical' ? 0.95 : 
                    severity === 'high' ? 0.8 :
                    severity === 'medium' ? 0.5 : 0.3;

  const investigation: InvestigationResult = {
    alertId: alertData.id || 'unknown',
    severity: severity as InvestigationResult['severity'],
    findings: [aiReasoning],
    riskScore,
    recommendations: [
      'Review user activity',
      'Update security rules',
      'Monitor for similar patterns',
    ],
  };

  return {
    type: 'investigation',
    result: investigation,
    reasoning: aiReasoning,
    recommendations: investigation.recommendations,
    metadata: {
      alertData,
      sessionId: deps?.sessionId,
    },
  };
}

/**
 * Chat with Guardian agent
 */
export async function guardianChat(
  message: string,
  deps?: GuardianDependencies
): Promise<string> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: GUARDIAN_SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];

  return chatCompletion(messages);
}

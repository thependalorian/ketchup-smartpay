/**
 * Compliance Utilities
 * 
 * Location: utils/compliance.ts
 * Purpose: Utility functions for regulatory compliance
 * 
 * Regulatory Requirements:
 * - PSD-1: Payment Service Provider requirements
 * - PSD-3: Electronic Money requirements
 * - PSD-12: Cybersecurity requirements
 */

/**
 * Check if wallet is dormant (PSD-3 Section 11.4.1)
 * A wallet is considered dormant if it has no transactions for 6 consecutive months
 */
export function isWalletDormant(lastTransactionDate: Date | null): boolean {
  if (!lastTransactionDate) return false;
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return lastTransactionDate < sixMonthsAgo;
}

/**
 * Get days until wallet becomes dormant
 */
export function getDaysUntilDormancy(lastTransactionDate: Date | null): number | null {
  if (!lastTransactionDate) return null;
  
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const daysUntil = Math.ceil(
    (sixMonthsAgo.getTime() - lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysUntil > 0 ? daysUntil : null;
}

/**
 * Check if complaint is within 90-day window (PSD-1 Section 16.8)
 */
export function isComplaintWithinWindow(incidentDate: Date): boolean {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  return incidentDate >= ninetyDaysAgo;
}

/**
 * Calculate days remaining to file complaint
 */
export function getDaysRemainingForComplaint(incidentDate: Date): number {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const daysRemaining = Math.ceil(
    (ninetyDaysAgo.getTime() - incidentDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return Math.max(0, daysRemaining);
}

/**
 * Format currency for display (PSD-3 Section 11.1.1 - N$ denomination)
 */
export function formatCurrency(amount: number, currency: string = 'N$'): string {
  return `${currency} ${amount.toFixed(2)}`;
}

/**
 * Check if transaction amount exceeds limits (PSD-3 Section 11.1.5)
 * Limits are set by Financial Intelligence Centre
 */
export function checkTransactionLimits(
  amount: number,
  transactionType: 'daily' | 'monthly' | 'single'
): { allowed: boolean; limit: number; remaining: number } {
  // Mock limits - in production, these should come from FIC regulations
  const limits = {
    daily: 50000, // N$50,000 daily limit
    monthly: 200000, // N$200,000 monthly limit
    single: 10000, // N$10,000 single transaction limit
  };
  
  const limit = limits[transactionType];
  const allowed = amount <= limit;
  const remaining = Math.max(0, limit - amount);
  
  return { allowed, limit, remaining };
}

/**
 * Validate payment settlement time (PSD-1 Section 11.1.4)
 * Payment settlement must be within 24 hours during business days
 */
export function isWithinSettlementWindow(transactionDate: Date): boolean {
  const now = new Date();
  const hoursDiff = (now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60);
  
  // Check if it's a business day (Monday-Friday)
  const dayOfWeek = now.getDay();
  const isBusinessDay = dayOfWeek >= 1 && dayOfWeek <= 5;
  
  return isBusinessDay && hoursDiff <= 24;
}

/**
 * Generate complaint reference number (PSD-1 Section 16.9)
 */
export function generateComplaintReference(): string {
  const timestamp = Date.now().toString().slice(-8);
  return `COMP-${timestamp}`;
}

/**
 * Check if 2FA is required (PSD-12 Section 12.2)
 * 2FA is required for every payment transaction
 */
export function is2FARequired(transactionType: 'payment' | 'transfer' | 'other'): boolean {
  return transactionType === 'payment' || transactionType === 'transfer';
}

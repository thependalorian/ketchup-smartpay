/**
 * Shared Types for Ketchup SmartPay
 *
 * Location: shared/types/index.ts
 * Purpose: Common TypeScript types shared between frontend and backend
 */
// Namibian regions for realistic data
export const NAMIBIAN_REGIONS = [
    'Khomas', 'Erongo', 'Oshana', 'Omusati', 'Ohangwena', 'Oshikoto',
    'Kavango East', 'Kavango West', 'Zambezi', 'Kunene', 'Otjozondjupa',
    'Omaheke', 'Hardap', 'Karas'
];
/** Allowed grant types for voucher issuance */
export const VOUCHER_GRANT_TYPES = ['social_grant', 'subsidy', 'pension', 'disability'];
// ============================================================================
// BARREL EXPORTS
// ============================================================================
// Re-export from entities.ts for convenience
export * from './entities';
export * from './compliance';
export * from './openBanking';
//# sourceMappingURL=index.js.map
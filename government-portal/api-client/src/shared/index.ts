/**
 * Shared API Methods
 *
 * Re-export APIs used by both Ketchup and Government portals.
 * openBankingAPI.ts exports individual functions/types, not a single object.
 */

export { dashboardAPI } from '../ketchup/dashboardAPI';
export * from '../ketchup/openBankingAPI';

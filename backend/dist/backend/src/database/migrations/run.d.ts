/**
 * Database Migration Runner
 *
 * Location: backend/src/database/migrations/run.ts
 * Purpose: Run database migrations in a single order for shared DB (Buffr / G2P / Ketchup SmartPay same backend).
 *
 * Order: 1) beneficiaries, vouchers (001) → 2) status_events → 3) webhook_events → 4) reconciliation_records → 5) agents (008).
 * Buffr/G2P use the same DB; run this once (e.g. from ketchup-smartpay backend) then run seed.
 */
declare function runMigrations(): Promise<void>;
export { runMigrations };
//# sourceMappingURL=run.d.ts.map
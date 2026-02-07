# Migration order (Buffr, G2P, Ketchup SmartPay — same backend, same DB)

Buffr and G2P are the same app; they share one backend and one database with Ketchup SmartPay. Use this order so the shared DB is consistent and seed works.

---

## 1. Single migration entry point (recommended)

From **ketchup-smartpay/backend** run:

```bash
cd ketchup-smartpay/backend
pnpm run migrate
pnpm run seed
```

`pnpm run migrate` runs `src/database/migrations/run.ts`, which creates (in order):

1. **beneficiaries** (from 001; includes `id_number`, proxy_*, `deceased_at`)
2. **beneficiary_dependants** (dependants per beneficiary: id, beneficiary_id, name, id_number, phone, relationship, date_of_birth, is_proxy)
3. **vouchers** (from 001, FK to beneficiaries)
4. **status_events** (voucher status history; seed uses `from_status`, `to_status`, `triggered_by`)
5. **webhook_events**
6. **reconciliation_records**
7. **agents** (008; same shape as Buffr’s `migration_agent_network.sql`, no FK to `wallets` so backend can run standalone)
8. **locations** (009; NamPost offices, ATMs, warehouses; no banks)
9. **communication_log** (011; outbound SMS, USSD, Buffr in-app, email for alerts/notifications)

Then `pnpm run seed` seeds beneficiaries, 300 cash-out agents (pos_agent/mobile_agent), **30 mobile units** (type `mobile_unit`, 29 active / 1 down), locations, vouchers, status_events (see `scripts/seed.ts`).

**NamibiaMap (ketchup-portal):** The map uses **agents** as map locations. No separate `map_locations` table or migration. Backend route `GET /api/v1/map/locations` returns agents (with `latitude`, `longitude`, `location` → region) as MapLocation[]. Seed data (9 agents across Namibia towns) is what the map displays after migrate + seed.

**Requires:** `DATABASE_URL` in `backend/.env.local`.

---

## 2. If you also run Buffr migrations

If you use **Buffr’s** SQL migrations (e.g. `buffr/sql/migration_agent_network.sql`, `migration_vouchers.sql`, etc.) on the same DB:

- Run **Ketchup SmartPay migrations first** (above), then run Buffr migrations.
- Buffr uses `CREATE TABLE IF NOT EXISTS`, so existing tables (e.g. `agents`, `beneficiaries`, `vouchers`) are left as-is; Buffr can add extra tables (e.g. `agent_liquidity_logs`, `wallets`) and later add an FK from `agents.wallet_id` to `wallets(id)` in a separate migration if needed.

Do **not** run 001–007 SQL files in ketchup-smartpay by hand; `run.ts` already applies the needed 001 and 008 logic inline. The numbered `.sql` files (001–008) are for reference and other tooling.

---

## 3. G2P

G2P uses the same backend and DB as Buffr. No separate migration step; ensure the shared DB has been migrated (and optionally seeded) as in step 1 (and optionally step 2).

---

## 4. Summary

| Step | Where | Command / action |
|------|--------|-------------------|
| 1 | ketchup-smartpay/backend | `pnpm run migrate` (creates beneficiaries, beneficiary_dependants, vouchers, status_events, webhook_events, reconciliation_records, agents, locations, communication_log) |
| 2 | ketchup-smartpay/backend | `pnpm run seed` (agents, beneficiaries, status_events) |
| 3 (optional) | buffr | Run Buffr SQL migrations if you need Buffr-specific tables (wallets, agent_liquidity_logs, etc.) |

Same backend, same DB: Buffr and G2P point at this DB and at the Ketchup SmartPay backend (`KETCHUP_SMARTPAY_API_URL`).

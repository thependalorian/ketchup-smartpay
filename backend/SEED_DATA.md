# Seed Data Summary

## Current state (from API / DB)

| Source | What exists | Sufficient? |
|--------|-------------|------------|
| **Migrations** | Schema only. `006`/`007` add one audit row each to `compliance_audit_trail`. No seed for beneficiaries, vouchers, or agents. | No |
| **beneficiaries** | Table exists (from `001` or Buffr). Dashboard metrics show **3** rows. `GET /api/v1/beneficiaries` returns **[]** because `BeneficiaryRepository` is stubbed (see `BeneficiaryRepository.ts`). | Partial (counts only) |
| **vouchers** | Table exists. **2** vouchers (e.g. IDs ending `481f`, `70d9`). Total disbursement N$700. | Minimal |
| **agents** | Table may not exist. Dashboard/agents APIs return **0** agents. `AgentService` uses `.catch(() => [])` if table missing. | No |
| **status_events** | Table exists (migrations). **0** rows, so Live Activity feed is empty. | No |
| **Dashboard** | Monthly trend = 0, redemption channels = 0, regional stats = 1 region (Khomas). | Minimal |

## Verdict

**Not sufficient** for a full dev/demo:

- No agents → Agent Network always 0.
- No status events → Live Activity empty.
- Beneficiaries list is stubbed → list endpoint always empty (counts come from raw SQL in dashboard).
- Only 2 vouchers, 1 region → charts and trends mostly empty.

## What to do

1. **Run the seed script** (adds agents + status events; uses existing `agents` table schema: `location`, `liquidity_balance`):

   ```bash
   cd backend && pnpm run seed
   ```

   - **agents:** Table already exists (Buffr schema: `id` uuid, `name`, `type`, `location`, `status`, `liquidity_balance`, etc.). Seed inserts up to 5 agents if count &lt; 3. `AgentService` maps `location` → `region`, `liquidity_balance` → `liquidity` for the API.
   - **status_events:** Inserts events for existing vouchers so the Live Activity feed has data.

2. **Optional:** Wire `BeneficiaryRepository` to the real `beneficiaries` table so `GET /beneficiaries` returns the same rows the dashboard counts (instead of the stub).

3. **Optional:** Add more beneficiaries/vouchers in the seed script if your DB is dedicated to SmartPay (not shared Buffr).

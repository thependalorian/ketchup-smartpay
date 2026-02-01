/**
 * Validate seed – print table counts.
 * Run: cd backend && npx tsx scripts/validate-seed.ts
 */

import { sql } from '../src/database/connection';

async function main() {
  const [b, a, v, s, w, r, loc, comm] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM beneficiaries`,
    sql`SELECT COUNT(*) as c FROM agents`,
    sql`SELECT COUNT(*) as c FROM vouchers`,
    sql`SELECT COUNT(*) as c FROM status_events`,
    sql`SELECT COUNT(*) as c FROM webhook_events`,
    sql`SELECT COUNT(*) as c FROM reconciliation_records`,
    sql`SELECT COUNT(*) as c FROM locations`.catch(() => [{ c: '0' }]),
    sql`SELECT COUNT(*) as c FROM communication_log`.catch(() => [{ c: '0' }]),
  ]);
  const counts = {
    beneficiaries: Number((b[0] as { c: string })?.c ?? 0),
    agents: Number((a[0] as { c: string })?.c ?? 0),
    vouchers: Number((v[0] as { c: string })?.c ?? 0),
    status_events: Number((s[0] as { c: string })?.c ?? 0),
    webhook_events: Number((w[0] as { c: string })?.c ?? 0),
    reconciliation_records: Number((r[0] as { c: string })?.c ?? 0),
    locations: Number((loc[0] as { c: string })?.c ?? 0),
    communication_log: Number((comm[0] as { c: string })?.c ?? 0),
  };
  console.log('--- Seed validation ---');
  console.log('  beneficiaries:', counts.beneficiaries);
  console.log('  agents:', counts.agents);
  console.log('  vouchers:', counts.vouchers);
  console.log('  status_events:', counts.status_events);
  console.log('  webhook_events:', counts.webhook_events);
  console.log('  reconciliation_records:', counts.reconciliation_records);
  console.log('  locations:', counts.locations);
  console.log('  communication_log:', counts.communication_log);
  const ok = counts.beneficiaries >= 1000 && counts.agents >= 300;
  console.log(ok ? '\n✅ Validation passed (1000+ beneficiaries, 300+ agents).' : '\n⚠️  Targets: 1000 beneficiaries, 300 agents.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

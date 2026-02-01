/**
 * Validate government audit beneficiaries endpoint logic.
 * Runs the same SELECT as GET /api/v1/government/audit/beneficiaries and asserts response shape.
 * Run: cd backend && npx tsx scripts/validate-audit-beneficiaries.ts
 * Requires: DATABASE_URL in .env or .env.local
 */

import { sql } from '../src/database/connection';

const EXPECTED_KEYS = [
  'total_records',
  'missing_phone',
  'missing_id_number',
  'unique_ids',
  'duplicate_or_null_ids',
  'deceased_count',
] as const;

async function main() {
  console.log('Validating audit beneficiaries query (aligned with beneficiaries schema: id_number, no email)...');

  const result = await sql`
    SELECT 
      COUNT(*)::bigint as total_records,
      COUNT(CASE WHEN phone IS NULL OR TRIM(phone) = '' THEN 1 END)::bigint as missing_phone,
      COUNT(CASE WHEN id_number IS NULL OR TRIM(id_number) = '' THEN 1 END)::bigint as missing_id_number,
      COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != '')::bigint as unique_ids,
      (COUNT(*) - COUNT(DISTINCT id_number) FILTER (WHERE id_number IS NOT NULL AND TRIM(id_number) != ''))::bigint as duplicate_or_null_ids,
      COUNT(*) FILTER (WHERE status = 'deceased')::bigint as deceased_count
    FROM beneficiaries
  `;

  const row = result[0] as Record<string, unknown>;
  if (!row) {
    console.error('Query returned no row');
    process.exit(1);
  }

  for (const key of EXPECTED_KEYS) {
    if (!(key in row)) {
      console.error(`Missing key in response: ${key}`);
      process.exit(1);
    }
    const val = row[key];
    const num = typeof val === 'number' ? val : typeof val === 'string' ? Number(val) : val == null ? NaN : Number(val);
    if (Number.isNaN(num) || num < 0) {
      console.error(`Expected non-negative number for ${key}, got ${String(val)}`);
      process.exit(1);
    }
  }

  const data = {
    total_records: Number(row.total_records ?? 0),
    missing_phone: Number(row.missing_phone ?? 0),
    missing_id_number: Number(row.missing_id_number ?? 0),
    unique_ids: Number(row.unique_ids ?? 0),
    duplicate_or_null_ids: Number(row.duplicate_or_null_ids ?? 0),
    deceased_count: Number(row.deceased_count ?? 0),
  };

  console.log('Response shape OK. Sample data:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n✅ Audit beneficiaries validation passed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

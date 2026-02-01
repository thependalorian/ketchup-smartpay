/**
 * Seed script – beneficiaries, agents, vouchers, status_events,
 * webhook_events, reconciliation_records for dev/demo.
 *
 * Run: cd backend && pnpm run seed  (or: npx tsx scripts/seed.ts)
 * Requires: DATABASE_URL in .env.local
 *
 * Scenario (aligned with BUFFR_G2P_EXECUTIVE_SUMMARY_FEB2026.md):
 * - Past 6 months only (M1 = 6 months ago … M6 = current month).
 * - Agents are distinct from NamPost offices and merchants: only cash-out agents (pos_agent,
 *   mobile_agent) are seeded in the agents table. NamPost offices and ATMs are redemption
 *   channels (redemption_method); banks are not redemption channels.
 * - M1–M4: No agent network – Nampost-only bottlenecks. Voucher issuance clustered on
 *   government payout dates by grant type; redemption mostly post_office / mobile_unit; low rate.
 * - M5: 120 agents onboarded. Redemption improves; pos/mobile, ATM redemption begins (no ATM in M1–M4).
 * - M6: 300 agents (180 more). High redemption; mostly pos/mobile, plus ATM.
 * - 30 mobile units: 29 active, 1 down (for status monitoring / seed).
 *
 * Government grant payout dates (PRD): Old Age & Disability 12–14, Child Cash 15–17, etc.
 * Issuance is clustered on these dates per month; redemption is mostly in the payout period
 * (1–7 days after issuance) with a tail through the month (ATM/agent use later).
 *
 * Sources: Nampost coordinates (nampost.com.na), Namibia 2023 Census (NSA), PRD payout schedule.
 */

import { randomUUID } from 'crypto';
import { sql } from '../src/database/connection';
import { NotificationsService } from '../src/services/notifications/NotificationsService';

/** Past 6 months: M1 (oldest) … M6 (current). */
function getSixMonthBounds(): { start: Date; end: Date }[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const months: { start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(y, m - i, 1);
    const end = new Date(y, m - i + 1, 0, 23, 59, 59);
    months.push({ start, end });
  }
  return months;
}

function randomDateInRange(start: Date, end: Date): Date {
  const s = start.getTime();
  const e = end.getTime();
  return new Date(s + Math.floor(Math.random() * (e - s + 1)));
}

/**
 * Government grant payout dates (PRD: Old Age & Disability 12–14, Child Cash 15–17).
 * Returns a random date in the payout window for the given month and grant type.
 */
function getPayoutDateInMonth(monthStart: Date, grantType: string): Date {
  const y = monthStart.getFullYear();
  const m = monthStart.getMonth();
  let dayStart: number;
  let dayEnd: number;
  if (grantType === 'old_age_grant' || grantType === 'disability_grant') {
    dayStart = 12;
    dayEnd = 14;
  } else {
    dayStart = 15;
    dayEnd = 17;
  }
  const d = dayStart + Math.floor(Math.random() * (dayEnd - dayStart + 1));
  return new Date(y, m, d, 9 + Math.floor(Math.random() * 6), 0, 0);
}

/** 14 administrative regions (NSA 2023 PHC). */
const NAMIBIAN_REGIONS = [
  'Khomas',
  'Erongo',
  'Oshana',
  'Omusati',
  'Ohangwena',
  'Oshikoto',
  'Kavango East',
  'Kavango West',
  'Zambezi',
  'Kunene',
  'Otjozondjupa',
  'Omaheke',
  'Hardap',
  'Karas',
];

/** 2023 Census approximate population share by region (for beneficiary distribution). */
const REGION_WEIGHTS: Record<string, number> = {
  Khomas: 0.164,
  Erongo: 0.07,
  Oshana: 0.08,
  Omusati: 0.08,
  Ohangwena: 0.07,
  Oshikoto: 0.06,
  'Kavango East': 0.07,
  'Kavango West': 0.04,
  Zambezi: 0.04,
  Kunene: 0.03,
  Otjozondjupa: 0.07,
  Omaheke: 0.034,
  Hardap: 0.03,
  Karas: 0.03,
};

/** Nampost offices: coordinates from nampost.com.na Post Office Finder (Directions links). */
const NAMPOST_OFFICES: Array<{ name: string; lat: number; lng: number; region: string }> = [
  { name: 'Windhoek Main', lat: -22.5626, lng: 17.0841, region: 'Khomas' },
  { name: 'Katutura', lat: -22.5211, lng: 17.0598, region: 'Khomas' },
  { name: 'Khomasdal', lat: -22.5455, lng: 17.0480, region: 'Khomas' },
  { name: 'Klein Windhoek', lat: -22.5718, lng: 17.0982, region: 'Khomas' },
  { name: 'Dordabis', lat: -22.9482, lng: 17.6615, region: 'Khomas' },
  { name: 'Swakopmund', lat: -22.6758, lng: 14.5258, region: 'Erongo' },
  { name: 'Walvis Bay', lat: -22.9521, lng: 14.5068, region: 'Erongo' },
  { name: 'Henties Bay', lat: -22.1135, lng: 14.2832, region: 'Erongo' },
  { name: 'Arandis', lat: -22.4193, lng: 14.9798, region: 'Erongo' },
  { name: 'Karibib', lat: -21.9367, lng: 15.8613, region: 'Erongo' },
  { name: 'Omaruru', lat: -21.4184, lng: 15.9551, region: 'Erongo' },
  { name: 'Usakos', lat: -22.0042, lng: 15.5855, region: 'Erongo' },
  { name: 'Uis', lat: -21.2187, lng: 14.8674, region: 'Erongo' },
  { name: 'Oshakati Main', lat: -17.7895, lng: 15.7058, region: 'Oshana' },
  { name: 'Ondangwa', lat: -17.9074, lng: 15.9706, region: 'Oshana' },
  { name: 'Ongwediva', lat: -17.7731, lng: 15.7645, region: 'Oshana' },
  { name: 'Outapi', lat: -17.5111, lng: 14.9849, region: 'Omusati' },
  { name: 'Okahao', lat: -17.9164, lng: 15.0937, region: 'Omusati' },
  { name: 'Tsandi', lat: -17.7459, lng: 14.8907, region: 'Omusati' },
  { name: 'Oshikuku', lat: -17.6543, lng: 15.4727, region: 'Omusati' },
  { name: 'Ruacana', lat: -17.4360, lng: 14.3908, region: 'Omusati' },
  { name: 'Oshikango', lat: -17.3978, lng: 15.8907, region: 'Ohangwena' },
  { name: 'Ondobe', lat: -17.5194, lng: 16.0625, region: 'Ohangwena' },
  { name: 'Ongha', lat: -17.6136, lng: 15.9032, region: 'Ohangwena' },
  { name: 'Omungwelume', lat: -17.5022, lng: 15.6346, region: 'Ohangwena' },
  { name: 'Omuthiya', lat: -18.3655, lng: 16.5856, region: 'Oshikoto' },
  { name: 'Onandjokwe', lat: -17.9078, lng: 16.0383, region: 'Oshikoto' },
  { name: 'Onayena', lat: -17.9496, lng: 16.1937, region: 'Oshikoto' },
  { name: 'Oshivelo', lat: -18.6180, lng: 17.1671, region: 'Oshikoto' },
  { name: 'Okankolo', lat: -17.9578, lng: 16.4214, region: 'Oshikoto' },
  { name: 'Rundu', lat: -17.9136, lng: 19.7623, region: 'Kavango East' },
  { name: 'Divundu', lat: -18.0971, lng: 21.5483, region: 'Kavango East' },
  { name: 'Nkurenkuru', lat: -17.6282, lng: 18.6101, region: 'Kavango West' },
  { name: 'Mpungu', lat: -17.6689, lng: 18.2318, region: 'Kavango West' },
  { name: 'Ngweze', lat: -17.5022, lng: 24.2776, region: 'Zambezi' },
  { name: 'Bukalo', lat: -17.7131, lng: 24.5332, region: 'Zambezi' },
  { name: 'Chincimane', lat: -17.8193, lng: 23.9536, region: 'Zambezi' },
  { name: 'Mayuni', lat: -17.8672, lng: 23.4062, region: 'Zambezi' },
  { name: 'Opuwo', lat: -17.5978, lng: 13.5065, region: 'Kunene' },
  { name: 'Khorixas', lat: -20.3721, lng: 14.9593, region: 'Kunene' },
  { name: 'Kamanjab', lat: -19.6272, lng: 14.8425, region: 'Kunene' },
  { name: 'Fransfontein', lat: -20.1705, lng: 15.1042, region: 'Kunene' },
  { name: 'Otjiwarongo', lat: -20.4545, lng: 16.6645, region: 'Otjozondjupa' },
  { name: 'Grootfontein', lat: -19.5729, lng: 18.1073, region: 'Otjozondjupa' },
  { name: 'Okakarara', lat: -20.5907, lng: 17.4588, region: 'Otjozondjupa' },
  { name: 'Kalkfeld', lat: -20.8909, lng: 16.1904, region: 'Otjozondjupa' },
  { name: 'Kombat', lat: -19.7136, lng: 17.7133, region: 'Otjozondjupa' },
  { name: 'Otavi', lat: -19.6340, lng: 17.3317, region: 'Otjozondjupa' },
  { name: 'Okahandja', lat: -21.9719, lng: 16.9063, region: 'Otjozondjupa' },
  { name: 'Gobabis', lat: -22.3990, lng: 18.9740, region: 'Omaheke' },
  { name: 'Epukiro', lat: -21.6952, lng: 19.1033, region: 'Omaheke' },
  { name: 'Otjinene', lat: -21.1352, lng: 18.7868, region: 'Omaheke' },
  { name: 'Leonardville', lat: -23.5063, lng: 18.7928, region: 'Omaheke' },
  { name: 'Mariental', lat: -24.5998, lng: 17.9413, region: 'Hardap' },
  { name: 'Rehoboth', lat: -23.2859, lng: 17.0785, region: 'Hardap' },
  { name: 'Gibeon', lat: -25.1284, lng: 17.7666, region: 'Hardap' },
  { name: 'Stampriet', lat: -24.3436, lng: 18.4024, region: 'Hardap' },
  { name: 'Kalkrand', lat: -24.0717, lng: 17.5831, region: 'Hardap' },
  { name: 'Maltahohe', lat: -24.8381, lng: 16.9801, region: 'Hardap' },
  { name: 'Aranos', lat: -24.1378, lng: 19.1107, region: 'Hardap' },
  { name: 'Keetmanshoop', lat: -26.5642, lng: 18.1310, region: 'Karas' },
  { name: 'Karasburg', lat: -28.0217, lng: 18.7482, region: 'Karas' },
  { name: 'Oranjemund', lat: -28.5597, lng: 16.4347, region: 'Karas' },
  { name: 'Rosh Pinah', lat: -27.9654, lng: 16.7618, region: 'Karas' },
  { name: 'Aus', lat: -26.6669, lng: 16.2669, region: 'Karas' },
  { name: 'Bethanie', lat: -26.5091, lng: 17.1514, region: 'Karas' },
  { name: 'Tses', lat: -25.8842, lng: 18.1221, region: 'Karas' },
  { name: 'Aminuis', lat: -23.6477, lng: 19.3704, region: 'Omaheke' },
  { name: 'Witvlei', lat: -22.4049, lng: 18.4929, region: 'Khomas' },
  { name: 'Omitara', lat: -22.2903, lng: 18.0080, region: 'Khomas' },
  { name: 'Okamatapati', lat: -20.4031, lng: 18.2155, region: 'Otjozondjupa' },
  { name: 'Okombahe', lat: -21.3594, lng: 15.3775, region: 'Erongo' },
  { name: 'Okongo', lat: -17.5688, lng: 17.2134, region: 'Ohangwena' },
  { name: 'Onankali', lat: -18.1847, lng: 16.3729, region: 'Oshikoto' },
  { name: 'Onyaanya', lat: -18.0700, lng: 16.2656, region: 'Oshikoto' },
  { name: 'Ondangwa Oluno', lat: -17.9184, lng: 15.9929, region: 'Oshana' },
  { name: 'Oshigambo', lat: -17.7844, lng: 16.0787, region: 'Oshikoto' },
  { name: 'Onesi', lat: -17.5915, lng: 14.6865, region: 'Omusati' },
  { name: 'Gochas', lat: -24.8598, lng: 18.8046, region: 'Hardap' },
  { name: 'Helmeringhausen', lat: -25.8891, lng: 16.8223, region: 'Karas' },
  { name: 'Noordoewer', lat: -28.7155, lng: 17.6186, region: 'Karas' },
  { name: 'Ariamsvlei', lat: -28.1166, lng: 19.8366, region: 'Karas' },
  { name: 'Koes', lat: -25.9456, lng: 19.1111, region: 'Karas' },
  { name: 'Berseba', lat: -25.9989, lng: 17.7710, region: 'Karas' },
  { name: 'Grunau', lat: -27.7315, lng: 18.3772, region: 'Karas' },
  { name: 'Klein Aub', lat: -23.7931, lng: 16.6306, region: 'Khomas' },
  { name: 'Tallismanus', lat: -21.8467, lng: 19.1880, region: 'Omaheke' },
];

/** ATMs: standalone (name, lat, lng, region). */
const ATMS: Array<{ name: string; lat: number; lng: number; region: string }> = [
  { name: 'ATM Windhoek Independence Ave', lat: -22.5590, lng: 17.0860, region: 'Khomas' },
  { name: 'ATM Windhoek Wernhill', lat: -22.5550, lng: 17.0780, region: 'Khomas' },
  { name: 'ATM Katutura', lat: -22.5200, lng: 17.0610, region: 'Khomas' },
  { name: 'ATM Walvis Bay Main', lat: -22.9490, lng: 14.5080, region: 'Erongo' },
  { name: 'ATM Swakopmund', lat: -22.6760, lng: 14.5240, region: 'Erongo' },
  { name: 'ATM Rundu', lat: -17.9110, lng: 19.7630, region: 'Kavango East' },
  { name: 'ATM Oshakati', lat: -17.7900, lng: 15.7040, region: 'Oshana' },
  { name: 'ATM Ondangwa', lat: -17.9080, lng: 15.9690, region: 'Oshana' },
  { name: 'ATM Otjiwarongo', lat: -20.4550, lng: 16.6630, region: 'Otjozondjupa' },
  { name: 'ATM Grootfontein', lat: -19.5710, lng: 18.1080, region: 'Otjozondjupa' },
  { name: 'ATM Okahandja', lat: -21.9700, lng: 16.9070, region: 'Otjozondjupa' },
  { name: 'ATM Gobabis', lat: -22.4000, lng: 18.9730, region: 'Omaheke' },
  { name: 'ATM Keetmanshoop', lat: -26.5650, lng: 18.1300, region: 'Karas' },
  { name: 'ATM Mariental', lat: -24.6000, lng: 17.9400, region: 'Hardap' },
  { name: 'ATM Rehoboth', lat: -23.2860, lng: 17.0790, region: 'Hardap' },
  { name: 'ATM Oshikango', lat: -17.3980, lng: 15.8910, region: 'Ohangwena' },
];

/** Warehouses / distribution centers (G2P voucher storage, logistics). */
const WAREHOUSES: Array<{ name: string; lat: number; lng: number; region: string }> = [
  { name: 'Windhoek DC', lat: -22.5780, lng: 17.0720, region: 'Khomas' },
  { name: 'Walvis Bay Logistics Hub', lat: -22.9680, lng: 14.4920, region: 'Erongo' },
  { name: 'Rundu Warehouse', lat: -17.9250, lng: 19.7550, region: 'Kavango East' },
  { name: 'Oshakati Distribution Center', lat: -17.7980, lng: 15.6980, region: 'Oshana' },
  { name: 'Otjiwarongo Depot', lat: -20.4620, lng: 16.6580, region: 'Otjozondjupa' },
  { name: 'Keetmanshoop Depot', lat: -26.5720, lng: 18.1250, region: 'Karas' },
];

const GRANT_TYPES = ['old_age_grant', 'child_grant', 'disability_grant', 'vulnerable_child'] as const;
const BENEFICIARY_STATUSES = ['pending', 'active', 'verified'] as const;

/** Namibian first names (census / Oshiwambo / Afrikaans mix). */
const FIRST_NAMES = [
  'Anna', 'Johannes', 'Maria', 'David', 'Elizabeth', 'Petrus', 'Helena', 'Andreas', 'Frieda', 'Thomas',
  'Selma', 'Paulus', 'Margret', 'Daniel', 'Rosa', 'Jacob', 'Esther', 'Simon', 'Ruth', 'Michael',
  'Emilia', 'Joseph', 'Sarah', 'Peter', 'Lydia', 'Franz', 'Hilma', 'Wilhelm', 'Loise', 'Stefan',
  'Patricia', 'Elias', 'Frieda', 'Naftali', 'Selma', 'Gabriel', 'Martha', 'Samuel', 'Rebecca', 'Nathan',
];
/** Namibian surnames (common NSA/census). */
const SURNAMES = [
  'Shikongo', 'Hamutenya', 'Nghipondoka', 'Nangolo', 'Iyambo', 'Nghidinwa', 'Mbambo', 'Iileka', 'Nghishiiko', 'Hamunyela',
  'Tjituka', 'Shilongo', 'Kamati', 'Haufiku', 'Nambahu', 'Nghifikepunye', 'Mupetami', 'Kandovazu', 'Shikongo', 'Iyambo',
  'Hailonga', 'Ndjebela', 'Amupadhi', 'Hamukwaya', 'Nekundi', 'Britz', 'Shikongo', 'Nangolo', 'Taurob', 'Diergaard',
  'Van Wyk', 'Beukes', 'Cloete', 'Engelbrecht', 'Goliath', 'Hendricks', 'Isaaks', 'Jaartze', 'Kandundu', 'Mweukefina',
];

function pickRegionByCensus(): string {
  const r = Math.random();
  let acc = 0;
  for (const region of NAMIBIAN_REGIONS) {
    acc += REGION_WEIGHTS[region] ?? 0.05;
    if (r <= acc) return region;
  }
  return NAMIBIAN_REGIONS[0];
}

function randomName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  return `${first} ${last}`;
}

/** Namibian mobile prefixes (MTC, TN, etc.). */
const MOBILE_PREFIXES = ['81', '82', '84', '85'];

/** Generate a unique Namibian cell number +264 XX XXXXXXX for seed index. */
function seedPhoneForIndex(seedIndex: number): string {
  const prefix = MOBILE_PREFIXES[seedIndex % MOBILE_PREFIXES.length];
  const subscriber = 1000000 + (seedIndex % 8999999);
  return `+264${prefix}${subscriber}`;
}

/** Generate a unique 11-digit ID number for seeding (Namibian-style, synthetic). */
function seedIdNumber(seedIndex: number): string {
  const base = 10000000000 + seedIndex;
  return String(base).slice(0, 11);
}

/** Offset from a Nampost point to place agent "far" from post office (same region). */
function offsetRemoteAgent(base: { lat: number; lng: number }, region: string): { lat: number; lng: number } {
  const deg = 0.08 + Math.random() * 0.15;
  const angle = Math.random() * 2 * Math.PI;
  const lat = base.lat + deg * Math.cos(angle);
  const lng = base.lng + deg * Math.sin(angle);
  return { lat: Math.max(-28, Math.min(-16, lat)), lng: Math.max(11, Math.min(25, lng)) };
}

const BATCH = 100;

async function seedBeneficiaries() {
  const existing = await sql`SELECT COUNT(*) as c FROM beneficiaries`;
  if (Number((existing[0] as any)?.c ?? 0) >= 1000) {
    console.log('⏭ beneficiaries already >= 1000, skipping');
    return;
  }
  const toInsert = 1000 - Number((existing[0] as any)?.c ?? 0);
  const months = getSixMonthBounds();
  const sixMonthStart = months[0].start;
  const sixMonthEnd = months[5].end;
  console.log(`Seeding ${toInsert} beneficiaries (past 6 months: ${sixMonthStart.toISOString().slice(0, 7)} – ${sixMonthEnd.toISOString().slice(0, 7)})...`);
  const existingCount = Number((existing[0] as any)?.c ?? 0);
  const CHUNK = 50;
  for (let offset = 0; offset < toInsert; offset += CHUNK) {
    const batchSize = Math.min(CHUNK, toInsert - offset);
    const promises = Array.from({ length: batchSize }, async (_, i) => {
      const seedIndex = existingCount + offset + i;
      const id = randomUUID();
      const region = pickRegionByCensus();
      const status = BENEFICIARY_STATUSES[Math.floor(Math.random() * BENEFICIARY_STATUSES.length)];
      const grant = GRANT_TYPES[Math.floor(Math.random() * GRANT_TYPES.length)];
      const enrolledAt = randomDateInRange(sixMonthStart, sixMonthEnd);
      const lastPayment = status !== 'pending' ? randomDateInRange(enrolledAt, sixMonthEnd) : enrolledAt;
      const name = randomName();
      const phone = seedPhoneForIndex(seedIndex);
      const idNumber = seedIdNumber(seedIndex);
      try {
        await sql`
          INSERT INTO beneficiaries (id, name, phone, id_number, region, grant_type, status, enrolled_at, last_payment, created_at, updated_at)
          VALUES (${id}, ${name}, ${phone}, ${idNumber}, ${region}, ${grant}, ${status}, ${enrolledAt}, ${lastPayment}, NOW(), NOW())
        `;
        return 1;
      } catch (_) {
        return 0;
      }
    });
    await Promise.all(promises);
    console.log(`  beneficiaries ${Math.min(offset + batchSize, toInsert)}/${toInsert}`);
  }
  const count = await sql`SELECT COUNT(*) as c FROM beneficiaries`;
  console.log(`✅ beneficiaries: ${(count[0] as any)?.c ?? 0}`);
}

/** Relationship options for dependants. */
const DEPENDANT_RELATIONSHIPS = ['child', 'spouse', 'parent', 'sibling', 'other'] as const;

/**
 * Seed sample dependants and mark 1–2 beneficiaries as deceased for demo.
 * Idempotent: only runs if beneficiary_dependants is empty and we have beneficiaries.
 */
async function seedDependantsAndDeceased() {
  const depCount = await sql`SELECT COUNT(*) as c FROM beneficiary_dependants`;
  if (Number((depCount[0] as any)?.c ?? 0) > 0) {
    console.log('⏭ beneficiary_dependants already seeded, skipping');
    return;
  }
  const beneficiaries = await sql`SELECT id FROM beneficiaries ORDER BY created_at ASC LIMIT 20`;
  if (beneficiaries.length < 5) {
    console.log('⏭ Not enough beneficiaries for dependants/deceased demo, skipping');
    return;
  }
  const ids = (beneficiaries as Array<{ id: string }>).map((r) => r.id);
  const deceasedIds = ids.slice(0, 2);
  const forDependants = ids.slice(2, 7);

  console.log('Seeding 2 deceased beneficiaries and sample dependants...');
  const now = new Date().toISOString();
  for (const id of deceasedIds) {
    await sql`
      UPDATE beneficiaries SET status = 'deceased', deceased_at = ${now}::timestamptz, updated_at = ${now}::timestamptz WHERE id = ${id}
    `;
  }
  console.log(`  marked 2 beneficiaries as deceased`);

  for (let i = 0; i < forDependants.length; i++) {
    const beneficiaryId = forDependants[i];
    const numDependants = 1 + (i % 2);
    for (let j = 0; j < numDependants; j++) {
      const rel = DEPENDANT_RELATIONSHIPS[i % DEPENDANT_RELATIONSHIPS.length];
      const name = `${FIRST_NAMES[(i + j) % FIRST_NAMES.length]} ${SURNAMES[(i + j + 1) % SURNAMES.length]}`;
      const idNum = seedIdNumber(10000 + i * 10 + j);
      const phone = seedPhoneForIndex(10000 + i * 10 + j);
      const dob = new Date(1990 + (i % 20), j % 12, 1 + (j % 28));
      try {
        await sql`
          INSERT INTO beneficiary_dependants (id, beneficiary_id, name, id_number, phone, relationship, date_of_birth, is_proxy, created_at, updated_at)
          VALUES (${randomUUID()}, ${beneficiaryId}, ${name}, ${idNum}, ${phone}, ${rel}, ${dob.toISOString().slice(0, 10)}, false, NOW(), NOW())
        `;
      } catch (_) {}
    }
  }
  const dCount = await sql`SELECT COUNT(*) as c FROM beneficiary_dependants`;
  console.log(`✅ dependants: ${(dCount[0] as any)?.c ?? 0}, deceased: 2`);
}

/**
 * Seed only cash-out agents (300). NamPost offices and merchants are separate:
 * they are redemption channels (post_office, pos at merchant) in voucher data, not agent rows.
 * NAMPOST_OFFICES used only as geographic anchors (region + offset for lat/lng).
 */
async function seedAgents() {
  const months = getSixMonthBounds();
  const M5 = months[4];
  const M6 = months[5];
  const existing = await sql`SELECT COUNT(*) as c FROM agents`;
  if (Number((existing[0] as any)?.c ?? 0) >= 300) {
    console.log('⏭ agents already >= 300, skipping');
    return;
  }
  const toInsert = 300 - Number((existing[0] as any)?.c ?? 0);
  console.log(`Seeding ${toInsert} agents (pos_agent / mobile_agent only; M5: 120, M6: 180)...`);

  let inserted = 0;
  for (let i = 0; i < 120; i++) {
    const base = NAMPOST_OFFICES[i % NAMPOST_OFFICES.length];
    const { lat, lng } = offsetRemoteAgent(base, base.region);
    const createdAt = randomDateInRange(M5.start, M5.end);
    const agentType = Math.random() < 0.6 ? 'pos_agent' : 'mobile_agent';
    try {
      await sql`
        INSERT INTO agents (id, name, type, location, latitude, longitude, liquidity_balance, cash_on_hand, status, min_liquidity_required, max_daily_cashout, commission_rate, contact_phone, created_at, updated_at)
        VALUES (
          ${randomUUID()},
          ${`Agent ${base.region} M5-${i + 1}`},
          ${agentType},
          ${base.region},
          ${lat},
          ${lng},
          ${20000 + Math.floor(Math.random() * 180000)},
          0,
          'active',
          10000,
          50000,
          ${1.5 + Math.random() * 1.5},
          ${`+2648${String(1000000 + i).slice(0, 7)}`},
          ${createdAt},
          ${createdAt}
        )
      `;
      inserted++;
    } catch (_) {}
  }

  const remaining = Math.min(toInsert - inserted, 180);
  const AGENT_CHUNK = 30;
  for (let offset = 0; offset < remaining; offset += AGENT_CHUNK) {
    const batchSize = Math.min(AGENT_CHUNK, remaining - offset);
    const promises = Array.from({ length: batchSize }, async (_, i) => {
      const base = NAMPOST_OFFICES[(offset + i) % NAMPOST_OFFICES.length];
      const { lat, lng } = offsetRemoteAgent(base, base.region);
      const createdAt = randomDateInRange(M6.start, M6.end);
      const agentType = Math.random() < 0.6 ? 'pos_agent' : 'mobile_agent';
      try {
        await sql`
          INSERT INTO agents (id, name, type, location, latitude, longitude, liquidity_balance, cash_on_hand, status, min_liquidity_required, max_daily_cashout, commission_rate, contact_phone, created_at, updated_at)
          VALUES (
            ${randomUUID()},
            ${`Agent ${base.region} M6-${offset + i + 1}`},
            ${agentType},
            ${base.region},
            ${lat},
            ${lng},
            ${20000 + Math.floor(Math.random() * 180000)},
            0,
            'active',
            10000,
            50000,
            ${1.5 + Math.random() * 1.5},
            ${`+2648${String(2000000 + offset + i).slice(0, 7)}`},
            ${createdAt},
            ${createdAt}
          )
        `;
        return 1;
      } catch (_) {
        return 0;
      }
    });
    const results = await Promise.all(promises);
    inserted += results.reduce((a: number, b) => a + b, 0);
    console.log(`  agents ${inserted}/${toInsert}`);
  }
  const count = await sql`SELECT COUNT(*) as c FROM agents`;
  console.log(`✅ agents: ${(count[0] as any)?.c ?? 0} (M5: 120, M6: 180; type pos_agent/mobile_agent only)`);
}

/** 30 mobile units: 29 active, 1 down (aligned with redemption channel mobile_unit). */
const MOBILE_UNITS_TOTAL = 30;
const MOBILE_UNITS_ACTIVE = 29;
const MOBILE_UNITS_DOWN = 1;

/**
 * Seed 30 mobile units (29 active, 1 down).
 * Type: mobile_unit (same as redemption channel). Idempotent: skips if already 30.
 */
async function seedMobileUnits() {
  const existing = await sql`SELECT COUNT(*) as c FROM agents WHERE type = ${'mobile_unit'}`;
  const count = Number((existing[0] as any)?.c ?? 0);
  if (count >= MOBILE_UNITS_TOTAL) {
    console.log(`⏭ mobile units already ${count}, skipping`);
    return;
  }
  const toInsert = MOBILE_UNITS_TOTAL - count;
  console.log(`Seeding ${toInsert} mobile units (29 active, 1 down)...`);

  const now = new Date();
  let inserted = 0;
  for (let i = 0; i < toInsert; i++) {
    const region = NAMIBIAN_REGIONS[i % NAMIBIAN_REGIONS.length];
    const base = NAMPOST_OFFICES[i % NAMPOST_OFFICES.length];
    const { lat, lng } = offsetRemoteAgent(base, region);
    const unitNumber = count + inserted + 1;
    const status = unitNumber === MOBILE_UNITS_TOTAL ? 'down' : 'active'; // 30th is down
    const name = `Mobile Unit ${unitNumber}`;
    try {
      await sql`
        INSERT INTO agents (id, name, type, location, latitude, longitude, liquidity_balance, cash_on_hand, status, min_liquidity_required, max_daily_cashout, commission_rate, contact_phone, created_at, updated_at)
        VALUES (
          ${randomUUID()},
          ${name},
          'mobile_unit',
          ${region},
          ${lat},
          ${lng},
          ${50000 + Math.floor(Math.random() * 100000)},
          0,
          ${status},
          10000,
          100000,
          ${1.5},
          ${`+2648${String(3000000 + count + inserted).slice(0, 7)}`},
          ${now},
          ${now}
        )
      `;
      inserted++;
    } catch (_) {}
  }
  const total = await sql`SELECT COUNT(*) as c FROM agents WHERE type = ${'mobile_unit'}`;
  console.log(`✅ mobile units: ${(total[0] as any)?.c ?? 0} (29 active, 1 down)`);
}

/**
 * Seed locations: NamPost offices, ATMs, warehouses (no banks).
 * Skips each type if already at target count (idempotent).
 */
async function seedLocations() {
  try {
    const existing = await sql`SELECT type, COUNT(*) as c FROM locations GROUP BY type`;
    const byType: Record<string, number> = {};
    for (const row of existing as Array<{ type: string; c: string }>) {
      byType[row.type] = Number(row.c ?? 0);
    }
    const need = (type: string, count: number) => (byType[type] ?? 0) < count;

    let nampost = 0;
    if (need('nampost_office', NAMPOST_OFFICES.length)) {
      console.log(`Seeding ${NAMPOST_OFFICES.length} NamPost offices...`);
      for (const o of NAMPOST_OFFICES) {
        try {
          await sql`
            INSERT INTO locations (id, type, name, region, latitude, longitude, created_at, updated_at)
            VALUES (${randomUUID()}, 'nampost_office', ${o.name}, ${o.region}, ${o.lat}, ${o.lng}, NOW(), NOW())
          `;
          nampost++;
        } catch (_) {}
      }
      console.log(`  NamPost offices: +${nampost}`);
    } else {
      console.log('⏭ NamPost offices already seeded, skipping');
    }

    let atms = 0;
    if (need('atm', ATMS.length)) {
      console.log(`Seeding ${ATMS.length} ATMs...`);
      for (const o of ATMS) {
        try {
          await sql`
            INSERT INTO locations (id, type, name, region, latitude, longitude, created_at, updated_at)
            VALUES (${randomUUID()}, 'atm', ${o.name}, ${o.region}, ${o.lat}, ${o.lng}, NOW(), NOW())
          `;
          atms++;
        } catch (_) {}
      }
      console.log(`  ATMs: +${atms}`);
    } else {
      console.log('⏭ ATMs already seeded, skipping');
    }

    let warehouses = 0;
    if (need('warehouse', WAREHOUSES.length)) {
      console.log(`Seeding ${WAREHOUSES.length} warehouses...`);
      for (const o of WAREHOUSES) {
        try {
          await sql`
            INSERT INTO locations (id, type, name, region, latitude, longitude, created_at, updated_at)
            VALUES (${randomUUID()}, 'warehouse', ${o.name}, ${o.region}, ${o.lat}, ${o.lng}, NOW(), NOW())
          `;
          warehouses++;
        } catch (_) {}
      }
      console.log(`  warehouses: +${warehouses}`);
    } else {
      console.log('⏭ warehouses already seeded, skipping');
    }

    const total = await sql`SELECT COUNT(*) as c FROM locations`;
    console.log(`✅ locations: ${(total[0] as any)?.c ?? 0} (nampost_office, atm, warehouse)`);
  } catch (e) {
    console.warn('⚠️ locations seed skipped (table may not exist yet; run migrate first):', (e as Error).message);
  }
}

/** Redemption methods: M1–M4 Nampost-only (post_office, mobile_unit). ATM redemption in M5/M6. Banks are not redemption channels. */
function pickRedemptionMethod(monthIndex: number): string {
  if (monthIndex < 4) {
    return Math.random() < 0.5 ? 'post_office' : 'mobile_unit';
  }
  const r = Math.random();
  if (r < 0.55) return 'pos';
  if (r < 0.88) return 'mobile';
  return 'atm';
}

/** Days after issuance for redemption: mostly payout period (1–7), some 8–14, tail 15–30. */
function daysToRedemption(): number {
  const r = Math.random();
  if (r < 0.7) return 1 + Math.floor(Math.random() * 7);
  if (r < 0.9) return 8 + Math.floor(Math.random() * 7);
  return 15 + Math.floor(Math.random() * 16);
}

const VOUCHER_BATCH_SIZE = 80;
const PARALLEL_INSERT_CONCURRENCY = 20;

interface VoucherRow {
  id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  amount: number;
  grant_type: string;
  status: 'issued' | 'delivered' | 'redeemed' | 'expired';
  issued_at: Date;
  expiry_date: Date;
  redeemed_at: Date | null;
  redemption_method: string | null;
  region: string;
  voucher_code: string;
}
interface StatusEventRow {
  voucher_id: string;
  from_status: string | null;
  to_status: string;
  triggered_by: string;
  metadata: object;
}
interface WebhookRow {
  event_type: string;
  voucher_id: string;
  payload: object;
}
interface ReconRow {
  voucher_id: string;
  reconciliation_date: Date;
  ketchup_status: string;
  buffr_status: string;
}

async function seedVouchersAndEvents() {
  const beneficiaries = await sql`SELECT id, name, region, grant_type FROM beneficiaries ORDER BY created_at ASC LIMIT 1200`;
  if (beneficiaries.length === 0) {
    console.log('⏭ no beneficiaries, skipping vouchers');
    return;
  }
  const existingV = await sql`SELECT COUNT(*) as c FROM vouchers`;
  const existingCount = Number((existingV[0] as any)?.c ?? 0);
  if (existingCount >= 3500) {
    console.log('⏭ vouchers already >= 3500, skipping');
    return;
  }
  const maxNewVouchers = 3500 - existingCount;
  const months = getSixMonthBounds();
  console.log(`Seeding vouchers (past 6 months, batch ${VOUCHER_BATCH_SIZE}, parallel ${PARALLEL_INSERT_CONCURRENCY})...`);

  const amounts = [300, 500, 750, 1000, 1200, 1500];
  const triggers = ['system', 'webhook', 'manual'] as const;
  const benes = beneficiaries as Array<{ id: string; name: string; region: string; grant_type: string }>;
  let vCount = 0;
  let sCount = 0;
  let wCount = 0;
  let rCount = 0;

  const voucherBatch: VoucherRow[] = [];
  const statusBatch: StatusEventRow[] = [];
  const webhookBatch: WebhookRow[] = [];
  const reconBatch: ReconRow[] = [];

  const runInChunks = async <T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> => {
    const results: R[] = [];
    for (let i = 0; i < items.length; i += concurrency) {
      const chunk = items.slice(i, i + concurrency);
      results.push(...(await Promise.all(chunk.map(fn))));
    }
    return results;
  };

  const flushBatch = async () => {
    if (voucherBatch.length === 0) return;
    try {
      await runInChunks(voucherBatch, PARALLEL_INSERT_CONCURRENCY, async (v) => {
        const title = `Grant voucher ${v.voucher_code}`;
        await sql`
          INSERT INTO vouchers (id, beneficiary_id, beneficiary_name, amount, grant_type, type, title, status, issued_at, expiry_date, redeemed_at, redemption_method, region, voucher_code, created_at, updated_at)
          VALUES (${v.id}, ${v.beneficiary_id}, ${v.beneficiary_name}, ${v.amount}, ${v.grant_type}, 'social_grant', ${title}, ${v.status}, ${v.issued_at}, ${v.expiry_date}, ${v.redeemed_at}, ${v.redemption_method}, ${v.region}, ${v.voucher_code}, NOW(), NOW())
        `;
        return 1;
      });
      vCount += voucherBatch.length;
    } catch (e) {
      console.warn('Voucher batch insert failed, skipping batch:', (e as Error).message);
      voucherBatch.length = 0;
      statusBatch.length = 0;
      webhookBatch.length = 0;
      reconBatch.length = 0;
      return;
    }
    if (statusBatch.length > 0) {
      await runInChunks(statusBatch, PARALLEL_INSERT_CONCURRENCY, async (s) => {
        await sql`
          INSERT INTO status_events (voucher_id, from_status, to_status, triggered_by, metadata)
          VALUES (${s.voucher_id}, ${s.from_status}, ${s.to_status}, ${s.triggered_by}, ${JSON.stringify(s.metadata)}::jsonb)
        `;
        return 1;
      });
      sCount += statusBatch.length;
    }
    if (webhookBatch.length > 0) {
      await runInChunks(webhookBatch, PARALLEL_INSERT_CONCURRENCY, async (w) => {
        await sql`
          INSERT INTO webhook_events (event_type, voucher_id, status, delivery_attempts, signature_valid, payload, created_at, updated_at)
          VALUES (${w.event_type}, ${w.voucher_id}, 'delivered', 1, true, ${JSON.stringify(w.payload)}::jsonb, NOW(), NOW())
        `;
        return 1;
      });
      wCount += webhookBatch.length;
    }
    if (reconBatch.length > 0) {
      await runInChunks(reconBatch, PARALLEL_INSERT_CONCURRENCY, async (r) => {
        await sql`
          INSERT INTO reconciliation_records (voucher_id, reconciliation_date, ketchup_status, buffr_status, match, last_verified, created_at)
          VALUES (${r.voucher_id}, ${r.reconciliation_date}, ${r.ketchup_status}, ${r.buffr_status}, true, NOW(), NOW())
        `;
        return 1;
      });
      rCount += reconBatch.length;
    }
    voucherBatch.length = 0;
    statusBatch.length = 0;
    webhookBatch.length = 0;
    reconBatch.length = 0;
  };

  for (const b of benes) {
    if (vCount + voucherBatch.length >= maxNewVouchers) break;
    const numVouchers = Math.min(1 + Math.floor(Math.random() * 2), Math.ceil((maxNewVouchers - vCount - voucherBatch.length) / Math.max(1, benes.length)));
    for (let v = 0; v < numVouchers; v++) {
      if (vCount + voucherBatch.length >= maxNewVouchers) break;
      const voucherId = randomUUID();
      const amount = amounts[Math.floor(Math.random() * amounts.length)];
      const monthIndex = Math.floor(Math.random() * 6);
      const issuedAt = getPayoutDateInMonth(months[monthIndex].start, b.grant_type);
      const expiryDate = new Date(issuedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
      const redeemRate = monthIndex < 4 ? 0.25 : monthIndex === 4 ? 0.5 : 0.7;
      const status: 'issued' | 'delivered' | 'redeemed' | 'expired' = Math.random() < redeemRate ? 'redeemed' : Math.random() < 0.85 ? 'delivered' : Math.random() < 0.95 ? 'issued' : 'expired';
      const redeemedAt = status === 'redeemed' ? new Date(issuedAt.getTime() + daysToRedemption() * 24 * 60 * 60 * 1000) : null;
      const redemptionMethod = status === 'redeemed' ? pickRedemptionMethod(monthIndex) : null;
      const voucherCode = `VC-${voucherId.slice(0, 8)}-${Math.random().toString(36).slice(2, 10)}`;

      voucherBatch.push({
        id: voucherId,
        beneficiary_id: b.id,
        beneficiary_name: b.name,
        amount,
        grant_type: b.grant_type,
        status,
        issued_at: issuedAt,
        expiry_date: expiryDate,
        redeemed_at: redeemedAt,
        redemption_method: redemptionMethod,
        region: b.region,
        voucher_code: voucherCode,
      });

      statusBatch.push({ voucher_id: voucherId, from_status: null, to_status: 'issued', triggered_by: triggers[0], metadata: { amount, region: b.region } });
      if (status !== 'issued') {
        statusBatch.push({ voucher_id: voucherId, from_status: 'issued', to_status: 'delivered', triggered_by: triggers[1], metadata: { disbursement: true } });
      }
      if (status === 'redeemed') {
        statusBatch.push({ voucher_id: voucherId, from_status: 'delivered', to_status: 'redeemed', triggered_by: triggers[1], metadata: { redemption_method: redemptionMethod, cashout: true } });
        webhookBatch.push({ event_type: 'voucher.redeemed', voucher_id: voucherId, payload: { voucher_id: voucherId, status: 'redeemed', amount, redemption_method: redemptionMethod } });
      }
      if (status === 'delivered') {
        webhookBatch.push({ event_type: 'voucher.delivered', voucher_id: voucherId, payload: { voucher_id: voucherId, status: 'delivered', amount } });
      }
      if (Math.random() < 0.3) {
        const recDate = status === 'redeemed' ? (redeemedAt ?? issuedAt) : issuedAt;
        reconBatch.push({ voucher_id: voucherId, reconciliation_date: recDate, ketchup_status: status, buffr_status: status });
      }

      if (voucherBatch.length >= VOUCHER_BATCH_SIZE) {
        await flushBatch();
        console.log(`  vouchers ${vCount}/${maxNewVouchers}`);
      }
    }
  }
  await flushBatch();
  console.log(`✅ vouchers: +${vCount}, status_events: +${sCount}, webhook_events: +${wCount}, reconciliation_records: +${rCount}`);
}

/**
 * Seed beneficiary_consents (PRD FR4.5) – sample essential + data_sharing for first beneficiaries.
 * Idempotent: skips if table already has rows.
 */
async function seedBeneficiaryConsents() {
  try {
    const existing = await sql`SELECT COUNT(*) as c FROM beneficiary_consents`;
    if (Number((existing[0] as { c: string })?.c ?? 0) > 0) {
      console.log('⏭ beneficiary_consents already seeded, skipping');
      return;
    }
    const beneficiaries = await sql`SELECT id FROM beneficiaries ORDER BY created_at ASC LIMIT 25`;
    if (beneficiaries.length === 0) return;
    const consentTypes = ['essential', 'data_sharing'] as const;
    for (const b of beneficiaries as Array<{ id: string }>) {
      for (const consentType of consentTypes) {
        try {
          await sql`
            INSERT INTO beneficiary_consents (beneficiary_id, consent_type, granted, granted_at, version)
            VALUES (${b.id}, ${consentType}, true, NOW(), '1.0')
            ON CONFLICT (beneficiary_id, consent_type) DO NOTHING
          `;
        } catch (_) {}
      }
    }
    const count = await sql`SELECT COUNT(*) as c FROM beneficiary_consents`;
    console.log(`✅ beneficiary_consents: ${(count[0] as { c: string })?.c ?? 0} rows`);
  } catch (e) {
    console.warn('⚠️ beneficiary_consents seed skipped (run migrate first):', (e as Error).message);
  }
}

/**
 * Seed agent_float (PRD FR7.4) from agents: current_float = liquidity_balance, threshold = min_liquidity_required.
 * Idempotent: uses ON CONFLICT DO NOTHING.
 */
async function seedAgentFloat() {
  try {
    await sql`
      INSERT INTO agent_float (agent_id, current_float, float_threshold, overdraft_limit, updated_at)
      SELECT id, liquidity_balance, min_liquidity_required, 0, NOW()
      FROM agents
      ON CONFLICT (agent_id) DO NOTHING
    `;
    const count = await sql`SELECT COUNT(*) as c FROM agent_float`;
    console.log(`✅ agent_float: ${(count[0] as { c: string })?.c ?? 0} rows`);
  } catch (e) {
    console.warn('⚠️ agent_float seed skipped (run migrate first):', (e as Error).message);
  }
}

/**
 * Seed agent_coverage_by_region (PRD FR7.9): one row per region with first agent and beneficiary count.
 * Idempotent: skips if table already has rows.
 */
async function seedAgentCoverageByRegion() {
  try {
    const existing = await sql`SELECT COUNT(*) as c FROM agent_coverage_by_region`;
    if (Number((existing[0] as { c: string })?.c ?? 0) > 0) {
      console.log('⏭ agent_coverage_by_region already seeded, skipping');
      return;
    }
    const byRegion = await sql`
      SELECT region, COUNT(*) as beneficiary_count FROM beneficiaries WHERE status != 'deceased' GROUP BY region
    `;
    const agentsByLocation = await sql`
      SELECT id, location FROM agents WHERE type IN ('pos_agent', 'mobile_agent', 'mobile_unit') AND status = 'active'
    `;
    const regionToAgent: Record<string, string> = {};
    for (const a of agentsByLocation as Array<{ id: string; location: string }>) {
      if (!regionToAgent[a.location]) regionToAgent[a.location] = a.id;
    }
    let inserted = 0;
    for (const row of byRegion as Array<{ region: string; beneficiary_count: string }>) {
      const agentId = regionToAgent[row.region];
      if (!agentId) continue;
      try {
        await sql`
          INSERT INTO agent_coverage_by_region (region, agent_id, beneficiary_count, updated_at)
          VALUES (${row.region}, ${agentId}::uuid, ${Number(row.beneficiary_count) || 0}, NOW())
          ON CONFLICT (region, agent_id) DO NOTHING
        `;
        inserted++;
      } catch (_) {}
    }
    console.log(`✅ agent_coverage_by_region: ${inserted} rows`);
  } catch (e) {
    console.warn('⚠️ agent_coverage_by_region seed skipped (run migrate first):', (e as Error).message);
  }
}

async function seedNotifications() {
  try {
    const notificationsService = new NotificationsService();
    const { created } = await notificationsService.sync(7, 100);
    console.log(`✅ notifications: synced ${created} new`);
  } catch (e) {
    console.warn('⚠️ notifications sync skipped (run migrate first if notifications table is missing):', (e as Error).message);
  }
}

async function validate() {
  const [b, a, loc, v, s, w, r, n] = await Promise.all([
    sql`SELECT COUNT(*) as c FROM beneficiaries`,
    sql`SELECT COUNT(*) as c FROM agents`,
    sql`SELECT COUNT(*) as c FROM locations`.catch(() => [{ c: 0 }]),
    sql`SELECT COUNT(*) as c FROM vouchers`,
    sql`SELECT COUNT(*) as c FROM status_events`,
    sql`SELECT COUNT(*) as c FROM webhook_events`,
    sql`SELECT COUNT(*) as c FROM reconciliation_records`,
    sql`SELECT COUNT(*) as c FROM notifications WHERE deleted_at IS NULL`.catch(() => [{ c: 0 }]),
  ]);
  const counts = {
    beneficiaries: Number((b[0] as any)?.c ?? 0),
    agents: Number((a[0] as any)?.c ?? 0),
    locations: Number((loc[0] as any)?.c ?? 0),
    vouchers: Number((v[0] as any)?.c ?? 0),
    status_events: Number((s[0] as any)?.c ?? 0),
    webhook_events: Number((w[0] as any)?.c ?? 0),
    reconciliation_records: Number((r[0] as any)?.c ?? 0),
    notifications: Number((n[0] as any)?.c ?? 0),
  };
  console.log('\n--- Validation ---');
  console.log('  beneficiaries:', counts.beneficiaries);
  console.log('  agents:', counts.agents);
  console.log('  locations:', counts.locations);
  console.log('  vouchers:', counts.vouchers);
  console.log('  status_events:', counts.status_events);
  console.log('  webhook_events:', counts.webhook_events);
  console.log('  reconciliation_records:', counts.reconciliation_records);
  console.log('  notifications:', counts.notifications);
  const ok = counts.beneficiaries >= 1000 && counts.agents >= 300 && counts.vouchers >= 500;
  console.log(ok ? '\n✅ Validation passed.' : '\n⚠️  Run seed again to reach targets (1000 beneficiaries, 300 agents, 500+ vouchers).');
}

async function main() {
  console.log('Seeding database (1000 beneficiaries, 300 agents, locations, vouchers, issuance/disbursement/cashout, enrollment, verification)...\n');

  await seedBeneficiaries();
  await seedDependantsAndDeceased();
  await seedAgents();
  await seedMobileUnits();
  await seedLocations();
  await seedVouchersAndEvents();
  await seedBeneficiaryConsents();
  await seedAgentFloat();
  await seedAgentCoverageByRegion();
  await seedNotifications();
  await validate();

  console.log('\n✅ Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

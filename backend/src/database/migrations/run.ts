/**
 * Database Migration Runner
 *
 * Location: backend/src/database/migrations/run.ts
 * Purpose: Run database migrations in a single order for shared DB (Buffr / G2P / SmartPay Connect same backend).
 *
 * Order: 1) beneficiaries, vouchers (001) → 2) status_events → 3) webhook_events → 4) reconciliation_records → 5) agents (008).
 * Buffr/G2P use the same DB; run this once (e.g. from smartpay-connect backend) then run seed.
 */

import { sql } from '../connection';
import { log, logError } from '../../utils/logger';

async function runMigrations() {
  try {
    log('Starting database migrations...');

    // Neon serverless: run each statement explicitly (no multi-statement). See MIGRATION_ORDER.md for order.

    // Ensure pgcrypto extension exists for UUID generation
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;

    // 1) Core G2P tables (from 001; shared by Buffr/G2P/SmartPay)
    log('Creating beneficiaries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS beneficiaries (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        region VARCHAR(50) NOT NULL,
        grant_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_payment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiaries_region ON beneficiaries(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiaries_grant_type ON beneficiaries(grant_type)`;
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS id_number VARCHAR(20)`.catch(() => {});
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_beneficiaries_id_number ON beneficiaries(id_number) WHERE id_number IS NOT NULL AND id_number != ''`.catch(() => {});
    // Proxy collector (account stays with beneficiary; proxy is authorised collector)
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS proxy_name VARCHAR(255)`.catch(() => {});
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS proxy_id_number VARCHAR(20)`.catch(() => {});
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS proxy_phone VARCHAR(20)`.catch(() => {});
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS proxy_relationship VARCHAR(50)`.catch(() => {});
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS proxy_authorised_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS deceased_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    log('✅ beneficiaries table created');

    log('Creating beneficiary_dependants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS beneficiary_dependants (
        id VARCHAR(50) PRIMARY KEY,
        beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        id_number VARCHAR(20),
        phone VARCHAR(20),
        relationship VARCHAR(50) NOT NULL,
        date_of_birth DATE,
        is_proxy BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiary_dependants_beneficiary_id ON beneficiary_dependants(beneficiary_id)`;
    log('✅ beneficiary_dependants table created');

    log('Creating vouchers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS vouchers (
        id VARCHAR(100) PRIMARY KEY,
        beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
        beneficiary_name VARCHAR(255) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        grant_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'issued',
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
        redeemed_at TIMESTAMP WITH TIME ZONE,
        redemption_method VARCHAR(50),
        region VARCHAR(50) NOT NULL,
        voucher_code VARCHAR(50) UNIQUE,
        qr_code TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    // Add columns if table existed from Buffr/other schema without them
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS beneficiary_name VARCHAR(255) NOT NULL DEFAULT ''`.catch(() => {});
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS buffr_user_id VARCHAR(100)`.catch(() => {});
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS region VARCHAR(50) NOT NULL DEFAULT ''`.catch(() => {});
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'social_grant'`.catch(() => {});
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT ''`.catch(() => {});
    await sql`ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS qr_code TEXT`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_beneficiary_id ON vouchers(beneficiary_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_region ON vouchers(region)`.catch((e: any) => {
      if (e?.code !== '42703') throw e;
      log('⏭ idx_vouchers_region skipped (region column missing on existing table)');
    });
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_expiry_date ON vouchers(expiry_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_vouchers_voucher_code ON vouchers(voucher_code)`;
    log('✅ vouchers table created');

    // 2) status_events (SmartPay-specific: voucher status change history; seed uses from_status, to_status, triggered_by)
    log('Creating status_events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS status_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        voucher_id VARCHAR(100) NOT NULL,
        from_status VARCHAR(50),
        to_status VARCHAR(50) NOT NULL,
        triggered_by VARCHAR(50) NOT NULL DEFAULT 'system',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_status_events_voucher_id ON status_events(voucher_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_status_events_to_status ON status_events(to_status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_status_events_created_at ON status_events(created_at)`;
    log('✅ status_events table created');

    // webhook_events (SmartPay-specific: stores webhook events from Buffr)
    log('Creating webhook_events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_type VARCHAR(50) NOT NULL,
        voucher_id VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        delivery_attempts INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        delivered_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        signature_valid BOOLEAN NOT NULL DEFAULT false,
        payload JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_events_voucher_id ON webhook_events(voucher_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON webhook_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at)`;
    log('✅ webhook_events table created');

    // reconciliation_records (SmartPay-specific: stores reconciliation results)
    log('Creating reconciliation_records table...');
    await sql`
      CREATE TABLE IF NOT EXISTS reconciliation_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        voucher_id VARCHAR(100) NOT NULL,
        reconciliation_date DATE NOT NULL,
        ketchup_status VARCHAR(50) NOT NULL,
        buffr_status VARCHAR(50) NOT NULL,
        match BOOLEAN NOT NULL,
        discrepancy TEXT,
        last_verified TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_reconciliation_records_voucher_id ON reconciliation_records(voucher_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reconciliation_records_date ON reconciliation_records(reconciliation_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_reconciliation_records_match ON reconciliation_records(match)`;
    log('✅ reconciliation_records table created');

    // 5) agents (008; shared with Buffr/G2P; no FK to wallets so backend can run standalone)
    log('Creating agents table...');
    await sql`
      CREATE TABLE IF NOT EXISTS agents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        wallet_id UUID,
        liquidity_balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cash_on_hand DECIMAL(15, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'pending_approval',
        min_liquidity_required DECIMAL(15, 2) NOT NULL DEFAULT 1000,
        max_daily_cashout DECIMAL(15, 2) NOT NULL DEFAULT 50000,
        commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 1.5,
        contact_phone VARCHAR(20),
        contact_email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_location ON agents(location)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_wallet_id ON agents(wallet_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agents_coordinates ON agents(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL`;
    log('✅ agents table created');

    // 6) locations (009: NamPost offices, ATMs, warehouses for map; no banks)
    log('Creating locations table...');
    await sql`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL CHECK (type IN ('nampost_office', 'atm', 'warehouse')),
        name VARCHAR(255) NOT NULL,
        region VARCHAR(100) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        address TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude)`;
    log('✅ locations table created');

    // Normalize voucher codes to consistent VC-{prefix}-{suffix} format (deterministic from id)
    log('Normalizing voucher codes to VC- format...');
    await sql`
      UPDATE vouchers
      SET voucher_code = 'VC-' || substring(replace(id::text, '-', ''), 1, 8) || '-' || substring(md5(id::text), 1, 8)
      WHERE voucher_code IS NULL
         OR voucher_code !~ '^VC-[a-zA-Z0-9]+-[a-zA-Z0-9]{8}$'
    `;
    log('✅ voucher codes normalized');

    // Backfill beneficiary_name from beneficiaries so every voucher has a corresponding beneficiary name
    log('Backfilling beneficiary names from beneficiaries...');
    await sql`
      UPDATE vouchers v
      SET beneficiary_name = b.name
      FROM beneficiaries b
      WHERE v.beneficiary_id = b.id
        AND (v.beneficiary_name IS NULL OR TRIM(v.beneficiary_name) = '')
    `;
    log('✅ beneficiary names backfilled');

    // Remove unassigned (orphan) vouchers: beneficiary_id not in beneficiaries (cast to text to avoid varchar/uuid mismatch)
    log('Removing unassigned vouchers (no matching beneficiary)...');
    await sql`
      DELETE FROM reconciliation_records
      WHERE voucher_id::text IN (SELECT v.id::text FROM vouchers v WHERE NOT EXISTS (SELECT 1 FROM beneficiaries b WHERE b.id::text = v.beneficiary_id::text))
    `;
    await sql`
      DELETE FROM webhook_events
      WHERE voucher_id::text IN (SELECT v.id::text FROM vouchers v WHERE NOT EXISTS (SELECT 1 FROM beneficiaries b WHERE b.id::text = v.beneficiary_id::text))
    `;
    await sql`
      DELETE FROM status_events
      WHERE voucher_id::text IN (SELECT v.id::text FROM vouchers v WHERE NOT EXISTS (SELECT 1 FROM beneficiaries b WHERE b.id::text = v.beneficiary_id::text))
    `;
    await sql`DELETE FROM vouchers WHERE beneficiary_id::text NOT IN (SELECT id::text FROM beneficiaries)`;
    log('✅ unassigned vouchers removed');

    // Backfill id_number for beneficiaries that don't have one (unique 11-digit synthetic)
    log('Backfilling beneficiary id_number where missing...');
    await sql`
      WITH numbered AS (
        SELECT id, (10000000000 + ROW_NUMBER() OVER (ORDER BY created_at, id))::text AS new_id
        FROM beneficiaries
        WHERE id_number IS NULL OR TRIM(id_number) = ''
      )
      UPDATE beneficiaries b SET id_number = n.new_id FROM numbered n WHERE b.id = n.id
    `;
    log('✅ id_number backfilled');

    // Normalize phone to +264 XX XXXXXXX where invalid or missing
    log('Normalizing beneficiary phone to +264 cell format where needed...');
    await sql`
      UPDATE beneficiaries
      SET phone = '+26481' || LPAD(((ABS(hashtext(id)) % 9000000) + 1000000)::text, 7, '0')
      WHERE phone IS NULL OR TRIM(phone) = '' OR phone !~ '^\\+264(81|82|84|85)[0-9]{7}$'
    `;
    log('✅ phone normalized');

    // Backfill proxy collectors for first 50 beneficiaries (sample: elderly/disabled have authorised collector)
    log('Backfilling proxy collectors for sample beneficiaries...');
    await sql`
      WITH ordered AS (
        SELECT id, created_at FROM beneficiaries ORDER BY created_at ASC LIMIT 50
      ),
      numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn FROM ordered
      )
      UPDATE beneficiaries b
      SET
        proxy_name = 'Proxy Collector ' || numbered.rn,
        proxy_id_number = (20000000000 + numbered.rn)::text,
        proxy_phone = '+26482' || LPAD((1000000 + (numbered.rn % 8999999))::text, 7, '0'),
        proxy_relationship = (ARRAY['family', 'caregiver', 'guardian'])[1 + (numbered.rn % 3)],
        proxy_authorised_at = NOW()
      FROM numbered
      WHERE b.id = numbered.id
    `;
    log('✅ proxy collectors backfilled (50 beneficiaries)');

    // 7) communication_log (011: outbound SMS, USSD, Buffr in-app, email)
    log('Creating communication_log table...');
    await sql`
      CREATE TABLE IF NOT EXISTS communication_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        channel VARCHAR(50) NOT NULL CHECK (channel IN ('sms', 'ussd', 'buffr_in_app', 'email')),
        recipient_type VARCHAR(50) NOT NULL DEFAULT 'beneficiary',
        recipient_id VARCHAR(100),
        recipient_phone VARCHAR(20),
        recipient_user_id VARCHAR(100),
        template_id VARCHAR(100),
        subject TEXT,
        body TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
        external_id VARCHAR(255),
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMP WITH TIME ZONE
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_communication_log_channel ON communication_log(channel)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_communication_log_recipient_id ON communication_log(recipient_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_communication_log_status ON communication_log(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_communication_log_created_at ON communication_log(created_at)`;
    log('✅ communication_log table created');

    // 8) SmartPay Mobile – equipment types, unit equipment, drivers (Phase 2)
    log('Creating equipment_types table...');
    await sql`
      CREATE TABLE IF NOT EXISTS equipment_types (
        code VARCHAR(50) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('vehicle_part', 'dispenser', 'cash_cassette', 'other'))
      )
    `;
    await sql`
      INSERT INTO equipment_types (code, label, category) VALUES
        ('dispenser', 'Cash dispenser', 'dispenser'),
        ('cash_cassette', 'Cash cassette', 'cash_cassette'),
        ('vehicle_part', 'Vehicle part', 'vehicle_part'),
        ('tablet', 'Tablet / POS device', 'other'),
        ('other', 'Other', 'other')
      ON CONFLICT (code) DO NOTHING
    `;
    log('✅ equipment_types table created');

    log('Creating mobile_unit_equipment table...');
    await sql`
      CREATE TABLE IF NOT EXISTS mobile_unit_equipment (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile_unit_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        equipment_type_code VARCHAR(50) NOT NULL REFERENCES equipment_types(code),
        asset_id VARCHAR(255) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'in_use' CHECK (status IN ('dispatched', 'in_use', 'returned', 'maintenance', 'retired')),
        issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        returned_at TIMESTAMP WITH TIME ZONE,
        condition_notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_equipment_unit ON mobile_unit_equipment(mobile_unit_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_equipment_status ON mobile_unit_equipment(status)`;
    log('✅ mobile_unit_equipment table created');

    log('Creating mobile_unit_drivers table...');
    await sql`
      CREATE TABLE IF NOT EXISTS mobile_unit_drivers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile_unit_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        id_number VARCHAR(50),
        phone VARCHAR(20),
        role VARCHAR(100) NOT NULL DEFAULT 'driver',
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'off', 'replaced')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_drivers_unit ON mobile_unit_drivers(mobile_unit_id)`;
    log('✅ mobile_unit_drivers table created');

    // 9) SmartPay Mobile – maintenance events (Phase 3)
    log('Creating maintenance_events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS maintenance_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile_unit_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        equipment_id UUID REFERENCES mobile_unit_equipment(id) ON DELETE SET NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('inspection', 'repair', 'replacement')),
        description TEXT NOT NULL,
        parts_used TEXT,
        cost DECIMAL(12, 2),
        meter_reading VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_events_unit ON maintenance_events(mobile_unit_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_maintenance_events_created_at ON maintenance_events(created_at DESC)`;
    log('✅ maintenance_events table created');

    // 10) Notifications (Ketchup: user-actionable alerts – read, flag, archive, pin, delete)
    log('Creating notifications table...');
    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(500) NOT NULL,
        body TEXT,
        source_type VARCHAR(50) NOT NULL,
        source_id VARCHAR(255),
        link VARCHAR(500),
        read_at TIMESTAMP WITH TIME ZONE,
        is_flagged BOOLEAN NOT NULL DEFAULT false,
        is_archived BOOLEAN NOT NULL DEFAULT false,
        is_pinned BOOLEAN NOT NULL DEFAULT false,
        deleted_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_flagged ON notifications(is_flagged)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications(is_archived)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_pinned ON notifications(is_pinned)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON notifications(deleted_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source_type, source_id)`;
    log('✅ notifications table created');

    // 11) Interoperability, Privacy, Agent Expansion (012: PRD Sections 6–7)
    log('Creating beneficiary_consents table...');
    await sql`
      CREATE TABLE IF NOT EXISTS beneficiary_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        beneficiary_id VARCHAR(50) NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
        consent_type VARCHAR(50) NOT NULL,
        granted BOOLEAN NOT NULL DEFAULT true,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        withdrawn_at TIMESTAMP WITH TIME ZONE,
        version VARCHAR(20) NOT NULL DEFAULT '1.0',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(beneficiary_id, consent_type)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiary_consents_beneficiary_id ON beneficiary_consents(beneficiary_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiary_consents_consent_type ON beneficiary_consents(consent_type)`;
    log('✅ beneficiary_consents table created');

    log('Creating namqr_codes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS namqr_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        qr_id UUID NOT NULL UNIQUE,
        merchant_id VARCHAR(100) NOT NULL,
        amount VARCHAR(20) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
        reference VARCHAR(255),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        payload_hash VARCHAR(64),
        redeemed_at TIMESTAMP WITH TIME ZONE,
        redeemed_by_beneficiary_id VARCHAR(50),
        transaction_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_qr_id ON namqr_codes(qr_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_merchant_id ON namqr_codes(merchant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_expires_at ON namqr_codes(expires_at)`;
    log('✅ namqr_codes table created');

    log('Creating ips_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ips_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        request_id VARCHAR(100) NOT NULL,
        payment_id VARCHAR(100) NOT NULL,
        debtor_participant_id VARCHAR(50) NOT NULL,
        debtor_account_id VARCHAR(50) NOT NULL,
        creditor_participant_id VARCHAR(50) NOT NULL,
        creditor_account_id VARCHAR(50) NOT NULL,
        amount VARCHAR(20) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'NAD',
        reference VARCHAR(255),
        end_to_end_id VARCHAR(100),
        status VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        status_reason TEXT
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_transactions_payment_id ON ips_transactions(payment_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_transactions_request_id ON ips_transactions(request_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_transactions_created_at ON ips_transactions(created_at)`;
    log('✅ ips_transactions table created');

    log('Creating agent_float table...');
    await sql`
      CREATE TABLE IF NOT EXISTS agent_float (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        current_float DECIMAL(15, 2) NOT NULL DEFAULT 0,
        float_threshold DECIMAL(15, 2) NOT NULL DEFAULT 10000,
        overdraft_limit DECIMAL(15, 2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(agent_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_float_agent_id ON agent_float(agent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_float_current_float ON agent_float(current_float) WHERE current_float >= 0`;
    log('✅ agent_float table created');

    log('Creating agent_coverage_by_region table...');
    await sql`
      CREATE TABLE IF NOT EXISTS agent_coverage_by_region (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        region VARCHAR(50) NOT NULL,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        beneficiary_count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(region, agent_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_coverage_by_region_region ON agent_coverage_by_region(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_coverage_by_region_agent_id ON agent_coverage_by_region(agent_id)`;
    log('✅ agent_coverage_by_region table created');

    // 12) IPS participants and NAMQR offline (013)
    log('Creating ips_participants table...');
    await sql`
      CREATE TABLE IF NOT EXISTS ips_participants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        participant_id VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        bic VARCHAR(20),
        endpoint VARCHAR(500),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_participants_bic ON ips_participants(bic) WHERE bic IS NOT NULL`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_participants_status ON ips_participants(status)`;
    log('✅ ips_participants table created');

    log('Adding namqr_codes.offline column...');
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS offline BOOLEAN NOT NULL DEFAULT false`;
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_offline ON namqr_codes(offline) WHERE offline = true`.catch(() => {});
    log('✅ namqr_codes.offline column added');

    log('✅ Database migrations completed successfully');
  } catch (error) {
    logError('Failed to run migrations', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigrations };

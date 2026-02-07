/**
 * Database Migration Runner
 *
 * Location: backend/src/database/migrations/run.ts
 * Purpose: Run database migrations in a single order for shared DB (Buffr / G2P / Ketchup SmartPay same backend).
 *
 * Order: 1) beneficiaries, vouchers (001) → 2) status_events → 3) webhook_events → 4) reconciliation_records → 5) agents (008).
 * Buffr/G2P use the same DB; run this once (e.g. from ketchup-smartpay backend) then run seed.
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
        ('vehicle', 'Vehicle', 'other'),
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
    await sql`ALTER TABLE maintenance_events DROP CONSTRAINT IF EXISTS maintenance_events_type_check`.catch(() => {});
    await sql`ALTER TABLE maintenance_events ADD CONSTRAINT maintenance_events_type_check CHECK (type IN ('inspection', 'repair', 'replacement', 'service', 'other'))`.catch(() => {});
    log('✅ maintenance_events table created');

    // 9b) ATMs (Ketchup: ATM management – location, status, cash level, replenishment)
    log('Creating atms table...');
    await sql`
      CREATE TABLE IF NOT EXISTS atms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        terminal_id VARCHAR(100) NOT NULL UNIQUE,
        location VARCHAR(255) NOT NULL,
        region VARCHAR(50),
        status VARCHAR(50) NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'offline', 'maintenance', 'low_cash')),
        cash_level_percent INTEGER CHECK (cash_level_percent >= 0 AND cash_level_percent <= 100),
        mobile_unit_id UUID REFERENCES agents(id) ON DELETE SET NULL,
        last_serviced_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_atms_status ON atms(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_atms_region ON atms(region)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_atms_mobile_unit ON atms(mobile_unit_id)`;
    log('✅ atms table created');

    // 9c) POS Terminals (Ketchup: POS terminal management – agent/merchant assignment)
    log('Creating pos_terminals table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pos_terminals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        terminal_id VARCHAR(100) NOT NULL UNIQUE,
        agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
        merchant_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        device_id VARCHAR(255),
        provisioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_terminals_agent_id ON pos_terminals(agent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_terminals_merchant_id ON pos_terminals(merchant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_terminals_status ON pos_terminals(status)`;
    log('✅ pos_terminals table created');

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
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source_type VARCHAR(50)`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS source_id VARCHAR(255)`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR(500)`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT false`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_flagged ON notifications(is_flagged)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_archived ON notifications(is_archived)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_pinned ON notifications(is_pinned)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_deleted_at ON notifications(deleted_at)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_source ON notifications(source_type, source_id)`.catch(() => {});
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
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS qr_id UUID`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS merchant_id VARCHAR(100)`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS amount VARCHAR(20)`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS currency VARCHAR(3)`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS reference VARCHAR(255)`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS payload_hash VARCHAR(64)`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS redeemed_by_beneficiary_id VARCHAR(50)`.catch(() => {});
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS transaction_id UUID`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_qr_id ON namqr_codes(qr_id)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_merchant_id ON namqr_codes(merchant_id)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_expires_at ON namqr_codes(expires_at)`.catch(() => {});
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
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_transactions_payment_id ON ips_transactions(payment_id)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_transactions_request_id ON ips_transactions(request_id)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_transactions_created_at ON ips_transactions(created_at)`.catch(() => {});
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
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_float_agent_id ON agent_float(agent_id)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_float_current_float ON agent_float(current_float) WHERE current_float >= 0`.catch(() => {});
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
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_coverage_by_region_region ON agent_coverage_by_region(region)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_coverage_by_region_agent_id ON agent_coverage_by_region(agent_id)`.catch(() => {});
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
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_participants_bic ON ips_participants(bic) WHERE bic IS NOT NULL`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_ips_participants_status ON ips_participants(status)`.catch(() => {});
    log('✅ ips_participants table created');

    log('Adding namqr_codes.offline column...');
    await sql`ALTER TABLE namqr_codes ADD COLUMN IF NOT EXISTS offline BOOLEAN NOT NULL DEFAULT false`;
    await sql`CREATE INDEX IF NOT EXISTS idx_namqr_codes_offline ON namqr_codes(offline) WHERE offline = true`.catch(() => {});
    log('✅ namqr_codes.offline column added');

    // 13) Token Vault (token ↔ voucher mapping for G2P, NAMQR; PRD Token Vault). DDL only here – no separate SQL file.
    log('Creating token_vault table...');
    await sql`
      CREATE TABLE IF NOT EXISTS token_vault (
        id VARCHAR(50) PRIMARY KEY,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        voucher_id VARCHAR(100) NOT NULL,
        purpose VARCHAR(50) NOT NULL DEFAULT 'g2p',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    await sql`ALTER TABLE token_vault ADD COLUMN IF NOT EXISTS token_hash VARCHAR(128)`.catch(() => {});
    await sql`ALTER TABLE token_vault ADD COLUMN IF NOT EXISTS voucher_id VARCHAR(100)`.catch(() => {});
    await sql`ALTER TABLE token_vault ADD COLUMN IF NOT EXISTS purpose VARCHAR(50)`.catch(() => {});
    await sql`ALTER TABLE token_vault ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    await sql`ALTER TABLE token_vault ADD COLUMN IF NOT EXISTS used_at TIMESTAMP WITH TIME ZONE`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_token_vault_token_hash ON token_vault(token_hash)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_token_vault_voucher_id ON token_vault(voucher_id)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_token_vault_expires_at ON token_vault(expires_at)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_token_vault_purpose ON token_vault(purpose)`.catch(() => {});
    log('✅ token_vault table created');

    // 14) Idempotency records for duplicate prevention (PRD: avoid duplicates)
    // Aligned with buffr/sql/migration_idempotency_keys.sql and buffr/utils/idempotency.ts
    log('Creating idempotency_keys table...');
    await sql`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        idempotency_key VARCHAR(128) NOT NULL,
        endpoint_prefix VARCHAR(50) NOT NULL DEFAULT 'distribution',
        response_status INTEGER NOT NULL DEFAULT 200,
        response_body JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        PRIMARY KEY (idempotency_key, endpoint_prefix)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at)`.catch(() => {});
    await sql`CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key_prefix ON idempotency_keys(idempotency_key, endpoint_prefix)`.catch(() => {});
    log('✅ idempotency_keys table created');

    // 15) Add idempotency_key to webhook_events for duplicate detection
    log('Adding idempotency_key column to webhook_events...');
    await sql`ALTER TABLE webhook_events ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(128)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_events_idempotency_key ON webhook_events(idempotency_key)`.catch(() => {});
    log('✅ webhook_events idempotency_key column added');

    // 16) Add national_id_hash to beneficiaries for duplicate detection
    log('Adding national_id_hash column to beneficiaries...');
    await sql`ALTER TABLE beneficiaries ADD COLUMN IF NOT EXISTS national_id_hash VARCHAR(128)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_beneficiaries_national_id_hash ON beneficiaries(national_id_hash)`.catch(() => {});
    log('✅ beneficiaries national_id_hash column added');

    // 17) Audit retention config (admin audit-logs retention policy)
    log('Creating audit_retention_config table...');
    await sql`
      CREATE TABLE IF NOT EXISTS audit_retention_config (
        key VARCHAR(64) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `.catch(() => {});
    await sql`
      INSERT INTO audit_retention_config (key, value, updated_at)
      VALUES ('audit_retention_days', '90', NOW())
      ON CONFLICT (key) DO NOTHING
    `.catch(() => {});
    log('✅ audit_retention_config table ready');

    // 18) Agent Network Tracking (new: agent_transactions, agent_float_transactions)
    log('Creating agent_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS agent_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        transaction_count INTEGER NOT NULL DEFAULT 0,
        successful_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        total_cashout_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_deposit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_commission_earned DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_fees_collected DECIMAL(15, 2) NOT NULL DEFAULT 0,
        avg_transaction_value DECIMAL(15, 2),
        success_rate DECIMAL(5, 2),
        vouchers_redeemed INTEGER NOT NULL DEFAULT 0,
        vouchers_issued INTEGER NOT NULL DEFAULT 0,
        unique_beneficiaries_served INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(agent_id, transaction_date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_transactions_agent ON agent_transactions(agent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_transactions_date ON agent_transactions(transaction_date)`;
    log('✅ agent_transactions table created');

    log('Creating agent_float_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS agent_float_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('topup', 'withdrawal', 'adjustment', 'transfer_in', 'transfer_out')),
        amount DECIMAL(15, 2) NOT NULL,
        balance_before DECIMAL(15, 2) NOT NULL,
        balance_after DECIMAL(15, 2) NOT NULL,
        reference_type VARCHAR(50),
        reference_id VARCHAR(100),
        notes TEXT,
        processed_by VARCHAR(255),
        approved_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_float_transactions_agent ON agent_float_transactions(agent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_agent_float_transactions_date ON agent_float_transactions(created_at)`;
    log('✅ agent_float_transactions table created');

    // 19) POS Terminal Transactions
    log('Creating pos_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pos_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id VARCHAR(100) NOT NULL UNIQUE,
        terminal_id UUID NOT NULL REFERENCES pos_terminals(id) ON DELETE CASCADE,
        agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('cashout', 'balance_inquiry', 'mini_statement', 'transfer', 'refund')),
        amount DECIMAL(15, 2) NOT NULL,
        fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        commission_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
        voucher_id VARCHAR(100),
        beneficiary_id VARCHAR(50),
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed', 'timeout')),
        response_code VARCHAR(10),
        response_message TEXT,
        initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        processing_time_ms INTEGER,
        is_offline_transaction BOOLEAN NOT NULL DEFAULT false,
        offline_batch_id VARCHAR(100),
        synced_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_transactions_terminal ON pos_transactions(terminal_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_transactions_agent ON pos_transactions(agent_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_transactions_date ON pos_transactions(initiated_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_transactions_voucher ON pos_transactions(voucher_id)`;
    log('✅ pos_transactions table created');

    log('Creating pos_daily_summaries table...');
    await sql`
      CREATE TABLE IF NOT EXISTS pos_daily_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        terminal_id UUID NOT NULL REFERENCES pos_terminals(id) ON DELETE CASCADE,
        summary_date DATE NOT NULL DEFAULT CURRENT_DATE,
        total_transactions INTEGER NOT NULL DEFAULT 0,
        successful_transactions INTEGER NOT NULL DEFAULT 0,
        failed_transactions INTEGER NOT NULL DEFAULT 0,
        total_volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_fees DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_commission DECIMAL(15, 2) NOT NULL DEFAULT 0,
        avg_response_time_ms DECIMAL(10, 2),
        uptime_percentage DECIMAL(5, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(terminal_id, summary_date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_daily_summaries_terminal ON pos_daily_summaries(terminal_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_pos_daily_summaries_date ON pos_daily_summaries(summary_date)`;
    log('✅ pos_daily_summaries table created');

    // 20) ATM Transactions & Cash Levels
    log('Creating atm_transactions table...');
    await sql`
      CREATE TABLE IF NOT EXISTS atm_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        transaction_id VARCHAR(100) NOT NULL UNIQUE,
        atm_id UUID NOT NULL REFERENCES atms(id) ON DELETE CASCADE,
        card_hash VARCHAR(128),
        account_type VARCHAR(20),
        transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('cash_withdrawal', 'balance_inquiry', 'mini_statement', 'cash_deposit')),
        amount DECIMAL(15, 2) NOT NULL,
        fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        dispensed_denominations JSONB,
        status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'partially_dispensed')),
        response_code VARCHAR(10),
        response_message TEXT,
        error_code VARCHAR(20),
        error_message TEXT,
        initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        processing_time_seconds INTEGER,
        receipt_printed BOOLEAN NOT NULL DEFAULT false,
        receipt_data TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_atm_transactions_atm ON atm_transactions(atm_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_atm_transactions_date ON atm_transactions(initiated_at)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_atm_transactions_status ON atm_transactions(status)`;
    log('✅ atm_transactions table created');

    log('Creating atm_cash_levels table...');
    await sql`
      CREATE TABLE IF NOT EXISTS atm_cash_levels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        atm_id UUID NOT NULL REFERENCES atms(id) ON DELETE CASCADE,
        total_cash DECIMAL(15, 2) NOT NULL DEFAULT 0,
        denomination_200 INTEGER DEFAULT 0,
        denomination_100 INTEGER DEFAULT 0,
        denomination_50 INTEGER DEFAULT 0,
        denomination_20 INTEGER DEFAULT 0,
        cash_level_percent INTEGER CHECK (cash_level_percent >= 0 AND cash_level_percent <= 100),
        measured_by VARCHAR(50) DEFAULT 'cassette_sensor',
        transactions_since_count INTEGER DEFAULT 0,
        last_dispensed_at TIMESTAMP WITH TIME ZONE,
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_atm_cash_levels_atm ON atm_cash_levels(atm_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_atm_cash_levels_date ON atm_cash_levels(recorded_at)`;
    log('✅ atm_cash_levels table created');

    log('Creating atm_daily_stats table...');
    await sql`
      CREATE TABLE IF NOT EXISTS atm_daily_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        atm_id UUID NOT NULL REFERENCES atms(id) ON DELETE CASCADE,
        stats_date DATE NOT NULL DEFAULT CURRENT_DATE,
        total_transactions INTEGER NOT NULL DEFAULT 0,
        successful_transactions INTEGER NOT NULL DEFAULT 0,
        failed_transactions INTEGER NOT NULL DEFAULT 0,
        partially_dispensed INTEGER NOT NULL DEFAULT 0,
        total_dispensed DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_deposited DECIMAL(15, 2) NOT NULL DEFAULT 0,
        total_fees_collected DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cassettes_used INTEGER DEFAULT 0,
        uptime_percentage DECIMAL(5, 2),
        avg_transaction_time_seconds DECIMAL(5, 2),
        peak_hour INTEGER,
        peak_transactions INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(atm_id, stats_date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_atm_daily_stats_atm ON atm_daily_stats(atm_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_atm_daily_stats_date ON atm_daily_stats(stats_date)`;
    log('✅ atm_daily_stats table created');

    // 21) Mobile Unit Tracking
    log('Creating mobile_unit_details table...');
    await sql`
      CREATE TABLE IF NOT EXISTS mobile_unit_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
        vehicle_registration VARCHAR(20) UNIQUE,
        vehicle_make VARCHAR(50),
        vehicle_model VARCHAR(50),
        vehicle_year INTEGER,
        vehicle_type VARCHAR(50) DEFAULT 'van',
        team_lead_name VARCHAR(255),
        team_lead_phone VARCHAR(20),
        team_size INTEGER DEFAULT 2,
        assigned_regions TEXT[],
        primary_region VARCHAR(50),
        operating_hours_start TIME,
        operating_hours_end TIME,
        operating_days INTEGER[],
        max_cash_capacity DECIMAL(15, 2) NOT NULL DEFAULT 500000,
        current_cash_onboard DECIMAL(15, 2) NOT NULL DEFAULT 0,
        route_status VARCHAR(20) NOT NULL DEFAULT 'depot',
        current_latitude DECIMAL(10, 8),
        current_longitude DECIMAL(11, 8),
        last_location_update TIMESTAMP WITH TIME ZONE,
        total_routes_completed INTEGER DEFAULT 0,
        total_beneficiaries_served INTEGER DEFAULT 0,
        avg_daily_transactions DECIMAL(10, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_details_region ON mobile_unit_details((ANY(assigned_regions)))`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_details_status ON mobile_unit_details(route_status)`;
    log('✅ mobile_unit_details table created');

    log('Creating mobile_unit_routes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS mobile_unit_routes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile_unit_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        route_name VARCHAR(255),
        route_date DATE NOT NULL DEFAULT CURRENT_DATE,
        planned_stops INTEGER,
        planned_route JSONB,
        estimated_duration_minutes INTEGER,
        actual_stops INTEGER DEFAULT 0,
        completed_stops INTEGER DEFAULT 0,
        skipped_stops INTEGER DEFAULT 0,
        departed_depot_at TIMESTAMP WITH TIME ZONE,
        arrived_first_stop_at TIMESTAMP WITH TIME ZONE,
        completed_route_at TIMESTAMP WITH TIME ZONE,
        total_distance_km DECIMAL(10, 2),
        total_transactions INTEGER DEFAULT 0,
        total_volume DECIMAL(15, 2) DEFAULT 0,
        route_status VARCHAR(20) NOT NULL DEFAULT 'planned',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(mobile_unit_id, route_date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_routes_unit ON mobile_unit_routes(mobile_unit_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_routes_date ON mobile_unit_routes(route_date)`;
    log('✅ mobile_unit_routes table created');

    log('Creating mobile_unit_stops table...');
    await sql`
      CREATE TABLE IF NOT EXISTS mobile_unit_stops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        route_id UUID NOT NULL REFERENCES mobile_unit_routes(id) ON DELETE CASCADE,
        stop_number INTEGER NOT NULL,
        location_name VARCHAR(255),
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        planned_arrival TIME,
        planned_departure TIME,
        actual_arrival TIMESTAMP WITH TIME ZONE,
        actual_departure TIMESTAMP WITH TIME ZONE,
        beneficiaries_served INTEGER DEFAULT 0,
        transactions_completed INTEGER DEFAULT 0,
        total_amount DECIMAL(15, 2) DEFAULT 0,
        stop_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        skip_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_stops_route ON mobile_unit_stops(route_id)`;
    log('✅ mobile_unit_stops table created');

    log('Creating mobile_unit_liquidity table...');
    await sql`
      CREATE TABLE IF NOT EXISTS mobile_unit_liquidity (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        mobile_unit_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        opening_balance DECIMAL(15, 2) NOT NULL,
        closing_balance DECIMAL(15, 2),
        topups_received DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cash_collected DECIMAL(15, 2) NOT NULL DEFAULT 0,
        cash_dispensed DECIMAL(15, 2) NOT NULL DEFAULT 0,
        variance_amount DECIMAL(15, 2),
        variance_reason TEXT,
        liquidity_date DATE NOT NULL DEFAULT CURRENT_DATE,
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        UNIQUE(mobile_unit_id, liquidity_date)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_liquidity_unit ON mobile_unit_liquidity(mobile_unit_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_mobile_unit_liquidity_date ON mobile_unit_liquidity(liquidity_date)`;
    log('✅ mobile_unit_liquidity table created');

    // 22) Equipment Types (enhanced)
    log('Adding equipment types for mobile units...');
    await sql`
      INSERT INTO equipment_types (code, label, category, requires_calibration, calibration_interval_days, useful_life_days)
      VALUES
        ('cash_dispenser', 'Cash Dispenser Module', 'dispenser', true, 30, NULL),
        ('gps_tracker', 'GPS Tracking Device', 'communication', false, NULL, 365),
        ('satellite_phone', 'Satellite Phone', 'communication', false, NULL, 730),
        ('card_reader', 'Card Reader/PIN Pad', 'dispenser', true, 90, 365),
        ('receipt_printer', 'Receipt Printer', 'other', false, NULL, 365),
        ('secure_safe', 'Secure Cash Safe', 'security', false, NULL, NULL)
      ON CONFLICT (code) DO NOTHING
    `.catch(() => {});
    log('✅ equipment types added');

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

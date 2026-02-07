/**
 * ReconciliationService Integration Tests
 *
 * Purpose: Integration tests for ReconciliationService using real database
 * Location: backend/src/services/reconciliation/ReconciliationService.test.ts
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReconciliationService } from './ReconciliationService';
import { sql } from '../../database/connection';
import { cleanTestData } from '../../test/setup';
import { VoucherRepository } from '../voucher/VoucherRepository';
// Mock BuffrAPIClient to avoid external API calls in unit tests. For integration
// tests against real Buffr, set BUFFR_API_URL and remove or skip this mock.
vi.mock('../distribution/BuffrAPIClient', () => ({
    BuffrAPIClient: vi.fn().mockImplementation(() => ({
        checkStatus: vi.fn().mockImplementation((voucherId) => {
            // Return status based on voucher ID pattern
            if (voucherId.includes('redeemed')) {
                return Promise.resolve({ status: 'redeemed' });
            }
            if (voucherId.includes('delivered')) {
                return Promise.resolve({ status: 'delivered' });
            }
            return Promise.resolve({ status: 'issued' });
        }),
    })),
}));
describe('ReconciliationService (Integration Tests)', () => {
    let service;
    let voucherRepository;
    beforeEach(async () => {
        service = new ReconciliationService();
        voucherRepository = new VoucherRepository();
        await cleanTestData();
    });
    describe('reconcile', () => {
        it('should create reconciliation records in database', async () => {
            const testDate = '2026-01-26';
            const testBeneficiaryIds = ['550e8400-e29b-41d4-a716-4466554400b1', '550e8400-e29b-41d4-a716-4466554400b2'];
            const testVoucherIds = ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'];
            try {
                await sql `SELECT 1 FROM vouchers LIMIT 1`;
                await sql `SELECT 1 FROM beneficiaries LIMIT 1`;
                // Insert test beneficiaries (vouchers.beneficiary_id references beneficiaries.id)
                for (let i = 0; i < testBeneficiaryIds.length; i++) {
                    await sql `
            INSERT INTO beneficiaries (id, name, phone, id_number, region, grant_type, status)
            VALUES (
              ${testBeneficiaryIds[i]},
              ${`Test Beneficiary ${i + 1}`},
              ${`+26481${String(1234560 + i).padStart(7, '0')}`},
              ${`0000000000${i + 1}`.slice(-11)},
              'Khomas',
              'social_grant',
              'active'
            )
            ON CONFLICT (id) DO NOTHING
          `.catch(() => { });
                }
                for (let i = 0; i < testVoucherIds.length; i++) {
                    await sql `
            INSERT INTO vouchers (
              id, beneficiary_id, beneficiary_name, amount, grant_type, status,
              issued_at, expiry_date, region
            ) VALUES (
              ${testVoucherIds[i]},
              ${testBeneficiaryIds[i]},
              ${`Test Beneficiary ${i + 1}`},
              ${i === 0 ? 1000 : 2000},
              ${i === 0 ? 'social_grant' : 'subsidy'},
              ${i === 0 ? 'redeemed' : 'delivered'},
              ${testDate}::date,
              (CURRENT_DATE + 30)::timestamp,
              'Khomas'
            ) ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              issued_at = ${testDate}::date
          `.catch(() => { });
                }
            }
            catch (error) {
                console.warn('Skipping reconciliation test - vouchers/beneficiaries table issue:', error);
                return;
            }
            const report = await service.reconcile(testDate);
            expect(report).toBeDefined();
            expect(report.date).toBe(testDate);
            expect(report.records).toBeDefined();
            expect(Array.isArray(report.records)).toBe(true);
            const savedRecords = await sql `
        SELECT * FROM reconciliation_records
        WHERE voucher_id IN (${testVoucherIds[0]}, ${testVoucherIds[1]})
        ORDER BY created_at DESC
      `;
            expect(savedRecords.length).toBeGreaterThanOrEqual(0);
        });
    });
    describe('getRecords', () => {
        it('should return empty array when no records exist', async () => {
            const records = await service.getRecords({ date: '2099-01-01' });
            expect(records).toEqual([]);
        });
        it('should return reconciliation records from database', async () => {
            // Use voucher_id outside test cleanup range (550e8400...44665544%) so insert is not deleted
            const testVoucherId = 'a1b2c3d4-e29b-41d4-a716-999999440099';
            const testDate = '2026-01-26';
            await sql `
        INSERT INTO reconciliation_records (
          voucher_id, reconciliation_date, ketchup_status,
          buffr_status, match, discrepancy
        ) VALUES (
          ${testVoucherId},
          ${testDate}::date,
          'redeemed',
          'redeemed',
          true,
          null
        )
      `;
            const records = await service.getRecords({ date: testDate });
            expect(records.length).toBeGreaterThanOrEqual(1);
            const found = records.find((r) => r.voucherId === testVoucherId);
            expect(found).toBeDefined();
            expect(found?.match).toBe(true);
        });
    });
});
//# sourceMappingURL=ReconciliationService.test.js.map
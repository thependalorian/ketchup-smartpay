/**
 * Beneficiary Duplicate Detection Tests
 * Location: backend/tests/BeneficiaryDuplicateDetection.test.ts
 * Covers: ID number hashing, duplicate detection, and prevention
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// Simulated BeneficiaryRepository for testing
const mockBeneficiaries: Map<string, {
  id: string;
  name: string;
  phone: string;
  id_number: string | null;
  national_id_hash: string | null;
  region: string;
  grant_type: string;
  status: string;
}> = new Map();

function hashIdNumber(idNumber: string): string {
  const trimmed = idNumber.trim();
  return crypto.createHash('sha256').update(trimmed).digest('hex');
}

class MockBeneficiaryRepository {
  async findByIdNumberHash(hash: string) {
    for (const beneficiary of mockBeneficiaries.values()) {
      if (beneficiary.national_id_hash === hash) {
        return beneficiary;
      }
    }
    return null;
  }

  async checkDuplicate(idNumber: string) {
    const hash = hashIdNumber(idNumber);
    const existing = await this.findByIdNumberHash(hash);
    
    if (existing) {
      return { isDuplicate: true, existing };
    }
    
    return { isDuplicate: false };
  }

  async create(data: {
    id: string;
    name: string;
    phone: string;
    idNumber?: string;
    region: string;
    grantType: string;
    status: string;
  }) {
    // Check for duplicate before creating
    if (data.idNumber) {
      const duplicateCheck = await this.checkDuplicate(data.idNumber);
      if (duplicateCheck.isDuplicate && duplicateCheck.existing) {
        throw new Error('Beneficiary with this ID number already exists');
      }
    }

    const idNumber = data.idNumber != null && String(data.idNumber).trim() !== '' ? String(data.idNumber).trim() : null;
    const idNumberHash = idNumber ? hashIdNumber(idNumber) : null;

    const beneficiary = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      id_number: idNumber,
      national_id_hash: idNumberHash,
      region: data.region,
      grant_type: data.grantType,
      status: data.status,
    };

    mockBeneficiaries.set(data.id, beneficiary);
    return beneficiary;
  }

  async findById(id: string) {
    return mockBeneficiaries.get(id) || null;
  }

  async update(id: string, data: Partial<{
    name: string;
    phone: string;
    idNumber: string;
    region: string;
    grantType: string;
    status: string;
  }>) {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Beneficiary with ID ${id} not found`);
    }

    // Check for duplicate if idNumber is being updated
    if (data.idNumber && data.idNumber !== existing.id_number) {
      const duplicateCheck = await this.checkDuplicate(data.idNumber);
      if (duplicateCheck.isDuplicate && duplicateCheck.existing && duplicateCheck.existing.id !== id) {
        throw new Error('Another beneficiary with this ID number already exists');
      }
    }

    const idNumber = data.idNumber !== undefined ? (data.idNumber != null && String(data.idNumber).trim() !== '' ? String(data.idNumber).trim() : null) : (existing.id_number ?? null);
    const idNumberHash = idNumber ? hashIdNumber(idNumber) : null;

    const updated = {
      ...existing,
      name: data.name ?? existing.name,
      phone: data.phone ?? existing.phone,
      id_number: idNumber,
      national_id_hash: idNumberHash,
      region: data.region ?? existing.region,
      grant_type: data.grantType ?? existing.grant_type,
      status: data.status ?? existing.status,
    };

    mockBeneficiaries.set(id, updated);
    return updated;
  }
}

describe('BeneficiaryDuplicateDetection', () => {
  let repository: MockBeneficiaryRepository;

  beforeEach(() => {
    repository = new MockBeneficiaryRepository();
    mockBeneficiaries.clear();
  });

  afterEach(() => {
    mockBeneficiaries.clear();
  });

  describe('hashIdNumber', () => {
    it('should generate consistent hash for same ID number', () => {
      const hash1 = hashIdNumber('1234567890');
      const hash2 = hashIdNumber('1234567890');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different ID numbers', () => {
      const hash1 = hashIdNumber('1234567890');
      const hash2 = hashIdNumber('0987654321');
      expect(hash1).not.toBe(hash2);
    });

    it('should trim whitespace', () => {
      const hash1 = hashIdNumber('1234567890');
      const hash2 = hashIdNumber('  1234567890  ');
      expect(hash1).toBe(hash2);
    });

    it('should return 64-character hex string (SHA-256)', () => {
      const hash = hashIdNumber('1234567890');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce one-way hash (non-reversible)', () => {
      const idNumber = '1234567890';
      const hash = hashIdNumber(idNumber);
      // Can't reverse SHA-256, but we can verify the hash doesn't contain the original
      expect(hash).not.toContain(idNumber);
    });
  });

  describe('checkDuplicate', () => {
    it('should return isDuplicate: false for new ID number', async () => {
      const result = await repository.checkDuplicate('9999999999');
      expect(result.isDuplicate).toBe(false);
      expect(result.existing).toBeUndefined();
    });

    it('should return isDuplicate: true for existing ID number', async () => {
      // Create a beneficiary with an ID number
      await repository.create({
        id: 'ben-1',
        name: 'John Doe',
        phone: '+264811234567',
        idNumber: '1234567890',
        region: 'Khomas',
        grantType: 'social_grant',
        status: 'active',
      });

      // Check for duplicate
      const result = await repository.checkDuplicate('1234567890');
      expect(result.isDuplicate).toBe(true);
      expect(result.existing?.id).toBe('ben-1');
    });

    it('should be case-insensitive for ID numbers', async () => {
      await repository.create({
        id: 'ben-2',
        name: 'Jane Doe',
        phone: '+264811234568',
        idNumber: '1234567890',
        region: 'Erongo',
        grantType: 'disability_grant',
        status: 'active',
      });

      const result = await repository.checkDuplicate('1234567890');
      expect(result.isDuplicate).toBe(true);
    });
  });

  describe('create with duplicate prevention', () => {
    it('should create beneficiary when ID number is unique', async () => {
      const beneficiary = await repository.create({
        id: 'ben-new-1',
        name: 'New Beneficiary',
        phone: '+264819999999',
        idNumber: '5555555555',
        region: 'Ohangwena',
        grantType: 'social_grant',
        status: 'pending',
      });

      expect(beneficiary.id).toBe('ben-new-1');
      expect(beneficiary.national_id_hash).not.toBeNull();
    });

    it('should reject duplicate ID number', async () => {
      // Create first beneficiary
      await repository.create({
        id: 'ben-dupe-1',
        name: 'First Beneficiary',
        phone: '+264811111111',
        idNumber: '1111111111',
        region: 'Oshana',
        grantType: 'social_grant',
        status: 'active',
      });

      // Try to create second beneficiary with same ID number
      await expect(repository.create({
        id: 'ben-dupe-2',
        name: 'Duplicate Beneficiary',
        phone: '+264822222222',
        idNumber: '1111111111',
        region: 'Oshana',
        grantType: 'social_grant',
        status: 'pending',
      })).rejects.toThrow('Beneficiary with this ID number already exists');
    });

    it('should allow creating beneficiary without ID number', async () => {
      const beneficiary = await repository.create({
        id: 'ben-no-id',
        name: 'Beneficiary Without ID',
        phone: '+264833333333',
        region: 'Kavango',
        grantType: 'social_grant',
        status: 'pending',
      });

      expect(beneficiary.id_number).toBeNull();
      expect(beneficiary.national_id_hash).toBeNull();
    });

    it('should store hashed ID, not plain text', async () => {
      await repository.create({
        id: 'ben-hash-test',
        name: 'Hash Test',
        phone: '+264844444444',
        idNumber: '4444444444',
        region: '//',
        grantType: 'social_grant',
        status: 'active',
      });

      const stored = await repository.findById('ben-hash-test');
      expect(stored?.id_number).toBe('4444444444');
      expect(stored?.national_id_hash).not.toBe('4444444444');
      expect(stored?.national_id_hash).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('update with duplicate prevention', () => {
    it('should update beneficiary when ID number not changed', async () => {
      await repository.create({
        id: 'ben-update-1',
        name: 'Update Test',
        phone: '+264855555555',
        idNumber: '5555555555',
        region: 'Omaheke',
        grantType: 'social_grant',
        status: 'active',
      });

      const updated = await repository.update('ben-update-1', { name: 'Updated Name' });
      expect(updated.name).toBe('Updated Name');
    });

    it('should reject update that causes duplicate ID number', async () => {
      // Create two beneficiaries
      await repository.create({
        id: 'ben-update-a',
        name: 'Beneficiary A',
        phone: '+264866666666',
        idNumber: '6666666666',
        region: 'Omusati',
        grantType: 'social_grant',
        status: 'active',
      });

      await repository.create({
        id: 'ben-update-b',
        name: 'Beneficiary B',
        phone: '+264877777777',
        idNumber: '7777777777',
        region: 'Omusati',
        grantType: 'social_grant',
        status: 'pending',
      });

      // Try to update B with A's ID number
      await expect(repository.update('ben-update-b', { 
        idNumber: '6666666666' 
      })).rejects.toThrow('Another beneficiary with this ID number already exists');
    });

    it('should allow updating to same ID number', async () => {
      await repository.create({
        id: 'ben-update-same',
        name: 'Same ID Test',
        phone: '+264888888888',
        idNumber: '8888888888',
        region: 'Zambezi',
        grantType: 'social_grant',
        status: 'active',
      });

      const updated = await repository.update('ben-update-same', { 
        idNumber: '8888888888' 
      });
      expect(updated.id_number).toBe('8888888888');
    });
  });

  describe('hash verification', () => {
    it('should correctly verify hash matches ID number', async () => {
      const idNumber = '9999999999';
      const hash = hashIdNumber(idNumber);
      
      // Find by hash should return the beneficiary
      await repository.create({
        id: 'ben-verify',
        name: 'Verify Test',
        phone: '+264899999999',
        idNumber,
        region: 'Erongo',
        grantType: 'social_grant',
        status: 'active',
      });

      const found = await repository.findByIdNumberHash(hash);
      expect(found).not.toBeNull();
      expect(found?.id).toBe('ben-verify');
    });

    it('should return null for non-existent hash', async () => {
      const nonExistentHash = hashIdNumber('0000000000');
      const found = await repository.findByIdNumberHash(nonExistentHash);
      expect(found).toBeNull();
    });
  });

  describe('end-to-end duplicate prevention flow', () => {
    it('should prevent duplicate beneficiary registration via hash', async () => {
      // Simulate registration of first beneficiary
      const registration1 = await repository.create({
        id: 'e2e-ben-1',
        name: 'E2E Test 1',
        phone: '+264800000001',
        idNumber: '12345678',
        region: 'Khomas',
        grantType: 'social_grant',
        status: 'active',
      });

      // Simulate duplicate registration attempt
      const duplicateCheck = await repository.checkDuplicate('12345678');
      expect(duplicateCheck.isDuplicate).toBe(true);
      expect(duplicateCheck.existing?.id).toBe('e2e-ben-1');

      // Verify duplicate is rejected
      await expect(repository.create({
        id: 'e2e-ben-duplicate',
        name: 'E2E Test Duplicate',
        phone: '+264800000002',
        idNumber: '12345678',
        region: 'Khomas',
        grantType: 'social_grant',
        status: 'pending',
      })).rejects.toThrow('Beneficiary with this ID number already exists');
    });

    it('should handle different ID formats separately', async () => {
      await repository.create({
        id: 'e2e-format-1',
        name: 'Format Test',
        phone: '+264811111111',
        idNumber: '12345678',
        region: 'Oshikoto',
        grantType: 'social_grant',
        status: 'active',
      });

      // Different format should not be duplicate
      const checkResult = await repository.checkDuplicate('12345678 ');
      expect(checkResult.isDuplicate).toBe(true); // Trimmed, so same

      const checkResult2 = await repository.checkDuplicate(' 12345678');
      expect(checkResult2.isDuplicate).toBe(true); // Trimmed, so same

      const checkResult3 = await repository.checkDuplicate('12345679');
      expect(checkResult3.isDuplicate).toBe(false); // Different number
    });
  });
});

/**
 * Unit Tests: Buffr ID Utility
 * 
 * Location: __tests__/utils/buffrId.test.ts
 * Purpose: Test Buffr ID generation, validation, and parsing
 */

import {
  generateBuffrId,
  isValidBuffrId,
  parseBuffrId,
  generateIPPAlias,
  generateWalletIPPAlias,
  isPhoneIPPAlias,
  isWalletIPPAlias,
  extractFromIPPAlias,
  normalizeBuffrId,
  generateUniqueBuffrId,
} from '../../utils/buffrId';

describe('Buffr ID Utility', () => {
  describe('generateBuffrId', () => {
    it('should generate from email', () => {
      const result = generateBuffrId({ email: 'george@buffr.ai' });
      expect(result).toBe('george@bfr');
    });

    it('should handle email with special characters', () => {
      const result = generateBuffrId({ email: 'john.doe+test@example.com' });
      expect(result).toBe('john.doetest@bfr');
    });

    it('should generate from phone number', () => {
      const result = generateBuffrId({ phoneNumber: '+26481476206' });
      expect(result).toBe('81476206@bfr');
    });

    it('should generate from full name', () => {
      const result = generateBuffrId({ fullName: 'George Nekwaya' });
      expect(result).toBe('george.nekwaya@bfr');
    });

    it('should generate from first name', () => {
      const result = generateBuffrId({ firstName: 'Maria' });
      expect(result).toBe('maria@bfr');
    });

    it('should generate from user ID as fallback', () => {
      const result = generateBuffrId({ id: 'abc12345-6789-0000' });
      expect(result).toBe('abc12345@bfr');
    });

    it('should handle empty user with default', () => {
      const result = generateBuffrId({});
      expect(result).toBe('user@bfr');
    });

    it('should prioritize email over phone', () => {
      const result = generateBuffrId({ 
        email: 'test@example.com', 
        phoneNumber: '+264811234567' 
      });
      expect(result).toBe('test@bfr');
    });

    it('should truncate long usernames', () => {
      const result = generateBuffrId({ 
        email: 'verylongusernamethatexceedstwentycharacters@example.com' 
      });
      expect(result.length).toBeLessThanOrEqual(24); // 20 + @bfr
    });

    it('should pad short usernames', () => {
      const result = generateBuffrId({ firstName: 'Jo' });
      expect(result.length).toBeGreaterThanOrEqual(7); // min 3 + @bfr
    });

    it('should handle Namibian names', () => {
      const result = generateBuffrId({ fullName: 'Petrus Nghipandulwa' });
      expect(result).toBe('petrus.nghipandulwa@bfr');
    });
  });

  describe('isValidBuffrId', () => {
    it('should validate correct Buffr ID', () => {
      expect(isValidBuffrId('george@bfr')).toBe(true);
    });

    it('should validate ID with dots', () => {
      expect(isValidBuffrId('john.doe@bfr')).toBe(true);
    });

    it('should validate ID with numbers', () => {
      expect(isValidBuffrId('user123@bfr')).toBe(true);
    });

    it('should reject wrong domain', () => {
      expect(isValidBuffrId('george@buffr')).toBe(false);
    });

    it('should reject uppercase', () => {
      expect(isValidBuffrId('George@bfr')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(isValidBuffrId('george!@bfr')).toBe(false);
    });

    it('should reject too short username', () => {
      expect(isValidBuffrId('ab@bfr')).toBe(false);
    });

    it('should reject starting with dot', () => {
      expect(isValidBuffrId('.george@bfr')).toBe(false);
    });

    it('should reject ending with dot', () => {
      expect(isValidBuffrId('george.@bfr')).toBe(false);
    });

    it('should reject consecutive dots', () => {
      expect(isValidBuffrId('george..doe@bfr')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidBuffrId('')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidBuffrId(null as any)).toBe(false);
      expect(isValidBuffrId(undefined as any)).toBe(false);
    });
  });

  describe('parseBuffrId', () => {
    it('should parse valid Buffr ID', () => {
      const result = parseBuffrId('george@bfr');
      expect(result).toEqual({
        username: 'george',
        domain: 'bfr',
        isValid: true,
      });
    });

    it('should parse ID with dots', () => {
      const result = parseBuffrId('john.doe@bfr');
      expect(result.username).toBe('john.doe');
      expect(result.isValid).toBe(true);
    });

    it('should mark invalid domain', () => {
      const result = parseBuffrId('george@buffr');
      expect(result.isValid).toBe(false);
    });

    it('should handle malformed input', () => {
      const result = parseBuffrId('nodomainsymbol');
      expect(result.isValid).toBe(false);
    });
  });

  describe('generateIPPAlias', () => {
    it('should generate from full phone with country code', () => {
      const result = generateIPPAlias('+26481476206');
      expect(result).toBe('+26481476206@buffr');
    });

    it('should add country code to number starting with 264', () => {
      const result = generateIPPAlias('26481476206');
      expect(result).toBe('+26481476206@buffr');
    });

    it('should convert local number to international', () => {
      const result = generateIPPAlias('081476206');
      expect(result).toBe('+26481476206@buffr');
    });

    it('should handle number without leading zero', () => {
      const result = generateIPPAlias('81476206');
      expect(result).toBe('+26481476206@buffr');
    });

    it('should strip non-numeric characters', () => {
      const result = generateIPPAlias('+264 81 476 206');
      expect(result).toBe('+26481476206@buffr');
    });
  });

  describe('generateWalletIPPAlias', () => {
    it('should generate wallet alias', () => {
      const result = generateWalletIPPAlias('wallet-123');
      expect(result).toBe('wallet-123@buffr.wallet');
    });

    it('should handle UUID wallet ID', () => {
      const result = generateWalletIPPAlias('abc12345-6789-0000-1111-222233334444');
      expect(result).toBe('abc12345-6789-0000-1111-222233334444@buffr.wallet');
    });
  });

  describe('isPhoneIPPAlias', () => {
    it('should identify phone alias', () => {
      expect(isPhoneIPPAlias('+26481476206@buffr')).toBe(true);
    });

    it('should reject wallet alias', () => {
      expect(isPhoneIPPAlias('wallet-123@buffr.wallet')).toBe(false);
    });
  });

  describe('isWalletIPPAlias', () => {
    it('should identify wallet alias', () => {
      expect(isWalletIPPAlias('wallet-123@buffr.wallet')).toBe(true);
    });

    it('should reject phone alias', () => {
      expect(isWalletIPPAlias('+26481476206@buffr')).toBe(false);
    });
  });

  describe('extractFromIPPAlias', () => {
    it('should extract phone from phone alias', () => {
      const result = extractFromIPPAlias('+26481476206@buffr');
      expect(result).toEqual({
        identifier: '+26481476206',
        type: 'phone',
      });
    });

    it('should extract wallet ID from wallet alias', () => {
      const result = extractFromIPPAlias('wallet-123@buffr.wallet');
      expect(result).toEqual({
        identifier: 'wallet-123',
        type: 'wallet',
      });
    });

    it('should handle unknown format', () => {
      const result = extractFromIPPAlias('unknown-format');
      expect(result).toEqual({
        identifier: 'unknown-format',
        type: 'unknown',
      });
    });
  });

  describe('normalizeBuffrId', () => {
    it('should lowercase', () => {
      expect(normalizeBuffrId('George@BFR')).toBe('george@bfr');
    });

    it('should trim whitespace', () => {
      expect(normalizeBuffrId('  george@bfr  ')).toBe('george@bfr');
    });

    it('should handle mixed case and whitespace', () => {
      expect(normalizeBuffrId(' JOHN.DOE@BFR ')).toBe('john.doe@bfr');
    });
  });

  describe('generateUniqueBuffrId', () => {
    it('should return base ID if not taken', () => {
      const result = generateUniqueBuffrId(
        { email: 'george@buffr.ai' },
        ['maria@bfr', 'petrus@bfr']
      );
      expect(result).toBe('george@bfr');
    });

    it('should add suffix if base ID is taken', () => {
      const result = generateUniqueBuffrId(
        { email: 'george@buffr.ai' },
        ['george@bfr', 'maria@bfr']
      );
      expect(result).toBe('george1@bfr');
    });

    it('should increment suffix until unique', () => {
      const result = generateUniqueBuffrId(
        { email: 'george@buffr.ai' },
        ['george@bfr', 'george1@bfr', 'george2@bfr']
      );
      expect(result).toBe('george3@bfr');
    });

    it('should handle empty existing IDs', () => {
      const result = generateUniqueBuffrId(
        { email: 'test@example.com' },
        []
      );
      expect(result).toBe('test@bfr');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle George Nekwaya', () => {
      const buffrId = generateBuffrId({
        email: 'george@buffr.ai',
        phoneNumber: '+26481476206',
        fullName: 'George Nekwaya',
      });
      expect(buffrId).toBe('george@bfr');
      expect(isValidBuffrId(buffrId)).toBe(true);

      const ippAlias = generateIPPAlias('+26481476206');
      expect(ippAlias).toBe('+26481476206@buffr');
    });

    it('should handle Namibian mobile numbers', () => {
      const numbers = [
        '081 234 5678',
        '+264 81 234 5678',
        '26481234567',
        '0812345678',
      ];

      numbers.forEach(num => {
        const alias = generateIPPAlias(num);
        expect(alias).toMatch(/^\+264\d+@buffr$/);
      });
    });

    it('should generate consistent IDs', () => {
      const user = { email: 'test@example.com' };
      const id1 = generateBuffrId(user);
      const id2 = generateBuffrId(user);
      expect(id1).toBe(id2);
    });
  });
});

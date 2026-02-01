/**
 * USSD Service Tests
 * 
 * Location: __tests__/services/ussdService.test.ts
 * Purpose: Test USSD service functionality including session cleanup
 */

import { ussdService } from '../../services/ussdService';

describe('USSDService', () => {
  beforeEach(() => {
    // Clear sessions before each test
    (ussdService as any).sessions.clear();
  });

  describe('cleanupSessions', () => {
    it('should remove expired sessions', () => {
      const sessionId = 'test-session-1';
      const phoneNumber = '+264812345678';

      // Create a session with old lastActivity
      (ussdService as any).sessions.set(sessionId, {
        sessionId,
        phoneNumber,
        currentMenu: 'main',
        data: {},
        pinVerified: false,
        attempts: 0,
        lastActivity: Date.now() - 6 * 60 * 1000, // 6 minutes ago (expired)
      });

      // Create a session with recent activity
      const activeSessionId = 'test-session-2';
      (ussdService as any).sessions.set(activeSessionId, {
        sessionId: activeSessionId,
        phoneNumber: '+264812345679',
        currentMenu: 'main',
        data: {},
        pinVerified: false,
        attempts: 0,
        lastActivity: Date.now() - 2 * 60 * 1000, // 2 minutes ago (active)
      });

      expect((ussdService as any).sessions.size).toBe(2);

      // Run cleanup
      ussdService.cleanupSessions();

      // Only expired session should be removed
      expect((ussdService as any).sessions.size).toBe(1);
      expect((ussdService as any).sessions.has(activeSessionId)).toBe(true);
      expect((ussdService as any).sessions.has(sessionId)).toBe(false);
    });

    it('should not remove active sessions', () => {
      const sessionId = 'test-session-active';
      (ussdService as any).sessions.set(sessionId, {
        sessionId,
        phoneNumber: '+264812345678',
        currentMenu: 'main',
        data: {},
        pinVerified: false,
        attempts: 0,
        lastActivity: Date.now() - 1 * 60 * 1000, // 1 minute ago (active)
      });

      ussdService.cleanupSessions();

      expect((ussdService as any).sessions.size).toBe(1);
      expect((ussdService as any).sessions.has(sessionId)).toBe(true);
    });

    it('should handle empty sessions map', () => {
      expect((ussdService as any).sessions.size).toBe(0);
      
      // Should not throw
      expect(() => ussdService.cleanupSessions()).not.toThrow();
    });
  });
});

/**
 * Hardware Security Module (HSM) – HSM integration for POS/ATM
 *
 * Location: backend/src/services/security/HardwareSecurityModule.ts
 * Purpose: Key management and crypto operations for POS/ATM (PRD FR3.7).
 */

import { log, logError } from '../../utils/logger';

const HSM_ENABLED = process.env.HSM_ENABLED === 'true';
const HSM_URL = process.env.HSM_URL || '';

export class HardwareSecurityModule {
  /**
   * Sign payload with HSM key (e.g. for transaction authorization).
   */
  async sign(keyId: string, payload: string): Promise<string> {
    if (!HSM_ENABLED || !HSM_URL) {
      log('HSM not configured – returning mock signature');
      return `mock-signature-${keyId}-${Buffer.from(payload).toString('base64url').slice(0, 16)}`;
    }
    try {
      const res = await fetch(`${HSM_URL}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, payload }),
      });
      const data = (await res.json()) as { signature: string };
      return data.signature;
    } catch (e) {
      logError('HSM sign failed', e, { keyId });
      throw e;
    }
  }

  /**
   * Encrypt sensitive field (e.g. PIN block) for POS.
   */
  async encryptPinBlock(pinBlock: string, keyId: string): Promise<string> {
    if (!HSM_ENABLED) return `encrypted-${pinBlock.slice(0, 4)}***`;
    try {
      const res = await fetch(`${HSM_URL}/encrypt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyId, plaintext: pinBlock }),
      });
      const data = (await res.json()) as { ciphertext: string };
      return data.ciphertext;
    } catch (e) {
      logError('HSM encrypt failed', e, { keyId });
      throw e;
    }
  }
}

export const hardwareSecurityModule = new HardwareSecurityModule();

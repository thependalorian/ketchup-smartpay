/**
 * Consent Management Service – Explicit beneficiary consent, privacy-by-design
 *
 * Location: backend/src/services/privacy/ConsentManagementService.ts
 * Purpose: PRD FR4.5; GDPR/NAMIBIA privacy; consent for data sharing, marketing, third-party.
 */

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';

export type ConsentType = 'data_sharing' | 'marketing' | 'third_party_share' | 'analytics' | 'essential';

export interface ConsentRecord {
  beneficiaryId: string;
  consentType: ConsentType;
  granted: boolean;
  grantedAt?: string;
  withdrawnAt?: string;
  version: string;
}

export class ConsentManagementService {
  async getConsents(beneficiaryId: string): Promise<ConsentRecord[]> {
    try {
      const rows = await sql`
        SELECT beneficiary_id as "beneficiaryId", consent_type as "consentType",
               granted, granted_at as "grantedAt", withdrawn_at as "withdrawnAt", version
        FROM beneficiary_consents
        WHERE beneficiary_id = ${beneficiaryId}
        ORDER BY consent_type
      `;
      return rows as ConsentRecord[];
    } catch (e) {
      logError('Get consents failed', e, { beneficiaryId });
      return [];
    }
  }

  async grantConsent(beneficiaryId: string, consentType: ConsentType, version: string): Promise<boolean> {
    try {
      await sql`
        INSERT INTO beneficiary_consents (beneficiary_id, consent_type, granted, granted_at, version)
        VALUES (${beneficiaryId}, ${consentType}, true, NOW(), ${version})
        ON CONFLICT (beneficiary_id, consent_type) DO UPDATE SET granted = true, granted_at = NOW(), withdrawn_at = NULL, version = ${version}
      `;
      log('Consent granted', { beneficiaryId, consentType });
      return true;
    } catch (e) {
      logError('Grant consent failed', e, { beneficiaryId, consentType });
      return false;
    }
  }

  async withdrawConsent(beneficiaryId: string, consentType: ConsentType): Promise<boolean> {
    try {
      await sql`
        UPDATE beneficiary_consents SET granted = false, withdrawn_at = NOW() WHERE beneficiary_id = ${beneficiaryId} AND consent_type = ${consentType}
      `;
      log('Consent withdrawn', { beneficiaryId, consentType });
      return true;
    } catch (e) {
      logError('Withdraw consent failed', e, { beneficiaryId, consentType });
      return false;
    }
  }
}

export const consentManagementService = new ConsentManagementService();

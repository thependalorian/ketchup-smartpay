/**
 * Consent Management Service – Explicit beneficiary consent, privacy-by-design
 *
 * Location: backend/src/services/privacy/ConsentManagementService.ts
 * Purpose: PRD FR4.5; GDPR/NAMIBIA privacy; consent for data sharing, marketing, third-party.
 */
export type ConsentType = 'data_sharing' | 'marketing' | 'third_party_share' | 'analytics' | 'essential';
export interface ConsentRecord {
    beneficiaryId: string;
    consentType: ConsentType;
    granted: boolean;
    grantedAt?: string;
    withdrawnAt?: string;
    version: string;
}
export declare class ConsentManagementService {
    getConsents(beneficiaryId: string): Promise<ConsentRecord[]>;
    grantConsent(beneficiaryId: string, consentType: ConsentType, version: string): Promise<boolean>;
    withdrawConsent(beneficiaryId: string, consentType: ConsentType): Promise<boolean>;
}
export declare const consentManagementService: ConsentManagementService;
//# sourceMappingURL=ConsentManagementService.d.ts.map
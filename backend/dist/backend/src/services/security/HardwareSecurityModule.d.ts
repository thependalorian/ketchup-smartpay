/**
 * Hardware Security Module (HSM) – HSM integration for POS/ATM
 *
 * Location: backend/src/services/security/HardwareSecurityModule.ts
 * Purpose: Key management and crypto operations for POS/ATM (PRD FR3.7).
 */
export declare class HardwareSecurityModule {
    /**
     * Sign payload with HSM key (e.g. for transaction authorization).
     * Throws when HSM is not configured; no mock signatures in production.
     */
    sign(keyId: string, payload: string): Promise<string>;
    /**
     * Encrypt sensitive field (e.g. PIN block) for POS.
     * Throws when HSM is not configured; no mock ciphertext.
     */
    encryptPinBlock(pinBlock: string, keyId: string): Promise<string>;
}
export declare const hardwareSecurityModule: HardwareSecurityModule;
//# sourceMappingURL=HardwareSecurityModule.d.ts.map
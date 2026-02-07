/**
 * PCI DSS Compliance – PCI DSS compliance checks for card/POS handling
 *
 * Location: backend/src/services/security/PCIDSSCompliance.ts
 * Purpose: Checks for PCI DSS (PRD FR3.8); no card data storage, secure transmission.
 */
export interface PCIDSSCheckResult {
    check: string;
    passed: boolean;
    detail?: string;
}
export declare function runPCIDSSChecks(): PCIDSSCheckResult[];
//# sourceMappingURL=PCIDSSCompliance.d.ts.map
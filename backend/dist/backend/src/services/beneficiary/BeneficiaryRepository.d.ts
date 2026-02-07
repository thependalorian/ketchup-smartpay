/**
 * Beneficiary Repository
 *
 * Location: backend/src/services/beneficiary/BeneficiaryRepository.ts
 * Purpose: Data access layer for beneficiary operations (real DB, no mocks).
 * PRD Requirement: National ID Numbers with hash for duplicate detection
 */
import type { Beneficiary, BeneficiaryFilters } from '../../../../shared/types';
/**
 * Generate a one-way hash of the ID number for duplicate detection.
 * Uses SHA-256 and returns the first 64 characters (128 hex chars total).
 */
export declare function hashIdNumber(idNumber: string): string;
export declare class BeneficiaryRepository {
    /**
     * Find all beneficiaries with optional filters (from real DB).
     */
    findAll(filters?: BeneficiaryFilters): Promise<Beneficiary[]>;
    /**
     * Find beneficiary by ID (from real DB).
     */
    findById(id: string): Promise<Beneficiary | null>;
    /**
     * Find beneficiary by national ID number (exact match).
     * PRD Requirement: Detect duplicate beneficiaries by ID number
     */
    findByIdNumber(idNumber: string): Promise<Beneficiary | null>;
    /**
     * Find beneficiary by national ID hash (for duplicate detection).
     * Uses the hashed version of ID number to prevent duplicate registration.
     * PRD Requirement: Hash for duplicate detection
     */
    findByIdNumberHash(hash: string): Promise<Beneficiary | null>;
    /**
     * Check if a beneficiary with the given ID number already exists.
     * Returns the existing beneficiary if found, null otherwise.
     * PRD Requirement: Prevent duplicate beneficiaries by ID number
     */
    checkDuplicate(idNumber: string): Promise<{
        isDuplicate: boolean;
        existing?: Beneficiary;
    }>;
    /**
     * Create a new beneficiary (real DB insert).
     * Checks for duplicates by ID number hash before creating.
     * PRD Requirement: Prevent duplicate beneficiaries
     */
    create(data: Omit<Beneficiary, 'enrolledAt' | 'lastPayment'> & {
        idNumber?: string;
        proxyName?: string;
        proxyIdNumber?: string;
        proxyPhone?: string;
        proxyRelationship?: string;
    }): Promise<Beneficiary>;
    /**
     * Update beneficiary (real DB update).
     */
    update(id: string, data: Partial<Beneficiary>): Promise<Beneficiary>;
    findByRegion(region: string): Promise<Beneficiary[]>;
    findEligible(): Promise<Beneficiary[]>;
}
//# sourceMappingURL=BeneficiaryRepository.d.ts.map
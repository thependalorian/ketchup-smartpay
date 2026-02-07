/**
 * Beneficiary Service
 *
 * Location: backend/src/services/beneficiary/BeneficiaryService.ts
 * Purpose: Business logic for beneficiary operations (PRD Component: Beneficiary Database)
 */
import { BeneficiaryRepository } from './BeneficiaryRepository';
import { StatusMonitor } from '../status/StatusMonitor';
import { Beneficiary, CreateBeneficiaryDTO, UpdateBeneficiaryDTO, BeneficiaryFilters } from '../../../../shared/types';
export declare class BeneficiaryService {
    private repository;
    private statusMonitor;
    constructor(repository?: BeneficiaryRepository, statusMonitor?: StatusMonitor);
    /**
     * Get all beneficiaries with optional filters
     */
    getAll(filters?: BeneficiaryFilters): Promise<Beneficiary[]>;
    /**
     * Get beneficiary by ID
     */
    getById(id: string): Promise<Beneficiary | null>;
    /**
     * Create a new beneficiary
     */
    create(data: CreateBeneficiaryDTO): Promise<Beneficiary>;
    /**
     * Update beneficiary
     */
    update(id: string, data: UpdateBeneficiaryDTO): Promise<Beneficiary>;
    /**
     * Get beneficiaries by region
     */
    getByRegion(region: string): Promise<Beneficiary[]>;
    /**
     * Get eligible beneficiaries (active status)
     */
    getEligible(): Promise<Beneficiary[]>;
    /**
     * Validate beneficiary data
     */
    private validateBeneficiaryData;
    /**
     * Validate phone number (Namibian format)
     */
    private isValidPhoneNumber;
    /**
     * Generate unique beneficiary ID
     */
    private generateBeneficiaryId;
}
//# sourceMappingURL=BeneficiaryService.d.ts.map
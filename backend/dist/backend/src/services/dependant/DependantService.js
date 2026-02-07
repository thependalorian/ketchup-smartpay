/**
 * Dependant Service
 *
 * Location: backend/src/services/dependant/DependantService.ts
 * Purpose: Business logic for beneficiary dependants (validation, existence checks).
 */
import { DependantRepository } from './DependantRepository';
import { BeneficiaryRepository } from '../beneficiary/BeneficiaryRepository';
import { log, logError } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
const VALID_RELATIONSHIPS = ['child', 'spouse', 'guardian', 'other'];
export class DependantService {
    repository;
    beneficiaryRepository;
    constructor(repository, beneficiaryRepository) {
        this.repository = repository ?? new DependantRepository();
        this.beneficiaryRepository = beneficiaryRepository ?? new BeneficiaryRepository();
    }
    async getByBeneficiaryId(beneficiaryId) {
        try {
            const beneficiary = await this.beneficiaryRepository.findById(beneficiaryId);
            if (!beneficiary) {
                throw new Error(`Beneficiary with ID ${beneficiaryId} not found`);
            }
            return await this.repository.findByBeneficiaryId(beneficiaryId);
        }
        catch (error) {
            logError('DependantService.getByBeneficiaryId failed', error, { beneficiaryId });
            throw error;
        }
    }
    async getById(beneficiaryId, dependantId) {
        try {
            const beneficiary = await this.beneficiaryRepository.findById(beneficiaryId);
            if (!beneficiary) {
                throw new Error(`Beneficiary with ID ${beneficiaryId} not found`);
            }
            return await this.repository.findById(beneficiaryId, dependantId);
        }
        catch (error) {
            logError('DependantService.getById failed', error, { beneficiaryId, dependantId });
            throw error;
        }
    }
    async create(beneficiaryId, data) {
        try {
            const beneficiary = await this.beneficiaryRepository.findById(beneficiaryId);
            if (!beneficiary) {
                throw new Error(`Beneficiary with ID ${beneficiaryId} not found`);
            }
            this.validateCreateDependant(data);
            const id = `dep-${uuidv4().replace(/-/g, '').slice(0, 20)}`;
            const dependant = await this.repository.create(beneficiaryId, id, data);
            log('Dependant created successfully', { beneficiaryId, dependantId: dependant.id });
            return dependant;
        }
        catch (error) {
            logError('DependantService.create failed', error, { beneficiaryId, data });
            throw error;
        }
    }
    async update(beneficiaryId, dependantId, data) {
        try {
            const beneficiary = await this.beneficiaryRepository.findById(beneficiaryId);
            if (!beneficiary) {
                throw new Error(`Beneficiary with ID ${beneficiaryId} not found`);
            }
            const existing = await this.repository.findById(beneficiaryId, dependantId);
            if (!existing) {
                throw new Error(`Dependant with ID ${dependantId} not found for beneficiary ${beneficiaryId}`);
            }
            if (data.relationship !== undefined && !VALID_RELATIONSHIPS.includes(data.relationship)) {
                throw new Error(`Invalid relationship. Must be one of: ${VALID_RELATIONSHIPS.join(', ')}`);
            }
            return await this.repository.update(beneficiaryId, dependantId, data);
        }
        catch (error) {
            logError('DependantService.update failed', error, { beneficiaryId, dependantId });
            throw error;
        }
    }
    async delete(beneficiaryId, dependantId) {
        try {
            const beneficiary = await this.beneficiaryRepository.findById(beneficiaryId);
            if (!beneficiary) {
                throw new Error(`Beneficiary with ID ${beneficiaryId} not found`);
            }
            const existing = await this.repository.findById(beneficiaryId, dependantId);
            if (!existing) {
                throw new Error(`Dependant with ID ${dependantId} not found for beneficiary ${beneficiaryId}`);
            }
            await this.repository.delete(beneficiaryId, dependantId);
            log('Dependant deleted successfully', { beneficiaryId, dependantId });
        }
        catch (error) {
            logError('DependantService.delete failed', error, { beneficiaryId, dependantId });
            throw error;
        }
    }
    validateCreateDependant(data) {
        if (!data.name || data.name.trim().length === 0) {
            throw new Error('Dependant name is required');
        }
        if (!data.relationship || !VALID_RELATIONSHIPS.includes(data.relationship)) {
            throw new Error(`Relationship is required and must be one of: ${VALID_RELATIONSHIPS.join(', ')}`);
        }
    }
}
//# sourceMappingURL=DependantService.js.map
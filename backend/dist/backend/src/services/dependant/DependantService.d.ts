/**
 * Dependant Service
 *
 * Location: backend/src/services/dependant/DependantService.ts
 * Purpose: Business logic for beneficiary dependants (validation, existence checks).
 */
import { DependantRepository } from './DependantRepository';
import { BeneficiaryRepository } from '../beneficiary/BeneficiaryRepository';
import type { Dependant, CreateDependantDTO, UpdateDependantDTO } from '../../../../shared/types';
export declare class DependantService {
    private repository;
    private beneficiaryRepository;
    constructor(repository?: DependantRepository, beneficiaryRepository?: BeneficiaryRepository);
    getByBeneficiaryId(beneficiaryId: string): Promise<Dependant[]>;
    getById(beneficiaryId: string, dependantId: string): Promise<Dependant | null>;
    create(beneficiaryId: string, data: CreateDependantDTO): Promise<Dependant>;
    update(beneficiaryId: string, dependantId: string, data: UpdateDependantDTO): Promise<Dependant>;
    delete(beneficiaryId: string, dependantId: string): Promise<void>;
    private validateCreateDependant;
}
//# sourceMappingURL=DependantService.d.ts.map
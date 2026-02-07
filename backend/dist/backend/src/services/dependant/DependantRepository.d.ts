/**
 * Dependant Repository
 *
 * Location: backend/src/services/dependant/DependantRepository.ts
 * Purpose: Data access for beneficiary dependants (beneficiary_dependants table).
 */
import type { Dependant, CreateDependantDTO, UpdateDependantDTO } from '../../../../shared/types';
export declare class DependantRepository {
    findByBeneficiaryId(beneficiaryId: string): Promise<Dependant[]>;
    findById(beneficiaryId: string, dependantId: string): Promise<Dependant | null>;
    create(beneficiaryId: string, id: string, data: CreateDependantDTO): Promise<Dependant>;
    update(beneficiaryId: string, dependantId: string, data: UpdateDependantDTO): Promise<Dependant>;
    delete(beneficiaryId: string, dependantId: string): Promise<void>;
}
//# sourceMappingURL=DependantRepository.d.ts.map
/**
 * Reconciliation Service
 *
 * Purpose: Business logic for voucher reconciliation between Ketchup and Buffr
 * Location: backend/src/services/reconciliation/ReconciliationService.ts
 */
import { ReconciliationRecord, ReconciliationReport, ReconciliationFilters } from '../../../../shared/types';
export declare class ReconciliationService {
    private voucherRepository;
    private buffrAPIClient;
    constructor();
    /**
     * Run reconciliation for a specific date
     */
    reconcile(date: string): Promise<ReconciliationReport>;
    /**
     * Get reconciliation records with filters (single query; no sql fragment composition).
     */
    getRecords(filters?: ReconciliationFilters): Promise<ReconciliationRecord[]>;
}
//# sourceMappingURL=ReconciliationService.d.ts.map
/**
 * Status Monitor
 *
 * Location: backend/src/services/status/StatusMonitor.ts
 * Purpose: Track voucher lifecycle states (PRD Component: Status Monitor)
 */
import { VoucherRepository } from '../voucher/VoucherRepository';
import { VoucherStatus, StatusEvent } from '../../../../shared/types';
export declare class StatusMonitor {
    private voucherRepository;
    constructor(voucherRepository?: VoucherRepository);
    /**
     * Track voucher status change
     */
    trackStatus(voucherId: string, status: VoucherStatus, metadata?: Record<string, any>, triggeredBy?: 'system' | 'webhook' | 'manual'): Promise<void>;
    /**
     * Monitor expiring vouchers and send warnings
     */
    monitorExpiry(): Promise<void>;
    /**
     * Send expiry warnings for vouchers expiring soon
     */
    sendExpiryWarnings(): Promise<void>;
    /**
     * Get recent status events across all vouchers (for activity feed)
     */
    getRecentEvents(limit?: number): Promise<Array<StatusEvent & {
        voucher_id?: string;
    }>>;
    /**
     * Record beneficiary.deceased event (status_events). Used when a beneficiary is marked deceased.
     * voucher_id is stored as 'beneficiary-{id}' for queryability; government/audit can filter by to_status = 'deceased'.
     */
    recordBeneficiaryDeceased(beneficiaryId: string, fromStatus: string, triggeredBy?: 'system' | 'webhook' | 'manual'): Promise<void>;
    /**
     * Get status history for a voucher
     */
    getStatusHistory(voucherId: string): Promise<StatusEvent[]>;
}
//# sourceMappingURL=StatusMonitor.d.ts.map
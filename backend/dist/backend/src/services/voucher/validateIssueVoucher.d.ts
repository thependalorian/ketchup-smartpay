/**
 * Voucher issuance validation – guard rails to prevent unassigned vouchers and invalid data.
 * Location: backend/src/services/voucher/validateIssueVoucher.ts
 */
import { IssueVoucherDTO } from '../../../../shared/types';
export declare function validateIssueVoucherDTO(data: unknown): {
    ok: true;
    data: IssueVoucherDTO;
} | {
    ok: false;
    error: string;
};
//# sourceMappingURL=validateIssueVoucher.d.ts.map
/**
 * IPS Error Codes – Standardized responses per ISO 20022 and Namibian Open Banking
 *
 * Location: backend/src/services/ips/IPSErrorCodes.ts
 * Purpose: Map internal errors to ISO 20022 / PSDIR-11 status and reason codes.
 */
/** ISO 20022 / Namibian Open Banking standard rejection reason codes */
export const IPS_REJECTION_REASONS = {
    INSUFFICIENT_FUNDS: {
        status: 'RJCT',
        statusReasonCode: 'NSUF',
        statusReason: 'Insufficient funds',
    },
    INVALID_ACCOUNT: {
        status: 'RJCT',
        statusReasonCode: 'AC04',
        statusReason: 'Invalid account',
    },
    INVALID_AMOUNT: {
        status: 'RJCT',
        statusReasonCode: 'AM09',
        statusReason: 'Invalid amount',
    },
    DUPLICATE_REQUEST: {
        status: 'RJCT',
        statusReasonCode: 'DUPL',
        statusReason: 'Duplicate payment request',
    },
    PARTICIPANT_UNAVAILABLE: {
        status: 'RJCT',
        statusReasonCode: 'PART',
        statusReason: 'Creditor or debtor participant unavailable',
    },
    TIMEOUT: {
        status: 'RJCT',
        statusReasonCode: 'TIME',
        statusReason: 'Processing timeout',
    },
    INTERNAL_ERROR: {
        status: 'RJCT',
        statusReasonCode: 'G000',
        statusReason: 'Internal system error',
    },
};
export function toIPSError(code, additionalInfo) {
    const err = IPS_REJECTION_REASONS[code] ?? IPS_REJECTION_REASONS.INTERNAL_ERROR;
    return { ...err, additionalInformation: additionalInfo };
}
//# sourceMappingURL=IPSErrorCodes.js.map
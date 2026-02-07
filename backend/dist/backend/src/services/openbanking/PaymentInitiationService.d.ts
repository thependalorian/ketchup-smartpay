/**
 * Payment Initiation Service (PIS)
 *
 * Location: backend/src/services/openbanking/PaymentInitiationService.ts
 * Purpose: Implementation of Payment Initiation Services per Namibian Open Banking Standards v1.0
 *
 * Standards Compliance:
 * - Section 9.2.5: Supported PIS API Use Cases
 * - Section 9.2.4: Supported Payment Types (on-us, eft-enhanced, eft-nrtc)
 *
 * Multi-bank and fintech support (PRD FR2.2, interoperability):
 * - creditorBankCode routes to participant (bank/fintech) via BANK_CODE_TO_PARTICIPANT / IPS participant directory
 * - IPS used for instant when both parties support it
 *
 * Webhook: Notify Buffr/Ketchup on payment status change (OPEN_BANKING_ARCHIVE, PSDIR-11).
 */
export interface Payment {
    paymentId: string;
    participantId: string;
    beneficiaryId: string;
    debtorAccountId: string;
    paymentType: string;
    creditorName: string;
    creditorAccount: string;
    creditorBankCode?: string;
    amount: string;
    currency: string;
    reference?: string;
    description?: string;
    status: string;
    statusReason?: string;
    instructionId?: string;
    endToEndId?: string;
    initiatedAt: string;
}
export interface Beneficiary {
    beneficiaryPayeeId: string;
    beneficiaryId: string;
    accountId: string;
    payeeName: string;
    payeeAccount: string;
    payeeBankCode?: string;
    isFavorite: boolean;
}
export declare class PaymentInitiationService {
    /**
     * Make Payment (PIS Use Case #1)
     * Section 9.2.5: Initiate a payment on request of Account Holder
     */
    makePayment(participantId: string, beneficiaryId: string, debtorAccountId: string, paymentType: 'on-us' | 'eft-enhanced' | 'eft-nrtc', creditorName: string, creditorAccount: string, amount: string, currency?: string, creditorBankCode?: string, reference?: string, description?: string, instructionId?: string): Promise<Payment>;
    /**
     * Get Payment Status (PIS Use Case #3)
     * Section 9.2.5: Track a payment that was previously initiated
     */
    getPaymentStatus(paymentId: string, participantId: string): Promise<Payment>;
    /**
     * List Beneficiaries (PIS Use Case #2)
     * Section 9.2.5: Get list of saved beneficiaries/payees.
     * Excludes accounts whose holder (beneficiary) is deceased.
     */
    listBeneficiaries(accountId: string): Promise<Beneficiary[]>;
    /**
     * Process payment asynchronously (simulates payment system integration)
     */
    private processPaymentAsync;
    /**
     * Notify external systems (Buffr, Ketchup Portal) on payment status change.
     * Per Namibian Open Banking / PSDIR-11; webhook URL from PAYMENT_STATUS_WEBHOOK_URL.
     */
    private notifyPaymentStatusChange;
}
//# sourceMappingURL=PaymentInitiationService.d.ts.map
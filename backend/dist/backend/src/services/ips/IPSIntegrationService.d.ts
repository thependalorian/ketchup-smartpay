/**
 * IPS Integration Service – Namibia Instant Payment System
 *
 * Location: backend/src/services/ips/IPSIntegrationService.ts
 * Purpose: Complete IPS integration for real-time payments (PRD FR2.6, UPI-style instant settlement).
 * References: Bank of Namibia IPS specs, CONSOLIDATED_PRD Section 6, OPEN_BANKING_ARCHIVE.
 */
export interface IPSPaymentRequest {
    requestId: string;
    debtorParticipantId: string;
    debtorAccountId: string;
    creditorParticipantId: string;
    creditorAccountId: string;
    amount: string;
    currency: string;
    reference?: string;
    endToEndId?: string;
    debtorName?: string;
    creditorName?: string;
}
export interface IPSPaymentResult {
    paymentId: string;
    status: 'accepted' | 'rejected' | 'pending';
    statusReason?: string;
    statusReasonCode?: string;
    completedAt?: string;
    endToEndId?: string;
}
export declare class IPSIntegrationService {
    /**
     * Participant directory for routing (banks, fintechs). Per Namibian Open Banking / IPS.
     */
    getParticipantDirectory(): import("./IPSParticipantDirectory").IPSParticipant[];
    /**
     * Send payment using ISO 20022 pain.001 for initiation, then IPS gateway or simulation.
     * Integrates with ISO20022Adapter and participant directory.
     */
    sendPayment(req: IPSPaymentRequest, debtorName: string, creditorName: string): Promise<IPSPaymentResult>;
    /**
     * Receive pain.002 (Payment Status) from IPS gateway; update DB and return ack.
     * Real-time settlement: status update persisted in ips_transactions.
     */
    receivePayment(pain002Payload: string | Record<string, unknown>): Promise<{
        acknowledged: boolean;
        originalMessageId?: string;
        status: string;
        statusReason?: string;
    }>;
    private updateStatusFromPain002;
    /**
     * Initiate an instant payment via Namibia IPS.
     * Uses IPS gateway when configured; otherwise routes to creditor participant endpoint (pain.001) or simulates.
     */
    initiatePayment(req: IPSPaymentRequest): Promise<IPSPaymentResult>;
    private initiateViaGateway;
    /**
     * Send payment via creditor participant endpoint (pain.001); parse pain.002 response.
     */
    private initiateViaParticipantEndpoint;
    /**
     * Query payment status from IPS (or local record).
     */
    getPaymentStatus(paymentId: string): Promise<IPSPaymentResult | null>;
    private simulateAcceptance;
    private recordIPSTransaction;
}
export declare const ipsIntegrationService: IPSIntegrationService;
//# sourceMappingURL=IPSIntegrationService.d.ts.map
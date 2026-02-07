/**
 * Communication Service
 *
 * Location: backend/src/services/communication/CommunicationService.ts
 * Purpose: Send and log outbound communications to beneficiaries (SMS, USSD, Buffr in-app).
 * Ketchup triggers these when extending/reissuing vouchers or sending expiry warnings.
 */
export type CommunicationChannel = 'sms' | 'ussd' | 'buffr_in_app' | 'email';
export interface SendOptions {
    recipientId?: string;
    recipientPhone?: string;
    recipientUserId?: string;
    templateId?: string;
    subject?: string;
    body: string;
    metadata?: Record<string, unknown>;
}
export interface CommunicationLogRow {
    id: string;
    channel: CommunicationChannel;
    recipient_id: string | null;
    recipient_phone: string | null;
    recipient_user_id: string | null;
    template_id: string | null;
    body: string;
    status: string;
    created_at: string;
}
export declare class CommunicationService {
    /**
     * Send SMS to beneficiary (stub: logs to communication_log; wire to Twilio/Africa's Talking when ready).
     */
    sendSMS(options: SendOptions): Promise<{
        id: string;
        status: string;
    }>;
    /**
     * Send USSD prompt (stub: logs only; wire to USSD gateway when ready).
     */
    sendUSSD(options: SendOptions): Promise<{
        id: string;
        status: string;
    }>;
    /**
     * Send in-app message to Buffr user (stub: logs only; wire to Buffr push/inbox API when ready).
     */
    sendBuffrInApp(options: SendOptions): Promise<{
        id: string;
        status: string;
    }>;
    /**
     * Notify beneficiary about voucher (chooses channel from metadata: prefer Buffr if buffrUserId, else SMS, else log only).
     */
    notifyBeneficiary(channel: CommunicationChannel, options: SendOptions): Promise<{
        id: string;
        status: string;
    }>;
    private logCommunication;
    private updateStatus;
    /** Get recent communications for a beneficiary or voucher (for Ketchup support view). */
    getByRecipient(recipientId: string, limit?: number): Promise<CommunicationLogRow[]>;
}
//# sourceMappingURL=CommunicationService.d.ts.map
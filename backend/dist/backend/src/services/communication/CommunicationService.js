/**
 * Communication Service
 *
 * Location: backend/src/services/communication/CommunicationService.ts
 * Purpose: Send and log outbound communications to beneficiaries (SMS, USSD, Buffr in-app).
 * Ketchup triggers these when extending/reissuing vouchers or sending expiry warnings.
 */
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
export class CommunicationService {
    /**
     * Send SMS to beneficiary (stub: logs to communication_log; wire to Twilio/Africa's Talking when ready).
     */
    async sendSMS(options) {
        const id = await this.logCommunication('sms', {
            ...options,
            recipientPhone: options.recipientPhone || undefined,
        });
        // TODO: Call SMS gateway (e.g. Twilio, Africa's Talking) when configured
        const gatewayUrl = process.env.SMS_GATEWAY_URL;
        if (gatewayUrl) {
            try {
                // Placeholder: POST to gateway with { to, body }
                log('SMS gateway configured; would send', { recipientPhone: options.recipientPhone, id });
                await this.updateStatus(id, 'sent');
            }
            catch (err) {
                logError('SMS send failed', err, { id });
                await this.updateStatus(id, 'failed', err instanceof Error ? err.message : 'Send failed');
            }
        }
        else {
            await this.updateStatus(id, 'sent'); // Stub: mark sent for dev
        }
        return { id, status: 'sent' };
    }
    /**
     * Send USSD prompt (stub: logs only; wire to USSD gateway when ready).
     */
    async sendUSSD(options) {
        const id = await this.logCommunication('ussd', options);
        // USSD is typically session-based; this stub logs the message that would be shown (e.g. "Your voucher VC-xxx expires on DD/MM. Redeem at any NamPost.")
        const gatewayUrl = process.env.USSD_GATEWAY_URL;
        if (gatewayUrl) {
            log('USSD gateway configured; would push', { recipientId: options.recipientId, id });
        }
        await this.updateStatus(id, 'sent');
        return { id, status: 'sent' };
    }
    /**
     * Send in-app message to Buffr user (stub: logs only; wire to Buffr push/inbox API when ready).
     */
    async sendBuffrInApp(options) {
        const id = await this.logCommunication('buffr_in_app', {
            ...options,
            recipientUserId: options.recipientUserId || undefined,
        });
        const buffrNotifyUrl = process.env.BUFFR_NOTIFY_URL;
        if (buffrNotifyUrl) {
            try {
                log('Buffr notify URL configured; would send in-app', { recipientUserId: options.recipientUserId, id });
                await this.updateStatus(id, 'sent');
            }
            catch (err) {
                logError('Buffr in-app send failed', err, { id });
                await this.updateStatus(id, 'failed', err instanceof Error ? err.message : 'Send failed');
            }
        }
        else {
            await this.updateStatus(id, 'sent');
        }
        return { id, status: 'sent' };
    }
    /**
     * Notify beneficiary about voucher (chooses channel from metadata: prefer Buffr if buffrUserId, else SMS, else log only).
     */
    async notifyBeneficiary(channel, options) {
        switch (channel) {
            case 'sms':
                return this.sendSMS(options);
            case 'ussd':
                return this.sendUSSD(options);
            case 'buffr_in_app':
                return this.sendBuffrInApp(options);
            default:
                const id = await this.logCommunication('email', options);
                await this.updateStatus(id, 'sent');
                return { id, status: 'sent' };
        }
    }
    async logCommunication(channel, options) {
        const [row] = await sql `
      INSERT INTO communication_log (channel, recipient_type, recipient_id, recipient_phone, recipient_user_id, template_id, subject, body, metadata, status)
      VALUES (
        ${channel},
        'beneficiary',
        ${options.recipientId ?? null},
        ${options.recipientPhone ?? null},
        ${options.recipientUserId ?? null},
        ${options.templateId ?? null},
        ${options.subject ?? null},
        ${options.body},
        ${JSON.stringify(options.metadata || {})},
        'pending'
      )
      RETURNING id
    `;
        const id = row.id;
        log('Communication logged', { id, channel, recipientId: options.recipientId });
        return id;
    }
    async updateStatus(id, status, errorMessage) {
        await sql `
      UPDATE communication_log
      SET status = ${status}, error_message = ${errorMessage ?? null}, sent_at = CASE WHEN ${status} = 'sent' THEN NOW() ELSE sent_at END
      WHERE id = ${id}::uuid
    `;
    }
    /** Get recent communications for a beneficiary or voucher (for Ketchup support view). */
    async getByRecipient(recipientId, limit = 20) {
        const rows = await sql `
      SELECT id, channel, recipient_id, recipient_phone, recipient_user_id, template_id, body, status, created_at
      FROM communication_log
      WHERE recipient_id = ${recipientId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
        return rows;
    }
}
//# sourceMappingURL=CommunicationService.js.map
/**
 * IPS Integration Service – Namibia Instant Payment System
 *
 * Location: backend/src/services/ips/IPSIntegrationService.ts
 * Purpose: Complete IPS integration for real-time payments (PRD FR2.6, UPI-style instant settlement).
 * References: Bank of Namibia IPS specs, CONSOLIDATED_PRD Section 6, OPEN_BANKING_ARCHIVE.
 */
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
import { buildPain001, parsePain002 } from '../openbanking/ISO20022Adapter';
import { getIPSParticipantDirectory, getIPSParticipant, refreshParticipantDirectoryFromDb } from './IPSParticipantDirectory';
import { toIPSError } from './IPSErrorCodes';
const IPS_GATEWAY_URL = process.env.IPS_GATEWAY_URL || '';
const IPS_API_KEY = process.env.IPS_API_KEY || '';
export class IPSIntegrationService {
    /**
     * Participant directory for routing (banks, fintechs). Per Namibian Open Banking / IPS.
     */
    getParticipantDirectory() {
        return getIPSParticipantDirectory();
    }
    /**
     * Send payment using ISO 20022 pain.001 for initiation, then IPS gateway or simulation.
     * Integrates with ISO20022Adapter and participant directory.
     */
    async sendPayment(req, debtorName, creditorName) {
        const debtor = getIPSParticipant(req.debtorParticipantId);
        const creditor = getIPSParticipant(req.creditorParticipantId);
        if (!debtor) {
            log('IPS sendPayment: debtor participant not found', { participantId: req.debtorParticipantId });
            const err = toIPSError('PARTICIPANT_UNAVAILABLE', 'Debtor participant not found');
            return {
                paymentId: req.requestId,
                status: 'rejected',
                statusReason: err.statusReason,
                statusReasonCode: err.statusReasonCode,
                endToEndId: req.endToEndId,
            };
        }
        if (!creditor) {
            log('IPS sendPayment: creditor participant not found', { participantId: req.creditorParticipantId });
            const err = toIPSError('PARTICIPANT_UNAVAILABLE', 'Creditor participant not found');
            return {
                paymentId: req.requestId,
                status: 'rejected',
                statusReason: err.statusReason,
                statusReasonCode: err.statusReasonCode,
                endToEndId: req.endToEndId,
            };
        }
        const amountNum = parseFloat(req.amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            const err = toIPSError('INVALID_AMOUNT');
            return {
                paymentId: req.requestId,
                status: 'rejected',
                statusReason: err.statusReason,
                statusReasonCode: err.statusReasonCode,
                endToEndId: req.endToEndId,
            };
        }
        buildPain001(req.requestId, debtorName, req.debtorAccountId, creditorName, req.creditorAccountId, amountNum, req.currency, req.reference, req.endToEndId);
        return this.initiatePayment({ ...req, debtorName, creditorName });
    }
    /**
     * Receive pain.002 (Payment Status) from IPS gateway; update DB and return ack.
     * Real-time settlement: status update persisted in ips_transactions.
     */
    async receivePayment(pain002Payload) {
        try {
            const parsed = parsePain002(pain002Payload);
            const originalId = parsed.OriginalMessageId;
            if (originalId) {
                await this.updateStatusFromPain002(originalId, parsed.Status, parsed.StatusReason);
            }
            log('IPS receivePayment (pain.002) processed', { originalMessageId: originalId, status: parsed.Status });
            return {
                acknowledged: true,
                originalMessageId: originalId,
                status: parsed.Status,
                statusReason: parsed.StatusReason,
            };
        }
        catch (e) {
            logError('IPS receivePayment failed', e);
            return { acknowledged: false, status: 'PDNG' };
        }
    }
    async updateStatusFromPain002(originalMessageId, status, statusReason) {
        try {
            await sql `
        UPDATE ips_transactions
        SET status = ${status},
            status_reason = ${statusReason ?? null},
            completed_at = CASE WHEN ${status} = 'ACCP' THEN NOW() ELSE completed_at END
        WHERE request_id = ${originalMessageId} OR payment_id = ${originalMessageId}
      `;
        }
        catch (e) {
            logError('IPS updateStatusFromPain002 failed', e, { originalMessageId });
        }
    }
    /**
     * Initiate an instant payment via Namibia IPS.
     * Uses IPS gateway when configured; otherwise routes to creditor participant endpoint (pain.001) or simulates.
     */
    async initiatePayment(req) {
        try {
            await refreshParticipantDirectoryFromDb();
        }
        catch (_) {
            /* non-fatal; directory falls back to env/static */
        }
        try {
            if (IPS_GATEWAY_URL) {
                return this.initiateViaGateway(req);
            }
            const creditor = getIPSParticipant(req.creditorParticipantId);
            const endpoint = creditor?.endpointUrl ?? creditor?.endpoint;
            if (endpoint) {
                return this.initiateViaParticipantEndpoint(req, endpoint);
            }
            log('IPS gateway not configured and no creditor endpoint – simulating acceptance', { requestId: req.requestId });
            return this.simulateAcceptance(req);
        }
        catch (error) {
            logError('IPS initiate payment failed', error, { requestId: req.requestId });
            throw error;
        }
    }
    async initiateViaGateway(req) {
        const payload = {
            MessageIdentification: req.requestId,
            DebtorParticipant: req.debtorParticipantId,
            DebtorAccount: req.debtorAccountId,
            CreditorParticipant: req.creditorParticipantId,
            CreditorAccount: req.creditorAccountId,
            Amount: parseFloat(req.amount),
            Currency: req.currency,
            RemittanceInformation: req.reference,
            EndToEndIdentification: req.endToEndId || req.requestId,
        };
        const res = await fetch(`${IPS_GATEWAY_URL}/payments/instant`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${IPS_API_KEY}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errBody = await res.text();
            logError('IPS gateway rejected payment', new Error(errBody), { requestId: req.requestId });
            await this.recordIPSTransaction(req.requestId, req.requestId, req, 'RJCT', errBody.slice(0, 500));
            return {
                paymentId: req.requestId,
                status: 'rejected',
                statusReason: errBody.slice(0, 200),
                endToEndId: req.endToEndId,
            };
        }
        const data = (await res.json());
        await this.recordIPSTransaction(req.requestId, data.PaymentId, req, data.Status);
        return {
            paymentId: data.PaymentId,
            status: data.Status === 'ACCP' ? 'accepted' : data.Status === 'RJCT' ? 'rejected' : 'pending',
            completedAt: new Date().toISOString(),
            endToEndId: data.EndToEndId || req.endToEndId,
        };
    }
    /**
     * Send payment via creditor participant endpoint (pain.001); parse pain.002 response.
     */
    async initiateViaParticipantEndpoint(req, participantEndpoint) {
        const debtorName = req.debtorName ?? 'Debtor';
        const creditorName = req.creditorName ?? 'Creditor';
        const pain001 = buildPain001(req.requestId, debtorName, req.debtorAccountId, creditorName, req.creditorAccountId, parseFloat(req.amount), req.currency, req.reference, req.endToEndId);
        const base = participantEndpoint.replace(/\/$/, '');
        const url = `${base}/ips/payments`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pain001),
        });
        let respJson;
        try {
            respJson = (await res.json());
        }
        catch {
            const errBody = await res.text();
            logError('IPS participant endpoint invalid response', new Error(errBody), { requestId: req.requestId });
            await this.recordIPSTransaction(req.requestId, req.requestId, req, 'RJCT', errBody.slice(0, 500));
            return {
                paymentId: req.requestId,
                status: 'rejected',
                statusReason: 'Invalid response from participant',
                endToEndId: req.endToEndId,
            };
        }
        const parsed = parsePain002(respJson);
        const status = parsed.Status;
        await this.recordIPSTransaction(req.requestId, req.requestId, req, status, parsed.StatusReason);
        return {
            paymentId: req.requestId,
            status: status === 'ACCP' ? 'accepted' : status === 'RJCT' ? 'rejected' : 'pending',
            statusReason: parsed.StatusReason,
            completedAt: status === 'ACCP' ? new Date().toISOString() : undefined,
            endToEndId: req.endToEndId,
        };
    }
    /**
     * Query payment status from IPS (or local record).
     */
    async getPaymentStatus(paymentId) {
        try {
            const [row] = await sql `
        SELECT payment_id as "paymentId", status, status_reason as "statusReason",
               completed_at as "completedAt", end_to_end_id as "endToEndId"
        FROM ips_transactions
        WHERE payment_id = ${paymentId}
        LIMIT 1
      `;
            return row ? row : null;
        }
        catch (error) {
            logError('IPS get status failed', error, { paymentId });
            throw error;
        }
    }
    async simulateAcceptance(req) {
        const completedAt = new Date().toISOString();
        await this.recordIPSTransaction(req.requestId, req.requestId, req, 'ACCP');
        return {
            paymentId: req.requestId,
            status: 'accepted',
            completedAt,
            endToEndId: req.endToEndId,
        };
    }
    async recordIPSTransaction(requestId, paymentId, req, status, statusReason) {
        try {
            const completedAt = status === 'ACCP' ? new Date() : null;
            await sql `
        INSERT INTO ips_transactions (
          request_id, payment_id, debtor_participant_id, debtor_account_id,
          creditor_participant_id, creditor_account_id, amount, currency,
          reference, end_to_end_id, status, status_reason, created_at, completed_at
        )
        VALUES (
          ${requestId}, ${paymentId}, ${req.debtorParticipantId}, ${req.debtorAccountId},
          ${req.creditorParticipantId}, ${req.creditorAccountId}, ${req.amount}, ${req.currency},
          ${req.reference || null}, ${req.endToEndId || null}, ${status}, ${statusReason ?? null}, NOW(),
          ${completedAt}
        )
      `;
        }
        catch (e) {
            logError('Record IPS transaction failed', e, { paymentId });
        }
    }
}
export const ipsIntegrationService = new IPSIntegrationService();
//# sourceMappingURL=IPSIntegrationService.js.map
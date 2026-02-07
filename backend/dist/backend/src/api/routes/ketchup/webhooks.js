/**
 * Webhooks API Routes
 *
 * Location: backend/src/api/routes/webhooks.ts
 * Purpose: Webhook endpoints for receiving status updates from Buffr and monitoring webhook events
 * PRD Requirement: Idempotency by event id or (voucher_id + status + timestamp) to avoid duplicate processing
 * Aligned with buffr/utils/idempotency.ts and buffr/app/api/v1/distribution/receive/route.ts
 */
import { Router } from 'express';
import { StatusMonitor } from '../../../services/status/StatusMonitor';
import { VoucherService } from '../../../services/voucher/VoucherService';
import { WebhookRepository } from '../../../services/webhook/WebhookRepository';
import { log, logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { verifyWebhookSignature } from '../../../utils/webhookSignature';
import { idempotencyService, generateIdempotencyKey, ENDPOINT_WEBHOOK } from '../../../services/idempotency/IdempotencyService';
const router = Router();
const statusMonitor = new StatusMonitor();
const voucherService = new VoucherService();
const webhookRepository = new WebhookRepository();
/**
 * POST /api/v1/webhooks/buffr
 * Receive webhook from Buffr
 * PRD Requirement: Accept idempotency key (header or body); same key returns cached response
 * Header: Idempotency-Key or idempotency-key (aligned with buffr)
 */
router.post('/buffr', async (req, res) => {
    try {
        const { event, data, timestamp } = req.body;
        const signature = req.headers['x-webhook-signature'];
        // Support both header formats (aligned with buffr)
        const clientIdempotencyKey = req.headers['Idempotency-Key']
            || req.headers['idempotency-key']
            || req.headers['x-idempotency-key'];
        log('Received webhook from Buffr', { event, data });
        // Generate or use provided idempotency key
        const voucherId = data?.voucher_id || 'unknown';
        const status = data?.status || event?.replace('voucher.', '') || 'unknown';
        const idempotencyKey = clientIdempotencyKey || generateIdempotencyKey(voucherId, status, timestamp);
        // Check for duplicate request (aligned with buffr utils/idempotency.ts)
        if (clientIdempotencyKey) {
            const cached = await idempotencyService.getCachedResponse(idempotencyKey, ENDPOINT_WEBHOOK);
            if (cached) {
                log('Webhook: duplicate request detected, returning cached response', { idempotencyKey });
                return res.status(cached.status).json(cached.body);
            }
        }
        // Verify webhook signature
        const payloadString = JSON.stringify(req.body);
        const signatureValid = signature
            ? verifyWebhookSignature(payloadString, signature)
            : false;
        if (!signatureValid && process.env.NODE_ENV === 'production') {
            log('Webhook signature verification failed', { signature });
            return res.status(401).json({
                success: false,
                error: 'Invalid webhook signature',
            });
        }
        // Store webhook event
        const webhookEvent = await webhookRepository.create({
            eventType: event,
            voucherId,
            status: 'delivered',
            deliveryAttempts: 1,
            lastAttemptAt: new Date().toISOString(),
            deliveredAt: new Date().toISOString(),
            errorMessage: undefined,
            signatureValid,
            payload: req.body,
        });
        let result;
        switch (event) {
            case 'voucher.redeemed':
                await handleVoucherRedeemed(data);
                break;
            case 'voucher.expired':
                await handleVoucherExpired(data);
                break;
            case 'voucher.delivered':
                await handleVoucherDelivered(data);
                break;
            case 'voucher.cancelled':
                await handleVoucherCancelled(data);
                break;
            case 'voucher.failed':
                await handleVoucherFailed(data);
                break;
            default:
                log('Unknown webhook event', { event });
        }
        result = {
            success: true,
            message: 'Webhook processed successfully',
            data: { webhookEventId: webhookEvent.id, idempotencyKey },
        };
        // Store idempotency record for future duplicate detection (aligned with buffr)
        if (clientIdempotencyKey) {
            await idempotencyService.setCachedResponse(idempotencyKey, 200, result, ENDPOINT_WEBHOOK);
        }
        res.json(result);
    }
    catch (error) {
        logError('Failed to process webhook', error);
        // Store failed webhook event
        try {
            await webhookRepository.create({
                eventType: req.body.event || 'unknown',
                voucherId: req.body.data?.voucher_id || 'unknown',
                status: 'failed',
                deliveryAttempts: 1,
                lastAttemptAt: new Date().toISOString(),
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
                signatureValid: false,
                payload: req.body,
            });
        }
        catch (storeError) {
            logError('Failed to store failed webhook event', storeError);
        }
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process webhook',
        });
    }
});
async function handleVoucherRedeemed(data) {
    const { voucher_id, redemption_method } = (data ?? {});
    if (!voucher_id)
        throw new Error('Missing voucher_id in voucher.redeemed webhook payload');
    await statusMonitor.trackStatus(voucher_id, 'redeemed', { redemption_method }, 'webhook');
    await voucherService.updateStatus(voucher_id, 'redeemed', redemption_method);
}
async function handleVoucherExpired(data) {
    const { voucher_id } = (data ?? {});
    if (!voucher_id)
        throw new Error('Missing voucher_id in voucher.expired webhook payload');
    await statusMonitor.trackStatus(voucher_id, 'expired', undefined, 'webhook');
    await voucherService.updateStatus(voucher_id, 'expired');
}
async function handleVoucherDelivered(data) {
    const { voucher_id } = (data ?? {});
    if (!voucher_id)
        throw new Error('Missing voucher_id in voucher.delivered webhook payload');
    await statusMonitor.trackStatus(voucher_id, 'delivered', undefined, 'webhook');
    await voucherService.updateStatus(voucher_id, 'delivered');
}
async function handleVoucherCancelled(data) {
    const { voucher_id } = (data ?? {});
    if (!voucher_id)
        throw new Error('Missing voucher_id in voucher.cancelled webhook payload');
    await statusMonitor.trackStatus(voucher_id, 'cancelled', undefined, 'webhook');
    await voucherService.updateStatus(voucher_id, 'cancelled');
}
/** Buffr notifies when delivery or redemption failed (e.g. invalid code, network error). Ketchup surfaces these via requires-attention. */
async function handleVoucherFailed(data) {
    const { voucher_id, reason } = (data ?? {});
    if (!voucher_id)
        throw new Error('Missing voucher_id in voucher.failed webhook payload');
    await statusMonitor.trackStatus(voucher_id, 'failed', { reason }, 'webhook');
    await voucherService.updateStatus(voucher_id, 'failed');
}
/**
 * GET /api/v1/webhooks
 * Get all webhook events with optional filters
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            eventType: req.query.event_type,
            voucherId: req.query.voucher_id,
            limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
            offset: req.query.offset ? parseInt(req.query.offset, 10) : 0,
        };
        const events = await webhookRepository.findAll(filters);
        const page = filters.offset ? Math.floor(filters.offset / filters.limit) + 1 : 1;
        const totalPages = Math.ceil(events.length / filters.limit);
        res.json({
            success: true,
            data: {
                data: events,
                total: events.length,
                page,
                limit: filters.limit,
                totalPages,
            },
        });
    }
    catch (error) {
        logError('Failed to get webhook events', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch webhook events',
        });
    }
});
/**
 * GET /api/v1/webhooks/:id
 * Get webhook event by ID
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const event = await webhookRepository.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Webhook event not found',
            });
        }
        res.json({
            success: true,
            data: event,
        });
    }
    catch (error) {
        logError('Failed to get webhook event', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch webhook event',
        });
    }
});
/**
 * POST /api/v1/webhooks/:id/retry
 * Retry a failed webhook delivery
 */
router.post('/:id/retry', authenticate, async (req, res) => {
    try {
        const event = await webhookRepository.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Webhook event not found',
            });
        }
        if (event.status === 'delivered') {
            return res.status(400).json({
                success: false,
                error: 'Webhook already delivered',
            });
        }
        await webhookRepository.incrementAttempts(req.params.id);
        const payload = event.payload;
        const voucherId = payload?.voucher_id ?? payload?.data?.voucher_id ?? event.voucherId;
        const newStatus = (payload?.status ?? payload?.data?.status);
        if (voucherId && newStatus) {
            try {
                await voucherService.updateStatus(voucherId, newStatus);
                await webhookRepository.updateStatus(req.params.id, 'delivered');
            }
            catch (err) {
                logError('Webhook retry: failed to apply voucher status', err, { voucherId, newStatus });
                await webhookRepository.updateStatus(req.params.id, 'failed', err instanceof Error ? err.message : 'Failed to apply status');
            }
        }
        res.json({
            success: true,
            message: 'Webhook retry processed',
        });
    }
    catch (error) {
        logError('Failed to retry webhook', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to retry webhook',
        });
    }
});
export default router;
//# sourceMappingURL=webhooks.js.map
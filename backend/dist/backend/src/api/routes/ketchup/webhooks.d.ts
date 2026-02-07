/**
 * Webhooks API Routes
 *
 * Location: backend/src/api/routes/webhooks.ts
 * Purpose: Webhook endpoints for receiving status updates from Buffr and monitoring webhook events
 * PRD Requirement: Idempotency by event id or (voucher_id + status + timestamp) to avoid duplicate processing
 * Aligned with buffr/utils/idempotency.ts and buffr/app/api/v1/distribution/receive/route.ts
 */
import { Router } from 'express';
declare const router: Router;
export default router;
//# sourceMappingURL=webhooks.d.ts.map
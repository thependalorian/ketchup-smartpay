/**
 * Open Banking routes aggregator
 * Mounted at /v1/shared/open-banking by routes/index.ts
 * Location: backend/src/api/routes/shared/openbanking/index.ts
 */

import { Router } from 'express';
import consentRouter from './consent';
import accountsRouter from './accounts';
import paymentsRouter from './payments';

const router: Router = Router();
router.use('/common', consentRouter);
router.use('/banking', accountsRouter);
router.use('/banking', paymentsRouter);

export default router;

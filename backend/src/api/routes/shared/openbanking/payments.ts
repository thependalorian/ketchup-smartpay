/**
 * Open Banking Payment Initiation API Routes
 * 
 * Location: backend/src/api/routes/openbanking/payments.ts
 * Purpose: Payment Initiation Services (PIS) per Namibian Open Banking Standards v1.0
 * 
 * Standards Compliance:
 * - Section 9.1.2: URI Structure - /bon/v1/banking/*
 * - Section 9.2.5: PIS API Use Cases
 * - Section 9.2.4: Supported Payment Types
 */

import { Router, Request, Response } from 'express';
import { PaymentInitiationService } from '../../../../services/openbanking/PaymentInitiationService';
import { authenticateOpenBanking, requireScope, logAPIAccess } from '../../../middleware/openBankingAuth';
import { log, logError } from '../../../../utils/logger';

const router: Router = Router();
const pisService = new PaymentInitiationService();

// Apply authentication and logging to all routes
router.use(authenticateOpenBanking);
router.use(logAPIAccess);

/**
 * POST /bon/v1/banking/payments
 * Make Payment (PIS Use Case #1)
 * 
 * Standards: Section 9.2.5 - Make Payment
 * Supported Types: on-us, eft-enhanced, eft-nrtc (Section 9.2.4)
 * Required Scope: banking:payments.write
 */
router.post(
  '/payments',
  requireScope('banking:payments.write'),
  async (req: Request, res: Response) => {
    try {
      const oauth = (req as any).oauth;
      const {
        debtorAccountId,
        paymentType,
        creditorName,
        creditorAccount,
        creditorBankCode,
        amount,
        currency,
        reference,
        description,
        instructionId,
      } = req.body;

      // Validate required fields
      if (!debtorAccountId || !paymentType || !creditorName || !creditorAccount || !amount) {
        res.status(400).json({
          errors: [{
            code: 'invalid_request',
            title: 'Bad Request',
            detail: 'Missing required payment parameters',
          }],
        });
        return;
      }

      // Validate payment type (Section 9.2.4)
      const validPaymentTypes = ['on-us', 'eft-enhanced', 'eft-nrtc'];
      if (!validPaymentTypes.includes(paymentType)) {
        res.status(400).json({
          errors: [{
            code: 'invalid_payment_type',
            title: 'Bad Request',
            detail: `Invalid payment type. Supported types: ${validPaymentTypes.join(', ')}`,
          }],
        });
        return;
      }

      // Validate amount format (Section 9.1.3: must have 2 decimal places)
      if (!/^\d+\.\d{2}$/.test(amount)) {
        res.status(400).json({
          errors: [{
            code: 'invalid_amount',
            title: 'Bad Request',
            detail: 'Amount must be in format: 100.00 (2 decimal places)',
          }],
        });
        return;
      }

      const payment = await pisService.makePayment(
        oauth.participantId,
        oauth.beneficiaryId,
        debtorAccountId,
        paymentType,
        creditorName,
        creditorAccount,
        amount,
        currency || 'NAD',
        creditorBankCode,
        reference,
        description,
        instructionId
      );

      // Return 201 Created for successful payment initiation
      res.status(payment.status === 'accepted' ? 201 : 200).json({
        data: payment,
      });
    } catch (error) {
      logError('Failed to initiate payment', error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('unauthorized')) {
          res.status(404).json({
            errors: [{
              code: 'resource_not_found',
              title: 'Not Found',
              detail: error.message,
            }],
          });
          return;
        }
      }

      res.status(500).json({
        errors: [{
          code: 'server_error',
          title: 'Internal Server Error',
          detail: 'Failed to initiate payment',
        }],
      });
    }
  }
);

/**
 * GET /bon/v1/banking/payments/{paymentId}
 * Get Payment Status (PIS Use Case #3)
 * 
 * Standards: Section 9.2.5 - Get Payment Status
 * Required Scope: banking:payments.read
 */
router.get(
  '/payments/:paymentId',
  requireScope('banking:payments.read'),
  async (req: Request, res: Response) => {
    try {
      const oauth = (req as any).oauth;
      const { paymentId } = req.params;

      const payment = await pisService.getPaymentStatus(paymentId, oauth.participantId);

      res.json({
        data: payment,
      });
    } catch (error) {
      logError('Failed to get payment status', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          errors: [{
            code: 'resource_not_found',
            title: 'Not Found',
            detail: 'Payment not found',
          }],
        });
        return;
      }

      res.status(500).json({
        errors: [{
          code: 'server_error',
          title: 'Internal Server Error',
          detail: 'Failed to retrieve payment status',
        }],
      });
    }
  }
);

/**
 * GET /bon/v1/banking/accounts/{accountId}/beneficiaries
 * List Beneficiaries (PIS Use Case #2)
 * 
 * Standards: Section 9.2.5 - List Beneficiaries
 * Required Scope: banking:payments.write
 */
router.get(
  '/accounts/:accountId/beneficiaries',
  requireScope('banking:payments.write'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;

      const beneficiaries = await pisService.listBeneficiaries(accountId);

      res.json({
        data: beneficiaries,
        meta: {
          totalRecords: beneficiaries.length,
        },
      });
    } catch (error) {
      logError('Failed to list beneficiaries', error);
      res.status(500).json({
        errors: [{
          code: 'server_error',
          title: 'Internal Server Error',
          detail: 'Failed to retrieve beneficiaries',
        }],
      });
    }
  }
);

export default router;

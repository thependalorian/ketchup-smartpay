/**
 * Open Banking Account Information API Routes
 * 
 * Location: backend/src/api/routes/openbanking/accounts.ts
 * Purpose: Account Information Services (AIS) per Namibian Open Banking Standards v1.0
 * 
 * Standards Compliance:
 * - Section 9.1.2: URI Structure - /bon/v1/banking/*
 * - Section 9.2.5: AIS API Use Cases
 * - Section 9.1.4: Pagination Standards
 */

import { Router, Request, Response } from 'express';
import { AccountInformationService } from '../../../../services/openbanking/AccountInformationService';
import { authenticateOpenBanking, requireScope, logAPIAccess } from '../../../middleware/openBankingAuth';
import { log, logError } from '../../../../utils/logger';

const router = Router();
const aisService = new AccountInformationService();

// Apply authentication and logging to all routes
router.use(authenticateOpenBanking);
router.use(logAPIAccess);

/**
 * GET /bon/v1/banking/accounts
 * List Accounts (AIS Use Case #1)
 * 
 * Standards: Section 9.2.5 - List Accounts
 * Required Scope: banking:accounts.basic.read
 */
router.get(
  '/accounts',
  requireScope('banking:accounts.basic.read'),
  async (req: Request, res: Response) => {
    try {
      const oauth = (req as any).oauth;
      const status = req.query.status as 'open' | 'closed' | undefined;

      const accounts = await aisService.listAccounts(oauth.beneficiaryId, status);

      // Section 9.1.8: Response payload structure
      res.json({
        data: accounts,
        meta: {
          totalRecords: accounts.length,
        },
      });
    } catch (error) {
      logError('Failed to list accounts', error);
      res.status(500).json({
        errors: [{
          code: 'server_error',
          title: 'Internal Server Error',
          detail: 'Failed to retrieve accounts',
        }],
      });
    }
  }
);

/**
 * GET /bon/v1/banking/accounts/{accountId}/balance
 * Get Account Balance (AIS Use Case #2)
 * 
 * Standards: Section 9.2.5 - Get Account Balance
 * Required Scope: banking:accounts.basic.read
 */
router.get(
  '/accounts/:accountId/balance',
  requireScope('banking:accounts.basic.read'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;

      const balances = await aisService.getAccountBalance(accountId);

      res.json({
        data: balances,
        meta: {
          totalRecords: balances.length,
        },
      });
    } catch (error) {
      logError('Failed to get account balance', error);
      
      if (error instanceof Error && error.message === 'Account not found') {
        res.status(404).json({
          errors: [{
            code: 'resource_not_found',
            title: 'Not Found',
            detail: 'Account not found',
          }],
        });
        return;
      }

      res.status(500).json({
        errors: [{
          code: 'server_error',
          title: 'Internal Server Error',
          detail: 'Failed to retrieve balance',
        }],
      });
    }
  }
);

/**
 * GET /bon/v1/banking/accounts/{accountId}/transactions
 * List Transactions (AIS Use Case #3)
 * 
 * Standards: Section 9.2.5 - List Transactions
 * Section 9.1.4: Pagination (max 1000 records per page)
 * Required Scope: banking:accounts.basic.read
 */
router.get(
  '/accounts/:accountId/transactions',
  requireScope('banking:accounts.basic.read'),
  async (req: Request, res: Response) => {
    try {
      const { accountId } = req.params;
      const fromDate = req.query.fromDate as string | undefined;
      const toDate = req.query.toDate as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 25;

      // Validate page size (Section 9.1.4)
      if (pageSize > 1000) {
        res.status(400).json({
          errors: [{
            code: 'invalid_page_size',
            title: 'Bad Request',
            detail: 'Page size cannot exceed 1000 records',
          }],
        });
        return;
      }

      const result = await aisService.listTransactions(
        accountId,
        fromDate,
        toDate,
        page,
        pageSize
      );

      // Build pagination links (Section 9.1.4)
      const basePath = `/bon/v1/banking/accounts/${accountId}/transactions`;
      const buildUrl = (p: number) => {
        let url = `${basePath}?page=${p}&pageSize=${pageSize}`;
        if (fromDate) url += `&fromDate=${fromDate}`;
        if (toDate) url += `&toDate=${toDate}`;
        return url;
      };

      const links: any = {};
      if (page > 1) {
        links.first = buildUrl(1);
        links.prev = buildUrl(page - 1);
      }
      if (page < result.totalPages) {
        links.next = buildUrl(page + 1);
        links.last = buildUrl(result.totalPages);
      }

      res.json({
        data: result.transactions,
        links,
        meta: {
          totalRecords: result.totalRecords,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      logError('Failed to list transactions', error);
      
      if (error instanceof Error && error.message === 'Account not found') {
        res.status(404).json({
          errors: [{
            code: 'resource_not_found',
            title: 'Not Found',
            detail: 'Account not found',
          }],
        });
        return;
      }

      res.status(500).json({
        errors: [{
          code: 'server_error',
          title: 'Internal Server Error',
          detail: 'Failed to retrieve transactions',
        }],
      });
    }
  }
);

export default router;

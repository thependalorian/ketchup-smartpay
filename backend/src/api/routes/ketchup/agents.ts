/**
 * Agents API Routes
 * 
 * Purpose: REST API endpoints for agent network management
 * Location: backend/src/api/routes/ketchup/agents.ts
 */

import { Router, Request, Response } from 'express';
import { APIResponse, PaginatedResponse } from '../../../../../shared/types';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { AgentService } from '../../../services/agents/AgentService';
import { AgentNetworkService } from '../../../services/agents/AgentNetworkService';

const router: Router = Router();
const agentService = new AgentService();
const networkService = new AgentNetworkService();

/**
 * GET /api/v1/ketchup/agents
 * Get all agents with optional filters
 */
router.get('/', authenticate, async (req: Request, res: Response<APIResponse<PaginatedResponse<any>>>) => {
  try {
    const region = req.query.region as string | undefined;
    const status = req.query.status as string | undefined;
    const type = req.query.type as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    const agents = await agentService.getAll({ region, status, type });

    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(agents.length / limit);
    const paginatedAgents = agents.slice(offset, offset + limit);

    res.json({
      success: true,
      data: {
        data: paginatedAgents,
        total: agents.length,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    logError('Failed to get agents', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agents',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/stats
 * Get agent network statistics
 */
router.get('/stats', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const type = req.query.type as string | undefined;
    const stats = await agentService.getStats(type);
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logError('Failed to get agent stats', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agent stats',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/network-stats
 * Get network-wide statistics for dashboard
 */
router.get('/network-stats', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const stats = await networkService.getNetworkStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logError('Failed to get network stats', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch network stats',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/by-type/:type
 * Get agents by type
 */
router.get('/by-type/:type', authenticate, async (req: Request, res: Response<APIResponse<any[]>>) => {
  try {
    const { type } = req.params;
    const agents = await agentService.getAll({ type });
    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    logError('Failed to get agents by type', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agents',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/:id
 * Get agent details
 */
router.get('/:id', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const agent = await agentService.getById(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }
    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    logError('Failed to get agent', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agent',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/:id/float
 * Get agent float balance and transactions
 */
router.get('/:id/float', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const float = await networkService.getAgentFloat(id);
    res.json({
      success: true,
      data: float,
    });
  } catch (error) {
    logError('Failed to get agent float', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch float',
    });
  }
});

/**
 * POST /api/v1/ketchup/agents/:id/float/topup
 * Top up agent float
 */
router.post('/:id/float/topup', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const { amount, notes, processedBy } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    const result = await networkService.topupFloat(id, amount, notes, processedBy);
    res.json({
      success: true,
      data: result,
      message: 'Float topup successful',
    });
  } catch (error) {
    logError('Failed to topup float', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to topup float',
    });
  }
});

/**
 * POST /api/v1/ketchup/agents/:id/float/withdraw
 * Withdraw from agent float
 */
router.post('/:id/float/withdraw', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const { amount, notes, approvedBy } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    const result = await networkService.withdrawFloat(id, amount, notes, approvedBy);
    res.json({
      success: true,
      data: result,
      message: 'Float withdrawal successful',
    });
  } catch (error) {
    logError('Failed to withdraw float', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to withdraw float',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/:id/transactions
 * Get agent transaction history
 */
router.get('/:id/transactions', authenticate, async (req: Request, res: Response<APIResponse<any[]>>) => {
  try {
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const transactions = await networkService.getAgentTransactions(id, days);
    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    logError('Failed to get agent transactions', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch transactions',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/:id/performance
 * Get agent performance metrics
 */
router.get('/:id/performance', authenticate, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const performance = await networkService.getAgentPerformance(id, days);
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    logError('Failed to get agent performance', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch performance',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/performance/rankings
 * Get agent performance rankings
 */
router.get('/performance/rankings', authenticate, async (req: Request, res: Response<APIResponse<any[]>>) => {
  try {
    const type = req.query.type as string | undefined;
    const metric = req.query.metric as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const rankings = await networkService.getPerformanceRankings(type, metric, limit);
    res.json({
      success: true,
      data: rankings,
    });
  } catch (error) {
    logError('Failed to get performance rankings', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch rankings',
    });
  }
});

/**
 * GET /api/v1/ketchup/agents/liquidity/alerts
 * Get low liquidity alerts
 */
router.get('/liquidity/alerts', authenticate, async (req: Request, res: Response<APIResponse<any[]>>) => {
  try {
    const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : 1.5;
    const alerts = await networkService.getLowLiquidityAlerts(threshold);
    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    logError('Failed to get liquidity alerts', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch alerts',
    });
  }
});

export default router;

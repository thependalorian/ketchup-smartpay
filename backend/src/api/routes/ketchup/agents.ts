/**
 * Agents API Routes
 * 
 * Purpose: REST API endpoints for agent network management
 * Location: backend/src/api/routes/agents.ts
 */

import { Router, Request, Response } from 'express';
import { APIResponse, PaginatedResponse } from '../../../../../shared/types';
import { logError } from '../../../utils/logger';
import { authenticate } from '../../middleware/auth';
import { AgentService } from '../../../services/agents/AgentService';

const router = Router();
const agentService = new AgentService();

/**
 * GET /api/v1/agents
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
 * GET /api/v1/agents/stats
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

export default router;

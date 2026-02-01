/**
 * Savings Goals API
 * 
 * Location: app/api/v1/savings/goals/route.ts
 * Purpose: Manage savings goals
 * 
 * Endpoints:
 * - GET /api/v1/savings/goals - Get user's savings goals
 * - POST /api/v1/savings/goals - Create savings goal
 */

import { ExpoRequest } from 'expo-router/server';
import { savingsWalletService } from '@/services/savingsWalletService';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { getUserIdFromRequest } from '@/utils/db';
import { log } from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const goals = await savingsWalletService.getSavingsGoals(userId);

    return successResponse(
      {
        goals: goals.map(goal => ({
          id: goal.id,
          userId: goal.user_id,
          name: goal.name,
          targetAmount: parseFloat(goal.target_amount.toString()),
          currentAmount: parseFloat(goal.current_amount.toString()),
          progress: parseFloat(goal.target_amount.toString()) > 0
            ? (parseFloat(goal.current_amount.toString()) / parseFloat(goal.target_amount.toString())) * 100
            : 0,
          targetDate: goal.target_date,
          status: goal.status,
          autoTransferEnabled: goal.auto_transfer_enabled,
          autoTransferAmount: goal.auto_transfer_amount ? parseFloat(goal.auto_transfer_amount.toString()) : null,
          autoTransferFrequency: goal.auto_transfer_frequency,
          roundUpEnabled: goal.round_up_enabled,
          roundUpMultiple: goal.round_up_multiple ? parseFloat(goal.round_up_multiple.toString()) : null,
        })),
      },
      'Savings goals retrieved successfully'
    );
  } catch (error: any) {
    log.error('Error getting savings goals:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to get savings goals',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return errorResponse('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const body = await req.json();
    const {
      name,
      targetAmount,
      targetDate,
      autoTransferEnabled,
      autoTransferAmount,
      autoTransferFrequency,
      roundUpEnabled,
      roundUpMultiple,
    } = body;

    if (!name || !targetAmount || targetAmount <= 0) {
      return errorResponse('name and targetAmount (greater than 0) are required', HttpStatus.BAD_REQUEST);
    }

    const goal = await savingsWalletService.createSavingsGoal(userId, {
      name,
      targetAmount,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      autoTransferEnabled,
      autoTransferAmount,
      autoTransferFrequency,
      roundUpEnabled,
      roundUpMultiple,
    });

    return successResponse(
      {
        goal: {
          id: goal.id,
          userId: goal.user_id,
          name: goal.name,
          targetAmount: parseFloat(goal.target_amount.toString()),
          currentAmount: parseFloat(goal.current_amount.toString()),
          targetDate: goal.target_date,
          status: goal.status,
        },
        message: 'Savings goal created successfully',
      },
      'Savings goal created successfully',
      HttpStatus.CREATED
    );
  } catch (error: any) {
    log.error('Error creating savings goal:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create savings goal',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAuthRoute(RATE_LIMITS.standard, getHandler);
export const POST = secureAuthRoute(RATE_LIMITS.standard, postHandler);

/**
 * Open Banking API: /api/v1/bills/categories
 * 
 * Get bill categories (Open Banking format)
 * 
 * Compliance: PSD-12, Open Banking v1
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { log } from '@/utils/logger';

async function handleGetBillCategories(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        'BUFFR.Auth.Unauthorized',
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        'BUFFR.Resource.NotFound',
        'User not found',
        404
      );
    }

    // Get bill categories with counts
    const categories = await query<{
      category: string;
      count: string;
    }>(
      `SELECT 
        category,
        COUNT(*) as count
      FROM bills
      WHERE user_id = $1
      GROUP BY category
      ORDER BY category`,
      [actualUserId]
    );

    // Default categories if user has no bills
    const defaultCategories = [
      { id: 'utilities', name: 'Utilities', icon: 'bolt', billCount: 0 },
      { id: 'water', name: 'Water', icon: 'tint', billCount: 0 },
      { id: 'internet', name: 'Internet', icon: 'wifi', billCount: 0 },
      { id: 'tv', name: 'TV & Media', icon: 'tv', billCount: 0 },
      { id: 'insurance', name: 'Insurance', icon: 'shield', billCount: 0 },
      { id: 'other', name: 'Other', icon: 'file-text', billCount: 0 },
    ];

    const categoryMap: Record<string, { name: string; icon: string }> = {
      utilities: { name: 'Utilities', icon: 'bolt' },
      water: { name: 'Water', icon: 'tint' },
      internet: { name: 'Internet', icon: 'wifi' },
      tv: { name: 'TV & Media', icon: 'tv' },
      insurance: { name: 'Insurance', icon: 'shield' },
      other: { name: 'Other', icon: 'file-text' },
    };

    const formattedCategories = defaultCategories.map((cat) => {
      const dbCategory = categories.find((c) => c.category === cat.id);
      return {
        CategoryId: cat.id,
        Name: cat.name,
        Icon: cat.icon,
        BillCount: dbCategory ? parseInt(dbCategory.count, 10) : 0,
      };
    });

    const response = {
      Data: {
        Categories: formattedCategories,
        Total: formattedCategories.length,
      },
      Links: {
        Self: '/api/v1/bills/categories',
      },
      Meta: {},
    };

    return helpers.success(
      response,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching bill categories:', error);
    return helpers.error(
      'BUFFR.Server.Error',
      'An error occurred while fetching bill categories',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetBillCategories,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

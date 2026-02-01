/**
 * Open Banking API: /api/v1/groups
 * 
 * Group management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId, getUserNamesBatch } from '@/utils/db';
import { validateStringLength, validateCurrency } from '@/utils/validators';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * GET /api/v1/groups
 * Get all groups for the current user
 */
async function handleGetGroups(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    // Fetch groups where user is owner or member
    const groups = await query<any>(
      `SELECT g.* FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.owner_id = $1 OR gm.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [actualUserId]
    );

    // Fetch all member user IDs
    const allMemberIds = new Set<string>();
    groups.forEach((group: any) => {
      allMemberIds.add(group.owner_id);
    });

    // Fetch members for each group and collect user IDs
    const membersByGroup = await Promise.all(
      groups.map(async (group: any) => {
        const members = await query<any>(
          `SELECT * FROM group_members WHERE group_id = $1`,
          [group.id]
        );
        members.forEach((m: any) => allMemberIds.add(m.user_id));
        return { groupId: group.id, members };
      })
    );

    // Fetch all user names in batch
    const userNames = await getUserNamesBatch(Array.from(allMemberIds), actualUserId);

    // Format as Open Banking
    const formattedGroups = groups.map((group: any, index: number) => {
      const { members } = membersByGroup[index];
      return {
        GroupId: group.id,
        Name: group.name,
        Description: group.description || null,
        TotalAmount: parseFloat(group.current_amount.toString()),
        TargetAmount: group.target_amount ? parseFloat(group.target_amount.toString()) : null,
        Currency: group.currency,
        OwnerId: group.owner_id,
        Members: members.map((m: any) => ({
          UserId: m.user_id,
          Name: userNames[m.user_id] || 'Member',
          Contribution: parseFloat(m.contribution.toString()),
          IsOwner: m.is_owner,
        })),
        CreatedDateTime: group.created_at.toISOString(),
      };
    });

    // Pagination
    const { page, pageSize } = parsePaginationParams(req);
    const total = formattedGroups.length;
    const offset = (page - 1) * pageSize;
    const paginatedGroups = formattedGroups.slice(offset, offset + pageSize);

    return helpers.paginated(
      paginatedGroups,
      'Groups',
      '/api/v1/groups',
      page,
      pageSize,
      total,
      req,
      undefined,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching groups:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching groups',
      500
    );
  }
}

/**
 * POST /api/v1/groups
 * Create a new group
 */
async function handleCreateGroup(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return helpers.error(
        OpenBankingErrorCode.UNAUTHORIZED,
        'Authentication required',
        401
      );
    }

    const actualUserId = await findUserId(query, userId);
    if (!actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'User not found',
        404
      );
    }

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Name, Description, TargetAmount, Currency } = Data;

    if (!Name) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Name is required',
        400
      );
    }

    // Validate name length
    const nameCheck = validateStringLength(Name, {
      min: 1,
      max: 100,
      fieldName: 'Group name',
      allowEmpty: false
    });
    if (!nameCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        nameCheck.error || 'Invalid group name',
        400
      );
    }

    // Validate description length if provided
    if (Description) {
      const descCheck = validateStringLength(Description, {
        min: 0,
        max: 500,
        fieldName: 'Description',
        allowEmpty: true
      });
      if (!descCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID_FORMAT,
          descCheck.error || 'Invalid description',
          400
        );
      }
    }

    // Validate currency if provided
    if (Currency) {
      const currencyCheck = validateCurrency(Currency);
      if (!currencyCheck.valid) {
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID_FORMAT,
          currencyCheck.error || 'Invalid currency',
          400
        );
      }
    }

    // Create group
    const groupResult = await query<any>(
      `INSERT INTO groups (id, owner_id, name, description, target_amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        randomUUID(),
        actualUserId,
        Name.trim(),
        Description?.trim() || null,
        TargetAmount || null,
        Currency || 'NAD',
      ]
    );

    if (groupResult.length === 0) {
      throw new Error('Failed to create group');
    }

    const group = groupResult[0];

    // Add owner as member
    await query(
      `INSERT INTO group_members (group_id, user_id, contribution, is_owner)
       VALUES ($1, $2, $3, $4)`,
      [group.id, actualUserId, 0, true]
    );

    const groupResponse = {
      Data: {
        GroupId: group.id,
        Name: group.name,
        Description: group.description || null,
        TotalAmount: 0,
        TargetAmount: group.target_amount ? parseFloat(group.target_amount.toString()) : null,
        Currency: group.currency,
        OwnerId: group.owner_id,
        Members: [
          {
            UserId: actualUserId,
            Name: 'You',
            Contribution: 0,
            IsOwner: true,
          },
        ],
        CreatedDateTime: group.created_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/groups/${group.id}`,
      },
      Meta: {},
    };

    return helpers.created(
      groupResponse,
      `/api/v1/groups/${group.id}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating group:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the group',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetGroups,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateGroup,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

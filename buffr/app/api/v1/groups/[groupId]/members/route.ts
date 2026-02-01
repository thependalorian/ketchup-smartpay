/**
 * Open Banking API: /api/v1/groups/{groupId}/members
 * 
 * Add or remove group members (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId, getUserName } from '@/utils/db';
import { log } from '@/utils/logger';
import { randomUUID } from 'crypto';

/**
 * POST /api/v1/groups/{groupId}/members
 * Add a member to a group
 */
async function handleAddMember(
  req: ExpoRequest,
  { params }: { params: { groupId: string } }
) {
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

    const { groupId } = params;
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { UserId, UserName, UserPhone } = Data;

    if (!UserId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.UserId is required',
        400
      );
    }

    // Verify current user is owner or member
    const group = await queryOne<any>(
      'SELECT * FROM groups WHERE id = $1',
      [groupId]
    );

    if (!group) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Group not found',
        404
      );
    }

    const isOwner = group.owner_id === actualUserId;
    const existingMember = await queryOne<any>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, actualUserId]
    );

    if (!isOwner && !existingMember) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        'Only group owner or members can add new members',
        403
      );
    }

    // Check if user is already a member
    const alreadyMember = await queryOne<any>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, UserId]
    );

    if (alreadyMember) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_INVALID,
        'User is already a member of this group',
        400
      );
    }

    // Add member to group
    const result = await query<any>(
      `INSERT INTO group_members (id, group_id, user_id, contribution, is_owner)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [randomUUID(), groupId, UserId, 0, false]
    );

    if (result.length === 0) {
      throw new Error('Failed to add member');
    }

    // Fetch user name
    const memberName = UserName || await getUserName(UserId, actualUserId);

    const memberResponse = {
      Data: {
        MemberId: result[0].user_id,
        Name: memberName,
        PhoneNumber: UserPhone || null,
        Contribution: 0,
        IsOwner: false,
        JoinedDateTime: result[0].joined_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/groups/${groupId}/members/${result[0].user_id}`,
        Group: `/api/v1/groups/${groupId}`,
      },
      Meta: {},
    };

    return helpers.created(
      memberResponse,
      `/api/v1/groups/${groupId}/members/${result[0].user_id}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error adding member:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while adding the member',
      500
    );
  }
}

/**
 * DELETE /api/v1/groups/{groupId}/members
 * Remove a member from a group (owner only)
 */
async function handleRemoveMember(
  req: ExpoRequest,
  { params }: { params: { groupId: string } }
) {
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

    const { groupId } = params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'memberId query parameter is required',
        400
      );
    }

    // Verify current user is owner
    const group = await queryOne<any>(
      'SELECT * FROM groups WHERE id = $1',
      [groupId]
    );

    if (!group) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Group not found',
        404
      );
    }

    if (group.owner_id !== actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        'Only group owner can remove members',
        403
      );
    }

    // Prevent removing owner
    const member = await queryOne<any>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, memberId]
    );

    if (member?.is_owner) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_INVALID,
        'Cannot remove group owner',
        400
      );
    }

    // Remove member from group
    await query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, memberId]
    );

    return helpers.noContent(context?.requestId);
  } catch (error) {
    log.error('Error removing member:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while removing the member',
      500
    );
  }
}

export const POST = openBankingSecureRoute(
  handleAddMember,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const DELETE = openBankingSecureRoute(
  handleRemoveMember,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

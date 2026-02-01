/**
 * Open Banking API: /api/v1/groups/{groupId}
 * 
 * Get, update, or delete a specific group (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, queryOne, getUserIdFromRequest, findUserId, getUserNamesBatch } from '@/utils/db';
import { validateUUID, validateStringLength } from '@/utils/validators';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/groups/{groupId}
 * Get a specific group
 */
async function handleGetGroup(
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

    // Validate group ID format
    const idCheck = validateUUID(groupId);
    if (!idCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        idCheck.error || 'Invalid group ID',
        400
      );
    }

    // Fetch group
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

    // Check if user is member or owner
    const member = await queryOne<any>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, actualUserId]
    );

    if (!member && group.owner_id !== actualUserId) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        'Unauthorized',
        403
      );
    }

    // Fetch all members
    const members = await query<any>(
      'SELECT * FROM group_members WHERE group_id = $1',
      [groupId]
    );

    // Fetch user names for all members
    const memberIds = members.map((m: any) => m.user_id);
    memberIds.push(group.owner_id);
    const userNames = await getUserNamesBatch(memberIds, actualUserId);

    const groupResponse = {
      Data: {
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
        UpdatedDateTime: group.updated_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/groups/${groupId}`,
      },
      Meta: {},
    };

    return helpers.success(
      groupResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error fetching group:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while fetching the group',
      500
    );
  }
}

/**
 * PUT /api/v1/groups/{groupId}
 * Update a group (owner only)
 */
async function handleUpdateGroup(
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

    // Validate group ID format
    const idCheck = validateUUID(groupId);
    if (!idCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        idCheck.error || 'Invalid group ID',
        400
      );
    }

    // Check if user is owner
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
        'Only group owner can update group',
        403
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

    const { Name, Description, TargetAmount } = Data;

    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (Name !== undefined) {
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
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(Name.trim());
    }

    if (Description !== undefined) {
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
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(Description ? Description.trim() : null);
    }

    if (TargetAmount !== undefined) {
      updateFields.push(`target_amount = $${paramIndex++}`);
      updateValues.push(TargetAmount);
    }

    if (updateFields.length === 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'No fields to update',
        400
      );
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(groupId);

    // Update group
    const result = await query<any>(
      `UPDATE groups SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    if (result.length === 0) {
      throw new Error('Failed to update group');
    }

    const updatedGroup = result[0];

    const groupResponse = {
      Data: {
        GroupId: updatedGroup.id,
        Name: updatedGroup.name,
        Description: updatedGroup.description || null,
        TargetAmount: updatedGroup.target_amount ? parseFloat(updatedGroup.target_amount.toString()) : null,
        UpdatedDateTime: updatedGroup.updated_at.toISOString(),
      },
      Links: {
        Self: `/api/v1/groups/${groupId}`,
      },
      Meta: {},
    };

    return helpers.success(
      groupResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error updating group:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while updating the group',
      500
    );
  }
}

/**
 * DELETE /api/v1/groups/{groupId}
 * Delete a group (owner only)
 */
async function handleDeleteGroup(
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

    // Validate group ID format
    const idCheck = validateUUID(groupId);
    if (!idCheck.valid) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID_FORMAT,
        idCheck.error || 'Invalid group ID',
        400
      );
    }

    // Verify user is owner
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
        'Only group owner can delete group',
        403
      );
    }

    // Delete group (cascade will delete members)
    await query('DELETE FROM groups WHERE id = $1', [groupId]);

    return helpers.noContent(context?.requestId);
  } catch (error) {
    log.error('Error deleting group:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while deleting the group',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetGroup,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const PUT = openBankingSecureRoute(
  handleUpdateGroup,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const DELETE = openBankingSecureRoute(
  handleDeleteGroup,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

/**
 * API Route: /api/groups/[id]
 * 
 * - GET: Fetches a single group by ID
 * - PUT: Updates a group (name, description, etc.)
 * - DELETE: Deletes a group (owner only)
 */
import { ExpoRequest } from 'expo-router/server';

import { query, queryOne, getUserIdFromRequest, checkUserAuthorization, getUserNamesBatch } from '@/utils/db';
import logger from '@/utils/logger';
import { validateUUID } from '@/utils/validators';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, noContentResponse, HttpStatus } from '@/utils/apiResponse';

interface GroupRow {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  target_amount: number | null;
  current_amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
}

interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  contribution: number;
  is_owner: boolean;
  joined_at: Date;
}

async function getHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate group ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid group ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }
  
    // Fetch group from Neon DB
    const group = await queryOne<GroupRow>(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (!group) {
      return errorResponse('Group not found', HttpStatus.NOT_FOUND);
    }

    // Check if user is member or owner
    const member = await queryOne<GroupMemberRow>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (!member && group.owner_id !== userId) {
      return errorResponse('Unauthorized', HttpStatus.FORBIDDEN);
    }

    // Fetch all members
    const members = await query<GroupMemberRow>(
      'SELECT * FROM group_members WHERE group_id = $1',
      [id]
    );

    // Fetch user names for all members
    const memberIds = members.map(m => m.user_id);
    memberIds.push(group.owner_id);
    const userNames = await getUserNamesBatch(memberIds, userId);
  
    const formattedGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      totalAmount: parseFloat(group.current_amount.toString()),
      targetAmount: group.target_amount ? parseFloat(group.target_amount.toString()) : undefined,
      currency: group.currency,
      ownerId: group.owner_id,
      members: members.map(m => ({
        id: m.user_id,
        name: userNames[m.user_id] || 'Member',
        contribution: parseFloat(m.contribution.toString()),
        isOwner: m.is_owner,
      })),
      createdAt: group.created_at,
    };
  
    return successResponse(formattedGroup);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching group');
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch group',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function putHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate group ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid group ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    // Check if user is owner
    const group = await queryOne<GroupRow>(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (!group) {
      return errorResponse('Group not found', HttpStatus.NOT_FOUND);
    }

    if (group.owner_id !== userId) {
      return errorResponse('Only group owner can update group', HttpStatus.FORBIDDEN);
    }

    const { name, description, targetAmount } = await req.json();
  
    // Build update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      updateValues.push(description);
    }
    if (targetAmount !== undefined) {
      updateFields.push(`target_amount = $${paramIndex++}`);
      updateValues.push(targetAmount);
    }

    if (updateFields.length === 0) {
      return errorResponse('No fields to update', HttpStatus.BAD_REQUEST);
    }

    updateValues.push(id);

    // Update group in Neon DB
    const result = await query<GroupRow>(
      `UPDATE groups SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      updateValues
    );

    if (result.length === 0) {
      throw new Error('Failed to update group');
    }

    const updatedGroup = result[0];
  
    return successResponse({
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      targetAmount: updatedGroup.target_amount ? parseFloat(updatedGroup.target_amount.toString()) : undefined,
    }, 'Group updated successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error updating group');
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to update group',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function deleteHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate group ID format
    const idCheck = validateUUID(id);
    if (!idCheck.valid) {
      return errorResponse(idCheck.error || 'Invalid group ID', HttpStatus.BAD_REQUEST);
    }
    
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }
  
    // Verify user is owner
    const group = await queryOne<GroupRow>(
      'SELECT * FROM groups WHERE id = $1',
      [id]
    );

    if (!group) {
      return errorResponse('Group not found', HttpStatus.NOT_FOUND);
    }

    if (group.owner_id !== userId) {
      return errorResponse('Only group owner can delete group', HttpStatus.FORBIDDEN);
    }

    // Delete group (cascade will delete members)
    await query('DELETE FROM groups WHERE id = $1', [id]);
  
    return successResponse(null, 'Group deleted successfully');
  } catch (error) {
    logger.error({ err: error }, 'Error deleting group');
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to delete group',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const PUT = secureAuthRoute(RATE_LIMITS.api, putHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);

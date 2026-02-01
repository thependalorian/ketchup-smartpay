/**
 * API Route: /api/groups/[id]/members
 * 
 * - POST: Add a member to a group
 * - DELETE: Remove a member from a group (with memberId query param)
 */
import { ExpoRequest } from 'expo-router/server';

import { query, queryOne, getUserIdFromRequest, getUserName } from '@/utils/db';
import logger from '@/utils/logger';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, noContentResponse, HttpStatus } from '@/utils/apiResponse';

interface GroupRow {
  id: string;
  owner_id: string;
}

interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  contribution: number;
  is_owner: boolean;
  joined_at: Date;
}

async function postHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = await getUserIdFromRequest(req);
    
    if (!currentUserId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { id: groupId } = params;
    const { userId, userName, userPhone } = await req.json();
  
    if (!userId) {
      return errorResponse('User ID is required', HttpStatus.BAD_REQUEST);
    }

    // Verify current user is owner or member
    const group = await queryOne<GroupRow>(
      'SELECT * FROM groups WHERE id = $1',
      [groupId]
    );

    if (!group) {
      return errorResponse('Group not found', HttpStatus.NOT_FOUND);
    }

    const isOwner = group.owner_id === currentUserId;
    const existingMember = await queryOne<GroupMemberRow>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, currentUserId]
    );

    if (!isOwner && !existingMember) {
      return errorResponse('Only group owner or members can add new members', HttpStatus.FORBIDDEN);
    }

    // Check if user is already a member
    const alreadyMember = await queryOne<GroupMemberRow>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );

    if (alreadyMember) {
      return errorResponse('User is already a member of this group', HttpStatus.BAD_REQUEST);
    }

    // Add member to group
    const result = await query<GroupMemberRow>(
      `INSERT INTO group_members (group_id, user_id, contribution, is_owner)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [groupId, userId, 0, false]
    );

    if (result.length === 0) {
      throw new Error('Failed to add member');
    }

    // Fetch user name
    const memberName = userName || await getUserName(userId, currentUserId);

    const newMember = {
      id: result[0].user_id,
      name: memberName,
      phoneNumber: userPhone || '',
      contribution: parseFloat(result[0].contribution.toString()),
      isOwner: result[0].is_owner,
      joinedAt: result[0].joined_at,
    };
  
    return createdResponse(newMember, `/api/groups/${groupId}/members/${newMember.id}`);
  } catch (error) {
    logger.error({ err: error }, 'Error adding member');
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to add member',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function deleteHandler(
  req: ExpoRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUserId = await getUserIdFromRequest(req);
    
    if (!currentUserId) {
      return errorResponse('Authentication required', HttpStatus.UNAUTHORIZED);
    }

    const { id: groupId } = params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
  
    if (!memberId) {
      return errorResponse('Member ID is required (query param: memberId)', HttpStatus.BAD_REQUEST);
    }

    // Verify current user is owner
    const group = await queryOne<GroupRow>(
      'SELECT * FROM groups WHERE id = $1',
      [groupId]
    );

    if (!group) {
      return errorResponse('Group not found', HttpStatus.NOT_FOUND);
    }

    if (group.owner_id !== currentUserId) {
      return errorResponse('Only group owner can remove members', HttpStatus.FORBIDDEN);
    }

    // Prevent removing owner
    const member = await queryOne<GroupMemberRow>(
      'SELECT * FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, memberId]
    );

    if (member?.is_owner) {
      return errorResponse('Cannot remove group owner', HttpStatus.BAD_REQUEST);
    }

    // Remove member from group
    await query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, memberId]
    );
  
    return noContentResponse();
  } catch (error) {
    logger.error({ err: error }, 'Error removing member');
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to remove member',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Apply rate limiting and security headers
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);
export const DELETE = secureAuthRoute(RATE_LIMITS.api, deleteHandler);

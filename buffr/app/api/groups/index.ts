/**
 * API Route: /api/groups
 *
 * - GET: Fetches all groups for the current user
 * - POST: Creates a new group
 */
import { ExpoRequest } from 'expo-router/server';

import { query, getUserIdFromRequest, getUserNamesBatch } from '@/utils/db';
import { validateStringLength, validateCurrency } from '@/utils/validators';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

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

async function handleGet(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return jsonResponse(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch groups where user is owner or member
    const groups = await query<GroupRow>(
      `SELECT g.* FROM groups g
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.owner_id = $1 OR gm.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [userId]
    );

    // Fetch all member user IDs
    const allMemberIds = new Set<string>();
    groups.forEach(group => {
      allMemberIds.add(group.owner_id);
    });

    // Fetch members for each group and collect user IDs
    const membersByGroup = await Promise.all(
      groups.map(async (group) => {
        const members = await query<GroupMemberRow>(
          `SELECT * FROM group_members WHERE group_id = $1`,
          [group.id]
        );
        members.forEach(m => allMemberIds.add(m.user_id));
        return { groupId: group.id, members };
      })
    );

    // Fetch all user names in batch
    const userNames = await getUserNamesBatch(Array.from(allMemberIds), userId);

    // Format groups with members
    const groupsWithMembers = groups.map((group, index) => {
      const { members } = membersByGroup[index];
      return {
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
    });
  
    return successResponse(groupsWithMembers);
  } catch (error) {
    log.error('Error fetching groups:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to fetch groups',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function handlePost(req: ExpoRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    
    if (!userId) {
      return jsonResponse(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { name, description, targetAmount, currency } = await req.json();
  
    // Validate required fields
    if (!name) {
      return errorResponse('Group name is required', HttpStatus.BAD_REQUEST);
    }

    // Validate name length
    const nameCheck = validateStringLength(name, {
      min: 1,
      max: 100,
      fieldName: 'Group name',
      allowEmpty: false
    });
    if (!nameCheck.valid) {
      return errorResponse(nameCheck.error || 'Invalid group name', HttpStatus.BAD_REQUEST);
    }

    // Validate description length if provided
    if (description) {
      const descCheck = validateStringLength(description, {
        min: 0,
        max: 500,
        fieldName: 'Description',
        allowEmpty: true
      });
      if (!descCheck.valid) {
        return errorResponse(descCheck.error || 'Invalid description', HttpStatus.BAD_REQUEST);
      }
    }

    // Validate currency if provided
    if (currency) {
      const currencyCheck = validateCurrency(currency);
      if (!currencyCheck.valid) {
        return errorResponse(currencyCheck.error || 'Invalid currency', HttpStatus.BAD_REQUEST);
      }
    }
  
    // Create group in Neon DB
    const groupResult = await query<GroupRow>(
      `INSERT INTO groups (owner_id, name, description, target_amount, currency)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        name.trim(),
        description?.trim() || null,
        targetAmount || null,
        currency || 'N$',
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
      [group.id, userId, 0, true]
    );

    const newGroup = {
      id: group.id,
      name: group.name,
      description: group.description,
      totalAmount: 0,
      targetAmount: group.target_amount ? parseFloat(group.target_amount.toString()) : undefined,
      currency: group.currency,
      ownerId: group.owner_id,
      members: [
        {
          id: userId,
          name: 'You',
          contribution: 0,
          isOwner: true,
        },
      ],
      createdAt: group.created_at,
    };
  
    return createdResponse(newGroup, `/api/groups/${newGroup.id}`);
  } catch (error) {
    log.error('Error creating group:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create group',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Wrapped exports with security middleware
export const GET = secureAuthRoute(RATE_LIMITS.api, handleGet);
export const POST = secureAuthRoute(RATE_LIMITS.api, handlePost);

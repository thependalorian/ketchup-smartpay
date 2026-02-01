/**
 * Fineract Clients API Route
 * 
 * Location: app/api/fineract/clients/route.ts
 * Purpose: Manage beneficiaries (clients) in Fineract
 * 
 * Methods:
 * - GET: Get client by external ID (Buffr user ID)
 * - POST: Create client in Fineract
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { query } from '@/utils/db';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';

async function getHandler(req: ExpoRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const externalId = searchParams.get('external_id'); // Buffr user ID

    if (!externalId) {
      return errorResponse('external_id is required', HttpStatus.BAD_REQUEST);
    }

    const client = await fineractService.getClientByExternalId(externalId);

    if (!client) {
      return errorResponse('Client not found in Fineract', HttpStatus.NOT_FOUND);
    }

    return successResponse({
      id: client.id,
      firstname: client.firstname,
      lastname: client.lastname,
      mobileNo: client.mobileNo,
      dateOfBirth: client.dateOfBirth,
      externalId: client.externalId,
    }, 'Client retrieved successfully');
  } catch (error: any) {
    logger.error('Error getting Fineract client', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to retrieve client',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

async function postHandler(req: ExpoRequest) {
  try {
    const body = await req.json();
    const {
      firstname,
      lastname,
      mobileNo,
      dateOfBirth,
      externalId, // Buffr user ID
    } = body;

    if (!firstname || !lastname || !mobileNo || !externalId) {
      return errorResponse(
        'firstname, lastname, mobileNo, and externalId are required',
        HttpStatus.BAD_REQUEST
      );
    }

    // Create client in Fineract
    const client = await fineractService.createClient({
      firstname,
      lastname,
      mobileNo,
      dateOfBirth,
      externalId,
    });

    // Log sync status
    await query(
      `INSERT INTO fineract_sync_logs (entity_type, entity_id, fineract_id, sync_status, synced_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (entity_type, entity_id) 
       DO UPDATE SET fineract_id = $3, sync_status = $4, synced_at = NOW()`,
      ['client', externalId, client.id, 'synced']
    ).catch(err => logger.error('Failed to log Fineract sync:', err));

    return createdResponse(
      {
        id: client.id,
        firstname: client.firstname,
        lastname: client.lastname,
        mobileNo: client.mobileNo,
        dateOfBirth: client.dateOfBirth,
        externalId: client.externalId,
      },
      `/api/fineract/clients?external_id=${externalId}`,
      'Client created successfully in Fineract'
    );
  } catch (error: any) {
    logger.error('Error creating Fineract client', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create client',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

export const GET = secureAdminRoute(RATE_LIMITS.api, getHandler);
export const POST = secureAdminRoute(RATE_LIMITS.admin, postHandler);

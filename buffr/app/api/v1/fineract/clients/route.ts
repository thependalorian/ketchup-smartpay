/**
 * Open Banking API: /api/v1/fineract/clients
 * 
 * Fineract client management (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { query, getUserIdFromRequest, findUserId } from '@/utils/db';
import { fineractService } from '@/services/fineractService';
import { log } from '@/utils/logger';

/**
 * GET /api/v1/fineract/clients
 * Get Fineract client by external ID (Buffr user ID)
 */
async function handleGetClient(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const externalId = searchParams.get('external_id'); // Buffr user ID

    if (!externalId) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'external_id query parameter is required',
        400
      );
    }

    const client = await fineractService.getClientByExternalId(externalId);

    if (!client) {
      return helpers.error(
        OpenBankingErrorCode.RESOURCE_NOT_FOUND,
        'Client not found in Fineract',
        404
      );
    }

    const clientResponse = {
      Data: {
        ClientId: client.id,
        FirstName: client.firstname,
        LastName: client.lastname,
        MobileNumber: client.mobileNo,
        DateOfBirth: client.dateOfBirth,
        ExternalId: client.externalId,
      },
      Links: {
        Self: `/api/v1/fineract/clients?external_id=${externalId}`,
      },
      Meta: {},
    };

    return helpers.success(
      clientResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Error getting Fineract client:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while retrieving the client',
      500
    );
  }
}

/**
 * POST /api/v1/fineract/clients
 * Create client in Fineract
 */
async function handleCreateClient(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { FirstName, LastName, MobileNumber, DateOfBirth, ExternalId } = Data;

    const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];

    if (!FirstName) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field FirstName is missing',
          'Data.FirstName'
        )
      );
    }

    if (!LastName) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field LastName is missing',
          'Data.LastName'
        )
      );
    }

    if (!MobileNumber) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field MobileNumber is missing',
          'Data.MobileNumber'
        )
      );
    }

    if (!ExternalId) {
      errors.push(
        createErrorDetail(
          OpenBankingErrorCode.FIELD_MISSING,
          'The field ExternalId is missing',
          'Data.ExternalId'
        )
      );
    }

    if (errors.length > 0) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    // Create client in Fineract
    const client = await fineractService.createClient({
      firstname: FirstName,
      lastname: LastName,
      mobileNo: MobileNumber,
      dateOfBirth: DateOfBirth,
      externalId: ExternalId,
    });

    // Log sync status
    await query(
      `INSERT INTO fineract_sync_logs (entity_type, entity_id, fineract_id, sync_status, synced_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (entity_type, entity_id) 
       DO UPDATE SET fineract_id = $3, sync_status = $4, synced_at = NOW()`,
      ['client', ExternalId, client.id, 'synced']
    ).catch(err => log.error('Failed to log Fineract sync:', err));

    const clientResponse = {
      Data: {
        ClientId: client.id,
        FirstName: client.firstname,
        LastName: client.lastname,
        MobileNumber: client.mobileNo,
        DateOfBirth: client.dateOfBirth,
        ExternalId: client.externalId,
      },
      Links: {
        Self: `/api/v1/fineract/clients?external_id=${ExternalId}`,
      },
      Meta: {},
    };

    return helpers.created(
      clientResponse,
      `/api/v1/fineract/clients?external_id=${ExternalId}`,
      context?.requestId
    );
  } catch (error) {
    log.error('Error creating Fineract client:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while creating the client',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetClient,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handleCreateClient,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

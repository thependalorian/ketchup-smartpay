/**
 * USSD Gateway API Route
 * 
 * Location: app/api/ussd/route.ts
 * Purpose: Receive USSD requests from mobile operators (MTC, Telecom Namibia)
 * 
 * This endpoint receives USSD requests from the gateway and processes them
 * via the USSD service.
 */

import { ExpoRequest } from 'expo-router/server';
import { secureRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { ussdService } from '@/services/ussdService';
import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import logger from '@/utils/logger';

interface USSDGatewayRequest {
  sessionId: string;
  phoneNumber: string;
  userInput: string;
  serviceCode: string;
}

async function postHandler(req: ExpoRequest) {
  const requestId = generateRequestId();

  try {
    const body: USSDGatewayRequest = await req.json();
    const { sessionId, phoneNumber, userInput, serviceCode } = body;

    // Validate required fields
    if (!sessionId || !phoneNumber || !serviceCode) {
      return errorResponse('sessionId, phoneNumber, and serviceCode are required', HttpStatus.BAD_REQUEST);
    }

    // Log inbound USSD request (audit trail)
    await logAPISyncOperation({
      requestId,
      direction: 'inbound',
      endpoint: '/api/ussd',
      method: 'POST',
      statusCode: 200,
      success: true,
      userId: phoneNumber, // Use phone number as identifier
    }).catch(err => logger.error('Failed to log USSD request', err));

    // Process USSD request
    const response = await ussdService.processRequest({
      sessionId,
      phoneNumber,
      userInput: userInput || '',
      serviceCode,
    });

    return successResponse(response, 'USSD request processed');

  } catch (error: any) {
    logger.error('USSD processing error', error);

    // Log failed USSD request
    await logAPISyncOperation({
      requestId,
      direction: 'inbound',
      endpoint: '/api/ussd',
      method: 'POST',
      statusCode: 500,
      success: false,
      errorMessage: error.message || 'USSD processing failed',
    }).catch(err => logger.error('Failed to log USSD error', err));

    return errorResponse(
      error instanceof Error ? error.message : 'Failed to process USSD request',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// USSD gateway calls this endpoint, so we use secureRoute (not secureAuthRoute)
// In production, add API key authentication for gateway
export const POST = secureRoute(RATE_LIMITS.api, postHandler);

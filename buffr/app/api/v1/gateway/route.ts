/**
 * Open Banking API: /api/v1/gateway
 * 
 * API Gateway - Unified entry point (Open Banking format)
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { log } from '@/utils/logger';

const BACKEND_URLS = {
  nextjs: process.env.NEXTJS_API_URL || 'http://localhost:3000',
  fastapi: process.env.FASTAPI_BACKEND_URL || 'http://localhost:8001',
  ai: process.env.AI_BACKEND_URL || 'http://localhost:8001',
} as const;

type BackendTarget = 'nextjs' | 'fastapi' | 'ai';

/**
 * GET /api/v1/gateway
 * Health check and service status
 */
async function handleGetGateway(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'status';

    if (action === 'health') {
      // Check health of all backends
      const healthChecks = await Promise.allSettled([
        fetch(`${BACKEND_URLS.nextjs}/api/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
        fetch(`${BACKEND_URLS.fastapi}/api/v1/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
        fetch(`${BACKEND_URLS.ai}/health`, { signal: AbortSignal.timeout(3000) }).then(r => r.ok),
      ]);

      const health = {
        NextJS: healthChecks[0].status === 'fulfilled' && healthChecks[0].value,
        FastAPI: healthChecks[1].status === 'fulfilled' && healthChecks[1].value,
        AI: healthChecks[2].status === 'fulfilled' && healthChecks[2].value,
        Timestamp: new Date().toISOString(),
      };

      const healthResponse = {
        Data: {
          Health: health,
        },
        Links: {
          Self: '/api/v1/gateway?action=health',
        },
        Meta: {},
      };

      return helpers.success(
        healthResponse,
        200,
        undefined,
        undefined,
        context?.requestId
      );
    }

    // Default: return gateway status
    const statusResponse = {
      Data: {
        Service: 'Buffr API Gateway',
        Version: '1.0.0',
        Status: 'operational',
        Backends: {
          NextJS: BACKEND_URLS.nextjs,
          FastAPI: BACKEND_URLS.fastapi,
          AI: BACKEND_URLS.ai,
        },
        Endpoints: {
          Health: '/api/v1/gateway?action=health',
          Proxy: 'POST /api/v1/gateway',
        },
        Timestamp: new Date().toISOString(),
      },
      Links: {
        Self: '/api/v1/gateway',
      },
      Meta: {},
    };

    return helpers.success(
      statusResponse,
      200,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error) {
    log.error('Gateway GET handler error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the gateway request',
      500
    );
  }
}

/**
 * POST /api/v1/gateway
 * Proxy requests to backends
 */
async function handlePostGateway(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  const startTime = Date.now();
  
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

    const { Target, Path, Method, Body, Headers, Query } = Data;

    if (!Target || !Path || !Method) {
      const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];
      if (!Target) {
        errors.push(createErrorDetail(OpenBankingErrorCode.FIELD_MISSING, 'The field Target is missing', 'Data.Target'));
      }
      if (!Path) {
        errors.push(createErrorDetail(OpenBankingErrorCode.FIELD_MISSING, 'The field Path is missing', 'Data.Path'));
      }
      if (!Method) {
        errors.push(createErrorDetail(OpenBankingErrorCode.FIELD_MISSING, 'The field Method is missing', 'Data.Method'));
      }
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'One or more required fields are missing',
        400,
        errors
      );
    }

    if (!['nextjs', 'fastapi', 'ai'].includes(Target)) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_INVALID,
        'Invalid target. Must be: nextjs, fastapi, or ai',
        400
      );
    }

    // Extract auth token from request headers
    const authHeader = req.headers.get('authorization');
    const authToken = authHeader?.replace('Bearer ', '');

    // Build URL
    const baseUrl = BACKEND_URLS[Target as BackendTarget];
    let url = `${baseUrl}${Path}`;
    if (Query && Object.keys(Query).length > 0) {
      const queryString = new URLSearchParams(Query).toString();
      url += `?${queryString}`;
    }

    // Prepare request
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Headers,
    };

    if (authToken) {
      requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const requestOptions: RequestInit = {
      method: Method,
      headers: requestHeaders,
      signal: AbortSignal.timeout(30000),
    };

    if (Body && ['POST', 'PUT', 'PATCH'].includes(Method)) {
      requestOptions.body = JSON.stringify(Body);
    }

    const response = await fetch(url, requestOptions);
    const latency = Date.now() - startTime;

    let data: any;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    const gatewayResponse = {
      Data: {
        Success: true,
        Data: data,
        Target,
        Path,
        Status: response.status,
        LatencyMs: latency,
      },
      Links: {
        Self: '/api/v1/gateway',
      },
      Meta: {},
    };

    return helpers.success(
      gatewayResponse,
      response.status,
      undefined,
      undefined,
      context?.requestId
    );
  } catch (error: any) {
    const totalLatency = Date.now() - startTime;
    log.error('Gateway POST handler error:', { error: error.message, latency_ms: totalLatency });

    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      error.message || 'An error occurred while processing the gateway request',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetGateway,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handlePostGateway,
  {
    rateLimitConfig: RATE_LIMITS.api,
    requireAuth: true,
    trackResponseTime: true,
  }
);

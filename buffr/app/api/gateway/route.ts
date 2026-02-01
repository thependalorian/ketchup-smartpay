/**
 * API Gateway - Unified Entry Point for All Backend Services
 *
 * Location: app/api/gateway/route.ts
 * Purpose: Single entry point for mobile app to access all backend services
 *
 * Features:
 * - Routes requests to Next.js API, FastAPI Backend, or AI Backend
 * - Centralized authentication
 * - Unified rate limiting
 * - Request/response logging
 * - Error handling and retries
 * - Health checks for all backends
 *
 * Usage:
 * POST /api/gateway
 * {
 *   "target": "nextjs" | "fastapi" | "ai",
 *   "path": "/api/users/me",
 *   "method": "GET" | "POST" | "PUT" | "DELETE",
 *   "body": {...} (optional),
 *   "headers": {...} (optional)
 * }
 */

import { ExpoRequest, ExpoResponse } from 'expo-router/server';
import { secureAuthRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

// Backend service URLs
// NOTE: AI Backend migrated from TypeScript (port 8000) to Python (port 8001)
const BACKEND_URLS = {
  nextjs: process.env.NEXTJS_API_URL || 'http://localhost:3000',
  fastapi: process.env.FASTAPI_BACKEND_URL || 'http://localhost:8001',
  ai: process.env.AI_BACKEND_URL || 'http://localhost:8001', // Python backend (migrated from TypeScript)
} as const;

type BackendTarget = 'nextjs' | 'fastapi' | 'ai';

interface GatewayRequest {
  target: BackendTarget;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

interface GatewayResponse {
  success: boolean;
  data?: any;
  error?: string;
  target: BackendTarget;
  path: string;
  status: number;
  latency_ms: number;
}

/**
 * Check health of all backend services
 */
async function checkBackendHealth(target: BackendTarget): Promise<boolean> {
  try {
    const baseUrl = BACKEND_URLS[target];
    const healthPath = target === 'ai' ? '/health' : target === 'fastapi' ? '/api/v1/health' : '/api/health';
    
    const response = await fetch(`${baseUrl}${healthPath}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    
    return response.ok;
  } catch (error) {
    log.warn(`Health check failed for ${target}`, { error, target });
    return false;
  }
}

/**
 * Proxy request to target backend
 */
async function proxyRequest(
  target: BackendTarget,
  path: string,
  method: string,
  body?: any,
  headers?: Record<string, string>,
  query?: Record<string, string>,
  authToken?: string
): Promise<{ data: any; status: number; latency: number }> {
  const startTime = Date.now();
  const baseUrl = BACKEND_URLS[target];
  
  // Build URL with query parameters
  let url = `${baseUrl}${path}`;
  if (query && Object.keys(query).length > 0) {
    const queryString = new URLSearchParams(query).toString();
    url += `?${queryString}`;
  }
  
  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };
  
  // Add authentication token if available
  if (authToken) {
    requestHeaders['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Prepare request options
  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    signal: AbortSignal.timeout(30000), // 30 second timeout
  };
  
  // Add body for POST, PUT, PATCH requests
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestOptions.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, requestOptions);
    const latency = Date.now() - startTime;
    
    // Parse response
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
    
    return { data, status: response.status, latency };
  } catch (error: any) {
    const latency = Date.now() - startTime;
    log.error(`Gateway proxy request failed`, {
      error: error.message,
      target,
      path,
      method,
      latency,
    });
    throw error;
  }
}

/**
 * GET handler - Health check and service status
 */
async function getHandler(request: ExpoRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    
    if (action === 'health') {
      // Check health of all backends
      const healthChecks = await Promise.allSettled([
        checkBackendHealth('nextjs'),
        checkBackendHealth('fastapi'),
        checkBackendHealth('ai'),
      ]);
      
      const health = {
        nextjs: healthChecks[0].status === 'fulfilled' && healthChecks[0].value,
        fastapi: healthChecks[1].status === 'fulfilled' && healthChecks[1].value,
        ai: healthChecks[2].status === 'fulfilled' && healthChecks[2].value,
        timestamp: new Date().toISOString(),
      };
      
      return successResponse(health);
    }
    
    // Default: return gateway status
    return successResponse({
      service: 'Buffr API Gateway',
      version: '1.0.0',
      status: 'operational',
      backends: {
        nextjs: BACKEND_URLS.nextjs,
        fastapi: BACKEND_URLS.fastapi,
        ai: BACKEND_URLS.ai,
      },
      endpoints: {
        health: '/api/gateway?action=health',
        proxy: 'POST /api/gateway',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    log.error('Gateway GET handler error', { error: error.message });
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST handler - Proxy requests to backends
 */
async function postHandler(request: ExpoRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const gatewayRequest: GatewayRequest = await request.json();
    
    // Validate request
    if (!gatewayRequest.target || !gatewayRequest.path || !gatewayRequest.method) {
      return errorResponse(
        'Missing required fields: target, path, method',
        HttpStatus.BAD_REQUEST
      );
    }
    
    if (!['nextjs', 'fastapi', 'ai'].includes(gatewayRequest.target)) {
      return errorResponse(
        'Invalid target. Must be: nextjs, fastapi, or ai',
        HttpStatus.BAD_REQUEST
      );
    }
    
    // Extract auth token from request headers
    const authHeader = request.headers.get('authorization');
    const authToken = authHeader?.replace('Bearer ', '');
    
    // Log request
    log.info('Gateway proxy request', {
      target: gatewayRequest.target,
      path: gatewayRequest.path,
      method: gatewayRequest.method,
      hasBody: !!gatewayRequest.body,
      hasAuth: !!authToken,
    });
    
    // Proxy request to target backend
    const result = await proxyRequest(
      gatewayRequest.target,
      gatewayRequest.path,
      gatewayRequest.method,
      gatewayRequest.body,
      gatewayRequest.headers,
      gatewayRequest.query,
      authToken || undefined
    );
    
    const totalLatency = Date.now() - startTime;
    
    // Log response
    log.info('Gateway proxy response', {
      target: gatewayRequest.target,
      path: gatewayRequest.path,
      status: result.status,
      latency_ms: result.latency,
      total_latency_ms: totalLatency,
    });
    
    // Return response
    const gatewayResponse: GatewayResponse = {
      success: true,
      data: result.data,
      target: gatewayRequest.target,
      path: gatewayRequest.path,
      status: result.status,
      latency_ms: totalLatency,
    };
    
    return successResponse(gatewayResponse, result.status);
  } catch (error: any) {
    const totalLatency = Date.now() - startTime;
    
    log.error('Gateway POST handler error', {
      error: error.message,
      latency_ms: totalLatency,
    });
    
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export handlers with security
export const GET = secureAuthRoute(RATE_LIMITS.api, getHandler);
export const POST = secureAuthRoute(RATE_LIMITS.api, postHandler);

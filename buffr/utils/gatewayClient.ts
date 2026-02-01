/**
 * API Gateway Client - Simplified Client for Mobile App
 *
 * Location: utils/gatewayClient.ts
 * Purpose: Type-safe client for making requests through the API Gateway
 *
 * Features:
 * - Single endpoint for all backend requests
 * - Automatic authentication
 * - Error handling
 * - Request/response logging
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get gateway URL from environment or use default
const getGatewayUrl = (): string => {
  const envUrl = Constants.expoConfig?.extra?.gatewayUrl || 
                 process.env.EXPO_PUBLIC_GATEWAY_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Development default
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000/api/gateway'; // Android emulator
    }
    return 'http://localhost:3000/api/gateway'; // iOS simulator / web
  }
  
  // Production URL
  return 'https://api.buffr.com/api/gateway';
};

const GATEWAY_BASE_URL = getGatewayUrl();

type BackendTarget = 'nextjs' | 'fastapi' | 'ai';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface GatewayRequest {
  target: BackendTarget;
  path: string;
  method: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

interface GatewayResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  target: BackendTarget;
  path: string;
  status: number;
  latency_ms: number;
}

export class GatewayError extends Error {
  constructor(
    message: string,
    public status: number,
    public target: BackendTarget,
    public response?: any
  ) {
    super(message);
    this.name = 'GatewayError';
  }
}

/**
 * Make a request through the API Gateway
 */
async function gatewayRequest<T = any>(
  target: BackendTarget,
  path: string,
  method: HttpMethod = 'GET',
  options?: {
    body?: any;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    authToken?: string;
  }
): Promise<T> {
  try {
    const request: GatewayRequest = {
      target,
      path,
      method,
      body: options?.body,
      headers: options?.headers,
      query: options?.query,
    };
    
    const response = await fetch(GATEWAY_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.authToken && { Authorization: `Bearer ${options.authToken}` }),
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new GatewayError(
        errorData.error || errorData.message || 'Request failed',
        response.status,
        target,
        errorData
      );
    }
    
    const result: GatewayResponse<T> = await response.json();
    
    if (!result.success) {
      throw new GatewayError(
        result.error || 'Request failed',
        result.status,
        target,
        result
      );
    }
    
    return result.data as T;
  } catch (error) {
    if (error instanceof GatewayError) {
      throw error;
    }
    throw new GatewayError(
      error instanceof Error ? error.message : 'Network error',
      500,
      target
    );
  }
}

/**
 * Check health of all backend services
 */
export async function checkGatewayHealth(): Promise<{
  nextjs: boolean;
  fastapi: boolean;
  ai: boolean;
  timestamp: string;
}> {
  try {
    const response = await fetch(`${GATEWAY_BASE_URL}?action=health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    const result = await response.json();
    return result.data;
  } catch (error) {
    throw new GatewayError(
      error instanceof Error ? error.message : 'Health check failed',
      500,
      'nextjs'
    );
  }
}

/**
 * Convenience methods for each backend
 */
export const gateway = {
  /**
   * Next.js API requests
   */
  nextjs: {
    get: <T = any>(path: string, options?: { query?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('nextjs', path, 'GET', options),
    
    post: <T = any>(path: string, body?: any, options?: { headers?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('nextjs', path, 'POST', { body, ...options }),
    
    put: <T = any>(path: string, body?: any, options?: { headers?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('nextjs', path, 'PUT', { body, ...options }),
    
    delete: <T = any>(path: string, options?: { authToken?: string }) =>
      gatewayRequest<T>('nextjs', path, 'DELETE', options),
  },
  
  /**
   * FastAPI Backend requests
   */
  fastapi: {
    get: <T = any>(path: string, options?: { query?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('fastapi', path, 'GET', options),
    
    post: <T = any>(path: string, body?: any, options?: { headers?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('fastapi', path, 'POST', { body, ...options }),
    
    put: <T = any>(path: string, body?: any, options?: { headers?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('fastapi', path, 'PUT', { body, ...options }),
    
    delete: <T = any>(path: string, options?: { authToken?: string }) =>
      gatewayRequest<T>('fastapi', path, 'DELETE', options),
  },
  
  /**
   * AI Backend requests
   */
  ai: {
    get: <T = any>(path: string, options?: { query?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('ai', path, 'GET', options),
    
    post: <T = any>(path: string, body?: any, options?: { headers?: Record<string, string>; authToken?: string }) =>
      gatewayRequest<T>('ai', path, 'POST', { body, ...options }),
  },
  
  /**
   * Health check
   */
  health: checkGatewayHealth,
};

export default gateway;

/**
 * API Client Utility
 * 
 * Location: utils/apiClient.ts
 * Purpose: Centralized API client for making requests to Expo Router API routes
 * 
 * Features:
 * - Consistent error handling
 * - Type-safe responses
 * - Automatic JSON parsing
 * - Error messages
 * - Automatic JWT token injection
 */

import { getAccessToken } from './auth';

const API_BASE = '/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Safely parse JSON response, handling HTML error pages
 */
async function safeJsonParse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  
  // Check if response is JSON
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      // If JSON parsing fails, return error object
      return { error: 'Invalid JSON response' };
    }
  }
  
  // If not JSON, try to extract error from HTML or text
  try {
    const text = await response.text();
    // Check if it's HTML (starts with <)
    if (text && typeof text === 'string' && text.trim().startsWith('<')) {
      // Extract error from HTML if possible, or return generic error
      return { 
        error: `Server error (${response.status}): Received HTML instead of JSON`,
        html: text.substring(0, 200) // First 200 chars for debugging
      };
    }
    // Try to parse as JSON anyway (might be text/json)
    try {
      return JSON.parse(text);
    } catch {
      return { error: text || `Server error (${response.status})` };
    }
  } catch (error) {
    return { error: `Failed to parse response (${response.status})` };
  }
}

/**
 * Make a GET request to an API endpoint
 * Automatically includes JWT token in Authorization header
 */
export async function apiGet<T = any>(endpoint: string, options?: { skipAuth?: boolean }): Promise<T> {
  try {
    const headers: HeadersInit = {};
    
    // Add JWT token if not skipping auth
    if (!options?.skipAuth) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
    });
    
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new ApiError(
        errorData.error || errorData.message || `Request failed (${response.status})`,
        response.status,
        errorData
      );
    }
    
    const result = await safeJsonParse(response);
    
    // Handle Open Banking format (Data wrapper)
    if (result.Data !== undefined) {
      // Open Banking format: { Data: { ... }, Links: {...}, Meta: {...} }
      // Extract the actual data from Data object
      if (Array.isArray(result.Data)) {
        return result.Data as T;
      }
      if (typeof result.Data === 'object' && result.Data !== null) {
        // Check for paginated arrays (e.g., Data.Transactions, Data.Bills)
        const arrayKeys = Object.keys(result.Data).filter(key => 
          Array.isArray(result.Data[key]) && 
          !['Links', 'Meta'].includes(key)
        );
        if (arrayKeys.length > 0) {
          return result.Data[arrayKeys[0]] as T;
        }
        // Check for single object keys (e.g., Data.Bill, Data.Merchant)
        const objectKeys = Object.keys(result.Data).filter(key => 
          typeof result.Data[key] === 'object' && 
          result.Data[key] !== null &&
          !Array.isArray(result.Data[key]) &&
          !['Links', 'Meta'].includes(key)
        );
        if (objectKeys.length > 0) {
          return result.Data[objectKeys[0]] as T;
        }
        // If Data contains direct properties, return Data itself
        return result.Data as T;
      }
      return result.Data as T;
    }
    
    // Handle legacy format
    if (result.data !== undefined) {
      return result.data as T;
    }
    if (result.success !== undefined && result.data !== undefined) {
      return result.data as T;
    }
    // If response is already the data (no wrapper)
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

/**
 * Make a POST request to an API endpoint
 * Automatically includes JWT token in Authorization header
 */
export async function apiPost<T = any>(
  endpoint: string,
  body: any,
  options?: { skipAuth?: boolean }
): Promise<T> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add JWT token if not skipping auth
    if (!options?.skipAuth) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new ApiError(
        errorData.error || errorData.message || `Request failed (${response.status})`,
        response.status,
        errorData
      );
    }
    
    const result = await safeJsonParse(response);
    
    // Handle Open Banking format (Data wrapper)
    if (result.Data !== undefined) {
      // Open Banking format: { Data: { ... }, Links: {...}, Meta: {...} }
      // Extract the actual data from Data object
      if (Array.isArray(result.Data)) {
        return result.Data as T;
      }
      if (typeof result.Data === 'object' && result.Data !== null) {
        // Check for paginated arrays (e.g., Data.Transactions, Data.Bills)
        const arrayKeys = Object.keys(result.Data).filter(key => 
          Array.isArray(result.Data[key]) && 
          !['Links', 'Meta'].includes(key)
        );
        if (arrayKeys.length > 0) {
          return result.Data[arrayKeys[0]] as T;
        }
        // Check for single object keys (e.g., Data.Bill, Data.Merchant)
        const objectKeys = Object.keys(result.Data).filter(key => 
          typeof result.Data[key] === 'object' && 
          result.Data[key] !== null &&
          !Array.isArray(result.Data[key]) &&
          !['Links', 'Meta'].includes(key)
        );
        if (objectKeys.length > 0) {
          return result.Data[objectKeys[0]] as T;
        }
        // If Data contains direct properties, return Data itself
        return result.Data as T;
      }
      return result.Data as T;
    }
    
    // Handle legacy format
    if (result.data !== undefined) {
      return result.data as T;
    }
    if (result.success !== undefined && result.data !== undefined) {
      return result.data as T;
    }
    // If response is already the data (no wrapper)
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

/**
 * Make a PUT request to an API endpoint
 * Automatically includes JWT token in Authorization header
 */
export async function apiPut<T = any>(
  endpoint: string,
  body: any,
  options?: { skipAuth?: boolean }
): Promise<T> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    // Add JWT token if not skipping auth
    if (!options?.skipAuth) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new ApiError(
        errorData.error || errorData.message || `Request failed (${response.status})`,
        response.status,
        errorData
      );
    }
    
    const result = await safeJsonParse(response);
    
    // Handle different response formats
    if (result.data !== undefined) {
      return result.data as T;
    }
    if (result.success !== undefined && result.data !== undefined) {
      return result.data as T;
    }
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

/**
 * Make a DELETE request to an API endpoint
 * Automatically includes JWT token in Authorization header
 */
export async function apiDelete<T = any>(endpoint: string, options?: { skipAuth?: boolean }): Promise<T> {
  try {
    const headers: HeadersInit = {};
    
    // Add JWT token if not skipping auth
    if (!options?.skipAuth) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers,
    });
    
    if (!response.ok) {
      const errorData = await safeJsonParse(response);
      throw new ApiError(
        errorData.error || errorData.message || `Request failed (${response.status})`,
        response.status,
        errorData
      );
    }
    
    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }
    
    const result = await safeJsonParse(response);
    
    // Handle different response formats
    if (result.data !== undefined) {
      return result.data as T;
    }
    if (result.success !== undefined && result.data !== undefined) {
      return result.data as T;
    }
    return result as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

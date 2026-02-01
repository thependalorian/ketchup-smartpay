/**
 * Base HTTP Client
 * 
 * Provides unified HTTP client for all API calls
 */

import type { ApiResponse } from '@smartpay/types';

export interface ClientConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

export class APIClient {
  private baseURL: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseURL = config.baseURL;
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { 'X-API-Key': this.apiKey }),
      ...options.headers,
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: data.message || response.statusText,
            details: data,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed',
          details: error,
        },
      };
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const queryString = params
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request<T>(`${endpoint}${queryString}`, {
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Export factory functions for different portals
export const createKetchupClient = (config: Omit<ClientConfig, 'baseURL'>) => {
  return new APIClient({
    ...config,
    baseURL: config.baseURL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/ketchup`,
  });
};

export const createGovernmentClient = (config: Omit<ClientConfig, 'baseURL'>) => {
  return new APIClient({
    ...config,
    baseURL: config.baseURL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/government`,
  });
};

export const createSharedClient = (config: Omit<ClientConfig, 'baseURL'>) => {
  return new APIClient({
    ...config,
    baseURL: config.baseURL || `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/shared`,
  });
};

/**
 * Environment Variables
 */

export const env = {
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  API_KEY: import.meta.env.VITE_API_KEY || '',
  
  // Application
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Ketchup SmartPay',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '2.0.0',
  ENVIRONMENT: import.meta.env.MODE || 'development',
  
  // Features
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_SENTRY: import.meta.env.VITE_ENABLE_SENTRY === 'true',
  
  // External Services
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
};

export const isDevelopment = env.ENVIRONMENT === 'development';
export const isProduction = env.ENVIRONMENT === 'production';
export const isStaging = env.ENVIRONMENT === 'staging';

/**
 * Logger Utility
 * 
 * Location: backend/src/utils/logger.ts
 * Purpose: Centralized logging for backend services
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: any;
}

export function log(message: string, data?: any, level: LogLevel = 'info'): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    data,
  };

  const logString = JSON.stringify(entry, null, 2);
  
  switch (level) {
    case 'error':
      console.error(logString);
      break;
    case 'warn':
      console.warn(logString);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(logString);
      }
      break;
    default:
      console.log(logString);
  }
}

export function logError(message: string, error: Error | unknown, data?: any): void {
  const errorData = error instanceof Error 
    ? { message: error.message, stack: error.stack }
    : { error };
  
  log(message, { ...errorData, ...data }, 'error');
}

export function logWarn(message: string, data?: any): void {
  log(message, data, 'warn');
}

export function logDebug(message: string, data?: any): void {
  log(message, data, 'debug');
}

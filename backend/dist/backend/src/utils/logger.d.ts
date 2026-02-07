/**
 * Logger Utility
 *
 * Location: backend/src/utils/logger.ts
 * Purpose: Centralized logging for backend services
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export declare function log(message: string, data?: any, level?: LogLevel): void;
export declare function logError(message: string, error: Error | unknown, data?: any): void;
export declare function logWarn(message: string, data?: any): void;
export declare function logDebug(message: string, data?: any): void;
export {};
//# sourceMappingURL=logger.d.ts.map
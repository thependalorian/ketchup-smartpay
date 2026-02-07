/**
 * Logger Utility
 *
 * Location: backend/src/utils/logger.ts
 * Purpose: Centralized logging for backend services
 */
export function log(message, data, level = 'info') {
    const entry = {
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
export function logError(message, error, data) {
    const errorData = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : { error };
    log(message, { ...errorData, ...data }, 'error');
}
export function logWarn(message, data) {
    log(message, data, 'warn');
}
export function logDebug(message, data) {
    log(message, data, 'debug');
}
//# sourceMappingURL=logger.js.map
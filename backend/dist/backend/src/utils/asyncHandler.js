/**
 * Async route handler wrapper
 *
 * Location: backend/src/utils/asyncHandler.ts
 * Purpose: Pass async route rejections to Express error handler so we get JSON 500
 *          instead of FUNCTION_INVOCATION_FAILED on Vercel.
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=asyncHandler.js.map
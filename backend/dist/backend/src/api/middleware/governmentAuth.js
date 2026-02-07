/**
 * Government Authentication Middleware
 *
 * Purpose: Authenticate Government portal requests (read-only access by default)
 * Location: backend/src/api/middleware/governmentAuth.ts
 */
const GOVERNMENT_API_KEY = process.env.GOVERNMENT_API_KEY || 'government_dev_key';
export const governmentAuth = (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                success: false,
                error: {
                    code: 'MISSING_API_KEY',
                    message: 'API key is required',
                },
            });
        }
        if (apiKey !== GOVERNMENT_API_KEY) {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'INVALID_API_KEY',
                    message: 'Invalid API key for Government portal',
                },
            });
        }
        // Verify method is read-only (GET only, unless specifically allowed)
        if (req.method !== 'GET' && req.method !== 'OPTIONS') {
            // Check if route is explicitly allowed for writes
            const allowedWriteRoutes = ['/reports/generate'];
            const isAllowedWrite = allowedWriteRoutes.some(route => req.path.includes(route));
            if (!isAllowedWrite) {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'READ_ONLY_ACCESS',
                        message: 'Government portal has read-only access. Write operations not permitted.',
                    },
                });
            }
        }
        // Add portal info to request
        req.portal = 'government';
        req.permissions = ['read']; // Read-only
        // Log access for audit trail
        console.log(`[GOVERNMENT ACCESS] ${req.method} ${req.path} - User: ${apiKey.slice(0, 10)}...`);
        next();
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: error.message,
            },
        });
    }
};
//# sourceMappingURL=governmentAuth.js.map
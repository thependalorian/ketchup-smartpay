/**
 * API Gateway – Rate limiting, abuse prevention, developer onboarding
 *
 * Location: backend/src/services/security/APIGateway.ts
 * Purpose: Centralized rate limits, API key lifecycle, developer onboarding (PRD Section 6).
 */
import { log } from '../../utils/logger';
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || '100', 10);
const store = new Map();
export function checkRateLimit(clientId) {
    const now = Date.now();
    const windowMs = 60_000;
    let entry = store.get(clientId);
    if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        store.set(clientId, entry);
    }
    entry.count++;
    if (entry.count > RATE_LIMIT_PER_MINUTE) {
        log('Rate limit exceeded', { clientId, count: entry.count });
        return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { allowed: true };
}
export async function onboardDeveloper(req) {
    log('Developer onboarding requested', { email: req.email, useCase: req.useCase });
    // In production: create API key, send email, store in DB
    return { status: 'pending', apiKey: undefined };
}
//# sourceMappingURL=APIGateway.js.map
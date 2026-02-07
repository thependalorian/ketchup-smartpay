/**
 * API Gateway – Rate limiting, abuse prevention, developer onboarding
 *
 * Location: backend/src/services/security/APIGateway.ts
 * Purpose: Centralized rate limits, API key lifecycle, developer onboarding (PRD Section 6).
 */
export declare function checkRateLimit(clientId: string): {
    allowed: boolean;
    retryAfter?: number;
};
export interface DeveloperOnboardingRequest {
    name: string;
    email: string;
    organisation?: string;
    useCase: string;
}
export declare function onboardDeveloper(req: DeveloperOnboardingRequest): Promise<{
    apiKey?: string;
    status: string;
}>;
//# sourceMappingURL=APIGateway.d.ts.map
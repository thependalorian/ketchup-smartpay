/**
 * Participant Management Service
 *
 * Location: backend/src/services/openbanking/ParticipantService.ts
 * Purpose: Manage Open Banking participants (Data Providers and TPPs)
 *
 * Standards Compliance:
 * - Section 8.1: Registration Standards
 * - Section 8.1.4: Participant ID format (APInnnnnn)
 */
export interface Participant {
    participantId: string;
    participantName: string;
    participantRole: 'DP' | 'TPP';
    status: 'active' | 'suspended' | 'revoked';
    sectors: string[];
    services: string[];
    contactEmail?: string;
    contactUrl?: string;
}
export declare class ParticipantService {
    /**
     * Register a new participant
     * Section 8.1: Registration Standards
     */
    registerParticipant(participantName: string, participantRole: 'DP' | 'TPP', sectors?: string[], services?: string[], contactEmail?: string, contactUrl?: string): Promise<Participant>;
    /**
     * Get participant by ID
     */
    getParticipant(participantId: string): Promise<Participant | null>;
    /**
     * List all participants
     */
    listParticipants(role?: 'DP' | 'TPP', status?: string): Promise<Participant[]>;
    /**
     * Update participant status
     */
    updateParticipantStatus(participantId: string, status: 'active' | 'suspended' | 'revoked'): Promise<void>;
    /**
     * Generate unique Participant ID
     * Format: APInnnnnn (Section 8.1.4)
     */
    private generateParticipantId;
    /**
     * Validate participant has access to service
     */
    validateParticipantAccess(participantId: string, service: 'AIS' | 'PIS'): Promise<boolean>;
}
//# sourceMappingURL=ParticipantService.d.ts.map
/**
 * IPS Participant Directory – Banks and fintechs in the Namibia Instant Payment System
 *
 * Location: backend/src/services/ips/IPSParticipantDirectory.ts
 * Purpose: Maintain list of IPS participants (banks, fintechs) and their endpoints for routing.
 * Loads from ips_participants table when available; falls back to env/static list.
 * References: Namibian Open Banking, CONSOLIDATED_PRD Section 6.
 */
export interface IPSParticipant {
    participantId: string;
    name: string;
    bic?: string;
    endpointUrl?: string;
    /** Endpoint for IPS payment delivery (e.g. POST pain.001); same as endpointUrl, alias for template compatibility */
    endpoint?: string;
    status: 'active' | 'suspended' | 'inactive';
}
/**
 * Refresh participant directory from ips_participants table.
 * Call from IPSIntegrationService before routing; merges DB rows (active only) into cache.
 * On DB error or empty result, leaves cache unchanged (env/static).
 */
export declare function refreshParticipantDirectoryFromDb(): Promise<void>;
export declare function getIPSParticipantDirectory(): IPSParticipant[];
export declare function getIPSParticipant(participantId: string): IPSParticipant | null;
export declare function getParticipantByBic(bic: string): IPSParticipant | null;
//# sourceMappingURL=IPSParticipantDirectory.d.ts.map
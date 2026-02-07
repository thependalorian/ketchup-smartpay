/**
 * IPS Participant Directory – Banks and fintechs in the Namibia Instant Payment System
 *
 * Location: backend/src/services/ips/IPSParticipantDirectory.ts
 * Purpose: Maintain list of IPS participants (banks, fintechs) and their endpoints for routing.
 * Loads from ips_participants table when available; falls back to env/static list.
 * References: Namibian Open Banking, CONSOLIDATED_PRD Section 6.
 */
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
const DEFAULT_PARTICIPANTS = [
    { participantId: 'BON', name: 'Bank of Namibia', bic: 'SWNANANX', status: 'active' },
    { participantId: 'FNB', name: 'First National Bank', bic: 'FIRNNANX', status: 'active' },
    { participantId: 'NED', name: 'Nedbank Namibia', bic: 'NEDSNANX', status: 'active' },
    { participantId: 'SBN', name: 'Standard Bank Namibia', bic: 'SBICNANX', status: 'active' },
];
function loadFromEnv() {
    try {
        const raw = process.env.IPS_PARTICIPANTS_JSON;
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0)
                return parsed;
        }
    }
    catch (e) {
        logError('IPS_PARTICIPANTS_JSON parse failed', e);
    }
    return DEFAULT_PARTICIPANTS;
}
let cached = null;
/**
 * Refresh participant directory from ips_participants table.
 * Call from IPSIntegrationService before routing; merges DB rows (active only) into cache.
 * On DB error or empty result, leaves cache unchanged (env/static).
 */
export async function refreshParticipantDirectoryFromDb() {
    try {
        const rows = await sql `
      SELECT participant_id, name, bic, endpoint, status
      FROM ips_participants
      WHERE status = 'active'
      ORDER BY participant_id
    `;
        if (rows != null && rows.length > 0) {
            const list = rows.map((row) => ({
                participantId: row.participant_id,
                name: row.name,
                bic: row.bic ?? undefined,
                endpointUrl: row.endpoint ?? undefined,
                endpoint: row.endpoint ?? undefined,
                status: row.status,
            }));
            cached = list;
            log('IPS participant directory refreshed from DB', { count: list.length });
        }
    }
    catch (e) {
        logError('IPS refresh participants from DB failed', e);
        if (!cached)
            cached = loadFromEnv();
    }
}
export function getIPSParticipantDirectory() {
    if (!cached)
        cached = loadFromEnv();
    return cached;
}
export function getIPSParticipant(participantId) {
    return getIPSParticipantDirectory().find((p) => p.participantId === participantId && p.status === 'active') ?? null;
}
export function getParticipantByBic(bic) {
    return getIPSParticipantDirectory().find((p) => p.bic === bic && p.status === 'active') ?? null;
}
//# sourceMappingURL=IPSParticipantDirectory.js.map
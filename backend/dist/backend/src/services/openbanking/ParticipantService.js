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
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
export class ParticipantService {
    /**
     * Register a new participant
     * Section 8.1: Registration Standards
     */
    async registerParticipant(participantName, participantRole, sectors = ['banking'], services = ['AIS', 'PIS'], contactEmail, contactUrl) {
        try {
            // Generate Participant ID (Section 8.1.4: APInnnnnn format)
            const participantId = await this.generateParticipantId();
            const [participant] = await sql `
        INSERT INTO open_banking_participants (
          participant_id, participant_name, participant_role, status,
          sectors, services, contact_email, contact_url
        )
        VALUES (
          ${participantId}, ${participantName}, ${participantRole}, 'active',
          ${sectors}, ${services}, ${contactEmail || null}, ${contactUrl || null}
        )
        RETURNING 
          participant_id as "participantId",
          participant_name as "participantName",
          participant_role as "participantRole",
          status,
          sectors,
          services,
          contact_email as "contactEmail",
          contact_url as "contactUrl"
      `;
            log('Participant registered', { participantId, participantName, participantRole });
            return participant;
        }
        catch (error) {
            logError('Failed to register participant', error);
            throw error;
        }
    }
    /**
     * Get participant by ID
     */
    async getParticipant(participantId) {
        try {
            const [participant] = await sql `
        SELECT 
          participant_id as "participantId",
          participant_name as "participantName",
          participant_role as "participantRole",
          status,
          sectors,
          services,
          contact_email as "contactEmail",
          contact_url as "contactUrl",
          registered_at as "registeredAt"
        FROM open_banking_participants
        WHERE participant_id = ${participantId}
      `;
            return participant || null;
        }
        catch (error) {
            logError('Failed to get participant', error);
            throw error;
        }
    }
    /**
     * List all participants
     */
    async listParticipants(role, status) {
        try {
            const participants = await sql `
        SELECT 
          participant_id as "participantId",
          participant_name as "participantName",
          participant_role as "participantRole",
          status,
          sectors,
          services,
          contact_email as "contactEmail",
          contact_url as "contactUrl"
        FROM open_banking_participants
        WHERE 
          (${role}::text IS NULL OR participant_role = ${role})
          AND (${status}::text IS NULL OR status = ${status})
        ORDER BY participant_name ASC
      `;
            return participants;
        }
        catch (error) {
            logError('Failed to list participants', error);
            throw error;
        }
    }
    /**
     * Update participant status
     */
    async updateParticipantStatus(participantId, status) {
        try {
            await sql `
        UPDATE open_banking_participants
        SET status = ${status}, updated_at = NOW()
        WHERE participant_id = ${participantId}
      `;
            log('Participant status updated', { participantId, status });
        }
        catch (error) {
            logError('Failed to update participant status', error);
            throw error;
        }
    }
    /**
     * Generate unique Participant ID
     * Format: APInnnnnn (Section 8.1.4)
     */
    async generateParticipantId() {
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
            // Generate 6-digit random number
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            const participantId = `API${randomNum}`;
            // Check if ID already exists
            const [existing] = await sql `
        SELECT participant_id FROM open_banking_participants
        WHERE participant_id = ${participantId}
      `;
            if (!existing) {
                return participantId;
            }
            attempts++;
        }
        throw new Error('Failed to generate unique Participant ID');
    }
    /**
     * Validate participant has access to service
     */
    async validateParticipantAccess(participantId, service) {
        try {
            const [participant] = await sql `
        SELECT services FROM open_banking_participants
        WHERE participant_id = ${participantId}
        AND status = 'active'
      `;
            if (!participant) {
                return false;
            }
            return participant.services.includes(service);
        }
        catch (error) {
            logError('Failed to validate participant access', error);
            return false;
        }
    }
}
//# sourceMappingURL=ParticipantService.js.map
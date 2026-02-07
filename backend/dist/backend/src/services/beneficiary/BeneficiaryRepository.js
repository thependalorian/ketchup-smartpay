/**
 * Beneficiary Repository
 *
 * Location: backend/src/services/beneficiary/BeneficiaryRepository.ts
 * Purpose: Data access layer for beneficiary operations (real DB, no mocks).
 * PRD Requirement: National ID Numbers with hash for duplicate detection
 */
import crypto from 'crypto';
import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';
/**
 * Generate a one-way hash of the ID number for duplicate detection.
 * Uses SHA-256 and returns the first 64 characters (128 hex chars total).
 */
export function hashIdNumber(idNumber) {
    const trimmed = idNumber.trim();
    return crypto.createHash('sha256').update(trimmed).digest('hex');
}
function rowToBeneficiary(row) {
    const proxyRelationship = row.proxy_relationship != null && String(row.proxy_relationship).trim() !== ''
        ? String(row.proxy_relationship)
        : undefined;
    return {
        id: String(row.id ?? ''),
        name: String(row.name ?? ''),
        phone: String(row.phone ?? ''),
        idNumber: row.id_number != null && String(row.id_number).trim() !== '' ? String(row.id_number) : undefined,
        region: String(row.region ?? ''),
        grantType: String(row.grant_type ?? 'social_grant'),
        status: String(row.status ?? 'pending'),
        enrolledAt: row.enrolled_at instanceof Date ? row.enrolled_at.toISOString() : String(row.enrolled_at ?? ''),
        lastPayment: row.last_payment instanceof Date ? row.last_payment.toISOString() : String(row.last_payment ?? ''),
        proxyName: row.proxy_name != null && String(row.proxy_name).trim() !== '' ? String(row.proxy_name) : undefined,
        proxyIdNumber: row.proxy_id_number != null && String(row.proxy_id_number).trim() !== '' ? String(row.proxy_id_number) : undefined,
        proxyPhone: row.proxy_phone != null && String(row.proxy_phone).trim() !== '' ? String(row.proxy_phone) : undefined,
        proxyRelationship: proxyRelationship,
        proxyAuthorisedAt: row.proxy_authorised_at instanceof Date ? row.proxy_authorised_at.toISOString() : (row.proxy_authorised_at != null ? String(row.proxy_authorised_at) : undefined),
        deceasedAt: row.deceased_at instanceof Date ? row.deceased_at.toISOString() : (row.deceased_at != null ? String(row.deceased_at) : undefined),
    };
}
export class BeneficiaryRepository {
    /**
     * Find all beneficiaries with optional filters (from real DB).
     */
    async findAll(filters) {
        try {
            const region = filters?.region ?? null;
            const grantType = filters?.grantType ?? null;
            const status = filters?.status ?? null;
            const search = filters?.search?.trim() ? `%${filters.search.trim()}%` : null;
            const idNumberFilter = filters?.idNumber?.trim() ? `%${filters.idNumber.trim()}%` : null;
            const rows = await sql `
        SELECT id, name, phone, id_number, region, grant_type, status, enrolled_at, last_payment, created_at, updated_at,
          proxy_name, proxy_id_number, proxy_phone, proxy_relationship, proxy_authorised_at, deceased_at
        FROM beneficiaries
        WHERE
          (${region}::text IS NULL OR region = ${region})
          AND (${grantType}::text IS NULL OR grant_type = ${grantType})
          AND (${status}::text IS NULL OR status = ${status})
          AND (${search}::text IS NULL OR name ILIKE ${search} OR phone ILIKE ${search})
          AND (${idNumberFilter}::text IS NULL OR id_number ILIKE ${idNumberFilter})
        ORDER BY created_at DESC
        LIMIT 500
      `;
            const list = rows.map(rowToBeneficiary);
            log('BeneficiaryRepository.findAll', { filters, count: list.length });
            return list;
        }
        catch (error) {
            logError('BeneficiaryRepository.findAll failed', error, { filters });
            throw error;
        }
    }
    /**
     * Find beneficiary by ID (from real DB).
     */
    async findById(id) {
        try {
            const rows = await sql `
        SELECT id, name, phone, id_number, region, grant_type, status, enrolled_at, last_payment, created_at, updated_at,
          proxy_name, proxy_id_number, proxy_phone, proxy_relationship, proxy_authorised_at, deceased_at
        FROM beneficiaries
        WHERE id = ${id}
        LIMIT 1
      `;
            const row = rows[0];
            if (!row)
                return null;
            return rowToBeneficiary(row);
        }
        catch (error) {
            logError('BeneficiaryRepository.findById failed', error, { id });
            throw error;
        }
    }
    /**
     * Find beneficiary by national ID number (exact match).
     * PRD Requirement: Detect duplicate beneficiaries by ID number
     */
    async findByIdNumber(idNumber) {
        try {
            const trimmedId = idNumber.trim();
            const rows = await sql `
        SELECT id, name, phone, id_number, region, grant_type, status, enrolled_at, last_payment, created_at, updated_at,
          proxy_name, proxy_id_number, proxy_phone, proxy_relationship, proxy_authorised_at, deceased_at
        FROM beneficiaries
        WHERE id_number = ${trimmedId}
        LIMIT 1
      `;
            const row = rows[0];
            if (!row)
                return null;
            return rowToBeneficiary(row);
        }
        catch (error) {
            logError('BeneficiaryRepository.findByIdNumber failed', error, { idNumber });
            throw error;
        }
    }
    /**
     * Find beneficiary by national ID hash (for duplicate detection).
     * Uses the hashed version of ID number to prevent duplicate registration.
     * PRD Requirement: Hash for duplicate detection
     */
    async findByIdNumberHash(hash) {
        try {
            const rows = await sql `
        SELECT id, name, phone, id_number, region, grant_type, status, enrolled_at, last_payment, created_at, updated_at,
          proxy_name, proxy_id_number, proxy_phone, proxy_relationship, proxy_authorised_at, deceased_at
        FROM beneficiaries
        WHERE national_id_hash = ${hash}
        LIMIT 1
      `;
            const row = rows[0];
            if (!row)
                return null;
            return rowToBeneficiary(row);
        }
        catch (error) {
            logError('BeneficiaryRepository.findByIdNumberHash failed', error, { hash });
            throw error;
        }
    }
    /**
     * Check if a beneficiary with the given ID number already exists.
     * Returns the existing beneficiary if found, null otherwise.
     * PRD Requirement: Prevent duplicate beneficiaries by ID number
     */
    async checkDuplicate(idNumber) {
        try {
            const hash = hashIdNumber(idNumber);
            const existing = await this.findByIdNumberHash(hash);
            if (existing) {
                log('BeneficiaryRepository.checkDuplicate: duplicate detected', { idNumber: idNumber.slice(0, 4) + '****', existingId: existing.id });
                return { isDuplicate: true, existing };
            }
            return { isDuplicate: false };
        }
        catch (error) {
            logError('BeneficiaryRepository.checkDuplicate failed', error, { idNumber });
            throw error;
        }
    }
    /**
     * Create a new beneficiary (real DB insert).
     * Checks for duplicates by ID number hash before creating.
     * PRD Requirement: Prevent duplicate beneficiaries
     */
    async create(data) {
        try {
            // Check for duplicate before creating
            if (data.idNumber) {
                const duplicateCheck = await this.checkDuplicate(data.idNumber);
                if (duplicateCheck.isDuplicate && duplicateCheck.existing) {
                    log('BeneficiaryRepository.create: prevented duplicate', { idNumber: data.idNumber.slice(0, 4) + '****', existingId: duplicateCheck.existing.id });
                    throw new Error('Beneficiary with this ID number already exists');
                }
            }
            const now = new Date().toISOString();
            const idNumber = data.idNumber != null && String(data.idNumber).trim() !== '' ? String(data.idNumber).trim() : null;
            const idNumberHash = idNumber ? hashIdNumber(idNumber) : null;
            const proxyName = data.proxyName != null && String(data.proxyName).trim() !== '' ? String(data.proxyName).trim() : null;
            const proxyIdNumber = data.proxyIdNumber != null && String(data.proxyIdNumber).trim() !== '' ? String(data.proxyIdNumber).trim() : null;
            const proxyPhone = data.proxyPhone != null && String(data.proxyPhone).trim() !== '' ? String(data.proxyPhone).trim() : null;
            const proxyRelationship = data.proxyRelationship != null && String(data.proxyRelationship).trim() !== '' ? String(data.proxyRelationship).trim() : null;
            await sql `
        INSERT INTO beneficiaries (id, name, phone, id_number, national_id_hash, region, grant_type, status, enrolled_at, last_payment, created_at, updated_at, proxy_name, proxy_id_number, proxy_phone, proxy_relationship, proxy_authorised_at)
        VALUES (
          ${data.id},
          ${data.name},
          ${data.phone},
          ${idNumber},
          ${idNumberHash},
          ${data.region},
          ${data.grantType},
          ${data.status},
          ${now}::timestamptz,
          ${now}::timestamptz,
          ${now}::timestamptz,
          ${now}::timestamptz,
          ${proxyName},
          ${proxyIdNumber},
          ${proxyPhone},
          ${proxyRelationship},
          ${proxyName != null ? now : null}::timestamptz
        )
      `;
            const created = await this.findById(data.id);
            if (!created)
                throw new Error('Beneficiary create succeeded but findById returned null');
            log('BeneficiaryRepository.create', { id: data.id });
            return created;
        }
        catch (error) {
            // Re-throw duplicate error as-is, log other errors
            if (error instanceof Error && error.message.includes('already exists')) {
                throw error;
            }
            logError('BeneficiaryRepository.create failed', error, { data: { id: data.id, name: data.name } });
            throw error;
        }
    }
    /**
     * Update beneficiary (real DB update).
     */
    async update(id, data) {
        try {
            const existing = await this.findById(id);
            if (!existing)
                throw new Error(`Beneficiary with ID ${id} not found`);
            // Check for duplicate if idNumber is being updated
            if (data.idNumber && data.idNumber !== existing.idNumber) {
                const duplicateCheck = await this.checkDuplicate(data.idNumber);
                if (duplicateCheck.isDuplicate && duplicateCheck.existing && duplicateCheck.existing.id !== id) {
                    throw new Error('Another beneficiary with this ID number already exists');
                }
            }
            const name = data.name ?? existing.name;
            const phone = data.phone ?? existing.phone;
            const idNumber = data.idNumber !== undefined ? (data.idNumber != null && String(data.idNumber).trim() !== '' ? String(data.idNumber).trim() : null) : (existing.idNumber ?? null);
            const idNumberHash = idNumber ? hashIdNumber(idNumber) : null;
            const region = data.region ?? existing.region;
            const grantType = data.grantType ?? existing.grantType;
            const status = data.status ?? existing.status;
            const proxyName = data.proxyName !== undefined ? (data.proxyName != null && String(data.proxyName).trim() !== '' ? String(data.proxyName).trim() : null) : (existing.proxyName ?? null);
            const proxyIdNumber = data.proxyIdNumber !== undefined ? (data.proxyIdNumber != null && String(data.proxyIdNumber).trim() !== '' ? String(data.proxyIdNumber).trim() : null) : (existing.proxyIdNumber ?? null);
            const proxyPhone = data.proxyPhone !== undefined ? (data.proxyPhone != null && String(data.proxyPhone).trim() !== '' ? String(data.proxyPhone).trim() : null) : (existing.proxyPhone ?? null);
            const proxyRelationship = data.proxyRelationship !== undefined ? (data.proxyRelationship != null && String(data.proxyRelationship).trim() !== '' ? String(data.proxyRelationship).trim() : null) : (existing.proxyRelationship ?? null);
            const proxyAuthorisedAt = (proxyName != null && existing.proxyAuthorisedAt == null) ? new Date().toISOString() : (existing.proxyAuthorisedAt ?? null);
            const deceasedAt = data.status === 'deceased' && data.deceasedAt ? data.deceasedAt : (data.status !== 'deceased' ? null : (existing.deceasedAt ?? null));
            const updatedAt = new Date().toISOString();
            await sql `
        UPDATE beneficiaries
        SET name = ${name}, phone = ${phone}, id_number = ${idNumber}, national_id_hash = ${idNumberHash}, region = ${region}, grant_type = ${grantType}, status = ${status},
            proxy_name = ${proxyName}, proxy_id_number = ${proxyIdNumber}, proxy_phone = ${proxyPhone}, proxy_relationship = ${proxyRelationship},
            proxy_authorised_at = ${proxyAuthorisedAt}::timestamptz,
            deceased_at = ${deceasedAt}::timestamptz,
            updated_at = ${updatedAt}::timestamptz
        WHERE id = ${id}
      `;
            const updated = await this.findById(id);
            if (!updated)
                throw new Error('Beneficiary update succeeded but findById returned null');
            log('BeneficiaryRepository.update', { id });
            return updated;
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('already exists')) {
                throw error;
            }
            logError('BeneficiaryRepository.update failed', error, { id });
            throw error;
        }
    }
    async findByRegion(region) {
        return this.findAll({ region: region });
    }
    async findEligible() {
        return this.findAll({ status: 'active' });
    }
}
//# sourceMappingURL=BeneficiaryRepository.js.map
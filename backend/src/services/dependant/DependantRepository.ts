/**
 * Dependant Repository
 *
 * Location: backend/src/services/dependant/DependantRepository.ts
 * Purpose: Data access for beneficiary dependants (beneficiary_dependants table).
 */

import { sql } from '../../database/connection';
import type { Dependant, CreateDependantDTO, UpdateDependantDTO } from '../../../../shared/types';
import { log, logError } from '../../utils/logger';

const DEPENDANT_RELATIONSHIPS = ['child', 'spouse', 'guardian', 'other'] as const;

function rowToDependant(row: Record<string, unknown>): Dependant {
  const relationship = row.relationship != null && DEPENDANT_RELATIONSHIPS.includes(String(row.relationship) as any)
    ? String(row.relationship) as Dependant['relationship']
    : 'other';
  return {
    id: String(row.id ?? ''),
    beneficiaryId: String(row.beneficiary_id ?? ''),
    name: String(row.name ?? ''),
    idNumber: row.id_number != null && String(row.id_number).trim() !== '' ? String(row.id_number) : undefined,
    phone: row.phone != null && String(row.phone).trim() !== '' ? String(row.phone) : undefined,
    relationship,
    dateOfBirth: row.date_of_birth != null ? (row.date_of_birth instanceof Date ? row.date_of_birth.toISOString().slice(0, 10) : String(row.date_of_birth).slice(0, 10)) : undefined,
    isProxy: Boolean(row.is_proxy),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ''),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? ''),
  };
}

export class DependantRepository {
  async findByBeneficiaryId(beneficiaryId: string): Promise<Dependant[]> {
    try {
      const rows = await sql`
        SELECT id, beneficiary_id, name, id_number, phone, relationship, date_of_birth, is_proxy, created_at, updated_at
        FROM beneficiary_dependants
        WHERE beneficiary_id = ${beneficiaryId}
        ORDER BY created_at ASC
      `;
      const list = (rows as Record<string, unknown>[]).map(rowToDependant);
      log('DependantRepository.findByBeneficiaryId', { beneficiaryId, count: list.length });
      return list;
    } catch (error) {
      logError('DependantRepository.findByBeneficiaryId failed', error, { beneficiaryId });
      throw error;
    }
  }

  async findById(beneficiaryId: string, dependantId: string): Promise<Dependant | null> {
    try {
      const rows = await sql`
        SELECT id, beneficiary_id, name, id_number, phone, relationship, date_of_birth, is_proxy, created_at, updated_at
        FROM beneficiary_dependants
        WHERE beneficiary_id = ${beneficiaryId} AND id = ${dependantId}
        LIMIT 1
      `;
      const row = (rows as Record<string, unknown>[])[0];
      if (!row) return null;
      return rowToDependant(row);
    } catch (error) {
      logError('DependantRepository.findById failed', error, { beneficiaryId, dependantId });
      throw error;
    }
  }

  async create(beneficiaryId: string, id: string, data: CreateDependantDTO): Promise<Dependant> {
    try {
      const now = new Date().toISOString();
      const idNumber = data.idNumber != null && String(data.idNumber).trim() !== '' ? String(data.idNumber).trim() : null;
      const phone = data.phone != null && String(data.phone).trim() !== '' ? String(data.phone).trim() : null;
      const dateOfBirth = data.dateOfBirth != null && String(data.dateOfBirth).trim() !== '' ? String(data.dateOfBirth).trim() : null;
      const isProxy = data.isProxy === true;
      const relationship = String(data.relationship).trim() || 'other';
      if (!DEPENDANT_RELATIONSHIPS.includes(relationship as any)) {
        throw new Error(`Invalid relationship: ${relationship}. Must be one of: ${DEPENDANT_RELATIONSHIPS.join(', ')}`);
      }

      await sql`
        INSERT INTO beneficiary_dependants (id, beneficiary_id, name, id_number, phone, relationship, date_of_birth, is_proxy, created_at, updated_at)
        VALUES (${id}, ${beneficiaryId}, ${data.name.trim()}, ${idNumber}, ${phone}, ${relationship}, ${dateOfBirth}::date, ${isProxy}, ${now}::timestamptz, ${now}::timestamptz)
      `;
      const created = await this.findById(beneficiaryId, id);
      if (!created) throw new Error('Dependant create succeeded but findById returned null');
      log('DependantRepository.create', { beneficiaryId, dependantId: id });
      return created;
    } catch (error) {
      logError('DependantRepository.create failed', error, { beneficiaryId, data: { name: data.name } });
      throw error;
    }
  }

  async update(beneficiaryId: string, dependantId: string, data: UpdateDependantDTO): Promise<Dependant> {
    try {
      const existing = await this.findById(beneficiaryId, dependantId);
      if (!existing) throw new Error(`Dependant with ID ${dependantId} not found for beneficiary ${beneficiaryId}`);

      const name = data.name !== undefined ? data.name.trim() : existing.name;
      const idNumber = data.idNumber !== undefined ? (data.idNumber != null && String(data.idNumber).trim() !== '' ? String(data.idNumber).trim() : null) : (existing.idNumber ?? null);
      const phone = data.phone !== undefined ? (data.phone != null && String(data.phone).trim() !== '' ? String(data.phone).trim() : null) : (existing.phone ?? null);
      const relationship = data.relationship !== undefined ? String(data.relationship).trim() || 'other' : existing.relationship;
      const dateOfBirth = data.dateOfBirth !== undefined ? (data.dateOfBirth != null && String(data.dateOfBirth).trim() !== '' ? String(data.dateOfBirth).trim() : null) : (existing.dateOfBirth ?? null);
      const isProxy = data.isProxy !== undefined ? data.isProxy : existing.isProxy;
      const updatedAt = new Date().toISOString();

      if (!DEPENDANT_RELATIONSHIPS.includes(relationship as any)) {
        throw new Error(`Invalid relationship: ${relationship}. Must be one of: ${DEPENDANT_RELATIONSHIPS.join(', ')}`);
      }

      await sql`
        UPDATE beneficiary_dependants
        SET name = ${name}, id_number = ${idNumber}, phone = ${phone}, relationship = ${relationship}, date_of_birth = ${dateOfBirth}::date, is_proxy = ${isProxy}, updated_at = ${updatedAt}::timestamptz
        WHERE beneficiary_id = ${beneficiaryId} AND id = ${dependantId}
      `;
      const updated = await this.findById(beneficiaryId, dependantId);
      if (!updated) throw new Error('Dependant update succeeded but findById returned null');
      log('DependantRepository.update', { beneficiaryId, dependantId });
      return updated;
    } catch (error) {
      logError('DependantRepository.update failed', error, { beneficiaryId, dependantId });
      throw error;
    }
  }

  async delete(beneficiaryId: string, dependantId: string): Promise<void> {
    try {
      const result = await sql`
        DELETE FROM beneficiary_dependants
        WHERE beneficiary_id = ${beneficiaryId} AND id = ${dependantId}
        RETURNING id
      `;
      const deleted = Array.isArray(result) ? result.length : 0;
      if (deleted === 0) {
        throw new Error(`Dependant with ID ${dependantId} not found for beneficiary ${beneficiaryId}`);
      }
      log('DependantRepository.delete', { beneficiaryId, dependantId });
    } catch (error) {
      logError('DependantRepository.delete failed', error, { beneficiaryId, dependantId });
      throw error;
    }
  }
}

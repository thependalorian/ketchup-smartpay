/**
 * Mobile Unit Service
 * Purpose: SmartPay Mobile – unit detail, equipment, drivers, issue/return, activity, maintenance.
 * Location: backend/src/services/mobileUnits/MobileUnitService.ts
 */

import { sql } from '../../database/connection';
import { logError } from '../../utils/logger';
import { AgentService } from '../agents/AgentService';

const MOBILE_UNIT_TYPE = 'mobile_unit';

export interface MaintenanceEvent {
  id: string;
  mobileUnitId: string;
  equipmentId: string | null;
  type: string;
  description: string;
  partsUsed: string | null;
  cost: number | null;
  meterReading: string | null;
  createdAt: string;
}

export interface ActivityItem {
  type: 'equipment_issue' | 'equipment_return' | 'maintenance';
  at: string;
  id: string;
  description?: string;
  assetId?: string;
  equipmentTypeCode?: string;
  maintenanceType?: string;
  cost?: number | null;
  meterReading?: string | null;
}

export interface EquipmentType {
  code: string;
  label: string;
  category: string;
}

export interface MobileUnitEquipment {
  id: string;
  mobileUnitId: string;
  equipmentTypeCode: string;
  assetId: string;
  status: string;
  issuedAt: string;
  returnedAt: string | null;
  conditionNotes: string | null;
}

export interface MobileUnitDriver {
  id: string;
  mobileUnitId: string;
  name: string;
  idNumber: string | null;
  phone: string | null;
  role: string;
  assignedAt: string;
  status: string;
}

export class MobileUnitService {
  private agentService = new AgentService();

  async getById(id: string) {
    const agent = await this.agentService.getById(id);
    if (!agent || agent.type !== MOBILE_UNIT_TYPE) return null;
    return agent;
  }

  async getEquipment(mobileUnitId: string): Promise<MobileUnitEquipment[]> {
    try {
      const unit = await this.getById(mobileUnitId);
      if (!unit) return [];
      const rows = await sql`
        SELECT id::text, mobile_unit_id::text, equipment_type_code, asset_id, status,
               issued_at::text, returned_at::text, condition_notes
        FROM mobile_unit_equipment
        WHERE mobile_unit_id::text = ${mobileUnitId}
        ORDER BY issued_at DESC
      `;
      return (rows as any[]).map((r) => ({
        id: r.id,
        mobileUnitId: r.mobile_unit_id,
        equipmentTypeCode: r.equipment_type_code,
        assetId: r.asset_id,
        status: r.status,
        issuedAt: r.issued_at,
        returnedAt: r.returned_at ?? null,
        conditionNotes: r.condition_notes ?? null,
      }));
    } catch (error) {
      logError('MobileUnitService.getEquipment', error);
      if (error instanceof Error && error.message.includes('does not exist')) return [];
      throw error;
    }
  }

  async getDrivers(mobileUnitId: string): Promise<MobileUnitDriver[]> {
    try {
      const unit = await this.getById(mobileUnitId);
      if (!unit) return [];
      const rows = await sql`
        SELECT id::text, mobile_unit_id::text, name, id_number, phone, role, assigned_at::text, status
        FROM mobile_unit_drivers
        WHERE mobile_unit_id::text = ${mobileUnitId}
        ORDER BY assigned_at DESC
      `;
      return (rows as any[]).map((r) => ({
        id: r.id,
        mobileUnitId: r.mobile_unit_id,
        name: r.name,
        idNumber: r.id_number ?? null,
        phone: r.phone ?? null,
        role: r.role,
        assignedAt: r.assigned_at,
        status: r.status,
      }));
    } catch (error) {
      logError('MobileUnitService.getDrivers', error);
      if (error instanceof Error && error.message.includes('does not exist')) return [];
      throw error;
    }
  }

  async getEquipmentTypes(): Promise<EquipmentType[]> {
    try {
      const rows = await sql`SELECT code, label, category FROM equipment_types ORDER BY code`;
      return (rows as any[]).map((r) => ({ code: r.code, label: r.label, category: r.category }));
    } catch (error) {
      logError('MobileUnitService.getEquipmentTypes', error);
      if (error instanceof Error && error.message.includes('does not exist')) return [];
      throw error;
    }
  }

  async issueEquipment(
    mobileUnitId: string,
    body: { equipmentTypeCode: string; assetId: string; notes?: string }
  ): Promise<MobileUnitEquipment> {
    const unit = await this.getById(mobileUnitId);
    if (!unit) throw new Error('Mobile unit not found');
    const [row] = await sql`
      INSERT INTO mobile_unit_equipment (mobile_unit_id, equipment_type_code, asset_id, status, condition_notes)
      SELECT ${mobileUnitId}::uuid, ${body.equipmentTypeCode}, ${body.assetId}, 'in_use', ${body.notes ?? null}
      WHERE EXISTS (SELECT 1 FROM agents WHERE id = ${mobileUnitId}::uuid AND type = ${MOBILE_UNIT_TYPE})
      RETURNING id::text, mobile_unit_id::text, equipment_type_code, asset_id, status,
                issued_at::text, returned_at::text, condition_notes
    `;
    if (!row) throw new Error('Failed to issue equipment');
    const r = row as any;
    return {
      id: r.id,
      mobileUnitId: r.mobile_unit_id,
      equipmentTypeCode: r.equipment_type_code,
      assetId: r.asset_id,
      status: r.status,
      issuedAt: r.issued_at,
      returnedAt: r.returned_at ?? null,
      conditionNotes: r.condition_notes ?? null,
    };
  }

  async returnEquipment(mobileUnitId: string, equipmentId: string): Promise<MobileUnitEquipment | null> {
    const unit = await this.getById(mobileUnitId);
    if (!unit) return null;
    const [row] = await sql`
      UPDATE mobile_unit_equipment
      SET status = 'returned', returned_at = NOW(), updated_at = NOW()
      WHERE id::text = ${equipmentId} AND mobile_unit_id::text = ${mobileUnitId}
      RETURNING id::text, mobile_unit_id::text, equipment_type_code, asset_id, status,
                issued_at::text, returned_at::text, condition_notes
    `;
    if (!row) return null;
    const r = row as any;
    return {
      id: r.id,
      mobileUnitId: r.mobile_unit_id,
      equipmentTypeCode: r.equipment_type_code,
      assetId: r.asset_id,
      status: r.status,
      issuedAt: r.issued_at,
      returnedAt: r.returned_at ?? null,
      conditionNotes: r.condition_notes ?? null,
    };
  }

  async getActivity(mobileUnitId: string, limit = 50): Promise<ActivityItem[]> {
    const unit = await this.getById(mobileUnitId);
    if (!unit) return [];
    try {
      const equipmentRows = await sql`
        SELECT id::text, asset_id, equipment_type_code, issued_at::text, returned_at::text
        FROM mobile_unit_equipment
        WHERE mobile_unit_id::text = ${mobileUnitId}
        ORDER BY issued_at DESC
        LIMIT 100
      `;
      const maintenanceRows = await sql`
        SELECT id::text, type, description, cost, meter_reading, created_at::text
        FROM maintenance_events
        WHERE mobile_unit_id::text = ${mobileUnitId}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      const items: ActivityItem[] = [];
      (equipmentRows as any[]).forEach((r) => {
        if (r.issued_at) {
          items.push({
            type: 'equipment_issue',
            at: r.issued_at,
            id: r.id,
            assetId: r.asset_id,
            equipmentTypeCode: r.equipment_type_code,
          });
        }
        if (r.returned_at) {
          items.push({
            type: 'equipment_return',
            at: r.returned_at,
            id: r.id,
            assetId: r.asset_id,
            equipmentTypeCode: r.equipment_type_code,
          });
        }
      });
      (maintenanceRows as any[]).forEach((r) => {
        items.push({
          type: 'maintenance',
          at: r.created_at,
          id: r.id,
          description: r.description,
          maintenanceType: r.type,
          cost: r.cost != null ? Number(r.cost) : null,
          meterReading: r.meter_reading ?? null,
        });
      });
      items.sort((a, b) => (b.at < a.at ? -1 : 1));
      return items.slice(0, limit);
    } catch (error) {
      logError('MobileUnitService.getActivity', error);
      if (error instanceof Error && error.message.includes('does not exist')) return [];
      throw error;
    }
  }

  async postMaintenance(
    mobileUnitId: string,
    body: { type: string; description: string; partsUsed?: string; cost?: number; meterReading?: string; equipmentId?: string }
  ): Promise<MaintenanceEvent> {
    const unit = await this.getById(mobileUnitId);
    if (!unit) throw new Error('Mobile unit not found');
    const equipmentId = body.equipmentId && body.equipmentId.trim() !== '' ? body.equipmentId : null;
    const [row] = await sql`
      INSERT INTO maintenance_events (mobile_unit_id, equipment_id, type, description, parts_used, cost, meter_reading)
      VALUES (
        ${mobileUnitId}::uuid,
        ${equipmentId}::uuid,
        ${body.type},
        ${body.description},
        ${body.partsUsed ?? null},
        ${body.cost ?? null},
        ${body.meterReading ?? null}
      )
      RETURNING id::text, mobile_unit_id::text, equipment_id::text, type, description, parts_used, cost, meter_reading, created_at::text
    `;
    if (!row) throw new Error('Failed to create maintenance event');
    const r = row as any;
    return {
      id: r.id,
      mobileUnitId: r.mobile_unit_id,
      equipmentId: r.equipment_id ?? null,
      type: r.type,
      description: r.description,
      partsUsed: r.parts_used ?? null,
      cost: r.cost != null ? Number(r.cost) : null,
      meterReading: r.meter_reading ?? null,
      createdAt: r.created_at,
    };
  }

  async addDriver(
    mobileUnitId: string,
    body: { name: string; idNumber?: string; phone?: string; role?: string }
  ): Promise<MobileUnitDriver> {
    const unit = await this.getById(mobileUnitId);
    if (!unit) throw new Error('Mobile unit not found');
    const [row] = await sql`
      INSERT INTO mobile_unit_drivers (mobile_unit_id, name, id_number, phone, role, status)
      SELECT ${mobileUnitId}::uuid, ${body.name}, ${body.idNumber ?? null}, ${body.phone ?? null}, ${body.role ?? 'driver'}, 'active'
      WHERE EXISTS (SELECT 1 FROM agents WHERE id = ${mobileUnitId}::uuid AND type = ${MOBILE_UNIT_TYPE})
      RETURNING id::text, mobile_unit_id::text, name, id_number, phone, role, assigned_at::text, status
    `;
    if (!row) throw new Error('Failed to add driver');
    const r = row as any;
    return {
      id: r.id,
      mobileUnitId: r.mobile_unit_id,
      name: r.name,
      idNumber: r.id_number ?? null,
      phone: r.phone ?? null,
      role: r.role,
      assignedAt: r.assigned_at,
      status: r.status,
    };
  }

  async updateDriver(
    mobileUnitId: string,
    driverId: string,
    body: { name?: string; idNumber?: string; phone?: string; role?: string; status?: string }
  ): Promise<MobileUnitDriver | null> {
    const unit = await this.getById(mobileUnitId);
    if (!unit) return null;
    const drivers = await this.getDrivers(mobileUnitId);
    const existing = drivers.find((d) => d.id === driverId);
    if (!existing) return null;
    const name = body.name ?? existing.name;
    const idNumber = body.idNumber !== undefined ? body.idNumber : existing.idNumber;
    const phone = body.phone !== undefined ? body.phone : existing.phone;
    const role = body.role ?? existing.role;
    const status = body.status && ['active', 'off', 'replaced'].includes(body.status) ? body.status : existing.status;
    const [row] = await sql`
      UPDATE mobile_unit_drivers
      SET name = ${name}, id_number = ${idNumber}, phone = ${phone}, role = ${role}, status = ${status}, updated_at = NOW()
      WHERE id::text = ${driverId} AND mobile_unit_id::text = ${mobileUnitId}
      RETURNING id::text, mobile_unit_id::text, name, id_number, phone, role, assigned_at::text, status
    `;
    if (!row) return null;
    const r = row as any;
    return {
      id: r.id,
      mobileUnitId: r.mobile_unit_id,
      name: r.name,
      idNumber: r.id_number ?? null,
      phone: r.phone ?? null,
      role: r.role,
      assignedAt: r.assigned_at,
      status: r.status,
    };
  }

  async removeDriver(mobileUnitId: string, driverId: string): Promise<boolean> {
    const unit = await this.getById(mobileUnitId);
    if (!unit) return false;
    const [deleted] = await sql`
      DELETE FROM mobile_unit_drivers
      WHERE id::text = ${driverId} AND mobile_unit_id::text = ${mobileUnitId}
      RETURNING id
    `;
    return !!deleted;
  }
}

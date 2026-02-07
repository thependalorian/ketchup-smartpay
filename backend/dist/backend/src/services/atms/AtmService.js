/**
 * ATM Service
 *
 * Purpose: CRUD and stats for ATMs (location, status, cash level, replenishment).
 * Location: backend/src/services/atms/AtmService.ts
 */
import { sql } from '../../database/connection';
export class AtmService {
    async getAll(filters) {
        const limit = Math.min(filters?.limit ?? 50, 100);
        const offset = filters?.offset ?? 0;
        const region = filters?.region ?? null;
        const statusFilter = filters?.status ?? null;
        const rows = await sql `
      SELECT id, terminal_id AS "terminalId", location, region, status,
        cash_level_percent AS "cashLevelPercent", mobile_unit_id AS "mobileUnitId",
        last_serviced_at AS "lastServicedAt", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM atms
      WHERE (${region}::text IS NULL OR region = ${region})
        AND (${statusFilter}::text IS NULL OR status = ${statusFilter})
      ORDER BY location ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
        return rows ?? [];
    }
    async getById(id) {
        const [row] = await sql `
      SELECT id, terminal_id AS "terminalId", location, region, status,
        cash_level_percent AS "cashLevelPercent", mobile_unit_id AS "mobileUnitId",
        last_serviced_at AS "lastServicedAt", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM atms
      WHERE id::text = ${id}
    `;
        return row ?? null;
    }
    async getStats() {
        const rows = await sql `
      SELECT status, COUNT(*)::int AS count
      FROM atms
      GROUP BY status
    `;
        const stats = { total: 0, operational: 0, offline: 0, maintenance: 0, lowCash: 0 };
        for (const r of rows) {
            stats.total += r.count;
            if (r.status === 'operational')
                stats.operational = r.count;
            else if (r.status === 'offline')
                stats.offline = r.count;
            else if (r.status === 'maintenance')
                stats.maintenance = r.count;
            else if (r.status === 'low_cash')
                stats.lowCash = r.count;
        }
        return stats;
    }
    async create(body) {
        const [row] = await sql `
      INSERT INTO atms (terminal_id, location, region, status, cash_level_percent, mobile_unit_id, last_serviced_at)
      VALUES (
        ${body.terminalId.trim()},
        ${body.location.trim()},
        ${body.region?.trim() ?? null},
        ${body.status ?? 'operational'},
        ${body.cashLevelPercent ?? null},
        ${body.mobileUnitId ?? null}::uuid,
        ${body.lastServicedAt ?? null}::timestamptz
      )
      RETURNING id, terminal_id AS "terminalId", location, region, status,
        cash_level_percent AS "cashLevelPercent", mobile_unit_id AS "mobileUnitId",
        last_serviced_at AS "lastServicedAt", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
        return row;
    }
    async update(id, body) {
        const existing = await this.getById(id);
        if (!existing)
            return null;
        const terminalId = body.terminalId?.trim() ?? existing.terminalId;
        const location = body.location?.trim() ?? existing.location;
        const region = body.region !== undefined ? (body.region?.trim() ?? null) : existing.region;
        const status = body.status ?? existing.status;
        const cashLevelPercent = body.cashLevelPercent !== undefined ? body.cashLevelPercent : existing.cashLevelPercent;
        const mobileUnitId = body.mobileUnitId !== undefined ? (body.mobileUnitId ?? null) : existing.mobileUnitId;
        const lastServicedAt = body.lastServicedAt !== undefined ? body.lastServicedAt : existing.lastServicedAt;
        const [row] = await sql `
      UPDATE atms
      SET terminal_id = ${terminalId}, location = ${location}, region = ${region}, status = ${status},
        cash_level_percent = ${cashLevelPercent}, mobile_unit_id = ${mobileUnitId}::uuid,
        last_serviced_at = ${lastServicedAt}::timestamptz, updated_at = NOW()
      WHERE id::text = ${id}
      RETURNING id, terminal_id AS "terminalId", location, region, status,
        cash_level_percent AS "cashLevelPercent", mobile_unit_id AS "mobileUnitId",
        last_serviced_at AS "lastServicedAt", created_at AS "createdAt", updated_at AS "updatedAt"
    `;
        return row ?? null;
    }
}
//# sourceMappingURL=AtmService.js.map
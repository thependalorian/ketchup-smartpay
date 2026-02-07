/**
 * POS Terminal Service
 *
 * Purpose: CRUD for POS terminals (agent/merchant assignment, status).
 * Location: backend/src/services/posTerminals/PosTerminalService.ts
 */

import { sql } from '../../database/connection';

export interface PosTerminal {
  id: string;
  terminalId: string;
  agentId: string | null;
  merchantId: string | null;
  status: string;
  deviceId: string | null;
  provisionedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PosTerminalService {
  async getAll(filters?: { agentId?: string; merchantId?: string; status?: string; limit?: number; offset?: number }): Promise<PosTerminal[]> {
    const limit = Math.min(filters?.limit ?? 50, 100);
    const offset = filters?.offset ?? 0;
    const agentId = filters?.agentId ?? null;
    const merchantId = filters?.merchantId ?? null;
    const statusFilter = filters?.status ?? null;
    const rows = await sql`
      SELECT id, terminal_id AS "terminalId", agent_id AS "agentId", merchant_id AS "merchantId",
        status, device_id AS "deviceId", provisioned_at AS "provisionedAt",
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM pos_terminals
      WHERE (${agentId}::text IS NULL OR agent_id::text = ${agentId})
        AND (${merchantId}::text IS NULL OR merchant_id = ${merchantId})
        AND (${statusFilter}::text IS NULL OR status = ${statusFilter})
      ORDER BY terminal_id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;
    return (rows as PosTerminal[]) ?? [];
  }

  async getById(id: string): Promise<PosTerminal | null> {
    const [row] = await sql`
      SELECT id, terminal_id AS "terminalId", agent_id AS "agentId", merchant_id AS "merchantId",
        status, device_id AS "deviceId", provisioned_at AS "provisionedAt",
        created_at AS "createdAt", updated_at AS "updatedAt"
      FROM pos_terminals
      WHERE id::text = ${id}
    `;
    return (row as PosTerminal) ?? null;
  }

  async create(body: {
    terminalId: string;
    agentId?: string;
    merchantId?: string;
    status?: string;
    deviceId?: string;
  }): Promise<PosTerminal> {
    const [row] = await sql`
      INSERT INTO pos_terminals (terminal_id, agent_id, merchant_id, status, device_id)
      VALUES (
        ${body.terminalId.trim()},
        ${body.agentId?.trim() ?? null}::uuid,
        ${body.merchantId?.trim() ?? null},
        ${body.status ?? 'active'},
        ${body.deviceId?.trim() ?? null}
      )
      RETURNING id, terminal_id AS "terminalId", agent_id AS "agentId", merchant_id AS "merchantId",
        status, device_id AS "deviceId", provisioned_at AS "provisionedAt",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return row as PosTerminal;
  }

  async update(
    id: string,
    body: {
      terminalId?: string;
      agentId?: string | null;
      merchantId?: string | null;
      status?: string;
      deviceId?: string | null;
    }
  ): Promise<PosTerminal | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const terminalId = body.terminalId?.trim() ?? existing.terminalId;
    const agentId = body.agentId !== undefined ? (body.agentId?.trim() ?? null) : existing.agentId;
    const merchantId = body.merchantId !== undefined ? (body.merchantId?.trim() ?? null) : existing.merchantId;
    const status = body.status ?? existing.status;
    const deviceId = body.deviceId !== undefined ? (body.deviceId?.trim() ?? null) : existing.deviceId;
    const [row] = await sql`
      UPDATE pos_terminals
      SET terminal_id = ${terminalId}, agent_id = ${agentId}::uuid, merchant_id = ${merchantId},
        status = ${status}, device_id = ${deviceId}, updated_at = NOW()
      WHERE id::text = ${id}
      RETURNING id, terminal_id AS "terminalId", agent_id AS "agentId", merchant_id AS "merchantId",
        status, device_id AS "deviceId", provisioned_at AS "provisionedAt",
        created_at AS "createdAt", updated_at AS "updatedAt"
    `;
    return (row as PosTerminal) ?? null;
  }
}

/**
 * Locations API Routes (NamPost, ATM, Warehouse)
 *
 * Purpose: REST API for fixed locations from locations table. Used by Ketchup portal map.
 * Redemption is via post office, agents, ATM only; banks are not used.
 * Location: backend/src/api/routes/ketchup/locations.ts
 */

import { Router, Request, Response } from 'express';
import { APIResponse } from '../../../../../shared/types';
import { logError } from '../../../utils/logger';
import { ketchupAuth } from '../../middleware/ketchupAuth';
import { sql } from '../../../database/connection';

const router = Router();

export type LocationTypeDb = 'nampost_office' | 'atm' | 'warehouse';

/** Map DB type to API type (kebab-case). */
function toApiType(dbType: string): string {
  if (dbType === 'nampost_office') return 'nampost-office';
  if (dbType === 'atm') return 'atm';
  if (dbType === 'warehouse') return 'warehouse';
  return dbType;
}

/**
 * GET /api/v1/ketchup/locations
 * List fixed locations (NamPost offices, ATMs, warehouses).
 * Query: type=nampost_office|atm|warehouse, region=Khomas
 */
router.get('/', ketchupAuth, async (req: Request, res: Response<APIResponse<any[]>>) => {
  try {
    const typeFilter = req.query.type as string | undefined;
    const regionFilter = req.query.region as string | undefined;

    type LocationRow = {
      id: string;
      type: string;
      name: string;
      region: string;
      latitude: number;
      longitude: number;
      address: string | null;
    };
    let rows: LocationRow[];

    if (typeFilter && regionFilter) {
      rows = (await sql`
        SELECT id::text, type, name, region, latitude::float, longitude::float, address
        FROM locations
        WHERE type = ${typeFilter} AND region = ${regionFilter}
        ORDER BY type, name
      `) as LocationRow[];
    } else if (typeFilter) {
      rows = (await sql`
        SELECT id::text, type, name, region, latitude::float, longitude::float, address
        FROM locations
        WHERE type = ${typeFilter}
        ORDER BY name
      `) as LocationRow[];
    } else if (regionFilter) {
      rows = (await sql`
        SELECT id::text, type, name, region, latitude::float, longitude::float, address
        FROM locations
        WHERE region = ${regionFilter}
        ORDER BY type, name
      `) as LocationRow[];
    } else {
      rows = (await sql`
        SELECT id::text, type, name, region, latitude::float, longitude::float, address
        FROM locations
        ORDER BY type, name
      `) as LocationRow[];
    }

    const data = (rows as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      type: toApiType(row.type),
      typeDb: row.type,
      region: row.region,
      latitude: Number(row.latitude) ?? 0,
      longitude: Number(row.longitude) ?? 0,
      address: row.address ?? undefined,
    }));

    res.json({ success: true, data });
  } catch (error) {
    logError('Failed to list locations', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch locations',
    });
  }
});

/**
 * GET /api/v1/ketchup/locations/types
 * List distinct location types (for filters).
 */
router.get('/types', ketchupAuth, async (req: Request, res: Response<APIResponse<string[]>>) => {
  try {
    const rows = await sql`
      SELECT DISTINCT type FROM locations ORDER BY type
    `;
    const data = (rows as { type: string }[]).map((r) => toApiType(r.type));
    res.json({ success: true, data });
  } catch (error) {
    logError('Failed to list location types', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch location types',
    });
  }
});

/**
 * GET /api/v1/ketchup/locations/:id
 * Get one location by id.
 */
router.get('/:id', ketchupAuth, async (req: Request, res: Response<APIResponse<any>>) => {
  try {
    const { id } = req.params;
    const rows = await sql`
      SELECT id::text, type, name, region, latitude::float, longitude::float, address
      FROM locations
      WHERE id::text = ${id}
    `;
    const row = (rows as any[])[0];
    if (!row) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }
    const data = {
      id: row.id,
      name: row.name,
      type: toApiType(row.type),
      typeDb: row.type,
      region: row.region,
      latitude: Number(row.latitude) ?? 0,
      longitude: Number(row.longitude) ?? 0,
      address: row.address ?? undefined,
    };
    res.json({ success: true, data });
  } catch (error) {
    logError('Failed to get location by id', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch location',
    });
  }
});

export default router;

/**
 * Map / Locations API Routes
 *
 * Purpose: Serve agent network locations for NamibiaMap (ketchup-portal).
 * Data: agents table (agents) + locations table (nampost_office, bank, atm, warehouse).
 * Banks are not redemption channels; redemption is via post office, agents, ATM.
 * Location: backend/src/api/routes/ketchup/map.ts
 */
import { Router } from 'express';
import { logError } from '../../../utils/logger';
import { ketchupAuth } from '../../middleware/ketchupAuth';
import { AgentService } from '../../../services/agents/AgentService';
import { sql } from '../../../database/connection';
const router = Router();
const agentService = new AgentService();
/** Map DB location type to mapAPI LocationType (nampost-office, bank-branch, atm, warehouse). */
function toMapLocationType(dbType) {
    if (dbType === 'nampost_office')
        return 'nampost-office';
    if (dbType === 'bank')
        return 'bank-branch';
    if (dbType === 'atm')
        return 'atm';
    if (dbType === 'warehouse')
        return 'warehouse';
    return 'nampost-office';
}
/** Map agent status to MapLocation status (mapAPI.MapLocation) */
function toMapStatus(agentStatus) {
    if (agentStatus === 'active')
        return 'active';
    if (agentStatus === 'inactive')
        return 'inactive';
    if (agentStatus === 'low_liquidity')
        return 'maintenance';
    return 'offline';
}
/** Map agent type to MapLocation type (all agents → agent-pos) */
function toMapType(_agentType) {
    return 'agent-pos';
}
/**
 * GET /api/v1/map/locations/fixed
 * Returns fixed locations (NamPost offices, ATMs, warehouses) from locations table.
 * Optional query: type=nampost_office|atm|warehouse, region=Khomas
 */
router.get('/locations/fixed', ketchupAuth, async (req, res) => {
    try {
        const typeFilter = req.query.type;
        const regionFilter = req.query.region;
        let rows;
        if (typeFilter && regionFilter) {
            rows = (await sql `
        SELECT id, type, name, region, latitude::float, longitude::float, address
        FROM locations
        WHERE type = ${typeFilter} AND region = ${regionFilter}
        ORDER BY name
      `);
        }
        else if (typeFilter) {
            rows = (await sql `
        SELECT id, type, name, region, latitude::float, longitude::float, address
        FROM locations
        WHERE type = ${typeFilter}
        ORDER BY name
      `);
        }
        else if (regionFilter) {
            rows = (await sql `
        SELECT id, type, name, region, latitude::float, longitude::float, address
        FROM locations
        WHERE region = ${regionFilter}
        ORDER BY type, name
      `);
        }
        else {
            rows = (await sql `
        SELECT id, type, name, region, latitude::float, longitude::float, address
        FROM locations
        ORDER BY type, name
      `);
        }
        const data = rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: toMapLocationType(row.type),
            latitude: Number(row.latitude) ?? 0,
            longitude: Number(row.longitude) ?? 0,
            region: row.region,
            status: 'active',
            address: row.address ?? undefined,
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        logError('Failed to get fixed map locations', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch fixed locations',
        });
    }
});
/**
 * GET /api/v1/map/locations
 * Returns agents with coordinates as MapLocation[] for NamibiaMap.
 */
router.get('/locations', ketchupAuth, async (req, res) => {
    try {
        const region = req.query.region;
        const type = req.query.type;
        const rows = await agentService.getForMap({ region, type });
        const data = rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: toMapType(row.type),
            latitude: row.latitude ?? 0,
            longitude: row.longitude ?? 0,
            region: row.region,
            status: toMapStatus(row.status),
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        logError('Failed to get map locations', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch map locations',
        });
    }
});
/**
 * GET /api/v1/map/locations/region/:region
 */
router.get('/locations/region/:region', ketchupAuth, async (req, res) => {
    try {
        const rows = await agentService.getForMap({ region: req.params.region });
        const data = rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: toMapType(row.type),
            latitude: row.latitude ?? 0,
            longitude: row.longitude ?? 0,
            region: row.region,
            status: toMapStatus(row.status),
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        logError('Failed to get map locations by region', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch map locations',
        });
    }
});
/**
 * GET /api/v1/map/locations/type/:type
 * type filter (e.g. agent-pos); backend agents all map to agent-pos.
 */
router.get('/locations/type/:type', ketchupAuth, async (req, res) => {
    try {
        const rows = await agentService.getForMap({ type: req.params.type === 'agent-pos' ? undefined : req.params.type });
        const data = rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: toMapType(row.type),
            latitude: row.latitude ?? 0,
            longitude: row.longitude ?? 0,
            region: row.region,
            status: toMapStatus(row.status),
        }));
        res.json({ success: true, data });
    }
    catch (error) {
        logError('Failed to get map locations by type', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch map locations',
        });
    }
});
/**
 * GET /api/v1/map/locations/:id
 * Get single location by id (agent or fixed location). For mapAPI.getLocationById.
 */
router.get('/locations/:id', ketchupAuth, async (req, res) => {
    try {
        const { id } = req.params;
        // Try fixed locations first (locations table)
        const locRows = await sql `
      SELECT id::text, type, name, region, latitude::float, longitude::float
      FROM locations
      WHERE id::text = ${id}
    `;
        const loc = locRows[0];
        if (loc) {
            const data = {
                id: loc.id,
                name: loc.name,
                type: toMapLocationType(loc.type),
                latitude: Number(loc.latitude) ?? 0,
                longitude: Number(loc.longitude) ?? 0,
                region: loc.region,
                status: 'active',
            };
            return res.json({ success: true, data });
        }
        // Else try agents
        const agents = await agentService.getForMap({});
        const agent = agents.find((a) => a.id === id);
        if (agent) {
            const data = {
                id: agent.id,
                name: agent.name,
                type: toMapType(agent.type),
                latitude: agent.latitude ?? 0,
                longitude: agent.longitude ?? 0,
                region: agent.region,
                status: toMapStatus(agent.status),
            };
            return res.json({ success: true, data });
        }
        res.status(404).json({
            success: false,
            error: 'Location not found',
        });
    }
    catch (error) {
        logError('Failed to get map location by id', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch location',
        });
    }
});
export default router;
//# sourceMappingURL=map.js.map
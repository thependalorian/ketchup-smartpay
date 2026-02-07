/**
 * Locations API Routes (NamPost, ATM, Warehouse)
 *
 * Purpose: REST API for fixed locations from locations table. Used by Ketchup portal map.
 * Redemption is via post office, agents, ATM only; banks are not used.
 * Location: backend/src/api/routes/ketchup/locations.ts
 */
import { Router } from 'express';
declare const router: Router;
export type LocationTypeDb = 'nampost_office' | 'atm' | 'warehouse';
export default router;
//# sourceMappingURL=locations.d.ts.map
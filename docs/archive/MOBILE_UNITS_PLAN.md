# Ketchup SmartPay – SmartPay Mobile: Management, Tracking & NamPost Reporting Plan

**Purpose:** Plan for the SmartPay Mobile page (similar to Agent Network) covering fleet management, equipment/inventory, activity tracking, procurement insights, and NamPost reporting.  
**Location:** `ketchup-smartpay/docs/MOBILE_UNITS_PLAN.md`  
**References:** Agent Network (`/agents`), PAGES_AND_API_REFERENCE.md, FILE_STRUCTURE.md.

---

## 1. Context from research

### 1.1 Field / fleet and cash-in-transit patterns

- **Field service inventory:** Real-time tracking of parts and equipment from warehouse → technician → job site; serial/lot IDs; issue/return/dispatch; low-stock alerts; usage and cost reporting ([FieldSquared](https://fieldsquared.com/platform/field-service-inventory-management/), [Fleetio](https://www.fleetio.com/features/parts-inventory-system)).
- **Fleet maintenance:** Repair orders, meter readings (mileage/hours), parts used, DVIR-style inspections; VMRS-style coding for consistent reporting; preventative vs reactive maintenance; procurement tied to consumption ([Samsara](https://www.samsara.com/guides/fleet-vehicle-maintenance), [Fleetio](https://www.fleetio.com/blog/maintenance-reporting-vmrs)).
- **Cash-in-transit (CIT):** Mobile cash dispensing; tracking of cassettes/bags/seals; QR/scan workflows; real-time diagnostics and proactive maintenance; reporting for regulators and partners ([G+D](https://www.gi-de.com/en/industries/transport-logistics/cash-in-transit), [CashPilot](https://www.cashpilot.com/products/cashpilot-cash-in-transit-2/)).

### 1.2 NamPost alignment

- NamPost operates post offices and agency services; handles third-party payments, GIPF pay-outs, and social grant-related flows ([NamPost](https://www.nampost.com.na/postal/agencies)).
- Reporting expectations: operational performance, network coverage, and financial/agency metrics (aligned with annual reports and agency information).
- Mobile units act as an extension of the cash/payment delivery network; reporting to NamPost should cover unit availability, coverage, volumes, and incidents/maintenance where relevant.

### 1.3 Ketchup SmartPay today

- **Agents:** `agents` table; types include `pos_agent`, `mobile_agent`, `mobile_unit`; Ketchup page “Agent Network” at `/agents` with list, filters, stats, view-detail.
- **30 mobile units:** Seeded as agents with `type = 'mobile_unit'` (29 active, 1 down).
- **Redemption channel:** `mobile_unit` is a voucher redemption channel (with post_office, pos, mobile, atm).

This plan extends that into **dedicated mobile unit management**: fleet, equipment, drivers, inventory, and reporting.

---

## 2. Goals

1. **Single place for mobile units** – List, status, region, and key metrics (similar to Agent Network).
2. **Equipment & inventory** – Vehicles, dispensers, parts; unique IDs; state (dispatched / in-use / returned / maintenance).
3. **Activity & lifecycle** – Who was issued what, when; collections and returns; wear & tear / maintenance events.
4. **Insights for procurement & logistics** – Usage frequency, request patterns, failure/replacement rates, reorder signals.
5. **NamPost reporting** – Structured exports/summaries (coverage, uptime, volumes, incidents) for NamPost.

---

## 3. Data model (conceptual)

### 3.1 Existing

- **agents** – Already used for mobile units (`type = 'mobile_unit'`); id, name, type, location (region), latitude, longitude, status, liquidity_balance, cash_on_hand, contact_phone, etc.

### 3.2 Proposed entities (backend / DB)

| Entity | Purpose | Key fields (conceptual) |
|--------|--------|--------------------------|
| **mobile_units** (optional view/table) | 1:1 with agents where type=’mobile_unit’; or keep using agents with type filter. | unit_id (→ agents.id), vehicle_reg, base_region, status_override |
| **mobile_unit_equipment** | Equipment carried by units (dispensers, devices, parts). | id, mobile_unit_id, equipment_type, serial_number / asset_id, status (dispatched / in_use / returned / maintenance / retired), issued_at, returned_at, condition_notes |
| **mobile_unit_drivers** | Team overhead – drivers assigned to units. | id, mobile_unit_id, name, id_number, phone, role, assigned_at, status (active / off / replaced) |
| **equipment_types** (reference) | Types of equipment (e.g. dispenser, vehicle_part, cash_cassette). | code, label, category (vehicle_part \| dispenser \| other) |
| **inventory_transactions** | Issue / return / dispatch / collect. | id, equipment_id, mobile_unit_id, type (issued \| returned \| dispatched \| collected), quantity, at_location, performed_by, reference (e.g. work order), created_at |
| **maintenance_events** | Wear & tear, repairs, parts used. | id, mobile_unit_id, equipment_id (optional), type (inspection \| repair \| replacement), description, parts_used (JSON or FK), cost, created_at, meter_reading (km/hours) |
| **mobile_unit_requests** (optional) | Frequency of request (e.g. for parts, support). | id, mobile_unit_id, request_type, status, created_at, fulfilled_at |

Liquidity for mobile units can stay on **agents** (liquidity_balance, cash_on_hand); no need to duplicate in a new table unless we want a separate liquidity ledger per unit.

### 3.3 Reporting / analytics (derived)

- **Procurement:** Usage per equipment type, consumption rate, reorder thresholds.
- **Logistics:** Dispatch/collection frequency, turnaround time, “issued vs returned” balance per unit.
- **NamPost:** Unit availability (active/down), regions covered, redemption volumes per mobile_unit, incident/maintenance summary.

---

## 4. Ketchup portal: SmartPay Mobile page

### 4.1 Placement (mirror Agent Network)

- **Route:** `/mobile-units` (new).
- **Sidebar:** New item “SmartPay Mobile” (e.g. icon Truck or Package) next to “Agent Network”; same section (main nav).
- **App.tsx:** New route `<Route path="/mobile-units" element={<MobileUnits />} />`.

### 4.2 Page structure (similar to Agents.tsx)

- **Summary cards:** Total units, Active, Down, Total equipment issued, Liquidity (e.g. total or average).
- **Filters:** Region, Status (active / down / maintenance), optional search by name or vehicle/asset ID.
- **Table:** Columns – Name (e.g. “Mobile Unit 1”), Region, Status, Liquidity, Equipment count (or “issued”), Driver(s), Last activity, Actions (View).
- **View detail (modal or slide-over):**
  - Unit info (name, region, status, liquidity, contact).
  - **Equipment:** List of equipment (type, asset ID, status, issued/returned dates); optional “Issue” / “Return” / “Report maintenance”.
  - **Drivers:** Assigned drivers (name, id_number, role, status).
  - **Activity:** Recent inventory transactions and maintenance events (or link to dedicated activity tab).
  - **Stats:** Request frequency, redemption count (from vouchers where redemption_method = mobile_unit and agent_id = unit), simple procurement hints (e.g. “Parts requests this month”).

### 4.3 Optional sub-routes (later)

- `/mobile-units/:id` – Full unit detail page (equipment, drivers, activity, maintenance history).
- `/mobile-units/equipment` – Global equipment list and issue/return flows.
- `/mobile-units/reports` – Procurement and logistics reports + NamPost export.

---

## 5. Backend / API

### 5.1 Reuse existing

- **GET /api/v1/agents?type=mobile_unit** – List mobile units (already supported if agents have type).
- **GET /api/v1/agents/stats** – Extend or add query so stats can be filtered by type (e.g. mobile_unit only): total, active, down, liquidity.

### 5.2 New endpoints (when new tables exist)

| Method | Path | Purpose |
|--------|------|--------|
| GET | /api/v1/mobile-units | List mobile units (agents type=mobile_unit) with optional equipment/driver summary. |
| GET | /api/v1/mobile-units/stats | Aggregated stats for mobile units only. |
| GET | /api/v1/mobile-units/:id | Single unit with equipment, drivers, recent activity. |
| GET | /api/v1/mobile-units/:id/equipment | Equipment list for unit (with status, issued/returned). |
| GET | /api/v1/mobile-units/:id/activity | Inventory transactions + maintenance events (paginated). |
| POST | /api/v1/mobile-units/:id/equipment/issue | Record equipment issued to unit. |
| POST | /api/v1/mobile-units/:id/equipment/return | Record equipment returned. |
| POST | /api/v1/mobile-units/:id/maintenance | Record maintenance event (wear & tear, repair, parts). |
| GET | /api/v1/mobile-units/equipment/types | Reference list of equipment types. |
| GET | /api/v1/mobile-units/reports/procurement | Usage/frequency by equipment type (for procurement). |
| GET | /api/v1/mobile-units/reports/logistics | Dispatch/collection stats, turnaround. |
| GET | /api/v1/mobile-units/reports/nampost | Summary for NamPost (coverage, uptime, volumes, incidents). |

Auth: same as agents (e.g. Ketchup auth / authenticate middleware).

---

## 6. NamPost reporting

- **Content (suggested):**  
  - Count of mobile units by region; active vs down.  
  - Redemption volumes (vouchers redeemed via mobile_unit, optionally by unit or region).  
  - Summary of incidents/maintenance (count, severity, resolution).  
  - Equipment issued/returned counts (optional).  
- **Format:** CSV or PDF export from “NamPost report” action on SmartPay Mobile or Reports page; or dedicated “Export for NamPost” with a fixed template.  
- **Ownership:** Generated by Ketchup (operator); not real-time push to NamPost unless a future integration is defined.

---

## 7. Implementation phases

### Phase 1 – Page and list (no new DB tables)

- Add **SmartPay Mobile** nav item and route `/mobile-units`.
- **MobileUnits.tsx:** Reuse agents API with `type=mobile_unit`; summary cards (total, active, down, liquidity); table with Region, Status, Liquidity; View detail modal (unit info + placeholder for “Equipment” / “Drivers” / “Activity”).
- Backend: Ensure **GET /api/v1/agents** and **GET /api/v1/agents/stats** support `type=mobile_unit` (filter in AgentService or query param).

### Phase 2 – Equipment and drivers (new tables + API) ✅ Implemented

- Migrations: **equipment_types**, **mobile_unit_equipment**, **mobile_unit_drivers** (in `run.ts`).
- Backend: **MobileUnitService** (`backend/src/services/mobileUnits/MobileUnitService.ts`), routes **GET/POST /api/v1/mobile-units** (list, stats, equipment/types, :id, :id/equipment, :id/drivers, :id/equipment/issue, :id/equipment/return).
- Frontend: View detail modal with **Info** / **Equipment** / **Drivers** tabs; Equipment: list (asset ID, type, status, issued), “Issue equipment” form (type, asset ID, notes), “Return” per row; Drivers: list (name, id_number, role, status).

### Phase 3 – Activity and maintenance ✅ Implemented

- Migrations: **maintenance_events** (in `run.ts`): id, mobile_unit_id, equipment_id (optional), type (inspection|repair|replacement), description, parts_used, cost, meter_reading, created_at.
- Backend: **GET /api/v1/mobile-units/:id/activity** (combined equipment issue/return + maintenance, sorted by date); **POST /api/v1/mobile-units/:id/maintenance** (type, description, partsUsed?, cost?, meterReading?, equipmentId?).
- Frontend: **Activity** tab in view-detail modal: list of equipment issue/return and maintenance events; “Report maintenance” form (type, description, parts used, cost, meter reading).

### Phase 4 – Procurement and logistics insights

- Backend: Aggregations for usage by equipment type, request frequency, dispatch/return turnaround; endpoints **/reports/procurement**, **/reports/logistics**.
- Frontend: “Procurement” and “Logistics” sections (or sub-page) with charts and tables; low-stock / reorder hints.

### Phase 5 – NamPost reporting

- Backend: **GET /api/v1/mobile-units/reports/nampost** (and optionally CSV/PDF export).
- Frontend: “Export for NamPost” button and/or report template in Reports hub.

---

## 8. File / code locations

See **docs/FILE_STRUCTURE.md** for full repo tree.

- **Ketchup portal:**  
  - Page: `apps/ketchup-portal/src/pages/MobileUnits.tsx`  
  - Sidebar: `apps/ketchup-portal/src/components/layout/Sidebar.tsx` (“SmartPay Mobile” item)  
  - App routes: `apps/ketchup-portal/src/App.tsx` (route `/mobile-units`)
- **API client:**  
  - `packages/api-client/src/ketchup/mobileUnitsAPI.ts` (export from ketchup index)
- **Backend:**  
  - Routes: `backend/src/api/routes/ketchup/mobileUnits.ts`  
  - Service: `backend/src/services/mobileUnits/MobileUnitService.ts`  
  - Migrations: `backend/src/database/migrations/run.ts` (equipment_types, mobile_unit_equipment, mobile_unit_drivers; Phase 3: maintenance_events in run.ts)
- **Docs:**  
  - This plan: `docs/MOBILE_UNITS_PLAN.md`  
  - Pages/API: `docs/PAGES_AND_API_REFERENCE.md`  
  - Structure: `docs/FILE_STRUCTURE.md`

---

## 9. Success criteria

- Mobile units (30 seeded) visible on dedicated page with status (active/down) and liquidity.
- Equipment and drivers manageable per unit (issue/return, assign driver) with unique IDs where applicable.
- Activity and maintenance recorded; basic procurement/logistics metrics available.
- NamPost-oriented report export available for coverage, uptime, volumes, and incidents.

---

## 10. References

- Agent Network: `apps/ketchup-portal/src/pages/Agents.tsx`, `backend/src/api/routes/ketchup/agents.ts`, `backend/src/services/agents/AgentService.ts`
- Redemption channels: `post_office`, `mobile_unit`, `pos`, `mobile`, `atm` (PAGES_AND_API_REFERENCE.md, DashboardService)
- Seed: 30 mobile units, type `mobile_unit`, 29 active / 1 down (`backend/scripts/seed.ts`, VALIDATION_REPORT.md)
- File tree: `docs/FILE_STRUCTURE.md`

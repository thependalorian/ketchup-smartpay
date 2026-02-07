# Footnotes & Future Work

**Purpose:** Items noted for later implementation.  
**Location:** `ketchup-smartpay/docs/FOOTNOTES_FUTURE.md`

---

## Proxy collectors (later)

Some beneficiaries are elderly or disabled and have an **authorised person who collects on their behalf** (proxy collector). **Often or sometimes the proxy is a dependant** (e.g. child, spouse, guardian) of the beneficiary. The following are out of scope for the current release and to be implemented later:

- Designate a proxy collector for a beneficiary
- Link proxy identity (e.g. ID number, phone) to beneficiary; optionally link proxy to a **dependant** record (so proxy = dependant)
- Allow redemption by proxy (e.g. proxy presents voucher or collects cash on behalf of beneficiary)
- Audit trail for proxy collections

See also: **KETCHUP_VOUCHER_OPERATIONS.md** §1 (footnote in Assign = Issue to Beneficiary).

---

## Dependants and death (later)

**In case of death of the beneficiary**, benefits may be **directed to the dependant(s)** depending on the grant type (e.g. child grant → surviving guardian/child; old age grant → surviving spouse; disability → eligible dependants). Plan and design for this before implementing:

- Record **dependants** per beneficiary (name, id_number, phone, relationship, date of birth; optionally “is proxy” so proxy can be a dependant)
- **Death notification / status**: mark beneficiary as deceased and trigger rules per grant type
- **Redirect rules per grant type**: who can receive benefits after death (surviving spouse, guardian, child, etc.) and under what conditions
- **Redirect flow**: reassign grant/vouchers to dependant(s) or new beneficiary record; audit trail and compliance

See design section below: **Dependants and death-to-dependent redirection (design)**.

---

## How to implement proxy collectors (design)

**Principle:** The account always belongs to the beneficiary. The proxy is only an **authorised collector** linked to that beneficiary—not a separate account. Vouchers are still issued to the beneficiary; funds and Buffr wallet remain the beneficiary’s; the proxy is allowed to collect on their behalf.

### 1. Ownership and flow

| What | Owner | Notes |
|------|--------|--------|
| Buffr wallet / account | **Beneficiary** | `buffr_user_id` on voucher = beneficiary’s Buffr UUID. |
| Voucher | **Beneficiary** | `beneficiary_id`, `beneficiary_name`, id_number, phone = beneficiary. |
| Grant / entitlement | **Beneficiary** | Old age, disability, child grant, etc. stay in beneficiary’s name. |
| **Collection** | **Proxy (authorised)** | Proxy is linked to beneficiary; can present voucher / collect cash on behalf; funds still credit beneficiary’s account. |

So: **issue and credit** = beneficiary; **who can physically collect** = beneficiary or linked proxy.

### 2. Data model (for later)

**Option A – Columns on `beneficiaries` (one proxy per beneficiary):**

- `proxy_name` VARCHAR(255)  
- `proxy_id_number` VARCHAR(20)  
- `proxy_phone` VARCHAR(20)  
- `proxy_relationship` VARCHAR(50) — e.g. `family`, `caregiver`, `guardian`  
- `proxy_authorised_at` TIMESTAMPTZ  

**Option B – Table `beneficiary_proxies` (supports multiple proxies later):**

- `id` PK  
- `beneficiary_id` FK → beneficiaries(id)  
- `proxy_name`, `proxy_id_number`, `proxy_phone`, `proxy_relationship`  
- `is_primary` BOOLEAN (which proxy is default for collection)  
- `authorised_at`, `revoked_at`  
- UNIQUE(beneficiary_id, proxy_id_number) or similar  

Recommendation: start with **Option A** for simplicity; move to Option B if you need multiple proxies per beneficiary.

### 3. API (for later)

- **Link proxy to beneficiary:** e.g. `PATCH /api/v1/beneficiaries/:id` with `{ proxyName, proxyIdNumber, proxyPhone, proxyRelationship }`, or `POST /api/v1/beneficiaries/:id/proxy`.
- **Clear proxy:** same endpoint with null/empty or `DELETE .../proxy`.
- **Read:** GET beneficiary (or GET …/proxy) returns proxy fields so Ketchup/Buffr can show “Collectible by: [Proxy Name]”.

No change to **issue**: vouchers are still issued to `beneficiaryId`; no “issue to proxy”.

### 4. Distribution to Buffr (optional extension)

When distributing a voucher, payload already has beneficiary id_number and phone. You can add optional **proxy** fields so Buffr can show “Collectible by proxy: [Name]” and accept collection by proxy:

- `proxy_name`, `proxy_id_number`, `proxy_phone` (if beneficiary has a linked proxy).

Buffr can then:

- Show voucher in **beneficiary’s** wallet (account remains beneficiary’s).
- Show “Authorised collector: [Proxy Name]” and allow either beneficiary or proxy to present the voucher (e.g. at agent/USSD); redemption still credits **beneficiary’s** account.

### 5. Redemption and audit

- **Who presents:** At cash-out or merchant, system can record “redeemed by: beneficiary” or “redeemed by: proxy” (e.g. `redemption_method` + `redeemed_by_proxy_id` or similar).
- **Where money goes:** Always to the beneficiary’s Buffr account / beneficiary’s entitlement—never to a separate “proxy account”.
- **Audit:** Store proxy_id (or proxy_id_number) and timestamp when redemption is “by proxy” for compliance and dispute handling.

### 6. Summary

| Step | Implementation |
|------|-----------------|
| **Account owner** | Always beneficiary (no separate proxy account). |
| **Store proxy** | Add proxy fields to `beneficiaries` or table `beneficiary_proxies`. |
| **Proxy = dependant** | Optionally link proxy to a dependant record (see Dependants section below). |
| **Issue voucher** | Unchanged; issue to beneficiary_id; buffr_user_id = beneficiary’s Buffr UUID. |
| **Distribute to Buffr** | Optionally send proxy_name / proxy_id_number / proxy_phone so Buffr can show “collectible by proxy” and accept proxy at collection. |
| **Redemption** | Record “redeemed by proxy” when applicable; funds always credit beneficiary. |
| **Audit** | Log proxy identifier and time when redemption is by proxy. |

---

## Dependants and death-to-dependent redirection (design)

**Principle:** Many proxies **are** dependants (child, spouse, guardian). In case of **death of the beneficiary**, benefits may be redirected to dependant(s) **depending on grant type**. Plan the data model and rules before implementing.

### 1. Dependants (data model, for later)

- **Table `beneficiary_dependants`** (or columns on beneficiary if single dependant):
  - `id` PK, `beneficiary_id` FK → beneficiaries(id)
  - `name`, `id_number`, `phone`, `relationship` (e.g. `child`, `spouse`, `guardian`, `other`)
  - `date_of_birth` (optional, for age-based eligibility)
  - `is_proxy` BOOLEAN — this dependant is also the authorised proxy collector
  - `created_at`, `updated_at`
- **Link to proxy:** If proxy is a dependant, store `proxy_dependant_id` on beneficiary (or match proxy_id_number to dependant id_number) so “proxy” and “dependant” are consistent.

### 2. Death notification / status

- **Beneficiary status:** Add status value `deceased` (or separate `is_deceased` + `deceased_at`).
- **Trigger:** On death notification (e.g. from government, family, or Ketchup admin), set beneficiary to deceased and run **redirect rules** per grant type.
- **Pending vouchers:** Decide policy: cancel, reassign to dependant(s), or complete current cycle then redirect future issuance.

### 3. Redirect rules per grant type (policy – to be defined with product/legal)

| Grant type | Typical redirect (policy to be confirmed) |
|------------|------------------------------------------|
| **Child grant** | Benefits may go to surviving guardian / eligible child (depending on scheme rules). |
| **Old age grant** | Often to surviving spouse or eligible dependant (per national rules). |
| **Disability grant** | May cease or redirect to dependant(s) per scheme. |
| **Other** | Define per grant type; some grants may not redirect. |

Implementation: **configurable rules** (e.g. “on death, child_grant → reassign to dependant where relationship = guardian”) or lookup table `grant_type_death_redirect_rule` (grant_type, eligible_relationship, max_recipients, etc.). Do not hardcode without product/legal sign-off.

### 4. Redirect flow (high level)

1. **Death recorded** → beneficiary status = deceased; no new vouchers issued to that beneficiary.
2. **Evaluate dependants** → among beneficiary’s dependants, determine who is eligible for redirect per grant type (relationship, age, etc.).
3. **Create or reassign** → either (a) create new beneficiary record for the dependant and reassign future grants to them, or (b) mark existing dependant as new “primary” for that grant stream; ensure Buffr/voucher issuance points to the right account.
4. **Audit** → log death date, redirect decision, which dependant(s) received redirect, and any new beneficiary ids.

### 5. What to build first (order)

1. **Dependants model** — store dependants per beneficiary; optionally link proxy to a dependant (`is_proxy` or `proxy_dependant_id`).
2. **Death status** — add deceased status and date; stop issuance to deceased beneficiary.
3. **Redirect rules (config)** — define per grant type who can receive benefits after death; implement eligibility check.
4. **Redirect execution** — reassign future benefits to eligible dependant(s) and audit.

Do not implement redirect logic until dependants and death status are in place and rules are agreed with product/legal.

---

## Components to create (checklist)

Before implementing proxy/dependants/death/redirect, create the following. **Proxy** (columns on beneficiaries) is already implemented; UI and optional “proxy = dependant” link are pending.

### Backend (ketchup-smartpay/backend)

| Component | Purpose | Status / Notes |
|-----------|---------|----------------|
| **Proxy** | Already done: `beneficiaries.proxy_*` columns, types, repository, PATCH/GET. | ✅ Done. Ketchup UI to edit proxy on beneficiary is pending. |
| **Dependants** | | |
| `beneficiary_dependants` table | Migration: id, beneficiary_id, name, id_number, phone, relationship, date_of_birth, is_proxy, created_at, updated_at. | ✅ Done (backend/src/database/migrations/run.ts). |
| DependantRepository / DependantService | CRUD for dependants by beneficiary_id. | ✅ Done (backend/src/services/dependant/). |
| `GET/POST/PATCH/DELETE /api/v1/beneficiaries/:id/dependants` | Ketchup manages dependants per beneficiary. | ✅ Done (backend/src/api/routes/ketchup/beneficiaries.ts). |
| Optional: link proxy to dependant | `beneficiaries.proxy_dependant_id` FK or match proxy_id_number to dependant; when saving proxy, allow picking existing dependant. | To do. |
| **Death** | | |
| Beneficiary status `deceased` | Migration: add status value or `is_deceased` + `deceased_at` on beneficiaries. | ✅ Done (`deceased_at` on beneficiaries; status includes `deceased`). |
| `PATCH /api/v1/beneficiaries/:id` body: `{ status: 'deceased', deceasedAt?: string }` | Ketchup (or admin) records death; backend sets status and optionally triggers redirect flow. | ✅ Done (UpdateBeneficiaryDTO supports status + deceasedAt). |
| Issuance guard | VoucherService / issue: reject issue if beneficiary status is deceased. | ✅ Done (VoucherService.issueVoucher throws if beneficiary.status === 'deceased'). |
| **Redirect rules** | | |
| Table `grant_type_death_redirect_rules` (or config) | grant_type, eligible_relationship[], max_recipients, etc. | To do (after product/legal sign-off). |
| DeathRedirectService (or equivalent) | Given deceased beneficiary, evaluate dependants, apply rules, create/reassign beneficiary and audit. | To do. |
| Optional: `POST /api/v1/beneficiaries/:id/redirect-on-death` | Trigger redirect after death (or run automatically when status set to deceased). | To do. |

### Frontend – Ketchup portal (apps/ketchup-portal/src)

| Component | Purpose | Status / Notes |
|-----------|---------|----------------|
| **Proxy** | | |
| Proxy section on Beneficiary form | Add/Edit beneficiary: fields proxyName, proxyIdNumber, proxyPhone, proxyRelationship (optional “link to dependant” when dependants exist). | To do. |
| Beneficiary detail view | Show “Collectible by: [Proxy Name]” when proxy is set. | To do. |
| **Dependants** | | |
| Dependants list / tab | On Beneficiary detail (or edit): list dependants, add/edit/remove. | ✅ Done (Beneficiaries.tsx View dialog – Dependants section). |
| DependantForm (modal or inline) | Name, id_number, phone, relationship, date_of_birth, “Is proxy collector” checkbox. | ✅ Done (AddDependantForm, EditDependantForm in Beneficiaries.tsx). |
| Optional: “Set as proxy” from dependant row | One-click: copy dependant to proxy fields or set proxy_dependant_id. | To do. |
| **Death** | | |
| “Mark deceased” action | On Beneficiary detail or list: button + confirmation; calls PATCH with status deceased (and optional deceasedAt). | ✅ Done (Mark deceased AlertDialog + updateMutation in Beneficiaries.tsx). |
| Deceased badge / filter | List beneficiaries: show deceased badge; filter “Active / Deceased / All”. | ✅ Done (status filter includes Deceased; table badge shows deceased in red). |
| **Redirect** | | |
| Redirect rules config (optional) | Settings or Admin page: per grant type, configure eligible relationships / max recipients (if configurable). | To do. |
| Redirect wizard or confirmation | After “Mark deceased”: “Redirect benefits to dependant(s)?” – show eligible dependants and chosen redirect; confirm and call redirect API. | To do. |

### Shared types (shared/types, packages/api-client)

| Type | Purpose |
|------|---------|
| `Dependant` | id, beneficiaryId, name, idNumber, phone, relationship, dateOfBirth?, isProxy. |
| `CreateDependantDTO` / `UpdateDependantDTO` | For API payloads. |
| `DeathRedirectResult` (optional) | deceasedBeneficiaryId, redirectBeneficiaryIds[], auditLogId. |
| Redirect rule type (optional) | grantType, eligibleRelationships, maxRecipients. |

---

## How Ketchup manages these operations

Ketchup is the **government/Ketchup operator portal** for beneficiaries, vouchers, distribution, and (future) proxy, dependants, death, and redirect. Below is how Ketchup manages each area.

### 1. Proxy (authorised collector)

- **Where:** **Beneficiaries** → open a beneficiary → **Edit** (or create) → **Proxy section**.
- **Operations:** Enter or clear proxy name, ID number, phone, relationship (family / caregiver / guardian). Optional: “Link to dependant” if dependants exist (dropdown: pick a dependant → fill proxy from dependant).
- **API:** `PATCH /api/v1/beneficiaries/:id` with `proxyName`, `proxyIdNumber`, `proxyPhone`, `proxyRelationship`. GET beneficiary returns proxy fields; Ketchup shows “Collectible by: [Proxy Name]” on detail and in lists if set.
- **Issuance/Distribution:** Unchanged. Vouchers are still issued to `beneficiaryId`. When distributing to Buffr, backend can send proxy fields (already in design) so Buffr shows “Collectible by proxy” and allows proxy to collect. Ketchup does not “issue to proxy”; it only sets proxy on the beneficiary.

### 2. Dependants

- **Where:** **Beneficiaries** → open a beneficiary → **Dependants** tab (or section).
- **Operations:** List dependants; **Add dependant** (name, id_number, phone, relationship, date_of_birth, “Is proxy collector”); **Edit** / **Remove** dependant. Optional: **Set as proxy** from a dependant row (copies to proxy fields or sets proxy_dependant_id).
- **API:** `GET /api/v1/beneficiaries/:id/dependants`, `POST .../dependants`, `PATCH .../dependants/:dependantId`, `DELETE .../dependants/:dependantId`. Ketchup uses these to manage the list; beneficiary detail shows count and names.
- **Issuance:** No change. Issuance stays per beneficiary. Dependants are used for (a) “proxy = dependant” link and (b) death redirect eligibility.

### 3. Death of beneficiary

- **Where:** **Beneficiaries** → open a beneficiary → **Mark deceased** (or Admin → beneficiary → Mark deceased).
- **Operations:** User confirms death; optionally enters date of death. Backend sets beneficiary status to `deceased` (and `deceased_at` if stored). Ketchup shows a confirmation; optionally next step “Redirect benefits to dependant(s)?” (see below).
- **API:** `PATCH /api/v1/beneficiaries/:id` with `status: 'deceased'` and optional `deceasedAt`. Backend stops any future issuance to this beneficiary (guard in VoucherService / issue).
- **Pending vouchers:** Policy to be defined (cancel vs complete cycle vs reassign); Ketchup may show “Pending vouchers: X” and allow cancel or reassign in a later step.

### 4. Redirect (benefits to dependants after death)

- **Where:** Either (a) straight after **Mark deceased** (“Redirect benefits?”) or (b) **Beneficiaries** → deceased beneficiary → **Redirect benefits**.
- **Operations:** Backend (or Ketchup) evaluates dependants and redirect rules per grant type. Ketchup shows eligible dependant(s) and proposed action (e.g. “Create new beneficiary for [Dependant Name] and reassign child grant”). User confirms; backend creates/reassigns beneficiary and records audit. Ketchup shows success and link to new beneficiary if created.
- **API:** Optional `POST /api/v1/beneficiaries/:id/redirect-on-death` with optional body (e.g. chosen dependant ids); or redirect runs automatically when status is set to deceased. Response: redirect result and audit id.
- **Redirect rules config (optional):** **Settings** or **Admin** → **Redirect rules**: per grant type, configure eligible relationships and max recipients (if product allows). Stored in DB or config; used by DeathRedirectService.

### 5. Summary: Ketchup flows

| Operation | Ketchup screen / action | API | Backend behaviour |
|------------|--------------------------|-----|-------------------|
| Set/clear proxy | Beneficiaries → Edit beneficiary → Proxy section | PATCH /beneficiaries/:id | Save proxy_*; GET returns proxy. |
| List/add/edit/remove dependants | Beneficiaries → Beneficiary → Dependants tab | GET/POST/PATCH/DELETE .../dependants | CRUD beneficiary_dependants. |
| Mark deceased | Beneficiaries → Beneficiary → Mark deceased | PATCH /beneficiaries/:id { status: 'deceased' } | Set status; stop issuance to this beneficiary. |
| Redirect on death | After mark deceased or Beneficiary → Redirect benefits | POST .../redirect-on-death (or automatic) | Evaluate rules, create/reassign, audit. |
| Configure redirect rules | Settings / Admin → Redirect rules | GET/PATCH config or CRUD rules table | Used when redirect runs. |
| Issue voucher | Vouchers → Issue (existing) | POST /vouchers | Unchanged; reject if beneficiary deceased. |
| Distribute to Buffr | Distribution (existing) | POST /distribution/disburse | Payload can include proxy (and later dependant) info; no issue to deceased. |

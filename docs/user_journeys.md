# User Journey Maps

This document provides detailed user journey maps for all key personas in the **BUFFR G2P Voucher Platform** (Ketchup SmartPay = G2P engine; BUFFR = beneficiary platform). For production-grade architecture and flows, see [buffr/docs/CONSOLIDATED_PRD.md](../buffr/docs/CONSOLIDATED_PRD.md).

## Table of Contents

1. [Persona Overview](#persona-overview)
2. [Rural Elderly Beneficiary](#rural-elderly-beneficiary)
3. [Urban Working-Age Beneficiary](#urban-working-age-beneficiary)
4. [Disabled Beneficiary](#disabled-beneficiary)
5. [Agent Persona](#agent-persona)
6. [Merchant Persona](#merchant-persona)
7. [Government Stakeholder](#government-stakeholder)
8. [Cross-Cutting Considerations](#cross-cutting-considerations)

---

## Persona Overview

| Persona | Age | Location | Digital Literacy | Primary Channel | Key Need |
|---------|-----|----------|------------------|-----------------|----------|
| Rural Elderly | 70+ | Rural | None | USSD/SMS | Simplicity, trust |
| Urban Working-Age | 25-40 | Urban | High | Mobile App | Speed, convenience |
| Disabled | 30-65 | Mixed | Varied | Voice/IVR | Accessibility |
| Agent | 25-55 | Mixed | Medium | App/Web | Liquidity, earnings |
| Merchant | 30-60 | Urban | Medium | App/QR | Sales, cashback |
| Government | 35-60 | Urban | High | Dashboard | Compliance, visibility |

---

## Rural Elderly Beneficiary

### Profile
- **Name:** Maria Nangolo (representative)
- **Age:** 74
- **Location:** Oshakati Region, rural village
- **Device:** Basic feature phone (Nokia)
- **Grant:** Old Age Grant (N$1,400/month)
- **Literacy:** Basic reading, prefers Oshiwambo
- **Support:** Granddaughter helps occasionally

### Journey Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    MARIA'S GRANT DISBURSEMENT JOURNEY                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DAY 1: Grant Day                                                            │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │ SMS         │──►│ USSD        │──►│ Travel      │──►│ Agent       │     │
│  │ Received    │   │ Balance     │   │ to Agent    │   │ Visit       │     │
│  │ "N$1,400    │   │ Check       │   │ (2km walk)  │   │ (30 min)    │     │
│  │ received"   │   │ *123#       │   │             │   │             │     │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │
│       │                │                   │                  │            │
│       ▼                ▼                   ▼                  ▼            │
│   5 seconds       30 seconds         45 minutes         15 minutes         │
│   (instant)       (simple menu)      (walking)          (waiting +         │
│                                                          transaction)       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: SMS Notification (Trigger: Voucher Issued)                          │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current State:                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ SMS: "Maria, your grant of N$1,400 is ready. Dial *123# for balance  │   │
│  │ or visit your nearest agent. Help: 0800-XXX-XXX"                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Pain Points:                                                                │
│  - SMS in English (needs translation)                                        │
│  - No confirmation of receipt                                                │
│  - Helpline number too long/memor                                            │
│                                                                              │
│  Enhanced State (Best Practice - India UPI):                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ SMS: "Maria, N$1,400 grant received! Balance: N$1,400. Dial *123#    │   │
│  │ for options. Help: 0800-BUFFR" (simpler, local language)             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Action Items:                                                               │
│  ✅ Translate SMS to Oshiwambo, Oshindonga                                   │
│  ✅ Add local language support for all SMS                                   │
│  ✅ Simplify helpline number                                                 │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 2: USSD Balance Check                                                  │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current USSD Menu:                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ *123#                                                                    │   │
│  │   1. Balance                                                          │   │
│  │   2. Mini-Statement                                                   │   │
│  │   3. Cash Out                                                         │   │
│  │   4. Airtime                                                          │   │
│  │   5. Help                                                             │   │
│  │   0. Exit                                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Pain Points:                                                                │
│  - Menu too complex for elderly                                              │
│  - No voice/IVR alternative                                                  │
│  - Session timeout too short (60 seconds)                                    │
│  - No confirmation messages                                                  │
│                                                                              │
│  Enhanced USSD Menu (Best Practice - SASSA):                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ *123#                                                                    │   │
│  │   1. Check Money (Balance)                                            │   │
│  │   2. Take Money (Cash Out)                                            │   │
│  │   3. Hear Balance (Voice in local language)                           │   │
│  │   4. Help (Live agent)                                                │   │
│  │                                                                      │   │
│  │   Session timeout: 120 seconds                                        │   │
│  │   Confirmation: SMS after each transaction                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Action Items:                                                               │
│  ✅ Simplify menu options (4 max)                                            │
│  ✅ Add voice/IVR option for visually impaired                              │
│  ✅ Extend session timeout to 120 seconds                                    │
│  ✅ Add SMS confirmation after each action                                   │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 3: Agent Visit                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current Process:                                                            │
│  1. Arrive at agent location (2km walk)                                      │
│  2. Wait in queue (15-30 minutes)                                            │
│  3. Present ID document                                                      │
│  4. Fingerprint verification (often fails)                                   │
│  5. Receive cash (N$1,400 - N$5 fee = N$1,395)                               │
│  6. SMS confirmation                                                         │
│                                                                              │
│  Pain Points:                                                                │
│  - Long distance to agent                                                    │
│  - Long wait times                                                           │
│  - Fingerprint verification failures (30% of elderly)                        │
│  - No mobile cash-out option                                                 │
│                                                                              │
│  Enhanced Process (Best Practice - Indonesia G2P 4.0):                       │
│  1. Option A: Visit agent (enhanced with:                                    │
│    - Queue management system (SMS when near turn)                            │
│    - Alternative biometric (face recognition)                                │
│    - Mobile agent visit (agent comes to village weekly)                      │
│  2. Option B: Mobile cash-out (new):                                         │
│    - Agent visits village every Tuesday                                      │
│    - Community leader coordinates schedules                                  │
│    - Faster processing with mobile POS                                       │
│                                                                              │
│  Action Items:                                                               │
│  ✅ Implement queue management SMS                                           │
│  ✅ Add face recognition as biometric alternative                            │
│  ✅ Pilot mobile agent visits in rural areas                                 │
│  ✅ Set agent density target (1:500 beneficiaries)                           │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 4: Post-Transaction                                                    │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current:                                                                     │
│  - Receive SMS: "N$1,395 cash out complete. New balance: N$0"                │
│  - No receipt (unless requested)                                             │
│  - No follow-up                                                              │
│                                                                              │
│  Enhanced:                                                                   │
│  - Receive SMS with transaction ID and receipt number                        │
│  - Weekly balance summary SMS                                                │
│  - Monthly statement via SMS (or printed if preferred)                       │
│  - Financial literacy tips via SMS                                           │
│                                                                              │
│  Action Items:                                                               │
│  ✅ Add transaction ID to all SMS                                            │
│  ✅ Implement weekly/monthly balance summaries                               │
│  ✅ Add financial literacy SMS tips                                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Metrics for Rural Elderly

| Metric | Current | Target | Source |
|--------|---------|--------|--------|
| USSD Success Rate | 70% | 95% | System logs |
| Fingerprint Failure Rate | 30% | <5% | Agent reports |
| Distance to Agent | 5km | <2km | GIS analysis |
| Wait Time | 30 min | <15 min | Agent timestamps |
| Digital Adoption | 10% | 40% by Y1 | User analytics |
| NPS Score | N/A | >50 | Quarterly survey |

---

## Urban Working-Age Beneficiary

### Profile
- **Name:** Johannes Mbakupa (representative)
- **Age:** 35
- **Location:** Windhoek, urban area
- **Device:** Smartphone (Samsung)
- **Grant:** Disability Grant (N$1,500/month)
- **Literacy:** High, digitally savvy
- **Banked:** Yes (Standard Bank)

### Journey Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 JOHANNES' DIGITAL GRANT JOURNEY                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DAY 1: Grant Day (Morning Routine)                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │ Push        │──►│ App         │──►│ Bill        │──►│ Groceries   │     │
│  │ Notification│   │ Open        │   │ Payment     │   │ QR Payment  │     │
│  │ Received    │   │ Check       │   │ (N$500)     │   │ (N$400)     │     │
│  │             │   │ Balance     │   │             │   │             │     │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │
│       │                │                   │                  │            │
│       ▼                ▼                   ▼                  ▼            │
│   Instant           10 seconds         30 seconds         15 seconds        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: App Notification & Balance Check                                     │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current Flow:                                                                │
│  1. Push notification: "N$1,500 grant received"                              │
│  2. Open Buffr app                                                            │
│  3. View balance: N$1,500                                                     │
│  4. View recent transactions                                                  │
│                                                                              │
│  Enhanced Flow (Best Practice - India UPI):                                   │
│  1. Push notification with quick actions                                      │
│    - "N$1,500 received! [Pay Bills] [Transfer] [View]"                       │
│  2. Biometric unlock (fingerprint/face)                                       │
│  3. Home screen with:                                                         │
│    - Balance (masked/unmasked)                                                │
│    - Quick actions (customizable)                                             │
│    - Recent transactions                                                      │
│  4. Quick transfer to bank account option                                     │
│                                                                              │
│  Action Items:                                                                │
│  ✅ Add quick action buttons to push notification                             │
│  ✅ Implement biometric authentication                                        │
│  ✅ Add customizable home screen widgets                                      │
│  ✅ Enable instant bank transfer option                                       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 2: Bill Payment                                                         │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current Flow:                                                                │
│  1. Tap "Bill Payments"                                                       │
│  2. Select "Electricity"                                                      │
│  3. Enter customer number                                                     │
│  4. Enter amount (N$500)                                                      │
│  5. Confirm payment                                                           │
│  6. Receive confirmation                                                      │
│                                                                              │
│  Enhanced Flow:                                                               │
│  1. Tap "Pay Bills"                                                           │
│  2. Quick scan of saved billers                                               │
│  3. One-tap payment for frequent bills                                        │
│  4. Bill reminders (due date - 3 days)                                        │
│  5. Auto-pay option for subscriptions                                         │
│                                                                              │
│  Pain Points:                                                                 │
│  - Manual entry of customer number                                            │
│  - No bill reminders                                                          │
│  - Limited biller list                                                        │
│                                                                              │
│  Action Items:                                                                │
│  ✅ Implement saved billers with quick-pay                                    │
│  ✅ Add bill reminder notifications                                            │
│  ✅ Expand biller integration (water, telecom, etc.)                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 3: Merchant QR Payment                                                  │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current Flow:                                                                │
│  1. Tap "Scan QR"                                                             │
│  2. Scan merchant's NAMQR code                                                │
│  3. Enter amount (N$400)                                                      │
│  4. Confirm payment                                                           │
│  5. Show confirmation to merchant                                             │
│                                                                              │
│  Enhanced Flow (Best Practice - China WeChat Pay):                            │
│  1. Tap "Pay" (home screen widget)                                            │
│  2. Camera opens automatically                                                │
│  3. Scan merchant QR (auto-amount if pre-set)                                 │
│  4. Biometric confirm                                                         │
│  5. Success animation + sound                                                 │
│  6. Merchant receives instant notification                                    │
│                                                                              │
│  Action Items:                                                                │
│  ✅ Add home screen payment widget                                            │
│  ✅ Implement auto-amount for frequent merchants                              │
│  ✅ Add success animation and sound                                            │
│  ✅ Enable merchant notification integration                                   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Key Metrics for Urban Beneficiary

| Metric | Current | Target | Source |
|--------|---------|--------|--------|
| App Open Rate | 80% | 95% | Push notifications |
| Bill Payment Adoption | 30% | 70% | Transaction data |
| QR Payment Adoption | 20% | 60% | Transaction data |
| Bank Transfer Rate | 40% | 80% | Transaction data |
| Session Duration | 2 min | 5 min | App analytics |
| NPS Score | N/A | >60 | Quarterly survey |

---

## Disabled Beneficiary

### Profile
- **Name:** Silvia //Kharas (representative)
- **Age:** 45
- **Location:** Keetmanshoop
- **Device:** Feature phone (voice-capable)
- **Grant:** Disability Grant (N$1,500/month)
- **Disability:** Visual impairment
- **Literacy:** Basic reading

### Journey Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│              SILVIA'S ACCESSIBLE GRANT JOURNEY (Visual Impairment)           │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  CORE PRINCIPLE: "Nothing about us without us"                               │
│  Design for accessibility from the start, not as an afterthought             │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 1: Grant Notification                                                   │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current State:                                                               │
│  - SMS notification (text only)                                               │
│  - No screen reader compatibility                                             │
│                                                                              │
│  Enhanced State (Best Practice - UK Government Digital Service):              │
│  - SMS notification with voice call backup                                    │
│  - Voice call within 1 hour: "Silvia, your N$1,500 grant has been received"  │
│  - IVR option: "*123# then say 'balance'"                                    │
│                                                                              │
│  Action Items:                                                                │
│  ✅ Implement voice call backup for accessibility users                       │
│  ✅ Add IVR option (*123#) with voice commands                                │
│  ✅ Ensure SMS is screen reader compatible                                    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 2: Balance Check                                                        │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current State:                                                               │
│  - USSD menu (text-based)                                                     │
│  - No voice output                                                            │
│                                                                              │
│  Enhanced State:                                                              │
│  - IVR System: Call *123#                                                     │
│    - Voice: "Welcome to Buffr. Say 'balance' for balance, 'help' for help"   │
│    - Silvia: "Balance"                                                       │
│    - Voice: "Your balance is N$1,500. Say 'repeat' to hear again"            │
│                                                                              │
│  Action Items:                                                                │
│  ✅ Implement full IVR with voice recognition                                 │
│  ✅ Add voice output for all USSD options                                     │
│  ✅ Train customer service for accessibility support                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STEP 3: Cash Out                                                             │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  Current State:                                                               │
│  - Visit agent in person                                                      │
│  - Fingerprint verification (difficult for some disabilities)                 │
│  - No assistant support                                                       │
│                                                                              │
│  Enhanced State:                                                              │
│  - Priority queue at agent (no waiting)                                       │
│  - Face recognition as biometric alternative                                  │
│  - Option for assisted transaction with trusted person                        │
│  - Home visit option for severe disabilities                                  │
│                                                                              │
│  Action Items:                                                                │
│  ✅ Implement accessibility priority queue                                    │
│  ✅ Add face recognition biometric option                                     │
│  ✅ Enable assisted transaction mode                                          │
│  ✅ Pilot home visit service for severe disabilities                          │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Accessibility Checklist

| Feature | Status | WCAG Level |
|---------|--------|------------|
| Screen reader compatibility | 🔄 Partial | AA |
| Voice/IVR support | 🔄 Planned | AAA |
| High contrast mode | ❌ Missing | AA |
| Large text option | ❌ Missing | AA |
| Voice commands | 🔄 Planned | AAA |
| Keyboard navigation (web) | 🔄 Partial | AA |
| Color blindness support | ❌ Missing | AA |
| Braille support (receipts) | ❌ Missing | AAA |

---

## Agent Persona

### Profile
- **Name:** Robert Uushanga (representative)
- **Age:** 42
- **Location:** Oshakati, operates retail shop + agent services
- **Device:** Smartphone + POS terminal
- **Experience:** 2 years as agent
- **Daily Transactions:** 50-100
- **Float Level:** N$50,000

### Journey Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                   ROBERT'S AGENT DAILY JOURNEY                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MORNING ROUTINE (6:00 AM - 8:00 AM)                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │ Check Float │──►│ View Queue │──►│ Report     │──►│ Open Shop  │     │
│  │ N$50,000    │   │ 5 customers │   │ Yesterday  │   │             │     │
│  │ Status      │   │ booked      │   │ (auto)     │   │             │     │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TRANSACTION FLOW (Each Customer)                                            │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  1. Customer arrives (queue or appointment)                                   │
│  2. Verify customer identity (ID + biometric)                                 │
│  3. Process transaction (cash-in/cash-out)                                    │
│  4. Collect commission (auto-calculated)                                      │
│  5. SMS confirmation to customer                                              │
│  6. Update float balance                                                      │
│                                                                              │
│  Key Pain Points:                                                             │
│  - Float management (running out of cash)                                     │
│  - Biometric verification failures                                            │
│  - Reconciliation errors                                                      │
│  - Fraudulent transactions                                                    │
│                                                                              │
│  Enhanced Process (Best Practice - India AEPS):                               │
│  1. AI predicts daily float needs                                             │
│  2. Auto-reorder float when low                                               │
│  3. Multiple biometric options (fingerprint, face, iris)                      │
│  4. Real-time fraud alerts                                                    │
│  5. Auto-reconciliation at end of day                                          │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  EVENING ROUTINE (6:00 PM - 7:00 PM)                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐     │
│  │ Close Shop │──►│ Reconciliation──►│ Float      │──►│ Performance │     │
│  │             │   │ (auto)      │   │ Top-up     │   │ Review      │     │
│  │             │   │             │   │ (if needed)│   │             │     │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Agent KPIs

| Metric | Current | Target | Source |
|--------|---------|--------|--------|
| Daily Transactions | 50-100 | 100-150 | System logs |
| Float Accuracy | 95% | 99.9% | Reconciliation |
| Transaction Time | 5 min | 2 min | Timestamps |
| Fraud Rate | 0.5% | <0.1% | Security reports |
| Customer Wait Time | 15 min | 5 min | Queue system |
| Commission Earned | N$2,000/mo | N$5,000/mo | Payout reports |
| Agent Churn | 15% | <10% | HR records |

---

## Merchant Persona

### Profile
- **Name:** Maria //Gowases (representative)
- **Age:** 55
- **Location:** Rundu, operates general dealer
- **Device:** Smartphone + NAMQR display
- **Experience:** 1 year as merchant
- **Daily Sales:** N$3,000 - N$5,000
- **QR Payments:** 20% of transactions

### Journey Map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                 MARIA'S MERCHANT QR PAYMENT JOURNEY                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SETUP PHASE (One-time)                                                      │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  1. Apply for NAMQR merchant account                                          │
│  2. Submit business documents                                                 │
│  3. Receive NAMQR code (printed + digital)                                    │
│  4. Set up notification preferences                                           │
│  5. Configure settlement account                                              │
│                                                                              │
│  Pain Points:                                                                 │
│  - Complex application process                                                │
│  - Long setup time (1-2 weeks)                                                │
│  - No onboarding support                                                      │
│                                                                              │
│  Enhanced Process (Best Practice - China Alipay):                             │
│  1. Scan QR code to apply (5 minutes)                                         │
│  2. Instant verification with CIPC                                            │
│  3. Same-day NAMQR code delivery                                              │
│  4. Onboarding call with training                                             │
│  5. Demo terminal provided                                                    │
│                                                                              │
│  Action Items:                                                                │
│  ✅ Implement instant merchant onboarding                                     │
│  ✅ Add video training materials                                               │
│  ✅ Provide demo terminal for training                                        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DAILY OPERATION                                                              │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  1. Customer presents QR code (Buffr app)                                     │
│  2. Maria scans with NAMQR scanner                                            │
│  3. Enter amount (N$50)                                                       │
│  4. Customer approves on app                                                  │
│  5. Success sound + notification                                              │
│  6. Settlement at end of day                                                  │
│                                                                              │
│  Enhanced Process:                                                            │
│  1. Customer presents QR (or Maria scans customer's QR)                       │
│  2. Auto-amount from cart (if itemized)                                       │
│  3. Customer approves (biometric)                                             │
│  4. Instant notification + sound                                              │
│  5. Real-time sales dashboard                                                 │
│                                                                              │
│  Merchant Benefits:                                                           │
│  - Faster checkout (30% faster than cash)                                     │
│  - Lower handling costs (no cash counting)                                    │
│  - Cashback incentives (0.1-0.5%)                                             │
│  - Instant settlement (same-day)                                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Merchant KPIs

| Metric | Current | Target | Source |
|--------|---------|--------|--------|
| QR Payment Adoption | 20% | 60% | Transaction data |
| Average Transaction | N$50 | N$80 | Transaction data |
| Settlement Time | T+1 | T+0 | Settlement reports |
| Cashback Earned | N$200/mo | N$1,000/mo | Incentive reports |
| Customer Feedback | 4.0/5 | 4.5/5 | Review system |
| Fraud Rate | 0.1% | <0.01% | Security reports |

---

## Government Stakeholder

### Profile
- **Name:** Ministry of Finance Official (representative)
- **Department:** Social Benefits Administration
- **Key Responsibilities:**
  - Disbursement oversight
  - Compliance monitoring
  - Fraud prevention
  - Budget management

### Dashboard Journey

```
┌──────────────────────────────────────────────────────────────────────────────┐
│               GOVERNMENT DASHBOARD JOURNEY                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  REAL-TIME OVERVIEW                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Total Beneficiaries: 104,582        Active Today: 12,453           │   │
│  │  Total Disbursed (MTD): N$142.5M    Success Rate: 99.2%             │   │
│  │  Pending: 1,247                      Failed: 102                     │   │
│  │                                                                      │   │
│  │  [Map: Namibia with regional distribution]                          │   │
│  │  [Chart: Daily disbursement trend]                                  │   │
│  │  [Alert: 3 high-priority items]                                    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  KEY USE CASES                                                               │
│  ─────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│  1. Daily Monitoring                                                         │
│     - View disbursement status                                               │
│     - Monitor success/failure rates                                          │
│     - Track regional distribution                                            │
│                                                                              │
│  2. Compliance Reporting                                                     │
│     - PSD compliance score (99%)                                             │
│     - Trust account status (100% covered)                                    │
│     - Incident reports (2 open, 24h SLA)                                     │
│                                                                              │
│  3. Fraud Detection                                                          │
│     - Anomaly alerts (15 today)                                              │
│     - Agent performance (suspicious activity flags)                          │
│     - Beneficiary verification status                                        │
│                                                                              │
│  4. Budget Tracking                                                          │
│     - Monthly allocation vs. actual                                          │
│     - Regional budget distribution                                           │
│     - Forecast vs. actual comparison                                         │
│                                                                              │
│  5. Impact Analytics                                                         │
│     - Digital adoption rate (45%)                                            │
│     - Agent coverage (78% within 5km)                                        │
│     - Financial inclusion metrics                                            │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Government KPIs

| Metric | Current | Target | Source |
|--------|---------|--------|--------|
| Disbursement Success Rate | 99% | 99.9% | System logs |
| PSD Compliance Score | 84% | 100% | Compliance reports |
| Fraud Detection Rate | 70% | 95% | Security reports |
| Regional Coverage | 78% | 95% | GIS analysis |
| Budget Variance | 2% | <1% | Financial reports |
| Report Generation Time | 4 hours | 1 hour | System metrics |

---

## Cross-Cutting Considerations

### Channel Parity Matrix

| Feature | App | USSD | SMS | IVR | Agent |
|---------|-----|------|-----|-----|-------|
| Check Balance | ✅ | ✅ | ❌ | ✅ | ✅ |
| View Transactions | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| Cash Out | ❌ | ⚠️ | ❌ | ❌ | ✅ |
| Bill Payment | ✅ | ⚠️ | ❌ | ❌ | ✅ |
| P2P Transfer | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| QR Payment | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voice Support | ✅ | ✅ | ❌ | ✅ | ✅ |

*Legend: ✅ Available | ⚠️ Partial | ❌ Not Available*

### Accessibility Features by Persona

| Feature | Rural Elderly | Disabled | Low Literacy |
|---------|---------------|----------|--------------|
| Local Language | ✅ Critical | ✅ Important | ✅ Critical |
| Large Text | ✅ | ✅ Critical | ⚠️ |
| Voice/IVR | ✅ Critical | ✅ Critical | ✅ Important |
| Video Tutorials | ❌ | ⚠️ | ✅ Critical |
| Community Support | ✅ Critical | ✅ Important | ✅ Critical |
| Simplified UI | ✅ Critical | ✅ Important | ✅ Critical |

### Offline Support Strategy

| Scenario | App | USSD | Agent |
|----------|-----|------|-------|
| No Internet | Limited (cached) | ✅ Full | ✅ Full |
| No Network | Cached data | ✅ Works | ✅ Works |
| Power Outage | Battery mode | ✅ Works | ✅ Works |

---

## Implementation Priority

| Priority | Feature | Impact | Effort | Timeline |
|----------|---------|--------|--------|----------|
| P0 | USSD Parity | High | High | Q1 2026 |
| P0 | IVR System | High | Medium | Q1 2026 |
| P1 | Local Language SMS | High | Low | Q1 2026 |
| P1 | Accessibility Features | Medium | Medium | Q2 2026 |
| P1 | Agent Mobile App | High | High | Q2 2026 |
| P2 | Offline Support | Medium | High | Q3 2026 |

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Next Review:** March 1, 2026

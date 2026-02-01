# Agent Onboarding Guide

## SmartPay Connect Namibia G2P Voucher Platform

**Version:** 1.0  
**Date:** February 1, 2026  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Agent Types](#agent-types)
3. [Prerequisites](#prerequisites)
4. [Onboarding Process](#onboarding-process)
5. [KYC Requirements](#kyc-requirements)
6. [Training Program](#training-program)
7. [Float Management](#float-management)
8. [Equipment Setup](#equipment-setup)
9. [Go-Live Checklist](#go-live-checklist)
10. [Ongoing Support](#ongoing-support)

---

## Overview

### Purpose

This guide provides a comprehensive onboarding process for new agents joining the SmartPay Connect network.

### Agent Network Goals

| Metric | Target | Timeline |
|--------|--------|----------|
| Total Agents | 500 | Q4 2026 |
| Urban Coverage | 100% | Q2 2026 |
| Rural Coverage | 80% | Q4 2026 |
| Agent NPS | >50 | Q4 2026 |

### Onboarding Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Application | 1-3 days | Submit and verify documents |
| KYC | 3-5 days | Background verification |
| Training | 2 days | Basic certification |
| Setup | 1 day | Equipment and system configuration |
| Go-Live | 1 day | First transactions |

---

## Agent Types

### Cash-Out Agent (Primary)

| Attribute | Value |
|-----------|-------|
| **Role** | Convert vouchers to cash |
| **Commission** | 0.5% (0.75% Advanced) |
| **Target Area** | High-traffic areas, markets |
| **Equipment** | Smartphone + printer (optional) |

**Responsibilities:**
- Process voucher redemptions
- Verify beneficiary identity (face recognition)
- Provide cash to beneficiaries
- Maintain float balance
- Report issues

### Mobile Agent

| Attribute | Value |
|-----------|-------|
| **Role** | Serve rural/remote areas |
| **Commission** | 0.75% (1.0% Specialist) |
| **Target Area** | Rural communities |
| **Equipment** | Smartphone + portable printer + solar charger |

**Responsibilities:**
- Travel to rural areas
- Set up mobile redemption points
- Serve beneficiaries without transport
- Collect feedback
- Report community issues

### Bank Agent (Partner)

| Attribute | Value |
|-----------|-------|
| **Role** | Bank branch operations |
| **Commission** | 0.25% (lower volume, higher trust) |
| **Target Area** | Bank branches |
| **Equipment** | Bank systems integration |

**Responsibilities:**
- Process redemptions at branches
- Handle complex cases
- Support cash conversion
- Cross-sell bank services

### Merchant Agent

| Attribute | Value |
|-----------|-------|
| **Role** | QR code payments |
| **Commission** | MDR rebate (1.5-2%) |
| **Target Area** | Retail locations |
| **Equipment** | QR display + smartphone |

**Responsibilities:**
- Display QR codes
- Process payments
- Handle refunds
- Reconcile daily

---

## Prerequisites

### Business Requirements

| Requirement | Details | Verification |
|-------------|---------|--------------|
| Business Registration | Valid business license | Copy of certificate |
| Bank Account | Business account in agent name | Bank statement |
| Tax Compliance | Tax clearance certificate | Valid TIN |
| Physical Location | Fixed address (urban) | Site visit |

### Personal Requirements

| Requirement | Details | Verification |
|-------------|---------|--------------|
| Age | 18+ years | ID copy |
| Namibian ID | Valid citizenship | ID copy |
| Clean Record | No fraud convictions | Police clearance |
| Financial Standing | No bankruptcies | Credit check |

### Technical Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Smartphone | Android 8.0+, 2GB RAM | Android 10+, 4GB RAM |
| Network | 3G coverage | 4G coverage |
| Camera | 5MP for face recognition | 13MP+ |
| Storage | 500MB free | 2GB free |

---

## Onboarding Process

### Step 1: Online Application

**URL:** https://agents.ketchup.cc/apply

**Form Fields:**

| Field | Required | Validation |
|-------|----------|------------|
| Full Name | Yes | Min 3 characters |
| Phone Number | Yes | Valid NAM number |
| Email | Yes | Valid email |
| ID Number | Yes | 13-digit format |
| Business Name | Yes | Min 3 characters |
| Region | Yes | Dropdown selection |
| Settlement Type | Yes | Fixed/Mobile/Merchant |
| Intended Area | Yes | Specific location |
| KYC Documents | Yes | PDF upload (max 10MB) |

**Application Flow:**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONLINE APPLICATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. LANDING PAGE                                                │
│     ↓                                                           │
│  2. ELIGIBILITY CHECK                                           │
│     - Age 18+?                                                  │
│     - Valid ID?                                                 │
│     - Business registered?                                      │
│     ↓                                                           │
│  3. ACCOUNT CREATION                                            │
│     - Phone number verification (OTP)                           │
│     - Email verification                                        │
│     ↓                                                           │
│  4. APPLICATION FORM                                            │
│     - Personal details                                          │
│     - Business details                                          │
│     - Service type selection                                    │
│     ↓                                                           │
│  5. DOCUMENT UPLOAD                                             │
│     - ID copy                                                   │
│     - Business license                                          │
│     - Bank statement                                            │
│     - Tax clearance                                             │
│     ↓                                                           │
│  6. SUBMISSION                                                  │
│     - Review application                                        │
│     - Submit                                                    │
│     ↓                                                           │
│  7. CONFIRMATION                                                │
│     - Application ID                                            │
│     - Expected timeline                                         │
│     - Next steps                                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Step 2: KYC Verification

**Timeline:** 3-5 business days

**Verification Steps:**

| Step | Description | Time |
|------|-------------|------|
| Document Verification | Review uploaded documents | 24 hours |
| ID Verification | Validate ID number, check duplicates | 24 hours |
| Background Check | Police clearance, credit check | 48 hours |
| Site Visit | For fixed locations | 24 hours |
| Approval | KYC team review | 24 hours |

**Automated Checks:**

| Check | Method | Failure Action |
|-------|--------|----------------|
| ID Validity | Immigration database | Auto-reject |
| Duplicate Agent | Existing agent database | Manual review |
| Fraud History | Blacklist check | Auto-reject |
| Business Validity | Business registry | Manual review |

**KYC Status Notifications:**

| Status | SMS | Email | Description |
|--------|-----|-------|-------------|
| Submitted | ✅ | ✅ | Application received |
| Documents Verified | ✅ | ✅ | Documents valid |
| Pending Review | - | ✅ | Under manual review |
| Approved | ✅ | ✅ | KYC complete |
| Rejected | ✅ | ✅ | With reason |

### Step 3: Training

**Format:** Hybrid (online + in-person)

**Day 1: Online Training**

| Time | Module | Duration | Format |
|------|--------|----------|--------|
| 09:00 | Platform Overview | 30 min | Video |
| 09:30 | Agent Role & Responsibilities | 30 min | Video |
| 10:00 | Transaction Processing | 60 min | Video + Quiz |
| 11:00 | Face Recognition | 30 min | Video |
| 11:30 | Security & Fraud Prevention | 45 min | Video + Quiz |
| 12:15 | Break | 45 min | - |
| 13:00 | Compliance & Reporting | 45 min | Video |
| 13:45 | Customer Service | 30 min | Video |
| 14:15 | USSD Operations | 45 min | Hands-on |
| 15:00 | App Operations | 60 min | Hands-on |
| 16:00 | Quiz & Assessment | 30 min | Assessment |

**Day 2: In-Person Training**

| Time | Activity | Duration | Location |
|------|----------|----------|----------|
| 09:00 | Welcome & Introduction | 30 min | Training Center |
| 09:30 | Face Recognition Practice | 60 min | Training Center |
| 10:30 | Mock Transactions | 90 min | Training Center |
| 12:00 | Lunch | 60 min | - |
| 13:00 | Troubleshooting Scenarios | 60 min | Training Center |
| 14:00 | Q&A Session | 30 min | Training Center |
| 14:30 | Equipment Setup | 60 min | Training Center |
| 15:30 | Certification Quiz | 30 min | Training Center |
| 16:00 | Certificate Ceremony | 30 min | Training Center |

**Certification Requirements:**

| Requirement | Passing Score |
|-------------|---------------|
| Knowledge Quiz | 80% (32/40) |
| Practical Assessment | 100% (no critical errors) |
| Attendance | 100% (both days) |

### Step 4: Float Allocation

**Initial Float Amount:**

| Agent Type | Minimum | Recommended | Maximum |
|------------|---------|-------------|---------|
| Cash-Out | N$5,000 | N$10,000 | N$50,000 |
| Mobile | N$10,000 | N$20,000 | N$100,000 |
| Merchant | N$2,000 | N$5,000 | N$25,000 |

**Float Replenishment:**

| Method | Description | Timeline |
|--------|-------------|----------|
| Bank Transfer | Direct bank deposit | T+1 |
| Mobile Money | MTC/AirtimeTopUp | Instant |
| Agent Portal | Online float purchase | Instant |
| USSD | *132* | Instant |

**Float Monitoring:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Balance | <20% of allocated | Warning notification |
| Balance | <10% of allocated | Auto-reorder prompt |
| Daily Usage | >150% of average | Fraud alert |

### Step 5: Equipment Setup

**For Cash-Out Agents:**

| Equipment | Provided By | Cost |
|-----------|-------------|------|
| Smartphone (optional) | Agent | - |
| SIM Card | SmartPay | Free |
| Agent Badge | SmartPay | N$50 |
| Receipt Printer (optional) | Agent | ~N$2,000 |
| Signage | SmartPay | Free |

**For Mobile Agents:**

| Equipment | Provided By | Cost |
|-----------|-------------|------|
| Smartphone | SmartPay (loan) | N$0 (refundable deposit N$500) |
| Solar Charger | SmartPay (loan) | N$0 (refundable deposit N$300) |
| Portable Printer | SmartPay (loan) | N$0 (refundable deposit N$500) |
| SIM Card | SmartPay | Free |
| Agent Badge | SmartPay | N$50 |
| Carrying Case | SmartPay | Free |

**App Installation:**

```bash
# Download from Google Play Store
# Search: "SmartPay Agent"

# Or download APK directly
# https://agents.ketchup.cc/download/agent.apk
```

**Initial App Setup:**

1. Launch app
2. Enter phone number (SMS verification)
3. Enter agent ID (from approval email)
4. Set 4-digit PIN
5. Enable camera permissions
6. Enable location permissions
7. Complete face enrollment
8. Test transaction (N$1.00)

### Step 6: Go-Live

**Pre-Launch Checklist:**

| Check | Description | Status |
|-------|-------------|--------|
| KYC Status | Approved | ☐ |
| Training Complete | Certificate issued | ☐ |
| App Installed | Latest version | ☐ |
| Face Enrolled | Biometric verification passed | ☐ |
| Float Loaded | Balance > minimum | ☐ |
| Test Transaction | Successful N$1.00 test | ☐ |
| Support Added | WhatsApp group joined | ☐ |
| Signage Placed | Visible to customers | ☐ |

**Go-Live Day:**

| Time | Activity | Owner |
|------|----------|-------|
| 08:00 | Final system check | Agent |
| 09:00 | First transaction | Agent |
| 10:00 | Submit go-live confirmation | Agent |
| 10:30 | Welcome call from regional manager | Regional Manager |
| 12:00 | First day report | Agent |

**First Week Support:**

| Day | Support Type | Description |
|-----|--------------|-------------|
| 1 | Check-in Call | Morning + evening calls |
| 2 | Reduced Support | Hourly check-ins |
| 3 | Normal Support | As-needed |
| 4-7 | Standard Support | Regular channels |

---

## KYC Requirements

### Document Checklist

| Document | Format | Size Limit | Expiry |
|----------|--------|------------|--------|
| National ID | PDF/JPG | 5MB | Valid |
| Passport Photo | JPG | 2MB | Recent (6mo) |
| Business Registration | PDF | 5MB | Valid |
| Tax Clearance | PDF | 5MB | <6 months |
| Bank Statement | PDF | 5MB | <3 months |
| Proof of Address | PDF/JPG | 5MB | <3 months |
| Police Clearance | PDF | 5MB | <6 months |

### ID Verification Process

```
┌─────────────────────────────────────────────────────────────────┐
│                      ID VERIFICATION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. UPLOAD                                                      │
│     Capture or upload ID document                               │
│     ↓                                                           │
│  2. OCR EXTRACTION                                              │
│     Extract: Name, ID number, DOB, expiry                       │
│     ↓                                                           │
│  3. VALIDATION                                                  │
│     - Check expiry date                                         │
│     - Verify checksum digit                                     │
│     - Match against immigration DB                              │
│     ↓                                                           │
│  4. FACE MATCHING                                               │
│     - Capture live selfie                                       │
│     - Compare with ID photo                                     │
│     - Confidence score >85% required                            │
│     ↓                                                           │
│  5. RESULT                                                      │
│     - Pass: Continue to background check                        │
│     - Fail: Manual review or rejection                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Background Check

| Check | Provider | Timeline | Failure Action |
|-------|----------|----------|----------------|
| Police Record | NamPolice | 24 hours | Auto-reject |
| Credit Score | Credit Bureau | 24 hours | Manual review |
| Fraud Database | Internal | Instant | Auto-reject |
| Duplicate Check | Internal | Instant | Manual review |

---

## Training Program

### Training Curriculum

**Module 1: Platform Introduction (30 min)**

| Topic | Content |
|-------|---------|
| What is SmartPay Connect? | Mission, vision, impact |
| How it works | 4-party model overview |
| Agent role | Key responsibilities |
| Benefits | Commission structure |

**Module 2: Transaction Processing (60 min)**

| Topic | Content |
|-------|---------|
| Voucher types | Single, bulk, timed |
| Redemption process | Step-by-step flow |
| Face recognition | How it works, fallbacks |
| Error handling | Common issues, solutions |

**Module 3: Security (45 min)**

| Topic | Content |
|-------|---------|
| Fraud types | Common scams, prevention |
| Verification | ID checks, face match |
| Suspicious activity | Reporting procedures |
| PIN security | Protection, changes |

**Module 4: Compliance (45 min)**

| Topic | Content |
|-------|---------|
| PSD requirements | Key regulations |
| Reporting | Transaction logs, suspicious activity |
| Data privacy | Beneficiary data protection |
| Audit trail | Record keeping |

**Module 5: Customer Service (30 min)**

| Topic | Content |
|-------|---------|
| Communication | Clear, respectful |
| Accessibility | Serving disabled beneficiaries |
| Complaints | Handling, escalation |
| Feedback | Collection methods |

### Training Resources

| Resource | Format | Location |
|----------|--------|----------|
| Video Tutorials | MP4 | In-app, YouTube |
| Quick Reference | PDF | In-app downloads |
| FAQ | Web | agents.ketchup.cc/faq |
| WhatsApp Support | Chat | Regional group |

### Assessment

**Quiz Structure:**

| Section | Questions | Time |
|---------|-----------|------|
| Knowledge | 30 | 20 min |
| Scenarios | 10 | 15 min |
| Practical | 5 | 20 min |
| **Total** | **45** | **55 min** |

**Passing Score:** 80%

**Retake Policy:**
- 2 attempts per day
- 3-day waiting period between attempts
- Manual review after 3 failed attempts

---

## Float Management

### Float Tiers

| Tier | Monthly Volume | Float Limit | Commission |
|------|----------------|-------------|------------|
| Bronze | <100 txns | N$10,000 | 0.5% |
| Silver | 100-500 txns | N$25,000 | 0.6% |
| Gold | 500-1,000 txns | N$50,000 | 0.75% |
| Platinum | >1,000 txns | N$100,000 | 1.0% |

### Float Monitoring Dashboard

```
┌──────────────────────────────────────────────────────────────┐
│                    AGENT FLOAT DASHBOARD                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Current Balance: N$12,500                                   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 62.5%                     │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Daily Usage (Last 7 Days)                           │    │
│  │                                                     │    │
│  │  Mon ████████░░░░░░░░░░░░░░░░░░░░░░░░  N$8,500    │    │
│  │  Tue █████████░░░░░░░░░░░░░░░░░░░░░░░  N$9,000    │    │
│  │  Wed ██████░░░░░░░░░░░░░░░░░░░░░░░░░░  N$6,500    │    │
│  │  Thu ████████████░░░░░░░░░░░░░░░░░░░░  N$12,000   │    │
│  │  Fri █████████░░░░░░░░░░░░░░░░░░░░░░░  N$9,500    │    │
│  │  Sat ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  N$4,500    │    │
│  │  Sun ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  N$2,500    │    │
│  │                                                     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Status: HEALTHY                                             │
│  Last Replenishment: Today 08:30                             │
│  Next Reorder: Not needed (62% remaining)                    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Float Alerts

| Alert Type | Threshold | Action |
|------------|-----------|--------|
| Low Balance | <20% | SMS notification |
| Critical | <10% | SMS + call |
| Depleted | 0% | Auto-suspend, call |
| Over-limit | >100% | Review + potential suspension |

---

## Equipment Setup

### Smartphone Requirements

**Minimum Specifications:**

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Android 8.0 | Android 10+ |
| RAM | 2GB | 4GB+ |
| Storage | 16GB | 64GB+ |
| Camera | 5MP | 13MP+ |
| Battery | 3,000mAh | 4,000mAh+ |
| Network | 3G | 4G/LTE |

**Recommended Models:**

| Price Range | Models |
|-------------|--------|
| Budget (<N$3,000) | Nokia 5.4, Samsung A02s |
| Mid (<N$6,000) | Samsung A12, Xiaomi Redmi 9 |
| Premium (<N$10,000) | Samsung A32, Xiaomi Redmi Note 10 |

### App Permissions

| Permission | Purpose | Required |
|------------|---------|----------|
| Camera | Face recognition, document scan | Yes |
| Location | Fraud detection, reporting | Yes |
| Storage | Receipts, documents | Yes |
| Contacts | Support callbacks | No |
| SMS | OTP verification | Yes |

### Network Requirements

| Requirement | Specification |
|-------------|---------------|
| Minimum Signal | 3G (-100dBm) |
| Recommended | 4G (-80dBm) |
| USSD Support | Required |
| Offline Mode | Available (limited) |

---

## Go-Live Checklist

### Pre-Launch (Day Before)

| Item | Status | Owner |
|------|--------|-------|
| App installed and updated | ☐ | Agent |
| PIN set and tested | ☐ | Agent |
| Face enrollment completed | ☐ | Agent |
| Float loaded and verified | ☐ | Agent |
| Test transaction successful | ☐ | Agent |
| Support contacts added | ☐ | Agent |
| Signage ready | ☐ | Agent |
| Operating hours set | ☐ | Agent |

### Launch Day

| Time | Item | Status |
|------|------|--------|
| 08:00 | System check | ☐ |
| 09:00 | First transaction | ☐ |
| 10:00 | Go-live confirmation sent | ☐ |
| 12:00 | Midday balance check | ☐ |
| 17:00 | End-of-day report | ☐ |

### First Week

| Day | Item | Status |
|-----|------|--------|
| 1 | Check-in call completed | ☐ |
| 3 | First daily report submitted | ☐ |
| 7 | First weekly summary | ☐ |

---

## Ongoing Support

### Support Channels

| Channel | Availability | Response Time |
|---------|--------------|---------------|
| WhatsApp Group | 24/7 | <5 min |
| Phone Helpline | 08:00-20:00 | <2 min |
| Email | 24/7 | <4 hours |
| In-App Chat | 24/7 | <10 min |

### Agent Support Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                 AGENT SUPPORT HIERARCHY                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 1: Self-Service                                      │
│  - FAQ (agents.ketchup.cc/faq)                              │
│  - Video tutorials                                          │
│  - Troubleshooting guides                                   │
│                                                             │
│  Level 2: Peer Support                                      │
│  - WhatsApp group                                           │
│  - Regional agent network                                   │
│                                                             │
│  Level 3: Regional Manager                                  │
│  - Phone support                                            │
│  - Site visits                                              │
│  - Escalation management                                    │
│                                                             │
│  Level 4: Central Support                                   │
│  - Technical issues                                         │
│  - Complex cases                                            │
│  - Compliance questions                                     │
│                                                             │
│  Level 5: Senior Management                                 │
│  - Serious complaints                                      │
│  - Contract issues                                          │
│  - Fraud cases                                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Performance Monitoring

| Metric | Target | Frequency |
|--------|--------|-----------|
| Transaction Success Rate | >99% | Real-time |
| Average Transaction Time | <2 min | Daily |
| Customer Complaints | <2/week | Weekly |
| Float Efficiency | >90% | Monthly |
| Certification Renewal | 100% | Annual |

### Agent Recognition

| Achievement | Reward |
|-------------|--------|
| 3-month perfect record | Bronze Badge |
| 6-month perfect record | Silver Badge |
| Top 10% monthly volume | Cash bonus (N$500) |
| 1,000 successful transactions | Certificate |
| Best customer ratings | Featured on website |

---

## Agent Portal

### Portal Features

| Feature | Description | Access |
|---------|-------------|--------|
| Dashboard | Overview, stats, alerts | All |
| Transactions | Search, filter, export | All |
| Float Management | View balance, reorder | All |
| Reports | Daily, weekly, monthly | All |
| Training | Courses, certifications | All |
| Support | Tickets, chat | All |
| Settings | Profile, preferences | All |

### Agent Portal URL

```
https://agents.ketchup.cc
```

### Mobile App

```
App Name: SmartPay Agent
Platform: Android (Google Play Store)
Version: 1.0.0+
Size: 45MB
```

---

**Document Version:** 1.0  
**Last Updated:** February 1, 2026  
**Next Review:** March 1, 2026  
**Owner:** Agent Operations Team

**Contact:** agents@ketchup.cc

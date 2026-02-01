# Buffr - Namibia Instant Payment Project (IPP) Alignment

**Date:** January 26, 2026  
**Status:** ✅ Architecture Aligned - IPS Integration Pending API Credentials  
**Critical Deadline:** February 26, 2026 (PSDIR-11 Compliance)

---

## Overview

Buffr is designed to be fully compatible with the **Bank of Namibia's Instant Payment Project (IPP)**, which launched in April 2024. The IPP uses India's Unified Payment Interface (UPI) technology, adapted for Namibia, and is now operational.

**Current Status:**
- ✅ **Architecture:** Fully aligned with IPP requirements
- ✅ **NAMQR Codes:** v5.0 compliant implementation complete
- ✅ **Service Structure:** IPS service file created (`services/ipsService.ts`)
- ⚠️ **API Integration:** Service ready, awaiting Bank of Namibia API credentials
- ⚠️ **Deadline:** February 26, 2026 (PSDIR-11 compliance requirement)

## Key Partnerships

| Partner | Role |
|---------|------|
| **Bank of Namibia** | Regulator & Project Owner |
| **NPCI International** | Technology Provider (UPI Stack) |
| **Namclear** | Automated Clearing House (ACH) Operator |
| **PwC** | Programme Manager |
| **Payment Association of Namibia (PAN)** | Industry Governance |

## Technology Stack

The IPP uses India's **Unified Payment Interface (UPI)** technology, adapted for Namibia:

- Real-time payment settlement (24/7/365)
- Multi-channel access (smartphones, feature phones, USSD)
- QR code payments (NAMQR v5.0)
- Interoperable across all banks and payment providers

## Buffr Alignment

### 1. Payment Aliases

| Type | Format | Example |
|------|--------|---------|
| **Buffr ID** | `username@bfr` | `george@bfr` |
| **IPP Phone Alias** | `+264XXXXXXXXX@buffr` | `+26481476206@buffr` |
| **IPP Wallet Alias** | `walletId@buffr.wallet` | `wallet-123@buffr.wallet` |

### 2. NAMQR Code Standards v5.0

Buffr implements NAMQR codes using:

- **Tag-Length-Value (TLV)** encoding
- **EMVCo Merchant QR Specification** compliance
- **CRC-16 CCITT** checksum validation

Key NAMQR Data Elements:

| Tag | Description | Buffr Field |
|-----|-------------|-------------|
| 00 | Payload Format Indicator | `01` |
| 01 | Point of Initiation Method | `11` (static) or `12` (dynamic) |
| 26-51 | Merchant Account Information | IPP Alias |
| 52 | Merchant Category Code | `0000` |
| 53 | Transaction Currency | `516` (NAD) |
| 54 | Transaction Amount | Dynamic |
| 58 | Country Code | `NA` |
| 59 | Merchant Name | User's name |
| 60 | Merchant City | User's city |
| 63 | CRC | Calculated |

### 3. Interoperability Requirements

Buffr supports:

- ✅ Bank-to-wallet transfers
- ✅ Wallet-to-bank transfers  
- ✅ Wallet-to-wallet (cross-provider)
- ✅ QR code payments
- ✅ Feature phone (USSD) access
- ✅ Real-time settlement

### 4. Strategic Objectives Alignment

| IPP Objective | Buffr Implementation |
|--------------|---------------------|
| Financial Inclusion | Low-cost P2P payments, no minimum balance |
| Rural Access | USSD support, offline capability |
| Interoperability | Open APIs, NAMQR compliance |
| Security | End-to-end encryption, biometric auth |
| Affordability | Zero fees for P2P under N$1,000 |

## Implementation Roadmap

### Phase 1: Foundation ✅ **COMPLETE**
- [x] Buffr ID system
- [x] NAMQR code generation (v5.0 compliant)
- [x] Basic P2P transfers
- [x] Wallet management
- [x] Payment aliases (Buffr ID, phone alias, wallet alias)
- [x] QR code payments

### Phase 2: IPS Integration ⚠️ **IN PROGRESS** (Deadline: February 26, 2026)
- [x] IPS service structure created (`services/ipsService.ts`)
- [x] API endpoint design complete
- [x] Architecture aligned with IPP requirements
- [x] Wallet-to-wallet transfer endpoint (uses IPS service)
- [x] Wallet-to-bank transfer endpoint (uses IPS service)
- [x] Audit logging and monitoring implemented
- [ ] ⚠️ **Bank of Namibia API credentials** (CRITICAL - pending)
- [ ] ⚠️ **IPS API connection** (pending credentials)
- [ ] ⚠️ **Real-time settlement testing** (pending API access)
- [ ] ⚠️ **Cross-bank interoperability testing** (pending API access)

**Status:** Service structure ready, awaiting API credentials from Bank of Namibia

**Critical Actions Required:**
1. ⚠️ Contact Bank of Namibia for IPS API access (URGENT - deadline approaching)
2. ⚠️ Configure IPS environment variables (IPS_API_URL, IPS_API_KEY, IPS_PARTICIPANT_ID)
3. ⚠️ Test IPS connection and integration
4. ⚠️ Deploy before February 26, 2026 deadline

### Phase 3: Full Launch ⏳ **PLANNED** (Q2 2026)
- [x] Feature phone support (USSD service structure ready)
- [x] Merchant payments (QR codes implemented)
- [x] Bill payments (implemented)
- [ ] ⚠️ USSD channel (service ready, operator access pending)
- [ ] Cross-border (SADC region) - Future enhancement

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BUFFR APP                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Mobile   │  │   USSD   │  │   Web    │  │   API    │        │
│  │   App    │  │ Channel  │  │  Portal  │  │ Partners │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
│       └─────────────┴─────────────┴─────────────┘               │
│                           │                                      │
│                    ┌──────┴──────┐                              │
│                    │  Buffr API  │                              │
│                    │   Gateway   │                              │
│                    └──────┬──────┘                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    NAMCLEAR / IPP                                │
│       ┌──────────────────┴──────────────────┐                   │
│       │        Instant Payment Switch        │                   │
│       │         (NPCI UPI Stack)             │                   │
│       └──────────────────┬──────────────────┘                   │
│                          │                                       │
│    ┌─────────┬───────────┼───────────┬─────────┐               │
│    │         │           │           │         │               │
│    ▼         ▼           ▼           ▼         ▼               │
│ ┌─────┐  ┌─────┐    ┌─────┐    ┌─────┐  ┌─────┐              │
│ │ FNB │  │ BW  │    │ NED │    │STAN │  │Other│              │
│ │     │  │     │    │     │    │     │  │PSPs │              │
│ └─────┘  └─────┘    └─────┘    └─────┘  └─────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## Regulatory Compliance

Buffr adheres to:

1. **Payment System Management Act, 2003**
2. **Payment System Management Amendment Act, 2010**
3. **Financial Intelligence Act, 2012**
4. **Bank of Namibia PSD-9** (Electronic Funds Transfer)
5. **Bank of Namibia PSDIR-11** (IPS Interoperability) ⚠️ **Deadline: February 26, 2026**
6. **Bank of Namibia PSD-12** (Security Requirements) ✅ Implemented
7. **NAMQR Code Standards v5.0** ✅ Implemented
8. **ISO 20022** messaging standards (ready for IPS integration)

**Compliance Status:**
- ✅ PSD-12: Data encryption, 2FA, audit trails - **Fully Compliant**
- ✅ NAMQR v5.0: QR code generation and scanning - **Fully Compliant**
- ⚠️ PSDIR-11: IPS integration - **Service Ready, API Credentials Pending**

## Current Implementation Status

### ✅ Completed Components

**Foundation (Phase 1):**
- ✅ Buffr ID system (`username@bfr`)
- ✅ NAMQR code generation (v5.0 compliant)
- ✅ Payment aliases (phone, wallet)
- ✅ QR code payments
- ✅ Wallet-to-wallet transfers
- ✅ Wallet-to-bank transfers

**IPS Service Structure (Phase 2):**
- ✅ Service file: `services/ipsService.ts`
- ✅ Transfer methods implemented
- ✅ Retry logic with exponential backoff
- ✅ Audit logging integrated
- ✅ Health check endpoints
- ✅ Error handling and monitoring

**Integration Points:**
- ✅ `app/api/payments/wallet-to-wallet/route.ts` - Uses IPS service
- ✅ `app/api/payments/bank-transfer.ts` - Uses IPS service

### ⚠️ Pending Components

**IPS API Integration:**
- ⚠️ Bank of Namibia API credentials (URGENT)
- ⚠️ IPS_API_URL configuration
- ⚠️ IPS_API_KEY configuration
- ⚠️ IPS_PARTICIPANT_ID configuration
- ⚠️ API endpoint documentation
- ⚠️ Connection testing
- ⚠️ Real-time settlement testing

**USSD Channel:**
- ⚠️ Mobile operator API access (MTC, Telecom Namibia)
- ⚠️ USSD menu integration
- ⚠️ Feature phone transaction processing

---

## Environment Variables Required

**IPS Integration:**
```bash
IPS_API_URL=https://ips.namclear.com.na/api  # Example (needs actual URL)
IPS_API_KEY=your-api-key-here                # From Bank of Namibia
IPS_PARTICIPANT_ID=BUFFR001                   # Participant ID from Bank of Namibia
```

**USSD Gateway:**
```bash
USSD_GATEWAY_URL=https://ussd.mtc.com.na/api  # Example (needs actual URL)
USSD_API_KEY=your-ussd-api-key                # From mobile operator
USSD_SHORT_CODE=*123#                          # Buffr USSD short code
```

---

## Critical Actions Required

### Immediate (Before February 26, 2026)

1. **Contact Bank of Namibia for IPS API Access** ⚠️ **URGENT**
   - Request API credentials (API URL, API key, Participant ID)
   - Request API endpoint documentation
   - Request testing environment access
   - **Deadline:** February 26, 2026 (PSDIR-11 compliance)

2. **Configure IPS Environment Variables**
   - Set `IPS_API_URL` in production environment
   - Set `IPS_API_KEY` in production environment
   - Set `IPS_PARTICIPANT_ID` in production environment

3. **Test IPS Integration**
   - Test wallet-to-wallet transfers via IPS
   - Test wallet-to-bank transfers via IPS
   - Verify real-time settlement
   - Test error handling and retry logic

### Short-term (Q1 2026)

4. **Contact Mobile Operators for USSD Gateway**
   - MTC Namibia
   - Telecom Namibia
   - Request USSD gateway API access
   - Configure USSD short code

5. **Complete USSD Integration**
   - Implement USSD menu processing
   - Test feature phone transactions
   - Deploy USSD channel

---

## Related Documentation

- **PRD Compliance:** `PRD_COMPLIANCE_COMPLETE.md` - IPS integration status (FR2.6)
- **Implementation Status:** `IMPLEMENTATION_STATUS_COMPLETE.md` - Overall system status
- **Open Banking:** `OPEN_BANKING_COMPLETE_GUIDE.md` - API standards alignment

---

## Contact

For IPP integration questions:
- **Bank of Namibia**: https://www.bon.com.na
- **Payment Association of Namibia**: https://pan.org.na
- **Namclear**: https://www.namclear.com.na

**For IPS API Access:**
- Contact Bank of Namibia Payment Systems Department
- Reference: PSDIR-11 compliance requirement
- Deadline: February 26, 2026

---

**Last Updated:** January 26, 2026  
**Document Version:** 2.0  
**Status:** ✅ Architecture Aligned - IPS Integration Pending API Credentials

# 🎨 Buffr Frontend Architecture Plan
## Complete Frontend Mapping & Implementation Roadmap

**Version:** 1.0  
**Date:** January 26, 2026  
**Based on:** PRD_BUFFR_G2P_VOUCHER_PLATFORM.md v2.9  
**Framework:** React Native + Expo Router + TypeScript

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Navigation Structure](#navigation-structure)
3. [Screen Inventory & Status](#screen-inventory--status)
4. [Component Library](#component-library)
5. [Feature Mapping (PRD → Frontend)](#feature-mapping-prd--frontend)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Design System Integration](#design-system-integration)
8. [State Management](#state-management)
9. [API Integration](#api-integration)
10. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### Tech Stack
- **Framework:** React Native (Expo SDK 54)
- **Routing:** Expo Router (file-based routing)
- **Language:** TypeScript
- **State Management:** React Context API + React Query
- **Styling:** StyleSheet API + Design System Tokens
- **UI Components:** Custom components following Buffr Design System
- **Icons:** FontAwesome + Expo Vector Icons
- **Animations:** React Native Reanimated

### Architecture Principles
1. **File-Based Routing:** Expo Router convention
2. **Component Modularity:** Reusable components in `/components`
3. **Design System First:** All UI follows `DesignSystem.ts` tokens
4. **Type Safety:** Full TypeScript coverage
5. **Context-Based State:** User, Wallets, Cards, Transactions contexts
6. **API Abstraction:** Centralized API client in `/utils/apiClient.ts`

---

## Navigation Structure

### Root Navigation (`app/_layout.tsx`)
```
Root Stack
├── index.tsx (Welcome/Entry)
├── (tabs)/ (Main App - Tab Navigation)
│   ├── index.tsx (Home)
│   └── transactions.tsx (Transactions)
├── onboarding/ (Onboarding Flow)
│   ├── index.tsx
│   ├── phone.tsx
│   ├── otp.tsx
│   ├── name.tsx
│   ├── photo.tsx
│   ├── faceid.tsx
│   └── complete.tsx
└── [Feature Screens] (Stack Navigation)
```

### Tab Navigation (`app/(tabs)/_layout.tsx`)
```
Bottom Tabs:
1. Home (index.tsx) - Main dashboard
2. Transactions (transactions.tsx) - Transaction history
```

### Feature Navigation (Stack Screens)
- **Vouchers:** `/utilities/vouchers/*`
- **Send Money:** `/send-money/*`
- **Request Money:** `/request-money/*`
- **Wallets:** `/wallets/[id]/*`
- **Cards:** `/cards/*`
- **Profile:** `/profile/*`
- **Settings:** `/settings/*`
- **Admin:** `/admin/*`

---

## Screen Inventory & Status

### ✅ Implemented Screens

#### Core Navigation
- [x] `app/index.tsx` - Welcome/Entry screen
- [x] `app/(tabs)/index.tsx` - Home screen
- [x] `app/(tabs)/transactions.tsx` - Transactions list
- [x] `app/_layout.tsx` - Root layout
- [x] `app/(tabs)/_layout.tsx` - Tab layout

#### Onboarding
- [x] `app/onboarding/index.tsx` - Welcome
- [x] `app/onboarding/phone.tsx` - Phone number entry
- [x] `app/onboarding/otp.tsx` - OTP verification
- [x] `app/onboarding/name.tsx` - Name entry
- [x] `app/onboarding/photo.tsx` - Photo upload
- [x] `app/onboarding/faceid.tsx` - Biometric setup
- [x] `app/onboarding/complete.tsx` - Completion

#### Vouchers (G2P Core Feature)
- [x] `app/utilities/vouchers.tsx` - Voucher list
- [x] `app/utilities/vouchers/[id].tsx` - Voucher details
- [x] `app/utilities/vouchers/history.tsx` - Voucher history
- [x] `app/utilities/vouchers/redeem/wallet.tsx` - Redeem to wallet
- [x] `app/utilities/vouchers/redeem/nampost.tsx` - Cash-out at NamPost
- [x] `app/utilities/vouchers/redeem/agent.tsx` - Cash-out at agent
- [x] `app/utilities/vouchers/redeem/merchant.tsx` - Merchant payment
- [x] `app/utilities/vouchers/redeem/bank-transfer.tsx` - Bank transfer
- [x] `app/utilities/vouchers/redeem/success.tsx` - Redemption success

#### Wallets
- [x] `app/wallets/[id].tsx` - Wallet details
- [x] `app/wallets/[id]/history.tsx` - Wallet transaction history
- [x] `app/wallets/[id]/add-money.tsx` - Add funds
- [x] `app/wallets/[id]/transfer.tsx` - Transfer between wallets
- [x] `app/wallets/[id]/settings.tsx` - Wallet settings
- [x] `app/wallets/[id]/autopay.tsx` - AutoPay management
- [x] `app/wallets/[id]/autopay/rules.tsx` - AutoPay rules
- [x] `app/add-wallet.tsx` - Create new wallet

#### Cards & Accounts
- [x] `app/cards.tsx` - Cards list
- [x] `app/cards/[id].tsx` - Card details
- [x] `app/cards/buffr-account.tsx` - Main Buffr account
- [x] `app/add-card.tsx` - Add payment card
- [x] `app/add-bank.tsx` - Add bank account
- [x] `app/account.tsx` - Account overview

#### Send Money
- [x] `app/send-money/select-recipient.tsx` - Choose recipient
- [x] `app/send-money/enter-amount.tsx` - Enter amount
- [x] `app/send-money/select-method.tsx` - Payment method
- [x] `app/send-money/confirm-payment.tsx` - Confirm payment
- [x] `app/send-money/success.tsx` - Success screen
- [x] `app/send-money/qr-scanner.tsx` - QR code scanner
- [x] `app/send-money/receiver-details.tsx` - Receiver info

#### Request Money
- [x] `app/request-money/select-recipient.tsx` - Choose recipient
- [x] `app/request-money/enter-amount.tsx` - Enter amount
- [x] `app/request-money/confirm.tsx` - Confirm request
- [x] `app/request-money/success.tsx` - Success screen
- [x] `app/requests/[id].tsx` - Request details

#### Transactions
- [x] `app/transactions/[id].tsx` - Transaction details
- [x] `app/transactions/category/[categoryId].tsx` - Category view
- [x] `app/transactions/receipt.tsx` - Transaction receipt

#### Profile & Settings
- [x] `app/profile.tsx` - Profile overview
- [x] `app/profile/edit.tsx` - Edit profile
- [x] `app/profile/notifications.tsx` - Notification settings
- [x] `app/profile/two-factor.tsx` - 2FA setup
- [x] `app/profile/security.tsx` - Security settings
- [x] `app/profile/preferences.tsx` - User preferences
- [x] `app/profile/data-sharing.tsx` - Data sharing settings
- [x] `app/profile/contact-support.tsx` - Support contact
- [x] `app/profile/complaints.tsx` - File complaints
- [x] `app/profile/faqs.tsx` - FAQs
- [x] `app/profile/fees.tsx` - Fee structure
- [x] `app/profile/privacy-policy.tsx` - Privacy policy
- [x] `app/profile/active-sessions.tsx` - Active sessions
- [x] `app/settings/index.tsx` - Settings home
- [x] `app/settings/security.tsx` - Security settings
- [x] `app/settings/notifications.tsx` - Notification settings
- [x] `app/settings/privacy.tsx` - Privacy settings
- [x] `app/settings/about.tsx` - About app
- [x] `app/settings/help.tsx` - Help & support

#### QR & Scanning
- [x] `app/qr-scanner.tsx` - Standalone QR scanner
- [x] `app/qr-code.tsx` - Display QR code

#### Groups & Split Bills
- [x] `app/create-group.tsx` - Create group
- [x] `app/groups/[id].tsx` - Group details
- [x] `app/groups/[id]/add-member.tsx` - Add member
- [x] `app/groups/[id]/contribute.tsx` - Contribute to group
- [x] `app/groups/[id]/settings.tsx` - Group settings
- [x] `app/split-bill/create.tsx` - Create split bill

#### Contacts
- [x] `app/contacts/index.tsx` - Contacts list
- [x] `app/contacts/add.tsx` - Add contact

#### Admin (Secondary Users)
- [x] `app/admin/analytics.tsx` - Analytics dashboard
- [x] `app/admin/audit-logs.tsx` - Audit logs
- [x] `app/admin/compliance.tsx` - Compliance reporting
- [x] `app/admin/smartpay-monitoring.tsx` - SmartPay monitoring
- [x] `app/admin/trust-account.tsx` - Trust account reconciliation

#### Payments
- [x] `app/payments/3ds-authenticate.tsx` - 3DS authentication
- [x] `app/payments/split-bill/[id]/pay.tsx` - Pay split bill

#### Verification
- [x] `app/verify/[phone].tsx` - Phone verification

#### Notifications
- [x] `app/notifications.tsx` - Notifications list

---

### ⚠️ Missing/Incomplete Screens (Based on PRD)

#### G2P Voucher Features (Critical)
- [ ] `app/utilities/vouchers/redeem/cashback-till.tsx` - **NEW** Cashback at merchant till
- [ ] `app/utilities/vouchers/notifications.tsx` - **NEW** Voucher notifications center
- [ ] `app/utilities/vouchers/qr-display.tsx` - **NEW** Display voucher QR for in-person redemption

#### Bill Payments (Missing)
- [ ] `app/bills/index.tsx` - **NEW** Bill payments home
- [ ] `app/bills/categories.tsx` - **NEW** Bill categories (utilities, services)
- [ ] `app/bills/pay/[billId].tsx` - **NEW** Pay specific bill
- [ ] `app/bills/history.tsx` - **NEW** Bill payment history
- [ ] `app/bills/scheduled.tsx` - **NEW** Scheduled bill payments

#### Merchant Payments (Incomplete)
- [ ] `app/merchants/index.tsx` - **NEW** Nearby merchants
- [ ] `app/merchants/[id].tsx` - **NEW** Merchant details
- [ ] `app/merchants/pay.tsx` - **NEW** Merchant payment flow
- [ ] `app/merchants/cashback-info.tsx` - **NEW** Cashback information

#### Agent Network (Missing - Agent Portal is Web)
- [ ] `app/agents/nearby.tsx` - **NEW** Find nearby agents (beneficiary view)
- [ ] `app/agents/[id].tsx` - **NEW** Agent details (beneficiary view)
- [ ] `app/agents/cash-out.tsx` - **NEW** Agent cash-out flow

#### USSD Simulation (For Testing)
- [ ] `app/ussd/index.tsx` - **NEW** USSD menu simulator (for testing)
- [ ] `app/ussd/menu.tsx` - **NEW** USSD menu navigation

#### Analytics & Insights (Missing)
- [ ] `app/analytics/index.tsx` - **NEW** Personal spending analytics
- [ ] `app/analytics/insights.tsx` - **NEW** AI-powered insights
- [ ] `app/analytics/budget.tsx` - **NEW** Budget management
- [ ] `app/analytics/categories.tsx` - **NEW** Spending by category

#### Cashback Features (Missing)
- [ ] `app/cashback/index.tsx` - **NEW** Cashback dashboard
- [ ] `app/cashback/history.tsx` - **NEW** Cashback history
- [ ] `app/cashback/earn.tsx` - **NEW** How to earn cashback

#### Enhanced Features
- [ ] `app/wallets/[id]/autopay/create.tsx` - **NEW** Create AutoPay rule
- [ ] `app/wallets/[id]/autopay/edit/[ruleId].tsx` - **NEW** Edit AutoPay rule
- [ ] `app/transactions/export.tsx` - **NEW** Export transactions
- [ ] `app/transactions/filter.tsx` - **NEW** Advanced filters

---

## Component Library

### ✅ Existing Components (`/components`)

#### Common Components
- [x] `SearchBar` - Header search with notifications/profile
- [x] `BalanceDisplay` - Balance with visibility toggle
- [x] `WalletCard` - Wallet card display
- [x] `AddWalletCard` - Add wallet button
- [x] `UtilityButton` - Utility service button
- [x] `ActionButton` - Primary/secondary action buttons
- [x] `AccountQuickView` - Account overview card
- [x] `TransactionListItem` - Transaction list item

#### Onboarding Components
- [x] `OnboardingLayout` - Onboarding screen wrapper
- [x] `OnboardingButton` - Onboarding action button

#### Form Components
- [x] Input fields (various)
- [x] Button components
- [x] Card components

### ⚠️ Missing Components (Based on PRD)

#### Voucher Components
- [ ] `VoucherCard` - Voucher display card
- [ ] `VoucherStatusBadge` - Status indicator (available/redeemed/expired)
- [ ] `VoucherQRCode` - QR code display for vouchers
- [ ] `RedemptionMethodSelector` - Choose redemption method

#### Payment Components
- [ ] `BillCategoryCard` - Bill category display
- [ ] `MerchantCard` - Merchant information card
- [ ] `PaymentMethodSelector` - Payment method chooser
- [ ] `AmountInput` - Amount entry with validation
- [ ] `RecipientSelector` - Recipient selection component

#### Cashback Components
- [ ] `CashbackCard` - Cashback offer display
- [ ] `CashbackEarnedBadge` - Cashback amount badge
- [ ] `MerchantCashbackInfo` - Cashback information modal

#### Agent Components
- [ ] `AgentCard` - Agent information card
- [ ] `AgentMapView` - Map showing nearby agents
- [ ] `AgentAvailabilityBadge` - Agent availability status

#### Analytics Components
- [ ] `SpendingChart` - Spending visualization
- [ ] `CategoryBreakdown` - Category spending breakdown
- [ ] `BudgetProgressBar` - Budget progress indicator
- [ ] `InsightCard` - AI insight display card

#### Enhanced Components
- [ ] `FilterSheet` - Bottom sheet for filters
- [ ] `DateRangePicker` - Date range selection
- [ ] `ExportOptionsSheet` - Export options modal
- [ ] `LoadingSkeleton` - Loading state skeleton
- [ ] `EmptyState` - Empty state with illustration
- [ ] `ErrorState` - Error state with retry
- [ ] `ConfirmationModal` - Confirmation dialog
- [ ] `BiometricPrompt` - Biometric authentication prompt

---

## Feature Mapping (PRD → Frontend)

### Epic 1: Voucher Receipt & Management

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Receive voucher (app) | `utilities/vouchers/[id].tsx` | ✅ Done | P0 |
| Receive voucher (USSD) | Backend API (USSD gateway) | ⚠️ Backend | P0 |
| Voucher notifications | `utilities/vouchers/notifications.tsx` | ❌ Missing | P0 |
| View voucher history | `utilities/vouchers/history.tsx` | ✅ Done | P0 |
| Check voucher status | `utilities/vouchers/[id].tsx` | ✅ Done | P0 |
| Voucher QR display | `utilities/vouchers/qr-display.tsx` | ❌ Missing | P1 |
| Voucher filters | `utilities/vouchers.tsx` | ⚠️ Partial | P1 |

### Epic 2: Voucher Redemption

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Redeem to wallet | `utilities/vouchers/redeem/wallet.tsx` | ✅ Done | P0 |
| Cash-out at NamPost | `utilities/vouchers/redeem/nampost.tsx` | ✅ Done | P0 |
| Cash-out at agent | `utilities/vouchers/redeem/agent.tsx` | ✅ Done | P0 |
| Bank transfer | `utilities/vouchers/redeem/bank-transfer.tsx` | ✅ Done | P0 |
| Merchant payment | `utilities/vouchers/redeem/merchant.tsx` | ✅ Done | P0 |
| **Cashback at till** | `utilities/vouchers/redeem/cashback-till.tsx` | ❌ Missing | P0 |
| Redemption success | `utilities/vouchers/redeem/success.tsx` | ✅ Done | P0 |

### Epic 3: Digital Wallet Features

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Main wallet (auto-created) | `cards/buffr-account.tsx` | ✅ Done | P0 |
| Multiple wallets | `wallets/[id].tsx` | ✅ Done | P0 |
| Wallet balance | `(tabs)/index.tsx` (Home) | ✅ Done | P0 |
| Add wallet | `add-wallet.tsx` | ✅ Done | P1 |
| Wallet history | `wallets/[id]/history.tsx` | ✅ Done | P0 |
| Wallet settings | `wallets/[id]/settings.tsx` | ✅ Done | P1 |

### Epic 4: P2P Transfers

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Send money (app) | `send-money/*` | ✅ Done | P0 |
| Send money (USSD) | Backend API | ⚠️ Backend | P0 |
| Select recipient | `send-money/select-recipient.tsx` | ✅ Done | P0 |
| Enter amount | `send-money/enter-amount.tsx` | ✅ Done | P0 |
| QR scanner | `send-money/qr-scanner.tsx` | ✅ Done | P0 |
| Confirm payment | `send-money/confirm-payment.tsx` | ✅ Done | P0 |
| Payment success | `send-money/success.tsx` | ✅ Done | P0 |

### Epic 5: Bill Payments

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Bill payments home | `bills/index.tsx` | ❌ Missing | P0 |
| Bill categories | `bills/categories.tsx` | ❌ Missing | P0 |
| Pay bill | `bills/pay/[billId].tsx` | ❌ Missing | P0 |
| Bill history | `bills/history.tsx` | ❌ Missing | P1 |
| Scheduled bills | `bills/scheduled.tsx` | ❌ Missing | P1 |

### Epic 6: QR Code Payments

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| QR scanner | `qr-scanner.tsx` | ✅ Done | P0 |
| QR code display | `qr-code.tsx` | ✅ Done | P0 |
| Merchant payment | `merchants/pay.tsx` | ❌ Missing | P0 |
| Merchant details | `merchants/[id].tsx` | ❌ Missing | P1 |
| Nearby merchants | `merchants/index.tsx` | ❌ Missing | P1 |

### Epic 7: Cashback at Merchant Tills

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Cashback dashboard | `cashback/index.tsx` | ❌ Missing | P0 |
| Cashback history | `cashback/history.tsx` | ❌ Missing | P1 |
| Cashback info | `cashback/earn.tsx` | ❌ Missing | P1 |
| Cashback at till flow | `utilities/vouchers/redeem/cashback-till.tsx` | ❌ Missing | P0 |
| Merchant cashback info | `merchants/cashback-info.tsx` | ❌ Missing | P1 |

### Epic 8: Request Money

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Request money (app) | `request-money/*` | ✅ Done | P0 |
| Request money (USSD) | Backend API | ⚠️ Backend | P0 |
| View requests | `requests/[id].tsx` | ✅ Done | P0 |
| Request notifications | `notifications.tsx` | ✅ Done | P1 |

### Epic 9: Split Bills

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Create split bill | `split-bill/create.tsx` | ✅ Done | P0 |
| Pay split bill | `payments/split-bill/[id]/pay.tsx` | ✅ Done | P0 |
| Split bill notifications | `notifications.tsx` | ✅ Done | P1 |

### Epic 10: Bank Transfers

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Add bank account | `add-bank.tsx` | ✅ Done | P0 |
| Bank transfer | `send-money/select-method.tsx` | ✅ Done | P0 |
| Bank transfer from voucher | `utilities/vouchers/redeem/bank-transfer.tsx` | ✅ Done | P0 |

### Epic 11: Cash-Out

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Cash-out at NamPost | `utilities/vouchers/redeem/nampost.tsx` | ✅ Done | P0 |
| Cash-out at agent | `utilities/vouchers/redeem/agent.tsx` | ✅ Done | P0 |
| Find nearby agents | `agents/nearby.tsx` | ❌ Missing | P1 |
| Agent details | `agents/[id].tsx` | ❌ Missing | P1 |
| Agent cash-out flow | `agents/cash-out.tsx` | ❌ Missing | P0 |

### Epic 12: Transaction History

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Transaction list | `(tabs)/transactions.tsx` | ✅ Done | P0 |
| Transaction details | `transactions/[id].tsx` | ✅ Done | P0 |
| Transaction receipt | `transactions/receipt.tsx` | ✅ Done | P0 |
| Category view | `transactions/category/[categoryId].tsx` | ✅ Done | P1 |
| Advanced filters | `transactions/filter.tsx` | ❌ Missing | P1 |
| Export transactions | `transactions/export.tsx` | ❌ Missing | P2 |

### Epic 13: Analytics & Insights

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Spending analytics | `analytics/index.tsx` | ❌ Missing | P1 |
| AI insights | `analytics/insights.tsx` | ❌ Missing | P1 |
| Budget management | `analytics/budget.tsx` | ❌ Missing | P2 |
| Category breakdown | `analytics/categories.tsx` | ❌ Missing | P1 |

### Epic 14: AutoPay

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| AutoPay management | `wallets/[id]/autopay.tsx` | ✅ Done | P1 |
| AutoPay rules | `wallets/[id]/autopay/rules.tsx` | ✅ Done | P1 |
| Create AutoPay rule | `wallets/[id]/autopay/create.tsx` | ❌ Missing | P1 |
| Edit AutoPay rule | `wallets/[id]/autopay/edit/[ruleId].tsx` | ❌ Missing | P1 |

### Epic 15: Contacts

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Contacts list | `contacts/index.tsx` | ✅ Done | P1 |
| Add contact | `contacts/add.tsx` | ✅ Done | P1 |

### Epic 16: Groups

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Create group | `create-group.tsx` | ✅ Done | P1 |
| Group details | `groups/[id].tsx` | ✅ Done | P1 |
| Add member | `groups/[id]/add-member.tsx` | ✅ Done | P1 |
| Contribute | `groups/[id]/contribute.tsx` | ✅ Done | P1 |
| Group settings | `groups/[id]/settings.tsx` | ✅ Done | P1 |

### Epic 17: Profile & Settings

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Profile overview | `profile.tsx` | ✅ Done | P0 |
| Edit profile | `profile/edit.tsx` | ✅ Done | P0 |
| Security settings | `profile/security.tsx` | ✅ Done | P0 |
| 2FA setup | `profile/two-factor.tsx` | ✅ Done | P0 |
| Notifications | `profile/notifications.tsx` | ✅ Done | P0 |
| Preferences | `profile/preferences.tsx` | ✅ Done | P1 |
| Data sharing | `profile/data-sharing.tsx` | ✅ Done | P1 |
| Support | `profile/contact-support.tsx` | ✅ Done | P1 |
| FAQs | `profile/faqs.tsx` | ✅ Done | P1 |
| Fees | `profile/fees.tsx` | ✅ Done | P1 |
| Privacy policy | `profile/privacy-policy.tsx` | ✅ Done | P1 |
| Active sessions | `profile/active-sessions.tsx` | ✅ Done | P1 |

### Epic 18: Notifications

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Notifications list | `notifications.tsx` | ✅ Done | P0 |
| Push notifications | Backend + Expo Notifications | ⚠️ Partial | P0 |
| SMS notifications | Backend API | ⚠️ Backend | P0 |

### Epic 19: Admin Features (Secondary Users)

| PRD Feature | Screen/Component | Status | Priority |
|------------|------------------|--------|----------|
| Analytics dashboard | `admin/analytics.tsx` | ✅ Done | P1 |
| Audit logs | `admin/audit-logs.tsx` | ✅ Done | P1 |
| Compliance reporting | `admin/compliance.tsx` | ✅ Done | P1 |
| SmartPay monitoring | `admin/smartpay-monitoring.tsx` | ✅ Done | P1 |
| Trust account | `admin/trust-account.tsx` | ✅ Done | P1 |

---

## Implementation Roadmap

### Phase 1: Critical Missing Features (P0) - Week 1-2

#### 1.1 Cashback at Merchant Tills
- [ ] Create `app/utilities/vouchers/redeem/cashback-till.tsx`
- [ ] Create `app/cashback/index.tsx` (dashboard)
- [ ] Create `app/cashback/history.tsx`
- [ ] Create `components/cashback/CashbackCard.tsx`
- [ ] Create `components/cashback/CashbackEarnedBadge.tsx`
- [ ] Integrate with IPP API for cashback processing
- [ ] Add cashback notifications

#### 1.2 Bill Payments
- [ ] Create `app/bills/index.tsx`
- [ ] Create `app/bills/categories.tsx`
- [ ] Create `app/bills/pay/[billId].tsx`
- [ ] Create `app/bills/history.tsx`
- [ ] Create `components/bills/BillCategoryCard.tsx`
- [ ] Integrate with bill payment API

#### 1.3 Merchant Payments
- [ ] Create `app/merchants/index.tsx` (nearby merchants)
- [ ] Create `app/merchants/[id].tsx` (merchant details)
- [ ] Create `app/merchants/pay.tsx` (payment flow)
- [ ] Create `components/merchants/MerchantCard.tsx`
- [ ] Integrate with NamQR API

#### 1.4 Agent Network (Beneficiary View)
- [ ] Create `app/agents/nearby.tsx`
- [ ] Create `app/agents/[id].tsx`
- [ ] Create `app/agents/cash-out.tsx`
- [ ] Create `components/agents/AgentCard.tsx`
- [ ] Create `components/agents/AgentMapView.tsx`
- [ ] Integrate with agent API

### Phase 2: Enhanced Features (P1) - Week 3-4

#### 2.1 Analytics & Insights
- [ ] Create `app/analytics/index.tsx`
- [ ] Create `app/analytics/insights.tsx`
- [ ] Create `app/analytics/categories.tsx`
- [ ] Create `components/analytics/SpendingChart.tsx`
- [ ] Create `components/analytics/CategoryBreakdown.tsx`
- [ ] Create `components/analytics/InsightCard.tsx`
- [ ] Integrate with Transaction Analyst Agent API

#### 2.2 Enhanced Transaction Features
- [ ] Create `app/transactions/filter.tsx`
- [ ] Create `app/transactions/export.tsx`
- [ ] Create `components/common/FilterSheet.tsx`
- [ ] Create `components/common/DateRangePicker.tsx`
- [ ] Create `components/common/ExportOptionsSheet.tsx`

#### 2.3 AutoPay Enhancements
- [ ] Create `app/wallets/[id]/autopay/create.tsx`
- [ ] Create `app/wallets/[id]/autopay/edit/[ruleId].tsx`
- [ ] Enhance AutoPay UI/UX

#### 2.4 Voucher Enhancements
- [ ] Create `app/utilities/vouchers/notifications.tsx`
- [ ] Create `app/utilities/vouchers/qr-display.tsx`
- [ ] Create `components/vouchers/VoucherCard.tsx`
- [ ] Create `components/vouchers/VoucherStatusBadge.tsx`
- [ ] Create `components/vouchers/VoucherQRCode.tsx`

### Phase 3: Polish & Optimization (P2) - Week 5-6

#### 3.1 UI/UX Improvements
- [ ] Create `components/common/LoadingSkeleton.tsx`
- [ ] Create `components/common/EmptyState.tsx`
- [ ] Create `components/common/ErrorState.tsx`
- [ ] Create `components/common/ConfirmationModal.tsx`
- [ ] Create `components/common/BiometricPrompt.tsx`
- [ ] Improve error handling across all screens
- [ ] Add loading states everywhere
- [ ] Add empty states everywhere

#### 3.2 Advanced Features
- [ ] Create `app/analytics/budget.tsx`
- [ ] Create `app/bills/scheduled.tsx`
- [ ] Create `app/cashback/earn.tsx`
- [ ] Create `app/merchants/cashback-info.tsx`
- [ ] USSD menu simulator (`app/ussd/*`) for testing

#### 3.3 Performance Optimization
- [ ] Implement React Query caching
- [ ] Add image optimization
- [ ] Optimize list rendering (FlashList)
- [ ] Add offline support indicators

---

## Design System Integration

### Current Design System (`constants/DesignSystem.ts`)
- ✅ Colors (Primary, Semantic, Text, Background, Border)
- ✅ Typography (Font sizes, weights, line heights)
- ✅ Spacing (8pt grid system)
- ✅ Layout constants
- ✅ Component specifications
- ✅ Visual effects (shadows, animations)

### Design System Usage

All screens and components must:
1. **Use Design System Tokens:** Import from `@/constants/DesignSystem`
2. **Follow 8pt Grid:** All spacing uses Spacing constants
3. **Use Typography Scale:** All text uses Typography.FONT_SIZES
4. **Use Color Tokens:** All colors from Colors object
5. **Follow Component Specs:** Buttons, inputs, cards follow Components specs
6. **Use Visual Effects:** Shadows, animations from VisualEffects

### Example Implementation Pattern

```typescript
import { Colors, Typography, Spacing, Layout } from '@/constants/DesignSystem';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.HORIZONTAL_PADDING,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.BACKGROUND.primary,
  },
  title: {
    fontSize: Typography.FONT_SIZES.h2,
    fontWeight: Typography.FONT_WEIGHTS.semibold,
    color: Colors.TEXT.primary,
    marginBottom: Spacing.lg,
  },
  button: {
    height: Components.BUTTONS.height.medium,
    borderRadius: Components.BUTTONS.borderRadius.standard,
    backgroundColor: Colors.PRIMARY[800],
  },
});
```

---

## State Management

### Current Context Providers (`/contexts`)

#### UserContext
- User profile data
- Preferences
- Authentication state
- Balance visibility toggle

#### WalletsContext
- Wallets list
- Wallet operations (fetch, create, update)
- Wallet balances

#### CardsContext
- Payment cards
- Card operations

#### TransactionsContext
- Transactions list
- Transaction operations
- Transaction filters

### Recommended Additions

#### VouchersContext
```typescript
// contexts/VouchersContext.tsx
- vouchers: Voucher[]
- fetchVouchers()
- fetchVoucher(id)
- redeemVoucher(id, method)
- voucherNotifications: Notification[]
```

#### BillsContext
```typescript
// contexts/BillsContext.tsx
- bills: Bill[]
- billCategories: Category[]
- fetchBills()
- payBill(billId, amount)
- scheduledBills: ScheduledBill[]
```

#### MerchantsContext
```typescript
// contexts/MerchantsContext.tsx
- merchants: Merchant[]
- nearbyMerchants: Merchant[]
- fetchNearbyMerchants(location)
- merchantDetails(id)
```

#### AgentsContext
```typescript
// contexts/AgentsContext.tsx
- agents: Agent[]
- nearbyAgents: Agent[]
- fetchNearbyAgents(location)
- agentDetails(id)
```

#### CashbackContext
```typescript
// contexts/CashbackContext.tsx
- cashbackBalance: number
- cashbackHistory: CashbackTransaction[]
- fetchCashbackHistory()
- availableOffers: CashbackOffer[]
```

#### AnalyticsContext
```typescript
// contexts/AnalyticsContext.tsx
- spendingData: SpendingData
- insights: Insight[]
- budget: Budget
- fetchAnalytics()
- fetchInsights()
```

---

## API Integration

### Current API Structure (`/app/api`)

#### V1 API Routes
- ✅ `/api/v1/auth/*` - Authentication
- ✅ `/api/v1/users/*` - User management
- ✅ `/api/v1/wallets/*` - Wallet operations
- ✅ `/api/v1/transactions/*` - Transactions
- ✅ `/api/v1/vouchers/*` - Voucher operations
- ✅ `/api/v1/payments/*` - Payment processing
- ✅ `/api/v1/notifications/*` - Notifications
- ✅ `/api/v1/admin/*` - Admin operations

### Missing API Integrations

#### Bills API
- [ ] `/api/v1/bills` - Bill categories and list
- [ ] `/api/v1/bills/pay` - Pay bill endpoint
- [ ] `/api/v1/bills/scheduled` - Scheduled bills

#### Merchants API
- [ ] `/api/v1/merchants` - Merchant list
- [ ] `/api/v1/merchants/nearby` - Nearby merchants
- [ ] `/api/v1/merchants/[id]` - Merchant details
- [ ] `/api/v1/merchants/pay` - Merchant payment

#### Agents API
- [ ] `/api/v1/agents` - Agent list
- [ ] `/api/v1/agents/nearby` - Nearby agents
- [ ] `/api/v1/agents/[id]` - Agent details
- [ ] `/api/v1/agents/cash-out` - Agent cash-out

#### Cashback API
- [ ] `/api/v1/cashback` - Cashback balance
- [ ] `/api/v1/cashback/history` - Cashback history
- [ ] `/api/v1/cashback/offers` - Available offers

#### Analytics API
- [ ] `/api/v1/analytics/spending` - Spending data
- [ ] `/api/v1/analytics/insights` - AI insights
- [ ] `/api/v1/analytics/budget` - Budget data

---

## Testing Strategy

### Unit Testing
- Component testing with React Native Testing Library
- Context testing
- Utility function testing

### Integration Testing
- Screen navigation testing
- API integration testing
- State management testing

### E2E Testing
- Critical user flows:
  1. Onboarding → Voucher receipt → Redemption
  2. Send money flow
  3. Bill payment flow
  4. Cash-out flow

### Manual Testing Checklist
- [ ] All P0 screens functional
- [ ] Navigation flows work
- [ ] API integrations work
- [ ] Error handling works
- [ ] Loading states work
- [ ] Empty states work
- [ ] Design system compliance

---

## Priority Summary

### P0 - Critical (Must Have)
1. ✅ Voucher receipt & management (mostly done)
2. ✅ Voucher redemption (mostly done)
3. ❌ **Cashback at merchant tills** (missing)
4. ❌ **Bill payments** (missing)
5. ❌ **Merchant payments** (missing)
6. ❌ **Agent cash-out** (missing)

### P1 - High Priority (Should Have)
1. Analytics & insights
2. Enhanced transaction features
3. AutoPay enhancements
4. Voucher enhancements

### P2 - Nice to Have
1. Budget management
2. Scheduled bills
3. USSD simulator
4. Advanced export features

---

## Next Steps

1. **Review this plan** with the team
2. **Prioritize Phase 1 features** based on business needs
3. **Create detailed screen specifications** for missing screens
4. **Set up component library** for missing components
5. **Begin Phase 1 implementation** starting with cashback at tills

---

**Document Status:** ✅ Complete  
**Last Updated:** January 26, 2026  
**Next Review:** After Phase 1 completion

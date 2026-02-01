# 🗺️ Buffr Frontend Navigation Map
## Complete Screen Hierarchy & User Flows

**Version:** 1.0  
**Date:** January 26, 2026

---

## 📱 Navigation Structure

```
Root App (_layout.tsx)
│
├── 🏠 Entry Point
│   └── index.tsx (Welcome/Login)
│
├── 📋 Onboarding Flow (Stack)
│   ├── onboarding/index.tsx (Welcome)
│   ├── onboarding/phone.tsx
│   ├── onboarding/otp.tsx
│   ├── onboarding/name.tsx
│   ├── onboarding/photo.tsx
│   ├── onboarding/faceid.tsx
│   └── onboarding/complete.tsx
│
├── 🏡 Main App (Tabs)
│   ├── (tabs)/index.tsx (Home) ⭐
│   └── (tabs)/transactions.tsx (Transactions)
│
└── 🔀 Feature Screens (Stack)
    │
    ├── 💰 Vouchers (G2P Core)
    │   ├── utilities/vouchers.tsx (List)
    │   ├── utilities/vouchers/[id].tsx (Details)
    │   ├── utilities/vouchers/history.tsx
    │   ├── utilities/vouchers/notifications.tsx ⚠️
    │   ├── utilities/vouchers/qr-display.tsx ⚠️
    │   └── utilities/vouchers/redeem/
    │       ├── wallet.tsx ✅
    │       ├── nampost.tsx ✅
    │       ├── agent.tsx ✅
    │       ├── merchant.tsx ✅
    │       ├── bank-transfer.tsx ✅
    │       ├── cashback-till.tsx ⚠️ NEW
    │       └── success.tsx ✅
    │
    ├── 💳 Wallets
    │   ├── wallets/[id].tsx (Details)
    │   ├── wallets/[id]/history.tsx
    │   ├── wallets/[id]/add-money.tsx
    │   ├── wallets/[id]/transfer.tsx
    │   ├── wallets/[id]/settings.tsx
    │   ├── wallets/[id]/autopay.tsx
    │   ├── wallets/[id]/autopay/rules.tsx
    │   ├── wallets/[id]/autopay/create.tsx ⚠️
    │   ├── wallets/[id]/autopay/edit/[ruleId].tsx ⚠️
    │   └── add-wallet.tsx
    │
    ├── 💵 Send Money
    │   ├── send-money/select-recipient.tsx
    │   ├── send-money/enter-amount.tsx
    │   ├── send-money/select-method.tsx
    │   ├── send-money/confirm-payment.tsx
    │   ├── send-money/success.tsx
    │   ├── send-money/qr-scanner.tsx
    │   └── send-money/receiver-details.tsx
    │
    ├── 📨 Request Money
    │   ├── request-money/select-recipient.tsx
    │   ├── request-money/enter-amount.tsx
    │   ├── request-money/confirm.tsx
    │   ├── request-money/success.tsx
    │   └── requests/[id].tsx
    │
    ├── 💸 Bill Payments ⚠️ NEW
    │   ├── bills/index.tsx
    │   ├── bills/categories.tsx
    │   ├── bills/pay/[billId].tsx
    │   ├── bills/history.tsx
    │   └── bills/scheduled.tsx
    │
    ├── 🏪 Merchants ⚠️ NEW
    │   ├── merchants/index.tsx (Nearby)
    │   ├── merchants/[id].tsx (Details)
    │   ├── merchants/pay.tsx (Payment)
    │   └── merchants/cashback-info.tsx
    │
    ├── 🏦 Agents ⚠️ NEW
    │   ├── agents/nearby.tsx
    │   ├── agents/[id].tsx
    │   └── agents/cash-out.tsx
    │
    ├── 💰 Cashback ⚠️ NEW
    │   ├── cashback/index.tsx
    │   ├── cashback/history.tsx
    │   └── cashback/earn.tsx
    │
    ├── 📊 Analytics ⚠️ NEW
    │   ├── analytics/index.tsx
    │   ├── analytics/insights.tsx
    │   ├── analytics/categories.tsx
    │   └── analytics/budget.tsx
    │
    ├── 📄 Transactions
    │   ├── transactions/[id].tsx
    │   ├── transactions/category/[categoryId].tsx
    │   ├── transactions/receipt.tsx
    │   ├── transactions/filter.tsx ⚠️
    │   └── transactions/export.tsx ⚠️
    │
    ├── 💳 Cards & Accounts
    │   ├── cards.tsx
    │   ├── cards/[id].tsx
    │   ├── cards/buffr-account.tsx
    │   ├── add-card.tsx
    │   ├── add-bank.tsx
    │   └── account.tsx
    │
    ├── 👥 Groups & Split Bills
    │   ├── create-group.tsx
    │   ├── groups/[id].tsx
    │   ├── groups/[id]/add-member.tsx
    │   ├── groups/[id]/contribute.tsx
    │   ├── groups/[id]/settings.tsx
    │   └── split-bill/create.tsx
    │
    ├── 📇 Contacts
    │   ├── contacts/index.tsx
    │   └── contacts/add.tsx
    │
    ├── 👤 Profile
    │   ├── profile.tsx
    │   ├── profile/edit.tsx
    │   ├── profile/notifications.tsx
    │   ├── profile/two-factor.tsx
    │   ├── profile/security.tsx
    │   ├── profile/preferences.tsx
    │   ├── profile/data-sharing.tsx
    │   ├── profile/contact-support.tsx
    │   ├── profile/complaints.tsx
    │   ├── profile/faqs.tsx
    │   ├── profile/fees.tsx
    │   ├── profile/privacy-policy.tsx
    │   └── profile/active-sessions.tsx
    │
    ├── ⚙️ Settings
    │   ├── settings/index.tsx
    │   ├── settings/security.tsx
    │   ├── settings/notifications.tsx
    │   ├── settings/privacy.tsx
    │   ├── settings/about.tsx
    │   └── settings/help.tsx
    │
    ├── 🔔 Notifications
    │   └── notifications.tsx
    │
    ├── 📷 QR & Scanning
    │   ├── qr-scanner.tsx
    │   └── qr-code.tsx
    │
    ├── 🔐 Verification
    │   └── verify/[phone].tsx
    │
    └── 👨‍💼 Admin (Secondary Users)
        ├── admin/analytics.tsx
        ├── admin/audit-logs.tsx
        ├── admin/compliance.tsx
        ├── admin/smartpay-monitoring.tsx
        └── admin/trust-account.tsx

Legend:
✅ = Implemented
⚠️ = Missing/Incomplete
⭐ = Main entry point
```

---

## 🔄 Key User Flows

### Flow 1: Onboarding → First Voucher
```
Entry (index.tsx)
  → Onboarding (phone → otp → name → photo → faceid → complete)
  → Home (tabs/index.tsx)
  → Voucher Notification
  → Vouchers List (utilities/vouchers.tsx)
  → Voucher Details (utilities/vouchers/[id].tsx)
  → Redeem (utilities/vouchers/redeem/wallet.tsx)
  → Success (utilities/vouchers/redeem/success.tsx)
```

### Flow 2: Send Money
```
Home (tabs/index.tsx)
  → Send Button
  → Select Recipient (send-money/select-recipient.tsx)
  → Enter Amount (send-money/enter-amount.tsx)
  → Select Method (send-money/select-method.tsx)
  → Confirm (send-money/confirm-payment.tsx)
  → Success (send-money/success.tsx)
```

### Flow 3: Cash-Out at NamPost
```
Voucher Details (utilities/vouchers/[id].tsx)
  → Redeem Options
  → Cash-Out at NamPost (utilities/vouchers/redeem/nampost.tsx)
  → Generate QR Code
  → Visit NamPost (in-person)
  → Biometric Verification
  → Cash Dispensed
  → Success Notification
```

### Flow 4: Cashback at Merchant Till
```
Voucher Details (utilities/vouchers/[id].tsx)
  → Redeem Options
  → Cashback at Till (utilities/vouchers/redeem/cashback-till.tsx) ⚠️
  → Select Merchant
  → Pay at POS Terminal
  → Cashback Credited
  → Success Notification
```

### Flow 5: Bill Payment
```
Home (tabs/index.tsx)
  → Bills Button (to be added)
  → Bills Home (bills/index.tsx) ⚠️
  → Bill Categories (bills/categories.tsx) ⚠️
  → Select Bill (bills/pay/[billId].tsx) ⚠️
  → Confirm Payment
  → Success
```

### Flow 6: Merchant Payment
```
Home (tabs/index.tsx)
  → Scan QR (qr-scanner.tsx)
  → Merchant Details (merchants/[id].tsx) ⚠️
  → Enter Amount
  → Confirm Payment (merchants/pay.tsx) ⚠️
  → Success
```

---

## 📊 Screen Status Dashboard

### By Feature Area

| Feature Area | Total Screens | ✅ Done | ⚠️ Missing | % Complete |
|-------------|---------------|---------|------------|------------|
| **Onboarding** | 7 | 7 | 0 | 100% |
| **Vouchers (G2P)** | 10 | 8 | 2 | 80% |
| **Wallets** | 9 | 7 | 2 | 78% |
| **Send Money** | 7 | 7 | 0 | 100% |
| **Request Money** | 5 | 5 | 0 | 100% |
| **Bill Payments** | 5 | 0 | 5 | 0% ⚠️ |
| **Merchants** | 4 | 0 | 4 | 0% ⚠️ |
| **Agents** | 3 | 0 | 3 | 0% ⚠️ |
| **Cashback** | 3 | 0 | 3 | 0% ⚠️ |
| **Analytics** | 4 | 0 | 4 | 0% ⚠️ |
| **Transactions** | 5 | 3 | 2 | 60% |
| **Cards** | 6 | 6 | 0 | 100% |
| **Groups** | 6 | 6 | 0 | 100% |
| **Contacts** | 2 | 2 | 0 | 100% |
| **Profile** | 13 | 13 | 0 | 100% |
| **Settings** | 6 | 6 | 0 | 100% |
| **Admin** | 5 | 5 | 0 | 100% |
| **TOTAL** | **99** | **68** | **31** | **69%** |

### Critical Missing Features (P0)

1. **Bill Payments** (0% complete) - 5 screens
2. **Merchants** (0% complete) - 4 screens
3. **Agents** (0% complete) - 3 screens
4. **Cashback** (0% complete) - 3 screens
5. **Analytics** (0% complete) - 4 screens

**Total Critical Missing:** 19 screens

---

## 🎯 Implementation Priority

### Week 1-2: Critical Features (P0)
1. Cashback at merchant tills (1 screen)
2. Bill payments (5 screens)
3. Merchant payments (4 screens)
4. Agent network (3 screens)

**Total:** 13 screens

### Week 3-4: High Priority (P1)
1. Analytics & insights (4 screens)
2. Enhanced transactions (2 screens)
3. AutoPay enhancements (2 screens)
4. Voucher enhancements (2 screens)

**Total:** 10 screens

### Week 5-6: Polish (P2)
1. Budget management (1 screen)
2. Scheduled bills (1 screen)
3. USSD simulator (2 screens)
4. Advanced features (4 screens)

**Total:** 8 screens

---

## 🔗 Navigation Patterns

### Tab Navigation
- **Home Tab:** Main dashboard, quick actions
- **Transactions Tab:** Transaction history, filters

### Stack Navigation
- **Modal Presentation:** Add screens, payment confirmations
- **Card Presentation:** Detail screens, settings
- **Slide Animation:** Standard navigation

### Deep Linking
- Voucher deep links: `buffr://voucher/[id]`
- Transaction deep links: `buffr://transaction/[id]`
- Payment deep links: `buffr://pay/[merchantId]`

---

**Last Updated:** January 26, 2026

/**
 * USSD Parity – Ensure all wallet features are accessible via USSD
 *
 * Location: buffr/components/USSDParity.ts
 * Purpose: Single source of truth for app vs USSD feature parity (G2P 4.0 / UPI-style).
 * Used by: Tests (USSDParity.test.ts), Help/FAQ, and product to close gaps.
 */

export interface WalletFeature {
  id: string;
  name: string;
  app: boolean;
  ussd: boolean;
  ussdMenuPath?: string; // e.g. "1" for main→balance, "2>1" for send money step 1
  notes?: string;
}

/**
 * Canonical list of wallet features and their availability on App vs USSD.
 * Update this when adding app features so USSD parity can be tracked and tested.
 */
export const WALLET_FEATURES: WalletFeature[] = [
  { id: 'balance', name: 'Check balance', app: true, ussd: true, ussdMenuPath: '1', notes: '*123# → 1' },
  { id: 'send_money', name: 'Send money', app: true, ussd: true, ussdMenuPath: '2', notes: '*123# → 2' },
  { id: 'pay_bills', name: 'Pay bills', app: true, ussd: true, ussdMenuPath: '3' },
  { id: 'buy_airtime', name: 'Buy airtime', app: true, ussd: true, ussdMenuPath: '4' },
  { id: 'transaction_history', name: 'Transaction history', app: true, ussd: true, ussdMenuPath: '5' },
  { id: 'profile', name: 'My profile', app: true, ussd: true, ussdMenuPath: '6' },
  { id: 'change_pin', name: 'Change PIN', app: true, ussd: true, ussdMenuPath: '7' },
  { id: 'vouchers_list', name: 'List vouchers', app: true, ussd: true, ussdMenuPath: '8', notes: 'If menu 8 exists' },
  { id: 'voucher_redeem', name: 'Redeem voucher', app: true, ussd: true, ussdMenuPath: '8>1' },
  { id: 'agent_nearby', name: 'Find nearest agent', app: true, ussd: false, notes: 'Planned: IVR/USSD agent locator' },
  { id: 'request_money', name: 'Request money', app: true, ussd: false, notes: 'Planned for USSD' },
  { id: 'qr_pay', name: 'Pay with QR (NAMQR)', app: true, ussd: false, notes: 'App-only; USSD cash-out at agent' },
  { id: 'bank_link', name: 'Link bank account', app: true, ussd: false, notes: 'App/KYC only' },
  { id: 'notifications', name: 'Notification preferences', app: true, ussd: false, notes: 'App only' },
  { id: 'feedback', name: 'Submit feedback / NPS', app: true, ussd: true, ussdMenuPath: '9', notes: 'If menu 9 added' },
];

/**
 * Features that are on app but not yet on USSD (parity gap).
 */
export function getUSSDParityGaps(): WalletFeature[] {
  return WALLET_FEATURES.filter((f) => f.app && !f.ussd);
}

/**
 * All features that should be on USSD for full parity (used in tests).
 */
export function getUSSDRequiredFeatures(): WalletFeature[] {
  return WALLET_FEATURES.filter((f) => f.ussd);
}

/**
 * Check if a feature id is available on USSD.
 */
export function isFeatureAvailableOnUSSD(featureId: string): boolean {
  const f = WALLET_FEATURES.find((x) => x.id === featureId);
  return f?.ussd ?? false;
}

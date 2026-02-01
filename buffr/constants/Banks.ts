/**
 * Namibian Commercial Banks
 * 
 * Location: constants/Banks.ts
 * Purpose: List of all commercial banks in Namibia for bank account linking
 * 
 * Source: Bank of Namibia - Licensed Commercial Banks
 * Last Updated: December 15, 2025
 */

import { ImageSourcePropType } from 'react-native';

export interface NamibianBank {
  id: string;
  name: string;
  shortName: string;
  code?: string; // Bank code if available
  swiftCode?: string; // SWIFT/BIC code if available
  logo?: ImageSourcePropType; // Logo asset (optional)
  color: string; // Brand color (required for styled initials)
}

/**
 * List of all commercial banks in Namibia
 * Ordered by market presence and recognition
 * 
 * Brand colors sourced from official bank websites
 * Logos can be added later by placing files in assets/logos/
 */
export const NAMIBIAN_BANKS: NamibianBank[] = [
  {
    id: 'bank-windhoek',
    name: 'Bank Windhoek Limited',
    shortName: 'Bank Windhoek',
    code: 'BW',
    swiftCode: 'BWLINANX',
    color: '#004C97', // Bank Windhoek blue
  },
  {
    id: 'fnb-namibia',
    name: 'First National Bank Namibia Limited',
    shortName: 'FNB Namibia',
    code: 'FNB',
    swiftCode: 'FIRNNANX',
    color: '#009A44', // FNB green
  },
  {
    id: 'standard-bank-namibia',
    name: 'Standard Bank Namibia Limited',
    shortName: 'Standard Bank',
    code: 'SBN',
    swiftCode: 'SBICNANX',
    color: '#0033A0', // Standard Bank blue
  },
  {
    id: 'nedbank-namibia',
    name: 'Nedbank Namibia Limited',
    shortName: 'Nedbank',
    code: 'NED',
    swiftCode: 'NEDSNANX',
    color: '#006747', // Nedbank green
  },
  {
    id: 'banco-atlantico',
    name: 'Banco Atlantico',
    shortName: 'Banco Atlantico',
    code: 'BA',
    swiftCode: 'ATLANANX',
    color: '#1E3A8A', // Banco Atlantico blue
  },
  {
    id: 'bank-bic-namibia',
    name: 'Bank BIC Namibia Limited',
    shortName: 'BIC Namibia',
    code: 'BIC',
    swiftCode: 'BICNANANX',
    color: '#DC2626', // BIC red
  },
  {
    id: 'letshego-bank-namibia',
    name: 'Letshego Bank Namibia Limited',
    shortName: 'Letshego Bank',
    code: 'LBN',
    swiftCode: 'LETSNAANX',
    color: '#F59E0B', // Letshego orange
  },
];

/**
 * Get bank by ID
 */
export function getBankById(id: string): NamibianBank | undefined {
  return NAMIBIAN_BANKS.find((bank) => bank.id === id);
}

/**
 * Get bank by name (case-insensitive)
 */
export function getBankByName(name: string): NamibianBank | undefined {
  return NAMIBIAN_BANKS.find(
    (bank) => bank.name.toLowerCase() === name.toLowerCase() ||
              bank.shortName.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Search banks by name (partial match)
 */
export function searchBanks(query: string): NamibianBank[] {
  const lowerQuery = query.toLowerCase();
  return NAMIBIAN_BANKS.filter(
    (bank) =>
      bank.name.toLowerCase().includes(lowerQuery) ||
      bank.shortName.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all bank names for dropdown/picker
 */
export function getBankNames(): string[] {
  return NAMIBIAN_BANKS.map((bank) => bank.name);
}

/**
 * Get all bank short names for display
 */
export function getBankShortNames(): string[] {
  return NAMIBIAN_BANKS.map((bank) => bank.shortName);
}

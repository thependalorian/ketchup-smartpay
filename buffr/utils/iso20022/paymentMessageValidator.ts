/**
 * ISO 20022 Payment Message Validator
 * 
 * Location: utils/iso20022/paymentMessageValidator.ts
 * Purpose: Ensure all payment messages use ISO 20022 compliant addresses
 * 
 * === PMPG COMPLIANCE - NOVEMBER 2025 DEADLINE ===
 * 
 * All interbank payment messages must use ISO 20022 format after November 22, 2025.
 * This validator ensures addresses meet minimum requirements:
 * - Country code (ISO 3166-1 Alpha-2) - REQUIRED
 * - Town/City name - REQUIRED
 * 
 * @see PMPG Hybrid Postal Address Guidance
 */

import { validatePostalAddress, type AddressValidationResult } from './addressValidator';
import type { ISO20022PostalAddress, PartyIdentification } from '../../types/iso20022';

/**
 * Validate that a party has a compliant postal address
 * 
 * For cross-border payments, addresses are mandatory.
 * For domestic payments, addresses are recommended but may be optional.
 */
export function validatePartyAddress(
  party: PartyIdentification,
  isCrossBorder: boolean = false
): AddressValidationResult {
  if (!party.postalAddress) {
    if (isCrossBorder) {
      return {
        isValid: false,
        errors: ['Postal address is required for cross-border payments (ISO 20022 compliance)'],
        warnings: [],
      };
    }
    return {
      isValid: true,
      errors: [],
      warnings: ['Postal address is recommended for ISO 20022 compliance'],
    };
  }

  return validatePostalAddress(party.postalAddress);
}

/**
 * Ensure address has minimum required fields (country + townName)
 * 
 * This is the absolute minimum for ISO 20022 compliance after November 2025.
 */
export function hasMinimumAddressFields(address: Partial<ISO20022PostalAddress> | null | undefined): boolean {
  if (!address) {
    return false;
  }

  return !!(address.country && address.townName);
}

/**
 * Validate address for payment message inclusion
 * 
 * Returns validation result with specific error messages for payment context.
 */
export function validateAddressForPayment(
  address: Partial<ISO20022PostalAddress> | null | undefined,
  partyType: 'debtor' | 'creditor',
  isCrossBorder: boolean = false
): AddressValidationResult {
  const validation = validatePostalAddress(address);

  // For cross-border, address is mandatory
  if (isCrossBorder && !validation.isValid) {
    validation.errors.unshift(
      `${partyType === 'debtor' ? 'Debtor' : 'Creditor'} postal address is required for cross-border payments (ISO 20022 CBPR+ compliance)`
    );
  }

  return validation;
}

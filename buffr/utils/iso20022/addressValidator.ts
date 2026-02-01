/**
 * ISO 20022 Address Validator
 * 
 * Location: utils/iso20022/addressValidator.ts
 * Purpose: Validate and format postal addresses for ISO 20022 payment messages
 * 
 * === PMPG COMPLIANCE ===
 * 
 * Required fields (minimum for hybrid format):
 * - country: ISO 3166-1 Alpha-2 Country Code
 * - townName: City/Town name
 * 
 * Recommended fields for structured format:
 * - streetName: Street address
 * - buildingNumber: Building/house number
 * - postCode: Postal/ZIP code
 * 
 * Timeline:
 * - November 2025: Hybrid format becomes available
 * - November 2026: Unstructured address lines retired
 */

import type {
  ISO20022PostalAddress,
  HybridPostalAddress,
  AddressValidationResult,
  ISO3166CountryCode,
} from '../../types/iso20022';

// ============================================================================
// ISO 3166-1 ALPHA-2 COUNTRY CODES (SADC + Common)
// ============================================================================

/**
 * Valid SADC and common international ISO 3166-1 Alpha-2 codes
 */
const VALID_COUNTRY_CODES: Set<string> = new Set([
  // SADC Countries
  'NA', 'ZA', 'BW', 'ZW', 'MZ', 'ZM', 'AO', 'TZ', 'MW', 'MU', 'SC', 'CD', 'MG', 'SZ', 'LS', 'KM',
  // Common International
  'US', 'GB', 'DE', 'FR', 'CN', 'IN', 'AE', 'AU', 'CA', 'JP', 'SG', 'HK', 'CH', 'NL', 'BE', 'AT',
  'IT', 'ES', 'PT', 'IE', 'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'HU', 'RO', 'GR', 'TR', 'RU', 'UA',
  'EG', 'NG', 'KE', 'GH', 'ET', 'MA', 'TN', 'SA', 'QA', 'KW', 'OM', 'BH', 'JO', 'LB', 'IL', 'PK',
  'BD', 'LK', 'TH', 'VN', 'ID', 'MY', 'PH', 'KR', 'TW', 'NZ', 'BR', 'AR', 'CL', 'CO', 'PE', 'MX',
]);

/**
 * Country code to country name mapping (common ones)
 */
export const COUNTRY_NAMES: Record<string, string> = {
  NA: 'Namibia',
  ZA: 'South Africa',
  BW: 'Botswana',
  ZW: 'Zimbabwe',
  MZ: 'Mozambique',
  ZM: 'Zambia',
  AO: 'Angola',
  TZ: 'Tanzania',
  MW: 'Malawi',
  MU: 'Mauritius',
  US: 'United States',
  GB: 'United Kingdom',
  DE: 'Germany',
  FR: 'France',
  CN: 'China',
  IN: 'India',
  AE: 'United Arab Emirates',
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate ISO 3166-1 Alpha-2 country code
 */
export function isValidCountryCode(code: string | undefined | null): code is ISO3166CountryCode {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  const normalized = code.toUpperCase().trim();
  
  // Must be exactly 2 uppercase letters
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return false;
  }
  
  // Check against known valid codes (or accept all 2-letter codes if not in strict mode)
  return VALID_COUNTRY_CODES.has(normalized);
}

/**
 * Validate town/city name
 */
export function isValidTownName(townName: string | undefined | null): boolean {
  if (!townName || typeof townName !== 'string') {
    return false;
  }
  
  const trimmed = townName.trim();
  
  // Must be 1-70 characters (ISO 20022 limit)
  if (trimmed.length < 1 || trimmed.length > 70) {
    return false;
  }
  
  // Should not contain only numbers or special characters
  if (/^[\d\s\-_.]+$/.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Validate street name
 */
export function isValidStreetName(streetName: string | undefined | null): boolean {
  if (!streetName) {
    return true; // Optional field
  }
  
  const trimmed = streetName.trim();
  
  // Max 70 characters (ISO 20022 limit)
  if (trimmed.length > 70) {
    return false;
  }
  
  return true;
}

/**
 * Validate building number
 */
export function isValidBuildingNumber(buildingNumber: string | undefined | null): boolean {
  if (!buildingNumber) {
    return true; // Optional field
  }
  
  const trimmed = buildingNumber.trim();
  
  // Max 16 characters (ISO 20022 limit)
  if (trimmed.length > 16) {
    return false;
  }
  
  return true;
}

/**
 * Validate post/ZIP code
 */
export function isValidPostCode(postCode: string | undefined | null): boolean {
  if (!postCode) {
    return true; // Optional field
  }
  
  const trimmed = postCode.trim();
  
  // Max 16 characters (ISO 20022 limit)
  if (trimmed.length > 16) {
    return false;
  }
  
  // Should be alphanumeric with optional spaces/dashes
  if (!/^[A-Za-z0-9\s\-]+$/.test(trimmed)) {
    return false;
  }
  
  return true;
}

/**
 * Validate complete ISO 20022 postal address
 */
export function validatePostalAddress(
  address: Partial<ISO20022PostalAddress> | null | undefined
): AddressValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!address) {
    return {
      isValid: false,
      errors: ['Address is required'],
      warnings: [],
    };
  }
  
  // Required: Country Code
  if (!address.country) {
    errors.push('Country code is required (ISO 3166-1 Alpha-2)');
  } else if (!isValidCountryCode(address.country)) {
    errors.push(`Invalid country code: "${address.country}". Must be ISO 3166-1 Alpha-2 format (e.g., "NA" for Namibia)`);
  }
  
  // Required: Town Name
  if (!address.townName) {
    errors.push('Town/City name is required');
  } else if (!isValidTownName(address.townName)) {
    errors.push('Invalid town name. Must be 1-70 characters');
  }
  
  // Recommended: Street Name
  if (!address.streetName) {
    warnings.push('Street name is recommended for structured addresses');
  } else if (!isValidStreetName(address.streetName)) {
    errors.push('Street name exceeds maximum length (70 characters)');
  }
  
  // Recommended: Building Number
  if (!address.buildingNumber) {
    warnings.push('Building number is recommended for structured addresses');
  } else if (!isValidBuildingNumber(address.buildingNumber)) {
    errors.push('Building number exceeds maximum length (16 characters)');
  }
  
  // Recommended: Post Code
  if (!address.postCode) {
    warnings.push('Post code is recommended for structured addresses');
  } else if (!isValidPostCode(address.postCode)) {
    errors.push('Invalid post code format');
  }
  
  // Validate optional fields
  if (address.districtName && address.districtName.length > 70) {
    errors.push('District name exceeds maximum length (70 characters)');
  }
  
  if (address.countrySubDivision && address.countrySubDivision.length > 70) {
    errors.push('Country sub-division exceeds maximum length (70 characters)');
  }
  
  const isValid = errors.length === 0;
  
  // Create normalized address if valid
  let normalizedAddress: ISO20022PostalAddress | undefined;
  if (isValid && address.country && address.townName) {
    normalizedAddress = normalizePostalAddress(address as ISO20022PostalAddress);
  }
  
  return {
    isValid,
    errors,
    warnings,
    normalizedAddress,
  };
}

/**
 * Validate hybrid postal address (transitional format)
 */
export function validateHybridAddress(
  address: Partial<HybridPostalAddress> | null | undefined
): AddressValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!address) {
    return {
      isValid: false,
      errors: ['Address is required'],
      warnings: [],
    };
  }
  
  // Required: Country Code
  if (!address.country) {
    errors.push('Country code is required');
  } else if (!isValidCountryCode(address.country)) {
    errors.push(`Invalid country code: "${address.country}"`);
  }
  
  // Required: Town Name
  if (!address.townName) {
    errors.push('Town/City name is required');
  } else if (!isValidTownName(address.townName)) {
    errors.push('Invalid town name');
  }
  
  // Check address lines (deprecated but allowed until November 2026)
  if (address.addressLine) {
    warnings.push('Unstructured address lines are deprecated and will be retired in November 2026. Please use structured fields.');
    
    if (address.addressLine.length > 7) {
      errors.push('Maximum 7 address lines allowed');
    }
    
    for (let i = 0; i < address.addressLine.length; i++) {
      if (address.addressLine[i].length > 70) {
        errors.push(`Address line ${i + 1} exceeds maximum length (70 characters)`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// NORMALIZATION FUNCTIONS
// ============================================================================

/**
 * Normalize country code to uppercase
 */
export function normalizeCountryCode(code: string): ISO3166CountryCode {
  return code.toUpperCase().trim() as ISO3166CountryCode;
}

/**
 * Normalize postal address
 */
export function normalizePostalAddress(address: ISO20022PostalAddress): ISO20022PostalAddress {
  return {
    country: normalizeCountryCode(address.country),
    townName: address.townName.trim(),
    streetName: address.streetName?.trim(),
    buildingNumber: address.buildingNumber?.trim(),
    buildingName: address.buildingName?.trim(),
    floor: address.floor?.trim(),
    postBox: address.postBox?.trim(),
    room: address.room?.trim(),
    postCode: address.postCode?.trim().toUpperCase(),
    districtName: address.districtName?.trim(),
    countrySubDivision: address.countrySubDivision?.trim(),
    department: address.department?.trim(),
    subDepartment: address.subDepartment?.trim(),
  };
}

/**
 * Convert structured address to single-line display format
 */
export function formatAddressForDisplay(address: ISO20022PostalAddress): string {
  const parts: string[] = [];
  
  // Building and street
  if (address.buildingNumber && address.streetName) {
    parts.push(`${address.buildingNumber} ${address.streetName}`);
  } else if (address.streetName) {
    parts.push(address.streetName);
  } else if (address.buildingNumber) {
    parts.push(address.buildingNumber);
  }
  
  // Town and post code
  if (address.townName && address.postCode) {
    parts.push(`${address.townName} ${address.postCode}`);
  } else if (address.townName) {
    parts.push(address.townName);
  }
  
  // Country
  const countryName = COUNTRY_NAMES[address.country] || address.country;
  parts.push(countryName);
  
  return parts.join(', ');
}

/**
 * Convert structured address to multi-line format
 */
export function formatAddressMultiLine(address: ISO20022PostalAddress): string[] {
  const lines: string[] = [];
  
  // Line 1: Building and street
  if (address.buildingNumber && address.streetName) {
    lines.push(`${address.buildingNumber} ${address.streetName}`);
  } else if (address.streetName) {
    lines.push(address.streetName);
  }
  
  // Line 2: District/suburb
  if (address.districtName) {
    lines.push(address.districtName);
  }
  
  // Line 3: Town/city and post code
  if (address.townName && address.postCode) {
    lines.push(`${address.townName} ${address.postCode}`);
  } else if (address.townName) {
    lines.push(address.townName);
  }
  
  // Line 4: Country sub-division (province/region)
  if (address.countrySubDivision) {
    lines.push(address.countrySubDivision);
  }
  
  // Line 5: Country
  const countryName = COUNTRY_NAMES[address.country] || address.country;
  lines.push(countryName);
  
  return lines;
}

// ============================================================================
// DEFAULTS AND HELPERS
// ============================================================================

/**
 * Create default Namibian address template
 */
export function createNamibianAddressTemplate(): ISO20022PostalAddress {
  return {
    country: 'NA',
    townName: '',
    streetName: '',
    buildingNumber: '',
    postCode: '',
  };
}

/**
 * Get country name from ISO code
 */
export function getCountryName(code: ISO3166CountryCode): string {
  return COUNTRY_NAMES[code] || code;
}

/**
 * Check if address has all recommended fields
 */
export function isFullyStructuredAddress(address: ISO20022PostalAddress): boolean {
  return Boolean(
    address.country &&
    address.townName &&
    address.streetName &&
    address.buildingNumber &&
    address.postCode
  );
}

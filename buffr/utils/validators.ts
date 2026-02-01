/**
 * Data Validation Utilities
 * 
 * Location: utils/validators.ts
 * Purpose: Centralized validation functions for data quality checks
 * 
 * Features:
 * - Amount validation (positive, max limits, decimal precision)
 * - Currency validation (ISO 4217 codes)
 * - Phone number validation (Namibia format)
 * - Email validation
 * - String length validation
 * - UUID validation
 * - Date validation
 */

/**
 * Validate amount (positive number, max limit, decimal precision)
 */
export function validateAmount(
  amount: any,
  options: {
    min?: number;
    max?: number;
    allowZero?: boolean;
    maxDecimals?: number;
  } = {}
): { valid: boolean; error?: string } {
  const { min = 0.01, max = 1000000, allowZero = false, maxDecimals = 2 } = options;

  // Check if amount is a number
  if (typeof amount !== 'number' || isNaN(amount)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  // Check if amount is finite
  if (!isFinite(amount)) {
    return { valid: false, error: 'Amount must be a finite number' };
  }

  // Check if amount is zero (if not allowed)
  if (!allowZero && amount === 0) {
    return { valid: false, error: 'Amount must be greater than zero' };
  }

  // Check minimum (skip if allowZero is true and amount is 0)
  if (amount !== 0 && amount < min) {
    return { valid: false, error: `Amount must be at least ${min}` };
  }

  // Check maximum
  if (amount > max) {
    return { valid: false, error: `Amount cannot exceed ${max}` };
  }

  // Check decimal places
  const amountStr = amount.toString();
  const decimalIndex = amountStr.indexOf('.');
  if (decimalIndex !== -1) {
    const decimals = amountStr.length - decimalIndex - 1;
    if (decimals > maxDecimals) {
      return { valid: false, error: `Amount cannot have more than ${maxDecimals} decimal places` };
    }
  }

  return { valid: true };
}

/**
 * Validate currency code (ISO 4217)
 */
export function validateCurrency(currency: any): { valid: boolean; error?: string } {
  if (typeof currency !== 'string') {
    return { valid: false, error: 'Currency must be a string' };
  }

  // Common currencies for Namibia
  const validCurrencies = ['NAD', 'USD', 'EUR', 'GBP', 'ZAR', 'BWP', 'CNY', 'JPY', 'AUD'];
  
  // Also accept N$ as alias for NAD
  if (currency === 'N$' || currency === 'NAD') {
    return { valid: true };
  }

  if (!validCurrencies.includes(currency.toUpperCase())) {
    return { valid: false, error: `Invalid currency code: ${currency}. Must be ISO 4217 format (e.g., NAD, USD, EUR)` };
  }

  return { valid: true };
}

/**
 * Validate Namibia phone number format
 * Accepts: +264XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)
 */
export function validateNamibiaPhone(phoneNumber: any): { valid: boolean; error?: string; normalized?: string } {
  if (typeof phoneNumber !== 'string') {
    return { valid: false, error: 'Phone number must be a string' };
  }

  // Remove whitespace
  const cleaned = phoneNumber.replace(/\s+/g, '');

  // Namibia phone regex: +264 or 0 followed by 9 digits
  const phoneRegex = /^(\+264|0)[0-9]{9}$/;

  if (!phoneRegex.test(cleaned)) {
    return { 
      valid: false, 
      error: 'Invalid Namibia phone number format. Must be +264XXXXXXXXX or 0XXXXXXXXX (9 digits after prefix)' 
    };
  }

  // Normalize to +264 format
  let normalized = cleaned;
  if (cleaned && cleaned.startsWith('0')) {
    normalized = '+264' + cleaned.substring(1);
  }

  return { valid: true, normalized };
}

/**
 * Validate email address
 */
export function validateEmail(email: any): { valid: boolean; error?: string } {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email must be a string' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email address format' };
  }

  // Check length
  if (email.length > 254) {
    return { valid: false, error: 'Email address is too long (max 254 characters)' };
  }

  return { valid: true };
}

/**
 * Validate string length
 */
export function validateStringLength(
  value: any,
  options: {
    min?: number;
    max?: number;
    fieldName?: string;
    allowEmpty?: boolean;
  } = {}
): { valid: boolean; error?: string } {
  const { min = 1, max = 1000, fieldName = 'Field', allowEmpty = false } = options;

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }

  if (!allowEmpty && value.trim().length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  // Skip min check if allowEmpty is true and value is empty
  if (value.trim().length > 0 && value.length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }

  if (value.length > max) {
    return { valid: false, error: `${fieldName} cannot exceed ${max} characters` };
  }

  return { valid: true };
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: any): { valid: boolean; error?: string } {
  if (typeof uuid !== 'string') {
    return { valid: false, error: 'UUID must be a string' };
  }

  // UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }

  return { valid: true };
}

/**
 * Validate date (ISO string or Date object)
 */
export function validateDate(date: any): { valid: boolean; error?: string; parsedDate?: Date } {
  if (!date) {
    return { valid: false, error: 'Date is required' };
  }

  let parsedDate: Date;

  if (date instanceof Date) {
    parsedDate = date;
  } else if (typeof date === 'string') {
    parsedDate = new Date(date);
  } else {
    return { valid: false, error: 'Date must be a Date object or ISO string' };
  }

  if (isNaN(parsedDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  return { valid: true, parsedDate };
}

/**
 * Validate card number (basic Luhn check)
 */
export function validateCardNumber(cardNumber: any): { valid: boolean; error?: string } {
  if (typeof cardNumber !== 'string') {
    return { valid: false, error: 'Card number must be a string' };
  }

  // Remove spaces and dashes
  const cleaned = cardNumber.replace(/[\s-]/g, '');

  // Check if all digits
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Card number must contain only digits' };
  }

  // Check length (13-19 digits for most cards)
  if (cleaned.length < 13 || cleaned.length > 19) {
    return { valid: false, error: 'Card number must be between 13 and 19 digits' };
  }

  // Luhn algorithm check
  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Invalid card number (Luhn check failed)' };
  }

  return { valid: true };
}

/**
 * Validate card expiry date (MM/YY format)
 */
export function validateCardExpiry(expiryMonth: any, expiryYear: any): { valid: boolean; error?: string } {
  if (typeof expiryMonth !== 'number' || typeof expiryYear !== 'number') {
    return { valid: false, error: 'Expiry month and year must be numbers' };
  }

  if (expiryMonth < 1 || expiryMonth > 12) {
    return { valid: false, error: 'Expiry month must be between 1 and 12' };
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Convert 2-digit year to 4-digit
  const fullYear = expiryYear < 100 ? 2000 + expiryYear : expiryYear;

  if (fullYear < currentYear || (fullYear === currentYear && expiryMonth < currentMonth)) {
    return { valid: false, error: 'Card has expired' };
  }

  return { valid: true };
}

/**
 * Validate CVV (3-4 digits)
 */
export function validateCVV(cvv: any): { valid: boolean; error?: string } {
  if (typeof cvv !== 'string' && typeof cvv !== 'number') {
    return { valid: false, error: 'CVV must be a string or number' };
  }

  const cvvStr = cvv.toString().trim();

  if (!/^\d{3,4}$/.test(cvvStr)) {
    return { valid: false, error: 'CVV must be 3 or 4 digits' };
  }

  return { valid: true };
}

/**
 * Validate transaction type
 */
export function validateTransactionType(type: any): { valid: boolean; error?: string } {
  const validTypes = ['sent', 'received', 'payment', 'transfer', 'request', 'deposit', 'withdrawal'];
  
  if (typeof type !== 'string') {
    return { valid: false, error: 'Transaction type must be a string' };
  }

  if (!validTypes.includes(type.toLowerCase())) {
    return { valid: false, error: `Invalid transaction type: ${type}. Must be one of: ${validTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate wallet type
 */
export function validateWalletType(type: any): { valid: boolean; error?: string } {
  const validTypes = ['personal', 'business', 'savings', 'investment', 'bills', 'travel', 'budget'];
  
  if (typeof type !== 'string') {
    return { valid: false, error: 'Wallet type must be a string' };
  }

  if (!validTypes.includes(type.toLowerCase())) {
    return { valid: false, error: `Invalid wallet type: ${type}. Must be one of: ${validTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate PIN (4-6 digits for transaction PIN)
 */
export function validatePIN(pin: any, options: { minLength?: number; maxLength?: number } = {}): { valid: boolean; error?: string } {
  const { minLength = 4, maxLength = 6 } = options;

  if (typeof pin !== 'string' && typeof pin !== 'number') {
    return { valid: false, error: 'PIN must be a string or number' };
  }

  const pinStr = pin.toString().trim();

  if (!/^\d+$/.test(pinStr)) {
    return { valid: false, error: 'PIN must contain only digits' };
  }

  if (pinStr.length < minLength || pinStr.length > maxLength) {
    return { valid: false, error: `PIN must be between ${minLength} and ${maxLength} digits` };
  }

  return { valid: true };
}

/**
 * Validate voucher type
 */
export function validateVoucherType(type: any): { valid: boolean; error?: string } {
  const validTypes = ['government', 'electricity', 'water', 'other'];
  
  if (typeof type !== 'string') {
    return { valid: false, error: 'Voucher type must be a string' };
  }

  if (!validTypes.includes(type.toLowerCase())) {
    return { valid: false, error: `Invalid voucher type: ${type}. Must be one of: ${validTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate voucher redemption method
 */
export function validateRedemptionMethod(method: any): { valid: boolean; error?: string } {
  const validMethods = ['wallet', 'cash_out', 'bank_transfer', 'merchant_payment'];
  
  if (typeof method !== 'string') {
    return { valid: false, error: 'Redemption method must be a string' };
  }

  if (!validMethods.includes(method.toLowerCase())) {
    return { valid: false, error: `Invalid redemption method: ${method}. Must be one of: ${validMethods.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Validate NamQR code format (basic structure check)
 */
export function validateNamQRFormat(qrCode: any): { valid: boolean; error?: string } {
  if (typeof qrCode !== 'string') {
    return { valid: false, error: 'NamQR code must be a string' };
  }

  // NamQR uses TLV format, should start with tag "00" (Payload Format Indicator)
  if (!qrCode.trim().startsWith('00')) {
    return { valid: false, error: 'Invalid NamQR format. Must start with TLV tag "00"' };
  }

  // Basic length check (NamQR codes are typically 100+ characters)
  if (qrCode.length < 50) {
    return { valid: false, error: 'NamQR code appears too short. Minimum length is 50 characters' };
  }

  // Check for basic TLV structure (tag-length-value pattern)
  // Tags are 2 digits, lengths are 2 digits
  const tlvPattern = /^\d{2}\d{2}/;
  if (!tlvPattern.test(qrCode.trim())) {
    return { valid: false, error: 'Invalid NamQR TLV structure' };
  }

  return { valid: true };
}

/**
 * Validate bank account number (basic format check)
 */
export function validateBankAccount(accountNumber: any, bankName?: string): { valid: boolean; error?: string } {
  if (typeof accountNumber !== 'string') {
    return { valid: false, error: 'Bank account number must be a string' };
  }

  const cleaned = accountNumber.replace(/[\s-]/g, '');

  // Basic validation: 8-20 digits (varies by bank)
  if (!/^\d{8,20}$/.test(cleaned)) {
    return { valid: false, error: 'Bank account number must be 8-20 digits' };
  }

  return { valid: true };
}

/**
 * Validate bank name
 */
export function validateBankName(bankName: any): { valid: boolean; error?: string } {
  if (typeof bankName !== 'string') {
    return { valid: false, error: 'Bank name must be a string' };
  }

  // Common Namibian banks
  const validBanks = [
    'Bank of Namibia',
    'First National Bank',
    'Standard Bank',
    'Nedbank',
    'Bank Windhoek',
    'Letshego Bank',
    'Trustco Bank',
  ];

  const normalized = bankName.trim();
  if (normalized.length < 3) {
    return { valid: false, error: 'Bank name must be at least 3 characters' };
  }

  // Check if it's a known bank (case-insensitive)
  const isKnownBank = validBanks.some(bank => 
    normalized.toLowerCase().includes(bank.toLowerCase()) ||
    bank.toLowerCase().includes(normalized.toLowerCase())
  );

  if (!isKnownBank && normalized.length < 5) {
    return { valid: false, error: 'Bank name appears invalid. Please use the full bank name' };
  }

  return { valid: true };
}

/**
 * Validate year (for compliance reporting)
 */
export function validateYear(year: any): { valid: boolean; error?: string; parsedYear?: number } {
  if (typeof year !== 'number' && typeof year !== 'string') {
    return { valid: false, error: 'Year must be a number or string' };
  }

  const yearNum = typeof year === 'string' ? parseInt(year, 10) : year;

  if (isNaN(yearNum)) {
    return { valid: false, error: 'Year must be a valid number' };
  }

  const currentYear = new Date().getFullYear();
  const minYear = 2020; // Reasonable minimum for the system

  if (yearNum < minYear || yearNum > currentYear + 1) {
    return { valid: false, error: `Year must be between ${minYear} and ${currentYear + 1}` };
  }

  return { valid: true, parsedYear: yearNum };
}

/**
 * Validate month (1-12)
 */
export function validateMonth(month: any): { valid: boolean; error?: string; parsedMonth?: number } {
  if (typeof month !== 'number' && typeof month !== 'string') {
    return { valid: false, error: 'Month must be a number or string' };
  }

  const monthNum = typeof month === 'string' ? parseInt(month, 10) : month;

  if (isNaN(monthNum)) {
    return { valid: false, error: 'Month must be a valid number' };
  }

  if (monthNum < 1 || monthNum > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }

  return { valid: true, parsedMonth: monthNum };
}

/**
 * Validate trust account balance (must be positive or zero)
 */
export function validateTrustAccountBalance(balance: any): { valid: boolean; error?: string; parsedBalance?: number } {
  if (typeof balance !== 'number' && typeof balance !== 'string') {
    return { valid: false, error: 'Trust account balance must be a number or string' };
  }

  const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;

  if (isNaN(balanceNum) || !isFinite(balanceNum)) {
    return { valid: false, error: 'Trust account balance must be a valid number' };
  }

  if (balanceNum < 0) {
    return { valid: false, error: 'Trust account balance cannot be negative' };
  }

  return { valid: true, parsedBalance: balanceNum };
}

/**
 * Validate multiple fields at once (returns all errors)
 */
export function validateFields(
  fields: Record<string, { value: any; validator: (value: any) => { valid: boolean; error?: string } }>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  let allValid = true;

  for (const [fieldName, { value, validator }] of Object.entries(fields)) {
    const result = validator(value);
    if (!result.valid) {
      errors[fieldName] = result.error || 'Validation failed';
      allValid = false;
    }
  }

  return { valid: allValid, errors };
}


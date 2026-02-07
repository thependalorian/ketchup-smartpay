/**
 * Validation Utilities
 */

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Namibian phone number
 */
export const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 || (cleaned.length === 12 && cleaned.startsWith('264'));
};

/**
 * Validate Namibian ID number
 */
export const validateNationalID = (id: string): boolean => {
  // Namibian ID format: YYMMDDXXXXXXX (13 digits)
  const idRegex = /^\d{13}$/;
  return idRegex.test(id);
};

/**
 * Validate amount (positive number)
 */
export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0 && !isNaN(amount);
};

/**
 * Validate voucher code format
 */
export const validateVoucherCode = (code: string): boolean => {
  // Format: XXX-XXXX-XXXX (alphanumeric)
  const voucherRegex = /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return voucherRegex.test(code);
};

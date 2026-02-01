/**
 * NAMQR CRC-16 Calculation Utility
 * 
 * Implements CRC-16 calculation per ISO/IEC 13239 for NAMQR code validation.
 * Uses polynomial 0x1021 (hex) and initial value 0xFFFF (hex).
 * 
 * @file utils/namqr/crc.ts
 * @version 1.0
 */

import { CRC_POLYNOMIAL, CRC_INITIAL_VALUE } from '../../types/namqr';
import logger from '@/utils/logger';

/**
 * Calculate CRC-16 checksum per ISO/IEC 13239
 * 
 * @param data - The string data to calculate CRC for
 * @returns The CRC-16 checksum as a 4-character uppercase hex string
 */
export function calculateCRC16(data: string): string {
  let crc = CRC_INITIAL_VALUE;
  
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    crc ^= (charCode << 8);
    
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ CRC_POLYNOMIAL) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  
  // Convert to 4-character uppercase hex string
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Validate CRC-16 checksum of a NAMQR code string
 * 
 * @param qrString - The complete NAMQR string including CRC
 * @returns Object with validation result and expected CRC
 */
export function validateCRC16(qrString: string): {
  isValid: boolean;
  expectedCrc: string;
  actualCrc: string;
} {
  // CRC is always the last 4 characters (tag 63 is always last)
  // Format: "6304XXXX" where XXXX is the CRC
  const crcTagIndex = qrString.lastIndexOf('6304');
  
  if (crcTagIndex === -1) {
    return {
      isValid: false,
      expectedCrc: '',
      actualCrc: 'CRC tag (63) not found',
    };
  }
  
  const dataWithoutCrcValue = qrString.substring(0, crcTagIndex + 4);
  const actualCrc = qrString.substring(crcTagIndex + 4, crcTagIndex + 8);
  const expectedCrc = calculateCRC16(dataWithoutCrcValue);
  
  return {
    isValid: actualCrc.toUpperCase() === expectedCrc,
    expectedCrc,
    actualCrc: actualCrc.toUpperCase(),
  };
}

/**
 * Append CRC-16 to a NAMQR code string
 * 
 * @param dataWithoutCrc - NAMQR string without CRC (ends with "6304")
 * @returns Complete NAMQR string with CRC appended
 */
export function appendCRC16(dataWithoutCrc: string): string {
  // Ensure the string ends with "6304" (CRC tag with length)
  let data = dataWithoutCrc;
  if (!data.endsWith('6304')) {
    data += '6304';
  }
  
  const crc = calculateCRC16(data);
  return data + crc;
}

/**
 * Build CRC tag (63) with calculated value
 * 
 * @param data - NAMQR data to calculate CRC for (without CRC tag)
 * @returns Complete CRC tag string "6304XXXX"
 */
export function buildCRCTag(data: string): string {
  const dataWithTag = data + '6304';
  const crc = calculateCRC16(dataWithTag);
  return '6304' + crc;
}

/**
 * Example NAMQR CRC calculation
 * 
 * For a QR string: "00020101021226500016na.com.operator.IPP0125user@bank.na5204000053035165802NA5910John Doe6008Windhoek6304"
 * The CRC would be calculated and appended: "6304XXXX"
 */
export function exampleCRCCalculation(): void {
  const sampleData = '00020101021226500016na.com.operator.IPP0125user@bank.na5204000053035165802NA5910John Doe6008Windhoek';
  const crcTag = buildCRCTag(sampleData);
  logger.info(`Sample NAMQR with CRC: ${sampleData}${crcTag}`);
}

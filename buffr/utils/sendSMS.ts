/**
 * Send SMS Notification Helper
 * 
 * Location: utils/sendSMS.ts
 * Purpose: Send SMS notifications via SMS gateway (Africa's Talking, Twilio, or MTC/Telecom Namibia)
 * 
 * PRD Requirement: FR1.4 - SMS notifications always sent for all vouchers (all users, regardless of device type)
 * 
 * Integration Options:
 * - Africa's Talking (recommended for Africa coverage)
 * - Twilio (global coverage)
 * - MTC/Telecom Namibia (direct operator integration)
 */

import { log } from '@/utils/logger';

export interface SendSMSOptions {
  /** Phone number (Namibian format: +264...) */
  phoneNumber: string;
  /** SMS message (max 160 characters for single SMS) */
  message: string;
  /** Sender ID (default: 'BUFFR') */
  senderId?: string;
  /** Priority (default: 'normal') */
  priority?: 'low' | 'normal' | 'high';
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Format phone number to Namibian format (+264...)
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If starts with 0, replace with +264
  if (cleaned.startsWith('0')) {
    cleaned = '264' + cleaned.substring(1);
  }
  
  // If doesn't start with 264, add it
  if (!cleaned.startsWith('264')) {
    cleaned = '264' + cleaned;
  }
  
  return '+' + cleaned;
}

/**
 * Send SMS notification
 * 
 * PRD FR1.4: SMS notifications always sent for all vouchers (all users, regardless of device type)
 */
export async function sendSMS(options: SendSMSOptions): Promise<SendSMSResponse> {
  const formattedNumber = formatPhoneNumber(options.phoneNumber);
  const message = options.message.substring(0, 160); // SMS limit
  const senderId = options.senderId || 'BUFFR';

  // Check which SMS gateway is configured
  const gateway = process.env.SMS_GATEWAY || 'africas_talking'; // 'africas_talking' | 'twilio' | 'mtc' | 'telecom_namibia'

  try {
    switch (gateway) {
      case 'africas_talking':
        return await sendViaAfricasTalking(formattedNumber, message, senderId);
      
      case 'twilio':
        return await sendViaTwilio(formattedNumber, message, senderId);
      
      case 'mtc':
      case 'telecom_namibia':
        // Direct operator integration (requires API access)
        log.warn('Direct operator SMS integration not yet implemented');
        return {
          success: false,
          error: 'Direct operator SMS integration pending',
        };
      
      default:
        log.warn('SMS gateway not configured - message not sent', {
          phoneNumber: formattedNumber,
          gateway,
        });
        return {
          success: false,
          error: 'SMS gateway not configured',
        };
    }
  } catch (error: any) {
    log.error('SMS send error', {
      phoneNumber: formattedNumber,
      error: error.message,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send SMS via Africa's Talking
 */
async function sendViaAfricasTalking(
  phoneNumber: string,
  message: string,
  senderId: string
): Promise<SendSMSResponse> {
  const apiKey = process.env.AFRICAS_TALKING_API_KEY;
  const apiUsername = process.env.AFRICAS_TALKING_USERNAME;
  const apiUrl = process.env.AFRICAS_TALKING_API_URL || 'https://api.africastalking.com/version1/messaging';

  if (!apiKey || !apiUsername) {
    log.warn("Africa's Talking credentials not configured");
    return {
      success: false,
      error: 'SMS gateway credentials not configured',
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('username', apiUsername);
    formData.append('to', phoneNumber);
    formData.append('message', message);
    formData.append('from', senderId);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error(`SMS API error: ${response.status}`);
    }

    const result = await response.json();
    const smsData = result.SMSMessageData || {};
    const recipients = smsData.Recipients || [];

    if (recipients.length > 0 && recipients[0].status === 'Success') {
      log.info('SMS sent successfully', {
        phoneNumber,
        messageId: recipients[0].messageId,
      });
      return {
        success: true,
        messageId: recipients[0].messageId,
      };
    } else {
      const error = recipients[0]?.status || 'Unknown error';
      log.error('SMS send failed', {
        phoneNumber,
        error,
      });
      return {
        success: false,
        error,
      };
    }
  } catch (error: any) {
    log.error('Africa\'s Talking SMS error', {
      phoneNumber,
      error: error.message,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send SMS via Twilio
 */
async function sendViaTwilio(
  phoneNumber: string,
  message: string,
  senderId: string
): Promise<SendSMSResponse> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER || senderId;

  if (!accountSid || !authToken) {
    log.warn('Twilio credentials not configured');
    return {
      success: false,
      error: 'SMS gateway credentials not configured',
    };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phoneNumber,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Twilio API error: ${error}`);
    }

    const result = await response.json();
    log.info('SMS sent successfully via Twilio', {
      phoneNumber,
      messageId: result.sid,
    });
    return {
      success: true,
      messageId: result.sid,
    };
  } catch (error: any) {
    log.error('Twilio SMS error', {
      phoneNumber,
      error: error.message,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send voucher notification SMS
 * PRD FR1.4: SMS notification always sent when voucher received
 */
export async function sendVoucherSMS(
  phoneNumber: string,
  voucherDetails: {
    amount: number;
    grantType?: string;
    voucherId: string;
    expiryDate?: Date;
  }
): Promise<SendSMSResponse> {
  const expiryText = voucherDetails.expiryDate
    ? ` Expires: ${new Date(voucherDetails.expiryDate).toLocaleDateString('en-NA')}`
    : '';
  
  const message = `BUFFR: You received a ${voucherDetails.grantType || 'government'} voucher for N$${voucherDetails.amount}.${expiryText} Dial *123# to manage.`;

  return sendSMS({
    phoneNumber,
    message,
    priority: 'high',
  });
}

/**
 * Send transaction confirmation SMS
 */
export async function sendTransactionSMS(
  phoneNumber: string,
  transactionDetails: {
    type: 'sent' | 'received';
    amount: number;
    counterparty?: string;
  }
): Promise<SendSMSResponse> {
  const typeText = transactionDetails.type === 'sent' ? 'sent' : 'received';
  const counterpartyText = transactionDetails.counterparty
    ? ` to/from ${transactionDetails.counterparty}`
    : '';
  
  const message = `BUFFR: You ${typeText} N$${transactionDetails.amount}${counterpartyText}. Dial *123# for balance.`;

  return sendSMS({
    phoneNumber,
    message,
    priority: 'normal',
  });
}

/**
 * Send voucher expiry warning SMS
 * PRD Gap Analysis: Proactive expiry warnings to prevent beneficiary loss
 */
export async function sendVoucherExpirySMS(
  phoneNumber: string,
  voucherDetails: {
    voucherId: string;
    amount: number;
    grantType?: string;
    expiryDate: Date;
    daysUntilExpiry: number;
  }
): Promise<SendSMSResponse> {
  const daysText = voucherDetails.daysUntilExpiry === 1 
    ? 'tomorrow' 
    : `in ${voucherDetails.daysUntilExpiry} days`;
  
  const expiryDateStr = new Date(voucherDetails.expiryDate).toLocaleDateString('en-NA');
  
  const message = `BUFFR: Your N$${voucherDetails.amount} voucher expires ${daysText} (${expiryDateStr}). Redeem now! Dial *123# → Vouchers → Redeem.`;

  return sendSMS({
    phoneNumber,
    message,
    priority: 'high',
  });
}

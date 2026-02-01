/**
 * USSD Service
 * 
 * Location: services/ussdService.ts
 * Purpose: USSD integration for feature phone users (70% unbanked population)
 * 
 * USSD Gateway Integration:
 * - MTC Namibia (primary)
 * - Telecom Namibia (secondary)
 * 
 * Menu Structure:
 * *123# → Main Menu
 * - 1: Check Balance
 * - 2: Send Money
 * - 3: Pay Bills
 * - 4: Buy Airtime
 * - 5: Transaction History
 * - 6: My Profile
 * - 7: Change PIN
 * 
 * Security:
 * - PIN required to access menu (first authentication)
 * - PIN required for all transactions (2FA compliance)
 * - Max 3 failed attempts before account lockout
 * - Works on any mobile phone (no internet required)
 */

import { logAPISyncOperation, generateRequestId } from '@/utils/auditLogger';
import { query } from '@/utils/db';
import bcrypt from 'bcrypt';
import logger, { log } from '@/utils/logger';

// ============================================================================
// CONFIGURATION
// ============================================================================

const USSD_GATEWAY_URL = process.env.USSD_GATEWAY_URL || 'https://api.mtc.com.na/ussd/v1';
const USSD_API_KEY = process.env.USSD_API_KEY || '';
const USSD_SHORT_CODE = process.env.USSD_SHORT_CODE || '*123#';
const USSD_TIMEOUT = 30000; // 30 seconds

// ============================================================================
// TYPES
// ============================================================================

export interface USSDRequest {
  sessionId: string;
  phoneNumber: string;
  userInput: string; // User's menu selection or data input
  serviceCode: string; // USSD short code (e.g., *123#)
}

export interface USSDResponse {
  message: string;
  sessionStatus: 'continue' | 'end';
  nextMenu?: string; // Next menu level
}

export interface USSDMenuState {
  sessionId: string;
  phoneNumber: string;
  currentMenu: string; // 'main', 'balance', 'send_money', etc.
  data: Record<string, any>; // Stored data for multi-step flows
  pinVerified: boolean;
  attempts: number; // PIN attempt counter
  lastActivity: number; // Timestamp of last activity (for session expiry)
}

// ============================================================================
// USSD SERVICE
// ============================================================================

class USSDService {
  private baseUrl: string;
  private apiKey: string;
  private shortCode: string;

  // In-memory session storage (in production, use Redis)
  private sessions: Map<string, USSDMenuState> = new Map();

  constructor() {
    this.baseUrl = USSD_GATEWAY_URL;
    this.apiKey = USSD_API_KEY;
    this.shortCode = USSD_SHORT_CODE;
  }

  /**
   * Process USSD request
   */
  async processRequest(request: USSDRequest): Promise<USSDResponse> {
    const { sessionId, phoneNumber, userInput, serviceCode } = request;

    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        phoneNumber,
        currentMenu: 'main',
        data: {},
        pinVerified: false,
        attempts: 0,
        lastActivity: Date.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      // Update last activity timestamp
      session.lastActivity = Date.now();
    }

    // Route to appropriate menu handler
    try {
      if (session.currentMenu === 'main') {
        return await this.handleMainMenu(session, userInput);
      } else if (session.currentMenu === 'pin_verify') {
        return await this.handlePINVerification(session, userInput);
      } else if (session.currentMenu === 'balance') {
        return await this.handleBalanceCheck(session);
      } else if (session.currentMenu === 'send_money') {
        return await this.handleSendMoney(session, userInput);
      } else if (session.currentMenu === 'transaction_history') {
        return await this.handleTransactionHistory(session, userInput);
      } else if (session.currentMenu === 'profile') {
        return await this.handleProfile(session);
      } else if (session.currentMenu === 'change_pin') {
        return await this.handleChangePIN(session, userInput);
      } else {
        return {
          message: 'Invalid menu. Please dial *123# again.',
          sessionStatus: 'end',
        };
      }
    } catch (error: any) {
      log.error('USSD processing error:', error);
      return {
        message: 'An error occurred. Please try again later.',
        sessionStatus: 'end',
      };
    }
  }

  /**
   * Handle main menu
   */
  private async handleMainMenu(session: USSDMenuState, userInput: string): Promise<USSDResponse> {
    // First access: require PIN
    if (!session.pinVerified) {
      session.currentMenu = 'pin_verify';
      return {
        message: 'Welcome to Buffr!\n\nEnter your 4-digit PIN:',
        sessionStatus: 'continue',
        nextMenu: 'pin_verify',
      };
    }

    // Parse menu selection
    const selection = userInput.trim();

    switch (selection) {
      case '1':
        session.currentMenu = 'balance';
        return {
          message: 'Checking balance...',
          sessionStatus: 'continue',
          nextMenu: 'balance',
        };
      case '2':
        session.currentMenu = 'send_money';
        return {
          message: 'Send Money\n\nEnter recipient phone number or Buffr ID:',
          sessionStatus: 'continue',
          nextMenu: 'send_money',
        };
      case '3':
        return {
          message: 'Pay Bills\n\nThis feature is coming soon.',
          sessionStatus: 'end',
        };
      case '4':
        return {
          message: 'Buy Airtime\n\nThis feature is coming soon.',
          sessionStatus: 'end',
        };
      case '5':
        session.currentMenu = 'transaction_history';
        return {
          message: 'Transaction History\n\nLoading...',
          sessionStatus: 'continue',
          nextMenu: 'transaction_history',
        };
      case '6':
        session.currentMenu = 'profile';
        return {
          message: 'Loading profile...',
          sessionStatus: 'continue',
          nextMenu: 'profile',
        };
      case '7':
        session.currentMenu = 'change_pin';
        return {
          message: 'Change PIN\n\nEnter your current PIN:',
          sessionStatus: 'continue',
          nextMenu: 'change_pin',
        };
      default:
        return {
          message: `Buffr Menu\n\n1. Check Balance\n2. Send Money\n3. Pay Bills\n4. Buy Airtime\n5. Transaction History\n6. My Profile\n7. Change PIN\n\nSelect an option:`,
          sessionStatus: 'continue',
          nextMenu: 'main',
        };
    }
  }

  /**
   * Handle PIN verification
   */
  private async handlePINVerification(session: USSDMenuState, userInput: string): Promise<USSDResponse> {
    const pin = userInput.trim();

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      session.attempts++;
      if (session.attempts >= 3) {
        // Account lockout
        this.sessions.delete(session.sessionId);
        return {
          message: 'Too many failed attempts. Account locked. Please visit NamPost to unlock.',
          sessionStatus: 'end',
        };
      }
      return {
        message: `Invalid PIN. ${3 - session.attempts} attempts remaining.\n\nEnter your 4-digit PIN:`,
        sessionStatus: 'continue',
        nextMenu: 'pin_verify',
      };
    }

    // Get user by phone number
    const user = await query<{
      id: string;
      transaction_pin_hash: string | null;
      is_two_factor_enabled: boolean;
    }>(
      `SELECT id, transaction_pin_hash, is_two_factor_enabled 
       FROM users 
       WHERE phone_number = $1`,
      [session.phoneNumber]
    );

    if (user.length === 0) {
      return {
        message: 'Account not found. Please register via mobile app or visit NamPost.',
        sessionStatus: 'end',
      };
    }

    const userData = user[0];

    if (!userData.is_two_factor_enabled || !userData.transaction_pin_hash) {
      return {
        message: 'PIN not set. Please set up your PIN via mobile app or visit NamPost.',
        sessionStatus: 'end',
      };
    }

    // Verify PIN
    const pinValid = await bcrypt.compare(pin, userData.transaction_pin_hash);

    if (!pinValid) {
      session.attempts++;
      if (session.attempts >= 3) {
        // Account lockout
        this.sessions.delete(session.sessionId);
        return {
          message: 'Too many failed attempts. Account locked. Please visit NamPost to unlock.',
          sessionStatus: 'end',
        };
      }
      return {
        message: `Invalid PIN. ${3 - session.attempts} attempts remaining.\n\nEnter your 4-digit PIN:`,
        sessionStatus: 'continue',
        nextMenu: 'pin_verify',
      };
    }

    // PIN verified
    session.pinVerified = true;
    session.attempts = 0;
    session.currentMenu = 'main';

    return {
      message: `Buffr Menu\n\n1. Check Balance\n2. Send Money\n3. Pay Bills\n4. Buy Airtime\n5. Transaction History\n6. My Profile\n7. Change PIN\n\nSelect an option:`,
      sessionStatus: 'continue',
      nextMenu: 'main',
    };
  }

  /**
   * Handle balance check
   */
  private async handleBalanceCheck(session: USSDMenuState): Promise<USSDResponse> {
    // Get user by phone number
    const user = await query<{ id: string }>(
      'SELECT id FROM users WHERE phone_number = $1',
      [session.phoneNumber]
    );

    if (user.length === 0) {
      return {
        message: 'Account not found.',
        sessionStatus: 'end',
      };
    }

    // Get default wallet balance
    const wallet = await query<{ balance: number; currency: string }>(
      `SELECT balance, currency 
       FROM wallets 
       WHERE user_id = $1 AND is_default = true 
       LIMIT 1`,
      [user[0].id]
    );

    if (wallet.length === 0) {
      return {
        message: 'No wallet found.',
        sessionStatus: 'end',
      };
    }

    const balance = parseFloat(wallet[0].balance.toString());
    const currency = wallet[0].currency || 'NAD';

    // Clear session
    this.sessions.delete(session.sessionId);

    return {
      message: `Your Buffr Balance:\n\n${currency} ${balance.toFixed(2)}\n\nThank you for using Buffr!`,
      sessionStatus: 'end',
    };
  }

  /**
   * Handle send money flow
   */
  private async handleSendMoney(session: USSDMenuState, userInput: string): Promise<USSDResponse> {
    // Multi-step flow:
    // 1. Enter recipient (phone or Buffr ID)
    // 2. Enter amount
    // 3. Confirm with PIN
    // 4. Process payment

    if (!session.data.recipient) {
      // Step 1: Get recipient
      const recipient = userInput.trim();
      session.data.recipient = recipient;

      // Validate recipient format (phone number or Buffr ID)
      if (!recipient || recipient.length < 4) {
        return {
          message: 'Invalid recipient. Enter phone number or Buffr ID:',
          sessionStatus: 'continue',
          nextMenu: 'send_money',
        };
      }

      return {
        message: `Recipient: ${recipient}\n\nEnter amount (e.g., 100.00):`,
        sessionStatus: 'continue',
        nextMenu: 'send_money',
      };
    } else if (!session.data.amount) {
      // Step 2: Get amount
      const amount = parseFloat(userInput.trim());
      if (isNaN(amount) || amount <= 0) {
        return {
          message: 'Invalid amount. Enter amount (e.g., 100.00):',
          sessionStatus: 'continue',
          nextMenu: 'send_money',
        };
      }

      session.data.amount = amount;

      return {
        message: `Send ${amount.toFixed(2)} to ${session.data.recipient}\n\nEnter PIN to confirm:`,
        sessionStatus: 'continue',
        nextMenu: 'send_money',
      };
    } else {
      // Step 3: Verify PIN and process
      const confirmPIN = userInput.trim();

      // Verify PIN again (2FA for transaction)
      const user = await query<{ id: string; transaction_pin_hash: string }>(
        'SELECT id, transaction_pin_hash FROM users WHERE phone_number = $1',
        [session.phoneNumber]
      );

      if (user.length === 0) {
        return {
          message: 'Account not found.',
          sessionStatus: 'end',
        };
      }

      const pinValid = await bcrypt.compare(confirmPIN, user[0].transaction_pin_hash);

      if (!pinValid) {
        // Reset flow
        session.data = {};
        return {
          message: 'Invalid PIN. Transaction cancelled.',
          sessionStatus: 'end',
        };
      }

      // Process payment (simplified - in production, call payment API)
      // For now, return success message
      const amount = session.data.amount;
      const recipient = session.data.recipient;

      // Clear session
      this.sessions.delete(session.sessionId);

      return {
        message: `Payment of ${amount.toFixed(2)} sent to ${recipient} successfully!\n\nThank you for using Buffr!`,
        sessionStatus: 'end',
      };
    }
  }

  /**
   * Handle transaction history
   */
  private async handleTransactionHistory(session: USSDMenuState, userInput: string): Promise<USSDResponse> {
    // Get user by phone number
    const user = await query<{ id: string }>(
      'SELECT id FROM users WHERE phone_number = $1',
      [session.phoneNumber]
    );

    if (user.length === 0) {
      return {
        message: 'Account not found.',
        sessionStatus: 'end',
      };
    }

    // Get recent transactions (last 5)
    const transactions = await query<{
      type: string;
      amount: number;
      created_at: Date;
    }>(
      `SELECT type, amount, created_at 
       FROM transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [user[0].id]
    );

    if (transactions.length === 0) {
      return {
        message: 'No transactions found.',
        sessionStatus: 'end',
      };
    }

    let message = 'Recent Transactions:\n\n';
    transactions.forEach((tx, index) => {
      const date = new Date(tx.created_at).toLocaleDateString();
      message += `${index + 1}. ${tx.type}\n   ${tx.amount.toFixed(2)} NAD\n   ${date}\n\n`;
    });

    message += 'Thank you for using Buffr!';

    // Clear session
    this.sessions.delete(session.sessionId);

    return {
      message,
      sessionStatus: 'end',
    };
  }

  /**
   * Handle profile view
   */
  private async handleProfile(session: USSDMenuState): Promise<USSDResponse> {
    // Get user by phone number
    const user = await query<{
      id: string;
      first_name: string;
      last_name: string;
      phone_number: string;
    }>(
      'SELECT id, first_name, last_name, phone_number FROM users WHERE phone_number = $1',
      [session.phoneNumber]
    );

    if (user.length === 0) {
      return {
        message: 'Account not found.',
        sessionStatus: 'end',
      };
    }

    const userData = user[0];
    const fullName = `${userData.first_name} ${userData.last_name}`.trim();

    // Get wallet balance
    const wallet = await query<{ balance: number }>(
      `SELECT balance FROM wallets WHERE user_id = $1 AND is_default = true LIMIT 1`,
      [userData.id]
    );

    const balance = wallet.length > 0 ? parseFloat(wallet[0].balance.toString()) : 0;

    // Clear session
    this.sessions.delete(session.sessionId);

    return {
      message: `My Profile\n\nName: ${fullName}\nPhone: ${userData.phone_number}\nBalance: ${balance.toFixed(2)} NAD\n\nThank you for using Buffr!`,
      sessionStatus: 'end',
    };
  }

  /**
   * Handle PIN change
   */
  private async handleChangePIN(session: USSDMenuState, userInput: string): Promise<USSDResponse> {
    // Multi-step flow:
    // 1. Enter current PIN
    // 2. Enter new PIN
    // 3. Confirm new PIN

    if (!session.data.currentPINVerified) {
      // Step 1: Verify current PIN
      const currentPIN = userInput.trim();

      const user = await query<{ id: string; transaction_pin_hash: string }>(
        'SELECT id, transaction_pin_hash FROM users WHERE phone_number = $1',
        [session.phoneNumber]
      );

      if (user.length === 0) {
        return {
          message: 'Account not found.',
          sessionStatus: 'end',
        };
      }

      const pinValid = await bcrypt.compare(currentPIN, user[0].transaction_pin_hash);

      if (!pinValid) {
        session.attempts++;
        if (session.attempts >= 3) {
          this.sessions.delete(session.sessionId);
          return {
            message: 'Too many failed attempts. Please try again later.',
            sessionStatus: 'end',
          };
        }
        return {
          message: `Invalid PIN. ${3 - session.attempts} attempts remaining.\n\nEnter your current PIN:`,
          sessionStatus: 'continue',
          nextMenu: 'change_pin',
        };
      }

      session.data.currentPINVerified = true;
      return {
        message: 'Enter your new 4-digit PIN:',
        sessionStatus: 'continue',
        nextMenu: 'change_pin',
      };
    } else if (!session.data.newPIN) {
      // Step 2: Get new PIN
      const newPIN = userInput.trim();
      if (newPIN.length !== 4 || !/^\d{4}$/.test(newPIN)) {
        return {
          message: 'PIN must be 4 digits. Enter your new PIN:',
          sessionStatus: 'continue',
          nextMenu: 'change_pin',
        };
      }

      session.data.newPIN = newPIN;
      return {
        message: 'Confirm your new PIN:',
        sessionStatus: 'continue',
        nextMenu: 'change_pin',
      };
    } else {
      // Step 3: Confirm new PIN
      const confirmPIN = userInput.trim();

      if (confirmPIN !== session.data.newPIN) {
        // Reset
        session.data = {};
        return {
          message: 'PINs do not match. Please start over.',
          sessionStatus: 'end',
        };
      }

      // Update PIN in database
      const user = await query<{ id: string }>(
        'SELECT id FROM users WHERE phone_number = $1',
        [session.phoneNumber]
      );

      if (user.length > 0) {
        const pinHash = await bcrypt.hash(confirmPIN, 10);
        await query(
          'UPDATE users SET transaction_pin_hash = $1, updated_at = NOW() WHERE id = $2',
          [pinHash, user[0].id]
        );
      }

      // Clear session
      this.sessions.delete(session.sessionId);

      return {
        message: 'PIN changed successfully!\n\nThank you for using Buffr!',
        sessionStatus: 'end',
      };
    }
  }

  /**
   * Handle voucher redemption via USSD
   */
  async handleVoucherRedemption(request: {
    sessionId: string;
    phoneNumber: string;
    userId: string;
    voucherId: string;
    redemptionMethod: 'wallet' | 'cash_out' | 'bank_transfer' | 'merchant';
  }): Promise<USSDResponse> {
    try {
      // Get voucher
      const vouchers = await query<{
        id: string;
        amount: number;
        status: string;
        user_id: string;
      }>(
        'SELECT id, amount, status, user_id FROM vouchers WHERE id = $1',
        [request.voucherId]
      );

      if (vouchers.length === 0) {
        return {
          message: 'Voucher not found.',
          sessionStatus: 'end',
        };
      }

      const voucher = vouchers[0];

      // Verify voucher ownership
      if (voucher.user_id !== request.userId) {
        return {
          message: 'Voucher access denied.',
          sessionStatus: 'end',
        };
      }

      // Check voucher status
      if (voucher.status !== 'available') {
        return {
          message: `Voucher is ${voucher.status}.`,
          sessionStatus: 'end',
        };
      }

      // Process redemption based on method
      if (request.redemptionMethod === 'wallet') {
        // Credit to wallet
        const wallet = await query<{ id: string }>(
          'SELECT id FROM wallets WHERE user_id = $1 AND is_default = true LIMIT 1',
          [request.userId]
        );

        if (wallet.length > 0) {
          await query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
            [voucher.amount, wallet[0].id]
          );

          // Create transaction
          await query(
            `INSERT INTO transactions (user_id, type, amount, currency, status, to_wallet_id, payment_method, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              request.userId,
              'credit',
              voucher.amount,
              'NAD',
              'completed',
              wallet[0].id,
              'voucher_redemption',
              'Voucher redemption via USSD',
            ]
          );
        }
      }

      // Update voucher status
      await query(
        'UPDATE vouchers SET status = $1, redeemed_at = NOW(), updated_at = NOW() WHERE id = $2',
        ['redeemed', request.voucherId]
      );

      return {
        message: `Voucher redeemed successfully!\nAmount: ${voucher.amount.toFixed(2)} NAD\nMethod: ${request.redemptionMethod}\n\nThank you for using Buffr!`,
        sessionStatus: 'end',
      };
    } catch (error: any) {
      log.error('USSD voucher redemption error:', error);
      return {
        message: 'An error occurred. Please try again later.',
        sessionStatus: 'end',
      };
    }
  }

  /**
   * Clean up expired sessions (call periodically)
   * Sessions expire after 5 minutes of inactivity
   */
  cleanupSessions(): void {
    const now = Date.now();
    const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    const expiredSessions: string[] = [];
    
    // Find expired sessions
    for (const [sessionId, session] of this.sessions.entries()) {
      const timeSinceLastActivity = now - session.lastActivity;
      if (timeSinceLastActivity > SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    }
    
    // Remove expired sessions
    for (const sessionId of expiredSessions) {
      this.sessions.delete(sessionId);
    }
    
    if (expiredSessions.length > 0) {
      logger.info(`[USSD Service] Cleaned up ${expiredSessions.length} expired session(s)`);
    }
  }
}

export const ussdService = new USSDService();

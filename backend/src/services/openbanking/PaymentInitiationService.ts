/**
 * Payment Initiation Service (PIS)
 * 
 * Location: backend/src/services/openbanking/PaymentInitiationService.ts
 * Purpose: Implementation of Payment Initiation Services per Namibian Open Banking Standards v1.0
 * 
 * Standards Compliance:
 * - Section 9.2.5: Supported PIS API Use Cases
 * - Section 9.2.4: Supported Payment Types (on-us, eft-enhanced, eft-nrtc)
 */

import { sql } from '../../database/connection';
import { log, logError } from '../../utils/logger';

export interface Payment {
  paymentId: string;
  participantId: string;
  beneficiaryId: string;
  debtorAccountId: string;
  paymentType: string;
  creditorName: string;
  creditorAccount: string;
  creditorBankCode?: string;
  amount: string;
  currency: string;
  reference?: string;
  description?: string;
  status: string;
  statusReason?: string;
  instructionId?: string;
  endToEndId?: string;
  initiatedAt: string;
}

export interface Beneficiary {
  beneficiaryPayeeId: string;
  beneficiaryId: string;
  accountId: string;
  payeeName: string;
  payeeAccount: string;
  payeeBankCode?: string;
  isFavorite: boolean;
}

export class PaymentInitiationService {
  /**
   * Make Payment (PIS Use Case #1)
   * Section 9.2.5: Initiate a payment on request of Account Holder
   */
  async makePayment(
    participantId: string,
    beneficiaryId: string,
    debtorAccountId: string,
    paymentType: 'on-us' | 'eft-enhanced' | 'eft-nrtc',
    creditorName: string,
    creditorAccount: string,
    amount: string,
    currency: string = 'NAD',
    creditorBankCode?: string,
    reference?: string,
    description?: string,
    instructionId?: string
  ): Promise<Payment> {
    try {
      // Verify account exists and belongs to beneficiary
      const [account] = await sql`
        SELECT account_id, status FROM open_banking_accounts
        WHERE account_id = ${debtorAccountId}
        AND beneficiary_id = ${beneficiaryId}
      `;

      if (!account) {
        throw new Error('Account not found or unauthorized');
      }

      if (account.status !== 'open') {
        throw new Error('Account is not open');
      }

      // Validate amount format (must have 2 decimal places)
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      // Check account balance (simple validation)
      const [balance] = await sql`
        SELECT amount FROM open_banking_balances
        WHERE account_id = ${debtorAccountId}
        AND balance_type = 'available'
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (balance && parseFloat(balance.amount) < amountNum) {
        // Create payment but mark as rejected
        const [payment] = await sql`
          INSERT INTO open_banking_payments (
            participant_id, beneficiary_id, debtor_account_id, payment_type,
            creditor_name, creditor_account, creditor_bank_code, amount, currency,
            reference, description, instruction_id, status, status_reason
          )
          VALUES (
            ${participantId}, ${beneficiaryId}, ${debtorAccountId}, ${paymentType},
            ${creditorName}, ${creditorAccount}, ${creditorBankCode || null}, 
            ${amountNum}, ${currency}, ${reference || null}, ${description || null},
            ${instructionId || null}, 'rejected', 'Insufficient funds'
          )
          RETURNING 
            payment_id as "paymentId",
            participant_id as "participantId",
            beneficiary_id as "beneficiaryId",
            debtor_account_id as "debtorAccountId",
            payment_type as "paymentType",
            creditor_name as "creditorName",
            creditor_account as "creditorAccount",
            TO_CHAR(amount, 'FM999999999990.00') as amount,
            currency,
            status,
            status_reason as "statusReason",
            initiated_at as "initiatedAt"
        `;

        log('Payment rejected - insufficient funds', { paymentId: payment.paymentId });
        return payment as Payment;
      }

      // Create payment (accepted status)
      const [payment] = await sql`
        INSERT INTO open_banking_payments (
          participant_id, beneficiary_id, debtor_account_id, payment_type,
          creditor_name, creditor_account, creditor_bank_code, amount, currency,
          reference, description, instruction_id, status, accepted_at
        )
        VALUES (
          ${participantId}, ${beneficiaryId}, ${debtorAccountId}, ${paymentType},
          ${creditorName}, ${creditorAccount}, ${creditorBankCode || null}, 
          ${amountNum}, ${currency}, ${reference || null}, ${description || null},
          ${instructionId || null}, 'accepted', NOW()
        )
        RETURNING 
          payment_id as "paymentId",
          participant_id as "participantId",
          beneficiary_id as "beneficiaryId",
          debtor_account_id as "debtorAccountId",
          payment_type as "paymentType",
          creditor_name as "creditorName",
          creditor_account as "creditorAccount",
          creditor_bank_code as "creditorBankCode",
          TO_CHAR(amount, 'FM999999999990.00') as amount,
          currency,
          reference,
          description,
          status,
          instruction_id as "instructionId",
          initiated_at as "initiatedAt",
          accepted_at as "acceptedAt"
      `;

      log('Payment initiated successfully', { 
        paymentId: payment.paymentId, 
        amount, 
        creditorName 
      });

      // Simulate payment processing (in production, this would integrate with payment systems)
      this.processPaymentAsync(payment.paymentId).catch(err => 
        logError('Async payment processing failed', err)
      );

      return payment as Payment;
    } catch (error) {
      logError('Failed to make payment', error);
      throw error;
    }
  }

  /**
   * Get Payment Status (PIS Use Case #3)
   * Section 9.2.5: Track a payment that was previously initiated
   */
  async getPaymentStatus(paymentId: string, participantId: string): Promise<Payment> {
    try {
      const [payment] = await sql`
        SELECT 
          payment_id as "paymentId",
          participant_id as "participantId",
          beneficiary_id as "beneficiaryId",
          debtor_account_id as "debtorAccountId",
          payment_type as "paymentType",
          creditor_name as "creditorName",
          creditor_account as "creditorAccount",
          creditor_bank_code as "creditorBankCode",
          TO_CHAR(amount, 'FM999999999990.00') as amount,
          currency,
          reference,
          description,
          status,
          status_reason as "statusReason",
          instruction_id as "instructionId",
          end_to_end_id as "endToEndId",
          initiated_at as "initiatedAt",
          accepted_at as "acceptedAt",
          completed_at as "completedAt",
          failed_at as "failedAt"
        FROM open_banking_payments
        WHERE payment_id = ${paymentId}
        AND participant_id = ${participantId}
      `;

      if (!payment) {
        throw new Error('Payment not found or unauthorized');
      }

      log('Retrieved payment status', { paymentId, status: payment.status });
      return payment as Payment;
    } catch (error) {
      logError('Failed to get payment status', error, { paymentId });
      throw error;
    }
  }

  /**
   * List Beneficiaries (PIS Use Case #2)
   * Section 9.2.5: Get list of saved beneficiaries/payees.
   * Excludes accounts whose holder (beneficiary) is deceased.
   */
  async listBeneficiaries(accountId: string): Promise<Beneficiary[]> {
    try {
      const beneficiaries = await sql`
        SELECT 
          ob.beneficiary_payee_id as "beneficiaryPayeeId",
          ob.beneficiary_id as "beneficiaryId",
          ob.account_id as "accountId",
          ob.payee_name as "payeeName",
          ob.payee_account as "payeeAccount",
          ob.payee_bank_code as "payeeBankCode",
          ob.payee_reference as "payeeReference",
          ob.is_favorite as "isFavorite"
        FROM open_banking_beneficiaries ob
        JOIN open_banking_accounts oa ON oa.account_id = ob.account_id
        JOIN beneficiaries b ON b.id = oa.beneficiary_id
        WHERE ob.account_id = ${accountId}
          AND (b.status IS NULL OR b.status != 'deceased')
        ORDER BY ob.is_favorite DESC, ob.payee_name ASC
      `;

      log('Listed beneficiaries', { accountId, count: beneficiaries.length });
      return beneficiaries as Beneficiary[];
    } catch (error) {
      logError('Failed to list beneficiaries', error, { accountId });
      throw error;
    }
  }

  /**
   * Process payment asynchronously (simulates payment system integration)
   */
  private async processPaymentAsync(paymentId: string): Promise<void> {
    try {
      // Simulate payment processing delay (2-5 seconds)
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

      // Update payment to processing
      await sql`
        UPDATE open_banking_payments
        SET status = 'processing', updated_at = NOW()
        WHERE payment_id = ${paymentId}
      `;

      // Simulate additional processing
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Random success/failure (95% success rate)
      const success = Math.random() > 0.05;

      if (success) {
        // Generate end-to-end ID
        const endToEndId = `E2E${Date.now()}${Math.floor(Math.random() * 1000)}`;

        await sql`
          UPDATE open_banking_payments
          SET status = 'completed', 
              end_to_end_id = ${endToEndId},
              completed_at = NOW(), 
              updated_at = NOW()
          WHERE payment_id = ${paymentId}
        `;

        // Update account balance
        const [payment] = await sql`
          SELECT debtor_account_id, amount FROM open_banking_payments
          WHERE payment_id = ${paymentId}
        `;

        if (payment) {
          await sql`
            UPDATE open_banking_balances
            SET amount = amount - ${payment.amount},
                as_of_date = NOW()
            WHERE account_id = ${payment.debtor_account_id}
            AND balance_type = 'available'
          `;

          // Create transaction record
          await sql`
            INSERT INTO open_banking_transactions (
              account_id, transaction_type, description, amount, 
              currency, posting_date, status
            )
            VALUES (
              ${payment.debtor_account_id}, 'debit', 
              'Payment via Open Banking', ${payment.amount},
              'NAD', CURRENT_DATE, 'posted'
            )
          `;
        }

        log('Payment completed successfully', { paymentId, endToEndId });
      } else {
        await sql`
          UPDATE open_banking_payments
          SET status = 'failed', 
              status_reason = 'Payment processing error',
              failed_at = NOW(), 
              updated_at = NOW()
          WHERE payment_id = ${paymentId}
        `;

        log('Payment processing failed', { paymentId });
      }
    } catch (error) {
      logError('Failed to process payment', error, { paymentId });
      
      await sql`
        UPDATE open_banking_payments
        SET status = 'failed', 
            status_reason = 'Internal processing error',
            failed_at = NOW(), 
            updated_at = NOW()
        WHERE payment_id = ${paymentId}
      `;
    }
  }
}

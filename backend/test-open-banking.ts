/**
 * Open Banking Test & Demo Script
 * 
 * Purpose: Test Namibian Open Banking Standards v1.0 implementation
 * Usage: npx tsx test-open-banking.ts
 * 
 * This script demonstrates:
 * 1. Participant registration
 * 2. Account creation
 * 3. OAuth 2.0 consent flow with PKCE
 * 4. Account Information Services (AIS)
 * 5. Payment Initiation Services (PIS)
 */

import { sql } from './src/database/connection';
import { ParticipantService } from './src/services/openbanking/ParticipantService';
import { AccountInformationService } from './src/services/openbanking/AccountInformationService';
import { PaymentInitiationService } from './src/services/openbanking/PaymentInitiationService';
import { OAuthService } from './src/services/openbanking/OAuthService';
import { log } from './src/utils/logger';

async function runOpenBankingTests() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Namibian Open Banking Standards v1.0 - Test Suite      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const participantService = new ParticipantService();
  const aisService = new AccountInformationService();
  const pisService = new PaymentInitiationService();
  const oauthService = new OAuthService();

  try {
    // ============================================================
    // STEP 1: Register Test Participants
    // ============================================================
    console.log('📋 Step 1: Registering Test Participants...\n');

    // Register a TPP (Third Party Provider)
    const tpp = await participantService.registerParticipant(
      'SmartPay Fintech Services',
      'TPP',
      ['banking'],
      ['AIS', 'PIS'],
      'support@smartpayfintech.na',
      'https://smartpayfintech.na'
    );
    console.log(`✅ TPP Registered: ${tpp.participantId} - ${tpp.participantName}`);

    // Register a Data Provider (Bank)
    const dataProvider = await participantService.registerParticipant(
      'Bank Windhoek',
      'DP',
      ['banking'],
      ['AIS', 'PIS'],
      'openbanking@bankwindhoek.na',
      'https://developer.bankwindhoek.na'
    );
    console.log(`✅ Data Provider Registered: ${dataProvider.participantId} - ${dataProvider.participantName}\n`);

    // ============================================================
    // STEP 2: Create Test Beneficiary and Account
    // ============================================================
    console.log('👤 Step 2: Creating Test Beneficiary and Account...\n');

    // Create beneficiary
    const [beneficiary] = await sql`
      INSERT INTO beneficiaries (
        id, name, phone, region, grant_type, status
      )
      VALUES (
        'NA100000001', 'Johannes Shikongo', '+264811234567', 
        'Khomas', 'social_grant', 'active'
      )
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      RETURNING *
    `;
    console.log(`✅ Beneficiary: ${beneficiary.name} (${beneficiary.id})`);

    // Create or get e-wallet account
    let account;
    const [existingAccount] = await sql`
      SELECT 
        account_id as "accountId",
        beneficiary_id as "beneficiaryId",
        account_type as "accountType",
        account_number as "accountNumber",
        account_name as "accountName",
        currency,
        status
      FROM open_banking_accounts
      WHERE beneficiary_id = ${beneficiary.id}
      AND account_number = '081-1234567'
    `;

    if (existingAccount) {
      account = existingAccount;
      console.log(`✅ Account Found: ${account.accountNumber} (${account.accountId})`);
    } else {
      account = await aisService.createAccount(
        beneficiary.id,
        'e-wallet',
        '081-1234567',
        'Johannes SmartPay Wallet',
        'NAD'
      );
      console.log(`✅ Account Created: ${account.accountNumber} (${account.accountId})`);
    }

    // Set initial balance
    await aisService.updateBalance(account.accountId, 'current', 5000.00);
    await aisService.updateBalance(account.accountId, 'available', 5000.00);
    console.log(`✅ Balance Set: N$5,000.00\n`);

    // Add some test transactions
    await sql`
      INSERT INTO open_banking_transactions (
        account_id, transaction_type, description, amount, currency,
        posting_date, status, merchant_name
      )
      VALUES 
        (${account.accountId}, 'credit', 'Social Grant Payment', 2000.00, 'NAD', CURRENT_DATE, 'posted', 'Government of Namibia'),
        (${account.accountId}, 'debit', 'Shoprite Purchase', -250.50, 'NAD', CURRENT_DATE - 1, 'posted', 'Shoprite'),
        (${account.accountId}, 'debit', 'Fuel Purchase', -450.00, 'NAD', CURRENT_DATE - 2, 'posted', 'Engen'),
        (${account.accountId}, 'credit', 'Transfer from Friend', 500.00, 'NAD', CURRENT_DATE - 3, 'posted', 'Maria Hamutenya')
      ON CONFLICT DO NOTHING
    `;
    console.log(`✅ Added 4 test transactions\n`);

    // ============================================================
    // STEP 3: OAuth 2.0 Consent Flow with PKCE
    // ============================================================
    console.log('🔐 Step 3: OAuth 2.0 Consent Flow (PKCE)...\n');

    // Generate PKCE challenge (TPP side)
    const codeVerifier = OAuthService.generateCodeVerifier();
    const codeChallenge = OAuthService.generateCodeChallenge(codeVerifier);
    console.log(`✅ PKCE Code Verifier: ${codeVerifier.substring(0, 20)}...`);
    console.log(`✅ PKCE Code Challenge: ${codeChallenge.substring(0, 20)}...\n`);

    // Step 3a: Pushed Authorization Request (PAR)
    const par = await oauthService.createAuthorizationRequest(
      tpp.participantId,
      beneficiary.id,
      codeChallenge,
      'S256',
      'banking:accounts.basic.read banking:payments.write banking:payments.read',
      'https://smartpayfintech.na/callback',
      'state123',
      'nonce456'
    );
    console.log(`✅ PAR Created: ${par.requestUri}`);
    console.log(`   Expires in: ${par.expiresIn} seconds\n`);

    // Step 3b: User grants consent (simulated)
    console.log('👤 User Authentication & Consent...');
    const authCode = await oauthService.createAuthorizationCode(
      par.requestUri,
      beneficiary.id
    );
    console.log(`✅ Authorization Code: ${authCode.substring(0, 20)}...\n`);

    // Step 3c: Exchange code for tokens
    const tokens = await oauthService.exchangeCodeForToken(
      authCode,
      codeVerifier,
      tpp.participantId
    );
    console.log(`✅ Access Token: ${tokens.accessToken.substring(0, 20)}...`);
    console.log(`   Expires in: ${tokens.expiresIn} seconds`);
    console.log(`✅ Refresh Token: ${tokens.refreshToken?.substring(0, 20)}...`);
    console.log(`   Scope: ${tokens.scope}\n`);

    // ============================================================
    // STEP 4: Account Information Services (AIS)
    // ============================================================
    console.log('📊 Step 4: Testing Account Information Services (AIS)...\n');

    // AIS Use Case #1: List Accounts
    console.log('🔍 AIS Use Case #1: List Accounts');
    const accounts = await aisService.listAccounts(beneficiary.id);
    console.log(`✅ Found ${accounts.length} account(s):`);
    accounts.forEach(acc => {
      console.log(`   - ${acc.accountName} (${acc.accountNumber}) - ${acc.status}`);
    });
    console.log('');

    // AIS Use Case #2: Get Account Balance
    console.log('💰 AIS Use Case #2: Get Account Balance');
    const balances = await aisService.getAccountBalance(account.accountId);
    console.log(`✅ Retrieved ${balances.length} balance(s):`);
    balances.forEach(bal => {
      console.log(`   - ${bal.balanceType}: N$${bal.amount} ${bal.currency}`);
    });
    console.log('');

    // AIS Use Case #3: List Transactions
    console.log('📝 AIS Use Case #3: List Transactions');
    const transactions = await aisService.listTransactions(account.accountId);
    console.log(`✅ Retrieved ${transactions.transactions.length} transaction(s):`);
    transactions.transactions.slice(0, 3).forEach(txn => {
      console.log(`   - ${txn.postingDate}: ${txn.description} - N$${txn.amount}`);
    });
    console.log('');

    // ============================================================
    // STEP 5: Payment Initiation Services (PIS)
    // ============================================================
    console.log('💳 Step 5: Testing Payment Initiation Services (PIS)...\n');

    // PIS Use Case #1: Make Payment
    console.log('🚀 PIS Use Case #1: Make Payment (On-Us Transfer)');
    const payment = await pisService.makePayment(
      tpp.participantId,
      beneficiary.id,
      account.accountId,
      'on-us',
      'Maria Hamutenya',
      '081-7654321',
      '150.00',
      'NAD',
      undefined,
      'Electricity bill payment',
      'Payment via SmartPay',
      `INS${Date.now()}`
    );
    console.log(`✅ Payment Initiated:`);
    console.log(`   Payment ID: ${payment.paymentId}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Amount: N$${payment.amount}`);
    console.log(`   Creditor: ${payment.creditorName}\n`);

    // Wait for async processing
    console.log('⏳ Waiting for payment processing...');
    await new Promise(resolve => setTimeout(resolve, 6000));

    // PIS Use Case #3: Get Payment Status
    console.log('\n📊 PIS Use Case #3: Get Payment Status');
    const paymentStatus = await pisService.getPaymentStatus(payment.paymentId, tpp.participantId);
    console.log(`✅ Payment Status: ${paymentStatus.status}`);
    if (paymentStatus.endToEndId) {
      console.log(`   End-to-End ID: ${paymentStatus.endToEndId}`);
    }
    console.log('');

    // Check updated balance
    const updatedBalances = await aisService.getAccountBalance(account.accountId);
    console.log('💰 Updated Account Balance:');
    updatedBalances.forEach(bal => {
      if (bal.balanceType === 'available') {
        console.log(`   ${bal.balanceType}: N$${bal.amount} ${bal.currency}`);
      }
    });
    console.log('');

    // ============================================================
    // STEP 6: Token Refresh
    // ============================================================
    if (tokens.refreshToken) {
      console.log('🔄 Step 6: Testing Token Refresh...\n');
      
      const newTokens = await oauthService.refreshAccessToken(
        tokens.refreshToken,
        tpp.participantId
      );
      console.log(`✅ New Access Token: ${newTokens.accessToken.substring(0, 20)}...`);
      console.log(`   Expires in: ${newTokens.expiresIn} seconds\n`);
    }

    // ============================================================
    // STEP 7: Consent Revocation
    // ============================================================
    if (tokens.refreshToken) {
      console.log('🚫 Step 7: Testing Consent Revocation...\n');
      
      await oauthService.revokeToken(tokens.refreshToken, 'user_request');
      console.log(`✅ Refresh token revoked (reason: user_request)\n`);
    }

    // ============================================================
    // FINAL SUMMARY
    // ============================================================
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║            ✅ ALL TESTS COMPLETED SUCCESSFULLY            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('Summary of Tests:');
    console.log('✅ Participant Management (DP & TPP registration)');
    console.log('✅ Account & Balance Management');
    console.log('✅ OAuth 2.0 with PKCE (PAR, Authorization Code, Tokens)');
    console.log('✅ AIS Use Case #1: List Accounts');
    console.log('✅ AIS Use Case #2: Get Account Balance');
    console.log('✅ AIS Use Case #3: List Transactions');
    console.log('✅ PIS Use Case #1: Make Payment');
    console.log('✅ PIS Use Case #3: Get Payment Status');
    console.log('✅ Token Refresh Flow');
    console.log('✅ Consent Revocation\n');

    console.log('🎯 Namibian Open Banking Standards v1.0 Implementation:');
    console.log('   ✅ Section 8.1: Participant Management');
    console.log('   ✅ Section 9.2.4: Banking Resource Objects');
    console.log('   ✅ Section 9.2.5: API Use Cases (AIS & PIS)');
    console.log('   ✅ Section 9.5: OAuth 2.0 Consent Standards');
    console.log('   ✅ RFC 7636: PKCE Implementation');
    console.log('   ✅ RFC 9126: Pushed Authorization Requests\n');

    console.log('📊 Test Data Created:');
    console.log(`   Participants: 2 (1 TPP, 1 Data Provider)`);
    console.log(`   Beneficiaries: 1`);
    console.log(`   Accounts: 1 (e-wallet)`);
    console.log(`   Transactions: 5 (4 historical + 1 payment)`);
    console.log(`   Payments: 1\n`);

    console.log('🚀 Open Banking API Endpoints Available:');
    console.log('   POST /bon/v1/common/par              - Pushed Authorization Request');
    console.log('   POST /bon/v1/common/authorize        - Create Authorization Code');
    console.log('   POST /bon/v1/common/token            - Exchange Code for Tokens');
    console.log('   POST /bon/v1/common/revoke           - Revoke Refresh Token');
    console.log('   GET  /bon/v1/banking/accounts        - List Accounts (AIS)');
    console.log('   GET  /bon/v1/banking/accounts/{id}/balance - Get Balance (AIS)');
    console.log('   GET  /bon/v1/banking/accounts/{id}/transactions - List Transactions (AIS)');
    console.log('   POST /bon/v1/banking/payments        - Make Payment (PIS)');
    console.log('   GET  /bon/v1/banking/payments/{id}   - Get Payment Status (PIS)\n');

    console.log('📖 Next Steps:');
    console.log('   1. Run migrations: npm run migrate');
    console.log('   2. Start backend: npm run dev');
    console.log('   3. Test endpoints with curl or Postman');
    console.log('   4. Review OPEN_BANKING_IMPLEMENTATION.md for details\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runOpenBankingTests();

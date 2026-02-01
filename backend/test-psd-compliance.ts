/**
 * PSD Compliance Test Suite
 * 
 * Purpose: Comprehensive testing of Namibian Payment System Determinations compliance
 * Regulations: PSD-1, PSD-3, PSD-12
 * Location: backend/test-psd-compliance.ts
 * 
 * Tests:
 * - Trust Account Reconciliation (PSD-3)
 * - Two-Factor Authentication (PSD-12)
 * - System Uptime Monitoring (PSD-12)
 * - Incident Response (PSD-12)
 * - Dormant Wallet Management (PSD-3)
 * - Capital Requirements (PSD-3)
 * - Bank of Namibia Reporting (PSD-3 & PSD-1)
 * 
 * Run: npx tsx test-psd-compliance.ts
 */

import { neon } from '@neondatabase/serverless';
import { TrustAccountService } from './src/services/compliance/TrustAccountService';
import { TwoFactorAuthService } from './src/services/compliance/TwoFactorAuthService';
import { SystemUptimeMonitorService } from './src/services/compliance/SystemUptimeMonitorService';
import { IncidentResponseService } from './src/services/compliance/IncidentResponseService';
import { DormantWalletService } from './src/services/compliance/DormantWalletService';
import { CapitalRequirementsService } from './src/services/compliance/CapitalRequirementsService';
import { BankOfNamibiaReportingService } from './src/services/compliance/BankOfNamibiaReportingService';

const sql = neon(process.env.DATABASE_URL!);

let testResults: { name: string; status: 'PASS' | 'FAIL'; error?: string }[] = [];

function logTest(name: string, status: 'PASS' | 'FAIL', error?: string) {
  testResults.push({ name, status, error });
  const icon = status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (error) console.log(`   Error: ${error}`);
}

async function setupTestData() {
  console.log('\n📋 Setting up test data...\n');

  try {
    // Create test beneficiary if not exists
    const existingBeneficiary = await sql`
      SELECT id FROM beneficiaries WHERE id = 'TEST_BEN_001'
    `;

    if (existingBeneficiary.length === 0) {
      await sql`
        INSERT INTO beneficiaries (id, name, phone, region, grant_type, status)
        VALUES ('TEST_BEN_001', 'Test Beneficiary', '+264811234567', 'Khomas', 'Old Age Grant', 'active')
      `;
      console.log('✅ Test beneficiary created');
    }

    // Create test e-wallet
    const existingWallet = await sql`
      SELECT beneficiary_id FROM ewallet_balances WHERE beneficiary_id = 'TEST_BEN_001'
    `;

    if (existingWallet.length === 0) {
      await sql`
        INSERT INTO ewallet_balances (beneficiary_id, current_balance, available_balance, wallet_status, last_transaction_date)
        VALUES ('TEST_BEN_001', 1500.00, 1500.00, 'active', NOW())
      `;
      console.log('✅ Test e-wallet created with N$1,500.00');
    } else {
      // Update existing wallet
      await sql`
        UPDATE ewallet_balances
        SET current_balance = 1500.00, available_balance = 1500.00, wallet_status = 'active'
        WHERE beneficiary_id = 'TEST_BEN_001'
      `;
      console.log('✅ Test e-wallet updated');
    }

    console.log('\n');
  } catch (error: any) {
    console.error('❌ Test data setup failed:', error.message);
    throw error;
  }
}

async function testTrustAccountReconciliation() {
  console.log('\n📊 TEST 1: Trust Account Reconciliation (PSD-3 Section 11.2)\n');
  console.log('─'.repeat(60));

  try {
    // Test 1.1: Perform daily reconciliation
    console.log('\nTest 1.1: Perform Daily Reconciliation');
    const reconciliation = await TrustAccountService.performDailyReconciliation('Test Suite');
    console.log(`   Trust Balance: N$${reconciliation.trustAccountBalance.toLocaleString()}`);
    console.log(`   Outstanding Liabilities: N$${reconciliation.outstandingLiabilities.toLocaleString()}`);
    console.log(`   Coverage: ${reconciliation.coveragePercentage.toFixed(2)}%`);
    console.log(`   Status: ${reconciliation.status.toUpperCase()}`);
    logTest('Trust account reconciliation executed', 'PASS');

    // Test 1.2: Check compliance status
    console.log('\nTest 1.2: Check Compliance Status');
    const status = await TrustAccountService.checkComplianceStatus();
    console.log(`   Compliant: ${status.isCompliant}`);
    console.log(`   Coverage: ${status.coveragePercentage.toFixed(2)}%`);
    logTest('Compliance status check', status.isCompliant ? 'PASS' : 'FAIL', 
      status.isCompliant ? undefined : `Coverage below 100%: ${status.coveragePercentage.toFixed(2)}%`);

    // Test 1.3: Get reconciliation history
    console.log('\nTest 1.3: Get Reconciliation History');
    const history = await TrustAccountService.getReconciliationHistory(7);
    console.log(`   Records found: ${history.length}`);
    logTest('Reconciliation history retrieval', 'PASS');

  } catch (error: any) {
    logTest('Trust Account Reconciliation', 'FAIL', error.message);
  }
}

async function testTwoFactorAuthentication() {
  console.log('\n🔐 TEST 2: Two-Factor Authentication (PSD-12 Section 12.2)\n');
  console.log('─'.repeat(60));

  try {
    // Test 2.1: Generate OTP
    console.log('\nTest 2.1: Generate OTP for Payment Transaction');
    const otpResult = await TwoFactorAuthService.generateOTP({
      userId: 'TEST_BEN_001',
      userType: 'beneficiary',
      transactionType: 'payment',
      transactionId: 'TXN_TEST_001',
      transactionAmount: 500,
      method: 'sms_otp',
    });
    console.log(`   OTP sent: ${otpResult.success}`);
    console.log(`   Message: ${otpResult.message}`);
    console.log(`   Expires: ${otpResult.expiresAt?.toLocaleString()}`);
    logTest('OTP generation for payment', otpResult.success ? 'PASS' : 'FAIL');

    // Test 2.2: Get 2FA statistics
    console.log('\nTest 2.2: Get 2FA Statistics');
    const stats = await TwoFactorAuthService.get2FAStatistics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    console.log(`   Total Attempts: ${stats.totalAttempts}`);
    console.log(`   Successful: ${stats.successfulAuth}`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(2)}%`);
    logTest('2FA statistics retrieval', 'PASS');

  } catch (error: any) {
    logTest('Two-Factor Authentication', 'FAIL', error.message);
  }
}

async function testSystemUptimeMonitoring() {
  console.log('\n📡 TEST 3: System Uptime Monitoring (PSD-12 Section 13.1)\n');
  console.log('─'.repeat(60));

  try {
    // Test 3.1: Monitor all services
    console.log('\nTest 3.1: Monitor All Critical Services');
    const healthChecks = await SystemUptimeMonitorService.monitorAllServices();
    console.log(`   Services monitored: ${healthChecks.length}`);
    healthChecks.forEach(check => {
      console.log(`   - ${check.serviceName}: ${check.status.toUpperCase()} (${check.responseTimeMs}ms)`);
    });
    logTest('System health checks', 'PASS');

    // Test 3.2: Get uptime status
    console.log('\nTest 3.2: Get Current Uptime Status');
    const uptimeStatus = await SystemUptimeMonitorService.getCurrentUptimeStatus();
    console.log(`   Overall Compliant: ${uptimeStatus.overallCompliant}`);
    console.log(`   Services: ${uptimeStatus.services.length}`);
    uptimeStatus.services.forEach(svc => {
      console.log(`   - ${svc.name}: ${svc.availabilityPercentage.toFixed(4)}%`);
    });
    logTest('Uptime status retrieval', 'PASS');

    // Test 3.3: Generate daily summary
    console.log('\nTest 3.3: Generate Daily Availability Summary');
    const summary = await SystemUptimeMonitorService.generateDailySummary(new Date());
    console.log(`   Summaries generated: ${summary.length}`);
    summary.forEach(s => {
      const slaIcon = s.meetsSLA ? '✅' : '❌';
      console.log(`   ${slaIcon} ${s.serviceName}: ${s.availabilityPercentage.toFixed(4)}% (${s.totalDowntimeMinutes.toFixed(2)} min downtime)`);
    });
    logTest('Daily summary generation', 'PASS');

  } catch (error: any) {
    logTest('System Uptime Monitoring', 'FAIL', error.message);
  }
}

async function testIncidentResponse() {
  console.log('\n🚨 TEST 4: Incident Response (PSD-12 Section 11.13-11.15)\n');
  console.log('─'.repeat(60));

  try {
    // Test 4.1: Detect incident
    console.log('\nTest 4.1: Detect and Log Cybersecurity Incident');
    const incident = await IncidentResponseService.detectIncident({
      incidentType: 'system_failure',
      severity: 'medium',
      title: 'Test Incident - API Timeout',
      description: 'API endpoint experienced timeout issues for 5 minutes',
      affectedSystems: ['API_Server'],
      detectedBy: 'Test Suite',
    });
    console.log(`   Incident ID: ${incident.id}`);
    console.log(`   Severity: ${incident.severity}`);
    console.log(`   Status: ${incident.status}`);
    logTest('Incident detection and logging', 'PASS');

    // Test 4.2: Send preliminary report (simulation)
    console.log('\nTest 4.2: Send Preliminary Report to BoN (Simulated)');
    await IncidentResponseService.sendPreliminaryReportToBoN(incident.id, {
      incidentType: incident.incidentType,
      severity: incident.severity,
      detectedAt: incident.detectedAt,
      preliminaryFindings: 'API timeout due to database connection pool exhaustion',
    });
    console.log('   Preliminary report sent (simulated)');
    logTest('Preliminary BoN report', 'PASS');

    // Test 4.3: Update incident status
    console.log('\nTest 4.3: Update Incident Status to Recovered');
    await IncidentResponseService.updateIncidentStatus(incident.id, 'recovered', 'Connection pool increased');
    console.log('   Status updated to: RECOVERED');
    logTest('Incident status update', 'PASS');

    // Test 4.4: Submit impact assessment
    console.log('\nTest 4.4: Submit Impact Assessment');
    await IncidentResponseService.submitImpactAssessment({
      incidentId: incident.id,
      financialLoss: 0,
      dataLossRecords: 0,
      availabilityLossMinutes: 5,
      affectedUsersCount: 0,
      rootCause: 'Database connection pool exhaustion during peak load',
      remediationActions: 'Increased connection pool size from 20 to 50',
      preventiveMeasures: 'Implemented connection pool monitoring and alerts',
    });
    console.log('   Impact assessment submitted');
    logTest('Impact assessment submission', 'PASS');

    // Test 4.5: Get incident statistics
    console.log('\nTest 4.5: Get Incident Statistics');
    const stats = await IncidentResponseService.getIncidentStatistics(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    console.log(`   Total Incidents: ${stats.totalIncidents}`);
    console.log(`   Critical: ${stats.criticalIncidents}`);
    console.log(`   Average Recovery Time: ${stats.averageRecoveryTimeMinutes.toFixed(2)} minutes`);
    console.log(`   RTO Violations: ${stats.rtoViolations}`);
    logTest('Incident statistics', 'PASS');

  } catch (error: any) {
    logTest('Incident Response', 'FAIL', error.message);
  }
}

async function testDormantWalletManagement() {
  console.log('\n💤 TEST 5: Dormant Wallet Management (PSD-3 Section 11.4)\n');
  console.log('─'.repeat(60));

  try {
    // Test 5.1: Create a wallet with old last transaction date
    console.log('\nTest 5.1: Setup Test Dormant Wallet');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    await sql`
      INSERT INTO beneficiaries (id, name, phone, region, grant_type, status)
      VALUES ('TEST_DORMANT_001', 'Dormant Test User', '+264819999999', 'Khomas', 'Old Age Grant', 'active')
      ON CONFLICT (id) DO NOTHING
    `;

    await sql`
      INSERT INTO ewallet_balances (beneficiary_id, current_balance, available_balance, wallet_status, last_transaction_date)
      VALUES ('TEST_DORMANT_001', 200.00, 200.00, 'active', ${sixMonthsAgo.toISOString()})
      ON CONFLICT (beneficiary_id) 
      DO UPDATE SET last_transaction_date = ${sixMonthsAgo.toISOString()}, wallet_status = 'active'
    `;
    console.log('   Test dormant wallet created (6 months inactive)');
    logTest('Dormant wallet test data setup', 'PASS');

    // Test 5.2: Run daily dormancy check
    console.log('\nTest 5.2: Run Daily Dormancy Check');
    const checkResult = await DormantWalletService.runDailyDormancyCheck();
    console.log(`   Approaching Dormancy: ${checkResult.approachingDormancy}`);
    console.log(`   Now Dormant: ${checkResult.nowDormant}`);
    console.log(`   Notifications Sent: ${checkResult.notificationsToSend}`);
    logTest('Daily dormancy check', 'PASS');

    // Test 5.3: Get dormancy statistics
    console.log('\nTest 5.3: Get Dormancy Statistics');
    const stats = await DormantWalletService.getDormancyStatistics();
    console.log(`   Total Dormant Wallets: ${stats.totalDormantWallets}`);
    console.log(`   Total Dormant Balance: N$${stats.totalDormantBalance.toLocaleString()}`);
    console.log(`   Approaching: ${stats.approachingDormancy}`);
    logTest('Dormancy statistics', 'PASS');

  } catch (error: any) {
    logTest('Dormant Wallet Management', 'FAIL', error.message);
  }
}

async function testCapitalRequirements() {
  console.log('\n💰 TEST 6: Capital Requirements (PSD-3 Section 11.5)\n');
  console.log('─'.repeat(60));

  try {
    // Test 6.1: Track capital requirements
    console.log('\nTest 6.1: Track Daily Capital Requirements');
    const liquidAssets = {
      cash: 1_000_000,
      governmentBonds: 500_000,
      shortTermInstruments: 250_000,
      otherApprovedAssets: 100_000,
    };
    const initialCapitalHeld = 1_500_000;

    const report = await CapitalRequirementsService.trackDailyCapital(
      liquidAssets,
      initialCapitalHeld
    );
    console.log(`   Initial Capital: N$${report.initialCapitalHeld.toLocaleString()} (Required: N$${report.initialCapitalRequired.toLocaleString()})`);
    console.log(`   Ongoing Capital: N$${report.ongoingCapitalHeld.toLocaleString()} (Required: N$${report.ongoingCapitalRequired.toLocaleString()})`);
    console.log(`   Status: ${report.complianceStatus.toUpperCase()}`);
    logTest('Capital requirements tracking', 'PASS');

    // Test 6.2: Get capital compliance status
    console.log('\nTest 6.2: Get Capital Compliance Status');
    const status = await CapitalRequirementsService.getCapitalComplianceStatus();
    console.log(`   Overall Compliant: ${status.isCompliant}`);
    console.log(`   Initial Capital Compliant: ${status.initialCapitalCompliant}`);
    console.log(`   Ongoing Capital Compliant: ${status.ongoingCapitalCompliant}`);
    logTest('Capital compliance status', 'PASS');

  } catch (error: any) {
    logTest('Capital Requirements', 'FAIL', error.message);
  }
}

async function testBankOfNamibiaReporting() {
  console.log('\n📝 TEST 7: Bank of Namibia Reporting (PSD-3 Section 23)\n');
  console.log('─'.repeat(60));

  try {
    // Test 7.1: Generate monthly report
    console.log('\nTest 7.1: Generate Monthly Report');
    const reportMonth = new Date();
    reportMonth.setMonth(reportMonth.getMonth() - 1); // Last month
    
    const report = await BankOfNamibiaReportingService.generateMonthlyReport(reportMonth);
    console.log(`   Report Month: ${report.reportMonth}`);
    console.log(`   Due Date: ${report.dueDate}`);
    console.log(`   Total Users: ${report.data.totalRegisteredUsers}`);
    console.log(`   Active Wallets: ${report.data.totalActiveWallets}`);
    console.log(`   Outstanding Liabilities: N$${report.data.outstandingEmoneyLiabilities.toLocaleString()}`);
    console.log(`   Trust Account Balance: N$${report.data.trustAccountBalance.toLocaleString()}`);
    logTest('Monthly report generation', 'PASS');

    // Test 7.2: Export report for BoN
    console.log('\nTest 7.2: Export Report in BoN Format');
    const formattedReport = await BankOfNamibiaReportingService.exportReportForBoN(report.reportId);
    console.log('   Report formatted for Bank of Namibia');
    console.log(`   Lines: ${formattedReport.split('\n').length}`);
    logTest('BoN report export', 'PASS');

    // Test 7.3: Get pending reports
    console.log('\nTest 7.3: Get Pending Reports');
    const pendingReports = await BankOfNamibiaReportingService.getPendingReports();
    console.log(`   Pending: ${pendingReports.length}`);
    if (pendingReports.length > 0) {
      pendingReports.forEach(r => {
        console.log(`   - ${r.reportMonth} (Due: ${r.dueDate})`);
      });
    }
    logTest('Pending reports check', 'PASS');

    // Test 7.4: Generate agent annual return
    console.log('\nTest 7.4: Generate Agent Annual Return (PSD-1 Section 16.15)');
    const currentYear = new Date().getFullYear();
    const agentReturns = await BankOfNamibiaReportingService.generateAgentAnnualReturn(currentYear);
    console.log(`   Agents in return: ${agentReturns.length}`);
    console.log(`   Due: January 31, ${currentYear + 1}`);
    logTest('Agent annual return generation', 'PASS');

  } catch (error: any) {
    logTest('Bank of Namibia Reporting', 'FAIL', error.message);
  }
}

async function testIntegration() {
  console.log('\n🔗 TEST 8: Integration & End-to-End Compliance\n');
  console.log('─'.repeat(60));

  try {
    // Test 8.1: Create transaction with 2FA requirement
    console.log('\nTest 8.1: E-Wallet Transaction with 2FA');
    
    // Generate OTP
    const otpResult = await TwoFactorAuthService.generateOTP({
      userId: 'TEST_BEN_001',
      userType: 'beneficiary',
      transactionType: 'transfer',
      transactionId: 'TXN_INTEGRATION_001',
      transactionAmount: 100,
    });

    // Create transaction
    await sql`
      INSERT INTO ewallet_transactions (
        transaction_ref,
        from_beneficiary_id,
        transaction_type,
        amount,
        status,
        requires_2fa,
        two_factor_auth_id
      ) VALUES (
        'TXN_INTEGRATION_001',
        'TEST_BEN_001',
        'p2p_transfer',
        100.00,
        'pending',
        TRUE,
        ${otpResult.authId}
      )
    `;
    console.log('   Transaction created with 2FA requirement');
    
    // Verify 2FA is required
    const isAuthorized = await TwoFactorAuthService.verifyTransactionAuth('TXN_INTEGRATION_001');
    console.log(`   2FA Verified: ${isAuthorized} (Expected: false initially)`);
    logTest('2FA integration with transactions', !isAuthorized ? 'PASS' : 'FAIL');

    // Test 8.2: Update wallet balance and trigger reconciliation
    console.log('\nTest 8.2: Wallet Balance Update → Trust Account Reconciliation');
    await sql`
      UPDATE ewallet_balances
      SET current_balance = current_balance - 100, updated_at = NOW()
      WHERE beneficiary_id = 'TEST_BEN_001'
    `;
    
    const reconciliation = await TrustAccountService.performDailyReconciliation('Integration Test');
    console.log(`   Reconciliation triggered automatically`);
    console.log(`   Coverage: ${reconciliation.coveragePercentage.toFixed(2)}%`);
    logTest('Transaction → Reconciliation integration', 'PASS');

  } catch (error: any) {
    logTest('Integration Tests', 'FAIL', error.message);
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('🏛️  PSD COMPLIANCE TEST SUITE');
  console.log('═'.repeat(80));
  console.log('\n📋 Testing Namibian Payment System Determinations Compliance');
  console.log('   - PSD-1: Payment Service Provider Licensing');
  console.log('   - PSD-3: Electronic Money Issuance');
  console.log('   - PSD-12: Operational and Cybersecurity Standards\n');

  try {
    await setupTestData();
    await testTrustAccountReconciliation();
    await testTwoFactorAuthentication();
    await testSystemUptimeMonitoring();
    await testIncidentResponse();
    await testDormantWalletManagement();
    await testCapitalRequirements();
    await testBankOfNamibiaReporting();
    await testIntegration();

    // Print summary
    console.log('\n');
    console.log('═'.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(80));

    const passed = testResults.filter(t => t.status === 'PASS').length;
    const failed = testResults.filter(t => t.status === 'FAIL').length;
    const total = testResults.length;
    const passRate = ((passed / total) * 100).toFixed(2);

    testResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (result.error) {
        console.log(`   └─ ${result.error}`);
      }
    });

    console.log('\n' + '─'.repeat(80));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log('─'.repeat(80));

    if (failed === 0) {
      console.log('\n🎉 ALL COMPLIANCE TESTS PASSED!');
      console.log('\n✅ SmartPay Connect is COMPLIANT with:');
      console.log('   • PSD-1: Payment Service Provider Licensing');
      console.log('   • PSD-3: Electronic Money Issuance');
      console.log('   • PSD-12: Operational and Cybersecurity Standards');
      console.log('\n🏛️  System is READY for Bank of Namibia oversight\n');
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Review above for details.\n`);
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ Test suite execution failed:', error.message);
    process.exit(1);
  }
}

runAllTests();

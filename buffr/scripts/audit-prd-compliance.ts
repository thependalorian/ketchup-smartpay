/**
 * PRD Compliance Audit Script
 * 
 * Audits the Buffr app against the PRD to identify gaps
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

interface Requirement {
  id: string;
  category: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'implemented' | 'partial' | 'missing' | 'unknown';
  evidence: string[];
  gaps: string[];
  notes: string;
}

const auditResults: Requirement[] = [];

// Key requirements from PRD
const requirements: Omit<Requirement, 'status' | 'evidence' | 'gaps' | 'notes'>[] = [
  // Voucher Management
  {
    id: 'FR1.1',
    category: 'Voucher Management',
    description: 'Receive vouchers in real-time from Ketchup SmartPay',
    priority: 'P0',
  },
  {
    id: 'FR1.2',
    category: 'Voucher Management',
    description: 'Voucher delivery via mobile app (iOS/Android)',
    priority: 'P0',
  },
  {
    id: 'FR1.3',
    category: 'Voucher Management',
    description: 'Voucher delivery via USSD (*123#)',
    priority: 'P0',
  },
  {
    id: 'FR1.4',
    category: 'Voucher Management',
    description: 'SMS notifications for all vouchers',
    priority: 'P0',
  },
  {
    id: 'FR1.5',
    category: 'Voucher Management',
    description: 'NamQR code generation for in-person redemption',
    priority: 'P0',
  },
  {
    id: 'FR1.6',
    category: 'Voucher Management',
    description: 'View voucher history (app and USSD)',
    priority: 'P0',
  },
  {
    id: 'FR1.7',
    category: 'Voucher Management',
    description: 'Check voucher status (available, redeemed, expired)',
    priority: 'P0',
  },

  // Redemption Channels
  {
    id: 'FR2.1',
    category: 'Redemption Channels',
    description: 'Redeem to wallet (digital wallet)',
    priority: 'P0',
  },
  {
    id: 'FR2.2',
    category: 'Redemption Channels',
    description: 'Cash-out at NamPost branches',
    priority: 'P0',
  },
  {
    id: 'FR2.3',
    category: 'Redemption Channels',
    description: 'Bank transfer redemption',
    priority: 'P0',
  },
  {
    id: 'FR2.4',
    category: 'Redemption Channels',
    description: 'Merchant payment redemption',
    priority: 'P0',
  },
  {
    id: 'FR2.5',
    category: 'Redemption Channels',
    description: 'Cashback at merchant tills (reduces NamPost bottlenecks)',
    priority: 'P1',
  },
  {
    id: 'FR2.6',
    category: 'Redemption Channels',
    description: 'Biometric verification at NamPost',
    priority: 'P0',
  },

  // USSD Support
  {
    id: 'FR3.1',
    category: 'USSD Support',
    description: 'USSD gateway (*123#) for feature phones',
    priority: 'P0',
  },
  {
    id: 'FR3.2',
    category: 'USSD Support',
    description: 'PIN authentication via USSD',
    priority: 'P0',
  },
  {
    id: 'FR3.3',
    category: 'USSD Support',
    description: 'Balance checking via USSD',
    priority: 'P0',
  },
  {
    id: 'FR3.4',
    category: 'USSD Support',
    description: 'P2P transfers via USSD',
    priority: 'P0',
  },
  {
    id: 'FR3.5',
    category: 'USSD Support',
    description: 'Bill payments via USSD',
    priority: 'P0',
  },
  {
    id: 'FR3.6',
    category: 'USSD Support',
    description: 'Voucher management via USSD',
    priority: 'P0',
  },
  {
    id: 'FR3.7',
    category: 'USSD Support',
    description: 'Transaction history via USSD',
    priority: 'P0',
  },

  // Digital Payments
  {
    id: 'FR4.1',
    category: 'Digital Payments',
    description: 'P2P transfers via phone number or Buffr ID',
    priority: 'P0',
  },
  {
    id: 'FR4.2',
    category: 'Digital Payments',
    description: 'QR code payments (scan merchant QR)',
    priority: 'P0',
  },
  {
    id: 'FR4.3',
    category: 'Digital Payments',
    description: 'Bill payments (utilities, services)',
    priority: 'P0',
  },
  {
    id: 'FR4.4',
    category: 'Digital Payments',
    description: 'Split bills functionality',
    priority: 'P1',
  },
  {
    id: 'FR4.5',
    category: 'Digital Payments',
    description: 'Request money from contacts',
    priority: 'P1',
  },
  {
    id: 'FR4.6',
    category: 'Digital Payments',
    description: 'Bank transfers',
    priority: 'P0',
  },

  // Security & Authentication
  {
    id: 'FR5.1',
    category: 'Security',
    description: '2FA for all payments (PIN or biometric)',
    priority: 'P0',
  },
  {
    id: 'FR5.2',
    category: 'Security',
    description: 'Biometric authentication (mobile app)',
    priority: 'P0',
  },
  {
    id: 'FR5.3',
    category: 'Security',
    description: 'PIN authentication (USSD and app)',
    priority: 'P0',
  },
  {
    id: 'FR5.4',
    category: 'Security',
    description: 'Encryption at rest and in transit',
    priority: 'P0',
  },
  {
    id: 'FR5.5',
    category: 'Security',
    description: 'Complete audit trail (5-year retention)',
    priority: 'P0',
  },

  // Multi-Channel Wallet
  {
    id: 'FR6.1',
    category: 'Wallet',
    description: 'Unified wallet (same wallet via app and USSD)',
    priority: 'P0',
  },
  {
    id: 'FR6.2',
    category: 'Wallet',
    description: 'Auto-create main wallet during onboarding',
    priority: 'P0',
  },
  {
    id: 'FR6.3',
    category: 'Wallet',
    description: 'Transaction history across all channels',
    priority: 'P0',
  },

  // Integrations
  {
    id: 'INT1.1',
    category: 'Integrations',
    description: 'Ketchup SmartPay API integration',
    priority: 'P0',
  },
  {
    id: 'INT1.2',
    category: 'Integrations',
    description: 'NamPost biometric integration',
    priority: 'P0',
  },
  {
    id: 'INT1.3',
    category: 'Integrations',
    description: 'Apache Fineract integration',
    priority: 'P0',
  },
  {
    id: 'INT1.4',
    category: 'Integrations',
    description: 'IPS (Instant Payment System) integration',
    priority: 'P1',
  },
  {
    id: 'INT1.5',
    category: 'Integrations',
    description: 'NamPay integration',
    priority: 'P1',
  },

  // Compliance
  {
    id: 'COMP1.1',
    category: 'Compliance',
    description: 'PSD-1 compliance',
    priority: 'P0',
  },
  {
    id: 'COMP1.2',
    category: 'Compliance',
    description: 'PSD-3 compliance',
    priority: 'P0',
  },
  {
    id: 'COMP1.3',
    category: 'Compliance',
    description: 'PSD-12 compliance',
    priority: 'P0',
  },
  {
    id: 'COMP1.4',
    category: 'Compliance',
    description: 'PSDIR-11 compliance',
    priority: 'P0',
  },
  {
    id: 'COMP1.5',
    category: 'Compliance',
    description: 'Daily reconciliation (PSD-3)',
    priority: 'P0',
  },
];

async function checkRequirement(requirement: Omit<Requirement, 'status' | 'evidence' | 'gaps' | 'notes'>): Promise<Requirement> {
  const evidence: string[] = [];
  const gaps: string[] = [];
  let status: Requirement['status'] = 'unknown';
  let notes = '';

  // Search for implementation evidence
  const searchPatterns = getSearchPatterns(requirement.id);
  
  for (const pattern of searchPatterns) {
    try {
      const files = await glob(pattern, { cwd: join(process.cwd(), 'buffr') });
      if (files.length > 0) {
        evidence.push(...files.slice(0, 5)); // Limit to 5 files
      }
    } catch (e) {
      // Pattern not found, continue
    }
  }

  // Determine status
  if (evidence.length > 0) {
    status = 'implemented';
  } else {
    status = 'missing';
    gaps.push(`No implementation found for ${requirement.description}`);
  }

  return {
    ...requirement,
    status,
    evidence,
    gaps,
    notes,
  };
}

function getSearchPatterns(requirementId: string): string[] {
  const patterns: Record<string, string[]> = {
    'FR1.1': ['**/api/**/smartpay/**', '**/api/**/vouchers/**', '**/services/ketchupSmartPayService.ts'],
    'FR1.2': ['**/app/utilities/vouchers/**', '**/components/vouchers/**'],
    'FR1.3': ['**/api/ussd/**', '**/services/ussdService.ts'],
    'FR1.4': ['**/utils/sendPushNotification.ts', '**/utils/pushNotifications.ts'],
    'FR1.5': ['**/utils/voucherNamQR.ts', '**/utils/namqr/**'],
    'FR1.6': ['**/app/utilities/vouchers/history.tsx', '**/api/utilities/vouchers/**'],
    'FR1.7': ['**/api/utilities/vouchers/**'],
    'FR2.1': ['**/api/utilities/vouchers/redeem.ts'],
    'FR2.2': ['**/api/nampost/**', '**/services/namPostService.ts'],
    'FR2.3': ['**/api/payments/bank-transfer.ts'],
    'FR2.4': ['**/api/payments/merchant-payment.ts'],
    'FR2.5': ['**/docs/CASHBACK_ANALYSIS.md'],
    'FR2.6': ['**/api/nampost/**'],
    'FR3.1': ['**/api/ussd/**', '**/services/ussdService.ts'],
    'FR3.2': ['**/api/ussd/**'],
    'FR3.3': ['**/api/ussd/**'],
    'FR3.4': ['**/api/ussd/**'],
    'FR3.5': ['**/api/ussd/**'],
    'FR3.6': ['**/api/ussd/vouchers/**'],
    'FR3.7': ['**/api/ussd/**'],
    'FR4.1': ['**/app/send-money/**', '**/api/payments/send.ts'],
    'FR4.2': ['**/app/qr-scanner.tsx', '**/components/qr/**'],
    'FR4.3': ['**/app/utilities/**', '**/api/utilities/**'],
    'FR4.4': ['**/app/split-bill/**', '**/api/payments/split-bill/**'],
    'FR4.5': ['**/app/request-money/**', '**/api/requests/**'],
    'FR4.6': ['**/api/payments/bank-transfer.ts'],
    'FR5.1': ['**/utils/auth.ts', '**/app/api/auth/**'],
    'FR5.2': ['**/app/onboarding/faceid.tsx', '**/utils/auth.ts'],
    'FR5.3': ['**/utils/auth.ts'],
    'FR5.4': ['**/utils/encryption.ts', '**/utils/encryptedFields.ts'],
    'FR5.5': ['**/utils/auditLogger.ts', '**/app/api/admin/audit-logs/**'],
    'FR6.1': ['**/app/wallets/**', '**/api/wallets/**'],
    'FR6.2': ['**/app/onboarding/**', '**/api/wallets/**'],
    'FR6.3': ['**/app/transactions/**', '**/api/transactions/**'],
    'INT1.1': ['**/services/ketchupSmartPayService.ts', '**/api/webhooks/smartpay/**'],
    'INT1.2': ['**/services/namPostService.ts', '**/api/nampost/**'],
    'INT1.3': ['**/services/fineractService.ts', '**/api/fineract/**'],
    'INT1.4': ['**/services/ipsService.ts', '**/api/ips/**'],
    'INT1.5': ['**/services/nampayService.ts'],
    'COMP1.1': ['**/docs/**'],
    'COMP1.2': ['**/docs/**'],
    'COMP1.3': ['**/docs/**'],
    'COMP1.4': ['**/docs/**'],
    'COMP1.5': ['**/app/admin/trust-account.tsx', '**/api/admin/trust-account/**'],
  };

  return patterns[requirementId] || ['**/*'];
}

async function runAudit() {
  console.log('🔍 Starting PRD Compliance Audit...\n');

  for (const req of requirements) {
    const result = await checkRequirement(req);
    auditResults.push(result);
    console.log(`${result.status === 'implemented' ? '✅' : result.status === 'partial' ? '⚠️' : '❌'} ${result.id}: ${result.description}`);
  }

  // Generate report
  const report = generateReport(auditResults);
  const reportPath = join(process.cwd(), 'docs/PRD_COMPLIANCE_AUDIT.md');
  writeFileSync(reportPath, report);

  console.log(`\n✅ Audit complete! Report saved to: ${reportPath}`);
}

function generateReport(results: Requirement[]): string {
  const implemented = results.filter(r => r.status === 'implemented');
  const partial = results.filter(r => r.status === 'partial');
  const missing = results.filter(r => r.status === 'missing');
  const unknown = results.filter(r => r.status === 'unknown');

  const p0Implemented = results.filter(r => r.priority === 'P0' && r.status === 'implemented');
  const p0Missing = results.filter(r => r.priority === 'P0' && r.status === 'missing');

  return `# PRD Compliance Audit Report

**Date:** ${new Date().toISOString().split('T')[0]}  
**Total Requirements:** ${results.length}  
**Status:** ${implemented.length} implemented, ${partial.length} partial, ${missing.length} missing, ${unknown.length} unknown

---

## Executive Summary

**Overall Compliance:** ${((implemented.length / results.length) * 100).toFixed(1)}%

**Priority Breakdown:**
- **P0 (Critical):** ${p0Implemented.length}/${p0Implemented.length + p0Missing.length} implemented (${((p0Implemented.length / (p0Implemented.length + p0Missing.length)) * 100).toFixed(1)}%)
- **P1 (High):** ${results.filter(r => r.priority === 'P1' && r.status === 'implemented').length}/${results.filter(r => r.priority === 'P1').length} implemented
- **P2 (Medium):** ${results.filter(r => r.priority === 'P2' && r.status === 'implemented').length}/${results.filter(r => r.priority === 'P2').length} implemented
- **P3 (Low):** ${results.filter(r => r.priority === 'P3' && r.status === 'implemented').length}/${results.filter(r => r.priority === 'P3').length} implemented

---

## Critical Gaps (P0 Missing)

${p0Missing.length > 0 ? p0Missing.map(r => `### ${r.id}: ${r.description}\n\n**Category:** ${r.category}\n**Gaps:**\n${r.gaps.map(g => `- ${g}`).join('\n')}\n`).join('\n') : '✅ All P0 requirements implemented!'}

---

## Detailed Results by Category

${Object.entries(
  results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, Requirement[]>)
).map(([category, reqs]) => {
  const catImplemented = reqs.filter(r => r.status === 'implemented').length;
  const catMissing = reqs.filter(r => r.status === 'missing').length;
  return `### ${category}

**Status:** ${catImplemented}/${reqs.length} implemented (${((catImplemented / reqs.length) * 100).toFixed(1)}%)

${reqs.map(r => {
  const icon = r.status === 'implemented' ? '✅' : r.status === 'partial' ? '⚠️' : '❌';
  return `${icon} **${r.id}** (${r.priority}): ${r.description}
${r.evidence.length > 0 ? `   - Evidence: ${r.evidence.slice(0, 3).join(', ')}` : ''}
${r.gaps.length > 0 ? `   - Gaps: ${r.gaps.join(', ')}` : ''}`;
}).join('\n\n')}
`;
}).join('\n\n')}

---

## Recommendations

${generateRecommendations(results)}

---

## Next Steps

1. **Address P0 Gaps:** ${p0Missing.length} critical requirements need implementation
2. **Verify Implementations:** Review evidence for all "implemented" requirements
3. **Test Coverage:** Ensure all implemented features have test coverage
4. **Documentation:** Update documentation for any missing features

---

**Report Generated:** ${new Date().toISOString()}
`;
}

function generateRecommendations(results: Requirement[]): string {
  const p0Missing = results.filter(r => r.priority === 'P0' && r.status === 'missing');
  
  if (p0Missing.length === 0) {
    return '✅ All critical (P0) requirements are implemented. Focus on P1 requirements and testing.';
  }

  return `### Priority Actions

1. **Immediate (P0 Gaps):**
${p0Missing.map(r => `   - ${r.id}: ${r.description}`).join('\n')}

2. **High Priority (P1 Missing):**
${results.filter(r => r.priority === 'P1' && r.status === 'missing').map(r => `   - ${r.id}: ${r.description}`).join('\n') || '   - None'}

3. **Testing & Verification:**
   - Verify all "implemented" requirements with integration tests
   - Test USSD gateway functionality
   - Test multi-channel wallet synchronization
   - Test voucher redemption flows
`;
}

// Run audit
runAudit().catch(console.error);

/**
 * Frontend-Backend Endpoint Alignment Script
 * 
 * Location: scripts/align-frontend-backend-endpoints.ts
 * Purpose: Detect and fix endpoint misalignments between frontend and backend
 * 
 * Issues to Fix:
 * 1. Base URL includes /api but endpoints don't (or vice versa)
 * 2. Removed agents (Scout, Mentor) still referenced in frontend
 * 3. Endpoint paths don't match backend routes
 * 4. Missing /api prefix in endpoint paths
 * 
 * Usage:
 *   npx tsx scripts/align-frontend-backend-endpoints.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import logger from '@/utils/logger';

const PROJECT_ROOT = process.cwd();

// ============================================================================
// Backend Endpoints (Python AI Backend - Port 8001)
// ============================================================================

const PYTHON_BACKEND_ENDPOINTS = {
  // Core
  health: { method: 'GET', path: '/health' },
  root: { method: 'GET', path: '/' },
  
  // Guardian Agent
  guardianFraudCheck: { method: 'POST', path: '/api/guardian/fraud/check' },
  guardianCreditAssess: { method: 'POST', path: '/api/guardian/credit/assess' },
  guardianChat: { method: 'POST', path: '/api/guardian/chat' },
  guardianHealth: { method: 'GET', path: '/api/guardian/health' },
  
  // Transaction Analyst Agent
  transactionAnalystClassify: { method: 'POST', path: '/api/transaction-analyst/classify' },
  transactionAnalystAnalyze: { method: 'POST', path: '/api/transaction-analyst/analyze' },
  transactionAnalystBudget: { method: 'POST', path: '/api/transaction-analyst/budget' },
  transactionAnalystChat: { method: 'POST', path: '/api/transaction-analyst/chat' },
  transactionAnalystHealth: { method: 'GET', path: '/api/transaction-analyst/health' },
  
  // Companion Agent
  companionChat: { method: 'POST', path: '/api/companion/chat' },
  companionChatStream: { method: 'POST', path: '/api/companion/chat/stream' },
  companionMultiAgent: { method: 'POST', path: '/api/companion/multi-agent' },
  companionContext: { method: 'GET', path: '/api/companion/context/{user_id}' },
  companionHistory: { method: 'GET', path: '/api/companion/history/{session_id}' },
  companionHealth: { method: 'GET', path: '/api/companion/health' },
  
  // ML API
  mlFraudCheck: { method: 'POST', path: '/api/ml/fraud/check' },
  mlCreditAssess: { method: 'POST', path: '/api/ml/credit/assess' },
  mlTransactionsClassify: { method: 'POST', path: '/api/ml/transactions/classify' },
  mlSpendingAnalyze: { method: 'POST', path: '/api/ml/spending/analyze' },
  
  // RAG Agent
  chat: { method: 'POST', path: '/chat' },
  chatSimple: { method: 'POST', path: '/chat/simple' },
  chatStream: { method: 'POST', path: '/chat/stream' },
  searchVector: { method: 'POST', path: '/search/vector' },
  searchGraph: { method: 'POST', path: '/search/graph' },
  searchHybrid: { method: 'POST', path: '/search/hybrid' },
  documents: { method: 'GET', path: '/documents' },
  sessions: { method: 'GET', path: '/sessions/{session_id}' },
};

// ============================================================================
// Frontend Endpoint Mappings (Current - WRONG)
// ============================================================================

const FRONTEND_ENDPOINT_ISSUES = [
  {
    file: 'utils/buffrAIClient.ts',
    issues: [
      {
        line: 'return apiPost<FraudCheckResponse>(\'/guardian/fraud/check\', request);',
        fix: 'return apiPost<FraudCheckResponse>(\'/api/guardian/fraud/check\', request);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiPost<CreditAssessmentResponse>(\'/guardian/credit/assess\', request);',
        fix: 'return apiPost<CreditAssessmentResponse>(\'/api/guardian/credit/assess\', request);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiPost(\'/guardian/chat\', {}, queryParams);',
        fix: 'return apiPost(\'/api/guardian/chat\', {}, queryParams);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiPost<TransactionClassificationResponse>(\'/transaction-analyst/classify\', request);',
        fix: 'return apiPost<TransactionClassificationResponse>(\'/api/transaction-analyst/classify\', request);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiPost<SpendingAnalysisResponse>(\'/transaction-analyst/analyze\', request);',
        fix: 'return apiPost<SpendingAnalysisResponse>(\'/api/transaction-analyst/analyze\', request);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiPost<BudgetResponse>(\'/transaction-analyst/budget\', request);',
        fix: 'return apiPost<BudgetResponse>(\'/api/transaction-analyst/budget\', request);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiPost<CompanionChatResponse>(\'/companion/chat\', request);',
        fix: 'return apiPost<CompanionChatResponse>(\'/api/companion/chat\', request);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiGet<UserContextResponse>(`/companion/context/${userId}`);',
        fix: 'return apiGet<UserContextResponse>(`/api/companion/context/${userId}`);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiGet(`/companion/history/${sessionId}?limit=${limit}`);',
        fix: 'return apiGet(`/api/companion/history/${sessionId}?limit=${limit}`);',
        reason: 'Missing /api prefix',
      },
      {
        line: 'return apiGet(\'/health\');',
        fix: 'return apiGet(\'/health\');', // No change - health is at root
        reason: 'Health check is correct',
      },
      // REMOVED AGENTS - Should be removed or commented out
      {
        line: 'async searchFinancialInfo',
        fix: '// REMOVED: Scout Agent not available in Python backend',
        reason: 'Scout agent removed - not relevant to G2P vouchers',
      },
      {
        line: 'async getExchangeRates',
        fix: '// REMOVED: Scout Agent not available in Python backend',
        reason: 'Scout agent removed - not relevant to G2P vouchers',
      },
      {
        line: 'async forecastSpending',
        fix: '// REMOVED: Scout Agent not available in Python backend',
        reason: 'Scout agent removed - not relevant to G2P vouchers',
      },
      {
        line: 'async chatWithScout',
        fix: '// REMOVED: Scout Agent not available in Python backend',
        reason: 'Scout agent removed - not relevant to G2P vouchers',
      },
      {
        line: 'async assessLiteracy',
        fix: '// REMOVED: Mentor Agent not available in Python backend',
        reason: 'Mentor agent removed - not relevant to G2P vouchers',
      },
      {
        line: 'async explainConcept',
        fix: '// REMOVED: Mentor Agent not available in Python backend',
        reason: 'Mentor agent removed - not relevant to G2P vouchers',
      },
      {
        line: 'async chatWithMentor',
        fix: '// REMOVED: Mentor Agent not available in Python backend',
        reason: 'Mentor agent removed - not relevant to G2P vouchers',
      },
    ],
  },
  {
    file: 'hooks/useBuffrAI.ts',
    issues: [
      {
        line: 'const response = await fetch(`${apiUrl}/companion/chat/stream`, {',
        fix: 'const response = await fetch(`${apiUrl}/api/companion/chat/stream`, {',
        reason: 'Missing /api prefix in streaming endpoint',
      },
    ],
  },
];

// ============================================================================
// Fix Functions
// ============================================================================

/**
 * Fix buffrAIClient.ts
 */
function fixBuffrAIClient(): void {
  const filePath = join(PROJECT_ROOT, 'utils/buffrAIClient.ts');
  let content = readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  // Fix 1: Update base URL to NOT include /api (endpoints will include it)
  const oldBaseUrl = "return 'http://localhost:8001/api';";
  const newBaseUrl = "return 'http://localhost:8001';";
  if (content.includes(oldBaseUrl)) {
    content = content.replace(oldBaseUrl, newBaseUrl);
    changes++;
    logger.info('✅ Fixed base URL (removed /api suffix)');
  }
  
  const oldBaseUrlAndroid = "return 'http://10.0.2.2:8001/api';";
  const newBaseUrlAndroid = "return 'http://10.0.2.2:8001';";
  if (content.includes(oldBaseUrlAndroid)) {
    content = content.replace(oldBaseUrlAndroid, newBaseUrlAndroid);
    changes++;
    logger.info('✅ Fixed Android base URL (removed /api suffix)');
  }
  
  const oldBaseUrlProd = "return 'https://api.buffr.ai/api';";
  const newBaseUrlProd = "return 'https://api.buffr.ai';";
  if (content.includes(oldBaseUrlProd)) {
    content = content.replace(oldBaseUrlProd, newBaseUrlProd);
    changes++;
    logger.info('✅ Fixed production base URL (removed /api suffix)');
  }
  
  // Fix 2: Add /api prefix to all endpoint paths
  const endpointFixes = [
    { old: "'/guardian/fraud/check'", new: "'/api/guardian/fraud/check'" },
    { old: "'/guardian/credit/assess'", new: "'/api/guardian/credit/assess'" },
    { old: "'/guardian/chat'", new: "'/api/guardian/chat'" },
    { old: "'/transaction-analyst/classify'", new: "'/api/transaction-analyst/classify'" },
    { old: "'/transaction-analyst/analyze'", new: "'/api/transaction-analyst/analyze'" },
    { old: "'/transaction-analyst/budget'", new: "'/api/transaction-analyst/budget'" },
    { old: "'/companion/chat'", new: "'/api/companion/chat'" },
    { old: '`/companion/context/${userId}`', new: '`/api/companion/context/${userId}`' },
    { old: '`/companion/history/${sessionId}', new: '`/api/companion/history/${sessionId}' },
  ];
  
  for (const fix of endpointFixes) {
    if (content.includes(fix.old) && !content.includes(fix.new)) {
      content = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
      changes++;
      logger.info(`✅ Fixed endpoint: ${fix.old} → ${fix.new}`);
    }
  }
  
  // Fix 3: Comment out or remove Scout, Mentor, Crafter agent methods
  // (These are not available in Python backend for G2P vouchers)
  const removedAgents = [
    { pattern: /async searchFinancialInfo[\s\S]*?}/g, name: 'Scout Agent - searchFinancialInfo' },
    { pattern: /async getExchangeRates[\s\S]*?}/g, name: 'Scout Agent - getExchangeRates' },
    { pattern: /async forecastSpending[\s\S]*?}/g, name: 'Scout Agent - forecastSpending' },
    { pattern: /async chatWithScout[\s\S]*?}/g, name: 'Scout Agent - chatWithScout' },
    { pattern: /async assessLiteracy[\s\S]*?}/g, name: 'Mentor Agent - assessLiteracy' },
    { pattern: /async explainConcept[\s\S]*?}/g, name: 'Mentor Agent - explainConcept' },
    { pattern: /async chatWithMentor[\s\S]*?}/g, name: 'Mentor Agent - chatWithMentor' },
  ];
  
  for (const agent of removedAgents) {
    if (agent.pattern.test(content)) {
      // Comment out the method
      content = content.replace(agent.pattern, (match) => {
        return `// REMOVED: ${agent.name} - Not available in Python backend (G2P voucher platform)\n  /*\n  ${match}\n  */`;
      });
      changes++;
      logger.warn(`⚠️  Commented out: ${agent.name}`);
    }
  }
  
  // Fix 4: Update Crafter agent endpoints (only available in TypeScript backend)
  // Comment them out or add note that they're TypeScript-only
  const crafterMethods = [
    { pattern: /async createScheduledPayment[\s\S]*?}/g, name: 'Crafter Agent - createScheduledPayment' },
    { pattern: /async setSpendingAlert[\s\S]*?}/g, name: 'Crafter Agent - setSpendingAlert' },
    { pattern: /async chatWithCrafter[\s\S]*?}/g, name: 'Crafter Agent - chatWithCrafter' },
  ];
  
  for (const method of crafterMethods) {
    if (method.pattern.test(content)) {
      content = content.replace(method.pattern, (match) => {
        return `// NOTE: ${method.name} - Available in TypeScript backend (port 8000) only\n  // Python backend (port 8001) does not include Crafter agent\n  /*\n  ${match}\n  */`;
      });
      changes++;
      logger.warn(`⚠️  Commented out: ${method.name} (TypeScript backend only)`);
    }
  }
  
  if (changes > 0) {
    writeFileSync(filePath, content, 'utf-8');
    logger.info(`\n✅ Fixed ${changes} issues in buffrAIClient.ts`);
  } else {
    logger.info('✅ No issues found in buffrAIClient.ts');
  }
}

/**
 * Fix useBuffrAI.ts hook
 */
function fixUseBuffrAI(): void {
  const filePath = join(PROJECT_ROOT, 'hooks/useBuffrAI.ts');
  let content = readFileSync(filePath, 'utf-8');
  let changes = 0;
  
  // Fix streaming endpoint
  const oldStreaming = 'const response = await fetch(`${apiUrl}/companion/chat/stream`, {';
  const newStreaming = 'const response = await fetch(`${apiUrl}/api/companion/chat/stream`, {';
  
  if (content.includes(oldStreaming) && !content.includes(newStreaming)) {
    content = content.replace(oldStreaming, newStreaming);
    changes++;
    logger.info('✅ Fixed streaming endpoint path');
  }
  
  // Remove references to Scout, Mentor agents in imports/types
  const removedAgentImports = [
    'LiteracyAssessmentRequest',
    'LiteracyAssessmentResponse',
    'LearningPathRequest',
    'LearningPathResponse',
  ];
  
  for (const importName of removedAgentImports) {
    if (content.includes(importName)) {
      // Comment out the import
      content = content.replace(
        new RegExp(`(,?\\s*)${importName}(,?)`, 'g'),
        (match, before, after) => {
          // Only remove if it's in the import list, not in usage
          if (match.includes(',')) {
            return after === ',' ? '' : before;
          }
          return `/* REMOVED: ${importName} - Mentor agent not in Python backend */${before}`;
        }
      );
      changes++;
      logger.warn(`⚠️  Removed import: ${importName}`);
    }
  }
  
  if (changes > 0) {
    writeFileSync(filePath, content, 'utf-8');
    logger.info(`\n✅ Fixed ${changes} issues in useBuffrAI.ts`);
  } else {
    logger.info('✅ No issues found in useBuffrAI.ts');
  }
}

/**
 * Generate alignment report
 */
function generateAlignmentReport(): void {
  logger.info('\n📊 Frontend-Backend Endpoint Alignment Report');
  logger.info('='.repeat(70));
  
  logger.info('\n✅ Correct Endpoints:');
  logger.info('  - /api/guardian/fraud/check');
  logger.info('  - /api/guardian/credit/assess');
  logger.info('  - /api/guardian/chat');
  logger.info('  - /api/transaction-analyst/classify');
  logger.info('  - /api/transaction-analyst/analyze');
  logger.info('  - /api/transaction-analyst/budget');
  logger.info('  - /api/companion/chat');
  logger.info('  - /api/companion/chat/stream');
  logger.info('  - /api/companion/context/{user_id}');
  logger.info('  - /api/companion/history/{session_id}');
  logger.info('  - /health');
  
  logger.info('\n❌ Removed Agents (Not in Python Backend):');
  logger.info('  - Scout Agent (market intelligence)');
  logger.info('  - Mentor Agent (financial education)');
  logger.info('  - Crafter Agent (workflow automation) - TypeScript backend only');
  
  logger.info('\n⚠️  Action Required:');
  logger.info('  1. Update base URL to NOT include /api');
  logger.info('  2. Add /api prefix to all endpoint paths');
  logger.info('  3. Remove or comment out Scout/Mentor agent methods');
  logger.info('  4. Note that Crafter agent is TypeScript-only');
  logger.info('  5. Test all endpoints after fixes');
}

/**
 * Main execution
 */
async function main() {
  logger.info('🔧 Frontend-Backend Endpoint Alignment Script');
  logger.info('='.repeat(70));
  logger.info('Fixing endpoint misalignments between frontend and Python AI backend');
  logger.info('='.repeat(70));
  
  try {
    // Generate report first
    generateAlignmentReport();
    
    // Fix files
    logger.info('\n🔨 Applying Fixes...\n');
    fixBuffrAIClient();
    fixUseBuffrAI();
    
    logger.info('\n' + '='.repeat(70));
    logger.info('✅ Alignment Complete!');
    logger.info('='.repeat(70));
    logger.info('\n📋 Next Steps:');
    logger.info('  1. Review the changes in utils/buffrAIClient.ts');
    logger.info('  2. Review the changes in hooks/useBuffrAI.ts');
    logger.info('  3. Test the endpoints:');
    logger.info('     - Start Python AI backend: cd buffr_ai && source .venv/bin/activate && python -m uvicorn main:app --port 8001');
    logger.info('     - Test endpoints: ./scripts/test-ai-backend.sh');
    logger.info('  4. Update any components using removed agents (Scout, Mentor)');
    logger.info('  5. Update documentation if needed');
    logger.info('\n');
  } catch (error: any) {
    logger.error('❌ Alignment failed:', error.message);
    logger.error(error.stack);
    process.exit(1);
  }
}

main().catch(console.error);

/**
 * API Security Standardization Script
 * 
 * Purpose: Audit and document API security standardization
 * Location: scripts/standardize-api-security.ts
 * 
 * This script identifies endpoints that need security standardization
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import logger from '@/utils/logger';

interface EndpointInfo {
  file: string;
  methods: string[];
  usesSecureAuthRoute: boolean;
  usesManualPattern: boolean;
  usesCustomJsonResponse: boolean;
  missingSecurity: boolean;
  needsUpdate: boolean;
}

async function auditAPISecurity() {
  const apiDir = path.join(process.cwd(), 'app', 'api');
  const files = await glob('**/*.ts', { cwd: apiDir, absolute: true });
  
  const endpoints: EndpointInfo[] = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(apiDir, file);
    
    // Check for exported HTTP methods
    const hasGET = /export\s+(const|function)\s+GET/.test(content);
    const hasPOST = /export\s+(const|function)\s+POST/.test(content);
    const hasPUT = /export\s+(const|function)\s+PUT/.test(content);
    const hasDELETE = /export\s+(const|function)\s+DELETE/.test(content);
    const hasPATCH = /export\s+(const|function)\s+PATCH/.test(content);
    
    const methods: string[] = [];
    if (hasGET) methods.push('GET');
    if (hasPOST) methods.push('POST');
    if (hasPUT) methods.push('PUT');
    if (hasDELETE) methods.push('DELETE');
    if (hasPATCH) methods.push('PATCH');
    
    if (methods.length === 0) continue;
    
    const usesSecureAuthRoute = /secureAuthRoute/.test(content);
    const usesSecureAdminRoute = /secureAdminRoute/.test(content);
    const usesSecureRoute = /secureRoute/.test(content);
    const usesManualPattern = /withSecurityHeaders\s*\(\s*withRateLimitAndAuth/.test(content);
    const usesCustomJsonResponse = /const jsonResponse\s*=/.test(content);
    const missingSecurity = !usesSecureAuthRoute && !usesSecureAdminRoute && !usesSecureRoute && !usesManualPattern;
    const needsUpdate = missingSecurity || usesManualPattern || usesCustomJsonResponse;
    
    endpoints.push({
      file: relativePath,
      methods,
      usesSecureAuthRoute: usesSecureAuthRoute || usesSecureAdminRoute || usesSecureRoute,
      usesManualPattern,
      usesCustomJsonResponse,
      missingSecurity,
      needsUpdate,
    });
  }
  
  return endpoints;
}

async function main() {
  logger.info('🔍 Auditing API security...\n');
  
  const endpoints = await auditAPISecurity();
  
  const needsUpdate = endpoints.filter(e => e.needsUpdate);
  const secure = endpoints.filter(e => !e.needsUpdate);
  
  logger.info(`✅ Secure endpoints: ${secure.length}`);
  logger.info(`⚠️  Endpoints needing updates: ${needsUpdate.length}\n`);
  
  if (needsUpdate.length > 0) {
    logger.info('📋 Endpoints requiring standardization:\n');
    needsUpdate.forEach(e => {
      logger.info(`  ${e.file}`);
      logger.info(`    Methods: ${e.methods.join(', ')}`);
      if (e.missingSecurity) logger.info(`    ❌ Missing security wrapper`);
      if (e.usesManualPattern) logger.info(`    ⚠️  Uses manual pattern (should use secureAuthRoute/secureAdminRoute)`);
      if (e.usesCustomJsonResponse) logger.info(`    ⚠️  Uses custom jsonResponse (should use apiResponse helpers)`);
      logger.info('');
    });
  }
  
  // Generate report
  const report = {
    total: endpoints.length,
    secure: secure.length,
    needsUpdate: needsUpdate.length,
    endpoints: needsUpdate.map(e => ({
      file: e.file,
      methods: e.methods,
      issues: [
        e.missingSecurity && 'missing_security',
        e.usesManualPattern && 'manual_pattern',
        e.usesCustomJsonResponse && 'custom_json_response',
      ].filter(Boolean),
    })),
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'API_SECURITY_AUDIT.json'),
    JSON.stringify(report, null, 2)
  );
  
  logger.info('📄 Report saved to API_SECURITY_AUDIT.json');
}

main().catch(console.error);

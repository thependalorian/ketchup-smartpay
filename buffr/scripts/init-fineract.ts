/**
 * Fineract Initialization Script
 * 
 * Location: scripts/init-fineract.ts
 * Purpose: Initialize Fineract with default products, offices, and configuration
 * 
 * This script:
 * 1. Creates default office (if not exists)
 * 2. Creates voucher product (for G2P vouchers)
 * 3. Creates wallet product (for digital wallets)
 * 4. Creates trust account product (for trust account)
 * 5. Creates trust account (savings account)
 * 6. Validates configuration
 * 
 * Usage:
 *   npx tsx scripts/init-fineract.ts
 * 
 * Prerequisites:
 *   - Fineract instance running and accessible
 *   - Environment variables configured (FINERACT_WRITE_URL, credentials)
 */

import { fineractService } from '@/services/fineractService';
import logger from '@/utils/logger';
import { validateFineractEnvironment, logValidationResults } from '@/utils/fineractEnvValidation';

// For development: Allow self-signed SSL certificates
// In production, use proper CA-signed certificates
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// ============================================================================
// CONFIGURATION
// ============================================================================

interface FineractProduct {
  name: string;
  shortName: string; // Max 4 characters
  description: string;
  currencyCode: string;
  digitsAfterDecimal: number;
  interestCompoundingPeriodType: number;
  interestPostingPeriodType: number;
  interestCalculationType: number;
  interestCalculationDaysInYearType: number;
  accountingRule: number;
  nominalAnnualInterestRate: number;
  // Accounting account IDs (required when accountingRule = 2)
  savingsControlAccountId?: number;
  savingsReferenceAccountId?: number;
  transfersInSuspenseAccountId?: number;
  interestOnSavingsAccountId?: number;
  incomeFromFeeAccountId?: number;
  incomeFromPenaltyAccountId?: number;
  overdraftPortfolioControlId?: number;
  incomeFromInterestId?: number;
  writeOffAccountId?: number;
}

// Default products configuration
const DEFAULT_PRODUCTS: Record<string, FineractProduct> = {
  voucher: {
    name: 'G2P Voucher Product',
    shortName: 'Vchr', // Max 4 chars
    description: 'Product for G2P voucher management (Old Age Grant, Disability Grant, Child Support Grant)',
    currencyCode: 'NAD',
    digitsAfterDecimal: 2,
    interestCompoundingPeriodType: 1, // Daily
    interestPostingPeriodType: 4, // Monthly
    interestCalculationType: 1, // Daily balance
    interestCalculationDaysInYearType: 365,
    accountingRule: 1, // None (no accounting) - simpler for vouchers
    nominalAnnualInterestRate: 0, // 0% interest for vouchers
  },
  wallet: {
    name: 'Buffr Digital Wallet Product',
    shortName: 'Wall', // Max 4 chars
    description: 'Product for Buffr digital wallet (unified wallet for mobile app and USSD)',
    currencyCode: 'NAD',
    digitsAfterDecimal: 2,
    interestCompoundingPeriodType: 1, // Daily
    interestPostingPeriodType: 4, // Monthly
    interestCalculationType: 1, // Daily balance
    interestCalculationDaysInYearType: 365,
    accountingRule: 1, // None (no accounting) - simpler for wallets
    nominalAnnualInterestRate: 0, // 0% interest for wallets
  },
  trustAccount: {
    name: 'Trust Account Product',
    shortName: 'Trst', // Max 4 chars
    description: 'Product for trust account (holds funds for voucher redemptions)',
    currencyCode: 'NAD',
    digitsAfterDecimal: 2,
    interestCompoundingPeriodType: 1, // Daily
    interestPostingPeriodType: 4, // Monthly
    interestCalculationType: 1, // Daily balance
    interestCalculationDaysInYearType: 365,
    accountingRule: 1, // None (no accounting) - simpler for trust account
    nominalAnnualInterestRate: 0, // 0% interest for trust account
  },
};

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

/**
 * Validate Fineract environment before initialization
 */
async function validateEnvironment(): Promise<boolean> {
  logger.info('🔍 Validating Fineract environment...');
  
  const validation = await validateFineractEnvironment();
  logValidationResults(validation);
  
  if (!validation.valid) {
    logger.error('❌ Environment validation failed. Please fix errors before proceeding.');
    return false;
  }
  
  if (validation.warnings.length > 0) {
    logger.warn('⚠️  Environment validation has warnings. Review before production deployment.');
  }
  
  return true;
}

/**
 * Get or create default office
 */
async function getOrCreateDefaultOffice(): Promise<number> {
  logger.info('📁 Checking for default office...');
  
  try {
    // Use Fineract API to get offices
    const fineractUrl = process.env.FINERACT_WRITE_URL || process.env.FINERACT_API_URL || 'https://localhost:8443/fineract-provider/api/v1';
    const username = process.env.FINERACT_WRITE_USERNAME || process.env.FINERACT_USERNAME || 'mifos';
    const password = process.env.FINERACT_WRITE_PASSWORD || process.env.FINERACT_PASSWORD || 'password';
    const tenantId = process.env.FINERACT_TENANT_ID || 'default';
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    
    const response = await fetch(`${fineractUrl}/offices`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Fineract-Platform-TenantId': tenantId,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details');
      throw new Error(`Failed to fetch offices: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json() as { pageItems?: Array<{ id: number; name: string }> } | Array<{ id: number; name: string }>;
    
    const offices = Array.isArray(result) ? result : (result as any).pageItems || [];
    
    if (offices.length > 0) {
      const office = offices[0];
      logger.info(`✅ Found existing office: ${office.name} (ID: ${office.id})`);
      return office.id;
    }
    
    // Create default office if none exists
    logger.info('📁 Creating default office...');
    const createResponse = await fetch(`${fineractUrl}/offices`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Fineract-Platform-TenantId': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Buffr Head Office',
        openingDate: new Date().toISOString().split('T')[0],
        dateFormat: 'yyyy-MM-dd',
        locale: 'en',
      }),
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create office: ${createResponse.status} - ${errorText}`);
    }
    
    const createResult = await createResponse.json() as { resourceId: number };
    const officeId = createResult.resourceId;
    logger.info(`✅ Created default office (ID: ${officeId})`);
    return officeId;
  } catch (error: any) {
    logger.error('❌ Error getting/creating office:', error);
    logger.error('Error details:', error.message || error);
    if (error.cause) {
      logger.error('Error cause:', error.cause);
    }
    throw error;
  }
}

/**
 * Create savings product
 */
async function createSavingsProduct(
  productKey: string,
  productConfig: FineractProduct
): Promise<number | null> {
  logger.info(`📦 Creating ${productKey} product: ${productConfig.name}...`);
  
  try {
    const fineractUrl = process.env.FINERACT_WRITE_URL || process.env.FINERACT_API_URL || 'https://localhost:8443/fineract-provider/api/v1';
    const username = process.env.FINERACT_WRITE_USERNAME || process.env.FINERACT_USERNAME || 'mifos';
    const password = process.env.FINERACT_WRITE_PASSWORD || process.env.FINERACT_PASSWORD || 'password';
    const tenantId = process.env.FINERACT_TENANT_ID || 'default';
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    
    // Check if product already exists
    const existingResponse = await fetch(`${fineractUrl}/savingsproducts`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Fineract-Platform-TenantId': tenantId,
        'Content-Type': 'application/json',
      },
    });
    
    if (existingResponse.ok) {
      const existingData = await existingResponse.json() as { pageItems?: Array<{ id: number; name: string }> } | Array<{ id: number; name: string }>;
      const products = Array.isArray(existingData) ? existingData : (existingData as any).pageItems || [];
      const existing = products.find((p: any) => 
        p.name === productConfig.name || p.name.includes(productConfig.shortName)
      );
      if (existing) {
        logger.info(`✅ ${productKey} product already exists: ${existing.name} (ID: ${existing.id})`);
        return existing.id;
      }
    }
    
    // Create product
    const createResponse = await fetch(`${fineractUrl}/savingsproducts`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Fineract-Platform-TenantId': tenantId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: productConfig.name,
        shortName: productConfig.shortName,
        description: productConfig.description,
        currencyCode: productConfig.currencyCode,
        digitsAfterDecimal: productConfig.digitsAfterDecimal,
        interestCompoundingPeriodType: productConfig.interestCompoundingPeriodType,
        interestPostingPeriodType: productConfig.interestPostingPeriodType,
        interestCalculationType: productConfig.interestCalculationType,
        interestCalculationDaysInYearType: productConfig.interestCalculationDaysInYearType,
        accountingRule: productConfig.accountingRule,
        nominalAnnualInterestRate: productConfig.nominalAnnualInterestRate,
        locale: 'en',
        // Only include accounting accounts if accountingRule = 2 (Cash based)
        ...(productConfig.accountingRule === 2 && productConfig.savingsControlAccountId && {
          savingsControlAccountId: productConfig.savingsControlAccountId,
          savingsReferenceAccountId: productConfig.savingsReferenceAccountId,
          transfersInSuspenseAccountId: productConfig.transfersInSuspenseAccountId,
          interestOnSavingsAccountId: productConfig.interestOnSavingsAccountId,
          incomeFromFeeAccountId: productConfig.incomeFromFeeAccountId,
          incomeFromPenaltyAccountId: productConfig.incomeFromPenaltyAccountId,
          overdraftPortfolioControlId: productConfig.overdraftPortfolioControlId,
          incomeFromInterestId: productConfig.incomeFromInterestId,
          writeOffAccountId: productConfig.writeOffAccountId,
        }),
      }),
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      logger.warn(`⚠️  Failed to create ${productKey} product: ${createResponse.status} - ${errorText}`);
      return null;
    }
    
    const createResult = await createResponse.json() as { resourceId: number };
    const productId = createResult.resourceId;
    logger.info(`✅ Created ${productKey} product (ID: ${productId})`);
    return productId;
  } catch (error: any) {
    logger.error(`❌ Error creating ${productKey} product:`, error);
    return null;
  }
}

/**
 * Create trust account (savings account)
 */
async function createTrustAccount(productId: number, officeId: number): Promise<number | null> {
  logger.info('💰 Creating trust account...');
  
  try {
    // Check if trust account already exists
    // Note: We'll use a specific client ID for trust account (e.g., 0 or a special client)
    // For now, we'll create a client for the trust account
    
    // Create a special client for trust account (if not exists)
    const trustClientExternalId = 'buffr_trust_account';
    let trustClient = await fineractService.getClientByExternalId(trustClientExternalId);
    
    if (!trustClient) {
      logger.info('📋 Creating trust account client...');
      trustClient = await fineractService.createClient({
        firstname: 'Buffr',
        lastname: 'Trust Account',
        mobileNo: '+264000000000',
        externalId: trustClientExternalId,
      }, { requestId: 'init-trust-client' });
      logger.info(`✅ Created trust account client (ID: ${trustClient.id})`);
    } else {
      logger.info(`✅ Trust account client already exists (ID: ${trustClient.id})`);
    }
    
    // Check if trust account already exists
    const fineractUrl = process.env.FINERACT_WRITE_URL || process.env.FINERACT_API_URL || 'https://localhost:8443/fineract-provider/api/v1';
    const username = process.env.FINERACT_WRITE_USERNAME || process.env.FINERACT_USERNAME || 'mifos';
    const password = process.env.FINERACT_WRITE_PASSWORD || process.env.FINERACT_PASSWORD || 'password';
    const tenantId = process.env.FINERACT_TENANT_ID || 'default';
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    
    const accountsResponse = await fetch(`${fineractUrl}/clients/${trustClient.id}/accounts`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Fineract-Platform-TenantId': tenantId,
        'Content-Type': 'application/json',
      },
    });
    
    if (accountsResponse.ok) {
      const accountsData = await accountsResponse.json() as { savingsAccounts?: Array<{ id: number; accountNo: string }> } | Array<{ id: number; accountNo: string }>;
      const accounts = Array.isArray(accountsData) ? accountsData : (accountsData as any).savingsAccounts || [];
      if (accounts.length > 0) {
        const existingAccount = accounts[0];
        logger.info(`✅ Trust account already exists: ${existingAccount.accountNo} (ID: ${existingAccount.id})`);
        return existingAccount.id;
      }
    }
    
    // Create trust account
    const accountResult = await fineractService.createAccount(
      trustClient.id,
      'SAVINGS',
      {
        productId,
        externalId: trustClientExternalId,
        requestId: 'init-trust-account',
      }
    );
    
    logger.info(`✅ Created trust account (ID: ${accountResult.id}, Account No: ${accountResult.accountNo})`);
    return accountResult.id;
  } catch (error: any) {
    logger.error('❌ Error creating trust account:', error);
    return null;
  }
}

/**
 * Main initialization function
 */
async function initializeFineract(): Promise<void> {
  logger.info('🚀 Starting Fineract initialization...');
  logger.info('========================================');
  
  try {
    // Step 1: Validate environment
    const envValid = await validateEnvironment();
    if (!envValid) {
      throw new Error('Environment validation failed');
    }
    
    // Step 2: Get or create default office
    const officeId = await getOrCreateDefaultOffice();
    logger.info(`✅ Office ID: ${officeId}`);
    
    // Step 3: Create products
    const productIds: Record<string, number | null> = {};
    
    for (const [key, config] of Object.entries(DEFAULT_PRODUCTS)) {
      const productId = await createSavingsProduct(key, config);
      productIds[key] = productId;
    }
    
    // Step 4: Create trust account (using trustAccount product)
    if (productIds.trustAccount) {
      await createTrustAccount(productIds.trustAccount, officeId);
    }
    
    // Summary
    logger.info('');
    logger.info('========================================');
    logger.info('✅ Fineract initialization complete!');
    logger.info('========================================');
    logger.info('');
    logger.info('Summary:');
    logger.info(`  📁 Office ID: ${officeId}`);
    logger.info(`  📦 Voucher Product ID: ${productIds.voucher || 'Not created'}`);
    logger.info(`  📦 Wallet Product ID: ${productIds.wallet || 'Not created'}`);
    logger.info(`  📦 Trust Account Product ID: ${productIds.trustAccount || 'Not created'}`);
    logger.info('');
    logger.info('Next Steps:');
    logger.info('  1. Update environment variables with product IDs if needed');
    logger.info('  2. Test voucher creation via API');
    logger.info('  3. Test wallet creation via API');
    logger.info('  4. Verify trust account balance');
    logger.info('');
    
  } catch (error: any) {
    logger.error('❌ Fineract initialization failed:', error);
    throw error;
  }
}

// ============================================================================
// RUN INITIALIZATION
// ============================================================================

if (require.main === module) {
  initializeFineract()
    .then(() => {
      logger.info('✅ Initialization script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Initialization script failed:', error);
      process.exit(1);
    });
}

export { initializeFineract, DEFAULT_PRODUCTS };

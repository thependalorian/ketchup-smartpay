/**
 * Adumo Online Enterprise API Service
 * 
 * Location: services/adumoService.ts
 * Purpose: Integration with Adumo Online payment gateway
 * 
 * Features:
 * - OAuth 2.0 authentication
 * - Payment initiation (4 options)
 * - 3D Secure integration
 * - Authorise, Settle, Reverse, Refund
 * - Card tokenization support
 * 
 * Based on Adumo Online Enterprise Integration API documentation
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { log } from '@/utils/logger';

// API Configuration
const ADUMO_CONFIG = {
  test: {
    baseUrl: 'https://staging-apiv3.adumoonline.com',
    oauthUrl: 'https://staging-apiv3.adumoonline.com/oauth/token',
  },
  production: {
    baseUrl: 'https://apiv3.adumoonline.com',
    oauthUrl: 'https://apiv3.adumoonline.com/oauth/token',
  },
};

// Get environment (should be from env vars in production)

const isProduction = Constants.expoConfig?.extra?.adumoEnvironment === 'production' || 
                     process.env.NODE_ENV === 'production';
const config = isProduction ? ADUMO_CONFIG.production : ADUMO_CONFIG.test;

// Get credentials from environment variables or use test defaults
const MERCHANT_UID = Constants.expoConfig?.extra?.adumoMerchantUid || 
                     process.env.EXPO_PUBLIC_ADUMO_MERCHANT_UID ||
                     '9BA5008C-08EE-4286-A349-54AF91A621B0';
const APPLICATION_UID = Constants.expoConfig?.extra?.adumoApplicationUid ||
                        process.env.EXPO_PUBLIC_ADUMO_APPLICATION_UID ||
                        '23ADADC0-DA2D-4DAC-A128-4845A5D71293';
const CLIENT_ID = Constants.expoConfig?.extra?.adumoClientId ||
                  process.env.EXPO_PUBLIC_ADUMO_CLIENT_ID ||
                  '9BA5008C-08EE-4286-A349-54AF91A621B0';
const CLIENT_SECRET = Constants.expoConfig?.extra?.adumoClientSecret ||
                      process.env.EXPO_PUBLIC_ADUMO_CLIENT_SECRET ||
                      '23adadc0-da2d-4dac-a128-4845a5d71293';

// OAuth Token Management
interface OAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  jti: string;
  expires_at: number; // Timestamp when token expires
}

let cachedToken: OAuthToken | null = null;

/**
 * Get OAuth 2.0 bearer token
 * Tokens are cached and refreshed automatically
 */
export async function getAccessToken(): Promise<string> {
  // Check if cached token is still valid (with 60 second buffer)
  if (cachedToken && Date.now() < cachedToken.expires_at - 60000) {
    return cachedToken.access_token;
  }

  try {
    const response = await fetch(
      `${config.oauthUrl}?grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OAuth token request failed: ${response.status}`);
    }

    const tokenData: OAuthToken = await response.json();
    
    // Calculate expiration timestamp
    tokenData.expires_at = Date.now() + (tokenData.expires_in * 1000);
    
    cachedToken = tokenData;
    return tokenData.access_token;
  } catch (error) {
    log.error('Failed to get OAuth token:', error);
    throw error;
  }
}

/**
 * Make authenticated API request to Adumo
 */
async function adumoRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<T> {
  const token = await getAccessToken();
  const url = `${config.baseUrl}${endpoint}`;

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body && method === 'POST') {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || errorData.statusMessage || `API request failed: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    log.error(`Adumo API error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================================================
// Payment Initiation Types
// ============================================================================

export interface InitiatePaymentRequest {
  merchantUid: string;
  applicationUid: string;
  value: number;
  merchantReference: string;
  ipAddress: string;
  userAgent: string;
  budgetPeriod?: number;
  cvv?: string;
  cardHolderFullName?: string;
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  saveCardDetails?: boolean;
  profileUid?: string;
  token?: string;
  uci?: string;
}

export interface InitiatePaymentResponse {
  transactionId: string;
  threeDSecureAuthRequired: boolean;
  threeDSecureProvider?: string;
  acsUrl?: string;
  acsPayload?: string;
  acsMD?: string;
  profileUid?: string;
}

/**
 * Initiate payment transaction
 * Supports 4 options:
 * 1. Without saving card
 * 2. With saving card (creates new profile)
 * 3. With saving card to existing profile
 * 4. With saved card token
 */
export async function initiatePayment(
  request: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> {
  const payload = {
    merchantUid: request.merchantUid || MERCHANT_UID,
    applicationUid: request.applicationUid || APPLICATION_UID,
    value: request.value,
    merchantReference: request.merchantReference,
    ipAddress: request.ipAddress,
    userAgent: request.userAgent,
    ...(request.budgetPeriod !== undefined && { budgetPeriod: request.budgetPeriod }),
    ...(request.cvv && { cvv: request.cvv }),
    ...(request.cardHolderFullName && { cardHolderFullName: request.cardHolderFullName }),
    ...(request.cardNumber && { cardNumber: request.cardNumber }),
    ...(request.expiryMonth && { expiryMonth: request.expiryMonth }),
    ...(request.expiryYear && { expiryYear: request.expiryYear }),
    ...(request.saveCardDetails !== undefined && { saveCardDetails: request.saveCardDetails }),
    ...(request.profileUid && { profileUid: request.profileUid }),
    ...(request.token && { token: request.token }),
    ...(request.uci && { uci: request.uci }),
  };

  return adumoRequest<InitiatePaymentResponse>(
    '/products/payments/v1/card/initiate',
    'POST',
    payload
  );
}

// ============================================================================
// 3D Secure
// ============================================================================

export interface AuthenticateResponse {
  transactionId: string;
  authorizationAllow: string;
  statusCode: string;
  mdStatus: string;
  statusMessage: string;
  eciFlag: string;
  enrolledStatus: string;
  paresStatus: string;
  paresVerified: string;
  syntaxVerified: string;
  dsId: string;
  acsId: string;
  acsReference: string;
  cavv: string;
  cavvAlgorithm: string | null;
  tdsProtocol: string;
  tdsApiVersion: string;
  cardType: string;
  authenticationTime: string;
  authenticationType: string;
  xid: string;
}

/**
 * Authenticate 3D Secure transaction
 * Call this after receiving response from Bankserv on TermUrl
 */
export async function authenticate3DSecure(
  transactionId: string
): Promise<AuthenticateResponse> {
  return adumoRequest<AuthenticateResponse>(
    `/product/authentication/v2/tds/authenticate/${transactionId}`,
    'GET'
  );
}

/**
 * Prepare 3D Secure form data for POST to Bankserv
 */
export interface ThreeDSecureFormData {
  acsUrl: string;
  paReq: string; // acsPayload from initiate response
  termUrl: string; // Your callback URL
  md: string; // acsMD from initiate response
}

export function prepare3DSecureForm(
  initiateResponse: InitiatePaymentResponse,
  termUrl: string
): ThreeDSecureFormData {
  if (!initiateResponse.threeDSecureAuthRequired) {
    throw new Error('3D Secure not required for this transaction');
  }

  return {
    acsUrl: initiateResponse.acsUrl!,
    paReq: initiateResponse.acsPayload!,
    termUrl,
    md: initiateResponse.acsMD!,
  };
}

// ============================================================================
// Authorise
// ============================================================================

export interface AuthoriseRequest {
  transactionId: string;
  amount?: number;
  cvv?: string;
}

export interface AuthoriseResponse {
  statusCode: number;
  statusMessage: string;
  autoSettle: boolean;
  authorisedAmount: number;
  cardCountry: string;
  currencyCode: string;
  eciFlag: string;
  authorisationCode: string;
  processorResponse: string;
}

/**
 * Authorise payment transaction
 */
export async function authorisePayment(
  request: AuthoriseRequest
): Promise<AuthoriseResponse> {
  const payload: any = {
    transactionId: request.transactionId,
  };

  if (request.amount !== undefined) {
    payload.amount = request.amount;
  }

  if (request.cvv) {
    payload.cvv = request.cvv;
  }

  return adumoRequest<AuthoriseResponse>(
    '/products/payments/v1/card/authorise',
    'POST',
    payload
  );
}

// ============================================================================
// Reverse
// ============================================================================

export interface ReverseRequest {
  transactionId: string;
}

export interface ReverseResponse {
  statusCode: number;
  statusMessage: string;
  autoSettle: boolean;
  authorisedAmount: number;
  cardCountry: string;
  currencyCode: string;
  eciFlag: string;
  authorisationCode: string;
  processorResponse: string;
}

/**
 * Reverse an authorised transaction
 */
export async function reversePayment(
  request: ReverseRequest
): Promise<ReverseResponse> {
  return adumoRequest<ReverseResponse>(
    '/products/payments/v1/card/reverse',
    'POST',
    { transactionId: request.transactionId }
  );
}

// ============================================================================
// Settle
// ============================================================================

export interface SettleRequest {
  transactionId: string;
  amount: number;
}

export interface SettleResponse {
  statusCode: number;
  statusMessage: string;
  autoSettle: boolean;
  authorisedAmount: number;
  cardCountry: string;
  currencyCode: string;
  eciFlag: string;
  authorisationCode: string;
  processorResponse: string;
}

/**
 * Settle an authorised transaction
 */
export async function settlePayment(
  request: SettleRequest
): Promise<SettleResponse> {
  return adumoRequest<SettleResponse>(
    '/products/payments/v1/card/settle',
    'POST',
    {
      transactionId: request.transactionId,
      amount: request.amount,
    }
  );
}

// ============================================================================
// Refund
// ============================================================================

export interface RefundRequest {
  transactionId: string;
  amount: number;
}

export interface RefundResponse {
  statusCode: number;
  statusMessage: string;
  autoSettle: boolean;
  authorisedAmount: number;
  cardCountry: string;
  currencyCode: string;
  eciFlag: string;
  authorisationCode: string;
  processorResponse: string;
}

/**
 * Refund a settled transaction
 */
export async function refundPayment(
  request: RefundRequest
): Promise<RefundResponse> {
  return adumoRequest<RefundResponse>(
    '/products/payments/v1/card/refund',
    'POST',
    {
      transactionId: request.transactionId,
      amount: request.amount,
    }
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's IP address (for payment initiation)
 * In production, this should get the actual user IP from request headers
 */
export function getUserIPAddress(req?: any): string {
  // Try to get IP from request headers (server-side)
  if (req?.headers) {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
      return realIp;
    }
    const cfConnecting = req.headers.get('cf-connecting-ip');
    if (cfConnecting) {
      return cfConnecting;
    }
  }
  
  // Fallback: In React Native, IP is typically obtained server-side
  // This function should be called with the request object when available
  return '0.0.0.0';
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  // Construct user agent from platform and app info
  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const platform = Platform.OS;
  const platformVersion = Platform.Version;
  const deviceName = Constants.deviceName || 'Unknown Device';
  
  return `Buffr Mobile App/${appVersion} (${platform} ${platformVersion}; ${deviceName})`;
}

/**
 * Complete payment flow: Initiate → 3DS (if needed) → Authorise → Settle
 */
export interface CompletePaymentFlowRequest {
  amount: number;
  merchantReference: string;
  cardNumber?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  cardHolderFullName?: string;
  saveCardDetails?: boolean;
  profileUid?: string;
  token?: string;
  termUrl?: string; // Required if 3DS is needed
  ipAddress?: string; // Optional - use request IP if available
  userAgent?: string; // Optional - use request user agent if available
}

export interface CompletePaymentFlowResponse {
  success: boolean;
  transactionId: string;
  statusCode: number;
  statusMessage: string;
  requires3DSecure: boolean;
  threeDSecureFormData?: ThreeDSecureFormData;
  authorisationCode?: string;
  settled: boolean;
}

export async function completePaymentFlow(
  request: CompletePaymentFlowRequest
): Promise<CompletePaymentFlowResponse> {
  try {
    // Step 1: Initiate
    const initiateResponse = await initiatePayment({
      merchantUid: MERCHANT_UID,
      applicationUid: APPLICATION_UID,
      value: request.amount,
      merchantReference: request.merchantReference,
      ipAddress: request.ipAddress || getUserIPAddress(),
      userAgent: request.userAgent || getUserAgent(),
      cardNumber: request.cardNumber,
      expiryMonth: request.expiryMonth,
      expiryYear: request.expiryYear,
      cvv: request.cvv,
      cardHolderFullName: request.cardHolderFullName,
      saveCardDetails: request.saveCardDetails,
      profileUid: request.profileUid,
      token: request.token,
    });

    // Step 2: Check if 3DS is required
    if (initiateResponse.threeDSecureAuthRequired) {
      if (!request.termUrl) {
        throw new Error('TermUrl is required for 3D Secure transactions');
      }

      return {
        success: false,
        transactionId: initiateResponse.transactionId,
        statusCode: 0,
        statusMessage: '3D Secure authentication required',
        requires3DSecure: true,
        threeDSecureFormData: prepare3DSecureForm(initiateResponse, request.termUrl),
        settled: false,
      };
    }

    // Step 3: Authorise (3DS not required)
    const authoriseResponse = await authorisePayment({
      transactionId: initiateResponse.transactionId,
      amount: request.amount,
      cvv: request.cvv,
    });

    if (authoriseResponse.statusCode !== 200) {
      return {
        success: false,
        transactionId: initiateResponse.transactionId,
        statusCode: authoriseResponse.statusCode,
        statusMessage: authoriseResponse.statusMessage,
        requires3DSecure: false,
        settled: false,
      };
    }

    // Step 4: Settle (if not auto-settled)
    let settled = authoriseResponse.autoSettle;
    if (!settled) {
      const settleResponse = await settlePayment({
        transactionId: initiateResponse.transactionId,
        amount: request.amount,
      });
      settled = settleResponse.statusCode === 200;
    }

    return {
      success: true,
      transactionId: initiateResponse.transactionId,
      statusCode: authoriseResponse.statusCode,
      statusMessage: authoriseResponse.statusMessage,
      requires3DSecure: false,
      authorisationCode: authoriseResponse.authorisationCode,
      settled,
    };
  } catch (error) {
    log.error('Payment flow error:', error);
    throw error;
  }
}

/**
 * Complete 3D Secure flow after authentication
 */
export async function complete3DSecureFlow(
  transactionId: string,
  amount: number,
  cvv?: string
): Promise<CompletePaymentFlowResponse> {
  try {
    // Step 1: Authenticate 3DS
    const authResponse = await authenticate3DSecure(transactionId);

    if (authResponse.authorizationAllow !== 'Y') {
      return {
        success: false,
        transactionId,
        statusCode: 0,
        statusMessage: '3D Secure authentication failed',
        requires3DSecure: true,
        settled: false,
      };
    }

    // Step 2: Authorise
    const authoriseResponse = await authorisePayment({
      transactionId,
      amount,
      cvv,
    });

    if (authoriseResponse.statusCode !== 200) {
      return {
        success: false,
        transactionId,
        statusCode: authoriseResponse.statusCode,
        statusMessage: authoriseResponse.statusMessage,
        requires3DSecure: true,
        settled: false,
      };
    }

    // Step 3: Settle (if not auto-settled)
    let settled = authoriseResponse.autoSettle;
    if (!settled) {
      const settleResponse = await settlePayment({
        transactionId,
        amount,
      });
      settled = settleResponse.statusCode === 200;
    }

    return {
      success: true,
      transactionId,
      statusCode: authoriseResponse.statusCode,
      statusMessage: authoriseResponse.statusMessage,
      requires3DSecure: true,
      authorisationCode: authoriseResponse.authorisationCode,
      settled,
    };
  } catch (error) {
    log.error('3D Secure flow error:', error);
    throw error;
  }
}

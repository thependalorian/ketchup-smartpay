/**
 * @smartpay/types - Shared TypeScript Types
 * 
 * Central type definitions for Ketchup SmartPay
 */

// Core business types
export * from './compliance';
export * from './openBanking';

// Re-export common types
export interface Beneficiary {
  id: string;
  nationalId: string;
  name: string;
  phone: string;
  region: string;
  district?: string;
  village?: string;
  grantType: GrantType;
  amount: number;
  status: BeneficiaryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type BeneficiaryStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export type GrantType = 
  | 'BPSIG' // Basic Protected Social Income Grant
  | 'OVC' // Orphans and Vulnerable Children
  | 'Disability'
  | 'Veterans'
  | 'Elderly'
  | 'Other';

export interface Voucher {
  id: string;
  voucherCode: string;
  beneficiaryId: string;
  batchId: string;
  amount: number;
  status: VoucherStatus;
  distributionDate?: Date;
  redemptionDate?: Date;
  agentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VoucherStatus = 
  | 'pending' 
  | 'distributed' 
  | 'redeemed' 
  | 'expired' 
  | 'cancelled'
  | 'failed';

export interface Agent {
  id: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  location: {
    region: string;
    district: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  status: AgentStatus;
  liquidityBalance: number;
  performanceMetrics: {
    totalTransactions: number;
    successRate: number;
    averageProcessingTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type AgentStatus = 'active' | 'inactive' | 'suspended' | 'under_review';

export interface Transaction {
  id: string;
  type: TransactionType;
  voucherId?: string;
  beneficiaryId?: string;
  agentId?: string;
  amount: number;
  status: TransactionStatus;
  reference: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type TransactionType = 
  | 'voucher_distribution' 
  | 'voucher_redemption' 
  | 'agent_funding'
  | 'agent_withdrawal'
  | 'p2p_transfer';

export type TransactionStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface Batch {
  id: string;
  name: string;
  region: string;
  grantType: GrantType;
  totalBeneficiaries: number;
  totalAmount: number;
  status: BatchStatus;
  createdBy: string;
  createdAt: Date;
  distributionDate?: Date;
  completedAt?: Date;
}

export type BatchStatus = 
  | 'draft' 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export interface DashboardMetrics {
  totalBeneficiaries: number;
  activeBeneficiaries: number;
  totalVouchers: number;
  distributedVouchers: number;
  redeemedVouchers: number;
  totalAmount: number;
  activeAgents: number;
  regionsServed: number;
}

export interface Region {
  code: string;
  name: string;
  totalBeneficiaries: number;
  totalAgents: number;
  totalDistributed: number;
  distributionRate: number;
}

export interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  payload: Record<string, any>;
  status: 'received' | 'processed' | 'failed';
  timestamp: Date;
  processedAt?: Date;
  error?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  region?: string;
  grantType?: GrantType;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * API client types – re-exports from @smartpay/types plus DTOs/filters used by ketchup APIs.
 * Location: packages/api-client/src/types.ts
 */

export type {
  Beneficiary,
  BeneficiaryStatus,
  GrantType,
  Voucher,
  VoucherStatus,
  Agent,
  AgentStatus,
  ApiResponse,
  DashboardMetrics,
} from '@smartpay/types';

/** Alias for api-client consumers that use APIResponse (e.g. webhookAPI, reconciliationAPI) */
export type { ApiResponse as APIResponse } from '@smartpay/types';

export interface CreateBeneficiaryDTO {
  name: string;
  phone: string;
  /** National ID number (e.g. Namibian 11-digit ID). */
  idNumber?: string;
  region: string;
  grantType: string;
  status?: 'active' | 'suspended' | 'pending';
  /** Proxy collector (authorised to collect on behalf; account stays with beneficiary). */
  proxyName?: string;
  proxyIdNumber?: string;
  proxyPhone?: string;
  proxyRelationship?: 'family' | 'caregiver' | 'guardian';
}

export interface UpdateBeneficiaryDTO {
  name?: string;
  phone?: string;
  idNumber?: string;
  region?: string;
  grantType?: string;
  status?: 'active' | 'suspended' | 'pending' | 'deceased';
  /** ISO date when beneficiary was marked deceased (required when status is deceased). */
  deceasedAt?: string;
  proxyName?: string;
  proxyIdNumber?: string;
  proxyPhone?: string;
  proxyRelationship?: 'family' | 'caregiver' | 'guardian';
}

/** Dependant relationship to beneficiary. */
export type DependantRelationship = 'child' | 'spouse' | 'guardian' | 'other';

export interface Dependant {
  id: string;
  beneficiaryId: string;
  name: string;
  idNumber?: string;
  phone?: string;
  relationship: DependantRelationship;
  dateOfBirth?: string;
  isProxy: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDependantDTO {
  name: string;
  idNumber?: string;
  phone?: string;
  relationship: DependantRelationship;
  dateOfBirth?: string;
  isProxy?: boolean;
}

export interface UpdateDependantDTO {
  name?: string;
  idNumber?: string;
  phone?: string;
  relationship?: DependantRelationship;
  dateOfBirth?: string;
  isProxy?: boolean;
}

export interface BeneficiaryFilters {
  region?: string;
  grantType?: string;
  status?: string;
  search?: string;
}

export interface IssueVoucherDTO {
  beneficiaryId: string;
  amount: number;
  grantType: string;
  expiryDays?: number;
  /** Optional. ISO date/datetime for scheduled issuance; must not be in the past. */
  scheduledIssueAt?: string;
  /** Optional. Buffr wallet/user UUID – when distributing to Buffr, voucher is credited to this account. */
  buffrUserId?: string;
}

export interface IssueBatchDTO {
  vouchers: IssueVoucherDTO[];
  batchId?: string;
}

export interface VoucherFilters {
  beneficiaryId?: string;
  region?: string;
  grantType?: string;
  status?: string;
  search?: string;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Extended Entity Types for SmartPay Connect
 * 
 * Location: shared/types/entities.ts
 * Purpose: Additional TypeScript types for entities not covered in index.ts
 */

// ============================================================================
// RECONCILIATION TYPES
// ============================================================================

export interface ReconciliationRecord {
  voucherId: string;
  ketchupStatus: string;
  buffrStatus: string;
  match: boolean;
  discrepancy?: string;
  lastVerified: string;
}

export interface ReconciliationReport {
  date: string;
  totalVouchers: number;
  matched: number;
  discrepancies: number;
  matchRate: number;
  records: ReconciliationRecord[];
}

export interface ReconciliationFilters {
  date?: string;
  match?: boolean;
  voucherId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export type WebhookEventType = 
  | 'voucher.redeemed' 
  | 'voucher.expired' 
  | 'voucher.delivered' 
  | 'voucher.cancelled' 
  | 'voucher.failed_delivery';

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  voucherId: string;
  status: WebhookDeliveryStatus;
  deliveryAttempts: number;
  lastAttemptAt: string;
  deliveredAt?: string;
  errorMessage?: string;
  signatureValid: boolean;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface WebhookFilters {
  status?: WebhookDeliveryStatus;
  eventType?: WebhookEventType;
  voucherId?: string;
  limit?: number;
  offset?: number;
}

export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: {
    voucherId: string;
    beneficiaryId?: string;
    amount?: number;
    status?: string;
    metadata?: Record<string, unknown>;
  };
}

// ============================================================================
// STATUS TYPES
// ============================================================================

export type StatusTrigger = 'system' | 'webhook' | 'manual';

export interface StatusHistoryEvent {
  id: string;
  voucherId: string;
  fromStatus: string | null;
  toStatus: string;
  triggeredBy: StatusTrigger;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface StatusFilters {
  voucherId?: string;
  fromDate?: string;
  toDate?: string;
  triggeredBy?: StatusTrigger;
  limit?: number;
  offset?: number;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export type UserRole = 'admin' | 'government' | 'agent' | 'beneficiary';

export interface JWTPayload {
  userId: string;
  role: UserRole;
  permissions: string[];
  exp?: number;
  iat?: number;
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  permissions: string[];
  lastLogin?: string;
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export type ReportType = 
  | 'voucher_summary' 
  | 'redemption_analysis' 
  | 'regional_distribution' 
  | 'agent_performance'
  | 'compliance_audit';

export interface ReportRequest {
  type: ReportType;
  startDate: string;
  endDate: string;
  region?: string;
  format?: 'json' | 'csv' | 'pdf';
}

export interface ReportMetadata {
  id: string;
  type: ReportType;
  generatedAt: string;
  generatedBy: string;
  dateRange: {
    start: string;
    end: string;
  };
  parameters: Record<string, unknown>;
}

export interface VoucherSummaryReport {
  totalIssued: number;
  totalRedeemed: number;
  totalExpired: number;
  totalCancelled: number;
  totalValue: number;
  redemptionRate: number;
  byRegion: Array<{
    region: string;
    issued: number;
    redeemed: number;
    value: number;
  }>;
}

export interface AgentPerformanceReport {
  agentId: string;
  agentName: string;
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  averageTransactionValue: number;
  region: string;
}

// ============================================================================
// MAP TYPES
// ============================================================================

export interface MapMarker {
  id: string;
  name: string;
  type: 'agent' | 'beneficiary' | 'voucher';
  latitude: number;
  longitude: number;
  status?: string;
  metadata?: Record<string, unknown>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapFilters {
  region?: string;
  type?: string;
  status?: string;
  bounds?: MapBounds;
}

// ============================================================================
// BATCH TYPES
// ============================================================================

export interface BatchJob {
  id: string;
  type: 'voucher_issuance' | 'report_generation' | 'reconciliation' | 'data_export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  startedAt: string;
  completedAt?: string;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface BatchProgress {
  jobId: string;
  status: BatchJob['status'];
  progress: number;
  processedItems: number;
  totalItems: number;
  failedItems: number;
  estimatedTimeRemaining?: number;
}

// ============================================================================
// AUDIT TYPES
// ============================================================================

export type AuditAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout'
  | 'export'
  | 'permission_change';

export interface AuditLog {
  id: string;
  userId: string;
  userRole: UserRole;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

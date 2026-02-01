/**
 * Buffr AI TypeScript Types
 * 
 * Core type definitions for the multi-agent system
 */

import { z } from 'zod';

// ==================== Enums ====================

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum SearchType {
  VECTOR = 'vector',
  HYBRID = 'hybrid',
  GRAPH = 'graph',
}

export enum AgentType {
  GUARDIAN = 'guardian',
  TRANSACTION_ANALYST = 'transaction_analyst',
  SCOUT = 'scout',
  MENTOR = 'mentor',
  CRAFTER = 'crafter',
  COMPANION = 'companion',
  RAG = 'rag',
}

// ==================== Zod Schemas ====================

// Chat Request Schema
export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
  searchType: z.nativeEnum(SearchType).optional().default(SearchType.HYBRID),
});

// Search Request Schema
export const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  searchType: z.nativeEnum(SearchType).optional().default(SearchType.HYBRID),
  limit: z.number().min(1).max(50).optional().default(10),
  filters: z.record(z.any()).optional().default({}),
});

// Document Metadata Schema
export const DocumentMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  metadata: z.record(z.any()).optional().default({}),
  createdAt: z.string().or(z.date()),
  updatedAt: z.string().or(z.date()),
  chunkCount: z.number().optional(),
});

// Chunk Result Schema
export const ChunkResultSchema = z.object({
  chunkId: z.string(),
  documentId: z.string(),
  content: z.string(),
  score: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional().default({}),
  documentTitle: z.string(),
  documentSource: z.string(),
});

// Graph Search Result Schema
export const GraphSearchResultSchema = z.object({
  fact: z.string(),
  uuid: z.string(),
  validAt: z.string().optional(),
  invalidAt: z.string().optional(),
  sourceNodeUuid: z.string().optional(),
});

// Entity Relationship Schema
export const EntityRelationshipSchema = z.object({
  fromEntity: z.string(),
  toEntity: z.string(),
  relationshipType: z.string(),
  metadata: z.record(z.any()).optional().default({}),
});

// Tool Call Schema
export const ToolCallSchema = z.object({
  toolName: z.string(),
  args: z.record(z.any()).optional().default({}),
  toolCallId: z.string().optional(),
});

// Chat Response Schema
export const ChatResponseSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
  sources: z.array(DocumentMetadataSchema).optional().default([]),
  toolsUsed: z.array(ToolCallSchema).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
});

// Search Response Schema
export const SearchResponseSchema = z.object({
  results: z.array(ChunkResultSchema).optional().default([]),
  graphResults: z.array(GraphSearchResultSchema).optional().default([]),
  totalResults: z.number(),
  searchType: z.nativeEnum(SearchType),
  queryTimeMs: z.number(),
});

// ==================== Inferred Types ====================

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type SearchRequest = z.infer<typeof SearchRequestSchema>;
export type DocumentMetadata = z.infer<typeof DocumentMetadataSchema>;
export type ChunkResult = z.infer<typeof ChunkResultSchema>;
export type GraphSearchResult = z.infer<typeof GraphSearchResultSchema>;
export type EntityRelationship = z.infer<typeof EntityRelationshipSchema>;
export type ToolCall = z.infer<typeof ToolCallSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;

// ==================== Agent Dependencies ====================

export interface AgentDependencies {
  sessionId: string;
  userId?: string;
  searchPreferences?: {
    useVector: boolean;
    useGraph: boolean;
    defaultLimit: number;
  };
}

export interface GuardianDependencies extends AgentDependencies {
  fraudModel?: FraudDetectionModel;
  creditModel?: CreditScoringModel;
}

export interface CompanionDependencies extends AgentDependencies {
  conversationHistory?: Message[];
}

// ==================== Message Types ====================

export interface Message {
  id?: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface Session {
  id: string;
  userId?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  expiresAt?: Date;
}

// ==================== Document Types ====================

export interface Document {
  id?: string;
  title: string;
  source: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Chunk {
  id?: string;
  documentId: string;
  content: string;
  embedding?: number[];
  chunkIndex: number;
  metadata?: Record<string, any>;
  tokenCount?: number;
  createdAt?: Date;
}

// ==================== ML Model Types ====================

export interface FraudFeatures {
  // Transaction features
  amountNormalized: number;
  amountLog: number;
  amountDeviationFromAvg: number;

  // Time features
  hourSin: number;
  hourCos: number;
  dayOfWeek: number;
  isWeekend: number;
  isUnusualHour: number;

  // Merchant features
  merchantCategoryEncoded: number;
  merchantFraudRate: number;

  // Location features
  distanceFromHomeKm: number;
  isForeignTransaction: number;

  // User behavior
  transactionsLastHour: number;
  transactionsLastDay: number;
  velocityScore: number;

  // Device & verification
  deviceFingerprintMatch: number;
  cardNotPresent: number;

  // Additional
  roundNumberFlag: number;
  beneficiaryAccountAgeDays: number;
  userKycLevel: number;
}

export interface FraudPrediction {
  fraudProbability: number;
  isFraud: boolean;
  confidence: number;
  modelScores?: {
    logisticRegression: number;
    neuralNetwork: number;
    randomForest: number;
    gmmAnomaly: number;
  };
  explanation?: string;
}

export interface CreditFeatures {
  // Income & employment
  monthlyIncome: number;
  employmentYears: number;
  employmentType: string;

  // Financial history
  accountAge: number;
  averageBalance: number;
  savingsRate: number;

  // Transaction patterns
  monthlyTransactions: number;
  regularPayments: number;
  latePayments: number;

  // Existing debt
  existingLoans: number;
  debtToIncomeRatio: number;

  // KYC
  kycLevel: number;
  isVerified: boolean;
}

export interface CreditScore {
  score: number; // 300-850
  rating: 'excellent' | 'good' | 'fair' | 'poor' | 'very_poor';
  maxLoanAmount: number;
  interestRate: number;
  factors: string[];
  recommendations: string[];
}

export interface FraudDetectionModel {
  predict(features: FraudFeatures): Promise<FraudPrediction>;
  explain(features: FraudFeatures, prediction: FraudPrediction): string;
}

export interface CreditScoringModel {
  score(features: CreditFeatures): Promise<CreditScore>;
}

// ==================== Agent Response Types ====================

export interface GuardianResponse {
  type: 'fraud_check' | 'credit_assessment' | 'investigation';
  result: FraudPrediction | CreditScore | InvestigationResult;
  reasoning: string;
  recommendations: string[];
  metadata?: Record<string, any>;
}

export interface InvestigationResult {
  alertId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  findings: string[];
  riskScore: number;
  recommendations: string[];
  consistencyScore?: number;
  fatigueStatus?: {
    fatigueLevel: number;
    investigationCount: number;
    isFatigued: boolean;
  };
}

export interface TransactionAnalystResponse {
  type: 'classification' | 'analysis' | 'budget';
  insights: string[];
  categories: TransactionCategory[];
  spendingPatterns?: SpendingPattern[];
  budgetRecommendations?: BudgetRecommendation[];
}

export interface TransactionCategory {
  name: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SpendingPattern {
  pattern: string;
  frequency: string;
  averageAmount: number;
  insight: string;
}

export interface BudgetRecommendation {
  category: string;
  currentSpend: number;
  recommendedBudget: number;
  savingsPotential: number;
  tips: string[];
}

export interface ScoutResponse {
  type: 'search' | 'exchange_rates' | 'forecast' | 'pricing' | 'regulatory' | 'opportunities';
  data: any;
  insights: string[];
  sources: string[];
  timestamp: Date;
}

export interface MentorResponse {
  type: 'assessment' | 'learning_path' | 'concept' | 'goal' | 'tips';
  content: string;
  resources?: LearningResource[];
  progressUpdate?: ProgressUpdate;
}

export interface LearningResource {
  title: string;
  type: 'article' | 'video' | 'quiz' | 'exercise';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url?: string;
}

export interface ProgressUpdate {
  currentLevel: number;
  totalLevels: number;
  completedTopics: string[];
  nextTopics: string[];
  achievements: string[];
}

export interface CrafterResponse {
  type: 'scheduled_payment' | 'spending_alert' | 'auto_savings' | 'workflow';
  workflowId?: string;
  status: 'created' | 'updated' | 'executed' | 'error';
  details: any;
  nextExecution?: Date;
}

export interface CompanionResponse {
  message: string;
  agentUsed: AgentType;
  agentResponse: GuardianResponse | TransactionAnalystResponse | ScoutResponse | MentorResponse | CrafterResponse;
  followUpSuggestions?: string[];
  confidence: number;
}

// ==================== Health Check Types ====================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: boolean;
    graphDatabase: boolean;
    llmConnection: boolean;
    mlModels: boolean;
  };
  agents: Record<AgentType, boolean>;
  version: string;
  timestamp: Date;
}

// ==================== Error Types ====================

export interface ErrorResponse {
  error: string;
  errorType: string;
  details?: Record<string, any>;
  requestId?: string;
}

// ==================== Ingestion Types ====================

export interface IngestionConfig {
  chunkSize: number;
  chunkOverlap: number;
  maxChunkSize: number;
  useSemanticChunking: boolean;
  extractEntities: boolean;
  skipGraphBuilding: boolean;
}

export interface IngestionResult {
  documentId: string;
  title: string;
  chunksCreated: number;
  entitiesExtracted: number;
  relationshipsCreated: number;
  processingTimeMs: number;
  errors: string[];
}

/**
 * Crafter Agent - Workflow Automation
 * 
 * Scheduled payments, spending alerts, and automated savings
 */

import { CrafterResponse } from '../../types/index.js';
import { chatCompletion } from '../../utils/providers.js';
import {
  CRAFTER_SYSTEM_PROMPT,
  SCHEDULED_PAYMENT_PROMPT,
  SPENDING_ALERT_PROMPT,
  AUTO_SAVINGS_PROMPT,
  CUSTOM_WORKFLOW_PROMPT,
} from './prompts.js';
import { v4 as uuidv4 } from 'uuid';

// ==================== Workflow Types ====================

export interface ScheduledPayment {
  id: string;
  userId: string;
  recipient: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'once';
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: Date;
  endDate?: Date;
  sourceAccount: string;
  purpose?: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  nextExecution: Date;
  lastExecution?: Date;
  executionCount: number;
  createdAt: Date;
}

export interface SpendingAlert {
  id: string;
  userId: string;
  category?: string;
  merchant?: string;
  threshold: number;
  period: 'daily' | 'weekly' | 'monthly';
  alertType: 'push' | 'sms' | 'email';
  currentSpend: number;
  status: 'active' | 'paused' | 'triggered';
  lastTriggered?: Date;
  createdAt: Date;
}

export interface SavingsRule {
  id: string;
  userId: string;
  type: 'percentage' | 'fixed' | 'roundup' | 'save_difference';
  amount: number; // Percentage or fixed amount
  trigger: 'on_income' | 'on_transaction' | 'daily' | 'weekly';
  targetAccount: string;
  goal?: string;
  totalSaved: number;
  status: 'active' | 'paused';
  createdAt: Date;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string;
  triggers: WorkflowTrigger[];
  actions: WorkflowAction[];
  conditions: WorkflowCondition[];
  status: 'active' | 'paused' | 'draft';
  executionCount: number;
  lastExecution?: Date;
  createdAt: Date;
}

export interface WorkflowTrigger {
  type: 'schedule' | 'transaction' | 'balance' | 'date' | 'manual';
  config: Record<string, any>;
}

export interface WorkflowAction {
  type: 'transfer' | 'notify' | 'save' | 'categorize' | 'alert';
  config: Record<string, any>;
}

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
}

// ==================== In-Memory Storage (would be database in production) ====================

const scheduledPayments: Map<string, ScheduledPayment> = new Map();
const spendingAlerts: Map<string, SpendingAlert> = new Map();
const savingsRules: Map<string, SavingsRule> = new Map();
const workflows: Map<string, Workflow> = new Map();

// ==================== Scheduled Payments ====================

/**
 * Create a scheduled payment
 */
export async function createScheduledPayment(
  userId: string,
  config: {
    recipient: string;
    amount: number;
    frequency: ScheduledPayment['frequency'];
    startDate?: Date;
    endDate?: Date;
    dayOfMonth?: number;
    dayOfWeek?: number;
    sourceAccount?: string;
    purpose?: string;
  }
): Promise<CrafterResponse> {
  const id = uuidv4();
  const startDate = config.startDate || new Date();
  
  // Calculate next execution
  const nextExecution = calculateNextExecution(
    startDate,
    config.frequency,
    config.dayOfMonth,
    config.dayOfWeek
  );
  
  const payment: ScheduledPayment = {
    id,
    userId,
    recipient: config.recipient,
    amount: config.amount,
    frequency: config.frequency,
    dayOfMonth: config.dayOfMonth,
    dayOfWeek: config.dayOfWeek,
    startDate,
    endDate: config.endDate,
    sourceAccount: config.sourceAccount || 'default',
    purpose: config.purpose,
    status: 'active',
    nextExecution,
    executionCount: 0,
    createdAt: new Date(),
  };
  
  scheduledPayments.set(id, payment);
  
  // Get AI confirmation
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: CRAFTER_SYSTEM_PROMPT },
    { role: 'user', content: SCHEDULED_PAYMENT_PROMPT(config) },
  ];
  
  const aiResponse = await chatCompletion(messages);
  
  return {
    type: 'scheduled_payment',
    workflowId: id,
    status: 'created',
    details: {
      payment,
      summary: `Scheduled NAD ${config.amount} to ${config.recipient} ${config.frequency}`,
      aiRecommendations: aiResponse,
    },
    nextExecution,
  };
}

/**
 * Calculate next execution date
 */
function calculateNextExecution(
  startDate: Date,
  frequency: ScheduledPayment['frequency'],
  dayOfMonth?: number,
  dayOfWeek?: number
): Date {
  const next = new Date(startDate);
  
  switch (frequency) {
    case 'daily':
      if (next <= new Date()) {
        next.setDate(next.getDate() + 1);
      }
      break;
    case 'weekly':
      if (dayOfWeek !== undefined) {
        const daysUntilNext = (dayOfWeek - next.getDay() + 7) % 7 || 7;
        next.setDate(next.getDate() + daysUntilNext);
      } else {
        next.setDate(next.getDate() + 7);
      }
      break;
    case 'monthly':
      if (dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
        if (next <= new Date()) {
          next.setMonth(next.getMonth() + 1);
        }
      } else {
        next.setMonth(next.getMonth() + 1);
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    case 'once':
      // Keep the start date
      break;
  }
  
  return next;
}

// ==================== Spending Alerts ====================

/**
 * Create a spending alert
 */
export async function createSpendingAlert(
  userId: string,
  config: {
    category?: string;
    merchant?: string;
    threshold: number;
    period: SpendingAlert['period'];
    alertType?: SpendingAlert['alertType'];
  }
): Promise<CrafterResponse> {
  const id = uuidv4();
  
  const alert: SpendingAlert = {
    id,
    userId,
    category: config.category,
    merchant: config.merchant,
    threshold: config.threshold,
    period: config.period,
    alertType: config.alertType || 'push',
    currentSpend: 0,
    status: 'active',
    createdAt: new Date(),
  };
  
  spendingAlerts.set(id, alert);
  
  // Get AI recommendations
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: CRAFTER_SYSTEM_PROMPT },
    { role: 'user', content: SPENDING_ALERT_PROMPT(config) },
  ];
  
  const aiResponse = await chatCompletion(messages);
  
  return {
    type: 'spending_alert',
    workflowId: id,
    status: 'created',
    details: {
      alert,
      summary: `Alert when ${config.category || 'total'} spending exceeds NAD ${config.threshold} ${config.period}`,
      aiRecommendations: aiResponse,
    },
  };
}

/**
 * Check if spending alert should trigger
 */
export function checkSpendingAlert(
  alertId: string,
  transactionAmount: number
): { triggered: boolean; message?: string } {
  const alert = spendingAlerts.get(alertId);
  if (!alert || alert.status !== 'active') {
    return { triggered: false };
  }
  
  alert.currentSpend += transactionAmount;
  
  if (alert.currentSpend >= alert.threshold) {
    alert.status = 'triggered';
    alert.lastTriggered = new Date();
    return {
      triggered: true,
      message: `⚠️ Spending alert: You've spent NAD ${alert.currentSpend.toFixed(2)} of your NAD ${alert.threshold} ${alert.period} limit for ${alert.category || 'total spending'}`,
    };
  }
  
  // Warning at 80%
  if (alert.currentSpend >= alert.threshold * 0.8) {
    return {
      triggered: false,
      message: `📊 Heads up: You've used ${Math.round((alert.currentSpend / alert.threshold) * 100)}% of your ${alert.category || 'spending'} budget`,
    };
  }
  
  return { triggered: false };
}

// ==================== Automated Savings ====================

/**
 * Create an automated savings rule
 */
export async function createSavingsAutomation(
  userId: string,
  config: {
    type: SavingsRule['type'];
    amount: number;
    trigger: SavingsRule['trigger'];
    targetAccount?: string;
    goal?: string;
  }
): Promise<CrafterResponse> {
  const id = uuidv4();
  
  const rule: SavingsRule = {
    id,
    userId,
    type: config.type,
    amount: config.amount,
    trigger: config.trigger,
    targetAccount: config.targetAccount || 'savings',
    goal: config.goal,
    totalSaved: 0,
    status: 'active',
    createdAt: new Date(),
  };
  
  savingsRules.set(id, rule);
  
  // Get AI recommendations
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: CRAFTER_SYSTEM_PROMPT },
    { role: 'user', content: AUTO_SAVINGS_PROMPT(config) },
  ];
  
  const aiResponse = await chatCompletion(messages);
  
  let summary = '';
  switch (config.type) {
    case 'percentage':
      summary = `Save ${config.amount}% of every income`;
      break;
    case 'fixed':
      summary = `Save NAD ${config.amount} on every income`;
      break;
    case 'roundup':
      summary = `Round up transactions and save the difference`;
      break;
    case 'save_difference':
      summary = `Save unused budget at end of period`;
      break;
  }
  
  return {
    type: 'auto_savings',
    workflowId: id,
    status: 'created',
    details: {
      rule,
      summary,
      aiRecommendations: aiResponse,
    },
  };
}

/**
 * Calculate savings amount for a transaction
 */
export function calculateSavingsAmount(
  ruleId: string,
  transactionAmount: number
): number {
  const rule = savingsRules.get(ruleId);
  if (!rule || rule.status !== 'active') {
    return 0;
  }
  
  switch (rule.type) {
    case 'percentage':
      return transactionAmount * (rule.amount / 100);
    case 'fixed':
      return rule.amount;
    case 'roundup':
      return Math.ceil(transactionAmount) - transactionAmount;
    case 'save_difference':
      // This would be calculated at end of period
      return 0;
    default:
      return 0;
  }
}

// ==================== Custom Workflows ====================

/**
 * Create a custom workflow
 */
export async function createWorkflow(
  userId: string,
  config: {
    name: string;
    description?: string;
    triggers: WorkflowTrigger[];
    actions: WorkflowAction[];
    conditions?: WorkflowCondition[];
  }
): Promise<CrafterResponse> {
  const id = uuidv4();
  
  const workflow: Workflow = {
    id,
    userId,
    name: config.name,
    description: config.description,
    triggers: config.triggers,
    actions: config.actions,
    conditions: config.conditions || [],
    status: 'draft',
    executionCount: 0,
    createdAt: new Date(),
  };
  
  workflows.set(id, workflow);
  
  // Get AI validation
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: CRAFTER_SYSTEM_PROMPT },
    { role: 'user', content: CUSTOM_WORKFLOW_PROMPT(config) },
  ];
  
  const aiResponse = await chatCompletion(messages);
  
  return {
    type: 'workflow',
    workflowId: id,
    status: 'created',
    details: {
      workflow,
      summary: `Workflow "${config.name}" created`,
      aiRecommendations: aiResponse,
    },
  };
}

/**
 * Activate a workflow
 */
export function activateWorkflow(workflowId: string): CrafterResponse {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    return {
      type: 'workflow',
      status: 'error',
      details: { error: 'Workflow not found' },
    };
  }
  
  workflow.status = 'active';
  
  return {
    type: 'workflow',
    workflowId,
    status: 'updated',
    details: {
      message: `Workflow "${workflow.name}" is now active`,
      status: workflow.status,
    },
  };
}

/**
 * Execute a workflow manually
 */
export async function executeWorkflow(
  workflowId: string,
  context: Record<string, any> = {}
): Promise<CrafterResponse> {
  const workflow = workflows.get(workflowId);
  if (!workflow) {
    return {
      type: 'workflow',
      status: 'error',
      details: { error: 'Workflow not found' },
    };
  }
  
  // Check conditions
  for (const condition of workflow.conditions) {
    if (!evaluateCondition(condition, context)) {
      return {
        type: 'workflow',
        workflowId,
        status: 'error',
        details: { error: 'Conditions not met', condition },
      };
    }
  }
  
  // Execute actions
  const results: any[] = [];
  for (const action of workflow.actions) {
    const result = await executeAction(action, context);
    results.push(result);
  }
  
  workflow.executionCount++;
  workflow.lastExecution = new Date();
  
  return {
    type: 'workflow',
    workflowId,
    status: 'executed',
    details: {
      message: `Workflow "${workflow.name}" executed successfully`,
      executionCount: workflow.executionCount,
      results,
    },
  };
}

/**
 * Evaluate a workflow condition
 */
function evaluateCondition(
  condition: WorkflowCondition,
  context: Record<string, any>
): boolean {
  const value = context[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'greater_than':
      return value > condition.value;
    case 'less_than':
      return value < condition.value;
    case 'contains':
      return String(value).includes(condition.value);
    case 'between':
      return value >= condition.value[0] && value <= condition.value[1];
    default:
      return false;
  }
}

/**
 * Execute a workflow action
 */
async function executeAction(
  action: WorkflowAction,
  context: Record<string, any>
): Promise<any> {
  switch (action.type) {
    case 'transfer':
      return { type: 'transfer', status: 'simulated', ...action.config };
    case 'notify':
      return { type: 'notify', status: 'sent', message: action.config.message };
    case 'save':
      return { type: 'save', status: 'completed', amount: action.config.amount };
    case 'alert':
      return { type: 'alert', status: 'triggered', ...action.config };
    default:
      return { type: action.type, status: 'unknown' };
  }
}

// ==================== Monitoring ====================

/**
 * Get all workflows for a user
 */
export function getUserWorkflows(userId: string): {
  scheduledPayments: ScheduledPayment[];
  spendingAlerts: SpendingAlert[];
  savingsRules: SavingsRule[];
  customWorkflows: Workflow[];
} {
  return {
    scheduledPayments: Array.from(scheduledPayments.values()).filter(p => p.userId === userId),
    spendingAlerts: Array.from(spendingAlerts.values()).filter(a => a.userId === userId),
    savingsRules: Array.from(savingsRules.values()).filter(r => r.userId === userId),
    customWorkflows: Array.from(workflows.values()).filter(w => w.userId === userId),
  };
}

/**
 * Chat with Crafter agent
 */
export async function crafterChat(message: string): Promise<string> {
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: CRAFTER_SYSTEM_PROMPT },
    { role: 'user', content: message },
  ];
  
  return chatCompletion(messages);
}

/**
 * Buffr AI - Main Entry Point
 * 
 * Multi-Agent AI Platform for Buffr Payment Companion
 * 
 * Services:
 * - Guardian Agent: Fraud detection & credit scoring
 * - Transaction Analyst: Spending analysis & budgeting
 * - Scout Agent: REMOVED (not needed for voucher platform)
 * - Mentor Agent: REMOVED (not needed for voucher platform)
 * - Crafter Agent: Workflow automation
 * - Companion Agent: Multi-agent orchestrator
 * - RAG Agent: Knowledge base retrieval
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { initializeDatabase, closeDatabase } from './utils/db.js';
import { runRagAgent, simpleChat } from './core/agent.js';
import { checkFraud, assessCredit, investigateAlert, guardianChat } from './agents/guardian/agent.js';
import { runCompanionAgent, multiAgentQuery } from './agents/companion/agent.js';
import { classifyTransactionWithAI, analyzeSpending, generateBudget, transactionAnalystChat } from './agents/transaction-analyst/agent.js';
// Scout and Mentor agents removed - not needed for voucher platform
import { createScheduledPayment, createSpendingAlert, createSavingsAutomation, createWorkflow, executeWorkflow, getUserWorkflows, crafterChat } from './agents/crafter/agent.js';
import { ChatRequestSchema, SearchRequestSchema } from './types/index.js';
import { startExchangeRateScheduler } from './services/exchangeRateScheduler.js';
import logger, { log } from '@/utils/logger';

// Load environment variables
config();

// Validate environment variables on startup
// This will throw an error if required variables are missing or security settings are invalid
import { validateEnvironment } from './utils/envValidation.js';
validateEnvironment();

const app = express();
const PORT = parseInt(process.env.PORT || '8000');
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8081',  // Expo development
    'http://localhost:19000', // Expo web
    'http://localhost:19006', // Expo web alternative
    'http://localhost:3000',  // Next.js
    '*',
  ],
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== Health & Info Routes ====================

app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Buffr AI',
    version: '1.0.0',
    status: 'operational',
    services: {
      companion_agent: {
        description: 'Multi-agent orchestration and intelligent routing',
        status: 'available',
        endpoints: ['/api/companion/chat', '/api/companion/chat/stream', '/api/companion/multi-agent'],
      },
      guardian_agent: {
        description: 'Fraud detection & credit scoring with AI reasoning',
        status: 'available',
        endpoints: ['/api/guardian/fraud/check', '/api/guardian/credit/assess', '/api/guardian/investigate', '/api/guardian/chat'],
      },
      transaction_analyst_agent: {
        description: 'Spending analysis & classification with insights',
        status: 'available',
        endpoints: ['/api/transaction-analyst/classify', '/api/transaction-analyst/analyze', '/api/transaction-analyst/budget', '/api/transaction-analyst/chat'],
      },
      // Scout and Mentor agents removed - not needed for voucher platform
      crafter_agent: {
        description: 'Workflow automation',
        status: 'available',
        endpoints: ['/api/crafter/scheduled-payment', '/api/crafter/spending-alert', '/api/crafter/automate-savings', '/api/crafter/workflow/create', '/api/crafter/workflow/execute', '/api/crafter/workflow/monitor/:userId', '/api/crafter/chat'],
      },
      rag_agent: {
        description: 'Retrieval Augmented Generation with knowledge base',
        status: 'available',
        endpoints: ['/api/chat', '/api/chat/simple', '/api/search'],
      },
    },
    documentation: {
      swagger: '/docs',
      github: 'https://github.com/buffr-app/buffr-ai-ts',
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    services: {
      database: true, // Would check actual connection
      llm: true,
      agents: {
        companion: true,
        guardian: true,
        transaction_analyst: true,
        // scout: removed
        // mentor: removed
        crafter: true,
        rag: true,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// ==================== Companion Agent Routes ====================

app.post('/api/companion/chat', async (req: Request, res: Response) => {
  try {
    // Support both snake_case (from React Native client) and camelCase
    const { message, sessionId, session_id, userId, user_id } = req.body;
    const finalSessionId = sessionId || session_id;
    const finalUserId = userId || user_id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await runCompanionAgent(message, finalSessionId, finalUserId);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    log.error('Companion chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Streaming chat endpoint - Server-Sent Events (SSE)
app.post('/api/companion/chat/stream', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, session_id, userId, user_id } = req.body;
    const finalSessionId = sessionId || session_id;
    const finalUserId = userId || user_id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Import streaming function
    const { streamChatCompletionOpenAI } = await import('./utils/providers.js');
    const { getOrCreateSession, saveMessage, getSessionMessages } = await import('./utils/db.js');

    // Get or create session
    const session = await getOrCreateSession(finalSessionId, finalUserId);

    // Get conversation history
    const history = await getSessionMessages(session.id, 10);
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Save user message
    await saveMessage({
      sessionId: session.id,
      role: 'user' as any, // MessageRole enum expected, but string works for database
      content: message,
    });

    // Build messages for LLM
    const systemPrompt = `You are Buffr AI Companion, a helpful financial assistant for Buffr, Namibia's digital payment platform.
Be conversational, helpful, and focused on Namibian financial context. Use NAD currency.
Keep responses concise but informative. Use emojis sparingly for friendliness.`;

    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message },
    ];

    // Stream the response
    let fullResponse = '';
    
    for await (const chunk of streamChatCompletionOpenAI(messages)) {
      fullResponse += chunk;
      // Send SSE data
      res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
    }

    // Save assistant message
    await saveMessage({
      sessionId: session.id,
      role: 'assistant' as any, // MessageRole enum expected, but string works for database
      content: fullResponse,
    });

    // Send final message
    res.write(`data: ${JSON.stringify({ chunk: '', done: true, fullMessage: fullResponse, sessionId: session.id })}\n\n`);
    res.end();

  } catch (error) {
    log.error('Streaming chat error:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to process chat', done: true })}\n\n`);
    res.end();
  }
});

app.post('/api/companion/multi-agent', async (req: Request, res: Response) => {
  try {
    // Support both snake_case (from React Native client) and camelCase
    const { message, agents, sessionId, session_id, userId, user_id } = req.body;
    const finalSessionId = sessionId || session_id;
    const finalUserId = userId || user_id;

    if (!message || !agents || !Array.isArray(agents)) {
      return res.status(400).json({ error: 'Message and agents array are required' });
    }

    const response = await multiAgentQuery(message, agents, finalSessionId, finalUserId);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    log.error('Multi-agent query error:', error);
    res.status(500).json({
      error: 'Failed to process multi-agent query',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==================== Helper: Timeout Wrapper for LLM Calls ====================

/**
 * Wraps an async function with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds (default: 60 seconds)
 * @returns The result of the promise or throws timeout error
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 60000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Request timeout - operation took too long')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
}

// ==================== Guardian Agent Routes ====================

app.post('/api/guardian/fraud/check', async (req: Request, res: Response) => {
  try {
    const transactionData = req.body;

    if (!transactionData) {
      return res.status(400).json({ error: 'Transaction data is required' });
    }

    const response = await checkFraud(transactionData);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    log.error('Fraud check error:', error);
    res.status(500).json({
      error: 'Failed to check fraud',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/guardian/credit/assess', async (req: Request, res: Response) => {
  try {
    const userData = req.body;

    if (!userData) {
      return res.status(400).json({ error: 'User data is required' });
    }

    const response = await assessCredit(userData);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    log.error('Credit assessment error:', error);
    res.status(500).json({
      error: 'Failed to assess credit',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/guardian/investigate', async (req: Request, res: Response) => {
  try {
    const alertData = req.body;

    if (!alertData) {
      return res.status(400).json({ error: 'Alert data is required' });
    }

    const response = await investigateAlert(alertData);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    log.error('Investigation error:', error);
    res.status(500).json({
      error: 'Failed to investigate',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/guardian/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await withTimeout(guardianChat(message));

    res.json({
      success: true,
      data: { message: response },
    });
  } catch (error: any) {
    log.error('Guardian chat error:', error);
    
    if (error.message?.includes('timeout')) {
      res.status(504).json({
        error: 'Chat request timed out',
        message: 'The request is taking longer than expected. Please try again later.',
      });
    } else {
      res.status(500).json({
        error: 'Failed to chat with Guardian',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// ==================== RAG Agent Routes ====================
/**
 * Why Two Chat Endpoints?
 * 
 * 1. /api/companion/chat - Companion Agent (Orchestrator)
 *    - Intelligently routes queries to specialized agents (Guardian, Transaction Analyst, Crafter, etc.)
 *    - Best for: General questions, multi-step queries, agent coordination
 *    - Example: "Check if this transaction is fraud and analyze my spending"
 * 
 * 2. /api/chat - RAG Agent (Knowledge Base)
 *    - Searches knowledge base for context before responding
 *    - Best for: Documented topics, regulatory info, FAQs
 *    - Example: "What are the Bank of Namibia regulations for digital payments?"
 * 
 * Use /api/companion/chat for most user interactions (recommended)
 * Use /api/chat when you need knowledge base retrieval
 */

app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const validatedRequest = ChatRequestSchema.parse(req.body);

    const response = await runRagAgent(validatedRequest);

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    log.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process chat',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

app.post('/api/chat/simple', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await withTimeout(simpleChat(message, sessionId, userId));

    res.json({
      success: true,
      data: { message: response },
    });
  } catch (error: any) {
    log.error('Simple chat error:', error);
    
    if (error.message?.includes('timeout')) {
      res.status(504).json({
        error: 'Chat request timed out',
        message: 'The request is taking longer than expected. Please try again later.',
      });
    } else {
      res.status(500).json({
        error: 'Failed to process simple chat',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
});

// ==================== Transaction Analyst Routes ====================

app.post('/api/transaction-analyst/classify', async (req: Request, res: Response) => {
  try {
    const transaction = req.body;
    const response = await classifyTransactionWithAI(transaction);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Classification error:', error);
    res.status(500).json({ error: 'Failed to classify transaction' });
  }
});

app.post('/api/transaction-analyst/analyze', async (req: Request, res: Response) => {
  try {
    const { transactions, period, previousPeriodTransactions } = req.body;
    const response = await analyzeSpending(transactions || [], { period, previousPeriodTransactions });
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze spending' });
  }
});

app.post('/api/transaction-analyst/budget', async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const response = await generateBudget(userData);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Budget error:', error);
    res.status(500).json({ error: 'Failed to generate budget' });
  }
});

app.post('/api/transaction-analyst/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const response = await withTimeout(transactionAnalystChat(message));
    res.json({ success: true, data: { message: response } });
  } catch (error: any) {
    log.error('Transaction Analyst chat error:', error);
    
    if (error.message?.includes('timeout')) {
      res.status(504).json({ 
        error: 'Chat request timed out',
        message: 'The request is taking longer than expected. Please try again later.'
      });
    } else {
      res.status(500).json({ error: 'Failed to chat' });
    }
  }
});

// ==================== Scout Agent Routes ====================
// REMOVED - Not needed for voucher platform

// ==================== Mentor Agent Routes ====================
// REMOVED - Not needed for voucher platform

// ==================== Crafter Agent Routes ====================

app.post('/api/crafter/scheduled-payment', async (req: Request, res: Response) => {
  try {
    const { userId, ...config } = req.body;
    const response = await createScheduledPayment(userId || 'anonymous', config);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Scheduled payment error:', error);
    res.status(500).json({ error: 'Failed to create scheduled payment' });
  }
});

app.post('/api/crafter/spending-alert', async (req: Request, res: Response) => {
  try {
    const { userId, ...config } = req.body;
    const response = await createSpendingAlert(userId || 'anonymous', config);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Spending alert error:', error);
    res.status(500).json({ error: 'Failed to create spending alert' });
  }
});

app.post('/api/crafter/automate-savings', async (req: Request, res: Response) => {
  try {
    const { userId, ...config } = req.body;
    const response = await createSavingsAutomation(userId || 'anonymous', config);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Savings automation error:', error);
    res.status(500).json({ error: 'Failed to create savings automation' });
  }
});

app.post('/api/crafter/workflow/create', async (req: Request, res: Response) => {
  try {
    const { userId, ...config } = req.body;
    const response = await createWorkflow(userId || 'anonymous', config);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Workflow creation error:', error);
    res.status(500).json({ error: 'Failed to create workflow' });
  }
});

app.post('/api/crafter/workflow/execute', async (req: Request, res: Response) => {
  try {
    const { workflowId, context } = req.body;
    const response = await executeWorkflow(workflowId, context);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Workflow execution error:', error);
    res.status(500).json({ error: 'Failed to execute workflow' });
  }
});

app.get('/api/crafter/workflow/monitor/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const response = getUserWorkflows(userId);
    res.json({ success: true, data: response });
  } catch (error) {
    log.error('Workflow monitoring error:', error);
    res.status(500).json({ error: 'Failed to get workflows' });
  }
});

app.post('/api/crafter/chat', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    const response = await crafterChat(message);
    res.json({ success: true, data: { message: response } });
  } catch (error) {
    log.error('Crafter chat error:', error);
    res.status(500).json({ error: 'Failed to chat' });
  }
});

// ==================== Error Handler ====================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  log.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ==================== Server Startup ====================

async function start() {
  try {
    logger.info('🚀 Starting Buffr AI Services...');

    // Initialize database
    try {
      await initializeDatabase();
      logger.info('✓ Database initialized');
    } catch (error) {
      logger.warn('⚠️ Database initialization failed:', { error });
    }

    // Start exchange rate scheduler (fetches twice daily)
    try {
      startExchangeRateScheduler();
    } catch (error) {
      logger.warn('⚠️ Exchange rate scheduler failed to start:', { error });
    }

    // Start server
    app.listen(PORT, HOST, () => {
      const serverUrl = `http://${HOST}:${PORT}`;
      logger.info(`✅ Buffr AI running on ${serverUrl}`);
      
      // Frontend connection info
      logger.info('\n📱 Frontend Connection:');
      logger.info('  CORS enabled for:');
      logger.info('    - http://localhost:8081 (Expo development)');
      logger.info('    - http://localhost:19000 (Expo web)');
      logger.info('    - http://localhost:19006 (Expo web alternative)');
      logger.info('    - http://localhost:3000 (Next.js)');
      logger.info('  Frontend should use:', { serverUrl });
      
      // All available endpoints organized by agent
      logger.info('\n🤖 Available Endpoints by Agent:\n');
      
      logger.info('🌟 Companion Agent (Orchestrator):');
      logger.info('  POST /api/companion/chat - Main chat interface (routes to other agents)');
      logger.info('  POST /api/companion/chat/stream - Streaming chat (SSE)');
      logger.info('  POST /api/companion/multi-agent - Multi-agent coordination');
      
      logger.info('\n🛡️  Guardian Agent (Security & Credit):');
      logger.info('  POST /api/guardian/fraud/check - Fraud detection');
      logger.info('  POST /api/guardian/credit/assess - Credit scoring');
      logger.info('  POST /api/guardian/investigate - Security investigation');
      logger.info('  POST /api/guardian/chat - Security chat');
      
      logger.info('\n📊 Transaction Analyst Agent:');
      logger.info('  POST /api/transaction-analyst/classify - Categorize transactions');
      logger.info('  POST /api/transaction-analyst/analyze - Spending analysis');
      logger.info('  POST /api/transaction-analyst/budget - Generate budgets');
      logger.info('  POST /api/transaction-analyst/chat - Financial insights chat');
      
      // Scout and Mentor agents removed - not needed for voucher platform
      
      logger.info('\n⚙️  Crafter Agent (Automation):');
      logger.info('  POST /api/crafter/scheduled-payment - Create scheduled payment');
      logger.info('  POST /api/crafter/spending-alert - Create spending alert');
      logger.info('  POST /api/crafter/automate-savings - Savings automation');
      logger.info('  POST /api/crafter/workflow/create - Create workflow');
      logger.info('  POST /api/crafter/workflow/execute - Execute workflow');
      logger.info('  GET  /api/crafter/workflow/monitor/:userId - Monitor workflows');
      logger.info('  POST /api/crafter/chat - Automation chat');
      
      logger.info('\n📖 RAG Agent (Knowledge Base):');
      logger.info('  POST /api/chat - RAG-powered chat (knowledge-enhanced)');
      logger.info('  POST /api/chat/simple - Simple chat (no RAG)');
      logger.info('  POST /api/search - Search knowledge base');
      
      logger.info('\n🔍 System Endpoints:');
      logger.info('  GET  / - Service info & all endpoints');
      logger.info('  GET  /health - Health check');
      
      logger.info('\n💡 Chat Endpoints Explained:');
      logger.info('  /api/companion/chat - Uses Companion Agent (orchestrator)');
      logger.info('    → Intelligently routes to Guardian, Transaction Analyst, Crafter, etc.');
      logger.info('    → Best for: General questions, multi-agent coordination');
      logger.info('  /api/chat - Uses RAG Agent (knowledge base)');
      logger.info('    → Searches knowledge base for context');
      logger.info('    → Best for: Documented topics, regulatory info');
      logger.info('\n📚 Full API docs: GET /');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('\n🛑 Shutting down Buffr AI...');
      await closeDatabase();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('\n🛑 Shutting down Buffr AI...');
      await closeDatabase();
      process.exit(0);
    });

  } catch (error) {
    log.error('❌ Failed to start Buffr AI:', error);
    process.exit(1);
  }
}

start();

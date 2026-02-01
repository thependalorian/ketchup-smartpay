/**
 * Companion Agent - Multi-Agent Orchestrator
 * 
 * Central conversational interface that routes to specialized agents
 */

import {
  CompanionDependencies,
  CompanionResponse,
  AgentType,
  Message,
  MessageRole,
} from '../../types/index.js';
import { chatCompletion } from '../../utils/providers.js';
import { getOrCreateSession, saveMessage, getSessionMessages } from '../../utils/db.js';
import { checkFraud, assessCredit, guardianChat } from '../guardian/agent.js';

// Companion system prompt for routing and orchestration
const COMPANION_SYSTEM_PROMPT = `You are Buffr AI Companion, the central intelligence for Buffr, Namibia's premier digital payment platform.

## Your Role
You are the primary interface for users, coordinating responses from specialized agents:

1. **Guardian Agent** - For fraud detection, credit scoring, and security questions
2. **Transaction Analyst** - For spending analysis, budgeting, and financial insights
3. **Crafter Agent** - For workflow automation and scheduled tasks

## Response Guidelines

1. **Understand Intent**: Determine which specialized agent should handle the query
2. **Provide Context**: Share relevant user context with specialized agents
3. **Synthesize Responses**: Combine insights from multiple agents when needed
4. **Be Helpful**: Always aim to provide actionable, personalized advice
5. **Stay Focused**: Keep responses relevant to Namibian financial context

## Routing Logic

- Security/Fraud/Risk → Guardian Agent
- Spending/Budget/Analysis → Transaction Analyst
- Automation/Schedules → Crafter Agent
- General Questions → Handle directly

## Response Format

When routing to agents, explain what you're doing and synthesize the response naturally.
Be conversational and helpful. Use NAD currency and Namibian context.`;

// Intent detection prompt
const INTENT_DETECTION_PROMPT = `Based on this user message, determine which specialized agent should handle it.

User Message: "{message}"

Choose ONE of these agents:
- GUARDIAN: For fraud, security, credit, risk questions
- TRANSACTION_ANALYST: For spending, budget, transaction analysis
- CRAFTER: For automation, scheduled payments, workflows
- COMPANION: For general questions, greetings, unclear intent

Respond with ONLY the agent name, nothing else.`;

/**
 * Detect user intent and route to appropriate agent
 */
async function detectIntent(message: string): Promise<AgentType> {
  const prompt = INTENT_DETECTION_PROMPT.replace('{message}', message);
  
  const response = await chatCompletion([
    { role: 'user', content: prompt },
  ], { temperature: 0 });

  const agentName = response.trim().toUpperCase();

  switch (agentName) {
    case 'GUARDIAN':
      return AgentType.GUARDIAN;
    case 'TRANSACTION_ANALYST':
      return AgentType.TRANSACTION_ANALYST;
    case 'CRAFTER':
      return AgentType.CRAFTER;
    default:
      return AgentType.COMPANION;
  }
}

/**
 * Generate follow-up suggestions based on conversation
 */
async function generateFollowUps(
  message: string,
  response: string,
  agentUsed: AgentType
): Promise<string[]> {
  const suggestions: Record<AgentType, string[]> = {
    [AgentType.GUARDIAN]: [
      'Check my recent transactions for fraud',
      'What\'s my credit score?',
      'How can I improve my account security?',
    ],
    [AgentType.TRANSACTION_ANALYST]: [
      'Show me my spending breakdown',
      'Create a budget for this month',
      'Which categories am I overspending on?',
    ],
    [AgentType.SCOUT]: [
      'What\'s the USD to NAD rate?',
      'Any regulatory updates this week?',
      'Best savings account rates in Namibia?',
    ],
    [AgentType.MENTOR]: [
      'Teach me about compound interest',
      'Tips for saving for emergencies',
      'How do credit cards work?',
    ],
    [AgentType.CRAFTER]: [
      'Set up a monthly savings transfer',
      'Create a spending alert',
      'Automate my bill payments',
    ],
    [AgentType.COMPANION]: [
      'Check my account balance',
      'Help me send money',
      'What can you help me with?',
    ],
    [AgentType.RAG]: [
      'Search our knowledge base',
      'Find related information',
      'Get more details',
    ],
  };

  return suggestions[agentUsed] || suggestions[AgentType.COMPANION];
}

/**
 * Run Companion agent - main entry point
 */
export async function runCompanionAgent(
  message: string,
  sessionId?: string,
  userId?: string,
  conversationHistory?: Message[]
): Promise<CompanionResponse> {
  // Get or create session
  const session = await getOrCreateSession(sessionId, userId);

  // Get conversation history if not provided
  const history = conversationHistory || await getSessionMessages(session.id, 10);

  // Detect intent
  const agentType = await detectIntent(message);

  // Save user message
  await saveMessage({
    sessionId: session.id,
    role: MessageRole.USER,
    content: message,
    metadata: { detectedAgent: agentType },
  });

  let agentResponse: any;
  let finalMessage: string;
  let confidence = 0.85;

  // Route to appropriate agent
  switch (agentType) {
    case AgentType.GUARDIAN:
      // For Guardian, we need to determine if it's fraud check, credit, or general
      if (message.toLowerCase().includes('fraud') || message.toLowerCase().includes('suspicious')) {
        agentResponse = await checkFraud({ 
          description: message,
          timestamp: new Date().toISOString(),
        });
        finalMessage = `🛡️ **Security Check**\n\n${agentResponse.reasoning}\n\n**Risk Level**: ${agentResponse.result.isFraud ? 'High' : 'Low'}`;
      } else if (message.toLowerCase().includes('credit') || message.toLowerCase().includes('loan')) {
        agentResponse = await assessCredit({ 
          description: message,
          monthlyIncome: 15000, // Would come from user context
        });
        finalMessage = `💳 **Credit Assessment**\n\n${agentResponse.reasoning}`;
      } else {
        finalMessage = await guardianChat(message);
        agentResponse = { type: 'chat', result: finalMessage };
      }
      break;

    case AgentType.TRANSACTION_ANALYST:
      // Placeholder - would call Transaction Analyst agent
      finalMessage = `📊 **Spending Analysis**\n\nI'll analyze your spending patterns. Based on your recent transactions:\n\n- **Total Spent This Month**: NAD 12,450\n- **Top Category**: Groceries (35%)\n- **vs Last Month**: -5% spending\n\nWould you like a detailed breakdown or budget recommendations?`;
      agentResponse = { type: 'analysis', result: { message: finalMessage } };
      break;

    case AgentType.SCOUT:
      // Placeholder - would call Scout agent
      finalMessage = `🔭 **Market Intelligence**\n\nCurrent NAD Exchange Rates:\n- USD/NAD: 18.45\n- EUR/NAD: 20.12\n- GBP/NAD: 23.56\n\nRecent Updates:\n- Bank of Namibia kept repo rate at 7.75%\n- NAMFISA published new insurance guidelines\n\nWant more details on any of these?`;
      agentResponse = { type: 'market_info', result: { message: finalMessage } };
      break;

    case AgentType.MENTOR:
      // Placeholder - would call Mentor agent
      finalMessage = `📚 **Financial Education**\n\nGreat question! Let me explain:\n\n${message.toLowerCase().includes('sav') ? 
        'Saving money is about paying yourself first. Try the 50/30/20 rule:\n- 50% for needs\n- 30% for wants\n- 20% for savings' :
        'Financial literacy is key to building wealth. Start with understanding:\n- Budgeting basics\n- Emergency funds\n- Compound interest'}\n\nWould you like to start a personalized learning path?`;
      agentResponse = { type: 'education', result: { message: finalMessage } };
      break;

    case AgentType.CRAFTER:
      // Placeholder - would call Crafter agent
      finalMessage = `⚙️ **Workflow Automation**\n\nI can help you set up:\n\n- 📅 **Scheduled Payments**: Auto-pay bills\n- 🔔 **Spending Alerts**: Notify when limits reached\n- 💰 **Auto-Savings**: Transfer to savings automatically\n\nWhich would you like to set up?`;
      agentResponse = { type: 'automation', result: { message: finalMessage } };
      break;

    default:
      // Handle directly with Companion
      const messages = [
        { role: 'system' as const, content: COMPANION_SYSTEM_PROMPT },
        ...history.map(h => ({ 
          role: h.role as 'user' | 'assistant', 
          content: h.content 
        })),
        { role: 'user' as const, content: message },
      ];
      
      finalMessage = await chatCompletion(messages);
      agentResponse = { type: 'general', result: { message: finalMessage } };
      confidence = 0.9;
  }

  // Save assistant response
  await saveMessage({
    sessionId: session.id,
    role: MessageRole.ASSISTANT,
    content: finalMessage,
    metadata: { agentUsed: agentType, agentResponse },
  });

  // Generate follow-up suggestions
  const followUpSuggestions = await generateFollowUps(message, finalMessage, agentType);

  return {
    message: finalMessage,
    agentUsed: agentType,
    agentResponse,
    followUpSuggestions,
    confidence,
  };
}

/**
 * Multi-agent coordination for complex queries
 */
export async function multiAgentQuery(
  message: string,
  agents: AgentType[],
  sessionId?: string,
  userId?: string
): Promise<{
  combinedResponse: string;
  agentResponses: Record<AgentType, any>;
}> {
  const agentResponses: Record<string, any> = {};

  // Run queries in parallel
  const promises = agents.map(async (agent) => {
    switch (agent) {
      case AgentType.GUARDIAN:
        return { agent, response: await guardianChat(message) };
      // Add other agents as they're implemented
      default:
        return { agent, response: 'Agent not yet implemented' };
    }
  });

  const results = await Promise.all(promises);

  for (const { agent, response } of results) {
    agentResponses[agent] = response;
  }

  // Combine responses
  const combinedResponse = Object.entries(agentResponses)
    .map(([agent, response]) => `**${agent}**: ${response}`)
    .join('\n\n');

  return {
    combinedResponse,
    agentResponses: agentResponses as Record<AgentType, any>,
  };
}

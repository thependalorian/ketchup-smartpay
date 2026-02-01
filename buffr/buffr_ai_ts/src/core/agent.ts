/**
 * Base RAG Agent
 * 
 * Core agent for retrieval-augmented generation with tool calling
 */

import { 
  AgentDependencies, 
  ChatRequest, 
  ChatResponse, 
  MessageRole,
  Message,
  ToolCall 
} from '../types/index.js';
import { chatCompletionWithTools, chatCompletion } from '../utils/providers.js';
import { getOrCreateSession, saveMessage, getSessionMessages } from '../utils/db.js';
import { TOOL_DEFINITIONS, executeTool } from './tools.js';
import { v4 as uuidv4 } from 'uuid';

// System prompt for RAG agent
const RAG_SYSTEM_PROMPT = `You are Buffr AI, an intelligent financial assistant for the Buffr payment app in Namibia.

Your capabilities include:
- Answering questions about financial services, payments, and transactions
- Searching through documents and knowledge base for relevant information
- Providing insights and recommendations based on user queries

When responding:
1. Be concise and helpful
2. Use the search tools to find relevant information before answering
3. Cite your sources when providing information from documents
4. If you don't know something, say so clearly
5. Focus on Namibian financial context (NAD currency, local regulations, etc.)

Available tools:
- vector_search: Find semantically similar content
- hybrid_search: Combine semantic and keyword search
- get_document: Retrieve full document content
- list_documents: List available documents`;

export interface AgentRunOptions {
  maxIterations?: number;
  includeHistory?: boolean;
  historyLimit?: number;
}

/**
 * Run the RAG agent with a user query
 */
export async function runRagAgent(
  request: ChatRequest,
  deps?: Partial<AgentDependencies>,
  options: AgentRunOptions = {}
): Promise<ChatResponse> {
  const { maxIterations = 5, includeHistory = true, historyLimit = 10 } = options;

  // Get or create session
  const session = await getOrCreateSession(request.sessionId, request.userId);
  
  // Build message history
  const messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }> = [
    { role: 'system', content: RAG_SYSTEM_PROMPT },
  ];

  // Add conversation history if enabled
  if (includeHistory) {
    const history = await getSessionMessages(session.id, historyLimit);
    for (const msg of history) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  // Add current user message
  messages.push({ role: 'user', content: request.message });

  // Save user message
  await saveMessage({
    sessionId: session.id,
    role: MessageRole.USER,
    content: request.message,
    metadata: request.metadata,
  });

  // Track tools used
  const toolsUsed: ToolCall[] = [];
  let finalResponse = '';
  let iterations = 0;

  // Agent loop with tool calling
  while (iterations < maxIterations) {
    iterations++;

    const { content, toolCalls } = await chatCompletionWithTools(
      messages,
      TOOL_DEFINITIONS
    );

    // If no tool calls, we have the final response
    if (toolCalls.length === 0) {
      finalResponse = content || '';
      break;
    }

    // Execute tool calls
    for (const toolCall of toolCalls) {
      const toolResult = await executeTool(toolCall.name, toolCall.arguments);
      
      // Add tool call to messages (assistant made tool call)
      messages.push({
        role: 'assistant',
        content: '',
        // Note: In actual implementation, you'd include the tool_calls array
      });

      // Add tool result
      messages.push({
        role: 'tool',
        content: JSON.stringify(toolResult),
        tool_call_id: toolCall.id,
      });

      toolsUsed.push({
        toolName: toolCall.name,
        args: toolCall.arguments,
        toolCallId: toolCall.id,
      });
    }
  }

  // If we hit max iterations without a final response, generate one
  if (!finalResponse) {
    // Filter out tool messages for final completion (chatCompletion doesn't support 'tool' role)
    const filteredMessages = messages
      .filter(m => m.role !== 'tool')
      .map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content }));
    finalResponse = await chatCompletion(filteredMessages, );
  }

  // Save assistant response
  await saveMessage({
    sessionId: session.id,
    role: MessageRole.ASSISTANT,
    content: finalResponse,
    metadata: { toolsUsed, iterations },
  });

  return {
    message: finalResponse,
    sessionId: session.id,
    sources: [], // TODO: Extract sources from tool results
    toolsUsed,
    metadata: {
      iterations,
      searchType: request.searchType,
    },
  };
}

/**
 * Simple chat without tool calling (for basic queries)
 */
export async function simpleChat(
  message: string,
  sessionId?: string,
  userId?: string
): Promise<string> {
  const session = await getOrCreateSession(sessionId, userId);
  
  // Get history
  const history = await getSessionMessages(session.id, 5);
  
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: RAG_SYSTEM_PROMPT },
  ];

  for (const msg of history) {
    messages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  }

  messages.push({ role: 'user', content: message });

  const response = await chatCompletion(messages);

  // Save messages
  await saveMessage({
    sessionId: session.id,
    role: MessageRole.USER,
    content: message,
  });
  await saveMessage({
    sessionId: session.id,
    role: MessageRole.ASSISTANT,
    content: response,
  });

  return response;
}

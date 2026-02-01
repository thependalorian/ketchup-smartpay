/**
 * LLM Provider Abstraction
 * 
 * Unified interface for OpenAI, Anthropic, and other providers
 */

import OpenAI from 'openai/index.mjs';
import Anthropic from '@anthropic-ai/sdk';
import logger from '@/utils/logger';

// Provider types - includes deepseek (OpenAI-compatible)
export type ProviderType = 'openai' | 'anthropic' | 'deepseek' | 'local';

export interface LLMConfig {
  provider: ProviderType;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface EmbeddingConfig {
  provider: 'openai' | 'deepseek';
  model: string;
  dimensions?: number;
}

// Default configurations - use DeepSeek as default (more affordable)
const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'deepseek',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
};

const DEFAULT_EMBEDDING_CONFIG: EmbeddingConfig = {
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
};

// Singleton clients
let openaiClient: OpenAI | null = null;
let deepseekClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

/**
 * Get OpenAI client instance
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key') {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * Get DeepSeek client instance (OpenAI-compatible)
 */
export function getDeepSeekClient(): OpenAI {
  if (!deepseekClient) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY environment variable is required');
    }
    const baseURL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    deepseekClient = new OpenAI({ apiKey, baseURL });
  }
  return deepseekClient;
}

/**
 * Get the appropriate LLM client based on provider
 */
export function getLLMClient(): OpenAI {
  const provider = process.env.LLM_PROVIDER || 'deepseek';
  
  if (provider === 'deepseek') {
    return getDeepSeekClient();
  }
  return getOpenAIClient();
}

/**
 * Get Anthropic client instance
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_anthropic_api_key') {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Get LLM configuration from environment
 */
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER as ProviderType) || DEFAULT_LLM_CONFIG.provider;
  const model = process.env.LLM_MODEL || DEFAULT_LLM_CONFIG.model;
  const temperature = parseFloat(process.env.LLM_TEMPERATURE || String(DEFAULT_LLM_CONFIG.temperature));
  const maxTokens = parseInt(process.env.LLM_MAX_TOKENS || String(DEFAULT_LLM_CONFIG.maxTokens));

  return { provider, model, temperature, maxTokens };
}

/**
 * Get embedding configuration from environment
 */
export function getEmbeddingConfig(): EmbeddingConfig {
  const model = process.env.EMBEDDING_MODEL || DEFAULT_EMBEDDING_CONFIG.model;
  const dimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || String(DEFAULT_EMBEDDING_CONFIG.dimensions));

  return { provider: 'openai', model, dimensions };
}

/**
 * Generate embeddings for text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const config = getEmbeddingConfig();
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: config.model,
    input: text,
    dimensions: config.dimensions,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const config = getEmbeddingConfig();
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: config.model,
    input: texts,
    dimensions: config.dimensions,
  });

  return response.data.map(d => d.embedding);
}

/**
 * Chat completion with OpenAI or DeepSeek (OpenAI-compatible)
 */
export async function chatCompletionOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: Partial<LLMConfig>
): Promise<string> {
  const config = { ...getLLMConfig(), ...options };
  const client = getLLMClient(); // Uses DeepSeek or OpenAI based on config

  const response = await client.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Chat completion with Anthropic
 */
export async function chatCompletionAnthropic(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  systemPrompt?: string,
  options?: Partial<LLMConfig>
): Promise<string> {
  const config = { ...getLLMConfig(), ...options };
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: config.model || 'claude-3-haiku-20240307',
    max_tokens: config.maxTokens || 4096,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find(block => block.type === 'text');
  return textBlock?.type === 'text' ? textBlock.text : '';
}

/**
 * Unified chat completion interface
 * Supports OpenAI, DeepSeek (OpenAI-compatible), and Anthropic
 */
export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: Partial<LLMConfig>
): Promise<string> {
  const config = { ...getLLMConfig(), ...options };

  if (config.provider === 'anthropic') {
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
    
    return chatCompletionAnthropic(nonSystemMessages, systemMessage?.content, options);
  }

  // Both 'openai' and 'deepseek' use OpenAI-compatible API
  return chatCompletionOpenAI(messages, options);
}

/**
 * Streaming chat completion with OpenAI or DeepSeek
 */
export async function* streamChatCompletionOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: Partial<LLMConfig>
): AsyncGenerator<string> {
  const config = { ...getLLMConfig(), ...options };
  const client = getLLMClient(); // Uses DeepSeek or OpenAI based on config

  const stream = await client.chat.completions.create({
    model: config.model,
    messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

/**
 * Tool-calling chat completion
 */
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export async function chatCompletionWithTools(
  messages: Array<{ role: 'system' | 'user' | 'assistant' | 'tool'; content: string; tool_call_id?: string }>,
  tools: Tool[],
  options?: Partial<LLMConfig>
): Promise<{ content: string | null; toolCalls: ToolCall[] }> {
  const config = { ...getLLMConfig(), ...options };
  const client = getLLMClient(); // Uses DeepSeek or OpenAI based on config

  const openaiTools = tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: messages as any,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      tools: openaiTools,
      tool_choice: 'auto',
    });

    const message = response.choices[0]?.message;
    const toolCalls: ToolCall[] = (message?.tool_calls || []).map(tc => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || '{}'),
    }));

    return {
      content: message?.content || null,
      toolCalls,
    };
  } catch (error: any) {
    // DeepSeek may not support tool_choice, fall back to basic completion
    if (error.message?.includes('tool_choice') || error.code === 'invalid_request_error') {
      logger.warn('Tool calling not supported by provider, falling back to basic completion');
      const response = await client.chat.completions.create({
        model: config.model,
        messages: messages as any,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      });
      return {
        content: response.choices[0]?.message?.content || null,
        toolCalls: [],
      };
    }
    throw error;
  }
}

/**
 * RAG Agent Tools
 * 
 * Tools for vector search, graph search, and document retrieval
 */

import { ChunkResult, GraphSearchResult, DocumentMetadata } from '../types/index.js';
import { vectorSearch, hybridSearch, getDocument, listDocuments, getDocumentChunks } from '../utils/db.js';
import { generateEmbedding } from '../utils/providers.js';
import logger, { log } from '@/utils/logger';

// ==================== Tool Input Types ====================

export interface VectorSearchInput {
  query: string;
  limit?: number;
}

export interface GraphSearchInput {
  query: string;
}

export interface HybridSearchInput {
  query: string;
  limit?: number;
  textWeight?: number;
}

export interface DocumentInput {
  documentId: string;
}

export interface DocumentListInput {
  limit?: number;
  offset?: number;
}

export interface EntityRelationshipInput {
  entityName: string;
  depth?: number;
}

export interface EntityTimelineInput {
  entityName: string;
  startDate?: string;
  endDate?: string;
}

// ==================== Tool Definitions (OpenAI Format) ====================

export const TOOL_DEFINITIONS = [
  {
    name: 'vector_search',
    description: 'Search for relevant information using semantic similarity. Best for finding conceptually related content.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find similar content',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (1-50)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'graph_search',
    description: 'Search the knowledge graph for facts and relationships. Best for finding specific facts about entities.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query to find facts and relationships',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'hybrid_search',
    description: 'Perform both vector and keyword search for comprehensive results. Combines semantic and exact matching.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query for hybrid search',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (1-50)',
          default: 10,
        },
        textWeight: {
          type: 'number',
          description: 'Weight for text similarity vs vector similarity (0.0-1.0)',
          default: 0.3,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_document',
    description: 'Retrieve the complete content of a specific document. Best for getting full context from a source.',
    parameters: {
      type: 'object',
      properties: {
        documentId: {
          type: 'string',
          description: 'UUID of the document to retrieve',
        },
      },
      required: ['documentId'],
    },
  },
  {
    name: 'list_documents',
    description: 'List available documents with their metadata. Best for understanding available information sources.',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of documents to return (1-100)',
          default: 20,
        },
        offset: {
          type: 'number',
          description: 'Number of documents to skip for pagination',
          default: 0,
        },
      },
    },
  },
];

// ==================== Tool Implementations ====================

/**
 * Vector search tool - semantic similarity search
 */
export async function vectorSearchTool(input: VectorSearchInput): Promise<ChunkResult[]> {
  try {
    const embedding = await generateEmbedding(input.query);
    const results = await vectorSearch(embedding, input.limit || 10);
    return results;
  } catch (error) {
    log.error('Vector search failed:', error);
    return [];
  }
}

/**
 * Graph search tool - knowledge graph query
 * Note: This is a placeholder - actual implementation requires Neo4j or similar
 */
export async function graphSearchTool(input: GraphSearchInput): Promise<GraphSearchResult[]> {
  try {
    // Simulated Knowledge Graph Search
    // In production, this would query Neo4j or a similar graph database
    logger.info('Graph search query:', { query: input.query });
    
    // Return structured facts based on common Namibian financial entities
    const mockFacts: GraphSearchResult[] = [
      {
        uuid: 'fact-1',
        fact: 'Bank of Namibia regulates Electronic Money Issuers per PSD-3 standards.',
        validAt: new Date().toISOString(),
      },
      {
        uuid: 'fact-2',
        fact: 'NamPay provides Instant Settlement services aligned with IPP Standards.',
        validAt: new Date().toISOString(),
      }
    ].filter(f =>
      f.fact.toLowerCase().includes(input.query.toLowerCase())
    );

    return mockFacts;
  } catch (error) {
    log.error('Graph search failed:', error);
    return [];
  }
}

/**
 * Hybrid search tool - vector + keyword search
 */
export async function hybridSearchTool(input: HybridSearchInput): Promise<ChunkResult[]> {
  try {
    const embedding = await generateEmbedding(input.query);
    const results = await hybridSearch(
      embedding,
      input.query,
      input.limit || 10,
      input.textWeight || 0.3
    );
    return results;
  } catch (error) {
    log.error('Hybrid search failed:', error);
    return [];
  }
}

/**
 * Get document tool - retrieve full document
 */
export async function getDocumentTool(input: DocumentInput): Promise<DocumentMetadata | null> {
  try {
    const document = await getDocument(input.documentId);
    if (document) {
      const chunks = await getDocumentChunks(input.documentId);
      return { ...document, chunkCount: chunks.length };
    }
    return null;
  } catch (error) {
    log.error('Document retrieval failed:', error);
    return null;
  }
}

/**
 * List documents tool - get available documents
 */
export async function listDocumentsTool(input: DocumentListInput): Promise<DocumentMetadata[]> {
  try {
    return await listDocuments(input.limit || 20, input.offset || 0);
  } catch (error) {
    log.error('Document listing failed:', error);
    return [];
  }
}

/**
 * Get entity relationships tool
 * Note: This is a placeholder - actual implementation requires knowledge graph
 */
export async function getEntityRelationshipsTool(input: EntityRelationshipInput): Promise<any> {
  try {
    // Simulated Entity Relationship Query
    return {
      centralEntity: input.entityName,
      relatedEntities: ['NamPay', 'Bank of Namibia', 'NamClear'],
      relationships: [
        { from: input.entityName, to: 'NamPay', type: 'INTEGRATED_WITH' },
        { from: 'Bank of Namibia', to: input.entityName, type: 'REGULATES' }
      ],
      depth: input.depth || 2,
    };
  } catch (error) {
    log.error('Entity relationship query failed:', error);
    return {
      centralEntity: input.entityName,
      relatedEntities: [],
      relationships: [],
      depth: input.depth || 2,
      error: String(error),
    };
  }
}

/**
 * Get entity timeline tool
 * Note: This is a placeholder - actual implementation requires knowledge graph
 */
export async function getEntityTimelineTool(input: EntityTimelineInput): Promise<any[]> {
  try {
    // TODO: Implement actual timeline query
    return [];
  } catch (error) {
    log.error('Entity timeline query failed:', error);
    return [];
  }
}

// ==================== Tool Router ====================

/**
 * Execute a tool by name
 */
export async function executeTool(
  toolName: string,
  args: Record<string, any>
): Promise<any> {
  switch (toolName) {
    case 'vector_search':
      return vectorSearchTool(args as VectorSearchInput);
    case 'graph_search':
      return graphSearchTool(args as GraphSearchInput);
    case 'hybrid_search':
      return hybridSearchTool(args as HybridSearchInput);
    case 'get_document':
      return getDocumentTool(args as DocumentInput);
    case 'list_documents':
      return listDocumentsTool(args as DocumentListInput);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

/**
 * Comprehensive search combining multiple methods
 */
export async function comprehensiveSearch(
  query: string,
  options: {
    useVector?: boolean;
    useGraph?: boolean;
    limit?: number;
  } = {}
): Promise<{
  query: string;
  vectorResults: ChunkResult[];
  graphResults: GraphSearchResult[];
  totalResults: number;
}> {
  const { useVector = true, useGraph = true, limit = 10 } = options;

  const results = {
    query,
    vectorResults: [] as ChunkResult[],
    graphResults: [] as GraphSearchResult[],
    totalResults: 0,
  };

  const promises: Promise<void>[] = [];

  if (useVector) {
    promises.push(
      vectorSearchTool({ query, limit }).then(r => {
        results.vectorResults = r;
      })
    );
  }

  if (useGraph) {
    promises.push(
      graphSearchTool({ query }).then(r => {
        results.graphResults = r;
      })
    );
  }

  await Promise.all(promises);

  results.totalResults = results.vectorResults.length + results.graphResults.length;

  return results;
}

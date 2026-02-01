/**
 * Database Utilities for Buffr AI
 * 
 * Neon PostgreSQL integration with vector search support
 */

import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { ChunkResult, DocumentMetadata, Session, Message } from '../types/index.js';
import logger from '@/utils/logger';

// Lazy initialization
let sql: NeonQueryFunction<false, false> | null = null;

function getSQL(): NeonQueryFunction<false, false> {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    sql = neon(databaseUrl);
  }
  return sql;
}

/**
 * Initialize database tables for AI agents
 * Note: Neon serverless doesn't support multiple statements, so we run them separately
 */
export async function initializeDatabase(): Promise<void> {
  const sql = getSQL();
  
  try {
    // Sessions table for conversation tracking
    await sql`
      CREATE TABLE IF NOT EXISTS ai_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
      )
    `;

    // Messages table for conversation history
    await sql`
      CREATE TABLE IF NOT EXISTS ai_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Documents table for RAG
    await sql`
      CREATE TABLE IF NOT EXISTS ai_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Chunks table with vector embeddings
    await sql`
      CREATE TABLE IF NOT EXISTS ai_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID REFERENCES ai_documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(1536),
        chunk_index INTEGER NOT NULL,
        metadata JSONB DEFAULT '{}',
        token_count INTEGER,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Create indexes (these may already exist)
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_messages_session ON ai_messages(session_id)`;
    } catch { /* Index may already exist */ }
    
    try {
      await sql`CREATE INDEX IF NOT EXISTS idx_ai_documents_source ON ai_documents(source)`;
    } catch { /* Index may already exist */ }

    logger.info('✓ AI database tables initialized');
  } catch (error: any) {
    // Tables might already exist, that's okay
    if (error.code === '42P07') { // Duplicate table
      logger.info('✓ AI database tables already exist');
    } else {
      logger.warn('⚠️ Database initialization warning:', { message: error.message });
    }
  }
}

/**
 * Perform vector similarity search
 */
export async function vectorSearch(
  embedding: number[],
  limit: number = 10,
  threshold: number = 0.0
): Promise<ChunkResult[]> {
  const sql = getSQL();
  
  const results = await sql`
    SELECT 
      c.id as chunk_id,
      c.document_id,
      c.content,
      c.metadata,
      d.title as document_title,
      d.source as document_source,
      1 - (c.embedding <=> ${JSON.stringify(embedding)}::vector) as similarity
    FROM ai_chunks c
    JOIN ai_documents d ON c.document_id = d.id
    WHERE 1 - (c.embedding <=> ${JSON.stringify(embedding)}::vector) > ${threshold}
    ORDER BY c.embedding <=> ${JSON.stringify(embedding)}::vector
    LIMIT ${limit}
  `;

  return results.map(r => ({
    chunkId: r.chunk_id,
    documentId: r.document_id,
    content: r.content,
    score: r.similarity,
    metadata: r.metadata || {},
    documentTitle: r.document_title,
    documentSource: r.document_source,
  }));
}

/**
 * Perform hybrid search (vector + keyword)
 */
export async function hybridSearch(
  embedding: number[],
  queryText: string,
  limit: number = 10,
  textWeight: number = 0.3
): Promise<ChunkResult[]> {
  const sql = getSQL();
  
  const vectorWeight = 1 - textWeight;

  const results = await sql`
    WITH vector_results AS (
      SELECT 
        c.id,
        c.document_id,
        c.content,
        c.metadata,
        d.title as document_title,
        d.source as document_source,
        1 - (c.embedding <=> ${JSON.stringify(embedding)}::vector) as vector_score
      FROM ai_chunks c
      JOIN ai_documents d ON c.document_id = d.id
      ORDER BY c.embedding <=> ${JSON.stringify(embedding)}::vector
      LIMIT ${limit * 2}
    ),
    text_results AS (
      SELECT 
        c.id,
        ts_rank(to_tsvector('english', c.content), plainto_tsquery('english', ${queryText})) as text_score
      FROM ai_chunks c
      WHERE to_tsvector('english', c.content) @@ plainto_tsquery('english', ${queryText})
    )
    SELECT 
      v.*,
      COALESCE(t.text_score, 0) as text_score,
      (v.vector_score * ${vectorWeight} + COALESCE(t.text_score, 0) * ${textWeight}) as combined_score
    FROM vector_results v
    LEFT JOIN text_results t ON v.id = t.id
    ORDER BY combined_score DESC
    LIMIT ${limit}
  `;

  return results.map(r => ({
    chunkId: r.id,
    documentId: r.document_id,
    content: r.content,
    score: r.combined_score,
    metadata: r.metadata || {},
    documentTitle: r.document_title,
    documentSource: r.document_source,
  }));
}

/**
 * Get document by ID
 */
export async function getDocument(documentId: string): Promise<DocumentMetadata | null> {
  const sql = getSQL();
  
  const results = await sql`
    SELECT 
      d.id,
      d.title,
      d.source,
      d.content,
      d.metadata,
      d.created_at,
      d.updated_at,
      COUNT(c.id) as chunk_count
    FROM ai_documents d
    LEFT JOIN ai_chunks c ON d.id = c.document_id
    WHERE d.id = ${documentId}::uuid
    GROUP BY d.id
  `;

  if (results.length === 0) return null;

  const r = results[0];
  return {
    id: r.id,
    title: r.title,
    source: r.source,
    metadata: r.metadata || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    chunkCount: parseInt(r.chunk_count) || 0,
  };
}

/**
 * List all documents
 */
export async function listDocuments(
  limit: number = 20,
  offset: number = 0
): Promise<DocumentMetadata[]> {
  const sql = getSQL();
  
  const results = await sql`
    SELECT 
      d.id,
      d.title,
      d.source,
      d.metadata,
      d.created_at,
      d.updated_at,
      COUNT(c.id) as chunk_count
    FROM ai_documents d
    LEFT JOIN ai_chunks c ON d.id = c.document_id
    GROUP BY d.id
    ORDER BY d.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;

  return results.map(r => ({
    id: r.id,
    title: r.title,
    source: r.source,
    metadata: r.metadata || {},
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    chunkCount: parseInt(r.chunk_count) || 0,
  }));
}

/**
 * Get document chunks
 */
export async function getDocumentChunks(documentId: string): Promise<any[]> {
  const sql = getSQL();
  
  const results = await sql`
    SELECT 
      id,
      content,
      chunk_index,
      metadata,
      token_count,
      created_at
    FROM ai_chunks
    WHERE document_id = ${documentId}::uuid
    ORDER BY chunk_index
  `;

  return results;
}

/**
 * Check if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Create or get session
 */
export async function getOrCreateSession(
  sessionId?: string,
  userId?: string
): Promise<Session> {
  const sql = getSQL();
  
  // Only try to look up existing session if sessionId is a valid UUID
  if (sessionId && isValidUUID(sessionId)) {
    try {
      const existing = await sql`
        SELECT id, user_id, metadata, created_at, updated_at, expires_at
        FROM ai_sessions
        WHERE id = ${sessionId}::uuid AND expires_at > NOW()
      `;
      
      if (existing.length > 0) {
        const s = existing[0];
        return {
          id: s.id,
          userId: s.user_id,
          metadata: s.metadata,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
          expiresAt: s.expires_at,
        };
      }
    } catch (error) {
      // If lookup fails, create a new session
      logger.warn('Session lookup failed, creating new session:', { error });
    }
  }

  const newSession = await sql`
    INSERT INTO ai_sessions (user_id)
    VALUES (${userId || null})
    RETURNING id, user_id, metadata, created_at, updated_at, expires_at
  `;

  const s = newSession[0];
  return {
    id: s.id,
    userId: s.user_id,
    metadata: s.metadata,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
    expiresAt: s.expires_at,
  };
}

/**
 * Save message to session
 */
export async function saveMessage(message: Message): Promise<Message> {
  const sql = getSQL();
  
  const results = await sql`
    INSERT INTO ai_messages (session_id, role, content, metadata)
    VALUES (
      ${message.sessionId}::uuid,
      ${message.role},
      ${message.content},
      ${JSON.stringify(message.metadata || {})}::jsonb
    )
    RETURNING id, session_id, role, content, metadata, created_at
  `;

  const m = results[0];
  return {
    id: m.id,
    sessionId: m.session_id,
    role: m.role,
    content: m.content,
    metadata: m.metadata,
    createdAt: m.created_at,
  };
}

/**
 * Get session messages
 */
export async function getSessionMessages(
  sessionId: string,
  limit: number = 50
): Promise<Message[]> {
  const sql = getSQL();
  
  const results = await sql`
    SELECT id, session_id, role, content, metadata, created_at
    FROM ai_messages
    WHERE session_id = ${sessionId}::uuid
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;

  return results.reverse().map(m => ({
    id: m.id,
    sessionId: m.session_id,
    role: m.role,
    content: m.content,
    metadata: m.metadata,
    createdAt: m.created_at,
  }));
}

/**
 * Close database connections
 */
export async function closeDatabase(): Promise<void> {
  // Neon serverless doesn't require explicit connection closing
  sql = null;
  logger.info('✓ Database connections closed');
}

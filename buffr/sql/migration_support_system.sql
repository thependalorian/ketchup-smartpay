-- Migration: Support System Tables
-- Location: sql/migration_support_system.sql
-- Purpose: Create support tickets and conversations tables for customer support agent
-- Date: 2026-01-27

-- ============================================================================
-- SUPPORT TICKETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('TECHNICAL', 'PAYMENT', 'ACCOUNT', 'SECURITY', 'VOUCHER', 'GENERAL', 'FEATURE_REQUEST', 'BUG_REPORT')),
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED')),
  priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  
  -- Assignment
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  
  -- Resolution
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  closed_at TIMESTAMP,
  
  -- Related entities
  related_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  related_voucher_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Standard fields
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP
);

-- Indexes for support_tickets
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_support_tickets_ticket_number ON support_tickets(ticket_number) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON support_tickets(assigned_to) WHERE is_deleted = false AND assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC) WHERE is_deleted = false;

-- ============================================================================
-- SUPPORT CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS support_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  ticket_number VARCHAR(20) REFERENCES support_tickets(ticket_number) ON DELETE SET NULL,
  knowledge_base_used BOOLEAN DEFAULT false,
  escalated BOOLEAN DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for support_conversations
CREATE INDEX IF NOT EXISTS idx_support_conversations_session_id ON support_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_ticket_number ON support_conversations(ticket_number) WHERE ticket_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_conversations_created_at ON support_conversations(created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE support_tickets IS 'Support tickets for customer service escalations from AI agent';
COMMENT ON TABLE support_conversations IS 'Conversation history for support agent interactions';

-- ============================================================================
-- SEED DATA (For testing support system)
-- ============================================================================

-- Insert sample support ticket for testing (only if users table has data)
-- This will be skipped if no users exist
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    -- Get first user if exists
    SELECT id INTO test_user_id FROM users WHERE is_deleted = false LIMIT 1;
    
    IF test_user_id IS NOT NULL THEN
        INSERT INTO support_tickets (
            id, user_id, ticket_number, subject, description,
            category, status, priority, metadata, created_at, updated_at, is_deleted
        ) VALUES (
            gen_random_uuid(),
            test_user_id,
            'TKT-20260127-SEED01',
            'Welcome to Buffr Support',
            'This is a sample support ticket created during migration. The support system is now integrated into the Companion Agent.',
            'GENERAL',
            'OPEN',
            'LOW',
            '{"created_by": "migration", "seed_data": true}'::jsonb,
            NOW(),
            NOW(),
            false
        ) ON CONFLICT (ticket_number) DO NOTHING;
        
        RAISE NOTICE 'Seed support ticket created for user %', test_user_id;
    ELSE
        RAISE NOTICE 'No users found, skipping support ticket seed data';
    END IF;
END $$;

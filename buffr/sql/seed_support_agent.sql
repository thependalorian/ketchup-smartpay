-- Seed Data: Support Agent
-- Location: sql/seed_support_agent.sql
-- Purpose: Seed initial data for support agent testing and development
-- Date: 2026-01-27

-- ============================================================================
-- SAMPLE SUPPORT TICKETS (for testing)
-- ============================================================================

-- Note: These are example tickets for development/testing
-- In production, tickets are created by the AI agent or users

INSERT INTO support_tickets (
  id, user_id, ticket_number, subject, description, category, status, priority,
  created_by_ai, metadata, created_at
) VALUES
  (
    gen_random_uuid(),
    (SELECT id FROM users LIMIT 1), -- Use first user if exists
    'TKT-20260127-EXAMPLE1',
    'Voucher redemption issue',
    'User unable to redeem G2P voucher at merchant location. QR code scan failed multiple times.',
    'VOUCHER',
    'OPEN',
    'MEDIUM',
    true,
    '{"escalation_reason": "Technical issue requiring investigation", "related_voucher_id": null}',
    NOW() - INTERVAL '2 hours'
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM users LIMIT 1),
    'TKT-20260127-EXAMPLE2',
    'Account verification question',
    'User asking about KYC requirements and verification process for G2P vouchers.',
    'ACCOUNT',
    'RESOLVED',
    'LOW',
    true,
    '{"escalation_reason": "User requested human clarification", "resolved_by": "AI Agent"}',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (ticket_number) DO NOTHING;

-- ============================================================================
-- SAMPLE CONVERSATIONS (for testing)
-- ============================================================================

-- Note: These are example conversations for development
-- In production, conversations are created during AI chat sessions

INSERT INTO support_conversations (
  session_id, user_id, user_message, assistant_response, ticket_number,
  knowledge_base_used, escalated, created_at
) VALUES
  (
    'support_session_example_1',
    (SELECT id FROM users LIMIT 1),
    'How do I redeem my voucher?',
    'To redeem your G2P voucher, you can use any of these methods:\n\n1. **Wallet Credit**: Transfer voucher value to your Buffr wallet\n2. **NamPost Cash-out**: Visit any NamPost branch to receive cash\n3. **Agent Cash-out**: Visit a registered agent location\n4. **Bank Transfer**: Transfer to your bank account\n5. **Merchant Payment**: Pay directly at participating merchants using QR code\n\nWould you like detailed steps for any specific method?',
    NULL,
    true,
    false,
    NOW() - INTERVAL '3 hours'
  ),
  (
    'support_session_example_2',
    (SELECT id FROM users LIMIT 1),
    'I want to speak to a human agent',
    'Of course! I understand you\'d like to speak with a human support agent. Let me create a support ticket and connect you right away.',
    'TKT-20260127-EXAMPLE1',
    false,
    true,
    NOW() - INTERVAL '2 hours'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SAMPLE TICKET COMMENTS (for testing)
-- ============================================================================

-- Note: These are example admin responses
-- In production, comments are created by admins responding to tickets

INSERT INTO ticket_comments (
  ticket_id, user_id, comment, is_internal, created_at
) VALUES
  (
    (SELECT id FROM support_tickets WHERE ticket_number = 'TKT-20260127-EXAMPLE1' LIMIT 1),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1), -- Use admin user if exists
    'Investigated QR code issue. Found that merchant terminal was offline. Contacted merchant and issue resolved. User can now redeem voucher.',
    false,
    NOW() - INTERVAL '1 hour'
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify tables exist and have data
DO $$
DECLARE
  ticket_count INTEGER;
  conversation_count INTEGER;
  comment_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ticket_count FROM support_tickets;
  SELECT COUNT(*) INTO conversation_count FROM support_conversations;
  SELECT COUNT(*) INTO comment_count FROM ticket_comments;
  
  RAISE NOTICE 'Support Agent Seed Data:';
  RAISE NOTICE '  - Support Tickets: %', ticket_count;
  RAISE NOTICE '  - Support Conversations: %', conversation_count;
  RAISE NOTICE '  - Ticket Comments: %', comment_count;
END $$;

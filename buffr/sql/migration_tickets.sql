-- Migration: Tickets/Events Table
-- Location: sql/migration_tickets.sql
-- Purpose: Create tickets catalog for dynamic pricing
-- Date: 2025-12-18

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(15,2) NOT NULL,
  event_type VARCHAR(100), -- 'concert', 'sports', 'theater', 'transport', 'movie', etc.
  venue VARCHAR(255),
  event_date TIMESTAMP,
  quantity_available INTEGER,
  quantity_sold INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tickets_active ON tickets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tickets_type ON tickets(event_type);
CREATE INDEX IF NOT EXISTS idx_tickets_event_date ON tickets(event_date);

-- Insert sample tickets
INSERT INTO tickets (event_name, description, price, event_type, venue, event_date, quantity_available, is_active)
VALUES
  ('Namibia Music Festival', 'Annual music festival featuring local artists', 100.00, 'concert', 'Windhoek Stadium', NOW() + INTERVAL '30 days', 1000, true),
  ('Premier League Match', 'Local football match', 50.00, 'sports', 'Independence Stadium', NOW() + INTERVAL '7 days', 500, true),
  ('Theater Performance', 'Local theater production', 75.00, 'theater', 'National Theater', NOW() + INTERVAL '14 days', 200, true),
  ('Bus Ticket - Windhoek to Swakopmund', 'One-way bus ticket', 80.00, 'transport', 'Intercape Terminal', NULL, 9999, true)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE tickets IS 'Tickets and events catalog for dynamic pricing';


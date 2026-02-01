-- Fixed locations: NamPost offices, ATMs, warehouses (for map and reference)
-- Migration: 009_locations.sql
-- Purpose: Store nampost_office, atm, warehouse for Ketchup map. Redemption is via post office, agents, ATM only.
-- Seed: scripts/seed.ts seedLocations()

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('nampost_office', 'atm', 'warehouse')),
  name VARCHAR(255) NOT NULL,
  region VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

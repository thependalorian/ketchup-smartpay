-- Migration: Insurance Products Table
-- Location: sql/migration_insurance_products.sql
-- Purpose: Create insurance products catalog for dynamic premium pricing
-- Date: 2025-12-18

-- Create insurance_products table
CREATE TABLE IF NOT EXISTS insurance_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  premium DECIMAL(15,2) NOT NULL,
  coverage_amount DECIMAL(15,2),
  coverage_type VARCHAR(100), -- 'life', 'health', 'vehicle', 'property', etc.
  duration_months INTEGER, -- Policy duration in months
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_insurance_products_active ON insurance_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_insurance_products_type ON insurance_products(coverage_type);

-- Insert sample insurance products
INSERT INTO insurance_products (name, description, premium, coverage_amount, coverage_type, duration_months, is_active)
VALUES
  ('Basic Life Insurance', 'Basic life insurance coverage for individuals', 500.00, 100000.00, 'life', 12, true),
  ('Health Insurance Basic', 'Basic health insurance coverage', 800.00, 50000.00, 'health', 12, true),
  ('Vehicle Insurance', 'Comprehensive vehicle insurance', 1200.00, 200000.00, 'vehicle', 12, true),
  ('Property Insurance', 'Property and contents insurance', 1000.00, 300000.00, 'property', 12, true)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE insurance_products IS 'Insurance products catalog for dynamic premium pricing';


-- Migration for Existing Database Schema
-- This adds missing fields to existing tables to support our API routes

-- Add missing fields to users table (if they don't exist)
DO $$ 
BEGIN
  -- Add first_name and last_name if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'first_name') THEN
    ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_name') THEN
    ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
  END IF;
  
  -- Populate first_name and last_name from full_name if possible
  UPDATE users 
  SET first_name = SPLIT_PART(full_name, ' ', 1),
      last_name = SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2)
  WHERE full_name IS NOT NULL 
    AND (first_name IS NULL OR last_name IS NULL)
    AND full_name LIKE '% %';
  
  -- For single-word names, put in first_name
  UPDATE users 
  SET first_name = full_name
  WHERE full_name IS NOT NULL 
    AND first_name IS NULL
    AND full_name NOT LIKE '% %';
END $$;

-- Add last_login_at to users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login_at') THEN
    ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
  END IF;
END $$;

-- Add missing fields to wallets table metadata
-- Note: AutoPay settings are stored in metadata JSONB, so we just ensure the structure is correct
-- No schema changes needed for wallets - metadata handles it

-- Add missing fields to transactions table
DO $$ 
BEGIN
  -- Add date field (alias for transaction_time)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'date') THEN
    ALTER TABLE transactions ADD COLUMN date TIMESTAMP WITH TIME ZONE;
    -- Populate from transaction_time
    UPDATE transactions SET date = transaction_time WHERE date IS NULL;
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
  END IF;
  
  -- Add wallet_id to metadata if not in main table
  -- (It's already in metadata, but we can add a computed column or just use metadata)
  
  -- Add description field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'description') THEN
    ALTER TABLE transactions ADD COLUMN description TEXT;
    -- Populate from merchant_name
    UPDATE transactions SET description = merchant_name WHERE description IS NULL AND merchant_name IS NOT NULL;
  END IF;
  
  -- Add category field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'category') THEN
    ALTER TABLE transactions ADD COLUMN category VARCHAR(100);
    -- Populate from merchant_category
    UPDATE transactions SET category = merchant_category WHERE category IS NULL AND merchant_category IS NOT NULL;
  END IF;
  
  -- Add recipient_id and recipient_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'recipient_id') THEN
    ALTER TABLE transactions ADD COLUMN recipient_id VARCHAR(255);
    -- Populate from merchant_id
    UPDATE transactions SET recipient_id = merchant_id::text WHERE recipient_id IS NULL AND merchant_id IS NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'recipient_name') THEN
    ALTER TABLE transactions ADD COLUMN recipient_name VARCHAR(255);
    -- Populate from merchant_name
    UPDATE transactions SET recipient_name = merchant_name WHERE recipient_name IS NULL AND merchant_name IS NOT NULL;
  END IF;
END $$;

-- Add wallet_id column to transactions if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'wallet_id') THEN
    ALTER TABLE transactions ADD COLUMN wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet_id ON transactions(wallet_id);
  END IF;
END $$;

-- Ensure money_requests has paid_amount and paid_at
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'money_requests' AND column_name = 'paid_amount') THEN
    ALTER TABLE money_requests ADD COLUMN paid_amount DECIMAL(15, 2) DEFAULT 0.00;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'money_requests' AND column_name = 'paid_at') THEN
    ALTER TABLE money_requests ADD COLUMN paid_at TIMESTAMP;
  END IF;
END $$;

-- Create function to get user by external_id or id
CREATE OR REPLACE FUNCTION get_user_id(user_identifier TEXT)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Try as UUID first
  BEGIN
    user_uuid := user_identifier::UUID;
    IF EXISTS (SELECT 1 FROM users WHERE id = user_uuid) THEN
      RETURN user_uuid;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Not a UUID, try as external_id
    NULL;
  END;
  
  -- Try as external_id
  SELECT id INTO user_uuid FROM users WHERE external_id = user_identifier LIMIT 1;
  RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

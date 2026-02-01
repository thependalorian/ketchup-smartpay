/**
 * Migration: Savings Wallets & Goals System
 * 
 * Location: sql/migration_savings_wallets.sql
 * Purpose: Support interest-bearing savings wallets with savings goals
 * 
 * Features:
 * - Separate savings wallet type
 * - Interest calculation (2-3% annual)
 * - Savings goals with progress tracking
 * - Auto-savings rules
 */

-- ============================================================================
-- SAVINGS WALLETS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE, -- Link to main wallets table
  name VARCHAR(255) NOT NULL DEFAULT 'Savings', -- Wallet name
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  available_balance DECIMAL(15,2) NOT NULL DEFAULT 0, -- Balance minus locked amounts
  locked_balance DECIMAL(15,2) NOT NULL DEFAULT 0, -- Locked for goal or time period
  interest_rate DECIMAL(5,2) NOT NULL DEFAULT 2.5, -- Annual interest rate (2.5% default)
  interest_earned DECIMAL(15,2) NOT NULL DEFAULT 0, -- Total interest earned
  last_interest_calculation_date DATE, -- Last date interest was calculated
  lock_period_days INTEGER, -- Optional: Funds locked for X days (0 = no lock)
  lock_until_date DATE, -- Date when funds unlock (if lock_period_days set)
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'locked', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_savings_wallets_user_id ON savings_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_wallets_wallet_id ON savings_wallets(wallet_id);
CREATE INDEX IF NOT EXISTS idx_savings_wallets_status ON savings_wallets(status);
CREATE INDEX IF NOT EXISTS idx_savings_wallets_lock_until_date ON savings_wallets(lock_until_date) WHERE lock_until_date IS NOT NULL;

-- Unique constraint: One savings wallet per user (can have multiple goals)
CREATE UNIQUE INDEX IF NOT EXISTS idx_savings_wallets_user_unique ON savings_wallets(user_id);

-- ============================================================================
-- SAVINGS GOALS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  savings_wallet_id UUID NOT NULL REFERENCES savings_wallets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL, -- Goal name (e.g., "School Fees", "Emergency Fund")
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  target_date DATE, -- Optional: Target date to reach goal
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'cancelled'
  completed_at TIMESTAMP WITH TIME ZONE,
  auto_transfer_enabled BOOLEAN DEFAULT FALSE, -- Auto-transfer from main wallet
  auto_transfer_amount DECIMAL(15,2), -- Amount to transfer automatically
  auto_transfer_frequency VARCHAR(50), -- 'on_voucher_receipt', 'daily', 'weekly', 'monthly'
  round_up_enabled BOOLEAN DEFAULT FALSE, -- Round-up transactions to savings
  round_up_multiple DECIMAL(10,2) DEFAULT 10, -- Round to nearest N$10, N$50, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_savings_wallet_id ON savings_goals(savings_wallet_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_status ON savings_goals(status);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date) WHERE target_date IS NOT NULL;

-- ============================================================================
-- SAVINGS TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_wallet_id UUID NOT NULL REFERENCES savings_wallets(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'interest', 'transfer_to_goal', 'transfer_from_goal'
  amount DECIMAL(15,2) NOT NULL,
  balance_after DECIMAL(15,2) NOT NULL, -- Balance after transaction
  goal_id UUID REFERENCES savings_goals(id) ON DELETE SET NULL, -- If related to a goal
  source_transaction_id UUID, -- Link to main transaction (if from main wallet transfer)
  description TEXT,
  metadata JSONB DEFAULT '{}', -- Additional context:
  --   - interest_calculation_period: Period for which interest was calculated
  --   - round_up_amount: Original transaction amount that was rounded up
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_savings_transactions_savings_wallet_id ON savings_transactions(savings_wallet_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal_id ON savings_transactions(goal_id);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_transaction_type ON savings_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_created_at ON savings_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_savings_transactions_source_transaction_id ON savings_transactions(source_transaction_id);

-- ============================================================================
-- INTEREST CALCULATION LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_interest_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  savings_wallet_id UUID NOT NULL REFERENCES savings_wallets(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  balance_at_calculation DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  interest_earned DECIMAL(15,2) NOT NULL,
  days_in_period INTEGER NOT NULL, -- Days since last calculation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_savings_interest_calculations_savings_wallet_id ON savings_interest_calculations(savings_wallet_id);
CREATE INDEX IF NOT EXISTS idx_savings_interest_calculations_calculation_date ON savings_interest_calculations(calculation_date);

-- Unique constraint: One calculation per wallet per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_savings_interest_calculations_unique 
  ON savings_interest_calculations(savings_wallet_id, calculation_date);

-- ============================================================================
-- SAVINGS ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS savings_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_savings_wallets INTEGER DEFAULT 0,
  total_savings_balance DECIMAL(15,2) DEFAULT 0,
  average_savings_balance DECIMAL(15,2) DEFAULT 0,
  total_interest_earned DECIMAL(15,2) DEFAULT 0,
  active_savings_goals INTEGER DEFAULT 0,
  completed_savings_goals INTEGER DEFAULT 0,
  total_deposits DECIMAL(15,2) DEFAULT 0,
  total_withdrawals DECIMAL(15,2) DEFAULT 0,
  adoption_rate DECIMAL(5,2) DEFAULT 0, -- % of eligible users with savings wallets
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_savings_analytics_date ON savings_analytics(date);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE savings_wallets IS 'Interest-bearing savings wallets separate from main wallet';
COMMENT ON COLUMN savings_wallets.interest_rate IS 'Annual interest rate (e.g., 2.5 for 2.5%)';
COMMENT ON COLUMN savings_wallets.lock_period_days IS 'Optional: Funds locked for X days (0 = no lock, immediate access)';
COMMENT ON TABLE savings_goals IS 'Savings goals with progress tracking and auto-transfer rules';
COMMENT ON COLUMN savings_goals.auto_transfer_frequency IS 'Frequency: on_voucher_receipt, daily, weekly, monthly';
COMMENT ON COLUMN savings_goals.round_up_multiple IS 'Round transactions to nearest N$10, N$50, etc.';
COMMENT ON TABLE savings_transactions IS 'All transactions on savings wallets (deposits, withdrawals, interest, goal transfers)';
COMMENT ON TABLE savings_interest_calculations IS 'Daily interest calculation log for audit and analytics';
COMMENT ON TABLE savings_analytics IS 'Daily analytics on savings wallet adoption and usage';

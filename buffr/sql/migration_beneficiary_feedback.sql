/**
 * Migration: Beneficiary Feedback System
 * 
 * Location: sql/migration_beneficiary_feedback.sql
 * Purpose: Collect structured feedback from beneficiaries to inform product decisions
 * 
 * Features:
 * - Post-transaction feedback
 * - Periodic surveys
 * - Feature interest surveys
 * - Link feedback to analytics for correlation
 */

-- ============================================================================
-- BENEFICIARY FEEDBACK TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS beneficiary_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  feedback_type VARCHAR(50) NOT NULL, -- 'post_transaction', 'periodic', 'feature_interest', 'general'
  transaction_id UUID, -- Link to transaction (if post-transaction feedback)
  satisfaction_score INTEGER, -- 1-5 stars
  feedback_text TEXT, -- Optional text feedback
  channel VARCHAR(50) NOT NULL, -- 'app', 'ussd', 'sms', 'web'
  metadata JSONB DEFAULT '{}', -- Additional context:
  --   - transaction_type: Type of transaction that triggered feedback
  --   - feature_used: Feature being rated
  --   - pain_points: Array of pain points identified
  --   - suggestions: User suggestions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_beneficiary_feedback_user_id ON beneficiary_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_feedback_feedback_type ON beneficiary_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_beneficiary_feedback_transaction_id ON beneficiary_feedback(transaction_id);
CREATE INDEX IF NOT EXISTS idx_beneficiary_feedback_satisfaction_score ON beneficiary_feedback(satisfaction_score);
CREATE INDEX IF NOT EXISTS idx_beneficiary_feedback_created_at ON beneficiary_feedback(created_at);

-- ============================================================================
-- FEATURE INTEREST SURVEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_interest_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  survey_type VARCHAR(50) NOT NULL, -- 'savings', 'credit', 'recurring_payments', 'emergency_funds', 'family_management'
  feature_name VARCHAR(100) NOT NULL, -- 'Savings Account', 'Micro-Loans', etc.
  interest_level VARCHAR(50), -- 'very_interested', 'interested', 'neutral', 'not_interested'
  would_use BOOLEAN, -- Yes/No answer
  concerns TEXT, -- User concerns about the feature
  suggestions TEXT, -- User suggestions for the feature
  channel VARCHAR(50) NOT NULL, -- 'app', 'ussd', 'sms'
  metadata JSONB DEFAULT '{}', -- Additional context:
  --   - user_persona: User spending persona (from analytics)
  --   - transaction_patterns: Key transaction patterns
  --   - wallet_balance: Current wallet balance
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_feature_interest_surveys_user_id ON feature_interest_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_interest_surveys_survey_type ON feature_interest_surveys(survey_type);
CREATE INDEX IF NOT EXISTS idx_feature_interest_surveys_feature_name ON feature_interest_surveys(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_interest_surveys_would_use ON feature_interest_surveys(would_use);
CREATE INDEX IF NOT EXISTS idx_feature_interest_surveys_created_at ON feature_interest_surveys(created_at);

-- Unique constraint: One survey per feature per user (can update)
CREATE UNIQUE INDEX IF NOT EXISTS idx_feature_interest_surveys_unique 
  ON feature_interest_surveys(user_id, feature_name);

-- ============================================================================
-- PERIODIC SURVEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS periodic_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  survey_period VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'annual'
  period_start DATE NOT NULL, -- Start of survey period
  period_end DATE NOT NULL, -- End of survey period
  questions JSONB NOT NULL, -- Survey questions and answers:
  --   [
  --     {
  --       "question": "How satisfied are you with Buffr?",
  --       "answer": "very_satisfied",
  --       "type": "multiple_choice"
  --     },
  --     {
  --       "question": "What's your biggest challenge?",
  --       "answer": "Finding agents with cash",
  --       "type": "text"
  --     }
  --   ]
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  incentive_credited BOOLEAN DEFAULT FALSE, -- Whether incentive (N$5-10) was credited
  incentive_amount DECIMAL(10,2), -- Amount credited as incentive
  channel VARCHAR(50) NOT NULL, -- 'sms', 'ussd', 'app'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_periodic_surveys_user_id ON periodic_surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_periodic_surveys_survey_period ON periodic_surveys(survey_period);
CREATE INDEX IF NOT EXISTS idx_periodic_surveys_period_start ON periodic_surveys(period_start);
CREATE INDEX IF NOT EXISTS idx_periodic_surveys_completed ON periodic_surveys(completed);
CREATE INDEX IF NOT EXISTS idx_periodic_surveys_created_at ON periodic_surveys(created_at);

-- Unique constraint: One survey per period per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_periodic_surveys_unique 
  ON periodic_surveys(user_id, survey_period, period_start);

-- ============================================================================
-- FEEDBACK ANALYTICS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  total_feedback_received INTEGER DEFAULT 0,
  average_satisfaction_score DECIMAL(3,2) DEFAULT 0, -- Average of 1-5 scores
  feedback_response_rate DECIMAL(5,2) DEFAULT 0, -- Percentage of users who provided feedback
  feature_interest_savings DECIMAL(5,2) DEFAULT 0, -- % interested in savings
  feature_interest_credit DECIMAL(5,2) DEFAULT 0, -- % interested in credit
  feature_interest_recurring DECIMAL(5,2) DEFAULT 0, -- % interested in recurring payments
  top_pain_points JSONB DEFAULT '[]', -- Array of most common pain points
  top_suggestions JSONB DEFAULT '[]', -- Array of most common suggestions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_feedback_analytics_date ON feedback_analytics(date);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE beneficiary_feedback IS 'Structured feedback from beneficiaries to inform product decisions';
COMMENT ON COLUMN beneficiary_feedback.feedback_type IS 'Type of feedback: post_transaction, periodic, feature_interest, general';
COMMENT ON COLUMN beneficiary_feedback.satisfaction_score IS '1-5 star rating';
COMMENT ON TABLE feature_interest_surveys IS 'Surveys to gauge interest in new financial instruments';
COMMENT ON COLUMN feature_interest_surveys.would_use IS 'Yes/No answer to "Would you use this feature?"';
COMMENT ON TABLE periodic_surveys IS 'Monthly/quarterly surveys to collect ongoing feedback';
COMMENT ON COLUMN periodic_surveys.incentive_credited IS 'Whether small wallet credit (N$5-10) was given as incentive';
COMMENT ON TABLE feedback_analytics IS 'Daily analytics on feedback collection and feature interest';

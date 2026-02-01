-- ============================================================================
-- BUFFR AI - ML & AGENT EXTENSIONS TO PRIME SCHEMA
-- Extends the base schema with ML model storage, agent operations, and Buffr integration
-- ============================================================================

-- ============================================================================
-- SECTION 1: USERS & MERCHANT DATA
-- ============================================================================

-- Users table (Buffr Payment Companion integration)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE NOT NULL,  -- ID from Buffr Payment Companion
    phone_number TEXT,
    email TEXT,
    full_name TEXT,
    date_of_birth DATE,
    kyc_level INTEGER DEFAULT 0,  -- 0=unverified, 1=basic, 2=full
    income_level TEXT,
    occupation TEXT,
    location_city TEXT,
    location_country TEXT DEFAULT 'Namibia',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_external_id ON users (external_id);
CREATE INDEX idx_users_kyc_level ON users (kyc_level);

-- Merchants table (for Buffr Lend integration)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE NOT NULL,  -- ID from Buffr Payment Companion
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    business_type TEXT,
    merchant_category_code TEXT,  -- MCC
    business_registration_number TEXT,
    business_age_months INTEGER,
    average_monthly_revenue DECIMAL(15, 2),
    location_city TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_merchants_external_id ON merchants (external_id);
CREATE INDEX idx_merchants_user_id ON merchants (user_id);
CREATE INDEX idx_merchants_mcc ON merchants (merchant_category_code);

-- ============================================================================
-- SECTION 2: TRANSACTION DATA (for ML training & real-time processing)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT UNIQUE NOT NULL,  -- ID from Buffr Pay
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'NAD',
    transaction_type TEXT NOT NULL,  -- payment, transfer, withdrawal, deposit
    status TEXT NOT NULL,  -- pending, completed, failed, cancelled
    merchant_name TEXT,
    merchant_category TEXT,
    merchant_mcc TEXT,
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    device_fingerprint TEXT,
    card_present BOOLEAN DEFAULT FALSE,
    transaction_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_transactions_user_id ON transactions (user_id, transaction_time DESC);
CREATE INDEX idx_transactions_merchant_id ON transactions (merchant_id);
CREATE INDEX idx_transactions_time ON transactions (transaction_time DESC);
CREATE INDEX idx_transactions_status ON transactions (status);
CREATE INDEX idx_transactions_amount ON transactions (amount);

-- ============================================================================
-- SECTION 3: FRAUD DETECTION (Guardian Agent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fraud_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- ML Model Results
    fraud_probability DECIMAL(5, 4) NOT NULL,  -- 0.0000 to 1.0000
    is_fraud BOOLEAN NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    -- Model Breakdown
    logistic_score DECIMAL(5, 4),
    neural_network_score DECIMAL(5, 4),
    random_forest_score DECIMAL(5, 4),
    gmm_anomaly_score DECIMAL(5, 4),

    -- Results
    recommended_action TEXT,  -- APPROVE, BLOCK_TRANSACTION, REQUEST_VERIFICATION
    confidence DECIMAL(5, 4) DEFAULT 0.95,

    -- Audit Trail
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    model_version TEXT,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_fraud_checks_transaction_id ON fraud_checks (transaction_id);
CREATE INDEX idx_fraud_checks_user_id ON fraud_checks (user_id);
CREATE INDEX idx_fraud_checks_is_fraud ON fraud_checks (is_fraud, checked_at DESC);
CREATE INDEX idx_fraud_checks_risk_level ON fraud_checks (risk_level, checked_at DESC);

-- ============================================================================
-- SECTION 4: CREDIT SCORING & LENDING (Guardian Agent + Buffr Lend)
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,

    -- Credit Scoring Results
    credit_score INTEGER NOT NULL CHECK (credit_score >= 300 AND credit_score <= 850),
    default_probability DECIMAL(5, 4) NOT NULL,
    credit_tier TEXT NOT NULL CHECK (credit_tier IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DECLINED')),

    -- Loan Details
    max_loan_amount DECIMAL(15, 2) NOT NULL,
    recommended_interest_rate DECIMAL(5, 4) NOT NULL,

    -- Model Breakdown
    logistic_score DECIMAL(5, 4),
    random_forest_score DECIMAL(5, 4),
    gradient_boosting_score DECIMAL(5, 4),

    -- Assessment Details
    assessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    model_version TEXT,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_credit_assessments_merchant_id ON credit_assessments (merchant_id, assessed_at DESC);
CREATE INDEX idx_credit_assessments_credit_score ON credit_assessments (credit_score);
CREATE INDEX idx_credit_assessments_tier ON credit_assessments (credit_tier);

-- Loan Applications
CREATE TABLE IF NOT EXISTS loan_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
    credit_assessment_id UUID REFERENCES credit_assessments(id) ON DELETE SET NULL,

    loan_amount_requested DECIMAL(15, 2) NOT NULL,
    loan_amount_approved DECIMAL(15, 2),
    interest_rate DECIMAL(5, 4),
    term_months INTEGER,

    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'disbursed', 'repaid', 'defaulted')),

    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    disbursed_at TIMESTAMP WITH TIME ZONE,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_loan_applications_merchant_id ON loan_applications (merchant_id, applied_at DESC);
CREATE INDEX idx_loan_applications_status ON loan_applications (status);

-- ============================================================================
-- SECTION 5: SPENDING ANALYSIS & TRANSACTION CLASSIFICATION (Transaction Analyst)
-- ============================================================================

-- Transaction Categories (ML classification results)
CREATE TABLE IF NOT EXISTS transaction_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,

    category TEXT NOT NULL,  -- Food & Dining, Groceries, Transport, etc.
    subcategory TEXT,
    confidence DECIMAL(5, 4) NOT NULL,

    -- Alternate categories (top-k predictions)
    alternate_categories JSONB DEFAULT '[]',

    classified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    model_version TEXT,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_transaction_categories_transaction_id ON transaction_categories (transaction_id);
CREATE INDEX idx_transaction_categories_category ON transaction_categories (category);

-- User Spending Features (for clustering & analysis)
CREATE TABLE IF NOT EXISTS user_spending_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Time Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Spending Metrics
    total_spending DECIMAL(15, 2),
    avg_transaction_amount DECIMAL(15, 2),
    transaction_count INTEGER,
    spending_volatility DECIMAL(15, 2),  -- standard deviation

    -- Category Breakdown (JSONB for flexibility)
    spending_by_category JSONB DEFAULT '{}',

    -- Behavioral Features
    weekend_spending_ratio DECIMAL(5, 4),
    evening_spending_ratio DECIMAL(5, 4),
    cash_withdrawal_frequency INTEGER,
    unique_merchants_count INTEGER,

    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_user_spending_features_user_id ON user_spending_features (user_id, period_end DESC);
CREATE INDEX idx_user_spending_features_period ON user_spending_features (period_start, period_end);

-- Spending Personas (clustering results)
CREATE TABLE IF NOT EXISTS spending_personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Clustering Results
    primary_persona TEXT NOT NULL,  -- Conservative Saver, Big Spender, etc.
    primary_confidence DECIMAL(5, 4),

    -- Soft Clustering (GMM probabilities)
    persona_distribution JSONB DEFAULT '{}',

    -- Cluster Statistics
    cluster_id INTEGER,
    cluster_size INTEGER,

    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    model_version TEXT,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_spending_personas_user_id ON spending_personas (user_id, assigned_at DESC);
CREATE INDEX idx_spending_personas_primary ON spending_personas (primary_persona);

-- Spending Analysis Results
CREATE TABLE IF NOT EXISTS spending_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    -- Analysis Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Results
    total_spending DECIMAL(15, 2),
    spending_trend TEXT,  -- increasing, stable, decreasing
    is_unusual_spending BOOLEAN,

    -- Category Analysis
    top_categories JSONB DEFAULT '[]',
    spending_by_category JSONB DEFAULT '{}',

    -- Insights & Recommendations
    insights JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',

    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_spending_analyses_user_id ON spending_analyses (user_id, analyzed_at DESC);
CREATE INDEX idx_spending_analyses_session_id ON spending_analyses (session_id);

-- ============================================================================
-- SECTION 6: USER PROFILES & SEGMENTATION (Mentor Agent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Demographic Features
    age_group TEXT,
    income_level TEXT,
    occupation_category TEXT,
    family_size INTEGER,
    location_type TEXT,  -- urban, rural

    -- Behavioral Features
    app_usage_frequency DECIMAL(5, 2),  -- logins per week
    feature_usage_diversity DECIMAL(5, 4),  -- % of features used
    transaction_frequency DECIMAL(5, 2),
    savings_rate DECIMAL(5, 4),

    -- Financial Literacy Features
    quiz_average_score DECIMAL(5, 2),
    modules_completed INTEGER,
    time_spent_learning INTEGER,  -- minutes
    question_accuracy_rate DECIMAL(5, 4),
    learning_consistency INTEGER,  -- days active

    -- Engagement Features
    gamification_score INTEGER,
    badge_count INTEGER,
    challenge_completion_rate DECIMAL(5, 4),

    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles (user_id);

-- Learning Progress (Mentor Agent)
CREATE TABLE IF NOT EXISTS learning_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    module_id TEXT NOT NULL,
    module_name TEXT,
    module_category TEXT,  -- budgeting, investing, debt_management, etc.

    status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percentage INTEGER CHECK (progress_percentage >= 0 AND progress_percentage <= 100),

    quiz_score DECIMAL(5, 2),
    time_spent INTEGER,  -- minutes

    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_learning_progress_user_id ON learning_progress (user_id, last_accessed_at DESC);
CREATE INDEX idx_learning_progress_status ON learning_progress (status);
CREATE INDEX idx_learning_progress_module ON learning_progress (module_id);

-- Learning Recommendations (Mentor Agent)
CREATE TABLE IF NOT EXISTS learning_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,

    primary_segment TEXT,
    segment_distribution JSONB DEFAULT '{}',

    recommended_modules JSONB DEFAULT '[]',
    weak_areas JSONB DEFAULT '[]',

    reasoning TEXT,

    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_learning_recommendations_user_id ON learning_recommendations (user_id, generated_at DESC);

-- ============================================================================
-- SECTION 7: ML MODEL MANAGEMENT
-- ============================================================================

-- ML Models Registry
CREATE TABLE IF NOT EXISTS ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name TEXT NOT NULL,  -- fraud_detection, credit_scoring, etc.
    model_type TEXT NOT NULL,  -- logistic_regression, random_forest, neural_network, etc.
    version TEXT NOT NULL,

    -- Model Metadata
    algorithm TEXT,
    hyperparameters JSONB DEFAULT '{}',
    feature_names JSONB DEFAULT '[]',

    -- Model Files
    model_path TEXT,  -- S3/local path to serialized model
    model_size_mb DECIMAL(10, 2),

    -- Performance Metrics
    training_accuracy DECIMAL(5, 4),
    validation_accuracy DECIMAL(5, 4),
    test_accuracy DECIMAL(5, 4),

    -- Training Info
    training_samples INTEGER,
    training_duration_seconds INTEGER,
    trained_at TIMESTAMP WITH TIME ZONE,
    trained_by TEXT,

    -- Status
    status TEXT NOT NULL CHECK (status IN ('training', 'active', 'archived', 'failed')),
    is_production BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_ml_models_name_version ON ml_models (model_name, version);
CREATE INDEX idx_ml_models_status ON ml_models (status);
CREATE INDEX idx_ml_models_is_production ON ml_models (is_production, model_name);

-- Model Performance Tracking
CREATE TABLE IF NOT EXISTS model_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,

    -- Time Period
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Performance Metrics
    prediction_count INTEGER,
    accuracy DECIMAL(5, 4),
    precision_score DECIMAL(5, 4),
    recall_score DECIMAL(5, 4),
    f1_score DECIMAL(5, 4),
    roc_auc_score DECIMAL(5, 4),

    -- Latency
    avg_inference_time_ms DECIMAL(10, 2),
    p95_inference_time_ms DECIMAL(10, 2),
    p99_inference_time_ms DECIMAL(10, 2),

    -- Resource Usage
    avg_memory_mb DECIMAL(10, 2),
    peak_memory_mb DECIMAL(10, 2),

    computed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_model_performance_model_id ON model_performance (model_id, period_end DESC);

-- Prediction History (for monitoring & debugging)
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id UUID REFERENCES ml_models(id) ON DELETE SET NULL,

    prediction_type TEXT NOT NULL,  -- fraud, credit, category, etc.
    input_features JSONB NOT NULL,
    prediction_result JSONB NOT NULL,

    confidence DECIMAL(5, 4),
    inference_time_ms DECIMAL(10, 2),

    -- Reference to source entity
    reference_type TEXT,  -- transaction, merchant, user
    reference_id UUID,

    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_predictions_model_id ON predictions (model_id, predicted_at DESC);
CREATE INDEX idx_predictions_type ON predictions (prediction_type, predicted_at DESC);
CREATE INDEX idx_predictions_reference ON predictions (reference_type, reference_id);

-- ============================================================================
-- SECTION 8: COMPLIANCE & AUDIT (Guardian Agent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,

    compliance_type TEXT NOT NULL,  -- ETA_2019, AML_CFT, PSD, NAMFISA

    is_compliant BOOLEAN NOT NULL,
    compliance_score DECIMAL(5, 4),

    violations JSONB DEFAULT '[]',
    required_actions JSONB DEFAULT '[]',

    risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),

    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_compliance_checks_transaction_id ON compliance_checks (transaction_id);
CREATE INDEX idx_compliance_checks_type ON compliance_checks (compliance_type, checked_at DESC);
CREATE INDEX idx_compliance_checks_is_compliant ON compliance_checks (is_compliant);

-- ============================================================================
-- SECTION 9: HELPFUL VIEWS
-- ============================================================================

-- User Transaction Summary
CREATE OR REPLACE VIEW user_transaction_summary AS
SELECT
    u.id AS user_id,
    u.external_id,
    COUNT(t.id) AS total_transactions,
    SUM(t.amount) AS total_spent,
    AVG(t.amount) AS avg_transaction_amount,
    MIN(t.transaction_time) AS first_transaction,
    MAX(t.transaction_time) AS last_transaction,
    COUNT(DISTINCT t.merchant_id) AS unique_merchants
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id AND t.status = 'completed'
GROUP BY u.id, u.external_id;

-- Merchant Loan Summary
CREATE OR REPLACE VIEW merchant_loan_summary AS
SELECT
    m.id AS merchant_id,
    m.external_id,
    m.business_name,
    ca.credit_score AS latest_credit_score,
    ca.credit_tier AS latest_credit_tier,
    COUNT(la.id) AS total_applications,
    SUM(CASE WHEN la.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
    SUM(CASE WHEN la.status = 'declined' THEN 1 ELSE 0 END) AS declined_count,
    SUM(CASE WHEN la.status = 'defaulted' THEN 1 ELSE 0 END) AS defaulted_count,
    SUM(la.loan_amount_approved) AS total_approved_amount
FROM merchants m
LEFT JOIN credit_assessments ca ON m.id = ca.merchant_id
    AND ca.assessed_at = (SELECT MAX(assessed_at) FROM credit_assessments WHERE merchant_id = m.id)
LEFT JOIN loan_applications la ON m.id = la.merchant_id
GROUP BY m.id, m.external_id, m.business_name, ca.credit_score, ca.credit_tier;

-- Fraud Detection Summary
CREATE OR REPLACE VIEW fraud_detection_summary AS
SELECT
    DATE(checked_at) AS check_date,
    COUNT(*) AS total_checks,
    SUM(CASE WHEN is_fraud THEN 1 ELSE 0 END) AS fraud_detected,
    SUM(CASE WHEN risk_level = 'HIGH' OR risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS high_risk_count,
    AVG(fraud_probability) AS avg_fraud_probability,
    AVG(confidence) AS avg_confidence
FROM fraud_checks
GROUP BY DATE(checked_at)
ORDER BY check_date DESC;

-- Model Performance Dashboard
CREATE OR REPLACE VIEW model_performance_dashboard AS
SELECT
    m.model_name,
    m.model_type,
    m.version,
    m.is_production,
    mp.accuracy AS latest_accuracy,
    mp.f1_score AS latest_f1,
    mp.avg_inference_time_ms,
    mp.prediction_count AS predictions_last_period,
    mp.period_start,
    mp.period_end
FROM ml_models m
LEFT JOIN model_performance mp ON m.id = mp.model_id
    AND mp.period_end = (SELECT MAX(period_end) FROM model_performance WHERE model_id = m.id)
WHERE m.status = 'active'
ORDER BY m.model_name, m.version DESC;

-- ============================================================================
-- SECTION 10: TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 11: HELPER FUNCTIONS
-- ============================================================================

-- Get latest credit score for merchant
CREATE OR REPLACE FUNCTION get_latest_credit_score(merchant_uuid UUID)
RETURNS TABLE (
    credit_score INTEGER,
    credit_tier TEXT,
    default_probability DECIMAL,
    assessed_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ca.credit_score,
        ca.credit_tier,
        ca.default_probability,
        ca.assessed_at
    FROM credit_assessments ca
    WHERE ca.merchant_id = merchant_uuid
    ORDER BY ca.assessed_at DESC
    LIMIT 1;
END;
$$;

-- Get user spending summary for period
CREATE OR REPLACE FUNCTION get_user_spending_summary(
    user_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE (
    total_spending DECIMAL,
    transaction_count BIGINT,
    avg_amount DECIMAL,
    unique_merchants BIGINT,
    top_category TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        SUM(t.amount)::DECIMAL AS total_spending,
        COUNT(t.id) AS transaction_count,
        AVG(t.amount)::DECIMAL AS avg_amount,
        COUNT(DISTINCT t.merchant_id) AS unique_merchants,
        (
            SELECT tc.category
            FROM transaction_categories tc
            JOIN transactions t2 ON tc.transaction_id = t2.id
            WHERE t2.user_id = user_uuid
                AND t2.transaction_time BETWEEN start_date AND end_date
            GROUP BY tc.category
            ORDER BY COUNT(*) DESC
            LIMIT 1
        ) AS top_category
    FROM transactions t
    WHERE t.user_id = user_uuid
        AND t.transaction_time BETWEEN start_date AND end_date
        AND t.status = 'completed';
END;
$$;

-- Check if retraining is needed based on performance degradation
CREATE OR REPLACE FUNCTION check_model_retraining_needed(
    model_uuid UUID,
    accuracy_threshold DECIMAL DEFAULT 0.05
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    baseline_accuracy DECIMAL;
    current_accuracy DECIMAL;
    degradation DECIMAL;
BEGIN
    -- Get baseline (training) accuracy
    SELECT m.test_accuracy INTO baseline_accuracy
    FROM ml_models m
    WHERE m.id = model_uuid;

    -- Get most recent performance
    SELECT mp.accuracy INTO current_accuracy
    FROM model_performance mp
    WHERE mp.model_id = model_uuid
    ORDER BY mp.period_end DESC
    LIMIT 1;

    -- Calculate degradation
    IF baseline_accuracy IS NOT NULL AND current_accuracy IS NOT NULL THEN
        degradation := baseline_accuracy - current_accuracy;
        RETURN degradation > accuracy_threshold;
    END IF;

    RETURN FALSE;
END;
$$;

-- ============================================================================
-- SCHEMA COMPLETE
-- All tables, indexes, views, and functions created
-- Ready for ML model implementation and agent operations
-- ============================================================================

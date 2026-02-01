# 🚀 Buffr ML Models - Complete Training Guide

**Complete guide for training all Buffr machine learning models with best practices from statistical learning and ML theory.**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Models Overview](#models-overview)
4. [Training Workflow](#training-workflow)
5. [Statistical Learning Foundations](#statistical-learning-foundations)
6. [Model Selection & Evaluation](#model-selection--evaluation)
7. [Feature Engineering](#feature-engineering)
8. [Advanced Training](#advanced-training)
9. [Troubleshooting](#troubleshooting)

---

## 📊 Overview

Buffr uses **4 production ML model ensembles** for critical business functions:

| Model Ensemble | Purpose | Models | Key Metrics |
|----------------|---------|--------|-------------|
| **Fraud Detection** | Real-time transaction fraud detection | 4 models (Logistic, NN, RF, GMM) | Precision >95%, Recall >90% |
| **Credit Scoring** | Merchant credit risk assessment | 4 models (Logistic, DT, RF, GB) | ROC-AUC >0.75, Gini >0.50 |
| **Spending Analysis** | User spending pattern analysis | 3 models (K-Means, GMM, Hierarchical) | Silhouette score, cluster stability |
| **Transaction Classifier** | Automatic transaction categorization | 4 models (DT, RF, Bagging, AdaBoost) | Accuracy per category |

**Total: 15 individual models across 4 ensembles**

---

## 🚀 Quick Start

### Option 1: Automated Pipeline (Recommended)

```bash
cd buffr/buffr_ai

# Complete pipeline: validation → data prep → training → evaluation
python train_all_models.py
```

This single command:
1. ✅ Validates environment and dependencies
2. ✅ Prepares training data (synthetic or from database)
3. ✅ Trains all 4 model ensembles
4. ✅ Evaluates model performance
5. ✅ Generates comprehensive report

### Option 2: Step-by-Step

```bash
# Step 1: Validate setup
python validate_setup.py

# Step 2: Prepare data
python prepare_training_data.py --generate-synthetic

# Step 3: Train all models
python train_models.py --all

# Step 4: Evaluate models
python evaluate_models.py --all
```

### Option 3: Train Specific Models

```bash
# Train only fraud detection and credit scoring
python train_all_models.py --models fraud credit

# Train only spending analysis
python train_all_models.py --models spending
```

---

## 🎯 Models Overview

### 1. Fraud Detection Ensemble

**Purpose:** Real-time transaction fraud detection with <10ms inference time

**Models:**
- **Logistic Regression** - Baseline, explainable, regulatory compliant
- **Neural Network (PyTorch)** - 64-32-16-1 architecture, captures complex patterns
- **Random Forest** - Robust ensemble, handles non-linear relationships
- **GMM Anomaly Detection** - Unsupervised, detects novel fraud patterns

**Features (20 total):**
```
Transaction Features:
- amount_normalized: Normalized transaction amount
- amount_log: Log-transformed amount (handles skewness)
- amount_deviation_from_avg: Deviation from user's average
- round_number_flag: Binary flag for round numbers

Time Features:
- hour_sin, hour_cos: Cyclical encoding of hour (0-23)
- day_of_week: Day of week (0-6)
- is_weekend: Binary weekend flag
- is_unusual_hour: Binary flag for unusual transaction times

Merchant Features:
- merchant_category_encoded: Encoded merchant category
- merchant_fraud_rate: Historical fraud rate for merchant
- merchant_risk_score: Risk score based on merchant profile

Location Features:
- distance_from_home_km: Distance from user's home location
- is_foreign_transaction: Binary flag for foreign transactions
- velocity_score: Transaction velocity (transactions per time unit)

User Behavior Features:
- transactions_last_hour: Count of transactions in last hour
- transactions_last_day: Count of transactions in last day
- behavior_deviation_score: Deviation from normal behavior patterns

Device Features:
- device_fingerprint_match: Binary flag for device match
- card_not_present: Binary flag for CNP transactions
- device_change_flag: Binary flag for device changes
```

**Target Performance:**
- **Precision:** >95% (minimize false positives)
- **Recall:** >90% (catch most fraud)
- **F1-Score:** >92% (balanced performance)
- **Inference Time:** <10ms (real-time requirement)

**Training Command:**
```bash
python train_models.py --fraud --data-dir ./data --model-dir ./models
```

---

### 2. Credit Scoring Ensemble

**Purpose:** Merchant credit risk assessment for Buffr Lend

**Models:**
- **Logistic Regression** - Regulatory compliant, explainable, baseline
- **Decision Trees** - Rule-based, transparent, interpretable
- **Random Forest** - Production workhorse, robust, handles non-linearity
- **Gradient Boosting** - Highest accuracy, sequential learning

**Features (30 total):**
```
Revenue Features (6):
- monthly_avg_revenue: Average monthly revenue
- monthly_transaction_count: Transaction volume
- revenue_volatility: Standard deviation of revenue
- revenue_trend_3month: 3-month revenue trend (slope)
- weekend_weekday_ratio: Weekend vs weekday transaction ratio
- peak_transaction_consistency: Consistency of peak transactions

Merchant Profile Features (6):
- business_age_months: Age of business in months
- merchant_category_risk: Risk score by category
- avg_transaction_amount: Average transaction size
- unique_customer_count_monthly: Monthly unique customers
- customer_retention_rate: Customer retention percentage
- transaction_decline_rate: Failed transaction rate

Alternative Data Features (6):
- has_social_media_presence: Binary flag
- business_registration_verified: Binary flag
- location_stability_score: Location stability metric
- operating_hours_consistency: Operating hours consistency
- seasonal_pattern_strength: Seasonal pattern strength
- cross_border_ratio: Cross-border transaction ratio

Loan History Features (6):
- has_previous_loans: Binary flag
- previous_loan_repayment_rate: Historical repayment rate
- max_loan_handled: Maximum loan amount handled
- default_history_flag: Binary default flag
- debt_to_revenue_ratio: Debt-to-revenue ratio
- current_outstanding_loans: Current loan count

Financial Health Features (6):
- revenue_growth_rate: Revenue growth percentage
- transaction_growth_rate: Transaction growth percentage
- merchant_tenure_score: Tenure-based score
- payment_consistency_score: Payment consistency metric
```

**Target Performance:**
- **ROC-AUC:** >0.75 (discrimination ability)
- **Gini Coefficient:** >0.50 (separation power)
- **Brier Score:** <0.15 (calibration quality)
- **Default Rate:** <5% for approved loans (business requirement)

**Training Command:**
```bash
python train_models.py --credit --data-dir ./data --model-dir ./models
```

---

### 3. Spending Analysis Engine

**Purpose:** User spending pattern analysis and segmentation

**Models:**
- **K-Means Clustering** - User personas, hard clustering
- **GMM (Gaussian Mixture Model)** - Soft clustering, probabilistic assignments
- **Hierarchical Clustering** - Category relationships, dendrogram visualization

**Features (10 total):**
```
Spending Features:
- monthly_avg_spending: Average monthly spending
- spending_volatility: Spending volatility (std dev)
- top_category_ratio: Ratio of spending in top category

Pattern Features:
- weekend_ratio: Weekend transaction ratio
- evening_ratio: Evening transaction ratio
- cash_withdrawal_frequency: Cash withdrawal frequency

Behavior Features:
- avg_transaction_amount: Average transaction amount
- merchant_diversity: Number of unique merchants

Financial Features:
- savings_rate: Savings rate percentage
- bill_payment_regularity: Bill payment regularity score
```

**Target Performance:**
- **Silhouette Score:** >0.5 (good cluster separation)
- **Cluster Stability:** Consistent clusters across runs
- **Persona Distribution:** Balanced persona distribution

**Training Command:**
```bash
python train_models.py --spending --data-dir ./data --model-dir ./models
```

---

### 4. Transaction Classifier

**Purpose:** Automatic transaction categorization

**Models:**
- **Decision Trees** - max_depth=15, interpretable rules
- **Random Forest** - 100 estimators, robust ensemble
- **Bagging Classifier** - 50 estimators, variance reduction
- **AdaBoost** - 50 estimators, adaptive boosting

**Features:**
- Amount, payment method, transaction type
- Time features (hour, day, month)
- Merchant information (name, MCC, category)

**Categories:**
- GROCERIES, DINING, FUEL, HEALTH, ELECTRONICS
- RETAIL, ONLINE, FOOD, ENTERTAINMENT, EDUCATION

**Training Command:**
```bash
python train_models.py --classification --data-dir ./data --model-dir ./models
```

---

## 📈 Training Workflow

### Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TRAINING PIPELINE                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────┐
        │  1. Environment Validation         │
        │     - Check dependencies            │
        │     - Verify model imports          │
        │     - Validate directories          │
        └───────────────┬─────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  2. Data Preparation               │
        │     - Generate/export data         │
        │     - Feature engineering           │
        │     - Data validation              │
        └───────────────┬─────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  3. Model Training                 │
        │     - Fraud Detection Ensemble    │
        │     - Credit Scoring Ensemble      │
        │     - Spending Analysis Engine      │
        │     - Transaction Classifier       │
        └───────────────┬─────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  4. Model Evaluation               │
        │     - Performance metrics          │
        │     - Cross-validation             │
        │     - Confusion matrices           │
        └───────────────┬─────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────┐
        │  5. Report Generation              │
        │     - Training summary             │
        │     - Performance report            │
        │     - Model artifacts              │
        └───────────────────────────────────┘
```

### Step-by-Step Execution

#### Step 1: Environment Setup

```bash
# Navigate to training directory
cd buffr/buffr_ai

# Validate environment
python validate_setup.py

# Expected output:
# ✅ Python version: 3.8+
# ✅ Required packages installed
# ✅ Model imports working
# ✅ Directories created
```

#### Step 2: Data Preparation

**Option A: Synthetic Data (Testing/Development)**
```bash
python prepare_training_data.py --generate-synthetic

# Generates:
# - data/transactions.csv (10,000+ transactions)
# - data/credit_data.csv (5,000+ merchant records)
```

**Option B: Database Export (Production)**
```bash
# Set database URL
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Export data
python prepare_training_data.py \
    --export-transactions \
    --export-credit \
    --days-back 90 \
    --limit 50000
```

**Validate Data Quality:**
```bash
python prepare_training_data.py --validate

# Checks:
# - Missing values
# - Data distributions
# - Fraud rate (for fraud detection)
# - Date ranges
# - Unique users/merchants
```

#### Step 3: Model Training

**Train All Models:**
```bash
python train_models.py --all
```

**Train Specific Models:**
```bash
# Fraud detection only
python train_models.py --fraud

# Credit scoring only
python train_models.py --credit

# Multiple models
python train_models.py --fraud --credit --spending
```

**Training Output:**
```
models/
├── fraud_detection/
│   ├── logistic_model.pkl
│   ├── random_forest_model.pkl
│   ├── nn_model.pt
│   ├── gmm_model.pkl
│   └── scaler.pkl
├── credit_scoring/
│   ├── logistic_model.pkl
│   ├── decision_tree_model.pkl
│   ├── random_forest_model.pkl
│   ├── gradient_boosting_model.pkl
│   └── scaler.pkl
├── spending_analysis/
│   ├── kmeans_model.pkl
│   ├── gmm_model.pkl
│   ├── hierarchical_model.pkl
│   └── scaler.pkl
├── transaction_classification/
│   ├── decision_tree_model.pkl
│   ├── random_forest_model.pkl
│   ├── bagging_model.pkl
│   ├── adaboost_model.pkl
│   └── label_encoder.pkl
└── training_summary.json
```

#### Step 4: Model Evaluation

```bash
python evaluate_models.py --all

# Generates:
# - Performance metrics for each model
# - Confusion matrices
# - ROC curves (for classification)
# - Feature importance plots
# - Evaluation report
```

#### Step 5: Review Results

```bash
# View training summary
cat models/training_summary.json | jq

# View training logs
tail -100 training.log

# Check evaluation results
ls models/*/evaluation_report.json
```

---

## 📚 Statistical Learning Foundations

### Key Concepts Applied

#### 1. Bias-Variance Tradeoff

**Applied in Model Selection:**
- **Logistic Regression:** Low variance, higher bias (simple model)
- **Neural Networks:** Lower bias, higher variance (complex model)
- **Ensemble Methods:** Balance bias and variance through averaging

**Implementation:**
```python
# Regularization in Logistic Regression (reduce variance)
LogisticRegression(penalty='l2', C=0.5)  # Strong regularization

# Early stopping in Neural Networks (prevent overfitting)
# Max depth limits in Decision Trees (control complexity)
DecisionTreeClassifier(max_depth=5)  # Limit depth
```

#### 2. Cross-Validation

**Applied in Model Evaluation:**
- Train/validation/test split (80/10/10)
- K-fold cross-validation for hyperparameter tuning
- Stratified sampling for imbalanced classes

**Implementation:**
```python
from sklearn.model_selection import train_test_split, StratifiedKFold

# Stratified split for imbalanced fraud data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, stratify=y, random_state=42
)

# K-fold cross-validation
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
```

#### 3. Feature Engineering

**Applied Techniques:**
- **Log Transformation:** Handle skewness in transaction amounts
- **Cyclical Encoding:** Hour encoding (sin/cos) for time features
- **Normalization:** StandardScaler for neural networks
- **One-Hot Encoding:** Categorical variables (merchant categories)

**Implementation:**
```python
# Log transformation
amount_log = np.log1p(amount)  # log(1+x) handles zeros

# Cyclical encoding for hour
hour_sin = np.sin(2 * np.pi * hour / 24)
hour_cos = np.cos(2 * np.pi * hour / 24)

# Standardization
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

#### 4. Model Selection

**Applied Criteria:**
- **AIC/BIC:** For model complexity (not directly used, but principles applied)
- **Cross-Validation Score:** Primary selection criterion
- **Business Metrics:** Precision, Recall, ROC-AUC (business-aligned)

**Implementation:**
```python
# Model selection based on cross-validation
from sklearn.model_selection import cross_val_score

scores = cross_val_score(model, X_train, y_train, cv=5, scoring='roc_auc')
mean_score = scores.mean()
std_score = scores.std()

# Select model with best CV score
```

#### 5. Ensemble Methods

**Applied Techniques:**
- **Voting Classifier:** Combine predictions from multiple models
- **Bagging:** Random Forest (reduce variance)
- **Boosting:** Gradient Boosting (reduce bias)
- **Stacking:** Weighted ensemble predictions

**Implementation:**
```python
# Weighted ensemble voting
ensemble_weights = {
    'logistic': 0.25,
    'neural_network': 0.30,
    'random_forest': 0.30,
    'gmm': 0.15
}

# Weighted prediction
prediction = sum(weight * model.predict_proba(X) 
                for model, weight in ensemble_weights.items())
```

---

## 🎯 Model Selection & Evaluation

### Evaluation Metrics by Model Type

#### Classification Models (Fraud, Credit, Classification)

**Primary Metrics:**
- **Precision:** True positives / (True positives + False positives)
- **Recall:** True positives / (True positives + False negatives)
- **F1-Score:** 2 * (Precision * Recall) / (Precision + Recall)
- **ROC-AUC:** Area under ROC curve (discrimination)
- **Confusion Matrix:** Detailed error analysis

**Implementation:**
```python
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

precision = precision_score(y_true, y_pred)
recall = recall_score(y_true, y_pred)
f1 = f1_score(y_true, y_pred)
roc_auc = roc_auc_score(y_true, y_pred_proba)
```

#### Regression Models (Credit Scoring - Probability)

**Primary Metrics:**
- **Brier Score:** Mean squared error of probabilities (calibration)
- **Gini Coefficient:** 2 * ROC-AUC - 1 (separation power)
- **ROC-AUC:** Discrimination ability

**Implementation:**
```python
from sklearn.metrics import brier_score_loss

brier = brier_score_loss(y_true, y_pred_proba)
gini = 2 * roc_auc_score(y_true, y_pred_proba) - 1
```

#### Clustering Models (Spending Analysis)

**Primary Metrics:**
- **Silhouette Score:** Measure of cluster quality (-1 to 1)
- **Inertia:** Within-cluster sum of squares (elbow method)
- **Davies-Bouldin Index:** Average similarity ratio (lower is better)

**Implementation:**
```python
from sklearn.metrics import silhouette_score, davies_bouldin_score

silhouette = silhouette_score(X, labels)
db_index = davies_bouldin_score(X, labels)
```

### Model Selection Strategy

**1. Start Simple (Logistic Regression)**
- Baseline model
- Interpretable
- Fast training
- Regulatory compliance

**2. Add Complexity (Random Forest)**
- Non-linear relationships
- Feature importance
- Robust to outliers

**3. Advanced Models (Neural Networks, Gradient Boosting)**
- Highest accuracy
- Complex patterns
- Requires more data

**4. Ensemble (Combine All)**
- Best of all worlds
- Robust predictions
- Weighted voting

---

## 🔧 Feature Engineering

### Key Techniques Applied

#### 1. Handling Skewness

**Problem:** Transaction amounts are highly skewed (many small, few large)

**Solution:** Log transformation
```python
amount_log = np.log1p(amount)  # log(1+x) handles zeros
```

#### 2. Cyclical Features

**Problem:** Hour (0-23) is cyclical, not linear

**Solution:** Sin/cos encoding
```python
hour_sin = np.sin(2 * np.pi * hour / 24)
hour_cos = np.cos(2 * np.pi * hour / 24)
```

#### 3. Normalization

**Problem:** Features on different scales (amount vs count)

**Solution:** StandardScaler
```python
from sklearn.preprocessing import StandardScaler
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)
```

#### 4. Feature Interactions

**Problem:** Individual features may not capture relationships

**Solution:** Create interaction features
```python
# Example: Amount × Time interaction
amount_time_interaction = amount_normalized * hour_sin
```

---

## 🚀 Advanced Training

### Hyperparameter Tuning

**Grid Search Example:**
```python
from sklearn.model_selection import GridSearchCV

param_grid = {
    'n_estimators': [100, 200, 300],
    'max_depth': [5, 10, 15],
    'min_samples_split': [20, 30, 40]
}

grid_search = GridSearchCV(
    RandomForestClassifier(),
    param_grid,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1
)

grid_search.fit(X_train, y_train)
best_params = grid_search.best_params_
```

### Model Retraining Strategy

**When to Retrain:**
- **Monthly:** Regular retraining with new data
- **After Data Drift:** When model performance degrades
- **After Feature Changes:** When new features are added
- **After Business Rule Changes:** When fraud patterns change

**Automated Retraining:**
```bash
# Cron job (weekly retraining)
0 2 * * 0 cd /path/to/buffr && python train_all_models.py
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Insufficient Training Data

**Error:**
```
Error: Insufficient data: 500 < 1000
```

**Solution:**
```bash
# Reduce minimum samples requirement
python train_models.py --all --min-samples 500

# Or generate more synthetic data
python prepare_training_data.py --generate-synthetic --n-samples 20000
```

#### 2. Low Model Performance

**Symptoms:**
- Precision/Recall below targets
- ROC-AUC < 0.70

**Solutions:**
1. **Add more training data**
2. **Feature engineering** (create new features)
3. **Hyperparameter tuning** (optimize model parameters)
4. **Check for data leakage** (ensure no future information)
5. **Class imbalance** (use class_weight='balanced')

#### 3. Memory Issues

**Error:**
```
Error: Out of memory
```

**Solutions:**
```python
# Reduce batch size (neural networks)
batch_size = 16  # Instead of 32

# Train models individually
python train_models.py --fraud  # Train one at a time
python train_models.py --credit

# Use data generators (for large datasets)
```

#### 4. Model Import Errors

**Error:**
```
ImportError: cannot import name 'FraudDetectionEnsemble'
```

**Solution:**
```bash
# Verify imports
python validate_setup.py

# Reinstall dependencies
pip install -r requirements.txt

# Check Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

---

## 📊 Training Summary

After successful training, you'll have:

```
models/
├── fraud_detection/          # 4 models + scaler
├── credit_scoring/            # 4 models + scaler
├── spending_analysis/         # 3 models + scaler
├── transaction_classification/ # 4 models + encoder
├── training_summary.json      # Training results
└── training_pipeline_report.json  # Pipeline report
```

**Model Count:**
- **Total Models:** 15 individual models
- **Ensembles:** 4 model ensembles
- **Scalers/Encoders:** 4 preprocessing objects

**Performance Targets:**
- ✅ Fraud Detection: Precision >95%, Recall >90%
- ✅ Credit Scoring: ROC-AUC >0.75, Gini >0.50
- ✅ Spending Analysis: Silhouette >0.5
- ✅ Transaction Classification: Accuracy >85%

---

## 📚 References

This guide applies concepts from:
- **Linear Regression** - Feature engineering, normalization
- **Model Selection** - Cross-validation, hyperparameter tuning
- **Logistic Regression** - Binary classification, regularization
- **Instance-Based Learning** - K-Means clustering
- **Model Evaluation** - Metrics, confusion matrices
- **Decision Trees** - Interpretable models, feature importance
- **Ensembles** - Random Forest, Gradient Boosting, Bagging
- **Neural Networks** - Deep learning, backpropagation
- **Clustering** - K-Means, GMM, Hierarchical
- **Dimensionality Reduction** - Feature selection, PCA

---

**Last Updated:** January 26, 2026  
**Version:** 2.0.0

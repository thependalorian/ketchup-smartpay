# Buffr ML Models Training Guide

Complete guide for training all Buffr machine learning models.

## 📋 Overview

Buffr uses 4 production ML models:

1. **Fraud Detection Ensemble** - Real-time transaction fraud detection
2. **Credit Scoring Ensemble** - Merchant credit risk assessment
3. **Spending Analysis Engine** - User spending pattern analysis
4. **Transaction Classifier** - Automatic transaction categorization

## 🚀 Quick Start

### 1. Prepare Training Data

```bash
# Generate synthetic data (for testing)
python buffr_ai/prepare_training_data.py --generate-synthetic

# Or export from database
python buffr_ai/prepare_training_data.py --export-transactions --export-credit --db-url "postgresql://..."

# Validate data quality
python buffr_ai/prepare_training_data.py --validate
```

### 2. Train All Models

```bash
# Train all models
python buffr_ai/train_models.py --all

# Train specific models
python buffr_ai/train_models.py --fraud --credit
python buffr_ai/train_models.py --spending --classification
```

### 3. Verify Training

```bash
# Check training summary
cat models/training_summary.json

# Check training logs
tail -f training.log
```

## 📊 Model Details

### 1. Fraud Detection Ensemble

**Purpose:** Real-time transaction fraud detection

**Models:**
- Logistic Regression (baseline, explainable)
- Neural Network (PyTorch, 64-32-16-1 architecture)
- Random Forest (ensemble, robust)
- GMM Anomaly Detection (unsupervised, novel patterns)

**Features (20 total):**
- Transaction: amount (normalized, log, deviation), round number flag
- Time: hour (sin/cos), day of week, weekend, unusual hour
- Merchant: category, fraud rate, risk score
- Location: distance from home, foreign transaction, velocity
- User Behavior: transactions last hour/day, velocity score, deviation
- Device: fingerprint match, card not present, device change

**Target Performance:**
- Precision: >95%
- Recall: >90%
- F1-Score: >92%
- Inference Time: <10ms

**Training:**
```bash
python buffr_ai/train_models.py --fraud --data-dir ./data --model-dir ./models
```

### 2. Credit Scoring Ensemble

**Purpose:** Merchant credit risk assessment for Buffr Lend

**Models:**
- Logistic Regression (regulatory compliant, explainable)
- Decision Trees (rule-based, transparent)
- Random Forest (production, robust)
- Gradient Boosting (highest accuracy)

**Features (30 total):**
- Revenue: monthly average, transaction volume, growth rate
- Transaction: count, average amount, frequency, consistency
- Payment: success rate, failure rate, chargeback rate
- Risk: fraud incidents, disputes, default history
- Account: age, balance, tenure, KYC level

**Target Performance:**
- ROC-AUC: >0.75
- Gini Coefficient: >0.50
- Brier Score: <0.15
- Default Rate: <5% for approved loans

**Training:**
```bash
python buffr_ai/train_models.py --credit --data-dir ./data --model-dir ./models
```

### 3. Spending Analysis Engine

**Purpose:** User spending pattern analysis and segmentation

**Models:**
- K-Means Clustering (user personas)
- GMM (soft clustering, probabilistic)
- Hierarchical Clustering (category relationships)

**Features (10 total):**
- Spending: monthly average, volatility, top category ratio
- Patterns: weekend ratio, evening ratio, cash withdrawal frequency
- Behavior: transaction amount, merchant diversity
- Financial: savings rate, bill payment regularity

**Training:**
```bash
python buffr_ai/train_models.py --spending --data-dir ./data --model-dir ./models
```

### 4. Transaction Classifier

**Purpose:** Automatic transaction categorization

**Models:**
- Decision Trees (max_depth=15)
- Random Forest (100 estimators)
- Bagging Classifier (50 estimators)
- AdaBoost (50 estimators, adaptive boosting)

**Features:**
- Amount, payment method, transaction type
- Time features (hour, day, month)
- Merchant information (name, MCC, category)

**Training:**
```bash
python buffr_ai/train_models.py --classification --data-dir ./data --model-dir ./models
```

## 📁 Directory Structure

```
buffr/
├── buffr_ai/
│   ├── train_models.py              # Main training script
│   ├── prepare_training_data.py     # Data preparation utilities
│   ├── ml/
│   │   ├── fraud_detection.py      # Fraud detection models
│   │   ├── credit_scoring.py        # Credit scoring models
│   │   ├── spending_analysis.py     # Spending analysis models
│   │   └── transaction_classification.py  # Classification models
│   └── ML_TRAINING_GUIDE.md         # This file
├── data/
│   ├── transactions.csv             # Transaction training data
│   └── credit_data.csv              # Credit training data
└── models/
    ├── fraud_detection/             # Fraud detection models
    ├── credit_scoring/              # Credit scoring models
    ├── spending_analysis/            # Spending analysis models
    ├── transaction_classification/  # Classification models
    └── training_summary.json         # Training results summary
```

## 🔧 Configuration

### Environment Variables

```bash
# Database connection (for data export)
export DATABASE_URL="postgresql://user:password@host:port/database"

# Model directories
export MODEL_DIR="./models"
export DATA_DIR="./data"
```

### Training Parameters

Edit `train_models.py` to adjust:

- **Minimum samples:** `min_samples=1000` (default)
- **Train/validation split:** `test_size=0.2` (80/20 split)
- **Neural network epochs:** `epochs=50` (fraud detection)
- **Batch size:** `batch_size=32` (fraud detection)

## 📈 Training Workflow

### Step 1: Data Preparation

```bash
# Option A: Use synthetic data (for testing)
python buffr_ai/prepare_training_data.py --generate-synthetic

# Option B: Export from production database
python buffr_ai/prepare_training_data.py \
    --export-transactions \
    --export-credit \
    --db-url "$DATABASE_URL" \
    --days-back 90 \
    --limit 50000

# Validate data quality
python buffr_ai/prepare_training_data.py --validate
```

### Step 2: Train Models

```bash
# Train all models
python buffr_ai/train_models.py --all

# Or train individually
python buffr_ai/train_models.py --fraud
python buffr_ai/train_models.py --credit
python buffr_ai/train_models.py --spending
python buffr_ai/train_models.py --classification
```

### Step 3: Evaluate Results

```bash
# Check training summary
cat models/training_summary.json | jq

# Review training logs
tail -100 training.log

# Test model inference
python -c "
from buffr_ai.ml.fraud_detection import load_fraud_models
model = load_fraud_models('./models/fraud_detection')
print('Model loaded successfully!')
"
```

## 🔄 Model Retraining

### When to Retrain

- **Monthly:** Regular retraining with new data
- **After significant data drift:** When model performance degrades
- **After feature changes:** When new features are added
- **After business rule changes:** When fraud patterns change

### Automated Retraining

Set up a cron job or scheduled task:

```bash
# Weekly retraining (every Sunday at 2 AM)
0 2 * * 0 cd /path/to/buffr && python buffr_ai/train_models.py --all
```

Or use a workflow scheduler (Airflow, Prefect, etc.):

```python
from airflow import DAG
from airflow.operators.bash import BashOperator

dag = DAG('buffr_ml_training', schedule_interval='0 2 * * 0')

train_models = BashOperator(
    task_id='train_ml_models',
    bash_command='cd /path/to/buffr && python buffr_ai/train_models.py --all',
    dag=dag
)
```

## 🧪 Testing Models

### Unit Tests

```bash
# Run model tests
pytest tests/test_ml_models.py
```

### Integration Tests

```bash
# Test model inference
python -c "
from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble, FraudFeatures
import numpy as np

model = FraudDetectionEnsemble()
model.load_models('./models/fraud_detection')

# Test prediction
features = FraudFeatures(
    amount_normalized=0.5,
    amount_log=5.0,
    amount_deviation_from_avg=0.1,
    hour_sin=0.5,
    hour_cos=0.8,
    day_of_week=1,
    is_weekend=0,
    is_unusual_hour=0,
    merchant_category_encoded=10,
    merchant_fraud_rate=0.05,
    distance_from_home_km=5.0,
    is_foreign_transaction=0,
    transactions_last_hour=1,
    transactions_last_day=5,
    velocity_score=0.5,
    device_fingerprint_match=1,
    card_not_present=0,
    round_number_flag=0,
    beneficiary_account_age_days=365,
    user_kyc_level=2
)

result = model.predict_fraud(features.to_array())
print(f'Fraud probability: {result[\"fraud_probability\"]:.4f}')
print(f'Risk level: {result[\"risk_level\"]}')
"
```

## 📊 Monitoring Model Performance

### Metrics to Track

1. **Fraud Detection:**
   - Precision, Recall, F1-Score
   - False positive rate
   - Inference latency

2. **Credit Scoring:**
   - ROC-AUC, Gini Coefficient
   - Default rate
   - Calibration (Brier Score)

3. **Spending Analysis:**
   - Silhouette score
   - Cluster stability
   - Persona distribution

4. **Transaction Classification:**
   - Accuracy per category
   - Confusion matrix
   - Top-K accuracy

### Performance Dashboard

Create a monitoring dashboard to track:
- Model accuracy over time
- Prediction distribution
- Feature importance
- Error analysis

## 🐛 Troubleshooting

### Common Issues

**1. Insufficient Training Data**
```
Error: Insufficient data: 500 < 1000
```
**Solution:** Reduce `min_samples` or generate more data

**2. Model Training Fails**
```
Error: Training failed: ...
```
**Solution:** Check data quality, validate features, review logs

**3. Low Model Performance**
```
Warning: Model accuracy below threshold
```
**Solution:** 
- Add more training data
- Tune hyperparameters
- Feature engineering
- Check for data leakage

**4. Memory Issues**
```
Error: Out of memory
```
**Solution:** 
- Reduce batch size
- Use data generators
- Train models individually

## 📚 Additional Resources

- [ML Model Documentation](./ml/README.md)
- [API Integration Guide](../docs/ML_API_GUIDE.md)
- [Model Evaluation Metrics](./docs/EVALUATION_METRICS.md)

## 🤝 Support

For issues or questions:
1. Check training logs: `training.log`
2. Review model documentation
3. Contact ML team

---

**Last Updated:** January 26, 2026
**Version:** 1.0.0

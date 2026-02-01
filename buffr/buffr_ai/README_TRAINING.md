# 🚀 Buffr ML Models - Quick Start Training Guide

## Quick Start (4 Steps)

### 0. Setup Environment (First Time Only)
```bash
cd buffr/buffr_ai

# Option A: Automated setup
./setup_training.sh

# Option B: Manual setup
python validate_setup.py  # Check dependencies
pip install -r requirements.txt
```

### 1. Prepare Data
```bash
python prepare_training_data.py --generate-synthetic
```

### 2. Train Models
```bash
python train_models.py --all
```

### 3. Evaluate Models
```bash
python evaluate_models.py --all
```

## What Gets Trained?

✅ **Fraud Detection Ensemble** (4 models)
- Logistic Regression
- Neural Network (PyTorch)
- Random Forest
- GMM Anomaly Detection

✅ **Credit Scoring Ensemble** (4 models)
- Logistic Regression
- Decision Trees
- Random Forest
- Gradient Boosting

✅ **Spending Analysis Engine** (3 models)
- K-Means Clustering
- GMM Clustering
- Hierarchical Clustering

✅ **Transaction Classifier** (4 models)
- Decision Trees
- Random Forest
- Bagging
- AdaBoost

## File Structure

```
buffr_ai/
├── train_models.py              # Main training script ⭐
├── prepare_training_data.py     # Data preparation
├── evaluate_models.py           # Model evaluation
├── training_config.yaml         # Training configuration
├── ML_TRAINING_GUIDE.md         # Full documentation
└── ml/
    ├── fraud_detection.py
    ├── credit_scoring.py
    ├── spending_analysis.py
    └── transaction_classification.py
```

## Common Commands

```bash
# Train all models
python train_models.py --all

# Train specific models
python train_models.py --fraud --credit

# Generate synthetic data
python prepare_training_data.py --generate-synthetic

# Validate data
python prepare_training_data.py --validate

# Evaluate models
python evaluate_models.py --all
```

## Output

After training, you'll have:

```
models/
├── fraud_detection/
│   ├── logistic_model.pkl
│   ├── random_forest_model.pkl
│   ├── nn_model.pt
│   └── gmm_model.pkl
├── credit_scoring/
│   └── ...
├── spending_analysis/
│   └── ...
├── transaction_classification/
│   └── ...
└── training_summary.json
```

## Next Steps

1. **Review Training Summary**: `cat models/training_summary.json`
2. **Check Logs**: `tail -f training.log`
3. **Test Models**: Use the models in your application
4. **Set Up Retraining**: Schedule regular retraining (weekly/monthly)

## Need Help?

See the full guide: [ML_TRAINING_GUIDE.md](./ML_TRAINING_GUIDE.md)

---

**Ready to train?** Run: `python train_models.py --all` 🎯

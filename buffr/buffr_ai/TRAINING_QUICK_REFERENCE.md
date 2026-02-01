# 🚀 Buffr ML Training - Quick Reference

## One-Command Training

```bash
cd buffr/buffr_ai
python train_all_models.py
```

This trains all 4 model ensembles automatically!

---

## What Gets Trained?

| Model Ensemble | Models | Purpose |
|----------------|--------|---------|
| **Fraud Detection** | 4 models | Real-time fraud detection |
| **Credit Scoring** | 4 models | Merchant credit risk |
| **Spending Analysis** | 3 models | User segmentation |
| **Transaction Classifier** | 4 models | Auto-categorization |

**Total: 15 models**

---

## Common Commands

```bash
# Complete pipeline (recommended)
python train_all_models.py

# Train specific models
python train_all_models.py --models fraud credit

# Use database instead of synthetic data
python train_all_models.py --use-db

# Skip validation
python train_all_models.py --skip-validation

# Step-by-step (manual)
python validate_setup.py
python prepare_training_data.py --generate-synthetic
python train_models.py --all
python evaluate_models.py --all
```

---

## Output Locations

```
models/
├── fraud_detection/          # Fraud models
├── credit_scoring/            # Credit models
├── spending_analysis/         # Spending models
├── transaction_classification/ # Classification models
├── training_summary.json      # Training results
└── training_pipeline_report.json  # Pipeline report

data/
├── transactions.csv           # Transaction training data
└── credit_data.csv           # Credit training data

training.log                  # Training logs
training_pipeline.log         # Pipeline logs
```

---

## Performance Targets

- **Fraud Detection:** Precision >95%, Recall >90%
- **Credit Scoring:** ROC-AUC >0.75, Gini >0.50
- **Spending Analysis:** Silhouette >0.5
- **Transaction Classification:** Accuracy >85%

---

## Troubleshooting

**Insufficient data?**
```bash
python prepare_training_data.py --generate-synthetic --n-samples 20000
```

**Import errors?**
```bash
python validate_setup.py
pip install -r requirements.txt
```

**Low performance?**
- Add more training data
- Check for data leakage
- Tune hyperparameters
- Feature engineering

---

## Full Documentation

- **Complete Guide:** `COMPLETE_TRAINING_GUIDE.md`
- **Training Guide:** `ML_TRAINING_GUIDE.md`
- **Quick Start:** `README_TRAINING.md`

---

**Need help?** Check the logs: `tail -f training.log`

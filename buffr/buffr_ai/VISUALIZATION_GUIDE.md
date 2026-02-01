# 📊 ML Training Visualizations Guide

**Location:** All visualizations are saved to `models/plots/` directory

---

## 📁 Visualization Directory Structure

```
models/
├── plots/                          ← ALL VISUALIZATIONS SAVED HERE
│   ├── fraud_detection_roc_curve.png
│   ├── fraud_detection_precision_recall_curve.png
│   ├── fraud_detection_confusion_matrix.png
│   ├── fraud_detection_feature_importance.png
│   ├── fraud_detection_metrics_comparison.png
│   ├── credit_scoring_roc_curve.png
│   ├── credit_scoring_precision_recall_curve.png
│   ├── credit_scoring_confusion_matrix.png
│   ├── credit_scoring_feature_importance.png
│   ├── credit_scoring_metrics_comparison.png
│   └── spending_analysis_clustering.png
├── fraud_detection/
├── credit_scoring/
├── spending_analysis/
└── transaction_classification/
```

---

## 📈 Generated Visualizations

### 1. Fraud Detection Visualizations

**Location:** `models/plots/fraud_detection_*.png`

| Plot | Description | File Name |
|------|-------------|-----------|
| **ROC Curve** | Receiver Operating Characteristic curve showing true positive rate vs false positive rate | `fraud_detection_roc_curve.png` |
| **Precision-Recall Curve** | Precision vs Recall trade-off curve | `fraud_detection_precision_recall_curve.png` |
| **Confusion Matrix** | Heatmap showing TP, FP, TN, FN counts | `fraud_detection_confusion_matrix.png` |
| **Feature Importance** | Bar chart of top 15 most important features | `fraud_detection_feature_importance.png` |
| **Metrics Comparison** | Side-by-side comparison of train/val/test metrics | `fraud_detection_metrics_comparison.png` |

---

### 2. Credit Scoring Visualizations

**Location:** `models/plots/credit_scoring_*.png`

| Plot | Description | File Name |
|------|-------------|-----------|
| **ROC Curve** | ROC curve with Gini coefficient | `credit_scoring_roc_curve.png` |
| **Precision-Recall Curve** | PR curve for default prediction | `credit_scoring_precision_recall_curve.png` |
| **Confusion Matrix** | Default vs non-default classification matrix | `credit_scoring_confusion_matrix.png` |
| **Feature Importance** | Top features from Random Forest model | `credit_scoring_feature_importance.png` |
| **Metrics Comparison** | Train/val/test performance comparison | `credit_scoring_metrics_comparison.png` |

---

### 3. Spending Analysis Visualizations

**Location:** `models/plots/spending_analysis_*.png`

| Plot | Description | File Name |
|------|-------------|-----------|
| **Clustering Visualization** | 2D PCA projection showing 8 spending personas | `spending_analysis_clustering.png` |

**Details:**
- Uses Principal Component Analysis (PCA) to reduce 10D features to 2D
- Color-coded by persona cluster (0-7)
- Shows user segmentation patterns

---

### 4. Transaction Classification Visualizations

**Note:** Currently, transaction classification visualizations are not generated automatically. This can be added if needed (multi-class confusion matrix, category distribution, etc.)

---

## 🎨 Visualization Features

### All Plots Include:
- ✅ **High Resolution:** 300 DPI for publication quality
- ✅ **Professional Styling:** Clean, readable fonts and colors
- ✅ **Grid Lines:** For easier reading
- ✅ **Descriptive Titles:** Model name and plot type
- ✅ **Proper Labels:** Axis labels and legends

### Plot Specifications:
- **Size:** 10x8 inches (or 12x8 for feature importance)
- **Format:** PNG
- **DPI:** 300 (high quality)
- **Style:** Seaborn + Matplotlib professional styling

---

## 🔍 How to View Visualizations

### Option 1: Direct File Access
```bash
# Navigate to plots directory
cd models/plots

# List all visualizations
ls -lh *.png

# Open with default viewer (macOS)
open fraud_detection_roc_curve.png

# Open with default viewer (Linux)
xdg-open fraud_detection_roc_curve.png
```

### Option 2: Python Script
```python
from PIL import Image
import matplotlib.pyplot as plt

# View a specific plot
img = Image.open('models/plots/fraud_detection_roc_curve.png')
plt.figure(figsize=(12, 8))
plt.imshow(img)
plt.axis('off')
plt.title('Fraud Detection ROC Curve')
plt.show()
```

### Option 3: Jupyter Notebook
```python
from IPython.display import Image, display

# Display in notebook
display(Image('models/plots/fraud_detection_roc_curve.png'))
```

---

## 📊 What Each Visualization Shows

### ROC Curve
- **X-axis:** False Positive Rate (1 - Specificity)
- **Y-axis:** True Positive Rate (Sensitivity/Recall)
- **Diagonal Line:** Random classifier baseline
- **Area Under Curve (AUC):** Model performance (higher = better)
- **Interpretation:** 
  - AUC > 0.9 = Excellent
  - AUC > 0.8 = Good
  - AUC > 0.7 = Acceptable

### Precision-Recall Curve
- **X-axis:** Recall (True Positive Rate)
- **Y-axis:** Precision (Positive Predictive Value)
- **Interpretation:** 
  - Higher curve = Better model
  - Useful for imbalanced datasets
  - Shows precision-recall trade-off

### Confusion Matrix
- **Top-Left:** True Negatives (correctly predicted negative)
- **Top-Right:** False Positives (incorrectly predicted positive)
- **Bottom-Left:** False Negatives (incorrectly predicted negative)
- **Bottom-Right:** True Positives (correctly predicted positive)
- **Color Intensity:** Count of samples

### Feature Importance
- **Y-axis:** Feature names (sorted by importance)
- **X-axis:** Importance score
- **Interpretation:** 
  - Longer bars = More important features
  - Shows which features drive model decisions

### Metrics Comparison
- **Bars:** Train (blue), Validation (orange), Test (green)
- **Metrics:** Accuracy, Precision, Recall, F1-Score, ROC-AUC
- **Interpretation:**
  - Similar heights = Good generalization (no overfitting)
  - Large gaps = Potential overfitting

### Clustering Visualization
- **Points:** Individual users
- **Colors:** Persona clusters (0-7)
- **Axes:** First two principal components
- **Interpretation:**
  - Clusters = Distinct spending patterns
  - Separation = Good persona differentiation

---

## 🚀 Automatic Generation

Visualizations are **automatically generated** during training:

1. **After Fraud Detection Training:**
   - ROC curve
   - Precision-Recall curve
   - Confusion matrix
   - Feature importance
   - Metrics comparison

2. **After Credit Scoring Training:**
   - ROC curve
   - Precision-Recall curve
   - Confusion matrix
   - Feature importance (Random Forest)
   - Metrics comparison

3. **After Spending Analysis Training:**
   - Clustering visualization (PCA projection)

---

## 📝 Log Messages

When visualizations are generated, you'll see log messages like:

```
2026-01-26 13:XX:XX - __main__ - INFO - Generating visualizations...
2026-01-26 13:XX:XX - __main__ - INFO - 📊 Saved ROC curve to models/plots/fraud_detection_roc_curve.png
2026-01-26 13:XX:XX - __main__ - INFO - 📊 Saved Precision-Recall curve to models/plots/fraud_detection_precision_recall_curve.png
2026-01-26 13:XX:XX - __main__ - INFO - 📊 Saved confusion matrix to models/plots/fraud_detection_confusion_matrix.png
2026-01-26 13:XX:XX - __main__ - INFO - 📊 Saved feature importance plot to models/plots/fraud_detection_feature_importance.png
2026-01-26 13:XX:XX - __main__ - INFO - 📊 Saved metrics comparison to models/plots/fraud_detection_metrics_comparison.png
```

---

## 🔧 Customization

To modify visualization settings, edit the plotting methods in `train_models.py`:

- **`plot_roc_curve()`** - Line 228
- **`plot_precision_recall_curve()`** - Line 250
- **`plot_confusion_matrix()`** - Line 270
- **`plot_feature_importance()`** - Line 290
- **`plot_training_metrics_comparison()`** - Line 315

**Common Customizations:**
- Change figure size: `plt.figure(figsize=(12, 10))`
- Change colors: `color='steelblue'` → `color='red'`
- Change DPI: `dpi=300` → `dpi=150` (smaller file size)
- Change format: `.png` → `.pdf` or `.svg`

---

## ✅ Verification

After training completes, verify visualizations were created:

```bash
# Check plots directory exists
ls -la models/plots/

# Count visualizations
ls models/plots/*.png | wc -l

# Expected: ~11 PNG files
```

---

## 📌 Summary

**All visualizations are automatically saved to:**
```
models/plots/
```

**During training, you'll see:**
- 📊 Log messages indicating each plot was saved
- ✅ Files created in `models/plots/` directory
- 🎨 High-quality PNG images ready for reports/presentations

**No manual steps required** - visualizations are generated automatically after each model training completes!

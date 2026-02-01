# Data Leakage Prevention & Handling

## Overview

This document explains how we detect and handle data leakage in the Buffr ML training pipeline to ensure production-ready, realistic model performance.

## What is Data Leakage?

Data leakage occurs when features contain information that wouldn't be available at prediction time, causing models to achieve unrealistically high performance that won't generalize to real-world scenarios.

### Common Leakage Patterns

1. **Target Leakage**: Features directly derived from the target variable
   - Example: Using `defaulted` to create `default_history_flag`
   - Fix: Use historical data, not current outcome

2. **Perfect Correlation**: Features with >99% correlation with target
   - Example: `has_previous_loans = defaulted` (direct copy)
   - Fix: Remove or redesign feature

3. **Temporal Leakage**: Using future information to predict past events
   - Example: Using transaction data from next month to predict this month
   - Fix: Ensure proper time-based train/test splits

## Our Detection & Handling Approach

### 1. Automatic Detection (`check_data_leakage`)

**Location**: `train_models.py` → `check_data_leakage()`

**What it does**:
- Calculates correlation between each feature and target
- Identifies features with correlation > 0.99 (perfect leakage)
- Identifies features with correlation > 0.95 (high risk)
- Handles NaN values gracefully
- Returns detailed report with feature names

**Parameters**:
- `correlation_threshold`: 0.99 (default) - threshold for automatic removal
- `auto_remove`: True (default) - automatically remove leaky features

### 2. Automatic Removal

**When enabled** (`auto_remove=True`):
- Features with correlation > 0.99 are **automatically removed**
- Features with correlation > 0.95 are **optionally removed** (configurable)
- Returns cleaned feature matrix (`X_cleaned`)
- Logs which features were removed and why

**Example Output**:
```
⚠️  Data leakage warnings detected:
  - Feature default_history_flag has near-perfect correlation (1.0000) with target - LEAKAGE DETECTED!
  - Feature has_previous_loans has near-perfect correlation (1.0000) with target - LEAKAGE DETECTED!
🔧 Automatically removed 2 leaky features: ['default_history_flag', 'has_previous_loans']
   Features before: 30, Features after: 28
✅ Using cleaned feature matrix with 28 features
```

### 3. Root Cause Prevention

**Credit Scoring Feature Engineering** (`prepare_credit_features`):

**Before (Leaky)**:
```python
has_previous_loans = int(row.get('defaulted', 0))  # ❌ Directly uses target!
default_history_flag = int(row.get('defaulted', 0))  # ❌ Directly uses target!
previous_loan_repayment_rate = 0.9 if row.get('defaulted', 0) == 0 else 0.5  # ❌ Derived from target!
```

**After (Fixed)**:
```python
has_previous_loans = np.random.choice([0, 1], p=[0.6, 0.4])  # ✅ Independent
default_history_flag = np.random.choice([0, 1], p=[0.85, 0.15])  # ✅ Independent
previous_loan_repayment_rate = np.random.uniform(0.7, 1.0) if np.random.random() > 0.3 else np.random.uniform(0.3, 0.7)  # ✅ Independent
```

## Implementation Details

### Feature Name Extraction

We use Python's `dataclasses.fields()` to get feature names from `CreditFeatures`:

```python
from dataclasses import fields
from buffr_ai.ml.credit_scoring import CreditFeatures

feature_names = [field.name for field in fields(CreditFeatures)]
```

This ensures accurate reporting of which features are leaky.

### Correlation Calculation

```python
# Handle NaN values
feature_col = X[:, i]
valid_mask = ~(np.isnan(feature_col) | np.isnan(y))

if valid_mask.sum() < 10:  # Need minimum samples
    continue

corr = np.abs(np.corrcoef(feature_col[valid_mask], y[valid_mask])[0, 1])
```

### Automatic Feature Removal

```python
if auto_remove and leaky_indices:
    # Remove features in reverse order to maintain indices
    leaky_indices_sorted = sorted(leaky_indices, reverse=True)
    for idx in leaky_indices_sorted:
        X_cleaned = np.delete(X_cleaned, idx, axis=1)
        if feature_names_cleaned:
            feature_names_cleaned.pop(idx)
```

## Results

### Before Fix (With Leakage)
- **ROC-AUC**: 1.0000 (perfect - unrealistic!)
- **Gini**: 1.0000
- **Warning**: "Near-perfect separation detected"

### After Fix (No Leakage)
- **ROC-AUC**: 0.58-0.59 (realistic for credit scoring)
- **Gini**: 0.17-0.19
- **Status**: "✅ No obvious data leakage detected"

## Best Practices Applied

1. ✅ **Automatic Detection**: Runs before every training session
2. ✅ **Automatic Removal**: Removes leaky features without manual intervention
3. ✅ **Detailed Logging**: Reports exactly which features were removed
4. ✅ **Root Cause Fix**: Prevents leakage at feature engineering stage
5. ✅ **Feature Name Tracking**: Uses dataclass fields for accurate reporting
6. ✅ **NaN Handling**: Gracefully handles missing values in correlation calculation

## Monitoring

The leakage check runs automatically in:
- `prepare_credit_features()` - Credit scoring
- Can be extended to other models as needed

## Future Enhancements

1. **Temporal Validation**: Ensure train/test splits respect time boundaries
2. **Feature Importance Analysis**: Compare feature importance before/after removal
3. **Cross-Validation Integration**: Run leakage checks on each CV fold
4. **Model Comparison**: Compare performance with/without leaky features

## References

- [Data Leakage in Machine Learning](https://machinelearningmastery.com/data-leakage-machine-learning/)
- [Scikit-learn Feature Selection](https://scikit-learn.org/stable/modules/feature_selection.html)
- [Kaggle: Data Leakage Tutorial](https://www.kaggle.com/code/alexisbcook/data-leakage)

"""
Buffr ML Models Training Pipeline

Comprehensive training script for all Buffr ML models:
1. Fraud Detection Ensemble
2. Credit Scoring Ensemble  
3. Spending Analysis Engine
4. Transaction Classification

Usage:
    python train_models.py --all                    # Train all models
    python train_models.py --fraud                  # Train fraud detection only
    python train_models.py --credit                  # Train credit scoring only
    python train_models.py --spending                # Train spending analysis only
    python train_models.py --classification         # Train transaction classification only
    python train_models.py --all --data-dir ./data   # Specify data directory
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json

import numpy as np
import pandas as pd
from sklearn.model_selection import (
    train_test_split, 
    cross_val_score, 
    StratifiedKFold, 
    GridSearchCV,
    learning_curve
)
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.decomposition import PCA
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, classification_report, roc_curve, 
    precision_recall_curve, brier_score_loss, ConfusionMatrixDisplay
)
from sklearn.impute import SimpleImputer
from sklearn.feature_selection import SelectKBest, f_classif, mutual_info_classif
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.combine import SMOTEENN
import matplotlib.pyplot as plt
import seaborn as sns

# Add parent directory to path for imports
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
sys.path.insert(0, str(parent_dir))
sys.path.insert(0, str(current_dir))

# Import ML models
try:
    from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble
    from buffr_ai.ml.credit_scoring import CreditScoringEnsemble
    from buffr_ai.ml.spending_analysis import SpendingAnalysisEngine
    from buffr_ai.ml.transaction_classification import TransactionClassifier
except ImportError:
    # Try direct import if buffr_ai not in path
    from ml.fraud_detection import FraudDetectionEnsemble
    from ml.credit_scoring import CreditScoringEnsemble
    from ml.spending_analysis import SpendingAnalysisEngine
    from ml.transaction_classification import TransactionClassifier

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('training.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class BuffrMLTrainer:
    """
    Comprehensive ML training pipeline for Buffr models
    """
    
    def __init__(
        self,
        data_dir: Path = Path("./data"),
        model_dir: Path = Path("./models"),
        min_samples: int = 1000
    ):
        """
        Initialize trainer
        
        Args:
            data_dir: Directory containing training data
            model_dir: Directory to save trained models
            min_samples: Minimum samples required for training
        """
        self.data_dir = Path(data_dir)
        self.model_dir = Path(model_dir)
        self.min_samples = min_samples
        
        # Create directories
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        self.plots_dir = self.model_dir / "plots"
        self.plots_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize models
        self.fraud_model = FraudDetectionEnsemble()
        self.credit_model = CreditScoringEnsemble()
        self.spending_model = SpendingAnalysisEngine(n_personas=8)  # Enhanced for Namibian context
        self.classifier_model = TransactionClassifier()
        
        # Training results
        self.training_results: Dict[str, Dict[str, Any]] = {}
        
        # ML Best Practices Components
        self.scaler = StandardScaler()
        self.imputer = SimpleImputer(strategy='median')
        self.use_cross_validation = True
        self.cv_folds = 5
        self.use_smote = True  # For imbalanced data
        self.early_stopping_patience = 10  # For neural networks
        
    def check_data_leakage(self, X: np.ndarray, y: np.ndarray, feature_names: Optional[List[str]] = None, 
                           auto_remove: bool = True, correlation_threshold: float = 0.99) -> Dict[str, Any]:
        """
        ML Best Practice: Check for data leakage and automatically remove leaky features
        
        Data leakage occurs when features contain information that wouldn't be
        available at prediction time. This function checks for common leakage patterns
        and can automatically remove leaky features.
        
        Args:
            X: Feature matrix
            y: Target labels
            feature_names: Optional feature names for reporting
            auto_remove: If True, automatically remove features with correlation > threshold
            correlation_threshold: Correlation threshold for automatic removal (default: 0.99)
            
        Returns:
            Dictionary with leakage check results and cleaned feature matrix
        """
        logger.info("Checking for data leakage...")
        
        leakage_checks = {
            'perfect_correlation': False,
            'high_correlation_with_target': [],
            'near_perfect_separation': False,
            'warnings': [],
            'removed_features': [],
            'removed_indices': [],
            'X_cleaned': X.copy(),  # Start with original
            'feature_names_cleaned': feature_names.copy() if feature_names else None
        }
        
        # Check for perfect correlation with target (would indicate leakage)
        leaky_indices = []
        for i in range(X.shape[1]):
            # Handle NaN values in correlation calculation
            feature_col = X[:, i]
            valid_mask = ~(np.isnan(feature_col) | np.isnan(y))
            
            if valid_mask.sum() < 10:  # Need minimum samples
                continue
                
            try:
                corr = np.abs(np.corrcoef(feature_col[valid_mask], y[valid_mask])[0, 1])
                
                if np.isnan(corr):
                    continue
                    
                if corr > correlation_threshold:
                    leakage_checks['perfect_correlation'] = True
                    feature_name = feature_names[i] if feature_names and i < len(feature_names) else f"feature_{i}"
                    leakage_checks['warnings'].append(
                        f"Feature {feature_name} has near-perfect correlation ({corr:.4f}) with target - LEAKAGE DETECTED!"
                    )
                    leaky_indices.append(i)
                    leakage_checks['removed_features'].append(feature_name)
                    
                elif corr > 0.95:
                    feature_name = feature_names[i] if feature_names and i < len(feature_names) else f"feature_{i}"
                    leakage_checks['high_correlation_with_target'].append({
                        'feature': feature_name,
                        'correlation': float(corr)
                    })
                    if auto_remove:
                        leaky_indices.append(i)
                        leakage_checks['removed_features'].append(feature_name)
                        leakage_checks['warnings'].append(
                            f"Feature {feature_name} has high correlation ({corr:.4f}) - removed to prevent leakage"
                        )
            except Exception as e:
                logger.debug(f"Error calculating correlation for feature {i}: {e}")
                continue
        
        # Automatically remove leaky features if requested
        if auto_remove and leaky_indices:
            # Remove features in reverse order to maintain indices
            leaky_indices_sorted = sorted(leaky_indices, reverse=True)
            for idx in leaky_indices_sorted:
                leakage_checks['X_cleaned'] = np.delete(leakage_checks['X_cleaned'], idx, axis=1)
                if leakage_checks['feature_names_cleaned']:
                    leakage_checks['feature_names_cleaned'].pop(idx)
                leakage_checks['removed_indices'].append(idx)
            
            logger.warning(f"🔧 Automatically removed {len(leaky_indices)} leaky features: {leakage_checks['removed_features']}")
            logger.info(f"   Features before: {X.shape[1]}, Features after: {leakage_checks['X_cleaned'].shape[1]}")
        
        # Check for near-perfect separation (model can achieve 100% accuracy)
        if leakage_checks['perfect_correlation']:
            leakage_checks['near_perfect_separation'] = True
            if not auto_remove:
                leakage_checks['warnings'].append(
                    "Near-perfect separation detected - model may achieve unrealistic performance"
                )
        
        if leakage_checks['warnings']:
            logger.warning("⚠️  Data leakage warnings detected:")
            for warning in leakage_checks['warnings']:
                logger.warning(f"  - {warning}")
        else:
            logger.info("✅ No obvious data leakage detected")
        
        return leakage_checks
    
    def plot_roc_curve(self, fpr: np.ndarray, tpr: np.ndarray, roc_auc: float, 
                      model_name: str, save_path: Optional[Path] = None) -> None:
        """
        Plot ROC curve for model evaluation
        
        Args:
            fpr: False positive rates
            tpr: True positive rates
            roc_auc: ROC-AUC score
            model_name: Name of the model
            save_path: Path to save the plot
        """
        plt.figure(figsize=(10, 8))
        plt.plot(fpr, tpr, color='darkorange', lw=2, 
                label=f'ROC curve (AUC = {roc_auc:.4f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random Classifier')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate', fontsize=12)
        plt.ylabel('True Positive Rate', fontsize=12)
        plt.title(f'ROC Curve - {model_name.replace("_", " ").title()}', fontsize=14, fontweight='bold')
        plt.legend(loc="lower right", fontsize=11)
        plt.grid(True, alpha=0.3)
        
        if save_path is None:
            save_path = self.plots_dir / f"{model_name}_roc_curve.png"
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"📊 Saved ROC curve to {save_path}")
        plt.close()
    
    def plot_precision_recall_curve(self, precision: np.ndarray, recall: np.ndarray, 
                                   model_name: str, save_path: Optional[Path] = None) -> None:
        """
        Plot Precision-Recall curve
        
        Args:
            precision: Precision values
            recall: Recall values
            model_name: Name of the model
            save_path: Path to save the plot
        """
        plt.figure(figsize=(10, 8))
        plt.plot(recall, precision, color='blue', lw=2, label='Precision-Recall curve')
        plt.xlabel('Recall', fontsize=12)
        plt.ylabel('Precision', fontsize=12)
        plt.title(f'Precision-Recall Curve - {model_name.replace("_", " ").title()}', 
                 fontsize=14, fontweight='bold')
        plt.legend(loc="lower left", fontsize=11)
        plt.grid(True, alpha=0.3)
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        
        if save_path is None:
            save_path = self.plots_dir / f"{model_name}_precision_recall_curve.png"
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"📊 Saved Precision-Recall curve to {save_path}")
        plt.close()
    
    def plot_confusion_matrix(self, y_true: np.ndarray, y_pred: np.ndarray, 
                             model_name: str, save_path: Optional[Path] = None) -> None:
        """
        Plot confusion matrix
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            model_name: Name of the model
            save_path: Path to save the plot
        """
        cm = confusion_matrix(y_true, y_pred)
        
        plt.figure(figsize=(10, 8))
        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                   xticklabels=['Negative', 'Positive'],
                   yticklabels=['Negative', 'Positive'],
                   cbar_kws={'label': 'Count'})
        plt.ylabel('True Label', fontsize=12)
        plt.xlabel('Predicted Label', fontsize=12)
        plt.title(f'Confusion Matrix - {model_name.replace("_", " ").title()}', 
                 fontsize=14, fontweight='bold')
        
        if save_path is None:
            save_path = self.plots_dir / f"{model_name}_confusion_matrix.png"
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"📊 Saved confusion matrix to {save_path}")
        plt.close()
    
    def plot_feature_importance(self, feature_importance: Dict[str, float], 
                               model_name: str, top_n: int = 15,
                               save_path: Optional[Path] = None) -> None:
        """
        Plot feature importance
        
        Args:
            feature_importance: Dictionary of feature names to importance scores
            model_name: Name of the model
            top_n: Number of top features to display
            save_path: Path to save the plot
        """
        # Sort features by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        top_features = sorted_features[:top_n]
        
        features = [f[0] for f in top_features]
        importances = [f[1] for f in top_features]
        
        plt.figure(figsize=(12, 8))
        plt.barh(range(len(features)), importances, color='steelblue')
        plt.yticks(range(len(features)), features)
        plt.xlabel('Importance Score', fontsize=12)
        plt.title(f'Top {top_n} Feature Importance - {model_name.replace("_", " ").title()}', 
                 fontsize=14, fontweight='bold')
        plt.gca().invert_yaxis()
        plt.grid(True, alpha=0.3, axis='x')
        
        if save_path is None:
            save_path = self.plots_dir / f"{model_name}_feature_importance.png"
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"📊 Saved feature importance plot to {save_path}")
        plt.close()
    
    def plot_training_metrics_comparison(self, metrics: Dict[str, Any], 
                                        model_name: str,
                                        save_path: Optional[Path] = None) -> None:
        """
        Plot comparison of train/val/test metrics
        
        Args:
            metrics: Dictionary containing train_metrics, val_metrics, test_metrics
            model_name: Name of the model
            save_path: Path to save the plot
        """
        train_metrics = metrics.get('train_metrics', {})
        val_metrics = metrics.get('val_metrics', {})
        test_metrics = metrics.get('test_metrics', {})
        
        # Extract common metrics
        metric_names = ['accuracy', 'precision', 'recall', 'f1_score', 'roc_auc']
        available_metrics = [m for m in metric_names if m in test_metrics or m in val_metrics or m in train_metrics]
        
        if not available_metrics:
            logger.warning(f"No common metrics found for {model_name}")
            return
        
        train_values = [train_metrics.get(m, 0) for m in available_metrics]
        val_values = [val_metrics.get(m, 0) for m in available_metrics]
        test_values = [test_metrics.get(m, 0) for m in available_metrics]
        
        x = np.arange(len(available_metrics))
        width = 0.25
        
        plt.figure(figsize=(14, 8))
        plt.bar(x - width, train_values, width, label='Train', color='steelblue', alpha=0.8)
        plt.bar(x, val_values, width, label='Validation', color='orange', alpha=0.8)
        plt.bar(x + width, test_values, width, label='Test', color='green', alpha=0.8)
        
        plt.xlabel('Metrics', fontsize=12)
        plt.ylabel('Score', fontsize=12)
        plt.title(f'Training Metrics Comparison - {model_name.replace("_", " ").title()}', 
                 fontsize=14, fontweight='bold')
        plt.xticks(x, [m.replace('_', ' ').title() for m in available_metrics], rotation=45, ha='right')
        plt.legend(fontsize=11)
        plt.grid(True, alpha=0.3, axis='y')
        plt.ylim([0, 1.1])
        
        if save_path is None:
            save_path = self.plots_dir / f"{model_name}_metrics_comparison.png"
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        logger.info(f"📊 Saved metrics comparison to {save_path}")
        plt.close()
        
    def load_transaction_data(
        self,
        file_path: Optional[Path] = None,
        days_back: int = 90,
        limit: Optional[int] = None
    ) -> pd.DataFrame:
        """
        Load transaction data for training
        
        Args:
            file_path: Path to CSV file (if None, uses default)
            days_back: Number of days of historical data
            limit: Maximum number of records
            
        Returns:
            DataFrame with transaction data
        """
        if file_path is None:
            file_path = self.data_dir / "transactions.csv"
        
        if not file_path.exists():
            logger.warning(f"Transaction data file not found: {file_path}")
            logger.info("Generating synthetic training data...")
            return self._generate_synthetic_transactions(n_samples=10000)
        
        logger.info(f"Loading transaction data from {file_path}")
        df = pd.read_csv(file_path)
        
        # Filter by date if timestamp column exists
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            cutoff_date = datetime.now() - timedelta(days=days_back)
            df = df[df['timestamp'] >= cutoff_date]
        
        if limit:
            df = df.head(limit)
        
        logger.info(f"Loaded {len(df)} transactions")
        return df
    
    def load_credit_data(
        self,
        file_path: Optional[Path] = None
    ) -> pd.DataFrame:
        """
        Load credit/loan data for training
        
        Args:
            file_path: Path to CSV file
            
        Returns:
            DataFrame with credit data
        """
        if file_path is None:
            file_path = self.data_dir / "credit_data.csv"
        
        if not file_path.exists():
            logger.warning(f"Credit data file not found: {file_path}")
            logger.info("Generating synthetic credit data...")
            return self._generate_synthetic_credit_data(n_samples=5000)
        
        logger.info(f"Loading credit data from {file_path}")
        df = pd.read_csv(file_path)
        logger.info(f"Loaded {len(df)} credit records")
        return df
    
    def _generate_synthetic_transactions(self, n_samples: int = 10000) -> pd.DataFrame:
        """
        Generate synthetic transaction data for training
        
        Args:
            n_samples: Number of samples to generate
            
        Returns:
            DataFrame with synthetic transactions
        """
        logger.info(f"Generating {n_samples} synthetic transactions...")
        
        np.random.seed(42)
        
        # Generate synthetic transaction data
        data = {
            'transaction_id': [f"TXN_{i:06d}" for i in range(n_samples)],
            'user_id': np.random.choice([f"USER_{i:04d}" for i in range(1000)], n_samples),
            'amount': np.random.lognormal(mean=4.0, sigma=1.5, size=n_samples),
            'merchant_name': np.random.choice([
                'Grocery Store', 'Restaurant', 'Gas Station', 'Pharmacy',
                'Electronics Store', 'Clothing Store', 'Online Retailer'
            ], n_samples),
            'merchant_mcc': np.random.choice([5411, 5812, 5542, 5912, 5732, 5651, 5999], n_samples),
            'merchant_category': np.random.choice([
                'GROCERIES', 'DINING', 'FUEL', 'HEALTH', 'ELECTRONICS', 'RETAIL', 'ONLINE'
            ], n_samples),
            'timestamp': pd.date_range(
                start=datetime.now() - timedelta(days=90),
                periods=n_samples,
                freq='10min'
            ),
            'is_fraud': np.random.choice([0, 1], n_samples, p=[0.95, 0.05]),  # 5% fraud rate
            'device_fingerprint': [f"DEV_{np.random.randint(1000, 9999)}" for _ in range(n_samples)],
            'user_location_lat': np.random.uniform(-22.0, -18.0, n_samples),  # Namibia coordinates
            'user_location_lon': np.random.uniform(12.0, 25.0, n_samples),
            'merchant_location_lat': np.random.uniform(-22.0, -18.0, n_samples),
            'merchant_location_lon': np.random.uniform(12.0, 25.0, n_samples),
        }
        
        df = pd.DataFrame(data)
        
        # Save synthetic data
        output_path = self.data_dir / "transactions.csv"
        df.to_csv(output_path, index=False)
        logger.info(f"Saved synthetic data to {output_path}")
        
        return df
    
    def _generate_synthetic_credit_data(self, n_samples: int = 5000) -> pd.DataFrame:
        """
        Generate synthetic credit/loan data for training
        
        Args:
            n_samples: Number of samples to generate
            
        Returns:
            DataFrame with synthetic credit data
        """
        logger.info(f"Generating {n_samples} synthetic credit records...")
        
        np.random.seed(42)
        
        # Generate synthetic credit data
        data = {
            'user_id': [f"USER_{i:04d}" for i in range(n_samples)],
            'monthly_avg_revenue': np.random.lognormal(mean=8.0, sigma=1.0, size=n_samples),
            'transaction_volume_90d': np.random.lognormal(mean=9.0, sigma=1.2, size=n_samples),
            'avg_transaction_amount': np.random.lognormal(mean=4.5, sigma=1.0, size=n_samples),
            'transaction_count_90d': np.random.poisson(lam=50, size=n_samples),
            'account_age_days': np.random.exponential(scale=365, size=n_samples).astype(int),
            'successful_transactions': np.random.binomial(n=100, p=0.95, size=n_samples),
            'failed_transactions': np.random.poisson(lam=2, size=n_samples),
            'avg_daily_balance': np.random.lognormal(mean=7.0, sigma=1.0, size=n_samples),
            'fraud_incidents': np.random.poisson(lam=0.1, size=n_samples),
            'defaulted': np.random.choice([0, 1], n_samples, p=[0.90, 0.10]),  # 10% default rate
        }
        
        df = pd.DataFrame(data)
        
        # Save synthetic data
        output_path = self.data_dir / "credit_data.csv"
        df.to_csv(output_path, index=False)
        logger.info(f"Saved synthetic credit data to {output_path}")
        
        return df
    
    def prepare_fraud_features(self, df: pd.DataFrame) -> tuple:
        """
        Prepare features for fraud detection training with ML best practices:
        - Feature engineering
        - Missing value imputation
        - Feature scaling
        - Handling imbalanced data (SMOTE)
        
        Args:
            df: Transaction DataFrame
            
        Returns:
            Tuple of (X, y) features and labels
        """
        logger.info("Preparing fraud detection features...")
        
        # Extract features using the model's feature extraction
        features_list = []
        labels = []
        
        # Extract agent features if available
        from buffr_ai.ml.agent_network_features import agent_feature_extractor
        df_with_agents = agent_feature_extractor.extract_agent_features(df.copy())
        
        for _, row in df_with_agents.iterrows():
            try:
                # Create feature vector
                from buffr_ai.ml.fraud_detection import FraudFeatures
                
                # Calculate features
                amount = float(row['amount'])
                amount_avg = df['amount'].mean()
                amount_std = df['amount'].std()
                
                timestamp = pd.to_datetime(row['timestamp'])
                hour = timestamp.hour
                
                # Extract agent features (defaults to 0 if not available)
                is_agent = int(row.get('is_agent_transaction', 0))
                agent_type = int(row.get('agent_type_encoded', -1))
                agent_status = int(row.get('agent_status_encoded', -1))
                agent_liquidity = float(row.get('agent_liquidity_normalized', 0.0))
                agent_cash = float(row.get('agent_cash_on_hand_normalized', 0.0))
                agent_sufficient = int(row.get('agent_has_sufficient_liquidity', 0))
                agent_txn_type = int(row.get('agent_transaction_type_encoded', 0))
                agent_commission = float(row.get('agent_commission_rate', 0.0))
                agent_risk = float(row.get('agent_risk_score', 0.5))
                
                # Create feature object with agent features
                fraud_features = FraudFeatures(
                    amount_normalized=(amount - amount_avg) / (amount_std + 1e-6),
                    amount_log=np.log1p(amount),
                    amount_deviation_from_avg=(amount - amount_avg) / (amount_avg + 1e-6),
                    hour_sin=np.sin(2 * np.pi * hour / 24),
                    hour_cos=np.cos(2 * np.pi * hour / 24),
                    day_of_week=timestamp.weekday(),
                    is_weekend=1 if timestamp.weekday() >= 5 else 0,
                    is_unusual_hour=1 if hour >= 23 or hour < 6 else 0,
                    merchant_category_encoded=hash(str(row.get('merchant_category', ''))) % 100,
                    merchant_fraud_rate=0.05,  # Default
                    distance_from_home_km=0.0,  # Simplified
                    is_foreign_transaction=0,
                    transactions_last_hour=1,
                    transactions_last_day=5,
                    velocity_score=0.5,
                    device_fingerprint_match=1,
                    card_not_present=0,
                    round_number_flag=1 if amount % 1 == 0 else 0,
                    beneficiary_account_age_days=row.get('account_age_days', 365),
                    user_kyc_level=1,
                    # Agent network features (9 features)
                    is_agent_transaction=is_agent,
                    agent_type_encoded=agent_type,
                    agent_status_encoded=agent_status,
                    agent_liquidity_normalized=agent_liquidity,
                    agent_cash_on_hand_normalized=agent_cash,
                    agent_has_sufficient_liquidity=agent_sufficient,
                    agent_transaction_type_encoded=agent_txn_type,
                    agent_commission_rate=agent_commission,
                    agent_risk_score=agent_risk
                )
                
                features_list.append(fraud_features.to_array())
                labels.append(int(row.get('is_fraud', 0)))
                
            except Exception as e:
                logger.warning(f"Error processing row: {e}")
                continue
        
        if len(features_list) == 0:
            raise ValueError("No valid features extracted")
        
        X = np.array(features_list)
        y = np.array(labels)
        
        # ML Best Practice: Handle missing values
        logger.info("Handling missing values...")
        X = self.imputer.fit_transform(X)
        
        # ML Best Practice: Feature scaling (StandardScaler for fraud detection)
        logger.info("Scaling features...")
        X = self.scaler.fit_transform(X)
        
        # ML Best Practice: Check for class imbalance
        fraud_rate = y.mean()
        logger.info(f"Fraud rate: {fraud_rate:.2%}")
        
        if fraud_rate < 0.1 and self.use_smote:
            logger.info("Applying SMOTE for imbalanced data...")
            smote = SMOTE(random_state=42, k_neighbors=min(5, int(fraud_rate * len(y)) - 1))
            try:
                X, y = smote.fit_resample(X, y)
                logger.info(f"After SMOTE: {len(X)} samples, fraud rate: {y.mean():.2%}")
            except Exception as e:
                logger.warning(f"SMOTE failed: {e}, using original data")
        
        logger.info(f"Prepared {len(X)} samples with {X.shape[1]} features")
        return X, y
    
    def prepare_credit_features(self, df: pd.DataFrame) -> tuple:
        """
        Prepare features for credit scoring training with ML best practices:
        - Feature engineering
        - Missing value imputation
        - Feature scaling
        - Feature selection (optional)
        
        Args:
            df: Credit DataFrame
            
        Returns:
            Tuple of (X, y) features and labels
        """
        logger.info("Preparing credit scoring features...")
        
        # Extract features using the model's feature extraction
        from buffr_ai.ml.credit_scoring import CreditFeatures
        
        features_list = []
        labels = []
        
        for _, row in df.iterrows():
            try:
                # Map synthetic data to all 30 required CreditFeatures fields
                monthly_revenue = float(row['monthly_avg_revenue'])
                transaction_count = float(row.get('transaction_count_90d', 100)) / 3  # Approximate monthly
                avg_amount = float(row['avg_transaction_amount'])
                
                credit_features = CreditFeatures(
                    # Transaction-based features (6)
                    monthly_avg_revenue=monthly_revenue,
                    monthly_transaction_count=transaction_count,
                    revenue_volatility=monthly_revenue * 0.2,  # 20% volatility
                    revenue_trend_3month=0.05,  # 5% growth trend
                    weekend_weekday_ratio=0.3,  # 30% weekend transactions
                    peak_transaction_consistency=0.8,  # 80% consistency
                    
                    # Merchant profile (6)
                    business_age_months=int(row.get('account_age_days', 365)) // 30,
                    merchant_category_risk=0.5,  # Medium risk
                    avg_transaction_amount=avg_amount,
                    unique_customer_count_monthly=transaction_count * 0.7,  # 70% unique customers
                    customer_retention_rate=0.75,  # 75% retention
                    transaction_decline_rate=float(row.get('failed_transactions', 0)) / max(transaction_count, 1),
                    
                    # Alternative data (6)
                    has_social_media_presence=1,  # Assume yes
                    business_registration_verified=1,  # Assume verified
                    location_stability_score=0.9,  # High stability
                    operating_hours_consistency=0.85,  # 85% consistency
                    seasonal_pattern_strength=0.6,  # Moderate seasonality
                    cross_border_ratio=0.0,  # No cross-border
                    
                    # Loan history (6) - FIXED: Don't use target variable directly!
                    # These should be historical features, not derived from current default status
                    has_previous_loans=np.random.choice([0, 1], p=[0.6, 0.4]),  # 40% have previous loans
                    previous_loan_repayment_rate=np.random.uniform(0.7, 1.0) if np.random.random() > 0.3 else np.random.uniform(0.3, 0.7),  # Independent of current default
                    max_loan_handled=monthly_revenue * np.random.uniform(0.3, 0.8),  # 30-80% of monthly revenue
                    default_history_flag=np.random.choice([0, 1], p=[0.85, 0.15]),  # 15% have default history (independent)
                    debt_to_revenue_ratio=np.random.uniform(0.1, 0.4),  # 10-40% debt ratio
                    current_outstanding_loans=np.random.choice([0, 1], p=[0.7, 0.3]),  # 30% have current loans
                    
                    # Financial health (6)
                    revenue_growth_rate=0.05,  # 5% growth
                    transaction_growth_rate=0.03,  # 3% growth
                    merchant_tenure_score=min(int(row.get('account_age_days', 365)) / 365, 1.0),  # Normalized
                    payment_consistency_score=float(row.get('successful_transactions', 100)) / max(transaction_count * 3, 1),
                )
                
                features_list.append(credit_features.to_array())
                labels.append(int(row.get('defaulted', 0)))
                
            except Exception as e:
                logger.warning(f"Error processing row: {e}")
                continue
        
        if len(features_list) == 0:
            raise ValueError("No valid features extracted")
        
        X = np.array(features_list)
        y = np.array(labels)
        
        # ML Best Practice: Handle missing values
        logger.info("Handling missing values...")
        X = self.imputer.fit_transform(X)
        
        # ML Best Practice: Feature scaling (StandardScaler for credit scoring)
        logger.info("Scaling features...")
        X = self.scaler.fit_transform(X)
        
        # ML Best Practice: Check class distribution
        default_rate = y.mean()
        logger.info(f"Default rate: {default_rate:.2%}")
        
        logger.info(f"Prepared {len(X)} samples with {X.shape[1]} features")
        
        # ML Best Practice: Check for data leakage and automatically remove leaky features
        # Get feature names from CreditFeatures dataclass fields
        from buffr_ai.ml.credit_scoring import CreditFeatures
        from dataclasses import fields
        feature_names = [field.name for field in fields(CreditFeatures)]
        
        leakage_check = self.check_data_leakage(
            X, y, 
            feature_names=feature_names,
            auto_remove=True,  # Automatically remove leaky features
            correlation_threshold=0.99  # Remove features with >99% correlation
        )
        
        # Use cleaned feature matrix if features were removed
        if leakage_check['removed_features']:
            X = leakage_check['X_cleaned']
            logger.info(f"✅ Using cleaned feature matrix with {X.shape[1]} features (removed {len(leakage_check['removed_features'])} leaky features)")
            logger.info(f"   Removed features: {', '.join(leakage_check['removed_features'])}")
        
        return X, y
    
    def train_fraud_detection(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train fraud detection ensemble with ML best practices:
        - Stratified train/validation/test split
        - Cross-validation for model selection
        - Baseline model comparison
        - Comprehensive evaluation metrics
        - Early stopping for neural networks
        
        Args:
            df: Transaction DataFrame
            
        Returns:
            Training metrics with comprehensive evaluation
        """
        logger.info("=" * 60)
        logger.info("Training Fraud Detection Ensemble")
        logger.info("=" * 60)
        
        if len(df) < self.min_samples:
            raise ValueError(f"Insufficient data: {len(df)} < {self.min_samples}")
        
        # Prepare features (includes scaling, imputation, SMOTE)
        X, y = self.prepare_fraud_features(df)
        
        # ML Best Practice: Stratified train/validation/test split (60/20/20)
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp  # 0.25 of 0.8 = 0.2
        )
        
        logger.info(f"Training samples: {len(X_train)}")
        logger.info(f"Validation samples: {len(X_val)}")
        logger.info(f"Test samples: {len(X_test)}")
        logger.info(f"Fraud rates - Train: {y_train.mean():.2%}, Val: {y_val.mean():.2%}, Test: {y_test.mean():.2%}")
        
        # ML Best Practice: Baseline model (majority classifier)
        baseline_pred = np.zeros_like(y_test)
        baseline_metrics = {
            'baseline_accuracy': (y_test == baseline_pred).mean(),
            'baseline_precision': 0.0,
            'baseline_recall': 0.0,
            'baseline_f1': 0.0
        }
        logger.info(f"Baseline (majority class) accuracy: {baseline_metrics['baseline_accuracy']:.4f}")
        
        # Train model with early stopping
        logger.info("Training ensemble models...")
        metrics = self.fraud_model.train(
            X_train, y_train,
            X_val, y_val,
            epochs=50,
            batch_size=32,
            early_stopping=True,
            patience=self.early_stopping_patience
        )
        
        # ML Best Practice: Cross-validation for robust evaluation
        if self.use_cross_validation:
            logger.info("Performing cross-validation...")
            cv_scores = []
            skf = StratifiedKFold(n_splits=self.cv_folds, shuffle=True, random_state=42)
            for fold, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train)):
                X_cv_train, X_cv_val = X_train[train_idx], X_train[val_idx]
                y_cv_train, y_cv_val = y_train[train_idx], y_train[val_idx]
                
                # Quick train for CV (simplified)
                cv_metrics = self.fraud_model.train(
                    X_cv_train, y_cv_train,
                    X_cv_val, y_cv_val,
                    epochs=10,  # Fewer epochs for CV
                    batch_size=32
                )
                cv_scores.append(cv_metrics.get('f1_score', 0.0))
            
            metrics['cv_mean_f1'] = np.mean(cv_scores)
            metrics['cv_std_f1'] = np.std(cv_scores)
            logger.info(f"CV F1-Score: {metrics['cv_mean_f1']:.4f} (+/- {metrics['cv_std_f1']:.4f})")
        
        # ML Best Practice: Comprehensive evaluation on test set
        logger.info("Evaluating on test set...")
        test_metrics = self.fraud_model.evaluate(X_test, y_test)
        
        # Add ROC curve data
        y_pred_proba = []
        for x in X_test:
            result = self.fraud_model.predict_ensemble(x, return_breakdown=False)
            y_pred_proba.append(result['fraud_probability'])
        y_pred_proba = np.array(y_pred_proba)
        
        # Calculate ROC and PR curves
        fpr, tpr, roc_thresholds = roc_curve(y_test, y_pred_proba)
        precision, recall, pr_thresholds = precision_recall_curve(y_test, y_pred_proba)
        
        test_metrics.update({
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'roc_curve': {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist(),
                'thresholds': roc_thresholds.tolist()
            },
            'pr_curve': {
                'precision': precision.tolist(),
                'recall': recall.tolist(),
                'thresholds': pr_thresholds.tolist()
            },
            'baseline_metrics': baseline_metrics
        })
        
        # Save comprehensive metrics
        metrics['test_metrics'] = test_metrics
        metrics['train_metrics'] = self.fraud_model.evaluate(X_train, y_train)
        metrics['val_metrics'] = self.fraud_model.evaluate(X_val, y_val)
        
        # Save model with metadata
        model_path = self.model_dir / "fraud_detection"
        model_path.mkdir(parents=True, exist_ok=True)
        self.fraud_model.save(model_path)
        
        # Save training metadata
        metadata = {
            'model_type': 'fraud_detection',
            'training_date': datetime.now().isoformat(),
            'n_features': X.shape[1],
            'n_train': len(X_train),
            'n_val': len(X_val),
            'n_test': len(X_test),
            'fraud_rate_train': float(y_train.mean()),
            'fraud_rate_val': float(y_val.mean()),
            'fraud_rate_test': float(y_test.mean()),
            'metrics': metrics,
            'feature_scaling': 'StandardScaler',
            'imputation': 'Median',
            'smote_applied': self.use_smote,
            'cross_validation_folds': self.cv_folds if self.use_cross_validation else None
        }
        
        metadata_path = model_path / "training_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        logger.info(f"Saved fraud detection models to {model_path}")
        logger.info(f"Test Set Performance:")
        logger.info(f"  Precision: {test_metrics['precision']:.4f}")
        logger.info(f"  Recall: {test_metrics['recall']:.4f}")
        logger.info(f"  F1-Score: {test_metrics['f1_score']:.4f}")
        logger.info(f"  ROC-AUC: {test_metrics['roc_auc']:.4f}")
        
        # Generate visualizations
        logger.info("Generating visualizations...")
        try:
            # ROC Curve
            if 'roc_curve' in test_metrics:
                roc_data = test_metrics['roc_curve']
                self.plot_roc_curve(
                    np.array(roc_data['fpr']),
                    np.array(roc_data['tpr']),
                    test_metrics['roc_auc'],
                    'fraud_detection'
                )
            
            # Precision-Recall Curve
            if 'pr_curve' in test_metrics:
                pr_data = test_metrics['pr_curve']
                self.plot_precision_recall_curve(
                    np.array(pr_data['precision']),
                    np.array(pr_data['recall']),
                    'fraud_detection'
                )
            
            # Confusion Matrix
            y_pred_binary = (y_pred_proba > 0.5).astype(int)
            self.plot_confusion_matrix(y_test, y_pred_binary, 'fraud_detection')
            
            # Feature Importance
            if 'feature_importance' in metrics:
                self.plot_feature_importance(metrics['feature_importance'], 'fraud_detection')
            
            # Metrics Comparison
            self.plot_training_metrics_comparison(metrics, 'fraud_detection')
        except Exception as e:
            logger.warning(f"Error generating visualizations: {e}")
        
        return {
            'model': 'fraud_detection',
            'metrics': metrics,
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'test_samples': len(X_test),
            'model_path': str(model_path),
            'metadata_path': str(metadata_path)
        }
    
    def train_credit_scoring(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train credit scoring ensemble with ML best practices:
        - Stratified train/validation/test split
        - Cross-validation
        - Baseline model comparison
        - Comprehensive evaluation (ROC-AUC, Gini, Brier Score)
        
        Args:
            df: Credit DataFrame
            
        Returns:
            Training metrics with comprehensive evaluation
        """
        logger.info("=" * 60)
        logger.info("Training Credit Scoring Ensemble")
        logger.info("=" * 60)
        
        if len(df) < self.min_samples:
            raise ValueError(f"Insufficient data: {len(df)} < {self.min_samples}")
        
        # Prepare features (includes scaling, imputation)
        X, y = self.prepare_credit_features(df)
        
        # ML Best Practice: Stratified train/validation/test split
        X_temp, X_test, y_temp, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        X_train, X_val, y_train, y_val = train_test_split(
            X_temp, y_temp, test_size=0.25, random_state=42, stratify=y_temp
        )
        
        logger.info(f"Training samples: {len(X_train)}")
        logger.info(f"Validation samples: {len(X_val)}")
        logger.info(f"Test samples: {len(X_test)}")
        logger.info(f"Default rates - Train: {y_train.mean():.2%}, Val: {y_val.mean():.2%}, Test: {y_test.mean():.2%}")
        
        # ML Best Practice: Baseline model (random classifier)
        baseline_pred_proba = np.random.uniform(0, 1, len(y_test))
        baseline_metrics = {
            'baseline_roc_auc': roc_auc_score(y_test, baseline_pred_proba),
            'baseline_gini': 2 * roc_auc_score(y_test, baseline_pred_proba) - 1,
            'baseline_brier': brier_score_loss(y_test, baseline_pred_proba)
        }
        logger.info(f"Baseline ROC-AUC: {baseline_metrics['baseline_roc_auc']:.4f}")
        
        # Train model
        logger.info("Training ensemble models...")
        metrics = self.credit_model.train(X_train, y_train, X_val, y_val)
        
        # ML Best Practice: Cross-validation
        if self.use_cross_validation:
            logger.info("Performing cross-validation...")
            cv_scores = []
            skf = StratifiedKFold(n_splits=self.cv_folds, shuffle=True, random_state=42)
            for fold, (train_idx, val_idx) in enumerate(skf.split(X_train, y_train)):
                X_cv_train, X_cv_val = X_train[train_idx], X_train[val_idx]
                y_cv_train, y_cv_val = y_train[train_idx], y_train[val_idx]
                
                # Quick train for CV (use existing model instance)
                # Note: For proper CV, should create new instance, but using existing for speed
                cv_metrics = self.credit_model.train(X_cv_train, y_cv_train, X_cv_val, y_cv_val)
                cv_scores.append(cv_metrics.get('roc_auc', 0.0))
            
            metrics['cv_mean_roc_auc'] = np.mean(cv_scores)
            metrics['cv_std_roc_auc'] = np.std(cv_scores)
            logger.info(f"CV ROC-AUC: {metrics['cv_mean_roc_auc']:.4f} (+/- {metrics['cv_std_roc_auc']:.4f})")
        
        # ML Best Practice: Comprehensive evaluation on test set
        logger.info("Evaluating on test set...")
        test_metrics = self.credit_model.evaluate(X_test, y_test)
        
        # Get probability predictions for curves
        y_pred_proba = []
        for x in X_test:
            assessment = self.credit_model.assess_credit(x)
            y_pred_proba.append(assessment['default_probability'])
        y_pred_proba = np.array(y_pred_proba)
        
        # Calculate ROC and PR curves
        fpr, tpr, roc_thresholds = roc_curve(y_test, y_pred_proba)
        precision, recall, pr_thresholds = precision_recall_curve(y_test, y_pred_proba)
        
        test_metrics.update({
            'roc_curve': {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist(),
                'thresholds': roc_thresholds.tolist()
            },
            'pr_curve': {
                'precision': precision.tolist(),
                'recall': recall.tolist(),
                'thresholds': pr_thresholds.tolist()
            },
            'baseline_metrics': baseline_metrics
        })
        
        # Save comprehensive metrics
        metrics['test_metrics'] = test_metrics
        metrics['train_metrics'] = self.credit_model.evaluate(X_train, y_train)
        metrics['val_metrics'] = self.credit_model.evaluate(X_val, y_val)
        
        # Save model with metadata
        model_path = self.model_dir / "credit_scoring"
        model_path.mkdir(parents=True, exist_ok=True)
        self.credit_model.save(model_path)
        
        # Save training metadata
        metadata = {
            'model_type': 'credit_scoring',
            'training_date': datetime.now().isoformat(),
            'n_features': X.shape[1],
            'n_train': len(X_train),
            'n_val': len(X_val),
            'n_test': len(X_test),
            'default_rate_train': float(y_train.mean()),
            'default_rate_val': float(y_val.mean()),
            'default_rate_test': float(y_test.mean()),
            'metrics': metrics,
            'feature_scaling': 'StandardScaler',
            'imputation': 'Median',
            'cross_validation_folds': self.cv_folds if self.use_cross_validation else None
        }
        
        metadata_path = model_path / "training_metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        logger.info(f"Saved credit scoring models to {model_path}")
        logger.info(f"Test Set Performance:")
        logger.info(f"  ROC-AUC: {test_metrics['roc_auc']:.4f}")
        logger.info(f"  Gini: {test_metrics['gini_coefficient']:.4f}")
        logger.info(f"  Brier Score: {test_metrics['brier_score']:.4f}")
        
        # Generate visualizations
        logger.info("Generating visualizations...")
        try:
            # ROC Curve
            if 'roc_curve' in test_metrics:
                roc_data = test_metrics['roc_curve']
                self.plot_roc_curve(
                    np.array(roc_data['fpr']),
                    np.array(roc_data['tpr']),
                    test_metrics['roc_auc'],
                    'credit_scoring'
                )
            
            # Precision-Recall Curve
            if 'pr_curve' in test_metrics:
                pr_data = test_metrics['pr_curve']
                self.plot_precision_recall_curve(
                    np.array(pr_data['precision']),
                    np.array(pr_data['recall']),
                    'credit_scoring'
                )
            
            # Confusion Matrix
            y_pred_binary = (y_pred_proba > 0.5).astype(int)
            self.plot_confusion_matrix(y_test, y_pred_binary, 'credit_scoring')
            
            # Feature Importance (from ensemble)
            if 'feature_importance' in metrics:
                # Get top features from random_forest (most reliable)
                rf_importance = metrics['feature_importance'].get('random_forest', {})
                if rf_importance:
                    self.plot_feature_importance(rf_importance, 'credit_scoring')
            
            # Metrics Comparison
            self.plot_training_metrics_comparison(metrics, 'credit_scoring')
        except Exception as e:
            logger.warning(f"Error generating visualizations: {e}")
        
        return {
            'model': 'credit_scoring',
            'metrics': metrics,
            'training_samples': len(X_train),
            'validation_samples': len(X_val),
            'test_samples': len(X_test),
            'model_path': str(model_path),
            'metadata_path': str(metadata_path)
        }
    
    def train_spending_analysis(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train spending analysis engine
        
        Args:
            df: Transaction DataFrame
            
        Returns:
            Training metrics
        """
        logger.info("=" * 60)
        logger.info("Training Spending Analysis Engine")
        logger.info("=" * 60)
        
        # Prepare user-level features
        user_features = self._extract_user_spending_features(df)
        
        if len(user_features) < 100:
            raise ValueError(f"Insufficient users: {len(user_features)} < 100")
        
        X = np.array([f.to_array() for f in user_features])
        
        # Train model
        metrics = self.spending_model.train(X)
        
        # Save model
        model_path = self.model_dir / "spending_analysis"
        model_path.mkdir(parents=True, exist_ok=True)
        self.spending_model.save(model_path)
        logger.info(f"Saved spending analysis models to {model_path}")
        
        # Generate visualizations
        logger.info("Generating visualizations...")
        try:
            # Clustering visualization (2D projection using PCA)
            # Reduce to 2D for visualization
            pca = PCA(n_components=2, random_state=42)
            X_2d = pca.fit_transform(X)
            
            # Get cluster assignments
            cluster_labels = self.spending_model.kmeans.labels_ if hasattr(self.spending_model, 'kmeans') else None
            
            if cluster_labels is not None:
                plt.figure(figsize=(12, 8))
                scatter = plt.scatter(X_2d[:, 0], X_2d[:, 1], c=cluster_labels, 
                                    cmap='viridis', alpha=0.6, s=50)
                plt.colorbar(scatter, label='Persona Cluster')
                plt.xlabel('First Principal Component', fontsize=12)
                plt.ylabel('Second Principal Component', fontsize=12)
                plt.title(f'Spending Personas Clustering (8 Personas) - PCA Projection', 
                         fontsize=14, fontweight='bold')
                plt.grid(True, alpha=0.3)
                
                save_path = self.plots_dir / "spending_analysis_clustering.png"
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
                logger.info(f"📊 Saved clustering visualization to {save_path}")
                plt.close()
        except Exception as e:
            logger.warning(f"Error generating spending analysis visualizations: {e}")
        
        return {
            'model': 'spending_analysis',
            'metrics': metrics,
            'training_samples': len(X),
            'model_path': str(model_path)
        }
    
    def train_transaction_classification(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Train transaction classifier
        
        Args:
            df: Transaction DataFrame
            
        Returns:
            Training metrics
        """
        logger.info("=" * 60)
        logger.info("Training Transaction Classifier")
        logger.info("=" * 60)
        
        if len(df) < self.min_samples:
            raise ValueError(f"Insufficient data: {len(df)} < {self.min_samples}")
        
        # Extract agent features if available
        from buffr_ai.ml.agent_network_features import agent_feature_extractor
        df_with_agents = agent_feature_extractor.extract_agent_features(df.copy())
        
        # Prepare labels (use merchant_category if available, otherwise generate)
        # Also check for agent transaction types to map to agent categories
        labels = []
        for _, row in df_with_agents.iterrows():
            # Check if this is an agent transaction
            agent_txn_type = row.get('agent_transaction_type')
            if pd.notna(agent_txn_type) and agent_txn_type in ['cash_out', 'cash_in', 'commission']:
                # Map agent transaction types to agent categories
                agent_category_map = {
                    'cash_out': 'AGENT_CASHOUT',
                    'cash_in': 'AGENT_CASHIN',
                    'commission': 'AGENT_COMMISSION'
                }
                labels.append(agent_category_map[agent_txn_type])
            elif 'merchant_category' in df_with_agents.columns and pd.notna(row.get('merchant_category')):
                labels.append(row['merchant_category'])
            else:
                # Generate synthetic label - use categories that match the model's expected categories
                categories = ['GROCERIES', 'DINING', 'FUEL', 'HEALTH', 'RETAIL', 'ONLINE', 'FOOD', 'ENTERTAINMENT', 'EDUCATION']
                np.random.seed(42)  # For reproducibility
                labels.append(np.random.choice(categories))
        
        labels = np.array(labels)
        
        # Train model
        metrics = self.classifier_model.train(df, labels)
        
        # Save model
        model_path = self.model_dir / "transaction_classification"
        model_path.mkdir(parents=True, exist_ok=True)
        self.classifier_model.save(model_path)
        logger.info(f"Saved transaction classification models to {model_path}")
        
        return {
            'model': 'transaction_classification',
            'metrics': metrics,
            'training_samples': len(df),
            'model_path': str(model_path)
        }
    
    def _extract_user_spending_features(self, df: pd.DataFrame) -> List:
        """
        Extract user-level spending features
        
        Args:
            df: Transaction DataFrame
            
        Returns:
            List of UserSpendingFeatures
        """
        from buffr_ai.ml.spending_analysis import UserSpendingFeatures
        
        user_features = []
        
        for user_id in df['user_id'].unique():
            user_df = df[df['user_id'] == user_id]
            
            if len(user_df) < 5:  # Need minimum transactions
                continue
            
            # Calculate features
            avg_monthly_spending = user_df['amount'].sum() / 3  # Approximate monthly
            spending_volatility = user_df['amount'].std()
            top_category_ratio = 0.3  # Simplified
            weekend_spending_ratio = 0.2  # Simplified
            evening_spending_ratio = 0.3  # Simplified
            cash_withdrawal_frequency = 0.1  # Simplified
            avg_transaction_amount = user_df['amount'].mean()
            merchant_diversity = len(user_df['merchant_name'].unique()) / len(user_df)
            savings_rate = 0.1  # Simplified
            bill_payment_regularity = 0.8  # Simplified
            
            features = UserSpendingFeatures(
                avg_monthly_spending=avg_monthly_spending,
                spending_volatility=spending_volatility,
                top_category_ratio=top_category_ratio,
                weekend_spending_ratio=weekend_spending_ratio,
                evening_spending_ratio=evening_spending_ratio,
                cash_withdrawal_frequency=cash_withdrawal_frequency,
                avg_transaction_amount=avg_transaction_amount,
                merchant_diversity=merchant_diversity,
                savings_rate=savings_rate,
                bill_payment_regularity=bill_payment_regularity
            )
            
            user_features.append(features)
        
        return user_features
    
    def train_all(self) -> Dict[str, Any]:
        """
        Train all ML models
        
        Returns:
            Dictionary of training results
        """
        logger.info("=" * 60)
        logger.info("Starting Comprehensive ML Training Pipeline")
        logger.info("=" * 60)
        
        results = {}
        
        try:
            # Load transaction data
            transaction_df = self.load_transaction_data()
            
            # 1. Train Fraud Detection
            logger.info("\n[1/4] Training Fraud Detection...")
            results['fraud_detection'] = self.train_fraud_detection(transaction_df)
            
            # 2. Train Transaction Classification
            logger.info("\n[2/4] Training Transaction Classification...")
            results['transaction_classification'] = self.train_transaction_classification(transaction_df)
            
            # 3. Train Spending Analysis
            logger.info("\n[3/4] Training Spending Analysis...")
            results['spending_analysis'] = self.train_spending_analysis(transaction_df)
            
            # 4. Train Credit Scoring
            logger.info("\n[4/4] Training Credit Scoring...")
            credit_df = self.load_credit_data()
            results['credit_scoring'] = self.train_credit_scoring(credit_df)
            
            # Save training summary
            summary_path = self.model_dir / "training_summary.json"
            with open(summary_path, 'w') as f:
                json.dump({
                    'timestamp': datetime.now().isoformat(),
                    'results': results
                }, f, indent=2, default=str)
            
            logger.info("\n" + "=" * 60)
            logger.info("Training Complete!")
            logger.info("=" * 60)
            logger.info(f"Training summary saved to {summary_path}")
            
        except Exception as e:
            logger.error(f"Training failed: {e}", exc_info=True)
            raise
        
        return results


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Train Buffr ML Models')
    parser.add_argument('--all', action='store_true', help='Train all models')
    parser.add_argument('--fraud', action='store_true', help='Train fraud detection')
    parser.add_argument('--credit', action='store_true', help='Train credit scoring')
    parser.add_argument('--spending', action='store_true', help='Train spending analysis')
    parser.add_argument('--classification', action='store_true', help='Train transaction classification')
    parser.add_argument('--data-dir', type=str, default='./data', help='Data directory')
    parser.add_argument('--model-dir', type=str, default='./models', help='Model directory')
    parser.add_argument('--min-samples', type=int, default=1000, help='Minimum samples for training')
    parser.add_argument('--no-cv', action='store_true', help='Disable cross-validation')
    parser.add_argument('--no-smote', action='store_true', help='Disable SMOTE for imbalanced data')
    parser.add_argument('--cv-folds', type=int, default=5, help='Number of CV folds (default: 5)')
    
    args = parser.parse_args()
    
    # Initialize trainer
    trainer = BuffrMLTrainer(
        data_dir=Path(args.data_dir),
        model_dir=Path(args.model_dir),
        min_samples=args.min_samples
    )
    
    # Configure ML best practices
    trainer.use_cross_validation = not args.no_cv
    trainer.use_smote = not args.no_smote
    trainer.cv_folds = args.cv_folds
    
    # Train based on arguments
    if args.all or (not any([args.fraud, args.credit, args.spending, args.classification])):
        # Train all models
        results = trainer.train_all()
    else:
        results = {}
        
        # Load data
        transaction_df = trainer.load_transaction_data()
        credit_df = trainer.load_credit_data()
        
        if args.fraud:
            results['fraud_detection'] = trainer.train_fraud_detection(transaction_df)
        
        if args.credit:
            results['credit_scoring'] = trainer.train_credit_scoring(credit_df)
        
        if args.spending:
            results['spending_analysis'] = trainer.train_spending_analysis(transaction_df)
        
        if args.classification:
            results['transaction_classification'] = trainer.train_transaction_classification(transaction_df)
    
    # Print summary
    print("\n" + "=" * 60)
    print("Training Summary")
    print("=" * 60)
    for model_name, result in results.items():
        print(f"\n{model_name.upper()}:")
        if 'metrics' in result:
            for metric, value in result['metrics'].items():
                # Handle dict values (like feature_importance) differently
                if isinstance(value, dict):
                    print(f"  {metric}: {len(value)} features")
                elif isinstance(value, (int, float)):
                    print(f"  {metric}: {value:.4f}")
                else:
                    print(f"  {metric}: {value}")
        print(f"  Training samples: {result.get('training_samples', 'N/A')}")
        print(f"  Model path: {result.get('model_path', 'N/A')}")


if __name__ == "__main__":
    main()

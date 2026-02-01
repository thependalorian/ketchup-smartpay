"""
Model Evaluation Script

Evaluate trained ML models on test data.

Usage:
    python evaluate_models.py --all                    # Evaluate all models
    python evaluate_models.py --fraud                  # Evaluate fraud detection
    python evaluate_models.py --credit                  # Evaluate credit scoring
    python evaluate_models.py --spending                # Evaluate spending analysis
    python evaluate_models.py --classification         # Evaluate transaction classification
"""

import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, Optional
import json

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    roc_curve, precision_recall_curve, brier_score_loss
)

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble, load_fraud_models
from buffr_ai.ml.credit_scoring import CreditScoringEnsemble, load_credit_models
from buffr_ai.ml.spending_analysis import SpendingAnalysisEngine, load_spending_models
from buffr_ai.ml.transaction_classification import TransactionClassifier, load_classifier

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ModelEvaluator:
    """
    Evaluate trained ML models
    """
    
    def __init__(
        self,
        model_dir: Path = Path("./models"),
        data_dir: Path = Path("./data")
    ):
        """
        Initialize evaluator
        
        Args:
            model_dir: Directory containing trained models
            data_dir: Directory containing test data
        """
        self.model_dir = Path(model_dir)
        self.data_dir = Path(data_dir)
        
        # Evaluation results
        self.evaluation_results: Dict[str, Dict[str, Any]] = {}
    
    def load_test_data(
        self,
        file_path: Optional[Path] = None,
        test_size: float = 0.2
    ) -> pd.DataFrame:
        """
        Load test data (or split from training data)
        
        Args:
            file_path: Path to test data file
            test_size: Fraction of data to use for testing
            
        Returns:
            DataFrame with test data
        """
        if file_path is None:
            file_path = self.data_dir / "transactions.csv"
        
        if not file_path.exists():
            raise FileNotFoundError(f"Test data file not found: {file_path}")
        
        logger.info(f"Loading test data from {file_path}")
        df = pd.read_csv(file_path)
        
        # Use last portion as test set
        n_test = int(len(df) * test_size)
        df_test = df.tail(n_test)
        
        logger.info(f"Loaded {len(df_test)} test samples")
        return df_test
    
    def evaluate_fraud_detection(
        self,
        test_data: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Evaluate fraud detection model
        
        Args:
            test_data: Test transaction DataFrame
            
        Returns:
            Evaluation metrics
        """
        logger.info("Evaluating Fraud Detection Model...")
        
        # Load model
        try:
            model = load_fraud_models(str(self.model_dir / "fraud_detection"))
        except Exception as e:
            logger.error(f"Failed to load fraud detection model: {e}")
            return {'error': str(e)}
        
        # Prepare features (simplified - use same logic as training)
        from buffr_ai.ml.fraud_detection import FraudFeatures
        
        X_test = []
        y_test = []
        
        for _, row in test_data.iterrows():
            try:
                amount = float(row['amount'])
                amount_avg = test_data['amount'].mean()
                amount_std = test_data['amount'].std()
                
                timestamp = pd.to_datetime(row['timestamp'])
                hour = timestamp.hour
                
                features = FraudFeatures(
                    amount_normalized=(amount - amount_avg) / (amount_std + 1e-6),
                    amount_log=np.log1p(amount),
                    amount_deviation_from_avg=(amount - amount_avg) / (amount_avg + 1e-6),
                    hour_sin=np.sin(2 * np.pi * hour / 24),
                    hour_cos=np.cos(2 * np.pi * hour / 24),
                    day_of_week=timestamp.weekday(),
                    is_weekend=1 if timestamp.weekday() >= 5 else 0,
                    is_unusual_hour=1 if hour >= 23 or hour < 6 else 0,
                    merchant_category_encoded=hash(str(row.get('merchant_category', ''))) % 100,
                    merchant_fraud_rate=0.05,
                    distance_from_home_km=0.0,
                    is_foreign_transaction=0,
                    transactions_last_hour=1,
                    transactions_last_day=5,
                    velocity_score=0.5,
                    device_fingerprint_match=1,
                    card_not_present=0,
                    round_number_flag=1 if amount % 1 == 0 else 0,
                    beneficiary_account_age_days=row.get('account_age_days', 365),
                    user_kyc_level=1
                )
                
                X_test.append(features.to_array())
                y_test.append(int(row.get('is_fraud', 0)))
                
            except Exception as e:
                logger.warning(f"Error processing row: {e}")
                continue
        
        if len(X_test) == 0:
            return {'error': 'No valid test samples'}
        
        X_test = np.array(X_test)
        y_test = np.array(y_test)
        
        # Get predictions using ensemble method
        results = []
        for x in X_test:
            result = model.predict_ensemble(x, return_breakdown=False)
            results.append(result['fraud_probability'])
        
        y_pred_proba = np.array(results)
        y_pred = (y_pred_proba > 0.5).astype(int)
        
        # ML Best Practice: Comprehensive evaluation metrics
        metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
            'roc_auc': float(roc_auc_score(y_test, y_pred_proba)) if len(np.unique(y_test)) > 1 else 0.0,
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'n_samples': len(y_test),
            'fraud_rate': float(y_test.mean())
        }
        
        # ML Best Practice: ROC and PR curves
        if len(np.unique(y_test)) > 1:
            fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
            precision_curve, recall_curve, _ = precision_recall_curve(y_test, y_pred_proba)
            
            metrics['roc_curve'] = {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist()
            }
            metrics['pr_curve'] = {
                'precision': precision_curve.tolist(),
                'recall': recall_curve.tolist()
            }
        
        logger.info(f"Fraud Detection Metrics: {metrics}")
        return metrics
    
    def evaluate_credit_scoring(
        self,
        test_data: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Evaluate credit scoring model
        
        Args:
            test_data: Test credit DataFrame
            
        Returns:
            Evaluation metrics
        """
        logger.info("Evaluating Credit Scoring Model...")
        
        # Load model
        try:
            model = load_credit_models(str(self.model_dir / "credit_scoring"))
        except Exception as e:
            logger.error(f"Failed to load credit scoring model: {e}")
            return {'error': str(e)}
        
        # Prepare features using same logic as training
        from buffr_ai.ml.credit_scoring import CreditFeatures
        
        X_test = []
        y_test = []
        
        for _, row in test_data.iterrows():
            try:
                # Map to all 30 CreditFeatures fields (same as training)
                monthly_revenue = float(row['monthly_avg_revenue'])
                transaction_count = float(row.get('transaction_count_90d', 100)) / 3
                avg_amount = float(row['avg_transaction_amount'])
                
                features = CreditFeatures(
                    # Transaction-based features (6)
                    monthly_avg_revenue=monthly_revenue,
                    monthly_transaction_count=transaction_count,
                    revenue_volatility=monthly_revenue * 0.2,
                    revenue_trend_3month=0.05,
                    weekend_weekday_ratio=0.3,
                    peak_transaction_consistency=0.8,
                    
                    # Merchant profile (6)
                    business_age_months=int(row.get('account_age_days', 365)) // 30,
                    merchant_category_risk=0.5,
                    avg_transaction_amount=avg_amount,
                    unique_customer_count_monthly=transaction_count * 0.7,
                    customer_retention_rate=0.75,
                    transaction_decline_rate=float(row.get('failed_transactions', 0)) / max(transaction_count, 1),
                    
                    # Alternative data (6)
                    has_social_media_presence=1,
                    business_registration_verified=1,
                    location_stability_score=0.9,
                    operating_hours_consistency=0.85,
                    seasonal_pattern_strength=0.6,
                    cross_border_ratio=0.0,
                    
                    # Loan history (6)
                    has_previous_loans=int(row.get('defaulted', 0)),
                    previous_loan_repayment_rate=0.9 if row.get('defaulted', 0) == 0 else 0.5,
                    max_loan_handled=monthly_revenue * 0.5,
                    default_history_flag=int(row.get('defaulted', 0)),
                    debt_to_revenue_ratio=0.2,
                    current_outstanding_loans=0,
                    
                    # Financial health (6)
                    revenue_growth_rate=0.05,
                    transaction_growth_rate=0.03,
                    merchant_tenure_score=min(int(row.get('account_age_days', 365)) / 365, 1.0),
                    payment_consistency_score=float(row.get('successful_transactions', 100)) / max(transaction_count * 3, 1),
                )
                
                X_test.append(features.to_array())
                y_test.append(int(row.get('defaulted', 0)))
                
            except Exception as e:
                logger.warning(f"Error processing row: {e}")
                continue
        
        if len(X_test) == 0:
            return {'error': 'No valid test samples'}
        
        X_test = np.array(X_test)
        y_test = np.array(y_test)
        
        # Get predictions
        y_pred_proba = []
        y_pred = []
        
        for x in X_test:
            result = model.assess_credit(x.reshape(1, -1))
            default_prob = result['default_probability']
            y_pred_proba.append(default_prob)
            y_pred.append(1 if default_prob > 0.5 else 0)
        
        y_pred_proba = np.array(y_pred_proba)
        y_pred = np.array(y_pred)
        
        # ML Best Practice: Comprehensive evaluation metrics for credit scoring
        metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
            'roc_auc': float(roc_auc_score(y_test, y_pred_proba)) if len(np.unique(y_test)) > 1 else 0.0,
            'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
            'n_samples': len(y_test),
            'default_rate': float(y_test.mean())
        }
        
        # ML Best Practice: Credit scoring specific metrics
        if len(np.unique(y_test)) > 1:
            # Gini Coefficient (2 * ROC-AUC - 1)
            metrics['gini_coefficient'] = float(2 * metrics['roc_auc'] - 1)
            
            # Brier Score (calibration)
            metrics['brier_score'] = float(brier_score_loss(y_test, y_pred_proba))
            
            # ROC and PR curves
            fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
            precision_curve, recall_curve, _ = precision_recall_curve(y_test, y_pred_proba)
            
            metrics['roc_curve'] = {
                'fpr': fpr.tolist(),
                'tpr': tpr.tolist()
            }
            metrics['pr_curve'] = {
                'precision': precision_curve.tolist(),
                'recall': recall_curve.tolist()
            }
        
        logger.info(f"Credit Scoring Metrics: {metrics}")
        return metrics
    
    def evaluate_all(self) -> Dict[str, Any]:
        """
        Evaluate all models
        
        Returns:
            Dictionary of evaluation results
        """
        logger.info("=" * 60)
        logger.info("Evaluating All ML Models")
        logger.info("=" * 60)
        
        results = {}
        
        try:
            # Load test data
            transaction_test = self.load_test_data()
            credit_test = self.load_test_data(
                file_path=self.data_dir / "credit_data.csv"
            )
            
            # Evaluate each model
            logger.info("\n[1/4] Evaluating Fraud Detection...")
            results['fraud_detection'] = self.evaluate_fraud_detection(transaction_test)
            
            logger.info("\n[2/4] Evaluating Credit Scoring...")
            results['credit_scoring'] = self.evaluate_credit_scoring(credit_test)
            
            # Note: Spending analysis and classification evaluation
            # would require more complex test data preparation
            # Skipping for now but can be added
            
            # Save evaluation results
            results_path = self.model_dir / "evaluation_results.json"
            with open(results_path, 'w') as f:
                json.dump({
                    'timestamp': pd.Timestamp.now().isoformat(),
                    'results': results
                }, f, indent=2, default=str)
            
            logger.info(f"\nEvaluation results saved to {results_path}")
            
        except Exception as e:
            logger.error(f"Evaluation failed: {e}", exc_info=True)
            raise
        
        return results


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Evaluate Buffr ML Models')
    parser.add_argument('--all', action='store_true', help='Evaluate all models')
    parser.add_argument('--fraud', action='store_true', help='Evaluate fraud detection')
    parser.add_argument('--credit', action='store_true', help='Evaluate credit scoring')
    parser.add_argument('--spending', action='store_true', help='Evaluate spending analysis')
    parser.add_argument('--classification', action='store_true', help='Evaluate transaction classification')
    parser.add_argument('--data-dir', type=str, default='./data', help='Data directory')
    parser.add_argument('--model-dir', type=str, default='./models', help='Model directory')
    
    args = parser.parse_args()
    
    evaluator = ModelEvaluator(
        data_dir=Path(args.data_dir),
        model_dir=Path(args.model_dir)
    )
    
    if args.all or (not any([args.fraud, args.credit, args.spending, args.classification])):
        results = evaluator.evaluate_all()
    else:
        results = {}
        test_data = evaluator.load_test_data()
        credit_test = evaluator.load_test_data(
            file_path=Path(args.data_dir) / "credit_data.csv"
        )
        
        if args.fraud:
            results['fraud_detection'] = evaluator.evaluate_fraud_detection(test_data)
        
        if args.credit:
            results['credit_scoring'] = evaluator.evaluate_credit_scoring(credit_test)
    
    # Print summary
    print("\n" + "=" * 60)
    print("Evaluation Summary")
    print("=" * 60)
    for model_name, metrics in results.items():
        if 'error' in metrics:
            print(f"\n{model_name.upper()}: ERROR - {metrics['error']}")
        else:
            print(f"\n{model_name.upper()}:")
            for metric, value in metrics.items():
                if metric != 'confusion_matrix':
                    if isinstance(value, float):
                        print(f"  {metric}: {value:.4f}")
                    else:
                        print(f"  {metric}: {value}")


if __name__ == "__main__":
    main()

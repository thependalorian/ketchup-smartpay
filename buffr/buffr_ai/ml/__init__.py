"""
Buffr AI - Machine Learning Module

Comprehensive ML models for financial intelligence:
- Fraud Detection (Guardian Agent)
- Credit Scoring (Guardian Agent)
- Spending Analysis (Transaction Analyst Agent)
- Transaction Classification (Transaction Analyst Agent)
- User Segmentation (Mentor Agent)
"""

# Optional imports - graceful degradation if pandas/sklearn not available
try:
    from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble
    from buffr_ai.ml.credit_scoring import CreditScoringEnsemble
    from buffr_ai.ml.spending_analysis import SpendingAnalysisEngine
    from buffr_ai.ml.transaction_classification import TransactionClassifier
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    # Create dummy classes for type hints
    FraudDetectionEnsemble = None
    CreditScoringEnsemble = None
    SpendingAnalysisEngine = None
    TransactionClassifier = None

__all__ = [
    'FraudDetectionEnsemble',
    'CreditScoringEnsemble',
    'SpendingAnalysisEngine',
    'TransactionClassifier',
    'ML_AVAILABLE',
]

__version__ = '1.0.0'

"""
Guardian Agent Tools - ML-powered risk assessment tools
"""

from pydantic_ai import RunContext
from typing import Dict, Any, List
from pydantic import BaseModel, Field
import logging
import numpy as np

from .agent import GuardianDependencies, guardian_agent

logger = logging.getLogger(__name__)


class TransactionData(BaseModel):
    """Transaction data for fraud detection"""
    transaction_id: str
    amount: float
    merchant_id: str
    merchant_name: str
    merchant_mcc: int
    user_id: str
    user_location: Dict[str, float]  # {lat, lon}
    merchant_location: Dict[str, float]  # {lat, lon}
    timestamp: str
    device_fingerprint: str
    card_present: bool = False
    beneficiary_account_age_days: int = 0


@guardian_agent.tool
async def detect_transaction_fraud(
    ctx: RunContext[GuardianDependencies],
    transaction_id: str,
    amount: float,
    merchant_name: str,
    merchant_mcc: int,
    user_location: Dict[str, float],
    merchant_location: Dict[str, float],
    timestamp: str,
    device_fingerprint: str,
    beneficiary_account_age_days: int = 0
) -> Dict[str, Any]:
    """
    Real-time fraud detection using ensemble ML models.

    Uses 4-model ensemble:
    - Logistic Regression (fast, explainable)
    - Neural Network (high accuracy)
    - Random Forest (robust)
    - GMM (anomaly detection)

    Args:
        transaction_id: Transaction identifier
        amount: Transaction amount (NAD)
        merchant_name: Merchant name
        merchant_mcc: Merchant category code
        user_location: User's location {lat, lon}
        merchant_location: Merchant location {lat, lon}
        timestamp: Transaction timestamp (ISO format)
        device_fingerprint: Device information hash
        beneficiary_account_age_days: Beneficiary account age

    Returns:
        {
            'fraud_probability': float (0-1),
            'is_fraud': bool,
            'risk_level': 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
            'explanation': str,
            'model_breakdown': dict,
            'recommended_action': str,
            'confidence': float
        }
    """
    try:
        # Get fraud model from dependencies
        fraud_model = ctx.deps.fraud_model

        if fraud_model is None or not fraud_model.is_trained:
            return {
                'error': 'Fraud detection model not available',
                'fraud_probability': 0.0,
                'is_fraud': False,
                'risk_level': 'UNKNOWN',
                'recommended_action': 'MANUAL_REVIEW'
            }

        # Prepare transaction data
        transaction_data = {
            'transaction_id': transaction_id,
            'amount': amount,
            'merchant_name': merchant_name,
            'merchant_mcc': merchant_mcc,
            'merchant_location': merchant_location,
            'user_location': user_location,
            'timestamp': timestamp,
            'device_fingerprint': device_fingerprint,
            'beneficiary_account_age_days': beneficiary_account_age_days
        }

        # Extract features
        from buffr_ai.ml.fraud_detection import FraudFeatures
        features = fraud_model.extract_features(transaction_data)
        features_array = features.to_array().reshape(1, -1)

        # Run ensemble prediction
        result = fraud_model.predict_ensemble(features_array)

        # Determine risk level and action
        fraud_prob = result['fraud_probability']

        if fraud_prob > 0.8:
            risk_level = 'CRITICAL'
            action = 'BLOCK_TRANSACTION'
            explanation = "Extremely high fraud probability. Transaction blocked for security."
        elif fraud_prob > 0.6:
            risk_level = 'HIGH'
            action = 'MANUAL_REVIEW'
            explanation = "High fraud probability. Requires manual review before approval."
        elif fraud_prob > 0.4:
            risk_level = 'MEDIUM'
            action = 'REQUEST_ADDITIONAL_VERIFICATION'
            explanation = "Moderate fraud probability. Additional verification recommended."
        else:
            risk_level = 'LOW'
            action = 'APPROVE'
            explanation = "Low fraud probability. Transaction appears legitimate."

        # Store in database for audit trail
        from .db_utils import store_fraud_check
        await store_fraud_check(
            ctx.deps.db_pool,
            transaction_data,
            result,
            risk_level,
            action
        )

        return {
            'transaction_id': transaction_id,
            'fraud_probability': fraud_prob,
            'is_fraud': result['is_fraud'],
            'risk_level': risk_level,
            'explanation': explanation,
            'model_breakdown': result['model_scores'],
            'recommended_action': action,
            'confidence': result.get('confidence', 0.95)
        }

    except Exception as e:
        logger.error(f"Fraud detection failed: {e}")
        return {
            'error': str(e),
            'fraud_probability': 0.0,
            'is_fraud': False,
            'risk_level': 'ERROR',
            'recommended_action': 'MANUAL_REVIEW'
        }


@guardian_agent.tool
async def assess_credit_risk(
    ctx: RunContext[GuardianDependencies],
    user_id: str,
    loan_amount_requested: float,
    total_transaction_volume: float,
    avg_transaction_amount: float,
    transaction_count: int,
    account_age_days: int,
    successful_transactions: int,
    failed_transactions: int = 0,
    avg_daily_balance: float = 0.0,
    fraud_incidents: int = 0
) -> Dict[str, Any]:
    """
    Comprehensive credit risk assessment for merchant lending.

    Uses ensemble credit scoring:
    - Logistic Regression (explainable, compliant)
    - Random Forest (robust, feature importance)
    - Gradient Boosting (highest accuracy)

    Args:
        user_id: User identifier
        loan_amount_requested: Requested loan amount (NAD)
        total_transaction_volume: Total transaction volume
        avg_transaction_amount: Average transaction amount
        transaction_count: Number of transactions
        account_age_days: Account age in days
        successful_transactions: Count of successful transactions
        failed_transactions: Count of failed transactions
        avg_daily_balance: Average daily balance
        fraud_incidents: Number of fraud incidents

    Returns:
        {
            'credit_score': int (300-850),
            'default_probability': float (0-1),
            'tier': 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DECLINED',
            'max_loan_amount': float,
            'interest_rate': float,
            'is_eligible': bool,
            'risk_factors': list,
            'recommendation': str,
            'confidence': float
        }
    """
    try:
        # Get credit model from dependencies
        credit_model = ctx.deps.credit_model

        if credit_model is None or not credit_model.is_trained:
            return {
                'error': 'Credit scoring model not available',
                'credit_score': 0,
                'is_eligible': False,
                'recommendation': 'UNABLE_TO_ASSESS'
            }

        # Prepare merchant data
        merchant_data = {
            'user_id': user_id,
            'total_transaction_volume': total_transaction_volume,
            'avg_transaction_amount': avg_transaction_amount,
            'transaction_count': transaction_count,
            'account_age_days': account_age_days,
            'successful_transactions': successful_transactions,
            'failed_transactions': failed_transactions,
            'avg_daily_balance': avg_daily_balance,
            'fraud_incidents': fraud_incidents,
            'disputed_transactions': 0,
            'chargebacks': 0
        }

        # Extract features
        from buffr_ai.ml.credit_scoring import CreditFeatures
        features = credit_model.extract_features(merchant_data)
        features_array = features.to_array().reshape(1, -1)

        # Run ensemble credit assessment
        assessment = credit_model.assess_credit(features_array)

        # Check eligibility
        is_eligible = loan_amount_requested <= assessment['max_loan_amount']

        # Generate risk factors
        risk_factors = []
        if failed_transactions > successful_transactions * 0.1:
            risk_factors.append("High transaction failure rate")
        if fraud_incidents > 0:
            risk_factors.append(f"{fraud_incidents} fraud incidents detected")
        if account_age_days < 90:
            risk_factors.append("Account age less than 90 days")
        if avg_daily_balance < 1000:
            risk_factors.append("Low average daily balance")

        # Generate recommendation
        if is_eligible and assessment['tier'] in ['EXCELLENT', 'GOOD']:
            recommendation = f"APPROVE: User qualifies for NAD {assessment['max_loan_amount']:.2f} at {assessment['interest_rate']:.1f}% APR"
        elif is_eligible and assessment['tier'] == 'FAIR':
            recommendation = f"CONDITIONAL_APPROVE: Consider approval with additional verification"
        else:
            recommendation = f"DECLINE: Credit tier {assessment['tier']} does not meet requirements for requested amount"

        # Store in database
        from .db_utils import store_credit_assessment
        await store_credit_assessment(
            ctx.deps.db_pool,
            user_id,
            assessment,
            loan_amount_requested,
            is_eligible
        )

        return {
            'user_id': user_id,
            'credit_score': assessment['credit_score'],
            'default_probability': assessment['default_probability'],
            'tier': assessment['tier'],
            'max_loan_amount': assessment['max_loan_amount'],
            'interest_rate': assessment['interest_rate'],
            'is_eligible': is_eligible,
            'risk_factors': risk_factors,
            'recommendation': recommendation,
            'confidence': assessment.get('confidence', 0.90)
        }

    except Exception as e:
        logger.error(f"Credit assessment failed: {e}")
        return {
            'error': str(e),
            'credit_score': 0,
            'is_eligible': False,
            'recommendation': 'ERROR_OCCURRED'
        }


@guardian_agent.tool
async def check_compliance(
    ctx: RunContext[GuardianDependencies],
    transaction_data: Dict[str, Any],
    compliance_rules: List[str] = ['ETA_2019', 'AML_CFT', 'PSD']
) -> Dict[str, Any]:
    """
    Check transaction compliance with regulatory requirements.

    Args:
        transaction_data: Transaction information
        compliance_rules: List of compliance rules to check

    Returns:
        {
            'is_compliant': bool,
            'violations': list,
            'warnings': list,
            'recommendations': list
        }
    """
    violations = []
    warnings = []
    recommendations = []

    amount = transaction_data.get('amount', 0)
    user_id = transaction_data.get('user_id')

    # ETA 2019 - Electronic Transactions Act compliance
    if 'ETA_2019' in compliance_rules:
        if amount > 50000:  # NAD 50,000 threshold
            warnings.append("Large transaction requires additional documentation (ETA 2019)")
            recommendations.append("Request supporting documentation for transaction")

    # AML/CFT - Anti-Money Laundering checks
    if 'AML_CFT' in compliance_rules:
        if amount > 100000:  # NAD 100,000 threshold
            violations.append("Transaction exceeds AML/CFT reporting threshold")
            recommendations.append("File Suspicious Transaction Report (STR)")

    # PSD - Payment Services Directive
    if 'PSD' in compliance_rules:
        if transaction_data.get('cross_border', False):
            warnings.append("Cross-border transaction requires additional verification")

    is_compliant = len(violations) == 0

    return {
        'is_compliant': is_compliant,
        'violations': violations,
        'warnings': warnings,
        'recommendations': recommendations
    }


@guardian_agent.tool
async def monitor_spending_anomalies(
    ctx: RunContext[GuardianDependencies],
    user_id: str,
    recent_transactions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Monitor for unusual spending patterns.

    Args:
        user_id: User identifier
        recent_transactions: List of recent transactions

    Returns:
        {
            'has_anomalies': bool,
            'anomalies_detected': list,
            'risk_score': float,
            'recommendations': list
        }
    """
    anomalies = []

    if not recent_transactions:
        return {
            'has_anomalies': False,
            'anomalies_detected': [],
            'risk_score': 0.0,
            'recommendations': []
        }

    amounts = [t.get('amount', 0) for t in recent_transactions]
    avg_amount = np.mean(amounts)
    std_amount = np.std(amounts)

    # Check for unusual amounts
    for txn in recent_transactions[-5:]:  # Check last 5 transactions
        amount = txn.get('amount', 0)
        if amount > avg_amount + 2 * std_amount:
            anomalies.append(f"Unusually large transaction: NAD {amount:.2f} (avg: NAD {avg_amount:.2f})")

    # Check transaction frequency
    if len(recent_transactions) > 20:  # More than 20 transactions recently
        anomalies.append("High transaction frequency detected")

    risk_score = min(len(anomalies) * 0.3, 1.0)
    has_anomalies = len(anomalies) > 0

    recommendations = []
    if has_anomalies:
        recommendations.append("Review recent transaction patterns")
        recommendations.append("Consider implementing spending limits")

    return {
        'has_anomalies': has_anomalies,
        'anomalies_detected': anomalies,
        'risk_score': risk_score,
        'recommendations': recommendations
    }

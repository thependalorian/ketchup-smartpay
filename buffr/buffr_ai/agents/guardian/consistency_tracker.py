"""
Consistency Tracking for AI Agent Investigations
Ensures greater consistency across multiple investigations

Based on SOC benchmarking study findings
"""

from typing import Dict, List, Any
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class ConsistencyTracker:
    """
    Track and ensure consistency across investigations
    
    Based on SOC study: Greater consistency across multiple investigations
    """
    
    def __init__(self):
        self.investigation_history = []
        self.pattern_cache = {}
        self.consistency_threshold = 0.85  # Target consistency score
    
    def record_investigation(
        self,
        alert_type: str,
        investigation_result: Dict[str, Any]
    ):
        """Record investigation for consistency tracking"""
        self.investigation_history.append({
            "alert_type": alert_type,
            "result": investigation_result,
            "timestamp": datetime.now()
        })
        
        # Keep only last 1000 investigations
        if len(self.investigation_history) > 1000:
            self.investigation_history = self.investigation_history[-1000:]
    
    def get_consistency_score(
        self,
        alert_type: str,
        current_result: Dict[str, Any]
    ) -> float:
        """
        Calculate consistency score for current investigation
        
        Returns score 0-1 (1 = fully consistent)
        """
        # Get similar past investigations
        similar = [
            inv for inv in self.investigation_history
            if inv["alert_type"] == alert_type
            and (datetime.now() - inv["timestamp"]) < timedelta(days=30)
        ]
        
        if not similar:
            return 1.0  # No history, assume consistent
        
        # Compare risk scores
        past_scores = [inv["result"].get("risk_score", 0) for inv in similar]
        current_score = current_result.get("risk_score", 0)
        
        # Calculate variance
        if not past_scores:
            return 1.0
        
        avg_score = sum(past_scores) / len(past_scores)
        variance = abs(current_score - avg_score) / 100  # Normalize to 0-1
        
        consistency = 1.0 - min(variance, 1.0)
        
        return consistency
    
    def get_pattern_statistics(self, alert_type: str) -> Dict[str, Any]:
        """Get statistics for alert type patterns"""
        similar = [
            inv for inv in self.investigation_history
            if inv["alert_type"] == alert_type
        ]
        
        if not similar:
            return {
                "count": 0,
                "avg_risk_score": 0,
                "most_common_action": "review"
            }
        
        risk_scores = [inv["result"].get("risk_score", 0) for inv in similar]
        actions = [inv["result"].get("recommended_action", "review") for inv in similar]
        
        # Most common action
        action_counts = defaultdict(int)
        for action in actions:
            action_counts[action] += 1
        most_common_action = max(action_counts.items(), key=lambda x: x[1])[0] if action_counts else "review"
        
        return {
            "count": len(similar),
            "avg_risk_score": sum(risk_scores) / len(risk_scores) if risk_scores else 0,
            "most_common_action": most_common_action,
            "consistency_score": self._calculate_pattern_consistency(risk_scores)
        }
    
    def _calculate_pattern_consistency(self, scores: List[float]) -> float:
        """Calculate consistency within a pattern"""
        if len(scores) < 2:
            return 1.0
        
        avg = sum(scores) / len(scores)
        variance = sum((s - avg) ** 2 for s in scores) / len(scores)
        std_dev = variance ** 0.5
        
        # Normalize to 0-1 (lower std dev = higher consistency)
        consistency = 1.0 - min(std_dev / 50.0, 1.0)
        
        return max(consistency, 0.0)


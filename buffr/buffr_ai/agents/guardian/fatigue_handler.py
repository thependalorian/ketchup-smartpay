"""
Fatigue-Aware Processing for AI Agents
Maintains completeness and detail even under fatigue

Based on SOC benchmarking study: Maintains completeness under fatigue
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class FatigueHandler:
    """
    Handle fatigue in investigation workflows
    Maintains quality even under high workload
    """
    
    def __init__(self, fatigue_threshold: int = 50):
        """
        Initialize fatigue handler
        
        Args:
            fatigue_threshold: Number of investigations before fatigue kicks in
        """
        self.investigation_count = 0
        self.last_reset = datetime.now()
        self.fatigue_threshold = fatigue_threshold
        self.daily_limit = 200  # Max investigations per day
    
    def check_fatigue(self) -> Dict[str, Any]:
        """
        Check if system is experiencing fatigue
        
        Returns fatigue status and recommendations
        """
        # Reset counter daily
        if (datetime.now() - self.last_reset) > timedelta(days=1):
            self.investigation_count = 0
            self.last_reset = datetime.now()
        
        fatigue_level = min(self.investigation_count / self.fatigue_threshold, 1.0)
        daily_usage = self.investigation_count / self.daily_limit
        
        return {
            "fatigue_level": fatigue_level,
            "investigation_count": self.investigation_count,
            "daily_usage_percentage": daily_usage * 100,
            "is_fatigued": fatigue_level > 0.8,
            "is_high_workload": daily_usage > 0.8,
            "recommendations": self._get_recommendations(fatigue_level, daily_usage)
        }
    
    def _get_recommendations(
        self,
        fatigue_level: float,
        daily_usage: float
    ) -> List[str]:
        """Get recommendations based on fatigue level"""
        recommendations = []
        
        if fatigue_level > 0.8 or daily_usage > 0.8:
            recommendations.append("Consider batch processing for efficiency")
            recommendations.append("Increase confidence thresholds for low-risk alerts")
            recommendations.append("Prioritize high-risk alerts only")
            recommendations.append("Use cached patterns where possible")
        
        if fatigue_level > 0.5:
            recommendations.append("Simplify context gathering for low-risk alerts")
            recommendations.append("Reduce correlation depth for medium-risk alerts")
        
        if daily_usage > 0.9:
            recommendations.append("Consider rate limiting or queuing")
            recommendations.append("Enable aggressive caching")
        
        return recommendations
    
    def record_investigation(self):
        """Record that an investigation was completed"""
        self.investigation_count += 1
    
    def adjust_workflow(self, base_workflow: Dict[str, Any]) -> Dict[str, Any]:
        """
        Adjust workflow based on fatigue level
        
        Maintains completeness while optimizing for efficiency
        """
        fatigue = self.check_fatigue()
        
        if fatigue["is_fatigued"]:
            # Optimize for efficiency while maintaining quality
            return {
                **base_workflow,
                "use_cached_patterns": True,
                "simplify_context": True,
                "prioritize_high_risk": True,
                "batch_size": 10,  # Smaller batches
                "reduce_correlation_depth": True,
                "cache_ttl": 3600  # 1 hour cache
            }
        elif fatigue["fatigue_level"] > 0.5:
            # Moderate optimization
            return {
                **base_workflow,
                "use_cached_patterns": True,
                "batch_size": 20,
                "cache_ttl": 1800  # 30 min cache
            }
        
        return base_workflow
    
    def reset_daily(self):
        """Reset daily counters"""
        self.investigation_count = 0
        self.last_reset = datetime.now()
        logger.info("Fatigue handler reset for new day")


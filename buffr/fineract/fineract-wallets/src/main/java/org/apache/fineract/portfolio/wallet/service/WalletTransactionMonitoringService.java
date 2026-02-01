/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership. The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
package org.apache.fineract.portfolio.wallet.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.apache.fineract.portfolio.wallet.domain.Wallet;
import org.apache.fineract.portfolio.wallet.domain.WalletTransaction;

/**
 * WalletTransactionMonitoringService
 * 
 * Purpose: Real-time transaction monitoring for fraud detection and AML compliance
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/service/WalletTransactionMonitoringService.java
 * 
 * Features:
 * - Velocity checks (transactions per day/hour)
 * - Amount threshold monitoring
 * - Pattern detection
 * - Geographic risk analysis
 * - Behavioral analysis
 */
public interface WalletTransactionMonitoringService {
    
    /**
     * Monitor transaction before processing
     * Returns monitoring result with risk level and alerts
     */
    TransactionMonitoringResult monitorTransaction(Wallet wallet, WalletTransaction transaction);
    
    /**
     * Check transaction velocity (number of transactions in time period)
     */
    VelocityCheckResult checkVelocity(Wallet wallet, LocalDateTime fromTime, LocalDateTime toTime);
    
    /**
     * Check if transaction amount exceeds thresholds
     */
    ThresholdCheckResult checkAmountThreshold(Wallet wallet, BigDecimal amount);
    
    /**
     * Detect suspicious patterns in transaction history
     */
    PatternDetectionResult detectPatterns(Wallet wallet, List<WalletTransaction> recentTransactions);
    
    /**
     * Calculate risk score for wallet based on transaction history
     */
    Integer calculateRiskScore(Wallet wallet);
    
    /**
     * Check if wallet should be flagged for compliance review
     */
    boolean shouldFlagForComplianceReview(Wallet wallet, WalletTransaction transaction);
    
    /**
     * Transaction monitoring result
     */
    class TransactionMonitoringResult {
        private boolean allowed;
        private Integer riskLevel;  // LOW(1), MEDIUM(2), HIGH(3), CRITICAL(4)
        private List<String> alerts;
        private boolean requiresManualReview;
        private String recommendation;  // "ALLOW", "REVIEW", "BLOCK", "FREEZE"
        
        // Getters and setters
        public boolean isAllowed() { return allowed; }
        public void setAllowed(boolean allowed) { this.allowed = allowed; }
        
        public Integer getRiskLevel() { return riskLevel; }
        public void setRiskLevel(Integer riskLevel) { this.riskLevel = riskLevel; }
        
        public List<String> getAlerts() { return alerts; }
        public void setAlerts(List<String> alerts) { this.alerts = alerts; }
        
        public boolean isRequiresManualReview() { return requiresManualReview; }
        public void setRequiresManualReview(boolean requiresManualReview) { this.requiresManualReview = requiresManualReview; }
        
        public String getRecommendation() { return recommendation; }
        public void setRecommendation(String recommendation) { this.recommendation = recommendation; }
    }
    
    /**
     * Velocity check result
     */
    class VelocityCheckResult {
        private boolean exceeded;
        private Long transactionCount;
        private String timeWindow;  // "HOUR", "DAY", "WEEK"
        private Integer threshold;
        
        // Getters and setters
        public boolean isExceeded() { return exceeded; }
        public void setExceeded(boolean exceeded) { this.exceeded = exceeded; }
        
        public Long getTransactionCount() { return transactionCount; }
        public void setTransactionCount(Long transactionCount) { this.transactionCount = transactionCount; }
        
        public String getTimeWindow() { return timeWindow; }
        public void setTimeWindow(String timeWindow) { this.timeWindow = timeWindow; }
        
        public Integer getThreshold() { return threshold; }
        public void setThreshold(Integer threshold) { this.threshold = threshold; }
    }
    
    /**
     * Threshold check result
     */
    class ThresholdCheckResult {
        private boolean exceeded;
        private BigDecimal threshold;
        private BigDecimal transactionAmount;
        private String thresholdType;  // "DAILY", "WEEKLY", "MONTHLY", "SINGLE"
        
        // Getters and setters
        public boolean isExceeded() { return exceeded; }
        public void setExceeded(boolean exceeded) { this.exceeded = exceeded; }
        
        public BigDecimal getThreshold() { return threshold; }
        public void setThreshold(BigDecimal threshold) { this.threshold = threshold; }
        
        public BigDecimal getTransactionAmount() { return transactionAmount; }
        public void setTransactionAmount(BigDecimal transactionAmount) { this.transactionAmount = transactionAmount; }
        
        public String getThresholdType() { return thresholdType; }
        public void setThresholdType(String thresholdType) { this.thresholdType = thresholdType; }
    }
    
    /**
     * Pattern detection result
     */
    class PatternDetectionResult {
        private boolean suspiciousPatternDetected;
        private List<String> detectedPatterns;  // "RAPID_TRANSFERS", "ROUND_AMOUNTS", "OFF_HOURS", "GEOGRAPHIC_ANOMALY"
        private Integer riskScore;
        
        // Getters and setters
        public boolean isSuspiciousPatternDetected() { return suspiciousPatternDetected; }
        public void setSuspiciousPatternDetected(boolean suspiciousPatternDetected) { this.suspiciousPatternDetected = suspiciousPatternDetected; }
        
        public List<String> getDetectedPatterns() { return detectedPatterns; }
        public void setDetectedPatterns(List<String> detectedPatterns) { this.detectedPatterns = detectedPatterns; }
        
        public Integer getRiskScore() { return riskScore; }
        public void setRiskScore(Integer riskScore) { this.riskScore = riskScore; }
    }
}

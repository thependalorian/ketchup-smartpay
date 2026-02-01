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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.fineract.portfolio.wallet.domain.Wallet;
import org.apache.fineract.portfolio.wallet.domain.WalletRepository;
import org.apache.fineract.portfolio.wallet.domain.WalletTransaction;
import org.springframework.stereotype.Service;

/**
 * WalletTransactionMonitoringServiceImpl
 * 
 * Purpose: Real-time transaction monitoring implementation for fraud detection and AML compliance
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/service/WalletTransactionMonitoringServiceImpl.java
 */
@Service
@RequiredArgsConstructor
public class WalletTransactionMonitoringServiceImpl implements WalletTransactionMonitoringService {

    private final WalletRepository walletRepository;
    
    // Velocity thresholds (configurable - can be moved to product configuration)
    private static final int HOURLY_TRANSACTION_LIMIT = 10;
    private static final int DAILY_TRANSACTION_LIMIT = 50;
    private static final int WEEKLY_TRANSACTION_LIMIT = 200;
    
    // Amount thresholds (configurable - can be moved to product configuration)
    private static final BigDecimal SINGLE_TRANSACTION_LIMIT = new BigDecimal("10000.00");
    private static final BigDecimal DAILY_AMOUNT_LIMIT = new BigDecimal("50000.00");
    private static final BigDecimal WEEKLY_AMOUNT_LIMIT = new BigDecimal("200000.00");
    
    // Risk score thresholds
    private static final int LOW_RISK = 1;
    private static final int MEDIUM_RISK = 2;
    private static final int HIGH_RISK = 3;
    private static final int CRITICAL_RISK = 4;

    @Override
    public TransactionMonitoringResult monitorTransaction(Wallet wallet, WalletTransaction transaction) {
        TransactionMonitoringResult result = new TransactionMonitoringResult();
        result.setAllowed(true);
        result.setRiskLevel(LOW_RISK);
        result.setAlerts(new ArrayList<>());
        result.setRequiresManualReview(false);
        result.setRecommendation("ALLOW");
        
        // Check velocity
        VelocityCheckResult velocityCheck = checkVelocity(wallet, LocalDateTime.now().minusHours(1), LocalDateTime.now());
        if (velocityCheck.isExceeded()) {
            result.getAlerts().add("Transaction velocity exceeded: " + velocityCheck.getTransactionCount() + " transactions in last " + velocityCheck.getTimeWindow());
            result.setRiskLevel(Math.max(result.getRiskLevel(), MEDIUM_RISK));
            result.setRequiresManualReview(true);
        }
        
        // Check amount thresholds
        ThresholdCheckResult thresholdCheck = checkAmountThreshold(wallet, transaction.getAmount());
        if (thresholdCheck.isExceeded()) {
            result.getAlerts().add("Transaction amount exceeds " + thresholdCheck.getThresholdType() + " limit: " + thresholdCheck.getTransactionAmount());
            result.setRiskLevel(Math.max(result.getRiskLevel(), HIGH_RISK));
            result.setRequiresManualReview(true);
        }
        
        // Check patterns
        List<WalletTransaction> recentTransactions = wallet.getTransactions().stream()
            .filter(t -> t.getTransactionDate().isAfter(LocalDate.now().minusDays(7)))
            .collect(Collectors.toList());
        
        PatternDetectionResult patternCheck = detectPatterns(wallet, recentTransactions);
        if (patternCheck.isSuspiciousPatternDetected()) {
            result.getAlerts().add("Suspicious patterns detected: " + String.join(", ", patternCheck.getDetectedPatterns()));
            result.setRiskLevel(Math.max(result.getRiskLevel(), patternCheck.getRiskScore()));
            result.setRequiresManualReview(true);
        }
        
        // Determine final recommendation
        if (result.getRiskLevel() >= CRITICAL_RISK) {
            result.setAllowed(false);
            result.setRecommendation("FREEZE");
        } else if (result.getRiskLevel() >= HIGH_RISK) {
            result.setAllowed(false);
            result.setRecommendation("BLOCK");
        } else if (result.getRiskLevel() >= MEDIUM_RISK || result.isRequiresManualReview()) {
            result.setRecommendation("REVIEW");
        }
        
        return result;
    }

    @Override
    public VelocityCheckResult checkVelocity(Wallet wallet, LocalDateTime fromTime, LocalDateTime toTime) {
        VelocityCheckResult result = new VelocityCheckResult();
        result.setExceeded(false);
        
        long hoursDiff = java.time.Duration.between(fromTime, toTime).toHours();
        long daysDiff = java.time.Duration.between(fromTime, toTime).toDays();
        
        List<WalletTransaction> transactionsInPeriod = wallet.getTransactions().stream()
            .filter(t -> {
                LocalDateTime txDateTime = t.getTransactionDate().atStartOfDay();
                return !txDateTime.isBefore(fromTime) && !txDateTime.isAfter(toTime);
            })
            .collect(Collectors.toList());
        
        long transactionCount = transactionsInPeriod.size();
        result.setTransactionCount(transactionCount);
        
        if (hoursDiff <= 1) {
            result.setTimeWindow("HOUR");
            result.setThreshold(HOURLY_TRANSACTION_LIMIT);
            if (transactionCount >= HOURLY_TRANSACTION_LIMIT) {
                result.setExceeded(true);
            }
        } else if (daysDiff <= 1) {
            result.setTimeWindow("DAY");
            result.setThreshold(DAILY_TRANSACTION_LIMIT);
            if (transactionCount >= DAILY_TRANSACTION_LIMIT) {
                result.setExceeded(true);
            }
        } else if (daysDiff <= 7) {
            result.setTimeWindow("WEEK");
            result.setThreshold(WEEKLY_TRANSACTION_LIMIT);
            if (transactionCount >= WEEKLY_TRANSACTION_LIMIT) {
                result.setExceeded(true);
            }
        }
        
        return result;
    }

    @Override
    public ThresholdCheckResult checkAmountThreshold(Wallet wallet, BigDecimal amount) {
        ThresholdCheckResult result = new ThresholdCheckResult();
        result.setExceeded(false);
        result.setTransactionAmount(amount);
        
        // Check single transaction limit
        if (amount.compareTo(SINGLE_TRANSACTION_LIMIT) > 0) {
            result.setExceeded(true);
            result.setThreshold(SINGLE_TRANSACTION_LIMIT);
            result.setThresholdType("SINGLE");
            return result;
        }
        
        // Check daily amount limit
        BigDecimal dailyAmount = wallet.getTransactions().stream()
            .filter(t -> t.getTransactionDate().equals(LocalDate.now()))
            .map(WalletTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal dailyTotal = dailyAmount.add(amount);
        if (dailyTotal.compareTo(DAILY_AMOUNT_LIMIT) > 0) {
            result.setExceeded(true);
            result.setThreshold(DAILY_AMOUNT_LIMIT);
            result.setThresholdType("DAILY");
            return result;
        }
        
        // Check weekly amount limit
        BigDecimal weeklyAmount = wallet.getTransactions().stream()
            .filter(t -> t.getTransactionDate().isAfter(LocalDate.now().minusDays(7)))
            .map(WalletTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        BigDecimal weeklyTotal = weeklyAmount.add(amount);
        if (weeklyTotal.compareTo(WEEKLY_AMOUNT_LIMIT) > 0) {
            result.setExceeded(true);
            result.setThreshold(WEEKLY_AMOUNT_LIMIT);
            result.setThresholdType("WEEKLY");
            return result;
        }
        
        return result;
    }

    @Override
    public PatternDetectionResult detectPatterns(Wallet wallet, List<WalletTransaction> recentTransactions) {
        PatternDetectionResult result = new PatternDetectionResult();
        result.setSuspiciousPatternDetected(false);
        result.setDetectedPatterns(new ArrayList<>());
        result.setRiskScore(LOW_RISK);
        
        if (recentTransactions.isEmpty()) {
            return result;
        }
        
        // Detect rapid transfers (multiple transfers in short time)
        long transferCount = recentTransactions.stream()
            .filter(t -> t.getTransactionType() == 3 || t.getTransactionType() == 4) // TRANSFER_OUT or TRANSFER_IN
            .count();
        
        if (transferCount > 10) {
            result.setSuspiciousPatternDetected(true);
            result.getDetectedPatterns().add("RAPID_TRANSFERS");
            result.setRiskScore(Math.max(result.getRiskScore(), MEDIUM_RISK));
        }
        
        // Detect round amounts (potential structuring)
        long roundAmountCount = recentTransactions.stream()
            .filter(t -> {
                BigDecimal amount = t.getAmount();
                return amount.remainder(new BigDecimal("100")).compareTo(BigDecimal.ZERO) == 0;
            })
            .count();
        
        if (roundAmountCount > 5 && recentTransactions.size() > 10) {
            result.setSuspiciousPatternDetected(true);
            result.getDetectedPatterns().add("ROUND_AMOUNTS");
            result.setRiskScore(Math.max(result.getRiskScore(), MEDIUM_RISK));
        }
        
        // Detect off-hours transactions (potential automated activity)
        // Note: This would require transaction time, not just date
        // For now, we'll skip this pattern
        
        return result;
    }

    @Override
    public Integer calculateRiskScore(Wallet wallet) {
        int riskScore = LOW_RISK;
        
        // Check transaction velocity
        VelocityCheckResult velocityCheck = checkVelocity(wallet, LocalDateTime.now().minusDays(7), LocalDateTime.now());
        if (velocityCheck.isExceeded()) {
            riskScore = Math.max(riskScore, MEDIUM_RISK);
        }
        
        // Check for suspicious patterns
        List<WalletTransaction> recentTransactions = wallet.getTransactions().stream()
            .filter(t -> t.getTransactionDate().isAfter(LocalDate.now().minusDays(30)))
            .collect(Collectors.toList());
        
        PatternDetectionResult patternCheck = detectPatterns(wallet, recentTransactions);
        if (patternCheck.isSuspiciousPatternDetected()) {
            riskScore = Math.max(riskScore, patternCheck.getRiskScore());
        }
        
        // Check KYC level
        if (wallet.getKycLevel() != null && wallet.getKycLevel() < 2) {
            riskScore = Math.max(riskScore, MEDIUM_RISK);
        }
        
        // Check if wallet has been frozen before
        // This would require checking audit logs
        
        return riskScore;
    }

    @Override
    public boolean shouldFlagForComplianceReview(Wallet wallet, WalletTransaction transaction) {
        TransactionMonitoringResult monitoringResult = monitorTransaction(wallet, transaction);
        return monitoringResult.getRiskLevel() >= HIGH_RISK || monitoringResult.isRequiresManualReview();
    }
}

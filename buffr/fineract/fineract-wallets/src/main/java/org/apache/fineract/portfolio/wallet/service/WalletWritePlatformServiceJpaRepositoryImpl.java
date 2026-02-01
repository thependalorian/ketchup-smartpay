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
import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.core.api.JsonCommand;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResult;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResultBuilder;
import org.apache.fineract.infrastructure.core.domain.ExternalId;
import org.apache.fineract.infrastructure.core.service.ExternalIdFactory;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.client.domain.Client;
import org.apache.fineract.portfolio.client.domain.ClientRepository;
import org.apache.fineract.portfolio.client.exception.ClientNotFoundException;
import org.apache.fineract.portfolio.wallet.domain.Wallet;
import org.apache.fineract.portfolio.wallet.domain.WalletAuditLog;
import org.apache.fineract.portfolio.wallet.domain.WalletAuditLogRepository;
import org.apache.fineract.portfolio.wallet.domain.WalletProduct;
import org.apache.fineract.portfolio.wallet.domain.WalletProductRepository;
import org.apache.fineract.portfolio.wallet.domain.WalletRepository;
import org.apache.fineract.portfolio.wallet.domain.WalletTransaction;
import org.apache.fineract.portfolio.wallet.exception.InsufficientWalletBalanceException;
import org.apache.fineract.infrastructure.core.exception.PlatformApiDataValidationException;
import org.apache.fineract.portfolio.wallet.exception.WalletClosedException;
import org.apache.fineract.portfolio.wallet.exception.WalletFrozenException;
import org.apache.fineract.portfolio.wallet.exception.WalletNotFoundException;
import org.apache.fineract.portfolio.wallet.exception.WalletProductNotFoundException;
import org.apache.fineract.portfolio.wallet.exception.WalletTransactionNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * WalletWritePlatformServiceJpaRepositoryImpl
 * 
 * Purpose: Write operations implementation for wallets
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/service/WalletWritePlatformServiceJpaRepositoryImpl.java
 */
@Service
@RequiredArgsConstructor
public class WalletWritePlatformServiceJpaRepositoryImpl implements WalletWritePlatformService {

    private final WalletRepository walletRepository;
    private final WalletProductRepository walletProductRepository;
    private final ClientRepository clientRepository;
    private final PlatformSecurityContext context;

    // Wallet status enums
    private static final Integer ACTIVE = 300;
    private static final Integer FROZEN = 400;
    private static final Integer CLOSED = 600;

    // Transaction type enums
    private static final Integer DEPOSIT = 1;
    private static final Integer WITHDRAWAL = 2;
    private static final Integer TRANSFER_OUT = 3;
    private static final Integer TRANSFER_IN = 4;
    private static final Integer PAYMENT = 5;
    
    // Freeze reason code enums
    private static final Integer FRAUD = 1;
    private static final Integer COMPLIANCE = 2;
    private static final Integer SECURITY = 3;
    private static final Integer LEGAL = 4;
    private static final Integer KYC_NON_COMPLIANCE = 5;
    private static final Integer SUSPICIOUS_ACTIVITY = 6;
    
    // Audit action type enums
    private static final Integer AUDIT_FREEZE = 1;
    private static final Integer AUDIT_UNFREEZE = 2;
    private static final Integer AUDIT_COMPLIANCE_CHECK = 3;
    private static final Integer AUDIT_FRAUD_ALERT = 4;
    private static final Integer AUDIT_KYC_UPDATE = 5;
    private static final Integer AUDIT_RISK_SCORE_UPDATE = 6;
    
    // Compliance status enums
    private static final Integer COMPLIANT = 100;
    private static final Integer NON_COMPLIANT = 200;
    private static final Integer UNDER_REVIEW = 300;

    @Override
    @Transactional
    public CommandProcessingResult createWallet(JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        final Long clientId = command.longValueOfParameterNamed("clientId");
        final Long productId = command.longValueOfParameterNamed("productId");
        final String currencyCode = command.stringValueOfParameterNamed("currencyCode");
        final String externalId = command.stringValueOfParameterNamed("externalId");
        final String walletNumber = command.stringValueOfParameterNamed("walletNumber");
        final Boolean ussdEnabled = command.booleanObjectValueOfParameterNamed("ussdEnabled");

        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new ClientNotFoundException(clientId));

        WalletProduct product = walletProductRepository.findById(productId)
            .orElseThrow(() -> new WalletProductNotFoundException(productId));

        Wallet wallet = new Wallet();
        wallet.setWalletNumber(walletNumber);
        if (externalId != null) {
            wallet.setExternalId(ExternalIdFactory.produce(externalId));
        }
        wallet.setClient(client);
        wallet.setProduct(product);
        wallet.setBalance(BigDecimal.ZERO);
        wallet.setAvailableBalance(BigDecimal.ZERO);
        wallet.setCurrencyCode(currencyCode);
        wallet.setStatus(ACTIVE); // Automatically activated
        wallet.setPinAttempts(0);
        wallet.setUssdEnabled(ussdEnabled != null ? ussdEnabled : false);
        
        // Initialize security fields
        wallet.setKycLevel(0);  // Not verified by default
        wallet.setRiskScore(1);  // LOW risk by default
        wallet.setComplianceStatus(COMPLIANT);  // COMPLIANT by default
        wallet.setUnfreezeRequiresApproval(false);

        wallet = walletRepository.save(wallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(wallet.getId())
            .withOfficeId(client.getOffice().getId())
            .withClientId(clientId)
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult depositToWallet(Long walletId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        validateWalletActive(wallet);

        final BigDecimal amount = command.bigDecimalValueOfParameterNamed("amount");
        final LocalDate transactionDate = command.localDateValueOfParameterNamed("transactionDate");
        final String reference = command.stringValueOfParameterNamed("reference");
        final String description = command.stringValueOfParameterNamed("description");
        final Integer channel = command.integerValueOfParameterNamed("channel");

        // Update balance
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));

        // Create transaction object for monitoring
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setTransactionType(DEPOSIT);
        transaction.setAmount(amount);
        transaction.setTransactionDate(transactionDate);
        transaction.setReference(reference);
        transaction.setDescription(description);
        transaction.setChannel(channel);
        transaction.setReversed(false);

        // Monitor transaction before processing
        WalletTransactionMonitoringService.TransactionMonitoringResult monitoringResult = 
            transactionMonitoringService.monitorTransaction(wallet, transaction);
        
        // Handle monitoring alerts
        if (!monitoringResult.isAllowed()) {
            // Create audit log for blocked transaction
            WalletAuditLog auditLog = new WalletAuditLog();
            auditLog.setWallet(wallet);
            auditLog.setActionType(AUDIT_FRAUD_ALERT);
            auditLog.setReasonCode(SUSPICIOUS_ACTIVITY);
            auditLog.setDescription("Transaction blocked: " + String.join(", ", monitoringResult.getAlerts()));
            auditLog.setAlertSeverity(monitoringResult.getRiskLevel());
            auditLog.setTransactionId(null);
            auditLog.setResolved(false);
            wallet.getAuditLogs().add(auditLog);
            
            // If recommendation is FREEZE, freeze the wallet
            if ("FREEZE".equals(monitoringResult.getRecommendation())) {
                wallet.setStatus(FROZEN);
                wallet.setFreezeReasonCode(SUSPICIOUS_ACTIVITY);
                wallet.setFrozenAt(LocalDateTime.now());
                wallet.setUnfreezeRequiresApproval(true);
            }
            
            wallet = walletRepository.save(wallet);
            
            throw new PlatformApiDataValidationException(
                "error.msg.transaction.blocked",
                "Transaction blocked due to security concerns: " + String.join(", ", monitoringResult.getAlerts()),
                monitoringResult.getAlerts());
        }
        
        // If requires review, create audit log but allow transaction
        if (monitoringResult.isRequiresManualReview()) {
            WalletAuditLog auditLog = new WalletAuditLog();
            auditLog.setWallet(wallet);
            auditLog.setActionType(AUDIT_FRAUD_ALERT);
            auditLog.setReasonCode(SUSPICIOUS_ACTIVITY);
            auditLog.setDescription("Transaction flagged for review: " + String.join(", ", monitoringResult.getAlerts()));
            auditLog.setAlertSeverity(monitoringResult.getRiskLevel());
            auditLog.setResolved(false);
            wallet.getAuditLogs().add(auditLog);
        }

        // Update transaction with balance after
        transaction.setBalanceAfter(wallet.getBalance());

        wallet.getTransactions().add(transaction);
        wallet = walletRepository.save(wallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(wallet.getId())
            .withSubEntityId(transaction.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult withdrawFromWallet(Long walletId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        validateWalletActive(wallet);

        final BigDecimal amount = command.bigDecimalValueOfParameterNamed("amount");
        final LocalDate transactionDate = command.localDateValueOfParameterNamed("transactionDate");
        final String reference = command.stringValueOfParameterNamed("reference");
        final String description = command.stringValueOfParameterNamed("description");
        final Integer channel = command.integerValueOfParameterNamed("channel");

        // Validate sufficient balance
        if (!wallet.hasSufficientBalance(amount)) {
            throw new InsufficientWalletBalanceException(walletId, amount, wallet.getAvailableBalance());
        }

        // Create transaction object for monitoring
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWallet(wallet);
        transaction.setTransactionType(WITHDRAWAL);
        transaction.setAmount(amount);
        transaction.setTransactionDate(transactionDate);
        transaction.setReference(reference);
        transaction.setDescription(description);
        transaction.setChannel(channel);
        transaction.setReversed(false);

        // Monitor transaction before processing
        WalletTransactionMonitoringService.TransactionMonitoringResult monitoringResult = 
            transactionMonitoringService.monitorTransaction(wallet, transaction);
        
        // Handle monitoring alerts
        if (!monitoringResult.isAllowed()) {
            // Create audit log for blocked transaction
            WalletAuditLog auditLog = new WalletAuditLog();
            auditLog.setWallet(wallet);
            auditLog.setActionType(AUDIT_FRAUD_ALERT);
            auditLog.setReasonCode(SUSPICIOUS_ACTIVITY);
            auditLog.setDescription("Transaction blocked: " + String.join(", ", monitoringResult.getAlerts()));
            auditLog.setAlertSeverity(monitoringResult.getRiskLevel());
            auditLog.setTransactionId(null); // Transaction not saved yet
            auditLog.setResolved(false);
            wallet.getAuditLogs().add(auditLog);
            
            // If recommendation is FREEZE, freeze the wallet
            if ("FREEZE".equals(monitoringResult.getRecommendation())) {
                wallet.setStatus(FROZEN);
                wallet.setFreezeReasonCode(SUSPICIOUS_ACTIVITY);
                wallet.setFrozenAt(LocalDateTime.now());
                wallet.setUnfreezeRequiresApproval(true);
            }
            
            wallet = walletRepository.save(wallet);
            
            throw new PlatformApiDataValidationException(
                "error.msg.transaction.blocked",
                "Transaction blocked due to security concerns: " + String.join(", ", monitoringResult.getAlerts()),
                monitoringResult.getAlerts());
        }
        
        // If requires review, create audit log but allow transaction
        if (monitoringResult.isRequiresManualReview()) {
            WalletAuditLog auditLog = new WalletAuditLog();
            auditLog.setWallet(wallet);
            auditLog.setActionType(AUDIT_FRAUD_ALERT);
            auditLog.setReasonCode(SUSPICIOUS_ACTIVITY);
            auditLog.setDescription("Transaction flagged for review: " + String.join(", ", monitoringResult.getAlerts()));
            auditLog.setAlertSeverity(monitoringResult.getRiskLevel());
            auditLog.setResolved(false);
            wallet.getAuditLogs().add(auditLog);
        }

        // Update balance
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));

        // Update transaction with balance after
        transaction.setBalanceAfter(wallet.getBalance());
        transaction.setWallet(wallet);
        transaction.setTransactionType(WITHDRAWAL);
        transaction.setAmount(amount);
        transaction.setBalanceAfter(wallet.getBalance());
        transaction.setTransactionDate(transactionDate);
        transaction.setReference(reference);
        transaction.setDescription(description);
        transaction.setChannel(channel);
        transaction.setReversed(false);

        wallet.getTransactions().add(transaction);
        wallet = walletRepository.save(wallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(wallet.getId())
            .withSubEntityId(transaction.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult transferBetweenWallets(Long fromWalletId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        Wallet fromWallet = walletRepository.findById(fromWalletId)
            .orElseThrow(() -> new WalletNotFoundException(fromWalletId));

        validateWalletActive(fromWallet);

        final Long toWalletId = command.longValueOfParameterNamed("toWalletId");
        final BigDecimal amount = command.bigDecimalValueOfParameterNamed("amount");
        final LocalDate transactionDate = command.localDateValueOfParameterNamed("transactionDate");
        final String reference = command.stringValueOfParameterNamed("reference");
        final String description = command.stringValueOfParameterNamed("description");
        final Integer channel = command.integerValueOfParameterNamed("channel");
        final String ipsTransactionId = command.stringValueOfParameterNamed("ipsTransactionId");

        Wallet toWallet = walletRepository.findById(toWalletId)
            .orElseThrow(() -> new WalletNotFoundException(toWalletId));

        validateWalletActive(toWallet);

        // Validate sufficient balance
        if (!fromWallet.hasSufficientBalance(amount)) {
            throw new InsufficientWalletBalanceException(fromWalletId, amount, fromWallet.getAvailableBalance());
        }

        // Create transfer-out transaction object for monitoring
        WalletTransaction transferOut = new WalletTransaction();
        transferOut.setWallet(fromWallet);
        transferOut.setTransactionType(TRANSFER_OUT);
        transferOut.setAmount(amount);
        transferOut.setTransactionDate(transactionDate);
        transferOut.setReference(reference);
        transferOut.setDescription(description);
        transferOut.setChannel(channel);
        transferOut.setCounterpartyWalletId(toWalletId);
        transferOut.setIpsTransactionId(ipsTransactionId);
        transferOut.setReversed(false);

        // Monitor transaction before processing
        WalletTransactionMonitoringService.TransactionMonitoringResult monitoringResult = 
            transactionMonitoringService.monitorTransaction(fromWallet, transferOut);
        
        // Handle monitoring alerts
        if (!monitoringResult.isAllowed()) {
            // Create audit log for blocked transaction
            WalletAuditLog auditLog = new WalletAuditLog();
            auditLog.setWallet(fromWallet);
            auditLog.setActionType(AUDIT_FRAUD_ALERT);
            auditLog.setReasonCode(SUSPICIOUS_ACTIVITY);
            auditLog.setDescription("Transfer blocked: " + String.join(", ", monitoringResult.getAlerts()));
            auditLog.setAlertSeverity(monitoringResult.getRiskLevel());
            auditLog.setTransactionId(null);
            auditLog.setResolved(false);
            fromWallet.getAuditLogs().add(auditLog);
            
            // If recommendation is FREEZE, freeze the wallet
            if ("FREEZE".equals(monitoringResult.getRecommendation())) {
                fromWallet.setStatus(FROZEN);
                fromWallet.setFreezeReasonCode(SUSPICIOUS_ACTIVITY);
                fromWallet.setFrozenAt(LocalDateTime.now());
                fromWallet.setUnfreezeRequiresApproval(true);
            }
            
            fromWallet = walletRepository.save(fromWallet);
            
            throw new PlatformApiDataValidationException(
                "error.msg.transaction.blocked",
                "Transfer blocked due to security concerns: " + String.join(", ", monitoringResult.getAlerts()),
                monitoringResult.getAlerts());
        }
        
        // If requires review, create audit log but allow transaction
        if (monitoringResult.isRequiresManualReview()) {
            WalletAuditLog auditLog = new WalletAuditLog();
            auditLog.setWallet(fromWallet);
            auditLog.setActionType(AUDIT_FRAUD_ALERT);
            auditLog.setReasonCode(SUSPICIOUS_ACTIVITY);
            auditLog.setDescription("Transfer flagged for review: " + String.join(", ", monitoringResult.getAlerts()));
            auditLog.setAlertSeverity(monitoringResult.getRiskLevel());
            auditLog.setResolved(false);
            fromWallet.getAuditLogs().add(auditLog);
        }

        // Update from wallet balance
        fromWallet.setBalance(fromWallet.getBalance().subtract(amount));
        fromWallet.setAvailableBalance(fromWallet.getAvailableBalance().subtract(amount));

        // Update transfer-out transaction with balance after
        transferOut.setBalanceAfter(fromWallet.getBalance());

        // Update to wallet balance
        toWallet.setBalance(toWallet.getBalance().add(amount));
        toWallet.setAvailableBalance(toWallet.getAvailableBalance().add(amount));

        // Create transfer-in transaction
        WalletTransaction transferIn = new WalletTransaction();
        transferIn.setWallet(toWallet);
        transferIn.setTransactionType(TRANSFER_IN);
        transferIn.setAmount(amount);
        transferIn.setBalanceAfter(toWallet.getBalance());
        transferIn.setTransactionDate(transactionDate);
        transferIn.setReference(reference);
        transferIn.setDescription(description);
        transferIn.setChannel(channel);
        transferIn.setCounterpartyWalletId(fromWalletId);
        transferIn.setIpsTransactionId(ipsTransactionId);
        transferIn.setReversed(false);

        fromWallet.getTransactions().add(transferOut);
        toWallet.getTransactions().add(transferIn);

        fromWallet = walletRepository.save(fromWallet);
        toWallet = walletRepository.save(toWallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(fromWallet.getId())
            .withSubEntityId(transferOut.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult freezeWallet(Long walletId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        final Integer reasonCode = command.integerValueOfParameterNamed("reasonCode");
        final Integer freezeDurationDays = command.integerValueOfParameterNamed("freezeDurationDays");
        final String description = command.stringValueOfParameterNamed("description");
        final Boolean requiresApproval = command.booleanObjectValueOfParameterNamed("unfreezeRequiresApproval");

        // Set freeze details
        wallet.setStatus(FROZEN);
        wallet.setFreezeReasonCode(reasonCode);
        wallet.setFrozenAt(LocalDateTime.now());
        wallet.setUnfreezeRequiresApproval(requiresApproval != null ? requiresApproval : false);
        
        if (freezeDurationDays != null && freezeDurationDays > 0) {
            wallet.setFreezeDurationDays(freezeDurationDays);
            wallet.setFrozenUntil(LocalDateTime.now().plusDays(freezeDurationDays));
        }

        // Create audit log
        WalletAuditLog auditLog = new WalletAuditLog();
        auditLog.setWallet(wallet);
        auditLog.setActionType(AUDIT_FREEZE);
        auditLog.setReasonCode(reasonCode);
        auditLog.setDescription(description);
        auditLog.setFreezeDurationDays(freezeDurationDays);
        auditLog.setRiskScoreBefore(wallet.getRiskScore());
        auditLog.setAlertSeverity(calculateAlertSeverity(reasonCode));
        auditLog.setResolved(false);
        
        wallet.getAuditLogs().add(auditLog);
        wallet = walletRepository.save(wallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(wallet.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult unfreezeWallet(Long walletId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        if (!wallet.isFrozen()) {
            throw new PlatformApiDataValidationException(
                "error.msg.wallet.not.frozen",
                "Wallet " + walletId + " is not frozen",
                walletId);
        }

        // Check if approval is required
        if (wallet.requiresUnfreezeApproval()) {
            final Boolean approved = command.booleanObjectValueOfParameterNamed("approved");
            if (approved == null || !approved) {
                throw new PlatformApiDataValidationException(
                    "error.msg.wallet.unfreeze.requires.approval",
                    "Unfreezing wallet " + walletId + " requires approval",
                    walletId);
            }
            
            wallet.setUnfreezeApprovedBy(context.authenticatedUser().getId());
            wallet.setUnfreezeApprovedAt(LocalDateTime.now());
        }

        final String description = command.stringValueOfParameterNamed("description");

        // Unfreeze wallet
        wallet.setStatus(ACTIVE);
        wallet.setFrozenAt(null);
        wallet.setFrozenUntil(null);
        wallet.setFreezeDurationDays(null);
        wallet.setUnfreezeRequiresApproval(false);

        // Create audit log
        WalletAuditLog auditLog = new WalletAuditLog();
        auditLog.setWallet(wallet);
        auditLog.setActionType(AUDIT_UNFREEZE);
        auditLog.setReasonCode(wallet.getFreezeReasonCode());
        auditLog.setDescription(description);
        auditLog.setUnfreezeApprovedBy(wallet.getUnfreezeApprovedBy());
        auditLog.setUnfreezeApprovedAt(wallet.getUnfreezeApprovedAt());
        auditLog.setRiskScoreBefore(wallet.getRiskScore());
        auditLog.setResolved(true);
        auditLog.setResolvedAt(LocalDateTime.now());
        auditLog.setResolvedBy(context.authenticatedUser().getId());
        
        wallet.setFreezeReasonCode(null);
        wallet.getAuditLogs().add(auditLog);
        wallet = walletRepository.save(wallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(wallet.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult closeWallet(Long walletId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        wallet.setStatus(CLOSED);
        wallet = walletRepository.save(wallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(wallet.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult reverseTransaction(Long walletId, Long transactionId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLET");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        WalletTransaction transaction = wallet.getTransactions().stream()
            .filter(t -> t.getId().equals(transactionId))
            .findFirst()
            .orElseThrow(() -> new org.apache.fineract.portfolio.wallet.exception.WalletTransactionNotFoundException(walletId, transactionId));

        if (transaction.getReversed()) {
            throw new org.apache.fineract.infrastructure.core.exception.PlatformApiDataValidationException(
                "error.msg.transaction.already.reversed",
                "Transaction " + transactionId + " has already been reversed",
                transactionId);
        }

        // Reverse the transaction based on type
        BigDecimal amount = transaction.getAmount();
        if (transaction.getTransactionType().equals(DEPOSIT) || transaction.getTransactionType().equals(TRANSFER_IN)) {
            // Reverse deposit/transfer-in: subtract from balance
            wallet.setBalance(wallet.getBalance().subtract(amount));
            wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        } else if (transaction.getTransactionType().equals(WITHDRAWAL) || transaction.getTransactionType().equals(TRANSFER_OUT) || transaction.getTransactionType().equals(PAYMENT)) {
            // Reverse withdrawal/transfer-out/payment: add back to balance
            wallet.setBalance(wallet.getBalance().add(amount));
            wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        }

        // Mark transaction as reversed
        transaction.setReversed(true);

        wallet = walletRepository.save(wallet);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(wallet.getId())
            .withSubEntityId(transactionId)
            .build();
    }

    private Integer calculateAlertSeverity(Integer reasonCode) {
        if (reasonCode == null) {
            return 2; // MEDIUM
        }
        switch (reasonCode) {
            case 1: // FRAUD
            case 4: // LEGAL
                return 4; // CRITICAL
            case 2: // COMPLIANCE
            case 5: // KYC_NON_COMPLIANCE
                return 3; // HIGH
            case 3: // SECURITY
            case 6: // SUSPICIOUS_ACTIVITY
                return 3; // HIGH
            default:
                return 2; // MEDIUM
        }
    }
    
    private void validateWalletActive(Wallet wallet) {
        if (wallet.isFrozen()) {
            throw new WalletFrozenException(wallet.getId());
        }
        if (wallet.isClosed()) {
            throw new WalletClosedException(wallet.getId());
        }
    }
}

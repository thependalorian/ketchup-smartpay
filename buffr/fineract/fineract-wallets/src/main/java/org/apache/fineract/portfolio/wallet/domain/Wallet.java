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
package org.apache.fineract.portfolio.wallet.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.fineract.infrastructure.core.domain.AbstractAuditableWithUTCDateTimeCustom;
import org.apache.fineract.infrastructure.core.domain.ExternalId;
import org.apache.fineract.portfolio.client.domain.Client;
import org.apache.fineract.portfolio.wallet.domain.WalletAuditLog;

/**
 * Wallet Entity
 * 
 * Purpose: Represents a digital wallet with instant transfers, USSD support, multi-channel sync
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/domain/Wallet.java
 * 
 * Features:
 * - Instant wallet-to-wallet transfers
 * - USSD access support
 * - Multi-channel synchronization (mobile app, USSD, SMS)
 * - Real-time balance updates
 * - P2P transfers, merchant payments, bill payments
 * - Bank transfers, cash-out support
 * - PIN management for USSD
 * - External ID for Buffr linking
 */
@Entity
@Table(name = "m_wallet", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "wallet_no" }, name = "wallet_no_UNIQUE"),
    @UniqueConstraint(columnNames = { "external_id" }, name = "wallet_externalid_UNIQUE")
})
@Getter
@Setter
@NoArgsConstructor
public class Wallet extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @Column(name = "wallet_no", length = 20, unique = true, nullable = false)
    private String walletNumber;
    
    @Embedded
    @Column(name = "external_id", length = 100, unique = true)
    private ExternalId externalId;  // Buffr user ID (format: buffr_user_{userId})
    
    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private WalletProduct product;
    
    @Column(name = "balance", nullable = false, precision = 19, scale = 6)
    private BigDecimal balance;
    
    @Column(name = "available_balance", nullable = false, precision = 19, scale = 6)
    private BigDecimal availableBalance;  // Balance minus holds/locks
    
    @Column(name = "currency_code", length = 3, nullable = false)
    private String currencyCode;
    
    @Column(name = "status_enum", nullable = false)
    private Integer status;  // ACTIVE(300), FROZEN(400), CLOSED(600)
    
    @Column(name = "pin_hash", length = 255)
    private String pinHash;  // 4-digit PIN hash for USSD
    
    @Column(name = "pin_attempts", nullable = false)
    private Integer pinAttempts;
    
    @Column(name = "pin_locked_until")
    private LocalDateTime pinLockedUntil;
    
    @Column(name = "ussd_enabled", nullable = false)
    private Boolean ussdEnabled;  // USSD access enabled
    
    @Column(name = "last_sync_channel")
    private String lastSyncChannel;  // "mobile_app", "ussd", "sms"
    
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;
    
    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL)
    @OrderBy("transactionDate DESC, id DESC")
    private List<WalletTransaction> transactions = new ArrayList<>();
    
    // Security and Compliance Fields
    @Column(name = "kyc_level")
    private Integer kycLevel;  // KYC verification level: 0=Not verified, 1=Basic, 2=Enhanced, 3=Full
    
    @Column(name = "risk_score")
    private Integer riskScore;  // Risk score: 1=LOW, 2=MEDIUM, 3=HIGH, 4=CRITICAL
    
    @Column(name = "compliance_status_enum")
    private Integer complianceStatus;  // COMPLIANT(100), NON_COMPLIANT(200), UNDER_REVIEW(300)
    
    @Column(name = "freeze_reason_code_enum")
    private Integer freezeReasonCode;  // FRAUD(1), COMPLIANCE(2), SECURITY(3), LEGAL(4), KYC_NON_COMPLIANCE(5), SUSPICIOUS_ACTIVITY(6)
    
    @Column(name = "frozen_at")
    private LocalDateTime frozenAt;
    
    @Column(name = "frozen_until")
    private LocalDateTime frozenUntil;  // Auto-unfreeze date
    
    @Column(name = "freeze_duration_days")
    private Integer freezeDurationDays;
    
    @Column(name = "unfreeze_requires_approval", nullable = false)
    private Boolean unfreezeRequiresApproval = false;
    
    @Column(name = "unfreeze_approved_by")
    private Long unfreezeApprovedBy;
    
    @Column(name = "unfreeze_approved_at")
    private LocalDateTime unfreezeApprovedAt;
    
    @Column(name = "last_risk_assessment_at")
    private LocalDateTime lastRiskAssessmentAt;
    
    @Column(name = "last_compliance_check_at")
    private LocalDateTime lastComplianceCheckAt;
    
    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL)
    @OrderBy("createdDate DESC")
    private List<WalletAuditLog> auditLogs = new ArrayList<>();
    
    // Business logic methods
    public boolean isActive() {
        return this.status != null && this.status == 300; // ACTIVE
    }
    
    public boolean isFrozen() {
        return this.status != null && this.status == 400; // FROZEN
    }
    
    public boolean isClosed() {
        return this.status != null && this.status == 600; // CLOSED
    }
    
    public boolean hasSufficientBalance(BigDecimal amount) {
        return this.availableBalance.compareTo(amount) >= 0;
    }
    
    public boolean isCompliant() {
        return this.complianceStatus != null && this.complianceStatus == 100; // COMPLIANT
    }
    
    public boolean requiresUnfreezeApproval() {
        return this.unfreezeRequiresApproval != null && this.unfreezeRequiresApproval;
    }
    
    public boolean isFrozenExpired() {
        if (this.frozenUntil == null) {
            return false;
        }
        return LocalDateTime.now().isAfter(this.frozenUntil);
    }
}

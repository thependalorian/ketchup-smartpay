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

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.fineract.infrastructure.core.domain.AbstractAuditableWithUTCDateTimeCustom;

/**
 * WalletAuditLog Entity
 * 
 * Purpose: Tracks all security-related actions on wallets (freeze/unfreeze, compliance checks, fraud alerts)
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/domain/WalletAuditLog.java
 * 
 * Security Features:
 * - Freeze/unfreeze actions with reason codes
 * - Transaction monitoring alerts
 * - Compliance checks
 * - KYC updates
 * - Risk score changes
 */
@Entity
@Table(name = "m_wallet_audit_log")
@Getter
@Setter
@NoArgsConstructor
public class WalletAuditLog extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @ManyToOne
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;
    
    @Column(name = "action_type_enum", nullable = false)
    private Integer actionType;  // FREEZE(1), UNFREEZE(2), COMPLIANCE_CHECK(3), FRAUD_ALERT(4), KYC_UPDATE(5), RISK_SCORE_UPDATE(6)
    
    @Column(name = "reason_code_enum")
    private Integer reasonCode;  // FRAUD(1), COMPLIANCE(2), SECURITY(3), LEGAL(4), KYC_NON_COMPLIANCE(5), SUSPICIOUS_ACTIVITY(6)
    
    @Column(name = "description", length = 1000)
    private String description;
    
    @Column(name = "freeze_duration_days")
    private Integer freezeDurationDays;  // For freeze actions
    
    @Column(name = "unfreeze_approved_by")
    private Long unfreezeApprovedBy;  // User ID who approved unfreeze
    
    @Column(name = "unfreeze_approved_at")
    private LocalDateTime unfreezeApprovedAt;
    
    @Column(name = "risk_score_before")
    private Integer riskScoreBefore;
    
    @Column(name = "risk_score_after")
    private Integer riskScoreAfter;
    
    @Column(name = "kyc_level_before")
    private Integer kycLevelBefore;
    
    @Column(name = "kyc_level_after")
    private Integer kycLevelAfter;
    
    @Column(name = "transaction_id")
    private Long transactionId;  // If related to a specific transaction
    
    @Column(name = "alert_severity_enum")
    private Integer alertSeverity;  // LOW(1), MEDIUM(2), HIGH(3), CRITICAL(4)
    
    @Column(name = "resolved", nullable = false)
    private Boolean resolved = false;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;
    
    @Column(name = "resolved_by")
    private Long resolvedBy;
    
    @Column(name = "resolution_notes", length = 1000)
    private String resolutionNotes;
}

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
package org.apache.fineract.portfolio.voucher.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.fineract.infrastructure.core.domain.AbstractAuditableWithUTCDateTimeCustom;

/**
 * VoucherRedemption Entity
 * 
 * Purpose: Tracks voucher redemption audit trail
 * Location: fineract-voucher/src/main/java/org/apache/fineract/portfolio/voucher/domain/VoucherRedemption.java
 */
@Entity
@Table(name = "m_voucher_redemption")
@Getter
@Setter
@NoArgsConstructor
public class VoucherRedemption extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @ManyToOne
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;
    
    @Column(name = "redemption_method_enum", nullable = false)
    private Integer redemptionMethod;  // WALLET(1), CASH_OUT(2), BANK_TRANSFER(3), MERCHANT(4)
    
    @Column(name = "amount", nullable = false, precision = 19, scale = 6)
    private BigDecimal amount;
    
    @Column(name = "redemption_date", nullable = false)
    private LocalDate redemptionDate;
    
    @Column(name = "transaction_id")
    private Long transactionId;  // Link to m_savings_account_transaction or m_wallet_transaction
    
    @Column(name = "trust_account_debited", nullable = false)
    private Boolean trustAccountDebited;
    
    @Column(name = "bank_account_encrypted", columnDefinition = "text")
    private String bankAccountEncrypted;  // For bank transfer redemptions
    
    @Column(name = "merchant_id")
    private Long merchantId;  // For merchant payment redemptions
}

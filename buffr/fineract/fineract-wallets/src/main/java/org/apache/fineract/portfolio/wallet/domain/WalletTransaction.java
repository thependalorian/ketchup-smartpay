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
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.fineract.infrastructure.core.domain.AbstractAuditableWithUTCDateTimeCustom;

/**
 * WalletTransaction Entity
 * 
 * Purpose: Tracks all wallet transactions
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/domain/WalletTransaction.java
 */
@Entity
@Table(name = "m_wallet_transaction")
@Getter
@Setter
@NoArgsConstructor
public class WalletTransaction extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @ManyToOne
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;
    
    @Column(name = "transaction_type_enum", nullable = false)
    private Integer transactionType;  // DEPOSIT(1), WITHDRAWAL(2), TRANSFER_OUT(3), TRANSFER_IN(4), PAYMENT(5)
    
    @Column(name = "amount", nullable = false, precision = 19, scale = 6)
    private BigDecimal amount;
    
    @Column(name = "balance_after", nullable = false, precision = 19, scale = 6)
    private BigDecimal balanceAfter;
    
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;
    
    @Column(name = "reference", length = 100)
    private String reference;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "channel_enum")
    private Integer channel;  // MOBILE_APP(1), USSD(2), SMS(3), API(4)
    
    @Column(name = "counterparty_wallet_id")
    private Long counterpartyWalletId;  // For P2P transfers
    
    @Column(name = "merchant_id")
    private Long merchantId;  // For merchant payments
    
    @Column(name = "bank_account_encrypted", columnDefinition = "text")
    private String bankAccountEncrypted;  // For bank transfers
    
    @Column(name = "ips_transaction_id", length = 100)
    private String ipsTransactionId;  // IPS transaction ID for wallet-to-wallet
    
    @Column(name = "reversed", nullable = false)
    private Boolean reversed = false;
}

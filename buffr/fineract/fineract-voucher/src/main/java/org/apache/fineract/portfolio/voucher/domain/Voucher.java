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

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.fineract.infrastructure.core.domain.AbstractAuditableWithUTCDateTimeCustom;
import org.apache.fineract.infrastructure.core.domain.ExternalId;
import org.apache.fineract.portfolio.client.domain.Client;

/**
 * Voucher Entity
 * 
 * Purpose: Represents a G2P voucher with full lifecycle management
 * Location: fineract-voucher/src/main/java/org/apache/fineract/portfolio/voucher/domain/Voucher.java
 * 
 * Features:
 * - Voucher lifecycle (Issued → Active → Redeemed → Expired)
 * - Expiry date tracking
 * - Multiple redemption methods
 * - Purpose code support (NamQR Purpose Code 18)
 * - Trust account debiting on redemption
 * - Real-time status sync with SmartPay
 * - External ID for Buffr linking
 */
@Entity
@Table(name = "m_voucher", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "voucher_code" }, name = "voucher_code_UNIQUE"),
    @UniqueConstraint(columnNames = { "external_id" }, name = "voucher_externalid_UNIQUE")
})
@Getter
@Setter
@NoArgsConstructor
public class Voucher extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @Column(name = "voucher_code", length = 50, unique = true, nullable = false)
    private String voucherCode;
    
    @Embedded
    @Column(name = "external_id", length = 100, unique = true)
    private ExternalId externalId;  // Buffr voucher ID (format: buffr_voucher_{voucherId})
    
    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;  // Beneficiary
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private VoucherProduct product;  // Voucher product type
    
    @Column(name = "amount", nullable = false, precision = 19, scale = 6)
    private BigDecimal amount;
    
    @Column(name = "currency_code", length = 3, nullable = false)
    private String currencyCode;
    
    @Column(name = "status_enum", nullable = false)
    private Integer status;  // ISSUED(100), ACTIVE(200), REDEEMED(300), EXPIRED(400)
    
    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;
    
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
    
    @Column(name = "redeemed_date")
    private LocalDate redeemedDate;
    
    @Column(name = "redemption_method_enum")
    private Integer redemptionMethod;  // WALLET(1), CASH_OUT(2), BANK_TRANSFER(3), MERCHANT(4)
    
    @Column(name = "purpose_code", length = 2)
    private String purposeCode;  // NamQR Purpose Code 18
    
    @Column(name = "namqr_data", columnDefinition = "jsonb")
    private String namqrData;  // NamQR TLV data
    
    @Column(name = "token_vault_id", length = 100)
    private String tokenVaultId;  // Token Vault ID for QR validation
    
    @Column(name = "smartpay_sync_status_enum")
    private Integer smartpaySyncStatus;  // PENDING(100), SYNCED(200), FAILED(300)
    
    @OneToMany(mappedBy = "voucher", cascade = CascadeType.ALL)
    private List<VoucherRedemption> redemptions = new ArrayList<>();
    
    // Business logic methods
    public boolean isActive() {
        return this.status != null && this.status == 200; // ACTIVE
    }
    
    public boolean isRedeemed() {
        return this.status != null && this.status == 300; // REDEEMED
    }
    
    public boolean isExpired() {
        return this.status != null && this.status == 400; // EXPIRED
    }
    
    public boolean isExpired(LocalDate currentDate) {
        return currentDate.isAfter(this.expiryDate);
    }
}

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
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.apache.fineract.infrastructure.core.domain.AbstractAuditableWithUTCDateTimeCustom;

/**
 * VoucherProduct Entity
 * 
 * Purpose: Defines voucher product types (Old Age, Disability, Child Support, etc.)
 * Location: fineract-voucher/src/main/java/org/apache/fineract/portfolio/voucher/domain/VoucherProduct.java
 */
@Entity
@Table(name = "m_voucher_product")
@Getter
@Setter
@NoArgsConstructor
public class VoucherProduct extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;  // "Old Age Grant", "Disability Grant", etc.
    
    @Column(name = "short_name", length = 4, nullable = false)
    private String shortName;  // "OAG", "DG", "CSG"
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "default_expiry_days", nullable = false)
    private Integer defaultExpiryDays;
    
    @Column(name = "purpose_code", length = 2, nullable = false)
    private String purposeCode;  // NamQR Purpose Code 18
    
    @Column(name = "active", nullable = false)
    private Boolean active;
}

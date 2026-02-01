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
package org.apache.fineract.portfolio.wallet.data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

/**
 * WalletData
 * 
 * Purpose: Data Transfer Object for Wallet entity
 */
@Data
public class WalletData {
    private Long id;
    private String walletNumber;
    private String externalId;
    private Long clientId;
    private Long productId;
    private BigDecimal balance;
    private BigDecimal availableBalance;
    private String currencyCode;
    private Integer status;
    private Boolean ussdEnabled;
    private String lastSyncChannel;
    private LocalDateTime lastSyncAt;
}

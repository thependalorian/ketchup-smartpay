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
import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.core.api.JsonCommand;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResult;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResultBuilder;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.wallet.domain.WalletProduct;
import org.apache.fineract.portfolio.wallet.domain.WalletProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * WalletProductWritePlatformServiceJpaRepositoryImpl
 * 
 * Purpose: Write operations implementation for wallet products
 */
@Service
@RequiredArgsConstructor
public class WalletProductWritePlatformServiceJpaRepositoryImpl implements WalletProductWritePlatformService {

    private final WalletProductRepository walletProductRepository;
    private final PlatformSecurityContext context;

    @Override
    @Transactional
    public CommandProcessingResult createWalletProduct(JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("WALLETPRODUCT");

        final String name = command.stringValueOfParameterNamed("name");
        final String shortName = command.stringValueOfParameterNamed("shortName");
        final String description = command.stringValueOfParameterNamed("description");
        final BigDecimal minBalance = command.bigDecimalValueOfParameterNamed("minBalance");
        final BigDecimal maxBalance = command.bigDecimalValueOfParameterNamed("maxBalance");
        final BigDecimal dailyTransferLimit = command.bigDecimalValueOfParameterNamed("dailyTransferLimit");
        final Boolean ussdSupported = command.booleanObjectValueOfParameterNamed("ussdSupported");
        final Boolean active = command.booleanObjectValueOfParameterNamed("active");

        WalletProduct product = new WalletProduct();
        product.setName(name);
        product.setShortName(shortName);
        product.setDescription(description);
        product.setMinBalance(minBalance);
        product.setMaxBalance(maxBalance);
        product.setDailyTransferLimit(dailyTransferLimit);
        product.setUssdSupported(ussdSupported != null ? ussdSupported : false);
        product.setActive(active != null ? active : true);

        product = walletProductRepository.save(product);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(product.getId())
            .build();
    }
}

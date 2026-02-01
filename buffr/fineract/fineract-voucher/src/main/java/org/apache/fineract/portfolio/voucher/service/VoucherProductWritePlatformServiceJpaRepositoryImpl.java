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
package org.apache.fineract.portfolio.voucher.service;

import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.core.api.JsonCommand;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResult;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResultBuilder;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.voucher.domain.VoucherProduct;
import org.apache.fineract.portfolio.voucher.domain.VoucherProductRepository;
import org.apache.fineract.portfolio.voucher.exception.VoucherProductNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * VoucherProductWritePlatformServiceJpaRepositoryImpl
 * 
 * Purpose: Write operations implementation for voucher products
 * Location: fineract-voucher/src/main/java/org/apache/fineract/portfolio/voucher/service/VoucherProductWritePlatformServiceJpaRepositoryImpl.java
 */
@Service
@RequiredArgsConstructor
public class VoucherProductWritePlatformServiceJpaRepositoryImpl implements VoucherProductWritePlatformService {

    private final VoucherProductRepository voucherProductRepository;
    private final PlatformSecurityContext context;

    @Override
    @Transactional
    public CommandProcessingResult createVoucherProduct(JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("VOUCHERPRODUCT");

        final String name = command.stringValueOfParameterNamed("name");
        final String shortName = command.stringValueOfParameterNamed("shortName");
        final String description = command.stringValueOfParameterNamed("description");
        final Integer defaultExpiryDays = command.integerValueOfParameterNamed("defaultExpiryDays");
        final String purposeCode = command.stringValueOfParameterNamed("purposeCode");
        final Boolean active = command.booleanObjectValueOfParameterNamed("active");

        VoucherProduct product = new VoucherProduct();
        product.setName(name);
        product.setShortName(shortName);
        product.setDescription(description);
        product.setDefaultExpiryDays(defaultExpiryDays);
        product.setPurposeCode(purposeCode);
        product.setActive(active != null ? active : true);

        product = voucherProductRepository.save(product);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(product.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult updateVoucherProduct(Long productId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("VOUCHERPRODUCT");

        VoucherProduct product = voucherProductRepository.findById(productId)
            .orElseThrow(() -> new VoucherProductNotFoundException(productId));

        if (command.parameterExists("name")) {
            product.setName(command.stringValueOfParameterNamed("name"));
        }
        if (command.parameterExists("shortName")) {
            product.setShortName(command.stringValueOfParameterNamed("shortName"));
        }
        if (command.parameterExists("description")) {
            product.setDescription(command.stringValueOfParameterNamed("description"));
        }
        if (command.parameterExists("defaultExpiryDays")) {
            product.setDefaultExpiryDays(command.integerValueOfParameterNamed("defaultExpiryDays"));
        }
        if (command.parameterExists("purposeCode")) {
            product.setPurposeCode(command.stringValueOfParameterNamed("purposeCode"));
        }
        if (command.parameterExists("active")) {
            product.setActive(command.booleanObjectValueOfParameterNamed("active"));
        }

        product = voucherProductRepository.save(product);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(product.getId())
            .build();
    }
}

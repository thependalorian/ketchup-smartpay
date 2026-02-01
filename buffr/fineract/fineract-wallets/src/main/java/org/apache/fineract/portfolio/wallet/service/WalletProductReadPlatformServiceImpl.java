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

import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.wallet.data.WalletProductData;
import org.apache.fineract.portfolio.wallet.domain.WalletProduct;
import org.apache.fineract.portfolio.wallet.domain.WalletProductRepository;
import org.apache.fineract.portfolio.wallet.exception.WalletProductNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * WalletProductReadPlatformServiceImpl
 * 
 * Purpose: Read operations implementation for wallet products
 */
@Service
@RequiredArgsConstructor
public class WalletProductReadPlatformServiceImpl implements WalletProductReadPlatformService {

    private final WalletProductRepository walletProductRepository;
    private final PlatformSecurityContext context;

    @Override
    @Transactional(readOnly = true)
    public WalletProductData retrieveOne(Long productId) {
        context.authenticatedUser().validateHasReadPermission("WALLETPRODUCT");
        
        WalletProduct product = walletProductRepository.findById(productId)
            .orElseThrow(() -> new WalletProductNotFoundException(productId));
        
        return mapToWalletProductData(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletProductData> retrieveAll() {
        context.authenticatedUser().validateHasReadPermission("WALLETPRODUCT");
        
        List<WalletProduct> products = walletProductRepository.findByActiveTrue();
        return products.stream()
            .map(this::mapToWalletProductData)
            .collect(Collectors.toList());
    }

    private WalletProductData mapToWalletProductData(WalletProduct product) {
        WalletProductData data = new WalletProductData();
        data.setId(product.getId());
        data.setName(product.getName());
        data.setShortName(product.getShortName());
        data.setDescription(product.getDescription());
        data.setMinBalance(product.getMinBalance());
        data.setMaxBalance(product.getMaxBalance());
        data.setDailyTransferLimit(product.getDailyTransferLimit());
        data.setUssdSupported(product.getUssdSupported());
        data.setActive(product.getActive());
        return data;
    }
}

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

import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.core.domain.ExternalId;
import org.apache.fineract.infrastructure.core.service.ExternalIdFactory;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.wallet.data.WalletData;
import org.apache.fineract.portfolio.wallet.domain.Wallet;
import org.apache.fineract.portfolio.wallet.domain.WalletRepository;
import org.apache.fineract.portfolio.wallet.exception.WalletNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * WalletReadPlatformServiceImpl
 * 
 * Purpose: Read operations implementation for wallets
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/service/WalletReadPlatformServiceImpl.java
 */
@Service
@RequiredArgsConstructor
public class WalletReadPlatformServiceImpl implements WalletReadPlatformService {

    private final WalletRepository walletRepository;
    private final PlatformSecurityContext context;

    @Override
    @Transactional(readOnly = true)
    public WalletData retrieveOne(Long walletId) {
        context.authenticatedUser().validateHasReadPermission("WALLET");
        
        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));
        
        return mapToWalletData(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public WalletData retrieveByExternalId(String externalId) {
        context.authenticatedUser().validateHasReadPermission("WALLET");
        
        ExternalId externalIdObj = ExternalIdFactory.produce(externalId);
        Wallet wallet = walletRepository.findByExternalId(externalIdObj)
            .orElseThrow(() -> new WalletNotFoundException(externalId));
        
        return mapToWalletData(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletData> retrieveAll(Long clientId, Integer status, Integer offset, Integer limit) {
        context.authenticatedUser().validateHasReadPermission("WALLET");

        Specification<Wallet> spec = Specification.where(null);

        if (clientId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("client").get("id"), clientId));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        List<Wallet> wallets = walletRepository.findAll(spec);

        // Apply pagination
        int start = offset != null ? offset : 0;
        int end = limit != null ? Math.min(start + limit, wallets.size()) : wallets.size();
        
        return wallets.subList(start, end).stream()
            .map(this::mapToWalletData)
            .collect(Collectors.toList());
    }

    private WalletData mapToWalletData(Wallet wallet) {
        WalletData data = new WalletData();
        data.setId(wallet.getId());
        data.setWalletNumber(wallet.getWalletNumber());
        data.setExternalId(wallet.getExternalId() != null ? wallet.getExternalId().getValue() : null);
        data.setClientId(wallet.getClient().getId());
        data.setProductId(wallet.getProduct().getId());
        data.setBalance(wallet.getBalance());
        data.setAvailableBalance(wallet.getAvailableBalance());
        data.setCurrencyCode(wallet.getCurrencyCode());
        data.setStatus(wallet.getStatus());
        data.setUssdEnabled(wallet.getUssdEnabled());
        data.setLastSyncChannel(wallet.getLastSyncChannel());
        data.setLastSyncAt(wallet.getLastSyncAt());
        return data;
    }
}

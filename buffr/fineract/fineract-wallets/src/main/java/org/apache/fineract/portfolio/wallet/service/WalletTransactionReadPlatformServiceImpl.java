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
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.apache.fineract.portfolio.wallet.data.WalletTransactionData;
import org.apache.fineract.portfolio.wallet.domain.Wallet;
import org.apache.fineract.portfolio.wallet.domain.WalletRepository;
import org.apache.fineract.portfolio.wallet.domain.WalletTransaction;
import org.apache.fineract.portfolio.wallet.exception.WalletNotFoundException;
import org.apache.fineract.portfolio.wallet.exception.WalletTransactionNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * WalletTransactionReadPlatformServiceImpl
 * 
 * Purpose: Read operations implementation for wallet transactions
 */
@Service
@RequiredArgsConstructor
public class WalletTransactionReadPlatformServiceImpl implements WalletTransactionReadPlatformService {

    private final WalletRepository walletRepository;
    private final PlatformSecurityContext context;

    @Override
    @Transactional(readOnly = true)
    public WalletTransactionData retrieveOne(Long walletId, Long transactionId) {
        context.authenticatedUser().validateHasReadPermission("WALLETTRANSACTION");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        WalletTransaction transaction = wallet.getTransactions().stream()
            .filter(t -> t.getId().equals(transactionId))
            .findFirst()
            .orElseThrow(() -> new WalletTransactionNotFoundException(walletId, transactionId));

        return mapToWalletTransactionData(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WalletTransactionData> retrieveAll(Long walletId, LocalDate fromDate, LocalDate toDate, Integer offset, Integer limit) {
        context.authenticatedUser().validateHasReadPermission("WALLETTRANSACTION");

        Wallet wallet = walletRepository.findById(walletId)
            .orElseThrow(() -> new WalletNotFoundException(walletId));

        List<WalletTransaction> transactions = wallet.getTransactions().stream()
            .filter(t -> {
                if (fromDate != null && t.getTransactionDate().isBefore(fromDate)) {
                    return false;
                }
                if (toDate != null && t.getTransactionDate().isAfter(toDate)) {
                    return false;
                }
                return true;
            })
            .collect(Collectors.toList());

        // Apply pagination
        int start = offset != null ? offset : 0;
        int end = limit != null ? Math.min(start + limit, transactions.size()) : transactions.size();
        
        return transactions.subList(start, end).stream()
            .map(this::mapToWalletTransactionData)
            .collect(Collectors.toList());
    }

    private WalletTransactionData mapToWalletTransactionData(WalletTransaction transaction) {
        WalletTransactionData data = new WalletTransactionData();
        data.setId(transaction.getId());
        data.setWalletId(transaction.getWallet().getId());
        data.setTransactionType(transaction.getTransactionType());
        data.setAmount(transaction.getAmount());
        data.setBalanceAfter(transaction.getBalanceAfter());
        data.setTransactionDate(transaction.getTransactionDate());
        data.setReference(transaction.getReference());
        data.setDescription(transaction.getDescription());
        data.setChannel(transaction.getChannel());
        data.setCounterpartyWalletId(transaction.getCounterpartyWalletId());
        data.setMerchantId(transaction.getMerchantId());
        data.setIpsTransactionId(transaction.getIpsTransactionId());
        data.setReversed(transaction.getReversed());
        return data;
    }
}

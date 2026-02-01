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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.core.api.JsonCommand;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResult;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResultBuilder;
import org.apache.fineract.infrastructure.core.domain.ExternalId;
import org.apache.fineract.infrastructure.core.service.ExternalIdFactory;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.client.domain.Client;
import org.apache.fineract.portfolio.client.domain.ClientRepository;
import org.apache.fineract.portfolio.client.exception.ClientNotFoundException;
import org.apache.fineract.portfolio.voucher.domain.Voucher;
import org.apache.fineract.portfolio.voucher.domain.VoucherProduct;
import org.apache.fineract.portfolio.voucher.domain.VoucherProductRepository;
import org.apache.fineract.portfolio.voucher.domain.VoucherRedemption;
import org.apache.fineract.portfolio.voucher.domain.VoucherRepository;
import org.apache.fineract.portfolio.voucher.exception.VoucherAlreadyRedeemedException;
import org.apache.fineract.portfolio.voucher.exception.VoucherExpiredException;
import org.apache.fineract.portfolio.voucher.exception.VoucherNotFoundException;
import org.apache.fineract.portfolio.voucher.exception.VoucherProductNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * VoucherWritePlatformServiceJpaRepositoryImpl
 * 
 * Purpose: Write operations implementation for vouchers
 * Location: fineract-voucher/src/main/java/org/apache/fineract/portfolio/voucher/service/VoucherWritePlatformServiceJpaRepositoryImpl.java
 */
@Service
@RequiredArgsConstructor
public class VoucherWritePlatformServiceJpaRepositoryImpl implements VoucherWritePlatformService {

    private final VoucherRepository voucherRepository;
    private final VoucherProductRepository voucherProductRepository;
    private final ClientRepository clientRepository;
    private final PlatformSecurityContext context;

    // Voucher status enums
    private static final Integer ISSUED = 100;
    private static final Integer ACTIVE = 200;
    private static final Integer REDEEMED = 300;
    private static final Integer EXPIRED = 400;

    // Redemption method enums
    private static final Integer WALLET = 1;
    private static final Integer CASH_OUT = 2;
    private static final Integer BANK_TRANSFER = 3;
    private static final Integer MERCHANT = 4;

    // SmartPay sync status enums
    private static final Integer PENDING = 100;
    private static final Integer SYNCED = 200;
    private static final Integer FAILED = 300;

    @Override
    @Transactional
    public CommandProcessingResult createVoucher(JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("VOUCHER");

        final Long clientId = command.longValueOfParameterNamed("clientId");
        final Long productId = command.longValueOfParameterNamed("productId");
        final BigDecimal amount = command.bigDecimalValueOfParameterNamed("amount");
        final String currencyCode = command.stringValueOfParameterNamed("currencyCode");
        final String externalId = command.stringValueOfParameterNamed("externalId");
        final String voucherCode = command.stringValueOfParameterNamed("voucherCode");
        final LocalDate issuedDate = command.localDateValueOfParameterNamed("issuedDate");
        final LocalDate expiryDate = command.localDateValueOfParameterNamed("expiryDate");
        final String purposeCode = command.stringValueOfParameterNamed("purposeCode");
        final String namqrData = command.stringValueOfParameterNamed("namqrData");
        final String tokenVaultId = command.stringValueOfParameterNamed("tokenVaultId");

        Client client = clientRepository.findById(clientId)
            .orElseThrow(() -> new ClientNotFoundException(clientId));

        VoucherProduct product = voucherProductRepository.findById(productId)
            .orElseThrow(() -> new VoucherProductNotFoundException(productId));

        // Generate voucher code if not provided
        String finalVoucherCode = voucherCode != null ? voucherCode : generateVoucherCode();

        Voucher voucher = new Voucher();
        voucher.setVoucherCode(finalVoucherCode);
        if (externalId != null) {
            voucher.setExternalId(ExternalIdFactory.produce(externalId));
        }
        voucher.setClient(client);
        voucher.setProduct(product);
        voucher.setAmount(amount);
        voucher.setCurrencyCode(currencyCode);
        voucher.setStatus(ACTIVE); // Automatically activated when created
        voucher.setIssuedDate(issuedDate != null ? issuedDate : LocalDate.now());
        voucher.setExpiryDate(expiryDate);
        voucher.setPurposeCode(purposeCode != null ? purposeCode : product.getPurposeCode());
        voucher.setNamqrData(namqrData);
        voucher.setTokenVaultId(tokenVaultId);
        voucher.setSmartpaySyncStatus(PENDING); // Initial sync status

        voucher = voucherRepository.save(voucher);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(voucher.getId())
            .withOfficeId(client.getOffice().getId())
            .withClientId(clientId)
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult redeemVoucher(Long voucherId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("VOUCHER");

        Voucher voucher = voucherRepository.findById(voucherId)
            .orElseThrow(() -> new VoucherNotFoundException(voucherId));

        // Validate voucher can be redeemed
        if (voucher.isRedeemed()) {
            throw new VoucherAlreadyRedeemedException(voucherId);
        }

        if (voucher.isExpired() || voucher.isExpired(LocalDate.now())) {
            throw new VoucherExpiredException(voucherId, voucher.getExpiryDate());
        }

        final Integer redemptionMethod = command.integerValueOfParameterNamed("redemptionMethod");
        final LocalDate redemptionDate = command.localDateValueOfParameterNamed("redemptionDate");
        final String transactionId = command.stringValueOfParameterNamed("transactionId");
        final Boolean trustAccountDebited = command.booleanObjectValueOfParameterNamed("trustAccountDebited");
        final String bankAccountEncrypted = command.stringValueOfParameterNamed("bankAccountEncrypted");
        final String merchantId = command.stringValueOfParameterNamed("merchantId");

        // Update voucher status
        voucher.setStatus(REDEEMED);
        voucher.setRedeemedDate(redemptionDate != null ? redemptionDate : LocalDate.now());
        voucher.setRedemptionMethod(redemptionMethod);

        // Create redemption record
        VoucherRedemption redemption = new VoucherRedemption();
        redemption.setVoucher(voucher);
        redemption.setRedemptionMethod(redemptionMethod);
        redemption.setAmount(voucher.getAmount());
        redemption.setRedemptionDate(voucher.getRedeemedDate());
        redemption.setTransactionId(transactionId);
        redemption.setTrustAccountDebited(trustAccountDebited != null ? trustAccountDebited : false);
        redemption.setBankAccountEncrypted(bankAccountEncrypted);
        redemption.setMerchantId(merchantId);

        voucher.getRedemptions().add(redemption);
        voucher = voucherRepository.save(voucher);

        // Note: Trust account debiting is handled by Buffr backend via Fineract savings account API
        // This module only tracks the redemption. The actual trust account debit happens in Buffr backend
        // which calls Fineract's legacy savings account transaction API.

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(voucher.getId())
            .withSubEntityId(redemption.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult expireVoucher(Long voucherId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("VOUCHER");

        Voucher voucher = voucherRepository.findById(voucherId)
            .orElseThrow(() -> new VoucherNotFoundException(voucherId));

        if (voucher.isRedeemed()) {
            throw new VoucherAlreadyRedeemedException(voucherId);
        }

        voucher.setStatus(EXPIRED);
        voucher = voucherRepository.save(voucher);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(voucher.getId())
            .build();
    }

    @Override
    @Transactional
    public CommandProcessingResult updateSmartPaySyncStatus(Long voucherId, JsonCommand command) {
        context.authenticatedUser().validateHasWritePermission("VOUCHER");

        Voucher voucher = voucherRepository.findById(voucherId)
            .orElseThrow(() -> new VoucherNotFoundException(voucherId));

        final Integer syncStatus = command.integerValueOfParameterNamed("smartpaySyncStatus");
        voucher.setSmartpaySyncStatus(syncStatus);
        voucher = voucherRepository.save(voucher);

        return new CommandProcessingResultBuilder()
            .withCommandId(command.commandId())
            .withEntityId(voucher.getId())
            .build();
    }

    private String generateVoucherCode() {
        // Generate unique voucher code (format: VCH-{UUID})
        return "VCH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}

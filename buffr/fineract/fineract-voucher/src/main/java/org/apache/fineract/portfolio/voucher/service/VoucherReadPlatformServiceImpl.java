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

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.core.domain.ExternalId;
import org.apache.fineract.infrastructure.core.service.ExternalIdFactory;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.voucher.data.VoucherData;
import org.apache.fineract.portfolio.voucher.domain.Voucher;
import org.apache.fineract.portfolio.voucher.domain.VoucherRepository;
import org.apache.fineract.portfolio.voucher.exception.VoucherNotFoundException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * VoucherReadPlatformServiceImpl
 * 
 * Purpose: Read operations implementation for vouchers
 * Location: fineract-voucher/src/main/java/org/apache/fineract/portfolio/voucher/service/VoucherReadPlatformServiceImpl.java
 */
@Service
@RequiredArgsConstructor
public class VoucherReadPlatformServiceImpl implements VoucherReadPlatformService {

    private final VoucherRepository voucherRepository;
    private final PlatformSecurityContext context;

    @Override
    @Transactional(readOnly = true)
    public VoucherData retrieveOne(Long voucherId) {
        context.authenticatedUser().validateHasReadPermission("VOUCHER");
        
        Voucher voucher = voucherRepository.findById(voucherId)
            .orElseThrow(() -> new VoucherNotFoundException(voucherId));
        
        return mapToVoucherData(voucher);
    }

    @Override
    @Transactional(readOnly = true)
    public VoucherData retrieveByExternalId(String externalId) {
        context.authenticatedUser().validateHasReadPermission("VOUCHER");
        
        ExternalId externalIdObj = ExternalIdFactory.produce(externalId);
        Voucher voucher = voucherRepository.findByExternalId(externalIdObj)
            .orElseThrow(() -> new VoucherNotFoundException(externalId));
        
        return mapToVoucherData(voucher);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherData> retrieveAll(Long clientId, Integer status, LocalDate expiryDate, Integer offset, Integer limit) {
        context.authenticatedUser().validateHasReadPermission("VOUCHER");

        Specification<Voucher> spec = Specification.where(null);

        if (clientId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("client").get("id"), clientId));
        }

        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        if (expiryDate != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("expiryDate"), expiryDate));
        }

        List<Voucher> vouchers = voucherRepository.findAll(spec);

        // Apply pagination
        int start = offset != null ? offset : 0;
        int end = limit != null ? Math.min(start + limit, vouchers.size()) : vouchers.size();
        
        return vouchers.subList(start, end).stream()
            .map(this::mapToVoucherData)
            .collect(Collectors.toList());
    }

    private VoucherData mapToVoucherData(Voucher voucher) {
        VoucherData data = new VoucherData();
        data.setId(voucher.getId());
        data.setVoucherCode(voucher.getVoucherCode());
        data.setExternalId(voucher.getExternalId() != null ? voucher.getExternalId().getValue() : null);
        data.setClientId(voucher.getClient().getId());
        data.setProductId(voucher.getProduct().getId());
        data.setAmount(voucher.getAmount());
        data.setCurrencyCode(voucher.getCurrencyCode());
        data.setStatus(voucher.getStatus());
        data.setIssuedDate(voucher.getIssuedDate());
        data.setExpiryDate(voucher.getExpiryDate());
        data.setRedeemedDate(voucher.getRedeemedDate());
        data.setRedemptionMethod(voucher.getRedemptionMethod());
        data.setPurposeCode(voucher.getPurposeCode());
        data.setNamqrData(voucher.getNamqrData());
        data.setTokenVaultId(voucher.getTokenVaultId());
        data.setSmartpaySyncStatus(voucher.getSmartpaySyncStatus());
        return data;
    }
}

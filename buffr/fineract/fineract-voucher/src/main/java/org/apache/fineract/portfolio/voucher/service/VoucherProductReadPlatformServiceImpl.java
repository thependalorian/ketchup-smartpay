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

import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.voucher.data.VoucherProductData;
import org.apache.fineract.portfolio.voucher.domain.VoucherProduct;
import org.apache.fineract.portfolio.voucher.domain.VoucherProductRepository;
import org.apache.fineract.portfolio.voucher.exception.VoucherProductNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * VoucherProductReadPlatformServiceImpl
 * 
 * Purpose: Read operations implementation for voucher products
 */
@Service
@RequiredArgsConstructor
public class VoucherProductReadPlatformServiceImpl implements VoucherProductReadPlatformService {

    private final VoucherProductRepository voucherProductRepository;
    private final PlatformSecurityContext context;

    @Override
    @Transactional(readOnly = true)
    public VoucherProductData retrieveOne(Long productId) {
        context.authenticatedUser().validateHasReadPermission("VOUCHERPRODUCT");
        
        VoucherProduct product = voucherProductRepository.findById(productId)
            .orElseThrow(() -> new VoucherProductNotFoundException(productId));
        
        return mapToVoucherProductData(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VoucherProductData> retrieveAll() {
        context.authenticatedUser().validateHasReadPermission("VOUCHERPRODUCT");
        
        List<VoucherProduct> products = voucherProductRepository.findByActiveTrue();
        return products.stream()
            .map(this::mapToVoucherProductData)
            .collect(Collectors.toList());
    }

    private VoucherProductData mapToVoucherProductData(VoucherProduct product) {
        VoucherProductData data = new VoucherProductData();
        data.setId(product.getId());
        data.setName(product.getName());
        data.setShortName(product.getShortName());
        data.setDescription(product.getDescription());
        data.setDefaultExpiryDays(product.getDefaultExpiryDays());
        data.setPurposeCode(product.getPurposeCode());
        data.setActive(product.getActive());
        return data;
    }
}

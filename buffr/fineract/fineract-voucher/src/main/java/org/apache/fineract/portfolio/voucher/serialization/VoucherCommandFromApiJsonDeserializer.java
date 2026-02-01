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
package org.apache.fineract.portfolio.voucher.serialization;

import com.google.gson.JsonElement;
import com.google.gson.reflect.TypeToken;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.lang3.StringUtils;
import org.apache.fineract.infrastructure.core.data.ApiParameterError;
import org.apache.fineract.infrastructure.core.data.DataValidatorBuilder;
import org.apache.fineract.infrastructure.core.exception.InvalidJsonException;
import org.apache.fineract.infrastructure.core.exception.PlatformApiDataValidationException;
import org.apache.fineract.infrastructure.core.serialization.FromJsonHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * VoucherCommandFromApiJsonDeserializer
 * 
 * Purpose: Validates and deserializes voucher commands from JSON
 * Location: fineract-voucher/src/main/java/org/apache/fineract/portfolio/voucher/serialization/VoucherCommandFromApiJsonDeserializer.java
 */
@Component
public final class VoucherCommandFromApiJsonDeserializer {

    public static final String CLIENT_ID = "clientId";
    public static final String PRODUCT_ID = "productId";
    public static final String AMOUNT = "amount";
    public static final String CURRENCY_CODE = "currencyCode";
    public static final String EXTERNAL_ID = "externalId";
    public static final String VOUCHER_CODE = "voucherCode";
    public static final String ISSUED_DATE = "issuedDate";
    public static final String EXPIRY_DATE = "expiryDate";
    public static final String PURPOSE_CODE = "purposeCode";
    public static final String NAMQR_DATA = "namqrData";
    public static final String TOKEN_VAULT_ID = "tokenVaultId";
    public static final String REDEMPTION_METHOD = "redemptionMethod";
    public static final String REDEMPTION_DATE = "redemptionDate";
    public static final String TRANSACTION_ID = "transactionId";
    public static final String TRUST_ACCOUNT_DEBITED = "trustAccountDebited";
    public static final String BANK_ACCOUNT_ENCRYPTED = "bankAccountEncrypted";
    public static final String MERCHANT_ID = "merchantId";
    public static final String SMARTPAY_SYNC_STATUS = "smartpaySyncStatus";
    public static final String LOCALE = "locale";
    public static final String DATE_FORMAT = "dateFormat";

    private static final Set<String> CREATE_VOUCHER_PARAMETERS = new HashSet<>(Arrays.asList(
        CLIENT_ID, PRODUCT_ID, AMOUNT, CURRENCY_CODE, EXTERNAL_ID, VOUCHER_CODE,
        ISSUED_DATE, EXPIRY_DATE, PURPOSE_CODE, NAMQR_DATA, TOKEN_VAULT_ID,
        LOCALE, DATE_FORMAT
    ));

    private static final Set<String> REDEEM_VOUCHER_PARAMETERS = new HashSet<>(Arrays.asList(
        REDEMPTION_METHOD, REDEMPTION_DATE, TRANSACTION_ID, TRUST_ACCOUNT_DEBITED,
        BANK_ACCOUNT_ENCRYPTED, MERCHANT_ID, LOCALE, DATE_FORMAT
    ));

    private static final Set<String> UPDATE_SMARTPAY_STATUS_PARAMETERS = new HashSet<>(Arrays.asList(
        SMARTPAY_SYNC_STATUS
    ));

    public static final String VOUCHER = "voucher";

    private final FromJsonHelper fromApiJsonHelper;

    @Autowired
    public VoucherCommandFromApiJsonDeserializer(final FromJsonHelper fromApiJsonHelper) {
        this.fromApiJsonHelper = fromApiJsonHelper;
    }

    public void validateForCreate(final String json) {
        if (StringUtils.isBlank(json)) {
            throw new InvalidJsonException();
        }

        final Type typeOfMap = new TypeToken<Map<String, Object>>() {}.getType();
        this.fromApiJsonHelper.checkForUnsupportedParameters(typeOfMap, json, CREATE_VOUCHER_PARAMETERS);

        final List<ApiParameterError> dataValidationErrors = new ArrayList<>();
        final DataValidatorBuilder baseDataValidator = new DataValidatorBuilder(dataValidationErrors).resource(VOUCHER);

        final JsonElement element = this.fromApiJsonHelper.parse(json);

        final Long clientId = this.fromApiJsonHelper.extractLongNamed(CLIENT_ID, element);
        baseDataValidator.reset().parameter(CLIENT_ID).value(clientId).notNull().integerGreaterThanZero();

        final Long productId = this.fromApiJsonHelper.extractLongNamed(PRODUCT_ID, element);
        baseDataValidator.reset().parameter(PRODUCT_ID).value(productId).notNull().integerGreaterThanZero();

        final String amount = this.fromApiJsonHelper.extractStringNamed(AMOUNT, element);
        baseDataValidator.reset().parameter(AMOUNT).value(amount).notBlank();

        final String currencyCode = this.fromApiJsonHelper.extractStringNamed(CURRENCY_CODE, element);
        baseDataValidator.reset().parameter(CURRENCY_CODE).value(currencyCode).notBlank().notExceedingLengthOf(3);

        final String externalId = this.fromApiJsonHelper.extractStringNamed(EXTERNAL_ID, element);
        baseDataValidator.reset().parameter(EXTERNAL_ID).value(externalId).notExceedingLengthOf(100);

        final String expiryDate = this.fromApiJsonHelper.extractStringNamed(EXPIRY_DATE, element);
        baseDataValidator.reset().parameter(EXPIRY_DATE).value(expiryDate).notBlank();

        throwExceptionIfValidationWarningsExist(dataValidationErrors);
    }

    public void validateForRedeem(final String json) {
        if (StringUtils.isBlank(json)) {
            throw new InvalidJsonException();
        }

        final Type typeOfMap = new TypeToken<Map<String, Object>>() {}.getType();
        this.fromApiJsonHelper.checkForUnsupportedParameters(typeOfMap, json, REDEEM_VOUCHER_PARAMETERS);

        final List<ApiParameterError> dataValidationErrors = new ArrayList<>();
        final DataValidatorBuilder baseDataValidator = new DataValidatorBuilder(dataValidationErrors).resource(VOUCHER);

        final JsonElement element = this.fromApiJsonHelper.parse(json);

        final Integer redemptionMethod = this.fromApiJsonHelper.extractIntegerNamed(REDEMPTION_METHOD, element, LOCALE);
        baseDataValidator.reset().parameter(REDEMPTION_METHOD).value(redemptionMethod).notNull().inMinMaxRange(1, 4);

        throwExceptionIfValidationWarningsExist(dataValidationErrors);
    }

    public void validateForUpdateSmartPayStatus(final String json) {
        if (StringUtils.isBlank(json)) {
            throw new InvalidJsonException();
        }

        final Type typeOfMap = new TypeToken<Map<String, Object>>() {}.getType();
        this.fromApiJsonHelper.checkForUnsupportedParameters(typeOfMap, json, UPDATE_SMARTPAY_STATUS_PARAMETERS);

        final List<ApiParameterError> dataValidationErrors = new ArrayList<>();
        final DataValidatorBuilder baseDataValidator = new DataValidatorBuilder(dataValidationErrors).resource(VOUCHER);

        final JsonElement element = this.fromApiJsonHelper.parse(json);

        final Integer syncStatus = this.fromApiJsonHelper.extractIntegerNamed(SMARTPAY_SYNC_STATUS, element, LOCALE);
        baseDataValidator.reset().parameter(SMARTPAY_SYNC_STATUS).value(syncStatus).notNull().inMinMaxRange(100, 300);

        throwExceptionIfValidationWarningsExist(dataValidationErrors);
    }

    private void throwExceptionIfValidationWarningsExist(final List<ApiParameterError> dataValidationErrors) {
        if (!dataValidationErrors.isEmpty()) {
            throw new PlatformApiDataValidationException("validation.msg.validation.errors.exist", "Validation errors exist.",
                    dataValidationErrors);
        }
    }
}

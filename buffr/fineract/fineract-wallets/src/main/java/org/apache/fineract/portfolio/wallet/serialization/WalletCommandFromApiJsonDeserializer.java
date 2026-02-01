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
package org.apache.fineract.portfolio.wallet.serialization;

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
 * WalletCommandFromApiJsonDeserializer
 * 
 * Purpose: Validates and deserializes wallet commands from JSON
 * Location: fineract-wallets/src/main/java/org/apache/fineract/portfolio/wallet/serialization/WalletCommandFromApiJsonDeserializer.java
 */
@Component
public final class WalletCommandFromApiJsonDeserializer {

    public static final String CLIENT_ID = "clientId";
    public static final String PRODUCT_ID = "productId";
    public static final String CURRENCY_CODE = "currencyCode";
    public static final String EXTERNAL_ID = "externalId";
    public static final String WALLET_NUMBER = "walletNumber";
    public static final String USSD_ENABLED = "ussdEnabled";
    public static final String AMOUNT = "amount";
    public static final String TRANSACTION_DATE = "transactionDate";
    public static final String REFERENCE = "reference";
    public static final String DESCRIPTION = "description";
    public static final String CHANNEL = "channel";
    public static final String TO_WALLET_ID = "toWalletId";
    public static final String IPS_TRANSACTION_ID = "ipsTransactionId";
    public static final String LOCALE = "locale";
    public static final String DATE_FORMAT = "dateFormat";

    private static final Set<String> CREATE_WALLET_PARAMETERS = new HashSet<>(Arrays.asList(
        CLIENT_ID, PRODUCT_ID, CURRENCY_CODE, EXTERNAL_ID, WALLET_NUMBER, USSD_ENABLED,
        LOCALE, DATE_FORMAT
    ));

    private static final Set<String> DEPOSIT_PARAMETERS = new HashSet<>(Arrays.asList(
        AMOUNT, TRANSACTION_DATE, REFERENCE, DESCRIPTION, CHANNEL, LOCALE, DATE_FORMAT
    ));

    private static final Set<String> WITHDRAW_PARAMETERS = new HashSet<>(Arrays.asList(
        AMOUNT, TRANSACTION_DATE, REFERENCE, DESCRIPTION, CHANNEL, LOCALE, DATE_FORMAT
    ));

    private static final Set<String> TRANSFER_PARAMETERS = new HashSet<>(Arrays.asList(
        TO_WALLET_ID, AMOUNT, TRANSACTION_DATE, REFERENCE, DESCRIPTION, CHANNEL,
        IPS_TRANSACTION_ID, LOCALE, DATE_FORMAT
    ));

    public static final String WALLET = "wallet";

    private final FromJsonHelper fromApiJsonHelper;

    @Autowired
    public WalletCommandFromApiJsonDeserializer(final FromJsonHelper fromApiJsonHelper) {
        this.fromApiJsonHelper = fromApiJsonHelper;
    }

    public void validateForCreate(final String json) {
        if (StringUtils.isBlank(json)) {
            throw new InvalidJsonException();
        }

        final Type typeOfMap = new TypeToken<Map<String, Object>>() {}.getType();
        this.fromApiJsonHelper.checkForUnsupportedParameters(typeOfMap, json, CREATE_WALLET_PARAMETERS);

        final List<ApiParameterError> dataValidationErrors = new ArrayList<>();
        final DataValidatorBuilder baseDataValidator = new DataValidatorBuilder(dataValidationErrors).resource(WALLET);

        final JsonElement element = this.fromApiJsonHelper.parse(json);

        final Long clientId = this.fromApiJsonHelper.extractLongNamed(CLIENT_ID, element);
        baseDataValidator.reset().parameter(CLIENT_ID).value(clientId).notNull().integerGreaterThanZero();

        final Long productId = this.fromApiJsonHelper.extractLongNamed(PRODUCT_ID, element);
        baseDataValidator.reset().parameter(PRODUCT_ID).value(productId).notNull().integerGreaterThanZero();

        final String currencyCode = this.fromApiJsonHelper.extractStringNamed(CURRENCY_CODE, element);
        baseDataValidator.reset().parameter(CURRENCY_CODE).value(currencyCode).notBlank().notExceedingLengthOf(3);

        final String externalId = this.fromApiJsonHelper.extractStringNamed(EXTERNAL_ID, element);
        baseDataValidator.reset().parameter(EXTERNAL_ID).value(externalId).notExceedingLengthOf(100);

        throwExceptionIfValidationWarningsExist(dataValidationErrors);
    }

    public void validateForDeposit(final String json) {
        if (StringUtils.isBlank(json)) {
            throw new InvalidJsonException();
        }

        final Type typeOfMap = new TypeToken<Map<String, Object>>() {}.getType();
        this.fromApiJsonHelper.checkForUnsupportedParameters(typeOfMap, json, DEPOSIT_PARAMETERS);

        final List<ApiParameterError> dataValidationErrors = new ArrayList<>();
        final DataValidatorBuilder baseDataValidator = new DataValidatorBuilder(dataValidationErrors).resource(WALLET);

        final JsonElement element = this.fromApiJsonHelper.parse(json);

        final String amount = this.fromApiJsonHelper.extractStringNamed(AMOUNT, element);
        baseDataValidator.reset().parameter(AMOUNT).value(amount).notBlank();

        final String transactionDate = this.fromApiJsonHelper.extractStringNamed(TRANSACTION_DATE, element);
        baseDataValidator.reset().parameter(TRANSACTION_DATE).value(transactionDate).notBlank();

        throwExceptionIfValidationWarningsExist(dataValidationErrors);
    }

    public void validateForWithdraw(final String json) {
        if (StringUtils.isBlank(json)) {
            throw new InvalidJsonException();
        }

        final Type typeOfMap = new TypeToken<Map<String, Object>>() {}.getType();
        this.fromApiJsonHelper.checkForUnsupportedParameters(typeOfMap, json, WITHDRAW_PARAMETERS);

        final List<ApiParameterError> dataValidationErrors = new ArrayList<>();
        final DataValidatorBuilder baseDataValidator = new DataValidatorBuilder(dataValidationErrors).resource(WALLET);

        final JsonElement element = this.fromApiJsonHelper.parse(json);

        final String amount = this.fromApiJsonHelper.extractStringNamed(AMOUNT, element);
        baseDataValidator.reset().parameter(AMOUNT).value(amount).notBlank();

        final String transactionDate = this.fromApiJsonHelper.extractStringNamed(TRANSACTION_DATE, element);
        baseDataValidator.reset().parameter(TRANSACTION_DATE).value(transactionDate).notBlank();

        throwExceptionIfValidationWarningsExist(dataValidationErrors);
    }

    public void validateForTransfer(final String json) {
        if (StringUtils.isBlank(json)) {
            throw new InvalidJsonException();
        }

        final Type typeOfMap = new TypeToken<Map<String, Object>>() {}.getType();
        this.fromApiJsonHelper.checkForUnsupportedParameters(typeOfMap, json, TRANSFER_PARAMETERS);

        final List<ApiParameterError> dataValidationErrors = new ArrayList<>();
        final DataValidatorBuilder baseDataValidator = new DataValidatorBuilder(dataValidationErrors).resource(WALLET);

        final JsonElement element = this.fromApiJsonHelper.parse(json);

        final Long toWalletId = this.fromApiJsonHelper.extractLongNamed(TO_WALLET_ID, element);
        baseDataValidator.reset().parameter(TO_WALLET_ID).value(toWalletId).notNull().integerGreaterThanZero();

        final String amount = this.fromApiJsonHelper.extractStringNamed(AMOUNT, element);
        baseDataValidator.reset().parameter(AMOUNT).value(amount).notBlank();

        final String transactionDate = this.fromApiJsonHelper.extractStringNamed(TRANSACTION_DATE, element);
        baseDataValidator.reset().parameter(TRANSACTION_DATE).value(transactionDate).notBlank();

        throwExceptionIfValidationWarningsExist(dataValidationErrors);
    }

    private void throwExceptionIfValidationWarningsExist(final List<ApiParameterError> dataValidationErrors) {
        if (!dataValidationErrors.isEmpty()) {
            throw new PlatformApiDataValidationException("validation.msg.validation.errors.exist", "Validation errors exist.",
                    dataValidationErrors);
        }
    }
}

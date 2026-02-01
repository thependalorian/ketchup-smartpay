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
package org.apache.fineract.portfolio.wallet.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.UriInfo;
import lombok.RequiredArgsConstructor;
import org.apache.fineract.commands.domain.CommandWrapper;
import org.apache.fineract.commands.service.CommandWrapperBuilder;
import org.apache.fineract.commands.service.PortfolioCommandSourceWritePlatformService;
import org.apache.fineract.infrastructure.core.api.ApiRequestParameterHelper;
import org.apache.fineract.infrastructure.core.data.CommandProcessingResult;
import org.apache.fineract.infrastructure.core.serialization.ApiRequestJsonSerializationSettings;
import org.apache.fineract.infrastructure.core.serialization.DefaultToApiJsonSerializer;
import java.time.LocalDate;
import java.util.List;
import org.apache.commons.lang3.StringUtils;
import org.apache.fineract.infrastructure.core.exception.UnrecognizedQueryParamException;
import org.apache.fineract.infrastructure.core.service.CommandParameterUtil;
import org.apache.fineract.infrastructure.core.service.DateUtils;
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import org.apache.fineract.portfolio.wallet.data.WalletTransactionData;
import org.apache.fineract.portfolio.wallet.service.WalletTransactionReadPlatformService;
import org.springframework.stereotype.Component;

/**
 * WalletTransactionsApiResource
 * 
 * Purpose: REST API for wallet transaction history
 * Location: fineract-provider/src/main/java/org/apache/fineract/portfolio/wallet/api/WalletTransactionsApiResource.java
 * 
 * Endpoints:
 * - GET /v1/wallets/{walletId}/transactions - List transactions
 * - GET /v1/wallets/{walletId}/transactions/{transactionId} - Get transaction details
 * - PUT /v1/wallets/{walletId}/transactions/{transactionId}?command=reverse - Reverse transaction
 */
@Path("/v1/wallets/{walletId}/transactions")
@Component
@Tag(name = "Wallet Transaction", description = "Wallet transaction history and management")
@RequiredArgsConstructor
public class WalletTransactionsApiResource {

    private final WalletTransactionReadPlatformService walletTransactionReadPlatformService;
    private final PlatformSecurityContext context;
    private final DefaultToApiJsonSerializer<WalletTransactionData> toApiJsonSerializer;
    private final PortfolioCommandSourceWritePlatformService commandsSourceWritePlatformService;
    private final ApiRequestParameterHelper apiRequestParameterHelper;

    @GET
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "List wallet transactions", description = "Lists wallet transaction history with optional filters")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = WalletTransactionData.class)))
    })
    public String retrieveAll(
            @PathParam("walletId") @Parameter(description = "walletId") final Long walletId,
            @QueryParam("fromDate") @Parameter(description = "fromDate") final String fromDate,
            @QueryParam("toDate") @Parameter(description = "toDate") final String toDate,
            @QueryParam("offset") @Parameter(description = "offset") final Integer offset,
            @QueryParam("limit") @Parameter(description = "limit") final Integer limit,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("WALLETTRANSACTION");

        LocalDate fromDateParsed = null;
        if (fromDate != null && !fromDate.isEmpty()) {
            fromDateParsed = DateUtils.parseLocalDate(fromDate);
        }

        LocalDate toDateParsed = null;
        if (toDate != null && !toDate.isEmpty()) {
            toDateParsed = DateUtils.parseLocalDate(toDate);
        }

        final List<WalletTransactionData> transactions = walletTransactionReadPlatformService.retrieveAll(
            walletId,
            fromDateParsed,
            toDateParsed,
            offset,
            limit
        );

        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, transactions, null);
    }

    @GET
    @Path("{transactionId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Get transaction details", description = "Retrieves wallet transaction details by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = WalletTransactionData.class)))
    })
    public String retrieveOne(
            @PathParam("walletId") @Parameter(description = "walletId") final Long walletId,
            @PathParam("transactionId") @Parameter(description = "transactionId") final Long transactionId,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("WALLETTRANSACTION");

        final WalletTransactionData transaction = walletTransactionReadPlatformService.retrieveOne(walletId, transactionId);
        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, transaction, null);
    }

    @PUT
    @Path("{transactionId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Transaction command", description = "Execute command on transaction (reverse)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = CommandProcessingResult.class)))
    })
    public String handleCommand(
            @PathParam("walletId") @Parameter(description = "walletId") final Long walletId,
            @PathParam("transactionId") @Parameter(description = "transactionId") final Long transactionId,
            @QueryParam("command") @Parameter(description = "command") final String commandParam,
            @Parameter(hidden = true) final String apiRequestBodyAsJson) {

        context.authenticatedUser().validateHasWritePermission("WALLETTRANSACTION");

        String jsonApiRequest = apiRequestBodyAsJson;
        if (StringUtils.isBlank(jsonApiRequest)) {
            jsonApiRequest = "{}";
        }

        final CommandWrapperBuilder builder = new CommandWrapperBuilder().withJson(jsonApiRequest);

        CommandProcessingResult result = null;
        if (CommandParameterUtil.is(commandParam, "reverse")) {
            final CommandWrapper commandRequest = builder
                .withCommand("reverse")
                .withEntityId(transactionId)
                .withEntityName("WALLETTRANSACTION")
                .withSubEntityId(walletId)
                .build();
            result = commandsSourceWritePlatformService.logCommandSource(commandRequest);
        }

        if (result == null) {
            throw new UnrecognizedQueryParamException("command", commandParam,
                new Object[] { "reverse" });
        }

        return toApiJsonSerializer.serialize(result);
    }
}

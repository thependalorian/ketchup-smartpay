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
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
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
import org.apache.fineract.infrastructure.security.service.PlatformSecurityContext;
import java.util.List;
import org.apache.fineract.portfolio.wallet.data.WalletData;
import org.apache.fineract.portfolio.wallet.service.WalletReadPlatformService;
import org.springframework.stereotype.Component;

/**
 * WalletsApiResource
 * 
 * Purpose: REST API for wallet management (fineract-wallets module)
 * Location: fineract-provider/src/main/java/org/apache/fineract/portfolio/wallet/api/WalletsApiResource.java
 * 
 * Endpoints:
 * - GET /v1/wallets - List wallets
 * - POST /v1/wallets - Create wallet
 * - GET /v1/wallets/{walletId} - Get wallet details (includes balance)
 * - GET /v1/wallets/external-id/{externalId} - Get by Buffr user ID
 * - PUT /v1/wallets/{walletId}?command=deposit - Deposit funds
 * - PUT /v1/wallets/{walletId}?command=withdraw - Withdraw funds
 * - PUT /v1/wallets/{walletId}?command=transfer - Transfer to another wallet
 * - PUT /v1/wallets/{walletId}?command=freeze - Freeze wallet
 * - PUT /v1/wallets/{walletId}?command=unfreeze - Unfreeze wallet
 * - PUT /v1/wallets/{walletId}?command=close - Close wallet
 */
@Path("/v1/wallets")
@Component
@Tag(name = "Wallet", description = "Digital wallet management with instant transfers, USSD support, multi-channel synchronization")
@RequiredArgsConstructor
public class WalletsApiResource {

    private final WalletReadPlatformService walletReadPlatformService;
    private final PlatformSecurityContext context;
    private final DefaultToApiJsonSerializer<WalletData> toApiJsonSerializer;
    private final PortfolioCommandSourceWritePlatformService commandsSourceWritePlatformService;
    private final ApiRequestParameterHelper apiRequestParameterHelper;

    @GET
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "List wallets", description = "Lists wallets with optional filters")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = WalletData.class)))
    })
    public String retrieveAll(
            @QueryParam("clientId") @Parameter(description = "clientId") final Long clientId,
            @QueryParam("status") @Parameter(description = "status") final Integer status,
            @QueryParam("offset") @Parameter(description = "offset") final Integer offset,
            @QueryParam("limit") @Parameter(description = "limit") final Integer limit,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("WALLET");

        final List<WalletData> wallets = walletReadPlatformService.retrieveAll(
            clientId, 
            status, 
            offset, 
            limit
        );

        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, wallets, null);
    }

    @POST
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Create wallet", description = "Creates a new digital wallet (automatically activated)")
    @RequestBody(required = true, content = @Content(schema = @Schema(implementation = WalletData.class)))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = CommandProcessingResult.class)))
    })
    public String createWallet(@Parameter(hidden = true) final String apiRequestBodyAsJson) {

        final CommandWrapper commandRequest = new CommandWrapperBuilder()
            .createWallet()
            .withJson(apiRequestBodyAsJson)
            .build();

        final CommandProcessingResult result = commandsSourceWritePlatformService.logCommandSource(commandRequest);

        return toApiJsonSerializer.serialize(result);
    }

    @GET
    @Path("{walletId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Get wallet details", description = "Retrieves wallet details by ID (includes balance)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = WalletData.class)))
    })
    public String retrieveOne(
            @PathParam("walletId") @Parameter(description = "walletId") final Long walletId,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("WALLET");

        final WalletData wallet = walletReadPlatformService.retrieveOne(walletId);
        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, wallet, null);
    }

    @GET
    @Path("/external-id/{externalId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Get wallet by external ID", description = "Retrieves wallet by Buffr user ID (external ID)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = WalletData.class)))
    })
    public String retrieveByExternalId(
            @PathParam("externalId") @Parameter(description = "externalId") final String externalId,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("WALLET");

        final WalletData wallet = walletReadPlatformService.retrieveByExternalId(externalId);
        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, wallet, null);
    }

    @PUT
    @Path("{walletId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Wallet command", description = "Execute command on wallet (deposit, withdraw, transfer, freeze, unfreeze, close)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = CommandProcessingResult.class)))
    })
    public String handleCommand(
            @PathParam("walletId") @Parameter(description = "walletId") final Long walletId,
            @QueryParam("command") @Parameter(description = "command") final String commandParam,
            @Parameter(hidden = true) final String apiRequestBodyAsJson) {

        final CommandWrapper commandRequest = new CommandWrapperBuilder()
            .withJson(apiRequestBodyAsJson)
            .withCommand(commandParam)
            .withEntityId(walletId)
            .withEntityName("WALLET")
            .build();

        final CommandProcessingResult result = commandsSourceWritePlatformService.logCommandSource(commandRequest);

        return toApiJsonSerializer.serialize(result);
    }
}

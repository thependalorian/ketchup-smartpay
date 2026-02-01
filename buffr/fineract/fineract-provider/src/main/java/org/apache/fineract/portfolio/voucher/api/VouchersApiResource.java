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
package org.apache.fineract.portfolio.voucher.api;

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
import java.time.LocalDate;
import java.util.List;
import org.apache.fineract.infrastructure.core.service.DateUtils;
import org.apache.fineract.portfolio.voucher.data.VoucherData;
import org.apache.fineract.portfolio.voucher.service.VoucherReadPlatformService;
import org.springframework.stereotype.Component;

/**
 * VouchersApiResource
 * 
 * Purpose: REST API for voucher management (fineract-voucher module)
 * Location: fineract-provider/src/main/java/org/apache/fineract/portfolio/voucher/api/VouchersApiResource.java
 * 
 * Endpoints:
 * - GET /v1/vouchers - List vouchers
 * - POST /v1/vouchers - Create voucher
 * - GET /v1/vouchers/{voucherId} - Get voucher details
 * - GET /v1/vouchers/external-id/{externalId} - Get by Buffr voucher ID
 * - PUT /v1/vouchers/{voucherId}?command=redeem - Redeem voucher
 * - PUT /v1/vouchers/{voucherId}?command=expire - Mark as expired
 */
@Path("/v1/vouchers")
@Component
@Tag(name = "Voucher", description = "G2P voucher management with lifecycle, expiry, redemption tracking, and trust account integration")
@RequiredArgsConstructor
public class VouchersApiResource {

    private final VoucherReadPlatformService voucherReadPlatformService;
    private final PlatformSecurityContext context;
    private final DefaultToApiJsonSerializer<VoucherData> toApiJsonSerializer;
    private final PortfolioCommandSourceWritePlatformService commandsSourceWritePlatformService;
    private final ApiRequestParameterHelper apiRequestParameterHelper;

    @GET
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "List vouchers", description = "Lists vouchers with optional filters")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = VoucherData.class)))
    })
    public String retrieveAll(
            @QueryParam("clientId") @Parameter(description = "clientId") final Long clientId,
            @QueryParam("status") @Parameter(description = "status") final Integer status,
            @QueryParam("expiryDate") @Parameter(description = "expiryDate") final String expiryDate,
            @QueryParam("offset") @Parameter(description = "offset") final Integer offset,
            @QueryParam("limit") @Parameter(description = "limit") final Integer limit,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("VOUCHER");

        LocalDate expiryDateParsed = null;
        if (expiryDate != null && !expiryDate.isEmpty()) {
            expiryDateParsed = DateUtils.parseLocalDate(expiryDate);
        }

        final List<VoucherData> vouchers = voucherReadPlatformService.retrieveAll(
            clientId, 
            status, 
            expiryDateParsed, 
            offset, 
            limit
        );

        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, vouchers, null);
    }

    @POST
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Create voucher", description = "Creates a new G2P voucher (from SmartPay)")
    @RequestBody(required = true, content = @Content(schema = @Schema(implementation = VoucherData.class)))
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = CommandProcessingResult.class)))
    })
    public String createVoucher(@Parameter(hidden = true) final String apiRequestBodyAsJson) {

        final CommandWrapper commandRequest = new CommandWrapperBuilder()
            .createVoucher()
            .withJson(apiRequestBodyAsJson)
            .build();

        final CommandProcessingResult result = commandsSourceWritePlatformService.logCommandSource(commandRequest);

        return toApiJsonSerializer.serialize(result);
    }

    @GET
    @Path("{voucherId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Get voucher details", description = "Retrieves voucher details by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = VoucherData.class)))
    })
    public String retrieveOne(
            @PathParam("voucherId") @Parameter(description = "voucherId") final Long voucherId,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("VOUCHER");

        final VoucherData voucher = voucherReadPlatformService.retrieveOne(voucherId);
        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, voucher, null);
    }

    @GET
    @Path("/external-id/{externalId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Get voucher by external ID", description = "Retrieves voucher by Buffr voucher ID (external ID)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = VoucherData.class)))
    })
    public String retrieveByExternalId(
            @PathParam("externalId") @Parameter(description = "externalId") final String externalId,
            @Context final UriInfo uriInfo) {

        context.authenticatedUser().validateHasReadPermission("VOUCHER");

        final VoucherData voucher = voucherReadPlatformService.retrieveByExternalId(externalId);
        final ApiRequestJsonSerializationSettings settings = apiRequestParameterHelper.process(uriInfo.getQueryParameters());
        return toApiJsonSerializer.serialize(settings, voucher, null);
    }

    @PUT
    @Path("{voucherId}")
    @Consumes({ MediaType.APPLICATION_JSON })
    @Produces({ MediaType.APPLICATION_JSON })
    @Operation(summary = "Voucher command", description = "Execute command on voucher (redeem, expire, updateSmartPayStatus)")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "OK", content = @Content(schema = @Schema(implementation = CommandProcessingResult.class)))
    })
    public String handleCommand(
            @PathParam("voucherId") @Parameter(description = "voucherId") final Long voucherId,
            @QueryParam("command") @Parameter(description = "command") final String commandParam,
            @Parameter(hidden = true) final String apiRequestBodyAsJson) {

        final CommandWrapper commandRequest = new CommandWrapperBuilder()
            .withJson(apiRequestBodyAsJson)
            .withCommand(commandParam)
            .withEntityId(voucherId)
            .withEntityName("VOUCHER")
            .build();

        final CommandProcessingResult result = commandsSourceWritePlatformService.logCommandSource(commandRequest);

        return toApiJsonSerializer.serialize(result);
    }
}

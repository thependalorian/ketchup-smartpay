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
package org.apache.fineract.portfolio.voucher.exception;

import org.apache.fineract.infrastructure.core.exception.AbstractPlatformResourceNotFoundException;

/**
 * VoucherNotFoundException
 * 
 * Purpose: Exception thrown when a voucher is not found
 */
public class VoucherNotFoundException extends AbstractPlatformResourceNotFoundException {

    public VoucherNotFoundException(final Long voucherId) {
        super("error.msg.voucher.id.invalid", "Voucher with identifier " + voucherId + " does not exist", voucherId);
    }

    public VoucherNotFoundException(final String externalId) {
        super("error.msg.voucher.externalid.invalid", "Voucher with external identifier " + externalId + " does not exist", externalId);
    }
}

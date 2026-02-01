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
package org.apache.fineract.portfolio.wallet.domain;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * WalletAuditLogRepository
 * 
 * Purpose: Repository for wallet audit logs
 */
public interface WalletAuditLogRepository extends JpaRepository<WalletAuditLog, Long> {
    
    List<WalletAuditLog> findByWalletIdOrderByCreatedDateDesc(Long walletId);
    
    List<WalletAuditLog> findByWalletIdAndActionTypeOrderByCreatedDateDesc(Long walletId, Integer actionType);
    
    List<WalletAuditLog> findByWalletIdAndResolvedFalseOrderByCreatedDateDesc(Long walletId);
    
    @Query("SELECT w FROM WalletAuditLog w WHERE w.wallet.id = :walletId AND w.actionType = :actionType AND w.createdDate >= :fromDate ORDER BY w.createdDate DESC")
    List<WalletAuditLog> findByWalletIdAndActionTypeSince(Long walletId, Integer actionType, LocalDateTime fromDate);
    
    @Query("SELECT COUNT(w) FROM WalletAuditLog w WHERE w.wallet.id = :walletId AND w.actionType = :actionType AND w.createdDate >= :fromDate")
    Long countByWalletIdAndActionTypeSince(@Param("walletId") Long walletId, @Param("actionType") Integer actionType, @Param("fromDate") LocalDateTime fromDate);
}

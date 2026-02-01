# Fineract Custom Modules Architecture for Buffr
## fineract-voucher and fineract-wallets Modules

**Date:** January 23, 2026  
**Purpose:** Architecture design for custom Fineract modules for G2P vouchers and digital wallets  
**Status:** Design Phase

---

## Executive Summary

Based on exploration of `fineract-loan` and `fineract-savings` modules, this document outlines the architecture for creating two custom Fineract modules:

1. **`fineract-voucher`** - G2P voucher management module (similar to loans - lifecycle, expiry, redemption)
2. **`fineract-wallets`** - Digital wallet module (similar to savings - instant transfers, USSD support)

**Why Custom Modules?**
- G2P vouchers have unique business rules (expiry, purpose codes, redemption methods, trust account debiting)
- Digital wallets have different characteristics than traditional savings (instant transfers, USSD access, multi-channel sync)
- Custom modules allow full integration with Fineract's accounting, reporting, and audit systems
- Maintains separation of concerns while leveraging Fineract's core banking infrastructure

---

## Module Architecture Pattern

### Standard Fineract Module Structure

```
fineract-{module-name}/
├── build.gradle                    # Module build configuration
├── dependencies.gradle            # Module dependencies
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── org/apache/fineract/
│   │   │       └── portfolio/
│   │   │           └── {module}/
│   │   │               ├── domain/          # JPA entities, repositories
│   │   │               ├── data/            # DTOs, data transfer objects
│   │   │               ├── service/         # Business logic (Read/Write services)
│   │   │               ├── exception/       # Custom exceptions
│   │   │               ├── command/         # Command objects
│   │   │               ├── handler/         # Command handlers
│   │   │               ├── serialization/   # JSON serialization
│   │   │               └── starter/          # Spring configuration
│   │   └── resources/
│   │       ├── db/changelog/                # Liquibase migrations
│   │       │   └── tenant/module/{module}/
│   │       │       ├── module-changelog-master.xml
│   │       │       └── parts/
│   │       └── jpa/static-weaving/          # JPA persistence config
│   └── test/
│       └── java/                            # Unit tests
└── fineract-provider/
    └── src/main/java/org/apache/fineract/portfolio/{module}/
        └── api/                             # REST API resources (JAX-RS)
```

### Key Components

**1. Domain Layer (`domain/`)**
- JPA entities extending `AbstractAuditableWithUTCDateTimeCustom<Long>`
- Repositories extending `JpaRepository` or custom repositories
- Domain logic and business rules
- Use `ExternalId` type for Buffr linking

**2. Service Layer (`service/`)**
- `{Module}ReadPlatformService` - Read operations
- `{Module}WritePlatformService` - Write operations (returns `CommandProcessingResult`)
- Business logic, validation, calculations

**3. API Layer (`fineract-provider/api/`)**
- REST API resources using JAX-RS (`@Path`, `@GET`, `@POST`, `@PUT`, `@DELETE`)
- Swagger annotations for documentation
- Command pattern for write operations
- External ID support (`/external-id/{externalId}` paths)

**4. Database Migrations (`db/changelog/`)**
- Liquibase XML changelogs
- Module-specific tables, indexes, constraints
- Follow naming: `m_{module}_{entity}` (e.g., `m_voucher`, `m_wallet`)

---

## Module 1: fineract-voucher

### Purpose
Manage G2P vouchers with full lifecycle, expiry, redemption tracking, and trust account integration.

### Key Features
- Voucher lifecycle (Issued → Active → Redeemed → Expired)
- Expiry date tracking
- Multiple redemption methods (wallet, cash-out, bank transfer, merchant)
- Purpose code support (NamQR Purpose Code 18)
- Trust account debiting on redemption
- Real-time status sync with SmartPay
- Voucher product types (Old Age, Disability, Child Support, etc.)

### Domain Model

**Voucher Entity (`Voucher.java`)**
```java
@Entity
@Table(name = "m_voucher", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "voucher_code" }, name = "voucher_code_UNIQUE"),
    @UniqueConstraint(columnNames = { "external_id" }, name = "voucher_externalid_UNIQUE")
})
public class Voucher extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @Column(name = "voucher_code", length = 50, unique = true, nullable = false)
    private String voucherCode;
    
    @Column(name = "external_id")
    private ExternalId externalId;  // Buffr voucher ID
    
    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;  // Beneficiary
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private VoucherProduct product;  // Voucher product type
    
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;
    
    @Column(name = "currency_code", length = 3, nullable = false)
    private String currencyCode;
    
    @Column(name = "status_enum", nullable = false)
    private Integer status;  // ISSUED(100), ACTIVE(200), REDEEMED(300), EXPIRED(400)
    
    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;
    
    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;
    
    @Column(name = "redeemed_date")
    private LocalDate redeemedDate;
    
    @Column(name = "redemption_method_enum")
    private Integer redemptionMethod;  // WALLET(1), CASH_OUT(2), BANK_TRANSFER(3), MERCHANT(4)
    
    @Column(name = "purpose_code", length = 2)
    private String purposeCode;  // NamQR Purpose Code 18
    
    @Column(name = "namqr_data", columnDefinition = "jsonb")
    private String namqrData;  // NamQR TLV data
    
    @Column(name = "token_vault_id", length = 100)
    private String tokenVaultId;  // Token Vault ID for QR validation
    
    @Column(name = "smartpay_sync_status_enum")
    private Integer smartpaySyncStatus;  // PENDING(100), SYNCED(200), FAILED(300)
    
    @OneToMany(mappedBy = "voucher", cascade = CascadeType.ALL)
    private List<VoucherRedemption> redemptions;
}
```

**VoucherProduct Entity (`VoucherProduct.java`)**
```java
@Entity
@Table(name = "m_voucher_product")
public class VoucherProduct extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;  // "Old Age Grant", "Disability Grant", etc.
    
    @Column(name = "short_name", length = 4, nullable = false)
    private String shortName;  // "OAG", "DG", "CSG"
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "default_expiry_days", nullable = false)
    private Integer defaultExpiryDays;
    
    @Column(name = "purpose_code", length = 2, nullable = false)
    private String purposeCode;  // NamQR Purpose Code 18
    
    @Column(name = "active", nullable = false)
    private Boolean active;
}
```

**VoucherRedemption Entity (`VoucherRedemption.java`)**
```java
@Entity
@Table(name = "m_voucher_redemption")
public class VoucherRedemption extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @ManyToOne
    @JoinColumn(name = "voucher_id", nullable = false)
    private Voucher voucher;
    
    @Column(name = "redemption_method_enum", nullable = false)
    private Integer redemptionMethod;
    
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;
    
    @Column(name = "redemption_date", nullable = false)
    private LocalDate redemptionDate;
    
    @Column(name = "transaction_id")
    private Long transactionId;  // Link to m_savings_account_transaction or m_wallet_transaction
    
    @Column(name = "trust_account_debited", nullable = false)
    private Boolean trustAccountDebited;
    
    @Column(name = "bank_account_encrypted", columnDefinition = "text")
    private String bankAccountEncrypted;  // For bank transfer redemptions
    
    @Column(name = "merchant_id")
    private Long merchantId;  // For merchant payment redemptions
}
```

### API Endpoints

**VoucherProductsApiResource**
- `GET /v1/voucherproducts` - List voucher products
- `POST /v1/voucherproducts` - Create voucher product
- `GET /v1/voucherproducts/{productId}` - Get product details
- `PUT /v1/voucherproducts/{productId}` - Update product

**VouchersApiResource**
- `GET /v1/vouchers` - List vouchers (with filters: clientId, status, expiryDate)
- `POST /v1/vouchers` - Create voucher (from SmartPay)
- `GET /v1/vouchers/{voucherId}` - Get voucher details
- `GET /v1/vouchers/external-id/{externalId}` - Get by Buffr voucher ID
- `PUT /v1/vouchers/{voucherId}?command=redeem` - Redeem voucher
- `PUT /v1/vouchers/{voucherId}?command=expire` - Mark as expired
- `PUT /v1/vouchers/{voucherId}?command=updateSmartPayStatus` - Update SmartPay sync status

### Database Tables

**`m_voucher_product`**
- Product types (Old Age, Disability, Child Support, etc.)
- Default expiry days, purpose codes

**`m_voucher`**
- Voucher records with lifecycle tracking
- External ID for Buffr linking
- NamQR data, token vault ID

**`m_voucher_redemption`**
- Redemption audit trail
- Links to transactions, trust account debiting

### Integration Points

1. **Trust Account:** Debit trust account on redemption (via GL account or savings account)
2. **SmartPay:** Real-time status sync (webhook or API call)
3. **Token Vault:** QR code validation via token vault ID
4. **Accounting:** All redemptions recorded in Fineract accounting (double-entry)

---

## Module 2: fineract-wallets

### Purpose
Manage digital wallets with instant transfers, USSD support, multi-channel synchronization, and real-time balance updates.

### Key Features
- Instant wallet-to-wallet transfers
- USSD access support (same wallet, different access method)
- Multi-channel synchronization (mobile app, USSD, SMS)
- Real-time balance updates
- P2P transfers, merchant payments, bill payments
- Bank transfers, cash-out support
- Transaction history and analytics

### Domain Model

**Wallet Entity (`Wallet.java`)**
```java
@Entity
@Table(name = "m_wallet", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "wallet_no" }, name = "wallet_no_UNIQUE"),
    @UniqueConstraint(columnNames = { "external_id" }, name = "wallet_externalid_UNIQUE")
})
public class Wallet extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @Column(name = "wallet_no", length = 20, unique = true, nullable = false)
    private String walletNumber;
    
    @Column(name = "external_id")
    private ExternalId externalId;  // Buffr user ID
    
    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;
    
    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private WalletProduct product;
    
    @Column(name = "balance", nullable = false)
    private BigDecimal balance;
    
    @Column(name = "available_balance", nullable = false)
    private BigDecimal availableBalance;  // Balance minus holds/locks
    
    @Column(name = "currency_code", length = 3, nullable = false)
    private String currencyCode;
    
    @Column(name = "status_enum", nullable = false)
    private Integer status;  // ACTIVE(300), FROZEN(400), CLOSED(600)
    
    @Column(name = "pin_hash", length = 255)
    private String pinHash;  // 4-digit PIN hash for USSD
    
    @Column(name = "pin_attempts", nullable = false)
    private Integer pinAttempts;
    
    @Column(name = "pin_locked_until")
    private LocalDateTime pinLockedUntil;
    
    @Column(name = "ussd_enabled", nullable = false)
    private Boolean ussdEnabled;  // USSD access enabled
    
    @Column(name = "last_sync_channel")
    private String lastSyncChannel;  // "mobile_app", "ussd", "sms"
    
    @Column(name = "last_sync_at")
    private LocalDateTime lastSyncAt;
    
    @OneToMany(mappedBy = "wallet", cascade = CascadeType.ALL)
    @OrderBy("transactionDate DESC, id DESC")
    private List<WalletTransaction> transactions;
}
```

**WalletProduct Entity (`WalletProduct.java`)**
```java
@Entity
@Table(name = "m_wallet_product")
public class WalletProduct extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @Column(name = "name", length = 100, nullable = false)
    private String name;  // "Buffr Digital Wallet"
    
    @Column(name = "short_name", length = 4, nullable = false)
    private String shortName;  // "BUFFR"
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "min_balance", nullable = false)
    private BigDecimal minBalance;
    
    @Column(name = "max_balance")
    private BigDecimal maxBalance;
    
    @Column(name = "daily_transfer_limit")
    private BigDecimal dailyTransferLimit;
    
    @Column(name = "ussd_supported", nullable = false)
    private Boolean ussdSupported;
    
    @Column(name = "active", nullable = false)
    private Boolean active;
}
```

**WalletTransaction Entity (`WalletTransaction.java`)**
```java
@Entity
@Table(name = "m_wallet_transaction")
public class WalletTransaction extends AbstractAuditableWithUTCDateTimeCustom<Long> {
    
    @ManyToOne
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;
    
    @Column(name = "transaction_type_enum", nullable = false)
    private Integer transactionType;  // DEPOSIT(1), WITHDRAWAL(2), TRANSFER_OUT(3), TRANSFER_IN(4), PAYMENT(5)
    
    @Column(name = "amount", nullable = false)
    private BigDecimal amount;
    
    @Column(name = "balance_after", nullable = false)
    private BigDecimal balanceAfter;
    
    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;
    
    @Column(name = "reference", length = 100)
    private String reference;
    
    @Column(name = "description", length = 500)
    private String description;
    
    @Column(name = "channel_enum")
    private Integer channel;  // MOBILE_APP(1), USSD(2), SMS(3), API(4)
    
    @Column(name = "counterparty_wallet_id")
    private Long counterpartyWalletId;  // For P2P transfers
    
    @Column(name = "merchant_id")
    private Long merchantId;  // For merchant payments
    
    @Column(name = "bank_account_encrypted", columnDefinition = "text")
    private String bankAccountEncrypted;  // For bank transfers
    
    @Column(name = "ips_transaction_id", length = 100)
    private String ipsTransactionId;  // IPS transaction ID for wallet-to-wallet
    
    @Column(name = "reversed", nullable = false)
    private Boolean reversed;
}
```

### API Endpoints

**WalletProductsApiResource**
- `GET /v1/walletproducts` - List wallet products
- `POST /v1/walletproducts` - Create wallet product
- `GET /v1/walletproducts/{productId}` - Get product details

**WalletsApiResource**
- `GET /v1/wallets` - List wallets (with filters: clientId, status)
- `POST /v1/wallets` - Create wallet
- `GET /v1/wallets/{walletId}` - Get wallet details (includes balance)
- `GET /v1/wallets/external-id/{externalId}` - Get by Buffr user ID
- `PUT /v1/wallets/{walletId}?command=deposit` - Deposit funds
- `PUT /v1/wallets/{walletId}?command=withdraw` - Withdraw funds
- `PUT /v1/wallets/{walletId}?command=transfer` - Transfer to another wallet
- `PUT /v1/wallets/{walletId}?command=freeze` - Freeze wallet
- `PUT /v1/wallets/{walletId}?command=unfreeze` - Unfreeze wallet
- `PUT /v1/wallets/{walletId}?command=close` - Close wallet

**WalletTransactionsApiResource**
- `GET /v1/wallets/{walletId}/transactions` - List transactions
- `GET /v1/wallets/{walletId}/transactions/{transactionId}` - Get transaction details
- `PUT /v1/wallets/{walletId}/transactions/{transactionId}?command=reverse` - Reverse transaction

### Database Tables

**`m_wallet_product`**
- Wallet product configuration
- Limits, USSD support flags

**`m_wallet`**
- Wallet records with balance tracking
- PIN management, USSD support
- External ID for Buffr linking

**`m_wallet_transaction`**
- All wallet transactions
- Channel tracking, counterparty info
- IPS transaction linking

### Integration Points

1. **IPS (Instant Payment Switch):** Wallet-to-wallet transfers via IPS
2. **USSD Gateway:** USSD menu integration for feature phones
3. **SMS Gateway:** SMS notifications for all transactions
4. **Accounting:** All transactions recorded in Fineract accounting
5. **Multi-Channel Sync:** Real-time synchronization across mobile app, USSD, SMS

---

## Implementation Requirements

### 1. Module Registration

**Spring Component Scanning:**
- Modules are automatically discovered via Spring component scanning
- Place `@Component` or `@Service` annotations on classes
- Create `starter/{Module}Configuration.java` for module-specific configuration

**Example Configuration:**
```java
@Configuration
@ComponentScan(basePackages = "org.apache.fineract.portfolio.voucher")
public class VoucherConfiguration {
    // Module-specific Spring configuration
}
```

### 2. Database Migrations

**Liquibase Changelog Structure:**
```
fineract-voucher/src/main/resources/db/changelog/tenant/module/voucher/
├── module-changelog-master.xml
└── parts/
    ├── 3001_create_voucher_product_table.xml
    ├── 3002_create_voucher_table.xml
    ├── 3003_create_voucher_redemption_table.xml
    └── 3004_add_voucher_indexes.xml
```

**Migration Naming:**
- Start sequence at 3000 for vouchers (loans use 1000, savings use 2000)
- Start sequence at 4000 for wallets
- Follow pattern: `{sequence}_{description}.xml`

### 3. API Resource Registration

**JAX-RS Path Mapping:**
- API resources in `fineract-provider/src/main/java/org/apache/fineract/portfolio/{module}/api/`
- Use `@Path("/v1/{resource}")` annotation
- Automatically registered via Spring component scanning

### 4. Command Pattern

**Write Operations:**
- All write operations use command pattern
- Return `CommandProcessingResult` with `resourceId`
- Commands logged to `m_portfolio_command_source` table
- Support undo/redo operations

**Example Command:**
```java
@POST
@Path("{voucherId}")
@QueryParam("command") String commandParam
public String handleCommand(@PathParam("voucherId") Long voucherId, 
                           String apiRequestBodyAsJson) {
    if (is(commandParam, "redeem")) {
        CommandWrapper commandRequest = new CommandWrapperBuilder()
            .withJson(apiRequestBodyAsJson)
            .redeemVoucher(voucherId)
            .build();
        CommandProcessingResult result = commandsSourceWritePlatformService
            .logCommandSource(commandRequest);
        return toApiJsonSerializer.serialize(result);
    }
}
```

### 5. External ID Support

**Linking Strategy:**
- Use `ExternalId` type (varchar 100, unique) for Buffr entity linking
- Vouchers: `externalId = buffr_voucher_{voucherId}`
- Wallets: `externalId = buffr_user_{userId}`
- Support direct API paths: `/v1/vouchers/external-id/{externalId}`

### 6. Accounting Integration

**GL Account Mapping:**
- Voucher redemptions debit trust account GL
- Wallet transactions post to appropriate GL accounts
- Use Fineract's accounting service for double-entry bookkeeping

---

## Development Phases

### Phase 1: Module Setup (Week 1-2)
- Create module structure (`fineract-voucher`, `fineract-wallets`)
- Set up build.gradle and dependencies
- Create basic domain entities
- Set up database migrations
- Create starter configuration classes

### Phase 2: Domain & Service Layer (Week 3-4)
- Implement domain entities with business logic
- Create repositories
- Implement Read/Write platform services
- Add validation and business rules
- Create custom exceptions

### Phase 3: API Layer (Week 5-6)
- Create API resources in `fineract-provider`
- Implement command handlers
- Add Swagger documentation
- Implement external ID support
- Add error handling

### Phase 4: Integration (Week 7-8)
- Integrate with trust account (vouchers)
- Integrate with IPS (wallets)
- Add accounting integration
- Implement SmartPay sync (vouchers)
- Add USSD support (wallets)

### Phase 5: Testing & Documentation (Week 9-10)
- Unit tests for domain and services
- Integration tests for API endpoints
- End-to-end testing
- API documentation
- User guides

---

## Benefits of Custom Modules

### 1. Full Fineract Integration
- Leverage Fineract's accounting system
- Use Fineract's reporting and audit trail
- Integrate with Fineract's client management
- Benefit from Fineract's security and permissions

### 2. Business Rule Flexibility
- Custom business logic for vouchers (expiry, redemption methods)
- Custom business logic for wallets (instant transfers, USSD)
- Extensible architecture for future features

### 3. Regulatory Compliance
- All transactions in Fineract's audit trail
- Trust account reconciliation via Fineract accounting
- Compliance reporting using Fineract reports

### 4. Scalability
- Leverage Fineract's multi-tenant architecture
- Use Fineract's database optimization
- Benefit from Fineract's caching strategies

---

## Alternative Approach: Extend Existing Modules

### Option 1: Extend Savings Module for Wallets
**Pros:**
- Faster implementation
- Reuse existing code
- Less maintenance

**Cons:**
- May not fit wallet-specific requirements (USSD, instant transfers)
- Harder to customize business rules
- Mixing concerns (savings vs digital wallets)

### Option 2: Use Custom Fields/Data Tables
**Pros:**
- No custom module development
- Use Fineract's data table feature

**Cons:**
- Limited business logic support
- No custom API endpoints
- Harder to integrate with accounting

### Recommendation: Custom Modules
**Rationale:**
- G2P vouchers and digital wallets have unique requirements
- Custom modules provide full control and flexibility
- Better long-term maintainability
- Full integration with Fineract ecosystem

---

## Next Steps

1. **Review and Approve Architecture**
   - Review module structure and domain models
   - Approve API endpoint design
   - Confirm database schema

2. **Set Up Development Environment**
   - Fork Fineract repository (if contributing back)
   - Set up local development environment
   - Configure IDE for Java development

3. **Begin Implementation**
   - Start with `fineract-voucher` module (simpler, well-defined requirements)
   - Follow Fineract coding standards
   - Write tests alongside implementation

4. **Integration Testing**
   - Test with Buffr backend
   - Verify external ID linking
   - Test accounting integration

5. **Documentation**
   - API documentation
   - Integration guides
   - User manuals

---

**Last Updated:** 2026-01-23  
**Confidence Level:** 95% (based on thorough exploration of fineract-loan and fineract-savings modules)

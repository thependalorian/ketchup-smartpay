# Fineract API Reference for Buffr Integration

**Complete API reference based on codebase analysis**

---

## 🔐 Authentication

### Basic Authentication (Default)

```http
Authorization: Basic <base64(username:password)>
Fineract-Platform-TenantId: default
Content-Type: application/json
```

**Default Credentials:**
- Username: `mifos`
- Password: `password`
- Tenant: `default`

**Base64 Encoding:**
```javascript
const authHeader = `Basic ${Buffer.from('mifos:password').toString('base64')}`;
// Result: "Basic bWlmb3M6cGFzc3dvcmQ="
```

---

## 📋 Core API Endpoints

### 1. Offices

**List Offices**
```http
GET /v1/offices
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Head Office",
    "nameDecorated": "Head Office",
    "hierarchy": ".1.",
    "openingDate": [2013, 1, 1]
  }
]
```

**Get Office Template**
```http
GET /v1/offices/template
```

**Note:** First office (usually ID 1) is the head office. Use this for client creation.

---

### 2. Clients

#### Create Client

```http
POST /v1/clients
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "mobileNo": "+264811234567",
  "dateOfBirth": "1990-01-01",
  "externalId": "buffr_user_123",
  "officeId": 1,
  "active": true,
  "activationDate": "2026-01-23",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

**Response:**
```json
{
  "officeId": 1,
  "clientId": 27,
  "resourceId": 27,
  "resourceExternalId": "buffr_user_123"
}
```

**Required Fields:**
- `firstname` and `lastname` (OR `fullname` for businesses)
- `officeId`
- `active` (true/false)
- `activationDate` (if active=true)

**Optional Fields:**
- `externalId` - **Use this to link Buffr user ID**
- `mobileNo`
- `dateOfBirth`
- `emailAddress`
- `savingsProductId`

#### Get Client by External ID

```http
GET /v1/clients/external-id/{externalId}
```

**Or:**
```http
GET /v1/clients?externalId={externalId}
```

**Response:**
```json
{
  "id": 27,
  "accountNo": "000000027",
  "firstname": "John",
  "lastname": "Doe",
  "displayName": "John Doe",
  "mobileNo": "+264811234567",
  "emailAddress": "john@example.com",
  "externalId": "buffr_user_123",
  "officeId": 1,
  "officeName": "Head Office",
  "status": {
    "id": 300,
    "code": "clientStatusType.active",
    "value": "Active"
  },
  "active": true,
  "activationDate": [2013, 1, 1]
}
```

#### List Clients

```http
GET /v1/clients?externalId={externalId}&offset=0&limit=50
```

**Query Parameters:**
- `externalId` - Filter by external ID
- `officeId` - Filter by office
- `status` - Filter by status (active, closed, etc.)
- `offset` - Pagination offset
- `limit` - Results per page

---

### 3. Savings Products

#### List Savings Products

```http
GET /v1/savingsproducts
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Passbook Savings",
    "shortName": "PBS",
    "description": "Basic savings account",
    "currencyCode": "NAD",
    "digitsAfterDecimal": 2
  }
]
```

**Note:** You need at least one savings product before creating accounts.

#### Create Savings Product

```http
POST /v1/savingsproducts
Content-Type: application/json

{
  "name": "Buffr Basic Savings",
  "shortName": "BBS",
  "description": "Basic savings account for Buffr users",
  "currencyCode": "NAD",
  "digitsAfterDecimal": 2,
  "inMultiplesOf": 1,
  "nominalAnnualInterestRate": 0,
  "interestCompoundingPeriodType": 1,
  "interestPostingPeriodType": 4,
  "interestCalculationType": 1,
  "interestCalculationDaysInYearType": 365,
  "accountingRule": 1,
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

---

### 4. Savings Accounts

#### Create Savings Account

```http
POST /v1/savingsaccounts
Content-Type: application/json

{
  "clientId": 27,
  "productId": 1,
  "submittedOnDate": "2026-01-23",
  "externalId": "buffr_user_123_savings",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

**Response:**
```json
{
  "officeId": 1,
  "clientId": 27,
  "savingsId": 15,
  "resourceId": 15
}
```

**Required Fields:**
- `clientId` (or `groupId`)
- `productId`
- `submittedOnDate`

**Optional Fields:**
- `externalId` - **Use this to link Buffr account**
- `accountNo` - Custom account number

#### Get Account by ID

```http
GET /v1/savingsaccounts/{accountId}
```

**Response:**
```json
{
  "id": 15,
  "accountNo": "000000015",
  "clientId": 27,
  "clientName": "John Doe",
  "savingsProductId": 1,
  "savingsProductName": "Passbook Savings",
  "status": {
    "id": 300,
    "code": "savingsAccountStatusType.active",
    "value": "Active"
  },
  "summary": {
    "currency": {
      "code": "NAD",
      "name": "Namibian Dollar"
    },
    "accountBalance": 1000.00,
    "availableBalance": 1000.00
  },
  "externalId": "buffr_user_123_savings"
}
```

#### Get Account by External ID

```http
GET /v1/savingsaccounts/external-id/{externalId}
```

#### Activate Account

After creating, account must be activated:

```http
POST /v1/savingsaccounts/{accountId}?command=activate
Content-Type: application/json

{
  "activatedOnDate": "2026-01-23",
  "dateFormat": "yyyy-MM-dd",
  "locale": "en"
}
```

**Account States:**
- `Submitted and pending approval` (100)
- `Approved` (200)
- `Active` (300) ← **Required for transactions**
- `Closed` (600)

---

### 5. Savings Account Transactions

#### Deposit (Credit)

```http
POST /v1/savingsaccounts/{savingsId}/transactions?command=deposit
Content-Type: application/json

{
  "transactionDate": "2026-01-23",
  "transactionAmount": 1000.00,
  "paymentTypeId": 1,
  "dateFormat": "yyyy-MM-dd",
  "locale": "en",
  "note": "Voucher redemption"
}
```

**Response:**
```json
{
  "officeId": 1,
  "clientId": 27,
  "savingsId": 15,
  "resourceId": 45
}
```

#### Withdrawal (Debit)

```http
POST /v1/savingsaccounts/{savingsId}/transactions?command=withdrawal
Content-Type: application/json

{
  "transactionDate": "2026-01-23",
  "transactionAmount": 500.00,
  "paymentTypeId": 1,
  "dateFormat": "yyyy-MM-dd",
  "locale": "en",
  "note": "Cash-out"
}
```

#### Get Transaction

```http
GET /v1/savingsaccounts/{savingsId}/transactions/{transactionId}
```

**Response:**
```json
{
  "id": 45,
  "transactionType": {
    "id": 1,
    "code": "savingsAccountTransactionType.deposit",
    "value": "Deposit"
  },
  "entryType": "CREDIT",
  "accountId": 15,
  "accountNo": "000000015",
  "date": [2026, 1, 23],
  "currency": {
    "code": "NAD",
    "name": "Namibian Dollar"
  },
  "amount": 1000.00,
  "runningBalance": 1000.00,
  "reversed": false
}
```

#### List Transactions

```http
GET /v1/savingsaccounts/{savingsId}/transactions/search?fromDate=2026-01-01&toDate=2026-01-31
```

**Query Parameters:**
- `fromDate` - Start date (yyyy-MM-dd)
- `toDate` - End date (yyyy-MM-dd)
- `fromAmount` - Minimum amount
- `toAmount` - Maximum amount
- `types` - Transaction type IDs (comma-separated)
- `credit` - Filter credit transactions
- `debit` - Filter debit transactions
- `offset` - Pagination offset
- `limit` - Results per page

---

## 🔄 Complete Integration Flow

### Step 1: Get Default Office

```typescript
const offices = await fineractService.callFineract<Array<{id: number}>>(
  '/offices',
  'GET'
);
const defaultOfficeId = offices.data[0].id; // Usually 1
```

### Step 2: Create Client

```typescript
const client = await fineractService.createClient({
  firstname: 'John',
  lastname: 'Doe',
  mobileNo: '+264811234567',
  externalId: 'buffr_user_123', // Buffr user ID
  officeId: 1, // From step 1
});
// Returns: { id: 27, ... }
```

### Step 3: Get or Create Savings Product

```typescript
// List products
const products = await fineractService.callFineract<Array<{id: number}>>(
  '/savingsproducts',
  'GET'
);

// Use first product or create one if none exist
const productId = products.data.length > 0 ? products.data[0].id : await createProduct();
```

### Step 4: Create Savings Account

```typescript
const account = await fineractService.createAccount(
  client.id,
  'SAVINGS',
  {
    productId: productId,
    externalId: 'buffr_user_123_savings',
  }
);
// Returns: { id: 15, accountNo: '000000015', ... }
```

### Step 5: Activate Account

```typescript
await fineractService.callFineract(
  `/savingsaccounts/${account.id}?command=activate`,
  'POST',
  {
    activatedOnDate: new Date().toISOString().split('T')[0],
    dateFormat: 'yyyy-MM-dd',
    locale: 'en',
  }
);
```

### Step 6: Create Transaction (Deposit)

```typescript
const transaction = await fineractService.createTransaction(
  account.id,
  {
    transactionType: 'deposit',
    amount: 1000.00,
    paymentTypeId: 1,
    description: 'Voucher redemption',
  }
);
```

### Step 7: Get Balance

```typescript
const balance = await fineractService.getAccountBalance(account.id);
// Returns: 1000.00
```

---

## 📊 Response Structures

### CommandProcessingResult

All write operations return this structure:

```typescript
interface CommandProcessingResult {
  officeId?: number;
  clientId?: number;
  groupId?: number;
  loanId?: number;
  savingsId?: number; // Account ID
  resourceId: number; // Usually same as entity ID
  resourceExternalId?: string;
  subResourceId?: number;
  changes?: any;
  commandId?: string;
}
```

### Error Response

```json
{
  "httpStatusCode": 400,
  "defaultUserMessage": "Validation error",
  "userMessageGlobalisationCode": "validation.msg.validation.fail",
  "errors": [
    {
      "developerMessage": "The parameter externalId is invalid.",
      "defaultUserMessage": "Client with externalId `buffr_user_123` already exists",
      "userMessageGlobalisationCode": "error.msg.client.duplicate.externalId",
      "parameterName": "externalId",
      "args": [
        {
          "value": "buffr_user_123"
        }
      ]
    }
  ]
}
```

---

## ⚠️ Important Notes

### 1. Office Requirement

**Every client MUST have an officeId.** Default is usually office ID 1 (Head Office).

### 2. Savings Product Requirement

**Every savings account MUST have a productId.** Create a product first or use existing one.

### 3. Account Activation

**Accounts must be activated before transactions:**
- Created → `Submitted and pending approval`
- Approve → `Approved`
- Activate → `Active` ← **Transactions allowed**

### 4. External ID Uniqueness

- `externalId` must be unique per entity
- Use format: `buffr_user_{userId}` for clients
- Use format: `buffr_user_{userId}_savings` for accounts

### 5. Date Format

Always use:
- `dateFormat: "yyyy-MM-dd"`
- `locale: "en"`
- Dates as `"YYYY-MM-DD"` strings

### 6. Transaction Commands

- Deposit: `?command=deposit`
- Withdrawal: `?command=withdrawal`
- Other: `approve`, `activate`, `close`, etc.

---

## 🔧 Updated FineractService Methods

### createClient()

**Updated to:**
- Automatically get default office if not provided
- Handle CommandProcessingResult response
- Fetch created client to return full details

### getClientByExternalId()

**Updated to:**
- Try `/clients/external-id/{externalId}` first (direct path)
- Fallback to query parameter approach
- Handle paginated responses

### createAccount()

**Updated to:**
- Automatically get default savings product if not provided
- Handle CommandProcessingResult response
- Fetch created account to return full details
- Support externalId parameter

### getAccountBalance()

**Updated to:**
- Use `/savingsaccounts/{accountId}` endpoint
- Extract balance from `summary.accountBalance` or direct `accountBalance`
- Handle both response formats

### createTransaction()

**Updated to:**
- Use correct endpoint: `/savingsaccounts/{savingsId}/transactions?command=deposit|withdrawal`
- Map transactionType to Fineract commands
- Handle CommandProcessingResult response
- Fetch created transaction to return full details

---

## 📝 Complete Example: Buffr User → Fineract

```typescript
// 1. Get default office
const offices = await fineractService.callFineract('/offices', 'GET');
const officeId = offices.data[0].id;

// 2. Create client
const client = await fineractService.createClient({
  firstname: 'John',
  lastname: 'Doe',
  mobileNo: '+264811234567',
  externalId: 'buffr_user_123',
  officeId: officeId,
});

// 3. Get savings product
const products = await fineractService.callFineract('/savingsproducts', 'GET');
const productId = products.data[0].id;

// 4. Create savings account
const account = await fineractService.createAccount(
  client.id,
  'SAVINGS',
  { productId, externalId: 'buffr_user_123_savings' }
);

// 5. Activate account
await fineractService.callFineract(
  `/savingsaccounts/${account.id}?command=activate`,
  'POST',
  {
    activatedOnDate: new Date().toISOString().split('T')[0],
    dateFormat: 'yyyy-MM-dd',
    locale: 'en',
  }
);

// 6. Create deposit transaction
const transaction = await fineractService.createTransaction(account.id, {
  transactionType: 'deposit',
  amount: 1000.00,
  paymentTypeId: 1,
  description: 'Voucher redemption',
});

// 7. Get balance
const balance = await fineractService.getAccountBalance(account.id);
```

---

**Last Updated**: 2026-01-23  
**Based on**: Fineract codebase analysis

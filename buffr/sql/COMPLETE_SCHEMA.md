# Complete Database Schema

**Generated**: 2026-01-28T17:55:30.800Z

**Total Tables**: 166

---

## Table: `account_fees`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('account_fees_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `fee_type` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(10,2) | NO | - | |
| `description` | TEXT | YES | - | |
| `paid` | BOOLEAN | NO | false | |
| `paid_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `account_fees_pkey` (PRIMARY KEY) ON `id`
- `idx_account_fees_fee_type` (INDEX) ON `fee_type`
- `idx_account_fees_paid` (INDEX) ON `paid`
- `idx_account_fees_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `achievement_progress`

**Columns**: 6

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('achievement_progress_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `achievement_id` | CHARACTER VARYING(100) | NO | - | |
| `progress_data` | JSONB | NO | '{}'::jsonb | |
| `progress_percentage` | INTEGER(32) | NO | 0 | |
| `last_updated` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `achievement_progress_pkey` (PRIMARY KEY) ON `id`
- `idx_achievement_progress_achievement_id` (INDEX) ON `achievement_id`
- `idx_achievement_progress_percentage` (INDEX) ON `progress_percentage`
- `idx_achievement_progress_user_id` (INDEX) ON `user_id`
- `unique_achievement_progress` (UNIQUE) ON `user_id`, `achievement_id`

**Foreign Keys**:

- `achievement_id` → `achievements.achievement_id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `achievements`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('achievements_id_seq'::regclass) | |
| `achievement_id` | CHARACTER VARYING(100) | NO | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | NO | - | |
| `category` | CHARACTER VARYING(50) | NO | - | |
| `rarity` | CHARACTER VARYING(20) | NO | - | |
| `icon` | CHARACTER VARYING(50) | NO | - | |
| `bp_reward` | INTEGER(32) | NO | 0 | |
| `requirements` | JSONB | NO | - | |
| `hidden` | BOOLEAN | NO | false | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `achievements_achievement_id_key` (UNIQUE) ON `achievement_id`
- `achievements_pkey` (PRIMARY KEY) ON `id`
- `idx_achievements_achievement_id` (INDEX) ON `achievement_id`
- `idx_achievements_category` (INDEX) ON `category`
- `idx_achievements_rarity` (INDEX) ON `rarity`

---

## Table: `agent_clusters`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `region` | CHARACTER VARYING(50) | NO | - | |
| `cluster_id` | INTEGER(32) | YES | - | |
| `density_type` | CHARACTER VARYING(50) | YES | - | |
| `agent_count` | INTEGER(32) | YES | 0 | |
| `transaction_volume` | NUMERIC(15,2) | YES | 0 | |
| `average_liquidity` | NUMERIC(15,2) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `agent_clusters_pkey` (PRIMARY KEY) ON `id`
- `idx_agent_clusters_density` (INDEX) ON `density_type`
- `idx_agent_clusters_region` (INDEX) ON `region`

---

## Table: `agent_onboarding`

**Columns**: 16

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `onboarding_id` | CHARACTER VARYING(50) | NO | - | |
| `business_name` | CHARACTER VARYING(255) | NO | - | |
| `agent_type` | CHARACTER VARYING(50) | NO | - | |
| `location` | JSONB | NO | - | |
| `contact` | JSONB | NO | - | |
| `liquidity_requirements` | JSONB | YES | - | |
| `documents` | JSONB | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'document_verification'::character varying | |
| `progress` | INTEGER(32) | YES | 0 | |
| `current_step` | CHARACTER VARYING(100) | YES | - | |
| `completed_steps` | ARRAY | YES | - | |
| `pending_steps` | ARRAY | YES | - | |
| `estimated_completion` | DATE | YES | - | |
| `issues` | JSONB | YES | '[]'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `agent_onboarding_pkey` (PRIMARY KEY) ON `onboarding_id`
- `idx_agent_onboarding_agent_type` (INDEX) ON `agent_type`
- `idx_agent_onboarding_created` (INDEX) ON `created_at`
- `idx_agent_onboarding_status` (INDEX) ON `status`

---

## Table: `agents`

**Columns**: 17

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `type` | CHARACTER VARYING(50) | NO | - | |
| `location` | CHARACTER VARYING(255) | NO | - | |
| `latitude` | NUMERIC(10,8) | YES | - | |
| `longitude` | NUMERIC(11,8) | YES | - | |
| `wallet_id` | UUID | YES | - | |
| `liquidity_balance` | NUMERIC(15,2) | NO | 0 | |
| `cash_on_hand` | NUMERIC(15,2) | NO | 0 | |
| `status` | CHARACTER VARYING(50) | NO | 'pending_approval'::character varying | |
| `min_liquidity_required` | NUMERIC(15,2) | NO | 1000 | |
| `max_daily_cashout` | NUMERIC(15,2) | NO | 50000 | |
| `commission_rate` | NUMERIC(5,2) | NO | 1.5 | |
| `contact_phone` | CHARACTER VARYING(20) | YES | - | |
| `contact_email` | CHARACTER VARYING(255) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `agents_pkey` (PRIMARY KEY) ON `id`
- `idx_agents_coordinates` (INDEX) ON `latitude`, `longitude`
- `idx_agents_location` (INDEX) ON `location`
- `idx_agents_status` (INDEX) ON `status`
- `idx_agents_type` (INDEX) ON `type`
- `idx_agents_wallet_id` (INDEX) ON `wallet_id`

**Foreign Keys**:

- `wallet_id` → `wallets.id` (ON DELETE SET NULL)

---

## Table: `ai_chunks`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `document_id` | UUID | YES | - | |
| `content` | TEXT | NO | - | |
| `embedding` | USER-DEFINED | YES | - | |
| `chunk_index` | INTEGER(32) | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `token_count` | INTEGER(32) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `ai_chunks_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `document_id` → `ai_documents.id` (ON DELETE CASCADE)

---

## Table: `ai_documents`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `title` | TEXT | NO | - | |
| `source` | TEXT | NO | - | |
| `content` | TEXT | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `ai_documents_pkey` (PRIMARY KEY) ON `id`
- `idx_ai_documents_source` (INDEX) ON `source`

---

## Table: `ai_messages`

**Columns**: 6

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `session_id` | UUID | YES | - | |
| `role` | TEXT | NO | - | |
| `content` | TEXT | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `ai_messages_pkey` (PRIMARY KEY) ON `id`
- `idx_ai_messages_session` (INDEX) ON `session_id`

**Foreign Keys**:

- `session_id` → `ai_sessions.id` (ON DELETE CASCADE)

---

## Table: `ai_sessions`

**Columns**: 6

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | (now() + '24:00:00'::interval) | |

**Indexes**:

- `ai_sessions_pkey` (PRIMARY KEY) ON `id`

---

## Table: `ai_token_balances`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('ai_token_balances_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `tokens_balance` | INTEGER(32) | NO | 0 | |
| `tokens_purchased` | INTEGER(32) | NO | 0 | |
| `tokens_used` | INTEGER(32) | NO | 0 | |
| `last_purchase_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `ai_token_balances_pkey` (PRIMARY KEY) ON `id`
- `ai_token_balances_user_id_key` (UNIQUE) ON `user_id`
- `idx_ai_token_balances_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `ai_token_purchases`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('ai_token_purchases_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `package` | CHARACTER VARYING(20) | NO | - | |
| `tokens` | INTEGER(32) | NO | - | |
| `price` | NUMERIC(10,2) | NO | - | |
| `payment_method` | CHARACTER VARYING(50) | YES | - | |
| `transaction_id` | CHARACTER VARYING(255) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `ai_token_purchases_pkey` (PRIMARY KEY) ON `id`
- `idx_ai_token_purchases_created_at` (INDEX) ON `created_at`
- `idx_ai_token_purchases_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `api_sync_audit_logs`

**Columns**: 17

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `direction` | CHARACTER VARYING(10) | NO | - | |
| `endpoint` | CHARACTER VARYING(255) | NO | - | |
| `method` | CHARACTER VARYING(10) | NO | - | |
| `request_payload` | JSONB | YES | - | |
| `response_payload` | JSONB | YES | - | |
| `status_code` | INTEGER(32) | YES | - | |
| `response_time_ms` | INTEGER(32) | YES | - | |
| `success` | BOOLEAN | NO | - | |
| `error_message` | TEXT | YES | - | |
| `beneficiary_id` | CHARACTER VARYING(100) | YES | - | |
| `voucher_id` | UUID | YES | - | |
| `user_id` | UUID | YES | - | |
| `request_id` | CHARACTER VARYING(100) | YES | - | |
| `retry_count` | INTEGER(32) | YES | 0 | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `api_sync_audit_logs_pkey` (PRIMARY KEY) ON `id`
- `idx_api_sync_audit_logs_beneficiary_id` (INDEX) ON `beneficiary_id`
- `idx_api_sync_audit_logs_direction` (INDEX) ON `direction`
- `idx_api_sync_audit_logs_endpoint` (INDEX) ON `endpoint`
- `idx_api_sync_audit_logs_request_id` (INDEX) ON `request_id`
- `idx_api_sync_audit_logs_timestamp` (INDEX) ON `timestamp`
- `idx_api_sync_audit_logs_voucher_id` (INDEX) ON `voucher_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE NO ACTION)
- `voucher_id` → `vouchers.id` (ON DELETE NO ACTION)

---

## Table: `api_sync_audit_logs_archive`

**Columns**: 17

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `direction` | CHARACTER VARYING(10) | NO | - | |
| `endpoint` | CHARACTER VARYING(255) | NO | - | |
| `method` | CHARACTER VARYING(10) | NO | - | |
| `request_payload` | JSONB | YES | - | |
| `response_payload` | JSONB | YES | - | |
| `status_code` | INTEGER(32) | YES | - | |
| `response_time_ms` | INTEGER(32) | YES | - | |
| `success` | BOOLEAN | NO | - | |
| `error_message` | TEXT | YES | - | |
| `beneficiary_id` | CHARACTER VARYING(100) | YES | - | |
| `voucher_id` | UUID | YES | - | |
| `user_id` | UUID | YES | - | |
| `request_id` | CHARACTER VARYING(100) | YES | - | |
| `retry_count` | INTEGER(32) | YES | 0 | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `api_sync_audit_logs_archive_beneficiary_id_idx` (INDEX) ON `beneficiary_id`
- `api_sync_audit_logs_archive_direction_idx` (INDEX) ON `direction`
- `api_sync_audit_logs_archive_endpoint_idx` (INDEX) ON `endpoint`
- `api_sync_audit_logs_archive_pkey` (PRIMARY KEY) ON `id`
- `api_sync_audit_logs_archive_request_id_idx` (INDEX) ON `request_id`
- `api_sync_audit_logs_archive_timestamp_idx` (INDEX) ON `timestamp`
- `api_sync_audit_logs_archive_voucher_id_idx` (INDEX) ON `voucher_id`
- `idx_api_sync_audit_logs_archive_beneficiary_id` (INDEX) ON `beneficiary_id`
- `idx_api_sync_audit_logs_archive_timestamp` (INDEX) ON `timestamp`

---

## Table: `audit_logs`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `admin_user_id` | CHARACTER VARYING(255) | NO | - | |
| `action_type` | CHARACTER VARYING(100) | NO | - | |
| `resource_type` | CHARACTER VARYING(100) | NO | - | |
| `resource_id` | CHARACTER VARYING(255) | YES | - | |
| `action_details` | JSONB | YES | '{}'::jsonb | |
| `ip_address` | CHARACTER VARYING(45) | YES | - | |
| `user_agent` | TEXT | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'success'::character varying | |
| `error_message` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |

**Indexes**:

- `audit_logs_pkey` (PRIMARY KEY) ON `id`
- `idx_audit_logs_action_type` (INDEX) ON `action_type`
- `idx_audit_logs_admin_date` (INDEX) ON `admin_user_id`, `created_at`
- `idx_audit_logs_admin_user_id` (INDEX) ON `admin_user_id`
- `idx_audit_logs_created_at` (INDEX) ON `created_at`
- `idx_audit_logs_resource` (INDEX) ON `resource_type`, `resource_id`, `created_at`
- `idx_audit_logs_resource_id` (INDEX) ON `resource_id`
- `idx_audit_logs_resource_type` (INDEX) ON `resource_type`
- `idx_audit_logs_status` (INDEX) ON `status`

---

## Table: `audit_logs_archive`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `admin_user_id` | CHARACTER VARYING(255) | NO | - | |
| `action_type` | CHARACTER VARYING(100) | NO | - | |
| `resource_type` | CHARACTER VARYING(100) | NO | - | |
| `resource_id` | CHARACTER VARYING(255) | YES | - | |
| `action_details` | JSONB | YES | '{}'::jsonb | |
| `ip_address` | CHARACTER VARYING(45) | YES | - | |
| `user_agent` | TEXT | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'success'::character varying | |
| `error_message` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |

**Indexes**:

- `audit_logs_archive_action_type_idx` (INDEX) ON `action_type`
- `audit_logs_archive_admin_user_id_created_at_idx` (INDEX) ON `admin_user_id`, `created_at`
- `audit_logs_archive_admin_user_id_idx` (INDEX) ON `admin_user_id`
- `audit_logs_archive_created_at_idx` (INDEX) ON `created_at`
- `audit_logs_archive_pkey` (PRIMARY KEY) ON `id`
- `audit_logs_archive_resource_id_idx` (INDEX) ON `resource_id`
- `audit_logs_archive_resource_type_idx` (INDEX) ON `resource_type`
- `audit_logs_archive_resource_type_resource_id_created_at_idx` (INDEX) ON `resource_type`, `resource_id`, `created_at`
- `audit_logs_archive_status_idx` (INDEX) ON `status`

---

## Table: `automated_request_tracking`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('automated_request_tracking_id_seq'::regclass) | |
| `account_holder_id` | CHARACTER VARYING(255) | NO | - | |
| `endpoint` | CHARACTER VARYING(255) | NO | - | |
| `request_date` | DATE | NO | - | |
| `request_count` | INTEGER(32) | NO | 0 | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |

**Indexes**:

- `automated_request_tracking_pkey` (PRIMARY KEY) ON `id`
- `idx_art_account_holder` (INDEX) ON `account_holder_id`
- `idx_art_date` (INDEX) ON `request_date`
- `idx_art_endpoint` (INDEX) ON `endpoint`
- `unique_account_endpoint_date` (UNIQUE) ON `account_holder_id`, `endpoint`, `request_date`

---

## Table: `autopay_rules`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `wallet_id` | UUID | YES | - | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `rule_type` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `frequency` | CHARACTER VARYING(20) | YES | - | |
| `recipient_id` | CHARACTER VARYING(255) | YES | - | |
| `recipient_name` | CHARACTER VARYING(255) | YES | - | |
| `is_active` | BOOLEAN | YES | true | |
| `next_execution_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `autopay_rules_pkey` (PRIMARY KEY) ON `id`
- `idx_autopay_rules_next_execution` (INDEX) ON `next_execution_date`
- `idx_autopay_rules_user_id` (INDEX) ON `user_id`
- `idx_autopay_rules_wallet_id` (INDEX) ON `wallet_id`

**Foreign Keys**:

- `wallet_id` → `wallets.id` (ON DELETE CASCADE)

---

## Table: `autopay_transactions`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `rule_id` | UUID | YES | - | |
| `wallet_id` | UUID | YES | - | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `status` | CHARACTER VARYING(20) | NO | - | |
| `executed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `failure_reason` | TEXT | YES | - | |
| `recipient_id` | CHARACTER VARYING(255) | YES | - | |
| `recipient_name` | CHARACTER VARYING(255) | YES | - | |
| `rule_description` | TEXT | YES | - | |
| `authorisation_code` | CHARACTER VARYING(255) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `autopay_transactions_pkey` (PRIMARY KEY) ON `id`
- `idx_autopay_transactions_executed_at` (INDEX) ON `executed_at`
- `idx_autopay_transactions_rule_id` (INDEX) ON `rule_id`
- `idx_autopay_transactions_user_id` (INDEX) ON `user_id`
- `idx_autopay_transactions_wallet_id` (INDEX) ON `wallet_id`

**Foreign Keys**:

- `rule_id` → `autopay_rules.id` (ON DELETE SET NULL)
- `wallet_id` → `wallets.id` (ON DELETE SET NULL)

---

## Table: `badge_collections`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('badge_collections_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `badges_earned` | ARRAY | NO | '{}'::text[] | |
| `total_badges` | INTEGER(32) | NO | 0 | |
| `rarest_badge` | CHARACTER VARYING(50) | YES | - | |
| `display_badges` | ARRAY | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `badge_collections_pkey` (PRIMARY KEY) ON `id`
- `badge_collections_user_id_key` (UNIQUE) ON `user_id`
- `idx_badge_collections_total` (INDEX) ON `total_badges`
- `idx_badge_collections_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `beneficiaries`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | CHARACTER VARYING(50) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `phone` | CHARACTER VARYING(20) | NO | - | |
| `region` | CHARACTER VARYING(50) | NO | - | |
| `grant_type` | CHARACTER VARYING(50) | NO | - | |
| `status` | CHARACTER VARYING(50) | NO | 'pending'::character varying | |
| `enrolled_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `last_payment` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `beneficiaries_pkey` (PRIMARY KEY) ON `id`
- `idx_beneficiaries_grant_type` (INDEX) ON `grant_type`
- `idx_beneficiaries_region` (INDEX) ON `region`
- `idx_beneficiaries_status` (INDEX) ON `status`

---

## Table: `beneficiary_clusters`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `region` | CHARACTER VARYING(50) | NO | - | |
| `cluster_id` | INTEGER(32) | NO | - | |
| `centroid_latitude` | NUMERIC(10,8) | NO | - | |
| `centroid_longitude` | NUMERIC(11,8) | NO | - | |
| `beneficiary_count` | INTEGER(32) | YES | 0 | |
| `transaction_volume` | NUMERIC(15,2) | YES | 0 | |
| `average_transaction_amount` | NUMERIC(15,2) | YES | 0 | |
| `preferred_cashout_location` | CHARACTER VARYING(50) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `beneficiary_clusters_pkey` (PRIMARY KEY) ON `id`
- `beneficiary_clusters_region_cluster_id_key` (UNIQUE) ON `region`, `cluster_id`
- `idx_beneficiary_clusters_latitude` (INDEX) ON `centroid_latitude`
- `idx_beneficiary_clusters_longitude` (INDEX) ON `centroid_longitude`
- `idx_beneficiary_clusters_region` (INDEX) ON `region`

---

## Table: `beneficiary_feedback`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `feedback_type` | CHARACTER VARYING(50) | NO | - | |
| `transaction_id` | UUID | YES | - | |
| `satisfaction_score` | INTEGER(32) | YES | - | |
| `feedback_text` | TEXT | YES | - | |
| `channel` | CHARACTER VARYING(50) | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `beneficiary_feedback_pkey` (PRIMARY KEY) ON `id`
- `idx_beneficiary_feedback_created_at` (INDEX) ON `created_at`
- `idx_beneficiary_feedback_feedback_type` (INDEX) ON `feedback_type`
- `idx_beneficiary_feedback_satisfaction_score` (INDEX) ON `satisfaction_score`
- `idx_beneficiary_feedback_transaction_id` (INDEX) ON `transaction_id`
- `idx_beneficiary_feedback_user_id` (INDEX) ON `user_id`

---

## Table: `bottleneck_metrics`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `date` | DATE | NO | - | |
| `nampost_branch_load_before` | NUMERIC(5,2) | YES | - | |
| `nampost_branch_load_after` | NUMERIC(5,2) | YES | - | |
| `agent_network_usage_percentage` | NUMERIC(5,2) | YES | - | |
| `bottleneck_reduction_percentage` | NUMERIC(5,2) | YES | - | |
| `beneficiaries_routed_to_agents` | INTEGER(32) | YES | 0 | |
| `average_wait_time_reduction` | INTEGER(32) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `bottleneck_metrics_date_key` (UNIQUE) ON `date`
- `bottleneck_metrics_pkey` (PRIMARY KEY) ON `id`
- `idx_bottleneck_metrics_date` (INDEX) ON `date`

---

## Table: `buffr_points_profiles`

**Columns**: 18

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('buffr_points_profiles_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `level` | INTEGER(32) | NO | 1 | |
| `rank` | CHARACTER VARYING(10) | NO | 'F'::character varying | |
| `total_bp` | INTEGER(32) | NO | 0 | |
| `current_bp` | INTEGER(32) | NO | 0 | |
| `bp_to_next_level` | INTEGER(32) | NO | 100 | |
| `total_transactions` | INTEGER(32) | NO | 0 | |
| `total_savings_nad` | NUMERIC(15,2) | NO | 0.00 | |
| `loans_repaid_on_time` | INTEGER(32) | NO | 0 | |
| `literacy_modules_completed` | INTEGER(32) | NO | 0 | |
| `referrals_made` | INTEGER(32) | NO | 0 | |
| `challenges_completed` | INTEGER(32) | NO | 0 | |
| `current_streak` | INTEGER(32) | NO | 0 | |
| `max_streak` | INTEGER(32) | NO | 0 | |
| `last_activity_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `buffr_points_profiles_pkey` (PRIMARY KEY) ON `id`
- `buffr_points_profiles_user_id_key` (UNIQUE) ON `user_id`
- `idx_bp_profiles_level` (INDEX) ON `level`
- `idx_bp_profiles_rank` (INDEX) ON `rank`
- `idx_bp_profiles_total_bp` (INDEX) ON `total_bp`
- `idx_bp_profiles_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `cards`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | NO | - | |
| `card_number` | TEXT | NO | - | |
| `cardholder_name` | TEXT | NO | - | |
| `expiry_month` | INTEGER(32) | NO | - | |
| `expiry_year` | INTEGER(32) | NO | - | |
| `card_type` | TEXT | NO | - | |
| `is_default` | BOOLEAN | YES | false | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |

**Indexes**:

- `cards_pkey` (PRIMARY KEY) ON `id`
- `idx_cards_is_default` (INDEX) ON `user_id`, `is_default`
- `idx_cards_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `challenges`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('challenges_id_seq'::regclass) | |
| `challenge_id` | CHARACTER VARYING(100) | NO | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | NO | - | |
| `challenge_type` | CHARACTER VARYING(50) | NO | - | |
| `requirements` | JSONB | NO | - | |
| `bp_reward` | INTEGER(32) | NO | 0 | |
| `start_date` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `end_date` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `icon` | CHARACTER VARYING(50) | YES | - | |
| `difficulty` | CHARACTER VARYING(20) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `challenges_challenge_id_key` (UNIQUE) ON `challenge_id`
- `challenges_pkey` (PRIMARY KEY) ON `id`
- `idx_challenges_challenge_id` (INDEX) ON `challenge_id`
- `idx_challenges_dates` (INDEX) ON `start_date`, `end_date`
- `idx_challenges_type` (INDEX) ON `challenge_type`

---

## Table: `channel_analytics`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `channel` | CHARACTER VARYING(50) | NO | - | |
| `date` | DATE | NO | - | |
| `transaction_count` | INTEGER(32) | NO | 0 | |
| `total_volume` | NUMERIC(15,2) | NO | 0 | |
| `unique_users` | INTEGER(32) | NO | 0 | |
| `average_transaction_amount` | NUMERIC(10,2) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `channel_analytics_channel_date_key` (UNIQUE) ON `channel`, `date`
- `channel_analytics_pkey` (PRIMARY KEY) ON `id`
- `idx_channel_analytics_channel_date` (INDEX) ON `channel`, `date`
- `idx_channel_analytics_date` (INDEX) ON `date`

---

## Table: `chunks`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `document_id` | UUID | NO | - | |
| `content` | TEXT | NO | - | |
| `embedding` | USER-DEFINED | YES | - | |
| `chunk_index` | INTEGER(32) | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `token_count` | INTEGER(32) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |

**Indexes**:

- `chunks_pkey` (PRIMARY KEY) ON `id`
- `idx_chunks_chunk_index` (INDEX) ON `document_id`, `chunk_index`
- `idx_chunks_content_trgm` (INDEX) ON `content`
- `idx_chunks_document_id` (INDEX) ON `document_id`
- `idx_chunks_embedding` (INDEX) ON `embedding`

**Foreign Keys**:

- `document_id` → `documents.id` (ON DELETE CASCADE)

---

## Table: `compliance_checks`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `session_id` | UUID | YES | - | |
| `transaction_id` | UUID | YES | - | |
| `compliance_type` | TEXT | NO | - | |
| `is_compliant` | BOOLEAN | NO | - | |
| `compliance_score` | NUMERIC(5,4) | YES | - | |
| `violations` | JSONB | YES | '[]'::jsonb | |
| `required_actions` | JSONB | YES | '[]'::jsonb | |
| `risk_level` | TEXT | YES | - | |
| `checked_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `compliance_checks_pkey` (PRIMARY KEY) ON `id`
- `idx_compliance_checks_is_compliant` (INDEX) ON `is_compliant`
- `idx_compliance_checks_transaction_id` (INDEX) ON `transaction_id`
- `idx_compliance_checks_type` (INDEX) ON `compliance_type`, `checked_at`

**Foreign Keys**:

- `session_id` → `sessions.id` (ON DELETE SET NULL)
- `transaction_id` → `transactions.id` (ON DELETE CASCADE)

---

## Table: `concentration_alerts`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `branch_id` | CHARACTER VARYING(50) | NO | - | |
| `concentration_level` | CHARACTER VARYING(50) | NO | - | |
| `current_load` | INTEGER(32) | NO | - | |
| `max_capacity` | INTEGER(32) | NO | - | |
| `wait_time` | INTEGER(32) | NO | - | |
| `beneficiaries_notified` | INTEGER(32) | YES | 0 | |
| `agents_suggested` | INTEGER(32) | YES | 0 | |
| `resolved_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `concentration_alerts_pkey` (PRIMARY KEY) ON `id`
- `idx_concentration_alerts_branch` (INDEX) ON `branch_id`
- `idx_concentration_alerts_created` (INDEX) ON `created_at`
- `idx_concentration_alerts_level` (INDEX) ON `concentration_level`

---

## Table: `contacts`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `phone` | CHARACTER VARYING(20) | YES | - | |
| `email` | CHARACTER VARYING(255) | YES | - | |
| `is_favorite` | BOOLEAN | YES | false | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `phone_number` | CHARACTER VARYING(20) | YES | - | |
| `avatar` | TEXT | YES | - | |
| `bank_code` | CHARACTER VARYING(10) | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `contacts_pkey` (PRIMARY KEY) ON `id`
- `contacts_user_id_phone_key` (UNIQUE) ON `user_id`, `phone`
- `idx_contacts_is_favorite` (INDEX) ON `is_favorite`
- `idx_contacts_user_id` (INDEX) ON `user_id`

---

## Table: `conversations`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `session_id` | TEXT | NO | - | |
| `user_id` | TEXT | YES | - | |
| `user_message` | TEXT | NO | - | |
| `assistant_response` | TEXT | NO | - | |
| `agents_consulted` | ARRAY | YES | '{}'::text[] | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |

**Indexes**:

- `conversations_pkey` (PRIMARY KEY) ON `id`
- `idx_conversations_created_at` (INDEX) ON `created_at`
- `idx_conversations_session_id` (INDEX) ON `session_id`, `created_at`
- `idx_conversations_user_id` (INDEX) ON `user_id`, `created_at`

---

## Table: `coverage_gaps`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `location_address` | CHARACTER VARYING(255) | NO | - | |
| `latitude` | NUMERIC(10,8) | NO | - | |
| `longitude` | NUMERIC(11,8) | NO | - | |
| `region` | CHARACTER VARYING(50) | NO | - | |
| `beneficiary_count` | INTEGER(32) | YES | 0 | |
| `nearest_agent_distance_km` | NUMERIC(10,2) | YES | - | |
| `recommended_agent_type` | CHARACTER VARYING(50) | YES | - | |
| `priority` | CHARACTER VARYING(50) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `coverage_gaps_pkey` (PRIMARY KEY) ON `id`
- `idx_coverage_gaps_latitude` (INDEX) ON `latitude`
- `idx_coverage_gaps_longitude` (INDEX) ON `longitude`
- `idx_coverage_gaps_priority` (INDEX) ON `priority`
- `idx_coverage_gaps_region` (INDEX) ON `region`

---

## Table: `credit_assessments`

**Columns**: 14

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `session_id` | UUID | YES | - | |
| `merchant_id` | UUID | YES | - | |
| `credit_score` | INTEGER(32) | NO | - | |
| `default_probability` | NUMERIC(5,4) | NO | - | |
| `credit_tier` | TEXT | NO | - | |
| `max_loan_amount` | NUMERIC(15,2) | NO | - | |
| `recommended_interest_rate` | NUMERIC(5,4) | NO | - | |
| `logistic_score` | NUMERIC(5,4) | YES | - | |
| `random_forest_score` | NUMERIC(5,4) | YES | - | |
| `gradient_boosting_score` | NUMERIC(5,4) | YES | - | |
| `assessed_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `model_version` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `credit_assessments_pkey` (PRIMARY KEY) ON `id`
- `idx_credit_assessments_credit_score` (INDEX) ON `credit_score`
- `idx_credit_assessments_merchant_id` (INDEX) ON `merchant_id`, `assessed_at`
- `idx_credit_assessments_tier` (INDEX) ON `credit_tier`

**Foreign Keys**:

- `merchant_id` → `merchants.id` (ON DELETE CASCADE)
- `session_id` → `sessions.id` (ON DELETE SET NULL)

---

## Table: `demand_hotspots`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `location_address` | CHARACTER VARYING(255) | NO | - | |
| `latitude` | NUMERIC(10,8) | NO | - | |
| `longitude` | NUMERIC(11,8) | NO | - | |
| `region` | CHARACTER VARYING(50) | NO | - | |
| `beneficiary_density` | NUMERIC(10,2) | YES | - | |
| `transaction_demand_per_month` | NUMERIC(15,2) | YES | - | |
| `current_agent_coverage` | INTEGER(32) | YES | 0 | |
| `recommended_agent_count` | INTEGER(32) | YES | 0 | |
| `priority` | CHARACTER VARYING(50) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `demand_hotspots_pkey` (PRIMARY KEY) ON `id`
- `idx_demand_hotspots_latitude` (INDEX) ON `latitude`
- `idx_demand_hotspots_longitude` (INDEX) ON `longitude`
- `idx_demand_hotspots_priority` (INDEX) ON `priority`
- `idx_demand_hotspots_region` (INDEX) ON `region`

---

## Table: `dispute_evidence`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `dispute_id` | UUID | NO | - | |
| `file_name` | TEXT | NO | - | |
| `file_type` | TEXT | YES | - | |
| `file_size` | INTEGER(32) | YES | - | |
| `file_url` | TEXT | YES | - | |
| `uploaded_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `dispute_evidence_pkey` (PRIMARY KEY) ON `id`
- `idx_dispute_evidence_dispute_id` (INDEX) ON `dispute_id`

**Foreign Keys**:

- `dispute_id` → `disputes.id` (ON DELETE CASCADE)

---

## Table: `disputes`

**Columns**: 20

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `customer_id` | UUID | NO | - | |
| `transaction_id` | UUID | YES | - | |
| `category` | TEXT | NO | - | |
| `description` | TEXT | NO | - | |
| `status` | TEXT | NO | 'submitted'::text | |
| `priority` | TEXT | NO | 'normal'::text | |
| `resolution` | TEXT | YES | - | |
| `resolution_amount` | NUMERIC(15,2) | YES | - | |
| `submitted_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `acknowledged_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `due_date` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `resolved_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `closed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `contact_details` | JSONB | YES | '{}'::jsonb | |
| `evidence_files` | JSONB | YES | '[]'::jsonb | |
| `internal_notes` | JSONB | YES | '[]'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `disputes_pkey` (PRIMARY KEY) ON `id`
- `idx_disputes_category` (INDEX) ON `category`
- `idx_disputes_customer_id` (INDEX) ON `customer_id`, `submitted_at`
- `idx_disputes_priority` (INDEX) ON `priority`, `due_date`
- `idx_disputes_status` (INDEX) ON `status`
- `idx_disputes_transaction_id` (INDEX) ON `transaction_id`

**Foreign Keys**:

- `customer_id` → `users.id` (ON DELETE CASCADE)
- `transaction_id` → `transactions.id` (ON DELETE SET NULL)

---

## Table: `documents`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `title` | TEXT | NO | - | |
| `source` | TEXT | NO | - | |
| `content` | TEXT | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |

**Indexes**:

- `documents_pkey` (PRIMARY KEY) ON `id`
- `idx_documents_created_at` (INDEX) ON `created_at`
- `idx_documents_metadata` (INDEX) ON `metadata`

---

## Table: `electronic_signatures`

**Columns**: 21

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | NO | - | |
| `signature_type` | TEXT | NO | - | |
| `document_id` | UUID | YES | - | |
| `transaction_id` | UUID | YES | - | |
| `signature_hash` | TEXT | NO | - | |
| `signature_data` | TEXT | NO | - | |
| `public_key` | TEXT | NO | - | |
| `algorithm` | TEXT | NO | 'RSA_SHA256'::text | |
| `certificate_id` | TEXT | YES | - | |
| `signed_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `verified` | BOOLEAN | YES | false | |
| `verified_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `verification_result` | JSONB | YES | '{}'::jsonb | |
| `ip_address` | INET | YES | - | |
| `user_agent` | TEXT | YES | - | |
| `device_fingerprint` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `electronic_signatures_pkey` (PRIMARY KEY) ON `id`
- `idx_electronic_signatures_document_id` (INDEX) ON `document_id`
- `idx_electronic_signatures_hash` (INDEX) ON `signature_hash`
- `idx_electronic_signatures_transaction_id` (INDEX) ON `transaction_id`
- `idx_electronic_signatures_type` (INDEX) ON `signature_type`
- `idx_electronic_signatures_user_id` (INDEX) ON `user_id`, `signed_at`
- `idx_electronic_signatures_verified` (INDEX) ON `verified`

**Foreign Keys**:

- `transaction_id` → `transactions.id` (ON DELETE SET NULL)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `exchange_rate_fetch_log`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `fetch_date` | DATE | NO | - | |
| `fetch_time` | TIME WITHOUT TIME ZONE | NO | - | |
| `currencies_fetched` | INTEGER(32) | YES | 0 | |
| `success` | BOOLEAN | YES | true | |
| `error_message` | TEXT | YES | - | |
| `api_source` | CHARACTER VARYING(100) | YES | 'exchangerate.host'::character varying | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `exchange_rate_fetch_log_pkey` (PRIMARY KEY) ON `id`
- `idx_exchange_rate_fetch_log_date` (INDEX) ON `fetch_date`
- `idx_exchange_rate_fetch_log_success` (INDEX) ON `fetch_date`, `success`
- `idx_exchange_rate_fetch_log_unique` (UNIQUE) ON `fetch_date`, `fetch_time`
- `idx_fetch_log_date` (INDEX) ON `fetch_date`
- `idx_fetch_log_success` (INDEX) ON `fetch_date`, `success`
- `unique_fetch_per_time` (UNIQUE) ON `fetch_date`, `fetch_time`

---

## Table: `exchange_rates`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `base_currency` | CHARACTER VARYING(3) | NO | 'NAD'::character varying | |
| `target_currency` | CHARACTER VARYING(3) | NO | - | |
| `rate` | NUMERIC(15,6) | NO | - | |
| `trend` | CHARACTER VARYING(10) | YES | 'stable'::character varying | |
| `source` | CHARACTER VARYING(100) | YES | 'exchangerate.host'::character varying | |
| `fetched_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `fetched_date` | DATE | NO | CURRENT_DATE | |

**Indexes**:

- `exchange_rates_pkey` (PRIMARY KEY) ON `id`
- `idx_exchange_rates_base_currency` (INDEX) ON `base_currency`
- `idx_exchange_rates_fetched_at` (INDEX) ON `fetched_at`
- `idx_exchange_rates_latest` (INDEX) ON `base_currency`, `target_currency`, `fetched_at`
- `idx_exchange_rates_target_currency` (INDEX) ON `target_currency`
- `idx_exchange_rates_unique` (UNIQUE) ON `base_currency`, `target_currency`, `fetched_date`
- `unique_rate_per_fetch` (UNIQUE) ON `base_currency`, `target_currency`, `fetched_at`

---

## Table: `feature_interest_surveys`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `survey_type` | CHARACTER VARYING(50) | NO | - | |
| `feature_name` | CHARACTER VARYING(100) | NO | - | |
| `interest_level` | CHARACTER VARYING(50) | YES | - | |
| `would_use` | BOOLEAN | YES | - | |
| `concerns` | TEXT | YES | - | |
| `suggestions` | TEXT | YES | - | |
| `channel` | CHARACTER VARYING(50) | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `feature_interest_surveys_pkey` (PRIMARY KEY) ON `id`
- `idx_feature_interest_surveys_created_at` (INDEX) ON `created_at`
- `idx_feature_interest_surveys_feature_name` (INDEX) ON `feature_name`
- `idx_feature_interest_surveys_survey_type` (INDEX) ON `survey_type`
- `idx_feature_interest_surveys_unique` (UNIQUE) ON `user_id`, `feature_name`
- `idx_feature_interest_surveys_user_id` (INDEX) ON `user_id`
- `idx_feature_interest_surveys_would_use` (INDEX) ON `would_use`

---

## Table: `feedback_analytics`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `date` | DATE | NO | - | |
| `total_feedback_received` | INTEGER(32) | YES | 0 | |
| `average_satisfaction_score` | NUMERIC(3,2) | YES | 0 | |
| `feedback_response_rate` | NUMERIC(5,2) | YES | 0 | |
| `feature_interest_savings` | NUMERIC(5,2) | YES | 0 | |
| `feature_interest_credit` | NUMERIC(5,2) | YES | 0 | |
| `feature_interest_recurring` | NUMERIC(5,2) | YES | 0 | |
| `top_pain_points` | JSONB | YES | '[]'::jsonb | |
| `top_suggestions` | JSONB | YES | '[]'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `feedback_analytics_date_key` (UNIQUE) ON `date`
- `feedback_analytics_pkey` (PRIMARY KEY) ON `id`
- `idx_feedback_analytics_date` (INDEX) ON `date`

---

## Table: `financial_literacy_modules`

**Columns**: 14

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('financial_literacy_modules_id_seq'::regclass) | |
| `module_id` | CHARACTER VARYING(100) | NO | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | NO | - | |
| `category` | CHARACTER VARYING(50) | NO | - | |
| `difficulty` | CHARACTER VARYING(20) | NO | - | |
| `estimated_minutes` | INTEGER(32) | NO | - | |
| `key_concepts` | ARRAY | YES | - | |
| `learning_objectives` | ARRAY | YES | - | |
| `content_sections` | JSONB | NO | - | |
| `prerequisites` | ARRAY | YES | - | |
| `bp_reward` | INTEGER(32) | NO | 50 | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `financial_literacy_modules_module_id_key` (UNIQUE) ON `module_id`
- `financial_literacy_modules_pkey` (PRIMARY KEY) ON `id`
- `idx_modules_category` (INDEX) ON `category`
- `idx_modules_difficulty` (INDEX) ON `difficulty`
- `idx_modules_module_id` (INDEX) ON `module_id`

---

## Table: `fineract_accounts`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | UUID | NO | - | |
| `fineract_client_id` | BIGINT(64) | NO | - | |
| `fineract_account_id` | BIGINT(64) | NO | - | |
| `account_type` | CHARACTER VARYING(50) | NO | - | |
| `account_no` | CHARACTER VARYING(100) | YES | - | |
| `status` | CHARACTER VARYING(50) | NO | 'active'::character varying | |
| `synced_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `fineract_wallet_id` | BIGINT(64) | YES | - | |
| `wallet_no` | CHARACTER VARYING(100) | YES | - | |

**Indexes**:

- `fineract_accounts_pkey` (PRIMARY KEY) ON `id`
- `fineract_accounts_user_id_account_type_key` (UNIQUE) ON `user_id`, `account_type`
- `idx_fineract_accounts_account_id` (INDEX) ON `fineract_account_id`
- `idx_fineract_accounts_account_no` (INDEX) ON `account_no`
- `idx_fineract_accounts_client_id` (INDEX) ON `fineract_client_id`
- `idx_fineract_accounts_user_id` (INDEX) ON `user_id`
- `idx_fineract_accounts_wallet_id` (INDEX) ON `fineract_wallet_id`
- `idx_fineract_accounts_wallet_no` (INDEX) ON `wallet_no`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `fineract_sync_logs`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `entity_type` | CHARACTER VARYING(50) | NO | - | |
| `entity_id` | UUID | NO | - | |
| `fineract_id` | BIGINT(64) | NO | - | |
| `sync_status` | CHARACTER VARYING(50) | NO | 'pending'::character varying | |
| `sync_error` | TEXT | YES | - | |
| `synced_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `operation_type` | CHARACTER VARYING(50) | YES | - | |
| `request_payload` | JSONB | YES | - | |
| `response_payload` | JSONB | YES | - | |

**Indexes**:

- `fineract_sync_logs_entity_type_entity_id_key` (UNIQUE) ON `entity_type`, `entity_id`
- `fineract_sync_logs_pkey` (PRIMARY KEY) ON `id`
- `idx_fineract_sync_logs_entity` (INDEX) ON `entity_type`, `entity_id`
- `idx_fineract_sync_logs_fineract_id` (INDEX) ON `fineract_id`
- `idx_fineract_sync_logs_operation_type` (INDEX) ON `operation_type`
- `idx_fineract_sync_logs_status` (INDEX) ON `sync_status`
- `idx_fineract_sync_logs_synced_at` (INDEX) ON `synced_at`

---

## Table: `fineract_vouchers`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `voucher_id` | UUID | NO | - | |
| `fineract_voucher_id` | BIGINT(64) | NO | - | |
| `voucher_code` | CHARACTER VARYING(100) | NO | - | |
| `status` | CHARACTER VARYING(50) | NO | 'ISSUED'::character varying | |
| `synced_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `fineract_vouchers_pkey` (PRIMARY KEY) ON `id`
- `fineract_vouchers_voucher_id_key` (UNIQUE) ON `voucher_id`
- `idx_fineract_vouchers_fineract_voucher_id` (INDEX) ON `fineract_voucher_id`
- `idx_fineract_vouchers_status` (INDEX) ON `status`
- `idx_fineract_vouchers_voucher_code` (INDEX) ON `voucher_code`
- `idx_fineract_vouchers_voucher_id` (INDEX) ON `voucher_id`

---

## Table: `fraud_checks`

**Columns**: 16

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `session_id` | UUID | YES | - | |
| `transaction_id` | UUID | YES | - | |
| `user_id` | UUID | YES | - | |
| `fraud_probability` | NUMERIC(5,4) | NO | - | |
| `is_fraud` | BOOLEAN | NO | - | |
| `risk_level` | TEXT | NO | - | |
| `logistic_score` | NUMERIC(5,4) | YES | - | |
| `neural_network_score` | NUMERIC(5,4) | YES | - | |
| `random_forest_score` | NUMERIC(5,4) | YES | - | |
| `gmm_anomaly_score` | NUMERIC(5,4) | YES | - | |
| `recommended_action` | TEXT | YES | - | |
| `confidence` | NUMERIC(5,4) | YES | 0.95 | |
| `checked_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `model_version` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `fraud_checks_pkey` (PRIMARY KEY) ON `id`
- `idx_fraud_checks_is_fraud` (INDEX) ON `is_fraud`, `checked_at`
- `idx_fraud_checks_risk_level` (INDEX) ON `risk_level`, `checked_at`
- `idx_fraud_checks_transaction_id` (INDEX) ON `transaction_id`
- `idx_fraud_checks_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `session_id` → `sessions.id` (ON DELETE SET NULL)
- `transaction_id` → `transactions.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `gamification_stats`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('gamification_stats_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `total_achievements` | INTEGER(32) | NO | 0 | |
| `total_challenges_completed` | INTEGER(32) | NO | 0 | |
| `total_badges` | INTEGER(32) | NO | 0 | |
| `highest_streak` | INTEGER(32) | NO | 0 | |
| `leaderboard_appearances` | INTEGER(32) | NO | 0 | |
| `total_gamification_bp` | INTEGER(32) | NO | 0 | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `gamification_stats_pkey` (PRIMARY KEY) ON `id`
- `gamification_stats_user_id_key` (UNIQUE) ON `user_id`
- `idx_gamification_stats_achievements` (INDEX) ON `total_achievements`
- `idx_gamification_stats_challenges` (INDEX) ON `total_challenges_completed`
- `idx_gamification_stats_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `geographic_analytics`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `region` | CHARACTER VARYING(100) | YES | - | |
| `date` | DATE | NO | - | |
| `transaction_count` | INTEGER(32) | NO | 0 | |
| `total_volume` | NUMERIC(15,2) | NO | 0 | |
| `unique_users` | INTEGER(32) | NO | 0 | |
| `cash_out_ratio` | NUMERIC(5,2) | YES | - | |
| `digital_payment_ratio` | NUMERIC(5,2) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `geographic_analytics_pkey` (PRIMARY KEY) ON `id`
- `geographic_analytics_region_date_key` (UNIQUE) ON `region`, `date`
- `idx_geographic_analytics_date` (INDEX) ON `date`
- `idx_geographic_analytics_region_date` (INDEX) ON `region`, `date`

---

## Table: `group_members`

**Columns**: 6

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `group_id` | UUID | YES | - | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `contribution` | NUMERIC(15,2) | YES | 0.00 | |
| `is_owner` | BOOLEAN | YES | false | |
| `joined_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `group_members_group_id_user_id_key` (UNIQUE) ON `group_id`, `user_id`
- `group_members_pkey` (PRIMARY KEY) ON `id`
- `idx_group_members_group_id` (INDEX) ON `group_id`
- `idx_group_members_user_id` (INDEX) ON `user_id`

**Foreign Keys**:

- `group_id` → `groups.id` (ON DELETE CASCADE)

---

## Table: `groups`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `owner_id` | CHARACTER VARYING(255) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | YES | - | |
| `target_amount` | NUMERIC(15,2) | YES | - | |
| `current_amount` | NUMERIC(15,2) | YES | 0.00 | |
| `currency` | CHARACTER VARYING(10) | YES | 'N$'::character varying | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `type` | CHARACTER VARYING(50) | YES | 'savings'::character varying | |
| `avatar` | TEXT | YES | - | |
| `is_active` | BOOLEAN | YES | true | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `groups_pkey` (PRIMARY KEY) ON `id`
- `idx_groups_is_active` (INDEX) ON `is_active`
- `idx_groups_owner_id` (INDEX) ON `owner_id`

---

## Table: `incident_metrics`

**Columns**: 23

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `report_period` | DATE | NO | - | |
| `period_type` | CHARACTER VARYING(20) | NO | - | |
| `total_incidents` | INTEGER(32) | YES | 0 | |
| `critical_incidents` | INTEGER(32) | YES | 0 | |
| `high_incidents` | INTEGER(32) | YES | 0 | |
| `medium_incidents` | INTEGER(32) | YES | 0 | |
| `low_incidents` | INTEGER(32) | YES | 0 | |
| `cyberattack_count` | INTEGER(32) | YES | 0 | |
| `data_breach_count` | INTEGER(32) | YES | 0 | |
| `system_failure_count` | INTEGER(32) | YES | 0 | |
| `fraud_count` | INTEGER(32) | YES | 0 | |
| `unauthorized_access_count` | INTEGER(32) | YES | 0 | |
| `incidents_resolved` | INTEGER(32) | YES | 0 | |
| `avg_resolution_hours` | NUMERIC(10,2) | YES | - | |
| `total_financial_loss` | NUMERIC(15,2) | YES | 0.00 | |
| `total_customers_affected` | INTEGER(32) | YES | 0 | |
| `total_availability_loss_hours` | NUMERIC(10,2) | YES | 0 | |
| `notifications_sent_on_time` | INTEGER(32) | YES | 0 | |
| `notifications_late` | INTEGER(32) | YES | 0 | |
| `impact_assessments_on_time` | INTEGER(32) | YES | 0 | |
| `impact_assessments_late` | INTEGER(32) | YES | 0 | |
| `generated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_incident_metrics_period` (INDEX) ON `report_period`
- `idx_incident_metrics_type` (INDEX) ON `period_type`
- `incident_metrics_pkey` (PRIMARY KEY) ON `id`
- `incident_metrics_report_period_period_type_key` (UNIQUE) ON `report_period`, `period_type`

---

## Table: `incident_notifications`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `incident_id` | UUID | YES | - | |
| `notification_type` | CHARACTER VARYING(50) | NO | - | |
| `recipient_type` | CHARACTER VARYING(50) | NO | - | |
| `recipient_email` | CHARACTER VARYING(255) | YES | - | |
| `subject` | CHARACTER VARYING(255) | NO | - | |
| `content` | TEXT | NO | - | |
| `sent_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `delivery_status` | CHARACTER VARYING(20) | YES | 'pending'::character varying | |
| `reference_number` | CHARACTER VARYING(100) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_incident_notifications_incident_id` (INDEX) ON `incident_id`
- `idx_incident_notifications_status` (INDEX) ON `delivery_status`
- `idx_incident_notifications_type` (INDEX) ON `notification_type`
- `incident_notifications_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `incident_id` → `security_incidents.id` (ON DELETE CASCADE)

---

## Table: `incident_updates`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `incident_id` | UUID | YES | - | |
| `update_type` | CHARACTER VARYING(50) | NO | - | |
| `previous_status` | CHARACTER VARYING(30) | YES | - | |
| `new_status` | CHARACTER VARYING(30) | YES | - | |
| `content` | TEXT | NO | - | |
| `attachments` | JSONB | YES | - | |
| `created_by` | CHARACTER VARYING(255) | NO | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_incident_updates_created_at` (INDEX) ON `created_at`
- `idx_incident_updates_incident_id` (INDEX) ON `incident_id`
- `incident_updates_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `incident_id` → `security_incidents.id` (ON DELETE CASCADE)

---

## Table: `insurance_products`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | YES | - | |
| `premium` | NUMERIC(15,2) | NO | - | |
| `coverage_amount` | NUMERIC(15,2) | YES | - | |
| `coverage_type` | CHARACTER VARYING(100) | YES | - | |
| `duration_months` | INTEGER(32) | YES | - | |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_insurance_products_active` (INDEX) ON `is_active`
- `idx_insurance_products_type` (INDEX) ON `coverage_type`
- `insurance_products_pkey` (PRIMARY KEY) ON `id`

---

## Table: `leaderboard_entries`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('leaderboard_entries_id_seq'::regclass) | |
| `leaderboard_id` | CHARACTER VARYING(100) | NO | - | |
| `user_id` | UUID | NO | - | |
| `rank` | INTEGER(32) | NO | - | |
| `display_name` | CHARACTER VARYING(255) | NO | - | |
| `score` | NUMERIC | NO | - | |
| `badge_icon` | CHARACTER VARYING(50) | YES | - | |
| `rank_tier` | CHARACTER VARYING(10) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_leaderboard_entries_leaderboard_id` (INDEX) ON `leaderboard_id`
- `idx_leaderboard_entries_rank` (INDEX) ON `rank`
- `idx_leaderboard_entries_score` (INDEX) ON `score`
- `idx_leaderboard_entries_user_id` (INDEX) ON `user_id`
- `leaderboard_entries_pkey` (PRIMARY KEY) ON `id`
- `unique_leaderboard_entry` (UNIQUE) ON `leaderboard_id`, `user_id`

**Foreign Keys**:

- `leaderboard_id` → `leaderboards.leaderboard_id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `leaderboard_incentives`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `ranking_id` | UUID | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `currency` | CHARACTER VARYING(3) | YES | 'NAD'::character varying | |
| `incentive_type` | CHARACTER VARYING(50) | NO | - | |
| `status` | CHARACTER VARYING(50) | YES | 'pending'::character varying | |
| `paid_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `payment_reference` | CHARACTER VARYING(255) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_leaderboard_incentives_ranking` (INDEX) ON `ranking_id`
- `idx_leaderboard_incentives_status` (INDEX) ON `status`
- `leaderboard_incentives_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `ranking_id` → `leaderboard_rankings.id` (ON DELETE CASCADE)

---

## Table: `leaderboard_rankings`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `category` | CHARACTER VARYING(50) | NO | - | |
| `period` | CHARACTER VARYING(20) | NO | - | |
| `participant_id` | CHARACTER VARYING(255) | NO | - | |
| `participant_name` | CHARACTER VARYING(255) | NO | - | |
| `rank` | INTEGER(32) | NO | - | |
| `metrics` | JSONB | NO | - | |
| `total_score` | NUMERIC(5,2) | NO | - | |
| `incentive_amount` | NUMERIC(15,2) | YES | - | |
| `incentive_currency` | CHARACTER VARYING(3) | YES | 'NAD'::character varying | |
| `incentive_type` | CHARACTER VARYING(50) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_leaderboard_rankings_category` (INDEX) ON `category`
- `idx_leaderboard_rankings_participant` (INDEX) ON `participant_id`
- `idx_leaderboard_rankings_period` (INDEX) ON `period`
- `idx_leaderboard_rankings_rank` (INDEX) ON `category`, `period`, `rank`
- `leaderboard_rankings_category_period_participant_id_key` (UNIQUE) ON `category`, `period`, `participant_id`
- `leaderboard_rankings_pkey` (PRIMARY KEY) ON `id`

---

## Table: `leaderboards`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('leaderboards_id_seq'::regclass) | |
| `leaderboard_id` | CHARACTER VARYING(100) | NO | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | YES | - | |
| `metric` | CHARACTER VARYING(50) | NO | - | |
| `period` | CHARACTER VARYING(20) | NO | - | |
| `entries` | JSONB | NO | '[]'::jsonb | |
| `last_updated` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_leaderboards_leaderboard_id` (INDEX) ON `leaderboard_id`
- `idx_leaderboards_metric` (INDEX) ON `metric`
- `idx_leaderboards_period` (INDEX) ON `period`
- `leaderboards_leaderboard_id_key` (UNIQUE) ON `leaderboard_id`
- `leaderboards_pkey` (PRIMARY KEY) ON `id`

---

## Table: `learning_paths`

**Columns**: 16

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('learning_paths_id_seq'::regclass) | |
| `path_id` | CHARACTER VARYING(100) | NO | - | |
| `user_id` | UUID | NO | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | YES | - | |
| `difficulty` | CHARACTER VARYING(20) | NO | - | |
| `focus_category` | CHARACTER VARYING(50) | YES | - | |
| `module_ids` | ARRAY | NO | - | |
| `modules_completed` | INTEGER(32) | NO | 0 | |
| `total_modules` | INTEGER(32) | NO | - | |
| `progress_percentage` | INTEGER(32) | NO | 0 | |
| `status` | CHARACTER VARYING(20) | NO | 'active'::character varying | |
| `estimated_completion_hours` | INTEGER(32) | YES | - | |
| `started_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `completed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_learning_paths_category` (INDEX) ON `focus_category`
- `idx_learning_paths_path_id` (INDEX) ON `path_id`
- `idx_learning_paths_status` (INDEX) ON `status`
- `idx_learning_paths_user_id` (INDEX) ON `user_id`
- `learning_paths_path_id_key` (UNIQUE) ON `path_id`
- `learning_paths_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `learning_progress`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | YES | - | |
| `module_id` | TEXT | NO | - | |
| `module_name` | TEXT | YES | - | |
| `module_category` | TEXT | YES | - | |
| `status` | TEXT | NO | - | |
| `progress_percentage` | INTEGER(32) | YES | - | |
| `quiz_score` | NUMERIC(5,2) | YES | - | |
| `time_spent` | INTEGER(32) | YES | - | |
| `started_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `completed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `last_accessed_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_learning_progress_module` (INDEX) ON `module_id`
- `idx_learning_progress_status` (INDEX) ON `status`
- `idx_learning_progress_user_id` (INDEX) ON `user_id`, `last_accessed_at`
- `learning_progress_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `learning_recommendations`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `session_id` | UUID | YES | - | |
| `user_id` | UUID | YES | - | |
| `primary_segment` | TEXT | YES | - | |
| `segment_distribution` | JSONB | YES | '{}'::jsonb | |
| `recommended_modules` | JSONB | YES | '[]'::jsonb | |
| `weak_areas` | JSONB | YES | '[]'::jsonb | |
| `reasoning` | TEXT | YES | - | |
| `generated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_learning_recommendations_user_id` (INDEX) ON `user_id`, `generated_at`
- `learning_recommendations_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `session_id` → `sessions.id` (ON DELETE SET NULL)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `level_up_events`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('level_up_events_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `old_level` | INTEGER(32) | NO | - | |
| `new_level` | INTEGER(32) | NO | - | |
| `bp_earned` | INTEGER(32) | NO | - | |
| `rewards_unlocked` | ARRAY | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_level_up_events_created_at` (INDEX) ON `created_at`
- `idx_level_up_events_user_id` (INDEX) ON `user_id`
- `level_up_events_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `levels`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `level` | INTEGER(32) | NO | - | |
| `name` | CHARACTER VARYING(100) | NO | - | |
| `icon` | CHARACTER VARYING(100) | NO | - | |
| `color` | CHARACTER VARYING(50) | NO | - | |
| `xp_required` | INTEGER(32) | NO | - | |
| `points_bonus` | INTEGER(32) | YES | 0 | |
| `features_unlocked` | JSONB | YES | '[]'::jsonb | |
| `points_multiplier` | NUMERIC(3,2) | YES | 1.00 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `levels_pkey` (PRIMARY KEY) ON `level`

---

## Table: `liquidity_recommendations`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `agent_id` | UUID | NO | - | |
| `recommendation_type` | CHARACTER VARYING(50) | NO | - | |
| `priority` | CHARACTER VARYING(50) | NO | - | |
| `details` | TEXT | NO | - | |
| `estimated_impact` | TEXT | YES | - | |
| `demand_forecast` | JSONB | YES | - | |
| `agent_action` | CHARACTER VARYING(50) | YES | - | |
| `action_timestamp` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_liquidity_recommendations_action` (INDEX) ON `agent_action`
- `idx_liquidity_recommendations_agent` (INDEX) ON `agent_id`
- `idx_liquidity_recommendations_priority` (INDEX) ON `priority`
- `idx_liquidity_recommendations_type` (INDEX) ON `recommendation_type`
- `liquidity_recommendations_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `agent_id` → `agents.id` (ON DELETE CASCADE)

---

## Table: `literacy_certificates`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('literacy_certificates_id_seq'::regclass) | |
| `certificate_id` | CHARACTER VARYING(100) | NO | - | |
| `user_id` | UUID | NO | - | |
| `module_id` | CHARACTER VARYING(100) | NO | - | |
| `module_title` | CHARACTER VARYING(255) | NO | - | |
| `category` | CHARACTER VARYING(50) | NO | - | |
| `difficulty` | CHARACTER VARYING(20) | NO | - | |
| `score` | INTEGER(32) | NO | - | |
| `issued_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `expiry_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `verification_code` | CHARACTER VARYING(100) | NO | - | |

**Indexes**:

- `idx_certificates_certificate_id` (INDEX) ON `certificate_id`
- `idx_certificates_module_id` (INDEX) ON `module_id`
- `idx_certificates_user_id` (INDEX) ON `user_id`
- `idx_certificates_verification_code` (INDEX) ON `verification_code`
- `literacy_certificates_certificate_id_key` (UNIQUE) ON `certificate_id`
- `literacy_certificates_pkey` (PRIMARY KEY) ON `id`
- `literacy_certificates_verification_code_key` (UNIQUE) ON `verification_code`

**Foreign Keys**:

- `module_id` → `financial_literacy_modules.module_id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `loan_applications`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `merchant_id` | UUID | YES | - | |
| `credit_assessment_id` | UUID | YES | - | |
| `loan_amount_requested` | NUMERIC(15,2) | NO | - | |
| `loan_amount_approved` | NUMERIC(15,2) | YES | - | |
| `interest_rate` | NUMERIC(5,4) | YES | - | |
| `term_months` | INTEGER(32) | YES | - | |
| `status` | TEXT | NO | - | |
| `applied_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `approved_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `disbursed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_loan_applications_merchant_id` (INDEX) ON `merchant_id`, `applied_at`
- `idx_loan_applications_status` (INDEX) ON `status`
- `loan_applications_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `credit_assessment_id` → `credit_assessments.id` (ON DELETE SET NULL)
- `merchant_id` → `merchants.id` (ON DELETE CASCADE)

---

## Table: `loan_revenue`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('loan_revenue_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `loan_id` | CHARACTER VARYING(255) | NO | - | |
| `revenue_type` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `loan_amount` | NUMERIC(15,2) | NO | - | |
| `apr` | NUMERIC(5,2) | NO | - | |
| `term_months` | INTEGER(32) | NO | - | |
| `description` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_loan_revenue_loan_id` (INDEX) ON `loan_id`
- `idx_loan_revenue_type` (INDEX) ON `revenue_type`
- `idx_loan_revenue_user_id` (INDEX) ON `user_id`
- `loan_revenue_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `merchant_analytics`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `merchant_id` | UUID | YES | - | |
| `merchant_name` | CHARACTER VARYING(255) | YES | - | |
| `date` | DATE | NO | - | |
| `transaction_count` | INTEGER(32) | NO | 0 | |
| `total_volume` | NUMERIC(15,2) | NO | 0 | |
| `average_transaction_amount` | NUMERIC(10,2) | YES | - | |
| `unique_customers` | INTEGER(32) | NO | 0 | |
| `payment_method_breakdown` | JSONB | YES | - | |
| `peak_hours` | JSONB | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_merchant_analytics_date` (INDEX) ON `date`
- `idx_merchant_analytics_merchant_date` (INDEX) ON `merchant_id`, `date`
- `idx_merchant_analytics_name` (INDEX) ON `merchant_name`
- `merchant_analytics_merchant_id_date_key` (UNIQUE) ON `merchant_id`, `date`
- `merchant_analytics_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `merchant_id` → `merchants.id` (ON DELETE SET NULL)

---

## Table: `merchant_onboarding`

**Columns**: 15

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `onboarding_id` | CHARACTER VARYING(50) | NO | - | |
| `business_name` | CHARACTER VARYING(255) | NO | - | |
| `business_type` | CHARACTER VARYING(50) | NO | - | |
| `location` | JSONB | NO | - | |
| `contact` | JSONB | NO | - | |
| `documents` | JSONB | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'document_verification'::character varying | |
| `progress` | INTEGER(32) | YES | 0 | |
| `current_step` | CHARACTER VARYING(100) | YES | - | |
| `completed_steps` | ARRAY | YES | - | |
| `pending_steps` | ARRAY | YES | - | |
| `estimated_completion` | DATE | YES | - | |
| `issues` | JSONB | YES | '[]'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_merchant_onboarding_business_type` (INDEX) ON `business_type`
- `idx_merchant_onboarding_created` (INDEX) ON `created_at`
- `idx_merchant_onboarding_status` (INDEX) ON `status`
- `merchant_onboarding_pkey` (PRIMARY KEY) ON `onboarding_id`

---

## Table: `merchants`

**Columns**: 15

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `external_id` | TEXT | NO | - | |
| `user_id` | UUID | YES | - | |
| `business_name` | TEXT | NO | - | |
| `business_type` | TEXT | YES | - | |
| `merchant_category_code` | TEXT | YES | - | |
| `business_registration_number` | TEXT | YES | - | |
| `business_age_months` | INTEGER(32) | YES | - | |
| `average_monthly_revenue` | NUMERIC(15,2) | YES | - | |
| `location_city` | TEXT | YES | - | |
| `location_latitude` | NUMERIC(10,8) | YES | - | |
| `location_longitude` | NUMERIC(11,8) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_merchants_external_id` (INDEX) ON `external_id`
- `idx_merchants_mcc` (INDEX) ON `merchant_category_code`
- `idx_merchants_user_id` (INDEX) ON `user_id`
- `merchants_external_id_key` (UNIQUE) ON `external_id`
- `merchants_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `messages`

**Columns**: 6

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `session_id` | UUID | NO | - | |
| `role` | TEXT | NO | - | |
| `content` | TEXT | NO | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_messages_session_id` (INDEX) ON `session_id`, `created_at`
- `messages_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `session_id` → `sessions.id` (ON DELETE CASCADE)

---

## Table: `migration_history`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('migration_history_id_seq'::regclass) | |
| `migration_name` | CHARACTER VARYING(255) | NO | - | |
| `migration_version` | CHARACTER VARYING(50) | YES | - | |
| `checksum` | CHARACTER VARYING(64) | YES | - | |
| `applied_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `applied_by` | CHARACTER VARYING(255) | YES | 'system'::character varying | |
| `execution_time_ms` | INTEGER(32) | YES | - | |
| `status` | CHARACTER VARYING(20) | YES | 'completed'::character varying | |
| `rollback_sql` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `migration_history_migration_name_key` (UNIQUE) ON `migration_name`
- `migration_history_pkey` (PRIMARY KEY) ON `id`

---

## Table: `migrations`

**Columns**: 4

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('migrations_id_seq'::regclass) | |
| `filename` | CHARACTER VARYING(255) | NO | - | |
| `executed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `checksum` | CHARACTER VARYING(64) | YES | - | |

**Indexes**:

- `migrations_filename_key` (UNIQUE) ON `filename`
- `migrations_pkey` (PRIMARY KEY) ON `id`

---

## Table: `ml_models`

**Columns**: 20

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `model_name` | TEXT | NO | - | |
| `model_type` | TEXT | NO | - | |
| `version` | TEXT | NO | - | |
| `algorithm` | TEXT | YES | - | |
| `hyperparameters` | JSONB | YES | '{}'::jsonb | |
| `feature_names` | JSONB | YES | '[]'::jsonb | |
| `model_path` | TEXT | YES | - | |
| `model_size_mb` | NUMERIC(10,2) | YES | - | |
| `training_accuracy` | NUMERIC(5,4) | YES | - | |
| `validation_accuracy` | NUMERIC(5,4) | YES | - | |
| `test_accuracy` | NUMERIC(5,4) | YES | - | |
| `training_samples` | INTEGER(32) | YES | - | |
| `training_duration_seconds` | INTEGER(32) | YES | - | |
| `trained_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `trained_by` | TEXT | YES | - | |
| `status` | TEXT | NO | - | |
| `is_production` | BOOLEAN | YES | false | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_ml_models_is_production` (INDEX) ON `model_name`, `is_production`
- `idx_ml_models_name_version` (INDEX) ON `model_name`, `version`
- `idx_ml_models_status` (INDEX) ON `status`
- `ml_models_pkey` (PRIMARY KEY) ON `id`

---

## Table: `model_performance`

**Columns**: 17

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `model_id` | UUID | YES | - | |
| `period_start` | TIMESTAMP WITH TIME ZONE | NO | - | |
| `period_end` | TIMESTAMP WITH TIME ZONE | NO | - | |
| `prediction_count` | INTEGER(32) | YES | - | |
| `accuracy` | NUMERIC(5,4) | YES | - | |
| `precision_score` | NUMERIC(5,4) | YES | - | |
| `recall_score` | NUMERIC(5,4) | YES | - | |
| `f1_score` | NUMERIC(5,4) | YES | - | |
| `roc_auc_score` | NUMERIC(5,4) | YES | - | |
| `avg_inference_time_ms` | NUMERIC(10,2) | YES | - | |
| `p95_inference_time_ms` | NUMERIC(10,2) | YES | - | |
| `p99_inference_time_ms` | NUMERIC(10,2) | YES | - | |
| `avg_memory_mb` | NUMERIC(10,2) | YES | - | |
| `peak_memory_mb` | NUMERIC(10,2) | YES | - | |
| `computed_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_model_performance_model_id` (INDEX) ON `model_id`, `period_end`
- `model_performance_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `model_id` → `ml_models.id` (ON DELETE CASCADE)

---

## Table: `module_quizzes`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('module_quizzes_id_seq'::regclass) | |
| `module_id` | CHARACTER VARYING(100) | NO | - | |
| `quiz_title` | CHARACTER VARYING(255) | NO | - | |
| `passing_score` | INTEGER(32) | NO | 70 | |
| `time_limit_minutes` | INTEGER(32) | YES | - | |
| `max_attempts` | INTEGER(32) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_module_quizzes_module_id` (INDEX) ON `module_id`
- `module_quizzes_module_id_key` (UNIQUE) ON `module_id`
- `module_quizzes_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `module_id` → `financial_literacy_modules.module_id` (ON DELETE CASCADE)

---

## Table: `money_requests`

**Columns**: 14

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `from_user_id` | CHARACTER VARYING(255) | NO | - | |
| `to_user_id` | CHARACTER VARYING(255) | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `paid_amount` | NUMERIC(15,2) | YES | 0.00 | |
| `currency` | CHARACTER VARYING(10) | YES | 'N$'::character varying | |
| `note` | TEXT | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'pending'::character varying | |
| `paid_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `description` | TEXT | YES | - | |
| `expires_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_money_requests_expires_at` (INDEX) ON `expires_at`
- `idx_money_requests_from_user_id` (INDEX) ON `from_user_id`
- `idx_money_requests_status` (INDEX) ON `status`
- `idx_money_requests_to_user_id` (INDEX) ON `to_user_id`
- `money_requests_pkey` (PRIMARY KEY) ON `id`

---

## Table: `nampost_branch_load`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `branch_id` | CHARACTER VARYING(50) | NO | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `current_load` | INTEGER(32) | NO | - | |
| `wait_time` | INTEGER(32) | NO | - | |
| `queue_length` | INTEGER(32) | YES | 0 | |
| `concentration_level` | CHARACTER VARYING(50) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_nampost_branch_load_branch` (INDEX) ON `branch_id`
- `idx_nampost_branch_load_concentration` (INDEX) ON `concentration_level`
- `idx_nampost_branch_load_timestamp` (INDEX) ON `timestamp`
- `nampost_branch_load_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `branch_id` → `nampost_branches.branch_id` (ON DELETE CASCADE)

---

## Table: `nampost_branches`

**Columns**: 17

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `branch_id` | CHARACTER VARYING(50) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `address` | CHARACTER VARYING(255) | NO | - | |
| `city` | CHARACTER VARYING(100) | NO | - | |
| `region` | CHARACTER VARYING(50) | NO | - | |
| `latitude` | NUMERIC(10,8) | NO | - | |
| `longitude` | NUMERIC(11,8) | NO | - | |
| `phone_number` | CHARACTER VARYING(20) | YES | - | |
| `email` | CHARACTER VARYING(255) | YES | - | |
| `services` | ARRAY | NO | - | |
| `operating_hours` | JSONB | YES | - | |
| `capacity_metrics` | JSONB | YES | - | |
| `current_load` | INTEGER(32) | YES | 0 | |
| `average_wait_time` | INTEGER(32) | YES | 0 | |
| `status` | CHARACTER VARYING(50) | YES | 'active'::character varying | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_nampost_branches_city` (INDEX) ON `city`
- `idx_nampost_branches_latitude` (INDEX) ON `latitude`
- `idx_nampost_branches_longitude` (INDEX) ON `longitude`
- `idx_nampost_branches_region` (INDEX) ON `region`
- `idx_nampost_branches_status` (INDEX) ON `status`
- `nampost_branches_pkey` (PRIMARY KEY) ON `branch_id`

---

## Table: `nampost_staff`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `staff_id` | CHARACTER VARYING(50) | NO | - | |
| `branch_id` | CHARACTER VARYING(50) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `role` | CHARACTER VARYING(50) | NO | - | |
| `phone_number` | CHARACTER VARYING(20) | YES | - | |
| `email` | CHARACTER VARYING(255) | YES | - | |
| `specialization` | ARRAY | YES | - | |
| `availability` | JSONB | YES | - | |
| `performance_metrics` | JSONB | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_nampost_staff_branch` (INDEX) ON `branch_id`
- `idx_nampost_staff_role` (INDEX) ON `role`
- `nampost_staff_pkey` (PRIMARY KEY) ON `staff_id`

**Foreign Keys**:

- `branch_id` → `nampost_branches.branch_id` (ON DELETE CASCADE)

---

## Table: `namqr_codes`

**Columns**: 19

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | NO | - | |
| `qr_data` | TEXT | NO | - | |
| `qr_image_url` | TEXT | YES | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `currency` | TEXT | NO | 'NAD'::text | |
| `merchant_name` | TEXT | YES | - | |
| `reference` | TEXT | YES | - | |
| `token_vault_id` | TEXT | YES | - | |
| `crc_value` | TEXT | YES | - | |
| `status` | TEXT | NO | 'active'::text | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `used_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `used_by_user_id` | UUID | YES | - | |
| `transaction_id` | UUID | YES | - | |
| `generated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_namqr_codes_expires_at` (INDEX) ON `expires_at`
- `idx_namqr_codes_reference` (INDEX) ON `reference`
- `idx_namqr_codes_status` (INDEX) ON `status`
- `idx_namqr_codes_token_vault_id` (INDEX) ON `token_vault_id`
- `idx_namqr_codes_transaction_id` (INDEX) ON `transaction_id`
- `idx_namqr_codes_user_id` (INDEX) ON `user_id`, `generated_at`
- `namqr_codes_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `transaction_id` → `transactions.id` (ON DELETE SET NULL)
- `used_by_user_id` → `users.id` (ON DELETE SET NULL)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `namqr_validations`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `namqr_code_id` | UUID | YES | - | |
| `qr_data` | TEXT | NO | - | |
| `validation_result` | TEXT | NO | - | |
| `validation_details` | JSONB | YES | '{}'::jsonb | |
| `validated_by_user_id` | UUID | YES | - | |
| `validated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `ip_address` | INET | YES | - | |
| `user_agent` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_namqr_validations_code_id` (INDEX) ON `namqr_code_id`
- `idx_namqr_validations_result` (INDEX) ON `validation_result`, `validated_at`
- `idx_namqr_validations_user_id` (INDEX) ON `validated_by_user_id`
- `namqr_validations_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `namqr_code_id` → `namqr_codes.id` (ON DELETE SET NULL)
- `validated_by_user_id` → `users.id` (ON DELETE SET NULL)

---

## Table: `notification_logs`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `body` | TEXT | NO | - | |
| `data` | JSONB | YES | '{}'::jsonb | |
| `target_users` | JSONB | YES | '[]'::jsonb | |
| `sent_count` | INTEGER(32) | YES | 0 | |
| `failed_count` | INTEGER(32) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_notification_logs_created` (INDEX) ON `created_at`
- `notification_logs_pkey` (PRIMARY KEY) ON `id`

---

## Table: `notification_preferences`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `transactions_enabled` | BOOLEAN | YES | true | |
| `security_enabled` | BOOLEAN | YES | true | |
| `promotions_enabled` | BOOLEAN | YES | true | |
| `reminders_enabled` | BOOLEAN | YES | true | |
| `achievements_enabled` | BOOLEAN | YES | true | |
| `quests_enabled` | BOOLEAN | YES | true | |
| `learning_enabled` | BOOLEAN | YES | true | |
| `quiet_hours_start` | TIME WITHOUT TIME ZONE | YES | - | |
| `quiet_hours_end` | TIME WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_notification_preferences_user` (INDEX) ON `user_id`
- `notification_preferences_pkey` (PRIMARY KEY) ON `id`
- `notification_preferences_user_id_key` (UNIQUE) ON `user_id`

---

## Table: `notifications`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `type` | CHARACTER VARYING(50) | NO | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `message` | TEXT | NO | - | |
| `is_read` | BOOLEAN | YES | false | |
| `related_id` | UUID | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `data` | JSONB | YES | '{}'::jsonb | |
| `read_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |

**Indexes**:

- `idx_notifications_created_at` (INDEX) ON `created_at`
- `idx_notifications_is_read` (INDEX) ON `is_read`
- `idx_notifications_unread` (INDEX) ON `user_id`, `created_at`
- `idx_notifications_user_id` (INDEX) ON `user_id`
- `notifications_pkey` (PRIMARY KEY) ON `id`

---

## Table: `oauth_authorization_codes`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `code` | CHARACTER VARYING(255) | NO | - | |
| `client_id` | CHARACTER VARYING(10) | NO | - | |
| `redirect_uri` | TEXT | NO | - | |
| `code_challenge` | CHARACTER VARYING(255) | NO | - | |
| `code_challenge_method` | CHARACTER VARYING(10) | NO | 'S256'::character varying | |
| `scope` | TEXT | NO | - | |
| `account_holder_id` | CHARACTER VARYING(255) | NO | - | |
| `expires_at` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `used` | BOOLEAN | NO | false | |
| `used_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |

**Indexes**:

- `idx_oauth_codes_account_holder` (INDEX) ON `account_holder_id`
- `idx_oauth_codes_client` (INDEX) ON `client_id`
- `idx_oauth_codes_expires` (INDEX) ON `expires_at`
- `idx_oauth_codes_used` (INDEX) ON `used`
- `oauth_authorization_codes_pkey` (PRIMARY KEY) ON `code`

---

## Table: `oauth_consents`

**Columns**: 14

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `consent_id` | CHARACTER VARYING(255) | NO | - | |
| `account_holder_id` | CHARACTER VARYING(255) | NO | - | |
| `data_provider_id` | CHARACTER VARYING(10) | NO | - | |
| `tpp_id` | CHARACTER VARYING(10) | NO | - | |
| `permissions` | JSONB | NO | - | |
| `status` | CHARACTER VARYING(50) | NO | 'AwaitingAuthorisation'::character varying | |
| `expiration_date_time` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `requested_expiration_date_time` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `transaction_from_date_time` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `transaction_to_date_time` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `status_update_date_time` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `revoked_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `revoked_by` | CHARACTER VARYING(255) | YES | - | |

**Indexes**:

- `idx_oauth_consents_account_holder` (INDEX) ON `account_holder_id`
- `idx_oauth_consents_data_provider` (INDEX) ON `data_provider_id`
- `idx_oauth_consents_expiration` (INDEX) ON `expiration_date_time`
- `idx_oauth_consents_status` (INDEX) ON `status`
- `idx_oauth_consents_tpp` (INDEX) ON `tpp_id`
- `oauth_consents_pkey` (PRIMARY KEY) ON `consent_id`

---

## Table: `oauth_par_requests`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `request_uri` | CHARACTER VARYING(500) | NO | - | |
| `client_id` | CHARACTER VARYING(10) | NO | - | |
| `redirect_uri` | TEXT | NO | - | |
| `code_challenge` | CHARACTER VARYING(255) | NO | - | |
| `code_challenge_method` | CHARACTER VARYING(10) | NO | 'S256'::character varying | |
| `scope` | TEXT | NO | - | |
| `expires_at` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `used` | BOOLEAN | NO | false | |
| `used_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |

**Indexes**:

- `idx_oauth_par_client` (INDEX) ON `client_id`
- `idx_oauth_par_expires` (INDEX) ON `expires_at`
- `idx_oauth_par_used` (INDEX) ON `used`
- `oauth_par_requests_pkey` (PRIMARY KEY) ON `request_uri`

---

## Table: `onboarding_documents`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `onboarding_id` | CHARACTER VARYING(50) | NO | - | |
| `document_type` | CHARACTER VARYING(50) | NO | - | |
| `document_data` | BYTEA | YES | - | |
| `document_url` | TEXT | YES | - | |
| `verification_status` | CHARACTER VARYING(50) | YES | 'pending'::character varying | |
| `verified_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `verified_by` | CHARACTER VARYING(255) | YES | - | |
| `rejection_reason` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_onboarding_documents_onboarding` (INDEX) ON `onboarding_id`
- `idx_onboarding_documents_status` (INDEX) ON `verification_status`
- `idx_onboarding_documents_type` (INDEX) ON `document_type`
- `onboarding_documents_pkey` (PRIMARY KEY) ON `id`

---

## Table: `otp_codes`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('otp_codes_id_seq'::regclass) | |
| `phone_number` | CHARACTER VARYING(20) | NO | - | |
| `code` | CHARACTER VARYING(6) | NO | - | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NO | - | |
| `used` | BOOLEAN | YES | false | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_otp_codes_expires` (INDEX) ON `expires_at`
- `idx_otp_codes_phone` (INDEX) ON `phone_number`
- `otp_codes_phone_number_key` (UNIQUE) ON `phone_number`
- `otp_codes_pkey` (PRIMARY KEY) ON `id`

---

## Table: `participants`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `participant_id` | CHARACTER VARYING(10) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `role` | CHARACTER VARYING(20) | NO | - | |
| `status` | CHARACTER VARYING(20) | NO | 'Active'::character varying | |
| `registered_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `suspended_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `revoked_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_participants_registered` (INDEX) ON `registered_at`
- `idx_participants_role` (INDEX) ON `role`
- `idx_participants_status` (INDEX) ON `status`
- `participants_pkey` (PRIMARY KEY) ON `participant_id`

---

## Table: `payment_method_analytics`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `payment_method` | CHARACTER VARYING(50) | NO | - | |
| `date` | DATE | NO | - | |
| `transaction_count` | INTEGER(32) | NO | 0 | |
| `total_volume` | NUMERIC(15,2) | NO | 0 | |
| `average_transaction_amount` | NUMERIC(10,2) | YES | - | |
| `unique_users` | INTEGER(32) | NO | 0 | |
| `success_rate` | NUMERIC(5,2) | YES | - | |
| `average_processing_time_ms` | INTEGER(32) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_payment_method_analytics_date` (INDEX) ON `date`
- `idx_payment_method_analytics_method_date` (INDEX) ON `payment_method`, `date`
- `payment_method_analytics_payment_method_date_key` (UNIQUE) ON `payment_method`, `date`
- `payment_method_analytics_pkey` (PRIMARY KEY) ON `id`

---

## Table: `payments`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | CHARACTER VARYING(255) | NO | - | |
| `payer_account_id` | CHARACTER VARYING(255) | NO | - | |
| `beneficiary_account_id` | CHARACTER VARYING(255) | NO | - | |
| `amount` | BIGINT(64) | NO | - | |
| `currency` | CHARACTER VARYING(3) | NO | 'NAD'::character varying | |
| `payment_type` | CHARACTER VARYING(50) | NO | 'Domestic On-us'::character varying | |
| `status` | CHARACTER VARYING(50) | NO | 'Accepted'::character varying | |
| `reference` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `tpp_id` | CHARACTER VARYING(10) | NO | - | |
| `consent_id` | CHARACTER VARYING(255) | NO | - | |

**Indexes**:

- `idx_payments_beneficiary` (INDEX) ON `beneficiary_account_id`
- `idx_payments_consent` (INDEX) ON `consent_id`
- `idx_payments_created` (INDEX) ON `created_at`
- `idx_payments_payer` (INDEX) ON `payer_account_id`
- `idx_payments_status` (INDEX) ON `status`
- `idx_payments_tpp` (INDEX) ON `tpp_id`
- `payments_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `consent_id` → `oauth_consents.consent_id` (ON DELETE CASCADE)

---

## Table: `periodic_surveys`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `survey_period` | CHARACTER VARYING(50) | NO | - | |
| `period_start` | DATE | NO | - | |
| `period_end` | DATE | NO | - | |
| `questions` | JSONB | NO | - | |
| `completed` | BOOLEAN | YES | false | |
| `completed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `incentive_credited` | BOOLEAN | YES | false | |
| `incentive_amount` | NUMERIC(10,2) | YES | - | |
| `channel` | CHARACTER VARYING(50) | NO | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_periodic_surveys_completed` (INDEX) ON `completed`
- `idx_periodic_surveys_created_at` (INDEX) ON `created_at`
- `idx_periodic_surveys_period_start` (INDEX) ON `period_start`
- `idx_periodic_surveys_survey_period` (INDEX) ON `survey_period`
- `idx_periodic_surveys_unique` (UNIQUE) ON `user_id`, `survey_period`, `period_start`
- `idx_periodic_surveys_user_id` (INDEX) ON `user_id`
- `periodic_surveys_pkey` (PRIMARY KEY) ON `id`

---

## Table: `pin_audit_logs`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | UUID | NO | - | |
| `staff_id` | UUID | YES | - | |
| `operation_type` | CHARACTER VARYING(50) | NO | - | |
| `location` | CHARACTER VARYING(255) | NO | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `id_verification_status` | BOOLEAN | YES | - | |
| `reason` | TEXT | YES | - | |
| `ip_address` | INET | YES | - | |
| `success` | BOOLEAN | NO | - | |
| `error_message` | TEXT | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_pin_audit_logs_location` (INDEX) ON `location`
- `idx_pin_audit_logs_operation_type` (INDEX) ON `operation_type`
- `idx_pin_audit_logs_staff_id` (INDEX) ON `staff_id`
- `idx_pin_audit_logs_timestamp` (INDEX) ON `timestamp`
- `idx_pin_audit_logs_user_id` (INDEX) ON `user_id`
- `pin_audit_logs_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE NO ACTION)

---

## Table: `pin_audit_logs_archive`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | UUID | NO | - | |
| `staff_id` | UUID | YES | - | |
| `operation_type` | CHARACTER VARYING(50) | NO | - | |
| `location` | CHARACTER VARYING(255) | NO | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `id_verification_status` | BOOLEAN | YES | - | |
| `reason` | TEXT | YES | - | |
| `ip_address` | INET | YES | - | |
| `success` | BOOLEAN | NO | - | |
| `error_message` | TEXT | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_pin_audit_logs_archive_timestamp` (INDEX) ON `timestamp`
- `idx_pin_audit_logs_archive_user_id` (INDEX) ON `user_id`
- `pin_audit_logs_archive_location_idx` (INDEX) ON `location`
- `pin_audit_logs_archive_operation_type_idx` (INDEX) ON `operation_type`
- `pin_audit_logs_archive_pkey` (PRIMARY KEY) ON `id`
- `pin_audit_logs_archive_staff_id_idx` (INDEX) ON `staff_id`
- `pin_audit_logs_archive_timestamp_idx` (INDEX) ON `timestamp`
- `pin_audit_logs_archive_user_id_idx` (INDEX) ON `user_id`

---

## Table: `points_transactions`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `type` | CHARACTER VARYING(50) | NO | - | |
| `amount` | INTEGER(32) | NO | - | |
| `balance_after` | INTEGER(32) | NO | - | |
| `source` | CHARACTER VARYING(100) | NO | - | |
| `source_id` | CHARACTER VARYING(255) | YES | - | |
| `description` | TEXT | YES | - | |
| `multiplier_applied` | NUMERIC(3,2) | YES | 1.00 | |
| `base_amount` | INTEGER(32) | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |

**Indexes**:

- `idx_points_transactions_created_at` (INDEX) ON `created_at`
- `idx_points_transactions_source` (INDEX) ON `source`
- `idx_points_transactions_type` (INDEX) ON `type`
- `idx_points_transactions_user_id` (INDEX) ON `user_id`
- `points_transactions_pkey` (PRIMARY KEY) ON `id`

---

## Table: `predictions`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `model_id` | UUID | YES | - | |
| `prediction_type` | TEXT | NO | - | |
| `input_features` | JSONB | NO | - | |
| `prediction_result` | JSONB | NO | - | |
| `confidence` | NUMERIC(5,4) | YES | - | |
| `inference_time_ms` | NUMERIC(10,2) | YES | - | |
| `reference_type` | TEXT | YES | - | |
| `reference_id` | UUID | YES | - | |
| `predicted_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_predictions_model_id` (INDEX) ON `model_id`, `predicted_at`
- `idx_predictions_reference` (INDEX) ON `reference_type`, `reference_id`
- `idx_predictions_type` (INDEX) ON `prediction_type`, `predicted_at`
- `predictions_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `model_id` → `ml_models.id` (ON DELETE SET NULL)

---

## Table: `premium_subscriptions`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('premium_subscriptions_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `tier` | CHARACTER VARYING(20) | NO | - | |
| `status` | CHARACTER VARYING(20) | NO | 'active'::character varying | |
| `price` | NUMERIC(10,2) | NO | - | |
| `features` | JSONB | NO | - | |
| `start_date` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `end_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `auto_renew` | BOOLEAN | NO | true | |
| `next_billing_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `payment_method` | CHARACTER VARYING(50) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_subscriptions_next_billing` (INDEX) ON `next_billing_date`
- `idx_subscriptions_status` (INDEX) ON `status`
- `idx_subscriptions_tier` (INDEX) ON `tier`
- `idx_subscriptions_user_id` (INDEX) ON `user_id`
- `premium_subscriptions_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `processing_metrics`

**Columns**: 19

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `metric_date` | DATE | NO | - | |
| `metric_hour` | INTEGER(32) | NO | - | |
| `total_transactions` | INTEGER(32) | YES | 0 | |
| `successful_transactions` | INTEGER(32) | YES | 0 | |
| `failed_transactions` | INTEGER(32) | YES | 0 | |
| `avg_latency_ms` | NUMERIC(10,2) | YES | 0 | |
| `min_latency_ms` | INTEGER(32) | YES | - | |
| `max_latency_ms` | INTEGER(32) | YES | - | |
| `p95_latency_ms` | INTEGER(32) | YES | - | |
| `p99_latency_ms` | INTEGER(32) | YES | - | |
| `total_value` | NUMERIC(15,2) | YES | 0.00 | |
| `currency` | CHARACTER VARYING(10) | YES | 'NAD'::character varying | |
| `uptime_seconds` | INTEGER(32) | YES | 3600 | |
| `downtime_seconds` | INTEGER(32) | YES | 0 | |
| `uptime_percentage` | NUMERIC(5,2) | YES | 100.00 | |
| `error_count` | INTEGER(32) | YES | 0 | |
| `timeout_count` | INTEGER(32) | YES | 0 | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_processing_metrics_date` (INDEX) ON `metric_date`
- `processing_metrics_metric_date_metric_hour_key` (UNIQUE) ON `metric_date`, `metric_hour`
- `processing_metrics_pkey` (PRIMARY KEY) ON `id`

---

## Table: `push_tokens`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `token` | TEXT | NO | - | |
| `platform` | CHARACTER VARYING(20) | NO | - | |
| `device_id` | CHARACTER VARYING(255) | YES | - | |
| `device_name` | CHARACTER VARYING(255) | YES | - | |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_push_tokens_active` (INDEX) ON `is_active`
- `idx_push_tokens_token` (INDEX) ON `token`
- `idx_push_tokens_unique` (UNIQUE) ON `user_id`, `token`
- `idx_push_tokens_user` (INDEX) ON `user_id`
- `push_tokens_pkey` (PRIMARY KEY) ON `id`

---

## Table: `quests`

**Columns**: 17

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | CHARACTER VARYING(100) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | NO | - | |
| `icon` | CHARACTER VARYING(100) | NO | - | |
| `type` | CHARACTER VARYING(50) | NO | - | |
| `category` | CHARACTER VARYING(50) | NO | - | |
| `requirement_type` | CHARACTER VARYING(50) | NO | - | |
| `requirement_value` | INTEGER(32) | NO | - | |
| `requirement_action` | CHARACTER VARYING(100) | YES | - | |
| `points_reward` | INTEGER(32) | NO | 0 | |
| `xp_reward` | INTEGER(32) | NO | 0 | |
| `duration_hours` | INTEGER(32) | YES | - | |
| `cooldown_hours` | INTEGER(32) | YES | - | |
| `is_active` | BOOLEAN | YES | true | |
| `difficulty` | CHARACTER VARYING(20) | YES | 'easy'::character varying | |
| `display_order` | INTEGER(32) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `quests_pkey` (PRIMARY KEY) ON `id`

---

## Table: `quiz_attempts`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('quiz_attempts_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `module_id` | CHARACTER VARYING(100) | NO | - | |
| `attempt_number` | INTEGER(32) | NO | 1 | |
| `score` | INTEGER(32) | NO | - | |
| `total_questions` | INTEGER(32) | NO | - | |
| `correct_answers` | INTEGER(32) | NO | - | |
| `passed` | BOOLEAN | NO | - | |
| `time_taken_minutes` | INTEGER(32) | YES | - | |
| `answers` | JSONB | NO | - | |
| `bp_earned` | INTEGER(32) | NO | 0 | |
| `attempted_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_quiz_attempts_attempted_at` (INDEX) ON `attempted_at`
- `idx_quiz_attempts_module_id` (INDEX) ON `module_id`
- `idx_quiz_attempts_passed` (INDEX) ON `passed`
- `idx_quiz_attempts_user_id` (INDEX) ON `user_id`
- `quiz_attempts_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `module_id` → `financial_literacy_modules.module_id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `quiz_questions`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('quiz_questions_id_seq'::regclass) | |
| `question_id` | CHARACTER VARYING(100) | NO | - | |
| `module_id` | CHARACTER VARYING(100) | NO | - | |
| `question_text` | TEXT | NO | - | |
| `question_type` | CHARACTER VARYING(20) | NO | - | |
| `options` | JSONB | NO | - | |
| `correct_answer` | CHARACTER VARYING(255) | NO | - | |
| `explanation` | TEXT | NO | - | |
| `points` | INTEGER(32) | NO | 10 | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_quiz_questions_module_id` (INDEX) ON `module_id`
- `idx_quiz_questions_question_id` (INDEX) ON `question_id`
- `quiz_questions_pkey` (PRIMARY KEY) ON `id`
- `quiz_questions_question_id_key` (UNIQUE) ON `question_id`

**Foreign Keys**:

- `module_id` → `financial_literacy_modules.module_id` (ON DELETE CASCADE)

---

## Table: `rank_up_events`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('rank_up_events_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `old_rank` | CHARACTER VARYING(10) | NO | - | |
| `new_rank` | CHARACTER VARYING(10) | NO | - | |
| `level` | INTEGER(32) | NO | - | |
| `total_bp` | INTEGER(32) | NO | - | |
| `benefits_unlocked` | JSONB | NO | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_rank_up_events_created_at` (INDEX) ON `created_at`
- `idx_rank_up_events_new_rank` (INDEX) ON `new_rank`
- `idx_rank_up_events_user_id` (INDEX) ON `user_id`
- `rank_up_events_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `recommendation_effectiveness`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `recommendation_id` | UUID | NO | - | |
| `outcome` | CHARACTER VARYING(50) | YES | - | |
| `user_satisfaction` | INTEGER(32) | YES | - | |
| `wait_time_reduction` | INTEGER(32) | YES | - | |
| `distance_optimization` | NUMERIC(10,2) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_recommendation_effectiveness_outcome` (INDEX) ON `outcome`
- `idx_recommendation_effectiveness_recommendation` (INDEX) ON `recommendation_id`
- `recommendation_effectiveness_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `recommendation_id` → `recommendations.id` (ON DELETE CASCADE)

---

## Table: `recommendations`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `recommendation_type` | CHARACTER VARYING(50) | NO | - | |
| `primary_recommendation` | JSONB | NO | - | |
| `alternatives` | JSONB | YES | - | |
| `concentration_alert` | JSONB | YES | - | |
| `user_action` | CHARACTER VARYING(50) | YES | - | |
| `action_timestamp` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_recommendations_action` (INDEX) ON `user_action`
- `idx_recommendations_created` (INDEX) ON `created_at`
- `idx_recommendations_type` (INDEX) ON `recommendation_type`
- `idx_recommendations_user` (INDEX) ON `user_id`
- `recommendations_pkey` (PRIMARY KEY) ON `id`

---

## Table: `revenue_reports`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('revenue_reports_id_seq'::regclass) | |
| `report_period` | CHARACTER VARYING(20) | NO | - | |
| `start_date` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `end_date` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `total_revenue` | NUMERIC(15,2) | NO | - | |
| `transaction_fees` | NUMERIC(15,2) | NO | 0.00 | |
| `account_fees` | NUMERIC(15,2) | NO | 0.00 | |
| `loan_revenue` | NUMERIC(15,2) | NO | 0.00 | |
| `ai_tokens_revenue` | NUMERIC(15,2) | NO | 0.00 | |
| `subscription_revenue` | NUMERIC(15,2) | NO | 0.00 | |
| `total_users` | INTEGER(32) | NO | 0 | |
| `active_users` | INTEGER(32) | NO | 0 | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_revenue_reports_dates` (INDEX) ON `start_date`, `end_date`
- `idx_revenue_reports_period` (INDEX) ON `report_period`
- `revenue_reports_pkey` (PRIMARY KEY) ON `id`

---

## Table: `revenue_transactions`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('revenue_transactions_id_seq'::regclass) | |
| `transaction_id` | CHARACTER VARYING(255) | NO | - | |
| `user_id` | UUID | NO | - | |
| `revenue_stream` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `description` | TEXT | NO | - | |
| `metadata` | JSONB | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_revenue_transactions_amount` (INDEX) ON `amount`
- `idx_revenue_transactions_created_at` (INDEX) ON `created_at`
- `idx_revenue_transactions_stream` (INDEX) ON `revenue_stream`
- `idx_revenue_transactions_user_id` (INDEX) ON `user_id`
- `revenue_transactions_pkey` (PRIMARY KEY) ON `id`
- `revenue_transactions_transaction_id_key` (UNIQUE) ON `transaction_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `rewards`

**Columns**: 19

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | CHARACTER VARYING(100) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | NO | - | |
| `icon` | CHARACTER VARYING(100) | NO | - | |
| `image_url` | TEXT | YES | - | |
| `type` | CHARACTER VARYING(50) | NO | - | |
| `category` | CHARACTER VARYING(50) | YES | - | |
| `points_cost` | INTEGER(32) | NO | - | |
| `value_type` | CHARACTER VARYING(50) | YES | - | |
| `value_amount` | NUMERIC(10,2) | YES | - | |
| `stock` | INTEGER(32) | YES | - | |
| `max_per_user` | INTEGER(32) | YES | - | |
| `valid_days` | INTEGER(32) | YES | 30 | |
| `min_level` | INTEGER(32) | YES | 1 | |
| `is_active` | BOOLEAN | YES | true | |
| `is_featured` | BOOLEAN | YES | false | |
| `display_order` | INTEGER(32) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `rewards_pkey` (PRIMARY KEY) ON `id`

---

## Table: `savings_analytics`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `date` | DATE | NO | - | |
| `total_savings_wallets` | INTEGER(32) | YES | 0 | |
| `total_savings_balance` | NUMERIC(15,2) | YES | 0 | |
| `average_savings_balance` | NUMERIC(15,2) | YES | 0 | |
| `total_interest_earned` | NUMERIC(15,2) | YES | 0 | |
| `active_savings_goals` | INTEGER(32) | YES | 0 | |
| `completed_savings_goals` | INTEGER(32) | YES | 0 | |
| `total_deposits` | NUMERIC(15,2) | YES | 0 | |
| `total_withdrawals` | NUMERIC(15,2) | YES | 0 | |
| `adoption_rate` | NUMERIC(5,2) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_savings_analytics_date` (INDEX) ON `date`
- `savings_analytics_date_key` (UNIQUE) ON `date`
- `savings_analytics_pkey` (PRIMARY KEY) ON `id`

---

## Table: `savings_goals`

**Columns**: 16

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `savings_wallet_id` | UUID | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `target_amount` | NUMERIC(15,2) | NO | - | |
| `current_amount` | NUMERIC(15,2) | NO | 0 | |
| `target_date` | DATE | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'active'::character varying | |
| `completed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `auto_transfer_enabled` | BOOLEAN | YES | false | |
| `auto_transfer_amount` | NUMERIC(15,2) | YES | - | |
| `auto_transfer_frequency` | CHARACTER VARYING(50) | YES | - | |
| `round_up_enabled` | BOOLEAN | YES | false | |
| `round_up_multiple` | NUMERIC(10,2) | YES | 10 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_savings_goals_savings_wallet_id` (INDEX) ON `savings_wallet_id`
- `idx_savings_goals_status` (INDEX) ON `status`
- `idx_savings_goals_target_date` (INDEX) ON `target_date`
- `idx_savings_goals_user_id` (INDEX) ON `user_id`
- `savings_goals_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `savings_wallet_id` → `savings_wallets.id` (ON DELETE CASCADE)

---

## Table: `savings_interest_calculations`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `savings_wallet_id` | UUID | NO | - | |
| `calculation_date` | DATE | NO | - | |
| `balance_at_calculation` | NUMERIC(15,2) | NO | - | |
| `interest_rate` | NUMERIC(5,2) | NO | - | |
| `interest_earned` | NUMERIC(15,2) | NO | - | |
| `days_in_period` | INTEGER(32) | NO | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_savings_interest_calculations_calculation_date` (INDEX) ON `calculation_date`
- `idx_savings_interest_calculations_savings_wallet_id` (INDEX) ON `savings_wallet_id`
- `idx_savings_interest_calculations_unique` (UNIQUE) ON `savings_wallet_id`, `calculation_date`
- `savings_interest_calculations_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `savings_wallet_id` → `savings_wallets.id` (ON DELETE CASCADE)

---

## Table: `savings_transactions`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `savings_wallet_id` | UUID | NO | - | |
| `transaction_type` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `balance_after` | NUMERIC(15,2) | NO | - | |
| `goal_id` | UUID | YES | - | |
| `source_transaction_id` | UUID | YES | - | |
| `description` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_savings_transactions_created_at` (INDEX) ON `created_at`
- `idx_savings_transactions_goal_id` (INDEX) ON `goal_id`
- `idx_savings_transactions_savings_wallet_id` (INDEX) ON `savings_wallet_id`
- `idx_savings_transactions_source_transaction_id` (INDEX) ON `source_transaction_id`
- `idx_savings_transactions_transaction_type` (INDEX) ON `transaction_type`
- `savings_transactions_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `goal_id` → `savings_goals.id` (ON DELETE SET NULL)
- `savings_wallet_id` → `savings_wallets.id` (ON DELETE CASCADE)

---

## Table: `savings_wallets`

**Columns**: 15

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `wallet_id` | UUID | YES | - | |
| `name` | CHARACTER VARYING(255) | NO | 'Savings'::character varying | |
| `balance` | NUMERIC(15,2) | NO | 0 | |
| `available_balance` | NUMERIC(15,2) | NO | 0 | |
| `locked_balance` | NUMERIC(15,2) | NO | 0 | |
| `interest_rate` | NUMERIC(5,2) | NO | 2.5 | |
| `interest_earned` | NUMERIC(15,2) | NO | 0 | |
| `last_interest_calculation_date` | DATE | YES | - | |
| `lock_period_days` | INTEGER(32) | YES | - | |
| `lock_until_date` | DATE | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'active'::character varying | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_savings_wallets_lock_until_date` (INDEX) ON `lock_until_date`
- `idx_savings_wallets_status` (INDEX) ON `status`
- `idx_savings_wallets_user_id` (INDEX) ON `user_id`
- `idx_savings_wallets_user_unique` (UNIQUE) ON `user_id`
- `idx_savings_wallets_wallet_id` (INDEX) ON `wallet_id`
- `savings_wallets_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `wallet_id` → `wallets.id` (ON DELETE CASCADE)

---

## Table: `schema_migrations`

**Columns**: 4

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('schema_migrations_id_seq'::regclass) | |
| `version` | CHARACTER VARYING(255) | NO | - | |
| `name` | CHARACTER VARYING(255) | NO | - | |
| `applied_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_schema_migrations_version` (INDEX) ON `version`
- `schema_migrations_pkey` (PRIMARY KEY) ON `id`
- `schema_migrations_version_key` (UNIQUE) ON `version`

---

## Table: `security_incidents`

**Columns**: 41

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `incident_number` | CHARACTER VARYING(50) | NO | - | |
| `incident_type` | CHARACTER VARYING(50) | NO | - | |
| `severity` | CHARACTER VARYING(20) | NO | - | |
| `status` | CHARACTER VARYING(30) | NO | 'detected'::character varying | |
| `detected_at` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `detected_by` | CHARACTER VARYING(255) | YES | - | |
| `detection_method` | CHARACTER VARYING(100) | YES | - | |
| `contained_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `resolved_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `closed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `preliminary_notification_sent_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `preliminary_notification_deadline` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `impact_assessment_due_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `impact_assessment_submitted_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | NO | - | |
| `attack_vector` | TEXT | YES | - | |
| `affected_systems` | ARRAY | YES | - | |
| `root_cause` | TEXT | YES | - | |
| `financial_loss` | NUMERIC(15,2) | YES | 0.00 | |
| `financial_loss_currency` | CHARACTER VARYING(10) | YES | 'NAD'::character varying | |
| `customers_affected` | INTEGER(32) | YES | 0 | |
| `data_records_affected` | INTEGER(32) | YES | 0 | |
| `data_types_exposed` | ARRAY | YES | - | |
| `availability_impact_hours` | NUMERIC(10,2) | YES | 0 | |
| `immediate_actions_taken` | TEXT | YES | - | |
| `containment_measures` | TEXT | YES | - | |
| `remediation_steps` | TEXT | YES | - | |
| `reported_to_bon` | BOOLEAN | YES | false | |
| `bon_reference_number` | CHARACTER VARYING(100) | YES | - | |
| `reported_to_fic` | BOOLEAN | YES | false | |
| `fic_reference_number` | CHARACTER VARYING(100) | YES | - | |
| `lessons_learned` | TEXT | YES | - | |
| `preventive_measures` | TEXT | YES | - | |
| `follow_up_required` | BOOLEAN | YES | false | |
| `follow_up_actions` | TEXT | YES | - | |
| `created_by` | CHARACTER VARYING(255) | NO | - | |
| `updated_by` | CHARACTER VARYING(255) | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_incidents_detected_at` (INDEX) ON `detected_at`
- `idx_incidents_notification_deadline` (INDEX) ON `preliminary_notification_deadline`
- `idx_incidents_number` (INDEX) ON `incident_number`
- `idx_incidents_severity` (INDEX) ON `severity`
- `idx_incidents_status` (INDEX) ON `status`
- `idx_incidents_type` (INDEX) ON `incident_type`
- `security_incidents_incident_number_key` (UNIQUE) ON `incident_number`
- `security_incidents_pkey` (PRIMARY KEY) ON `id`

---

## Table: `service_level_metrics`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('service_level_metrics_id_seq'::regclass) | |
| `endpoint` | CHARACTER VARYING(255) | NO | - | |
| `participant_id` | CHARACTER VARYING(10) | YES | - | |
| `request_count` | INTEGER(32) | NO | 0 | |
| `success_count` | INTEGER(32) | NO | 0 | |
| `error_count` | INTEGER(32) | NO | 0 | |
| `total_response_time_ms` | BIGINT(64) | NO | 0 | |
| `min_response_time_ms` | INTEGER(32) | YES | - | |
| `max_response_time_ms` | INTEGER(32) | YES | - | |
| `period_start` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `period_end` | TIMESTAMP WITHOUT TIME ZONE | NO | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |

**Indexes**:

- `idx_slm_created` (INDEX) ON `created_at`
- `idx_slm_endpoint` (INDEX) ON `endpoint`
- `idx_slm_participant` (INDEX) ON `participant_id`
- `idx_slm_period` (INDEX) ON `period_start`, `period_end`
- `service_level_metrics_pkey` (PRIMARY KEY) ON `id`
- `unique_endpoint_participant_period` (UNIQUE) ON `endpoint`, `participant_id`, `period_start`

---

## Table: `sessions`

**Columns**: 6

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |

**Indexes**:

- `idx_sessions_expires` (INDEX) ON `expires_at`
- `idx_sessions_expires_at` (INDEX) ON `expires_at`
- `idx_sessions_user_id` (INDEX) ON `user_id`
- `sessions_pkey` (PRIMARY KEY) ON `id`

---

## Table: `settlement_batches`

**Columns**: 19

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `batch_number` | CHARACTER VARYING(50) | NO | - | |
| `batch_date` | DATE | NO | - | |
| `batch_type` | CHARACTER VARYING(20) | NO | 'daily'::character varying | |
| `status` | CHARACTER VARYING(20) | NO | 'pending'::character varying | |
| `started_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `completed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `total_transactions` | INTEGER(32) | YES | 0 | |
| `total_credit_amount` | NUMERIC(15,2) | YES | 0.00 | |
| `total_debit_amount` | NUMERIC(15,2) | YES | 0.00 | |
| `net_amount` | NUMERIC(15,2) | YES | 0.00 | |
| `currency` | CHARACTER VARYING(10) | YES | 'NAD'::character varying | |
| `successful_transactions` | INTEGER(32) | YES | 0 | |
| `failed_transactions` | INTEGER(32) | YES | 0 | |
| `error_message` | TEXT | YES | - | |
| `retry_count` | INTEGER(32) | YES | 0 | |
| `created_by` | CHARACTER VARYING(255) | YES | 'system'::character varying | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_settlement_batches_date` (INDEX) ON `batch_date`
- `idx_settlement_batches_status` (INDEX) ON `status`
- `settlement_batches_batch_number_key` (UNIQUE) ON `batch_number`
- `settlement_batches_pkey` (PRIMARY KEY) ON `id`

---

## Table: `signature_certificates`

**Columns**: 14

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | NO | - | |
| `certificate_id` | TEXT | NO | - | |
| `public_key` | TEXT | NO | - | |
| `algorithm` | TEXT | NO | 'RSA_SHA256'::text | |
| `key_size` | INTEGER(32) | NO | 2048 | |
| `issued_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `revoked` | BOOLEAN | YES | false | |
| `revoked_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `revocation_reason` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_signature_certificates_certificate_id` (INDEX) ON `certificate_id`
- `idx_signature_certificates_revoked` (INDEX) ON `expires_at`, `revoked`
- `idx_signature_certificates_user_id` (INDEX) ON `user_id`
- `signature_certificates_certificate_id_key` (UNIQUE) ON `certificate_id`
- `signature_certificates_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `spending_analyses`

**Columns**: 14

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `session_id` | UUID | YES | - | |
| `user_id` | UUID | YES | - | |
| `period_start` | DATE | NO | - | |
| `period_end` | DATE | NO | - | |
| `total_spending` | NUMERIC(15,2) | YES | - | |
| `spending_trend` | TEXT | YES | - | |
| `is_unusual_spending` | BOOLEAN | YES | - | |
| `top_categories` | JSONB | YES | '[]'::jsonb | |
| `spending_by_category` | JSONB | YES | '{}'::jsonb | |
| `insights` | JSONB | YES | '[]'::jsonb | |
| `recommendations` | JSONB | YES | '[]'::jsonb | |
| `analyzed_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_spending_analyses_session_id` (INDEX) ON `session_id`
- `idx_spending_analyses_user_id` (INDEX) ON `user_id`, `analyzed_at`
- `spending_analyses_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `session_id` → `sessions.id` (ON DELETE SET NULL)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `spending_personas`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | YES | - | |
| `primary_persona` | TEXT | NO | - | |
| `primary_confidence` | NUMERIC(5,4) | YES | - | |
| `persona_distribution` | JSONB | YES | '{}'::jsonb | |
| `cluster_id` | INTEGER(32) | YES | - | |
| `cluster_size` | INTEGER(32) | YES | - | |
| `assigned_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `model_version` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_spending_personas_primary` (INDEX) ON `primary_persona`
- `idx_spending_personas_user_id` (INDEX) ON `user_id`, `assigned_at`
- `spending_personas_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `split_bill_participants`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `split_bill_id` | UUID | NO | - | |
| `user_id` | UUID | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `paid_amount` | NUMERIC(15,2) | YES | 0.00 | |
| `status` | CHARACTER VARYING(50) | YES | 'pending'::character varying | |
| `paid_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_split_bill_participants_split_bill_id` (INDEX) ON `split_bill_id`
- `idx_split_bill_participants_status` (INDEX) ON `status`
- `idx_split_bill_participants_user_id` (INDEX) ON `user_id`
- `split_bill_participants_pkey` (PRIMARY KEY) ON `id`
- `split_bill_participants_split_bill_id_user_id_key` (UNIQUE) ON `split_bill_id`, `user_id`

**Foreign Keys**:

- `split_bill_id` → `split_bills.id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `split_bills`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `creator_id` | UUID | NO | - | |
| `total_amount` | NUMERIC(15,2) | NO | - | |
| `currency` | CHARACTER VARYING(10) | YES | 'NAD'::character varying | |
| `description` | TEXT | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'pending'::character varying | |
| `wallet_id` | UUID | YES | - | |
| `paid_amount` | NUMERIC(15,2) | YES | 0.00 | |
| `settled_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `title` | CHARACTER VARYING(255) | YES | - | |
| `due_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |

**Indexes**:

- `idx_split_bills_created_at` (INDEX) ON `created_at`
- `idx_split_bills_creator_id` (INDEX) ON `creator_id`
- `idx_split_bills_due_date` (INDEX) ON `due_date`
- `idx_split_bills_status` (INDEX) ON `status`
- `split_bills_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `creator_id` → `users.id` (ON DELETE CASCADE)
- `wallet_id` → `wallets.id` (ON DELETE SET NULL)

---

## Table: `staff_audit_logs`

**Columns**: 15

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `staff_id` | UUID | NO | - | |
| `action_type` | CHARACTER VARYING(100) | NO | - | |
| `target_entity_type` | CHARACTER VARYING(50) | NO | - | |
| `target_entity_id` | UUID | NO | - | |
| `location` | CHARACTER VARYING(255) | NO | - | |
| `action_details` | JSONB | YES | - | |
| `authorization_level` | CHARACTER VARYING(50) | YES | - | |
| `biometric_verification_required` | BOOLEAN | YES | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `ip_address` | INET | YES | - | |
| `success` | BOOLEAN | NO | - | |
| `error_message` | TEXT | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_staff_audit_logs_action_type` (INDEX) ON `action_type`
- `idx_staff_audit_logs_location` (INDEX) ON `location`
- `idx_staff_audit_logs_staff_id` (INDEX) ON `staff_id`
- `idx_staff_audit_logs_target_entity` (INDEX) ON `target_entity_type`, `target_entity_id`
- `idx_staff_audit_logs_timestamp` (INDEX) ON `timestamp`
- `staff_audit_logs_pkey` (PRIMARY KEY) ON `id`

---

## Table: `staff_audit_logs_archive`

**Columns**: 15

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `staff_id` | UUID | NO | - | |
| `action_type` | CHARACTER VARYING(100) | NO | - | |
| `target_entity_type` | CHARACTER VARYING(50) | NO | - | |
| `target_entity_id` | UUID | NO | - | |
| `location` | CHARACTER VARYING(255) | NO | - | |
| `action_details` | JSONB | YES | - | |
| `authorization_level` | CHARACTER VARYING(50) | YES | - | |
| `biometric_verification_required` | BOOLEAN | YES | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `ip_address` | INET | YES | - | |
| `success` | BOOLEAN | NO | - | |
| `error_message` | TEXT | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_staff_audit_logs_archive_staff_id` (INDEX) ON `staff_id`
- `idx_staff_audit_logs_archive_timestamp` (INDEX) ON `timestamp`
- `staff_audit_logs_archive_action_type_idx` (INDEX) ON `action_type`
- `staff_audit_logs_archive_location_idx` (INDEX) ON `location`
- `staff_audit_logs_archive_pkey` (PRIMARY KEY) ON `id`
- `staff_audit_logs_archive_staff_id_idx` (INDEX) ON `staff_id`
- `staff_audit_logs_archive_target_entity_type_target_entity_i_idx` (INDEX) ON `target_entity_type`, `target_entity_id`
- `staff_audit_logs_archive_timestamp_idx` (INDEX) ON `timestamp`

---

## Table: `streak_history`

**Columns**: 6

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `activity_date` | DATE | NO | - | |
| `streak_count` | INTEGER(32) | NO | - | |
| `points_earned` | INTEGER(32) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_streak_history_user_date` (INDEX) ON `user_id`, `activity_date`
- `streak_history_pkey` (PRIMARY KEY) ON `id`
- `unique_streak_day` (UNIQUE) ON `user_id`, `activity_date`

---

## Table: `streaks`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('streaks_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `streak_type` | CHARACTER VARYING(50) | NO | - | |
| `current_streak` | INTEGER(32) | NO | 0 | |
| `max_streak` | INTEGER(32) | NO | 0 | |
| `last_activity_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_streaks_current` (INDEX) ON `current_streak`
- `idx_streaks_max` (INDEX) ON `max_streak`
- `idx_streaks_type` (INDEX) ON `streak_type`
- `idx_streaks_user_id` (INDEX) ON `user_id`
- `streaks_pkey` (PRIMARY KEY) ON `id`
- `unique_user_streak` (UNIQUE) ON `user_id`, `streak_type`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `support_conversations`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `session_id` | CHARACTER VARYING(255) | NO | - | |
| `user_id` | UUID | NO | - | |
| `user_message` | TEXT | NO | - | |
| `assistant_response` | TEXT | NO | - | |
| `ticket_number` | CHARACTER VARYING(20) | YES | - | |
| `knowledge_base_used` | BOOLEAN | YES | false | |
| `escalated` | BOOLEAN | YES | false | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |

**Indexes**:

- `idx_support_conversations_session_id` (INDEX) ON `session_id`
- `support_conversations_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `support_tickets`

**Columns**: 20

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | UUID | NO | - | |
| `ticket_number` | CHARACTER VARYING(20) | NO | - | |
| `subject` | CHARACTER VARYING(200) | NO | - | |
| `description` | TEXT | NO | - | |
| `category` | CHARACTER VARYING(50) | NO | - | |
| `status` | CHARACTER VARYING(50) | NO | 'OPEN'::character varying | |
| `priority` | CHARACTER VARYING(50) | NO | 'MEDIUM'::character varying | |
| `assigned_to` | UUID | YES | - | |
| `assigned_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `resolved_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `resolution_notes` | TEXT | YES | - | |
| `closed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `related_transaction_id` | UUID | YES | - | |
| `related_voucher_id` | UUID | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `is_deleted` | BOOLEAN | NO | false | |
| `deleted_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |

**Indexes**:

- `idx_support_tickets_ticket_number` (INDEX) ON `ticket_number`
- `idx_support_tickets_user_id` (INDEX) ON `user_id`
- `support_tickets_pkey` (PRIMARY KEY) ON `id`
- `support_tickets_ticket_number_key` (UNIQUE) ON `ticket_number`

**Foreign Keys**:

- `assigned_to` → `users.id` (ON DELETE NO ACTION)
- `related_transaction_id` → `transactions.id` (ON DELETE NO ACTION)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `system_health`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `check_time` | TIMESTAMP WITHOUT TIME ZONE | NO | now() | |
| `check_type` | CHARACTER VARYING(50) | NO | - | |
| `status` | CHARACTER VARYING(20) | NO | - | |
| `response_time_ms` | INTEGER(32) | YES | - | |
| `details` | JSONB | YES | - | |
| `error_message` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_system_health_time` (INDEX) ON `check_time`
- `idx_system_health_type` (INDEX) ON `check_time`, `check_type`
- `system_health_pkey` (PRIMARY KEY) ON `id`

---

## Table: `tickets`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `event_name` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | YES | - | |
| `price` | NUMERIC(15,2) | NO | - | |
| `event_type` | CHARACTER VARYING(100) | YES | - | |
| `venue` | CHARACTER VARYING(255) | YES | - | |
| `event_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `quantity_available` | INTEGER(32) | YES | - | |
| `quantity_sold` | INTEGER(32) | YES | 0 | |
| `is_active` | BOOLEAN | YES | true | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_tickets_active` (INDEX) ON `is_active`
- `idx_tickets_event_date` (INDEX) ON `event_date`
- `idx_tickets_type` (INDEX) ON `event_type`
- `tickets_pkey` (PRIMARY KEY) ON `id`

---

## Table: `transaction_analytics`

**Columns**: 17

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `date` | DATE | NO | - | |
| `transaction_type` | CHARACTER VARYING(50) | NO | - | |
| `payment_method` | CHARACTER VARYING(50) | YES | - | |
| `merchant_category` | CHARACTER VARYING(100) | YES | - | |
| `total_transactions` | INTEGER(32) | NO | 0 | |
| `total_volume` | NUMERIC(15,2) | NO | 0 | |
| `average_transaction_amount` | NUMERIC(10,2) | YES | - | |
| `median_transaction_amount` | NUMERIC(10,2) | YES | - | |
| `min_transaction_amount` | NUMERIC(10,2) | YES | - | |
| `max_transaction_amount` | NUMERIC(10,2) | YES | - | |
| `unique_users` | INTEGER(32) | NO | 0 | |
| `unique_merchants` | INTEGER(32) | YES | - | |
| `hour_of_day` | INTEGER(32) | YES | - | |
| `day_of_week` | INTEGER(32) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_transaction_analytics_date` (INDEX) ON `date`
- `idx_transaction_analytics_date_type` (INDEX) ON `date`, `transaction_type`
- `idx_transaction_analytics_payment_method` (INDEX) ON `payment_method`
- `idx_transaction_analytics_type` (INDEX) ON `transaction_type`
- `transaction_analytics_date_transaction_type_payment_method__key` (UNIQUE) ON `date`, `transaction_type`, `payment_method`, `merchant_category`, `hour_of_day`
- `transaction_analytics_pkey` (PRIMARY KEY) ON `id`

---

## Table: `transaction_audit_logs`

**Columns**: 21

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `transaction_id` | UUID | NO | - | |
| `transaction_type` | CHARACTER VARYING(50) | NO | - | |
| `user_id` | UUID | NO | - | |
| `amount` | NUMERIC(10,2) | NO | - | |
| `currency` | CHARACTER VARYING(3) | YES | 'NAD'::character varying | |
| `from_wallet_id` | UUID | YES | - | |
| `to_wallet_id` | UUID | YES | - | |
| `recipient_id` | UUID | YES | - | |
| `payment_method` | CHARACTER VARYING(50) | YES | - | |
| `payment_reference` | CHARACTER VARYING(100) | YES | - | |
| `two_factor_verified` | BOOLEAN | NO | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `ip_address` | INET | YES | - | |
| `device_info` | JSONB | YES | - | |
| `status` | CHARACTER VARYING(50) | NO | - | |
| `error_message` | TEXT | YES | - | |
| `fraud_check_status` | CHARACTER VARYING(50) | YES | - | |
| `guardian_agent_result` | JSONB | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_transaction_audit_logs_payment_method` (INDEX) ON `payment_method`
- `idx_transaction_audit_logs_status` (INDEX) ON `status`
- `idx_transaction_audit_logs_timestamp` (INDEX) ON `timestamp`
- `idx_transaction_audit_logs_transaction_id` (INDEX) ON `transaction_id`
- `idx_transaction_audit_logs_user_id` (INDEX) ON `user_id`
- `transaction_audit_logs_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `from_wallet_id` → `wallets.id` (ON DELETE NO ACTION)
- `recipient_id` → `users.id` (ON DELETE NO ACTION)
- `to_wallet_id` → `wallets.id` (ON DELETE NO ACTION)
- `transaction_id` → `transactions.id` (ON DELETE NO ACTION)
- `user_id` → `users.id` (ON DELETE NO ACTION)

---

## Table: `transaction_audit_logs_archive`

**Columns**: 21

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `transaction_id` | UUID | NO | - | |
| `transaction_type` | CHARACTER VARYING(50) | NO | - | |
| `user_id` | UUID | NO | - | |
| `amount` | NUMERIC(10,2) | NO | - | |
| `currency` | CHARACTER VARYING(3) | YES | 'NAD'::character varying | |
| `from_wallet_id` | UUID | YES | - | |
| `to_wallet_id` | UUID | YES | - | |
| `recipient_id` | UUID | YES | - | |
| `payment_method` | CHARACTER VARYING(50) | YES | - | |
| `payment_reference` | CHARACTER VARYING(100) | YES | - | |
| `two_factor_verified` | BOOLEAN | NO | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `ip_address` | INET | YES | - | |
| `device_info` | JSONB | YES | - | |
| `status` | CHARACTER VARYING(50) | NO | - | |
| `error_message` | TEXT | YES | - | |
| `fraud_check_status` | CHARACTER VARYING(50) | YES | - | |
| `guardian_agent_result` | JSONB | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_transaction_audit_logs_archive_timestamp` (INDEX) ON `timestamp`
- `idx_transaction_audit_logs_archive_transaction_id` (INDEX) ON `transaction_id`
- `transaction_audit_logs_archive_payment_method_idx` (INDEX) ON `payment_method`
- `transaction_audit_logs_archive_pkey` (PRIMARY KEY) ON `id`
- `transaction_audit_logs_archive_status_idx` (INDEX) ON `status`
- `transaction_audit_logs_archive_timestamp_idx` (INDEX) ON `timestamp`
- `transaction_audit_logs_archive_transaction_id_idx` (INDEX) ON `transaction_id`
- `transaction_audit_logs_archive_user_id_idx` (INDEX) ON `user_id`

---

## Table: `transaction_categories`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `transaction_id` | UUID | YES | - | |
| `category` | TEXT | NO | - | |
| `subcategory` | TEXT | YES | - | |
| `confidence` | NUMERIC(5,4) | NO | - | |
| `alternate_categories` | JSONB | YES | '[]'::jsonb | |
| `classified_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `model_version` | TEXT | YES | - | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_transaction_categories_category` (INDEX) ON `category`
- `idx_transaction_categories_transaction_id` (INDEX) ON `transaction_id`
- `transaction_categories_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `transaction_id` → `transactions.id` (ON DELETE CASCADE)

---

## Table: `transactions`

**Columns**: 33

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `external_id` | TEXT | NO | - | |
| `user_id` | UUID | YES | - | |
| `merchant_id` | UUID | YES | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `currency` | TEXT | YES | 'NAD'::text | |
| `transaction_type` | TEXT | NO | - | |
| `status` | TEXT | NO | - | |
| `merchant_name` | TEXT | YES | - | |
| `merchant_category` | TEXT | YES | - | |
| `merchant_mcc` | TEXT | YES | - | |
| `location_latitude` | NUMERIC(10,8) | YES | - | |
| `location_longitude` | NUMERIC(11,8) | YES | - | |
| `device_fingerprint` | TEXT | YES | - | |
| `card_present` | BOOLEAN | YES | false | |
| `transaction_time` | TIMESTAMP WITH TIME ZONE | NO | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `processing_started_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `processing_completed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `settlement_batch_id` | UUID | YES | - | |
| `settlement_status` | CHARACTER VARYING(20) | YES | 'pending'::character varying | |
| `processing_latency_ms` | INTEGER(32) | YES | - | |
| `wallet_id` | UUID | YES | - | |
| `type` | CHARACTER VARYING(50) | YES | - | |
| `description` | TEXT | YES | - | |
| `category` | CHARACTER VARYING(100) | YES | - | |
| `recipient_id` | CHARACTER VARYING(255) | YES | - | |
| `recipient_name` | CHARACTER VARYING(255) | YES | - | |
| `date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `voucher_id` | UUID | YES | - | |
| `fineract_transaction_id` | BIGINT(64) | YES | - | |
| `ips_transaction_id` | CHARACTER VARYING(255) | YES | - | |

**Indexes**:

- `idx_transactions_amount` (INDEX) ON `amount`
- `idx_transactions_category` (INDEX) ON `category`
- `idx_transactions_category_date` (INDEX) ON `category`, `date`
- `idx_transactions_date` (INDEX) ON `date`
- `idx_transactions_fineract_id` (INDEX) ON `fineract_transaction_id`
- `idx_transactions_ips_id` (INDEX) ON `ips_transaction_id`
- `idx_transactions_merchant_category` (INDEX) ON `merchant_category`
- `idx_transactions_merchant_id` (INDEX) ON `merchant_id`
- `idx_transactions_settlement_batch` (INDEX) ON `settlement_batch_id`
- `idx_transactions_settlement_status` (INDEX) ON `settlement_status`
- `idx_transactions_status` (INDEX) ON `status`
- `idx_transactions_time` (INDEX) ON `transaction_time`
- `idx_transactions_transaction_time` (INDEX) ON `transaction_time`
- `idx_transactions_transaction_type` (INDEX) ON `transaction_type`
- `idx_transactions_user_id` (INDEX) ON `user_id`, `transaction_time`
- `idx_transactions_voucher_id` (INDEX) ON `voucher_id`
- `idx_transactions_wallet_id` (INDEX) ON `wallet_id`
- `transactions_external_id_key` (UNIQUE) ON `external_id`
- `transactions_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `merchant_id` → `merchants.id` (ON DELETE SET NULL)
- `user_id` → `users.id` (ON DELETE CASCADE)
- `voucher_id` → `vouchers.id` (ON DELETE SET NULL)
- `wallet_id` → `wallets.id` (ON DELETE SET NULL)

---

## Table: `trust_account`

**Columns**: 14

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `date` | DATE | NO | - | |
| `opening_balance` | NUMERIC(15,2) | NO | 0 | |
| `closing_balance` | NUMERIC(15,2) | NO | 0 | |
| `total_deposits` | NUMERIC(15,2) | NO | 0 | |
| `total_withdrawals` | NUMERIC(15,2) | NO | 0 | |
| `e_money_liabilities` | NUMERIC(15,2) | NO | 0 | |
| `reconciliation_status` | CHARACTER VARYING(50) | NO | 'pending'::character varying | |
| `discrepancy_amount` | NUMERIC(15,2) | YES | 0 | |
| `reconciled_by` | UUID | YES | - | |
| `reconciled_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `notes` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `trust_account_date_key` (UNIQUE) ON `date`
- `trust_account_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `reconciled_by` → `users.id` (ON DELETE NO ACTION)

---

## Table: `trust_account_reconciliation_log`

**Columns**: 10

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `reconciliation_date` | DATE | NO | - | |
| `trust_account_balance` | NUMERIC(15,2) | NO | - | |
| `e_money_liabilities` | NUMERIC(15,2) | NO | - | |
| `discrepancy_amount` | NUMERIC(15,2) | NO | 0 | |
| `status` | CHARACTER VARYING(50) | NO | - | |
| `error_message` | TEXT | YES | - | |
| `reconciled_by` | UUID | YES | - | |
| `reconciled_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `notes` | TEXT | YES | - | |

**Indexes**:

- `idx_reconciliation_log_date` (INDEX) ON `reconciliation_date`
- `idx_reconciliation_log_status` (INDEX) ON `status`
- `trust_account_reconciliation_log_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `reconciled_by` → `users.id` (ON DELETE NO ACTION)

---

## Table: `trust_account_transactions`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `trust_account_id` | UUID | NO | - | |
| `transaction_type` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `currency` | CHARACTER VARYING(3) | NO | 'NAD'::character varying | |
| `reference` | CHARACTER VARYING(255) | YES | - | |
| `description` | TEXT | YES | - | |
| `bank_statement_date` | DATE | YES | - | |
| `bank_statement_reference` | CHARACTER VARYING(255) | YES | - | |
| `created_by` | UUID | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_trust_account_transactions_account_id` (INDEX) ON `trust_account_id`
- `idx_trust_account_transactions_date` (INDEX) ON `created_at`
- `idx_trust_account_transactions_type` (INDEX) ON `transaction_type`
- `trust_account_transactions_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `created_by` → `users.id` (ON DELETE NO ACTION)
- `trust_account_id` → `trust_account.id` (ON DELETE CASCADE)

---

## Table: `user_achievements`

**Columns**: 5

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('user_achievements_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `achievement_id` | CHARACTER VARYING(100) | NO | - | |
| `earned_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `bp_earned` | INTEGER(32) | NO | - | |

**Indexes**:

- `idx_user_achievements_achievement_id` (INDEX) ON `achievement_id`
- `idx_user_achievements_earned_at` (INDEX) ON `earned_at`
- `idx_user_achievements_user_id` (INDEX) ON `user_id`
- `unique_user_achievement` (UNIQUE) ON `user_id`, `achievement_id`
- `user_achievements_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `achievement_id` → `achievements.achievement_id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `user_behavior_analytics`

**Columns**: 20

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | UUID | NO | - | |
| `date` | DATE | NO | - | |
| `wallet_balance` | NUMERIC(10,2) | YES | - | |
| `average_balance` | NUMERIC(10,2) | YES | - | |
| `transaction_count` | INTEGER(32) | NO | 0 | |
| `total_spent` | NUMERIC(10,2) | NO | 0 | |
| `total_received` | NUMERIC(10,2) | NO | 0 | |
| `preferred_payment_method` | CHARACTER VARYING(50) | YES | - | |
| `cash_out_count` | INTEGER(32) | YES | 0 | |
| `cash_out_amount` | NUMERIC(10,2) | YES | 0 | |
| `merchant_payment_count` | INTEGER(32) | YES | 0 | |
| `merchant_payment_amount` | NUMERIC(10,2) | YES | 0 | |
| `p2p_transfer_count` | INTEGER(32) | YES | 0 | |
| `p2p_transfer_amount` | NUMERIC(10,2) | YES | 0 | |
| `bill_payment_count` | INTEGER(32) | YES | 0 | |
| `bill_payment_amount` | NUMERIC(10,2) | YES | 0 | |
| `spending_velocity` | NUMERIC(10,2) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_user_behavior_analytics_date` (INDEX) ON `date`
- `idx_user_behavior_analytics_user_date` (INDEX) ON `user_id`, `date`
- `user_behavior_analytics_pkey` (PRIMARY KEY) ON `id`
- `user_behavior_analytics_user_id_date_key` (UNIQUE) ON `user_id`, `date`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `user_challenges`

**Columns**: 8

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('user_challenges_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `challenge_id` | CHARACTER VARYING(100) | NO | - | |
| `progress` | INTEGER(32) | NO | 0 | |
| `completed` | BOOLEAN | NO | false | |
| `bp_earned` | INTEGER(32) | NO | 0 | |
| `joined_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `completed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |

**Indexes**:

- `idx_user_challenges_challenge_id` (INDEX) ON `challenge_id`
- `idx_user_challenges_completed` (INDEX) ON `completed`
- `idx_user_challenges_progress` (INDEX) ON `progress`
- `idx_user_challenges_user_id` (INDEX) ON `user_id`
- `unique_user_challenge` (UNIQUE) ON `user_id`, `challenge_id`
- `user_challenges_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `challenge_id` → `challenges.challenge_id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `user_gamification`

**Columns**: 18

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `total_points` | INTEGER(32) | YES | 0 | |
| `available_points` | INTEGER(32) | YES | 0 | |
| `redeemed_points` | INTEGER(32) | YES | 0 | |
| `current_level` | INTEGER(32) | YES | 1 | |
| `current_xp` | INTEGER(32) | YES | 0 | |
| `total_xp` | INTEGER(32) | YES | 0 | |
| `current_streak` | INTEGER(32) | YES | 0 | |
| `longest_streak` | INTEGER(32) | YES | 0 | |
| `last_activity_date` | DATE | YES | - | |
| `points_multiplier` | NUMERIC(3,2) | YES | 1.00 | |
| `multiplier_expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `transactions_completed` | INTEGER(32) | YES | 0 | |
| `quests_completed` | INTEGER(32) | YES | 0 | |
| `achievements_unlocked` | INTEGER(32) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_user_gamification_level` (INDEX) ON `current_level`
- `idx_user_gamification_points` (INDEX) ON `available_points`
- `idx_user_gamification_user_id` (INDEX) ON `user_id`
- `unique_user_gamification` (UNIQUE) ON `user_id`
- `user_gamification_pkey` (PRIMARY KEY) ON `id`

---

## Table: `user_module_progress`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('user_module_progress_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `module_id` | CHARACTER VARYING(100) | NO | - | |
| `status` | CHARACTER VARYING(20) | NO | 'not_started'::character varying | |
| `sections_completed` | INTEGER(32) | NO | 0 | |
| `total_sections` | INTEGER(32) | NO | - | |
| `progress_percentage` | INTEGER(32) | NO | 0 | |
| `time_spent_minutes` | INTEGER(32) | NO | 0 | |
| `started_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `completed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `last_accessed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_user_module_progress_module_id` (INDEX) ON `module_id`
- `idx_user_module_progress_status` (INDEX) ON `status`
- `idx_user_module_progress_user_id` (INDEX) ON `user_id`
- `unique_user_module` (UNIQUE) ON `user_id`, `module_id`
- `user_module_progress_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `module_id` → `financial_literacy_modules.module_id` (ON DELETE CASCADE)
- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `user_power_ups`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `type` | CHARACTER VARYING(50) | NO | - | |
| `is_active` | BOOLEAN | YES | true | |
| `uses_remaining` | INTEGER(32) | YES | - | |
| `activated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `points_spent` | INTEGER(32) | NO | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_user_power_ups_active` (INDEX) ON `user_id`, `is_active`, `expires_at`
- `idx_user_power_ups_user_id` (INDEX) ON `user_id`
- `user_power_ups_pkey` (PRIMARY KEY) ON `id`

---

## Table: `user_profiles`

**Columns**: 21

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | YES | - | |
| `age_group` | TEXT | YES | - | |
| `income_level` | TEXT | YES | - | |
| `occupation_category` | TEXT | YES | - | |
| `family_size` | INTEGER(32) | YES | - | |
| `location_type` | TEXT | YES | - | |
| `app_usage_frequency` | NUMERIC(5,2) | YES | - | |
| `feature_usage_diversity` | NUMERIC(5,4) | YES | - | |
| `transaction_frequency` | NUMERIC(5,2) | YES | - | |
| `savings_rate` | NUMERIC(5,4) | YES | - | |
| `quiz_average_score` | NUMERIC(5,2) | YES | - | |
| `modules_completed` | INTEGER(32) | YES | - | |
| `time_spent_learning` | INTEGER(32) | YES | - | |
| `question_accuracy_rate` | NUMERIC(5,4) | YES | - | |
| `learning_consistency` | INTEGER(32) | YES | - | |
| `gamification_score` | INTEGER(32) | YES | - | |
| `badge_count` | INTEGER(32) | YES | - | |
| `challenge_completion_rate` | NUMERIC(5,4) | YES | - | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_user_profiles_user_id` (INDEX) ON `user_id`
- `user_profiles_pkey` (PRIMARY KEY) ON `id`
- `user_profiles_user_id_key` (UNIQUE) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `user_quests`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `quest_id` | CHARACTER VARYING(100) | NO | - | |
| `current_progress` | INTEGER(32) | YES | 0 | |
| `status` | CHARACTER VARYING(20) | YES | 'active'::character varying | |
| `started_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `completed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `claimed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `period_start` | DATE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_user_quests_period` (INDEX) ON `user_id`, `period_start`
- `idx_user_quests_status` (INDEX) ON `user_id`, `status`
- `idx_user_quests_user_id` (INDEX) ON `user_id`
- `user_quests_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `quest_id` → `quests.id` (ON DELETE NO ACTION)

---

## Table: `user_revenue_profiles`

**Columns**: 11

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('user_revenue_profiles_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `lifetime_value` | NUMERIC(15,2) | NO | 0.00 | |
| `transaction_fees_total` | NUMERIC(15,2) | NO | 0.00 | |
| `account_fees_total` | NUMERIC(15,2) | NO | 0.00 | |
| `loan_revenue_total` | NUMERIC(15,2) | NO | 0.00 | |
| `ai_tokens_total` | NUMERIC(15,2) | NO | 0.00 | |
| `subscription_total` | NUMERIC(15,2) | NO | 0.00 | |
| `last_revenue_date` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_user_revenue_lifetime_value` (INDEX) ON `lifetime_value`
- `idx_user_revenue_user_id` (INDEX) ON `user_id`
- `user_revenue_profiles_pkey` (PRIMARY KEY) ON `id`
- `user_revenue_profiles_user_id_key` (UNIQUE) ON `user_id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `user_rewards`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `reward_id` | CHARACTER VARYING(100) | NO | - | |
| `status` | CHARACTER VARYING(20) | YES | 'active'::character varying | |
| `points_spent` | INTEGER(32) | NO | - | |
| `value_type` | CHARACTER VARYING(50) | YES | - | |
| `value_amount` | NUMERIC(10,2) | YES | - | |
| `used_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `used_for` | TEXT | YES | - | |
| `claimed_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |
| `expires_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `redemption_code` | CHARACTER VARYING(50) | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | now() | |

**Indexes**:

- `idx_user_rewards_status` (INDEX) ON `user_id`, `status`
- `idx_user_rewards_user_id` (INDEX) ON `user_id`
- `user_rewards_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `reward_id` → `rewards.id` (ON DELETE NO ACTION)

---

## Table: `user_spending_features`

**Columns**: 15

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | YES | - | |
| `period_start` | DATE | NO | - | |
| `period_end` | DATE | NO | - | |
| `total_spending` | NUMERIC(15,2) | YES | - | |
| `avg_transaction_amount` | NUMERIC(15,2) | YES | - | |
| `transaction_count` | INTEGER(32) | YES | - | |
| `spending_volatility` | NUMERIC(15,2) | YES | - | |
| `spending_by_category` | JSONB | YES | '{}'::jsonb | |
| `weekend_spending_ratio` | NUMERIC(5,4) | YES | - | |
| `evening_spending_ratio` | NUMERIC(5,4) | YES | - | |
| `cash_withdrawal_frequency` | INTEGER(32) | YES | - | |
| `unique_merchants_count` | INTEGER(32) | YES | - | |
| `computed_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |

**Indexes**:

- `idx_user_spending_features_period` (INDEX) ON `period_start`, `period_end`
- `idx_user_spending_features_user_id` (INDEX) ON `user_id`, `period_end`
- `user_spending_features_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `users`

**Columns**: 33

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `external_id` | TEXT | NO | - | |
| `phone_number` | TEXT | YES | - | |
| `email` | TEXT | YES | - | |
| `full_name` | TEXT | YES | - | |
| `date_of_birth` | DATE | YES | - | |
| `kyc_level` | INTEGER(32) | YES | 0 | |
| `income_level` | TEXT | YES | - | |
| `occupation` | TEXT | YES | - | |
| `location_city` | TEXT | YES | - | |
| `location_country` | TEXT | YES | 'Namibia'::text | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `buffr_id` | CHARACTER VARYING(100) | YES | - | |
| `role` | CHARACTER VARYING(50) | YES | 'user'::character varying | |
| `is_admin` | BOOLEAN | YES | false | |
| `permissions` | JSONB | YES | '{}'::jsonb | |
| `mfa_enabled` | BOOLEAN | YES | false | |
| `mfa_secret` | CHARACTER VARYING(255) | YES | - | |
| `is_verified` | BOOLEAN | YES | false | |
| `is_two_factor_enabled` | BOOLEAN | YES | false | |
| `last_login_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `status` | CHARACTER VARYING(20) | YES | 'active'::character varying | |
| `first_name` | CHARACTER VARYING(255) | YES | - | |
| `last_name` | CHARACTER VARYING(255) | YES | - | |
| `currency` | CHARACTER VARYING(10) | YES | 'N$'::character varying | |
| `avatar` | TEXT | YES | - | |
| `national_id_encrypted` | TEXT | YES | - | |
| `national_id_iv` | TEXT | YES | - | |
| `national_id_tag` | TEXT | YES | - | |
| `national_id_hash` | TEXT | YES | - | |
| `national_id_salt` | TEXT | YES | - | |

**Indexes**:

- `idx_users_admin_roles` (INDEX) ON `role`
- `idx_users_buffr_id` (INDEX) ON `buffr_id`
- `idx_users_email` (INDEX) ON `email`
- `idx_users_external_id` (INDEX) ON `external_id`
- `idx_users_is_admin` (INDEX) ON `is_admin`
- `idx_users_kyc_level` (INDEX) ON `kyc_level`
- `idx_users_mfa_enabled` (INDEX) ON `mfa_enabled`
- `idx_users_national_id_hash` (INDEX) ON `national_id_hash`
- `idx_users_phone_number` (INDEX) ON `phone_number`
- `idx_users_role` (INDEX) ON `role`
- `idx_users_status` (INDEX) ON `status`
- `users_buffr_id_key` (UNIQUE) ON `buffr_id`
- `users_external_id_key` (UNIQUE) ON `external_id`
- `users_pkey` (PRIMARY KEY) ON `id`

---

## Table: `voucher_audit_logs`

**Columns**: 16

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `voucher_id` | UUID | NO | - | |
| `operation_type` | CHARACTER VARYING(50) | NO | - | |
| `user_id` | UUID | YES | - | |
| `staff_id` | UUID | YES | - | |
| `location` | CHARACTER VARYING(255) | YES | - | |
| `smartpay_beneficiary_id` | CHARACTER VARYING(100) | NO | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `old_status` | CHARACTER VARYING(50) | YES | - | |
| `new_status` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(10,2) | YES | - | |
| `redemption_method` | CHARACTER VARYING(50) | YES | - | |
| `settlement_reference` | CHARACTER VARYING(100) | YES | - | |
| `metadata` | JSONB | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_voucher_audit_logs_operation_type` (INDEX) ON `operation_type`
- `idx_voucher_audit_logs_smartpay_beneficiary_id` (INDEX) ON `smartpay_beneficiary_id`
- `idx_voucher_audit_logs_staff_id` (INDEX) ON `staff_id`
- `idx_voucher_audit_logs_timestamp` (INDEX) ON `timestamp`
- `idx_voucher_audit_logs_user_id` (INDEX) ON `user_id`
- `idx_voucher_audit_logs_voucher_id` (INDEX) ON `voucher_id`
- `voucher_audit_logs_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE NO ACTION)
- `voucher_id` → `vouchers.id` (ON DELETE NO ACTION)

---

## Table: `voucher_audit_logs_archive`

**Columns**: 16

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `voucher_id` | UUID | NO | - | |
| `operation_type` | CHARACTER VARYING(50) | NO | - | |
| `user_id` | UUID | YES | - | |
| `staff_id` | UUID | YES | - | |
| `location` | CHARACTER VARYING(255) | YES | - | |
| `smartpay_beneficiary_id` | CHARACTER VARYING(100) | NO | - | |
| `biometric_verification_id` | CHARACTER VARYING(100) | YES | - | |
| `old_status` | CHARACTER VARYING(50) | YES | - | |
| `new_status` | CHARACTER VARYING(50) | NO | - | |
| `amount` | NUMERIC(10,2) | YES | - | |
| `redemption_method` | CHARACTER VARYING(50) | YES | - | |
| `settlement_reference` | CHARACTER VARYING(100) | YES | - | |
| `metadata` | JSONB | YES | - | |
| `timestamp` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_voucher_audit_logs_archive_timestamp` (INDEX) ON `timestamp`
- `idx_voucher_audit_logs_archive_voucher_id` (INDEX) ON `voucher_id`
- `voucher_audit_logs_archive_operation_type_idx` (INDEX) ON `operation_type`
- `voucher_audit_logs_archive_pkey` (PRIMARY KEY) ON `id`
- `voucher_audit_logs_archive_smartpay_beneficiary_id_idx` (INDEX) ON `smartpay_beneficiary_id`
- `voucher_audit_logs_archive_staff_id_idx` (INDEX) ON `staff_id`
- `voucher_audit_logs_archive_timestamp_idx` (INDEX) ON `timestamp`
- `voucher_audit_logs_archive_user_id_idx` (INDEX) ON `user_id`
- `voucher_audit_logs_archive_voucher_id_idx` (INDEX) ON `voucher_id`

---

## Table: `voucher_expiry_analytics`

**Columns**: 13

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `date` | DATE | NO | - | |
| `total_vouchers_expiring` | INTEGER(32) | YES | 0 | |
| `warnings_sent_7_days` | INTEGER(32) | YES | 0 | |
| `warnings_sent_3_days` | INTEGER(32) | YES | 0 | |
| `warnings_sent_1_day` | INTEGER(32) | YES | 0 | |
| `warnings_sent_expiry_day` | INTEGER(32) | YES | 0 | |
| `vouchers_redeemed_after_warning` | INTEGER(32) | YES | 0 | |
| `vouchers_expired` | INTEGER(32) | YES | 0 | |
| `expired_voucher_rate` | NUMERIC(5,2) | YES | 0 | |
| `redemption_rate_after_warning` | NUMERIC(5,2) | YES | 0 | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_voucher_expiry_analytics_date` (INDEX) ON `date`
- `voucher_expiry_analytics_date_key` (UNIQUE) ON `date`
- `voucher_expiry_analytics_pkey` (PRIMARY KEY) ON `id`

---

## Table: `voucher_expiry_warnings`

**Columns**: 12

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `voucher_id` | UUID | NO | - | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `warning_type` | CHARACTER VARYING(50) | NO | - | |
| `days_until_expiry` | INTEGER(32) | NO | - | |
| `sent_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |
| `channel` | CHARACTER VARYING(50) | NO | - | |
| `status` | CHARACTER VARYING(50) | YES | 'sent'::character varying | |
| `error_message` | TEXT | YES | - | |
| `redeemed_after_warning` | BOOLEAN | YES | false | |
| `redeemed_at` | TIMESTAMP WITH TIME ZONE | YES | - | |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | now() | |

**Indexes**:

- `idx_voucher_expiry_warnings_sent_at` (INDEX) ON `sent_at`
- `idx_voucher_expiry_warnings_status` (INDEX) ON `status`
- `idx_voucher_expiry_warnings_unique` (UNIQUE) ON `voucher_id`, `warning_type`
- `idx_voucher_expiry_warnings_user_id` (INDEX) ON `user_id`
- `idx_voucher_expiry_warnings_voucher_id` (INDEX) ON `voucher_id`
- `idx_voucher_expiry_warnings_warning_type` (INDEX) ON `warning_type`
- `voucher_expiry_warnings_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `voucher_id` → `vouchers.id` (ON DELETE CASCADE)

---

## Table: `voucher_redemptions`

**Columns**: 19

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `voucher_id` | UUID | YES | - | |
| `user_id` | CHARACTER VARYING(255) | YES | - | |
| `redemption_method` | CHARACTER VARYING(50) | NO | - | |
| `redemption_point` | CHARACTER VARYING(255) | YES | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `nampay_reference` | CHARACTER VARYING(255) | YES | - | |
| `verification_method` | CHARACTER VARYING(50) | YES | - | |
| `verified_by` | CHARACTER VARYING(255) | YES | - | |
| `bank_account_number` | CHARACTER VARYING(50) | YES | - | |
| `bank_name` | CHARACTER VARYING(100) | YES | - | |
| `status` | CHARACTER VARYING(50) | YES | 'pending'::character varying | |
| `error_message` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `completed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `settled_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `bank_account_number_encrypted` | TEXT | YES | - | |
| `bank_account_number_iv` | TEXT | YES | - | |
| `bank_account_number_tag` | TEXT | YES | - | |

**Indexes**:

- `idx_voucher_redemptions_nampay_ref` (INDEX) ON `nampay_reference`
- `idx_voucher_redemptions_status` (INDEX) ON `status`
- `idx_voucher_redemptions_user_id` (INDEX) ON `user_id`
- `idx_voucher_redemptions_voucher_id` (INDEX) ON `voucher_id`
- `voucher_redemptions_pkey` (PRIMARY KEY) ON `id`

---

## Table: `vouchers`

**Columns**: 38

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | gen_random_uuid() | |
| `user_id` | CHARACTER VARYING(255) | YES | - | |
| `type` | CHARACTER VARYING(50) | NO | - | |
| `title` | CHARACTER VARYING(255) | NO | - | |
| `description` | TEXT | YES | - | |
| `amount` | NUMERIC(15,2) | NO | - | |
| `status` | CHARACTER VARYING(50) | YES | 'available'::character varying | |
| `expiry_date` | DATE | YES | - | |
| `redeemed_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `redemption_method` | CHARACTER VARYING(50) | YES | - | |
| `issuer` | CHARACTER VARYING(255) | YES | - | |
| `icon` | CHARACTER VARYING(50) | YES | - | |
| `voucher_code` | CHARACTER VARYING(100) | YES | - | |
| `batch_id` | CHARACTER VARYING(100) | YES | - | |
| `grant_type` | CHARACTER VARYING(100) | YES | - | |
| `nampay_reference` | CHARACTER VARYING(255) | YES | - | |
| `nampay_settled` | BOOLEAN | YES | false | |
| `nampay_settled_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `verification_required` | BOOLEAN | YES | false | |
| `verification_method` | CHARACTER VARYING(50) | YES | - | |
| `verified_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `verified_by` | CHARACTER VARYING(255) | YES | - | |
| `redemption_point` | CHARACTER VARYING(255) | YES | - | |
| `bank_account_number` | CHARACTER VARYING(50) | YES | - | |
| `bank_name` | CHARACTER VARYING(100) | YES | - | |
| `credit_advanced` | BOOLEAN | YES | false | |
| `credit_settled` | BOOLEAN | YES | false | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `updated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `bank_account_number_encrypted` | TEXT | YES | - | |
| `bank_account_number_iv` | TEXT | YES | - | |
| `bank_account_number_tag` | TEXT | YES | - | |
| `beneficiary_id` | CHARACTER VARYING(255) | YES | - | |
| `currency` | CHARACTER VARYING(10) | YES | 'NAD'::character varying | |
| `issued_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `smartpay_voucher_id` | CHARACTER VARYING(255) | YES | - | |
| `external_id` | CHARACTER VARYING(255) | YES | - | |

**Indexes**:

- `idx_vouchers_batch_id` (INDEX) ON `batch_id`
- `idx_vouchers_beneficiary_id` (INDEX) ON `beneficiary_id`
- `idx_vouchers_currency` (INDEX) ON `currency`
- `idx_vouchers_expiry` (INDEX) ON `expiry_date`
- `idx_vouchers_external_id` (INDEX) ON `external_id`
- `idx_vouchers_nampay_settled` (INDEX) ON `nampay_settled`
- `idx_vouchers_redemption_method` (INDEX) ON `redemption_method`
- `idx_vouchers_smartpay_voucher_id` (INDEX) ON `smartpay_voucher_id`
- `idx_vouchers_status` (INDEX) ON `status`
- `idx_vouchers_type` (INDEX) ON `type`
- `idx_vouchers_user_id` (INDEX) ON `user_id`
- `idx_vouchers_voucher_code` (INDEX) ON `voucher_code`
- `vouchers_pkey` (PRIMARY KEY) ON `id`
- `vouchers_voucher_code_key` (UNIQUE) ON `voucher_code`

---

## Table: `wallet_dormancy_events`

**Columns**: 9

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `wallet_id` | UUID | YES | - | |
| `user_id` | CHARACTER VARYING(255) | NO | - | |
| `event_type` | CHARACTER VARYING(50) | NO | - | |
| `previous_status` | CHARACTER VARYING(20) | YES | - | |
| `new_status` | CHARACTER VARYING(20) | YES | - | |
| `balance_at_event` | NUMERIC(15,2) | YES | - | |
| `notes` | TEXT | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |

**Indexes**:

- `idx_dormancy_events_created_at` (INDEX) ON `created_at`
- `idx_dormancy_events_type` (INDEX) ON `event_type`
- `idx_dormancy_events_user_id` (INDEX) ON `user_id`
- `idx_dormancy_events_wallet_id` (INDEX) ON `wallet_id`
- `wallet_dormancy_events_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `wallet_id` → `wallets.id` (ON DELETE CASCADE)

---

## Table: `wallet_dormancy_reports`

**Columns**: 15

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `report_month` | DATE | NO | - | |
| `report_type` | CHARACTER VARYING(20) | NO | - | |
| `total_wallets` | INTEGER(32) | YES | - | |
| `active_wallets` | INTEGER(32) | YES | - | |
| `warning_wallets` | INTEGER(32) | YES | - | |
| `dormant_wallets` | INTEGER(32) | YES | - | |
| `closed_wallets` | INTEGER(32) | YES | - | |
| `total_dormant_balance` | NUMERIC(15,2) | YES | - | |
| `funds_released_this_period` | NUMERIC(15,2) | YES | - | |
| `new_dormant_wallets` | INTEGER(32) | YES | - | |
| `reactivated_wallets` | INTEGER(32) | YES | - | |
| `generated_at` | TIMESTAMP WITHOUT TIME ZONE | YES | now() | |
| `generated_by` | CHARACTER VARYING(255) | YES | - | |
| `report_data` | JSONB | YES | - | |

**Indexes**:

- `idx_dormancy_reports_month` (INDEX) ON `report_month`
- `idx_dormancy_reports_type` (INDEX) ON `report_type`
- `wallet_dormancy_reports_pkey` (PRIMARY KEY) ON `id`
- `wallet_dormancy_reports_report_month_report_type_key` (UNIQUE) ON `report_month`, `report_type`

---

## Table: `wallets`

**Columns**: 29

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | UUID | NO | uuid_generate_v4() | |
| `user_id` | UUID | NO | - | |
| `name` | TEXT | NO | - | |
| `type` | TEXT | NO | - | |
| `currency` | TEXT | NO | 'NAD'::text | |
| `balance` | NUMERIC(15,2) | NO | 0.00 | |
| `available_balance` | NUMERIC(15,2) | NO | 0.00 | |
| `status` | TEXT | NO | 'active'::text | |
| `is_default` | BOOLEAN | YES | false | |
| `created_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `updated_at` | TIMESTAMP WITH TIME ZONE | YES | CURRENT_TIMESTAMP | |
| `metadata` | JSONB | YES | '{}'::jsonb | |
| `last_transaction_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `dormancy_status` | CHARACTER VARYING(20) | YES | 'active'::character varying | |
| `dormancy_warning_sent_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `dormancy_started_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `dormancy_scheduled_release_at` | TIMESTAMP WITHOUT TIME ZONE | YES | - | |
| `dormancy_notes` | TEXT | YES | - | |
| `icon` | CHARACTER VARYING(50) | YES | - | |
| `purpose` | TEXT | YES | - | |
| `card_design` | INTEGER(32) | YES | 2 | |
| `card_number` | CHARACTER VARYING(4) | YES | - | |
| `cardholder_name` | CHARACTER VARYING(255) | YES | - | |
| `expiry_date` | CHARACTER VARYING(5) | YES | - | |
| `auto_pay_enabled` | BOOLEAN | YES | false | |
| `auto_pay_max_amount` | NUMERIC(15,2) | YES | - | |
| `auto_pay_settings` | JSONB | YES | '{}'::jsonb | |
| `pin_protected` | BOOLEAN | YES | false | |
| `biometric_enabled` | BOOLEAN | YES | false | |

**Indexes**:

- `idx_wallets_auto_pay_enabled` (INDEX) ON `auto_pay_enabled`
- `idx_wallets_card_number` (INDEX) ON `card_number`
- `idx_wallets_dormancy_warning` (INDEX) ON `last_transaction_at`
- `idx_wallets_dormant` (INDEX) ON `last_transaction_at`, `dormancy_status`
- `idx_wallets_is_default` (INDEX) ON `user_id`, `is_default`
- `idx_wallets_status` (INDEX) ON `status`
- `idx_wallets_user_default` (UNIQUE) ON `user_id`
- `idx_wallets_user_id` (INDEX) ON `user_id`
- `idx_wallets_user_type` (INDEX) ON `user_id`, `type`
- `idx_wallets_with_balance` (INDEX) ON `balance`
- `wallets_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---

## Table: `xp_transactions`

**Columns**: 7

| Column Name | Data Type | Nullable | Default | Description |
|-------------|-----------|----------|---------|-------------|
| `id` | INTEGER(32) | NO | nextval('xp_transactions_id_seq'::regclass) | |
| `user_id` | UUID | NO | - | |
| `bp_amount` | INTEGER(32) | NO | - | |
| `source` | CHARACTER VARYING(50) | NO | - | |
| `description` | TEXT | NO | - | |
| `metadata` | JSONB | YES | - | |
| `created_at` | TIMESTAMP WITHOUT TIME ZONE | NO | CURRENT_TIMESTAMP | |

**Indexes**:

- `idx_xp_transactions_created_at` (INDEX) ON `created_at`
- `idx_xp_transactions_source` (INDEX) ON `source`
- `idx_xp_transactions_user_id` (INDEX) ON `user_id`
- `xp_transactions_pkey` (PRIMARY KEY) ON `id`

**Foreign Keys**:

- `user_id` → `users.id` (ON DELETE CASCADE)

---


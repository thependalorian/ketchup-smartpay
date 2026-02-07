# 📊 KETCHUP SMARTPAY - COMPLETE DATABASE STRUCTURE

**Generated:** 2026-01-28T21:21:01.489Z

---

## 📋 Overview

**Total Tables:** 216

**Database:** Neon PostgreSQL (Serverless)

**Connection:** `ep-rough-frog-ad0dg5fe-pooler.c-2.us-east-1.aws.neon.tech/neondb`

---

## 📑 Table of Contents

- [account_fees](#account-fees)
- [achievement_progress](#achievement-progress)
- [achievements](#achievements)
- [active_tokens](#active-tokens)
- [agent_annual_returns](#agent-annual-returns)
- [agent_clusters](#agent-clusters)
- [agent_onboarding](#agent-onboarding)
- [agents](#agents)
- [ai_chunks](#ai-chunks)
- [ai_documents](#ai-documents)
- [ai_messages](#ai-messages)
- [ai_sessions](#ai-sessions)
- [ai_token_balances](#ai-token-balances)
- [ai_token_purchases](#ai-token-purchases)
- [api_sync_audit_logs](#api-sync-audit-logs)
- [api_sync_audit_logs_archive](#api-sync-audit-logs-archive)
- [audit_log](#audit-log)
- [audit_logs](#audit-logs)
- [audit_logs_archive](#audit-logs-archive)
- [automated_request_tracking](#automated-request-tracking)
- [autopay_rules](#autopay-rules)
- [autopay_transactions](#autopay-transactions)
- [backup_recovery_logs](#backup-recovery-logs)
- [badge_collections](#badge-collections)
- [beneficiaries](#beneficiaries)
- [beneficiary_clusters](#beneficiary-clusters)
- [beneficiary_feedback](#beneficiary-feedback)
- [bon_monthly_reports](#bon-monthly-reports)
- [bottleneck_metrics](#bottleneck-metrics)
- [buffr_points_profiles](#buffr-points-profiles)
- [capital_requirements_tracking](#capital-requirements-tracking)
- [cards](#cards)
- [challenges](#challenges)
- [channel_analytics](#channel-analytics)
- [chunks](#chunks)
- [compliance_audit_trail](#compliance-audit-trail)
- [compliance_checks](#compliance-checks)
- [compliance_dashboard_metrics](#compliance-dashboard-metrics)
- [concentration_alerts](#concentration-alerts)
- [contacts](#contacts)
- [conversations](#conversations)
- [coverage_gaps](#coverage-gaps)
- [credit_assessments](#credit-assessments)
- [cybersecurity_events](#cybersecurity-events)
- [cybersecurity_incidents](#cybersecurity-incidents)
- [demand_hotspots](#demand-hotspots)
- [dispute_evidence](#dispute-evidence)
- [disputes](#disputes)
- [document_summaries](#document-summaries)
- [documents](#documents)
- [dormant_wallets](#dormant-wallets)
- [electronic_signatures](#electronic-signatures)
- [ewallet_balances](#ewallet-balances)
- [ewallet_transactions](#ewallet-transactions)
- [exchange_rate_fetch_log](#exchange-rate-fetch-log)
- [exchange_rates](#exchange-rates)
- [feature_interest_surveys](#feature-interest-surveys)
- [feedback_analytics](#feedback-analytics)
- [financial_literacy_modules](#financial-literacy-modules)
- [fineract_accounts](#fineract-accounts)
- [fineract_sync_logs](#fineract-sync-logs)
- [fineract_vouchers](#fineract-vouchers)
- [fraud_checks](#fraud-checks)
- [fraud_detection_summary](#fraud-detection-summary)
- [gamification_stats](#gamification-stats)
- [geographic_analytics](#geographic-analytics)
- [group_members](#group-members)
- [groups](#groups)
- [incident_metrics](#incident-metrics)
- [incident_notifications](#incident-notifications)
- [incident_updates](#incident-updates)
- [insurance_products](#insurance-products)
- [leaderboard_entries](#leaderboard-entries)
- [leaderboard_incentives](#leaderboard-incentives)
- [leaderboard_rankings](#leaderboard-rankings)
- [leaderboards](#leaderboards)
- [learning_paths](#learning-paths)
- [learning_progress](#learning-progress)
- [learning_recommendations](#learning-recommendations)
- [level_up_events](#level-up-events)
- [levels](#levels)
- [liquidity_recommendations](#liquidity-recommendations)
- [literacy_certificates](#literacy-certificates)
- [loan_applications](#loan-applications)
- [loan_revenue](#loan-revenue)
- [merchant_analytics](#merchant-analytics)
- [merchant_loan_summary](#merchant-loan-summary)
- [merchant_onboarding](#merchant-onboarding)
- [merchants](#merchants)
- [messages](#messages)
- [migration_history](#migration-history)
- [migrations](#migrations)
- [ml_models](#ml-models)
- [model_performance](#model-performance)
- [model_performance_dashboard](#model-performance-dashboard)
- [module_quizzes](#module-quizzes)
- [money_requests](#money-requests)
- [nampost_branch_load](#nampost-branch-load)
- [nampost_branches](#nampost-branches)
- [nampost_staff](#nampost-staff)
- [namqr_codes](#namqr-codes)
- [namqr_transactions](#namqr-transactions)
- [namqr_validations](#namqr-validations)
- [notification_logs](#notification-logs)
- [notification_preferences](#notification-preferences)
- [notifications](#notifications)
- [oauth_access_tokens](#oauth-access-tokens)
- [oauth_authorization_codes](#oauth-authorization-codes)
- [oauth_authorization_requests](#oauth-authorization-requests)
- [oauth_consents](#oauth-consents)
- [oauth_par_requests](#oauth-par-requests)
- [oauth_refresh_tokens](#oauth-refresh-tokens)
- [onboarding_documents](#onboarding-documents)
- [open_banking_accounts](#open-banking-accounts)
- [open_banking_api_logs](#open-banking-api-logs)
- [open_banking_balances](#open-banking-balances)
- [open_banking_beneficiaries](#open-banking-beneficiaries)
- [open_banking_consent_audit](#open-banking-consent-audit)
- [open_banking_participants](#open-banking-participants)
- [open_banking_payments](#open-banking-payments)
- [open_banking_transactions](#open-banking-transactions)
- [otp_codes](#otp-codes)
- [participants](#participants)
- [payment_method_analytics](#payment-method-analytics)
- [payments](#payments)
- [periodic_surveys](#periodic-surveys)
- [pin_audit_logs](#pin-audit-logs)
- [pin_audit_logs_archive](#pin-audit-logs-archive)
- [points_transactions](#points-transactions)
- [predictions](#predictions)
- [premium_subscriptions](#premium-subscriptions)
- [processing_metrics](#processing-metrics)
- [psp_compliance_status](#psp-compliance-status)
- [psp_registry](#psp-registry)
- [push_tokens](#push-tokens)
- [quests](#quests)
- [quiz_attempts](#quiz-attempts)
- [quiz_questions](#quiz-questions)
- [rank_up_events](#rank-up-events)
- [recent_cybersecurity_events](#recent-cybersecurity-events)
- [recommendation_effectiveness](#recommendation-effectiveness)
- [recommendations](#recommendations)
- [reconciliation_records](#reconciliation-records)
- [revenue_reports](#revenue-reports)
- [revenue_transactions](#revenue-transactions)
- [rewards](#rewards)
- [savings_analytics](#savings-analytics)
- [savings_goals](#savings-goals)
- [savings_interest_calculations](#savings-interest-calculations)
- [savings_transactions](#savings-transactions)
- [savings_wallets](#savings-wallets)
- [schema_migrations](#schema-migrations)
- [security_incidents](#security-incidents)
- [service_level_metrics](#service-level-metrics)
- [sessions](#sessions)
- [settlement_batches](#settlement-batches)
- [signature_certificates](#signature-certificates)
- [spending_analyses](#spending-analyses)
- [spending_personas](#spending-personas)
- [split_bill_participants](#split-bill-participants)
- [split_bills](#split-bills)
- [staff_audit_logs](#staff-audit-logs)
- [staff_audit_logs_archive](#staff-audit-logs-archive)
- [status_events](#status-events)
- [streak_history](#streak-history)
- [streaks](#streaks)
- [support_conversations](#support-conversations)
- [support_tickets](#support-tickets)
- [system_availability_summary](#system-availability-summary)
- [system_health](#system-health)
- [system_uptime_logs](#system-uptime-logs)
- [tickets](#tickets)
- [token_vault](#token-vault)
- [transaction_analytics](#transaction-analytics)
- [transaction_audit_logs](#transaction-audit-logs)
- [transaction_audit_logs_archive](#transaction-audit-logs-archive)
- [transaction_categories](#transaction-categories)
- [transaction_limit_usage](#transaction-limit-usage)
- [transaction_limits](#transaction-limits)
- [transactions](#transactions)
- [trust_account](#trust-account)
- [trust_account_reconciliation](#trust-account-reconciliation)
- [trust_account_reconciliation_log](#trust-account-reconciliation-log)
- [trust_account_transactions](#trust-account-transactions)
- [two_factor_auth_logs](#two-factor-auth-logs)
- [user_achievements](#user-achievements)
- [user_behavior_analytics](#user-behavior-analytics)
- [user_challenges](#user-challenges)
- [user_gamification](#user-gamification)
- [user_module_progress](#user-module-progress)
- [user_power_ups](#user-power-ups)
- [user_profiles](#user-profiles)
- [user_quests](#user-quests)
- [user_revenue_profiles](#user-revenue-profiles)
- [user_rewards](#user-rewards)
- [user_spending_features](#user-spending-features)
- [user_transaction_summary](#user-transaction-summary)
- [users](#users)
- [v_audit_log_summary](#v-audit-log-summary)
- [v_daily_processing_summary](#v-daily-processing-summary)
- [v_dormant_wallet_summary](#v-dormant-wallet-summary)
- [v_incident_summary](#v-incident-summary)
- [v_pending_incident_notifications](#v-pending-incident-notifications)
- [v_pending_settlement](#v-pending-settlement)
- [v_uptime_dashboard](#v-uptime-dashboard)
- [voucher_audit_logs](#voucher-audit-logs)
- [voucher_audit_logs_archive](#voucher-audit-logs-archive)
- [voucher_expiry_analytics](#voucher-expiry-analytics)
- [voucher_expiry_warnings](#voucher-expiry-warnings)
- [voucher_redemptions](#voucher-redemptions)
- [vouchers](#vouchers)
- [wallet_dormancy_events](#wallet-dormancy-events)
- [wallet_dormancy_reports](#wallet-dormancy-reports)
- [wallets](#wallets)
- [webhook_events](#webhook-events)
- [xp_transactions](#xp-transactions)

---

## account_fees

**Description:** One-time account fees (creation NAD 50, activation NAD 100)

**Columns:** 8  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('account_fees_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `fee_type` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `description` | text | ✅ | - |
| `paid` | boolean | ❌ | false |
| `paid_at` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **account_fees_pkey**
  ```sql
  CREATE UNIQUE INDEX account_fees_pkey ON public.account_fees USING btree (id)
  ```

- **idx_account_fees_fee_type**
  ```sql
  CREATE INDEX idx_account_fees_fee_type ON public.account_fees USING btree (fee_type)
  ```

- **idx_account_fees_paid**
  ```sql
  CREATE INDEX idx_account_fees_paid ON public.account_fees USING btree (paid)
  ```

- **idx_account_fees_user_id**
  ```sql
  CREATE INDEX idx_account_fees_user_id ON public.account_fees USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## achievement_progress

**Description:** Tracks partial progress towards multi-step achievements

**Columns:** 6  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('achievement_progress_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `achievement_id` | character varying(100) | ❌ | - |
| `progress_data` | jsonb | ❌ | '{}'::jsonb |
| `progress_percentage` | integer | ❌ | 0 |
| `last_updated` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **achievement_progress_pkey**
  ```sql
  CREATE UNIQUE INDEX achievement_progress_pkey ON public.achievement_progress USING btree (id)
  ```

- **idx_achievement_progress_achievement_id**
  ```sql
  CREATE INDEX idx_achievement_progress_achievement_id ON public.achievement_progress USING btree (achievement_id)
  ```

- **idx_achievement_progress_percentage**
  ```sql
  CREATE INDEX idx_achievement_progress_percentage ON public.achievement_progress USING btree (progress_percentage)
  ```

- **idx_achievement_progress_user_id**
  ```sql
  CREATE INDEX idx_achievement_progress_user_id ON public.achievement_progress USING btree (user_id)
  ```

- **unique_achievement_progress**
  ```sql
  CREATE UNIQUE INDEX unique_achievement_progress ON public.achievement_progress USING btree (user_id, achievement_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `achievement_id` | `achievements.achievement_id` |
| `user_id` | `users.id` |

---

## achievements

**Description:** Achievements with 5 rarity levels and 6 categories

**Columns:** 11  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('achievements_id_seq'::regclass) |
| `achievement_id` | character varying(100) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `category` | character varying(50) | ❌ | - |
| `rarity` | character varying(20) | ❌ | - |
| `icon` | character varying(50) | ❌ | - |
| `bp_reward` | integer | ❌ | 0 |
| `requirements` | jsonb | ❌ | - |
| `hidden` | boolean | ❌ | false |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **achievements_achievement_id_key**
  ```sql
  CREATE UNIQUE INDEX achievements_achievement_id_key ON public.achievements USING btree (achievement_id)
  ```

- **achievements_pkey**
  ```sql
  CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id)
  ```

- **idx_achievements_achievement_id**
  ```sql
  CREATE INDEX idx_achievements_achievement_id ON public.achievements USING btree (achievement_id)
  ```

- **idx_achievements_category**
  ```sql
  CREATE INDEX idx_achievements_category ON public.achievements USING btree (category)
  ```

- **idx_achievements_rarity**
  ```sql
  CREATE INDEX idx_achievements_rarity ON public.achievements USING btree (rarity)
  ```

---

## active_tokens

**Columns:** 8  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `token_vault_id` | uuid | ✅ | - |
| `payee_identifier` | character varying(255) | ✅ | - |
| `payee_name` | character varying(255) | ✅ | - |
| `qr_code_type` | character varying(10) | ✅ | - |
| `transaction_amount` | numeric | ✅ | - |
| `status` | character varying(20) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | - |
| `expires_at` | timestamp with time zone | ✅ | - |
---

## agent_annual_returns

**Description:** PSD-1 Section 16.15: Agent annual returns (Table 1)

**Columns:** 17  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `return_year` | integer | ❌ | - |
| `agent_number` | integer | ✅ | - |
| `agent_id` | character varying(50) | ✅ | - |
| `agent_name` | character varying(255) | ❌ | - |
| `location_city` | character varying(100) | ✅ | - |
| `location_region` | character varying(100) | ✅ | - |
| `services_offered` | ARRAY | ✅ | - |
| `status` | character varying(20) | ❌ | - |
| `pool_account_balance` | numeric | ✅ | - |
| `transaction_volume` | integer | ✅ | - |
| `transaction_value` | numeric | ✅ | - |
| `submitted_to_bon` | boolean | ✅ | false |
| `submitted_at` | timestamp with time zone | ✅ | - |
| `due_date` | date | ❌ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **agent_annual_returns_pkey**
  ```sql
  CREATE UNIQUE INDEX agent_annual_returns_pkey ON public.agent_annual_returns USING btree (id)
  ```

- **agent_annual_returns_return_year_agent_id_key**
  ```sql
  CREATE UNIQUE INDEX agent_annual_returns_return_year_agent_id_key ON public.agent_annual_returns USING btree (return_year, agent_id)
  ```

- **idx_agent_returns_status**
  ```sql
  CREATE INDEX idx_agent_returns_status ON public.agent_annual_returns USING btree (status)
  ```

- **idx_agent_returns_submitted**
  ```sql
  CREATE INDEX idx_agent_returns_submitted ON public.agent_annual_returns USING btree (submitted_to_bon)
  ```

- **idx_agent_returns_year**
  ```sql
  CREATE INDEX idx_agent_returns_year ON public.agent_annual_returns USING btree (return_year DESC)
  ```

---

## agent_clusters

**Columns:** 9  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `region` | character varying(50) | ❌ | - |
| `cluster_id` | integer | ✅ | - |
| `density_type` | character varying(50) | ✅ | - |
| `agent_count` | integer | ✅ | 0 |
| `transaction_volume` | numeric | ✅ | 0 |
| `average_liquidity` | numeric | ✅ | 0 |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **agent_clusters_pkey**
  ```sql
  CREATE UNIQUE INDEX agent_clusters_pkey ON public.agent_clusters USING btree (id)
  ```

- **idx_agent_clusters_density**
  ```sql
  CREATE INDEX idx_agent_clusters_density ON public.agent_clusters USING btree (density_type)
  ```

- **idx_agent_clusters_region**
  ```sql
  CREATE INDEX idx_agent_clusters_region ON public.agent_clusters USING btree (region)
  ```

---

## agent_onboarding

**Columns:** 16  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `onboarding_id` | character varying(50) | ❌ | - |
| `business_name` | character varying(255) | ❌ | - |
| `agent_type` | character varying(50) | ❌ | - |
| `location` | jsonb | ❌ | - |
| `contact` | jsonb | ❌ | - |
| `liquidity_requirements` | jsonb | ✅ | - |
| `documents` | jsonb | ✅ | - |
| `status` | character varying(50) | ✅ | 'document_verification'::character varying |
| `progress` | integer | ✅ | 0 |
| `current_step` | character varying(100) | ✅ | - |
| `completed_steps` | ARRAY | ✅ | - |
| `pending_steps` | ARRAY | ✅ | - |
| `estimated_completion` | date | ✅ | - |
| `issues` | jsonb | ✅ | '[]'::jsonb |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **agent_onboarding_pkey**
  ```sql
  CREATE UNIQUE INDEX agent_onboarding_pkey ON public.agent_onboarding USING btree (onboarding_id)
  ```

- **idx_agent_onboarding_agent_type**
  ```sql
  CREATE INDEX idx_agent_onboarding_agent_type ON public.agent_onboarding USING btree (agent_type)
  ```

- **idx_agent_onboarding_created**
  ```sql
  CREATE INDEX idx_agent_onboarding_created ON public.agent_onboarding USING btree (created_at DESC)
  ```

- **idx_agent_onboarding_status**
  ```sql
  CREATE INDEX idx_agent_onboarding_status ON public.agent_onboarding USING btree (status)
  ```

---

## agents

**Columns:** 17  
**Indexes:** 6  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `name` | character varying(255) | ❌ | - |
| `type` | character varying(50) | ❌ | - |
| `location` | character varying(255) | ❌ | - |
| `latitude` | numeric | ✅ | - |
| `longitude` | numeric | ✅ | - |
| `wallet_id` | uuid | ✅ | - |
| `liquidity_balance` | numeric | ❌ | 0 |
| `cash_on_hand` | numeric | ❌ | 0 |
| `status` | character varying(50) | ❌ | 'pending_approval'::character varying |
| `min_liquidity_required` | numeric | ❌ | 1000 |
| `max_daily_cashout` | numeric | ❌ | 50000 |
| `commission_rate` | numeric | ❌ | 1.5 |
| `contact_phone` | character varying(20) | ✅ | - |
| `contact_email` | character varying(255) | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **agents_pkey**
  ```sql
  CREATE UNIQUE INDEX agents_pkey ON public.agents USING btree (id)
  ```

- **idx_agents_coordinates**
  ```sql
  CREATE INDEX idx_agents_coordinates ON public.agents USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL))
  ```

- **idx_agents_location**
  ```sql
  CREATE INDEX idx_agents_location ON public.agents USING btree (location)
  ```

- **idx_agents_status**
  ```sql
  CREATE INDEX idx_agents_status ON public.agents USING btree (status)
  ```

- **idx_agents_type**
  ```sql
  CREATE INDEX idx_agents_type ON public.agents USING btree (type)
  ```

- **idx_agents_wallet_id**
  ```sql
  CREATE INDEX idx_agents_wallet_id ON public.agents USING btree (wallet_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `wallet_id` | `wallets.id` |

---

## ai_chunks

**Columns:** 8  
**Indexes:** 1  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `document_id` | uuid | ✅ | - |
| `content` | text | ❌ | - |
| `embedding` | USER-DEFINED | ✅ | - |
| `chunk_index` | integer | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `token_count` | integer | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **ai_chunks_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_chunks_pkey ON public.ai_chunks USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `document_id` | `ai_documents.id` |

---

## ai_documents

**Columns:** 7  
**Indexes:** 2  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `title` | text | ❌ | - |
| `source` | text | ❌ | - |
| `content` | text | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **ai_documents_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_documents_pkey ON public.ai_documents USING btree (id)
  ```

- **idx_ai_documents_source**
  ```sql
  CREATE INDEX idx_ai_documents_source ON public.ai_documents USING btree (source)
  ```

---

## ai_messages

**Columns:** 6  
**Indexes:** 2  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `session_id` | uuid | ✅ | - |
| `role` | text | ❌ | - |
| `content` | text | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **ai_messages_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_messages_pkey ON public.ai_messages USING btree (id)
  ```

- **idx_ai_messages_session**
  ```sql
  CREATE INDEX idx_ai_messages_session ON public.ai_messages USING btree (session_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `session_id` | `ai_sessions.id` |

---

## ai_sessions

**Columns:** 6  
**Indexes:** 1  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |
| `expires_at` | timestamp with time zone | ✅ | (now() + '24:00:00'::interval) |

### Indexes

- **ai_sessions_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_sessions_pkey ON public.ai_sessions USING btree (id)
  ```

---

## ai_token_balances

**Description:** User AI token balances for LLM usage

**Columns:** 8  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('ai_token_balances_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `tokens_balance` | integer | ❌ | 0 |
| `tokens_purchased` | integer | ❌ | 0 |
| `tokens_used` | integer | ❌ | 0 |
| `last_purchase_date` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **ai_token_balances_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_token_balances_pkey ON public.ai_token_balances USING btree (id)
  ```

- **ai_token_balances_user_id_key**
  ```sql
  CREATE UNIQUE INDEX ai_token_balances_user_id_key ON public.ai_token_balances USING btree (user_id)
  ```

- **idx_ai_token_balances_user_id**
  ```sql
  CREATE INDEX idx_ai_token_balances_user_id ON public.ai_token_balances USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## ai_token_purchases

**Description:** History of AI token package purchases

**Columns:** 8  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('ai_token_purchases_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `package` | character varying(20) | ❌ | - |
| `tokens` | integer | ❌ | - |
| `price` | numeric | ❌ | - |
| `payment_method` | character varying(50) | ✅ | - |
| `transaction_id` | character varying(255) | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **ai_token_purchases_pkey**
  ```sql
  CREATE UNIQUE INDEX ai_token_purchases_pkey ON public.ai_token_purchases USING btree (id)
  ```

- **idx_ai_token_purchases_created_at**
  ```sql
  CREATE INDEX idx_ai_token_purchases_created_at ON public.ai_token_purchases USING btree (created_at DESC)
  ```

- **idx_ai_token_purchases_user_id**
  ```sql
  CREATE INDEX idx_ai_token_purchases_user_id ON public.ai_token_purchases USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## api_sync_audit_logs

**Description:** Real-time API sync audit trail (SmartPay ↔ Buffr communication)

**Columns:** 17  
**Indexes:** 7  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `direction` | character varying(10) | ❌ | - |
| `endpoint` | character varying(255) | ❌ | - |
| `method` | character varying(10) | ❌ | - |
| `request_payload` | jsonb | ✅ | - |
| `response_payload` | jsonb | ✅ | - |
| `status_code` | integer | ✅ | - |
| `response_time_ms` | integer | ✅ | - |
| `success` | boolean | ❌ | - |
| `error_message` | text | ✅ | - |
| `beneficiary_id` | character varying(100) | ✅ | - |
| `voucher_id` | uuid | ✅ | - |
| `user_id` | uuid | ✅ | - |
| `request_id` | character varying(100) | ✅ | - |
| `retry_count` | integer | ✅ | 0 |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **api_sync_audit_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX api_sync_audit_logs_pkey ON public.api_sync_audit_logs USING btree (id)
  ```

- **idx_api_sync_audit_logs_beneficiary_id**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_beneficiary_id ON public.api_sync_audit_logs USING btree (beneficiary_id)
  ```

- **idx_api_sync_audit_logs_direction**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_direction ON public.api_sync_audit_logs USING btree (direction)
  ```

- **idx_api_sync_audit_logs_endpoint**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_endpoint ON public.api_sync_audit_logs USING btree (endpoint)
  ```

- **idx_api_sync_audit_logs_request_id**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_request_id ON public.api_sync_audit_logs USING btree (request_id)
  ```

- **idx_api_sync_audit_logs_timestamp**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_timestamp ON public.api_sync_audit_logs USING btree ("timestamp" DESC)
  ```

- **idx_api_sync_audit_logs_voucher_id**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_voucher_id ON public.api_sync_audit_logs USING btree (voucher_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |
| `voucher_id` | `vouchers.id` |

---

## api_sync_audit_logs_archive

**Columns:** 17  
**Indexes:** 9  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `direction` | character varying(10) | ❌ | - |
| `endpoint` | character varying(255) | ❌ | - |
| `method` | character varying(10) | ❌ | - |
| `request_payload` | jsonb | ✅ | - |
| `response_payload` | jsonb | ✅ | - |
| `status_code` | integer | ✅ | - |
| `response_time_ms` | integer | ✅ | - |
| `success` | boolean | ❌ | - |
| `error_message` | text | ✅ | - |
| `beneficiary_id` | character varying(100) | ✅ | - |
| `voucher_id` | uuid | ✅ | - |
| `user_id` | uuid | ✅ | - |
| `request_id` | character varying(100) | ✅ | - |
| `retry_count` | integer | ✅ | 0 |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **api_sync_audit_logs_archive_beneficiary_id_idx**
  ```sql
  CREATE INDEX api_sync_audit_logs_archive_beneficiary_id_idx ON public.api_sync_audit_logs_archive USING btree (beneficiary_id)
  ```

- **api_sync_audit_logs_archive_direction_idx**
  ```sql
  CREATE INDEX api_sync_audit_logs_archive_direction_idx ON public.api_sync_audit_logs_archive USING btree (direction)
  ```

- **api_sync_audit_logs_archive_endpoint_idx**
  ```sql
  CREATE INDEX api_sync_audit_logs_archive_endpoint_idx ON public.api_sync_audit_logs_archive USING btree (endpoint)
  ```

- **api_sync_audit_logs_archive_pkey**
  ```sql
  CREATE UNIQUE INDEX api_sync_audit_logs_archive_pkey ON public.api_sync_audit_logs_archive USING btree (id)
  ```

- **api_sync_audit_logs_archive_request_id_idx**
  ```sql
  CREATE INDEX api_sync_audit_logs_archive_request_id_idx ON public.api_sync_audit_logs_archive USING btree (request_id)
  ```

- **api_sync_audit_logs_archive_timestamp_idx**
  ```sql
  CREATE INDEX api_sync_audit_logs_archive_timestamp_idx ON public.api_sync_audit_logs_archive USING btree ("timestamp" DESC)
  ```

- **api_sync_audit_logs_archive_voucher_id_idx**
  ```sql
  CREATE INDEX api_sync_audit_logs_archive_voucher_id_idx ON public.api_sync_audit_logs_archive USING btree (voucher_id)
  ```

- **idx_api_sync_audit_logs_archive_beneficiary_id**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_archive_beneficiary_id ON public.api_sync_audit_logs_archive USING btree (beneficiary_id)
  ```

- **idx_api_sync_audit_logs_archive_timestamp**
  ```sql
  CREATE INDEX idx_api_sync_audit_logs_archive_timestamp ON public.api_sync_audit_logs_archive USING btree ("timestamp")
  ```

---

## audit_log

**Description:** Comprehensive audit trail (PSD-12: 7-year retention)

**Columns:** 11  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `action` | character varying(100) | ❌ | - |
| `actor` | character varying(255) | ❌ | - |
| `resource_type` | character varying(50) | ✅ | - |
| `resource_id` | character varying(255) | ✅ | - |
| `result` | character varying(20) | ❌ | - |
| `details` | jsonb | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `user_agent` | text | ✅ | - |
| `request_id` | character varying(100) | ✅ | - |

### Indexes

- **audit_log_pkey**
  ```sql
  CREATE UNIQUE INDEX audit_log_pkey ON public.audit_log USING btree (id)
  ```

- **idx_audit_action**
  ```sql
  CREATE INDEX idx_audit_action ON public.audit_log USING btree (action)
  ```

- **idx_audit_actor**
  ```sql
  CREATE INDEX idx_audit_actor ON public.audit_log USING btree (actor)
  ```

- **idx_audit_resource**
  ```sql
  CREATE INDEX idx_audit_resource ON public.audit_log USING btree (resource_type, resource_id)
  ```

- **idx_audit_result**
  ```sql
  CREATE INDEX idx_audit_result ON public.audit_log USING btree (result)
  ```

---

## audit_logs

**Description:** Comprehensive audit log for all operations (Regulatory & Compliance Requirement)

**Columns:** 11  
**Indexes:** 9  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `admin_user_id` | character varying(255) | ❌ | - |
| `action_type` | character varying(100) | ❌ | - |
| `resource_type` | character varying(100) | ❌ | - |
| `resource_id` | character varying(255) | ✅ | - |
| `action_details` | jsonb | ✅ | '{}'::jsonb |
| `ip_address` | character varying(45) | ✅ | - |
| `user_agent` | text | ✅ | - |
| `status` | character varying(50) | ✅ | 'success'::character varying |
| `error_message` | text | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | now() |

### Indexes

- **audit_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX audit_logs_pkey ON public.audit_logs USING btree (id)
  ```

- **idx_audit_logs_action_type**
  ```sql
  CREATE INDEX idx_audit_logs_action_type ON public.audit_logs USING btree (action_type)
  ```

- **idx_audit_logs_admin_date**
  ```sql
  CREATE INDEX idx_audit_logs_admin_date ON public.audit_logs USING btree (admin_user_id, created_at DESC)
  ```

- **idx_audit_logs_admin_user_id**
  ```sql
  CREATE INDEX idx_audit_logs_admin_user_id ON public.audit_logs USING btree (admin_user_id)
  ```

- **idx_audit_logs_created_at**
  ```sql
  CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at DESC)
  ```

- **idx_audit_logs_resource**
  ```sql
  CREATE INDEX idx_audit_logs_resource ON public.audit_logs USING btree (resource_type, resource_id, created_at DESC)
  ```

- **idx_audit_logs_resource_id**
  ```sql
  CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs USING btree (resource_id)
  ```

- **idx_audit_logs_resource_type**
  ```sql
  CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs USING btree (resource_type)
  ```

- **idx_audit_logs_status**
  ```sql
  CREATE INDEX idx_audit_logs_status ON public.audit_logs USING btree (status)
  ```

---

## audit_logs_archive

**Columns:** 11  
**Indexes:** 9  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `admin_user_id` | character varying(255) | ❌ | - |
| `action_type` | character varying(100) | ❌ | - |
| `resource_type` | character varying(100) | ❌ | - |
| `resource_id` | character varying(255) | ✅ | - |
| `action_details` | jsonb | ✅ | '{}'::jsonb |
| `ip_address` | character varying(45) | ✅ | - |
| `user_agent` | text | ✅ | - |
| `status` | character varying(50) | ✅ | 'success'::character varying |
| `error_message` | text | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | now() |

### Indexes

- **audit_logs_archive_action_type_idx**
  ```sql
  CREATE INDEX audit_logs_archive_action_type_idx ON public.audit_logs_archive USING btree (action_type)
  ```

- **audit_logs_archive_admin_user_id_created_at_idx**
  ```sql
  CREATE INDEX audit_logs_archive_admin_user_id_created_at_idx ON public.audit_logs_archive USING btree (admin_user_id, created_at DESC)
  ```

- **audit_logs_archive_admin_user_id_idx**
  ```sql
  CREATE INDEX audit_logs_archive_admin_user_id_idx ON public.audit_logs_archive USING btree (admin_user_id)
  ```

- **audit_logs_archive_created_at_idx**
  ```sql
  CREATE INDEX audit_logs_archive_created_at_idx ON public.audit_logs_archive USING btree (created_at DESC)
  ```

- **audit_logs_archive_pkey**
  ```sql
  CREATE UNIQUE INDEX audit_logs_archive_pkey ON public.audit_logs_archive USING btree (id)
  ```

- **audit_logs_archive_resource_id_idx**
  ```sql
  CREATE INDEX audit_logs_archive_resource_id_idx ON public.audit_logs_archive USING btree (resource_id)
  ```

- **audit_logs_archive_resource_type_idx**
  ```sql
  CREATE INDEX audit_logs_archive_resource_type_idx ON public.audit_logs_archive USING btree (resource_type)
  ```

- **audit_logs_archive_resource_type_resource_id_created_at_idx**
  ```sql
  CREATE INDEX audit_logs_archive_resource_type_resource_id_created_at_idx ON public.audit_logs_archive USING btree (resource_type, resource_id, created_at DESC)
  ```

- **audit_logs_archive_status_idx**
  ```sql
  CREATE INDEX audit_logs_archive_status_idx ON public.audit_logs_archive USING btree (status)
  ```

---

## automated_request_tracking

**Description:** Tracks automated requests per Account Holder (max 4 per day per Account Holder)

**Columns:** 7  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('automated_request_tracking_id_seq'::regclass) |
| `account_holder_id` | character varying(255) | ❌ | - |
| `endpoint` | character varying(255) | ❌ | - |
| `request_date` | date | ❌ | - |
| `request_count` | integer | ❌ | 0 |
| `created_at` | timestamp without time zone | ❌ | now() |
| `updated_at` | timestamp without time zone | ❌ | now() |

### Indexes

- **automated_request_tracking_pkey**
  ```sql
  CREATE UNIQUE INDEX automated_request_tracking_pkey ON public.automated_request_tracking USING btree (id)
  ```

- **idx_art_account_holder**
  ```sql
  CREATE INDEX idx_art_account_holder ON public.automated_request_tracking USING btree (account_holder_id)
  ```

- **idx_art_date**
  ```sql
  CREATE INDEX idx_art_date ON public.automated_request_tracking USING btree (request_date)
  ```

- **idx_art_endpoint**
  ```sql
  CREATE INDEX idx_art_endpoint ON public.automated_request_tracking USING btree (endpoint)
  ```

- **unique_account_endpoint_date**
  ```sql
  CREATE UNIQUE INDEX unique_account_endpoint_date ON public.automated_request_tracking USING btree (account_holder_id, endpoint, request_date)
  ```

---

## autopay_rules

**Columns:** 12  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `wallet_id` | uuid | ✅ | - |
| `user_id` | character varying(255) | ❌ | - |
| `rule_type` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `frequency` | character varying(20) | ✅ | - |
| `recipient_id` | character varying(255) | ✅ | - |
| `recipient_name` | character varying(255) | ✅ | - |
| `is_active` | boolean | ✅ | true |
| `next_execution_date` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **autopay_rules_pkey**
  ```sql
  CREATE UNIQUE INDEX autopay_rules_pkey ON public.autopay_rules USING btree (id)
  ```

- **idx_autopay_rules_next_execution**
  ```sql
  CREATE INDEX idx_autopay_rules_next_execution ON public.autopay_rules USING btree (next_execution_date) WHERE (is_active = true)
  ```

- **idx_autopay_rules_user_id**
  ```sql
  CREATE INDEX idx_autopay_rules_user_id ON public.autopay_rules USING btree (user_id)
  ```

- **idx_autopay_rules_wallet_id**
  ```sql
  CREATE INDEX idx_autopay_rules_wallet_id ON public.autopay_rules USING btree (wallet_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `wallet_id` | `wallets.id` |

---

## autopay_transactions

**Columns:** 13  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `rule_id` | uuid | ✅ | - |
| `wallet_id` | uuid | ✅ | - |
| `user_id` | character varying(255) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `status` | character varying(20) | ❌ | - |
| `executed_at` | timestamp without time zone | ✅ | now() |
| `failure_reason` | text | ✅ | - |
| `recipient_id` | character varying(255) | ✅ | - |
| `recipient_name` | character varying(255) | ✅ | - |
| `rule_description` | text | ✅ | - |
| `authorisation_code` | character varying(255) | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **autopay_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX autopay_transactions_pkey ON public.autopay_transactions USING btree (id)
  ```

- **idx_autopay_transactions_executed_at**
  ```sql
  CREATE INDEX idx_autopay_transactions_executed_at ON public.autopay_transactions USING btree (executed_at DESC)
  ```

- **idx_autopay_transactions_rule_id**
  ```sql
  CREATE INDEX idx_autopay_transactions_rule_id ON public.autopay_transactions USING btree (rule_id)
  ```

- **idx_autopay_transactions_user_id**
  ```sql
  CREATE INDEX idx_autopay_transactions_user_id ON public.autopay_transactions USING btree (user_id)
  ```

- **idx_autopay_transactions_wallet_id**
  ```sql
  CREATE INDEX idx_autopay_transactions_wallet_id ON public.autopay_transactions USING btree (wallet_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `rule_id` | `autopay_rules.id` |
| `wallet_id` | `wallets.id` |

---

## backup_recovery_logs

**Description:** PSD-12 Section 11.11: Backup logs and recovery testing (RPO 5 minutes, RTO 2 hours)

**Columns:** 14  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `backup_type` | character varying(50) | ❌ | - |
| `backup_scope` | character varying(50) | ❌ | - |
| `backup_started_at` | timestamp with time zone | ❌ | - |
| `backup_completed_at` | timestamp with time zone | ✅ | - |
| `backup_size_mb` | numeric | ✅ | - |
| `backup_location` | text | ✅ | - |
| `status` | character varying(20) | ❌ | - |
| `error_message` | text | ✅ | - |
| `is_recovery_test` | boolean | ✅ | false |
| `recovery_test_date` | date | ✅ | - |
| `recovery_test_successful` | boolean | ✅ | - |
| `recovery_time_minutes` | integer | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **backup_recovery_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX backup_recovery_logs_pkey ON public.backup_recovery_logs USING btree (id)
  ```

- **idx_backup_recovery_test**
  ```sql
  CREATE INDEX idx_backup_recovery_test ON public.backup_recovery_logs USING btree (is_recovery_test)
  ```

- **idx_backup_started**
  ```sql
  CREATE INDEX idx_backup_started ON public.backup_recovery_logs USING btree (backup_started_at DESC)
  ```

- **idx_backup_status**
  ```sql
  CREATE INDEX idx_backup_status ON public.backup_recovery_logs USING btree (status)
  ```

---

## badge_collections

**Description:** User badge collections with display badges

**Columns:** 8  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('badge_collections_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `badges_earned` | ARRAY | ❌ | '{}'::text[] |
| `total_badges` | integer | ❌ | 0 |
| `rarest_badge` | character varying(50) | ✅ | - |
| `display_badges` | ARRAY | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **badge_collections_pkey**
  ```sql
  CREATE UNIQUE INDEX badge_collections_pkey ON public.badge_collections USING btree (id)
  ```

- **badge_collections_user_id_key**
  ```sql
  CREATE UNIQUE INDEX badge_collections_user_id_key ON public.badge_collections USING btree (user_id)
  ```

- **idx_badge_collections_total**
  ```sql
  CREATE INDEX idx_badge_collections_total ON public.badge_collections USING btree (total_badges DESC)
  ```

- **idx_badge_collections_user_id**
  ```sql
  CREATE INDEX idx_badge_collections_user_id ON public.badge_collections USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## beneficiaries

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | character varying(50) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `phone` | character varying(20) | ❌ | - |
| `region` | character varying(50) | ❌ | - |
| `grant_type` | character varying(50) | ❌ | - |
| `status` | character varying(50) | ❌ | 'pending'::character varying |
| `enrolled_at` | timestamp with time zone | ✅ | now() |
| `last_payment` | timestamp with time zone | ✅ | now() |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **beneficiaries_pkey**
  ```sql
  CREATE UNIQUE INDEX beneficiaries_pkey ON public.beneficiaries USING btree (id)
  ```

- **idx_beneficiaries_grant_type**
  ```sql
  CREATE INDEX idx_beneficiaries_grant_type ON public.beneficiaries USING btree (grant_type)
  ```

- **idx_beneficiaries_region**
  ```sql
  CREATE INDEX idx_beneficiaries_region ON public.beneficiaries USING btree (region)
  ```

- **idx_beneficiaries_status**
  ```sql
  CREATE INDEX idx_beneficiaries_status ON public.beneficiaries USING btree (status)
  ```

---

## beneficiary_clusters

**Columns:** 11  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `region` | character varying(50) | ❌ | - |
| `cluster_id` | integer | ❌ | - |
| `centroid_latitude` | numeric | ❌ | - |
| `centroid_longitude` | numeric | ❌ | - |
| `beneficiary_count` | integer | ✅ | 0 |
| `transaction_volume` | numeric | ✅ | 0 |
| `average_transaction_amount` | numeric | ✅ | 0 |
| `preferred_cashout_location` | character varying(50) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **beneficiary_clusters_pkey**
  ```sql
  CREATE UNIQUE INDEX beneficiary_clusters_pkey ON public.beneficiary_clusters USING btree (id)
  ```

- **beneficiary_clusters_region_cluster_id_key**
  ```sql
  CREATE UNIQUE INDEX beneficiary_clusters_region_cluster_id_key ON public.beneficiary_clusters USING btree (region, cluster_id)
  ```

- **idx_beneficiary_clusters_latitude**
  ```sql
  CREATE INDEX idx_beneficiary_clusters_latitude ON public.beneficiary_clusters USING btree (centroid_latitude)
  ```

- **idx_beneficiary_clusters_longitude**
  ```sql
  CREATE INDEX idx_beneficiary_clusters_longitude ON public.beneficiary_clusters USING btree (centroid_longitude)
  ```

- **idx_beneficiary_clusters_region**
  ```sql
  CREATE INDEX idx_beneficiary_clusters_region ON public.beneficiary_clusters USING btree (region)
  ```

---

## beneficiary_feedback

**Description:** Structured feedback from beneficiaries to inform product decisions

**Columns:** 10  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `feedback_type` | character varying(50) | ❌ | - |
| `transaction_id` | uuid | ✅ | - |
| `satisfaction_score` | integer | ✅ | - |
| `feedback_text` | text | ✅ | - |
| `channel` | character varying(50) | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **beneficiary_feedback_pkey**
  ```sql
  CREATE UNIQUE INDEX beneficiary_feedback_pkey ON public.beneficiary_feedback USING btree (id)
  ```

- **idx_beneficiary_feedback_created_at**
  ```sql
  CREATE INDEX idx_beneficiary_feedback_created_at ON public.beneficiary_feedback USING btree (created_at)
  ```

- **idx_beneficiary_feedback_feedback_type**
  ```sql
  CREATE INDEX idx_beneficiary_feedback_feedback_type ON public.beneficiary_feedback USING btree (feedback_type)
  ```

- **idx_beneficiary_feedback_satisfaction_score**
  ```sql
  CREATE INDEX idx_beneficiary_feedback_satisfaction_score ON public.beneficiary_feedback USING btree (satisfaction_score)
  ```

- **idx_beneficiary_feedback_transaction_id**
  ```sql
  CREATE INDEX idx_beneficiary_feedback_transaction_id ON public.beneficiary_feedback USING btree (transaction_id)
  ```

- **idx_beneficiary_feedback_user_id**
  ```sql
  CREATE INDEX idx_beneficiary_feedback_user_id ON public.beneficiary_feedback USING btree (user_id)
  ```

---

## bon_monthly_reports

**Description:** PSD-3 Section 23: Monthly reporting to Bank of Namibia

**Columns:** 28  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `report_month` | date | ❌ | - |
| `report_type` | character varying(50) | ❌ | - |
| `total_registered_users` | integer | ✅ | - |
| `total_active_wallets` | integer | ✅ | - |
| `total_dormant_wallets` | integer | ✅ | - |
| `outstanding_emoney_liabilities` | numeric | ✅ | - |
| `trust_account_balance` | numeric | ✅ | - |
| `trust_account_interest` | numeric | ✅ | - |
| `total_transactions_volume` | integer | ✅ | - |
| `total_transactions_value` | numeric | ✅ | - |
| `cash_in_volume` | integer | ✅ | - |
| `cash_in_value` | numeric | ✅ | - |
| `cash_out_volume` | integer | ✅ | - |
| `cash_out_value` | numeric | ✅ | - |
| `p2p_volume` | integer | ✅ | - |
| `p2p_value` | numeric | ✅ | - |
| `capital_held` | numeric | ✅ | - |
| `capital_requirement` | numeric | ✅ | - |
| `report_data` | jsonb | ✅ | - |
| `generated_by` | character varying(100) | ✅ | - |
| `generated_at` | timestamp with time zone | ✅ | - |
| `submitted_to_bon` | boolean | ✅ | false |
| `submitted_at` | timestamp with time zone | ✅ | - |
| `submitted_by` | character varying(100) | ✅ | - |
| `due_date` | date | ❌ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **bon_monthly_reports_pkey**
  ```sql
  CREATE UNIQUE INDEX bon_monthly_reports_pkey ON public.bon_monthly_reports USING btree (id)
  ```

- **bon_monthly_reports_report_month_report_type_key**
  ```sql
  CREATE UNIQUE INDEX bon_monthly_reports_report_month_report_type_key ON public.bon_monthly_reports USING btree (report_month, report_type)
  ```

- **idx_bon_reports_due_date**
  ```sql
  CREATE INDEX idx_bon_reports_due_date ON public.bon_monthly_reports USING btree (due_date)
  ```

- **idx_bon_reports_month**
  ```sql
  CREATE INDEX idx_bon_reports_month ON public.bon_monthly_reports USING btree (report_month DESC)
  ```

- **idx_bon_reports_submitted**
  ```sql
  CREATE INDEX idx_bon_reports_submitted ON public.bon_monthly_reports USING btree (submitted_to_bon)
  ```

- **idx_bon_reports_type**
  ```sql
  CREATE INDEX idx_bon_reports_type ON public.bon_monthly_reports USING btree (report_type)
  ```

---

## bottleneck_metrics

**Columns:** 9  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `date` | date | ❌ | - |
| `nampost_branch_load_before` | numeric | ✅ | - |
| `nampost_branch_load_after` | numeric | ✅ | - |
| `agent_network_usage_percentage` | numeric | ✅ | - |
| `bottleneck_reduction_percentage` | numeric | ✅ | - |
| `beneficiaries_routed_to_agents` | integer | ✅ | 0 |
| `average_wait_time_reduction` | integer | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **bottleneck_metrics_date_key**
  ```sql
  CREATE UNIQUE INDEX bottleneck_metrics_date_key ON public.bottleneck_metrics USING btree (date)
  ```

- **bottleneck_metrics_pkey**
  ```sql
  CREATE UNIQUE INDEX bottleneck_metrics_pkey ON public.bottleneck_metrics USING btree (id)
  ```

- **idx_bottleneck_metrics_date**
  ```sql
  CREATE INDEX idx_bottleneck_metrics_date ON public.bottleneck_metrics USING btree (date DESC)
  ```

---

## buffr_points_profiles

**Description:** User Buffr Points profiles with dual progression (Levels 1-99 + Ranks F-SSSX)

**Columns:** 18  
**Indexes:** 6  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('buffr_points_profiles_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `level` | integer | ❌ | 1 |
| `rank` | character varying(10) | ❌ | 'F'::character varying |
| `total_bp` | integer | ❌ | 0 |
| `current_bp` | integer | ❌ | 0 |
| `bp_to_next_level` | integer | ❌ | 100 |
| `total_transactions` | integer | ❌ | 0 |
| `total_savings_nad` | numeric | ❌ | 0.00 |
| `loans_repaid_on_time` | integer | ❌ | 0 |
| `literacy_modules_completed` | integer | ❌ | 0 |
| `referrals_made` | integer | ❌ | 0 |
| `challenges_completed` | integer | ❌ | 0 |
| `current_streak` | integer | ❌ | 0 |
| `max_streak` | integer | ❌ | 0 |
| `last_activity_date` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **buffr_points_profiles_pkey**
  ```sql
  CREATE UNIQUE INDEX buffr_points_profiles_pkey ON public.buffr_points_profiles USING btree (id)
  ```

- **buffr_points_profiles_user_id_key**
  ```sql
  CREATE UNIQUE INDEX buffr_points_profiles_user_id_key ON public.buffr_points_profiles USING btree (user_id)
  ```

- **idx_bp_profiles_level**
  ```sql
  CREATE INDEX idx_bp_profiles_level ON public.buffr_points_profiles USING btree (level)
  ```

- **idx_bp_profiles_rank**
  ```sql
  CREATE INDEX idx_bp_profiles_rank ON public.buffr_points_profiles USING btree (rank)
  ```

- **idx_bp_profiles_total_bp**
  ```sql
  CREATE INDEX idx_bp_profiles_total_bp ON public.buffr_points_profiles USING btree (total_bp)
  ```

- **idx_bp_profiles_user_id**
  ```sql
  CREATE INDEX idx_bp_profiles_user_id ON public.buffr_points_profiles USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## capital_requirements_tracking

**Description:** PSD-3 Section 11.5: Capital requirements monitoring (N$1.5M initial + ongoing)

**Columns:** 16  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `tracking_date` | date | ❌ | - |
| `initial_capital_required` | numeric | ❌ | 1500000 |
| `initial_capital_held` | numeric | ❌ | - |
| `outstanding_liabilities_avg_6mo` | numeric | ❌ | - |
| `ongoing_capital_required` | numeric | ✅ | - |
| `ongoing_capital_held` | numeric | ❌ | - |
| `liquid_assets` | jsonb | ✅ | - |
| `liquid_assets_total` | numeric | ❌ | - |
| `compliance_status` | character varying(20) | ❌ | - |
| `deficiency_amount` | numeric | ✅ | - |
| `waiver_granted` | boolean | ✅ | false |
| `waiver_expiry_date` | date | ✅ | - |
| `notes` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **capital_requirements_tracking_pkey**
  ```sql
  CREATE UNIQUE INDEX capital_requirements_tracking_pkey ON public.capital_requirements_tracking USING btree (id)
  ```

- **capital_requirements_tracking_tracking_date_key**
  ```sql
  CREATE UNIQUE INDEX capital_requirements_tracking_tracking_date_key ON public.capital_requirements_tracking USING btree (tracking_date)
  ```

- **idx_capital_compliance**
  ```sql
  CREATE INDEX idx_capital_compliance ON public.capital_requirements_tracking USING btree (compliance_status)
  ```

- **idx_capital_tracking_date**
  ```sql
  CREATE INDEX idx_capital_tracking_date ON public.capital_requirements_tracking USING btree (tracking_date DESC)
  ```

---

## cards

**Columns:** 10  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ❌ | - |
| `card_number` | text | ❌ | - |
| `cardholder_name` | text | ❌ | - |
| `expiry_month` | integer | ❌ | - |
| `expiry_year` | integer | ❌ | - |
| `card_type` | text | ❌ | - |
| `is_default` | boolean | ✅ | false |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |

### Indexes

- **cards_pkey**
  ```sql
  CREATE UNIQUE INDEX cards_pkey ON public.cards USING btree (id)
  ```

- **idx_cards_is_default**
  ```sql
  CREATE INDEX idx_cards_is_default ON public.cards USING btree (user_id, is_default) WHERE (is_default = true)
  ```

- **idx_cards_user_id**
  ```sql
  CREATE INDEX idx_cards_user_id ON public.cards USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## challenges

**Description:** Daily, weekly, monthly, and special event challenges

**Columns:** 12  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('challenges_id_seq'::regclass) |
| `challenge_id` | character varying(100) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `challenge_type` | character varying(50) | ❌ | - |
| `requirements` | jsonb | ❌ | - |
| `bp_reward` | integer | ❌ | 0 |
| `start_date` | timestamp without time zone | ❌ | - |
| `end_date` | timestamp without time zone | ❌ | - |
| `icon` | character varying(50) | ✅ | - |
| `difficulty` | character varying(20) | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **challenges_challenge_id_key**
  ```sql
  CREATE UNIQUE INDEX challenges_challenge_id_key ON public.challenges USING btree (challenge_id)
  ```

- **challenges_pkey**
  ```sql
  CREATE UNIQUE INDEX challenges_pkey ON public.challenges USING btree (id)
  ```

- **idx_challenges_challenge_id**
  ```sql
  CREATE INDEX idx_challenges_challenge_id ON public.challenges USING btree (challenge_id)
  ```

- **idx_challenges_dates**
  ```sql
  CREATE INDEX idx_challenges_dates ON public.challenges USING btree (start_date, end_date)
  ```

- **idx_challenges_type**
  ```sql
  CREATE INDEX idx_challenges_type ON public.challenges USING btree (challenge_type)
  ```

---

## channel_analytics

**Columns:** 9  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `channel` | character varying(50) | ❌ | - |
| `date` | date | ❌ | - |
| `transaction_count` | integer | ❌ | 0 |
| `total_volume` | numeric | ❌ | 0 |
| `unique_users` | integer | ❌ | 0 |
| `average_transaction_amount` | numeric | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **channel_analytics_channel_date_key**
  ```sql
  CREATE UNIQUE INDEX channel_analytics_channel_date_key ON public.channel_analytics USING btree (channel, date)
  ```

- **channel_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX channel_analytics_pkey ON public.channel_analytics USING btree (id)
  ```

- **idx_channel_analytics_channel_date**
  ```sql
  CREATE INDEX idx_channel_analytics_channel_date ON public.channel_analytics USING btree (channel, date)
  ```

- **idx_channel_analytics_date**
  ```sql
  CREATE INDEX idx_channel_analytics_date ON public.channel_analytics USING btree (date)
  ```

---

## chunks

**Columns:** 8  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `document_id` | uuid | ❌ | - |
| `content` | text | ❌ | - |
| `embedding` | USER-DEFINED | ✅ | - |
| `chunk_index` | integer | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `token_count` | integer | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |

### Indexes

- **chunks_pkey**
  ```sql
  CREATE UNIQUE INDEX chunks_pkey ON public.chunks USING btree (id)
  ```

- **idx_chunks_chunk_index**
  ```sql
  CREATE INDEX idx_chunks_chunk_index ON public.chunks USING btree (document_id, chunk_index)
  ```

- **idx_chunks_content_trgm**
  ```sql
  CREATE INDEX idx_chunks_content_trgm ON public.chunks USING gin (content gin_trgm_ops)
  ```

- **idx_chunks_document_id**
  ```sql
  CREATE INDEX idx_chunks_document_id ON public.chunks USING btree (document_id)
  ```

- **idx_chunks_embedding**
  ```sql
  CREATE INDEX idx_chunks_embedding ON public.chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists='1')
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `document_id` | `documents.id` |

---

## compliance_audit_trail

**Description:** Comprehensive audit trail for regulatory compliance actions

**Columns:** 12  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `audit_type` | character varying(50) | ❌ | - |
| `regulation` | character varying(20) | ❌ | - |
| `section` | character varying(50) | ✅ | - |
| `action_taken` | character varying(255) | ❌ | - |
| `performed_by` | character varying(100) | ❌ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `before_state` | jsonb | ✅ | - |
| `after_state` | jsonb | ✅ | - |
| `result` | character varying(50) | ✅ | - |
| `notes` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **compliance_audit_trail_pkey**
  ```sql
  CREATE UNIQUE INDEX compliance_audit_trail_pkey ON public.compliance_audit_trail USING btree (id)
  ```

- **idx_audit_regulation**
  ```sql
  CREATE INDEX idx_audit_regulation ON public.compliance_audit_trail USING btree (regulation)
  ```

- **idx_audit_timestamp**
  ```sql
  CREATE INDEX idx_audit_timestamp ON public.compliance_audit_trail USING btree ("timestamp" DESC)
  ```

- **idx_audit_type**
  ```sql
  CREATE INDEX idx_audit_type ON public.compliance_audit_trail USING btree (audit_type)
  ```

---

## compliance_checks

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `session_id` | uuid | ✅ | - |
| `transaction_id` | uuid | ✅ | - |
| `compliance_type` | text | ❌ | - |
| `is_compliant` | boolean | ❌ | - |
| `compliance_score` | numeric | ✅ | - |
| `violations` | jsonb | ✅ | '[]'::jsonb |
| `required_actions` | jsonb | ✅ | '[]'::jsonb |
| `risk_level` | text | ✅ | - |
| `checked_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **compliance_checks_pkey**
  ```sql
  CREATE UNIQUE INDEX compliance_checks_pkey ON public.compliance_checks USING btree (id)
  ```

- **idx_compliance_checks_is_compliant**
  ```sql
  CREATE INDEX idx_compliance_checks_is_compliant ON public.compliance_checks USING btree (is_compliant)
  ```

- **idx_compliance_checks_transaction_id**
  ```sql
  CREATE INDEX idx_compliance_checks_transaction_id ON public.compliance_checks USING btree (transaction_id)
  ```

- **idx_compliance_checks_type**
  ```sql
  CREATE INDEX idx_compliance_checks_type ON public.compliance_checks USING btree (compliance_type, checked_at DESC)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `session_id` | `sessions.id` |
| `transaction_id` | `transactions.id` |

---

## compliance_dashboard_metrics

**Description:** Real-time compliance status dashboard

**Columns:** 17  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `metric_date` | date | ❌ | CURRENT_DATE |
| `trust_account_compliant` | boolean | ✅ | false |
| `capital_compliant` | boolean | ✅ | false |
| `dormant_wallets_count` | integer | ✅ | 0 |
| `monthly_report_overdue` | boolean | ✅ | false |
| `current_uptime_percentage` | numeric | ✅ | - |
| `uptime_sla_met` | boolean | ✅ | true |
| `open_incidents_count` | integer | ✅ | 0 |
| `critical_incidents_count` | integer | ✅ | 0 |
| `last_backup_time` | timestamp with time zone | ✅ | - |
| `rpo_compliant` | boolean | ✅ | true |
| `agent_return_submitted` | boolean | ✅ | false |
| `pending_notifications_count` | integer | ✅ | 0 |
| `overall_compliance_score` | numeric | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **compliance_dashboard_metrics_metric_date_key**
  ```sql
  CREATE UNIQUE INDEX compliance_dashboard_metrics_metric_date_key ON public.compliance_dashboard_metrics USING btree (metric_date)
  ```

- **compliance_dashboard_metrics_pkey**
  ```sql
  CREATE UNIQUE INDEX compliance_dashboard_metrics_pkey ON public.compliance_dashboard_metrics USING btree (id)
  ```

- **idx_compliance_metrics_date**
  ```sql
  CREATE INDEX idx_compliance_metrics_date ON public.compliance_dashboard_metrics USING btree (metric_date DESC)
  ```

---

## concentration_alerts

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `branch_id` | character varying(50) | ❌ | - |
| `concentration_level` | character varying(50) | ❌ | - |
| `current_load` | integer | ❌ | - |
| `max_capacity` | integer | ❌ | - |
| `wait_time` | integer | ❌ | - |
| `beneficiaries_notified` | integer | ✅ | 0 |
| `agents_suggested` | integer | ✅ | 0 |
| `resolved_at` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **concentration_alerts_pkey**
  ```sql
  CREATE UNIQUE INDEX concentration_alerts_pkey ON public.concentration_alerts USING btree (id)
  ```

- **idx_concentration_alerts_branch**
  ```sql
  CREATE INDEX idx_concentration_alerts_branch ON public.concentration_alerts USING btree (branch_id)
  ```

- **idx_concentration_alerts_created**
  ```sql
  CREATE INDEX idx_concentration_alerts_created ON public.concentration_alerts USING btree (created_at DESC)
  ```

- **idx_concentration_alerts_level**
  ```sql
  CREATE INDEX idx_concentration_alerts_level ON public.concentration_alerts USING btree (concentration_level)
  ```

---

## contacts

**Columns:** 12  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `phone` | character varying(20) | ✅ | - |
| `email` | character varying(255) | ✅ | - |
| `is_favorite` | boolean | ✅ | false |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |
| `phone_number` | character varying(20) | ✅ | - |
| `avatar` | text | ✅ | - |
| `bank_code` | character varying(10) | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **contacts_pkey**
  ```sql
  CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id)
  ```

- **contacts_user_id_phone_key**
  ```sql
  CREATE UNIQUE INDEX contacts_user_id_phone_key ON public.contacts USING btree (user_id, phone)
  ```

- **idx_contacts_is_favorite**
  ```sql
  CREATE INDEX idx_contacts_is_favorite ON public.contacts USING btree (is_favorite) WHERE (is_favorite = true)
  ```

- **idx_contacts_user_id**
  ```sql
  CREATE INDEX idx_contacts_user_id ON public.contacts USING btree (user_id)
  ```

---

## conversations

**Description:** Stores conversation history for Buffr AI Companion Agent

**Columns:** 7  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `session_id` | text | ❌ | - |
| `user_id` | text | ✅ | - |
| `user_message` | text | ❌ | - |
| `assistant_response` | text | ❌ | - |
| `agents_consulted` | ARRAY | ✅ | '{}'::text[] |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |

### Indexes

- **conversations_pkey**
  ```sql
  CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id)
  ```

- **idx_conversations_created_at**
  ```sql
  CREATE INDEX idx_conversations_created_at ON public.conversations USING btree (created_at DESC)
  ```

- **idx_conversations_session_id**
  ```sql
  CREATE INDEX idx_conversations_session_id ON public.conversations USING btree (session_id, created_at DESC)
  ```

- **idx_conversations_user_id**
  ```sql
  CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id, created_at DESC)
  ```

---

## coverage_gaps

**Columns:** 11  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `location_address` | character varying(255) | ❌ | - |
| `latitude` | numeric | ❌ | - |
| `longitude` | numeric | ❌ | - |
| `region` | character varying(50) | ❌ | - |
| `beneficiary_count` | integer | ✅ | 0 |
| `nearest_agent_distance_km` | numeric | ✅ | - |
| `recommended_agent_type` | character varying(50) | ✅ | - |
| `priority` | character varying(50) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **coverage_gaps_pkey**
  ```sql
  CREATE UNIQUE INDEX coverage_gaps_pkey ON public.coverage_gaps USING btree (id)
  ```

- **idx_coverage_gaps_latitude**
  ```sql
  CREATE INDEX idx_coverage_gaps_latitude ON public.coverage_gaps USING btree (latitude)
  ```

- **idx_coverage_gaps_longitude**
  ```sql
  CREATE INDEX idx_coverage_gaps_longitude ON public.coverage_gaps USING btree (longitude)
  ```

- **idx_coverage_gaps_priority**
  ```sql
  CREATE INDEX idx_coverage_gaps_priority ON public.coverage_gaps USING btree (priority)
  ```

- **idx_coverage_gaps_region**
  ```sql
  CREATE INDEX idx_coverage_gaps_region ON public.coverage_gaps USING btree (region)
  ```

---

## credit_assessments

**Columns:** 14  
**Indexes:** 4  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `session_id` | uuid | ✅ | - |
| `merchant_id` | uuid | ✅ | - |
| `credit_score` | integer | ❌ | - |
| `default_probability` | numeric | ❌ | - |
| `credit_tier` | text | ❌ | - |
| `max_loan_amount` | numeric | ❌ | - |
| `recommended_interest_rate` | numeric | ❌ | - |
| `logistic_score` | numeric | ✅ | - |
| `random_forest_score` | numeric | ✅ | - |
| `gradient_boosting_score` | numeric | ✅ | - |
| `assessed_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `model_version` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **credit_assessments_pkey**
  ```sql
  CREATE UNIQUE INDEX credit_assessments_pkey ON public.credit_assessments USING btree (id)
  ```

- **idx_credit_assessments_credit_score**
  ```sql
  CREATE INDEX idx_credit_assessments_credit_score ON public.credit_assessments USING btree (credit_score)
  ```

- **idx_credit_assessments_merchant_id**
  ```sql
  CREATE INDEX idx_credit_assessments_merchant_id ON public.credit_assessments USING btree (merchant_id, assessed_at DESC)
  ```

- **idx_credit_assessments_tier**
  ```sql
  CREATE INDEX idx_credit_assessments_tier ON public.credit_assessments USING btree (credit_tier)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `merchant_id` | `merchants.id` |
| `session_id` | `sessions.id` |

---

## cybersecurity_events

**Description:** Cybersecurity incident tracking (PSD-12 compliant)

**Columns:** 25  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `event_id` | character varying(50) | ❌ | - |
| `event_type` | character varying(50) | ❌ | - |
| `severity` | character varying(20) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `affected_systems` | ARRAY | ✅ | '{}'::text[] |
| `affected_users_count` | integer | ✅ | 0 |
| `data_compromised` | boolean | ❌ | false |
| `service_interrupted` | boolean | ❌ | false |
| `financial_loss_nad` | numeric | ✅ | 0.00 |
| `status` | character varying(20) | ❌ | 'detected'::character varying |
| `detected_at` | timestamp with time zone | ❌ | now() |
| `reported_at` | timestamp with time zone | ✅ | - |
| `contained_at` | timestamp with time zone | ✅ | - |
| `resolved_at` | timestamp with time zone | ✅ | - |
| `closed_at` | timestamp with time zone | ✅ | - |
| `reported_to_bon` | boolean | ❌ | false |
| `bon_reference_number` | character varying(50) | ✅ | - |
| `immediate_actions_taken` | text | ✅ | - |
| `remediation_plan` | text | ✅ | - |
| `root_cause` | text | ✅ | - |
| `lessons_learned` | text | ✅ | - |
| `detected_by` | character varying(255) | ✅ | - |
| `handled_by` | character varying(255) | ✅ | - |
| `metadata` | jsonb | ✅ | - |

### Indexes

- **cybersecurity_events_pkey**
  ```sql
  CREATE UNIQUE INDEX cybersecurity_events_pkey ON public.cybersecurity_events USING btree (event_id)
  ```

- **idx_cyber_detected**
  ```sql
  CREATE INDEX idx_cyber_detected ON public.cybersecurity_events USING btree (detected_at DESC)
  ```

- **idx_cyber_reported_bon**
  ```sql
  CREATE INDEX idx_cyber_reported_bon ON public.cybersecurity_events USING btree (reported_to_bon)
  ```

- **idx_cyber_severity**
  ```sql
  CREATE INDEX idx_cyber_severity ON public.cybersecurity_events USING btree (severity)
  ```

- **idx_cyber_status**
  ```sql
  CREATE INDEX idx_cyber_status ON public.cybersecurity_events USING btree (status)
  ```

- **idx_cyber_systems**
  ```sql
  CREATE INDEX idx_cyber_systems ON public.cybersecurity_events USING gin (affected_systems)
  ```

- **idx_cyber_type**
  ```sql
  CREATE INDEX idx_cyber_type ON public.cybersecurity_events USING btree (event_type)
  ```

---

## cybersecurity_incidents

**Description:** PSD-12 Section 11.13-11.15: Cybersecurity incident tracking and reporting

**Columns:** 28  
**Indexes:** 1  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `incident_type` | character varying(50) | ❌ | - |
| `severity` | character varying(20) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `affected_systems` | ARRAY | ✅ | - |
| `detected_at` | timestamp with time zone | ❌ | - |
| `detected_by` | character varying(100) | ✅ | - |
| `reported_to_bon_at` | timestamp with time zone | ✅ | - |
| `preliminary_report_sent` | boolean | ✅ | false |
| `preliminary_report_data` | jsonb | ✅ | - |
| `impact_assessment_sent` | boolean | ✅ | false |
| `impact_assessment_data` | jsonb | ✅ | - |
| `financial_loss` | numeric | ✅ | 0 |
| `data_loss_records` | integer | ✅ | 0 |
| `availability_loss_minutes` | integer | ✅ | 0 |
| `affected_users_count` | integer | ✅ | 0 |
| `status` | character varying(50) | ❌ | 'detected'::character varying |
| `containment_time` | timestamp with time zone | ✅ | - |
| `recovery_time` | timestamp with time zone | ✅ | - |
| `recovery_time_minutes` | integer | ✅ | - |
| `root_cause` | text | ✅ | - |
| `remediation_actions` | text | ✅ | - |
| `preventive_measures` | text | ✅ | - |
| `closed_at` | timestamp with time zone | ✅ | - |
| `closed_by` | character varying(100) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **cybersecurity_incidents_pkey**
  ```sql
  CREATE UNIQUE INDEX cybersecurity_incidents_pkey ON public.cybersecurity_incidents USING btree (id)
  ```

---

## demand_hotspots

**Columns:** 12  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `location_address` | character varying(255) | ❌ | - |
| `latitude` | numeric | ❌ | - |
| `longitude` | numeric | ❌ | - |
| `region` | character varying(50) | ❌ | - |
| `beneficiary_density` | numeric | ✅ | - |
| `transaction_demand_per_month` | numeric | ✅ | - |
| `current_agent_coverage` | integer | ✅ | 0 |
| `recommended_agent_count` | integer | ✅ | 0 |
| `priority` | character varying(50) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **demand_hotspots_pkey**
  ```sql
  CREATE UNIQUE INDEX demand_hotspots_pkey ON public.demand_hotspots USING btree (id)
  ```

- **idx_demand_hotspots_latitude**
  ```sql
  CREATE INDEX idx_demand_hotspots_latitude ON public.demand_hotspots USING btree (latitude)
  ```

- **idx_demand_hotspots_longitude**
  ```sql
  CREATE INDEX idx_demand_hotspots_longitude ON public.demand_hotspots USING btree (longitude)
  ```

- **idx_demand_hotspots_priority**
  ```sql
  CREATE INDEX idx_demand_hotspots_priority ON public.demand_hotspots USING btree (priority)
  ```

- **idx_demand_hotspots_region**
  ```sql
  CREATE INDEX idx_demand_hotspots_region ON public.demand_hotspots USING btree (region)
  ```

---

## dispute_evidence

**Columns:** 8  
**Indexes:** 2  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `dispute_id` | uuid | ❌ | - |
| `file_name` | text | ❌ | - |
| `file_type` | text | ✅ | - |
| `file_size` | integer | ✅ | - |
| `file_url` | text | ✅ | - |
| `uploaded_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **dispute_evidence_pkey**
  ```sql
  CREATE UNIQUE INDEX dispute_evidence_pkey ON public.dispute_evidence USING btree (id)
  ```

- **idx_dispute_evidence_dispute_id**
  ```sql
  CREATE INDEX idx_dispute_evidence_dispute_id ON public.dispute_evidence USING btree (dispute_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `dispute_id` | `disputes.id` |

---

## disputes

**Columns:** 20  
**Indexes:** 6  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `customer_id` | uuid | ❌ | - |
| `transaction_id` | uuid | ✅ | - |
| `category` | text | ❌ | - |
| `description` | text | ❌ | - |
| `status` | text | ❌ | 'submitted'::text |
| `priority` | text | ❌ | 'normal'::text |
| `resolution` | text | ✅ | - |
| `resolution_amount` | numeric | ✅ | - |
| `submitted_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `acknowledged_at` | timestamp with time zone | ✅ | - |
| `due_date` | timestamp with time zone | ✅ | - |
| `resolved_at` | timestamp with time zone | ✅ | - |
| `closed_at` | timestamp with time zone | ✅ | - |
| `contact_details` | jsonb | ✅ | '{}'::jsonb |
| `evidence_files` | jsonb | ✅ | '[]'::jsonb |
| `internal_notes` | jsonb | ✅ | '[]'::jsonb |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **disputes_pkey**
  ```sql
  CREATE UNIQUE INDEX disputes_pkey ON public.disputes USING btree (id)
  ```

- **idx_disputes_category**
  ```sql
  CREATE INDEX idx_disputes_category ON public.disputes USING btree (category)
  ```

- **idx_disputes_customer_id**
  ```sql
  CREATE INDEX idx_disputes_customer_id ON public.disputes USING btree (customer_id, submitted_at DESC)
  ```

- **idx_disputes_priority**
  ```sql
  CREATE INDEX idx_disputes_priority ON public.disputes USING btree (priority, due_date)
  ```

- **idx_disputes_status**
  ```sql
  CREATE INDEX idx_disputes_status ON public.disputes USING btree (status)
  ```

- **idx_disputes_transaction_id**
  ```sql
  CREATE INDEX idx_disputes_transaction_id ON public.disputes USING btree (transaction_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `customer_id` | `users.id` |
| `transaction_id` | `transactions.id` |

---

## document_summaries

**Columns:** 9  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ✅ | - |
| `title` | text | ✅ | - |
| `source` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | - |
| `updated_at` | timestamp with time zone | ✅ | - |
| `metadata` | jsonb | ✅ | - |
| `chunk_count` | bigint | ✅ | - |
| `avg_tokens_per_chunk` | numeric | ✅ | - |
| `total_tokens` | bigint | ✅ | - |
---

## documents

**Columns:** 7  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `title` | text | ❌ | - |
| `source` | text | ❌ | - |
| `content` | text | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |

### Indexes

- **documents_pkey**
  ```sql
  CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id)
  ```

- **idx_documents_created_at**
  ```sql
  CREATE INDEX idx_documents_created_at ON public.documents USING btree (created_at DESC)
  ```

- **idx_documents_metadata**
  ```sql
  CREATE INDEX idx_documents_metadata ON public.documents USING gin (metadata)
  ```

---

## dormant_wallets

**Description:** PSD-3 Section 11.4: Dormant wallet management (6-month inactivity)

**Columns:** 14  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `wallet_balance` | numeric | ❌ | - |
| `last_transaction_date` | timestamp with time zone | ❌ | - |
| `dormancy_approaching_date` | date | ✅ | - |
| `dormancy_date` | date | ✅ | - |
| `customer_notified_date` | date | ✅ | - |
| `notification_sent` | boolean | ✅ | false |
| `status` | character varying(50) | ❌ | 'active'::character varying |
| `resolution_method` | character varying(100) | ✅ | - |
| `resolution_date` | date | ✅ | - |
| `resolution_notes` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **dormant_wallets_beneficiary_id_unique**
  ```sql
  CREATE UNIQUE INDEX dormant_wallets_beneficiary_id_unique ON public.dormant_wallets USING btree (beneficiary_id)
  ```

- **dormant_wallets_pkey**
  ```sql
  CREATE UNIQUE INDEX dormant_wallets_pkey ON public.dormant_wallets USING btree (id)
  ```

- **idx_dormant_beneficiary**
  ```sql
  CREATE INDEX idx_dormant_beneficiary ON public.dormant_wallets USING btree (beneficiary_id)
  ```

- **idx_dormant_date**
  ```sql
  CREATE INDEX idx_dormant_date ON public.dormant_wallets USING btree (dormancy_date)
  ```

- **idx_dormant_status**
  ```sql
  CREATE INDEX idx_dormant_status ON public.dormant_wallets USING btree (status)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |

---

## electronic_signatures

**Columns:** 21  
**Indexes:** 7  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ❌ | - |
| `signature_type` | text | ❌ | - |
| `document_id` | uuid | ✅ | - |
| `transaction_id` | uuid | ✅ | - |
| `signature_hash` | text | ❌ | - |
| `signature_data` | text | ❌ | - |
| `public_key` | text | ❌ | - |
| `algorithm` | text | ❌ | 'RSA_SHA256'::text |
| `certificate_id` | text | ✅ | - |
| `signed_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `expires_at` | timestamp with time zone | ✅ | - |
| `verified` | boolean | ✅ | false |
| `verified_at` | timestamp with time zone | ✅ | - |
| `verification_result` | jsonb | ✅ | '{}'::jsonb |
| `ip_address` | inet | ✅ | - |
| `user_agent` | text | ✅ | - |
| `device_fingerprint` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **electronic_signatures_pkey**
  ```sql
  CREATE UNIQUE INDEX electronic_signatures_pkey ON public.electronic_signatures USING btree (id)
  ```

- **idx_electronic_signatures_document_id**
  ```sql
  CREATE INDEX idx_electronic_signatures_document_id ON public.electronic_signatures USING btree (document_id)
  ```

- **idx_electronic_signatures_hash**
  ```sql
  CREATE INDEX idx_electronic_signatures_hash ON public.electronic_signatures USING btree (signature_hash)
  ```

- **idx_electronic_signatures_transaction_id**
  ```sql
  CREATE INDEX idx_electronic_signatures_transaction_id ON public.electronic_signatures USING btree (transaction_id)
  ```

- **idx_electronic_signatures_type**
  ```sql
  CREATE INDEX idx_electronic_signatures_type ON public.electronic_signatures USING btree (signature_type)
  ```

- **idx_electronic_signatures_user_id**
  ```sql
  CREATE INDEX idx_electronic_signatures_user_id ON public.electronic_signatures USING btree (user_id, signed_at DESC)
  ```

- **idx_electronic_signatures_verified**
  ```sql
  CREATE INDEX idx_electronic_signatures_verified ON public.electronic_signatures USING btree (verified)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `transaction_id` | `transactions.id` |
| `user_id` | `users.id` |

---

## ewallet_balances

**Description:** PSD-3: E-wallet balances for outstanding liability calculation

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `current_balance` | numeric | ❌ | 0 |
| `available_balance` | numeric | ❌ | 0 |
| `pending_balance` | numeric | ❌ | 0 |
| `wallet_status` | character varying(50) | ❌ | 'active'::character varying |
| `last_transaction_date` | timestamp with time zone | ✅ | - |
| `daily_transaction_limit` | numeric | ✅ | - |
| `monthly_transaction_limit` | numeric | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **ewallet_balances_beneficiary_id_key**
  ```sql
  CREATE UNIQUE INDEX ewallet_balances_beneficiary_id_key ON public.ewallet_balances USING btree (beneficiary_id)
  ```

- **ewallet_balances_pkey**
  ```sql
  CREATE UNIQUE INDEX ewallet_balances_pkey ON public.ewallet_balances USING btree (id)
  ```

- **idx_ewallet_beneficiary**
  ```sql
  CREATE INDEX idx_ewallet_beneficiary ON public.ewallet_balances USING btree (beneficiary_id)
  ```

- **idx_ewallet_status**
  ```sql
  CREATE INDEX idx_ewallet_status ON public.ewallet_balances USING btree (wallet_status)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |

---

## ewallet_transactions

**Description:** E-wallet transaction history for PSD-3 reporting

**Columns:** 18  
**Indexes:** 7  
**Foreign Keys:** 3

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `transaction_ref` | character varying(100) | ❌ | - |
| `from_beneficiary_id` | character varying(50) | ✅ | - |
| `to_beneficiary_id` | character varying(50) | ✅ | - |
| `agent_id` | character varying(50) | ✅ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `fee` | numeric | ✅ | 0 |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `status` | character varying(50) | ❌ | 'pending'::character varying |
| `requires_2fa` | boolean | ✅ | true |
| `two_factor_auth_id` | uuid | ✅ | - |
| `initiated_at` | timestamp with time zone | ✅ | now() |
| `completed_at` | timestamp with time zone | ✅ | - |
| `metadata` | jsonb | ✅ | - |
| `failure_reason` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **ewallet_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX ewallet_transactions_pkey ON public.ewallet_transactions USING btree (id)
  ```

- **ewallet_transactions_transaction_ref_key**
  ```sql
  CREATE UNIQUE INDEX ewallet_transactions_transaction_ref_key ON public.ewallet_transactions USING btree (transaction_ref)
  ```

- **idx_ewallet_txn_from**
  ```sql
  CREATE INDEX idx_ewallet_txn_from ON public.ewallet_transactions USING btree (from_beneficiary_id)
  ```

- **idx_ewallet_txn_initiated**
  ```sql
  CREATE INDEX idx_ewallet_txn_initiated ON public.ewallet_transactions USING btree (initiated_at DESC)
  ```

- **idx_ewallet_txn_status**
  ```sql
  CREATE INDEX idx_ewallet_txn_status ON public.ewallet_transactions USING btree (status)
  ```

- **idx_ewallet_txn_to**
  ```sql
  CREATE INDEX idx_ewallet_txn_to ON public.ewallet_transactions USING btree (to_beneficiary_id)
  ```

- **idx_ewallet_txn_type**
  ```sql
  CREATE INDEX idx_ewallet_txn_type ON public.ewallet_transactions USING btree (transaction_type)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `from_beneficiary_id` | `beneficiaries.id` |
| `to_beneficiary_id` | `beneficiaries.id` |
| `two_factor_auth_id` | `two_factor_auth_logs.id` |

---

## exchange_rate_fetch_log

**Description:** Logs exchange rate fetch operations for rate limiting (max 2 per day)

**Columns:** 8  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `fetch_date` | date | ❌ | - |
| `fetch_time` | time without time zone | ❌ | - |
| `currencies_fetched` | integer | ✅ | 0 |
| `success` | boolean | ✅ | true |
| `error_message` | text | ✅ | - |
| `api_source` | character varying(100) | ✅ | 'exchangerate.host'::character varying |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **exchange_rate_fetch_log_pkey**
  ```sql
  CREATE UNIQUE INDEX exchange_rate_fetch_log_pkey ON public.exchange_rate_fetch_log USING btree (id)
  ```

- **idx_exchange_rate_fetch_log_date**
  ```sql
  CREATE INDEX idx_exchange_rate_fetch_log_date ON public.exchange_rate_fetch_log USING btree (fetch_date DESC)
  ```

- **idx_exchange_rate_fetch_log_success**
  ```sql
  CREATE INDEX idx_exchange_rate_fetch_log_success ON public.exchange_rate_fetch_log USING btree (fetch_date, success)
  ```

- **idx_exchange_rate_fetch_log_unique**
  ```sql
  CREATE UNIQUE INDEX idx_exchange_rate_fetch_log_unique ON public.exchange_rate_fetch_log USING btree (fetch_date, fetch_time)
  ```

- **idx_fetch_log_date**
  ```sql
  CREATE INDEX idx_fetch_log_date ON public.exchange_rate_fetch_log USING btree (fetch_date DESC)
  ```

- **idx_fetch_log_success**
  ```sql
  CREATE INDEX idx_fetch_log_success ON public.exchange_rate_fetch_log USING btree (success, fetch_date DESC)
  ```

- **unique_fetch_per_time**
  ```sql
  CREATE UNIQUE INDEX unique_fetch_per_time ON public.exchange_rate_fetch_log USING btree (fetch_date, fetch_time)
  ```

---

## exchange_rates

**Description:** Stores NAD exchange rates fetched from external APIs (fetched twice daily)

**Columns:** 9  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `base_currency` | character varying(3) | ❌ | 'NAD'::character varying |
| `target_currency` | character varying(3) | ❌ | - |
| `rate` | numeric | ❌ | - |
| `trend` | character varying(10) | ✅ | 'stable'::character varying |
| `source` | character varying(100) | ✅ | 'exchangerate.host'::character varying |
| `fetched_at` | timestamp with time zone | ✅ | now() |
| `created_at` | timestamp with time zone | ✅ | now() |
| `fetched_date` | date | ❌ | CURRENT_DATE |

### Indexes

- **exchange_rates_pkey**
  ```sql
  CREATE UNIQUE INDEX exchange_rates_pkey ON public.exchange_rates USING btree (id)
  ```

- **idx_exchange_rates_base_currency**
  ```sql
  CREATE INDEX idx_exchange_rates_base_currency ON public.exchange_rates USING btree (base_currency)
  ```

- **idx_exchange_rates_fetched_at**
  ```sql
  CREATE INDEX idx_exchange_rates_fetched_at ON public.exchange_rates USING btree (fetched_at DESC)
  ```

- **idx_exchange_rates_latest**
  ```sql
  CREATE INDEX idx_exchange_rates_latest ON public.exchange_rates USING btree (base_currency, target_currency, fetched_at DESC)
  ```

- **idx_exchange_rates_target_currency**
  ```sql
  CREATE INDEX idx_exchange_rates_target_currency ON public.exchange_rates USING btree (target_currency)
  ```

- **idx_exchange_rates_unique**
  ```sql
  CREATE UNIQUE INDEX idx_exchange_rates_unique ON public.exchange_rates USING btree (base_currency, target_currency, fetched_date)
  ```

- **unique_rate_per_fetch**
  ```sql
  CREATE UNIQUE INDEX unique_rate_per_fetch ON public.exchange_rates USING btree (base_currency, target_currency, fetched_at)
  ```

---

## feature_interest_surveys

**Description:** Surveys to gauge interest in new financial instruments

**Columns:** 12  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `survey_type` | character varying(50) | ❌ | - |
| `feature_name` | character varying(100) | ❌ | - |
| `interest_level` | character varying(50) | ✅ | - |
| `would_use` | boolean | ✅ | - |
| `concerns` | text | ✅ | - |
| `suggestions` | text | ✅ | - |
| `channel` | character varying(50) | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **feature_interest_surveys_pkey**
  ```sql
  CREATE UNIQUE INDEX feature_interest_surveys_pkey ON public.feature_interest_surveys USING btree (id)
  ```

- **idx_feature_interest_surveys_created_at**
  ```sql
  CREATE INDEX idx_feature_interest_surveys_created_at ON public.feature_interest_surveys USING btree (created_at)
  ```

- **idx_feature_interest_surveys_feature_name**
  ```sql
  CREATE INDEX idx_feature_interest_surveys_feature_name ON public.feature_interest_surveys USING btree (feature_name)
  ```

- **idx_feature_interest_surveys_survey_type**
  ```sql
  CREATE INDEX idx_feature_interest_surveys_survey_type ON public.feature_interest_surveys USING btree (survey_type)
  ```

- **idx_feature_interest_surveys_unique**
  ```sql
  CREATE UNIQUE INDEX idx_feature_interest_surveys_unique ON public.feature_interest_surveys USING btree (user_id, feature_name)
  ```

- **idx_feature_interest_surveys_user_id**
  ```sql
  CREATE INDEX idx_feature_interest_surveys_user_id ON public.feature_interest_surveys USING btree (user_id)
  ```

- **idx_feature_interest_surveys_would_use**
  ```sql
  CREATE INDEX idx_feature_interest_surveys_would_use ON public.feature_interest_surveys USING btree (would_use)
  ```

---

## feedback_analytics

**Description:** Daily analytics on feedback collection and feature interest

**Columns:** 12  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `date` | date | ❌ | - |
| `total_feedback_received` | integer | ✅ | 0 |
| `average_satisfaction_score` | numeric | ✅ | 0 |
| `feedback_response_rate` | numeric | ✅ | 0 |
| `feature_interest_savings` | numeric | ✅ | 0 |
| `feature_interest_credit` | numeric | ✅ | 0 |
| `feature_interest_recurring` | numeric | ✅ | 0 |
| `top_pain_points` | jsonb | ✅ | '[]'::jsonb |
| `top_suggestions` | jsonb | ✅ | '[]'::jsonb |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **feedback_analytics_date_key**
  ```sql
  CREATE UNIQUE INDEX feedback_analytics_date_key ON public.feedback_analytics USING btree (date)
  ```

- **feedback_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX feedback_analytics_pkey ON public.feedback_analytics USING btree (id)
  ```

- **idx_feedback_analytics_date**
  ```sql
  CREATE INDEX idx_feedback_analytics_date ON public.feedback_analytics USING btree (date)
  ```

---

## financial_literacy_modules

**Description:** GSMA DFL Toolkit modules covering 4 dimensions of financial literacy

**Columns:** 14  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('financial_literacy_modules_id_seq'::regclass) |
| `module_id` | character varying(100) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `category` | character varying(50) | ❌ | - |
| `difficulty` | character varying(20) | ❌ | - |
| `estimated_minutes` | integer | ❌ | - |
| `key_concepts` | ARRAY | ✅ | - |
| `learning_objectives` | ARRAY | ✅ | - |
| `content_sections` | jsonb | ❌ | - |
| `prerequisites` | ARRAY | ✅ | - |
| `bp_reward` | integer | ❌ | 50 |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **financial_literacy_modules_module_id_key**
  ```sql
  CREATE UNIQUE INDEX financial_literacy_modules_module_id_key ON public.financial_literacy_modules USING btree (module_id)
  ```

- **financial_literacy_modules_pkey**
  ```sql
  CREATE UNIQUE INDEX financial_literacy_modules_pkey ON public.financial_literacy_modules USING btree (id)
  ```

- **idx_modules_category**
  ```sql
  CREATE INDEX idx_modules_category ON public.financial_literacy_modules USING btree (category)
  ```

- **idx_modules_difficulty**
  ```sql
  CREATE INDEX idx_modules_difficulty ON public.financial_literacy_modules USING btree (difficulty)
  ```

- **idx_modules_module_id**
  ```sql
  CREATE INDEX idx_modules_module_id ON public.financial_literacy_modules USING btree (module_id)
  ```

---

## fineract_accounts

**Description:** Map Buffr users to Fineract clients and wallets. fineract_account_id is for trust account (savings account), fineract_wallet_id is for beneficiary wallets (fineract-wallets module)

**Columns:** 12  
**Indexes:** 8  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | uuid | ❌ | - |
| `fineract_client_id` | bigint | ❌ | - |
| `fineract_account_id` | bigint | ❌ | - |
| `account_type` | character varying(50) | ❌ | - |
| `account_no` | character varying(100) | ✅ | - |
| `status` | character varying(50) | ❌ | 'active'::character varying |
| `synced_at` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |
| `fineract_wallet_id` | bigint | ✅ | - |
| `wallet_no` | character varying(100) | ✅ | - |

### Indexes

- **fineract_accounts_pkey**
  ```sql
  CREATE UNIQUE INDEX fineract_accounts_pkey ON public.fineract_accounts USING btree (id)
  ```

- **fineract_accounts_user_id_account_type_key**
  ```sql
  CREATE UNIQUE INDEX fineract_accounts_user_id_account_type_key ON public.fineract_accounts USING btree (user_id, account_type)
  ```

- **idx_fineract_accounts_account_id**
  ```sql
  CREATE INDEX idx_fineract_accounts_account_id ON public.fineract_accounts USING btree (fineract_account_id)
  ```

- **idx_fineract_accounts_account_no**
  ```sql
  CREATE INDEX idx_fineract_accounts_account_no ON public.fineract_accounts USING btree (account_no)
  ```

- **idx_fineract_accounts_client_id**
  ```sql
  CREATE INDEX idx_fineract_accounts_client_id ON public.fineract_accounts USING btree (fineract_client_id)
  ```

- **idx_fineract_accounts_user_id**
  ```sql
  CREATE INDEX idx_fineract_accounts_user_id ON public.fineract_accounts USING btree (user_id)
  ```

- **idx_fineract_accounts_wallet_id**
  ```sql
  CREATE INDEX idx_fineract_accounts_wallet_id ON public.fineract_accounts USING btree (fineract_wallet_id)
  ```

- **idx_fineract_accounts_wallet_no**
  ```sql
  CREATE INDEX idx_fineract_accounts_wallet_no ON public.fineract_accounts USING btree (wallet_no)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## fineract_sync_logs

**Description:** Track synchronization between Buffr application and Fineract core banking system

**Columns:** 12  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `entity_type` | character varying(50) | ❌ | - |
| `entity_id` | uuid | ❌ | - |
| `fineract_id` | bigint | ❌ | - |
| `sync_status` | character varying(50) | ❌ | 'pending'::character varying |
| `sync_error` | text | ✅ | - |
| `synced_at` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |
| `operation_type` | character varying(50) | ✅ | - |
| `request_payload` | jsonb | ✅ | - |
| `response_payload` | jsonb | ✅ | - |

### Indexes

- **fineract_sync_logs_entity_type_entity_id_key**
  ```sql
  CREATE UNIQUE INDEX fineract_sync_logs_entity_type_entity_id_key ON public.fineract_sync_logs USING btree (entity_type, entity_id)
  ```

- **fineract_sync_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX fineract_sync_logs_pkey ON public.fineract_sync_logs USING btree (id)
  ```

- **idx_fineract_sync_logs_entity**
  ```sql
  CREATE INDEX idx_fineract_sync_logs_entity ON public.fineract_sync_logs USING btree (entity_type, entity_id)
  ```

- **idx_fineract_sync_logs_fineract_id**
  ```sql
  CREATE INDEX idx_fineract_sync_logs_fineract_id ON public.fineract_sync_logs USING btree (fineract_id)
  ```

- **idx_fineract_sync_logs_operation_type**
  ```sql
  CREATE INDEX idx_fineract_sync_logs_operation_type ON public.fineract_sync_logs USING btree (operation_type) WHERE (operation_type IS NOT NULL)
  ```

- **idx_fineract_sync_logs_status**
  ```sql
  CREATE INDEX idx_fineract_sync_logs_status ON public.fineract_sync_logs USING btree (sync_status)
  ```

- **idx_fineract_sync_logs_synced_at**
  ```sql
  CREATE INDEX idx_fineract_sync_logs_synced_at ON public.fineract_sync_logs USING btree (synced_at DESC)
  ```

---

## fineract_vouchers

**Description:** Map Buffr vouchers to Fineract vouchers (fineract-voucher module)

**Columns:** 8  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `voucher_id` | uuid | ❌ | - |
| `fineract_voucher_id` | bigint | ❌ | - |
| `voucher_code` | character varying(100) | ❌ | - |
| `status` | character varying(50) | ❌ | 'ISSUED'::character varying |
| `synced_at` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **fineract_vouchers_pkey**
  ```sql
  CREATE UNIQUE INDEX fineract_vouchers_pkey ON public.fineract_vouchers USING btree (id)
  ```

- **fineract_vouchers_voucher_id_key**
  ```sql
  CREATE UNIQUE INDEX fineract_vouchers_voucher_id_key ON public.fineract_vouchers USING btree (voucher_id)
  ```

- **idx_fineract_vouchers_fineract_voucher_id**
  ```sql
  CREATE INDEX idx_fineract_vouchers_fineract_voucher_id ON public.fineract_vouchers USING btree (fineract_voucher_id)
  ```

- **idx_fineract_vouchers_status**
  ```sql
  CREATE INDEX idx_fineract_vouchers_status ON public.fineract_vouchers USING btree (status)
  ```

- **idx_fineract_vouchers_voucher_code**
  ```sql
  CREATE INDEX idx_fineract_vouchers_voucher_code ON public.fineract_vouchers USING btree (voucher_code)
  ```

- **idx_fineract_vouchers_voucher_id**
  ```sql
  CREATE INDEX idx_fineract_vouchers_voucher_id ON public.fineract_vouchers USING btree (voucher_id)
  ```

---

## fraud_checks

**Columns:** 16  
**Indexes:** 5  
**Foreign Keys:** 3

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `session_id` | uuid | ✅ | - |
| `transaction_id` | uuid | ✅ | - |
| `user_id` | uuid | ✅ | - |
| `fraud_probability` | numeric | ❌ | - |
| `is_fraud` | boolean | ❌ | - |
| `risk_level` | text | ❌ | - |
| `logistic_score` | numeric | ✅ | - |
| `neural_network_score` | numeric | ✅ | - |
| `random_forest_score` | numeric | ✅ | - |
| `gmm_anomaly_score` | numeric | ✅ | - |
| `recommended_action` | text | ✅ | - |
| `confidence` | numeric | ✅ | 0.95 |
| `checked_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `model_version` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **fraud_checks_pkey**
  ```sql
  CREATE UNIQUE INDEX fraud_checks_pkey ON public.fraud_checks USING btree (id)
  ```

- **idx_fraud_checks_is_fraud**
  ```sql
  CREATE INDEX idx_fraud_checks_is_fraud ON public.fraud_checks USING btree (is_fraud, checked_at DESC)
  ```

- **idx_fraud_checks_risk_level**
  ```sql
  CREATE INDEX idx_fraud_checks_risk_level ON public.fraud_checks USING btree (risk_level, checked_at DESC)
  ```

- **idx_fraud_checks_transaction_id**
  ```sql
  CREATE INDEX idx_fraud_checks_transaction_id ON public.fraud_checks USING btree (transaction_id)
  ```

- **idx_fraud_checks_user_id**
  ```sql
  CREATE INDEX idx_fraud_checks_user_id ON public.fraud_checks USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `session_id` | `sessions.id` |
| `transaction_id` | `transactions.id` |
| `user_id` | `users.id` |

---

## fraud_detection_summary

**Columns:** 6  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `check_date` | date | ✅ | - |
| `total_checks` | bigint | ✅ | - |
| `fraud_detected` | bigint | ✅ | - |
| `high_risk_count` | bigint | ✅ | - |
| `avg_fraud_probability` | numeric | ✅ | - |
| `avg_confidence` | numeric | ✅ | - |
---

## gamification_stats

**Description:** Summary of user gamification statistics

**Columns:** 10  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('gamification_stats_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `total_achievements` | integer | ❌ | 0 |
| `total_challenges_completed` | integer | ❌ | 0 |
| `total_badges` | integer | ❌ | 0 |
| `highest_streak` | integer | ❌ | 0 |
| `leaderboard_appearances` | integer | ❌ | 0 |
| `total_gamification_bp` | integer | ❌ | 0 |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **gamification_stats_pkey**
  ```sql
  CREATE UNIQUE INDEX gamification_stats_pkey ON public.gamification_stats USING btree (id)
  ```

- **gamification_stats_user_id_key**
  ```sql
  CREATE UNIQUE INDEX gamification_stats_user_id_key ON public.gamification_stats USING btree (user_id)
  ```

- **idx_gamification_stats_achievements**
  ```sql
  CREATE INDEX idx_gamification_stats_achievements ON public.gamification_stats USING btree (total_achievements DESC)
  ```

- **idx_gamification_stats_challenges**
  ```sql
  CREATE INDEX idx_gamification_stats_challenges ON public.gamification_stats USING btree (total_challenges_completed DESC)
  ```

- **idx_gamification_stats_user_id**
  ```sql
  CREATE INDEX idx_gamification_stats_user_id ON public.gamification_stats USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## geographic_analytics

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `region` | character varying(100) | ✅ | - |
| `date` | date | ❌ | - |
| `transaction_count` | integer | ❌ | 0 |
| `total_volume` | numeric | ❌ | 0 |
| `unique_users` | integer | ❌ | 0 |
| `cash_out_ratio` | numeric | ✅ | - |
| `digital_payment_ratio` | numeric | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **geographic_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX geographic_analytics_pkey ON public.geographic_analytics USING btree (id)
  ```

- **geographic_analytics_region_date_key**
  ```sql
  CREATE UNIQUE INDEX geographic_analytics_region_date_key ON public.geographic_analytics USING btree (region, date)
  ```

- **idx_geographic_analytics_date**
  ```sql
  CREATE INDEX idx_geographic_analytics_date ON public.geographic_analytics USING btree (date)
  ```

- **idx_geographic_analytics_region_date**
  ```sql
  CREATE INDEX idx_geographic_analytics_region_date ON public.geographic_analytics USING btree (region, date)
  ```

---

## group_members

**Columns:** 6  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `group_id` | uuid | ✅ | - |
| `user_id` | character varying(255) | ❌ | - |
| `contribution` | numeric | ✅ | 0.00 |
| `is_owner` | boolean | ✅ | false |
| `joined_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **group_members_group_id_user_id_key**
  ```sql
  CREATE UNIQUE INDEX group_members_group_id_user_id_key ON public.group_members USING btree (group_id, user_id)
  ```

- **group_members_pkey**
  ```sql
  CREATE UNIQUE INDEX group_members_pkey ON public.group_members USING btree (id)
  ```

- **idx_group_members_group_id**
  ```sql
  CREATE INDEX idx_group_members_group_id ON public.group_members USING btree (group_id)
  ```

- **idx_group_members_user_id**
  ```sql
  CREATE INDEX idx_group_members_user_id ON public.group_members USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `group_id` | `groups.id` |

---

## groups

**Columns:** 13  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `owner_id` | character varying(255) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `description` | text | ✅ | - |
| `target_amount` | numeric | ✅ | - |
| `current_amount` | numeric | ✅ | 0.00 |
| `currency` | character varying(10) | ✅ | 'N$'::character varying |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |
| `type` | character varying(50) | ✅ | 'savings'::character varying |
| `avatar` | text | ✅ | - |
| `is_active` | boolean | ✅ | true |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **groups_pkey**
  ```sql
  CREATE UNIQUE INDEX groups_pkey ON public.groups USING btree (id)
  ```

- **idx_groups_is_active**
  ```sql
  CREATE INDEX idx_groups_is_active ON public.groups USING btree (is_active) WHERE (is_active = true)
  ```

- **idx_groups_owner_id**
  ```sql
  CREATE INDEX idx_groups_owner_id ON public.groups USING btree (owner_id)
  ```

---

## incident_metrics

**Columns:** 23  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `report_period` | date | ❌ | - |
| `period_type` | character varying(20) | ❌ | - |
| `total_incidents` | integer | ✅ | 0 |
| `critical_incidents` | integer | ✅ | 0 |
| `high_incidents` | integer | ✅ | 0 |
| `medium_incidents` | integer | ✅ | 0 |
| `low_incidents` | integer | ✅ | 0 |
| `cyberattack_count` | integer | ✅ | 0 |
| `data_breach_count` | integer | ✅ | 0 |
| `system_failure_count` | integer | ✅ | 0 |
| `fraud_count` | integer | ✅ | 0 |
| `unauthorized_access_count` | integer | ✅ | 0 |
| `incidents_resolved` | integer | ✅ | 0 |
| `avg_resolution_hours` | numeric | ✅ | - |
| `total_financial_loss` | numeric | ✅ | 0.00 |
| `total_customers_affected` | integer | ✅ | 0 |
| `total_availability_loss_hours` | numeric | ✅ | 0 |
| `notifications_sent_on_time` | integer | ✅ | 0 |
| `notifications_late` | integer | ✅ | 0 |
| `impact_assessments_on_time` | integer | ✅ | 0 |
| `impact_assessments_late` | integer | ✅ | 0 |
| `generated_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_incident_metrics_period**
  ```sql
  CREATE INDEX idx_incident_metrics_period ON public.incident_metrics USING btree (report_period DESC)
  ```

- **idx_incident_metrics_type**
  ```sql
  CREATE INDEX idx_incident_metrics_type ON public.incident_metrics USING btree (period_type)
  ```

- **incident_metrics_pkey**
  ```sql
  CREATE UNIQUE INDEX incident_metrics_pkey ON public.incident_metrics USING btree (id)
  ```

- **incident_metrics_report_period_period_type_key**
  ```sql
  CREATE UNIQUE INDEX incident_metrics_report_period_period_type_key ON public.incident_metrics USING btree (report_period, period_type)
  ```

---

## incident_notifications

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `incident_id` | uuid | ✅ | - |
| `notification_type` | character varying(50) | ❌ | - |
| `recipient_type` | character varying(50) | ❌ | - |
| `recipient_email` | character varying(255) | ✅ | - |
| `subject` | character varying(255) | ❌ | - |
| `content` | text | ❌ | - |
| `sent_at` | timestamp without time zone | ✅ | - |
| `delivery_status` | character varying(20) | ✅ | 'pending'::character varying |
| `reference_number` | character varying(100) | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_incident_notifications_incident_id**
  ```sql
  CREATE INDEX idx_incident_notifications_incident_id ON public.incident_notifications USING btree (incident_id)
  ```

- **idx_incident_notifications_status**
  ```sql
  CREATE INDEX idx_incident_notifications_status ON public.incident_notifications USING btree (delivery_status)
  ```

- **idx_incident_notifications_type**
  ```sql
  CREATE INDEX idx_incident_notifications_type ON public.incident_notifications USING btree (notification_type)
  ```

- **incident_notifications_pkey**
  ```sql
  CREATE UNIQUE INDEX incident_notifications_pkey ON public.incident_notifications USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `incident_id` | `security_incidents.id` |

---

## incident_updates

**Columns:** 9  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `incident_id` | uuid | ✅ | - |
| `update_type` | character varying(50) | ❌ | - |
| `previous_status` | character varying(30) | ✅ | - |
| `new_status` | character varying(30) | ✅ | - |
| `content` | text | ❌ | - |
| `attachments` | jsonb | ✅ | - |
| `created_by` | character varying(255) | ❌ | - |
| `created_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_incident_updates_created_at**
  ```sql
  CREATE INDEX idx_incident_updates_created_at ON public.incident_updates USING btree (created_at DESC)
  ```

- **idx_incident_updates_incident_id**
  ```sql
  CREATE INDEX idx_incident_updates_incident_id ON public.incident_updates USING btree (incident_id)
  ```

- **incident_updates_pkey**
  ```sql
  CREATE UNIQUE INDEX incident_updates_pkey ON public.incident_updates USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `incident_id` | `security_incidents.id` |

---

## insurance_products

**Description:** Insurance products catalog for dynamic premium pricing

**Columns:** 10  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `name` | character varying(255) | ❌ | - |
| `description` | text | ✅ | - |
| `premium` | numeric | ❌ | - |
| `coverage_amount` | numeric | ✅ | - |
| `coverage_type` | character varying(100) | ✅ | - |
| `duration_months` | integer | ✅ | - |
| `is_active` | boolean | ✅ | true |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_insurance_products_active**
  ```sql
  CREATE INDEX idx_insurance_products_active ON public.insurance_products USING btree (is_active) WHERE (is_active = true)
  ```

- **idx_insurance_products_type**
  ```sql
  CREATE INDEX idx_insurance_products_type ON public.insurance_products USING btree (coverage_type)
  ```

- **insurance_products_pkey**
  ```sql
  CREATE UNIQUE INDEX insurance_products_pkey ON public.insurance_products USING btree (id)
  ```

---

## leaderboard_entries

**Description:** Individual leaderboard entries for each user

**Columns:** 9  
**Indexes:** 6  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('leaderboard_entries_id_seq'::regclass) |
| `leaderboard_id` | character varying(100) | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `rank` | integer | ❌ | - |
| `display_name` | character varying(255) | ❌ | - |
| `score` | numeric | ❌ | - |
| `badge_icon` | character varying(50) | ✅ | - |
| `rank_tier` | character varying(10) | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_leaderboard_entries_leaderboard_id**
  ```sql
  CREATE INDEX idx_leaderboard_entries_leaderboard_id ON public.leaderboard_entries USING btree (leaderboard_id)
  ```

- **idx_leaderboard_entries_rank**
  ```sql
  CREATE INDEX idx_leaderboard_entries_rank ON public.leaderboard_entries USING btree (rank)
  ```

- **idx_leaderboard_entries_score**
  ```sql
  CREATE INDEX idx_leaderboard_entries_score ON public.leaderboard_entries USING btree (score DESC)
  ```

- **idx_leaderboard_entries_user_id**
  ```sql
  CREATE INDEX idx_leaderboard_entries_user_id ON public.leaderboard_entries USING btree (user_id)
  ```

- **leaderboard_entries_pkey**
  ```sql
  CREATE UNIQUE INDEX leaderboard_entries_pkey ON public.leaderboard_entries USING btree (id)
  ```

- **unique_leaderboard_entry**
  ```sql
  CREATE UNIQUE INDEX unique_leaderboard_entry ON public.leaderboard_entries USING btree (leaderboard_id, user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `leaderboard_id` | `leaderboards.leaderboard_id` |
| `user_id` | `users.id` |

---

## leaderboard_incentives

**Columns:** 9  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `ranking_id` | uuid | ❌ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `incentive_type` | character varying(50) | ❌ | - |
| `status` | character varying(50) | ✅ | 'pending'::character varying |
| `paid_at` | timestamp with time zone | ✅ | - |
| `payment_reference` | character varying(255) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_leaderboard_incentives_ranking**
  ```sql
  CREATE INDEX idx_leaderboard_incentives_ranking ON public.leaderboard_incentives USING btree (ranking_id)
  ```

- **idx_leaderboard_incentives_status**
  ```sql
  CREATE INDEX idx_leaderboard_incentives_status ON public.leaderboard_incentives USING btree (status)
  ```

- **leaderboard_incentives_pkey**
  ```sql
  CREATE UNIQUE INDEX leaderboard_incentives_pkey ON public.leaderboard_incentives USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `ranking_id` | `leaderboard_rankings.id` |

---

## leaderboard_rankings

**Columns:** 13  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `category` | character varying(50) | ❌ | - |
| `period` | character varying(20) | ❌ | - |
| `participant_id` | character varying(255) | ❌ | - |
| `participant_name` | character varying(255) | ❌ | - |
| `rank` | integer | ❌ | - |
| `metrics` | jsonb | ❌ | - |
| `total_score` | numeric | ❌ | - |
| `incentive_amount` | numeric | ✅ | - |
| `incentive_currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `incentive_type` | character varying(50) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_leaderboard_rankings_category**
  ```sql
  CREATE INDEX idx_leaderboard_rankings_category ON public.leaderboard_rankings USING btree (category)
  ```

- **idx_leaderboard_rankings_participant**
  ```sql
  CREATE INDEX idx_leaderboard_rankings_participant ON public.leaderboard_rankings USING btree (participant_id)
  ```

- **idx_leaderboard_rankings_period**
  ```sql
  CREATE INDEX idx_leaderboard_rankings_period ON public.leaderboard_rankings USING btree (period)
  ```

- **idx_leaderboard_rankings_rank**
  ```sql
  CREATE INDEX idx_leaderboard_rankings_rank ON public.leaderboard_rankings USING btree (category, period, rank)
  ```

- **leaderboard_rankings_category_period_participant_id_key**
  ```sql
  CREATE UNIQUE INDEX leaderboard_rankings_category_period_participant_id_key ON public.leaderboard_rankings USING btree (category, period, participant_id)
  ```

- **leaderboard_rankings_pkey**
  ```sql
  CREATE UNIQUE INDEX leaderboard_rankings_pkey ON public.leaderboard_rankings USING btree (id)
  ```

---

## leaderboards

**Description:** 4 global leaderboards (BP all-time, BP monthly, transactions, savings)

**Columns:** 9  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('leaderboards_id_seq'::regclass) |
| `leaderboard_id` | character varying(100) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ✅ | - |
| `metric` | character varying(50) | ❌ | - |
| `period` | character varying(20) | ❌ | - |
| `entries` | jsonb | ❌ | '[]'::jsonb |
| `last_updated` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_leaderboards_leaderboard_id**
  ```sql
  CREATE INDEX idx_leaderboards_leaderboard_id ON public.leaderboards USING btree (leaderboard_id)
  ```

- **idx_leaderboards_metric**
  ```sql
  CREATE INDEX idx_leaderboards_metric ON public.leaderboards USING btree (metric)
  ```

- **idx_leaderboards_period**
  ```sql
  CREATE INDEX idx_leaderboards_period ON public.leaderboards USING btree (period)
  ```

- **leaderboards_leaderboard_id_key**
  ```sql
  CREATE UNIQUE INDEX leaderboards_leaderboard_id_key ON public.leaderboards USING btree (leaderboard_id)
  ```

- **leaderboards_pkey**
  ```sql
  CREATE UNIQUE INDEX leaderboards_pkey ON public.leaderboards USING btree (id)
  ```

---

## learning_paths

**Description:** Personalized learning paths with multiple modules

**Columns:** 16  
**Indexes:** 6  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('learning_paths_id_seq'::regclass) |
| `path_id` | character varying(100) | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ✅ | - |
| `difficulty` | character varying(20) | ❌ | - |
| `focus_category` | character varying(50) | ✅ | - |
| `module_ids` | ARRAY | ❌ | - |
| `modules_completed` | integer | ❌ | 0 |
| `total_modules` | integer | ❌ | - |
| `progress_percentage` | integer | ❌ | 0 |
| `status` | character varying(20) | ❌ | 'active'::character varying |
| `estimated_completion_hours` | integer | ✅ | - |
| `started_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `completed_at` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_learning_paths_category**
  ```sql
  CREATE INDEX idx_learning_paths_category ON public.learning_paths USING btree (focus_category)
  ```

- **idx_learning_paths_path_id**
  ```sql
  CREATE INDEX idx_learning_paths_path_id ON public.learning_paths USING btree (path_id)
  ```

- **idx_learning_paths_status**
  ```sql
  CREATE INDEX idx_learning_paths_status ON public.learning_paths USING btree (status)
  ```

- **idx_learning_paths_user_id**
  ```sql
  CREATE INDEX idx_learning_paths_user_id ON public.learning_paths USING btree (user_id)
  ```

- **learning_paths_path_id_key**
  ```sql
  CREATE UNIQUE INDEX learning_paths_path_id_key ON public.learning_paths USING btree (path_id)
  ```

- **learning_paths_pkey**
  ```sql
  CREATE UNIQUE INDEX learning_paths_pkey ON public.learning_paths USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## learning_progress

**Columns:** 13  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ✅ | - |
| `module_id` | text | ❌ | - |
| `module_name` | text | ✅ | - |
| `module_category` | text | ✅ | - |
| `status` | text | ❌ | - |
| `progress_percentage` | integer | ✅ | - |
| `quiz_score` | numeric | ✅ | - |
| `time_spent` | integer | ✅ | - |
| `started_at` | timestamp with time zone | ✅ | - |
| `completed_at` | timestamp with time zone | ✅ | - |
| `last_accessed_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_learning_progress_module**
  ```sql
  CREATE INDEX idx_learning_progress_module ON public.learning_progress USING btree (module_id)
  ```

- **idx_learning_progress_status**
  ```sql
  CREATE INDEX idx_learning_progress_status ON public.learning_progress USING btree (status)
  ```

- **idx_learning_progress_user_id**
  ```sql
  CREATE INDEX idx_learning_progress_user_id ON public.learning_progress USING btree (user_id, last_accessed_at DESC)
  ```

- **learning_progress_pkey**
  ```sql
  CREATE UNIQUE INDEX learning_progress_pkey ON public.learning_progress USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## learning_recommendations

**Columns:** 10  
**Indexes:** 2  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `session_id` | uuid | ✅ | - |
| `user_id` | uuid | ✅ | - |
| `primary_segment` | text | ✅ | - |
| `segment_distribution` | jsonb | ✅ | '{}'::jsonb |
| `recommended_modules` | jsonb | ✅ | '[]'::jsonb |
| `weak_areas` | jsonb | ✅ | '[]'::jsonb |
| `reasoning` | text | ✅ | - |
| `generated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_learning_recommendations_user_id**
  ```sql
  CREATE INDEX idx_learning_recommendations_user_id ON public.learning_recommendations USING btree (user_id, generated_at DESC)
  ```

- **learning_recommendations_pkey**
  ```sql
  CREATE UNIQUE INDEX learning_recommendations_pkey ON public.learning_recommendations USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `session_id` | `sessions.id` |
| `user_id` | `users.id` |

---

## level_up_events

**Description:** Record of level progression events

**Columns:** 7  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('level_up_events_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `old_level` | integer | ❌ | - |
| `new_level` | integer | ❌ | - |
| `bp_earned` | integer | ❌ | - |
| `rewards_unlocked` | ARRAY | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_level_up_events_created_at**
  ```sql
  CREATE INDEX idx_level_up_events_created_at ON public.level_up_events USING btree (created_at DESC)
  ```

- **idx_level_up_events_user_id**
  ```sql
  CREATE INDEX idx_level_up_events_user_id ON public.level_up_events USING btree (user_id)
  ```

- **level_up_events_pkey**
  ```sql
  CREATE UNIQUE INDEX level_up_events_pkey ON public.level_up_events USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## levels

**Columns:** 9  
**Indexes:** 1  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `level` | integer | ❌ | - |
| `name` | character varying(100) | ❌ | - |
| `icon` | character varying(100) | ❌ | - |
| `color` | character varying(50) | ❌ | - |
| `xp_required` | integer | ❌ | - |
| `points_bonus` | integer | ✅ | 0 |
| `features_unlocked` | jsonb | ✅ | '[]'::jsonb |
| `points_multiplier` | numeric | ✅ | 1.00 |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **levels_pkey**
  ```sql
  CREATE UNIQUE INDEX levels_pkey ON public.levels USING btree (level)
  ```

---

## liquidity_recommendations

**Columns:** 10  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `agent_id` | uuid | ❌ | - |
| `recommendation_type` | character varying(50) | ❌ | - |
| `priority` | character varying(50) | ❌ | - |
| `details` | text | ❌ | - |
| `estimated_impact` | text | ✅ | - |
| `demand_forecast` | jsonb | ✅ | - |
| `agent_action` | character varying(50) | ✅ | - |
| `action_timestamp` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_liquidity_recommendations_action**
  ```sql
  CREATE INDEX idx_liquidity_recommendations_action ON public.liquidity_recommendations USING btree (agent_action)
  ```

- **idx_liquidity_recommendations_agent**
  ```sql
  CREATE INDEX idx_liquidity_recommendations_agent ON public.liquidity_recommendations USING btree (agent_id)
  ```

- **idx_liquidity_recommendations_priority**
  ```sql
  CREATE INDEX idx_liquidity_recommendations_priority ON public.liquidity_recommendations USING btree (priority)
  ```

- **idx_liquidity_recommendations_type**
  ```sql
  CREATE INDEX idx_liquidity_recommendations_type ON public.liquidity_recommendations USING btree (recommendation_type)
  ```

- **liquidity_recommendations_pkey**
  ```sql
  CREATE UNIQUE INDEX liquidity_recommendations_pkey ON public.liquidity_recommendations USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `agent_id` | `agents.id` |

---

## literacy_certificates

**Description:** Certificates issued upon module completion

**Columns:** 11  
**Indexes:** 7  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('literacy_certificates_id_seq'::regclass) |
| `certificate_id` | character varying(100) | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `module_id` | character varying(100) | ❌ | - |
| `module_title` | character varying(255) | ❌ | - |
| `category` | character varying(50) | ❌ | - |
| `difficulty` | character varying(20) | ❌ | - |
| `score` | integer | ❌ | - |
| `issued_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `expiry_date` | timestamp without time zone | ✅ | - |
| `verification_code` | character varying(100) | ❌ | - |

### Indexes

- **idx_certificates_certificate_id**
  ```sql
  CREATE INDEX idx_certificates_certificate_id ON public.literacy_certificates USING btree (certificate_id)
  ```

- **idx_certificates_module_id**
  ```sql
  CREATE INDEX idx_certificates_module_id ON public.literacy_certificates USING btree (module_id)
  ```

- **idx_certificates_user_id**
  ```sql
  CREATE INDEX idx_certificates_user_id ON public.literacy_certificates USING btree (user_id)
  ```

- **idx_certificates_verification_code**
  ```sql
  CREATE INDEX idx_certificates_verification_code ON public.literacy_certificates USING btree (verification_code)
  ```

- **literacy_certificates_certificate_id_key**
  ```sql
  CREATE UNIQUE INDEX literacy_certificates_certificate_id_key ON public.literacy_certificates USING btree (certificate_id)
  ```

- **literacy_certificates_pkey**
  ```sql
  CREATE UNIQUE INDEX literacy_certificates_pkey ON public.literacy_certificates USING btree (id)
  ```

- **literacy_certificates_verification_code_key**
  ```sql
  CREATE UNIQUE INDEX literacy_certificates_verification_code_key ON public.literacy_certificates USING btree (verification_code)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `module_id` | `financial_literacy_modules.module_id` |
| `user_id` | `users.id` |

---

## loan_applications

**Columns:** 12  
**Indexes:** 3  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `merchant_id` | uuid | ✅ | - |
| `credit_assessment_id` | uuid | ✅ | - |
| `loan_amount_requested` | numeric | ❌ | - |
| `loan_amount_approved` | numeric | ✅ | - |
| `interest_rate` | numeric | ✅ | - |
| `term_months` | integer | ✅ | - |
| `status` | text | ❌ | - |
| `applied_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `approved_at` | timestamp with time zone | ✅ | - |
| `disbursed_at` | timestamp with time zone | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_loan_applications_merchant_id**
  ```sql
  CREATE INDEX idx_loan_applications_merchant_id ON public.loan_applications USING btree (merchant_id, applied_at DESC)
  ```

- **idx_loan_applications_status**
  ```sql
  CREATE INDEX idx_loan_applications_status ON public.loan_applications USING btree (status)
  ```

- **loan_applications_pkey**
  ```sql
  CREATE UNIQUE INDEX loan_applications_pkey ON public.loan_applications USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `credit_assessment_id` | `credit_assessments.id` |
| `merchant_id` | `merchants.id` |

---

## loan_revenue

**Description:** Revenue from loan origination fees and interest

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('loan_revenue_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `loan_id` | character varying(255) | ❌ | - |
| `revenue_type` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `loan_amount` | numeric | ❌ | - |
| `apr` | numeric | ❌ | - |
| `term_months` | integer | ❌ | - |
| `description` | text | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_loan_revenue_loan_id**
  ```sql
  CREATE INDEX idx_loan_revenue_loan_id ON public.loan_revenue USING btree (loan_id)
  ```

- **idx_loan_revenue_type**
  ```sql
  CREATE INDEX idx_loan_revenue_type ON public.loan_revenue USING btree (revenue_type)
  ```

- **idx_loan_revenue_user_id**
  ```sql
  CREATE INDEX idx_loan_revenue_user_id ON public.loan_revenue USING btree (user_id)
  ```

- **loan_revenue_pkey**
  ```sql
  CREATE UNIQUE INDEX loan_revenue_pkey ON public.loan_revenue USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## merchant_analytics

**Columns:** 12  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `merchant_id` | uuid | ✅ | - |
| `merchant_name` | character varying(255) | ✅ | - |
| `date` | date | ❌ | - |
| `transaction_count` | integer | ❌ | 0 |
| `total_volume` | numeric | ❌ | 0 |
| `average_transaction_amount` | numeric | ✅ | - |
| `unique_customers` | integer | ❌ | 0 |
| `payment_method_breakdown` | jsonb | ✅ | - |
| `peak_hours` | jsonb | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_merchant_analytics_date**
  ```sql
  CREATE INDEX idx_merchant_analytics_date ON public.merchant_analytics USING btree (date)
  ```

- **idx_merchant_analytics_merchant_date**
  ```sql
  CREATE INDEX idx_merchant_analytics_merchant_date ON public.merchant_analytics USING btree (merchant_id, date)
  ```

- **idx_merchant_analytics_name**
  ```sql
  CREATE INDEX idx_merchant_analytics_name ON public.merchant_analytics USING btree (merchant_name)
  ```

- **merchant_analytics_merchant_id_date_key**
  ```sql
  CREATE UNIQUE INDEX merchant_analytics_merchant_id_date_key ON public.merchant_analytics USING btree (merchant_id, date)
  ```

- **merchant_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX merchant_analytics_pkey ON public.merchant_analytics USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `merchant_id` | `merchants.id` |

---

## merchant_loan_summary

**Columns:** 10  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `merchant_id` | uuid | ✅ | - |
| `external_id` | text | ✅ | - |
| `business_name` | text | ✅ | - |
| `latest_credit_score` | integer | ✅ | - |
| `latest_credit_tier` | text | ✅ | - |
| `total_applications` | bigint | ✅ | - |
| `approved_count` | bigint | ✅ | - |
| `declined_count` | bigint | ✅ | - |
| `defaulted_count` | bigint | ✅ | - |
| `total_approved_amount` | numeric | ✅ | - |
---

## merchant_onboarding

**Columns:** 15  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `onboarding_id` | character varying(50) | ❌ | - |
| `business_name` | character varying(255) | ❌ | - |
| `business_type` | character varying(50) | ❌ | - |
| `location` | jsonb | ❌ | - |
| `contact` | jsonb | ❌ | - |
| `documents` | jsonb | ✅ | - |
| `status` | character varying(50) | ✅ | 'document_verification'::character varying |
| `progress` | integer | ✅ | 0 |
| `current_step` | character varying(100) | ✅ | - |
| `completed_steps` | ARRAY | ✅ | - |
| `pending_steps` | ARRAY | ✅ | - |
| `estimated_completion` | date | ✅ | - |
| `issues` | jsonb | ✅ | '[]'::jsonb |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_merchant_onboarding_business_type**
  ```sql
  CREATE INDEX idx_merchant_onboarding_business_type ON public.merchant_onboarding USING btree (business_type)
  ```

- **idx_merchant_onboarding_created**
  ```sql
  CREATE INDEX idx_merchant_onboarding_created ON public.merchant_onboarding USING btree (created_at DESC)
  ```

- **idx_merchant_onboarding_status**
  ```sql
  CREATE INDEX idx_merchant_onboarding_status ON public.merchant_onboarding USING btree (status)
  ```

- **merchant_onboarding_pkey**
  ```sql
  CREATE UNIQUE INDEX merchant_onboarding_pkey ON public.merchant_onboarding USING btree (onboarding_id)
  ```

---

## merchants

**Columns:** 15  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `external_id` | text | ❌ | - |
| `user_id` | uuid | ✅ | - |
| `business_name` | text | ❌ | - |
| `business_type` | text | ✅ | - |
| `merchant_category_code` | text | ✅ | - |
| `business_registration_number` | text | ✅ | - |
| `business_age_months` | integer | ✅ | - |
| `average_monthly_revenue` | numeric | ✅ | - |
| `location_city` | text | ✅ | - |
| `location_latitude` | numeric | ✅ | - |
| `location_longitude` | numeric | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_merchants_external_id**
  ```sql
  CREATE INDEX idx_merchants_external_id ON public.merchants USING btree (external_id)
  ```

- **idx_merchants_mcc**
  ```sql
  CREATE INDEX idx_merchants_mcc ON public.merchants USING btree (merchant_category_code)
  ```

- **idx_merchants_user_id**
  ```sql
  CREATE INDEX idx_merchants_user_id ON public.merchants USING btree (user_id)
  ```

- **merchants_external_id_key**
  ```sql
  CREATE UNIQUE INDEX merchants_external_id_key ON public.merchants USING btree (external_id)
  ```

- **merchants_pkey**
  ```sql
  CREATE UNIQUE INDEX merchants_pkey ON public.merchants USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## messages

**Columns:** 6  
**Indexes:** 2  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `session_id` | uuid | ❌ | - |
| `role` | text | ❌ | - |
| `content` | text | ❌ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |

### Indexes

- **idx_messages_session_id**
  ```sql
  CREATE INDEX idx_messages_session_id ON public.messages USING btree (session_id, created_at)
  ```

- **messages_pkey**
  ```sql
  CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `session_id` | `sessions.id` |

---

## migration_history

**Columns:** 10  
**Indexes:** 2  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('migration_history_id_seq'::regclass) |
| `migration_name` | character varying(255) | ❌ | - |
| `migration_version` | character varying(50) | ✅ | - |
| `checksum` | character varying(64) | ✅ | - |
| `applied_at` | timestamp with time zone | ✅ | now() |
| `applied_by` | character varying(255) | ✅ | 'system'::character varying |
| `execution_time_ms` | integer | ✅ | - |
| `status` | character varying(20) | ✅ | 'completed'::character varying |
| `rollback_sql` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **migration_history_migration_name_key**
  ```sql
  CREATE UNIQUE INDEX migration_history_migration_name_key ON public.migration_history USING btree (migration_name)
  ```

- **migration_history_pkey**
  ```sql
  CREATE UNIQUE INDEX migration_history_pkey ON public.migration_history USING btree (id)
  ```

---

## migrations

**Columns:** 4  
**Indexes:** 2  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('migrations_id_seq'::regclass) |
| `filename` | character varying(255) | ❌ | - |
| `executed_at` | timestamp without time zone | ✅ | now() |
| `checksum` | character varying(64) | ✅ | - |

### Indexes

- **migrations_filename_key**
  ```sql
  CREATE UNIQUE INDEX migrations_filename_key ON public.migrations USING btree (filename)
  ```

- **migrations_pkey**
  ```sql
  CREATE UNIQUE INDEX migrations_pkey ON public.migrations USING btree (id)
  ```

---

## ml_models

**Columns:** 20  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `model_name` | text | ❌ | - |
| `model_type` | text | ❌ | - |
| `version` | text | ❌ | - |
| `algorithm` | text | ✅ | - |
| `hyperparameters` | jsonb | ✅ | '{}'::jsonb |
| `feature_names` | jsonb | ✅ | '[]'::jsonb |
| `model_path` | text | ✅ | - |
| `model_size_mb` | numeric | ✅ | - |
| `training_accuracy` | numeric | ✅ | - |
| `validation_accuracy` | numeric | ✅ | - |
| `test_accuracy` | numeric | ✅ | - |
| `training_samples` | integer | ✅ | - |
| `training_duration_seconds` | integer | ✅ | - |
| `trained_at` | timestamp with time zone | ✅ | - |
| `trained_by` | text | ✅ | - |
| `status` | text | ❌ | - |
| `is_production` | boolean | ✅ | false |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_ml_models_is_production**
  ```sql
  CREATE INDEX idx_ml_models_is_production ON public.ml_models USING btree (is_production, model_name)
  ```

- **idx_ml_models_name_version**
  ```sql
  CREATE INDEX idx_ml_models_name_version ON public.ml_models USING btree (model_name, version)
  ```

- **idx_ml_models_status**
  ```sql
  CREATE INDEX idx_ml_models_status ON public.ml_models USING btree (status)
  ```

- **ml_models_pkey**
  ```sql
  CREATE UNIQUE INDEX ml_models_pkey ON public.ml_models USING btree (id)
  ```

---

## model_performance

**Columns:** 17  
**Indexes:** 2  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `model_id` | uuid | ✅ | - |
| `period_start` | timestamp with time zone | ❌ | - |
| `period_end` | timestamp with time zone | ❌ | - |
| `prediction_count` | integer | ✅ | - |
| `accuracy` | numeric | ✅ | - |
| `precision_score` | numeric | ✅ | - |
| `recall_score` | numeric | ✅ | - |
| `f1_score` | numeric | ✅ | - |
| `roc_auc_score` | numeric | ✅ | - |
| `avg_inference_time_ms` | numeric | ✅ | - |
| `p95_inference_time_ms` | numeric | ✅ | - |
| `p99_inference_time_ms` | numeric | ✅ | - |
| `avg_memory_mb` | numeric | ✅ | - |
| `peak_memory_mb` | numeric | ✅ | - |
| `computed_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_model_performance_model_id**
  ```sql
  CREATE INDEX idx_model_performance_model_id ON public.model_performance USING btree (model_id, period_end DESC)
  ```

- **model_performance_pkey**
  ```sql
  CREATE UNIQUE INDEX model_performance_pkey ON public.model_performance USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `model_id` | `ml_models.id` |

---

## model_performance_dashboard

**Columns:** 10  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `model_name` | text | ✅ | - |
| `model_type` | text | ✅ | - |
| `version` | text | ✅ | - |
| `is_production` | boolean | ✅ | - |
| `latest_accuracy` | numeric | ✅ | - |
| `latest_f1` | numeric | ✅ | - |
| `avg_inference_time_ms` | numeric | ✅ | - |
| `predictions_last_period` | integer | ✅ | - |
| `period_start` | timestamp with time zone | ✅ | - |
| `period_end` | timestamp with time zone | ✅ | - |
---

## module_quizzes

**Description:** Quiz metadata including passing scores and time limits

**Columns:** 7  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('module_quizzes_id_seq'::regclass) |
| `module_id` | character varying(100) | ❌ | - |
| `quiz_title` | character varying(255) | ❌ | - |
| `passing_score` | integer | ❌ | 70 |
| `time_limit_minutes` | integer | ✅ | - |
| `max_attempts` | integer | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_module_quizzes_module_id**
  ```sql
  CREATE INDEX idx_module_quizzes_module_id ON public.module_quizzes USING btree (module_id)
  ```

- **module_quizzes_module_id_key**
  ```sql
  CREATE UNIQUE INDEX module_quizzes_module_id_key ON public.module_quizzes USING btree (module_id)
  ```

- **module_quizzes_pkey**
  ```sql
  CREATE UNIQUE INDEX module_quizzes_pkey ON public.module_quizzes USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `module_id` | `financial_literacy_modules.module_id` |

---

## money_requests

**Columns:** 14  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `from_user_id` | character varying(255) | ❌ | - |
| `to_user_id` | character varying(255) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `paid_amount` | numeric | ✅ | 0.00 |
| `currency` | character varying(10) | ✅ | 'N$'::character varying |
| `note` | text | ✅ | - |
| `status` | character varying(50) | ✅ | 'pending'::character varying |
| `paid_at` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |
| `description` | text | ✅ | - |
| `expires_at` | timestamp without time zone | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_money_requests_expires_at**
  ```sql
  CREATE INDEX idx_money_requests_expires_at ON public.money_requests USING btree (expires_at) WHERE (expires_at IS NOT NULL)
  ```

- **idx_money_requests_from_user_id**
  ```sql
  CREATE INDEX idx_money_requests_from_user_id ON public.money_requests USING btree (from_user_id)
  ```

- **idx_money_requests_status**
  ```sql
  CREATE INDEX idx_money_requests_status ON public.money_requests USING btree (status)
  ```

- **idx_money_requests_to_user_id**
  ```sql
  CREATE INDEX idx_money_requests_to_user_id ON public.money_requests USING btree (to_user_id)
  ```

- **money_requests_pkey**
  ```sql
  CREATE UNIQUE INDEX money_requests_pkey ON public.money_requests USING btree (id)
  ```

---

## nampost_branch_load

**Columns:** 8  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `branch_id` | character varying(50) | ❌ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `current_load` | integer | ❌ | - |
| `wait_time` | integer | ❌ | - |
| `queue_length` | integer | ✅ | 0 |
| `concentration_level` | character varying(50) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_nampost_branch_load_branch**
  ```sql
  CREATE INDEX idx_nampost_branch_load_branch ON public.nampost_branch_load USING btree (branch_id)
  ```

- **idx_nampost_branch_load_concentration**
  ```sql
  CREATE INDEX idx_nampost_branch_load_concentration ON public.nampost_branch_load USING btree (concentration_level)
  ```

- **idx_nampost_branch_load_timestamp**
  ```sql
  CREATE INDEX idx_nampost_branch_load_timestamp ON public.nampost_branch_load USING btree ("timestamp" DESC)
  ```

- **nampost_branch_load_pkey**
  ```sql
  CREATE UNIQUE INDEX nampost_branch_load_pkey ON public.nampost_branch_load USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `branch_id` | `nampost_branches.branch_id` |

---

## nampost_branches

**Columns:** 17  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `branch_id` | character varying(50) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `address` | character varying(255) | ❌ | - |
| `city` | character varying(100) | ❌ | - |
| `region` | character varying(50) | ❌ | - |
| `latitude` | numeric | ❌ | - |
| `longitude` | numeric | ❌ | - |
| `phone_number` | character varying(20) | ✅ | - |
| `email` | character varying(255) | ✅ | - |
| `services` | ARRAY | ❌ | - |
| `operating_hours` | jsonb | ✅ | - |
| `capacity_metrics` | jsonb | ✅ | - |
| `current_load` | integer | ✅ | 0 |
| `average_wait_time` | integer | ✅ | 0 |
| `status` | character varying(50) | ✅ | 'active'::character varying |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_nampost_branches_city**
  ```sql
  CREATE INDEX idx_nampost_branches_city ON public.nampost_branches USING btree (city)
  ```

- **idx_nampost_branches_latitude**
  ```sql
  CREATE INDEX idx_nampost_branches_latitude ON public.nampost_branches USING btree (latitude)
  ```

- **idx_nampost_branches_longitude**
  ```sql
  CREATE INDEX idx_nampost_branches_longitude ON public.nampost_branches USING btree (longitude)
  ```

- **idx_nampost_branches_region**
  ```sql
  CREATE INDEX idx_nampost_branches_region ON public.nampost_branches USING btree (region)
  ```

- **idx_nampost_branches_status**
  ```sql
  CREATE INDEX idx_nampost_branches_status ON public.nampost_branches USING btree (status)
  ```

- **nampost_branches_pkey**
  ```sql
  CREATE UNIQUE INDEX nampost_branches_pkey ON public.nampost_branches USING btree (branch_id)
  ```

---

## nampost_staff

**Columns:** 11  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `staff_id` | character varying(50) | ❌ | - |
| `branch_id` | character varying(50) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `role` | character varying(50) | ❌ | - |
| `phone_number` | character varying(20) | ✅ | - |
| `email` | character varying(255) | ✅ | - |
| `specialization` | ARRAY | ✅ | - |
| `availability` | jsonb | ✅ | - |
| `performance_metrics` | jsonb | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_nampost_staff_branch**
  ```sql
  CREATE INDEX idx_nampost_staff_branch ON public.nampost_staff USING btree (branch_id)
  ```

- **idx_nampost_staff_role**
  ```sql
  CREATE INDEX idx_nampost_staff_role ON public.nampost_staff USING btree (role)
  ```

- **nampost_staff_pkey**
  ```sql
  CREATE UNIQUE INDEX nampost_staff_pkey ON public.nampost_staff USING btree (staff_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `branch_id` | `nampost_branches.branch_id` |

---

## namqr_codes

**Columns:** 19  
**Indexes:** 7  
**Foreign Keys:** 3

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ❌ | - |
| `qr_data` | text | ❌ | - |
| `qr_image_url` | text | ✅ | - |
| `amount` | numeric | ❌ | - |
| `currency` | text | ❌ | 'NAD'::text |
| `merchant_name` | text | ✅ | - |
| `reference` | text | ✅ | - |
| `token_vault_id` | text | ✅ | - |
| `crc_value` | text | ✅ | - |
| `status` | text | ❌ | 'active'::text |
| `expires_at` | timestamp with time zone | ✅ | - |
| `used_at` | timestamp with time zone | ✅ | - |
| `used_by_user_id` | uuid | ✅ | - |
| `transaction_id` | uuid | ✅ | - |
| `generated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_namqr_codes_expires_at**
  ```sql
  CREATE INDEX idx_namqr_codes_expires_at ON public.namqr_codes USING btree (expires_at) WHERE (expires_at IS NOT NULL)
  ```

- **idx_namqr_codes_reference**
  ```sql
  CREATE INDEX idx_namqr_codes_reference ON public.namqr_codes USING btree (reference) WHERE (reference IS NOT NULL)
  ```

- **idx_namqr_codes_status**
  ```sql
  CREATE INDEX idx_namqr_codes_status ON public.namqr_codes USING btree (status)
  ```

- **idx_namqr_codes_token_vault_id**
  ```sql
  CREATE INDEX idx_namqr_codes_token_vault_id ON public.namqr_codes USING btree (token_vault_id)
  ```

- **idx_namqr_codes_transaction_id**
  ```sql
  CREATE INDEX idx_namqr_codes_transaction_id ON public.namqr_codes USING btree (transaction_id)
  ```

- **idx_namqr_codes_user_id**
  ```sql
  CREATE INDEX idx_namqr_codes_user_id ON public.namqr_codes USING btree (user_id, generated_at DESC)
  ```

- **namqr_codes_pkey**
  ```sql
  CREATE UNIQUE INDEX namqr_codes_pkey ON public.namqr_codes USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `transaction_id` | `transactions.id` |
| `used_by_user_id` | `users.id` |
| `user_id` | `users.id` |

---

## namqr_transactions

**Description:** NAMQR payment transaction tracking

**Columns:** 27  
**Indexes:** 8  
**Foreign Keys:** 3

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `transaction_id` | character varying(50) | ❌ | - |
| `token_vault_id` | uuid | ✅ | - |
| `nref` | character varying(8) | ❌ | - |
| `payer_identifier` | character varying(255) | ❌ | - |
| `payer_name` | character varying(255) | ✅ | - |
| `payee_identifier` | character varying(255) | ❌ | - |
| `payee_name` | character varying(255) | ✅ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ❌ | 'NAD'::character varying |
| `payment_network` | character varying(10) | ❌ | - |
| `transaction_type` | character varying(10) | ❌ | - |
| `status` | character varying(20) | ❌ | 'pending'::character varying |
| `payer_psp_id` | character varying(10) | ✅ | - |
| `payee_psp_id` | character varying(10) | ✅ | - |
| `network_transaction_id` | character varying(100) | ✅ | - |
| `network_reference` | character varying(100) | ✅ | - |
| `two_factor_verified` | boolean | ❌ | false |
| `two_factor_method` | character varying(20) | ✅ | - |
| `initiated_at` | timestamp with time zone | ❌ | now() |
| `processed_at` | timestamp with time zone | ✅ | - |
| `completed_at` | timestamp with time zone | ✅ | - |
| `failed_at` | timestamp with time zone | ✅ | - |
| `failure_reason` | text | ✅ | - |
| `failure_code` | character varying(50) | ✅ | - |
| `reference_label` | character varying(25) | ✅ | - |
| `purpose` | character varying(25) | ✅ | - |
| `metadata` | jsonb | ✅ | - |

### Indexes

- **idx_namqr_txn_initiated**
  ```sql
  CREATE INDEX idx_namqr_txn_initiated ON public.namqr_transactions USING btree (initiated_at DESC)
  ```

- **idx_namqr_txn_network**
  ```sql
  CREATE INDEX idx_namqr_txn_network ON public.namqr_transactions USING btree (payment_network)
  ```

- **idx_namqr_txn_nref**
  ```sql
  CREATE INDEX idx_namqr_txn_nref ON public.namqr_transactions USING btree (nref)
  ```

- **idx_namqr_txn_payee**
  ```sql
  CREATE INDEX idx_namqr_txn_payee ON public.namqr_transactions USING btree (payee_identifier)
  ```

- **idx_namqr_txn_payer**
  ```sql
  CREATE INDEX idx_namqr_txn_payer ON public.namqr_transactions USING btree (payer_identifier)
  ```

- **idx_namqr_txn_status**
  ```sql
  CREATE INDEX idx_namqr_txn_status ON public.namqr_transactions USING btree (status)
  ```

- **idx_namqr_txn_token_vault**
  ```sql
  CREATE INDEX idx_namqr_txn_token_vault ON public.namqr_transactions USING btree (token_vault_id)
  ```

- **namqr_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX namqr_transactions_pkey ON public.namqr_transactions USING btree (transaction_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `payee_psp_id` | `psp_registry.psp_id` |
| `payer_psp_id` | `psp_registry.psp_id` |
| `token_vault_id` | `token_vault.token_vault_id` |

---

## namqr_validations

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `namqr_code_id` | uuid | ✅ | - |
| `qr_data` | text | ❌ | - |
| `validation_result` | text | ❌ | - |
| `validation_details` | jsonb | ✅ | '{}'::jsonb |
| `validated_by_user_id` | uuid | ✅ | - |
| `validated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `ip_address` | inet | ✅ | - |
| `user_agent` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_namqr_validations_code_id**
  ```sql
  CREATE INDEX idx_namqr_validations_code_id ON public.namqr_validations USING btree (namqr_code_id)
  ```

- **idx_namqr_validations_result**
  ```sql
  CREATE INDEX idx_namqr_validations_result ON public.namqr_validations USING btree (validation_result, validated_at DESC)
  ```

- **idx_namqr_validations_user_id**
  ```sql
  CREATE INDEX idx_namqr_validations_user_id ON public.namqr_validations USING btree (validated_by_user_id)
  ```

- **namqr_validations_pkey**
  ```sql
  CREATE UNIQUE INDEX namqr_validations_pkey ON public.namqr_validations USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `namqr_code_id` | `namqr_codes.id` |
| `validated_by_user_id` | `users.id` |

---

## notification_logs

**Columns:** 8  
**Indexes:** 2  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `title` | character varying(255) | ❌ | - |
| `body` | text | ❌ | - |
| `data` | jsonb | ✅ | '{}'::jsonb |
| `target_users` | jsonb | ✅ | '[]'::jsonb |
| `sent_count` | integer | ✅ | 0 |
| `failed_count` | integer | ✅ | 0 |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_notification_logs_created**
  ```sql
  CREATE INDEX idx_notification_logs_created ON public.notification_logs USING btree (created_at DESC)
  ```

- **notification_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX notification_logs_pkey ON public.notification_logs USING btree (id)
  ```

---

## notification_preferences

**Columns:** 13  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `transactions_enabled` | boolean | ✅ | true |
| `security_enabled` | boolean | ✅ | true |
| `promotions_enabled` | boolean | ✅ | true |
| `reminders_enabled` | boolean | ✅ | true |
| `achievements_enabled` | boolean | ✅ | true |
| `quests_enabled` | boolean | ✅ | true |
| `learning_enabled` | boolean | ✅ | true |
| `quiet_hours_start` | time without time zone | ✅ | - |
| `quiet_hours_end` | time without time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_notification_preferences_user**
  ```sql
  CREATE INDEX idx_notification_preferences_user ON public.notification_preferences USING btree (user_id)
  ```

- **notification_preferences_pkey**
  ```sql
  CREATE UNIQUE INDEX notification_preferences_pkey ON public.notification_preferences USING btree (id)
  ```

- **notification_preferences_user_id_key**
  ```sql
  CREATE UNIQUE INDEX notification_preferences_user_id_key ON public.notification_preferences USING btree (user_id)
  ```

---

## notifications

**Columns:** 10  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `type` | character varying(50) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `message` | text | ❌ | - |
| `is_read` | boolean | ✅ | false |
| `related_id` | uuid | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |
| `data` | jsonb | ✅ | '{}'::jsonb |
| `read_at` | timestamp without time zone | ✅ | - |

### Indexes

- **idx_notifications_created_at**
  ```sql
  CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC)
  ```

- **idx_notifications_is_read**
  ```sql
  CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (is_read) WHERE (is_read = false)
  ```

- **idx_notifications_unread**
  ```sql
  CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id, created_at DESC) WHERE (is_read = false)
  ```

- **idx_notifications_user_id**
  ```sql
  CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)
  ```

- **notifications_pkey**
  ```sql
  CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)
  ```

---

## oauth_access_tokens

**Description:** OAuth 2.0 Access Tokens (15 min expiry)

**Columns:** 8  
**Indexes:** 4  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `token_id` | uuid | ❌ | gen_random_uuid() |
| `access_token` | character varying(255) | ❌ | - |
| `participant_id` | character varying(20) | ❌ | - |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `scope` | text | ❌ | - |
| `token_type` | character varying(20) | ✅ | 'Bearer'::character varying |
| `expires_at` | timestamp with time zone | ❌ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_access_tokens_expires**
  ```sql
  CREATE INDEX idx_access_tokens_expires ON public.oauth_access_tokens USING btree (expires_at)
  ```

- **idx_access_tokens_token**
  ```sql
  CREATE INDEX idx_access_tokens_token ON public.oauth_access_tokens USING btree (access_token)
  ```

- **oauth_access_tokens_access_token_key**
  ```sql
  CREATE UNIQUE INDEX oauth_access_tokens_access_token_key ON public.oauth_access_tokens USING btree (access_token)
  ```

- **oauth_access_tokens_pkey**
  ```sql
  CREATE UNIQUE INDEX oauth_access_tokens_pkey ON public.oauth_access_tokens USING btree (token_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |
| `participant_id` | `open_banking_participants.participant_id` |

---

## oauth_authorization_codes

**Description:** OAuth 2.0 Authorization Codes with PKCE - RFC 7636

**Columns:** 11  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `code` | character varying(255) | ❌ | - |
| `client_id` | character varying(10) | ❌ | - |
| `redirect_uri` | text | ❌ | - |
| `code_challenge` | character varying(255) | ❌ | - |
| `code_challenge_method` | character varying(10) | ❌ | 'S256'::character varying |
| `scope` | text | ❌ | - |
| `account_holder_id` | character varying(255) | ❌ | - |
| `expires_at` | timestamp without time zone | ❌ | - |
| `created_at` | timestamp without time zone | ❌ | now() |
| `used` | boolean | ❌ | false |
| `used_at` | timestamp without time zone | ✅ | - |

### Indexes

- **idx_auth_codes_expires**
  ```sql
  CREATE INDEX idx_auth_codes_expires ON public.oauth_authorization_codes USING btree (expires_at)
  ```

- **idx_auth_codes_used**
  ```sql
  CREATE INDEX idx_auth_codes_used ON public.oauth_authorization_codes USING btree (used)
  ```

- **idx_oauth_codes_account_holder**
  ```sql
  CREATE INDEX idx_oauth_codes_account_holder ON public.oauth_authorization_codes USING btree (account_holder_id)
  ```

- **idx_oauth_codes_client**
  ```sql
  CREATE INDEX idx_oauth_codes_client ON public.oauth_authorization_codes USING btree (client_id)
  ```

- **idx_oauth_codes_expires**
  ```sql
  CREATE INDEX idx_oauth_codes_expires ON public.oauth_authorization_codes USING btree (expires_at)
  ```

- **idx_oauth_codes_used**
  ```sql
  CREATE INDEX idx_oauth_codes_used ON public.oauth_authorization_codes USING btree (used)
  ```

- **oauth_authorization_codes_pkey**
  ```sql
  CREATE UNIQUE INDEX oauth_authorization_codes_pkey ON public.oauth_authorization_codes USING btree (code)
  ```

---

## oauth_authorization_requests

**Description:** OAuth 2.0 PAR (Pushed Authorization Requests) - RFC 9126

**Columns:** 11  
**Indexes:** 3  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `request_uri` | character varying(100) | ❌ | - |
| `participant_id` | character varying(20) | ❌ | - |
| `beneficiary_id` | character varying(50) | ✅ | - |
| `code_challenge` | character varying(128) | ❌ | - |
| `code_challenge_method` | character varying(10) | ❌ | 'S256'::character varying |
| `scope` | text | ❌ | - |
| `redirect_uri` | text | ❌ | - |
| `state` | character varying(255) | ✅ | - |
| `nonce` | character varying(255) | ✅ | - |
| `expires_at` | timestamp with time zone | ❌ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_auth_requests_expires**
  ```sql
  CREATE INDEX idx_auth_requests_expires ON public.oauth_authorization_requests USING btree (expires_at)
  ```

- **idx_auth_requests_participant**
  ```sql
  CREATE INDEX idx_auth_requests_participant ON public.oauth_authorization_requests USING btree (participant_id)
  ```

- **oauth_authorization_requests_pkey**
  ```sql
  CREATE UNIQUE INDEX oauth_authorization_requests_pkey ON public.oauth_authorization_requests USING btree (request_uri)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |
| `participant_id` | `open_banking_participants.participant_id` |

---

## oauth_consents

**Description:** OAuth 2.0 consent records for Namibian Open Banking

**Columns:** 14  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `consent_id` | character varying(255) | ❌ | - |
| `account_holder_id` | character varying(255) | ❌ | - |
| `data_provider_id` | character varying(10) | ❌ | - |
| `tpp_id` | character varying(10) | ❌ | - |
| `permissions` | jsonb | ❌ | - |
| `status` | character varying(50) | ❌ | 'AwaitingAuthorisation'::character varying |
| `expiration_date_time` | timestamp without time zone | ❌ | - |
| `requested_expiration_date_time` | timestamp without time zone | ✅ | - |
| `transaction_from_date_time` | timestamp without time zone | ✅ | - |
| `transaction_to_date_time` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | now() |
| `status_update_date_time` | timestamp without time zone | ❌ | now() |
| `revoked_at` | timestamp without time zone | ✅ | - |
| `revoked_by` | character varying(255) | ✅ | - |

### Indexes

- **idx_oauth_consents_account_holder**
  ```sql
  CREATE INDEX idx_oauth_consents_account_holder ON public.oauth_consents USING btree (account_holder_id)
  ```

- **idx_oauth_consents_data_provider**
  ```sql
  CREATE INDEX idx_oauth_consents_data_provider ON public.oauth_consents USING btree (data_provider_id)
  ```

- **idx_oauth_consents_expiration**
  ```sql
  CREATE INDEX idx_oauth_consents_expiration ON public.oauth_consents USING btree (expiration_date_time)
  ```

- **idx_oauth_consents_status**
  ```sql
  CREATE INDEX idx_oauth_consents_status ON public.oauth_consents USING btree (status)
  ```

- **idx_oauth_consents_tpp**
  ```sql
  CREATE INDEX idx_oauth_consents_tpp ON public.oauth_consents USING btree (tpp_id)
  ```

- **oauth_consents_pkey**
  ```sql
  CREATE UNIQUE INDEX oauth_consents_pkey ON public.oauth_consents USING btree (consent_id)
  ```

---

## oauth_par_requests

**Description:** Pushed Authorization Requests (PAR) - RFC 9126

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `request_uri` | character varying(500) | ❌ | - |
| `client_id` | character varying(10) | ❌ | - |
| `redirect_uri` | text | ❌ | - |
| `code_challenge` | character varying(255) | ❌ | - |
| `code_challenge_method` | character varying(10) | ❌ | 'S256'::character varying |
| `scope` | text | ❌ | - |
| `expires_at` | timestamp without time zone | ❌ | - |
| `created_at` | timestamp without time zone | ❌ | now() |
| `used` | boolean | ❌ | false |
| `used_at` | timestamp without time zone | ✅ | - |

### Indexes

- **idx_oauth_par_client**
  ```sql
  CREATE INDEX idx_oauth_par_client ON public.oauth_par_requests USING btree (client_id)
  ```

- **idx_oauth_par_expires**
  ```sql
  CREATE INDEX idx_oauth_par_expires ON public.oauth_par_requests USING btree (expires_at)
  ```

- **idx_oauth_par_used**
  ```sql
  CREATE INDEX idx_oauth_par_used ON public.oauth_par_requests USING btree (used)
  ```

- **oauth_par_requests_pkey**
  ```sql
  CREATE UNIQUE INDEX oauth_par_requests_pkey ON public.oauth_par_requests USING btree (request_uri)
  ```

---

## oauth_refresh_tokens

**Description:** OAuth 2.0 Refresh Tokens (180 days max per standards)

**Columns:** 11  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `token_id` | uuid | ❌ | gen_random_uuid() |
| `refresh_token` | character varying(255) | ❌ | - |
| `participant_id` | character varying(20) | ❌ | - |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `scope` | text | ❌ | - |
| `expires_at` | timestamp with time zone | ❌ | - |
| `revoked` | boolean | ✅ | false |
| `revoked_at` | timestamp with time zone | ✅ | - |
| `revoked_reason` | character varying(50) | ✅ | - |
| `last_used` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_refresh_tokens_expires**
  ```sql
  CREATE INDEX idx_refresh_tokens_expires ON public.oauth_refresh_tokens USING btree (expires_at)
  ```

- **idx_refresh_tokens_revoked**
  ```sql
  CREATE INDEX idx_refresh_tokens_revoked ON public.oauth_refresh_tokens USING btree (revoked)
  ```

- **idx_refresh_tokens_token**
  ```sql
  CREATE INDEX idx_refresh_tokens_token ON public.oauth_refresh_tokens USING btree (refresh_token)
  ```

- **oauth_refresh_tokens_pkey**
  ```sql
  CREATE UNIQUE INDEX oauth_refresh_tokens_pkey ON public.oauth_refresh_tokens USING btree (token_id)
  ```

- **oauth_refresh_tokens_refresh_token_key**
  ```sql
  CREATE UNIQUE INDEX oauth_refresh_tokens_refresh_token_key ON public.oauth_refresh_tokens USING btree (refresh_token)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |
| `participant_id` | `open_banking_participants.participant_id` |

---

## onboarding_documents

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `onboarding_id` | character varying(50) | ❌ | - |
| `document_type` | character varying(50) | ❌ | - |
| `document_data` | bytea | ✅ | - |
| `document_url` | text | ✅ | - |
| `verification_status` | character varying(50) | ✅ | 'pending'::character varying |
| `verified_at` | timestamp with time zone | ✅ | - |
| `verified_by` | character varying(255) | ✅ | - |
| `rejection_reason` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_onboarding_documents_onboarding**
  ```sql
  CREATE INDEX idx_onboarding_documents_onboarding ON public.onboarding_documents USING btree (onboarding_id)
  ```

- **idx_onboarding_documents_status**
  ```sql
  CREATE INDEX idx_onboarding_documents_status ON public.onboarding_documents USING btree (verification_status)
  ```

- **idx_onboarding_documents_type**
  ```sql
  CREATE INDEX idx_onboarding_documents_type ON public.onboarding_documents USING btree (document_type)
  ```

- **onboarding_documents_pkey**
  ```sql
  CREATE UNIQUE INDEX onboarding_documents_pkey ON public.onboarding_documents USING btree (id)
  ```

---

## open_banking_accounts

**Description:** Banking Resource Object: Accounts (Section 9.2.4)

**Columns:** 11  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `account_id` | uuid | ❌ | gen_random_uuid() |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `account_type` | character varying(50) | ❌ | - |
| `account_number` | character varying(50) | ❌ | - |
| `account_name` | character varying(255) | ❌ | - |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `status` | character varying(20) | ✅ | 'open'::character varying |
| `opened_date` | date | ✅ | - |
| `closed_date` | date | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_ob_accounts_beneficiary**
  ```sql
  CREATE INDEX idx_ob_accounts_beneficiary ON public.open_banking_accounts USING btree (beneficiary_id)
  ```

- **idx_ob_accounts_status**
  ```sql
  CREATE INDEX idx_ob_accounts_status ON public.open_banking_accounts USING btree (status)
  ```

- **idx_ob_accounts_type**
  ```sql
  CREATE INDEX idx_ob_accounts_type ON public.open_banking_accounts USING btree (account_type)
  ```

- **open_banking_accounts_beneficiary_id_account_number_key**
  ```sql
  CREATE UNIQUE INDEX open_banking_accounts_beneficiary_id_account_number_key ON public.open_banking_accounts USING btree (beneficiary_id, account_number)
  ```

- **open_banking_accounts_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_accounts_pkey ON public.open_banking_accounts USING btree (account_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |

---

## open_banking_api_logs

**Description:** API access logs for compliance reporting (Section 10.1)

**Columns:** 11  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `log_id` | uuid | ❌ | gen_random_uuid() |
| `participant_id` | character varying(20) | ✅ | - |
| `beneficiary_id` | character varying(50) | ✅ | - |
| `endpoint` | character varying(255) | ❌ | - |
| `http_method` | character varying(10) | ❌ | - |
| `http_status` | integer | ✅ | - |
| `response_time_ms` | integer | ✅ | - |
| `error_code` | character varying(50) | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `user_agent` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_ob_api_logs_created**
  ```sql
  CREATE INDEX idx_ob_api_logs_created ON public.open_banking_api_logs USING btree (created_at)
  ```

- **idx_ob_api_logs_endpoint**
  ```sql
  CREATE INDEX idx_ob_api_logs_endpoint ON public.open_banking_api_logs USING btree (endpoint)
  ```

- **idx_ob_api_logs_participant**
  ```sql
  CREATE INDEX idx_ob_api_logs_participant ON public.open_banking_api_logs USING btree (participant_id)
  ```

- **idx_ob_api_logs_status**
  ```sql
  CREATE INDEX idx_ob_api_logs_status ON public.open_banking_api_logs USING btree (http_status)
  ```

- **open_banking_api_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_api_logs_pkey ON public.open_banking_api_logs USING btree (log_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |
| `participant_id` | `open_banking_participants.participant_id` |

---

## open_banking_balances

**Description:** Banking Resource Object: Balances (Section 9.2.4)

**Columns:** 7  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `balance_id` | uuid | ❌ | gen_random_uuid() |
| `account_id` | uuid | ❌ | - |
| `balance_type` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `as_of_date` | timestamp with time zone | ✅ | now() |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_ob_balances_account**
  ```sql
  CREATE INDEX idx_ob_balances_account ON public.open_banking_balances USING btree (account_id)
  ```

- **idx_ob_balances_type**
  ```sql
  CREATE INDEX idx_ob_balances_type ON public.open_banking_balances USING btree (balance_type)
  ```

- **open_banking_balances_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_balances_pkey ON public.open_banking_balances USING btree (balance_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `account_id` | `open_banking_accounts.account_id` |

---

## open_banking_beneficiaries

**Description:** Banking Resource Object: Beneficiaries/Payees (Section 9.2.4)

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `beneficiary_payee_id` | uuid | ❌ | gen_random_uuid() |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `account_id` | uuid | ❌ | - |
| `payee_name` | character varying(255) | ❌ | - |
| `payee_account` | character varying(50) | ❌ | - |
| `payee_bank_code` | character varying(20) | ✅ | - |
| `payee_reference` | character varying(100) | ✅ | - |
| `is_favorite` | boolean | ✅ | false |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_ob_beneficiaries_account**
  ```sql
  CREATE INDEX idx_ob_beneficiaries_account ON public.open_banking_beneficiaries USING btree (account_id)
  ```

- **idx_ob_beneficiaries_beneficiary**
  ```sql
  CREATE INDEX idx_ob_beneficiaries_beneficiary ON public.open_banking_beneficiaries USING btree (beneficiary_id)
  ```

- **open_banking_beneficiaries_beneficiary_id_account_id_payee__key**
  ```sql
  CREATE UNIQUE INDEX open_banking_beneficiaries_beneficiary_id_account_id_payee__key ON public.open_banking_beneficiaries USING btree (beneficiary_id, account_id, payee_account)
  ```

- **open_banking_beneficiaries_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_beneficiaries_pkey ON public.open_banking_beneficiaries USING btree (beneficiary_payee_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `account_id` | `open_banking_accounts.account_id` |
| `beneficiary_id` | `beneficiaries.id` |

---

## open_banking_consent_audit

**Description:** Consent audit trail for compliance

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `audit_id` | uuid | ❌ | gen_random_uuid() |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `participant_id` | character varying(20) | ❌ | - |
| `action` | character varying(50) | ❌ | - |
| `scope` | text | ❌ | - |
| `duration_days` | integer | ✅ | - |
| `revocation_reason` | character varying(100) | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `user_agent` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_ob_consent_audit_beneficiary**
  ```sql
  CREATE INDEX idx_ob_consent_audit_beneficiary ON public.open_banking_consent_audit USING btree (beneficiary_id)
  ```

- **idx_ob_consent_audit_created**
  ```sql
  CREATE INDEX idx_ob_consent_audit_created ON public.open_banking_consent_audit USING btree (created_at)
  ```

- **idx_ob_consent_audit_participant**
  ```sql
  CREATE INDEX idx_ob_consent_audit_participant ON public.open_banking_consent_audit USING btree (participant_id)
  ```

- **open_banking_consent_audit_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_consent_audit_pkey ON public.open_banking_consent_audit USING btree (audit_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |
| `participant_id` | `open_banking_participants.participant_id` |

---

## open_banking_participants

**Description:** Namibian Open Banking v1.0: Registered Data Providers and TPPs

**Columns:** 13  
**Indexes:** 1  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `participant_id` | character varying(20) | ❌ | - |
| `participant_name` | character varying(255) | ❌ | - |
| `participant_role` | character varying(10) | ❌ | - |
| `status` | character varying(20) | ❌ | 'active'::character varying |
| `sectors` | ARRAY | ✅ | ARRAY['banking'::text] |
| `services` | ARRAY | ✅ | ARRAY['AIS'::text, 'PIS'::text] |
| `contact_email` | character varying(255) | ✅ | - |
| `contact_url` | character varying(255) | ✅ | - |
| `certificate_thumbprint` | text | ✅ | - |
| `registered_at` | timestamp with time zone | ✅ | now() |
| `last_active` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **open_banking_participants_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_participants_pkey ON public.open_banking_participants USING btree (participant_id)
  ```

---

## open_banking_payments

**Description:** Banking Resource Object: Payments - PIS (Section 9.2.4)

**Columns:** 22  
**Indexes:** 6  
**Foreign Keys:** 3

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `payment_id` | uuid | ❌ | gen_random_uuid() |
| `participant_id` | character varying(20) | ❌ | - |
| `beneficiary_id` | character varying(50) | ❌ | - |
| `debtor_account_id` | uuid | ❌ | - |
| `payment_type` | character varying(50) | ❌ | - |
| `creditor_name` | character varying(255) | ❌ | - |
| `creditor_account` | character varying(50) | ❌ | - |
| `creditor_bank_code` | character varying(20) | ✅ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `reference` | character varying(100) | ✅ | - |
| `description` | text | ✅ | - |
| `status` | character varying(50) | ✅ | 'pending'::character varying |
| `status_reason` | text | ✅ | - |
| `instruction_id` | character varying(100) | ✅ | - |
| `end_to_end_id` | character varying(100) | ✅ | - |
| `initiated_at` | timestamp with time zone | ✅ | now() |
| `accepted_at` | timestamp with time zone | ✅ | - |
| `completed_at` | timestamp with time zone | ✅ | - |
| `failed_at` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_ob_payments_beneficiary**
  ```sql
  CREATE INDEX idx_ob_payments_beneficiary ON public.open_banking_payments USING btree (beneficiary_id)
  ```

- **idx_ob_payments_initiated**
  ```sql
  CREATE INDEX idx_ob_payments_initiated ON public.open_banking_payments USING btree (initiated_at)
  ```

- **idx_ob_payments_participant**
  ```sql
  CREATE INDEX idx_ob_payments_participant ON public.open_banking_payments USING btree (participant_id)
  ```

- **idx_ob_payments_status**
  ```sql
  CREATE INDEX idx_ob_payments_status ON public.open_banking_payments USING btree (status)
  ```

- **open_banking_payments_instruction_id_key**
  ```sql
  CREATE UNIQUE INDEX open_banking_payments_instruction_id_key ON public.open_banking_payments USING btree (instruction_id)
  ```

- **open_banking_payments_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_payments_pkey ON public.open_banking_payments USING btree (payment_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `beneficiary_id` | `beneficiaries.id` |
| `debtor_account_id` | `open_banking_accounts.account_id` |
| `participant_id` | `open_banking_participants.participant_id` |

---

## open_banking_transactions

**Description:** Banking Resource Object: Transactions (Section 9.2.4)

**Columns:** 14  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `transaction_id` | uuid | ❌ | gen_random_uuid() |
| `account_id` | uuid | ❌ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `transaction_reference` | character varying(100) | ✅ | - |
| `description` | text | ✅ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `posting_date` | date | ❌ | - |
| `value_date` | date | ✅ | - |
| `balance_after` | numeric | ✅ | - |
| `status` | character varying(20) | ✅ | 'posted'::character varying |
| `merchant_name` | character varying(255) | ✅ | - |
| `merchant_category` | character varying(50) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_ob_transactions_account**
  ```sql
  CREATE INDEX idx_ob_transactions_account ON public.open_banking_transactions USING btree (account_id)
  ```

- **idx_ob_transactions_date**
  ```sql
  CREATE INDEX idx_ob_transactions_date ON public.open_banking_transactions USING btree (posting_date)
  ```

- **idx_ob_transactions_type**
  ```sql
  CREATE INDEX idx_ob_transactions_type ON public.open_banking_transactions USING btree (transaction_type)
  ```

- **open_banking_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX open_banking_transactions_pkey ON public.open_banking_transactions USING btree (transaction_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `account_id` | `open_banking_accounts.account_id` |

---

## otp_codes

**Description:** Temporary OTP codes for phone number verification

**Columns:** 7  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('otp_codes_id_seq'::regclass) |
| `phone_number` | character varying(20) | ❌ | - |
| `code` | character varying(6) | ❌ | - |
| `expires_at` | timestamp with time zone | ❌ | - |
| `used` | boolean | ✅ | false |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_otp_codes_expires**
  ```sql
  CREATE INDEX idx_otp_codes_expires ON public.otp_codes USING btree (expires_at)
  ```

- **idx_otp_codes_phone**
  ```sql
  CREATE INDEX idx_otp_codes_phone ON public.otp_codes USING btree (phone_number)
  ```

- **otp_codes_phone_number_key**
  ```sql
  CREATE UNIQUE INDEX otp_codes_phone_number_key ON public.otp_codes USING btree (phone_number)
  ```

- **otp_codes_pkey**
  ```sql
  CREATE UNIQUE INDEX otp_codes_pkey ON public.otp_codes USING btree (id)
  ```

---

## participants

**Description:** Registry of TPPs and Data Providers for Namibian Open Banking

**Columns:** 8  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `participant_id` | character varying(10) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `role` | character varying(20) | ❌ | - |
| `status` | character varying(20) | ❌ | 'Active'::character varying |
| `registered_at` | timestamp without time zone | ❌ | now() |
| `suspended_at` | timestamp without time zone | ✅ | - |
| `revoked_at` | timestamp without time zone | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_participants_registered**
  ```sql
  CREATE INDEX idx_participants_registered ON public.participants USING btree (registered_at)
  ```

- **idx_participants_role**
  ```sql
  CREATE INDEX idx_participants_role ON public.participants USING btree (role)
  ```

- **idx_participants_status**
  ```sql
  CREATE INDEX idx_participants_status ON public.participants USING btree (status)
  ```

- **participants_pkey**
  ```sql
  CREATE UNIQUE INDEX participants_pkey ON public.participants USING btree (participant_id)
  ```

---

## payment_method_analytics

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `payment_method` | character varying(50) | ❌ | - |
| `date` | date | ❌ | - |
| `transaction_count` | integer | ❌ | 0 |
| `total_volume` | numeric | ❌ | 0 |
| `average_transaction_amount` | numeric | ✅ | - |
| `unique_users` | integer | ❌ | 0 |
| `success_rate` | numeric | ✅ | - |
| `average_processing_time_ms` | integer | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_payment_method_analytics_date**
  ```sql
  CREATE INDEX idx_payment_method_analytics_date ON public.payment_method_analytics USING btree (date)
  ```

- **idx_payment_method_analytics_method_date**
  ```sql
  CREATE INDEX idx_payment_method_analytics_method_date ON public.payment_method_analytics USING btree (payment_method, date)
  ```

- **payment_method_analytics_payment_method_date_key**
  ```sql
  CREATE UNIQUE INDEX payment_method_analytics_payment_method_date_key ON public.payment_method_analytics USING btree (payment_method, date)
  ```

- **payment_method_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX payment_method_analytics_pkey ON public.payment_method_analytics USING btree (id)
  ```

---

## payments

**Description:** Payment initiation records for Namibian Open Banking PIS

**Columns:** 12  
**Indexes:** 7  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | character varying(255) | ❌ | - |
| `payer_account_id` | character varying(255) | ❌ | - |
| `beneficiary_account_id` | character varying(255) | ❌ | - |
| `amount` | bigint | ❌ | - |
| `currency` | character varying(3) | ❌ | 'NAD'::character varying |
| `payment_type` | character varying(50) | ❌ | 'Domestic On-us'::character varying |
| `status` | character varying(50) | ❌ | 'Accepted'::character varying |
| `reference` | text | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | now() |
| `updated_at` | timestamp without time zone | ❌ | now() |
| `tpp_id` | character varying(10) | ❌ | - |
| `consent_id` | character varying(255) | ❌ | - |

### Indexes

- **idx_payments_beneficiary**
  ```sql
  CREATE INDEX idx_payments_beneficiary ON public.payments USING btree (beneficiary_account_id)
  ```

- **idx_payments_consent**
  ```sql
  CREATE INDEX idx_payments_consent ON public.payments USING btree (consent_id)
  ```

- **idx_payments_created**
  ```sql
  CREATE INDEX idx_payments_created ON public.payments USING btree (created_at)
  ```

- **idx_payments_payer**
  ```sql
  CREATE INDEX idx_payments_payer ON public.payments USING btree (payer_account_id)
  ```

- **idx_payments_status**
  ```sql
  CREATE INDEX idx_payments_status ON public.payments USING btree (status)
  ```

- **idx_payments_tpp**
  ```sql
  CREATE INDEX idx_payments_tpp ON public.payments USING btree (tpp_id)
  ```

- **payments_pkey**
  ```sql
  CREATE UNIQUE INDEX payments_pkey ON public.payments USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `consent_id` | `oauth_consents.consent_id` |

---

## periodic_surveys

**Description:** Monthly/quarterly surveys to collect ongoing feedback

**Columns:** 13  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `survey_period` | character varying(50) | ❌ | - |
| `period_start` | date | ❌ | - |
| `period_end` | date | ❌ | - |
| `questions` | jsonb | ❌ | - |
| `completed` | boolean | ✅ | false |
| `completed_at` | timestamp with time zone | ✅ | - |
| `incentive_credited` | boolean | ✅ | false |
| `incentive_amount` | numeric | ✅ | - |
| `channel` | character varying(50) | ❌ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_periodic_surveys_completed**
  ```sql
  CREATE INDEX idx_periodic_surveys_completed ON public.periodic_surveys USING btree (completed)
  ```

- **idx_periodic_surveys_created_at**
  ```sql
  CREATE INDEX idx_periodic_surveys_created_at ON public.periodic_surveys USING btree (created_at)
  ```

- **idx_periodic_surveys_period_start**
  ```sql
  CREATE INDEX idx_periodic_surveys_period_start ON public.periodic_surveys USING btree (period_start)
  ```

- **idx_periodic_surveys_survey_period**
  ```sql
  CREATE INDEX idx_periodic_surveys_survey_period ON public.periodic_surveys USING btree (survey_period)
  ```

- **idx_periodic_surveys_unique**
  ```sql
  CREATE UNIQUE INDEX idx_periodic_surveys_unique ON public.periodic_surveys USING btree (user_id, survey_period, period_start)
  ```

- **idx_periodic_surveys_user_id**
  ```sql
  CREATE INDEX idx_periodic_surveys_user_id ON public.periodic_surveys USING btree (user_id)
  ```

- **periodic_surveys_pkey**
  ```sql
  CREATE UNIQUE INDEX periodic_surveys_pkey ON public.periodic_surveys USING btree (id)
  ```

---

## pin_audit_logs

**Description:** PIN operation audit trail (setup, change, reset, verify)

**Columns:** 13  
**Indexes:** 6  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | uuid | ❌ | - |
| `staff_id` | uuid | ✅ | - |
| `operation_type` | character varying(50) | ❌ | - |
| `location` | character varying(255) | ❌ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `id_verification_status` | boolean | ✅ | - |
| `reason` | text | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `success` | boolean | ❌ | - |
| `error_message` | text | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_pin_audit_logs_location**
  ```sql
  CREATE INDEX idx_pin_audit_logs_location ON public.pin_audit_logs USING btree (location)
  ```

- **idx_pin_audit_logs_operation_type**
  ```sql
  CREATE INDEX idx_pin_audit_logs_operation_type ON public.pin_audit_logs USING btree (operation_type)
  ```

- **idx_pin_audit_logs_staff_id**
  ```sql
  CREATE INDEX idx_pin_audit_logs_staff_id ON public.pin_audit_logs USING btree (staff_id)
  ```

- **idx_pin_audit_logs_timestamp**
  ```sql
  CREATE INDEX idx_pin_audit_logs_timestamp ON public.pin_audit_logs USING btree ("timestamp" DESC)
  ```

- **idx_pin_audit_logs_user_id**
  ```sql
  CREATE INDEX idx_pin_audit_logs_user_id ON public.pin_audit_logs USING btree (user_id)
  ```

- **pin_audit_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX pin_audit_logs_pkey ON public.pin_audit_logs USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## pin_audit_logs_archive

**Columns:** 13  
**Indexes:** 8  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | uuid | ❌ | - |
| `staff_id` | uuid | ✅ | - |
| `operation_type` | character varying(50) | ❌ | - |
| `location` | character varying(255) | ❌ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `id_verification_status` | boolean | ✅ | - |
| `reason` | text | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `success` | boolean | ❌ | - |
| `error_message` | text | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_pin_audit_logs_archive_timestamp**
  ```sql
  CREATE INDEX idx_pin_audit_logs_archive_timestamp ON public.pin_audit_logs_archive USING btree ("timestamp")
  ```

- **idx_pin_audit_logs_archive_user_id**
  ```sql
  CREATE INDEX idx_pin_audit_logs_archive_user_id ON public.pin_audit_logs_archive USING btree (user_id)
  ```

- **pin_audit_logs_archive_location_idx**
  ```sql
  CREATE INDEX pin_audit_logs_archive_location_idx ON public.pin_audit_logs_archive USING btree (location)
  ```

- **pin_audit_logs_archive_operation_type_idx**
  ```sql
  CREATE INDEX pin_audit_logs_archive_operation_type_idx ON public.pin_audit_logs_archive USING btree (operation_type)
  ```

- **pin_audit_logs_archive_pkey**
  ```sql
  CREATE UNIQUE INDEX pin_audit_logs_archive_pkey ON public.pin_audit_logs_archive USING btree (id)
  ```

- **pin_audit_logs_archive_staff_id_idx**
  ```sql
  CREATE INDEX pin_audit_logs_archive_staff_id_idx ON public.pin_audit_logs_archive USING btree (staff_id)
  ```

- **pin_audit_logs_archive_timestamp_idx**
  ```sql
  CREATE INDEX pin_audit_logs_archive_timestamp_idx ON public.pin_audit_logs_archive USING btree ("timestamp" DESC)
  ```

- **pin_audit_logs_archive_user_id_idx**
  ```sql
  CREATE INDEX pin_audit_logs_archive_user_id_idx ON public.pin_audit_logs_archive USING btree (user_id)
  ```

---

## points_transactions

**Columns:** 13  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `type` | character varying(50) | ❌ | - |
| `amount` | integer | ❌ | - |
| `balance_after` | integer | ❌ | - |
| `source` | character varying(100) | ❌ | - |
| `source_id` | character varying(255) | ✅ | - |
| `description` | text | ✅ | - |
| `multiplier_applied` | numeric | ✅ | 1.00 |
| `base_amount` | integer | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | now() |
| `expires_at` | timestamp with time zone | ✅ | - |

### Indexes

- **idx_points_transactions_created_at**
  ```sql
  CREATE INDEX idx_points_transactions_created_at ON public.points_transactions USING btree (created_at DESC)
  ```

- **idx_points_transactions_source**
  ```sql
  CREATE INDEX idx_points_transactions_source ON public.points_transactions USING btree (source)
  ```

- **idx_points_transactions_type**
  ```sql
  CREATE INDEX idx_points_transactions_type ON public.points_transactions USING btree (type)
  ```

- **idx_points_transactions_user_id**
  ```sql
  CREATE INDEX idx_points_transactions_user_id ON public.points_transactions USING btree (user_id)
  ```

- **points_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX points_transactions_pkey ON public.points_transactions USING btree (id)
  ```

---

## predictions

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `model_id` | uuid | ✅ | - |
| `prediction_type` | text | ❌ | - |
| `input_features` | jsonb | ❌ | - |
| `prediction_result` | jsonb | ❌ | - |
| `confidence` | numeric | ✅ | - |
| `inference_time_ms` | numeric | ✅ | - |
| `reference_type` | text | ✅ | - |
| `reference_id` | uuid | ✅ | - |
| `predicted_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_predictions_model_id**
  ```sql
  CREATE INDEX idx_predictions_model_id ON public.predictions USING btree (model_id, predicted_at DESC)
  ```

- **idx_predictions_reference**
  ```sql
  CREATE INDEX idx_predictions_reference ON public.predictions USING btree (reference_type, reference_id)
  ```

- **idx_predictions_type**
  ```sql
  CREATE INDEX idx_predictions_type ON public.predictions USING btree (prediction_type, predicted_at DESC)
  ```

- **predictions_pkey**
  ```sql
  CREATE UNIQUE INDEX predictions_pkey ON public.predictions USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `model_id` | `ml_models.id` |

---

## premium_subscriptions

**Description:** User subscription plans (Free, Basic, Pro, Business)

**Columns:** 13  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('premium_subscriptions_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `tier` | character varying(20) | ❌ | - |
| `status` | character varying(20) | ❌ | 'active'::character varying |
| `price` | numeric | ❌ | - |
| `features` | jsonb | ❌ | - |
| `start_date` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `end_date` | timestamp without time zone | ✅ | - |
| `auto_renew` | boolean | ❌ | true |
| `next_billing_date` | timestamp without time zone | ✅ | - |
| `payment_method` | character varying(50) | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_subscriptions_next_billing**
  ```sql
  CREATE INDEX idx_subscriptions_next_billing ON public.premium_subscriptions USING btree (next_billing_date)
  ```

- **idx_subscriptions_status**
  ```sql
  CREATE INDEX idx_subscriptions_status ON public.premium_subscriptions USING btree (status)
  ```

- **idx_subscriptions_tier**
  ```sql
  CREATE INDEX idx_subscriptions_tier ON public.premium_subscriptions USING btree (tier)
  ```

- **idx_subscriptions_user_id**
  ```sql
  CREATE INDEX idx_subscriptions_user_id ON public.premium_subscriptions USING btree (user_id)
  ```

- **premium_subscriptions_pkey**
  ```sql
  CREATE UNIQUE INDEX premium_subscriptions_pkey ON public.premium_subscriptions USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## processing_metrics

**Description:** Real-time processing metrics per PSD-3 §13.3 and PSD-12 §13

**Columns:** 19  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `metric_date` | date | ❌ | - |
| `metric_hour` | integer | ❌ | - |
| `total_transactions` | integer | ✅ | 0 |
| `successful_transactions` | integer | ✅ | 0 |
| `failed_transactions` | integer | ✅ | 0 |
| `avg_latency_ms` | numeric | ✅ | 0 |
| `min_latency_ms` | integer | ✅ | - |
| `max_latency_ms` | integer | ✅ | - |
| `p95_latency_ms` | integer | ✅ | - |
| `p99_latency_ms` | integer | ✅ | - |
| `total_value` | numeric | ✅ | 0.00 |
| `currency` | character varying(10) | ✅ | 'NAD'::character varying |
| `uptime_seconds` | integer | ✅ | 3600 |
| `downtime_seconds` | integer | ✅ | 0 |
| `uptime_percentage` | numeric | ✅ | 100.00 |
| `error_count` | integer | ✅ | 0 |
| `timeout_count` | integer | ✅ | 0 |
| `created_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_processing_metrics_date**
  ```sql
  CREATE INDEX idx_processing_metrics_date ON public.processing_metrics USING btree (metric_date DESC)
  ```

- **processing_metrics_metric_date_metric_hour_key**
  ```sql
  CREATE UNIQUE INDEX processing_metrics_metric_date_metric_hour_key ON public.processing_metrics USING btree (metric_date, metric_hour)
  ```

- **processing_metrics_pkey**
  ```sql
  CREATE UNIQUE INDEX processing_metrics_pkey ON public.processing_metrics USING btree (id)
  ```

---

## psp_compliance_status

**Columns:** 8  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `psp_id` | character varying(10) | ✅ | - |
| `psp_name` | character varying(255) | ✅ | - |
| `license_status` | character varying(20) | ✅ | - |
| `aml_compliant` | boolean | ✅ | - |
| `kyc_compliant` | boolean | ✅ | - |
| `cybersecurity_compliant` | boolean | ✅ | - |
| `capital_requirements_met` | boolean | ✅ | - |
| `overall_compliance` | text | ✅ | - |
---

## psp_registry

**Description:** Payment Service Provider registry (PSD-1 compliant)

**Columns:** 22  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `psp_id` | character varying(10) | ❌ | - |
| `psp_name` | character varying(255) | ❌ | - |
| `license_number` | character varying(50) | ❌ | - |
| `license_type` | character varying(10) | ❌ | - |
| `license_status` | character varying(20) | ❌ | 'active'::character varying |
| `aml_compliant` | boolean | ❌ | false |
| `kyc_compliant` | boolean | ❌ | false |
| `cybersecurity_compliant` | boolean | ❌ | false |
| `capital_requirements_met` | boolean | ❌ | false |
| `contact_email` | character varying(255) | ✅ | - |
| `contact_phone` | character varying(50) | ✅ | - |
| `registered_address` | text | ✅ | - |
| `supported_networks` | ARRAY | ✅ | '{}'::text[] |
| `license_issued_date` | date | ❌ | - |
| `license_expiry_date` | date | ❌ | - |
| `registered_at` | timestamp with time zone | ❌ | now() |
| `last_compliance_check` | timestamp with time zone | ✅ | - |
| `suspended_at` | timestamp with time zone | ✅ | - |
| `revoked_at` | timestamp with time zone | ✅ | - |
| `suspended_reason` | text | ✅ | - |
| `revoked_reason` | text | ✅ | - |
| `metadata` | jsonb | ✅ | - |

### Indexes

- **idx_psp_compliance**
  ```sql
  CREATE INDEX idx_psp_compliance ON public.psp_registry USING btree (aml_compliant, kyc_compliant, cybersecurity_compliant)
  ```

- **idx_psp_expiry**
  ```sql
  CREATE INDEX idx_psp_expiry ON public.psp_registry USING btree (license_expiry_date)
  ```

- **idx_psp_networks**
  ```sql
  CREATE INDEX idx_psp_networks ON public.psp_registry USING gin (supported_networks)
  ```

- **idx_psp_status**
  ```sql
  CREATE INDEX idx_psp_status ON public.psp_registry USING btree (license_status)
  ```

- **idx_psp_type**
  ```sql
  CREATE INDEX idx_psp_type ON public.psp_registry USING btree (license_type)
  ```

- **psp_registry_license_number_key**
  ```sql
  CREATE UNIQUE INDEX psp_registry_license_number_key ON public.psp_registry USING btree (license_number)
  ```

- **psp_registry_pkey**
  ```sql
  CREATE UNIQUE INDEX psp_registry_pkey ON public.psp_registry USING btree (psp_id)
  ```

---

## push_tokens

**Columns:** 9  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `token` | text | ❌ | - |
| `platform` | character varying(20) | ❌ | - |
| `device_id` | character varying(255) | ✅ | - |
| `device_name` | character varying(255) | ✅ | - |
| `is_active` | boolean | ✅ | true |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_push_tokens_active**
  ```sql
  CREATE INDEX idx_push_tokens_active ON public.push_tokens USING btree (is_active)
  ```

- **idx_push_tokens_token**
  ```sql
  CREATE INDEX idx_push_tokens_token ON public.push_tokens USING btree (token)
  ```

- **idx_push_tokens_unique**
  ```sql
  CREATE UNIQUE INDEX idx_push_tokens_unique ON public.push_tokens USING btree (user_id, token)
  ```

- **idx_push_tokens_user**
  ```sql
  CREATE INDEX idx_push_tokens_user ON public.push_tokens USING btree (user_id)
  ```

- **push_tokens_pkey**
  ```sql
  CREATE UNIQUE INDEX push_tokens_pkey ON public.push_tokens USING btree (id)
  ```

---

## quests

**Columns:** 17  
**Indexes:** 1  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | character varying(100) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `icon` | character varying(100) | ❌ | - |
| `type` | character varying(50) | ❌ | - |
| `category` | character varying(50) | ❌ | - |
| `requirement_type` | character varying(50) | ❌ | - |
| `requirement_value` | integer | ❌ | - |
| `requirement_action` | character varying(100) | ✅ | - |
| `points_reward` | integer | ❌ | 0 |
| `xp_reward` | integer | ❌ | 0 |
| `duration_hours` | integer | ✅ | - |
| `cooldown_hours` | integer | ✅ | - |
| `is_active` | boolean | ✅ | true |
| `difficulty` | character varying(20) | ✅ | 'easy'::character varying |
| `display_order` | integer | ✅ | 0 |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **quests_pkey**
  ```sql
  CREATE UNIQUE INDEX quests_pkey ON public.quests USING btree (id)
  ```

---

## quiz_attempts

**Description:** History of quiz attempts with scores and answers

**Columns:** 12  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('quiz_attempts_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `module_id` | character varying(100) | ❌ | - |
| `attempt_number` | integer | ❌ | 1 |
| `score` | integer | ❌ | - |
| `total_questions` | integer | ❌ | - |
| `correct_answers` | integer | ❌ | - |
| `passed` | boolean | ❌ | - |
| `time_taken_minutes` | integer | ✅ | - |
| `answers` | jsonb | ❌ | - |
| `bp_earned` | integer | ❌ | 0 |
| `attempted_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_quiz_attempts_attempted_at**
  ```sql
  CREATE INDEX idx_quiz_attempts_attempted_at ON public.quiz_attempts USING btree (attempted_at DESC)
  ```

- **idx_quiz_attempts_module_id**
  ```sql
  CREATE INDEX idx_quiz_attempts_module_id ON public.quiz_attempts USING btree (module_id)
  ```

- **idx_quiz_attempts_passed**
  ```sql
  CREATE INDEX idx_quiz_attempts_passed ON public.quiz_attempts USING btree (passed)
  ```

- **idx_quiz_attempts_user_id**
  ```sql
  CREATE INDEX idx_quiz_attempts_user_id ON public.quiz_attempts USING btree (user_id)
  ```

- **quiz_attempts_pkey**
  ```sql
  CREATE UNIQUE INDEX quiz_attempts_pkey ON public.quiz_attempts USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `module_id` | `financial_literacy_modules.module_id` |
| `user_id` | `users.id` |

---

## quiz_questions

**Description:** Quiz questions for each module with multiple question types

**Columns:** 10  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('quiz_questions_id_seq'::regclass) |
| `question_id` | character varying(100) | ❌ | - |
| `module_id` | character varying(100) | ❌ | - |
| `question_text` | text | ❌ | - |
| `question_type` | character varying(20) | ❌ | - |
| `options` | jsonb | ❌ | - |
| `correct_answer` | character varying(255) | ❌ | - |
| `explanation` | text | ❌ | - |
| `points` | integer | ❌ | 10 |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_quiz_questions_module_id**
  ```sql
  CREATE INDEX idx_quiz_questions_module_id ON public.quiz_questions USING btree (module_id)
  ```

- **idx_quiz_questions_question_id**
  ```sql
  CREATE INDEX idx_quiz_questions_question_id ON public.quiz_questions USING btree (question_id)
  ```

- **quiz_questions_pkey**
  ```sql
  CREATE UNIQUE INDEX quiz_questions_pkey ON public.quiz_questions USING btree (id)
  ```

- **quiz_questions_question_id_key**
  ```sql
  CREATE UNIQUE INDEX quiz_questions_question_id_key ON public.quiz_questions USING btree (question_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `module_id` | `financial_literacy_modules.module_id` |

---

## rank_up_events

**Description:** Record of rank progression events with unlocked benefits

**Columns:** 8  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('rank_up_events_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `old_rank` | character varying(10) | ❌ | - |
| `new_rank` | character varying(10) | ❌ | - |
| `level` | integer | ❌ | - |
| `total_bp` | integer | ❌ | - |
| `benefits_unlocked` | jsonb | ❌ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_rank_up_events_created_at**
  ```sql
  CREATE INDEX idx_rank_up_events_created_at ON public.rank_up_events USING btree (created_at DESC)
  ```

- **idx_rank_up_events_new_rank**
  ```sql
  CREATE INDEX idx_rank_up_events_new_rank ON public.rank_up_events USING btree (new_rank)
  ```

- **idx_rank_up_events_user_id**
  ```sql
  CREATE INDEX idx_rank_up_events_user_id ON public.rank_up_events USING btree (user_id)
  ```

- **rank_up_events_pkey**
  ```sql
  CREATE UNIQUE INDEX rank_up_events_pkey ON public.rank_up_events USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## recent_cybersecurity_events

**Columns:** 8  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `event_id` | character varying(50) | ✅ | - |
| `event_type` | character varying(50) | ✅ | - |
| `severity` | character varying(20) | ✅ | - |
| `title` | character varying(255) | ✅ | - |
| `status` | character varying(20) | ✅ | - |
| `detected_at` | timestamp with time zone | ✅ | - |
| `reported_to_bon` | boolean | ✅ | - |
| `hours_since_detection` | numeric | ✅ | - |
---

## recommendation_effectiveness

**Columns:** 7  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `recommendation_id` | uuid | ❌ | - |
| `outcome` | character varying(50) | ✅ | - |
| `user_satisfaction` | integer | ✅ | - |
| `wait_time_reduction` | integer | ✅ | - |
| `distance_optimization` | numeric | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_recommendation_effectiveness_outcome**
  ```sql
  CREATE INDEX idx_recommendation_effectiveness_outcome ON public.recommendation_effectiveness USING btree (outcome)
  ```

- **idx_recommendation_effectiveness_recommendation**
  ```sql
  CREATE INDEX idx_recommendation_effectiveness_recommendation ON public.recommendation_effectiveness USING btree (recommendation_id)
  ```

- **recommendation_effectiveness_pkey**
  ```sql
  CREATE UNIQUE INDEX recommendation_effectiveness_pkey ON public.recommendation_effectiveness USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `recommendation_id` | `recommendations.id` |

---

## recommendations

**Columns:** 9  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `recommendation_type` | character varying(50) | ❌ | - |
| `primary_recommendation` | jsonb | ❌ | - |
| `alternatives` | jsonb | ✅ | - |
| `concentration_alert` | jsonb | ✅ | - |
| `user_action` | character varying(50) | ✅ | - |
| `action_timestamp` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_recommendations_action**
  ```sql
  CREATE INDEX idx_recommendations_action ON public.recommendations USING btree (user_action)
  ```

- **idx_recommendations_created**
  ```sql
  CREATE INDEX idx_recommendations_created ON public.recommendations USING btree (created_at DESC)
  ```

- **idx_recommendations_type**
  ```sql
  CREATE INDEX idx_recommendations_type ON public.recommendations USING btree (recommendation_type)
  ```

- **idx_recommendations_user**
  ```sql
  CREATE INDEX idx_recommendations_user ON public.recommendations USING btree (user_id)
  ```

- **recommendations_pkey**
  ```sql
  CREATE UNIQUE INDEX recommendations_pkey ON public.recommendations USING btree (id)
  ```

---

## reconciliation_records

**Columns:** 9  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `voucher_id` | character varying(100) | ❌ | - |
| `reconciliation_date` | date | ❌ | - |
| `ketchup_status` | character varying(50) | ❌ | - |
| `buffr_status` | character varying(50) | ❌ | - |
| `match` | boolean | ❌ | - |
| `discrepancy` | text | ✅ | - |
| `last_verified` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_reconciliation_records_date**
  ```sql
  CREATE INDEX idx_reconciliation_records_date ON public.reconciliation_records USING btree (reconciliation_date)
  ```

- **idx_reconciliation_records_match**
  ```sql
  CREATE INDEX idx_reconciliation_records_match ON public.reconciliation_records USING btree (match)
  ```

- **idx_reconciliation_records_voucher_id**
  ```sql
  CREATE INDEX idx_reconciliation_records_voucher_id ON public.reconciliation_records USING btree (voucher_id)
  ```

- **reconciliation_records_pkey**
  ```sql
  CREATE UNIQUE INDEX reconciliation_records_pkey ON public.reconciliation_records USING btree (id)
  ```

---

## revenue_reports

**Description:** Periodic revenue reports and aggregations

**Columns:** 13  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('revenue_reports_id_seq'::regclass) |
| `report_period` | character varying(20) | ❌ | - |
| `start_date` | timestamp without time zone | ❌ | - |
| `end_date` | timestamp without time zone | ❌ | - |
| `total_revenue` | numeric | ❌ | - |
| `transaction_fees` | numeric | ❌ | 0.00 |
| `account_fees` | numeric | ❌ | 0.00 |
| `loan_revenue` | numeric | ❌ | 0.00 |
| `ai_tokens_revenue` | numeric | ❌ | 0.00 |
| `subscription_revenue` | numeric | ❌ | 0.00 |
| `total_users` | integer | ❌ | 0 |
| `active_users` | integer | ❌ | 0 |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_revenue_reports_dates**
  ```sql
  CREATE INDEX idx_revenue_reports_dates ON public.revenue_reports USING btree (start_date, end_date)
  ```

- **idx_revenue_reports_period**
  ```sql
  CREATE INDEX idx_revenue_reports_period ON public.revenue_reports USING btree (report_period)
  ```

- **revenue_reports_pkey**
  ```sql
  CREATE UNIQUE INDEX revenue_reports_pkey ON public.revenue_reports USING btree (id)
  ```

---

## revenue_transactions

**Description:** All revenue transactions across multiple streams

**Columns:** 8  
**Indexes:** 6  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('revenue_transactions_id_seq'::regclass) |
| `transaction_id` | character varying(255) | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `revenue_stream` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `description` | text | ❌ | - |
| `metadata` | jsonb | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_revenue_transactions_amount**
  ```sql
  CREATE INDEX idx_revenue_transactions_amount ON public.revenue_transactions USING btree (amount DESC)
  ```

- **idx_revenue_transactions_created_at**
  ```sql
  CREATE INDEX idx_revenue_transactions_created_at ON public.revenue_transactions USING btree (created_at DESC)
  ```

- **idx_revenue_transactions_stream**
  ```sql
  CREATE INDEX idx_revenue_transactions_stream ON public.revenue_transactions USING btree (revenue_stream)
  ```

- **idx_revenue_transactions_user_id**
  ```sql
  CREATE INDEX idx_revenue_transactions_user_id ON public.revenue_transactions USING btree (user_id)
  ```

- **revenue_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX revenue_transactions_pkey ON public.revenue_transactions USING btree (id)
  ```

- **revenue_transactions_transaction_id_key**
  ```sql
  CREATE UNIQUE INDEX revenue_transactions_transaction_id_key ON public.revenue_transactions USING btree (transaction_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## rewards

**Columns:** 19  
**Indexes:** 1  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | character varying(100) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `icon` | character varying(100) | ❌ | - |
| `image_url` | text | ✅ | - |
| `type` | character varying(50) | ❌ | - |
| `category` | character varying(50) | ✅ | - |
| `points_cost` | integer | ❌ | - |
| `value_type` | character varying(50) | ✅ | - |
| `value_amount` | numeric | ✅ | - |
| `stock` | integer | ✅ | - |
| `max_per_user` | integer | ✅ | - |
| `valid_days` | integer | ✅ | 30 |
| `min_level` | integer | ✅ | 1 |
| `is_active` | boolean | ✅ | true |
| `is_featured` | boolean | ✅ | false |
| `display_order` | integer | ✅ | 0 |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **rewards_pkey**
  ```sql
  CREATE UNIQUE INDEX rewards_pkey ON public.rewards USING btree (id)
  ```

---

## savings_analytics

**Description:** Daily analytics on savings wallet adoption and usage

**Columns:** 13  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `date` | date | ❌ | - |
| `total_savings_wallets` | integer | ✅ | 0 |
| `total_savings_balance` | numeric | ✅ | 0 |
| `average_savings_balance` | numeric | ✅ | 0 |
| `total_interest_earned` | numeric | ✅ | 0 |
| `active_savings_goals` | integer | ✅ | 0 |
| `completed_savings_goals` | integer | ✅ | 0 |
| `total_deposits` | numeric | ✅ | 0 |
| `total_withdrawals` | numeric | ✅ | 0 |
| `adoption_rate` | numeric | ✅ | 0 |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_savings_analytics_date**
  ```sql
  CREATE INDEX idx_savings_analytics_date ON public.savings_analytics USING btree (date)
  ```

- **savings_analytics_date_key**
  ```sql
  CREATE UNIQUE INDEX savings_analytics_date_key ON public.savings_analytics USING btree (date)
  ```

- **savings_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX savings_analytics_pkey ON public.savings_analytics USING btree (id)
  ```

---

## savings_goals

**Description:** Savings goals with progress tracking and auto-transfer rules

**Columns:** 16  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `savings_wallet_id` | uuid | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `target_amount` | numeric | ❌ | - |
| `current_amount` | numeric | ❌ | 0 |
| `target_date` | date | ✅ | - |
| `status` | character varying(50) | ✅ | 'active'::character varying |
| `completed_at` | timestamp with time zone | ✅ | - |
| `auto_transfer_enabled` | boolean | ✅ | false |
| `auto_transfer_amount` | numeric | ✅ | - |
| `auto_transfer_frequency` | character varying(50) | ✅ | - |
| `round_up_enabled` | boolean | ✅ | false |
| `round_up_multiple` | numeric | ✅ | 10 |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_savings_goals_savings_wallet_id**
  ```sql
  CREATE INDEX idx_savings_goals_savings_wallet_id ON public.savings_goals USING btree (savings_wallet_id)
  ```

- **idx_savings_goals_status**
  ```sql
  CREATE INDEX idx_savings_goals_status ON public.savings_goals USING btree (status)
  ```

- **idx_savings_goals_target_date**
  ```sql
  CREATE INDEX idx_savings_goals_target_date ON public.savings_goals USING btree (target_date) WHERE (target_date IS NOT NULL)
  ```

- **idx_savings_goals_user_id**
  ```sql
  CREATE INDEX idx_savings_goals_user_id ON public.savings_goals USING btree (user_id)
  ```

- **savings_goals_pkey**
  ```sql
  CREATE UNIQUE INDEX savings_goals_pkey ON public.savings_goals USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `savings_wallet_id` | `savings_wallets.id` |

---

## savings_interest_calculations

**Description:** Daily interest calculation log for audit and analytics

**Columns:** 8  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `savings_wallet_id` | uuid | ❌ | - |
| `calculation_date` | date | ❌ | - |
| `balance_at_calculation` | numeric | ❌ | - |
| `interest_rate` | numeric | ❌ | - |
| `interest_earned` | numeric | ❌ | - |
| `days_in_period` | integer | ❌ | - |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_savings_interest_calculations_calculation_date**
  ```sql
  CREATE INDEX idx_savings_interest_calculations_calculation_date ON public.savings_interest_calculations USING btree (calculation_date)
  ```

- **idx_savings_interest_calculations_savings_wallet_id**
  ```sql
  CREATE INDEX idx_savings_interest_calculations_savings_wallet_id ON public.savings_interest_calculations USING btree (savings_wallet_id)
  ```

- **idx_savings_interest_calculations_unique**
  ```sql
  CREATE UNIQUE INDEX idx_savings_interest_calculations_unique ON public.savings_interest_calculations USING btree (savings_wallet_id, calculation_date)
  ```

- **savings_interest_calculations_pkey**
  ```sql
  CREATE UNIQUE INDEX savings_interest_calculations_pkey ON public.savings_interest_calculations USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `savings_wallet_id` | `savings_wallets.id` |

---

## savings_transactions

**Description:** All transactions on savings wallets (deposits, withdrawals, interest, goal transfers)

**Columns:** 10  
**Indexes:** 6  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `savings_wallet_id` | uuid | ❌ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `balance_after` | numeric | ❌ | - |
| `goal_id` | uuid | ✅ | - |
| `source_transaction_id` | uuid | ✅ | - |
| `description` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_savings_transactions_created_at**
  ```sql
  CREATE INDEX idx_savings_transactions_created_at ON public.savings_transactions USING btree (created_at)
  ```

- **idx_savings_transactions_goal_id**
  ```sql
  CREATE INDEX idx_savings_transactions_goal_id ON public.savings_transactions USING btree (goal_id)
  ```

- **idx_savings_transactions_savings_wallet_id**
  ```sql
  CREATE INDEX idx_savings_transactions_savings_wallet_id ON public.savings_transactions USING btree (savings_wallet_id)
  ```

- **idx_savings_transactions_source_transaction_id**
  ```sql
  CREATE INDEX idx_savings_transactions_source_transaction_id ON public.savings_transactions USING btree (source_transaction_id)
  ```

- **idx_savings_transactions_transaction_type**
  ```sql
  CREATE INDEX idx_savings_transactions_transaction_type ON public.savings_transactions USING btree (transaction_type)
  ```

- **savings_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX savings_transactions_pkey ON public.savings_transactions USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `goal_id` | `savings_goals.id` |
| `savings_wallet_id` | `savings_wallets.id` |

---

## savings_wallets

**Description:** Interest-bearing savings wallets separate from main wallet

**Columns:** 15  
**Indexes:** 6  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ❌ | - |
| `wallet_id` | uuid | ✅ | - |
| `name` | character varying(255) | ❌ | 'Savings'::character varying |
| `balance` | numeric | ❌ | 0 |
| `available_balance` | numeric | ❌ | 0 |
| `locked_balance` | numeric | ❌ | 0 |
| `interest_rate` | numeric | ❌ | 2.5 |
| `interest_earned` | numeric | ❌ | 0 |
| `last_interest_calculation_date` | date | ✅ | - |
| `lock_period_days` | integer | ✅ | - |
| `lock_until_date` | date | ✅ | - |
| `status` | character varying(50) | ✅ | 'active'::character varying |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_savings_wallets_lock_until_date**
  ```sql
  CREATE INDEX idx_savings_wallets_lock_until_date ON public.savings_wallets USING btree (lock_until_date) WHERE (lock_until_date IS NOT NULL)
  ```

- **idx_savings_wallets_status**
  ```sql
  CREATE INDEX idx_savings_wallets_status ON public.savings_wallets USING btree (status)
  ```

- **idx_savings_wallets_user_id**
  ```sql
  CREATE INDEX idx_savings_wallets_user_id ON public.savings_wallets USING btree (user_id)
  ```

- **idx_savings_wallets_user_unique**
  ```sql
  CREATE UNIQUE INDEX idx_savings_wallets_user_unique ON public.savings_wallets USING btree (user_id)
  ```

- **idx_savings_wallets_wallet_id**
  ```sql
  CREATE INDEX idx_savings_wallets_wallet_id ON public.savings_wallets USING btree (wallet_id)
  ```

- **savings_wallets_pkey**
  ```sql
  CREATE UNIQUE INDEX savings_wallets_pkey ON public.savings_wallets USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `wallet_id` | `wallets.id` |

---

## schema_migrations

**Description:** Tracks applied database migrations

**Columns:** 4  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('schema_migrations_id_seq'::regclass) |
| `version` | character varying(255) | ❌ | - |
| `name` | character varying(255) | ❌ | - |
| `applied_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_schema_migrations_version**
  ```sql
  CREATE INDEX idx_schema_migrations_version ON public.schema_migrations USING btree (version)
  ```

- **schema_migrations_pkey**
  ```sql
  CREATE UNIQUE INDEX schema_migrations_pkey ON public.schema_migrations USING btree (id)
  ```

- **schema_migrations_version_key**
  ```sql
  CREATE UNIQUE INDEX schema_migrations_version_key ON public.schema_migrations USING btree (version)
  ```

---

## security_incidents

**Description:** Security incident tracking per PSD-12 §11.13-15

**Columns:** 41  
**Indexes:** 8  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `incident_number` | character varying(50) | ❌ | - |
| `incident_type` | character varying(50) | ❌ | - |
| `severity` | character varying(20) | ❌ | - |
| `status` | character varying(30) | ❌ | 'detected'::character varying |
| `detected_at` | timestamp without time zone | ❌ | - |
| `detected_by` | character varying(255) | ✅ | - |
| `detection_method` | character varying(100) | ✅ | - |
| `contained_at` | timestamp without time zone | ✅ | - |
| `resolved_at` | timestamp without time zone | ✅ | - |
| `closed_at` | timestamp without time zone | ✅ | - |
| `preliminary_notification_sent_at` | timestamp without time zone | ✅ | - |
| `preliminary_notification_deadline` | timestamp without time zone | ✅ | - |
| `impact_assessment_due_at` | timestamp without time zone | ✅ | - |
| `impact_assessment_submitted_at` | timestamp without time zone | ✅ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ❌ | - |
| `attack_vector` | text | ✅ | - |
| `affected_systems` | ARRAY | ✅ | - |
| `root_cause` | text | ✅ | - |
| `financial_loss` | numeric | ✅ | 0.00 |
| `financial_loss_currency` | character varying(10) | ✅ | 'NAD'::character varying |
| `customers_affected` | integer | ✅ | 0 |
| `data_records_affected` | integer | ✅ | 0 |
| `data_types_exposed` | ARRAY | ✅ | - |
| `availability_impact_hours` | numeric | ✅ | 0 |
| `immediate_actions_taken` | text | ✅ | - |
| `containment_measures` | text | ✅ | - |
| `remediation_steps` | text | ✅ | - |
| `reported_to_bon` | boolean | ✅ | false |
| `bon_reference_number` | character varying(100) | ✅ | - |
| `reported_to_fic` | boolean | ✅ | false |
| `fic_reference_number` | character varying(100) | ✅ | - |
| `lessons_learned` | text | ✅ | - |
| `preventive_measures` | text | ✅ | - |
| `follow_up_required` | boolean | ✅ | false |
| `follow_up_actions` | text | ✅ | - |
| `created_by` | character varying(255) | ❌ | - |
| `updated_by` | character varying(255) | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_incidents_detected_at**
  ```sql
  CREATE INDEX idx_incidents_detected_at ON public.security_incidents USING btree (detected_at DESC)
  ```

- **idx_incidents_notification_deadline**
  ```sql
  CREATE INDEX idx_incidents_notification_deadline ON public.security_incidents USING btree (preliminary_notification_deadline) WHERE (preliminary_notification_sent_at IS NULL)
  ```

- **idx_incidents_number**
  ```sql
  CREATE INDEX idx_incidents_number ON public.security_incidents USING btree (incident_number)
  ```

- **idx_incidents_severity**
  ```sql
  CREATE INDEX idx_incidents_severity ON public.security_incidents USING btree (severity)
  ```

- **idx_incidents_status**
  ```sql
  CREATE INDEX idx_incidents_status ON public.security_incidents USING btree (status)
  ```

- **idx_incidents_type**
  ```sql
  CREATE INDEX idx_incidents_type ON public.security_incidents USING btree (incident_type)
  ```

- **security_incidents_incident_number_key**
  ```sql
  CREATE UNIQUE INDEX security_incidents_incident_number_key ON public.security_incidents USING btree (incident_number)
  ```

- **security_incidents_pkey**
  ```sql
  CREATE UNIQUE INDEX security_incidents_pkey ON public.security_incidents USING btree (id)
  ```

---

## service_level_metrics

**Description:** Service level metrics for Namibian Open Banking compliance (99.9% availability, 300ms response time)

**Columns:** 12  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('service_level_metrics_id_seq'::regclass) |
| `endpoint` | character varying(255) | ❌ | - |
| `participant_id` | character varying(10) | ✅ | - |
| `request_count` | integer | ❌ | 0 |
| `success_count` | integer | ❌ | 0 |
| `error_count` | integer | ❌ | 0 |
| `total_response_time_ms` | bigint | ❌ | 0 |
| `min_response_time_ms` | integer | ✅ | - |
| `max_response_time_ms` | integer | ✅ | - |
| `period_start` | timestamp without time zone | ❌ | - |
| `period_end` | timestamp without time zone | ❌ | - |
| `created_at` | timestamp without time zone | ❌ | now() |

### Indexes

- **idx_slm_created**
  ```sql
  CREATE INDEX idx_slm_created ON public.service_level_metrics USING btree (created_at)
  ```

- **idx_slm_endpoint**
  ```sql
  CREATE INDEX idx_slm_endpoint ON public.service_level_metrics USING btree (endpoint)
  ```

- **idx_slm_participant**
  ```sql
  CREATE INDEX idx_slm_participant ON public.service_level_metrics USING btree (participant_id)
  ```

- **idx_slm_period**
  ```sql
  CREATE INDEX idx_slm_period ON public.service_level_metrics USING btree (period_start, period_end)
  ```

- **service_level_metrics_pkey**
  ```sql
  CREATE UNIQUE INDEX service_level_metrics_pkey ON public.service_level_metrics USING btree (id)
  ```

- **unique_endpoint_participant_period**
  ```sql
  CREATE UNIQUE INDEX unique_endpoint_participant_period ON public.service_level_metrics USING btree (endpoint, participant_id, period_start)
  ```

---

## sessions

**Description:** User authentication sessions with access and refresh tokens

**Columns:** 6  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `expires_at` | timestamp with time zone | ✅ | - |

### Indexes

- **idx_sessions_expires**
  ```sql
  CREATE INDEX idx_sessions_expires ON public.sessions USING btree (expires_at)
  ```

- **idx_sessions_expires_at**
  ```sql
  CREATE INDEX idx_sessions_expires_at ON public.sessions USING btree (expires_at)
  ```

- **idx_sessions_user_id**
  ```sql
  CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id)
  ```

- **sessions_pkey**
  ```sql
  CREATE UNIQUE INDEX sessions_pkey ON public.sessions USING btree (id)
  ```

---

## settlement_batches

**Description:** Daily settlement batches per PSD-3 §13.3

**Columns:** 19  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `batch_number` | character varying(50) | ❌ | - |
| `batch_date` | date | ❌ | - |
| `batch_type` | character varying(20) | ❌ | 'daily'::character varying |
| `status` | character varying(20) | ❌ | 'pending'::character varying |
| `started_at` | timestamp without time zone | ✅ | - |
| `completed_at` | timestamp without time zone | ✅ | - |
| `total_transactions` | integer | ✅ | 0 |
| `total_credit_amount` | numeric | ✅ | 0.00 |
| `total_debit_amount` | numeric | ✅ | 0.00 |
| `net_amount` | numeric | ✅ | 0.00 |
| `currency` | character varying(10) | ✅ | 'NAD'::character varying |
| `successful_transactions` | integer | ✅ | 0 |
| `failed_transactions` | integer | ✅ | 0 |
| `error_message` | text | ✅ | - |
| `retry_count` | integer | ✅ | 0 |
| `created_by` | character varying(255) | ✅ | 'system'::character varying |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_settlement_batches_date**
  ```sql
  CREATE INDEX idx_settlement_batches_date ON public.settlement_batches USING btree (batch_date DESC)
  ```

- **idx_settlement_batches_status**
  ```sql
  CREATE INDEX idx_settlement_batches_status ON public.settlement_batches USING btree (status)
  ```

- **settlement_batches_batch_number_key**
  ```sql
  CREATE UNIQUE INDEX settlement_batches_batch_number_key ON public.settlement_batches USING btree (batch_number)
  ```

- **settlement_batches_pkey**
  ```sql
  CREATE UNIQUE INDEX settlement_batches_pkey ON public.settlement_batches USING btree (id)
  ```

---

## signature_certificates

**Columns:** 14  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ❌ | - |
| `certificate_id` | text | ❌ | - |
| `public_key` | text | ❌ | - |
| `algorithm` | text | ❌ | 'RSA_SHA256'::text |
| `key_size` | integer | ❌ | 2048 |
| `issued_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `expires_at` | timestamp with time zone | ✅ | - |
| `revoked` | boolean | ✅ | false |
| `revoked_at` | timestamp with time zone | ✅ | - |
| `revocation_reason` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_signature_certificates_certificate_id**
  ```sql
  CREATE INDEX idx_signature_certificates_certificate_id ON public.signature_certificates USING btree (certificate_id)
  ```

- **idx_signature_certificates_revoked**
  ```sql
  CREATE INDEX idx_signature_certificates_revoked ON public.signature_certificates USING btree (revoked, expires_at)
  ```

- **idx_signature_certificates_user_id**
  ```sql
  CREATE INDEX idx_signature_certificates_user_id ON public.signature_certificates USING btree (user_id)
  ```

- **signature_certificates_certificate_id_key**
  ```sql
  CREATE UNIQUE INDEX signature_certificates_certificate_id_key ON public.signature_certificates USING btree (certificate_id)
  ```

- **signature_certificates_pkey**
  ```sql
  CREATE UNIQUE INDEX signature_certificates_pkey ON public.signature_certificates USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## spending_analyses

**Columns:** 14  
**Indexes:** 3  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `session_id` | uuid | ✅ | - |
| `user_id` | uuid | ✅ | - |
| `period_start` | date | ❌ | - |
| `period_end` | date | ❌ | - |
| `total_spending` | numeric | ✅ | - |
| `spending_trend` | text | ✅ | - |
| `is_unusual_spending` | boolean | ✅ | - |
| `top_categories` | jsonb | ✅ | '[]'::jsonb |
| `spending_by_category` | jsonb | ✅ | '{}'::jsonb |
| `insights` | jsonb | ✅ | '[]'::jsonb |
| `recommendations` | jsonb | ✅ | '[]'::jsonb |
| `analyzed_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_spending_analyses_session_id**
  ```sql
  CREATE INDEX idx_spending_analyses_session_id ON public.spending_analyses USING btree (session_id)
  ```

- **idx_spending_analyses_user_id**
  ```sql
  CREATE INDEX idx_spending_analyses_user_id ON public.spending_analyses USING btree (user_id, analyzed_at DESC)
  ```

- **spending_analyses_pkey**
  ```sql
  CREATE UNIQUE INDEX spending_analyses_pkey ON public.spending_analyses USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `session_id` | `sessions.id` |
| `user_id` | `users.id` |

---

## spending_personas

**Columns:** 10  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ✅ | - |
| `primary_persona` | text | ❌ | - |
| `primary_confidence` | numeric | ✅ | - |
| `persona_distribution` | jsonb | ✅ | '{}'::jsonb |
| `cluster_id` | integer | ✅ | - |
| `cluster_size` | integer | ✅ | - |
| `assigned_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `model_version` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_spending_personas_primary**
  ```sql
  CREATE INDEX idx_spending_personas_primary ON public.spending_personas USING btree (primary_persona)
  ```

- **idx_spending_personas_user_id**
  ```sql
  CREATE INDEX idx_spending_personas_user_id ON public.spending_personas USING btree (user_id, assigned_at DESC)
  ```

- **spending_personas_pkey**
  ```sql
  CREATE UNIQUE INDEX spending_personas_pkey ON public.spending_personas USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## split_bill_participants

**Description:** Participants in split bills with their payment status

**Columns:** 9  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `split_bill_id` | uuid | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `amount` | numeric | ❌ | - |
| `paid_amount` | numeric | ✅ | 0.00 |
| `status` | character varying(50) | ✅ | 'pending'::character varying |
| `paid_at` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_split_bill_participants_split_bill_id**
  ```sql
  CREATE INDEX idx_split_bill_participants_split_bill_id ON public.split_bill_participants USING btree (split_bill_id)
  ```

- **idx_split_bill_participants_status**
  ```sql
  CREATE INDEX idx_split_bill_participants_status ON public.split_bill_participants USING btree (status)
  ```

- **idx_split_bill_participants_user_id**
  ```sql
  CREATE INDEX idx_split_bill_participants_user_id ON public.split_bill_participants USING btree (user_id)
  ```

- **split_bill_participants_pkey**
  ```sql
  CREATE UNIQUE INDEX split_bill_participants_pkey ON public.split_bill_participants USING btree (id)
  ```

- **split_bill_participants_split_bill_id_user_id_key**
  ```sql
  CREATE UNIQUE INDEX split_bill_participants_split_bill_id_user_id_key ON public.split_bill_participants USING btree (split_bill_id, user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `split_bill_id` | `split_bills.id` |
| `user_id` | `users.id` |

---

## split_bills

**Description:** Split bill records for group bill splitting

**Columns:** 13  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `creator_id` | uuid | ❌ | - |
| `total_amount` | numeric | ❌ | - |
| `currency` | character varying(10) | ✅ | 'NAD'::character varying |
| `description` | text | ✅ | - |
| `status` | character varying(50) | ✅ | 'pending'::character varying |
| `wallet_id` | uuid | ✅ | - |
| `paid_amount` | numeric | ✅ | 0.00 |
| `settled_at` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |
| `title` | character varying(255) | ✅ | - |
| `due_date` | timestamp without time zone | ✅ | - |

### Indexes

- **idx_split_bills_created_at**
  ```sql
  CREATE INDEX idx_split_bills_created_at ON public.split_bills USING btree (created_at DESC)
  ```

- **idx_split_bills_creator_id**
  ```sql
  CREATE INDEX idx_split_bills_creator_id ON public.split_bills USING btree (creator_id)
  ```

- **idx_split_bills_due_date**
  ```sql
  CREATE INDEX idx_split_bills_due_date ON public.split_bills USING btree (due_date) WHERE (due_date IS NOT NULL)
  ```

- **idx_split_bills_status**
  ```sql
  CREATE INDEX idx_split_bills_status ON public.split_bills USING btree (status)
  ```

- **split_bills_pkey**
  ```sql
  CREATE UNIQUE INDEX split_bills_pkey ON public.split_bills USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `creator_id` | `users.id` |
| `wallet_id` | `wallets.id` |

---

## staff_audit_logs

**Description:** Staff action audit trail (all admin/staff operations)

**Columns:** 15  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `staff_id` | uuid | ❌ | - |
| `action_type` | character varying(100) | ❌ | - |
| `target_entity_type` | character varying(50) | ❌ | - |
| `target_entity_id` | uuid | ❌ | - |
| `location` | character varying(255) | ❌ | - |
| `action_details` | jsonb | ✅ | - |
| `authorization_level` | character varying(50) | ✅ | - |
| `biometric_verification_required` | boolean | ✅ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `success` | boolean | ❌ | - |
| `error_message` | text | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_staff_audit_logs_action_type**
  ```sql
  CREATE INDEX idx_staff_audit_logs_action_type ON public.staff_audit_logs USING btree (action_type)
  ```

- **idx_staff_audit_logs_location**
  ```sql
  CREATE INDEX idx_staff_audit_logs_location ON public.staff_audit_logs USING btree (location)
  ```

- **idx_staff_audit_logs_staff_id**
  ```sql
  CREATE INDEX idx_staff_audit_logs_staff_id ON public.staff_audit_logs USING btree (staff_id)
  ```

- **idx_staff_audit_logs_target_entity**
  ```sql
  CREATE INDEX idx_staff_audit_logs_target_entity ON public.staff_audit_logs USING btree (target_entity_type, target_entity_id)
  ```

- **idx_staff_audit_logs_timestamp**
  ```sql
  CREATE INDEX idx_staff_audit_logs_timestamp ON public.staff_audit_logs USING btree ("timestamp" DESC)
  ```

- **staff_audit_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX staff_audit_logs_pkey ON public.staff_audit_logs USING btree (id)
  ```

---

## staff_audit_logs_archive

**Columns:** 15  
**Indexes:** 8  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `staff_id` | uuid | ❌ | - |
| `action_type` | character varying(100) | ❌ | - |
| `target_entity_type` | character varying(50) | ❌ | - |
| `target_entity_id` | uuid | ❌ | - |
| `location` | character varying(255) | ❌ | - |
| `action_details` | jsonb | ✅ | - |
| `authorization_level` | character varying(50) | ✅ | - |
| `biometric_verification_required` | boolean | ✅ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `success` | boolean | ❌ | - |
| `error_message` | text | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_staff_audit_logs_archive_staff_id**
  ```sql
  CREATE INDEX idx_staff_audit_logs_archive_staff_id ON public.staff_audit_logs_archive USING btree (staff_id)
  ```

- **idx_staff_audit_logs_archive_timestamp**
  ```sql
  CREATE INDEX idx_staff_audit_logs_archive_timestamp ON public.staff_audit_logs_archive USING btree ("timestamp")
  ```

- **staff_audit_logs_archive_action_type_idx**
  ```sql
  CREATE INDEX staff_audit_logs_archive_action_type_idx ON public.staff_audit_logs_archive USING btree (action_type)
  ```

- **staff_audit_logs_archive_location_idx**
  ```sql
  CREATE INDEX staff_audit_logs_archive_location_idx ON public.staff_audit_logs_archive USING btree (location)
  ```

- **staff_audit_logs_archive_pkey**
  ```sql
  CREATE UNIQUE INDEX staff_audit_logs_archive_pkey ON public.staff_audit_logs_archive USING btree (id)
  ```

- **staff_audit_logs_archive_staff_id_idx**
  ```sql
  CREATE INDEX staff_audit_logs_archive_staff_id_idx ON public.staff_audit_logs_archive USING btree (staff_id)
  ```

- **staff_audit_logs_archive_target_entity_type_target_entity_i_idx**
  ```sql
  CREATE INDEX staff_audit_logs_archive_target_entity_type_target_entity_i_idx ON public.staff_audit_logs_archive USING btree (target_entity_type, target_entity_id)
  ```

- **staff_audit_logs_archive_timestamp_idx**
  ```sql
  CREATE INDEX staff_audit_logs_archive_timestamp_idx ON public.staff_audit_logs_archive USING btree ("timestamp" DESC)
  ```

---

## status_events

**Columns:** 7  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `voucher_id` | character varying(100) | ❌ | - |
| `from_status` | character varying(50) | ✅ | - |
| `to_status` | character varying(50) | ❌ | - |
| `triggered_by` | character varying(50) | ❌ | 'system'::character varying |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_status_events_created_at**
  ```sql
  CREATE INDEX idx_status_events_created_at ON public.status_events USING btree (created_at)
  ```

- **idx_status_events_to_status**
  ```sql
  CREATE INDEX idx_status_events_to_status ON public.status_events USING btree (to_status)
  ```

- **idx_status_events_voucher_id**
  ```sql
  CREATE INDEX idx_status_events_voucher_id ON public.status_events USING btree (voucher_id)
  ```

- **status_events_pkey**
  ```sql
  CREATE UNIQUE INDEX status_events_pkey ON public.status_events USING btree (id)
  ```

---

## streak_history

**Columns:** 6  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `activity_date` | date | ❌ | - |
| `streak_count` | integer | ❌ | - |
| `points_earned` | integer | ✅ | 0 |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_streak_history_user_date**
  ```sql
  CREATE INDEX idx_streak_history_user_date ON public.streak_history USING btree (user_id, activity_date DESC)
  ```

- **streak_history_pkey**
  ```sql
  CREATE UNIQUE INDEX streak_history_pkey ON public.streak_history USING btree (id)
  ```

- **unique_streak_day**
  ```sql
  CREATE UNIQUE INDEX unique_streak_day ON public.streak_history USING btree (user_id, activity_date)
  ```

---

## streaks

**Description:** User streaks for various activities

**Columns:** 8  
**Indexes:** 6  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('streaks_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `streak_type` | character varying(50) | ❌ | - |
| `current_streak` | integer | ❌ | 0 |
| `max_streak` | integer | ❌ | 0 |
| `last_activity_date` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_streaks_current**
  ```sql
  CREATE INDEX idx_streaks_current ON public.streaks USING btree (current_streak DESC)
  ```

- **idx_streaks_max**
  ```sql
  CREATE INDEX idx_streaks_max ON public.streaks USING btree (max_streak DESC)
  ```

- **idx_streaks_type**
  ```sql
  CREATE INDEX idx_streaks_type ON public.streaks USING btree (streak_type)
  ```

- **idx_streaks_user_id**
  ```sql
  CREATE INDEX idx_streaks_user_id ON public.streaks USING btree (user_id)
  ```

- **streaks_pkey**
  ```sql
  CREATE UNIQUE INDEX streaks_pkey ON public.streaks USING btree (id)
  ```

- **unique_user_streak**
  ```sql
  CREATE UNIQUE INDEX unique_user_streak ON public.streaks USING btree (user_id, streak_type)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## support_conversations

**Columns:** 9  
**Indexes:** 2  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `session_id` | character varying(255) | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `user_message` | text | ❌ | - |
| `assistant_response` | text | ❌ | - |
| `ticket_number` | character varying(20) | ✅ | - |
| `knowledge_base_used` | boolean | ✅ | false |
| `escalated` | boolean | ✅ | false |
| `created_at` | timestamp without time zone | ❌ | now() |

### Indexes

- **idx_support_conversations_session_id**
  ```sql
  CREATE INDEX idx_support_conversations_session_id ON public.support_conversations USING btree (session_id)
  ```

- **support_conversations_pkey**
  ```sql
  CREATE UNIQUE INDEX support_conversations_pkey ON public.support_conversations USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## support_tickets

**Columns:** 20  
**Indexes:** 4  
**Foreign Keys:** 3

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | uuid | ❌ | - |
| `ticket_number` | character varying(20) | ❌ | - |
| `subject` | character varying(200) | ❌ | - |
| `description` | text | ❌ | - |
| `category` | character varying(50) | ❌ | - |
| `status` | character varying(50) | ❌ | 'OPEN'::character varying |
| `priority` | character varying(50) | ❌ | 'MEDIUM'::character varying |
| `assigned_to` | uuid | ✅ | - |
| `assigned_at` | timestamp without time zone | ✅ | - |
| `resolved_at` | timestamp without time zone | ✅ | - |
| `resolution_notes` | text | ✅ | - |
| `closed_at` | timestamp without time zone | ✅ | - |
| `related_transaction_id` | uuid | ✅ | - |
| `related_voucher_id` | uuid | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp without time zone | ❌ | now() |
| `updated_at` | timestamp without time zone | ❌ | now() |
| `is_deleted` | boolean | ❌ | false |
| `deleted_at` | timestamp without time zone | ✅ | - |

### Indexes

- **idx_support_tickets_ticket_number**
  ```sql
  CREATE INDEX idx_support_tickets_ticket_number ON public.support_tickets USING btree (ticket_number)
  ```

- **idx_support_tickets_user_id**
  ```sql
  CREATE INDEX idx_support_tickets_user_id ON public.support_tickets USING btree (user_id) WHERE (is_deleted = false)
  ```

- **support_tickets_pkey**
  ```sql
  CREATE UNIQUE INDEX support_tickets_pkey ON public.support_tickets USING btree (id)
  ```

- **support_tickets_ticket_number_key**
  ```sql
  CREATE UNIQUE INDEX support_tickets_ticket_number_key ON public.support_tickets USING btree (ticket_number)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `assigned_to` | `users.id` |
| `related_transaction_id` | `transactions.id` |
| `user_id` | `users.id` |

---

## system_availability_summary

**Description:** PSD-12 Section 13.1: 99.9% uptime requirement tracking

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `service_name` | character varying(100) | ❌ | - |
| `summary_date` | date | ❌ | - |
| `total_checks` | integer | ❌ | 0 |
| `successful_checks` | integer | ❌ | 0 |
| `failed_checks` | integer | ❌ | 0 |
| `availability_percentage` | numeric | ❌ | - |
| `total_downtime_minutes` | integer | ✅ | 0 |
| `incidents_count` | integer | ✅ | 0 |
| `meets_sla` | boolean | ✅ | true |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_availability_service_date**
  ```sql
  CREATE INDEX idx_availability_service_date ON public.system_availability_summary USING btree (service_name, summary_date DESC)
  ```

- **idx_availability_sla**
  ```sql
  CREATE INDEX idx_availability_sla ON public.system_availability_summary USING btree (meets_sla)
  ```

- **system_availability_summary_pkey**
  ```sql
  CREATE UNIQUE INDEX system_availability_summary_pkey ON public.system_availability_summary USING btree (id)
  ```

- **system_availability_summary_service_name_summary_date_key**
  ```sql
  CREATE UNIQUE INDEX system_availability_summary_service_name_summary_date_key ON public.system_availability_summary USING btree (service_name, summary_date)
  ```

---

## system_health

**Description:** System health checks for 99.9% uptime requirement (PSD-12 §13)

**Columns:** 8  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `check_time` | timestamp without time zone | ❌ | now() |
| `check_type` | character varying(50) | ❌ | - |
| `status` | character varying(20) | ❌ | - |
| `response_time_ms` | integer | ✅ | - |
| `details` | jsonb | ✅ | - |
| `error_message` | text | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_system_health_time**
  ```sql
  CREATE INDEX idx_system_health_time ON public.system_health USING btree (check_time DESC)
  ```

- **idx_system_health_type**
  ```sql
  CREATE INDEX idx_system_health_type ON public.system_health USING btree (check_type, check_time DESC)
  ```

- **system_health_pkey**
  ```sql
  CREATE UNIQUE INDEX system_health_pkey ON public.system_health USING btree (id)
  ```

---

## system_uptime_logs

**Columns:** 7  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `service_name` | character varying(100) | ❌ | - |
| `check_timestamp` | timestamp with time zone | ❌ | now() |
| `status` | character varying(20) | ❌ | - |
| `response_time_ms` | integer | ✅ | - |
| `error_message` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_uptime_service_timestamp**
  ```sql
  CREATE INDEX idx_uptime_service_timestamp ON public.system_uptime_logs USING btree (service_name, check_timestamp DESC)
  ```

- **idx_uptime_status**
  ```sql
  CREATE INDEX idx_uptime_status ON public.system_uptime_logs USING btree (status)
  ```

- **system_uptime_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX system_uptime_logs_pkey ON public.system_uptime_logs USING btree (id)
  ```

---

## tickets

**Description:** Tickets and events catalog for dynamic pricing

**Columns:** 12  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `event_name` | character varying(255) | ❌ | - |
| `description` | text | ✅ | - |
| `price` | numeric | ❌ | - |
| `event_type` | character varying(100) | ✅ | - |
| `venue` | character varying(255) | ✅ | - |
| `event_date` | timestamp without time zone | ✅ | - |
| `quantity_available` | integer | ✅ | - |
| `quantity_sold` | integer | ✅ | 0 |
| `is_active` | boolean | ✅ | true |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_tickets_active**
  ```sql
  CREATE INDEX idx_tickets_active ON public.tickets USING btree (is_active) WHERE (is_active = true)
  ```

- **idx_tickets_event_date**
  ```sql
  CREATE INDEX idx_tickets_event_date ON public.tickets USING btree (event_date)
  ```

- **idx_tickets_type**
  ```sql
  CREATE INDEX idx_tickets_type ON public.tickets USING btree (event_type)
  ```

- **tickets_pkey**
  ```sql
  CREATE UNIQUE INDEX tickets_pkey ON public.tickets USING btree (id)
  ```

---

## token_vault

**Description:** Secure storage for NAMQR parameters (PSD-12 compliant)

**Columns:** 26  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `token_vault_id` | uuid | ❌ | uuid_generate_v4() |
| `payee_identifier` | character varying(255) | ❌ | - |
| `payee_name` | character varying(255) | ❌ | - |
| `payee_city` | character varying(100) | ✅ | - |
| `store_of_value_type` | character varying(20) | ❌ | - |
| `account_identifier_encrypted` | text | ❌ | - |
| `payment_network` | character varying(10) | ✅ | - |
| `qr_code_type` | character varying(10) | ❌ | - |
| `transaction_amount` | numeric | ✅ | - |
| `transaction_currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `merchant_category_code` | character varying(4) | ✅ | - |
| `reference_label` | character varying(25) | ✅ | - |
| `customer_label` | character varying(25) | ✅ | - |
| `terminal_label` | character varying(25) | ✅ | - |
| `purpose_of_transaction` | character varying(25) | ✅ | - |
| `additional_consumer_data_request` | character varying(3) | ✅ | - |
| `nref` | character varying(8) | ✅ | - |
| `qr_code_string` | text | ✅ | - |
| `status` | character varying(20) | ❌ | 'active'::character varying |
| `created_at` | timestamp with time zone | ❌ | now() |
| `expires_at` | timestamp with time zone | ❌ | - |
| `used_at` | timestamp with time zone | ✅ | - |
| `revoked_at` | timestamp with time zone | ✅ | - |
| `created_by` | character varying(255) | ✅ | - |
| `revoked_by` | character varying(255) | ✅ | - |
| `revoked_reason` | text | ✅ | - |

### Indexes

- **idx_token_vault_created**
  ```sql
  CREATE INDEX idx_token_vault_created ON public.token_vault USING btree (created_at DESC)
  ```

- **idx_token_vault_expires**
  ```sql
  CREATE INDEX idx_token_vault_expires ON public.token_vault USING btree (expires_at)
  ```

- **idx_token_vault_nref**
  ```sql
  CREATE INDEX idx_token_vault_nref ON public.token_vault USING btree (nref)
  ```

- **idx_token_vault_payee**
  ```sql
  CREATE INDEX idx_token_vault_payee ON public.token_vault USING btree (payee_identifier)
  ```

- **idx_token_vault_status**
  ```sql
  CREATE INDEX idx_token_vault_status ON public.token_vault USING btree (status)
  ```

- **idx_token_vault_type**
  ```sql
  CREATE INDEX idx_token_vault_type ON public.token_vault USING btree (qr_code_type)
  ```

- **token_vault_pkey**
  ```sql
  CREATE UNIQUE INDEX token_vault_pkey ON public.token_vault USING btree (token_vault_id)
  ```

---

## transaction_analytics

**Columns:** 17  
**Indexes:** 6  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `date` | date | ❌ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `payment_method` | character varying(50) | ✅ | - |
| `merchant_category` | character varying(100) | ✅ | - |
| `total_transactions` | integer | ❌ | 0 |
| `total_volume` | numeric | ❌ | 0 |
| `average_transaction_amount` | numeric | ✅ | - |
| `median_transaction_amount` | numeric | ✅ | - |
| `min_transaction_amount` | numeric | ✅ | - |
| `max_transaction_amount` | numeric | ✅ | - |
| `unique_users` | integer | ❌ | 0 |
| `unique_merchants` | integer | ✅ | - |
| `hour_of_day` | integer | ✅ | - |
| `day_of_week` | integer | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_transaction_analytics_date**
  ```sql
  CREATE INDEX idx_transaction_analytics_date ON public.transaction_analytics USING btree (date)
  ```

- **idx_transaction_analytics_date_type**
  ```sql
  CREATE INDEX idx_transaction_analytics_date_type ON public.transaction_analytics USING btree (date, transaction_type)
  ```

- **idx_transaction_analytics_payment_method**
  ```sql
  CREATE INDEX idx_transaction_analytics_payment_method ON public.transaction_analytics USING btree (payment_method)
  ```

- **idx_transaction_analytics_type**
  ```sql
  CREATE INDEX idx_transaction_analytics_type ON public.transaction_analytics USING btree (transaction_type)
  ```

- **transaction_analytics_date_transaction_type_payment_method__key**
  ```sql
  CREATE UNIQUE INDEX transaction_analytics_date_transaction_type_payment_method__key ON public.transaction_analytics USING btree (date, transaction_type, payment_method, merchant_category, hour_of_day)
  ```

- **transaction_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX transaction_analytics_pkey ON public.transaction_analytics USING btree (id)
  ```

---

## transaction_audit_logs

**Description:** Transaction audit trail (all financial transactions)

**Columns:** 21  
**Indexes:** 6  
**Foreign Keys:** 5

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `transaction_id` | uuid | ❌ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `from_wallet_id` | uuid | ✅ | - |
| `to_wallet_id` | uuid | ✅ | - |
| `recipient_id` | uuid | ✅ | - |
| `payment_method` | character varying(50) | ✅ | - |
| `payment_reference` | character varying(100) | ✅ | - |
| `two_factor_verified` | boolean | ❌ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `device_info` | jsonb | ✅ | - |
| `status` | character varying(50) | ❌ | - |
| `error_message` | text | ✅ | - |
| `fraud_check_status` | character varying(50) | ✅ | - |
| `guardian_agent_result` | jsonb | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_transaction_audit_logs_payment_method**
  ```sql
  CREATE INDEX idx_transaction_audit_logs_payment_method ON public.transaction_audit_logs USING btree (payment_method)
  ```

- **idx_transaction_audit_logs_status**
  ```sql
  CREATE INDEX idx_transaction_audit_logs_status ON public.transaction_audit_logs USING btree (status)
  ```

- **idx_transaction_audit_logs_timestamp**
  ```sql
  CREATE INDEX idx_transaction_audit_logs_timestamp ON public.transaction_audit_logs USING btree ("timestamp" DESC)
  ```

- **idx_transaction_audit_logs_transaction_id**
  ```sql
  CREATE INDEX idx_transaction_audit_logs_transaction_id ON public.transaction_audit_logs USING btree (transaction_id)
  ```

- **idx_transaction_audit_logs_user_id**
  ```sql
  CREATE INDEX idx_transaction_audit_logs_user_id ON public.transaction_audit_logs USING btree (user_id)
  ```

- **transaction_audit_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX transaction_audit_logs_pkey ON public.transaction_audit_logs USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `from_wallet_id` | `wallets.id` |
| `recipient_id` | `users.id` |
| `to_wallet_id` | `wallets.id` |
| `transaction_id` | `transactions.id` |
| `user_id` | `users.id` |

---

## transaction_audit_logs_archive

**Columns:** 21  
**Indexes:** 8  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `transaction_id` | uuid | ❌ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `user_id` | uuid | ❌ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ✅ | 'NAD'::character varying |
| `from_wallet_id` | uuid | ✅ | - |
| `to_wallet_id` | uuid | ✅ | - |
| `recipient_id` | uuid | ✅ | - |
| `payment_method` | character varying(50) | ✅ | - |
| `payment_reference` | character varying(100) | ✅ | - |
| `two_factor_verified` | boolean | ❌ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `ip_address` | inet | ✅ | - |
| `device_info` | jsonb | ✅ | - |
| `status` | character varying(50) | ❌ | - |
| `error_message` | text | ✅ | - |
| `fraud_check_status` | character varying(50) | ✅ | - |
| `guardian_agent_result` | jsonb | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_transaction_audit_logs_archive_timestamp**
  ```sql
  CREATE INDEX idx_transaction_audit_logs_archive_timestamp ON public.transaction_audit_logs_archive USING btree ("timestamp")
  ```

- **idx_transaction_audit_logs_archive_transaction_id**
  ```sql
  CREATE INDEX idx_transaction_audit_logs_archive_transaction_id ON public.transaction_audit_logs_archive USING btree (transaction_id)
  ```

- **transaction_audit_logs_archive_payment_method_idx**
  ```sql
  CREATE INDEX transaction_audit_logs_archive_payment_method_idx ON public.transaction_audit_logs_archive USING btree (payment_method)
  ```

- **transaction_audit_logs_archive_pkey**
  ```sql
  CREATE UNIQUE INDEX transaction_audit_logs_archive_pkey ON public.transaction_audit_logs_archive USING btree (id)
  ```

- **transaction_audit_logs_archive_status_idx**
  ```sql
  CREATE INDEX transaction_audit_logs_archive_status_idx ON public.transaction_audit_logs_archive USING btree (status)
  ```

- **transaction_audit_logs_archive_timestamp_idx**
  ```sql
  CREATE INDEX transaction_audit_logs_archive_timestamp_idx ON public.transaction_audit_logs_archive USING btree ("timestamp" DESC)
  ```

- **transaction_audit_logs_archive_transaction_id_idx**
  ```sql
  CREATE INDEX transaction_audit_logs_archive_transaction_id_idx ON public.transaction_audit_logs_archive USING btree (transaction_id)
  ```

- **transaction_audit_logs_archive_user_id_idx**
  ```sql
  CREATE INDEX transaction_audit_logs_archive_user_id_idx ON public.transaction_audit_logs_archive USING btree (user_id)
  ```

---

## transaction_categories

**Columns:** 9  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `transaction_id` | uuid | ✅ | - |
| `category` | text | ❌ | - |
| `subcategory` | text | ✅ | - |
| `confidence` | numeric | ❌ | - |
| `alternate_categories` | jsonb | ✅ | '[]'::jsonb |
| `classified_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `model_version` | text | ✅ | - |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_transaction_categories_category**
  ```sql
  CREATE INDEX idx_transaction_categories_category ON public.transaction_categories USING btree (category)
  ```

- **idx_transaction_categories_transaction_id**
  ```sql
  CREATE INDEX idx_transaction_categories_transaction_id ON public.transaction_categories USING btree (transaction_id)
  ```

- **transaction_categories_pkey**
  ```sql
  CREATE UNIQUE INDEX transaction_categories_pkey ON public.transaction_categories USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `transaction_id` | `transactions.id` |

---

## transaction_limit_usage

**Columns:** 10  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `user_id` | character varying(255) | ✅ | - |
| `account_id` | character varying(255) | ✅ | - |
| `kyc_level` | character varying(20) | ✅ | - |
| `daily_limit` | numeric | ✅ | - |
| `daily_used` | numeric | ✅ | - |
| `daily_usage_percent` | numeric | ✅ | - |
| `monthly_limit` | numeric | ✅ | - |
| `monthly_used` | numeric | ✅ | - |
| `monthly_usage_percent` | numeric | ✅ | - |
| `current_balance` | numeric | ✅ | - |
---

## transaction_limits

**Description:** Transaction limits per KYC level (PSD-3 compliant)

**Columns:** 14  
**Indexes:** 7  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `account_id` | character varying(255) | ❌ | - |
| `kyc_level` | character varying(20) | ❌ | - |
| `daily_limit` | numeric | ❌ | - |
| `single_transaction_limit` | numeric | ❌ | - |
| `monthly_limit` | numeric | ❌ | - |
| `daily_used` | numeric | ❌ | 0.00 |
| `monthly_used` | numeric | ❌ | 0.00 |
| `current_balance` | numeric | ❌ | 0.00 |
| `daily_reset_at` | timestamp with time zone | ❌ | - |
| `monthly_reset_at` | timestamp with time zone | ❌ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_limits_account**
  ```sql
  CREATE INDEX idx_limits_account ON public.transaction_limits USING btree (account_id)
  ```

- **idx_limits_daily_reset**
  ```sql
  CREATE INDEX idx_limits_daily_reset ON public.transaction_limits USING btree (daily_reset_at)
  ```

- **idx_limits_kyc**
  ```sql
  CREATE INDEX idx_limits_kyc ON public.transaction_limits USING btree (kyc_level)
  ```

- **idx_limits_monthly_reset**
  ```sql
  CREATE INDEX idx_limits_monthly_reset ON public.transaction_limits USING btree (monthly_reset_at)
  ```

- **idx_limits_user**
  ```sql
  CREATE INDEX idx_limits_user ON public.transaction_limits USING btree (user_id)
  ```

- **transaction_limits_pkey**
  ```sql
  CREATE UNIQUE INDEX transaction_limits_pkey ON public.transaction_limits USING btree (id)
  ```

- **transaction_limits_user_id_account_id_key**
  ```sql
  CREATE UNIQUE INDEX transaction_limits_user_id_account_id_key ON public.transaction_limits USING btree (user_id, account_id)
  ```

---

## transactions

**Columns:** 33  
**Indexes:** 19  
**Foreign Keys:** 4

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `external_id` | text | ❌ | - |
| `user_id` | uuid | ✅ | - |
| `merchant_id` | uuid | ✅ | - |
| `amount` | numeric | ❌ | - |
| `currency` | text | ✅ | 'NAD'::text |
| `transaction_type` | text | ❌ | - |
| `status` | text | ❌ | - |
| `merchant_name` | text | ✅ | - |
| `merchant_category` | text | ✅ | - |
| `merchant_mcc` | text | ✅ | - |
| `location_latitude` | numeric | ✅ | - |
| `location_longitude` | numeric | ✅ | - |
| `device_fingerprint` | text | ✅ | - |
| `card_present` | boolean | ✅ | false |
| `transaction_time` | timestamp with time zone | ❌ | - |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `processing_started_at` | timestamp without time zone | ✅ | - |
| `processing_completed_at` | timestamp without time zone | ✅ | - |
| `settlement_batch_id` | uuid | ✅ | - |
| `settlement_status` | character varying(20) | ✅ | 'pending'::character varying |
| `processing_latency_ms` | integer | ✅ | - |
| `wallet_id` | uuid | ✅ | - |
| `type` | character varying(50) | ✅ | - |
| `description` | text | ✅ | - |
| `category` | character varying(100) | ✅ | - |
| `recipient_id` | character varying(255) | ✅ | - |
| `recipient_name` | character varying(255) | ✅ | - |
| `date` | timestamp without time zone | ✅ | - |
| `voucher_id` | uuid | ✅ | - |
| `fineract_transaction_id` | bigint | ✅ | - |
| `ips_transaction_id` | character varying(255) | ✅ | - |

### Indexes

- **idx_transactions_amount**
  ```sql
  CREATE INDEX idx_transactions_amount ON public.transactions USING btree (amount)
  ```

- **idx_transactions_category**
  ```sql
  CREATE INDEX idx_transactions_category ON public.transactions USING btree (category) WHERE (category IS NOT NULL)
  ```

- **idx_transactions_category_date**
  ```sql
  CREATE INDEX idx_transactions_category_date ON public.transactions USING btree (category, date DESC) WHERE (category IS NOT NULL)
  ```

- **idx_transactions_date**
  ```sql
  CREATE INDEX idx_transactions_date ON public.transactions USING btree (date DESC) WHERE (date IS NOT NULL)
  ```

- **idx_transactions_fineract_id**
  ```sql
  CREATE INDEX idx_transactions_fineract_id ON public.transactions USING btree (fineract_transaction_id) WHERE (fineract_transaction_id IS NOT NULL)
  ```

- **idx_transactions_ips_id**
  ```sql
  CREATE INDEX idx_transactions_ips_id ON public.transactions USING btree (ips_transaction_id) WHERE (ips_transaction_id IS NOT NULL)
  ```

- **idx_transactions_merchant_category**
  ```sql
  CREATE INDEX idx_transactions_merchant_category ON public.transactions USING btree (merchant_category)
  ```

- **idx_transactions_merchant_id**
  ```sql
  CREATE INDEX idx_transactions_merchant_id ON public.transactions USING btree (merchant_id)
  ```

- **idx_transactions_settlement_batch**
  ```sql
  CREATE INDEX idx_transactions_settlement_batch ON public.transactions USING btree (settlement_batch_id)
  ```

- **idx_transactions_settlement_status**
  ```sql
  CREATE INDEX idx_transactions_settlement_status ON public.transactions USING btree (settlement_status) WHERE ((settlement_status)::text <> 'settled'::text)
  ```

- **idx_transactions_status**
  ```sql
  CREATE INDEX idx_transactions_status ON public.transactions USING btree (status)
  ```

- **idx_transactions_time**
  ```sql
  CREATE INDEX idx_transactions_time ON public.transactions USING btree (transaction_time DESC)
  ```

- **idx_transactions_transaction_time**
  ```sql
  CREATE INDEX idx_transactions_transaction_time ON public.transactions USING btree (transaction_time DESC)
  ```

- **idx_transactions_transaction_type**
  ```sql
  CREATE INDEX idx_transactions_transaction_type ON public.transactions USING btree (transaction_type)
  ```

- **idx_transactions_user_id**
  ```sql
  CREATE INDEX idx_transactions_user_id ON public.transactions USING btree (user_id, transaction_time DESC)
  ```

- **idx_transactions_voucher_id**
  ```sql
  CREATE INDEX idx_transactions_voucher_id ON public.transactions USING btree (voucher_id) WHERE (voucher_id IS NOT NULL)
  ```

- **idx_transactions_wallet_id**
  ```sql
  CREATE INDEX idx_transactions_wallet_id ON public.transactions USING btree (wallet_id) WHERE (wallet_id IS NOT NULL)
  ```

- **transactions_external_id_key**
  ```sql
  CREATE UNIQUE INDEX transactions_external_id_key ON public.transactions USING btree (external_id)
  ```

- **transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX transactions_pkey ON public.transactions USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `merchant_id` | `merchants.id` |
| `user_id` | `users.id` |
| `voucher_id` | `vouchers.id` |
| `wallet_id` | `wallets.id` |

---

## trust_account

**Description:** Trust account balance tracking (PSD-3 requirement: trust account must equal 100% of outstanding e-money liabilities)

**Columns:** 14  
**Indexes:** 2  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `date` | date | ❌ | - |
| `opening_balance` | numeric | ❌ | 0 |
| `closing_balance` | numeric | ❌ | 0 |
| `total_deposits` | numeric | ❌ | 0 |
| `total_withdrawals` | numeric | ❌ | 0 |
| `e_money_liabilities` | numeric | ❌ | 0 |
| `reconciliation_status` | character varying(50) | ❌ | 'pending'::character varying |
| `discrepancy_amount` | numeric | ✅ | 0 |
| `reconciled_by` | uuid | ✅ | - |
| `reconciled_at` | timestamp with time zone | ✅ | - |
| `notes` | text | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **trust_account_date_key**
  ```sql
  CREATE UNIQUE INDEX trust_account_date_key ON public.trust_account USING btree (date)
  ```

- **trust_account_pkey**
  ```sql
  CREATE UNIQUE INDEX trust_account_pkey ON public.trust_account USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `reconciled_by` | `users.id` |

---

## trust_account_reconciliation

**Description:** PSD-3 Section 11.2: Daily reconciliation to ensure 100% trust account coverage

**Columns:** 15  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `reconciliation_date` | date | ❌ | - |
| `trust_account_balance` | numeric | ❌ | - |
| `outstanding_emoney_liabilities` | numeric | ❌ | - |
| `coverage_percentage` | numeric | ❌ | - |
| `deficiency_amount` | numeric | ✅ | - |
| `interest_earned` | numeric | ✅ | 0 |
| `interest_withdrawn` | numeric | ✅ | 0 |
| `status` | character varying(20) | ❌ | 'pending'::character varying |
| `reconciled_by` | character varying(100) | ✅ | - |
| `resolution_date` | timestamp with time zone | ✅ | - |
| `resolution_notes` | text | ✅ | - |
| `notes` | text | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_trust_reconciliation_date**
  ```sql
  CREATE INDEX idx_trust_reconciliation_date ON public.trust_account_reconciliation USING btree (reconciliation_date DESC)
  ```

- **idx_trust_reconciliation_status**
  ```sql
  CREATE INDEX idx_trust_reconciliation_status ON public.trust_account_reconciliation USING btree (status)
  ```

- **trust_account_reconciliation_pkey**
  ```sql
  CREATE UNIQUE INDEX trust_account_reconciliation_pkey ON public.trust_account_reconciliation USING btree (id)
  ```

- **trust_account_reconciliation_reconciliation_date_key**
  ```sql
  CREATE UNIQUE INDEX trust_account_reconciliation_reconciliation_date_key ON public.trust_account_reconciliation USING btree (reconciliation_date)
  ```

---

## trust_account_reconciliation_log

**Description:** Daily reconciliation attempts and results

**Columns:** 10  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `reconciliation_date` | date | ❌ | - |
| `trust_account_balance` | numeric | ❌ | - |
| `e_money_liabilities` | numeric | ❌ | - |
| `discrepancy_amount` | numeric | ❌ | 0 |
| `status` | character varying(50) | ❌ | - |
| `error_message` | text | ✅ | - |
| `reconciled_by` | uuid | ✅ | - |
| `reconciled_at` | timestamp with time zone | ❌ | now() |
| `notes` | text | ✅ | - |

### Indexes

- **idx_reconciliation_log_date**
  ```sql
  CREATE INDEX idx_reconciliation_log_date ON public.trust_account_reconciliation_log USING btree (reconciliation_date)
  ```

- **idx_reconciliation_log_status**
  ```sql
  CREATE INDEX idx_reconciliation_log_status ON public.trust_account_reconciliation_log USING btree (status)
  ```

- **trust_account_reconciliation_log_pkey**
  ```sql
  CREATE UNIQUE INDEX trust_account_reconciliation_log_pkey ON public.trust_account_reconciliation_log USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `reconciled_by` | `users.id` |

---

## trust_account_transactions

**Description:** All trust account movements (deposits, withdrawals, adjustments)

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `trust_account_id` | uuid | ❌ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `amount` | numeric | ❌ | - |
| `currency` | character varying(3) | ❌ | 'NAD'::character varying |
| `reference` | character varying(255) | ✅ | - |
| `description` | text | ✅ | - |
| `bank_statement_date` | date | ✅ | - |
| `bank_statement_reference` | character varying(255) | ✅ | - |
| `created_by` | uuid | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_trust_account_transactions_account_id**
  ```sql
  CREATE INDEX idx_trust_account_transactions_account_id ON public.trust_account_transactions USING btree (trust_account_id)
  ```

- **idx_trust_account_transactions_date**
  ```sql
  CREATE INDEX idx_trust_account_transactions_date ON public.trust_account_transactions USING btree (created_at)
  ```

- **idx_trust_account_transactions_type**
  ```sql
  CREATE INDEX idx_trust_account_transactions_type ON public.trust_account_transactions USING btree (transaction_type)
  ```

- **trust_account_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX trust_account_transactions_pkey ON public.trust_account_transactions USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `created_by` | `users.id` |
| `trust_account_id` | `trust_account.id` |

---

## two_factor_auth_logs

**Description:** PSD-12 Section 12.2: Two-factor authentication logs for all payment transactions

**Columns:** 18  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(50) | ❌ | - |
| `user_type` | character varying(50) | ✅ | - |
| `auth_method` | character varying(50) | ❌ | - |
| `transaction_type` | character varying(50) | ❌ | - |
| `transaction_id` | character varying(100) | ✅ | - |
| `transaction_amount` | numeric | ✅ | - |
| `otp_code` | character varying(64) | ✅ | - |
| `otp_sent_at` | timestamp with time zone | ✅ | - |
| `otp_expires_at` | timestamp with time zone | ✅ | - |
| `otp_attempts` | integer | ✅ | 0 |
| `auth_status` | character varying(20) | ❌ | - |
| `verified_at` | timestamp with time zone | ✅ | - |
| `failure_reason` | character varying(255) | ✅ | - |
| `ip_address` | character varying(45) | ✅ | - |
| `user_agent` | text | ✅ | - |
| `device_fingerprint` | character varying(255) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_2fa_created_at**
  ```sql
  CREATE INDEX idx_2fa_created_at ON public.two_factor_auth_logs USING btree (created_at DESC)
  ```

- **idx_2fa_status**
  ```sql
  CREATE INDEX idx_2fa_status ON public.two_factor_auth_logs USING btree (auth_status)
  ```

- **idx_2fa_transaction_id**
  ```sql
  CREATE INDEX idx_2fa_transaction_id ON public.two_factor_auth_logs USING btree (transaction_id)
  ```

- **idx_2fa_user_id**
  ```sql
  CREATE INDEX idx_2fa_user_id ON public.two_factor_auth_logs USING btree (user_id)
  ```

- **two_factor_auth_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX two_factor_auth_logs_pkey ON public.two_factor_auth_logs USING btree (id)
  ```

---

## user_achievements

**Description:** User-earned achievements with BP rewards

**Columns:** 5  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('user_achievements_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `achievement_id` | character varying(100) | ❌ | - |
| `earned_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `bp_earned` | integer | ❌ | - |

### Indexes

- **idx_user_achievements_achievement_id**
  ```sql
  CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id)
  ```

- **idx_user_achievements_earned_at**
  ```sql
  CREATE INDEX idx_user_achievements_earned_at ON public.user_achievements USING btree (earned_at DESC)
  ```

- **idx_user_achievements_user_id**
  ```sql
  CREATE INDEX idx_user_achievements_user_id ON public.user_achievements USING btree (user_id)
  ```

- **unique_user_achievement**
  ```sql
  CREATE UNIQUE INDEX unique_user_achievement ON public.user_achievements USING btree (user_id, achievement_id)
  ```

- **user_achievements_pkey**
  ```sql
  CREATE UNIQUE INDEX user_achievements_pkey ON public.user_achievements USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `achievement_id` | `achievements.achievement_id` |
| `user_id` | `users.id` |

---

## user_behavior_analytics

**Columns:** 20  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | uuid | ❌ | - |
| `date` | date | ❌ | - |
| `wallet_balance` | numeric | ✅ | - |
| `average_balance` | numeric | ✅ | - |
| `transaction_count` | integer | ❌ | 0 |
| `total_spent` | numeric | ❌ | 0 |
| `total_received` | numeric | ❌ | 0 |
| `preferred_payment_method` | character varying(50) | ✅ | - |
| `cash_out_count` | integer | ✅ | 0 |
| `cash_out_amount` | numeric | ✅ | 0 |
| `merchant_payment_count` | integer | ✅ | 0 |
| `merchant_payment_amount` | numeric | ✅ | 0 |
| `p2p_transfer_count` | integer | ✅ | 0 |
| `p2p_transfer_amount` | numeric | ✅ | 0 |
| `bill_payment_count` | integer | ✅ | 0 |
| `bill_payment_amount` | numeric | ✅ | 0 |
| `spending_velocity` | numeric | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_user_behavior_analytics_date**
  ```sql
  CREATE INDEX idx_user_behavior_analytics_date ON public.user_behavior_analytics USING btree (date)
  ```

- **idx_user_behavior_analytics_user_date**
  ```sql
  CREATE INDEX idx_user_behavior_analytics_user_date ON public.user_behavior_analytics USING btree (user_id, date)
  ```

- **user_behavior_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX user_behavior_analytics_pkey ON public.user_behavior_analytics USING btree (id)
  ```

- **user_behavior_analytics_user_id_date_key**
  ```sql
  CREATE UNIQUE INDEX user_behavior_analytics_user_id_date_key ON public.user_behavior_analytics USING btree (user_id, date)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## user_challenges

**Description:** User challenge participation and progress

**Columns:** 8  
**Indexes:** 6  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('user_challenges_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `challenge_id` | character varying(100) | ❌ | - |
| `progress` | integer | ❌ | 0 |
| `completed` | boolean | ❌ | false |
| `bp_earned` | integer | ❌ | 0 |
| `joined_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `completed_at` | timestamp without time zone | ✅ | - |

### Indexes

- **idx_user_challenges_challenge_id**
  ```sql
  CREATE INDEX idx_user_challenges_challenge_id ON public.user_challenges USING btree (challenge_id)
  ```

- **idx_user_challenges_completed**
  ```sql
  CREATE INDEX idx_user_challenges_completed ON public.user_challenges USING btree (completed)
  ```

- **idx_user_challenges_progress**
  ```sql
  CREATE INDEX idx_user_challenges_progress ON public.user_challenges USING btree (progress)
  ```

- **idx_user_challenges_user_id**
  ```sql
  CREATE INDEX idx_user_challenges_user_id ON public.user_challenges USING btree (user_id)
  ```

- **unique_user_challenge**
  ```sql
  CREATE UNIQUE INDEX unique_user_challenge ON public.user_challenges USING btree (user_id, challenge_id)
  ```

- **user_challenges_pkey**
  ```sql
  CREATE UNIQUE INDEX user_challenges_pkey ON public.user_challenges USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `challenge_id` | `challenges.challenge_id` |
| `user_id` | `users.id` |

---

## user_gamification

**Columns:** 18  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `total_points` | integer | ✅ | 0 |
| `available_points` | integer | ✅ | 0 |
| `redeemed_points` | integer | ✅ | 0 |
| `current_level` | integer | ✅ | 1 |
| `current_xp` | integer | ✅ | 0 |
| `total_xp` | integer | ✅ | 0 |
| `current_streak` | integer | ✅ | 0 |
| `longest_streak` | integer | ✅ | 0 |
| `last_activity_date` | date | ✅ | - |
| `points_multiplier` | numeric | ✅ | 1.00 |
| `multiplier_expires_at` | timestamp with time zone | ✅ | - |
| `transactions_completed` | integer | ✅ | 0 |
| `quests_completed` | integer | ✅ | 0 |
| `achievements_unlocked` | integer | ✅ | 0 |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_user_gamification_level**
  ```sql
  CREATE INDEX idx_user_gamification_level ON public.user_gamification USING btree (current_level)
  ```

- **idx_user_gamification_points**
  ```sql
  CREATE INDEX idx_user_gamification_points ON public.user_gamification USING btree (available_points DESC)
  ```

- **idx_user_gamification_user_id**
  ```sql
  CREATE INDEX idx_user_gamification_user_id ON public.user_gamification USING btree (user_id)
  ```

- **unique_user_gamification**
  ```sql
  CREATE UNIQUE INDEX unique_user_gamification ON public.user_gamification USING btree (user_id)
  ```

- **user_gamification_pkey**
  ```sql
  CREATE UNIQUE INDEX user_gamification_pkey ON public.user_gamification USING btree (id)
  ```

---

## user_module_progress

**Description:** User progress tracking for each module

**Columns:** 12  
**Indexes:** 5  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('user_module_progress_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `module_id` | character varying(100) | ❌ | - |
| `status` | character varying(20) | ❌ | 'not_started'::character varying |
| `sections_completed` | integer | ❌ | 0 |
| `total_sections` | integer | ❌ | - |
| `progress_percentage` | integer | ❌ | 0 |
| `time_spent_minutes` | integer | ❌ | 0 |
| `started_at` | timestamp without time zone | ✅ | - |
| `completed_at` | timestamp without time zone | ✅ | - |
| `last_accessed_at` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_user_module_progress_module_id**
  ```sql
  CREATE INDEX idx_user_module_progress_module_id ON public.user_module_progress USING btree (module_id)
  ```

- **idx_user_module_progress_status**
  ```sql
  CREATE INDEX idx_user_module_progress_status ON public.user_module_progress USING btree (status)
  ```

- **idx_user_module_progress_user_id**
  ```sql
  CREATE INDEX idx_user_module_progress_user_id ON public.user_module_progress USING btree (user_id)
  ```

- **unique_user_module**
  ```sql
  CREATE UNIQUE INDEX unique_user_module ON public.user_module_progress USING btree (user_id, module_id)
  ```

- **user_module_progress_pkey**
  ```sql
  CREATE UNIQUE INDEX user_module_progress_pkey ON public.user_module_progress USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `module_id` | `financial_literacy_modules.module_id` |
| `user_id` | `users.id` |

---

## user_power_ups

**Columns:** 9  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `type` | character varying(50) | ❌ | - |
| `is_active` | boolean | ✅ | true |
| `uses_remaining` | integer | ✅ | - |
| `activated_at` | timestamp with time zone | ✅ | now() |
| `expires_at` | timestamp with time zone | ✅ | - |
| `points_spent` | integer | ❌ | 0 |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_user_power_ups_active**
  ```sql
  CREATE INDEX idx_user_power_ups_active ON public.user_power_ups USING btree (user_id, is_active, expires_at)
  ```

- **idx_user_power_ups_user_id**
  ```sql
  CREATE INDEX idx_user_power_ups_user_id ON public.user_power_ups USING btree (user_id)
  ```

- **user_power_ups_pkey**
  ```sql
  CREATE UNIQUE INDEX user_power_ups_pkey ON public.user_power_ups USING btree (id)
  ```

---

## user_profiles

**Columns:** 21  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ✅ | - |
| `age_group` | text | ✅ | - |
| `income_level` | text | ✅ | - |
| `occupation_category` | text | ✅ | - |
| `family_size` | integer | ✅ | - |
| `location_type` | text | ✅ | - |
| `app_usage_frequency` | numeric | ✅ | - |
| `feature_usage_diversity` | numeric | ✅ | - |
| `transaction_frequency` | numeric | ✅ | - |
| `savings_rate` | numeric | ✅ | - |
| `quiz_average_score` | numeric | ✅ | - |
| `modules_completed` | integer | ✅ | - |
| `time_spent_learning` | integer | ✅ | - |
| `question_accuracy_rate` | numeric | ✅ | - |
| `learning_consistency` | integer | ✅ | - |
| `gamification_score` | integer | ✅ | - |
| `badge_count` | integer | ✅ | - |
| `challenge_completion_rate` | numeric | ✅ | - |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_user_profiles_user_id**
  ```sql
  CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id)
  ```

- **user_profiles_pkey**
  ```sql
  CREATE UNIQUE INDEX user_profiles_pkey ON public.user_profiles USING btree (id)
  ```

- **user_profiles_user_id_key**
  ```sql
  CREATE UNIQUE INDEX user_profiles_user_id_key ON public.user_profiles USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## user_quests

**Columns:** 12  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `quest_id` | character varying(100) | ❌ | - |
| `current_progress` | integer | ✅ | 0 |
| `status` | character varying(20) | ✅ | 'active'::character varying |
| `started_at` | timestamp with time zone | ✅ | now() |
| `completed_at` | timestamp with time zone | ✅ | - |
| `expires_at` | timestamp with time zone | ✅ | - |
| `claimed_at` | timestamp with time zone | ✅ | - |
| `period_start` | date | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |
| `updated_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_user_quests_period**
  ```sql
  CREATE INDEX idx_user_quests_period ON public.user_quests USING btree (user_id, period_start)
  ```

- **idx_user_quests_status**
  ```sql
  CREATE INDEX idx_user_quests_status ON public.user_quests USING btree (user_id, status)
  ```

- **idx_user_quests_user_id**
  ```sql
  CREATE INDEX idx_user_quests_user_id ON public.user_quests USING btree (user_id)
  ```

- **user_quests_pkey**
  ```sql
  CREATE UNIQUE INDEX user_quests_pkey ON public.user_quests USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `quest_id` | `quests.id` |

---

## user_revenue_profiles

**Description:** User lifetime value and revenue breakdown

**Columns:** 11  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('user_revenue_profiles_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `lifetime_value` | numeric | ❌ | 0.00 |
| `transaction_fees_total` | numeric | ❌ | 0.00 |
| `account_fees_total` | numeric | ❌ | 0.00 |
| `loan_revenue_total` | numeric | ❌ | 0.00 |
| `ai_tokens_total` | numeric | ❌ | 0.00 |
| `subscription_total` | numeric | ❌ | 0.00 |
| `last_revenue_date` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_user_revenue_lifetime_value**
  ```sql
  CREATE INDEX idx_user_revenue_lifetime_value ON public.user_revenue_profiles USING btree (lifetime_value DESC)
  ```

- **idx_user_revenue_user_id**
  ```sql
  CREATE INDEX idx_user_revenue_user_id ON public.user_revenue_profiles USING btree (user_id)
  ```

- **user_revenue_profiles_pkey**
  ```sql
  CREATE UNIQUE INDEX user_revenue_profiles_pkey ON public.user_revenue_profiles USING btree (id)
  ```

- **user_revenue_profiles_user_id_key**
  ```sql
  CREATE UNIQUE INDEX user_revenue_profiles_user_id_key ON public.user_revenue_profiles USING btree (user_id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## user_rewards

**Columns:** 13  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | character varying(255) | ❌ | - |
| `reward_id` | character varying(100) | ❌ | - |
| `status` | character varying(20) | ✅ | 'active'::character varying |
| `points_spent` | integer | ❌ | - |
| `value_type` | character varying(50) | ✅ | - |
| `value_amount` | numeric | ✅ | - |
| `used_at` | timestamp with time zone | ✅ | - |
| `used_for` | text | ✅ | - |
| `claimed_at` | timestamp with time zone | ✅ | now() |
| `expires_at` | timestamp with time zone | ✅ | - |
| `redemption_code` | character varying(50) | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | now() |

### Indexes

- **idx_user_rewards_status**
  ```sql
  CREATE INDEX idx_user_rewards_status ON public.user_rewards USING btree (user_id, status)
  ```

- **idx_user_rewards_user_id**
  ```sql
  CREATE INDEX idx_user_rewards_user_id ON public.user_rewards USING btree (user_id)
  ```

- **user_rewards_pkey**
  ```sql
  CREATE UNIQUE INDEX user_rewards_pkey ON public.user_rewards USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `reward_id` | `rewards.id` |

---

## user_spending_features

**Columns:** 15  
**Indexes:** 3  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ✅ | - |
| `period_start` | date | ❌ | - |
| `period_end` | date | ❌ | - |
| `total_spending` | numeric | ✅ | - |
| `avg_transaction_amount` | numeric | ✅ | - |
| `transaction_count` | integer | ✅ | - |
| `spending_volatility` | numeric | ✅ | - |
| `spending_by_category` | jsonb | ✅ | '{}'::jsonb |
| `weekend_spending_ratio` | numeric | ✅ | - |
| `evening_spending_ratio` | numeric | ✅ | - |
| `cash_withdrawal_frequency` | integer | ✅ | - |
| `unique_merchants_count` | integer | ✅ | - |
| `computed_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |

### Indexes

- **idx_user_spending_features_period**
  ```sql
  CREATE INDEX idx_user_spending_features_period ON public.user_spending_features USING btree (period_start, period_end)
  ```

- **idx_user_spending_features_user_id**
  ```sql
  CREATE INDEX idx_user_spending_features_user_id ON public.user_spending_features USING btree (user_id, period_end DESC)
  ```

- **user_spending_features_pkey**
  ```sql
  CREATE UNIQUE INDEX user_spending_features_pkey ON public.user_spending_features USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## user_transaction_summary

**Columns:** 8  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `user_id` | uuid | ✅ | - |
| `external_id` | text | ✅ | - |
| `total_transactions` | bigint | ✅ | - |
| `total_spent` | numeric | ✅ | - |
| `avg_transaction_amount` | numeric | ✅ | - |
| `first_transaction` | timestamp with time zone | ✅ | - |
| `last_transaction` | timestamp with time zone | ✅ | - |
| `unique_merchants` | bigint | ✅ | - |
---

## users

**Columns:** 33  
**Indexes:** 14  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `external_id` | text | ❌ | - |
| `phone_number` | text | ✅ | - |
| `email` | text | ✅ | - |
| `full_name` | text | ✅ | - |
| `date_of_birth` | date | ✅ | - |
| `kyc_level` | integer | ✅ | 0 |
| `income_level` | text | ✅ | - |
| `occupation` | text | ✅ | - |
| `location_city` | text | ✅ | - |
| `location_country` | text | ✅ | 'Namibia'::text |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `buffr_id` | character varying(100) | ✅ | - |
| `role` | character varying(50) | ✅ | 'user'::character varying |
| `is_admin` | boolean | ✅ | false |
| `permissions` | jsonb | ✅ | '{}'::jsonb |
| `mfa_enabled` | boolean | ✅ | false |
| `mfa_secret` | character varying(255) | ✅ | - |
| `is_verified` | boolean | ✅ | false |
| `is_two_factor_enabled` | boolean | ✅ | false |
| `last_login_at` | timestamp with time zone | ✅ | - |
| `status` | character varying(20) | ✅ | 'active'::character varying |
| `first_name` | character varying(255) | ✅ | - |
| `last_name` | character varying(255) | ✅ | - |
| `currency` | character varying(10) | ✅ | 'N$'::character varying |
| `avatar` | text | ✅ | - |
| `national_id_encrypted` | text | ✅ | - |
| `national_id_iv` | text | ✅ | - |
| `national_id_tag` | text | ✅ | - |
| `national_id_hash` | text | ✅ | - |
| `national_id_salt` | text | ✅ | - |

### Indexes

- **idx_users_admin_roles**
  ```sql
  CREATE INDEX idx_users_admin_roles ON public.users USING btree (role) WHERE ((role)::text = ANY ((ARRAY['support'::character varying, 'compliance'::character varying, 'super-admin'::character varying, 'admin'::character varying, 'administrator'::character varying])::text[]))
  ```

- **idx_users_buffr_id**
  ```sql
  CREATE INDEX idx_users_buffr_id ON public.users USING btree (buffr_id)
  ```

- **idx_users_email**
  ```sql
  CREATE INDEX idx_users_email ON public.users USING btree (email)
  ```

- **idx_users_external_id**
  ```sql
  CREATE INDEX idx_users_external_id ON public.users USING btree (external_id)
  ```

- **idx_users_is_admin**
  ```sql
  CREATE INDEX idx_users_is_admin ON public.users USING btree (is_admin) WHERE (is_admin = true)
  ```

- **idx_users_kyc_level**
  ```sql
  CREATE INDEX idx_users_kyc_level ON public.users USING btree (kyc_level)
  ```

- **idx_users_mfa_enabled**
  ```sql
  CREATE INDEX idx_users_mfa_enabled ON public.users USING btree (mfa_enabled) WHERE (mfa_enabled = true)
  ```

- **idx_users_national_id_hash**
  ```sql
  CREATE INDEX idx_users_national_id_hash ON public.users USING btree (national_id_hash) WHERE (national_id_hash IS NOT NULL)
  ```

- **idx_users_phone_number**
  ```sql
  CREATE INDEX idx_users_phone_number ON public.users USING btree (phone_number)
  ```

- **idx_users_role**
  ```sql
  CREATE INDEX idx_users_role ON public.users USING btree (role)
  ```

- **idx_users_status**
  ```sql
  CREATE INDEX idx_users_status ON public.users USING btree (status) WHERE ((status)::text <> 'active'::text)
  ```

- **users_buffr_id_key**
  ```sql
  CREATE UNIQUE INDEX users_buffr_id_key ON public.users USING btree (buffr_id)
  ```

- **users_external_id_key**
  ```sql
  CREATE UNIQUE INDEX users_external_id_key ON public.users USING btree (external_id)
  ```

- **users_pkey**
  ```sql
  CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id)
  ```

---

## v_audit_log_summary

**Columns:** 8  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `action_type` | character varying(100) | ✅ | - |
| `resource_type` | character varying(100) | ✅ | - |
| `total_events` | bigint | ✅ | - |
| `unique_admin_users` | bigint | ✅ | - |
| `first_event` | timestamp without time zone | ✅ | - |
| `last_event` | timestamp without time zone | ✅ | - |
| `successful_events` | bigint | ✅ | - |
| `failed_events` | bigint | ✅ | - |
---

## v_daily_processing_summary

**Columns:** 10  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `processing_date` | date | ✅ | - |
| `total_transactions` | bigint | ✅ | - |
| `successful` | bigint | ✅ | - |
| `failed` | bigint | ✅ | - |
| `avg_latency_ms` | numeric | ✅ | - |
| `max_latency_ms` | integer | ✅ | - |
| `p95_latency_ms` | double precision | ✅ | - |
| `total_credits` | numeric | ✅ | - |
| `total_debits` | numeric | ✅ | - |
| `total_volume` | numeric | ✅ | - |
---

## v_dormant_wallet_summary

**Columns:** 17  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `wallet_id` | uuid | ✅ | - |
| `user_id` | uuid | ✅ | - |
| `wallet_name` | text | ✅ | - |
| `balance` | numeric | ✅ | - |
| `currency` | text | ✅ | - |
| `dormancy_status` | character varying(20) | ✅ | - |
| `last_transaction_at` | timestamp without time zone | ✅ | - |
| `dormancy_warning_sent_at` | timestamp without time zone | ✅ | - |
| `dormancy_started_at` | timestamp without time zone | ✅ | - |
| `created_at` | timestamp with time zone | ✅ | - |
| `user_email` | text | ✅ | - |
| `user_phone` | text | ✅ | - |
| `user_name` | text | ✅ | - |
| `days_inactive` | numeric | ✅ | - |
| `months_inactive` | numeric | ✅ | - |
| `days_until_dormant` | numeric | ✅ | - |
| `needs_warning` | boolean | ✅ | - |
---

## v_incident_summary

**Columns:** 17  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ✅ | - |
| `incident_number` | character varying(50) | ✅ | - |
| `incident_type` | character varying(50) | ✅ | - |
| `severity` | character varying(20) | ✅ | - |
| `status` | character varying(30) | ✅ | - |
| `title` | character varying(255) | ✅ | - |
| `detected_at` | timestamp without time zone | ✅ | - |
| `resolved_at` | timestamp without time zone | ✅ | - |
| `resolution_hours` | numeric | ✅ | - |
| `financial_loss` | numeric | ✅ | - |
| `customers_affected` | integer | ✅ | - |
| `availability_impact_hours` | numeric | ✅ | - |
| `reported_to_bon` | boolean | ✅ | - |
| `reported_to_fic` | boolean | ✅ | - |
| `notification_compliance` | text | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | - |
| `updated_at` | timestamp without time zone | ✅ | - |
---

## v_pending_incident_notifications

**Columns:** 15  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ✅ | - |
| `incident_number` | character varying(50) | ✅ | - |
| `incident_type` | character varying(50) | ✅ | - |
| `severity` | character varying(20) | ✅ | - |
| `status` | character varying(30) | ✅ | - |
| `title` | character varying(255) | ✅ | - |
| `detected_at` | timestamp without time zone | ✅ | - |
| `preliminary_notification_deadline` | timestamp without time zone | ✅ | - |
| `preliminary_notification_sent_at` | timestamp without time zone | ✅ | - |
| `impact_assessment_due_at` | timestamp without time zone | ✅ | - |
| `impact_assessment_submitted_at` | timestamp without time zone | ✅ | - |
| `hours_until_notification_deadline` | numeric | ✅ | - |
| `days_until_assessment_deadline` | numeric | ✅ | - |
| `notification_overdue` | boolean | ✅ | - |
| `assessment_overdue` | boolean | ✅ | - |
---

## v_pending_settlement

**Columns:** 11  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ✅ | - |
| `external_id` | text | ✅ | - |
| `user_id` | uuid | ✅ | - |
| `amount` | numeric | ✅ | - |
| `currency` | text | ✅ | - |
| `transaction_type` | text | ✅ | - |
| `status` | text | ✅ | - |
| `transaction_time` | timestamp with time zone | ✅ | - |
| `processing_latency_ms` | integer | ✅ | - |
| `settlement_status` | character varying(20) | ✅ | - |
| `transaction_date` | date | ✅ | - |
---

## v_uptime_dashboard

**Columns:** 8  
**Indexes:** 0  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `metric_date` | date | ✅ | - |
| `daily_transactions` | bigint | ✅ | - |
| `daily_avg_latency_ms` | numeric | ✅ | - |
| `total_uptime_seconds` | bigint | ✅ | - |
| `total_downtime_seconds` | bigint | ✅ | - |
| `uptime_percentage` | numeric | ✅ | - |
| `daily_errors` | bigint | ✅ | - |
| `daily_value` | numeric | ✅ | - |
---

## voucher_audit_logs

**Description:** Voucher operation audit trail (issued, verified, redeemed, expired, cancelled)

**Columns:** 16  
**Indexes:** 7  
**Foreign Keys:** 2

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `voucher_id` | uuid | ❌ | - |
| `operation_type` | character varying(50) | ❌ | - |
| `user_id` | uuid | ✅ | - |
| `staff_id` | uuid | ✅ | - |
| `location` | character varying(255) | ✅ | - |
| `smartpay_beneficiary_id` | character varying(100) | ❌ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `old_status` | character varying(50) | ✅ | - |
| `new_status` | character varying(50) | ❌ | - |
| `amount` | numeric | ✅ | - |
| `redemption_method` | character varying(50) | ✅ | - |
| `settlement_reference` | character varying(100) | ✅ | - |
| `metadata` | jsonb | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_voucher_audit_logs_operation_type**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_operation_type ON public.voucher_audit_logs USING btree (operation_type)
  ```

- **idx_voucher_audit_logs_smartpay_beneficiary_id**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_smartpay_beneficiary_id ON public.voucher_audit_logs USING btree (smartpay_beneficiary_id)
  ```

- **idx_voucher_audit_logs_staff_id**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_staff_id ON public.voucher_audit_logs USING btree (staff_id)
  ```

- **idx_voucher_audit_logs_timestamp**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_timestamp ON public.voucher_audit_logs USING btree ("timestamp" DESC)
  ```

- **idx_voucher_audit_logs_user_id**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_user_id ON public.voucher_audit_logs USING btree (user_id)
  ```

- **idx_voucher_audit_logs_voucher_id**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_voucher_id ON public.voucher_audit_logs USING btree (voucher_id)
  ```

- **voucher_audit_logs_pkey**
  ```sql
  CREATE UNIQUE INDEX voucher_audit_logs_pkey ON public.voucher_audit_logs USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |
| `voucher_id` | `vouchers.id` |

---

## voucher_audit_logs_archive

**Columns:** 16  
**Indexes:** 9  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `voucher_id` | uuid | ❌ | - |
| `operation_type` | character varying(50) | ❌ | - |
| `user_id` | uuid | ✅ | - |
| `staff_id` | uuid | ✅ | - |
| `location` | character varying(255) | ✅ | - |
| `smartpay_beneficiary_id` | character varying(100) | ❌ | - |
| `biometric_verification_id` | character varying(100) | ✅ | - |
| `old_status` | character varying(50) | ✅ | - |
| `new_status` | character varying(50) | ❌ | - |
| `amount` | numeric | ✅ | - |
| `redemption_method` | character varying(50) | ✅ | - |
| `settlement_reference` | character varying(100) | ✅ | - |
| `metadata` | jsonb | ✅ | - |
| `timestamp` | timestamp with time zone | ❌ | now() |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_voucher_audit_logs_archive_timestamp**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_archive_timestamp ON public.voucher_audit_logs_archive USING btree ("timestamp")
  ```

- **idx_voucher_audit_logs_archive_voucher_id**
  ```sql
  CREATE INDEX idx_voucher_audit_logs_archive_voucher_id ON public.voucher_audit_logs_archive USING btree (voucher_id)
  ```

- **voucher_audit_logs_archive_operation_type_idx**
  ```sql
  CREATE INDEX voucher_audit_logs_archive_operation_type_idx ON public.voucher_audit_logs_archive USING btree (operation_type)
  ```

- **voucher_audit_logs_archive_pkey**
  ```sql
  CREATE UNIQUE INDEX voucher_audit_logs_archive_pkey ON public.voucher_audit_logs_archive USING btree (id)
  ```

- **voucher_audit_logs_archive_smartpay_beneficiary_id_idx**
  ```sql
  CREATE INDEX voucher_audit_logs_archive_smartpay_beneficiary_id_idx ON public.voucher_audit_logs_archive USING btree (smartpay_beneficiary_id)
  ```

- **voucher_audit_logs_archive_staff_id_idx**
  ```sql
  CREATE INDEX voucher_audit_logs_archive_staff_id_idx ON public.voucher_audit_logs_archive USING btree (staff_id)
  ```

- **voucher_audit_logs_archive_timestamp_idx**
  ```sql
  CREATE INDEX voucher_audit_logs_archive_timestamp_idx ON public.voucher_audit_logs_archive USING btree ("timestamp" DESC)
  ```

- **voucher_audit_logs_archive_user_id_idx**
  ```sql
  CREATE INDEX voucher_audit_logs_archive_user_id_idx ON public.voucher_audit_logs_archive USING btree (user_id)
  ```

- **voucher_audit_logs_archive_voucher_id_idx**
  ```sql
  CREATE INDEX voucher_audit_logs_archive_voucher_id_idx ON public.voucher_audit_logs_archive USING btree (voucher_id)
  ```

---

## voucher_expiry_analytics

**Description:** Daily analytics on voucher expiry warnings and redemption rates

**Columns:** 13  
**Indexes:** 3  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `date` | date | ❌ | - |
| `total_vouchers_expiring` | integer | ✅ | 0 |
| `warnings_sent_7_days` | integer | ✅ | 0 |
| `warnings_sent_3_days` | integer | ✅ | 0 |
| `warnings_sent_1_day` | integer | ✅ | 0 |
| `warnings_sent_expiry_day` | integer | ✅ | 0 |
| `vouchers_redeemed_after_warning` | integer | ✅ | 0 |
| `vouchers_expired` | integer | ✅ | 0 |
| `expired_voucher_rate` | numeric | ✅ | 0 |
| `redemption_rate_after_warning` | numeric | ✅ | 0 |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_voucher_expiry_analytics_date**
  ```sql
  CREATE INDEX idx_voucher_expiry_analytics_date ON public.voucher_expiry_analytics USING btree (date)
  ```

- **voucher_expiry_analytics_date_key**
  ```sql
  CREATE UNIQUE INDEX voucher_expiry_analytics_date_key ON public.voucher_expiry_analytics USING btree (date)
  ```

- **voucher_expiry_analytics_pkey**
  ```sql
  CREATE UNIQUE INDEX voucher_expiry_analytics_pkey ON public.voucher_expiry_analytics USING btree (id)
  ```

---

## voucher_expiry_warnings

**Description:** Tracks expiry warnings sent to beneficiaries to prevent voucher loss

**Columns:** 12  
**Indexes:** 7  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `voucher_id` | uuid | ❌ | - |
| `user_id` | character varying(255) | ❌ | - |
| `warning_type` | character varying(50) | ❌ | - |
| `days_until_expiry` | integer | ❌ | - |
| `sent_at` | timestamp with time zone | ❌ | now() |
| `channel` | character varying(50) | ❌ | - |
| `status` | character varying(50) | ✅ | 'sent'::character varying |
| `error_message` | text | ✅ | - |
| `redeemed_after_warning` | boolean | ✅ | false |
| `redeemed_at` | timestamp with time zone | ✅ | - |
| `created_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_voucher_expiry_warnings_sent_at**
  ```sql
  CREATE INDEX idx_voucher_expiry_warnings_sent_at ON public.voucher_expiry_warnings USING btree (sent_at)
  ```

- **idx_voucher_expiry_warnings_status**
  ```sql
  CREATE INDEX idx_voucher_expiry_warnings_status ON public.voucher_expiry_warnings USING btree (status)
  ```

- **idx_voucher_expiry_warnings_unique**
  ```sql
  CREATE UNIQUE INDEX idx_voucher_expiry_warnings_unique ON public.voucher_expiry_warnings USING btree (voucher_id, warning_type)
  ```

- **idx_voucher_expiry_warnings_user_id**
  ```sql
  CREATE INDEX idx_voucher_expiry_warnings_user_id ON public.voucher_expiry_warnings USING btree (user_id)
  ```

- **idx_voucher_expiry_warnings_voucher_id**
  ```sql
  CREATE INDEX idx_voucher_expiry_warnings_voucher_id ON public.voucher_expiry_warnings USING btree (voucher_id)
  ```

- **idx_voucher_expiry_warnings_warning_type**
  ```sql
  CREATE INDEX idx_voucher_expiry_warnings_warning_type ON public.voucher_expiry_warnings USING btree (warning_type)
  ```

- **voucher_expiry_warnings_pkey**
  ```sql
  CREATE UNIQUE INDEX voucher_expiry_warnings_pkey ON public.voucher_expiry_warnings USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `voucher_id` | `vouchers.id` |

---

## voucher_redemptions

**Description:** Audit trail for all voucher redemptions - compliance requirement

**Columns:** 19  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `voucher_id` | uuid | ✅ | - |
| `user_id` | character varying(255) | ✅ | - |
| `redemption_method` | character varying(50) | ❌ | - |
| `redemption_point` | character varying(255) | ✅ | - |
| `amount` | numeric | ❌ | - |
| `nampay_reference` | character varying(255) | ✅ | - |
| `verification_method` | character varying(50) | ✅ | - |
| `verified_by` | character varying(255) | ✅ | - |
| `bank_account_number` | character varying(50) | ✅ | - |
| `bank_name` | character varying(100) | ✅ | - |
| `status` | character varying(50) | ✅ | 'pending'::character varying |
| `error_message` | text | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |
| `completed_at` | timestamp without time zone | ✅ | - |
| `settled_at` | timestamp without time zone | ✅ | - |
| `bank_account_number_encrypted` | text | ✅ | - |
| `bank_account_number_iv` | text | ✅ | - |
| `bank_account_number_tag` | text | ✅ | - |

### Indexes

- **idx_voucher_redemptions_nampay_ref**
  ```sql
  CREATE INDEX idx_voucher_redemptions_nampay_ref ON public.voucher_redemptions USING btree (nampay_reference)
  ```

- **idx_voucher_redemptions_status**
  ```sql
  CREATE INDEX idx_voucher_redemptions_status ON public.voucher_redemptions USING btree (status)
  ```

- **idx_voucher_redemptions_user_id**
  ```sql
  CREATE INDEX idx_voucher_redemptions_user_id ON public.voucher_redemptions USING btree (user_id)
  ```

- **idx_voucher_redemptions_voucher_id**
  ```sql
  CREATE INDEX idx_voucher_redemptions_voucher_id ON public.voucher_redemptions USING btree (voucher_id)
  ```

- **voucher_redemptions_pkey**
  ```sql
  CREATE UNIQUE INDEX voucher_redemptions_pkey ON public.voucher_redemptions USING btree (id)
  ```

---

## vouchers

**Description:** Government and merchant vouchers - Digital wallet and redemption platform (NOT virtual assets)

**Columns:** 38  
**Indexes:** 14  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `user_id` | character varying(255) | ✅ | - |
| `type` | character varying(50) | ❌ | - |
| `title` | character varying(255) | ❌ | - |
| `description` | text | ✅ | - |
| `amount` | numeric | ❌ | - |
| `status` | character varying(50) | ✅ | 'available'::character varying |
| `expiry_date` | date | ✅ | - |
| `redeemed_at` | timestamp without time zone | ✅ | - |
| `redemption_method` | character varying(50) | ✅ | - |
| `issuer` | character varying(255) | ✅ | - |
| `icon` | character varying(50) | ✅ | - |
| `voucher_code` | character varying(100) | ✅ | - |
| `batch_id` | character varying(100) | ✅ | - |
| `grant_type` | character varying(100) | ✅ | - |
| `nampay_reference` | character varying(255) | ✅ | - |
| `nampay_settled` | boolean | ✅ | false |
| `nampay_settled_at` | timestamp without time zone | ✅ | - |
| `verification_required` | boolean | ✅ | false |
| `verification_method` | character varying(50) | ✅ | - |
| `verified_at` | timestamp without time zone | ✅ | - |
| `verified_by` | character varying(255) | ✅ | - |
| `redemption_point` | character varying(255) | ✅ | - |
| `bank_account_number` | character varying(50) | ✅ | - |
| `bank_name` | character varying(100) | ✅ | - |
| `credit_advanced` | boolean | ✅ | false |
| `credit_settled` | boolean | ✅ | false |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `created_at` | timestamp without time zone | ✅ | now() |
| `updated_at` | timestamp without time zone | ✅ | now() |
| `bank_account_number_encrypted` | text | ✅ | - |
| `bank_account_number_iv` | text | ✅ | - |
| `bank_account_number_tag` | text | ✅ | - |
| `beneficiary_id` | character varying(255) | ✅ | - |
| `currency` | character varying(10) | ✅ | 'NAD'::character varying |
| `issued_at` | timestamp without time zone | ✅ | - |
| `smartpay_voucher_id` | character varying(255) | ✅ | - |
| `external_id` | character varying(255) | ✅ | - |

### Indexes

- **idx_vouchers_batch_id**
  ```sql
  CREATE INDEX idx_vouchers_batch_id ON public.vouchers USING btree (batch_id)
  ```

- **idx_vouchers_beneficiary_id**
  ```sql
  CREATE INDEX idx_vouchers_beneficiary_id ON public.vouchers USING btree (beneficiary_id) WHERE (beneficiary_id IS NOT NULL)
  ```

- **idx_vouchers_currency**
  ```sql
  CREATE INDEX idx_vouchers_currency ON public.vouchers USING btree (currency)
  ```

- **idx_vouchers_expiry**
  ```sql
  CREATE INDEX idx_vouchers_expiry ON public.vouchers USING btree (expiry_date) WHERE ((status)::text = 'available'::text)
  ```

- **idx_vouchers_external_id**
  ```sql
  CREATE INDEX idx_vouchers_external_id ON public.vouchers USING btree (external_id) WHERE (external_id IS NOT NULL)
  ```

- **idx_vouchers_nampay_settled**
  ```sql
  CREATE INDEX idx_vouchers_nampay_settled ON public.vouchers USING btree (nampay_settled) WHERE (nampay_settled = false)
  ```

- **idx_vouchers_redemption_method**
  ```sql
  CREATE INDEX idx_vouchers_redemption_method ON public.vouchers USING btree (redemption_method)
  ```

- **idx_vouchers_smartpay_voucher_id**
  ```sql
  CREATE INDEX idx_vouchers_smartpay_voucher_id ON public.vouchers USING btree (smartpay_voucher_id) WHERE (smartpay_voucher_id IS NOT NULL)
  ```

- **idx_vouchers_status**
  ```sql
  CREATE INDEX idx_vouchers_status ON public.vouchers USING btree (status)
  ```

- **idx_vouchers_type**
  ```sql
  CREATE INDEX idx_vouchers_type ON public.vouchers USING btree (type)
  ```

- **idx_vouchers_user_id**
  ```sql
  CREATE INDEX idx_vouchers_user_id ON public.vouchers USING btree (user_id)
  ```

- **idx_vouchers_voucher_code**
  ```sql
  CREATE INDEX idx_vouchers_voucher_code ON public.vouchers USING btree (voucher_code)
  ```

- **vouchers_pkey**
  ```sql
  CREATE UNIQUE INDEX vouchers_pkey ON public.vouchers USING btree (id)
  ```

- **vouchers_voucher_code_key**
  ```sql
  CREATE UNIQUE INDEX vouchers_voucher_code_key ON public.vouchers USING btree (voucher_code)
  ```

---

## wallet_dormancy_events

**Description:** Audit log for all dormancy-related wallet events

**Columns:** 9  
**Indexes:** 5  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `wallet_id` | uuid | ✅ | - |
| `user_id` | character varying(255) | ❌ | - |
| `event_type` | character varying(50) | ❌ | - |
| `previous_status` | character varying(20) | ✅ | - |
| `new_status` | character varying(20) | ✅ | - |
| `balance_at_event` | numeric | ✅ | - |
| `notes` | text | ✅ | - |
| `created_at` | timestamp without time zone | ✅ | now() |

### Indexes

- **idx_dormancy_events_created_at**
  ```sql
  CREATE INDEX idx_dormancy_events_created_at ON public.wallet_dormancy_events USING btree (created_at DESC)
  ```

- **idx_dormancy_events_type**
  ```sql
  CREATE INDEX idx_dormancy_events_type ON public.wallet_dormancy_events USING btree (event_type)
  ```

- **idx_dormancy_events_user_id**
  ```sql
  CREATE INDEX idx_dormancy_events_user_id ON public.wallet_dormancy_events USING btree (user_id)
  ```

- **idx_dormancy_events_wallet_id**
  ```sql
  CREATE INDEX idx_dormancy_events_wallet_id ON public.wallet_dormancy_events USING btree (wallet_id)
  ```

- **wallet_dormancy_events_pkey**
  ```sql
  CREATE UNIQUE INDEX wallet_dormancy_events_pkey ON public.wallet_dormancy_events USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `wallet_id` | `wallets.id` |

---

## wallet_dormancy_reports

**Description:** Monthly reports for Bank of Namibia (PSD-3 §11.4.6)

**Columns:** 15  
**Indexes:** 4  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `report_month` | date | ❌ | - |
| `report_type` | character varying(20) | ❌ | - |
| `total_wallets` | integer | ✅ | - |
| `active_wallets` | integer | ✅ | - |
| `warning_wallets` | integer | ✅ | - |
| `dormant_wallets` | integer | ✅ | - |
| `closed_wallets` | integer | ✅ | - |
| `total_dormant_balance` | numeric | ✅ | - |
| `funds_released_this_period` | numeric | ✅ | - |
| `new_dormant_wallets` | integer | ✅ | - |
| `reactivated_wallets` | integer | ✅ | - |
| `generated_at` | timestamp without time zone | ✅ | now() |
| `generated_by` | character varying(255) | ✅ | - |
| `report_data` | jsonb | ✅ | - |

### Indexes

- **idx_dormancy_reports_month**
  ```sql
  CREATE INDEX idx_dormancy_reports_month ON public.wallet_dormancy_reports USING btree (report_month DESC)
  ```

- **idx_dormancy_reports_type**
  ```sql
  CREATE INDEX idx_dormancy_reports_type ON public.wallet_dormancy_reports USING btree (report_type)
  ```

- **wallet_dormancy_reports_pkey**
  ```sql
  CREATE UNIQUE INDEX wallet_dormancy_reports_pkey ON public.wallet_dormancy_reports USING btree (id)
  ```

- **wallet_dormancy_reports_report_month_report_type_key**
  ```sql
  CREATE UNIQUE INDEX wallet_dormancy_reports_report_month_report_type_key ON public.wallet_dormancy_reports USING btree (report_month, report_type)
  ```

---

## wallets

**Columns:** 29  
**Indexes:** 11  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | uuid_generate_v4() |
| `user_id` | uuid | ❌ | - |
| `name` | text | ❌ | - |
| `type` | text | ❌ | - |
| `currency` | text | ❌ | 'NAD'::text |
| `balance` | numeric | ❌ | 0.00 |
| `available_balance` | numeric | ❌ | 0.00 |
| `status` | text | ❌ | 'active'::text |
| `is_default` | boolean | ✅ | false |
| `created_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `updated_at` | timestamp with time zone | ✅ | CURRENT_TIMESTAMP |
| `metadata` | jsonb | ✅ | '{}'::jsonb |
| `last_transaction_at` | timestamp without time zone | ✅ | - |
| `dormancy_status` | character varying(20) | ✅ | 'active'::character varying |
| `dormancy_warning_sent_at` | timestamp without time zone | ✅ | - |
| `dormancy_started_at` | timestamp without time zone | ✅ | - |
| `dormancy_scheduled_release_at` | timestamp without time zone | ✅ | - |
| `dormancy_notes` | text | ✅ | - |
| `icon` | character varying(50) | ✅ | - |
| `purpose` | text | ✅ | - |
| `card_design` | integer | ✅ | 2 |
| `card_number` | character varying(4) | ✅ | - |
| `cardholder_name` | character varying(255) | ✅ | - |
| `expiry_date` | character varying(5) | ✅ | - |
| `auto_pay_enabled` | boolean | ✅ | false |
| `auto_pay_max_amount` | numeric | ✅ | - |
| `auto_pay_settings` | jsonb | ✅ | '{}'::jsonb |
| `pin_protected` | boolean | ✅ | false |
| `biometric_enabled` | boolean | ✅ | false |

### Indexes

- **idx_wallets_auto_pay_enabled**
  ```sql
  CREATE INDEX idx_wallets_auto_pay_enabled ON public.wallets USING btree (auto_pay_enabled) WHERE (auto_pay_enabled = true)
  ```

- **idx_wallets_card_number**
  ```sql
  CREATE INDEX idx_wallets_card_number ON public.wallets USING btree (card_number) WHERE (card_number IS NOT NULL)
  ```

- **idx_wallets_dormancy_warning**
  ```sql
  CREATE INDEX idx_wallets_dormancy_warning ON public.wallets USING btree (last_transaction_at) WHERE (((dormancy_status)::text = 'active'::text) AND (dormancy_warning_sent_at IS NULL))
  ```

- **idx_wallets_dormant**
  ```sql
  CREATE INDEX idx_wallets_dormant ON public.wallets USING btree (dormancy_status, last_transaction_at) WHERE ((dormancy_status)::text = ANY ((ARRAY['warning'::character varying, 'dormant'::character varying])::text[]))
  ```

- **idx_wallets_is_default**
  ```sql
  CREATE INDEX idx_wallets_is_default ON public.wallets USING btree (user_id, is_default) WHERE (is_default = true)
  ```

- **idx_wallets_status**
  ```sql
  CREATE INDEX idx_wallets_status ON public.wallets USING btree (status)
  ```

- **idx_wallets_user_default**
  ```sql
  CREATE UNIQUE INDEX idx_wallets_user_default ON public.wallets USING btree (user_id) WHERE (is_default = true)
  ```

- **idx_wallets_user_id**
  ```sql
  CREATE INDEX idx_wallets_user_id ON public.wallets USING btree (user_id)
  ```

- **idx_wallets_user_type**
  ```sql
  CREATE INDEX idx_wallets_user_type ON public.wallets USING btree (user_id, type)
  ```

- **idx_wallets_with_balance**
  ```sql
  CREATE INDEX idx_wallets_with_balance ON public.wallets USING btree (balance) WHERE (balance > (0)::numeric)
  ```

- **wallets_pkey**
  ```sql
  CREATE UNIQUE INDEX wallets_pkey ON public.wallets USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---

## webhook_events

**Columns:** 12  
**Indexes:** 5  
**Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | ❌ | gen_random_uuid() |
| `event_type` | character varying(50) | ❌ | - |
| `voucher_id` | character varying(100) | ❌ | - |
| `status` | character varying(20) | ❌ | 'pending'::character varying |
| `delivery_attempts` | integer | ❌ | 0 |
| `last_attempt_at` | timestamp with time zone | ❌ | now() |
| `delivered_at` | timestamp with time zone | ✅ | - |
| `error_message` | text | ✅ | - |
| `signature_valid` | boolean | ❌ | false |
| `payload` | jsonb | ❌ | '{}'::jsonb |
| `created_at` | timestamp with time zone | ❌ | now() |
| `updated_at` | timestamp with time zone | ❌ | now() |

### Indexes

- **idx_webhook_events_created_at**
  ```sql
  CREATE INDEX idx_webhook_events_created_at ON public.webhook_events USING btree (created_at)
  ```

- **idx_webhook_events_event_type**
  ```sql
  CREATE INDEX idx_webhook_events_event_type ON public.webhook_events USING btree (event_type)
  ```

- **idx_webhook_events_status**
  ```sql
  CREATE INDEX idx_webhook_events_status ON public.webhook_events USING btree (status)
  ```

- **idx_webhook_events_voucher_id**
  ```sql
  CREATE INDEX idx_webhook_events_voucher_id ON public.webhook_events USING btree (voucher_id)
  ```

- **webhook_events_pkey**
  ```sql
  CREATE UNIQUE INDEX webhook_events_pkey ON public.webhook_events USING btree (id)
  ```

---

## xp_transactions

**Description:** History of all BP awards and sources

**Columns:** 7  
**Indexes:** 4  
**Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | integer | ❌ | nextval('xp_transactions_id_seq'::regclass) |
| `user_id` | uuid | ❌ | - |
| `bp_amount` | integer | ❌ | - |
| `source` | character varying(50) | ❌ | - |
| `description` | text | ❌ | - |
| `metadata` | jsonb | ✅ | - |
| `created_at` | timestamp without time zone | ❌ | CURRENT_TIMESTAMP |

### Indexes

- **idx_xp_transactions_created_at**
  ```sql
  CREATE INDEX idx_xp_transactions_created_at ON public.xp_transactions USING btree (created_at DESC)
  ```

- **idx_xp_transactions_source**
  ```sql
  CREATE INDEX idx_xp_transactions_source ON public.xp_transactions USING btree (source)
  ```

- **idx_xp_transactions_user_id**
  ```sql
  CREATE INDEX idx_xp_transactions_user_id ON public.xp_transactions USING btree (user_id)
  ```

- **xp_transactions_pkey**
  ```sql
  CREATE UNIQUE INDEX xp_transactions_pkey ON public.xp_transactions USING btree (id)
  ```

### Foreign Keys

| Column | References |
|--------|------------|
| `user_id` | `users.id` |

---


# Database Schema Report - Ecosystem Tables
**Generated:** 2026-01-28T08:57:10.961Z
**Total Tables:** 17

---

## nampost_branches

**Rows:** 0 | **Columns:** 17 | **Indexes:** 6 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `branch_id` | character varying | NO | NULL |
| `name` | character varying | NO | NULL |
| `address` | character varying | NO | NULL |
| `city` | character varying | NO | NULL |
| `region` | character varying | NO | NULL |
| `latitude` | numeric | NO | NULL |
| `longitude` | numeric | NO | NULL |
| `phone_number` | character varying | YES | NULL |
| `email` | character varying | YES | NULL |
| `services` | ARRAY | NO | NULL |
| `operating_hours` | jsonb | YES | NULL |
| `capacity_metrics` | jsonb | YES | NULL |
| `current_load` | integer | YES | 0 |
| `average_wait_time` | integer | YES | 0 |
| `status` | character varying | YES | 'active'::character varying |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_nampost_branches_city`: CREATE INDEX idx_nampost_branches_city ON public.nampost_branches USING btree (city)
- `idx_nampost_branches_latitude`: CREATE INDEX idx_nampost_branches_latitude ON public.nampost_branches USING btree (latitude)
- `idx_nampost_branches_longitude`: CREATE INDEX idx_nampost_branches_longitude ON public.nampost_branches USING btree (longitude)
- `idx_nampost_branches_region`: CREATE INDEX idx_nampost_branches_region ON public.nampost_branches USING btree (region)
- `idx_nampost_branches_status`: CREATE INDEX idx_nampost_branches_status ON public.nampost_branches USING btree (status)
- `nampost_branches_pkey`: CREATE UNIQUE INDEX nampost_branches_pkey ON public.nampost_branches USING btree (branch_id)

---

## nampost_staff

**Rows:** 0 | **Columns:** 11 | **Indexes:** 3 | **Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `staff_id` | character varying | NO | NULL |
| `branch_id` | character varying | NO | NULL |
| `name` | character varying | NO | NULL |
| `role` | character varying | NO | NULL |
| `phone_number` | character varying | YES | NULL |
| `email` | character varying | YES | NULL |
| `specialization` | ARRAY | YES | NULL |
| `availability` | jsonb | YES | NULL |
| `performance_metrics` | jsonb | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_nampost_staff_branch`: CREATE INDEX idx_nampost_staff_branch ON public.nampost_staff USING btree (branch_id)
- `idx_nampost_staff_role`: CREATE INDEX idx_nampost_staff_role ON public.nampost_staff USING btree (role)
- `nampost_staff_pkey`: CREATE UNIQUE INDEX nampost_staff_pkey ON public.nampost_staff USING btree (staff_id)

### Foreign Keys

- `branch_id` → `nampost_branches.branch_id`

---

## nampost_branch_load

**Rows:** 0 | **Columns:** 8 | **Indexes:** 4 | **Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `branch_id` | character varying | NO | NULL |
| `timestamp` | timestamp with time zone | NO | now() |
| `current_load` | integer | NO | NULL |
| `wait_time` | integer | NO | NULL |
| `queue_length` | integer | YES | 0 |
| `concentration_level` | character varying | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_nampost_branch_load_branch`: CREATE INDEX idx_nampost_branch_load_branch ON public.nampost_branch_load USING btree (branch_id)
- `idx_nampost_branch_load_concentration`: CREATE INDEX idx_nampost_branch_load_concentration ON public.nampost_branch_load USING btree (concentration_level)
- `idx_nampost_branch_load_timestamp`: CREATE INDEX idx_nampost_branch_load_timestamp ON public.nampost_branch_load USING btree ("timestamp" DESC)
- `nampost_branch_load_pkey`: CREATE UNIQUE INDEX nampost_branch_load_pkey ON public.nampost_branch_load USING btree (id)

### Foreign Keys

- `branch_id` → `nampost_branches.branch_id`

---

## recommendations

**Rows:** 0 | **Columns:** 9 | **Indexes:** 5 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | character varying | NO | NULL |
| `recommendation_type` | character varying | NO | NULL |
| `primary_recommendation` | jsonb | NO | NULL |
| `alternatives` | jsonb | YES | NULL |
| `concentration_alert` | jsonb | YES | NULL |
| `user_action` | character varying | YES | NULL |
| `action_timestamp` | timestamp with time zone | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_recommendations_action`: CREATE INDEX idx_recommendations_action ON public.recommendations USING btree (user_action)
- `idx_recommendations_created`: CREATE INDEX idx_recommendations_created ON public.recommendations USING btree (created_at DESC)
- `idx_recommendations_type`: CREATE INDEX idx_recommendations_type ON public.recommendations USING btree (recommendation_type)
- `idx_recommendations_user`: CREATE INDEX idx_recommendations_user ON public.recommendations USING btree (user_id)
- `recommendations_pkey`: CREATE UNIQUE INDEX recommendations_pkey ON public.recommendations USING btree (id)

---

## recommendation_effectiveness

**Rows:** 0 | **Columns:** 7 | **Indexes:** 3 | **Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `recommendation_id` | uuid | NO | NULL |
| `outcome` | character varying | YES | NULL |
| `user_satisfaction` | integer | YES | NULL |
| `wait_time_reduction` | integer | YES | NULL |
| `distance_optimization` | numeric | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_recommendation_effectiveness_outcome`: CREATE INDEX idx_recommendation_effectiveness_outcome ON public.recommendation_effectiveness USING btree (outcome)
- `idx_recommendation_effectiveness_recommendation`: CREATE INDEX idx_recommendation_effectiveness_recommendation ON public.recommendation_effectiveness USING btree (recommendation_id)
- `recommendation_effectiveness_pkey`: CREATE UNIQUE INDEX recommendation_effectiveness_pkey ON public.recommendation_effectiveness USING btree (id)

### Foreign Keys

- `recommendation_id` → `recommendations.id`

---

## concentration_alerts

**Rows:** 0 | **Columns:** 10 | **Indexes:** 4 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `branch_id` | character varying | NO | NULL |
| `concentration_level` | character varying | NO | NULL |
| `current_load` | integer | NO | NULL |
| `max_capacity` | integer | NO | NULL |
| `wait_time` | integer | NO | NULL |
| `beneficiaries_notified` | integer | YES | 0 |
| `agents_suggested` | integer | YES | 0 |
| `resolved_at` | timestamp with time zone | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `concentration_alerts_pkey`: CREATE UNIQUE INDEX concentration_alerts_pkey ON public.concentration_alerts USING btree (id)
- `idx_concentration_alerts_branch`: CREATE INDEX idx_concentration_alerts_branch ON public.concentration_alerts USING btree (branch_id)
- `idx_concentration_alerts_created`: CREATE INDEX idx_concentration_alerts_created ON public.concentration_alerts USING btree (created_at DESC)
- `idx_concentration_alerts_level`: CREATE INDEX idx_concentration_alerts_level ON public.concentration_alerts USING btree (concentration_level)

---

## liquidity_recommendations

**Rows:** 0 | **Columns:** 10 | **Indexes:** 5 | **Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `agent_id` | uuid | NO | NULL |
| `recommendation_type` | character varying | NO | NULL |
| `priority` | character varying | NO | NULL |
| `details` | text | NO | NULL |
| `estimated_impact` | text | YES | NULL |
| `demand_forecast` | jsonb | YES | NULL |
| `agent_action` | character varying | YES | NULL |
| `action_timestamp` | timestamp with time zone | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_liquidity_recommendations_action`: CREATE INDEX idx_liquidity_recommendations_action ON public.liquidity_recommendations USING btree (agent_action)
- `idx_liquidity_recommendations_agent`: CREATE INDEX idx_liquidity_recommendations_agent ON public.liquidity_recommendations USING btree (agent_id)
- `idx_liquidity_recommendations_priority`: CREATE INDEX idx_liquidity_recommendations_priority ON public.liquidity_recommendations USING btree (priority)
- `idx_liquidity_recommendations_type`: CREATE INDEX idx_liquidity_recommendations_type ON public.liquidity_recommendations USING btree (recommendation_type)
- `liquidity_recommendations_pkey`: CREATE UNIQUE INDEX liquidity_recommendations_pkey ON public.liquidity_recommendations USING btree (id)

### Foreign Keys

- `agent_id` → `agents.id`

---

## leaderboard_rankings

**Rows:** 0 | **Columns:** 13 | **Indexes:** 6 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `category` | character varying | NO | NULL |
| `period` | character varying | NO | NULL |
| `participant_id` | character varying | NO | NULL |
| `participant_name` | character varying | NO | NULL |
| `rank` | integer | NO | NULL |
| `metrics` | jsonb | NO | NULL |
| `total_score` | numeric | NO | NULL |
| `incentive_amount` | numeric | YES | NULL |
| `incentive_currency` | character varying | YES | 'NAD'::character varying |
| `incentive_type` | character varying | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_leaderboard_rankings_category`: CREATE INDEX idx_leaderboard_rankings_category ON public.leaderboard_rankings USING btree (category)
- `idx_leaderboard_rankings_participant`: CREATE INDEX idx_leaderboard_rankings_participant ON public.leaderboard_rankings USING btree (participant_id)
- `idx_leaderboard_rankings_period`: CREATE INDEX idx_leaderboard_rankings_period ON public.leaderboard_rankings USING btree (period)
- `idx_leaderboard_rankings_rank`: CREATE INDEX idx_leaderboard_rankings_rank ON public.leaderboard_rankings USING btree (category, period, rank)
- `leaderboard_rankings_category_period_participant_id_key`: CREATE UNIQUE INDEX leaderboard_rankings_category_period_participant_id_key ON public.leaderboard_rankings USING btree (category, period, participant_id)
- `leaderboard_rankings_pkey`: CREATE UNIQUE INDEX leaderboard_rankings_pkey ON public.leaderboard_rankings USING btree (id)

---

## leaderboard_incentives

**Rows:** 0 | **Columns:** 9 | **Indexes:** 3 | **Foreign Keys:** 1

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `ranking_id` | uuid | NO | NULL |
| `amount` | numeric | NO | NULL |
| `currency` | character varying | YES | 'NAD'::character varying |
| `incentive_type` | character varying | NO | NULL |
| `status` | character varying | YES | 'pending'::character varying |
| `paid_at` | timestamp with time zone | YES | NULL |
| `payment_reference` | character varying | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_leaderboard_incentives_ranking`: CREATE INDEX idx_leaderboard_incentives_ranking ON public.leaderboard_incentives USING btree (ranking_id)
- `idx_leaderboard_incentives_status`: CREATE INDEX idx_leaderboard_incentives_status ON public.leaderboard_incentives USING btree (status)
- `leaderboard_incentives_pkey`: CREATE UNIQUE INDEX leaderboard_incentives_pkey ON public.leaderboard_incentives USING btree (id)

### Foreign Keys

- `ranking_id` → `leaderboard_rankings.id`

---

## bottleneck_metrics

**Rows:** 0 | **Columns:** 9 | **Indexes:** 3 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `date` | date | NO | NULL |
| `nampost_branch_load_before` | numeric | YES | NULL |
| `nampost_branch_load_after` | numeric | YES | NULL |
| `agent_network_usage_percentage` | numeric | YES | NULL |
| `bottleneck_reduction_percentage` | numeric | YES | NULL |
| `beneficiaries_routed_to_agents` | integer | YES | 0 |
| `average_wait_time_reduction` | integer | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `bottleneck_metrics_date_key`: CREATE UNIQUE INDEX bottleneck_metrics_date_key ON public.bottleneck_metrics USING btree (date)
- `bottleneck_metrics_pkey`: CREATE UNIQUE INDEX bottleneck_metrics_pkey ON public.bottleneck_metrics USING btree (id)
- `idx_bottleneck_metrics_date`: CREATE INDEX idx_bottleneck_metrics_date ON public.bottleneck_metrics USING btree (date DESC)

---

## merchant_onboarding

**Rows:** 0 | **Columns:** 15 | **Indexes:** 4 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `onboarding_id` | character varying | NO | NULL |
| `business_name` | character varying | NO | NULL |
| `business_type` | character varying | NO | NULL |
| `location` | jsonb | NO | NULL |
| `contact` | jsonb | NO | NULL |
| `documents` | jsonb | YES | NULL |
| `status` | character varying | YES | 'document_verification'::character varying |
| `progress` | integer | YES | 0 |
| `current_step` | character varying | YES | NULL |
| `completed_steps` | ARRAY | YES | NULL |
| `pending_steps` | ARRAY | YES | NULL |
| `estimated_completion` | date | YES | NULL |
| `issues` | jsonb | YES | '[]'::jsonb |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_merchant_onboarding_business_type`: CREATE INDEX idx_merchant_onboarding_business_type ON public.merchant_onboarding USING btree (business_type)
- `idx_merchant_onboarding_created`: CREATE INDEX idx_merchant_onboarding_created ON public.merchant_onboarding USING btree (created_at DESC)
- `idx_merchant_onboarding_status`: CREATE INDEX idx_merchant_onboarding_status ON public.merchant_onboarding USING btree (status)
- `merchant_onboarding_pkey`: CREATE UNIQUE INDEX merchant_onboarding_pkey ON public.merchant_onboarding USING btree (onboarding_id)

---

## agent_onboarding

**Rows:** 0 | **Columns:** 16 | **Indexes:** 4 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `onboarding_id` | character varying | NO | NULL |
| `business_name` | character varying | NO | NULL |
| `agent_type` | character varying | NO | NULL |
| `location` | jsonb | NO | NULL |
| `contact` | jsonb | NO | NULL |
| `liquidity_requirements` | jsonb | YES | NULL |
| `documents` | jsonb | YES | NULL |
| `status` | character varying | YES | 'document_verification'::character varying |
| `progress` | integer | YES | 0 |
| `current_step` | character varying | YES | NULL |
| `completed_steps` | ARRAY | YES | NULL |
| `pending_steps` | ARRAY | YES | NULL |
| `estimated_completion` | date | YES | NULL |
| `issues` | jsonb | YES | '[]'::jsonb |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `agent_onboarding_pkey`: CREATE UNIQUE INDEX agent_onboarding_pkey ON public.agent_onboarding USING btree (onboarding_id)
- `idx_agent_onboarding_agent_type`: CREATE INDEX idx_agent_onboarding_agent_type ON public.agent_onboarding USING btree (agent_type)
- `idx_agent_onboarding_created`: CREATE INDEX idx_agent_onboarding_created ON public.agent_onboarding USING btree (created_at DESC)
- `idx_agent_onboarding_status`: CREATE INDEX idx_agent_onboarding_status ON public.agent_onboarding USING btree (status)

---

## onboarding_documents

**Rows:** 0 | **Columns:** 10 | **Indexes:** 4 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `onboarding_id` | character varying | NO | NULL |
| `document_type` | character varying | NO | NULL |
| `document_data` | bytea | YES | NULL |
| `document_url` | text | YES | NULL |
| `verification_status` | character varying | YES | 'pending'::character varying |
| `verified_at` | timestamp with time zone | YES | NULL |
| `verified_by` | character varying | YES | NULL |
| `rejection_reason` | text | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |

### Indexes

- `idx_onboarding_documents_onboarding`: CREATE INDEX idx_onboarding_documents_onboarding ON public.onboarding_documents USING btree (onboarding_id)
- `idx_onboarding_documents_status`: CREATE INDEX idx_onboarding_documents_status ON public.onboarding_documents USING btree (verification_status)
- `idx_onboarding_documents_type`: CREATE INDEX idx_onboarding_documents_type ON public.onboarding_documents USING btree (document_type)
- `onboarding_documents_pkey`: CREATE UNIQUE INDEX onboarding_documents_pkey ON public.onboarding_documents USING btree (id)

---

## beneficiary_clusters

**Rows:** 0 | **Columns:** 11 | **Indexes:** 5 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `region` | character varying | NO | NULL |
| `cluster_id` | integer | NO | NULL |
| `centroid_latitude` | numeric | NO | NULL |
| `centroid_longitude` | numeric | NO | NULL |
| `beneficiary_count` | integer | YES | 0 |
| `transaction_volume` | numeric | YES | 0 |
| `average_transaction_amount` | numeric | YES | 0 |
| `preferred_cashout_location` | character varying | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `beneficiary_clusters_pkey`: CREATE UNIQUE INDEX beneficiary_clusters_pkey ON public.beneficiary_clusters USING btree (id)
- `beneficiary_clusters_region_cluster_id_key`: CREATE UNIQUE INDEX beneficiary_clusters_region_cluster_id_key ON public.beneficiary_clusters USING btree (region, cluster_id)
- `idx_beneficiary_clusters_latitude`: CREATE INDEX idx_beneficiary_clusters_latitude ON public.beneficiary_clusters USING btree (centroid_latitude)
- `idx_beneficiary_clusters_longitude`: CREATE INDEX idx_beneficiary_clusters_longitude ON public.beneficiary_clusters USING btree (centroid_longitude)
- `idx_beneficiary_clusters_region`: CREATE INDEX idx_beneficiary_clusters_region ON public.beneficiary_clusters USING btree (region)

---

## agent_clusters

**Rows:** 0 | **Columns:** 9 | **Indexes:** 3 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `region` | character varying | NO | NULL |
| `cluster_id` | integer | YES | NULL |
| `density_type` | character varying | YES | NULL |
| `agent_count` | integer | YES | 0 |
| `transaction_volume` | numeric | YES | 0 |
| `average_liquidity` | numeric | YES | 0 |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `agent_clusters_pkey`: CREATE UNIQUE INDEX agent_clusters_pkey ON public.agent_clusters USING btree (id)
- `idx_agent_clusters_density`: CREATE INDEX idx_agent_clusters_density ON public.agent_clusters USING btree (density_type)
- `idx_agent_clusters_region`: CREATE INDEX idx_agent_clusters_region ON public.agent_clusters USING btree (region)

---

## demand_hotspots

**Rows:** 0 | **Columns:** 12 | **Indexes:** 5 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `location_address` | character varying | NO | NULL |
| `latitude` | numeric | NO | NULL |
| `longitude` | numeric | NO | NULL |
| `region` | character varying | NO | NULL |
| `beneficiary_density` | numeric | YES | NULL |
| `transaction_demand_per_month` | numeric | YES | NULL |
| `current_agent_coverage` | integer | YES | 0 |
| `recommended_agent_count` | integer | YES | 0 |
| `priority` | character varying | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `demand_hotspots_pkey`: CREATE UNIQUE INDEX demand_hotspots_pkey ON public.demand_hotspots USING btree (id)
- `idx_demand_hotspots_latitude`: CREATE INDEX idx_demand_hotspots_latitude ON public.demand_hotspots USING btree (latitude)
- `idx_demand_hotspots_longitude`: CREATE INDEX idx_demand_hotspots_longitude ON public.demand_hotspots USING btree (longitude)
- `idx_demand_hotspots_priority`: CREATE INDEX idx_demand_hotspots_priority ON public.demand_hotspots USING btree (priority)
- `idx_demand_hotspots_region`: CREATE INDEX idx_demand_hotspots_region ON public.demand_hotspots USING btree (region)

---

## coverage_gaps

**Rows:** 0 | **Columns:** 11 | **Indexes:** 5 | **Foreign Keys:** 0

### Columns

| Column | Type | Nullable | Default |
|--------|------|----------|----------|
| `id` | uuid | NO | gen_random_uuid() |
| `location_address` | character varying | NO | NULL |
| `latitude` | numeric | NO | NULL |
| `longitude` | numeric | NO | NULL |
| `region` | character varying | NO | NULL |
| `beneficiary_count` | integer | YES | 0 |
| `nearest_agent_distance_km` | numeric | YES | NULL |
| `recommended_agent_type` | character varying | YES | NULL |
| `priority` | character varying | YES | NULL |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

### Indexes

- `coverage_gaps_pkey`: CREATE UNIQUE INDEX coverage_gaps_pkey ON public.coverage_gaps USING btree (id)
- `idx_coverage_gaps_latitude`: CREATE INDEX idx_coverage_gaps_latitude ON public.coverage_gaps USING btree (latitude)
- `idx_coverage_gaps_longitude`: CREATE INDEX idx_coverage_gaps_longitude ON public.coverage_gaps USING btree (longitude)
- `idx_coverage_gaps_priority`: CREATE INDEX idx_coverage_gaps_priority ON public.coverage_gaps USING btree (priority)
- `idx_coverage_gaps_region`: CREATE INDEX idx_coverage_gaps_region ON public.coverage_gaps USING btree (region)

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tables | 17 |
| Total Columns | 187 |
| Total Indexes | 72 |
| Total Foreign Keys | 5 |
| Total Rows | 0 |

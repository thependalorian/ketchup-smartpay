-- Incident Reporting System Migration
-- Location: sql/migration_incident_reporting.sql
-- Purpose: Database schema for PSD-12 §11.13-15 cybersecurity incident reporting
-- 
-- === BANK OF NAMIBIA PSD-12 REQUIREMENTS ===
-- 
-- §11.13: Report successful cyberattacks within 24 hours (preliminary)
-- §11.14: Impact assessment within 1 month
-- §11.15: Report financial loss, data loss, availability loss

-- ============================================================================
-- SECURITY INCIDENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Incident Identification
  incident_number VARCHAR(50) UNIQUE NOT NULL, -- Format: INC-YYYYMMDD-XXXX
  incident_type VARCHAR(50) NOT NULL, -- 'cyberattack', 'data_breach', 'system_failure', 'fraud', 'unauthorized_access'
  severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
  status VARCHAR(30) NOT NULL DEFAULT 'detected', -- 'detected', 'investigating', 'contained', 'resolved', 'closed'
  
  -- Detection and Timeline
  detected_at TIMESTAMP NOT NULL,
  detected_by VARCHAR(255), -- User/system that detected
  detection_method VARCHAR(100), -- 'automated_monitoring', 'user_report', 'audit', 'external_notification'
  contained_at TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  -- Notification Timeline (PSD-12 §11.13)
  preliminary_notification_sent_at TIMESTAMP,
  preliminary_notification_deadline TIMESTAMP, -- detected_at + 24 hours
  impact_assessment_due_at TIMESTAMP, -- detected_at + 1 month
  impact_assessment_submitted_at TIMESTAMP,
  
  -- Description
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  attack_vector TEXT, -- How the attack was carried out
  affected_systems TEXT[], -- List of affected systems
  root_cause TEXT,
  
  -- Impact Assessment (PSD-12 §11.15)
  financial_loss DECIMAL(15, 2) DEFAULT 0.00,
  financial_loss_currency VARCHAR(10) DEFAULT 'NAD',
  customers_affected INTEGER DEFAULT 0,
  data_records_affected INTEGER DEFAULT 0,
  data_types_exposed TEXT[], -- 'personal_info', 'financial_data', 'credentials', etc.
  availability_impact_hours DECIMAL(10, 2) DEFAULT 0, -- Hours of service unavailability
  
  -- Response Actions
  immediate_actions_taken TEXT,
  containment_measures TEXT,
  remediation_steps TEXT,
  
  -- Regulatory Reporting
  reported_to_bon BOOLEAN DEFAULT FALSE, -- Bank of Namibia
  bon_reference_number VARCHAR(100),
  reported_to_fic BOOLEAN DEFAULT FALSE, -- Financial Intelligence Centre
  fic_reference_number VARCHAR(100),
  
  -- Follow-up
  lessons_learned TEXT,
  preventive_measures TEXT,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_actions TEXT,
  
  -- Metadata
  created_by VARCHAR(255) NOT NULL,
  updated_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incidents_number ON security_incidents(incident_number);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON security_incidents(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_notification_deadline ON security_incidents(preliminary_notification_deadline)
  WHERE preliminary_notification_sent_at IS NULL;

-- ============================================================================
-- INCIDENT UPDATES/COMMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES security_incidents(id) ON DELETE CASCADE,
  update_type VARCHAR(50) NOT NULL, -- 'status_change', 'investigation', 'containment', 'resolution', 'comment'
  previous_status VARCHAR(30),
  new_status VARCHAR(30),
  content TEXT NOT NULL,
  attachments JSONB, -- Array of attachment references
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_updates_created_at ON incident_updates(created_at DESC);

-- ============================================================================
-- INCIDENT NOTIFICATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS incident_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID REFERENCES security_incidents(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'preliminary', 'update', 'impact_assessment', 'closure'
  recipient_type VARCHAR(50) NOT NULL, -- 'bon', 'fic', 'internal', 'affected_customers'
  recipient_email VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP,
  delivery_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  reference_number VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incident_notifications_incident_id ON incident_notifications(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_notifications_type ON incident_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_incident_notifications_status ON incident_notifications(delivery_status);

-- ============================================================================
-- INCIDENT METRICS TABLE (for dashboard/reporting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS incident_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_period DATE NOT NULL, -- First day of the period
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
  
  -- Counts
  total_incidents INTEGER DEFAULT 0,
  critical_incidents INTEGER DEFAULT 0,
  high_incidents INTEGER DEFAULT 0,
  medium_incidents INTEGER DEFAULT 0,
  low_incidents INTEGER DEFAULT 0,
  
  -- By Type
  cyberattack_count INTEGER DEFAULT 0,
  data_breach_count INTEGER DEFAULT 0,
  system_failure_count INTEGER DEFAULT 0,
  fraud_count INTEGER DEFAULT 0,
  unauthorized_access_count INTEGER DEFAULT 0,
  
  -- Resolution
  incidents_resolved INTEGER DEFAULT 0,
  avg_resolution_hours DECIMAL(10, 2),
  
  -- Impact
  total_financial_loss DECIMAL(15, 2) DEFAULT 0.00,
  total_customers_affected INTEGER DEFAULT 0,
  total_availability_loss_hours DECIMAL(10, 2) DEFAULT 0,
  
  -- Compliance
  notifications_sent_on_time INTEGER DEFAULT 0,
  notifications_late INTEGER DEFAULT 0,
  impact_assessments_on_time INTEGER DEFAULT 0,
  impact_assessments_late INTEGER DEFAULT 0,
  
  -- Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(report_period, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_incident_metrics_period ON incident_metrics(report_period DESC);
CREATE INDEX IF NOT EXISTS idx_incident_metrics_type ON incident_metrics(period_type);

-- ============================================================================
-- FUNCTION: GENERATE INCIDENT NUMBER
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_incident_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_num INTEGER;
BEGIN
  -- Get next sequence number for today
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(incident_number FROM 'INC-[0-9]{8}-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM security_incidents
  WHERE incident_number LIKE 'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-%';
  
  NEW.incident_number := 'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  -- Set notification deadline (24 hours from detection)
  NEW.preliminary_notification_deadline := NEW.detected_at + INTERVAL '24 hours';
  
  -- Set impact assessment deadline (1 month from detection)
  NEW.impact_assessment_due_at := NEW.detected_at + INTERVAL '1 month';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_generate_incident_number ON security_incidents;
CREATE TRIGGER trg_generate_incident_number
BEFORE INSERT ON security_incidents
FOR EACH ROW
WHEN (NEW.incident_number IS NULL)
EXECUTE FUNCTION generate_incident_number();

-- ============================================================================
-- VIEW: PENDING NOTIFICATIONS
-- ============================================================================

CREATE OR REPLACE VIEW v_pending_incident_notifications AS
SELECT
  i.id,
  i.incident_number,
  i.incident_type,
  i.severity,
  i.status,
  i.title,
  i.detected_at,
  i.preliminary_notification_deadline,
  i.preliminary_notification_sent_at,
  i.impact_assessment_due_at,
  i.impact_assessment_submitted_at,
  -- Hours until notification deadline
  EXTRACT(EPOCH FROM (i.preliminary_notification_deadline - NOW())) / 3600 AS hours_until_notification_deadline,
  -- Days until impact assessment deadline
  EXTRACT(DAY FROM (i.impact_assessment_due_at - NOW())) AS days_until_assessment_deadline,
  -- Is notification overdue
  CASE
    WHEN i.preliminary_notification_sent_at IS NULL 
      AND NOW() > i.preliminary_notification_deadline THEN TRUE
    ELSE FALSE
  END AS notification_overdue,
  -- Is impact assessment overdue
  CASE
    WHEN i.impact_assessment_submitted_at IS NULL 
      AND NOW() > i.impact_assessment_due_at THEN TRUE
    ELSE FALSE
  END AS assessment_overdue
FROM security_incidents i
WHERE i.status NOT IN ('closed')
  AND (
    i.preliminary_notification_sent_at IS NULL
    OR i.impact_assessment_submitted_at IS NULL
  )
ORDER BY i.preliminary_notification_deadline ASC;

-- ============================================================================
-- VIEW: INCIDENT SUMMARY
-- ============================================================================

CREATE OR REPLACE VIEW v_incident_summary AS
SELECT
  i.id,
  i.incident_number,
  i.incident_type,
  i.severity,
  i.status,
  i.title,
  i.detected_at,
  i.resolved_at,
  -- Resolution time in hours
  CASE
    WHEN i.resolved_at IS NOT NULL THEN
      EXTRACT(EPOCH FROM (i.resolved_at - i.detected_at)) / 3600
    ELSE NULL
  END AS resolution_hours,
  i.financial_loss,
  i.customers_affected,
  i.availability_impact_hours,
  i.reported_to_bon,
  i.reported_to_fic,
  -- Compliance status
  CASE
    WHEN i.preliminary_notification_sent_at IS NOT NULL
      AND i.preliminary_notification_sent_at <= i.preliminary_notification_deadline THEN 'on_time'
    WHEN i.preliminary_notification_sent_at IS NOT NULL THEN 'late'
    WHEN NOW() > i.preliminary_notification_deadline THEN 'overdue'
    ELSE 'pending'
  END AS notification_compliance,
  i.created_at,
  i.updated_at
FROM security_incidents i
ORDER BY i.detected_at DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE security_incidents IS 'Security incident tracking per PSD-12 §11.13-15';
COMMENT ON COLUMN security_incidents.preliminary_notification_deadline IS 'Must notify Bank of Namibia within 24 hours (PSD-12 §11.13)';
COMMENT ON COLUMN security_incidents.impact_assessment_due_at IS 'Impact assessment due within 1 month (PSD-12 §11.14)';
COMMENT ON COLUMN security_incidents.financial_loss IS 'Total financial loss from incident (PSD-12 §11.15)';
COMMENT ON COLUMN security_incidents.availability_impact_hours IS 'Hours of service unavailability (PSD-12 §11.15)';

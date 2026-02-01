-- Migration: Create Missing Database Objects
-- Location: sql/migration_create_missing_objects.sql
-- Purpose: Create missing functions, triggers, and views
-- Date: 2026-01-21

-- ============================================================================
-- FUNCTION: SET INCIDENT DEADLINES (if not already in generate_incident_number)
-- ============================================================================
-- Note: This functionality is already included in generate_incident_number()
-- but creating as separate function for clarity and potential reuse

CREATE OR REPLACE FUNCTION set_incident_deadlines()
RETURNS TRIGGER AS $$
BEGIN
  -- Set notification deadline (24 hours from detection)
  IF NEW.preliminary_notification_deadline IS NULL THEN
    NEW.preliminary_notification_deadline := NEW.detected_at + INTERVAL '24 hours';
  END IF;
  
  -- Set impact assessment deadline (1 month from detection)
  IF NEW.impact_assessment_due_at IS NULL THEN
    NEW.impact_assessment_due_at := NEW.detected_at + INTERVAL '1 month';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for setting deadlines (as backup to generate_incident_number)
DROP TRIGGER IF EXISTS trg_set_incident_deadlines ON security_incidents;
CREATE TRIGGER trg_set_incident_deadlines
BEFORE INSERT OR UPDATE ON security_incidents
FOR EACH ROW
WHEN (NEW.detected_at IS NOT NULL)
EXECUTE FUNCTION set_incident_deadlines();

-- ============================================================================
-- VIEW: AUDIT LOG SUMMARY (if needed)
-- ============================================================================

CREATE OR REPLACE VIEW v_audit_log_summary AS
SELECT
  action_type,
  resource_type,
  COUNT(*) as total_events,
  COUNT(DISTINCT admin_user_id) as unique_admin_users,
  MIN(created_at) as first_event,
  MAX(created_at) as last_event,
  COUNT(*) FILTER (WHERE status = 'success') as successful_events,
  COUNT(*) FILTER (WHERE status = 'error') as failed_events
FROM audit_logs
GROUP BY action_type, resource_type
ORDER BY total_events DESC;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION set_incident_deadlines() IS 'Sets preliminary notification and impact assessment deadlines for security incidents';
COMMENT ON VIEW v_audit_log_summary IS 'Summary view of audit log events by type and entity';

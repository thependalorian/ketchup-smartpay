/**
 * Incident Reporting System Utilities
 * 
 * Location: utils/incidentReporting.ts
 * Purpose: Implement PSD-12 §11.13-15 cybersecurity incident reporting
 * 
 * === BANK OF NAMIBIA PSD-12 REQUIREMENTS ===
 * 
 * §11.13: Report successful cyberattacks within 24 hours (preliminary)
 * §11.14: Impact assessment within 1 month
 * §11.15: Report financial loss, data loss, availability loss
 * 
 * Contact: assessments.npsd@bon.com.na
 */

import { query, queryOne } from './db';
import { log } from '@/utils/logger';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Bank of Namibia NPSD contact email */
export const BON_NPSD_EMAIL = 'assessments.npsd@bon.com.na';

/** Notification deadline in hours (24 hours per PSD-12 §11.13) */
export const NOTIFICATION_DEADLINE_HOURS = 24;

/** Impact assessment deadline in days (1 month ~30 days per PSD-12 §11.14) */
export const IMPACT_ASSESSMENT_DEADLINE_DAYS = 30;

// ============================================================================
// TYPES
// ============================================================================

export type IncidentType = 
  | 'cyberattack'
  | 'data_breach'
  | 'system_failure'
  | 'fraud'
  | 'unauthorized_access';

export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IncidentStatus = 
  | 'detected'
  | 'investigating'
  | 'contained'
  | 'resolved'
  | 'closed';

export interface SecurityIncident {
  id: string;
  incident_number: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  
  // Timeline
  detected_at: Date;
  detected_by: string | null;
  detection_method: string | null;
  contained_at: Date | null;
  resolved_at: Date | null;
  closed_at: Date | null;
  
  // Notification deadlines
  preliminary_notification_sent_at: Date | null;
  preliminary_notification_deadline: Date;
  impact_assessment_due_at: Date;
  impact_assessment_submitted_at: Date | null;
  
  // Description
  title: string;
  description: string;
  attack_vector: string | null;
  affected_systems: string[];
  root_cause: string | null;
  
  // Impact (PSD-12 §11.15)
  financial_loss: number;
  financial_loss_currency: string;
  customers_affected: number;
  data_records_affected: number;
  data_types_exposed: string[];
  availability_impact_hours: number;
  
  // Response
  immediate_actions_taken: string | null;
  containment_measures: string | null;
  remediation_steps: string | null;
  
  // Regulatory
  reported_to_bon: boolean;
  bon_reference_number: string | null;
  reported_to_fic: boolean;
  fic_reference_number: string | null;
  
  // Follow-up
  lessons_learned: string | null;
  preventive_measures: string | null;
  follow_up_required: boolean;
  follow_up_actions: string | null;
  
  // Metadata
  created_by: string;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateIncidentInput {
  incident_type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description: string;
  detected_at?: Date;
  detected_by?: string;
  detection_method?: string;
  attack_vector?: string;
  affected_systems?: string[];
  immediate_actions_taken?: string;
  created_by: string;
}

export interface UpdateIncidentInput {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  contained_at?: Date;
  resolved_at?: Date;
  closed_at?: Date;
  root_cause?: string;
  financial_loss?: number;
  customers_affected?: number;
  data_records_affected?: number;
  data_types_exposed?: string[];
  availability_impact_hours?: number;
  containment_measures?: string;
  remediation_steps?: string;
  lessons_learned?: string;
  preventive_measures?: string;
  follow_up_required?: boolean;
  follow_up_actions?: string;
  updated_by: string;
}

export interface IncidentNotification {
  id: string;
  incident_id: string;
  notification_type: 'preliminary' | 'update' | 'impact_assessment' | 'closure';
  recipient_type: 'bon' | 'fic' | 'internal' | 'affected_customers';
  recipient_email: string | null;
  subject: string;
  content: string;
  sent_at: Date | null;
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed';
  reference_number: string | null;
  created_at: Date;
}

export interface PendingNotification {
  id: string;
  incident_number: string;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  title: string;
  detected_at: Date;
  preliminary_notification_deadline: Date;
  hours_until_notification_deadline: number;
  days_until_assessment_deadline: number;
  notification_overdue: boolean;
  assessment_overdue: boolean;
}

export interface IncidentMetrics {
  total_incidents: number;
  critical_incidents: number;
  high_incidents: number;
  medium_incidents: number;
  low_incidents: number;
  incidents_resolved: number;
  avg_resolution_hours: number;
  total_financial_loss: number;
  total_customers_affected: number;
  notifications_on_time: number;
  notifications_late: number;
}

// ============================================================================
// INCIDENT CRUD FUNCTIONS
// ============================================================================

/**
 * Create a new security incident
 */
export async function createIncident(input: CreateIncidentInput): Promise<SecurityIncident> {
  // Note: incident_number is auto-generated by trigger (generate_incident_number())
  // preliminary_notification_deadline and impact_assessment_due_at are also set by trigger
  const result = await queryOne<SecurityIncident>(`
    INSERT INTO security_incidents (
      incident_type, severity, title, description,
      detected_at, detected_by, detection_method,
      attack_vector, affected_systems,
      immediate_actions_taken, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    input.incident_type,
    input.severity,
    input.title,
    input.description,
    input.detected_at || new Date(),
    input.detected_by || null,
    input.detection_method || null,
    input.attack_vector || null,
    input.affected_systems || [],
    input.immediate_actions_taken || null,
    input.created_by,
  ]);

  if (!result) {
    throw new Error('Failed to create incident');
  }

  return result;
}

/**
 * Get incident by ID
 */
export async function getIncident(incidentId: string): Promise<SecurityIncident | null> {
  return queryOne<SecurityIncident>(
    'SELECT * FROM security_incidents WHERE id = $1',
    [incidentId]
  );
}

/**
 * Get incident by incident number
 */
export async function getIncidentByNumber(incidentNumber: string): Promise<SecurityIncident | null> {
  return queryOne<SecurityIncident>(
    'SELECT * FROM security_incidents WHERE incident_number = $1',
    [incidentNumber]
  );
}

/**
 * Update incident
 */
export async function updateIncident(
  incidentId: string,
  input: UpdateIncidentInput
): Promise<SecurityIncident | null> {
  const updates: string[] = ['updated_at = NOW()'];
  const values: any[] = [];
  let paramIndex = 1;

  // Build dynamic update query
  const fields: (keyof UpdateIncidentInput)[] = [
    'status', 'severity', 'contained_at', 'resolved_at', 'closed_at',
    'root_cause', 'financial_loss', 'customers_affected', 'data_records_affected',
    'data_types_exposed', 'availability_impact_hours', 'containment_measures',
    'remediation_steps', 'lessons_learned', 'preventive_measures',
    'follow_up_required', 'follow_up_actions', 'updated_by',
  ];

  for (const field of fields) {
    if (input[field] !== undefined) {
      updates.push(`${field} = $${paramIndex}`);
      values.push(input[field]);
      paramIndex++;
    }
  }

  values.push(incidentId);

  const result = await queryOne<SecurityIncident>(`
    UPDATE security_incidents
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `, values);

  // Log the update
  if (result && input.status) {
    await query(`
      INSERT INTO incident_updates (incident_id, update_type, previous_status, new_status, content, created_by)
      VALUES ($1, 'status_change', $2, $3, $4, $5)
    `, [
      incidentId,
      result.status,
      input.status,
      `Status changed from ${result.status} to ${input.status}`,
      input.updated_by,
    ]);
  }

  return result;
}

/**
 * List incidents with optional filters
 */
export async function listIncidents(filters?: {
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  incident_type?: IncidentType;
  from_date?: Date;
  to_date?: Date;
  limit?: number;
  offset?: number;
}): Promise<SecurityIncident[]> {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (filters?.status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(filters.status);
  }

  if (filters?.severity) {
    conditions.push(`severity = $${paramIndex++}`);
    values.push(filters.severity);
  }

  if (filters?.incident_type) {
    conditions.push(`incident_type = $${paramIndex++}`);
    values.push(filters.incident_type);
  }

  if (filters?.from_date) {
    conditions.push(`detected_at >= $${paramIndex++}`);
    values.push(filters.from_date);
  }

  if (filters?.to_date) {
    conditions.push(`detected_at <= $${paramIndex++}`);
    values.push(filters.to_date);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;

  return query<SecurityIncident>(`
    SELECT * FROM security_incidents
    ${whereClause}
    ORDER BY detected_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `, values);
}

// ============================================================================
// NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Get incidents needing preliminary notification (within 24 hours)
 */
export async function getPendingNotifications(): Promise<PendingNotification[]> {
  return query<PendingNotification>(`
    SELECT * FROM v_pending_incident_notifications
    ORDER BY hours_until_notification_deadline ASC
  `);
}

/**
 * Get overdue notifications
 */
export async function getOverdueNotifications(): Promise<PendingNotification[]> {
  return query<PendingNotification>(`
    SELECT * FROM v_pending_incident_notifications
    WHERE notification_overdue = TRUE OR assessment_overdue = TRUE
    ORDER BY preliminary_notification_deadline ASC
  `);
}

/**
 * Record that preliminary notification was sent
 */
export async function recordPreliminaryNotification(
  incidentId: string,
  referenceNumber?: string
): Promise<boolean> {
  try {
    await query(`
      UPDATE security_incidents
      SET preliminary_notification_sent_at = NOW(),
          reported_to_bon = TRUE,
          bon_reference_number = $2,
          updated_at = NOW()
      WHERE id = $1
    `, [incidentId, referenceNumber || null]);

    // Create notification record
    const incident = await getIncident(incidentId);
    if (incident) {
      await query(`
        INSERT INTO incident_notifications (
          incident_id, notification_type, recipient_type, recipient_email,
          subject, content, sent_at, delivery_status
        ) VALUES ($1, 'preliminary', 'bon', $2, $3, $4, NOW(), 'sent')
      `, [
        incidentId,
        BON_NPSD_EMAIL,
        `[PRELIMINARY] Security Incident Report: ${incident.incident_number}`,
        generatePreliminaryNotificationContent(incident),
      ]);
    }

    return true;
  } catch (error) {
    log.error('Error recording preliminary notification:', error);
    return false;
  }
}

/**
 * Record that impact assessment was submitted
 */
export async function recordImpactAssessment(
  incidentId: string,
  referenceNumber?: string
): Promise<boolean> {
  try {
    await query(`
      UPDATE security_incidents
      SET impact_assessment_submitted_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
    `, [incidentId]);

    // Create notification record
    const incident = await getIncident(incidentId);
    if (incident) {
      await query(`
        INSERT INTO incident_notifications (
          incident_id, notification_type, recipient_type, recipient_email,
          subject, content, sent_at, delivery_status, reference_number
        ) VALUES ($1, 'impact_assessment', 'bon', $2, $3, $4, NOW(), 'sent', $5)
      `, [
        incidentId,
        BON_NPSD_EMAIL,
        `[IMPACT ASSESSMENT] Security Incident: ${incident.incident_number}`,
        generateImpactAssessmentContent(incident),
        referenceNumber || null,
      ]);
    }

    return true;
  } catch (error) {
    log.error('Error recording impact assessment:', error);
    return false;
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate preliminary notification content
 */
function generatePreliminaryNotificationContent(incident: SecurityIncident): string {
  return `
PRELIMINARY INCIDENT NOTIFICATION
=================================
Per PSD-12 §11.13: 24-Hour Notification Requirement

Incident Number: ${incident.incident_number}
Detected At: ${incident.detected_at.toISOString()}
Incident Type: ${incident.incident_type.toUpperCase()}
Severity: ${incident.severity.toUpperCase()}

DESCRIPTION:
${incident.title}

${incident.description}

AFFECTED SYSTEMS:
${incident.affected_systems.length > 0 ? incident.affected_systems.join(', ') : 'Under investigation'}

IMMEDIATE ACTIONS TAKEN:
${incident.immediate_actions_taken || 'Incident response initiated, investigation ongoing'}

DETECTION METHOD:
${incident.detection_method || 'To be determined'}

STATUS: ${incident.status.toUpperCase()}

---
This is a preliminary notification. A full impact assessment will follow within 30 days.
Institution: Buffr (Pty) Ltd
Contact: compliance@buffr.ai
`.trim();
}

/**
 * Generate impact assessment content
 */
function generateImpactAssessmentContent(incident: SecurityIncident): string {
  return `
INCIDENT IMPACT ASSESSMENT
==========================
Per PSD-12 §11.14-15: Impact Assessment Requirement

Incident Number: ${incident.incident_number}
Assessment Date: ${new Date().toISOString()}
Original Detection: ${incident.detected_at.toISOString()}

INCIDENT SUMMARY:
${incident.title}
${incident.description}

ROOT CAUSE:
${incident.root_cause || 'Under investigation'}

IMPACT ASSESSMENT (PSD-12 §11.15):
----------------------------------
Financial Loss: ${incident.financial_loss_currency} ${incident.financial_loss.toFixed(2)}
Customers Affected: ${incident.customers_affected}
Data Records Affected: ${incident.data_records_affected}
Data Types Exposed: ${incident.data_types_exposed.length > 0 ? incident.data_types_exposed.join(', ') : 'None identified'}
Service Unavailability: ${incident.availability_impact_hours} hours

TIMELINE:
- Detected: ${incident.detected_at.toISOString()}
- Contained: ${incident.contained_at?.toISOString() || 'Pending'}
- Resolved: ${incident.resolved_at?.toISOString() || 'Pending'}

CONTAINMENT MEASURES:
${incident.containment_measures || 'Details pending'}

REMEDIATION STEPS:
${incident.remediation_steps || 'Details pending'}

LESSONS LEARNED:
${incident.lessons_learned || 'To be documented'}

PREVENTIVE MEASURES:
${incident.preventive_measures || 'To be implemented'}

---
Institution: Buffr (Pty) Ltd
Contact: compliance@buffr.ai
Submitted by: Compliance Team
`.trim();
}

/**
 * Generate Bank of Namibia report format
 */
export async function generateBONReport(incidentId: string): Promise<string | null> {
  const incident = await getIncident(incidentId);
  if (!incident) return null;

  return `
================================================================================
BANK OF NAMIBIA - SECURITY INCIDENT REPORT
Payment Systems Department
Email: ${BON_NPSD_EMAIL}
================================================================================

SECTION 1: INCIDENT IDENTIFICATION
----------------------------------
Incident Reference: ${incident.incident_number}
Institution: Buffr (Pty) Ltd
Report Date: ${new Date().toISOString().split('T')[0]}
Report Type: ${incident.impact_assessment_submitted_at ? 'Impact Assessment' : 'Preliminary Notification'}

SECTION 2: INCIDENT DETAILS
---------------------------
Type: ${incident.incident_type.replace('_', ' ').toUpperCase()}
Severity: ${incident.severity.toUpperCase()}
Current Status: ${incident.status.toUpperCase()}

Detection Date/Time: ${incident.detected_at.toISOString()}
Detection Method: ${incident.detection_method || 'N/A'}

Description:
${incident.description}

Attack Vector:
${incident.attack_vector || 'Under investigation'}

Affected Systems:
${incident.affected_systems.length > 0 ? incident.affected_systems.map(s => `- ${s}`).join('\n') : 'Under investigation'}

SECTION 3: IMPACT ASSESSMENT (Per PSD-12 §11.15)
------------------------------------------------
A. Financial Impact
   Total Financial Loss: ${incident.financial_loss_currency} ${incident.financial_loss.toFixed(2)}

B. Data Impact
   Records Affected: ${incident.data_records_affected}
   Data Types: ${incident.data_types_exposed.join(', ') || 'None identified'}

C. Customer Impact
   Customers Affected: ${incident.customers_affected}

D. Availability Impact
   Service Unavailability: ${incident.availability_impact_hours} hours

SECTION 4: RESPONSE AND REMEDIATION
-----------------------------------
Root Cause: ${incident.root_cause || 'Under investigation'}

Immediate Actions:
${incident.immediate_actions_taken || 'Incident response initiated'}

Containment Measures:
${incident.containment_measures || 'Pending'}

Remediation Steps:
${incident.remediation_steps || 'In progress'}

SECTION 5: TIMELINE
-------------------
Detected:  ${incident.detected_at.toISOString()}
Contained: ${incident.contained_at?.toISOString() || 'Pending'}
Resolved:  ${incident.resolved_at?.toISOString() || 'Pending'}
Closed:    ${incident.closed_at?.toISOString() || 'Pending'}

SECTION 6: LESSONS LEARNED & PREVENTIVE MEASURES
------------------------------------------------
Lessons Learned:
${incident.lessons_learned || 'To be documented upon resolution'}

Preventive Measures:
${incident.preventive_measures || 'To be implemented upon resolution'}

SECTION 7: COMPLIANCE CERTIFICATION
-----------------------------------
I hereby certify that this report is accurate and complete to the best of my knowledge.

[ ] This is a preliminary notification (within 24 hours of detection)
[ ] This is an impact assessment (within 30 days of detection)

Authorized Signatory: _________________________
Name: _________________________
Title: _________________________
Date: ${new Date().toISOString().split('T')[0]}

================================================================================
End of Report
================================================================================
`.trim();
}

// ============================================================================
// METRICS AND DASHBOARD
// ============================================================================

/**
 * Get incident metrics for dashboard
 */
export async function getIncidentMetrics(periodDays: number = 30): Promise<IncidentMetrics> {
  const result = await queryOne<any>(`
    SELECT
      COUNT(*)::INTEGER AS total_incidents,
      COUNT(*) FILTER (WHERE severity = 'critical')::INTEGER AS critical_incidents,
      COUNT(*) FILTER (WHERE severity = 'high')::INTEGER AS high_incidents,
      COUNT(*) FILTER (WHERE severity = 'medium')::INTEGER AS medium_incidents,
      COUNT(*) FILTER (WHERE severity = 'low')::INTEGER AS low_incidents,
      COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::INTEGER AS incidents_resolved,
      AVG(
        CASE WHEN resolved_at IS NOT NULL THEN
          EXTRACT(EPOCH FROM (resolved_at - detected_at)) / 3600
        END
      ) AS avg_resolution_hours,
      COALESCE(SUM(financial_loss), 0) AS total_financial_loss,
      COALESCE(SUM(customers_affected), 0)::INTEGER AS total_customers_affected,
      COUNT(*) FILTER (
        WHERE preliminary_notification_sent_at IS NOT NULL
        AND preliminary_notification_sent_at <= preliminary_notification_deadline
      )::INTEGER AS notifications_on_time,
      COUNT(*) FILTER (
        WHERE preliminary_notification_sent_at IS NOT NULL
        AND preliminary_notification_sent_at > preliminary_notification_deadline
      )::INTEGER AS notifications_late
    FROM security_incidents
    WHERE detected_at >= NOW() - INTERVAL '${periodDays} days'
  `);

  return {
    total_incidents: result?.total_incidents || 0,
    critical_incidents: result?.critical_incidents || 0,
    high_incidents: result?.high_incidents || 0,
    medium_incidents: result?.medium_incidents || 0,
    low_incidents: result?.low_incidents || 0,
    incidents_resolved: result?.incidents_resolved || 0,
    avg_resolution_hours: Number(result?.avg_resolution_hours || 0),
    total_financial_loss: Number(result?.total_financial_loss || 0),
    total_customers_affected: result?.total_customers_affected || 0,
    notifications_on_time: result?.notifications_on_time || 0,
    notifications_late: result?.notifications_late || 0,
  };
}

/**
 * Check compliance status
 */
export async function checkComplianceStatus(): Promise<{
  pendingNotifications: number;
  overdueNotifications: number;
  pendingAssessments: number;
  overdueAssessments: number;
  isCompliant: boolean;
}> {
  const result = await queryOne<any>(`
    SELECT
      COUNT(*) FILTER (
        WHERE preliminary_notification_sent_at IS NULL
        AND NOW() < preliminary_notification_deadline
      )::INTEGER AS pending_notifications,
      COUNT(*) FILTER (
        WHERE preliminary_notification_sent_at IS NULL
        AND NOW() >= preliminary_notification_deadline
      )::INTEGER AS overdue_notifications,
      COUNT(*) FILTER (
        WHERE impact_assessment_submitted_at IS NULL
        AND NOW() < impact_assessment_due_at
        AND status NOT IN ('closed')
      )::INTEGER AS pending_assessments,
      COUNT(*) FILTER (
        WHERE impact_assessment_submitted_at IS NULL
        AND NOW() >= impact_assessment_due_at
        AND status NOT IN ('closed')
      )::INTEGER AS overdue_assessments
    FROM security_incidents
    WHERE status NOT IN ('closed')
  `);

  return {
    pendingNotifications: result?.pending_notifications || 0,
    overdueNotifications: result?.overdue_notifications || 0,
    pendingAssessments: result?.pending_assessments || 0,
    overdueAssessments: result?.overdue_assessments || 0,
    isCompliant: (result?.overdue_notifications || 0) === 0 && (result?.overdue_assessments || 0) === 0,
  };
}

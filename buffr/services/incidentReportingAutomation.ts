/**
 * Automated Incident Reporting Service
 * 
 * Location: services/incidentReportingAutomation.ts
 * Purpose: Automated 24-hour incident reporting to Bank of Namibia (PSD-12 §11.13)
 * 
 * PSD-12 Requirements:
 * - §11.13: Report successful cyberattacks within 24 hours (preliminary notification)
 * - §11.14: Impact assessment within 1 month
 * - §11.15: Report financial loss, data loss, availability loss
 * 
 * Contact: assessments.npsd@bon.com.na
 */

import { query, queryOne } from '../utils/db';
import { BON_NPSD_EMAIL, NOTIFICATION_DEADLINE_HOURS, IMPACT_ASSESSMENT_DEADLINE_DAYS } from '../utils/incidentReporting';
import { logAuditEvent } from '../utils/auditLogger';
import logger, { log } from '@/utils/logger';

/**
 * Check for incidents that need preliminary notification (within 24 hours)
 */
export async function checkPendingNotifications(): Promise<Array<{
  incidentId: string;
  incidentNumber: string;
  detectedAt: Date;
  deadline: Date;
  hoursRemaining: number;
  severity: string;
}>> {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() - NOTIFICATION_DEADLINE_HOURS);

  try {
    const incidents = await query<{
      id: string;
      incident_number: string;
      detected_at: Date;
      severity: string;
      preliminary_notification_sent_at: Date | null;
    }>(
      `SELECT id, incident_number, detected_at, severity, preliminary_notification_sent_at
       FROM security_incidents
       WHERE preliminary_notification_sent_at IS NULL
       AND detected_at >= $1
       AND status IN ('detected', 'investigating', 'contained')
       ORDER BY detected_at ASC`,
      [deadline]
    );

    return incidents.map(incident => {
      const detectedAt = new Date(incident.detected_at);
      const notificationDeadline = new Date(detectedAt);
      notificationDeadline.setHours(notificationDeadline.getHours() + NOTIFICATION_DEADLINE_HOURS);
      
      const hoursRemaining = Math.max(0, Math.floor((notificationDeadline.getTime() - Date.now()) / (1000 * 60 * 60)));

      return {
        incidentId: incident.id,
        incidentNumber: incident.incident_number,
        detectedAt,
        deadline: notificationDeadline,
        hoursRemaining,
        severity: incident.severity,
      };
    });
  } catch (error) {
    log.error('[Incident Reporting] Error checking pending notifications:', error);
    return [];
  }
}

/**
 * Check for incidents with overdue notifications
 */
export async function checkOverdueNotifications(): Promise<Array<{
  incidentId: string;
  incidentNumber: string;
  detectedAt: Date;
  deadline: Date;
  hoursOverdue: number;
  severity: string;
}>> {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() - NOTIFICATION_DEADLINE_HOURS);

  try {
    const incidents = await query<{
      id: string;
      incident_number: string;
      detected_at: Date;
      severity: string;
    }>(
      `SELECT id, incident_number, detected_at, severity
       FROM security_incidents
       WHERE preliminary_notification_sent_at IS NULL
       AND detected_at < $1
       AND status IN ('detected', 'investigating', 'contained')
       ORDER BY detected_at ASC`,
      [deadline]
    );

    return incidents.map(incident => {
      const detectedAt = new Date(incident.detected_at);
      const notificationDeadline = new Date(detectedAt);
      notificationDeadline.setHours(notificationDeadline.getHours() + NOTIFICATION_DEADLINE_HOURS);
      
      const hoursOverdue = Math.floor((Date.now() - notificationDeadline.getTime()) / (1000 * 60 * 60));

      return {
        incidentId: incident.id,
        incidentNumber: incident.incident_number,
        detectedAt,
        deadline: notificationDeadline,
        hoursOverdue,
        severity: incident.severity,
      };
    });
  } catch (error) {
    log.error('[Incident Reporting] Error checking overdue notifications:', error);
    return [];
  }
}

/**
 * Check for incidents needing impact assessment (within 1 month)
 */
export async function checkPendingImpactAssessments(): Promise<Array<{
  incidentId: string;
  incidentNumber: string;
  detectedAt: Date;
  deadline: Date;
  daysRemaining: number;
}>> {
  const deadline = new Date();
  deadline.setDate(deadline.getDate() - IMPACT_ASSESSMENT_DEADLINE_DAYS);

  try {
    const incidents = await query<{
      id: string;
      incident_number: string;
      detected_at: Date;
      impact_assessment_submitted_at: Date | null;
    }>(
      `SELECT id, incident_number, detected_at, impact_assessment_submitted_at
       FROM security_incidents
       WHERE impact_assessment_submitted_at IS NULL
       AND detected_at >= $1
       AND preliminary_notification_sent_at IS NOT NULL
       ORDER BY detected_at ASC`,
      [deadline]
    );

    return incidents.map(incident => {
      const detectedAt = new Date(incident.detected_at);
      const assessmentDeadline = new Date(detectedAt);
      assessmentDeadline.setDate(assessmentDeadline.getDate() + IMPACT_ASSESSMENT_DEADLINE_DAYS);
      
      const daysRemaining = Math.max(0, Math.floor((assessmentDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

      return {
        incidentId: incident.id,
        incidentNumber: incident.incident_number,
        detectedAt,
        deadline: assessmentDeadline,
        daysRemaining,
      };
    });
  } catch (error) {
    log.error('[Incident Reporting] Error checking pending impact assessments:', error);
    return [];
  }
}

/**
 * Generate preliminary notification email content for Bank of Namibia
 */
export function generatePreliminaryNotification(incident: {
  incidentNumber: string;
  title: string;
  incidentType: string;
  severity: string;
  detectedAt: Date;
  description: string;
}): { subject: string; body: string } {
  const subject = `[URGENT] Preliminary Notification - Security Incident ${incident.incidentNumber}`;
  
  const body = `Dear Bank of Namibia NPSD Team,

This is a preliminary notification of a security incident as required by PSD-12 §11.13.

INCIDENT DETAILS:
- Incident Number: ${incident.incidentNumber}
- Title: ${incident.title}
- Type: ${incident.incidentType}
- Severity: ${incident.severity}
- Detected At: ${incident.detectedAt.toISOString()}
- Notification Deadline: ${new Date(incident.detectedAt.getTime() + NOTIFICATION_DEADLINE_HOURS * 60 * 60 * 1000).toISOString()}

DESCRIPTION:
${incident.description}

A detailed impact assessment will be submitted within 1 month as required by PSD-12 §11.14.

Best regards,
Buffr Compliance Team

---
This is an automated notification from Buffr Financial Services CC.
For questions, contact: compliance@buffr.com.na
`;

  return { subject, body };
}

/**
 * Generate impact assessment report for Bank of Namibia
 */
export function generateImpactAssessmentReport(incident: {
  incidentNumber: string;
  title: string;
  financialLoss: number;
  customersAffected: number;
  dataRecordsAffected: number;
  availabilityImpactHours: number;
  rootCause: string | null;
  remediationSteps: string | null;
}): { subject: string; body: string } {
  const subject = `Impact Assessment Report - Security Incident ${incident.incidentNumber}`;
  
  const body = `Dear Bank of Namibia NPSD Team,

This is the impact assessment report for security incident ${incident.incidentNumber} as required by PSD-12 §11.14 and §11.15.

INCIDENT SUMMARY:
- Incident Number: ${incident.incidentNumber}
- Title: ${incident.title}

IMPACT ASSESSMENT (PSD-12 §11.15):

1. Financial Loss:
   Amount: N$ ${incident.financialLoss.toFixed(2)}
   Currency: NAD

2. Data Loss:
   Records Affected: ${incident.dataRecordsAffected}
   Data Types: [To be specified in actual report]

3. Availability Loss:
   Impact Duration: ${incident.availabilityImpactHours} hours
   Systems Affected: [To be specified in actual report]

4. Customers Affected:
   Number of Customers: ${incident.customersAffected}

ROOT CAUSE ANALYSIS:
${incident.rootCause || 'Analysis pending'}

REMEDIATION STEPS:
${incident.remediationSteps || 'Remediation in progress'}

PREVENTIVE MEASURES:
[To be specified in actual report]

Best regards,
Buffr Compliance Team

---
This is an automated report from Buffr Financial Services CC.
For questions, contact: compliance@buffr.com.na
`;

  return { subject, body };
}

/**
 * Send automated alert for overdue notifications
 */
export async function alertOverdueNotifications(): Promise<void> {
  const overdue = await checkOverdueNotifications();

  if (overdue.length === 0) {
    return;
  }

  // Log alert
  await logAuditEvent({
    event_type: 'incident_reporting_alert',
    entity_type: 'security_incident',
    entity_id: 'system',
    user_id: null,
    action: 'alert_overdue',
    metadata: {
      overdueCount: overdue.length,
      incidents: overdue.map(i => ({
        incidentNumber: i.incidentNumber,
        hoursOverdue: i.hoursOverdue,
        severity: i.severity,
      })),
    },
    ip_address: 'system',
    user_agent: 'incident-reporting-automation',
    request_id: `alert-${Date.now()}`,
    response_status: 200,
  }).catch(err => {
    log.error('[Incident Reporting] Failed to log alert:', err);
  });

  logger.warn(`[Incident Reporting] ⚠️ ${overdue.length} incident(s) have overdue notifications!`);
  overdue.forEach(incident => {
    logger.warn(`[Incident Reporting] - ${incident.incidentNumber}: ${incident.hoursOverdue} hours overdue (${incident.severity} severity)`);
  });
}

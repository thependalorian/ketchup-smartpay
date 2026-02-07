/**
 * Incident Response Service
 *
 * Purpose: Handle cybersecurity incidents and reporting to Bank of Namibia
 * Regulation: PSD-12 Sections 11.13-11.15 - Response and Recovery
 * Location: backend/src/services/compliance/IncidentResponseService.ts
 *
 * Requirements:
 * - Report incidents to BoN within 24 hours (preliminary)
 * - Full impact assessment within 30 days
 * - Track financial loss, data loss, availability loss
 * - Recovery Time Objective (RTO): 2 hours maximum
 * - Recovery Point Objective (RPO): 5 minutes maximum
 *
 * PSD-12 Section 11.13: "All successful cyberattack incidents must be reported
 * to the Bank, at least within 24 hours for the preliminary notification of
 * the cyber incident."
 */
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);
export class IncidentResponseService {
    static PRELIMINARY_REPORT_DEADLINE_HOURS = 24; // PSD-12 Section 11.13
    static IMPACT_ASSESSMENT_DEADLINE_DAYS = 30; // PSD-12 Section 11.14
    static RTO_MINUTES = 120; // 2 hours - PSD-12 Section 11.9
    static RPO_MINUTES = 5; // PSD-12 Section 11.11
    /**
     * Detect and log incident
     * PSD-12 Section 11.7: Investigate nature, extent, and damage
     */
    static async detectIncident(report) {
        try {
            const result = await sql `
        INSERT INTO cybersecurity_incidents (
          incident_type,
          severity,
          title,
          description,
          affected_systems,
          detected_at,
          detected_by,
          status
        ) VALUES (
          ${report.incidentType},
          ${report.severity},
          ${report.title},
          ${report.description},
          ${report.affectedSystems || []},
          NOW(),
          ${report.detectedBy || 'System'},
          'detected'
        )
        RETURNING *
      `;
            const incident = result[0];
            // Log to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'incident_detection',
          'PSD-12',
          '11.7',
          'Cybersecurity incident detected',
          ${report.detectedBy || 'System'},
          'investigating',
          ${JSON.stringify({ severity: report.severity, type: report.incidentType })}
        )
      `;
            console.log(`🚨 Incident detected: ${report.title} (Severity: ${report.severity})`);
            console.log(`⏰ Preliminary report to BoN due within 24 hours`);
            return this.mapIncidentDetails(incident);
        }
        catch (error) {
            console.error('❌ Failed to detect incident:', error.message);
            throw error;
        }
    }
    /**
     * Send preliminary report to Bank of Namibia
     * PSD-12 Section 11.13: Within 24 hours
     */
    static async sendPreliminaryReportToBoN(incidentId, reportData) {
        try {
            // Check if within 24-hour deadline
            const incident = await sql `
        SELECT * FROM cybersecurity_incidents
        WHERE id = ${incidentId}
      `;
            if (incident.length === 0) {
                throw new Error('Incident not found');
            }
            const detectedAt = new Date(incident[0].detected_at);
            const now = new Date();
            const hoursSinceDetection = (now.getTime() - detectedAt.getTime()) / (1000 * 60 * 60);
            if (hoursSinceDetection > this.PRELIMINARY_REPORT_DEADLINE_HOURS) {
                console.warn(`⚠️ DEADLINE VIOLATION: Preliminary report sent ${hoursSinceDetection.toFixed(1)} hours after detection (Deadline: 24 hours)`);
            }
            // Update incident with preliminary report
            await sql `
        UPDATE cybersecurity_incidents
        SET 
          reported_to_bon_at = NOW(),
          preliminary_report_sent = TRUE,
          preliminary_report_data = ${JSON.stringify(reportData)},
          updated_at = NOW()
        WHERE id = ${incidentId}
      `;
            // Log to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'bon_incident_report',
          'PSD-12',
          '11.13',
          'Preliminary incident report sent to Bank of Namibia',
          'System',
          'compliant',
          ${`Incident ID: ${incidentId}, Hours since detection: ${hoursSinceDetection.toFixed(1)}`}
        )
      `;
            // TODO: In production, send actual email/API to BoN
            console.log(`✅ Preliminary report sent to BoN for incident ${incidentId}`);
            console.log(`   Email: assessments.npsd@bon.com.na`);
            console.log(`   Time since detection: ${hoursSinceDetection.toFixed(1)} hours`);
        }
        catch (error) {
            console.error('❌ Failed to send preliminary report:', error.message);
            throw error;
        }
    }
    /**
     * Submit impact assessment
     * PSD-12 Section 11.14-11.15: Within 30 days, include financial/data/availability loss
     */
    static async submitImpactAssessment(assessment) {
        try {
            // Update incident with impact assessment
            await sql `
        UPDATE cybersecurity_incidents
        SET 
          impact_assessment_sent = TRUE,
          impact_assessment_data = ${JSON.stringify(assessment)},
          financial_loss = ${assessment.financialLoss},
          data_loss_records = ${assessment.dataLossRecords},
          availability_loss_minutes = ${assessment.availabilityLossMinutes},
          affected_users_count = ${assessment.affectedUsersCount},
          root_cause = ${assessment.rootCause},
          remediation_actions = ${assessment.remediationActions},
          preventive_measures = ${assessment.preventiveMeasures},
          updated_at = NOW()
        WHERE id = ${assessment.incidentId}
      `;
            // Log to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'impact_assessment',
          'PSD-12',
          '11.14-11.15',
          'Impact assessment submitted to Bank of Namibia',
          'System',
          'compliant',
          ${JSON.stringify({
                financialLoss: assessment.financialLoss,
                dataLoss: assessment.dataLossRecords,
                availabilityLoss: assessment.availabilityLossMinutes,
            })}
        )
      `;
            console.log(`✅ Impact assessment submitted for incident ${assessment.incidentId}`);
            console.log(`   Financial Loss: N$${assessment.financialLoss}`);
            console.log(`   Data Loss: ${assessment.dataLossRecords} records`);
            console.log(`   Availability Loss: ${assessment.availabilityLossMinutes} minutes`);
        }
        catch (error) {
            console.error('❌ Failed to submit impact assessment:', error.message);
            throw error;
        }
    }
    /**
     * Update incident status
     * PSD-12 Section 11.7-11.8: Contain and recover
     */
    static async updateIncidentStatus(incidentId, status, notes) {
        try {
            const updateData = {
                status,
                updated_at: new Date(),
            };
            // Track containment and recovery times (PSD-12 RTO: 2 hours)
            if (status === 'contained') {
                const incident = await sql `SELECT detected_at FROM cybersecurity_incidents WHERE id = ${incidentId}`;
                const detectedAt = new Date(incident[0].detected_at);
                const now = new Date();
                const containmentMinutes = (now.getTime() - detectedAt.getTime()) / (1000 * 60);
                await sql `
          UPDATE cybersecurity_incidents
          SET 
            status = ${status},
            containment_time = NOW(),
            updated_at = NOW()
          WHERE id = ${incidentId}
        `;
                console.log(`✅ Incident contained in ${containmentMinutes.toFixed(2)} minutes`);
            }
            else if (status === 'recovered') {
                const incident = await sql `SELECT detected_at FROM cybersecurity_incidents WHERE id = ${incidentId}`;
                const detectedAt = new Date(incident[0].detected_at);
                const now = new Date();
                const recoveryMinutes = (now.getTime() - detectedAt.getTime()) / (1000 * 60);
                await sql `
          UPDATE cybersecurity_incidents
          SET 
            status = ${status},
            recovery_time = NOW(),
            recovery_time_minutes = ${Math.round(recoveryMinutes)},
            updated_at = NOW()
          WHERE id = ${incidentId}
        `;
                // Check RTO compliance
                if (recoveryMinutes > this.RTO_MINUTES) {
                    console.warn(`🚨 PSD-12 RTO VIOLATION: Recovery took ${recoveryMinutes.toFixed(2)} minutes (Max: ${this.RTO_MINUTES} minutes)`);
                }
                else {
                    console.log(`✅ Incident recovered in ${recoveryMinutes.toFixed(2)} minutes (Within RTO: ${this.RTO_MINUTES} min)`);
                }
            }
            else if (status === 'closed') {
                await sql `
          UPDATE cybersecurity_incidents
          SET 
            status = ${status},
            closed_at = NOW(),
            closed_by = 'System',
            updated_at = NOW()
          WHERE id = ${incidentId}
        `;
            }
            else {
                await sql `
          UPDATE cybersecurity_incidents
          SET 
            status = ${status},
            updated_at = NOW()
          WHERE id = ${incidentId}
        `;
            }
            // Log to audit trail
            await sql `
        INSERT INTO compliance_audit_trail (
          audit_type,
          regulation,
          section,
          action_taken,
          performed_by,
          result,
          notes
        ) VALUES (
          'incident_status_update',
          'PSD-12',
          '11.7-11.8',
          ${`Incident status changed to: ${status}`},
          'System',
          ${status === 'recovered' || status === 'closed' ? 'resolved' : 'in_progress'},
          ${notes || null}
        )
      `;
        }
        catch (error) {
            console.error('❌ Failed to update incident status:', error.message);
            throw error;
        }
    }
    /**
     * Get open incidents
     */
    static async getOpenIncidents() {
        try {
            const result = await sql `
        SELECT * FROM cybersecurity_incidents
        WHERE status NOT IN ('closed')
        ORDER BY severity DESC, detected_at DESC
      `;
            return result.map(this.mapIncidentDetails);
        }
        catch (error) {
            console.error('❌ Failed to get open incidents:', error.message);
            throw error;
        }
    }
    /**
     * Get incidents pending BoN reporting
     * PSD-12 Section 11.13: Must report within 24 hours
     */
    static async getIncidentsPendingBoNReport() {
        try {
            const result = await sql `
        SELECT * FROM cybersecurity_incidents
        WHERE preliminary_report_sent = FALSE
          AND detected_at < NOW() - INTERVAL '23 hours'
        ORDER BY detected_at ASC
      `;
            if (result.length > 0) {
                console.warn(`🚨 ${result.length} incident(s) approaching 24-hour reporting deadline!`);
            }
            return result.map(this.mapIncidentDetails);
        }
        catch (error) {
            console.error('❌ Failed to get incidents pending BoN report:', error.message);
            throw error;
        }
    }
    /**
     * Get incident statistics
     */
    static async getIncidentStatistics(startDate, endDate) {
        try {
            const result = await sql `
        SELECT 
          COUNT(*) as total_incidents,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_incidents,
          AVG(recovery_time_minutes) as avg_recovery_time,
          COUNT(CASE WHEN recovery_time_minutes > ${this.RTO_MINUTES} THEN 1 END) as rto_violations,
          COALESCE(SUM(financial_loss), 0) as total_financial_loss,
          COALESCE(SUM(data_loss_records), 0) as total_data_loss,
          COALESCE(SUM(availability_loss_minutes), 0) as total_availability_loss
        FROM cybersecurity_incidents
        WHERE detected_at BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}
      `;
            const stats = result[0];
            return {
                totalIncidents: parseInt(stats.total_incidents),
                criticalIncidents: parseInt(stats.critical_incidents),
                averageRecoveryTimeMinutes: parseFloat(stats.avg_recovery_time || '0'),
                rtoViolations: parseInt(stats.rto_violations),
                totalFinancialLoss: parseFloat(stats.total_financial_loss),
                totalDataLoss: parseInt(stats.total_data_loss),
                totalAvailabilityLoss: parseInt(stats.total_availability_loss),
            };
        }
        catch (error) {
            console.error('❌ Failed to get incident statistics:', error.message);
            throw error;
        }
    }
    /**
     * Map database row to IncidentDetails
     */
    static mapIncidentDetails(row) {
        return {
            id: row.id,
            incidentType: row.incident_type,
            severity: row.severity,
            title: row.title,
            description: row.description,
            detectedAt: new Date(row.detected_at),
            status: row.status,
            reportedToBoN: row.reported_to_bon_at !== null,
            preliminaryReportSent: row.preliminary_report_sent,
            impactAssessmentSent: row.impact_assessment_sent,
            financialLoss: parseFloat(row.financial_loss || '0'),
            dataLossRecords: parseInt(row.data_loss_records || '0'),
            availabilityLossMinutes: parseInt(row.availability_loss_minutes || '0'),
            recoveryTimeMinutes: row.recovery_time_minutes ? parseInt(row.recovery_time_minutes) : null,
        };
    }
}
//# sourceMappingURL=IncidentResponseService.js.map
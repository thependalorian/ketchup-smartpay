/**
 * Incident Reporting API
 * 
 * Location: app/api/compliance/incidents/route.ts
 * Purpose: API endpoints for PSD-12 §11.13-15 incident reporting
 * 
 * Endpoints:
 * - GET: List incidents, get metrics, check compliance
 * - POST: Create new incident, record notifications
 * 
 * === BANK OF NAMIBIA PSD-12 REQUIREMENTS ===
 * 
 * §11.13: Report successful cyberattacks within 24 hours
 * §11.14: Impact assessment within 1 month
 * §11.15: Report financial loss, data loss, availability loss
 */

import { ExpoRequest } from 'expo-router/server';
import { secureAdminRoute, RATE_LIMITS } from '@/utils/secureApi';
import { successResponse, errorResponse, createdResponse, HttpStatus } from '@/utils/apiResponse';
import { log } from '@/utils/logger';

import {
  createIncident,
  getIncident,
  getIncidentByNumber,
  updateIncident,
  listIncidents,
  getPendingNotifications,
  getOverdueNotifications,
  recordPreliminaryNotification,
  recordImpactAssessment,
  generateBONReport,
  getIncidentMetrics,
  checkComplianceStatus,
  BON_NPSD_EMAIL,
  NOTIFICATION_DEADLINE_HOURS,
  IMPACT_ASSESSMENT_DEADLINE_DAYS,
  type CreateIncidentInput,
  type UpdateIncidentInput,
  type IncidentStatus,
  type IncidentSeverity,
  type IncidentType,
} from '@/utils/incidentReporting';

/**
 * GET /api/compliance/incidents
 * 
 * Query parameters:
 * - action: 'list' | 'get' | 'pending' | 'overdue' | 'metrics' | 'compliance' | 'report'
 * - id: Incident ID (for 'get' and 'report')
 * - incident_number: Incident number (for 'get')
 * - status: Filter by status
 * - severity: Filter by severity
 * - type: Filter by incident type
 * - from_date: Filter from date (ISO)
 * - to_date: Filter to date (ISO)
 * - limit: Pagination limit
 * - offset: Pagination offset
 * - period_days: For metrics (default 30)
 */
async function handleGetIncidents(request: ExpoRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    switch (action) {
      case 'list': {
        const incidents = await listIncidents({
          status: searchParams.get('status') as IncidentStatus | undefined,
          severity: searchParams.get('severity') as IncidentSeverity | undefined,
          incident_type: searchParams.get('type') as IncidentType | undefined,
          from_date: searchParams.get('from_date') ? new Date(searchParams.get('from_date')!) : undefined,
          to_date: searchParams.get('to_date') ? new Date(searchParams.get('to_date')!) : undefined,
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
          offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        });

        return successResponse({
          incidents,
          count: incidents.length,
        });
      }

      case 'get': {
        const id = searchParams.get('id');
        const incidentNumber = searchParams.get('incident_number');

        if (!id && !incidentNumber) {
          return errorResponse('Either id or incident_number is required', HttpStatus.BAD_REQUEST);
        }

        const incident = id 
          ? await getIncident(id)
          : await getIncidentByNumber(incidentNumber!);

        if (!incident) {
          return errorResponse('Incident not found', HttpStatus.NOT_FOUND);
        }

        return successResponse(incident);
      }

      case 'pending': {
        const notifications = await getPendingNotifications();

        return successResponse({
          notifications,
          count: notifications.length,
          deadline_hours: NOTIFICATION_DEADLINE_HOURS,
        });
      }

      case 'overdue': {
        const overdueNotifications = await getOverdueNotifications();

        return successResponse({
          notifications: overdueNotifications,
          count: overdueNotifications.length,
          is_compliant: overdueNotifications.length === 0,
        });
      }

      case 'metrics': {
        const periodDays = searchParams.get('period_days') 
          ? parseInt(searchParams.get('period_days')!)
          : 30;

        const metrics = await getIncidentMetrics(periodDays);

        return successResponse({
          ...metrics,
          period_days: periodDays,
          generated_at: new Date().toISOString(),
        });
      }

      case 'compliance': {
        const compliance = await checkComplianceStatus();

        return successResponse({
          ...compliance,
          contact_email: BON_NPSD_EMAIL,
          notification_deadline_hours: NOTIFICATION_DEADLINE_HOURS,
          assessment_deadline_days: IMPACT_ASSESSMENT_DEADLINE_DAYS,
        });
      }

      case 'report': {
        const id = searchParams.get('id');
        if (!id) {
          return errorResponse('Incident ID is required for report generation', HttpStatus.BAD_REQUEST);
        }

        const report = await generateBONReport(id);

        if (!report) {
          return errorResponse('Failed to generate report', HttpStatus.NOT_FOUND);
        }

        return successResponse({
          report,
          format: 'text',
          generated_at: new Date().toISOString(),
        });
      }

      default:
        return errorResponse('Invalid action. Use: list, get, pending, overdue, metrics, compliance, report', HttpStatus.BAD_REQUEST);
    }
  } catch (error) {
    log.error('Incidents API GET error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * POST /api/compliance/incidents
 * 
 * Body:
 * - action: 'create' | 'update' | 'notify' | 'assess'
 * 
 * For 'create':
 * - incident_type, severity, title, description, detected_at, etc.
 * 
 * For 'update':
 * - id: Incident ID
 * - status, severity, financial_loss, customers_affected, etc.
 * 
 * For 'notify':
 * - id: Incident ID
 * - reference_number: Optional BON reference
 * 
 * For 'assess':
 * - id: Incident ID
 * - reference_number: Optional BON reference
 */
async function handlePostIncidents(request: ExpoRequest) {
  try {
    // Admin authentication is handled by secureAdminRoute wrapper

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create': {
        // Validate required fields
        if (!data.incident_type || !data.severity || !data.title || !data.description) {
          return errorResponse('Missing required fields: incident_type, severity, title, description', HttpStatus.BAD_REQUEST);
        }

        const createInput: CreateIncidentInput = {
          incident_type: data.incident_type,
          severity: data.severity,
          title: data.title,
          description: data.description,
          detected_at: data.detected_at ? new Date(data.detected_at) : undefined,
          detected_by: data.detected_by,
          detection_method: data.detection_method,
          attack_vector: data.attack_vector,
          affected_systems: data.affected_systems,
          immediate_actions_taken: data.immediate_actions_taken,
          created_by: data.created_by || 'system',
        };

        const incident = await createIncident(createInput);

        return createdResponse({
          incident,
          notification_deadline: incident.preliminary_notification_deadline,
          assessment_deadline: incident.impact_assessment_due_at,
        }, `/api/compliance/incidents/${incident.id}`, `Incident ${incident.incident_number} created. Preliminary notification due within 24 hours.`);
      }

      case 'update': {
        if (!data.id) {
          return errorResponse('Incident ID is required', HttpStatus.BAD_REQUEST);
        }

        const updateInput: UpdateIncidentInput = {
          status: data.status,
          severity: data.severity,
          contained_at: data.contained_at ? new Date(data.contained_at) : undefined,
          resolved_at: data.resolved_at ? new Date(data.resolved_at) : undefined,
          closed_at: data.closed_at ? new Date(data.closed_at) : undefined,
          root_cause: data.root_cause,
          financial_loss: data.financial_loss,
          customers_affected: data.customers_affected,
          data_records_affected: data.data_records_affected,
          data_types_exposed: data.data_types_exposed,
          availability_impact_hours: data.availability_impact_hours,
          containment_measures: data.containment_measures,
          remediation_steps: data.remediation_steps,
          lessons_learned: data.lessons_learned,
          preventive_measures: data.preventive_measures,
          follow_up_required: data.follow_up_required,
          follow_up_actions: data.follow_up_actions,
          updated_by: data.updated_by || 'system',
        };

        const incident = await updateIncident(data.id, updateInput);

        if (!incident) {
          return errorResponse('Incident not found', HttpStatus.NOT_FOUND);
        }

        return successResponse(incident);
      }

      case 'notify': {
        if (!data.id) {
          return errorResponse('Incident ID is required', HttpStatus.BAD_REQUEST);
        }

        const success = await recordPreliminaryNotification(data.id, data.reference_number);

        if (!success) {
          return errorResponse('Failed to record notification', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return successResponse({
          contact_email: BON_NPSD_EMAIL,
        }, 'Preliminary notification recorded');
      }

      case 'assess': {
        if (!data.id) {
          return errorResponse('Incident ID is required', HttpStatus.BAD_REQUEST);
        }

        const success = await recordImpactAssessment(data.id, data.reference_number);

        if (!success) {
          return errorResponse('Failed to record impact assessment', HttpStatus.INTERNAL_SERVER_ERROR);
        }

        return successResponse({
          contact_email: BON_NPSD_EMAIL,
        }, 'Impact assessment submission recorded');
      }

      default:
        return errorResponse('Invalid action. Use: create, update, notify, assess', HttpStatus.BAD_REQUEST);
    }
  } catch (error) {
    log.error('Incidents API POST error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

// Export with standardized admin security wrapper
export const GET = secureAdminRoute(RATE_LIMITS.compliance, handleGetIncidents);
export const POST = secureAdminRoute(RATE_LIMITS.compliance, handlePostIncidents);

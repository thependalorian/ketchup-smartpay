/**
 * Open Banking API: /api/v1/compliance/incidents
 * 
 * Incident reporting (Open Banking format)
 * 
 * Compliance: PSD-12 §11.13-15
 * Requires: Admin authentication
 */

import { ExpoRequest } from 'expo-router/server';
import { openBankingSecureRoute, getResponseHelpers } from '@/utils/openBankingMiddleware';
import { parsePaginationParams, OpenBankingErrorCode, createErrorDetail } from '@/utils/openBanking';
import { RATE_LIMITS } from '@/utils/secureApi';
import { checkAdminAuth } from '@/utils/adminAuth';
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
import { log } from '@/utils/logger';

/**
 * GET /api/v1/compliance/incidents
 * List incidents, get metrics, check compliance
 */
async function handleGetIncidents(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || 'list';
    const { page, pageSize } = parsePaginationParams(req);

    switch (action) {
      case 'list': {
        const incidents = await listIncidents();
        const offset = (page - 1) * pageSize;
        const paginatedIncidents = incidents.slice(offset, offset + pageSize);

        const formattedIncidents = paginatedIncidents.map((incident: any) => ({
          IncidentId: incident.id,
          IncidentNumber: incident.incident_number,
          Type: incident.type,
          Severity: incident.severity,
          Status: incident.status,
          Description: incident.description,
          DetectedDateTime: incident.detected_at?.toISOString(),
          ReportedDateTime: incident.reported_at?.toISOString(),
          ResolvedDateTime: incident.resolved_at?.toISOString(),
        }));

        return helpers.paginated(
          formattedIncidents,
          'Incidents',
          '/api/v1/compliance/incidents',
          page,
          pageSize,
          incidents.length,
          req,
          undefined,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'get': {
        const incidentId = searchParams.get('incident_id');
        if (!incidentId) {
          return helpers.error(
            OpenBankingErrorCode.FIELD_MISSING,
            'incident_id parameter required',
            400
          );
        }

        const incident = await getIncident(incidentId);
        if (!incident) {
          return helpers.error(
            OpenBankingErrorCode.RESOURCE_NOT_FOUND,
            'Incident not found',
            404
          );
        }

        const incidentResponse = {
          Data: {
            Incident: {
              IncidentId: incident.id,
              IncidentNumber: incident.incident_number,
              Type: incident.type,
              Severity: incident.severity,
              Status: incident.status,
              Description: incident.description,
              DetectedDateTime: incident.detected_at?.toISOString(),
              ReportedDateTime: incident.reported_at?.toISOString(),
              ResolvedDateTime: incident.resolved_at?.toISOString(),
            },
          },
          Links: {
            Self: `/api/v1/compliance/incidents?action=get&incident_id=${incidentId}`,
          },
          Meta: {},
        };

        return helpers.success(
          incidentResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'metrics': {
        const metrics = await getIncidentMetrics();

        const metricsResponse = {
          Data: {
            Metrics: metrics,
          },
          Links: {
            Self: '/api/v1/compliance/incidents?action=metrics',
          },
          Meta: {},
        };

        return helpers.success(
          metricsResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      case 'compliance': {
        const compliance = await checkComplianceStatus();

        const complianceResponse = {
          Data: {
            Compliance: compliance,
            Requirements: {
              NotificationDeadlineHours: NOTIFICATION_DEADLINE_HOURS,
              ImpactAssessmentDeadlineDays: IMPACT_ASSESSMENT_DEADLINE_DAYS,
              BONEmail: BON_NPSD_EMAIL,
            },
          },
          Links: {
            Self: '/api/v1/compliance/incidents?action=compliance',
          },
          Meta: {},
        };

        return helpers.success(
          complianceResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      default:
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          'Invalid action. Use: list, get, metrics, compliance',
          400
        );
    }
  } catch (error) {
    log.error('Incidents API GET error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the incidents request',
      500
    );
  }
}

/**
 * POST /api/v1/compliance/incidents
 * Create new incident or record notifications
 */
async function handlePostIncidents(req: ExpoRequest) {
  const helpers = getResponseHelpers(req);
  const context = (req as any).openBanking;
  
  try {
    // Check admin authentication
    const authResult = await checkAdminAuth(req);
    if (!authResult.authorized) {
      return helpers.error(
        OpenBankingErrorCode.FORBIDDEN,
        authResult.error || 'Admin access required',
        403
      );
    }

    const body = await req.json();
    const { Data } = body;

    if (!Data) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data is required',
        400
      );
    }

    const { Action } = Data;

    if (!Action) {
      return helpers.error(
        OpenBankingErrorCode.FIELD_MISSING,
        'Data.Action is required',
        400
      );
    }

    switch (Action) {
      case 'create': {
        const { Type, Severity, Description } = Data;

        if (!Type || !Severity || !Description) {
          const errors: Array<{ ErrorCode: string; Message: string; Path?: string }> = [];
          if (!Type) {
            errors.push(createErrorDetail(OpenBankingErrorCode.FIELD_MISSING, 'The field Type is missing', 'Data.Type'));
          }
          if (!Severity) {
            errors.push(createErrorDetail(OpenBankingErrorCode.FIELD_MISSING, 'The field Severity is missing', 'Data.Severity'));
          }
          if (!Description) {
            errors.push(createErrorDetail(OpenBankingErrorCode.FIELD_MISSING, 'The field Description is missing', 'Data.Description'));
          }
          return helpers.error(
            OpenBankingErrorCode.FIELD_MISSING,
            'One or more required fields are missing',
            400,
            errors
          );
        }

        const incidentInput: CreateIncidentInput = {
          type: Type as IncidentType,
          severity: Severity as IncidentSeverity,
          description: Description,
        };

        const incident = await createIncident(incidentInput);

        const incidentResponse = {
          Data: {
            Incident: {
              IncidentId: incident.id,
              IncidentNumber: incident.incident_number,
              Type: incident.type,
              Severity: incident.severity,
              Status: incident.status,
              Description: incident.description,
              CreatedDateTime: incident.created_at.toISOString(),
            },
          },
          Links: {
            Self: `/api/v1/compliance/incidents?action=get&incident_id=${incident.id}`,
          },
          Meta: {},
        };

        return helpers.created(
          incidentResponse,
          `/api/v1/compliance/incidents?action=get&incident_id=${incident.id}`,
          context?.requestId
        );
      }

      case 'record-notification': {
        const { IncidentId, NotificationType } = Data;

        if (!IncidentId || !NotificationType) {
          return helpers.error(
            OpenBankingErrorCode.FIELD_MISSING,
            'Data.IncidentId and Data.NotificationType are required',
            400
          );
        }

        if (NotificationType === 'preliminary') {
          await recordPreliminaryNotification(IncidentId);
        } else if (NotificationType === 'impact-assessment') {
          await recordImpactAssessment(IncidentId);
        } else {
          return helpers.error(
            OpenBankingErrorCode.FIELD_INVALID,
            'Invalid NotificationType. Use: preliminary, impact-assessment',
            400
          );
        }

        const notificationResponse = {
          Data: {
            IncidentId,
            NotificationType,
            RecordedDateTime: new Date().toISOString(),
          },
          Links: {
            Self: `/api/v1/compliance/incidents?action=get&incident_id=${IncidentId}`,
          },
          Meta: {},
        };

        return helpers.success(
          notificationResponse,
          200,
          undefined,
          undefined,
          context?.requestId
        );
      }

      default:
        return helpers.error(
          OpenBankingErrorCode.FIELD_INVALID,
          'Invalid action. Use: create, record-notification',
          400
        );
    }
  } catch (error) {
    log.error('Incidents API POST error:', error);
    return helpers.error(
      OpenBankingErrorCode.SERVER_ERROR,
      'An error occurred while processing the incidents request',
      500
    );
  }
}

export const GET = openBankingSecureRoute(
  handleGetIncidents,
  {
    rateLimitConfig: RATE_LIMITS.compliance,
    requireAuth: true,
    trackResponseTime: true,
  }
);

export const POST = openBankingSecureRoute(
  handlePostIncidents,
  {
    rateLimitConfig: RATE_LIMITS.compliance,
    requireAuth: true,
    trackResponseTime: true,
  }
);

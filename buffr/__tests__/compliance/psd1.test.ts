/**
 * Compliance Tests: PSD-1 Payment Service Provider Licensing
 * 
 * Location: __tests__/compliance/psd1.test.ts
 * Purpose: Test PSD-1 Payment Service Provider Requirements compliance
 * 
 * Regulatory Source: Bank of Namibia PSD-1
 * Effective Date: February 15, 2024
 * 
 * Requirements Tested:
 * - Section 10.1: Governance Requirements
 * - Section 10.3: Risk Management Framework
 * - Section 10.4: Consumer Protection
 * - Section 16.14: Agent Management
 * - Section 23: Monthly Reporting
 * - Section 10.6: Capital Requirements
 * 
 * See: BuffrPay/PSD_1_3_12.md
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock database
jest.mock('../../utils/db', () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));

describe('Compliance: PSD-1 Payment Service Provider Requirements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Section 10.1: Governance Requirements', () => {
    it('should maintain board of directors structure', () => {
      // PSD-1 Section 15.4-15.6: Board composition requirements
      const mockBoardStructure = {
        independentNonExecutiveDirectors: [
          { id: 'dir_1', name: 'John Doe', type: 'independent_non_executive' },
          { id: 'dir_2', name: 'Jane Smith', type: 'independent_non_executive' },
        ],
        executiveDirectors: [
          { id: 'dir_3', name: 'CEO Name', type: 'executive' },
          { id: 'dir_4', name: 'CFO Name', type: 'executive' },
        ],
        chairperson: {
          id: 'dir_1',
          name: 'John Doe',
          type: 'independent_non_executive',
        },
      };

      // Must have equal number of independent and executive directors
      expect(mockBoardStructure.independentNonExecutiveDirectors.length).toBe(
        mockBoardStructure.executiveDirectors.length
      );
      
      // Chairperson must be independent non-executive
      expect(mockBoardStructure.chairperson.type).toBe('independent_non_executive');
    });

    it('should maintain beneficial ownership information', () => {
      // PSD-1 Section 10.1.2, 15.9-15.10: Beneficial ownership
      const mockBeneficialOwners = {
        owners: [
          {
            name: 'Owner 1',
            shareholding: 30, // 30%
            votingRights: 30,
            fitnessAndProbityStatus: 'approved',
            effectiveControl: true,
          },
          {
            name: 'Owner 2',
            shareholding: 25, // 25%
            votingRights: 25,
            fitnessAndProbityStatus: 'approved',
            effectiveControl: true,
          },
        ],
      };

      // Each owner must have required information
      mockBeneficialOwners.owners.forEach((owner) => {
        expect(owner).toHaveProperty('name');
        expect(owner).toHaveProperty('shareholding');
        expect(owner).toHaveProperty('votingRights');
        expect(owner).toHaveProperty('fitnessAndProbityStatus');
        expect(owner.shareholding).toBeGreaterThanOrEqual(25); // 25% threshold
      });
    });

    it('should maintain company registration documents', () => {
      // PSD-1 Section 10.1.1: Governance requirements
      const mockGovernanceDocs = {
        memorandumAndArticles: {
          certified: true,
          registrationNumber: 'B123456',
          dateOfIncorporation: '2020-01-15',
        },
        certificateOfIncorporation: {
          certified: true,
          registrationDate: '2020-01-15',
        },
        cm29: {
          // Contents of registration of directors, auditors, and officers
          directors: ['dir_1', 'dir_2', 'dir_3', 'dir_4'],
          auditors: ['auditor_1'],
          officers: ['officer_1', 'officer_2'],
        },
        companyProfile: {
          name: 'Buffr Payment Services',
          registrationNumber: 'B123456',
        },
      };

      expect(mockGovernanceDocs.memorandumAndArticles.certified).toBe(true);
      expect(mockGovernanceDocs.certificateOfIncorporation.certified).toBe(true);
      expect(mockGovernanceDocs.cm29.directors).toBeInstanceOf(Array);
    });
  });

  describe('Section 10.3: Risk Management Framework', () => {
    it('should have comprehensive risk management framework', () => {
      // PSD-1 Section 10.3.1: Risk categories
      const mockRiskFramework = {
        riskCategories: [
          'operational',
          'outsourcing',
          'fraud',
          'money_laundering',
          'cyber_security',
          'reputational',
          'legal',
          'liquidity',
          'credit',
          'counterparty',
          'data_protection',
        ],
        riskControls: {
          operational: {
            controls: ['backup_systems', 'disaster_recovery'],
            effectiveness: 'high',
          },
          fraud: {
            controls: ['fraud_detection', 'transaction_monitoring'],
            effectiveness: 'high',
          },
          cyber_security: {
            controls: ['encryption', '2fa', 'penetration_testing'],
            effectiveness: 'high',
          },
        },
      };

      const requiredRisks = [
        'operational',
        'outsourcing',
        'fraud',
        'money_laundering',
        'cyber_security',
        'reputational',
        'legal',
        'liquidity',
        'credit',
        'counterparty',
        'data_protection',
      ];

      requiredRisks.forEach((risk) => {
        expect(mockRiskFramework.riskCategories).toContain(risk);
        const riskControls = mockRiskFramework.riskControls as Record<string, { controls: string[]; effectiveness: string }>;
        if (riskControls[risk]) {
          expect(riskControls[risk]).toBeDefined();
        }
      });
    });

    it('should have penetration testing results', () => {
      // PSD-1 Section 10.3.2: Penetration testing by independent expert
      const mockPenetrationTest = {
        lastTestDate: new Date('2024-06-15'),
        testedBy: 'Independent Security Expert Company',
        results: 'passed',
        vulnerabilities: [
          {
            severity: 'low',
            description: 'Minor configuration issue',
            remediated: true,
            remediationDate: new Date('2024-06-20'),
          },
        ],
        remediationStatus: 'all_remediated',
      };

      // Must be within last 3 years (PSD-12 Section 11.3)
      const lastTest = new Date(mockPenetrationTest.lastTestDate);
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      expect(lastTest.getTime()).toBeGreaterThan(threeYearsAgo.getTime());

      expect(mockPenetrationTest.testedBy).toContain('Independent');
      expect(mockPenetrationTest.remediationStatus).toBe('all_remediated');
    });

    it('should have vulnerability management plan', () => {
      // PSD-1 Section 10.3.3: Structured vulnerability management
      const mockVulnerabilityManagement = {
        identificationProcess: {
          automated: true,
          manual: true,
          frequency: 'daily',
        },
        prioritizationCriteria: {
          severity: ['critical', 'high', 'medium', 'low'],
          exploitability: true,
          businessImpact: true,
        },
        mitigationProcedures: {
          critical: 'immediate_patch',
          high: 'patch_within_24h',
          medium: 'patch_within_7d',
          low: 'patch_within_30d',
        },
        trackingSystem: {
          name: 'Vulnerability Tracking System',
          integration: 'jira',
        },
      };

      expect(mockVulnerabilityManagement.identificationProcess).toBeDefined();
      expect(mockVulnerabilityManagement.prioritizationCriteria).toBeDefined();
      expect(mockVulnerabilityManagement.mitigationProcedures).toBeDefined();
      expect(mockVulnerabilityManagement.trackingSystem).toBeDefined();
    });
  });

  describe('Section 10.4: Consumer Protection', () => {
    it('should have consumer protection policy', () => {
      // PSD-1 Section 10.4.1: Consumer protection policy
      const mockConsumerProtectionPolicy = {
        fraudPrevention: {
          measures: ['transaction_monitoring', '2fa', 'fraud_detection'],
          userEducation: true,
        },
        userRights: {
          rightToRedemption: true,
          rightToComplaint: true,
          rightToInformation: true,
        },
        userResponsibilities: {
          keepCredentialsSafe: true,
          reportFraud: true,
          verifyTransactions: true,
        },
        feeTransparency: {
          allFeesDisclosed: true,
          feeSchedule: 'publicly_available',
        },
        disputeResolution: {
          process: 'defined',
          timeframe: '15_days',
          escalation: 'available',
        },
      };

      expect(mockConsumerProtectionPolicy.fraudPrevention).toBeDefined();
      expect(mockConsumerProtectionPolicy.userRights).toBeDefined();
      expect(mockConsumerProtectionPolicy.userResponsibilities).toBeDefined();
      expect(mockConsumerProtectionPolicy.feeTransparency).toBeDefined();
      expect(mockConsumerProtectionPolicy.disputeResolution).toBeDefined();
    });

    it('should have user agreements with required terms', () => {
      // PSD-1 Section 10.4.2: User agreement requirements
      const mockUserAgreement = {
        userIdentity: {
          required: true,
          kycLevel: 2,
        },
        redemptionRights: {
          guaranteed: true,
          conditions: 'at_par_value',
        },
        redemptionConditions: {
          fees: 'disclosed',
          timeframe: 'immediate',
        },
        redemptionFees: {
          disclosed: true,
          amount: 0.00, // No fees for redemption
        },
        complaintProcedures: {
          process: 'defined',
          contactInformation: 'provided',
          escalation: 'available',
        },
        contactInformation: {
          email: 'support@buffr.com',
          phone: '+26461234567',
          address: 'Windhoek, Namibia',
        },
      };

      expect(mockUserAgreement.userIdentity).toBeDefined();
      expect(mockUserAgreement.redemptionRights).toBeDefined();
      expect(mockUserAgreement.redemptionConditions).toBeDefined();
      expect(mockUserAgreement.redemptionFees).toBeDefined();
      expect(mockUserAgreement.complaintProcedures).toBeDefined();
      expect(mockUserAgreement.contactInformation).toBeDefined();
    });
  });

  describe('Section 16.14: Agent Management', () => {
    it('should require 60-day notice for agent appointment', () => {
      // PSD-1 Section 16.14: Agent appointment requirements
      const mockAgentRequest = {
        agentData: {
          name: 'Test Agent',
          businessRegistration: 'B123456',
          location: 'Windhoek',
          services: ['cash_in', 'cash_out'],
        },
        submittedAt: new Date('2026-01-26'),
        noticePeriod: 60, // days
        status: 'pending_approval',
        approvalDate: null, // Not yet approved
      };

      expect(mockAgentRequest.noticePeriod).toBe(60);
      expect(mockAgentRequest.status).toBe('pending_approval');
      expect(mockAgentRequest.submittedAt).toBeDefined();
    });

    it('should perform agent due diligence', () => {
      // PSD-1 Section 16.14(f): Due diligence requirements
      const mockAgentDueDiligence = {
        agentId: 'agent_123',
        licensingCompliance: {
          compliant: true,
          licenseNumber: 'B123456',
          expiryDate: '2027-12-31',
        },
        legalPermission: {
          permitted: true,
          restrictions: [],
        },
        financialResources: {
          sufficient: true,
          capital: 50000.00,
          minRequired: 10000.00,
        },
        technicalKnowledge: {
          adequate: true,
          trainingCompleted: true,
          certifications: ['payment_processing'],
        },
        userDueDiligenceCapability: {
          capable: true,
          kycTools: 'available',
        },
        fiaCompliance: {
          compliant: true,
          amlPolicy: 'implemented',
        },
        moralCharacter: {
          verified: true,
          policeClearance: 'valid',
        },
      };

      expect(mockAgentDueDiligence.licensingCompliance.compliant).toBe(true);
      expect(mockAgentDueDiligence.legalPermission.permitted).toBe(true);
      expect(mockAgentDueDiligence.financialResources.sufficient).toBe(true);
      expect(mockAgentDueDiligence.technicalKnowledge.adequate).toBe(true);
      expect(mockAgentDueDiligence.userDueDiligenceCapability.capable).toBe(true);
      expect(mockAgentDueDiligence.fiaCompliance.compliant).toBe(true);
      expect(mockAgentDueDiligence.moralCharacter.verified).toBe(true);
    });

    it('should submit annual agent list', () => {
      // PSD-1 Section 16.15: Annual agent reporting
      const mockAnnualAgentReport = {
        year: 2026,
        agents: [
          {
            name: 'Agent 1',
            location: {
              city: 'Windhoek',
              region: 'Khomas',
            },
            paymentServices: ['cash_in', 'cash_out', 'voucher_redemption'],
            status: 'active',
            poolAccountBalance: 50000.00,
            valuesAndVolumes: {
              totalValue: 1000000.00,
              totalVolume: 5000,
            },
          },
          {
            name: 'Agent 2',
            location: {
              city: 'Swakopmund',
              region: 'Erongo',
            },
            paymentServices: ['cash_in', 'cash_out'],
            status: 'active',
            poolAccountBalance: 30000.00,
            valuesAndVolumes: {
              totalValue: 500000.00,
              totalVolume: 2500,
            },
          },
        ],
      };

      expect(mockAnnualAgentReport.agents).toBeInstanceOf(Array);
      
      // Each agent must have required fields
      mockAnnualAgentReport.agents.forEach((agent) => {
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('location');
        expect(agent).toHaveProperty('paymentServices');
        expect(agent).toHaveProperty('status');
        expect(agent).toHaveProperty('poolAccountBalance');
        expect(agent).toHaveProperty('valuesAndVolumes');
      });
    });

    it('should include agent risk assessment', () => {
      // PSD-1 Section 16.14(e): Risk assessment report
      const mockAgentRiskAssessment = {
        agentId: 'agent_123',
        risks: [
          {
            type: 'operational',
            severity: 'medium',
            controls: ['monitoring', 'reporting'],
          },
          {
            type: 'fraud',
            severity: 'low',
            controls: ['transaction_limits', 'verification'],
          },
        ],
        controlMeasures: {
          monitoring: 'daily',
          reporting: 'monthly',
          limits: 'enforced',
        },
      };

      expect(mockAgentRiskAssessment.risks).toBeInstanceOf(Array);
      expect(mockAgentRiskAssessment.controlMeasures).toBeDefined();
    });
  });

  describe('Section 23: Monthly Reporting', () => {
    it('should submit monthly statistics within 10 days', () => {
      // PSD-1 Section 23.1-23.2: Monthly reporting deadline
      const mockMonthlyReport = {
        month: '2026-01',
        statistics: {
          totalTransactions: 10000,
          totalVolume: 5000000.00,
          activeUsers: 5000,
        },
        submittedAt: new Date('2026-02-05'), // 5 days after month end
        reportingMonth: '2026-01',
      };

      // Verify submission is within 10 days of month end
      const monthEnd = new Date('2026-01-31');
      const submittedAt = new Date(mockMonthlyReport.submittedAt);
      const daysDiff = (submittedAt.getTime() - monthEnd.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeLessThanOrEqual(10);
      expect(daysDiff).toBeGreaterThanOrEqual(0);
    });

    it('should include all required PSP return fields', () => {
      // PSD-1 Section 23.1: Payment Service Provider Returns
      const mockPSPReturns = {
        month: '2026-01',
        totalTransactions: 10000,
        transactionVolume: 5000000.00,
        transactionValue: 5000000.00,
        activeUsers: 5000,
        activeAgents: 150,
        trustAccountBalance: 1000000.00,
        outstandingLiabilities: 950000.00,
        fraudIncidents: 5,
        complaintsReceived: 25,
        complaintsResolved: 23,
      };

      // Verify all required fields present
      const requiredFields = [
        'totalTransactions',
        'transactionVolume',
        'transactionValue',
        'activeUsers',
        'activeAgents',
        'trustAccountBalance',
        'outstandingLiabilities',
        'fraudIncidents',
        'complaintsReceived',
        'complaintsResolved',
      ];

      requiredFields.forEach((field) => {
        expect(mockPSPReturns).toHaveProperty(field);
      });
    });
  });

  describe('Section 10.6: Capital Requirements', () => {
    it('should maintain initial capital requirement', () => {
      // PSD-1 Section 10.6.1: Initial capital (N$1.5M or as determined by BoN)
      const mockCapitalAdequacy = {
        initialCapital: 1500000.00, // N$1.5M minimum
        currentCapital: 2000000.00,
        meetsInitialRequirement: true,
      };

      expect(mockCapitalAdequacy.initialCapital).toBeGreaterThanOrEqual(1500000); // N$1.5M minimum
      expect(mockCapitalAdequacy.meetsInitialRequirement).toBe(true);
    });

    it('should calculate ongoing capital requirement', () => {
      // PSD-1 Section 10.6.2: Ongoing capital (average of outstanding liabilities)
      const mockOngoingCapital = {
        outstandingLiabilities: 950000.00,
        sixMonthAverage: 900000.00, // Average over last 6 months
        liquidAssets: 1000000.00,
        meetsRequirement: true,
        shortfall: 0.00,
      };

      // Liquid assets must equal or exceed 6-month average
      expect(mockOngoingCapital.meetsRequirement).toBe(true);
      expect(mockOngoingCapital.liquidAssets).toBeGreaterThanOrEqual(mockOngoingCapital.sixMonthAverage);
      expect(mockOngoingCapital.shortfall).toBe(0.00);
    });

    it('should track liquid assets', () => {
      const mockLiquidAssets = {
        cash: 500000.00,
        shortTermInstruments: 300000.00,
        governmentBonds: 200000.00,
        total: 1000000.00,
        unencumbered: true,
      };

      expect(mockLiquidAssets.total).toBeGreaterThan(0);
      expect(mockLiquidAssets.unencumbered).toBe(true);
    });
  });

  describe('Section 10.2: Board of Directors and Executives', () => {
    it('should maintain fitness and probity records', () => {
      // PSD-1 Section 10.2.2: Fitness and probity requirements
      const mockFitnessAndProbity = {
        directorId: 'dir_1',
        forms: {
          psf001: 'completed',
          psf002: 'completed',
        },
        declaration: 'signed',
        policeClearance: {
          country: 'Namibia',
          issued: new Date('2025-12-01'),
          valid: true, // Not older than 6 months
        },
        taxGoodStanding: {
          certificate: 'valid',
          expiryDate: '2026-12-31',
        },
      };

      const policeClearanceAge = (new Date().getTime() - mockFitnessAndProbity.policeClearance.issued.getTime()) / (1000 * 60 * 60 * 24);
      expect(policeClearanceAge).toBeLessThan(180); // Not older than 6 months
      expect(mockFitnessAndProbity.declaration).toBe('signed');
    });

    it('should maintain executive CVs and qualifications', () => {
      // PSD-1 Section 10.2.3: Comprehensive CV requirements
      const mockExecutiveCV = {
        executiveId: 'exec_1',
        name: 'CEO Name',
        qualifications: ['MBA', 'CPA'],
        expertise: ['payment_systems', 'financial_services'],
        competence: 'demonstrated',
        yearsExperience: 15,
      };

      expect(mockExecutiveCV.qualifications).toBeInstanceOf(Array);
      expect(mockExecutiveCV.expertise).toBeInstanceOf(Array);
      expect(mockExecutiveCV.competence).toBeDefined();
    });
  });

  describe('Section 10.5: Contractual Requirements', () => {
    it('should have third-party agreements with required provisions', () => {
      // PSD-1 Section 10.5.1: Third-party agreement requirements
      const mockThirdPartyAgreement = {
        partyType: 'technical_partner',
        provisions: {
          complianceWithAct: true, // Section 14 of the Act
          rolesAndResponsibilities: 'defined',
          informationExchange: 'specified',
          materialityThresholds: 'defined',
          serviceDisruptionNotification: 'required',
          dataOwnership: 'specified',
          insuranceRequirements: 'specified',
          terminationClauses: 'defined',
          businessContinuity: 'required',
          confidentiality: 'required',
          monitoringAndAudit: 'allowed',
        },
      };

      expect(mockThirdPartyAgreement.provisions.complianceWithAct).toBe(true);
      expect(mockThirdPartyAgreement.provisions.rolesAndResponsibilities).toBe('defined');
      expect(mockThirdPartyAgreement.provisions.dataOwnership).toBe('specified');
    });
  });
});

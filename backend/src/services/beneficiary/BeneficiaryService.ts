/**
 * Beneficiary Service
 * 
 * Location: backend/src/services/beneficiary/BeneficiaryService.ts
 * Purpose: Business logic for beneficiary operations (PRD Component: Beneficiary Database)
 */

import { BeneficiaryRepository } from './BeneficiaryRepository';
import { StatusMonitor } from '../status/StatusMonitor';
import { 
  Beneficiary, 
  CreateBeneficiaryDTO, 
  UpdateBeneficiaryDTO, 
  BeneficiaryFilters 
} from '../../../../shared/types';
import { log, logError } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class BeneficiaryService {
  private repository: BeneficiaryRepository;
  private statusMonitor: StatusMonitor;

  constructor(repository?: BeneficiaryRepository, statusMonitor?: StatusMonitor) {
    this.repository = repository || new BeneficiaryRepository();
    this.statusMonitor = statusMonitor || new StatusMonitor();
  }

  /**
   * Get all beneficiaries with optional filters
   */
  async getAll(filters?: BeneficiaryFilters): Promise<Beneficiary[]> {
    try {
      log('Fetching beneficiaries', { filters });
      const beneficiaries = await this.repository.findAll(filters);
      log(`Found ${beneficiaries.length} beneficiaries`);
      return beneficiaries;
    } catch (error) {
      logError('Failed to get beneficiaries', error);
      throw error;
    }
  }

  /**
   * Get beneficiary by ID
   */
  async getById(id: string): Promise<Beneficiary | null> {
    try {
      log('Fetching beneficiary by ID', { id });
      const beneficiary = await this.repository.findById(id);
      return beneficiary;
    } catch (error) {
      logError('Failed to get beneficiary by ID', error, { id });
      throw error;
    }
  }

  /**
   * Create a new beneficiary
   */
  async create(data: CreateBeneficiaryDTO): Promise<Beneficiary> {
    try {
      // Validate input
      this.validateBeneficiaryData(data);

      // Generate unique ID
      const id = this.generateBeneficiaryId();

      // Create beneficiary
      const beneficiary = await this.repository.create({
        id,
        name: data.name,
        phone: data.phone,
        region: data.region,
        grantType: data.grantType,
        status: data.status || 'pending',
        idNumber: data.idNumber,
        proxyName: data.proxyName,
        proxyIdNumber: data.proxyIdNumber,
        proxyPhone: data.proxyPhone,
        proxyRelationship: data.proxyRelationship,
      });

      log('Beneficiary created successfully', { id: beneficiary.id });
      return beneficiary;
    } catch (error) {
      logError('Failed to create beneficiary', error, { data });
      throw error;
    }
  }

  /**
   * Update beneficiary
   */
  async update(id: string, data: UpdateBeneficiaryDTO): Promise<Beneficiary> {
    try {
      // Check if beneficiary exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new Error(`Beneficiary with ID ${id} not found`);
      }

      // Update beneficiary
      const updated = await this.repository.update(id, data);
      // Emit beneficiary.deceased event when status becomes deceased (for audit / webhook subscribers)
      if (updated.status === 'deceased' && existing.status !== 'deceased') {
        try {
          await this.statusMonitor.recordBeneficiaryDeceased(id, existing.status ?? 'active', 'manual');
        } catch (e) {
          logError('Failed to record beneficiary.deceased event', e, { id });
        }
      }
      log('Beneficiary updated successfully', { id: updated.id });
      return updated;
    } catch (error) {
      logError('Failed to update beneficiary', error, { id, data });
      throw error;
    }
  }

  /**
   * Get beneficiaries by region
   */
  async getByRegion(region: string): Promise<Beneficiary[]> {
    try {
      return await this.repository.findByRegion(region);
    } catch (error) {
      logError('Failed to get beneficiaries by region', error, { region });
      throw error;
    }
  }

  /**
   * Get eligible beneficiaries (active status)
   */
  async getEligible(): Promise<Beneficiary[]> {
    try {
      return await this.repository.findEligible();
    } catch (error) {
      logError('Failed to get eligible beneficiaries', error);
      throw error;
    }
  }

  /**
   * Validate beneficiary data
   */
  private validateBeneficiaryData(data: CreateBeneficiaryDTO): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Beneficiary name is required');
    }

    if (!data.phone || !this.isValidPhoneNumber(data.phone)) {
      throw new Error('Valid phone number is required (format: +264XXXXXXXXX)');
    }

    if (!data.region) {
      throw new Error('Region is required');
    }

    if (!data.grantType) {
      throw new Error('Grant type is required');
    }
  }

  /**
   * Validate phone number (Namibian format)
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Namibian phone format: +264XXXXXXXXX
    const phoneRegex = /^\+264\d{9}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Generate unique beneficiary ID
   */
  private generateBeneficiaryId(): string {
    // Format: NA + 9 digits
    const random = Math.floor(100000000 + Math.random() * 900000000);
    return `NA${random}`;
  }
}

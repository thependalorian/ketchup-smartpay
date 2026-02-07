/**
 * Beneficiary API Client
 *
 * Location: packages/api-client/src/ketchup/beneficiaryAPI.ts
 * Purpose: API client for beneficiary and dependant operations.
 */

import { apiClient } from './api';
import type {
  Beneficiary,
  CreateBeneficiaryDTO,
  UpdateBeneficiaryDTO,
  BeneficiaryFilters,
  Dependant,
  CreateDependantDTO,
  UpdateDependantDTO,
} from '../types';

export const beneficiaryAPI = {
  /**
   * Get all beneficiaries
   */
  getAll: async (filters?: BeneficiaryFilters): Promise<Beneficiary[]> => {
    return apiClient.get<Beneficiary[]>('/beneficiaries', filters);
  },

  /**
   * Get beneficiary by ID
   */
  getById: async (id: string): Promise<Beneficiary> => {
    return apiClient.get<Beneficiary>(`/beneficiaries/${id}`);
  },

  /**
   * Create beneficiary
   */
  create: async (data: CreateBeneficiaryDTO): Promise<Beneficiary> => {
    return apiClient.post<Beneficiary>('/beneficiaries', data);
  },

  /**
   * Update beneficiary
   */
  update: async (id: string, data: UpdateBeneficiaryDTO): Promise<Beneficiary> => {
    return apiClient.put<Beneficiary>(`/beneficiaries/${id}`, data);
  },

  /**
   * Get vouchers for a beneficiary
   */
  getVouchers: async (id: string): Promise<any[]> => {
    return apiClient.get<any[]>(`/beneficiaries/${id}/vouchers`);
  },

  /** Get dependants for a beneficiary */
  getDependants: async (beneficiaryId: string): Promise<Dependant[]> => {
    return apiClient.get<Dependant[]>(`/beneficiaries/${beneficiaryId}/dependants`);
  },

  /** Create a dependant */
  createDependant: async (beneficiaryId: string, data: CreateDependantDTO): Promise<Dependant> => {
    return apiClient.post<Dependant>(`/beneficiaries/${beneficiaryId}/dependants`, data);
  },

  /** Get a single dependant */
  getDependant: async (beneficiaryId: string, dependantId: string): Promise<Dependant> => {
    return apiClient.get<Dependant>(`/beneficiaries/${beneficiaryId}/dependants/${dependantId}`);
  },

  /** Update a dependant */
  updateDependant: async (beneficiaryId: string, dependantId: string, data: UpdateDependantDTO): Promise<Dependant> => {
    return apiClient.patch<Dependant>(`/beneficiaries/${beneficiaryId}/dependants/${dependantId}`, data);
  },

  /** Delete a dependant */
  deleteDependant: async (beneficiaryId: string, dependantId: string): Promise<void> => {
    return apiClient.delete<void>(`/beneficiaries/${beneficiaryId}/dependants/${dependantId}`);
  },
};

/**
 * Assessment Service
 * Unified abstraction layer for managing Assessments & Exams.
 * Backed by mockService currently; seamlessly points to REST/GraphQL backend in production.
 */

import { mockService } from '../mocks/mockService';
import { Assessment } from '../../interfaces/velica.interfaces';

export const assessmentService = {
  async getAll(classId?: string): Promise<Assessment[]> {
    return mockService.getAssessments(classId);
  },

  async getById(id: string): Promise<Assessment | null> {
    return mockService.getAssessmentById(id);
  },

  async create(data: Omit<Assessment, 'id' | 'createdAt'>): Promise<Assessment> {
    return mockService.createAssessment(data);
  },

  async update(id: string, data: Partial<Assessment>): Promise<Assessment | null> {
    return mockService.updateAssessment(id, data);
  },

  async publish(id: string): Promise<Assessment | null> {
    return mockService.publishAssessment(id);
  },

  async delete(id: string): Promise<boolean> {
    return mockService.deleteAssessment(id);
  },
};

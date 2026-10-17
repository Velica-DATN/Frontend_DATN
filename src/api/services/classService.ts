/**
 * Class Service
 * Unified abstraction layer for Classes, Syllabi, and Lessons.
 */

import { mockService } from '../mocks/mockService';
import { ClassRoom, ClassMember, Syllabus, Lesson } from '../../interfaces/velica.interfaces';

export const classService = {
  async getAll(): Promise<ClassRoom[]> {
    return mockService.getClasses();
  },

  async getById(id: string): Promise<ClassRoom | null> {
    return mockService.getClassById(id);
  },

  async getMembers(classId: string): Promise<ClassMember[]> {
    return mockService.getClassMembers(classId);
  },

  async getSyllabi(): Promise<Syllabus[]> {
    return mockService.getSyllabi();
  },

  async getLessons(syllabusId?: string): Promise<Lesson[]> {
    return mockService.getLessons(syllabusId);
  },
};

/**
 * Question Service
 * Unified abstraction layer for Question Bank and Rubrics.
 */

import { mockService } from '../mocks/mockService';
import { Question, QuestionLevel, Rubric } from '../../interfaces/velica.interfaces';

export const questionService = {
  async getAll(filter?: {
    type?: string;
    difficulty?: string;
    lessonId?: string;
    cloId?: string;
  }): Promise<Question[]> {
    return mockService.getQuestions(filter);
  },

  async getById(id: string): Promise<Question | null> {
    return mockService.getQuestionById(id);
  },

  async create(data: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question> {
    return mockService.createQuestion(data);
  },

  async update(id: string, data: Partial<Question>): Promise<Question | null> {
    return mockService.updateQuestion(id, data);
  },

  async delete(id: string): Promise<boolean> {
    return mockService.deleteQuestion(id);
  },

  async getLevels(): Promise<QuestionLevel[]> {
    return mockService.getQuestionLevels();
  },

  async getRubrics(): Promise<Rubric[]> {
    return mockService.getRubrics();
  },

  async getRubricById(id: string): Promise<Rubric | null> {
    return mockService.getRubricById(id);
  },
};

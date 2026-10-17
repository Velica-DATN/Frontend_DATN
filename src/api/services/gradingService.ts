/**
 * Grading Service
 * Unified abstraction layer for Submissions, Manual Grading, and Grade Appeals.
 */

import { mockService } from '../mocks/mockService';
import { Submission, GradeAppeal } from '../../interfaces/velica.interfaces';
import { APPEAL_STATUS } from '../../constants/assessmentConstants';

export const gradingService = {
  async getSubmissions(assessmentId?: string): Promise<Submission[]> {
    return mockService.getSubmissions(assessmentId);
  },

  async getSubmissionById(id: string): Promise<Submission | null> {
    return mockService.getSubmissionById(id);
  },

  async gradeSubmission(
    submissionId: string,
    grades: {
      questionId: string;
      pointsAwarded: number;
      feedback: string;
      rubricScores?: Record<string, number>;
    }[]
  ): Promise<Submission> {
    return mockService.gradeSubmission(submissionId, grades);
  },

  async overrideGrade(
    submissionId: string,
    newScore: number,
    reason: string
  ): Promise<Submission> {
    return mockService.overrideGrade(submissionId, newScore, reason);
  },

  async getAppeals(assessmentId?: string): Promise<GradeAppeal[]> {
    return mockService.getAppeals(assessmentId);
  },

  async getAppealById(id: string): Promise<GradeAppeal | null> {
    return mockService.getAppealById(id);
  },

  async getAppealBySubmissionId(submissionId: string): Promise<GradeAppeal | null> {
    return mockService.getAppealBySubmissionId(submissionId);
  },

  async respondAppeal(
    appealId: string,
    status: typeof APPEAL_STATUS.APPROVED | typeof APPEAL_STATUS.REJECTED,
    response: string,
    newScore?: number
  ): Promise<GradeAppeal> {
    return mockService.respondAppeal(appealId, status, response, newScore);
  },
};

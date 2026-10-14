export const ASSESSMENT_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  GRADED: 'GRADED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
} as const;

export type AssessmentStatus = (typeof ASSESSMENT_STATUS)[keyof typeof ASSESSMENT_STATUS];

export const ASSESSMENT_TYPE = {
  QUIZ: 'QUIZ',
  MIDTERM: 'MIDTERM',
  FINAL: 'FINAL',
  ASSIGNMENT: 'ASSIGNMENT',
  HOMEWORK: 'HOMEWORK',
  PRACTICE: 'PRACTICE',
} as const;

export type AssessmentType = (typeof ASSESSMENT_TYPE)[keyof typeof ASSESSMENT_TYPE];

export const QUESTION_TYPE = {
  MCQ: 'MCQ',
  MULTI_CHOICE: 'MULTI_CHOICE',
  TRUE_FALSE: 'TRUE_FALSE',
  FILL_BLANK: 'FILL_BLANK',
  ESSAY: 'ESSAY',
} as const;

export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];

export const QUESTION_DIFFICULTY = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
  VERY_HARD: 'VERY_HARD',
} as const;

export type QuestionDifficulty = (typeof QUESTION_DIFFICULTY)[keyof typeof QUESTION_DIFFICULTY];

export const GRADING_STATUS = {
  AUTO_GRADED: 'AUTO_GRADED',
  PENDING_MANUAL: 'PENDING_MANUAL',
  IN_PROGRESS: 'IN_PROGRESS',
  GRADED: 'GRADED',
} as const;

export type GradingStatus = (typeof GRADING_STATUS)[keyof typeof GRADING_STATUS];

export const APPEAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type AppealStatus = (typeof APPEAL_STATUS)[keyof typeof APPEAL_STATUS];

export const SUBMISSION_FORMAT = {
  PLAINTEXT: 'PLAINTEXT',
  FILE_UPLOAD: 'FILE_UPLOAD',
  HYBRID: 'HYBRID',
} as const;

export type SubmissionFormat = (typeof SUBMISSION_FORMAT)[keyof typeof SUBMISSION_FORMAT];

export const EVALUATION_TYPE = {
  MANUAL_GUIDELINE: 'MANUAL_GUIDELINE',
  RUBRIC: 'RUBRIC',
} as const;

export type EvaluationType = (typeof EVALUATION_TYPE)[keyof typeof EVALUATION_TYPE];


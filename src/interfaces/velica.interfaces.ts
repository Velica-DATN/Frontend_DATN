import { UserRole } from '../constants/roleConstants';
import {
  AssessmentStatus,
  AssessmentType,
  QuestionType,
  QuestionDifficulty,
  GradingStatus,
  AppealStatus,
} from '../constants/assessmentConstants';

// User & Auth
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  phoneNumber?: string;
  department?: string;
  isActive: boolean;
  createdAt: string;

  // Extended Profile & Academic Identity
  code?: string; // MSSV (Sinh viên), MSGV (Giảng viên), Mã cán bộ (Admin)
  academicTitle?: string; // TS., ThS., PGS.TS (Giảng viên)
  faculty?: string; // Khoa / Viện (VD: Khoa Công Nghệ Phần Mềm)
  major?: string; // Ngành / Chuyên ngành (VD: Kỹ thuật Phần mềm)
  className?: string; // Lớp sinh hoạt (VD: SE101 - K18)
  academicYear?: string; // Niên khóa / Khóa (VD: Khóa 18 (2022 - 2026))
  status?: string; // Trạng thái học tập / công tác ('Đang học', 'Đang công tác', 'Hoạt động')
  position?: string; // Chức vụ: Trưởng bộ môn, Giảng viên chính, Quản trị viên cấp cao
  personalEmail?: string; // Email cá nhân / dự phòng
  gender?: string; // Giới tính ('Nam', 'Nữ')
  dob?: string; // Ngày sinh (YYYY-MM-DD)
  address?: string; // Quê quán / Địa chỉ
  bio?: string; // Giới thiệu bản thân / Lĩnh vực chuyên môn
  lastLogin?: string; // Lần đăng nhập cuối
}

// Academic Content
export interface LearningObjective {
  id: string;
  code: string; // e.g. CLO1, CLO2
  description: string;
}

export interface SyllabusMaterial {
  no: number;
  description: string;
  author: string;
  publisher: string;
  publishedDate?: string;
  edition?: string;
  isbn?: string;
  isMainMaterial: boolean;
  isHardCopy: boolean;
  isOnline: boolean;
  url?: string;
  note?: string;
}

export interface SyllabusAssessmentItem {
  no: number;
  category: string;
  type: string;
  part: number;
  weight: number;
  completionCriteria: string;
  duration?: string;
  clo: string;
  questionType?: string;
  noQuestion?: string | number;
  knowledgeAndSkill?: string;
  gradingGuide?: string;
  note?: string;
}

export interface SyllabusSession {
  sessionNo: number;
  topic: string;
  type: string;
  clo: string;
  itu: string;
  studentMaterials?: string;
  tasks: string;
  urls?: string;
}

export interface Syllabus {
  id: string;
  code: string;
  name: string;
  courseNameEnglish?: string;
  description: string;
  credits: number;
  degreeLevel?: string;
  timeAllocation?: string;
  preRequisite?: string;
  learningTeachingMethod?: string;
  studentTasks?: string[];
  tools?: string[];
  scoringScale?: number;
  minAvgMarkToPass?: number;
  decisionNo?: string;
  approvedDate?: string;
  isApproved?: boolean;
  learningObjectives: LearningObjective[];
  materials?: SyllabusMaterial[];
  assessments?: SyllabusAssessmentItem[];
  sessions?: SyllabusSession[];
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  syllabusId: string;
  syllabusName?: string;
  cloIds?: string[];
  title: string;
  description: string;
  content: string; // HTML/Markdown from editor
  orderIndex: number;
  questionCount: number;
  createdAt: string;
}

// Question Bank
export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionLevel {
  id: string;
  name: string;
  levelKey: QuestionDifficulty;
  weight: number;
  description: string;
  inUseCount: number;
}

export enum SubmissionFormat {
  PLAINTEXT = 'PLAINTEXT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  HYBRID = 'HYBRID',
}

export interface FileConstraintConfig {
  allowedExtensions: string[]; // e.g. ['.pdf', '.zip']
  maxFileSizeMb: number;       // e.g. 10
  maxFilesCount: number;       // e.g. 1
}

// Essay Grading & Rubric Preset Contracts
export type EvaluationType = 'MANUAL_GUIDELINE' | 'RUBRIC';

export interface RubricCriterionLevel {
  id?: string;
  label: string;       // VD: Tốt, Khá, Trung bình, Yếu
  score: number;       // VD: 10, 7.5, 5, 0
  description: string;
}

export interface RubricCriterion {
  id: string;
  name: string;          // VD: 'Cấu trúc mã nguồn & Design Pattern'
  title?: string;        // Compatibility with legacy RubricCriteria.title
  weightPercent: number; // VD: 40 (%)
  maxPoints?: number;    // Compatibility with legacy RubricCriteria.maxPoints
  levels?: RubricCriterionLevel[];
}

export interface RubricPreset {
  id: string;
  title: string;
  description?: string;
  courseSubjectId: string;
  totalMaxScore: number;
  criteria: RubricCriterion[];
  createdAt?: string;
}

export interface QuestionGradingConfig {
  evaluationType: EvaluationType;
  manualGuideline?: string;   // Sử dụng khi evaluationType === 'MANUAL_GUIDELINE'
  rubricId?: string;          // Sử dụng khi evaluationType === 'RUBRIC'
  rubricDetail?: RubricPreset; // Dữ liệu populate để preview
}

export interface Question {
  id: string;
  lessonId?: string;
  lessonTitle?: string;
  cloId?: string;
  content: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  points?: number; // Optional in question bank; allocated when composing assessment
  options?: QuestionOption[]; // for MCQ
  rubricId?: string; // for Essay
  explanation?: string;
  imageUrl?: string; // Diagram/Architecture/Chart image attachment
  // Specific to ESSAY:
  submissionFormat?: SubmissionFormat;
  fileConstraint?: FileConstraintConfig;
  gradingConfig?: QuestionGradingConfig;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionItem {
  id: string;
  type: QuestionType;
  title?: string;
  content?: string;
  points: number;
  // Specific to ESSAY:
  submissionFormat?: SubmissionFormat;
  fileConstraint?: FileConstraintConfig;
  gradingConfig?: QuestionGradingConfig;
  // Specific to MULTIPLE_CHOICE:
  options?: Array<{ id: string; text: string; isCorrect: boolean }>;
}

export interface ExamFormPayload {
  title: string;
  courseClassId: string;
  assessmentType: 'QUIZ' | 'MIDTERM' | 'FINAL' | 'ASSIGNMENT' | 'HOMEWORK';
  maxScore: number;
  durationMinutes: number;
  courseWeightPercentage: number;
  instructions?: string;
  questions: QuestionItem[];
}

// Assessment Builder & Management
export interface LateSubmissionPolicy {
  enabled: boolean;
  deadlineMinutesAfter: number; // e.g. 30 mins
  penaltyPercent: number; // e.g. 20%
}

export interface CLOMapping {
  cloId: string;
  weightPercent: number;
}

export interface Assessment {
  id: string;
  classId: string;
  className?: string;
  title: string;
  description: string;
  instructions: string;
  type: AssessmentType;
  category?: string; // Syllabus Assessment category mapping
  weight: number; // % in final grade
  status: AssessmentStatus;
  totalQuestions: number;
  maxScore: number;
  scoreScale: number; // 10 or 100
  timeLimitMinutes: number;
  startTime: string | null;
  endTime: string | null;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  allowBackNavigation: boolean;
  latePolicy?: LateSubmissionPolicy;
  cloMappings?: CLOMapping[];
  questionIds: string[];
  submissionMode?: 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'BOTH';
  allowedFileExtensions?: string[];
  maxFileSizeMB?: number;
  requireFullscreen?: boolean;
  enableProctoring?: boolean;
  maxViolationsAllowed?: number;
  createdAt: string;
  createdBy: string;
}

// Student Assessment Session
export interface StudentAnswer {
  questionId: string;
  selectedOptionId?: string; // for MCQ, TRUE_FALSE
  selectedOptionIds?: string[]; // for MULTI_CHOICE
  textAnswer?: string; // for FILL_BLANK
  essayContent?: string; // for Essay
  fileAttachment?: {
    name: string;
    size: number;
    url?: string;
    uploadedAt: string;
  };
  isFlagged?: boolean;
  lastSavedAt: string;
}

export interface SessionViolation {
  id: string;
  type: 'TAB_SWITCH' | 'FOCUS_LOST' | 'RESIZE' | 'FULLSCREEN_EXIT';
  timestamp: string;
  description: string;
}

export interface AssessmentSession {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  startTime: string;
  endTimeEstimated: string;
  submittedAt?: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';
  answers: Record<string, StudentAnswer>;
  violations: SessionViolation[];
  timeRemainingSeconds: number;
  isOfflineCached?: boolean;
}

// Grading & Rubrics
export interface RubricLevel {
  id: string;
  label: string;
  score: number;
  description: string;
}

export interface RubricCriteria {
  id: string;
  title: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  description: string;
  criteria: RubricCriteria[];
  createdAt: string;
}

export interface Submission {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  classId?: string;
  className?: string;
  subjectCode?: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  submittedAt: string;
  score: number | null;
  maxScore: number;
  gradingStatus: GradingStatus;
  isLate: boolean;
  violationCount: number;
  answers: {
    questionId: string;
    questionContent: string;
    questionType: QuestionType;
    studentAnswer: string;
    correctAnswer?: string;
    pointsAwarded?: number;
    maxPoints: number;
    feedback?: string;
    rubricScores?: Record<string, number>; // criteriaId -> score
  }[];
}

export interface GradeAppeal {
  id: string;
  submissionId: string;
  assessmentId: string;
  assessmentTitle: string;
  studentId: string;
  studentName: string;
  questionId?: string; // Optional (legacy/reference)
  questionContent?: string;
  currentScore: number;
  updatedScore?: number; // Score after teacher regrades
  maxPoints: number;
  reason: string;
  status: AppealStatus;
  teacherResponse?: string;
  createdAt: string;
  reviewedAt?: string;
}

// Class Management
export interface ClassMember {
  id: string;
  userId: string;
  fullName: string;
  studentCode?: string;
  email: string;
  role: 'STUDENT' | 'TEACHING_ASSISTANT';
  joinedAt: string;
  isBanned: boolean; // Banned from this class
  isGlobalBanned?: boolean; // Global ban across system (#12)
  isDeleted?: boolean; // Soft deleted (#14)
  deletedAt?: string;
  submissionCount?: number;
  averageScore?: number;
  cloProgress?: { cloCode: string; percent: number }[];
}

export interface ClassRoom {
  id: string;
  code: string;
  joinCode?: string; // Random enrollment code
  name: string;
  description: string;
  term: string;
  teacherId: string;
  teacherName: string;
  syllabusId: string;
  syllabusName?: string;
  memberCount: number;
  assessmentCount: number;
  isDeleted?: boolean; // Soft deleted (#10)
  deletedAt?: string;
  createdAt: string;
}

// Analytics & Audit
export interface QuestionDifficultyStat {
  questionId: string;
  content: string;
  difficulty: QuestionDifficulty;
  totalAttempts: number;
  correctRate: number; // 0 - 100%
  avgTimeSeconds: number;
  discriminationIndex: number; // -1 to 1
  recommendation: 'OK' | 'TOO_EASY' | 'TOO_HARD' | 'REVISE_OPTIONS';
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  recipientScope: 'ALL' | 'TEACHERS' | 'STUDENTS';
  sentBy: string;
  createdAt: string;
}

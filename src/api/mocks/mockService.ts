import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_CLASS_MEMBERS,
  INITIAL_SYLLABI,
  INITIAL_LESSONS,
  INITIAL_LEVELS,
  INITIAL_QUESTIONS,
  INITIAL_ASSESSMENTS,
  INITIAL_RUBRICS,
  INITIAL_SUBMISSIONS,
  INITIAL_APPEALS,
  INITIAL_QUESTION_STATS,
  INITIAL_NOTIFICATIONS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import {
  User,
  ClassRoom,
  ClassMember,
  Syllabus,
  Lesson,
  Question,
  QuestionLevel,
  Assessment,
  Rubric,
  RubricPreset,
  Submission,
  GradeAppeal,
  QuestionDifficultyStat,
  AuditLogItem,
  SystemNotification,
  AssessmentSession,
} from '../../interfaces/velica.interfaces';
import { ROLE, UserRole } from '../../constants/roleConstants';
import {
  ASSESSMENT_STATUS,
  GRADING_STATUS,
  APPEAL_STATUS,
} from '../../constants/assessmentConstants';
import { mockDelay } from './_mockDelay';

// In-memory data holders with localStorage persistence for rich previewing
function getStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`velica_mock_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, data: T) {
  try {
    localStorage.setItem(`velica_mock_${key}`, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

function mergeWithInitial<T extends { id: string }>(key: string, initialList: T[]): T[] {
  const stored = getStored<T[]>(key, initialList);
  const existingIds = new Set(stored.map((item) => item.id));
  const missing = initialList.filter((item) => !existingIds.has(item.id));
  if (missing.length > 0) {
    const updated = [...stored, ...missing];
    setStored(key, updated);
    return updated;
  }
  return stored;
}

let usersStore: User[] = (() => {
  const stored = getStored<User[]>('users', INITIAL_USERS);
  return INITIAL_USERS.map((initUser) => {
    const existing = stored.find((u) => u.id === initUser.id);
    return existing ? { ...initUser, ...existing } : initUser;
  });
})();
let classesStore: ClassRoom[] = getStored('classes', INITIAL_CLASSES);
let membersStore: ClassMember[] = getStored('members', INITIAL_CLASS_MEMBERS);
let syllabiStore: Syllabus[] = (() => {
  const stored = getStored<Syllabus[]>('syllabi', INITIAL_SYLLABI);
  return INITIAL_SYLLABI.map((initSyl) => {
    const existing = stored.find((s) => s.id === initSyl.id);
    return existing ? { ...existing, ...initSyl } : initSyl;
  });
})();
let lessonsStore: Lesson[] = (() => {
  const stored = getStored<Lesson[]>('lessons', INITIAL_LESSONS);
  const initialMap = new Map(INITIAL_LESSONS.map((l) => [l.id, l]));
  const mergedStored = stored.map((l) => {
    const init = initialMap.get(l.id);
    return init ? { ...init, ...l, cloIds: (l.cloIds && l.cloIds.length > 0) ? l.cloIds : init.cloIds, syllabusName: init.syllabusName || l.syllabusName } : l;
  });
  const storedIds = new Set(stored.map((l) => l.id));
  const missing = INITIAL_LESSONS.filter((l) => !storedIds.has(l.id));
  return [...mergedStored, ...missing];
})();
let levelsStore: QuestionLevel[] = getStored('levels', INITIAL_LEVELS);
let questionsStore: Question[] = mergeWithInitial('questions', INITIAL_QUESTIONS);
let assessmentsStore: Assessment[] = (() => {
  const list = mergeWithInitial('assessments', INITIAL_ASSESSMENTS);
  // Ensure asm-1 has all new questions
  const asm1 = list.find((a) => a.id === 'asm-1');
  const initAsm1 = INITIAL_ASSESSMENTS.find((a) => a.id === 'asm-1');
  if (asm1 && initAsm1 && asm1.questionIds.length < initAsm1.questionIds.length) {
    asm1.questionIds = [...initAsm1.questionIds];
    asm1.totalQuestions = initAsm1.totalQuestions;
    setStored('assessments', list);
  }
  return list;
})();
let rubricsStore: Rubric[] = mergeWithInitial('rubrics', INITIAL_RUBRICS);
let submissionsStore: Submission[] = (() => {
  const list = mergeWithInitial('submissions', INITIAL_SUBMISSIONS);
  return list.map((sub) => {
    const initSub = INITIAL_SUBMISSIONS.find((s) => s.id === sub.id);
    if (initSub && (!sub.classId || sub.answers.length < initSub.answers.length)) {
      return { ...initSub, ...sub, classId: initSub.classId, className: initSub.className, subjectCode: initSub.subjectCode, answers: initSub.answers };
    }
    return sub;
  });
})();
let appealsStore: GradeAppeal[] = (() => {
  const stored = getStored<GradeAppeal[]>('appeals', INITIAL_APPEALS);
  const storedMap = new Map((stored || []).map((a) => [a.id, a]));
  const merged = INITIAL_APPEALS.map((initA) => {
    const existing = storedMap.get(initA.id);
    return existing ? { ...initA, ...existing } : initA;
  });
  const initIds = new Set(INITIAL_APPEALS.map((a) => a.id));
  const extras = (stored || []).filter((a) => !initIds.has(a.id));
  return [...merged, ...extras];
})();
let notificationsStore: SystemNotification[] = getStored('notifications', INITIAL_NOTIFICATIONS);
let auditLogsStore: AuditLogItem[] = getStored('audit_logs', INITIAL_AUDIT_LOGS);
let maintenanceMode: boolean = getStored('maintenance', false);

// Active User Store
let currentRole: UserRole = getStored('active_role', ROLE.TEACHER);

export const toRubricPreset = (rubric: Rubric): RubricPreset => {
  const criteria = rubric.criteria || [];
  const totalMaxScore = criteria.reduce((sum, c) => sum + (Number(c.maxPoints) || 0), 0) || 10;

  return {
    id: rubric.id,
    title: rubric.title,
    description: rubric.description,
    courseSubjectId: (rubric as any).courseSubjectId || 'SE301',
    totalMaxScore: (rubric as any).totalMaxScore || totalMaxScore,
    criteria: criteria.map((c) => {
      const critPoints = Number(c.maxPoints) || 0;
      const weightPercent =
        (c as any).weightPercent ??
        (totalMaxScore > 0
          ? Math.round((critPoints / totalMaxScore) * 100)
          : Math.round(100 / (criteria.length || 1)));
      return {
        id: c.id,
        name: (c as any).name || c.title || 'Tiêu chí đánh giá',
        title: c.title,
        maxPoints: c.maxPoints,
        weightPercent,
        levels: (c.levels || []).map((lvl) => ({
          id: lvl.id,
          label: lvl.label,
          score: lvl.score,
          description: lvl.description,
        })),
      };
    }),
    createdAt: rubric.createdAt,
  };
};

export const mockService = {
  // Role & Session simulation
  getCurrentRole: (): UserRole => currentRole,
  setCurrentRole: (role: UserRole) => {
    currentRole = role;
    setStored('active_role', role);
  },
  getCurrentUser: (): User => {
    return usersStore.find((u) => u.role === currentRole) || usersStore[0];
  },

  // Maintenance
  isMaintenanceMode: () => maintenanceMode,
  setMaintenanceMode: async (enabled: boolean) => {
    await mockDelay();
    maintenanceMode = enabled;
    setStored('maintenance', enabled);
    return enabled;
  },

  // Users
  getUsers: async () => {
    await mockDelay();
    return [...usersStore];
  },
  getUserById: async (id: string) => {
    await mockDelay();
    return usersStore.find((u) => u.id === id) || null;
  },
  createUser: async (user: Omit<User, 'id' | 'createdAt'>) => {
    await mockDelay();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    usersStore.unshift(newUser);
    setStored('users', usersStore);
    return newUser;
  },
  updateUser: async (id: string, updates: Partial<User>) => {
    await mockDelay();
    usersStore = usersStore.map((u) => (u.id === id ? { ...u, ...updates } : u));
    setStored('users', usersStore);
    return usersStore.find((u) => u.id === id) || null;
  },
  deleteUser: async (id: string) => {
    await mockDelay();
    usersStore = usersStore.filter((u) => u.id !== id);
    setStored('users', usersStore);
    return true;
  },

  // Classes
  getClasses: async () => {
    await mockDelay();
    return [...classesStore];
  },
  getClassById: async (id: string) => {
    await mockDelay();
    return classesStore.find((c) => c.id === id) || null;
  },
  createClass: async (cls: Omit<ClassRoom, 'id' | 'createdAt' | 'memberCount' | 'assessmentCount'>) => {
    await mockDelay();
    const newClass: ClassRoom = {
      ...cls,
      id: `cls-${Date.now()}`,
      memberCount: 0,
      assessmentCount: 0,
      createdAt: new Date().toISOString(),
    };
    classesStore.unshift(newClass);
    setStored('classes', classesStore);
    return newClass;
  },
  updateClass: async (id: string, updates: Partial<ClassRoom>) => {
    await mockDelay();
    classesStore = classesStore.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setStored('classes', classesStore);
    return classesStore.find((c) => c.id === id) || null;
  },
  deleteClass: async (id: string, forceDelete: boolean = false) => {
    await mockDelay();
    const target = classesStore.find((c) => c.id === id);
    if (!target) return false;

    // Feature 10: Xóa mềm nếu có dữ liệu (sinh viên hoặc bài kiểm tra)
    if (!forceDelete && (target.memberCount > 0 || target.assessmentCount > 0)) {
      classesStore = classesStore.map((c) =>
        c.id === id ? { ...c, isDeleted: true, deletedAt: new Date().toISOString() } : c
      );
    } else {
      classesStore = classesStore.filter((c) => c.id !== id);
    }
    setStored('classes', classesStore);
    return true;
  },
  restoreClass: async (id: string) => {
    await mockDelay();
    classesStore = classesStore.map((c) =>
      c.id === id ? { ...c, isDeleted: false, deletedAt: undefined } : c
    );
    setStored('classes', classesStore);
    return true;
  },

  // Class Members
  getClassMembers: async (classId?: string, includeDeleted: boolean = true) => {
    await mockDelay();
    if (!includeDeleted) {
      return membersStore.filter((m) => !m.isDeleted);
    }
    return [...membersStore];
  },
  addClassMember: async (member: Omit<ClassMember, 'id' | 'joinedAt'>) => {
    await mockDelay();
    const newMember: ClassMember = {
      ...member,
      id: `mem-${Date.now()}`,
      joinedAt: new Date().toISOString().split('T')[0],
      isBanned: false,
      isGlobalBanned: false,
      isDeleted: false,
      submissionCount: 0,
    };
    membersStore.push(newMember);
    setStored('members', membersStore);
    return newMember;
  },
  // Feature 12: Ban Member (Class ban & Global ban)
  banClassMember: async (id: string, isBanned: boolean, isGlobalBanned: boolean = false) => {
    await mockDelay();
    membersStore = membersStore.map((m) =>
      m.id === id ? { ...m, isBanned, isGlobalBanned } : m
    );
    setStored('members', membersStore);
    return true;
  },
  // Feature 14: Delete Member (Xoá nếu chưa có thông tin, xoá mềm nếu có dữ liệu bài thi/điểm)
  removeClassMember: async (id: string, force: boolean = false) => {
    await mockDelay();
    const member = membersStore.find((m) => m.id === id);
    if (!member) return false;

    if (!force && ((member.submissionCount && member.submissionCount > 0) || member.averageScore !== undefined)) {
      // Soft delete
      membersStore = membersStore.map((m) =>
        m.id === id ? { ...m, isDeleted: true, deletedAt: new Date().toISOString().split('T')[0] } : m
      );
    } else {
      // Hard delete
      membersStore = membersStore.filter((m) => m.id !== id);
    }
    setStored('members', membersStore);
    return true;
  },
  restoreClassMember: async (id: string) => {
    await mockDelay();
    membersStore = membersStore.map((m) =>
      m.id === id ? { ...m, isDeleted: false, deletedAt: undefined } : m
    );
    setStored('members', membersStore);
    return true;
  },
  // Feature 15: View Member Statistics
  getMemberStudentStats: async (memberId: string) => {
    await mockDelay();
    const member = membersStore.find((m) => m.id === memberId) || membersStore[0];
    const memberSubmissions = submissionsStore.filter((s) => s.studentId === member.userId || s.studentName === member.fullName);
    return {
      member,
      submissions: memberSubmissions.length > 0 ? memberSubmissions : [
        {
          id: 'sub-sample-1',
          assessmentId: 'asm-1',
          assessmentTitle: 'Kiểm Tra Giữa Kỳ — Kiến Trúc Phần Mềm Hiện Đại',
          submittedAt: '2026-10-11T09:35:00Z',
          score: member.averageScore || 8.5,
          maxScore: 10,
          gradingStatus: 'GRADED' as const,
          violationCount: 0,
        },
        {
          id: 'sub-sample-2',
          assessmentId: 'asm-2',
          assessmentTitle: 'Mini Quiz 01 — Nguyên Lý SOLID Cốt Lõi',
          submittedAt: '2026-10-09T14:20:00Z',
          score: 9.0,
          maxScore: 10,
          gradingStatus: 'GRADED' as const,
          violationCount: 0,
        },
      ],
      cloBreakdown: member.cloProgress || [
        { cloCode: 'CLO1: Phân tích & Thiết kế Clean Architecture', percent: 92 },
        { cloCode: 'CLO2: Hiện thực Microservices phân tán', percent: 84 },
        { cloCode: 'CLO3: Đánh giá Trade-offs & Transactions', percent: 78 },
      ],
      teacherFeedback: 'Sinh viên có tư duy phân tích hệ thống rất tốt, bài thi giữa kỳ đạt chuẩn đầu ra xuất sắc.',
    };
  },

  // Syllabi
  getSyllabi: async () => {
    await mockDelay();
    return [...syllabiStore];
  },
  getSyllabusById: async (id: string) => {
    await mockDelay();
    return syllabiStore.find((s) => s.id === id) || null;
  },
  createSyllabus: async (data: Omit<Syllabus, 'id' | 'createdAt' | 'updatedAt' | 'lessonCount'>) => {
    await mockDelay();
    const newSyllabus: Syllabus = {
      ...data,
      id: `syl-${Date.now()}`,
      lessonCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    syllabiStore.unshift(newSyllabus);
    setStored('syllabi', syllabiStore);
    return newSyllabus;
  },
  updateSyllabus: async (id: string, data: Partial<Syllabus>) => {
    await mockDelay();
    syllabiStore = syllabiStore.map((s) => (s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s));
    setStored('syllabi', syllabiStore);
    return syllabiStore.find((s) => s.id === id) || null;
  },
  deleteSyllabus: async (id: string) => {
    await mockDelay();
    syllabiStore = syllabiStore.filter((s) => s.id !== id);
    setStored('syllabi', syllabiStore);
    return true;
  },

  // Lessons
  getLessons: async (syllabusId?: string) => {
    await mockDelay();
    if (syllabusId) {
      return lessonsStore.filter((l) => l.syllabusId === syllabusId);
    }
    return [...lessonsStore];
  },
  getLessonById: async (id: string) => {
    await mockDelay();
    return lessonsStore.find((l) => l.id === id) || null;
  },
  createLesson: async (lesson: Omit<Lesson, 'id' | 'createdAt' | 'questionCount'>) => {
    await mockDelay();
    const syl = syllabiStore.find((s) => s.id === lesson.syllabusId);
    const newLesson: Lesson = {
      ...lesson,
      id: `les-${Date.now()}`,
      syllabusName: syl ? syl.name : undefined,
      questionCount: 0,
      createdAt: new Date().toISOString(),
    };
    lessonsStore.push(newLesson);
    setStored('lessons', lessonsStore);
    return newLesson;
  },
  updateLesson: async (id: string, updates: Partial<Lesson>) => {
    await mockDelay();
    lessonsStore = lessonsStore.map((l) => (l.id === id ? { ...l, ...updates } : l));
    setStored('lessons', lessonsStore);
    return lessonsStore.find((l) => l.id === id) || null;
  },
  deleteLesson: async (id: string) => {
    await mockDelay();
    lessonsStore = lessonsStore.filter((l) => l.id !== id);
    setStored('lessons', lessonsStore);
    return true;
  },

  // Question Levels
  getQuestionLevels: async () => {
    await mockDelay();
    return [...levelsStore];
  },
  createQuestionLevel: async (level: Omit<QuestionLevel, 'id' | 'inUseCount'>) => {
    await mockDelay();
    const newLevel: QuestionLevel = {
      ...level,
      id: `lvl-${Date.now()}`,
      inUseCount: 0,
    };
    levelsStore.push(newLevel);
    setStored('levels', levelsStore);
    return newLevel;
  },
  updateQuestionLevel: async (id: string, updates: Partial<QuestionLevel>) => {
    await mockDelay();
    levelsStore = levelsStore.map((lvl) => (lvl.id === id ? { ...lvl, ...updates } : lvl));
    setStored('levels', levelsStore);
    return levelsStore.find((lvl) => lvl.id === id) || null;
  },
  deleteQuestionLevel: async (id: string) => {
    await mockDelay();
    const found = levelsStore.find((lvl) => lvl.id === id);
    if (found && found.inUseCount > 0) {
      throw new Error(`Mức độ câu hỏi "${found.name}" đang được sử dụng trong ${found.inUseCount} câu hỏi. Không thể xóa!`);
    }
    levelsStore = levelsStore.filter((lvl) => lvl.id !== id);
    setStored('levels', levelsStore);
    return true;
  },

  // Questions
  getQuestions: async (filter?: { type?: string; difficulty?: string; lessonId?: string }) => {
    await mockDelay();
    let result = [...questionsStore];
    if (filter?.type) {
      result = result.filter((q) => q.type === filter.type);
    }
    if (filter?.difficulty) {
      result = result.filter((q) => q.difficulty === filter.difficulty);
    }
    if (filter?.lessonId) {
      result = result.filter((q) => q.lessonId === filter.lessonId);
    }
    return result;
  },
  getQuestionById: async (id: string) => {
    await mockDelay();
    return questionsStore.find((q) => q.id === id) || null;
  },
  createQuestion: async (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
    await mockDelay();
    const newQ: Question = {
      ...question,
      id: `q-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questionsStore.unshift(newQ);
    setStored('questions', questionsStore);
    return newQ;
  },
  updateQuestion: async (id: string, updates: Partial<Question>) => {
    await mockDelay();
    questionsStore = questionsStore.map((q) => (q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q));
    setStored('questions', questionsStore);
    return questionsStore.find((q) => q.id === id) || null;
  },
  deleteQuestion: async (id: string) => {
    await mockDelay();
    questionsStore = questionsStore.filter((q) => q.id !== id);
    setStored('questions', questionsStore);
    return true;
  },

  // Assessments
  getAssessments: async (classId?: string) => {
    await mockDelay();
    if (classId) {
      return assessmentsStore.filter((a) => a.classId === classId);
    }
    return [...assessmentsStore];
  },
  getAssessmentById: async (id: string) => {
    await mockDelay();
    return assessmentsStore.find((a) => a.id === id) || null;
  },
  createAssessment: async (assessment: Omit<Assessment, 'id' | 'createdAt'>) => {
    await mockDelay();
    const newAsm: Assessment = {
      ...assessment,
      id: `asm-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    assessmentsStore.unshift(newAsm);
    setStored('assessments', assessmentsStore);
    return newAsm;
  },
  updateAssessment: async (id: string, updates: Partial<Assessment>) => {
    await mockDelay();
    assessmentsStore = assessmentsStore.map((a) => (a.id === id ? { ...a, ...updates } : a));
    setStored('assessments', assessmentsStore);
    return assessmentsStore.find((a) => a.id === id) || null;
  },
  publishAssessment: async (id: string) => {
    await mockDelay();
    assessmentsStore = assessmentsStore.map((a) =>
      a.id === id ? { ...a, status: ASSESSMENT_STATUS.PUBLISHED } : a
    );
    setStored('assessments', assessmentsStore);
    // Add audit log
    const asm = assessmentsStore.find((a) => a.id === id);
    mockService.addAuditLog({
      action: 'PUBLISH_ASSESSMENT',
      entityType: 'ASSESSMENT',
      entityId: id,
      details: `Xuất bản đề thi "${asm?.title || id}". Cấu trúc đề thi đã được khóa bảo vệ.`,
    });
    return assessmentsStore.find((a) => a.id === id) || null;
  },
  deleteAssessment: async (id: string) => {
    await mockDelay();
    assessmentsStore = assessmentsStore.filter((a) => a.id !== id);
    setStored('assessments', assessmentsStore);
    return true;
  },

  // Writing Rubrics
  getRubrics: async () => {
    await mockDelay();
    return [...rubricsStore];
  },
  getRubricPresets: async (subjectId?: string): Promise<RubricPreset[]> => {
    await mockDelay();
    const presets = rubricsStore.map(toRubricPreset);
    if (subjectId) {
      return presets.filter((p) => !p.courseSubjectId || p.courseSubjectId === subjectId);
    }
    return presets;
  },
  getRubricById: async (id: string) => {
    await mockDelay();
    return rubricsStore.find((r) => r.id === id) || null;
  },
  createRubric: async (rubric: Omit<Rubric, 'id' | 'createdAt'>) => {
    await mockDelay();
    const newRubric: Rubric = {
      ...rubric,
      id: `rubric-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    rubricsStore.push(newRubric);
    setStored('rubrics', rubricsStore);
    return newRubric;
  },
  updateRubric: async (id: string, updates: Partial<Rubric>) => {
    await mockDelay();
    rubricsStore = rubricsStore.map((r) => (r.id === id ? { ...r, ...updates } : r));
    setStored('rubrics', rubricsStore);
    return rubricsStore.find((r) => r.id === id) || null;
  },
  deleteRubric: async (id: string) => {
    await mockDelay();
    rubricsStore = rubricsStore.filter((r) => r.id !== id);
    setStored('rubrics', rubricsStore);
    return true;
  },

  // Submissions & Grading
  getSubmissions: async (assessmentId?: string) => {
    await mockDelay();
    if (assessmentId) {
      return submissionsStore.filter((s) => s.assessmentId === assessmentId);
    }
    return [...submissionsStore];
  },
  getSubmissionById: async (id: string) => {
    await mockDelay();
    return submissionsStore.find((s) => s.id === id) || null;
  },
  createSubmission: async (submission: Omit<Submission, 'id' | 'submittedAt'>) => {
    await mockDelay();
    const newSub: Submission = {
      ...submission,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    const existingIndex = submissionsStore.findIndex(
      (s) => s.assessmentId === newSub.assessmentId && s.studentId === newSub.studentId
    );
    if (existingIndex >= 0) {
      submissionsStore[existingIndex] = newSub;
    } else {
      submissionsStore.unshift(newSub);
    }
    setStored('submissions', submissionsStore);
    return newSub;
  },
  gradeSubmission: async (
    submissionId: string,
    grades: {
      questionId: string;
      pointsAwarded: number;
      feedback: string;
      rubricScores?: Record<string, number>;
    }[]
  ) => {
    await mockDelay();
    const sub = submissionsStore.find((s) => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');

    let totalScore = 0;
    sub.answers = sub.answers.map((ans) => {
      const match = grades.find((g) => g.questionId === ans.questionId);
      if (match) {
        const awarded = match.pointsAwarded;
        totalScore += awarded;
        return {
          ...ans,
          pointsAwarded: awarded,
          feedback: match.feedback,
          rubricScores: match.rubricScores,
        };
      }
      totalScore += ans.pointsAwarded || 0;
      return ans;
    });

    sub.score = Number(totalScore.toFixed(2));
    sub.gradingStatus = GRADING_STATUS.GRADED;
    setStored('submissions', submissionsStore);

    mockService.addAuditLog({
      action: 'GRADE_SUBMISSION',
      entityType: 'SUBMISSION',
      entityId: submissionId,
      details: `Giáo viên hoàn tất chấm điểm bài nộp của ${sub.studentName}: ${sub.score}/${sub.maxScore} điểm.`,
    });

    return { ...sub };
  },
  overrideGrade: async (submissionId: string, newScore: number, reason: string) => {
    await mockDelay();
    const sub = submissionsStore.find((s) => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');
    const oldScore = sub.score;
    sub.score = newScore;
    setStored('submissions', submissionsStore);

    mockService.addAuditLog({
      action: 'OVERRIDE_GRADE',
      entityType: 'SUBMISSION',
      entityId: submissionId,
      details: `Điều chỉnh điểm sinh viên ${sub.studentName} từ ${oldScore} thành ${newScore}. Lý do: ${reason}`,
    });

    return { ...sub };
  },

  // Grade Appeals
  getAppeals: async (assessmentId?: string) => {
    await mockDelay();
    if (assessmentId && assessmentId !== 'all') {
      return appealsStore.filter((a) => a.assessmentId === assessmentId);
    }
    return [...appealsStore];
  },
  getAppealBySubmissionId: async (submissionId: string) => {
    await mockDelay();
    return appealsStore.find((a) => a.submissionId === submissionId) || null;
  },
  getAppealById: async (id: string) => {
    await mockDelay();
    return appealsStore.find((a) => a.id === id) || null;
  },
  createAppeal: async (appeal: Omit<GradeAppeal, 'id' | 'createdAt' | 'status'>) => {
    await mockDelay();
    const newAppeal: GradeAppeal = {
      ...appeal,
      id: `app-${Date.now()}`,
      status: APPEAL_STATUS.PENDING,
      createdAt: new Date().toISOString(),
    };
    appealsStore.unshift(newAppeal);
    setStored('appeals', appealsStore);
    return newAppeal;
  },
  respondAppeal: async (id: string, status: typeof APPEAL_STATUS.APPROVED | typeof APPEAL_STATUS.REJECTED, response: string, newScore?: number) => {
    await mockDelay();
    const appeal = appealsStore.find((a) => a.id === id);
    if (!appeal) throw new Error('Appeal not found');
    appeal.status = status;
    appeal.teacherResponse = response;
    appeal.reviewedAt = new Date().toISOString();
    if (newScore !== undefined) {
      appeal.updatedScore = newScore;
      await mockService.overrideGrade(appeal.submissionId, newScore, `Chấm phúc khảo: ${response || 'Cập nhật điểm mới'}`);
    }
    setStored('appeals', appealsStore);

    return appeal;
  },

  // Question Analytics
  getQuestionStats: async () => {
    await mockDelay();
    return [...INITIAL_QUESTION_STATS];
  },

  // Notifications
  getNotifications: async () => {
    await mockDelay();
    return [...notificationsStore];
  },
  createNotification: async (notif: Omit<SystemNotification, 'id' | 'createdAt'>) => {
    await mockDelay();
    const newNotif: SystemNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    notificationsStore.unshift(newNotif);
    setStored('notifications', notificationsStore);
    return newNotif;
  },

  // Audit Logs
  getAuditLogs: async () => {
    await mockDelay();
    return [...auditLogsStore];
  },
  addAuditLog: (entry: { action: string; entityType: string; entityId: string; details: string }) => {
    const user = mockService.getCurrentUser();
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}`,
      userId: user.id,
      userName: user.fullName,
      userRole: user.role,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      ipAddress: '192.168.1.100',
      timestamp: new Date().toISOString(),
    };
    auditLogsStore.unshift(newLog);
    setStored('audit_logs', auditLogsStore);
  },

  // Reset to original data
  resetAllData: () => {
    localStorage.removeItem('velica_mock_users');
    localStorage.removeItem('velica_mock_classes');
    localStorage.removeItem('velica_mock_members');
    localStorage.removeItem('velica_mock_syllabi');
    localStorage.removeItem('velica_mock_lessons');
    localStorage.removeItem('velica_mock_levels');
    localStorage.removeItem('velica_mock_questions');
    localStorage.removeItem('velica_mock_assessments');
    localStorage.removeItem('velica_mock_rubrics');
    localStorage.removeItem('velica_mock_submissions');
    localStorage.removeItem('velica_mock_appeals');
    localStorage.removeItem('velica_mock_notifications');
    localStorage.removeItem('velica_mock_audit_logs');
    localStorage.removeItem('velica_mock_maintenance');

    usersStore = [...INITIAL_USERS];
    classesStore = [...INITIAL_CLASSES];
    membersStore = [...INITIAL_CLASS_MEMBERS];
    syllabiStore = [...INITIAL_SYLLABI];
    lessonsStore = [...INITIAL_LESSONS];
    levelsStore = [...INITIAL_LEVELS];
    questionsStore = [...INITIAL_QUESTIONS];
    assessmentsStore = [...INITIAL_ASSESSMENTS];
    rubricsStore = [...INITIAL_RUBRICS];
    submissionsStore = [...INITIAL_SUBMISSIONS];
    appealsStore = [...INITIAL_APPEALS];
    notificationsStore = [...INITIAL_NOTIFICATIONS];
    auditLogsStore = [...INITIAL_AUDIT_LOGS];
    maintenanceMode = false;
  },
};

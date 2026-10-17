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
  INITIAL_GRADE_AUDITS,
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
  GradeAuditLog,
  GradeModificationType,
} from '../../interfaces/velica.interfaces';
import { ROLE, UserRole } from '../../constants/roleConstants';
import {
  ASSESSMENT_STATUS,
  GRADING_STATUS,
  APPEAL_STATUS,
  QUESTION_TYPE,
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
  const storedMap = new Map(stored.map((u) => [u.id, u]));
  const merged = INITIAL_USERS.map((initUser) => {
    const existing = storedMap.get(initUser.id);
    return existing
      ? {
          ...initUser,
          ...existing,
          approvalStatus: existing.approvalStatus || initUser.approvalStatus || 'APPROVED',
          isEmailVerified: existing.isEmailVerified ?? initUser.isEmailVerified ?? true,
        }
      : initUser;
  });
  const initialIds = new Set(INITIAL_USERS.map((u) => u.id));
  const createdDynamically = stored.filter((u) => !initialIds.has(u.id));
  return [...merged, ...createdDynamically];
})();
let classesStore: ClassRoom[] = (() => {
  const list = getStored<ClassRoom[]>('classes', INITIAL_CLASSES);
  return list.map((c) => ({
    ...c,
    name: c.name.replace(/\s*\([^)]*Học Kỳ[^)]*\)/gi, '').trim(),
  }));
})();
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
  const cleaned = list.map((a) => ({
    ...a,
    className: a.className ? a.className.replace(/\s*\([^)]*Học Kỳ[^)]*\)/gi, '').trim() : a.className,
  }));
  // Ensure asm-1 has all new questions
  const asm1 = cleaned.find((a) => a.id === 'asm-1');
  const initAsm1 = INITIAL_ASSESSMENTS.find((a) => a.id === 'asm-1');
  if (asm1 && initAsm1 && asm1.questionIds.length < initAsm1.questionIds.length) {
    asm1.questionIds = [...initAsm1.questionIds];
    asm1.totalQuestions = initAsm1.totalQuestions;
    setStored('assessments', cleaned);
  }
  return cleaned;
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
let gradeAuditsStore: GradeAuditLog[] = (() => {
  const stored = getStored<GradeAuditLog[]>('grade_audits', INITIAL_GRADE_AUDITS);
  const storedMap = new Map((stored || []).map((a) => [a.id, a]));
  const merged = INITIAL_GRADE_AUDITS.map((initA) => {
    const existing = storedMap.get(initA.id);
    return existing ? { ...initA, ...existing } : initA;
  });
  const initIds = new Set(INITIAL_GRADE_AUDITS.map((a) => a.id));
  const extras = (stored || []).filter((a) => !initIds.has(a.id));
  return [...merged, ...extras];
})();
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
    courseSubjectId: rubric.courseSubjectId || 'SE301',
    totalMaxScore: rubric.totalMaxScore || totalMaxScore,
    criteria: criteria.map((c) => {
      const critPoints = Number(c.maxPoints) || 0;
      const weightPercent =
        c.weightPercent ??
        (totalMaxScore > 0
          ? Math.round((critPoints / totalMaxScore) * 100)
          : Math.round(100 / (criteria.length || 1)));
      return {
        id: c.id,
        name: c.name || c.title || 'Tiêu chí đánh giá',
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

interface PendingOtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  isLocked: boolean;
  token?: string;
  type: 'PASSWORD_RESET' | 'STUDENT_REGISTER' | 'PROFILE_SECURITY';
}

const otpStore = new Map<string, PendingOtpRecord>();

export const mockService = {
  // Authentication & Session Simulation
  login: async ({ usernameOrEmail, password }: { usernameOrEmail: string; password?: string }) => {
    await mockDelay();
    const id = usernameOrEmail.trim().toLowerCase();
    const user = usersStore.find(
      (u) => u.email.trim().toLowerCase() === id || u.username.trim().toLowerCase() === id
    );
    if (!user) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác.');
    }

    const expectedPassword = user.password || 'password123';
    if (password && password !== expectedPassword) {
      throw new Error('Tài khoản hoặc mật khẩu không chính xác.');
    }

    if (user.approvalStatus === 'PENDING') {
      return { status: 'PENDING' as const, user };
    }
    if (user.approvalStatus === 'REJECTED') {
      return { status: 'REJECTED' as const, user, reason: user.rejectionReason };
    }
    if (user.approvalStatus === 'SUSPENDED') {
      return { status: 'SUSPENDED' as const, user, reason: user.rejectionReason };
    }

    mockService.setCurrentRole(user.role);
    return { status: 'SUCCESS' as const, user, role: user.role };
  },

  // Password Reset Flow (Secure Server-side OTP & Token Validation)
  requestPasswordReset: async (email: string) => {
    await mockDelay();
    const normalized = email.trim().toLowerCase();
    const user = usersStore.find((u) => u.email.trim().toLowerCase() === normalized);
    if (!user) {
      throw new Error(`Email "${email}" chưa được đăng ký trong hệ thống Velica!`);
    }
    if (user.approvalStatus === 'REJECTED') {
      throw new Error('Tài khoản liên kết với email này đã bị từ chối duyệt. Không thể đặt lại mật khẩu.');
    }
    if (user.approvalStatus === 'SUSPENDED') {
      throw new Error('Tài khoản liên kết với email này đang bị tạm khóa. Vui lòng liên hệ Quản trị viên.');
    }

    const now = Date.now();
    const existing = otpStore.get(`reset_${normalized}`);
    if (existing && !existing.isLocked && existing.expiresAt - now > 240000) {
      const waitSecs = Math.ceil((existing.expiresAt - 240000 - now) / 1000);
      if (waitSecs > 0) {
        throw new Error(`Vui lòng chờ thêm ${waitSecs} giây trước khi yêu cầu mã mới.`);
      }
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const generatedToken = `tok_${now}_${Math.random().toString(36).substring(2, 11)}`;

    otpStore.set(`reset_${normalized}`, {
      code: newCode,
      expiresAt: now + 5 * 60 * 1000,
      attempts: 0,
      isLocked: false,
      token: generatedToken,
      type: 'PASSWORD_RESET',
    });

    mockService.addAuditLog({
      action: 'REQUEST_PASSWORD_RESET',
      entityType: 'USER',
      entityId: user.id,
      details: `Yêu cầu đặt lại mật khẩu cho tài khoản ${user.email} (Mã xác thực 5 phút).`,
    });

    return {
      success: true,
      email: normalized,
      expiresIn: 300,
      token: generatedToken,
      otpCode: newCode,
    };
  },

  verifyPasswordResetOtp: async (email: string, otp: string) => {
    await mockDelay();
    const normalized = email.trim().toLowerCase();
    const record = otpStore.get(`reset_${normalized}`);
    if (!record) {
      throw new Error('Yêu cầu đặt lại mật khẩu không tồn tại hoặc đã hết hạn.');
    }
    if (record.isLocked) {
      throw new Error('Mã xác thực đã bị khóa do nhập sai quá 5 lần. Vui lòng gửi lại yêu cầu.');
    }
    if (Date.now() > record.expiresAt) {
      throw new Error('Mã xác thực đã hết hạn hiệu lực (5 phút). Vui lòng gửi lại yêu cầu.');
    }

    const cleanOtp = otp.trim();
    if (cleanOtp !== record.code) {
      record.attempts += 1;
      if (record.attempts >= 5) {
        record.isLocked = true;
        throw new Error('Đã nhập sai 5 lần liên tiếp. Mã xác thực đã bị vô hiệu hóa.');
      }
      const remaining = 5 - record.attempts;
      throw new Error(`Mã không chính xác. Bạn còn ${remaining} lần thử trước khi mã bị khóa.`);
    }

    return {
      success: true,
      resetToken: record.token,
    };
  },

  resetPasswordWithToken: async (email: string, token: string, newPassword: string) => {
    await mockDelay();
    const normalized = email.trim().toLowerCase();
    const record = otpStore.get(`reset_${normalized}`);
    if (!record || record.token !== token) {
      throw new Error('Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
    }
    if (Date.now() > record.expiresAt) {
      throw new Error('Phiên đặt lại mật khẩu đã hết thời hạn hiệu lực.');
    }

    const userIndex = usersStore.findIndex((u) => u.email.trim().toLowerCase() === normalized);
    if (userIndex === -1) {
      throw new Error('Không tìm thấy tài khoản người dùng.');
    }

    usersStore[userIndex] = {
      ...usersStore[userIndex],
      password: newPassword,
    };
    setStored('users', usersStore);
    otpStore.delete(`reset_${normalized}`);

    mockService.addAuditLog({
      action: 'RESET_PASSWORD_SUCCESS',
      entityType: 'USER',
      entityId: usersStore[userIndex].id,
      details: `Đặt lại mật khẩu thành công qua email xác minh: ${normalized}`,
    });

    return { success: true };
  },

  // Student Registration OTP
  sendRegistrationOtp: async (email: string) => {
    await mockDelay();
    const normalized = email.trim().toLowerCase();
    if (mockService.checkEmailExists(normalized)) {
      throw new Error(`Email "${email}" đã tồn tại trên hệ thống! Vui lòng chọn "Quên mật khẩu" nếu bạn đã có tài khoản.`);
    }
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(`reg_${normalized}`, {
      code: newCode,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
      isLocked: false,
      type: 'STUDENT_REGISTER',
    });
    return { success: true, email: normalized, otpCode: newCode };
  },

  verifyRegistrationOtp: async (email: string, otp: string) => {
    await mockDelay();
    const normalized = email.trim().toLowerCase();
    const record = otpStore.get(`reg_${normalized}`);
    if (!record) {
      throw new Error('Yêu cầu xác minh không tồn tại hoặc đã hết hạn.');
    }
    if (record.isLocked || record.attempts >= 5) {
      throw new Error('Mã xác minh đã bị khóa do nhập sai nhiều lần.');
    }
    if (Date.now() > record.expiresAt) {
      throw new Error('Mã xác minh đã hết hạn. Vui lòng bấm gửi lại.');
    }
    if (record.code !== otp.trim()) {
      record.attempts += 1;
      throw new Error('Mã xác minh không chính xác. Vui lòng kiểm tra lại hộp thư.');
    }
    otpStore.delete(`reg_${normalized}`);
    return { success: true };
  },

  // Profile Security OTP & Password Change
  sendProfileSecurityOtp: async (userId: string) => {
    await mockDelay();
    const user = usersStore.find((u) => u.id === userId);
    if (!user) throw new Error('Không tìm thấy người dùng');
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(`sec_${user.id}`, {
      code: newCode,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
      isLocked: false,
      type: 'PROFILE_SECURITY',
    });
    return { success: true, email: user.email, otpCode: newCode };
  },

  changePassword: async (userId: string, currentPassword: string, newPassword: string, otp: string) => {
    await mockDelay();
    const userIndex = usersStore.findIndex((u) => u.id === userId);
    if (userIndex === -1) throw new Error('Không tìm thấy người dùng.');

    const user = usersStore[userIndex];
    const expected = user.password || 'password123';
    if (currentPassword !== expected) {
      throw new Error('Mật khẩu hiện tại không chính xác!');
    }

    if (currentPassword === newPassword) {
      throw new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
    }

    const record = otpStore.get(`sec_${userId}`);
    if (!record || Date.now() > record.expiresAt) {
      throw new Error('Mã OTP xác thực đã hết hạn hoặc chưa được gửi. Vui lòng bấm "Gửi mã OTP".');
    }
    if (record.code !== otp.trim()) {
      throw new Error('Mã OTP xác thực không chính xác!');
    }

    usersStore[userIndex] = { ...user, password: newPassword };
    setStored('users', usersStore);
    otpStore.delete(`sec_${userId}`);

    mockService.addAuditLog({
      action: 'CHANGE_PASSWORD',
      entityType: 'USER',
      entityId: user.id,
      details: `Đổi mật khẩu tài khoản thành công qua OTP bảo mật email: ${user.email}`,
    });

    return { success: true };
  },

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
  checkEmailExists: (email: string, excludeUserId?: string): boolean => {
    const normalized = email.trim().toLowerCase();
    return usersStore.some(
      (u) => u.email.trim().toLowerCase() === normalized && u.id !== excludeUserId
    );
  },
  approveUser: async (id: string) => {
    await mockDelay();
    usersStore = usersStore.map((u) =>
      u.id === id ? { ...u, approvalStatus: 'APPROVED', isActive: true, rejectionReason: undefined } : u
    );
    setStored('users', usersStore);
    return usersStore.find((u) => u.id === id) || null;
  },
  rejectUser: async (id: string, reason: string) => {
    await mockDelay();
    usersStore = usersStore.map((u) =>
      u.id === id ? { ...u, approvalStatus: 'REJECTED', rejectionReason: reason, isActive: false } : u
    );
    setStored('users', usersStore);
    return usersStore.find((u) => u.id === id) || null;
  },
  suspendUser: async (id: string, reason: string) => {
    await mockDelay();
    usersStore = usersStore.map((u) =>
      u.id === id ? { ...u, approvalStatus: 'SUSPENDED', rejectionReason: reason, isActive: false } : u
    );
    setStored('users', usersStore);
    return usersStore.find((u) => u.id === id) || null;
  },
  registerStudent: async (data: {
    fullName: string;
    email: string;
    password?: string;
  }) => {
    await mockDelay();
    const newUser: User = {
      id: `user-student-${Date.now()}`,
      username: data.email.split('@')[0],
      fullName: data.fullName,
      email: data.email,
      role: ROLE.STUDENT,
      approvalStatus: 'PENDING',
      isEmailVerified: true,
      isActive: true,
      status: 'Chờ duyệt',
      createdAt: new Date().toISOString(),
    };
    usersStore.unshift(newUser);
    setStored('users', usersStore);
    return newUser;
  },
  createTeacher: async (data: {
    fullName: string;
    email: string;
    department?: string;
    academicTitle?: string;
    phoneNumber?: string;
  }) => {
    await mockDelay();
    const newTeacher: User = {
      id: `user-teacher-${Date.now()}`,
      username: data.email.split('@')[0],
      fullName: data.fullName,
      email: data.email,
      role: ROLE.TEACHER,
      department: data.department || 'Khoa Công Nghệ Phần Mềm',
      academicTitle: data.academicTitle || 'Giảng viên',
      phoneNumber: data.phoneNumber,
      approvalStatus: 'APPROVED',
      isEmailVerified: true,
      isActive: true,
      status: 'Đang công tác',
      createdAt: new Date().toISOString(),
    };
    usersStore.unshift(newTeacher);
    setStored('users', usersStore);
    return newTeacher;
  },
  createUser: async (user: Omit<User, 'id' | 'createdAt'>) => {
    await mockDelay();
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      approvalStatus: user.approvalStatus || 'APPROVED',
      isEmailVerified: user.isEmailVerified ?? true,
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

  // Secure Exam Questions for Taking (Sanitizes & strips isCorrect/rubrics to prevent FE cheating)
  getQuestionsForExam: async (assessmentId: string): Promise<Question[]> => {
    await mockDelay();
    const asm = assessmentsStore.find((a) => a.id === assessmentId) || assessmentsStore[0];
    const matched =
      asm?.questionIds && asm.questionIds.length > 0
        ? questionsStore.filter((q) => asm.questionIds?.includes(q.id))
        : questionsStore;

    return matched.map((q) => ({
      ...q,
      // Strip isCorrect from options!
      options: q.options?.map((opt) => ({
        id: opt.id,
        text: opt.text,
      })),
      rubricId: undefined,
      gradingConfig: undefined,
      explanation: undefined,
    })) as Question[];
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

  // Tamper-Proof Exam Submission (Scores and Answer Comparisons are handled on the server/mock layer)
  submitExam: async ({
    assessmentId,
    studentId,
    studentName,
    answers,
    violationCount = 0,
    isLate = false,
  }: {
    assessmentId: string;
    studentId: string;
    studentName: string;
    answers: Record<string, string>;
    violationCount?: number;
    isLate?: boolean;
  }) => {
    await mockDelay();
    const asm = assessmentsStore.find((a) => a.id === assessmentId) || assessmentsStore[0];
    const questions =
      asm?.questionIds && asm.questionIds.length > 0
        ? questionsStore.filter((q) => asm.questionIds?.includes(q.id))
        : questionsStore;

    let totalScore = 0;
    let hasEssay = false;

    // Secure comparison on original questions store (tamper-proof!)
    const answerBreakdown = questions.map((originalQ) => {
      const studentAns = answers[originalQ.id] || '';
      const qPoints = originalQ.points || 1;
      let isCorrect = false;
      let pointsAwarded = 0;

      if (originalQ.type === QUESTION_TYPE.MCQ) {
        const correctOpt = originalQ.options?.find((o) => o.isCorrect);
        isCorrect = Boolean(correctOpt && correctOpt.id === studentAns);
        pointsAwarded = isCorrect ? qPoints : 0;
      } else if (originalQ.type === QUESTION_TYPE.TRUE_FALSE) {
        const correctOpt = originalQ.options?.find((o) => o.isCorrect);
        isCorrect = correctOpt ? correctOpt.id === studentAns : studentAns === 'opt-tf-true';
        pointsAwarded = isCorrect ? qPoints : 0;
      } else if (originalQ.type === QUESTION_TYPE.MULTI_CHOICE) {
        let selected: string[] = [];
        try {
          const parsed = JSON.parse(studentAns);
          selected = Array.isArray(parsed) ? parsed : [];
        } catch {
          selected = studentAns.split(',').filter(Boolean);
        }
        const correctOptions = originalQ.options?.filter((o) => o.isCorrect) || [];
        const correctCount = correctOptions.length || 1;
        const correctSelected = selected.filter((sId) => correctOptions.some((co) => co.id === sId)).length;
        const wrongSelected = selected.length - correctSelected;
        const netCorrect = Math.max(0, correctSelected - wrongSelected);
        pointsAwarded = Number(((netCorrect / correctCount) * qPoints).toFixed(1));
        if (pointsAwarded > qPoints) pointsAwarded = qPoints;
        isCorrect = pointsAwarded === qPoints;
      } else if (originalQ.type === QUESTION_TYPE.FILL_BLANK) {
        isCorrect = studentAns.trim().length > 0;
        pointsAwarded = isCorrect ? qPoints : 0;
      } else if (originalQ.type === QUESTION_TYPE.ESSAY) {
        hasEssay = true;
        // Base placeholder awarded points for initial submission prior to teacher review
        pointsAwarded = studentAns.trim().length > 20 ? 3.5 : 2.0;
      }

      totalScore += pointsAwarded;

      return {
        questionId: originalQ.id,
        questionContent: originalQ.content,
        questionType: originalQ.type,
        studentAnswer: studentAns,
        pointsAwarded,
        maxPoints: qPoints,
        feedback:
          originalQ.type === QUESTION_TYPE.ESSAY
            ? 'Bài giải đã được đồng bộ vào hàng đợi chấm của Giảng viên.'
            : undefined,
      };
    });

    const maxScore = questions.reduce((acc, q) => acc + (q.points || 1), 0);
    let finalNormalizedScore = Number(((totalScore / (maxScore || 10)) * 10).toFixed(1));

    if (isLate && asm?.latePolicy?.penaltyPercent) {
      const penalty = asm.latePolicy.penaltyPercent;
      finalNormalizedScore = Number((finalNormalizedScore * (1 - penalty / 100)).toFixed(1));
    }

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      assessmentId,
      assessmentTitle: asm?.title || 'Bài thi khảo thí',
      studentId,
      studentName,
      score: finalNormalizedScore,
      maxScore: 10,
      gradingStatus: hasEssay ? GRADING_STATUS.IN_PROGRESS : GRADING_STATUS.GRADED,
      isLate,
      violationCount,
      answers: answerBreakdown,
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

    mockService.addAuditLog({
      action: 'SUBMIT_EXAM',
      entityType: 'SUBMISSION',
      entityId: newSub.id,
      details: `Sinh viên ${studentName} nộp bài thi ${asm?.title}. Điểm hệ thống: ${newSub.score}/10. Vi phạm: ${violationCount}. Trạng thái: ${newSub.gradingStatus}`,
    });

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
  overrideGrade: async (
    submissionId: string,
    newScore: number,
    reason: string,
    type: GradeModificationType = 'MANUAL',
    appealId?: string
  ) => {
    await mockDelay();
    const sub = submissionsStore.find((s) => s.id === submissionId);
    if (!sub) throw new Error('Submission not found');
    const oldScore = sub.score;
    sub.originalScore = sub.originalScore !== undefined ? sub.originalScore : oldScore;
    sub.score = newScore;
    sub.isOverridden = true;
    sub.overrideType = type;
    sub.overrideReason = reason;
    if (appealId) {
      sub.appealId = appealId;
    }
    const currentUser = mockService.getCurrentUser();
    sub.overriddenBy = currentUser.fullName;
    sub.overriddenAt = new Date().toISOString();
    setStored('submissions', submissionsStore);

    const typeLabel = type === 'APPEAL' ? 'Phúc khảo' : 'Sửa trực tiếp';
    mockService.addAuditLog({
      action: 'OVERRIDE_GRADE',
      entityType: 'SUBMISSION',
      entityId: submissionId,
      details: `[${typeLabel}] Điều chỉnh điểm sinh viên ${sub.studentName} từ ${oldScore ?? '—'} thành ${newScore}. Lý do: ${reason}`,
    });

    const newGradeAudit: GradeAuditLog = {
      id: `ga-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: type,
      appealId: appealId,
      classId: sub.classId,
      className: sub.className,
      assessmentId: sub.assessmentId,
      assessmentTitle: sub.assessmentTitle,
      submissionId: sub.id,
      studentId: sub.studentId,
      studentName: sub.studentName,
      componentName: sub.assessmentTitle || 'Bài kiểm tra',
      oldScore: oldScore,
      newScore: newScore,
      changedBy: currentUser.fullName,
      changedByRole: currentUser.role,
      reason: reason,
      timestamp: new Date().toISOString(),
    };
    gradeAuditsStore.unshift(newGradeAudit);
    setStored('grade_audits', gradeAuditsStore);

    return { ...sub };
  },

  // Grade Audit Logs Querying & Recording (Unified Direct Overrides & Appeals)
  getGradeAuditLogs: async (filter?: {
    type?: GradeModificationType;
    classId?: string;
    studentId?: string;
    submissionId?: string;
    assessmentId?: string;
    appealId?: string;
    changedBy?: string;
    search?: string;
  }) => {
    await mockDelay();
    let logs = [...gradeAuditsStore];
    if (filter) {
      if (filter.type) {
        logs = logs.filter((l) => l.type === filter.type);
      }
      if (filter.classId && filter.classId !== 'all') {
        logs = logs.filter((l) => l.classId === filter.classId);
      }
      if (filter.studentId) {
        logs = logs.filter((l) => l.studentId === filter.studentId);
      }
      if (filter.submissionId) {
        logs = logs.filter((l) => l.submissionId === filter.submissionId);
      }
      if (filter.assessmentId && filter.assessmentId !== 'all') {
        logs = logs.filter((l) => l.assessmentId === filter.assessmentId);
      }
      if (filter.appealId) {
        logs = logs.filter((l) => l.appealId === filter.appealId);
      }
      if (filter.changedBy && filter.changedBy !== 'all') {
        logs = logs.filter((l) => l.changedBy === filter.changedBy);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase().trim();
        logs = logs.filter(
          (l) =>
            l.studentName.toLowerCase().includes(q) ||
            (l.assessmentTitle && l.assessmentTitle.toLowerCase().includes(q)) ||
            (l.componentName && l.componentName.toLowerCase().includes(q)) ||
            (l.className && l.className.toLowerCase().includes(q)) ||
            (l.changedBy && l.changedBy.toLowerCase().includes(q)) ||
            (l.reason && l.reason.toLowerCase().includes(q)) ||
            (l.appealId && l.appealId.toLowerCase().includes(q))
        );
      }
    }
    return logs;
  },

  recordGradeAudit: async (entry: {
    type?: GradeModificationType;
    appealId?: string;
    classId?: string;
    className?: string;
    assessmentId?: string;
    assessmentTitle?: string;
    submissionId?: string;
    studentId: string;
    studentName: string;
    componentName: string;
    oldScore: number | null;
    newScore: number;
    reason: string;
    changedBy?: string;
    changedByRole?: UserRole;
  }) => {
    await mockDelay();
    const currentUser = mockService.getCurrentUser();
    const newLog: GradeAuditLog = {
      id: `ga-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: entry.type || 'MANUAL',
      appealId: entry.appealId,
      classId: entry.classId,
      className: entry.className,
      assessmentId: entry.assessmentId,
      assessmentTitle: entry.assessmentTitle,
      submissionId: entry.submissionId,
      studentId: entry.studentId,
      studentName: entry.studentName,
      componentName: entry.componentName,
      oldScore: entry.oldScore,
      newScore: entry.newScore,
      changedBy: entry.changedBy || currentUser.fullName,
      changedByRole: entry.changedByRole || currentUser.role,
      reason: entry.reason,
      timestamp: new Date().toISOString(),
    };
    gradeAuditsStore.unshift(newLog);
    setStored('grade_audits', gradeAuditsStore);

    const typeTag = (entry.type || 'MANUAL') === 'APPEAL' ? 'Phúc khảo' : 'Sửa trực tiếp';
    mockService.addAuditLog({
      action: 'GRADE_OVERRIDE',
      entityType: 'GRADEBOOK',
      entityId: entry.studentId,
      details: `[${typeTag} - ${entry.componentName}] Điều chỉnh điểm SV ${entry.studentName} từ ${entry.oldScore ?? '—'} thành ${entry.newScore}. Lý do: ${entry.reason}`,
    });

    return newLog;
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
      await mockService.overrideGrade(
        appeal.submissionId,
        newScore,
        `Chấm phúc khảo: ${response || 'Cập nhật điểm mới sau thẩm định lại bài thi'}`,
        'APPEAL',
        appeal.id
      );
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
    localStorage.removeItem('velica_mock_grade_audits');
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
    gradeAuditsStore = [...INITIAL_GRADE_AUDITS];
    otpStore.clear();
    maintenanceMode = false;
  },
};

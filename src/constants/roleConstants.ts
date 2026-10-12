export const ROLE = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const;

export type UserRole = (typeof ROLE)[keyof typeof ROLE];

export const ROLE_LABELS: Record<UserRole, string> = {
  [ROLE.ADMIN]: 'Administrator',
  [ROLE.TEACHER]: 'Giảng viên',
  [ROLE.STUDENT]: 'Sinh viên',
};

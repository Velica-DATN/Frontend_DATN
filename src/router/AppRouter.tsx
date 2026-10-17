import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Spin } from 'antd';
import { ROUTE_PATHS } from './constants/routePaths';
import { MainLayout } from '../components/layouts/MainLayout/MainLayout';
import { AssessmentLayout } from '../components/layouts/AssessmentLayout/AssessmentLayout';
import { mockService } from '../api/mocks/mockService';
import { ROLE } from '../constants/roleConstants';

// Academic Loading Fallback for Suspense Code-Splitting
const PageFallback: React.FC = () => (
  <div
    className="d-flex items-center justify-center w-full p-5"
    style={{ minHeight: '50vh' }}
    role="status"
    aria-live="polite"
    aria-label="Đang tải dữ liệu trang..."
  >
    <div className="text-center">
      <Spin size="large" />
      <div className="mt-3 text-secondary-color text-xs font-medium">
        Đang tải giao diện học thuật Velica...
      </div>
    </div>
  </div>
);

// Helper for dynamic imports of named exports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyNamed = (factory: () => Promise<any>, name: string) =>
  lazy(async () => {
    const mod = await factory();
    return { default: mod[name] };
  });

// Auth Pages (Lazy)
const LoginPage = lazyNamed(() => import('../pages/Auth/LoginPage'), 'LoginPage');
const SignUpPage = lazyNamed(() => import('../pages/Auth/SignUpPage'), 'SignUpPage');

// Profile Pages (Lazy)
const ProfileInfo = lazyNamed(() => import('../pages/Profile/ProfileInfo'), 'ProfileInfo');
const SecuritySettings = lazyNamed(() => import('../pages/Profile/SecuritySettings'), 'SecuritySettings');

// Teacher Pages (Lazy)
const ClassList = lazyNamed(() => import('../pages/Teacher/Classes/ClassList'), 'ClassList');
const ClassDetail = lazyNamed(() => import('../pages/Teacher/Classes/ClassDetail'), 'ClassDetail');
const SyllabusList = lazyNamed(() => import('../pages/Teacher/Syllabus/SyllabusList'), 'SyllabusList');
const SyllabusDetail = lazyNamed(() => import('../pages/Teacher/Syllabus/SyllabusDetail'), 'SyllabusDetail');
const SyllabusEditorPage = lazyNamed(() => import('../pages/Teacher/Syllabus/SyllabusEditorPage'), 'SyllabusEditorPage');
const LessonList = lazyNamed(() => import('../pages/Teacher/Lessons/LessonList'), 'LessonList');
const LessonDetail = lazyNamed(() => import('../pages/Teacher/Lessons/LessonDetail'), 'LessonDetail');
const QuestionList = lazyNamed(() => import('../pages/Teacher/QuestionBank/QuestionList'), 'QuestionList');
const AssessmentList = lazyNamed(() => import('../pages/Teacher/Assessments/AssessmentList'), 'AssessmentList');
const AssessmentBuilder = lazyNamed(
  () => import('../pages/Teacher/Assessments/AssessmentBuilder/AssessmentBuilder'),
  'AssessmentBuilder'
);
const AssessmentMonitor = lazyNamed(() => import('../pages/Teacher/Assessments/AssessmentMonitor'), 'AssessmentMonitor');
const AssessmentResults = lazyNamed(() => import('../pages/Teacher/Assessments/AssessmentResults'), 'AssessmentResults');
const GradingQueue = lazyNamed(() => import('../pages/Teacher/Assessments/GradingQueue'), 'GradingQueue');
const ManualGrading = lazyNamed(() => import('../pages/Teacher/Assessments/ManualGrading'), 'ManualGrading');
const GradeAppeals = lazyNamed(() => import('../pages/Teacher/Assessments/GradeAppeals'), 'GradeAppeals');
const RubricList = lazyNamed(() => import('../pages/Teacher/Rubrics/RubricList'), 'RubricList');
const RubricEditorPage = lazyNamed(() => import('../pages/Teacher/Rubrics/RubricEditorPage'), 'RubricEditorPage');
const RubricDetailPage = lazyNamed(() => import('../pages/Teacher/Rubrics/RubricDetailPage'), 'RubricDetailPage');

// Student Pages (Lazy)
const StudentClasses = lazyNamed(() => import('../pages/Student/Classes/StudentClasses'), 'StudentClasses');
const StudentClassDetail = lazyNamed(() => import('../pages/Student/Classes/StudentClassDetail'), 'StudentClassDetail');
const StudentAssessments = lazyNamed(() => import('../pages/Student/Assessments/StudentAssessments'), 'StudentAssessments');
const AssessmentInstructions = lazyNamed(
  () => import('../pages/Student/Assessments/AssessmentInstructions'),
  'AssessmentInstructions'
);
const AssessmentTaking = lazyNamed(() => import('../pages/Student/Assessments/AssessmentTaking'), 'AssessmentTaking');
const AssessmentSubmission = lazyNamed(
  () => import('../pages/Student/Assessments/AssessmentSubmission'),
  'AssessmentSubmission'
);
const AssessmentSubmissionReview = lazyNamed(
  () => import('../pages/Student/Assessments/AssessmentSubmissionReview'),
  'AssessmentSubmissionReview'
);
const GradeReviews = lazyNamed(() => import('../pages/Student/GradeReviews/GradeReviews'), 'GradeReviews');

// Admin Pages (Lazy)
const AdminDashboard = lazyNamed(() => import('../pages/Admin/Dashboard/AdminDashboard'), 'AdminDashboard');
const UserManagement = lazyNamed(() => import('../pages/Admin/Users/UserManagement'), 'UserManagement');
const RoleManagement = lazyNamed(() => import('../pages/Admin/Roles/RoleManagement'), 'RoleManagement');
const AuditLogs = lazyNamed(() => import('../pages/Admin/AuditLogs/AuditLogs'), 'AuditLogs');
const MaintenanceMode = lazyNamed(() => import('../pages/Admin/Maintenance/MaintenanceMode'), 'MaintenanceMode');

// Unified Redirect Helpers
const QuestionAnalysisRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <Navigate
      to={`/teacher/classes/cls-101?tab=analytics&subView=PSYCHOMETRICS&assessmentId=${id || 'asm-1'}`}
      replace
    />
  );
};

const ClassAnalyticsRedirect: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  return (
    <Navigate
      to={`/teacher/classes/${classId || 'cls-101'}?tab=analytics`}
      replace
    />
  );
};

const AssessmentAuditRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <Navigate
      to={`/teacher/assessments?auditAsmId=${id || 'asm-1'}`}
      replace
    />
  );
};

export const AppRouter: React.FC = () => {
  const getDefaultRedirect = () => {
    const role = mockService.getCurrentRole();
    if (role === ROLE.ADMIN) return ROUTE_PATHS.ADMIN.DASHBOARD;
    if (role === ROLE.STUDENT) return ROUTE_PATHS.STUDENT.CLASSES;
    return ROUTE_PATHS.TEACHER.CLASSES;
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Auth Routes */}
          <Route path={ROUTE_PATHS.AUTH.LOGIN} element={<LoginPage />} />
          <Route path={ROUTE_PATHS.AUTH.REGISTER} element={<SignUpPage />} />

          {/* Dedicated Full-Screen Assessment Taking Layout */}
          <Route element={<AssessmentLayout />}>
            <Route path="/student/assessments/:id/take" element={<AssessmentTaking />} />
          </Route>

          {/* Main Application with Sidebar Shell */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />

            {/* Teacher Routes - Direct focus on Class Management */}
            <Route path="/teacher" element={<Navigate to={ROUTE_PATHS.TEACHER.CLASSES} replace />} />
            <Route path={ROUTE_PATHS.TEACHER.DASHBOARD} element={<Navigate to={ROUTE_PATHS.TEACHER.CLASSES} replace />} />
            <Route path={ROUTE_PATHS.TEACHER.CLASSES} element={<ClassList />} />
            <Route path="/teacher/classes/:id" element={<ClassDetail />} />
            <Route path="/teacher/classes/:id/grades" element={<ClassDetail />} />
            <Route path="/teacher/classes/:id/gradebook" element={<ClassDetail />} />
            <Route path="/teacher/classes/:id/members" element={<ClassDetail />} />
            <Route path="/teacher/classes/:classId/analytics" element={<ClassAnalyticsRedirect />} />
            <Route path={ROUTE_PATHS.TEACHER.SYLLABUS} element={<SyllabusList />} />
            <Route path={ROUTE_PATHS.TEACHER.SYLLABUS_CREATE} element={<SyllabusEditorPage />} />
            <Route path={ROUTE_PATHS.TEACHER.SYLLABUS_EDIT} element={<SyllabusEditorPage />} />
            <Route path="/teacher/syllabus/:id" element={<SyllabusDetail />} />
            <Route path="/teacher/syllabi/:id" element={<SyllabusDetail />} />
            <Route path={ROUTE_PATHS.TEACHER.LESSONS} element={<LessonList />} />
            <Route path="/teacher/lessons/:id" element={<LessonDetail />} />
            <Route path={ROUTE_PATHS.TEACHER.QUESTION_BANK} element={<QuestionList />} />
            <Route path={ROUTE_PATHS.TEACHER.QUESTION_LEVELS} element={<Navigate to={ROUTE_PATHS.TEACHER.QUESTION_BANK} replace />} />
            <Route path={ROUTE_PATHS.TEACHER.ASSESSMENTS} element={<AssessmentList />} />
            <Route path={ROUTE_PATHS.TEACHER.ASSESSMENT_BUILDER} element={<AssessmentBuilder />} />
            <Route path="/teacher/assessments/:id/builder" element={<AssessmentBuilder />} />
            <Route path="/teacher/assessments/:id/monitor" element={<AssessmentMonitor />} />
            <Route path="/teacher/assessments/:id/results" element={<AssessmentResults />} />
            <Route path="/teacher/assessments/:id/grading" element={<GradingQueue />} />
            <Route path="/teacher/grading" element={<GradingQueue />} />
            <Route path="/teacher/submissions/:submissionId/grading" element={<ManualGrading />} />
            <Route path="/teacher/assessments/:id/appeals" element={<GradeAppeals />} />
            <Route path="/teacher/appeals" element={<GradeAppeals />} />
            <Route
              path="/teacher/assessments/:id/question-analysis"
              element={<QuestionAnalysisRedirect />}
            />
            <Route path="/teacher/assessments/:id/audit" element={<AssessmentAuditRedirect />} />
            <Route path={ROUTE_PATHS.TEACHER.RUBRICS} element={<RubricList />} />
            <Route path={ROUTE_PATHS.TEACHER.RUBRICS_CREATE} element={<RubricEditorPage />} />
            <Route path={ROUTE_PATHS.TEACHER.RUBRICS_DETAIL} element={<RubricDetailPage />} />
            <Route path={ROUTE_PATHS.TEACHER.RUBRICS_EDIT} element={<RubricEditorPage />} />

            {/* Student Routes - Direct focus on Enrolled Classes */}
            <Route path="/student" element={<Navigate to={ROUTE_PATHS.STUDENT.CLASSES} replace />} />
            <Route path={ROUTE_PATHS.STUDENT.DASHBOARD} element={<Navigate to={ROUTE_PATHS.STUDENT.CLASSES} replace />} />
            <Route path={ROUTE_PATHS.STUDENT.CLASSES} element={<StudentClasses />} />
            <Route path="/student/classes/:id" element={<StudentClassDetail />} />
            <Route path={ROUTE_PATHS.STUDENT.ASSESSMENTS} element={<StudentAssessments />} />
            <Route path="/student/assessments/:id/instructions" element={<AssessmentInstructions />} />
            <Route path="/student/assessments/:id/submission" element={<AssessmentSubmission />} />
            <Route path="/student/assessments/:id/review" element={<AssessmentSubmissionReview />} />
            <Route path={ROUTE_PATHS.STUDENT.ASSESSMENT_REVIEW} element={<AssessmentSubmissionReview />} />
            <Route path={ROUTE_PATHS.STUDENT.RESULTS} element={<Navigate to={ROUTE_PATHS.STUDENT.ASSESSMENTS} replace />} />
            <Route path={ROUTE_PATHS.STUDENT.GRADE_REVIEWS} element={<GradeReviews />} />

            {/* Admin Routes */}
            <Route path={ROUTE_PATHS.ADMIN.DASHBOARD} element={<AdminDashboard />} />
            <Route path={ROUTE_PATHS.ADMIN.USERS} element={<UserManagement />} />
            <Route path={ROUTE_PATHS.ADMIN.ROLES} element={<RoleManagement />} />
            <Route path={ROUTE_PATHS.ADMIN.STATS} element={<Navigate to={ROUTE_PATHS.ADMIN.MAINTENANCE} replace />} />
            <Route path={ROUTE_PATHS.ADMIN.NOTIFICATIONS} element={<Navigate to={ROUTE_PATHS.ADMIN.DASHBOARD} replace />} />
            <Route path={ROUTE_PATHS.ADMIN.AUDIT_LOGS} element={<AuditLogs />} />
            <Route path={ROUTE_PATHS.ADMIN.MAINTENANCE} element={<MaintenanceMode />} />

            {/* Profile Routes */}
            <Route path={ROUTE_PATHS.PROFILE.PERSONAL_INFO} element={<ProfileInfo />} />
            <Route path={ROUTE_PATHS.PROFILE.SECURITY} element={<SecuritySettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ROUTE_PATHS } from './constants/routePaths';
import { MainLayout } from '../components/layouts/MainLayout/MainLayout';
import { AssessmentLayout } from '../components/layouts/AssessmentLayout/AssessmentLayout';

// Auth Pages
import { LoginPage } from '../pages/Auth/LoginPage';
import { SignUpPage } from '../pages/Auth/SignUpPage';

// Profile Pages
import { ProfileInfo } from '../pages/Profile/ProfileInfo';
import { SecuritySettings } from '../pages/Profile/SecuritySettings';

// Teacher Pages
import { ClassList } from '../pages/Teacher/Classes/ClassList';
import { ClassDetail } from '../pages/Teacher/Classes/ClassDetail';
import { SyllabusList } from '../pages/Teacher/Syllabus/SyllabusList';
import { SyllabusDetail } from '../pages/Teacher/Syllabus/SyllabusDetail';
import { SyllabusEditorPage } from '../pages/Teacher/Syllabus/SyllabusEditorPage';
import { LessonList } from '../pages/Teacher/Lessons/LessonList';
import { LessonDetail } from '../pages/Teacher/Lessons/LessonDetail';
import { QuestionList } from '../pages/Teacher/QuestionBank/QuestionList';
import { QuestionLevels } from '../pages/Teacher/QuestionBank/QuestionLevels';
import { AssessmentList } from '../pages/Teacher/Assessments/AssessmentList';
import { AssessmentBuilder } from '../pages/Teacher/Assessments/AssessmentBuilder/AssessmentBuilder';
import { AssessmentMonitor } from '../pages/Teacher/Assessments/AssessmentMonitor';
import { AssessmentResults } from '../pages/Teacher/Assessments/AssessmentResults';
import { GradingQueue } from '../pages/Teacher/Assessments/GradingQueue';
import { ManualGrading } from '../pages/Teacher/Assessments/ManualGrading';
import { GradeAppeals } from '../pages/Teacher/Assessments/GradeAppeals';
import { RubricList } from '../pages/Teacher/Rubrics/RubricList';
import { RubricEditorPage } from '../pages/Teacher/Rubrics/RubricEditorPage';
import { RubricDetailPage } from '../pages/Teacher/Rubrics/RubricDetailPage';

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

// Student Pages
import { StudentClasses } from '../pages/Student/Classes/StudentClasses';
import { StudentClassDetail } from '../pages/Student/Classes/StudentClassDetail';
import { StudentAssessments } from '../pages/Student/Assessments/StudentAssessments';
import { AssessmentInstructions } from '../pages/Student/Assessments/AssessmentInstructions';
import { AssessmentTaking } from '../pages/Student/Assessments/AssessmentTaking';
import { AssessmentSubmission } from '../pages/Student/Assessments/AssessmentSubmission';
import { AssessmentSubmissionReview } from '../pages/Student/Assessments/AssessmentSubmissionReview';
import { GradeReviews } from '../pages/Student/GradeReviews/GradeReviews';

// Admin Pages
import { AdminDashboard } from '../pages/Admin/Dashboard/AdminDashboard';
import { UserManagement } from '../pages/Admin/Users/UserManagement';
import { RoleManagement } from '../pages/Admin/Roles/RoleManagement';
import { AuditLogs } from '../pages/Admin/AuditLogs/AuditLogs';
import { MaintenanceMode } from '../pages/Admin/Maintenance/MaintenanceMode';

import { mockService } from '../api/mocks/mockService';
import { ROLE } from '../constants/roleConstants';

export const AppRouter: React.FC = () => {
  const getDefaultRedirect = () => {
    const role = mockService.getCurrentRole();
    if (role === ROLE.ADMIN) return ROUTE_PATHS.ADMIN.DASHBOARD;
    if (role === ROLE.STUDENT) return ROUTE_PATHS.STUDENT.CLASSES;
    return ROUTE_PATHS.TEACHER.CLASSES;
  };

  return (
    <BrowserRouter>
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
          <Route path={ROUTE_PATHS.TEACHER.QUESTION_LEVELS} element={<QuestionLevels />} />
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
    </BrowserRouter>
  );
};

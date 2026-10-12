# Velica Frontend — Implementation Plan

> **Status:** Planning phase — task breakdown and dependency map.
> **Do not begin implementation until this plan is approved.**

---

## Definition of Done (Global)

A task is **Done** when:
1. Component renders correctly in all planned states (loading, data, empty, error)
2. Form validation works on the client side (required fields, type checks)
3. API integration is wired; success/error toasts appear
4. Responsive behavior verified on desktop (>1024px), tablet (768-1024px), mobile (<768px)
5. No TypeScript errors (`tsc --noEmit` passes)
6. No `any` types introduced in new Velica feature code
7. Existing ESLint rules pass
8. Keyboard navigation tested manually
9. Color contrast verified for all new text-on-background combinations
10. Code reviewed by at least one other developer before merge

---

## Phase 1 — Foundation (Pre-requisite for all other phases)

**Objective:** Establish design tokens, shared components, routing skeleton, API client, and layouts.

**Prerequisites:** Existing boilerplate at `c:\Users\nguye\Videos\Material\KTPM\web\web`

### Tasks

| Task | File(s) | Notes |
|---|---|---|
| 1.1 | Update primary color to #12536B in `_override_variables.less` | Replace `@primary-color: #01509A` |
| 1.2 | Add all Velica CSS variables to `GlobalStyle.ts` | --velica-primary, --velica-bg-page, all tokens from design system |
| 1.3 | Replace Montserrat with Inter font in `constants.ts` | Update FONT_FAMILY.main |
| 1.4 | Update `lightTheme.ts` color values | Match design system tokens |
| 1.5 | Create `src/constants/roleConstants.ts` | ROLE.ADMIN / ROLE.TEACHER / ROLE.STUDENT |
| 1.6 | Create `src/constants/assessmentConstants.ts` | ASSESSMENT_STATUS, GRADING_STATUS, ATTEMPT_STATUS |
| 1.7 | Create `src/interfaces/velica.interfaces.ts` | All Velica domain types |
| 1.8 | Create `src/interfaces/api.interfaces.ts` | Generic API response wrappers |
| 1.9 | Extend `src/router/guards/RequireRole.tsx` | New guard: role-based redirect |
| 1.10 | Extend `ROUTE_PATHS` in `routePaths.ts` | Add all Velica paths (admin/teacher/student namespaces) |
| 1.11 | Create `src/router/routes/adminRoutes.tsx` | Skeleton lazy-loaded routes |
| 1.12 | Create `src/router/routes/teacherRoutes.tsx` | Skeleton lazy-loaded routes |
| 1.13 | Create `src/router/routes/studentRoutes.tsx` | Skeleton lazy-loaded routes |
| 1.14 | Create `src/components/layouts/AssessmentLayout/` | Full-screen layout with header, question panel, navigator panel |
| 1.15 | Create `src/components/velica/StatusBadge/` | Pill badge with dot, all status variants |
| 1.16 | Create `src/components/velica/StatCard/` | Dashboard stat card |
| 1.17 | Create `src/components/velica/ConfirmDialog/` | Standardized confirm dialog wrapper |
| 1.18 | Create `src/components/velica/EmptyState/` | Empty state with icon + message + optional CTA |
| 1.19 | Create `src/components/velica/ErrorState/` | Error state with retry button |
| 1.20 | Create `src/components/velica/FilterBar/` | Composable filter row |
| 1.21 | Create `src/store/slices/assessmentSessionSlice.ts` | Redux slice for active assessment session |
| 1.22 | Create `src/hooks/useCurrentRole.ts` | Derive role from auth/user Redux state |
| 1.23 | Create `src/hooks/usePaginatedQuery.ts` | Generic paginated API hook |
| 1.24 | Create `src/hooks/useDebounceSearch.ts` | Debounced search value hook |
| 1.25 | Extend `src/configs/api-configs.ts` | Add all Velica API path constants |
| 1.26 | Update sidebar `MainSider` theme | Apply #12536B bg color, update menu colors |

**Estimated effort:** 5–7 developer-days
**Deliverables:** Styled app shell with correct color tokens, working role guards, skeleton routes, shared Velica components, type definitions

---

## Phase 2 — Authentication & User Profile

**Objective:** Complete login/register flows, role-aware post-login redirect, profile editing.

**Prerequisites:** Phase 1 complete

### Tasks

| Task | File(s) | Notes |
|---|---|---|
| 2.1 | Review existing LoginPage | Verify it works with Velica's Spring Boot auth endpoint format |
| 2.2 | Update `authSlice.ts` | Add role field alongside token; derive from user.phan_quyen or backend role claim |
| 2.3 | Update `doLogin` thunk | After login, route to role-appropriate dashboard (Admin → /admin/dashboard, Teacher → /teacher/dashboard, Student → /student/dashboard) |
| 2.4 | Update `RequireAuth` guard | Ensure redirect target is role-aware |
| 2.5 | Create `src/pages/Admin/Dashboard/AdminDashboard.tsx` | Placeholder with "Welcome, Admin" |
| 2.6 | Create `src/pages/Teacher/Dashboard/TeacherDashboard.tsx` | Placeholder |
| 2.7 | Create `src/pages/Student/Dashboard/StudentDashboard.tsx` | Placeholder |
| 2.8 | Verify profile pages work for all roles | Check /profile/personal-info, /profile/security-settings |

**Estimated effort:** 2–3 developer-days
**Deliverables:** Login → role-based redirect, working profile edit, change password

---

## Phase 3 — Academic Content (Syllabus, Lessons, Question Bank)

**Objective:** Full CRUD for syllabus, lessons, questions, and question levels.

**Prerequisites:** Phase 1, Phase 2

### Tasks

| Task | File(s) | Notes |
|---|---|---|
| 3.1 | Create `src/api/syllabus.api.ts` | CRUD + search endpoints |
| 3.2 | Create `src/pages/Teacher/Syllabus/SyllabusList.tsx` | List + search |
| 3.3 | Create `src/pages/Teacher/Syllabus/SyllabusForm.tsx` | Create/edit form |
| 3.4 | Create `src/pages/Teacher/Syllabus/SyllabusDetail.tsx` | Detail + lesson list |
| 3.5 | Create `src/api/lessons.api.ts` | CRUD + search + remove question |
| 3.6 | Create `src/pages/Teacher/Lessons/LessonList.tsx` | List + search + filter |
| 3.7 | Create `src/pages/Teacher/Lessons/LessonForm.tsx` | Create/edit (ReactQuill for content) |
| 3.8 | Create `src/pages/Teacher/Lessons/LessonDetail.tsx` | Detail + question list with Remove |
| 3.9 | Create `src/api/questionBank.api.ts` | CRUD + levels |
| 3.10 | Create `src/pages/Teacher/QuestionBank/QuestionList.tsx` | List + search + filters |
| 3.11 | Create `src/pages/Teacher/QuestionBank/QuestionForm.tsx` | Dynamic answer options by type |
| 3.12 | Create `src/pages/Teacher/QuestionBank/QuestionDetail.tsx` | Detail view |
| 3.13 | Create `src/pages/Teacher/QuestionBank/QuestionLevels/` | CRUD for levels (block delete if used) |
| 3.14 | Wire delete confirmations for all entities | Use `ConfirmDialog` from Phase 1 |
| 3.15 | Implement student-facing syllabus/lesson view | `/student/classes/:id` tab panel |

**Estimated effort:** 6–8 developer-days
**Deliverables:** Full syllabus/lesson/question bank management UI

---

## Phase 4 — Assessment Builder & Configuration (Teacher)

**Objective:** Multi-step assessment creation wizard, question selection, policy, CLO mapping, publish.

**Prerequisites:** Phase 3 (question bank must exist for selection)

### Tasks

| Task | File(s) | Notes |
|---|---|---|
| 4.1 | Create `src/api/assessments.api.ts` | Create, update, publish, get config, get policy, CLO mapping |
| 4.2 | Create AssessmentList page | List with StatusBadge, Create button |
| 4.3 | Create AssessmentBuilder Step 1 — Basic Info | Title, Description, Instructions, Type, Weight |
| 4.4 | Create AssessmentBuilder Step 2 — Structure Config | Total Q, Max Score, Scale, Time Limit, section allocation with real-time totals |
| 4.5 | Create AssessmentBuilder Step 3 — Question Selection | Split panel with search/filter, select, auto-generate, reorder |
| 4.6 | Create AssessmentBuilder Step 4 — Policy | DateTime pickers, toggles, late submission sub-section |
| 4.7 | Create AssessmentBuilder Step 5 — CLO Mapping | Tag-style CLO assignment |
| 4.8 | Create AssessmentBuilder Step 6 — Review & Publish | Summary, validation errors, confirm publish → lock |
| 4.9 | Implement field locking for Published assessments | Read-only mode based on status |
| 4.10 | Connect assessment status changes to StatusBadge | Draft / Scheduled / Published |

**Estimated effort:** 8–10 developer-days
**Deliverables:** Complete assessment creation workflow from basic info to publish

---

## Phase 5 — Student Assessment Taking

**Objective:** Student assessment session, question navigation, autosave, submit, timeout, offline handling.

**Prerequisites:** Phase 4 (published assessments must exist), Phase 1 (AssessmentLayout, assessmentSessionSlice)

### Tasks

| Task | File(s) | Notes |
|---|---|---|
| 5.1 | Create `src/api/assessmentSession.api.ts` | Start session, save answers, submit, get questions |
| 5.2 | Create `/student/classes/:classId/assessments` — AvailableAssessments | Cards with status/time/deadline |
| 5.3 | Create AssessmentInstructions page | Policy display, Start button → trigger session creation |
| 5.4 | Create `useAssessmentTimer.ts` hook | Countdown, localStorage backup, color change thresholds |
| 5.5 | Create `useAutosave.ts` hook | 30s periodic save, dirty detection, manual save trigger |
| 5.6 | Create `useConnectionStatus.ts` hook | online/offline events, retry logic |
| 5.7 | Create AssessmentTaking page (AssessmentLayout) | Orchestrator: mounts hooks, renders panels |
| 5.8 | Create QuestionPanel | Renders MCQ (radio) or Essay (textarea) based on question type |
| 5.9 | Create QuestionNavigator | Grid of question buttons with answered/unanswered/current/flagged states |
| 5.10 | Create TimerBar (component in AssessmentLayout header) | Countdown display, color transitions |
| 5.11 | Create SaveStatusIndicator | "Saved" / "Saving..." / "Unsaved" / "Save failed" |
| 5.12 | Create ConnectionIndicator | Online/Offline/Reconnecting badge |
| 5.13 | Create SubmitModal | Unanswered question warning, confirm submit |
| 5.14 | Implement auto-submit on timeout | Timer reaches 0 → trigger submit API |
| 5.15 | Implement local answer cache (offline) | IndexedDB or localStorage fallback, sync on reconnect |
| 5.16 | Implement RequireAssessmentSession guard | Block direct URL access to /take |
| 5.17 | Create SubmissionStatus page | Confirms submission, shows answer summary |
| 5.18 | Create violation detection | Tab visibility change + focus loss events → report to API |

**Estimated effort:** 10–13 developer-days (highest complexity phase)
**Deliverables:** Complete student assessment experience including offline recovery

---

## Phase 6 — Grading, Results & Grade Appeals

**Objective:** Teacher grading workflow, rubric application, result review, grade override, student appeals.

**Prerequisites:** Phase 5 (submissions must exist)

### Tasks

| Task | File(s) | Notes |
|---|---|---|
| 6.1 | Create `src/api/grading.api.ts` | Queue, manual grade, rubric CRUD, override |
| 6.2 | Create `src/api/results.api.ts` | Results list, detail, confirm, appeals |
| 6.3 | Create GradingQueue page | DataTable with grading status, filter by status |
| 6.4 | Create ManualGrading page | Question content, student answer, rubric panel, score, feedback |
| 6.5 | Create RubricCriteriaPanel | Radio group per criterion, auto-computed total |
| 6.6 | Create RubricList page | List with Create/Edit/Delete |
| 6.7 | Create RubricForm | Criteria builder, level-score matrix |
| 6.8 | Create ResultList page | Class results table, stats summary, Confirm Results button |
| 6.9 | Create ResultDetail page | Per-student breakdown, Override Grade action |
| 6.10 | Create OverrideGradeModal | Score input, reason textarea, validation, auto grade history entry |
| 6.11 | Create ResultReview page | Averages, distribution, anomaly detection list |
| 6.12 | Create GradeAppeals page (Teacher) | Appeal request list, Approve/Reject with reason |
| 6.13 | Create GradeReviewRequest page (Student) | Request form: question selection, reason |
| 6.14 | Create GradeReviewHistory page (Student) | Request history with status badges |

**Estimated effort:** 8–10 developer-days

---

## Phase 7 — Analytics, Admin & Monitoring

**Objective:** Dashboards, class analytics, question analysis, admin management, notifications, maintenance.

**Prerequisites:** Phase 6 (results data must exist for analytics)

### Tasks

| Task | File(s) | Notes |
|---|---|---|
| 7.1 | Create `src/api/analytics.api.ts` | Class stats, question analysis, Excel export |
| 7.2 | Create `src/api/monitoring.api.ts` | Real-time student status (polling or WebSocket) |
| 7.3 | Complete TeacherDashboard | StatCards, pending grading count, upcoming assessments |
| 7.4 | Complete AdminDashboard | System StatCards, recent audit log preview |
| 7.5 | Complete StudentDashboard | Upcoming assessments, recent results, class list |
| 7.6 | Create ClassAnalytics page | Charts (score distribution, CLO achievement), StatCards, Excel export |
| 7.7 | Create QuestionAnalysis page | Difficulty table, correct rate, recommendations |
| 7.8 | Create AssessmentMonitor page | Real-time student status table (poll every 10s or WebSocket) |
| 7.9 | Create AuditLog page (Teacher) | Assessment change log table |
| 7.10 | Create `src/api/users.api.ts` | Admin user CRUD |
| 7.11 | Create UserList + UserForm (Admin) | Replace/extend existing NguoiDung pages |
| 7.12 | Create RoleList + RoleForm (Admin) | Replace/extend existing VaiTro pages |
| 7.13 | Create SystemStats page (Admin) | Stats charts, Excel export |
| 7.14 | Create `src/api/notifications.api.ts` | Admin notification send, history |
| 7.15 | Create NotificationManager (Admin) | Compose + recipient filter + history |
| 7.16 | Create `src/api/auditLogs.api.ts` | Admin system audit logs |
| 7.17 | Create AuditLogList (Admin) | Full system audit table |
| 7.18 | Create MaintenanceControl (Admin) | Toggle switch + message editor |

**Estimated effort:** 8–10 developer-days

---

## Phase 8 — QA, Polish & Hardening

**Objective:** Cross-cutting quality checks, responsive testing, accessibility audit, integration validation.

**Prerequisites:** All previous phases

### Tasks

| Task | Notes |
|---|---|
| 8.1 — Responsive audit | Test all pages at mobile/tablet/desktop breakpoints |
| 8.2 — Keyboard navigation | Tab through all forms, dialogs, and the assessment navigator |
| 8.3 — Focus indicators | Verify visible focus rings on all interactive elements |
| 8.4 — Color contrast | Audit all text-background combinations with contrast checker |
| 8.5 — Form validation | Edge cases: empty submit, max length, invalid formats |
| 8.6 — API error handling | Simulate 400/403/404/500 responses; verify ErrorState and toasts |
| 8.7 — Permission checks | Verify role guards prevent cross-role access via direct URL |
| 8.8 — Assessment edge cases | Timeout auto-submit, browser refresh during exam, offline during submit |
| 8.9 — Empty states | All list/table pages show EmptyState when no data |
| 8.10 — Loading skeletons | All async data shows Skeleton while loading |
| 8.11 — Toast/notification review | All success/error actions show appropriate feedback |
| 8.12 — TypeScript strict check | Run `tsc --noEmit`, resolve all errors |
| 8.13 — ESLint check | Run `yarn lint`, resolve all warnings in Velica code |
| 8.14 — Aria review | Screen reader test on assessment taking and grade review flows |
| 8.15 — Performance | Verify lazy loading on all routes; check bundle size |

**Estimated effort:** 4–5 developer-days

---

## Phase Dependencies Map

```
Phase 1 (Foundation)
    └── Phase 2 (Auth + Roles)
            └── Phase 3 (Syllabus/Lesson/QB)
                    └── Phase 4 (Assessment Builder)
                            └── Phase 5 (Student Taking)
                                    └── Phase 6 (Grading + Results)
                                            └── Phase 7 (Analytics + Admin)
                                                        └── Phase 8 (QA)
```

---

## Relative Effort Summary

| Phase | Complexity | Estimated Days |
|---|---|---|
| Phase 1 — Foundation | Medium | 5–7 |
| Phase 2 — Auth & Profile | Low | 2–3 |
| Phase 3 — Academic Content | Medium | 6–8 |
| Phase 4 — Assessment Builder | High | 8–10 |
| Phase 5 — Student Taking | Very High | 10–13 |
| Phase 6 — Grading & Results | High | 8–10 |
| Phase 7 — Analytics & Admin | Medium-High | 8–10 |
| Phase 8 — QA & Polish | Medium | 4–5 |
| **Total** | | **51–66 developer-days** |

> These are rough estimates assuming one mid-senior developer. Parallel work by multiple developers can reduce calendar time significantly.

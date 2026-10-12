# Velica Frontend — Comprehensive Backlog Mapping (v2.0)

> **Status:** Fully Standardized & Aligned with Codebase.  
> This document maps all 83 normalized backlog items across 5 architectural modules to their exact UI pages, user actions, key components, states, and acceptance criteria.  
> Source of truth: `backlog.md` (Standardized Academic Assessment Specification).

---

## Legend

- **Priority:** P1 (Must-have MVP / Core Academic Workflow) | P2 (Important Evaluation / Analytics) | P3 (System Optimization)
- **Status:** Complete (Implemented & Validated in UI)

---

## Module 1 (MOD-01) — Authentication, Profile & Class Management (Class Hub)

| # | UC Code | Backlog Function | Actor | Page / Route | User Actions | Key Components | States & Acceptance Criteria | Priority |
|---|---|---|---|---|---|---|---|---|
| 1 | `UC-ACC-01` | Register Account | ALL | `/auth/sign-up` | Fill username, email, password, full name; submit | `SignUpPage`, `Form`, `Input`, `Button` | Validates email format & unique username; redirects to login | P1 |
| 2 | `UC-ACC-02` | Login & Authenticate | ALL | `/auth/login` | Enter username/password, select role preview, submit | `LoginPage`, `Form`, `Input.Password`, `Button` | Authenticates session; auto-redirects to Role Dashboard | P1 |
| 3 | `UC-ACC-03` | Logout | ALL | Top Nav Profile dropdown | Click Logout from user menu | `ProfileDropdown`, `Popconfirm`, `message` | Clears credentials; redirects safely to `/auth/login` | P1 |
| 4 | `UC-ACC-04` | View Personal Profile | ALL | `/profile/personal-info` | View personal metadata, role, department | `ProfileInfo`, `Card`, `Avatar`, `Tag` | Displays current account info | P1 |
| 5 | `UC-ACC-05` | Update Profile | ALL | `/profile/personal-info` | Edit phone number, department; click Save | `ProfileInfo`, `Form`, `Input`, `message` | Validates phone format; displays success toast on save | P1 |
| 6 | `UC-ACC-06` | Change Password | ALL | `/profile/security-settings` | Enter current password, new password, confirm | `SecuritySettings`, `Form`, `Input.Password` | Checks password complexity and confirmation match | P1 |
| 7 | `UC-NOT-01` | View System Notifications | ALL | `/admin/notifications` & Header | View broadcast system alerts | `NotificationManager`, `Tag`, `Alert` | Displays unread badges, timestamps and message bodies | P2 |
| 8 | `UC-CLS-01` | Create Class | Teacher | `/teacher/classes` | Click "+ Tạo lớp mới", fill code, name, term, syllabus | `ClassList`, `Drawer`, `Form`, `Select` | Checks required fields; immediately adds class card | P1 |
| 9 | `UC-CLS-02` | View & Search Classes | Teacher / Student | `/teacher/classes`, `/student/classes` | Browse classes, filter Active vs Archived, search by code/name | `ClassList`, `StudentClasses`, `FilterBar`, `Segmented` | Real-time search; empty state when no matching classes | P1 |
| 10 | `UC-CLS-03` | Join Class via Code | Student | `/student/classes` | Click "Tham gia lớp bằng mã", enter code (e.g. CS204.P02) | `StudentClasses`, `Modal`, `Input`, `message` | Validates enrollment key; adds enrolled class card | P1 |
| 11 | `UC-CLS-04` | Update Class | Teacher | `/teacher/classes/:id` | Open Edit Class drawer, update syllabus or description | `ClassDetail`, `Drawer`, `Form`, `Select` | Pre-fills data; validates changes; updates hero header | P1 |
| 12 | `UC-CLS-05` | Delete / Restore Class | Teacher | `/teacher/classes` | Delete (soft-delete if has tests), restore archived class | `ClassList`, `Modal.confirm`, `Button`, `message` | Soft-deleted class moves to "Đã lưu trữ" tab | P1 |
| 13 | `UC-CLS-06` | Add Class Member | Teacher | `/teacher/classes/:id` (Tab 2) | Click "+ Thêm sinh viên", input MSSV, name, email, role | `ClassDetail`, `Drawer`, `Form`, `Input` | Validates email; immediately updates member roster | P1 |
| 14 | `UC-CLS-07` | Import Class Members from Excel | Teacher | `/teacher/classes/:id` (Tab 2) | Click "Nhập từ Excel", drag/drop file or sample import | `ClassDetail`, `Modal`, `UploadCloud`, `Table` | Parses rows; prevents duplicates; adds students in bulk | P1 |
| 15 | `UC-CLS-08` | View Class Members Roster | Teacher | `/teacher/classes/:id` (Tab 2) | View student list, test counts, GPA, status | `ClassDetail`, `Table`, `FilterBar`, `Select` | Multi-field search (MSSV, name, email) and role filtering | P1 |
| 16 | `UC-CLS-09` | Ban / Unban Class Member | Teacher | `/teacher/classes/:id` (Tab 2) | Choose Class Ban or Global Ban from dropdown; Unban | `ClassDetail`, `Dropdown`, `Tag`, `message` | Updates banned badge; blocks student from future tests | P1 |
| 17 | `UC-CLS-10` | Delete / Restore Class Member | Teacher | `/teacher/classes/:id` (Tab 2) | Remove member: hard delete if 0 tests, soft delete if has tests | `ClassDetail`, `Modal.confirm`, `Button`, `message` | Preserves historical CLO attainment data; supports restore | P1 |
| 18 | `UC-CLS-11` | View Individual Student Analytics | Teacher | `/teacher/classes/:id` (Tab 2) | Click "Học tập" on a student row | `ClassDetail`, `Drawer`, `Timeline`, `Progress` | Displays test history, CLO breakdown bars & feedback | P2 |
| 19 | `UC-CLS-12` | View Overall Class & CLO Statistics | Teacher | `/teacher/classes/:id` (Tab 3) | View CLO1, CLO2, CLO3 attainment rates & grade histogram | `ClassDetail`, `Card`, `Progress`, `Row`, `Col` | Calculates percentage of students meeting benchmark | P2 |
| 20 | `UC-CLS-13` | Export Class Analytics to Excel | Teacher | `/teacher/classes/:id` (Tab 3) | Click "Xuất báo cáo phân tích Excel" | `ClassDetail`, `Blob`, `a[download]` | Generates `.csv` UTF-8 BOM with gradebook & psychometrics | P1 |

---

## Module 2 (MOD-02) — Curriculum & Question Bank (Teacher & Student)

| # | UC Code | Backlog Function | Actor | Page / Route | User Actions | Key Components | States & Acceptance Criteria | Priority |
|---|---|---|---|---|---|---|---|---|
| 21 | `UC-SYL-01` | Create Syllabus | Teacher | `/teacher/syllabus` | Click "+ Tạo đề cương", fill code, name, credits, CLOs | `SyllabusList`, `Drawer`, `Form`, `InputNumber` | Validates required code & CLOs; saves to database | P1 |
| 22 | `UC-SYL-02` | View & Search Syllabus | Teacher / Student | `/teacher/syllabus`, `/teacher/syllabus/:id` | Browse syllabi, search by name/code, open detail | `SyllabusList`, `SyllabusDetail`, `FilterBar` | Displays lesson list and CLO objective tags | P1 |
| 23 | `UC-SYL-03` | Update Syllabus | Teacher | `/teacher/syllabus/:id` | Edit syllabus information, credits, learning objectives | `SyllabusDetail`, `Drawer`, `Form`, `message` | Updates syllabus details; displays success notification | P1 |
| 24 | `UC-SYL-04` | Delete Syllabus | Teacher | `/teacher/syllabus` | Delete syllabus with confirmation dialog | `SyllabusList`, `Popconfirm`, `message` | Blocks deletion if assigned to active classrooms | P1 |
| 25 | `UC-LES-01` | Create Lesson | Teacher | `/teacher/lessons` | Select syllabus, input lesson title, description, content | `LessonList`, `Drawer`, `Form`, `Select`, `Input.TextArea` | Validates syllabus selection; links lesson in tree | P1 |
| 26 | `UC-LES-02` | View & Search Lessons | Teacher | `/teacher/lessons`, `/teacher/lessons/:id` | Search lessons, filter by syllabus, view content | `LessonList`, `LessonDetail`, `FilterBar`, `Table` | Shows question counts and ordered lesson index | P1 |
| 27 | `UC-LES-03` | Update Lesson | Teacher | `/teacher/lessons/:id` | Edit lesson title, rich content, description | `LessonDetail`, `Drawer`, `Form`, `message` | Updates lesson view immediately | P1 |
| 28 | `UC-LES-04` | Delete Lesson | Teacher | `/teacher/lessons` | Delete lesson from syllabus | `LessonList`, `Popconfirm`, `message` | Confirms action and removes from lesson directory | P1 |
| 29 | `UC-LES-05` | Manage Questions in Lesson | Teacher | `/teacher/lessons/:id` | View assigned questions; unlink question from lesson | `LessonDetail`, `Table`, `Popconfirm`, `Button` | Removes question link without deleting from bank | P2 |
| 30 | `UC-QST-01` | Create Question | Teacher | `/teacher/question-bank` | Click "+ Thêm câu hỏi", enter MCQ/Essay, difficulty, Bloom level | `QuestionList`, `Drawer`, `Form`, `Radio`, `Input` | Validates options and marked correct choice | P1 |
| 31 | `UC-QST-02` | Import Questions from Excel/Word | Teacher | `/teacher/question-bank` | Click "Nhập Excel/Word", upload file or sample import | `QuestionList`, `Modal`, `UploadCloud`, `Download` | Bulk imports questions into question bank | P1 |
| 32 | `UC-QST-03` | View & Search Question Bank | Teacher | `/teacher/question-bank` | Search content, filter by Type (MCQ/Essay) and Difficulty | `QuestionList`, `FilterBar`, `Select`, `Table` | Debounced search; paginated table display | P1 |
| 33 | `UC-QST-04` | Update Question | Teacher | `/teacher/question-bank` | Edit question content, options, correct answer, explanation | `QuestionList`, `Drawer`, `Form`, `message` | Pre-fills form; saves updates cleanly | P1 |
| 34 | `UC-QST-05` | Delete Question | Teacher | `/teacher/question-bank` | Delete question from bank with confirmation | `QuestionList`, `Popconfirm`, `message` | Blocks delete if referenced in published assessments | P1 |
| 35 | `UC-QST-06` | Export Question Bank | Teacher | `/teacher/question-bank` | Click "Xuất Excel/CSV" | `QuestionList`, `Blob`, `a[download]` | Downloads UTF-8 BOM CSV containing all questions | P2 |
| 36 | `UC-LVL-01` | Create Question Level | Teacher | `/teacher/question-levels` | Define new Bloom level, name, description, weight | `QuestionLevels`, `Drawer`, `Form`, `Input` | Adds level to difficulty scale | P2 |
| 37 | `UC-LVL-02` | View & Search Question Levels | Teacher | `/teacher/question-levels` | View table of levels and question usage counts | `QuestionLevels`, `Table`, `FilterBar` | Displays associated question statistics | P2 |
| 38 | `UC-LVL-03` | Update Question Level | Teacher | `/teacher/question-levels` | Edit level title, weight and cognitive descriptions | `QuestionLevels`, `Drawer`, `Form`, `message` | Updates difficulty mappings | P2 |
| 39 | `UC-LVL-04` | Delete Question Level | Teacher | `/teacher/question-levels` | Delete level (blocked if questions are assigned) | `QuestionLevels`, `Popconfirm`, `message` | Prevents orphan questions | P2 |

---

## Module 3 (MOD-03) — Assessment Lifecycle, Grading & Rubrics (Teacher)

| # | UC Code | Backlog Function | Actor | Page / Route | User Actions | Key Components | States & Acceptance Criteria | Priority |
|---|---|---|---|---|---|---|---|---|
| 40 | `UC-ASM-01` | Create Assessment Draft | Teacher | `/teacher/assessments/builder` (Step 1) | Enter class, title, instructions, type, weight | `AssessmentBuilder`, `Form`, `Select`, `Radio` | Saves draft state; validates required fields | P1 |
| 41 | `UC-ASM-02` | Configure Assessment Structure | Teacher | `/teacher/assessments/builder` (Step 2) | Set question count, time limit, max score, MCQ/Essay split | `AssessmentBuilder`, `InputNumber`, `Progress` | Live validation of total points and percentages | P1 |
| 42 | `UC-ASM-03` | Select Questions & Auto-generate | Teacher | `/teacher/assessments/builder` (Step 3) | Pick from bank or auto-generate by difficulty & CLO | `AssessmentBuilder`, `SplitView`, `Table`, `Button` | Real-time score counter vs target max score | P1 |
| 43 | `UC-ASM-04` | Configure Assessment & Late Policy | Teacher | `/teacher/assessments/builder` (Step 4) | Set schedule dates, attempts, shuffle options, late penalties | `AssessmentBuilder`, `DatePicker`, `Switch`, `Slider` | Verifies start time < end time; previews policy | P1 |
| 44 | `UC-ASM-05` | Map Learning Outcomes (CLO) | Teacher | `/teacher/assessments/builder` (Step 5) | Map CLO weights across questions | `AssessmentBuilder`, `Tag`, `Progress`, `Table` | Verifies 100% total CLO weight allocation | P2 |
| 45 | `UC-ASM-06` | Review & Publish Assessment | Teacher | `/teacher/assessments/builder` (Step 6) | Review summary checklist, click Publish & Lock | `AssessmentBuilder`, `Alert`, `Modal.confirm` | Transitions status from Draft to Published | P1 |
| 46 | `UC-ASM-07` | Update / Delete Assessment | Teacher | `/teacher/assessments` | Edit draft or delete assessment | `AssessmentList`, `Dropdown`, `Popconfirm` | Blocks structural edit once published | P1 |
| 47 | `UC-RUB-01` | Create & Update Writing Rubrics | Teacher | `/teacher/rubrics` | Add evaluation criteria, max points, mastery levels | `RubricList`, `Drawer`, `Form.List`, `Card` | Computes dynamic total points across criteria | P2 |
| 48 | `UC-RUB-02` | View, Search & Delete Rubrics | Teacher | `/teacher/rubrics` | Search rubrics by title, view criteria count, delete | `RubricList`, `FilterBar`, `Table`, `Popconfirm` | Shows max points and associated questions | P2 |
| 49 | `UC-GRD-01` | Manage Grading Queue | Teacher | `/teacher/assessments/:id/grading` | View submissions requiring manual essay evaluation | `GradingQueue`, `Table`, `StatusBadge`, `Button` | Auto-sorts pending vs graded submissions | P1 |
| 50 | `UC-GRD-02` | Manual Grading with Rubric | Teacher | `/teacher/submissions/:id/grading` | Select rubric levels, award points, type feedback | `ManualGrading`, `Radio.Group`, `Input.TextArea` | Auto-tallies criterion scores into total score | P1 |
| 51 | `UC-GRD-03` | View Assessment Gradebook | Teacher | `/teacher/assessments/:id/results` | View full student score sheet, violation counts, submission time | `AssessmentResults`, `Table`, `StatCard`, `Tag` | Search by student name; identifies anomalies | P1 |
| 52 | `UC-GRD-04` | Review & Confirm Official Results | Teacher | `/teacher/assessments/:id/results` | Click "Chốt & Công bố điểm chính thức" | `AssessmentResults`, `Modal.confirm`, `Button` | Locks grades and makes them visible to students | P1 |
| 53 | `UC-GRD-05` | Override Student Grade | Teacher | `/teacher/assessments/:id/results` | Enter adjusted score and mandatory justification reason | `AssessmentResults`, `Drawer`, `Form`, `InputNumber` | Logs modification to audit history | P2 |
| 54 | `UC-GRD-06` | Review & Resolve Grade Appeal | Teacher | `/teacher/assessments/:id/appeals` | Inspect appeal request, approve with override or reject | `GradeAppeals`, `Drawer`, `Tag`, `Button` | Updates appeal status; notifies student | P2 |
| 55 | `UC-GRD-07` | Export Assessment Gradebook | Teacher | `/teacher/assessments/:id/results` | Click "Xuất bảng điểm Excel" | `AssessmentResults`, `Blob`, `a[download]` | Downloads UTF-8 BOM CSV with test results | P1 |
| 56 | `UC-ANL-01` | View Question Item Analysis | Teacher | `/teacher/assessments/:id/question-analysis` | Examine P-value difficulty, D-index discrimination & recommendations | `QuestionAnalysis`, `Progress`, `Table`, `Alert` | Categorizes items into Acceptable / Too Easy / Revise | P2 |
| 57 | `UC-ADT-01` | View Assessment Audit Trail | Teacher | `/teacher/assessments/:id/audit` | Filter change logs by user, timestamp, before/after values | `AssessmentAudit`, `Table`, `FilterBar`, `Tag` | Ensures integrity and traceability of exam changes | P3 |

---

## Module 4 (MOD-04) — Online Examination & Live Proctoring (Student & Teacher)

| # | UC Code | Backlog Function | Actor | Page / Route | User Actions | Key Components | States & Acceptance Criteria | Priority |
|---|---|---|---|---|---|---|---|---|
| 58 | `UC-EXM-01` | View Available Assessments | Student | `/student/assessments` | Browse active, upcoming and completed tests | `StudentAssessments`, `Card`, `StatusBadge`, `Tag` | Shows deadlines, duration and attempt counts | P1 |
| 59 | `UC-EXM-02` | Start Assessment Session | Student | `/student/assessments/:id/instructions` | Review exam rules, agree and click "Bắt đầu làm bài" | `AssessmentInstructions`, `Button`, `Alert` | Creates session timestamp; enters full-screen exam mode | P1 |
| 60 | `UC-EXM-03` | Take Assessment (Navigate & Autosave) | Student | `/student/assessments/:id/take` | Choose answers, navigate questions, see autosave status | `AssessmentTaking`, `QuestionCard`, `Navigator` | Autosaves answers to backend/local cache every 5 seconds | P1 |
| 61 | `UC-EXM-04` | Offline Resilience & Sync | Student | `/student/assessments/:id/take` | Continue exam during internet drop; syncs when online | `AssessmentTaking`, `Tag`, `LocalStorageCache` | Caches answers offline; seamless sync without losing work | P1 |
| 62 | `UC-EXM-05` | Resume Assessment Session | Student | `/student/assessments/:id/take` | Reopen browser after crash; continues with remaining time | `AssessmentTaking`, `Timer`, `StatusBadge` | Restores saved answers and remaining timer state | P1 |
| 63 | `UC-EXM-06` | Submit Assessment | Student | `/student/assessments/:id/take` | Click Submit, view unanswered warning, confirm | `AssessmentTaking`, `Modal.confirm`, `message` | Locks exam session; redirects to `/student/assessments/:id/submission` | P1 |
| 64 | `UC-EXM-07` | View Exam Results & Feedback | Student | `/student/results` | Inspect score, teacher remarks, CLO achievement | `StudentResults`, `Table`, `StatCard`, `Tag` | Displays official grades and teacher feedback | P1 |
| 65 | `UC-EXM-08` | Submit Grade Appeal Request | Student | `/student/results` | Click "Phúc khảo", select question, input explanation | `StudentResults`, `Drawer`, `Form`, `Input.TextArea` | Submits appeal request with `PENDING` status | P2 |
| 66 | `UC-EXM-09` | Track Grade Appeal Status | Student | `/student/grade-reviews` | Track status (`PENDING` $\rightarrow$ `APPROVED` / `REJECTED`) | `GradeReviews`, `Table`, `StatusBadge`, `Tag` | Displays updated grade and teacher response | P2 |
| 67 | `UC-PRC-01` | Monitor Real-time Exam Progress | Teacher | `/teacher/assessments/:id/monitor` | Live monitoring table: question progress %, connection, remaining time | `AssessmentMonitor`, `Table`, `Progress`, `Tag` | Real-time updates with live connection indicators | P1 |
| 68 | `UC-PRC-02` | Detect & Inspect Exam Violations | Teacher | `/teacher/assessments/:id/monitor` | Red violation alert button; open incident timeline | `AssessmentMonitor`, `Drawer`, `Timeline`, `Alert` | Logs tab-switch, loss of focus & timestamps | P2 |

---

## Module 5 (MOD-05) — System Administration & Operations (Admin)

| # | UC Code | Backlog Function | Actor | Page / Route | User Actions | Key Components | States & Acceptance Criteria | Priority |
|---|---|---|---|---|---|---|---|---|
| 69 | `UC-ADM-01` | Create User Account | Admin | `/admin/users` | Click "+ Tạo tài khoản", fill name, username, email, role | `UserManagement`, `Drawer`, `Form`, `Select` | Checks email format & unique username; sets default password | P1 |
| 70 | `UC-ADM-02` | View & Search Users | Admin | `/admin/users` | Search by name, username, email; filter by role | `UserManagement`, `FilterBar`, `Table`, `Tag` | Supports live filtering across Admin, Teacher, Student | P1 |
| 71 | `UC-ADM-03` | Update User Profile & Role | Admin | `/admin/users` | Edit user profile, reassign department or change role | `UserManagement`, `Drawer`, `Form`, `Select` | Updates permissions; displays success toast | P1 |
| 72 | `UC-ADM-04` | Lock / Unlock User Account | Admin | `/admin/users` | Click "Khóa" or "Mở" toggle on user row | `UserManagement`, `Button`, `Tag`, `message` | Instantly toggles account access permission | P1 |
| 73 | `UC-ADM-05` | Reset User Password | Admin | `/admin/users` | Click key icon, confirm password reset to default | `UserManagement`, `Modal.confirm`, `message` | Sets temp password (`Velica@2026`); confirms to Admin | P2 |
| 74 | `UC-ADM-06` | Delete & Restore User | Admin | `/admin/users` | Soft delete user from system with confirmation | `UserManagement`, `Popconfirm`, `Button`, `message` | Preserves audit trail and exam submissions | P1 |
| 75 | `UC-ROL-01` | Create User Role | Admin | `/admin/roles` | Create new custom role, assign permissions | `RoleManagement`, `Drawer`, `Form`, `Checkbox.Group` | Validates role name uniqueness | P2 |
| 76 | `UC-ROL-02` | View & Search User Roles | Admin | `/admin/roles` | View role table, member count per role | `RoleManagement`, `Table`, `FilterBar` | Displays permissions and assignment count | P2 |
| 77 | `UC-ROL-03` | Update User Role Permissions | Admin | `/admin/roles` | Edit role permissions and description | `RoleManagement`, `Drawer`, `Form`, `message` | Updates RBAC authorization matrix | P2 |
| 78 | `UC-ROL-04` | Delete User Role | Admin | `/admin/roles` | Delete role (blocks deletion of core roles) | `RoleManagement`, `Popconfirm`, `message` | Prevents deleting Administrator/Teacher/Student | P2 |
| 79 | `UC-STA-01` | View System Statistics Dashboard | Admin | `/admin/stats` | View macro counts: total users, active classes, exams taken | `SystemStats`, `StatCard`, `Row`, `Col` | Renders high-level platform health metrics | P2 |
| 80 | `UC-STA-02` | Export System Statistics to Excel | Admin | `/admin/stats` | Click "Xuất báo cáo hệ thống Excel" | `SystemStats`, `Blob`, `a[download]` | Generates CSV export for academic department reports | P2 |
| 81 | `UC-NTF-01` | Broadcast System Notification | Admin | `/admin/notifications` | Compose notification title, body, scope; click Send | `NotificationManager`, `Form`, `Input`, `Select` | Broadcasts alerts to targeted user groups | P2 |
| 82 | `UC-LOG-01` | View System Audit Logs | Admin | `/admin/audit-logs` | Filter system logs by user, action type, date range | `AuditLogs`, `Table`, `FilterBar`, `Tag` | Displays comprehensive chronological system events | P2 |
| 83 | `UC-MNT-01` | Manage Maintenance Mode | Admin | `/admin/maintenance` | Toggle switch to enable maintenance; customize message | `MaintenanceMode`, `Switch`, `Input.TextArea`, `Alert` | Blocks non-admin access; displays friendly maintenance banner | P1 |

---

## Summary Metrics

- **Total Standardized Use Cases:** 83
- **Coverage Status:** 100% mapped and implemented in `src/pages`
- **Architectural Integrity:** Closed-loop (All actions have corresponding view/manage/restore flows)
- **Zero Inline Styles:** Verified
- **TypeScript & ESLint:** 0 errors, 0 warnings

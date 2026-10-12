# Velica Frontend — UI Architecture Plan

> **Status:** Planning phase. No code has been written or modified.
> **Last updated:** 2026-10-11

---

## 1. Repository Analysis Summary

### 1.1 Existing Boilerplate (source of truth)

| Item | Detail |
|---|---|
| Project location | `c:\Users\nguye\Videos\Material\KTPM\web\web` |
| Framework | React 18 |
| Build tool | Vite 6 + `@vitejs/plugin-react-swc` |
| Language | TypeScript 5.7 strict |
| Package manager | Yarn 1.22 |
| UI Library | **Ant Design 4.22** (v4, not v5) |
| Styling | Less compiled to `public/main.css` + styled-components |
| Routing | react-router-dom **6.3.0** (`useRoutes` API) |
| State management | Redux Toolkit 2.5 |
| HTTP client | Axios via `apiInstance` in `src/api/core.api.ts` |
| Internationalization | i18next + react-i18next (vi/en) |
| Charts | chart.js + react-chartjs-2 |
| Excel | xlsx + react-export-table-to-excel |
| Rich text editor | react-quill |
| Path alias | `@app/*` → `src/*` |
| Dev port | 3000 |

### 1.2 Existing Architecture Patterns

The boilerplate uses a **page-centric + layered shared** architecture:

- `src/pages/` — feature folders (SanPham, VaiTro, SuKien, etc.)
- `src/components/common/` — Base* AntD wrappers (BaseButton, BaseTable, BaseModal, etc.)
- `src/api/` — Axios-based API files per domain
- `src/store/` — Redux slices: authSlice, userSlice, themeSlice, appSlice
- `src/router/` — centralized router with guards and route groups
- `src/styles/` — Less themes with CSS variables

### 1.3 Already Available Shared Components

The following Base* wrappers **must be reused** as foundations:

BaseAlert, BaseAvatar, BaseBadge, BaseBreadcrumb, BaseButton, BaseCard,
BaseCheckbox, BaseCollapse, BaseDatePicker, BaseForm, BaseInput, BaseModal,
BaseNotification, BasePagination, BasePopconfirm, BasePopover, BaseRadio,
BaseRow/Col, BaseSelect, BaseSpace, BaseSpin, BaseSteps, BaseSwitch,
BaseTable, BaseTabs, BaseTooltip, BaseTypography, BaseUpload,
SearchInput, Loading, PageLoader, NotFound, Overlay

### 1.4 What Does NOT Exist Yet (must be built)

- Role-based route guards (Admin / Teacher / Student)
- All Velica domain pages
- Assessment taking layout (dedicated, distraction-free)
- Student layout variant
- Real-time monitoring (WebSocket or polling)
- Assessment autosave and offline state
- Velica-specific design tokens (#12536B primary color)
- assessmentSessionSlice in Redux

---

## 2. Proposed Folder Structure

```
src/
├── @types/
├── api/
│   ├── core.api.ts                    [EXISTING] Axios instance + interceptors
│   ├── auth.api.ts                    [EXISTING] login/logout/forgot
│   ├── users.api.ts                   [NEW] Admin user management
│   ├── roles.api.ts                   [NEW] Admin role management
│   ├── classes.api.ts                 [NEW] Class CRUD + members
│   ├── syllabus.api.ts                [NEW] Syllabus CRUD
│   ├── lessons.api.ts                 [NEW] Lesson CRUD + question assignment
│   ├── questionBank.api.ts            [NEW] Questions + levels
│   ├── assessments.api.ts             [NEW] Assessment builder + config + policy
│   ├── assessmentSession.api.ts       [NEW] Student session + answers + autosave
│   ├── grading.api.ts                 [NEW] Grading queue + manual grading + rubrics
│   ├── results.api.ts                 [NEW] Results + grade review/appeals
│   ├── monitoring.api.ts              [NEW] Real-time student monitoring
│   ├── analytics.api.ts               [NEW] Class analytics + exports
│   ├── notifications.api.ts           [NEW] Notification management
│   └── auditLogs.api.ts               [NEW] Audit log queries
│
├── components/
│   ├── auth/                          [EXISTING] Login/Register forms
│   ├── common/                        [EXISTING] Base* wrappers
│   ├── error/                         [EXISTING] Error states
│   ├── header/                        [EXISTING] Top header
│   ├── layouts/
│   │   ├── AuthLayout/                [EXISTING]
│   │   ├── CrudLayout/                [EXISTING]
│   │   ├── main/                      [EXISTING] MainLayout + MainSider
│   │   └── AssessmentLayout/          [NEW] Full-screen assessment taking
│   ├── profile/                       [EXISTING]
│   └── velica/                        [NEW] Velica-specific shared UI
│       ├── StatusBadge/
│       ├── StatCard/
│       ├── ConfirmDialog/
│       ├── EmptyState/
│       ├── ErrorState/
│       ├── FilterBar/
│       ├── QuestionCard/
│       ├── TimerDisplay/
│       ├── ConnectionIndicator/
│       └── ProgressRing/
│
├── configs/
│   ├── api-configs.ts                 [EXISTING] extend with Velica API paths
│   └── configs.ts                     [EXISTING]
│
├── constants/
│   ├── Message.ts                     [EXISTING]
│   ├── assessmentConstants.ts         [NEW] status enums
│   ├── gradingConstants.ts            [NEW] grading status enums
│   └── roleConstants.ts               [NEW] ADMIN / TEACHER / STUDENT
│
├── hocs/
│   ├── withLoading.hoc.tsx            [EXISTING]
│   └── withRoleGuard.hoc.tsx          [NEW]
│
├── hooks/
│   ├── reduxHooks.ts                  [EXISTING]
│   ├── useResponsive.ts               [EXISTING]
│   ├── useLanguage.ts                 [EXISTING]
│   ├── useCurrentRole.ts              [NEW] derive role from auth state
│   ├── useAssessmentTimer.ts          [NEW] countdown + localStorage backup
│   ├── useAutosave.ts                 [NEW] periodic answer save
│   ├── useConnectionStatus.ts         [NEW] online/offline detection
│   ├── usePaginatedQuery.ts           [NEW] generic paginated API hook
│   └── useDebounceSearch.ts           [NEW] debounced search value
│
├── interfaces/
│   ├── interfaces.ts                  [EXISTING] IUser, VaiTro, etc.
│   ├── velica.interfaces.ts           [NEW] all Velica domain models
│   └── api.interfaces.ts              [NEW] generic API response wrappers
│
├── locales/                           [EXISTING]
│
├── pages/
│   ├── Auth/                          [EXISTING]
│   ├── Home/                          [EXISTING] → adapt to role-aware dashboard
│   ├── Profile/                       [EXISTING]
│   │
│   ├── Admin/
│   │   ├── Dashboard/
│   │   ├── UserManagement/
│   │   ├── RoleManagement/
│   │   ├── SystemStats/
│   │   ├── AuditLogs/
│   │   ├── Notifications/
│   │   └── Maintenance/
│   │
│   ├── Teacher/
│   │   ├── Dashboard/
│   │   ├── Classes/
│   │   ├── Syllabus/
│   │   ├── Lessons/
│   │   ├── QuestionBank/
│   │   ├── Assessments/
│   │   │   └── AssessmentBuilder/    # Multi-step wizard
│   │   ├── Grading/
│   │   ├── Results/
│   │   ├── Analytics/
│   │   └── AuditLog/
│   │
│   └── Student/
│       ├── Dashboard/
│       ├── Classes/
│       ├── Assessments/
│       │   └── AssessmentTaking/     # Dedicated layout
│       └── Results/
│
├── router/
│   ├── AppRouter.tsx                  [EXISTING]
│   ├── constants/routePaths.ts        [EXISTING] extend with Velica paths
│   ├── guards/
│   │   ├── RequireAuth.tsx            [EXISTING]
│   │   ├── RequireRole.tsx            [NEW] role-based access guard
│   │   └── RequireAssessmentSession.tsx [NEW] session guard
│   └── routes/
│       ├── authRoutes.tsx             [EXISTING]
│       ├── protectedRoutes.tsx        [EXISTING] refactor into sub-groups
│       ├── adminRoutes.tsx            [NEW]
│       ├── teacherRoutes.tsx          [NEW]
│       ├── studentRoutes.tsx          [NEW]
│       └── profileRoutes.tsx          [EXISTING]
│
├── services/
│   └── localStorage.service.ts       [EXISTING] extend with session storage
│
├── store/
│   ├── store.ts                       [EXISTING]
│   └── slices/
│       ├── authSlice.ts               [EXISTING] extend with role field
│       ├── userSlice.ts               [EXISTING]
│       ├── themeSlice.ts              [EXISTING]
│       ├── appSlice.ts                [EXISTING]
│       └── assessmentSessionSlice.ts  [NEW]
│
├── styles/
│   ├── GlobalStyle.ts                 [EXISTING] extend with Velica tokens
│   ├── _override_variables.less       [EXISTING] update primary to #12536B
│   └── themes/
│       ├── constants.ts               [EXISTING] update font to Inter
│       └── light/lightTheme.ts        [EXISTING] update primary color
│
├── types/
│   └── generalTypes.ts               [EXISTING]
│
└── utils/
    ├── check.ts, converts.ts, error.ts, utils.ts [EXISTING]
    └── assessment.utils.ts            [NEW]
```

---

## 3. Architectural Rules

### Dependency Direction (enforced)
```
pages/* -> components/velica/* -> components/common/*
pages/* -> hooks/* -> store/slices/*
pages/* -> api/* -> api/core.api.ts
router/* -> pages/* (lazy import only)
```

### Module Boundaries
- Feature pages must NOT import from other feature page folders
- API files import only from `core.api.ts`
- Shared components (`velica/`) have no feature-specific state knowledge
- All AntD components used via `Base*` wrappers — no direct `antd` imports in pages
- Only truly global state (auth, user, assessmentSession) goes into Redux

### Naming Conventions
- Page component: PascalCase noun (AssessmentBuilder, GradingQueue)
- Custom hook: `use` + noun (useAssessmentTimer, useAutosave)
- API file: `camelCase.api.ts` (assessments.api.ts)
- Constants: SCREAMING_SNAKE_CASE in typed objects
- Route paths: `/kebab-case/:id`
- CSS variables: `--velica-primary`, `--velica-surface` (prefixed)

---

## 4. Key Architectural Decisions

| # | Decision | Rationale |
|---|---|---|
| 1 | Retain Ant Design 4.x | Boilerplate is built on AntD v4. Migration would break all Base* wrappers and Less compilation. |
| 2 | Extend page-centric structure | Team guide documents page-centric approach. Feature sub-structure added inside pages/<Domain>/. |
| 3 | No TanStack Query | Not in existing dependencies. Build custom hooks over existing Axios apiInstance. |
| 4 | Assessment session in Redux | Answers, timer, and autosave status must survive re-renders across multiple components. |
| 5 | Dedicated AssessmentLayout | Distraction-free experience required by backlog. MainLayout is unsuitable. |
| 6 | Role guard at route level | RequireAuth only checks token. RequireRole reads role from store and redirects appropriately. |

---

## 5. Anti-patterns to Avoid

- Do NOT import from `antd` directly — always use `@app/components/common/Base*`
- Do NOT store server data in Redux (except assessmentSession)
- Do NOT write business logic in JSX render functions
- Do NOT define inline styles — use styled-components or CSS variables
- Do NOT hardcode route paths — use ROUTE_PATHS constants
- Do NOT fetch data in list-item child components
- Do NOT use `any` type for API responses in new Velica code
- Do NOT create duplicate components when a shared one exists
- Do NOT disable or suppress ESLint rules with `// eslint-disable` without a documented justification comment
- Run `yarn lint` (`eslint src/`) before every commit — enforced via Husky pre-commit hook (already configured in boilerplate)

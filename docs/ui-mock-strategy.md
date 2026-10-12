# Velica Frontend — Mock Data Strategy

> **Mục đích:** Cho phép build và preview toàn bộ UI trước khi backend sẵn sàng.
> **Chiến lược:** Mock Service Layer — swap giữa mock và real API bằng ENV flag.
> **Nguyên tắc:** Component KHÔNG biết mình đang dùng mock hay real. Chỉ thay đổi ở tầng API.

---

## 1. Cơ chế hoạt động

```
Component / Hook
      |
      v
  api/assessments.api.ts   <-- interface duy nhất mà component gọi
      |
      |--[VITE_USE_MOCK=true]--> api/mocks/assessments.mock.ts  (fake data)
      |
      |--[VITE_USE_MOCK=false]--> apiInstance (Axios → real backend)
```

Component không bao giờ import mock trực tiếp. Việc switch được xử lý ngay trong file `*.api.ts`.

---

## 2. Cấu trúc thư mục mock

```
src/api/
├── core.api.ts
├── assessments.api.ts          <-- gọi mock hoặc real tùy ENV
├── grading.api.ts
├── ...
└── mocks/
    ├── _mockDelay.ts           <-- simulate latency (300-800ms)
    ├── data/
    │   ├── classes.data.ts     <-- fake class records
    │   ├── syllabus.data.ts
    │   ├── lessons.data.ts
    │   ├── questions.data.ts
    │   ├── assessments.data.ts
    │   ├── sessions.data.ts
    │   ├── grading.data.ts
    │   ├── results.data.ts
    │   ├── users.data.ts
    │   └── analytics.data.ts
    ├── classes.mock.ts
    ├── syllabus.mock.ts
    ├── lessons.mock.ts
    ├── questions.mock.ts
    ├── assessments.mock.ts
    ├── assessmentSession.mock.ts
    ├── grading.mock.ts
    ├── results.mock.ts
    ├── users.mock.ts
    └── analytics.mock.ts
```

---

## 3. ENV Configuration

Thêm vào `.env.development`:

```env
VITE_USE_MOCK=true
```

Thêm vào `.env.staging` và `.env.production`:

```env
VITE_USE_MOCK=false
```

---

## 4. Pattern chuẩn — API file với mock switch

```typescript
// src/api/assessments.api.ts

import { apiInstance } from './core.api.ts';
import type { Assessment, AssessmentListParams } from '@app/interfaces/velica.interfaces';

// Switch function — chỉ xuất hiện 1 lần duy nhất ở đây
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

// Lazy import mock để không bundle vào production
const getMock = () => import('./mocks/assessments.mock');

export const assessmentsApi = {
  getList: async (params: AssessmentListParams) => {
    if (useMock) return (await getMock()).getList(params);
    return apiInstance.get('/assessments', { params });
  },

  getById: async (id: number) => {
    if (useMock) return (await getMock()).getById(id);
    return apiInstance.get(`/assessments/${id}`);
  },

  create: async (payload: Partial<Assessment>) => {
    if (useMock) return (await getMock()).create(payload);
    return apiInstance.post('/assessments', payload);
  },

  publish: async (id: number) => {
    if (useMock) return (await getMock()).publish(id);
    return apiInstance.post(`/assessments/${id}/publish`);
  },
  // ...
};
```

---

## 5. Pattern chuẩn — Mock file

```typescript
// src/api/mocks/assessments.mock.ts

import { mockDelay } from './_mockDelay';
import { MOCK_ASSESSMENTS } from './data/assessments.data';
import type { Assessment, AssessmentListParams } from '@app/interfaces/velica.interfaces';

// Mutable in-memory store (resets on page refresh — acceptable for dev)
let store: Assessment[] = [...MOCK_ASSESSMENTS];

export const getList = async (params: AssessmentListParams) => {
  await mockDelay();
  const filtered = store.filter(a =>
    params.classId ? a.classId === params.classId : true
  );
  return {
    data: filtered,
    total: filtered.length,
    page: params.page ?? 1,
    per_page: params.per_page ?? 20,
  };
};

export const getById = async (id: number) => {
  await mockDelay();
  const found = store.find(a => a.id === id);
  if (!found) throw new Error(`Assessment ${id} not found`);
  return { data: found };
};

export const create = async (payload: Partial<Assessment>) => {
  await mockDelay();
  const newItem: Assessment = {
    id: Date.now(),
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    ...payload,
  } as Assessment;
  store.push(newItem);
  return { data: newItem };
};

export const publish = async (id: number) => {
  await mockDelay();
  store = store.map(a => a.id === id ? { ...a, status: 'PUBLISHED' } : a);
  return { data: store.find(a => a.id === id) };
};
```

---

## 6. Mock Delay Helper

```typescript
// src/api/mocks/_mockDelay.ts

/**
 * Simulate realistic API latency to test loading states.
 * Min: 300ms | Max: 800ms
 */
export const mockDelay = (min = 300, max = 800): Promise<void> =>
  new Promise(resolve =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );
```

> Quan trọng: delay giả lập giúp test loading skeleton và save status indicator TRƯỚC khi có API thật.

---

## 7. Fake Data Templates

### assessments.data.ts (ví dụ)

```typescript
// src/api/mocks/data/assessments.data.ts

import type { Assessment } from '@app/interfaces/velica.interfaces';

export const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 1,
    classId: 101,
    title: 'Midterm Exam — Software Engineering',
    description: 'Covers chapters 1-6',
    instructions: 'No electronic devices allowed. Read each question carefully.',
    type: 'MIDTERM',
    weight: 30,
    status: 'PUBLISHED',
    totalQuestions: 30,
    maxScore: 10,
    scoreScale: 10,
    timeLimitMinutes: 90,
    startTime: '2026-10-20T08:00:00Z',
    endTime: '2026-10-20T10:30:00Z',
    maxAttempts: 1,
    shuffleQuestions: true,
    shuffleAnswers: true,
    allowBackNavigation: true,
    createdAt: '2026-10-01T09:00:00Z',
    createdBy: 'teacher@velica.edu',
  },
  {
    id: 2,
    classId: 101,
    title: 'Quiz 1 — OOP Basics',
    description: 'Short quiz on object-oriented concepts',
    instructions: 'You have 20 minutes. Only 1 attempt allowed.',
    type: 'QUIZ',
    weight: 10,
    status: 'DRAFT',
    totalQuestions: 10,
    maxScore: 10,
    scoreScale: 10,
    timeLimitMinutes: 20,
    startTime: null,
    endTime: null,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleAnswers: true,
    allowBackNavigation: false,
    createdAt: '2026-10-05T14:00:00Z',
    createdBy: 'teacher@velica.edu',
  },
  {
    id: 3,
    classId: 102,
    title: 'Final Assignment — System Design',
    type: 'ASSIGNMENT',
    weight: 40,
    status: 'CLOSED',
    totalQuestions: 3,
    maxScore: 100,
    scoreScale: 100,
    timeLimitMinutes: 0,
    createdAt: '2026-09-15T10:00:00Z',
    createdBy: 'teacher@velica.edu',
  },
];
```

---

## 8. Fake Data cần tạo (theo phase)

| Phase | Data file | Nội dung |
|---|---|---|
| Phase 1 | `users.data.ts` | 10 users (3 admin, 4 teacher, 3 student) |
| Phase 2 | `auth.data.ts` | Login response theo role |
| Phase 3 | `classes.data.ts` | 5 classes với members |
| Phase 3 | `syllabus.data.ts` | 3 syllabi với learning objectives |
| Phase 3 | `lessons.data.ts` | 8 lessons trải qua 3 syllabus |
| Phase 3 | `questions.data.ts` | 50 câu hỏi (MCQ + Essay, đủ level) |
| Phase 3 | `questionLevels.data.ts` | Easy, Medium, Hard, Very Hard |
| Phase 4 | `assessments.data.ts` | 6 assessments (Draft, Published, Closed) |
| Phase 5 | `sessions.data.ts` | Mock session + câu hỏi theo assessment |
| Phase 6 | `grading.data.ts` | Submissions, pending + graded entries |
| Phase 6 | `results.data.ts` | Kết quả per-student per-assessment |
| Phase 7 | `analytics.data.ts` | Score distribution, CLO achievement |
| Phase 7 | `auditLogs.data.ts` | 20 log entries |

---

## 9. Khi backend sẵn sàng — Migration Checklist

1. Backend confirm endpoint contract (path, request, response shape)
2. Update `velica.interfaces.ts` nếu shape khác với mock
3. Trong `*.api.ts`, code real Axios call đã viết sẵn — chỉ cần set `VITE_USE_MOCK=false`
4. Test từng feature: mock OFF → chạy với real API
5. Xóa `src/api/mocks/` sau khi toàn bộ endpoints đã verified (hoặc giữ lại cho testing)

> **Không cần refactor component nào.** Chỉ thay ENV flag.

---

## 10. Preview Scenarios có thể test với mock

| Scenario | Cách trigger |
|---|---|
| Loading skeleton | mockDelay đang chạy |
| Empty state | Trả về array rỗng `[]` từ mock |
| Error state | `throw new Error('Server error')` trong mock |
| Assessment timeout | Set `timeLimitMinutes: 1` trong mock session |
| Offline mode | Chrome DevTools → Network → Offline |
| Published + locked fields | status: `PUBLISHED` trong mock assessment |
| Pending grading | submissions với `gradingStatus: PENDING` |
| Grade appeal pending | appeals với `status: PENDING` |

# Velica Frontend — Bộ Tiêu Chí Chấm Điểm UI/UX

> **Tổng điểm:** 100 điểm
> **Mục đích:** Đánh giá chất lượng UI/UX khi review từng phase và khi nghiệm thu cuối.
> **Cách dùng:** Self-check trước khi demo, peer review trước khi merge.

---

## Bảng Tổng Quan

| Tiêu chí | Điểm tối đa | Nội dung đánh giá |
|---|---|---|
| 1. Visual Design | 20 | Màu sắc, typography, spacing, hierarchy, tính nhất quán |
| 2. Usability | 20 | Dễ hiểu, dễ thao tác, số bước hoàn thành tác vụ |
| 3. Information Architecture | 15 | Navigation, phân nhóm chức năng, cấu trúc trang |
| 4. Accessibility | 10 | Tương phản màu, keyboard, focus, label |
| 5. Responsive Design | 10 | Desktop, tablet, mobile |
| 6. Interaction & Feedback | 10 | Loading, error, success, empty state, confirmation |
| 7. Design System Consistency | 10 | Component tái sử dụng, token, quy chuẩn UI |
| 8. Academic Workflow Fit | 5 | Phù hợp quy trình Admin, Teacher, Student |
| **Tổng** | **100** | |

---

## Chi Tiết Từng Tiêu Chí

---

### 1. Visual Design — 20 điểm

**Mục tiêu:** Giao diện trông chuyên nghiệp, nhất quán và phù hợp với định hướng Modern Academic SaaS.

| Hạng mục | Điểm | Checklist |
|---|---|---|
| Màu sắc | 5 | Primary `#12536B` được dùng đúng chỗ; không dùng màu neon/ngẫu nhiên; semantic color đúng nghĩa (đỏ = lỗi, xanh = thành công) |
| Typography | 5 | Font Inter nhất quán; type scale đúng cấp bậc (page title > section title > body); không mix font; line-height đọc được |
| Spacing & Layout | 5 | Khoảng cách đều đặn theo hệ 4px; padding card/form nhất quán; không có phần tử "trôi nổi" không có grid |
| Visual Hierarchy | 5 | Thông tin quan trọng nổi bật hơn; heading > label > body > caption; CTA button nổi bật so với các nút phụ |

**Điểm tối đa:** 20 | **Đạt:** ≥ 14 | **Tốt:** ≥ 17

**Liên kết:** Xem [`ui-design-system.md`](./ui-design-system.md) — Mục 2, 3, 4.

---

### 2. Usability — 20 điểm

**Mục tiêu:** Người dùng hoàn thành tác vụ nhanh, ít lỗi, không cần đọc tài liệu.

| Hạng mục | Điểm | Checklist |
|---|---|---|
| Tác vụ cốt lõi ≤ 3 bước | 6 | Tạo assessment: không quá 6 bước wizard; xóa: confirm dialog 1 click; đăng nhập: ≤ 2 field + submit |
| Label và placeholder rõ ràng | 4 | Mọi input có label; placeholder cho ví dụ, không thay thế label; error message chỉ đích danh field lỗi |
| Tác vụ nguy hiểm có xác nhận | 4 | Delete, Publish, Submit luôn có Confirmation Dialog với tên entity rõ ràng |
| Tìm kiếm và lọc hiệu quả | 3 | Search debounce 300ms; filter rõ ràng; có nút "Clear all filters"; kết quả cập nhật không cần reload |
| Không cần nhớ trạng thái | 3 | Breadcrumb luôn hiển thị; current step rõ trong wizard; StatusBadge luôn visible |

**Điểm tối đa:** 20 | **Đạt:** ≥ 14 | **Tốt:** ≥ 17

---

### 3. Information Architecture — 15 điểm

**Mục tiêu:** Người dùng biết mình đang ở đâu và tìm thấy chức năng cần thiết.

| Hạng mục | Điểm | Checklist |
|---|---|---|
| Sidebar navigation đúng role | 4 | Admin thấy menu Admin; Teacher thấy menu Teacher; Student thấy menu Student; không bị lẫn lộn |
| Phân nhóm chức năng logic | 4 | Assessment Builder → Policy → CLO → Publish là chuỗi liên tục; Grading → Results là dòng chảy đúng; không có tính năng "lạc chỗ" |
| Breadcrumb chính xác | 3 | Mọi trang có breadcrumb phản ánh đúng vị trí; breadcrumb item là link; trang hiện tại là text (không phải link) |
| URL có ý nghĩa | 2 | `/teacher/classes/101/assessments/3/grading` đọc được; không có `/page?id=3&mode=2` khó hiểu |
| Trang 404 và redirect đúng | 2 | Route không tồn tại → 404; URL bị ép truy cập sai role → redirect đúng dashboard |

**Điểm tối đa:** 15 | **Đạt:** ≥ 10 | **Tốt:** ≥ 13

**Liên kết:** Xem [`ui-route-map.md`](./ui-route-map.md) — Mục 8 (Navigation Structure).

---

### 4. Accessibility — 10 điểm

**Mục tiêu:** Ứng dụng dùng được bằng bàn phím và screen reader, màu sắc đủ tương phản.

| Hạng mục | Điểm | Checklist |
|---|---|---|
| Color contrast | 3 | Text trên nền trắng ≥ 4.5:1; text lớn ≥ 3:1; không truyền thông tin qua màu sắc duy nhất |
| Keyboard navigation | 3 | Tab đi qua mọi interactive element theo thứ tự hợp lý; Escape đóng modal; Enter submit form |
| Focus indicator | 2 | Focus ring `2px solid #12536B` rõ ràng trên mọi element; không bao giờ `outline: none` không có alternative |
| Semantic HTML & ARIA | 2 | `<button>` cho action; `<a>` cho link; `aria-label` cho icon-only button; `aria-live` cho timer, save status |

**Điểm tối đa:** 10 | **Đạt:** ≥ 7 | **Tốt:** ≥ 9

**Công cụ:** axe DevTools, Chrome Lighthouse Accessibility audit.

---

### 5. Responsive Design — 10 điểm

**Mục tiêu:** Giao diện dùng được tốt trên 3 kích thước màn hình.

| Breakpoint | Điểm | Checklist |
|---|---|---|
| Desktop (> 1024px) | 3 | Sidebar mở (240px); table đầy đủ cột; form 2 cột nếu phù hợp; không có horizontal scroll |
| Tablet (768–1024px) | 4 | Sidebar collapse icon-only (64px); assessment navigator bottom drawer; table scroll ngang nếu cần |
| Mobile (< 768px) | 3 | Sidebar là drawer; form 1 cột; button full-width; font không quá nhỏ (≥ 14px); tap target ≥ 44px |

**Điểm tối đa:** 10 | **Đạt:** ≥ 7 | **Tốt:** ≥ 9

**Test tool:** Chrome DevTools Device Emulation (iPhone 14, iPad, Desktop 1440px).

---

### 6. Interaction & Feedback — 10 điểm

**Mục tiêu:** Người dùng luôn biết hệ thống đang làm gì và kết quả tác vụ.

| Hạng mục | Điểm | Checklist |
|---|---|---|
| Loading states | 2 | Skeleton rows khi load table; Spin khi load form; PageLoader cho route đầu tiên |
| Error states | 2 | ErrorState component khi API fail; message có nghĩa (không phải "Error 500"); nút Retry |
| Success feedback | 2 | Toast success sau Create/Update/Delete/Publish; toast đủ thời gian đọc (3–4 giây) |
| Empty states | 2 | EmptyState khi list trống; message context-specific ("No assessments yet — Create your first one"); CTA button |
| Confirmation dialogs | 2 | Xóa, Publish, Submit assessment đều có confirm dialog; nêu tên entity và hậu quả cụ thể |

**Điểm tối đa:** 10 | **Đạt:** ≥ 7 | **Tốt:** ≥ 9

**Đặc biệt cho Assessment Taking:**

| Feedback | Checklist |
|---|---|
| Autosave status | "Saved ✓" / "Saving…" / "Unsaved changes" / "Save failed — retry" |
| Timer color change | Normal → Warning (vàng, < 10 phút) → Critical (đỏ + pulse, < 2 phút) |
| Connection status | Online / Offline (cache mode) / Reconnecting / Synced |
| Submit confirmation | Hiện số câu chưa trả lời, yêu cầu xác nhận lần 2 |

---

### 7. Design System Consistency — 10 điểm

**Mục tiêu:** Toàn bộ UI dùng cùng một bộ component, token, và quy tắc.

| Hạng mục | Điểm | Checklist |
|---|---|---|
| Dùng Base* wrappers | 3 | Không import trực tiếp từ `antd` trong page component; mọi button là `BaseButton`; mọi table là `BaseTable` |
| Velica shared components | 3 | StatusBadge, StatCard, ConfirmDialog, EmptyState, ErrorState dùng đúng theo spec; không tự tạo lại |
| CSS variables / tokens | 2 | Màu sắc dùng `var(--velica-primary)` không hardcode hex; spacing dùng `var(--space-4)` |
| Không có "orphan styles" | 2 | Không có `style={{ color: 'red' }}` inline; không có CSS file riêng per-component nếu styled-components đã cover |

**Điểm tối đa:** 10 | **Đạt:** ≥ 7 | **Tốt:** ≥ 9

---

### 8. Academic Workflow Fit — 5 điểm

**Mục tiêu:** UI phản ánh đúng quy trình học thuật thực tế, không làm người dùng bối rối về nghiệp vụ.

| Hạng mục | Điểm | Checklist |
|---|---|---|
| Teacher workflow | 2 | Assessment Builder đi đúng thứ tự: Tạo → Config → Câu hỏi → Policy → CLO → Publish; trạng thái Draft/Scheduled/Published/Closed rõ ràng |
| Student workflow | 2 | Đọc hướng dẫn → Bắt đầu → Làm bài → Nộp → Xem kết quả là luồng liên tục không bị gián đoạn |
| Admin workflow | 1 | Quản lý user, role, system là tách biệt rõ ràng; không bị lẫn với Teacher/Student menu |

**Điểm tối đa:** 5 | **Đạt:** ≥ 3 | **Tốt:** 5

---

## Score Sheet — Dùng Khi Review

```
Reviewer: _______________
Feature / Page: _______________
Date: _______________

1. Visual Design         ___ / 20
2. Usability             ___ / 20
3. Information Arch.     ___ / 15
4. Accessibility         ___ / 10
5. Responsive Design     ___ / 10
6. Interaction & Feedback ___ / 10
7. Design System         ___ / 10
8. Academic Workflow     ___ /  5

TOTAL                    ___ / 100

Ghi chú / Issues:
-
-
-
```

---

## Ngưỡng Đánh Giá

| Điểm | Mức | Ý nghĩa |
|---|---|---|
| 90–100 | ⭐⭐⭐⭐⭐ Xuất sắc | Demo-ready, production quality |
| 80–89 | ⭐⭐⭐⭐ Tốt | Có thể demo với một vài chú ý nhỏ |
| 70–79 | ⭐⭐⭐ Đạt | Cần polish trước khi demo chính thức |
| 60–69 | ⭐⭐ Cần cải thiện | Có issues ảnh hưởng trải nghiệm người dùng |
| < 60 | ⭐ Chưa đạt | Cần rework đáng kể |

---

## Mapping Tiêu Chí → Phase Implementation

| Tiêu chí | Phase đảm bảo |
|---|---|
| Visual Design | Phase 1 (Design tokens, sidebar theme) |
| Design System Consistency | Phase 1 (shared components) |
| Interaction & Feedback | Phase 1 (EmptyState, ErrorState) + mọi Phase |
| Accessibility | Phase 1 + Phase 8 (QA audit) |
| Information Architecture | Phase 2 (routing, navigation) |
| Usability (auth) | Phase 2 |
| Usability (content) | Phase 3–7 |
| Responsive Design | Phase 8 (QA) — check từng page |
| Academic Workflow Fit | Phase 4 (Assessment Builder) + Phase 5 (Taking) |

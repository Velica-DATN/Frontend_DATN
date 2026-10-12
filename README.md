# 🎓 Velica — Modern Academic Assessment & Learning System
> **Frontend Đồ Án Tốt Nghiệp (DATN) / Kỹ Thuật Phần Mềm**  
> Hệ thống Khảo thí Trực tuyến, Quản lý Học tập Chuẩn đầu ra (CLO/Bloom) & Chấm thi Tự luận theo Tiêu chí Rubrics Hiện đại.

---

## 📌 Giới Thiệu Tổng Quan
**Velica** là nền tảng khảo thí và quản lý đào tạo học thuật toàn diện được thiết kế theo chuẩn giao diện SaaS hiện đại (Ant Design 5 + Untitled UI Design System). Hệ thống hỗ trợ chu trình đào tạo khép kín từ khâu ban hành **Đề cương môn học (Syllabus)**, ánh xạ **Chuẩn đầu ra (CLO/PLO)**, biên soạn **Ngân hàng câu hỏi đa dạng**, tạo lập **Đề thi ma trận**, **Giám sát thi chống gian lận (Proctoring)**, **Tự động chấm trắc nghiệm & Chấm tự luận theo Rubrics**, đến giải quyết **Đơn phúc khảo điểm bài thi**.

---

## 🛠️ Công Nghệ & Thư Viện Sử Dụng
- **Core:** [React 18](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 6](https://vitejs.dev/)
- **UI Framework & Design System:** [Ant Design 5.24](https://ant.design/) + CSS Variables Token System
- **Icons:** [Lucide React](https://lucide.dev/) + [@ant-design/icons](https://ant.design/components/icon)
- **Routing:** [React Router 6](https://reactrouter.com/)
- **Data Visualization & Charts:** [Recharts 3](https://recharts.org/)
- **Data Management & State:** In-memory Mock Service với LocalStorage Persistence, hỗ trợ Reset dữ liệu mẫu nhanh trên Navbar.

---

## 🗺️ Sitemap & Sourcemap Toàn Diện Các Trang (Page Routing & Source Map)

Hệ thống được tổ chức phân quyền chặt chẽ với 3 vai trò người dùng chính (**Giảng viên**, **Sinh viên**, **Quản trị viên**), cùng các phân hệ Xác thực và Hồ sơ cá nhân:

### 1. Phân hệ Xác thực & Hồ sơ Cá nhân (Auth & Profile)
| Đường dẫn (URL) | Tiêu đề Trang | File Mã Nguồn (Source File) | Mô tả Chức năng |
| :--- | :--- | :--- | :--- |
| `/auth/login` | Đăng nhập hệ thống | `src/pages/Auth/LoginPage.tsx` | Đăng nhập form + Nút đăng nhập nhanh 3 vai trò (Giảng viên, Sinh viên, Quản trị viên). |
| `/auth/sign-up` | Đăng ký tài khoản | `src/pages/Auth/SignUpPage.tsx` | Đăng ký tài khoản mới vào trường / hệ thống. |
| `/profile/personal-info` | Thông tin cá nhân | `src/pages/Profile/ProfileInfo.tsx` | Xem và cập nhật hồ sơ, mã số, email, số điện thoại, khoa/bộ môn. |
| `/profile/security-settings` | Cài đặt bảo mật | `src/pages/Profile/SecuritySettings.tsx` | Đổi mật khẩu, lịch sử đăng nhập thiết bị, xác thực 2 bước (2FA). |

---

### 2. Phân hệ Giảng viên (Teacher Module)
Giảng viên tập trung quản lý toàn diện các lớp học phần, bài thi, ngân hàng câu hỏi và chấm thi tự luận.

| Đường dẫn (URL) | Tiêu đề Trang | File Mã Nguồn (Source File) | Mô tả Chức năng |
| :--- | :--- | :--- | :--- |
| `/teacher/classes` | Quản lý Lớp học phần | `src/pages/Teacher/Classes/ClassList.tsx` | Trang đích mặc định của GV. Danh sách lớp đang giảng dạy/lưu trữ, lọc học kỳ, tạo lớp học mới, xem thống kê SV & bài thi. |
| `/teacher/classes/:id` | Chi tiết Lớp học phần | `src/pages/Teacher/Classes/ClassDetail.tsx` | 4 Tab nghiệp vụ: Thông tin & Đề cương môn học, Danh sách sinh viên & Điểm tổng kết, Bài thi & Đánh giá của lớp, Bài giảng & Tài liệu. Hỗ trợ import Excel, liên kết tạo đề thi. |
| `/teacher/classes/:classId/analytics` | Phân tích Học tập Lớp học | `src/pages/Teacher/Classes/ClassAnalytics.tsx` | Biểu đồ phân bổ điểm, tỷ lệ đạt chuẩn đầu ra (CLO), danh sách SV có nguy cơ cần can thiệp sớm. |
| `/teacher/syllabus` | Đề cương Môn học | `src/pages/Teacher/Syllabus/SyllabusList.tsx` | Danh sách đề cương môn học (Mã môn, Tên học phần, Số tín chỉ, CLO, Tình trạng phê duyệt). |
| `/teacher/syllabus/:id` | Chi tiết & Quản lý Đề cương | `src/pages/Teacher/Syllabus/SyllabusDetail.tsx` | Xem & CRUD Đề cương: Cấu trúc đánh giá (% Chuyên cần, Giữa kỳ, Cuối kỳ), Chuẩn đầu ra (CLO) & Ánh xạ PLO, Giáo trình & Tài liệu tham khảo. |
| `/teacher/lessons` | Bài giảng & Nội dung Học tập | `src/pages/Teacher/Lessons/LessonList.tsx` | Kho tài nguyên bài học/chủ đề độc lập có thể tái sử dụng và gắn vào các lớp học phần. |
| `/teacher/lessons/:id` | Chi tiết Bài giảng & Câu hỏi | `src/pages/Teacher/Lessons/LessonDetail.tsx` | Xem nội dung buổi học, liên kết chuẩn đầu ra CLO, danh sách câu hỏi minh họa đi kèm. |
| `/teacher/question-bank` | Ngân hàng Câu hỏi Khảo thí | `src/pages/Teacher/QuestionBank/QuestionList.tsx` | Quản lý câu hỏi khảo thí với 5 dạng: Trắc nghiệm 1 đáp án (MCQ), Nhiều đáp án (Multi-choice), Đúng/Sai (True/False), Điền khuyết (Fill Blank), Tự luận (Essay). |
| `/teacher/question-levels` | Cấp độ Bloom & Ma trận Đề | `src/pages/Teacher/QuestionBank/QuestionLevels.tsx` | Quản lý 4 mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) và ma trận phân bổ câu hỏi. |
| `/teacher/assessments` | Trung tâm Đề thi & Khảo thí | `src/pages/Teacher/Assessments/AssessmentList.tsx` | Danh sách đề thi, lọc theo Lớp học phần (`?classId=`), bộ lọc trạng thái (Bản nháp, Sắp diễn ra, Đang thi, Đã đóng, Đã công bố điểm). |
| `/teacher/assessments/builder` | Trình biên soạn Đề thi | `src/pages/Teacher/Assessments/AssessmentBuilder/AssessmentBuilder.tsx` | Trình tạo/sửa đề thi: Thông tin chung, cấu hình lớp, quy chế phòng thi, bảo mật, chọn câu hỏi từ ngân hàng hoặc tạo thủ công. Hỗ trợ nhận diện `?classId=`. |
| `/teacher/assessments/:id/monitor` | Giám sát Ca thi Trực tiếp (Live Proctoring) | `src/pages/Teacher/Assessments/AssessmentMonitor.tsx` | Giám sát thời gian thực ca thi: Cảnh báo gian lận (rời tab thi, thoát toàn màn hình, mở ứng dụng khác), tạm dừng/thu bài cưỡng chế. |
| `/teacher/assessments/:id/results` | Bảng Điểm & Kết quả Bài thi | `src/pages/Teacher/Assessments/AssessmentResults.tsx` | Danh sách bài nộp, điểm tự động trắc nghiệm, điểm tự luận, trạng thái chấm, xuất bảng điểm Excel/CSV. |
| `/teacher/assessments/:id/grading` | Hàng đợi Chấm bài Tự luận | `src/pages/Teacher/Assessments/GradingQueue.tsx` | Danh sách các bài thi tự luận cần giảng viên chấm điểm, lọc theo lớp, trạng thái chấm (Chưa chấm, Đang chấm, Đã hoàn tất). |
| `/teacher/submissions/:submissionId/grading` | Bàn Chấm Tự luận theo Rubric | `src/pages/Teacher/Assessments/ManualGrading.tsx` | Giao diện chấm thi chuyên sâu: Xem câu trả lời tự luận của SV, áp tiêu chí Rubric từng mức điểm, nhập phản hồi/nhận xét và lưu điểm. |
| `/teacher/assessments/:id/appeals` | Xử lý Đơn Phúc khảo Điểm | `src/pages/Teacher/Assessments/GradeAppeals.tsx` | Danh sách đơn khiếu nại điểm của SV, xem lý do khiếu nại, đối soát bài thi gốc, chấp nhận điều chỉnh điểm hoặc từ chối kèm giải trình. |
| `/teacher/assessments/:id/question-analysis` | Phân tích Thống kê Câu hỏi | `src/pages/Teacher/Assessments/QuestionAnalysis.tsx` | Độ khó thực tế (p-value), độ phân biệt câu hỏi (Discrimination Index), biểu đồ chọn đáp án nhiễu. |
| `/teacher/assessments/:id/audit` | Nhật ký Khảo thí (Audit Log) | `src/pages/Teacher/Assessments/AssessmentAudit.tsx` | Lịch sử can thiệp đề thi: Ai tạo đề, sửa đáp án, mở ca thi, điều chỉnh điểm số của sinh viên. |
| `/teacher/rubrics` | Quản lý Tiêu chí Rubrics | `src/pages/Teacher/Rubrics/RubricList.tsx` | Thư viện thang tiêu chí chấm tự luận theo chuẩn đầu ra (Tạo mới, sửa, nhân bản, xem trước thang đo điểm). |

---

### 3. Phân hệ Sinh viên (Student Module)
Sinh viên tham gia lớp học phần, tra cứu đề cương, làm bài thi khảo thí trực tuyến và tra cứu kết quả/phúc khảo.

| Đường dẫn (URL) | Tiêu đề Trang | File Mã Nguồn (Source File) | Mô tả Chức năng |
| :--- | :--- | :--- | :--- |
| `/student/classes` | Lớp học phần của Tôi | `src/pages/Student/Classes/StudentClasses.tsx` | Trang đích mặc định của SV. Danh sách các lớp SV đã đăng ký, mã môn học, giảng viên phụ trách, số bài thi cần làm. |
| `/student/classes/:id` | Chi tiết Lớp học phần SV | `src/pages/Student/Classes/StudentClassDetail.tsx` | Xem đề cương chi tiết môn học, chuẩn đầu ra môn học (CLO), danh sách bài giảng/tài liệu và danh sách bài kiểm tra của lớp. |
| `/student/assessments` | Kỳ thi & Khảo thí Trực tuyến | `src/pages/Student/Assessments/StudentAssessments.tsx` | Danh sách bài kiểm tra cần làm, đã hoàn thành hoặc sắp mở; lọc theo lớp học phần; nút Vào thi hoặc Xem lại bài làm. |
| `/student/assessments/:id/instructions` | Quy chế & Hướng dẫn Ca thi | `src/pages/Student/Assessments/AssessmentInstructions.tsx` | Đọc quy chế thi, số lượng câu hỏi, thời gian làm bài, điều kiện chống gian lận (Proctoring lock) trước khi bắt đầu. |
| `/student/assessments/:id/take` | Phòng thi Trực tuyến (Fullscreen Taking) | `src/pages/Student/Assessments/AssessmentTaking.tsx` | Layout làm bài thi toàn màn hình biệt lập (`AssessmentLayout`), đồng hồ đếm ngược, tự động lưu câu trả lời, cảnh báo rời tab, thanh điều hướng 5 dạng câu hỏi (MCQ, True/False, Fill, Multi, Essay). |
| `/student/assessments/:id/submission` | Xác nhận Nộp bài Thành công | `src/pages/Student/Assessments/AssessmentSubmission.tsx` | Thông báo nộp bài thành công, tổng số câu đã làm, thời gian nộp và nút quay về danh sách lớp học. |
| `/student/results` | Kết quả Học tập Toàn diện | `src/pages/Student/Results/StudentResults.tsx` | Tra cứu bảng điểm tổng hợp, điểm kiểm tra định kỳ, GPA dự kiến, tiến độ đạt chuẩn đầu ra CLO. |
| `/student/grade-reviews` | Đơn Phúc khảo Điểm | `src/pages/Student/GradeReviews/GradeReviews.tsx` | Gửi đơn phúc khảo câu hỏi thi (nêu rõ lý do và căn cứ học thuật), theo dõi tiến trình xử lý và kết quả phản hồi của GV. |

---

### 4. Phân hệ Quản trị viên (Admin Module)
Dành cho phòng Đào tạo và Quản trị hệ thống quản lý nhân sự, bảo mật và vận hành.

| Đường dẫn (URL) | Tiêu đề Trang | File Mã Nguồn (Source File) | Mô tả Chức năng |
| :--- | :--- | :--- | :--- |
| `/admin/dashboard` | Tổng quan Hệ thống (Admin Dashboard) | `src/pages/Admin/Dashboard/AdminDashboard.tsx` | Thống kê số lượng GV, SV, môn học, lớp học phần, bài thi đang diễn ra và biểu đồ sức khỏe hệ thống. |
| `/admin/users` | Quản lý Người dùng | `src/pages/Admin/Users/UserManagement.tsx` | Danh sách tài khoản (GV, SV, Admin), phân loại Khoa/Viện, trạng thái Hoạt động/Khóa tài khoản, thêm mới và phân quyền. |
| `/admin/roles` | Phân quyền & Vai trò (RBAC) | `src/pages/Admin/Roles/RoleManagement.tsx` | Quản lý ma trận phân quyền theo vai trò (Xem, Tạo, Sửa, Xóa, Phê duyệt, Chấm bài, Quản trị). |
| `/admin/stats` | Thống kê Học thuật Toàn trường | `src/pages/Admin/Stats/SystemStats.tsx` | Báo cáo tỷ lệ qua môn, phân bổ phổ điểm theo các khoa, tỷ lệ sinh viên đạt chuẩn đầu ra. |
| `/admin/notifications` | Quản lý Thông báo Hệ thống | `src/pages/Admin/Notifications/NotificationManager.tsx` | Tạo và phát thông báo diện rộng tới Giảng viên, Sinh viên hoặc toàn trường. |
| `/admin/audit-logs` | Nhật ký Vận hành Hệ thống | `src/pages/Admin/AuditLogs/AuditLogs.tsx` | Kiểm tra lịch sử thao tác nhạy cảm, địa chỉ IP, hành động sửa điểm, đổi quyền truy cập. |
| `/admin/maintenance` | Chế độ Bảo trì Hệ thống | `src/pages/Admin/Maintenance/MaintenanceMode.tsx` | Bật/tắt chế độ bảo trì để cập nhật server, cấu hình thông điệp thông báo và thời gian bảo trì. |

---

## 🏗️ Cấu Trúc Thư Mục Dự Án (Directory Structure)
```
UI-1110/
├── public/                     # Static assets công khai (Favicon, Logo không nền)
├── src/
│   ├── api/
│   │   └── mocks/              # Mock Service mô phỏng REST API với LocalStorage persistence
│   │       ├── data/           # Mock data phong phú (Users, Classes, Assessments, Rubrics...)
│   │       └── mockService.ts  # Singleton service cung cấp API cho toàn bộ ứng dụng
│   ├── assets/                 # Hình ảnh, biểu trưng chính (Logo VA thương hiệu)
│   ├── components/
│   │   ├── layouts/
│   │   │   ├── MainLayout/     # Layout chuẩn có Sidebar điều hướng, Header tìm kiếm, Role switch
│   │   │   └── AssessmentLayout/ # Layout toàn màn hình chuyên biệt khi sinh viên làm bài thi
│   │   └── velica/
│   │       └── GlobalSearch/   # Spotlight Search Palette (Ctrl+K / ⌘K)
│   ├── constants/              # Khai báo Enum & Constants (Role, Trạng thái bài thi, Loại câu hỏi...)
│   ├── interfaces/             # Định nghĩa Type / Interface TypeScript toàn diện
│   ├── pages/                  # Các trang giao diện theo phân hệ (Admin, Teacher, Student, Auth, Profile)
│   ├── router/
│   │   ├── constants/          # ROUTE_PATHS định danh tập trung mọi đường dẫn
│   │   └── AppRouter.tsx       # Route tree chính với redirect thông minh theo Role
│   ├── styles/                 # Hệ thống CSS module / Vanilla CSS
│   │   ├── theme.css           # Design Tokens, Palette HSL/HEX, Radius, Shadow
│   │   ├── layout.css          # Cấu hình thanh Sidebar, Navbar, Mobile Drawer
│   │   ├── utilities.css       # Các class tiện ích (d-flex, gap, text-truncate, clamp...)
│   │   └── ...                 # Styles đặc thù từng phân hệ
│   ├── App.tsx                 # Entry component với Ant Design ConfigProvider
│   └── main.tsx                # Khởi tạo React DOM root
├── backlog.md                  # Tài liệu tiến độ & Yêu cầu tính năng
├── package.json                # Danh mục phụ thuộc & Script chạy
├── tsconfig.json               # Cấu hình TypeScript
└── vite.config.ts              # Cấu hình Vite bundler
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Getting Started)

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản 18.x trở lên (khuyến nghị Node 20.x hoặc 22.x)
- **NPM**: Phiên bản 9.x trở lên

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Chạy môi trường phát triển (Dev Server)
```bash
npm run dev
```
Ứng dụng sẽ khởi chạy tại: `http://localhost:3000`

### 4. Kiểm tra TypeScript & Đóng gói sản phẩm (Production Build)
```bash
npm run build
```
Kết quả bản dựng sẽ được xuất ra thư mục `dist/`.

---

## 💡 Hướng Dẫn Trải Nghiệm & Demo Nhanh
- **Chuyển đổi góc nhìn nhanh (Role Switcher):** Ngay trên thanh Navbar trên cùng, bạn có thể chuyển đổi tức thì giữa 3 vai trò:
  - **Giảng viên (Teacher):** Trải nghiệm Quản lý Lớp học phần, Soạn đề thi ma trận, Chấm tự luận theo Rubrics.
  - **Sinh viên (Student):** Trải nghiệm Xem đề cương, Vào làm bài thi fullscreen, Xem điểm & Gửi đơn phúc khảo.
  - **Quản trị viên (Admin):** Trải nghiệm Quản lý Người dùng, Phân quyền RBAC, Bật/Tắt chế độ bảo trì.
- **Khôi phục dữ liệu gốc:** Nút **Reset** bên cạnh biểu tượng chuông thông báo cho phép khôi phục toàn bộ Mock Data về trạng thái ban đầu bất cứ lúc nào.
- **Tìm kiếm toàn cục:** Nhấn tổ hợp phím **⌘K** (hoặc **Ctrl+K**) để mở thanh tìm kiếm nhanh mọi trang và tài nguyên trong hệ thống.

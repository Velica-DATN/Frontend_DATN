# 🎓 VELICA ACADEMIC ASSESSMENT PLATFORM
## TÀI LIỆU THIẾT KẾ KIẾN TRÚC MICROSERVICES & DATABASE POSTGRESQL TOÀN DIỆN
> **Dự án:** Hệ thống Khảo thí & Đánh giá Chuẩn đầu ra Học thuật Trực tuyến (Velica Platform)  
> **Chuyên ngành:** Kỹ thuật Phần mềm (Software Engineering — Thesis SP27)  
> **Kiến trúc:** Microservices (Database-per-Service) + Event-Driven Messaging (Kafka) + High-Throughput In-Memory Caching (Redis) + Spring Cloud & OpenFeign + React Frontend  

---

## MỤC LỤC
1. [TỔNG QUAN HỆ THỐNG & BỐI CẢNH NGHIỆP VỤ](#1-tổng-quan-hệ-thống--bối-cảnh-nghiệp-vụ)
2. [CÔNG NGHỆ & KIẾN TRÚC HẠ TẦNG (TECH STACK & TOPOLOGY)](#2-công-nghệ--kiến-trúc-hạ-tầng-tech-stack--topology)
3. [DANH MỤC BACKLOG & MA TRẬN PHÂN CHIA USE CASE (83 USE CASES)](#3-danh-mục-backlog--ma-trận-phân-chia-use-case-83-use-cases)
4. [LUỒNG NGHIỆP VỤ CỐT LÕI & CƠ CHẾ SNAPSHOT 2 TẦNG](#4-luồng-nghiệp-vụ-cốt-lõi--cơ-chế-snapshot-2-tầng)
5. [THIẾT KẾ TOÀN DIỆN CƠ SỞ DỮ LIỆU POSTGRESQL (FULL SQL DDL)](#5-thiết-kế-toàn-diện-cơ-sở-dữ-liệu-postgresql-full-sql-ddl)
   - [5.1. Database: `identity_db`](#51-database-identity_db)
   - [5.2. Database: `classroom_db`](#52-database-classroom_db)
   - [5.3. Database: `learning_content_db`](#53-database-learning_content_db)
   - [5.4. Database: `assessment_db`](#54-database-assessment_db)
   - [5.5. Database: `assessment_delivery_db`](#55-database-assessment_delivery_db)
   - [5.6. Database: `analytics_db`](#56-database-analytics_db)
   - [5.7. Database: `notification_db`](#57-database-notification_db)
6. [THIẾT KẾ GIAO TIẾP OPENFEIGN, KAFKA VÀ TẦNG CACHE REDIS](#6-thiết-kế-giao-tiếp-openfeign-kafka-và-tầng-cache-redis)
7. [KẾT LUẬN & HƯỚNG DẪN TRIỂN KHAI](#7-kết-luận--hướng-dẫn-triển-khai)

---

## 1. TỔNG QUAN HỆ THỐNG & BỐI CẢNH NGHIỆP VỤ

### 1.1. Bối cảnh
**Velica** là hệ thống khảo thí trực tuyến và quản lý đào tạo học thuật theo định hướng chuẩn đầu ra (**OBE - Outcome-Based Education** / chuẩn kiểm định quốc tế ABET, AUN-QA). Hệ thống khép kín toàn bộ vòng đời học thuật bao gồm:
1. **Quản trị Đề cương (Syllabus):** Định nghĩa chuẩn đầu ra (Course Learning Objectives - CLOs), tỷ lệ % điểm thành phần, lộ trình giảng dạy và giáo trình.
2. **Kho tài nguyên Bài học & Ngân hàng Câu hỏi:** Quản lý câu hỏi đa dạng (Trắc nghiệm đơn, Nhiều đáp án, Đúng/Sai, Điền khuyết, Tự luận) gắn với cấp độ tư duy nhận thức Bloom (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
3. **Soạn thảo Đề thi & Ma trận khảo thí:** Hỗ trợ chọn câu hỏi thủ công hoặc sinh đề thi tự động theo tỷ lệ Bloom/CLO, thiết lập quy chế phòng thi, chính sách nộp trễ và ma trận barem Rubric tự luận.
4. **Phòng thi Khảo thí Trực tuyến Chống Gian lận (Proctoring Taking):** Hỗ trợ sinh viên làm bài toàn màn hình, lưu câu trả lời tự động định kỳ (Autosave 5s), chịu lỗi mất kết nối mạng và giám sát hành vi gian lận (rời tab, thoát toàn màn hình, mất focus).
5. **Chấm thi Tự động & Bàn chấm Rubric:** Tự động đối chiếu điểm trắc nghiệm tức thời, đưa bài tự luận vào hàng đợi để giảng viên chấm theo Rubric đa tiêu chí.
6. **Công bố Điểm, Phúc khảo & Vết kiểm toán (Audit Trail):** Chốt điểm chính thức, ghi nhận lịch sử điều chỉnh điểm (Grade Override Log), tiếp nhận và giải quyết đơn phúc khảo của sinh viên.
7. **Phân tích Báo cáo Học thuật & Xuất Excel:** Tính toán phổ điểm, độ khó thực tế của câu hỏi ($P$-value, Discrimination Index $D$), tỷ lệ sinh viên đạt chuẩn CLO và xuất bảng điểm Excel chuẩn BOM.

### 1.2. Phân chia Phạm vi Đồ án (5 Thành viên)
- **Đăng (Auth, Profile, Class & Analytics):** Xác thực, Hồ sơ cá nhân, Vòng đời lớp học, Quản lý thành viên (Ban/Xóa mềm/Khôi phục), Bảng điểm tổng hợp lớp và Thống kê CLO.
- **Vinh (Syllabus & Question Bank):** Đề cương môn học, Bài học, Ngân hàng câu hỏi 5 định dạng, Cấp độ Bloom và Ánh xạ câu hỏi vào bài học.
- **Tân (Assessment, Policy & Grading):** Soạn đề thi wizard, Quy chế thi & Nộp trễ, Bốc đề ma trận CLO, Tự động chấm MCQ, Bàn chấm Rubric tự luận, Sửa điểm (Grade Override), Đơn phúc khảo và Nhật ký kiểm toán đề thi (Audit Log).
- **Long (Assessment Delivery & Proctoring):** Phòng thi trực tuyến, Lưu tự động đáp án, Chịu lỗi mất mạng, Nộp bài, Bảng điều khiển giám sát trực tiếp cho giảng viên (tiến độ, nhịp tim mạng, cảnh báo vi phạm chuyển tab).
- **Kiệt (Admin System, Statistics & Rubrics):** Quản trị người dùng, Phân quyền RBAC, Bật/tắt bảo trì hệ thống, Thống kê vĩ mô toàn trường, Phát thông báo diện rộng và Thư viện tiêu chí Rubrics.

---

## 2. CÔNG NGHỆ & KIẾN TRÚC HẠ TẦNG (TECH STACK & TOPOLOGY)

```
                                      [ React 18 + Vite 6 + AntD 5 ]
                                                    │
                                                    ▼
                                     [ API Gateway (Spring Cloud) ]
                                      Port 8080 | RateLimiter Redis
                                                    │
        ┌───────────────┬───────────────────────────┼───────────────────────────┬───────────────┐
        ▼               ▼                           ▼                           ▼               ▼
[Identity Svc]  [Classroom Svc]         [Learning Content Svc]          [Assessment Svc] [Delivery Svc]
 (Port 8081)      (Port 8082)                (Port 8083)                   (Port 8084)     (Port 8085)
      │                │                           │                            │               │
  [Postgres]       [Postgres]                  [Postgres]                   [Postgres]      [Postgres]
 (identity_db)   (classroom_db)          (learning_content_db)          (assessment_db)  (delivery_db)
      │                │                           │                            │               │
      └────────────────┴─────────────┬─────────────┴────────────────────────────┴───────────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                ▼                    ▼                    ▼
       [OpenFeign (Sync)]    [Kafka Cluster (Async)] [Redis Cluster]
       (RPC Inter-Service)  (Events: Submit, Audit) (Cache, Session, WS)
                                     │
                ┌────────────────────┴────────────────────┐
                ▼                                         ▼
       [Analytics Service]                       [Notification Service]
           (Port 8086)                                (Port 8087)
           [Postgres]                                  [Postgres]
         (analytics_db)                              (notification_db)
```

| Tầng Kiến Trúc | Công Nghệ Sử Dụng | Phiên Bản | Vai Trò & Nhiệm Vụ |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | React, TypeScript, Vite, Ant Design, Recharts, Lucide | 18.x, TS 5.7, Vite 6, AntD 5.24 | Giao diện Single Page Application (SPA), đáp ứng 83 use cases, lưu offline cache. |
| **API Gateway** | Spring Cloud Gateway (WebFlux Reactive) | Spring Boot 3.3.x, Cloud 2023 | Đón nhận toàn bộ request, xác thực JWT, bảo vệ hệ thống bằng Redis Token-Bucket Rate Limiter. |
| **Service Discovery** | Netflix Eureka Server | Spring Cloud Netflix Eureka | Định danh và khám phá dịch vụ động (`lb://`), quản lý nhịp tim heartbeat giữa các instance. |
| **Config Server** | Spring Cloud Config Server | Spring Cloud Config Native/Git | Lưu trữ và phân phối tập trung cấu hình `application.yml` cho mọi môi trường dev/staging/prod. |
| **Backend Core** | Spring Boot, Spring Data JPA, Hibernate, Lombok | Spring Boot 3.3+, Java 21 LTS | Xây dựng RESTful API, xử lý nghiệp vụ khảo thí và kiểm soát giao dịch ACID. |
| **RPC Inter-service**| Spring Cloud OpenFeign + Resilience4j | OpenFeign 4.1.x | Gọi API trực tiếp giữa các service (đồng bộ) có kèm cơ chế ngắt mạch Circuit Breaker. |
| **Message Broker** | Apache Kafka Cluster | Confluent / Apache Kafka 3.7+ | Truyền nhận thông điệp phi đồng bộ (Event-driven): nộp bài, gian lận, duyệt điểm, phúc khảo. |
| **In-Memory Cache** | Redis Cluster | Redis 7.2+ | Tầng đệm siêu tốc: Blacklist token, Autosave đáp án mỗi 5s, Heartbeat thí sinh, Redlock Submit. |
| **RDBMS Core** | PostgreSQL | PostgreSQL 15+ / 16 | Lưu trữ bền vững dữ liệu quan hệ, hỗ trợ mạnh mẽ kiểu dữ liệu `JSONB` cho Snapshot và Bareme. |

---

## 3. DANH MỤC BACKLOG & MA TRẬN PHÂN CHIA USE CASE (83 USE CASES)

### 3.1. Phân hệ 1: Xác thực, Hồ sơ & Quản trị Lớp học (Đăng - 19 UCs)
| STT | Use Case | Tác Nhân | Mô Tả Nghiệp Vụ | Service Phụ Trách | Database & Lưu Trữ |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | Register | ALL | Đăng ký tài khoản mới với họ tên, email, mật khẩu. | Identity Service | `identity_db.users` |
| 2 | Login | ALL | Đăng nhập tài khoản, xác thực mật khẩu Bcrypt, cấp JWT. | Identity Service | `identity_db.users`, `user_refresh_tokens` |
| 3 | Logout | ALL | Đăng xuất phiên làm việc, đưa JWT Token ID vào Blacklist. | Identity Service | Redis `auth:jwt:blacklist:{jti}` |
| 4 | View Profile | ALL | Xem thông tin lý lịch cá nhân của bản thân. | Identity Service | `identity_db.users` |
| 5 | Update Profile | ALL | Cập nhật số điện thoại, đơn vị trực thuộc. | Identity Service | `identity_db.users` |
| 6 | Change Password | ALL | Đổi mật khẩu cá nhân, xác minh mật khẩu cũ. | Identity Service | `identity_db.users` |
| 7 | Create Class | Teacher | Tạo lớp học phần mới (Tên lớp, Mã lớp, Học kỳ, Đề cương). | Classroom Service | `classroom_db.classrooms` |
| 8 | View Class | Teacher/Student| Xem thông tin chi tiết lớp học phần và giáo trình. | Classroom Service | `classroom_db.classrooms` |
| 9 | Update Class | Teacher | Cập nhật thông tin lớp, giảng viên, môn học. | Classroom Service | `classroom_db.classrooms` |
| 10 | Delete Class | Teacher | Xóa lớp: xóa cứng nếu chưa có điểm, xóa mềm nếu đã có bài thi. | Classroom Service | `classroom_db.classrooms` (`is_deleted`) |
| 11 | Add Class Members | Teacher | Thêm từng sinh viên hoặc import Excel danh sách vào lớp. | Classroom Service | `classroom_db.classmembers` |
| 12 | Ban Class Members | Teacher | Cấm sinh viên trong lớp (Class Ban) hoặc đề xuất Global Ban. | Classroom & Identity | `class_members.is_banned`, `users.is_global_banned` |
| 13 | View Class Members | Teacher | Xem danh sách thành viên, số bài thi đã làm, tỷ lệ hoàn thành. | Classroom Service | `classroom_db.class_members` |
| 14 | Delete Class Member | Teacher | Xóa thành viên: xóa cứng nếu chưa thi, xóa mềm nếu đã có điểm. | Classroom Service | `classroom_db.class_members` (`is_deleted`) |
| 15 | Member Statistics | Teacher | Xem chi tiết kết quả học tập và tiến độ CLO của 1 sinh viên. | Analytics Service | `analytics_db.class_student_analytics` |
| 16 | Class Statistics | Teacher | Xem bảng điểm tổng quan, phổ điểm và tỷ lệ đạt chuẩn toàn lớp. | Analytics Service | `analytics_db.class_student_analytics` |
| 17 | Question Statistics | Teacher | Xem thống kê số lần làm và tỷ lệ đúng/sai theo từng câu hỏi. | Analytics Service | `analytics_db.question_difficulty_stats` |
| 18 | Level Acceptance | Teacher | Thống kê tỷ lệ chấp nhận của câu hỏi theo độ khó Bloom. | Analytics Service | `analytics_db.question_difficulty_stats` |
| 19 | Export Excel Analytics | Teacher | Xuất bảng điểm lớp và báo cáo chuẩn đầu ra ra file Excel BOM. | Analytics Service | Streaming Excel Apache POI |

---

### 3.2. Phân hệ 2: Đề cương, Bài học & Ngân hàng Câu hỏi (Vinh - 20 UCs)
| STT | Use Case | Tác Nhân | Mô Tả Nghiệp Vụ | Service Phụ Trách | Database & Lưu Trữ |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | Create Syllabus | Teacher | Tạo đề cương môn học mới (Mã môn, Tên môn, Số tín chỉ, CLO).| Learning Content | `learning_content_db.syllabi` |
| 2 | Update Syllabus | Teacher | Chỉnh sửa nội dung đề cương, tài liệu và thành phần đánh giá. | Learning Content | `learning_content_db.syllabi` |
| 3 | Delete Syllabus | Teacher | Xóa đề cương môn học (chặn xóa nếu đã có lớp học liên kết). | Learning Content | `learning_content_db.syllabi` |
| 4 | View Syllabus | ALL | Xem chi tiết đề cương, chuẩn đầu ra và danh mục bài học. | Learning Content | `learning_content_db.syllabi` |
| 5 | Search Syllabus | ALL | Tìm kiếm đề cương theo tên môn học hoặc mã học phần. | Learning Content | `learning_content_db.syllabi` (Index B-Tree) |
| 6 | Create Lesson | Teacher | Tạo bài giảng lý thuyết gắn với đề cương cụ thể. | Learning Content | `learning_content_db.lessons` |
| 7 | Update Lesson | Teacher | Chỉnh sửa nội dung bài giảng (Markdown/Rich Text). | Learning Content | `learning_content_db.lessons` |
| 8 | Delete Lesson | Teacher | Xóa bài giảng khỏi đề cương môn học. | Learning Content | `learning_content_db.lessons` |
| 9 | View Lessons | Teacher | Xem danh sách bài học thuộc đề cương và số lượng câu hỏi gán. | Learning Content | `learning_content_db.lessons` |
| 10 | Search Lessons | Teacher | Tìm kiếm bài học theo từ khóa tiêu đề hoặc đề cương. | Learning Content | `learning_content_db.lessons` |
| 11 | Create Question | Teacher | Tạo câu hỏi (MCQ, Multi, TF, Fill, Essay) vào Question Bank. | Learning Content | `questions`, `question_options` |
| 12 | Update Question | Teacher | Sửa đề bài, phương án chọn, đáp án đúng hoặc lời giải thích. | Learning Content | `questions`, `question_options` |
| 13 | Delete Question | Teacher | Xóa câu hỏi (ngăn chặn nếu đã nằm trong đề thi đã xuất bản). | Learning Content | `learning_content_db.questions` |
| 14 | View Questions | Teacher | Xem danh sách câu hỏi dạng thẻ hoặc bảng trong Question Bank. | Learning Content | `learning_content_db.questions` |
| 15 | Search Questions | Teacher | Lọc câu hỏi theo Dạng câu, Mức độ Bloom, Bài học và CLO. | Learning Content | Full-text Search Index PostgreSQL |
| 16 | Create Question Level| Teacher | Định nghĩa mức độ nhận thức (Nhận biết, Thông hiểu, Vận dụng).| Learning Content | `learning_content_db.question_levels` |
| 17 | Update Question Level| Teacher | Chỉnh sửa tên mức độ nhận thức và mô tả năng lực đánh giá. | Learning Content | `learning_content_db.question_levels` |
| 18 | Delete Question Level| Teacher | Xóa mức độ câu hỏi (Ràng buộc RESTRICT chặn xóa nếu đang dùng).| Learning Content | `question_levels` (Foreign Key Restrict) |
| 19 | View Question Levels| Teacher | Xem danh sách mức độ nhận thức và số câu hỏi đang sử dụng. | Learning Content | `learning_content_db.question_levels` |
| 20 | Remove Q from Lesson | Teacher | Gỡ câu hỏi khỏi bài học nhưng vẫn giữ nguyên trong kho chung. | Learning Content | `learning_content_db.lesson_questions` |

---

### 3.3. Phân hệ 3: Thiết lập Đề thi, Chấm điểm & Phúc khảo (Tân & Kiệt - 20 UCs)
| STT | Use Case | Tác Nhân | Mô Tả Nghiệp Vụ | Service Phụ Trách | Database & Lưu Trữ |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | Create Assessment | Teacher | Tạo bài kiểm tra nháp (Quiz, Midterm, Final, Assignment). | Assessment Service | `assessment_db.assessments` |
| 2 | Update Assessment | Teacher | Chỉnh sửa thông tin đề thi khi ở trạng thái Draft hoặc Scheduled. | Assessment Service | `assessment_db.assessments` |
| 3 | Config Structure | Teacher | Cấu hình tổng số câu, thang điểm (10/100), thời lượng làm bài. | Assessment Service | `assessment_db.assessments` |
| 4 | Select Questions | Teacher | Chọn câu hỏi thủ công hoặc thiết lập ma trận sinh đề tự động. | Assessment Service | `assessment_questions` |
| 5 | Exam Policy | Teacher | Thiết lập giờ mở/đóng đề, số lượt làm, xáo câu hỏi/đáp án. | Assessment Service | `assessment_db.assessments` |
| 6 | Late Policy | Teacher | Cấu hình hạn nộp muộn Deadline 2 và % phạt điểm khi nộp trễ. | Assessment Service | `assessment_db.assessments` |
| 7 | Map CLO | Teacher | Gán chuẩn đầu ra môn học cho đề thi hoặc từng câu hỏi cụ thể. | Assessment Service | `assessment_db.assessments` |
| 8 | Publish Assessment | Teacher | Duyệt và xuất bản đề thi; ĐÓNG BĂNG SNAPSHOT CÂU HỎI & KHÓA ĐỀ.| Assessment Service | `assessments.status = 'PUBLISHED'` |
| 9 | Auto Grade MCQ | System | Tự động chấm tức thời các câu hỏi khách quan khi nộp bài. | Assessment Service | `submission_answers.points_awarded` |
| 10 | Manual Grading | Teacher | Chấm bài tự luận dài: đọc bài làm, cho điểm và nhập feedback. | Assessment Service | `submission_answers` |
| 11 | Apply Rubric | Teacher | Áp dụng thang đo Rubric tiêu chí để tính điểm tự luận minh bạch.| Assessment Service | `rubrics`, `rubric_criteria`, `rubric_levels` |
| 12 | Official Results | Teacher | Tổng duyệt phổ điểm toàn lớp và xác nhận chốt điểm chính thức.| Assessment Service | `submissions.is_official_confirmed` |
| 13 | Override Grade | Teacher | Sửa điểm sinh viên khi có sai sót; bắt buộc nhập lý do điều chỉnh.| Assessment Service | `assessment_db.grade_override_logs` |
| 14 | Request Grade Appeal | Student | Sinh viên gửi đơn phúc khảo cho câu hỏi cụ thể kèm giải trình. | Assessment Service | `assessment_db.grade_appeals` |
| 15 | Review Grade Appeal | Teacher | Giảng viên xem bài thi gốc, chấp nhận sửa điểm hoặc từ chối đơn. | Assessment Service | `grade_appeals`, `grade_override_logs` |
| 16 | Item Analysis | Teacher | Phân tích độ khó thực tế ($P$-value) và độ phân biệt ($D$). | Analytics Service | `analytics_db.question_difficulty_stats` |
| 17 | View Audit Log | Teacher | Tra cứu toàn bộ lịch sử chỉnh sửa cấu hình đề và thay đổi điểm. | Assessment Service | `assessment_db.assessment_audit_logs` |
| 18 | Create Writing Rubric| Teacher | Tạo tiêu chí Rubric đánh giá bài luận trong Thư viện Rubric. | Assessment Service | `assessment_db.rubrics` |
| 19 | Update Writing Rubric| Teacher | Cập nhật mô tả tiêu chí và điểm số các mức độ của Rubric. | Assessment Service | `assessment_db.rubrics` |
| 20 | Delete Writing Rubric| Teacher | Xóa thang Rubric khỏi thư viện dùng chung. | Assessment Service | `assessment_db.rubrics` |

---

### 3.4. Phân hệ 4: Trải nghiệm Làm bài & Giám sát Phòng thi (Long - 17 UCs)
| STT | Use Case | Tác Nhân | Mô Tả Nghiệp Vụ | Service Phụ Trách | Database & Lưu Trữ |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | Available Assessments| Student | Xem danh sách bài kiểm tra được phép làm và thời gian bắt đầu. | Assessment Svc | `assessment_db.assessments` |
| 2 | Start Assessment | Student | Đọc quy chế, bấm Bắt đầu thi; hệ thống tạo phiên làm bài. | Delivery Service | `assessment_delivery_db.assessment_sessions` |
| 3 | View Questions | Student | Đọc nội dung câu hỏi và các lựa chọn đáp án từ bản Snapshot. | Delivery Service | Redis `exam:snapshot:{assessmentId}` |
| 4 | Answer Questions | Student | Chọn đáp án hoặc soạn thảo tự luận; hệ thống ghi nhận tức thời. | Delivery Service | Redis Hash `exam:session:{id}:answers` |
| 5 | Navigate Questions | Student | Chuyển đổi giữa các câu hỏi, xem danh sách câu đã/chưa làm. | Delivery Service | Client State & Redis Buffer |
| 6 | Save Answers | Student | Tự động lưu đáp án định kỳ mỗi 5s lên server chống mất dữ liệu. | Delivery Service | Redis Buffer $\rightarrow$ DB Sync Background |
| 7 | Handle Disconnection | Student | Khi mất mạng: lưu tạm vào LocalStorage; có mạng lại: tự đồng bộ.| Delivery Service | Frontend IndexedDB/LocalStorage |
| 8 | Submit Assessment | Student | Nộp bài thi: đối soát số câu, đóng phiên thi và khóa bài nộp. | Delivery Service | Redlock `exam:lock:submit:{sessionId}` |
| 9 | Submission Status | Student | Xem trạng thái bài làm: Đang làm, Đã nộp thành công, Hết giờ. | Delivery Service | `assessment_sessions.status` |
| 10 | Monitor Status | Teacher | Giám sát trạng thái từng SV thời gian thực: Chưa thi, Đang thi... | Delivery Service | Redis Set `exam:live:{asmId}:students` |
| 11 | Monitor Progress | Teacher | Theo dõi số câu đã làm, số câu chưa làm và % tiến độ của cả lớp. | Delivery Service | Redis Hash & WebSocket Stomp |
| 12 | Monitor Connection | Teacher | Theo dõi nhịp tim kết nối của SV: Đang kết nối, Mất mạng. | Delivery Service | Redis Key `exam:session:{id}:heartbeat` |
| 13 | View Last Activity | Teacher | Xem thời điểm thao tác gần nhất để phát hiện thí sinh treo máy. | Delivery Service | `assessment_sessions.last_activity_time` |
| 14 | Monitor Submission | Teacher | Nhận thông báo thời gian thực ngay khi từng thí sinh nộp bài. | Delivery Service | Kafka Event `assessment.submitted` |
| 15 | Monitor Time | Teacher | Theo dõi đồng hồ đếm ngược từng SV; tự động thu bài khi hết giờ. | Delivery Service | Scheduled Task `SessionTimeoutManager` |
| 16 | Monitor Violations | Teacher | Ghi nhận hành vi vi phạm (rời tab, thoát toàn màn hình). | Delivery Service | `session_violations`, Kafka Event |
| 17 | Violation Details | Teacher | Xem chi tiết timeline từng lần vi phạm kèm loại và thời lượng. | Delivery Service | `assessment_delivery_db.session_violations` |

---

### 3.5. Phân hệ 5: Quản trị Hệ thống, Vận hành & Phân quyền (Kiệt - 15 UCs)
| STT | Use Case | Tác Nhân | Mô Tả Nghiệp Vụ | Service Phụ Trách | Database & Lưu Trữ |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | Create User Account | Admin | Tạo tài khoản mới cho GV, SV hoặc Quản trị viên. | Identity Service | `identity_db.users` |
| 2 | View & Search Users | Admin | Xem danh sách và tìm kiếm người dùng theo họ tên, email, khoa. | Identity Service | `identity_db.users` |
| 3 | Update User Profile | Admin | Khóa tài khoản, cập nhật đơn vị hoặc vai trò người dùng. | Identity Service | `identity_db.users` |
| 4 | Delete / Restore User| Admin | Xóa mềm tài khoản người dùng để giữ nguyên lịch sử khảo thí. | Identity Service | `users.is_deleted` & `deleted_at` |
| 5 | Reset User Password | Admin | Đặt lại mật khẩu mặc định khi người dùng báo mất tài khoản. | Identity Service | `identity_db.users` |
| 6 | Create User Role | Admin | Tạo vai trò người dùng mới trong hệ sinh thái đào tạo. | Identity Service | `identity_db.roles` |
| 7 | View User Roles | Admin | Xem danh mục vai trò và số lượng tài khoản được gán vai trò đó. | Identity Service | `identity_db.roles` |
| 8 | Update Role Perms | Admin | Điều chỉnh ma trận quyền hạn granular cho từng vai trò. | Identity Service | `identity_db.role_permissions` |
| 9 | Delete User Role | Admin | Xóa vai trò người dùng (chặn xóa 3 vai trò gốc ADMIN/GV/SV). | Identity Service | `roles.is_system_default` |
| 10 | Search User Roles | Admin | Tìm kiếm vai trò theo tên hoặc quyền hạn. | Identity Service | `identity_db.roles` |
| 11 | System Stats Dash | Admin | Dashboard thống kê vĩ mô: tổng số GV, SV, môn học, bài thi. | Analytics Service | `analytics_db.system_stats_snapshots` |
| 12 | Export System Stats | Admin | Xuất số liệu thống kê hoạt động toàn trường ra file Excel. | Analytics Service | Streaming Excel Apache POI |
| 13 | Broadcast Notif | Admin | Phát thông báo toàn trường hoặc lọc theo đối tượng nhận. | Notification Svc | `notification_db.system_notifications` |
| 14 | View Audit Logs | Admin | Xem lịch sử thao tác quan trọng trên hệ thống của mọi tài khoản. | Assessment Svc | `assessment_db.assessment_audit_logs` |
| 15 | Maintenance Mode | Admin | Bật/tắt chế độ bảo trì hệ thống; hiển thị trang thông báo tĩnh. | Identity Service | `identity_db.system_maintenance` |

---

## 4. LUỒNG NGHIỆP VỤ CỐT LÕI & CƠ CHẾ SNAPSHOT 2 TẦNG

Trong hệ thống khảo thí trực tuyến, **Snapshot là cơ chế sống còn** đảm bảo tính toàn vẹn học thuật và độc lập giữa các microservices.

```
                              QUY TRÌNH SNAPSHOT 2 TẦNG
                              
[ Giai đoạn Soạn Thảo (Draft) ]
Giảng viên chọn câu hỏi ────────► Chỉ lưu question_id (Tham chiếu động sang Ngân hàng câu hỏi)
                                             │
                                             ▼
[ Giai đoạn Xuất Bản (Publish) ] ───► TẦNG 1: EXAM DEFINITION SNAPSHOT
                                      - Gọi OpenFeign sang Learning Content Svc lấy trọn vẹn:
                                        Đề bài, Các lựa chọn, Đáp án đúng, Giải thích, Rubric.
                                      - Đóng băng vào cột JSONB: assessment_questions.question_snapshot
                                      - Khóa đề thi (status = 'PUBLISHED', is_locked = true).
                                      - Nạp Snapshot vào Redis: exam:snapshot:{assessmentId}
                                             │
                                             ▼
[ Giai đoạn Phòng Thi (Taking) ] ────► - 10.000 sinh viên vào thi ĐỌC THẲNG TỪ REDIS SNAPSHOT.
                                      - Không gọi sang Question Bank.
                                      - Lưu đáp án mỗi 5s vào Redis buffer: exam:session:{id}:answers
                                             │
                                             ▼
[ Giai đoạn Nộp Bài (Submit) ] ──────► TẦNG 2: SUBMISSION ANSWER SNAPSHOT
                                      - Ghi bản ghi nộp bài bất biến vào bảng submission_answers:
                                        + Đề bài lúc SV đọc (question_content_snapshot)
                                        + Đáp án chính xác lúc nộp (correct_answer_snapshot)
                                        + Lựa chọn của SV (student_answer)
                                        + Điểm tối đa (max_points)
                                             │
                                             ▼
[ Chấm Bài & Phúc Khảo ] ────────────► Giảng viên chấm tự luận theo Rubric và giải quyết khiếu nại
                                      đối soát 100% dựa trên bản Snapshot nguyên bản lúc SV nộp bài.
```

---

## 5. THIẾT KẾ TOÀN DIỆN CƠ SỞ DỮ LIỆU POSTGRESQL (FULL SQL DDL)

Tất cả các script DDL dưới đây đều được chuẩn hóa theo chuẩn **PostgreSQL 15+**, bao gồm đầy đủ **Extension UUID**, **Khóa chính**, **Khóa ngoại**, **Ràng buộc toàn vẹn**, **Ràng buộc xóa mềm (Soft-delete)**, và **Chỉ mục hiệu năng cao (B-Tree, GIN cho JSONB)**.

---

### 5.1. Database: `identity_db`
> Quản lý người dùng, phân quyền RBAC, phiên làm việc và chế độ bảo trì hệ thống.

```sql
CREATE DATABASE identity_db;
\c identity_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Vai trò Người dùng (Roles)
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY, -- 'ROLE_ADMIN', 'ROLE_TEACHER', 'ROLE_STUDENT'
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE, -- Chặn xóa vai trò mặc định (#9 Kiệt)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Quyền hạn Chi tiết (Permissions)
CREATE TABLE permissions (
    id VARCHAR(100) PRIMARY KEY, -- e.g., 'ASSESSMENT:CREATE', 'GRADE:OVERRIDE'
    module VARCHAR(50) NOT NULL, -- 'ASSESSMENT', 'CLASSROOM', 'CONTENT', 'SYSTEM'
    name VARCHAR(150) NOT NULL,
    description TEXT
);

-- 3. Bảng Ma trận Phân quyền (Role_Permissions)
CREATE TABLE role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. Bảng Tài khoản Người dùng (Users)
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'user-admin-1', 'user-teacher-1'
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20),
    department VARCHAR(150),
    avatar_url VARCHAR(500),
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_global_banned BOOLEAN NOT NULL DEFAULT FALSE, -- Cấm trên toàn hệ thống (#12 Đăng)
    ban_reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Xóa mềm (#4 Kiệt)
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_active_filter ON users(is_active, is_deleted, is_global_banned);

-- 5. Bảng Quản lý Refresh Token & Phiên Đăng nhập
CREATE TABLE user_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_token_user ON user_refresh_tokens(user_id);

-- 6. Bảng Cấu hình Chế độ Bảo trì Hệ thống (#15 Kiệt)
CREATE TABLE system_maintenance (
    id SERIAL PRIMARY KEY,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    message TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    estimated_end_time TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(64) REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5.2. Database: `classroom_db`
> Quản lý không gian lớp học phần, ghi danh sinh viên, cấm thi nội bộ lớp và xóa mềm an toàn.

```sql
CREATE DATABASE classroom_db;
\c classroom_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Lớp học phần (Classrooms)
CREATE TABLE classrooms (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'cls-101'
    code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'SE1801-MSS301'
    name VARCHAR(200) NOT NULL,
    description TEXT,
    term VARCHAR(50) NOT NULL, -- e.g., 'Spring 2026'
    teacher_id VARCHAR(64) NOT NULL, -- ID Giảng viên từ Identity Service
    teacher_name VARCHAR(150) NOT NULL, -- Snapshot họ tên để hiển thị nhanh
    syllabus_id VARCHAR(64) NOT NULL, -- ID Đề cương từ Learning Content Service
    syllabus_name VARCHAR(255),
    enrollment_key VARCHAR(50), -- Mã lớp sinh viên tự ghi danh (#10 Đăng)
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Xóa mềm bảo toàn dữ liệu khảo thí (#10 Đăng)
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_classrooms_teacher ON classrooms(teacher_id);
CREATE INDEX idx_classrooms_term ON classrooms(term);
CREATE INDEX idx_classrooms_syllabus ON classrooms(syllabus_id);
CREATE INDEX idx_classrooms_active ON classrooms(is_deleted);

-- 2. Bảng Danh sách Thành viên Lớp học (Class Members)
CREATE TABLE class_members (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'clsm-1'
    class_id VARCHAR(64) NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL, -- Sinh viên từ Identity Service
    student_code VARCHAR(50), -- MSSV (e.g. SE170123)
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    member_role VARCHAR(30) NOT NULL DEFAULT 'STUDENT', -- 'STUDENT', 'TEACHING_ASSISTANT'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE, -- Cấm thi trong phạm vi lớp học (#12 Đăng)
    ban_reason TEXT,
    banned_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE, -- Xóa mềm thành viên (#14 Đăng)
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uq_class_member_user UNIQUE(class_id, user_id)
);

CREATE INDEX idx_members_class ON class_members(class_id);
CREATE INDEX idx_members_user ON class_members(user_id);
CREATE INDEX idx_members_status ON class_members(class_id, is_deleted, is_banned);
```

---

### 5.3. Database: `learning_content_db`
> Quản trị đề cương học thuật (Syllabus), chuẩn đầu ra CLO, bài học lý thuyết và ngân hàng câu hỏi khảo thí.

```sql
CREATE DATABASE learning_content_db;
\c learning_content_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Chuẩn đầu ra Môn học (CLO - Course Learning Objectives)
CREATE TABLE learning_objectives (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'clo-1'
    syllabus_id VARCHAR(64) NOT NULL,
    code VARCHAR(20) NOT NULL, -- e.g., 'CLO1', 'CLO2'
    description TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clo_syllabus ON learning_objectives(syllabus_id);

-- 2. Bảng Đề cương Môn học (Syllabus)
CREATE TABLE syllabi (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'syl-1'
    code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'MSS301'
    name VARCHAR(255) NOT NULL,
    course_name_english VARCHAR(255),
    description TEXT,
    credits INT NOT NULL DEFAULT 3,
    degree_level VARCHAR(50) DEFAULT 'Bachelor',
    time_allocation VARCHAR(255),
    pre_requisite VARCHAR(100),
    scoring_scale INT NOT NULL DEFAULT 10,
    min_avg_mark_to_pass NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    decision_no VARCHAR(100),
    approved_date DATE,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    materials JSONB DEFAULT '[]'::jsonb, -- Danh mục tài liệu, giáo trình tham khảo
    assessment_schema JSONB DEFAULT '[]'::jsonb, -- Tỷ lệ % bài tập, giữa kỳ, đồ án
    sessions_plan JSONB DEFAULT '[]'::jsonb, -- 60 slot lộ trình buổi học
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_syllabi_code ON syllabi(code);
CREATE INDEX idx_syllabi_materials_gin ON syllabi USING GIN (materials);

-- 3. Bảng Bài học / Chương trình Lý thuyết (Lessons)
CREATE TABLE lessons (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'les-1'
    syllabus_id VARCHAR(64) NOT NULL REFERENCES syllabi(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT, -- Nội dung bài giảng định dạng Rich Text HTML hoặc Markdown
    order_index INT NOT NULL DEFAULT 1,
    clo_ids TEXT[], -- Danh sách mã CLO liên kết: ARRAY['clo-1', 'clo-2']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lessons_syllabus ON lessons(syllabus_id);

-- 4. Bảng Mức độ Nhận thức Bloom (Question Levels) (#16-19 Vinh)
CREATE TABLE question_levels (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'lvl-1'
    level_key VARCHAR(50) NOT NULL UNIQUE, -- 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'
    name VARCHAR(100) NOT NULL, -- Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao
    weight NUMERIC(4,2) NOT NULL DEFAULT 1.0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng Ngân hàng Câu hỏi Khảo thí (Question Bank)
CREATE TABLE questions (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'q-101'
    content TEXT NOT NULL, -- Nội dung câu hỏi (hỗ trợ công thức Toán LaTeX, code block)
    type VARCHAR(30) NOT NULL, -- 'MCQ', 'MULTI_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY'
    level_id VARCHAR(64) NOT NULL REFERENCES question_levels(id) ON DELETE RESTRICT, -- Chặn xóa nếu có câu hỏi dùng (#18 Vinh)
    difficulty VARCHAR(30) NOT NULL, -- Snapshot 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'
    clo_id VARCHAR(64) REFERENCES learning_objectives(id) ON DELETE SET NULL,
    explanation TEXT, -- Lời giải học thuật chi tiết
    image_url VARCHAR(500),
    points NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    rubric_id VARCHAR(64), -- Liên kết Rubric chấm tự luận nếu là dạng ESSAY
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_level ON questions(level_id);
CREATE INDEX idx_questions_clo ON questions(clo_id);

-- 6. Bảng Phương án Lựa chọn Trắc nghiệm (Question Options)
CREATE TABLE question_options (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'opt-1'
    question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL DEFAULT 1
);

CREATE INDEX idx_options_question ON question_options(question_id);

-- 7. Bảng Quan hệ Gán Câu hỏi vào Bài học (Lesson Questions) (#20 Vinh)
-- Gỡ câu hỏi khỏi bài học không làm mất câu hỏi trong ngân hàng chung
CREATE TABLE lesson_questions (
    lesson_id VARCHAR(64) NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(lesson_id, question_id)
);
```

---

### 5.4. Database: `assessment_db`
> Trọng tâm quy trình Khảo thí: Soạn đề, Lưu trữ Snapshot câu hỏi đóng băng, Hàng đợi chấm, Thang đo Rubric, Điều chỉnh điểm (Override), Phúc khảo (Appeals) và Nhật ký vết kiểm toán (Audit Trail).

```sql
CREATE DATABASE assessment_db;
\c assessment_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Thư viện Tiêu chí Rubrics Chấm Tự luận (Rubrics Library) (#18-20 Kiệt, #11 Tân)
CREATE TABLE rubrics (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'rub-1'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Tiêu chí Thành phần của Rubric (Rubric Criteria)
CREATE TABLE rubric_criteria (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'crit-1'
    rubric_id VARCHAR(64) NOT NULL REFERENCES rubrics(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    max_points NUMERIC(5,2) NOT NULL,
    order_index INT NOT NULL DEFAULT 1
);

-- 3. Bảng Mức độ Đạt được của Tiêu chí (Rubric Levels)
CREATE TABLE rubric_levels (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'rub-lvl-1'
    criteria_id VARCHAR(64) NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
    label VARCHAR(100) NOT NULL, -- e.g., 'Xuất sắc', 'Đạt', 'Chưa đạt'
    score NUMERIC(5,2) NOT NULL,
    description TEXT
);

-- 4. Bảng Đề thi & Khảo thí (Assessments)
CREATE TABLE assessments (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'asm-1'
    class_id VARCHAR(64) NOT NULL, -- Lớp áp dụng từ Classroom Service
    class_name VARCHAR(200),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    type VARCHAR(50) NOT NULL, -- 'QUIZ', 'MIDTERM', 'FINAL', 'ASSIGNMENT'
    weight NUMERIC(5,2) NOT NULL DEFAULT 10.0, -- Trọng số % trong đề cương
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SCHEDULED', 'PUBLISHED', 'CLOSED', 'GRADED'
    total_questions INT NOT NULL DEFAULT 0,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 10.0,
    score_scale INT NOT NULL DEFAULT 10, -- Thang điểm 10 hoặc 100
    time_limit_minutes INT NOT NULL DEFAULT 60,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    max_attempts INT NOT NULL DEFAULT 1,
    shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
    shuffle_answers BOOLEAN NOT NULL DEFAULT TRUE,
    allow_back_navigation BOOLEAN NOT NULL DEFAULT TRUE,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE, -- Khóa cấu trúc đề khi đã công bố (#8 Tân)
    
    -- Cấu hình Nộp trễ (Late Submission Policy) (#6 Tân)
    late_policy_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    late_deadline_minutes INT DEFAULT 0,
    late_penalty_percent NUMERIC(5,2) DEFAULT 0.0,
    
    -- Cấu hình Chống gian lận (Proctoring Policy)
    require_fullscreen BOOLEAN NOT NULL DEFAULT FALSE,
    enable_proctoring BOOLEAN NOT NULL DEFAULT FALSE,
    max_violations_allowed INT NOT NULL DEFAULT 3,
    
    -- Ma trận chuẩn đầu ra CLO mapping
    clo_mappings JSONB DEFAULT '[]'::jsonb, -- [{cloId, weightPercent}]
    
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_class ON assessments(class_id);
CREATE INDEX idx_assessments_status ON assessments(status);

-- 5. Bảng Danh mục Câu hỏi trong Đề thi KÈM SNAPSHOT TẦNG 1 (Assessment Questions)
CREATE TABLE assessment_questions (
    id VARCHAR(64) PRIMARY KEY,
    assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL, -- ID câu hỏi gốc từ Question Bank
    order_index INT NOT NULL DEFAULT 1,
    allocated_points NUMERIC(5,2) NOT NULL DEFAULT 1.0,
    clo_id VARCHAR(64),
    rubric_id VARCHAR(64) REFERENCES rubrics(id) ON DELETE SET NULL,
    
    -- === CỘT SNAPSHOT ĐÓNG BĂNG TOÀN BỘ CÂU HỎI VÀ ĐÁP ÁN (TẦNG 1) ===
    question_snapshot JSONB NOT NULL,
    /*
      Ví dụ Snapshot cấu trúc câu hỏi đóng băng:
      {
        "content": "Giao thức nào cung cấp kết nối tin cậy tại Transport Layer?",
        "type": "MCQ",
        "difficulty": "MEDIUM",
        "explanation": "TCP là giao thức hướng kết nối tin cậy (3-way handshake).",
        "imageUrl": "https://cdn.velica.edu.vn/images/transport.png",
        "options": [
          { "id": "opt-1", "text": "TCP", "isCorrect": true },
          { "id": "opt-2", "text": "UDP", "isCorrect": false },
          { "id": "opt-3", "text": "IP", "isCorrect": false }
        ],
        "rubric": { ... }
      }
    */
    snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_assessment_question UNIQUE(assessment_id, question_id)
);

CREATE INDEX idx_asm_q_asm ON assessment_questions(assessment_id);
CREATE INDEX idx_asm_q_snapshot_gin ON assessment_questions USING GIN (question_snapshot);

-- 6. Bảng Bài nộp của Sinh viên (Submissions)
CREATE TABLE submissions (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'sub-1'
    assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id),
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    late_penalty_applied NUMERIC(5,2) DEFAULT 0.0,
    violation_count INT NOT NULL DEFAULT 0,
    total_score NUMERIC(5,2),
    grading_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_MANUAL', -- 'AUTO_GRADED', 'PENDING_MANUAL', 'GRADED'
    is_official_confirmed BOOLEAN NOT NULL DEFAULT FALSE, -- Chốt điểm chính thức (#12 Tân)
    confirmed_by VARCHAR(64),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_submissions_assessment ON submissions(assessment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_submissions_grading ON submissions(assessment_id, grading_status);

-- 7. Bảng Chi tiết Đáp án & Điểm Từng Câu KÈM SNAPSHOT TẦNG 2 (Submission Answers)
CREATE TABLE submission_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(64) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL,
    
    -- === CÁC CỘT SNAPSHOT ĐÓNG BĂNG ĐỀ VÀ ĐÁP ÁN ĐÚNG LÚC SV LÀM (TẦNG 2) ===
    question_content_snapshot TEXT NOT NULL,
    question_type VARCHAR(30) NOT NULL,
    correct_answer_snapshot TEXT, -- Đáp án đúng tại thời điểm nộp
    max_points NUMERIC(5,2) NOT NULL,
    
    -- Bài làm thực tế của sinh viên:
    student_answer TEXT, -- ID phương án, chuỗi trả lời điền khuyết, hoặc nội dung bài luận
    points_awarded NUMERIC(5,2) DEFAULT 0.0,
    feedback TEXT, -- Lời phê của Giảng viên (#10 Tân)
    rubric_scores JSONB DEFAULT '{}'::jsonb, -- Điểm đạt được theo từng tiêu chí: {critId: score}
    is_auto_graded BOOLEAN NOT NULL DEFAULT FALSE,
    graded_by VARCHAR(64),
    graded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_sub_answers_sub ON submission_answers(submission_id);

-- 8. Bảng Lịch sử Can thiệp / Điều chỉnh Điểm số (Grade Override Logs) (#13 Tân)
CREATE TABLE grade_override_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id VARCHAR(64) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    question_id VARCHAR(64), -- NULL nếu sửa điểm tổng kết
    old_score NUMERIC(5,2) NOT NULL,
    new_score NUMERIC(5,2) NOT NULL,
    reason TEXT NOT NULL, -- Bắt buộc nhập lý do điều chỉnh
    overridden_by VARCHAR(64) NOT NULL,
    overridden_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_override_submission ON grade_override_logs(submission_id);

-- 9. Bảng Yêu cầu Phúc khảo Điểm của Sinh viên (Grade Appeals) (#14, #15 Tân)
CREATE TABLE grade_appeals (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'app-1'
    submission_id VARCHAR(64) NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id),
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    question_id VARCHAR(64) NOT NULL,
    question_content TEXT NOT NULL,
    current_score NUMERIC(5,2) NOT NULL,
    student_reason TEXT NOT NULL, -- Nội dung giải trình học thuật của sinh viên
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'REVIEWING', 'APPROVED', 'REJECTED'
    teacher_response TEXT, -- Lời giải thích phản hồi của Giảng viên
    resolved_by VARCHAR(64),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_appeals_status ON grade_appeals(status);
CREATE INDEX idx_appeals_assessment ON grade_appeals(assessment_id);

-- 10. Bảng Nhật ký Kiểm toán Đề thi (Assessment Audit Logs) (#17 Tân, #14 Kiệt)
CREATE TABLE assessment_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id VARCHAR(64) NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL,
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'UPDATE_STRUCTURE', 'PUBLISH_EXAM', 'OVERRIDE_GRADE'
    entity_type VARCHAR(50) NOT NULL, -- 'ASSESSMENT', 'QUESTION', 'SUBMISSION'
    entity_id VARCHAR(64),
    old_value JSONB,
    new_value JSONB,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_assessment ON assessment_audit_logs(assessment_id);
CREATE INDEX idx_audit_timestamp ON assessment_audit_logs(created_at);
```

---

### 5.5. Database: `assessment_delivery_db`
> Quản lý phòng thi trực tuyến, phiên thi của thí sinh, bộ đệm câu trả lời tạm thời và phát hiện gian lận.

```sql
CREATE DATABASE assessment_delivery_db;
\c assessment_delivery_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Phiên Làm bài Trực tuyến của Thí sinh (Student Assessment Sessions)
CREATE TABLE assessment_sessions (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'sess-stud-1-asm-1'
    assessment_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(150) NOT NULL,
    student_email VARCHAR(150),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expected_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'IN_PROGRESS', -- 'NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'TIMED_OUT'
    total_questions INT NOT NULL,
    answered_count INT NOT NULL DEFAULT 0,
    time_remaining_seconds INT NOT NULL,
    last_activity_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    connection_status VARCHAR(30) NOT NULL DEFAULT 'ONLINE', -- 'ONLINE', 'OFFLINE', 'RECONNECTING'
    device_fingerprint VARCHAR(255),
    ip_address VARCHAR(45),
    is_offline_cached BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_session_student_assessment UNIQUE(assessment_id, student_id)
);

CREATE INDEX idx_sessions_active ON assessment_sessions(assessment_id, status);
CREATE INDEX idx_sessions_student ON assessment_sessions(student_id);

-- 2. Bảng Tạm lưu Đáp án Phiên thi (Session Answers Persistence)
-- Đồng bộ định kỳ từ Redis Hash xuống PostgreSQL
CREATE TABLE session_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL,
    selected_option_id VARCHAR(64),
    selected_option_ids TEXT[], -- Dành cho dạng MULTI_CHOICE
    text_answer TEXT, -- Dành cho dạng FILL_BLANK hoặc ESSAY
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE, -- Cờ đánh dấu câu hỏi cần xem lại
    last_saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_session_question UNIQUE(session_id, question_id)
);

CREATE INDEX idx_session_answers_session ON session_answers(session_id);

-- 3. Bảng Nhật ký Vi phạm Phòng thi / Chống Gian lận (Proctoring Violations) (#16, #17 Long)
CREATE TABLE session_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(64) NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    assessment_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    violation_type VARCHAR(50) NOT NULL, -- 'TAB_SWITCH', 'FOCUS_LOST', 'FULLSCREEN_EXIT', 'DEVTOOLS_OPEN'
    description TEXT,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INT NOT NULL DEFAULT 0 -- Thời gian thí sinh rời màn hình làm bài
);

CREATE INDEX idx_violations_session ON session_violations(session_id);
CREATE INDEX idx_violations_assessment ON session_violations(assessment_id);
```

---

### 5.6. Database: `analytics_db`
> Tính toán điểm trung bình học phần, quy đổi hệ 4/điểm chữ, đo lường mức độ đạt chuẩn đầu ra (CLO) và phân tích câu hỏi ($P$-value, $D$).

```sql
CREATE DATABASE analytics_db;
\c analytics_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Phân tích Thống kê Chất lượng Câu hỏi Khảo thí (Item Analysis) (#16 Tân, #17, #18 Đăng)
CREATE TABLE question_difficulty_stats (
    question_id VARCHAR(64) PRIMARY KEY,
    syllabus_id VARCHAR(64),
    content TEXT,
    difficulty_level VARCHAR(30), -- 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    correct_rate NUMERIC(5,2) NOT NULL DEFAULT 0.0, -- Độ khó thực tế P-value (0 - 100%)
    avg_time_seconds NUMERIC(6,2) NOT NULL DEFAULT 0.0,
    discrimination_index NUMERIC(4,3) NOT NULL DEFAULT 0.0, -- Chỉ số phân biệt D (-1.0 đến 1.0)
    recommendation VARCHAR(50) NOT NULL DEFAULT 'OK', -- 'OK', 'TOO_EASY', 'TOO_HARD', 'REVISE_OPTIONS'
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bảng Bảng điểm Tổng hợp Lớp học & Đạt chuẩn CLO (Class Student Gradebook Analytics) (#15, #16 Đăng)
CREATE TABLE class_student_analytics (
    class_id VARCHAR(64) NOT NULL,
    student_id VARCHAR(64) NOT NULL,
    student_code VARCHAR(50),
    student_name VARCHAR(150) NOT NULL,
    completed_assessments INT NOT NULL DEFAULT 0,
    total_assessments INT NOT NULL DEFAULT 0,
    final_score_scale_10 NUMERIC(4,2), -- Điểm trung bình hệ 10 tính theo trọng số Syllabus
    final_score_scale_4 NUMERIC(3,2), -- Điểm quy đổi thang 4 (A: 4.0, B: 3.0, C: 2.0, D: 1.0, F: 0.0)
    letter_grade VARCHAR(5), -- A, B+, B, C+, C, D+, D, F
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    clo_mastery JSONB DEFAULT '[]'::jsonb, -- [{cloCode: 'CLO1', percent: 85.5}]
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(class_id, student_id)
);

CREATE INDEX idx_analytics_class ON class_student_analytics(class_id);

-- 3. Bảng Thống kê Vĩ mô Toàn Trường (System Statistics Snapshots) (#11 Kiệt)
CREATE TABLE system_stats_snapshots (
    id SERIAL PRIMARY KEY,
    total_users INT,
    total_teachers INT,
    total_students INT,
    total_classes INT,
    active_assessments INT,
    total_submissions INT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5.7. Database: `notification_db`
> Thông báo toàn trường, thông báo mở đề thi, nhắc lịch nộp bài, kết quả chấm thi và phúc khảo.

```sql
CREATE DATABASE notification_db;
\c notification_db;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Thông báo Hệ thống Chung (Broadcast System Notifications) (#13 Kiệt)
CREATE TABLE system_notifications (
    id VARCHAR(64) PRIMARY KEY, -- e.g., 'notif-1'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    recipient_scope VARCHAR(30) NOT NULL DEFAULT 'ALL', -- 'ALL', 'TEACHERS', 'STUDENTS', 'CLASS'
    target_class_id VARCHAR(64),
    sent_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Hộp thư Thông báo Cá nhân Người dùng (User Inboxes)
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(64) NOT NULL,
    notification_id VARCHAR(64) REFERENCES system_notifications(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'EXAM_SCHEDULED', 'GRADE_PUBLISHED', 'APPEAL_RESOLVED', 'SYSTEM'
    reference_link VARCHAR(255), -- Link chuyển nhanh đến bài thi hoặc đơn phúc khảo
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_notif_user ON user_notifications(user_id, is_read);
```

---

## 6. THIẾT KẾ GIAO TIẾP OPENFEIGN, KAFKA VÀ TẦNG CACHE REDIS

### 6.1. Ma trận Giao tiếp OpenFeign (RPC Synchronous)
| Caller Service | OpenFeign Client Interface | Target Microservice | Target Endpoint & Mục Đích Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| **Classroom Service** | `UserClient` | **Identity Service** | `GET /api/v1/users/{id}`: Kiểm tra tài khoản tồn tại, trạng thái hoạt động và cờ `isGlobalBanned`. |
| **Assessment Service** | `ContentClient` | **Learning Content Service** | `POST /api/v1/questions/batch-get`: Lấy chi tiết nội dung, options, đáp án đúng để đóng băng Snapshot lúc Publish. |
| **Assessment Service** | `ClassroomClient` | **Classroom Service** | `GET /api/v1/classes/{classId}/members`: Lấy danh sách thành viên hợp lệ trước khi cấp quyền làm bài. |
| **Assessment Delivery**| `AssessmentClient` | **Assessment Service** | `GET /api/v1/assessments/{id}/policy`: Lấy quy chế thi, thời lượng, chính sách nộp trễ và mật khẩu phòng thi. |
| **Analytics Service** | `SyllabusClient` | **Learning Content Service** | `GET /api/v1/syllabi/{id}/weights`: Lấy tỷ lệ trọng số các đầu điểm để tính điểm tổng kết học phần. |

### 6.2. Thiết kế Tầng Cache Redis (In-Memory Topology)
| Key Pattern | Cấu Trúc Dữ Liệu | TTL | Mục Đích & Nghiệp Vụ |
| :--- | :---: | :---: | :--- |
| `auth:jwt:blacklist:{jti}` | `STRING` | Đến khi JWT hết hạn | Hủy token lập tức khi người dùng Logout hoặc bị Admin khóa tài khoản. |
| `exam:snapshot:{assessmentId}` | `STRING (JSON)` | 24 giờ | Lưu trữ bản Snapshot toàn bộ đề thi để 10.000 thí sinh đọc song song siêu tốc. |
| `exam:session:{sessionId}:answers`| `HASH` | 24 giờ | Bộ đệm lưu tạm đáp án thí sinh gửi lên mỗi 5 giây (`hset key qId answerJson`). |
| `exam:session:{sessionId}:heartbeat`| `STRING` | 15 giây | Nhịp tim kết nối của thí sinh; nếu quá 15s không ping $\rightarrow$ Giảng viên thấy `OFFLINE`. |
| `exam:lock:submit:{sessionId}` | `STRING (Redlock)` | 10 giây | Khóa phân tán chống tình trạng click đúp nút Nộp bài tạo 2 bản ghi. |
| `exam:live:{assessmentId}:students`| `SET` | 12 giờ | Danh sách ID thí sinh đang có mặt trong ca thi phục vụ Live Monitor Dashboard. |

### 6.3. Sự kiện Kafka Phân tán (Event-Driven Topics)
| Topic Name | Producer | Consumer | Key & Payload | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :--- | :--- | :--- |
| **`assessment.submitted`** | Assessment Delivery | Assessment Svc, Analytics Svc | Key: `assessmentId`<br>Payload: `{ sessionId, studentId, answers, isLate }` | Kích hoạt tự động đối chiếu chấm trắc nghiệm và cập nhật tiến độ nộp bài. |
| **`proctoring.violation`** | Assessment Delivery | Notification Svc, Assessment Svc | Key: `studentId`<br>Payload: `{ sessionId, violationType, duration }` | Bắn cảnh báo trực tiếp lên màn hình giám sát thi của Giảng viên qua WebSocket. |
| **`grade.confirmed`** | Assessment Service | Notification Svc, Analytics Svc | Key: `assessmentId`<br>Payload: `{ assessmentId, classId, confirmedBy }` | Gửi thông báo đến toàn lớp và chốt bảng điểm tích lũy chuẩn đầu ra (CLO). |
| **`appeal.resolved`** | Assessment Service | Notification Svc, Analytics Svc | Key: `studentId`<br>Payload: `{ appealId, newScore, teacherResponse }` | Báo kết quả phúc khảo đến thí sinh và kích hoạt tính toán lại GPA. |
| **`user.banned`** | Identity Service | Classroom Svc, Delivery Svc | Key: `userId`<br>Payload: `{ userId, banReason, isGlobalBan }` | Khóa quyền truy cập trên toàn hệ thống và trục xuất khỏi phiên thi đang làm. |

---

## 7. KẾT LUẬN & HƯỚNG DẪN TRIỂN KHAI

1. **Chuẩn hóa Kiến trúc:** Tài liệu này phản ánh chính xác cấu trúc thực tế của mã nguồn Frontend React (`UI-1110`) và tích hợp hoàn hảo với kiến trúc Microservices Spring Cloud, Eureka, Config Server, Gateway, OpenFeign, Redis và Kafka.
2. **Bảo đảm Toàn vẹn Khảo thí:** Cơ chế Snapshot 2 tầng giải quyết triệt để bài toán biến đổi câu hỏi trong ngân hàng, bảo vệ kết quả thi và đơn phúc khảo luôn đạt chuẩn kiểm định giáo dục quốc tế.
3. **Thao tác Triển khai:**
   - Khởi tạo lần lượt 7 database trên cluster PostgreSQL bằng các câu lệnh `CREATE DATABASE` và script DDL tương ứng.
   - Chạy các dịch vụ hạ tầng theo thứ tự: **Config Server** (8888) $\rightarrow$ **Discovery Eureka** (8761) $\rightarrow$ **Kafka & Redis** $\rightarrow$ **API Gateway** (8080) $\rightarrow$ Các **Business Microservices** (8081 - 8087) $\rightarrow$ **Frontend Vite React** (3000).

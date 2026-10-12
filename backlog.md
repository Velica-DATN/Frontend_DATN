# VELICA ACADEMIC ASSESSMENT SYSTEM — PRODUCT BACKLOG
> **Tài liệu Danh mục Tính năng & Ca sử dụng (Use Case Backlog Specification)**  
> **Dự án:** Hệ thống Khảo thí & Đánh giá Chuẩn đầu ra Học thuật Trực tuyến (Velica Assessment Platform)  
> **Chuyên ngành:** Kỹ thuật Phần mềm (Software Engineering — Thesis SP27)  
> **Phiên bản:** v2.0 (Đã chuẩn hóa kiến trúc 5 phân hệ, loại bỏ trùng lặp và hoàn thiện luồng nghiệp vụ)

---

## I. MA TRẬN TỔNG QUAN PHÂN HỆ VÀ TÁC NHÂN (MODULE & ACTOR MATRIX)

| Mã Phân Hệ | Tên Phân Hệ (Domain Module) | Tác Nhân Chính (Actor) | Số Ca Sử Dụng | Mục Tiêu Nghiệp Vụ Cốt Lõi |
| :---: | :--- | :---: | :---: | :--- |
| **MOD-01** | **Xác thực, Hồ sơ & Quản trị Lớp học (Class Hub)** | ALL, Teacher, Student | 20 | Đăng nhập/ký, bảo mật tài khoản, quản lý vòng đời lớp học, thành viên và đánh giá CLO lớp. |
| **MOD-02** | **Đề cương, Bài học & Ngân hàng Câu hỏi** | Teacher, Student | 19 | Quản lý đề cương (Syllabus), bài giảng (Lesson), ngân hàng câu hỏi Bloom và nhập/xuất file. |
| **MOD-03** | **Thiết lập Đề thi, Chấm điểm & Rubric** | Teacher | 18 | Soạn đề thi wizard, chính sách khảo thí, ma trận rubric tự luận, chấm bài và phúc khảo. |
| **MOD-04** | **Trải nghiệm Làm bài & Giám sát Phòng thi** | Student, Teacher | 11 | Trải nghiệm thi mượt mà, lưu trữ offline/autosave, xem điểm & giám sát trực tiếp chống gian lận. |
| **MOD-05** | **Quản trị Hệ thống, Phân quyền & Vết kiểm toán** | Admin, ALL | 15 | Quản lý người dùng, phân quyền RBAC, thống kê vĩ mô, phát thông báo và chế độ bảo trì. |
| **TỔNG CỘNG** | **Toàn bộ hệ thống** | **3 Roles chính + ALL** | **83** | **Đảm bảo 100% tính toàn vẹn (Closed-loop User Flows) và chuẩn kiểm định OBE.** |

---

## II. CHI TIẾT PRODUCT BACKLOG THEO 5 PHÂN HỆ

### PHÂN HỆ 1 (MOD-01): XÁC THỰC, HỒ SƠ & QUẢN TRỊ LỚP HỌC (CLASS HUB)
*Bao gồm các chức năng định danh người dùng và toàn bộ vòng đời quản trị lớp học học phần của Giảng viên.*

| STT | Mã Use Case | Tên Chức Năng | Tác Nhân (Actor) | Mô Tả Nghiệp Vụ & Tiêu Chí Chấp Nhận (Acceptance Criteria) | Tình Trạng Điều Chỉnh |
| :---: | :---: | :--- | :---: | :--- | :---: |
| 1 | `UC-ACC-01` | **Register Account**<br>*(Đăng ký tài khoản)* | Khách / ALL | Người dùng đăng ký tài khoản mới với họ tên, email trường, tên đăng nhập và mật khẩu. Hệ thống kiểm tra trùng lặp email/username. | Giữ nguyên gốc |
| 2 | `UC-ACC-02` | **Login & Authenticate**<br>*(Đăng nhập hệ thống)* | ALL | Xác thực người dùng bằng thông tin đăng nhập, cấp token xác thực và chuyển hướng tự động về Dashboard tương ứng với vai trò. | Giữ nguyên gốc |
| 3 | `UC-ACC-03` | **Logout**<br>*(Đăng xuất hệ thống)* | ALL | Hủy phiên làm việc hiện tại, xóa dữ liệu xác thực cục bộ và điều hướng an toàn về trang Đăng nhập. | Giữ nguyên gốc |
| 4 | `UC-ACC-04` | **View Personal Profile**<br>*(Xem thông tin cá nhân)* | ALL | Người dùng xem chi tiết lý lịch cá nhân: họ tên, email, vai trò, đơn vị/khoa/lớp và trạng thái tài khoản. | Giữ nguyên gốc |
| 5 | `UC-ACC-05` | **Update Profile**<br>*(Cập nhật hồ sơ cá nhân)* | ALL | Cho phép cập nhật thông tin liên lạc (số điện thoại, đơn vị trực thuộc). Hiển thị thông báo xác nhận lưu thành công. | Giữ nguyên gốc |
| 6 | `UC-ACC-06` | **Change Password**<br>*(Đổi mật khẩu)* | ALL | Thay đổi mật khẩu tài khoản cá nhân, yêu cầu nhập chính xác mật khẩu hiện tại và kiểm tra độ mạnh của mật khẩu mới. | Giữ nguyên gốc |
| 7 | `UC-NOT-01` | **View System Notifications**<br>*(Xem thông báo hệ thống)* | ALL | Người dùng xem danh sách các thông báo do Ban Quản Trị phát (lịch bảo trì, thông báo thi), đánh dấu đã đọc hoặc lọc theo thời gian. | **Bổ sung mới (Đối ứng)** |
| 8 | `UC-CLS-01` | **Create Class**<br>*(Tạo lớp học mới)* | Teacher | Giảng viên tạo lớp học phần: Tên lớp, Mã lớp, Học kỳ, Học phần liên kết và mô tả. Sau khi tạo, lớp xuất hiện trên danh sách giảng dạy. | Giữ nguyên gốc |
| 9 | `UC-CLS-02` | **View & Search Classes**<br>*(Xem & Tìm kiếm lớp học)* | Teacher / Student | Xem danh sách các lớp học đang hoạt động hoặc đã lưu trữ; tìm kiếm tức thì theo tên lớp, mã lớp hoặc học kỳ. | Gộp View + Search |
| 10 | `UC-CLS-03` | **Join Class via Code**<br>*(Tham gia lớp bằng mã)* | Student | Sinh viên tự ghi danh vào lớp học phần bằng cách nhập Mã lớp (Enrollment Key) do Giảng viên cung cấp mà không cần chờ add thủ công. | **Bổ sung mới (Cốt lõi)** |
| 11 | `UC-CLS-04` | **Update Class**<br>*(Chỉnh sửa thông tin lớp)* | Teacher | Giảng viên chỉnh sửa tên lớp, học kỳ, đề cương môn học liên kết hoặc mô tả học phần. | Giữ nguyên gốc |
| 12 | `UC-CLS-05` | **Delete / Restore Class**<br>*(Xóa & Khôi phục lớp)* | Teacher | Nếu lớp chưa có dữ liệu làm bài: cho phép xóa cứng. Nếu đã có bài nộp/điểm: chuyển sang xóa mềm (Archive) để bảo toàn CLO; hỗ trợ Khôi phục. | Bổ sung Restore |
| 13 | `UC-CLS-06` | **Add Class Member**<br>*(Thêm thành viên thủ công)* | Teacher | Thêm từng sinh viên hoặc trợ giảng vào lớp học bằng MSSV, họ tên, email trường và vai trò. | Giữ nguyên gốc |
| 14 | `UC-CLS-07` | **Import Class Members from Excel**<br>*(Nhập danh sách từ Excel)* | Teacher | Tải lên danh sách sinh viên cả lớp từ file Excel/CSV chuẩn của phòng đào tạo; hệ thống tự động kiểm tra trùng lặp và thêm hàng loạt. | **Bổ sung mới (Thực tế)** |
| 15 | `UC-CLS-08` | **View Class Members Roster**<br>*(Xem danh sách thành viên)* | Teacher | Xem danh sách toàn bộ sinh viên trong lớp, số bài thi đã hoàn thành, điểm trung bình tích lũy và tỷ lệ đạt chuẩn đầu ra CLO. | Giữ nguyên gốc |
| 16 | `UC-CLS-09` | **Ban / Unban Class Member**<br>*(Cấm & Mở cấm thành viên)* | Teacher | Cấm sinh viên tham gia làm bài thi trong lớp (Class Ban) hoặc đề xuất cấm trên toàn bộ hệ thống (Global Ban); hỗ trợ gỡ cấm (Unban). | Giữ nguyên gốc |
| 17 | `UC-CLS-10` | **Delete / Restore Class Member**<br>*(Xóa & Khôi phục thành viên)* | Teacher | Xóa thành viên khỏi lớp: xóa cứng nếu chưa có bài thi; xóa mềm nếu đã có điểm để bảo vệ tính toàn vẹn báo cáo CLO; hỗ trợ Khôi phục. | Bổ sung Restore |
| 18 | `UC-CLS-11` | **View Individual Student Analytics**<br>*(Xem thống kê cá nhân sinh viên)* | Teacher | Xem chi tiết kết quả học tập cá nhân của 1 sinh viên: lịch sử điểm từng bài thi, mức độ thành thạo theo từng chuẩn CLO và nhận xét. | Giữ nguyên gốc |
| 19 | `UC-CLS-12` | **View Overall Class & CLO Statistics**<br>*(Xem thống kê tổng quan lớp)* | Teacher | Báo cáo trực quan phổ điểm toàn lớp, điểm trung bình, tỷ lệ hoàn thành và tỷ lệ đạt chuẩn theo từng mục tiêu đào tạo (CLO1, CLO2, CLO3). | Giữ nguyên gốc |
| 20 | `UC-CLS-13` | **Export Class Analytics to Excel**<br>*(Xuất báo cáo phân tích lớp)* | Teacher | Xuất toàn bộ bảng điểm lớp, tiến độ đánh giá chuẩn đầu ra và thống kê khảo thí ra file Excel (.csv UTF-8 BOM) để nộp khoa/bộ môn. | Giữ nguyên gốc |

---

### PHÂN HỆ 2 (MOD-02): ĐỀ CƯƠNG, BÀI HỌC & NGÂN HÀNG CÂU HỎI (CURRICULUM & QUESTION BANK)
*Bao gồm quản lý cây chương trình đào tạo, bài học và kho câu hỏi chuẩn hóa.*

| STT | Mã Use Case | Tên Chức Năng | Tác Nhân (Actor) | Mô Tả Nghiệp Vụ & Tiêu Chí Chấp Nhận (Acceptance Criteria) | Tình Trạng Điều Chỉnh |
| :---: | :---: | :--- | :---: | :--- | :---: |
| 21 | `UC-SYL-01` | **Create Syllabus**<br>*(Tạo đề cương môn học)* | Teacher | Khởi tạo đề cương mới gồm: Tên học phần, Mã học phần, Số tín chỉ, Mô tả và danh sách Chuẩn đầu ra (CLO1, CLO2...). | Giữ nguyên gốc |
| 22 | `UC-SYL-02` | **View & Search Syllabus**<br>*(Xem & Tìm kiếm đề cương)* | Teacher / Student | Tra cứu danh sách đề cương, tìm kiếm theo tên hoặc mã môn học; xem chi tiết các bài học và mục tiêu đào tạo thuộc đề cương. | Gộp View + Search |
| 23 | `UC-SYL-03` | **Update Syllabus**<br>*(Cập nhật đề cương)* | Teacher | Chỉnh sửa nội dung đề cương, cập nhật số tín chỉ hoặc bổ sung/chỉnh sửa các chuẩn đầu ra môn học. | Giữ nguyên gốc |
| 24 | `UC-SYL-04` | **Delete Syllabus**<br>*(Xóa đề cương)* | Teacher | Xóa đề cương môn học (hệ thống cảnh báo và ngăn chặn nếu đang có lớp học hoặc bài thi gắn với đề cương này). | Giữ nguyên gốc |
| 25 | `UC-LES-01` | **Create Lesson**<br>*(Tạo bài học mới)* | Teacher | Tạo bài học gắn với đề cương cụ thể: Tên bài, Mô tả, Nội dung chi tiết và thứ tự bài học trong chương trình. | Giữ nguyên gốc |
| 26 | `UC-LES-02` | **View & Search Lessons**<br>*(Xem & Tìm kiếm bài học)* | Teacher | Xem danh sách bài giảng theo từng đề cương môn học, tìm kiếm nhanh theo tiêu đề bài học. | Gộp View + Search |
| 27 | `UC-LES-03` | **Update Lesson**<br>*(Chỉnh sửa bài học)* | Teacher | Cập nhật tên bài giảng, nội dung lý thuyết hoặc điều chỉnh đề cương liên kết. | Giữ nguyên gốc |
| 28 | `UC-LES-04` | **Delete Lesson**<br>*(Xóa bài học)* | Teacher | Xóa bài học khỏi đề cương (kiểm tra liên kết câu hỏi trước khi cho phép xác nhận xóa). | Giữ nguyên gốc |
| 29 | `UC-LES-05` | **Manage Questions in Lesson**<br>*(Gán & Gỡ câu hỏi bài học)* | Teacher | Gán câu hỏi từ ngân hàng vào bài học tương ứng hoặc gỡ câu hỏi khỏi bài học mà không làm mất câu hỏi trong ngân hàng chung. | Gộp Remove Q |
| 30 | `UC-QST-01` | **Create Question**<br>*(Tạo câu hỏi mới)* | Teacher | Tạo câu hỏi (Trắc nghiệm đơn, Nhiều đáp án, Tự luận): nhập nội dung, phương án chọn, đáp án đúng, điểm, độ khó Bloom và bài học. | Giữ nguyên gốc |
| 31 | `UC-QST-02` | **Import Questions from Excel/Word**<br>*(Nhập câu hỏi hàng loạt)* | Teacher | Tải lên file Excel (.xlsx) hoặc file Word (.docx) chuẩn hóa; hệ thống tự động bóc tách nội dung, đáp án và import hàng loạt vào ngân hàng. | **Bổ sung mới (Cốt lõi)** |
| 32 | `UC-QST-03` | **View & Search Question Bank**<br>*(Xem & Tìm kiếm ngân hàng câu hỏi)* | Teacher | Xem toàn bộ kho câu hỏi, tìm kiếm nội dung và lọc kết hợp theo Dạng câu hỏi, Mức độ nhận thức (Bloom), Bài học và CLO. | Gộp View + Search |
| 33 | `UC-QST-04` | **Update Question**<br>*(Chỉnh sửa câu hỏi)* | Teacher | Cập nhật nội dung câu hỏi, điều chỉnh phương án lựa chọn, đổi đáp án đúng hoặc bổ sung giải thích chi tiết. | Giữ nguyên gốc |
| 34 | `UC-QST-05` | **Delete Question**<br>*(Xóa câu hỏi)* | Teacher | Xóa câu hỏi khỏi ngân hàng (chặn xóa nếu câu hỏi đang nằm trong một đề thi đã xuất bản). | Giữ nguyên gốc |
| 35 | `UC-QST-06` | **Export Question Bank**<br>*(Xuất ngân hàng câu hỏi)* | Teacher | Xuất danh sách câu hỏi ra file Excel/CSV phục vụ lưu trữ ngân hàng đề thi hoặc in ấn đề dự phòng. | **Bổ sung mới (Hữu ích)** |
| 36 | `UC-LVL-01` | **Create Question Level**<br>*(Tạo mức độ câu hỏi)* | Teacher | Định nghĩa mức độ nhận thức mới (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) kèm mô tả thang đo tư duy. | Giữ nguyên gốc |
| 37 | `UC-LVL-02` | **View & Search Question Levels**<br>*(Xem & Tìm kiếm mức độ)* | Teacher | Xem danh sách các cấp độ nhận thức, trọng số điểm và số lượng câu hỏi đang áp dụng cấp độ đó. | Gộp View + Search |
| 38 | `UC-LVL-03` | **Update Question Level**<br>*(Cập nhật mức độ câu hỏi)* | Teacher | Chỉnh sửa tên mức độ nhận thức, mô tả năng lực hoặc trọng số đánh giá. | Giữ nguyên gốc |
| 39 | `UC-LVL-04` | **Delete Question Level**<br>*(Xóa mức độ câu hỏi)* | Teacher | Xóa mức độ nhận thức (ngăn chặn nếu đã có câu hỏi trong ngân hàng đang sử dụng mức độ này). | Giữ nguyên gốc |

---

### PHÂN HỆ 3 (MOD-03): THIẾT LẬP ĐỀ THI, CHẤM ĐIỂM & RUBRIC (ASSESSMENT & EVALUATION)
*Bao gồm toàn bộ quy trình thiết kế đề thi khảo thí, ma trận rubric, chấm điểm và phân tích trắc nghiệm.*

| STT | Mã Use Case | Tên Chức Năng | Tác Nhân (Actor) | Mô Tả Nghiệp Vụ & Tiêu Chí Chấp Nhận (Acceptance Criteria) | Tình Trạng Điều Chỉnh |
| :---: | :---: | :--- | :---: | :--- | :---: |
| 40 | `UC-ASM-01` | **Create Assessment Draft**<br>*(Tạo bài thi nháp)* | Teacher | Khởi tạo bài kiểm tra (Quiz/Midterm/Final/Assignment), chọn lớp áp dụng, tiêu đề, hướng dẫn làm bài và trọng số điểm học phần (Weight %). | Giữ nguyên gốc |
| 41 | `UC-ASM-02` | **Configure Assessment Structure**<br>*(Cấu hình cấu trúc đề)* | Teacher | Thiết lập tổng số câu, thang điểm (10 hoặc 100), thời lượng làm bài (phút), phân bổ tỷ lệ giữa phần Trắc nghiệm và Tự luận theo thời gian thực. | Giữ nguyên gốc |
| 42 | `UC-ASM-03` | **Select Questions & Auto-generate**<br>*(Chọn câu hỏi & Tạo đề tự động)* | Teacher | Chọn thủ công câu hỏi từ ngân hàng hoặc thiết lập ma trận tự động sinh câu hỏi ngẫu nhiên theo tỷ lệ CLO và độ khó Bloom. | Giữ nguyên gốc |
| 43 | `UC-ASM-04` | **Configure Assessment & Late Policy**<br>*(Cấu hình quy chế thi & Nộp trễ)* | Teacher | Cấu hình thời gian mở/đóng đề, số lượt làm, đảo câu hỏi, đảo phương án, cho phép quay lại câu trước và chính sách trừ điểm khi nộp trễ. | Gộp Policy + Late |
| 44 | `UC-ASM-05` | **Map Learning Outcomes (CLO)**<br>*(Ánh xạ chuẩn đầu ra)* | Teacher | Gán chuẩn đầu ra môn học (CLO) cho toàn bộ bài thi hoặc từng câu hỏi cụ thể; kiểm tra độ phủ CLO trước khi lưu. | Giữ nguyên gốc |
| 45 | `UC-ASM-06` | **Review & Publish Assessment**<br>*(Duyệt & Xuất bản đề thi)* | Teacher | Màn hình Review kiểm tra tính toàn vẹn, cảnh báo lỗi cấu hình; xác nhận Publish để phát hành bài thi và khóa các thông số quan trọng. | Giữ nguyên gốc |
| 46 | `UC-ASM-07` | **Update / Delete Assessment**<br>*(Chỉnh sửa & Xóa bài thi)* | Teacher | Chỉnh sửa đề thi khi ở trạng thái Draft; cho phép xóa bài thi chưa diễn ra hoặc lưu trữ (Archive) đề thi đã kết thúc. | Bổ sung Delete |
| 47 | `UC-RUB-01` | **Create & Update Writing Rubrics**<br>*(Tạo & Sửa Rubric tự luận)* | Teacher | Thiết kế ma trận tiêu chí đánh giá tự luận: tiêu chí, điểm tối đa thành phần, các mức độ thành thạo (Xuất sắc, Khá, Trung bình) và mô tả. | Chuyển từ Admin |
| 48 | `UC-RUB-02` | **View, Search & Delete Rubrics**<br>*(Xem, Tìm kiếm & Xóa Rubric)* | Teacher | Quản lý danh sách các thang Rubric chấm tự luận; tìm kiếm theo tên hoặc tiêu chí; xóa rubric không còn sử dụng. | Chuyển từ Admin |
| 49 | `UC-GRD-01` | **Manage Grading Queue**<br>*(Quản lý hàng đợi chấm bài)* | Teacher | Danh sách bài nộp: hệ thống tự động chấm trắc nghiệm ngay khi nộp bài, đưa các bài có câu tự luận vào hàng đợi chờ giảng viên chấm thủ công. | Giữ nguyên gốc |
| 50 | `UC-GRD-02` | **Manual Grading with Rubric**<br>*(Chấm tự luận theo Rubric)* | Teacher | Giảng viên chấm tự luận: chọn mức độ đạt được trên rubric tiêu chí, hệ thống tự động tính tổng điểm câu hỏi và cho phép nhập lời phê/feedback. | Giữ nguyên gốc |
| 51 | `UC-GRD-03` | **View Assessment Gradebook**<br>*(Xem bảng điểm bài kiểm tra)* | Teacher | Xem bảng điểm chi tiết toàn lớp của kỳ thi: điểm từng sinh viên, tình trạng nộp đúng hạn/trễ hạn, số lần vi phạm và trạng thái chấm. | Giữ nguyên gốc |
| 52 | `UC-GRD-04` | **Review & Confirm Official Results**<br>*(Duyệt & Chốt điểm chính thức)* | Teacher | Xem thống kê phổ điểm kỳ thi, phát hiện điểm bất thường; bấm xác nhận để chuyển kết quả sang trạng thái Chính thức và công bố cho sinh viên. | Giữ nguyên gốc |
| 53 | `UC-GRD-05` | **Override Student Grade**<br>*(Điều chỉnh điểm bài thi)* | Teacher | Cho phép giảng viên sửa điểm bài thi hoặc từng câu hỏi (bắt buộc nhập lý do điều chỉnh); hệ thống tự động ghi nhật ký Grade History. | Giữ nguyên gốc |
| 54 | `UC-GRD-06` | **Review & Resolve Grade Appeal**<br>*(Xử lý đơn phúc khảo điểm)* | Teacher | Tiếp nhận danh sách đơn phúc khảo từ sinh viên; xem bài làm, lời giải trình; đưa ra quyết định Duyệt (kèm sửa điểm) hoặc Từ chối kèm lý do. | Giữ nguyên gốc |
| 55 | `UC-GRD-07` | **Export Assessment Gradebook**<br>*(Xuất bảng điểm kỳ thi ra Excel)* | Teacher | Xuất bảng điểm chi tiết của riêng kỳ thi ra file Excel (.csv UTF-8 BOM) bao gồm điểm số, số lần vi phạm và trạng thái nộp bài. | **Bổ sung mới (Thiết thực)** |
| 56 | `UC-ANL-01` | **View Question Item Analysis**<br>*(Phân tích độ khó & Tâm lý học trắc nghiệm)* | Teacher | Phân tích chất lượng câu hỏi: độ khó $P$-value, chỉ số phân biệt $D$ (Discrimination Index), tỷ lệ đúng/sai và khuyến nghị giữ/sửa/thay thế câu hỏi. | Giữ nguyên gốc |
| 57 | `UC-ADT-01` | **View Assessment Audit Trail**<br>*(Nhật ký kiểm toán đề thi)* | Teacher | Xem lịch sử thay đổi cấu hình đề thi: thời gian sửa, người thực hiện, giá trị cũ và giá trị mới nhằm đảm bảo tính minh bạch học thuật. | Giữ nguyên gốc |

---

### PHÂN HỆ 4 (MOD-04): TRẢI NGHIỆM LÀM BÀI & GIÁM SÁT PHÒNG THI (TAKING & PROCTORING)
*Bao gồm luồng làm bài trực tuyến chịu lỗi của Sinh viên và hệ thống giám sát trực tiếp chống gian lận của Giảng viên.*

| STT | Mã Use Case | Tên Chức Năng | Tác Nhân (Actor) | Mô Tả Nghiệp Vụ & Tiêu Chí Chấp Nhận (Acceptance Criteria) | Tình Trạng Điều Chỉnh |
| :---: | :---: | :--- | :---: | :--- | :---: |
| 58 | `UC-EXM-01` | **View Available Assessments**<br>*(Xem danh sách bài thi khả dụng)* | Student | Sinh viên xem danh sách các bài thi được phép tham gia, thời hạn mở/đóng đề, thời lượng làm bài và trạng thái hoàn thành. | Giữ nguyên gốc |
| 59 | `UC-EXM-02` | **Start Assessment Session**<br>*(Bắt đầu làm bài thi)* | Student | Đọc quy chế thi, xác nhận bắt đầu; hệ thống khởi tạo phiên làm bài, ghi nhận thời điểm bắt đầu và kích hoạt chế độ thi chuyên biệt. | Giữ nguyên gốc |
| 60 | `UC-EXM-03` | **Take Assessment (Navigate & Autosave)**<br>*(Thực hiện bài thi & Tự lưu đáp án)* | Student | Đọc nội dung câu hỏi, chọn đáp án trắc nghiệm hoặc soạn thảo tự luận; điều hướng giữa các câu hỏi; hệ thống tự động lưu đáp án định kỳ mỗi 5s. | Gộp Micro-interactions |
| 61 | `UC-EXM-04` | **Offline Resilience & Sync**<br>*(Chịu lỗi mất mạng & Tự đồng bộ)* | Student | Khi mất kết nối Internet, sinh viên tiếp tục làm bài bình thường; đáp án được lưu tạm trên bộ nhớ trình duyệt và tự đồng bộ khi có mạng lại. | Giữ nguyên gốc |
| 62 | `UC-EXM-05` | **Resume Assessment Session**<br>*(Khôi phục phiên thi sau sự cố)* | Student | Trong trường hợp sập nguồn hoặc tắt nhầm trình duyệt, sinh viên mở lại bài thi trong thời gian cho phép; hệ thống tự động khôi phục dữ liệu đã làm. | **Bổ sung mới (Quan trọng)** |
| 63 | `UC-EXM-06` | **Submit Assessment**<br>*(Nộp bài thi)* | Student | Sinh viên chủ động nộp bài (có cảnh báo số câu chưa làm) hoặc hệ thống tự động thu bài khi hết thời gian quy định; ghi nhận thời điểm nộp. | Giữ nguyên gốc |
| 64 | `UC-EXM-07` | **View Exam Results & Feedback**<br>*(Xem bảng điểm & Lời phê bài thi)* | Student | Sinh viên xem điểm số chính thức, nhận xét/feedback của giảng viên, đáp án đúng/sai (nếu đề cho phép) và tiến độ đạt chuẩn CLO cá nhân. | **Bổ sung mới (Đối ứng)** |
| 65 | `UC-EXM-08` | **Submit Grade Appeal Request**<br>*(Gửi đơn yêu cầu phúc khảo)* | Student | Sau khi có điểm chính thức, sinh viên có thể chọn câu hỏi cụ thể và gửi đơn giải trình phúc khảo điểm kèm lý do chi tiết đến giảng viên. | Di dời từ Cột 3 |
| 66 | `UC-EXM-09` | **Track Grade Appeal Status**<br>*(Theo dõi tiến trình phúc khảo)* | Student | Sinh viên theo dõi trạng thái xử lý đơn phúc khảo (`Chờ duyệt` $\rightarrow$ `Đã duyệt` / `Từ chối`) và xem điểm số cập nhật sau phúc khảo. | **Bổ sung mới (Đối ứng)** |
| 67 | `UC-PRC-01` | **Monitor Real-time Exam Progress**<br>*(Giám sát tiến độ & Nhịp tim phòng thi)* | Teacher | Giảng viên theo dõi trực tiếp toàn bộ thí sinh trong phòng thi: trạng thái làm bài, số câu đã trả lời, trạng thái mạng (Online/Reconnecting) và thời gian còn lại. | **Gộp 5 use case vụn** |
| 68 | `UC-PRC-02` | **Detect & Inspect Exam Violations**<br>*(Cảnh báo & Xem chi tiết gian lận)* | Teacher | Hệ thống tự động ghi nhận các hành vi vi phạm (chuyển tab, mất focus cửa sổ, mở ứng dụng khác); giảng viên bấm xem timeline chi tiết từng lần vi phạm. | **Gộp 2 use case vụn** |

---

### PHÂN HỆ 5 (MOD-05): QUẢN TRỊ HỆ THỐNG, PHÂN QUYỀN & VẾT KIỂM TOÁN (SYSTEM ADMINISTRATION & AUDIT)
*Bao gồm các chức năng quản trị vĩ mô, an ninh người dùng, phân quyền RBAC và vận hành toàn hệ sinh thái.*

| STT | Mã Use Case | Tên Chức Năng | Tác Nhân (Actor) | Mô Tả Nghiệp Vụ & Tiêu Chí Chấp Nhận (Acceptance Criteria) | Tình Trạng Điều Chỉnh |
| :---: | :---: | :--- | :---: | :--- | :---: |
| 69 | `UC-ADM-01` | **Create User Account**<br>*(Tạo tài khoản người dùng)* | Admin | Admin tạo tài khoản mới cho Giảng viên, Sinh viên hoặc Quản trị viên; cấp mật khẩu mặc định ban đầu và gán đơn vị/khoa. | Giữ nguyên gốc |
| 70 | `UC-ADM-02` | **View & Search Users**<br>*(Xem & Tìm kiếm người dùng)* | Admin | Tra cứu danh sách người dùng toàn trường; tìm kiếm theo họ tên, username, email và lọc theo vai trò phân quyền. | Gộp View + Search |
| 71 | `UC-ADM-03` | **Update User Profile & Role**<br>*(Cập nhật thông tin & Vai trò)* | Admin | Chỉnh sửa thông tin hồ sơ người dùng, đơn vị công tác và thay đổi vai trò phân quyền (Admin / Teacher / Student). | Giữ nguyên gốc |
| 72 | `UC-ADM-04` | **Lock / Unlock User Account**<br>*(Khóa & Mở khóa tài khoản)* | Admin | Tạm dừng quyền truy cập của tài khoản (khi sinh viên tạm ngừng học hoặc phát hiện bất thường) và mở khóa lại khi hợp lệ. | Tách rõ hành động |
| 73 | `UC-ADM-05` | **Reset User Password**<br>*(Cấp lại mật khẩu người dùng)* | Admin | Admin đặt lại mật khẩu mặc định (ví dụ: `Velica@2026`) khi người dùng quên mật khẩu hoặc có yêu cầu khẩn cấp từ khoa. | **Bổ sung mới (Quản trị)** |
| 74 | `UC-ADM-06` | **Delete & Restore User**<br>*(Xóa & Khôi phục người dùng)* | Admin | Xóa mềm tài khoản người dùng để giữ nguyên lịch sử dữ liệu khảo thí; hỗ trợ nút Khôi phục tài khoản khi cần thiết. | Bổ sung Restore |
| 75 | `UC-ROL-01` | **Create User Role**<br>*(Tạo vai trò phân quyền mới)* | Admin | Khởi tạo vai trò mới trong hệ thống kèm tên gọi, mô tả và thiết lập ma trận quyền hạn chi tiết. | Giữ nguyên gốc |
| 76 | `UC-ROL-02` | **View & Search User Roles**<br>*(Xem & Tìm kiếm vai trò)* | Admin | Xem danh sách các vai trò trong hệ thống, số lượng tài khoản đang được gán vai trò đó. | Gộp View + Search |
| 77 | `UC-ROL-03` | **Update User Role Permissions**<br>*(Cập nhật ma trận quyền hạn)* | Admin | Chỉnh sửa mô tả vai trò và cấu hình chi tiết danh sách quyền thao tác được phép thực hiện. | Giữ nguyên gốc |
| 78 | `UC-ROL-04` | **Delete User Role**<br>*(Xóa vai trò phân quyền)* | Admin | Xóa vai trò người dùng (hệ thống chặn xóa đối với 3 vai trò hệ thống cốt lõi: Administrator, Teacher, Student). | Giữ nguyên gốc |
| 79 | `UC-STA-01` | **View System Statistics Dashboard**<br>*(Xem bảng thống kê hệ thống)* | Admin | Dashboard thống kê vĩ mô: tổng số người dùng, số lớp học đang hoạt động, số bài thi đã tổ chức, số lượt nộp bài và phân bố tài khoản. | Giữ nguyên gốc |
| 80 | `UC-STA-02` | **Export System Statistics to Excel**<br>*(Xuất báo cáo hệ thống ra Excel)* | Admin | Xuất toàn bộ số liệu thống kê hoạt động của hệ thống ra file Excel để báo cáo Ban Giám hiệu nhà trường. | Giữ nguyên gốc |
| 81 | `UC-NTF-01` | **Broadcast System Notification**<br>*(Phát thông báo toàn hệ thống)* | Admin | Soạn thảo thông điệp thông báo và gửi đến toàn bộ người dùng hoặc lọc theo đối tượng nhận (Giảng viên / Sinh viên). | Giữ nguyên gốc |
| 82 | `UC-LOG-01` | **View System Audit Logs**<br>*(Xem nhật ký vết kiểm toán)* | Admin | Tra cứu toàn bộ lịch sử thao tác quan trọng trên hệ thống (Thời gian, Người thực hiện, Hành động, Đối tượng, Dữ liệu cũ/mới). | Giữ nguyên gốc |
| 83 | `UC-MNT-01` | **Manage Maintenance Mode**<br>*(Quản lý chế độ bảo trì hệ thống)* | Admin | Bật/tắt chế độ bảo trì hệ thống: khi bật, chỉ Admin mới truy cập được, sinh viên và giảng viên thấy màn hình thông báo nâng cấp thân thiện. | Giữ nguyên gốc |

---

## III. MA TRẬN MAPPING TÍNH NĂNG VÀ ROUTE TRONG CODEBASE

Dưới đây là bảng ánh xạ trực tiếp từ 83 Use Case sang mã nguồn đã hoàn thiện trong dự án `Velica UI`:

| Nhóm Tính Năng | Use Case IDs | Route Đường Dẫn Trong Code | File Component Phụ Trách |
| :--- | :---: | :--- | :--- |
| **Xác thực & Hồ sơ** | `UC-ACC-01..06`, `UC-NOT-01` | `/auth/login`, `/auth/sign-up`, `/profile/*` | `LoginPage.tsx`, `SignUpPage.tsx`, `ProfileInfo.tsx`, `SecuritySettings.tsx` |
| **Quản trị Lớp học** | `UC-CLS-01..13` | `/teacher/classes`, `/teacher/classes/:id`, `/student/classes` | `ClassList.tsx`, `ClassDetail.tsx`, `StudentClasses.tsx` |
| **Đề cương & Bài học** | `UC-SYL-01..04`, `UC-LES-01..05` | `/teacher/syllabus/*`, `/teacher/lessons/*` | `SyllabusList.tsx`, `SyllabusDetail.tsx`, `LessonList.tsx`, `LessonDetail.tsx` |
| **Ngân hàng Câu hỏi** | `UC-QST-01..06`, `UC-LVL-01..04` | `/teacher/question-bank`, `/teacher/question-levels` | `QuestionList.tsx`, `QuestionLevels.tsx` |
| **Soạn & Quản lý Đề** | `UC-ASM-01..07` | `/teacher/assessments`, `/teacher/assessments/builder` | `AssessmentList.tsx`, `AssessmentBuilder.tsx` |
| **Chấm bài & Rubric** | `UC-RUB-01..02`, `UC-GRD-01..07` | `/teacher/assessments/:id/results`, `/teacher/rubrics`, `/teacher/submissions/:id/grading` | `AssessmentResults.tsx`, `GradingQueue.tsx`, `ManualGrading.tsx`, `RubricList.tsx` |
| **Phân tích & Kiểm toán**| `UC-ANL-01`, `UC-ADT-01` | `/teacher/assessments/:id/question-analysis`, `/teacher/assessments/:id/audit` | `QuestionAnalysis.tsx`, `AssessmentAudit.tsx` |
| **Làm bài thi Online** | `UC-EXM-01..06` | `/student/assessments`, `/student/assessments/:id/take` | `StudentAssessments.tsx`, `AssessmentTaking.tsx`, `AssessmentSubmission.tsx` |
| **Kết quả & Phúc khảo** | `UC-EXM-07..09`, `UC-GRD-06` | `/student/results`, `/student/grade-reviews`, `/teacher/assessments/:id/appeals` | `StudentResults.tsx`, `GradeReviews.tsx`, `GradeAppeals.tsx` |
| **Giám sát trực tiếp** | `UC-PRC-01..02` | `/teacher/assessments/:id/monitor` | `AssessmentMonitor.tsx` |
| **Quản trị Admin** | `UC-ADM-01..06`, `UC-ROL-01..04` | `/admin/users`, `/admin/roles` | `UserManagement.tsx`, `RoleManagement.tsx` |
| **Thống kê & Bảo trì** | `UC-STA-01..02`, `UC-LOG-01`, `UC-MNT-01`, `UC-NTF-01` | `/admin/stats`, `/admin/audit-logs`, `/admin/maintenance`, `/admin/notifications` | `SystemStats.tsx`, `AuditLogs.tsx`, `MaintenanceMode.tsx`, `NotificationManager.tsx` |

---
*Tài liệu đã được kiểm duyệt và đồng bộ 100% với mã nguồn hệ thống khảo thí Velica.*

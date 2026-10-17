import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Tag, Alert, Row, Col, Divider, Tooltip } from 'antd';
import { ArrowLeft, Clock, ShieldAlert, CheckCircle, Play, Calendar, AlertCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const AssessmentInstructions: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [existingSubmission, setExistingSubmission] = useState<any | null>(null);

  useEffect(() => {
    const fetchAsm = async () => {
      const data = await mockService.getAssessmentById(id || 'asm-1');
      setAssessment(data);

      const allSubs = await mockService.getSubmissions();
      const currentUser = mockService.getCurrentUser();
      const sub = allSubs.find(
        (s) => (s.assessmentId === id || s.assessmentId === data?.id) && (s.studentId === currentUser.id || s.studentName === currentUser.fullName)
      );
      if (sub) {
        setExistingSubmission(sub);
      }
    };
    fetchAsm();
  }, [id]);

  const handleStartExam = () => {
    navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_TAKING.replace(':id', assessment?.id || 'asm-1'));
  };

  const now = dayjs();
  const startTime = assessment?.startTime ? dayjs(assessment.startTime) : null;
  const endTime = assessment?.endTime ? dayjs(assessment.endTime) : null;

  const isBeforeStart = Boolean(startTime && startTime.isValid() && now.isBefore(startTime));
  const isAfterEnd = Boolean(endTime && endTime.isValid() && now.isAfter(endTime));
  const canStart = !isBeforeStart && !isAfterEnd && !existingSubmission;

  return (
    <div className="animate-fade-in max-w-720 mx-auto">
      <Button
        type="text"
        icon={<ArrowLeft size={16} />}
        onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENTS)}
        className="velica-back-btn"
      >
        Quay lại danh sách bài kiểm tra
      </Button>

      <Card className="velica-card p-4">
        <div className="text-center mb-4">
          <Tag color="indigo" className="rounded-2 font-semibold text-sm mb-2">
            {assessment?.className || 'SE301.P01'}
          </Tag>
          <Title level={3} className="velica-page-title text-xl my-1">
            {assessment?.title || 'Kiểm Tra Giữa Kỳ — Kiến Trúc Phần Mềm Hiện Đại'}
          </Title>
          <Text type="secondary" className="velica-page-desc">
            {assessment?.description}
          </Text>
        </div>

        {/* Time Window Status Alerts */}
        {existingSubmission && (
          <Alert
            message="Bạn đã hoàn tất bài thi này"
            description={
              <div>
                Hệ thống đã ghi nhận bài nộp của bạn vào lúc{' '}
                <strong>
                  {existingSubmission.submittedAt
                    ? dayjs(existingSubmission.submittedAt).format('HH:mm DD/MM/YYYY')
                    : 'thời gian trước đó'}
                </strong>
                . Kết quả bài làm: <strong className="text-brand-color">{existingSubmission.score ?? '—'}/{existingSubmission.maxScore ?? 10} điểm</strong>.
              </div>
            }
            type="success"
            showIcon
            icon={<CheckCircle size={18} />}
            className="mb-4 rounded-3"
          />
        )}

        {!existingSubmission && isBeforeStart && (
          <Alert
            message="Chưa đến thời gian mở đề thi"
            description={
              <div>
                Đề thi này được cấu hình mở từ lúc <strong>{startTime?.format('HH:mm DD/MM/YYYY')}</strong>. 
                Thí sinh vui lòng quay lại khi đến khung giờ quy định.
              </div>
            }
            type="info"
            showIcon
            icon={<Clock size={18} />}
            className="mb-4 rounded-3"
          />
        )}

        {!existingSubmission && isAfterEnd && (
          <Alert
            message="Kỳ thi đã chính thức kết thúc"
            description={
              <div>
                Hạn chót nộp bài đã khép lại vào lúc <strong>{endTime?.format('HH:mm DD/MM/YYYY')}</strong>. 
                Hệ thống không còn tiếp nhận lượt làm bài mới cho kỳ thi này.
              </div>
            }
            type="error"
            showIcon
            icon={<AlertCircle size={18} />}
            className="mb-4 rounded-3"
          />
        )}

        {!existingSubmission && !isBeforeStart && !isAfterEnd && endTime && (
          <Alert
            message="Khung giờ thi đang mở"
            description={
              <div>
                Bạn có thể làm bài ngay bây giờ. Đồng hồ đếm ngược{' '}
                <strong>{assessment?.timeLimitMinutes || 45} phút</strong> sẽ bắt đầu khi bạn nhấn vào nút bên dưới.{' '}
                Hạn chót toàn bộ hệ thống thu bài là <strong>{endTime.format('HH:mm DD/MM/YYYY')}</strong>.
              </div>
            }
            type="success"
            showIcon
            icon={<CheckCircle size={18} />}
            className="mb-4 rounded-3"
          />
        )}

        {/* Exam Metrics Quick Specs */}
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={12} sm={6}>
            <div className="velica-spec-box">
              <Text type="secondary" className="velica-spec-label">Thời gian làm bài</Text>
              <div className="velica-spec-val">
                {assessment?.timeLimitMinutes} phút
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="velica-spec-box">
              <Text type="secondary" className="velica-spec-label">Tổng số câu hỏi</Text>
              <div className="velica-spec-val">
                {assessment?.totalQuestions} câu
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="velica-spec-box">
              <Text type="secondary" className="velica-spec-label">Thang điểm</Text>
              <div className="velica-spec-val">
                {assessment?.maxScore} / {assessment?.scoreScale} đ
              </div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="velica-spec-box">
              <Text type="secondary" className="velica-spec-label">Số lần làm bài</Text>
              <div className="velica-spec-val">
                {assessment?.maxAttempts} lần
              </div>
            </div>
          </Col>
        </Row>

        {/* Anti-cheat Policy Alert */}
        <Alert
          message="Nội quy phòng thi trực tuyến & Cơ chế Giám sát Chống Gian lận (Velica Safe Exam)"
          description={
            <ul className="m-0 pl-3 leading-relaxed text-sm">
              <li><strong>Khóa phiên thi độc quyền (Single Active Session):</strong> Mỗi thí sinh chỉ được mở bài làm trên 1 thiết bị duy nhất. Hành vi đăng nhập đồng thời từ máy thứ 2 (hoặc nhờ làm bài hộ) sẽ bị hệ thống chặn tự động và kích hoạt cảnh báo vi phạm đỏ đến Giám thị.</li>
              <li><strong>Xử lý sự cố phần cứng:</strong> Nếu máy tính sập nguồn hoặc rớt mạng, thí sinh có thể dùng máy dự phòng và chọn <em>"Yêu cầu chuyển thiết bị do sự cố"</em> để Giám thị xác nhận khôi phục bài làm.</li>
              <li><strong>Chống sao chép & Thi hộ:</strong> Hệ thống tự động phát hiện chuyển tab, thu nhỏ cửa sổ, hành vi điều khiển từ xa (Remote Desktop), đồng thời sao lưu tự động bài làm liên tục mỗi 30 giây.</li>
              <li>Hết thời gian làm bài hoặc chạm mốc đóng đề, hệ thống sẽ tự động thu bài và nộp kết quả hiện tại.</li>
            </ul>
          }
          type="warning"
          showIcon
          icon={<ShieldAlert size={20} />}
          className="mb-4 rounded-3 border-0 bg-subtle"
        />

        <div className="mb-4">
          <Text strong className="d-block text-brand-color mb-2">
            Hướng dẫn từ Giảng viên:
          </Text>
          <Paragraph className="velica-lesson-content-box m-0">
            {assessment?.instructions || 'Đọc kỹ câu hỏi trước khi trả lời. Đối với câu tự luận, hãy phân tích dựa trên các ca sử dụng thực tế và nguyên lý Clean Architecture.'}
          </Paragraph>
        </div>

        <div className="text-center">
          {existingSubmission ? (
            <Button
              type="primary"
              icon={<CheckCircle size={16} />}
              onClick={() =>
                navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_SUBMISSION.replace(':id', assessment?.id || id || 'asm-1'))
              }
              className="velica-btn-start"
            >
              Xem lại kết quả bài nộp đã hoàn thành
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<Play size={16} />}
              onClick={handleStartExam}
              disabled={!canStart}
              className="velica-btn-start"
            >
              {isBeforeStart
                ? 'Chưa đến giờ mở đề thi'
                : isAfterEnd
                ? 'Kỳ thi đã đóng'
                : 'Bắt đầu làm bài thi ngay'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};


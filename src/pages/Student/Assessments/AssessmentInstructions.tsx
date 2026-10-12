import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Tag, Alert, Row, Col, Divider } from 'antd';
import { ArrowLeft, Clock, ShieldAlert, CheckCircle, Play } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const AssessmentInstructions: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    const fetchAsm = async () => {
      const data = await mockService.getAssessmentById(id || 'asm-1');
      setAssessment(data);
    };
    fetchAsm();
  }, [id]);

  const handleStartExam = () => {
    navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_TAKING.replace(':id', assessment?.id || 'asm-1'));
  };

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
          message="Nội quy phòng thi trực tuyến Velica"
          description={
            <ul className="m-0 pl-3 leading-relaxed text-sm">
              <li>Hệ thống lưu tự động câu trả lời mỗi 30 giây và lưu đệm trên trình duyệt khi mất mạng.</li>
              <li>Hệ thống ghi nhận lại mọi hành vi chuyển tab trình duyệt hoặc thu nhỏ cửa sổ.</li>
              <li>Hết thời gian làm bài, hệ thống sẽ tự động thu bài và nộp kết quả hiện tại.</li>
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
          <Button
            type="primary"
            icon={<Play size={16} />}
            onClick={handleStartExam}
            className="velica-btn-start"
          >
            Bắt đầu làm bài thi ngay
          </Button>
        </div>
      </Card>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
} from 'antd';
import { Award, MessageSquarePlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Submission } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { StatCard } from '../../../components/velica/StatCard/StatCard';

const { Title, Text } = Typography;

export const StudentResults: React.FC = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [appealDrawerOpen, setAppealDrawerOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getSubmissions();
    setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAppeal = (sub: Submission) => {
    setSelectedSub(sub);
    form.resetFields();
    form.setFieldsValue({
      questionId: sub.answers[sub.answers.length - 1]?.questionId || 'q-5',
    });
    setAppealDrawerOpen(true);
  };

  const handleSubmitAppeal = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedSub) return;
      const currentUser = mockService.getCurrentUser();
      const question = selectedSub.answers.find((a) => a.questionId === values.questionId);

      await mockService.createAppeal({
        submissionId: selectedSub.id,
        assessmentId: selectedSub.assessmentId,
        assessmentTitle: selectedSub.assessmentTitle,
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        questionId: values.questionId,
        questionContent: question?.questionContent || 'Câu hỏi tự luận',
        currentScore: question?.pointsAwarded || 3.5,
        maxPoints: question?.maxPoints || 4.0,
        reason: values.reason,
      });

      message.success('Đã gửi đơn yêu cầu phúc khảo thành công đến Giảng viên!');
      setAppealDrawerOpen(false);
      navigate(ROUTE_PATHS.STUDENT.GRADE_REVIEWS);
    } catch {
      // form error
    }
  };

  const columns = [
    {
      title: 'Tên bài kiểm tra / Kỳ thi',
      dataIndex: 'assessmentTitle',
      key: 'assessmentTitle',
      render: (title: string, record: Submission) => (
        <div>
          <Text strong className="velica-cell-title">{title}</Text>
          <Text type="secondary" className="velica-cell-desc">Nộp lúc: {record.submittedAt}</Text>
        </div>
      ),
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      render: (score: number | null, record: Submission) => (
        <span className={score !== null ? 'velica-score-high' : 'text-warning-color fw-bold'}>
          {score !== null ? `${score} / ${record.maxScore}` : 'Đang chấm'}
        </span>
      ),
    },
    {
      title: 'Trạng thái chấm',
      dataIndex: 'gradingStatus',
      key: 'gradingStatus',
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Nhận xét từ Giảng viên',
      key: 'feedback',
      render: (_: unknown, record: Submission) => {
        const fb = record.answers.find((a) => a.feedback)?.feedback;
        return <Text className="velica-cell-desc">{fb || 'Chưa có nhận xét'}</Text>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Submission) => (
        <Space size="middle">
          <Button
            type="text"
            onClick={() => navigate(`${ROUTE_PATHS.STUDENT.ASSESSMENTS}?review=${record.assessmentId}`)}
            className="text-brand-color fw-semibold"
          >
            Xem bài làm
          </Button>
          <Button
            type="text"
            icon={<MessageSquarePlus size={15} className="text-secondary-color" />}
            onClick={() => handleOpenAppeal(record)}
            className="text-secondary-color fw-semibold"
          >
            Phúc khảo
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENTS)}
          className="velica-back-btn"
        >
          Quay lại Bài thi & Kiểm tra
        </Button>
      </div>

      <div className="mb-4">
        <Title level={4} className="velica-page-title">
          Bảng điểm & Kết quả Học tập
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Tra cứu kết quả điểm thi chi tiết, nhận xét của giảng viên và gửi yêu cầu phúc khảo.
        </Text>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={8}>
          <StatCard
            title="Điểm trung bình tích lũy"
            value="8.5 / 10"
            icon={<Award size={20} />}
            trend={{ value: 'Xếp loại Giỏi', isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Số bài thi đã hoàn thành"
            value={`${submissions.length} bài`}
            trend={{ value: '100% nộp đúng hạn', isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tỷ lệ đạt chuẩn (CLO)"
            value="91.4%"
            subtext="Đạt chuẩn đầu ra môn học"
          />
        </Col>
      </Row>

      <div className="velica-card-table">
        <Table
          dataSource={submissions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Grade Appeal Drawer (Backlog Domain 4 Item 14) */}
      <Drawer
        title={`Gửi Đơn đề nghị Phúc khảo: ${selectedSub?.assessmentTitle}`}
        open={appealDrawerOpen}
        onClose={() => setAppealDrawerOpen(false)}
        width={500}
        extra={
          <Space>
            <Button onClick={() => setAppealDrawerOpen(false)} className="velica-btn-action">
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleSubmitAppeal}
              className="velica-btn-primary"
            >
              Gửi đơn phúc khảo
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="questionId"
            label="Chọn câu hỏi muốn phúc khảo"
            rules={[{ required: true }]}
          >
            <Select className="velica-form-input">
              {selectedSub?.answers.map((ans, idx) => (
                <Select.Option key={ans.questionId} value={ans.questionId}>
                  Câu {idx + 1} ({ans.questionType}): {ans.questionContent.slice(0, 45)}...
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do & Luận điểm đề nghị xem xét lại"
            rules={[{ required: true, message: 'Vui lòng giải trình rõ ràng lý do' }]}
          >
            <Input.TextArea
              rows={5}
              className="velica-form-input"
              placeholder="Vd: Thưa thầy, trong câu tự luận em đã phân tích đầy đủ các lớp UseCase và Interface Segregation theo Clean Architecture, em kính xin thầy xem xét lại điểm tiêu chí này ạ."
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

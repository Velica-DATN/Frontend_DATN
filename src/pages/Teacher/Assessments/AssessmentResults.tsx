import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Drawer,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Tooltip,
} from 'antd';
import {
  ArrowLeft,
  CheckCircle,
  Award,
  Edit,
  Download,
  BarChart3,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment, Submission } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatCard } from '../../../components/velica/StatCard/StatCard';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;

export const AssessmentResults: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [overrideDrawerOpen, setOverrideDrawerOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [viewSubDrawerOpen, setViewSubDrawerOpen] = useState(false);
  const [selectedViewSub, setSelectedViewSub] = useState<Submission | null>(null);

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const [asm, subs] = await Promise.all([
      mockService.getAssessmentById(id || 'asm-1'),
      mockService.getSubmissions(id),
    ]);
    setAssessment(asm);
    setSubmissions(subs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Backlog Domain 3 Item 12: Confirm official results
  const handleConfirmOfficial = () => {
    Modal.confirm({
      title: 'Xác nhận & Công bố Điểm chính thức?',
      content: 'Sau khi chốt điểm chính thức, sinh viên có thể xem điểm và nộp đơn phúc khảo nếu có thắc mắc.',
      okText: 'Chốt điểm',
      cancelText: 'Hủy',
      okButtonProps: { style: { backgroundColor: '#10B981', borderColor: '#10B981', borderRadius: '8px' } },
      cancelButtonProps: { style: { borderRadius: '8px' } },
      onOk: () => {
        message.success('Đã công bố điểm chính thức của kỳ thi thành công!');
      },
    });
  };

  // Backlog Domain 3 Item 13: Override Student Grade
  const handleOpenOverride = (sub: Submission) => {
    setSelectedSub(sub);
    form.setFieldsValue({
      newScore: sub.score || 0,
      reason: '',
    });
    setOverrideDrawerOpen(true);
  };

  const handleSaveOverride = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedSub) return;
      await mockService.overrideGrade(selectedSub.id, values.newScore, values.reason);
      message.success(`Đã cập nhật lại điểm cho sinh viên ${selectedSub.studentName} thành ${values.newScore} điểm.`);
      setOverrideDrawerOpen(false);
      loadData();
    } catch {
      // form error
    }
  };

  const filteredSubmissions = submissions.filter((s) =>
    s.studentName.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Sinh viên',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name: string, record: Submission) => (
        <div>
          <Text strong className="velica-cell-title">{name}</Text>
          <Text type="secondary" className="velica-cell-desc">Thời gian nộp: {record.submittedAt}</Text>
        </div>
      ),
    },
    {
      title: 'Tình trạng nộp',
      dataIndex: 'isLate',
      key: 'isLate',
      render: (isLate: boolean) =>
        isLate ? <Tag color="warning" className="rounded-2">Nộp muộn (-10%)</Tag> : <Tag color="success" className="rounded-2">Đúng giờ</Tag>,
    },
    {
      title: 'Vi phạm phòng thi',
      dataIndex: 'violationCount',
      key: 'violationCount',
      render: (v: number) =>
        v > 0 ? (
          <Tooltip title={`${v} lần ghi nhận rời tab thi hoặc thoát toàn màn hình (Proctoring Log)`}>
            <Tag color="error" className="rounded-2 cursor-pointer d-inline-flex items-center gap-1">
              <AlertTriangle size={12} /> {v} lần
            </Tag>
          </Tooltip>
        ) : (
          <span className="text-muted-color">0 lần</span>
        ),
    },
    {
      title: 'Điểm số chính thức',
      dataIndex: 'score',
      key: 'score',
      render: (score: number | null, record: Submission) => (
        <span className={score !== null ? 'font-bold text-base text-success-color' : 'font-bold text-base text-warning-color'}>
          {score !== null ? `${score} / ${record.maxScore}` : 'Chưa có điểm'}
        </span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Submission) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Eye size={15} className="text-brand-color" />}
            onClick={() => {
              setSelectedViewSub(record);
              setViewSubDrawerOpen(true);
            }}
            className="text-brand-color font-medium"
          >
            Xem bài làm
          </Button>
          <Button
            type="text"
            icon={<Edit size={15} className="text-secondary-color" />}
            onClick={() => handleOpenOverride(record)}
            className="text-secondary-color font-medium"
          >
            Điều chỉnh
          </Button>
        </Space>
      ),
    },
  ];

  // UC-GRD-07: Export Assessment Gradebook
  const handleExportGradebook = () => {
    const csvContent =
      '\uFEFF' +
      'Mã Sinh Viên,Họ và Tên,Thời Gian Nộp,Trạng Thái Nộp,Số Lần Vi Phạm,Điểm Số,Điểm Tối Đa\n' +
      submissions
        .map(
          (s) =>
            `"${s.studentId}","${s.studentName}","${s.submittedAt}","${s.isLate ? 'Nộp muộn' : 'Đúng giờ'}","${s.violationCount || 0}","${s.score ?? 'Chưa chấm'}","${s.maxScore}"`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Bang_Diem_${assessment?.title || 'Ky_Thi'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã xuất bảng điểm kỳ thi ra file Excel (.csv UTF-8 BOM)!');
  };

  return (
    <div className="animate-fade-in">
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS)}
          className="velica-back-btn"
        >
          Quay lại danh sách đề thi
        </Button>
      </div>

      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title">
            Kết quả Khảo thí — {assessment?.title || 'Đề thi'}
          </Title>
        </div>

        <div className="velica-page-header-end">
          <Button
            icon={<BarChart3 size={15} />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.QUESTION_ANALYSIS.replace(':id', id || 'asm-1'))}
            className="velica-btn-action"
          >
            Phân tích câu hỏi (CTT)
          </Button>
          <Button
            icon={<Download size={15} />}
            onClick={handleExportGradebook}
            className="velica-btn-action"
          >
            Xuất bảng điểm Excel
          </Button>
          <Button
            type="primary"
            icon={<CheckCircle size={16} />}
            onClick={handleConfirmOfficial}
            className="velica-btn-publish"
          >
            Chốt & Công bố điểm chính thức
          </Button>
        </div>
      </div>

      {/* Result Metrics */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={6}>
          <StatCard
            title="Điểm trung bình bài thi"
            value="8.5 / 10"
            icon={<Award size={20} />}
            trend={{ value: 'Tốt', isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            title="Điểm cao nhất"
            value="9.5 / 10"
            trend={{ value: 'Cao nhất', isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            title="Điểm thấp nhất"
            value="7.0 / 10"
            subtext="0 sinh viên dưới TB"
          />
        </Col>
        <Col xs={24} sm={6}>
          <StatCard
            title="Số bài đã hoàn thành"
            value={`${submissions.length} bài`}
            subtext="Tỷ lệ nộp 100%"
          />
        </Col>
      </Row>

      <FilterBar
        placeholder="Tìm kiếm theo tên sinh viên..."
        onSearchChange={setSearch}
      />

      <div className="velica-card-table">
        <Table
          dataSource={filteredSubmissions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Override Grade Drawer (Domain 3 Item 13) */}
      <Drawer
        title={`Điều chỉnh điểm sinh viên: ${selectedSub?.studentName}`}
        open={overrideDrawerOpen}
        onClose={() => setOverrideDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setOverrideDrawerOpen(false)}>
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleSaveOverride}
              className="velica-btn-primary"
            >
              Cập nhật điểm mới
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="velica-drawer-form">
          <div className="velica-clo-card mb-3">
            <Text type="secondary">Điểm số hiện tại:</Text>{' '}
            <Text strong className="text-brand-color font-bold text-base">
              {selectedSub?.score} / {selectedSub?.maxScore} điểm
            </Text>
          </div>

          <Form.Item
            name="newScore"
            label="Điểm số điều chỉnh mới"
            rules={[{ required: true, message: 'Nhập điểm mới' }]}
          >
            <InputNumber min={0} max={10} step={0.25} className="w-100" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do điều chỉnh điểm (Bắt buộc theo chuẩn Audit Log)"
            rules={[{ required: true, message: 'Vui lòng nhập lý do cụ thể' }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Vd: Phúc khảo tiêu chí 2 rubric tự luận, sinh viên giải trình bổ sung sơ đồ hợp lệ..."
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* View Full Student Submission Drawer */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              Bài làm Khảo thí: {selectedViewSub?.studentName}
            </div>
            <div className="velica-drawer-subtitle">
              MSSV: {selectedViewSub?.studentId} • Nộp lúc: {selectedViewSub?.submittedAt} • Điểm: <strong>{selectedViewSub?.score !== null ? `${selectedViewSub?.score} / ${selectedViewSub?.maxScore} đ` : 'Chờ chấm tự luận'}</strong>
            </div>
          </div>
        }
        open={viewSubDrawerOpen}
        onClose={() => setViewSubDrawerOpen(false)}
        width={640}
        extra={
          <Space>
            {selectedViewSub && (
              <Button
                type="primary"
                icon={<Edit size={14} />}
                onClick={() => {
                  handleOpenOverride(selectedViewSub);
                }}
                className="velica-btn-primary"
              >
                Điều chỉnh điểm
              </Button>
            )}
            <Button onClick={() => setViewSubDrawerOpen(false)}>Đóng</Button>
          </Space>
        }
      >
        {selectedViewSub && (
          <div>
            {/* Overview Summary Box */}
            <div className="p-3 bg-muted rounded-2 border mb-4">
              <Row gutter={[12, 12]}>
                <Col span={8}>
                  <div className="text-xs text-muted-color">Điểm chính thức:</div>
                  <div className="velica-score-high text-lg font-bold">
                    {selectedViewSub.score !== null ? `${selectedViewSub.score} / ${selectedViewSub.maxScore} đ` : 'Chờ chấm'}
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-xs text-muted-color">Tình trạng nộp:</div>
                  <div className="font-semibold text-xs mt-1">
                    {selectedViewSub.isLate ? (
                      <Tag color="warning">Nộp muộn (-10%)</Tag>
                    ) : (
                      <Tag color="success">Đúng giờ</Tag>
                    )}
                  </div>
                </Col>
                <Col span={8}>
                  <div className="text-xs text-muted-color">Cảnh báo vi phạm:</div>
                  <div className="font-semibold text-xs mt-1">
                    {selectedViewSub.violationCount > 0 ? (
                      <Tag color="error">{selectedViewSub.violationCount} lần rời tab</Tag>
                    ) : (
                      <Tag color="green">0 vi phạm</Tag>
                    )}
                  </div>
                </Col>
              </Row>
            </div>

            {/* Questions Breakdown */}
            <h4 className="text-sm font-bold text-primary-color mb-3">
              Chi tiết câu trả lời & Điểm thành phần ({selectedViewSub.answers?.length || 0} câu):
            </h4>

            {selectedViewSub.answers?.map((ans, idx) => (
              <div key={ans.questionId} className="p-3 border rounded-2 mb-3 bg-white shadow-2xs">
                <div className="d-flex items-center justify-between mb-2">
                  <div className="d-flex items-center gap-2">
                    <span className="font-bold text-xs text-brand-color">
                      Câu #{idx + 1}
                    </span>
                    <Tag color={ans.questionType === 'ESSAY' ? 'orange' : 'blue'} className="text-xs">
                      {ans.questionType === 'ESSAY' ? 'Tự luận' : 'Trắc nghiệm'}
                    </Tag>
                  </div>
                  <span className="velica-score-high text-xs font-bold">
                    {ans.pointsAwarded !== null && ans.pointsAwarded !== undefined
                      ? `${ans.pointsAwarded} / ${ans.maxPoints} đ`
                      : `Chờ chấm / ${ans.maxPoints} đ`}
                  </span>
                </div>

                <div className="text-xs font-medium text-primary-color mb-2">
                  {ans.questionContent || 'Nội dung câu hỏi khảo thí'}
                </div>

                <div className="p-2 bg-subtle rounded-1 text-xs mb-2">
                  <div className="text-muted-color font-semibold mb-1">Câu trả lời của sinh viên:</div>
                  <div className="font-medium text-primary-color whitespace-pre-wrap">
                    {typeof ans.studentAnswer === 'string' ? ans.studentAnswer : JSON.stringify(ans.studentAnswer)}
                  </div>
                </div>

                {ans.feedback && (
                  <div className="text-xs text-secondary-color bg-warning-bg p-2 rounded-1 border-warning-border">
                    <strong>Lời phê của Giảng viên:</strong> {ans.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </div>
  );
};

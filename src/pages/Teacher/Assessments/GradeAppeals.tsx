import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Tooltip,
  Select,
  Alert,
} from 'antd';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Award,
  MessageSquare,
  FileText,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { GradeAppeal, Assessment } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { APPEAL_STATUS } from '../../../constants/assessmentConstants';

const { Text, Paragraph } = Typography;

export const GradeAppeals: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [appeals, setAppeals] = useState<GradeAppeal[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(id || 'all');
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<GradeAppeal | null>(null);
  const [regradeModalOpen, setRegradeModalOpen] = useState(false);

  const [form] = Form.useForm();

  const loadData = async (filterAsmId?: string) => {
    setLoading(true);
    const targetFilter = filterAsmId !== undefined ? filterAsmId : selectedAssessmentId;
    const [data, asms] = await Promise.all([
      mockService.getAppeals(targetFilter === 'all' ? undefined : targetFilter),
      mockService.getAssessments(),
    ]);
    setAppeals(data);
    setAssessments(asms);
    setLoading(false);
  };

  useEffect(() => {
    loadData(id || 'all');
    if (id) {
      setSelectedAssessmentId(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAssessmentFilterChange = (asmId: string) => {
    setSelectedAssessmentId(asmId);
    loadData(asmId);
  };

  const handleOpenRegrade = (appeal: GradeAppeal) => {
    setSelectedAppeal(appeal);
    form.setFieldsValue({
      newScore: appeal.updatedScore !== undefined ? appeal.updatedScore : appeal.currentScore,
      response: appeal.teacherResponse || '',
    });
    setRegradeModalOpen(true);
  };

  const handleSaveRegrade = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedAppeal) return;

      const trimmedResp = values.response?.trim();
      // Audit trail requirement: When changing student score, explanation is required
      if (values.newScore !== selectedAppeal.currentScore && !trimmedResp) {
        message.error('Vui lòng nhập nhận xét/căn cứ điều chỉnh điểm khi phúc khảo bài thi theo quy chế khảo thí!');
        return;
      }

      await mockService.respondAppeal(
        selectedAppeal.id,
        APPEAL_STATUS.APPROVED,
        trimmedResp || 'Giảng viên đã xem lại bài thi và chấm lại điểm số mới.',
        values.newScore
      );

      message.success(
        `Đã hoàn tất chấm phúc khảo! Điểm mới bài thi của ${selectedAppeal.studentName} là ${values.newScore}đ.`
      );

      setRegradeModalOpen(false);
      loadData();
    } catch {
      // form validation error
    }
  };

  const handleRejectAppeal = async () => {
    try {
      const values = form.getFieldsValue();
      if (!selectedAppeal) return;

      const trimmedResp = values.response?.trim();
      if (!trimmedResp) {
        message.error('Vui lòng nhập lý do từ chối đơn phúc khảo trong ô Nhận xét để gửi thông báo cho sinh viên!');
        return;
      }

      await mockService.respondAppeal(
        selectedAppeal.id,
        APPEAL_STATUS.REJECTED,
        trimmedResp,
        selectedAppeal.currentScore
      );

      message.info(
        `Đã từ chối đơn phúc khảo của ${selectedAppeal.studentName}. Giữ nguyên điểm số ban đầu (${selectedAppeal.currentScore}đ).`
      );

      setRegradeModalOpen(false);
      loadData();
    } catch {
      // error
    }
  };

  const columns = [
    {
      title: 'Sinh viên nộp đơn',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 200,
      render: (name: string, record: GradeAppeal) => (
        <div>
          <span
            className="velica-cell-title cursor-pointer hover-text-brand d-block"
            onClick={() => handleOpenRegrade(record)}
          >
            {name}
          </span>
          <span className="velica-cell-desc d-block text-truncate">
            Thời gian nộp: {record.createdAt.replace('T', ' ').slice(0, 16)}
          </span>
        </div>
      ),
    },
    {
      title: 'Bài thi đề nghị phúc khảo',
      dataIndex: 'assessmentTitle',
      key: 'assessmentTitle',
      width: 260,
      render: (title: string, record: GradeAppeal) => (
        <div>
          <Text strong className="text-sm text-primary-color d-block text-truncate">
            {title}
          </Text>
          <span className="text-2xs text-muted-color">Mã bài nộp: {record.submissionId}</span>
        </div>
      ),
    },
    {
      title: 'Điểm bài thi',
      key: 'score',
      width: 160,
      render: (_: unknown, record: GradeAppeal) => (
        <div>
          <span className="font-semibold text-primary-color text-xs">
            {record.currentScore} / {record.maxPoints} đ
          </span>
          {record.updatedScore !== undefined && record.updatedScore !== record.currentScore && (
            <div className="d-flex items-center gap-1 mt-0.5">
              <span className="text-2xs text-muted-color">Chấm lại:</span>
              <Tag color="green" className="m-0 text-2xs font-bold">
                {record.updatedScore} đ
              </Tag>
            </div>
          )}
          {record.status === APPEAL_STATUS.APPROVED && (
            <div className="mt-1">
              <Tag color="cyan" className="m-0 text-2xs font-semibold">
                ✓ Đã đồng bộ sổ điểm
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Nội dung đơn phúc khảo',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string, record: GradeAppeal) => (
        <Tooltip title={reason} placement="topLeft">
          <span
            className="text-xs text-secondary-color velica-table-cell-ellipsis cursor-pointer d-block"
            onClick={() => handleOpenRegrade(record)}
          >
            {reason}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Nhận xét của Giảng viên',
      dataIndex: 'teacherResponse',
      key: 'teacherResponse',
      width: 220,
      ellipsis: true,
      render: (resp?: string, record?: GradeAppeal) => (
        <Tooltip title={resp || 'Chưa xử lý chấm lại'} placement="topLeft">
          <span
            className={`text-truncate d-block cursor-pointer ${
              resp ? 'velica-score-high font-medium text-xs' : 'velica-cell-desc text-xs'
            }`}
            onClick={() => record && handleOpenRegrade(record)}
          >
            {resp || 'Chưa có nhận xét...'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 250,
      align: 'right' as const,
      render: (_: unknown, record: GradeAppeal) => (
        <Space size="small">
          <Tooltip title="Trỏ qua xem toàn bộ bài làm và các câu trả lời của học sinh">
            <Button
              size="small"
              icon={<ExternalLink size={13} />}
              onClick={() =>
                navigate(`/teacher/submissions/${record.submissionId}/grading?appealId=${record.id}`)
              }
              className="velica-btn-action"
            >
              Trỏ qua bài làm
            </Button>
          </Tooltip>

          <Button
            type="primary"
            size="small"
            icon={<Award size={13} />}
            className="velica-btn-primary"
            onClick={() => handleOpenRegrade(record)}
          >
            {record.status === APPEAL_STATUS.PENDING ? 'Chấm phúc khảo' : 'Chấm lại'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {Boolean(id) && (
        <div className="velica-back-nav-bar">
          <Button
            type="text"
            icon={<ArrowLeft size={14} />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_RESULTS.replace(':id', id!))}
            className="velica-back-btn"
          >
            Quay lại kết quả đề thi
          </Button>
        </div>
      )}

      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h2 className="velica-page-title">
            Xử lý Đơn Đề nghị Phúc khảo
          </h2>
          <p className="velica-page-desc">
            Tiếp nhận đơn phúc khảo của sinh viên. Giảng viên trỏ qua xem bài làm của học sinh, bấm chấm phúc khảo và nhập điểm số mới.
          </p>
        </div>

        <div className="velica-page-header-end">
          <div className="d-flex items-center gap-2">
            <span className="text-xs text-muted-color font-medium">Lọc theo kỳ thi:</span>
            <Select
              value={selectedAssessmentId}
              onChange={handleAssessmentFilterChange}
              style={{ width: 260 }}
              options={[
                { value: 'all', label: 'Tất cả bài thi & kỳ thi' },
                ...assessments.map((a) => ({
                  value: a.id,
                  label: a.title,
                })),
              ]}
            />
          </div>
        </div>
      </div>

      <div className="velica-card-table">
        <Table
          dataSource={appeals}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          tableLayout="fixed"
        />
      </div>

      {/* Drawer Chấm phúc khảo: mở từ bên phải đồng bộ với hệ thống */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-color" />
            <span className="font-bold">
              Chấm Phúc khảo Bài thi — {selectedAppeal?.studentName}
            </span>
          </div>
        }
        open={regradeModalOpen}
        onClose={() => setRegradeModalOpen(false)}
        footer={
          <div className="d-flex justify-between items-center w-100 flex-wrap gap-2 py-1">
            <div>
              {selectedAppeal && (
                <Button
                  key="view-exam"
                  size="small"
                  icon={<ExternalLink size={13} />}
                  onClick={() => {
                    setRegradeModalOpen(false);
                    navigate(`/teacher/submissions/${selectedAppeal.submissionId}/grading?appealId=${selectedAppeal.id}`);
                  }}
                >
                  Xem bài làm
                </Button>
              )}
            </div>
            <Space>
              <Button key="cancel" onClick={() => setRegradeModalOpen(false)}>
                Đóng
              </Button>
              <Button
                key="reject"
                danger
                onClick={handleRejectAppeal}
              >
                Từ chối
              </Button>
              <Button
                key="submit"
                type="primary"
                icon={<Check size={14} />}
                onClick={handleSaveRegrade}
                className="velica-btn-primary"
              >
                Duyệt & Lưu điểm
              </Button>
            </Space>
          </div>
        }
        width={560}
        destroyOnClose
      >
        {selectedAppeal && (
          <div className="py-2 d-flex flex-col gap-3">
            {/* Đơn chỉ có điểm bài thi, với nội dung thôi */}
            <div className="p-3 bg-light border rounded-3">
              <div className="d-flex justify-between items-center mb-1 text-xs">
                <span className="text-muted-color">Bài thi đề nghị phúc khảo:</span>
                <strong className="text-primary-color">{selectedAppeal.assessmentTitle}</strong>
              </div>
              <div className="d-flex justify-between items-center text-xs">
                <span className="text-muted-color">Điểm bài thi hiện tại:</span>
                <strong className="text-brand-color fs-15">
                  {selectedAppeal.currentScore} / {selectedAppeal.maxPoints} đ
                </strong>
              </div>
              {selectedAppeal.updatedScore !== undefined && (
                <div className="d-flex justify-between items-center text-xs mt-1 pt-1 border-top">
                  <span className="text-success-color font-bold">Điểm sau khi chấm lại:</span>
                  <strong className="text-success fs-15">
                    {selectedAppeal.updatedScore} / {selectedAppeal.maxPoints} đ
                  </strong>
                </div>
              )}
            </div>

            {/* Nội dung đơn phúc khảo */}
            <div className="p-3 bg-white border rounded-3">
              <span className="text-2xs uppercase tracking-wider text-muted-color font-bold d-block mb-1">
                Nội dung đơn phúc khảo của sinh viên:
              </span>
              <div className="text-xs text-primary-color p-2.5 bg-light rounded-2 border lh-base">
                {selectedAppeal.reason}
              </div>
            </div>

            <Alert
              type="info"
              showIcon
              className="py-1.5 px-2.5 text-2xs"
              message={<span className="font-semibold text-xs">Tự động đồng bộ & Lưu vết kiểm toán</span>}
              description="Khi duyệt và lưu điểm mới, hệ thống tự động cập nhật bảng điểm môn học và lưu vết nhật ký kiểm toán dạng [Phúc khảo] minh bạch cho sinh viên và khoa khảo thí."
            />

            {/* Form chấm điểm mới */}
            <Form form={form} layout="vertical" className="mt-1">
              <Form.Item
                name="newScore"
                label={<span className="font-semibold text-xs">Điểm mới của bài thi (thang 10):</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập điểm mới của bài thi' },
                  { type: 'number', min: 0, max: selectedAppeal.maxPoints || 10, message: `Điểm phải nằm trong khoảng từ 0 đến ${selectedAppeal.maxPoints || 10}đ` },
                ]}
              >
                <InputNumber
                  min={0}
                  max={selectedAppeal.maxPoints || 10}
                  step={0.25}
                  className="w-100"
                  addonAfter="đ"
                  autoFocus
                />
              </Form.Item>

              <Form.Item
                name="response"
                label={<span className="font-semibold text-xs">Nhận xét của Giảng viên (nếu có):</span>}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Nhập nhận xét hoặc lời phê gửi đến sinh viên (nếu có)..."
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
};

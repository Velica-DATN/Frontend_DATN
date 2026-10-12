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
  Divider,
} from 'antd';
import { ArrowLeft, Check, X, FileCheck2, Eye, MessageSquare, Award } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { GradeAppeal, Submission } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { APPEAL_STATUS } from '../../../constants/assessmentConstants';

const { Title, Text, Paragraph } = Typography;

export const GradeAppeals: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [appeals, setAppeals] = useState<GradeAppeal[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<GradeAppeal | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'VIEW'>('VIEW');
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const [data, subs] = await Promise.all([
      mockService.getAppeals(id),
      mockService.getSubmissions(),
    ]);
    setAppeals(data);
    setSubmissions(subs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOpenAction = (appeal: GradeAppeal, type: 'APPROVE' | 'REJECT' | 'VIEW') => {
    setSelectedAppeal(appeal);
    setActionType(type);
    form.setFieldsValue({
      newScore: type === 'APPROVE' ? Math.min(appeal.currentScore + 0.5, appeal.maxPoints) : appeal.currentScore,
      response: appeal.teacherResponse || '',
    });
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedAppeal) return;

      if (actionType === 'APPROVE') {
        await mockService.respondAppeal(
          selectedAppeal.id,
          APPEAL_STATUS.APPROVED,
          values.response,
          values.newScore
        );
        message.success(`Đã chấp thuận đơn phúc khảo của ${selectedAppeal.studentName}! Điểm đã cập nhật.`);
      } else if (actionType === 'REJECT') {
        await mockService.respondAppeal(
          selectedAppeal.id,
          APPEAL_STATUS.REJECTED,
          values.response
        );
        message.info(`Đã từ chối đơn phúc khảo của ${selectedAppeal.studentName}.`);
      }

      setDrawerOpen(false);
      loadData();
    } catch {
      // form error
    }
  };

  // Find relevant student answer
  const matchedSubmission = selectedAppeal
    ? submissions.find(
        (s) => s.id === selectedAppeal.submissionId || s.studentName === selectedAppeal.studentName
      )
    : null;
  const matchedAnswer = matchedSubmission?.answers.find(
    (a) => a.questionId === selectedAppeal?.questionId || a.questionType === 'ESSAY'
  );

  const columns = [
    {
      title: 'Sinh viên nộp đơn',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 170,
      ellipsis: true,
      render: (name: string, record: GradeAppeal) => (
        <div style={{ maxWidth: 150 }}>
          <Tooltip title={name} placement="topLeft">
            <span className="velica-cell-title">{name}</span>
          </Tooltip>
          <span className="velica-cell-desc-single">
            {record.createdAt.replace('T', ' ').slice(0, 16)}
          </span>
        </div>
      ),
    },
    {
      title: 'Câu hỏi phúc khảo',
      dataIndex: 'questionContent',
      key: 'questionContent',
      width: 260,
      ellipsis: true,
      render: (content: string, record: GradeAppeal) => (
        <Tooltip title={`${content} (Bấm để xem chi tiết bài làm & câu hỏi)`} placement="topLeft">
          <span
            className="cursor-pointer text-sm text-primary-color velica-table-cell-ellipsis hover-text-brand"
            style={{ maxWidth: 230 }}
            onClick={() => handleOpenAction(record, 'VIEW')}
          >
            {content}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Điểm hiện tại',
      dataIndex: 'currentScore',
      key: 'currentScore',
      width: 100,
      render: (score: number, record: GradeAppeal) => (
        <span className="font-semibold text-primary-color">{score} / {record.maxPoints} đ</span>
      ),
    },
    {
      title: 'Lý do phúc khảo',
      dataIndex: 'reason',
      key: 'reason',
      width: 250,
      ellipsis: true,
      render: (reason: string, record: GradeAppeal) => (
        <Tooltip title={reason} placement="topLeft">
          <span
            className="text-xs text-muted-color velica-table-cell-ellipsis cursor-pointer"
            style={{ maxWidth: 220 }}
            onClick={() => handleOpenAction(record, 'VIEW')}
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
      width: 110,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 220,
      align: 'right' as const,
      render: (_: unknown, record: GradeAppeal) => {
        if (record.status !== APPEAL_STATUS.PENDING) {
          return (
            <Space size="small">
              <Button
                size="small"
                icon={<Eye size={13} />}
                onClick={() => handleOpenAction(record, 'VIEW')}
                className="velica-btn-action"
              >
                Xem chi tiết
              </Button>
            </Space>
          );
        }

        return (
          <Space size="small">
            <Button
              size="small"
              icon={<Eye size={13} />}
              onClick={() => handleOpenAction(record, 'VIEW')}
              className="velica-btn-action"
            >
              Xem xét
            </Button>
            <Button
              type="primary"
              size="small"
              icon={<Check size={13} />}
              className="velica-btn-emerald"
              onClick={() => handleOpenAction(record, 'APPROVE')}
            >
              Duyệt
            </Button>
            <Button
              size="small"
              danger
              icon={<X size={13} />}
              className="rounded-2 font-medium"
              onClick={() => handleOpenAction(record, 'REJECT')}
            >
              Từ chối
            </Button>
          </Space>
        );
      },
    },
  ];

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
          <h2 className="velica-page-title">
            Xem xét & Xử lý Đơn Phúc khảo Điểm thi
          </h2>
          <p className="velica-page-desc">
            Xem lý do đề nghị chấm lại của sinh viên, đối chiếu bài làm thực tế và quyết định điều chỉnh điểm số hoặc bảo lưu kết quả.
          </p>
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

      {/* Comprehensive Slide-over Drawer with Full Student Answer & Rubric Context */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <Award size={18} className="text-brand-color" />
            <span className="font-bold">
              {actionType === 'APPROVE'
                ? 'Chấp thuận & Tăng điểm phúc khảo'
                : actionType === 'REJECT'
                ? 'Từ chối đơn phúc khảo'
                : 'Chi tiết Đơn Phúc khảo & Bài làm Sinh viên'}
            </span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={560}
        extra={
          actionType !== 'VIEW' ? (
            <Space>
              <Button onClick={() => setDrawerOpen(false)}>Hủy</Button>
              <Button
                type="primary"
                onClick={handleDrawerSubmit}
                className={actionType === 'APPROVE' ? 'velica-btn-emerald' : 'velica-btn-danger'}
              >
                {actionType === 'APPROVE' ? 'Xác nhận tăng điểm' : 'Xác nhận từ chối'}
              </Button>
            </Space>
          ) : (
            <Space>
              {selectedAppeal?.status === APPEAL_STATUS.PENDING && (
                <>
                  <Button
                    type="primary"
                    className="velica-btn-emerald"
                    icon={<Check size={14} />}
                    onClick={() => {
                      setActionType('APPROVE');
                      form.setFieldsValue({
                        newScore: Math.min((selectedAppeal?.currentScore || 0) + 0.5, selectedAppeal?.maxPoints || 10),
                        response: '',
                      });
                    }}
                  >
                    Chấp thuận
                  </Button>
                  <Button
                    danger
                    icon={<X size={14} />}
                    onClick={() => {
                      setActionType('REJECT');
                      form.setFieldsValue({ response: '' });
                    }}
                  >
                    Từ chối
                  </Button>
                </>
              )}
            </Space>
          )
        }
      >
        {selectedAppeal && (
          <div className="d-flex flex-col gap-3">
            {/* 1. Student & Assessment Info Badge Box */}
            <div className="p-3 bg-light border rounded-3">
              <div className="d-flex justify-between items-center mb-2">
                <div>
                  <Text strong className="text-sm text-primary-color d-block">
                    {selectedAppeal.studentName}
                  </Text>
                  <span className="text-xs text-muted-color">
                    Thời gian gửi đơn: {selectedAppeal.createdAt.replace('T', ' ').slice(0, 16)}
                  </span>
                </div>
                <StatusBadge status={selectedAppeal.status} size="sm" />
              </div>

              <div className="d-flex items-center gap-3 pt-2 border-top text-xs">
                <div>
                  <span className="text-muted-color">Kỳ thi: </span>
                  <strong>{selectedAppeal.assessmentTitle}</strong>
                </div>
                <div>
                  <span className="text-muted-color">Điểm hiện tại: </span>
                  <strong className="text-brand-color">
                    {selectedAppeal.currentScore} / {selectedAppeal.maxPoints} đ
                  </strong>
                </div>
              </div>
            </div>

            {/* 2. Full Question Content */}
            <div className="p-3 bg-white border rounded-3">
              <div className="text-xs font-bold text-muted-color text-uppercase mb-1">
                Nội dung câu hỏi đề thi ({selectedAppeal.questionId}):
              </div>
              <div className="text-sm text-primary-color font-medium">
                {selectedAppeal.questionContent}
              </div>
            </div>

            {/* 3. Student Answer in Exam */}
            <div className="p-3 bg-light-brand border border-brand-subtle rounded-3">
              <div className="text-xs font-bold text-brand-color text-uppercase mb-1">
                Bài làm thực tế của sinh viên trong kỳ thi:
              </div>
              <div className="text-xs text-primary-color lh-base">
                {matchedAnswer?.studentAnswer ||
                  'Sinh viên trình bày: Áp dụng kiến trúc Clean Architecture phân tách thành 4 tầng đồng tâm: 1) Entities (Enterprise Business Rules), 2) Use Cases (Application Business Rules), 3) Interface Adapters (Controllers, Gateways, Presenters), 4) Frameworks & Drivers (Web, DB, UI). Nguyên tắc phụ thuộc (Dependency Rule) luôn hướng từ ngoài vào trong, không cho phép tầng bên trong biết bất kỳ chi tiết cài đặt nào của tầng bên ngoài.'}
              </div>
            </div>

            {/* 4. Student Appeal Reason */}
            <div className="p-3 bg-white border rounded-3">
              <div className="d-flex items-center gap-2 text-xs font-bold text-secondary-color text-uppercase mb-1">
                <MessageSquare size={13} className="text-warning-color" />
                <span>Lý do sinh viên đề nghị phúc khảo:</span>
              </div>
              <div className="text-xs text-primary-color p-2 bg-light rounded-2 border">
                {selectedAppeal.reason}
              </div>
            </div>

            {/* 5. Existing Teacher Response if already resolved */}
            {selectedAppeal.teacherResponse && (
              <div className="p-3 bg-light-green border border-success-subtle rounded-3">
                <div className="text-xs font-bold text-success-color text-uppercase mb-1">
                  Phản hồi đã gửi cho sinh viên:
                </div>
                <div className="text-xs text-primary-color font-medium">
                  {selectedAppeal.teacherResponse}
                </div>
              </div>
            )}

            {/* 6. Action Form if Approving or Rejecting */}
            {actionType !== 'VIEW' && (
              <Form form={form} layout="vertical" className="mt-2 pt-2 border-top">
                {actionType === 'APPROVE' && (
                  <Form.Item
                    name="newScore"
                    label={<span className="font-semibold text-xs">Điểm số mới sau phúc khảo:</span>}
                    rules={[{ required: true, message: 'Nhập điểm mới' }]}
                  >
                    <InputNumber
                      min={0}
                      max={selectedAppeal.maxPoints}
                      step={0.25}
                      className="w-100"
                      addonAfter="đ"
                    />
                  </Form.Item>
                )}

                <Form.Item
                  name="response"
                  label={<span className="font-semibold text-xs">Lời giải thích & Phản hồi sư phạm gửi sinh viên:</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập phản hồi gửi cho sinh viên' }]}
                >
                  <Input.TextArea
                    rows={4}
                    placeholder={
                      actionType === 'APPROVE'
                        ? 'Vd: Đã thẩm định lại bài làm, giảng viên đồng ý bổ sung 0.5 điểm cho phần phân tích nguyên tắc Dependency Rule...'
                        : 'Vd: Lời giải tự luận của em đúng về khái niệm Clean Architecture nhưng chưa làm rõ phương án xử lý bù trừ khi cơ sở dữ liệu bị timeout...'
                    }
                  />
                </Form.Item>
              </Form>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

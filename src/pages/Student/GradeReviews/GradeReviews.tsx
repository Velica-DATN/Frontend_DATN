import React, { useState, useEffect } from 'react';
import { Table, Typography, Button, Tooltip, Drawer, Tag, Space } from 'antd';
import { ArrowLeft, Eye, MessageSquare, ShieldCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { GradeAppeal } from '../../../interfaces/velica.interfaces';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { APPEAL_STATUS } from '../../../constants/assessmentConstants';
import { GradeAppealModal } from '../../../components/velica/GradeAppealModal/GradeAppealModal';

const { Title, Text } = Typography;

export const GradeReviews: React.FC = () => {
  const navigate = useNavigate();
  const [appeals, setAppeals] = useState<GradeAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<GradeAppeal | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [appealModalOpen, setAppealModalOpen] = useState(false);

  useEffect(() => {
    const fetchAppeals = async () => {
      setLoading(true);
      const data = await mockService.getAppeals();
      setAppeals(data);
      setLoading(false);
    };
    fetchAppeals();
  }, []);

  const handleOpenDetail = (appeal: GradeAppeal) => {
    setSelectedAppeal(appeal);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: 'Tên bài kiểm tra',
      dataIndex: 'assessmentTitle',
      key: 'assessmentTitle',
      width: 220,
      render: (title: string, record: GradeAppeal) => (
        <div>
          <Text strong className="velica-cell-title text-truncate d-block">{title}</Text>
          <span className="velica-cell-desc d-block text-truncate">
            Ngày gửi: {record.createdAt.replace('T', ' ').slice(0, 16)}
          </span>
        </div>
      ),
    },
    {
      title: 'Nội dung câu hỏi',
      dataIndex: 'questionContent',
      key: 'questionContent',
      ellipsis: true,
      render: (q: string, record: GradeAppeal) => (
        <Tooltip title={`${q} (Bấm để xem chi tiết đơn)`} placement="topLeft">
          <span
            className="fs-13 text-secondary-color text-truncate d-block cursor-pointer hover-text-brand"
            onClick={() => handleOpenDetail(record)}
          >
            {q}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Điểm số',
      key: 'score',
      width: 100,
      render: (_: unknown, record: GradeAppeal) => (
        <span className="font-semibold text-primary-color">
          {record.currentScore} / {record.maxPoints} đ
        </span>
      ),
    },
    {
      title: 'Lý do phúc khảo',
      dataIndex: 'reason',
      key: 'reason',
      width: 220,
      ellipsis: true,
      render: (reason: string, record: GradeAppeal) => (
        <Tooltip title={reason} placement="topLeft">
          <span
            className="velica-cell-desc text-truncate d-block cursor-pointer"
            onClick={() => handleOpenDetail(record)}
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
      width: 120,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Phản hồi từ Giảng viên',
      dataIndex: 'teacherResponse',
      key: 'teacherResponse',
      width: 220,
      ellipsis: true,
      render: (resp?: string, record?: GradeAppeal) => (
        <Tooltip title={resp || 'Đang chờ giảng viên chấm phúc khảo và phản hồi'} placement="topLeft">
          <span
            className={`cursor-pointer text-truncate d-block ${
              resp ? 'velica-score-high font-semibold' : 'velica-cell-desc'
            }`}
            onClick={() => record && handleOpenDetail(record)}
          >
            {resp || 'Chờ giảng viên phản hồi...'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 110,
      align: 'right' as const,
      render: (_: unknown, record: GradeAppeal) => (
        <Button
          size="small"
          icon={<Eye size={13} />}
          onClick={() => handleOpenDetail(record)}
          className="velica-btn-action"
        >
          Chi tiết
        </Button>
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

      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h2 className="velica-page-title">
            Lịch sử Đơn đề nghị Phúc khảo
          </h2>
          <p className="velica-page-desc">
            Theo dõi tiến độ xử lý, giải trình học thuật và kết quả phúc khảo điểm số từ hội đồng bộ môn.
          </p>
        </div>
        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<ShieldAlert size={15} />}
            onClick={() => setAppealModalOpen(true)}
            className="velica-btn-primary"
          >
            Tạo đơn phúc khảo mới
          </Button>
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

      {/* Detail Slide-over Drawer */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand-color" />
            <span className="font-bold">Chi tiết Đơn đề nghị Phúc khảo</span>
          </div>
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={500}
      >
        {selectedAppeal && (
          <div className="d-flex flex-col gap-3">
            {/* Header Card */}
            <div className="p-3 bg-light border rounded-3">
              <div className="d-flex justify-between items-center mb-2">
                <div>
                  <span className="badge bg-light-brand text-brand-color font-bold text-xs mb-1">
                    {selectedAppeal.assessmentTitle}
                  </span>
                  <div className="text-xs text-muted-color">
                    Thời gian nộp: {selectedAppeal.createdAt.replace('T', ' ').slice(0, 16)}
                  </div>
                </div>
                <StatusBadge status={selectedAppeal.status} size="sm" />
              </div>

              <div className="d-flex items-center justify-between pt-2 border-top text-xs">
                <span>Điểm số sau chấm:</span>
                <strong className="text-brand-color fs-14">
                  {selectedAppeal.currentScore} / {selectedAppeal.maxPoints} đ
                </strong>
              </div>
            </div>

            {/* Question Details */}
            <div className="p-3 bg-white border rounded-3">
              <div className="text-xs font-bold text-muted-color text-uppercase mb-1">
                Nội dung câu hỏi đề nghị phúc khảo ({selectedAppeal.questionId}):
              </div>
              <div className="text-sm text-primary-color font-medium">
                {selectedAppeal.questionContent}
              </div>
            </div>

            {/* Student's Reason */}
            <div className="p-3 bg-white border rounded-3">
              <div className="d-flex items-center gap-2 text-xs font-bold text-secondary-color text-uppercase mb-1">
                <MessageSquare size={13} className="text-warning-color" />
                <span>Nội dung giải trình của Bạn:</span>
              </div>
              <div className="text-xs text-primary-color p-2 bg-light rounded-2 border lh-base">
                {selectedAppeal.reason}
              </div>
            </div>

            {/* Teacher Feedback */}
            <div
              className={`p-3 border rounded-3 ${
                selectedAppeal.status === APPEAL_STATUS.APPROVED
                  ? 'bg-light-green border-success-subtle'
                  : selectedAppeal.status === APPEAL_STATUS.REJECTED
                  ? 'bg-light border-danger-subtle'
                  : 'bg-light border-light'
              }`}
            >
              <div className="d-flex items-center gap-2 text-xs font-bold text-uppercase mb-1">
                <CheckCircle2
                  size={14}
                  className={
                    selectedAppeal.status === APPEAL_STATUS.APPROVED
                      ? 'text-success-color'
                      : 'text-secondary-color'
                  }
                />
                <span
                  className={
                    selectedAppeal.status === APPEAL_STATUS.APPROVED
                      ? 'text-success-color'
                      : 'text-primary-color'
                  }
                >
                  Kết luận & Phản hồi từ Giảng viên:
                </span>
              </div>

              <div className="text-xs text-primary-color p-2 bg-white rounded-2 border lh-base mt-2">
                {selectedAppeal.teacherResponse || (
                  <span className="text-muted-color italic">
                    Hội đồng bộ môn đang trong quá trình tiếp nhận và thẩm định lại bài làm của bạn. Kết quả sẽ được cập nhật sớm.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Grade Appeal Creation Modal */}
      <GradeAppealModal
        open={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
        onSuccess={(newAppeal) => {
          setAppeals((prev) => [newAppeal, ...prev]);
          setAppealModalOpen(false);
        }}
      />
    </div>
  );
};


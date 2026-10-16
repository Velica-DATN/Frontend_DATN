import React, { useState, useEffect } from 'react';
import { Table, Typography, Button, Tooltip, Drawer, Tag, Space } from 'antd';
import { ArrowLeft, Eye, MessageSquare, ShieldCheck, CheckCircle2, ShieldAlert, FileText, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { GradeAppeal } from '../../../interfaces/velica.interfaces';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { APPEAL_STATUS } from '../../../constants/assessmentConstants';
import { GradeAppealModal } from '../../../components/velica/GradeAppealModal/GradeAppealModal';

const { Text } = Typography;

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
      title: 'Bài thi đề nghị phúc khảo',
      dataIndex: 'assessmentTitle',
      key: 'assessmentTitle',
      width: 260,
      render: (title: string, record: GradeAppeal) => (
        <div>
          <Text strong className="velica-cell-title text-truncate d-block cursor-pointer hover-text-brand" onClick={() => handleOpenDetail(record)}>
            {title}
          </Text>
          <span className="velica-cell-desc d-block text-truncate">
            Thời gian nộp đơn: {record.createdAt.replace('T', ' ').slice(0, 16)}
          </span>
        </div>
      ),
    },
    {
      title: 'Điểm bài thi',
      key: 'score',
      width: 160,
      render: (_: unknown, record: GradeAppeal) => (
        <div>
          <div className="font-semibold text-primary-color text-xs">
            {record.currentScore} / {record.maxPoints} đ
          </div>
          {record.updatedScore !== undefined && record.updatedScore !== record.currentScore && (
            <div className="d-flex items-center gap-1 mt-0.5">
              <span className="text-2xs text-muted-color">Sau phúc khảo:</span>
              <Tag color="green" className="m-0 text-2xs font-bold">
                {record.updatedScore} đ
              </Tag>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Lý do phúc khảo của sinh viên',
      dataIndex: 'reason',
      key: 'reason',
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
      width: 140,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Nhận xét từ Giảng viên',
      dataIndex: 'teacherResponse',
      key: 'teacherResponse',
      width: 240,
      ellipsis: true,
      render: (resp?: string, record?: GradeAppeal) => (
        <Tooltip title={resp || 'Đang chờ giảng viên xem lại bài thi và chấm điểm...'} placement="topLeft">
          <span
            className={`cursor-pointer text-truncate d-block ${
              resp ? 'velica-score-high font-semibold' : 'velica-cell-desc'
            }`}
            onClick={() => record && handleOpenDetail(record)}
          >
            {resp || 'Chờ giảng viên chấm lại...'}
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
            Theo dõi tiến độ tiếp nhận đơn, quá trình giảng viên xem lại toàn bộ bài thi và kết quả chấm lại điểm số.
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
                    Thời gian gửi đơn: {selectedAppeal.createdAt.replace('T', ' ').slice(0, 16)}
                  </div>
                </div>
                <StatusBadge status={selectedAppeal.status} size="sm" />
              </div>

              <div className="d-flex items-center justify-between pt-2 border-top text-xs">
                <span>Điểm bài thi ban đầu:</span>
                <strong className="text-primary-color fs-14">
                  {selectedAppeal.currentScore} / {selectedAppeal.maxPoints} đ
                </strong>
              </div>

              {selectedAppeal.updatedScore !== undefined && (
                <div className="d-flex items-center justify-between pt-1.5 text-xs text-success-color font-bold">
                  <span>Điểm số sau chấm lại:</span>
                  <span className="fs-15 text-success">
                    {selectedAppeal.updatedScore} / {selectedAppeal.maxPoints} đ
                  </span>
                </div>
              )}
            </div>

            {/* Student's Reason */}
            <div className="p-3 bg-white border rounded-3">
              <div className="d-flex items-center gap-2 text-xs font-bold text-secondary-color text-uppercase mb-1.5">
                <MessageSquare size={14} className="text-warning-color" />
                <span>Lý do đề nghị phúc khảo của Bạn:</span>
              </div>
              <div className="text-xs text-primary-color p-2.5 bg-light rounded-2 border lh-base">
                {selectedAppeal.reason}
              </div>
            </div>

            {/* Teacher Feedback & Remarks */}
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
                  Kết quả chấm lại & Nhận xét từ Giảng viên:
                </span>
              </div>

              <div className="text-xs text-primary-color p-2 bg-white rounded-2 border lh-base mt-2">
                {selectedAppeal.teacherResponse || (
                  <span className="text-muted-color italic">
                    Giảng viên đang tiếp nhận đơn và sẽ xem lại bài thi của bạn để chấm lại điểm số nếu cần thiết.
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

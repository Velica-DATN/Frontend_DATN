import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Dropdown,
  Modal,
  Drawer,
  Tooltip,
  Row,
  Col,
  Select,
} from 'antd';
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Tv,
  Award,
  CheckCircle,
  MoreVertical,
  History,
  TrendingUp,
  FileCheck,
  Clock,
  Shield,
  BookOpen,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment, ClassRoom, Question, AuditLogItem } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';
import { ASSESSMENT_STATUS } from '../../../constants/assessmentConstants';
import { ROLE } from '../../../constants/roleConstants';

const { Title, Text } = Typography;

export const AssessmentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClassId = searchParams.get('classId');
  const queryAuditId = searchParams.get('auditAsmId');

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string | undefined>(queryClassId || undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [previewAsm, setPreviewAsm] = useState<Assessment | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Audit Trail Drawer State
  const [auditDrawerAsm, setAuditDrawerAsm] = useState<Assessment | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [asmData, clsData, qData] = await Promise.all([
      mockService.getAssessments(),
      mockService.getClasses(),
      mockService.getQuestions(),
    ]);
    setAssessments(asmData);
    setClasses(clsData);
    setBankQuestions(qData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (queryClassId) {
      setClassFilter(queryClassId);
    }
  }, [queryClassId]);

  const openAuditDrawer = async (asm: Assessment) => {
    setAuditDrawerAsm(asm);
    setLoadingAudit(true);
    try {
      const allLogs = await mockService.getAuditLogs();
      // Lọc nhật ký dành riêng cho đề thi (chỉ ghi nhận tạo, cấu hình, xuất bản đề thi - không ghi nhận chấm điểm hay phúc khảo)
      const existingLogs = allLogs.filter(
        (l) =>
          l.entityId === asm.id &&
          l.entityType === 'ASSESSMENT' &&
          !l.action.includes('GRADE') &&
          !l.action.includes('SUBMIT') &&
          !l.action.includes('SCORE')
      );

      if (existingLogs.length > 0) {
        setAuditLogs(existingLogs);
      } else {
        // Khởi tạo lịch sử vòng đời chuẩn cho đề thi hiện tại
        const isPublished = asm.status === ASSESSMENT_STATUS.PUBLISHED;
        const baseDate = asm.createdAt ? dayjs(asm.createdAt) : dayjs('2026-10-10T08:00:00Z');

        const logs: AuditLogItem[] = [
          ...(isPublished
            ? [
                {
                  id: `log-pub-${asm.id}`,
                  userId: 'user-teacher-1',
                  userName: 'TS. Nguyễn Văn An',
                  userRole: ROLE.TEACHER,
                  action: 'PUBLISH_ASSESSMENT',
                  entityType: 'ASSESSMENT',
                  entityId: asm.id,
                  details: `Xuất bản & phát hành chính thức đề thi "${asm.title}". Khóa chỉnh sửa ma trận câu hỏi và phân bổ điểm số.`,
                  ipAddress: '192.168.1.42',
                  timestamp: baseDate.add(2, 'hour').toISOString(),
                },
              ]
            : []),
          {
            id: `log-cfg-${asm.id}`,
            userId: 'user-teacher-1',
            userName: 'TS. Nguyễn Văn An',
            userRole: ROLE.TEACHER,
            action: 'UPDATE_SETTINGS',
            entityType: 'ASSESSMENT',
            entityId: asm.id,
            details: `Thiết lập quy chế phòng thi: Thời lượng ${asm.timeLimitMinutes || 45} phút, bật giám sát chuyển tab và cấu hình chính sách công bố điểm số.`,
            ipAddress: '192.168.1.42',
            timestamp: baseDate.add(45, 'minute').toISOString(),
          },
          {
            id: `log-matrix-${asm.id}`,
            userId: 'user-teacher-1',
            userName: 'TS. Nguyễn Văn An',
            userRole: ROLE.TEACHER,
            action: 'UPDATE_QUESTIONS',
            entityType: 'ASSESSMENT',
            entityId: asm.id,
            details: `Cấu hình ma trận câu hỏi: Gán ${asm.totalQuestions || 2} câu hỏi từ ngân hàng khảo thí, thang điểm chuẩn ${asm.maxScore || 10} điểm.`,
            ipAddress: '192.168.1.42',
            timestamp: baseDate.add(15, 'minute').toISOString(),
          },
          {
            id: `log-create-${asm.id}`,
            userId: 'user-teacher-1',
            userName: 'TS. Nguyễn Văn An',
            userRole: ROLE.TEACHER,
            action: 'CREATE_ASSESSMENT',
            entityType: 'ASSESSMENT',
            entityId: asm.id,
            details: `Khởi tạo bản nháp đề thi "${asm.title}" thuộc lớp học phần ${asm.className || 'SE301.P01'}.`,
            ipAddress: '192.168.1.42',
            timestamp: baseDate.toISOString(),
          },
        ];
        setAuditLogs(logs);
      }
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleCloseAuditDrawer = () => {
    setAuditDrawerAsm(null);
    if (searchParams.has('auditAsmId')) {
      searchParams.delete('auditAsmId');
      setSearchParams(searchParams, { replace: true });
    }
  };

  useEffect(() => {
    if (queryAuditId && assessments.length > 0) {
      const match = assessments.find((a) => a.id === queryAuditId) || assessments[0];
      if (match) {
        openAuditDrawer(match);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryAuditId, assessments]);

  const handlePublish = async (asm: Assessment) => {
    Modal.confirm({
      title: 'Xác nhận Xuất bản Đề thi?',
      content: `Sau khi xuất bản đề thi "${asm.title}", sinh viên thuộc lớp sẽ thấy đề thi theo thời gian cài đặt. Cấu trúc câu hỏi sẽ được khóa chặt để bảo đảm tính khách quan.`,
      okText: 'Xuất bản & Khóa',
      cancelText: 'Hủy',
      okButtonProps: { style: { backgroundColor: '#16A34A', borderColor: '#16A34A' } },
      onOk: async () => {
        await mockService.publishAssessment(asm.id);
        message.success('Đã xuất bản đề thi thành công!');
        loadData();
      },
    });
  };

  const handleDelete = async (id: string) => {
    await mockService.deleteAssessment(id);
    message.success('Đã xóa đề thi.');
    loadData();
  };

  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.className && a.className.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = !statusFilter || a.status === statusFilter;
    const matchesClass =
      !classFilter || a.classId === classFilter || (a.className && a.className.includes(classFilter));
    return matchesSearch && matchesStatus && matchesClass;
  });

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-xs text-secondary-color">
          #{(page - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      title: 'Tên đề thi & Bài kiểm tra',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: Assessment) => (
        <div className="overflow-hidden min-w-0">
          <Tooltip title={`${title} (Bấm để xem chi tiết cấu hình và câu hỏi đề thi)`} placement="topLeft">
            <span
              onClick={() => setPreviewAsm(record)}
              className="velica-cell-title velica-table-cell-ellipsis cursor-pointer hover:text-brand-color d-block truncate font-semibold"
            >
              {title}
            </span>
          </Tooltip>
          <span className="velica-cell-desc-single text-xs text-muted-color d-block truncate">
            {record.totalQuestions} câu hỏi • {record.timeLimitMinutes > 0 ? `${record.timeLimitMinutes} phút` : 'Tự do'}
          </span>
        </div>
      ),
    },
    {
      title: 'Lớp học phần',
      dataIndex: 'className',
      key: 'className',
      width: 140,
      ellipsis: true,
      render: (clsName: string, record: Assessment) => (
        <Tooltip title={`Bấm để mở Lớp ${clsName || 'SE301.P01'}`} placement="topLeft">
          <Tag
            color="blue"
            className="cursor-pointer font-semibold text-xs m-0 velica-table-cell-ellipsis hover:opacity-80"
            style={{ maxWidth: 125 }}
            onClick={() => navigate(`/teacher/classes/${record.classId || 'cls-1'}`)}
          >
            {clsName || 'SE301.P01'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Hình thức',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        if (type === 'HOMEWORK') return <Tag color="purple">Bài tập về nhà</Tag>;
        if (type === 'QUIZ') return <Tag color="cyan">Trắc nghiệm</Tag>;
        if (type === 'MIDTERM') return <Tag color="blue">Giữa kỳ</Tag>;
        if (type === 'FINAL') return <Tag color="red">Cuối kỳ</Tag>;
        if (type === 'ASSIGNMENT') return <Tag color="orange">Bài tập lớn</Tag>;
        return <Tag color="geekblue">{type}</Tag>;
      },
    },
    {
      title: 'Trọng số',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (w: number) => <span className="velica-cell-weight">{w}%</span>,
    },
    {
      title: 'Thời gian mở đề',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 135,
      render: (startTime: string | null) => (
        <span className="text-xs text-secondary-color">
          {startTime
            ? new Date(startTime).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Mở tự do'}
        </span>
      ),
    },
    {
      title: 'Hạn nộp (Deadline)',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 145,
      render: (endTime: string | null) => {
        if (!endTime) {
          return <span className="text-xs text-secondary-color">Không giới hạn</span>;
        }
        const isPast = new Date(endTime).getTime() < Date.now();
        return (
          <span className={`text-xs font-semibold ${isPast ? 'text-muted-color' : 'text-primary-color'}`}>
            {new Date(endTime).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Thao tác chính',
      key: 'action',
      width: 245,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (_: unknown, record: Assessment) => {
        const moreMenuItems = {
          items: [
            {
              key: 'preview',
              icon: <Eye size={14} />,
              label: 'Xem chi tiết đề',
              onClick: () => setPreviewAsm(record),
            },
            {
              key: 'edit',
              icon: <Edit size={14} />,
              label: 'Chỉnh sửa wizard',
              onClick: () => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_BUILDER_EDIT.replace(':id', record.id)),
            },
            {
              key: 'grading',
              icon: <FileCheck size={14} />,
              label: 'Hàng đợi chấm tự luận',
              onClick: () => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_GRADING.replace(':id', record.id)),
            },
            {
              key: 'appeals',
              icon: <FileCheck size={14} />,
              label: 'Đơn phúc khảo',
              onClick: () => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_APPEALS.replace(':id', record.id)),
            },
            {
              key: 'audit',
              icon: <History size={14} />,
              label: 'Nhật ký đề thi',
              onClick: () => openAuditDrawer(record),
            },
            { type: 'divider' as const },
            {
              key: 'delete',
              danger: true,
              icon: <Trash2 size={14} />,
              label: 'Xóa đề thi',
              onClick: () => handleDelete(record.id),
            },
          ],
        };

        return (
          <Space size={6}>
            {record.status === ASSESSMENT_STATUS.DRAFT ? (
              <Button
                type="primary"
                size="small"
                icon={<CheckCircle size={14} />}
                className="velica-btn-publish"
                onClick={() => handlePublish(record)}
              >
                Xuất bản
              </Button>
            ) : (
              <Button
                type="default"
                size="small"
                icon={<Tv size={14} className="text-brand-color" />}
                onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_MONITOR.replace(':id', record.id))}
              >
                Giám sát
              </Button>
            )}

            <Button
              type="text"
              size="small"
              icon={<Award size={15} color="#10B981" />}
              onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_RESULTS.replace(':id', record.id))}
            >
              Điểm
            </Button>

            <Dropdown menu={moreMenuItems} trigger={['click']}>
              <Button type="text" size="small" icon={<MoreVertical size={16} />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Top Academic Modern SaaS Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h2 className="velica-page-title">
            Danh mục Đề thi & Khảo thí Học thuật
          </h2>
          <p className="velica-page-desc">
            Thiết kế cấu trúc đề thi đa năng (Trắc nghiệm & Tự luận Rubric), cấu hình quy chế chống gian lận và giám sát phòng thi trực tiếp.
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_BUILDER)}
            className="velica-btn-primary"
          >
            Soạn đề thi mới
          </Button>
        </div>
      </div>

      <FilterBar
        placeholder="Tìm kiếm theo tiêu đề bài kiểm tra..."
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        hasActiveFilters={Boolean(classFilter || statusFilter)}
        onClearFilters={() => {
          setClassFilter(undefined);
          setStatusFilter(undefined);
          setSearchParams({});
          setPage(1);
        }}
      >
        <Select
          allowClear
          placeholder="Lọc theo Lớp học phần"
          className="w-240"
          value={classFilter}
          onChange={(val) => {
            setClassFilter(val);
            setPage(1);
            if (val) setSearchParams({ classId: val });
            else setSearchParams({});
          }}
        >
          {classes.map((cls) => (
            <Select.Option key={cls.id} value={cls.id}>
              {cls.code} - {cls.name}
            </Select.Option>
          ))}
        </Select>

        <Select
          allowClear
          placeholder="Lọc theo Trạng thái"
          className="w-180"
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        >
          <Select.Option value={ASSESSMENT_STATUS.PUBLISHED}>Đã xuất bản</Select.Option>
          <Select.Option value={ASSESSMENT_STATUS.DRAFT}>Bản nháp</Select.Option>
          <Select.Option value={ASSESSMENT_STATUS.CLOSED}>Đã kết thúc</Select.Option>
        </Select>
      </FilterBar>

      <div className="velica-table-container">
        <Table
          dataSource={filteredAssessments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['8', '15', '25', '50'],
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} đề thi`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1080 }}
        />
      </div>

      {/* Assessment Full Overview Drawer */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              Cấu hình & Chi tiết Đề thi Khảo thí
            </div>
            <div className="velica-drawer-subtitle">
              Mã đề: {previewAsm?.id} • Lớp: {previewAsm?.className || 'Học phần chung'}
            </div>
          </div>
        }
        open={Boolean(previewAsm)}
        onClose={() => setPreviewAsm(null)}
        width={560}
        extra={
          <Space>
            {previewAsm && (
              <Button
                type="primary"
                icon={<Edit size={14} />}
                onClick={() => {
                  const a = previewAsm;
                  setPreviewAsm(null);
                  navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_BUILDER_EDIT.replace(':id', a.id));
                }}
                className="velica-btn-primary"
              >
                Chỉnh sửa Wizard
              </Button>
            )}
            <Button onClick={() => setPreviewAsm(null)}>Đóng</Button>
          </Space>
        }
      >
        {previewAsm && (
          <div>
            <div className="d-flex items-center gap-2 mb-3 flex-wrap">
              <Tag color="geekblue" className="font-semibold">{previewAsm.type}</Tag>
              <StatusBadge status={previewAsm.status} />
              <Tag color="purple">Trọng số: {previewAsm.weight}%</Tag>
              <Tag color="blue">{previewAsm.timeLimitMinutes > 0 ? `${previewAsm.timeLimitMinutes} phút` : 'Tự do'}</Tag>
            </div>

            <div className="p-3 bg-muted rounded-2 border mb-3">
              <h3 className="velica-page-title mb-1 text-base">{previewAsm.title}</h3>
              <p className="velica-cell-desc m-0">{previewAsm.description}</p>
            </div>

            {/* Assessment Meta stats */}
            <div className="p-3 bg-light rounded-2 border mb-3">
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <div className="text-xs text-muted-color">Tổng số câu hỏi:</div>
                  <div className="font-bold text-sm text-primary-color">{previewAsm.totalQuestions} câu hỏi</div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-muted-color">Thang điểm:</div>
                  <div className="font-bold text-sm text-primary-color">{previewAsm.maxScore} điểm (Thang {previewAsm.scoreScale})</div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-muted-color">Thời gian mở ca thi:</div>
                  <div className="text-xs text-primary-color">{previewAsm.startTime ? previewAsm.startTime.slice(0, 10) : 'Linh hoạt'}</div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-muted-color">Hạn chót kết thúc:</div>
                  <div className="text-xs text-primary-color">{previewAsm.endTime ? previewAsm.endTime.slice(0, 10) : 'Không giới hạn'}</div>
                </Col>
              </Row>
            </div>

            {/* Anti-cheat Policies */}
            <div className="p-3 bg-white border rounded-2 mb-3">
              <div className="d-flex items-center gap-2 mb-2">
                <Shield size={15} className="text-brand-color" />
                <span className="font-bold text-xs text-primary-color">Quy chế thi & Cấu hình chống gian lận:</span>
              </div>
              <ul className="m-0 pl-3 text-xs text-secondary-color d-flex flex-col gap-1">
                <li>Đảo ngẫu nhiên thứ tự câu hỏi: <strong>{previewAsm.shuffleQuestions ? 'BẬT' : 'TẮT'}</strong></li>
                <li>Đảo ngẫu nhiên thứ tự đáp án trắc nghiệm: <strong>{previewAsm.shuffleAnswers ? 'BẬT' : 'TẮT'}</strong></li>
                <li>Cho phép quay lại câu hỏi trước: <strong>{previewAsm.allowBackNavigation ? 'BẬT (Tự do)' : 'TẮT (Chỉ tiến tới)'}</strong></li>
                <li>Số lần làm bài tối đa: <strong>{previewAsm.maxAttempts} lần</strong></li>
              </ul>
            </div>

            {/* Instructions */}
            {previewAsm.instructions && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2 mb-3">
                <div className="text-xs text-amber-800 font-bold mb-1">
                  ⚠️ Hướng dẫn & Quy định phòng thi cho thí sinh:
                </div>
                <div className="text-xs text-amber-900 lh-base">
                  {previewAsm.instructions}
                </div>
              </div>
            )}

            {/* Quick Actions Shortcuts */}
            <div className="d-flex items-center gap-2 mt-4">
              <Button
                type="default"
                icon={<Tv size={14} className="text-brand-color" />}
                onClick={() => {
                  setPreviewAsm(null);
                  navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_MONITOR.replace(':id', previewAsm.id));
                }}
                className="flex-1"
              >
                Giám sát phòng thi
              </Button>
              <Button
                type="default"
                icon={<Award size={14} className="text-success-color" />}
                onClick={() => {
                  setPreviewAsm(null);
                  navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_RESULTS.replace(':id', previewAsm.id));
                }}
                className="flex-1"
              >
                Bảng điểm & Kết quả
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Slide-over Audit Trail Drawer */}
      <Drawer
        title={
          <div>
            <div className="d-flex items-center gap-2">
              <History size={18} className="text-brand-color" />
              <span className="font-bold text-base">Nhật ký Hoạt động Đề thi</span>
            </div>
            {auditDrawerAsm && (
              <div className="text-xs text-muted-color mt-0.5">
                {auditDrawerAsm.title} ({auditDrawerAsm.id})
              </div>
            )}
          </div>
        }
        open={Boolean(auditDrawerAsm)}
        onClose={handleCloseAuditDrawer}
        width={880}
        style={{ maxWidth: '96vw' }}
        destroyOnClose
      >
        {auditDrawerAsm && (
          <div>
            <div className="p-3 bg-slate-50 rounded-xl mb-3 border border-slate-200/80">
              <div className="text-xs text-slate-600 lh-base">
                Ghi nhận toàn bộ thao tác khởi tạo, chỉnh sửa cấu hình ma trận câu hỏi, thiết lập quy chế phòng thi và xuất bản đề thi nhằm bảo đảm tính minh bạch và toàn vẹn của kỳ thi.
              </div>
            </div>

            <Table
              dataSource={auditLogs}
              loading={loadingAudit}
              rowKey="id"
              pagination={{ pageSize: 8, showSizeChanger: true }}
              size="middle"
              scroll={{ x: 800 }}
              columns={[
                {
                  title: 'STT',
                  key: 'stt',
                  width: 55,
                  align: 'center' as const,
                  render: (_: unknown, __: unknown, idx: number) => (
                    <span className="font-semibold text-xs text-slate-400">#{idx + 1}</span>
                  ),
                },
                {
                  title: 'Thời gian',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  width: 140,
                  render: (ts: string) => {
                    const d = dayjs(ts);
                    return (
                      <div>
                        <div className="font-medium text-xs text-slate-800">
                          {d.isValid() ? d.format('DD/MM/YYYY') : ts}
                        </div>
                        <div className="text-3xs text-slate-400 font-mono">
                          {d.isValid() ? d.format('HH:mm:ss') : ''}
                        </div>
                      </div>
                    );
                  },
                },
                {
                  title: 'Người thực hiện',
                  dataIndex: 'userName',
                  key: 'userName',
                  width: 160,
                  render: (name: string, record: AuditLogItem) => (
                    <div>
                      <span className="font-semibold text-xs text-slate-900 d-block">{name}</span>
                      <Tag color="default" className="text-3xs m-0 border-slate-200 bg-slate-100 text-slate-600 font-normal">
                        {record.userRole}
                      </Tag>
                    </div>
                  ),
                },
                {
                  title: 'Hành động',
                  dataIndex: 'action',
                  key: 'action',
                  width: 155,
                  render: (act: string) => {
                    const actionMap: Record<string, { label: string; color: string }> = {
                      PUBLISH_ASSESSMENT: { label: 'Xuất bản đề thi', color: 'success' },
                      UPDATE_SETTINGS: { label: 'Cấu hình quy chế', color: 'processing' },
                      UPDATE_QUESTIONS: { label: 'Cập nhật câu hỏi', color: 'warning' },
                      CREATE_ASSESSMENT: { label: 'Khởi tạo đề thi', color: 'default' },
                      LOCK_ASSESSMENT: { label: 'Khóa đề thi', color: 'error' },
                    };
                    const mapped = actionMap[act] || { label: act, color: 'default' };
                    return (
                      <div>
                        <Tag color={mapped.color} className="text-xs font-medium m-0">
                          {mapped.label}
                        </Tag>
                        <div className="text-3xs text-slate-400 font-mono mt-0.5">{act}</div>
                      </div>
                    );
                  },
                },
                {
                  title: 'Nội dung chi tiết thay đổi',
                  dataIndex: 'details',
                  key: 'details',
                  render: (details: string) => (
                    <span className="text-xs text-slate-700 lh-base d-block" style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      {details}
                    </span>
                  ),
                },
                {
                  title: 'Địa chỉ IP',
                  dataIndex: 'ipAddress',
                  key: 'ipAddress',
                  width: 110,
                  align: 'center' as const,
                  render: (ip: string) => <span className="font-mono text-2xs text-slate-400">{ip}</span>,
                },
              ]}
            />
          </div>
        )}
      </Drawer>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
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
import { Assessment, ClassRoom } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';
import { ASSESSMENT_STATUS } from '../../../constants/assessmentConstants';

const { Title, Text } = Typography;

export const AssessmentList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClassId = searchParams.get('classId');

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<string | undefined>(queryClassId || undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [previewAsm, setPreviewAsm] = useState<Assessment | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [asmData, clsData] = await Promise.all([
      mockService.getAssessments(),
      mockService.getClasses(),
    ]);
    setAssessments(asmData);
    setClasses(clsData);
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
      title: 'Tên đề thi & Bài kiểm tra',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: Assessment) => (
        <div style={{ maxWidth: 320 }}>
          <Tooltip title={`${title} (Bấm để xem chi tiết cấu hình và câu hỏi đề thi)`} placement="topLeft">
            <span
              onClick={() => setPreviewAsm(record)}
              className="velica-cell-title velica-table-cell-ellipsis cursor-pointer hover:text-brand-color"
            >
              {title}
            </span>
          </Tooltip>
          <span className="velica-cell-desc-single text-xs text-muted-color">
            {record.totalQuestions} câu hỏi • {record.timeLimitMinutes > 0 ? `${record.timeLimitMinutes} phút` : 'Tự do'}
          </span>
        </div>
      ),
    },
    {
      title: 'Lớp học phần',
      dataIndex: 'className',
      key: 'className',
      width: 170,
      ellipsis: true,
      render: (clsName: string, record: Assessment) => (
        <Tooltip title={`Bấm để mở Lớp ${clsName || 'SE301.P01'}`} placement="topLeft">
          <Tag
            color="blue"
            className="cursor-pointer font-semibold text-xs m-0 velica-table-cell-ellipsis hover:opacity-80"
            style={{ maxWidth: 150 }}
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
      width: 130,
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
      width: 90,
      render: (w: number) => <span className="velica-cell-weight">{w}%</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} />,
    },
    {
      title: 'Thao tác chính',
      key: 'action',
      width: 180,
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
              key: 'appeals',
              icon: <FileCheck size={14} />,
              label: 'Đơn phúc khảo',
              onClick: () => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_APPEALS.replace(':id', record.id)),
            },
            {
              key: 'analysis',
              icon: <TrendingUp size={14} />,
              label: 'Độ khó câu hỏi',
              onClick: () => navigate(ROUTE_PATHS.TEACHER.QUESTION_ANALYSIS.replace(':id', record.id)),
            },
            {
              key: 'audit',
              icon: <History size={14} />,
              label: 'Nhật ký đề thi',
              onClick: () => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_AUDIT.replace(':id', record.id)),
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
          <Space size="small">
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
        onSearchChange={setSearch}
        hasActiveFilters={Boolean(classFilter || statusFilter)}
        onClearFilters={() => {
          setClassFilter(undefined);
          setStatusFilter(undefined);
          setSearchParams({});
        }}
      >
        <Select
          allowClear
          placeholder="Lọc theo Lớp học phần"
          className="w-240"
          value={classFilter}
          onChange={(val) => {
            setClassFilter(val);
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
          onChange={setStatusFilter}
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
          pagination={{ pageSize: 8 }}
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
    </div>
  );
};

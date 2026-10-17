import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Button, Space, Typography, Tag, Select, Tooltip, Dropdown } from 'antd';
import { ArrowLeft, CheckCircle2, Clock, Eye, Edit3, MoreVertical, FileText, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Submission } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { GRADING_STATUS } from '../../../constants/assessmentConstants';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;

export const GradingQueue: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [classFilter, setClassFilter] = useState<string | undefined>(undefined);
  const [assessmentFilter, setAssessmentFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await mockService.getSubmissions(id && id !== 'all' ? id : undefined);
    setSubmissions(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Extract unique classes and assessments for filtering
  const availableClasses = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.className || 'SE301.P01 - Kiến Trúc Phần Mềm'))),
    [submissions]
  );
  const availableAssessments = useMemo(
    () => Array.from(new Set(submissions.map((s) => s.assessmentTitle))),
    [submissions]
  );

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesSearch = s.studentName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !statusFilter || s.gradingStatus === statusFilter;
      const matchesClass = !classFilter || (s.className || 'SE301.P01 - Kiến Trúc Phần Mềm') === classFilter;
      const matchesAssessment = !assessmentFilter || s.assessmentTitle === assessmentFilter;
      return matchesSearch && matchesStatus && matchesClass && matchesAssessment;
    });
  }, [submissions, search, statusFilter, classFilter, assessmentFilter]);

  const handleClearAllFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setClassFilter(undefined);
    setAssessmentFilter(undefined);
    setPage(1);
  };

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
      title: 'Sinh viên nộp bài',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 180,
      ellipsis: true,
      render: (name: string, record: Submission) => {
        const timeFormatted = record.submittedAt
          ? new Date(record.submittedAt).toLocaleString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            })
          : '—';
        return (
          <div style={{ maxWidth: 165 }}>
            <Tooltip title={name} placement="topLeft">
              <span className="velica-cell-title velica-table-cell-ellipsis">{name}</span>
            </Tooltip>
            <span className="velica-cell-desc-single text-xs">
              Nộp: {timeFormatted}
            </span>
          </div>
        );
      },
    },
    {
      title: 'Lớp học phần',
      dataIndex: 'className',
      key: 'className',
      width: 160,
      ellipsis: true,
      render: (cls: string, record: Submission) => {
        const cName = record.className || 'SE301.P01 - Kiến Trúc Phần Mềm';
        return (
          <Tooltip title={cName} placement="topLeft">
            <Tag color="blue" className="font-semibold text-xs m-0 velica-table-cell-ellipsis" style={{ maxWidth: 140 }}>
              {cName}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Bài kiểm tra',
      dataIndex: 'assessmentTitle',
      key: 'assessmentTitle',
      width: 220,
      ellipsis: true,
      render: (title: string) => (
        <Tooltip title={title} placement="topLeft">
          <span className="text-brand-color font-medium velica-table-cell-ellipsis" style={{ maxWidth: 200 }}>
            {title}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Trạng thái chấm',
      dataIndex: 'gradingStatus',
      key: 'gradingStatus',
      width: 140,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Điểm hiện tại',
      dataIndex: 'score',
      key: 'score',
      width: 110,
      render: (score: number | null, record: Submission) => (
        <span className={score !== null ? 'font-semibold text-success-color' : 'font-semibold text-warning-color'}>
          {score !== null ? `${score} / ${record.maxScore}` : 'Chờ chấm'}
        </span>
      ),
    },
    {
      title: 'Vi phạm',
      dataIndex: 'violationCount',
      key: 'violationCount',
      width: 110,
      align: 'center' as const,
      render: (count: number) =>
        count > 0 ? <Tag color="error" className="m-0">{count} vi phạm</Tag> : <Tag color="success" className="m-0">0 vi phạm</Tag>,
    },
    {
      title: 'Thao tác chính',
      key: 'action',
      width: 205,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (_: unknown, record: Submission) => {
        const moreItems = {
          items: [
            {
              key: 'view',
              icon: <Eye size={14} />,
              label: 'Xem bài làm & Tiêu chí Rubric',
              onClick: () => navigate(`/teacher/submissions/${record.id}/grading`),
            },
            {
              key: 'appeals',
              icon: <FileText size={14} />,
              label: 'Đơn phúc khảo bài thi',
              onClick: () =>
                navigate(
                  ROUTE_PATHS.TEACHER.ASSESSMENT_APPEALS.replace(
                    ':id',
                    record.assessmentId || 'asm-101'
                  )
                ),
            },
            ...(record.violationCount > 0
              ? [
                  {
                    key: 'violation',
                    danger: true,
                    icon: <ShieldAlert size={14} />,
                    label: `Xem ${record.violationCount} biên bản vi phạm`,
                    onClick: () => navigate(`/teacher/submissions/${record.id}/grading`),
                  },
                ]
              : []),
          ],
        };

        return (
          <Space size={6}>
            <Button
              type={record.gradingStatus === GRADING_STATUS.GRADED ? 'default' : 'primary'}
              size="small"
              icon={<Edit3 size={14} />}
              onClick={() => navigate(`/teacher/submissions/${record.id}/grading`)}
              className={
                record.gradingStatus === GRADING_STATUS.GRADED
                  ? 'velica-btn-action font-medium'
                  : 'velica-btn-primary font-medium'
              }
            >
              {record.gradingStatus === GRADING_STATUS.GRADED ? 'Chấm lại' : 'Chấm ngay'}
            </Button>

            <Dropdown menu={moreItems} trigger={['click']}>
              <Button type="text" size="small" icon={<MoreVertical size={16} />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      {Boolean(id) && (
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
      )}

      {/* 1. Header Toolbar */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h1 className="velica-page-title">
            Trung tâm Chấm điểm & Đánh giá Tự luận
          </h1>
          <p className="velica-page-desc">
            Trắc nghiệm tự động đồng bộ kết quả tức thì. Câu hỏi tự luận được điều phối theo tiêu chí Rubric minh bạch.
          </p>
        </div>
      </div>

      {/* Multi-attribute FilterBar: Search, Class, Subject/Assessment, Status */}
      <FilterBar
        placeholder="Tìm theo tên sinh viên..."
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onClearFilters={handleClearAllFilters}
        hasActiveFilters={Boolean(statusFilter || classFilter || assessmentFilter || search)}
      >
        <Select
          allowClear
          placeholder="Lọc theo Lớp học"
          className="w-220"
          value={classFilter}
          onChange={(val) => {
            setClassFilter(val);
            setPage(1);
          }}
        >
          {availableClasses.map((cls) => (
            <Select.Option key={cls} value={cls}>
              {cls}
            </Select.Option>
          ))}
        </Select>

        <Select
          allowClear
          placeholder="Lọc theo Đề thi / Môn học"
          className="w-240"
          value={assessmentFilter}
          onChange={(val) => {
            setAssessmentFilter(val);
            setPage(1);
          }}
        >
          {availableAssessments.map((title) => (
            <Select.Option key={title} value={title}>
              {title}
            </Select.Option>
          ))}
        </Select>

        <Select
          allowClear
          placeholder="Lọc theo trạng thái chấm"
          className="w-180"
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        >
          <Select.Option value={GRADING_STATUS.PENDING_MANUAL}>Chờ chấm tự luận</Select.Option>
          <Select.Option value={GRADING_STATUS.GRADED}>Đã chấm hoàn tất</Select.Option>
          <Select.Option value={GRADING_STATUS.AUTO_GRADED}>Chấm tự động</Select.Option>
        </Select>
      </FilterBar>

      <div className="velica-table-container">
        <Table
          dataSource={filteredSubmissions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['8', '15', '25', '50'],
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} bài nộp`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1080 }}
        />
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Tag, Select, Tooltip } from 'antd';
import { ArrowLeft, CheckCircle2, Clock, Eye, Edit3, Filter } from 'lucide-react';
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

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getSubmissions(id && id !== 'all' ? id : undefined);
    setSubmissions(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Extract unique classes and assessments for filtering
  const availableClasses = Array.from(
    new Set(submissions.map((s) => s.className || 'SE301.P01 - Kiến Trúc Phần Mềm'))
  );
  const availableAssessments = Array.from(
    new Set(submissions.map((s) => s.assessmentTitle))
  );

  const filteredSubmissions = submissions.filter((s) => {
    const matchesSearch = s.studentName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || s.gradingStatus === statusFilter;
    const matchesClass = !classFilter || (s.className || 'SE301.P01 - Kiến Trúc Phần Mềm') === classFilter;
    const matchesAssessment = !assessmentFilter || s.assessmentTitle === assessmentFilter;
    return matchesSearch && matchesStatus && matchesClass && matchesAssessment;
  });

  const handleClearAllFilters = () => {
    setSearch('');
    setStatusFilter(undefined);
    setClassFilter(undefined);
    setAssessmentFilter(undefined);
  };

  const columns = [
    {
      title: 'Sinh viên nộp bài',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 170,
      ellipsis: true,
      render: (name: string, record: Submission) => (
        <div style={{ maxWidth: 155 }}>
          <Tooltip title={name} placement="topLeft">
            <span className="velica-cell-title">{name}</span>
          </Tooltip>
          <span className="velica-cell-desc-single text-xs">
            Nộp: {record.submittedAt?.split(' ')[1] || record.submittedAt}
          </span>
        </div>
      ),
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
      render: (count: number) =>
        count > 0 ? <Tag color="error" className="m-0">{count} vi phạm</Tag> : <Tag color="success" className="m-0">0 vi phạm</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      align: 'right' as const,
      render: (_: unknown, record: Submission) => (
        <Button
          type="primary"
          size="small"
          icon={<Edit3 size={14} />}
          onClick={() => navigate(`/teacher/submissions/${record.id}/grading`)}
          className={record.gradingStatus === GRADING_STATUS.GRADED ? 'btn-secondary font-medium' : 'velica-btn-primary font-medium'}
        >
          {record.gradingStatus === GRADING_STATUS.GRADED ? 'Chấm lại' : 'Chấm ngay'}
        </Button>
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
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS)}
            className="velica-back-btn"
          >
            Quay lại danh sách đề thi
          </Button>
        </div>
      )}

      {/* Modern Untitled UI Header */}
      <div className="velica-hero-banner">
        <div className="velica-hero-header">
          <div>
            <div className="d-flex items-center gap-2 flex-wrap mb-2">
              <span className="badge bg-primary text-white font-medium px-2 py-1">
                Hàng đợi Chấm thi
              </span>
              <span className="velica-badge-warning">
                {submissions.filter((s) => s.gradingStatus === GRADING_STATUS.PENDING_MANUAL).length} bài chờ chấm tự luận
              </span>
              <span className="velica-badge-success">
                {submissions.filter((s) => s.gradingStatus === GRADING_STATUS.GRADED).length} bài đã hoàn tất
              </span>
            </div>

            <h1 className="velica-hero-title">
              Trung tâm Chấm điểm & Đánh giá Tự luận
            </h1>
            <p className="velica-hero-meta">
              Trắc nghiệm tự động đồng bộ kết quả tức thì. Câu hỏi tự luận được điều phối theo tiêu chí Rubric minh bạch.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-attribute FilterBar: Search, Class, Subject/Assessment, Status */}
      <FilterBar
        placeholder="Tìm theo tên sinh viên..."
        onSearchChange={setSearch}
        onClearFilters={handleClearAllFilters}
        hasActiveFilters={Boolean(statusFilter || classFilter || assessmentFilter || search)}
      >
        <Select
          allowClear
          placeholder="Lọc theo Lớp học"
          className="w-220"
          value={classFilter}
          onChange={setClassFilter}
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
          onChange={setAssessmentFilter}
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
          onChange={setStatusFilter}
        >
          <Select.Option value={GRADING_STATUS.PENDING_MANUAL}>Chờ chấm tự luận</Select.Option>
          <Select.Option value={GRADING_STATUS.GRADED}>Đã chấm hoàn tất</Select.Option>
          <Select.Option value={GRADING_STATUS.AUTO_GRADED}>Chấm tự động</Select.Option>
        </Select>
      </FilterBar>

      <div className="velica-card-table">
        <Table
          dataSource={filteredSubmissions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 960 }}
        />
      </div>
    </div>
  );
};

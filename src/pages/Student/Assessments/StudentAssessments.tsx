import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Segmented,
  Drawer,
  Form,
  Select,
  Input,
  message,
} from 'antd';
import {
  FileCheck2,
  Clock,
  Eye,
  MessageSquarePlus,
  Send,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GradeAppealModal } from '../../../components/velica/GradeAppealModal/GradeAppealModal';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment, Submission } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const StudentAssessments: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<string>('ALL');

  // Review & Appeal Drawer states
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealForm] = Form.useForm();
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [asms, subs] = await Promise.all([
        mockService.getAssessments(),
        mockService.getSubmissions(),
      ]);
      setAssessments(asms);
      setSubmissions(subs);
      setLoading(false);

      // If URL has review param, navigate directly to dedicated review page
      const reviewAsmId = searchParams.get('review');
      if (reviewAsmId) {
        navigate(`/student/assessments/${reviewAsmId}/review`);
      }
    };
    fetchData();
  }, [searchParams, navigate]);

  const handleOpenReview = (sub: Submission) => {
    navigate(`/student/assessments/${sub.assessmentId}/review`);
  };

  const handleOpenAppeal = (sub: Submission) => {
    setSelectedSub(sub);
    setAppealModalOpen(true);
  };

  // Filter assessments
  const publishedAssessments = assessments.filter((a) => a.status !== 'DRAFT');

  const filteredAssessments = publishedAssessments.filter((record) => {
    const matchesSearch =
      record.title.toLowerCase().includes(search.toLowerCase()) ||
      (record.className && record.className.toLowerCase().includes(search.toLowerCase()));

    const sub = submissions.find((s) => s.assessmentId === record.id);
    const hasSubmitted = !!sub;

    if (!matchesSearch) return false;

    if (filterTab === 'PENDING') {
      return !hasSubmitted && record.status === 'PUBLISHED';
    }
    if (filterTab === 'COMPLETED') {
      return hasSubmitted;
    }
    return true;
  });

  const completedCount = publishedAssessments.filter((a) =>
    submissions.some((s) => s.assessmentId === a.id)
  ).length;

  const pendingCount = publishedAssessments.filter(
    (a) => a.status === 'PUBLISHED' && !submissions.some((s) => s.assessmentId === a.id)
  ).length;

  const columns = [
    {
      title: 'Tên bài kiểm tra / Đề thi',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Assessment) => (
        <div>
          <span className="velica-cell-title">{title}</span>
          <span className="velica-cell-desc d-block">
            {record.className || 'Kiến Trúc Phần Mềm'} • Trọng số: <strong>{record.weight}%</strong> • {record.totalQuestions} câu hỏi
          </span>
        </div>
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
      title: 'Thời gian thi',
      dataIndex: 'timeLimitMinutes',
      key: 'timeLimitMinutes',
      width: 110,
      render: (mins: number) => <span>{mins > 0 ? `${mins} phút` : 'Tự do'}</span>,
    },
    {
      title: 'Điểm số & Tình trạng',
      key: 'scoreStatus',
      width: 180,
      render: (_: unknown, record: Assessment) => {
        const sub = submissions.find((s) => s.assessmentId === record.id);
        if (sub) {
          return (
            <div>
              <div className={sub.score !== null ? 'velica-score-high' : 'text-warning-color font-semibold'}>
                {sub.score !== null ? `${sub.score} / ${sub.maxScore} đ` : 'Chờ chấm tự luận'}
              </div>
              <StatusBadge status={sub.gradingStatus} size="sm" />
            </div>
          );
        }
        return <StatusBadge status={record.status} size="sm" />;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      align: 'right' as const,
      render: (_: unknown, record: Assessment) => {
        const sub = submissions.find((s) => s.assessmentId === record.id);

        if (sub) {
          return (
            <Space size="small">
              <Button
                size="small"
                icon={<Eye size={14} />}
                onClick={() => handleOpenReview(sub)}
                className="velica-btn-action"
              >
                Xem bài làm
              </Button>
              <Button
                size="small"
                type="link"
                className="text-brand-color p-0 font-medium"
                onClick={() =>
                  navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_TAKING.replace(':id', record.id))
                }
              >
                Luyện tập lại
              </Button>
            </Space>
          );
        }

        if (record.status === 'PUBLISHED') {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() =>
                navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_INSTRUCTIONS.replace(':id', record.id))
              }
              className="velica-btn-primary"
            >
              Vào làm bài thi
            </Button>
          );
        }

        return <Tag color="default">Chưa mở đề</Tag>;
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* 1. Page Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h2 className="velica-page-title">
            Bài thi & Kỳ kiểm tra học phần
          </h2>
          <p className="velica-page-desc">
            Xem lịch thi, làm bài trực tuyến, tra cứu điểm số chi tiết từng câu và gửi yêu cầu phúc khảo đến Giảng viên.
          </p>
        </div>
      </div>

      {/* Mock Practice Exam Quick Access Banner */}
      <div className="velica-alert-banner-indigo mb-4 p-3 border rounded-3 bg-light d-flex items-center justify-between flex-wrap gap-3">
        <div className="d-flex items-center gap-3">
          <div className="velica-notif-icon-box bg-white text-primary-color shadow-xs">
            <Sparkles size={20} className="text-brand-color" />
          </div>
          <div>
            <div className="d-flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-primary-color">Kỳ thi Thử nghiệm — Luyện tập Đa dạng Câu hỏi</span>
              <Tag color="cyan" className="m-0 font-semibold">5 Dạng Khảo Thí</Tag>
            </div>
            <p className="text-xs text-secondary-color m-0">
              Trải nghiệm thi thử với đầy đủ 5 dạng câu hỏi: Trắc nghiệm 1 đáp án, Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Điền khuyết và Tự luận chuyên sâu.
            </p>
          </div>
        </div>
        <Button
          type="primary"
          icon={<FileCheck2 size={15} />}
          onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_TAKING.replace(':id', 'asm-practice'))}
          className="velica-btn-primary"
        >
          Vào thi thử ngay &rarr;
        </Button>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="velica-filter-toolbar">
        <div className="velica-filter-search">
          <FilterBar
            placeholder="Tìm kiếm bài thi theo tên hoặc lớp học phần..."
            onSearchChange={setSearch}
          />
        </div>

        <Segmented
          value={filterTab}
          onChange={(val) => setFilterTab(val as string)}
          options={[
            { label: `Tất cả (${publishedAssessments.length})`, value: 'ALL' },
            { label: `Chưa làm / Đang mở (${pendingCount})`, value: 'PENDING' },
            { label: `Đã làm & Có điểm (${completedCount})`, value: 'COMPLETED' },
          ]}
        />
      </div>

      {/* 3. Table of Assessments */}
      <div className="velica-card-table">
        <Table
          dataSource={filteredAssessments}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </div>

      {/* Grade Appeal Modal */}
      <GradeAppealModal
        open={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
        preselectedAssessmentId={selectedSub?.assessmentId}
        onSuccess={() => {
          setAppealModalOpen(false);
          navigate(ROUTE_PATHS.STUDENT.GRADE_REVIEWS);
        }}
      />
    </div>
  );
};

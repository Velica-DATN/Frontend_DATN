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

      // If URL has review param, auto open
      const reviewAsmId = searchParams.get('review');
      if (reviewAsmId) {
        const found = subs.find((s) => s.assessmentId === reviewAsmId);
        if (found) {
          setSelectedSub(found);
          setReviewDrawerOpen(true);
        }
      }
    };
    fetchData();
  }, [searchParams]);

  const handleOpenReview = (sub: Submission) => {
    setSelectedSub(sub);
    setReviewDrawerOpen(true);
  };

  const handleOpenAppeal = () => {
    if (!selectedSub) return;
    appealForm.resetFields();
    appealForm.setFieldsValue({
      questionId: selectedSub.answers[selectedSub.answers.length - 1]?.questionId || 'q-5',
    });
    setAppealModalOpen(true);
  };

  const handleSubmitAppeal = async () => {
    try {
      const values = await appealForm.validateFields();
      if (!selectedSub) return;
      setIsSubmittingAppeal(true);
      const currentUser = mockService.getCurrentUser();
      const question = selectedSub.answers.find((a) => a.questionId === values.questionId);

      await mockService.createAppeal({
        submissionId: selectedSub.id,
        assessmentId: selectedSub.assessmentId,
        assessmentTitle: selectedSub.assessmentTitle,
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        questionId: values.questionId,
        questionContent: question?.questionContent || 'Câu hỏi tự luận',
        currentScore: question?.pointsAwarded || 3.5,
        maxPoints: question?.maxPoints || 4.0,
        reason: values.reason,
      });

      message.success('Đã gửi đơn yêu cầu phúc khảo thành công đến Giảng viên!');
      setIsSubmittingAppeal(false);
      setAppealModalOpen(false);
      navigate(ROUTE_PATHS.STUDENT.GRADE_REVIEWS);
    } catch {
      setIsSubmittingAppeal(false);
    }
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
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
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
              Trải nghiệm thi thử với đầy đủ 5 dạng câu hỏi: Trắc nghiệm 1 đáp án, Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Điền khuyết và Tự luận Clean Architecture kèm Rubric.
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

      {/* 4. Submission Review Drawer (Detailed question-by-question view & teacher feedback) */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              Chi tiết Bài làm — {selectedSub?.assessmentTitle}
            </div>
            <div className="velica-drawer-subtitle">
              Nộp lúc: {selectedSub?.submittedAt} • Điểm chính thức: <strong>{selectedSub?.score} / {selectedSub?.maxScore} đ</strong>
            </div>
          </div>
        }
        open={reviewDrawerOpen}
        onClose={() => setReviewDrawerOpen(false)}
        width={640}
        extra={
          <Button
            type="primary"
            icon={<MessageSquarePlus size={14} />}
            onClick={handleOpenAppeal}
            className="velica-btn-action"
          >
            Phúc khảo điểm
          </Button>
        }
      >
        {selectedSub && (
          <div>
            {/* Overall Score & Feedback Banner */}
            <div className="p-3 bg-muted rounded-2 border mb-4">
              <div className="d-flex items-center justify-between mb-2">
                <span className="font-semibold text-primary-color">Kết quả đánh giá chính thức:</span>
                <span className="velica-score-high font-bold text-base">
                  {selectedSub.score !== null ? `${selectedSub.score} / ${selectedSub.maxScore} đ` : 'Chờ chấm'}
                </span>
              </div>
              <div className="text-xs text-muted-color">Lời phê chung của Giảng viên:</div>
              <p className="text-xs text-secondary-color mt-1 mb-0 italic">
                &ldquo;Sinh viên nắm vững nguyên lý thiết kế hệ thống và mô hình kiến trúc. Phần trả lời câu hỏi tự luận mạch lạc, đáp ứng đầy đủ tiêu chí của Rubric.&rdquo;
              </p>
            </div>

            {/* Questions Breakdown */}
            <h4 className="text-sm font-bold text-primary-color mb-3">
              Chi tiết câu trả lời & Điểm thành phần:
            </h4>

            {selectedSub.answers.map((ans, idx) => (
              <div key={ans.questionId} className="p-3 border rounded-2 mb-3 bg-white">
                <div className="d-flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-brand-color">
                    Câu hỏi #{idx + 1}
                  </span>
                  <span className="velica-score-high text-xs">
                    {ans.pointsAwarded !== null ? `${ans.pointsAwarded} / ${ans.maxPoints} đ` : 'Chưa chấm'}
                  </span>
                </div>

                <div className="text-xs font-medium text-primary-color mb-2">
                  {ans.questionContent || 'Câu hỏi kiểm tra đánh giá chuẩn đầu ra môn học'}
                </div>

                <div className="p-2 bg-subtle rounded-1 text-xs mb-2">
                  <span className="text-muted-color">Câu trả lời của bạn: </span>
                  <span className="font-medium text-primary-color">
                    {typeof ans.studentAnswer === 'string' ? ans.studentAnswer : JSON.stringify(ans.studentAnswer)}
                  </span>
                </div>

                {ans.feedback && (
                  <div className="text-xs text-secondary-color bg-warning-bg p-2 rounded-1 border-warning-border">
                    <strong>Nhận xét từ GV:</strong> {ans.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* 5. Grade Appeal Request Modal */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <MessageSquarePlus size={18} className="text-brand-color" />
            <span className="font-bold">Gửi Yêu cầu Phúc khảo Điểm bài thi</span>
          </div>
        }
        open={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
        width={480}
        footer={
          <div className="d-flex justify-end gap-2">
            <Button onClick={() => setAppealModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              icon={<Send size={14} />}
              loading={isSubmittingAppeal}
              onClick={handleSubmitAppeal}
              className="velica-btn-primary"
            >
              Gửi đơn phúc khảo
            </Button>
          </div>
        }
      >
        <Form form={appealForm} layout="vertical">
          <Form.Item
            name="questionId"
            label="Chọn câu hỏi cần phúc khảo"
            rules={[{ required: true, message: 'Vui lòng chọn câu hỏi' }]}
          >
            <Select
              options={
                selectedSub?.answers.map((a, i) => ({
                  value: a.questionId,
                  label: `Câu #${i + 1} (${a.pointsAwarded ?? '?'}/${a.maxPoints}đ) — ${a.questionContent?.slice(0, 40) || 'Câu hỏi'}...`,
                })) || []
              }
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do & Căn cứ đề nghị xem xét lại điểm"
            rules={[{ required: true, message: 'Vui lòng nêu rõ lý do phúc khảo' }]}
          >
            <TextArea
              rows={4}
              placeholder="Nêu rõ căn cứ theo tài liệu học tập, tiêu chí rubric hoặc đề cương môn học mà bạn cho rằng câu trả lời của mình xứng đáng đạt điểm cao hơn..."
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

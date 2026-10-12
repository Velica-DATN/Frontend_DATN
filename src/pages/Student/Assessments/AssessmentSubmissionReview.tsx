import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Divider,
  Alert,
  Tooltip,
  Badge,
  Spin,
  message,
} from 'antd';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  Clock,
  BookOpen,
  ShieldAlert,
  Printer,
  ChevronRight,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Submission, Assessment, Question } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { QUESTION_TYPE } from '../../../constants/assessmentConstants';
import { GradeAppealModal } from '../../../components/velica/GradeAppealModal/GradeAppealModal';

const { Title, Text, Paragraph } = Typography;

export const AssessmentSubmissionReview: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const subIdParam = searchParams.get('subId');

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questionsMap, setQuestionsMap] = useState<Record<string, Question>>({});
  const [loading, setLoading] = useState(true);

  // Grade Appeal Modal
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealQuestionId, setAppealQuestionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const loadReviewData = async () => {
      setLoading(true);
      const [allSubs, allAsms, allQuestions] = await Promise.all([
        mockService.getSubmissions(),
        mockService.getAssessments(),
        mockService.getQuestions(),
      ]);

      // Find submission by subId or assessmentId
      let sub = allSubs.find(
        (s) => s.id === subIdParam || s.assessmentId === id || s.id === id
      );

      // Fallback to first submission if not found
      if (!sub && allSubs.length > 0) {
        sub = allSubs[0];
      }

      setSubmission(sub || null);

      if (sub) {
        const asm = allAsms.find((a) => a.id === sub.assessmentId);
        setAssessment(asm || null);
      }

      // Index questions by id
      const qMap: Record<string, Question> = {};
      allQuestions.forEach((q) => {
        qMap[q.id] = q;
      });
      setQuestionsMap(qMap);

      setLoading(false);
    };

    loadReviewData();
  }, [id, subIdParam]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spin size="large" tip="Đang tải chi tiết bài làm..." />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="animate-fade-in p-4 text-center">
        <Card className="velica-card max-w-560 mx-auto py-5">
          <FileText size={48} className="text-muted-color mx-auto mb-3 opacity-50" />
          <Title level={4}>Không tìm thấy bài làm</Title>
          <Paragraph type="secondary">
            Bài kiểm tra chưa có bài nộp hoặc bạn chưa hoàn thành bài thi này.
          </Paragraph>
          <Button
            type="primary"
            onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENTS)}
            className="velica-btn-primary"
          >
            Quay lại danh sách bài thi
          </Button>
        </Card>
      </div>
    );
  }

  const totalQuestions = submission.answers.length;
  const correctCount = submission.answers.filter(
    (a) => a.pointsAwarded !== null && a.pointsAwarded !== undefined && a.pointsAwarded > 0 && a.questionType !== 'ESSAY'
  ).length;

  return (
    <div className="animate-fade-in">
      {/* 1. Top Navigation Bar */}
      <div className="velica-back-nav-bar d-flex items-center justify-between">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENTS)}
          className="velica-back-btn"
        >
          Quay lại danh sách bài thi
        </Button>

        <div className="d-flex items-center gap-2">
          <Button
            icon={<Printer size={14} />}
            onClick={() => window.print()}
            className="btn-secondary text-xs"
          >
            In kết quả
          </Button>
          <Button
            type="primary"
            icon={<ShieldAlert size={14} />}
            onClick={() => {
              setAppealQuestionId(undefined);
              setAppealModalOpen(true);
            }}
            className="velica-btn-primary text-xs"
          >
            Gửi đơn phúc khảo
          </Button>
        </div>
      </div>

      {/* 2. Hero Assessment Summary Banner */}
      <div className="velica-hero-banner mb-4">
        <div className="d-flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="d-flex items-center gap-2 mb-2 flex-wrap">
              <Tag color="geekblue" className="font-bold text-xs m-0">
                {submission.subjectCode || 'SE301'}
              </Tag>
              <Tag className="velica-badge-gray m-0 text-xs">
                {submission.className || 'Kiến Trúc Phần Mềm'}
              </Tag>
              <Tag color="green" className="font-semibold text-xs m-0">
                ✓ Đã hoàn tất chấm điểm
              </Tag>
            </div>

            <h1 className="velica-hero-title fs-22 mb-1">
              Xem Lại Bài Làm: {submission.assessmentTitle}
            </h1>

            <p className="velica-hero-meta mb-0 text-xs">
              <span>Học viên: <strong>{submission.studentName}</strong></span>
              <span>• Thời gian nộp: <strong>{submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('vi-VN') : '10:30'}</strong></span>
              <span>• Mã bài nộp: <strong>{submission.id}</strong></span>
            </p>
          </div>

          {/* Big Score Card */}
          <div className="d-flex items-center gap-4 p-3 bg-white border rounded-3 shadow-xs flex-shrink-0">
            <div className="text-center px-2">
              <div className="text-2xs uppercase tracking-wider text-muted-color font-bold">
                Điểm Đạt Được
              </div>
              <div className="fs-28 font-bold text-brand-color line-height-1 mt-1">
                {submission.score !== null ? `${submission.score}` : 'Chờ chấm'}
                <span className="fs-16 text-muted-color font-normal"> / {submission.maxScore}đ</span>
              </div>
            </div>

            <Divider type="vertical" orientationMargin={0} className="h-100 m-0" />

            <div className="text-xs text-secondary-color d-flex flex-col gap-1">
              <div>
                Tỷ lệ đạt: <strong className="text-success">{Math.round(((submission.score || 0) / submission.maxScore) * 100)}%</strong>
              </div>
              <div>
                Số câu trả lời: <strong>{totalQuestions} câu</strong>
              </div>
              <div>
                Số câu đúng TN: <strong className="text-brand-color">{correctCount} câu</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Question Quick Jump Navigator */}
      <Card className="velica-card mb-4 border shadow-xs" bodyStyle={{ padding: '12px 16px' }}>
        <div className="d-flex items-center justify-between flex-wrap gap-2">
          <div className="d-flex items-center gap-2">
            <span className="font-bold text-xs text-secondary-color uppercase tracking-wider">
              Điều hướng câu hỏi:
            </span>
            <div className="d-flex items-center gap-1 flex-wrap">
              {submission.answers.map((ans, idx) => {
                const isEssay = ans.questionType === 'ESSAY';
                const isCorrect = (ans.pointsAwarded || 0) > 0;
                return (
                  <a
                    key={ans.questionId}
                    href={`#question-${idx + 1}`}
                    className={`d-inline-flex items-center justify-center rounded-2 font-semibold text-xs text-decoration-none`}
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: isEssay ? '#F3E8FF' : isCorrect ? '#ECFDF5' : '#FEF2F2',
                      color: isEssay ? '#7E22CE' : isCorrect ? '#047857' : '#B91C1C',
                      border: isEssay ? '1px solid #D8B4FE' : isCorrect ? '1px solid #A7F3D0' : '1px solid #FECACA',
                    }}
                    title={`Câu #${idx + 1}: ${isEssay ? 'Tự luận' : isCorrect ? 'Làm đúng' : 'Làm sai'}`}
                  >
                    {idx + 1}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="d-flex items-center gap-3 text-xs text-muted-color">
            <span className="d-flex items-center gap-1">
              <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#10B981' }} />
              Đúng trắc nghiệm
            </span>
            <span className="d-flex items-center gap-1">
              <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#EF4444' }} />
              Chưa chính xác
            </span>
            <span className="d-flex items-center gap-1">
              <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: '#A855F7' }} />
              Tự luận đã chấm
            </span>
          </div>
        </div>
      </Card>

      {/* 4. Detailed Question Breakdown List */}
      <div className="d-flex flex-col gap-4">
        {submission.answers.map((ans, idx) => {
          const fullQ = questionsMap[ans.questionId];
          const isEssay = ans.questionType === 'ESSAY';
          const isFullPoints = ans.pointsAwarded === ans.maxPoints;
          const isZero = ans.pointsAwarded === 0;

          // Parse options if available
          const options = fullQ?.options || [];
          const explanation = fullQ?.explanation || 'Đáp án được xây dựng dựa trên tài liệu chuẩn và chuẩn đầu ra của học phần.';

          return (
            <Card
              key={ans.questionId}
              id={`question-${idx + 1}`}
              className="velica-card border shadow-xs"
              title={
                <div className="d-flex items-center justify-between flex-wrap gap-2">
                  <div className="d-flex items-center gap-2">
                    <span className="font-bold text-sm text-brand-color">
                      Câu hỏi #{idx + 1}
                    </span>
                    <Tag color={isEssay ? 'purple' : 'blue'} className="text-2xs m-0">
                      {isEssay ? 'Tự luận (Essay)' : ans.questionType || 'Trắc nghiệm'}
                    </Tag>
                    {fullQ?.difficulty && (
                      <Tag className="velica-badge-gray text-2xs m-0">
                        {fullQ.difficulty}
                      </Tag>
                    )}
                  </div>

                  <div className="d-flex items-center gap-2">
                    <Tag
                      color={isFullPoints ? 'green' : isZero ? 'error' : 'orange'}
                      className="font-bold text-xs m-0 px-2 py-0.5"
                    >
                      {ans.pointsAwarded !== null && ans.pointsAwarded !== undefined
                        ? `${ans.pointsAwarded} / ${ans.maxPoints} đ`
                        : `Chờ chấm / ${ans.maxPoints} đ`}
                    </Tag>

                    <Button
                      size="small"
                      type="text"
                      icon={<ShieldAlert size={13} className="text-brand-color" />}
                      onClick={() => {
                        setAppealQuestionId(ans.questionId);
                        setAppealModalOpen(true);
                      }}
                      className="text-xs text-brand-color hover-underline"
                    >
                      Phúc khảo câu này
                    </Button>
                  </div>
                </div>
              }
            >
              {/* Question Text */}
              <div className="text-sm font-semibold text-primary-color mb-3 leading-relaxed">
                {ans.questionContent || fullQ?.content || `Câu hỏi đánh giá #${idx + 1}`}
              </div>

              {/* MCQ / Multi Choice / True-False Options */}
              {!isEssay && options.length > 0 && (
                <div className="d-flex flex-col gap-2 mb-4">
                  {options.map((opt, oIdx) => {
                    const optLetter = String.fromCharCode(65 + oIdx);
                    const isSelected =
                      ans.studentAnswer === opt.id ||
                      (typeof ans.studentAnswer === 'string' && ans.studentAnswer.includes(opt.id));
                    const isCorrect = opt.isCorrect;

                    let bgClass = 'bg-white border';
                    let borderStyle = '1px solid #E2E8F0';
                    let badgeNode = null;

                    if (isCorrect) {
                      bgClass = 'bg-success-subtle';
                      borderStyle = '1.5px solid #10B981';
                      badgeNode = (
                        <Tag color="success" className="font-semibold text-2xs m-0">
                          ✓ Đáp án chính xác
                        </Tag>
                      );
                    } else if (isSelected && !isCorrect) {
                      bgClass = 'bg-danger-subtle';
                      borderStyle = '1.5px solid #EF4444';
                      badgeNode = (
                        <Tag color="error" className="font-semibold text-2xs m-0">
                          ✕ Lựa chọn của bạn
                        </Tag>
                      );
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-2 d-flex items-center justify-between gap-3 ${bgClass}`}
                        style={{ border: borderStyle }}
                      >
                        <div className="d-flex items-center gap-3">
                          <span
                            className={`d-inline-flex items-center justify-center rounded-circle font-bold text-xs ${
                              isSelected
                                ? 'bg-brand text-white'
                                : 'bg-light text-secondary-color border'
                            }`}
                            style={{ width: 26, height: 26 }}
                          >
                            {optLetter}
                          </span>
                          <span className="text-xs font-medium text-primary-color">
                            {opt.text}
                          </span>
                        </div>

                        <div className="d-flex items-center gap-2 flex-shrink-0">
                          {isSelected && isCorrect && (
                            <Tag color="success" className="font-semibold text-2xs m-0">
                              ✓ Bạn đã chọn đúng
                            </Tag>
                          )}
                          {isSelected && !isCorrect && badgeNode}
                          {!isSelected && isCorrect && badgeNode}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Essay Answer Display */}
              {isEssay && (
                <div className="mb-4">
                  <div className="p-3 bg-light border rounded-2 mb-3">
                    <div className="text-2xs font-bold text-muted-color uppercase tracking-wider mb-2">
                      Bài làm tự luận của sinh viên:
                    </div>
                    <pre className="text-xs font-mono text-primary-color m-0 whitespace-pre-wrap lh-base bg-white p-3 border rounded-1">
                      {typeof ans.studentAnswer === 'string'
                        ? ans.studentAnswer
                        : JSON.stringify(ans.studentAnswer, null, 2)}
                    </pre>
                  </div>

                  {ans.feedback && (
                    <div className="p-3 bg-warning-subtle border-warning rounded-2 mb-2">
                      <div className="font-bold text-xs text-amber-800 mb-1">
                        Lời phê & Nhận xét của Giảng viên:
                      </div>
                      <div className="text-xs text-amber-900 leading-relaxed">
                        {ans.feedback}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Academic Explanation / Rationale */}
              <div className="p-3 bg-blue-subtle border-blue rounded-2 d-flex items-start gap-2">
                <Sparkles size={16} className="text-brand-color flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs text-blue-900 mb-1">
                    Giải thích chi tiết & Căn cứ học thuật:
                  </div>
                  <div className="text-xs text-blue-950 leading-relaxed">
                    {explanation}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Grade Appeal Request Modal */}
      <GradeAppealModal
        open={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
        preselectedAssessmentId={submission.assessmentId}
        preselectedQuestionId={appealQuestionId}
        onSuccess={() => {
          message.success('Đơn phúc khảo đã được ghi nhận. Bạn có thể theo dõi tại mục Đơn phúc khảo điểm.');
        }}
      />
    </div>
  );
};

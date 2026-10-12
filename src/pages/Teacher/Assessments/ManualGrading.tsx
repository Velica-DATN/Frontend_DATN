import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Space,
  Input,
  InputNumber,
  Tag,
  Divider,
  Row,
  Col,
  message,
  Tooltip,
  Segmented,
  Badge,
} from 'antd';
import {
  ProgressBar as BsProgressBar,
} from 'react-bootstrap';
import {
  ArrowLeft,
  Check,
  Sparkles,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  FileText,
  AlertCircle,
  MessageSquare,
  Copy,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Rubric, Submission, Question } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { QUESTION_TYPE } from '../../../constants/assessmentConstants';

const { Title, Text, Paragraph } = Typography;

export const ManualGrading: React.FC = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams<{ submissionId: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // View filter: ALL | ESSAY_ONLY | MCQ_ONLY
  const [viewFilter, setViewFilter] = useState<'ALL' | 'ESSAY_ONLY' | 'MCQ_ONLY'>('ALL');

  // Grades state per essay question: questionId -> { rubricScores: Record<critId, score>, feedback: string }
  const [essayGrades, setEssayGrades] = useState<
    Record<string, { rubricScores: Record<string, number>; feedback: string }>
  >({});
  const [overallFeedback, setOverallFeedback] = useState<string>(
    'Sinh viên nắm vững các kiến thức cốt lõi về Microservices và Clean Architecture. Cần chú ý thêm việc xử lý idempotent khi kích hoạt bù trừ giao dịch.'
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [sub, rList, qList] = await Promise.all([
        mockService.getSubmissionById(submissionId || 'sub-2'),
        mockService.getRubrics(),
        mockService.getQuestions(),
      ]);
      setSubmission(sub);
      setRubrics(rList);
      setQuestions(qList);

      // Initialize grading state for all essay questions
      if (sub) {
        const initialEssayGrades: Record<
          string,
          { rubricScores: Record<string, number>; feedback: string }
        > = {};

        sub.answers.forEach((ans) => {
          if (ans.questionType === QUESTION_TYPE.ESSAY) {
            // Find corresponding question to get its rubricId
            const qMatch = qList.find((q) => q.id === ans.questionId);
            const targetRubric =
              rList.find((r) => r.id === qMatch?.rubricId) ||
              (ans.questionId === 'q-6' ? rList[1] : rList[0]) ||
              rList[0];

            const defaultScores: Record<string, number> = {};
            targetRubric?.criteria?.forEach((crit) => {
              // Default to second level or proportional score
              defaultScores[crit.id] = crit.levels[1]?.score ?? crit.maxPoints * 0.8;
            });

            initialEssayGrades[ans.questionId] = {
              rubricScores: ans.rubricScores || defaultScores,
              feedback: ans.feedback || (ans.questionId === 'q-5' ? 'Phân tích ví dụ vi phạm SRP thực tế, giải pháp tách lớp rõ ràng.' : 'Trình bày đúng luồng bù trừ dữ liệu trong Saga Choreography.'),
            };
          }
        });

        setEssayGrades(initialEssayGrades);
      }

      setLoading(false);
    };
    fetchData();
  }, [submissionId]);

  // Compute points
  const essayQuestions = submission?.answers.filter(
    (a) => a.questionType === QUESTION_TYPE.ESSAY
  ) || [];
  const mcqQuestions = submission?.answers.filter(
    (a) => a.questionType !== QUESTION_TYPE.ESSAY
  ) || [];

  const autoMcqScore = mcqQuestions.reduce(
    (acc, curr) => acc + (curr.pointsAwarded || 0),
    0
  );

  const calculateQuestionScore = (qId: string, maxPoints: number) => {
    const qGrade = essayGrades[qId];
    if (!qGrade) return 0;
    const rawTotal = Object.values(qGrade.rubricScores).reduce((a, b) => a + b, 0);
    return Math.min(rawTotal, maxPoints);
  };

  const totalEssayScore = essayQuestions.reduce((acc, q) => {
    return acc + calculateQuestionScore(q.questionId, q.maxPoints);
  }, 0);

  const totalPossibleScore = submission?.maxScore || 10;
  const currentTotalScore = Number((autoMcqScore + totalEssayScore).toFixed(2));

  const handleRubricScoreChange = (qId: string, critId: string, score: number) => {
    setEssayGrades((prev) => {
      const currentQ = prev[qId] || { rubricScores: {}, feedback: '' };
      return {
        ...prev,
        [qId]: {
          ...currentQ,
          rubricScores: {
            ...currentQ.rubricScores,
            [critId]: score,
          },
        },
      };
    });
  };

  const handleQuestionFeedbackChange = (qId: string, feedbackText: string) => {
    setEssayGrades((prev) => {
      const currentQ = prev[qId] || { rubricScores: {}, feedback: '' };
      return {
        ...prev,
        [qId]: {
          ...currentQ,
          feedback: feedbackText,
        },
      };
    });
  };

  const handleSaveAllGrades = async () => {
    if (!submission) return;

    const gradesPayload = essayQuestions.map((q) => {
      const qGrade = essayGrades[q.questionId];
      const points = calculateQuestionScore(q.questionId, q.maxPoints);
      return {
        questionId: q.questionId,
        pointsAwarded: Number(points.toFixed(2)),
        feedback: qGrade?.feedback || '',
        rubricScores: qGrade?.rubricScores,
      };
    });

    await mockService.gradeSubmission(submission.id, gradesPayload);
    message.success(
      `Đã hoàn tất chấm điểm cho ${submission.studentName}! Tổng điểm: ${currentTotalScore}/${totalPossibleScore}`
    );
    navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_GRADING.replace(':id', submission.assessmentId));
  };

  const getRubricForQuestion = (qId: string): Rubric | null => {
    const qMatch = questions.find((q) => q.id === qId);
    if (qMatch?.rubricId) {
      const found = rubrics.find((r) => r.id === qMatch.rubricId);
      if (found) return found;
    }
    if (qId === 'q-6' && rubrics[1]) return rubrics[1];
    return rubrics[0] || null;
  };

  const displayedAnswers = (submission?.answers || []).filter((ans) => {
    if (viewFilter === 'ESSAY_ONLY') return ans.questionType === QUESTION_TYPE.ESSAY;
    if (viewFilter === 'MCQ_ONLY') return ans.questionType !== QUESTION_TYPE.ESSAY;
    return true;
  });

  return (
    <div className="animate-fade-in pb-5">
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(-1)}
          className="velica-back-btn"
        >
          Quay lại hàng đợi chấm điểm
        </Button>
      </div>

      {/* Header Info Banner */}
      <div className="velica-hero-banner mb-4">
        <div className="velica-hero-header">
          <div>
            <div className="d-flex items-center gap-2 flex-wrap mb-2">
              <span className="badge bg-primary text-white font-medium px-2 py-1">
                {submission?.className || 'SE301.P01 - Kiến Trúc Phần Mềm'}
              </span>
              <span className="velica-badge-gray">
                {submission?.assessmentTitle}
              </span>
              <span className="velica-badge-gray">
                Nộp lúc: {submission?.submittedAt}
              </span>
              {submission?.violationCount && submission.violationCount > 0 ? (
                <Tag color="error">{submission.violationCount} vi phạm chuyển tab</Tag>
              ) : (
                <Tag color="success">0 vi phạm</Tag>
              )}
            </div>

            <h1 className="velica-hero-title">
              Chấm Điểm Tự Luận: {submission?.studentName}
            </h1>
            <p className="velica-hero-meta">
              Tiêu chí Rubric hiển thị trực tiếp theo từng câu hỏi tự luận. Trắc nghiệm được hệ thống tự động kiểm tra và tổng hợp.
            </p>
          </div>

          {/* Quick Total Score Summary Box */}
          <div className="velica-score-preview-box">
            <div className="velica-score-preview-label">Tổng điểm đánh giá</div>
            <div className="velica-score-preview-val text-brand-color font-bold fs-22">
              {currentTotalScore} / {totalPossibleScore} đ
            </div>
            <div className="d-flex justify-between text-xs text-muted-color mb-1">
              <span>Trắc nghiệm: <strong>{autoMcqScore} đ</strong></span>
              <span>Tự luận: <strong>{totalEssayScore.toFixed(1)} đ</strong></span>
            </div>
            <BsProgressBar
              variant="primary"
              now={(currentTotalScore / totalPossibleScore) * 100}
              className="velica-progress-bar-sm"
            />
          </div>
        </div>
      </div>

      {/* Control Toolbar: Filter Mode & Progress */}
      <div className="d-flex justify-between items-center flex-wrap gap-3 mb-4 bg-light p-3 rounded-3 border">
        <div className="d-flex items-center gap-2">
          <span className="text-xs font-semibold text-secondary-color">Chế độ hiển thị:</span>
          <Segmented
            value={viewFilter}
            onChange={(val) => setViewFilter(val as any)}
            options={[
              { label: `Tất cả câu hỏi (${submission?.answers.length || 0})`, value: 'ALL' },
              {
                label: (
                  <span className="d-inline-flex items-center gap-1 font-bold text-amber-600">
                    ⚡ Chỉ câu tự luận cần chấm ({essayQuestions.length})
                  </span>
                ),
                value: 'ESSAY_ONLY',
              },
              { label: `Trắc nghiệm tự động (${mcqQuestions.length})`, value: 'MCQ_ONLY' },
            ]}
          />
        </div>

        <div className="d-flex items-center gap-2">
          <Button
            type="primary"
            icon={<Check size={16} />}
            onClick={handleSaveAllGrades}
            className="velica-btn-primary"
          >
            Lưu & Hoàn tất Chấm bài ({currentTotalScore} đ)
          </Button>
        </div>
      </div>

      {/* Main List of Questions */}
      <div className="d-flex flex-col gap-4">
        {displayedAnswers.map((ans, idx) => {
          const isEssay = ans.questionType === QUESTION_TYPE.ESSAY;
          const originalIndex = (submission?.answers || []).findIndex((a) => a.questionId === ans.questionId);
          const qMatch = questions.find((q) => q.id === ans.questionId);

          if (!isEssay) {
            // Clean, highly-readable Auto-Graded MCQ Card
            const isCorrect = (ans.pointsAwarded || 0) > 0;
            return (
              <Card
                key={ans.questionId}
                className="velica-card border shadow-xs"
                title={
                  <div className="d-flex justify-between items-center">
                    <div className="d-flex items-center gap-2">
                      <Tag color="cyan" className="font-semibold text-xs m-0">
                        Câu {originalIndex + 1} • Trắc nghiệm khách quan
                      </Tag>
                      <Tag color="green" className="text-xs m-0 font-medium">
                        ✓ Tự động chấm bởi máy tính
                      </Tag>
                    </div>
                    <div className="d-flex items-center gap-2">
                      <span className="text-xs text-muted-color">Điểm đạt:</span>
                      <strong className={isCorrect ? 'text-success-color fs-15' : 'text-danger-color fs-15'}>
                        {ans.pointsAwarded || 0} / {ans.maxPoints} đ
                      </strong>
                    </div>
                  </div>
                }
              >
                <div className="font-semibold text-primary-color mb-3 text-sm">
                  {ans.questionContent}
                </div>

                {/* Options List with clear visual identification */}
                <div className="d-flex flex-col gap-2 mb-2">
                  {qMatch?.options?.map((opt) => {
                    const isSelected = ans.studentAnswer === opt.id;
                    const isCorrectOpt = opt.isCorrect;

                    let optionBg = 'bg-light border-light';
                    let badge = null;

                    if (isSelected && isCorrectOpt) {
                      optionBg = 'bg-emerald-50 border-emerald-300 text-emerald-800';
                      badge = (
                        <Tag color="success" className="font-semibold text-xs m-0">
                          ✓ Sinh viên chọn (Đúng)
                        </Tag>
                      );
                    } else if (isSelected && !isCorrectOpt) {
                      optionBg = 'bg-rose-50 border-rose-300 text-rose-800';
                      badge = (
                        <Tag color="error" className="font-semibold text-xs m-0">
                          ✗ Sinh viên chọn (Sai)
                        </Tag>
                      );
                    } else if (!isSelected && isCorrectOpt) {
                      optionBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                      badge = (
                        <Tag color="blue" className="text-xs m-0">
                          Đáp án đúng của đề
                        </Tag>
                      );
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-2 px-3 rounded-2 border d-flex justify-between items-center text-xs ${optionBg}`}
                      >
                        <span className="font-medium">{opt.text}</span>
                        {badge}
                      </div>
                    );
                  }) || (
                    <div className="p-2 bg-light rounded-2 text-xs">
                      Sinh viên đã chọn: <strong className="text-primary-color">{ans.studentAnswer}</strong> • Đáp án chuẩn: <strong className="text-success-color">{ans.correctAnswer || ans.studentAnswer}</strong>
                    </div>
                  )}
                </div>

                {qMatch?.explanation && (
                  <div className="p-2 bg-subtle rounded-2 text-xs text-muted-color mt-2">
                    💡 <strong>Giải thích đáp án:</strong> {qMatch.explanation}
                  </div>
                )}
              </Card>
            );
          }

          // Rich Essay Question Card with rubric embedded directly in its section
          const targetRubric = getRubricForQuestion(ans.questionId);
          const currentQGrade = essayGrades[ans.questionId] || { rubricScores: {}, feedback: '' };
          const awardedForQuestion = calculateQuestionScore(ans.questionId, ans.maxPoints);

          return (
            <Card
              key={ans.questionId}
              className="velica-card border shadow-xs"
              title={
                <div className="d-flex justify-between items-center flex-wrap gap-2">
                  <div className="d-flex items-center gap-2">
                    <Tag color="orange" className="font-bold text-xs m-0 py-0.5 px-2">
                      Câu {originalIndex + 1} (Tự luận)
                    </Tag>
                    <span className="font-bold text-primary-color text-sm">
                      {targetRubric?.title || 'Rubric Chấm Điểm Chuyên Môn'}
                    </span>
                  </div>
                  <div className="d-flex items-center gap-2">
                    <span className="text-xs text-muted-color">Điểm câu này:</span>
                    <span className="badge bg-primary text-white font-bold fs-14">
                      {awardedForQuestion.toFixed(2)} / {ans.maxPoints} đ
                    </span>
                  </div>
                </div>
              }
            >
              {/* Question prompt */}
              <div className="bg-light p-3 rounded-3 border mb-3">
                <Text strong className="d-block text-primary-color mb-1">
                  Đề bài câu hỏi:
                </Text>
                <div className="text-sm text-secondary-color leading-relaxed font-medium">
                  {ans.questionContent}
                </div>
              </div>

              {/* Student Answer Box */}
              <div className="velica-essay-answer-box mb-4">
                <div className="d-flex justify-between items-center mb-2">
                  <Text strong className="text-brand-color d-inline-flex items-center gap-1">
                    <FileText size={15} /> Bài làm của sinh viên:
                  </Text>
                  <Tooltip title="Sao chép nội dung bài làm">
                    <Button
                      size="small"
                      type="text"
                      icon={<Copy size={13} />}
                      onClick={() => {
                        navigator.clipboard.writeText(ans.studentAnswer);
                        message.success('Đã sao chép bài làm vào clipboard!');
                      }}
                      className="text-muted-color"
                    >
                      Copy
                    </Button>
                  </Tooltip>
                </div>
                <div className="text-xs text-primary-color leading-relaxed font-normal whitespace-pre-wrap">
                  {ans.studentAnswer}
                </div>
              </div>

              {/* RUBRIC SCORING CRITERIA BLOCK DIRECTLY UNDER THIS ESSAY QUESTION */}
              <div className="bg-subtle p-3 rounded-3 border">
                <div className="d-flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="d-flex items-center gap-2">
                    <Sparkles size={16} className="text-brand-color" />
                    <strong className="text-sm text-primary-color">
                      Tiêu chí Rubric áp dụng cho Câu {originalIndex + 1}:
                    </strong>
                  </div>
                  <span className="text-xs text-muted-color">
                    Bấm các nút mức độ chuẩn bên dưới để chấm nhanh, hoặc tự điều chỉnh điểm số
                  </span>
                </div>

                <div className="d-flex flex-col gap-3">
                  {targetRubric?.criteria?.map((crit) => {
                    const currentCritScore =
                      currentQGrade.rubricScores[crit.id] ?? crit.levels[0]?.score ?? 1.0;

                    return (
                      <div
                        key={crit.id}
                        className="p-3 bg-white border rounded-3 shadow-2xs"
                      >
                        <div className="d-flex justify-between items-center mb-2 flex-wrap gap-2">
                          <div>
                            <Text strong className="text-primary-color text-xs d-block">
                              {crit.title}
                            </Text>
                            <span className="text-xs text-muted-color">
                              Thang điểm tiêu chí: tối đa {crit.maxPoints} đ
                            </span>
                          </div>

                          <div className="d-flex items-center gap-2">
                            <span className="text-xs font-semibold text-secondary-color">Điểm chấm:</span>
                            <InputNumber
                              min={0}
                              max={crit.maxPoints}
                              step={0.25}
                              value={currentCritScore}
                              onChange={(val) =>
                                handleRubricScoreChange(ans.questionId, crit.id, val || 0)
                              }
                              addonAfter="đ"
                              className="w-110"
                            />
                          </div>
                        </div>

                        {/* Quick-select level descriptor cards */}
                        <div className="d-flex gap-2 flex-wrap mt-2">
                          {crit.levels.map((lvl) => {
                            const isSelected = currentCritScore === lvl.score;
                            return (
                              <Tooltip key={lvl.id} title={lvl.description} placement="top">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRubricScoreChange(ans.questionId, crit.id, lvl.score)
                                  }
                                  className={`btn btn-sm text-start p-2 border rounded-2 flex-1 min-w-160 cursor-pointer transition-all ${
                                    isSelected
                                      ? 'btn-light border-primary shadow-xs bg-blue-50'
                                      : 'btn-white border-light bg-light hover:bg-slate-50'
                                  }`}
                                >
                                  <div className="d-flex justify-between items-center mb-1">
                                    <strong className="text-xs text-primary-color">{lvl.label}</strong>
                                    <span
                                      className={`badge ${
                                        isSelected ? 'bg-primary text-white' : 'bg-secondary text-white'
                                      }`}
                                    >
                                      {lvl.score}đ
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-color line-clamp-2">
                                    {lvl.description}
                                  </div>
                                </button>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Question-specific feedback input */}
                <div className="mt-3">
                  <div className="d-flex items-center gap-1 mb-1">
                    <MessageSquare size={14} className="text-secondary-color" />
                    <span className="text-xs font-semibold text-primary-color">
                      Nhận xét riêng cho Câu {originalIndex + 1}:
                    </span>
                  </div>
                  <Input.TextArea
                    rows={2}
                    value={currentQGrade.feedback}
                    onChange={(e) =>
                      handleQuestionFeedbackChange(ans.questionId, e.target.value)
                    }
                    placeholder={`Nhập nhận xét hoặc chỉ dẫn sửa bài cho Câu ${originalIndex + 1}...`}
                    className="text-xs"
                  />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Overall Final Feedback & Submission Section */}
      <Card className="velica-card mt-4 border shadow-xs">
        <Title level={5} className="font-bold mb-2">
          Nhận xét Sư phạm Tổng thể & Kết luận Đánh giá
        </Title>
        <Input.TextArea
          rows={3}
          value={overallFeedback}
          onChange={(e) => setOverallFeedback(e.target.value)}
          placeholder="Lời phê chung gửi tới sinh viên kèm bảng điểm học phần..."
          className="mb-3 text-xs"
        />

        <div className="d-flex justify-between items-center flex-wrap gap-2">
          <div className="text-xs text-muted-color">
            Điểm trắc nghiệm: <strong>{autoMcqScore} đ</strong> + Điểm tự luận:{' '}
            <strong>{totalEssayScore.toFixed(2)} đ</strong> = Điểm tổng kết:{' '}
            <strong className="text-brand-color fs-15">{currentTotalScore} / {totalPossibleScore} đ</strong>
          </div>

          <div className="d-flex gap-2">
            <Button onClick={() => navigate(-1)}>Hủy bỏ</Button>
            <Button
              type="primary"
              icon={<Check size={16} />}
              onClick={handleSaveAllGrades}
              className="velica-btn-primary"
            >
              Hoàn tất Chấm điểm & Cập nhật kết quả
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

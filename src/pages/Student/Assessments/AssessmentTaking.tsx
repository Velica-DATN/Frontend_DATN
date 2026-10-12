import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Radio,
  Checkbox,
  Input,
  Tag,
  Modal,
  Drawer,
  Space,
  Typography,
  message,
  Row,
  Col,
  Dropdown,
  Segmented,
  Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  Offcanvas,
  Button as BsButton,
  Badge as BsBadge,
  ProgressBar as BsProgressBar,
} from 'react-bootstrap';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Save,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LayoutGrid,
  CheckSquare,
  Maximize2,
  FileCode,
  List,
  ListOrdered,
  BookOpen,
  Bold,
  Table as TableIcon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  Edit3,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment, Question, Rubric } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { TimerDisplay } from '../../../components/velica/TimerDisplay/TimerDisplay';
import { ConnectionIndicator } from '../../../components/velica/ConnectionIndicator/ConnectionIndicator';
import { QUESTION_TYPE, QuestionType } from '../../../constants/assessmentConstants';

const { Title, Text, Paragraph } = Typography;

export const AssessmentTaking: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Answers state: questionId -> answer string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Flagged questions: questionId -> boolean
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Session stats & indicators
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(45 * 60); // 45 mins
  const [saveStatus, setSaveStatus] = useState<'SAVED' | 'SAVING' | 'DIRTY'>('SAVED');
  const [connectionStatus, setConnectionStatus] = useState<'ONLINE' | 'OFFLINE' | 'RECONNECTING'>('ONLINE');
  const [violationCount, setViolationCount] = useState(0);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rubricDrawerOpen, setRubricDrawerOpen] = useState(false);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [showRubricInline, setShowRubricInline] = useState(true);
  const [essayViewMode, setEssayViewMode] = useState<'EDIT' | 'PREVIEW'>('EDIT');

  // Initialize assessment, questions, and rubrics
  useEffect(() => {
    const fetchExam = async () => {
      const [allAsm, allQ, allRubrics] = await Promise.all([
        mockService.getAssessments(),
        mockService.getQuestions(),
        mockService.getRubrics(),
      ]);
      const asm = allAsm.find((a) => a.id === id) || allAsm[0];
      setAssessment(asm);
      setRubrics(allRubrics);

      // Take questions assigned to this assessment or all questions
      const matched = allQ.filter((q) => asm.questionIds?.includes(q.id));
      const finalQuestions = matched.length > 0 ? matched : allQ;
      setQuestions(finalQuestions);

      if (asm.timeLimitMinutes > 0) {
        setTimeRemainingSeconds(asm.timeLimitMinutes * 60);
      }
    };
    fetchExam();
  }, [id]);

  // Timer countdown hook
  useEffect(() => {
    if (timeRemainingSeconds <= 0) {
      message.warning('Đã hết giờ làm bài! Hệ thống đang tự động nộp bài.');
      handleConfirmSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRemainingSeconds]);

  // Anti-cheat tab visibility change detector
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setViolationCount((prev) => {
          const next = prev + 1;
          message.error(`Cảnh báo: Bạn vừa rời khỏi màn hình làm bài! Lần vi phạm #${next}`);
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      // Focus lost
      setViolationCount((prev) => prev + 1);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, []);

  // Autosave simulation every 30s or when answers change
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAnswerChange = (qId: string, answerVal: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: answerVal }));
    setSaveStatus('SAVING');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      // Save to localStorage cache as specified in Section 11 of ui-backlog-mapping.md
      try {
        localStorage.setItem(`exam_cache_${id}`, JSON.stringify({ ...answers, [qId]: answerVal }));
      } catch {
        // ignore
      }
      setSaveStatus('SAVED');
    }, 800);
  };

  const getMultiChoiceAnswers = (qId: string): string[] => {
    const raw = answers[qId];
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return raw.split(',').filter(Boolean);
    }
  };

  const handleMultiChoiceToggle = (qId: string, optId: string) => {
    const current = getMultiChoiceAnswers(qId);
    const next = current.includes(optId)
      ? current.filter((id) => id !== optId)
      : [...current, optId];
    handleAnswerChange(qId, JSON.stringify(next));
  };

  const handleInsertEssaySnippet = (qId: string, snippet: string) => {
    const currentVal = answers[qId] || '';
    handleAnswerChange(qId, currentVal + snippet);
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case QUESTION_TYPE.MCQ:
        return 'Trắc nghiệm đơn';
      case QUESTION_TYPE.MULTI_CHOICE:
        return 'Nhiều lựa chọn (Multi-Select)';
      case QUESTION_TYPE.TRUE_FALSE:
        return 'Đúng / Sai';
      case QUESTION_TYPE.FILL_BLANK:
        return 'Điền khuyết';
      case QUESTION_TYPE.ESSAY:
        return 'Tự luận chuyên sâu';
      default:
        return 'Câu hỏi';
    }
  };

  const handleToggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  // Active rubric corresponding to current question
  const currentRubric =
    (currentQ?.rubricId ? rubrics.find((r) => r.id === currentQ.rubricId) : null) ||
    rubrics[0] ||
    null;

  const renderFormattedInline = (inlineText: string) => {
    const parts = inlineText.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, pIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={pIdx} className="font-semibold text-primary-color">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={pIdx} className="px-1.5 py-0.5 rounded bg-slate-100 text-rose-600 font-mono text-xs">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const renderMarkdownPreview = (rawContent: string) => {
    if (!rawContent || !rawContent.trim()) {
      return (
        <div className="text-center py-5 text-muted-color">
          <FileCode size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">Chưa có nội dung bài làm tự luận</p>
          <p className="text-xs">Chuyển sang chế độ "Soạn thảo" hoặc bấm các nút công cụ bên trên để bắt đầu viết bài.</p>
        </div>
      );
    }

    const lines = rawContent.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeLines: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (key: string) => {
      if (tableRows.length > 0) {
        const headerRow = tableRows[0];
        const bodyRows = tableRows.slice(1).filter((r) => !r.every((cell) => cell.includes('---')));
        elements.push(
          <div key={key} className="table-responsive my-2">
            <table className="velica-exam-preview-table">
              <thead>
                <tr>
                  {headerRow.map((h, i) => (
                    <th key={i}>{renderFormattedInline(h.trim())}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{renderFormattedInline(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (!inCodeBlock) {
          if (inTable) flushTable(`table-${idx}`);
          inCodeBlock = true;
          codeLanguage = trimmed.replace('```', '').trim() || 'code';
          codeLines = [];
        } else {
          elements.push(
            <div key={`code-${idx}`} className="velica-exam-preview-codeblock">
              <div className="velica-exam-preview-codeblock-head">
                <span>{codeLanguage}</span>
                <span className="text-2xs text-slate-400">Khối mã nguồn</span>
              </div>
              <pre>
                <code>{codeLines.join('\n')}</code>
              </pre>
            </div>
          );
          inCodeBlock = false;
          codeLanguage = '';
          codeLines = [];
        }
        return;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        return;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());
        tableRows.push(cells);
        return;
      } else if (inTable) {
        flushTable(`table-${idx}`);
      }

      if (trimmed.startsWith('### ')) {
        elements.push(
          <h4 key={`h3-${idx}`} className="font-bold text-base text-slate-900 mt-3 mb-1">
            {renderFormattedInline(trimmed.replace('### ', ''))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h3 key={`h2-${idx}`} className="font-bold text-lg text-slate-900 mt-4 mb-2">
            {renderFormattedInline(trimmed.replace('## ', ''))}
          </h3>
        );
        return;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <div key={`li-${idx}`} className="d-flex items-start gap-2 my-0.5 ps-2">
            <span className="text-brand-color font-bold">•</span>
            <span>{renderFormattedInline(trimmed.slice(2))}</span>
          </div>
        );
        return;
      }

      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`ol-${idx}`} className="d-flex items-start gap-2 my-0.5 ps-2">
            <span className="text-brand-color font-semibold min-w-16">{numMatch[1]}.</span>
            <span>{renderFormattedInline(numMatch[2])}</span>
          </div>
        );
        return;
      }

      if (!trimmed) {
        elements.push(<div key={`sp-${idx}`} className="h-2" />);
        return;
      }

      elements.push(
        <p key={`p-${idx}`} className="my-1 text-slate-700">
          {renderFormattedInline(line)}
        </p>
      );
    });

    if (inCodeBlock && codeLines.length > 0) {
      elements.push(
        <div key="code-end" className="velica-exam-preview-codeblock">
          <div className="velica-exam-preview-codeblock-head">
            <span>{codeLanguage || 'code'}</span>
          </div>
          <pre>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
    }
    if (inTable) {
      flushTable('table-end');
    }

    return elements;
  };

  // Question answering status
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const handleConfirmSubmit = async () => {
    setSubmitModalOpen(false);
    message.loading('Đang xử lý nộp bài và đồng bộ câu trả lời...');

    const currentUser = mockService.getCurrentUser();

    // Calculate score & question breakdown
    let totalScore = 0;
    let hasEssay = false;

    const answerBreakdown = questions.map((q) => {
      const studentAns = answers[q.id] || '';
      const qPoints = q.points || 1;
      let isCorrect = false;
      let pointsAwarded = 0;

      if (q.type === QUESTION_TYPE.MCQ) {
        const correctOpt = q.options?.find((o) => o.isCorrect);
        isCorrect = correctOpt ? correctOpt.id === studentAns : false;
        pointsAwarded = isCorrect ? qPoints : 0;
      } else if (q.type === QUESTION_TYPE.TRUE_FALSE) {
        const correctOpt = q.options?.find((o) => o.isCorrect);
        isCorrect = correctOpt ? correctOpt.id === studentAns : studentAns === 'opt-tf-true';
        pointsAwarded = isCorrect ? qPoints : 0;
      } else if (q.type === QUESTION_TYPE.FILL_BLANK) {
        isCorrect = studentAns.trim().length > 0;
        pointsAwarded = isCorrect ? qPoints : 0;
      } else if (q.type === QUESTION_TYPE.MULTI_CHOICE) {
        const selected = getMultiChoiceAnswers(q.id);
        const correctCount = q.options?.filter((o) => o.isCorrect).length || 1;
        pointsAwarded = selected.length > 0 ? Number(((selected.length / correctCount) * qPoints).toFixed(1)) : 0;
        if (pointsAwarded > qPoints) pointsAwarded = qPoints;
      } else if (q.type === QUESTION_TYPE.ESSAY) {
        hasEssay = true;
        pointsAwarded = studentAns.trim().length > 20 ? 3.5 : 2.0;
      }

      totalScore += pointsAwarded;

      return {
        questionId: q.id,
        questionContent: q.content,
        questionType: q.type,
        studentAnswer: studentAns,
        pointsAwarded,
        maxPoints: qPoints,
        feedback: q.type === QUESTION_TYPE.ESSAY ? 'Bài giải có cấu trúc tốt, phân tích đúng nguyên tắc.' : undefined,
      };
    });

    const maxScore = questions.reduce((acc, q) => acc + (q.points || 1), 0);
    const finalNormalizedScore = Number(((totalScore / (maxScore || 10)) * 10).toFixed(1));

    await mockService.createSubmission({
      assessmentId: id || 'asm-1',
      assessmentTitle: assessment?.title || 'Bài thi khảo thí',
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      score: finalNormalizedScore,
      maxScore: 10,
      gradingStatus: 'GRADED',
      isLate: false,
      violationCount,
      answers: answerBreakdown,
    });

    setTimeout(() => {
      message.success('Nộp bài kiểm tra thành công!');
      navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_SUBMISSION.replace(':id', id || 'asm-1'));
    }, 400);
  };

  const renderQuestionGrid = (onSelect?: () => void) => (
    <div className="velica-exam-palette-grid">
      {questions.map((q, idx) => {
        const isCurrent = idx === currentIndex;
        const isAnswered = Boolean(answers[q.id]?.trim());
        const isFlag = Boolean(flagged[q.id]);

        let stateClass = '';
        if (isCurrent) {
          stateClass = 'velica-exam-palette-btn-current';
        } else if (isFlag) {
          stateClass = 'velica-exam-palette-btn-flagged';
        } else if (isAnswered) {
          stateClass = 'velica-exam-palette-btn-answered';
        }

        return (
          <button
            key={q.id}
            onClick={() => {
              setCurrentIndex(idx);
              if (onSelect) onSelect();
            }}
            className={`velica-exam-palette-btn ${stateClass}`}
          >
            {idx + 1}
            {isFlag && !isCurrent && (
              <span className="velica-exam-flag-dot" />
            )}
          </button>
        );
      })}
    </div>
  );

  const renderLegend = () => (
    <div className="velica-exam-legend-card">
      <div className="d-flex items-center gap-2">
        <span className="velica-exam-legend-dot bg-brand" />
        <span>Đang xem</span>
      </div>
      <div className="d-flex items-center gap-2">
        <span className="velica-exam-legend-dot bg-success" />
        <span>Đã trả lời ({answeredCount})</span>
      </div>
      <div className="d-flex items-center gap-2">
        <span className="velica-exam-legend-dot bg-warning" />
        <span>Đánh dấu xem lại ({Object.values(flagged).filter(Boolean).length})</span>
      </div>
      <div className="d-flex items-center gap-2">
        <span className="velica-exam-legend-dot bg-muted" />
        <span>Chưa trả lời ({unansweredCount})</span>
      </div>
    </div>
  );

  return (
    <div className="velica-exam-container">
      {/* 1. Slim Header Bar (56px) - Spec Section 9 ui-design-system.md */}
      <header className="velica-exam-header px-3 px-md-4 py-2">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          {/* Left: Assessment Title */}
          <div className="d-flex align-items-center gap-2">
            <BsBadge bg="primary" className="fw-semibold px-2 py-1">
              {assessment?.type || 'MIDTERM'}
            </BsBadge>
            <span className="fw-bold text-dark text-truncate max-w-280 text-sm">
              {assessment?.title || 'Đề thi Khảo thí Trực tuyến'}
            </span>
          </div>

          {/* Center / Right: Save Status + Connection + Timer + Submit CTA */}
          <div className="d-flex align-items-center flex-wrap gap-2 gap-md-3 ms-auto">
            {/* Autosave Status Indicator */}
            <div className="d-none d-sm-flex align-items-center gap-1 font-monospace text-xs">
              {saveStatus === 'SAVED' && (
                <span className="text-success d-flex align-items-center gap-1 fw-medium">
                  <CheckCircle2 size={14} /> Đã lưu tự động
                </span>
              )}
              {saveStatus === 'SAVING' && (
                <span className="text-warning d-flex align-items-center gap-1 fw-medium">
                  <Save size={14} /> Đang lưu...
                </span>
              )}
            </div>

            {/* Connection Indicator */}
            <div className="d-none d-sm-block">
              <ConnectionIndicator status={connectionStatus} />
            </div>

            {/* Assessment Countdown Timer */}
            <TimerDisplay totalSeconds={timeRemainingSeconds} size="md" />

            {/* Submit Button (Desktop / Tablet) */}
            <BsButton
              variant="primary"
              size="sm"
              onClick={() => setSubmitModalOpen(true)}
              className="d-none d-md-inline-flex align-items-center gap-1 px-3 py-1 fw-bold velica-btn-primary"
            >
              <Send size={14} /> Nộp bài thi
            </BsButton>
          </div>
        </div>
      </header>

      {/* 2. Main Content: Question Panel (65%) + Navigator Panel (35%) */}
      <div className="velica-exam-content px-3 px-md-4 py-3 py-md-4">
        <Row gutter={[24, 24]}>
          {/* Left: Question Panel */}
          <Col xs={24} lg={16}>
            {currentQ ? (
              <div className="velica-exam-card animate-fade-in">
                <div>
                  {/* Question Meta Bar */}
                  <div className="velica-exam-meta-bar">
                    <div className="d-flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-brand-color text-base">
                        Câu {currentIndex + 1} / {questions.length}
                      </span>
                      <Tag
                        color={
                          currentQ.type === QUESTION_TYPE.MCQ
                            ? 'blue'
                            : currentQ.type === QUESTION_TYPE.MULTI_CHOICE
                            ? 'cyan'
                            : currentQ.type === QUESTION_TYPE.TRUE_FALSE
                            ? 'green'
                            : currentQ.type === QUESTION_TYPE.FILL_BLANK
                            ? 'purple'
                            : 'orange'
                        }
                        className="rounded-2 font-medium"
                      >
                        {getQuestionTypeLabel(currentQ.type)}
                      </Tag>
                      <Tag className="rounded-2">{currentQ.difficulty}</Tag>
                      <span className="text-xs font-bold text-secondary-color">
                        {currentQ.points} điểm
                      </span>
                    </div>

                    {/* Flag for Review Button */}
                    <Button
                      type={flagged[currentQ.id] ? 'primary' : 'default'}
                      icon={<Flag size={14} />}
                      onClick={() => handleToggleFlag(currentQ.id)}
                      className={flagged[currentQ.id] ? 'velica-btn-amber text-xs font-semibold' : 'text-xs font-semibold rounded-2'}
                    >
                      {flagged[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}
                    </Button>
                  </div>

                  {/* Question Prompt */}
                  <div className="velica-exam-prompt">
                    {currentQ.content}
                  </div>

                  {/* Optional Diagram / Architecture Image Attachment */}
                  {currentQ.imageUrl && (
                    <div className="velica-exam-diagram-wrap">
                      <img
                        src={currentQ.imageUrl}
                        alt="Đồ hình câu hỏi"
                        className="velica-exam-diagram-img"
                        onClick={() => setPreviewImage(currentQ.imageUrl || null)}
                      />
                      <div className="velica-exam-diagram-caption">
                        <span>Sơ đồ / Đồ hình tham chiếu cho câu hỏi này</span>
                        <Button
                          type="link"
                          size="small"
                          icon={<Maximize2 size={13} />}
                          className="p-0 text-xs font-semibold text-brand-color"
                          onClick={() => setPreviewImage(currentQ.imageUrl || null)}
                        >
                          Xem phóng to
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 1. Single Choice (MCQ) */}
                  {currentQ.type === QUESTION_TYPE.MCQ && currentQ.options && (
                    <Radio.Group
                      value={answers[currentQ.id] || ''}
                      onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                      className="w-100"
                    >
                      <Space direction="vertical" className="w-100" size={12}>
                        {currentQ.options.map((opt, optIdx) => {
                          const isSelected = answers[currentQ.id] === opt.id;
                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleAnswerChange(currentQ.id, opt.id)}
                              className={`velica-exam-option-item ${isSelected ? 'velica-exam-option-item-selected' : ''}`}
                            >
                              <Radio value={opt.id} />
                              <span className={isSelected ? 'font-bold text-brand-color min-w-22' : 'font-bold text-secondary-color min-w-22'}>
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className={isSelected ? 'text-sm text-primary-color flex-1 font-semibold' : 'text-sm text-primary-color flex-1 font-regular'}>
                                {opt.text}
                              </span>
                            </div>
                          );
                        })}
                      </Space>
                    </Radio.Group>
                  )}

                  {/* 2. Multi-Select Checkboxes (MULTI_CHOICE) */}
                  {currentQ.type === QUESTION_TYPE.MULTI_CHOICE && currentQ.options && (
                    <div>
                      <div className="mb-2 text-xs font-semibold text-brand-color d-flex items-center gap-1">
                        <CheckSquare size={13} /> Chọn tất cả các đáp án bạn cho là đúng:
                      </div>
                      <Space direction="vertical" className="w-100" size={12}>
                        {currentQ.options.map((opt, optIdx) => {
                          const selectedList = getMultiChoiceAnswers(currentQ.id);
                          const isChecked = selectedList.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleMultiChoiceToggle(currentQ.id, opt.id)}
                              className={`velica-exam-checkbox-item ${isChecked ? 'velica-exam-checkbox-item-selected' : ''}`}
                            >
                              <Checkbox checked={isChecked} />
                              <span className={isChecked ? 'font-bold text-brand-color min-w-22' : 'font-bold text-secondary-color min-w-22'}>
                                {String.fromCharCode(65 + optIdx)}.
                              </span>
                              <span className={isChecked ? 'text-sm text-primary-color flex-1 font-semibold' : 'text-sm text-primary-color flex-1 font-regular'}>
                                {opt.text}
                              </span>
                            </div>
                          );
                        })}
                      </Space>
                      <div className="mt-2 text-xs text-muted-color">
                        Đã chọn {getMultiChoiceAnswers(currentQ.id).length} đáp án
                      </div>
                    </div>
                  )}

                  {/* 3. True / False (TRUE_FALSE) */}
                  {currentQ.type === QUESTION_TYPE.TRUE_FALSE && (
                    <div>
                      <div className="mb-2 text-xs font-semibold text-muted-color">
                        Chọn một trong hai nhận định dưới đây:
                      </div>
                      <div className="velica-exam-tf-grid">
                        <div
                          onClick={() => handleAnswerChange(currentQ.id, 'opt-tf-true')}
                          className={`velica-exam-tf-card ${answers[currentQ.id] === 'opt-tf-true' ? 'velica-exam-tf-card-selected' : ''}`}
                        >
                          <div className="velica-exam-tf-badge text-emerald-600">
                            <CheckCircle2 size={16} /> ĐÚNG (True)
                          </div>
                          <div className="velica-exam-tf-desc">
                            Nhận định nêu trên là chính xác theo nguyên lý và tài liệu chuyên môn.
                          </div>
                        </div>

                        <div
                          onClick={() => handleAnswerChange(currentQ.id, 'opt-tf-false')}
                          className={`velica-exam-tf-card ${answers[currentQ.id] === 'opt-tf-false' ? 'velica-exam-tf-card-selected' : ''}`}
                        >
                          <div className="velica-exam-tf-badge text-rose-600">
                            <XCircle size={16} /> SAI (False)
                          </div>
                          <div className="velica-exam-tf-desc">
                            Nhận định nêu trên là sai lệch, không thỏa mãn các nguyên tắc lý thuyết.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 4. Fill in the blank (FILL_BLANK) */}
                  {currentQ.type === QUESTION_TYPE.FILL_BLANK && (
                    <div className="velica-exam-blank-wrap">
                      <div className="mb-2 text-xs font-semibold text-secondary-color">
                        Nhập câu trả lời ngắn / từ khóa cần điền vào ô bên dưới:
                      </div>
                      <Input
                        size="large"
                        placeholder="Nhập câu trả lời của bạn..."
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                        className="velica-exam-blank-input"
                      />
                      <div className="velica-exam-blank-hint">
                        Gợi ý: Nhập câu trả lời ngắn gọn, chuẩn xác thuật ngữ chuyên ngành. Hệ thống tự động lưu khi gõ.
                      </div>
                    </div>
                  )}

                  {/* 5. Deep Academic Essay (ESSAY) */}
                  {currentQ.type === QUESTION_TYPE.ESSAY && (
                    <div>
                      {/* Inline Collapsible Rubric Reference Card */}
                      {currentRubric && (
                        <div className={`velica-exam-rubric-inline-card ${showRubricInline ? 'is-open' : ''}`}>
                          <div
                            className="velica-exam-rubric-header"
                            onClick={() => setShowRubricInline(!showRubricInline)}
                          >
                            <div className="d-flex items-center gap-2">
                              <BookOpen size={16} className="text-brand-color" />
                              <span className="font-bold text-sm text-primary-color">
                                Tiêu chuẩn & Tiêu chí chấm điểm Rubric ({currentRubric.criteria.length} tiêu chí)
                              </span>
                              <Tag color="orange" className="rounded-2 font-bold text-xs m-0">
                                Tham chiếu chấm bài
                              </Tag>
                            </div>
                            <div className="d-flex items-center gap-2">
                              <Button
                                type="link"
                                size="small"
                                className="p-0 text-xs font-semibold text-brand-color"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRubricDrawerOpen(true);
                                }}
                              >
                                Mở toàn bộ Rubric
                              </Button>
                              {showRubricInline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>

                          {showRubricInline && (
                            <div className="velica-exam-rubric-body">
                              <p className="text-xs text-muted-color mb-2">
                                {currentRubric.description || 'Bài làm sẽ được đánh giá dựa trên các tiêu chí chuyên môn dưới đây:'}
                              </p>
                              <div className="d-flex flex-col gap-2">
                                {currentRubric.criteria.map((crit, cIdx) => (
                                  <div key={crit.id} className="p-2 rounded bg-light border text-xs">
                                    <div className="d-flex justify-between items-center mb-1">
                                      <span className="font-bold text-primary-color">
                                        {cIdx + 1}. {crit.title}
                                      </span>
                                      <Tag color="blue" className="m-0 font-semibold">
                                        Tối đa {crit.maxPoints}đ
                                      </Tag>
                                    </div>
                                    <div className="row g-2 mt-1">
                                      {crit.levels.map((lvl) => (
                                        <div key={lvl.id} className="col-12 col-md-6 col-lg-3">
                                          <div className="p-1 px-2 rounded border bg-white h-100">
                                            <div className="d-flex justify-between font-semibold text-2xs mb-1">
                                              <span className="text-brand-color">{lvl.label}</span>
                                              <span className="text-secondary-color">{lvl.score}đ</span>
                                            </div>
                                            <div className="text-muted-color text-2xs" style={{ lineHeight: 1.3 }}>
                                              {lvl.description}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Essay formatting tools */}
                      <div className="velica-exam-essay-toolbar">
                        <div className="velica-exam-essay-tools-group">
                          {/* Code dropdown */}
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: 'ts',
                                  label: 'TypeScript / JavaScript',
                                  onClick: () =>
                                    handleInsertEssaySnippet(
                                      currentQ.id,
                                      '\n```typescript\n// Minh họa kiến trúc hoặc giải pháp mã nguồn\ninterface IOrderService {\n  execute(orderId: string): Promise<boolean>;\n}\n```\n'
                                    ),
                                },
                                {
                                  key: 'java',
                                  label: 'Java / C#',
                                  onClick: () =>
                                    handleInsertEssaySnippet(
                                      currentQ.id,
                                      '\n```java\n// Cấu trúc Use Case phân tầng Clean Architecture\npublic class ProcessPaymentUseCase {\n    private final IPaymentGateway paymentGateway;\n}\n```\n'
                                    ),
                                },
                                {
                                  key: 'sql',
                                  label: 'SQL / Truy vấn Database',
                                  onClick: () =>
                                    handleInsertEssaySnippet(
                                      currentQ.id,
                                      '\n```sql\n-- Truy vấn dữ liệu liên quan\nSELECT id, student_code, status FROM assessments;\n```\n'
                                    ),
                                },
                                {
                                  key: 'generic',
                                  label: 'Khối mã nguồn chung (Generic)',
                                  onClick: () =>
                                    handleInsertEssaySnippet(
                                      currentQ.id,
                                      '\n```\n// Viết mã nguồn hoặc cấu trúc tại đây\n```\n'
                                    ),
                                },
                                {
                                  key: 'inline',
                                  label: 'Mã lệnh nội dòng (`code`)',
                                  onClick: () => handleInsertEssaySnippet(currentQ.id, ' `ma_lenh()` '),
                                },
                              ],
                            }}
                            trigger={['click']}
                          >
                            <button type="button" className="velica-exam-essay-tool-btn">
                              <FileCode size={13} /> Khối Code <ChevronDown size={11} />
                            </button>
                          </Dropdown>

                          {/* Numbered List */}
                          <button
                            type="button"
                            className="velica-exam-essay-tool-btn"
                            onClick={() =>
                              handleInsertEssaySnippet(
                                currentQ.id,
                                '\n1. Luận điểm thứ nhất:\n2. Luận điểm thứ hai:\n3. Luận điểm thứ ba:\n'
                              )
                            }
                          >
                            <ListOrdered size={13} /> Danh sách 1, 2, 3
                          </button>

                          {/* Bullet List */}
                          <button
                            type="button"
                            className="velica-exam-essay-tool-btn"
                            onClick={() =>
                              handleInsertEssaySnippet(
                                currentQ.id,
                                '\n- Ý chính 1:\n- Ý chính 2:\n  * Chi tiết chứng minh:\n'
                              )
                            }
                          >
                            <List size={13} /> Gạch đầu dòng
                          </button>

                          {/* Bold */}
                          <button
                            type="button"
                            className="velica-exam-essay-tool-btn"
                            onClick={() => handleInsertEssaySnippet(currentQ.id, ' **nội dung nhấn mạnh** ')}
                          >
                            <Bold size={13} /> In đậm
                          </button>

                          {/* Comparison Table */}
                          <button
                            type="button"
                            className="velica-exam-essay-tool-btn"
                            onClick={() =>
                              handleInsertEssaySnippet(
                                currentQ.id,
                                '\n| Tiêu chí so sánh | Hiện trạng vi phạm | Đề xuất Clean Architecture |\n| :--- | :--- | :--- |\n| Trách nhiệm (SRP) | Gộp xử lý đơn hàng & thanh toán | Tách thành Use Case & Gateway riêng biệt |\n| Chiều phụ thuộc (DIP) | Phụ thuộc trực tiếp Database | Phụ thuộc vào Interface / Abstraction |\n'
                              )
                            }
                          >
                            <TableIcon size={13} /> Bảng so sánh
                          </button>

                          {/* Analysis Template */}
                          <button
                            type="button"
                            className="velica-exam-essay-tool-btn velica-exam-essay-tool-btn-primary"
                            onClick={() =>
                              handleInsertEssaySnippet(
                                currentQ.id,
                                '\n### 1. Phân tích hiện trạng & Nhận diện vi phạm\n- Mã nguồn đang vi phạm nguyên lý: ...\n- Hậu quả kỹ thuật và rủi ro: ...\n\n### 2. Đề xuất giải pháp kiến trúc & Tái cấu trúc\n- Các thành phần phân rã (Entities, Use Cases, Interfaces): ...\n- Thiết kế luồng xử lý và đảo ngược phụ thuộc: ...\n\n### 3. Đánh giá Trade-offs & Lợi ích vận hành\n- Khả năng kiểm thử (Unit Test): ...\n- Khả năng bảo trì và mở rộng: ...\n'
                              )
                            }
                          >
                            <Sparkles size={13} /> Mẫu bài luận
                          </button>
                        </div>

                        {/* Right side: Mode switch */}
                        <div>
                          <Segmented
                            size="small"
                            value={essayViewMode}
                            onChange={(val) => setEssayViewMode(val as 'EDIT' | 'PREVIEW')}
                            options={[
                              {
                                label: 'Soạn thảo',
                                value: 'EDIT',
                                icon: <Edit3 size={13} className="d-inline mr-1 align-middle" />,
                              },
                              {
                                label: 'Xem trước bài làm',
                                value: 'PREVIEW',
                                icon: <Eye size={13} className="d-inline mr-1 align-middle" />,
                              },
                            ]}
                          />
                        </div>
                      </div>

                      {essayViewMode === 'EDIT' ? (
                        <Input.TextArea
                          rows={12}
                          value={answers[currentQ.id] || ''}
                          onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                          placeholder="Nhập nội dung bài làm tự luận chi tiết tại đây. Bạn có thể sử dụng các nút công cụ bên trên để chèn mã nguồn, danh sách gạch đầu dòng, danh sách số, bảng ma trận..."
                          className="velica-exam-essay-input"
                        />
                      ) : (
                        <div className="velica-exam-essay-preview">
                          {renderMarkdownPreview(answers[currentQ.id] || '')}
                        </div>
                      )}

                      <div className="d-flex justify-between items-center text-xs text-muted-color font-medium mt-2">
                        <span>
                          {answers[currentQ.id]?.trim() ? (
                            <span className="text-emerald-600 font-semibold d-inline-flex items-center gap-1">
                              <CheckCircle2 size={13} /> Đã lưu bài viết
                            </span>
                          ) : (
                            <span>Chưa nhập câu trả lời</span>
                          )}
                        </span>
                        <span>
                          Số từ: {(answers[currentQ.id] || '').trim().split(/\s+/).filter(Boolean).length} từ |{' '}
                          {(answers[currentQ.id] || '').length} ký tự
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Navigation Prev / Next Buttons */}
                <div className="velica-exam-footer">
                  <Button
                    disabled={isFirstQuestion}
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                    icon={<ChevronLeft size={16} />}
                    className="rounded-2 font-medium"
                  >
                    Câu trước
                  </Button>

                  <Space size="middle">
                    {!isLastQuestion ? (
                      <Button
                        type="primary"
                        onClick={() => setCurrentIndex((prev) => prev + 1)}
                        className="velica-btn-primary"
                      >
                        Câu tiếp theo <ChevronRight size={16} className="ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        onClick={() => setSubmitModalOpen(true)}
                        className="velica-btn-publish"
                      >
                        Xem lại & Nộp bài
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
            ) : null}
          </Col>

          {/* Right: Question Navigator Panel (Desktop: >= 992px) */}
          <Col xs={0} lg={8} className="d-none d-lg-block">
            <div className="velica-exam-nav-card">
              <div className="d-flex justify-between items-center mb-3">
                <span className="font-bold text-sm text-primary-color">
                  Danh sách câu hỏi
                </span>
                <span className="font-bold text-xs text-brand-color">
                  Đã làm {answeredCount} / {questions.length} câu
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <BsProgressBar
                  variant="success"
                  now={(answeredCount / (questions.length || 1)) * 100}
                  className="velica-progress-bar-sm"
                />
              </div>

              {/* Navigator Grid */}
              {renderQuestionGrid()}

              {/* Legend */}
              {renderLegend()}

              {/* Submit CTA in Panel */}
              <Button
                type="primary"
                block
                onClick={() => setSubmitModalOpen(true)}
                className="velica-btn-primary font-semibold"
              >
                Nộp bài thi ngay
              </Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Mobile Sticky Bottom Action Bar (< 992px) */}
      <div className="d-lg-none fixed-bottom bg-white border-top shadow-lg p-2 px-3 d-flex align-items-center justify-content-between z-1020">
        <BsButton
          variant="outline-primary"
          size="sm"
          onClick={() => setMobileNavOpen(true)}
          className="d-flex align-items-center gap-1 fw-bold"
        >
          <LayoutGrid size={16} /> Danh sách câu hỏi [{answeredCount}/{questions.length}]
        </BsButton>
        <BsButton
          variant="primary"
          size="sm"
          onClick={() => setSubmitModalOpen(true)}
          className="fw-bold px-3 velica-btn-publish"
        >
          Nộp bài thi
        </BsButton>
      </div>

      {/* React Bootstrap Offcanvas for Mobile Question Navigation */}
      <Offcanvas
        show={mobileNavOpen}
        onHide={() => setMobileNavOpen(false)}
        placement="bottom"
        className="velica-offcanvas-mobile"
      >
        <Offcanvas.Header closeButton className="border-bottom pb-2">
          <Offcanvas.Title className="fs-6 fw-bold text-dark d-flex align-items-center justify-content-between w-100 pe-3">
            <span>Danh mục câu hỏi thi</span>
            <BsBadge bg="primary">Đã làm {answeredCount}/{questions.length}</BsBadge>
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-3">
          <div className="mb-3">
            <div className="d-flex justify-content-between mb-1 text-xs text-muted-color font-semibold">
              <span>Tiến độ làm bài</span>
              <span>{Math.round((answeredCount / (questions.length || 1)) * 100)}%</span>
            </div>
            <BsProgressBar
              variant="success"
              now={(answeredCount / (questions.length || 1)) * 100}
              className="velica-progress-bar-sm"
            />
          </div>
          {renderQuestionGrid(() => setMobileNavOpen(false))}
          {renderLegend()}
          <BsButton
            variant="primary"
            className="w-100 fw-bold py-2 mt-2 velica-btn-primary"
            onClick={() => {
              setMobileNavOpen(false);
              setSubmitModalOpen(true);
            }}
          >
            Nộp bài kiểm tra ngay
          </BsButton>
        </Offcanvas.Body>
      </Offcanvas>

      {/* 3. Submit Confirmation Modal */}
      <Modal
        title="Xác nhận nộp bài kiểm tra?"
        open={submitModalOpen}
        onOk={handleConfirmSubmit}
        onCancel={() => setSubmitModalOpen(false)}
        okText="Xác nhận nộp bài"
        cancelText="Tiếp tục làm bài"
        okButtonProps={{ className: 'velica-btn-publish font-semibold' }}
      >
        <div className="mt-3">
          {unansweredCount > 0 ? (
            <div className="velica-alert-banner-amber mb-3">
              <AlertTriangle size={20} color="#D97706" />
              <span>
                Bạn còn <strong>{unansweredCount} câu chưa trả lời</strong>!
              </span>
            </div>
          ) : (
            <div className="velica-alert-banner-emerald mb-3">
              <CheckCircle2 size={20} color="#16A34A" />
              <span>Tuyệt vời! Bạn đã hoàn thành toàn bộ câu hỏi.</span>
            </div>
          )}

          <Paragraph className="text-sm text-secondary-color">
            Sau khi nộp bài, bạn sẽ không thể thay đổi đáp án. Kết quả trắc nghiệm sẽ được tính điểm tự động ngay lập tức.
          </Paragraph>
        </div>
      </Modal>

      {/* 4. Image Diagram Preview Modal */}
      <Modal
        open={Boolean(previewImage)}
        onCancel={() => setPreviewImage(null)}
        footer={null}
        width={800}
        title="Đồ hình / Sơ đồ đính kèm câu hỏi"
      >
        {previewImage && (
          <div className="text-center py-2">
            <img
              src={previewImage}
              alt="Sơ đồ chi tiết"
              className="w-100 rounded-2 border"
            />
          </div>
        )}
      </Modal>

      {/* 5. Rubric Guide Drawer for Essay */}
      <Drawer
        title="Tiêu chí đánh giá Rubric (Tự luận)"
        placement="right"
        width={480}
        open={rubricDrawerOpen}
        onClose={() => setRubricDrawerOpen(false)}
      >
        {currentRubric ? (
          <div>
            <div className="mb-3 text-xs text-muted-color">
              <strong className="text-primary-color">{currentRubric.title}</strong>
              <div className="mt-1">{currentRubric.description || 'Thang điểm và tiêu chí đánh giá chuẩn hóa cho bài làm tự luận.'}</div>
            </div>
            {currentRubric.criteria.map((crit, cIdx) => (
              <div key={crit.id} className="velica-exam-rubric-guide-card mb-3">
                <div className="d-flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-primary-color">
                    {cIdx + 1}. {crit.title}
                  </span>
                  <Tag color="blue" className="rounded-2 font-bold">
                    Tối đa {crit.maxPoints}đ
                  </Tag>
                </div>
                <div>
                  {crit.levels.map((lvl) => (
                    <div key={lvl.id} className="p-2 rounded bg-surface border mb-1">
                      <div className="d-flex justify-between items-center text-xs font-semibold mb-1">
                        <span className="text-brand-color">{lvl.label}</span>
                        <span className="text-secondary-color">{lvl.score}đ</span>
                      </div>
                      <div className="text-xs text-muted-color">{lvl.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-color text-xs">
            Chưa có cấu hình Rubric cho câu hỏi này
          </div>
        )}
      </Drawer>
    </div>
  );
};

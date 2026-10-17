import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Radio,
  Checkbox,
  Input,
  Tag,
  Modal,
  Space,
  Typography,
  message,
  Row,
  Col,
  Tooltip,
  Alert,
  Drawer,
  Timeline,
} from 'antd';
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
  Minimize2,
  Shield,
  Clock,
  Lock,
  ShieldAlert,
  Laptop,
  History,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { proctoringSocket } from '../../../api/services/proctoringSocketService';
import { Assessment, Question } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { TimerDisplay } from '../../../components/velica/TimerDisplay/TimerDisplay';
import { ConnectionIndicator } from '../../../components/velica/ConnectionIndicator/ConnectionIndicator';
import { QUESTION_TYPE, QuestionType } from '../../../constants/assessmentConstants';
import { MathRenderer } from '../../../components/velica/MathRenderer/MathRenderer';

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

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasStartedExam, setHasStartedExam] = useState(false);
  const [entryModalOpen, setEntryModalOpen] = useState(true);
  const [violationDrawerOpen, setViolationDrawerOpen] = useState(false);
  const [violationLogs, setViolationLogs] = useState<
    Array<{ id: string; type: 'TAB_SWITCH' | 'FULLSCREEN_EXIT'; timestamp: string; description: string }>
  >([]);
  const [isLatePeriod, setIsLatePeriod] = useState(false);

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [concurrentModalOpen, setConcurrentModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize assessment and questions
  useEffect(() => {
    const fetchExam = async () => {
      const [allAsm, sanitizedQuestions] = await Promise.all([
        mockService.getAssessments(),
        mockService.getQuestionsForExam(id || 'asm-1'),
      ]);
      const asm = allAsm.find((a) => a.id === id) || allAsm[0];
      setAssessment(asm);
      setQuestions(sanitizedQuestions);

      if (asm.timeLimitMinutes > 0) {
        let allocatedSeconds = asm.timeLimitMinutes * 60;
        if (asm.endTime) {
          const msUntilEnd = new Date(asm.endTime).getTime() - Date.now();
          if (msUntilEnd > 0) {
            const secondsUntilEnd = Math.floor(msUntilEnd / 1000);
            if (secondsUntilEnd < allocatedSeconds) {
              allocatedSeconds = secondsUntilEnd;
              message.warning(
                `Lưu ý: Bạn vào làm bài sát mốc đóng đề! Thời gian làm bài còn lại được giới hạn là ${Math.ceil(
                  secondsUntilEnd / 60
                )} phút (đến ${new Date(asm.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}).`
              );
            }
          }
        }
        setTimeRemainingSeconds(allocatedSeconds);
      }
    };
    fetchExam();
  }, [id]);

  // Fullscreen event listener & Proctoring Telemetry
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      const currentUser = mockService.getCurrentUser();

      if (!active && hasStartedExam && assessment?.requireFullscreen !== false) {
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        const logItem = {
          id: `v-fs-${Date.now()}`,
          type: 'FULLSCREEN_EXIT' as const,
          timestamp: timeStr,
          description: 'Thoát khỏi chế độ toàn màn hình (Full Screen Exit)',
        };
        setViolationLogs((prev) => [logItem, ...prev]);
        setViolationCount((prev) => {
          const next = prev + 1;
          message.error(`Cảnh báo: Bạn đã rời khỏi chế độ toàn màn hình! Lần vi phạm #${next}`);

          proctoringSocket.emit({
            type: 'FULLSCREEN_EXIT',
            assessmentId: id || 'asm-1',
            studentId: currentUser.id,
            studentName: currentUser.fullName,
            studentEmail: currentUser.email,
            timestamp: timeStr,
            payload: {
              violationCount: next,
              reason: 'Thoát chế độ toàn màn hình',
            },
          });

          return next;
        });
      } else if (active && hasStartedExam) {
        proctoringSocket.emit({
          type: 'FULLSCREEN_ENTER',
          assessmentId: id || 'asm-1',
          studentId: currentUser.id,
          studentName: currentUser.fullName,
          studentEmail: currentUser.email,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hasStartedExam, assessment?.requireFullscreen, id]);

  const handleStartExamFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch {
      message.info('Trình duyệt chưa cho phép toàn màn hình tự động, bạn có thể tiếp tục làm bài.');
    }
    setHasStartedExam(true);
    setEntryModalOpen(false);

    const currentUser = mockService.getCurrentUser();
    proctoringSocket.emit({
      type: 'STUDENT_JOIN',
      assessmentId: id || 'asm-1',
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      studentEmail: currentUser.email,
      timestamp: new Date().toLocaleTimeString('vi-VN'),
    });
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      message.info('Trình duyệt không hỗ trợ chuyển đổi toàn màn hình tự động.');
    }
  };

  // Multi-signal Anti-Cheat & Anti-Tamper System (Multi-Signal Focus, Anti-DevTools, DOM Guard, Heartbeat)
  useEffect(() => {
    if (!hasStartedExam || assessment?.enableProctoring === false) {
      return;
    }

    const currentUser = mockService.getCurrentUser();
    let isHandlingViolation = false;

    // Helper to register violation and broadcast to Teacher
    const triggerViolation = (
      type: 'TAB_SWITCH' | 'DEVTOOLS_DETECTED' | 'DOM_TAMPER_DETECTED',
      description: string
    ) => {
      if (isHandlingViolation) return;
      isHandlingViolation = true;
      setTimeout(() => {
        isHandlingViolation = false;
      }, 1200); // Debounce burst triggers

      const timeStr = new Date().toLocaleTimeString('vi-VN');
      const logItem = {
        id: `v-${type.toLowerCase()}-${Date.now()}`,
        type: type === 'TAB_SWITCH' ? ('TAB_SWITCH' as const) : ('FULLSCREEN_EXIT' as const),
        timestamp: timeStr,
        description,
      };
      setViolationLogs((prev) => [logItem, ...prev]);
      setViolationCount((prev) => {
        const next = prev + 1;
        message.error(`Cảnh báo vi phạm [#${next}]: ${description}`);

        proctoringSocket.emit({
          type,
          assessmentId: id || 'asm-1',
          studentId: currentUser.id,
          studentName: currentUser.fullName,
          studentEmail: currentUser.email,
          timestamp: timeStr,
          payload: {
            violationCount: next,
            reason: description,
          },
        });

        return next;
      });
    };

    // Dev mode toggle: Cho phép mở DevTools & Chuột phải phục vụ phát triển / debug
    const ALLOW_DEVTOOLS_IN_DEV = true;

    // 1. Multi-signal Focus Lost & Tab Switch detector
    const handleFocusCheck = () => {
      // Trong quá trình phát triển: cho phép click vào DevTools mà không bị coi là vi phạm mất tiêu điểm
      if (ALLOW_DEVTOOLS_IN_DEV) {
        if (document.hidden) {
          triggerViolation('TAB_SWITCH', 'Chuyển sang tab khác ngoài bài thi (Tab Switch)');
        }
        return;
      }

      const isHidden = document.hidden;
      const hasFocus = typeof document.hasFocus === 'function' ? document.hasFocus() : true;
      if (isHidden || !hasFocus) {
        triggerViolation('TAB_SWITCH', 'Mất tiêu điểm cửa sổ / Chuyển tab ngoài bài thi (Focus Lost)');
      }
    };

    // 2. Anti-DevTools & Inspection Keyboard Shortcuts Lockdown (Tạm thời bỏ qua nếu đang phát triển)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (ALLOW_DEVTOOLS_IN_DEV) return;

      // F12
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('DEVTOOLS_DETECTED', 'Phát hiện hành vi nhấn F12 mở Developer Tools');
        return false;
      }
      // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C (DevTools inspect)
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('DEVTOOLS_DETECTED', `Phát hiện tổ hợp phím can thiệp DevTools (Ctrl+Shift+${e.key.toUpperCase()})`);
        return false;
      }
      // Ctrl+U (View source)
      if (e.ctrlKey && ['U', 'u'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        triggerViolation('DEVTOOLS_DETECTED', 'Phát hiện hành vi xem mã nguồn trang (Ctrl+U)');
        return false;
      }
    };

    // 3. Block Right-Click Context Menu (Inspect Element)
    const handleContextMenu = (e: MouseEvent) => {
      if (ALLOW_DEVTOOLS_IN_DEV) return;
      e.preventDefault();
      message.warning('Chuột phải và menu kiểm tra phần tử đã bị vô hiệu hóa trong phòng thi.');
      return false;
    };

    // 4. DevTools Docking / Resize Anomaly Detection
    const devToolsCheckInterval = setInterval(() => {
      if (ALLOW_DEVTOOLS_IN_DEV) return;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      if (widthDiff > 160 || heightDiff > 160) {
        triggerViolation(
          'DEVTOOLS_DETECTED',
          'Phát hiện kích thước cửa sổ bất thường (Nghi vấn DevTools đang được mở song song)'
        );
      }
    }, 2500);

    // 5. Periodic Heartbeat to Server (Zero-Trust Watchdog)
    // If student pauses script in debugger or blocks network, Server detects missing heartbeat!
    let heartbeatSeq = 0;
    const heartbeatInterval = setInterval(() => {
      heartbeatSeq += 1;
      proctoringSocket.emit({
        type: 'HEARTBEAT',
        assessmentId: id || 'asm-1',
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        studentEmail: currentUser.email,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
        payload: {
          seq: heartbeatSeq,
          isFullscreen: Boolean(document.fullscreenElement),
          hasFocus: typeof document.hasFocus === 'function' ? document.hasFocus() : true,
          answersCount: Object.keys(answers).length,
        },
      });
    }, 5000);

    document.addEventListener('visibilitychange', handleFocusCheck);
    window.addEventListener('blur', handleFocusCheck);
    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleFocusCheck);
      window.removeEventListener('blur', handleFocusCheck);
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      clearInterval(devToolsCheckInterval);
      clearInterval(heartbeatInterval);
    };
  }, [hasStartedExam, assessment?.enableProctoring, id, answers]);

  // Listen for real-time remote commands from Teacher (Force Submit)
  useEffect(() => {
    const handleRemoteEvent = (event: any) => {
      const currentUser = mockService.getCurrentUser();
      if (event.type === 'FORCE_SUBMIT') {
        if (!event.payload?.targetStudentId || event.payload?.targetStudentId === currentUser.id) {
          message.error({
            content: 'Giám thị đã thực hiện lệnh thu bài thi cưỡng chế!',
            duration: 6,
          });
          handleConfirmSubmit();
        }
      }
    };

    proctoringSocket.on('*', handleRemoteEvent);
    return () => proctoringSocket.off('*', handleRemoteEvent);
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

  const handleManualSave = () => {
    try {
      localStorage.setItem(`exam_cache_${id}`, JSON.stringify(answers));
      setSaveStatus('SAVING');
      setTimeout(() => {
        setSaveStatus('SAVED');
        message.success('Đã lưu bài làm thành công! Toàn bộ câu trả lời đã được đồng bộ.');
      }, 300);
    } catch {
      message.warning('Không thể lưu cục bộ, vui lòng kiểm tra bộ nhớ trình duyệt.');
    }
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



  const currentQ = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const isFirstQuestion = currentIndex === 0;

  // Question answering status
  const answeredCount = questions.filter(
    (q) => Boolean(answers[q.id]?.trim())
  ).length;
  const unansweredCount = Math.max(0, questions.length - answeredCount);

  const handleConfirmSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitModalOpen(false);
    message.loading({ content: 'Đang xử lý nộp bài và đồng bộ câu trả lời...', key: 'submit-action' });

    try {
      const currentUser = mockService.getCurrentUser();

      // Submit directly to server-side evaluation (tamper-proof)
      await mockService.submitExam({
        assessmentId: id || 'asm-1',
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        answers,
        violationCount,
        isLate: isLatePeriod,
      });

      // Clear local cache after successful submission
      try {
        localStorage.removeItem(`exam_cache_${id}`);
      } catch {}

      setTimeout(() => {
        message.success({ content: 'Nộp bài kiểm tra thành công!', key: 'submit-action' });
        navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_SUBMISSION.replace(':id', id || 'asm-1'));
      }, 400);
    } catch {
      setIsSubmitting(false);
      message.error({ content: 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại!', key: 'submit-action' });
    }
  };

  const handleToggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
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
        return 'Tự luận';
      default:
        return 'Câu hỏi';
    }
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
            {/* Fullscreen Button */}
            <Tooltip title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Bật toàn màn hình'}>
              <Button
                size="small"
                type={isFullscreen ? 'default' : 'primary'}
                danger={!isFullscreen}
                icon={isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                onClick={handleToggleFullscreen}
                className="d-inline-flex items-center gap-1 font-semibold"
              >
                {isFullscreen ? 'Đang toàn màn hình' : 'Toàn màn hình'}
              </Button>
            </Tooltip>

            {/* Proctoring Status Tag & History Drawer Opener */}
            {assessment?.enableProctoring !== false && (
              <Tooltip title="Nhấn để xem Lịch sử nhật ký giám sát chuyển tab & vi phạm phòng thi">
                <Button
                  size="small"
                  type={violationCount > 0 ? 'default' : 'dashed'}
                  danger={violationCount > 0}
                  icon={<History size={13} />}
                  onClick={() => setViolationDrawerOpen(true)}
                  className="d-inline-flex items-center gap-1"
                >
                  Nhật ký vi phạm ({violationCount}/{assessment?.maxViolationsAllowed || 3})
                </Button>
              </Tooltip>
            )}

            {/* Real-time WebSocket Telemetry Active Badge */}
            <div className="velica-ws-live-badge d-none d-xl-inline-flex">
              <span className="velica-ws-pulsing-dot" />
              <span>Live WebSocket</span>
            </div>

            {/* Single Exam Session Lock Indicator */}
            <Tooltip title="Nhấn để xem Cơ chế Khóa phiên thi độc quyền & Mô phỏng bảo vệ chống đăng nhập song song từ máy khác">
              <Tag
                color="purple"
                className="d-none d-lg-inline-flex items-center gap-1 m-0 cursor-pointer"
                onClick={() => setConcurrentModalOpen(true)}
              >
                <Lock size={12} /> Khóa phiên độc quyền (#SES-8821)
              </Tag>
            </Tooltip>

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

            {/* Manual Save Button */}
            <BsButton
              variant="outline-secondary"
              size="sm"
              onClick={handleManualSave}
              className="d-none d-sm-inline-flex align-items-center gap-1 bg-white text-dark border px-2 py-1 text-xs fw-semibold"
            >
              <Save size={13} /> Lưu bài làm
            </BsButton>

            {/* Connection Indicator */}
            <div className="d-none d-sm-block">
              <ConnectionIndicator status={connectionStatus} />
            </div>

            {/* Assessment Countdown Timer */}
            <div className="d-flex items-center gap-1">
              {isLatePeriod && (
                <Tag color="error" className="font-bold m-0 animate-pulse">
                  NỘP MUỘN
                </Tag>
              )}
              <TimerDisplay totalSeconds={timeRemainingSeconds} size="md" />
            </div>

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
        {/* Late submission grace period warning alert */}
        {isLatePeriod && (
          <div className="p-3 mb-3 bg-amber-50 border border-amber-300 rounded-3 text-amber-900 d-flex items-center justify-between flex-wrap gap-2 animate-fade-in">
            <div className="d-flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
              <div>
                <strong className="text-sm d-block">
                  Đang trong thời gian ân hạn nộp muộn!
                </strong>
                <span className="text-xs">
                  Thời gian làm bài chính thức đã kết thúc. Bài nộp bây giờ sẽ tự động trừ {assessment?.latePolicy?.penaltyPercent || 10}% tổng số điểm. Vui lòng khẩn trương hoàn thành và nộp bài trước khi thời gian ân hạn kết thúc.
                </span>
              </div>
            </div>
            <BsButton
              variant="warning"
              size="sm"
              onClick={() => setSubmitModalOpen(true)}
              className="fw-bold px-3"
            >
              Nộp bài ngay
            </BsButton>
          </div>
        )}

        {/* Require fullscreen warning alert */}
        {assessment?.requireFullscreen && !isFullscreen && (
          <div className="p-2 px-3 mb-3 bg-rose-50 border border-rose-300 rounded-2 text-rose-900 d-flex items-center justify-between flex-wrap gap-2 animate-fade-in">
            <div className="d-flex items-center gap-2 text-xs">
              <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
              <span>
                <strong>Quy chế thi:</strong> Đề thi này yêu cầu làm bài ở chế độ toàn màn hình (Fullscreen). Vui lòng không thoát toàn màn hình để tránh bị ghi nhận vi phạm!
              </span>
            </div>
            <Button
              size="small"
              type="primary"
              danger
              icon={<Maximize2 size={12} />}
              onClick={handleToggleFullscreen}
            >
              Bật Toàn Màn Hình
            </Button>
          </div>
        )}

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
                    <MathRenderer content={currentQ.content} />
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
                                <MathRenderer content={opt.text} />
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
                                <MathRenderer content={opt.text} />
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

                  {/* 5. Essay Question (ESSAY) - Online Text submission */}
                  {currentQ.type === QUESTION_TYPE.ESSAY && (
                    <div className="velica-exam-essay-container">
                      <div className="mb-2 text-xs font-semibold text-secondary-color">
                        Soạn thảo câu trả lời tự luận trực tiếp vào khung bên dưới:
                      </div>

                      <Input.TextArea
                        rows={10}
                        autoSize={{ minRows: 8, maxRows: 22 }}
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                        placeholder="Nhập nội dung bài làm tự luận của bạn tại đây. Hệ thống tự động lưu bài làm và bảo toàn định dạng xuống dòng..."
                        className="velica-exam-essay-input"
                      />

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
                    <Button
                      icon={<Save size={14} />}
                      onClick={handleManualSave}
                      className="rounded-2 font-medium"
                    >
                      Lưu bài làm
                    </Button>
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
        confirmLoading={isSubmitting}
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

      {/* 5. Concurrent Exam Session Lock & Anti-Proxy Protection Modal */}
      <Modal
        title={
          <div className="d-flex items-center gap-2 text-brand-color">
            <ShieldAlert size={20} />
            <span className="fw-bold">Cơ Chế Bảo Vệ Phiên Thi Độc Quyền (Single Active Session)</span>
          </div>
        }
        open={concurrentModalOpen}
        onCancel={() => setConcurrentModalOpen(false)}
        footer={[
          <Button
            key="simulate"
            danger
            icon={<AlertTriangle size={14} />}
            onClick={() => {
              message.error(
                'Mô phỏng phát hiện: Máy B (IP 118.69.182.10 - Đà Nẵng) vừa cố gắng đăng nhập. Hệ thống đã CHẶN máy B và ghi nhận vi phạm gửi tới Giám thị!'
              );
            }}
          >
            Mô phỏng phát hiện Máy B đăng nhập
          </Button>,
          <Button
            key="close"
            type="primary"
            onClick={() => setConcurrentModalOpen(false)}
            className="velica-btn-primary"
          >
            Tôi hiểu & Tiếp tục làm bài
          </Button>,
        ]}
        width={620}
      >
        <div className="py-2">
          <Alert
            message="Thiết bị này đang nắm giữ Session Token độc quyền"
            description={
              <div>
                Bài thi của bạn đang được gắn chặt với ID Thiết bị: <span className="font-mono fw-semibold">DEV-WIN11-VK01</span> (IP: <span className="font-mono">14.161.22.45</span>).
              </div>
            }
            type="success"
            showIcon
            className="mb-3 rounded-2"
          />

          <div className="fw-bold text-sm text-dark mb-2">Quy chế & Cơ chế Chống Gian lận / Thi hộ Velica:</div>
          <ul className="text-xs text-secondary-color pl-3 leading-relaxed mb-3">
            <li className="mb-1.5">
              <strong>Chặn đăng nhập đồng thời:</strong> Khi đang làm bài trên máy này, nếu có ai đó đăng nhập trên máy khác và truy cập vào bài thi, hệ thống sẽ <strong>lập tức chặn máy thứ hai</strong> và báo động đỏ đến Giám thị.
            </li>
            <li className="mb-1.5">
              <strong>Xử lý sự cố kỹ thuật (Đổi máy):</strong> Trong trường hợp máy này bị sự cố phần cứng đột ngột (sập nguồn, hỏng máy), bạn phải đăng nhập trên máy mới và bấm <em>"Yêu cầu đổi thiết bị do sự cố"</em> để Giám thị xác nhận khôi phục bài làm, đồng thời vô hiệu hóa máy cũ.
            </li>
            <li>
              <strong>Chống làm bài hộ từ xa (Remote Control):</strong> Hệ thống liên tục quét phát hiện các phần mềm điều khiển từ xa (AnyDesk, TeamViewer, RDP) để ngăn chặn hành vi thi hộ.
            </li>
          </ul>
        </div>
      </Modal>

      {/* 6. Entry Modal: Bắt buộc vào chế độ Toàn Màn Hình trước khi bắt đầu làm bài */}
      <Modal
        title={
          <div className="d-flex align-items-center gap-2 text-primary">
            <Maximize2 size={20} />
            <span className="fw-bold">Chuẩn Bị Vào Phòng Thi & Quy Định Khảo Thí</span>
          </div>
        }
        open={entryModalOpen}
        closable={false}
        maskClosable={false}
        footer={[
          <Button
            key="start"
            type="primary"
            size="large"
            icon={<Maximize2 size={16} />}
            onClick={handleStartExamFullscreen}
            className="velica-btn-primary w-100"
          >
            Bật Toàn Màn Hình & Bắt Đầu Làm Bài
          </Button>,
        ]}
        width={560}
      >
        <div className="py-2">
          <Alert
            message="Chế độ Giám sát Trực tuyến Velica Proctoring đang kích hoạt"
            description="Bài thi yêu cầu chế độ Toàn màn hình (Full Screen) liên tục và giám sát chuyển tab."
            type="info"
            showIcon
            className="mb-3"
          />
          <div className="fw-semibold text-dark mb-2">Quy chế phòng thi bắt buộc:</div>
          <ul className="text-sm text-secondary ps-3 mb-3">
            <li className="mb-1">
              <strong>Toàn màn hình:</strong> Không được thoát khỏi chế độ toàn màn hình trong suốt thời gian làm bài.
            </li>
            <li className="mb-1">
              <strong>Không chuyển tab:</strong> Hành vi mở tab mới, chuyển cửa sổ hoặc mở ứng dụng khác sẽ được ghi lại chi tiết vào <strong>Nhật ký vi phạm</strong> và gửi thời gian thực tới Giám thị.
            </li>
            <li>
              <strong>Cưỡng chế nộp bài:</strong> Nếu số lần vi phạm vượt quá {assessment?.maxViolationsAllowed || 3} lần, Giám thị có thể thực hiện lệnh <em>Thu bài cưỡng chế</em> ngay lập tức.
            </li>
          </ul>
        </div>
      </Modal>

      {/* 7. Fullscreen Lock Warning Overlay (Hiển thị khi đang làm bài mà bị thoát toàn màn hình) */}
      {hasStartedExam && !isFullscreen && assessment?.requireFullscreen !== false && (
        <div className="velica-fullscreen-lock-overlay">
          <div className="velica-fullscreen-lock-card">
            <div className="d-flex justify-content-center mb-3">
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#dc2626',
                }}
              >
                <AlertTriangle size={36} />
              </div>
            </div>
            <Title level={4} className="text-danger mb-2">
              Cảnh Báo: Bạn Đã Thoát Toàn Màn Hình!
            </Title>
            <Paragraph className="text-secondary text-sm mb-4">
              Bài thi yêu cầu phải luôn ở chế độ Toàn Màn Hình. Hành vi này đã được ghi vào <strong>Nhật ký vi phạm phòng thi</strong> (Vi phạm lần thứ #{violationCount}) và đồng bộ theo thời gian thực tới Giám thị phòng thi qua WebSocket.
            </Paragraph>
            <Button
              type="primary"
              danger
              size="large"
              icon={<Maximize2 size={18} />}
              onClick={handleToggleFullscreen}
              className="w-100 fw-bold py-2"
              style={{ height: 'auto' }}
            >
              Quay Lại Chế Độ Toàn Màn Hình Ngay
            </Button>
          </div>
        </div>
      )}

      {/* 8. Violation Logs Drawer (Xem chi tiết nhật ký giám sát chuyển tab & toàn màn hình) */}
      <Drawer
        title={
          <div className="d-flex align-items-center gap-2">
            <History size={18} className="text-danger" />
            <span className="fw-bold">Nhật Ký Giám Sát & Vi Phạm Phòng Thi</span>
            <Tag color={violationCount > 0 ? 'red' : 'green'} className="ms-auto">
              {violationCount} Vi phạm
            </Tag>
          </div>
        }
        placement="right"
        width={420}
        onClose={() => setViolationDrawerOpen(false)}
        open={violationDrawerOpen}
      >
        <div className="mb-3">
          <Alert
            message="Kênh giám sát Real-time WebSocket đang kết nối"
            description="Mỗi hành động chuyển tab, mở cửa sổ khác hoặc thoát toàn màn hình đều được đóng gói dữ liệu và truyền trực tiếp về màn hình Giám thị."
            type={violationCount > 0 ? 'warning' : 'success'}
            showIcon
            className="text-xs"
          />
        </div>

        {violationLogs.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <CheckCircle2 size={48} className="text-success mb-2" />
            <div className="fw-semibold">Chưa ghi nhận vi phạm nào</div>
            <div className="text-xs">Bạn đang tuân thủ rất tốt quy chế thi.</div>
          </div>
        ) : (
          <Timeline
            className="mt-3"
            items={violationLogs.map((log) => ({
              color: log.type === 'FULLSCREEN_EXIT' ? 'red' : 'orange',
              children: (
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <Tag color={log.type === 'FULLSCREEN_EXIT' ? 'error' : 'warning'}>
                      {log.type === 'FULLSCREEN_EXIT' ? 'Thoát Toàn Màn Hình' : 'Chuyển Tab / Cửa Sổ'}
                    </Tag>
                    <span className="font-monospace text-xs text-muted">{log.timestamp}</span>
                  </div>
                  <div className="text-xs text-dark">{log.description}</div>
                  <div className="text-xs text-muted mt-1 fst-italic">
                    Dữ liệu đã truyền qua WebSocket tới Proctoring Console
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </Drawer>

    </div>
  );
};

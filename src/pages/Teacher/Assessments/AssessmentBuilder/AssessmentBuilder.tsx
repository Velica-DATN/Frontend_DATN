import React, { useState, useEffect } from 'react';
import {
  Steps,
  Button,
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Switch,
  Space,
  Typography,
  Table,
  Tag,
  Divider,
  Alert,
  message,
  Row,
  Col,
  Tooltip,
  Drawer,
  Pagination,
  Badge,
  Progress,
  Modal,
  Segmented,
  Dropdown,
  Popconfirm,
} from 'antd';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Lock,
  Plus,
  Trash2,
  FileCheck2,
  Sliders,
  Shield,
  Layers,
  Calculator,
  Image as ImageIcon,
  Eye,
  Search,
  Filter,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  BarChart2,
  Maximize2,
  Clock,
  RotateCcw,
  CheckSquare,
  HelpCircle,
  CheckCheck,
  Dice5,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Scale,
  BookOpen,
  Lightbulb,
  Award,
  ClipboardList,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../../api/mocks/mockService';
import {
  Assessment,
  ClassRoom,
  Question,
  Syllabus,
} from '../../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../../router/constants/routePaths';
import {
  ASSESSMENT_STATUS,
  ASSESSMENT_TYPE,
  QUESTION_TYPE,
} from '../../../../constants/assessmentConstants';
import { MathRenderer } from '../../../../components/velica/MathRenderer/MathRenderer';
import {
  RandomExamGeneratorModal,
  GeneratedExamResult,
} from '../../../../components/velica/RandomExamGenerator/RandomExamGeneratorModal';

const { Title, Text, Paragraph } = Typography;

export const AssessmentBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryClassId = searchParams.get('classId');

  const [currentStep, setCurrentStep] = useState(0);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [questionScores, setQuestionScores] = useState<Record<string, number>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  // Step 2 Question Bank Filters & Pagination
  const [bankSearch, setBankSearch] = useState('');
  const [bankDifficultyFilter, setBankDifficultyFilter] = useState<string>('ALL');
  const [bankTypeFilter, setBankTypeFilter] = useState<string>('ALL');
  const [bankCloFilter, setBankCloFilter] = useState<string>('ALL');
  const [bankStatusFilter, setBankStatusFilter] = useState<'ALL' | 'UNSELECTED' | 'SELECTED'>('ALL');
  const [bankPage, setBankPage] = useState(1);
  const bankPageSize = 5;

  // Selected questions filters & pagination
  const [selectedSearch, setSelectedSearch] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [selectedPage, setSelectedPage] = useState(1);
  const selectedPageSize = 5;

  // Matrix stats summary expansion
  const [showMatrixSummary, setShowMatrixSummary] = useState(false);
  const [randomGeneratorOpen, setRandomGeneratorOpen] = useState(false);

  // Step 2 View Mode Switcher: 'LIST' (Focus on questions in exam), 'TWO_COLUMNS' (Bank + Exam), 'PREVIEW' (Full academic paper view)
  const [viewMode, setViewMode] = useState<'LIST' | 'TWO_COLUMNS' | 'PREVIEW'>('LIST');
  const [showAnswersInList, setShowAnswersInList] = useState(true);
  const [showAnswersInPreview, setShowAnswersInPreview] = useState(true);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);

  const [form] = Form.useForm();
  const targetMaxScore = Form.useWatch('maxScore', form) || 10;
  const watchedSubmissionMode = Form.useWatch('submissionMode', form) || 'ONLINE_TEXT';
  const watchedLatePolicyEnabled = Form.useWatch('latePolicyEnabled', form) ?? true;
  const watchedType = Form.useWatch('type', form);

  // Helper to map question to CLO
  const getQuestionClo = (q: Question) => {
    if (q.cloId) return q.cloId;
    if (q.lessonId === 'les-1') return 'CLO1';
    if (q.lessonId === 'les-2') return 'CLO2';
    if (q.lessonId === 'les-3') return 'CLO3';
    return 'CLO1';
  };

  useEffect(() => {
    const init = async () => {
      const [clsList, sylList, qList, allAsm] = await Promise.all([
        mockService.getClasses(),
        mockService.getSyllabi(),
        mockService.getQuestions(),
        mockService.getAssessments(),
      ]);
      setClasses(clsList);
      setSyllabi(sylList);
      setBankQuestions(qList);

      if (id) {
        const found = allAsm.find((a) => a.id === id);
        if (found) {
          setIsLocked(found.status === ASSESSMENT_STATUS.PUBLISHED);
          form.setFieldsValue({
            title: found.title,
            classId: found.classId,
            type: found.type,
            weight: found.weight,
            instructions: found.instructions,
            description: found.description,
            maxScore: found.maxScore || 10,
            scoreScale: found.scoreScale || 10,
            timeLimitMinutes: found.timeLimitMinutes || 45,
            maxAttempts: found.maxAttempts || 1,
            shuffleQuestions: found.shuffleQuestions ?? true,
            shuffleAnswers: found.shuffleAnswers ?? true,
            allowBackNavigation: found.allowBackNavigation ?? true,
            submissionMode: found.submissionMode || 'ONLINE_TEXT',
            allowedFileExtensions: found.allowedFileExtensions || ['.pdf', '.docx', '.zip'],
            maxFileSizeMB: found.maxFileSizeMB || 25,
            requireFullscreen: found.requireFullscreen ?? false,
            enableProctoring: found.enableProctoring ?? true,
            maxViolationsAllowed: found.maxViolationsAllowed || 3,
            latePolicyEnabled: found.latePolicy?.enabled ?? true,
            latePenaltyPercent: found.latePolicy?.penaltyPercent ?? 10,
            lateDeadlineMinutesAfter: found.latePolicy?.deadlineMinutesAfter ?? 15,
            cloMappings: found.cloMappings || [
              { cloId: 'clo-1', weightPercent: 50 },
              { cloId: 'clo-2', weightPercent: 50 },
            ],
          });

          // Populate selected questions
          const matched = qList.filter((q) => found.questionIds?.includes(q.id));
          const initialPicked = matched.length > 0 ? matched : qList.slice(0, 4);
          setSelectedQuestions(initialPicked);

          // Setup initial question scores
          const scores: Record<string, number> = {};
          initialPicked.forEach((q) => {
            scores[q.id] = q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.5;
          });
          setQuestionScores(scores);
        }
      } else {
        // Defaults for new assessment
        form.setFieldsValue({
          title: '',
          type: ASSESSMENT_TYPE.MIDTERM,
          weight: 30,
          maxScore: 10,
          scoreScale: 10,
          timeLimitMinutes: 45,
          maxAttempts: 1,
          shuffleQuestions: true,
          shuffleAnswers: true,
          allowBackNavigation: true,
          submissionMode: 'ONLINE_TEXT',
          allowedFileExtensions: ['.pdf', '.docx', '.zip'],
          maxFileSizeMB: 25,
          requireFullscreen: false,
          enableProctoring: true,
          maxViolationsAllowed: 3,
          latePolicyEnabled: true,
          latePenaltyPercent: 10,
          lateDeadlineMinutesAfter: 15,
          classId: queryClassId || clsList[0]?.id,
          cloMappings: [
            { cloId: 'clo-1', weightPercent: 50 },
            { cloId: 'clo-2', weightPercent: 50 },
          ],
        });
        // Check if prefilled from Random Exam Generator
        let prefilledLoaded = false;
        try {
          const prefillRaw = localStorage.getItem('velica_builder_prefill');
          if (prefillRaw) {
            const prefill = JSON.parse(prefillRaw);
            localStorage.removeItem('velica_builder_prefill');
            if (prefill.questions && prefill.questions.length > 0) {
              setSelectedQuestions(prefill.questions);
              if (prefill.scores) setQuestionScores(prefill.scores);
              prefilledLoaded = true;
              message.success(`Đã tự động nạp ${prefill.questions.length} câu hỏi từ bộ đề thi ngẫu nhiên vừa sinh!`);
            }
          }
        } catch {
          // ignore
        }

        if (!prefilledLoaded) {
          const initialPicked = qList.slice(0, 4);
          setSelectedQuestions(initialPicked);
          const scores: Record<string, number> = {};
          initialPicked.forEach((q) => {
            scores[q.id] = q.type === QUESTION_TYPE.ESSAY ? 4.0 : 2.0;
          });
          setQuestionScores(scores);
        }
      }
    };
    init();
  }, [id, form, queryClassId]);

  // Handle Type Change Defaults (e.g., Homework should relax security)
  useEffect(() => {
    if (watchedType === ASSESSMENT_TYPE.HOMEWORK) {
      // Relax proctoring and fullscreen for homework
      const cur = form.getFieldsValue();
      if (cur.enableProctoring !== false || cur.requireFullscreen) {
        form.setFieldsValue({
          enableProctoring: false,
          requireFullscreen: false,
          timeLimitMinutes: 0, // No countdown limit for homework
        });
      }
    }
  }, [watchedType, form]);

  // Compute total allocated points from individual questions
  const totalAllocatedScore = selectedQuestions.reduce((acc, q) => {
    return acc + (questionScores[q.id] || (q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0));
  }, 0);

  // Question Bank filtering
  const filteredBankQuestions = bankQuestions.filter((q) => {
    if (bankSearch.trim()) {
      const s = bankSearch.toLowerCase();
      const matchContent = q.content.toLowerCase().includes(s);
      const matchLesson = (q.lessonTitle || '').toLowerCase().includes(s);
      if (!matchContent && !matchLesson) return false;
    }
    if (bankDifficultyFilter !== 'ALL' && q.difficulty !== bankDifficultyFilter) {
      return false;
    }
    if (bankTypeFilter !== 'ALL' && q.type !== bankTypeFilter) {
      return false;
    }
    if (bankCloFilter !== 'ALL' && getQuestionClo(q) !== bankCloFilter) {
      return false;
    }
    const isSelected = selectedQuestions.some((item) => item.id === q.id);
    if (bankStatusFilter === 'UNSELECTED' && isSelected) return false;
    if (bankStatusFilter === 'SELECTED' && !isSelected) return false;
    return true;
  });

  const paginatedBankQuestions = filteredBankQuestions.slice(
    (bankPage - 1) * bankPageSize,
    bankPage * bankPageSize
  );

  // Selected questions filtering
  const filteredSelectedQuestions = selectedQuestions.filter((q) => {
    if (selectedSearch.trim()) {
      const s = selectedSearch.toLowerCase();
      if (!q.content.toLowerCase().includes(s)) return false;
    }
    if (selectedTypeFilter !== 'ALL' && q.type !== selectedTypeFilter) {
      return false;
    }
    return true;
  });

  const paginatedSelectedQuestions = filteredSelectedQuestions.slice(
    (selectedPage - 1) * selectedPageSize,
    selectedPage * selectedPageSize
  );

  // Matrix metrics
  const difficultyMatrix = {
    EASY: selectedQuestions.filter((q) => q.difficulty === 'EASY').length,
    MEDIUM: selectedQuestions.filter((q) => q.difficulty === 'MEDIUM').length,
    HARD: selectedQuestions.filter((q) => q.difficulty === 'HARD').length,
    VERY_HARD: selectedQuestions.filter((q) => q.difficulty === 'VERY_HARD').length,
  };

  const typeMatrix = {
    MCQ: selectedQuestions.filter((q) => q.type === QUESTION_TYPE.MCQ).length,
    MULTI_CHOICE: selectedQuestions.filter((q) => q.type === QUESTION_TYPE.MULTI_CHOICE).length,
    TRUE_FALSE: selectedQuestions.filter((q) => q.type === QUESTION_TYPE.TRUE_FALSE).length,
    FILL_BLANK: selectedQuestions.filter((q) => q.type === QUESTION_TYPE.FILL_BLANK).length,
    ESSAY: selectedQuestions.filter((q) => q.type === QUESTION_TYPE.ESSAY).length,
  };

  const cloMatrix = {
    CLO1: selectedQuestions.filter((q) => getQuestionClo(q) === 'CLO1').length,
    CLO2: selectedQuestions.filter((q) => getQuestionClo(q) === 'CLO2').length,
    CLO3: selectedQuestions.filter((q) => getQuestionClo(q) === 'CLO3').length,
  };

  const handleNext = async () => {
    try {
      await form.validateFields();
      if (currentStep === 1 && selectedQuestions.length === 0) {
        message.error('Vui lòng chọn ít nhất 1 câu hỏi vào đề thi!');
        return;
      }
      setCurrentStep((prev) => prev + 1);
    } catch {
      // validation error in current step
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  // Quick action: Chia đều điểm cho các câu hỏi
  const handleEqualizeScores = () => {
    if (selectedQuestions.length === 0) return;
    const equalVal = Number((targetMaxScore / selectedQuestions.length).toFixed(2));
    const newScores: Record<string, number> = {};
    selectedQuestions.forEach((q) => {
      newScores[q.id] = equalVal;
    });
    setQuestionScores(newScores);
    message.success(`Đã phân bổ đều ${equalVal} điểm cho mỗi câu hỏi.`);
  };

  // Quick action: Gán điểm theo chuẩn (Trắc nghiệm 1đ, Tự luận 4đ)
  const handleStandardScoreAllocation = () => {
    const newScores: Record<string, number> = {};
    selectedQuestions.forEach((q) => {
      newScores[q.id] = q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0;
    });
    setQuestionScores(newScores);
    message.success('Đã áp dụng định mức chuẩn: Trắc nghiệm 1.0đ, Tự luận 4.0đ.');
  };

  // Quick action: Quy chuẩn tổng điểm về 10đ hoặc 100đ theo tỷ lệ hiện tại
  const handleScaleScoreProportionally = (target: number) => {
    if (selectedQuestions.length === 0) return;
    const currentTotal = selectedQuestions.reduce((sum, q) => sum + (questionScores[q.id] || 1), 0);
    if (currentTotal <= 0) return;
    const ratio = target / currentTotal;
    const nextScores: Record<string, number> = {};
    let allocated = 0;
    selectedQuestions.forEach((q, i) => {
      if (i === selectedQuestions.length - 1) {
        nextScores[q.id] = Number((target - allocated).toFixed(2));
      } else {
        const val = Number(((questionScores[q.id] || 1) * ratio).toFixed(2));
        nextScores[q.id] = val;
        allocated += val;
      }
    });
    setQuestionScores(nextScores);
    message.success(`Đã quy chuẩn tổng điểm đề thi về chính xác ${target} điểm.`);
  };

  // Quick action: Đổi câu hỏi ngẫu nhiên trong đề với câu khác trong ngân hàng cùng CLO / Độ khó
  const handleRerollQuestion = (index: number) => {
    if (isLocked) {
      message.warning('Đề thi đã xuất bản, không thể thay đổi!');
      return;
    }
    const targetQ = selectedQuestions[index];
    const targetClo = getQuestionClo(targetQ);
    const existingIds = new Set(selectedQuestions.map((q) => q.id));

    let candidates = bankQuestions.filter(
      (q) => !existingIds.has(q.id) && getQuestionClo(q) === targetClo && q.difficulty === targetQ.difficulty
    );
    if (candidates.length === 0) {
      candidates = bankQuestions.filter((q) => !existingIds.has(q.id) && q.difficulty === targetQ.difficulty);
    }
    if (candidates.length === 0) {
      candidates = bankQuestions.filter((q) => !existingIds.has(q.id) && getQuestionClo(q) === targetClo);
    }
    if (candidates.length === 0) {
      candidates = bankQuestions.filter((q) => !existingIds.has(q.id));
    }

    if (candidates.length === 0) {
      message.warning('Không còn câu hỏi thay thế nào khác trong ngân hàng phù hợp.');
      return;
    }

    const replacement = candidates[Math.floor(Math.random() * candidates.length)];
    const updated = [...selectedQuestions];
    updated[index] = replacement;
    setSelectedQuestions(updated);

    // Keep point value
    setQuestionScores((prev) => {
      const next = { ...prev };
      const score = prev[targetQ.id] || (targetQ.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0);
      next[replacement.id] = score;
      delete next[targetQ.id];
      return next;
    });

    message.success(`Đã đổi câu #${index + 1} sang câu hỏi mới từ ngân hàng!`);
  };

  const handleAutoGenerateQuestions = () => {
    const shuffled = [...bankQuestions].sort(() => 0.5 - Math.random());
    const count = 5;
    const picked = shuffled.slice(0, count);
    setSelectedQuestions(picked);

    const scores: Record<string, number> = {};
    picked.forEach((q) => {
      scores[q.id] = q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.5;
    });
    setQuestionScores(scores);
    message.success(`Đã tự động chọn ${picked.length} câu hỏi theo ma trận Bloom & CLO.`);
  };

  const handleRemoveAllSelected = () => {
    if (isLocked) {
      message.warning('Đề thi đã xuất bản, không thể thay đổi!');
      return;
    }
    setSelectedQuestions([]);
    setQuestionScores({});
    message.info('Đã gỡ toàn bộ câu hỏi khỏi đề thi.');
  };

  const handleSelectAllCurrentPage = () => {
    if (isLocked) return;
    const newItems = paginatedBankQuestions.filter(
      (bq) => !selectedQuestions.some((sq) => sq.id === bq.id)
    );
    if (newItems.length === 0) {
      message.info('Tất cả câu hỏi trong trang này đã có trong đề thi.');
      return;
    }
    setSelectedQuestions((prev) => [...prev, ...newItems]);
    const nextScores = { ...questionScores };
    newItems.forEach((q) => {
      nextScores[q.id] = q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.5;
    });
    setQuestionScores(nextScores);
    message.success(`Đã thêm ${newItems.length} câu hỏi từ trang hiện tại vào đề.`);
  };

  const handleDeselectAllCurrentPage = () => {
    if (isLocked) return;
    const pageIds = paginatedBankQuestions.map((q) => q.id);
    setSelectedQuestions((prev) => prev.filter((q) => !pageIds.includes(q.id)));
    const nextScores = { ...questionScores };
    pageIds.forEach((id) => delete nextScores[id]);
    setQuestionScores(nextScores);
    message.info('Đã gỡ các câu hỏi thuộc trang hiện tại khỏi đề.');
  };

  const handleResetBankFilters = () => {
    setBankSearch('');
    setBankDifficultyFilter('ALL');
    setBankTypeFilter('ALL');
    setBankCloFilter('ALL');
    setBankStatusFilter('ALL');
    setBankPage(1);
  };

  const handleToggleSelectQuestion = (q: Question) => {
    if (isLocked) {
      message.warning('Đề thi đã xuất bản, không thể thay đổi danh sách câu hỏi!');
      return;
    }
    const exists = selectedQuestions.some((item) => item.id === q.id);
    if (exists) {
      setSelectedQuestions(selectedQuestions.filter((item) => item.id !== q.id));
      const nextScores = { ...questionScores };
      delete nextScores[q.id];
      setQuestionScores(nextScores);
    } else {
      setSelectedQuestions([...selectedQuestions, q]);
      setQuestionScores({
        ...questionScores,
        [q.id]: q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.5,
      });
    }
  };

  const handleUpdateQuestionScore = (questionId: string, val: number | null) => {
    setQuestionScores((prev) => ({
      ...prev,
      [questionId]: val || 0,
    }));
  };

  const handleSaveDraft = async () => {
    const values = form.getFieldsValue(true);
    const selectedClass = classes.find((c) => c.id === values.classId);

    const payload: Partial<Assessment> = {
      ...values,
      className: selectedClass?.name,
      totalQuestions: selectedQuestions.length,
      questionIds: selectedQuestions.map((q) => q.id),
      status: ASSESSMENT_STATUS.DRAFT,
      submissionMode: values.submissionMode || 'ONLINE_TEXT',
      allowedFileExtensions: values.allowedFileExtensions || ['.pdf', '.docx', '.zip'],
      maxFileSizeMB: values.maxFileSizeMB || 25,
      requireFullscreen: values.requireFullscreen ?? false,
      enableProctoring: values.enableProctoring ?? true,
      maxViolationsAllowed: values.maxViolationsAllowed || 3,
      latePolicy: {
        enabled: values.latePolicyEnabled ?? true,
        deadlineMinutesAfter: values.lateDeadlineMinutesAfter || 15,
        penaltyPercent: values.latePenaltyPercent || 10,
      },
    };

    if (id) {
      await mockService.updateAssessment(id, payload);
      message.success('Đã lưu bản nháp đề thi thành công!');
    } else {
      await mockService.createAssessment({
        ...payload,
        createdBy: mockService.getCurrentUser().fullName,
      } as Assessment);
      message.success('Đã tạo và lưu bản nháp đề thi mới!');
    }
    navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS);
  };

  const handlePublishNow = async () => {
    const values = form.getFieldsValue(true);
    const selectedClass = classes.find((c) => c.id === values.classId);

    const payload: Partial<Assessment> = {
      ...values,
      className: selectedClass?.name,
      totalQuestions: selectedQuestions.length,
      questionIds: selectedQuestions.map((q) => q.id),
      status: ASSESSMENT_STATUS.PUBLISHED,
      submissionMode: values.submissionMode || 'ONLINE_TEXT',
      allowedFileExtensions: values.allowedFileExtensions || ['.pdf', '.docx', '.zip'],
      maxFileSizeMB: values.maxFileSizeMB || 25,
      requireFullscreen: values.requireFullscreen ?? false,
      enableProctoring: values.enableProctoring ?? true,
      maxViolationsAllowed: values.maxViolationsAllowed || 3,
      latePolicy: {
        enabled: values.latePolicyEnabled ?? true,
        deadlineMinutesAfter: values.lateDeadlineMinutesAfter || 15,
        penaltyPercent: values.latePenaltyPercent || 10,
      },
    };

    if (id) {
      await mockService.updateAssessment(id, payload);
      await mockService.publishAssessment(id);
    } else {
      const created = await mockService.createAssessment({
        ...payload,
        createdBy: mockService.getCurrentUser().fullName,
      } as Assessment);
      await mockService.publishAssessment(created.id);
    }

    message.success('Đã xuất bản đề thi thành công! Cấu trúc câu hỏi đã được bảo vệ.');
    navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS);
  };

  const stepsItems = [
    { title: '1. Thông tin & Cấu trúc Đề' },
    { title: '2. Ma trận Câu hỏi & Gán Điểm' },
    { title: '3. Quy chế & Xuất bản' },
  ];

  return (
    <div className="animate-fade-in">
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

      {/* Lock Notice if published */}
      {isLocked && (
        <Alert
          message="Đề thi đã được Xuất bản (Published)"
          description="Cấu trúc câu hỏi và thang điểm đã được khóa để bảo đảm tính toàn vẹn và công bằng cho sinh viên."
          type="warning"
          showIcon
          icon={<Lock size={16} />}
          className="mb-4 rounded-3"
        />
      )}

      {/* Modern Compact Step Navigator */}
      <Card bordered className="velica-wizard-card mb-4">
        <Steps
          current={currentStep}
          items={stepsItems}
          className="velica-steps-custom"
        />
      </Card>

      <Form form={form} layout="vertical">
        {/* =========================================================================
            PHASE 1: THIẾT LẬP THÔNG TIN VÀ CẤU TRÚC ĐỀ THI
           ========================================================================= */}
        {currentStep === 0 && (
          <Card
            bordered
            title={
              <div>
                <div className="velica-card-header-title">Thiết lập Thông tin & Cấu trúc Kỳ thi</div>
                <div className="velica-card-header-desc">
                  Xác định học phần áp dụng, hình thức thi, thời lượng làm bài và thang điểm chuẩn.
                </div>
              </div>
            }
            className="velica-wizard-step-card"
          >
            <Row gutter={[24, 0]}>
              <Col xs={24} md={16}>
                <Form.Item
                  name="title"
                  label="Tiêu đề Đề thi / Kỳ khảo thí"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề đề thi' }]}
                >
                  <Input placeholder="Vd: Kiểm Tra Giữa Kỳ — Thiết Kế Kiến Trúc Phần Mềm" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="classId"
                  label="Lớp học phần áp dụng"
                  rules={[{ required: true, message: 'Chọn lớp học' }]}
                >
                  <Select size="large" popupMatchSelectWidth={false}>
                    {classes.map((c) => (
                      <Select.Option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="type"
                  label="Hình thức đánh giá"
                  rules={[{ required: true }]}
                >
                  <Select size="large" popupMatchSelectWidth={false}>
                    <Select.Option value={ASSESSMENT_TYPE.QUIZ}>Trắc nghiệm ngắn (Quiz)</Select.Option>
                    <Select.Option value={ASSESSMENT_TYPE.MIDTERM}>Kiểm tra Giữa kỳ (Midterm)</Select.Option>
                    <Select.Option value={ASSESSMENT_TYPE.FINAL}>Thi Cuối kỳ (Final Exam)</Select.Option>
                    <Select.Option value={ASSESSMENT_TYPE.ASSIGNMENT}>Bài tập lớn (Assignment)</Select.Option>
                    <Select.Option value={ASSESSMENT_TYPE.HOMEWORK}>Bài tập về nhà (Homework)</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="maxScore"
                  label="Thang điểm tối đa"
                  rules={[{ required: true }]}
                  tooltip="Thang điểm chuẩn của bài thi (thường là 10 điểm theo quy chế tín chỉ)"
                >
                  <InputNumber min={5} max={100} step={1} addonAfter="điểm" size="large" className="w-100" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="timeLimitMinutes"
                  label="Thời lượng làm bài"
                  rules={[{ required: true }]}
                  tooltip="Nhập 0 nếu không giới hạn thời gian (phù hợp với Bài tập về nhà / Homework)"
                >
                  <InputNumber min={0} max={1440} step={5} addonAfter="phút" size="large" className="w-100" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="weight"
                  label="Trọng số học phần"
                  rules={[{ required: true }]}
                  tooltip="Tỷ lệ đóng góp vào điểm tổng kết học phần (Weight %)"
                >
                  <InputNumber min={5} max={60} step={5} addonAfter="%" size="large" className="w-100" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="instructions" label="Hướng dẫn & Quy chế làm bài cho sinh viên">
              <Input.TextArea
                rows={3}
                placeholder="Vd: Thí sinh làm bài độc lập, không sử dụng tài liệu ngoài. Đề thi bao gồm phần trắc nghiệm và câu hỏi tự luận thiết kế..."
              />
            </Form.Item>

            {/* Cấu hình Phương thức làm bài & Nộp file tự luận */}
            <div className="mt-4 pt-3 border-top">
              <div className="font-semibold text-sm text-primary-color mb-1 d-flex items-center gap-2">
                <UploadCloud size={16} className="text-brand-color" />
                Phương thức Làm bài & Nộp bài (Hỗ trợ Tự luận nộp file)
              </div>
              <div className="text-xs text-muted-color mb-3">
                Xác định hình thức làm bài trực tuyến (Plaintext gõ trực tiếp) hoặc cho phép sinh viên nộp tập tin đính kèm (PDF, Word, Source Code, Zip...).
              </div>

              <Form.Item
                name="submissionMode"
                className="mb-3"
              >
                <Radio.Group className="w-100">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <div
                        className={`p-3 border rounded-3 cursor-pointer transition-all ${
                          watchedSubmissionMode === 'ONLINE_TEXT' ? 'border-primary bg-light' : 'bg-white'
                        }`}
                        onClick={() => form.setFieldsValue({ submissionMode: 'ONLINE_TEXT' })}
                      >
                        <Radio value="ONLINE_TEXT" className="font-semibold text-sm">
                          Làm bài trực tuyến (Plaintext)
                        </Radio>
                        <div className="text-xs text-muted-color mt-1 pl-4">
                          Sinh viên gõ bài trực tiếp vào trình soạn thảo thuần văn bản, tự động xuống dòng và lưu từng ký tự.
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div
                        className={`p-3 border rounded-3 cursor-pointer transition-all ${
                          watchedSubmissionMode === 'FILE_UPLOAD' ? 'border-primary bg-light' : 'bg-white'
                        }`}
                        onClick={() => form.setFieldsValue({ submissionMode: 'FILE_UPLOAD' })}
                      >
                        <Radio value="FILE_UPLOAD" className="font-semibold text-sm">
                          Tự luận nộp tập tin (File Upload)
                        </Radio>
                        <div className="text-xs text-muted-color mt-1 pl-4">
                          Sinh viên đính kèm tập tin bài làm (PDF, Word, Zip, RAR, Source code môn học...).
                        </div>
                      </div>
                    </Col>
                    <Col xs={24} md={8}>
                      <div
                        className={`p-3 border rounded-3 cursor-pointer transition-all ${
                          watchedSubmissionMode === 'BOTH' ? 'border-primary bg-light' : 'bg-white'
                        }`}
                        onClick={() => form.setFieldsValue({ submissionMode: 'BOTH' })}
                      >
                        <Radio value="BOTH" className="font-semibold text-sm">
                          Hỗn hợp (Văn bản + Nộp file)
                        </Radio>
                        <div className="text-xs text-muted-color mt-1 pl-4">
                          Cho phép sinh viên vừa nhập nội dung giải thích vừa đính kèm file tài liệu / source code.
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Radio.Group>
              </Form.Item>

              {(watchedSubmissionMode === 'FILE_UPLOAD' || watchedSubmissionMode === 'BOTH') && (
                <div className="p-3 bg-light rounded-3 border">
                  <Row gutter={[20, 16]}>
                    <Col xs={24} md={16}>
                      <Form.Item
                        name="allowedFileExtensions"
                        label="Định dạng tệp tin cho phép tải lên"
                        className="m-0"
                        tooltip="Các đuôi file sinh viên được phép nộp cho câu hỏi tự luận"
                      >
                        <Select
                          mode="tags"
                          placeholder="Chọn hoặc nhập định dạng đuôi file (.pdf, .docx, .zip...)"
                          options={[
                            { label: '.pdf (Tài liệu PDF)', value: '.pdf' },
                            { label: '.docx (Văn bản Word)', value: '.docx' },
                            { label: '.zip (Tập tin nén Zip)', value: '.zip' },
                            { label: '.rar (Tập tin nén RAR)', value: '.rar' },
                            { label: '.java (Mã nguồn Java)', value: '.java' },
                            { label: '.py (Mã nguồn Python)', value: '.py' },
                            { label: '.cpp (Mã nguồn C++)', value: '.cpp' },
                            { label: '.sql (Truy vấn CSDL)', value: '.sql' },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item
                        name="maxFileSizeMB"
                        label="Dung lượng tối đa mỗi tệp"
                        className="m-0"
                      >
                        <InputNumber min={5} max={100} step={5} addonAfter="MB" className="w-100" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <div className="text-xs text-muted-color mt-2">
                    💡 Hướng dẫn: Khi sinh viên làm các câu hỏi tự luận, hệ thống sẽ hiển thị vùng kéo thả tệp nộp bài tương ứng với các định dạng đã cấu hình.
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* =========================================================================
            PHASE 2: MA TRẬN CÂU HỎI & GÁN ĐIỂM TỪNG CÂU
           ========================================================================= */}
        {currentStep === 1 && (
          <div className="animate-fade-in">
            {/* Unified Exam Builder Header & Workspace Toolbar */}
            <Card
              bordered
              className="mb-4 shadow-xs"
              bodyStyle={{ padding: '16px 20px' }}
            >
              {/* Row 1: Metrics & Primary Action Buttons */}
              <div className="d-flex items-center justify-between flex-wrap gap-3 pb-3 border-bottom">
                {/* Left: Summary Title & Score Badges */}
                <div className="d-flex items-center gap-3 flex-wrap">
                  <div className="d-flex items-center gap-2">
                    <span className="font-bold text-base text-primary-color">
                      Cấu trúc đề & Phân bổ điểm
                    </span>
                    <Tag color="blue" className="font-semibold m-0 text-xs">
                      {selectedQuestions.length} câu
                    </Tag>
                    <span className="text-xs text-muted-color">
                      ({typeMatrix.MCQ + typeMatrix.MULTI_CHOICE + typeMatrix.TRUE_FALSE + typeMatrix.FILL_BLANK} trắc nghiệm • {typeMatrix.ESSAY} tự luận)
                    </span>
                  </div>

                  <Divider type="vertical" className="h-16 m-0" />

                  <div className="d-flex items-center gap-2">
                    <span className="text-xs font-semibold text-secondary-color">Tổng điểm:</span>
                    <span
                      className={`font-bold text-sm px-2 py-0.5 rounded ${
                        Math.abs(totalAllocatedScore - targetMaxScore) < 0.01
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-300'
                      }`}
                    >
                      {totalAllocatedScore.toFixed(1)} / {targetMaxScore}đ
                    </span>

                    {Math.abs(totalAllocatedScore - targetMaxScore) < 0.01 ? (
                      <Tag color="success" className="velica-tag-pill m-0 text-xs" icon={<CheckCircle2 size={12} className="align-middle me-1" />}>
                        Khớp 100% thang điểm
                      </Tag>
                    ) : (
                      <Tag color="warning" className="velica-tag-pill m-0 text-xs" icon={<AlertCircle size={12} className="align-middle me-1" />}>
                        Lệch {(targetMaxScore - totalAllocatedScore > 0 ? '+' : '') + (targetMaxScore - totalAllocatedScore).toFixed(1)}đ
                      </Tag>
                    )}
                  </div>
                </div>

                {/* Right: Primary Action Buttons */}
                <div className="d-flex items-center gap-2 flex-wrap">
                  <Button
                    type="primary"
                    icon={<Sparkles size={14} />}
                    onClick={() => setRandomGeneratorOpen(true)}
                    className="velica-btn-primary"
                  >
                    Sinh đề tự động
                  </Button>

                  <Button
                    icon={<Plus size={14} />}
                    onClick={() => setBankModalOpen(true)}
                    className="velica-btn-action"
                  >
                    Thêm từ ngân hàng
                  </Button>

                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'equal',
                          icon: <Calculator size={14} />,
                          label: `Chia đều điểm (${(targetMaxScore / Math.max(1, selectedQuestions.length)).toFixed(2)}đ / câu)`,
                          onClick: handleEqualizeScores,
                        },
                        {
                          key: 'standard',
                          icon: <Scale size={14} />,
                          label: 'Định mức tiêu chuẩn (TN 1.0đ, TL 4.0đ)',
                          onClick: handleStandardScoreAllocation,
                        },
                        {
                          key: 'scale-10',
                          icon: <CheckCircle2 size={14} />,
                          label: 'Quy chuẩn tổng về thang 10.0đ',
                          onClick: () => handleScaleScoreProportionally(10),
                        },
                        {
                          key: 'scale-100',
                          icon: <CheckCircle2 size={14} />,
                          label: 'Quy chuẩn tổng về thang 100đ',
                          onClick: () => handleScaleScoreProportionally(100),
                        },
                      ],
                    }}
                  >
                    <Button icon={<Scale size={14} />} className="velica-btn-action">
                      Phân bổ điểm
                    </Button>
                  </Dropdown>

                  <Button
                    icon={<BarChart2 size={14} />}
                    onClick={() => setMatrixModalOpen(true)}
                    className="velica-btn-action"
                  >
                    Ma trận CLO & Bloom
                  </Button>

                  {selectedQuestions.length > 0 && (
                    <Popconfirm
                      title="Gỡ toàn bộ câu hỏi?"
                      description="Bạn có chắc chắn muốn làm trống toàn bộ câu hỏi trong đề?"
                      onConfirm={handleRemoveAllSelected}
                      okText="Gỡ toàn bộ"
                      cancelText="Hủy"
                      okButtonProps={{ danger: true }}
                    >
                      <Button type="text" danger icon={<Trash2 size={14} />}>
                        Làm trống đề
                      </Button>
                    </Popconfirm>
                  )}
                </div>
              </div>

              {/* Row 2: View Mode Switcher and Contextual Controls */}
              <div className="d-flex items-center justify-between pt-3 flex-wrap gap-2">
                <Segmented
                  value={viewMode}
                  onChange={(val) => setViewMode(val as any)}
                  options={[
                    {
                      value: 'LIST',
                      label: (
                        <span className="d-flex items-center gap-1.5 px-2 py-0.5 font-medium">
                          <ClipboardList size={14} />
                          <span>Danh sách câu hỏi ({selectedQuestions.length})</span>
                        </span>
                      ),
                    },
                    {
                      value: 'TWO_COLUMNS',
                      label: (
                        <span className="d-flex items-center gap-1.5 px-2 py-0.5 font-medium">
                          <Layers size={14} />
                          <span>Soạn 2 cột (Ngân hàng ↔ Đề)</span>
                        </span>
                      ),
                    },
                    {
                      value: 'PREVIEW',
                      label: (
                        <span className="d-flex items-center gap-1.5 px-2 py-0.5 font-medium">
                          <FileText size={14} />
                          <span>Xem trước đề thi (Bản in)</span>
                        </span>
                      ),
                    },
                  ]}
                />

                {/* Contextual control depending on viewMode */}
                {viewMode === 'LIST' && (
                  <div className="d-flex items-center gap-3">
                    <div className="d-flex items-center gap-2">
                      <Switch
                        size="small"
                        checked={showAnswersInList}
                        onChange={setShowAnswersInList}
                      />
                      <span className="text-xs font-medium text-secondary-color">
                        Hiện đáp án đúng & Lời giải
                      </span>
                    </div>
                    {Math.abs(totalAllocatedScore - targetMaxScore) > 0.01 && (
                      <Button
                        size="small"
                        type="link"
                        icon={<Scale size={12} />}
                        onClick={handleEqualizeScores}
                        className="p-0 text-xs"
                      >
                        Tự cân bằng điểm
                      </Button>
                    )}
                  </div>
                )}

                {viewMode === 'PREVIEW' && (
                  <div className="d-flex items-center gap-3">
                    <div className="d-flex items-center gap-2">
                      <Switch
                        size="small"
                        checked={showAnswersInPreview}
                        onChange={setShowAnswersInPreview}
                      />
                      <span className="text-xs font-medium text-secondary-color">
                        Hiện đáp án & Bareme chấm
                      </span>
                    </div>
                    <Button
                      size="small"
                      icon={<Printer size={14} />}
                      onClick={() => window.print()}
                      className="velica-btn-action"
                    >
                      In đề thi / Lưu PDF
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* VIEW MODE 1: LIST VIEW (Focus on questions in exam) */}
            {viewMode === 'LIST' && (
              <div>
                {selectedQuestions.length === 0 ? (
                  <Card className="text-center py-5 border-dashed border-2 rounded-3 bg-light">
                    <div className="max-w-480 mx-auto py-4">
                      <div className="p-3 bg-primary-subtle rounded-circle d-inline-flex mb-3 text-brand-color">
                        <FileText size={36} />
                      </div>
                      <Title level={4} className="mb-2">
                        Đề thi chưa có câu hỏi nào
                      </Title>
                      <Paragraph type="secondary" className="mb-4">
                        Bạn có thể sử dụng thuật toán tự động sinh đề theo ma trận chuẩn CLO & Độ khó trong vài giây, hoặc duyệt ngân hàng để chọn thủ công.
                      </Paragraph>
                      <Space size="middle">
                        <Button
                          type="primary"
                          icon={<Sparkles size={15} />}
                          onClick={() => setRandomGeneratorOpen(true)}
                          className="velica-btn-primary"
                        >
                          Sinh đề tự động (CLO & Độ khó)
                        </Button>
                        <Button
                          icon={<Plus size={15} />}
                          onClick={() => setBankModalOpen(true)}
                        >
                          Chọn câu hỏi từ Ngân hàng
                        </Button>
                      </Space>
                    </div>
                  </Card>
                ) : (
                  <div className="d-flex flex-col gap-3">
                    {selectedQuestions.map((q, idx) => {
                      const clo = getQuestionClo(q);
                      const qScore = questionScores[q.id] || (q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0);

                      return (
                        <Card
                          key={q.id || idx}
                          bordered
                          className="shadow-xs hover-card transition-all"
                          bodyStyle={{ padding: '16px 20px' }}
                        >
                          {/* Card Header Row */}
                          <div className="d-flex items-center justify-between mb-2 flex-wrap gap-2 border-bottom pb-2">
                            <Space size={6} wrap>
                              <span className="badge bg-primary text-white font-bold text-xs px-2.5 py-1 rounded">
                                #{idx + 1}
                              </span>
                              <Tag
                                color={
                                  q.type === QUESTION_TYPE.MCQ
                                    ? 'blue'
                                    : q.type === QUESTION_TYPE.MULTI_CHOICE
                                    ? 'purple'
                                    : q.type === QUESTION_TYPE.TRUE_FALSE
                                    ? 'cyan'
                                    : 'magenta'
                                }
                                className="velica-tag-pill font-semibold text-xs m-0"
                              >
                                {q.type === QUESTION_TYPE.MCQ
                                  ? 'Trắc nghiệm đơn'
                                  : q.type === QUESTION_TYPE.MULTI_CHOICE
                                  ? 'Nhiều lựa chọn'
                                  : q.type === QUESTION_TYPE.TRUE_FALSE
                                  ? 'Đúng / Sai'
                                  : 'Tự luận'}
                              </Tag>
                              <Tag color={clo === 'CLO1' ? 'indigo' : clo === 'CLO2' ? 'cyan' : clo === 'CLO3' ? 'purple' : 'geekblue'} className="velica-tag-pill font-bold text-xs m-0">
                                {clo}
                              </Tag>
                              <Tag
                                color={
                                  q.difficulty === 'EASY'
                                    ? 'green'
                                    : q.difficulty === 'MEDIUM'
                                    ? 'blue'
                                    : q.difficulty === 'HARD'
                                    ? 'orange'
                                    : 'red'
                                }
                                className="velica-tag-pill text-xs m-0"
                              >
                                {q.difficulty === 'EASY'
                                  ? 'Nhận biết'
                                  : q.difficulty === 'MEDIUM'
                                  ? 'Thông hiểu'
                                  : q.difficulty === 'HARD'
                                  ? 'Vận dụng'
                                  : 'Vận dụng cao'}
                              </Tag>
                            </Space>

                            {/* Points & Actions */}
                            <div className="d-flex items-center gap-2">
                              <div className="d-flex items-center gap-1.5">
                                <span className="text-xs text-muted-color">Điểm:</span>
                                <InputNumber
                                  size="small"
                                  min={0.25}
                                  max={10}
                                  step={0.25}
                                  value={qScore}
                                  onChange={(val) => handleUpdateQuestionScore(q.id, val)}
                                  addonAfter="đ"
                                  style={{ width: 85 }}
                                />
                              </div>

                              <Divider type="vertical" className="m-0 h-16" />

                              <Tooltip title="Đổi sang câu hỏi khác cùng chuẩn CLO & độ khó từ ngân hàng">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<RefreshCw size={13} className="text-brand-color" />}
                                  onClick={() => handleRerollQuestion(idx)}
                                  className="text-xs text-brand-color p-1"
                                >
                                  Đổi câu
                                </Button>
                              </Tooltip>

                              <Tooltip title="Xem chi tiết đầy đủ câu hỏi">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<Eye size={14} className="text-muted-color" />}
                                  onClick={() => setPreviewQuestion(q)}
                                  className="p-1"
                                >
                                  Chi tiết
                                </Button>
                              </Tooltip>

                              <Tooltip title="Gỡ khỏi đề thi">
                                <Button
                                  size="small"
                                  type="text"
                                  danger
                                  icon={<Trash2 size={14} />}
                                  onClick={() => handleToggleSelectQuestion(q)}
                                  className="p-1"
                                />
                              </Tooltip>
                            </div>
                          </div>

                          {/* Question Content */}
                          <div className="text-sm font-semibold text-primary-color lh-base mb-2">
                            <MathRenderer content={q.content} />
                          </div>

                          {/* Diagram if available */}
                          {q.imageUrl && (
                            <div className="my-2 p-2 border rounded bg-light text-center">
                              <img
                                src={q.imageUrl}
                                alt="Sơ đồ minh họa"
                                style={{ maxHeight: 180, maxWidth: 420, objectFit: 'contain' }}
                                className="mx-auto border rounded p-1 bg-white"
                              />
                            </div>
                          )}

                          {/* Answer Options */}
                          {q.options && q.options.length > 0 && (
                            <div className="d-flex flex-col gap-1.5 mt-2">
                              {q.options.map((opt, oIdx) => {
                                const isCorrect = opt.isCorrect;
                                const showAsCorrect = showAnswersInList && isCorrect;

                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2 rounded-2 border d-flex items-start gap-2 transition-all ${
                                      showAsCorrect
                                        ? 'bg-emerald-50 border-emerald-300'
                                        : 'bg-white border-light'
                                    }`}
                                  >
                                    <span
                                      className={`font-bold text-xs px-1.5 py-0.5 rounded ${
                                        showAsCorrect
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-light text-secondary-color'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span
                                      className={`text-xs flex-1 ${
                                        showAsCorrect
                                          ? 'font-semibold text-emerald-900'
                                          : 'text-primary-color'
                                      }`}
                                    >
                                      <MathRenderer content={opt.text} />
                                    </span>
                                    {showAsCorrect && (
                                      <Tag color="success" className="m-0 font-semibold text-xs" icon={<Check size={11} className="align-middle me-0.5" />}>
                                        Đáp án đúng
                                      </Tag>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Explanation / Sample Answer */}
                          {showAnswersInList && q.explanation && (
                            <div className="mt-2.5 p-2.5 bg-sky-50 border border-sky-200 rounded-2 text-xs text-sky-900 d-flex items-start gap-2">
                              <Lightbulb size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <strong className="text-sky-950">Hướng dẫn giải & Tiêu chí chấm:</strong>{' '}
                                <MathRenderer content={q.explanation} />
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VIEW MODE 2: TWO COLUMNS (Bank on left, Exam on right) */}
            {viewMode === 'TWO_COLUMNS' && (
              <Row gutter={[20, 20]}>
                {/* Left Column: Question Bank Browser */}
                <Col xs={24} lg={13}>
                  <Card
                    bordered
                    title={
                      <div className="d-flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="velica-card-header-title">
                            Ngân hàng Câu hỏi ({filteredBankQuestions.length} câu)
                          </span>
                          <div className="text-xs text-muted-color">
                            Tìm kiếm và chọn câu hỏi thêm vào đề
                          </div>
                        </div>
                        <Button
                          size="small"
                          type="dashed"
                          onClick={handleSelectAllCurrentPage}
                        >
                          + Thêm cả trang này
                        </Button>
                      </div>
                    }
                    className="velica-wizard-step-card"
                  >
                    {/* Multi-attribute Filter Toolbar */}
                    <div className="p-2 bg-light rounded-2 border mb-3">
                      <div className="d-flex items-center gap-2 mb-2 flex-wrap">
                        <Input
                          size="small"
                          prefix={<Search size={13} className="text-muted-color" />}
                          placeholder="Tìm nội dung câu hỏi..."
                          value={bankSearch}
                          onChange={(e) => {
                            setBankSearch(e.target.value);
                            setBankPage(1);
                          }}
                          allowClear
                          className="flex-1 min-w-160"
                        />
                        <Radio.Group
                          size="small"
                          value={bankStatusFilter}
                          onChange={(e) => {
                            setBankStatusFilter(e.target.value);
                            setBankPage(1);
                          }}
                        >
                          <Radio.Button value="ALL">Tất cả</Radio.Button>
                          <Radio.Button value="UNSELECTED">Chưa chọn</Radio.Button>
                          <Radio.Button value="SELECTED">Đã chọn</Radio.Button>
                        </Radio.Group>
                      </div>

                      <div className="d-flex items-center gap-2 flex-wrap">
                        <Select
                          size="small"
                          value={bankCloFilter}
                          onChange={(val) => {
                            setBankCloFilter(val);
                            setBankPage(1);
                          }}
                          style={{ width: 110 }}
                        >
                          <Select.Option value="ALL">Tất cả CLO</Select.Option>
                          <Select.Option value="CLO1">CLO1</Select.Option>
                          <Select.Option value="CLO2">CLO2</Select.Option>
                          <Select.Option value="CLO3">CLO3</Select.Option>
                          <Select.Option value="CLO4">CLO4</Select.Option>
                        </Select>

                        <Select
                          size="small"
                          value={bankDifficultyFilter}
                          onChange={(val) => {
                            setBankDifficultyFilter(val);
                            setBankPage(1);
                          }}
                          style={{ width: 110 }}
                        >
                          <Select.Option value="ALL">Mọi độ khó</Select.Option>
                          <Select.Option value="EASY">Nhận biết</Select.Option>
                          <Select.Option value="MEDIUM">Thông hiểu</Select.Option>
                          <Select.Option value="HARD">Vận dụng</Select.Option>
                          <Select.Option value="VERY_HARD">Vận dụng cao</Select.Option>
                        </Select>

                        <Select
                          size="small"
                          value={bankTypeFilter}
                          onChange={(val) => {
                            setBankTypeFilter(val);
                            setBankPage(1);
                          }}
                          style={{ width: 110 }}
                        >
                          <Select.Option value="ALL">Mọi loại</Select.Option>
                          <Select.Option value={QUESTION_TYPE.MCQ}>Trắc nghiệm</Select.Option>
                          <Select.Option value={QUESTION_TYPE.MULTI_CHOICE}>Nhiều đáp án</Select.Option>
                          <Select.Option value={QUESTION_TYPE.TRUE_FALSE}>Đúng / Sai</Select.Option>
                          <Select.Option value={QUESTION_TYPE.ESSAY}>Tự luận</Select.Option>
                        </Select>

                        {(bankSearch || bankDifficultyFilter !== 'ALL' || bankTypeFilter !== 'ALL' || bankCloFilter !== 'ALL' || bankStatusFilter !== 'ALL') && (
                          <Button
                            size="small"
                            type="text"
                            icon={<RotateCcw size={11} />}
                            onClick={handleResetBankFilters}
                            className="text-xs p-1 h-auto text-muted-color"
                          >
                            Xóa lọc
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Paginated Bank Question Cards */}
                    {filteredBankQuestions.length === 0 ? (
                      <div className="text-center py-5 text-muted-color">
                        Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
                      </div>
                    ) : (
                      <div className="d-flex flex-col gap-2">
                        {paginatedBankQuestions.map((q) => {
                          const isSelected = selectedQuestions.some((item) => item.id === q.id);
                          const clo = getQuestionClo(q);

                          return (
                            <div
                              key={q.id}
                              className={`p-3 border rounded-3 transition-all ${
                                isSelected
                                  ? 'bg-light-brand border-brand'
                                  : 'bg-white hover-bg-light border-light'
                              }`}
                            >
                              <div className="d-flex justify-between items-center mb-1 flex-wrap gap-1">
                                <Space size={4} wrap>
                                  <Tag color={clo === 'CLO1' ? 'indigo' : clo === 'CLO2' ? 'cyan' : 'purple'} className="velica-tag-pill font-bold">
                                    {clo}
                                  </Tag>
                                  <Tag color={q.type === QUESTION_TYPE.MCQ ? 'blue' : q.type === QUESTION_TYPE.ESSAY ? 'magenta' : 'default'} className="velica-tag-pill">
                                    {q.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm' : q.type === QUESTION_TYPE.ESSAY ? 'Tự luận' : q.type}
                                  </Tag>
                                  <Tag
                                    color={
                                      q.difficulty === 'EASY'
                                        ? 'green'
                                        : q.difficulty === 'MEDIUM'
                                        ? 'blue'
                                        : q.difficulty === 'HARD'
                                        ? 'orange'
                                        : 'red'
                                    }
                                    className="velica-tag-pill"
                                  >
                                    {q.difficulty}
                                  </Tag>
                                </Space>

                                <Space size={4}>
                                  <Tooltip title="Xem chi tiết câu hỏi">
                                    <Button
                                      size="small"
                                      type="text"
                                      icon={<Eye size={13} className="text-muted-color" />}
                                      onClick={() => setPreviewQuestion(q)}
                                      className="p-1 h-auto"
                                    />
                                  </Tooltip>
                                  {isSelected ? (
                                    <Tag
                                      color="success"
                                      className="velica-tag-pill cursor-pointer"
                                      onClick={() => handleToggleSelectQuestion(q)}
                                      title="Bấm để gỡ khỏi đề thi"
                                      icon={<Check size={11} className="align-middle me-0.5" />}
                                    >
                                      Đã trong đề
                                    </Tag>
                                  ) : (
                                    <Button
                                      size="small"
                                      type="primary"
                                      ghost
                                      icon={<Plus size={12} />}
                                      onClick={() => handleToggleSelectQuestion(q)}
                                    >
                                      Chọn
                                    </Button>
                                  )}
                                </Space>
                              </div>

                              <div
                                className="text-xs font-medium text-primary-color cursor-pointer hover-text-brand"
                                onClick={() => handleToggleSelectQuestion(q)}
                              >
                                <MathRenderer content={q.content} />
                              </div>
                            </div>
                          );
                        })}

                        {/* Pagination Controls */}
                        <div className="d-flex justify-between items-center mt-2 pt-2 border-top">
                          <span className="text-xs text-muted-color">
                            Hiển thị {paginatedBankQuestions.length} / {filteredBankQuestions.length} câu
                          </span>
                          <Pagination
                            current={bankPage}
                            pageSize={bankPageSize}
                            total={filteredBankQuestions.length}
                            onChange={(page) => setBankPage(page)}
                            showSizeChanger={false}
                            size="small"
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>

                {/* Right Column: Selected Questions Structure */}
                <Col xs={24} lg={11}>
                  <Card
                    bordered
                    title={
                      <div className="d-flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="velica-card-header-title">
                            Cấu trúc Đề thi ({selectedQuestions.length} câu)
                          </span>
                          <div className="text-xs text-muted-color">
                            Tổng điểm: {totalAllocatedScore.toFixed(1)} / {targetMaxScore}đ
                          </div>
                        </div>
                        {selectedQuestions.length > 0 && (
                          <Popconfirm
                            title="Làm trống đề thi?"
                            description="Bạn có chắc chắn muốn gỡ toàn bộ câu hỏi?"
                            onConfirm={handleRemoveAllSelected}
                            okText="Gỡ toàn bộ"
                            cancelText="Hủy"
                            okButtonProps={{ danger: true }}
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<Trash2 size={13} />}
                            >
                              Gỡ toàn bộ
                            </Button>
                          </Popconfirm>
                        )}
                      </div>
                    }
                    className="velica-wizard-step-card"
                  >
                    {selectedQuestions.length === 0 ? (
                      <div className="text-center py-5 text-muted-color">
                        Chưa có câu hỏi nào trong đề. Vui lòng chọn từ ngân hàng bên trái hoặc bấm "Sinh đề tự động".
                      </div>
                    ) : (
                      <div className="d-flex flex-col gap-2">
                        {paginatedSelectedQuestions.map((q) => {
                          const originalIdx = selectedQuestions.findIndex((item) => item.id === q.id);
                          return (
                            <div
                              key={q.id}
                              className="p-2.5 bg-light border rounded-3 d-flex items-start justify-between gap-2"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="d-flex items-center gap-1 mb-1 flex-wrap">
                                  <span className="badge bg-secondary font-semibold text-xs">
                                    #{originalIdx + 1}
                                  </span>
                                  <Tag color={q.type === QUESTION_TYPE.MCQ ? 'blue' : 'magenta'} className="velica-tag-pill">
                                    {q.type === QUESTION_TYPE.MCQ ? 'TN' : 'TL'}
                                  </Tag>
                                  <Tag color="geekblue" className="velica-tag-pill">
                                    {q.difficulty}
                                  </Tag>
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={<Eye size={11} />}
                                    onClick={() => setPreviewQuestion(q)}
                                    className="p-0 text-brand-color text-xs d-inline-flex items-center gap-1"
                                  >
                                    Chi tiết
                                  </Button>
                                </div>
                                <div
                                  className="text-xs font-semibold text-primary-color cursor-pointer hover-text-brand"
                                  onClick={() => setPreviewQuestion(q)}
                                >
                                  <MathRenderer content={q.content} />
                                </div>
                              </div>

                              <div className="d-flex items-center gap-2 flex-shrink-0">
                                <InputNumber
                                  size="small"
                                  min={0.25}
                                  max={10}
                                  step={0.25}
                                  value={questionScores[q.id] || (q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0)}
                                  onChange={(val) => handleUpdateQuestionScore(q.id, val)}
                                  addonAfter="đ"
                                  style={{ width: 85 }}
                                />
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<Trash2 size={14} />}
                                  onClick={() => handleToggleSelectQuestion(q)}
                                  title="Gỡ khỏi đề thi"
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Pagination for selected questions */}
                        {filteredSelectedQuestions.length > selectedPageSize && (
                          <div className="d-flex justify-between items-center mt-2 pt-2 border-top">
                            <span className="text-xs text-muted-color">
                              Trang {selectedPage} / {Math.ceil(filteredSelectedQuestions.length / selectedPageSize)}
                            </span>
                            <Pagination
                              current={selectedPage}
                              pageSize={selectedPageSize}
                              total={filteredSelectedQuestions.length}
                              onChange={(page) => setSelectedPage(page)}
                              showSizeChanger={false}
                              size="small"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            )}

            {/* VIEW MODE 3: FULL ACADEMIC EXAM PAPER PREVIEW */}
            {viewMode === 'PREVIEW' && (
              <div>
                {/* Exam Paper Container */}
                <div className="velica-exam-paper">
                  {/* Academic Header */}
                  <div className="velica-exam-paper-header">
                    <Row justify="space-between" align="top">
                      <Col xs={12} className="text-center">
                        <div className="text-xs font-bold text-uppercase text-secondary-color">
                          TRƯỜNG ĐẠI HỌC CÔNG NGHỆ & KỸ THUẬT
                        </div>
                        <div className="text-xs font-bold text-uppercase text-primary-color">
                          KHOA CÔNG NGHỆ THÔNG TIN
                        </div>
                        <div className="text-2xs text-muted-color">Bộ môn Kỹ thuật Phần mềm</div>
                      </Col>

                      <Col xs={12} className="text-center">
                        <div className="text-xs font-bold text-uppercase text-primary-color">
                          {form.getFieldValue('type') === ASSESSMENT_TYPE.FINAL
                            ? 'ĐỀ THI KẾT THÚC HỌC PHẦN'
                            : form.getFieldValue('type') === ASSESSMENT_TYPE.MIDTERM
                            ? 'ĐỀ THI GIỮA HỌC KỲ'
                            : 'BÀI KIỂM TRA ĐÁNH GIÁ'}
                        </div>
                        <div className="text-xs text-secondary-color">
                          Học kỳ SP27 • Năm học 2026 - 2027
                        </div>
                        <div className="text-2xs text-muted-color">Hình thức: Trực tuyến trên Velica</div>
                      </Col>
                    </Row>

                    <div className="text-center mt-3 pt-2 border-top">
                      <h2 className="fs-4 font-bold text-primary-color m-0">
                        {form.getFieldValue('title') || 'ĐỀ THI ĐÁNH GIÁ NĂNG LỰC HỌC PHẦN'}
                      </h2>
                      <div className="text-xs text-secondary-color mt-1">
                        Môn học / Lớp:{' '}
                        <strong>
                          {classes.find((c) => c.id === form.getFieldValue('classId'))?.name || 'SE301 - Kiến Trúc Phần Mềm'}
                        </strong>{' '}
                        • Thời gian làm bài:{' '}
                        <strong>{form.getFieldValue('timeLimitMinutes') || 45} phút</strong> (Không kể thời gian phát đề)
                      </div>
                      <div className="text-xs text-muted-color mt-0.5">
                        Thang điểm: <strong>{targetMaxScore} điểm</strong> • Tổng số câu:{' '}
                        <strong>{selectedQuestions.length} câu</strong>
                      </div>
                    </div>

                    <div className="mt-3 p-2 bg-light border rounded text-2xs text-secondary-color text-center fst-italic">
                      * Ghi chú: Thí sinh làm bài theo đúng quy chế thi. Không được sử dụng tài liệu trừ khi có hướng dẫn riêng của đề bài.
                    </div>
                  </div>

                  {/* Exam Questions Content */}
                  {selectedQuestions.length === 0 ? (
                    <div className="text-center py-5 text-muted-color fst-italic">
                      Đề thi chưa có câu hỏi nào để hiển thị xem trước. Vui lòng thêm câu hỏi ở bước trước.
                    </div>
                  ) : (
                    <div>
                      {selectedQuestions.map((q, idx) => {
                        const clo = getQuestionClo(q);
                        const qScore = questionScores[q.id] || (q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0);

                        return (
                          <div key={q.id || idx} className="velica-exam-question-item">
                            {/* Question Title & Point */}
                            <div className="d-flex justify-between items-start mb-1.5">
                              <div className="font-bold text-sm text-primary-color">
                                Câu {idx + 1} ({qScore} điểm):{' '}
                                <span className="fw-normal text-muted-color text-xs">[{clo}]</span>
                              </div>
                              <span className="text-2xs text-muted-color">
                                {q.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm đơn' : q.type === QUESTION_TYPE.ESSAY ? 'Tự luận' : q.type}
                              </span>
                            </div>

                            {/* Question Body */}
                            <div className="text-sm text-primary-color leading-relaxed mb-2">
                              <MathRenderer content={q.content} />
                            </div>

                            {/* Diagram if any */}
                            {q.imageUrl && (
                              <div className="my-2 text-center">
                                <img
                                  src={q.imageUrl}
                                  alt="Minh họa"
                                  style={{ maxHeight: 200, maxWidth: 440, objectFit: 'contain' }}
                                  className="mx-auto border rounded p-1 bg-white"
                                />
                              </div>
                            )}

                            {/* Options A, B, C, D */}
                            {q.options && q.options.length > 0 && (
                              <Row gutter={[12, 8]} className="mt-2">
                                {q.options.map((opt, oIdx) => {
                                  const showAsCorrect = showAnswersInPreview && opt.isCorrect;
                                  return (
                                    <Col xs={24} sm={12} key={opt.id}>
                                      <div
                                        className={`p-2 rounded border text-xs d-flex items-start gap-1.5 ${
                                          showAsCorrect
                                            ? 'bg-emerald-50 border-emerald-400 font-semibold text-emerald-900'
                                            : 'bg-white border-light text-primary-color'
                                        }`}
                                      >
                                        <span className={`font-bold ${showAsCorrect ? 'text-emerald-700' : 'text-secondary-color'}`}>
                                          {String.fromCharCode(65 + oIdx)}.
                                        </span>
                                        <span className="flex-1">
                                          <MathRenderer content={opt.text} />
                                        </span>
                                        {showAsCorrect && (
                                          <span className="text-2xs text-emerald-700 font-bold">✓</span>
                                        )}
                                      </div>
                                    </Col>
                                  );
                                })}
                              </Row>
                            )}

                            {/* Explanation if showAnswersInPreview */}
                            {showAnswersInPreview && q.explanation && (
                              <div className="mt-2.5 p-2.5 bg-sky-50 border border-sky-200 rounded text-xs text-sky-950 d-flex items-start gap-2">
                                <Lightbulb size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <strong>Đáp án & Tiêu chí chấm:</strong>{' '}
                                  <MathRenderer content={q.explanation} />
                                </div>
                              </div>
                            )}

                            {/* Essay answer space hint */}
                            {q.type === QUESTION_TYPE.ESSAY && (
                              <div className="mt-3 p-3 border border-dashed rounded bg-light text-2xs text-muted-color fst-italic text-center">
                                [Vùng bài làm tự luận của sinh viên - Nhập văn bản hoặc nộp file đồ án theo yêu cầu]
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Paper Ending */}
                      <div className="text-center mt-4 pt-3 border-top">
                        <div className="font-bold text-xs text-uppercase text-secondary-color tracking-wide">
                          --- HẾT ---
                        </div>
                        <div className="text-2xs text-muted-color fst-italic mt-1">
                          (Cán bộ coi thi không giải thích gì thêm)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            PHASE 3: QUY CHẾ PHÒNG THI, CHUẨN ĐẦU RA CLO & XUẤT BẢN
           ========================================================================= */}
        {currentStep === 2 && (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
              <Card
                bordered
                title={
                  <div>
                    <div className="velica-card-header-title">Quy chế Khảo thí & Chống Gian lận</div>
                    <div className="velica-card-header-desc">
                      Thiết lập các rào cản kỹ thuật bảo đảm tính khách quan và quy chế nộp trễ.
                    </div>
                  </div>
                }
                className="velica-wizard-step-card mb-4"
              >
                <div className="d-flex flex-col gap-3">
                  <div className="d-flex items-center justify-between p-3 bg-light rounded-2">
                    <div>
                      <div className="font-semibold text-sm text-primary-color d-flex items-center gap-2">
                        <Maximize2 size={16} className="text-brand-color" />
                        Bắt buộc chế độ toàn màn hình (Require Fullscreen)
                      </div>
                      <div className="text-xs text-muted-color">
                        Yêu cầu thí sinh giữ trình duyệt ở chế độ Fullscreen trong suốt bài thi để hạn chế phân tán và gian lận
                      </div>
                    </div>
                    <Form.Item name="requireFullscreen" valuePropName="checked" className="m-0">
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="d-flex items-center justify-between p-3 bg-light rounded-2">
                    <div>
                      <div className="font-semibold text-sm text-primary-color d-flex items-center gap-2">
                        <Shield size={16} className="text-brand-color" />
                        Bật/tắt giám sát chuyển Tab & Mất tiêu điểm (Proctoring)
                      </div>
                      <div className="text-xs text-muted-color">
                        Tự động ghi nhận số lần chuyển Tab hoặc rời bài thi. Có thể TẮT đối với Bài tập về nhà (Homework) hoặc đề mở.
                      </div>
                    </div>
                    <Form.Item name="enableProctoring" valuePropName="checked" className="m-0">
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="p-3 bg-light rounded-2">
                    <div className="d-flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-primary-color">
                          Giới hạn số lần cảnh báo vi phạm tối đa
                        </div>
                        <div className="text-xs text-muted-color">
                          Hệ thống sẽ tự động khóa hoặc nộp bài khi số lần vi phạm vượt ngưỡng này
                        </div>
                      </div>
                      <Form.Item name="maxViolationsAllowed" className="m-0">
                        <Select style={{ width: 140 }}>
                          <Select.Option value={1}>1 lần</Select.Option>
                          <Select.Option value={3}>3 lần</Select.Option>
                          <Select.Option value={5}>5 lần</Select.Option>
                          <Select.Option value={10}>10 lần</Select.Option>
                          <Select.Option value={99}>Không giới hạn</Select.Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </div>

                  <div className="d-flex items-center justify-between p-3 bg-light rounded-2">
                    <div>
                      <div className="font-semibold text-sm text-primary-color">Xáo trộn câu hỏi (Shuffle Questions)</div>
                      <div className="text-xs text-muted-color">Mỗi sinh viên nhận được một đề thi có thứ tự câu hỏi ngẫu nhiên</div>
                    </div>
                    <Form.Item name="shuffleQuestions" valuePropName="checked" className="m-0">
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="d-flex items-center justify-between p-3 bg-light rounded-2">
                    <div>
                      <div className="font-semibold text-sm text-primary-color">Xáo trộn phương án đáp án (Shuffle Answers)</div>
                      <div className="text-xs text-muted-color">Đảo ngẫu nhiên vị trí các lựa chọn A, B, C, D của câu trắc nghiệm</div>
                    </div>
                    <Form.Item name="shuffleAnswers" valuePropName="checked" className="m-0">
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="d-flex items-center justify-between p-3 bg-light rounded-2">
                    <div>
                      <div className="font-semibold text-sm text-primary-color">Cho phép quay lại câu trước (Back Navigation)</div>
                      <div className="text-xs text-muted-color">Sinh viên được phép xem lại và sửa đáp án các câu đã làm</div>
                    </div>
                    <Form.Item name="allowBackNavigation" valuePropName="checked" className="m-0">
                      <Switch />
                    </Form.Item>
                  </div>

                  <div className="p-3 bg-light rounded-2">
                    <div className="d-flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm text-primary-color d-flex items-center gap-2">
                          <Clock size={16} className="text-brand-color" />
                          Chính sách xử lý nộp bài trễ (Late Submission Policy)
                        </div>
                        <div className="text-xs text-muted-color">
                          Cho phép sinh viên nộp bài sau giờ hạn chót và áp dụng tỷ lệ trừ điểm tự động
                        </div>
                      </div>
                      <Form.Item name="latePolicyEnabled" valuePropName="checked" className="m-0">
                        <Switch />
                      </Form.Item>
                    </div>

                    {watchedLatePolicyEnabled && (
                      <div className="mt-3 pt-3 border-top">
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={14}>
                            <Form.Item
                              name="lateDeadlineMinutesAfter"
                              label="Thời gian ân hạn tối đa sau hạn chót"
                              className="m-0"
                            >
                              <Select style={{ width: '100%' }}>
                                <Select.Option value={15}>15 phút (Kiểm tra tại lớp)</Select.Option>
                                <Select.Option value={30}>30 phút (Kiểm tra định kỳ)</Select.Option>
                                <Select.Option value={60}>1 giờ (Bài thi giữa kỳ / cuối kỳ)</Select.Option>
                                <Select.Option value={120}>2 giờ (Bài tập lớn)</Select.Option>
                                <Select.Option value={1440}>24 giờ / 1 ngày (Bài tập về nhà - Homework)</Select.Option>
                                <Select.Option value={2880}>48 giờ / 2 ngày (Bài tập về nhà mở rộng)</Select.Option>
                                <Select.Option value={4320}>72 giờ / 3 ngày (Đồ án học phần)</Select.Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={10}>
                            <Form.Item
                              name="latePenaltyPercent"
                              label="Mức trừ điểm nộp trễ"
                              className="m-0"
                            >
                              <InputNumber min={0} max={100} step={5} addonAfter="%" className="w-100" />
                            </Form.Item>
                          </Col>
                        </Row>
                        <div className="text-xs text-muted-color mt-2">
                          💡 Ghi chú: Bài làm nộp trong khoảng thời gian ân hạn này vẫn được hệ thống tiếp nhận nhưng sẽ được gắn cờ <strong>Nộp trễ</strong> và tự động trừ điểm theo quy định.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* CLO Mapping Card */}
              <Card
                bordered
                title={
                  <div>
                    <div className="velica-card-header-title">Ánh xạ Chuẩn đầu ra Môn học (CLO Mapping)</div>
                    <div className="velica-card-header-desc">
                      Phân bổ trọng số đóng góp của đề thi vào các mục tiêu đào tạo của học phần.
                    </div>
                  </div>
                }
                className="velica-wizard-step-card"
              >
                <div className="d-flex flex-col gap-2">
                  <div className="d-flex items-center justify-between p-2 border rounded">
                    <div>
                      <Tag color="indigo" className="font-semibold">CLO1</Tag>
                      <span className="text-xs text-secondary-color">Hiểu và áp dụng các nguyên lý SOLID & Clean Architecture</span>
                    </div>
                    <span className="font-semibold text-sm">50%</span>
                  </div>

                  <div className="d-flex items-center justify-between p-2 border rounded">
                    <div>
                      <Tag color="cyan" className="font-semibold">CLO2</Tag>
                      <span className="text-xs text-secondary-color">Thiết kế hệ thống phân tán chịu tải cao sử dụng Microservices</span>
                    </div>
                    <span className="font-semibold text-sm">30%</span>
                  </div>

                  <div className="d-flex items-center justify-between p-2 border rounded">
                    <div>
                      <Tag color="purple" className="font-semibold">CLO3</Tag>
                      <span className="text-xs text-secondary-color">Đánh giá trade-offs giữa tính sẵn sàng và tính nhất quán</span>
                    </div>
                    <span className="font-semibold text-sm">20%</span>
                  </div>
                </div>
              </Card>
            </Col>

            {/* Right Column: Exam Preview & Confirm Actions */}
            <Col xs={24} lg={10}>
              <Card
                bordered
                title={<span className="velica-card-header-title">Tóm tắt Toàn bộ Đề thi</span>}
                className="velica-wizard-step-card"
              >
                <div className="d-flex flex-col gap-3">
                  <div>
                    <Text type="secondary" className="text-xs d-block">Tiêu đề đề thi:</Text>
                    <Text strong className="fs-15 text-primary-color">{form.getFieldValue('title') || 'Chưa đặt tên'}</Text>
                  </div>

                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <div className="p-2 bg-light rounded text-center">
                        <div className="text-xs text-muted-color">Tổng số câu hỏi</div>
                        <div className="fs-16 font-bold text-primary-color">{selectedQuestions.length} câu</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="p-2 bg-light rounded text-center">
                        <div className="text-xs text-muted-color">Thang điểm chuẩn</div>
                        <div className="fs-16 font-bold text-brand-color">{targetMaxScore} điểm</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="p-2 bg-light rounded text-center">
                        <div className="text-xs text-muted-color">Thời lượng thi</div>
                        <div className="fs-16 font-bold text-primary-color">{form.getFieldValue('timeLimitMinutes')} phút</div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="p-2 bg-light rounded text-center">
                        <div className="text-xs text-muted-color">Trọng số môn học</div>
                        <div className="fs-16 font-bold text-primary-color">{form.getFieldValue('weight')}%</div>
                      </div>
                    </Col>
                  </Row>

                  <Divider className="my-2" />

                  <div className="d-flex flex-col gap-2">
                    <Button
                      type="primary"
                      size="large"
                      icon={<Check size={18} />}
                      onClick={handlePublishNow}
                      className="velica-btn-primary w-100"
                    >
                      Xuất bản & Phát hành Đề thi
                    </Button>

                    <Button
                      size="large"
                      onClick={handleSaveDraft}
                      className="velica-btn-action w-100"
                    >
                      Lưu Bản Nháp (Chỉnh sửa sau)
                    </Button>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        )}

        {/* Bottom Wizard Navigation Footer */}
        <div className="velica-wizard-footer mt-4">
          <Button
            disabled={currentStep === 0}
            onClick={handlePrev}
            icon={<ArrowLeft size={16} />}
            className="velica-btn-action"
          >
            Quay lại bước trước
          </Button>

          <Space>
            <Button onClick={handleSaveDraft} className="velica-btn-action">
              Lưu bản nháp
            </Button>

            {currentStep < 2 ? (
              <Button
                type="primary"
                onClick={handleNext}
                className="velica-btn-primary"
              >
                Tiếp theo: {stepsItems[currentStep + 1]?.title} <ArrowRight size={16} />
              </Button>
            ) : null}
          </Space>
        </div>
      </Form>

      {/* Question Detail & Solution Preview Modal */}
      <Modal
        title={
          <div className="d-flex items-center justify-between pe-4">
            <div className="d-flex items-center gap-2">
              <Eye size={18} className="text-brand-color" />
              <span className="font-bold">
                {previewQuestion && selectedQuestions.some((q) => q.id === previewQuestion.id)
                  ? `Chi tiết câu hỏi #${selectedQuestions.findIndex((q) => q.id === previewQuestion.id) + 1} trong đề`
                  : 'Chi tiết câu hỏi từ Ngân hàng'}
              </span>
            </div>

            {previewQuestion && selectedQuestions.some((q) => q.id === previewQuestion.id) && (
              <Space size="small">
                <Button
                  size="small"
                  icon={<ChevronLeft size={13} />}
                  disabled={selectedQuestions.findIndex((q) => q.id === previewQuestion.id) <= 0}
                  onClick={() => {
                    const idx = selectedQuestions.findIndex((q) => q.id === previewQuestion.id);
                    if (idx > 0) setPreviewQuestion(selectedQuestions[idx - 1]);
                  }}
                >
                  Câu trước
                </Button>
                <Button
                  size="small"
                  icon={<ChevronRight size={13} />}
                  disabled={
                    selectedQuestions.findIndex((q) => q.id === previewQuestion.id) >=
                    selectedQuestions.length - 1
                  }
                  onClick={() => {
                    const idx = selectedQuestions.findIndex((q) => q.id === previewQuestion.id);
                    if (idx < selectedQuestions.length - 1) setPreviewQuestion(selectedQuestions[idx + 1]);
                  }}
                >
                  Kế tiếp
                </Button>
              </Space>
            )}
          </div>
        }
        open={Boolean(previewQuestion)}
        onCancel={() => setPreviewQuestion(null)}
        width={760}
        footer={
          previewQuestion && (
            <div className="d-flex items-center justify-between">
              <span className="text-xs text-muted-color">
                {selectedQuestions.some((q) => q.id === previewQuestion.id)
                  ? '✓ Câu hỏi này đang có trong cấu trúc đề thi'
                  : '○ Câu hỏi này chưa có trong đề thi'}
              </span>
              <Space>
                <Button onClick={() => setPreviewQuestion(null)}>Đóng</Button>
                {selectedQuestions.some((q) => q.id === previewQuestion.id) ? (
                  <Button
                    danger
                    icon={<Trash2 size={14} />}
                    onClick={() => {
                      handleToggleSelectQuestion(previewQuestion);
                      setPreviewQuestion(null);
                    }}
                  >
                    Gỡ khỏi đề thi
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={() => {
                      handleToggleSelectQuestion(previewQuestion);
                      setPreviewQuestion(null);
                    }}
                  >
                    Thêm vào đề thi
                  </Button>
                )}
              </Space>
            </div>
          )
        }
      >
        {previewQuestion && (
          <div className="py-2">
            <div className="d-flex items-center gap-2 mb-3 flex-wrap">
              <Tag
                color={
                  previewQuestion.type === QUESTION_TYPE.MCQ
                    ? 'blue'
                    : previewQuestion.type === QUESTION_TYPE.MULTI_CHOICE
                    ? 'purple'
                    : previewQuestion.type === QUESTION_TYPE.TRUE_FALSE
                    ? 'cyan'
                    : 'orange'
                }
                className="font-semibold text-xs"
              >
                {previewQuestion.type === QUESTION_TYPE.MCQ
                  ? 'Trắc nghiệm đơn'
                  : previewQuestion.type === QUESTION_TYPE.MULTI_CHOICE
                  ? 'Nhiều lựa chọn'
                  : previewQuestion.type === QUESTION_TYPE.TRUE_FALSE
                  ? 'Đúng / Sai'
                  : 'Tự luận học thuật'}
              </Tag>
              <Tag color="geekblue" className="font-semibold text-xs">
                {getQuestionClo(previewQuestion)}
              </Tag>
              <Tag
                color={
                  previewQuestion.difficulty === 'EASY'
                    ? 'green'
                    : previewQuestion.difficulty === 'MEDIUM'
                    ? 'blue'
                    : previewQuestion.difficulty === 'HARD'
                    ? 'orange'
                    : 'red'
                }
                className="text-xs"
              >
                Độ khó: {previewQuestion.difficulty}
              </Tag>
              <Tag color="gold" className="font-semibold text-xs">
                {questionScores[previewQuestion.id] || (previewQuestion.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0)} điểm
              </Tag>
            </div>

            {/* Question Text */}
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="text-2xs text-muted-color font-bold text-uppercase mb-1">
                Nội dung đề bài câu hỏi:
              </div>
              <div className="text-sm font-semibold text-primary-color lh-base">
                <MathRenderer content={previewQuestion.content} />
              </div>
            </div>

            {/* Attached Diagram / Image */}
            {previewQuestion.imageUrl && (
              <div className="mb-3">
                <div className="text-2xs text-muted-color font-bold text-uppercase mb-1">
                  Sơ đồ / Hình ảnh minh họa:
                </div>
                <div className="border rounded-3 p-2 bg-white text-center">
                  <img
                    src={previewQuestion.imageUrl}
                    alt="Question Diagram"
                    style={{ maxHeight: 220, maxWidth: 460, objectFit: 'contain' }}
                    className="mx-auto rounded"
                  />
                </div>
              </div>
            )}

            {/* MCQ Options with Answer Indicator */}
            {previewQuestion.options && previewQuestion.options.length > 0 && (
              <div className="mb-3">
                <div className="text-2xs font-bold text-muted-color text-uppercase mb-1.5">
                  Các phương án lựa chọn:
                </div>
                <div className="d-flex flex-col gap-1.5">
                  {previewQuestion.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className={`p-2 rounded-2 border d-flex items-start gap-2 ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white'
                      }`}
                    >
                      <span className={`font-bold text-xs ${opt.isCorrect ? 'text-emerald-700' : 'text-secondary-color'}`}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span className={`text-xs flex-1 ${opt.isCorrect ? 'font-semibold text-emerald-900' : 'text-primary-color'}`}>
                        <MathRenderer content={opt.text} />
                      </span>
                      {opt.isCorrect && (
                        <Tag color="success" className="m-0 font-semibold text-2xs" icon={<Check size={11} className="align-middle me-0.5" />}>
                          Đáp án đúng
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation / Sample Answer */}
            {previewQuestion.explanation && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2">
                <div className="d-flex items-center gap-1.5 mb-1">
                  <Lightbulb size={14} className="text-amber-500" />
                  <span className="text-2xs text-sky-900 font-bold">Hướng dẫn giải & Tiêu chí chấm:</span>
                </div>
                <div className="text-xs text-sky-900 lh-base">
                  <MathRenderer content={previewQuestion.explanation} />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Browse Question Bank for Adding */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <BookOpen size={18} className="text-brand-color" />
            <span className="font-bold">
              Chọn câu hỏi từ Ngân hàng ({filteredBankQuestions.length} câu khả dụng)
            </span>
          </div>
        }
        open={bankModalOpen}
        onCancel={() => setBankModalOpen(false)}
        width={920}
        footer={[
          <Button key="close" type="primary" onClick={() => setBankModalOpen(false)}>
            Xong (Đã chọn {selectedQuestions.length} câu vào đề)
          </Button>,
        ]}
      >
        <div className="py-2">
          {/* Filter Bar */}
          <div className="p-2.5 bg-light rounded-2 border mb-3">
            <div className="d-flex items-center gap-2 mb-2 flex-wrap">
              <Input
                size="small"
                prefix={<Search size={13} className="text-muted-color" />}
                placeholder="Tìm nội dung câu hỏi..."
                value={bankSearch}
                onChange={(e) => {
                  setBankSearch(e.target.value);
                  setBankPage(1);
                }}
                allowClear
                className="flex-1 min-w-160"
              />
              <Radio.Group
                size="small"
                value={bankStatusFilter}
                onChange={(e) => {
                  setBankStatusFilter(e.target.value);
                  setBankPage(1);
                }}
              >
                <Radio.Button value="ALL">Tất cả</Radio.Button>
                <Radio.Button value="UNSELECTED">Chưa chọn</Radio.Button>
                <Radio.Button value="SELECTED">Đã chọn</Radio.Button>
              </Radio.Group>
            </div>

            <div className="d-flex items-center gap-2 flex-wrap">
              <Select
                size="small"
                value={bankCloFilter}
                onChange={(val) => {
                  setBankCloFilter(val);
                  setBankPage(1);
                }}
                style={{ width: 110 }}
              >
                <Select.Option value="ALL">Tất cả CLO</Select.Option>
                <Select.Option value="CLO1">CLO1</Select.Option>
                <Select.Option value="CLO2">CLO2</Select.Option>
                <Select.Option value="CLO3">CLO3</Select.Option>
                <Select.Option value="CLO4">CLO4</Select.Option>
              </Select>

              <Select
                size="small"
                value={bankDifficultyFilter}
                onChange={(val) => {
                  setBankDifficultyFilter(val);
                  setBankPage(1);
                }}
                style={{ width: 110 }}
              >
                <Select.Option value="ALL">Mọi độ khó</Select.Option>
                <Select.Option value="EASY">Nhận biết</Select.Option>
                <Select.Option value="MEDIUM">Thông hiểu</Select.Option>
                <Select.Option value="HARD">Vận dụng</Select.Option>
                <Select.Option value="VERY_HARD">Vận dụng cao</Select.Option>
              </Select>

              <Select
                size="small"
                value={bankTypeFilter}
                onChange={(val) => {
                  setBankTypeFilter(val);
                  setBankPage(1);
                }}
                style={{ width: 110 }}
              >
                <Select.Option value="ALL">Mọi loại</Select.Option>
                <Select.Option value={QUESTION_TYPE.MCQ}>Trắc nghiệm</Select.Option>
                <Select.Option value={QUESTION_TYPE.MULTI_CHOICE}>Nhiều đáp án</Select.Option>
                <Select.Option value={QUESTION_TYPE.TRUE_FALSE}>Đúng / Sai</Select.Option>
                <Select.Option value={QUESTION_TYPE.ESSAY}>Tự luận</Select.Option>
              </Select>

              {(bankSearch || bankDifficultyFilter !== 'ALL' || bankTypeFilter !== 'ALL' || bankCloFilter !== 'ALL' || bankStatusFilter !== 'ALL') && (
                <Button
                  size="small"
                  type="text"
                  icon={<RotateCcw size={11} />}
                  onClick={handleResetBankFilters}
                  className="text-xs p-1 h-auto text-muted-color"
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          </div>

          {/* Questions list */}
          {filteredBankQuestions.length === 0 ? (
            <div className="text-center py-5 text-muted-color">
              Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className="d-flex flex-col gap-2 max-h-400 overflow-y-auto pe-1">
              {paginatedBankQuestions.map((q) => {
                const isSelected = selectedQuestions.some((item) => item.id === q.id);
                const clo = getQuestionClo(q);

                return (
                  <div
                    key={q.id}
                    className={`p-2.5 border rounded-2 transition-all d-flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-light-brand border-brand' : 'bg-white hover-bg-light border-light'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="d-flex items-center gap-1.5 mb-1 flex-wrap">
                        <Tag color={clo === 'CLO1' ? 'indigo' : clo === 'CLO2' ? 'cyan' : 'purple'} className="velica-tag-pill font-bold text-2xs m-0">
                          {clo}
                        </Tag>
                        <Tag color={q.type === QUESTION_TYPE.MCQ ? 'blue' : q.type === QUESTION_TYPE.ESSAY ? 'magenta' : 'default'} className="velica-tag-pill text-2xs m-0">
                          {q.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm' : q.type === QUESTION_TYPE.ESSAY ? 'Tự luận' : q.type}
                        </Tag>
                        <Tag
                          color={
                            q.difficulty === 'EASY'
                              ? 'green'
                              : q.difficulty === 'MEDIUM'
                              ? 'blue'
                              : q.difficulty === 'HARD'
                              ? 'orange'
                              : 'red'
                          }
                          className="velica-tag-pill text-2xs m-0"
                        >
                          {q.difficulty}
                        </Tag>
                      </div>

                      <div className="text-xs font-medium text-primary-color line-clamp-2">
                        <MathRenderer content={q.content} />
                      </div>
                    </div>

                    <Space size="small">
                      <Button
                        size="small"
                        type="text"
                        icon={<Eye size={13} className="text-muted-color" />}
                        onClick={() => setPreviewQuestion(q)}
                      />
                      {isSelected ? (
                        <Button
                          size="small"
                          danger
                          onClick={() => handleToggleSelectQuestion(q)}
                        >
                          Gỡ
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          icon={<Plus size={12} />}
                          onClick={() => handleToggleSelectQuestion(q)}
                        >
                          + Chọn
                        </Button>
                      )}
                    </Space>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          <div className="d-flex justify-between items-center mt-3 pt-2 border-top">
            <span className="text-xs text-muted-color">
              Hiển thị {paginatedBankQuestions.length} / {filteredBankQuestions.length} câu
            </span>
            <Pagination
              current={bankPage}
              pageSize={bankPageSize}
              total={filteredBankQuestions.length}
              onChange={(page) => setBankPage(page)}
              showSizeChanger={false}
              size="small"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Matrix Statistics */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <BarChart2 size={18} className="text-brand-color" />
            <span className="font-bold">
              Ma trận Đề thi: Độ khó Bloom, Chuẩn đầu ra CLO & Định dạng
            </span>
          </div>
        }
        open={matrixModalOpen}
        onCancel={() => setMatrixModalOpen(false)}
        width={720}
        footer={[
          <Button key="close" type="primary" onClick={() => setMatrixModalOpen(false)}>
            Đóng
          </Button>,
        ]}
      >
        <div className="py-2">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card
                size="small"
                bordered
                title={
                  <span className="d-flex items-center gap-1.5 font-bold text-xs">
                    <Sliders size={14} className="text-brand-color" />
                    <span>Cấp độ nhận thức (Bloom)</span>
                  </span>
                }
              >
                <div className="d-flex flex-col gap-2">
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="green">Nhận biết</Tag>
                    <span className="font-bold">{difficultyMatrix.EASY} câu</span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="blue">Thông hiểu</Tag>
                    <span className="font-bold">{difficultyMatrix.MEDIUM} câu</span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="orange">Vận dụng</Tag>
                    <span className="font-bold">{difficultyMatrix.HARD} câu</span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="red">Vận dụng cao</Tag>
                    <span className="font-bold">{difficultyMatrix.VERY_HARD} câu</span>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                size="small"
                bordered
                title={
                  <span className="d-flex items-center gap-1.5 font-bold text-xs">
                    <Award size={14} className="text-brand-color" />
                    <span>Chuẩn đầu ra (CLO)</span>
                  </span>
                }
              >
                <div className="d-flex flex-col gap-2">
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="indigo">CLO1</Tag>
                    <span className="font-bold">{cloMatrix.CLO1} câu</span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="cyan">CLO2</Tag>
                    <span className="font-bold">{cloMatrix.CLO2} câu</span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="purple">CLO3</Tag>
                    <span className="font-bold">{cloMatrix.CLO3} câu</span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="geekblue">CLO4</Tag>
                    <span className="font-bold">{(selectedQuestions.filter(q => getQuestionClo(q) === 'CLO4').length)} câu</span>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} md={8}>
              <Card
                size="small"
                bordered
                title={
                  <span className="d-flex items-center gap-1.5 font-bold text-xs">
                    <FileText size={14} className="text-brand-color" />
                    <span>Định dạng câu hỏi</span>
                  </span>
                }
              >
                <div className="d-flex flex-col gap-2">
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="geekblue">Trắc nghiệm</Tag>
                    <span className="font-bold">
                      {typeMatrix.MCQ + typeMatrix.MULTI_CHOICE + typeMatrix.TRUE_FALSE + typeMatrix.FILL_BLANK} câu
                    </span>
                  </div>
                  <div className="d-flex justify-between items-center text-xs">
                    <Tag color="magenta">Tự luận</Tag>
                    <span className="font-bold">{typeMatrix.ESSAY} câu</span>
                  </div>
                  <Divider className="my-1" />
                  <div className="d-flex justify-between items-center text-xs text-muted-color">
                    <span>Tổng số:</span>
                    <span className="font-bold text-primary-color">{selectedQuestions.length} câu</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      </Modal>

      {/* Modal Random Exam Generator */}
      <RandomExamGeneratorModal
        open={randomGeneratorOpen}
        onClose={() => setRandomGeneratorOpen(false)}
        bankQuestions={bankQuestions}
        targetMaxScore={targetMaxScore}
        onApply={(result) => {
          setSelectedQuestions(result.questions);
          setQuestionScores(result.scores);
          setViewMode('LIST');
          message.success(
            `Đã áp dụng thành công ${result.questions.length} câu hỏi ngẫu nhiên chuẩn ma trận CLO & Độ khó vào đề thi!`
          );
        }}
      />
    </div>
  );
};

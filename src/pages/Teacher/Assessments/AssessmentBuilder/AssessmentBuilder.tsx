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
  Dropdown,
  Popconfirm,
  Tabs,
  Checkbox,
  Segmented,
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
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Scale,
  BookOpen,
  Lightbulb,
  Award,
  ClipboardList,
  Edit3,
  Database,
  PlusCircle,
  FileQuestion,
  Paperclip,
  X,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../../api/mocks/mockService';
import {
  Assessment,
  ClassRoom,
  Question,
  QuestionOption,
  Syllabus,
  SubmissionFormat,
  FileConstraintConfig,
  RubricPreset,
  EvaluationType,
  QuestionGradingConfig,
} from '../../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../../router/constants/routePaths';
import {
  ASSESSMENT_STATUS,
  ASSESSMENT_TYPE,
  QUESTION_TYPE,
  SUBMISSION_FORMAT,
  EVALUATION_TYPE,
} from '../../../../constants/assessmentConstants';
import { MathRenderer } from '../../../../components/velica/MathRenderer/MathRenderer';
import { MathFormulaToolbar } from '../../../../components/velica/MathRenderer/MathFormulaToolbar';
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

  // Step 2 UI state
  const [showAnswersInList, setShowAnswersInList] = useState(true);
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionModalTab, setQuestionModalTab] = useState<'compose' | 'bank'>('compose');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionIndex, setEditQuestionIndex] = useState<number | null>(null);
  const [matrixModalOpen, setMatrixModalOpen] = useState(false);

  // Rubrics State & Preview Modal
  const [rubricPresets, setRubricPresets] = useState<RubricPreset[]>([]);
  const [previewRubricModalOpen, setPreviewRubricModalOpen] = useState(false);
  const [activePreviewRubric, setActivePreviewRubric] = useState<RubricPreset | null>(null);

  const [form] = Form.useForm();
  const [questionForm] = Form.useForm();
  const watchedQuestionType = Form.useWatch('type', questionForm) || QUESTION_TYPE.MCQ;
  const watchedQuestionContent = Form.useWatch('content', questionForm) || '';
  const watchedSubmissionFormat = Form.useWatch('submissionFormat', questionForm) || SubmissionFormat.PLAINTEXT;

  const watchedEvaluationType =
    Form.useWatch(['gradingConfig', 'evaluationType'], questionForm) ||
    EVALUATION_TYPE.MANUAL_GUIDELINE;
  const watchedRubricId = Form.useWatch(['gradingConfig', 'rubricId'], questionForm);
  const selectedRubric = rubricPresets.find((r) => r.id === watchedRubricId);

  const targetMaxScore = Form.useWatch('maxScore', form) || 10;
  const watchedLatePolicyEnabled = Form.useWatch('latePolicyEnabled', form) ?? true;
  const watchedType = Form.useWatch('type', form);

  // Watch classId & syllabus category mapping
  const watchedClassId = Form.useWatch('classId', form);
  const watchedCategory = Form.useWatch('category', form);
  const selectedClass = classes.find((c) => c.id === watchedClassId);
  const currentClassSyllabus = syllabi.find((s) => s.id === selectedClass?.syllabusId);
  const syllabusAssessmentItems = currentClassSyllabus?.assessments || [];
  const activeSyllabusAssessmentItem = syllabusAssessmentItems.find(
    (item) => item.category === watchedCategory
  );

  // Inline Add Question states (below last question)
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [inlineAddTab, setInlineAddTab] = useState<'bank' | 'compose'>('bank');
  const [inlineComposeForm] = Form.useForm();

  // Non-random Swap Question modal state
  const [swapModalState, setSwapModalState] = useState<{
    open: boolean;
    questionIndex: number | null;
    targetQuestion: Question | null;
  }>({ open: false, questionIndex: null, targetQuestion: null });

  const refreshRubricPresets = async () => {
    try {
      const rs = await mockService.getRubricPresets();
      setRubricPresets(rs);
      message.success('Đã cập nhật danh sách Rubric mới nhất từ Ngân hàng Khảo thí!');
    } catch {
      message.error('Không thể tải danh sách Rubric.');
    }
  };

  // Helper to map question to CLO
  const getQuestionClo = (q: Question) => {
    if (q.cloId) return q.cloId;
    if (q.lessonId === 'les-1') return 'CLO1';
    if (q.lessonId === 'les-2') return 'CLO2';
    if (q.lessonId === 'les-3') return 'CLO3';
    return 'CLO1';
  };

  // Redirect to create Rubric without opening a new tab, saving draft in sessionStorage
  const handleCreateRubricRedirect = () => {
    try {
      const draft = {
        assessmentFormValues: form.getFieldsValue(true),
        selectedQuestions,
        questionScores,
        currentStep: 1, // Step 2: Ma trận & Gán điểm
        questionDraft: {
          isEditing: Boolean(editingQuestion),
          editQuestionIndex,
          editingQuestionId: editingQuestion?.id,
          formValues: questionForm.getFieldsValue(true),
        },
        savedAt: new Date().toISOString(),
      };
      sessionStorage.setItem('velica_assessment_builder_draft', JSON.stringify(draft));

      const currentUrl = window.location.pathname + window.location.search;
      navigate(`/teacher/rubrics/create?returnUrl=${encodeURIComponent(currentUrl)}&source=assessment_builder`);
    } catch (e) {
      console.error('Failed to save assessment builder draft:', e);
      navigate(ROUTE_PATHS.TEACHER.RUBRICS_CREATE);
    }
  };

  useEffect(() => {
    const init = async () => {
      const [clsList, sylList, qList, allAsm, rList] = await Promise.all([
        mockService.getClasses(),
        mockService.getSyllabi(),
        mockService.getQuestions(),
        mockService.getAssessments(),
        mockService.getRubricPresets(),
      ]);
      setClasses(clsList);
      setSyllabi(sylList);
      setBankQuestions(qList);
      setRubricPresets(rList);

      if (id) {
        const found = allAsm.find((a) => a.id === id);
        if (found) {
          setIsLocked(found.status === ASSESSMENT_STATUS.PUBLISHED);
          const foundClass = clsList.find((c) => c.id === found.classId);
          const foundSyllabus = sylList.find((s) => s.id === foundClass?.syllabusId);
          const initialCategory = found.category || foundSyllabus?.assessments?.[0]?.category || 'Assignment (Bài tập lớn)';
          const categoryWeight = foundSyllabus?.assessments?.find((a) => a.category === initialCategory)?.weight || found.weight || 20;

          form.setFieldsValue({
            title: found.title,
            classId: found.classId,
            category: initialCategory,
            type: found.type,
            weight: categoryWeight,
            instructions: found.instructions,
            description: found.description,
            maxScore: 10,
            scoreScale: 10,
            timeLimitMinutes: found.timeLimitMinutes || 45,
            maxAttempts: found.maxAttempts || 1,
            shuffleQuestions: found.shuffleQuestions ?? true,
            shuffleAnswers: found.shuffleAnswers ?? true,
            allowBackNavigation: found.allowBackNavigation ?? true,
            submissionMode: 'ONLINE_TEXT',
            allowedFileExtensions: ['.pdf', '.docx', '.zip'],
            maxFileSizeMB: 25,
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
        const newClassId = queryClassId || clsList[0]?.id;
        const newClass = clsList.find((c) => c.id === newClassId);
        const newSyllabus = sylList.find((s) => s.id === newClass?.syllabusId);
        const firstCategory = newSyllabus?.assessments?.[0];

        form.setFieldsValue({
          title: '',
          classId: newClassId,
          category: firstCategory?.category || 'Assignment (Bài tập lớn)',
          type: ASSESSMENT_TYPE.MIDTERM,
          weight: firstCategory?.weight || 20,
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

      // Check if returning from Rubric Creator (via round-trip navigation)
      const appliedRubricId = searchParams.get('appliedRubricId');
      const isCancelledRubric = searchParams.get('cancelledRubric');

      if (appliedRubricId || isCancelledRubric) {
        try {
          const draftRaw = sessionStorage.getItem('velica_assessment_builder_draft');
          if (draftRaw) {
            const draft = JSON.parse(draftRaw);
            sessionStorage.removeItem('velica_assessment_builder_draft');

            if (draft.assessmentFormValues) {
              form.setFieldsValue(draft.assessmentFormValues);
            }
            if (draft.selectedQuestions) {
              setSelectedQuestions(draft.selectedQuestions);
            }
            if (draft.questionScores) {
              setQuestionScores(draft.questionScores);
            }
            if (typeof draft.currentStep === 'number') {
              setCurrentStep(draft.currentStep);
            }

            // Restore Question Modal & Draft values
            if (draft.questionDraft) {
              const qd = draft.questionDraft;
              setQuestionModalTab('compose');
              setQuestionModalOpen(true);

              if (qd.isEditing) {
                const matched = (draft.selectedQuestions || []).find((q: Question) => q.id === qd.editingQuestionId);
                setEditingQuestion(matched || null);
                setEditQuestionIndex(qd.editQuestionIndex);
              } else {
                setEditingQuestion(null);
                setEditQuestionIndex(null);
              }

              // Hydrate questionForm fields
              questionForm.setFieldsValue(qd.formValues);

              if (appliedRubricId) {
                const targetRubric = rList.find((r) => r.id === appliedRubricId);
                questionForm.setFieldsValue({
                  gradingConfig: {
                    evaluationType: EVALUATION_TYPE.RUBRIC,
                    rubricId: appliedRubricId,
                    rubricDetail: targetRubric,
                  },
                });
                message.success(
                  `Đã tạo thành công và tự động áp dụng Rubric "${targetRubric?.title || 'mới'}" vào câu hỏi!`
                );
              } else if (isCancelledRubric) {
                message.info('Đã quay lại câu hỏi tự luận đang soạn dở.');
              }
            }

            // Clean query parameters from URL so F5 doesn't re-trigger
            navigate(window.location.pathname + (id ? '' : queryClassId ? `?classId=${queryClassId}` : ''), {
              replace: true,
            });
          }
        } catch (err) {
          console.error('Error hydrating draft from sessionStorage:', err);
        }
      }
    };
    init();
  }, [id, form, queryClassId, searchParams, navigate]);

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

  // Đổi câu hỏi: Mở Modal chọn câu hỏi thay thế cùng độ khó từ ngân hàng, loại trừ các câu đã có
  const handleOpenSwapModal = (index: number, q: Question) => {
    if (isLocked) {
      message.warning('Đề thi đã xuất bản, không thể thay đổi!');
      return;
    }
    setSwapModalState({
      open: true,
      questionIndex: index,
      targetQuestion: q,
    });
  };

  const handleSelectSwapQuestion = (replacement: Question) => {
    if (swapModalState.questionIndex === null || !swapModalState.targetQuestion) return;
    const index = swapModalState.questionIndex;
    const targetQ = swapModalState.targetQuestion;

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

    setSwapModalState({ open: false, questionIndex: null, targetQuestion: null });
    message.success(`Đã đổi câu #${index + 1} sang câu hỏi mới từ ngân hàng!`);
  };

  // Inline Add: Thêm câu hỏi nhanh từ ngân hàng câu hỏi
  const handleInlineAddFromBank = (q: Question) => {
    if (isLocked) return;
    if (selectedQuestions.some((item) => item.id === q.id)) {
      message.warning('Câu hỏi này đã có trong đề thi!');
      return;
    }
    setSelectedQuestions((prev) => [...prev, q]);
    setQuestionScores((prev) => ({
      ...prev,
      [q.id]: q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0,
    }));
    message.success(`Đã thêm câu hỏi vào cuối đề thi!`);
  };

  // Inline Add: Soạn câu hỏi mới trực tiếp
  const handleSaveInlineComposedQuestion = async () => {
    try {
      const values = await inlineComposeForm.validateFields();
      const newId = `q-inline-${Date.now()}`;

      let options = undefined;
      if (values.type === QUESTION_TYPE.MCQ || values.type === QUESTION_TYPE.MULTI_CHOICE) {
        options = (values.options || []).map((opt: any, oIdx: number) => ({
          id: `opt-${oIdx + 1}`,
          text: opt.text || '',
          isCorrect: Boolean(opt.isCorrect),
        }));
      } else if (values.type === QUESTION_TYPE.TRUE_FALSE) {
        options = [
          { id: 'opt-tf-1', text: 'Đúng (True)', isCorrect: values.tfCorrect === 'TRUE' },
          { id: 'opt-tf-2', text: 'Sai (False)', isCorrect: values.tfCorrect === 'FALSE' },
        ];
      }

      const now = new Date().toISOString();
      const newQ: Question = {
        id: newId,
        content: values.content,
        type: values.type,
        difficulty: values.difficulty || 'MEDIUM',
        cloId: values.cloId || 'CLO1',
        options,
        explanation: values.explanation || '',
        submissionFormat: SubmissionFormat.PLAINTEXT,
        createdAt: now,
        updatedAt: now,
      };

      setSelectedQuestions((prev) => [...prev, newQ]);
      setQuestionScores((prev) => ({
        ...prev,
        [newId]: values.points || (values.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0),
      }));

      inlineComposeForm.resetFields();
      message.success('Đã tạo và thêm câu hỏi mới vào cuối đề thi!');
    } catch {
      // Form validation failed
    }
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

  const handleOpenAddQuestion = () => {
    if (isLocked) {
      message.warning('Đề thi đã xuất bản, không thể thay đổi danh sách câu hỏi!');
      return;
    }
    setShowInlineAdd(true);
    setTimeout(() => {
      const el = document.getElementById('velica-inline-add-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleOpenEditQuestion = (q: Question, index: number) => {
    if (isLocked) {
      message.warning('Đề thi đã xuất bản, không thể thay đổi câu hỏi!');
      return;
    }
    setEditingQuestion(q);
    setEditQuestionIndex(index);
    questionForm.resetFields();
    const isTF = q.type === QUESTION_TYPE.TRUE_FALSE;
    const tfCorrectVal = isTF && q.options ? (q.options[0]?.isCorrect ? 'TRUE' : 'FALSE') : 'TRUE';

    // Resolve grading config
    let initialGradingConfig: QuestionGradingConfig = {
      evaluationType: EVALUATION_TYPE.MANUAL_GUIDELINE,
      manualGuideline: q.explanation || '',
      rubricId: q.rubricId,
    };

    if (q.gradingConfig) {
      initialGradingConfig = { ...q.gradingConfig };
    } else if (q.rubricId) {
      initialGradingConfig = {
        evaluationType: EVALUATION_TYPE.RUBRIC,
        rubricId: q.rubricId,
        manualGuideline: q.explanation || '',
      };
    } else {
      initialGradingConfig = {
        evaluationType: EVALUATION_TYPE.MANUAL_GUIDELINE,
        manualGuideline: q.explanation || '',
      };
    }

    if (initialGradingConfig.rubricId) {
      const foundRubric = rubricPresets.find((r) => r.id === initialGradingConfig.rubricId);
      if (foundRubric) {
        initialGradingConfig.rubricDetail = foundRubric;
      }
    }

    questionForm.setFieldsValue({
      type: q.type || QUESTION_TYPE.MCQ,
      difficulty: q.difficulty || 'MEDIUM',
      cloId: q.cloId || getQuestionClo(q),
      points: questionScores[q.id] || (q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0),
      content: q.content || '',
      imageUrl: q.imageUrl || '',
      explanation: q.explanation || '',
      tfCorrect: tfCorrectVal,
      submissionFormat: q.submissionFormat || SubmissionFormat.PLAINTEXT,
      fileConstraint: {
        allowedExtensions: q.fileConstraint?.allowedExtensions || ['.pdf', '.docx', '.zip'],
        maxFileSizeMb: q.fileConstraint?.maxFileSizeMb || 10,
        maxFilesCount: q.fileConstraint?.maxFilesCount || 1,
      },
      gradingConfig: initialGradingConfig,
      options:
        q.options && q.options.length > 0
          ? q.options.map((opt, i) => ({
              id: opt.id || `opt-${i + 1}`,
              text: opt.text,
              isCorrect: opt.isCorrect,
            }))
          : [
              { id: 'opt-1', text: '', isCorrect: true },
              { id: 'opt-2', text: '', isCorrect: false },
              { id: 'opt-3', text: '', isCorrect: false },
              { id: 'opt-4', text: '', isCorrect: false },
            ],
    });
    setQuestionModalTab('compose');
    setQuestionModalOpen(true);
  };

  const handleAddOption = () => {
    const opts = questionForm.getFieldValue('options') || [];
    questionForm.setFieldsValue({
      options: [
        ...opts,
        { id: `opt-${opts.length + 1}`, text: '', isCorrect: false },
      ],
    });
  };

  const handleInsertMathSnippet = (snippet: string) => {
    const current = questionForm.getFieldValue('content') || '';
    questionForm.setFieldsValue({
      content: current ? `${current} ${snippet}` : snippet,
    });
  };

  const handleSaveQuestion = async () => {
    try {
      const values = await questionForm.validateFields();
      const score = Number(values.points) || (values.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0);

      let finalOptions: QuestionOption[] | undefined = undefined;
      if (values.type === QUESTION_TYPE.MCQ || values.type === QUESTION_TYPE.MULTI_CHOICE) {
        const formattedOpts: QuestionOption[] = (values.options || []).map((opt: any, idx: number) => ({
          id: opt.id || `opt-${idx + 1}`,
          text: opt.text || '',
          isCorrect: !!opt.isCorrect,
        }));
        const hasCorrect = formattedOpts.some((opt) => opt.isCorrect);
        if (!hasCorrect) {
          message.error('Vui lòng chọn ít nhất 1 đáp án đúng cho câu hỏi!');
          return;
        }
        finalOptions = formattedOpts;
      } else if (values.type === QUESTION_TYPE.TRUE_FALSE) {
        finalOptions = [
          { id: 'opt-tf-1', text: 'Đúng (True)', isCorrect: values.tfCorrect === 'TRUE' },
          { id: 'opt-tf-2', text: 'Sai (False)', isCorrect: values.tfCorrect === 'FALSE' },
        ];
      }

      let essaySubmissionFormat: SubmissionFormat | undefined = undefined;
      let essayFileConstraint: FileConstraintConfig | undefined = undefined;
      let essayGradingConfig: QuestionGradingConfig | undefined = undefined;
      let finalExplanation: string | undefined = values.explanation || undefined;
      let finalRubricId: string | undefined = undefined;

      if (values.type === QUESTION_TYPE.ESSAY) {
        essaySubmissionFormat = values.submissionFormat || SubmissionFormat.PLAINTEXT;
        if (
          essaySubmissionFormat === SubmissionFormat.FILE_UPLOAD ||
          essaySubmissionFormat === SubmissionFormat.HYBRID
        ) {
          essayFileConstraint = {
            allowedExtensions:
              values.fileConstraint?.allowedExtensions && values.fileConstraint.allowedExtensions.length > 0
                ? values.fileConstraint.allowedExtensions
                : ['.pdf', '.docx', '.zip'],
            maxFileSizeMb: Number(values.fileConstraint?.maxFileSizeMb) || 10,
            maxFilesCount: Number(values.fileConstraint?.maxFilesCount) || 1,
          };
        }

        const evalType: EvaluationType =
          values.gradingConfig?.evaluationType || EVALUATION_TYPE.MANUAL_GUIDELINE;

        if (evalType === EVALUATION_TYPE.RUBRIC) {
          const selectedR = rubricPresets.find((r) => r.id === values.gradingConfig?.rubricId);
          finalRubricId = values.gradingConfig?.rubricId;
          essayGradingConfig = {
            evaluationType: EVALUATION_TYPE.RUBRIC,
            rubricId: finalRubricId,
            rubricDetail: selectedR,
          };
          if (selectedR) {
            finalExplanation = `Theo Rubric: ${selectedR.title} (${selectedR.criteria.length} tiêu chí)`;
          }
        } else {
          const manualText = values.gradingConfig?.manualGuideline || values.explanation || '';
          essayGradingConfig = {
            evaluationType: EVALUATION_TYPE.MANUAL_GUIDELINE,
            manualGuideline: manualText,
          };
          finalExplanation = manualText;
        }
      }

      if (editingQuestion) {
        // Edit existing question
        const updatedQ: Question = {
          ...editingQuestion,
          content: values.content,
          type: values.type,
          difficulty: values.difficulty,
          cloId: values.cloId,
          imageUrl: values.imageUrl || undefined,
          explanation: finalExplanation,
          rubricId: finalRubricId,
          gradingConfig: essayGradingConfig,
          options: finalOptions,
          submissionFormat: essaySubmissionFormat,
          fileConstraint: essayFileConstraint,
          updatedAt: new Date().toISOString(),
        };

        setSelectedQuestions((prev) =>
          prev.map((item, idx) =>
            idx === editQuestionIndex || item.id === editingQuestion.id ? updatedQ : item
          )
        );
        setQuestionScores((prev) => ({
          ...prev,
          [editingQuestion.id]: score,
        }));
        message.success('Đã cập nhật câu hỏi thành công!');
      } else {
        // Create new question
        const newQ: Question = {
          id: `q-custom-${Date.now()}`,
          content: values.content,
          type: values.type,
          difficulty: values.difficulty,
          cloId: values.cloId,
          imageUrl: values.imageUrl || undefined,
          explanation: finalExplanation,
          rubricId: finalRubricId,
          gradingConfig: essayGradingConfig,
          options: finalOptions,
          submissionFormat: essaySubmissionFormat,
          fileConstraint: essayFileConstraint,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setSelectedQuestions((prev) => [...prev, newQ]);
        setQuestionScores((prev) => ({
          ...prev,
          [newQ.id]: score,
        }));
        setBankQuestions((prev) => [newQ, ...prev]);
        message.success('Đã thêm câu hỏi tự soạn vào đề thi!');
      }

      setQuestionModalOpen(false);
      setEditingQuestion(null);
      setEditQuestionIndex(null);
    } catch {
      // validation error
    }
  };

  const renderQuestionForm = (isEdit: boolean) => (
    <div className="py-2">
      {isEdit ? (
        <div className="d-flex items-center gap-2 mb-3 p-2.5 bg-light-brand border border-brand rounded-2 text-xs text-brand-color">
          <Lightbulb size={16} className="flex-shrink-0" />
          <span>
            Bạn đang chỉnh sửa câu hỏi này trực tiếp trong bài thi. Các thay đổi về nội dung, đáp án và điểm sẽ được áp dụng ngay lập tức cho bài thi này.
          </span>
        </div>
      ) : (
        <div className="d-flex items-center gap-2 mb-3 p-2.5 bg-light rounded-2 text-xs text-muted-color border">
          <Lightbulb size={15} className="text-brand-color flex-shrink-0" />
          <span>
            Soạn thảo câu hỏi mới với công thức Toán/LaTeX, phân loại Bloom và chuẩn CLO. Câu hỏi sẽ được thêm vào bài thi và lưu vào ngân hàng đề.
          </span>
        </div>
      )}

      <Form form={questionForm} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="type" label="Loại câu hỏi" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'Trắc nghiệm đơn', value: QUESTION_TYPE.MCQ },
                  { label: 'Nhiều lựa chọn', value: QUESTION_TYPE.MULTI_CHOICE },
                  { label: 'Đúng / Sai', value: QUESTION_TYPE.TRUE_FALSE },
                  { label: 'Tự luận', value: QUESTION_TYPE.ESSAY },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="difficulty" label="Mức độ Bloom" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'Nhận biết (Easy)', value: 'EASY' },
                  { label: 'Thông hiểu (Medium)', value: 'MEDIUM' },
                  { label: 'Vận dụng (Hard)', value: 'HARD' },
                  { label: 'Vận dụng cao (Very Hard)', value: 'VERY_HARD' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="cloId" label="Chuẩn đầu ra (CLO)" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'CLO1 - Kiến thức nền tảng', value: 'CLO1' },
                  { label: 'CLO2 - Phân tích & Áp dụng', value: 'CLO2' },
                  { label: 'CLO3 - Thiết kế hệ thống', value: 'CLO3' },
                  { label: 'CLO4 - Đánh giá & Tối ưu', value: 'CLO4' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="points" label="Điểm số câu này" rules={[{ required: true }]}>
              <InputNumber min={0.25} max={10} step={0.25} addonAfter="đ" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="content"
          label="Nội dung câu hỏi (hỗ trợ công thức LaTeX / Toán)"
          rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi' }]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Nhập nội dung câu hỏi... Ví dụ: Cho biểu thức $E = mc^2$..."
          />
        </Form.Item>

        <MathFormulaToolbar onInsert={handleInsertMathSnippet} />

        {watchedQuestionContent && (
          <div className="mb-3 p-2.5 rounded-2 bg-light border">
            <div className="text-2xs text-muted-color font-semibold mb-1">XEM TRƯỚC HIỂN THỊ CÔNG THỨC:</div>
            <div className="text-sm font-semibold text-primary-color">
              <MathRenderer content={watchedQuestionContent} />
            </div>
          </div>
        )}

        <Form.Item name="imageUrl" label="Ảnh sơ đồ / Kiến trúc đính kèm (URL - tùy chọn)">
          <Input placeholder="https://example.com/diagram.png" prefix={<ImageIcon size={14} className="text-muted-color" />} />
        </Form.Item>

        {(watchedQuestionType === QUESTION_TYPE.MCQ || watchedQuestionType === QUESTION_TYPE.MULTI_CHOICE) && (
          <div className="mb-3 p-3 bg-white border rounded-2">
            <div className="d-flex items-center justify-between mb-2">
              <span className="font-semibold text-sm text-primary-color">
                Danh sách các đáp án ({watchedQuestionType === QUESTION_TYPE.MCQ ? 'Chọn 1 đáp án đúng' : 'Có thể chọn nhiều đáp án đúng'}):
              </span>
              <Button size="small" type="dashed" icon={<Plus size={13} />} onClick={handleAddOption}>
                Thêm đáp án
              </Button>
            </div>

            <Form.List name="options">
              {(fields, { remove }) => (
                <div className="d-flex flex-col gap-2">
                  {fields.map((field, index) => (
                    <div key={field.key} className="d-flex items-center gap-2">
                      <span className="font-bold text-xs bg-light px-2 py-1.5 rounded border text-secondary-color" style={{ width: 28, textAlign: 'center' }}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <Form.Item
                        {...field}
                        name={[field.name, 'text']}
                        noStyle
                        rules={[{ required: true, message: 'Nhập nội dung đáp án' }]}
                      >
                        <Input placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + index)}`} className="flex-1" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'isCorrect']}
                        valuePropName="checked"
                        noStyle
                      >
                        <Checkbox
                          onChange={(e) => {
                            if (watchedQuestionType === QUESTION_TYPE.MCQ && e.target.checked) {
                              const opts = questionForm.getFieldValue('options') || [];
                              opts.forEach((o: any, idx: number) => {
                                o.isCorrect = idx === index;
                              });
                              questionForm.setFieldsValue({ options: [...opts] });
                            }
                          }}
                        >
                          <span className="text-xs font-semibold text-emerald-700">Đúng</span>
                        </Checkbox>
                      </Form.Item>
                      {fields.length > 2 && (
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<Trash2 size={13} />}
                          onClick={() => remove(field.name)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Form.List>
          </div>
        )}

        {watchedQuestionType === QUESTION_TYPE.TRUE_FALSE && (
          <Form.Item name="tfCorrect" label="Đáp án đúng" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio.Button value="TRUE">Đúng (True)</Radio.Button>
              <Radio.Button value="FALSE">Sai (False)</Radio.Button>
            </Radio.Group>
          </Form.Item>
        )}


        {/* Khối cấu hình Phương thức đánh giá & Hướng dẫn chấm - Dành riêng cho câu hỏi Tự luận (ESSAY) */}
        {watchedQuestionType === QUESTION_TYPE.ESSAY ? (
          <div className="mb-3 p-3 bg-light rounded-3 border">
            <div className="d-flex items-center justify-between flex-wrap gap-2 mb-1">
              <div className="font-semibold text-sm text-primary-color d-flex items-center gap-2">
                <Award size={16} className="text-brand-color" />
                Phương thức đánh giá & Hướng dẫn chấm
              </div>
              <Tag color={watchedEvaluationType === EVALUATION_TYPE.RUBRIC ? 'purple' : 'blue'} className="m-0 font-medium text-xs">
                {watchedEvaluationType === EVALUATION_TYPE.RUBRIC ? 'Thang Rubric chuẩn' : 'Hướng dẫn thủ công'}
              </Tag>
            </div>
            <div className="text-xs text-muted-color mb-3">
              Quy định hình thức đánh giá và barem chấm điểm cho giảng viên và sinh viên (tự nhập hướng dẫn chi tiết hoặc áp dụng Rubric mẫu từ Ngân hàng Khảo thí).
            </div>

            {/* Mode Selector */}
            <Form.Item name={['gradingConfig', 'evaluationType']} className="mb-3">
              <Radio.Group className="w-100">
                <Row gutter={[12, 12]}>
                  <Col xs={24} sm={12}>
                    <div
                      className={`p-2.5 border rounded-2 cursor-pointer transition-all d-flex items-center gap-2 ${
                        watchedEvaluationType === EVALUATION_TYPE.MANUAL_GUIDELINE
                          ? 'border-primary bg-white shadow-xs'
                          : 'bg-white'
                      }`}
                      onClick={() =>
                        questionForm.setFieldValue(['gradingConfig', 'evaluationType'], EVALUATION_TYPE.MANUAL_GUIDELINE)
                      }
                    >
                      <Radio value={EVALUATION_TYPE.MANUAL_GUIDELINE} className="font-semibold text-xs">
                        Tự nhập hướng dẫn (Manual Text)
                      </Radio>
                    </div>
                  </Col>

                  <Col xs={24} sm={12}>
                    <div
                      className={`p-2.5 border rounded-2 cursor-pointer transition-all d-flex items-center gap-2 ${
                        watchedEvaluationType === EVALUATION_TYPE.RUBRIC
                          ? 'border-primary bg-white shadow-xs'
                          : 'bg-white'
                      }`}
                      onClick={() =>
                        questionForm.setFieldValue(['gradingConfig', 'evaluationType'], EVALUATION_TYPE.RUBRIC)
                      }
                    >
                      <Radio value={EVALUATION_TYPE.RUBRIC} className="font-semibold text-xs">
                        Chọn Rubric mẫu có sẵn (Preset Rubric)
                      </Radio>
                    </div>
                  </Col>
                </Row>
              </Radio.Group>
            </Form.Item>

            {/* Mode 1: Manual Guideline */}
            {watchedEvaluationType === EVALUATION_TYPE.MANUAL_GUIDELINE && (
              <div className="p-3 bg-white rounded-2 border">
                <Form.Item
                  name={['gradingConfig', 'manualGuideline']}
                  label={
                    <span className="text-xs font-semibold text-primary-color">
                      Nội dung hướng dẫn chấm chi tiết:
                    </span>
                  }
                  style={{ marginBottom: 24 }}
                  tooltip="Mô tả tiêu chí chấm điểm, các ý chính và barem điểm từng ý (tối đa 2000 ký tự)"
                >
                  <Input.TextArea
                    rows={4}
                    maxLength={2000}
                    showCount
                    placeholder="Mô tả tiêu chí chấm điểm, các ý chính và barem điểm từng ý... Ví dụ:&#10;- Ý 1: Trình bày đúng khái niệm & nguyên lý (1.0đ)&#10;- Ý 2: Phân tích ưu nhược điểm và ví dụ áp dụng (2.0đ)&#10;- Ý 3: Đề xuất giải pháp và trade-off (1.0đ)..."
                  />
                </Form.Item>
                <div
                  className="d-flex items-center justify-between text-2xs text-muted-color pt-2"
                  style={{ clear: 'both', marginTop: 12, borderTop: '1px dashed #f0f0f0' }}
                >
                  <span>Hỗ trợ công thức LaTeX ($công_thức$).</span>
                  <Button
                    size="small"
                    type="link"
                    className="p-0 h-auto text-2xs text-brand-color font-medium"
                    onClick={() => {
                      const cur = questionForm.getFieldValue(['gradingConfig', 'manualGuideline']) || '';
                      const sample = `${cur ? cur + '\n' : ''}• Tiêu chí 1: Nắm vững nguyên lý cốt lõi (40% điểm)\n• Tiêu chí 2: Trình bày giải pháp logic & sạch sẽ (30% điểm)\n• Tiêu chí 3: Đánh giá trade-offs & tối ưu (30% điểm)`;
                      questionForm.setFieldValue(['gradingConfig', 'manualGuideline'], sample);
                    }}
                  >
                    + Chèn dàn ý barem mẫu
                  </Button>
                </div>
              </div>
            )}

            {/* Mode 2: Preset Rubric */}
            {watchedEvaluationType === EVALUATION_TYPE.RUBRIC && (
              <div className="p-3 bg-white rounded-2 border">
                <div className="d-flex items-center justify-between flex-wrap gap-2 mb-2">
                  <span className="text-xs font-semibold text-primary-color">
                    Chọn thang tiêu chí Rubric từ Ngân hàng Khảo thí:
                  </span>
                  <Space size="small">
                    <Button
                      size="small"
                      type="link"
                      icon={<Eye size={13} />}
                      disabled={!watchedRubricId}
                      className="p-0 h-auto text-xs"
                      onClick={() => {
                        const target = rubricPresets.find((r) => r.id === watchedRubricId);
                        if (target) {
                          setActivePreviewRubric(target);
                          setPreviewRubricModalOpen(true);
                        }
                      }}
                    >
                      Xem trước ma trận
                    </Button>
                    <Divider type="vertical" className="m-0" />
                    <Button
                      size="small"
                      type="link"
                      icon={<Plus size={13} />}
                      className="p-0 h-auto text-xs font-semibold text-brand-color"
                      onClick={handleCreateRubricRedirect}
                      title="Chuyển sang trang tạo Rubric của Ngân hàng Khảo thí (tự động quay lại và gắn Rubric sau khi lưu)"
                    >
                      + Tạo Rubric mới
                    </Button>
                    <Divider type="vertical" className="m-0" />
                    <Tooltip title="Làm mới danh sách Rubric từ Ngân hàng Khảo thí">
                      <Button
                        size="small"
                        type="text"
                        icon={<RefreshCw size={12} />}
                        onClick={refreshRubricPresets}
                      />
                    </Tooltip>
                  </Space>
                </div>

                <Form.Item
                  name={['gradingConfig', 'rubricId']}
                  rules={[{ required: true, message: 'Vui lòng chọn 1 thang Rubric cho câu hỏi tự luận' }]}
                  className="mb-2"
                >
                  <Select
                    showSearch
                    placeholder="Tìm kiếm và chọn Rubric theo tên hoặc mã môn học..."
                    optionFilterProp="label"
                    options={rubricPresets.map((r) => ({
                      value: r.id,
                      label: `${r.title} — ${r.criteria?.length || 0} tiêu chí [${r.courseSubjectId || 'Chung'}]`,
                    }))}
                  />
                </Form.Item>

                {/* Card Preview when a Rubric is selected */}
                {selectedRubric ? (
                  <div className="mt-2.5 p-3 rounded-2 border bg-light-brand" style={{ borderColor: 'var(--velica-primary-light, #93c5fd)' }}>
                    <div className="d-flex items-start justify-between flex-wrap gap-2 mb-2">
                      <div>
                        <div className="d-flex items-center gap-2">
                          <Award size={16} className="text-brand-color flex-shrink-0" />
                          <strong className="text-xs text-brand-color">{selectedRubric.title}</strong>
                        </div>
                        {selectedRubric.description && (
                          <div className="text-2xs text-muted-color mt-0.5 ps-4">
                            {selectedRubric.description}
                          </div>
                        )}
                      </div>
                      <Space size={6}>
                        <Tag color="purple" className="m-0 font-medium text-2xs">
                          {selectedRubric.criteria.length} tiêu chí
                        </Tag>
                        <Tag color="blue" className="m-0 font-medium text-2xs">
                          Thang {selectedRubric.totalMaxScore}đ
                        </Tag>
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<Trash2 size={12} />}
                          className="p-0 h-auto text-2xs ms-1"
                          onClick={() => questionForm.setFieldValue(['gradingConfig', 'rubricId'], undefined)}
                        >
                          Gỡ chọn
                        </Button>
                      </Space>
                    </div>

                    <div className="text-2xs font-bold text-secondary-color text-uppercase mb-1.5 ps-1">
                      Các tiêu chí thành phần & tỷ lệ trọng số:
                    </div>
                    <div className="d-flex flex-col gap-1.5">
                      {selectedRubric.criteria.map((crit, cIdx) => (
                        <div
                          key={crit.id}
                          className="p-2 bg-white rounded border d-flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="d-flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-bold text-2xs text-secondary-color bg-light px-1.5 py-0.5 rounded border">
                              #{cIdx + 1}
                            </span>
                            <span className="font-medium text-primary-color text-truncate">
                              {crit.name || crit.title}
                            </span>
                          </div>
                          <div className="d-flex items-center gap-2 flex-shrink-0">
                            <Tag color="cyan" className="m-0 font-semibold text-2xs">
                              {crit.weightPercent}%
                            </Tag>
                            <span className="text-2xs text-muted-color">
                              (Tối đa {crit.maxPoints ?? ((selectedRubric.totalMaxScore * crit.weightPercent) / 100).toFixed(1)}đ)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 text-center text-xs text-muted-color bg-light rounded border border-dashed">
                    Chưa chọn Rubric nào. Vui lòng chọn một Rubric từ danh sách phía trên hoặc bấm "+ Tạo Rubric mới".
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <Form.Item name="explanation" label="Giải thích chi tiết đáp án (hiển thị khi sinh viên xem lại bài thi)">
            <Input.TextArea rows={2} placeholder="Giải thích vì sao đáp án này đúng..." />
          </Form.Item>
        )}
      </Form>
    </div>
  );

  const getDerivedSubmissionSettings = () => {
    const essayQuestions = selectedQuestions.filter((q) => q.type === QUESTION_TYPE.ESSAY);
    const hasUpload = essayQuestions.some(
      (q) => q.submissionFormat === SubmissionFormat.FILE_UPLOAD || q.submissionFormat === SubmissionFormat.HYBRID
    );
    const hasPlaintext = essayQuestions.some(
      (q) => q.submissionFormat === SubmissionFormat.PLAINTEXT || q.submissionFormat === SubmissionFormat.HYBRID
    );
    const derivedSubmissionMode: 'ONLINE_TEXT' | 'FILE_UPLOAD' | 'BOTH' =
      hasUpload && hasPlaintext ? 'BOTH' : hasUpload ? 'FILE_UPLOAD' : 'ONLINE_TEXT';

    const allAllowedExts = Array.from(
      new Set(
        essayQuestions
          .flatMap((q) => q.fileConstraint?.allowedExtensions || [])
          .filter(Boolean)
      )
    );
    const derivedExtensions = allAllowedExts.length > 0 ? allAllowedExts : ['.pdf', '.docx', '.zip'];
    const maxFileSize = essayQuestions.reduce(
      (max, q) => Math.max(max, q.fileConstraint?.maxFileSizeMb || 10),
      10
    );

    return {
      submissionMode: derivedSubmissionMode,
      allowedFileExtensions: derivedExtensions,
      maxFileSizeMB: maxFileSize,
    };
  };

  const handleSaveDraft = async () => {
    const values = form.getFieldsValue(true);
    const selectedClass = classes.find((c) => c.id === values.classId);
    const derived = getDerivedSubmissionSettings();

    const payload: Partial<Assessment> = {
      ...values,
      className: selectedClass?.name,
      totalQuestions: selectedQuestions.length,
      questionIds: selectedQuestions.map((q) => q.id),
      status: ASSESSMENT_STATUS.DRAFT,
      submissionMode: derived.submissionMode,
      allowedFileExtensions: derived.allowedFileExtensions,
      maxFileSizeMB: derived.maxFileSizeMB,
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
    const derived = getDerivedSubmissionSettings();

    const payload: Partial<Assessment> = {
      ...values,
      className: selectedClass?.name,
      totalQuestions: selectedQuestions.length,
      questionIds: selectedQuestions.map((q) => q.id),
      status: ASSESSMENT_STATUS.PUBLISHED,
      submissionMode: derived.submissionMode,
      allowedFileExtensions: derived.allowedFileExtensions,
      maxFileSizeMB: derived.maxFileSizeMB,
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
              <Col xs={24} md={12}>
                <Form.Item
                  name="title"
                  label="Tiêu đề Đề thi / Kỳ khảo thí"
                  rules={[{ required: true, message: 'Vui lòng nhập tiêu đề đề thi' }]}
                >
                  <Input placeholder="Vd: Kiểm Tra Giữa Kỳ — Thiết Kế Kiến Trúc Phần Mềm" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="classId"
                  label="Lớp học phần áp dụng"
                  rules={[{ required: true, message: 'Chọn lớp học' }]}
                >
                  <Select
                    size="large"
                    popupMatchSelectWidth={false}
                    onChange={(clsId) => {
                      const cls = classes.find((c) => c.id === clsId);
                      const syl = syllabi.find((s) => s.id === cls?.syllabusId);
                      const firstCat = syl?.assessments?.[0];
                      if (firstCat) {
                        form.setFieldsValue({
                          category: firstCat.category,
                          weight: firstCat.weight,
                        });
                      }
                    }}
                  >
                    {classes.map((c) => (
                      <Select.Option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item
                  name="category"
                  label="Hạng mục Đánh giá theo Đề cương (Syllabus)"
                  rules={[{ required: true, message: 'Chọn hạng mục trong đề cương' }]}
                  tooltip="Chọn loại bài kiểm tra quy định trong Đề cương môn học của lớp này. Trọng số điểm sẽ được đề cương tự động xác định."
                >
                  <Select
                    size="large"
                    placeholder="Chọn hạng mục trong đề cương..."
                    onChange={(val) => {
                      const match = syllabusAssessmentItems.find((item) => item.category === val);
                      if (match) {
                        form.setFieldsValue({ weight: match.weight });
                      }
                    }}
                  >
                    {syllabusAssessmentItems.map((item, idx) => (
                      <Select.Option key={`${item.category}-${idx}`} value={item.category}>
                        {item.category} ({item.weight}%)
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="weight" hidden>
                  <Input />
                </Form.Item>
                {activeSyllabusAssessmentItem && (
                  <div className="text-xs text-brand-color font-semibold -mt-3 mb-3">
                    ✓ Trọng số Đề cương: {activeSyllabusAssessmentItem.weight}% (Tự động thiết lập theo Đề cương)
                  </div>
                )}
              </Col>
            </Row>

            <Row gutter={[24, 0]}>
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="type"
                  label="Hình thức tổ chức thi"
                  rules={[{ required: true }]}
                  tooltip="Hình thức đánh giá do giảng viên quyết định (Trắc nghiệm, tự luận, kiểm tra giữa kỳ, bài tập lớn...)"
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

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="timeLimitMinutes"
                  label="Thời lượng làm bài"
                  rules={[{ required: true }]}
                  tooltip="Nhập 0 nếu không giới hạn thời gian (phù hợp với Bài tập về nhà / Homework)"
                >
                  <InputNumber min={0} max={1440} step={5} addonAfter="phút" size="large" className="w-100" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  name="maxScore"
                  label="Thang điểm chuẩn tín chỉ"
                  tooltip="Quy chế khảo thí áp dụng thang 10 điểm thống nhất toàn trường"
                >
                  <InputNumber value={10} disabled addonAfter="điểm (Thang 10 chuẩn)" size="large" className="w-100" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="instructions" label="Hướng dẫn & Quy chế làm bài cho sinh viên">
              <Input.TextArea
                rows={3}
                placeholder="Vd: Thí sinh làm bài độc lập, không sử dụng tài liệu ngoài. Đề thi bao gồm phần trắc nghiệm và câu hỏi tự luận..."
              />
            </Form.Item>
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
                    type="primary"
                    icon={<Plus size={14} />}
                    onClick={handleOpenAddQuestion}
                    className="velica-btn-primary"
                    style={{ backgroundColor: '#102A43', borderColor: '#102A43' }}
                  >
                    Thêm câu hỏi
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

              {/* Row 2: Inline Controls */}
              <div className="d-flex items-center justify-between pt-3 flex-wrap gap-2">
                <div className="d-flex items-center gap-2 text-xs text-secondary-color">
                  <ClipboardList size={14} className="text-brand-color" />
                  <span className="font-semibold">Danh sách câu hỏi trong đề</span>
                  {selectedQuestions.length > 0 && (
                    <span className="text-muted-color">({selectedQuestions.length} câu đã chọn)</span>
                  )}
                </div>

                <div className="d-flex items-center gap-3">
                  <div className="d-flex items-center gap-2">
                    <Switch
                      size="small"
                      checked={showAnswersInList}
                      onChange={setShowAnswersInList}
                    />
                    <span className="text-xs font-medium text-secondary-color">
                      Hiện đáp án & Lời giải
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
              </div>
            </Card>

            {/* LIST VIEW: Question structure & score allocation */}
            {(
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
                          onClick={handleOpenAddQuestion}
                          className="velica-btn-action"
                        >
                          Thêm câu hỏi (Tự soạn / Ngân hàng)
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
                            <Space size={8} wrap className="items-center">
                              <span
                                style={{
                                  backgroundColor: '#f1f5f9',
                                  color: '#0f172a',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 4,
                                  padding: '2px 8px',
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                Câu {idx + 1}
                              </span>
                              <span className="text-xs font-semibold text-secondary-color">
                                {q.type === QUESTION_TYPE.MCQ
                                  ? 'Trắc nghiệm đơn'
                                  : q.type === QUESTION_TYPE.MULTI_CHOICE
                                  ? 'Nhiều lựa chọn'
                                  : q.type === QUESTION_TYPE.TRUE_FALSE
                                  ? 'Đúng / Sai'
                                  : 'Tự luận'}
                              </span>
                              <Tag color="cyan" className="m-0 text-xs font-semibold">
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
                                className="m-0 text-xs"
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

                              <Tooltip title="Chọn câu hỏi thay thế cùng độ khó từ ngân hàng (không bị trùng lặp)">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<RefreshCw size={13} className="text-brand-color" />}
                                  onClick={() => handleOpenSwapModal(idx, q)}
                                  className="text-xs text-brand-color p-1"
                                >
                                  Đổi câu
                                </Button>
                              </Tooltip>

                              <Tooltip title="Chỉnh sửa nội dung & đáp án câu hỏi ngay tại đây">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<Edit3 size={13} className="text-brand-color" />}
                                  onClick={() => handleOpenEditQuestion(q, idx)}
                                  className="text-xs text-brand-color p-1"
                                >
                                  Sửa
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
                                    className="p-2 rounded-2 border d-flex items-start gap-2 transition-all"
                                    style={{
                                      backgroundColor: showAsCorrect ? '#ecfdf5' : '#ffffff',
                                      borderColor: showAsCorrect ? '#6ee7b7' : '#e2e8f0',
                                      borderWidth: showAsCorrect ? '1.5px' : '1px',
                                      borderStyle: 'solid',
                                    }}
                                  >
                                    <span
                                      style={{
                                        width: 22,
                                        height: 22,
                                        minWidth: 22,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        backgroundColor: showAsCorrect ? '#059669' : '#f1f5f9',
                                        color: showAsCorrect ? '#ffffff' : '#475569',
                                        border: showAsCorrect ? '1px solid #047857' : '1px solid #cbd5e1',
                                        flexShrink: 0,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {String.fromCharCode(65 + oIdx)}
                                    </span>
                                    <span
                                      className="text-xs flex-1"
                                      style={{
                                        color: showAsCorrect ? '#064e3b' : 'var(--velica-text-primary, #1e293b)',
                                        fontWeight: showAsCorrect ? 600 : 400,
                                        paddingTop: 1,
                                      }}
                                    >
                                      <MathRenderer content={opt.text} />
                                    </span>
                                    {showAsCorrect && (
                                      <Tag
                                        color="success"
                                        className="m-0 font-semibold text-xs"
                                        style={{
                                          backgroundColor: '#d1fae5',
                                          color: '#065f46',
                                          borderColor: '#6ee7b7',
                                          flexShrink: 0,
                                        }}
                                        icon={<Check size={11} className="align-middle me-0.5" />}
                                      >
                                        Đáp án đúng
                                      </Tag>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Explanation / Sample Answer / Rubric Indicator */}
                          {showAnswersInList && (q.explanation || q.gradingConfig?.rubricId || q.rubricId) && (
                            <div className="mt-2.5 p-2.5 bg-sky-50 border border-sky-200 rounded-2 text-xs text-sky-900 d-flex items-start gap-2">
                              {q.type === QUESTION_TYPE.ESSAY &&
                              (q.gradingConfig?.evaluationType === EVALUATION_TYPE.RUBRIC || q.rubricId) ? (
                                <>
                                  <Award size={16} className="text-brand-color flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <div className="d-flex items-center justify-between flex-wrap gap-2">
                                      <div>
                                        <strong className="text-sky-950">Đánh giá theo Rubric chuẩn:</strong>{' '}
                                        <span className="font-semibold text-brand-color">
                                          {q.gradingConfig?.rubricDetail?.title ||
                                            rubricPresets.find(
                                              (r) => r.id === (q.gradingConfig?.rubricId || q.rubricId)
                                            )?.title ||
                                            q.explanation?.replace('Theo Rubric: ', '') ||
                                            'Rubric tự luận'}
                                        </span>
                                      </div>
                                      <Button
                                        size="small"
                                        type="link"
                                        className="p-0 h-auto text-xs font-semibold text-brand-color"
                                        onClick={() => {
                                          const targetR =
                                            q.gradingConfig?.rubricDetail ||
                                            rubricPresets.find(
                                              (r) => r.id === (q.gradingConfig?.rubricId || q.rubricId)
                                            );
                                          if (targetR) {
                                            setActivePreviewRubric(targetR);
                                            setPreviewRubricModalOpen(true);
                                          }
                                        }}
                                      >
                                        👁 Xem ma trận Rubric (
                                        {q.gradingConfig?.rubricDetail?.criteria?.length ||
                                          rubricPresets.find(
                                            (r) => r.id === (q.gradingConfig?.rubricId || q.rubricId)
                                          )?.criteria?.length ||
                                          3}{' '}
                                        tiêu chí)
                                      </Button>
                                    </div>
                                    {(q.gradingConfig?.rubricDetail?.criteria ||
                                      rubricPresets.find(
                                        (r) => r.id === (q.gradingConfig?.rubricId || q.rubricId)
                                      )?.criteria) && (
                                      <div className="d-flex flex-wrap gap-1.5 mt-1.5">
                                        {(
                                          q.gradingConfig?.rubricDetail?.criteria ||
                                          rubricPresets.find(
                                            (r) => r.id === (q.gradingConfig?.rubricId || q.rubricId)
                                          )?.criteria
                                        )?.map((c) => (
                                          <Tag key={c.id} color="blue" className="text-2xs m-0">
                                            {c.name || c.title}: <strong>{c.weightPercent}%</strong>
                                          </Tag>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Lightbulb size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <strong className="text-sky-950">Hướng dẫn giải & Tiêu chí chấm:</strong>{' '}
                                    <MathRenderer content={q.gradingConfig?.manualGuideline || q.explanation || ''} />
                                  </div>
                                </>
                              )}
                            </div>
                          )}

                        </Card>
                      );
                    })}

                    {/* Khung Thêm câu hỏi nằm ngay dưới cùng của câu hỏi cuối */}
                    <div id="velica-inline-add-section" className="mt-2">
                      {!showInlineAdd ? (
                        <Button
                          type="dashed"
                          block
                          size="large"
                          icon={<Plus size={16} />}
                          onClick={() => {
                            setShowInlineAdd(true);
                            setInlineAddTab('bank');
                          }}
                          className="w-100 d-flex items-center justify-center gap-2"
                          style={{
                            height: 48,
                            borderRadius: 8,
                            borderColor: '#cbd5e1',
                            backgroundColor: '#f8fafc',
                            color: '#102A43',
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          + Thêm câu hỏi vào đề (Chọn từ Ngân hàng hoặc Soạn mới)
                        </Button>
                      ) : (
                        <Card
                          bordered
                          className="shadow-sm border-2"
                          style={{ borderColor: '#6366f1', borderRadius: 8, backgroundColor: '#ffffff' }}
                          title={
                            <div className="d-flex items-center justify-between flex-wrap gap-2 py-1">
                              <div className="d-flex items-center gap-2">
                                <Plus size={18} className="text-brand-color" />
                                <span className="font-bold text-sm text-primary-color">
                                  Thêm câu hỏi mới vào cuối đề thi
                                </span>
                              </div>
                              <div className="d-flex items-center gap-2">
                                <Segmented
                                  value={inlineAddTab}
                                  onChange={(val) => setInlineAddTab(val as 'bank' | 'compose')}
                                  options={[
                                    { label: 'Chọn từ Ngân hàng câu hỏi', value: 'bank', icon: <Database size={13} className="me-1" /> },
                                    { label: 'Soạn câu hỏi mới trực tiếp', value: 'compose', icon: <FileText size={13} className="me-1" /> },
                                  ]}
                                />
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<X size={15} />}
                                  onClick={() => setShowInlineAdd(false)}
                                  className="text-muted-color"
                                  title="Đóng khung thêm câu hỏi"
                                />
                              </div>
                            </div>
                          }
                        >
                          {inlineAddTab === 'bank' ? (
                            <div>
                              {/* Filter bar for inline bank picker */}
                              <div className="p-2.5 bg-light rounded-2 border mb-3 d-flex items-center gap-2 flex-wrap">
                                <Input
                                  size="small"
                                  placeholder="Tìm kiếm nội dung câu hỏi..."
                                  prefix={<Search size={13} className="text-muted-color" />}
                                  value={bankSearch}
                                  onChange={(e) => setBankSearch(e.target.value)}
                                  style={{ width: 240 }}
                                  allowClear
                                />
                                <Select
                                  size="small"
                                  value={bankDifficultyFilter}
                                  onChange={setBankDifficultyFilter}
                                  style={{ width: 140 }}
                                  options={[
                                    { label: 'Tất cả mức độ', value: 'ALL' },
                                    { label: 'Nhận biết', value: 'EASY' },
                                    { label: 'Thông hiểu', value: 'MEDIUM' },
                                    { label: 'Vận dụng', value: 'HARD' },
                                    { label: 'Vận dụng cao', value: 'VERY_HARD' },
                                  ]}
                                />
                                <Select
                                  size="small"
                                  value={bankCloFilter}
                                  onChange={setBankCloFilter}
                                  style={{ width: 120 }}
                                  options={[
                                    { label: 'Tất cả CLO', value: 'ALL' },
                                    { label: 'CLO1', value: 'CLO1' },
                                    { label: 'CLO2', value: 'CLO2' },
                                    { label: 'CLO3', value: 'CLO3' },
                                  ]}
                                />
                                <Select
                                  size="small"
                                  value={bankTypeFilter}
                                  onChange={setBankTypeFilter}
                                  style={{ width: 140 }}
                                  options={[
                                    { label: 'Tất cả loại câu', value: 'ALL' },
                                    { label: 'Trắc nghiệm đơn', value: QUESTION_TYPE.MCQ },
                                    { label: 'Nhiều lựa chọn', value: QUESTION_TYPE.MULTI_CHOICE },
                                    { label: 'Đúng / Sai', value: QUESTION_TYPE.TRUE_FALSE },
                                    { label: 'Tự luận', value: QUESTION_TYPE.ESSAY },
                                  ]}
                                />
                              </div>

                              {/* Candidate list from bank */}
                              {(() => {
                                const existingIds = new Set(selectedQuestions.map((q) => q.id));
                                const available = bankQuestions.filter((q) => {
                                  if (existingIds.has(q.id)) return false;
                                  if (bankSearch && !q.content.toLowerCase().includes(bankSearch.toLowerCase())) return false;
                                  if (bankDifficultyFilter !== 'ALL' && q.difficulty !== bankDifficultyFilter) return false;
                                  if (bankCloFilter !== 'ALL' && getQuestionClo(q) !== bankCloFilter) return false;
                                  if (bankTypeFilter !== 'ALL' && q.type !== bankTypeFilter) return false;
                                  return true;
                                });

                                if (available.length === 0) {
                                  return (
                                    <div className="text-center py-4 text-muted-color">
                                      <FileQuestion size={28} className="mb-2 text-slate-400" />
                                      <div className="text-xs">Không có câu hỏi nào phù hợp với bộ lọc trong ngân hàng (hoặc tất cả đã có trong đề thi).</div>
                                    </div>
                                  );
                                }

                                return (
                                  <div className="d-flex flex-col gap-2" style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 4 }}>
                                    {available.slice(0, 10).map((bq) => (
                                      <div
                                        key={bq.id}
                                        className="p-2.5 bg-light rounded-2 border d-flex items-center justify-between gap-3 hover:bg-slate-100 transition-all"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <div className="d-flex items-center gap-2 mb-1 flex-wrap">
                                            <Tag color="cyan" className="m-0 text-2xs font-semibold">{getQuestionClo(bq)}</Tag>
                                            <Tag color={bq.difficulty === 'EASY' ? 'green' : bq.difficulty === 'MEDIUM' ? 'blue' : bq.difficulty === 'HARD' ? 'orange' : 'red'} className="m-0 text-2xs">
                                              {bq.difficulty === 'EASY' ? 'Nhận biết' : bq.difficulty === 'MEDIUM' ? 'Thông hiểu' : bq.difficulty === 'HARD' ? 'Vận dụng' : 'Vận dụng cao'}
                                            </Tag>
                                            <span className="text-2xs text-muted-color">
                                              {bq.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm đơn' : bq.type === QUESTION_TYPE.MULTI_CHOICE ? 'Nhiều lựa chọn' : bq.type === QUESTION_TYPE.TRUE_FALSE ? 'Đúng / Sai' : 'Tự luận'}
                                            </span>
                                          </div>
                                          <div className="text-xs font-medium text-primary-color line-clamp-2">
                                            <MathRenderer content={bq.content} />
                                          </div>
                                        </div>
                                        <Button
                                          size="small"
                                          type="primary"
                                          icon={<Plus size={13} />}
                                          onClick={() => handleInlineAddFromBank(bq)}
                                          className="flex-shrink-0"
                                        >
                                          Thêm vào đề
                                        </Button>
                                      </div>
                                    ))}
                                    {available.length > 10 && (
                                      <div className="text-center text-xs text-muted-color pt-1">
                                        Hiển thị 10 / {available.length} câu hỏi phù hợp. Dùng ô tìm kiếm để lọc nhanh hơn.
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            /* Inline Compose New Question */
                            <Form
                              form={inlineComposeForm}
                              layout="vertical"
                              initialValues={{
                                type: QUESTION_TYPE.MCQ,
                                difficulty: 'MEDIUM',
                                cloId: 'CLO1',
                                points: 1.0,
                                content: '',
                                tfCorrect: 'TRUE',
                                options: [
                                  { text: '', isCorrect: true },
                                  { text: '', isCorrect: false },
                                  { text: '', isCorrect: false },
                                  { text: '', isCorrect: false },
                                ],
                              }}
                            >
                              <Row gutter={[12, 12]}>
                                <Col xs={24} md={6}>
                                  <Form.Item name="type" label="Loại câu hỏi" rules={[{ required: true }]}>
                                    <Select
                                      options={[
                                        { label: 'Trắc nghiệm đơn (MCQ)', value: QUESTION_TYPE.MCQ },
                                        { label: 'Nhiều lựa chọn', value: QUESTION_TYPE.MULTI_CHOICE },
                                        { label: 'Đúng / Sai (True/False)', value: QUESTION_TYPE.TRUE_FALSE },
                                        { label: 'Tự luận (Essay)', value: QUESTION_TYPE.ESSAY },
                                      ]}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={12} md={6}>
                                  <Form.Item name="cloId" label="Chuẩn đầu ra CLO" rules={[{ required: true }]}>
                                    <Select
                                      options={[
                                        { label: 'CLO1: Hiểu & Phân tích', value: 'CLO1' },
                                        { label: 'CLO2: Thiết kế & Cài đặt', value: 'CLO2' },
                                        { label: 'CLO3: Đánh giá & Tối ưu', value: 'CLO3' },
                                      ]}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={12} md={6}>
                                  <Form.Item name="difficulty" label="Mức độ nhận thức" rules={[{ required: true }]}>
                                    <Select
                                      options={[
                                        { label: 'Nhận biết (Easy)', value: 'EASY' },
                                        { label: 'Thông hiểu (Medium)', value: 'MEDIUM' },
                                        { label: 'Vận dụng (Hard)', value: 'HARD' },
                                        { label: 'Vận dụng cao (Very Hard)', value: 'VERY_HARD' },
                                      ]}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col xs={24} md={6}>
                                  <Form.Item name="points" label="Điểm số câu này" rules={[{ required: true }]}>
                                    <InputNumber min={0.25} max={10} step={0.25} addonAfter="đ" className="w-100" />
                                  </Form.Item>
                                </Col>
                              </Row>

                              <Form.Item
                                name="content"
                                label="Nội dung câu hỏi (hỗ trợ định dạng LaTeX công thức Toán)"
                                rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi' }]}
                              >
                                <Input.TextArea rows={3} placeholder="Nhập nội dung đề bài tại đây..." />
                              </Form.Item>

                              <Form.Item
                                noStyle
                                shouldUpdate={(prev, cur) => prev.type !== cur.type}
                              >
                                {({ getFieldValue }) => {
                                  const cType = getFieldValue('type');
                                  if (cType === QUESTION_TYPE.MCQ || cType === QUESTION_TYPE.MULTI_CHOICE) {
                                    return (
                                      <div className="p-3 bg-light rounded-2 border mb-3">
                                        <div className="text-xs font-semibold text-secondary-color mb-2">
                                          Các phương án lựa chọn (Đánh dấu tích vào phương án đúng):
                                        </div>
                                        {[0, 1, 2, 3].map((optIdx) => (
                                          <div key={optIdx} className="d-flex items-center gap-2 mb-2">
                                            <span style={{ width: 24, fontWeight: 700, textAlign: 'center' }}>
                                              {String.fromCharCode(65 + optIdx)}
                                            </span>
                                            <Form.Item name={['options', optIdx, 'text']} className="m-0 flex-1" rules={[{ required: true, message: 'Nhập nội dung đáp án' }]}>
                                              <Input placeholder={`Nội dung lựa chọn ${String.fromCharCode(65 + optIdx)}`} />
                                            </Form.Item>
                                            <Form.Item name={['options', optIdx, 'isCorrect']} valuePropName="checked" className="m-0">
                                              <Checkbox>Đúng</Checkbox>
                                            </Form.Item>
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }
                                  if (cType === QUESTION_TYPE.TRUE_FALSE) {
                                    return (
                                      <Form.Item name="tfCorrect" label="Đáp án đúng" className="mb-3">
                                        <Radio.Group>
                                          <Radio.Button value="TRUE">Đúng (True)</Radio.Button>
                                          <Radio.Button value="FALSE">Sai (False)</Radio.Button>
                                        </Radio.Group>
                                      </Form.Item>
                                    );
                                  }
                                  return (
                                    <Form.Item name="explanation" label="Hướng dẫn giải / Bareme tiêu chí chấm tự luận" className="mb-3">
                                      <Input.TextArea rows={2} placeholder="Nhập tóm tắt tiêu chí chấm hoặc bareme đáp án..." />
                                    </Form.Item>
                                  );
                                }}
                              </Form.Item>

                              <div className="d-flex justify-end gap-2 pt-2 border-top">
                                <Button onClick={() => setShowInlineAdd(false)}>Hủy</Button>
                                <Button type="primary" icon={<Check size={14} />} onClick={handleSaveInlineComposedQuestion}>
                                  Lưu & Thêm vào đề thi
                                </Button>
                              </div>
                            </Form>
                          )}
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal Chọn câu hỏi thay thế cùng độ khó (không random) */}
            <Modal
              open={swapModalState.open}
              onCancel={() => setSwapModalState({ open: false, questionIndex: null, targetQuestion: null })}
              footer={null}
              title={
                <div className="d-flex items-center gap-2">
                  <RefreshCw size={17} className="text-brand-color" />
                  <span className="font-bold text-base">
                    Đổi câu hỏi #{swapModalState.questionIndex !== null ? swapModalState.questionIndex + 1 : ''} (Chọn từ Ngân hàng)
                  </span>
                </div>
              }
              width={750}
              destroyOnClose
            >
              {swapModalState.targetQuestion && (
                <div>
                  {/* Question being replaced */}
                  <div className="p-3 bg-slate-50 border rounded-2 mb-3">
                    <div className="d-flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-2xs font-bold text-muted-color text-uppercase">Câu hiện tại cần đổi:</span>
                      <Tag color="cyan" className="m-0 text-2xs font-semibold">{getQuestionClo(swapModalState.targetQuestion)}</Tag>
                      <Tag color={swapModalState.targetQuestion.difficulty === 'EASY' ? 'green' : swapModalState.targetQuestion.difficulty === 'MEDIUM' ? 'blue' : swapModalState.targetQuestion.difficulty === 'HARD' ? 'orange' : 'red'} className="m-0 text-2xs">
                        {swapModalState.targetQuestion.difficulty === 'EASY' ? 'Nhận biết' : swapModalState.targetQuestion.difficulty === 'MEDIUM' ? 'Thông hiểu' : swapModalState.targetQuestion.difficulty === 'HARD' ? 'Vận dụng' : 'Vận dụng cao'}
                      </Tag>
                    </div>
                    <div className="text-xs text-primary-color font-medium">
                      <MathRenderer content={swapModalState.targetQuestion.content} />
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-secondary-color mb-2 d-flex items-center justify-between">
                    <span>Chọn 1 câu hỏi thay thế cùng độ khó ({swapModalState.targetQuestion.difficulty}):</span>
                    <span className="text-muted-color">Chỉ hiển thị các câu chưa có trong đề</span>
                  </div>

                  {(() => {
                    const currentDiff = swapModalState.targetQuestion.difficulty;
                    const existingIds = new Set(selectedQuestions.map((q) => q.id));
                    const candidates = bankQuestions.filter(
                      (q) => q.id !== swapModalState.targetQuestion?.id && !existingIds.has(q.id) && q.difficulty === currentDiff
                    );

                    if (candidates.length === 0) {
                      return (
                        <div className="text-center py-5 text-muted-color border rounded-2 bg-light">
                          <AlertCircle size={28} className="text-amber-500 mb-2" />
                          <div className="text-sm font-semibold text-primary-color mb-1">
                            Không còn câu hỏi nào khác cùng mức độ {currentDiff} trong ngân hàng
                          </div>
                          <div className="text-xs text-muted-color">
                            Tất cả các câu hỏi cùng mức độ trong ngân hàng đã được chọn vào đề thi này.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="d-flex flex-col gap-2" style={{ maxHeight: 380, overflowY: 'auto' }}>
                        {candidates.map((cand) => (
                          <div
                            key={cand.id}
                            className="p-3 border rounded-2 bg-white hover:bg-slate-50 transition-all d-flex items-start justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="d-flex items-center gap-2 mb-1.5 flex-wrap">
                                <Tag color="cyan" className="m-0 text-2xs font-semibold">{getQuestionClo(cand)}</Tag>
                                <Tag color={cand.difficulty === 'EASY' ? 'green' : cand.difficulty === 'MEDIUM' ? 'blue' : cand.difficulty === 'HARD' ? 'orange' : 'red'} className="m-0 text-2xs">
                                  {cand.difficulty === 'EASY' ? 'Nhận biết' : cand.difficulty === 'MEDIUM' ? 'Thông hiểu' : cand.difficulty === 'HARD' ? 'Vận dụng' : 'Vận dụng cao'}
                                </Tag>
                                <span className="text-2xs text-muted-color">
                                  {cand.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm đơn' : cand.type === QUESTION_TYPE.MULTI_CHOICE ? 'Nhiều lựa chọn' : cand.type === QUESTION_TYPE.TRUE_FALSE ? 'Đúng / Sai' : 'Tự luận'}
                                </span>
                              </div>
                              <div className="text-xs font-medium text-primary-color">
                                <MathRenderer content={cand.content} />
                              </div>
                            </div>
                            <Button
                              size="small"
                              type="primary"
                              icon={<Check size={13} />}
                              onClick={() => handleSelectSwapQuestion(cand)}
                              className="flex-shrink-0"
                            >
                              Chọn câu này
                            </Button>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </Modal>

            {/* (TWO_COLUMNS and PREVIEW view modes removed for cleaner UX) */}
            {false && (
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
                  {previewQuestion.options.map((opt, i) => {
                    const isCorrect = opt.isCorrect;
                    return (
                      <div
                        key={opt.id}
                        className="p-2 rounded-2 border d-flex items-start gap-2 transition-all"
                        style={{
                          backgroundColor: isCorrect ? '#ecfdf5' : '#ffffff',
                          borderColor: isCorrect ? '#6ee7b7' : '#e2e8f0',
                          borderWidth: isCorrect ? '1.5px' : '1px',
                          borderStyle: 'solid',
                        }}
                      >
                        <span
                          style={{
                            width: 22,
                            height: 22,
                            minWidth: 22,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                            backgroundColor: isCorrect ? '#059669' : '#f1f5f9',
                            color: isCorrect ? '#ffffff' : '#475569',
                            border: isCorrect ? '1px solid #047857' : '1px solid #cbd5e1',
                            flexShrink: 0,
                            lineHeight: 1,
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span
                          className="text-xs flex-1"
                          style={{
                            color: isCorrect ? '#064e3b' : 'var(--velica-text-primary, #1e293b)',
                            fontWeight: isCorrect ? 600 : 400,
                            paddingTop: 1,
                          }}
                        >
                          <MathRenderer content={opt.text} />
                        </span>
                        {isCorrect && (
                          <Tag
                            color="success"
                            className="m-0 font-semibold text-xs"
                            style={{
                              backgroundColor: '#d1fae5',
                              color: '#065f46',
                              borderColor: '#6ee7b7',
                              flexShrink: 0,
                            }}
                            icon={<Check size={11} className="align-middle me-0.5" />}
                          >
                            Đáp án đúng
                          </Tag>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Essay Submission Format in Preview */}
            {previewQuestion.type === QUESTION_TYPE.ESSAY && (
              <div className="mb-3 p-3 bg-light rounded-2 border">
                <div className="text-2xs font-bold text-muted-color text-uppercase mb-1.5 d-flex items-center gap-1.5">
                  <UploadCloud size={13} className="text-brand-color" />
                  Quy định nộp bài câu tự luận này:
                </div>
                <div className="text-xs text-primary-color font-semibold mb-1">
                  {previewQuestion.submissionFormat === SubmissionFormat.FILE_UPLOAD
                    ? 'Chỉ nộp bằng tập tin đính kèm (File Upload)'
                    : previewQuestion.submissionFormat === SubmissionFormat.HYBRID
                    ? 'Hỗn hợp (Soạn văn bản trực tuyến + Đính kèm tệp)'
                    : 'Chỉ soạn thảo văn bản trực tiếp (Plaintext)'}
                </div>
                {(previewQuestion.submissionFormat === SubmissionFormat.FILE_UPLOAD ||
                  previewQuestion.submissionFormat === SubmissionFormat.HYBRID) && (
                  <div className="text-2xs text-muted-color d-flex flex-col gap-0.5 mt-1.5 pt-1.5 border-top">
                    <div>• <strong>Định dạng cho phép:</strong> {(previewQuestion.fileConstraint?.allowedExtensions || ['.pdf', '.docx', '.zip']).join(', ')}</div>
                    <div>• <strong>Dung lượng tối đa:</strong> {previewQuestion.fileConstraint?.maxFileSizeMb || 10} MB / tệp</div>
                    <div>• <strong>Số lượng tệp tối đa:</strong> {previewQuestion.fileConstraint?.maxFilesCount || 1} tệp</div>
                  </div>
                )}
              </div>
            )}

            {/* Explanation / Sample Answer / Rubric in Preview */}
            {(previewQuestion.explanation ||
              previewQuestion.gradingConfig?.rubricId ||
              previewQuestion.rubricId) && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2">
                {previewQuestion.type === QUESTION_TYPE.ESSAY &&
                (previewQuestion.gradingConfig?.evaluationType === EVALUATION_TYPE.RUBRIC ||
                  previewQuestion.rubricId) ? (
                  <div>
                    <div className="d-flex items-center justify-between flex-wrap gap-2 mb-1.5">
                      <div className="d-flex items-center gap-1.5">
                        <Award size={15} className="text-brand-color" />
                        <span className="text-2xs text-sky-900 font-bold">Thang Rubric đánh giá tự luận:</span>
                      </div>
                      <Button
                        size="small"
                        type="link"
                        className="p-0 h-auto text-2xs font-semibold text-brand-color"
                        onClick={() => {
                          const targetR =
                            previewQuestion.gradingConfig?.rubricDetail ||
                            rubricPresets.find(
                              (r) =>
                                r.id ===
                                (previewQuestion.gradingConfig?.rubricId || previewQuestion.rubricId)
                            );
                          if (targetR) {
                            setActivePreviewRubric(targetR);
                            setPreviewRubricModalOpen(true);
                          }
                        }}
                      >
                        👁 Xem bảng ma trận đầy đủ
                      </Button>
                    </div>
                    <div className="text-xs font-semibold text-primary-color mb-1.5">
                      {previewQuestion.gradingConfig?.rubricDetail?.title ||
                        rubricPresets.find(
                          (r) =>
                            r.id ===
                            (previewQuestion.gradingConfig?.rubricId || previewQuestion.rubricId)
                        )?.title ||
                        previewQuestion.explanation}
                    </div>
                    {(previewQuestion.gradingConfig?.rubricDetail?.criteria ||
                      rubricPresets.find(
                        (r) =>
                          r.id ===
                          (previewQuestion.gradingConfig?.rubricId || previewQuestion.rubricId)
                      )?.criteria) && (
                      <div className="d-flex flex-wrap gap-1.5">
                        {(
                          previewQuestion.gradingConfig?.rubricDetail?.criteria ||
                          rubricPresets.find(
                            (r) =>
                              r.id ===
                              (previewQuestion.gradingConfig?.rubricId || previewQuestion.rubricId)
                          )?.criteria
                        )?.map((c) => (
                          <Tag key={c.id} color="blue" className="text-2xs m-0">
                            {c.name || c.title}: <strong>{c.weightPercent}%</strong>
                          </Tag>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="d-flex items-center gap-1.5 mb-1">
                      <Lightbulb size={14} className="text-amber-500" />
                      <span className="text-2xs text-sky-900 font-bold">Hướng dẫn giải & Tiêu chí chấm:</span>
                    </div>
                    <div className="text-xs text-sky-900 lh-base">
                      <MathRenderer
                        content={
                          previewQuestion.gradingConfig?.manualGuideline ||
                          previewQuestion.explanation ||
                          ''
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Unified Question Add & Edit Modal */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            {editingQuestion ? (
              <>
                <Edit3 size={18} className="text-brand-color" />
                <span className="font-bold text-base text-primary-color">
                  Chỉnh sửa câu hỏi #{editQuestionIndex !== null ? editQuestionIndex + 1 : ''}
                </span>
              </>
            ) : (
              <>
                <PlusCircle size={18} className="text-brand-color" />
                <span className="font-bold text-base text-primary-color">
                  Thêm câu hỏi vào đề thi
                </span>
              </>
            )}
          </div>
        }
        open={questionModalOpen}
        onCancel={() => {
          setQuestionModalOpen(false);
          setEditingQuestion(null);
          setEditQuestionIndex(null);
        }}
        width={960}
        styles={{ body: { padding: '16px 20px', maxHeight: '78vh', overflowY: 'auto' } }}
        footer={
          questionModalTab === 'compose'
            ? [
                <Button
                  key="cancel"
                  onClick={() => {
                    setQuestionModalOpen(false);
                    setEditingQuestion(null);
                    setEditQuestionIndex(null);
                  }}
                >
                  Hủy bỏ
                </Button>,
                <Button
                  key="submit"
                  type="primary"
                  onClick={handleSaveQuestion}
                  className="velica-btn-primary"
                  icon={<Check size={14} />}
                >
                  {editingQuestion ? 'Lưu thay đổi câu hỏi' : 'Thêm vào đề thi'}
                </Button>,
              ]
            : [
                <Button
                  key="close"
                  type="primary"
                  onClick={() => setQuestionModalOpen(false)}
                  className="velica-btn-primary"
                >
                  Xong (Đã chọn {selectedQuestions.length} câu vào đề)
                </Button>,
              ]
        }
      >
        <div className="py-1">
          {editingQuestion ? (
            renderQuestionForm(true)
          ) : (
            <Tabs
              activeKey={questionModalTab}
              onChange={(key) => setQuestionModalTab(key as 'compose' | 'bank')}
              items={[
                {
                  key: 'compose',
                  label: (
                    <span className="d-flex items-center gap-1.5 font-semibold">
                      <Edit3 size={15} />
                      Tự soạn câu mới
                    </span>
                  ),
                  children: renderQuestionForm(false),
                },
                {
                  key: 'bank',
                  label: (
                    <span className="d-flex items-center gap-1.5 font-semibold">
                      <Database size={15} />
                      Chọn từ ngân hàng ({filteredBankQuestions.length} câu)
                    </span>
                  ),
                  children: (
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
                  ),
                },
              ]}
            />
          )}
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

      {/* Rubric Matrix Full Preview Modal */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Award size={18} className="text-brand-color" />
            <span className="font-bold text-base text-primary-color">
              Chi tiết Ma trận Tiêu chí Rubric: {activePreviewRubric?.title || ''}
            </span>
          </div>
        }
        open={previewRubricModalOpen}
        onCancel={() => {
          setPreviewRubricModalOpen(false);
          setActivePreviewRubric(null);
        }}
        width={920}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => {
              setPreviewRubricModalOpen(false);
              setActivePreviewRubric(null);
            }}
            className="velica-btn-primary"
          >
            Đóng xem trước
          </Button>,
        ]}
      >
        {activePreviewRubric && (
          <div className="py-2">
            <div className="p-3 bg-light rounded-2 border mb-3 d-flex items-center justify-between flex-wrap gap-2 text-xs">
              <div>
                <strong className="text-primary-color">Môn học / Học phần:</strong>{' '}
                <Tag color="blue">{activePreviewRubric.courseSubjectId || 'Chung'}</Tag>
                {activePreviewRubric.description && (
                  <div className="text-muted-color mt-1">{activePreviewRubric.description}</div>
                )}
              </div>
              <Space size="small">
                <Tag color="purple" className="m-0 font-medium">
                  {activePreviewRubric.criteria.length} tiêu chí đánh giá
                </Tag>
                <Tag color="geekblue" className="m-0 font-medium">
                  Tổng điểm tối đa: {activePreviewRubric.totalMaxScore}đ
                </Tag>
              </Space>
            </div>

            <div className="border rounded-2 overflow-hidden">
              <Table
                dataSource={activePreviewRubric.criteria.map((c, idx) => ({ ...c, key: c.id, index: idx + 1 }))}
                pagination={false}
                bordered
                size="small"
                columns={[
                  {
                    title: 'Tiêu chí & Trọng số',
                    width: 250,
                    render: (_, record) => (
                      <div>
                        <div className="font-bold text-xs text-primary-color mb-1">
                          #{record.index}. {record.name || record.title}
                        </div>
                        <Space size={4}>
                          <Tag color="cyan" className="m-0 font-semibold text-2xs">
                            Trọng số: {record.weightPercent}%
                          </Tag>
                          <Tag color="blue" className="m-0 font-semibold text-2xs">
                            {record.maxPoints ?? ((activePreviewRubric.totalMaxScore * record.weightPercent) / 100).toFixed(1)}đ
                          </Tag>
                        </Space>
                      </div>
                    ),
                  },
                  {
                    title: 'Các mức độ đánh giá đạt được (Performance Levels)',
                    render: (_, record) => (
                      <div className="d-flex flex-col gap-1.5 py-1">
                        {(record.levels || []).map((lvl, lIdx) => (
                          <div
                            key={lvl.id || lIdx}
                            className="p-1.5 rounded bg-light border d-flex items-start gap-2 text-2xs"
                          >
                            <Tag color="geekblue" className="m-0 flex-shrink-0 font-semibold text-2xs">
                              {lvl.label}: {lvl.score}đ
                            </Tag>
                            <span className="text-secondary-color flex-1">{lvl.description}</span>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}
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
          message.success(
            `Đã áp dụng thành công ${result.questions.length} câu hỏi ngẫu nhiên chuẩn ma trận CLO & Độ khó vào đề thi!`
          );
        }}
      />
    </div>
  );
};

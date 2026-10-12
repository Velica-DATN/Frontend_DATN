import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  Button,
  Card,
  Row,
  Col,
  Checkbox,
  Radio,
  Select,
  InputNumber,
  Slider,
  Tag,
  Typography,
  Space,
  Divider,
  Alert,
  Tooltip,
  Progress,
  message,
} from 'antd';
import {
  Sparkles,
  Dice5,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Award,
  Layers,
  HelpCircle,
  Eye,
  RefreshCw,
  Shuffle,
} from 'lucide-react';
import { Question } from '../../../interfaces/velica.interfaces';
import {
  QUESTION_TYPE,
  QUESTION_DIFFICULTY,
  QuestionDifficulty,
} from '../../../constants/assessmentConstants';
import { MathRenderer } from '../MathRenderer/MathRenderer';

const { Title, Text, Paragraph } = Typography;

export interface GeneratedExamResult {
  questions: Question[];
  scores: Record<string, number>;
  targetMaxScore: number;
}

interface RandomExamGeneratorModalProps {
  open: boolean;
  onClose: () => void;
  bankQuestions: Question[];
  targetMaxScore?: number;
  onApply: (result: GeneratedExamResult) => void;
}

// Preset Bloom difficulty distribution profiles
const DIFFICULTY_PROFILES = {
  EASY: {
    id: 'EASY',
    name: 'Đề Cơ Bản / Dễ (Foundation)',
    description: 'Tập trung ôn tập lý thuyết cốt lõi và định nghĩa cơ bản.',
    color: 'green',
    weights: { EASY: 50, MEDIUM: 30, HARD: 20, VERY_HARD: 0 },
  },
  STANDARD: {
    id: 'STANDARD',
    name: 'Đề Tiêu Chuẩn / Vừa (Standard)',
    description: 'Cân bằng giữa lý thuyết thông hiểu và vận dụng thực hành.',
    color: 'blue',
    weights: { EASY: 30, MEDIUM: 40, HARD: 20, VERY_HARD: 10 },
  },
  HARD: {
    id: 'HARD',
    name: 'Đề Phân Loại Cao / Khó (Advanced)',
    description: 'Thử thách tư duy thiết kế, cài đặt giải thuật và đánh giá trade-offs.',
    color: 'orange',
    weights: { EASY: 10, MEDIUM: 30, HARD: 40, VERY_HARD: 20 },
  },
  CUSTOM: {
    id: 'CUSTOM',
    name: 'Tùy chỉnh tỷ lệ Bloom (Custom)',
    description: 'Tự do cấu hình tỷ lệ phần trăm theo yêu cầu riêng của đề thi.',
    color: 'purple',
    weights: { EASY: 25, MEDIUM: 35, HARD: 25, VERY_HARD: 15 },
  },
};

const AVAILABLE_CLOS = [
  { id: 'CLO1', name: 'CLO1: Kiến trúc Clean Code & SOLID', desc: 'Nguyên lý thiết kế và quy tắc phụ thuộc' },
  { id: 'CLO2', name: 'CLO2: Microservices & API Gateway', desc: 'Thiết kế vi dịch vụ, định tuyến & tracing' },
  { id: 'CLO3', name: 'CLO3: Giao dịch phân tán & Saga', desc: 'Saga Pattern, bù trừ giao dịch & 2PC' },
  { id: 'CLO4', name: 'CLO4: Observability & Chịu lỗi', desc: 'Giám sát phân tán, Circuit Breaker & Retry' },
];

export const RandomExamGeneratorModal: React.FC<RandomExamGeneratorModalProps> = ({
  open,
  onClose,
  bankQuestions,
  targetMaxScore = 10,
  onApply,
}) => {
  // Config state
  const [selectedClos, setSelectedClos] = useState<string[]>(['CLO1', 'CLO2', 'CLO3', 'CLO4']);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState<number>(5);
  const [difficultyProfile, setDifficultyProfile] = useState<keyof typeof DIFFICULTY_PROFILES>('STANDARD');
  const [customWeights, setCustomWeights] = useState({ EASY: 30, MEDIUM: 40, HARD: 20, VERY_HARD: 10 });
  const [questionTypeFilter, setQuestionTypeFilter] = useState<'ALL' | 'OBJECTIVE_ONLY' | 'ESSAY_ONLY'>('ALL');
  const [maxScoreTarget, setMaxScoreTarget] = useState<number>(targetMaxScore);

  // Generated state
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to map question to CLO
  const getQuestionClo = (q: Question): string => {
    if (q.cloId) return q.cloId;
    if (q.lessonId === 'les-1') return 'CLO1';
    if (q.lessonId === 'les-2') return 'CLO2';
    if (q.lessonId === 'les-3') return 'CLO3';
    return 'CLO1';
  };

  // Count available questions in bank per CLO
  const bankCloCounts = useMemo(() => {
    const counts: Record<string, number> = { CLO1: 0, CLO2: 0, CLO3: 0, CLO4: 0 };
    bankQuestions.forEach((q) => {
      const clo = getQuestionClo(q);
      if (counts[clo] !== undefined) counts[clo]++;
    });
    return counts;
  }, [bankQuestions]);

  // Candidate pool matching selected CLOs and question types
  const candidatePool = useMemo(() => {
    return bankQuestions.filter((q) => {
      const clo = getQuestionClo(q);
      if (!selectedClos.includes(clo)) return false;

      if (questionTypeFilter === 'OBJECTIVE_ONLY') {
        if (q.type === QUESTION_TYPE.ESSAY) return false;
      } else if (questionTypeFilter === 'ESSAY_ONLY') {
        if (q.type !== QUESTION_TYPE.ESSAY) return false;
      }

      return true;
    });
  }, [bankQuestions, selectedClos, questionTypeFilter]);

  // Current active difficulty weights
  const currentWeights = useMemo(() => {
    if (difficultyProfile === 'CUSTOM') return customWeights;
    return DIFFICULTY_PROFILES[difficultyProfile].weights;
  }, [difficultyProfile, customWeights]);

  // Core Random Exam Generation Algorithm
  const handleGenerate = () => {
    if (selectedClos.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 chuẩn đầu ra CLO!');
      return;
    }

    if (candidatePool.length === 0) {
      message.error('Không tìm thấy câu hỏi nào trong ngân hàng phù hợp với cấu hình CLO và loại câu hỏi đã chọn!');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const targetCount = Math.min(totalQuestionsCount, candidatePool.length);

      // Compute number of questions for each difficulty tier
      const easyTarget = Math.round((currentWeights.EASY / 100) * targetCount);
      const mediumTarget = Math.round((currentWeights.MEDIUM / 100) * targetCount);
      const hardTarget = Math.round((currentWeights.HARD / 100) * targetCount);
      const veryHardTarget = Math.max(0, targetCount - (easyTarget + mediumTarget + hardTarget));

      const targetByDiff: Record<string, number> = {
        EASY: easyTarget,
        MEDIUM: mediumTarget,
        HARD: hardTarget,
        VERY_HARD: veryHardTarget,
      };

      // Group candidate pool by difficulty
      const poolByDiff: Record<string, Question[]> = {
        EASY: [],
        MEDIUM: [],
        HARD: [],
        VERY_HARD: [],
      };

      candidatePool.forEach((q) => {
        if (poolByDiff[q.difficulty]) {
          poolByDiff[q.difficulty].push(q);
        } else {
          poolByDiff.MEDIUM.push(q);
        }
      });

      // Shuffle helper (Fisher-Yates)
      const shuffle = <T,>(arr: T[]): T[] => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      const picked: Question[] = [];
      const pickedIds = new Set<string>();

      // First pass: pick according to target difficulty distribution
      (['EASY', 'MEDIUM', 'HARD', 'VERY_HARD'] as const).forEach((diff) => {
        const shuffledPool = shuffle(poolByDiff[diff]);
        const want = targetByDiff[diff];
        const taken = shuffledPool.slice(0, want);
        taken.forEach((q) => {
          picked.push(q);
          pickedIds.add(q.id);
        });
      });

      // Second pass: if some tiers had fewer questions, fill remaining from leftover candidates
      if (picked.length < targetCount) {
        const leftovers = shuffle(candidatePool.filter((q) => !pickedIds.has(q.id)));
        const need = targetCount - picked.length;
        leftovers.slice(0, need).forEach((q) => {
          picked.push(q);
          pickedIds.add(q.id);
        });
      }

      // Final shuffle so questions from different CLOs/Bloom appear mixed naturally
      const finalResult = shuffle(picked);
      setGeneratedQuestions(finalResult);
      setIsGenerating(false);
      message.success(`Đã sinh ngẫu nhiên thành công ${finalResult.length} câu hỏi theo chuẩn CLO & Độ khó!`);
    }, 400);
  };

  // Initial auto-generation on modal open if empty
  useEffect(() => {
    if (open && generatedQuestions.length === 0 && candidatePool.length > 0) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Reroll single question with another from pool with matching CLO / difficulty
  const handleRerollSingleQuestion = (indexToReplace: number) => {
    const targetQ = generatedQuestions[indexToReplace];
    const targetClo = getQuestionClo(targetQ);
    const existingIds = new Set(generatedQuestions.map((q) => q.id));

    // Find substitute with same CLO or same difficulty
    let candidates = candidatePool.filter(
      (q) => !existingIds.has(q.id) && getQuestionClo(q) === targetClo && q.difficulty === targetQ.difficulty
    );

    // Fallback: match same difficulty
    if (candidates.length === 0) {
      candidates = candidatePool.filter((q) => !existingIds.has(q.id) && q.difficulty === targetQ.difficulty);
    }

    // Fallback: match same CLO
    if (candidates.length === 0) {
      candidates = candidatePool.filter((q) => !existingIds.has(q.id) && getQuestionClo(q) === targetClo);
    }

    // Fallback: any other question
    if (candidates.length === 0) {
      candidates = candidatePool.filter((q) => !existingIds.has(q.id));
    }

    if (candidates.length === 0) {
      message.info('Không còn câu hỏi thay thế nào khác trong ngân hàng phù hợp tiêu chí này.');
      return;
    }

    const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
    const updated = [...generatedQuestions];
    updated[indexToReplace] = randomPick;
    setGeneratedQuestions(updated);
    message.success(`Đã đổi câu #${indexToReplace + 1} sang câu hỏi khác!`);
  };

  // Calculate scores for generated questions to match target max score
  const computedScores = useMemo(() => {
    if (generatedQuestions.length === 0) return {};
    const scores: Record<string, number> = {};

    // Standard scoring: Essay gets higher weight (e.g. 3x-4x MCQ)
    const hasEssay = generatedQuestions.some((q) => q.type === QUESTION_TYPE.ESSAY);
    const hasMCQ = generatedQuestions.some((q) => q.type !== QUESTION_TYPE.ESSAY);

    if (hasEssay && hasMCQ) {
      const essayCount = generatedQuestions.filter((q) => q.type === QUESTION_TYPE.ESSAY).length;
      const mcqCount = generatedQuestions.length - essayCount;
      // Allocate 60% to essay, 40% to MCQ or proportional
      const essayTotal = maxScoreTarget * 0.6;
      const mcqTotal = maxScoreTarget * 0.4;
      const essayPerQ = Number((essayTotal / essayCount).toFixed(1));
      const mcqPerQ = Number((mcqTotal / mcqCount).toFixed(1));

      generatedQuestions.forEach((q) => {
        scores[q.id] = q.type === QUESTION_TYPE.ESSAY ? essayPerQ : mcqPerQ;
      });
    } else {
      // Equal distribution
      const perQ = Number((maxScoreTarget / generatedQuestions.length).toFixed(2));
      generatedQuestions.forEach((q) => {
        scores[q.id] = perQ;
      });
    }

    return scores;
  }, [generatedQuestions, maxScoreTarget]);

  // Handle Apply button
  const handleApplyToExam = () => {
    if (generatedQuestions.length === 0) {
      message.warning('Vui lòng bấm "Sinh Đề Ngẫu Nhiên" trước khi áp dụng!');
      return;
    }

    onApply({
      questions: generatedQuestions,
      scores: computedScores,
      targetMaxScore: maxScoreTarget,
    });
    onClose();
  };

  // Breakdown metrics of currently generated exam
  const generatedBreakdown = useMemo(() => {
    const diffs: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0, VERY_HARD: 0 };
    const clos: Record<string, number> = { CLO1: 0, CLO2: 0, CLO3: 0, CLO4: 0 };

    generatedQuestions.forEach((q) => {
      if (diffs[q.difficulty] !== undefined) diffs[q.difficulty]++;
      const c = getQuestionClo(q);
      if (clos[c] !== undefined) clos[c]++;
    });

    return { diffs, clos };
  }, [generatedQuestions]);

  return (
    <Modal
      title={
        <div className="d-flex items-center gap-2 py-1">
          <div className="p-1.5 bg-primary-subtle rounded-2 text-brand-color">
            <Dice5 size={20} />
          </div>
          <div>
            <div className="fs-5 font-bold text-primary-color">
              Tạo Đề Thi Ngẫu Nhiên (Random Theo CLO & Độ Khó)
            </div>
            <div className="text-xs text-muted-color">
              Thuật toán tự động trích xuất và phân bổ câu hỏi từ Ngân hàng đề thi theo chuẩn ma trận đầu ra.
            </div>
          </div>
        </div>
      }
      open={open}
      onCancel={onClose}
      width={1100}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="generate-again"
          icon={<RotateCcw size={14} />}
          onClick={handleGenerate}
          loading={isGenerating}
        >
          Sinh đề lại
        </Button>,
        <Button
          key="apply"
          type="primary"
          icon={<CheckCircle2 size={16} />}
          onClick={handleApplyToExam}
          className="velica-btn-primary"
          disabled={generatedQuestions.length === 0}
        >
          Áp dụng vào Đề thi ({generatedQuestions.length} câu)
        </Button>,
      ]}
    >
      <div className="py-2">
        <Row gutter={[20, 20]}>
          {/* Left Column: Configuration Controls */}
          <Col xs={24} md={10}>
            <div className="d-flex flex-col gap-3">
              {/* 1. Target CLO Selection Card */}
              <Card size="small" className="velica-card-spec" title="1. Chọn Chuẩn Đầu Ra (CLO Targets)">
                <div className="d-flex justify-between items-center mb-2">
                  <Text className="text-xs text-muted-color">Tích chọn các CLO cần đánh giá:</Text>
                  <Button
                    type="link"
                    size="small"
                    className="p-0 text-xs"
                    onClick={() => {
                      if (selectedClos.length === AVAILABLE_CLOS.length) setSelectedClos([]);
                      else setSelectedClos(AVAILABLE_CLOS.map((c) => c.id));
                    }}
                  >
                    {selectedClos.length === AVAILABLE_CLOS.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả CLO'}
                  </Button>
                </div>

                <div className="d-flex flex-col gap-2">
                  {AVAILABLE_CLOS.map((clo) => {
                    const isChecked = selectedClos.includes(clo.id);
                    const countInBank = bankCloCounts[clo.id] || 0;

                    return (
                      <div
                        key={clo.id}
                        onClick={() => {
                          if (isChecked) setSelectedClos(selectedClos.filter((c) => c !== clo.id));
                          else setSelectedClos([...selectedClos, clo.id]);
                        }}
                        className={`p-2 rounded-2 border d-flex items-center justify-between cursor-pointer transition-all ${
                          isChecked ? 'bg-primary-subtle border-primary' : 'bg-white hover-bg-light'
                        }`}
                      >
                        <div className="d-flex items-center gap-2">
                          <Checkbox checked={isChecked} />
                          <div>
                            <span className="font-bold text-xs text-primary-color">{clo.name}</span>
                            <div className="text-2xs text-muted-color">{clo.desc}</div>
                          </div>
                        </div>
                        <Tag color={countInBank > 0 ? 'cyan' : 'default'} className="m-0 text-xs font-semibold">
                          {countInBank} câu
                        </Tag>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* 2. Exam Size & Points Card */}
              <Card size="small" className="velica-card-spec" title="2. Quy Mô Đề Thi & Điểm Số">
                <Row gutter={12} align="middle">
                  <Col span={14}>
                    <Text strong className="text-xs text-primary-color d-block mb-1">
                      Số lượng câu hỏi:
                    </Text>
                    <div className="d-flex gap-1 mb-2">
                      {[5, 10, 20, 30].map((num) => (
                        <Button
                          key={num}
                          size="small"
                          type={totalQuestionsCount === num ? 'primary' : 'default'}
                          onClick={() => setTotalQuestionsCount(num)}
                          className="px-2"
                        >
                          {num} câu
                        </Button>
                      ))}
                    </div>
                    <InputNumber
                      min={1}
                      max={Math.max(30, candidatePool.length)}
                      value={totalQuestionsCount}
                      onChange={(v) => setTotalQuestionsCount(v || 5)}
                      className="w-100"
                      addonAfter="câu"
                    />
                  </Col>
                  <Col span={10}>
                    <Text strong className="text-xs text-primary-color d-block mb-1">
                      Thang điểm:
                    </Text>
                    <Select
                      className="w-100"
                      value={maxScoreTarget}
                      onChange={(v: number) => setMaxScoreTarget(v)}
                      options={[
                        { label: 'Thang 10 điểm', value: 10 },
                        { label: 'Thang 100 điểm', value: 100 },
                      ]}
                    />
                    <div className="text-2xs text-muted-color mt-2">
                      Tự động phân bổ đều hoặc chuẩn hóa trắc nghiệm/tự luận.
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* 3. Difficulty Profile (Bloom Taxonomy) Card */}
              <Card size="small" className="velica-card-spec" title="3. Điều Chỉnh Độ Khó Đề Thi (Bloom)">
                <div className="mb-2">
                  <Text strong className="text-xs text-primary-color d-block mb-1.5">
                    Mẫu cấu hình độ khó chuẩn:
                  </Text>
                  <Radio.Group
                    value={difficultyProfile}
                    onChange={(e) => setDifficultyProfile(e.target.value)}
                    className="w-100 d-flex flex-col gap-1.5"
                  >
                    {(Object.keys(DIFFICULTY_PROFILES) as (keyof typeof DIFFICULTY_PROFILES)[]).map((key) => {
                      const prof = DIFFICULTY_PROFILES[key];
                      const isSelected = difficultyProfile === key;

                      return (
                        <div
                          key={key}
                          onClick={() => setDifficultyProfile(key)}
                          className={`p-2 rounded-2 border cursor-pointer ${
                            isSelected ? 'bg-light border-primary' : 'bg-white'
                          }`}
                        >
                          <Radio value={key} className="w-100">
                            <span className="font-bold text-xs text-primary-color">{prof.name}</span>
                            <div className="text-2xs text-muted-color mt-0.5">{prof.description}</div>
                            {key !== 'CUSTOM' && (
                              <div className="d-flex gap-1 mt-1">
                                <Tag color="green" className="m-0 text-2xs">NB: {prof.weights.EASY}%</Tag>
                                <Tag color="blue" className="m-0 text-2xs">TH: {prof.weights.MEDIUM}%</Tag>
                                <Tag color="orange" className="m-0 text-2xs">VD: {prof.weights.HARD}%</Tag>
                                <Tag color="red" className="m-0 text-2xs">VDC: {prof.weights.VERY_HARD}%</Tag>
                              </div>
                            )}
                          </Radio>
                        </div>
                      );
                    })}
                  </Radio.Group>
                </div>

                {/* Custom Weights Sliders if selected */}
                {difficultyProfile === 'CUSTOM' && (
                  <div className="p-2.5 bg-light rounded-2 border mt-2">
                    <div className="d-flex justify-between items-center mb-1 text-xs">
                      <span>Nhận biết (Easy):</span>
                      <strong className="text-success">{customWeights.EASY}%</strong>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={customWeights.EASY}
                      onChange={(v) => setCustomWeights((prev) => ({ ...prev, EASY: v }))}
                    />

                    <div className="d-flex justify-between items-center mb-1 text-xs">
                      <span>Thông hiểu (Medium):</span>
                      <strong className="text-primary">{customWeights.MEDIUM}%</strong>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={customWeights.MEDIUM}
                      onChange={(v) => setCustomWeights((prev) => ({ ...prev, MEDIUM: v }))}
                    />

                    <div className="d-flex justify-between items-center mb-1 text-xs">
                      <span>Vận dụng (Hard):</span>
                      <strong className="text-warning">{customWeights.HARD}%</strong>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={customWeights.HARD}
                      onChange={(v) => setCustomWeights((prev) => ({ ...prev, HARD: v }))}
                    />

                    <div className="d-flex justify-between items-center mb-1 text-xs">
                      <span>Vận dụng cao (Very Hard):</span>
                      <strong className="text-danger">{customWeights.VERY_HARD}%</strong>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={customWeights.VERY_HARD}
                      onChange={(v) => setCustomWeights((prev) => ({ ...prev, VERY_HARD: v }))}
                    />
                  </div>
                )}
              </Card>

              {/* 4. Question Formats Filter Card */}
              <Card size="small" className="velica-card-spec" title="4. Phân Loại Câu Hỏi">
                <Radio.Group
                  value={questionTypeFilter}
                  onChange={(e) => setQuestionTypeFilter(e.target.value)}
                  className="w-100 d-flex flex-col gap-1 text-xs"
                >
                  <Radio value="ALL">Tất cả các loại (Trắc nghiệm đơn, Nhiều đáp án, Đúng/Sai & Tự luận)</Radio>
                  <Radio value="OBJECTIVE_ONLY">Chỉ câu hỏi trắc nghiệm khách quan (Single, Multi, Đúng/Sai)</Radio>
                  <Radio value="ESSAY_ONLY">Chỉ câu hỏi tự luận học thuật (Essay)</Radio>
                </Radio.Group>
                <div className="text-xs text-muted-color mt-2">
                  Kho câu hỏi khả dụng: <strong>{candidatePool.length}</strong> câu
                </div>
              </Card>

              {/* Generate Action Button */}
              <Button
                type="primary"
                size="large"
                icon={<Sparkles size={18} />}
                onClick={handleGenerate}
                loading={isGenerating}
                className="velica-btn-primary py-2 font-bold w-100"
              >
                Sinh Đề Ngẫu Nhiên Ngay (Generate)
              </Button>
            </div>
          </Col>

          {/* Right Column: Generated Exam Live Preview */}
          <Col xs={24} md={14}>
            <Card
              size="small"
              className="velica-card-spec h-100"
              title={
                <div className="d-flex justify-between items-center py-1">
                  <div className="d-flex items-center gap-2">
                    <span className="font-bold text-primary-color">
                      Kết Quả Đề Thi Được Sinh ({generatedQuestions.length} câu hỏi)
                    </span>
                    <Tag color="geekblue" className="font-semibold m-0">
                      Tổng {maxScoreTarget} điểm
                    </Tag>
                  </div>
                  {generatedQuestions.length > 0 && (
                    <Button
                      size="small"
                      icon={<Shuffle size={13} />}
                      onClick={handleGenerate}
                      className="p-1 text-xs"
                    >
                      Bốc lại toàn bộ
                    </Button>
                  )}
                </div>
              }
            >
              {generatedQuestions.length === 0 ? (
                <div className="text-center py-5">
                  <Dice5 size={48} className="text-muted-color mx-auto mb-3 opacity-50" />
                  <div className="font-semibold text-primary-color mb-1">Chưa có câu hỏi nào được sinh</div>
                  <div className="text-xs text-muted-color mb-3">
                    Vui lòng chọn cấu hình CLO và mức độ khó ở cột bên trái rồi bấm nút "Sinh Đề Ngẫu Nhiên Ngay".
                  </div>
                  <Button type="primary" onClick={handleGenerate} icon={<Sparkles size={14} />}>
                    Sinh đề ngay
                  </Button>
                </div>
              ) : (
                <div>
                  {/* Generated Distribution Badges Summary */}
                  <div className="p-2.5 bg-light rounded-2 border mb-3">
                    <div className="d-flex justify-between items-center flex-wrap gap-2 text-xs mb-1.5">
                      <span className="font-bold text-primary-color">📊 Phân bổ thực tế của bộ đề:</span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      <Tag color="green">Nhận biết: {generatedBreakdown.diffs.EASY} câu</Tag>
                      <Tag color="blue">Thông hiểu: {generatedBreakdown.diffs.MEDIUM} câu</Tag>
                      <Tag color="orange">Vận dụng: {generatedBreakdown.diffs.HARD} câu</Tag>
                      <Tag color="red">Vận dụng cao: {generatedBreakdown.diffs.VERY_HARD} câu</Tag>
                      <span className="text-muted-color mx-1">|</span>
                      <Tag color="indigo">CLO1: {generatedBreakdown.clos.CLO1}</Tag>
                      <Tag color="cyan">CLO2: {generatedBreakdown.clos.CLO2}</Tag>
                      <Tag color="purple">CLO3: {generatedBreakdown.clos.CLO3}</Tag>
                      <Tag color="geekblue">CLO4: {generatedBreakdown.clos.CLO4}</Tag>
                    </div>
                  </div>

                  {/* Generated Questions List */}
                  <div
                    className="d-flex flex-col gap-2.5 overflow-y-auto pr-1"
                    style={{ maxHeight: '520px' }}
                  >
                    {generatedQuestions.map((q, idx) => {
                      const clo = getQuestionClo(q);
                      const qScore = computedScores[q.id] || 1;

                      return (
                        <div
                          key={q.id || idx}
                          className="p-3 bg-white rounded-2 border shadow-xs hover-card transition-all"
                        >
                          <div className="d-flex justify-between items-center mb-1.5 flex-wrap gap-1">
                            <Space size={4} wrap>
                              <span className="badge bg-primary text-white text-xs font-bold">
                                Câu #{idx + 1}
                              </span>
                              <Tag color={clo === 'CLO1' ? 'indigo' : clo === 'CLO2' ? 'cyan' : clo === 'CLO3' ? 'purple' : 'geekblue'} className="font-semibold text-xs m-0">
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
                                className="text-xs m-0"
                              >
                                {q.difficulty === 'EASY'
                                  ? 'Nhận biết'
                                  : q.difficulty === 'MEDIUM'
                                  ? 'Thông hiểu'
                                  : q.difficulty === 'HARD'
                                  ? 'Vận dụng'
                                  : 'Vận dụng cao'}
                              </Tag>
                              <Tag color={q.type === QUESTION_TYPE.MCQ ? 'blue' : q.type === QUESTION_TYPE.MULTI_CHOICE ? 'purple' : q.type === QUESTION_TYPE.TRUE_FALSE ? 'cyan' : 'orange'} className="text-xs m-0">
                                {q.type === QUESTION_TYPE.MCQ
                                  ? 'Trắc nghiệm đơn'
                                  : q.type === QUESTION_TYPE.MULTI_CHOICE
                                  ? 'Nhiều lựa chọn'
                                  : q.type === QUESTION_TYPE.TRUE_FALSE
                                  ? 'Đúng/Sai'
                                  : 'Tự luận'}
                              </Tag>
                              <Tag color="gold" className="font-bold text-xs m-0">
                                {qScore} điểm
                              </Tag>
                            </Space>

                            <Tooltip title="Đổi câu hỏi này sang một câu hỏi khác trong ngân hàng cùng chuẩn CLO và độ khó">
                              <Button
                                size="small"
                                type="text"
                                icon={<RefreshCw size={13} className="text-brand-color" />}
                                onClick={() => handleRerollSingleQuestion(idx)}
                                className="text-xs text-brand-color p-1"
                              >
                                Đổi câu khác
                              </Button>
                            </Tooltip>
                          </div>

                          <div className="text-xs text-primary-color font-medium leading-relaxed my-1">
                            <MathRenderer content={q.content} />
                          </div>

                          {q.options && q.options.length > 0 && (
                            <div className="d-flex flex-wrap gap-1 mt-1 text-2xs text-muted-color">
                              {q.options.slice(0, 4).map((opt, oIdx) => (
                                <span
                                  key={opt.id}
                                  className={`p-1 px-1.5 rounded border ${
                                    opt.isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold' : 'bg-light'
                                  }`}
                                >
                                  {String.fromCharCode(65 + oIdx)}. <MathRenderer content={opt.text} />
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

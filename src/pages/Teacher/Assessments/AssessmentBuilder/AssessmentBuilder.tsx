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

  const [form] = Form.useForm();
  const targetMaxScore = Form.useWatch('maxScore', form) || 10;

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
          latePolicyEnabled: true,
          latePenaltyPercent: 10,
          lateDeadlineMinutesAfter: 15,
          classId: queryClassId || clsList[0]?.id,
          cloMappings: [
            { cloId: 'clo-1', weightPercent: 50 },
            { cloId: 'clo-2', weightPercent: 50 },
          ],
        });
        const initialPicked = qList.slice(0, 4);
        setSelectedQuestions(initialPicked);
        const scores: Record<string, number> = {};
        initialPicked.forEach((q) => {
          scores[q.id] = q.type === QUESTION_TYPE.ESSAY ? 4.0 : 2.0;
        });
        setQuestionScores(scores);
      }
    };
    init();
  }, [id, form]);

  // Compute total allocated points from individual questions
  const totalAllocatedScore = selectedQuestions.reduce((acc, q) => {
    return acc + (questionScores[q.id] || (q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0));
  }, 0);

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
    message.success(`Đã tự động chọn ${picked.length} câu hỏi theo ma trận Bloom.`);
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
      latePolicy: {
        enabled: values.latePolicyEnabled,
        deadlineMinutesAfter: values.lateDeadlineMinutesAfter,
        penaltyPercent: values.latePenaltyPercent,
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
      latePolicy: {
        enabled: values.latePolicyEnabled,
        deadlineMinutesAfter: values.lateDeadlineMinutesAfter,
        penaltyPercent: values.latePenaltyPercent,
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
                >
                  <InputNumber min={5} max={240} step={5} addonAfter="phút" size="large" className="w-100" />
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
          </Card>
        )}

        {/* =========================================================================
            PHASE 2: MA TRẬN CÂU HỎI & GÁN ĐIỂM TỪNG CÂU
           ========================================================================= */}
        {currentStep === 1 && (
          <div>
            {/* Live Point Balance Indicator Bar */}
            <div className="velica-hero-banner mb-3 p-3">
              <div className="d-flex items-center justify-between flex-wrap gap-2">
                <div className="d-flex items-center gap-3">
                  <div className="d-flex items-center gap-2">
                    <Calculator size={18} className="text-brand-color" />
                    <span className="font-semibold text-sm">Điểm số phân bổ:</span>
                  </div>

                  <span
                    className={
                      Math.abs(totalAllocatedScore - targetMaxScore) < 0.01
                        ? 'velica-badge-green font-bold fs-15'
                        : 'velica-badge-orange font-bold fs-15'
                    }
                  >
                    {totalAllocatedScore.toFixed(1)} / {targetMaxScore} điểm
                  </span>

                  {Math.abs(totalAllocatedScore - targetMaxScore) < 0.01 ? (
                    <Tag color="success" className="velica-tag-pill">
                      ✓ Đã khớp 100% thang điểm đề
                    </Tag>
                  ) : (
                    <Tag color="warning" className="velica-tag-pill">
                      Chênh lệch: {(targetMaxScore - totalAllocatedScore).toFixed(1)} điểm
                    </Tag>
                  )}
                </div>

                <Space>
                  <Button
                    size="small"
                    onClick={handleEqualizeScores}
                    className="velica-btn-action"
                  >
                    Chia đều điểm cho các câu
                  </Button>
                  <Button
                    size="small"
                    onClick={handleStandardScoreAllocation}
                    className="velica-btn-action"
                  >
                    Định mức (TN 1đ, TL 4đ)
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<Sparkles size={14} />}
                    onClick={handleAutoGenerateQuestions}
                    className="velica-btn-primary"
                  >
                    Tự động sinh đề theo Bloom
                  </Button>
                </Space>
              </div>
            </div>

            <Row gutter={[20, 20]}>
              {/* Left Column: Selected Questions with Points Input */}
              <Col xs={24} lg={14}>
                <Card
                  bordered
                  title={
                    <div className="d-flex items-center justify-between">
                      <span className="velica-card-header-title">
                        Các câu hỏi đã chọn trong đề ({selectedQuestions.length} câu)
                      </span>
                      <span className="text-xs text-muted-color">
                        Nhập điểm cho từng câu ở cột bên phải
                      </span>
                    </div>
                  }
                  className="velica-wizard-step-card"
                >
                  {selectedQuestions.length === 0 ? (
                    <div className="text-center py-5 text-muted-color">
                      Chưa có câu hỏi nào trong đề. Vui lòng bấm chọn từ ngân hàng bên phải.
                    </div>
                  ) : (
                    <div className="d-flex flex-col gap-3">
                      {selectedQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-3 bg-light border rounded-3 d-flex items-start justify-between gap-3"
                        >
                          <div className="flex-1">
                            <div className="d-flex items-center gap-2 mb-1 flex-wrap">
                              <span className="badge bg-secondary font-semibold">Câu #{idx + 1}</span>
                              <Tag color={q.type === QUESTION_TYPE.MCQ ? 'blue' : 'default'} className="velica-tag-pill">
                                {q.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm' : 'Tự luận'}
                              </Tag>
                              <Tag color="geekblue" className="velica-tag-pill">
                                {q.difficulty}
                              </Tag>
                              {q.imageUrl && (
                                <Tag color="cyan" className="velica-tag-pill d-inline-flex items-center gap-1">
                                  <ImageIcon size={11} /> Có sơ đồ
                                </Tag>
                              )}
                              <Button
                                size="small"
                                type="text"
                                icon={<Eye size={12} />}
                                onClick={() => setPreviewQuestion(q)}
                                className="p-0 text-brand-color text-xs d-inline-flex items-center gap-1 ms-1"
                              >
                                Xem chi tiết
                              </Button>
                            </div>
                            <Tooltip title={q.content} placement="topLeft">
                              <div
                                className="font-semibold text-sm text-primary-color cursor-pointer hover-text-brand"
                                onClick={() => setPreviewQuestion(q)}
                              >
                                {q.content}
                              </div>
                            </Tooltip>
                          </div>

                          <div className="d-flex items-center gap-2 flex-shrink-0">
                            <div>
                              <div className="text-xs text-muted-color mb-1 text-end">Điểm câu:</div>
                              <InputNumber
                                min={0.25}
                                max={10}
                                step={0.25}
                                value={questionScores[q.id] || (q.type === QUESTION_TYPE.ESSAY ? 4.0 : 1.0)}
                                onChange={(val) => handleUpdateQuestionScore(q.id, val)}
                                addonAfter="đ"
                                className="w-100"
                              />
                            </div>
                            <Button
                              type="text"
                              danger
                              icon={<Trash2 size={15} />}
                              onClick={() => handleToggleSelectQuestion(q)}
                              className="mt-3"
                              title="Gỡ khỏi đề thi"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </Col>

              {/* Right Column: Question Bank Browser */}
              <Col xs={24} lg={10}>
                <Card
                  bordered
                  title={
                    <div className="d-flex items-center justify-between">
                      <span className="velica-card-header-title">Ngân hàng Câu hỏi Sẵn có</span>
                      <span className="text-xs text-muted-color">Bấm để thêm/gỡ</span>
                    </div>
                  }
                  className="velica-wizard-step-card"
                >
                  <div className="d-flex flex-col gap-2 max-h-560 overflow-y-auto pr-1">
                    {bankQuestions.map((q) => {
                      const isSelected = selectedQuestions.some((item) => item.id === q.id);
                      return (
                        <div
                          key={q.id}
                          className={`p-3 border rounded-3 transition-all ${
                            isSelected
                              ? 'bg-light-brand border-brand'
                              : 'bg-white hover-bg-light border-light'
                          }`}
                        >
                          <div className="d-flex justify-between items-center mb-1">
                            <Space size={4}>
                              <Tag color={q.type === QUESTION_TYPE.MCQ ? 'blue' : 'default'} className="velica-tag-pill">
                                {q.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm' : 'Tự luận'}
                              </Tag>
                              <Tag color="geekblue" className="velica-tag-pill">
                                {q.difficulty}
                              </Tag>
                              <Tooltip title="Xem chi tiết câu hỏi & đáp án mẫu">
                                <Button
                                  size="small"
                                  type="text"
                                  icon={<Eye size={12} className="text-muted-color" />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewQuestion(q);
                                  }}
                                  className="p-1 h-auto"
                                />
                              </Tooltip>
                            </Space>

                            {isSelected ? (
                              <Tag
                                color="success"
                                className="velica-tag-pill cursor-pointer"
                                onClick={() => handleToggleSelectQuestion(q)}
                              >
                                ✓ Đã trong đề
                              </Tag>
                            ) : (
                              <Button
                                size="small"
                                type="dashed"
                                icon={<Plus size={12} />}
                                onClick={() => handleToggleSelectQuestion(q)}
                              >
                                Chọn
                              </Button>
                            )}
                          </div>

                          <Tooltip title={q.content} placement="topLeft">
                            <div
                              className="text-xs font-medium text-primary-color line-clamp-2 cursor-pointer hover-text-brand"
                              onClick={() => handleToggleSelectQuestion(q)}
                            >
                              {q.content}
                            </div>
                          </Tooltip>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </Col>
            </Row>
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
                        <div className="font-semibold text-sm text-primary-color">Chính sách xử lý nộp bài trễ (Late Submission)</div>
                        <div className="text-xs text-muted-color">Cho phép nộp bài sau giờ kèm mức trừ điểm phần trăm</div>
                      </div>
                      <Form.Item name="latePolicyEnabled" valuePropName="checked" className="m-0">
                        <Switch />
                      </Form.Item>
                    </div>

                    <div className="d-flex items-center gap-3 mt-2">
                      <Form.Item name="latePenaltyPercent" label="Mức trừ điểm" className="m-0">
                        <InputNumber min={5} max={50} step={5} addonAfter="%" />
                      </Form.Item>
                      <Form.Item name="lateDeadlineMinutesAfter" label="Thời gian ân hạn tối đa" className="m-0">
                        <InputNumber min={5} max={60} step={5} addonAfter="phút" />
                      </Form.Item>
                    </div>
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

      {/* Question Detail & Solution Preview Drawer */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <Eye size={18} className="text-brand-color" />
            <span className="font-bold">Xem Chi Tiết Câu Hỏi Khảo Thí</span>
          </div>
        }
        open={!!previewQuestion}
        onClose={() => setPreviewQuestion(null)}
        width={560}
      >
        {previewQuestion && (
          <div>
            <div className="d-flex items-center gap-2 mb-3 flex-wrap">
              <Tag color={previewQuestion.type === QUESTION_TYPE.MCQ ? 'blue' : 'default'} className="font-semibold">
                {previewQuestion.type === QUESTION_TYPE.MCQ ? 'Trắc nghiệm (MCQ)' : 'Tự luận (Essay)'}
              </Tag>
              <Tag color="geekblue" className="font-semibold">
                Độ khó: {previewQuestion.difficulty}
              </Tag>
              {previewQuestion.points && (
                <Tag color="orange" className="font-semibold">
                  {previewQuestion.points} điểm
                </Tag>
              )}
            </div>

            {/* Question Text */}
            <div className="p-3 bg-light rounded-3 border mb-3">
              <div className="text-xs text-muted-color font-bold text-uppercase mb-1">
                Nội dung đề bài câu hỏi:
              </div>
              <div className="text-sm font-semibold text-primary-color lh-base">
                {previewQuestion.content}
              </div>
            </div>

            {/* Attached Diagram / Image */}
            {previewQuestion.imageUrl && (
              <div className="mb-4">
                <div className="text-xs text-muted-color font-bold text-uppercase mb-1">
                  Sơ đồ / Hình ảnh minh họa:
                </div>
                <div className="border rounded-3 p-2 bg-white text-center">
                  <img
                    src={previewQuestion.imageUrl}
                    alt="Question Diagram"
                    className="max-h-240 mx-auto object-contain rounded"
                  />
                </div>
              </div>
            )}

            {/* MCQ Options with Answer Indicator */}
            {previewQuestion.options && previewQuestion.options.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-primary-color mb-2">
                  Các phương án lựa chọn:
                </div>
                <div className="d-flex flex-col gap-2">
                  {previewQuestion.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className={`p-2 border rounded-2 d-flex items-start gap-2 ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-white'
                      }`}
                    >
                      <span className={`font-bold text-xs ${opt.isCorrect ? 'text-emerald-700' : 'text-secondary-color'}`}>
                        {String.fromCharCode(65 + i)}.
                      </span>
                      <span className={`text-xs flex-1 ${opt.isCorrect ? 'font-semibold text-emerald-900' : 'text-primary-color'}`}>
                        {opt.text}
                      </span>
                      {opt.isCorrect && (
                        <Tag color="success" className="m-0 font-semibold text-xs">
                          ✓ Đáp án đúng
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation / Sample Answer */}
            {previewQuestion.explanation && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2 mb-3">
                <div className="text-xs text-sky-800 font-bold mb-1">
                  💡 Hướng dẫn giải / Tiêu chí chấm mẫu:
                </div>
                <div className="text-xs text-sky-900 lh-base whitespace-pre-wrap">
                  {previewQuestion.explanation}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Select,
  Row,
  Col,
  Space,
  Tag,
  Typography,
  Divider,
  message,
  Alert,
  Tooltip,
  Breadcrumb,
  Spin,
  Popconfirm,
} from 'antd';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  BookOpen,
  Award,
  Target,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import {
  Syllabus,
  LearningObjective,
  SyllabusAssessmentItem,
  Rubric,
} from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const SyllabusEditorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id && id !== 'create');

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalSyllabus, setOriginalSyllabus] = useState<Syllabus | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);

  useEffect(() => {
    mockService.getRubrics().then((data) => setRubrics(data));
  }, []);

  // Watch learning objectives dynamically to populate quick CLO picker
  const watchedObjectives = Form.useWatch('learningObjectives', form);
  const watchedAssessments = Form.useWatch('assessments', form);

  // Derived available CLO list from Section 3
  const availableCLOs = useMemo(() => {
    if (!watchedObjectives || !Array.isArray(watchedObjectives)) return [];
    return watchedObjectives
      .filter((clo: any) => clo && typeof clo.code === 'string' && clo.code.trim().length > 0)
      .map((clo: any) => ({
        code: clo.code.trim().toUpperCase(),
        description: clo.description || '',
      }));
  }, [watchedObjectives]);

  // Derived total weight sum of assessment components
  const totalWeight = useMemo(() => {
    if (!watchedAssessments || !Array.isArray(watchedAssessments)) return 0;
    return watchedAssessments.reduce((sum: number, asm: any) => {
      const w = Number(asm?.weight) || 0;
      return sum + w;
    }, 0);
  }, [watchedAssessments]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!isEditMode || !id) {
        // Initial defaults for Create
        form.setFieldsValue({
          code: 'SE' + Math.floor(100 + Math.random() * 900),
          name: '',
          courseNameEnglish: '',
          degreeLevel: 'Bachelor',
          scoringScale: 10,
          minAvgMarkToPass: 4.0,
          preRequisite: '',
          timeAllocation: 'Study hour (150h) = 45h contact hours + 105h self-study',
          learningTeachingMethod: 'Social Constructivism, In-class lecture, Inquiry-based Teaching',
          description: '',
          learningObjectives: [
            { code: 'CLO1', description: 'Nắm vững kiến thức nền tảng và nguyên lý cốt lõi của môn học.' },
            { code: 'CLO2', description: 'Phân tích và áp dụng các kỹ thuật thiết kế giải quyết bài toán thực tế.' },
            { code: 'CLO3', description: 'Đánh giá các giải pháp kỹ thuật, cân nhắc trade-offs và tối ưu hệ thống.' },
            { code: 'CLO4', description: 'Kỹ năng làm việc nhóm, phản biện và thuyết trình giải pháp kỹ thuật.' },
          ],
          assessments: [
            {
              category: 'Assignment (Bài tập lớn)',
              type: 'on-going',
              weight: 10,
              completionCriteria: '> 0',
              clo: ['CLO1', 'CLO2'],
              questionType: 'Coding assignment & review',
              duration: '16 slots',
              gradingGuide: 'Đánh giá theo commit và tiến độ nộp bài',
            },
            {
              category: 'Group Project (Đồ án nhóm)',
              type: 'on-going',
              weight: 25,
              completionCriteria: '> 0',
              clo: ['CLO1', 'CLO2', 'CLO3', 'CLO4'],
              questionType: 'End-to-end implementation & defense',
              duration: '30 slots',
              gradingGuide: 'Chấm demo sản phẩm, báo cáo và vấn đáp cá nhân',
            },
            {
              category: 'Progress Test (Kiểm tra tiến độ)',
              type: 'on-going',
              weight: 10,
              completionCriteria: '> 0',
              clo: ['CLO1', 'CLO2'],
              questionType: 'Multiple choices (Computer marked)',
              duration: '30 phút',
              gradingGuide: 'Hệ thống khảo thí chấm tự động',
            },
            {
              category: 'Final Exam (Thi kết thúc học phần)',
              type: 'Final exam',
              weight: 55,
              completionCriteria: '>= 4.0 / 10',
              clo: ['CLO1', 'CLO2', 'CLO3', 'CLO4'],
              questionType: 'Practical & Theory final examination',
              duration: '120 phút',
              gradingGuide: 'Chấm theo thang điểm và đáp án quy định',
            },
          ],
        });
        return;
      }

      setLoading(true);
      try {
        const syl = await mockService.getSyllabusById(id);
        if (syl) {
          setOriginalSyllabus(syl);

          // Normalize assessment CLOs from comma-separated string to array for multi-select
          const normalizedAssessments = (syl.assessments || []).map((asm) => {
            let cloArray: string[] = [];
            if (Array.isArray(asm.clo)) {
              cloArray = asm.clo;
            } else if (typeof asm.clo === 'string') {
              cloArray = asm.clo
                .split(',')
                .map((c) => c.trim().toUpperCase())
                .filter(Boolean);
            }
            return {
              ...asm,
              clo: cloArray,
            };
          });

          form.setFieldsValue({
            code: syl.code,
            name: syl.name,
            courseNameEnglish: syl.courseNameEnglish || '',
            degreeLevel: syl.degreeLevel || 'Bachelor',
            scoringScale: syl.scoringScale || 10,
            minAvgMarkToPass: syl.minAvgMarkToPass || 4.0,
            preRequisite: syl.preRequisite || '',
            timeAllocation: syl.timeAllocation || '',
            learningTeachingMethod: syl.learningTeachingMethod || '',
            description: syl.description || '',
            learningObjectives: syl.learningObjectives || [],
            assessments: normalizedAssessments,
          });
        } else {
          message.error('Không tìm thấy đề cương môn học!');
          navigate(ROUTE_PATHS.TEACHER.SYLLABUS);
        }
      } catch {
        message.error('Lỗi khi tải dữ liệu đề cương!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, form, navigate]);

  // Quick CLO helpers for a specific assessment row
  const handleToggleCLO = (fieldIndex: number, cloCode: string) => {
    const currentAssessments = form.getFieldValue('assessments') || [];
    const targetItem = currentAssessments[fieldIndex] || {};
    const currentCLOs: string[] = Array.isArray(targetItem.clo)
      ? [...targetItem.clo]
      : typeof targetItem.clo === 'string'
      ? targetItem.clo.split(',').map((c: string) => c.trim().toUpperCase()).filter(Boolean)
      : [];

    let updatedCLOs: string[];
    if (currentCLOs.includes(cloCode)) {
      updatedCLOs = currentCLOs.filter((c) => c !== cloCode);
    } else {
      updatedCLOs = [...currentCLOs, cloCode];
    }

    currentAssessments[fieldIndex] = {
      ...targetItem,
      clo: updatedCLOs,
    };
    form.setFieldsValue({ assessments: currentAssessments });
  };

  const handleSelectAllCLOs = (fieldIndex: number) => {
    const currentAssessments = form.getFieldValue('assessments') || [];
    const targetItem = currentAssessments[fieldIndex] || {};
    const allCodes = availableCLOs.map((c) => c.code);

    currentAssessments[fieldIndex] = {
      ...targetItem,
      clo: allCodes,
    };
    form.setFieldsValue({ assessments: currentAssessments });
  };

  const handleClearCLOs = (fieldIndex: number) => {
    const currentAssessments = form.getFieldValue('assessments') || [];
    const targetItem = currentAssessments[fieldIndex] || {};

    currentAssessments[fieldIndex] = {
      ...targetItem,
      clo: [],
    };
    form.setFieldsValue({ assessments: currentAssessments });
  };

  // Submit Handler
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Normalize assessments clo array back to comma-separated string for persistence compatibility
      const processedAssessments = (values.assessments || []).map((asm: any, idx: number) => {
        const cloStr = Array.isArray(asm.clo)
          ? asm.clo.join(', ')
          : typeof asm.clo === 'string'
          ? asm.clo
          : '';

        return {
          no: asm.no || idx + 1,
          category: asm.category,
          type: asm.type || 'on-going',
          weight: Number(asm.weight) || 0,
          completionCriteria: asm.completionCriteria || '> 0',
          clo: cloStr,
          questionType: asm.questionType || '',
          duration: asm.duration || '',
          gradingGuide: asm.gradingGuide || '',
        };
      });

      const payload = {
        ...values,
        assessments: processedAssessments,
      };

      if (isEditMode && id) {
        await mockService.updateSyllabus(id, payload);
        message.success('Cập nhật Đề cương môn học thành công!');
        navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', id));
      } else {
        const created = await mockService.createSyllabus(payload);
        message.success('Tạo Đề cương môn học mới thành công!');
        navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', created.id));
      }
    } catch {
      message.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spin size="large" tip="Đang tải dữ liệu đề cương..." />
      </div>
    );
  }

  return (
    <div className="velica-page-container">
      {/* 1. Breadcrumbs & Top Navigation Bar */}
      <div className="d-flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <Breadcrumb
            items={[
              { title: <Link to={ROUTE_PATHS.TEACHER.CLASSES}>Quản lý Lớp</Link> },
              { title: <Link to={ROUTE_PATHS.TEACHER.SYLLABUS}>Đề cương Môn học</Link> },
              {
                title: isEditMode
                  ? `Chỉnh sửa: ${originalSyllabus?.code || id}`
                  : 'Tạo Đề cương mới',
              },
            ]}
            className="mb-2"
          />
          <div className="d-flex items-center gap-3">
            <Button
              icon={<ArrowLeft size={16} />}
              onClick={() => navigate(ROUTE_PATHS.TEACHER.SYLLABUS)}
              className="velica-btn-action"
            >
              Quay lại
            </Button>
            <div>
              <h1 className="fs-22 font-bold text-primary-color m-0">
                {isEditMode
                  ? `Chỉnh sửa Đề cương: ${originalSyllabus?.name || id}`
                  : 'Tạo Đề cương Môn học mới (Toàn trang)'}
              </h1>
              <p className="text-xs text-secondary-color m-0 mt-0.5">
                Thiết kế cấu trúc học phần, chuẩn đầu ra (CLO) và thành phần đánh giá học tập.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="d-flex items-center gap-2">
          <Button onClick={() => navigate(ROUTE_PATHS.TEACHER.SYLLABUS)}>
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            icon={<Save size={16} />}
            loading={saving}
            onClick={handleSubmit}
            className="velica-btn-primary"
          >
            {isEditMode ? 'Lưu thay đổi Đề cương' : 'Tạo Đề cương môn học'}
          </Button>
        </div>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[20, 20]}>
          {/* Main Content (Left 16 cols) */}
          <Col xs={24} lg={16}>
            {/* Card 1: Thông tin Chung Học phần */}
            <Card
              title={
                <div className="d-flex items-center gap-2">
                  <BookOpen size={18} className="text-brand-color" />
                  <span className="font-bold text-sm">1. Thông tin Chung Học phần</span>
                </div>
              }
              className="velica-card mb-4"
            >
              <Row gutter={16}>
                <Col xs={24} sm={8}>
                  <Form.Item
                    name="code"
                    label="Mã học phần"
                    rules={[{ required: true, message: 'Nhập mã học phần' }]}
                  >
                    <Input placeholder="Vd: SE301 / MSS301" className="font-mono font-bold" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={16}>
                  <Form.Item
                    name="name"
                    label="Tên đề cương môn học (Tiếng Việt)"
                    rules={[{ required: true, message: 'Nhập tên đề cương' }]}
                  >
                    <Input placeholder="Vd: Kiến Trúc & Thiết Kế Phần Mềm" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={16}>
                  <Form.Item
                    name="courseNameEnglish"
                    label="Tên môn học tiếng Anh (Course Name in English)"
                  >
                    <Input placeholder="Vd: Software Architecture and Design" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={8}>
                  <Form.Item name="scoringScale" label="Thang điểm">
                    <Select
                      options={[
                        { label: 'Thang 10', value: 10 },
                        { label: 'Thang 100', value: 100 },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="description"
                label="Mô tả mục tiêu môn học (Course Description)"
                rules={[{ required: true, message: 'Nhập mô tả đề cương' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Mô tả chi tiết nội dung chương trình đào tạo, mục tiêu kiến thức và kỹ năng cần trang bị cho người học..."
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item name="preRequisite" label="Học phần tiên quyết">
                    <Input placeholder="Vd: Lập trình hướng đối tượng (OOP201)" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="timeAllocation" label="Phân bổ thời gian học tập">
                    <Input placeholder="Vd: 45h lý thuyết + 30h thực hành + 75h tự học" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            {/* Card 2: Chuẩn đầu ra môn học (CLO) */}
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <div className="d-flex items-center gap-2">
                    <Target size={18} className="text-brand-color" />
                    <span className="font-bold text-sm">
                      2. Chuẩn đầu ra môn học (Course Learning Objectives - CLO)
                    </span>
                  </div>
                  <Tag color="blue" className="font-semibold text-xs m-0">
                    {availableCLOs.length} chuẩn CLO đã định nghĩa
                  </Tag>
                </div>
              }
              className="velica-card mb-4"
            >
              <Alert
                message="Định nghĩa danh mục chuẩn đầu ra (CLO) tại đây. Mục 'Cấu trúc & Điểm thành phần' bên dưới sẽ tự động lấy danh sách CLO này để bạn bấm chọn nhanh mà không cần gõ phím."
                type="info"
                showIcon
                className="mb-3 text-xs"
              />

              <Form.List name="learningObjectives">
                {(fields, { add, remove }) => (
                  <div>
                    {fields.map(({ key, name, ...restField }, idx) => (
                      <div
                        key={key}
                        className="p-3 bg-light border rounded mb-2 d-flex items-start gap-2"
                      >
                        <div className="font-bold text-secondary-color pt-1 min-w-30">
                          #{idx + 1}
                        </div>
                        <Form.Item
                          {...restField}
                          name={[name, 'code']}
                          rules={[{ required: true, message: 'Nhập mã CLO' }]}
                          className="w-120 mb-0"
                        >
                          <Input
                            placeholder={`CLO${idx + 1}`}
                            className="font-mono font-bold text-brand-color"
                          />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          rules={[{ required: true, message: 'Nhập mô tả chuẩn đầu ra' }]}
                          className="flex-1 mb-0"
                        >
                          <Input.TextArea
                            rows={1}
                            autoSize={{ minRows: 1, maxRows: 3 }}
                            placeholder="Mô tả năng lực, kiến thức hoặc kỹ năng sinh viên đạt được..."
                          />
                        </Form.Item>

                        <Popconfirm
                          title="Xóa chuẩn CLO này?"
                          onConfirm={() => remove(name)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<Trash2 size={16} />}
                            className="pt-1"
                          />
                        </Popconfirm>
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      block
                      icon={<Plus size={15} />}
                      onClick={() =>
                        add({
                          code: `CLO${fields.length + 1}`,
                          description: '',
                        })
                      }
                      className="mt-2"
                    >
                      Thêm Chuẩn đầu ra (CLO) mới
                    </Button>
                  </div>
                )}
              </Form.List>
            </Card>

            {/* Card 3: Cấu trúc & Điểm thành phần đánh giá (Assessment Scheme) with QUICK CLO PICKER */}
            <Card
              title={
                <div className="d-flex items-center justify-between flex-wrap gap-2">
                  <div className="d-flex items-center gap-2">
                    <Award size={18} className="text-brand-color" />
                    <span className="font-bold text-sm">
                      3. Cấu trúc & Điểm thành phần Đánh giá (Assessment Scheme)
                    </span>
                  </div>

                  <div className="d-flex items-center gap-2">
                    <span className="text-xs text-secondary-color font-semibold">
                      Tổng trọng số:
                    </span>
                    <Tag
                      color={totalWeight === 100 ? 'success' : 'warning'}
                      className="fs-13 font-bold px-2 py-0.5 m-0"
                    >
                      {totalWeight}% {totalWeight === 100 ? '✓ Đạt chuẩn 100%' : '⚠️ Chưa đủ 100%'}
                    </Tag>
                  </div>
                </div>
              }
              className="velica-card mb-4"
            >
              {totalWeight !== 100 && (
                <Alert
                  message={`Tổng trọng số hiện tại là ${totalWeight}%. Quy chế đào tạo yêu cầu tổng các điểm thành phần phải bằng đúng 100%.`}
                  type="warning"
                  showIcon
                  className="mb-3 text-xs"
                />
              )}

              <Form.List name="assessments">
                {(fields, { add, remove }) => (
                  <div>
                    {fields.map(({ key, name, ...restField }, idx) => {
                      const currentItem = watchedAssessments?.[name] || {};
                      const currentSelectedCLOs: string[] = Array.isArray(currentItem.clo)
                        ? currentItem.clo
                        : typeof currentItem.clo === 'string'
                        ? currentItem.clo
                            .split(',')
                            .map((c: string) => c.trim().toUpperCase())
                            .filter(Boolean)
                        : [];

                      return (
                        <div
                          key={key}
                          className="p-3 bg-light border rounded-2 mb-3 shadow-2xs"
                        >
                          <div className="d-flex justify-between items-center mb-2 pb-2 border-bottom">
                            <div className="d-flex items-center gap-2">
                              <span className="badge bg-primary text-white font-bold">
                                #{idx + 1}
                              </span>
                              <span className="font-bold text-sm text-primary-color">
                                {currentItem.category || `Thành phần đánh giá #${idx + 1}`}
                              </span>
                              <Tag
                                color={currentItem.type === 'Final exam' ? 'volcano' : 'blue'}
                                className="text-xs m-0"
                              >
                                {currentItem.type === 'Final exam' ? 'Thi Cuối Kỳ' : 'Quá trình'}
                              </Tag>
                            </div>

                            <Popconfirm
                              title="Xóa thành phần đánh giá này?"
                              onConfirm={() => remove(name)}
                              okText="Xóa"
                              cancelText="Hủy"
                              okButtonProps={{ danger: true }}
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<Trash2 size={14} />}
                              >
                                Xóa
                              </Button>
                            </Popconfirm>
                          </div>

                          <Row gutter={12}>
                            <Col xs={24} sm={9}>
                              <Form.Item
                                {...restField}
                                name={[name, 'category']}
                                label={<span className="text-xs font-semibold">Tên hạng mục đánh giá</span>}
                                rules={[{ required: true, message: 'Nhập tên hạng mục' }]}
                                className="mb-2"
                              >
                                <Input placeholder="Vd: Assignment / Group Project / Final Exam" />
                              </Form.Item>
                            </Col>

                            <Col xs={12} sm={5}>
                              <Form.Item
                                {...restField}
                                name={[name, 'type']}
                                label={<span className="text-xs font-semibold">Phân loại</span>}
                                rules={[{ required: true }]}
                                className="mb-2"
                              >
                                <Select
                                  options={[
                                    { label: 'Quá trình (on-going)', value: 'on-going' },
                                    { label: 'Cuối kỳ (Final exam)', value: 'Final exam' },
                                  ]}
                                />
                              </Form.Item>
                            </Col>

                            <Col xs={12} sm={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'weight']}
                                label={<span className="text-xs font-semibold">Trọng số (%)</span>}
                                rules={[{ required: true, message: 'Nhập %' }]}
                                className="mb-2"
                              >
                                <InputNumber
                                  min={1}
                                  max={100}
                                  addonAfter="%"
                                  className="w-100 font-bold"
                                />
                              </Form.Item>
                            </Col>

                            <Col xs={24} sm={6}>
                              <Form.Item
                                {...restField}
                                name={[name, 'completionCriteria']}
                                label={<span className="text-xs font-semibold">Điều kiện đạt</span>}
                                className="mb-2"
                              >
                                <Input placeholder="Vd: > 0 hoặc >= 4.0 / 10" />
                              </Form.Item>
                            </Col>
                          </Row>

                          {/* ========================================================
                              KEY FEATURE: QUICK CLO SELECTION FROM DEFINED CLOS ABOVE
                              ======================================================== */}
                          <div className="p-2.5 bg-white rounded border border-light mt-1 mb-2">
                            <div className="d-flex items-center justify-between flex-wrap gap-1 mb-2">
                              <div className="d-flex items-center gap-1.5">
                                <Sparkles size={14} className="text-brand-color" />
                                <span className="font-semibold text-xs text-primary-color">
                                  Chuẩn CLO liên kết (Ghi nhận nhanh từ Mục 2):
                                </span>
                              </div>

                              <div className="d-flex items-center gap-2">
                                <Button
                                  type="link"
                                  size="small"
                                  className="p-0 text-xs font-semibold text-brand-color"
                                  onClick={() => handleSelectAllCLOs(name)}
                                >
                                  Chọn tất cả CLO
                                </Button>
                                <span className="text-muted-color">|</span>
                                <Button
                                  type="link"
                                  size="small"
                                  danger
                                  className="p-0 text-xs"
                                  onClick={() => handleClearCLOs(name)}
                                >
                                  Bỏ chọn
                                </Button>
                              </div>
                            </div>

                            {/* Dropdown Multi-Select */}
                            <Form.Item
                              {...restField}
                              name={[name, 'clo']}
                              rules={[{ required: true, message: 'Chọn ít nhất 1 chuẩn CLO' }]}
                              className="mb-2"
                            >
                              <Select
                                mode="multiple"
                                placeholder="Chọn hoặc bấm vào các nút CLO bên dưới..."
                                options={availableCLOs.map((c) => ({
                                  value: c.code,
                                  label: `${c.code}: ${c.description || 'Chuẩn đầu ra'}`,
                                }))}
                                tagRender={(tagProps) => {
                                  const { value, closable, onClose } = tagProps;
                                  const cloItem = availableCLOs.find((c) => c.code === value);
                                  return (
                                    <Tooltip title={cloItem?.description || value} placement="top">
                                      <Tag
                                        color="blue"
                                        closable={closable}
                                        onClose={onClose}
                                        className="my-0.5 mr-1 font-bold text-xs px-2 py-0.5"
                                      >
                                        {value}
                                      </Tag>
                                    </Tooltip>
                                  );
                                }}
                                className="w-100"
                              />
                            </Form.Item>

                            {/* Interactive Quick-Pick Chips */}
                            <div className="d-flex items-center gap-1.5 flex-wrap pt-1">
                              <span className="text-xs text-muted-color mr-1">Bấm chọn nhanh:</span>
                              {availableCLOs.map((clo) => {
                                const isSelected = currentSelectedCLOs.includes(clo.code);
                                return (
                                  <Tooltip
                                    key={clo.code}
                                    title={clo.description || 'Chưa có mô tả'}
                                    placement="top"
                                  >
                                    <Tag
                                      color={isSelected ? 'blue' : 'default'}
                                      className={`cursor-pointer px-2 py-0.5 m-0 font-bold text-xs select-none transition-all ${
                                        isSelected
                                          ? 'border-brand-color'
                                          : 'border-dashed text-secondary-color hover-tag'
                                      }`}
                                      onClick={() => handleToggleCLO(name, clo.code)}
                                    >
                                      {isSelected ? `✓ ${clo.code}` : `+ ${clo.code}`}
                                    </Tag>
                                  </Tooltip>
                                );
                              })}
                            </div>
                          </div>

                          <Row gutter={12}>
                            <Col xs={24} sm={9}>
                              <Form.Item
                                {...restField}
                                name={[name, 'questionType']}
                                label={<span className="text-xs font-semibold">Hình thức đánh giá</span>}
                                className="mb-0"
                              >
                                <Select
                                  placeholder="Chọn hình thức đánh giá..."
                                  showSearch
                                  allowClear
                                  options={[
                                    { value: 'Nộp file bài tập / Đồ án', label: '📁 Nộp file bài tập / Đồ án (File Submission)' },
                                    { value: 'Làm Quiz trắc nghiệm trực tuyến', label: '📝 Làm Quiz trắc nghiệm (Online Quiz)' },
                                    { value: 'Bài kiểm tra tự luận trực tuyến', label: '✍️ Bài kiểm tra tự luận (Online Essay)' },
                                    { value: 'Vấn đáp / Thuyết trình bảo vệ', label: '🗣️ Vấn đáp / Thuyết trình (Oral Defense)' },
                                    { value: 'Thực hành Lab / Coding', label: '💻 Thực hành Lab / Coding (Hands-on)' },
                                    { value: 'Practical coding & Report', label: '💻 Practical coding & Report' },
                                    { value: 'End-to-end System Implementation & Defense', label: '🚀 System Implementation & Defense' },
                                  ]}
                                  onChange={(val) => {
                                    if (val === 'Nộp file bài tập / Đồ án' && rubrics.length > 0) {
                                      const currentGuide = form.getFieldValue(['assessments', name, 'gradingGuide']);
                                      if (!currentGuide || currentGuide.includes('tự động')) {
                                        form.setFieldValue(['assessments', name, 'gradingGuide'], `Theo Rubric: ${rubrics[0].title}`);
                                      }
                                    } else if (val === 'Làm Quiz trắc nghiệm trực tuyến') {
                                      form.setFieldValue(['assessments', name, 'gradingGuide'], 'Chấm tự động qua hệ thống khảo thí Velica');
                                    }
                                  }}
                                />
                              </Form.Item>
                            </Col>
                            <Col xs={12} sm={5}>
                              <Form.Item
                                {...restField}
                                name={[name, 'duration']}
                                label={<span className="text-xs font-semibold">Thời lượng</span>}
                                className="mb-0"
                              >
                                <Input placeholder="Vd: 30 phút / 16 slots" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} sm={10}>
                              <Form.Item
                                {...restField}
                                name={[name, 'gradingGuide']}
                                label={
                                  <div className="d-flex items-center justify-between w-100">
                                    <span className="text-xs font-semibold">Hướng dẫn chấm điểm</span>
                                    {rubrics.length > 0 && (
                                      <span className="text-2xs text-brand-color font-semibold">
                                        (Chọn từ Rubrics)
                                      </span>
                                    )}
                                  </div>
                                }
                                className="mb-0"
                              >
                                <Select
                                  placeholder="Chọn Rubric hoặc hướng dẫn chấm..."
                                  showSearch
                                  allowClear
                                  options={[
                                    {
                                      label: '📋 Thang tiêu chí Rubric tự luận',
                                      options: rubrics.map((r) => ({
                                        value: `Theo Rubric: ${r.title}`,
                                        label: `📋 ${r.title} (${r.criteria?.length || 0} tiêu chí)`,
                                      })),
                                    },
                                    {
                                      label: '⚡ Hướng dẫn hệ thống',
                                      options: [
                                        { value: 'Chấm tự động qua hệ thống khảo thí Velica', label: '⚡ Chấm tự động qua hệ thống khảo thí Velica' },
                                        { value: 'Chấm theo thang đáp án chuẩn & Rubric bộ môn', label: '📝 Chấm theo thang đáp án chuẩn & Rubric bộ môn' },
                                        { value: 'Đánh giá trực tiếp tại buổi thuyết trình / Vấn đáp', label: '🗣️ Đánh giá trực tiếp tại buổi thuyết trình / Vấn đáp' },
                                        { value: 'Continuous evaluation through GitHub commits and final report presentation', label: '💻 Continuous evaluation through GitHub commits and report' },
                                        { value: 'Team demonstration, architecture evaluation & individual Q&A defense', label: '👥 Team demonstration & individual Q&A defense' },
                                      ],
                                    },
                                  ]}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                        </div>
                      );
                    })}

                    <Button
                      type="dashed"
                      block
                      icon={<Plus size={15} />}
                      onClick={() =>
                        add({
                          category: 'Bài kiểm tra mới',
                          type: 'on-going',
                          weight: 10,
                          completionCriteria: '> 0',
                          clo: availableCLOs.length > 0 ? [availableCLOs[0].code] : ['CLO1'],
                          questionType: 'Trắc nghiệm máy chấm',
                          duration: '45 phút',
                        })
                      }
                      className="mt-2"
                    >
                      Thêm Thành phần Đánh giá mới
                    </Button>
                  </div>
                )}
              </Form.List>
            </Card>
          </Col>

          {/* Sidebar Settings (Right 8 cols) */}
          <Col xs={24} lg={8}>
            {/* Quick Actions & Status */}
            <Card
              title={<span className="font-bold text-sm">Trạng thái & Thao tác</span>}
              className="velica-card mb-4"
            >
              <div className="mb-3">
                <div className="text-xs text-secondary-color mb-1">Chế độ chỉnh sửa:</div>
                <Tag color={isEditMode ? 'processing' : 'success'} className="font-bold text-xs py-1 px-2">
                  {isEditMode ? `Cập nhật Đề cương ID: ${id}` : 'Tạo mới Đề cương học phần'}
                </Tag>
              </div>

              <div className="mb-3">
                <div className="text-xs text-secondary-color mb-1">Kiểm tra Trọng số Tổng:</div>
                <div className="d-flex items-center gap-2">
                  <div className="font-bold fs-20 text-brand-color">{totalWeight}%</div>
                  {totalWeight === 100 ? (
                    <Tag color="success">Hợp lệ (100%)</Tag>
                  ) : (
                    <Tag color="error">Cần chỉnh về 100%</Tag>
                  )}
                </div>
              </div>

              <Divider className="my-3" />

              <Space direction="vertical" className="w-100">
                <Button
                  type="primary"
                  block
                  icon={<Save size={16} />}
                  loading={saving}
                  onClick={handleSubmit}
                  className="velica-btn-primary"
                >
                  Lưu Đề cương Môn học
                </Button>

                <Button
                  block
                  onClick={() => navigate(ROUTE_PATHS.TEACHER.SYLLABUS)}
                >
                  Hủy và Quay lại
                </Button>
              </Space>
            </Card>

            {/* Quick CLO Summary List in Sidebar */}
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <span className="font-bold text-sm">Danh mục CLO hiện có</span>
                  <Tag color="blue">{availableCLOs.length}</Tag>
                </div>
              }
              className="velica-card mb-4"
            >
              {availableCLOs.length === 0 ? (
                <Text type="secondary" className="text-xs">
                  Chưa có chuẩn CLO nào được khai báo ở Mục 2.
                </Text>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {availableCLOs.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-light rounded border border-light text-xs"
                    >
                      <div className="font-bold text-brand-color">{c.code}</div>
                      <div className="text-secondary-color line-clamp-2">
                        {c.description || 'Chưa có mô tả chi tiết'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Teaching Method & Requirements */}
            <Card
              title={<span className="font-bold text-sm">Phương pháp & Đào tạo</span>}
              className="velica-card mb-4"
            >
              <Form.Item
                name="learningTeachingMethod"
                label={<span className="text-xs">Phương pháp giảng dạy</span>}
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Vd: Dạy học kiến tạo, thuyết giảng, thảo luận nhóm, thực hành phòng Lab..."
                />
              </Form.Item>

              <Form.Item
                name="minAvgMarkToPass"
                label={<span className="text-xs">Điểm trung bình tối thiểu để Đạt (Pass)</span>}
              >
                <InputNumber min={0} max={10} step={0.5} className="w-100" />
              </Form.Item>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  Radio,
  Checkbox,
  message,
  Popconfirm,
  Tag,
  Divider,
  Modal,
  Tooltip,
  Image,
  Card,
  Alert,
} from 'antd';
import {
  Plus,
  Edit,
  Trash2,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Eye,
  Binary,
  HelpCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Question, Lesson } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';
import {
  QUESTION_TYPE,
  QUESTION_DIFFICULTY,
  QuestionType,
  QuestionDifficulty,
} from '../../../constants/assessmentConstants';
import { MathRenderer } from '../../../components/velica/MathRenderer/MathRenderer';
import { MathFormulaToolbar } from '../../../components/velica/MathRenderer/MathFormulaToolbar';

const { Title, Text, Paragraph } = Typography;

export const QuestionList: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [filterDiff, setFilterDiff] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  const [form] = Form.useForm();
  const qType = Form.useWatch('type', form);
  const watchedContent = Form.useWatch('content', form);

  const loadData = async () => {
    setLoading(true);
    const [qList, lesList] = await Promise.all([
      mockService.getQuestions({ type: filterType, difficulty: filterDiff }),
      mockService.getLessons(),
    ]);
    setQuestions(qList);
    setLessons(lesList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterDiff]);

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    form.resetFields();
    form.setFieldsValue({
      type: QUESTION_TYPE.MCQ,
      difficulty: QUESTION_DIFFICULTY.MEDIUM,
      imageUrl: '',
      content: '',
      options: [
        { id: 'opt-1', text: '', isCorrect: true },
        { id: 'opt-2', text: '', isCorrect: false },
        { id: 'opt-3', text: '', isCorrect: false },
        { id: 'opt-4', text: '', isCorrect: false },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    form.setFieldsValue({
      content: q.content,
      type: q.type,
      difficulty: q.difficulty,
      imageUrl: q.imageUrl || '',
      lessonId: q.lessonId,
      explanation: q.explanation,
      options: q.options || [],
    });
    setIsModalOpen(true);
  };

  // Switch type handler to initialize sensible options
  const handleTypeChange = (newType: QuestionType) => {
    if (newType === QUESTION_TYPE.TRUE_FALSE) {
      form.setFieldsValue({
        options: [
          { id: 'opt-tf-1', text: 'Đúng (True)', isCorrect: true },
          { id: 'opt-tf-2', text: 'Sai (False)', isCorrect: false },
        ],
      });
    } else if (newType === QUESTION_TYPE.MCQ || newType === QUESTION_TYPE.MULTI_CHOICE) {
      const currentOptions = form.getFieldValue('options') || [];
      if (currentOptions.length < 2) {
        form.setFieldsValue({
          options: [
            { id: `opt-${Date.now()}-1`, text: '', isCorrect: true },
            { id: `opt-${Date.now()}-2`, text: '', isCorrect: false },
            { id: `opt-${Date.now()}-3`, text: '', isCorrect: false },
            { id: `opt-${Date.now()}-4`, text: '', isCorrect: false },
          ],
        });
      } else if (newType === QUESTION_TYPE.MCQ) {
        // Ensure at most 1 is true
        let hasTrue = false;
        const normalized = currentOptions.map((opt: { isCorrect?: boolean }) => {
          if (opt.isCorrect && !hasTrue) {
            hasTrue = true;
            return { ...opt, isCorrect: true };
          }
          return { ...opt, isCorrect: false };
        });
        if (!hasTrue && normalized.length > 0) {
          normalized[0].isCorrect = true;
        }
        form.setFieldsValue({ options: normalized });
      }
    }
  };

  // Insert LaTeX math snippet into content
  const handleInsertMathSnippet = (latex: string) => {
    const current = form.getFieldValue('content') || '';
    form.setFieldValue('content', current ? `${current} ${latex}` : latex);
    message.success(`Đã chèn công thức ${latex}`);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const selectedLesson = lessons.find((l) => l.id === values.lessonId);

      // Validate options for MCQ and MULTI_CHOICE
      if (values.type === QUESTION_TYPE.MCQ) {
        const correctCount = (values.options || []).filter((o: { isCorrect?: boolean }) => o.isCorrect).length;
        if (correctCount !== 1) {
          message.warning('Vui lòng chọn chính xác 1 phương án là đáp án đúng cho câu hỏi trắc nghiệm đơn.');
          return;
        }
      } else if (values.type === QUESTION_TYPE.MULTI_CHOICE) {
        const correctCount = (values.options || []).filter((o: { isCorrect?: boolean }) => o.isCorrect).length;
        if (correctCount < 1) {
          message.warning('Vui lòng chọn ít nhất 1 phương án là đáp án đúng cho câu hỏi nhiều lựa chọn.');
          return;
        }
      } else if (values.type === QUESTION_TYPE.TRUE_FALSE) {
        const correctCount = (values.options || []).filter((o: { isCorrect?: boolean }) => o.isCorrect).length;
        if (correctCount !== 1) {
          message.warning('Vui lòng chọn Đúng hoặc Sai là đáp án chính xác.');
          return;
        }
      }

      if (editingQuestion) {
        await mockService.updateQuestion(editingQuestion.id, {
          ...values,
          lessonTitle: selectedLesson?.title,
        });
        message.success('Cập nhật câu hỏi thành công!');
      } else {
        await mockService.createQuestion({
          ...values,
          lessonTitle: selectedLesson?.title,
        });
        message.success('Tạo câu hỏi mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      // form error
    }
  };

  const handleDelete = async (id: string) => {
    await mockService.deleteQuestion(id);
    message.success('Đã xóa câu hỏi khỏi ngân hàng.');
    loadData();
  };

  // UC-QST-06: Export Question Bank
  const handleExportQuestions = () => {
    const csvContent =
      '\uFEFF' +
      'Mã Câu Hỏi,Nội Dung Câu Hỏi,Loại,Độ Khó,Điểm,Bài Giảng\n' +
      questions
        .map(
          (q) =>
            `"${q.id}","${q.content.replace(/"/g, '""')}","${q.type}","${q.difficulty}","${q.points || 1}","${q.lessonTitle || ''}"`
        )
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Velica_Ngan_Hang_Cau_Hoi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Đã xuất thành công file danh sách câu hỏi!');
  };

  // UC-QST-02: Import Sample Questions from Word/Excel
  const handleImportSampleQuestions = async () => {
    const sampleQuestions: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        content: 'Cho ma trận chuyển trạng thái $P = \\begin{pmatrix} 0.7 & 0.3 \\\\ 0.2 & 0.8 \\end{pmatrix}$. Xác định trạng thái dừng $\\pi$ sao cho $\\pi P = \\pi$.',
        type: QUESTION_TYPE.MCQ,
        difficulty: QUESTION_DIFFICULTY.HARD,
        points: 2,
        lessonTitle: 'Toán học Ứng dụng & Mô hình Markov',
        explanation: 'Giải hệ phương trình $\\pi_1(0.7) + \\pi_2(0.2) = \\pi_1$ và $\\pi_1 + \\pi_2 = 1$, ta được $\\pi = (0.4, 0.6)$.',
        options: [
          { id: 'opt-imp-1', text: '$\\pi = (0.4, 0.6)$', isCorrect: true },
          { id: 'opt-imp-2', text: '$\\pi = (0.5, 0.5)$', isCorrect: false },
          { id: 'opt-imp-3', text: '$\\pi = (0.3, 0.7)$', isCorrect: false },
          { id: 'opt-imp-4', text: '$\\pi = (0.2, 0.8)$', isCorrect: false },
        ],
      },
      {
        content: 'Các giải pháp nào sau đây giúp kiểm soát Circuit Breaker và Retry Storm trong Microservices? (Chọn tất cả đáp án đúng)',
        type: QUESTION_TYPE.MULTI_CHOICE,
        difficulty: QUESTION_DIFFICULTY.MEDIUM,
        points: 2,
        lessonTitle: 'Bài 2: Kiến Trúc Hướng Dịch Vụ Microservices',
        explanation: 'Resilience4j và Exponential Backoff with Jitter là kỹ thuật chuẩn giúp ngăn ngừa Retry Storm.',
        options: [
          { id: 'opt-imp-5', text: 'Resilience4j Circuit Breaker State Transition', isCorrect: true },
          { id: 'opt-imp-6', text: 'Exponential Backoff kèm Random Jitter', isCorrect: true },
          { id: 'opt-imp-7', text: 'Liên tục Retry ngay lập tức mỗi 1ms không giới hạn', isCorrect: false },
        ],
      },
    ];

    for (const q of sampleQuestions) {
      await mockService.createQuestion(q);
    }
    setImportModalOpen(false);
    message.success('Đã nhập thành công 2 câu hỏi mẫu vào Ngân hàng câu hỏi!');
    loadData();
  };

  const filteredQuestions = questions.filter((q) =>
    q.content.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Nội dung câu hỏi & Sơ đồ',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (content: string, record: Question) => (
        <div className="d-flex items-center gap-2 overflow-hidden">
          {record.imageUrl && (
            <div className="flex-shrink-0">
              <Image
                src={record.imageUrl}
                width={38}
                height={28}
                className="rounded border object-cover shadow-xs"
                fallback="https://placehold.co/100x70?text=Sơ+đồ"
                preview={{ mask: <ImageIcon size={11} /> }}
              />
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <Tooltip
              title={
                <div style={{ maxWidth: 450 }}>
                  <div className="mb-1 font-bold text-xs text-white">Nội dung câu hỏi:</div>
                  <MathRenderer content={content} />
                </div>
              }
              placement="topLeft"
            >
              <span
                onClick={() => setPreviewQuestion(record)}
                className="velica-cell-title text-truncate d-block cursor-pointer hover:text-primary"
              >
                <MathRenderer content={content} />
              </span>
            </Tooltip>
            <div className="velica-cell-desc text-truncate mt-0 text-xs">
              Bài giảng: <strong>{record.lessonTitle || 'Kiến thức chung'}</strong>
              {record.imageUrl && (
                <Tag color="cyan" className="velica-tag-pill text-2xs py-0 px-1 ms-1">
                  Sơ đồ
                </Tag>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Loại câu',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => {
        if (type === QUESTION_TYPE.MCQ) {
          return <Tag color="blue" className="velica-tag-pill font-medium">Trắc nghiệm đơn</Tag>;
        }
        if (type === QUESTION_TYPE.MULTI_CHOICE) {
          return <Tag color="purple" className="velica-tag-pill font-medium">Nhiều lựa chọn</Tag>;
        }
        if (type === QUESTION_TYPE.TRUE_FALSE) {
          return <Tag color="cyan" className="velica-tag-pill font-medium">Đúng / Sai</Tag>;
        }
        return <Tag color="orange" className="velica-tag-pill font-medium">Tự luận</Tag>;
      },
    },
    {
      title: 'Thang đo Bloom',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 170,
      render: (diff: string) => {
        const labels: Record<string, { label: string; color: string; desc: string }> = {
          EASY: { label: 'Nhận biết (Easy)', color: 'green', desc: 'Ghi nhớ định nghĩa & lý thuyết cơ bản' },
          MEDIUM: { label: 'Thông hiểu (Medium)', color: 'blue', desc: 'Giải thích & Phân tích hiện tượng' },
          HARD: { label: 'Vận dụng (Hard)', color: 'orange', desc: 'Áp dụng thiết kế & Cài đặt hệ thống' },
          VERY_HARD: { label: 'Vận dụng cao (Very Hard)', color: 'red', desc: 'Đánh giá trade-offs & Tối ưu hóa' },
        };
        const item = labels[diff] || { label: diff, color: 'default', desc: '' };
        return (
          <Tooltip title={item.desc} placement="topLeft">
            <Tag color={item.color} className="velica-tag-pill cursor-pointer">
              {item.label}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Định mức điểm',
      key: 'pointsNotice',
      width: 130,
      render: () => (
        <Tooltip title="Điểm số được gán linh hoạt trong quá trình soạn và xuất bản đề thi">
          <span className="text-xs text-muted-color cursor-pointer bg-light px-2 py-1 rounded">
            Gán lúc tạo đề
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      render: (_: unknown, record: Question) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết câu hỏi & đáp án">
            <Button
              type="text"
              icon={<Eye size={16} className="text-brand-color" />}
              onClick={() => setPreviewQuestion(record)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa câu hỏi">
            <Button
              type="text"
              icon={<Edit size={16} color="#475569" />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa câu hỏi này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<Trash2 size={16} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Modern Untitled UI Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h1 className="velica-page-title">
            Ngân hàng Câu hỏi & Bộ đề Khảo thí
          </h1>
          <p className="velica-page-desc">
            Kho dữ liệu câu hỏi trắc nghiệm đơn, nhiều lựa chọn, Đúng/Sai, tự luận và công thức Toán học (LaTeX/KaTeX).
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            icon={<UploadCloud size={15} />}
            onClick={() => setImportModalOpen(true)}
            className="velica-btn-action"
          >
            Nhập Excel/Word
          </Button>
          <Button
            icon={<Sliders size={15} />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.QUESTION_LEVELS)}
            className="velica-btn-action"
          >
            Cấu hình mức độ
          </Button>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
            className="velica-btn-primary"
          >
            Thêm câu hỏi mới
          </Button>
        </div>
      </div>

      <FilterBar
        placeholder="Tìm kiếm nội dung câu hỏi hoặc công thức..."
        onSearchChange={setSearch}
        onClearFilters={() => {
          setFilterType(undefined);
          setFilterDiff(undefined);
        }}
        hasActiveFilters={Boolean(filterType || filterDiff)}
      >
        <Select
          allowClear
          placeholder="Loại câu hỏi"
          style={{ minWidth: 170 }}
          value={filterType}
          onChange={setFilterType}
          popupMatchSelectWidth={false}
        >
          <Select.Option value={QUESTION_TYPE.MCQ}>Trắc nghiệm đơn (Single)</Select.Option>
          <Select.Option value={QUESTION_TYPE.MULTI_CHOICE}>Nhiều lựa chọn (Multi)</Select.Option>
          <Select.Option value={QUESTION_TYPE.TRUE_FALSE}>Đúng / Sai (True-False)</Select.Option>
          <Select.Option value={QUESTION_TYPE.ESSAY}>Tự luận (Essay)</Select.Option>
        </Select>

        <Select
          allowClear
          placeholder="Mức độ Bloom"
          style={{ minWidth: 180 }}
          value={filterDiff}
          onChange={setFilterDiff}
          popupMatchSelectWidth={false}
        >
          <Select.Option value={QUESTION_DIFFICULTY.EASY}>Nhận biết (Easy)</Select.Option>
          <Select.Option value={QUESTION_DIFFICULTY.MEDIUM}>Thông hiểu (Medium)</Select.Option>
          <Select.Option value={QUESTION_DIFFICULTY.HARD}>Vận dụng (Hard)</Select.Option>
          <Select.Option value={QUESTION_DIFFICULTY.VERY_HARD}>Vận dụng cao (Very Hard)</Select.Option>
        </Select>
      </FilterBar>

      <div className="velica-card-table">
        <Table
          dataSource={filteredQuestions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          tableLayout="fixed"
        />
      </div>

      {/* Create / Edit Question Slide-over Drawer */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              {editingQuestion ? 'Chỉnh sửa câu hỏi khảo thí' : 'Tạo câu hỏi mới'}
            </div>
            <div className="velica-drawer-subtitle">
              Hỗ trợ Trắc nghiệm đơn, Nhiều đáp án đúng, Đúng/Sai và Công thức Toán học (LaTeX KaTeX).
            </div>
          </div>
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width={780}
        extra={
          <Space>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              {editingQuestion ? 'Lưu thay đổi' : 'Thêm câu hỏi'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="velica-drawer-form">
          <div className="velica-form-row">
            <Form.Item
              name="type"
              label="Loại câu hỏi"
              rules={[{ required: true }]}
              className="velica-form-col-flex"
            >
              <Select popupMatchSelectWidth={false} onChange={handleTypeChange}>
                <Select.Option value={QUESTION_TYPE.MCQ}>
                  Trắc nghiệm đơn (Single Choice - 1 đáp án đúng)
                </Select.Option>
                <Select.Option value={QUESTION_TYPE.MULTI_CHOICE}>
                  Trắc nghiệm nhiều lựa chọn (Multiple Choice - Nhiều đáp án đúng)
                </Select.Option>
                <Select.Option value={QUESTION_TYPE.TRUE_FALSE}>
                  Đúng / Sai (True / False)
                </Select.Option>
                <Select.Option value={QUESTION_TYPE.ESSAY}>
                  Tự luận học thuật (Essay)
                </Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="difficulty"
              label="Mức độ nhận thức (Thang đo Bloom)"
              rules={[{ required: true }]}
              className="velica-form-col-flex"
            >
              <Select popupMatchSelectWidth={false}>
                <Select.Option value={QUESTION_DIFFICULTY.EASY}>
                  <Tooltip title="Ghi nhớ định nghĩa, nguyên lý cơ bản (Remember / Recall)">
                    Nhận biết (Easy) — Ghi nhớ lý thuyết
                  </Tooltip>
                </Select.Option>
                <Select.Option value={QUESTION_DIFFICULTY.MEDIUM}>
                  <Tooltip title="Giải thích hiện tượng, so sánh và liên hệ (Understand / Comprehend)">
                    Thông hiểu (Medium) — Phân tích & So sánh
                  </Tooltip>
                </Select.Option>
                <Select.Option value={QUESTION_DIFFICULTY.HARD}>
                  <Tooltip title="Áp dụng thiết kế hệ thống, cài đặt giải thuật (Apply)">
                    Vận dụng (Hard) — Cài đặt & Thiết kế
                  </Tooltip>
                </Select.Option>
                <Select.Option value={QUESTION_DIFFICULTY.VERY_HARD}>
                  <Tooltip title="Đánh giá trade-offs, xử lý lỗi phân tán và tối ưu hóa hệ thống (Analyze / Evaluate)">
                    Vận dụng cao (Very Hard) — Trade-offs & Tối ưu
                  </Tooltip>
                </Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item name="lessonId" label="Gán vào Bài giảng (tùy chọn)">
            <Select allowClear popupMatchSelectWidth={false} placeholder="Chọn bài giảng liên quan trong đề cương">
              {lessons.map((l) => (
                <Select.Option key={l.id} value={l.id}>
                  {l.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Math Formula Toolbar */}
          <MathFormulaToolbar onInsert={handleInsertMathSnippet} />

          <Form.Item
            name="content"
            label="Nội dung đề bài câu hỏi (hỗ trợ nhập công thức $công_thức$)"
            rules={[{ required: true, message: 'Vui lòng nhập nội dung câu hỏi' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập nội dung đề bài tại đây... (Ví dụ: Cho hàm số $f(x) = \frac{x^2+1}{2x}$, tính đạo hàm tại $x=1$)"
            />
          </Form.Item>

          {/* Real-time Math & Content Preview */}
          {watchedContent && (
            <div className="p-3 bg-light border rounded-2 mb-3">
              <div className="d-flex items-center gap-1.5 mb-1.5">
                <Binary size={14} className="text-brand-color" />
                <span className="font-bold text-xs text-primary-color">
                  Xem trước Nội dung & Công thức Toán học (Live Preview):
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-2 border text-sm text-primary-color">
                <MathRenderer content={watchedContent} />
              </div>
            </div>
          )}

          {/* Image Attachment */}
          <Form.Item
            name="imageUrl"
            label={
              <div className="d-flex items-center gap-2">
                <ImageIcon size={15} className="text-brand-color" />
                <span>Hình ảnh / Sơ đồ kiến trúc đính kèm (Tùy chọn)</span>
              </div>
            }
            tooltip="Đính kèm sơ đồ kiến trúc phần mềm, ERD, Sequence diagram hoặc đồ thị thuật toán"
          >
            <Input
              placeholder="Nhập đường dẫn hình ảnh (URL) hoặc chọn sơ đồ mẫu..."
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  onClick={() =>
                    form.setFieldValue(
                      'imageUrl',
                      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80'
                    )
                  }
                >
                  Gán ảnh mẫu
                </Button>
              }
            />
          </Form.Item>

          {/* Options for TRUE_FALSE */}
          {qType === QUESTION_TYPE.TRUE_FALSE && (
            <div className="mt-4 p-3 bg-light rounded-2 border">
              <div className="d-flex items-center gap-2 mb-2">
                <CheckCircle2 size={16} className="text-brand-color" />
                <Text strong className="text-xs text-primary-color">
                  Đáp án Đúng / Sai (Chọn nút tròn cho phương án đúng của câu hỏi):
                </Text>
              </div>

              <Form.List name="options">
                {(fields) => (
                  <div className="d-flex flex-col gap-2">
                    {fields.map(({ key, name, ...restField }, idx) => {
                      const isChecked = form.getFieldValue(['options', name, 'isCorrect']) === true;
                      return (
                        <div
                          key={key}
                          className={`p-2.5 rounded-2 border d-flex items-center gap-3 ${
                            isChecked ? 'bg-emerald-50 border-emerald-300' : 'bg-white'
                          }`}
                        >
                          <Form.Item
                            {...restField}
                            name={[name, 'isCorrect']}
                            valuePropName="checked"
                            noStyle
                          >
                            <input
                              type="radio"
                              name="tf_correct_radio"
                              checked={isChecked}
                              onChange={() => {
                                const opts = form.getFieldValue('options') || [];
                                const updated = opts.map((opt: unknown, i: number) => ({
                                  ...(opt as object),
                                  isCorrect: i === name,
                                }));
                                form.setFieldsValue({ options: updated });
                              }}
                              className="velica-mcq-radio"
                            />
                          </Form.Item>

                          <span className="font-bold text-xs">
                            {idx === 0 ? 'Phương án A:' : 'Phương án B:'}
                          </span>

                          <Form.Item
                            {...restField}
                            name={[name, 'text']}
                            rules={[{ required: true, message: 'Nhập nội dung phương án' }]}
                            noStyle
                            className="flex-1"
                          >
                            <Input placeholder={idx === 0 ? 'Đúng (True)' : 'Sai (False)'} className="w-100" />
                          </Form.Item>

                          {isChecked && (
                            <Tag color="success" className="m-0 font-semibold text-xs">
                              Đáp án chuẩn
                            </Tag>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Form.List>
            </div>
          )}

          {/* Dynamic Options for MCQ (Single Choice) */}
          {qType === QUESTION_TYPE.MCQ && (
            <div className="mt-4">
              <div className="d-flex justify-between items-center mb-2">
                <Text strong className="font-semibold text-primary-color text-xs">
                  Các phương án lựa chọn (Chọn nút tròn cho 1 phương án đúng nhất):
                </Text>
              </div>

              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <div className="d-flex flex-col gap-2">
                    {fields.map(({ key, name, ...restField }, idx) => (
                      <div key={key} className="velica-mcq-option-row d-flex items-center gap-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'isCorrect']}
                          valuePropName="checked"
                          noStyle
                        >
                          <input
                            type="radio"
                            name="correct_option_radio"
                            checked={form.getFieldValue(['options', name, 'isCorrect']) === true}
                            onChange={() => {
                              const opts = form.getFieldValue('options') || [];
                              const updated = opts.map((opt: unknown, i: number) => ({
                                ...(opt as object),
                                isCorrect: i === name,
                              }));
                              form.setFieldsValue({ options: updated });
                            }}
                            className="velica-mcq-radio"
                          />
                        </Form.Item>

                        <span className="velica-mcq-badge">
                          {String.fromCharCode(65 + idx)}
                        </span>

                        <Form.Item
                          {...restField}
                          name={[name, 'text']}
                          rules={[{ required: true, message: 'Nhập nội dung phương án' }]}
                          noStyle
                          className="flex-1"
                        >
                          <Input
                            placeholder={`Nội dung phương án ${String.fromCharCode(65 + idx)}... (hỗ trợ $công_thức$)`}
                            className="w-100"
                          />
                        </Form.Item>

                        {fields.length > 2 && (
                          <Button
                            type="text"
                            danger
                            icon={<Trash2 size={15} />}
                            onClick={() => remove(name)}
                          />
                        )}
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      icon={<Plus size={14} />}
                      onClick={() =>
                        add({
                          id: `opt-${Date.now()}`,
                          text: '',
                          isCorrect: false,
                        })
                      }
                      className="mt-1"
                    >
                      + Thêm phương án lựa chọn ({String.fromCharCode(65 + fields.length)})
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          )}

          {/* Dynamic Options for MULTI_CHOICE (Multiple Choice) */}
          {qType === QUESTION_TYPE.MULTI_CHOICE && (
            <div className="mt-4">
              <Alert
                type="info"
                showIcon
                className="mb-2.5 py-1.5 px-3 text-xs"
                message="Câu hỏi nhiều lựa chọn: Tích chọn các ô vuông tương ứng với tất cả phương án đúng."
              />

              <div className="d-flex justify-between items-center mb-2">
                <Text strong className="font-semibold text-primary-color text-xs">
                  Các phương án lựa chọn (Tích chọn một hoặc nhiều đáp án đúng):
                </Text>
              </div>

              <Form.List name="options">
                {(fields, { add, remove }) => (
                  <div className="d-flex flex-col gap-2">
                    {fields.map(({ key, name, ...restField }, idx) => (
                      <div key={key} className="velica-mcq-option-row d-flex items-center gap-2">
                        <Form.Item
                          {...restField}
                          name={[name, 'isCorrect']}
                          valuePropName="checked"
                          noStyle
                        >
                          <Checkbox
                            checked={form.getFieldValue(['options', name, 'isCorrect']) === true}
                            onChange={(e) => {
                              const opts = [...(form.getFieldValue('options') || [])];
                              if (opts[name]) {
                                opts[name] = { ...opts[name], isCorrect: e.target.checked };
                                form.setFieldsValue({ options: opts });
                              }
                            }}
                          />
                        </Form.Item>

                        <span className="velica-mcq-badge">
                          {String.fromCharCode(65 + idx)}
                        </span>

                        <Form.Item
                          {...restField}
                          name={[name, 'text']}
                          rules={[{ required: true, message: 'Nhập nội dung phương án' }]}
                          noStyle
                          className="flex-1"
                        >
                          <Input
                            placeholder={`Nội dung phương án ${String.fromCharCode(65 + idx)}... (hỗ trợ $công_thức$)`}
                            className="w-100"
                          />
                        </Form.Item>

                        {fields.length > 2 && (
                          <Button
                            type="text"
                            danger
                            icon={<Trash2 size={15} />}
                            onClick={() => remove(name)}
                          />
                        )}
                      </div>
                    ))}

                    <Button
                      type="dashed"
                      icon={<Plus size={14} />}
                      onClick={() =>
                        add({
                          id: `opt-${Date.now()}`,
                          text: '',
                          isCorrect: false,
                        })
                      }
                      className="mt-1"
                    >
                      + Thêm phương án lựa chọn ({String.fromCharCode(65 + fields.length)})
                    </Button>
                  </div>
                )}
              </Form.List>
            </div>
          )}

          {/* Essay instructions note */}
          {qType === QUESTION_TYPE.ESSAY && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2">
              <div className="font-bold text-xs text-amber-900 mb-1">
                📝 Chế độ Câu hỏi Tự Luận Học Thuật (Essay)
              </div>
              <div className="text-xs text-amber-800">
                Sinh viên sẽ làm bài bằng cách nhập văn bản tự do hoặc nộp file đồ án. Giảng viên có thể thiết lập Thang điểm Rubric tại mục Quản lý Rubric để chấm điểm tiêu chí.
              </div>
            </div>
          )}

          <Form.Item
            name="explanation"
            label="Giải thích / Lời giải mẫu chi tiết (hỗ trợ công thức $công_thức$)"
            className="mt-4"
          >
            <Input.TextArea rows={3} placeholder="Giải thích vì sao đáp án này đúng, các bước giải toán học hoặc chứng minh..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Modal Import Questions from Excel/Word (#UC-QST-02) */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-brand-color" />
            <span>Nhập Hàng Loạt Câu Hỏi Từ File (Excel / Word)</span>
          </div>
        }
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setImportModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleImportSampleQuestions}
            className="velica-btn-primary"
            icon={<UploadCloud size={15} />}
          >
            Nhập file & Xác nhận (2 câu mẫu)
          </Button>,
        ]}
      >
        <div className="py-2">
          <Paragraph type="secondary" className="mb-3">
            Hỗ trợ định dạng file Excel <code>.xlsx</code>, <code>.csv</code> hoặc văn bản <code>.docx</code> chuẩn hóa. Hệ thống tự động phân tích cú pháp câu hỏi trắc nghiệm đơn, nhiều lựa chọn, Đúng/Sai và công thức LaTeX.
          </Paragraph>

          <div className="p-4 border border-dashed rounded-3 text-center bg-light mb-3">
            <UploadCloud size={36} className="text-brand-color mx-auto mb-2" />
            <Text strong className="d-block text-primary-color mb-1">
              Kéo thả file câu hỏi hoặc click để chọn file
            </Text>
            <Text type="secondary" className="text-xs">
              Hỗ trợ dung lượng tối đa 15MB (.xlsx, .csv, .docx)
            </Text>
          </div>

          <div className="d-flex items-center justify-between p-3 bg-white border rounded-2">
            <div className="d-flex items-center gap-2">
              <FileText size={16} className="text-success-color" />
              <span className="text-xs font-medium">Bieu_mau_cau_hoi_chuan_Velica.xlsx</span>
            </div>
            <Button
              type="link"
              size="small"
              icon={<Download size={14} />}
              onClick={handleExportQuestions}
            >
              Tải file mẫu
            </Button>
          </div>
        </div>
      </Modal>

      {/* Full Question Preview Drawer */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              Chi tiết Câu hỏi Khảo thí
            </div>
            <div className="velica-drawer-subtitle">
              Mã câu: {previewQuestion?.id} • Bài giảng: {previewQuestion?.lessonTitle || 'Kiến thức chung'}
            </div>
          </div>
        }
        open={Boolean(previewQuestion)}
        onClose={() => setPreviewQuestion(null)}
        width={600}
        extra={
          <Space>
            {previewQuestion && (
              <Button
                type="primary"
                icon={<Edit size={14} />}
                onClick={() => {
                  const q = previewQuestion;
                  setPreviewQuestion(null);
                  handleOpenEdit(q);
                }}
                className="velica-btn-primary"
              >
                Chỉnh sửa
              </Button>
            )}
            <Button onClick={() => setPreviewQuestion(null)}>Đóng</Button>
          </Space>
        }
      >
        {previewQuestion && (
          <div>
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
                className="font-semibold"
              >
                {previewQuestion.type === QUESTION_TYPE.MCQ
                  ? 'Trắc nghiệm đơn (Single Choice)'
                  : previewQuestion.type === QUESTION_TYPE.MULTI_CHOICE
                  ? 'Nhiều lựa chọn (Multiple Choice)'
                  : previewQuestion.type === QUESTION_TYPE.TRUE_FALSE
                  ? 'Đúng / Sai (True / False)'
                  : 'Tự luận học thuật (Essay)'}
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
              >
                {previewQuestion.difficulty === 'EASY'
                  ? 'Nhận biết (Easy)'
                  : previewQuestion.difficulty === 'MEDIUM'
                  ? 'Thông hiểu (Medium)'
                  : previewQuestion.difficulty === 'HARD'
                  ? 'Vận dụng (Hard)'
                  : 'Vận dụng cao (Very Hard)'}
              </Tag>
              <Tag className="velica-badge-gray">
                Định mức đề xuất: {previewQuestion.points || 1} điểm
              </Tag>
            </div>

            {/* Question Content with MathRenderer */}
            <div className="p-3 bg-muted rounded-2 border mb-3">
              <div className="text-xs text-muted-color font-semibold mb-1">Nội dung câu hỏi:</div>
              <div className="text-sm font-semibold text-primary-color lh-base">
                <MathRenderer content={previewQuestion.content} />
              </div>
            </div>

            {/* Image attachment if exists */}
            {previewQuestion.imageUrl && (
              <div className="mb-3 p-2 bg-light border rounded-2 text-center">
                <Image
                  src={previewQuestion.imageUrl}
                  className="rounded max-h-240 object-contain shadow-xs"
                  fallback="https://placehold.co/400x200?text=Sơ+đồ+tham+chiếu"
                />
                <div className="text-xs text-muted-color mt-1">Đồ hình / Sơ đồ đính kèm câu hỏi</div>
              </div>
            )}

            {/* Options list with MathRenderer */}
            {previewQuestion.options && previewQuestion.options.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-primary-color mb-2">
                  Danh sách phương án lựa chọn:
                </div>
                <div className="d-flex flex-col gap-2">
                  {previewQuestion.options.map((opt, i) => (
                    <div
                      key={opt.id}
                      className={`p-2.5 border rounded-2 d-flex items-start gap-2 ${
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
                        <Tag color="success" className="m-0 font-semibold text-xs">
                          ✓ Đáp án đúng
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Explanation / Suggested Answer with MathRenderer */}
            {previewQuestion.explanation && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-2 mb-3">
                <div className="text-xs text-sky-800 font-bold mb-1">
                  💡 Lời giải thích / Đáp án mẫu chi tiết:
                </div>
                <div className="text-xs text-sky-900 lh-base whitespace-pre-wrap">
                  <MathRenderer content={previewQuestion.explanation} />
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

    </div>
  );
};

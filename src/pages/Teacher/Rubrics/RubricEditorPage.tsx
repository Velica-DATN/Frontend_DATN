import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Form,
  Input,
  InputNumber,
  Tag,
  message,
  Tabs,
  Popconfirm,
  Tooltip,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Sparkles,
  Award,
  Eye,
  Sliders,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Rubric, RubricCriteria, RubricLevel } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const RubricEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id && id !== 'create');

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [rubricData, setRubricData] = useState<Rubric | null>(null);

  // Watch form values for live matrix preview
  const watchedValues = Form.useWatch([], form);

  useEffect(() => {
    if (isEditMode && id) {
      loadRubric(id);
    } else {
      // Default initial values for new rubric
      form.setFieldsValue({
        title: '',
        description: '',
        criteria: [
          {
            id: `crit-${Date.now()}-1`,
            title: 'Phân tích & Hiểu yêu cầu bài toán (Problem Analysis)',
            maxPoints: 4,
            levels: [
              {
                id: 'lvl-1',
                label: 'Xuất sắc (100%)',
                score: 4,
                description: 'Phân tích toàn diện, chính xác và chuyên sâu mọi yêu cầu; giải pháp tối ưu và sáng tạo.',
              },
              {
                id: 'lvl-2',
                label: 'Khá (75%)',
                score: 3,
                description: 'Phân tích đúng các yêu cầu chính, lập luận logic, chỉ có thiếu sót nhỏ không đáng kể.',
              },
              {
                id: 'lvl-3',
                label: 'Trung bình (50%)',
                score: 2,
                description: 'Hiểu vấn đề cơ bản nhưng giải pháp còn sơ sài hoặc còn nhầm lẫn.',
              },
              {
                id: 'lvl-4',
                label: 'Cần cố gắng (25%)',
                score: 1,
                description: 'Chưa đạt yêu cầu tối thiểu hoặc phân tích sai lệch hướng tiếp cận.',
              },
            ],
          },
          {
            id: `crit-${Date.now()}-2`,
            title: 'Chất lượng giải pháp & Kỹ thuật triển khai (Technical Quality)',
            maxPoints: 4,
            levels: [
              {
                id: 'lvl-2-1',
                label: 'Xuất sắc (100%)',
                score: 4,
                description: 'Kiến trúc chuẩn chỉ, mã nguồn sạch sẽ, tuân thủ đúng Design Patterns và nguyên lý kỹ thuật.',
              },
              {
                id: 'lvl-2-2',
                label: 'Khá (75%)',
                score: 3,
                description: 'Triển khai tốt, đúng quy chuẩn chung, xử lý ngoại lệ ổn định.',
              },
              {
                id: 'lvl-2-3',
                label: 'Trung bình (50%)',
                score: 2,
                description: 'Chạy được tính năng chính nhưng cấu trúc chưa tối ưu hoặc còn mã dư thừa.',
              },
              {
                id: 'lvl-2-4',
                label: 'Cần cố gắng (25%)',
                score: 1,
                description: 'Mã nguồn lộn xộn, không tuân thủ quy ước hoặc xảy ra nhiều lỗi logic.',
              },
            ],
          },
        ],
      });
    }
  }, [id, isEditMode, form]);

  const loadRubric = async (rubricId: string) => {
    setLoading(true);
    const data = await mockService.getRubricById(rubricId);
    if (data) {
      setRubricData(data);
      const normalizedCriteria = (data.criteria || []).map((crit) => ({
        ...crit,
        levels: crit.levels && crit.levels.length > 0 ? crit.levels : [
          { id: 'l1', label: 'Xuất sắc (100%)', score: crit.maxPoints, description: 'Đáp ứng toàn diện yêu cầu.' },
          { id: 'l2', label: 'Khá (75%)', score: Number((crit.maxPoints * 0.75).toFixed(1)), description: 'Đáp ứng tốt các yêu cầu chính.' },
          { id: 'l3', label: 'Trung bình (50%)', score: Number((crit.maxPoints * 0.5).toFixed(1)), description: 'Đáp ứng mức cơ bản.' },
          { id: 'l4', label: 'Cần cố gắng (25%)', score: Number((crit.maxPoints * 0.25).toFixed(1)), description: 'Chưa đạt yêu cầu.' },
        ],
      }));

      form.setFieldsValue({
        ...data,
        criteria: normalizedCriteria,
      });
    } else {
      message.error('Không tìm thấy Rubric!');
      navigate(ROUTE_PATHS.TEACHER.RUBRICS);
    }
    setLoading(false);
  };

  // Quick-fill 4 standard performance tiers for a criterion
  const handleQuickFillStandardLevels = (cIdx: number) => {
    const currentCrit = form.getFieldValue(['criteria', cIdx]);
    const max = Number(currentCrit?.maxPoints) || 4;

    const standardLevels: RubricLevel[] = [
      {
        id: `lvl-${Date.now()}-1`,
        label: 'Xuất sắc (100%)',
        score: max,
        description: 'Đáp ứng toàn diện, chính xác và chuyên sâu tất cả các yêu cầu; giải pháp tối ưu và sạch sẽ.',
      },
      {
        id: `lvl-${Date.now()}-2`,
        label: 'Khá (75%)',
        score: Number((max * 0.75).toFixed(1)),
        description: 'Đáp ứng tốt các yêu cầu trọng tâm, lập luận rõ ràng, còn thiếu sót nhỏ không đáng kể.',
      },
      {
        id: `lvl-${Date.now()}-3`,
        label: 'Trung bình (50%)',
        score: Number((max * 0.5).toFixed(1)),
        description: 'Đạt yêu cầu cơ bản nhưng giải pháp còn sơ sài hoặc có nhầm lẫn.',
      },
      {
        id: `lvl-${Date.now()}-4`,
        label: 'Cần cố gắng (25%)',
        score: Number((max * 0.25).toFixed(1)),
        description: 'Chưa đạt yêu cầu tối thiểu hoặc giải pháp sai lệch nhiều so với mục tiêu đề bài.',
      },
    ];

    form.setFieldValue(['criteria', cIdx, 'levels'], standardLevels);
    message.success(`Đã tự động tính và điền 4 mức điểm chuẩn cho Tiêu chí #${cIdx + 1}!`);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      if (isEditMode && id) {
        await mockService.updateRubric(id, values);
        message.success('Cập nhật Rubric thành công!');
        navigate(`/teacher/rubrics/${id}`);
      } else {
        const created = await mockService.createRubric(values);
        message.success('Tạo Rubric mới thành công!');
        navigate(`/teacher/rubrics/${created.id}`);
      }
    } catch {
      message.error('Vui lòng kiểm tra lại các trường thông tin bắt buộc.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate live total points from criteria
  const currentCriteria = watchedValues?.criteria || [];
  const totalMaxPoints = currentCriteria.reduce(
    (acc: number, c: { maxPoints?: number }) => acc + (Number(c?.maxPoints) || 0),
    0
  );

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Navigation & Actions Bar */}
      <div className="d-flex items-center justify-between flex-wrap gap-3 mb-4">
        <Space size="middle">
          <Button
            icon={<ArrowLeft size={16} />}
            onClick={() => navigate(isEditMode && id ? `/teacher/rubrics/${id}` : ROUTE_PATHS.TEACHER.RUBRICS)}
          >
            Quay lại
          </Button>
          <div>
            <div className="d-flex items-center gap-2">
              <Award size={20} className="text-brand-color" />
              <Title level={4} className="m-0">
                {isEditMode ? 'Chỉnh sửa Rubric Chấm Tự Luận' : 'Tạo Rubric Chấm Tự Luận Mới'}
              </Title>
            </div>
            <Text className="text-muted-color text-xs">
              Thiết kế ma trận tiêu chí đánh giá chuẩn hóa cho bài tập lớn, đồ án và câu hỏi tự luận.
            </Text>
          </div>
        </Space>

        <Space size="middle">
          <Tag color="geekblue" className="text-sm font-semibold py-1 px-3 m-0">
            Tổng điểm tối đa: {totalMaxPoints} điểm
          </Tag>
          <Button
            type="primary"
            icon={<Save size={16} />}
            loading={saving}
            onClick={handleSave}
            className="velica-btn-primary"
          >
            {isEditMode ? 'Lưu thay đổi' : 'Tạo & Lưu Rubric'}
          </Button>
        </Space>
      </div>

      {/* Tabs: Editor vs Live Matrix Preview */}
      <Tabs
        activeKey={activeTab}
        onChange={(k) => setActiveTab(k as 'editor' | 'preview')}
        type="card"
        className="velica-tabs-card"
        items={[
          {
            key: 'editor',
            label: (
              <span className="d-flex items-center gap-1.5">
                <Sliders size={15} />
                <span>Thiết lập Tiêu chí (Editor)</span>
              </span>
            ),
            children: (
              <Form form={form} layout="vertical" disabled={loading}>
                {/* General Information Card */}
                <Card className="velica-card-spec mb-4" title="1. Thông tin chung về Rubric">
                  <Row gutter={16}>
                    <Col xs={24} md={16}>
                      <Form.Item
                        name="title"
                        label="Tên thang tiêu chí Rubric"
                        rules={[{ required: true, message: 'Vui lòng nhập tên Rubric' }]}
                      >
                        <Input
                          placeholder="Ví dụ: Rubric Chấm Đồ Án Cuối Kỳ - Kiến Trúc Microservices"
                          size="large"
                          className="font-semibold"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <div className="bg-light p-3 rounded-2 border h-100 d-flex flex-col justify-center">
                        <div className="text-xs text-muted-color mb-1">Số lượng tiêu chí hiện có</div>
                        <div className="d-flex items-baseline gap-2">
                          <span className="fs-4 font-bold text-primary-color">{currentCriteria.length}</span>
                          <span className="text-xs text-muted-color">tiêu chí đánh giá</span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  <Form.Item
                    name="description"
                    label="Mục đích & Hướng dẫn sử dụng Rubric"
                    rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
                    className="mb-0"
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Mô tả phạm vi áp dụng, quy tắc chấm điểm và hướng dẫn cho giảng viên chấm..."
                    />
                  </Form.Item>
                </Card>

                {/* Criteria & Performance Levels List */}
                <div className="mb-3 d-flex items-center justify-between">
                  <div>
                    <Title level={5} className="m-0 text-primary-color">
                      2. Danh sách Tiêu chí Đánh giá & Các Mức độ Thành thạo (Performance Levels)
                    </Title>
                    <Text className="text-muted-color text-xs">
                      Mỗi tiêu chí có thể thiết lập nhiều mức điểm từ Xuất sắc đến Cần cố gắng kèm mô tả hành vi chi tiết.
                    </Text>
                  </div>
                </div>

                <Form.List name="criteria">
                  {(criteriaFields, { add: addCriterion, remove: removeCriterion }) => (
                    <div className="d-flex flex-col gap-4">
                      {criteriaFields.map(({ key: cKey, name: cName, ...restCField }, cIdx) => (
                        <Card
                          key={cKey}
                          className="velica-card-spec shadow-sm"
                          title={
                            <div className="d-flex items-center justify-between flex-wrap gap-2 py-1">
                              <Space size="middle">
                                <span className="badge bg-primary text-white text-xs">
                                  Tiêu chí #{cIdx + 1}
                                </span>
                                <span className="font-bold text-sm text-primary-color">
                                  {form.getFieldValue(['criteria', cName, 'title']) || `Tiêu chí số ${cIdx + 1}`}
                                </span>
                              </Space>

                              <Space size="small">
                                <Tooltip title="Tự động tính và điền 4 mức điểm 100%, 75%, 50%, 25% dựa trên điểm tối đa">
                                  <Button
                                    size="small"
                                    icon={<Sparkles size={14} className="text-brand-color" />}
                                    onClick={() => handleQuickFillStandardLevels(cName)}
                                  >
                                    Điền nhanh 4 mức chuẩn
                                  </Button>
                                </Tooltip>
                                {criteriaFields.length > 1 && (
                                  <Popconfirm
                                    title="Xóa tiêu chí này?"
                                    onConfirm={() => removeCriterion(cName)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                    okButtonProps={{ danger: true }}
                                  >
                                    <Button size="small" type="text" danger icon={<Trash2 size={14} />}>
                                      Xóa tiêu chí
                                    </Button>
                                  </Popconfirm>
                                )}
                              </Space>
                            </div>
                          }
                        >
                          <Row gutter={16}>
                            <Col xs={24} md={18}>
                              <Form.Item
                                {...restCField}
                                name={[cName, 'title']}
                                label="Tên tiêu chí đánh giá"
                                rules={[{ required: true, message: 'Nhập tên tiêu chí' }]}
                              >
                                <Input placeholder="Ví dụ: Thiết kế cơ sở dữ liệu & Tối ưu hóa truy vấn" />
                              </Form.Item>
                            </Col>
                            <Col xs={24} md={6}>
                              <Form.Item
                                {...restCField}
                                name={[cName, 'maxPoints']}
                                label="Điểm tối đa của tiêu chí"
                                rules={[{ required: true, message: 'Nhập điểm tối đa' }]}
                              >
                                <InputNumber min={0.5} max={100} step={0.5} className="w-100" />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Divider className="my-2" />

                          {/* Nested Levels List for this Criterion */}
                          <div className="mb-2 d-flex items-center justify-between">
                            <Text strong className="text-xs text-primary-color">
                              Các mức điểm đạt được (Levels):
                            </Text>
                          </div>

                          <Form.List name={[cName, 'levels']}>
                            {(levelFields, { add: addLevel, remove: removeLevel }) => (
                              <div className="d-flex flex-col gap-2">
                                {levelFields.map(({ key: lKey, name: lName, ...restLField }, lIdx) => (
                                  <div
                                    key={lKey}
                                    className="p-3 bg-light rounded-2 border d-flex flex-col gap-2"
                                  >
                                    <Row gutter={12} align="middle">
                                      <Col xs={24} sm={10}>
                                        <Form.Item
                                          {...restLField}
                                          name={[lName, 'label']}
                                          label={`Mức #${lIdx + 1} - Nhãn`}
                                          rules={[{ required: true, message: 'Nhập nhãn mức điểm' }]}
                                          className="mb-0"
                                        >
                                          <Input placeholder="Ví dụ: Xuất sắc (100%), Đạt (75%),..." />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} sm={6}>
                                        <Form.Item
                                          {...restLField}
                                          name={[lName, 'score']}
                                          label="Điểm đạt"
                                          rules={[{ required: true, message: 'Nhập điểm' }]}
                                          className="mb-0"
                                        >
                                          <InputNumber min={0} max={100} step={0.25} className="w-100" />
                                        </Form.Item>
                                      </Col>
                                      <Col xs={24} sm={8} className="d-flex justify-end pt-3">
                                        {levelFields.length > 1 && (
                                          <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<Trash2 size={14} />}
                                            onClick={() => removeLevel(lName)}
                                          >
                                            Xóa mức
                                          </Button>
                                        )}
                                      </Col>
                                    </Row>

                                    <Form.Item
                                      {...restLField}
                                      name={[lName, 'description']}
                                      label="Mô tả chi tiết tiêu chuẩn đạt được ở mức này"
                                      rules={[{ required: true, message: 'Nhập mô tả mức điểm' }]}
                                      className="mb-0"
                                    >
                                      <Input.TextArea
                                        rows={2}
                                        placeholder="Mô tả hành vi, chuẩn sản phẩm hoặc biểu hiện của sinh viên để nhận mức điểm này..."
                                      />
                                    </Form.Item>
                                  </div>
                                ))}

                                <Button
                                  type="dashed"
                                  icon={<Plus size={14} />}
                                  onClick={() =>
                                    addLevel({
                                      id: `lvl-${Date.now()}`,
                                      label: 'Mức mới',
                                      score: 0,
                                      description: '',
                                    })
                                  }
                                  className="w-100 mt-2"
                                >
                                  + Thêm mức điểm cho tiêu chí này
                                </Button>
                              </div>
                            )}
                          </Form.List>
                        </Card>
                      ))}

                      <Button
                        type="dashed"
                        size="large"
                        icon={<Plus size={16} />}
                        onClick={() =>
                          addCriterion({
                            id: `crit-${Date.now()}`,
                            title: '',
                            maxPoints: 4,
                            levels: [
                              { id: 'l1', label: 'Xuất sắc (100%)', score: 4, description: '' },
                              { id: 'l2', label: 'Khá (75%)', score: 3, description: '' },
                              { id: 'l3', label: 'Trung bình (50%)', score: 2, description: '' },
                              { id: 'l4', label: 'Cần cố gắng (25%)', score: 1, description: '' },
                            ],
                          })
                        }
                        className="p-3"
                      >
                        + Thêm Tiêu chí Đánh giá mới
                      </Button>
                    </div>
                  )}
                </Form.List>
              </Form>
            ),
          },
          {
            key: 'preview',
            label: (
              <span className="d-flex items-center gap-1.5">
                <Eye size={15} />
                <span>Xem trước Ma trận (Matrix Preview)</span>
              </span>
            ),
            children: (
              <Card className="velica-card-spec">
                <div className="mb-4">
                  <Title level={4} className="text-primary-color mb-1">
                    {watchedValues?.title || 'Tiêu đề Rubric chưa nhập'}
                  </Title>
                  <Paragraph className="text-muted-color text-xs mb-3">
                    {watchedValues?.description || 'Chưa có mô tả cho Rubric.'}
                  </Paragraph>
                  <Tag color="geekblue" className="font-semibold">
                    Tổng điểm: {totalMaxPoints} điểm
                  </Tag>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered align-middle text-xs">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '22%', minWidth: 200 }}>Tiêu chí đánh giá</th>
                        <th style={{ width: '10%', minWidth: 90 }}>Điểm tối đa</th>
                        <th style={{ minWidth: 450 }}>Các mức độ đánh giá chi tiết (Performance Levels)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCriteria.map((crit: RubricCriteria, idx: number) => (
                        <tr key={idx}>
                          <td className="font-bold text-primary-color">
                            {crit?.title || `Tiêu chí #${idx + 1}`}
                          </td>
                          <td className="text-center font-bold text-brand-color">
                            {crit?.maxPoints || 0}đ
                          </td>
                          <td>
                            <div className="d-flex gap-2 flex-wrap">
                              {crit?.levels?.map((lvl: RubricLevel, lIdx: number) => (
                                <div
                                  key={lIdx}
                                  className="p-2 border rounded-2 bg-light flex-1"
                                  style={{ minWidth: 150 }}
                                >
                                  <div className="d-flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-primary-color">{lvl?.label}</span>
                                    <span className="badge bg-primary text-white text-xs">{lvl?.score}đ</span>
                                  </div>
                                  <div className="text-xs text-muted-color">{lvl?.description}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

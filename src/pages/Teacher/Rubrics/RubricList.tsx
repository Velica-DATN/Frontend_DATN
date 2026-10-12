import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Form,
  Input,
  InputNumber,
  Tag,
  Popconfirm,
  message,
  Card,
  Tooltip,
  Segmented,
  Row,
  Col,
} from 'antd';
import {
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Award,
  Zap,
  Eye,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { mockService } from '../../../api/mocks/mockService';
import { Rubric, RubricCriteria, RubricLevel } from '../../../interfaces/velica.interfaces';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text, Paragraph } = Typography;

export const RubricList: React.FC = () => {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRubric, setEditingRubric] = useState<Rubric | null>(null);
  const [drawerTab, setDrawerTab] = useState<'editor' | 'preview'>('editor');

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getRubrics();
    setRubrics(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingRubric(null);
    setDrawerTab('editor');
    form.resetFields();
    form.setFieldsValue({
      title: '',
      description: '',
      criteria: [
        {
          id: 'crit-new-1',
          title: 'Phân tích & Hiểu vấn đề (Problem Analysis)',
          maxPoints: 4,
          levels: [
            {
              id: 'lvl-1',
              label: 'Xuất sắc (100%)',
              score: 4,
              description: 'Phân tích toàn diện, chính xác và chuyên sâu mọi yêu cầu; giải pháp tối ưu.',
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
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rubric: Rubric) => {
    setEditingRubric(rubric);
    setDrawerTab('editor');
    // Ensure each criteria has a levels array
    const normalizedCriteria = (rubric.criteria || []).map((crit) => ({
      ...crit,
      levels: crit.levels && crit.levels.length > 0 ? crit.levels : [
        { id: 'l1', label: 'Xuất sắc', score: crit.maxPoints, description: 'Đáp ứng toàn diện yêu cầu.' },
        { id: 'l2', label: 'Khá', score: Number((crit.maxPoints * 0.75).toFixed(1)), description: 'Đáp ứng tốt các yêu cầu chính.' },
        { id: 'l3', label: 'Trung bình', score: Number((crit.maxPoints * 0.5).toFixed(1)), description: 'Đáp ứng mức cơ bản.' },
        { id: 'l4', label: 'Cần cố gắng', score: Number((crit.maxPoints * 0.25).toFixed(1)), description: 'Chưa đạt yêu cầu.' },
      ],
    }));

    form.setFieldsValue({
      ...rubric,
      criteria: normalizedCriteria,
    });
    setIsModalOpen(true);
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

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRubric) {
        await mockService.updateRubric(editingRubric.id, values);
        message.success('Cập nhật Rubric thành công!');
      } else {
        await mockService.createRubric(values);
        message.success('Tạo Rubric chấm điểm tự luận mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      // form error
    }
  };

  const handleDelete = async (id: string) => {
    await mockService.deleteRubric(id);
    message.success('Đã xóa Rubric.');
    loadData();
  };

  const filteredRubrics = rubrics.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Tên thang tiêu chí Rubric',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Rubric) => (
        <div>
          <span className="velica-cell-title">{title}</span>
          <Tooltip title={record.description} placement="topLeft">
            <span className="velica-cell-desc d-block text-truncate max-w-480">{record.description}</span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Số tiêu chí đánh giá',
      dataIndex: 'criteria',
      key: 'criteria',
      render: (crit: Rubric['criteria']) => <span>{crit?.length || 0} tiêu chí</span>,
    },
    {
      title: 'Điểm tối đa',
      key: 'maxPoints',
      render: (_: unknown, record: Rubric) => {
        const total = record.criteria?.reduce((acc, c) => acc + (c.maxPoints || 0), 0) || 0;
        return <Tag color="geekblue" className="font-semibold">{total} điểm</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="text-xs text-muted-color">{date.split('T')[0]}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: Rubric) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa thang Rubric & Mức điểm">
            <Button
              type="text"
              icon={<Edit size={16} color="#475569" />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa Rubric này?"
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

  // Watch form values for live preview inside drawer
  const watchedFormValues = Form.useWatch([], form);

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div>
          <Title level={4} className="velica-page-title">
            Quản lý Rubric Chấm Tự Luận
          </Title>
          <Text className="velica-page-desc d-block">
            Xây dựng ma trận tiêu chí đánh giá và mức độ thành thạo phục vụ chấm bài thi tự luận khách quan, chính xác.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
          className="velica-btn-primary"
        >
          Tạo Rubric mới
        </Button>
      </div>

      <FilterBar
        placeholder="Tìm kiếm theo tên hoặc mô tả Rubric..."
        onSearchChange={setSearch}
      />

      <div className="velica-card-table">
        <Table
          dataSource={filteredRubrics}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
          expandable={{
            expandedRowRender: (record: Rubric) => (
              <div className="p-3 bg-muted rounded-2 border">
                <div className="d-flex items-center gap-2 mb-2">
                  <Award size={15} className="text-brand-color" />
                  <span className="font-bold text-xs text-primary-color">
                    Ma trận tiêu chí chi tiết ({record.criteria?.length || 0} tiêu chí):
                  </span>
                </div>
                <div className="d-flex flex-col gap-3">
                  {record.criteria?.map((crit, cIdx) => (
                    <div key={crit.id} className="p-3 bg-white border rounded-2 shadow-xs">
                      <div className="d-flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs text-primary-color">
                          Tiêu chí {cIdx + 1}: {crit.title}
                        </span>
                        <Tag color="geekblue" className="font-semibold m-0">
                          Tối đa: {crit.maxPoints} điểm
                        </Tag>
                      </div>
                      <div className="d-flex gap-2 flex-wrap">
                        {crit.levels?.map((lvl) => (
                          <Tooltip key={lvl.id} title={lvl.description} placement="top">
                            <div className="p-2 border rounded-2 bg-light flex-1 min-w-160 cursor-pointer hover-card">
                              <div className="d-flex justify-between items-center mb-1">
                                <span className="font-semibold text-xs text-primary-color">{lvl.label}</span>
                                <span className="badge bg-primary text-white text-xs">{lvl.score}đ</span>
                              </div>
                              <div className="text-xs text-muted-color line-clamp-2">{lvl.description}</div>
                            </div>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Create / Edit Rubric Slide-over Drawer with WYSIWYG Level Matrix */}
      <Drawer
        title={
          <div className="d-flex items-center justify-between flex-wrap gap-2 pr-4">
            <div>
              <div className="velica-drawer-title">
                {editingRubric ? 'Chỉnh sửa Rubric Chấm Tự Luận' : 'Tạo Rubric Chấm Tự Luận Mới'}
              </div>
              <div className="velica-drawer-subtitle">
                Thiết lập tiêu chí đánh giá và bảng mức độ thành thạo tương ứng trực quan.
              </div>
            </div>

            <Segmented
              value={drawerTab}
              onChange={(val) => setDrawerTab(val as 'editor' | 'preview')}
              options={[
                { label: 'Soạn thảo (Editor)', value: 'editor', icon: <Sliders size={14} /> },
                { label: 'Xem trước ma trận (Preview)', value: 'preview', icon: <Eye size={14} /> },
              ]}
            />
          </div>
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width={920}
        extra={
          <Space>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              {editingRubric ? 'Lưu thay đổi' : 'Tạo Rubric'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="velica-drawer-form">
          <div className="velica-form-row">
            <Form.Item
              name="title"
              label="Tiêu đề thang tiêu chí Rubric"
              rules={[{ required: true, message: 'Nhập tiêu đề' }]}
              className="velica-form-col-flex"
            >
              <Input placeholder="Vd: Rubric Chấm Tự Luận Thiết Kế Kiến Trúc Phần Mềm" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả phạm vi & Mục tiêu đánh giá">
            <Input.TextArea rows={2} placeholder="Mô tả mục tiêu áp dụng cho các đề thi tự luận..." />
          </Form.Item>

          {drawerTab === 'preview' ? (
            /* Live Preview Mode inside Drawer - Identical to preview and grading */
            <div className="p-4 bg-muted rounded-3 border">
              <div className="d-flex items-center justify-between mb-3">
                <div className="d-flex items-center gap-2">
                  <Award size={18} className="text-brand-color" />
                  <span className="font-bold text-sm text-primary-color">
                    Ma trận Rubric Xem trước: {watchedFormValues?.title || 'Chưa đặt tiêu đề'}
                  </span>
                </div>
                <Tag color="geekblue" className="font-semibold">
                  Tổng điểm:{' '}
                  {watchedFormValues?.criteria?.reduce(
                    (acc: number, c: RubricCriteria) => acc + (Number(c?.maxPoints) || 0),
                    0
                  ) || 0}{' '}
                  điểm
                </Tag>
              </div>

              {(!watchedFormValues?.criteria || watchedFormValues.criteria.length === 0) && (
                <div className="text-center py-4 text-muted-color">Chưa có tiêu chí nào.</div>
              )}

              <div className="d-flex flex-col gap-3">
                {watchedFormValues?.criteria?.map((crit: RubricCriteria, cIdx: number) => (
                  <div key={crit?.id || cIdx} className="p-3 bg-white border rounded-2 shadow-xs">
                    <div className="d-flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-primary-color">
                        Tiêu chí {cIdx + 1}: {crit?.title || 'Tiêu chí chưa đặt tên'}
                      </span>
                      <Tag color="geekblue" className="font-semibold m-0">
                        Tối đa: {crit?.maxPoints || 0} điểm
                      </Tag>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      {(crit?.levels || []).map((lvl: RubricLevel, lIdx: number) => (
                        <div
                          key={lvl?.id || lIdx}
                          className="p-2 border rounded-2 bg-light flex-1 min-w-160"
                        >
                          <div className="d-flex justify-between items-center mb-1">
                            <span className="font-semibold text-xs text-primary-color">
                              {lvl?.label || `Mức ${lIdx + 1}`}
                            </span>
                            <span className="badge bg-primary text-white text-xs">
                              {lvl?.score || 0}đ
                            </span>
                          </div>
                          <div className="text-xs text-muted-color line-clamp-2">
                            {lvl?.description || 'Không có mô tả'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Editor Mode with Level Matrix */
            <Form.List name="criteria">
              {(fields, { add, remove }) => (
                <div className="velica-form-section">
                  <div className="velica-form-section-header">
                    <div>
                      <Text strong className="velica-form-section-title">
                        Danh sách các Tiêu chí & Ma trận Mức điểm
                      </Text>
                      <div className="velica-form-section-desc">
                        Mỗi tiêu chí bao gồm các mức thành thạo (Performance Levels) khớp với giao diện chấm thi
                      </div>
                    </div>
                    <Button
                      type="dashed"
                      size="small"
                      icon={<Plus size={14} />}
                      onClick={() =>
                        add({
                          id: `crit-${Date.now()}`,
                          title: `Tiêu chí ${fields.length + 1}`,
                          maxPoints: 4,
                          levels: [
                            { id: 'l1', label: 'Xuất sắc (100%)', score: 4, description: 'Đáp ứng xuất sắc mọi yêu cầu.' },
                            { id: 'l2', label: 'Khá (75%)', score: 3, description: 'Đáp ứng tốt các yêu cầu chính.' },
                            { id: 'l3', label: 'Trung bình (50%)', score: 2, description: 'Đáp ứng mức cơ bản.' },
                            { id: 'l4', label: 'Cần cố gắng (25%)', score: 1, description: 'Chưa đạt yêu cầu tối thiểu.' },
                          ],
                        })
                      }
                    >
                      Thêm Tiêu chí
                    </Button>
                  </div>

                  {fields.map(({ key, name, ...restField }) => (
                    <Card
                      key={key}
                      size="small"
                      className="mb-4 bg-white border rounded-3 shadow-xs"
                      title={
                        <div className="d-flex justify-between items-center w-100 flex-wrap gap-2 py-1">
                          <div className="d-flex items-center gap-2">
                            <Tag color="geekblue" className="font-bold text-xs m-0">
                              Tiêu chí #{name + 1}
                            </Tag>
                          </div>
                          <div className="d-flex items-center gap-2">
                            <Button
                              size="small"
                              type="link"
                              icon={<Zap size={13} className="text-amber-500" />}
                              className="font-medium text-xs text-brand-color p-0"
                              onClick={() => handleQuickFillStandardLevels(name)}
                            >
                              ⚡ Điền nhanh 4 mức chuẩn (100% - 75% - 50% - 25%)
                            </Button>
                            {fields.length > 1 && (
                              <Popconfirm
                                title="Xác nhận xóa tiêu chí này?"
                                onConfirm={() => remove(name)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                              >
                                <Button
                                  type="text"
                                  danger
                                  size="small"
                                  icon={<Trash2 size={15} />}
                                />
                              </Popconfirm>
                            )}
                          </div>
                        </div>
                      }
                    >
                      {/* Criterion Title and Max Points */}
                      <div className="velica-form-row mb-3">
                        <Form.Item
                          {...restField}
                          name={[name, 'title']}
                          label="Tên tiêu chí đánh giá"
                          rules={[{ required: true, message: 'Nhập tên tiêu chí' }]}
                          className="velica-form-col-flex mb-0"
                        >
                          <Input placeholder="Vd: Phân tích vấn đề & Mô hình hóa kiến trúc" />
                        </Form.Item>

                        <Form.Item
                          {...restField}
                          name={[name, 'maxPoints']}
                          label="Điểm tối đa"
                          rules={[{ required: true, message: 'Nhập điểm' }]}
                          className="velica-form-col-fixed-md mb-0"
                        >
                          <InputNumber
                            min={0.5}
                            max={20}
                            step={0.5}
                            addonAfter="đ"
                            className="w-100"
                          />
                        </Form.Item>
                      </div>

                      {/* Nested Performance Levels Form.List - Mirroring the Preview matrix */}
                      <div className="p-3 bg-light rounded-2 border">
                        <Form.List name={[name, 'levels']}>
                          {(levelFields, { add: addLevel, remove: removeLevel }) => (
                            <div>
                              <div className="d-flex items-center justify-between mb-2">
                                <span className="font-semibold text-xs text-primary-color">
                                  Bảng thang đo mức độ thành thạo ({levelFields.length} mức):
                                </span>
                                <Button
                                  size="small"
                                  type="dashed"
                                  icon={<Plus size={12} />}
                                  onClick={() =>
                                    addLevel({
                                      id: `lvl-${Date.now()}`,
                                      label: `Mức ${levelFields.length + 1}`,
                                      score: 1,
                                      description: 'Mô tả tiêu chí đạt được...',
                                    })
                                  }
                                >
                                  Thêm mức điểm
                                </Button>
                              </div>

                              <Row gutter={[12, 12]}>
                                {levelFields.map(({ key: lvlKey, name: lvlName, ...restLvlField }) => (
                                  <Col xs={24} md={12} key={lvlKey}>
                                    <div className="p-2 bg-white border rounded-2 shadow-xs">
                                      <div className="d-flex items-center justify-between gap-2 mb-2">
                                        <Form.Item
                                          {...restLvlField}
                                          name={[lvlName, 'label']}
                                          rules={[{ required: true, message: 'Tên mức' }]}
                                          className="mb-0 flex-1"
                                        >
                                          <Input
                                            size="small"
                                            placeholder="Tên mức (vd: Xuất sắc)"
                                            className="font-medium"
                                          />
                                        </Form.Item>

                                        <Form.Item
                                          {...restLvlField}
                                          name={[lvlName, 'score']}
                                          rules={[{ required: true, message: 'Điểm' }]}
                                          className="mb-0 w-80"
                                        >
                                          <InputNumber
                                            size="small"
                                            min={0}
                                            step={0.5}
                                            addonAfter="đ"
                                            className="w-100"
                                          />
                                        </Form.Item>

                                        {levelFields.length > 1 && (
                                          <Button
                                            type="text"
                                            danger
                                            size="small"
                                            icon={<Trash2 size={13} />}
                                            onClick={() => removeLevel(lvlName)}
                                          />
                                        )}
                                      </div>

                                      <Form.Item
                                        {...restLvlField}
                                        name={[lvlName, 'description']}
                                        rules={[{ required: true, message: 'Nhập mô tả' }]}
                                        className="mb-0"
                                      >
                                        <Input.TextArea
                                          rows={2}
                                          size="small"
                                          placeholder="Mô tả cụ thể biểu hiện đạt được của mức điểm này..."
                                          className="text-xs"
                                        />
                                      </Form.Item>
                                    </div>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          )}
                        </Form.List>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Form.List>
          )}
        </Form>
      </Drawer>
    </div>
  );
};

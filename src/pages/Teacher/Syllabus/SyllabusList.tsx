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
  Select,
  message,
  Popconfirm,
  Tag,
  Card,
  Segmented,
  Row,
  Col,
} from 'antd';
import { Plus, Eye, Edit, Trash2, BookOpen, Layers, LayoutGrid, ListFilter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Syllabus } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;

export const SyllabusList: React.FC = () => {
  const navigate = useNavigate();
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSyllabus, setEditingSyllabus] = useState<Syllabus | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getSyllabi();
    setSyllabi(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingSyllabus(null);
    form.resetFields();
    form.setFieldsValue({
      credits: 3,
      learningObjectives: [
        { code: 'CLO1', description: 'Nắm vững kiến thức nền tảng của môn học.' },
        { code: 'CLO2', description: 'Áp dụng giải quyết bài toán thực tế.' },
      ],
      assessments: [
        { category: 'Assignment (Bài tập lớn)', type: 'on-going', weight: 20, completionCriteria: '> 0', clo: 'CLO1, CLO2' },
        { category: 'Progress Test (Kiểm tra tiến độ)', type: 'on-going', weight: 30, completionCriteria: '> 0', clo: 'CLO1, CLO2' },
        { category: 'Final Exam (Thi cuối kỳ)', type: 'Final exam', weight: 50, completionCriteria: '>= 4.0 / 10', clo: 'CLO1, CLO2' },
      ],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (syl: Syllabus) => {
    setEditingSyllabus(syl);
    form.setFieldsValue({
      code: syl.code,
      name: syl.name,
      description: syl.description,
      credits: syl.credits,
      learningObjectives: syl.learningObjectives || [],
      assessments: syl.assessments || [],
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingSyllabus) {
        await mockService.updateSyllabus(editingSyllabus.id, values);
        message.success('Cập nhật đề cương môn học thành công!');
      } else {
        await mockService.createSyllabus(values);
        message.success('Tạo đề cương môn học mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      // validation error
    }
  };

  const handleDelete = async (id: string) => {
    await mockService.deleteSyllabus(id);
    message.success('Đã xóa đề cương môn học.');
    loadData();
  };

  const filteredSyllabi = syllabi.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'Mã học phần',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (code: string) => <Tag color="blue" className="font-semibold">{code}</Tag>,
    },
    {
      title: 'Tên đề cương môn học',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Syllabus) => (
        <div
          className="cursor-pointer"
          onClick={() => navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', record.id))}
        >
          <span className="velica-cell-title hover:text-brand-color">{name}</span>
          <span className="velica-cell-desc d-block text-truncate max-w-400">{record.description}</span>
        </div>
      ),
    },
    {
      title: 'Số tín chỉ',
      dataIndex: 'credits',
      key: 'credits',
      width: 110,
      render: (credits: number) => <span>{credits} tín chỉ</span>,
    },
    {
      title: 'Số bài giảng',
      dataIndex: 'lessonCount',
      key: 'lessonCount',
      width: 130,
      render: (count: number) => (
        <span className="d-inline-flex items-center gap-1">
          <Layers size={14} color="#64748B" /> {count} bài
        </span>
      ),
    },
    {
      title: 'Chuẩn đầu ra (CLO)',
      dataIndex: 'learningObjectives',
      key: 'learningObjectives',
      width: 200,
      render: (clos: Syllabus['learningObjectives']) => (
        <Space size={4} wrap>
          {clos?.map((c) => (
            <Tag key={c.id || c.code} color="cyan">
              {c.code}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      align: 'right' as const,
      render: (_: unknown, record: Syllabus) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Eye size={16} className="text-brand-color" />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', record.id))}
          >
            Chi tiết
          </Button>
          <Button
            type="text"
            icon={<Edit size={16} color="#64748B" />}
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa đề cương này?"
            description="Các bài giảng liên quan có thể bị ảnh hưởng."
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
            Chương trình Đào tạo & Đề cương Học phần
          </h1>
          <p className="velica-page-desc">
            Xây dựng chuẩn đầu ra (CLO), tổ chức cấu trúc bài giảng và bảo đảm tính liên kết sư phạm.
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
            className="velica-btn-primary"
          >
            Tạo đề cương mới
          </Button>
        </div>
      </div>

      <div className="velica-filter-toolbar">
        <div className="velica-filter-search">
          <FilterBar
            placeholder="Tìm theo mã học phần hoặc tên đề cương..."
            onSearchChange={setSearch}
          />
        </div>
        <Segmented
          value={viewMode}
          onChange={(val) => setViewMode(val as 'cards' | 'table')}
          options={[
            {
              label: 'Thẻ Đề cương',
              value: 'cards',
              icon: <LayoutGrid size={15} className="d-inline mr-1 align-middle" />,
            },
            {
              label: 'Bảng danh sách',
              value: 'table',
              icon: <ListFilter size={15} className="d-inline mr-1 align-middle" />,
            },
          ]}
        />
      </div>

      {viewMode === 'cards' ? (
        <Row gutter={[20, 20]} className="mb-6">
          {filteredSyllabi.map((syl) => (
            <Col xs={24} md={12} xl={8} key={syl.id}>
              <div className="velica-course-card">
                <div
                  className="velica-course-header cursor-pointer"
                  onClick={() => navigate(`/teacher/syllabus/${syl.id}`)}
                >
                  <Tag color="indigo" className="m-0 font-semibold text-sm">
                    {syl.code}
                  </Tag>
                  <Tag className="velica-badge-gray m-0 text-xs">
                    {syl.credits} Tín chỉ
                  </Tag>
                </div>

                <div className="velica-course-body">
                  <h3
                    className="velica-course-name cursor-pointer hover:text-brand-color"
                    onClick={() => navigate(`/teacher/syllabus/${syl.id}`)}
                  >
                    {syl.name}
                  </h3>
                  <p className="velica-course-desc">
                    {syl.description}
                  </p>

                  <div className="mb-4">
                    <div className="text-xs font-semibold text-secondary-color mb-1">
                      Chuẩn đầu ra (CLO):
                    </div>
                    <Space size={4} wrap>
                      {syl.learningObjectives?.map((clo) => (
                        <span
                          key={clo.code}
                          className="velica-badge-indigo text-xs font-semibold"
                        >
                          {clo.code}
                        </span>
                      ))}
                    </Space>
                  </div>

                  <div className="d-flex items-center justify-between p-3 rounded-3 bg-light mt-auto mb-4">
                    <span className="text-sm text-secondary-color d-flex items-center gap-1">
                      <Layers size={15} className="text-brand-color" />
                      <strong>{syl.lessonCount || 4}</strong> bài giảng số
                    </span>
                    <span className="text-sm text-secondary-color d-flex items-center gap-1">
                      <BookOpen size={15} color="#10B981" />
                      <strong>{syl.learningObjectives?.length || 3}</strong> chỉ số CLO
                    </span>
                  </div>

                  <div className="d-flex gap-2">
                    <Button
                      type="primary"
                      block
                      icon={<Eye size={14} />}
                      onClick={() => navigate(`/teacher/syllabus/${syl.id}`)}
                      className="velica-btn-primary flex-1"
                    >
                      Chi tiết đề cương
                    </Button>
                    <Button
                      icon={<Edit size={14} />}
                      onClick={() => handleOpenEdit(syl)}
                      className="velica-btn-action"
                    />
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      ) : (
        <div className="velica-card-table">
          <Table
            dataSource={filteredSyllabi}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8 }}
          />
        </div>
      )}

      {/* Create / Edit Syllabus Slide-over Drawer */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              {editingSyllabus ? 'Chỉnh sửa Đề cương môn học' : 'Tạo Đề cương môn học mới'}
            </div>
            <div className="velica-drawer-subtitle">
              Khai báo thông tin học phần và định lượng chuẩn đầu ra (CLO) liên kết.
            </div>
          </div>
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width={640}
        extra={
          <Space>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              {editingSyllabus ? 'Lưu thay đổi' : 'Tạo đề cương'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="velica-drawer-form">
          <div className="velica-form-row">
            <Form.Item
              name="code"
              label="Mã học phần"
              rules={[{ required: true, message: 'Nhập mã học phần' }]}
              className="velica-form-col-flex"
            >
              <Input placeholder="Vd: SE301" />
            </Form.Item>
            <Form.Item
              name="credits"
              label="Số tín chỉ"
              rules={[{ required: true, message: 'Nhập số tín chỉ' }]}
              className="velica-form-col-fixed-md"
            >
              <InputNumber min={1} max={10} className="w-100" />
            </Form.Item>
          </div>

          <Form.Item
            name="name"
            label="Tên đề cương môn học"
            rules={[{ required: true, message: 'Nhập tên đề cương' }]}
          >
            <Input placeholder="Vd: Kiến Trúc & Thiết Kế Phần Mềm" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả mục tiêu môn học">
            <Input.TextArea rows={3} placeholder="Mô tả tổng quan nội dung chương trình đào tạo..." />
          </Form.Item>

          {/* Dynamic Learning Objectives */}
          <Form.List name="learningObjectives">
            {(fields, { add, remove }) => (
              <div className="velica-form-section">
                <div className="velica-form-section-header">
                  <div>
                    <Text strong className="velica-form-section-title">Chuẩn đầu ra môn học (CLO)</Text>
                    <div className="velica-form-section-desc">Định nghĩa các năng lực sinh viên cần đạt</div>
                  </div>
                  <Button type="dashed" size="small" onClick={() => add({ code: `CLO${fields.length + 1}`, description: '' })}>
                    Thêm CLO
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="velica-form-row items-baseline mb-2">
                    <Form.Item
                      {...restField}
                      name={[name, 'code']}
                      rules={[{ required: true, message: 'Nhập mã' }]}
                      className="velica-form-col-fixed-sm mb-0"
                    >
                      <Input placeholder="CLO1" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      rules={[{ required: true, message: 'Nhập mô tả chuẩn đầu ra' }]}
                      className="velica-form-col-flex mb-0"
                    >
                      <Input placeholder="Mô tả chuẩn đầu ra..." />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      icon={<Trash2 size={16} />}
                      onClick={() => remove(name)}
                    />
                  </div>
                ))}
              </div>
            )}
          </Form.List>

          {/* Assessment Scheme Form.List */}
          <Form.List name="assessments">
            {(fields, { add, remove }) => (
              <div className="velica-form-section mt-4">
                <div className="velica-form-section-header">
                  <div>
                    <Text strong className="velica-form-section-title">Cấu trúc Đánh giá Học phần</Text>
                    <div className="velica-form-section-desc">Khai báo các bài đánh giá quá trình và thi cuối kỳ</div>
                  </div>
                  <Button
                    type="dashed"
                    size="small"
                    onClick={() =>
                      add({
                        category: 'Bài kiểm tra',
                        type: 'on-going',
                        weight: 10,
                        completionCriteria: '> 0',
                        clo: 'CLO1',
                      })
                    }
                  >
                    Thêm Thành phần
                  </Button>
                </div>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="p-3 bg-light border rounded-2 mb-2">
                    <div className="d-flex justify-between items-center mb-2">
                      <span className="font-semibold text-xs text-brand-color">Thành phần #{name + 1}</span>
                      {fields.length > 1 && (
                        <Trash2
                          size={15}
                          className="text-danger-color cursor-pointer"
                          onClick={() => remove(name)}
                        />
                      )}
                    </div>
                    <Row gutter={8}>
                      <Col span={9}>
                        <Form.Item
                          {...restField}
                          name={[name, 'category']}
                          label={<span className="text-xs">Tên hạng mục</span>}
                          rules={[{ required: true, message: 'Nhập tên' }]}
                          className="mb-2"
                        >
                          <Input placeholder="Vd: Assignment / Final Exam" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'type']}
                          label={<span className="text-xs">Phân loại</span>}
                          rules={[{ required: true }]}
                          className="mb-2"
                        >
                          <Select
                            options={[
                              { label: 'Quá trình', value: 'on-going' },
                              { label: 'Cuối kỳ', value: 'Final exam' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'weight']}
                          label={<span className="text-xs">Trọng số (%)</span>}
                          rules={[{ required: true, message: 'Nhập %' }]}
                          className="mb-2"
                        >
                          <InputNumber min={1} max={100} addonAfter="%" className="w-100" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'clo']}
                          label={<span className="text-xs">Chuẩn CLO</span>}
                          className="mb-2"
                        >
                          <Input placeholder="CLO1, CLO2" />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            )}
          </Form.List>
        </Form>
      </Drawer>
    </div>
  );
};

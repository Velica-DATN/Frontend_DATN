import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Drawer,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Popconfirm,
  Tag,
  Tooltip,
} from 'antd';
import { Plus, Eye, Edit, Trash2, BookOpen, ExternalLink, Layers } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Lesson, Syllabus } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

export const LessonList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const syllabusParam = searchParams.get('syllabusId');

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<string | undefined>(
    syllabusParam || undefined
  );
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [form] = Form.useForm();
  const watchedSyllabusId = Form.useWatch('syllabusId', form);

  // Sync state if URL changes
  useEffect(() => {
    if (syllabusParam && syllabusParam !== selectedSyllabus) {
      setSelectedSyllabus(syllabusParam);
    }
  }, [syllabusParam]);

  const loadData = async () => {
    setLoading(true);
    const [lesList, sylList] = await Promise.all([
      mockService.getLessons(selectedSyllabus),
      mockService.getSyllabi(),
    ]);
    setLessons(lesList);
    setSyllabi(sylList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSyllabus]);

  const handleSyllabusFilterChange = (val: string | undefined) => {
    setSelectedSyllabus(val);
    if (val) {
      setSearchParams({ syllabusId: val });
    } else {
      setSearchParams({});
    }
  };

  const handleOpenCreate = () => {
    setEditingLesson(null);
    form.resetFields();
    form.setFieldsValue({
      orderIndex: lessons.length + 1,
      syllabusId: selectedSyllabus || syllabi[0]?.id,
      cloIds: ['CLO1'],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (les: Lesson) => {
    setEditingLesson(les);
    form.setFieldsValue({
      syllabusId: les.syllabusId,
      title: les.title,
      description: les.description,
      orderIndex: les.orderIndex,
      cloIds: les.cloIds && les.cloIds.length > 0 ? les.cloIds : ['CLO1'],
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingLesson) {
        await mockService.updateLesson(editingLesson.id, values);
        message.success('Cập nhật chủ đề theo đề cương thành công!');
      } else {
        await mockService.createLesson(values);
        message.success('Tạo chủ đề mới cho đề cương thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      // validation error
    }
  };

  const handleDelete = async (id: string) => {
    await mockService.deleteLesson(id);
    message.success('Đã xóa chủ đề khỏi đề cương.');
    loadData();
  };

  const filteredLessons = lessons.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
  );

  // Active selected syllabus object
  const activeSyllabus = syllabi.find((s) => s.id === selectedSyllabus);

  // Derive active syllabus's CLOs for form select
  const currentFormSyllabus = syllabi.find(
    (s) => s.id === (watchedSyllabusId || selectedSyllabus || syllabi[0]?.id)
  );
  const cloOptions =
    currentFormSyllabus?.learningObjectives && currentFormSyllabus.learningObjectives.length > 0
      ? currentFormSyllabus.learningObjectives.map((clo) => ({
          label: `${clo.code}: ${clo.description}`,
          value: clo.code,
        }))
      : [
          { label: 'CLO1: Hiểu & phân tích kiến trúc phần mềm', value: 'CLO1' },
          { label: 'CLO2: Thiết kế hệ thống phân tán & Microservices', value: 'CLO2' },
          { label: 'CLO3: Đánh giá Trade-offs & Cloud Native', value: 'CLO3' },
          { label: 'CLO4: Triển khai & Kiểm thử thực chiến', value: 'CLO4' },
        ];

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 85,
      align: 'center' as const,
      render: (idx: number) => (
        <Tag color="geekblue" className="m-0 font-semibold text-xs">
          Bài {idx}
        </Tag>
      ),
    },
    {
      title: 'Tên Chủ đề & Phạm vi Kiến thức',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: Lesson) => (
        <div style={{ maxWidth: 360 }}>
          <Tooltip title={title} placement="topLeft">
            <span
              className="velica-cell-title velica-table-cell-ellipsis cursor-pointer hover:text-brand-color transition-colors"
              onClick={() => navigate(ROUTE_PATHS.TEACHER.LESSONS_DETAIL.replace(':id', record.id))}
            >
              {title}
            </span>
          </Tooltip>
          <Tooltip title={record.description} placement="topLeft">
            <span className="velica-cell-desc text-muted-color">
              {record.description}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Thuộc Đề cương Môn học',
      dataIndex: 'syllabusName',
      key: 'syllabusName',
      width: 240,
      render: (name: string, record: Lesson) => (
        <Tooltip title="Bấm để xem chi tiết Đề cương học phần này" placement="topLeft">
          <div
            className="cursor-pointer d-inline-flex items-center gap-1.5 text-brand-color font-semibold hover:underline"
            onClick={() =>
              navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', record.syllabusId))
            }
          >
            <BookOpen size={14} className="flex-shrink-0" />
            <span className="velica-table-cell-ellipsis" style={{ maxWidth: 200 }}>
              {name || 'Xem đề cương'}
            </span>
            <ExternalLink size={12} className="flex-shrink-0 text-muted-color" />
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Chuẩn CLO',
      dataIndex: 'cloIds',
      key: 'cloIds',
      width: 140,
      render: (cloIds: string[] | undefined) => {
        const list = cloIds && cloIds.length > 0 ? cloIds : ['CLO1'];
        return (
          <div className="d-flex gap-1 flex-wrap">
            {list.map((clo) => (
              <Tag key={clo} color="blue" className="text-xs font-semibold m-0">
                {clo}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Ngân hàng câu hỏi',
      dataIndex: 'questionCount',
      key: 'questionCount',
      width: 140,
      align: 'center' as const,
      render: (count: number) => (
        <Tag color="purple" className="text-xs font-medium m-0 px-2 py-0.5">
          {count || 0} câu hỏi
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 220,
      align: 'right' as const,
      render: (_: unknown, record: Lesson) => (
        <Space size="small">
          <Button
            type="text"
            icon={<Eye size={15} className="text-brand-color" />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.LESSONS_DETAIL.replace(':id', record.id))}
          >
            Xem câu hỏi
          </Button>
          <Tooltip title="Mở trang đề cương môn học liên kết">
            <Button
              type="text"
              icon={<BookOpen size={15} className="text-indigo-600" />}
              onClick={() =>
                navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', record.syllabusId))
              }
            >
              Đề cương ↗
            </Button>
          </Tooltip>
          <Button
            type="text"
            icon={<Edit size={15} color="#64748B" />}
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa chủ đề này?"
            description="Chủ đề sẽ bị xóa khỏi đề cương môn học."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<Trash2 size={15} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Modern Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h1 className="velica-page-title">
            Quản lý Chủ đề theo Đề cương Môn học (Course Topics & Lessons)
          </h1>
          <p className="velica-page-desc">
            Danh mục chủ đề/bài giảng theo từng Đề cương môn học. Mỗi chủ đề được ánh xạ trực tiếp với Chuẩn đầu ra (CLO) của đề cương và kết nối với Ngân hàng câu hỏi phục vụ giảng dạy, ra đề thi.
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
            className="velica-btn-primary"
          >
            Tạo chủ đề mới
          </Button>
        </div>
      </div>

      {/* Prominent Syllabus Context Banner if selected */}
      {activeSyllabus && (
        <div className="velica-card mb-3 p-3 bg-white border rounded-3 shadow-xs d-flex justify-between items-center flex-wrap gap-3">
          <div className="d-flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-brand-color rounded-2 d-flex items-center justify-center" style={{ width: 42, height: 42 }}>
              <Layers size={22} />
            </div>
            <div>
              <div className="d-flex items-center gap-2 flex-wrap">
                <Tag color="geekblue" className="font-bold text-xs m-0">
                  {activeSyllabus.code}
                </Tag>
                <span className="font-bold text-primary-color fs-15">
                  {activeSyllabus.name}
                </span>
              </div>
              <div className="text-xs text-secondary-color mt-0.5">
                Đang hiển thị {filteredLessons.length} chủ đề bài giảng thuộc đề cương này • {activeSyllabus.learningObjectives?.length || 0} chuẩn đầu ra CLO • Thang điểm {activeSyllabus.scoringScale || 10}
              </div>
            </div>
          </div>
          <div className="d-flex items-center gap-2">
            <Button
              icon={<BookOpen size={14} />}
              onClick={() =>
                navigate(ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(':id', activeSyllabus.id))
              }
              className="velica-btn-action text-xs"
            >
              Xem chi tiết Đề cương này ↗
            </Button>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={handleOpenCreate}
              className="velica-btn-primary text-xs"
            >
              Thêm chủ đề vào Đề cương
            </Button>
          </div>
        </div>
      )}

      <FilterBar
        placeholder="Tìm kiếm theo tiêu đề chủ đề hoặc mô tả..."
        onSearchChange={setSearch}
        onClearFilters={() => handleSyllabusFilterChange(undefined)}
        hasActiveFilters={Boolean(selectedSyllabus)}
      >
        <Select
          allowClear
          placeholder="Lọc theo Đề cương môn học"
          className="velica-form-col-fixed-lg"
          value={selectedSyllabus}
          onChange={handleSyllabusFilterChange}
        >
          {syllabi.map((s) => (
            <Select.Option key={s.id} value={s.id}>
              {s.code} - {s.name}
            </Select.Option>
          ))}
        </Select>
      </FilterBar>

      <div className="velica-card-table">
        <Table
          dataSource={filteredLessons}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Create / Edit Lesson Slide-over Drawer */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              {editingLesson ? 'Chỉnh sửa Chủ đề Đề cương' : 'Tạo Chủ đề mới cho Đề cương'}
            </div>
            <div className="velica-drawer-subtitle">
              Thiết lập chủ đề bài giảng thuộc đề cương môn học, gắn chuẩn CLO tương ứng và quản lý câu hỏi khảo thí.
            </div>
          </div>
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width={580}
        extra={
          <Space>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              {editingLesson ? 'Lưu thay đổi' : 'Tạo chủ đề'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="velica-drawer-form">
          <div className="velica-form-row">
            <Form.Item
              name="syllabusId"
              label="Đề cương môn học (Syllabus)"
              rules={[{ required: true, message: 'Vui lòng chọn đề cương' }]}
              className="velica-form-col-flex"
            >
              <Select placeholder="Chọn đề cương môn học">
                {syllabi.map((s) => (
                  <Select.Option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="orderIndex"
              label="Thứ tự chủ đề"
              rules={[{ required: true, message: 'Nhập số thứ tự' }]}
              className="velica-form-col-fixed-md"
            >
              <InputNumber min={1} className="w-100" />
            </Form.Item>
          </div>

          <Form.Item
            name="cloIds"
            label="Chuẩn đầu ra (CLO) ánh xạ"
            tooltip="Chọn các chuẩn đầu ra trong đề cương mà chủ đề này phụ trách để phân bổ câu hỏi và sinh đề thi"
          >
            <Select
              mode="multiple"
              placeholder="Chọn chuẩn CLO liên kết..."
              options={cloOptions}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tên chủ đề / Bài giảng"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ đề' }]}
          >
            <Input placeholder="Vd: Bài 1: Nguyên lý SOLID & Clean Architecture" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả phạm vi kiến thức / Nội dung trọng tâm">
            <Input.TextArea rows={3} placeholder="Mô tả phạm vi kiến thức hoặc ghi chú phân bổ câu hỏi..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

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
  message,
  Popconfirm,
  Tag,
  Tooltip,
  Modal,
  Checkbox,
} from 'antd';
import { Plus, Eye, Edit, Trash2, Share2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Lesson, Syllabus, ClassRoom } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;

export const LessonList: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [selectedSyllabus, setSelectedSyllabus] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  // Link to Class Modal states (Reusability)
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkingLesson, setLinkingLesson] = useState<Lesson | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  const [form] = Form.useForm();
  const watchedSyllabusId = Form.useWatch('syllabusId', form);

  const loadData = async () => {
    setLoading(true);
    const [lesList, sylList, clsList] = await Promise.all([
      mockService.getLessons(selectedSyllabus),
      mockService.getSyllabi(),
      mockService.getClasses(),
    ]);
    setLessons(lesList);
    setSyllabi(sylList);
    setClasses(clsList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSyllabus]);

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
        message.success('Cập nhật chủ đề CLO thành công!');
      } else {
        await mockService.createLesson(values);
        message.success('Tạo chủ đề CLO mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      // validation error
    }
  };

  const handleDelete = async (id: string) => {
    await mockService.deleteLesson(id);
    message.success('Đã xóa chủ đề thành công.');
    loadData();
  };

  // Open Quick Class Linking Modal
  const handleOpenLinkClass = (les: Lesson) => {
    setLinkingLesson(les);
    // Auto-select classes that already match this syllabus
    const matching = classes.filter((c) => c.syllabusId === les.syllabusId).map((c) => c.id);
    setSelectedClassIds(matching.length > 0 ? matching : [classes[0]?.id].filter(Boolean));
    setLinkModalOpen(true);
  };

  const handleConfirmLinkClass = () => {
    if (!linkingLesson) return;
    const classNames = classes
      .filter((c) => selectedClassIds.includes(c.id))
      .map((c) => c.code || c.name)
      .join(', ');
    message.success(
      `Đã gắn và kích hoạt chủ đề "${linkingLesson.title}" vào các lớp: ${classNames || 'toàn bộ lớp'}!`
    );
    setLinkModalOpen(false);
  };

  const filteredLessons = lessons.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.description.toLowerCase().includes(search.toLowerCase())
  );

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
        ];

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 75,
      render: (idx: number) => <Tag color="geekblue" className="m-0 font-medium">Bài {idx}</Tag>,
    },
    {
      title: 'Tên chủ đề & Phạm vi kiến thức',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Lesson) => (
        <div className="max-w-360">
          <Tooltip title={title} placement="topLeft">
            <span
              className="velica-cell-title d-block text-truncate cursor-pointer hover:text-brand-color"
              onClick={() => navigate(ROUTE_PATHS.TEACHER.LESSONS_DETAIL.replace(':id', record.id))}
            >
              {title}
            </span>
          </Tooltip>
          <Tooltip title={record.description} placement="topLeft">
            <span className="velica-cell-desc d-block text-truncate text-muted-color">
              {record.description}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Thuộc đề cương',
      dataIndex: 'syllabusName',
      key: 'syllabusName',
      width: 200,
      render: (name: string) => (
        <Tooltip title={name} placement="topLeft">
          <span className="velica-cell-title text-brand-color d-block text-truncate max-w-180">
            {name}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Chuẩn CLO',
      dataIndex: 'cloIds',
      key: 'cloIds',
      width: 130,
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
      title: 'Số câu',
      dataIndex: 'questionCount',
      key: 'questionCount',
      width: 80,
      render: (count: number) => <span>{count} câu</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 180,
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
          <Tooltip title="Gắn chủ đề vào lớp học (Tái sử dụng nhanh)">
            <Button
              type="text"
              icon={<Share2 size={15} className="text-indigo-600" />}
              onClick={() => handleOpenLinkClass(record)}
            >
              Gắn lớp
            </Button>
          </Tooltip>
          <Button
            type="text"
            icon={<Edit size={15} color="#64748B" />}
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa chủ đề này?"
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
            Danh mục Chủ đề theo CLO (Tạo đề thi)
          </h1>
          <p className="velica-page-desc">
            Phân loại danh mục (category) kiến thức tương ứng với chuẩn đầu ra CLO của đề cương, dùng làm cơ sở phân bổ câu hỏi và sinh ma trận đề thi.
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

      <FilterBar
        placeholder="Tìm kiếm theo tiêu đề bài giảng..."
        onSearchChange={setSearch}
        onClearFilters={() => setSelectedSyllabus(undefined)}
        hasActiveFilters={Boolean(selectedSyllabus)}
      >
        <Select
          allowClear
          placeholder="Lọc theo Đề cương môn học"
          className="velica-form-col-fixed-lg"
          value={selectedSyllabus}
          onChange={setSelectedSyllabus}
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
              {editingLesson ? 'Chỉnh sửa chủ đề CLO' : 'Tạo chủ đề CLO mới'}
            </div>
            <div className="velica-drawer-subtitle">
              Thiết lập danh mục phân loại kiến thức theo chuẩn CLO của đề cương để phục vụ ra đề thi.
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
            tooltip="Chọn các chuẩn đầu ra trong đề cương mà chủ đề này đại diện để sinh đề thi"
          >
            <Select
              mode="multiple"
              placeholder="Chọn chuẩn CLO liên kết..."
              options={cloOptions}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label="Tên chủ đề / Phân loại"
            rules={[{ required: true, message: 'Vui lòng nhập tên chủ đề' }]}
          >
            <Input placeholder="Vd: Chủ đề 1: Nguyên lý SOLID & Clean Architecture" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả phạm vi kiến thức / Ghi chú ra đề">
            <Input.TextArea rows={3} placeholder="Mô tả phạm vi kiến thức hoặc ghi chú phân bổ câu hỏi..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Quick Attach to Class Modal (Reusability) */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Share2 size={18} className="text-brand-color" />
            <span className="font-bold">Gắn bài giảng vào Lớp học phần (Tái sử dụng nhanh)</span>
          </div>
        }
        open={linkModalOpen}
        onCancel={() => setLinkModalOpen(false)}
        onOk={handleConfirmLinkClass}
        okText="Xác nhận gắn vào lớp"
        cancelText="Hủy"
        width={560}
      >
        <div className="py-2">
          <p className="text-xs text-secondary-color mb-3">
            Chọn các lớp học bạn muốn chia sẻ và gắn bài giảng{' '}
            <strong className="text-primary-color">"{linkingLesson?.title}"</strong>. Bài giảng sẽ
            ngay lập tức xuất hiện trong mục học liệu của sinh viên các lớp này.
          </p>

          <div className="bg-light p-3 rounded-3 border mb-3">
            <div className="font-semibold text-xs text-primary-color mb-2">
              Danh sách các lớp đang mở ({classes.length} lớp):
            </div>
            <Checkbox.Group
              className="d-flex flex-col gap-2 w-100"
              value={selectedClassIds}
              onChange={(checked) => setSelectedClassIds(checked as string[])}
            >
              {classes.map((cls) => (
                <div key={cls.id} className="d-flex items-center justify-between p-2 bg-white rounded border">
                  <Checkbox value={cls.id}>
                    <span className="font-semibold">{cls.name}</span>{' '}
                    <Tag color="geekblue" className="text-xs ml-1">{cls.code}</Tag>
                  </Checkbox>
                  <span className="text-xs text-muted-color">
                    {cls.term} • {cls.memberCount || 38} SV
                  </span>
                </div>
              ))}
            </Checkbox.Group>
          </div>
        </div>
      </Modal>
    </div>
  );
};

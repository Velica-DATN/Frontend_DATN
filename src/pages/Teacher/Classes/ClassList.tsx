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
  message,
  Popconfirm,
  Tag,
  Row,
  Col,
  Segmented,
  Modal,
  Tooltip,
} from 'antd';
import {
  Plus,
  Users,
  BarChart2,
  Trash2,
  Edit,
  LayoutGrid,
  List as ListIcon,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { ClassRoom, Syllabus } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;

export const ClassList: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const [clsList, sylList] = await Promise.all([
      mockService.getClasses(),
      mockService.getSyllabi(),
    ]);
    setClasses(clsList);
    setSyllabi(sylList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingClass(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    form.setFieldsValue({
      code: cls.code,
      name: cls.name,
      description: cls.description,
      term: cls.term,
      syllabusId: cls.syllabusId,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const currentUser = mockService.getCurrentUser();
      const syl = syllabi.find((s) => s.id === values.syllabusId);

      if (editingClass) {
        await mockService.updateClass(editingClass.id, {
          ...values,
          syllabusName: syl?.name,
        });
        message.success('Cập nhật thông tin lớp học thành công!');
      } else {
        await mockService.createClass({
          ...values,
          teacherId: currentUser.id,
          teacherName: currentUser.fullName,
          syllabusName: syl?.name,
        });
        message.success('Tạo lớp học phần mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      // validation error
    }
  };

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const handleDelete = async (cls: ClassRoom) => {
    if (cls.memberCount > 0 || cls.assessmentCount > 0) {
      Modal.confirm({
        title: `Xác nhận Xóa mềm Lớp học "${cls.name}"?`,
        content: (
          <div>
            <p>Lớp học hiện có <strong>{cls.memberCount} sinh viên</strong> và <strong>{cls.assessmentCount} bài kiểm tra</strong>.</p>
            <p className="text-muted-color">
              Để bảo toàn lịch sử làm bài và kết quả chuẩn đầu ra (CLO) của sinh viên, hệ thống sẽ thực hiện <strong>Xoá mềm (Soft Delete)</strong>. Lớp học sẽ được chuyển sang tab "Lớp đã lưu trữ" và có thể khôi phục lại bất kỳ lúc nào.
            </p>
          </div>
        ),
        okText: 'Xác nhận Xóa mềm',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: async () => {
          await mockService.deleteClass(cls.id);
          message.success(`Đã xóa mềm và lưu trữ lớp "${cls.code}" thành công.`);
          loadData();
        },
      });
    } else {
      Modal.confirm({
        title: `Xác nhận xóa hoàn toàn lớp "${cls.name}"?`,
        content: 'Lớp học chưa phát sinh dữ liệu khảo thí nên sẽ được xóa vĩnh viễn khỏi hệ thống.',
        okText: 'Xóa vĩnh viễn',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: async () => {
          await mockService.deleteClass(cls.id, true);
          message.success('Đã xóa lớp học thành công.');
          loadData();
        },
      });
    }
  };

  const handleRestore = async (cls: ClassRoom) => {
    await mockService.restoreClass(cls.id);
    message.success(`Đã khôi phục lớp học "${cls.code}" thành công!`);
    loadData();
  };

  const filteredClasses = classes
    .filter((c) => (activeTab === 'active' ? !c.isDeleted : !!c.isDeleted))
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
    );

  const columns = [
    {
      title: 'Mã lớp',
      dataIndex: 'code',
      key: 'code',
      render: (code: string, record: ClassRoom) => (
        <Space>
          <Tag color="geekblue" className="font-semibold">{code}</Tag>
          {record.isDeleted && <Tag color="error">Đã xóa mềm</Tag>}
        </Space>
      ),
    },
    {
      title: 'Tên lớp học phần',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (name: string, record: ClassRoom) => (
        <div style={{ maxWidth: 300 }}>
          <Tooltip title={name}>
            <Text strong className="velica-cell-title text-truncate d-block" style={{ maxWidth: 280 }}>{name}</Text>
          </Tooltip>
          {record.description && (
            <Tooltip title={record.description}>
              <Text type="secondary" className="velica-cell-desc text-truncate d-block" style={{ maxWidth: 280 }}>{record.description}</Text>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Đề cương môn học',
      dataIndex: 'syllabusName',
      key: 'syllabusName',
      ellipsis: true,
      render: (name: string) => (
        <Tooltip title={name || 'Chưa gán'}>
          <span className="velica-cell-title text-brand-color text-truncate d-block" style={{ maxWidth: 220 }}>
            {name || 'Chưa gán'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Số sinh viên',
      dataIndex: 'memberCount',
      key: 'memberCount',
      render: (count: number) => <span>{count} sinh viên</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: ClassRoom) => (
        <Space size="middle">
          {!record.isDeleted ? (
            <>
              <Button
                type="text"
                icon={<Users size={16} className="text-brand-color" />}
                onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASS_DETAIL.replace(':id', record.id))}
              >
                Quản lý lớp
              </Button>
              <Button
                type="text"
                icon={<BarChart2 size={16} color="#16A34A" />}
                onClick={() => navigate(`${ROUTE_PATHS.TEACHER.CLASS_DETAIL.replace(':id', record.id)}?tab=analytics`)}
              >
                Thống kê CLO
              </Button>
              <Tooltip title="Chỉnh sửa thông tin lớp">
                <Button
                  type="text"
                  icon={<Edit size={16} color="#475569" />}
                  onClick={() => handleOpenEdit(record)}
                />
              </Tooltip>
              <Button
                type="text"
                danger
                icon={<Trash2 size={16} />}
                onClick={() => handleDelete(record)}
              />
            </>
          ) : (
            <Button
              type="primary"
              size="small"
              onClick={() => handleRestore(record)}
            >
              Khôi phục lớp
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Modern Untitled UI Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h2 className="velica-page-title">
            Không gian Giảng dạy & Quản lý Lớp học phần
          </h2>
          <p className="velica-page-desc">
            Theo dõi tiến độ học tập, đề cương môn học và kết quả khảo thí chuẩn đầu ra (CLO) của toàn bộ lớp học phần.
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
            className="velica-btn-primary"
          >
            Tạo lớp mới
          </Button>
        </div>
      </div>

      {/* Filter and View Mode Switcher */}
      <div className="velica-filter-toolbar">
        <div className="velica-filter-search">
          <FilterBar
            placeholder="Tìm theo tên lớp hoặc mã lớp..."
            onSearchChange={setSearch}
          />
        </div>

        {/* Status Tab & View mode toggle */}
        <div className="d-flex items-center gap-2 flex-wrap">
          <Segmented
            value={activeTab}
            onChange={(val) => setActiveTab(val as 'active' | 'archived')}
            options={[
              { label: `Đang giảng dạy (${classes.filter((c) => !c.isDeleted).length})`, value: 'active' },
              { label: `Đã lưu trữ (${classes.filter((c) => !!c.isDeleted).length})`, value: 'archived' },
            ]}
          />
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as 'grid' | 'table')}
            options={[
              {
                label: (
                  <span className="d-inline-flex items-center gap-1 font-semibold">
                    <LayoutGrid size={15} /> Thẻ
                  </span>
                ),
                value: 'grid',
              },
              {
                label: (
                  <span className="d-inline-flex items-center gap-1 font-semibold">
                    <ListIcon size={15} /> Bảng
                  </span>
                ),
                value: 'table',
              },
            ]}
          />
        </div>
      </div>

      {/* View Mode: Card Grid (Clean Untitled UI SaaS Style) */}
      {viewMode === 'grid' ? (
        <Row gutter={[20, 20]}>
          {filteredClasses.map((cls) => {
            return (
              <Col xs={24} md={12} xl={8} key={cls.id}>
                <div className="velica-course-card">
                  {/* Course Card Top Header */}
                  <div className="velica-course-header">
                    <Tag color="blue" className="m-0 font-semibold text-sm">
                      {cls.code}
                    </Tag>
                  </div>

                  {/* Course Body */}
                  <div className="velica-course-body">
                    <div>
                      <h3 className="velica-course-name">
                        {cls.name}
                      </h3>

                      {/* Syllabus Info */}
                      <div
                        className="velica-course-syllabus-pill cursor-pointer hover-text-brand"
                        onClick={() => navigate(`${ROUTE_PATHS.TEACHER.CLASS_DETAIL.replace(':id', cls.id)}?tab=syllabus`)}
                        title="Bấm để xem Đề cương (Syllabus) của học phần này"
                      >
                        <div className="velica-course-syllabus-icon">
                          <BookOpen size={14} />
                        </div>
                        <span className="velica-course-syllabus-title">
                          {cls.syllabusName || 'Chưa liên kết đề cương'}
                        </span>
                      </div>

                      <p className="velica-course-desc">
                        {cls.description || 'Lớp học phần giảng dạy lý thuyết và đồ án thực hành.'}
                      </p>

                      {/* Course Stats - Only Students and Exams */}
                      <div className="velica-course-stats-grid">
                        <div>
                          <div className="velica-course-stat-val">42</div>
                          <div className="velica-course-stat-lbl">Sinh viên</div>
                        </div>
                        <div>
                          <div className="velica-course-stat-val-brand">3</div>
                          <div className="velica-course-stat-lbl">Bài thi</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="velica-course-actions-footer">
                      {!cls.isDeleted ? (
                        <>
                          <Button
                            type="primary"
                            icon={<Users size={15} />}
                            onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASS_DETAIL.replace(':id', cls.id))}
                            className="velica-btn-primary flex-1"
                          >
                            Vào lớp
                          </Button>
                          <Tooltip title="Thống kê chuẩn đầu ra (CLO) & Phân tích phổ điểm">
                            <Button
                              icon={<BarChart2 size={15} />}
                              onClick={() => navigate(`${ROUTE_PATHS.TEACHER.CLASS_DETAIL.replace(':id', cls.id)}?tab=analytics`)}
                              className="velica-btn-action"
                            />
                          </Tooltip>
                          <Tooltip title="Chỉnh sửa thông tin lớp">
                            <Button
                              icon={<Edit size={15} />}
                              onClick={() => handleOpenEdit(cls)}
                              className="velica-btn-action"
                            />
                          </Tooltip>
                          <Tooltip title="Xóa mềm lớp học">
                            <Button
                              icon={<Trash2 size={15} />}
                              danger
                              onClick={() => handleDelete(cls)}
                              className="velica-btn-action"
                            />
                          </Tooltip>
                        </>
                      ) : (
                        <Button
                          type="primary"
                          onClick={() => handleRestore(cls)}
                          className="flex-1"
                        >
                          Khôi phục lớp học
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      ) : (
        /* View Mode: Table */
        <div className="velica-table-container">
          <Table
            dataSource={filteredClasses}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 8, showTotal: (total) => `Tổng cộng ${total} lớp học` }}
            scroll={{ x: 'max-content' }}
          />
        </div>
      )}

      {/* Drawer Create/Edit Class */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              {editingClass ? 'Chỉnh sửa thông tin lớp' : 'Tạo lớp học phần mới'}
            </div>
            <div className="velica-drawer-subtitle">
              Khai báo mã lớp và gắn kết đề cương môn học đào tạo.
            </div>
          </div>
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width={560}
        extra={
          <Space>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              {editingClass ? 'Lưu thay đổi' : 'Tạo lớp'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="velica-drawer-form">
          <Form.Item
            name="code"
            label="Mã lớp học phần"
            rules={[{ required: true, message: 'Vui lòng nhập mã lớp (vd: SE301.P01)' }]}
          >
            <Input placeholder="Vd: SE301.P01" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên lớp học phần"
            rules={[{ required: true, message: 'Vui lòng nhập tên lớp' }]}
          >
            <Input placeholder="Vd: Kiến Trúc Phần Mềm - Nhóm 01" />
          </Form.Item>

          <Form.Item
            name="syllabusId"
            label="Đề cương môn học phụ trách"
            rules={[{ required: true, message: 'Vui lòng chọn đề cương' }]}
          >
            <Select placeholder="Chọn đề cương môn học">
              {syllabi.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả / Ghi chú lớp">
            <Input.TextArea rows={3} placeholder="Mô tả thông tin buổi học, phòng học, ghi chú..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

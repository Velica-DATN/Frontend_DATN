import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Tag,
  Card,
  message,
  Popconfirm,
  Radio,
  Row,
  Col,
  Tooltip,
  Select,
} from 'antd';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  ShieldCheck,
  Users,
  Search,
  Lock,
  Layers,
} from 'lucide-react';
import { ROLE } from '../../../constants/roleConstants';

const { Title, Text } = Typography;

export interface SystemRoleItem {
  id: string;
  name: string;
  code: string;
  description: string;
  userCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  isSystem: boolean;
  createdAt: string;
}

const STORAGE_KEY = 'velica_system_roles_data';

const DEFAULT_ROLES: SystemRoleItem[] = [
  {
    id: 'r-admin',
    name: 'Quản trị viên (Admin)',
    code: ROLE.ADMIN,
    description: 'Toàn quyền cấu hình tham số hệ thống, quản lý tài khoản người dùng, vận hành và kiểm toán dữ liệu.',
    userCount: 4,
    status: 'ACTIVE',
    isSystem: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'r-teacher',
    name: 'Giảng viên (Teacher)',
    code: ROLE.TEACHER,
    description: 'Quản lý học phần, ngân hàng câu hỏi, biên soạn đề thi, tổ chức đánh giá, chấm điểm và xử lý phúc khảo.',
    userCount: 86,
    status: 'ACTIVE',
    isSystem: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'r-student',
    name: 'Sinh viên (Student)',
    code: ROLE.STUDENT,
    description: 'Tham gia lớp học phần, làm bài kiểm tra trực tuyến, theo dõi bảng điểm minh bạch và nộp đơn phúc khảo.',
    userCount: 1150,
    status: 'ACTIVE',
    isSystem: true,
    createdAt: '2026-01-01',
  },
  {
    id: 'r-ta',
    name: 'Trợ giảng (Teaching Assistant)',
    code: 'TA',
    description: 'Hỗ trợ giảng viên điểm danh sinh viên, quản trị tài liệu học phần và hỗ trợ giải đáp thắc mắc chuyên môn.',
    userCount: 18,
    status: 'ACTIVE',
    isSystem: false,
    createdAt: '2026-02-15',
  },
  {
    id: 'r-examiner',
    name: 'Khảo thí & Thanh tra (Examiner)',
    code: 'EXAMINER',
    description: 'Giám sát kỷ luật phòng thi, bảo đảm tính toàn vẹn đề thi, đối soát nhật ký sửa điểm và phúc khảo toàn trường.',
    userCount: 6,
    status: 'ACTIVE',
    isSystem: false,
    createdAt: '2026-03-01',
  },
];

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<SystemRoleItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    return DEFAULT_ROLES;
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'SYSTEM' | 'CUSTOM'>('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemRoleItem | null>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
    } catch {
      // ignore storage error
    }
  }, [roles]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'ACTIVE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (role: SystemRoleItem) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      code: role.code,
      description: role.description,
      status: role.status,
    });
    setIsModalOpen(true);
  };

  const handleDeleteRole = (role: SystemRoleItem) => {
    if (role.isSystem) {
      message.error('Vai trò cốt lõi của hệ thống không thể xóa!');
      return;
    }
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    message.success(`Đã xóa vai trò "${role.name}" thành công!`);
  };

  const handleToggleStatus = (role: SystemRoleItem) => {
    const newStatus = role.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setRoles((prev) =>
      prev.map((r) => (r.id === role.id ? { ...r, status: newStatus } : r))
    );
    message.success(
      `Đã chuyển trạng thái vai trò "${role.name}" sang ${
        newStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'
      }`
    );
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      const trimmedName = values.name.trim();
      const trimmedCode = values.code.trim().toUpperCase();

      if (!trimmedName) {
        message.error('Vui lòng nhập tên vai trò!');
        return;
      }
      if (!trimmedCode) {
        message.error('Vui lòng nhập mã vai trò!');
        return;
      }

      // Check duplicate name
      const duplicateName = roles.find(
        (r) => r.name.toLowerCase() === trimmedName.toLowerCase() && r.id !== editingRole?.id
      );
      if (duplicateName) {
        message.error(`Tên vai trò "${trimmedName}" đã tồn tại trên hệ thống!`);
        return;
      }

      // Check duplicate code
      const duplicateCode = roles.find(
        (r) => r.code.toUpperCase() === trimmedCode && r.id !== editingRole?.id
      );
      if (duplicateCode) {
        message.error(`Mã vai trò "${trimmedCode}" đã được sử dụng!`);
        return;
      }

      if (editingRole) {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === editingRole.id
              ? {
                  ...r,
                  name: trimmedName,
                  code: r.isSystem ? r.code : trimmedCode,
                  description: values.description?.trim() || '',
                  status: values.status || 'ACTIVE',
                }
              : r
          )
        );
        message.success('Cập nhật thông tin vai trò thành công!');
      } else {
        const newRole: SystemRoleItem = {
          id: `role-${Date.now()}`,
          name: trimmedName,
          code: trimmedCode,
          description: values.description?.trim() || '',
          userCount: 0,
          status: values.status || 'ACTIVE',
          isSystem: false,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setRoles((prev) => [...prev, newRole]);
        message.success(`Tạo mới vai trò "${trimmedName}" thành công!`);
      }

      setIsModalOpen(false);
    } catch {
      // validation error
    }
  };

  // Filtered Roles
  const filteredRoles = roles.filter((role) => {
    const matchSearch =
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      role.code.toLowerCase().includes(search.toLowerCase()) ||
      role.description.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || role.status === statusFilter;

    const matchType =
      typeFilter === 'ALL' ||
      (typeFilter === 'SYSTEM' && role.isSystem) ||
      (typeFilter === 'CUSTOM' && !role.isSystem);

    return matchSearch && matchStatus && matchType;
  });

  // Metrics
  const totalRoles = roles.length;
  const systemRolesCount = roles.filter((r) => r.isSystem).length;
  const customRolesCount = roles.filter((r) => !r.isSystem).length;
  const totalUsersAssigned = roles.reduce((sum, r) => sum + r.userCount, 0);

  const columns = [
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: SystemRoleItem) => (
        <div>
          <div className="d-flex items-center gap-2">
            <span className="font-semibold text-base text-brand-color">{name}</span>
            {record.isSystem ? (
              <Tag color="cyan" className="velica-tag-pill font-medium" icon={<Lock size={11} className="inline me-0.5" />}>
                Mặc định hệ thống
              </Tag>
            ) : (
              <Tag color="purple" className="velica-tag-pill font-medium">
                Tùy chỉnh
              </Tag>
            )}
          </div>
          <div className="text-secondary-color text-xs mt-1 leading-normal max-w-xl">
            {record.description}
          </div>
        </div>
      ),
    },
    {
      title: 'Mã định danh (Code)',
      dataIndex: 'code',
      key: 'code',
      width: 160,
      render: (code: string) => (
        <Tag color="blue" className="font-mono font-semibold px-2.5 py-1 text-xs">
          {code}
        </Tag>
      ),
    },
    {
      title: 'Số người dùng',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 150,
      render: (count: number) => (
        <Tag color="geekblue" className="velica-tag-pill font-medium" icon={<Users size={12} className="inline me-1" />}>
          {count.toLocaleString()} tài khoản
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: 'ACTIVE' | 'INACTIVE', record: SystemRoleItem) => (
        <Tooltip title={record.isSystem ? 'Vai trò hệ thống luôn duy trì trạng thái hoạt động' : 'Bấm để đổi trạng thái'}>
          <Tag
            color={status === 'ACTIVE' ? 'success' : 'default'}
            className={`velica-tag-pill font-medium ${!record.isSystem ? 'cursor-pointer select-none' : ''}`}
            onClick={() => {
              if (!record.isSystem) {
                handleToggleStatus(record);
              }
            }}
          >
            {status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: 'Ngày khởi tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date: string) => <span className="font-mono text-xs text-muted-color">{date}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_: unknown, record: SystemRoleItem) => (
        <Space size={4}>
          <Tooltip title="Chỉnh sửa vai trò">
            <Button
              type="text"
              size="small"
              icon={<Edit size={16} className="text-brand-color" />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>

          {record.isSystem ? (
            <Tooltip title="Vai trò hệ thống mặc định không thể xóa">
              <Button
                type="text"
                size="small"
                disabled
                icon={<Trash2 size={16} className="text-muted-color opacity-30" />}
              />
            </Tooltip>
          ) : (
            <Popconfirm
              title="Xác nhận xóa vai trò"
              description={
                record.userCount > 0
                  ? `Vai trò "${record.name}" đang có ${record.userCount} tài khoản áp dụng. Bạn có chắc chắn muốn xóa không?`
                  : `Bạn có chắc chắn muốn xóa vai trò "${record.name}" khỏi hệ thống không?`
              }
              onConfirm={() => handleDeleteRole(record)}
              okText="Xóa vai trò"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa vai trò tùy chỉnh">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={16} />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in pb-5">
      {/* Page Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title d-flex items-center gap-2">
            <ShieldCheck size={22} className="text-brand-color" />
            Quản Lý Danh Mục Vai Trò (Role Management)
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Quản lý tập trung các vai trò người dùng trong hệ sinh thái Velica. Hỗ trợ thêm, sửa, xóa và theo dõi phân bổ tài khoản.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
          className="velica-btn-primary"
        >
          Tạo vai trò mới
        </Button>
      </div>

      {/* Metrics Row */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={12} sm={6}>
          <Card size="small" className="velica-stat-card">
            <div className="text-secondary-color text-xs font-medium">Tổng số vai trò</div>
            <div className="text-2xl font-bold text-brand-color mt-1">{totalRoles}</div>
            <div className="text-xs text-muted-color mt-1">Đang cấu hình trong hệ thống</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="velica-stat-card">
            <div className="text-secondary-color text-xs font-medium">Vai trò hệ thống</div>
            <div className="text-2xl font-bold text-cyan mt-1">{systemRolesCount}</div>
            <div className="text-xs text-muted-color mt-1">Cốt lõi không thể xóa</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="velica-stat-card">
            <div className="text-secondary-color text-xs font-medium">Vai trò tùy chỉnh</div>
            <div className="text-2xl font-bold text-purple mt-1">{customRolesCount}</div>
            <div className="text-xs text-muted-color mt-1">Mở rộng theo nhu cầu đào tạo</div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" className="velica-stat-card">
            <div className="text-secondary-color text-xs font-medium">Tổng tài khoản phân bổ</div>
            <div className="text-2xl font-bold text-success mt-1">{totalUsersAssigned.toLocaleString()}</div>
            <div className="text-xs text-muted-color mt-1">Người dùng đang hoạt động</div>
          </Card>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card size="small" className="mb-3 velica-admin-card">
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={12} lg={10}>
            <Input
              prefix={<Search size={16} className="text-muted-color me-1" />}
              placeholder="Tìm kiếm theo tên vai trò, mã định danh hoặc mô tả..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              className="velica-form-input"
            />
          </Col>
          <Col xs={12} sm={6} md={6} lg={4}>
            <Select
              className="w-100"
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { label: 'Tất cả trạng thái', value: 'ALL' },
                { label: 'Đang hoạt động', value: 'ACTIVE' },
                { label: 'Tạm ngừng', value: 'INACTIVE' },
              ]}
            />
          </Col>
          <Col xs={12} sm={6} md={6} lg={4}>
            <Select
              className="w-100"
              value={typeFilter}
              onChange={(val) => setTypeFilter(val)}
              options={[
                { label: 'Tất cả loại vai trò', value: 'ALL' },
                { label: 'Vai trò hệ thống', value: 'SYSTEM' },
                { label: 'Vai trò tùy chỉnh', value: 'CUSTOM' },
              ]}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={6} className="text-end">
            <Text type="secondary" className="text-xs">
              Hiển thị <strong>{filteredRoles.length}</strong> / {roles.length} vai trò
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Roles Table */}
      <div className="velica-card-table">
        <Table
          dataSource={filteredRoles}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Shield size={18} className="text-brand-color" />
            <span>{editingRole ? 'Chỉnh sửa thông tin vai trò' : 'Tạo mới vai trò người dùng'}</span>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} className="velica-btn-action">
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleFormSubmit} className="velica-btn-primary">
            {editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
          </Button>,
        ]}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" className="mt-3">
          <Form.Item
            name="name"
            label="Tên vai trò"
            rules={[{ required: true, message: 'Vui lòng nhập tên vai trò!' }]}
          >
            <Input
              placeholder="Vd: Cố vấn học tập (Academic Advisor)"
              className="velica-form-input"
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Mã vai trò (Role Code)"
            rules={[
              { required: true, message: 'Vui lòng nhập mã vai trò!' },
              {
                pattern: /^[A-Z0-9_]+$/,
                message: 'Mã vai trò chỉ gồm chữ in hoa, số và dấu gạch dưới (Vd: ADVISOR, TA_LEAD)',
              },
            ]}
            extra={
              editingRole?.isSystem ? (
                <span className="text-xs text-muted-color">
                  Mã vai trò hệ thống mặc định được cố định để bảo toàn logic phần mềm.
                </span>
              ) : (
                <span className="text-xs text-muted-color">
                  Mã vai trò nên viết HOA, không dấu (Vd: EXAMINER, TUTOR, AUDITOR).
                </span>
              )
            }
          >
            <Input
              placeholder="Vd: ADVISOR"
              disabled={editingRole?.isSystem}
              onChange={(e) => {
                form.setFieldsValue({ code: e.target.value.toUpperCase() });
              }}
              className="velica-form-input font-mono uppercase"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chức năng & phạm vi nhiệm vụ"
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả tóm tắt mục đích và nhiệm vụ của vai trò này trong nhà trường..."
              className="velica-form-input"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái hoạt động"
            initialValue="ACTIVE"
          >
            <Radio.Group>
              <Radio value="ACTIVE">
                <span className="text-success font-medium">Đang hoạt động (Active)</span>
              </Radio>
              <Radio value="INACTIVE" disabled={editingRole?.isSystem}>
                <span className="text-secondary-color">Tạm ngừng (Inactive)</span>
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

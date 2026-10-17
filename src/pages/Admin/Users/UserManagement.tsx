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
  Tag,
  Popconfirm,
  message,
  Modal,
} from 'antd';
import { Plus, Edit, Trash2, Lock, Unlock, KeyRound } from 'lucide-react';
import { mockService } from '../../../api/mocks/mockService';
import { User } from '../../../interfaces/velica.interfaces';
import { ROLE, UserRole, ROLE_LABELS } from '../../../constants/roleConstants';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: ROLE.STUDENT, isActive: true });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      phoneNumber: user.phoneNumber,
      isActive: user.isActive,
    });
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Check fullName
      const trimmedName = values.fullName?.trim();
      if (!trimmedName) {
        message.error('Họ và tên người dùng không được để trống!');
        return;
      }

      // Check username format
      const trimmedUsername = values.username?.trim();
      if (!trimmedUsername || !/^[a-zA-Z0-9_.-]{3,30}$/.test(trimmedUsername)) {
        message.error('Tên đăng nhập phải từ 3 đến 30 ký tự, chỉ chứa chữ cái, số, gạch dưới, gạch ngang hoặc dấu chấm!');
        return;
      }

      const trimmedEmail = values.email?.trim().toLowerCase();

      // Check email uniqueness
      const duplicateEmail = users.find(
        (u) => u.email.toLowerCase() === trimmedEmail && u.id !== editingUser?.id
      );
      if (duplicateEmail) {
        message.error(`Email "${trimmedEmail}" đã tồn tại trên hệ thống! Vui lòng chọn email khác.`);
        return;
      }

      // Check username uniqueness
      const duplicateUsername = users.find(
        (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase() && u.id !== editingUser?.id
      );
      if (duplicateUsername) {
        message.error(`Tên đăng nhập "${trimmedUsername}" đã tồn tại! Vui lòng chọn tên khác.`);
        return;
      }

      // Check phone number if provided
      if (values.phoneNumber && values.phoneNumber.trim()) {
        const phone = values.phoneNumber.trim();
        if (!/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(phone)) {
          message.error('Số điện thoại liên lạc không hợp lệ theo định dạng viễn thông Việt Nam!');
          return;
        }
      }

      const payload = {
        ...values,
        fullName: trimmedName,
        username: trimmedUsername,
        email: trimmedEmail,
        department: values.department?.trim(),
        phoneNumber: values.phoneNumber?.trim(),
      };

      if (editingUser) {
        await mockService.updateUser(editingUser.id, payload);
        message.success('Cập nhật tài khoản người dùng thành công!');
      } else {
        await mockService.createUser({
          ...payload,
          isActive: true,
        });
        message.success('Tạo tài khoản mới thành công!');
      }
      setIsDrawerOpen(false);
      loadData();
    } catch {
      // form error
    }
  };

  const handleToggleLock = async (user: User) => {
    await mockService.updateUser(user.id, { isActive: !user.isActive });
    message.success(
      user.isActive
        ? `Đã khóa tài khoản của ${user.fullName}.`
        : `Đã mở khóa tài khoản cho ${user.fullName}.`
    );
    loadData();
  };

  // UC-ADM-05: Reset User Password
  const handleResetPassword = (user: User) => {
    Modal.confirm({
      title: `Cấp lại mật khẩu cho ${user.fullName}?`,
      content: `Mật khẩu tạm thời sẽ được đặt là "Velica@2026". Người dùng sẽ được yêu cầu đổi mật khẩu ở lần đăng nhập tiếp theo.`,
      okText: 'Đặt lại mật khẩu',
      cancelText: 'Hủy',
      onOk: () => {
        message.success(`Đã cấp lại mật khẩu mặc định (Velica@2026) cho ${user.fullName}.`);
      },
    });
  };

  const handleDelete = async (id: string) => {
    await mockService.deleteUser(id);
    message.success('Đã xóa tài khoản khỏi hệ thống.');
    loadData();
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const columns = [
    {
      title: 'Họ và tên & Tên đăng nhập',
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
      render: (name: string, record: User) => (
        <div className="overflow-hidden">
          <Text strong className="velica-cell-title text-truncate d-block" title={name}>{name}</Text>
          <Text type="secondary" className="velica-cell-desc text-truncate d-block">
            @{record.username} | {record.department || 'Chưa gán'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      ellipsis: true,
      render: (email: string) => <span className="velica-cell-desc text-truncate d-block" title={email}>{email}</span>,
    },
    {
      title: 'Vai trò phân quyền',
      dataIndex: 'role',
      key: 'role',
      width: 160,
      render: (role: UserRole) => {
        const colors = {
          [ROLE.ADMIN]: 'volcano',
          [ROLE.TEACHER]: 'geekblue',
          [ROLE.STUDENT]: 'green',
        };
        return <Tag color={colors[role]} className="velica-tag-pill">{ROLE_LABELS[role]}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 140,
      render: (active: boolean) =>
        active ? <Tag color="success" className="velica-tag-pill">Đang hoạt động</Tag> : <Tag color="error" className="velica-tag-pill">Đã khóa</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (_: unknown, record: User) => (
        <Space size="middle">
          <Button
            type="text"
            icon={record.isActive ? <Lock size={15} className="text-warning-color" /> : <Unlock size={15} className="text-success-color" />}
            onClick={() => handleToggleLock(record)}
          >
            {record.isActive ? 'Khóa' : 'Mở'}
          </Button>
          <Button
            type="text"
            icon={<KeyRound size={15} className="text-muted-color" />}
            onClick={() => handleResetPassword(record)}
            title="Cấp lại mật khẩu"
          />
          <Button
            type="text"
            icon={<Edit size={16} className="text-brand-color" />}
            onClick={() => handleOpenEdit(record)}
          />
          <Popconfirm
            title="Xác nhận xóa tài khoản người dùng này?"
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
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title">
            Quản trị Người dùng Hệ thống
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Quản lý danh sách tài khoản giảng viên, sinh viên và quản trị viên trong toàn trường.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
          className="velica-btn-primary"
        >
          Tạo tài khoản mới
        </Button>
      </div>

      <FilterBar
        placeholder="Tìm kiếm theo họ tên, email hoặc username..."
        onSearchChange={setSearch}
        onClearFilters={() => setRoleFilter(undefined)}
        hasActiveFilters={Boolean(roleFilter)}
      >
        <Select
          allowClear
          placeholder="Lọc theo Vai trò"
          className="w-180"
          value={roleFilter}
          onChange={setRoleFilter}
        >
          <Select.Option value={ROLE.ADMIN}>Administrator</Select.Option>
          <Select.Option value={ROLE.TEACHER}>Giảng viên</Select.Option>
          <Select.Option value={ROLE.STUDENT}>Sinh viên</Select.Option>
        </Select>
      </FilterBar>

      <div className="velica-card-table">
        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
          tableLayout="fixed"
        />
      </div>

      {/* Create / Edit User Drawer */}
      <Drawer
        title={editingUser ? 'Chỉnh sửa tài khoản người dùng' : 'Tạo tài khoản người dùng mới'}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={500}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerOpen(false)} className="velica-btn-action">
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Nhập họ và tên' }]}
          >
            <Input placeholder="Vd: Nguyễn Văn A" className="velica-form-input" />
          </Form.Item>

          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Nhập username' }]}
          >
            <Input placeholder="Vd: gv_nguyen" className="velica-form-input" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email trường"
            rules={[
              { required: true, message: 'Nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Vd: an.nguyen@velica.edu.vn" className="velica-form-input" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true }]}
          >
            <Select className="velica-form-input">
              <Select.Option value={ROLE.ADMIN}>Administrator</Select.Option>
              <Select.Option value={ROLE.TEACHER}>Giảng viên</Select.Option>
              <Select.Option value={ROLE.STUDENT}>Sinh viên</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="department" label="Đơn vị / Khoa / Lớp">
            <Input placeholder="Vd: Khoa Công Nghệ Phần Mềm" className="velica-form-input" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Số điện thoại liên lạc">
            <Input placeholder="Vd: 0912345678" className="velica-form-input" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

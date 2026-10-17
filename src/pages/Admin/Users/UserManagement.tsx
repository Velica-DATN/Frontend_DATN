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
  Tooltip,
  Badge,
  Radio,
  Alert,
} from 'antd';
import {
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  UserPlus,
  Info,
  GraduationCap,
} from 'lucide-react';
import { mockService } from '../../../api/mocks/mockService';
import { User, AccountStatus } from '../../../interfaces/velica.interfaces';
import { ROLE, UserRole, ROLE_LABELS } from '../../../constants/roleConstants';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const COMMON_REJECT_REASONS = [
  'Thông tin họ tên hoặc thông tin đăng ký không khớp với hồ sơ tuyển sinh.',
  'Email không đúng định dạng email sinh viên chính thức của trường.',
  'Hồ sơ trùng lặp thông tin, nghi vấn tài khoản không hợp lệ.',
  'Vui lòng liên hệ Văn phòng Đào tạo (P.A102) để xác minh danh tính.',
];

const COMMON_SUSPEND_REASONS = [
  'Tạm khóa do vi phạm quy chế phòng thi trực tuyến trong học kỳ.',
  'Tạm khóa phục vụ công tác thanh tra học vụ theo yêu cầu của Phòng Đào tạo.',
  'Phát hiện dấu hiệu đăng nhập bất thường hoặc nghi ngờ bị chiếm đoạt tài khoản.',
];

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus>('ALL');

  // Drawer for standard User Create/Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  // Modal for Teacher Creation (Admin exclusively creates Teachers)
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [teacherForm] = Form.useForm();
  const [teacherSubmitting, setTeacherSubmitting] = useState(false);

  // Modal for Rejecting Student Account
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<User | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Modal for Suspending Account
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);
  const [suspendReasonText, setSuspendReasonText] = useState('');
  const [suspending, setSuspending] = useState(false);

  // Modal to View Status Reason (Rejection / Suspension)
  const [viewReasonModalOpen, setViewReasonModalOpen] = useState(false);
  const [selectedUserForReason, setSelectedUserForReason] = useState<User | null>(null);

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Counts for status tabs
  const pendingCount = users.filter((u) => u.approvalStatus === 'PENDING').length;
  const approvedCount = users.filter((u) => (u.approvalStatus || 'APPROVED') === 'APPROVED').length;
  const rejectedCount = users.filter((u) => u.approvalStatus === 'REJECTED').length;
  const suspendedCount = users.filter((u) => u.approvalStatus === 'SUSPENDED').length;

  // Standard Create
  const handleOpenCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldsValue({ role: ROLE.STUDENT, isActive: true, approvalStatus: 'APPROVED' });
    setIsDrawerOpen(true);
  };

  // Open dedicated Teacher creation
  const handleOpenCreateTeacher = () => {
    teacherForm.resetFields();
    teacherForm.setFieldsValue({
      department: 'Khoa Công Nghệ Phần Mềm',
      academicTitle: 'Tiến sĩ',
    });
    setIsTeacherModalOpen(true);
  };

  const handleCreateTeacherSubmit = async () => {
    try {
      const values = await teacherForm.validateFields();
      const trimmedEmail = values.email?.trim().toLowerCase();

      if (mockService.checkEmailExists(trimmedEmail)) {
        message.error(`Email "${trimmedEmail}" đã tồn tại trên hệ thống! Vui lòng chọn email khác.`);
        return;
      }

      setTeacherSubmitting(true);
      await mockService.createTeacher({
        fullName: values.fullName.trim(),
        email: trimmedEmail,
        department: values.department?.trim(),
        academicTitle: values.academicTitle,
        phoneNumber: values.phoneNumber?.trim(),
      });
      setTeacherSubmitting(false);
      setIsTeacherModalOpen(false);
      message.success(`Đã tạo thành công tài khoản Giảng viên cho "${values.fullName}"!`);
      loadData();
    } catch {
      // form error
      setTeacherSubmitting(false);
    }
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
      approvalStatus: user.approvalStatus || 'APPROVED',
      rejectionReason: user.rejectionReason,
    });
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();

      const trimmedName = values.fullName?.trim();
      if (!trimmedName) {
        message.error('Họ và tên người dùng không được để trống!');
        return;
      }

      const trimmedUsername = values.username?.trim();
      if (!trimmedUsername || !/^[a-zA-Z0-9_.-]{3,30}$/.test(trimmedUsername)) {
        message.error('Tên đăng nhập phải từ 3 đến 30 ký tự, chỉ chứa chữ cái, số, gạch dưới, gạch ngang hoặc dấu chấm!');
        return;
      }

      const trimmedEmail = values.email?.trim().toLowerCase();

      // Check email uniqueness
      if (mockService.checkEmailExists(trimmedEmail, editingUser?.id)) {
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
        approvalStatus: values.approvalStatus || 'APPROVED',
      };

      if (editingUser) {
        await mockService.updateUser(editingUser.id, payload);
        message.success('Cập nhật tài khoản người dùng thành công!');
      } else {
        await mockService.createUser({
          ...payload,
          isActive: true,
          approvalStatus: 'APPROVED',
          isEmailVerified: true,
        });
        message.success('Tạo tài khoản mới thành công!');
      }
      setIsDrawerOpen(false);
      loadData();
    } catch {
      // form error
    }
  };

  // Quick Approve PENDING User
  const handleApprove = async (user: User) => {
    await mockService.approveUser(user.id);
    message.success(`Đã phê duyệt tài khoản sinh viên: ${user.fullName}!`);
    loadData();
  };

  // Open Reject Modal
  const handleOpenRejectModal = (user: User) => {
    setUserToReject(user);
    setRejectionReasonText('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!userToReject) return;
    if (!rejectionReasonText.trim()) {
      message.error('Vui lòng nhập lý do từ chối để sinh viên biết cách khắc phục!');
      return;
    }

    setRejecting(true);
    await mockService.rejectUser(userToReject.id, rejectionReasonText.trim());
    setRejecting(false);
    setRejectModalOpen(false);
    message.success(`Đã từ chối duyệt tài khoản cho ${userToReject.fullName} với lý do cụ thể.`);
    loadData();
  };

  // Open Suspend Modal
  const handleOpenSuspendModal = (user: User) => {
    setUserToSuspend(user);
    setSuspendReasonText('');
    setSuspendModalOpen(true);
  };

  const handleConfirmSuspend = async () => {
    if (!userToSuspend) return;
    if (!suspendReasonText.trim()) {
      message.error('Vui lòng nhập lý do tạm khóa tài khoản!');
      return;
    }

    setSuspending(true);
    await mockService.suspendUser(userToSuspend.id, suspendReasonText.trim());
    setSuspending(false);
    setSuspendModalOpen(false);
    message.success(`Đã tạm khóa tài khoản của ${userToSuspend.fullName}.`);
    loadData();
  };

  // View Reason
  const handleViewReason = (user: User) => {
    setSelectedUserForReason(user);
    setViewReasonModalOpen(true);
  };

  // Reset User Password
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

    const userStatus: AccountStatus = u.approvalStatus || 'APPROVED';
    const matchesStatus = statusFilter === 'ALL' ? true : userStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 55,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-xs text-secondary-color">#{idx + 1}</span>
      ),
    },
    {
      title: 'Họ và tên & Thông tin',
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
      render: (name: string, record: User) => (
        <div className="overflow-hidden">
          <div className="d-flex items-center gap-1.5">
            <Text strong className="velica-cell-title text-truncate" title={name}>
              {name}
            </Text>
            {record.academicTitle && (
              <span className="text-2xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {record.academicTitle}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 text-truncate">
            <span>@{record.username}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Email trường',
      dataIndex: 'email',
      key: 'email',
      width: 210,
      ellipsis: true,
      render: (email: string, record: User) => (
        <div>
          <span className="velica-cell-desc text-truncate d-block font-mono text-xs" title={email}>
            {email}
          </span>
          <span className="text-2xs text-teal-600">
            {record.isEmailVerified ? '✓ Đã xác minh email' : 'Chưa xác minh'}
          </span>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: UserRole) => {
        const colors = {
          [ROLE.ADMIN]: 'volcano',
          [ROLE.TEACHER]: 'geekblue',
          [ROLE.STUDENT]: 'cyan',
        };
        return (
          <Tag color={colors[role]} className="velica-tag-pill font-medium">
            {ROLE_LABELS[role]}
          </Tag>
        );
      },
    },
    {
      title: 'Trạng thái tài khoản',
      key: 'approvalStatus',
      width: 170,
      render: (_: unknown, record: User) => {
        const status = record.approvalStatus || 'APPROVED';
        if (status === 'PENDING') {
          return (
            <Tag color="gold" className="velica-tag-pill d-inline-flex items-center gap-1">
              <Clock size={12} />
              <span>Chờ duyệt (PENDING)</span>
            </Tag>
          );
        }
        if (status === 'REJECTED') {
          return (
            <Tooltip title="Nhấp để xem lý do từ chối">
              <Tag
                color="error"
                className="velica-tag-pill d-inline-flex items-center gap-1 cursor-pointer"
                onClick={() => handleViewReason(record)}
              >
                <XCircle size={12} />
                <span>Bị từ chối (REJECTED)</span>
              </Tag>
            </Tooltip>
          );
        }
        if (status === 'SUSPENDED') {
          return (
            <Tooltip title="Nhấp để xem lý do tạm khóa">
              <Tag
                color="purple"
                className="velica-tag-pill d-inline-flex items-center gap-1 cursor-pointer"
                onClick={() => handleViewReason(record)}
              >
                <AlertTriangle size={12} />
                <span>Tạm khóa (SUSPENDED)</span>
              </Tag>
            </Tooltip>
          );
        }
        return (
          <Tag color="success" className="velica-tag-pill d-inline-flex items-center gap-1">
            <CheckCircle2 size={12} />
            <span>Đã duyệt (APPROVED)</span>
          </Tag>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 190,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, record: User) => {
        const status = record.approvalStatus || 'APPROVED';

        // PENDING accounts: Prioritize Approve / Reject
        if (status === 'PENDING') {
          return (
            <Space size={4}>
              <Tooltip title="Duyệt tài khoản sinh viên">
                <Button
                  type="primary"
                  size="small"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-2"
                  icon={<UserCheck size={14} />}
                  onClick={() => handleApprove(record)}
                >
                  Duyệt
                </Button>
              </Tooltip>
              <Tooltip title="Từ chối duyệt với lý do">
                <Button
                  danger
                  size="small"
                  className="font-medium text-xs px-2"
                  icon={<XCircle size={14} />}
                  onClick={() => handleOpenRejectModal(record)}
                >
                  Từ chối
                </Button>
              </Tooltip>
            </Space>
          );
        }

        // REJECTED or SUSPENDED accounts: Allow re-approve
        if (status === 'REJECTED' || status === 'SUSPENDED') {
          return (
            <Space size={4}>
              <Tooltip title="Xem lý do & xét duyệt lại">
                <Button
                  type="text"
                  className="btn-action-icon text-teal-700"
                  icon={<Info size={16} />}
                  onClick={() => handleViewReason(record)}
                  aria-label="Xem lý do"
                />
              </Tooltip>
              <Tooltip title="Duyệt lại tài khoản này">
                <Button
                  type="text"
                  className="btn-action-icon text-success-color"
                  icon={<UserCheck size={16} />}
                  onClick={() => handleApprove(record)}
                  aria-label="Duyệt lại"
                />
              </Tooltip>
              <Tooltip title="Chỉnh sửa tài khoản">
                <Button
                  type="text"
                  className="btn-action-icon"
                  icon={<Edit size={16} className="text-brand-color" />}
                  onClick={() => handleOpenEdit(record)}
                  aria-label="Chỉnh sửa"
                />
              </Tooltip>
              <Popconfirm
                title="Xác nhận xóa tài khoản người dùng này?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Xóa tài khoản">
                  <Button type="text" danger className="btn-action-icon" icon={<Trash2 size={16} />} aria-label="Xóa" />
                </Tooltip>
              </Popconfirm>
            </Space>
          );
        }

        // APPROVED accounts: Standard operations
        return (
          <Space size={4}>
            <Tooltip title="Tạm khóa tài khoản">
              <Button
                type="text"
                className="btn-action-icon"
                icon={<Lock size={15} className="text-warning-color" />}
                onClick={() => handleOpenSuspendModal(record)}
                aria-label="Tạm khóa"
              />
            </Tooltip>
            <Tooltip title="Cấp lại mật khẩu">
              <Button
                type="text"
                className="btn-action-icon"
                icon={<KeyRound size={15} className="text-muted-color" />}
                onClick={() => handleResetPassword(record)}
                aria-label="Cấp lại mật khẩu"
              />
            </Tooltip>
            <Tooltip title="Chỉnh sửa tài khoản">
              <Button
                type="text"
                className="btn-action-icon"
                icon={<Edit size={16} className="text-brand-color" />}
                onClick={() => handleOpenEdit(record)}
                aria-label="Chỉnh sửa"
              />
            </Tooltip>
            <Popconfirm
              title="Xác nhận xóa tài khoản người dùng này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa tài khoản">
                <Button type="text" danger className="btn-action-icon" icon={<Trash2 size={16} />} aria-label="Xóa" />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title">
            Quản trị Tài khoản & Phê duyệt Người dùng
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Phê duyệt đăng ký sinh viên mới, khởi tạo tài khoản giảng viên chính thức và kiểm soát trạng thái hoạt động trên toàn trường.
          </Text>
        </div>
        <Space size={8}>
          <Button
            type="primary"
            icon={<GraduationCap size={16} />}
            onClick={handleOpenCreateTeacher}
            className="bg-teal-700 hover:bg-teal-800 text-white font-medium"
          >
            Tạo Giảng viên
          </Button>
          <Button
            icon={<Plus size={16} />}
            onClick={handleOpenCreate}
            className="velica-btn-action"
          >
            Thêm người dùng khác
          </Button>
        </Space>
      </div>

      {/* Status Segmented Filter Bar */}
      <div className="mb-3.5 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
        <div className="d-flex items-center justify-between flex-wrap gap-2">
          <div className="d-flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 me-2">Bộ lọc phê duyệt:</span>
            <Radio.Group
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              buttonStyle="solid"
              size="middle"
            >
              <Radio.Button value="ALL">
                Tất cả ({users.length})
              </Radio.Button>
              <Radio.Button value="PENDING">
                <Badge count={pendingCount} offset={[8, -2]} size="small">
                  <span className="pe-1">Chờ duyệt (PENDING)</span>
                </Badge>
              </Radio.Button>
              <Radio.Button value="APPROVED">
                Đã duyệt ({approvedCount})
              </Radio.Button>
              <Radio.Button value="REJECTED">
                Bị từ chối ({rejectedCount})
              </Radio.Button>
              <Radio.Button value="SUSPENDED">
                Tạm khóa ({suspendedCount})
              </Radio.Button>
            </Radio.Group>
          </div>

          {pendingCount > 0 && statusFilter !== 'PENDING' && (
            <Button
              type="link"
              size="small"
              className="text-amber-700 font-semibold text-xs p-0"
              onClick={() => setStatusFilter('PENDING')}
            >
              ⚡ Có {pendingCount} sinh viên đang chờ duyệt tài khoản
            </Button>
          )}
        </div>
      </div>

      <FilterBar
        placeholder="Tìm kiếm theo họ tên hoặc email trường..."
        onSearchChange={setSearch}
        onClearFilters={() => {
          setRoleFilter(undefined);
          setStatusFilter('ALL');
        }}
        hasActiveFilters={Boolean(roleFilter || statusFilter !== 'ALL')}
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

      <div className="velica-table-container">
        <Table
          dataSource={filteredUsers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ['8', '15', '25', '50'],
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} tài khoản`,
          }}
          scroll={{ x: 980 }}
        />
      </div>

      {/* Modal: Admin creates Teacher Account */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <GraduationCap className="text-teal-700" size={20} />
            <span className="font-bold text-slate-800">Cấp Tài khoản Giảng viên Mới</span>
          </div>
        }
        open={isTeacherModalOpen}
        onCancel={() => setIsTeacherModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsTeacherModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={teacherSubmitting}
            onClick={handleCreateTeacherSubmit}
            className="bg-teal-700 hover:bg-teal-800 text-white font-medium"
          >
            Khởi tạo & Kích hoạt
          </Button>,
        ]}
        width={560}
      >
        <Alert
          type="info"
          showIcon
          className="mb-4 text-xs"
          message="Quy định Quản trị Velica"
          description="Tài khoản Giảng viên do Quản trị viên trực tiếp khởi tạo và quản lý. Sau khi tạo, giảng viên có thể dùng email trường và mật khẩu mặc định (Velica@2026) để đăng nhập ngay."
        />

        <Form form={teacherForm} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ và tên Giảng viên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="Vd: TS. Nguyễn Văn An" className="velica-form-input" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email trường chính thức (@velica.edu.vn)"
            rules={[
              { required: true, message: 'Vui lòng nhập email trường' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Vd: an.nguyen@velica.edu.vn" className="velica-form-input" />
          </Form.Item>

          <div className="row g-2">
            <div className="col-sm-6">
              <Form.Item name="academicTitle" label="Học vị / Học hàm">
                <Select className="velica-form-input">
                  <Select.Option value="Cử nhân">Cử nhân</Select.Option>
                  <Select.Option value="Thạc sĩ">Thạc sĩ (ThS.)</Select.Option>
                  <Select.Option value="Tiến sĩ">Tiến sĩ (TS.)</Select.Option>
                  <Select.Option value="Phó Giáo sư">Phó Giáo sư (PGS.TS)</Select.Option>
                  <Select.Option value="Giáo sư">Giáo sư (GS.TS)</Select.Option>
                </Select>
              </Form.Item>
            </div>
            <div className="col-sm-6">
              <Form.Item name="phoneNumber" label="Số điện thoại liên lạc">
                <Input placeholder="Vd: 0912345678" className="velica-form-input" />
              </Form.Item>
            </div>
          </div>

          <Form.Item name="department" label="Khoa / Viện / Bộ môn trực thuộc">
            <Input placeholder="Vd: Khoa Công Nghệ Phần Mềm • Bộ môn KTPM" className="velica-form-input" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal: Reject Student Account with Required Reason */}
      <Modal
        title={
          <div className="d-flex items-center gap-2 text-rose-600">
            <XCircle size={20} />
            <span className="font-bold text-slate-800">Từ chối Phê duyệt Tài khoản Sinh viên</span>
          </div>
        }
        open={rejectModalOpen}
        onCancel={() => setRejectModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setRejectModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            danger
            loading={rejecting}
            onClick={handleConfirmReject}
          >
            Xác nhận Từ chối
          </Button>,
        ]}
        width={540}
      >
        {userToReject && (
          <div className="mb-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
            <div>
              <strong>Sinh viên:</strong> {userToReject.fullName}
            </div>
            <div>
              <strong>Email:</strong> {userToReject.email}
            </div>
          </div>
        )}

        <Paragraph className="text-xs text-slate-600 mb-2">
          Vui lòng nhập lý do từ chối cụ thể. Lý do này sẽ được hiển thị cho sinh viên khi họ cố gắng đăng nhập, giúp họ nắm rõ nguyên nhân và cách liên hệ khắc phục:
        </Paragraph>

        {/* Quick Reason Chips */}
        <div className="mb-2 d-flex flex-wrap gap-1">
          {COMMON_REJECT_REASONS.map((r, idx) => (
            <button
              key={idx}
              type="button"
              className="text-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors text-left"
              onClick={() => setRejectionReasonText(r)}
            >
              + {r}
            </button>
          ))}
        </div>

        <TextArea
          rows={4}
          value={rejectionReasonText}
          onChange={(e) => setRejectionReasonText(e.target.value)}
          placeholder="Nhập lý do từ chối chi tiết..."
          className="velica-form-input"
        />
      </Modal>

      {/* Modal: Suspend Account with Reason */}
      <Modal
        title={
          <div className="d-flex items-center gap-2 text-amber-600">
            <AlertTriangle size={20} />
            <span className="font-bold text-slate-800">Tạm khóa Tài khoản Người dùng</span>
          </div>
        }
        open={suspendModalOpen}
        onCancel={() => setSuspendModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setSuspendModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-amber-600 hover:bg-amber-700 text-white"
            loading={suspending}
            onClick={handleConfirmSuspend}
          >
            Xác nhận Khóa tài khoản
          </Button>,
        ]}
        width={540}
      >
        {userToSuspend && (
          <div className="mb-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs">
            <div>
              <strong>Người dùng:</strong> {userToSuspend.fullName} ({ROLE_LABELS[userToSuspend.role]})
            </div>
            <div>
              <strong>Email:</strong> {userToSuspend.email}
            </div>
          </div>
        )}

        <Paragraph className="text-xs text-slate-600 mb-2">
          Nhập lý do tạm khóa để thông báo tới người dùng và lưu vào nhật ký kiểm toán hệ thống:
        </Paragraph>

        <div className="mb-2 d-flex flex-wrap gap-1">
          {COMMON_SUSPEND_REASONS.map((r, idx) => (
            <button
              key={idx}
              type="button"
              className="text-2xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded transition-colors text-left"
              onClick={() => setSuspendReasonText(r)}
            >
              + {r}
            </button>
          ))}
        </div>

        <TextArea
          rows={3}
          value={suspendReasonText}
          onChange={(e) => setSuspendReasonText(e.target.value)}
          placeholder="Nhập lý do tạm khóa..."
          className="velica-form-input"
        />
      </Modal>

      {/* Modal: View Rejection / Suspension Reason */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Info className="text-teal-700" size={20} />
            <span className="font-bold text-slate-800">Chi tiết Trạng thái Tài khoản</span>
          </div>
        }
        open={viewReasonModalOpen}
        onCancel={() => setViewReasonModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewReasonModalOpen(false)}>
            Đóng
          </Button>,
          selectedUserForReason && selectedUserForReason.approvalStatus !== 'APPROVED' && (
            <Button
              key="reapprove"
              type="primary"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={async () => {
                if (selectedUserForReason) {
                  await handleApprove(selectedUserForReason);
                  setViewReasonModalOpen(false);
                }
              }}
            >
              Phê duyệt / Kích hoạt lại
            </Button>
          ),
        ]}
        width={500}
      >
        {selectedUserForReason && (
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <div className="mb-1">
                <strong>Họ và tên:</strong> {selectedUserForReason.fullName}
              </div>
              <div className="mb-1">
                <strong>Email:</strong> {selectedUserForReason.email}
              </div>
              <div className="mb-1">
                <strong>Vai trò:</strong> {ROLE_LABELS[selectedUserForReason.role]}
              </div>
              <div>
                <strong>Trạng thái:</strong>{' '}
                <Tag
                  color={
                    selectedUserForReason.approvalStatus === 'REJECTED'
                      ? 'error'
                      : selectedUserForReason.approvalStatus === 'SUSPENDED'
                      ? 'purple'
                      : 'gold'
                  }
                >
                  {selectedUserForReason.approvalStatus}
                </Tag>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded border border-amber-200">
              <div className="text-xs font-semibold text-amber-900 mb-1">
                Lý do từ chối / Tạm khóa đã thông báo:
              </div>
              <p className="text-xs text-amber-800 mb-0 font-medium leading-relaxed">
                {selectedUserForReason.rejectionReason || 'Chưa cập nhật lý do cụ thể.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Standard Create / Edit User Drawer */}
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

          <Form.Item
            name="approvalStatus"
            label="Trạng thái phê duyệt"
          >
            <Select className="velica-form-input">
              <Select.Option value="APPROVED">Đã duyệt (APPROVED)</Select.Option>
              <Select.Option value="PENDING">Chờ duyệt (PENDING)</Select.Option>
              <Select.Option value="REJECTED">Bị từ chối (REJECTED)</Select.Option>
              <Select.Option value="SUSPENDED">Tạm khóa (SUSPENDED)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="department" label="Khoa / Viện / Bộ môn">
            <Input placeholder="Vd: Khoa Công Nghệ Phần Mềm" className="velica-form-input" />
          </Form.Item>

          <Form.Item name="phoneNumber" label="Số điện thoại liên lạc">
            <Input placeholder="Vd: 0912345678" className="velica-form-input" />
          </Form.Item>

          <Form.Item name="rejectionReason" label="Ghi chú lý do (nếu từ chối hoặc tạm khóa)">
            <TextArea rows={2} placeholder="Lý do hiển thị cho người dùng..." className="velica-form-input" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

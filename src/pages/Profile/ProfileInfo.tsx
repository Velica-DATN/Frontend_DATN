import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Avatar,
  message,
  Tag,
  Alert,
  Select,
  Space,
  Spin,
} from 'antd';
import { Camera, Trash2, UploadCloud } from 'lucide-react';
import { mockService } from '../../api/mocks/mockService';
import { ROLE } from '../../constants/roleConstants';
import { User } from '../../interfaces/velica.interfaces';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const ProfileInfo: React.FC = () => {
  const [form] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<User>(() => mockService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Sync form values with current user
  useEffect(() => {
    const user = mockService.getCurrentUser();
    setCurrentUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      personalEmail: user.personalEmail || '',
      phoneNumber: user.phoneNumber || '',
      gender: user.gender || 'Nam',
      dob: user.dob || '',
      faculty: user.faculty || 'Khoa Công Nghệ Phần Mềm',
      department: user.department || '',
      major: user.major || '',
      academicTitle: user.academicTitle || '',
      position: user.position || '',
      status: user.status || 'Hoạt động',
      bio: user.bio || '',
      lastLogin: user.lastLogin || '',
    });
  }, [form]);

  // Handle save changes
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const trimmedName = values.fullName?.trim();
      if (!trimmedName) {
        message.error('Họ và tên không được để trống!');
        return;
      }

      setLoading(true);

      const updated = await mockService.updateUser(currentUser.id, {
        fullName: trimmedName,
        phoneNumber: values.phoneNumber?.trim(),
        personalEmail: values.personalEmail?.trim(),
        gender: values.gender,
        dob: values.dob,
        bio: values.bio,
      });

      if (updated) {
        setCurrentUser(updated);
      }

      setLoading(false);
      setIsEditing(false);
      message.success('Cập nhật thông tin hồ sơ cá nhân thành công!');
    } catch {
      // Form validation error
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    form.setFieldsValue({
      fullName: currentUser.fullName,
      phoneNumber: currentUser.phoneNumber || '',
      personalEmail: currentUser.personalEmail || '',
      gender: currentUser.gender || 'Nam',
      dob: currentUser.dob || '',
      bio: currentUser.bio || '',
    });
    setIsEditing(false);
    message.info('Đã hủy thay đổi.');
  };

  // Handle Avatar Image Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, JPEG, WEBP, SVG)!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      message.error('Dung lượng ảnh đại diện không được vượt quá 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAvatarLoading(true);
        const updated = await mockService.updateUser(currentUser.id, {
          avatarUrl: dataUrl,
        });
        if (updated) {
          setCurrentUser(updated);
        }
        setAvatarLoading(false);
        message.success('Cập nhật ảnh đại diện thành công!');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    const updated = await mockService.updateUser(currentUser.id, {
      avatarUrl: '',
    });
    if (updated) {
      setCurrentUser(updated);
    }
    setAvatarLoading(false);
    message.info('Đã gỡ ảnh đại diện, chuyển về chữ cái đầu mặc định.');
  };

  const role = currentUser.role;

  return (
    <div className="velica-profile-wrapper animate-fade-in pb-5">
      {/* Header Title & Actions */}
      <div className="mb-4 d-flex items-center justify-between flex-wrap gap-2">
        <div>
          <Title level={4} className="velica-page-title m-0">
            Hồ Sơ Thông Tin Cá Nhân
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Quản lý thông tin liên hệ và hồ sơ cá nhân người dùng.
          </Text>
        </div>

        {/* Action Button: Chỉnh sửa vs Lưu / Hủy */}
        <div>
          {!isEditing ? (
            <Button
              type="primary"
              onClick={() => setIsEditing(true)}
              className="velica-btn-primary"
            >
              Chỉnh sửa
            </Button>
          ) : (
            <Space>
              <Button onClick={handleCancelEdit}>
                Hủy thay đổi
              </Button>
              <Button
                type="primary"
                loading={loading}
                onClick={handleSave}
                className="velica-btn-primary"
              >
                Lưu thay đổi
              </Button>
            </Space>
          )}
        </div>
      </div>

      {/* Hero Profile Overview Card */}
      <Card bordered className="velica-profile-hero-card mb-4">
        <div className="d-flex items-center gap-3.5 flex-wrap">
          {/* Avatar with Image Upload Trigger */}
          <div className="position-relative d-inline-block">
            <Spin spinning={avatarLoading}>
              <Avatar
                size={84}
                src={currentUser.avatarUrl}
                className="velica-profile-avatar shadow-sm border border-2 border-white"
              >
                {currentUser.fullName.split(' ').pop()?.[0] || 'U'}
              </Avatar>
            </Spin>

            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="position-absolute bottom-0 end-0 rounded-circle border-0 text-white d-flex items-center justify-center shadow-sm"
              style={{
                width: 28,
                height: 28,
                cursor: 'pointer',
                transform: 'translate(4px, 4px)',
                backgroundColor: '#2563EB',
                transition: 'all 0.2s ease',
              }}
              title="Nhấn để tải ảnh đại diện lên"
              aria-label="Tải ảnh đại diện lên"
            >
              <Camera size={14} />
            </button>
          </div>

          <div>
            <div className="d-flex items-center gap-2 flex-wrap mb-1">
              <Title level={4} className="m-0 fw-bold text-dark">
                {currentUser.fullName}
              </Title>

              {/* Role Specific Badges */}
              {role === ROLE.TEACHER && (
                <Tag className="velica-role-tag-teacher">
                  Giảng viên
                </Tag>
              )}
              {role === ROLE.STUDENT && (
                <Tag className="velica-role-tag-student">
                  Sinh viên
                </Tag>
              )}
              {role === ROLE.ADMIN && (
                <Tag className="velica-role-tag-admin">
                  Administrator
                </Tag>
              )}
            </div>

            <div className="d-flex items-center gap-2 flex-wrap text-muted-color text-xs mb-1.5">
              <span className="fw-medium font-mono">@{currentUser.username}</span>
              <span>•</span>
              <span>{currentUser.email}</span>
              {currentUser.status && (
                <>
                  <span>•</span>
                  <Tag color="success" className="m-0 text-xs">
                    {currentUser.status}
                  </Tag>
                </>
              )}
            </div>

            <Text type="secondary" className="text-xs">
              {currentUser.bio || 'Hồ sơ người dùng cá nhân trên hệ thống khảo thí Velica'}
            </Text>

            {isEditing && (
              <div className="d-flex items-center gap-2 mt-2">
                <Button
                  size="small"
                  icon={<Camera size={13} />}
                  onClick={() => avatarInputRef.current?.click()}
                  className="text-xs"
                >
                  Tải ảnh đại diện mới
                </Button>
                {currentUser.avatarUrl && (
                  <Button
                    size="small"
                    danger
                    type="text"
                    icon={<Trash2 size={13} />}
                    onClick={handleRemoveAvatar}
                    className="text-xs p-0 h-auto"
                  >
                    Gỡ ảnh đại diện
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Main Profile Form: Purely Personal Information */}
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Card bordered className="velica-profile-card">
          <div className="velica-profile-card-header mb-4">
            <div>
              <span className="fw-bold text-dark fs-6">Thông Tin Cá Nhân & Liên Hệ</span>
              <div className="text-xs text-muted-color">
                {isEditing ? 'Đang trong chế độ chỉnh sửa thông tin' : 'Nhấn nút "Chỉnh sửa" phía trên để cập nhật'}
              </div>
            </div>
            <Tag color={isEditing ? 'processing' : 'default'} className="text-xs">
              {isEditing ? 'Đang chỉnh sửa' : 'Chỉ xem'}
            </Tag>
          </div>

          <Row gutter={24}>
            {/* Tên đăng nhập & Email hệ thống (Read-only) */}
            <Col xs={24} sm={12}>
              <Form.Item label="Tên đăng nhập (Username)" name="username">
                <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item label="Email tài khoản hệ thống" name="email">
                <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
              </Form.Item>
            </Col>

            {/* Các trường thông tin cá nhân có thể chỉnh sửa */}
            <Col xs={24} sm={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input
                  disabled={!isEditing}
                  className={`velica-profile-input ${!isEditing ? 'velica-profile-input-readonly' : ''}`}
                  placeholder="Nhập họ và tên đầy đủ..."
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="phoneNumber"
                label="Số điện thoại di động"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  { pattern: /^(0|84)(3|5|7|8|9)[0-9]{8}$/, message: 'Số điện thoại Việt Nam không hợp lệ (ví dụ: 0912345678)' },
                ]}
              >
                <Input
                  disabled={!isEditing}
                  className={`velica-profile-input ${!isEditing ? 'velica-profile-input-readonly' : ''}`}
                  placeholder="0912345678"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                name="personalEmail"
                label="Email cá nhân / dự phòng"
                rules={[{ type: 'email', message: 'Địa chỉ email không hợp lệ' }]}
              >
                <Input
                  disabled={!isEditing}
                  className={`velica-profile-input ${!isEditing ? 'velica-profile-input-readonly' : ''}`}
                  placeholder="vidu@gmail.com"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item name="gender" label="Giới tính">
                <Select
                  disabled={!isEditing}
                  className="velica-profile-input"
                  placeholder="Chọn giới tính"
                >
                  <Option value="Nam">Nam</Option>
                  <Option value="Nữ">Nữ</Option>
                  <Option value="Khác">Khác</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={6}>
              <Form.Item name="dob" label="Ngày sinh">
                <Input
                  type="date"
                  disabled={!isEditing}
                  className={`velica-profile-input ${!isEditing ? 'velica-profile-input-readonly' : ''}`}
                />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="bio"
                label="Giới thiệu bản thân / Tiểu sử"
              >
                <TextArea
                  rows={3}
                  disabled={!isEditing}
                  className={`velica-profile-input ${!isEditing ? 'velica-profile-input-readonly' : ''}`}
                  placeholder="Giới thiệu ngắn về sở thích, định hướng cá nhân và kỹ năng..."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

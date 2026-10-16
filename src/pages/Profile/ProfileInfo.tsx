import React, { useState, useEffect } from 'react';
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
} from 'antd';
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
  const [isEditing, setIsEditing] = useState(false);

  // Sync form values with current user
  useEffect(() => {
    const user = mockService.getCurrentUser();
    setCurrentUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      username: user.username,
      code: user.code,
      email: user.email,
      personalEmail: user.personalEmail || '',
      phoneNumber: user.phoneNumber || '',
      gender: user.gender || 'Nam',
      dob: user.dob || '',
      faculty: user.faculty || 'Khoa Công Nghệ Phần Mềm',
      department: user.department || '',
      className: user.className || '',
      major: user.major || '',
      academicYear: user.academicYear || '',
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
          <Avatar
            size={80}
            src={currentUser.avatarUrl}
            className="velica-profile-avatar shadow-sm"
          >
            {currentUser.fullName.split(' ').pop()?.[0] || 'U'}
          </Avatar>

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

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
      setLoading(true);

      const updated = await mockService.updateUser(currentUser.id, {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber,
        personalEmail: values.personalEmail,
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
            Quản lý hồ sơ định danh học vụ, thông tin liên lạc và tình trạng tài khoản theo vai trò.
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
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={14} className="d-flex items-center gap-3 flex-wrap">
            <Avatar
              size={82}
              src={currentUser.avatarUrl}
              className="velica-profile-avatar"
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

                {/* Code Identifier Badge */}
                {currentUser.code && (
                  <Tag color="geekblue" className="font-mono fw-bold">
                    {role === ROLE.STUDENT
                      ? `MSSV: ${currentUser.code}`
                      : role === ROLE.TEACHER
                      ? `MSGV: ${currentUser.code}`
                      : `MÃ: ${currentUser.code}`}
                  </Tag>
                )}
              </div>

              <div className="d-flex items-center gap-2 flex-wrap text-muted-color text-xs mb-1">
                <span className="fw-medium font-mono">@{currentUser.username}</span>
                <span>•</span>
                <span>{currentUser.email}</span>
                {currentUser.status && (
                  <>
                    <span>•</span>
                    <Tag color="success" className="m-0">
                      {currentUser.status}
                    </Tag>
                  </>
                )}
              </div>

              <Text type="secondary" className="text-xs">
                {role === ROLE.STUDENT && `${currentUser.faculty || 'Khoa CNPM'} • Lớp: ${currentUser.className || 'SE101 - K18'} • ${currentUser.major || 'Kỹ thuật Phần mềm'}`}
                {role === ROLE.TEACHER && `${currentUser.faculty || 'Khoa CNPM'} • ${currentUser.department || 'Bộ môn Kỹ thuật Phần mềm'} • ${currentUser.position || 'Giảng viên'}`}
                {role === ROLE.ADMIN && `${currentUser.department || 'Ban Quản Trị Đào Tạo & Khảo Thí'} • ${currentUser.position || 'Super Admin'}`}
              </Text>
            </div>
          </Col>

          {/* Mini Academic Stats Column (No icons, clean KPI cards) */}
          <Col xs={24} md={10}>
            <Row gutter={[12, 12]}>
              {role === ROLE.TEACHER && (
                <>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Đang giảng dạy</div>
                      <div className="fw-bold text-dark fs-5">2 Lớp</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Syllabus CLO</div>
                      <div className="fw-bold text-dark fs-5">1 Đề cương</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Ngân hàng đề</div>
                      <div className="fw-bold text-dark fs-5">18 Câu</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Kỳ thi khảo thí</div>
                      <div className="fw-bold text-dark fs-5">2 Bài thi</div>
                    </div>
                  </Col>
                </>
              )}

              {role === ROLE.STUDENT && (
                <>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Học phần tham gia</div>
                      <div className="fw-bold text-dark fs-5">3 Lớp</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Đã hoàn thành</div>
                      <div className="fw-bold text-dark fs-5">8 Bài thi</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Điểm TB tích lũy</div>
                      <div className="fw-bold text-dark fs-5">8.8 / 10</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Chuẩn CLO đạt</div>
                      <div className="fw-bold text-dark fs-5">88.5%</div>
                    </div>
                  </Col>
                </>
              )}

              {role === ROLE.ADMIN && (
                <>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Tài khoản quản trị</div>
                      <div className="fw-bold text-dark fs-5">6 User</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Hệ thống khả dụng</div>
                      <div className="fw-bold text-dark fs-5">99.98%</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Cụm máy chủ CLO</div>
                      <div className="fw-bold text-dark fs-5">Production</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="velica-profile-stat-card">
                      <div className="text-xs text-muted-color mb-1">Bảo mật đa lớp</div>
                      <div className="fw-bold text-dark fs-5">2FA Đã bật</div>
                    </div>
                  </Col>
                </>
              )}
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Main Profile Form */}
      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Row gutter={[24, 24]}>
          {/* Section 1: Academic & Organizational Identity (Always Locked / Read-only) */}
          <Col xs={24} lg={12}>
            <Card bordered className="velica-profile-card h-100">
              <div className="velica-profile-card-header">
                <div>
                  <span className="fw-bold text-dark fs-6">Thông Tin Định Danh & Học Thuật</span>
                  <div className="text-xs text-muted-color">Dữ liệu hồ sơ do Nhà trường quản lý</div>
                </div>
                <Tag color="default" className="text-xs">
                  Chỉ đọc
                </Tag>
              </div>

              <Alert
                message="Dữ liệu học thuật & phân quyền được đồng bộ trực tiếp từ Phòng Đào tạo & Khảo thí."
                type="info"
                className="mb-4 rounded-3 text-xs"
              />

              {/* STUDENT Academic Fields */}
              {role === ROLE.STUDENT && (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Mã số sinh viên (MSSV)" name="code">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly fw-semibold font-mono" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Tên đăng nhập (Username)" name="username">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Lớp sinh hoạt" name="className">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly fw-medium" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Khóa đào tạo / Niên khóa" name="academicYear">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Khoa / Viện đào tạo" name="faculty">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Ngành / Chuyên ngành" name="major">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Trạng thái học tập" name="status">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly text-success fw-medium" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Email trường cấp (@velica)" name="email">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {/* TEACHER Academic Fields */}
              {role === ROLE.TEACHER && (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Mã giảng viên (MSGV)" name="code">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly fw-semibold font-mono" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Tên đăng nhập (Username)" name="username">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Học hàm / Học vị" name="academicTitle">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly fw-medium" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Chức vụ / Vị trí học thuật" name="position">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Khoa / Viện chuyên môn" name="faculty">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Bộ môn trực thuộc" name="department">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Tình trạng công tác" name="status">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly text-success fw-medium" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Email cán bộ (@velica)" name="email">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
                    </Form.Item>
                  </Col>
                </Row>
              )}

              {/* ADMIN Academic Fields */}
              {role === ROLE.ADMIN && (
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Mã quản trị viên (Admin ID)" name="code">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly fw-semibold font-mono" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Tên đăng nhập (Username)" name="username">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Phòng ban / Ban công tác" name="department">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Cấp độ phân quyền hệ thống" name="position">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly text-purple-700 fw-semibold" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Email quản trị (@velica)" name="email">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="Trạng thái hoạt động" name="status">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly text-success fw-medium" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="Lần đăng nhập & IP gần nhất" name="lastLogin">
                      <Input disabled className="velica-profile-input velica-profile-input-readonly font-mono text-xs" />
                    </Form.Item>
                  </Col>
                </Row>
              )}
            </Card>
          </Col>

          {/* Section 2: Contact & Personal Details (Controlled by isEditing) */}
          <Col xs={24} lg={12}>
            <Card bordered className="velica-profile-card h-100">
              <div className="velica-profile-card-header">
                <div>
                  <span className="fw-bold text-dark fs-6">Thông Tin Liên Hệ & Cá Nhân</span>
                  <div className="text-xs text-muted-color">
                    {isEditing ? 'Đang trong chế độ chỉnh sửa' : 'Nhấn nút "Chỉnh sửa" phía trên để cập nhật'}
                  </div>
                </div>
                <Tag color={isEditing ? 'processing' : 'default'} className="text-xs">
                  {isEditing ? 'Đang chỉnh sửa' : 'Chỉ xem'}
                </Tag>
              </div>

              <Row gutter={16}>
                <Col xs={24}>
                  <Form.Item
                    name="fullName"
                    label="Họ và tên hiển thị"
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
                      { pattern: /^[0-9]{9,11}$/, message: 'Số điện thoại không hợp lệ (9-11 số)' },
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

                <Col xs={24} sm={12}>
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

                <Col xs={24} sm={12}>
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
                    label={role === ROLE.TEACHER ? 'Lĩnh vực nghiên cứu & Giảng dạy' : 'Giới thiệu bản thân'}
                  >
                    <TextArea
                      rows={3}
                      disabled={!isEditing}
                      className={`velica-profile-input ${!isEditing ? 'velica-profile-input-readonly' : ''}`}
                      placeholder={
                        role === ROLE.TEACHER
                          ? 'Mô tả chuyên môn, hướng nghiên cứu học thuật, dự án hướng dẫn...'
                          : 'Giới thiệu ngắn về sở thích, định hướng học tập và kỹ năng...'
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox } from 'antd';
import {
  Lock,
  User,
  ArrowRight,
  GraduationCap,
  Users,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { mockService } from '../../api/mocks/mockService';
import { ROLE, UserRole, ROLE_LABELS } from '../../constants/roleConstants';
import { ROUTE_PATHS } from '../../router/constants/routePaths';
import { AuthHeroPane } from './components/AuthHeroPane';

const { Title, Paragraph } = Typography;

// Demo account presets
const ROLE_PRESETS: Record<
  UserRole,
  { name: string; email: string; title: string; subtitle: string; icon: React.ReactNode }
> = {
  [ROLE.TEACHER]: {
    name: 'TS. Nguyễn Văn An',
    email: 'an.nguyen@velica.edu.vn',
    title: 'Giảng viên',
    subtitle: 'Khoa Công nghệ Thông tin • Bộ môn KTPM',
    icon: <GraduationCap size={16} />,
  },
  [ROLE.STUDENT]: {
    name: 'Lê Hoàng Nam',
    email: '22520891@velica.edu.vn',
    title: 'Sinh viên',
    subtitle: 'MSSV: 22520891 • Lớp SE101 - K18',
    icon: <Users size={16} />,
  },
  [ROLE.ADMIN]: {
    name: 'ThS. Trần Thị Mai',
    email: 'mai.tran@velica.edu.vn',
    title: 'Quản trị viên',
    subtitle: 'Phòng Khảo thí & Đảm bảo Chất lượng',
    icon: <ShieldCheck size={16} />,
  },
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(ROLE.TEACHER);
  const [activeTab, setActiveTab] = useState<'academic' | 'admin'>('academic');
  const [form] = Form.useForm();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === ROLE.ADMIN) {
      setActiveTab('admin');
    } else {
      setActiveTab('academic');
    }
    form.setFieldsValue({
      username: ROLE_PRESETS[role].email,
      password: 'password123',
    });
  };

  const handleTabChange = (tab: 'academic' | 'admin') => {
    setActiveTab(tab);
    if (tab === 'admin') {
      setSelectedRole(ROLE.ADMIN);
      form.setFieldsValue({
        username: ROLE_PRESETS[ROLE.ADMIN].email,
        password: 'password123',
      });
    } else {
      setSelectedRole(ROLE.TEACHER);
      form.setFieldsValue({
        username: ROLE_PRESETS[ROLE.TEACHER].email,
        password: 'password123',
      });
    }
  };

  const handleLogin = (role: UserRole = selectedRole) => {
    setLoading(true);
    mockService.setCurrentRole(role);
    setTimeout(() => {
      setLoading(false);
      message.success(`Đăng nhập thành công với vai trò: ${ROLE_LABELS[role]}!`);
      if (role === ROLE.ADMIN) {
        navigate(ROUTE_PATHS.ADMIN.DASHBOARD);
      } else if (role === ROLE.TEACHER) {
        navigate(ROUTE_PATHS.TEACHER.CLASSES);
      } else {
        navigate(ROUTE_PATHS.STUDENT.CLASSES);
      }
    }, 350);
  };

  const handleCustomSubmit = async () => {
    try {
      await form.validateFields();
      handleLogin(selectedRole);
    } catch {
      // form error
    }
  };

  return (
    <div className="velica-auth-page-container">
      {/* Left Pane: Clean Hero Presentation with Large Logo */}
      <AuthHeroPane
        description="Nền tảng quản lý và tổ chức thi trực tuyến tích hợp, giúp sinh viên và giảng viên kết nối hiệu quả trong lộ trình đánh giá học thuật tại Velica."
      />

      {/* Right Pane: Clean White Form Pane */}
      <div className="velica-auth-form-pane">
        {/* Top Role / Tab Switcher with active underline bar */}
        <div className="velica-auth-tabs-row">
          <button
            type="button"
            className={`velica-auth-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => handleTabChange('academic')}
          >
            Sinh viên / Giảng viên
          </button>
          <button
            type="button"
            className={`velica-auth-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            Quản trị viên
          </button>
        </div>

        {/* Form Body Container */}
        <div className="velica-auth-form-content">
          {/* Main Title & Subtitle */}
          <div className="velica-auth-title-section">
            <Title level={2} className="velica-auth-main-heading">
              Đăng nhập hệ thống
            </Title>
            <Paragraph className="velica-auth-main-subheading">
              Vui lòng chọn vai trò để đăng nhập nhanh hoặc nhập tài khoản trường:
            </Paragraph>
          </div>

          {/* Quick Role Selection Buttons */}
          <div className="velica-auth-roles-selection-row">
            {(['TEACHER', 'STUDENT', 'ADMIN'] as UserRole[]).map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`velica-auth-role-pill-btn ${isSelected ? 'active' : ''}`}
                >
                  <span className="velica-auth-role-pill-icon">{ROLE_PRESETS[role].icon}</span>
                  <span>{ROLE_PRESETS[role].title}</span>
                  {isSelected && <Check size={14} className="ms-1 text-teal-600" />}
                </button>
              );
            })}
          </div>

          {/* Current Selected Role Account Preview */}
          <div className="velica-auth-active-account-preview">
            <div className="velica-auth-preview-badge">
              <span className="velica-auth-preview-dot" />
              <span className="font-semibold text-slate-800">{ROLE_PRESETS[selectedRole].name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 text-xs">{ROLE_PRESETS[selectedRole].subtitle}</span>
            </div>
          </div>

          {/* Standard Form Inputs */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCustomSubmit}
            requiredMark={false}
            className="velica-auth-form"
            initialValues={{
              username: ROLE_PRESETS[selectedRole].email,
              password: 'password123',
            }}
          >
            <Form.Item
              name="username"
              label={<span className="velica-form-label">Tên đăng nhập hoặc Email trường</span>}
              rules={[{ required: true, message: 'Vui lòng nhập email hoặc tên đăng nhập' }]}
            >
              <Input
                size="large"
                prefix={<User size={17} className="text-slate-400 me-2" />}
                placeholder="Vd: an.nguyen@velica.edu.vn hoặc MSSV"
                className="velica-auth-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="velica-form-label">Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password
                size="large"
                prefix={<Lock size={17} className="text-slate-400 me-2" />}
                placeholder="Nhập mật khẩu..."
                className="velica-auth-input"
              />
            </Form.Item>

            <div className="d-flex items-center justify-between mb-3 text-xs">
              <Checkbox defaultChecked className="text-slate-600">
                Ghi nhớ đăng nhập
              </Checkbox>
              <button
                type="button"
                className="velica-auth-link-btn"
                onClick={() => navigate(ROUTE_PATHS.AUTH.FORGOT_PASSWORD)}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Primary Action Button */}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={<ArrowRight size={17} />}
              className="velica-auth-cta-btn"
            >
              Đăng nhập với tài khoản Velica
            </Button>
            <div className="velica-auth-btn-caption">
              Cổng đăng nhập học thuật tập trung dành cho toàn bộ giảng viên & sinh viên
            </div>
          </Form>
        </div>

        {/* Bottom Section: Clean Sign Up Link without technical alert card */}
        <div className="velica-auth-bottom-section">
          <div className="velica-auth-signup-footer">
            <span className="text-slate-500">Chưa có tài khoản sinh viên? </span>
            <Link to={ROUTE_PATHS.AUTH.REGISTER} className="velica-auth-switch-link">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, Divider, message } from 'antd';
import { Lock, User, ShieldCheck, GraduationCap, Users } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { mockService } from '../../api/mocks/mockService';
import { ROLE, UserRole, ROLE_LABELS } from '../../constants/roleConstants';
import { ROUTE_PATHS } from '../../router/constants/routePaths';
import logoImg from '../../assets/logo.png';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLogin = (role: UserRole = ROLE.TEACHER) => {
    setLoading(true);
    mockService.setCurrentRole(role);
    setTimeout(() => {
      setLoading(false);
      message.success(`Chào mừng bạn trở lại, đăng nhập thành công với vai trò ${ROLE_LABELS[role]}!`);
      if (role === ROLE.ADMIN) {
        navigate(ROUTE_PATHS.ADMIN.DASHBOARD);
      } else if (role === ROLE.TEACHER) {
        navigate(ROUTE_PATHS.TEACHER.CLASSES);
      } else {
        navigate(ROUTE_PATHS.STUDENT.CLASSES);
      }
    }, 400);
  };

  const handleCustomSubmit = async () => {
    try {
      await form.validateFields();
      handleLogin(ROLE.TEACHER);
    } catch {
      // form error
    }
  };

  return (
    <div className="velica-auth-container">
      <div className="velica-auth-wrapper animate-fade-in">
        {/* Brand Header */}
        <div className="velica-auth-brand-header">
          <img
            src={logoImg}
            alt="Velica Logo"
            className="velica-auth-brand-logo"
          />
          <Title level={3} className="velica-auth-brand-title">
            VELICA ASSESSMENT
          </Title>
          <Text type="secondary" className="velica-auth-brand-subtitle">
            Hệ thống Khảo thí & Quản lý Học tập Học thuật Hiện đại
          </Text>
        </div>

        {/* Login Card */}
        <Card bordered className="velica-auth-card">
          <Form form={form} layout="vertical" onFinish={handleCustomSubmit}>
            <Form.Item
              name="username"
              label="Tên đăng nhập hoặc Email trường"
              rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
              initialValue="an.nguyen@velica.edu.vn"
            >
              <Input
                prefix={<User size={16} className="text-muted-color" />}
                placeholder="Vd: an.nguyen@velica.edu.vn"
                className="velica-auth-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
              initialValue="••••••••"
            >
              <Input.Password
                prefix={<Lock size={16} className="text-muted-color" />}
                placeholder="Nhập mật khẩu..."
                className="velica-auth-input"
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="velica-auth-submit-btn"
            >
              Đăng nhập tài khoản
            </Button>
          </Form>

          <Divider className="velica-auth-divider">
            HOẶC CHỌN VAI TRÒ PREVIEW UI NHANH
          </Divider>

          {/* Quick Demo Preview Role Buttons */}
          <Space direction="vertical" className="w-100" size={10}>
            <Button
              block
              onClick={() => handleLogin(ROLE.TEACHER)}
              icon={<GraduationCap size={16} className="text-brand-color" />}
              className="velica-auth-role-btn"
            >
              Vào vai <strong className="text-brand-color ms-1">Giảng viên</strong> (Đề thi, Rubric, Chấm bài)
            </Button>

            <Button
              block
              onClick={() => handleLogin(ROLE.STUDENT)}
              icon={<Users size={16} className="text-success-color" />}
              className="velica-auth-role-btn"
            >
              Vào vai <strong className="text-success-color ms-1">Sinh viên</strong> (Thi trực tuyến, Bảng điểm)
            </Button>

            <Button
              block
              onClick={() => handleLogin(ROLE.ADMIN)}
              icon={<ShieldCheck size={16} className="text-danger-color" />}
              className="velica-auth-role-btn"
            >
              Vào vai <strong className="text-danger-color ms-1">Quản trị viên</strong> (Users, Roles, Bảo trì)
            </Button>
          </Space>

          <div className="velica-auth-footer-text">
            <span className="text-muted-color">Chưa có tài khoản? </span>
            <Link to={ROUTE_PATHS.AUTH.REGISTER} className="fw-semibold text-brand-color">
              Đăng ký ngay
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

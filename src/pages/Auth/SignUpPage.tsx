import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { Lock, User, Mail } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../router/constants/routePaths';
import logoImg from '../../assets/logo.png';

const { Title, Text } = Typography;

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleRegister = async () => {
    try {
      await form.validateFields();
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        message.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
        navigate(ROUTE_PATHS.AUTH.LOGIN);
      }, 600);
    } catch {
      // form error
    }
  };

  return (
    <div className="velica-auth-container">
      <div className="velica-auth-wrapper animate-fade-in">
        <div className="velica-auth-brand-header">
          <img
            src={logoImg}
            alt="Velica Logo"
            className="velica-auth-brand-logo"
          />
          <Title level={3} className="velica-auth-brand-title">
            Tạo Tài Khoản Velica
          </Title>
          <Text type="secondary" className="velica-auth-brand-subtitle">
            Đăng ký tài khoản học tập và khảo thí dành cho sinh viên
          </Text>
        </div>

        <Card bordered className="velica-auth-card">
          <Form form={form} layout="vertical" onFinish={handleRegister}>
            <Form.Item
              name="fullName"
              label="Họ và tên sinh viên"
              rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
            >
              <Input
                prefix={<User size={16} className="text-muted-color" />}
                placeholder="Vd: Lê Hoàng Nam"
                className="velica-auth-input"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email trường (@velica.edu.vn)"
              rules={[
                { required: true, message: 'Vui lòng nhập email' },
                { type: 'email', message: 'Email không hợp lệ' },
              ]}
            >
              <Input
                prefix={<Mail size={16} className="text-muted-color" />}
                placeholder="Vd: nam.lh@velica.edu.vn"
                className="velica-auth-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' },
              ]}
            >
              <Input.Password
                prefix={<Lock size={16} className="text-muted-color" />}
                placeholder="Nhập mật khẩu..."
                className="velica-auth-input"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Xác nhận mật khẩu"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<Lock size={16} className="text-muted-color" />}
                placeholder="Nhập lại mật khẩu..."
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
              Đăng ký tài khoản
            </Button>
          </Form>

          <div className="velica-auth-footer-text">
            <span className="text-muted-color">Đã có tài khoản? </span>
            <Link to={ROUTE_PATHS.AUTH.LOGIN} className="fw-semibold text-brand-color">
              Đăng nhập ngay
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

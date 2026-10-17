import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox, Row, Col } from 'antd';
import { Lock, User, Mail, GraduationCap, ArrowRight, Hash } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../router/constants/routePaths';
import { AuthHeroPane } from './components/AuthHeroPane';

const { Title, Paragraph } = Typography;

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
        message.success('Đăng ký tài khoản sinh viên thành công! Vui lòng đăng nhập.');
        navigate(ROUTE_PATHS.AUTH.LOGIN);
      }, 500);
    } catch {
      // form error
    }
  };

  return (
    <div className="velica-auth-page-container">
      {/* Left Pane: Clean Hero Presentation with Large Logo */}
      <AuthHeroPane
        headline="Khởi tạo Tài khoản Khảo thí"
        description="Khởi tạo tài khoản khảo thí sinh viên để truy cập phòng thi trực tuyến an toàn, theo dõi tiến độ chuẩn đầu ra CLO và nhận phản hồi Rubric minh bạch."
      />

      {/* Right Pane: Clean White Form Pane */}
      <div className="velica-auth-form-pane">
        {/* Top Role / Tab Switcher with active underline bar */}
        <div className="velica-auth-tabs-row">
          <button
            type="button"
            className="velica-auth-tab-btn active"
          >
            Đăng ký sinh viên
          </button>
          <button
            type="button"
            className="velica-auth-tab-btn"
            onClick={() => navigate(ROUTE_PATHS.AUTH.LOGIN)}
          >
            Đã có tài khoản
          </button>
        </div>

        {/* Form Body Container */}
        <div className="velica-auth-form-content">
          {/* Main Title & Subtitle */}
          <div className="velica-auth-title-section">
            <Title level={2} className="velica-auth-main-heading">
              Tạo tài khoản sinh viên
            </Title>
            <Paragraph className="velica-auth-main-subheading">
              Vui lòng điền thông tin học thuật để kích hoạt tài khoản trên hệ thống Velica:
            </Paragraph>
          </div>

          {/* Registration Form */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRegister}
            requiredMark={false}
            className="velica-auth-form"
          >
            <Row gutter={12}>
              <Col xs={24} sm={14}>
                <Form.Item
                  name="fullName"
                  label={<span className="velica-form-label">Họ và tên sinh viên</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
                >
                  <Input
                    size="large"
                    prefix={<User size={17} className="text-slate-400 me-2" />}
                    placeholder="Vd: Lê Hoàng Nam"
                    className="velica-auth-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  name="studentCode"
                  label={<span className="velica-form-label">Mã số SV (MSSV)</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập MSSV' }]}
                >
                  <Input
                    size="large"
                    prefix={<Hash size={17} className="text-slate-400 me-2" />}
                    placeholder="Vd: 22520891"
                    className="velica-auth-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} sm={14}>
                <Form.Item
                  name="email"
                  label={<span className="velica-form-label">Email trường (@velica.edu.vn)</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập email trường' },
                    { type: 'email', message: 'Email không đúng định dạng' },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={<Mail size={17} className="text-slate-400 me-2" />}
                    placeholder="Vd: nam.lh@velica.edu.vn"
                    className="velica-auth-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item
                  name="className"
                  label={<span className="velica-form-label">Lớp sinh hoạt</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập lớp' }]}
                >
                  <Input
                    size="large"
                    prefix={<GraduationCap size={17} className="text-slate-400 me-2" />}
                    placeholder="Vd: SE101 - K18"
                    className="velica-auth-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="password"
                  label={<span className="velica-form-label">Mật khẩu</span>}
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                    { min: 6, message: 'Tối thiểu 6 ký tự' },
                  ]}
                >
                  <Input.Password
                    size="large"
                    prefix={<Lock size={17} className="text-slate-400 me-2" />}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="velica-auth-input"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="confirmPassword"
                  label={<span className="velica-form-label">Xác nhận mật khẩu</span>}
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
                    size="large"
                    prefix={<Lock size={17} className="text-slate-400 me-2" />}
                    placeholder="Nhập lại mật khẩu..."
                    className="velica-auth-input"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                {
                  validator: (_, value) =>
                    value
                      ? Promise.resolve()
                      : Promise.reject(new Error('Vui lòng đồng ý với quy chế khảo thí')),
                },
              ]}
              className="mb-3"
            >
              <Checkbox className="text-xs text-slate-600">
                Tôi cam kết tuân thủ quy chế khảo thí và tính chính trực học thuật của nhà trường.
              </Checkbox>
            </Form.Item>

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
              Kích hoạt tài khoản sinh viên
            </Button>
            <div className="velica-auth-btn-caption">
              Hệ thống sẽ tự động xác minh và đồng bộ các học phần khảo thí của bạn
            </div>
          </Form>
        </div>

        {/* Bottom Section: Clean Login Link without technical alert card */}
        <div className="velica-auth-bottom-section">
          <div className="velica-auth-signup-footer">
            <span className="text-slate-500">Đã có tài khoản sinh viên? </span>
            <Link to={ROUTE_PATHS.AUTH.LOGIN} className="velica-auth-switch-link">
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

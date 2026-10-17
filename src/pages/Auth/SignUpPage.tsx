import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Checkbox, Row, Col, Alert, Steps } from 'antd';
import {
  Lock,
  User,
  Mail,
  ArrowRight,
  ShieldCheck,
  Clock,
  KeyRound,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../router/constants/routePaths';
import { AuthHeroPane } from './components/AuthHeroPane';
import { mockService } from '../../api/mocks/mockService';

const { Title, Paragraph, Text } = Typography;

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Registration data state
  const [studentData, setStudentData] = useState<{
    fullName: string;
    email: string;
  }>({
    fullName: '',
    email: '',
  });

  // OTP Verification state
  const [otpValue, setOtpValue] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(60);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCooldownActive && otpCooldown > 0) {
      timer = setInterval(() => setOtpCooldown((prev) => prev - 1), 1000);
    } else if (otpCooldown === 0) {
      setIsCooldownActive(false);
    }
    return () => clearInterval(timer);
  }, [isCooldownActive, otpCooldown]);

  // Step 1: Submit info & Validate duplicate email
  const handleStep1Submit = async () => {
    try {
      const values = await form.validateFields();
      const email = values.email.trim().toLowerCase();

      setLoading(true);
      const res = await mockService.sendRegistrationOtp(email);

      setStudentData({
        fullName: values.fullName.trim(),
        email: email,
      });

      setLoading(false);
      setCurrentStep(1);
      setOtpCooldown(60);
      setIsCooldownActive(true);
      message.success(`Mã xác thực email đã được gửi đến: ${email}`);
      message.info({
        content: `[Hộp thư Sinh viên] Mã xác thực Velica của bạn: ${res.otpCode} (Hiệu lực: 10 phút)`,
        duration: 8,
      });
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Không thể gửi mã xác minh.');
    }
  };

  // Step 2: Resend OTP
  const handleResendOtp = async () => {
    if (isCooldownActive) {
      message.warning(`Vui lòng chờ thêm ${otpCooldown}s trước khi yêu cầu mã mới.`);
      return;
    }
    try {
      setLoading(true);
      const res = await mockService.sendRegistrationOtp(studentData.email);
      setLoading(false);
      setOtpCooldown(60);
      setIsCooldownActive(true);
      message.success('Đã gửi lại mã xác minh mới vào email của bạn.');
      message.info({
        content: `[Hộp thư Sinh viên] Mã xác minh Velica mới: ${res.otpCode}`,
        duration: 8,
      });
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Không thể gửi lại mã xác minh.');
    }
  };

  // Step 2: Verify OTP and save to system as PENDING
  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.trim().length < 6) {
      message.error('Vui lòng nhập đủ 6 chữ số mã xác minh!');
      return;
    }

    setLoading(true);
    try {
      await mockService.verifyRegistrationOtp(studentData.email, otpValue.trim());

      // Register student with PENDING status
      await mockService.registerStudent({
        fullName: studentData.fullName,
        email: studentData.email,
      });

      setLoading(false);
      setCurrentStep(2);
      message.success('Xác minh email thành công! Tài khoản đã được chuyển sang trạng thái Chờ duyệt.');
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Mã xác minh không chính xác. Vui lòng kiểm tra lại hộp thư.');
    }
  };

  return (
    <div className="velica-auth-page-container">
      {/* Left Pane: Clean Hero Presentation with Large Logo */}
      <AuthHeroPane
        headline="Khởi tạo Tài khoản Khảo thí"
        description="Đăng ký tài khoản sinh viên chính thức để truy cập phòng thi trực tuyến an toàn, theo dõi tiến độ chuẩn đầu ra CLO và nhận phản hồi Rubric minh bạch."
      />

      {/* Right Pane: Clean White Form Pane */}
      <div className="velica-auth-form-pane">
        {/* Top Role / Tab Switcher */}
        <div className="velica-auth-tabs-row">
          <button type="button" className="velica-auth-tab-btn active">
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

        {/* Steps Progress Header */}
        <div className="mb-4">
          <Steps
            current={currentStep}
            size="small"
            className="velica-auth-steps"
            items={[
              { title: 'Điền thông tin' },
              { title: 'Xác minh Email' },
              { title: 'Chờ duyệt' },
            ]}
          />
        </div>

        {/* Notice: Teacher accounts are created by Admin */}
        {currentStep === 0 && (
          <Alert
            type="info"
            showIcon
            className="mb-4 text-xs"
            message="Chính sách cấp tài khoản Velica"
            description="Cổng này chỉ dành cho Sinh viên đăng ký và xác minh email. Tài khoản Giảng viên và Quản trị viên do Nhà trường / Quản trị viên trực tiếp khởi tạo."
          />
        )}

        {/* Form Content Area */}
        <div className="velica-auth-form-content">
          {/* STEP 0: Student Info Form */}
          {currentStep === 0 && (
            <>
              <div className="velica-auth-title-section">
                <Title level={2} className="velica-auth-main-heading">
                  Đăng ký tài khoản sinh viên
                </Title>
                <Paragraph className="velica-auth-main-subheading">
                  Vui lòng điền thông tin học thuật chính xác để kích hoạt tài khoản:
                </Paragraph>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleStep1Submit}
                requiredMark={false}
                className="velica-auth-form"
              >
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
                    Tôi cam kết thông tin cung cấp là chính xác và tuân thủ quy chế khảo thí của nhà trường.
                  </Checkbox>
                </Form.Item>

                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  icon={<ArrowRight size={17} />}
                  className="velica-auth-cta-btn"
                >
                  Tiếp tục: Xác minh Email
                </Button>
                <div className="velica-auth-btn-caption">
                  Hệ thống sẽ gửi mã bảo mật 6 số đến email trường của bạn
                </div>
              </Form>
            </>
          )}

          {/* STEP 1: Verify Email OTP */}
          {currentStep === 1 && (
            <div>
              <div className="d-flex items-center gap-2 mb-3">
                <button
                  type="button"
                  className="btn-action-icon text-slate-500 hover:text-slate-800"
                  onClick={() => setCurrentStep(0)}
                >
                  <ArrowLeft size={16} />
                </button>
                <span className="text-xs text-slate-500">Quay lại sửa thông tin</span>
              </div>

              <div className="velica-auth-title-section">
                <Title level={2} className="velica-auth-main-heading">
                  Xác minh Email Sinh viên
                </Title>
                <Paragraph className="velica-auth-main-subheading">
                  Mã xác thực 6 chữ số đã được gửi tới email{' '}
                  <strong className="text-slate-900 font-mono">{studentData.email}</strong>. Vui lòng nhập mã để hoàn tất đăng ký:
                </Paragraph>
              </div>

              <div className="mb-4">
                <Input
                  size="large"
                  prefix={<KeyRound size={17} className="text-slate-400 me-2" />}
                  placeholder="Nhập 6 chữ số mã xác minh..."
                  maxLength={6}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  className="velica-auth-input font-mono text-center tracking-widest text-lg font-bold"
                />
              </div>

              <div className="d-flex items-center justify-between mb-4 text-xs">
                <span className="text-slate-500">Chưa nhận được mã?</span>
                <button
                  type="button"
                  disabled={isCooldownActive}
                  onClick={handleResendOtp}
                  className={`velica-auth-link-btn d-inline-flex items-center gap-1 ${
                    isCooldownActive ? 'opacity-50 cursor-not-allowed text-slate-400' : ''
                  }`}
                >
                  <RefreshCw size={12} className={isCooldownActive ? 'animate-spin' : ''} />
                  <span>
                    {isCooldownActive ? `Gửi lại sau (${otpCooldown}s)` : 'Gửi lại mã xác minh'}
                  </span>
                </button>
              </div>

              <Button
                type="primary"
                block
                size="large"
                loading={loading}
                icon={<ShieldCheck size={18} />}
                onClick={handleVerifyOtp}
                className="velica-auth-cta-btn"
              >
                Xác thực Email & Đăng ký
              </Button>
            </div>
          )}

          {/* STEP 2: Pending Approval Confirmation Screen */}
          {currentStep === 2 && (
            <div className="text-center py-2">
              <div className="d-inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 text-amber-600 mb-3 border border-amber-200">
                <Clock size={36} />
              </div>

              <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 mb-2">
                Trạng thái: CHỜ DUYỆT (PENDING)
              </div>

              <Title level={3} className="text-slate-900 mb-2 font-bold">
                Đăng ký thành công & Đã xác minh Email!
              </Title>

              <Paragraph className="text-slate-600 text-sm leading-relaxed mb-4">
                Email <strong className="text-slate-900 font-mono">{studentData.email}</strong> của bạn đã được xác minh thành công.
                Tài khoản hiện đang được chuyển đến Ban Quản trị nhà trường để đối soát và xét duyệt.
              </Paragraph>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-left text-xs mb-4 space-y-1.5">
                <div className="text-slate-500">
                  <strong className="text-slate-700">Sinh viên:</strong> {studentData.fullName}
                </div>
                <div className="text-slate-500">
                  <strong className="text-slate-700">Quy trình:</strong> Admin sẽ duyệt danh sách định kỳ. Bạn sẽ nhận được thông báo qua email khi tài khoản được kích hoạt.
                </div>
              </div>

              <Button
                type="primary"
                block
                size="large"
                onClick={() => navigate(ROUTE_PATHS.AUTH.LOGIN)}
                className="velica-auth-cta-btn"
              >
                Quay lại trang Đăng nhập
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        {currentStep === 0 && (
          <div className="velica-auth-bottom-section">
            <div className="velica-auth-signup-footer">
              <span className="text-slate-500">Đã có tài khoản sinh viên? </span>
              <Link to={ROUTE_PATHS.AUTH.LOGIN} className="velica-auth-switch-link">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

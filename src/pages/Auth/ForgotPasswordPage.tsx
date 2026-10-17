import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Steps, Alert } from 'antd';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { ROUTE_PATHS } from '../../router/constants/routePaths';
import { AuthHeroPane } from './components/AuthHeroPane';
import { mockService } from '../../api/mocks/mockService';

const { Title, Paragraph, Text } = Typography;

// Anti-Spam Business Rule Constants
const COOLDOWN_SECONDS = 60; // 60s cooldown between requests
const OTP_EXPIRY_SECONDS = 300; // 5 minutes expiration
const MAX_RESEND_ATTEMPTS = 3; // Maximum 3 OTP requests per session
const MAX_FAILED_ATTEMPTS = 5; // Maximum 5 failed verification attempts

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [emailInput, setEmailInput] = useState('an.nguyen@velica.edu.vn');
  const [otpValue, setOtpValue] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Anti-Spam State Management
  const [resendCount, setResendCount] = useState(1);
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [isCooldownActive, setIsCooldownActive] = useState(false);
  const [otpExpiresIn, setOtpExpiresIn] = useState(OTP_EXPIRY_SECONDS);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedByBruteforce, setIsLockedByBruteforce] = useState(false);

  const [formStep1] = Form.useForm();
  const [formStep3] = Form.useForm();

  // Cooldown countdown timer (60s)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isCooldownActive && cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else if (cooldown === 0) {
      setIsCooldownActive(false);
    }
    return () => clearInterval(timer);
  }, [isCooldownActive, cooldown]);

  // OTP Validity countdown timer (5 mins)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 1 && otpExpiresIn > 0 && !isLockedByBruteforce) {
      timer = setInterval(() => {
        setOtpExpiresIn((prev) => prev - 1);
      }, 1000);
    } else if (otpExpiresIn === 0 && currentStep === 1) {
      message.warning('Mã xác thực của bạn đã hết hạn (5 phút). Vui lòng gửi lại yêu cầu mới.');
    }
    return () => clearInterval(timer);
  }, [currentStep, otpExpiresIn, isLockedByBruteforce]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Step 1: Validate email against verified accounts & send reset link
  const handleStep1Submit = async () => {
    try {
      const values = await formStep1.validateFields();
      const inputEmail = values.email.trim().toLowerCase();

      setLoading(true);
      const res = await mockService.requestPasswordReset(inputEmail);

      setEmailInput(inputEmail);
      setResetToken(res.token);
      setResendCount(1);
      setFailedAttempts(0);
      setIsLockedByBruteforce(false);
      setOtpExpiresIn(res.expiresIn);
      setCooldown(COOLDOWN_SECONDS);
      setIsCooldownActive(true);
      setLoading(false);
      setCurrentStep(1);

      message.success(`Đã gửi mã xác thực đặt lại mật khẩu đến "${inputEmail}".`);
      message.info({
        content: `[Hộp thư Xác thực] Mã OTP đặt lại mật khẩu của bạn là: ${res.otpCode} (Hiệu lực: 5 phút)`,
        duration: 8,
      });
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
    }
  };

  // Resend OTP & Reset link
  const handleResendOtp = async () => {
    if (isCooldownActive) {
      message.warning(`Vui lòng đợi thêm ${cooldown} giây trước khi yêu cầu mã mới.`);
      return;
    }

    if (resendCount >= MAX_RESEND_ATTEMPTS) {
      message.error(
        `Bạn đã sử dụng hết ${MAX_RESEND_ATTEMPTS}/${MAX_RESEND_ATTEMPTS} lần gửi trong phiên này. Vui lòng thử lại sau 15 phút.`
      );
      return;
    }

    try {
      setLoading(true);
      const res = await mockService.requestPasswordReset(emailInput);
      setLoading(false);
      const nextCount = resendCount + 1;
      setResendCount(nextCount);
      setResetToken(res.token);
      setOtpValue('');
      setOtpExpiresIn(res.expiresIn);
      setCooldown(COOLDOWN_SECONDS);
      setIsCooldownActive(true);
      setFailedAttempts(0);
      setIsLockedByBruteforce(false);

      message.success(`Đã gửi lại mã xác thực mới (${nextCount}/${MAX_RESEND_ATTEMPTS}).`);
      message.info({
        content: `[Hộp thư Xác thực] Mã xác thực mới của bạn là: ${res.otpCode}`,
        duration: 8,
      });
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Không thể gửi lại mã.');
    }
  };

  // Step 2: Verify OTP
  const handleStep2Submit = async () => {
    if (isLockedByBruteforce) {
      message.error('Mã xác thực đã bị khóa do nhập sai quá nhiều lần. Vui lòng gửi lại yêu cầu.');
      return;
    }

    if (otpExpiresIn <= 0) {
      message.error('Mã xác thực đã hết thời hạn hiệu lực (5 phút). Vui lòng nhấn gửi lại.');
      return;
    }

    if (!otpValue || otpValue.trim().length < 6) {
      message.error('Vui lòng nhập đầy đủ mã xác thực gồm 6 chữ số');
      return;
    }

    setLoading(true);
    try {
      const res = await mockService.verifyPasswordResetOtp(emailInput, otpValue.trim());
      setLoading(false);
      if (res.success && res.resetToken) {
        setResetToken(res.resetToken);
        message.success('Xác thực danh tính thành công! Vui lòng đặt mật khẩu mới.');
        setCurrentStep(2);
      }
    } catch (err: any) {
      setLoading(false);
      const newFailed = failedAttempts + 1;
      setFailedAttempts(newFailed);
      if (newFailed >= MAX_FAILED_ATTEMPTS) {
        setIsLockedByBruteforce(true);
      }
      message.error(err.message || 'Mã xác thực không hợp lệ.');
    }
  };

  // Step 3: Set New Password
  const handleStep3Submit = async () => {
    try {
      const values = await formStep3.validateFields();
      setLoading(true);
      await mockService.resetPasswordWithToken(emailInput, resetToken, values.newPassword);
      setLoading(false);
      setCurrentStep(3);
      message.success('Mật khẩu mới đã được cập nhật thành công!');
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Có lỗi xảy ra khi cập nhật mật khẩu mới.');
    }
  };

  return (
    <div className="velica-auth-page-container">
      {/* Left Pane: Consistent Hero Presentation with Big Logo */}
      <AuthHeroPane
        headline="Khôi phục Mật khẩu Tài khoản"
        description="Gửi liên kết đặt lại mật khẩu an toàn qua email đã xác minh trong hệ thống để bảo vệ danh tính học thuật và dữ liệu khảo thí."
      />

      {/* Right Pane: Multi-Step Flow */}
      <div className="velica-auth-form-pane">
        {/* Top Header Row with Back to Login */}
        <div className="d-flex items-center justify-between mb-4">
          <Link
            to={ROUTE_PATHS.AUTH.LOGIN}
            className="d-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-700 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Quay lại Đăng nhập</span>
          </Link>
          <div className="text-xs font-semibold text-slate-400">
            Bước {Math.min(currentStep + 1, 3)} / 3
          </div>
        </div>

        {/* Steps Progress Indicator */}
        <div className="mb-4">
          <Steps
            current={currentStep}
            size="small"
            className="velica-auth-steps"
            items={[
              { title: 'Nhập Email' },
              { title: 'Liên kết & OTP' },
              { title: 'Đặt mật khẩu' },
            ]}
          />
        </div>

        {/* Step 1: Request Reset Link */}
        {currentStep === 0 && (
          <div className="velica-auth-form-content">
            <div className="velica-auth-title-section">
              <Title level={2} className="velica-auth-main-heading">
                Quên mật khẩu?
              </Title>
              <Paragraph className="velica-auth-main-subheading">
                Nhập email trường (@velica.edu.vn) đã được xác minh. Hệ thống sẽ gửi liên kết và mã xác thực bảo mật để đặt lại mật khẩu của bạn.
              </Paragraph>
            </div>

            {/* Quick Demo Pre-fill options */}
            <div className="d-flex gap-2 mb-3">
              <button
                type="button"
                className="velica-auth-preset-chip"
                onClick={() => formStep1.setFieldsValue({ email: 'an.nguyen@velica.edu.vn' })}
              >
                Giảng viên: an.nguyen@velica.edu.vn
              </button>
              <button
                type="button"
                className="velica-auth-preset-chip"
                onClick={() => formStep1.setFieldsValue({ email: 'nam.lh@velica.edu.vn' })}
              >
                Sinh viên: nam.lh@velica.edu.vn
              </button>
            </div>

            <Form
              form={formStep1}
              layout="vertical"
              onFinish={handleStep1Submit}
              requiredMark={false}
              className="velica-auth-form"
              initialValues={{ email: 'an.nguyen@velica.edu.vn' }}
            >
              <Form.Item
                name="email"
                label={<span className="velica-form-label">Email trường đã xác minh</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập email trường' },
                  { type: 'email', message: 'Email không đúng định dạng' },
                ]}
              >
                <Input
                  size="large"
                  prefix={<Mail size={17} className="text-slate-400 me-2" />}
                  placeholder="Vd: an.nguyen@velica.edu.vn"
                  className="velica-auth-input"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                icon={<Send size={17} />}
                className="velica-auth-cta-btn mt-2"
              >
                Gửi liên kết đặt lại mật khẩu
              </Button>
            </Form>
          </div>
        )}

        {/* Step 2: Reset Link & OTP Verification */}
        {currentStep === 1 && (
          <div className="velica-auth-form-content">
            <div className="velica-auth-title-section">
              <Title level={2} className="velica-auth-main-heading">
                Kiểm tra Email của bạn
              </Title>
              <Paragraph className="velica-auth-main-subheading">
                Liên kết và mã xác thực đã được gửi tới{' '}
                <strong className="text-slate-900 font-mono">{emailInput}</strong>:
              </Paragraph>
            </div>

            {/* Security Verification Notice */}
            <div className="p-3 mb-4 rounded-lg bg-teal-50 border border-teal-200 text-xs">
              <div className="d-flex items-center gap-2 font-semibold text-teal-900 mb-1.5">
                <ShieldCheck size={16} className="text-teal-700" />
                <span>Bảo vệ chống tấn công & giả mạo danh tính</span>
              </div>
              <p className="text-teal-800 m-0 leading-relaxed">
                Mã xác thực 6 chữ số đã được gửi qua kênh bảo mật nội bộ tới hộp thư của bạn. Vui lòng nhập mã để xác thực danh tính trước khi đổi mật khẩu.
              </p>
            </div>

            {/* Enter 6-digit OTP */}
            <div className="text-xs text-slate-500 font-semibold mb-2">
              NHẬP MÃ XÁC THỰC 6 CHỮ SỐ TỪ EMAIL:
            </div>

            {/* Security Status Bar */}
            <div className="velica-auth-security-status-card mb-3">
              <div className="d-flex items-center justify-between text-xs">
                <span className="d-flex items-center gap-1.5 text-slate-600 font-medium">
                  <Clock size={14} className={otpExpiresIn <= 60 ? 'text-amber-500' : 'text-teal-600'} />
                  <span>Hiệu lực liên kết:</span>
                  <strong className={otpExpiresIn <= 60 ? 'text-rose-600 font-mono' : 'text-slate-800 font-mono'}>
                    {formatTime(otpExpiresIn)}
                  </strong>
                </span>

                <span className="text-xs text-slate-500">
                  Lần gửi: <strong className="text-teal-700">{resendCount}/{MAX_RESEND_ATTEMPTS}</strong>
                </span>
              </div>
            </div>

            {/* Bruteforce Lock Alert */}
            {isLockedByBruteforce && (
              <Alert
                type="error"
                showIcon
                icon={<ShieldAlert size={18} />}
                message="Mã xác thực đã bị vô hiệu hóa"
                description={`Bạn đã nhập sai ${MAX_FAILED_ATTEMPTS} lần liên tiếp. Vui lòng bấm "Gửi lại" để nhận mã mới.`}
                className="mb-3"
              />
            )}

            {!isLockedByBruteforce && otpExpiresIn === 0 && (
              <Alert
                type="warning"
                showIcon
                icon={<AlertTriangle size={18} />}
                message="Yêu cầu đã hết hạn"
                description="Liên kết và mã 5 phút đã hết hạn. Vui lòng gửi lại yêu cầu mới."
                className="mb-3"
              />
            )}

            {!isLockedByBruteforce && failedAttempts > 0 && otpExpiresIn > 0 && (
              <Alert
                type="warning"
                showIcon
                message={`Nhập sai ${failedAttempts}/${MAX_FAILED_ATTEMPTS} lần`}
                description={`Còn ${MAX_FAILED_ATTEMPTS - failedAttempts} lần thử trước khi mã bị khóa bảo mật.`}
                className="mb-3"
              />
            )}

            <div className="my-3">
              <Input.OTP
                size="large"
                length={6}
                value={otpValue}
                onChange={(val) => setOtpValue(val)}
                disabled={isLockedByBruteforce || otpExpiresIn === 0}
                className="velica-auth-otp-input"
              />
            </div>

            {/* Anti-Spam Resend Controls */}
            <div className="d-flex items-center justify-between mb-4 text-xs">
              {resendCount >= MAX_RESEND_ATTEMPTS ? (
                <span className="text-amber-600 font-medium d-flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span>Đã hết lượt gửi lại (tối đa 3 lần/phiên)</span>
                </span>
              ) : isCooldownActive ? (
                <span className="text-slate-500">
                  Gửi lại sau: <strong className="text-teal-700 font-mono">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="d-flex items-center gap-1 font-semibold text-teal-700 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Gửi lại email ({resendCount}/{MAX_RESEND_ATTEMPTS})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className="text-slate-500 hover:text-slate-700 bg-transparent border-0 p-0 cursor-pointer"
              >
                Đổi email nhận mã
              </button>
            </div>

            <Button
              type="primary"
              block
              size="large"
              loading={loading}
              onClick={handleStep2Submit}
              disabled={isLockedByBruteforce || otpExpiresIn === 0 || otpValue.length < 6}
              icon={<ShieldCheck size={17} />}
              className="velica-auth-cta-btn"
            >
              Xác nhận mã bảo mật
            </Button>
          </div>
        )}

        {/* Step 3: Set New Password */}
        {currentStep === 2 && (
          <div className="velica-auth-form-content">
            <div className="velica-auth-title-section">
              <Title level={2} className="velica-auth-main-heading">
                Thiết lập mật khẩu mới
              </Title>
              <Paragraph className="velica-auth-main-subheading">
                Tạo mật khẩu mới có ít nhất 6 ký tự để bảo vệ tài khoản học thuật của bạn.
              </Paragraph>
            </div>

            <Form
              form={formStep3}
              layout="vertical"
              onFinish={handleStep3Submit}
              requiredMark={false}
              className="velica-auth-form"
            >
              <Form.Item
                name="newPassword"
                label={<span className="velica-form-label">Mật khẩu mới</span>}
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                ]}
              >
                <Input.Password
                  size="large"
                  prefix={<Lock size={17} className="text-slate-400 me-2" />}
                  placeholder="Nhập mật khẩu mới..."
                  className="velica-auth-input"
                />
              </Form.Item>

              <Form.Item
                name="confirmNewPassword"
                label={<span className="velica-form-label">Xác nhận mật khẩu mới</span>}
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
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
                  placeholder="Nhập lại mật khẩu mới..."
                  className="velica-auth-input"
                />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={loading}
                icon={<KeyRound size={17} />}
                className="velica-auth-cta-btn mt-2"
              >
                Lưu mật khẩu mới
              </Button>
            </Form>
          </div>
        )}

        {/* Step 4: Success Screen */}
        {currentStep === 3 && (
          <div className="velica-auth-form-content text-center py-4">
            <div className="velica-auth-success-icon-wrapper mb-3">
              <CheckCircle2 size={48} className="text-teal-600" />
            </div>

            <Title level={2} className="velica-auth-main-heading mb-2">
              Đổi mật khẩu thành công!
            </Title>
            <Paragraph className="velica-auth-main-subheading mb-4 max-w-sm mx-auto">
              Mật khẩu tài khoản của bạn đã được cập nhật thành công trên hệ thống Velica. Bạn có thể đăng nhập ngay với mật khẩu mới.
            </Paragraph>

            <Button
              type="primary"
              block
              size="large"
              icon={<ArrowRight size={17} />}
              onClick={() => navigate(ROUTE_PATHS.AUTH.LOGIN)}
              className="velica-auth-cta-btn"
            >
              Đăng nhập ngay bây giờ
            </Button>
          </div>
        )}

        {/* Bottom Switch Link */}
        <div className="velica-auth-signup-footer mt-4">
          <span className="text-slate-500">Nhớ mật khẩu của bạn? </span>
          <Link to={ROUTE_PATHS.AUTH.LOGIN} className="velica-auth-switch-link">
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};

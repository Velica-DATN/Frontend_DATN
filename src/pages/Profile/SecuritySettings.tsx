import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Row,
  Col,
  Alert,
  message,
  Tag,
} from 'antd';
import { Lock, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { mockService } from '../../api/mocks/mockService';
import { User } from '../../interfaces/velica.interfaces';

const { Title, Text } = Typography;

export const SecuritySettings: React.FC = () => {
  const [form] = Form.useForm();
  const [currentUser] = useState<User>(() => mockService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send OTP to email
  const handleSendOtp = async () => {
    try {
      await form.validateFields(['currentPassword', 'newPassword', 'confirmNewPassword']);
      const currentPwd = form.getFieldValue('currentPassword');
      const newPwd = form.getFieldValue('newPassword');

      if (currentPwd && newPwd && currentPwd === newPwd) {
        message.error('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
        return;
      }

      setOtpLoading(true);
      const res = await mockService.sendProfileSecurityOtp(currentUser.id);
      setOtpLoading(false);
      setOtpSent(true);
      setCountdown(60);
      message.success(`Mã OTP xác thực bảo mật đã được gửi đến email ${currentUser.email}`);
      message.info({
        content: `[Email Bảo Mật] Mã xác thực đổi mật khẩu của bạn là: ${res.otpCode} (Hiệu lực: 5 phút)`,
        duration: 8,
      });
    } catch (err: any) {
      setOtpLoading(false);
      message.error(err.message || 'Vui lòng điền đầy đủ và chính xác các trường mật khẩu trước khi gửi mã OTP.');
    }
  };

  // Submit Password Change with OTP confirmation
  const handleConfirmChangePassword = async () => {
    try {
      const values = await form.validateFields();
      if (!values.otp || !/^\d{6}$/.test(values.otp.trim())) {
        message.error('Vui lòng nhập chính xác mã OTP gồm 6 chữ số được gửi về email trường!');
        return;
      }

      setLoading(true);
      await mockService.changePassword(
        currentUser.id,
        values.currentPassword,
        values.newPassword,
        values.otp.trim()
      );
      setLoading(false);
      message.success('Đổi mật khẩu thành công! Email thông báo bảo mật đã được gửi về hòm thư của bạn.');
      form.resetFields();
      setOtpSent(false);
      setCountdown(0);
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.');
    }
  };

  return (
    <div className="velica-security-wrapper animate-fade-in pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <Title level={4} className="velica-page-title m-0">
          Bảo Mật & An Toàn Tài Khoản
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Quản lý mật khẩu đăng nhập tài khoản học thuật và quy trình xác thực qua email trường.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={20} lg={16} xl={14}>
          {/* Card: Change Password with Email Verification */}
          <Card bordered className="velica-profile-card">
            <div className="velica-profile-card-header">
              <div className="d-flex items-center gap-2">
                <div className="p-2 rounded-2 bg-light text-brand-color">
                  <KeyRound size={20} />
                </div>
                <div>
                  <span className="fw-bold text-dark fs-6 d-block">Đổi Mật Khẩu Đăng Nhập</span>
                  <div className="text-xs text-muted-color">Xác thực mã OTP gửi về Email trường</div>
                </div>
              </div>
              <Tag color="blue" className="text-xs">
                Bảo vệ qua Email
              </Tag>
            </div>

            <Alert
              message="Chính sách bảo mật: Mật khẩu tối thiểu 8 ký tự (gồm chữ hoa, chữ thường và chữ số). Yêu cầu xác thực OTP gửi về email trường để bảo vệ tài khoản khảo thí."
              type="info"
              showIcon
              icon={<ShieldCheck size={18} />}
              className="mb-4 rounded-3 text-xs"
            />

            <Form form={form} layout="vertical" onFinish={handleConfirmChangePassword}>
              {/* Hàng 1: Mật khẩu hiện tại */}
              <Form.Item
                name="currentPassword"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu cũ của bạn..."
                  className="velica-profile-input"
                  prefix={<Lock size={15} className="text-muted-color me-1" />}
                />
              </Form.Item>

              {/* Hàng 2: Mật khẩu mới */}
              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 8, message: 'Mật khẩu phải chứa ít nhất 8 ký tự' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Mật khẩu phải chứa cả chữ hoa, chữ thường và ít nhất một chữ số',
                  },
                ]}
              >
                <Input.Password
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)..."
                  className="velica-profile-input"
                  prefix={<Lock size={15} className="text-muted-color me-1" />}
                />
              </Form.Item>

              {/* Hàng 3: Xác nhận mật khẩu mới */}
              <Form.Item
                name="confirmNewPassword"
                label="Xác nhận mật khẩu mới"
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
                  placeholder="Nhập lại mật khẩu mới để xác nhận..."
                  className="velica-profile-input"
                  prefix={<Lock size={15} className="text-muted-color me-1" />}
                />
              </Form.Item>

              {/* Hàng 4: Mã xác thực OTP */}
              <Form.Item
                name="otp"
                label="Mã xác thực OTP qua Email trường"
                extra={
                  <div className="text-xs text-muted-color mt-1">
                    Mã xác nhận gồm 6 chữ số sẽ được gửi về: <span className="font-mono text-dark fw-semibold">{currentUser.email}</span>
                  </div>
                }
                rules={[
                  { required: true, message: 'Vui lòng nhập mã OTP xác thực' },
                  { pattern: /^\d{6}$/, message: 'Mã OTP phải gồm đúng 6 chữ số' },
                ]}
              >
                <Row gutter={10}>
                  <Col flex="1">
                    <Input
                      placeholder="Nhập 6 chữ số OTP từ email..."
                      maxLength={6}
                      className="velica-profile-input font-mono fw-semibold"
                      style={{ letterSpacing: '1px' }}
                      prefix={<Mail size={15} className="text-muted-color me-1" />}
                    />
                  </Col>
                  <Col>
                    <Button
                      type={otpSent ? 'default' : 'primary'}
                      disabled={countdown > 0 || otpLoading}
                      loading={otpLoading}
                      onClick={handleSendOtp}
                      className={!otpSent ? 'velica-btn-primary' : ''}
                      style={{ minWidth: '130px', height: '36px' }}
                    >
                      {countdown > 0 ? `Gửi lại sau (${countdown}s)` : otpSent ? 'Gửi lại mã' : 'Nhận mã OTP'}
                    </Button>
                  </Col>
                </Row>
              </Form.Item>

              {/* Nút Hoàn tất */}
              <div className="pt-2 text-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="velica-btn-primary"
                  size="large"
                  style={{ minWidth: '190px' }}
                >
                  Cập nhật mật khẩu mới
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

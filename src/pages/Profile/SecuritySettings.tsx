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
  Table,
  Tag,
  Switch,
  Space,
  Progress,
  Modal,
} from 'antd';
import { mockService } from '../../api/mocks/mockService';
import { User } from '../../interfaces/velica.interfaces';

const { Title, Text } = Typography;

interface LoginSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  time: string;
  isCurrent: boolean;
}

export const SecuritySettings: React.FC = () => {
  const [form] = Form.useForm();
  const [currentUser] = useState<User>(() => mockService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  // Active sessions mock list
  const [sessions, setSessions] = useState<LoginSession[]>([
    {
      id: 's-1',
      device: 'Chrome trên macOS (Apple Silicon)',
      ip: '14.161.22.45',
      location: 'TP. Hồ Chí Minh',
      time: 'Phiên hiện tại (Đang hoạt động)',
      isCurrent: true,
    },
    {
      id: 's-2',
      device: 'Safari trên iPhone 15 Pro',
      ip: '42.118.89.201',
      location: 'TP. Hồ Chí Minh',
      time: '2 giờ trước',
      isCurrent: false,
    },
    {
      id: 's-3',
      device: 'Microsoft Edge trên Windows 11',
      ip: '118.69.182.10',
      location: 'Đà Nẵng',
      time: '13/10/2026 14:22',
      isCurrent: false,
    },
    {
      id: 's-4',
      device: 'Chrome trên iPadOS',
      ip: '14.161.22.99',
      location: 'TP. Hồ Chí Minh',
      time: '10/10/2026 09:15',
      isCurrent: false,
    },
  ]);

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

      setTimeout(() => {
        setOtpLoading(false);
        setOtpSent(true);
        setCountdown(60);
        message.info(`Mã OTP xác thực (gợi ý: 123456) đã được gửi đến email ${currentUser.email}`);
      }, 500);
    } catch {
      message.warning('Vui lòng điền đầy đủ và chính xác 3 ô mật khẩu trước khi gửi mã OTP.');
    }
  };

  // Submit Password Change with OTP confirmation
  const handleConfirmChangePassword = async () => {
    try {
      const values = await form.validateFields();
      if (!values.otp || !/^\d{6}$/.test(values.otp)) {
        message.error('Vui lòng nhập chính xác mã OTP gồm 6 chữ số được gửi về email trường!');
        return;
      }

      if (values.currentPassword === values.newPassword) {
        message.error('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        message.success('Đổi mật khẩu thành công! Email thông báo bảo mật đã được gửi về hòm thư của bạn.');
        form.resetFields();
        setOtpSent(false);
        setCountdown(0);
      }, 600);
    } catch {
      // Form validation error
    }
  };

  // Sign out other sessions
  const handleLogoutOtherSessions = () => {
    Modal.confirm({
      title: 'Đăng xuất khỏi các thiết bị khác?',
      content: 'Tất cả 3 phiên đăng nhập trên các thiết bị khác sẽ bị đăng xuất ngay lập tức. Bạn sẽ cần đăng nhập lại trên những thiết bị đó.',
      okText: 'Xác nhận đăng xuất',
      cancelText: 'Hủy',
      onOk: () => {
        setSessions((prev) => prev.filter((s) => s.isCurrent));
        message.success('Đã đăng xuất khỏi tất cả các thiết bị khác thành công!');
      },
    });
  };

  // Toggle 2FA
  const handleToggle2FA = (checked: boolean) => {
    setTwoFactorEnabled(checked);
    if (checked) {
      message.success('Đã bật xác thực 2 bước (2FA) bảo vệ tài khoản.');
    } else {
      message.warning('Đã tắt xác thực 2 bước. Tài khoản có thể kém an toàn hơn.');
    }
  };

  // Table columns for login sessions
  const sessionColumns = [
    {
      title: 'Thiết bị & Trình duyệt',
      dataIndex: 'device',
      key: 'device',
      render: (text: string, record: LoginSession) => (
        <div>
          <div className="fw-medium text-dark">{text}</div>
          <div className="text-xs text-muted-color">Vị trí: {record.location}</div>
        </div>
      ),
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ip',
      key: 'ip',
      render: (ip: string) => <span className="font-mono text-xs">{ip}</span>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'time',
      key: 'time',
      render: (time: string, record: LoginSession) => (
        <span className={record.isCurrent ? 'text-success fw-medium' : 'text-muted-color'}>
          {time}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      align: 'right' as const,
      render: (_: unknown, record: LoginSession) =>
        record.isCurrent ? (
          <Tag color="success">Phiên hiện tại</Tag>
        ) : (
          <Tag color="default">Đã lưu</Tag>
        ),
    },
  ];

  return (
    <div className="velica-security-wrapper animate-fade-in pb-5">
      {/* Page Header */}
      <div className="mb-4">
        <Title level={4} className="velica-page-title m-0">
          Bảo Mật & An Toàn Tài Khoản
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Quản lý mật khẩu đăng nhập, quy trình xác thực qua email trường và giám sát lịch sử thiết bị truy cập.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* Left Column: Change Password & 2FA */}
        <Col xs={24} lg={12}>
          <div className="d-flex flex-col gap-4">
            {/* Card 1: Change Password with Email Verification */}
            <Card bordered className="velica-profile-card">
              <div className="velica-profile-card-header">
                <div>
                  <span className="fw-bold text-dark fs-6">Đổi Mật Khẩu Đăng Nhập</span>
                  <div className="text-xs text-muted-color">Xác thực mã OTP gửi về Email trường</div>
                </div>
                <Tag color="blue" className="text-xs">
                  Bảo vệ qua Email
                </Tag>
              </div>

              <Alert
                message="Chính sách bảo mật: Mật khẩu tối thiểu 8 ký tự (gồm chữ hoa, chữ thường và chữ số). Yêu cầu xác thực OTP gửi về email trường để bảo vệ tài khoản khảo thí."
                type="info"
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
                  />
                </Form.Item>

                {/* Hàng 2: Mật khẩu mới */}
                <Form.Item
                  name="newPassword"
                  label="Mật khẩu mới"
                  dependencies={['currentPassword']}
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                    { min: 8, message: 'Mật khẩu phải từ 8 ký tự trở lên' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (value && value === getFieldValue('currentPassword')) {
                          return Promise.reject(new Error('Mật khẩu mới không được trùng với mật khẩu hiện tại!'));
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)..."
                    className="velica-profile-input"
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
                  />
                </Form.Item>

                {/* Hàng 4: Mã xác thực OTP (Thiết kế thanh lịch, tách biệt nút bấm) */}
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
                        placeholder="Nhập 6 chữ số OTP (Ví dụ: 123456)..."
                        maxLength={6}
                        className="velica-profile-input font-mono fw-semibold"
                        style={{ letterSpacing: '1px' }}
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

            {/* Card 2: Two-Factor Authentication (2FA) */}
            <Card bordered className="velica-profile-card">
              <div className="velica-profile-card-header">
                <div>
                  <span className="fw-bold text-dark fs-6">Xác Thực Hai Yếu Tố (2FA)</span>
                  <div className="text-xs text-muted-color">Bảo vệ nâng cao cho kết quả khảo thí và quyền quản trị</div>
                </div>
                <Tag color={twoFactorEnabled ? 'success' : 'default'} className="text-xs">
                  {twoFactorEnabled ? 'Đang kích hoạt' : 'Đang tắt'}
                </Tag>
              </div>

              <div className="d-flex items-center justify-between gap-3 p-3 bg-light rounded-3">
                <div>
                  <div className="fw-semibold text-dark text-sm">
                    Yêu cầu mã xác thực khi đăng nhập từ thiết bị lạ
                  </div>
                  <div className="text-xs text-muted-color">
                    Gửi mã xác thực tự động về email trường mỗi khi phát hiện trình duyệt mới hoặc IP bất thường.
                  </div>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onChange={handleToggle2FA}
                />
              </div>
            </Card>
          </div>
        </Col>

        {/* Right Column: Login Activity & Security Health */}
        <Col xs={24} lg={12}>
          <div className="d-flex flex-col gap-4">
            {/* Card 3: Login Sessions & Activity Log */}
            <Card bordered className="velica-profile-card">
              <div className="velica-profile-card-header">
                <div>
                  <span className="fw-bold text-dark fs-6">Lịch Sử Đăng Nhập & Thiết Bị Hoạt Động</span>
                  <div className="text-xs text-muted-color">Danh sách các phiên truy cập gần đây của tài khoản</div>
                </div>
                {sessions.length > 1 && (
                  <Button
                    size="small"
                    danger
                    onClick={handleLogoutOtherSessions}
                  >
                    Đăng xuất các thiết bị khác
                  </Button>
                )}
              </div>

              <Table
                dataSource={sessions}
                columns={sessionColumns}
                rowKey="id"
                pagination={false}
                size="small"
                className="velica-clean-table"
              />

              <div className="text-xs text-muted-color mt-3">
                Nếu phát hiện thiết bị hoặc địa chỉ IP lạ, vui lòng nhấn "Đăng xuất các thiết bị khác" và đổi mật khẩu ngay lập tức.
              </div>
            </Card>

            {/* Card 4: Security Health Status */}
            <Card bordered className="velica-profile-card">
              <div className="velica-profile-card-header">
                <div>
                  <span className="fw-bold text-dark fs-6">Tổng Quan Tình Trạng An Toàn</span>
                  <div className="text-xs text-muted-color">Đánh giá mức độ bảo mật tài khoản học thuật</div>
                </div>
                <Tag color="success" className="text-xs">
                  An toàn cao
                </Tag>
              </div>

              <div className="mb-3">
                <div className="d-flex justify-between items-center mb-1 text-xs">
                  <span className="fw-medium text-dark">Điểm tin cậy bảo mật</span>
                  <span className="fw-bold text-success">95 / 100</span>
                </div>
                <Progress percent={95} strokeColor="#10b981" showInfo={false} />
              </div>

              <div className="d-flex flex-col gap-2 pt-2 border-top text-xs">
                <div className="d-flex justify-between">
                  <span className="text-muted-color">Chất lượng mật khẩu:</span>
                  <span className="fw-semibold text-dark">Độ dài đạt chuẩn (Có chữ hoa, chữ số)</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-muted-color">Lần đổi mật khẩu gần nhất:</span>
                  <span className="fw-semibold text-dark">15 ngày trước</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-muted-color">Email bảo mật liên kết:</span>
                  <span className="fw-semibold font-mono text-dark">{currentUser.email}</span>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-muted-color">Số phiên đăng nhập hoạt động:</span>
                  <span className="fw-semibold text-dark">{sessions.length} thiết bị</span>
                </div>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  );
};

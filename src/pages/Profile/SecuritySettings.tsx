import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Alert } from 'antd';
import { Lock, ShieldCheck } from 'lucide-react';

const { Title, Text } = Typography;

export const SecuritySettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    try {
      await form.validateFields();
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        message.success('Đổi mật khẩu thành công!');
        form.resetFields();
      }, 500);
    } catch {
      // form error
    }
  };

  return (
    <div className="velica-security-wrapper animate-fade-in">
      <div className="mb-4">
        <Title level={4} className="velica-page-title">
          Bảo Mật & Đổi Mật Khẩu
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Thay đổi mật khẩu đăng nhập định kỳ để bảo vệ tài khoản và kết quả khảo thí.
        </Text>
      </div>

      <Card bordered className="velica-profile-card">
        <Alert
          message="Yêu cầu về mật khẩu an toàn"
          description="Mật khẩu tối thiểu 8 ký tự, bao gồm chữ hoa, chữ thường và chữ số để đảm bảo tính an toàn cho tài khoản học thuật."
          type="info"
          showIcon
          className="mb-4 rounded-3"
        />

        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password
              prefix={<Lock size={16} className="text-muted-color" />}
              placeholder="Nhập mật khẩu cũ..."
              className="velica-profile-input"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Mật khẩu phải từ 8 ký tự trở lên' },
            ]}
          >
            <Input.Password
              prefix={<Lock size={16} className="text-muted-color" />}
              placeholder="Nhập mật khẩu mới..."
              className="velica-profile-input"
            />
          </Form.Item>

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
              prefix={<Lock size={16} className="text-muted-color" />}
              placeholder="Nhập lại mật khẩu mới..."
              className="velica-profile-input"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<ShieldCheck size={16} />}
            loading={loading}
            className="velica-btn-primary mt-2"
          >
            Cập nhật mật khẩu mới
          </Button>
        </Form>
      </Card>
    </div>
  );
};

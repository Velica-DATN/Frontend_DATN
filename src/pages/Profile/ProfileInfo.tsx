import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Row, Col, Avatar, message, Tag } from 'antd';
import { User, Mail, Phone, Building, Save } from 'lucide-react';
import { mockService } from '../../api/mocks/mockService';
import { ROLE_LABELS } from '../../constants/roleConstants';

const { Title, Text } = Typography;

export const ProfileInfo: React.FC = () => {
  const [form] = Form.useForm();
  const currentUser = mockService.getCurrentUser();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      fullName: currentUser.fullName,
      username: currentUser.username,
      email: currentUser.email,
      department: currentUser.department || 'Khoa Công Nghệ Phần Mềm',
      phoneNumber: currentUser.phoneNumber || '0912345678',
    });
  }, [currentUser, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await mockService.updateUser(currentUser.id, values);
      setTimeout(() => {
        setLoading(false);
        message.success('Cập nhật thông tin hồ sơ cá nhân thành công!');
      }, 400);
    } catch {
      // form error
    }
  };

  return (
    <div className="velica-profile-wrapper animate-fade-in">
      <div className="mb-4">
        <Title level={4} className="velica-page-title">
          Hồ Sơ Thông Tin Cá Nhân
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Quản lý thông tin định danh, khoa phụ trách và số điện thoại liên lạc.
        </Text>
      </div>

      <Card bordered className="velica-profile-card">
        <div className="velica-profile-avatar-row">
          <Avatar size={72} className="velica-profile-avatar">
            {currentUser.fullName.split(' ').pop()?.[0] || 'U'}
          </Avatar>

          <div>
            <div className="d-flex items-center gap-2">
              <Title level={4} className="m-0 fw-bold text-dark">
                {currentUser.fullName}
              </Title>
              <Tag className="velica-tag-pill bg-brand text-brand-color border-0">
                {ROLE_LABELS[currentUser.role]}
              </Tag>
            </div>
            <Text type="secondary" className="velica-cell-desc">
              @{currentUser.username} | {currentUser.email}
            </Text>
          </div>
        </div>

        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="fullName"
                label="Họ và tên hiển thị"
                rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
              >
                <Input prefix={<User size={16} className="text-muted-color" />} className="velica-profile-input" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="username" label="Tên đăng nhập (Username)">
                <Input disabled className="velica-profile-input" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email trường"
                rules={[{ required: true }, { type: 'email' }]}
              >
                <Input prefix={<Mail size={16} className="text-muted-color" />} className="velica-profile-input" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="phoneNumber" label="Số điện thoại di động">
                <Input prefix={<Phone size={16} className="text-muted-color" />} className="velica-profile-input" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="department" label="Khoa / Bộ môn phụ trách">
            <Input prefix={<Building size={16} className="text-muted-color" />} className="velica-profile-input" />
          </Form.Item>

          <div className="text-end mt-3">
            <Button
              type="primary"
              htmlType="submit"
              icon={<Save size={16} />}
              loading={loading}
              className="velica-btn-primary"
            >
              Lưu thay đổi hồ sơ
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

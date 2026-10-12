import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Form,
  Input,
  Select,
  Tag,
  message,
} from 'antd';
import { Send } from 'lucide-react';
import { mockService } from '../../../api/mocks/mockService';
import { SystemNotification } from '../../../interfaces/velica.interfaces';

const { Title, Text } = Typography;

export const NotificationManager: React.FC = () => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getNotifications();
    setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async () => {
    try {
      const values = await form.validateFields();
      await mockService.createNotification({
        title: values.title,
        message: values.message,
        recipientScope: values.recipientScope,
        sentBy: mockService.getCurrentUser().fullName,
      });
      message.success('Đã phát thông báo hệ thống thành công tới người dùng!');
      setDrawerOpen(false);
      form.resetFields();
      loadData();
    } catch {
      // form error
    }
  };

  const columns = [
    {
      title: 'Tiêu đề thông báo',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: SystemNotification) => (
        <div>
          <Text strong className="velica-cell-title">{title}</Text>
          <Text type="secondary" className="velica-cell-desc">{record.message}</Text>
        </div>
      ),
    },
    {
      title: 'Phạm vi gửi',
      dataIndex: 'recipientScope',
      key: 'recipientScope',
      render: (scope: string) => {
        if (scope === 'ALL') return <Tag color="blue" className="velica-tag-pill">Toàn trường</Tag>;
        if (scope === 'TEACHERS') return <Tag color="orange" className="velica-tag-pill">Giảng viên</Tag>;
        return <Tag color="green" className="velica-tag-pill">Sinh viên</Tag>;
      },
    },
    {
      title: 'Người gửi',
      dataIndex: 'sentBy',
      key: 'sentBy',
      render: (sentBy: string) => <span className="velica-cell-desc">{sentBy}</span>,
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => <span className="velica-cell-desc">{date.split('T')[0]}</span>,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title">
            Quản trị & Phát Thông Báo Hệ Thống
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Gửi thông báo nhanh, nhắc nhở kỳ thi hoặc lịch bảo trì máy chủ tới sinh viên và giảng viên.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Send size={16} />}
          onClick={() => {
            form.resetFields();
            form.setFieldsValue({ recipientScope: 'ALL' });
            setDrawerOpen(true);
          }}
          className="velica-btn-primary"
        >
          Soạn thông báo mới
        </Button>
      </div>

      <div className="velica-card-table">
        <Table
          dataSource={notifications}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Compose Notification Drawer */}
      <Drawer
        title="Soạn & Phát thông báo hệ thống"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)} className="velica-btn-action">
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleSend}
              className="velica-btn-primary"
            >
              Gửi thông báo ngay
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="recipientScope"
            label="Đối tượng nhận thông báo"
            rules={[{ required: true }]}
          >
            <Select className="velica-form-input">
              <Select.Option value="ALL">Tất cả người dùng (Toàn trường)</Select.Option>
              <Select.Option value="TEACHERS">Chỉ Giảng viên</Select.Option>
              <Select.Option value="STUDENTS">Chỉ Sinh viên</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="Tiêu đề thông báo"
            rules={[{ required: true, message: 'Nhập tiêu đề' }]}
          >
            <Input placeholder="Vd: Thông báo lịch thi kết thúc học phần đợt 1" className="velica-form-input" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Nội dung chi tiết"
            rules={[{ required: true, message: 'Nhập nội dung thông báo' }]}
          >
            <Input.TextArea rows={5} placeholder="Nhập nội dung cần truyền đạt..." className="velica-form-input" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

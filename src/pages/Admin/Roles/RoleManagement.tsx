import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Form,
  Input,
  Checkbox,
  Tag,
  Card,
  message,
} from 'antd';
import { Plus, Edit } from 'lucide-react';
import { ROLE } from '../../../constants/roleConstants';

const { Title, Text } = Typography;

interface RoleItem {
  id: string;
  name: string;
  code: string;
  description: string;
  userCount: number;
  permissions: {
    manageUsers: boolean;
    manageClasses: boolean;
    manageAssessments: boolean;
    gradeSubmissions: boolean;
    manageSystem: boolean;
  };
}

export const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

  const [form] = Form.useForm();

  useEffect(() => {
    // Initial RBAC Roles Data
    setRoles([
      {
        id: 'r-admin',
        name: 'Quản trị viên (Admin)',
        code: ROLE.ADMIN,
        description: 'Toàn quyền cấu hình hệ thống, quản trị người dùng, sao lưu và bảo trì',
        userCount: 4,
        permissions: {
          manageUsers: true,
          manageClasses: true,
          manageAssessments: true,
          gradeSubmissions: true,
          manageSystem: true,
        },
      },
      {
        id: 'r-teacher',
        name: 'Giảng viên (Teacher)',
        code: ROLE.TEACHER,
        description: 'Quản lý học phần, ngân hàng câu hỏi, tổ chức kỳ thi và chấm điểm bài nộp',
        userCount: 86,
        permissions: {
          manageUsers: false,
          manageClasses: true,
          manageAssessments: true,
          gradeSubmissions: true,
          manageSystem: false,
        },
      },
      {
        id: 'r-student',
        name: 'Sinh viên (Student)',
        code: ROLE.STUDENT,
        description: 'Tham gia lớp học phần, làm bài kiểm tra trực tuyến và xem kết quả bảng điểm',
        userCount: 1150,
        permissions: {
          manageUsers: false,
          manageClasses: false,
          manageAssessments: false,
          gradeSubmissions: false,
          manageSystem: false,
        },
      },
    ]);
  }, []);

  const handleOpenCreate = () => {
    setEditingRole(null);
    form.resetFields();
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (role: RoleItem) => {
    setEditingRole(role);
    form.setFieldsValue({
      name: role.name,
      description: role.description,
      manageUsers: role.permissions.manageUsers,
      manageClasses: role.permissions.manageClasses,
      manageAssessments: role.permissions.manageAssessments,
      gradeSubmissions: role.permissions.gradeSubmissions,
      manageSystem: role.permissions.manageSystem,
    });
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingRole) {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === editingRole.id
              ? {
                  ...r,
                  name: values.name,
                  description: values.description,
                  permissions: {
                    manageUsers: Boolean(values.manageUsers),
                    manageClasses: Boolean(values.manageClasses),
                    manageAssessments: Boolean(values.manageAssessments),
                    gradeSubmissions: Boolean(values.gradeSubmissions),
                    manageSystem: Boolean(values.manageSystem),
                  },
                }
              : r
          )
        );
        message.success('Cập nhật phân quyền vai trò thành công!');
      } else {
        const newRole: RoleItem = {
          id: `r-${Date.now()}`,
          name: values.name,
          code: 'CUSTOM_ROLE',
          description: values.description || '',
          userCount: 0,
          permissions: {
            manageUsers: Boolean(values.manageUsers),
            manageClasses: Boolean(values.manageClasses),
            manageAssessments: Boolean(values.manageAssessments),
            gradeSubmissions: Boolean(values.gradeSubmissions),
            manageSystem: Boolean(values.manageSystem),
          },
        };
        setRoles((prev) => [...prev, newRole]);
        message.success('Tạo vai trò phân quyền mới thành công!');
      }
      setIsDrawerOpen(false);
    } catch {
      // form error
    }
  };

  const columns = [
    {
      title: 'Tên vai trò',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: RoleItem) => (
        <div>
          <Text strong className="velica-cell-title">{name}</Text>
          <Text type="secondary" className="velica-cell-desc">{record.description}</Text>
        </div>
      ),
    },
    {
      title: 'Số người dùng',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count: number) => <Tag color="geekblue" className="velica-tag-pill">{count} tài khoản</Tag>,
    },
    {
      title: 'Ma trận quyền hạn',
      key: 'permissions',
      render: (_: unknown, record: RoleItem) => (
        <Space size={6} wrap>
          {record.permissions.manageUsers && <Tag color="red" className="velica-tag-pill">Users</Tag>}
          {record.permissions.manageClasses && <Tag color="blue" className="velica-tag-pill">Classes</Tag>}
          {record.permissions.manageAssessments && <Tag color="geekblue" className="velica-tag-pill">Assessments</Tag>}
          {record.permissions.gradeSubmissions && <Tag color="green" className="velica-tag-pill">Grading</Tag>}
          {record.permissions.manageSystem && <Tag color="gold" className="velica-tag-pill">System</Tag>}
        </Space>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: RoleItem) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Edit size={16} className="text-brand-color" />}
            onClick={() => handleOpenEdit(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title">
            Phân quyền Vai trò & Quyền hạn (RBAC)
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Quản lý ma trận phân quyền truy cập tính năng theo vai trò người dùng trong hệ thống.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
          className="velica-btn-primary"
        >
          Tạo vai trò mới
        </Button>
      </div>

      <div className="velica-card-table">
        <Table dataSource={roles} columns={columns} rowKey="id" pagination={false} scroll={{ x: 'max-content' }} />
      </div>

      {/* Create / Edit Role Drawer */}
      <Drawer
        title={editingRole ? 'Chỉnh sửa ma trận quyền hạn' : 'Tạo vai trò mới'}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerOpen(false)} className="velica-btn-action">
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              Lưu vai trò
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên vai trò" rules={[{ required: true }]}>
            <Input placeholder="Vd: Thanh tra Khảo thí (Exam Inspector)" className="velica-form-input" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả phạm vi quyền">
            <Input.TextArea rows={3} placeholder="Mô tả nhiệm vụ của vai trò..." className="velica-form-input" />
          </Form.Item>

          <Card size="small" title="Cấp quyền truy cập modules" className="velica-admin-card">
            <Space direction="vertical" size={10} className="w-100">
              <Form.Item name="manageUsers" valuePropName="checked" noStyle>
                <Checkbox>Quản lý người dùng & cấp tài khoản</Checkbox>
              </Form.Item>
              <Form.Item name="manageClasses" valuePropName="checked" noStyle>
                <Checkbox>Quản lý lớp học & thành viên</Checkbox>
              </Form.Item>
              <Form.Item name="manageAssessments" valuePropName="checked" noStyle>
                <Checkbox>Tạo & Xuất bản đề thi</Checkbox>
              </Form.Item>
              <Form.Item name="gradeSubmissions" valuePropName="checked" noStyle>
                <Checkbox>Chấm điểm & Duyệt phúc khảo</Checkbox>
              </Form.Item>
              <Form.Item name="manageSystem" valuePropName="checked" noStyle>
                <Checkbox>Cấu hình hệ thống & Bảo trì</Checkbox>
              </Form.Item>
            </Space>
          </Card>
        </Form>
      </Drawer>
    </div>
  );
};

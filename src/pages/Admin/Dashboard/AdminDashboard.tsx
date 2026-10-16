import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, Space, Alert } from 'antd';
import {
  Users,
  ShieldCheck,
  Server,
  Activity,
  ArrowRight,
  Settings,
  FileText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { StatCard } from '../../../components/velica/StatCard/StatCard';
import { AuditLogItem } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text } = Typography;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const isMaintenance = mockService.isMaintenanceMode();

  useEffect(() => {
    const fetchLogs = async () => {
      const logs = await mockService.getAuditLogs();
      setAuditLogs(logs.slice(0, 5));
    };
    fetchLogs();
  }, []);

  const auditColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (ts: string) => <span className="font-mono fs-12 text-muted-color">{ts}</span>,
    },
    {
      title: 'Tài khoản',
      dataIndex: 'userName',
      key: 'userName',
      render: (name: string, record: AuditLogItem) => (
        <div>
          <Text strong className="velica-cell-title">{name}</Text>
          <Tag color="geekblue" className="ms-1 velica-tag-pill">{record.userRole}</Tag>
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      render: (act: string) => <Tag color="blue">{act}</Tag>,
    },
    {
      title: 'Chi tiết nghiệp vụ',
      dataIndex: 'details',
      key: 'details',
      render: (d: string) => <span className="text-sm">{d}</span>,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div>
          <Title level={4} className="velica-page-title">
            Tổng quan Quản trị Hệ thống
          </Title>
          <Text className="velica-page-desc d-block">
            Quản trị người dùng, phân quyền vai trò, kiểm toán an toàn và chế độ bảo trì toàn trường.
          </Text>
        </div>
        <Space>
          <Button
            icon={<FileText size={15} />}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
          >
            Nhật ký Audit
          </Button>
          <Button
            type="primary"
            icon={<Users size={15} />}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
          >
            Quản lý Người dùng
          </Button>
        </Space>
      </div>

      {isMaintenance && (
        <Alert
          message="Hệ thống đang bật Chế độ Bảo trì (Maintenance Mode)"
          description="Người dùng không thuộc nhóm Quản trị viên sẽ thấy thông báo tạm dừng dịch vụ."
          type="error"
          showIcon
          className="mb-4 rounded-3"
        />
      )}

      {/* Sleek Compact Metrics Row */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng người dùng"
            value="1,240"
            trend={{ value: '14%', isPositive: true, label: 'kỳ này' }}
            sparkline="up"
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Chế độ bảo trì"
            value={isMaintenance ? 'ĐANG BẬT' : 'BÌNH THƯỜNG'}
            subtext={isMaintenance ? 'Đang tạm dừng dịch vụ' : 'Hệ thống sẵn sàng'}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.MAINTENANCE)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Lớp học phần"
            value="48"
            subtext="HK1 - Khóa 2026-2027"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đề thi đã xuất bản"
            value="112"
            subtext="9 đề chờ duyệt"
          />
        </Col>
      </Row>

      {/* Sleek Operational Quick Actions */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} md={8}>
          <div
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
            className="velica-quick-action-card cursor-pointer"
          >
            <div className="velica-quick-action-icon text-brand-color">
              <Users size={18} />
            </div>
            <div className="flex-1">
              <span className="velica-cell-title">Quản lý Người dùng</span>
              <span className="velica-cell-desc">Cấp quyền, khóa tài khoản</span>
            </div>
            <ArrowRight size={14} className="text-muted-color" />
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div
            onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
            className="velica-quick-action-card cursor-pointer"
          >
            <div className="velica-quick-action-icon text-info">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <span className="velica-cell-title">Nhật ký Hệ thống</span>
              <span className="velica-cell-desc">Theo dõi kiểm toán an toàn dữ liệu</span>
            </div>
            <ArrowRight size={14} className="text-muted-color" />
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div
            onClick={() => navigate(ROUTE_PATHS.ADMIN.MAINTENANCE)}
            className="velica-quick-action-card cursor-pointer"
          >
            <div className="velica-quick-action-icon text-danger">
              <Settings size={18} />
            </div>
            <div className="flex-1">
              <span className="velica-cell-title">Chế độ Bảo trì</span>
              <span className="velica-cell-desc">Bật/tắt bảo trì máy chủ</span>
            </div>
            <ArrowRight size={14} className="text-muted-color" />
          </div>
        </Col>
      </Row>

      {/* Recent Audit Logs preview */}
      <Card
        title={
          <div className="d-flex items-center justify-between">
            <span className="font-semibold text-primary-color">Nhật ký Vận hành Gần nhất (Audit Trail)</span>
            <Button
              type="link"
              onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
              className="p-0 font-medium text-brand-color"
            >
              Xem tất cả nhật ký <ArrowRight size={13} className="ml-1" />
            </Button>
          </div>
        }
        className="velica-card"
      >
        <Table
          dataSource={auditLogs}
          columns={auditColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

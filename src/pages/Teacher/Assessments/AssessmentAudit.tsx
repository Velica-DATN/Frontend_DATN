import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Tag, Card } from 'antd';
import { ArrowLeft, History } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { AuditLogItem } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text } = Typography;

export const AssessmentAudit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await mockService.getAuditLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, [id]);

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (ts: string) => <span className="font-mono text-xs">{ts}</span>,
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'userName',
      key: 'userName',
      render: (name: string, record: AuditLogItem) => (
        <div>
          <Text strong className="text-primary-color">{name}</Text>
          <Tag color="geekblue" className="ml-1 text-xs">{record.userRole}</Tag>
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
      title: 'Nội dung chi tiết thay đổi',
      dataIndex: 'details',
      key: 'details',
      render: (details: string) => <span className="text-sm">{details}</span>,
    },
    {
      title: 'Địa chỉ IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 130,
      render: (ip: string) => <span className="font-mono text-xs text-muted-color">{ip}</span>,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS)}
          className="velica-back-btn"
        >
          Quay lại danh sách đề thi
        </Button>
      </div>

      <div className="mb-4">
        <Title level={4} className="velica-page-title">
          Nhật ký Hoạt động Đề thi (Assessment Audit Trail)
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Ghi nhận toàn bộ thao tác xuất bản, chỉnh sửa cấu hình, chấm bài và điều chỉnh điểm số nhằm đảm bảo tính minh bạch.
        </Text>
      </div>

      <div className="velica-card-table">
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </div>
    </div>
  );
};

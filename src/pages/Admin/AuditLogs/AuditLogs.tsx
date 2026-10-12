import React, { useState, useEffect } from 'react';
import { Table, Typography, Tag } from 'antd';
import { mockService } from '../../../api/mocks/mockService';
import { AuditLogItem } from '../../../interfaces/velica.interfaces';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';

const { Title, Text } = Typography;

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const data = await mockService.getAuditLogs();
      setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
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
      render: (act: string) => <Tag color="blue" className="velica-tag-pill">{act}</Tag>,
    },
    {
      title: 'Loại thực thể',
      dataIndex: 'entityType',
      key: 'entityType',
      render: (type: string) => <Tag color="default" className="velica-tag-pill">{type}</Tag>,
    },
    {
      title: 'Chi tiết thay đổi',
      dataIndex: 'details',
      key: 'details',
      render: (details: string) => <span className="velica-cell-desc">{details}</span>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => <span className="velica-audit-ip-tag px-2 py-1">{ip}</span>,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <Title level={4} className="velica-page-title">
          Nhật ký Kiểm toán Toàn Hệ thống (System Audit Logs)
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Ghi nhận toàn bộ thao tác thêm, sửa, xóa, xuất bản và chấm điểm trên hệ thống Velica theo chuẩn bảo mật ISO/IEC 27001.
        </Text>
      </div>

      <FilterBar
        placeholder="Tìm kiếm theo tên người dùng, hành động hoặc nội dung..."
        onSearchChange={setSearch}
      />

      <div className="velica-card-table">
        <Table
          dataSource={filteredLogs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};

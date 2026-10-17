import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Tooltip,
} from 'antd';
import {
  Plus,
  Edit,
  Trash2,
  Award,
  Eye,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Rubric } from '../../../interfaces/velica.interfaces';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text } = Typography;

export const RubricList: React.FC = () => {
  const navigate = useNavigate();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getRubrics();
    setRubrics(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string) => {
    await mockService.deleteRubric(id);
    message.success('Đã xóa Rubric thành công.');
    loadData();
  };

  const filteredRubrics = rubrics.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-xs text-secondary-color">#{idx + 1}</span>
      ),
    },
    {
      title: 'Tên thang tiêu chí Rubric',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: Rubric) => (
        <div className="overflow-hidden min-w-0">
          <span
            className="velica-cell-title text-truncate d-block cursor-pointer hover:text-brand-color transition-colors font-semibold"
            onClick={() => navigate(`/teacher/rubrics/${record.id}`)}
            title={title}
          >
            {title}
          </span>
          <span className="velica-cell-desc d-block text-truncate text-muted-color" title={record.description}>
            {record.description}
          </span>
        </div>
      ),
    },
    {
      title: 'Số tiêu chí đánh giá',
      dataIndex: 'criteria',
      key: 'criteria',
      width: 160,
      render: (crit: Rubric['criteria']) => <span>{crit?.length || 0} tiêu chí</span>,
    },
    {
      title: 'Điểm tối đa',
      key: 'maxPoints',
      width: 130,
      render: (_: unknown, record: Rubric) => {
        const total = record.criteria?.reduce((acc, c) => acc + (c.maxPoints || 0), 0) || 0;
        return <Tag color="geekblue" className="font-semibold">{total} điểm</Tag>;
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => <span className="text-xs text-muted-color font-mono">{date.split('T')[0]}</span>,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 135,
      fixed: 'right' as const,
      align: 'center' as const,
      render: (_: unknown, record: Rubric) => (
        <Space size={4}>
          <Tooltip title="Xem chi tiết & Bảng ma trận Rubric">
            <Button
              type="text"
              size="small"
              className="btn-action-icon"
              icon={<Eye size={15} color="#0284c7" />}
              onClick={() => navigate(`/teacher/rubrics/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Chỉnh sửa thang Rubric & Mức điểm">
            <Button
              type="text"
              size="small"
              className="btn-action-icon"
              icon={<Edit size={15} color="#475569" />}
              onClick={() => navigate(`/teacher/rubrics/${record.id}/edit`)}
            />
          </Tooltip>
          <Popconfirm
            title="Xác nhận xóa Rubric này?"
            description="Lưu ý: Không thể hoàn tác sau khi xóa."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" className="btn-action-icon" danger icon={<Trash2 size={15} />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div>
          <Title level={4} className="velica-page-title">
            Quản lý Rubric Chấm Tự Luận
          </Title>
          <Text className="velica-page-desc d-block">
            Xây dựng ma trận tiêu chí đánh giá và mức độ thành thạo phục vụ chấm bài thi tự luận khách quan, chính xác.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.RUBRICS_CREATE)}
          className="velica-btn-primary"
        >
          Tạo Rubric mới
        </Button>
      </div>

      <FilterBar
        placeholder="Tìm kiếm theo tên hoặc mô tả Rubric..."
        onSearchChange={setSearch}
      />

      <div className="velica-table-container">
        <Table
          dataSource={filteredRubrics}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ['8', '15', '25'],
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} rubric`,
          }}
          scroll={{ x: 800 }}
        />
      </div>
    </div>
  );
};

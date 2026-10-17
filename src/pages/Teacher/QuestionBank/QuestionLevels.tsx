import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Tag,
} from 'antd';
import { Plus, ArrowLeft, Edit, Trash2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { QuestionLevel } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { QUESTION_DIFFICULTY } from '../../../constants/assessmentConstants';

const { Title, Text } = Typography;

export const QuestionLevels: React.FC = () => {
  const navigate = useNavigate();
  const [levels, setLevels] = useState<QuestionLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<QuestionLevel | null>(null);

  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const data = await mockService.getQuestionLevels();
    setLevels(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingLevel(null);
    form.resetFields();
    form.setFieldsValue({ weight: 1, levelKey: QUESTION_DIFFICULTY.MEDIUM });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (lvl: QuestionLevel) => {
    setEditingLevel(lvl);
    form.setFieldsValue({
      name: lvl.name,
      levelKey: lvl.levelKey,
      weight: lvl.weight,
      description: lvl.description,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingLevel) {
        await mockService.updateQuestionLevel(editingLevel.id, values);
        message.success('Cập nhật mức độ câu hỏi thành công!');
      } else {
        await mockService.createQuestionLevel(values);
        message.success('Tạo mức độ câu hỏi mới thành công!');
      }
      setIsModalOpen(false);
      loadData();
    } catch {
      // form error
    }
  };

  // Backlog Domain 3 Item 18: Block delete if in use
  const handleDelete = async (lvl: QuestionLevel) => {
    if (lvl.inUseCount > 0) {
      Modal.error({
        title: 'Không thể xóa mức độ câu hỏi!',
        icon: <AlertCircle size={22} color="#DC2626" />,
        content: `Mức độ "${lvl.name}" hiện đang được sử dụng trong ${lvl.inUseCount} câu hỏi trong ngân hàng. Bạn cần điều chỉnh các câu hỏi này sang mức độ khác trước khi xóa.`,
        okText: 'Đã hiểu',
      });
      return;
    }

    try {
      await mockService.deleteQuestionLevel(lvl.id);
      message.success('Đã xóa mức độ câu hỏi thành công.');
      loadData();
    } catch (err: unknown) {
      message.error((err as Error).message);
    }
  };

  const columns = [
    {
      title: 'Tên mức độ',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: QuestionLevel) => (
        <div>
          <span className="velica-cell-title">{name}</span>
          <span className="velica-cell-desc d-block">{record.description}</span>
        </div>
      ),
    },
    {
      title: 'Mã định danh',
      dataIndex: 'levelKey',
      key: 'levelKey',
      render: (key: string) => <Tag color="blue">{key}</Tag>,
    },
    {
      title: 'Hệ số trọng số',
      dataIndex: 'weight',
      key: 'weight',
      render: (weight: number) => <span className="velica-cell-weight">x{weight}</span>,
    },
    {
      title: 'Số câu hỏi đang dùng',
      dataIndex: 'inUseCount',
      key: 'inUseCount',
      render: (count: number) => (
        <Tag color={count > 0 ? 'geekblue' : 'default'}>{count} câu hỏi</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: unknown, record: QuestionLevel) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Edit size={16} color="#475569" />}
            onClick={() => handleOpenEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.QUESTION_BANK)}
          className="velica-back-btn"
        >
          Quay lại Ngân hàng câu hỏi
        </Button>
      </div>

      <div className="velica-page-header">
        <div>
          <Title level={4} className="velica-page-title">
            Quản lý Mức độ Câu hỏi
          </Title>
          <Text className="velica-page-desc d-block">
            Thiết lập thang độ khó nhận thức theo thang đo Bloom để tự động hóa tạo đề thi.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={handleOpenCreate}
          className="velica-btn-primary"
        >
          Thêm mức độ mới
        </Button>
      </div>

      <div className="velica-card-table">
        <Table
          dataSource={levels}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </div>

      {/* Create / Edit Drawer */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              {editingLevel ? 'Chỉnh sửa mức độ câu hỏi' : 'Thêm mức độ câu hỏi mới'}
            </div>
            <div className="velica-drawer-subtitle">
              Phân loại cấp độ Bloom và xác định hệ số trọng số tương ứng.
            </div>
          </div>
        }
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        width={480}
        extra={
          <Space>
            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              onClick={handleFormSubmit}
              className="velica-btn-primary"
            >
              {editingLevel ? 'Lưu thay đổi' : 'Tạo mức độ'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" className="velica-drawer-form">
          <Form.Item
            name="name"
            label="Tên mức độ hiển thị"
            rules={[{ required: true, message: 'Nhập tên mức độ' }]}
          >
            <Input placeholder="Vd: Vận dụng" />
          </Form.Item>

          <div className="velica-form-row">
            <Form.Item
              name="levelKey"
              label="Mã phân loại"
              rules={[{ required: true }]}
              className="velica-form-col-flex"
            >
              <Select>
                <Select.Option value={QUESTION_DIFFICULTY.EASY}>EASY</Select.Option>
                <Select.Option value={QUESTION_DIFFICULTY.MEDIUM}>MEDIUM</Select.Option>
                <Select.Option value={QUESTION_DIFFICULTY.HARD}>HARD</Select.Option>
                <Select.Option value={QUESTION_DIFFICULTY.VERY_HARD}>VERY_HARD</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="weight"
              label="Hệ số trọng số"
              rules={[{ required: true }]}
              className="velica-form-col-fixed-md"
            >
              <InputNumber min={1} max={10} className="w-100" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Mô tả tiêu chuẩn mức độ">
            <Input.TextArea rows={3} placeholder="Mô tả đặc điểm câu hỏi thuộc mức độ này..." />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

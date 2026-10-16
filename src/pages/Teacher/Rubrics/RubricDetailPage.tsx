import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Spin,
} from 'antd';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Award,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Rubric, RubricCriteria, RubricLevel } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const RubricDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadRubric(id);
    }
  }, [id]);

  const loadRubric = async (rubricId: string) => {
    setLoading(true);
    const data = await mockService.getRubricById(rubricId);
    if (data) {
      setRubric(data);
    } else {
      message.error('Không tìm thấy Rubric!');
      navigate(ROUTE_PATHS.TEACHER.RUBRICS);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await mockService.deleteRubric(id);
    message.success('Đã xóa Rubric thành công.');
    navigate(ROUTE_PATHS.TEACHER.RUBRICS);
  };

  if (loading || !rubric) {
    return (
      <div className="text-center py-5">
        <Spin size="large" />
        <div className="mt-2 text-muted-color">Đang tải thang điểm Rubric...</div>
      </div>
    );
  }

  const totalMaxPoints = rubric.criteria?.reduce((acc, c) => acc + (c.maxPoints || 0), 0) || 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 60 }}>
      {/* Top Header Bar */}
      <div className="d-flex items-center justify-between flex-wrap gap-3 mb-4">
        <Space size="middle">
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate(ROUTE_PATHS.TEACHER.RUBRICS)}>
            Quay lại danh mục
          </Button>
          <div>
            <div className="d-flex items-center gap-2">
              <Award size={20} className="text-brand-color" />
              <Title level={4} className="m-0">
                {rubric.title}
              </Title>
            </div>
            <Text className="text-muted-color text-xs">
              Mã Rubric: {rubric.id} &bull; Ngày tạo: {rubric.createdAt?.split('T')[0]}
            </Text>
          </div>
        </Space>

        <Space size="middle">
          <Button
            type="primary"
            icon={<Edit size={16} />}
            onClick={() => navigate(`/teacher/rubrics/${rubric.id}/edit`)}
            className="velica-btn-primary"
          >
            Chỉnh sửa Rubric
          </Button>
          <Popconfirm
            title="Xác nhận xóa Rubric này?"
            description="Lưu ý: Không thể hoàn tác sau khi xóa."
            onConfirm={handleDelete}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<Trash2 size={16} />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      </div>

      {/* Description & Overview Metadata */}
      <Card className="velica-card mb-4 border shadow-xs">
        <div className="d-flex justify-between items-start flex-wrap gap-3">
          <div className="flex-1">
            <div className="text-xs text-muted-color font-semibold uppercase mb-1">Mục đích & Hướng dẫn sử dụng</div>
            <Paragraph className="text-primary-color mb-3" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {rubric.description || 'Thang tiêu chí chấm tự luận chuẩn hóa theo khung đánh giá học phần.'}
            </Paragraph>
            <div className="d-flex gap-2 flex-wrap">
              <Tag color="geekblue" className="font-semibold py-0.5 px-2">
                {rubric.criteria?.length || 0} Tiêu chí đánh giá
              </Tag>
              <Tag color="purple" className="font-semibold py-0.5 px-2">
                Tổng thang điểm: {totalMaxPoints} điểm
              </Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* Clean Academic Rubric Matrix Table */}
      <Card
        className="velica-card border shadow-xs"
        title={
          <div className="d-flex items-center justify-between py-1">
            <span className="font-bold text-primary-color">
              Bảng Ma Trận Tiêu Chí & Các Mức Điểm Thành Thạo
            </span>
            <Tag color="blue" className="font-semibold text-xs m-0">
              {rubric.criteria?.length || 0} Tiêu chí
            </Tag>
          </div>
        }
      >
        <div className="table-responsive">
          <table className="table table-bordered align-middle text-xs mb-0">
            <thead style={{ backgroundColor: '#F8FAFC' }}>
              <tr>
                <th style={{ width: '22%', minWidth: 200 }} className="py-2.5 px-3">
                  Tiêu chí đánh giá
                </th>
                <th style={{ width: '10%', minWidth: 90 }} className="text-center py-2.5 px-2">
                  Điểm tối đa
                </th>
                <th style={{ minWidth: 520 }} className="py-2.5 px-3">
                  Mô tả các mức điểm đạt được (Performance Levels)
                </th>
              </tr>
            </thead>
            <tbody>
              {rubric.criteria?.map((crit: RubricCriteria, cIdx: number) => (
                <tr key={crit.id || cIdx}>
                  <td className="align-top py-3 px-3">
                    <div className="font-bold text-sm text-primary-color mb-1">
                      #{cIdx + 1}. {crit.title}
                    </div>
                  </td>
                  <td className="text-center align-top py-3 px-2 font-bold text-brand-color fs-6">
                    {crit.maxPoints}đ
                  </td>
                  <td className="py-3 px-3">
                    <div className="d-flex gap-2 flex-wrap">
                      {crit.levels?.map((lvl: RubricLevel, lIdx: number) => {
                        const levelColors = [
                          { bg: '#F0FDF4', border: '#BBF7D0', badge: '#16A34A', text: '#15803D' },
                          { bg: '#EFF6FF', border: '#BFDBFE', badge: '#0284C7', text: '#0369A1' },
                          { bg: '#FFFBEB', border: '#FDE68A', badge: '#D97706', text: '#B45309' },
                          { bg: '#FFF1F2', border: '#FECDD3', badge: '#E11D48', text: '#BE123C' },
                        ];
                        const scheme = levelColors[lIdx % levelColors.length];

                        return (
                          <div
                            key={lvl.id || lIdx}
                            className="p-2.5 rounded-2 border flex-1"
                            style={{
                              minWidth: 160,
                              backgroundColor: scheme.bg,
                              borderColor: scheme.border,
                            }}
                          >
                            <div className="d-flex justify-between items-center mb-1.5">
                              <span className="font-bold text-xs" style={{ color: scheme.text }}>
                                {lvl.label}
                              </span>
                              <span
                                className="badge text-white text-xs px-2 py-0.5 rounded-pill"
                                style={{ backgroundColor: scheme.badge }}
                              >
                                {lvl.score}đ
                              </span>
                            </div>
                            <div
                              className="text-xs text-secondary-color"
                              style={{ lineHeight: '1.45' }}
                            >
                              {lvl.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

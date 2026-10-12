import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tag,
  Popconfirm,
  message,
  Divider,
  Row,
  Col,
  Spin,
  Tooltip,
} from 'antd';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Award,
  CheckCircle2,
  Sliders,
  Sparkles,
  Printer,
  Copy,
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

  // Interactive Scoring Simulator state
  const [selectedLevels, setSelectedLevels] = useState<Record<string, number>>({});

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
      // Pre-select the highest level for simulation
      const initialSelected: Record<string, number> = {};
      data.criteria?.forEach((crit) => {
        if (crit.levels && crit.levels.length > 0) {
          initialSelected[crit.id] = crit.levels[0].score;
        }
      });
      setSelectedLevels(initialSelected);
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

  // Simulator score
  const simulatedScore = Object.values(selectedLevels).reduce((acc, s) => acc + s, 0);
  const simulatedPercent = totalMaxPoints > 0 ? Math.round((simulatedScore / totalMaxPoints) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 60 }}>
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

      {/* Overview Metadata Cards */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} md={16}>
          <Card className="velica-card-spec h-100">
            <div className="text-xs text-muted-color font-semibold uppercase mb-1">Mục đích & Hướng dẫn sử dụng</div>
            <Paragraph className="text-primary-color mb-3" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {rubric.description || 'Không có mô tả chi tiết.'}
            </Paragraph>
            <div className="d-flex gap-2 flex-wrap">
              <Tag color="geekblue" className="font-semibold py-0.5 px-2">
                {rubric.criteria?.length || 0} Tiêu chí đánh giá
              </Tag>
              <Tag color="purple" className="font-semibold py-0.5 px-2">
                Thang điểm tối đa: {totalMaxPoints} điểm
              </Tag>
              <Tag color="green" className="font-semibold py-0.5 px-2">
                Đã chuẩn hóa mức độ Bloom
              </Tag>
            </div>
          </Card>
        </Col>

        {/* Interactive Simulator Box */}
        <Col xs={24} md={8}>
          <Card className="velica-card-spec h-100 bg-light border-primary">
            <div className="d-flex items-center gap-1.5 mb-2">
              <Sparkles size={16} className="text-brand-color" />
              <span className="font-bold text-xs text-primary-color">Trình Thử Nghiệm Chấm Điểm (Simulator):</span>
            </div>
            <div className="text-xs text-muted-color mb-3">
              Nhấp trực tiếp vào các ô mức độ trong bảng ma trận bên dưới để xem cách hệ thống tự động cộng dồn điểm số!
            </div>
            <div className="p-3 bg-white rounded-2 border d-flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-color">Điểm mô phỏng</div>
                <div className="fs-3 font-bold text-brand-color">
                  {simulatedScore.toFixed(1)} / {totalMaxPoints}đ
                </div>
              </div>
              <div className="text-end">
                <div className="text-xs text-muted-color">Tỷ lệ đạt</div>
                <span className="badge bg-primary text-white text-sm font-semibold">
                  {simulatedPercent}%
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Full Matrix View Table */}
      <Card
        className="velica-card-spec shadow-sm"
        title={
          <div className="d-flex items-center justify-between py-1">
            <span className="font-bold text-primary-color">
              Bảng Ma Trận Tiêu Chí & Các Mức Điểm Thành Thạo Chi Tiết
            </span>
            <Text className="text-muted-color text-xs">
              (Nhấp chuột vào từng ô mức điểm để thử nghiệm thang tính)
            </Text>
          </div>
        }
      >
        <div className="table-responsive">
          <table className="table table-bordered align-middle text-xs mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ width: '22%', minWidth: 200 }}>Tiêu chí đánh giá</th>
                <th style={{ width: '10%', minWidth: 90 }} className="text-center">
                  Điểm tối đa
                </th>
                <th style={{ minWidth: 500 }}>Bảng Mô tả Các Mức Điểm Đạt Được (Click chọn để thử tính)</th>
              </tr>
            </thead>
            <tbody>
              {rubric.criteria?.map((crit: RubricCriteria, cIdx: number) => {
                const currentCritScore = selectedLevels[crit.id];

                return (
                  <tr key={crit.id || cIdx}>
                    <td className="align-top py-3">
                      <div className="font-bold text-sm text-primary-color mb-1">
                        #{cIdx + 1}. {crit.title}
                      </div>
                      <div className="text-muted-color text-xs">
                        Điểm đang chọn: <span className="font-bold text-brand-color">{currentCritScore ?? 0}đ</span>
                      </div>
                    </td>
                    <td className="text-center align-top py-3 font-bold text-brand-color fs-6">
                      {crit.maxPoints}đ
                    </td>
                    <td className="py-3">
                      <div className="d-flex gap-2 flex-wrap">
                        {crit.levels?.map((lvl: RubricLevel) => {
                          const isSelected = currentCritScore === lvl.score;

                          return (
                            <div
                              key={lvl.id}
                              onClick={() =>
                                setSelectedLevels((prev) => ({
                                  ...prev,
                                  [crit.id]: lvl.score,
                                }))
                              }
                              className={`p-2.5 rounded-2 border flex-1 cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-primary-subtle border-primary shadow-xs'
                                  : 'bg-white border-light-subtle hover-bg-light'
                              }`}
                              style={{ minWidth: 160 }}
                            >
                              <div className="d-flex justify-between items-center mb-1.5">
                                <span
                                  className={`font-bold text-xs ${
                                    isSelected ? 'text-brand-color' : 'text-primary-color'
                                  }`}
                                >
                                  {lvl.label}
                                </span>
                                <span
                                  className={`badge ${
                                    isSelected ? 'bg-primary text-white' : 'bg-secondary text-white'
                                  } text-xs`}
                                >
                                  {lvl.score}đ
                                </span>
                              </div>
                              <div
                                className="text-xs text-muted-color"
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
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

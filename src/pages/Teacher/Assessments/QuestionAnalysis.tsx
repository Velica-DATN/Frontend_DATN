import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Tag, Card, Row, Col, Alert } from 'antd';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Target,
  Award,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { QuestionDifficultyStat } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatCard } from '../../../components/velica/StatCard/StatCard';

const { Title, Text } = Typography;

export const QuestionAnalysis: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<QuestionDifficultyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await mockService.getQuestionStats();
      setStats(data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const psychometricsChartData = stats.map((q) => ({
    name: q.questionId,
    pVal: q.correctRate,
    dIdx: Math.round(q.discriminationIndex * 100),
  }));

  const bloomDistributionData = [
    { level: 'Nhớ (Recall)', count: 2, avgRate: 94.2, color: '#16A34A' },
    { level: 'Hiểu (Comprehend)', count: 2, avgRate: 82.5, color: '#0284C7' },
    { level: 'Vận dụng (Apply)', count: 1, avgRate: 68.4, color: '#D97706' },
    { level: 'Phân tích (Analyze)', count: 1, avgRate: 52.0, color: '#DC2626' },
  ];

  const columns = [
    {
      title: 'Mã & Nội dung câu hỏi',
      dataIndex: 'content',
      key: 'content',
      render: (content: string, record: QuestionDifficultyStat) => (
        <div>
          <span className="font-semibold text-primary-color d-block">{content}</span>
          <span className="velica-cell-desc">Mã: {record.questionId} | {record.totalAttempts} lượt làm</span>
        </div>
      ),
    },
    {
      title: 'Mức độ Bloom',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 140,
      render: (diff: string) => {
        if (diff === 'EASY') return <Tag color="green">Nhớ (Dễ)</Tag>;
        if (diff === 'MEDIUM') return <Tag color="blue">Hiểu (TB)</Tag>;
        if (diff === 'HARD') return <Tag color="orange">Vận dụng (Khó)</Tag>;
        return <Tag color="purple">Phân tích (Cực khó)</Tag>;
      },
    },
    {
      title: 'Tỷ lệ đúng (P-value)',
      dataIndex: 'correctRate',
      key: 'correctRate',
      width: 150,
      render: (rate: number) => (
        <div>
          <span className="font-semibold text-primary-color">{rate}%</span>
          <span className="text-xs text-muted-color d-block">P = {(rate / 100).toFixed(2)}</span>
        </div>
      ),
    },
    {
      title: 'Thời gian TB',
      dataIndex: 'avgTimeSeconds',
      key: 'avgTimeSeconds',
      width: 120,
      render: (secs: number) => <span>{secs} giây</span>,
    },
    {
      title: 'Chỉ số phân biệt (D)',
      dataIndex: 'discriminationIndex',
      key: 'discriminationIndex',
      width: 160,
      render: (idx: number) => (
        <div>
          <span className={idx >= 0.4 ? 'font-semibold text-success-color' : 'font-semibold text-warning-color'}>
            {idx.toFixed(2)}
          </span>
          <span className="text-xs text-muted-color d-block">
            {idx >= 0.4 ? 'Phân loại rất tốt' : idx >= 0.2 ? 'Tạm chấp nhận' : 'Kém'}
          </span>
        </div>
      ),
    },
    {
      title: 'Khuyến nghị sư phạm (CTT)',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 180,
      render: (rec: string) => {
        if (rec === 'OK') return <Tag color="success">Đạt chuẩn khảo thí</Tag>;
        if (rec === 'TOO_EASY') return <Tag color="warning">Quá dễ, cần tinh chỉnh</Tag>;
        return <Tag color="error">Cần xem lại phương án nhiễu</Tag>;
      },
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
          Phân tích Độ khó & Chất lượng Câu hỏi (Item Psychometrics & CTT)
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Dựa trên lý thuyết khảo thí cổ điển (Classical Test Theory): Đánh giá tỷ lệ đúng (P-value), chỉ số phân biệt (D-index) và phát hiện các phương án gây nhiễu.
        </Text>
      </div>

      {/* Psychometrics KPI Cards Row */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Độ tin cậy Cronbach's Alpha"
            value="0.84"
            icon={<Award size={20} />}
            trend={{ value: 'Rất cao', isPositive: true, label: 'chuẩn quốc tế' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Chỉ số phân biệt TB (D)"
            value="0.58"
            icon={<TrendingUp size={20} />}
            trend={{ value: '≥ 0.40', isPositive: true, label: 'phân loại xuất sắc' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tỷ lệ câu hỏi đạt chuẩn CTT"
            value="92.5%"
            icon={<Target size={20} />}
            subtext="5 / 6 câu đạt chuẩn vàng"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tỷ lệ làm đúng TB (P-value)"
            value="72.4%"
            icon={<FileCheck size={20} />}
            subtext="Độ khó vừa sức sinh viên"
          />
        </Col>
      </Row>

      {/* Pedagogical Quality Diagnostics Card */}
      <div className="velica-diagnostic-card">
        <div className="velica-diagnostic-header">
          <div className="d-flex items-center gap-2">
            <span className="velica-diagnostic-badge">
              <Sparkles size={14} /> Chẩn đoán Khảo thí & Khuyến nghị Cải tiến Ngân hàng Câu hỏi
            </span>
          </div>
          <Tag color="blue" className="m-0 font-semibold text-xs">
            Độ tin cậy Alpha = 0.84
          </Tag>
        </div>

        <div className="velica-diagnostic-item">
          <div className="velica-diagnostic-title">
            <div className="d-flex items-center gap-2">
              <CheckCircle2 size={16} className="text-success-color" />
              <span>Câu hỏi phân hóa xuất sắc nhất: Q-104 (P = 42%, D = 0.62)</span>
            </div>
            <Tag color="success">D = 0.62 (Rất tốt)</Tag>
          </div>
          <div className="velica-diagnostic-desc">
            Câu hỏi Q-104 phân loại cực tốt giữa nhóm sinh viên top 27% điểm cao và nhóm trung bình. 92% sinh viên giỏi trả lời đúng trong khi chỉ 30% sinh viên trung bình trả lời đúng.
          </div>
          <div className="velica-diagnostic-action">
            <Lightbulb size={16} />
            <span>
              <strong>Gợi ý lưu trữ:</strong> Giữ nguyên câu hỏi trong Ngân hàng đề thi dùng cho các kỳ thi Phân loại & Tuyển chọn nâng cao.
            </span>
          </div>
        </div>

        <div className="velica-diagnostic-item">
          <div className="velica-diagnostic-title">
            <div className="d-flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning-color" />
              <span>Câu hỏi cần nâng cao độ phân biệt: Q-102 (P = 95%, D = 0.15)</span>
            </div>
            <Tag color="warning">Quá dễ (P = 0.95)</Tag>
          </div>
          <div className="velica-diagnostic-desc">
            95% sinh viên trả lời đúng câu này, chỉ số phân biệt D = 0.15 dưới ngưỡng khuyến nghị (0.20). Các phương án gây nhiễu (distractors) quá lộ liễu, không kiểm tra được chiều sâu nhận thức.
          </div>
          <div className="velica-diagnostic-action">
            <Lightbulb size={16} />
            <span>
              <strong>Gợi ý điều chỉnh:</strong> Sửa lại 2 phương án sai (distractors) để tăng tính kích thích tư duy phản biện và giảm khả năng đoán mò.
            </span>
          </div>
        </div>
      </div>

      {/* Psychometrics Recharts Charts Row */}
      <Row gutter={[20, 20]} className="mb-4">
        {/* Chart 1: P-value vs D-index */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <span className="font-bold text-sm">Biểu đồ Tương quan Độ khó (P) & Phân biệt (D)</span>
                <span className="text-xs text-muted-color">Theo từng câu hỏi</span>
              </div>
            }
            className="velica-card"
          >
            <div className="velica-chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={psychometricsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip">
                            <div className="velica-chart-tooltip-title">Câu hỏi {data.name}</div>
                            <div className="velica-chart-tooltip-item">
                              <span>Tỷ lệ đúng (P):</span>
                              <strong>{data.pVal}%</strong>
                            </div>
                            <div className="velica-chart-tooltip-item">
                              <span>Độ phân biệt (D):</span>
                              <strong className={data.dIdx >= 40 ? 'text-success-color' : 'text-warning-color'}>
                                {(data.dIdx / 100).toFixed(2)}
                              </strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <ReferenceLine y={40} stroke="#16A34A" strokeDasharray="3 3" label={{ value: 'D chuẩn (0.40)', position: 'insideTopLeft', fill: '#16A34A', fontSize: 10 }} />
                  <Bar dataKey="pVal" name="Tỷ lệ làm đúng P (%)" fill="#0284C7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="dIdx" name="Độ phân biệt D (x100)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Chart 2: Bloom Cognitive Level Breakdown */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <span className="font-bold text-sm">Tỷ lệ chính xác theo Thang đo Bloom</span>
                <span className="text-xs text-muted-color">4 Bậc nhận thức</span>
              </div>
            }
            className="velica-card"
          >
            <div className="velica-chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bloomDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="level" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip">
                            <div className="velica-chart-tooltip-title">{data.level}</div>
                            <div className="velica-chart-tooltip-item">
                              <span>Số lượng câu:</span>
                              <strong>{data.count} câu</strong>
                            </div>
                            <div className="velica-chart-tooltip-item">
                              <span>Độ đúng trung bình:</span>
                              <strong>{data.avgRate}%</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgRate" name="Tỷ lệ đúng TB (%)" radius={[4, 4, 0, 0]}>
                    {bloomDistributionData.map((entry, index) => (
                      <Cell key={`bloom-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Psychometrics Table */}
      <div className="velica-card-table">
        <Table
          dataSource={stats}
          columns={columns}
          rowKey="questionId"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>
    </div>
  );
};


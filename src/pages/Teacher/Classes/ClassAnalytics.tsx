import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Table, Tag, message } from 'antd';
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
  Download,
  Award,
  TrendingUp,
  Users,
  Target,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { ClassMember, ClassRoom } from '../../../interfaces/velica.interfaces';
import { ProgressBar as BsProgressBar } from 'react-bootstrap';
import { StatCard } from '../../../components/velica/StatCard/StatCard';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Text } = Typography;

export const ClassAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { classId } = useParams<{ classId: string }>();
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);

  useEffect(() => {
    // Unify flow: Redirect directly to the comprehensive analytics tab in ClassDetail
    navigate(
      ROUTE_PATHS.TEACHER.CLASS_DETAIL.replace(':id', classId || 'cls-101') + '?tab=analytics',
      { replace: true }
    );
  }, [classId, navigate]);

  const handleExportExcel = () => {
    message.loading('Đang khởi tạo tệp báo cáo Excel...');
    setTimeout(() => {
      message.success(`Đã xuất bảng điểm và thống kê lớp ${currentClass?.code || 'SE301'} ra file Excel thành công!`);
    }, 800);
  };

  const memberRankColumns = [
    {
      title: 'Hạng',
      key: 'rank',
      render: (_: unknown, __: unknown, index: number) => (
        <span className={index < 3 ? 'font-semibold text-warning-color' : 'font-semibold text-muted-color'}>
          #{index + 1}
        </span>
      ),
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (name: string) => <Text strong className="text-primary-color">{name}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Điểm trung bình',
      dataIndex: 'averageScore',
      key: 'averageScore',
      render: (score?: number) => (
        <Tag color={score && score >= 8.5 ? 'green' : score && score >= 7 ? 'blue' : 'orange'}>
          {score !== undefined ? `${score} / 10` : '—'}
        </Tag>
      ),
    },
  ];

  // Academic Score Distribution Data (Histogram)
  const scoreDistributionData = [
    { range: '< 5.0 (Yếu)', count: 2, percentage: 5.3, color: '#DC2626' },
    { range: '5.0 - 6.4 (TB)', count: 4, percentage: 10.5, color: '#D97706' },
    { range: '6.5 - 7.9 (Khá)', count: 11, percentage: 28.9, color: '#2563EB' },
    { range: '8.0 - 8.9 (Giỏi)', count: 12, percentage: 31.6, color: '#4F46E5' },
    { range: '9.0 - 10 (Xuất sắc)', count: 9, percentage: 23.7, color: '#16A34A' },
  ];

  // CLO Attainment vs Benchmark (ABET Standard: 70%)
  const cloAttainmentData = [
    {
      clo: 'CLO1: SOLID & Clean Arch',
      attainment: 89.4,
      benchmark: 70.0,
      status: 'Đạt chuẩn',
      diff: '+19.4%',
    },
    {
      clo: 'CLO2: Microservices Design',
      attainment: 76.2,
      benchmark: 70.0,
      status: 'Đạt chuẩn',
      diff: '+6.2%',
    },
    {
      clo: 'CLO3: Saga Transactions',
      attainment: 64.8,
      benchmark: 70.0,
      status: 'Cần can thiệp',
      diff: '-5.2%',
    },
  ];

  return (
    <div className="animate-fade-in">
      <Button
        type="text"
        icon={<ArrowLeft size={16} />}
        onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASSES)}
        className="velica-back-btn"
      >
        Quay lại danh sách lớp
      </Button>

      {/* Modern Untitled UI Header */}
      <div className="velica-hero-banner">
        <div className="velica-hero-header">
          <div>
            <div className="d-flex items-center gap-2 flex-wrap mb-2">
              <span className="velica-badge-indigo">
                {currentClass?.code || 'SE301.P01'}
              </span>
              <span className="velica-badge-gray">
                {members.length} Sinh viên
              </span>
            </div>

            <h1 className="velica-hero-title">
              Báo cáo Phân tích Chuẩn đầu ra (CLO) & Năng lực Lớp học
            </h1>
            <p className="velica-hero-meta">
              <span>Lớp: <strong>{currentClass?.name || 'Kiến trúc Phần mềm'}</strong></span>
              <span>Đề cương: <strong>{currentClass?.syllabusName || 'CNTT-K24'}</strong></span>
            </p>
          </div>

          <Button
            type="primary"
            icon={<Download size={15} />}
            onClick={handleExportExcel}
            className="velica-btn-primary"
          >
            Xuất báo cáo Excel
          </Button>
        </div>
      </div>

      {/* StatCards Row */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Điểm trung bình toàn lớp"
            value="8.16 / 10"
            icon={<Award size={20} />}
            trend={{ value: '+0.4', isPositive: true, label: 'so với kỳ trước' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tỷ lệ đạt chuẩn (≥ 5.0)"
            value="94.7%"
            icon={<TrendingUp size={20} />}
            trend={{ value: '36/38', isPositive: true, label: 'sinh viên đạt' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Điểm cao nhất"
            value="9.8 / 10"
            icon={<Target size={20} />}
            subtext="Phạm Thu Thảo"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng số bài nộp khảo thí"
            value="76"
            icon={<Users size={20} />}
            subtext="2 kỳ thi đã tổ chức"
          />
        </Col>
      </Row>

      {/* Academic Performance Tiers Overview */}
      <Card
        title={
          <div className="d-flex items-center justify-between">
            <div className="d-flex items-center gap-2">
              <TrendingUp size={16} className="text-brand-color" />
              <span className="font-bold text-sm">Phân tầng Học lực & Tiến độ Đạt chuẩn Đầu ra</span>
            </div>
            <Tag color="blue" className="m-0 font-semibold text-xs">
              38 Sinh viên • 3 Chuẩn CLO
            </Tag>
          </div>
        }
        className="velica-card mb-4"
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-between items-center mb-1">
                <span className="text-xs text-secondary-color font-semibold">Xuất sắc & Giỏi (&ge; 8.5)</span>
                <Tag color="green" className="m-0 font-bold">36.8%</Tag>
              </div>
              <div className="fs-18 font-bold text-emerald-600">14 SV</div>
              <BsProgressBar variant="success" now={36.8} className="velica-progress-bar-sm mt-2" />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-between items-center mb-1">
                <span className="text-xs text-secondary-color font-semibold">Khá (7.0 - 8.4)</span>
                <Tag color="blue" className="m-0 font-bold">47.4%</Tag>
              </div>
              <div className="fs-18 font-bold text-brand-color">18 SV</div>
              <BsProgressBar variant="primary" now={47.4} className="velica-progress-bar-sm mt-2" />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-between items-center mb-1">
                <span className="text-xs text-secondary-color font-semibold">Trung bình (5.0 - 6.9)</span>
                <Tag color="orange" className="m-0 font-bold">10.5%</Tag>
              </div>
              <div className="fs-18 font-bold text-amber-600">4 SV</div>
              <BsProgressBar variant="warning" now={10.5} className="velica-progress-bar-sm mt-2" />
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="p-3 bg-light rounded-3 border">
              <div className="d-flex justify-between items-center mb-1">
                <span className="text-xs text-secondary-color font-semibold">Cần cố gắng (&lt; 5.0)</span>
                <Tag color="default" className="m-0 font-bold">5.3%</Tag>
              </div>
              <div className="fs-18 font-bold text-rose-600">2 SV</div>
              <BsProgressBar variant="danger" now={5.3} className="velica-progress-bar-sm mt-2" />
            </div>
          </Col>
        </Row>
      </Card>

      {/* CLO Achievement & Score Distribution Charts Row */}
      <Row gutter={[20, 20]} className="mb-4">
        {/* Score Distribution Chart */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <span className="font-bold text-sm">Phổ điểm phân bố (Score Distribution)</span>
                <span className="text-xs text-muted-color">N = 38 Sinh viên</span>
              </div>
            }
            className="velica-card"
          >
            <div className="velica-chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip">
                            <div className="velica-chart-tooltip-title">{data.range}</div>
                            <div className="velica-chart-tooltip-item">
                              <span>Số sinh viên:</span>
                              <strong>{data.count} SV</strong>
                            </div>
                            <div className="velica-chart-tooltip-item">
                              <span>Tỷ lệ:</span>
                              <strong>{data.percentage}%</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {scoreDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="velica-chart-meta-row">
              <span>Điểm TB: <strong className="text-primary-color">8.16</strong></span>
              <span>Trung vị (Median): <strong className="text-primary-color">8.40</strong></span>
              <span>Độ lệch chuẩn: <strong className="text-primary-color">1.12</strong></span>
              <span>Tỷ lệ đạt (&ge;5.0): <strong className="text-success-color">94.7%</strong></span>
            </div>
          </Card>
        </Col>

        {/* CLO Attainment vs Benchmark Target */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <span className="font-bold text-sm">Đo lường Chuẩn đầu ra (CLO Attainment vs Target)</span>
                <span className="text-xs text-muted-color">Chuẩn ABET: 70%</span>
              </div>
            }
            className="velica-card"
          >
            <div className="velica-chart-wrapper">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={cloAttainmentData} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="clo"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={0}
                    tickFormatter={(val) => val.split(':')[0]}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip">
                            <div className="velica-chart-tooltip-title">{data.clo}</div>
                            <div className="velica-chart-tooltip-item">
                              <span>Thực tế đạt:</span>
                              <strong className={data.attainment >= 70 ? 'text-success-color' : 'text-danger-color'}>
                                {data.attainment}%
                              </strong>
                            </div>
                            <div className="velica-chart-tooltip-item">
                              <span>Ngưỡng chuẩn:</span>
                              <strong>{data.benchmark}%</strong>
                            </div>
                            <div className="velica-chart-tooltip-item">
                              <span>Trạng thái:</span>
                              <strong>{data.status} ({data.diff})</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="4 4" label={{ value: 'Chuẩn 70%', position: 'top', fill: '#EF4444', fontSize: 10 }} />
                  <Bar dataKey="attainment" name="Thực tế đạt (%)" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="benchmark" name="Ngưỡng chuẩn (70%)" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="velica-chart-meta-row">
              <span>CLO1: <strong className="text-success-color">89.4% (Vượt 19.4%)</strong></span>
              <span>CLO2: <strong className="text-info-color">76.2% (Vượt 6.2%)</strong></span>
              <span>CLO3: <strong className="text-danger-color">64.8% (Thiếu 5.2%)</strong></span>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Top Students Table */}
      <Card
        title={<span className="font-bold text-sm">Bảng xếp hạng sinh viên trong lớp</span>}
        className="velica-card-table"
      >
        <Table
          dataSource={members}
          columns={memberRankColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </div>
  );
};

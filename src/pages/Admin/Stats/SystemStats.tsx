import React from 'react';
import { Card, Row, Col, Typography, Button, message } from 'antd';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import { Download, GraduationCap, Award, Server, ShieldCheck, Activity } from 'lucide-react';
import { StatCard } from '../../../components/velica/StatCard/StatCard';

const { Title, Text } = Typography;

export const SystemStats: React.FC = () => {
  const handleExport = () => {
    message.loading('Đang trích xuất dữ liệu toàn trường...');
    setTimeout(() => {
      message.success('Đã tải xuống file báo cáo khảo thí tổng thể trường (Excel)!');
    }, 800);
  };

  const facultyData = [
    { faculty: 'CN Phần mềm', count: 480, percentage: 40, color: '#4F46E5' },
    { faculty: 'HT Thông tin', count: 360, percentage: 30, color: '#0284C7' },
    { faculty: 'KH Máy tính', count: 240, percentage: 20, color: '#16A34A' },
    { faculty: 'Mạng & TT', count: 120, percentage: 10, color: '#D97706' },
  ];

  const latencyData = [
    { hour: '08:00', ms: 18 },
    { hour: '10:00', ms: 24 },
    { hour: '12:00', ms: 15 },
    { hour: '14:00', ms: 32 },
    { hour: '16:00', ms: 28 },
    { hour: '18:00', ms: 14 },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title">
            Thống kê Hoạt động & Hạ tầng Toàn trường
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Báo cáo tổng hợp số lượng đề thi, lưu lượng truy cập và chỉ số hoàn thành học phần theo thời gian thực.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<Download size={16} />}
          onClick={handleExport}
          className="velica-btn-publish"
        >
          Xuất báo cáo Excel
        </Button>
      </div>

      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tổng lượt làm bài thi"
            value="4,820"
            icon={<Award size={20} />}
            trend={{ value: '+18.4%', isPositive: true, label: 'kỳ này' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tỷ lệ nộp bài đúng hạn"
            value="96.8%"
            icon={<GraduationCap size={20} />}
            trend={{ value: 'Rất tốt', isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tỷ lệ đạt chuẩn đầu ra (CLO)"
            value="88.2%"
            subtext="Toàn trường đạt yêu cầu"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tài nguyên máy chủ sử dụng"
            value="18.5 GB"
            icon={<Server size={20} />}
            subtext="Dung lượng đề thi & bài nộp"
          />
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <span className="font-bold text-sm">Phân bổ sinh viên theo Khoa (Faculty Distribution)</span>
                <span className="text-xs text-muted-color">Tổng: 1,200 SV</span>
              </div>
            }
            bordered
            className="velica-admin-card"
          >
            <div className="velica-chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={facultyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="faculty" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip">
                            <div className="velica-chart-tooltip-title">{data.faculty}</div>
                            <div className="velica-chart-tooltip-item">
                              <span>Số sinh viên:</span>
                              <strong>{data.count} SV</strong>
                            </div>
                            <div className="velica-chart-tooltip-item">
                              <span>Tỷ trọng:</span>
                              <strong>{data.percentage}%</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {facultyData.map((entry, index) => (
                      <Cell key={`fac-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="velica-chart-meta-row">
              <span>CNPM: <strong className="text-primary-color">480 SV (40%)</strong></span>
              <span>HTTT: <strong className="text-info-color">360 SV (30%)</strong></span>
              <span>KHMT: <strong className="text-success-color">240 SV (20%)</strong></span>
              <span>MMT: <strong className="text-warning-color">120 SV (10%)</strong></span>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <span className="font-bold text-sm">Độ trễ API Gateway & Tải hệ thống (Latency ms)</span>
                <span className="text-xs text-muted-color">Trung bình &lt; 25ms</span>
              </div>
            }
            bordered
            className="velica-admin-card"
          >
            <div className="velica-chart-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={latencyData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 40]} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip">
                            <div className="velica-chart-tooltip-title">Thời điểm {data.hour}</div>
                            <div className="velica-chart-tooltip-item">
                              <span>Độ trễ phản hồi:</span>
                              <strong>{data.ms} ms</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="ms" name="Độ trễ (ms)" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="velica-chart-meta-row">
              <span>API Gateway: <strong className="text-success-color">99.9% Uptime</strong></span>
              <span>PostgreSQL Cluster: <strong className="text-success-color">100% Sẵn sàng</strong></span>
              <span>Auto-save: <strong className="text-success-color">99.98% Thành công</strong></span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};


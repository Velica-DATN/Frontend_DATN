import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Row, Col, Space, Tag } from 'antd';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  FileCheck2,
  Clock,
  Sparkles,
  BookOpen,
  Activity,
  Plus,
  GraduationCap,
  FileEdit,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../../../components/velica/StatCard/StatCard';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment, Submission } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { GRADING_STATUS } from '../../../constants/assessmentConstants';

export const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [asms, subs] = await Promise.all([
        mockService.getAssessments(),
        mockService.getSubmissions(),
      ]);
      setAssessments(asms);
      setSubmissions(subs);
      setLoading(false);
    };
    fetchData();
  }, []);

  const assessmentColumns = [
    {
      title: 'Tên bài kiểm tra / Đề thi',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Assessment) => (
        <div>
          <span className="velica-cell-title">{title}</span>
          <span className="velica-cell-desc d-block">{record.className || 'SE301 - Nhóm 01'}</span>
        </div>
      ),
    },
    {
      title: 'Hình thức',
      dataIndex: 'type',
      key: 'type',
      width: 95,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Thời lượng',
      dataIndex: 'timeLimitMinutes',
      key: 'timeLimitMinutes',
      width: 100,
      render: (mins: number) => `${mins > 0 ? `${mins} phút` : 'Tự do'}`,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 140,
      align: 'right' as const,
      render: (_: unknown, record: Assessment) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            className="p-0 font-medium text-brand-color"
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_MONITOR.replace(':id', record.id))}
          >
            Giám sát
          </Button>
          <Button
            type="link"
            size="small"
            className="p-0 font-medium text-brand-color"
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_RESULTS.replace(':id', record.id))}
          >
            Kết quả
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* 1. Header Banner */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h2 className="velica-page-title">
            Bảng điều khiển Giảng viên 👋
          </h2>
          <p className="velica-page-desc">
            Chào mừng Thầy Nguyễn Văn An • Hệ thống Quản lý Khảo thí & Chuẩn đầu ra Học thuật (Học kỳ 2, 2026-2027)
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<Plus size={15} />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_BUILDER)}
            className="velica-btn-primary"
          >
            Soạn đề thi mới
          </Button>
          <Button
            icon={<BookOpen size={15} />}
            onClick={() => navigate(ROUTE_PATHS.TEACHER.QUESTION_BANK)}
            className="velica-btn-action"
          >
            Ngân hàng câu hỏi
          </Button>
        </div>
      </div>

      {/* 2. Core Academic KPIs Row */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tỷ lệ nộp bài đúng hạn"
            value="96.4%"
            trend={{ value: '+2.1%', isPositive: true, label: 'so với kỳ trước' }}
            sparkline="up"
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đạt chuẩn đầu ra (CLO)"
            value="84.5%"
            trend={{ value: 'Mục tiêu ≥ 70%', isPositive: true, label: 'chuẩn ABET' }}
            sparkline="up"
            onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASSES)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Điểm trung bình toàn khóa"
            value="8.18 / 10"
            subtext="Phổ điểm Gaussian chuẩn hóa"
            onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASSES)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Độ tin cậy đề thi (Cronbach's α)"
            value="0.84"
            subtext="Độ phân loại đề thi: Rất tốt"
            sparkline="up"
            onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS)}
          />
        </Col>
      </Row>

      {/* 3. Main Content Sections */}
      <Row gutter={[16, 16]}>
        {/* Left Column: Recent Assessments & Class Attainment */}
        <Col xs={24} lg={15}>
          <Space direction="vertical" size={16} className="w-100">
            {/* Recent Assessments Table */}
            <Card
              title={
                <div className="d-flex items-center gap-2">
                  <Activity size={17} className="text-brand-color" />
                  <span className="font-bold text-primary-color">
                    Đề thi & Kỳ kiểm tra gần đây
                  </span>
                </div>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  className="p-0 font-medium text-brand-color"
                  onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS)}
                >
                  Xem tất cả đề thi &rarr;
                </Button>
              }
            >
              <Table
                dataSource={assessments}
                columns={assessmentColumns}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="middle"
              />
            </Card>

            {/* Class Attainment Chart Overview */}
            <Card
              title={
                <div className="d-flex items-center gap-2">
                  <GraduationCap size={17} className="text-brand-color" />
                  <span className="font-bold text-primary-color">
                    Tiến độ Đạt chuẩn Đầu ra (CLO) theo Lớp phụ trách
                  </span>
                </div>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  className="p-0 font-medium text-brand-color"
                  onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASSES)}
                >
                  Quản lý lớp học &rarr;
                </Button>
              }
            >
              {/* Mini Bar Chart: CLO Attainment vs 70% ABET Benchmark */}
              <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>% Đạt chuẩn đầu ra (CLO Attainment)</span>
                <span className="text-danger-color font-semibold">--- Ngưỡng ABET: 70%</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={[
                    { name: 'SE301 CLO1', val: 89, class: 'SE301.P01' },
                    { name: 'SE301 CLO2', val: 76, class: 'SE301.P01' },
                    { name: 'SE301 CLO3', val: 65, class: 'SE301.P01' },
                    { name: 'SE302 CLO1', val: 84, class: 'SE302.P01' },
                    { name: 'SE302 CLO2', val: 81, class: 'SE302.P01' },
                  ]}
                  margin={{ top: 5, right: 5, left: -30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip">
                            <div className="velica-chart-tooltip-title">{d.name}</div>
                            <div className="velica-chart-tooltip-item">
                              <span>Lớp:</span><strong>{d.class}</strong>
                            </div>
                            <div className="velica-chart-tooltip-item">
                              <span>Đạt:</span>
                              <strong className={d.val >= 70 ? 'text-success-color' : 'text-danger-color'}>{d.val}%</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="4 4" />
                  <Bar dataKey="val" radius={[3, 3, 0, 0]}>
                    {[89, 76, 65, 84, 81].map((val, idx) => (
                      <Cell key={`cell-${idx}`} fill={val >= 70 ? '#4F46E5' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ fontSize: 11, color: '#64748B', marginTop: 6, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#4F46E5', marginRight: 4 }}/>Đạt chuẩn (≥70%)</span>
                <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: '#EF4444', marginRight: 4 }}/>Chưa đạt (&lt;70%)</span>
              </div>
            </Card>
          </Space>
        </Col>

        {/* Right Column: Pending Academic Tasks & Diagnostics */}
        <Col xs={24} lg={9}>
          <Space direction="vertical" size={16} className="w-100">
            {/* Actionable Pending Tasks Queue */}
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <div className="d-flex items-center gap-2">
                    <Clock size={17} className="text-warning-color" />
                    <span className="font-bold text-primary-color">
                      Việc cần xử lý ngay
                    </span>
                  </div>
                  <Tag color="error">3 việc</Tag>
                </div>
              }
            >
              <div className="velica-task-item">
                <div className="velica-task-item-start">
                  <div className="velica-task-item-icon velica-task-item-icon-amber">
                    <FileCheck2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="velica-task-item-title">Chấm bài tự luận (1 bài)</div>
                    <div className="velica-task-item-desc">Kiểm Tra Giữa Kỳ — SV Trần Thị Mai</div>
                  </div>
                </div>
                <Button
                  type="primary"
                  size="small"
                  className="velica-btn-primary"
                  onClick={() => {
                    const asmId = assessments[0]?.id || 'asm-1';
                    navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_GRADING.replace(':id', asmId));
                  }}
                >
                  Chấm ngay
                </Button>
              </div>

              <div className="velica-task-item">
                <div className="velica-task-item-start">
                  <div className="velica-task-item-icon velica-task-item-icon-blue">
                    <Activity size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="velica-task-item-title">Phòng thi đang mở (38 SV)</div>
                    <div className="velica-task-item-desc">Mini Quiz 01 — Đang giám sát</div>
                  </div>
                </div>
                <Button
                  size="small"
                  className="velica-btn-action"
                  onClick={() => {
                    const asmId = assessments[1]?.id || 'asm-2';
                    navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_MONITOR.replace(':id', asmId));
                  }}
                >
                  Giám sát
                </Button>
              </div>

              <div className="velica-task-item">
                <div className="velica-task-item-start">
                  <div className="velica-task-item-icon velica-task-item-icon-emerald">
                    <FileEdit size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="velica-task-item-title">Đơn phúc khảo chờ xem xét</div>
                    <div className="velica-task-item-desc">SV Lê Hoàng Nam khiếu nại câu #3</div>
                  </div>
                </div>
                <Button
                  size="small"
                  className="velica-btn-action"
                  onClick={() => {
                    const asmId = assessments[0]?.id || 'asm-1';
                    navigate(ROUTE_PATHS.TEACHER.ASSESSMENT_APPEALS.replace(':id', asmId));
                  }}
                >
                  Xem đơn
                </Button>
              </div>
            </Card>

            {/* Assessment Diagnostics & Pedagogical Recommendations */}
            <Card
              title={
                <div className="d-flex items-center gap-2">
                  <Sparkles size={17} className="text-brand-color" />
                  <span className="font-bold text-primary-color">
                    Khuyến nghị Sư phạm & Khảo thí
                  </span>
                </div>
              }
            >
              <div className="mb-3">
                <div className="d-flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-primary-color">
                    Câu Q-102 (Dependency Inversion)
                  </span>
                  <Tag color="warning">Cần rà soát</Tag>
                </div>
                <p className="velica-cell-desc m-0">
                  Tỷ lệ chọn sai là 68% (Độ phân biệt thấp). Đề xuất ôn tập lại phần IoC Container hoặc hiệu chỉnh lại các phương án nhiễu trong đề thi.
                </p>
              </div>

              <div className="pt-3 border-top">
                <div className="d-flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-primary-color">
                    CLO1: Nguyên lý thiết kế SOLID
                  </span>
                  <Tag color="success">Nắm vững</Tag>
                </div>
                <p className="velica-cell-desc m-0">
                  91.4% sinh viên hoàn thành xuất sắc các câu hỏi đánh giá mức độ Bloom 3 (Áp dụng). Mục tiêu chuẩn ABET được đảm bảo.
                </p>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

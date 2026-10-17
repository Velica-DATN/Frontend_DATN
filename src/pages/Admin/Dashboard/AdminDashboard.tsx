import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Alert,
  Segmented,
  Tooltip,
  Progress,
  message,
} from 'antd';
import {
  Users,
  ShieldCheck,
  Server,
  Activity,
  ArrowRight,
  Settings,
  FileText,
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  Download,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  Eye,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { StatCard } from '../../../components/velica/StatCard/StatCard';
import { AuditLogItem } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [semesterFilter, setSemesterFilter] = useState<string>('hk1_2627');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [auditFilterType, setAuditFilterType] = useState<string>('ALL');
  const isMaintenance = mockService.isMaintenanceMode();

  useEffect(() => {
    const fetchLogs = async () => {
      const logs = await mockService.getAuditLogs();
      setAuditLogs(logs);
    };
    fetchLogs();
  }, []);

  // 1. Submission Throughput & Exam Flow Trend Data (Monthly)
  const submissionTrendData = useMemo(() => {
    if (semesterFilter === 'hk2_2526') {
      return [
        { name: 'Tháng 11', formalExams: 280, quizzes: 950, essays: 210, total: 1440 },
        { name: 'Tháng 12', formalExams: 410, quizzes: 1300, essays: 340, total: 2050 },
        { name: 'Tháng 1', formalExams: 1650, quizzes: 720, essays: 680, total: 3050 },
        { name: 'Tháng 2', formalExams: 520, quizzes: 1400, essays: 450, total: 2370 },
        { name: 'Tháng 3', formalExams: 780, quizzes: 1750, essays: 610, total: 3140 },
        { name: 'Tháng 4', formalExams: 2200, quizzes: 1100, essays: 890, total: 4190 },
      ];
    }
    return [
      { name: 'Tháng 5', formalExams: 320, quizzes: 1100, essays: 240, total: 1660 },
      { name: 'Tháng 6', formalExams: 450, quizzes: 1450, essays: 380, total: 2280 },
      { name: 'Tháng 7', formalExams: 1850, quizzes: 820, essays: 760, total: 3430 },
      { name: 'Tháng 8', formalExams: 600, quizzes: 1620, essays: 510, total: 2730 },
      { name: 'Tháng 9', formalExams: 850, quizzes: 1980, essays: 690, total: 3520 },
      { name: 'Tháng 10', formalExams: 2450, quizzes: 1200, essays: 950, total: 4600 },
    ];
  }, [semesterFilter]);

  // 2. User Distribution by Role (Donut Chart)
  const userRoleData = [
    { name: 'Sinh viên', value: 1020, percentage: 82.3, color: '#4F46E5' },
    { name: 'Giảng viên', value: 165, percentage: 13.3, color: '#06B6D4' },
    { name: 'Ban Khảo thí & Bộ môn', value: 35, percentage: 2.8, color: '#10B981' },
    { name: 'Quản trị hệ thống', value: 20, percentage: 1.6, color: '#F59E0B' },
  ];

  // 3. Faculty / Department Performance Statistics (Grouped Bar Chart)
  const departmentStatsData = [
    { dept: 'Kỹ Thuật Phần Mềm', code: 'SE', assessments: 28, passRate: 91.2, avgScore: 7.85, students: 380 },
    { dept: 'Khoa Học Máy Tính', code: 'CS', assessments: 32, passRate: 88.5, avgScore: 7.62, students: 420 },
    { dept: 'Hệ Thống Thông Tin', code: 'IS', assessments: 20, passRate: 86.0, avgScore: 7.40, students: 250 },
    { dept: 'Mạng MT & An Toàn TT', code: 'NT', assessments: 18, passRate: 84.5, avgScore: 7.35, students: 220 },
    { dept: 'Khoa Học Dữ Liệu', code: 'DS', assessments: 14, passRate: 89.8, avgScore: 7.78, students: 170 },
  ];

  // 4. Question Bank Cognitive Bloom Difficulty Breakdown
  const bloomDifficultyData = [
    { level: 'Nhận biết (Easy)', code: 'EASY', count: 1240, percentage: 32.2, color: '#10B981' },
    { level: 'Thông hiểu (Medium)', code: 'MEDIUM', count: 1420, percentage: 36.9, color: '#3B82F6' },
    { level: 'Vận dụng (Hard)', code: 'HARD', count: 850, percentage: 22.1, color: '#F59E0B' },
    { level: 'Vận dụng cao (Very Hard)', code: 'VERY_HARD', count: 340, percentage: 8.8, color: '#EF4444' },
  ];

  // Export report notification
  const handleExportReport = () => {
    message.loading({ content: 'Đang trích xuất dữ liệu khảo thí & đào tạo toàn trường...', key: 'export' });
    setTimeout(() => {
      message.success({ content: 'Đã xuất file báo cáo khảo thí định dạng Excel & PDF thành công!', key: 'export', duration: 3 });
    }, 1200);
  };

  // Filtered Audit Logs
  const filteredAuditLogs = useMemo(() => {
    if (auditFilterType === 'ALL') return auditLogs.slice(0, 6);
    if (auditFilterType === 'GRADE') {
      return auditLogs.filter(
        (l) => l.action.includes('GRADE') || l.details.toLowerCase().includes('điểm') || l.details.toLowerCase().includes('phúc khảo')
      ).slice(0, 6);
    }
    if (auditFilterType === 'SECURITY') {
      return auditLogs.filter(
        (l) => l.action.includes('POLICY') || l.action.includes('LOGIN') || l.details.toLowerCase().includes('bảo mật')
      ).slice(0, 6);
    }
    return auditLogs.slice(0, 6);
  }, [auditLogs, auditFilterType]);

  const auditColumns = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 160,
      render: (ts: string) => (
        <span className="font-mono text-xs text-muted-color">
          {new Date(ts).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      title: 'Tài khoản & Vai trò',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
      render: (name: string, record: AuditLogItem) => (
        <div>
          <Text strong className="velica-cell-title text-xs">{name}</Text>
          <div>
            <Tag color="geekblue" className="velica-tag-pill text-2xs mt-0.5">{record.userRole}</Tag>
            <span className="font-mono text-2xs text-muted-color ms-1">{record.ipAddress || '127.0.0.1'}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 160,
      render: (act: string) => {
        let color = 'blue';
        if (act.includes('OVERRIDE') || act.includes('GRADE')) color = 'purple';
        if (act.includes('POLICY') || act.includes('SECURITY')) color = 'orange';
        if (act.includes('PUBLISH')) color = 'green';
        return <Tag color={color} className="font-semibold text-2xs">{act}</Tag>;
      },
    },
    {
      title: 'Chi tiết nghiệp vụ',
      dataIndex: 'details',
      key: 'details',
      render: (d: string) => <span className="text-xs text-secondary-color">{d}</span>,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* 1. Page Header with Scope Selector & Action Buttons */}
      <div className="velica-page-header">
        <div>
          <div className="d-flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="velica-page-title mb-0">
              Trung Tâm Giám Sát & Thống Kê Học Thuật Cấp Trường
            </h2>
            <Tag color="purple" className="font-semibold text-xs m-0">
              Executive Analytics Portal
            </Tag>
          </div>
          <p className="velica-page-desc mb-0">
            Giám sát thời gian thực toàn bộ hoạt động khảo thí, lưu lượng thi cử, chuẩn đầu ra, ngân hàng đề và an toàn hệ thống.
          </p>
        </div>

        <div className="d-flex items-center gap-2 flex-wrap">
          <Segmented
            value={semesterFilter}
            onChange={(val) => setSemesterFilter(val as string)}
            options={[
              { label: 'HK1 (2026 - 2027)', value: 'hk1_2627' },
              { label: 'HK2 (2025 - 2026)', value: 'hk2_2526' },
              { label: 'Toàn khóa học', value: 'all' },
            ]}
          />
          <Button
            icon={<FileSpreadsheet size={15} />}
            onClick={handleExportReport}
            className="velica-btn-action"
          >
            Xuất Báo Cáo Khảo Thí
          </Button>
          <Button
            type="primary"
            icon={<Users size={15} />}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
            className="velica-btn-primary"
          >
            Quản Lý Người Dùng
          </Button>
        </div>
      </div>

      {isMaintenance && (
        <Alert
          message="Hệ thống đang bật Chế độ Bảo trì (Maintenance Mode)"
          description="Người dùng không thuộc nhóm Quản trị viên sẽ thấy thông báo tạm dừng dịch vụ."
          type="error"
          showIcon
          className="mb-4 rounded-3"
        />
      )}

      {/* 2. Primary KPI StatCards Row */}
      <Row gutter={[14, 14]} className="mb-4">
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Tổng Lượt Nộp Bài"
            value="14,820"
            trend={{ value: '18.4%', isPositive: true, label: 'kỳ này' }}
            sparkline="up"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Tài Khoản Toàn Trường"
            value="1,240"
            subtext="1,020 SV • 165 GV • 55 Admin"
            sparkline="up"
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Ngân Hàng Câu Hỏi"
            value="3,850"
            subtext="100% chuẩn Bloom • 48 môn"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Lớp Học Phần Khảo Thí"
            value="48 Lớp"
            subtext="5 Khoa chuyên ngành"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Tỷ Lệ Đạt Chuẩn (Pass)"
            value="88.2%"
            trend={{ value: '3.1%', isPositive: true, label: 'ABET' }}
            sparkline="up"
          />
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <StatCard
            title="Hạ Tầng Khảo Thí"
            value={isMaintenance ? 'BẢO TRÌ' : '99.98%'}
            subtext={isMaintenance ? 'Tạm dừng dịch vụ' : 'Uptime an toàn • 28ms'}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.MAINTENANCE)}
          />
        </Col>
      </Row>

      {/* 3. Section Filter Tabs */}
      <div className="mb-4 d-flex items-center justify-between flex-wrap gap-2">
        <Segmented
          value={activeTab}
          onChange={(val) => setActiveTab(val as string)}
          options={[
            { label: 'Tất cả biểu đồ phân tích', value: 'ALL' },
            { label: 'Lưu lượng & Cơ cấu sinh viên', value: 'THROUGHPUT' },
            { label: 'Chất lượng Khoa & Chuẩn Bloom', value: 'QUALITY' },
            { label: 'An toàn khảo thí & Phúc khảo', value: 'SECURITY' },
          ]}
        />
        <span className="text-xs text-muted-color">
          Cập nhật tự động theo thời gian thực • Dữ liệu kiểm toán đã xác thực
        </span>
      </div>

      {/* 4. Chart Row 1: Submissions Throughput Trend & User Role Breakdown */}
      {(activeTab === 'ALL' || activeTab === 'THROUGHPUT') && (
        <Row gutter={[16, 16]} className="mb-4">
          {/* Main Area Chart: Submissions Trend Over Time */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <div className="d-flex items-center justify-between flex-wrap gap-2">
                  <div className="d-flex items-center gap-2">
                    <TrendingUp size={18} className="text-brand-color" />
                    <div>
                      <span className="font-bold text-sm text-primary-color">
                        Lưu Lượng Nộp Bài & Xu Hướng Thi Cử Toàn Trường
                      </span>
                      <div className="text-2xs text-muted-color font-normal">
                        Theo dõi tổng lượt thi cử, kiểm tra định kỳ và đồ án tự luận qua các tháng
                      </div>
                    </div>
                  </div>
                  <Tag color="blue" className="m-0 font-semibold text-2xs">
                    Đỉnh điểm: 4,600 lượt / tháng
                  </Tag>
                </div>
              }
              className="velica-card h-100"
            >
              <div style={{ height: 300 }} className="w-100 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={submissionTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFormal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorQuizzes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorEssays" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = payload.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
                          return (
                            <div className="velica-chart-tooltip bg-white p-3 border rounded shadow-sm text-xs">
                              <div className="font-bold text-dark mb-1 pb-1 border-bottom">{label}</div>
                              {payload.map((item, idx) => (
                                <div key={idx} className="d-flex justify-between gap-3 mb-1">
                                  <span style={{ color: item.color }}>● {item.name}:</span>
                                  <strong>{item.value} bài</strong>
                                </div>
                              ))}
                              <div className="pt-1 mt-1 border-top d-flex justify-between font-bold text-brand-color">
                                <span>Tổng cộng:</span>
                                <span>{total} lượt nộp</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="formalExams"
                      name="Thi chính quy (Tập trung)"
                      stroke="#4F46E5"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFormal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="quizzes"
                      name="Mini Quizzes & Thường kỳ"
                      stroke="#06B6D4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorQuizzes)"
                    />
                    <Area
                      type="monotone"
                      dataKey="essays"
                      name="Đồ án & Tự luận mở"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorEssays)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="velica-chart-meta-row mt-3 pt-2 border-top d-flex justify-between flex-wrap text-2xs text-secondary-color">
                <span>Trung bình tuần: <strong>~850 bài nộp</strong></span>
                <span>Tỷ lệ hoàn thành đúng giờ: <strong className="text-success">96.8%</strong></span>
                <span>Tỷ lệ nộp muộn: <strong className="text-warning">3.2%</strong></span>
                <span>Lưu lượng tải cao nhất: <strong className="text-brand-color">Tháng 10 (Cuối kỳ)</strong></span>
              </div>
            </Card>
          </Col>

          {/* Donut Chart: User Role & Population Structure */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <div className="d-flex items-center gap-2">
                    <PieIcon size={18} className="text-cyan" />
                    <span className="font-bold text-sm text-primary-color">
                      Cơ Cấu Tài Khoản & Vai Trò
                    </span>
                  </div>
                  <span className="text-2xs text-muted-color">N = 1,240</span>
                </div>
              }
              className="velica-card h-100"
            >
              <div style={{ height: 210 }} className="w-100 d-flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {userRoleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="velica-chart-tooltip bg-white p-2 border rounded shadow-sm text-xs">
                              <div className="font-bold" style={{ color: data.color }}>{data.name}</div>
                              <div>Số lượng: <strong>{data.value} tài khoản</strong></div>
                              <div>Tỷ trọng: <strong>{data.percentage}%</strong></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Custom Legend */}
              <div className="d-flex flex-col gap-1.5 mt-2">
                {userRoleData.map((item, idx) => (
                  <div key={idx} className="d-flex items-center justify-between text-xs py-1 border-bottom-subtle">
                    <div className="d-flex items-center gap-2">
                      <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, backgroundColor: item.color }} />
                      <span className="text-secondary-color">{item.name}</span>
                    </div>
                    <div>
                      <strong className="text-dark me-2">{item.value}</strong>
                      <span className="text-muted-color text-2xs">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 text-center text-2xs text-success font-semibold">
                ✓ 98.4% tài khoản đang kích hoạt và hoạt động bình thường
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 5. Chart Row 2: Department Quality Comparison & Cognitive Bloom Difficulty */}
      {(activeTab === 'ALL' || activeTab === 'QUALITY') && (
        <Row gutter={[16, 16]} className="mb-4">
          {/* Department Pass Rate & Assessment Count */}
          <Col xs={24} lg={14}>
            <Card
              title={
                <div className="d-flex items-center justify-between flex-wrap gap-2">
                  <div className="d-flex items-center gap-2">
                    <BarChart3 size={18} className="text-brand-color" />
                    <div>
                      <span className="font-bold text-sm text-primary-color">
                        Chỉ Số Khảo Thí & Tỷ Lệ Đạt Chuẩn (Pass Rate) Theo Khoa
                      </span>
                      <div className="text-2xs text-muted-color font-normal">
                        So sánh chất lượng đầu ra giữa 5 khoa chuyên ngành CNTT
                      </div>
                    </div>
                  </div>
                  <Tag color="green" className="m-0 font-semibold text-2xs">
                    Trung bình trường: 88.2%
                  </Tag>
                </div>
              }
              className="velica-card h-100"
            >
              <div style={{ height: 280 }} className="w-100 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentStatsData} margin={{ top: 15, right: 15, left: -15, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#475467', fontWeight: 600 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="velica-chart-tooltip bg-white p-2.5 border rounded shadow-sm text-xs">
                              <div className="font-bold text-dark">{data.dept} ({data.code})</div>
                              <div className="text-muted-color mb-1">Quy mô: {data.students} sinh viên</div>
                              <div className="d-flex justify-between gap-3 text-brand-color">
                                <span>Số kỳ thi đã tổ chức:</span>
                                <strong>{data.assessments} bài</strong>
                              </div>
                              <div className="d-flex justify-between gap-3 text-success">
                                <span>Tỷ lệ đạt chuẩn:</span>
                                <strong>{data.passRate}%</strong>
                              </div>
                              <div className="d-flex justify-between gap-3 text-primary-color">
                                <span>Điểm trung bình khoa:</span>
                                <strong>{data.avgScore} / 10</strong>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar dataKey="passRate" name="Tỷ lệ đạt chuẩn (%)" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="assessments" name="Số kỳ thi tổ chức" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="velica-chart-meta-row mt-2 pt-2 border-top d-flex justify-between text-2xs text-secondary-color flex-wrap">
                <span>Khoa dẫn đầu tỷ lệ đạt: <strong className="text-success">Kỹ Thuật Phần Mềm (91.2%)</strong></span>
                <span>Số sinh viên tham gia khảo thí: <strong className="text-primary-color">1,440 SV</strong></span>
                <span>Điểm trung bình toàn trường: <strong className="text-brand-color">7.60 / 10</strong></span>
              </div>
            </Card>
          </Col>

          {/* Question Bank Bloom Difficulty Breakdown */}
          <Col xs={24} lg={10}>
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <div className="d-flex items-center gap-2">
                    <Layers size={18} className="text-purple" />
                    <div>
                      <span className="font-bold text-sm text-primary-color">
                        Ngân Hàng Câu Hỏi Theo Thang Bloom
                      </span>
                      <div className="text-2xs text-muted-color font-normal">
                        Cấu trúc phân hóa đề thi tự động hóa
                      </div>
                    </div>
                  </div>
                  <Tag color="purple" className="m-0 font-semibold text-2xs">
                    3,850 Câu
                  </Tag>
                </div>
              }
              className="velica-card h-100"
            >
              <div style={{ height: 200 }} className="w-100 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bloomDifficultyData} layout="vertical" margin={{ top: 5, right: 30, left: 35, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis dataKey="code" type="category" tick={{ fontSize: 10, fill: '#475467', fontWeight: 600 }} />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="velica-chart-tooltip bg-white p-2 border rounded shadow-sm text-xs">
                              <div className="font-bold" style={{ color: data.color }}>{data.level}</div>
                              <div>Số lượng: <strong>{data.count} câu</strong></div>
                              <div>Tỷ trọng: <strong>{data.percentage}%</strong></div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {bloomDifficultyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Bloom Pyramid Progress indicators */}
              <div className="d-flex flex-col gap-2 mt-2 pt-2 border-top">
                <div className="d-flex items-center justify-between text-2xs">
                  <span className="text-secondary-color">Nhận biết & Thông hiểu (Cơ sở):</span>
                  <strong className="text-primary-color">69.1% (2,660 câu)</strong>
                </div>
                <Progress percent={69.1} strokeColor="#3B82F6" size="small" showInfo={false} />

                <div className="d-flex items-center justify-between text-2xs mt-1">
                  <span className="text-secondary-color">Vận dụng & Vận dụng cao (Phân hóa):</span>
                  <strong className="text-danger">30.9% (1,190 câu)</strong>
                </div>
                <Progress percent={30.9} strokeColor="#EF4444" size="small" showInfo={false} />
              </div>

              <div className="mt-2 text-2xs text-muted-color text-center">
                ✓ Đạt tỷ lệ hình tháp chuẩn khảo thí ABET (70% nền tảng / 30% phân hóa).
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 6. Row 3: Examination Governance, Appeal Audits & System Security */}
      {(activeTab === 'ALL' || activeTab === 'SECURITY') && (
        <Row gutter={[16, 16]} className="mb-4">
          {/* Card 1: Appeals & Grade Modification Health */}
          <Col xs={24} md={8}>
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <span className="font-bold text-sm text-primary-color d-flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-purple" /> Giám Sát Phúc Khảo & Sửa Điểm
                  </span>
                  <Tag color="purple" className="m-0 text-2xs">Audit Verified</Tag>
                </div>
              }
              className="velica-card h-100"
            >
              <div className="d-flex flex-col gap-3">
                <div className="p-2.5 bg-light rounded-2 border">
                  <div className="d-flex justify-between text-xs mb-1">
                    <span className="text-secondary-color">Tổng số đơn phúc khảo kỳ này:</span>
                    <strong className="text-dark fs-14">42 đơn</strong>
                  </div>
                  <div className="d-flex justify-between text-2xs text-muted-color">
                    <span>Đã xử lý: <strong>38 (90.5%)</strong></span>
                    <span>Đang chờ duyệt: <strong className="text-warning">4 đơn</strong></span>
                  </div>
                </div>

                <div className="d-flex flex-col gap-1.5 text-xs">
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Chấp thuận điều chỉnh điểm:</span>
                    <strong className="text-success">12 đơn (28.5%)</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Giữ nguyên điểm sau thẩm định:</span>
                    <strong className="text-dark">26 đơn (61.9%)</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Tỷ lệ sửa điểm trên toàn trường:</span>
                    <strong className="text-brand-color">1.8% (Ngưỡng an toàn &lt; 5%)</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Thời gian giải quyết trung bình:</span>
                    <strong>1.4 ngày (SLA &lt; 3 ngày)</strong>
                  </div>
                </div>

                <Button
                  size="small"
                  type="link"
                  className="p-0 text-brand-color text-xs text-start"
                  onClick={() => navigate(ROUTE_PATHS.TEACHER.GRADE_APPEALS.replace(':id', 'all'))}
                >
                  Xem danh sách đơn phúc khảo toàn trường <ArrowRight size={12} className="inline ms-0.5" />
                </Button>
              </div>
            </Card>
          </Col>

          {/* Card 2: Security & Integrity Proctoring */}
          <Col xs={24} md={8}>
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <span className="font-bold text-sm text-primary-color d-flex items-center gap-1.5">
                    <AlertTriangle size={16} className="text-warning-color" /> An Toàn & Gian Lận Phòng Thi
                  </span>
                  <Tag color="green" className="m-0 text-2xs">Ổn định</Tag>
                </div>
              }
              className="velica-card h-100"
            >
              <div className="d-flex flex-col gap-3">
                <div className="p-2.5 bg-light rounded-2 border">
                  <div className="d-flex justify-between text-xs mb-1">
                    <span className="text-secondary-color">Chỉ số liêm chính khảo thí:</span>
                    <strong className="text-success fs-14">99.4%</strong>
                  </div>
                  <Progress percent={99.4} strokeColor="#10B981" size="small" showInfo={false} />
                </div>

                <div className="d-flex flex-col gap-1.5 text-xs">
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Cảnh báo chuyển tab/cửa sổ thi:</span>
                    <strong className="text-warning">14 lượt (Đã lưu vết)</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Cảnh báo đăng nhập trùng IP:</span>
                    <strong className="text-dark">2 trường hợp</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Giám sát webcam & micro:</span>
                    <strong className="text-success">Bật trên 100% kỳ thi chính quy</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Sự cố rò rỉ đề thi:</span>
                    <strong className="text-success">0 trường hợp</strong>
                  </div>
                </div>

                <Button
                  size="small"
                  type="link"
                  className="p-0 text-brand-color text-xs text-start"
                  onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
                >
                  Kiểm tra nhật ký giám sát an toàn <ArrowRight size={12} className="inline ms-0.5" />
                </Button>
              </div>
            </Card>
          </Col>

          {/* Card 3: Cloud Infrastructure & AI Grading Health */}
          <Col xs={24} md={8}>
            <Card
              title={
                <div className="d-flex items-center justify-between">
                  <span className="font-bold text-sm text-primary-color d-flex items-center gap-1.5">
                    <Server size={16} className="text-info" /> Trạng Thái Hạ Tầng & Dịch Vụ
                  </span>
                  <Tag color="cyan" className="m-0 text-2xs">Sẵn sàng</Tag>
                </div>
              }
              className="velica-card h-100"
            >
              <div className="d-flex flex-col gap-3">
                <div className="p-2.5 bg-light rounded-2 border">
                  <div className="d-flex justify-between text-xs mb-1">
                    <span className="text-secondary-color">Dung lượng lưu trữ bài thi & video:</span>
                    <strong className="text-dark fs-14">42.6 GB / 500 GB</strong>
                  </div>
                  <Progress percent={8.5} strokeColor="#06B6D4" size="small" showInfo={false} />
                </div>

                <div className="d-flex flex-col gap-1.5 text-xs">
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Chấm tự luận AI Engine:</span>
                    <strong className="text-success">Hoạt động (Load 24%)</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Cụm máy chủ thi (Vite Cluster):</span>
                    <strong className="text-success">28ms latency • 0 lỗi</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Tỷ lệ cache Redis trúng đích:</span>
                    <strong>99.9% Hit rate</strong>
                  </div>
                  <div className="d-flex justify-between">
                    <span className="text-secondary-color">• Sao lưu cơ sở dữ liệu định kỳ:</span>
                    <strong className="text-dark">03:00 AM hôm nay (OK)</strong>
                  </div>
                </div>

                <Button
                  size="small"
                  type="link"
                  className="p-0 text-danger text-xs text-start"
                  onClick={() => navigate(ROUTE_PATHS.ADMIN.MAINTENANCE)}
                >
                  Cấu hình chế độ bảo trì máy chủ <ArrowRight size={12} className="inline ms-0.5" />
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* 7. Operational Quick Actions Bar */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} md={8}>
          <div
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
            className="velica-quick-action-card cursor-pointer"
          >
            <div className="velica-quick-action-icon text-brand-color">
              <Users size={18} />
            </div>
            <div className="flex-1">
              <span className="velica-cell-title">Quản lý Người dùng & Phân Quyền</span>
              <span className="velica-cell-desc">Cấp quyền, khóa tài khoản, phân vai trò</span>
            </div>
            <ArrowRight size={14} className="text-muted-color" />
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div
            onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
            className="velica-quick-action-card cursor-pointer"
          >
            <div className="velica-quick-action-icon text-info">
              <FileText size={18} />
            </div>
            <div className="flex-1">
              <span className="velica-cell-title">Nhật ký Hệ thống Toàn Trường</span>
              <span className="velica-cell-desc">Theo dõi kiểm toán an toàn dữ liệu khảo thí</span>
            </div>
            <ArrowRight size={14} className="text-muted-color" />
          </div>
        </Col>

        <Col xs={24} md={8}>
          <div
            onClick={() => navigate(ROUTE_PATHS.ADMIN.MAINTENANCE)}
            className="velica-quick-action-card cursor-pointer"
          >
            <div className="velica-quick-action-icon text-danger">
              <Settings size={18} />
            </div>
            <div className="flex-1">
              <span className="velica-cell-title">Cấu hình Chế độ Bảo trì Máy chủ</span>
              <span className="velica-cell-desc">Kích hoạt bảo trì nâng cấp hệ thống</span>
            </div>
            <ArrowRight size={14} className="text-muted-color" />
          </div>
        </Col>
      </Row>

      {/* 8. Recent Audit Logs Preview Table with Quick Filter */}
      <Card
        title={
          <div className="d-flex items-center justify-between flex-wrap gap-2">
            <div className="d-flex items-center gap-2">
              <Clock size={16} className="text-brand-color" />
              <span className="font-semibold text-primary-color">
                Nhật Ký Vận Hành & Kiểm Toán Gần Nhất (Audit Trail)
              </span>
            </div>

            <div className="d-flex items-center gap-2">
              <Segmented
                size="small"
                value={auditFilterType}
                onChange={(val) => setAuditFilterType(val as string)}
                options={[
                  { label: 'Tất cả nhật ký', value: 'ALL' },
                  { label: 'Sửa điểm & Phúc khảo', value: 'GRADE' },
                  { label: 'Bảo mật & Cấp quyền', value: 'SECURITY' },
                ]}
              />
              <Button
                type="link"
                onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
                className="p-0 font-medium text-brand-color text-xs ms-2"
              >
                Xem toàn bộ nhật ký <ArrowRight size={13} className="ml-1 inline" />
              </Button>
            </div>
          </div>
        }
        className="velica-card"
      >
        <Table
          dataSource={filteredAuditLogs}
          columns={auditColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
          size="middle"
        />
      </Card>
    </div>
  );
};

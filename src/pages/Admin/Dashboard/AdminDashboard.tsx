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
  Progress,
  Tooltip,
} from 'antd';
import {
  Users,
  ShieldCheck,
  Activity,
  ArrowRight,
  Settings,
  FileText,
  BookOpen,
  HelpCircle,
  Award,
  CheckCircle2,
  Clock,
  Layers,
  GraduationCap,
  PieChart as PieIcon,
  BarChart3,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import {
  ResponsiveContainer,
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
import {
  User,
  ClassRoom,
  Syllabus,
  Question,
  Assessment,
  Submission,
  GradeAppeal,
  GradeAuditLog,
  AuditLogItem,
} from '../../../interfaces/velica.interfaces';
import { ROLE } from '../../../constants/roleConstants';
import {
  QUESTION_DIFFICULTY,
  QUESTION_TYPE,
  GRADING_STATUS,
  APPEAL_STATUS,
} from '../../../constants/assessmentConstants';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';

const { Title, Text, Paragraph } = Typography;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [appeals, setAppeals] = useState<GradeAppeal[]>([]);
  const [gradeAudits, setGradeAudits] = useState<GradeAuditLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const isMaintenance = mockService.isMaintenanceMode();

  const loadData = async () => {
    setLoading(true);
    const [
      uList,
      cList,
      sList,
      qList,
      aList,
      subList,
      applList,
      gAuditList,
      sysLogs,
    ] = await Promise.all([
      mockService.getUsers(),
      mockService.getClasses(),
      mockService.getSyllabi(),
      mockService.getQuestions(),
      mockService.getAssessments(),
      mockService.getSubmissions(),
      mockService.getAppeals(),
      mockService.getGradeAuditLogs(),
      mockService.getAuditLogs(),
    ]);

    setUsers(uList);
    setClasses(cList);
    setSyllabi(sList);
    setQuestions(qList);
    setAssessments(aList);
    setSubmissions(subList);
    setAppeals(applList);
    setGradeAudits(gAuditList);
    setAuditLogs(sysLogs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Bloom Cognitive Difficulty Distribution (Real Question Bank Data)
  const bloomDifficultyData = useMemo(() => {
    const counts = {
      [QUESTION_DIFFICULTY.EASY]: 0,
      [QUESTION_DIFFICULTY.MEDIUM]: 0,
      [QUESTION_DIFFICULTY.HARD]: 0,
      [QUESTION_DIFFICULTY.VERY_HARD]: 0,
    };
    questions.forEach((q) => {
      if (counts[q.difficulty] !== undefined) {
        counts[q.difficulty]++;
      }
    });
    const total = questions.length || 1;
    return [
      {
        level: 'Nhận biết',
        code: 'EASY',
        count: counts[QUESTION_DIFFICULTY.EASY],
        percentage: Math.round((counts[QUESTION_DIFFICULTY.EASY] / total) * 100),
        color: '#10B981',
      },
      {
        level: 'Thông hiểu',
        code: 'MEDIUM',
        count: counts[QUESTION_DIFFICULTY.MEDIUM],
        percentage: Math.round((counts[QUESTION_DIFFICULTY.MEDIUM] / total) * 100),
        color: '#3B82F6',
      },
      {
        level: 'Vận dụng',
        code: 'HARD',
        count: counts[QUESTION_DIFFICULTY.HARD],
        percentage: Math.round((counts[QUESTION_DIFFICULTY.HARD] / total) * 100),
        color: '#F59E0B',
      },
      {
        level: 'Vận dụng cao',
        code: 'VERY_HARD',
        count: counts[QUESTION_DIFFICULTY.VERY_HARD],
        percentage: Math.round((counts[QUESTION_DIFFICULTY.VERY_HARD] / total) * 100),
        color: '#EF4444',
      },
    ];
  }, [questions]);

  // 2. Question Types Breakdown (Real Question Bank Data)
  const questionTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {
      [QUESTION_TYPE.MCQ]: 0,
      [QUESTION_TYPE.MULTI_CHOICE]: 0,
      [QUESTION_TYPE.TRUE_FALSE]: 0,
      [QUESTION_TYPE.ESSAY]: 0,
      [QUESTION_TYPE.FILL_BLANK]: 0,
    };
    questions.forEach((q) => {
      if (typeCounts[q.type] !== undefined) {
        typeCounts[q.type]++;
      } else {
        typeCounts[q.type] = 1;
      }
    });
    const total = questions.length || 1;
    const colorMap: Record<string, string> = {
      [QUESTION_TYPE.MCQ]: '#4F46E5',
      [QUESTION_TYPE.MULTI_CHOICE]: '#06B6D4',
      [QUESTION_TYPE.TRUE_FALSE]: '#10B981',
      [QUESTION_TYPE.ESSAY]: '#F59E0B',
      [QUESTION_TYPE.FILL_BLANK]: '#8B5CF6',
    };
    const nameMap: Record<string, string> = {
      [QUESTION_TYPE.MCQ]: 'Trắc nghiệm đơn',
      [QUESTION_TYPE.MULTI_CHOICE]: 'Nhiều đáp án',
      [QUESTION_TYPE.TRUE_FALSE]: 'Đúng / Sai',
      [QUESTION_TYPE.ESSAY]: 'Tự luận chuyên sâu',
      [QUESTION_TYPE.FILL_BLANK]: 'Điền khuyết',
    };

    return Object.keys(typeCounts)
      .map((k) => ({
        typeKey: k,
        name: nameMap[k] || k,
        value: typeCounts[k] || 0,
        percentage: Math.round(((typeCounts[k] || 0) / total) * 100),
        color: colorMap[k] || '#64748B',
      }))
      .filter((item) => item.value > 0);
  }, [questions]);

  // 3. Assessment Breakdown by Type & Publication Status
  const assessmentTypeData = useMemo(() => {
    const types: Record<string, { published: number; draft: number; closed: number; total: number }> = {
      QUIZ: { published: 0, draft: 0, closed: 0, total: 0 },
      MIDTERM: { published: 0, draft: 0, closed: 0, total: 0 },
      FINAL: { published: 0, draft: 0, closed: 0, total: 0 },
      ASSIGNMENT: { published: 0, draft: 0, closed: 0, total: 0 },
    };

    assessments.forEach((asm) => {
      const t = asm.type || 'QUIZ';
      if (!types[t]) types[t] = { published: 0, draft: 0, closed: 0, total: 0 };
      types[t].total++;
      if (asm.status === 'PUBLISHED') types[t].published++;
      else if (asm.status === 'DRAFT') types[t].draft++;
      else types[t].closed++;
    });

    const labelMap: Record<string, string> = {
      QUIZ: 'Mini Quiz thường kỳ',
      MIDTERM: 'Kiểm tra Giữa kỳ',
      FINAL: 'Thi Cuối kỳ',
      ASSIGNMENT: 'Bài tập lớn / Đồ án',
    };

    return Object.keys(types).map((key) => ({
      key,
      name: labelMap[key] || key,
      published: types[key].published,
      draft: types[key].draft,
      closed: types[key].closed,
      total: types[key].total,
    }));
  }, [assessments]);

  // 4. Submissions & Grading Progress
  const submissionStatus = useMemo(() => {
    const total = submissions.length;
    const graded = submissions.filter((s) => s.gradingStatus === GRADING_STATUS.GRADED).length;
    const pendingManual = submissions.filter(
      (s) => s.gradingStatus === GRADING_STATUS.PENDING_MANUAL
    ).length;
    const onTime = submissions.filter((s) => !s.isLate).length;
    const late = submissions.filter((s) => s.isLate).length;
    const violations = submissions.filter((s) => (s.violationCount || 0) > 0).length;

    return {
      total,
      graded,
      pendingManual,
      onTime,
      late,
      violations,
      gradedPercent: total > 0 ? Math.round((graded / total) * 100) : 0,
      onTimePercent: total > 0 ? Math.round((onTime / total) * 100) : 0,
    };
  }, [submissions]);

  // 5. User Role Breakdown
  const userRoleData = useMemo(() => {
    const students = users.filter((u) => u.role === ROLE.STUDENT).length;
    const teachers = users.filter((u) => u.role === ROLE.TEACHER).length;
    const admins = users.filter((u) => u.role === ROLE.ADMIN).length;
    const activeCount = users.filter((u) => u.isActive).length;
    const total = users.length || 1;

    return {
      total: users.length,
      activeCount,
      activePercent: Math.round((activeCount / total) * 100),
      items: [
        { name: 'Sinh viên', value: students, percentage: Math.round((students / total) * 100), color: '#4F46E5' },
        { name: 'Giảng viên', value: teachers, percentage: Math.round((teachers / total) * 100), color: '#06B6D4' },
        { name: 'Quản trị viên', value: admins, percentage: Math.round((admins / total) * 100), color: '#F59E0B' },
      ],
    };
  }, [users]);

  // 6. Grade Governance (Manual Overrides & Appeals)
  const governanceStats = useMemo(() => {
    const manualAudits = gradeAudits.filter((a) => (a.type || 'MANUAL') === 'MANUAL').length;
    const appealAudits = gradeAudits.filter((a) => a.type === 'APPEAL').length;
    const pendingAppeals = appeals.filter((a) => a.status === APPEAL_STATUS.PENDING).length;
    const approvedAppeals = appeals.filter((a) => a.status === APPEAL_STATUS.APPROVED).length;
    const rejectedAppeals = appeals.filter((a) => a.status === APPEAL_STATUS.REJECTED).length;

    return {
      totalAudits: gradeAudits.length,
      manualAudits,
      appealAudits,
      totalAppeals: appeals.length,
      pendingAppeals,
      approvedAppeals,
      rejectedAppeals,
    };
  }, [gradeAudits, appeals]);

  const auditColumns = [
    {
      title: 'STT',
      key: 'stt',
      width: 55,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-xs text-muted-color">#{idx + 1}</span>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 150,
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
      width: 190,
      render: (name: string, record: AuditLogItem) => (
        <div>
          <Text strong className="velica-cell-title text-xs">{name}</Text>
          <div>
            <Tag color="geekblue" className="velica-tag-pill text-2xs mt-0.5">{record.userRole}</Tag>
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
      {/* 1. Page Header */}
      <div className="velica-page-header">
        <div>
          <h2 className="velica-page-title mb-0">
            Tổng quan & Thống kê Quản trị Hệ thống
          </h2>
          <p className="velica-page-desc mb-0">
            Thống kê dữ liệu thực tế về tài khoản người dùng, lớp học phần, ngân hàng câu hỏi, đề thi và nhật ký kiểm toán.
          </p>
        </div>

        <Space>
          <Button
            icon={<FileText size={15} />}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
            className="velica-btn-action"
          >
            Nhật ký Audit
          </Button>
          <Button
            type="primary"
            icon={<Users size={15} />}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
            className="velica-btn-primary"
          >
            Quản lý Người dùng
          </Button>
        </Space>
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

      {/* 2. Core Operational Metrics (Real System Data) */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tài khoản Người dùng"
            value={userRoleData.total}
            subtext={`${userRoleData.items.find((i) => i.name === 'Sinh viên')?.value || 0} SV • ${userRoleData.items.find((i) => i.name === 'Giảng viên')?.value || 0} GV • ${userRoleData.items.find((i) => i.name === 'Quản trị viên')?.value || 0} Admin`}
            onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Lớp học phần & Đề cương"
            value={`${classes.length} Lớp`}
            subtext={`${syllabi.length} Đề cương môn học đã ban hành`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Ngân hàng Câu hỏi"
            value={`${questions.length} Câu`}
            subtext={`${bloomDifficultyData.length} Mức độ nhận thức chuẩn Bloom`}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đề thi & Kiểm tra"
            value={`${assessments.length} Đề`}
            subtext={`${assessments.filter((a) => a.status === 'PUBLISHED').length} Đã công bố • ${assessments.filter((a) => a.status === 'DRAFT').length} Bản nháp`}
          />
        </Col>
      </Row>

      {/* 3. Charts Row 1: Bloom Cognitive Levels & Question Types */}
      <Row gutter={[16, 16]} className="mb-4">
        {/* Chart 1: Bloom Cognitive Levels */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="d-flex items-center justify-between flex-wrap gap-2">
                <div className="d-flex items-center gap-2">
                  <Layers size={18} className="text-brand-color" />
                  <div>
                    <span className="font-bold text-sm text-primary-color">
                      Cơ Cấu Ngân Hàng Câu Hỏi Theo Thang Đo Bloom
                    </span>
                    <div className="text-2xs text-muted-color font-normal">
                      Thống kê độ khó câu hỏi phục vụ tự động hóa sinh đề thi
                    </div>
                  </div>
                </div>
                <Tag color="purple" className="m-0 font-semibold text-2xs">
                  {questions.length} Câu hỏi
                </Tag>
              </div>
            }
            className="velica-card h-100"
          >
            <div style={{ height: 260 }} className="w-100 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bloomDifficultyData} margin={{ top: 15, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="code" tick={{ fontSize: 11, fill: '#475467', fontWeight: 600 }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip bg-white p-2.5 border rounded shadow-sm text-xs">
                            <div className="font-bold text-dark">{data.level}</div>
                            <div className="text-muted-color mt-1">
                              Số lượng: <strong>{data.count} câu</strong>
                            </div>
                            <div className="text-brand-color">
                              Tỷ trọng: <strong>{data.percentage}%</strong> ngân hàng
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" name="Số lượng câu hỏi" radius={[4, 4, 0, 0]}>
                    {bloomDifficultyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="velica-chart-meta-row mt-2 pt-2 border-top d-flex justify-between flex-wrap text-2xs text-secondary-color">
              <span>Nhận biết (Easy): <strong>{bloomDifficultyData[0]?.count || 0} câu</strong></span>
              <span>Thông hiểu (Medium): <strong>{bloomDifficultyData[1]?.count || 0} câu</strong></span>
              <span>Vận dụng (Hard): <strong>{bloomDifficultyData[2]?.count || 0} câu</strong></span>
              <span>Vận dụng cao (Very Hard): <strong>{bloomDifficultyData[3]?.count || 0} câu</strong></span>
            </div>
          </Card>
        </Col>

        {/* Chart 2: Question Types (Pie Chart) */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <div className="d-flex items-center gap-2">
                  <PieIcon size={18} className="text-cyan" />
                  <div>
                    <span className="font-bold text-sm text-primary-color">
                      Phân Bổ Theo Dạng Câu Hỏi
                    </span>
                    <div className="text-2xs text-muted-color font-normal">
                      Tỷ lệ các hình thức trắc nghiệm và tự luận
                    </div>
                  </div>
                </div>
              </div>
            }
            className="velica-card h-100"
          >
            <div style={{ height: 200 }} className="w-100 d-flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={questionTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {questionTypeData.map((entry, index) => (
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
                            <div>Số lượng: <strong>{data.value} câu</strong></div>
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
            <div className="d-flex flex-col gap-1 mt-1">
              {questionTypeData.map((item, idx) => (
                <div key={idx} className="d-flex items-center justify-between text-xs py-0.5 border-bottom-subtle">
                  <div className="d-flex items-center gap-2">
                    <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: item.color }} />
                    <span className="text-secondary-color">{item.name}</span>
                  </div>
                  <div>
                    <strong className="text-dark me-2">{item.value}</strong>
                    <span className="text-muted-color text-2xs">({item.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 4. Charts Row 2: Assessment Types & Submissions / Grading Progress */}
      <Row gutter={[16, 16]} className="mb-4">
        {/* Chart 3: Assessment Breakdown by Type */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="d-flex items-center justify-between flex-wrap gap-2">
                <div className="d-flex items-center gap-2">
                  <BarChart3 size={18} className="text-brand-color" />
                  <div>
                    <span className="font-bold text-sm text-primary-color">
                      Cơ Cấu Đề Thi Theo Hình Thức & Trạng Thái
                    </span>
                    <div className="text-2xs text-muted-color font-normal">
                      Phân bổ bài thi định kỳ, giữa kỳ, cuối kỳ và bài tập lớn
                    </div>
                  </div>
                </div>
                <Tag color="blue" className="m-0 font-semibold text-2xs">
                  {assessments.length} Bài thi
                </Tag>
              </div>
            }
            className="velica-card h-100"
          >
            <div style={{ height: 260 }} className="w-100 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assessmentTypeData} margin={{ top: 15, right: 15, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475467' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="velica-chart-tooltip bg-white p-2.5 border rounded shadow-sm text-xs">
                            <div className="font-bold text-dark">{data.name}</div>
                            <div className="text-muted-color mb-1">Tổng cộng: {data.total} bài</div>
                            <div className="text-success">● Đã công bố: <strong>{data.published}</strong></div>
                            <div className="text-secondary-color">● Bản nháp: <strong>{data.draft}</strong></div>
                            <div className="text-muted-color">● Đã đóng: <strong>{data.closed}</strong></div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <Bar dataKey="published" name="Đã công bố" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="draft" name="Bản nháp" fill="#64748B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="closed" name="Đã đóng" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="velica-chart-meta-row mt-2 pt-2 border-top d-flex justify-between flex-wrap text-2xs text-secondary-color">
              <span>Đang mở thi: <strong className="text-success">{assessments.filter((a) => a.status === 'PUBLISHED').length} bài</strong></span>
              <span>Đang soạn thảo: <strong>{assessments.filter((a) => a.status === 'DRAFT').length} bài</strong></span>
              <span>Hình thức phổ biến nhất: <strong className="text-brand-color">Kiểm tra giữa kỳ & Quizzes</strong></span>
            </div>
          </Card>
        </Col>

        {/* Chart 4: Submissions & Grading Progress */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <div className="d-flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-success" />
                  <div>
                    <span className="font-bold text-sm text-primary-color">
                      Tiến Độ Chấm Điểm & Nộp Bài
                    </span>
                    <div className="text-2xs text-muted-color font-normal">
                      Tỷ lệ hoàn tất chấm bài và tuân thủ thời hạn
                    </div>
                  </div>
                </div>
                <Tag color="cyan" className="m-0 font-semibold text-2xs">
                  {submissionStatus.total} Bài nộp
                </Tag>
              </div>
            }
            className="velica-card h-100"
          >
            <div className="d-flex flex-col gap-3 py-2">
              <div>
                <div className="d-flex justify-between text-xs mb-1">
                  <span className="text-secondary-color">Tỷ lệ bài thi đã chấm hoàn tất:</span>
                  <strong className="text-success">{submissionStatus.gradedPercent}% ({submissionStatus.graded}/{submissionStatus.total})</strong>
                </div>
                <Progress percent={submissionStatus.gradedPercent} strokeColor="#10B981" size="small" />
              </div>

              <div>
                <div className="d-flex justify-between text-xs mb-1">
                  <span className="text-secondary-color">Tỷ lệ nộp bài đúng thời hạn:</span>
                  <strong className="text-brand-color">{submissionStatus.onTimePercent}% ({submissionStatus.onTime}/{submissionStatus.total})</strong>
                </div>
                <Progress percent={submissionStatus.onTimePercent} strokeColor="#4F46E5" size="small" />
              </div>

              <div className="p-2.5 bg-light rounded-2 border d-flex flex-col gap-1.5 text-xs mt-1">
                <div className="d-flex justify-between">
                  <span className="text-secondary-color">• Bài thi tự luận chờ chấm:</span>
                  <strong className={submissionStatus.pendingManual > 0 ? 'text-warning' : 'text-dark'}>
                    {submissionStatus.pendingManual} bài
                  </strong>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-secondary-color">• Số bài nộp muộn (sau hạn nộp):</span>
                  <strong className={submissionStatus.late > 0 ? 'text-danger' : 'text-dark'}>
                    {submissionStatus.late} bài
                  </strong>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-secondary-color">• Bài thi có ghi nhận cảnh báo vi phạm:</span>
                  <strong className={submissionStatus.violations > 0 ? 'text-warning' : 'text-dark'}>
                    {submissionStatus.violations} bài
                  </strong>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 5. Governance Row: Grade Modifications, Appeals & User Accounts */}
      <Row gutter={[16, 16]} className="mb-4">
        {/* Card 1: Grade Modifications & Appeals (Unified Domain Logic) */}
        <Col xs={24} md={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <div className="d-flex items-center gap-2">
                  <ShieldCheck size={18} className="text-purple" />
                  <span className="font-bold text-sm text-primary-color">
                    Giám Sát Sửa Điểm & Phúc Khảo Bài Thi
                  </span>
                </div>
                <Tag color="purple" className="m-0 text-2xs">Audit Trail</Tag>
              </div>
            }
            className="velica-card h-100"
          >
            <div className="d-flex flex-col gap-3">
              <div className="p-3 bg-light rounded-2 border">
                <div className="d-flex justify-between items-center text-xs mb-1">
                  <span className="text-secondary-color">Tổng số lần điều chỉnh điểm số:</span>
                  <strong className="text-dark fs-15">{governanceStats.totalAudits} lượt</strong>
                </div>
                <div className="d-flex justify-between text-2xs text-muted-color">
                  <span>Sửa trực tiếp (`MANUAL`): <strong>{governanceStats.manualAudits}</strong></span>
                  <span>Chấm lại phúc khảo (`APPEAL`): <strong>{governanceStats.appealAudits}</strong></span>
                </div>
              </div>

              <div className="d-flex flex-col gap-2 text-xs">
                <div className="d-flex justify-between">
                  <span className="text-secondary-color">• Tổng số đơn đề nghị phúc khảo:</span>
                  <strong className="text-dark">{governanceStats.totalAppeals} đơn</strong>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-secondary-color">• Đơn đã chấp thuận và sửa điểm mới:</span>
                  <strong className="text-success">{governanceStats.approvedAppeals} đơn</strong>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-secondary-color">• Đơn giữ nguyên điểm ban đầu:</span>
                  <strong className="text-secondary-color">{governanceStats.rejectedAppeals} đơn</strong>
                </div>
                <div className="d-flex justify-between">
                  <span className="text-secondary-color">• Đơn đang chờ giảng viên thẩm định:</span>
                  <strong className="text-warning">{governanceStats.pendingAppeals} đơn</strong>
                </div>
              </div>

              <div className="mt-1 pt-2 border-top d-flex items-center justify-between">
                <span className="text-2xs text-muted-color">
                  Mọi lần sửa điểm và phúc khảo đều được lưu vết minh bạch.
                </span>
                <Button
                  size="small"
                  type="link"
                  className="p-0 text-brand-color text-xs"
                  onClick={() => navigate(`${ROUTE_PATHS.ADMIN.AUDIT_LOGS}?type=APPEAL`)}
                >
                  Xem thanh tra phúc khảo <ArrowRight size={12} className="inline ms-0.5" />
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* Card 2: User Accounts & Roles Structure */}
        <Col xs={24} md={12}>
          <Card
            title={
              <div className="d-flex items-center justify-between">
                <div className="d-flex items-center gap-2">
                  <Users size={18} className="text-brand-color" />
                  <span className="font-bold text-sm text-primary-color">
                    Cơ Cấu Tài Khoản & Vai Trò
                  </span>
                </div>
                <Tag color="cyan" className="m-0 text-2xs">
                  {userRoleData.activePercent}% Hoạt động
                </Tag>
              </div>
            }
            className="velica-card h-100"
          >
            <div className="d-flex flex-col gap-3">
              <div className="p-3 bg-light rounded-2 border">
                <div className="d-flex justify-between items-center text-xs mb-1">
                  <span className="text-secondary-color">Tài khoản đang kích hoạt:</span>
                  <strong className="text-success fs-15">{userRoleData.activeCount} / {userRoleData.total} tài khoản</strong>
                </div>
                <Progress percent={userRoleData.activePercent} strokeColor="#06B6D4" size="small" showInfo={false} />
              </div>

              <div className="d-flex flex-col gap-2 text-xs">
                {userRoleData.items.map((item, idx) => (
                  <div key={idx} className="d-flex justify-between items-center">
                    <div className="d-flex items-center gap-2">
                      <span className="rounded-circle d-inline-block" style={{ width: 8, height: 8, backgroundColor: item.color }} />
                      <span className="text-secondary-color">{item.name}:</span>
                    </div>
                    <div>
                      <strong className="text-dark me-2">{item.value}</strong>
                      <span className="text-muted-color text-2xs">({item.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-1 pt-2 border-top d-flex items-center justify-between">
                <span className="text-2xs text-muted-color">
                  Phân quyền vai trò nghiêm ngặt theo chuẩn bảo mật.
                </span>
                <Button
                  size="small"
                  type="link"
                  className="p-0 text-brand-color text-xs"
                  onClick={() => navigate(ROUTE_PATHS.ADMIN.USERS)}
                >
                  Quản lý tài khoản <ArrowRight size={12} className="inline ms-0.5" />
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 6. Operational Quick Actions */}
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
              <span className="velica-cell-title">Nhật ký Hệ thống (Audit Trail)</span>
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
              <span className="velica-cell-title">Chế độ Bảo trì Hệ thống</span>
              <span className="velica-cell-desc">Bật/tắt bảo trì toàn hệ thống</span>
            </div>
            <ArrowRight size={14} className="text-muted-color" />
          </div>
        </Col>
      </Row>

      {/* 7. Recent System Audit Trail Preview Table */}
      <Card
        title={
          <div className="d-flex items-center justify-between">
            <span className="font-semibold text-primary-color">
              Nhật Ký Vận Hành Gần Nhất (System Audit Trail)
            </span>
            <Button
              type="link"
              onClick={() => navigate(ROUTE_PATHS.ADMIN.AUDIT_LOGS)}
              className="p-0 font-medium text-brand-color"
            >
              Xem tất cả nhật ký <ArrowRight size={13} className="ml-1 inline" />
            </Button>
          </div>
        }
        className="velica-card"
      >
        <Table
          dataSource={auditLogs.slice(0, 5)}
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

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Modal,
  Popconfirm,
  Tag,
  Avatar,
  Card,
  Row,
  Col,
  Tabs,
  Segmented,
  Progress,
  Dropdown,
  Alert,
  Tooltip as AntdTooltip,
} from 'antd';
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
import { ProgressBar as BsProgressBar } from 'react-bootstrap';
import {
  ArrowLeft,
  UserPlus,
  Ban,
  Trash2,
  Mail,
  BarChart3,
  Download,
  Edit,
  Award,
  TrendingUp,
  Users,
  Target,
  BookOpen,
  Layers,
  Sparkles,
  ShieldAlert,
  RotateCcw,
  Eye,
  FileText,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  GraduationCap,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import {
  ClassMember,
  ClassRoom,
  Syllabus,
  Assessment,
  QuestionDifficultyStat,
} from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { FilterBar } from '../../../components/velica/FilterBar/FilterBar';
import { StatCard } from '../../../components/velica/StatCard/StatCard';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { SyllabusView } from '../../../components/velica/SyllabusView/SyllabusView';
import { ClassGradebookTab } from './components/ClassGradebookTab';

const { Title, Text, Paragraph } = Typography;

export const ClassDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Core Data States
  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [classAssessments, setClassAssessments] = useState<Assessment[]>([]);
  const [questionStats, setQuestionStats] = useState<QuestionDifficultyStat[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter & Active tab states
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isGradebookRoute =
    location.pathname.endsWith('/grades') ||
    location.pathname.endsWith('/gradebook') ||
    searchParams.get('tab') === 'gradebook';
  const initialTab = searchParams.get('tab') || (isGradebookRoute ? 'gradebook' : 'overview');
  const [activeTabKey, setActiveTabKey] = useState(initialTab);
  const [analyticsSubView, setAnalyticsSubView] = useState<'CLO' | 'BLOOM'>('CLO');
  const [memberSearch, setMemberSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const handleTabChange = (key: string) => {
    setActiveTabKey(key);
    setSearchParams({ tab: key });
  };

  // Modals & Drawers
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState(false);
  const [isEditClassOpen, setIsEditClassOpen] = useState(false);
  const [selectedStudentStats, setSelectedStudentStats] = useState<{
    member: ClassMember;
    submissions: Array<{
      id: string;
      assessmentId: string;
      assessmentTitle: string;
      submittedAt: string;
      score: number | null;
      maxScore: number;
      gradingStatus: string;
      violationCount: number;
    }>;
    cloBreakdown: Array<{ cloCode: string; percent: number }>;
    teacherFeedback: string;
  } | null>(null);
  const [isStudentStatsDrawerOpen, setIsStudentStatsDrawerOpen] = useState(false);

  // Forms
  const [memberForm] = Form.useForm();
  const [classForm] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    const [clsList, memList, sylList, asms, qStats] = await Promise.all([
      mockService.getClasses(),
      mockService.getClassMembers(id),
      mockService.getSyllabi(),
      mockService.getAssessments(),
      mockService.getQuestionStats(),
    ]);

    const foundClass = clsList.find((c) => c.id === id) || clsList[0];
    setCurrentClass(foundClass);
    setMembers(memList);
    setSyllabi(sylList);

    // Filter assessments belonging to this class
    const matchingAsms = asms.filter(
      (a) => a.classId === id || a.className === foundClass?.name
    );
    setClassAssessments(matchingAsms.length > 0 ? matchingAsms : asms.slice(0, 3));
    setQuestionStats(qStats);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // =========================================================================
  // 9. Update Class
  // =========================================================================
  const handleOpenEditClass = () => {
    if (!currentClass) return;
    classForm.setFieldsValue({
      code: currentClass.code,
      name: currentClass.name,
      description: currentClass.description,
      term: currentClass.term,
      syllabusId: currentClass.syllabusId,
    });
    setIsEditClassOpen(true);
  };

  const handleSaveClassUpdate = async () => {
    try {
      const values = await classForm.validateFields();
      if (!currentClass) return;
      const syl = syllabi.find((s) => s.id === values.syllabusId);
      const updated = await mockService.updateClass(currentClass.id, {
        ...values,
        syllabusName: syl?.name,
      });
      if (updated) setCurrentClass(updated);
      message.success('Cập nhật thông tin lớp học thành công!');
      setIsEditClassOpen(false);
      loadData();
    } catch {
      // validation error
    }
  };

  // =========================================================================
  // 10. Delete Class (Soft Delete if has data)
  // =========================================================================
  const handleDeleteClass = () => {
    if (!currentClass) return;
    if (members.length > 0 || classAssessments.length > 0) {
      Modal.confirm({
        title: `Xác nhận Xóa mềm Lớp học "${currentClass.name}"?`,
        content: (
          <div>
            <p>
              Lớp học hiện có <strong>{members.length} sinh viên</strong> và{' '}
              <strong>{classAssessments.length} bài kiểm tra</strong>.
            </p>
            <p className="text-muted-color">
              Để bảo toàn lịch sử làm bài và kết quả khảo thí chuẩn đầu ra (CLO) của sinh viên,
              hệ thống sẽ thực hiện <strong>Xoá mềm (Soft Delete)</strong>. Bạn có thể khôi phục lớp
              bất cứ lúc nào.
            </p>
          </div>
        ),
        okText: 'Xác nhận Xóa mềm',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: async () => {
          await mockService.deleteClass(currentClass.id);
          message.success(`Đã xóa mềm và chuyển lớp "${currentClass.code}" sang lưu trữ.`);
          navigate(ROUTE_PATHS.TEACHER.CLASSES);
        },
      });
    } else {
      Modal.confirm({
        title: `Xác nhận xóa hoàn toàn lớp "${currentClass.name}"?`,
        content: 'Lớp học chưa có dữ liệu thành viên hay bài thi nên sẽ bị xóa vĩnh viễn.',
        okText: 'Xóa vĩnh viễn',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: async () => {
          await mockService.deleteClass(currentClass.id, true);
          message.success('Đã xóa lớp học thành công.');
          navigate(ROUTE_PATHS.TEACHER.CLASSES);
        },
      });
    }
  };

  const handleRestoreClass = async () => {
    if (!currentClass) return;
    await mockService.restoreClass(currentClass.id);
    message.success(`Đã khôi phục lớp học "${currentClass.code}" thành công!`);
    loadData();
  };

  // =========================================================================
  // 11. Create Class Members
  // =========================================================================
  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields();
      await mockService.addClassMember({
        userId: `user-${Date.now()}`,
        studentCode: values.studentCode || `SV${Math.floor(10000 + Math.random() * 90000)}`,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        isBanned: false,
        isGlobalBanned: false,
        isDeleted: false,
        submissionCount: 0,
        averageScore: undefined,
      });
      message.success(`Đã thêm thành viên ${values.fullName} vào lớp học.`);
      setIsAddMemberOpen(false);
      memberForm.resetFields();
      loadData();
    } catch {
      // validation error
    }
  };

  // =========================================================================
  // 12. Ban / Suspend Class Members (Class Ban only)
  // =========================================================================
  const handleToggleBanMember = async (member: ClassMember) => {
    if (member.isBanned) {
      await mockService.banClassMember(member.id, false, false);
      message.success(`Đã mở khóa và khôi phục quyền truy cập lớp cho ${member.fullName}.`);
    } else {
      await mockService.banClassMember(member.id, true, false);
      message.warning(`Đã đình chỉ thành viên ${member.fullName} trong lớp học này.`);
    }
    loadData();
  };

  // =========================================================================
  // 14. Delete Class Members (Soft Delete if has test submissions)
  // =========================================================================
  const handleDeleteMember = async (member: ClassMember) => {
    if ((member.submissionCount && member.submissionCount > 0) || member.averageScore !== undefined) {
      Modal.confirm({
        title: `Xác nhận Xóa mềm sinh viên "${member.fullName}"?`,
        content: (
          <div>
            <p>
              Sinh viên đã nộp <strong>{member.submissionCount || 1} bài kiểm tra</strong> (Điểm TB:{' '}
              {member.averageScore || 8.0}/10).
            </p>
            <p className="text-muted-color">
              Để bảo đảm dữ liệu khảo thí không bị sai lệch, hệ thống sẽ thực hiện{' '}
              <strong>Xoá mềm (Soft Delete)</strong>. Lịch sử điểm và báo cáo CLO của lớp vẫn được
              lưu trữ toàn vẹn.
            </p>
          </div>
        ),
        okText: 'Xác nhận Xóa mềm',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: async () => {
          await mockService.removeClassMember(member.id);
          message.success(`Đã xóa mềm và lưu trữ kết quả của ${member.fullName}.`);
          loadData();
        },
      });
    } else {
      Modal.confirm({
        title: `Xác nhận xóa thành viên "${member.fullName}"?`,
        content: 'Sinh viên chưa tham gia kỳ thi nào trong lớp, sẽ được xóa hoàn toàn khỏi danh sách.',
        okText: 'Xóa vĩnh viễn',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: async () => {
          await mockService.removeClassMember(member.id, true);
          message.success(`Đã xóa thành viên ${member.fullName} khỏi lớp.`);
          loadData();
        },
      });
    }
  };

  const handleRestoreMember = async (memberId: string) => {
    await mockService.restoreClassMember(memberId);
    message.success('Đã khôi phục thành viên thành công!');
    loadData();
  };

  // =========================================================================
  // 15. View Member Statistics
  // =========================================================================
  const handleOpenStudentStats = async (member: ClassMember) => {
    const statsData = await mockService.getMemberStudentStats(member.id);
    setSelectedStudentStats(statsData);
    setIsStudentStatsDrawerOpen(true);
  };

  // =========================================================================
  // 19. Export Class Analytics to Excel
  // =========================================================================
  const handleExportExcel = () => {
    message.loading('Đang khởi tạo tệp báo cáo Excel & Chuẩn đầu ra CLO...');

    setTimeout(() => {
      let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
      csvContent += `BÁO CÁO PHÂN TÍCH HỌC TẬP & ĐÁNH GIÁ CHUẨN ĐẦU RA (CLO)\n`;
      csvContent += `Lớp học phần: ${currentClass?.name || 'SE301'} (${currentClass?.code || 'SE301.P01'})\n`;
      csvContent += `Học kỳ: ${currentClass?.term || 'HK1'}\n`;
      csvContent += `Giảng viên phụ trách: ${currentClass?.teacherName || 'TS. Nguyễn Văn An'}\n`;
      csvContent += `Đề cương môn học: ${currentClass?.syllabusName || 'Kiến Trúc & Thiết Kế Phần Mềm'}\n`;
      csvContent += `Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

      csvContent += `--- BẢNG ĐIỂM CHI TIẾT & MỨC ĐỘ ĐẠT CHUẨN ĐẦU RA SINH VIÊN ---\n`;
      csvContent += `STT,Mã sinh viên,Họ và tên,Email,Vai trò,Điểm trung bình,Số bài thi đã nộp,CLO1 (%),CLO2 (%),CLO3 (%),Trạng thái\n`;

      members.forEach((m, idx) => {
        const clo1 = m.cloProgress?.find((c) => c.cloCode === 'CLO1')?.percent || 85;
        const clo2 = m.cloProgress?.find((c) => c.cloCode === 'CLO2')?.percent || 80;
        const clo3 = m.cloProgress?.find((c) => c.cloCode === 'CLO3')?.percent || 75;
        const statusStr = m.isDeleted
          ? 'Đã xóa mềm'
          : m.isBanned
          ? 'Đình chỉ lớp này'
          : 'Bình thường';
        csvContent += `${idx + 1},${m.studentCode || `SV${21000 + idx}`},"${m.fullName}",${m.email},${
          m.role === 'TEACHING_ASSISTANT' ? 'Trợ giảng' : 'Sinh viên'
        },${m.averageScore !== undefined ? m.averageScore : '—'},${m.submissionCount || 0},${clo1}%,${clo2}%,${clo3}%,"${statusStr}"\n`;
      });

      csvContent += `\n--- THỐNG KÊ CHI TIẾT TỶ LỆ CHẤP NHẬN CÂU HỎI (LEVEL ACCEPTANCE) ---\n`;
      csvContent += `Mã câu,Nội dung câu hỏi,Mức độ Bloom,Tỷ lệ trả lời đúng (P-value),Chỉ số phân biệt (D),Thời gian TB (s),Khuyến nghị khảo thí\n`;
      questionStats.forEach((q) => {
        csvContent += `"${q.questionId}","${q.content.replace(/"/g, '""')}","${q.difficulty}",${
          q.correctRate
        }%,${q.discriminationIndex},${q.avgTimeSeconds}s,"${
          q.recommendation === 'OK' ? 'Đạt chuẩn khảo thí' : 'Cần rà soát'
        }"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Bao_Cao_CLO_${currentClass?.code || 'Lop'}_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success(`Đã xuất báo cáo phân tích lớp "${currentClass?.code}" ra file Excel thành công!`);
    }, 600);
  };

  // UC-CLS-07: Import Class Members from Excel
  const handleImportClassMembersExcel = async () => {
    const newMembers = [
      {
        studentCode: '21520888',
        fullName: 'Ngô Quốc Bảo',
        email: 'bao.nq@velica.edu.vn',
        role: 'STUDENT' as const,
      },
      {
        studentCode: '21520999',
        fullName: 'Đoàn Kim Oanh',
        email: 'oanh.dk@velica.edu.vn',
        role: 'STUDENT' as const,
      },
      {
        studentCode: '21520777',
        fullName: 'Trương Vĩnh Kỳ',
        email: 'ky.tv@velica.edu.vn',
        role: 'STUDENT' as const,
      },
    ];

    for (const m of newMembers) {
      await mockService.addClassMember({
        userId: `user-imp-${Date.now()}-${m.studentCode}`,
        studentCode: m.studentCode,
        fullName: m.fullName,
        email: m.email,
        role: m.role,
        isBanned: false,
        isGlobalBanned: false,
        isDeleted: false,
        submissionCount: 0,
        averageScore: undefined,
      });
    }

    setIsImportExcelOpen(false);
    message.success('Đã nhập thành công 3 sinh viên từ file danh sách Excel vào lớp học phần!');
    loadData();
  };

  // Filter members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.studentCode && m.studentCode.toLowerCase().includes(memberSearch.toLowerCase()));

    const matchesRole = roleFilter === 'ALL' || m.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'NORMAL') matchesStatus = !m.isBanned && !m.isDeleted;
    if (statusFilter === 'CLASS_BANNED') matchesStatus = !!m.isBanned && !m.isDeleted;
    if (statusFilter === 'SOFT_DELETED') matchesStatus = !!m.isDeleted;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Table Columns: Members (#13 View Members, #14 Delete, #12 Ban, #15 Member Stats)
  const memberColumns = [
    {
      title: 'MSSV & Sinh viên',
      key: 'student',
      render: (_: unknown, record: ClassMember) => (
        <div className="velica-cell-user">
          <Avatar className="velica-avatar-brand">
            {record.fullName.split(' ').pop()?.[0] || 'S'}
          </Avatar>
          <div>
            <div className="d-flex items-center gap-2">
              <Text strong className="velica-cell-title">
                {record.fullName}
              </Text>
              {record.studentCode && (
                <Tag color="blue" className="text-xs font-semibold">
                  {record.studentCode}
                </Tag>
              )}
            </div>
            <span className="velica-cell-email">
              <Mail size={12} /> {record.email}
            </span>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 140,
      render: (role: string) => (
        <Tag color={role === 'TEACHING_ASSISTANT' ? 'geekblue' : 'default'} className="velica-tag-pill">
          {role === 'TEACHING_ASSISTANT' ? 'Trợ giảng (TA)' : 'Sinh viên'}
        </Tag>
      ),
    },
    {
      title: 'Số bài thi',
      dataIndex: 'submissionCount',
      key: 'submissionCount',
      width: 110,
      render: (count?: number) => <span>{count !== undefined ? `${count} bài` : '0 bài'}</span>,
    },
    {
      title: 'Điểm TB',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 110,
      render: (score?: number) => (
        <span className={score && score >= 8 ? 'velica-score-high' : 'velica-score-normal'}>
          {score !== undefined ? `${score} / 10` : '—'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 160,
      render: (_: unknown, record: ClassMember) => {
        if (record.isDeleted) {
          return <Tag color="default">Đã xóa mềm</Tag>;
        }
        if (record.isBanned) {
          return <Tag color="error">Đình chỉ lớp này</Tag>;
        }
        return <Tag color="success">Bình thường</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 200,
      align: 'right' as const,
      render: (_: unknown, record: ClassMember) => {
        return (
          <Space size="small">
            {/* View Member Stats Button (#15) */}
            <Button
              type="text"
              size="small"
              icon={<Eye size={14} className="text-brand-color" />}
              onClick={() => handleOpenStudentStats(record)}
            >
              Học tập
            </Button>

            {!record.isDeleted ? (
              <>
                {/* Direct Class Ban / Unban Toggle */}
                <Popconfirm
                  title={
                    record.isBanned
                      ? `Mở khóa quyền cho sinh viên "${record.fullName}"?`
                      : `Đình chỉ sinh viên "${record.fullName}" trong lớp này?`
                  }
                  okText={record.isBanned ? 'Mở khóa' : 'Đình chỉ'}
                  cancelText="Hủy"
                  okButtonProps={record.isBanned ? {} : { danger: true }}
                  onConfirm={() => handleToggleBanMember(record)}
                >
                  <Button
                    type="text"
                    size="small"
                    danger={!record.isBanned}
                    className={record.isBanned ? 'text-success-color font-medium' : undefined}
                    icon={
                      record.isBanned ? (
                        <RotateCcw size={14} className="text-success-color" />
                      ) : (
                        <Ban size={14} />
                      )
                    }
                  >
                    {record.isBanned ? 'Mở khóa' : 'Đình chỉ'}
                  </Button>
                </Popconfirm>

                {/* Delete Member (#14 Soft delete if has test data) */}
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<Trash2 size={14} />}
                  onClick={() => handleDeleteMember(record)}
                />
              </>
            ) : (
              <Button
                type="link"
                size="small"
                onClick={() => handleRestoreMember(record.id)}
              >
                Khôi phục
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  // Table Columns: Class Assessments (#8 View Class Assessments)
  const assessmentColumns = [
    {
      title: 'Tên bài kiểm tra',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Assessment) => (
        <div>
          <span className="velica-cell-title">{title}</span>
          <span className="velica-cell-desc d-block">
            {record.totalQuestions} câu hỏi | {record.timeLimitMinutes > 0 ? `${record.timeLimitMinutes} phút` : 'Tự do'}
          </span>
        </div>
      ),
    },
    {
      title: 'Hình thức',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Trọng số HP',
      dataIndex: 'weight',
      key: 'weight',
      width: 110,
      render: (weight: number) => <span className="velica-cell-weight">{weight}%</span>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
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

  // Table Columns: Question Item Statistics (#17, #18)
  const questionColumns = [
    {
      title: 'Mã & Câu hỏi',
      dataIndex: 'content',
      key: 'content',
      render: (content: string, record: QuestionDifficultyStat) => (
        <div>
          <span className="font-semibold text-primary-color d-block">{content}</span>
          <span className="velica-cell-desc">Mã: {record.questionId} | {record.totalAttempts} sinh viên đã làm</span>
        </div>
      ),
    },
    {
      title: 'Mức độ Bloom',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 130,
      render: (diff: string) => {
        if (diff === 'EASY') return <Tag color="green">Nhớ (Dễ)</Tag>;
        if (diff === 'MEDIUM') return <Tag color="blue">Hiểu (TB)</Tag>;
        if (diff === 'HARD') return <Tag color="orange">Vận dụng (Khó)</Tag>;
        return <Tag color="purple">Phân tích (Cực khó)</Tag>;
      },
    },
    {
      title: 'Tỷ lệ trả lời đúng',
      dataIndex: 'correctRate',
      key: 'correctRate',
      width: 160,
      render: (rate: number) => (
        <div>
          <div className="d-flex justify-between text-xs mb-1">
            <span className="font-semibold">{rate}%</span>
            <span className="text-muted-color">P-value: {(rate / 100).toFixed(2)}</span>
          </div>
          <Progress
            percent={rate}
            size="small"
            strokeColor={rate < 50 ? '#DC2626' : rate < 70 ? '#D97706' : '#16A34A'}
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: 'Thời gian TB',
      dataIndex: 'avgTimeSeconds',
      key: 'avgTimeSeconds',
      width: 110,
      render: (secs: number) => <span>{secs}s</span>,
    },
    {
      title: 'Chỉ số phân biệt (D)',
      dataIndex: 'discriminationIndex',
      key: 'discriminationIndex',
      width: 140,
      render: (idx: number) => (
        <span className={idx >= 0.4 ? 'font-semibold text-success-color' : 'font-semibold text-warning-color'}>
          {idx.toFixed(2)} (Rất tốt)
        </span>
      ),
    },
    {
      title: 'Tỷ lệ chấp nhận (Acceptance)',
      dataIndex: 'recommendation',
      key: 'recommendation',
      width: 160,
      render: (rec: string) => {
        if (rec === 'OK') return <Tag color="success">Đạt chuẩn khảo thí</Tag>;
        if (rec === 'TOO_EASY') return <Tag color="warning">Quá dễ (P &gt; 0.90)</Tag>;
        return <Tag color="error">Cần xem lại phương án</Tag>;
      },
    },
  ];

  const activeMembersCount = members.filter((m) => !m.isDeleted).length;

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

  // Bloom Cognitive Taxonomy Mastery Data
  const bloomMasteryData = [
    { level: 'Nhớ (Recall)', rate: 94.2, avgSec: 32 },
    { level: 'Hiểu (Comprehend)', rate: 82.5, avgSec: 58 },
    { level: 'Vận dụng (Apply)', rate: 68.4, avgSec: 96 },
    { level: 'Phân tích (Analyze)', rate: 52.0, avgSec: 135 },
  ];

  // Psychometrics Item Analysis (P-value & D-index)
  const questionPsychometricsData = questionStats.map((q) => ({
    name: q.questionId,
    pVal: q.correctRate,
    dIdx: Math.round(q.discriminationIndex * 100),
  }));

  return (
    <div className="animate-fade-in">
      {/* Back button */}
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.CLASSES)}
          className="velica-back-btn"
        >
          Quay lại danh sách lớp học phần
        </Button>
      </div>

      {/* Modern Unified Header (#8 View Class) */}
      <div className="velica-hero-banner mb-4">
        <div className="velica-hero-header">
          <div>
            <div className="d-flex items-center gap-2 flex-wrap mb-2">
              <Tag color="geekblue" className="m-0 font-bold text-sm">
                {currentClass?.code || 'SE301.P01'}
              </Tag>
              <Tag className="velica-badge-gray m-0 text-xs font-medium">
                {currentClass?.term || 'HK1 - 2026-2027'}
              </Tag>
              <Tag className="velica-badge-gray m-0 text-xs font-medium">
                {activeMembersCount} Sinh viên
              </Tag>
              {currentClass?.isDeleted && <Tag color="error">Lớp đã xóa mềm / Lưu trữ</Tag>}
            </div>

            <h1 className="velica-hero-title mb-1">
              {currentClass?.name || 'Kiến Trúc Phần Mềm - Nhóm 01'}
            </h1>
            <p className="velica-hero-meta mb-0">
              <span>Đề cương: <strong>{currentClass?.syllabusName || 'Kiến Trúc & Thiết Kế Phần Mềm'}</strong></span>
              <span>Giảng viên: <strong>{currentClass?.teacherName || 'TS. Nguyễn Văn An'}</strong></span>
            </p>
          </div>

          {/* Action buttons (#9 Update, #10 Delete, #19 Export Excel) */}
          <div className="velica-hero-actions d-flex items-center gap-2 flex-wrap">
            <Button
              icon={<Download size={15} />}
              onClick={handleExportExcel}
              className="velica-btn-action"
            >
              Xuất Excel
            </Button>

            {!currentClass?.isDeleted ? (
              <>
                <Button
                  icon={<Edit size={15} />}
                  onClick={handleOpenEditClass}
                  className="velica-btn-action"
                >
                  Sửa lớp
                </Button>
                <Button
                  danger
                  icon={<Trash2 size={15} />}
                  onClick={handleDeleteClass}
                  className="velica-btn-action"
                >
                  Xóa lớp
                </Button>
              </>
            ) : (
              <Button
                type="primary"
                icon={<RotateCcw size={15} />}
                onClick={handleRestoreClass}
              >
                Khôi phục lớp
              </Button>
            )}

            <Button
              icon={<GraduationCap size={15} />}
              onClick={() => handleTabChange('gradebook')}
              className="velica-btn-action"
            >
              Bảng điểm lớp
            </Button>

            <Button
              type="primary"
              icon={<UserPlus size={15} />}
              onClick={() => setIsAddMemberOpen(true)}
              className="velica-btn-primary"
            >
              Thêm sinh viên
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs navigation for Class Management */}
      <Tabs
        activeKey={activeTabKey}
        onChange={handleTabChange}
        className="velica-tabs-nav"
        items={[
          {
            key: 'overview',
            label: (
              <span className="d-inline-flex items-center gap-1 font-semibold">
                <BookOpen size={15} /> Tổng quan & Bài kiểm tra
              </span>
            ),
            children: (
              <div>
                {/* 16. Overall Metrics row */}
                <Row gutter={[16, 16]} className="mb-4">
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Sĩ số lớp"
                      value={activeMembersCount}
                      icon={<Users size={20} />}
                      subtext={`${members.filter((m) => m.role === 'TEACHING_ASSISTANT').length} trợ giảng`}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Bài kiểm tra của lớp"
                      value={classAssessments.length}
                      icon={<Award size={20} />}
                      subtext="Đã lên lịch khảo thí"
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Điểm trung bình lớp"
                      value="8.16 / 10"
                      icon={<TrendingUp size={20} />}
                      trend={{ value: '+0.4', isPositive: true, label: 'chuẩn ABET' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <StatCard
                      title="Tỷ lệ đạt chuẩn CLO"
                      value="94.7%"
                      icon={<Target size={20} />}
                      trend={{ value: '36/38', isPositive: true, label: 'đạt chuẩn' }}
                    />
                  </Col>
                </Row>

                {/* Class Assessments table */}
                <Card
                  title={
                    <div className="d-flex items-center justify-between flex-wrap gap-2">
                      <div className="d-flex items-center gap-2">
                        <Award size={18} className="text-brand-color" />
                        <span className="font-bold text-sm">
                          Danh mục Bài kiểm tra thuộc Lớp học phần ({classAssessments.length})
                        </span>
                      </div>
                      <div className="d-flex items-center gap-2">
                        <Button
                          size="small"
                          icon={<GraduationCap size={14} />}
                          className="btn-secondary text-xs"
                          onClick={() => handleTabChange('gradebook')}
                        >
                          Bảng điểm lớp ↗
                        </Button>
                        <Button
                          size="small"
                          className="btn-secondary text-xs"
                          onClick={() =>
                            navigate(`${ROUTE_PATHS.TEACHER.ASSESSMENTS}?classId=${currentClass?.id}`)
                          }
                        >
                          Quản lý trong TT Khảo thí ↗
                        </Button>
                        <Button
                          type="primary"
                          size="small"
                          className="velica-btn-primary"
                          onClick={() =>
                            navigate(`${ROUTE_PATHS.TEACHER.ASSESSMENT_BUILDER}?classId=${currentClass?.id}`)
                          }
                        >
                          Tạo bài kiểm tra cho lớp
                        </Button>
                      </div>
                    </div>
                  }
                  className="velica-card-table mb-4"
                >
                  <Table
                    dataSource={classAssessments}
                    columns={assessmentColumns}
                    rowKey="id"
                    pagination={false}
                    loading={loading}
                  />
                </Card>

                {/* Syllabus and CLO Card */}
                <Card
                  title={<span className="font-bold text-sm">Đề cương & Chuẩn đầu ra (CLO) áp dụng</span>}
                  className="velica-card"
                >
                  <p className="velica-cell-desc mb-3">
                    {currentClass?.description ||
                      'Học phần trang bị kiến thức về thiết kế kiến trúc phần mềm, nguyên lý SOLID, mẫu thiết kế Clean Architecture và các chiến lược giao dịch phân tán.'}
                  </p>
                  <div className="d-flex items-center gap-3 flex-wrap">
                    <Tag color="blue" className="py-1 px-2 font-semibold">
                      CLO1: Nguyên lý SOLID & Clean Architecture
                    </Tag>
                    <Tag color="cyan" className="py-1 px-2 font-semibold">
                      CLO2: Thiết kế Microservices phân tán
                    </Tag>
                    <Tag color="geekblue" className="py-1 px-2 font-semibold">
                      CLO3: Đánh giá Trade-offs & Transactions
                    </Tag>
                  </div>
                </Card>
              </div>
            ),
          },
          {
            key: 'gradebook',
            label: (
              <span className="d-inline-flex items-center gap-1 font-semibold">
                <GraduationCap size={15} /> Bảng điểm Tổng hợp (Gradebook)
              </span>
            ),
            children: (
              <ClassGradebookTab
                currentClass={currentClass}
                members={members}
                syllabi={syllabi}
                onViewStudentStats={handleOpenStudentStats}
              />
            ),
          },
          {
            key: 'members',
            label: (
              <span className="d-inline-flex items-center gap-1 font-semibold">
                <Users size={15} /> Thành viên & Phân quyền ({filteredMembers.length})
              </span>
            ),
            children: (
              <div>
                {/* Member Toolbar */}
                <div className="velica-filter-toolbar">
                  <div className="velica-filter-search">
                    <FilterBar
                      placeholder="Tìm theo tên, email hoặc MSSV..."
                      onSearchChange={setMemberSearch}
                    />
                  </div>

                  <div className="d-flex items-center gap-2 flex-wrap">
                    <Select
                      value={roleFilter}
                      onChange={setRoleFilter}
                      className="w-140"
                      options={[
                        { label: 'Tất cả vai trò', value: 'ALL' },
                        { label: 'Sinh viên', value: 'STUDENT' },
                        { label: 'Trợ giảng (TA)', value: 'TEACHING_ASSISTANT' },
                      ]}
                    />

                    <Select
                      value={statusFilter}
                      onChange={setStatusFilter}
                      className="w-180"
                      options={[
                        { label: 'Tất cả trạng thái', value: 'ALL' },
                        { label: 'Bình thường', value: 'NORMAL' },
                        { label: 'Đình chỉ lớp này', value: 'CLASS_BANNED' },
                        { label: 'Đã xóa mềm', value: 'SOFT_DELETED' },
                      ]}
                    />

                    <Button
                      icon={<FileSpreadsheet size={15} />}
                      onClick={() => setIsImportExcelOpen(true)}
                      className="velica-btn-action"
                    >
                      Nhập từ Excel
                    </Button>

                    <Button
                      type="primary"
                      icon={<UserPlus size={15} />}
                      onClick={() => setIsAddMemberOpen(true)}
                      className="velica-btn-primary"
                    >
                      Thêm sinh viên
                    </Button>
                  </div>
                </div>

                {/* Members Table */}
                <div className="velica-card-table">
                  <Table
                    dataSource={filteredMembers}
                    columns={memberColumns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'analytics',
            label: (
              <span className="d-inline-flex items-center gap-1 font-semibold">
                <BarChart3 size={15} /> Báo cáo & Phân tích Đánh giá Toàn diện
              </span>
            ),
            children: (
              <div>
                {/* Unified Sub-navigation Segmented selector */}
                <div className="d-flex justify-between items-center mb-4 flex-wrap gap-2">
                  <Segmented
                    value={analyticsSubView}
                    onChange={(val) => setAnalyticsSubView(val as 'CLO' | 'BLOOM')}
                    options={[
                      {
                        label: 'Chuẩn đầu ra (CLO) & Phổ điểm lớp',
                        value: 'CLO',
                        icon: <Target size={14} className="inline me-1" />,
                      },
                      {
                        label: 'Chất lượng Khảo thí (CTT) & Thang đo Bloom',
                        value: 'BLOOM',
                        icon: <Layers size={14} className="inline me-1" />,
                      },
                    ]}
                    className="velica-segmented-pills"
                  />
                  <Text type="secondary" className="text-xs m-0">
                    Báo cáo tổng hợp đo lường chuẩn đầu ra (OBE/ABET) và trắc lượng câu hỏi
                  </Text>
                </div>

                {analyticsSubView === 'CLO' ? (
                  <div>
                    {/* Academic Performance & Mastery Distribution Overview */}
                    <Card
                      title={
                        <div className="d-flex items-center justify-between">
                          <div className="d-flex items-center gap-2">
                            <Target size={16} className="text-brand-color" />
                            <span className="font-bold text-sm text-primary-color">
                              Phân tầng Học lực & Tiến độ Đạt chuẩn Đầu ra
                            </span>
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
                          <div className="p-3 rounded-3 border" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
                            <div className="d-flex justify-between items-center mb-1">
                              <span className="text-xs text-secondary-color font-semibold">Xuất sắc & Giỏi (&ge; 8.5)</span>
                              <Tag color="green" className="m-0 font-bold">36.8%</Tag>
                            </div>
                            <div className="fs-18 font-bold text-emerald-600">14 SV</div>
                            <BsProgressBar variant="success" now={36.8} className="velica-progress-bar-sm mt-2" />
                          </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                          <div className="p-3 rounded-3 border" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
                            <div className="d-flex justify-between items-center mb-1">
                              <span className="text-xs text-secondary-color font-semibold">Khá (7.0 - 8.4)</span>
                              <Tag color="blue" className="m-0 font-bold">47.4%</Tag>
                            </div>
                            <div className="fs-18 font-bold text-brand-color">18 SV</div>
                            <BsProgressBar variant="primary" now={47.4} className="velica-progress-bar-sm mt-2" />
                          </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                          <div className="p-3 rounded-3 border" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
                            <div className="d-flex justify-between items-center mb-1">
                              <span className="text-xs text-secondary-color font-semibold">Trung bình (5.0 - 6.9)</span>
                              <Tag color="orange" className="m-0 font-bold">10.5%</Tag>
                            </div>
                            <div className="fs-18 font-bold text-amber-600">4 SV</div>
                            <BsProgressBar variant="warning" now={10.5} className="velica-progress-bar-sm mt-2" />
                          </div>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                          <div className="p-3 rounded-3 border" style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }}>
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

                {/* Recharts Analytics Charts */}
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
              </div>
            ) : (
              <div>
                {/* Psychometrics & Bloom Charts Row */}
                <Row gutter={[20, 20]} className="mb-4">
                  {/* Chart 1: P-value vs D-index */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <div className="d-flex items-center justify-between">
                          <span className="font-bold text-sm">Tương quan Độ khó (P-value) & Độ phân biệt (D-index)</span>
                          <span className="text-xs text-muted-color">Khảo thí cổ điển (CTT)</span>
                        </div>
                      }
                      className="velica-card"
                    >
                      <div className="velica-chart-wrapper">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={questionPsychometricsData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
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
                                        <span>Độ khó (P-value):</span>
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
                      <div className="velica-chart-meta-row">
                        <span>P-value TB: <strong className="text-primary-color">72.4%</strong></span>
                        <span>Độ phân biệt TB (D): <strong className="text-success-color">0.58 (Rất tốt)</strong></span>
                        <span>Độ tin cậy Alpha: <strong className="text-brand-color">0.84</strong></span>
                      </div>
                    </Card>
                  </Col>

                  {/* Chart 2: Bloom Cognitive Level Breakdown */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <div className="d-flex items-center justify-between">
                          <span className="font-bold text-sm">Tỷ lệ chính xác theo 4 Bậc nhận thức Bloom</span>
                          <span className="text-xs text-muted-color">Phân hóa nhận thức</span>
                        </div>
                      }
                      className="velica-card"
                    >
                      <div className="velica-chart-wrapper">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={bloomMasteryData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
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
                                        <span>Tỷ lệ làm đúng:</span>
                                        <strong>{data.rate}%</strong>
                                      </div>
                                      <div className="velica-chart-tooltip-item">
                                        <span>Thời gian TB:</span>
                                        <strong>{data.avgSec} giây</strong>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Bar dataKey="rate" name="Tỷ lệ làm đúng (%)" radius={[4, 4, 0, 0]}>
                              <Cell fill="#16A34A" />
                              <Cell fill="#0284C7" />
                              <Cell fill="#D97706" />
                              <Cell fill="#DC2626" />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="velica-chart-meta-row">
                        <span>Nhớ: <strong className="text-success-color">94.2%</strong></span>
                        <span>Hiểu: <strong className="text-info-color">82.5%</strong></span>
                        <span>Vận dụng: <strong className="text-warning-color">68.4%</strong></span>
                        <span>Phân tích: <strong className="text-danger-color">52.0% (Cần chú trọng)</strong></span>
                      </div>
                    </Card>
                  </Col>
                </Row>

                {/* 17. Question Stats Table */}
                <div className="velica-card-table">
                  <Table
                    dataSource={questionStats}
                    columns={questionColumns}
                    rowKey="questionId"
                    pagination={false}
                    loading={loading}
                  />
                </div>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'syllabus',
        label: (
          <span className="d-inline-flex items-center gap-1 font-semibold">
            <BookOpen size={15} /> Đề cương (Syllabus)
          </span>
        ),
        children: (
          <div>
            <div className="d-flex justify-end mb-3">
              <Button
                icon={<Eye size={14} />}
                onClick={() =>
                  navigate(
                    `/teacher/syllabus/${currentClass?.syllabusId || syllabi[0]?.id}`
                  )
                }
                className="btn-secondary text-xs"
              >
                Mở trang Chi tiết Đề cương (Toàn màn hình) ↗
              </Button>
            </div>
            <SyllabusView
              syllabus={syllabi.find((s) => s.id === currentClass?.syllabusId) || syllabi[0]}
              classData={currentClass}
              editable={true}
              onSyllabusUpdated={() => loadData()}
              onChangeSyllabus={() => {
                classForm.setFieldsValue(currentClass);
                setIsEditClassOpen(true);
              }}
            />
          </div>
        ),
      },
    ]}
      />

      {/* =====================================================================
          15. Drawer: Chi tiết Thống kê Học tập Cá nhân Sinh viên
          ===================================================================== */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              Hồ sơ Học tập & Thống kê CLO Cá nhân
            </div>
            <div className="velica-drawer-subtitle">
              {selectedStudentStats?.member.fullName} ({selectedStudentStats?.member.studentCode || 'SV21001'})
            </div>
          </div>
        }
        open={isStudentStatsDrawerOpen}
        onClose={() => setIsStudentStatsDrawerOpen(false)}
        width={560}
      >
        {selectedStudentStats && (
          <div>
            {/* Student Profile Card */}
            <div className="d-flex items-center gap-3 p-3 rounded-3 bg-light mb-4">
              <Avatar size={48} className="velica-avatar-brand">
                {selectedStudentStats.member.fullName.split(' ').pop()?.[0] || 'S'}
              </Avatar>
              <div className="flex-1">
                <h4 className="m-0 font-bold text-base text-primary-color">
                  {selectedStudentStats.member.fullName}
                </h4>
                <div className="text-xs text-muted-color">
                  {selectedStudentStats.member.email} • MSSV:{' '}
                  {selectedStudentStats.member.studentCode || '21520101'}
                </div>
              </div>
              <div className="text-end">
                <div className="text-xs text-muted-color">Điểm TB</div>
                <div className="font-bold text-lg text-brand-color">
                  {selectedStudentStats.member.averageScore !== undefined
                    ? `${selectedStudentStats.member.averageScore} / 10`
                    : '—'}
                </div>
              </div>
            </div>

            {/* Individual CLO Breakdown */}
            <Title level={5} className="font-bold mb-2">
              Mức độ đạt Chuẩn đầu ra cá nhân (CLO)
            </Title>
            <div className="d-flex flex-col gap-3 mb-4">
              {selectedStudentStats.cloBreakdown.map((clo) => (
                <div key={clo.cloCode}>
                  <div className="d-flex justify-between text-xs mb-1">
                    <span className="font-semibold text-primary-color">{clo.cloCode}</span>
                    <span className="font-bold text-brand-color">{clo.percent}%</span>
                  </div>
                  <Progress
                    percent={clo.percent}
                    strokeColor={clo.percent >= 80 ? '#16A34A' : '#D97706'}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>

            {/* Test History List */}
            <Title level={5} className="font-bold mb-2">
              Lịch sử các Bài kiểm tra đã hoàn thành
            </Title>
            <div className="d-flex flex-col gap-2 mb-4">
              {selectedStudentStats.submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 rounded-2 border border-light d-flex justify-between items-center"
                >
                  <div>
                    <Text strong className="d-block text-sm">
                      {sub.assessmentTitle}
                    </Text>
                    <span className="text-xs text-muted-color">
                      Nộp lúc: {new Date(sub.submittedAt).toLocaleDateString('vi-VN')} • Vi phạm: {sub.violationCount}
                    </span>
                  </div>
                  <Tag color="green" className="font-bold text-sm py-1 px-2 m-0">
                    {sub.score} / {sub.maxScore}
                  </Tag>
                </div>
              ))}
            </div>

            {/* Teacher Feedback Note */}
            <div className="p-3 rounded-2 bg-subtle">
              <Text strong className="d-block text-xs text-primary-color mb-1">
                Nhận xét & Khuyến nghị của Giảng viên:
              </Text>
              <Paragraph className="m-0 text-sm text-secondary-color">
                {selectedStudentStats.teacherFeedback}
              </Paragraph>
            </div>
          </div>
        )}
      </Drawer>

      {/* =====================================================================
          11. Drawer: Thêm Sinh viên vào Lớp
          ===================================================================== */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">Thêm thành viên vào lớp học</div>
            <div className="velica-drawer-subtitle">
              Cấp quyền truy cập học phần và làm bài kiểm tra.
            </div>
          </div>
        }
        open={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        width={460}
        extra={
          <Space>
            <Button onClick={() => setIsAddMemberOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleAddMember} className="velica-btn-primary">
              Thêm vào lớp
            </Button>
          </Space>
        }
      >
        <Form
          form={memberForm}
          layout="vertical"
          initialValues={{ role: 'STUDENT' }}
          className="velica-drawer-form"
        >
          <Form.Item
            name="studentCode"
            label="Mã số sinh viên (MSSV)"
            rules={[{ required: true, message: 'Vui lòng nhập MSSV' }]}
          >
            <Input placeholder="Vd: 21520101" />
          </Form.Item>

          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input placeholder="Vd: Nguyễn Văn Minh" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email trường (@velica.edu.vn)"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không đúng định dạng' },
            ]}
          >
            <Input placeholder="Vd: minh.nv@velica.edu.vn" />
          </Form.Item>

          <Form.Item name="role" label="Vai trò trong lớp">
            <Select>
              <Select.Option value="STUDENT">Sinh viên</Select.Option>
              <Select.Option value="TEACHING_ASSISTANT">Trợ giảng (TA)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Drawer>

      {/* =====================================================================
          9. Drawer: Chỉnh sửa thông tin Lớp học
          ===================================================================== */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">Chỉnh sửa thông tin lớp học</div>
            <div className="velica-drawer-subtitle">
              Cập nhật mã lớp, học kỳ và đề cương liên kết.
            </div>
          </div>
        }
        open={isEditClassOpen}
        onClose={() => setIsEditClassOpen(false)}
        width={460}
        extra={
          <Space>
            <Button onClick={() => setIsEditClassOpen(false)}>Hủy</Button>
            <Button type="primary" onClick={handleSaveClassUpdate} className="velica-btn-primary">
              Lưu thay đổi
            </Button>
          </Space>
        }
      >
        <Form form={classForm} layout="vertical" className="velica-drawer-form">
          <Form.Item
            name="code"
            label="Mã lớp học phần"
            rules={[{ required: true, message: 'Vui lòng nhập mã lớp' }]}
          >
            <Input placeholder="Vd: SE301.P01" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tên lớp học phần"
            rules={[{ required: true, message: 'Vui lòng nhập tên lớp' }]}
          >
            <Input placeholder="Vd: Kiến Trúc Phần Mềm - Nhóm 01" />
          </Form.Item>

          <Form.Item
            name="term"
            label="Học kỳ & Năm học"
            rules={[{ required: true, message: 'Vui lòng nhập học kỳ' }]}
          >
            <Input placeholder="Vd: HK1 - 2026-2027" />
          </Form.Item>

          <Form.Item
            name="syllabusId"
            label="Đề cương môn học liên kết"
            rules={[{ required: true, message: 'Vui lòng chọn đề cương' }]}
          >
            <Select placeholder="Chọn đề cương môn học">
              {syllabi.map((syl) => (
                <Select.Option key={syl.id} value={syl.id}>
                  {syl.name} ({syl.code})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="description" label="Mô tả lớp học">
            <Input.TextArea rows={3} placeholder="Mô tả mục tiêu và đối tượng của lớp học phần..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Modal Import Class Members from Excel (#UC-CLS-07) */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-brand-color" />
            <span>Nhập Danh Sách Sinh Viên Từ File Excel</span>
          </div>
        }
        open={isImportExcelOpen}
        onCancel={() => setIsImportExcelOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsImportExcelOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleImportClassMembersExcel}
            className="velica-btn-primary"
            icon={<UserPlus size={15} />}
          >
            Nhập file & Xác nhận (3 sinh viên mẫu)
          </Button>,
        ]}
      >
        <div className="py-2">
          <p className="velica-cell-desc mb-3">
            Hỗ trợ file danh sách điểm danh phòng đào tạo định dạng <code>.xlsx</code> hoặc <code>.csv</code>. Cột yêu cầu: <strong>MSSV</strong>, <strong>Họ và tên</strong>, <strong>Email trường</strong>.
          </p>

          <div className="p-4 border border-dashed rounded-3 text-center bg-light mb-3">
            <FileSpreadsheet size={36} className="text-brand-color mx-auto mb-2" />
            <Text strong className="d-block text-primary-color mb-1">
              Kéo thả danh sách lớp học hoặc click để chọn file
            </Text>
            <Text type="secondary" className="text-xs">
              Hỗ trợ dung lượng tối đa 10MB (.xlsx, .csv)
            </Text>
          </div>

          <div className="p-3 bg-white border rounded-2">
            <Text strong className="d-block text-xs text-primary-color mb-2">
              Xem trước 3 dòng dữ liệu mẫu sẽ được thêm vào lớp:
            </Text>
            <div className="text-xs text-secondary-color d-flex flex-col gap-1">
              <div>• <strong>21520888</strong> - Ngô Quốc Bảo (bao.nq@velica.edu.vn)</div>
              <div>• <strong>21520999</strong> - Đoàn Kim Oanh (oanh.dk@velica.edu.vn)</div>
              <div>• <strong>21520777</strong> - Trương Vĩnh Kỳ (ky.tv@velica.edu.vn)</div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

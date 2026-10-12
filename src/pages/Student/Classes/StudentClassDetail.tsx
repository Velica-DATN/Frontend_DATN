import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Tabs,
  Table,
  Progress,
  List,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Avatar,
  Tooltip,
} from 'antd';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  FileCheck2,
  GraduationCap,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Users,
  Search,
  Mail,
  MessageSquarePlus,
  Eye,
  Send,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import {
  ClassRoom,
  ClassMember,
  Syllabus,
  Assessment,
  Submission,
  Lesson,
} from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { SyllabusView } from '../../../components/velica/SyllabusView/SyllabusView';
import { GradeAppealModal } from '../../../components/velica/GradeAppealModal/GradeAppealModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export const StudentClassDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const [currentClass, setCurrentClass] = useState<ClassRoom | null>(null);
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Submission review & Appeal modal states
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [appealModalOpen, setAppealModalOpen] = useState(false);
  const [appealForm] = Form.useForm();
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  // Active tab control
  const defaultTab = searchParams.get('tab') || 'assessments';
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    const loadClassData = async () => {
      setLoading(true);
      const [clsList, sylList, asmList, subList, lesList, memList] = await Promise.all([
        mockService.getClasses(),
        mockService.getSyllabi(),
        mockService.getAssessments(),
        mockService.getSubmissions(),
        mockService.getLessons(),
        mockService.getClassMembers(id),
      ]);

      const foundCls = clsList.find((c) => c.id === id) || clsList[0];
      setCurrentClass(foundCls);

      const foundSyl = sylList.find((s) => s.id === foundCls?.syllabusId) || sylList[0];
      setSyllabus(foundSyl);

      // Assessments for this class
      const classAsms = asmList.filter(
        (a) => a.classId === id || a.className === foundCls?.name
      );
      setAssessments(classAsms.length > 0 ? classAsms : asmList);

      setSubmissions(subList);
      setLessons(lesList);
      setMembers(memList);
      setLoading(false);
    };

    loadClassData();
  }, [id]);

  const handleOpenReview = (submission: Submission) => {
    navigate(`/student/assessments/${submission.assessmentId}/review`);
  };

  const handleOpenAppeal = () => {
    setAppealModalOpen(true);
  };

  // Assessment table columns
  const assessmentColumns = [
    {
      title: 'Tên bài kiểm tra / Đề thi',
      dataIndex: 'title',
      key: 'title',
      width: 320,
      ellipsis: true,
      render: (title: string, record: Assessment) => (
        <div style={{ maxWidth: 300 }}>
          <Tooltip title={title} placement="topLeft">
            <span className="velica-cell-title velica-table-cell-ellipsis">{title}</span>
          </Tooltip>
          <span className="velica-cell-desc-single text-xs">
            Trọng số: <strong>{record.weight}%</strong> • {record.totalQuestions} câu hỏi
          </span>
        </div>
      ),
    },
    {
      title: 'Hình thức',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Thời gian thi',
      dataIndex: 'timeLimitMinutes',
      key: 'timeLimitMinutes',
      width: 110,
      render: (mins: number) => <span>{mins > 0 ? `${mins} phút` : 'Tự do'}</span>,
    },
    {
      title: 'Điểm số & Tình trạng',
      key: 'scoreStatus',
      width: 170,
      render: (_: unknown, record: Assessment) => {
        const sub = submissions.find((s) => s.assessmentId === record.id);
        if (sub) {
          return (
            <div>
              <div className={sub.score !== null ? 'velica-score-high' : 'text-warning-color font-semibold'}>
                {sub.score !== null ? `${sub.score} / ${sub.maxScore} đ` : 'Chờ chấm tự luận'}
              </div>
              <StatusBadge status={sub.gradingStatus} size="sm" />
            </div>
          );
        }
        return <StatusBadge status={record.status} size="sm" />;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 150,
      align: 'right' as const,
      render: (_: unknown, record: Assessment) => {
        const sub = submissions.find((s) => s.assessmentId === record.id);

        if (sub) {
          return (
            <Button
              size="small"
              icon={<Eye size={14} />}
              onClick={() => handleOpenReview(sub)}
              className="velica-btn-action"
            >
              Xem bài làm
            </Button>
          );
        }

        if (record.status === 'PUBLISHED') {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() =>
                navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_INSTRUCTIONS.replace(':id', record.id))
              }
              className="velica-btn-primary"
            >
              Vào thi ngay
            </Button>
          );
        }

        return <span className="text-xs text-muted-color">Chưa mở</span>;
      },
    },
  ];

  // Grade components for this course
  const gradeComponents = [
    { key: 'attendance', name: 'Điểm chuyên cần & Thảo luận', weight: '10%', score: '9.0 / 10', weighted: '0.90' },
    { key: 'quizzes', name: 'Mini Quizzes định kỳ', weight: '20%', score: '8.5 / 10', weighted: '1.70' },
    { key: 'midterm', name: 'Kiểm tra Giữa kỳ (Lý thuyết & Tự luận)', weight: '30%', score: '8.5 / 10', weighted: '2.55' },
    { key: 'project', name: 'Bài tập lớn / Đồ án môn học', weight: '40%', score: '8.8 / 10', weighted: '3.52' },
  ];

  const gradeColumns = [
    {
      title: 'Thành phần đánh giá',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (n: string) => (
        <Tooltip title={n}>
          <span className="text-truncate d-block" style={{ maxWidth: 300 }}>
            <Text strong>{n}</Text>
          </span>
        </Tooltip>
      ),
    },
    { title: 'Trọng số', dataIndex: 'weight', key: 'weight', width: 110, render: (w: string) => <Tag color="blue">{w}</Tag> },
    { title: 'Điểm đạt được', dataIndex: 'score', key: 'score', width: 150, render: (s: string) => <span className="velica-score-high">{s}</span> },
    { title: 'Điểm quy đổi (trọng số)', dataIndex: 'weighted', key: 'weighted', width: 180, render: (w: string) => <span className="font-bold">{w} đ</span> },
  ];

  // Class Members for Student Roster View
  const activeClassMembers = members.filter((m) => !m.isDeleted);
  const filteredMembers = activeClassMembers.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.studentCode && m.studentCode.toLowerCase().includes(memberSearch.toLowerCase())) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase());
    const matchesRole =
      memberRoleFilter === 'ALL' || m.role === memberRoleFilter;
    return matchesSearch && matchesRole;
  });

  const studentMemberColumns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-secondary-color">#{idx + 1}</span>
      ),
    },
    {
      title: 'Mã sinh viên',
      dataIndex: 'studentCode',
      key: 'studentCode',
      width: 140,
      render: (code: string) => (
        <span className="font-mono font-semibold text-brand-color">{code || '—'}</span>
      ),
    },
    {
      title: 'Họ và tên thành viên',
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
      render: (name: string, record: ClassMember) => (
        <div className="d-flex items-center gap-2" style={{ maxWidth: 280 }}>
          <Avatar style={{ backgroundColor: record.role === 'TEACHING_ASSISTANT' ? '#4F46E5' : '#0284C7' }}>
            {name.charAt(name.lastIndexOf(' ') + 1) || name.charAt(0)}
          </Avatar>
          <div className="overflow-hidden">
            <Tooltip title={name} placement="topLeft">
              <span className="font-semibold text-primary-color velica-table-cell-ellipsis">{name}</span>
            </Tooltip>
            <span className="text-xs text-muted-color velica-table-cell-ellipsis">{record.email}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Vai trò trong lớp',
      dataIndex: 'role',
      key: 'role',
      width: 170,
      render: (role: string) => (
        <Tag color={role === 'TEACHING_ASSISTANT' ? 'geekblue' : 'default'} className="font-semibold">
          {role === 'TEACHING_ASSISTANT' ? 'Trợ giảng (TA)' : 'Sinh viên'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      width: 140,
      render: (date: string) => <span className="text-xs text-muted-color">{date || '2026-08-20'}</span>,
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* 1. Back button row */}
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.STUDENT.CLASSES)}
          className="velica-back-btn"
        >
          Quay lại danh sách lớp học
        </Button>
      </div>

      {/* 2. Hero Header Banner */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <div className="d-flex items-center gap-2 mb-1 flex-wrap">
            <Tag color="geekblue" className="font-bold">
              {currentClass?.code || 'SE301.P01'}
            </Tag>
            <Tag className="velica-badge-gray">
              {currentClass?.term || 'HK1 - 2026-2027'}
            </Tag>
            <Tag className="velica-badge-gray">
              {syllabus?.credits || 3} Tín chỉ
            </Tag>
          </div>
          <h2 className="velica-page-title">
            {currentClass?.name || 'Kiến Trúc Phần Mềm Hiện Đại'}
          </h2>
          <p className="velica-page-desc">
            Giảng viên phụ trách: <strong>{currentClass?.teacherName || 'TS. Nguyễn Văn An'}</strong> • Đề cương: {currentClass?.syllabusName}
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            type="primary"
            icon={<FileCheck2 size={15} />}
            onClick={() => setActiveTab('assessments')}
            className="velica-btn-primary"
          >
            Bài kiểm tra học phần
          </Button>
        </div>
      </div>

      {/* 3. Class Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="velica-detail-tabs"
        items={[
          {
            key: 'assessments',
            label: (
              <span className="d-flex items-center gap-2">
                <FileCheck2 size={16} />
                <span>Bài thi & Kiểm tra ({assessments.length})</span>
              </span>
            ),
            children: (
              <Card>
                <Table
                  dataSource={assessments}
                  columns={assessmentColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  size="middle"
                />
              </Card>
            ),
          },
          {
            key: 'syllabus',
            label: (
              <span className="d-flex items-center gap-2">
                <BookOpen size={16} />
                <span>Đề cương & Chuẩn đầu ra (Syllabus)</span>
              </span>
            ),
            children: (
              <SyllabusView syllabus={syllabus} classData={currentClass} />
            ),
          },
          {
            key: 'lessons',
            label: (
              <span className="d-flex items-center gap-2">
                <Layers size={16} />
                <span>Chủ đề theo CLO ({lessons.length})</span>
              </span>
            ),
            children: (
              <Card
                title={
                  <div>
                    <div className="font-bold text-sm text-primary-color">Danh mục Chủ đề kiến thức theo chuẩn đầu ra (CLO)</div>
                    <div className="text-xs text-muted-color font-normal">
                      Các phân loại danh mục (category) kiến thức tương ứng với chuẩn đầu ra CLO để xây dựng ngân hàng câu hỏi và sinh đề thi.
                    </div>
                  </div>
                }
              >
                <List
                  itemLayout="horizontal"
                  dataSource={lessons}
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div className="velica-task-item-icon velica-task-item-icon-blue">
                            <span className="font-bold text-xs text-brand-color">#{index + 1}</span>
                          </div>
                        }
                        title={
                          <div className="d-flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-primary-color">
                              Chủ đề {index + 1}: {item.title}
                            </span>
                            {(item.cloIds && item.cloIds.length > 0 ? item.cloIds : ['CLO1']).map((clo) => (
                              <Tag key={clo} color="blue" className="text-xs font-semibold m-0">
                                {clo}
                              </Tag>
                            ))}
                          </div>
                        }
                        description={item.description}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ),
          },
          {
            key: 'gradebook',
            label: (
              <span className="d-flex items-center gap-2">
                <Award size={16} />
                <span>Bảng điểm môn học</span>
              </span>
            ),
            children: (
              <div>
                <Card className="mb-4">
                  <div className="d-flex items-center justify-between flex-wrap gap-3 mb-3">
                    <div>
                      <h3 className="velica-page-title mb-1">
                        Điểm tổng kết môn học: <span className="velica-score-high">8.67 / 10</span>
                      </h3>
                      <p className="velica-cell-desc m-0">
                        Xếp loại: <strong>Giỏi (Thang điểm A)</strong> • Tiến độ hoàn thành: 4/4 cột điểm thành phần.
                      </p>
                    </div>
                    <Tag color="success" className="p-2 text-sm font-semibold">
                      ✓ Đạt chuẩn đầu ra học phần (ABET)
                    </Tag>
                  </div>
                  <Table
                    dataSource={gradeComponents}
                    columns={gradeColumns}
                    pagination={false}
                    size="middle"
                  />
                </Card>
              </div>
            ),
          },
          {
            key: 'members',
            label: (
              <span className="d-flex items-center gap-2">
                <Users size={16} />
                <span>Thành viên lớp ({activeClassMembers.length})</span>
              </span>
            ),
            children: (
              <Card>
                <div className="d-flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="d-flex items-center gap-2 flex-wrap">
                    <Input
                      prefix={<Search size={15} className="text-muted-color" />}
                      placeholder="Tìm bạn cùng lớp theo tên, MSSV hoặc email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      style={{ width: 280 }}
                      allowClear
                    />
                    <Select
                      value={memberRoleFilter}
                      onChange={setMemberRoleFilter}
                      style={{ width: 160 }}
                      options={[
                        { label: 'Tất cả vai trò', value: 'ALL' },
                        { label: 'Sinh viên', value: 'STUDENT' },
                        { label: 'Trợ giảng (TA)', value: 'TEACHING_ASSISTANT' },
                      ]}
                    />
                  </div>
                  <div className="text-xs text-secondary-color">
                    Giảng viên phụ trách: <strong>{currentClass?.teacherName || 'TS. Nguyễn Văn An'}</strong> • Tổng số: <strong>{activeClassMembers.length} thành viên</strong>
                  </div>
                </div>
                <Table
                  dataSource={filteredMembers}
                  columns={studentMemberColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  size="middle"
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Grade Appeal Modal */}
      <GradeAppealModal
        open={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
        preselectedAssessmentId={selectedSub?.assessmentId}
        onSuccess={() => {
          setAppealModalOpen(false);
          navigate(ROUTE_PATHS.STUDENT.GRADE_REVIEWS);
        }}
      />
    </div>
  );
};

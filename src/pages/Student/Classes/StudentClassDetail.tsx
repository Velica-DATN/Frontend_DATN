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
  History,
  ShieldCheck,
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
  GradeAuditLog,
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
  const [gradeAudits, setGradeAudits] = useState<GradeAuditLog[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
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

      const currentUser = mockService.getCurrentUser();
      const audits = await mockService.getGradeAuditLogs({
        classId: id || 'cls-101',
        studentId: currentUser.id,
      });
      setGradeAudits(audits);
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
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-xs text-secondary-color">#{idx + 1}</span>
      ),
    },
    {
      title: 'Tên bài kiểm tra / Đề thi',
      dataIndex: 'title',
      key: 'title',
      width: 270,
      ellipsis: true,
      render: (title: string, record: Assessment) => (
        <div style={{ maxWidth: 250 }}>
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
      width: 110,
      render: (type: string) => {
        if (type === 'HOMEWORK') return <Tag color="purple">Bài tập về nhà</Tag>;
        if (type === 'QUIZ') return <Tag color="cyan">Trắc nghiệm</Tag>;
        if (type === 'MIDTERM') return <Tag color="blue">Giữa kỳ</Tag>;
        if (type === 'FINAL') return <Tag color="red">Cuối kỳ</Tag>;
        if (type === 'ASSIGNMENT') return <Tag color="orange">Bài tập lớn</Tag>;
        return <Tag color="geekblue">{type}</Tag>;
      },
    },
    {
      title: 'Thời gian thi',
      dataIndex: 'timeLimitMinutes',
      key: 'timeLimitMinutes',
      width: 110,
      render: (mins: number) => <span>{mins > 0 ? `${mins} phút` : 'Tự do'}</span>,
    },
    {
      title: 'Thời gian mở đề',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 145,
      render: (startTime: string | null) => (
        <span className="text-xs text-secondary-color">
          {startTime
            ? new Date(startTime).toLocaleString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Mở tự do'}
        </span>
      ),
    },
    {
      title: 'Hạn nộp (Deadline)',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 150,
      render: (endTime: string | null) => {
        if (!endTime) {
          return <span className="text-xs text-secondary-color">Không giới hạn</span>;
        }
        const isPast = new Date(endTime).getTime() < Date.now();
        return (
          <span className={`text-xs font-semibold ${isPast ? 'text-muted-color' : 'text-primary-color'}`}>
            {new Date(endTime).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      title: 'Điểm số & Tình trạng',
      key: 'scoreStatus',
      width: 160,
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
      width: 140,
      fixed: 'right' as const,
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

  // Grade components for this course with audit tracking
  const gradeComponents = [
    {
      key: 'attendance',
      name: 'Điểm chuyên cần & Thảo luận',
      weight: '10%',
      score: '9.0 / 10',
      weighted: '0.90',
      audit: gradeAudits.find((a) => a.componentName.toLowerCase().includes('chuyên cần')),
    },
    {
      key: 'quizzes',
      name: 'Mini Quizzes định kỳ',
      weight: '20%',
      score: '8.5 / 10',
      weighted: '1.70',
      audit: gradeAudits.find((a) => a.componentName.toLowerCase().includes('quiz')),
    },
    {
      key: 'midterm',
      name: 'Kiểm tra Giữa kỳ (Lý thuyết & Tự luận)',
      weight: '30%',
      score: '8.5 / 10',
      weighted: '2.55',
      audit: gradeAudits.find((a) => a.componentName.toLowerCase().includes('giữa kỳ')),
    },
    {
      key: 'project',
      name: 'Bài tập lớn / Đồ án môn học',
      weight: '40%',
      score: '8.8 / 10',
      weighted: '3.52',
      audit: gradeAudits.find((a) => a.componentName.toLowerCase().includes('đồ án') || a.componentName.toLowerCase().includes('bài tập lớn')),
    },
  ];

  const gradeColumns = [
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
    {
      title: 'Lịch sử điều chỉnh',
      key: 'audit',
      width: 170,
      render: (_: unknown, record: { audit?: GradeAuditLog; name: string }) => {
        if (record.audit) {
          const isAppeal = record.audit.type === 'APPEAL';
          return (
            <Tooltip title={`Nhấn để xem minh bạch lý do ${isAppeal ? 'chấm phúc khảo' : 'điều chỉnh điểm'} từ Giảng viên`}>
              <Tag
                color={isAppeal ? 'purple' : 'blue'}
                icon={<History size={12} className="inline me-1" />}
                className="cursor-pointer font-semibold"
                onClick={() => setIsAuditModalOpen(true)}
              >
                {isAppeal ? 'Đã phúc khảo' : 'Đã điều chỉnh'}
              </Tag>
            </Tooltip>
          );
        }
        return <Tag color="default">Gốc (Chính thức)</Tag>;
      },
    },
  ];

  const activeClassMembers = members.filter((m) => !m.isDeleted);
  const filteredMembers = activeClassMembers.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
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
      title: 'Họ và tên thành viên',
      dataIndex: 'fullName',
      key: 'fullName',
      ellipsis: true,
      render: (name: string, record: ClassMember) => (
        <div className="d-flex items-center gap-2" style={{ maxWidth: 280 }}>
          <Avatar style={{ backgroundColor: '#0284C7' }}>
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
      width: 140,
      render: () => (
        <Tag color="default" className="font-semibold">
          Sinh viên
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
          </div>
          <h2 className="velica-page-title">
            {currentClass?.name || 'Kiến Trúc Phần Mềm Hiện Đại'}
          </h2>
          <p className="velica-page-desc">
            Giảng viên phụ trách: <strong>{currentClass?.teacherName || 'TS. Nguyễn Văn An'}</strong> • Đề cương: {currentClass?.syllabusName}
          </p>
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
              <div className="velica-table-container">
                <Table
                  dataSource={assessments}
                  columns={assessmentColumns}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 8,
                    showSizeChanger: true,
                    pageSizeOptions: ['8', '15', '25'],
                    showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} bài thi`,
                  }}
                  size="middle"
                  scroll={{ x: 1040 }}
                />
              </div>
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
              <div>
                <SyllabusView syllabus={syllabus} classData={currentClass} />

                {/* Integrated CLO Topics List */}
                <Card
                  className="mt-4"
                  title={
                    <div className="d-flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <div className="font-bold text-sm text-primary-color">
                          Danh mục Chủ đề kiến thức theo chuẩn đầu ra (CLO) ({lessons.length})
                        </div>
                        <div className="text-xs text-muted-color font-normal">
                          Các phân loại danh mục (category) kiến thức tương ứng với chuẩn đầu ra CLO để xây dựng ngân hàng câu hỏi và sinh đề thi.
                        </div>
                      </div>
                      <Tag color="blue" className="font-semibold">{lessons.length} chủ đề CLO</Tag>
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
              </div>
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
                    <div className="d-flex items-center gap-2">
                      <Button
                        icon={<History size={14} className="text-purple" />}
                        onClick={() => setIsAuditModalOpen(true)}
                        className="velica-btn-action text-xs"
                      >
                        Lịch sử sửa điểm ({gradeAudits.length})
                      </Button>
                      <Tag color="success" className="p-2 text-sm font-semibold">
                        ✓ Đạt chuẩn đầu ra học phần (ABET)
                      </Tag>
                    </div>
                  </div>
                  <div className="velica-table-container">
                    <Table
                      dataSource={gradeComponents}
                      columns={gradeColumns}
                      pagination={false}
                      size="middle"
                      scroll={{ x: 750 }}
                    />
                  </div>
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
                      placeholder="Tìm bạn cùng lớp theo tên hoặc email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      style={{ width: 340 }}
                      allowClear
                    />
                  </div>
                  <div className="text-xs text-secondary-color">
                    Giảng viên phụ trách: <strong>{currentClass?.teacherName || 'TS. Nguyễn Văn An'}</strong> • Tổng số: <strong>{activeClassMembers.length} thành viên</strong>
                  </div>
                </div>
                <div className="velica-table-container">
                  <Table
                    dataSource={filteredMembers}
                    columns={studentMemberColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    size="middle"
                    scroll={{ x: 750 }}
                  />
                </div>
              </Card>
            ),
          },
        ]}
      />

      {/* Student Transparent Grade Audit History Modal */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <History size={18} className="text-purple" />
            <div>
              <div className="velica-drawer-title">Minh Bạch Lịch Sử Chỉnh Sửa Điểm Của Bạn</div>
              <div className="velica-drawer-subtitle">
                Mọi điều chỉnh điểm số thành phần của bạn đều được lưu vết minh bạch kèm lý do từ Giảng viên.
              </div>
            </div>
          </div>
        }
        open={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        width={720}
      >
        {gradeAudits.length === 0 ? (
          <div className="py-5 text-center text-muted-color">
            Chưa có lần điều chỉnh điểm nào từ giảng viên cho môn học này.
          </div>
        ) : (
          <Table
            dataSource={gradeAudits}
            rowKey="id"
            pagination={{ pageSize: 8, showSizeChanger: true }}
            size="middle"
            columns={[
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
                width: 130,
                render: (ts: string) => (
                  <div className="text-xs">
                    <div className="font-semibold text-dark">{new Date(ts).toLocaleDateString('vi-VN')}</div>
                    <div className="text-muted-color">{new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ),
              },
              {
                title: 'Hình thức',
                key: 'type',
                width: 130,
                render: (_: unknown, r: GradeAuditLog) => (
                  <div>
                    {r.type === 'APPEAL' ? (
                      <div>
                        <Tag color="purple" className="m-0 font-semibold text-2xs">
                          Phúc khảo
                        </Tag>
                        {r.appealId && (
                          <div className="font-mono text-2xs text-muted-color mt-0.5">
                            {r.appealId}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Tag color="blue" className="m-0 font-semibold text-2xs">
                        Sửa trực tiếp
                      </Tag>
                    )}
                  </div>
                ),
              },
              {
                title: 'Thành phần điểm',
                dataIndex: 'componentName',
                key: 'componentName',
                width: 170,
                render: (comp: string) => <strong className="text-xs text-dark">{comp}</strong>,
              },
              {
                title: 'Biến động',
                key: 'change',
                width: 130,
                align: 'center' as const,
                render: (_: unknown, r: GradeAuditLog) => (
                  <div className="text-xs">
                    <del className="text-muted-color">{r.oldScore !== null ? `${r.oldScore}đ` : '—'}</del>
                    {' ➔ '}
                    <strong className="text-brand-color">{r.newScore}đ</strong>
                  </div>
                ),
              },
              {
                title: 'Giảng viên & Lý do điều chỉnh',
                key: 'reason',
                render: (_: unknown, r: GradeAuditLog) => (
                  <div className="text-xs">
                    <div className="text-2xs text-muted-color mb-0.5">
                      Giảng viên: <strong className="text-dark">{r.changedBy}</strong>
                    </div>
                    <div className="text-secondary-color">
                      <em>"{r.reason}"</em>
                    </div>
                  </div>
                ),
              },
            ]}
          />
        )}
      </Drawer>

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

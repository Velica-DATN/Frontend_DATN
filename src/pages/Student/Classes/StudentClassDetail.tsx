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
  MessageSquarePlus,
  Eye,
  Send,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import {
  ClassRoom,
  Syllabus,
  Assessment,
  Submission,
  Lesson,
} from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { SyllabusView } from '../../../components/velica/SyllabusView/SyllabusView';

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
      const [clsList, sylList, asmList, subList, lesList] = await Promise.all([
        mockService.getClasses(),
        mockService.getSyllabi(),
        mockService.getAssessments(),
        mockService.getSubmissions(),
        mockService.getLessons(),
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
      setLoading(false);
    };

    loadClassData();
  }, [id]);

  const handleOpenReview = (submission: Submission) => {
    setSelectedSub(submission);
    setReviewDrawerOpen(true);
  };

  const handleOpenAppeal = () => {
    if (!selectedSub) return;
    appealForm.resetFields();
    appealForm.setFieldsValue({
      questionId: selectedSub.answers[selectedSub.answers.length - 1]?.questionId || 'q-5',
    });
    setAppealModalOpen(true);
  };

  const handleSubmitAppeal = async () => {
    try {
      const values = await appealForm.validateFields();
      if (!selectedSub) return;
      setIsSubmittingAppeal(true);
      const currentUser = mockService.getCurrentUser();
      const question = selectedSub.answers.find((a) => a.questionId === values.questionId);

      await mockService.createAppeal({
        submissionId: selectedSub.id,
        assessmentId: selectedSub.assessmentId,
        assessmentTitle: selectedSub.assessmentTitle,
        studentId: currentUser.id,
        studentName: currentUser.fullName,
        questionId: values.questionId,
        questionContent: question?.questionContent || 'Câu hỏi tự luận',
        currentScore: question?.pointsAwarded || 3.5,
        maxPoints: question?.maxPoints || 4.0,
        reason: values.reason,
      });

      message.success('Đã gửi đơn yêu cầu phúc khảo thành công đến Giảng viên!');
      setIsSubmittingAppeal(false);
      setAppealModalOpen(false);
      navigate(ROUTE_PATHS.STUDENT.GRADE_REVIEWS);
    } catch {
      setIsSubmittingAppeal(false);
    }
  };

  // Assessment table columns
  const assessmentColumns = [
    {
      title: 'Tên bài kiểm tra / Đề thi',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Assessment) => (
        <div>
          <span className="velica-cell-title">{title}</span>
          <span className="velica-cell-desc d-block">
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
    { title: 'Thành phần đánh giá', dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
    { title: 'Trọng số', dataIndex: 'weight', key: 'weight', width: 110, render: (w: string) => <Tag color="blue">{w}</Tag> },
    { title: 'Điểm đạt được', dataIndex: 'score', key: 'score', width: 150, render: (s: string) => <span className="velica-score-high">{s}</span> },
    { title: 'Điểm quy đổi (trọng số)', dataIndex: 'weighted', key: 'weighted', width: 180, render: (w: string) => <span className="font-bold">{w} đ</span> },
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
                <span>Bài giảng & Tài nguyên ({lessons.length})</span>
              </span>
            ),
            children: (
              <Card title={<span className="font-bold">Danh sách Chương & Tài liệu Học tập</span>}>
                <List
                  itemLayout="horizontal"
                  dataSource={lessons}
                  renderItem={(item, index) => (
                    <List.Item
                      actions={[
                        <Button
                          key="read"
                          size="small"
                          type="link"
                          className="font-medium text-brand-color p-0"
                          onClick={() => message.info(`Đang mở tài liệu: ${item.title}`)}
                        >
                          Xem tài liệu học tập &rarr;
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="velica-task-item-icon velica-task-item-icon-blue">
                            <FileText size={16} />
                          </div>
                        }
                        title={
                          <div className="d-flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-primary-color">
                              Chương {index + 1}: {item.title}
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
            key: 'syllabus',
            label: (
              <span className="d-flex items-center gap-2">
                <BookOpen size={16} />
                <span>Đề cương môn học (Syllabus)</span>
              </span>
            ),
            children: (
              <SyllabusView
                syllabus={syllabus}
                classData={currentClass}
                editable={false}
              />
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
        ]}
      />

      {/* 4. Submission Review Drawer (Detailed question-by-question view & teacher feedback) */}
      <Drawer
        title={
          <div>
            <div className="velica-drawer-title">
              Chi tiết Bài làm — {selectedSub?.assessmentTitle}
            </div>
            <div className="velica-drawer-subtitle">
              Nộp lúc: {selectedSub?.submittedAt} • Điểm: <strong>{selectedSub?.score} / {selectedSub?.maxScore}</strong>
            </div>
          </div>
        }
        open={reviewDrawerOpen}
        onClose={() => setReviewDrawerOpen(false)}
        width={640}
        extra={
          <Button
            type="primary"
            icon={<MessageSquarePlus size={14} />}
            onClick={handleOpenAppeal}
            className="velica-btn-action"
          >
            Phúc khảo điểm
          </Button>
        }
      >
        {selectedSub && (
          <div>
            {/* Overall Score & Feedback Banner */}
            <div className="p-3 bg-muted rounded-2 border mb-4">
              <div className="d-flex items-center justify-between mb-2">
                <span className="font-semibold text-primary-color">Kết quả đánh giá chính thức:</span>
                <span className="velica-score-high font-bold text-base">
                  {selectedSub.score !== null ? `${selectedSub.score} / ${selectedSub.maxScore} đ` : 'Chờ chấm'}
                </span>
              </div>
              <div className="text-xs text-muted-color">Lời phê chung của Giảng viên:</div>
              <p className="text-xs text-secondary-color mt-1 mb-0 italic">
                &ldquo;Sinh viên nắm vững nguyên lý thiết kế hệ thống và mô hình kiến trúc. Phần trả lời câu hỏi tự luận mạch lạc, đáp ứng đầy đủ tiêu chí của Rubric.&rdquo;
              </p>
            </div>

            {/* Questions Breakdown */}
            <h4 className="text-sm font-bold text-primary-color mb-3">
              Chi tiết câu trả lời & Điểm thành phần:
            </h4>

            {selectedSub.answers.map((ans, idx) => (
              <div key={ans.questionId} className="p-3 border rounded-2 mb-3 bg-white">
                <div className="d-flex items-center justify-between mb-2">
                  <span className="font-semibold text-xs text-brand-color">
                    Câu hỏi #{idx + 1}
                  </span>
                  <span className="velica-score-high text-xs">
                    {ans.pointsAwarded !== null ? `${ans.pointsAwarded} / ${ans.maxPoints} đ` : 'Chưa chấm'}
                  </span>
                </div>

                <div className="text-xs font-medium text-primary-color mb-2">
                  {ans.questionContent || 'Câu hỏi đánh giá chuẩn đầu ra môn học'}
                </div>

                <div className="p-2 bg-subtle rounded-1 text-xs mb-2">
                  <span className="text-muted-color">Câu trả lời của bạn: </span>
                  <span className="font-medium text-primary-color">
                    {typeof ans.studentAnswer === 'string' ? ans.studentAnswer : JSON.stringify(ans.studentAnswer)}
                  </span>
                </div>

                {ans.feedback && (
                  <div className="text-xs text-secondary-color bg-warning-bg p-2 rounded-1 border-warning-border">
                    <strong>Nhận xét từ GV:</strong> {ans.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Drawer>

      {/* 5. Grade Appeal Request Modal */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <MessageSquarePlus size={18} className="text-brand-color" />
            <span className="font-bold">Gửi Yêu cầu Phúc khảo Điểm bài thi</span>
          </div>
        }
        open={appealModalOpen}
        onClose={() => setAppealModalOpen(false)}
        width={480}
        footer={
          <div className="d-flex justify-end gap-2">
            <Button onClick={() => setAppealModalOpen(false)}>Hủy</Button>
            <Button
              type="primary"
              icon={<Send size={14} />}
              loading={isSubmittingAppeal}
              onClick={handleSubmitAppeal}
              className="velica-btn-primary"
            >
              Gửi đơn phúc khảo
            </Button>
          </div>
        }
      >
        <Form form={appealForm} layout="vertical">
          <Form.Item
            name="questionId"
            label="Chọn câu hỏi cần phúc khảo"
            rules={[{ required: true, message: 'Vui lòng chọn câu hỏi' }]}
          >
            <Select
              options={
                selectedSub?.answers.map((a, i) => ({
                  value: a.questionId,
                  label: `Câu #${i + 1} (${a.pointsAwarded ?? '?'}/${a.maxPoints}đ) — ${a.questionContent?.slice(0, 40) || 'Câu hỏi'}...`,
                })) || []
              }
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do & Căn cứ đề nghị xem xét lại điểm"
            rules={[{ required: true, message: 'Vui lòng nêu rõ lý do phúc khảo' }]}
          >
            <TextArea
              rows={4}
              placeholder="Nêu rõ căn cứ theo tài liệu học tập, tiêu chí rubric hoặc đề cương môn học mà bạn cho rằng câu trả lời của mình xứng đáng đạt điểm cao hơn..."
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

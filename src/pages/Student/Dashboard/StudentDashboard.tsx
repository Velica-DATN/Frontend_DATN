import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Space, Tag, Table, Progress } from 'antd';
import {
  FileCheck2,
  Award,
  ArrowRight,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment, Submission } from '../../../interfaces/velica.interfaces';
import { StatCard } from '../../../components/velica/StatCard/StatCard';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';

export const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [asms, subs] = await Promise.all([
        mockService.getAssessments(),
        mockService.getSubmissions(),
      ]);
      setAssessments(asms);
      setSubmissions(subs);
    };
    fetchData();
  }, []);

  const nextExam =
    assessments.find((a) => a.status === 'PUBLISHED' && !submissions.some((s) => s.assessmentId === a.id)) ||
    assessments.find((a) => a.id === 'asm-practice') ||
    assessments[0];

  const resultColumns = [
    {
      title: 'Kỳ thi / Bài kiểm tra',
      dataIndex: 'assessmentTitle',
      key: 'assessmentTitle',
      render: (title: string) => (
        <div>
          <span className="velica-cell-title">{title}</span>
          <span className="velica-cell-desc d-block">Kiến Trúc Phần Mềm Hiện Đại</span>
        </div>
      ),
    },
    {
      title: 'Thời gian nộp',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 140,
      render: (ts: string) => <span className="velica-cell-desc">{ts}</span>,
    },
    {
      title: 'Điểm số',
      dataIndex: 'score',
      key: 'score',
      width: 120,
      render: (score: number | null, record: Submission) => (
        <span className={score !== null ? 'velica-score-high' : 'text-warning-color font-semibold'}>
          {score !== null ? `${score} / ${record.maxScore}` : 'Đang chấm'}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'gradingStatus',
      key: 'gradingStatus',
      width: 130,
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, record: Submission) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            className="p-0 font-medium text-brand-color"
            onClick={() => navigate(`${ROUTE_PATHS.STUDENT.ASSESSMENTS}?review=${record.assessmentId}`)}
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            size="small"
            className="p-0 font-medium text-secondary-color"
            onClick={() => navigate(ROUTE_PATHS.STUDENT.GRADE_REVIEWS)}
          >
            Phúc khảo
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* 1. Page Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <h2 className="velica-page-title">
            Không gian Học tập & Khảo thí Sinh viên 🎓
          </h2>
          <p className="velica-page-desc">
            Theo dõi tiến độ đạt chuẩn đầu ra (CLO), tra cứu bảng điểm học tập và thực hiện bài thi học phần trực tuyến.
          </p>
        </div>

        <div className="velica-page-header-end">
          <Button
            icon={<GraduationCap size={15} />}
            onClick={() => navigate(ROUTE_PATHS.STUDENT.CLASSES)}
            className="velica-btn-action"
          >
            Lớp học phần
          </Button>
          <Button
            icon={<FileCheck2 size={15} />}
            onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENTS)}
            className="velica-btn-action"
          >
            Bài thi & Kiểm tra
          </Button>
        </div>
      </div>

      {/* 2. Core Academic KPIs Row */}
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Điểm trung bình tích lũy (GPA)"
            value="8.52 / 10"
            trend={{ value: 'Xếp loại Giỏi', isPositive: true }}
            sparkline="up"
            onClick={() => navigate(ROUTE_PATHS.STUDENT.CLASSES)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Chuẩn đầu ra (CLO) đã đạt"
            value="88.5%"
            trend={{ value: '6/7 tiêu chí', isPositive: true, label: 'đạt chuẩn' }}
            sparkline="up"
            onClick={() => navigate(ROUTE_PATHS.STUDENT.CLASSES)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Bài thi đã hoàn thành"
            value={submissions.length || 3}
            subtext="100% đã công bố kết quả"
            onClick={() => navigate(`${ROUTE_PATHS.STUDENT.ASSESSMENTS}?tab=COMPLETED`)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Kỳ thi đang mở làm bài"
            value={assessments.filter((a) => a.status === 'PUBLISHED').length || 1}
            trend={{ value: 'Hạn: Hôm nay', isPositive: false }}
            sparkline="down"
            onClick={() => navigate(`${ROUTE_PATHS.STUDENT.ASSESSMENTS}?tab=PENDING`)}
          />
        </Col>
      </Row>

      {/* 3. Next Upcoming Exam Banner (Clean Single CTA) */}
      {nextExam && (
        <div className="velica-alert-banner-emerald mb-4">
          <div className="d-flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="velica-badge-emerald-pill">
                ● Đang mở làm bài thi
              </div>
              <h3 className="velica-alert-emerald-title">
                {nextExam.title}
              </h3>
              <p className="velica-alert-emerald-desc">
                Kiến Trúc Phần Mềm Hiện Đại • Thời gian làm bài: <strong>{nextExam.timeLimitMinutes} phút</strong> • Số câu hỏi: <strong>{nextExam.totalQuestions || 25} câu</strong> • Hạn hoàn thành: <strong>Hôm nay (23:59)</strong>
              </p>
            </div>

            <Button
              type="primary"
              onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENT_INSTRUCTIONS.replace(':id', nextExam.id))}
              className="velica-btn-emerald"
            >
              Vào làm bài thi ngay <ArrowRight size={15} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 4. Main Two Columns: Recent Results & CLO Competency Progress */}
      <Row gutter={[16, 16]}>
        {/* Left Column: Recent Submissions & Feedback */}
        <Col xs={24} lg={15}>
          <Card
            title={
              <div className="d-flex items-center gap-2">
                <Layers size={17} className="text-brand-color" />
                <span className="font-bold text-primary-color">
                  Kết quả kiểm tra & Đánh giá năng lực gần nhất
                </span>
              </div>
            }
            extra={
              <Button
                type="link"
                size="small"
                className="p-0 font-medium text-brand-color"
                onClick={() => navigate(ROUTE_PATHS.STUDENT.ASSESSMENTS)}
              >
                Xem tất cả bài thi &rarr;
              </Button>
            }
          >
            <Table
              dataSource={submissions}
              columns={resultColumns}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        {/* Right Column: Personal CLO Competency Attainment */}
        <Col xs={24} lg={9}>
          <Card
            title={
              <div className="d-flex items-center gap-2">
                <GraduationCap size={17} className="text-brand-color" />
                <span className="font-bold text-primary-color">
                  Tiến độ Chuẩn Đầu Ra (CLO) Cá nhân
                </span>
              </div>
            }
          >
            <div className="velica-clo-item">
              <div className="velica-clo-item-header">
                <span className="velica-clo-item-title">
                  CLO1: Nguyên lý SOLID & Clean Arch
                </span>
                <Tag color="success">92% Xuất sắc</Tag>
              </div>
              <Progress percent={92} strokeColor="#16A34A" size="small" showInfo={false} />
            </div>

            <div className="velica-clo-item">
              <div className="velica-clo-item-header">
                <span className="velica-clo-item-title">
                  CLO2: Thiết kế Microservices & API
                </span>
                <Tag color="blue">85% Giỏi</Tag>
              </div>
              <Progress percent={85} strokeColor="#2563EB" size="small" showInfo={false} />
            </div>

            <div className="velica-clo-item">
              <div className="velica-clo-item-header">
                <span className="velica-clo-item-title">
                  CLO3: Tối ưu hiệu năng & Bảo mật
                </span>
                <Tag color="warning">72% Cần rèn luyện</Tag>
              </div>
              <Progress percent={72} strokeColor="#D97706" size="small" showInfo={false} />
            </div>

            <div className="mt-3 p-3 bg-muted rounded-2 border">
              <div className="d-flex items-center gap-1 mb-1 text-xs font-semibold text-primary-color">
                <Sparkles size={14} className="text-brand-color" />
                <span>Khuyến nghị học tập:</span>
              </div>
              <p className="velica-cell-desc m-0">
                Ôn tập lại phần Cache Redis và Token JWT để củng cố chuẩn CLO3 trước kỳ thi cuối kỳ sắp tới.
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

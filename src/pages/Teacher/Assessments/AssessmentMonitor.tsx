import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Progress,
  Tag,
  Drawer,
  Timeline,
  Badge,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeft,
  Tv,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { Assessment, SessionViolation } from '../../../interfaces/velica.interfaces';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { StatusBadge } from '../../../components/velica/StatusBadge/StatusBadge';
import { StatCard } from '../../../components/velica/StatCard/StatCard';

const { Title, Text } = Typography;

interface StudentMonitorRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT' | 'NOT_STARTED';
  answeredCount: number;
  totalQuestions: number;
  connection: 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
  lastActivity: string;
  timeRemainingMinutes: number;
  violations: SessionViolation[];
}

export const AssessmentMonitor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentMonitorRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Simulated live student monitoring state
  const [students, setStudents] = useState<StudentMonitorRecord[]>([
    {
      id: 'stud-1',
      studentName: 'Lê Hoàng Nam',
      studentEmail: 'nam.lh@velica.edu.vn',
      status: 'SUBMITTED',
      answeredCount: 6,
      totalQuestions: 6,
      connection: 'ONLINE',
      lastActivity: '09:35:10',
      timeRemainingMinutes: 0,
      violations: [],
    },
    {
      id: 'stud-2',
      studentName: 'Phạm Thu Thảo',
      studentEmail: 'thao.pt@velica.edu.vn',
      status: 'IN_PROGRESS',
      answeredCount: 5,
      totalQuestions: 6,
      connection: 'ONLINE',
      lastActivity: '09:38:42',
      timeRemainingMinutes: 12,
      violations: [
        {
          id: 'v-1',
          type: 'TAB_SWITCH',
          timestamp: '09:15:22',
          description: 'Rời khỏi tab thi trong 4 giây',
        },
      ],
    },
    {
      id: 'stud-3',
      studentName: 'Đặng Quốc Duy',
      studentEmail: 'duy.dq@velica.edu.vn',
      status: 'IN_PROGRESS',
      answeredCount: 3,
      totalQuestions: 6,
      connection: 'RECONNECTING',
      lastActivity: '09:37:10',
      timeRemainingMinutes: 14,
      violations: [
        {
          id: 'v-2',
          type: 'TAB_SWITCH',
          timestamp: '09:12:05',
          description: 'Phát hiện chuyển cửa sổ trình duyệt (Focus lost)',
        },
        {
          id: 'v-3',
          type: 'TAB_SWITCH',
          timestamp: '09:24:18',
          description: 'Mở tab mới trong 12 giây',
        },
      ],
    },
    {
      id: 'stud-4',
      studentName: 'Vũ Minh Trí',
      studentEmail: 'tri.vm@velica.edu.vn',
      status: 'SUBMITTED',
      answeredCount: 6,
      totalQuestions: 6,
      connection: 'ONLINE',
      lastActivity: '09:32:00',
      timeRemainingMinutes: 0,
      violations: [],
    },
  ]);

  useEffect(() => {
    const fetchAsm = async () => {
      const data = await mockService.getAssessmentById(id || 'asm-1');
      setAssessment(data);
    };
    fetchAsm();
  }, [id]);

  const handleOpenViolationDrawer = (record: StudentMonitorRecord) => {
    setSelectedStudent(record);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: 'Sinh viên',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name: string, record: StudentMonitorRecord) => (
        <div>
          <Text strong className="velica-cell-title">{name}</Text>
          <Text type="secondary" className="velica-cell-desc">{record.studentEmail}</Text>
        </div>
      ),
    },
    {
      title: 'Tiến độ làm bài',
      key: 'progress',
      render: (_: unknown, record: StudentMonitorRecord) => {
        const percent = Math.round((record.answeredCount / record.totalQuestions) * 100);
        return (
          <div className="w-160">
            <div className="d-flex justify-between text-xs mb-1">
              <span>{record.answeredCount}/{record.totalQuestions} câu</span>
              <span className="font-semibold">{percent}%</span>
            </div>
            <Progress
              percent={percent}
              size="small"
              strokeColor="#2383E2"
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: 'Trạng thái nộp bài',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusBadge status={status} size="sm" />,
    },
    {
      title: 'Kết nối mạng',
      dataIndex: 'connection',
      key: 'connection',
      render: (conn: string) => {
        if (conn === 'ONLINE') {
          return (
            <Tag color="success" className="d-inline-flex items-center gap-1 rounded-2">
              <Wifi size={12} /> Trực tuyến
            </Tag>
          );
        }
        if (conn === 'RECONNECTING') {
          return (
            <Tag color="warning" className="d-inline-flex items-center gap-1 rounded-2">
              <Wifi size={12} /> Kết nối lại...
            </Tag>
          );
        }
        return (
          <Tag color="error" className="d-inline-flex items-center gap-1 rounded-2">
            <WifiOff size={12} /> Mất mạng
          </Tag>
        );
      },
    },
    {
      title: 'Thời gian còn lại',
      dataIndex: 'timeRemainingMinutes',
      key: 'timeRemainingMinutes',
      render: (mins: number, record: StudentMonitorRecord) =>
        record.status === 'SUBMITTED' ? (
          <span className="text-muted-color">Đã hoàn thành</span>
        ) : (
          <span className={mins < 10 ? 'font-semibold text-danger-color' : 'font-semibold text-primary-color'}>
            {mins} phút
          </span>
        ),
    },
    {
      title: 'Cảnh báo vi phạm',
      key: 'violations',
      render: (_: unknown, record: StudentMonitorRecord) => {
        const count = record.violations.length;
        if (count === 0) {
          return <Tag color="green" className="rounded-2">An toàn</Tag>;
        }
        return (
          <Button
            size="small"
            danger
            icon={<AlertTriangle size={13} />}
            onClick={() => handleOpenViolationDrawer(record)}
            className="rounded-2 text-xs"
          >
            {count} vi phạm (Xem)
          </Button>
        );
      },
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="velica-back-nav-bar">
        <Button
          type="text"
          icon={<ArrowLeft size={14} />}
          onClick={() => navigate(ROUTE_PATHS.TEACHER.ASSESSMENTS)}
          className="velica-back-btn"
        >
          Quay lại danh sách đề thi
        </Button>
      </div>

      {/* Live Proctoring SaaS Header */}
      <div className="velica-hero-banner">
        <div className="velica-hero-header">
          <div>
            <div className="d-flex items-center gap-2 flex-wrap mb-2">
              <span className="velica-badge-live">
                <span className="velica-live-dot" />
                GIÁM SÁT TRỰC TIẾP
              </span>
              <span className="velica-badge-gray">
                Tự động đồng bộ mỗi 10 giây
              </span>
            </div>

            <h1 className="velica-hero-title">
              {assessment?.title || 'Kiểm Tra Giữa Kỳ'}
            </h1>
            <p className="velica-hero-meta">
              Theo dõi nhịp tim thiết bị kết nối của {students.length} thí sinh • Cảnh báo gian lận & mất tiêu điểm trình duyệt
            </p>
          </div>

          <Button
            icon={<RefreshCw size={15} />}
            onClick={() => {
              setStudents([...students]);
            }}
            className="velica-btn-action"
          >
            Làm mới nhịp tim
          </Button>
        </div>
      </div>

      {/* Monitor Metrics Row */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={8}>
          <StatCard
            title="Đang làm bài (In Progress)"
            value={students.filter((s) => s.status === 'IN_PROGRESS').length}
            trend={{ value: '2 thí sinh', isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Đã nộp bài (Submitted)"
            value={students.filter((s) => s.status === 'SUBMITTED').length}
            trend={{ value: '2 thí sinh', isPositive: true }}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Số thí sinh có vi phạm"
            value={students.filter((s) => s.violations.length > 0).length}
            trend={{ value: 'Cần lưu ý', isPositive: false }}
          />
        </Col>
      </Row>

      {/* Real-time Student Table */}
      <div className="velica-card-table">
        <Table
          dataSource={students}
          columns={columns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Violation Detail Drawer */}
      <Drawer
        title={`Chi tiết vi phạm phòng thi: ${selectedStudent?.studentName}`}
        placement="right"
        width={420}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="mb-3">
          <Text type="secondary" className="text-sm">
            Sinh viên: <Text strong>{selectedStudent?.studentName}</Text> ({selectedStudent?.studentEmail})
          </Text>
        </div>

        <Timeline
          items={selectedStudent?.violations.map((v) => ({
            color: 'red',
            children: (
              <div>
                <div className="velica-violation-title">{v.type}</div>
                <div className="velica-violation-desc">{v.description}</div>
                <div className="velica-violation-time">Thời điểm: {v.timestamp}</div>
              </div>
            ),
          }))}
        />
      </Drawer>
    </div>
  );
};

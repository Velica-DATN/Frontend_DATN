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
  Tooltip,
  Alert,
  message,
  Popconfirm,
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
  ShieldAlert,
  Laptop,
  CheckCircle2,
  Ban,
  Radio,
  MonitorX,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import { proctoringSocket } from '../../../api/services/proctoringSocketService';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

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
          id: 'v-concurrent',
          type: 'CONCURRENT_LOGIN_ATTEMPT',
          timestamp: '09:34:15',
          description: 'Phát hiện đăng nhập song song từ Máy B (IP: 118.69.182.10 - Đà Nẵng, Chrome trên Windows). Hệ thống đã lập tức chặn máy B.',
          deviceInfo: 'Thiết bị A (Hợp lệ): macOS / Chrome (TP.HCM) ➔ Thiết bị B (Chặn): Windows / Chrome (Đà Nẵng)',
          ipAddress: '118.69.182.10',
        },
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
          id: 'v-switch',
          type: 'DEVICE_TAKEOVER_REQUEST',
          timestamp: '09:36:00',
          description: 'Thí sinh gửi yêu cầu chuyển thiết bị thi do máy tính cũ sập nguồn (Đang chờ Giám thị phê duyệt đổi máy).',
          deviceInfo: 'Máy cũ: Laptop Dell Win 10 (Sập nguồn lúc 09:33) ➔ Máy mới: iPad Pro (Yêu cầu đăng nhập tiếp tục)',
          ipAddress: '14.161.22.99',
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
    {
      id: 'stud-5',
      studentName: 'Trần Quang Huy',
      studentEmail: 'huy.tq@velica.edu.vn',
      status: 'IN_PROGRESS',
      answeredCount: 2,
      totalQuestions: 6,
      connection: 'ONLINE',
      lastActivity: '09:38:05',
      timeRemainingMinutes: 18,
      violations: [
        {
          id: 'v-remote',
          type: 'REMOTE_CONTROL_SUSPECTED',
          timestamp: '09:28:40',
          description: 'Phát hiện tín hiệu phần mềm điều khiển từ xa (AnyDesk/TeamViewer hook chuột). Nghi vấn có người làm bài hộ.',
          deviceInfo: 'Windows 11 / AnyDesk Service Detected',
          ipAddress: '42.118.89.201',
        },
      ],
    },
  ]);

  useEffect(() => {
    const fetchAsm = async () => {
      const data = await mockService.getAssessmentById(id || 'asm-1');
      setAssessment(data);
    };
    fetchAsm();
  }, [id]);

  // Listen for real-time WebSocket events from student exams
  useEffect(() => {
    const handleRemoteEvent = (event: any) => {
      if (!event || !event.type) return;

      if (event.type === 'STUDENT_JOIN') {
        setStudents((prev) => {
          const exists = prev.find((s) => s.id === event.studentId);
          if (exists) {
            return prev.map((s) =>
              s.id === event.studentId ? { ...s, connection: 'ONLINE', status: 'IN_PROGRESS' } : s
            );
          }
          const newStudent: StudentMonitorRecord = {
            id: event.studentId,
            studentName: event.studentName || 'Thí sinh mới',
            studentEmail: event.studentEmail || 'student@velica.edu.vn',
            status: 'IN_PROGRESS',
            answeredCount: 0,
            totalQuestions: 6,
            connection: 'ONLINE',
            lastActivity: event.timestamp || new Date().toLocaleTimeString('vi-VN'),
            timeRemainingMinutes: 45,
            violations: [],
          };
          return [newStudent, ...prev];
        });
        message.info(`WebSocket Live: Thí sinh ${event.studentName || ''} vừa tham gia phòng thi!`);
      } else if (event.type === 'HEARTBEAT') {
        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === event.studentId) {
              return {
                ...s,
                connection: 'ONLINE',
                lastActivity: event.timestamp || new Date().toLocaleTimeString('vi-VN'),
                answeredCount:
                  typeof event.payload?.answersCount === 'number'
                    ? (event.payload.answersCount as number)
                    : s.answeredCount,
              };
            }
            return s;
          })
        );
      } else if (
        event.type === 'TAB_SWITCH' ||
        event.type === 'FULLSCREEN_EXIT' ||
        event.type === 'DEVTOOLS_DETECTED' ||
        event.type === 'DOM_TAMPER_DETECTED'
      ) {
        const violationType = event.type as SessionViolation['type'];
        const violationDesc =
          (event.payload?.reason as string) ||
          (event.type === 'TAB_SWITCH'
            ? 'Chuyển sang tab hoặc ứng dụng khác ngoài bài thi (Tab Switch)'
            : event.type === 'DEVTOOLS_DETECTED'
            ? 'Phát hiện can thiệp Developer Tools'
            : event.type === 'DOM_TAMPER_DETECTED'
            ? 'Phát hiện sửa đổi cấu trúc DOM bài thi'
            : 'Thoát khỏi chế độ toàn màn hình (Full Screen Exit)');

        const newViolation: SessionViolation = {
          id: `v-live-${Date.now()}`,
          type: violationType,
          timestamp: event.timestamp || new Date().toLocaleTimeString('vi-VN'),
          description: `${violationDesc} (Lần #${event.payload?.violationCount || 1})`,
          deviceInfo: 'Được ghi nhận trực tiếp qua Telemetry WebSocket',
        };

        setStudents((prev) =>
          prev.map((s) => {
            if (s.id === event.studentId || (!event.studentId && s.id === 'stud-2')) {
              const updatedViolations = [newViolation, ...(s.violations || [])];
              return {
                ...s,
                lastActivity: event.timestamp || new Date().toLocaleTimeString('vi-VN'),
                violations: updatedViolations,
              };
            }
            return s;
          })
        );

        setSelectedStudent((prevSelected) => {
          if (
            prevSelected &&
            (prevSelected.id === event.studentId || (!event.studentId && prevSelected.id === 'stud-2'))
          ) {
            return {
              ...prevSelected,
              lastActivity: event.timestamp || new Date().toLocaleTimeString('vi-VN'),
              violations: [newViolation, ...(prevSelected.violations || [])],
            };
          }
          return prevSelected;
        });

        if (event.type === 'DEVTOOLS_DETECTED' || event.type === 'DOM_TAMPER_DETECTED') {
          message.error({
            content: `BÁO ĐỘNG ĐỎ [${event.studentName || 'Thí sinh'}]: ${violationDesc}!`,
            duration: 6,
          });
        } else {
          message.warning({
            content: `Cảnh báo vi phạm Live [${event.studentName || 'Thí sinh'}]: ${violationDesc}!`,
            duration: 5,
          });
        }
      } else if (event.type === 'SUBMIT_EXAM') {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === event.studentId
              ? {
                  ...s,
                  status: 'SUBMITTED',
                  lastActivity: event.timestamp || new Date().toLocaleTimeString('vi-VN'),
                  answeredCount: s.totalQuestions,
                }
              : s
          )
        );
        message.success(`Thí sinh ${event.studentName || ''} đã hoàn thành và nộp bài.`);
      }
    };

    proctoringSocket.on('*', handleRemoteEvent);
    return () => proctoringSocket.off('*', handleRemoteEvent);
  }, []);

  // Action: Cưỡng chế thu bài thi qua WebSocket (Force Submit)
  const handleForceSubmit = (studentId: string, studentName: string) => {
    proctoringSocket.emit({
      type: 'FORCE_SUBMIT',
      assessmentId: id || 'asm-1',
      timestamp: new Date().toLocaleTimeString('vi-VN'),
      payload: {
        targetStudentId: studentId,
        reason: 'Giám thị thực hiện lệnh thu bài cưỡng chế do vi phạm quy chế thi',
      },
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, status: 'SUBMITTED', lastActivity: new Date().toLocaleTimeString('vi-VN') }
          : s
      )
    );
    message.warning(`Đã gửi lệnh WebSocket THU BÀI CƯỠNG CHẾ xuống bài thi của ${studentName}!`);
    setDrawerOpen(false);
  };

  const handleOpenViolationDrawer = (record: StudentMonitorRecord) => {
    setSelectedStudent(record);
    setDrawerOpen(true);
  };

  // Action: Phê duyệt chuyển đổi thiết bị thi (Device Takeover Approval)
  const handleApproveDeviceSwitch = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          return {
            ...s,
            connection: 'ONLINE' as const,
            violations: s.violations.map((v) =>
              v.type === 'DEVICE_TAKEOVER_REQUEST'
                ? {
                    ...v,
                    description: `[ĐÃ DUYỆT ĐỔI MÁY] Giám thị đã phê duyệt cho phép thí sinh chuyển sang thiết bị mới. Phiên máy cũ đã bị vô hiệu hóa cưỡng chế lúc ${new Date().toLocaleTimeString('vi-VN')}.`,
                  }
                : v
            ),
          };
        }
        return s;
      })
    );
    message.success('Đã phê duyệt đổi máy thi thành công! Phiên trên thiết bị cũ đã bị vô hiệu hóa.');
    setDrawerOpen(false);
  };

  // Action: Đình chỉ bài thi vì vi phạm thi hộ / đăng nhập song song
  const handleSuspendExam = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, status: 'TIMED_OUT' as const, connection: 'OFFLINE' as const } : s
      )
    );
    message.error('Đã đình chỉ bài thi của thí sinh! Đã lập biên bản vi phạm quy chế khảo thí.');
    setDrawerOpen(false);
  };

  // Action: Gửi cảnh báo đỏ tới màn hình thí sinh
  const handleSendWarning = (studentName: string) => {
    message.info(`Đã phát tín hiệu cảnh báo vi phạm trực tiếp xuống màn hình của ${studentName}!`);
  };

  const columns = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center' as const,
      render: (_: unknown, __: unknown, idx: number) => (
        <span className="font-semibold text-xs text-muted-color">
          #{(page - 1) * pageSize + idx + 1}
        </span>
      ),
    },
    {
      title: 'Sinh viên',
      dataIndex: 'studentName',
      key: 'studentName',
      ellipsis: true,
      render: (name: string, record: StudentMonitorRecord) => (
        <div style={{ maxWidth: 260 }}>
          <Tooltip title={name}>
            <Text strong className="velica-cell-title text-truncate d-block" style={{ maxWidth: 240 }}>{name}</Text>
          </Tooltip>
          <Tooltip title={record.studentEmail}>
            <Text type="secondary" className="velica-cell-desc text-truncate d-block" style={{ maxWidth: 240 }}>{record.studentEmail}</Text>
          </Tooltip>
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
    {
      title: 'Hành động',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: StudentMonitorRecord) => (
        <Space size="small">
          <Button
            size="small"
            icon={<Eye size={13} />}
            onClick={() => handleOpenViolationDrawer(record)}
            className="rounded-2 text-xs"
          >
            Chi tiết
          </Button>
          {record.status === 'IN_PROGRESS' && (
            <Popconfirm
              title={`Thu bài cưỡng chế thí sinh ${record.studentName}?`}
              description="Lệnh WebSocket sẽ được gửi trực tiếp để cưỡng chế nộp bài ngay lập tức."
              onConfirm={() => handleForceSubmit(record.id, record.studentName)}
              okText="Thu bài"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Cưỡng chế nộp bài qua WebSocket">
                <Button size="small" danger icon={<MonitorX size={13} />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
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
              <div className="velica-ws-live-badge">
                <span className="velica-ws-pulsing-dot" />
                <span>Live WebSocket Proctoring</span>
              </div>
              <span className="velica-badge-gray">
                Kênh: velica_exam_websocket_channel
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
      <div className="velica-table-container">
        <Table
          dataSource={students}
          columns={columns}
          rowKey="id"
          pagination={{
            current: page,
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['8', '15', '25', '50'],
            showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} thí sinh`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      {/* Violation Detail Drawer */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <ShieldAlert size={18} className="text-danger" />
            <span>Chi tiết Giám sát & Vi phạm: {selectedStudent?.studentName}</span>
          </div>
        }
        placement="right"
        width={480}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="mb-3 p-3 bg-light rounded-3 border">
          <div className="d-flex justify-between items-center mb-1">
            <Text strong className="fs-6 text-dark">{selectedStudent?.studentName}</Text>
            <StatusBadge status={selectedStudent?.status || 'IN_PROGRESS'} size="sm" />
          </div>
          <div className="text-xs text-muted-color">
            Email: <span className="font-mono">{selectedStudent?.studentEmail}</span>
          </div>
          <div className="text-xs text-muted-color mt-1">
            Tiến độ: <strong>{selectedStudent?.answeredCount}/{selectedStudent?.totalQuestions} câu</strong> • Thời gian còn lại: <strong>{selectedStudent?.timeRemainingMinutes} phút</strong>
          </div>
        </div>

        {/* Special Actions if Device Takeover or Concurrent Login is detected */}
        {selectedStudent?.violations.some((v) => v.type === 'DEVICE_TAKEOVER_REQUEST') && (
          <Alert
            message="Yêu cầu Đổi Thiết Bị Thi (Sập nguồn / Hỏng máy)"
            description={
              <div className="mt-1">
                <div className="text-xs mb-2">
                  Thí sinh báo cáo máy tính cũ gặp sự cố kỹ thuật và đang đăng nhập trên thiết bị mới để xin tiếp tục làm bài.
                </div>
                <Space size="small">
                  <Button
                    type="primary"
                    size="small"
                    className="velica-btn-primary"
                    icon={<CheckCircle2 size={13} />}
                    onClick={() => handleApproveDeviceSwitch(selectedStudent.id)}
                  >
                    Chấp thuận đổi máy & Thu hồi máy cũ
                  </Button>
                </Space>
              </div>
            }
            type="warning"
            showIcon
            className="mb-3 rounded-2"
          />
        )}

        {selectedStudent?.violations.some((v) => v.type === 'CONCURRENT_LOGIN_ATTEMPT' || v.type === 'REMOTE_CONTROL_SUSPECTED') && (
          <Alert
            message="Cảnh báo Gian lận / Nghi vấn Thi hộ"
            description={
              <div className="mt-1">
                <div className="text-xs mb-2">
                  Phát hiện hành vi đăng nhập từ 2 máy khác nhau hoặc phần mềm điều khiển từ xa (AnyDesk/TeamViewer).
                </div>
                <Space size="small">
                  <Popconfirm
                    title="Đình chỉ bài thi thí sinh này?"
                    description="Thao tác này sẽ khóa bài thi ngay lập tức và lập biên bản vi phạm quy chế thi."
                    onConfirm={() => handleSuspendExam(selectedStudent.id)}
                    okText="Đình chỉ ngay"
                    cancelText="Hủy"
                    okButtonProps={{ danger: true }}
                  >
                    <Button danger size="small" icon={<Ban size={13} />}>
                      Đình chỉ bài thi
                    </Button>
                  </Popconfirm>
                  <Button
                    size="small"
                    icon={<Radio size={13} />}
                    onClick={() => handleSendWarning(selectedStudent.studentName)}
                  >
                    Gửi cảnh báo đỏ
                  </Button>
                </Space>
              </div>
            }
            type="error"
            showIcon
            className="mb-3 rounded-2"
          />
        )}

        {selectedStudent?.status === 'IN_PROGRESS' && (
          <div className="mb-3 p-2 bg-light rounded-2 border d-flex items-center justify-between">
            <span className="text-xs text-secondary">Thao tác phòng thi:</span>
            <Space size="small">
              <Button
                size="small"
                icon={<Radio size={13} />}
                onClick={() => selectedStudent && handleSendWarning(selectedStudent.studentName)}
              >
                Gửi cảnh báo
              </Button>
              <Popconfirm
                title={`Thu bài cưỡng chế thí sinh ${selectedStudent?.studentName}?`}
                description="Lệnh WebSocket sẽ được gửi trực tiếp để cưỡng chế nộp bài ngay lập tức."
                onConfirm={() => selectedStudent && handleForceSubmit(selectedStudent.id, selectedStudent.studentName)}
                okText="Thu bài"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger size="small" icon={<MonitorX size={13} />}>
                  Thu bài cưỡng chế
                </Button>
              </Popconfirm>
            </Space>
          </div>
        )}

        <div className="fw-semibold text-xs text-secondary-color mb-2 text-uppercase tracking-wider">
          Nhật ký lưu vết vi phạm ({selectedStudent?.violations.length || 0} sự kiện):
        </div>

        <Timeline
          items={selectedStudent?.violations.map((v) => {
            const isCritical =
              v.type === 'CONCURRENT_LOGIN_ATTEMPT' ||
              v.type === 'REMOTE_CONTROL_SUSPECTED' ||
              v.type === 'DEVICE_TAKEOVER_REQUEST' ||
              v.type === 'DEVTOOLS_DETECTED' ||
              v.type === 'DOM_TAMPER_DETECTED';

            const tagColor =
              v.type === 'CONCURRENT_LOGIN_ATTEMPT'
                ? 'red'
                : v.type === 'DEVTOOLS_DETECTED'
                ? 'magenta'
                : v.type === 'DOM_TAMPER_DETECTED'
                ? 'purple'
                : v.type === 'DEVICE_TAKEOVER_REQUEST'
                ? 'gold'
                : v.type === 'REMOTE_CONTROL_SUSPECTED'
                ? 'volcano'
                : 'orange';

            return {
              color: isCritical ? 'red' : 'orange',
              children: (
                <div className="mb-2">
                  <div className="d-flex items-center justify-between gap-1 mb-1">
                    <Tag color={tagColor} className="m-0 font-semibold text-2xs">
                      {v.type === 'CONCURRENT_LOGIN_ATTEMPT'
                        ? 'ĐĂNG NHẬP ĐỒNG THỜI'
                        : v.type === 'DEVICE_TAKEOVER_REQUEST'
                        ? 'YÊU CẦU ĐỔI THIẾT BỊ'
                        : v.type === 'REMOTE_CONTROL_SUSPECTED'
                        ? 'NGHI VẤN REMOTE CONTROL'
                        : v.type === 'DEVTOOLS_DETECTED'
                        ? 'CAN THIỆP DEVTOOLS'
                        : v.type === 'DOM_TAMPER_DETECTED'
                        ? 'CAN THIỆP DOM'
                        : v.type}
                    </Tag>
                    <span className="text-2xs text-muted-color">{v.timestamp}</span>
                  </div>
                  <div className="text-xs text-dark leading-snug">{v.description}</div>
                  {v.deviceInfo && (
                    <div className="text-2xs text-muted-color mt-1 font-mono bg-white p-1 rounded border">
                      {v.deviceInfo}
                    </div>
                  )}
                  {v.ipAddress && (
                    <div className="text-2xs text-secondary-color mt-0.5">
                      IP nguồn: <span className="font-mono fw-semibold">{v.ipAddress}</span>
                    </div>
                  )}
                </div>
              ),
            };
          })}
        />
      </Drawer>
    </div>
  );
};

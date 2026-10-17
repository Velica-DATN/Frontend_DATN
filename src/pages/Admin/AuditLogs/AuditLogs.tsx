import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Typography,
  Tag,
  Card,
  Space,
  Button,
  Input,
  Select,
  Segmented,
  Row,
  Col,
  Drawer,
  Descriptions,
  Divider,
  Tooltip,
  Alert,
} from 'antd';
import {
  Search,
  FileCheck,
  Edit3,
  Clock,
  User,
  GraduationCap,
  Eye,
  RefreshCw,
  Layers,
  Activity,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { mockService } from '../../../api/mocks/mockService';
import {
  AuditLogItem,
  GradeAuditLog,
  GradeAppeal,
  ClassRoom,
} from '../../../interfaces/velica.interfaces';

const { Title, Text, Paragraph } = Typography;

export const AuditLogs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Top Active Tab: 'grade_audit' (primary) | 'system_logs'
  const initialTab = searchParams.get('tab') === 'system' ? 'system_logs' : 'grade_audit';
  const [activeTab, setActiveTab] = useState<'grade_audit' | 'system_logs'>(initialTab);

  // Grade Audit State
  const [gradeLogs, setGradeLogs] = useState<GradeAuditLog[]>([]);
  const [appeals, setAppeals] = useState<GradeAppeal[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(true);

  // Grade Audit Filters
  const initialType = (searchParams.get('type') as 'ALL' | 'MANUAL' | 'APPEAL') || 'ALL';
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MANUAL' | 'APPEAL'>(initialType);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [gradeSearch, setGradeSearch] = useState<string>('');

  // Selected Grade Audit for Detail Drawer
  const [selectedAudit, setSelectedAudit] = useState<GradeAuditLog | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // System Audit Logs State
  const [systemLogs, setSystemLogs] = useState<AuditLogItem[]>([]);
  const [loadingSystem, setLoadingSystem] = useState(true);
  const [systemSearch, setSystemSearch] = useState('');

  // Fetch Grade Audit Data
  const loadGradeAuditData = async () => {
    setLoadingGrades(true);
    try {
      const [allGradeLogs, allAppeals, allClasses] = await Promise.all([
        mockService.getGradeAuditLogs(),
        mockService.getAppeals(),
        mockService.getClasses(),
      ]);
      setGradeLogs(allGradeLogs);
      setAppeals(allAppeals);
      setClasses(allClasses);
    } catch {
      // error handling
    } finally {
      setLoadingGrades(false);
    }
  };

  // Fetch System Logs Data
  const loadSystemData = async () => {
    setLoadingSystem(true);
    try {
      const sysLogs = await mockService.getAuditLogs();
      setSystemLogs(sysLogs);
    } catch {
      // error handling
    } finally {
      setLoadingSystem(false);
    }
  };

  useEffect(() => {
    loadGradeAuditData();
    loadSystemData();
  }, []);

  // Sync tab with URL if param changes
  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'APPEAL' || typeParam === 'MANUAL') {
      setTypeFilter(typeParam);
      setActiveTab('grade_audit');
    }
  }, [searchParams]);

  // Unique Teachers extracted from gradeLogs
  const uniqueTeachers = useMemo(() => {
    const names = new Set<string>();
    gradeLogs.forEach((l) => {
      if (l.changedBy) names.add(l.changedBy);
    });
    return Array.from(names);
  }, [gradeLogs]);

  // Filtered Grade Logs
  const filteredGradeLogs = useMemo(() => {
    return gradeLogs.filter((log) => {
      // Filter by type
      if (typeFilter !== 'ALL' && log.type !== typeFilter) {
        return false;
      }
      // Filter by class
      if (classFilter !== 'all' && log.classId !== classFilter) {
        return false;
      }
      // Filter by teacher
      if (teacherFilter !== 'all' && log.changedBy !== teacherFilter) {
        return false;
      }
      // Search keyword
      if (gradeSearch.trim()) {
        const q = gradeSearch.toLowerCase().trim();
        const matchStudent =
          log.studentName.toLowerCase().includes(q) ||
          (log.studentCode && log.studentCode.toLowerCase().includes(q));
        const matchAssessment =
          (log.assessmentTitle && log.assessmentTitle.toLowerCase().includes(q)) ||
          (log.componentName && log.componentName.toLowerCase().includes(q));
        const matchClass = log.className && log.className.toLowerCase().includes(q);
        const matchTeacher = log.changedBy && log.changedBy.toLowerCase().includes(q);
        const matchReason = log.reason && log.reason.toLowerCase().includes(q);
        const matchAppeal = log.appealId && log.appealId.toLowerCase().includes(q);

        if (
          !matchStudent &&
          !matchAssessment &&
          !matchClass &&
          !matchTeacher &&
          !matchReason &&
          !matchAppeal
        ) {
          return false;
        }
      }
      return true;
    });
  }, [gradeLogs, typeFilter, classFilter, teacherFilter, gradeSearch]);

  // Filtered System Logs
  const filteredSystemLogs = useMemo(() => {
    if (!systemSearch.trim()) return systemLogs;
    const q = systemSearch.toLowerCase().trim();
    return systemLogs.filter(
      (l) =>
        l.userName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.entityType.toLowerCase().includes(q)
    );
  }, [systemLogs, systemSearch]);

  // Reset Filters
  const handleResetFilters = () => {
    setTypeFilter('ALL');
    setClassFilter('all');
    setTeacherFilter('all');
    setGradeSearch('');
    setSearchParams({});
  };

  // Inspect detail
  const handleViewDetail = (record: GradeAuditLog) => {
    setSelectedAudit(record);
    setIsDetailDrawerOpen(true);
  };

  // Look up linked appeal details
  const linkedAppeal = useMemo(() => {
    if (!selectedAudit?.appealId) return null;
    return appeals.find((a) => a.id === selectedAudit.appealId) || null;
  }, [selectedAudit, appeals]);

  // Grade Audit Metrics
  const totalAuditCount = gradeLogs.length;
  const manualOverridesCount = gradeLogs.filter((l) => l.type === 'MANUAL').length;
  const appealAuditsCount = gradeLogs.filter((l) => l.type === 'APPEAL').length;

  // Grade Audit Table Columns
  const gradeColumns = [
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
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 105,
      render: (ts: string) => {
        const d = new Date(ts);
        const dateStr = d.toLocaleDateString('vi-VN');
        const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return (
          <div>
            <span className="font-mono text-xs font-semibold text-brand-color">{dateStr}</span>
            <div className="font-mono text-2xs text-muted-color">{timeStr}</div>
          </div>
        );
      },
    },
    {
      title: 'Hình thức',
      dataIndex: 'type',
      key: 'type',
      width: 115,
      render: (type: 'MANUAL' | 'APPEAL', record: GradeAuditLog) => (
        <div>
          {type === 'APPEAL' ? (
            <Tag color="purple" className="velica-tag-pill font-medium text-2xs m-0" icon={<FileCheck size={11} className="inline me-0.5" />}>
              Phúc khảo
            </Tag>
          ) : (
            <Tag color="blue" className="velica-tag-pill font-medium text-2xs m-0" icon={<Edit3 size={11} className="inline me-0.5" />}>
              Sửa trực tiếp
            </Tag>
          )}
          {record.appealId && (
            <span className="font-mono text-2xs text-muted-color d-block mt-0.5">
              #{record.appealId}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Sinh viên',
      key: 'student',
      width: 135,
      render: (_: unknown, record: GradeAuditLog) => (
        <div>
          <span className="font-semibold text-xs text-brand-color d-block truncate" title={record.studentName}>
            {record.studentName}
          </span>
          <span className="font-mono text-2xs text-muted-color">
            {record.studentCode || '—'}
          </span>
        </div>
      ),
    },
    {
      title: 'Lớp học phần',
      dataIndex: 'className',
      key: 'className',
      width: 145,
      render: (className: string) => (
        <span className="text-xs font-medium text-secondary-color line-clamp-2" title={className}>
          {className || 'Lớp học phần'}
        </span>
      ),
    },
    {
      title: 'Bài thi / Cột điểm',
      key: 'assessment',
      width: 165,
      render: (_: unknown, record: GradeAuditLog) => (
        <div>
          <div className="text-xs font-semibold text-brand-color line-clamp-1" title={record.assessmentTitle}>
            {record.assessmentTitle || 'Bài kiểm tra học phần'}
          </div>
          <Tag color="default" className="text-2xs font-normal mt-0.5 max-w-full truncate m-0">
            {record.componentName}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Biến động',
      key: 'scoreDiff',
      width: 120,
      render: (_: unknown, record: GradeAuditLog) => {
        const oldScore = record.oldScore;
        const newScore = record.newScore;
        const diff = oldScore !== null && oldScore !== undefined ? newScore - oldScore : 0;
        return (
          <div className="d-flex items-center gap-1">
            <span className="text-xs text-muted-color line-through">
              {oldScore !== null && oldScore !== undefined ? oldScore.toFixed(1) : '—'}
            </span>
            <span className="text-2xs text-muted-color">➔</span>
            <span className="font-bold text-xs text-brand-color">
              {newScore.toFixed(1)}
            </span>
            {oldScore !== null && oldScore !== undefined && (
              <Tag
                color={diff > 0 ? 'success' : diff < 0 ? 'error' : 'default'}
                className="font-mono text-2xs font-semibold px-1 py-0 m-0"
              >
                {diff > 0 ? `+${diff.toFixed(1)}` : diff < 0 ? `${diff.toFixed(1)}` : '0'}
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Giảng viên',
      dataIndex: 'changedBy',
      key: 'changedBy',
      width: 120,
      render: (changedBy: string) => (
        <div>
          <span className="text-xs font-semibold text-brand-color d-block truncate" title={changedBy}>{changedBy}</span>
          <Tag color="cyan" className="velica-tag-pill text-2xs font-medium mt-0.5 m-0">
            Giảng viên
          </Tag>
        </div>
      ),
    },
    {
      title: 'Lý do / Căn cứ',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => (
        <Paragraph
          ellipsis={{ rows: 2 }}
          className="text-xs text-secondary-color m-0"
          title={reason}
        >
          {reason}
        </Paragraph>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 115,
      fixed: 'right' as const,
      align: 'right' as const,
      render: (_: unknown, record: GradeAuditLog) => (
        <Tooltip title="Xem biên bản kiểm toán chi tiết">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<Eye size={12} />}
            onClick={() => handleViewDetail(record)}
            className="velica-btn-action text-2xs px-2"
          >
            Chi tiết
          </Button>
        </Tooltip>
      ),
    },
  ];

  // System Logs Table Columns
  const systemColumns = [
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
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 165,
      render: (ts: string) => <span className="font-mono text-xs text-muted-color">{ts}</span>,
    },
    {
      title: 'Tài khoản',
      dataIndex: 'userName',
      key: 'userName',
      width: 180,
      render: (name: string, record: AuditLogItem) => (
        <div>
          <span className="font-semibold text-xs text-brand-color">{name}</span>
          <Tag color="geekblue" className="ms-1.5 velica-tag-pill text-2xs">
            {record.userRole}
          </Tag>
        </div>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 170,
      render: (act: string) => <Tag color="blue" className="velica-tag-pill text-xs font-mono">{act}</Tag>,
    },
    {
      title: 'Loại thực thể',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 140,
      render: (type: string) => <Tag color="default" className="velica-tag-pill text-xs">{type}</Tag>,
    },
    {
      title: 'Chi tiết thay đổi',
      dataIndex: 'details',
      key: 'details',
      render: (details: string) => <span className="text-xs text-secondary-color">{details}</span>,
    },
    {
      title: 'IP Address',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (ip: string) => <span className="font-mono text-2xs px-2 py-0.5 rounded bg-muted text-muted-color">{ip}</span>,
    },
  ];

  return (
    <div className="animate-fade-in pb-5">
      {/* Top Header */}
      <div className="velica-page-header">
        <div className="velica-page-header-start">
          <Title level={4} className="velica-page-title d-flex items-center gap-2">
            <History size={22} className="text-brand-color" />
            Nhật Ký Kiểm Toán & Thanh Tra Điểm Số (Audit Logs)
          </Title>
          <Text type="secondary" className="velica-page-desc">
            Giám sát toàn diện mọi lần điều chỉnh điểm số (Sửa điểm trực tiếp & Chấm lại phúc khảo) của giảng viên và nhật ký bảo mật hệ thống theo chuẩn kiểm định giáo dục.
          </Text>
        </div>

        <Space>
          <Button
            icon={<RefreshCw size={15} />}
            onClick={() => {
              loadGradeAuditData();
              loadSystemData();
            }}
            className="velica-btn-action"
          >
            Làm mới
          </Button>
        </Space>
      </div>

      {/* Primary Tab Switcher */}
      <div className="mb-4">
        <Segmented
          value={activeTab}
          onChange={(val) => {
            setActiveTab(val as 'grade_audit' | 'system_logs');
            setSearchParams(val === 'system_logs' ? { tab: 'system' } : {});
          }}
          options={[
            {
              value: 'grade_audit',
              label: (
                <div className="d-flex items-center gap-2 px-3 py-1">
                  <FileSpreadsheet size={16} className="text-brand-color" />
                  <span className="font-semibold text-sm">
                    Thanh Tra Sửa Điểm & Đơn Phúc Khảo ({gradeLogs.length})
                  </span>
                </div>
              ),
            },
            {
              value: 'system_logs',
              label: (
                <div className="d-flex items-center gap-2 px-3 py-1">
                  <Activity size={16} />
                  <span className="font-semibold text-sm">
                    Nhật Ký Hoạt Động Toàn Hệ Thống ({systemLogs.length})
                  </span>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* ===================== VIEW 1: GRADE AUDITS & APPEALS ===================== */}
      {activeTab === 'grade_audit' && (
        <>
          {/* Quick Stats Overview */}
          <Row gutter={[12, 12]} className="mb-3">
            <Col xs={12} sm={6}>
              <Card size="small" className="velica-stat-card py-1 px-2">
                <div className="text-secondary-color text-xs font-medium">Tổng lượt sửa điểm</div>
                <div className="text-xl font-bold text-brand-color mt-0.5">{totalAuditCount}</div>
                <div className="text-2xs text-muted-color mt-0.5">Toàn bộ lịch sử học vụ</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" className="velica-stat-card py-1 px-2">
                <div className="text-secondary-color text-xs font-medium">Sửa trực tiếp (Override)</div>
                <div className="text-xl font-bold text-blue mt-0.5">{manualOverridesCount}</div>
                <div className="text-2xs text-muted-color mt-0.5">Cộng điểm / Sửa sai sót</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" className="velica-stat-card py-1 px-2">
                <div className="text-secondary-color text-xs font-medium">Theo Đơn phúc khảo</div>
                <div className="text-xl font-bold text-purple mt-0.5">{appealAuditsCount}</div>
                <div className="text-2xs text-muted-color mt-0.5">Có đơn khiếu nại của SV</div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card size="small" className="velica-stat-card py-1 px-2">
                <div className="text-secondary-color text-xs font-medium">Lớp học phần biến động</div>
                <div className="text-xl font-bold text-cyan mt-0.5">
                  {new Set(gradeLogs.map((l) => l.classId)).size}
                </div>
                <div className="text-2xs text-muted-color mt-0.5">Được lưu vết toàn vẹn</div>
              </Card>
            </Col>
          </Row>

          {/* Comprehensive Filter Bar */}
          <Card size="small" className="mb-3 velica-admin-card">
            <Row gutter={[12, 12]} align="middle">
              {/* Type Segmented */}
              <Col xs={24} md={10} xl={7}>
                <div className="d-flex items-center gap-2">
                  <span className="text-xs font-medium text-secondary-color text-nowrap">Hình thức:</span>
                  <Segmented
                    className="w-100 text-xs"
                    value={typeFilter}
                    onChange={(val) => {
                      const t = val as 'ALL' | 'MANUAL' | 'APPEAL';
                      setTypeFilter(t);
                      if (t === 'ALL') {
                        setSearchParams({});
                      } else {
                        setSearchParams({ type: t });
                      }
                    }}
                    options={[
                      { label: `Tất cả (${gradeLogs.length})`, value: 'ALL' },
                      { label: `Sửa trực tiếp (${manualOverridesCount})`, value: 'MANUAL' },
                      { label: `Phúc khảo (${appealAuditsCount})`, value: 'APPEAL' },
                    ]}
                  />
                </div>
              </Col>

              {/* Filter by Class */}
              <Col xs={12} sm={6} md={7} xl={4}>
                <Select
                  className="w-100"
                  value={classFilter}
                  onChange={(val) => setClassFilter(val)}
                  options={[
                    { label: 'Tất cả lớp học phần', value: 'all' },
                    ...classes.map((cls) => ({
                      label: `${cls.code} - ${cls.name}`,
                      value: cls.id,
                    })),
                  ]}
                  placeholder="Lọc theo lớp học phần"
                />
              </Col>

              {/* Filter by Teacher */}
              <Col xs={12} sm={6} md={7} xl={4}>
                <Select
                  className="w-100"
                  value={teacherFilter}
                  onChange={(val) => setTeacherFilter(val)}
                  options={[
                    { label: 'Tất cả giảng viên', value: 'all' },
                    ...uniqueTeachers.map((t) => ({
                      label: t,
                      value: t,
                    })),
                  ]}
                  placeholder="Lọc theo giảng viên"
                />
              </Col>

              {/* Keyword Search */}
              <Col xs={24} sm={12} md={18} xl={7}>
                <Input
                  prefix={<Search size={15} className="text-muted-color me-1" />}
                  placeholder="Tìm SV, MSSV, bài thi, lý do..."
                  value={gradeSearch}
                  onChange={(e) => setGradeSearch(e.target.value)}
                  allowClear
                  className="velica-form-input"
                />
              </Col>

              {/* Reset Action */}
              <Col xs={24} sm={12} md={6} xl={2} className="text-end">
                <Button onClick={handleResetFilters} size="small" className="velica-btn-action w-100">
                  Đặt lại
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Grade Audits Table */}
          <div className="velica-table-container">
            <Table
              className="velica-audit-table"
              dataSource={filteredGradeLogs}
              columns={gradeColumns}
              rowKey="id"
              loading={loadingGrades}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} biên bản`,
              }}
              scroll={{ x: 1140 }}
            />
          </div>
        </>
      )}

      {/* ===================== VIEW 2: GENERAL SYSTEM LOGS ===================== */}
      {activeTab === 'system_logs' && (
        <>
          <Card size="small" className="mb-3 velica-admin-card">
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={12}>
                <Input
                  prefix={<Search size={15} className="text-muted-color me-1" />}
                  placeholder="Tìm kiếm nhật ký theo người dùng, hành động, loại thực thể..."
                  value={systemSearch}
                  onChange={(e) => setSystemSearch(e.target.value)}
                  allowClear
                  className="velica-form-input"
                />
              </Col>
              <Col xs={24} md={12} className="text-end">
                <Text type="secondary" className="text-xs">
                  Hiển thị <strong>{filteredSystemLogs.length}</strong> / {systemLogs.length} sự kiện hệ thống
                </Text>
              </Col>
            </Row>
          </Card>

          <div className="velica-table-container">
            <Table
              dataSource={filteredSystemLogs}
              columns={systemColumns}
              rowKey="id"
              loading={loadingSystem}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} / ${total} sự kiện`,
              }}
              scroll={{ x: 1060 }}
            />
          </div>
        </>
      )}

      {/* ===================== AUDIT DETAIL DRAWER ===================== */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <History size={18} className="text-brand-color" />
            <span>Biên Bản Kiểm Toán Điều Chỉnh Điểm Số #{selectedAudit?.id}</span>
          </div>
        }
        open={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        width={620}
        extra={
          <Tag color="cyan" className="velica-tag-pill font-mono">
            Audit Trail Verified
          </Tag>
        }
      >
        {selectedAudit && (
          <div className="space-y-4">
            {/* Header Alert */}
            <Alert
              type={selectedAudit.type === 'APPEAL' ? 'info' : 'success'}
              showIcon
              message={
                selectedAudit.type === 'APPEAL'
                  ? 'Biên bản ghi nhận cập nhật điểm số sau khi thẩm định đơn phúc khảo của sinh viên'
                  : 'Biên bản ghi nhận điều chỉnh điểm trực tiếp (Grade Override) do giảng viên thực hiện'
              }
              description={`Mọi thông tin trước và sau khi sửa đều được mã hóa đối soát, đảm bảo chuẩn minh bạch khảo thí.`}
              className="mb-4"
            />

            {/* Score Comparison Hero Card */}
            <Card size="small" className="velica-admin-card bg-neutral-50 mb-3">
              <div className="text-center py-2">
                <div className="text-xs text-muted-color uppercase font-medium tracking-wide">
                  So sánh điểm số trước & sau điều chỉnh
                </div>
                <div className="d-flex items-center justify-center gap-4 mt-2">
                  <div>
                    <div className="text-xs text-secondary-color">Điểm gốc</div>
                    <div className="text-2xl font-bold text-muted-color line-through">
                      {selectedAudit.oldScore !== null && selectedAudit.oldScore !== undefined
                        ? selectedAudit.oldScore.toFixed(1)
                        : '—'}
                    </div>
                  </div>
                  <div className="text-xl text-muted-color font-light">➔</div>
                  <div>
                    <div className="text-xs text-secondary-color">Điểm sau điều chỉnh</div>
                    <div className="text-3xl font-extrabold text-brand-color">
                      {selectedAudit.newScore.toFixed(1)}
                    </div>
                  </div>
                  {selectedAudit.oldScore !== null && selectedAudit.oldScore !== undefined && (
                    <div className="ms-2">
                      <Tag
                        color={
                          selectedAudit.newScore - selectedAudit.oldScore > 0
                            ? 'success'
                            : selectedAudit.newScore - selectedAudit.oldScore < 0
                            ? 'error'
                            : 'default'
                        }
                        className="font-mono text-sm px-2.5 py-1 font-bold"
                      >
                        {selectedAudit.newScore - selectedAudit.oldScore > 0
                          ? `+${(selectedAudit.newScore - selectedAudit.oldScore).toFixed(1)} điểm`
                          : `${(selectedAudit.newScore - selectedAudit.oldScore).toFixed(1)} điểm`}
                      </Tag>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Student & Class Details */}
            <Descriptions title="Thông tin Sinh viên & Lớp học phần" bordered size="small" column={1}>
              <Descriptions.Item label="Họ và tên Sinh viên">
                <strong className="text-brand-color">{selectedAudit.studentName}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Mã số Sinh viên (MSSV)">
                <span className="font-mono font-medium">{selectedAudit.studentCode || '—'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Lớp học phần">
                <span>{selectedAudit.className || 'Lớp học phần chính quy'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Bài kiểm tra / Cột điểm">
                <div>
                  <div className="font-semibold text-brand-color">{selectedAudit.assessmentTitle}</div>
                  <Tag color="geekblue" className="mt-1 text-2xs">{selectedAudit.componentName}</Tag>
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Divider className="my-3" />

            {/* Modifier & Reason */}
            <Descriptions title="Chi tiết Quyết định Điều chỉnh" bordered size="small" column={1}>
              <Descriptions.Item label="Hình thức ghi nhận">
                {selectedAudit.type === 'APPEAL' ? (
                  <Tag color="purple" className="velica-tag-pill font-medium">
                    Chấm phúc khảo (Grade Appeal Review)
                  </Tag>
                ) : (
                  <Tag color="blue" className="velica-tag-pill font-medium">
                    Sửa điểm trực tiếp (Direct Override)
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Người thực hiện">
                <div>
                  <strong className="text-brand-color">{selectedAudit.changedBy}</strong>
                  <Tag color="cyan" className="ms-2 text-2xs">Giảng viên phụ trách</Tag>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm chính xác">
                <span className="font-mono text-xs">{new Date(selectedAudit.timestamp).toLocaleString('vi-VN')}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Căn cứ / Lý do điều chỉnh">
                <Paragraph className="m-0 text-sm italic text-secondary-color">
                  "{selectedAudit.reason}"
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>

            {/* Linked Appeal Details if type === 'APPEAL' */}
            {selectedAudit.type === 'APPEAL' && linkedAppeal && (
              <>
                <Divider className="my-3" />
                <Descriptions title="Đơn Phúc Khảo Gốc Từ Sinh Viên" bordered size="small" column={1}>
                  <Descriptions.Item label="Mã hồ sơ phúc khảo">
                    <span className="font-mono text-xs font-bold text-purple">#{linkedAppeal.id}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Thời điểm sinh viên nộp đơn">
                    <span className="font-mono text-xs">{new Date(linkedAppeal.createdAt).toLocaleString('vi-VN')}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Nội dung khiếu nại của sinh viên">
                    <Paragraph className="m-0 text-xs text-secondary-color bg-neutral-50 p-2.5 rounded border border-dashed">
                      {linkedAppeal.reason}
                    </Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item label="Nhận xét thẩm định của Giảng viên">
                    <Paragraph className="m-0 text-xs text-brand-color bg-neutral-50 p-2.5 rounded border border-dashed">
                      {linkedAppeal.teacherResponse || selectedAudit.reason}
                    </Paragraph>
                  </Descriptions.Item>
                </Descriptions>
              </>
            )}

            <div className="pt-3 text-end">
              <Button onClick={() => setIsDetailDrawerOpen(false)} className="velica-btn-action">
                Đóng biên bản
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

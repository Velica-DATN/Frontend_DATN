import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Row,
  Col,
  Space,
  Modal,
  Form,
  InputNumber,
  message,
  Tooltip,
  Alert,
  Divider,
  Drawer,
  Segmented,
} from 'antd';
import {
  GraduationCap,
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Edit3,
  TrendingUp,
  Award,
  Users,
  RotateCcw,
  Info,
  History,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  ClassRoom,
  ClassMember,
  Syllabus,
  SyllabusAssessmentItem,
  GradeAuditLog,
} from '../../../../interfaces/velica.interfaces';
import { mockService } from '../../../../api/mocks/mockService';
import { StatCard } from '../../../../components/velica/StatCard/StatCard';
import { ROUTE_PATHS } from '../../../../router/constants/routePaths';

interface ClassGradebookTabProps {
  currentClass: ClassRoom | null;
  members: ClassMember[];
  syllabi: Syllabus[];
  onViewStudentStats?: (member: ClassMember) => void;
}

export interface StudentGradeRecord {
  memberId: string;
  studentCode: string;
  fullName: string;
  email: string;
  scores: Record<string, number | null>; // keyed by component key e.g. "asm_1", "asm_2"
  finalScore10: number;
  status: 'PASSED' | 'FAILED';
  note?: string;
}

// Calculate weighted grade according to syllabus assessments (10-point scale)
export function calculateStudentGrade(
  scores: Record<string, number | null>,
  assessments: SyllabusAssessmentItem[]
): {
  finalScore10: number;
  status: 'PASSED' | 'FAILED';
} {
  let totalWeighted = 0;
  let totalWeight = 0;
  let finalExamFailed = false;

  assessments.forEach((asm, idx) => {
    const key = `asm_${asm.no || idx + 1}`;
    const score = scores[key] ?? null;
    const weight = asm.weight || 0;
    totalWeight += weight;

    if (score !== null && score !== undefined) {
      totalWeighted += score * weight;
    }

    // Điểm liệt thi cuối kỳ: nếu điểm cuối kỳ < 4.0 thì không đạt
    if (asm.type === 'Final exam' && score !== null && score < 4.0) {
      finalExamFailed = true;
    }
  });

  const rawFinal10 = totalWeight > 0 ? totalWeighted / totalWeight : 0;
  const finalScore10 = Math.min(10, Math.max(0, Number(rawFinal10.toFixed(2))));
  const passed = finalScore10 >= 4.0 && !finalExamFailed;

  return {
    finalScore10,
    status: passed ? 'PASSED' : 'FAILED',
  };
}

export const ClassGradebookTab: React.FC<ClassGradebookTabProps> = ({
  currentClass,
  members,
  syllabi,
  onViewStudentStats,
}) => {
  const navigate = useNavigate();

  // Find linked syllabus
  const linkedSyllabus = useMemo(() => {
    if (!currentClass?.syllabusId) return syllabi[0] || null;
    return syllabi.find((s) => s.id === currentClass.syllabusId) || syllabi[0] || null;
  }, [currentClass, syllabi]);

  // Assessment components from syllabus
  const assessments: SyllabusAssessmentItem[] = useMemo(() => {
    if (linkedSyllabus?.assessments && linkedSyllabus.assessments.length > 0) {
      return linkedSyllabus.assessments;
    }
    // Fallback standard syllabus assessments
    return [
      {
        no: 1,
        category: 'Assignment (Bài tập lớn)',
        type: 'on-going',
        part: 1,
        weight: 10,
        completionCriteria: '> 0',
        clo: 'CLO1, CLO2',
      },
      {
        no: 2,
        category: 'Group Project (Đồ án nhóm)',
        type: 'on-going',
        part: 1,
        weight: 20,
        completionCriteria: '> 0',
        clo: 'CLO1, CLO2, CLO3',
      },
      {
        no: 3,
        category: 'Progress Test (Kiểm tra tiến độ)',
        type: 'on-going',
        part: 2,
        weight: 15,
        completionCriteria: '> 0',
        clo: 'CLO1, CLO2',
      },
      {
        no: 4,
        category: 'Practical Exam (Thi Thực hành)',
        type: 'Final exam',
        part: 1,
        weight: 25,
        completionCriteria: '>= 4.0 / 10',
        clo: 'CLO1, CLO2, CLO3, CLO4',
      },
      {
        no: 5,
        category: 'Theory Exam (Thi Lý thuyết)',
        type: 'Final exam',
        part: 1,
        weight: 30,
        completionCriteria: '>= 4.0 / 10',
        clo: 'CLO1, CLO2, CLO3, CLO4',
      },
    ];
  }, [linkedSyllabus]);

  // Filter only students (exclude soft deleted & teaching assistants)
  const studentMembers = useMemo(() => {
    return members.filter((m) => m.role === 'STUDENT' && !m.isDeleted);
  }, [members]);

  // Storage key for class gradebook
  const storageKey = `velica_mock_gradebook_${currentClass?.id || 'default'}`;

  // State: Student Grade Records
  const [gradeRecords, setGradeRecords] = useState<StudentGradeRecord[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const [scoreRankFilter, setScoreRankFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentGradeRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [previewScore, setPreviewScore] = useState<{
    finalScore10: number;
    status: 'PASSED' | 'FAILED';
  } | null>(null);

  // Grade Audit State (Unified Direct Overrides & Appeals)
  const [classAudits, setClassAudits] = useState<GradeAuditLog[]>([]);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [selectedStudentForAudit, setSelectedStudentForAudit] = useState<StudentGradeRecord | null>(null);
  const [auditSearchText, setAuditSearchText] = useState('');
  const [auditTypeFilter, setAuditTypeFilter] = useState<'ALL' | 'MANUAL' | 'APPEAL'>('ALL');

  const loadClassAudits = async () => {
    const data = await mockService.getGradeAuditLogs({ classId: currentClass?.id || 'cls-101' });
    setClassAudits(data);
  };

  useEffect(() => {
    loadClassAudits();
  }, [currentClass?.id]);

  // Initialize or load grades from localStorage / mock seed
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Re-calculate with current syllabus weights in case syllabus changed
          const recalculated = parsed.map((rec: StudentGradeRecord) => {
            const calc = calculateStudentGrade(rec.scores, assessments);
            return {
              ...rec,
              finalScore10: calc.finalScore10,
              status: calc.status,
            };
          });
          setGradeRecords(recalculated);
          return;
        }
      } catch {
        // Fallback to generate fresh records
      }
    }

    // Seed realistic scores based on member data
    const initialRecords: StudentGradeRecord[] = studentMembers.map((m, idx) => {
      const baseAvg = m.averageScore || 7.5;
      const scores: Record<string, number | null> = {};

      assessments.forEach((asm, aIdx) => {
        const key = `asm_${asm.no || aIdx + 1}`;
        // Slight natural variance around student average
        const variance = ((((idx * 7 + aIdx * 11) % 9) - 4) * 0.2);
        let score = Math.min(10, Math.max(2.5, Number((baseAvg + variance).toFixed(1))));
        if (m.isBanned) score = 3.5;
        scores[key] = score;
      });

      const calc = calculateStudentGrade(scores, assessments);
      return {
        memberId: m.id,
        studentCode: m.studentCode || `2152${String(idx + 100).padStart(4, '0')}`,
        fullName: m.fullName,
        email: m.email,
        scores,
        finalScore10: calc.finalScore10,
        status: calc.status,
        note: m.isBanned ? 'Đình chỉ khảo thí lớp' : undefined,
      };
    });

    setGradeRecords(initialRecords);
  }, [studentMembers, assessments, storageKey]);

  // Save changes to localStorage
  const saveRecords = (newRecords: StudentGradeRecord[]) => {
    setGradeRecords(newRecords);
    localStorage.setItem(storageKey, JSON.stringify(newRecords));
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return gradeRecords.filter((rec) => {
      const matchesSearch =
        rec.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        rec.studentCode.toLowerCase().includes(searchText.toLowerCase()) ||
        rec.email.toLowerCase().includes(searchText.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || rec.status === statusFilter;

      let matchesRank = true;
      if (scoreRankFilter === 'EXCELLENT') matchesRank = rec.finalScore10 >= 8.5;
      else if (scoreRankFilter === 'GOOD') matchesRank = rec.finalScore10 >= 7.0 && rec.finalScore10 < 8.5;
      else if (scoreRankFilter === 'AVERAGE') matchesRank = rec.finalScore10 >= 5.5 && rec.finalScore10 < 7.0;
      else if (scoreRankFilter === 'BELOW_AVERAGE') matchesRank = rec.finalScore10 >= 4.0 && rec.finalScore10 < 5.5;
      else if (scoreRankFilter === 'FAILED') matchesRank = rec.finalScore10 < 4.0;

      return matchesSearch && matchesStatus && matchesRank;
    });
  }, [gradeRecords, searchText, statusFilter, scoreRankFilter]);

  // Aggregate Statistics
  const stats = useMemo(() => {
    if (gradeRecords.length === 0) {
      return {
        total: 0,
        avg10: 0,
        passedCount: 0,
        passedRate: 0,
        excellentCount: 0,
        failedCount: 0,
        highestScore: 0,
        lowestScore: 0,
      };
    }

    const total = gradeRecords.length;
    const sum10 = gradeRecords.reduce((acc, r) => acc + r.finalScore10, 0);
    const passedCount = gradeRecords.filter((r) => r.status === 'PASSED').length;
    const excellentCount = gradeRecords.filter((r) => r.finalScore10 >= 8.5).length;
    const failedCount = gradeRecords.filter((r) => r.status === 'FAILED').length;
    const highestScore = Math.max(...gradeRecords.map((r) => r.finalScore10));
    const lowestScore = Math.min(...gradeRecords.map((r) => r.finalScore10));

    return {
      total,
      avg10: Number((sum10 / total).toFixed(2)),
      passedCount,
      passedRate: Number(((passedCount / total) * 100).toFixed(1)),
      excellentCount,
      failedCount,
      highestScore,
      lowestScore,
    };
  }, [gradeRecords]);

  // Score distribution for chart
  const distributionData = useMemo(() => {
    const buckets = [
      { band: '8.5 - 10.0', name: 'Giỏi / Xuất sắc', count: 0, color: '#10B981' },
      { band: '7.0 - 8.4', name: 'Khá', count: 0, color: '#06B6D4' },
      { band: '5.5 - 6.9', name: 'Trung bình', count: 0, color: '#3B82F6' },
      { band: '4.0 - 5.4', name: 'Trung bình yếu', count: 0, color: '#F59E0B' },
      { band: '< 4.0', name: 'Không đạt / Học lại', count: 0, color: '#EF4444' },
    ];

    gradeRecords.forEach((r) => {
      const s = r.finalScore10;
      if (s >= 8.5) buckets[0].count++;
      else if (s >= 7.0) buckets[1].count++;
      else if (s >= 5.5) buckets[2].count++;
      else if (s >= 4.0) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [gradeRecords]);

  // Handle Edit Score Modal Open
  const handleOpenEdit = (student: StudentGradeRecord) => {
    setEditingStudent(student);
    const initialValues: Record<string, number | null | string> = {};
    assessments.forEach((asm, idx) => {
      const key = `asm_${asm.no || idx + 1}`;
      initialValues[key] = student.scores[key] ?? null;
    });
    initialValues['reason'] = '';
    editForm.setFieldsValue(initialValues);
    setPreviewScore({
      finalScore10: student.finalScore10,
      status: student.status,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenStudentAuditHistory = (record: StudentGradeRecord) => {
    setSelectedStudentForAudit(record);
    setIsAuditDrawerOpen(true);
  };

  // Recalculate preview score on form value change
  const handleFormValuesChange = () => {
    const currentValues = editForm.getFieldsValue();
    const calc = calculateStudentGrade(currentValues, assessments);
    setPreviewScore(calc);
  };

  // Save student score with audit trail
  const handleSaveStudentScore = async () => {
    if (!editingStudent) return;
    try {
      const values = await editForm.validateFields();
      const reason = values.reason?.trim();
      if (!reason || reason.length < 5) {
        message.error('Vui lòng nêu rõ lý do điều chỉnh điểm (tối thiểu 5 ký tự) phục vụ lưu vết Audit Log!');
        return;
      }

      // Filter score values
      const scoreValues: Record<string, number | null> = {};
      assessments.forEach((asm, idx) => {
        const key = `asm_${asm.no || idx + 1}`;
        scoreValues[key] = values[key] !== undefined ? values[key] : editingStudent.scores[key];
      });

      const calc = calculateStudentGrade(scoreValues, assessments);

      // Record grade audit logs for any changed score
      for (const asm of assessments) {
        const key = `asm_${asm.no || assessments.indexOf(asm) + 1}`;
        const oldVal = editingStudent.scores[key] ?? null;
        const newVal = scoreValues[key] ?? null;
        if (oldVal !== newVal && newVal !== null) {
          await mockService.recordGradeAudit({
            type: 'MANUAL',
            classId: currentClass?.id || 'cls-101',
            className: currentClass?.name || 'SE301 - Kiến Trúc Phần Mềm',
            studentId: editingStudent.memberId,
            studentCode: editingStudent.studentCode,
            studentName: editingStudent.fullName,
            componentName: asm.category || asm.type || 'Cột điểm thành phần',
            oldScore: oldVal,
            newScore: newVal,
            reason: reason,
          });
        }
      }

      const updatedRecords = gradeRecords.map((r) => {
        if (r.memberId === editingStudent.memberId) {
          return {
            ...r,
            scores: scoreValues,
            finalScore10: calc.finalScore10,
            status: calc.status,
          };
        }
        return r;
      });

      saveRecords(updatedRecords);
      await loadClassAudits();
      message.success(`Đã cập nhật bảng điểm & lưu vết Audit Log cho "${editingStudent.fullName}"!`);
      setIsEditModalOpen(false);
      setEditingStudent(null);
    } catch {
      // validation error
    }
  };

  // Reset to initial grades
  const handleResetScores = () => {
    Modal.confirm({
      title: 'Tải lại điểm ban đầu theo hệ thống?',
      content: 'Thao tác này sẽ đặt lại điểm số của tất cả sinh viên về dữ liệu khảo thí mặc định.',
      okText: 'Xác nhận Đặt lại',
      cancelText: 'Hủy',
      onOk: () => {
        localStorage.removeItem(storageKey);
        // Trigger reload
        window.location.reload();
      },
    });
  };

  // Export to Excel CSV (UTF-8 BOM)
  const handleExportExcel = () => {
    message.loading('Đang khởi tạo file Bảng điểm Tổng hợp chuẩn Excel...');
    setTimeout(() => {
      let csv = '\uFEFF'; // UTF-8 BOM
      csv += `BẢNG ĐIỂM TỔNG HỢP LỚP HỌC PHẦN (THEO ĐỀ CƯƠNG CHI TIẾT)\n`;
      csv += `Lớp học phần: ${currentClass?.name || 'SE301'} (${currentClass?.code || 'SE301.P01'})\n`;
      csv += `Đề cương môn học: ${linkedSyllabus?.name || 'MSS301'} (Mã HP: ${linkedSyllabus?.code || 'MSS301'})\n`;
      csv += `Thang điểm đánh giá: ${linkedSyllabus?.scoringScale || 10}\n`;
      csv += `Giảng viên phụ trách: ${currentClass?.teacherName || 'TS. Nguyễn Văn An'}\n`;
      csv += `Thời điểm xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

      // Header row
      const headers = [
        'STT',
        'Mã sinh viên',
        'Họ và tên',
        'Email',
        ...assessments.map((a) => `"${a.category} (${a.weight}%)"`),
        'Điểm Tổng kết (Hệ 10)',
        'Kết quả',
      ];
      csv += headers.join(',') + '\n';

      // Data rows
      gradeRecords.forEach((rec, idx) => {
        const compScores = assessments.map((a, aIdx) => {
          const key = `asm_${a.no || aIdx + 1}`;
          const val = rec.scores[key];
          return val !== null && val !== undefined ? Number(val).toFixed(1) : '';
        });

        const row = [
          idx + 1,
          `"${rec.studentCode}"`,
          `"${rec.fullName}"`,
          `"${rec.email}"`,
          ...compScores,
          rec.finalScore10.toFixed(2),
          `"${rec.status === 'PASSED' ? 'ĐẠT' : 'HỌC LẠI'}"`,
        ];
        csv += row.join(',') + '\n';
      });

      // Stats summary
      csv += `\nTHỐNG KÊ TỔNG QUAN:\n`;
      csv += `Sĩ số tham gia tính điểm: ${stats.total}\n`;
      csv += `Điểm trung bình cả lớp (Hệ 10): ${stats.avg10}\n`;
      csv += `Tỷ lệ Đạt: ${stats.passedRate}% (${stats.passedCount}/${stats.total} sinh viên)\n`;
      csv += `Tỷ lệ Cảnh báo học lại: ${stats.failedCount} sinh viên\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Bang_Diem_Tong_Hop_${currentClass?.code || 'Lop'}_${Date.now()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('Đã tải xuống Bảng điểm tổng hợp thành công!');
    }, 400);
  };

  // Build Dynamic Columns based on Syllabus Assessments
  const tableColumns = useMemo(() => {
    const baseColumns: any[] = [
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
        title: 'Mã SV',
        dataIndex: 'studentCode',
        key: 'studentCode',
        width: 110,
        render: (code: string) => (
          <span className="font-mono font-semibold text-brand-color">{code}</span>
        ),
      },
      {
        title: 'Họ và tên sinh viên',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 200,
        ellipsis: true,
        render: (name: string, record: StudentGradeRecord) => (
          <div style={{ maxWidth: 180 }}>
            <Tooltip title={name}>
              <div className="font-semibold text-primary-color text-truncate">{name}</div>
            </Tooltip>
            <Tooltip title={record.email}>
              <div className="text-xs text-muted-color text-truncate">{record.email}</div>
            </Tooltip>
          </div>
        ),
      },
    ];

    // Dynamic Syllabus Component Columns
    assessments.forEach((asm, aIdx) => {
      const key = `asm_${asm.no || aIdx + 1}`;
      baseColumns.push({
        title: (
          <Tooltip
            title={
              <div>
                <div><strong>{asm.category}</strong></div>
                <div>Phân loại: {asm.type === 'Final exam' ? 'Thi Cuối Kỳ' : 'Quá trình'}</div>
                <div>Trọng số: {asm.weight}%</div>
                <div>Chuẩn CLO: {asm.clo || 'CLO1'}</div>
                <div>Điều kiện: {asm.completionCriteria || '> 0'}</div>
              </div>
            }
          >
            <div className="text-center cursor-pointer">
              <div className="font-semibold text-xs leading-tight">{asm.category}</div>
              <div className="d-flex items-center justify-center gap-1 mt-1">
                <Tag
                  color={asm.type === 'Final exam' ? 'volcano' : 'blue'}
                  className="text-xs m-0 px-1 py-0"
                >
                  {asm.weight}%
                </Tag>
              </div>
            </div>
          </Tooltip>
        ),
        key,
        width: 125,
        align: 'center' as const,
        render: (_: unknown, record: StudentGradeRecord) => {
          const score = record.scores[key];
          if (score === null || score === undefined) {
            return <span className="text-muted-color">—</span>;
          }

          let scoreColorClass = 'text-primary-color font-semibold';
          if (score >= 8.5) scoreColorClass = 'text-success-color font-bold';
          else if (score < 4.0) scoreColorClass = 'text-danger-color font-bold';

          return (
            <div className="d-flex flex-column items-center">
              <span className={`fs-14 ${scoreColorClass}`}>
                {Number(score).toFixed(1)}
              </span>
              {asm.type === 'Final exam' && score < 4.0 && (
                <Tag color="error" className="text-xs m-0 mt-1 scale-90">
                  Liệt CK
                </Tag>
              )}
            </div>
          );
        },
      });
    });

    // Summary Columns (10-scale, 4-scale, Letter grade, Status)
    baseColumns.push(
      {
        title: (
          <div className="text-center font-bold text-brand-color">
            <div>Tổng kết</div>
            <div className="text-xs">(Hệ 10)</div>
          </div>
        ),
        dataIndex: 'finalScore10',
        key: 'finalScore10',
        width: 110,
        align: 'center' as const,
        render: (score: number) => {
          let badgeColor = 'blue';
          if (score >= 8.5) badgeColor = 'green';
          else if (score >= 7.0) badgeColor = 'cyan';
          else if (score >= 5.0) badgeColor = 'orange';
          else if (score < 4.0) badgeColor = 'red';

          return (
            <Tag
              color={badgeColor}
              className="font-bold fs-14 px-2 py-0.5 m-0"
            >
              {score.toFixed(2)}
            </Tag>
          );
        },
      },
      {
        title: 'Kết quả',
        dataIndex: 'status',
        key: 'status',
        width: 110,
        align: 'center' as const,
        render: (status: 'PASSED' | 'FAILED') => {
          return status === 'PASSED' ? (
            <Tag color="success" icon={<CheckCircle2 size={12} className="mr-1" />} className="font-semibold m-0">
              Đạt
            </Tag>
          ) : (
            <Tag color="error" icon={<AlertTriangle size={12} className="mr-1" />} className="font-semibold m-0">
              Học lại
            </Tag>
          );
        },
      },
      {
        title: 'Thao tác',
        key: 'action',
        width: 195,
        align: 'center' as const,
        fixed: 'right' as const,
        render: (_: unknown, record: StudentGradeRecord) => {
          const hasAudit = classAudits.some(
            (a) => a.studentId === record.memberId || a.studentCode === record.studentCode
          );
          return (
            <Space size={6}>
              <Button
                type="primary"
                size="small"
                onClick={() => handleOpenEdit(record)}
                className="text-xs velica-btn-primary"
              >
                Sửa điểm
              </Button>
              <Tooltip title={hasAudit ? 'Xem lịch sử điều chỉnh điểm của sinh viên này' : 'Chưa có lịch sử điều chỉnh điểm'}>
                <Button
                  size="small"
                  icon={<History size={13} />}
                  onClick={() => handleOpenStudentAuditHistory(record)}
                  className={`text-xs ${hasAudit ? 'text-purple font-semibold' : ''}`}
                >
                  Lịch sử
                </Button>
              </Tooltip>
            </Space>
          );
        },
      }
    );

    return baseColumns;
  }, [assessments, members, classAudits]);

  return (
    <div className="velica-gradebook-container">
      {/* Top Summary KPI Row & Hero Grade Distribution Chart */}
      <Row gutter={[16, 16]} className="mb-4" align="stretch">
        {/* Left Column: 4 KPI Cards in 2x2 Grid (khoảng 38% width - nhỏ gọn) */}
        <Col xs={24} lg={9} xl={9}>
          <Row gutter={[10, 10]} style={{ height: '100%' }}>
            <Col xs={24} sm={12}>
              <StatCard
                title="Sĩ số tính điểm"
                value={`${stats.total} sinh viên`}
                subtext="Danh sách sinh viên chính thức"
              />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard
                title="Điểm TB cả lớp"
                value={`${stats.avg10} / 10`}
                subtext="Thang điểm 10 chuẩn"
              />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard
                title="Tỷ lệ Đạt học phần"
                value={`${stats.passedRate}%`}
                trend={{
                  value: `${stats.passedCount}/${stats.total}`,
                  isPositive: stats.passedRate >= 80,
                  label: 'sinh viên đạt',
                }}
              />
            </Col>
            <Col xs={24} sm={12}>
              <StatCard
                title="Loại Giỏi / Xuất sắc"
                value={`${stats.excellentCount} SV`}
                subtext={`Cảnh báo F: ${stats.failedCount} SV`}
              />
            </Col>
          </Row>
        </Col>

        {/* Right Column: Hero Donut & Breakdown Card (khoảng 62% width - nổi bật và rộng rãi) */}
        <Col xs={24} lg={15} xl={15}>
          <Card
            title={
              <div className="d-flex items-center justify-between flex-wrap gap-2">
                <div className="d-flex items-center gap-2">
                  <span className="font-bold text-sm">Phổ điểm & Cơ cấu Xếp loại Học phần</span>
                  <Tag color="success" className="font-semibold text-xs m-0">
                    Đạt chuẩn: {stats.passedRate}% ({stats.passedCount}/{stats.total} SV)
                  </Tag>
                </div>
                <span className="text-xs text-secondary-color">
                  Cao nhất: <strong className="text-primary-color">{stats.highestScore}</strong> • Thấp nhất:{' '}
                  <strong className="text-primary-color">{stats.lowestScore}</strong>
                </span>
              </div>
            }
            className="velica-card"
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '12px 20px',
            }}
            size="small"
          >
            <div className="d-flex items-center justify-between gap-3 flex-wrap" style={{ minHeight: 165 }}>
              {/* Donut Chart with prominent diameter & top label */}
              <div style={{ flex: '0 0 38%', height: 165, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData.filter((d) => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percent = stats.total > 0 ? Math.round((data.count / stats.total) * 100) : 0;
                          return (
                            <div
                              style={{
                                backgroundColor: '#0F172A',
                                color: '#FFFFFF',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                                border: '1px solid #334155',
                                pointerEvents: 'none',
                                zIndex: 9999,
                              }}
                            >
                              <div style={{ fontWeight: 600, color: data.color }}>{data.name}</div>
                              <div style={{ fontSize: 11, color: '#E2E8F0' }}>
                                {data.count} SV ({percent}%) • Dải điểm: {data.band}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Label inside Donut */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', lineHeight: 1.1 }}>
                    {stats.passedRate}%
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Đạt chuẩn</div>
                </div>
              </div>

              {/* Breakdown List with Progress Bars */}
              <div style={{ flex: '1 1 58%', minWidth: 260 }} className="d-flex flex-col gap-1.5 justify-center">
                {distributionData.map((item) => {
                  const percent = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                  return (
                    <div key={item.band} className="d-flex items-center justify-between text-xs py-0.5">
                      <div className="d-flex items-center gap-2" style={{ minWidth: 155 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: item.color,
                            flexShrink: 0,
                          }}
                        />
                        <span className="font-medium text-secondary-color" style={{ fontSize: 12 }}>
                          {item.name}
                        </span>
                        <span className="text-muted-color" style={{ fontSize: 11 }}>
                          [{item.band}]
                        </span>
                      </div>

                      <div className="d-flex items-center gap-2" style={{ flexShrink: 0 }}>
                        <div style={{ width: 64, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${percent}%`,
                              height: '100%',
                              backgroundColor: item.color,
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span className="font-bold text-primary-color" style={{ minWidth: 32, textAlign: 'right' }}>
                          {item.count} SV
                        </span>
                        <span className="text-secondary-color" style={{ minWidth: 38, textAlign: 'right', fontSize: 11 }}>
                          ({percent}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 4. Toolbar: Search, Filters, Export, and Actions */}
      <div className="velica-filter-toolbar">
        <div className="velica-filter-search">
          <Input
            prefix={<Search size={16} className="text-muted-color" />}
            placeholder="Tìm theo tên sinh viên, mã sinh viên (MSSV) hoặc email..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <div className="d-flex items-center gap-2 flex-wrap">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-160"
            options={[
              { label: 'Tất cả kết quả', value: 'ALL' },
              { label: 'Đạt chuẩn (Passed)', value: 'PASSED' },
              { label: 'Học lại (Failed)', value: 'FAILED' },
            ]}
          />

          <Select
            value={scoreRankFilter}
            onChange={setScoreRankFilter}
            className="w-180"
            options={[
              { label: 'Tất cả mức điểm', value: 'ALL' },
              { label: 'Giỏi / Xuất sắc (≥ 8.5)', value: 'EXCELLENT' },
              { label: 'Khá (7.0 - 8.4)', value: 'GOOD' },
              { label: 'Trung bình (5.5 - 6.9)', value: 'AVERAGE' },
              { label: 'Trung bình yếu (4.0 - 5.4)', value: 'BELOW_AVERAGE' },
              { label: 'Học lại (< 4.0)', value: 'FAILED' },
            ]}
          />

          <Button
            icon={<RotateCcw size={14} />}
            onClick={handleResetScores}
            className="velica-btn-action"
          >
            Đặt lại điểm
          </Button>

          <Button
            icon={<History size={14} className="text-brand-color" />}
            onClick={() => {
              setSelectedStudentForAudit(null);
              setIsAuditDrawerOpen(true);
            }}
            className="velica-btn-action font-medium"
          >
            Nhật ký sửa điểm ({classAudits.length})
          </Button>
        </div>
      </div>

      {/* 5. Comprehensive Gradebook Table */}
      <div className="velica-table-container mb-4">
        <Table
          dataSource={filteredRecords}
          columns={tableColumns}
          rowKey="memberId"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1450 }}
          bordered
          size="middle"
        />
      </div>

      {/* 6. Edit Student Grade Drawer (Opening from the side for consistency) */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <Edit3 size={18} className="text-brand-color" />
            <span>
              Cập nhật Điểm số: <strong>{editingStudent?.fullName}</strong> ({editingStudent?.studentCode})
            </span>
          </div>
        }
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        extra={
          <Space>
            <Button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingStudent(null);
              }}
              className="velica-btn-action"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleSaveStudentScore}
              className="velica-btn-primary"
            >
              Lưu thay đổi & Tính lại
            </Button>
          </Space>
        }
        width={580}
        destroyOnClose
      >
        {editingStudent && (
          <div>
            <div className="p-3 bg-light rounded mb-3 border">
              <Row gutter={16}>
                <Col span={12}>
                  <div className="text-xs text-secondary-color">Họ và tên:</div>
                  <div className="font-bold">{editingStudent.fullName}</div>
                </Col>
                <Col span={12}>
                  <div className="text-xs text-secondary-color">Mã số sinh viên:</div>
                  <div className="font-mono font-bold text-brand-color">
                    {editingStudent.studentCode}
                  </div>
                </Col>
              </Row>
            </div>

            <p className="text-xs text-secondary-color mb-3">
              Nhập điểm thành phần (thang điểm 10). Hệ thống sẽ tự động tính lại Điểm Tổng kết Hệ 10 theo tỷ lệ đề cương.
            </p>

            <Form
              form={editForm}
              layout="vertical"
              onValuesChange={handleFormValuesChange}
            >
              <Row gutter={12}>
                {assessments.map((asm, idx) => {
                  const key = `asm_${asm.no || idx + 1}`;
                  return (
                    <Col span={12} key={key}>
                      <Form.Item
                        name={key}
                        label={
                          <div className="d-flex items-center justify-between w-100">
                            <span className="font-semibold text-xs">
                              {asm.category}
                            </span>
                            <Tag
                              color={asm.type === 'Final exam' ? 'volcano' : 'blue'}
                              className="text-xs m-0"
                            >
                              Trọng số: {asm.weight}%
                            </Tag>
                          </div>
                        }
                        rules={[
                          { required: true, message: 'Nhập điểm 0-10' },
                          {
                            type: 'number',
                            min: 0,
                            max: 10,
                            message: 'Điểm từ 0 đến 10',
                          },
                        ]}
                        className="mb-3"
                      >
                        <InputNumber
                          min={0}
                          max={10}
                          step={0.1}
                          className="w-100"
                          placeholder="Điểm 0 - 10"
                        />
                      </Form.Item>
                    </Col>
                  );
                })}
              </Row>

              <Form.Item
                name="reason"
                label={
                  <div className="d-flex items-center gap-1 font-semibold text-xs text-brand-color">
                    <ShieldAlert size={14} />
                    <span>Lý do điều chỉnh điểm (Bắt buộc theo chuẩn Audit Log)</span>
                  </div>
                }
                rules={[
                  { required: true, message: 'Vui lòng nêu rõ lý do điều chỉnh điểm để lưu vết lịch sử' },
                  { min: 5, message: 'Lý do tối thiểu 5 ký tự' },
                ]}
                className="mt-2 mb-3"
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Ví dụ: Cập nhật sau phúc khảo, chấm lại bài tập lớn, cộng điểm thưởng chuyên cần..."
                />
              </Form.Item>
            </Form>

            {/* Live Recalculation Preview Box */}
            {previewScore && (
              <div className="p-3 bg-brand-light rounded border border-brand-color mt-2 mb-3">
                <div className="font-bold text-xs text-brand-color mb-2">
                  Dự tính Kết quả sau khi cập nhật:
                </div>
                <Row gutter={16} className="text-center">
                  <Col span={12}>
                    <div className="text-xs text-secondary-color">Điểm Tổng kết (Hệ 10)</div>
                    <div className="font-bold fs-20 text-primary-color">
                      {previewScore.finalScore10.toFixed(2)}
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="text-xs text-secondary-color">Kết quả đánh giá</div>
                    <div className="mt-1">
                      {previewScore.status === 'PASSED' ? (
                        <Tag color="success" className="font-bold px-3 py-0.5 text-sm">
                          ĐẠT CHUẨN
                        </Tag>
                      ) : (
                        <Tag color="error" className="font-bold px-3 py-0.5 text-sm">
                          HỌC LẠI
                        </Tag>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            )}

            {/* Previous Audit Logs for this Student */}
            {(() => {
              const studentLogs = classAudits.filter(
                (a) => a.studentId === editingStudent.memberId || a.studentCode === editingStudent.studentCode
              );
              if (studentLogs.length === 0) return null;
              return (
                <div className="p-3 bg-light rounded border">
                  <div className="d-flex items-center gap-1 font-bold text-xs text-secondary-color mb-2">
                    <History size={13} className="text-purple" />
                    <span>Lịch sử các lần điều chỉnh điểm trước đó ({studentLogs.length} lần):</span>
                  </div>
                  <div className="d-flex flex-col gap-2 max-h-48 overflow-y-auto">
                    {studentLogs.map((log) => (
                      <div key={log.id} className="p-2 bg-white rounded border text-xs">
                        <div className="d-flex items-center justify-between">
                          <span className="font-semibold text-dark">{log.componentName}</span>
                          <Tag color="purple" className="m-0 text-2xs">
                            {log.oldScore !== null ? `${log.oldScore}đ` : '—'} ➔ {log.newScore}đ
                          </Tag>
                        </div>
                        <div className="text-muted-color text-2xs mt-1">
                          Bởi: <strong>{log.changedBy}</strong> • {new Date(log.timestamp).toLocaleString('vi-VN')}
                        </div>
                        <div className="text-secondary-color mt-1">
                          Lý do: <em>"{log.reason}"</em>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Drawer>

      {/* 7. Comprehensive Grade Audit Log Drawer */}
      <Drawer
        title={
          <div className="d-flex items-center gap-2">
            <History size={20} className="text-brand-color" />
            <div>
              <div className="velica-drawer-title">
                {selectedStudentForAudit
                  ? `Nhật Ký Sửa Điểm: ${selectedStudentForAudit.fullName} (${selectedStudentForAudit.studentCode})`
                  : `Nhật Ký Kiểm Toán Chỉnh Sửa Điểm Lớp Học Phần`}
              </div>
              <div className="velica-drawer-subtitle">
                {selectedStudentForAudit
                  ? 'Minh bạch toàn bộ các lần điều chỉnh điểm của sinh viên này.'
                  : `Lớp: ${currentClass?.name || 'SE301'} • Lưu vết minh bạch theo chuẩn khảo thí.`}
              </div>
            </div>
          </div>
        }
        open={isAuditDrawerOpen}
        onClose={() => {
          setIsAuditDrawerOpen(false);
          setSelectedStudentForAudit(null);
        }}
        width={780}
      >
        <div className="mb-3 d-flex items-center justify-between flex-wrap gap-2">
          <div className="d-flex items-center gap-2 flex-wrap">
            <Input
              prefix={<Search size={14} className="text-muted-color" />}
              placeholder="Tìm theo tên SV, MSSV, tên cột điểm hoặc lý do..."
              value={auditSearchText}
              onChange={(e) => setAuditSearchText(e.target.value)}
              style={{ width: 280 }}
              allowClear
            />
            <Segmented
              value={auditTypeFilter}
              onChange={(val) => setAuditTypeFilter(val as 'ALL' | 'MANUAL' | 'APPEAL')}
              options={[
                { label: `Tất cả (${classAudits.length})`, value: 'ALL' },
                {
                  label: `Sửa trực tiếp (${classAudits.filter((a) => (a.type || 'MANUAL') === 'MANUAL').length})`,
                  value: 'MANUAL',
                },
                {
                  label: `Phúc khảo (${classAudits.filter((a) => a.type === 'APPEAL').length})`,
                  value: 'APPEAL',
                },
              ]}
            />
          </div>
          {selectedStudentForAudit && (
            <Button
              size="small"
              onClick={() => setSelectedStudentForAudit(null)}
              className="text-xs"
            >
              Xem toàn bộ lớp ({classAudits.length})
            </Button>
          )}
        </div>

        <Table
          dataSource={classAudits.filter((log) => {
            if (selectedStudentForAudit) {
              if (
                log.studentId !== selectedStudentForAudit.memberId &&
                log.studentCode !== selectedStudentForAudit.studentCode
              ) {
                return false;
              }
            }
            if (auditTypeFilter !== 'ALL') {
              const currentType = log.type || 'MANUAL';
              if (currentType !== auditTypeFilter) {
                return false;
              }
            }
            if (!auditSearchText) return true;
            const q = auditSearchText.toLowerCase();
            return (
              log.studentName.toLowerCase().includes(q) ||
              (log.studentCode && log.studentCode.toLowerCase().includes(q)) ||
              log.componentName.toLowerCase().includes(q) ||
              log.reason.toLowerCase().includes(q) ||
              log.changedBy.toLowerCase().includes(q)
            );
          })}
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
              width: 125,
              render: (_: unknown, record: GradeAuditLog) => (
                <div>
                  {record.type === 'APPEAL' ? (
                    <div>
                      <Tag color="purple" className="m-0 font-semibold text-2xs">
                        Phúc khảo
                      </Tag>
                      {record.appealId && (
                        <div className="font-mono text-2xs text-muted-color mt-0.5">
                          {record.appealId}
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
              title: 'Sinh viên',
              key: 'student',
              width: 170,
              render: (_: unknown, record: GradeAuditLog) => (
                <div>
                  <div className="font-semibold text-xs text-dark">{record.studentName}</div>
                  <div className="font-mono text-2xs text-brand-color">{record.studentCode || '—'}</div>
                </div>
              ),
            },
            {
              title: 'Cột điểm',
              dataIndex: 'componentName',
              key: 'componentName',
              width: 160,
              render: (comp: string) => <span className="font-medium text-xs">{comp}</span>,
            },
            {
              title: 'Biến động điểm',
              key: 'scores',
              width: 135,
              align: 'center' as const,
              render: (_: unknown, record: GradeAuditLog) => {
                const diff = (record.newScore - (record.oldScore ?? record.newScore)).toFixed(1);
                const isPositive = Number(diff) > 0;
                return (
                  <div>
                    <div className="d-flex items-center justify-center gap-1 font-semibold text-xs">
                      <del className="text-muted-color">{record.oldScore !== null ? `${record.oldScore}đ` : '—'}</del>
                      <span>➔</span>
                      <strong className="text-brand-color">{record.newScore}đ</strong>
                    </div>
                    {Number(diff) !== 0 && (
                      <Tag color={isPositive ? 'success' : 'warning'} className="m-0 text-2xs mt-0.5">
                        {isPositive ? `+${diff}đ` : `${diff}đ`}
                      </Tag>
                    )}
                  </div>
                );
              },
            },
            {
              title: 'Giảng viên & Lý do điều chỉnh',
              key: 'reason',
              render: (_: unknown, record: GradeAuditLog) => (
                <div className="text-xs">
                  <div className="text-2xs text-muted-color mb-0.5">
                    Người thực hiện: <strong className="text-dark">{record.changedBy}</strong>
                  </div>
                  <div className="text-secondary-color">
                    <em>"{record.reason}"</em>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </Drawer>
    </div>
  );
};

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
  Sparkles,
  Info,
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
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import {
  ClassRoom,
  ClassMember,
  Syllabus,
  SyllabusAssessmentItem,
} from '../../../../interfaces/velica.interfaces';
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
  finalScore4: number;
  letterGrade: 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
  status: 'PASSED' | 'FAILED';
  note?: string;
}

// Convert 10-scale score to 4-scale and Letter Grade
export function computeScale4AndLetter(score10: number): {
  score4: number;
  letter: 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
} {
  if (score10 >= 8.5) return { score4: 4.0, letter: 'A' };
  if (score10 >= 8.0) return { score4: 3.5, letter: 'B+' };
  if (score10 >= 7.0) return { score4: 3.0, letter: 'B' };
  if (score10 >= 6.5) return { score4: 2.5, letter: 'C+' };
  if (score10 >= 5.5) return { score4: 2.0, letter: 'C' };
  if (score10 >= 5.0) return { score4: 1.5, letter: 'D+' };
  if (score10 >= 4.0) return { score4: 1.0, letter: 'D' };
  return { score4: 0.0, letter: 'F' };
}

// Calculate weighted grade according to syllabus assessments
export function calculateStudentGrade(
  scores: Record<string, number | null>,
  assessments: SyllabusAssessmentItem[]
): {
  finalScore10: number;
  finalScore4: number;
  letterGrade: 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'F';
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
      totalWeighted += score * (weight / 100);
    }

    // Điểm liệt thi cuối kỳ: nếu điểm cuối kỳ < 4.0 thì không đạt
    if (asm.type === 'Final exam' && score !== null && score < 4.0) {
      finalExamFailed = true;
    }
  });

  const finalScore10 = totalWeight > 0 ? Number(totalWeighted.toFixed(2)) : 0;
  const { score4, letter } = computeScale4AndLetter(finalScore10);
  const passed = finalScore10 >= 4.0 && !finalExamFailed;

  return {
    finalScore10,
    finalScore4: score4,
    letterGrade: letter,
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
        weight: 25,
        completionCriteria: '> 0',
        clo: 'CLO1, CLO2, CLO3',
      },
      {
        no: 3,
        category: 'Progress Test (Kiểm tra tiến độ)',
        type: 'on-going',
        part: 2,
        weight: 10,
        completionCriteria: '> 0',
        clo: 'CLO1, CLO2',
      },
      {
        no: 4,
        category: 'Final Exam (Thi kết thúc HP)',
        type: 'Final exam',
        part: 2,
        weight: 55,
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
  const [letterFilter, setLetterFilter] = useState<string>('ALL');

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<StudentGradeRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm] = Form.useForm();
  const [previewScore, setPreviewScore] = useState<{
    finalScore10: number;
    finalScore4: number;
    letterGrade: string;
    status: 'PASSED' | 'FAILED';
  } | null>(null);

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
              finalScore4: calc.finalScore4,
              letterGrade: calc.letterGrade,
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
        finalScore4: calc.finalScore4,
        letterGrade: calc.letterGrade,
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

      const matchesLetter =
        letterFilter === 'ALL' || rec.letterGrade === letterFilter;

      return matchesSearch && matchesStatus && matchesLetter;
    });
  }, [gradeRecords, searchText, statusFilter, letterFilter]);

  // Aggregate Statistics
  const stats = useMemo(() => {
    if (gradeRecords.length === 0) {
      return {
        total: 0,
        avg10: 0,
        avg4: 0,
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
    const sum4 = gradeRecords.reduce((acc, r) => acc + r.finalScore4, 0);
    const passedCount = gradeRecords.filter((r) => r.status === 'PASSED').length;
    const excellentCount = gradeRecords.filter(
      (r) => r.letterGrade === 'A' || r.letterGrade === 'B+'
    ).length;
    const failedCount = gradeRecords.filter((r) => r.status === 'FAILED').length;
    const highestScore = Math.max(...gradeRecords.map((r) => r.finalScore10));
    const lowestScore = Math.min(...gradeRecords.map((r) => r.finalScore10));

    return {
      total,
      avg10: Number((sum10 / total).toFixed(2)),
      avg4: Number((sum4 / total).toFixed(2)),
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
      { band: '< 4.0 (Học lại)', count: 0, color: '#EF4444' },
      { band: '4.0 - 5.4 (D/D+)', count: 0, color: '#F59E0B' },
      { band: '5.5 - 6.9 (C/C+)', count: 0, color: '#3B82F6' },
      { band: '7.0 - 8.4 (B/B+)', count: 0, color: '#06B6D4' },
      { band: '8.5 - 10 (A)', count: 0, color: '#10B981' },
    ];

    gradeRecords.forEach((r) => {
      const s = r.finalScore10;
      if (s < 4.0) buckets[0].count++;
      else if (s < 5.5) buckets[1].count++;
      else if (s < 7.0) buckets[2].count++;
      else if (s < 8.5) buckets[3].count++;
      else buckets[4].count++;
    });

    return buckets;
  }, [gradeRecords]);

  // Handle Edit Score Modal Open
  const handleOpenEdit = (student: StudentGradeRecord) => {
    setEditingStudent(student);
    const initialValues: Record<string, number | null> = {};
    assessments.forEach((asm, idx) => {
      const key = `asm_${asm.no || idx + 1}`;
      initialValues[key] = student.scores[key] ?? null;
    });
    editForm.setFieldsValue(initialValues);
    setPreviewScore({
      finalScore10: student.finalScore10,
      finalScore4: student.finalScore4,
      letterGrade: student.letterGrade,
      status: student.status,
    });
    setIsEditModalOpen(true);
  };

  // Recalculate preview score on form value change
  const handleFormValuesChange = () => {
    const currentValues = editForm.getFieldsValue();
    const calc = calculateStudentGrade(currentValues, assessments);
    setPreviewScore(calc);
  };

  // Save student score
  const handleSaveStudentScore = async () => {
    if (!editingStudent) return;
    try {
      const values = await editForm.validateFields();
      const calc = calculateStudentGrade(values, assessments);

      const updatedRecords = gradeRecords.map((r) => {
        if (r.memberId === editingStudent.memberId) {
          return {
            ...r,
            scores: values,
            finalScore10: calc.finalScore10,
            finalScore4: calc.finalScore4,
            letterGrade: calc.letterGrade,
            status: calc.status,
          };
        }
        return r;
      });

      saveRecords(updatedRecords);
      message.success(`Đã cập nhật bảng điểm của sinh viên "${editingStudent.fullName}"!`);
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
      csv += `Số tín chỉ: ${linkedSyllabus?.credits || 3} tín chỉ | Thang điểm: 10\n`;
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
        'Điểm Hệ 4',
        'Điểm chữ',
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
          rec.finalScore4.toFixed(1),
          `"${rec.letterGrade}"`,
          `"${rec.status === 'PASSED' ? 'ĐẠT' : 'HỌC LẠI'}"`,
        ];
        csv += row.join(',') + '\n';
      });

      // Stats summary
      csv += `\nTHỐNG KÊ TỔNG QUAN:\n`;
      csv += `Sĩ số tham gia tính điểm: ${stats.total}\n`;
      csv += `Điểm trung bình cả lớp (Hệ 10): ${stats.avg10}\n`;
      csv += `Điểm trung bình cả lớp (Hệ 4): ${stats.avg4}\n`;
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
        title: (
          <div className="text-center font-semibold">
            <div>Hệ 4</div>
          </div>
        ),
        dataIndex: 'finalScore4',
        key: 'finalScore4',
        width: 80,
        align: 'center' as const,
        render: (score4: number) => (
          <span className="font-semibold text-secondary-color fs-13">
            {score4.toFixed(1)}
          </span>
        ),
      },
      {
        title: (
          <div className="text-center font-semibold">
            <div>Điểm chữ</div>
          </div>
        ),
        dataIndex: 'letterGrade',
        key: 'letterGrade',
        width: 90,
        align: 'center' as const,
        render: (letter: string) => {
          let color = 'default';
          if (letter === 'A') color = 'success';
          else if (letter.startsWith('B')) color = 'processing';
          else if (letter.startsWith('C')) color = 'geekblue';
          else if (letter.startsWith('D')) color = 'warning';
          else if (letter === 'F') color = 'error';

          return (
            <Tag color={color} className="font-bold text-xs px-2 m-0">
              {letter}
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
        width: 120,
        align: 'center' as const,
        fixed: 'right' as const,
        render: (_: unknown, record: StudentGradeRecord) => (
          <Space size="small">
            <Button
              type="primary"
              ghost
              size="small"
              icon={<Edit3 size={13} />}
              onClick={() => handleOpenEdit(record)}
              className="text-xs"
            >
              Sửa điểm
            </Button>
            {onViewStudentStats && (
              <Tooltip title="Xem chi tiết lịch sử nộp bài">
                <Button
                  type="text"
                  size="small"
                  onClick={() => {
                    const original = members.find((m) => m.id === record.memberId);
                    if (original) onViewStudentStats(original);
                  }}
                  className="text-xs"
                >
                  Chi tiết
                </Button>
              </Tooltip>
            )}
          </Space>
        ),
      }
    );

    return baseColumns;
  }, [assessments, members, onViewStudentStats]);

  return (
    <div className="velica-gradebook-container">
      {/* 1. Header Information & Syllabus Weight Formula Banner */}
      <Alert
        message={
          <div className="d-flex items-center justify-between flex-wrap gap-2">
            <div className="d-flex items-center gap-2">
              <BookOpen size={18} className="text-brand-color flex-shrink-0" />
              <div>
                <span className="font-bold text-sm">
                  Đề cương áp dụng: {linkedSyllabus?.name || 'Chưa liên kết'} ({linkedSyllabus?.code || '—'})
                </span>
                <span className="text-secondary-color text-xs ml-2">
                  • {linkedSyllabus?.credits || 3} tín chỉ • Thang điểm {linkedSyllabus?.scoringScale || 10}
                </span>
              </div>
            </div>
            <div className="d-flex items-center gap-2">
              <Button
                size="small"
                type="link"
                onClick={() =>
                  navigate(
                    ROUTE_PATHS.TEACHER.SYLLABUS_DETAIL.replace(
                      ':id',
                      linkedSyllabus?.id || 'syl-1'
                    )
                  )
                }
                className="text-xs p-0 font-semibold"
              >
                Xem chi tiết Đề cương (Syllabus) ↗
              </Button>
            </div>
          </div>
        }
        description={
          <div className="mt-2 text-xs">
            <div className="font-semibold text-secondary-color mb-1">
              Công thức tính điểm tổng kết học phần theo tỷ lệ % Đề cương:
            </div>
            <div className="p-2 bg-white rounded border border-light d-flex items-center gap-2 flex-wrap font-mono text-brand-color">
              <span>Điểm TK = </span>
              {assessments.map((a, idx) => (
                <span key={idx}>
                  <strong>({a.category} × {a.weight}%)</strong>
                  {idx < assessments.length - 1 ? ' + ' : ''}
                </span>
              ))}
              <span className="text-muted-color"> / 100%</span>
            </div>
            <div className="mt-1 text-muted-color">
              * Điều kiện Đạt chuẩn: Điểm TK ≥ 4.0/10 và điểm Thi cuối kỳ ≥ 4.0/10 (không bị điểm liệt).
            </div>
          </div>
        }
        type="info"
        showIcon={false}
        className="mb-4 velica-card"
      />

      {/* 2. Top Summary KPI Row */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Sĩ số tính điểm"
            value={`${stats.total} sinh viên`}
            icon={<Users size={20} />}
            subtext="Đã lọc trừ trợ giảng và tài khoản xóa"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Điểm TB cả lớp (Hệ 10)"
            value={`${stats.avg10} / 10`}
            icon={<TrendingUp size={20} />}
            trend={{
              value: `Hệ 4: ${stats.avg4}`,
              isPositive: stats.avg10 >= 7.0,
              label: 'thang điểm 4.0',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Tỷ lệ Đạt học phần"
            value={`${stats.passedRate}%`}
            icon={<Award size={20} />}
            trend={{
              value: `${stats.passedCount}/${stats.total}`,
              isPositive: stats.passedRate >= 80,
              label: 'sinh viên đạt',
            }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Loại Giỏi / Xuất sắc"
            value={`${stats.excellentCount} SV`}
            icon={<GraduationCap size={20} />}
            subtext={`Cảnh báo học lại (F): ${stats.failedCount} sinh viên`}
          />
        </Col>
      </Row>

      {/* 3. Distribution Chart Card (Phổ điểm) */}
      <Card
        title={
          <div className="d-flex items-center justify-between">
            <div className="d-flex items-center gap-2">
              <Sparkles size={16} className="text-brand-color" />
              <span className="font-bold text-sm">Phổ điểm Tổng kết Cả lớp</span>
            </div>
            <span className="text-xs text-secondary-color">
              Cao nhất: <strong>{stats.highestScore}</strong> • Thấp nhất:{' '}
              <strong>{stats.lowestScore}</strong>
            </span>
          </div>
        }
        className="velica-card mb-4"
        size="small"
      >
        <div style={{ height: 160, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="band" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <RechartsTooltip
                formatter={(val: any) => [`${val} sinh viên`, 'Số lượng']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

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
            value={letterFilter}
            onChange={setLetterFilter}
            className="w-140"
            options={[
              { label: 'Tất cả điểm chữ', value: 'ALL' },
              { label: 'Điểm A (≥ 8.5)', value: 'A' },
              { label: 'Điểm B+ / B', value: 'B+' },
              { label: 'Điểm C+ / C', value: 'C+' },
              { label: 'Điểm D+ / D', value: 'D' },
              { label: 'Điểm F (< 4.0)', value: 'F' },
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
            type="primary"
            icon={<Download size={15} />}
            onClick={handleExportExcel}
            className="velica-btn-primary"
          >
            Xuất Bảng Điểm (Excel)
          </Button>
        </div>
      </div>

      {/* 5. Comprehensive Gradebook Table */}
      <Card className="velica-card-table mb-4">
        <Table
          dataSource={filteredRecords}
          columns={tableColumns}
          rowKey="memberId"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          scroll={{ x: 1200 }}
          bordered
          size="middle"
        />
      </Card>

      {/* 6. Edit Student Grade Modal */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Edit3 size={18} className="text-brand-color" />
            <span>
              Cập nhật Điểm số Sinh viên: <strong>{editingStudent?.fullName}</strong> ({editingStudent?.studentCode})
            </span>
          </div>
        }
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingStudent(null);
        }}
        onOk={handleSaveStudentScore}
        okText="Lưu thay đổi & Tính lại"
        cancelText="Đóng"
        width={680}
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
              Nhập điểm thành phần (thang điểm 10). Hệ thống sẽ tự động tính lại Điểm Tổng kết Hệ 10, Hệ 4 và Điểm chữ theo tỷ lệ đề cương.
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
            </Form>

            {/* Live Recalculation Preview Box */}
            {previewScore && (
              <div className="p-3 bg-brand-light rounded border border-brand-color mt-2">
                <div className="font-bold text-xs text-brand-color mb-2">
                  Dự tính Kết quả sau khi cập nhật:
                </div>
                <Row gutter={16} className="text-center">
                  <Col span={6}>
                    <div className="text-xs text-secondary-color">Tổng kết Hệ 10</div>
                    <div className="font-bold fs-18 text-primary-color">
                      {previewScore.finalScore10.toFixed(2)}
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="text-xs text-secondary-color">Quy đổi Hệ 4</div>
                    <div className="font-bold fs-18 text-primary-color">
                      {previewScore.finalScore4.toFixed(1)}
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="text-xs text-secondary-color">Điểm chữ</div>
                    <div className="font-bold fs-18 text-brand-color">
                      {previewScore.letterGrade}
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className="text-xs text-secondary-color">Trạng thái</div>
                    <div className="mt-1">
                      {previewScore.status === 'PASSED' ? (
                        <Tag color="success" className="font-bold">ĐẠT</Tag>
                      ) : (
                        <Tag color="error" className="font-bold">HỌC LẠI</Tag>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

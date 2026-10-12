import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal, Input, Tag, Badge } from 'antd';
import {
  Search,
  BookOpen,
  FileCheck2,
  GraduationCap,
  ClipboardList,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Users,
  Settings,
  HelpCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { mockService } from '../../../api/mocks/mockService';
import { UserRole } from '../../../constants/roleConstants';

export interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  activeRole: UserRole;
}

interface SearchItem {
  id: string;
  title: string;
  category: 'Trang & Chức năng' | 'Lớp học & Học phần' | 'Kỳ thi & Đánh giá' | 'Ngân hàng & Rubric';
  description?: string;
  path: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  roles?: UserRole[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  open,
  onClose,
  activeRole,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Master Search Index
  const allItems: SearchItem[] = useMemo(() => {
    return [
      // Navigation / Pages
      {
        id: 'nav-teacher-dash',
        title: 'Bảng điều khiển Giảng viên',
        category: 'Trang & Chức năng',
        description: 'Quản lý danh sách lớp học phần, sĩ số, bài thi và sinh viên',
        path: ROUTE_PATHS.TEACHER.CLASSES,
        icon: <GraduationCap size={16} className="text-brand-color" />,
        roles: ['TEACHER'],
      },
      {
        id: 'nav-student-classes',
        title: 'Lớp học phần của tôi',
        category: 'Trang & Chức năng',
        description: 'Tiến độ học phần, đề cương, bài tập và bảng điểm môn học',
        path: ROUTE_PATHS.STUDENT.CLASSES,
        icon: <BookOpen size={16} className="text-brand-color" />,
        roles: ['STUDENT'],
      },
      {
        id: 'nav-student-classes',
        title: 'Lớp học phần của tôi',
        category: 'Trang & Chức năng',
        description: 'Danh sách lớp đăng ký, bảng điểm thành phần, đề cương học phần',
        path: ROUTE_PATHS.STUDENT.CLASSES,
        icon: <GraduationCap size={16} className="text-brand-color" />,
        roles: ['STUDENT'],
      },
      {
        id: 'nav-student-assessments',
        title: 'Bài thi & Kỳ kiểm tra',
        category: 'Trang & Chức năng',
        description: 'Danh sách bài kiểm tra trắc nghiệm, tự luận, thi thử nghiệm',
        path: ROUTE_PATHS.STUDENT.ASSESSMENTS,
        badge: 'Khảo thí',
        badgeColor: 'blue',
        icon: <FileCheck2 size={16} className="text-brand-color" />,
        roles: ['STUDENT'],
      },
      {
        id: 'nav-student-mock',
        title: 'Luyện tập Đề thi Thử nghiệm (Mock Exam)',
        category: 'Kỳ thi & Đánh giá',
        description: '5 định dạng câu hỏi: MCQ, Multi-choice, Đúng/Sai, Điền khuyết, Tự luận',
        path: '/student/assessments/asm-practice/instructions',
        badge: 'Thực hành',
        badgeColor: 'green',
        icon: <Sparkles size={16} className="text-brand-color" />,
        roles: ['STUDENT'],
      },
      {
        id: 'nav-student-appeals',
        title: 'Lịch sử Đơn đề nghị Phúc khảo',
        category: 'Trang & Chức năng',
        description: 'Theo dõi tiến độ chấm lại và phản hồi từ giảng viên',
        path: ROUTE_PATHS.STUDENT.GRADE_REVIEWS,
        icon: <ShieldCheck size={16} className="text-brand-color" />,
        roles: ['STUDENT'],
      },
      {
        id: 'nav-teacher-classes',
        title: 'Quản lý Lớp học phần',
        category: 'Trang & Chức năng',
        description: 'Danh sách 6 lớp phụ trách, thống kê chuẩn đầu ra CLO',
        path: ROUTE_PATHS.TEACHER.CLASSES,
        icon: <GraduationCap size={16} className="text-brand-color" />,
        roles: ['TEACHER'],
      },
      {
        id: 'nav-teacher-qbank',
        title: 'Ngân hàng Câu hỏi Khảo thí',
        category: 'Trang & Chức năng',
        description: '162 câu hỏi phân loại theo thang đo nhận thức Bloom',
        path: ROUTE_PATHS.TEACHER.QUESTION_BANK,
        badge: '162 câu',
        badgeColor: 'cyan',
        icon: <ClipboardList size={16} className="text-brand-color" />,
        roles: ['TEACHER'],
      },
      {
        id: 'nav-teacher-rubrics',
        title: 'Tiêu chí Rubric Chấm Tự luận',
        category: 'Trang & Chức năng',
        description: 'Khung ma trận đánh giá tự luận định lượng và mức độ đạt',
        path: ROUTE_PATHS.TEACHER.RUBRICS,
        icon: <Award size={16} className="text-brand-color" />,
        roles: ['TEACHER'],
      },
      {
        id: 'nav-teacher-builder',
        title: 'Soạn Đề thi Mới (Assessment Builder)',
        category: 'Trang & Chức năng',
        description: 'Quy trình 3 bước: Thông tin chung, Ma trận Bloom, Giám sát thi',
        path: ROUTE_PATHS.TEACHER.ASSESSMENT_BUILDER,
        badge: 'Tạo mới',
        badgeColor: 'orange',
        icon: <FileCheck2 size={16} className="text-brand-color" />,
        roles: ['TEACHER'],
      },
      {
        id: 'nav-teacher-grading',
        title: 'Hàng đợi Chấm bài Tự luận',
        category: 'Trang & Chức năng',
        description: 'Chấm bài thi tự luận sinh viên theo khung tiêu chí Rubric',
        path: ROUTE_PATHS.TEACHER.GRADING_QUEUE,
        badge: 'Cần chấm',
        badgeColor: 'red',
        icon: <Award size={16} className="text-brand-color" />,
        roles: ['TEACHER'],
      },
      {
        id: 'nav-teacher-appeals',
        title: 'Xử lý Đơn Phúc khảo Điểm',
        category: 'Trang & Chức năng',
        description: 'Xem xét lý do khiếu nại điểm thi và điều chỉnh điểm số',
        path: '/teacher/assessments/asm-1/appeals',
        icon: <ShieldCheck size={16} className="text-brand-color" />,
        roles: ['TEACHER'],
      },

      // Classes
      {
        id: 'cls-se301',
        title: 'SE301.P01 — Kiến Trúc Phần Mềm Hiện Đại',
        category: 'Lớp học & Học phần',
        description: 'TS. Nguyễn Văn An • 68 sinh viên • HK1 2026-2027',
        path: '/teacher/classes/cls-101',
        badge: 'Lớp học',
        badgeColor: 'blue',
        icon: <GraduationCap size={16} className="text-brand-color" />,
      },
      {
        id: 'cls-se302',
        title: 'SE302.P01 — Thiết Kế Mẫu Hướng Đối Tượng',
        category: 'Lớp học & Học phần',
        description: 'ThS. Trần Thị Mai • 54 sinh viên • HK1 2026-2027',
        path: '/teacher/classes/cls-102',
        badge: 'Lớp học',
        badgeColor: 'blue',
        icon: <GraduationCap size={16} className="text-brand-color" />,
      },
      {
        id: 'cls-cs101',
        title: 'CS101.P01 — Nhập Môn Lập Trình Cơ Bản',
        category: 'Lớp học & Học phần',
        description: 'TS. Lê Hoàng Nam • 85 sinh viên',
        path: '/teacher/classes/cls-103',
        badge: 'Lớp học',
        badgeColor: 'blue',
        icon: <GraduationCap size={16} className="text-brand-color" />,
      },

      // Assessments
      {
        id: 'asm-1',
        title: 'Kiểm Tra Giữa Kỳ — Kiến Trúc Phần Mềm Hiện Đại',
        category: 'Kỳ thi & Đánh giá',
        description: 'SE301 - Nhóm 01 • Thời lượng: 45 phút • Trọng số 30%',
        path: '/teacher/assessments/asm-1/results',
        badge: 'Midterm',
        badgeColor: 'geekblue',
        icon: <FileCheck2 size={16} className="text-brand-color" />,
      },
      {
        id: 'asm-2',
        title: 'Mini Quiz 01 — Nguyên Lý SOLID Cốt Lõi',
        category: 'Kỳ thi & Đánh giá',
        description: 'SE301 - Nhóm 01 • Thời lượng: 15 phút • Trắc nghiệm 10 câu',
        path: '/teacher/assessments/asm-2/results',
        badge: 'Quiz',
        badgeColor: 'cyan',
        icon: <FileCheck2 size={16} className="text-brand-color" />,
      },
      {
        id: 'asm-3',
        title: 'Bài Tập Lớn — Phân Tích & Thiết Kế Hệ Thống E-Commerce',
        category: 'Kỳ thi & Đánh giá',
        description: 'Nộp báo cáo kiến trúc Microservices và đồ án nhóm',
        path: '/teacher/assessments',
        badge: 'Assignment',
        badgeColor: 'purple',
        icon: <FileCheck2 size={16} className="text-brand-color" />,
      },

      // Question Bank & Rubrics
      {
        id: 'q-srp',
        title: 'Câu Q-1: Nguyên tắc Single Responsibility (SRP)',
        category: 'Ngân hàng & Rubric',
        description: 'Mức độ Bloom 2 (Hiểu) • Chuẩn đầu ra CLO1 • Trắc nghiệm 1 điểm',
        path: '/teacher/question-bank',
        badge: 'Bloom 2',
        badgeColor: 'green',
        icon: <ClipboardList size={16} className="text-brand-color" />,
      },
      {
        id: 'q-clean',
        title: 'Câu Q-5: Thiết kế Kiến trúc Clean Architecture cho E-Commerce',
        category: 'Ngân hàng & Rubric',
        description: 'Mức độ Bloom 5 (Đánh giá) • Tự luận 4.0 điểm • Chấm theo Rubric SE301',
        path: '/teacher/question-bank',
        badge: 'Tự luận',
        badgeColor: 'red',
        icon: <Award size={16} className="text-brand-color" />,
      },
      {
        id: 'rub-se301',
        title: 'Rubric Chấm Điểm Kiến Trúc Phần Mềm SE301',
        category: 'Ngân hàng & Rubric',
        description: '3 tiêu chí: Clean Architecture, Saga Compensation, Trình bày',
        path: '/teacher/rubrics',
        badge: 'Rubric',
        badgeColor: 'gold',
        icon: <Award size={16} className="text-brand-color" />,
      },
    ];
  }, []);

  // Filter items based on active search query and role compatibility
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      // Role filter if specified
      if (item.roles && !item.roles.includes(activeRole)) {
        return false;
      }

      if (!q) return true;

      const titleMatch = item.title.toLowerCase().includes(q);
      const descMatch = item.description?.toLowerCase().includes(q);
      const catMatch = item.category.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch;
    });
  }, [allItems, query, activeRole]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        handleSelectItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelectItem = (item: SearchItem) => {
    onClose();
    // Adapt path for student if clicking class
    if (activeRole === 'STUDENT' && item.path.startsWith('/teacher/classes/')) {
      const clsId = item.path.split('/').pop();
      navigate(`/student/classes/${clsId}`);
      return;
    }
    navigate(item.path);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={640}
      styles={{
        content: {
          padding: 0,
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 20px 48px -12px rgba(16, 24, 40, 0.25)',
        },
      }}
    >
      <div className="velica-command-search-box" onKeyDown={handleKeyDown}>
        {/* Search Input Bar */}
        <div className="d-flex items-center px-3 py-2 border-bottom bg-white gap-2">
          <Search size={18} className="text-muted-color flex-shrink-0" />
          <Input
            ref={inputRef}
            id="velica-spotlight-input"
            autoFocus
            variant="borderless"
            placeholder="Tìm kiếm trang, lớp học, đề thi, ngân hàng câu hỏi..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="p-0 text-sm font-medium w-100"
          />
          <span className="badge bg-light text-muted-color border font-monospace px-2 py-1 text-xs">
            ESC để đóng
          </span>
        </div>

        {/* Results List */}
        <div className="velica-command-results-list max-h-460 overflow-y-auto p-2 bg-light">
          {filteredItems.length === 0 ? (
            <div className="text-center py-5 text-muted-color">
              <Search size={28} className="text-muted mb-2 opacity-50" />
              <div className="font-semibold text-sm">Không tìm thấy kết quả phù hợp</div>
              <div className="text-xs text-muted-color mt-1">
                Thử tìm với từ khóa "SE301", "Kiểm tra", "Rubric", hoặc "Câu hỏi"
              </div>
            </div>
          ) : (
            <div className="d-flex flex-col gap-1">
              {filteredItems.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`d-flex items-center justify-between p-2 rounded-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-white shadow-xs border-primary'
                        : 'hover-bg-white border-transparent'
                    }`}
                    style={{
                      border: isSelected ? '1px solid #FA5A2A' : '1px solid transparent',
                    }}
                  >
                    <div className="d-flex items-center gap-3 overflow-hidden flex-1">
                      <div
                        className="d-flex items-center justify-center rounded-2 flex-shrink-0"
                        style={{
                          width: 32,
                          height: 32,
                          backgroundColor: isSelected ? '#FFF1ED' : '#F2F4F7',
                        }}
                      >
                        {item.icon}
                      </div>

                      <div className="overflow-hidden">
                        <div className="d-flex items-center gap-2">
                          <span className="font-semibold text-sm text-primary-color text-truncate">
                            {item.title}
                          </span>
                          {item.badge && (
                            <Tag
                              color={item.badgeColor || 'default'}
                              className="m-0 text-2xs py-0 px-1 font-semibold"
                            >
                              {item.badge}
                            </Tag>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs text-muted-color text-truncate">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex items-center gap-2 flex-shrink-0 ms-2">
                      <span className="badge bg-light text-muted-color text-2xs">
                        {item.category}
                      </span>
                      {isSelected && (
                        <ArrowRight size={14} className="text-brand-color" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Key Hints */}
        <div className="d-flex items-center justify-between px-3 py-2 border-top bg-white text-2xs text-muted-color">
          <div className="d-flex items-center gap-3">
            <span>
              <kbd className="border bg-light px-1 py-0.5 rounded">↑</kbd>{' '}
              <kbd className="border bg-light px-1 py-0.5 rounded">↓</kbd> để di chuyển
            </span>
            <span>
              <kbd className="border bg-light px-1 py-0.5 rounded">↵</kbd> để chọn
            </span>
          </div>
          <div>
            <span>Velica Academic Spotlight Search</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

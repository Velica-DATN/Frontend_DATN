import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Badge,
  Tag,
  Button,
  Tooltip,
  Modal,
  Drawer,
  message,
  Segmented,
  Popover,
} from 'antd';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileCheck2,
  Users,
  ShieldCheck,
  FolderGit2,
  FileText,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Sparkles,
  RotateCcw,
  UserCheck,
  Menu as MenuIcon,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { ROUTE_PATHS } from '../../../router/constants/routePaths';
import { ROLE, UserRole, ROLE_LABELS } from '../../../constants/roleConstants';
import { mockService } from '../../../api/mocks/mockService';
import { GlobalSearchModal } from '../../velica/GlobalSearch/GlobalSearchModal';
import logoImg from '../../../assets/logo.png';

const { Header, Sider, Content } = Layout;

interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'SUBMISSION' | 'PROCTOR' | 'APPEAL' | 'SYSTEM';
  targetPath: string;
}

const ROLE_NOTIFICATIONS: Record<UserRole, AppNotification[]> = {
  TEACHER: [
    {
      id: 'notif-t-1',
      title: 'Bài nộp kiểm tra mới',
      description: 'Phạm Thu Thảo vừa nộp bài thi Giữa kỳ SE301 (Tự động chấm trắc nghiệm: 7.8 / 10đ). Bài thi có câu hỏi tự luận Q-5 cần giảng viên chấm điểm theo Rubric.',
      time: '5 phút trước',
      read: false,
      type: 'SUBMISSION',
      targetPath: '/teacher/assessments/asm-1/results',
    },
    {
      id: 'notif-t-2',
      title: 'Cảnh báo Giám sát thi (Proctoring)',
      description: 'Sinh viên Nguyễn Văn Hoàng ghi nhận 3 lần rời tab thi và thoát chế độ toàn màn hình trong ca thi Giữa kỳ SE301.P01.',
      time: '22 phút trước',
      read: false,
      type: 'PROCTOR',
      targetPath: '/teacher/assessments/asm-1/monitor',
    },
    {
      id: 'notif-t-3',
      title: 'Đơn phúc khảo điểm bài thi',
      description: 'Sinh viên Lê Quốc Tuấn gửi đơn phúc khảo câu hỏi tự luận Q-5 đề nghị xem xét lại tiêu chí Clean Architecture & Phân tách Domain.',
      time: '1 giờ trước',
      read: false,
      type: 'APPEAL',
      targetPath: '/teacher/assessments/asm-1/appeals',
    },
    {
      id: 'notif-t-4',
      title: 'Nhắc nhở hạn nộp học vụ',
      description: 'Hạn chót công bố điểm chính thức học phần Kiến trúc PM SE301 vào 18:00 ngày mai theo quy định của Phòng Đào tạo.',
      time: '3 giờ trước',
      read: true,
      type: 'SYSTEM',
      targetPath: '/teacher/classes/cls-101',
    },
    {
      id: 'notif-t-5',
      title: 'Cập nhật Ngân hàng đề thi',
      description: 'Đã đồng bộ thành công 6 câu hỏi mới từ Đề cương môn học vào Ngân hàng câu hỏi khảo thí.',
      time: 'Hôm qua',
      read: true,
      type: 'SYSTEM',
      targetPath: '/teacher/question-bank',
    },
  ],
  STUDENT: [
    {
      id: 'notif-s-1',
      title: 'Công bố điểm thi Giữa kỳ HK1',
      description: 'Điểm chính thức bài thi "Kiến Trúc Phần Mềm Hiện Đại" đã được công bố: 8.5 / 10đ (Xếp loại Giỏi). Bạn có thể bấm vào để xem chi tiết bài làm & lời phê của Giảng viên.',
      time: '10 phút trước',
      read: false,
      type: 'SUBMISSION',
      targetPath: '/student/assessments/asm-1/review',
    },
    {
      id: 'notif-s-2',
      title: 'Mở đề thi thử nghiệm (Mock Practice)',
      description: 'Hệ thống đã kích hoạt đề thi thử nghiệm với đầy đủ 5 dạng câu hỏi khảo thí: MCQ, Multi-choice, Đúng/Sai, Điền khuyết và Tự luận Clean Architecture. Bạn có thể làm thử nhiều lần để làm quen giao diện.',
      time: '30 phút trước',
      read: false,
      type: 'SYSTEM',
      targetPath: '/student/assessments',
    },
    {
      id: 'notif-s-3',
      title: 'Phản hồi đơn phúc khảo từ Giảng viên',
      description: 'TS. Nguyễn Văn An đã tiếp nhận đơn phúc khảo câu hỏi Q-5 của bạn. Kết quả thẩm định sẽ được cập nhật trong vòng 24 giờ tới.',
      time: '2 giờ trước',
      read: false,
      type: 'APPEAL',
      targetPath: '/student/grade-reviews',
    },
    {
      id: 'notif-s-4',
      title: 'Chủ đề học phần CLO mới được cập nhật',
      description: 'Giảng viên đã đồng bộ danh mục chủ đề theo chuẩn đầu ra CLO cho Bài 3: Quản Lý Giao Dịch Phân Tán (Saga Pattern).',
      time: 'Hôm qua',
      read: true,
      type: 'SYSTEM',
      targetPath: '/student/classes/cls-101?tab=lessons',
    },
  ],
  ADMIN: [
    {
      id: 'notif-a-1',
      title: 'Cảnh báo Giám sát thi cao điểm',
      description: 'Phòng thi trực tuyến ghi nhận 1,240 kết nối đồng thời. Tải CPU máy chủ đạt 68%, trạng thái hoạt động ổn định.',
      time: '15 phút trước',
      read: false,
      type: 'SYSTEM',
      targetPath: '/admin/stats',
    },
    {
      id: 'notif-a-2',
      title: 'Nhật ký kiểm toán bảo mật (Audit)',
      description: 'Ghi nhận 12 thao tác xuất bản đề thi và điều chỉnh điểm số trong 24h qua.',
      time: '1 giờ trước',
      read: false,
      type: 'SYSTEM',
      targetPath: '/admin/audit-logs',
    },
    {
      id: 'notif-a-3',
      title: 'Thông báo bảo trì hệ thống',
      description: 'Bảo trì định kỳ máy chủ dữ liệu dự kiến diễn ra vào 02:00 sáng Chủ Nhật.',
      time: 'Hôm qua',
      read: true,
      type: 'SYSTEM',
      targetPath: '/admin/maintenance',
    },
  ],
};

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(mockService.getCurrentRole());

  // Interactive Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => ROLE_NOTIFICATIONS[activeRole] || ROLE_NOTIFICATIONS.TEACHER);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [notifOpen, setNotifOpen] = useState(false);
  const [previewNotif, setPreviewNotif] = useState<AppNotification | null>(null);
  const [allNotifsModalOpen, setAllNotifsModalOpen] = useState(false);

  // Global Command Palette Search State
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Sync notifications when active role changes
  useEffect(() => {
    setNotifications(ROLE_NOTIFICATIONS[activeRole] || ROLE_NOTIFICATIONS.TEACHER);
  }, [activeRole]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifs = notifFilter === 'UNREAD' ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    message.success('Đã đánh dấu tất cả thông báo là đã đọc');
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    setNotifOpen(false);
    setPreviewNotif(notif);
  };

  const currentUser = mockService.getCurrentUser();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const getPageInfo = () => {
    const p = location.pathname;
    if (p.includes('/admin/users')) return { title: 'Quản lý Người dùng', count: '1,240' };
    if (p.includes('/admin/roles')) return { title: 'Phân quyền Vai trò', count: '5 vai trò' };
    if (p.includes('/admin/stats')) return { title: 'Thống kê Toàn trường', count: '2026' };
    if (p.includes('/admin/notifications')) return { title: 'Phát Thông báo', count: '12 tin' };
    if (p.includes('/admin/audit-logs')) return { title: 'Nhật ký Vận hành', count: 'Audit' };
    if (p.includes('/admin/maintenance')) return { title: 'Chế độ Bảo trì', count: 'Live' };
    if (p.includes('/admin/dashboard')) return { title: 'Tổng quan Hệ thống', count: 'Admin' };
    if (p.includes('/teacher/classes')) return { title: 'Quản lý Lớp học', count: '6 lớp' };
    if (p.includes('/teacher/syllabus')) return { title: 'Đề cương Môn học', count: '4 đề cương' };
    if (p.includes('/teacher/lessons')) return { title: 'Chủ đề theo CLO', count: '24 chủ đề' };
    if (p.includes('/teacher/question-bank')) return { title: 'Ngân hàng Câu hỏi', count: '162 câu' };
    if (p.includes('/teacher/assessments')) return { title: 'Đề thi & Đánh giá', count: '112 đề' };
    if (p.includes('/teacher/rubrics')) return { title: 'Rubric Tự luận', count: '8 chuẩn' };
    if (p.includes('/teacher/dashboard')) return { title: 'Bảng điều khiển Giảng viên', count: 'HK1' };
    if (p.includes('/student/classes')) return { title: 'Lớp học của tôi', count: '5 lớp' };
    if (p.includes('/student/assessments')) return { title: 'Kỳ thi & Đánh giá', count: '3 đề' };
    if (p.includes('/student/results')) return { title: 'Kết quả Học tập', count: 'GPA 3.65' };
    if (p.includes('/student/grade-reviews')) return { title: 'Lịch sử Phúc khảo', count: '1 đơn' };
    if (p.includes('/student/dashboard')) return { title: 'Góc học tập Sinh viên', count: 'Live' };
    return { title: 'Velica Assessment', count: ROLE_LABELS[activeRole] };
  };

  const pageInfo = getPageInfo();

  const handleRoleChange = (newRole: UserRole) => {
    mockService.setCurrentRole(newRole);
    setActiveRole(newRole);
    message.success(`Đã chuyển sang góc nhìn: ${ROLE_LABELS[newRole]}`);
    if (newRole === ROLE.ADMIN) {
      navigate(ROUTE_PATHS.ADMIN.DASHBOARD);
    } else if (newRole === ROLE.TEACHER) {
      navigate(ROUTE_PATHS.TEACHER.CLASSES);
    } else {
      navigate(ROUTE_PATHS.STUDENT.CLASSES);
    }
  };

  const handleResetData = () => {
    Modal.confirm({
      title: 'Khôi phục dữ liệu mẫu?',
      content: 'Tất cả các thay đổi mock data (thêm/sửa/xóa bài thi, điểm số, câu hỏi) sẽ được khôi phục về trạng thái ban đầu.',
      okText: 'Khôi phục',
      cancelText: 'Hủy',
      onOk: () => {
        mockService.resetAllData();
        message.success('Đã khôi phục dữ liệu mẫu thành công!');
        window.location.reload();
      },
    });
  };

// Determine which submenus should be open based on URL path
const getOpenKeysForPath = (p: string): string[] => {
  const keys: string[] = [];
  if (p.includes('/teacher/classes') || p.includes('/teacher/syllabus') || p.includes('/teacher/lessons')) {
    keys.push('sub-teacher-academics');
  }
  if (p.includes('/teacher/question-bank') || p.includes('/teacher/question-levels') || p.includes('/teacher/rubrics')) {
    keys.push('sub-teacher-bank');
  }
  if (p.includes('/teacher/assessments') || p.includes('/teacher/grading') || p.includes('/teacher/appeals')) {
    keys.push('sub-teacher-exams');
  }
  if (p.includes('/admin/users') || p.includes('/admin/roles')) {
    keys.push('sub-admin-users');
  }
  if (p.includes('/admin/stats') || p.includes('/admin/notifications') || p.includes('/admin/audit') || p.includes('/admin/maintenance')) {
    keys.push('sub-admin-ops');
  }
  return keys;
};

  const [openKeys, setOpenKeys] = useState<string[]>(() => getOpenKeysForPath(location.pathname));

  useEffect(() => {
    const autoKeys = getOpenKeysForPath(location.pathname);
    setOpenKeys((prev) => Array.from(new Set([...prev, ...autoKeys])));
  }, [location.pathname]);

  // Build hierarchical menu items based on active role
  const getMenuItems = () => {
    const renderSidebarItem = (to: string, label: string) => (
      <Tooltip placement="right" title={label} mouseEnterDelay={0.25}>
        <Link to={to} className="text-truncate d-block">
          {label}
        </Link>
      </Tooltip>
    );

    const renderSubmenuLabel = (label: string) => (
      <Tooltip placement="right" title={label} mouseEnterDelay={0.25}>
        <span className="text-truncate d-block">
          {label}
        </span>
      </Tooltip>
    );

    if (activeRole === ROLE.ADMIN) {
      return [
        {
          key: ROUTE_PATHS.ADMIN.DASHBOARD,
          icon: <LayoutDashboard size={17} />,
          label: renderSidebarItem(ROUTE_PATHS.ADMIN.DASHBOARD, 'Tổng quan hệ thống'),
        },
        {
          key: 'sub-admin-users',
          icon: <Users size={17} />,
          label: renderSubmenuLabel('Người dùng & Phân quyền'),
          children: [
            {
              key: ROUTE_PATHS.ADMIN.USERS,
              label: renderSidebarItem(ROUTE_PATHS.ADMIN.USERS, 'Quản lý người dùng'),
            },
            {
              key: ROUTE_PATHS.ADMIN.ROLES,
              label: renderSidebarItem(ROUTE_PATHS.ADMIN.ROLES, 'Phân quyền vai trò'),
            },
          ],
        },
        {
          key: 'sub-admin-ops',
          icon: <Settings size={17} />,
          label: renderSubmenuLabel('Vận hành & Giám sát'),
          children: [
            {
              key: ROUTE_PATHS.ADMIN.STATS,
              label: renderSidebarItem(ROUTE_PATHS.ADMIN.STATS, 'Thống kê toàn trường'),
            },
            {
              key: ROUTE_PATHS.ADMIN.NOTIFICATIONS,
              label: renderSidebarItem(ROUTE_PATHS.ADMIN.NOTIFICATIONS, 'Gửi thông báo'),
            },
            {
              key: ROUTE_PATHS.ADMIN.AUDIT_LOGS,
              label: renderSidebarItem(ROUTE_PATHS.ADMIN.AUDIT_LOGS, 'Nhật ký hệ thống'),
            },
            {
              key: ROUTE_PATHS.ADMIN.MAINTENANCE,
              label: renderSidebarItem(ROUTE_PATHS.ADMIN.MAINTENANCE, 'Chế độ bảo trì'),
            },
          ],
        },
      ];
    }

    if (activeRole === ROLE.TEACHER) {
      return [
        {
          key: 'sub-teacher-academics',
          icon: <GraduationCap size={17} />,
          label: renderSubmenuLabel('Giảng dạy & Lớp học'),
          children: [
            {
              key: ROUTE_PATHS.TEACHER.CLASSES,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.CLASSES, 'Quản lý lớp học'),
            },
            {
              key: ROUTE_PATHS.TEACHER.SYLLABUS,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.SYLLABUS, 'Đề cương môn học (Syllabus)'),
            },
            {
              key: ROUTE_PATHS.TEACHER.LESSONS,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.LESSONS, 'Chủ đề theo CLO'),
            },
          ],
        },
        {
          key: 'sub-teacher-bank',
          icon: <ClipboardList size={17} />,
          label: renderSubmenuLabel('Ngân hàng Khảo thí'),
          children: [
            {
              key: ROUTE_PATHS.TEACHER.QUESTION_BANK,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.QUESTION_BANK, 'Ngân hàng câu hỏi'),
            },
            {
              key: ROUTE_PATHS.TEACHER.QUESTION_LEVELS,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.QUESTION_LEVELS, 'Cấu hình mức độ câu hỏi'),
            },
            {
              key: ROUTE_PATHS.TEACHER.RUBRICS,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.RUBRICS, 'Tiêu chí Rubric tự luận'),
            },
          ],
        },
        {
          key: 'sub-teacher-exams',
          icon: <FileCheck2 size={17} />,
          label: renderSubmenuLabel('Kỳ thi & Chấm bài'),
          children: [
            {
              key: ROUTE_PATHS.TEACHER.ASSESSMENTS,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.ASSESSMENTS, 'Đề thi & Đánh giá'),
            },
            {
              key: ROUTE_PATHS.TEACHER.GRADING_QUEUE,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.GRADING_QUEUE, 'Hàng đợi chấm tự luận'),
            },
            {
              key: ROUTE_PATHS.TEACHER.GRADE_APPEALS,
              label: renderSidebarItem(ROUTE_PATHS.TEACHER.GRADE_APPEALS, 'Xử lý đơn phúc khảo'),
            },
          ],
        },
      ];
    }

    // Student
    return [
      {
        key: ROUTE_PATHS.STUDENT.CLASSES,
        icon: <GraduationCap size={17} />,
        label: renderSidebarItem(ROUTE_PATHS.STUDENT.CLASSES, 'Lớp học phần của tôi'),
      },
      {
        key: ROUTE_PATHS.STUDENT.ASSESSMENTS,
        icon: <FileCheck2 size={17} />,
        label: renderSidebarItem(ROUTE_PATHS.STUDENT.ASSESSMENTS, 'Bài thi & Kiểm tra'),
      },
      {
        key: ROUTE_PATHS.STUDENT.GRADE_REVIEWS,
        icon: <FileText size={17} />,
        label: renderSidebarItem(ROUTE_PATHS.STUDENT.GRADE_REVIEWS, 'Đơn phúc khảo điểm'),
      },
    ];
  };

  const userMenu = {
    items: [
      {
        key: 'user-info-header',
        disabled: true,
        label: (
          <div className="py-1">
            <div className="fw-semibold text-dark">{currentUser.fullName}</div>
            <div className="text-xs text-muted-color">{currentUser.email}</div>
          </div>
        ),
      },
      { type: 'divider' as const },
      {
        key: 'profile',
        icon: <UserCheck size={16} />,
        label: <Link to={ROUTE_PATHS.PROFILE.PERSONAL_INFO}>Thông tin cá nhân</Link>,
      },
      {
        key: 'security',
        icon: <ShieldCheck size={16} />,
        label: <Link to={ROUTE_PATHS.PROFILE.SECURITY}>Bảo mật & Mật khẩu</Link>,
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogOut size={16} className="text-danger-color" />,
        label: <span className="text-danger-color">Đăng xuất</span>,
        onClick: () => {
          message.info('Đã đăng xuất tài khoản.');
          navigate(ROUTE_PATHS.AUTH.LOGIN);
        },
      },
    ],
  };

  const sidebarContent = (
    <div className="velica-sider-inner">
      {/* Brand & Logo Header */}
      <div
        className="velica-sider-header cursor-pointer"
        onClick={() =>
          navigate(
            activeRole === ROLE.ADMIN
              ? ROUTE_PATHS.ADMIN.DASHBOARD
              : activeRole === ROLE.STUDENT
              ? ROUTE_PATHS.STUDENT.CLASSES
              : ROUTE_PATHS.TEACHER.CLASSES
          )
        }
      >
        <div className="velica-sider-brand-badge">
          <img
            src={logoImg}
            alt="Velica"
            className="velica-sider-logo-img"
          />
        </div>
        <div className="d-flex flex-col flex-1">
          <span className="velica-sider-brand-title">
            Velica
          </span>
          <span className="velica-sider-brand-sub">
            Academic Assessment
          </span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="velica-sider-menu-wrapper">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          items={getMenuItems()}
          className="velica-sidebar-menu"
        />
      </div>
    </div>
  );

  const notificationContent = (
    <div className="velica-notif-popover">
      <div className="velica-notif-header">
        <div className="velica-notif-title-group">
          <span>Thông báo</span>
          {unreadCount > 0 && <Tag color="error">{unreadCount} mới</Tag>}
        </div>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            className="p-0 text-xs font-semibold text-brand-color"
            onClick={handleMarkAllRead}
          >
            Đánh dấu đã đọc
          </Button>
        )}
      </div>

      <div className="velica-notif-filter-bar">
        <button
          type="button"
          onClick={() => setNotifFilter('ALL')}
          className={`velica-notif-filter-btn ${notifFilter === 'ALL' ? 'velica-notif-filter-btn-active' : ''}`}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setNotifFilter('UNREAD')}
          className={`velica-notif-filter-btn ${notifFilter === 'UNREAD' ? 'velica-notif-filter-btn-active' : ''}`}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      <div className="velica-notif-list">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`velica-notif-item ${!notif.read ? 'velica-notif-item-unread' : ''}`}
            >
              <div
                className={`velica-notif-icon-box ${
                  notif.type === 'PROCTOR'
                    ? 'velica-notif-icon-proctor'
                    : notif.type === 'APPEAL'
                    ? 'velica-notif-icon-appeal'
                    : notif.type === 'SUBMISSION'
                    ? 'velica-notif-icon-submission'
                    : 'velica-notif-icon-system'
                }`}
              >
                {notif.type === 'PROCTOR' ? (
                  <AlertTriangle size={15} />
                ) : notif.type === 'APPEAL' ? (
                  <ShieldCheck size={15} />
                ) : notif.type === 'SUBMISSION' ? (
                  <FileCheck2 size={15} />
                ) : (
                  <Bell size={15} />
                )}
              </div>
              <div className="velica-notif-content">
                <div className="velica-notif-item-title">{notif.title}</div>
                <div className="velica-notif-item-desc">{notif.description}</div>
                <div className="velica-notif-item-time">{notif.time}</div>
              </div>
              {!notif.read && <span className="velica-notif-unread-dot" />}
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-muted-color text-xs">
            Không có thông báo nào trong mục này
          </div>
        )}
      </div>

      <div
        className="velica-notif-footer"
        onClick={() => {
          setNotifOpen(false);
          if (activeRole === ROLE.ADMIN) {
            navigate(ROUTE_PATHS.ADMIN.NOTIFICATIONS);
          } else {
            setAllNotifsModalOpen(true);
          }
        }}
      >
        Xem toàn bộ lịch sử thông báo hệ thống &rarr;
      </div>
    </div>
  );

  return (
    <Layout hasSider className="velica-layout-root">
      {/* Desktop Sider */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        collapsedWidth={64}
        className="velica-sider-desktop"
      >
        {collapsed ? (
          <div className="velica-sider-inner-collapsed">
            <div
              className="velica-sider-header-collapsed cursor-pointer"
              onClick={() =>
                navigate(
                  activeRole === ROLE.ADMIN
                    ? ROUTE_PATHS.ADMIN.DASHBOARD
                    : activeRole === ROLE.STUDENT
                    ? ROUTE_PATHS.STUDENT.CLASSES
                    : ROUTE_PATHS.TEACHER.CLASSES
                )
              }
            >
              <img src={logoImg} alt="Velica" className="velica-sider-logo-collapsed" />
            </div>
            <div className="velica-sider-menu-wrapper w-100">
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={getMenuItems()}
                className="velica-sidebar-menu"
              />
            </div>
            <div className="velica-sider-footer-collapsed">
              <Button
                type="text"
                onClick={() => setCollapsed(false)}
                icon={<ChevronRight size={17} className="text-muted-color" />}
                className="velica-sider-toggle-btn"
              />
            </div>
          </div>
        ) : (
          <div className="velica-sider-inner">
            {sidebarContent}
            <div className="velica-sider-footer">
              <Button
                type="text"
                onClick={() => setCollapsed(true)}
                icon={<ChevronLeft size={17} className="text-muted-color" />}
                className="velica-sider-toggle-btn"
              >
                Thu gọn menu
              </Button>
            </div>
          </div>
        )}
      </Sider>

      {/* Mobile Drawer Navigation (Visible on mobile/tablet < 992px) */}
      <Drawer
        placement="left"
        closable={false}
        onClose={() => setMobileDrawerOpen(false)}
        open={mobileDrawerOpen}
        width={240}
        styles={{ body: { padding: 0 } }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main App Layout */}
      <Layout className="velica-layout-main">
        {/* Top Header - Modern SaaS Navbar */}
        <Header className="velica-top-header">
          {/* Left: Mobile Toggle + Page Title + Count Pill */}
          <div className="velica-header-start">
            <Button
              type="text"
              className="d-lg-none velica-header-toggle-btn"
              icon={<MenuIcon size={20} className="text-brand-color" />}
              onClick={() => setMobileDrawerOpen(true)}
            />

            <span className="velica-header-page-title">
              {pageInfo.title}
            </span>
          </div>



          {/* Right: Quick Role Switcher (Segmented) + Reset + Profile */}
          <div className="velica-header-end">
            <Segmented
              size="small"
              value={activeRole}
              onChange={(val) => handleRoleChange(val as UserRole)}
              options={[
                { label: 'Giảng viên', value: ROLE.TEACHER },
                { label: 'Sinh viên', value: ROLE.STUDENT },
                { label: 'Admin', value: ROLE.ADMIN },
              ]}
            />
            {/* Reset Data Button */}
            <Tooltip title="Khôi phục dữ liệu mẫu ban đầu">
              <Button
                type="text"
                size="small"
                onClick={handleResetData}
                icon={<RotateCcw size={15} />}
                className="velica-header-reset-btn"
              >
                <span className="d-none d-xl-inline ms-1">Reset</span>
              </Button>
            </Tooltip>

            {/* Interactive Notification Popover */}
            <Popover
              content={notificationContent}
              trigger="click"
              placement="bottomRight"
              open={notifOpen}
              onOpenChange={setNotifOpen}
            >
              <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                <div className="velica-header-notif-btn">
                  <Bell size={16} />
                </div>
              </Badge>
            </Popover>

            {/* Profile Dropdown */}
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <div className="velica-header-user-btn" title={currentUser.fullName}>
                <Avatar className="velica-header-avatar">
                  {currentUser.fullName.split(' ').pop()?.[0] || 'U'}
                </Avatar>
                <span className="velica-header-user-name">
                  {currentUser.fullName}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content canvas - Responsive padding */}
        <Content className="velica-layout-content">
          <Outlet />
        </Content>
      </Layout>

      {/* Notification Full Content Preview Modal */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <div
              className={`velica-notif-icon-box ${
                previewNotif?.type === 'PROCTOR'
                  ? 'velica-notif-icon-proctor'
                  : previewNotif?.type === 'APPEAL'
                  ? 'velica-notif-icon-appeal'
                  : previewNotif?.type === 'SUBMISSION'
                  ? 'velica-notif-icon-submission'
                  : 'velica-notif-icon-system'
              }`}
            >
              {previewNotif?.type === 'PROCTOR' ? (
                <AlertTriangle size={16} />
              ) : previewNotif?.type === 'APPEAL' ? (
                <ShieldCheck size={16} />
              ) : previewNotif?.type === 'SUBMISSION' ? (
                <FileCheck2 size={16} />
              ) : (
                <Bell size={16} />
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-primary-color">{previewNotif?.title}</div>
              <div className="text-xs text-muted-color">{previewNotif?.time}</div>
            </div>
          </div>
        }
        open={Boolean(previewNotif)}
        onCancel={() => setPreviewNotif(null)}
        footer={[
          <Button key="close" onClick={() => setPreviewNotif(null)}>
            Đóng
          </Button>,
          previewNotif?.targetPath ? (
            <Button
              key="action"
              type="primary"
              className="velica-btn-primary"
              onClick={() => {
                const target = previewNotif.targetPath;
                setPreviewNotif(null);
                navigate(target);
              }}
            >
              Đi tới trang xử lý &rarr;
            </Button>
          ) : null,
        ]}
      >
        <div className="py-2">
          <div className="d-flex items-center gap-2 mb-3">
            <Tag
              color={
                previewNotif?.type === 'PROCTOR'
                  ? 'error'
                  : previewNotif?.type === 'APPEAL'
                  ? 'purple'
                  : previewNotif?.type === 'SUBMISSION'
                  ? 'blue'
                  : 'default'
              }
            >
              {previewNotif?.type === 'PROCTOR'
                ? 'Cảnh báo Giám sát thi'
                : previewNotif?.type === 'APPEAL'
                ? 'Đơn Phúc khảo điểm'
                : previewNotif?.type === 'SUBMISSION'
                ? 'Bài nộp & Điểm số'
                : 'Thông báo Hệ thống'}
            </Tag>
            <span className="text-xs text-muted-color">Trạng thái: Đã đọc</span>
          </div>

          <div className="p-3 bg-light rounded-2 border text-sm text-primary-color lh-base">
            {previewNotif?.description}
          </div>
        </div>
      </Modal>

      {/* All Notifications Modal for Students & Teachers */}
      <Modal
        title={
          <div className="d-flex items-center gap-2">
            <Bell size={18} className="text-brand-color" />
            <span className="font-bold text-base">Toàn bộ Thông báo Hệ thống</span>
            {unreadCount > 0 && <Tag color="error">{unreadCount} tin mới</Tag>}
          </div>
        }
        open={allNotifsModalOpen}
        onCancel={() => setAllNotifsModalOpen(false)}
        footer={[
          <Button key="readAll" onClick={handleMarkAllRead}>
            Đánh dấu đã đọc tất cả
          </Button>,
          <Button key="close" type="primary" onClick={() => setAllNotifsModalOpen(false)} className="velica-btn-primary">
            Đóng
          </Button>,
        ]}
        width={680}
        bodyStyle={{ maxHeight: 'calc(75vh - 100px)', overflowY: 'auto' }}
      >
        <div className="d-flex flex-col gap-2 py-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                setAllNotifsModalOpen(false);
                handleNotificationClick(n);
              }}
              className={`p-3 border rounded-2 cursor-pointer transition-all hover:border-brand-color ${
                !n.read ? 'bg-orange-50 border-orange-200' : 'bg-white'
              }`}
            >
              <div className="d-flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm text-primary-color">{n.title}</span>
                <span className="text-2xs text-muted-color">{n.time}</span>
              </div>
              <p className="text-xs text-secondary-color mb-2 leading-relaxed">{n.description}</p>
              <div className="d-flex items-center justify-between text-2xs">
                <Tag
                  color={
                    n.type === 'PROCTOR'
                      ? 'error'
                      : n.type === 'APPEAL'
                      ? 'purple'
                      : n.type === 'SUBMISSION'
                      ? 'blue'
                      : 'default'
                  }
                  className="m-0"
                >
                  {n.type}
                </Tag>
                {n.targetPath && (
                  <span className="text-brand-color font-semibold">Xem chi tiết &rarr;</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Global Spotlight Command Search Modal */}
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        activeRole={activeRole}
      />
    </Layout>
  );
};

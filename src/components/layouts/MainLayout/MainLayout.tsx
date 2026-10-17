import React, { useState, useEffect, useMemo } from 'react';
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
import { ErrorBoundary } from '../../ErrorBoundary';
import logoImg from '../../../assets/logo.png';

const { Header, Sider, Content } = Layout;

export interface NavItemConfig {
  key: string;
  title: string;
  icon: React.ReactNode;
  defaultPath: string;
  children?: { key: string; label: string; to: string }[];
}

export const getNavConfig = (activeRole: UserRole): NavItemConfig[] => {
  if (activeRole === ROLE.ADMIN) {
    return [
      {
        key: ROUTE_PATHS.ADMIN.DASHBOARD,
        title: 'Tổng quan hệ thống',
        icon: <LayoutDashboard size={18} />,
        defaultPath: ROUTE_PATHS.ADMIN.DASHBOARD,
      },
      {
        key: 'sub-admin-users',
        title: 'Người dùng & Vai trò',
        icon: <Users size={18} />,
        defaultPath: ROUTE_PATHS.ADMIN.USERS,
        children: [
          { key: ROUTE_PATHS.ADMIN.USERS, label: 'Quản lý người dùng', to: ROUTE_PATHS.ADMIN.USERS },
          { key: ROUTE_PATHS.ADMIN.ROLES, label: 'Quản lý vai trò (Roles)', to: ROUTE_PATHS.ADMIN.ROLES },
        ],
      },
      {
        key: 'sub-admin-ops',
        title: 'Vận hành hệ thống',
        icon: <Settings size={18} />,
        defaultPath: ROUTE_PATHS.ADMIN.MAINTENANCE,
        children: [
          { key: ROUTE_PATHS.ADMIN.MAINTENANCE, label: 'Chế độ bảo trì', to: ROUTE_PATHS.ADMIN.MAINTENANCE },
          { key: ROUTE_PATHS.ADMIN.AUDIT_LOGS, label: 'Nhật ký & Thanh tra điểm', to: ROUTE_PATHS.ADMIN.AUDIT_LOGS },
        ],
      },
    ];
  }

  if (activeRole === ROLE.TEACHER) {
    return [
      {
        key: 'sub-teacher-academics',
        title: 'Giảng dạy & Lớp học',
        icon: <GraduationCap size={18} />,
        defaultPath: ROUTE_PATHS.TEACHER.CLASSES,
        children: [
          { key: ROUTE_PATHS.TEACHER.CLASSES, label: 'Quản lý lớp học', to: ROUTE_PATHS.TEACHER.CLASSES },
          { key: ROUTE_PATHS.TEACHER.SYLLABUS, label: 'Đề cương môn học (Syllabus)', to: ROUTE_PATHS.TEACHER.SYLLABUS },
          { key: ROUTE_PATHS.TEACHER.LESSONS, label: 'Chủ đề theo Đề cương', to: ROUTE_PATHS.TEACHER.LESSONS },
        ],
      },
      {
        key: 'sub-teacher-bank',
        title: 'Ngân hàng Khảo thí',
        icon: <ClipboardList size={18} />,
        defaultPath: ROUTE_PATHS.TEACHER.QUESTION_BANK,
        children: [
          { key: ROUTE_PATHS.TEACHER.QUESTION_BANK, label: 'Ngân hàng câu hỏi', to: ROUTE_PATHS.TEACHER.QUESTION_BANK },
          { key: ROUTE_PATHS.TEACHER.RUBRICS, label: 'Tiêu chí Rubric tự luận', to: ROUTE_PATHS.TEACHER.RUBRICS },
        ],
      },
      {
        key: 'sub-teacher-exams',
        title: 'Kỳ thi & Chấm bài',
        icon: <FileCheck2 size={18} />,
        defaultPath: ROUTE_PATHS.TEACHER.ASSESSMENTS,
        children: [
          { key: ROUTE_PATHS.TEACHER.ASSESSMENTS, label: 'Đề thi & Đánh giá', to: ROUTE_PATHS.TEACHER.ASSESSMENTS },
          { key: ROUTE_PATHS.TEACHER.GRADING_QUEUE, label: 'Hàng đợi chấm tự luận', to: ROUTE_PATHS.TEACHER.GRADING_QUEUE },
          { key: ROUTE_PATHS.TEACHER.GRADE_APPEALS, label: 'Xử lý đơn phúc khảo', to: ROUTE_PATHS.TEACHER.GRADE_APPEALS },
        ],
      },
    ];
  }

  // Student
  return [
    {
      key: ROUTE_PATHS.STUDENT.CLASSES,
      title: 'Lớp học phần của tôi',
      icon: <GraduationCap size={18} />,
      defaultPath: ROUTE_PATHS.STUDENT.CLASSES,
    },
    {
      key: ROUTE_PATHS.STUDENT.ASSESSMENTS,
      title: 'Bài thi & Kiểm tra',
      icon: <FileCheck2 size={18} />,
      defaultPath: ROUTE_PATHS.STUDENT.ASSESSMENTS,
    },
    {
      key: ROUTE_PATHS.STUDENT.GRADE_REVIEWS,
      title: 'Đơn phúc khảo điểm',
      icon: <FileText size={18} />,
      defaultPath: ROUTE_PATHS.STUDENT.GRADE_REVIEWS,
    },
  ];
};



export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('velica_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('velica_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>(mockService.getCurrentRole());

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

  const currentUser = mockService.getCurrentUser();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  const pageInfo = useMemo(() => {
    const p = location.pathname;
    if (p.includes('/admin/users')) return { title: 'Quản lý Người dùng', count: '1,240' };
    if (p.includes('/admin/roles')) return { title: 'Quản lý Vai trò (Roles)', count: 'Roles' };
    if (p.includes('/admin/stats')) return { title: 'Thống kê Toàn trường', count: '2026' };
    if (p.includes('/admin/audit-logs')) return { title: 'Nhật ký & Thanh tra Điểm số', count: 'Audit' };
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
  }, [location.pathname, activeRole]);

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
  if (p.includes('/teacher/classes') || p.includes('/teacher/syllabus') || p.includes('/teacher/lessons') || p.includes('/teacher/syllabi')) {
    keys.push('sub-teacher-academics');
  }
  if (p.includes('/teacher/question-bank') || p.includes('/teacher/question-levels') || p.includes('/teacher/rubrics')) {
    keys.push('sub-teacher-bank');
  }
  if (p.includes('/teacher/assessments') || p.includes('/teacher/grading') || p.includes('/teacher/appeals') || p.includes('/teacher/submissions')) {
    keys.push('sub-teacher-exams');
  }
  if (p.includes('/admin/users') || p.includes('/admin/roles')) {
    keys.push('sub-admin-users');
  }
  if (p.includes('/admin/stats') || p.includes('/admin/audit') || p.includes('/admin/maintenance')) {
    keys.push('sub-admin-ops');
  }
  return keys;
};

  const getSelectedKeys = (): string[] => {
    const p = location.pathname;
    if (p.startsWith('/teacher/classes')) return [ROUTE_PATHS.TEACHER.CLASSES];
    if (p.startsWith('/teacher/syllabus') || p.startsWith('/teacher/syllabi')) return [ROUTE_PATHS.TEACHER.SYLLABUS];
    if (p.startsWith('/teacher/lessons')) return [ROUTE_PATHS.TEACHER.LESSONS];
    if (p.startsWith('/teacher/question-bank')) return [ROUTE_PATHS.TEACHER.QUESTION_BANK];
    if (p.startsWith('/teacher/rubrics')) return [ROUTE_PATHS.TEACHER.RUBRICS];
    if (p.includes('/grading') || p.includes('/submissions/')) return [ROUTE_PATHS.TEACHER.GRADING_QUEUE];
    if (p.includes('/appeals')) return [ROUTE_PATHS.TEACHER.GRADE_APPEALS];
    if (p.startsWith('/teacher/assessments')) return [ROUTE_PATHS.TEACHER.ASSESSMENTS];
    if (p.startsWith('/student/classes')) return [ROUTE_PATHS.STUDENT.CLASSES];
    if (p.startsWith('/student/assessments') || p.startsWith('/student/results')) return [ROUTE_PATHS.STUDENT.ASSESSMENTS];
    if (p.startsWith('/student/grade-reviews')) return [ROUTE_PATHS.STUDENT.GRADE_REVIEWS];
    if (p.startsWith('/admin/users')) return [ROUTE_PATHS.ADMIN.USERS];
    if (p.startsWith('/admin/roles')) return [ROUTE_PATHS.ADMIN.ROLES];
    if (p.startsWith('/admin/maintenance')) return [ROUTE_PATHS.ADMIN.MAINTENANCE];
    if (p.startsWith('/admin/audit-logs')) return [ROUTE_PATHS.ADMIN.AUDIT_LOGS];
    if (p.startsWith('/admin/dashboard')) return [ROUTE_PATHS.ADMIN.DASHBOARD];
    return [p];
  };

  const [openKeys, setOpenKeys] = useState<string[]>(() => getOpenKeysForPath(location.pathname));

  useEffect(() => {
    if (!collapsed) {
      const autoKeys = getOpenKeysForPath(location.pathname);
      setOpenKeys((prev) => Array.from(new Set([...prev, ...autoKeys])));
    } else {
      setOpenKeys([]);
    }
  }, [location.pathname, collapsed]);

  const navConfig = useMemo(() => getNavConfig(activeRole), [activeRole]);

  const menuItems = useMemo(() => {
    return navConfig.map((group) => {
      if (group.children && group.children.length > 0) {
        return {
          key: group.key,
          icon: group.icon,
          label: (
            <span className="text-truncate d-block font-semibold">
              {group.title}
            </span>
          ),
          children: group.children.map((sub) => ({
            key: sub.key,
            label: (
              <Link to={sub.to} className="text-truncate d-block">
                {sub.label}
              </Link>
            ),
          })),
        };
      }
      return {
        key: group.key,
        icon: group.icon,
        label: (
          <Link to={group.defaultPath} className="text-truncate d-block font-medium">
            {group.title}
          </Link>
        ),
      };
    });
  }, [navConfig]);

  const userMenu = useMemo(
    () => ({
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
    }),
    [currentUser.fullName, currentUser.email, navigate]
  );

  const sidebarContent = (
    <div className="velica-sider-inner">
      {/* Brand & Logo Header */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Về trang chủ Velica"
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(
              activeRole === ROLE.ADMIN
                ? ROUTE_PATHS.ADMIN.DASHBOARD
                : activeRole === ROLE.STUDENT
                ? ROUTE_PATHS.STUDENT.CLASSES
                : ROUTE_PATHS.TEACHER.CLASSES
            );
          }
        }}
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
          theme="light"
          selectedKeys={getSelectedKeys()}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys)}
          onClick={({ key }) => {
            if (key && !key.startsWith('sub-')) {
              navigate(key);
              setMobileDrawerOpen(false);
            }
          }}
          items={menuItems}
          className="velica-sidebar-menu"
        />
      </div>
    </div>
  );



  return (
    <Layout hasSider className="velica-layout-root">
      {/* Desktop Sider */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(c) => {
          setCollapsed(c);
          try {
            localStorage.setItem('velica_sidebar_collapsed', String(c));
          } catch {}
        }}
        trigger={null}
        width={220}
        collapsedWidth={64}
        theme="light"
        className="velica-sider-desktop"
      >
        <div className="velica-sider-inner">
          {/* Brand & Logo Header */}
          <div
            className={collapsed ? "velica-sider-header-collapsed cursor-pointer" : "velica-sider-header cursor-pointer"}
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
            {collapsed ? (
              <img src={logoImg} alt="Velica" className="velica-sider-logo-collapsed" />
            ) : (
              <>
                <div className="velica-sider-brand-badge">
                  <img src={logoImg} alt="Velica" className="velica-sider-logo-img" />
                </div>
                <div className="d-flex flex-col flex-1 overflow-hidden">
                  <span className="velica-sider-brand-title">Velica</span>
                  <span className="velica-sider-brand-sub">Academic Assessment</span>
                </div>
              </>
            )}
          </div>

          {/* Navigation Menu */}
          <div className="velica-sider-menu-wrapper w-100">
            {collapsed ? (
              <div className="velica-collapsed-nav-list">
                {navConfig.map((group) => {
                  const isGroupActive = group.children
                    ? group.children.some((sub) => location.pathname.startsWith(sub.to))
                    : location.pathname.startsWith(group.defaultPath);

                  if (group.children && group.children.length > 0) {
                    return (
                      <Popover
                        key={group.key}
                        placement="rightTop"
                        trigger="hover"
                        overlayClassName="velica-collapsed-popover-overlay"
                        mouseEnterDelay={0.08}
                        mouseLeaveDelay={0.15}
                        content={
                          <div className="velica-collapsed-popover-menu">
                            <div className="velica-collapsed-popover-header">
                              {group.title}
                            </div>
                            <div className="velica-collapsed-popover-list">
                              {group.children.map((sub) => {
                                const isSubActive = location.pathname.startsWith(sub.to);
                                return (
                                  <Link
                                    key={sub.key}
                                    to={sub.to}
                                    className={`velica-collapsed-popover-item ${isSubActive ? 'active' : ''}`}
                                  >
                                    <span className="velica-collapsed-popover-item-dot" />
                                    <span>{sub.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        }
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={group.title}
                          className={`velica-collapsed-icon-btn ${isGroupActive ? 'active' : ''}`}
                          onClick={() => navigate(group.defaultPath)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              navigate(group.defaultPath);
                            }
                          }}
                        >
                          {group.icon}
                        </div>
                      </Popover>
                    );
                  }

                  return (
                    <Tooltip key={group.key} placement="right" title={group.title}>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={group.title}
                        className={`velica-collapsed-icon-btn ${isGroupActive ? 'active' : ''}`}
                        onClick={() => navigate(group.defaultPath)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(group.defaultPath);
                          }
                        }}
                      >
                        {group.icon}
                      </div>
                    </Tooltip>
                  );
                })}
              </div>
            ) : (
              <Menu
                mode="inline"
                theme="light"
                selectedKeys={[location.pathname]}
                openKeys={openKeys}
                onOpenChange={(keys) => setOpenKeys(keys)}
                items={menuItems}
                className="velica-sidebar-menu"
              />
            )}
          </div>

          {/* Footer Toggle Button */}
          <div className={collapsed ? "velica-sider-footer-collapsed" : "velica-sider-footer"}>
            <Button
              type="text"
              onClick={toggleSidebarCollapse}
              icon={
                collapsed ? (
                  <ChevronRight size={17} className="text-muted-color" />
                ) : (
                  <ChevronLeft size={17} className="text-muted-color" />
                )
              }
              className="velica-sider-toggle-btn"
              title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              {!collapsed && 'Thu gọn menu'}
            </Button>
          </div>
        </div>
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

            {/* Profile Dropdown */}
            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <div
                role="button"
                tabIndex={0}
                aria-label={`Tài khoản: ${currentUser.fullName}`}
                className="velica-header-user-btn"
                title={currentUser.fullName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    (e.currentTarget as HTMLElement).click();
                  }
                }}
              >
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
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Content>
      </Layout>

      {/* Global Spotlight Command Search Modal */}
      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        activeRole={activeRole}
      />
    </Layout>
  );
};

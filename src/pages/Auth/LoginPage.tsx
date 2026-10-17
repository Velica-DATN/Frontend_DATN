import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Checkbox, Modal, Alert } from 'antd';
import {
  Lock,
  User,
  ArrowRight,
  GraduationCap,
  Users,
  ShieldCheck,
  Check,
  Clock,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { mockService } from '../../api/mocks/mockService';
import { ROLE, UserRole, ROLE_LABELS } from '../../constants/roleConstants';
import { ROUTE_PATHS } from '../../router/constants/routePaths';
import { AuthHeroPane } from './components/AuthHeroPane';

const { Title, Paragraph } = Typography;

// Demo account presets
const ROLE_PRESETS: Record<
  UserRole,
  { name: string; email: string; title: string; subtitle: string; icon: React.ReactNode }
> = {
  [ROLE.TEACHER]: {
    name: 'TS. Nguyễn Văn An',
    email: 'an.nguyen@velica.edu.vn',
    title: 'Giảng viên',
    subtitle: 'Khoa Công nghệ Thông tin • Bộ môn KTPM',
    icon: <GraduationCap size={16} />,
  },
  [ROLE.STUDENT]: {
    name: 'Lê Hoàng Nam',
    email: 'nam.lh@velica.edu.vn',
    title: 'Sinh viên',
    subtitle: 'Sinh viên chính quy • Khoa Công nghệ Thông tin',
    icon: <Users size={16} />,
  },
  [ROLE.ADMIN]: {
    name: 'ThS. Trần Thị Mai',
    email: 'mai.tran@velica.edu.vn',
    title: 'Quản trị viên',
    subtitle: 'Phòng Khảo thí & Đảm bảo Chất lượng',
    icon: <ShieldCheck size={16} />,
  },
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(ROLE.TEACHER);
  const [activeTab, setActiveTab] = useState<'academic' | 'admin'>('academic');
  const [form] = Form.useForm();

  // Status Modals
  const [pendingModalVisible, setPendingModalVisible] = useState(false);
  const [rejectedModalVisible, setRejectedModalVisible] = useState(false);
  const [suspendedModalVisible, setSuspendedModalVisible] = useState(false);
  const [blockedAccountInfo, setBlockedAccountInfo] = useState<{
    fullName: string;
    email: string;
    reason?: string;
  }>({ fullName: '', email: '' });

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    if (role === ROLE.ADMIN) {
      setActiveTab('admin');
    } else {
      setActiveTab('academic');
    }
    form.setFieldsValue({
      username: ROLE_PRESETS[role].email,
      password: 'password123',
    });
  };

  const handleTabChange = (tab: 'academic' | 'admin') => {
    setActiveTab(tab);
    if (tab === 'admin') {
      setSelectedRole(ROLE.ADMIN);
      form.setFieldsValue({
        username: ROLE_PRESETS[ROLE.ADMIN].email,
        password: 'password123',
      });
    } else {
      setSelectedRole(ROLE.TEACHER);
      form.setFieldsValue({
        username: ROLE_PRESETS[ROLE.TEACHER].email,
        password: 'password123',
      });
    }
  };

  const executeLoginNavigation = (role: UserRole) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success(`Đăng nhập thành công với vai trò: ${ROLE_LABELS[role]}!`);
      if (role === ROLE.ADMIN) {
        navigate(ROUTE_PATHS.ADMIN.DASHBOARD);
      } else if (role === ROLE.TEACHER) {
        navigate(ROUTE_PATHS.TEACHER.CLASSES);
      } else {
        navigate(ROUTE_PATHS.STUDENT.CLASSES);
      }
    }, 350);
  };

  const handleLogin = async (role: UserRole = selectedRole) => {
    const userEmail = ROLE_PRESETS[role].email;
    try {
      setLoading(true);
      const res = await mockService.login({
        usernameOrEmail: userEmail,
        password: 'password123',
      });
      setLoading(false);
      if (res.status === 'PENDING') {
        setBlockedAccountInfo({ fullName: res.user.fullName, email: res.user.email });
        setPendingModalVisible(true);
        return;
      }
      if (res.status === 'REJECTED') {
        setBlockedAccountInfo({
          fullName: res.user.fullName,
          email: res.user.email,
          reason: res.reason || 'Thông tin tài khoản không khớp với dữ liệu tuyển sinh.',
        });
        setRejectedModalVisible(true);
        return;
      }
      if (res.status === 'SUSPENDED') {
        setBlockedAccountInfo({
          fullName: res.user.fullName,
          email: res.user.email,
          reason: res.reason || 'Tài khoản đang bị tạm khóa.',
        });
        setSuspendedModalVisible(true);
        return;
      }
      executeLoginNavigation(res.role);
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Đăng nhập không thành công.');
    }
  };

  const handleCustomSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const res = await mockService.login({
        usernameOrEmail: values.username,
        password: values.password,
      });
      setLoading(false);
      if (res.status === 'PENDING') {
        setBlockedAccountInfo({ fullName: res.user.fullName, email: res.user.email });
        setPendingModalVisible(true);
        return;
      }
      if (res.status === 'REJECTED') {
        setBlockedAccountInfo({
          fullName: res.user.fullName,
          email: res.user.email,
          reason: res.reason || 'Thông tin tài khoản không khớp với dữ liệu tuyển sinh.',
        });
        setRejectedModalVisible(true);
        return;
      }
      if (res.status === 'SUSPENDED') {
        setBlockedAccountInfo({
          fullName: res.user.fullName,
          email: res.user.email,
          reason: res.reason || 'Tài khoản đang bị tạm khóa.',
        });
        setSuspendedModalVisible(true);
        return;
      }
      executeLoginNavigation(res.role);
    } catch (err: any) {
      setLoading(false);
      message.error(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="velica-auth-page-container">
      {/* Left Pane: Clean Hero Presentation with Large Logo */}
      <AuthHeroPane
        description="Nền tảng quản lý và tổ chức thi trực tuyến tích hợp, giúp sinh viên và giảng viên kết nối hiệu quả trong lộ trình đánh giá học thuật tại Velica."
      />

      {/* Right Pane: Clean White Form Pane */}
      <div className="velica-auth-form-pane">
        {/* Top Role / Tab Switcher */}
        <div className="velica-auth-tabs-row">
          <button
            type="button"
            className={`velica-auth-tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
            onClick={() => handleTabChange('academic')}
          >
            Sinh viên / Giảng viên
          </button>
          <button
            type="button"
            className={`velica-auth-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            Quản trị viên
          </button>
        </div>

        {/* Form Body Container */}
        <div className="velica-auth-form-content">
          <div className="velica-auth-title-section">
            <Title level={2} className="velica-auth-main-heading">
              Đăng nhập hệ thống
            </Title>
            <Paragraph className="velica-auth-main-subheading">
              Chọn vai trò để đăng nhập nhanh hoặc nhập thông tin tài khoản trường:
            </Paragraph>
          </div>

          {/* Quick Role Selection Buttons */}
          <div className="velica-auth-roles-selection-row">
            {(['TEACHER', 'STUDENT', 'ADMIN'] as UserRole[]).map((role) => {
              const isSelected = selectedRole === role;
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className={`velica-auth-role-pill-btn ${isSelected ? 'active' : ''}`}
                >
                  <span className="velica-auth-role-pill-icon">{ROLE_PRESETS[role].icon}</span>
                  <span>{ROLE_PRESETS[role].title}</span>
                  {isSelected && <Check size={14} className="ms-1 text-teal-600" />}
                </button>
              );
            })}
          </div>

          {/* Current Selected Role Account Preview */}
          <div className="velica-auth-active-account-preview">
            <div className="velica-auth-preview-badge">
              <span className="velica-auth-preview-dot" />
              <span className="font-semibold text-slate-800">{ROLE_PRESETS[selectedRole].name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 text-xs">{ROLE_PRESETS[selectedRole].subtitle}</span>
            </div>
          </div>

          {/* Standard Form Inputs */}
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCustomSubmit}
            requiredMark={false}
            className="velica-auth-form"
            initialValues={{
              username: ROLE_PRESETS[selectedRole].email,
              password: 'password123',
            }}
          >
            <Form.Item
              name="username"
              label={<span className="velica-form-label">Tên đăng nhập hoặc Email trường</span>}
              rules={[{ required: true, message: 'Vui lòng nhập email hoặc tên đăng nhập' }]}
            >
              <Input
                size="large"
                prefix={<User size={17} className="text-slate-400 me-2" />}
                placeholder="Vd: an.nguyen@velica.edu.vn"
                className="velica-auth-input"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<span className="velica-form-label">Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
            >
              <Input.Password
                size="large"
                prefix={<Lock size={17} className="text-slate-400 me-2" />}
                placeholder="Nhập mật khẩu..."
                className="velica-auth-input"
              />
            </Form.Item>

            <div className="d-flex items-center justify-between mb-3 text-xs">
              <Checkbox defaultChecked className="text-slate-600">
                Ghi nhớ đăng nhập
              </Checkbox>
              <button
                type="button"
                className="velica-auth-link-btn"
                onClick={() => navigate(ROUTE_PATHS.AUTH.FORGOT_PASSWORD)}
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Primary Action Button */}
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              icon={<ArrowRight size={17} />}
              className="velica-auth-cta-btn"
            >
              Đăng nhập với tài khoản Velica
            </Button>
            <div className="velica-auth-btn-caption">
              Cổng đăng nhập học thuật tập trung dành cho toàn bộ giảng viên & sinh viên
            </div>
          </Form>
        </div>

        {/* Bottom Section */}
        <div className="velica-auth-bottom-section">
          <div className="velica-auth-signup-footer">
            <span className="text-slate-500">Chưa có tài khoản sinh viên? </span>
            <Link to={ROUTE_PATHS.AUTH.REGISTER} className="velica-auth-switch-link">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>

      {/* Modal: PENDING Account Notification */}
      <Modal
        title={
          <div className="d-flex items-center gap-2 text-amber-600">
            <Clock size={20} />
            <span className="font-bold text-slate-800">Tài khoản đang Chờ duyệt (PENDING)</span>
          </div>
        }
        open={pendingModalVisible}
        onCancel={() => setPendingModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setPendingModalVisible(false)}>
            Tôi đã hiểu
          </Button>,
        ]}
      >
        <div className="py-2 text-xs leading-relaxed text-slate-600 space-y-2">
          <p className="mb-2">
            Chào <strong>{blockedAccountInfo.fullName}</strong> ({blockedAccountInfo.email}),
          </p>
          <Alert
            type="warning"
            showIcon
            message="Đang chờ Quản trị viên xét duyệt"
            description="Tài khoản của bạn đã được xác minh email thành công nhưng chưa được Ban Quản trị phê duyệt. Vui lòng quay lại sau khi nhà trường hoàn tất đối soát hồ sơ học tập."
          />
          <p className="text-slate-500 mt-2 mb-0">
            Nếu cần gấp để tham gia kỳ thi đang diễn ra, bạn có thể liên hệ trực tiếp với Phòng Đào tạo (P.A102) hoặc Hotline Khảo thí.
          </p>
        </div>
      </Modal>

      {/* Modal: REJECTED Account Notification with Reason & Resolution */}
      <Modal
        title={
          <div className="d-flex items-center gap-2 text-rose-600">
            <XCircle size={20} />
            <span className="font-bold text-slate-800">Tài khoản bị Từ chối duyệt (REJECTED)</span>
          </div>
        }
        open={rejectedModalVisible}
        onCancel={() => setRejectedModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setRejectedModalVisible(false)}>
            Đóng
          </Button>,
          <Button
            key="reregister"
            type="primary"
            className="bg-teal-700 hover:bg-teal-800 text-white"
            onClick={() => {
              setRejectedModalVisible(false);
              navigate(ROUTE_PATHS.AUTH.REGISTER);
            }}
          >
            Đăng ký lại
          </Button>,
        ]}
      >
        <div className="py-2 text-xs leading-relaxed text-slate-600 space-y-3">
          <p className="mb-2">
            Chào <strong>{blockedAccountInfo.fullName}</strong>, yêu cầu đăng ký tài khoản cho email{' '}
            <strong className="font-mono">{blockedAccountInfo.email}</strong> đã bị Quản trị viên từ chối.
          </p>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md">
            <div className="font-semibold text-rose-900 mb-1">
              Lý do từ chối từ Quản trị viên:
            </div>
            <div className="text-rose-800 font-medium">
              "{blockedAccountInfo.reason}"
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
            <div className="font-semibold text-slate-800">
              Hướng dẫn xử lý cho Sinh viên:
            </div>
            <div className="text-slate-600">
              • Vui lòng kiểm tra lại thông tin họ tên, email trường theo đúng giấy báo nhập học.
            </div>
            <div className="text-slate-600">
              • Bạn có thể nhấn <strong>"Đăng ký lại"</strong> để cập nhật thông tin chính xác.
            </div>
            <div className="text-slate-600">
              • Hoặc liên hệ Văn phòng Đào tạo (P.A102) nếu cho rằng đây là sự nhầm lẫn.
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal: SUSPENDED Account Notification */}
      <Modal
        title={
          <div className="d-flex items-center gap-2 text-purple-600">
            <AlertTriangle size={20} />
            <span className="font-bold text-slate-800">Tài khoản đang bị Tạm khóa (SUSPENDED)</span>
          </div>
        }
        open={suspendedModalVisible}
        onCancel={() => setSuspendedModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setSuspendedModalVisible(false)}>
            Đã hiểu
          </Button>,
        ]}
      >
        <div className="py-2 text-xs leading-relaxed text-slate-600 space-y-3">
          <p className="mb-2">
            Tài khoản của <strong>{blockedAccountInfo.fullName}</strong> ({blockedAccountInfo.email}) đang ở trạng thái TẠM KHÓA.
          </p>

          <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
            <div className="font-semibold text-purple-900 mb-1">Lý do tạm khóa:</div>
            <div className="text-purple-800 font-medium">"{blockedAccountInfo.reason}"</div>
          </div>

          <p className="text-slate-500 mb-0">
            Vui lòng liên hệ Hội đồng Khảo thí hoặc Quản trị viên hệ thống để thực hiện các thủ tục giải trình và mở khóa tài khoản.
          </p>
        </div>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import { Card, Typography, Switch, Input, Button, Alert, message, Tag } from 'antd';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { mockService } from '../../../api/mocks/mockService';

const { Title, Text } = Typography;

export const MaintenanceMode: React.FC = () => {
  const [enabled, setEnabled] = useState(mockService.isMaintenanceMode());
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'Hệ thống khảo thí Velica đang được nâng cấp bảo trì định kỳ. Quý Thầy/Cô và các bạn Sinh viên vui lòng quay lại sau 30 phút.'
  );

  const handleToggle = async (checked: boolean) => {
    await mockService.setMaintenanceMode(checked);
    setEnabled(checked);
    message.success(
      checked
        ? 'Đã BẬT Chế độ Bảo trì thành công! Người dùng thông thường sẽ thấy màn hình thông báo.'
        : 'Đã TẮT Chế độ Bảo trì. Hệ thống mở lại bình thường cho toàn bộ sinh viên và giảng viên.'
    );
  };

  const handleSaveMessage = () => {
    message.success('Đã lưu thông điệp bảo trì hệ thống!');
  };

  return (
    <div className="animate-fade-in velica-maintenance-wrapper">
      <div className="mb-4">
        <Title level={4} className="velica-page-title">
          Quản trị Chế độ Bảo trì Hệ thống
        </Title>
        <Text type="secondary" className="velica-page-desc">
          Tạm dừng truy cập của Sinh viên và Giảng viên trong thời gian nâng cấp cơ sở dữ liệu hoặc triển khai phiên bản mới.
        </Text>
      </div>

      <Card bordered className="velica-admin-card mb-4">
        <div className="d-flex items-center justify-between mb-4">
          <div>
            <div className="d-flex items-center gap-2">
              <span className="velica-cell-title fs-16">
                Kích hoạt Chế độ Bảo trì (Maintenance Mode)
              </span>
              {enabled ? (
                <Tag color="error" className="velica-tag-pill">ĐANG BẬT</Tag>
              ) : (
                <Tag color="success" className="velica-tag-pill">ĐANG TẮT</Tag>
              )}
            </div>
            <Text type="secondary" className="velica-cell-desc">
              Khi bật, chỉ tài khoản Quản trị viên (Admin) mới có quyền truy cập vào hệ thống.
            </Text>
          </div>

          <Switch
            checked={enabled}
            onChange={handleToggle}
            className={enabled ? 'bg-danger' : undefined}
          />
        </div>

        {enabled ? (
          <Alert
            message="Hệ thống đang trong chế độ bảo trì"
            description="Tất cả các phiên làm bài thi và truy cập từ sinh viên/giảng viên sẽ bị tạm hoãn cho đến khi tắt chế độ này."
            type="error"
            showIcon
            icon={<ShieldAlert size={20} />}
            className="mb-4 rounded-3"
          />
        ) : (
          <Alert
            message="Hệ thống hoạt động bình thường"
            description="Tất cả dịch vụ khảo thí, chấm bài và phòng thi trực tuyến đang sẵn sàng phục vụ."
            type="success"
            showIcon
            icon={<CheckCircle2 size={20} />}
            className="mb-4 rounded-3"
          />
        )}

        <div>
          <Text strong className="d-block mb-2 text-primary-color">
            Thông điệp hiển thị cho người dùng khi vào trang:
          </Text>
          <Input.TextArea
            rows={4}
            value={maintenanceMessage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            className="velica-form-input mb-3"
          />

          <Button
            type="primary"
            onClick={handleSaveMessage}
            className="velica-btn-primary"
          >
            Lưu thông điệp bảo trì
          </Button>
        </div>
      </Card>
    </div>
  );
};

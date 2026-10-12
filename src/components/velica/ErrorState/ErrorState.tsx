import React from 'react';
import { Button } from 'antd';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Đã xảy ra lỗi',
  message = 'Không thể tải dữ liệu từ máy chủ. Vui lòng thử lại.',
  onRetry,
}) => {
  return (
    <div className="velica-errorstate-container">
      <div className="velica-errorstate-icon-wrap">
        <AlertCircle size={24} />
      </div>
      <h3 className="velica-errorstate-title">
        {title}
      </h3>
      <p className={`velica-errorstate-message ${onRetry ? 'velica-errorstate-message-with-retry' : ''}`}>
        {message}
      </p>
      {onRetry && (
        <Button
          danger
          onClick={onRetry}
          icon={<RefreshCw size={14} />}
          className="velica-errorstate-retry-btn"
        >
          Thử lại
        </Button>
      )}
    </div>
  );
};

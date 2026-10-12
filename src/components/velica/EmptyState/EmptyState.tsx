import React from 'react';
import { Button } from 'antd';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description = 'Hiện chưa có mục nào trong danh sách này.',
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="velica-emptystate-container">
      <div className="velica-emptystate-icon-wrap">
        {icon || <Inbox size={28} />}
      </div>
      <h3 className="velica-emptystate-title">
        {title}
      </h3>
      <p className={`velica-emptystate-desc ${actionText ? 'velica-emptystate-desc-with-action' : ''}`}>
        {description}
      </p>
      {actionText && onAction && (
        <Button
          type="primary"
          onClick={onAction}
          className="velica-emptystate-btn"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
};

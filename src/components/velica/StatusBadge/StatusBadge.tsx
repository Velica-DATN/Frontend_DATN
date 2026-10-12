import React from 'react';

export type BadgeStatusType =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'GRADED'
  | 'PENDING'
  | 'PENDING_MANUAL'
  | 'AUTO_GRADED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED'
  | 'ACTIVE'
  | 'INACTIVE'
  | string;

interface StatusBadgeProps {
  status: BadgeStatusType;
  label?: string;
  size?: 'sm' | 'md';
}

interface StatusConfig {
  label: string;
  className: string;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  DRAFT: {
    label: 'Bản nháp',
    className: 'velica-badge-draft',
  },
  SCHEDULED: {
    label: 'Đã lên lịch',
    className: 'velica-badge-scheduled',
  },
  PUBLISHED: {
    label: 'Đã xuất bản',
    className: 'velica-badge-published',
  },
  IN_PROGRESS: {
    label: 'Đang diễn ra',
    className: 'velica-badge-in_progress',
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'velica-badge-completed',
  },
  GRADED: {
    label: 'Đã chấm điểm',
    className: 'velica-badge-graded',
  },
  AUTO_GRADED: {
    label: 'Chấm tự động',
    className: 'velica-badge-auto_graded',
  },
  PENDING: {
    label: 'Chờ xử lý',
    className: 'velica-badge-pending',
  },
  PENDING_MANUAL: {
    label: 'Chờ chấm tự luận',
    className: 'velica-badge-pending_manual',
  },
  APPROVED: {
    label: 'Đã duyệt',
    className: 'velica-badge-approved',
  },
  REJECTED: {
    label: 'Từ chối',
    className: 'velica-badge-rejected',
  },
  CLOSED: {
    label: 'Đã đóng',
    className: 'velica-badge-closed',
  },
  ACTIVE: {
    label: 'Hoạt động',
    className: 'velica-badge-active',
  },
  INACTIVE: {
    label: 'Không hoạt động',
    className: 'velica-badge-inactive',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  const normalizedKey = status.toUpperCase();
  const config = STATUS_CONFIGS[normalizedKey] || {
    label: status,
    className: 'velica-badge-draft',
  };

  const displayText = label || config.label;
  const isSm = size === 'sm';

  return (
    <span
      className={`velica-badge-pill ${isSm ? 'velica-badge-pill-sm' : 'velica-badge-pill-md'} ${config.className}`}
    >
      <span
        className={`velica-badge-dot-element ${isSm ? 'velica-badge-dot-sm' : 'velica-badge-dot-md'}`}
      />
      {displayText}
    </span>
  );
};

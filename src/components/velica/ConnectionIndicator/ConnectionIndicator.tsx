import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionIndicatorProps {
  status: 'ONLINE' | 'OFFLINE' | 'RECONNECTING';
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({ status }) => {
  const configs = {
    ONLINE: {
      label: 'Kết nối ổn định',
      className: 'velica-conn-online',
      icon: <Wifi size={14} />,
    },
    OFFLINE: {
      label: 'Mất kết nối — Lưu cục bộ',
      className: 'velica-conn-offline',
      icon: <WifiOff size={14} />,
    },
    RECONNECTING: {
      label: 'Đang kết nối lại...',
      className: 'velica-conn-reconnecting',
      icon: <Wifi size={14} />,
    },
  };

  const current = configs[status] || configs.ONLINE;

  return (
    <div className={`velica-conn-badge ${current.className}`}>
      {current.icon}
      <span>{current.label}</span>
    </div>
  );
};

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  subtext?: string;
  sparkline?: 'up' | 'down';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtext,
  sparkline,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`velica-stat-card ${onClick ? 'velica-stat-card-clickable' : ''}`}
    >
      <div className="velica-stat-top">
        <span className="velica-stat-title">{title}</span>
        {icon && <div className="velica-stat-icon-box">{icon}</div>}
      </div>

      <div className="velica-stat-body">
        <div className="velica-stat-value">{value}</div>
        {sparkline === 'up' && (
          <svg className="velica-stat-sparkline" width="44" height="18" viewBox="0 0 44 18" fill="none">
            <path d="M2 15L14 10L24 13L42 3" stroke="#12B76A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {sparkline === 'down' && (
          <svg className="velica-stat-sparkline" width="44" height="18" viewBox="0 0 44 18" fill="none">
            <path d="M2 3L14 8L24 5L42 15" stroke="#F04438" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {(trend || subtext) && (
        <div className="velica-stat-footer">
          {trend && (
            <span
              className={`velica-stat-trend ${
                trend.isPositive ? 'velica-stat-trend-pos' : 'velica-stat-trend-neg'
              }`}
            >
              {trend.isPositive ? '↗' : '↘'} {trend.value}
            </span>
          )}
          <span className="velica-stat-subtext">{trend?.label || subtext}</span>
        </div>
      )}
    </div>
  );
};

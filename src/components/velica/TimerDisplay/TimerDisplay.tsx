import React from 'react';
import { Clock } from 'lucide-react';

interface TimerDisplayProps {
  totalSeconds: number;
  size?: 'md' | 'lg';
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({ totalSeconds, size = 'lg' }) => {
  const minutes = Math.floor(Math.max(0, totalSeconds) / 60);
  const seconds = Math.max(0, totalSeconds) % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Thresholds: Warning < 10 mins (600s), Critical < 2 mins (120s)
  let statusClass = 'velica-timer-normal';

  if (totalSeconds <= 120) {
    statusClass = 'velica-timer-critical animate-pulse-critical';
  } else if (totalSeconds <= 600) {
    statusClass = 'velica-timer-warning';
  }

  const isLg = size === 'lg';

  return (
    <div
      aria-live="polite"
      className={`velica-timer-badge ${isLg ? 'velica-timer-badge-lg' : 'velica-timer-badge-md'} ${statusClass}`}
    >
      <Clock size={isLg ? 18 : 15} />
      <span
        className={`velica-timer-digits ${isLg ? 'velica-timer-digits-lg' : 'velica-timer-digits-md'}`}
      >
        {formattedTime}
      </span>
    </div>
  );
};

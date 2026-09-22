import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  subLabel?: string;
  showPercentage?: boolean;
  color?: string; // hex or tailwind class
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  subLabel,
  showPercentage = true,
  color = '#EA0029',
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const sizeClasses = {
    xs: 'h-1.5',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div id="progress-bar-container" className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold text-zinc-700">
          <div className="flex items-center gap-1.5 truncate">
            {label && <span className="truncate">{label}</span>}
            {subLabel && <span className="text-zinc-400 font-normal">({subLabel})</span>}
          </div>
          {showPercentage && (
            <span className="font-bold text-zinc-800 ml-2 whitespace-nowrap">
              {percentage}%
            </span>
          )}
        </div>
      )}

      <div
        id="progress-track"
        className={`w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/70 p-0.5 ${sizeClasses[size]}`}
      >
        <div
          id="progress-fill"
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color.startsWith('#') ? color : undefined,
          }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

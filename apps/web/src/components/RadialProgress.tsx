import { cn } from "@web/lib/utils";

interface RadialProgressProps {
  max: number;
  min: number;
  current: number;
  size?: number; // px
  strokeWidth?: number; // px
  className?: string;
  colorClass?: string;
  trackClass?: string;
  showLabel?: boolean;
}

const RadialProgress = ({
  max,
  min,
  current,
  size = 80,
  strokeWidth = 8,
  className = "",
  colorClass = "text-primary",
  trackClass = "text-gray-200 dark:text-gray-700",
  showLabel = true,
}: RadialProgressProps) => {
  const safeMax = Number.isFinite(max) ? max : 100;
  const safeMin = Number.isFinite(min) ? min : 0;
  const span = Math.max(0, safeMax - safeMin);
  const value = Math.min(Math.max(current - safeMin, 0), span);
  const pct = span === 0 ? 0 : value / span; // 0..1

  const radius = Math.max(0, (size - strokeWidth) / 2);
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  const ariaNow = Math.round(safeMin + pct * span);
  const pctText = `${Math.round(pct * 100)}%`;

  return (
    <div
      role="progressbar"
      tabIndex={0}
      aria-valuemin={safeMin}
      aria-valuemax={safeMax}
      aria-valuenow={ariaNow}
      aria-valuetext={pctText}
      aria-label="Progress"
      className={cn(`relative inline-block ${className}`, {
        invisible: current < 5,
      })}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          className={trackClass}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        {/* Progress */}
        <circle
          className={`${colorClass} transition-[stroke-dashoffset] duration-300 ease-out`}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: dashOffset,
          }}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 grid place-items-center select-none">
          <span className="text-sm font-medium tabular-nums text-gray-700 dark:text-gray-200">
            {pctText}
          </span>
        </div>
      )}
    </div>
  );
};

export default RadialProgress;

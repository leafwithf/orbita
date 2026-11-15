import { cn } from "@/lib/utils";
import type { Progress } from "@/modules/tasks/domain";

export function ProgressLine({
  progress,
  className,
  label,
}: {
  progress: Progress;
  className?: string;
  label?: string;
}) {
  const text = label ?? progress.label;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] font-medium text-muted">{text}</span>
        {progress.totalWeight > 0 ? (
          <span className="text-[12px] tabular-nums text-faint">
            {progress.percent}%
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={text}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="h-1.5 overflow-hidden rounded-full bg-border"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width]"
          style={{ width: `${progress.percent}%` }}
        />
      </div>
    </div>
  );
}

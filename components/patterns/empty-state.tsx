import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface/85 px-5 text-center shadow-[var(--shadow-1)]",
        compact ? "py-6" : "py-10",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="orbita-singularity mb-5"
        style={{ "--s": compact ? "56px" : "68px" } as React.CSSProperties}
      >
        <span className="orbita-singularity-core">
          <Icon className="size-4" />
        </span>
      </span>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-[42ch] text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 w-full max-w-xs">{action}</div> : null}
    </div>
  );
}

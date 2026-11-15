import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Minus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { DueDateState } from "@/modules/tasks/domain";
import { DUE_DATE_LABELS } from "@/modules/tasks/domain";

type Tone = "danger" | "warning" | "brand" | "success" | "neutral";

const TONES: Record<Tone, string> = {
  danger: "border-danger/25 bg-danger-soft text-[var(--danger-700)]",
  warning: "border-warning/35 bg-warning-soft text-[var(--warning-700)]",
  brand: "border-brand/20 bg-brand-soft text-[var(--brand-700)]",
  success: "border-success/25 bg-success-soft text-[var(--success-700)]",
  neutral: "border-border bg-surface-2 text-muted",
};

const DUE_TONES: Record<DueDateState, Tone> = {
  overdue: "danger",
  today: "warning",
  upcoming: "brand",
  none: "neutral",
};

const DUE_ICONS: Record<DueDateState, LucideIcon> = {
  overdue: AlertTriangle,
  today: Clock3,
  upcoming: CalendarDays,
  none: Minus,
};

export function StatusChip({
  label,
  tone = "neutral",
  icon: Icon,
  className,
}: {
  label: string;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] font-semibold whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {Icon ? <Icon className="size-3" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}

export function DueDateChip({
  state,
  className,
}: {
  state: DueDateState;
  className?: string;
}) {
  return (
    <StatusChip
      label={DUE_DATE_LABELS[state]}
      tone={DUE_TONES[state]}
      icon={DUE_ICONS[state]}
      className={className}
    />
  );
}

export function CompletedChip({ className }: { className?: string }) {
  return (
    <StatusChip
      label="Concluída"
      tone="success"
      icon={CheckCircle2}
      className={className}
    />
  );
}

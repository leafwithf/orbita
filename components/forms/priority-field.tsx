import { PRIORITIES, PRIORITY_LABELS } from "@/modules/projects/domain";
import { cn } from "@/lib/utils";

export function PriorityField({
  defaultValue = "medium",
  error,
  label = "Prioridade",
  hint = "Prioridade não muda o prazo; ajuda a decidir o que vem primeiro.",
  className,
}: {
  defaultValue?: (typeof PRIORITIES)[number];
  error?: string;
  label?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="text-[13px] font-medium text-ink">{label}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {PRIORITIES.map((priority) => (
          <label key={priority} className="cursor-pointer">
            <input
              type="radio"
              name="priority"
              value={priority}
              defaultChecked={priority === defaultValue}
              className="peer sr-only"
            />
            <span
              className={cn(
                "inline-flex min-h-9 items-center rounded-full border border-border-strong bg-surface px-3.5 text-[12.5px] font-semibold text-ink transition-colors",
                "peer-checked:border-brand peer-checked:bg-brand-soft peer-checked:text-[var(--brand-700)]",
                "peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
              )}
            >
              {PRIORITY_LABELS[priority]}
            </span>
          </label>
        ))}
      </div>
      {hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-faint">{hint}</p>
      ) : null}
      {error ? (
        <p className="mt-1 text-[12.5px] font-medium text-danger">{error}</p>
      ) : null}
    </fieldset>
  );
}

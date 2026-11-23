import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionCard({
  id,
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(
        "orbita-panel flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-1)] transition-[border-color,box-shadow] duration-200",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-border bg-surface-2/35 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h2
            id={titleId}
            className="text-[14px] leading-snug font-semibold tracking-[-0.015em] sm:text-[15px]"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-muted sm:text-[12.5px]">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex-none">{action}</div> : null}
      </header>
      <div className={cn("min-w-0 flex-1 p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

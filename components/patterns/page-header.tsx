import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "relative flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 inline-flex items-center gap-2 text-[10px] font-semibold tracking-[.18em] text-brand uppercase">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand shadow-[0_0_12px_var(--brand)]" />
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[30px] leading-[1.08] font-semibold tracking-[-.045em] sm:text-[38px]">
          {title}<span className="text-brand">.</span>
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-[13.5px] leading-6 text-muted sm:text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-none sm:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand/logo";

export function AuthCard({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="w-full max-w-[440px]">
      <Link
        href="/login"
        className="mb-8 inline-flex items-center gap-2.5 text-ink no-underline lg:hidden"
        aria-label="ÓRBITA — início"
      >
        <BrandLockup compact />
      </Link>

      <div className="rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-1)] sm:p-8">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold tracking-[0.12em] text-brand uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[26px] leading-tight font-semibold tracking-[-0.025em]">
          {title}
        </h1>
        {description ? (
          <div className="mt-2 text-sm leading-relaxed text-muted">
            {description}
          </div>
        ) : null}
        <div className="mt-6">{children}</div>
      </div>

      {footer ? (
        <div className="mt-6 text-center text-sm text-muted">{footer}</div>
      ) : null}

      <p className="mt-8 text-center text-xs leading-relaxed text-faint">
        Alpha privado · Seus dados ficam no seu espaço, visíveis apenas para
        quem você convidar.
      </p>
    </section>
  );
}

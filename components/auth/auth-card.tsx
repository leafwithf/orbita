import Link from "next/link";
import type { ReactNode } from "react";

import { LogoMark } from "@/components/brand/logo";

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
        <span className="grid size-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#2c6be0] to-[#1d4fb8] text-white">
          <LogoMark className="size-5" />
        </span>
        <span className="text-[15px] font-bold tracking-[0.14em]">ÓRBITA</span>
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

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  title?: string;
};

export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("size-8", className)}
      fill="none"
    >
      <circle cx="16" cy="16" r="4.75" fill="currentColor" />
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="6.4"
        transform="rotate(-27 16 16)"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <circle cx="26.1" cy="9.8" r="2.1" fill="currentColor" />
    </svg>
  );
}

export function BrandLockup({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-[10px] bg-gradient-to-br from-[#2c6be0] to-[#1d4fb8] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]">
        <LogoMark className="size-5" />
      </span>
      <span className="grid leading-tight">
        <span className="text-[15px] font-bold tracking-[0.14em] text-white">
          ÓRBITA
        </span>
        {!compact ? (
          <span className="text-[11px] tracking-[0.02em] text-[#7f8ca3]">
            seu espaço de trabalho
          </span>
        ) : null}
      </span>
    </span>
  );
}

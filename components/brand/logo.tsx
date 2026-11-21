import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  title?: string;
};

/** Olho gravitacional: a luz curva ao redor do vazio central. */
export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={cn("size-8", className)}
      fill="none"
    >
      <path
        d="M3.5 24C8.2 14.6 15.2 9.8 24 9.8s15.8 4.8 20.5 14.2C39.8 33.4 32.8 38.2 24 38.2S8.2 33.4 3.5 24Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M7.5 27.8C13.4 17.8 21.4 13.4 30.6 15.2c4.1.8 7.4 3.1 9.9 6.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        opacity=".72"
      />
      <ellipse
        cx="24"
        cy="24"
        rx="13.4"
        ry="6.4"
        transform="rotate(-29 24 24)"
        stroke="currentColor"
        strokeWidth="2.15"
      />
      <circle cx="24" cy="24" r="7.1" fill="#080d16" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="3.1" fill="#020409" />
      <circle cx="36.2" cy="15.1" r="2" fill="currentColor" />
      <path d="M10.2 17.1 7.8 14.7M38 32.8l2.2 2.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity=".8" />
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
      <span className="grid size-9 place-items-center rounded-[11px] border border-[#d6a45f]/25 bg-gradient-to-br from-[#202b3d] to-[#080d16] text-[#e5b76e] shadow-[0_5px_18px_rgb(0_0_0/0.28),inset_0_1px_0_rgb(255_255_255/0.08)]">
        <LogoMark className="size-[25px]" />
      </span>
      <span className="grid leading-tight">
        <span className="text-[15px] font-bold tracking-[0.14em] text-white">
          ÓRBITA
        </span>
        {!compact ? (
          <span className="text-[11px] tracking-[0.02em] text-[#9aa7bc]">
            seu espaço de trabalho
          </span>
        ) : null}
      </span>
    </span>
  );
}

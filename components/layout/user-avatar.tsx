import { getInitials } from "@/lib/names";
import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: "size-7 text-[10px]",
  md: "size-8 text-[11px]",
  lg: "size-10 text-[13px]",
} as const;

export function UserAvatar({ name, className, size = "md" }: AvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-grid flex-none place-items-center rounded-full border border-black/5 bg-[#dce7fb] font-bold text-[#24457e]",
        SIZES[size],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

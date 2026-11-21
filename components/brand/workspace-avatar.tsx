"use client";

import { useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function WorkspaceAvatar({
  name,
  brandColor,
  coverUrl,
  size = "md",
  className,
}: {
  name: string;
  brandColor: string;
  coverUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const imageSize = size === "sm" ? 24 : size === "lg" ? 44 : 32;
  const sizes = {
    sm: "size-6 rounded-md text-[10px]",
    md: "size-8 rounded-lg text-[12px]",
    lg: "size-11 rounded-xl text-sm",
  } as const;
  const showImage = Boolean(coverUrl && failedSrc !== coverUrl);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-grid flex-none place-items-center overflow-hidden font-bold shadow-[inset_0_1px_0_rgb(255_255_255/0.2)]",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: brandColor, color: "#101521" }}
    >
      {showImage ? (
        <Image
          src={coverUrl!}
          alt=""
          width={imageSize}
          height={imageSize}
          sizes={`${imageSize}px`}
          unoptimized
          onError={() => setFailedSrc(coverUrl!)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        name.trim().slice(0, 1).toLocaleUpperCase("pt-BR") || "Ó"
      )}
    </span>
  );
}

"use client";

import { PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TourLauncher() {
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-xl text-[12.5px] leading-relaxed text-muted">
        Revise a navegação, conheça os recursos e descubra como organizar seu trabalho.
      </p>
      <Button
        type="button"
        className="min-h-11 w-full sm:w-auto"
        onClick={() => window.dispatchEvent(new Event("orbita:open-tour"))}
      >
        <PlayCircle aria-hidden="true" />
        Abrir guia interativo
      </Button>
    </div>
  );
}

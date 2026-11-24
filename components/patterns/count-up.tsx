"use client";

import { useEffect, useRef } from "react";

/**
 * Numero que "conta" ate o valor. Mostra o valor final no servidor (sem salto
 * de layout) e so anima no navegador quando o movimento esta no nivel completo.
 */
export function CountUp({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const motion = document.documentElement.dataset.motion;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || motion === "leve" || motion === "minimo" || value <= 0) {
      el.textContent = String(value);
      return;
    }

    const duration = 700;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}

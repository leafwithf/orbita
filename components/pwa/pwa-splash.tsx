"use client";

import { useEffect, useState } from "react";

export function PwaSplash() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!isStandalone) return;

    const frame = window.requestAnimationFrame(() => setVisible(true));
    const timeout = window.setTimeout(() => setVisible(false), 900);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="orbita-pwa-splash" aria-hidden="true">
      <div className="orbita-pwa-splash-mark">
        <span />
      </div>
      <span className="orbita-pwa-splash-name">?RBITA</span>
    </div>
  );
}

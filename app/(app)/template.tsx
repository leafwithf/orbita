import type { ReactNode } from "react";

/** Remounts on navigation so each authenticated page enters without a hard flash. */
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="orbital-page-enter min-w-0">{children}</div>;
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crosshair,
  FolderKanban,
  Home,
  ListChecks,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}[] = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/foco", label: "Foco", icon: Crosshair },
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
];

export function MobileNav({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-surface/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_36px_-28px_rgba(0,0,0,.45)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1.5">
        {ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand",
                  active ? "text-brand" : "text-muted hover:text-ink",
                )}
              >
                <span className={cn(
                  "grid size-8 place-items-center rounded-xl transition-[background-color,transform] duration-200",
                  active && "bg-brand-soft",
                )}>
                  <Icon
                    className={cn("size-[19px]", active && "stroke-[2.3]")}
                    aria-hidden="true"
                  />
                </span>
                <span className="leading-none">{item.label}</span>
                {active ? <span aria-hidden="true" className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-brand" /> : null}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOpenMore}
            className="flex min-h-[60px] w-full flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium text-muted transition-colors hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand"
            aria-label="Mais opções de navegação"
          >
            <span className="grid size-8 place-items-center rounded-xl">
              <MoreHorizontal className="size-[19px]" aria-hidden="true" />
            </span>
            <span className="leading-none">Mais</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

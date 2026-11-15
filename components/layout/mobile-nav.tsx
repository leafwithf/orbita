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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
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
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-1 text-[10.5px] font-medium no-underline",
                  active ? "text-brand" : "text-muted hover:text-ink",
                )}
              >
                <Icon
                  className={cn("size-5", active && "stroke-[2.2]")}
                  aria-hidden="true"
                />
                {item.label}
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onOpenMore}
            className="flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 px-1 text-[10.5px] font-medium text-muted hover:text-ink"
            aria-label="Mais opções de navegação"
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            Mais
          </button>
        </li>
      </ul>
    </nav>
  );
}

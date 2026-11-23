"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Crosshair,
  FolderKanban,
  Home,
  ListChecks,
  MoreHorizontal,
  Plus,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const LEFT: NavItem[] = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/foco", label: "Foco", icon: Crosshair },
];

const RIGHT: NavItem[] = [
  { href: "/projetos", label: "Projetos", icon: FolderKanban },
  { href: "/tarefas", label: "Tarefas", icon: ListChecks },
];

const itemClass =
  "relative flex min-h-[64px] w-full flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-semibold no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-brand";

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(itemClass, active ? "text-brand" : "text-muted hover:text-ink")}
      >
        <span
          className={cn(
            "grid size-9 place-items-center rounded-xl transition-[background-color,transform] duration-200",
            active && "bg-brand-soft",
          )}
        >
          <Icon className={cn("size-5", active && "stroke-[2.3]")} aria-hidden="true" />
        </span>
        <span className="leading-none">{item.label}</span>
        {active ? (
          <span
            aria-hidden="true"
            className="absolute top-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-brand"
          />
        ) : null}
      </Link>
    </li>
  );
}

export function MobileNav({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();
  const creating = pathname === "/criar" || pathname.startsWith("/criar/");

  return (
    <nav
      aria-label="Navegação principal"
      className="orbita-panel fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-[520px] rounded-2xl pb-1 shadow-[0_14px_45px_-18px_rgba(0,0,0,.55)] backdrop-blur-2xl lg:hidden"
    >
      <ul className="grid grid-cols-6 px-1">
        {LEFT.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <li className="flex items-start justify-center">
          <Link
            href="/criar"
            aria-label="Criar novo"
            aria-current={creating ? "page" : undefined}
            className="orbita-fab -mt-5 grid size-14 place-items-center rounded-full no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Plus className="size-6 stroke-[2.6]" aria-hidden="true" />
          </Link>
        </li>

        {RIGHT.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} />
        ))}

        <li>
          <button
            type="button"
            onClick={onOpenMore}
            className={cn(itemClass, "text-muted hover:text-ink")}
            aria-label="Mais opções de navegação"
          >
            <span className="grid size-9 place-items-center rounded-xl">
              <MoreHorizontal className="size-5" aria-hidden="true" />
            </span>
            <span className="leading-none">Mais</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

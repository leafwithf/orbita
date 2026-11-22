"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, ChevronDown, LogOut, Plus } from "lucide-react";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/logo";
import { WorkspaceAvatar } from "@/components/brand/workspace-avatar";
import {
  isActivePath,
  PRIMARY_NAV,
  SECONDARY_NAV,
  SETTINGS_NAV,
  type NavItem,
} from "@/components/layout/nav-items";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/auth/actions";
import { switchWorkspaceAction } from "@/lib/actions/collab";
import type { WorkspaceRole } from "@/modules/workspaces/domain";
import { ROLE_LABELS } from "@/modules/workspaces/domain";
import { cn } from "@/lib/utils";

export type SidebarViewer = {
  name: string;
  email: string;
};

export type SidebarWorkspaceItem = {
  id: string;
  name: string;
  brandColor: string;
  coverUrl: string | null;
};

export type SidebarWorkspace = {
  name: string;
  role: WorkspaceRole;
  brandColor: string;
  coverUrl: string | null;
} | null;

function NavLink({
  item,
  onNavigate,
}: {
  item: NavItem;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium no-underline transition-all duration-150",
        "text-sidebar-foreground/75 hover:bg-sidebar-accent/80 hover:text-white hover:no-underline",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active && "bg-sidebar-accent text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.035)]",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r-full bg-brand"
        />
      ) : null}
      <Icon
        className={cn(
          "size-[17px] flex-none transition-colors",
          active ? "text-brand" : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
        )}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {active ? (
        <span className="size-1.5 flex-none rounded-full bg-brand shadow-[0_0_10px_var(--brand)]" />
      ) : null}
    </Link>
  );
}

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  onNavigate?: () => void;
}) {
  return (
    <section className="grid gap-1">
      <h2 className="px-3 pb-1 pt-4 text-[9px] font-bold tracking-[.18em] text-sidebar-foreground/35 uppercase">
        {title}
      </h2>
      {items.map((item) => (
        <NavLink key={item.href} item={item} onNavigate={onNavigate} />
      ))}
    </section>
  );
}

export function SidebarContent({
  viewer,
  workspace,
  workspaces = [],
  activeWorkspaceId = null,
  onNavigate,
}: {
  viewer: SidebarViewer;
  workspace: SidebarWorkspace;
  workspaces?: SidebarWorkspaceItem[];
  activeWorkspaceId?: string | null;
  onNavigate?: () => void;
}) {
  const [spacesOpen, setSpacesOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col px-3.5 py-5">
      <div className="flex items-center justify-between px-2 pb-5">
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex no-underline"
          aria-label="ÓRBITA — visão geral"
        >
          <BrandLockup />
        </Link>
        <span className="rounded-full border border-sidebar-border px-2 py-1 text-[8px] font-bold tracking-[.16em] text-sidebar-foreground/40">
          WORKSPACE
        </span>
      </div>

      <div className="rounded-2xl border border-sidebar-border/90 bg-[linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018))] p-2">
        <button
          type="button"
          onClick={() => setSpacesOpen((open) => !open)}
          aria-expanded={spacesOpen}
          aria-controls="workspace-switcher-list"
          className="flex min-h-12 w-full items-center gap-2.5 rounded-xl px-2 text-left transition-colors hover:bg-sidebar-accent/70"
        >
          <WorkspaceAvatar
            name={workspace?.name ?? "Órbita"}
            brandColor={workspace?.brandColor ?? "#d6a64b"}
            coverUrl={workspace?.coverUrl}
            size="md"
          />
          <span className="grid min-w-0 flex-1 gap-1 leading-tight">
            <span className="truncate text-[12.5px] font-semibold text-white">
              {workspace?.name ?? "Configurar espaço"}
            </span>
            <span className="truncate text-[10px] text-sidebar-foreground/50">
              {workspace ? ROLE_LABELS[workspace.role] : "Nenhum espaço ainda"}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "size-4 flex-none text-sidebar-foreground/45 transition-transform",
              spacesOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        {spacesOpen ? (
          <div
            id="workspace-switcher-list"
            className="mt-2 grid gap-1 border-t border-sidebar-border pt-2"
          >
            <p className="px-2 py-1 text-[9px] font-bold tracking-[.14em] text-sidebar-foreground/35 uppercase">
              Seus espaços
            </p>
            {workspaces.map((item) => (
              <form key={item.id} action={switchWorkspaceAction}>
                <input type="hidden" name="workspaceId" value={item.id} />
                <button
                  type="submit"
                  onClick={onNavigate}
                  aria-current={item.id === activeWorkspaceId ? "true" : undefined}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-left text-[12px] transition-colors hover:bg-sidebar-accent",
                    item.id === activeWorkspaceId
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/65",
                  )}
                >
                  <WorkspaceAvatar
                    name={item.name}
                    brandColor={item.brandColor}
                    coverUrl={item.coverUrl}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {item.id === activeWorkspaceId ? (
                    <span className="text-[9px] font-bold text-brand">ATUAL</span>
                  ) : null}
                </button>
              </form>
            ))}
            <Link
              href="/espacos"
              onClick={onNavigate}
              className="mt-1 flex min-h-9 items-center justify-between rounded-lg px-2 text-[11px] font-medium text-brand no-underline hover:bg-sidebar-accent hover:no-underline"
            >
              Gerenciar espaços <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        ) : null}
      </div>

      <Button
        asChild
        className="mt-3 h-11 w-full justify-between rounded-xl bg-brand px-3 text-[12.5px] font-bold text-white shadow-[0_5px_18px_-10px_var(--brand)] hover:bg-brand-hover"
      >
        <Link href="/criar" onClick={onNavigate}>
          <span className="inline-flex items-center gap-2">
            <Plus className="size-4" aria-hidden="true" />
            Criar novo
          </span>
          <span className="text-[10px] font-semibold text-white/65">＋</span>
        </Link>
      </Button>

      <nav aria-label="Navegação principal" className="mt-3 grid gap-1">
        <NavSection title="Seu espaço" items={PRIMARY_NAV} onNavigate={onNavigate} />
        <NavSection title="Gestão" items={SECONDARY_NAV} onNavigate={onNavigate} />
      </nav>

      <div className="mt-auto grid gap-1 pt-5">
        <NavLink item={SETTINGS_NAV} onNavigate={onNavigate} />
        <div className="mt-2 flex items-center gap-2.5 border-t border-sidebar-border px-1 pt-4">
          <UserAvatar name={viewer.name} size="lg" />
          <div className="grid min-w-0 flex-1 gap-1 leading-tight">
            <span className="truncate text-[12px] font-semibold text-white">
              {viewer.name}
            </span>
            <span className="truncate text-[10px] text-sidebar-foreground/45">
              {viewer.email}
            </span>
          </div>
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              className="size-11 rounded-xl text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-white"
              aria-label="Sair da conta"
              title="Sair da conta"
            >
              <LogOut className="size-4" aria-hidden="true" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function Sidebar(props: {
  viewer: SidebarViewer;
  workspace: SidebarWorkspace;
  workspaces?: SidebarWorkspaceItem[];
  activeWorkspaceId?: string | null;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:block">
      <SidebarContent {...props} />
    </aside>
  );
}

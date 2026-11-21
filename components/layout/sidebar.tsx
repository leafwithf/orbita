"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LogOut, Plus } from "lucide-react";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/logo";
import {
  isActivePath,
  PRIMARY_NAV,
  SECONDARY_NAV,
  SETTINGS_NAV,
  type NavItem,
} from "@/components/layout/nav-items";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOutAction } from "@/lib/auth/actions";
import { switchWorkspaceAction } from "@/lib/actions/collab";
import type { WorkspaceRole } from "@/modules/workspaces/domain";
import { ROLE_LABELS } from "@/modules/workspaces/domain";
import { cn } from "@/lib/utils";

export type SidebarViewer = {
  name: string;
  email: string;
};

export type SidebarWorkspaceItem = { id: string; name: string; brandColor: string; coverUrl: string | null; };

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
        "relative flex min-h-10 items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium text-sidebar-foreground no-underline transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:no-underline",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active && "bg-sidebar-accent text-white",
      )}
    >
      {active ? (
        <span
          aria-hidden="true"
          className="absolute top-2 bottom-2 -left-3.5 w-[3px] rounded-r-[3px] bg-brand"
        />
      ) : null}
      <Icon className="size-[18px] flex-none" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
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
    <div className="flex min-h-full flex-col px-4 py-5 sm:px-3.5 sm:py-4.5">
      <div className="px-1.5 pb-4">
        <Link
          href="/"
          onClick={onNavigate}
          className="inline-flex no-underline"
          aria-label="ÓRBITA — visão geral"
        >
          <BrandLockup />
        </Link>
      </div>

      <div className="grid gap-1">
        <button type="button" onClick={() => setSpacesOpen((open) => !open)} aria-expanded={spacesOpen} aria-controls="workspace-switcher-list" className="relative flex min-h-11 w-full items-center gap-2.5 overflow-hidden rounded-[10px] border border-sidebar-border bg-sidebar-accent px-2.5 py-2 text-left text-sidebar-accent-foreground transition-colors hover:bg-[#1b2740]">
          <span className="grid size-[22px] flex-none place-items-center rounded-md text-[11px] font-bold text-[#101521]" style={{ backgroundColor: workspace?.brandColor ?? "#d6a64b" }}>{workspace ? workspace.name.slice(0, 1).toUpperCase() : "Ó"}</span>
          <span className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-[13px] font-medium text-white">{workspace?.name ?? "Configurar espaço"}</span>
            <span className="truncate text-[10.5px] text-[#a9b4c6]">{workspace ? ROLE_LABELS[workspace.role] : "Nenhum espaço ainda"}</span>
          </span>
          <ChevronDown className={cn("size-4 flex-none text-[#a9b4c6] transition-transform", spacesOpen && "rotate-180")} aria-hidden="true" />
        </button>
        {spacesOpen ? (
          <div id="workspace-switcher-list" className="grid gap-1 rounded-[10px] border border-sidebar-border bg-[#0d1421] p-1.5">
            <p className="px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-[#7f8ca3] uppercase">Seus espaços</p>
            {workspaces.map((item) => (
              <form key={item.id} action={switchWorkspaceAction}>
                <input type="hidden" name="workspaceId" value={item.id} />
                <button type="submit" onClick={onNavigate} aria-current={item.id === activeWorkspaceId ? "true" : undefined} className={cn("flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left text-[12.5px] transition-colors hover:bg-sidebar-accent", item.id === activeWorkspaceId ? "bg-sidebar-accent text-white" : "text-[#b8c3d5]")}>
                  <span className="grid size-6 flex-none place-items-center rounded-md text-[10px] font-bold text-[#101521]" style={{ backgroundColor: item.brandColor }}>{item.name.slice(0, 1).toUpperCase()}</span>
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {item.id === activeWorkspaceId ? <span className="text-[10px] font-semibold text-brand">ATUAL</span> : null}
                </button>
              </form>
            ))}
            <Link href="/espacos" onClick={onNavigate} className="mt-1 border-t border-sidebar-border px-2 pt-2 text-[11px] font-medium text-brand no-underline hover:underline">Gerenciar espaços</Link>
          </div>
        ) : null}
      </div>

      <Button
        asChild
        className="mt-3 h-10 w-full justify-start gap-2 bg-brand text-[13.5px] font-semibold text-white hover:bg-brand-hover"
      >
        <Link href="/criar" onClick={onNavigate}>
          <Plus className="size-4" aria-hidden="true" />
          Criar
        </Link>
      </Button>

      <nav aria-label="Navegação principal" className="mt-4 grid gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}

        <p className="px-2.5 pt-4 pb-1.5 text-[10.5px] font-semibold tracking-[0.1em] text-[#66748c] uppercase">
          Organizar
        </p>
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto grid gap-1 pt-5">
        <NavLink item={SETTINGS_NAV} onNavigate={onNavigate} />

        <div className="mt-1.5 flex items-center gap-2 border-t border-sidebar-border pt-3">
          <UserAvatar name={viewer.name} />
          <div className="grid min-w-0 flex-1 leading-tight">
            <span className="truncate text-[13px] font-semibold text-[#eaf0fa]">
              {viewer.name}
            </span>
            <span className="truncate text-[11px] text-[#7f8ca3]">
              {viewer.email}
            </span>
          </div>
          <form action={signOutAction}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="size-9 text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                  aria-label="Sair da conta"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sair</TooltipContent>
            </Tooltip>
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

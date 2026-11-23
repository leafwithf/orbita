"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { WorkspaceAvatar } from "@/components/brand/workspace-avatar";
import { currentPageLabel } from "@/components/layout/nav-items";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserAvatar } from "@/components/layout/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/auth/actions";
import { switchWorkspaceAction } from "@/lib/actions/collab";
import { unreadBadge } from "@/modules/collab/domain";
import type { SidebarViewer, SidebarWorkspace } from "@/components/layout/sidebar";

export type TopbarWorkspace = {
  id: string;
  name: string;
  kind: string;
  brandColor: string;
  coverUrl: string | null;
};

export function Topbar({
  viewer,
  workspace,
  unread = 0,
  workspaces = [],
  activeWorkspaceId = null,
  onOpenNav,
}: {
  viewer: SidebarViewer;
  workspace: SidebarWorkspace;
  unread?: number;
  workspaces?: TopbarWorkspace[];
  activeWorkspaceId?: string | null;
  onOpenNav: () => void;
}) {
  const pathname = usePathname();
  const title = currentPageLabel(pathname);
  const activeWorkspace = workspaces.find((item) => item.id === activeWorkspaceId);
  const workspaceColor = activeWorkspace?.brandColor ?? workspace?.brandColor ?? "#d6a64b";

  return (
    <header className="sticky top-0 z-30 flex h-[68px] items-center gap-3 border-b border-border/80 bg-surface/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 rounded-xl text-muted hover:bg-accent lg:hidden"
        onClick={onOpenNav}
        aria-label="Abrir menu de navegação"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      <Link
        href="/"
        className="inline-flex shrink-0 text-brand no-underline lg:hidden"
        aria-label="ÓRBITA — visão geral"
      >
        <LogoMark className="size-6" />
      </Link>

      <div className="grid min-w-0 gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="inline-flex max-w-[min(42vw,220px)] items-center gap-1.5 rounded-full border px-2 py-1 text-[9px] font-bold tracking-[.08em]"
            style={{
              borderColor: `${workspaceColor}45`,
              backgroundColor: `${workspaceColor}12`,
              color: workspaceColor,
            }}
            aria-label={`Espaço atual: ${workspace?.name ?? "Órbita"}`}
          >
            <WorkspaceAvatar
              name={workspace?.name ?? "Órbita"}
              brandColor={workspaceColor}
              coverUrl={activeWorkspace?.coverUrl ?? workspace?.coverUrl}
              size="sm"
              className="size-4 rounded-[5px]"
            />
            <span className="truncate">{workspace?.name ?? "ÓRBITA"}</span>
          </span>
          <span className="hidden text-[9px] font-semibold tracking-[.14em] text-faint uppercase sm:inline">
            / ÓRBITA
          </span>
        </div>
        <p className="truncate text-[14px] leading-none font-semibold tracking-[-.02em] text-ink sm:text-[15px]" aria-live="polite">
          {title}
        </p>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
        <Link
          href="/notificacoes"
          className="relative inline-flex size-10 items-center justify-center rounded-xl text-muted no-underline transition-colors hover:bg-accent hover:text-ink hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label={
            unread > 0
              ? `Notificações, ${unread} não lida${unread > 1 ? "s" : ""}`
              : "Notificações"
          }
        >
          <Bell className="size-[18px]" aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 grid min-w-[17px] place-items-center rounded-full bg-brand px-1 text-[9px] leading-[17px] font-bold text-white shadow-sm"
            >
              {unreadBadge(unread)}
            </span>
          ) : null}
        </Link>

        <ThemeToggle className="size-10 rounded-xl text-muted hover:bg-accent hover:text-ink" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-0.5 inline-flex size-10 items-center justify-center rounded-full border border-border/80 bg-surface-2 transition-colors hover:border-brand/40 hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={`Menu da conta de ${viewer.name}`}
            >
              <UserAvatar name={viewer.name} size="md" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
            <DropdownMenuLabel className="grid gap-1 px-3 py-3">
              <span className="truncate text-[13px] font-semibold text-ink">
                {viewer.name}
              </span>
              <span className="truncate text-[11px] font-normal text-muted">
                {viewer.email}
              </span>
            </DropdownMenuLabel>
            {workspaces.length > 1 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="px-3 text-[10px] font-bold tracking-[.12em] text-faint uppercase">
                  Trocar de espaço
                </DropdownMenuLabel>
                {workspaces.map((item) => (
                  <form key={item.id} action={switchWorkspaceAction}>
                    <input type="hidden" name="workspaceId" value={item.id} />
                    <DropdownMenuItem asChild>
                      <button
                        type="submit"
                        className="min-h-10 w-full cursor-pointer justify-between rounded-xl"
                        aria-current={item.id === activeWorkspaceId ? "true" : undefined}
                      >
                        <span className="flex min-w-0 items-center gap-2 truncate">
                          <WorkspaceAvatar
                            name={item.name}
                            brandColor={item.brandColor}
                            coverUrl={item.coverUrl}
                            size="sm"
                          />
                          {item.name}
                        </span>
                        {item.id === activeWorkspaceId ? (
                          <span className="text-[10px] font-semibold text-brand">ATUAL</span>
                        ) : null}
                      </button>
                    </DropdownMenuItem>
                  </form>
                ))}
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="min-h-10 cursor-pointer rounded-xl">
                Perfil e aparência
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/espacos" className="min-h-10 cursor-pointer rounded-xl">
                Espaço e pessoas
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild>
                <button
                  type="submit"
                  className="min-h-10 w-full cursor-pointer rounded-xl text-danger"
                >
                  Sair da conta
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

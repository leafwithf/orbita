"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
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

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-11 lg:hidden"
        onClick={onOpenNav}
        aria-label="Abrir menu de navegação"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      <Link
        href="/"
        className="inline-flex text-brand no-underline lg:hidden"
        aria-label="ÓRBITA — visão geral"
      >
        <LogoMark className="size-6" />
      </Link>

      <div className="grid min-w-0 leading-tight">
        <p className="hidden truncate text-[11.5px] text-muted lg:block">
          {workspace?.name ?? "ÓRBITA"}
        </p>
        <p className="truncate text-[14px] font-semibold" aria-live="polite">
          {title}
        </p>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Link
          href="/notificacoes"
          className="relative inline-flex size-11 items-center justify-center rounded-md text-muted no-underline transition-colors hover:bg-accent hover:text-ink hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          aria-label={
            unread > 0
              ? `Notificações, ${unread} não lida${unread > 1 ? "s" : ""}`
              : "Notificações"
          }
        >
          <Bell className="size-5" aria-hidden="true" />
          {unread > 0 ? (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1 grid min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] leading-4 font-bold text-white"
            >
              {unreadBadge(unread)}
            </span>
          ) : null}
        </Link>

        <ThemeToggle className="size-11 text-muted hover:text-ink" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-0.5 inline-flex size-11 items-center justify-center rounded-full transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label={`Menu da conta de ${viewer.name}`}
            >
              <UserAvatar name={viewer.name} size="lg" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="grid gap-0.5 py-2">
              <span className="truncate text-[13px] font-semibold">
                {viewer.name}
              </span>
              <span className="truncate text-[11px] font-normal text-muted">
                {viewer.email}
              </span>
            </DropdownMenuLabel>
            {workspaces.length > 1 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[11px] font-semibold text-muted">
                  Trocar de espaço
                </DropdownMenuLabel>
                {workspaces.map((item) => (
                  <form key={item.id} action={switchWorkspaceAction}>
                    <input type="hidden" name="workspaceId" value={item.id} />
                    <DropdownMenuItem asChild>
                      <button
                        type="submit"
                        className="min-h-10 w-full cursor-pointer justify-between"
                        aria-current={item.id === activeWorkspaceId ? "true" : undefined}
                      >
                        <span className="truncate">{item.name}</span>
                        {item.id === activeWorkspaceId ? (
                          <span className="text-[11px] text-brand">atual</span>
                        ) : null}
                      </button>
                    </DropdownMenuItem>
                  </form>
                ))}
              </>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="min-h-10 cursor-pointer">
                Perfil e aparência
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/espacos" className="min-h-10 cursor-pointer">
                Espaço e pessoas
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild>
                <button
                  type="submit"
                  className="min-h-10 w-full cursor-pointer text-danger"
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

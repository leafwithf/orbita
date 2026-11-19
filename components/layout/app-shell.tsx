"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { MobileNav } from "@/components/layout/mobile-nav";
import { Sidebar, SidebarContent } from "@/components/layout/sidebar";
import type {
  SidebarViewer,
  SidebarWorkspace,
} from "@/components/layout/sidebar";
import { Topbar, type TopbarWorkspace } from "@/components/layout/topbar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

export function AppShell({
  viewer,
  workspace,
  unread = 0,
  workspaces = [],
  activeWorkspaceId = null,
  children,
}: {
  viewer: SidebarViewer;
  workspace: SidebarWorkspace;
  unread?: number;
  workspaces?: TopbarWorkspace[];
  activeWorkspaceId?: string | null;
  children: ReactNode;
}) {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-[var(--shadow-2)] focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </a>

      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-[300px] border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        >
          <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
          <SheetClose asChild>
            <button
              type="button"
              className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-md text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              aria-label="Fechar menu"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </SheetClose>
          <SidebarContent
            viewer={viewer}
            workspace={workspace}
            onNavigate={() => setNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="min-h-dvh lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <Sidebar viewer={viewer} workspace={workspace} />
        <div className="flex min-w-0 flex-col">
          <Topbar
            viewer={viewer}
            workspace={workspace}
            unread={unread}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            onOpenNav={() => setNavOpen(true)}
          />
          <main
            id="conteudo"
            className="mx-auto w-full max-w-[1240px] flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-16"
          >
            {children}
          </main>
        </div>
      </div>

      <MobileNav onOpenMore={() => setNavOpen(true)} />
    </>
  );
}

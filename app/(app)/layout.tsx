import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getAppContext, contextDisplayName } from "@/lib/data/context";
import { countUnreadNotifications } from "@/lib/data/notifications";
import { listMyWorkspaces } from "@/lib/data/workspaces";

// Every page here depends on the session cookie and fresh workspace data.
// Rendering them per request also keeps builds without env vars from baking a
// static "redirect to login" page into the deployment.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await getAppContext();

  if (context.profile && !context.profile.onboarding_done_at) {
    redirect("/bem-vindo");
  }

  const [unread, workspaces] = await Promise.all([
    countUnreadNotifications(),
    listMyWorkspaces(context.user.id),
  ]);

  return (
    <AppShell
      unread={unread}
      workspaces={workspaces.map(({ id, name, kind }) => ({ id, name, kind }))}
      activeWorkspaceId={context.workspace?.id ?? null}
      viewer={{
        name: contextDisplayName(context),
        email: context.user.email ?? "conta sem e-mail",
      }}
      workspace={
        context.workspace
          ? { name: context.workspace.name, role: context.workspace.role }
          : null
      }
    >
      {children}
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { Button } from "@/components/ui/button";
import { markNotificationsReadAction } from "@/lib/actions/collab";
import { getAppContext } from "@/lib/data/context";
import {
  countUnreadNotifications,
  listNotifications,
} from "@/lib/data/notifications";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notificações" };

function formatDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export default async function NotificationsPage() {
  const context = await getAppContext();
  const [items, unreadCount] = await Promise.all([
    listNotifications(50),
    countUnreadNotifications(),
  ]);
  const unread = items.filter((item) => !item.read);
  const read = items.filter((item) => item.read);

  return (
    <div className="grid gap-6">
      <section className="relative isolate overflow-hidden rounded-[28px] border border-brand/25 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_srgb,var(--brand)_24%,transparent),transparent_55%),linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-8">
      <PageHeader
        title="Notificações"
        description="Comentários, atribuições e mudanças nos seus espaços. Só aparece o que diz respeito à sua conta."
        actions={
          unreadCount > 0 ? (
            <form action={markNotificationsReadAction}>
              <Button type="submit" variant="outline" className="min-h-10 gap-2">
                <CheckCheck className="size-4" aria-hidden="true" />
                Marcar todas como lidas
              </Button>
            </form>
          ) : undefined
        }
      />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nada por aqui"
          description="Quando alguém comentar ou atribuir uma tarefa a você, avisamos aqui."
        />
      ) : (
        <>
          <SectionCard
            title={`Novas · ${unreadCount}`}
            description="Atividades que ainda não foram marcadas como lidas."
            bodyClassName="p-0 sm:p-0"
          >
            {unread.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">Nenhuma notificação nova.</p>
            ) : (
              <ul className="grid gap-3">
                {unread.map((item) => (
                  <li key={item.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-brand/30 bg-brand/[0.055] p-4 shadow-[var(--shadow-1)] sm:p-5">
                    <span aria-hidden="true" className="size-2 flex-none rounded-full bg-brand" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-ink">{item.text}</p>
                      <time dateTime={item.createdAt} className="text-[11.5px] text-faint">
                        {formatDate(item.createdAt, context.timeZone)}
                      </time>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        {item.href ? (
                          <Link href={item.href} className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-brand no-underline hover:underline">
                            Abrir conteúdo <ExternalLink className="size-3.5" aria-hidden="true" />
                          </Link>
                        ) : null}
                        <form action={markNotificationsReadAction}>
                          <input type="hidden" name="notificationId" value={item.id} />
                          <button type="submit" className="min-h-9 text-xs font-medium text-muted hover:text-ink">
                            Marcar como lida
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard
            title={`Anteriores · ${read.length}`}
            description="Notificações que você já marcou como lidas."
            bodyClassName="p-0 sm:p-0"
          >
            {read.length === 0 ? (
              <p className="px-4 py-5 text-sm text-muted">As notificações lidas aparecerão aqui.</p>
            ) : (
              <ul className="grid gap-3">
                {read.map((item) => (
                  <li key={item.id} className="flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-1)] sm:p-5">
                    <span aria-hidden="true" className="size-2 flex-none rounded-full bg-transparent" />
                    <div className="min-w-0 flex-1">
                      {item.href ? (
                        <Link href={item.href} className={cn("text-[13.5px] text-muted no-underline hover:text-ink hover:underline")}>
                          {item.text}
                        </Link>
                      ) : (
                        <p className="text-[13.5px] text-muted">{item.text}</p>
                      )}
                      <time dateTime={item.createdAt} className="text-[11.5px] text-faint">
                        {formatDate(item.createdAt, context.timeZone)}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}
    </div>
  );
}

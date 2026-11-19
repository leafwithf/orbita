import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { markNotificationsReadAction } from "@/lib/actions/collab";
import { listNotifications } from "@/lib/data/notifications";
import { formatDateTimePtBr } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notificações" };

export default async function NotificationsPage() {
  const items = await listNotifications();
  const unread = items.filter((item) => !item.read).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Notificações"
        description="Comentários, atribuições e mudanças de papel que dizem respeito a você. Só aparece o que é seu."
        actions={
          unread > 0 ? (
            <form action={markNotificationsReadAction}>
              <button type="submit" className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-3.5 text-[13px] font-semibold hover:bg-surface-2">
                Marcar todas como lidas
              </button>
            </form>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState icon={Bell} title="Nada por aqui" description="Quando alguém comentar ou atribuir uma tarefa a você, avisamos aqui." />
      ) : (
        <SectionCard title={unread > 0 ? `${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Tudo lido"} bodyClassName="p-0 sm:p-0">
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  aria-hidden="true"
                  className={cn("size-2 flex-none rounded-full", item.read ? "bg-transparent" : "bg-brand")}
                />
                <div className="min-w-0 flex-1">
                  {item.href ? (
                    <Link href={item.href} className={cn("text-[13.5px] no-underline hover:underline", !item.read && "font-semibold")}>
                      {item.read ? null : <span className="sr-only">Não lida: </span>}
                      {item.text}
                    </Link>
                  ) : (
                    <p className={cn("text-[13.5px]", !item.read && "font-semibold")}>
                      {item.read ? null : <span className="sr-only">Não lida: </span>}
                      {item.text}
                    </p>
                  )}
                  <time dateTime={item.createdAt} className="text-[11.5px] text-faint">
                    {formatDateTimePtBr(item.createdAt)}
                  </time>
                </div>
                {!item.read ? (
                  <form action={markNotificationsReadAction}>
                    <input type="hidden" name="notificationId" value={item.id} />
                    <button type="submit" aria-label="Marcar como lida" className="min-h-11 rounded-md border border-border-strong px-3 text-[12px] font-semibold hover:bg-surface-2">
                      Marcar como lida
                    </button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
    </div>
  );
}

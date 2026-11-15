import type { Metadata } from "next";
import { Crown, Link2, ShieldCheck, Users } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import { UserAvatar } from "@/components/layout/user-avatar";
import { getAppContext } from "@/lib/data/context";
import { listWorkspaceMembers } from "@/lib/data/workspace-members";
import { formatDatePtBr } from "@/lib/dates";
import {
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  canManageMembers,
} from "@/modules/workspaces/domain";

export const metadata: Metadata = { title: "Espaços e pessoas" };

export default async function WorkspacesPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Espaços e pessoas"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const members = await listWorkspaceMembers(context.workspace.id);
  const canInvite = canManageMembers(context.workspace.role);

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Colaboração"
        title="Espaços e pessoas"
        description="Quem participa, o que cada pessoa pode fazer e o que ainda está por vir."
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <SectionCard
            title={`Pessoas · ${members.length}`}
            description={`Você participa como ${ROLE_LABELS[context.workspace.role].toLowerCase()}.`}
          >
            {members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhuma pessoa listada"
                description="Isso não deveria acontecer: todo espaço tem ao menos o proprietário. Recarregue a página ou confira as migrações."
                compact
              />
            ) : (
              <ul className="divide-y divide-border">
                {members.map((member) => (
                  <li
                    key={member.userId}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <UserAvatar name={member.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold">
                        {member.name}
                        {member.userId === context.user.id ? " (você)" : ""}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-faint">
                        Desde {formatDatePtBr(member.joinedAt.slice(0, 10))}
                      </p>
                    </div>
                    <StatusChip
                      label={ROLE_LABELS[member.role]}
                      tone={member.role === "owner" ? "brand" : "neutral"}
                      icon={member.role === "owner" ? Crown : undefined}
                    />
                    {member.status === "suspended" ? (
                      <StatusChip label="Suspenso" tone="warning" />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="O que cada papel pode fazer">
            <dl className="grid gap-3">
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <div key={role} className="grid gap-0.5">
                  <dt className="text-[12.5px] font-semibold">{label}</dt>
                  <dd className="text-[12px] leading-relaxed text-muted">
                    {
                      ROLE_DESCRIPTIONS[
                        role as keyof typeof ROLE_DESCRIPTIONS
                      ]
                    }
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard title="Convidar pessoa">
            {canInvite ? (
              <>
                <p className="text-[12.5px] leading-relaxed text-muted">
                  O convite gera um link de uso único, válido por 7 dias. A
                  pessoa só entra depois de aceitar, e você pode revogar antes.
                </p>
                <div className="mt-3 grid gap-2 rounded-md border border-border bg-surface-2 px-3 py-3 text-[11.5px] leading-relaxed text-muted">
                  <span className="inline-flex items-center gap-2">
                    <Link2 className="size-3.5 text-brand" aria-hidden="true" />
                    Link copiável, sem depender de e-mail.
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <ShieldCheck
                      className="size-3.5 text-brand"
                      aria-hidden="true"
                    />
                    Só o hash do token fica no banco.
                  </span>
                </div>
                <p className="mt-3 rounded-md border border-border bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-muted">
                  Os convites serão liberados junto com os comentários. O banco e
                  as regras de acesso já estão prontos.
                </p>
              </>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-muted">
                Apenas proprietários e administradores podem convidar pessoas.
                Você pode acompanhar o espaço e participar das tarefas atribuídas
                a você.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Seu espaço">
            <dl className="grid gap-2 text-[12.5px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Nome</dt>
                <dd className="font-medium">{context.workspace.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Foco</dt>
                <dd className="font-medium">
                  {context.workspace.focus_scope === "workspace"
                    ? "Compartilhado no espaço"
                    : "Individual por pessoa"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Seu papel</dt>
                <dd className="font-medium">
                  {ROLE_LABELS[context.workspace.role]}
                </dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Isolamento de dados">
            <p className="text-[12.5px] leading-relaxed text-muted">
              Cada consulta passa por regras de acesso por linha no banco. Um
              espaço nunca enxerga projetos, tarefas ou arquivos de outro, mesmo
              que alguém tente pela API.
            </p>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

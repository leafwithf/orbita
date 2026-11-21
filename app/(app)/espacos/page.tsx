import type { Metadata } from "next";
import { Crown, Users } from "lucide-react";

import { CreateWorkspaceForm } from "@/components/collab/create-workspace-form";
import { InviteForm } from "@/components/collab/invite-form";
import { UserAvatar } from "@/components/layout/user-avatar";
import { WorkspaceAvatar } from "@/components/brand/workspace-avatar";
import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { SectionCard } from "@/components/patterns/section-card";
import { StatusChip } from "@/components/patterns/status-chip";
import {
  changeMemberRoleAction,
  leaveWorkspaceAction,
  removeMemberAction,
  revokeInvitationAction,
  switchWorkspaceAction,
  updateWorkspaceAppearanceAction,
} from "@/lib/actions/collab";
import { getAppContext } from "@/lib/data/context";
import { listPendingInvitations } from "@/lib/data/invitations";
import { listWorkspaceMembers } from "@/lib/data/workspace-members";
import { listMyWorkspaces } from "@/lib/data/workspaces";
import { formatDatePtBr } from "@/lib/dates";
import {
  canInviteInto,
  canLeaveWorkspace,
  canManageMember,
  grantableRoles,
} from "@/modules/collab/domain";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, WORKSPACE_ROLES } from "@/modules/workspaces/domain";

export const metadata: Metadata = { title: "Espaços e pessoas" };

const KIND_LABELS = { personal: "Pessoal", team: "Equipe", client: "Cliente" } as const;
const selectClass = "h-11 rounded-md border border-border-strong bg-surface px-2 text-[13px]";
const secondaryButton =
  "inline-flex min-h-11 items-center rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

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

  const workspace = context.workspace;
  const canInvite = canInviteInto(workspace.kind, workspace.role);
  const [members, invitations, myWorkspaces] = await Promise.all([
    listWorkspaceMembers(workspace.id),
    canInvite ? listPendingInvitations(workspace.id) : Promise.resolve([]),
    listMyWorkspaces(context.user.id),
  ]);
  const roles = grantableRoles(workspace.role);

  return (
    <div className="grid gap-7">
      <header className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-brand">Colaboração e acesso</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.05em] sm:text-[40px]">Pessoas certas.<br className="hidden sm:block" /> Espaços organizados<span className="text-brand">.</span></h1>
          <p className="mt-3 text-sm leading-6 text-muted">Gerencie quem participa, distribua responsabilidades e mantenha cada equipe no espaço certo.</p>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-muted">
          <span className="rounded-full bg-surface-2 px-3 py-1.5">{members.length} pessoas</span>
          <span className="rounded-full bg-surface-2 px-3 py-1.5">{myWorkspaces.length} espaços disponíveis</span>
          <span className="rounded-full bg-surface-2 px-3 py-1.5">Seu papel: {ROLE_LABELS[workspace.role]}</span>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 content-start gap-5">
          <SectionCard
            title={`Pessoas · ${members.length}`}
            description={`Você participa de “${workspace.name}” como ${ROLE_LABELS[workspace.role].toLowerCase()}.`}
          >
            {members.length === 0 ? (
              <EmptyState icon={Users} title="Nenhuma pessoa listada" description="Recarregue a página ou confira as migrações." compact />
            ) : (
              <ul className="divide-y divide-border">
                {members.map((member) => {
                  const isSelf = member.userId === context.user.id;
                  const manageable = canManageMember({ actor: workspace.role, target: member.role, isSelf });
                  return (
                    <li key={member.userId} className="grid gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <UserAvatar name={member.name} size="lg" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold">
                            {member.name}
                            {isSelf ? " (você)" : ""}
                          </p>
                          <p className="mt-0.5 truncate text-[11.5px] text-faint">
                            {member.email ? `${member.email} · ` : ""}
                            Desde {formatDatePtBr(member.joinedAt.slice(0, 10))}
                          </p>
                        </div>
                        <StatusChip
                          label={ROLE_LABELS[member.role]}
                          tone={member.role === "owner" ? "brand" : "neutral"}
                          icon={member.role === "owner" ? Crown : undefined}
                        />
                        {member.status === "suspended" ? <StatusChip label="Suspenso" tone="warning" /> : null}
                      </div>

                      {manageable ? (
                        <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-[52px]">
                          <form action={changeMemberRoleAction} className="flex items-center gap-2">
                            <input type="hidden" name="workspaceId" value={workspace.id} />
                            <input type="hidden" name="userId" value={member.userId} />
                            <label htmlFor={`role-${member.userId}`} className="sr-only">
                              Papel de {member.name}
                            </label>
                            <select id={`role-${member.userId}`} name="role" defaultValue={member.role} className={selectClass}>
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </select>
                            <button type="submit" className={secondaryButton}>
                              Salvar papel
                            </button>
                          </form>

                          <details className="group">
                            <summary className={`${secondaryButton} cursor-pointer list-none text-danger`}>
                              Remover
                            </summary>
                            <form action={removeMemberAction} className="mt-2 grid gap-2 rounded-md border border-danger/30 bg-danger-soft p-3">
                              <input type="hidden" name="workspaceId" value={workspace.id} />
                              <input type="hidden" name="userId" value={member.userId} />
                              <p className="text-[12.5px]">
                                {member.name} perde o acesso a “{workspace.name}” e as tarefas dela ficam sem responsável.
                              </p>
                              <button type="submit" className={`${secondaryButton} w-fit text-danger`}>
                                Confirmar remoção de {member.name}
                              </button>
                            </form>
                          </details>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </SectionCard>

          {canInvite && invitations.length > 0 ? (
            <SectionCard title={`Convites pendentes · ${invitations.length}`} description="Links ainda não usados. O link em si só é mostrado na criação.">
              <ul className="divide-y divide-border">
                {invitations.map((invite) => (
                  <li key={invite.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium">
                        {ROLE_LABELS[invite.role]}
                        {invite.email ? ` · ${invite.email}` : " · qualquer pessoa com o link"}
                      </p>
                      <p className="text-[11.5px] text-faint">
                        Expira em {formatDatePtBr(invite.expiresAt.slice(0, 10))}
                      </p>
                    </div>
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="invitationId" value={invite.id} />
                      <button type="submit" className={secondaryButton} aria-label={`Cancelar convite de ${ROLE_LABELS[invite.role]}`}>
                        Cancelar convite
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </SectionCard>
          ) : null}

          <SectionCard title="O que cada papel pode fazer">
            <dl className="grid gap-3">
              {WORKSPACE_ROLES.map((role) => (
                <div key={role} className="grid gap-0.5">
                  <dt className="text-[12.5px] font-semibold">{ROLE_LABELS[role]}</dt>
                  <dd className="text-[12px] leading-relaxed text-muted">{ROLE_DESCRIPTIONS[role]}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        </div>

        <aside className="grid min-w-0 content-start gap-5">
          <SectionCard title="Convidar pessoa">
            {canInvite ? (
              <InviteForm workspaceId={workspace.id} roles={roles} />
            ) : workspace.kind === "personal" ? (
              <p className="text-[12.5px] leading-relaxed text-muted">
                Espaços pessoais não recebem convites. Para colaborar, crie um espaço de equipe abaixo e convide as pessoas por lá.
              </p>
            ) : (
              <p className="text-[12.5px] leading-relaxed text-muted">
                Apenas proprietários e administradores podem convidar pessoas.
              </p>
            )}
          </SectionCard>

          <SectionCard title={`Seus espaços · ${myWorkspaces.length}`}>
            <ul className="grid gap-2">
              {myWorkspaces.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface-2/60 p-2.5">
                  <WorkspaceAvatar name={item.name} brandColor={item.brandColor} coverUrl={item.coverUrl} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium">{item.name}</p>
                    <p className="text-[11.5px] text-faint">
                      {KIND_LABELS[item.kind]} · {ROLE_LABELS[item.role]}
                    </p>
                  </div>
                  {item.id === workspace.id ? (
                    <StatusChip label="Em uso" tone="brand" />
                  ) : (
                    <form action={switchWorkspaceAction}>
                      <input type="hidden" name="workspaceId" value={item.id} />
                      <button type="submit" className={secondaryButton} aria-label={`Trocar para ${item.name}`}>
                        Trocar
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>

            <details className="mt-4 border-t border-border pt-3">
              <summary className="min-h-11 cursor-pointer text-[13px] font-semibold text-brand">
                Criar espaço de equipe
              </summary>
              <div className="mt-3">
                <CreateWorkspaceForm />
              </div>
            </details>
          </SectionCard>

          {canInvite ? (
            <SectionCard
              title="Identidade visual"
              description="Personalize a cor e a imagem que identificam este espaço."
            >
              <form action={updateWorkspaceAppearanceAction} className="grid gap-3">
                <input type="hidden" name="workspaceId" value={workspace.id} />
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
                  <WorkspaceAvatar name={workspace.name} brandColor={workspace.brandColor} coverUrl={workspace.coverUrl} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{workspace.name}</p>
                    <p className="text-[11.5px] text-muted">Prévia da identidade do espaço</p>
                  </div>
                </div>
                <label className="grid gap-1.5 text-[12.5px] font-medium">
                  Cor do espaço
                  <div className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-surface px-3">
                    <input
                      type="color"
                      name="color"
                      defaultValue={workspace.brandColor}
                      aria-label="Escolher cor do espaço"
                      className="size-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    />
                    <span className="text-[12px] text-muted">Usada no indicador do espaço e na navegação.</span>
                  </div>
                </label>
                <label className="grid gap-1.5 text-[12.5px] font-medium">
                  Foto de capa (URL HTTPS)
                  <input
                    type="url"
                    name="coverUrl"
                    defaultValue={workspace.coverUrl ?? ""}
                    placeholder="https://exemplo.com/imagem.jpg"
                    maxLength={2048}
                    className={selectClass}
                  />
                  <span className="text-[11.5px] font-normal text-faint">
                    Opcional. Por enquanto, use um link público HTTPS direto para a imagem.
                  </span>
                </label>
                <button type="submit" className={secondaryButton}>
                  Salvar identidade
                </button>
              </form>
            </SectionCard>
          ) : (
            <SectionCard title="Identidade visual">
              <p className="text-[12.5px] leading-relaxed text-muted">
                Apenas proprietários e administradores podem alterar a aparência deste espaço.
              </p>
            </SectionCard>
          )}

          <SectionCard title="Este espaço">
            <dl className="grid gap-2 text-[12.5px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Nome</dt>
                <dd className="font-medium">{workspace.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Tipo</dt>
                <dd className="font-medium">{KIND_LABELS[workspace.kind]}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Foco</dt>
                <dd className="font-medium">
                  {workspace.focus_scope === "workspace" ? "Compartilhado no espaço" : "Individual por pessoa"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-faint">Seu papel</dt>
                <dd className="font-medium">{ROLE_LABELS[workspace.role]}</dd>
              </div>
            </dl>

            {canLeaveWorkspace(workspace.role, workspace.kind) ? (
              <details className="mt-4 border-t border-border pt-3">
                <summary className={`${secondaryButton} cursor-pointer list-none text-danger`}>Sair do espaço</summary>
                <form action={leaveWorkspaceAction} className="mt-2 grid gap-2 rounded-md border border-danger/30 bg-danger-soft p-3">
                  <input type="hidden" name="workspaceId" value={workspace.id} />
                  <p className="text-[12.5px]">Você perde o acesso a “{workspace.name}”. Para voltar, precisará de um novo convite.</p>
                  <button type="submit" className={`${secondaryButton} w-fit text-danger`}>
                    Confirmar saída
                  </button>
                </form>
              </details>
            ) : null}
          </SectionCard>

          <SectionCard title="Isolamento de dados">
            <p className="text-[12.5px] leading-relaxed text-muted">
              Cada consulta passa por regras de acesso por linha no banco. Um espaço nunca enxerga projetos, tarefas ou arquivos de outro, mesmo que alguém tente pela API.
            </p>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

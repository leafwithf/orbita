import { ROLE_LABELS, isWorkspaceRole, type WorkspaceRole } from "@/modules/workspaces/domain";

export const INVITE_TTL_DAYS = 7;
export const MAX_PENDING_INVITATIONS = 20;

/** 32 bytes aleatórios em base64url = 43 caracteres. */
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isValidInviteToken(value: string): boolean {
  return INVITE_TOKEN_PATTERN.test(value);
}

const RANK: Record<WorkspaceRole, number> = {
  owner: 5,
  admin: 4,
  editor: 3,
  collaborator: 2,
  reader: 1,
};

/** Papéis que `actor` pode conceder em convites e mudanças (espelha o banco). */
export function grantableRoles(actor: WorkspaceRole): WorkspaceRole[] {
  if (actor === "owner") return ["admin", "editor", "collaborator", "reader"];
  if (actor === "admin") return ["editor", "collaborator", "reader"];
  return [];
}

/** Espelha as regras de change_member_role/remove_member do banco. */
export function canManageMember(input: {
  actor: WorkspaceRole;
  target: WorkspaceRole;
  isSelf: boolean;
}): boolean {
  if (input.isSelf) return false;
  if (RANK[input.actor] < RANK.admin) return false;
  if (input.target === "owner") return false;
  if (input.target === "admin" && input.actor !== "owner") return false;
  return true;
}

export function canLeaveWorkspace(role: WorkspaceRole, kind: "personal" | "team" | "client") {
  return role !== "owner" && kind !== "personal";
}

export function canInviteInto(kind: "personal" | "team" | "client", role: WorkspaceRole) {
  return kind !== "personal" && RANK[role] >= RANK.admin;
}

const INVITE_ERROR_MESSAGES: Record<string, string> = {
  invitation_invalid: "Este link de convite não é válido.",
  invitation_used: "Este convite já foi usado.",
  invitation_revoked: "Este convite foi cancelado por quem o enviou.",
  invitation_expired: "Este convite expirou. Peça um novo link.",
  invitation_email_mismatch:
    "Este convite foi emitido para outro e-mail. Entre com a conta correta.",
  already_member: "Você já participa deste espaço.",
  membership_suspended: "Sua participação neste espaço está suspensa.",
  personal_workspace: "Espaços pessoais não recebem convites. Crie um espaço de equipe.",
  too_many_invitations: "Há convites pendentes demais. Cancele alguns antes de criar outro.",
  only_owner_grants_admin: "Só o proprietário pode conceder ou alterar o papel de administrador.",
  only_owner_manages_admin: "Só o proprietário pode alterar ou remover administradores.",
  forbidden: "Você não tem permissão para fazer isso.",
  cannot_change_self: "Você não pode alterar o seu próprio papel.",
  use_leave_workspace: "Para sair do espaço, use “Sair do espaço”.",
  owner_cannot_leave: "O proprietário não pode sair do espaço.",
  owner_not_assignable: "O papel de proprietário não pode ser atribuído.",
  member_not_found: "Essa pessoa não está mais no espaço.",
  assignee_not_member: "A pessoa escolhida não participa deste espaço.",
  assignee_cannot_work: "Leitores não podem receber tarefas. Mude o papel antes.",
  invalid_workspace_name: "Dê um nome ao espaço (até 80 caracteres).",
  entity_not_found: "O item comentado não existe mais.",
};

export function collabErrorMessage(code: string | undefined | null): string {
  if (code && INVITE_ERROR_MESSAGES[code]) return INVITE_ERROR_MESSAGES[code];
  return "Não foi possível concluir. Tente novamente.";
}

/** Códigos de erro conhecidos (para decidir se a mensagem do banco é segura de mostrar). */
export function isKnownCollabError(code: string | undefined | null): boolean {
  return !!code && code in INVITE_ERROR_MESSAGES;
}

export type NotificationView = { text: string; href: string | null };

const ENTITY_HREF: Record<string, (id: string) => string> = {
  project: (id) => `/projetos/${id}`,
  task: (id) => `/tarefas/${id}`,
  idea: () => "/backlog",
  course: () => "/cursos",
  file: () => "/arquivos",
};

const str = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value : null;

export function describeNotification(type: string, payload: unknown): NotificationView {
  const p = (payload && typeof payload === "object" ? payload : {}) as Record<string, unknown>;

  switch (type) {
    case "comment": {
      const title = str(p.title);
      const entityType = str(p.entity_type);
      const entityId = str(p.entity_id);
      const excerpt = str(p.excerpt);
      return {
        text: `Novo comentário${title ? ` em “${title}”` : ""}${excerpt ? `: ${excerpt}` : ""}`,
        href: entityType && entityId && ENTITY_HREF[entityType] ? ENTITY_HREF[entityType](entityId) : null,
      };
    }
    case "task_assigned": {
      const title = str(p.title);
      const id = str(p.task_id);
      return {
        text: `Uma tarefa foi atribuída a você${title ? `: “${title}”` : ""}`,
        href: id ? `/tarefas/${id}` : null,
      };
    }
    case "invitation_accepted": {
      const who = str(p.by_name) ?? "Alguém";
      const role = isWorkspaceRole(p.role) ? ROLE_LABELS[p.role].toLowerCase() : null;
      return {
        text: `${who} aceitou seu convite${role ? ` como ${role}` : ""}`,
        href: "/espacos",
      };
    }
    case "role_changed": {
      const role = isWorkspaceRole(p.role) ? ROLE_LABELS[p.role].toLowerCase() : null;
      return { text: role ? `Seu papel no espaço agora é ${role}` : "Seu papel no espaço mudou", href: "/espacos" };
    }
    case "removed_from_workspace":
      return { text: "Você foi removido de um espaço", href: null };
    default:
      return { text: "Nova atividade", href: null };
  }
}

export function unreadBadge(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count > 99 ? "99+" : String(Math.floor(count));
}

export const MAX_COMMENT_LENGTH = 5000;

export function normalizeComment(raw: string): string | null {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (text.length < 1 || text.length > MAX_COMMENT_LENGTH) return null;
  return text;
}

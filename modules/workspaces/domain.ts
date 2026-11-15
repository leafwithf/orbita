export const WORKSPACE_ROLES = [
  "owner",
  "admin",
  "editor",
  "collaborator",
  "reader",
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Proprietário",
  admin: "Administrador",
  editor: "Editor",
  collaborator: "Colaborador",
  reader: "Leitor",
};

export const ROLE_DESCRIPTIONS: Record<WorkspaceRole, string> = {
  owner: "Controla tudo, inclusive excluir o espaço.",
  admin: "Gerencia pessoas, convites e configurações.",
  editor: "Cria e edita projetos, tarefas, cursos e arquivos.",
  collaborator: "Move e conclui as próprias tarefas e comenta.",
  reader: "Acompanha o conteúdo, sem editar.",
};

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 5,
  admin: 4,
  editor: 3,
  collaborator: 2,
  reader: 1,
};

export function hasRole(actual: WorkspaceRole, minimum: WorkspaceRole) {
  return ROLE_RANK[actual] >= ROLE_RANK[minimum];
}

export function canManageWorkspace(role: WorkspaceRole) {
  return hasRole(role, "admin");
}

export function canManageMembers(role: WorkspaceRole) {
  return hasRole(role, "admin");
}

export function canEditContent(role: WorkspaceRole) {
  return hasRole(role, "editor");
}

export function canMoveOwnTasks(role: WorkspaceRole) {
  return hasRole(role, "collaborator");
}

export function canComment(role: WorkspaceRole) {
  return hasRole(role, "collaborator");
}

export function canPublishPortfolio(role: WorkspaceRole) {
  return hasRole(role, "editor");
}

export function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return (
    typeof value === "string" &&
    (WORKSPACE_ROLES as readonly string[]).includes(value)
  );
}

import { describe, expect, it } from "vitest";

import {
  canComment,
  canEditContent,
  canManageMembers,
  canManageWorkspace,
  canMoveOwnTasks,
  canPublishPortfolio,
  hasRole,
  isWorkspaceRole,
} from "@/modules/workspaces/domain";

describe("hierarquia de papéis", () => {
  it("ordena proprietário acima de administrador e leitor abaixo de todos", () => {
    expect(hasRole("owner", "admin")).toBe(true);
    expect(hasRole("admin", "owner")).toBe(false);
    expect(hasRole("reader", "reader")).toBe(true);
    expect(hasRole("reader", "collaborator")).toBe(false);
  });

  it("limita gestão a proprietário e administrador", () => {
    expect(canManageWorkspace("owner")).toBe(true);
    expect(canManageWorkspace("admin")).toBe(true);
    expect(canManageWorkspace("editor")).toBe(false);
    expect(canManageMembers("editor")).toBe(false);
  });

  it("permite edição de conteúdo a partir de editor", () => {
    expect(canEditContent("editor")).toBe(true);
    expect(canEditContent("collaborator")).toBe(false);
    expect(canPublishPortfolio("editor")).toBe(true);
    expect(canPublishPortfolio("collaborator")).toBe(false);
  });

  it("permite colaborador mover as próprias tarefas e comentar", () => {
    expect(canMoveOwnTasks("collaborator")).toBe(true);
    expect(canComment("collaborator")).toBe(true);
    expect(canMoveOwnTasks("reader")).toBe(false);
    expect(canComment("reader")).toBe(false);
  });
});

describe("isWorkspaceRole", () => {
  it("valida apenas papéis conhecidos", () => {
    expect(isWorkspaceRole("editor")).toBe(true);
    expect(isWorkspaceRole("superadmin")).toBe(false);
    expect(isWorkspaceRole(null)).toBe(false);
  });
});

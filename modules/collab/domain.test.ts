import { describe, expect, it } from "vitest";
import {
  canInviteInto,
  canLeaveWorkspace,
  canManageMember,
  collabErrorMessage,
  describeNotification,
  grantableRoles,
  isValidInviteToken,
  normalizeComment,
  unreadBadge,
} from "./domain";
import { generateInviteToken, hashInviteToken } from "./token";

describe("token de convite", () => {
  it("32 bytes em base64url e hash SHA-256 de 64 hex", () => {
    const { token, hash } = generateInviteToken();
    expect(token).toHaveLength(43);
    expect(isValidInviteToken(token)).toBe(true);
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    expect(hashInviteToken(token)).toBe(hash);
    expect(hash === token).toBe(false);
  });
  it("não repete e rejeita formatos inválidos", () => {
    const seen = new Set(Array.from({ length: 200 }, () => generateInviteToken().token));
    expect(seen.size).toBe(200);
    for (const bad of ["", "curto", "a".repeat(42), "a".repeat(44), "a".repeat(42) + "=", "a".repeat(42) + "/", "../../etc/passwd"]) {
      expect(isValidInviteToken(bad)).toBe(false);
    }
  });
  it("hash conhecido (SHA-256 de 'abc')", () => {
    expect(hashInviteToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("papéis", () => {
  it("quem pode conceder o quê", () => {
    expect(grantableRoles("owner")).toEqual(["admin", "editor", "collaborator", "reader"]);
    expect(grantableRoles("admin")).toEqual(["editor", "collaborator", "reader"]);
    expect(grantableRoles("editor")).toEqual([]);
    expect(grantableRoles("reader")).toEqual([]);
  });
  it("gerenciar membros espelha o banco", () => {
    const base = { isSelf: false };
    expect(canManageMember({ ...base, actor: "owner", target: "admin" })).toBe(true);
    expect(canManageMember({ ...base, actor: "admin", target: "admin" })).toBe(false);
    expect(canManageMember({ ...base, actor: "admin", target: "editor" })).toBe(true);
    expect(canManageMember({ ...base, actor: "admin", target: "owner" })).toBe(false);
    expect(canManageMember({ ...base, actor: "editor", target: "reader" })).toBe(false);
    expect(canManageMember({ isSelf: true, actor: "owner", target: "editor" })).toBe(false);
  });
  it("convidar e sair", () => {
    expect(canInviteInto("team", "admin")).toBe(true);
    expect(canInviteInto("personal", "owner")).toBe(false);
    expect(canInviteInto("client", "editor")).toBe(false);
    expect(canLeaveWorkspace("editor", "team")).toBe(true);
    expect(canLeaveWorkspace("owner", "team")).toBe(false);
    expect(canLeaveWorkspace("editor", "personal")).toBe(false);
  });
});

describe("mensagens e notificações", () => {
  it("traduz erros do banco e cai num texto genérico", () => {
    expect(collabErrorMessage("invitation_expired")).toContain("expirou");
    expect(collabErrorMessage("invitation_used")).toContain("já foi usado");
    expect(collabErrorMessage("algo_estranho")).toBe("Não foi possível concluir. Tente novamente.");
    expect(collabErrorMessage(undefined)).toBe("Não foi possível concluir. Tente novamente.");
  });
  it("descreve cada tipo com o destino certo", () => {
    expect(describeNotification("comment", { title: "Copy", entity_type: "task", entity_id: "abc", excerpt: "Combinado" })).toEqual({
      text: "Novo comentário em “Copy”: Combinado",
      href: "/tarefas/abc",
    });
    expect(describeNotification("comment", { entity_type: "project", entity_id: "p1" }).href).toBe("/projetos/p1");
    expect(describeNotification("task_assigned", { title: "Revisar", task_id: "t1" })).toEqual({
      text: "Uma tarefa foi atribuída a você: “Revisar”",
      href: "/tarefas/t1",
    });
    expect(describeNotification("invitation_accepted", { by_name: "Ana", role: "editor" }).text).toBe("Ana aceitou seu convite como editor");
    expect(describeNotification("role_changed", { role: "admin" }).text).toBe("Seu papel no espaço agora é administrador");
    expect(describeNotification("removed_from_workspace", {}).href).toBeNull();
  });
  it("tolera payload estranho sem quebrar", () => {
    expect(describeNotification("comment", null).text).toBe("Novo comentário");
    expect(describeNotification("comment", "texto").href).toBeNull();
    expect(describeNotification("comment", { entity_type: "hack", entity_id: "x" }).href).toBeNull();
    expect(describeNotification("tipo_novo", {}).text).toBe("Nova atividade");
  });
  it("selo de não lidas", () => {
    expect(unreadBadge(0)).toBeNull();
    expect(unreadBadge(-3)).toBeNull();
    expect(unreadBadge(7)).toBe("7");
    expect(unreadBadge(250)).toBe("99+");
    expect(unreadBadge(Number.NaN)).toBeNull();
  });
  it("normaliza comentário", () => {
    expect(normalizeComment("  oi \r\n tudo bem  ")).toBe("oi \n tudo bem");
    expect(normalizeComment("   ")).toBeNull();
    expect(normalizeComment("x".repeat(5001))).toBeNull();
    expect(normalizeComment("x".repeat(5000))).toHaveLength(5000);
  });
});

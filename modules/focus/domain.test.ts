import { describe, expect, it } from "vitest";

import {
  assertFocusKind,
  focusChangePrompt,
  resolveFocusScopeKey,
} from "@/modules/focus/domain";

describe("resolveFocusScopeKey", () => {
  it("usa uma chave fixa para foco compartilhado", () => {
    expect(resolveFocusScopeKey("workspace", "user-1")).toBe("workspace");
  });

  it("usa o id do usuário para foco individual", () => {
    expect(resolveFocusScopeKey("user", "user-1")).toBe("user-1");
  });
});

describe("assertFocusKind", () => {
  it("aceita apenas projeto ou curso", () => {
    expect(assertFocusKind("project")).toBe("project");
    expect(assertFocusKind("course")).toBe("course");
    expect(() => assertFocusKind("task")).toThrow(/inválido/i);
  });
});

describe("focusChangePrompt", () => {
  it("explica a primeira definição", () => {
    expect(focusChangePrompt("project", null, "Órbita")).toContain(
      "Definir “Órbita” como projeto principal",
    );
  });

  it("avisa que nada será apagado ao trocar", () => {
    const prompt = focusChangePrompt("course", "Curso antigo", "Curso novo");
    expect(prompt).toContain("Curso antigo");
    expect(prompt).toContain("Curso novo");
    expect(prompt).toContain("Nada será arquivado ou apagado");
  });
});

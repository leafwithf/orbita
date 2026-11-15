import { describe, expect, it } from "vitest";

import {
  calculateProgress,
  classifyDueDate,
  dueDateLabel,
} from "@/modules/tasks/domain";

describe("classifyDueDate", () => {
  it("classifica atrasada, hoje, próxima e sem prazo", () => {
    expect(classifyDueDate("2026-11-13", "2026-11-14")).toBe("overdue");
    expect(classifyDueDate("2026-11-14", "2026-11-14")).toBe("today");
    expect(classifyDueDate("2026-11-15", "2026-11-14")).toBe("upcoming");
    expect(classifyDueDate(null, "2026-11-14")).toBe("none");
  });

  it("compara datas de calendário mesmo perto da virada de ano", () => {
    expect(classifyDueDate("2027-01-01", "2026-12-31")).toBe("upcoming");
    expect(classifyDueDate("2026-12-31", "2027-01-01")).toBe("overdue");
  });

  it("expõe um rótulo por extenso, nunca só cor", () => {
    expect(dueDateLabel("2026-11-13", "2026-11-14")).toBe("Atrasada");
    expect(dueDateLabel("2026-11-14", "2026-11-14")).toBe("Vence hoje");
    expect(dueDateLabel(null, "2026-11-14")).toBe("Sem prazo");
  });
});

describe("calculateProgress", () => {
  it("calcula progresso ponderado das tarefas de primeiro nível", () => {
    const progress = calculateProgress([
      { weight: 1, status: "done" },
      { weight: 1, status: "todo" },
      { weight: 1, status: "in_progress" },
    ]);

    expect(progress.percent).toBe(33);
    expect(progress.completedWeight).toBe(1);
    expect(progress.totalWeight).toBe(3);
    expect(progress.label).toBe("1 de 3 tarefas (33%)");
  });

  it("respeita pesos maiores e nunca usa peso zero", () => {
    const progress = calculateProgress([
      { weight: 2, status: "done" },
      { weight: 0, status: "todo" },
    ]);

    expect(progress.totalWeight).toBe(3);
    expect(progress.percent).toBe(67);
  });

  it("ignora subtarefas e tarefas arquivadas", () => {
    const progress = calculateProgress([
      { weight: 1, status: "done", parentTaskId: "parent" },
      { weight: 1, status: "archived" },
      { weight: 1, status: "todo" },
    ]);

    expect(progress.totalWeight).toBe(1);
    expect(progress.percent).toBe(0);
  });

  it("explica quando ainda não há tarefas", () => {
    const progress = calculateProgress([]);
    expect(progress.percent).toBe(0);
    expect(progress.label).toBe("Sem tarefas ainda");
  });
});

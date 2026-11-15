import { describe, expect, it } from "vitest";

import {
  PROJECT_STAGES,
  PROJECT_STATUS_LABELS,
  PRIORITIES,
  PRIORITY_ORDER,
  priorityLabel,
  projectStageLabel,
  projectStagePosition,
} from "@/modules/projects/domain";

describe("fases do projeto", () => {
  it("mantém a ordem do começo ao fim", () => {
    expect(PROJECT_STAGES[0]).toBe("idea");
    expect(PROJECT_STAGES.at(-1)).toBe("done");
    expect(projectStagePosition("idea")).toBe(1);
    expect(projectStagePosition("done")).toBe(PROJECT_STAGES.length);
  });

  it("explica a fase em português, nunca em jargão", () => {
    expect(projectStageLabel("build")).toBe("Construção");
    expect(projectStageLabel("follow_up")).toBe("Acompanhamento");
  });

  it("cai num rótulo seguro quando a fase é desconhecida", () => {
    expect(projectStageLabel("sprint-42")).toBe("Em andamento");
    expect(projectStagePosition("sprint-42")).toBe(1);
  });
});

describe("status do projeto", () => {
  it("tem um rótulo para cada status persistido", () => {
    expect(PROJECT_STATUS_LABELS.active).toBe("Em andamento");
    expect(PROJECT_STATUS_LABELS.paused).toBe("Pausado");
    expect(PROJECT_STATUS_LABELS.completed).toBe("Concluído");
  });
});

describe("prioridade", () => {
  it("ordena da menor para a maior", () => {
    expect(PRIORITIES.map((priority) => PRIORITY_ORDER[priority])).toEqual([
      0, 1, 2, 3,
    ]);
  });

  it("traduz a prioridade e nunca devolve vazio", () => {
    expect(priorityLabel("urgent")).toBe("Urgente");
    expect(priorityLabel("medium")).toBe("Normal");
    expect(priorityLabel("desconhecida")).toBe("Normal");
  });
});

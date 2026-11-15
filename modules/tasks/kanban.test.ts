import { describe, expect, it } from "vitest";
import {
  adjacentStatus,
  describeActivity,
  normalizeSearchQuery,
  positionBetween,
  positionForIndex,
  rebalancePositions,
  undoRemainingMs,
} from "./kanban";

describe("kanban positions", () => {
  it("coluna vazia começa em 1024", () => {
    expect(positionBetween(null, null)).toEqual({ position: 1024, rebalance: false });
  });
  it("insere no topo, no fim e no meio", () => {
    expect(positionBetween(null, 1024).position).toBe(0);
    expect(positionBetween(1024, null).position).toBe(2048);
    expect(positionBetween(1024, 2048).position).toBe(1536);
  });
  it("posiciona por índice", () => {
    const col = [1024, 2048, 3072];
    expect(positionForIndex(col, 0).position).toBe(0);
    expect(positionForIndex(col, 1).position).toBe(1536);
    expect(positionForIndex(col, 3).position).toBe(4096);
    expect(positionForIndex(col, 99).position).toBe(4096);
    expect(positionForIndex(col, -5).position).toBe(0);
  });
  it("sinaliza rebalanceamento quando o espaço acaba", () => {
    expect(positionBetween(1, 1 + 1e-9).rebalance).toBe(true);
    expect(positionBetween(1, 1).rebalance).toBe(true);
  });
  it("rebalanceia em múltiplos de 1024", () => {
    expect(rebalancePositions(3)).toEqual([1024, 2048, 3072]);
  });
  it("aguenta 40 inserções sucessivas no mesmo vão sem inverter a ordem", () => {
    let prev = 1024;
    const next = 2048;
    for (let i = 0; i < 40; i++) {
      const r = positionBetween(prev, next);
      if (r.rebalance) break;
      expect(r.position).toBeGreaterThan(prev);
      expect(r.position).toBeLessThan(next);
      prev = r.position;
    }
  });
});

describe("kanban por teclado", () => {
  it("move entre colunas e respeita as bordas", () => {
    expect(adjacentStatus("todo", "right")).toBe("in_progress");
    expect(adjacentStatus("in_progress", "right")).toBe("done");
    expect(adjacentStatus("done", "right")).toBeNull();
    expect(adjacentStatus("todo", "left")).toBeNull();
    expect(adjacentStatus("done", "left")).toBe("in_progress");
  });
});

describe("desfazer em 5 s", () => {
  it("conta o tempo restante", () => {
    expect(undoRemainingMs(0, 0)).toBe(5000);
    expect(undoRemainingMs(0, 3000)).toBe(2000);
    expect(undoRemainingMs(0, 9000)).toBe(0);
  });
});

describe("busca e histórico", () => {
  it("normaliza a consulta", () => {
    expect(normalizeSearchQuery("  casa   nova ")).toBe("casa nova");
    expect(normalizeSearchQuery("a")).toBeNull();
    expect(normalizeSearchQuery("   ")).toBeNull();
    expect(normalizeSearchQuery("x".repeat(200))).toHaveLength(80);
  });
  it("descreve eventos", () => {
    expect(describeActivity("completed", "Escrever copy")).toBe("Você concluiu “Escrever copy”");
    expect(describeActivity("desconhecido")).toBe("Você atualizou um item");
  });
});

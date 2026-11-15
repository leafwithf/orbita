export type KanbanStatus = "todo" | "in_progress" | "done";

export const KANBAN_COLUMNS: { status: KanbanStatus; label: string }[] = [
  { status: "todo", label: "A fazer" },
  { status: "in_progress", label: "Em andamento" },
  { status: "done", label: "Concluída" },
];

const GAP = 1024;
const MIN_GAP = 1e-6;

export type PositionResult = { position: number; rebalance: boolean };

/**
 * Posição fracionária entre dois vizinhos. `rebalance` indica que o espaço
 * numérico acabou e a coluna precisa ser renumerada (múltiplos de GAP).
 */
export function positionBetween(
  prev: number | null,
  next: number | null,
): PositionResult {
  if (prev === null && next === null) return { position: GAP, rebalance: false };
  if (prev === null) return { position: (next as number) - GAP, rebalance: false };
  if (next === null) return { position: prev + GAP, rebalance: false };
  const position = (prev + next) / 2;
  return {
    position,
    rebalance: next - prev < MIN_GAP || position <= prev || position >= next,
  };
}

/** Posição para inserir no índice `index` de uma coluna já ordenada (sem o item movido). */
export function positionForIndex(positions: number[], index: number): PositionResult {
  const i = Math.min(Math.max(index, 0), positions.length);
  return positionBetween(positions[i - 1] ?? null, positions[i] ?? null);
}

export function rebalancePositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * GAP);
}

/** Movimento por teclado (alternativa acessível ao arrastar). */
export function adjacentStatus(
  status: KanbanStatus,
  direction: "left" | "right",
): KanbanStatus | null {
  const order = KANBAN_COLUMNS.map((c) => c.status);
  const next = order.indexOf(status) + (direction === "right" ? 1 : -1);
  return order[next] ?? null;
}

export const UNDO_WINDOW_MS = 5000;

export function undoRemainingMs(shownAt: number, now: number): number {
  return Math.max(0, UNDO_WINDOW_MS - (now - shownAt));
}

/** Normaliza a consulta como a função SQL `search_workspace` espera. */
export const MIN_SEARCH_LENGTH = 2;

export function normalizeSearchQuery(raw: string): string | null {
  const q = raw.replace(/\s+/g, " ").trim().slice(0, 80);
  return q.length >= MIN_SEARCH_LENGTH ? q : null;
}

const ACTIVITY_LABELS: Record<string, string> = {
  created: "criou",
  completed: "concluiu",
  reopened: "reabriu",
  trashed: "enviou para a lixeira",
  restored: "restaurou",
  archived: "arquivou",
  unarchived: "desarquivou",
  converted: "converteu em projeto",
  status_changed: "mudou o status de",
  stage_changed: "mudou a etapa de",
  state_changed: "mudou o estado de",
  focus_changed: "mudou o foco para",
};

export function describeActivity(verb: string, title?: string | null): string {
  const label = ACTIVITY_LABELS[verb] ?? "atualizou";
  return title ? `Você ${label} “${title}”` : `Você ${label} um item`;
}

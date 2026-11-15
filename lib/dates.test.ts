import { describe, expect, it } from "vitest";

import {
  addDaysIso,
  formatDatePtBr,
  formatMonthYearPtBr,
  formatShortDatePtBr,
  formatWeekdayDatePtBr,
  startOfWeekIso,
  todayInTimeZone,
} from "@/lib/dates";

describe("todayInTimeZone", () => {
  it("respeita o fuso na virada do dia", () => {
    // 02:30 UTC ainda é o dia anterior em São Paulo (GMT-3).
    const instant = new Date("2026-11-14T02:30:00Z");

    expect(todayInTimeZone("America/Sao_Paulo", instant)).toBe("2026-11-13");
    expect(todayInTimeZone("UTC", instant)).toBe("2026-11-14");
    expect(todayInTimeZone("Asia/Tokyo", instant)).toBe("2026-11-14");
  });

  it("não quebra com fuso inválido", () => {
    const instant = new Date("2026-11-14T12:00:00Z");
    expect(todayInTimeZone("Fuso/Invalido", instant)).toMatch(
      /^\d{4}-\d{2}-\d{2}$/,
    );
  });
});

describe("formatação de datas de calendário", () => {
  it("formata sem depender do fuso da máquina", () => {
    const formatted = formatDatePtBr("2026-11-14");

    expect(formatted).toContain("14");
    expect(formatted).toContain("2026");
    expect(formatShortDatePtBr("2026-11-14")).toBe("14/11");
  });

  it("escreve o dia da semana com inicial maiúscula", () => {
    const formatted = formatWeekdayDatePtBr("2026-11-14");

    expect(formatted).toMatch(/^Sábado/);
    expect(formatted).toContain("14");
  });

  it("mostra mês e ano por extenso", () => {
    expect(formatMonthYearPtBr("2026-11-14").toLowerCase()).toContain(
      "novembro",
    );
  });
});

describe("aritmética de datas ISO", () => {
  it("encontra a segunda-feira da semana", () => {
    // 14/11/2026 é sábado; a semana começa em 09/11.
    expect(startOfWeekIso("2026-11-14")).toBe("2026-11-09");
    // Segunda-feira continua sendo ela mesma.
    expect(startOfWeekIso("2026-11-09")).toBe("2026-11-09");
    // Domingo pertence à semana que começou na segunda anterior.
    expect(startOfWeekIso("2026-11-15")).toBe("2026-11-09");
  });

  it("atravessa meses e anos", () => {
    expect(addDaysIso("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDaysIso("2026-03-01", -1)).toBe("2026-02-28");
  });
});

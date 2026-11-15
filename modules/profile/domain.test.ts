import { describe, expect, it } from "vitest";

import {
  TIMEZONES,
  TIMEZONE_LABELS,
  isProfileTimezone,
  profileSchema,
} from "@/modules/profile/domain";

describe("fusos horários oferecidos", () => {
  it("tem rótulo para cada fuso da lista", () => {
    for (const zone of TIMEZONES) {
      expect(TIMEZONE_LABELS[zone]).toBeTruthy();
    }
  });

  it("reconhece apenas fusos suportados", () => {
    expect(isProfileTimezone("America/Sao_Paulo")).toBe(true);
    expect(isProfileTimezone("UTC")).toBe(true);
    expect(isProfileTimezone("America/Atlantida")).toBe(false);
    expect(isProfileTimezone("")).toBe(false);
  });
});

describe("profileSchema", () => {
  it("aceita nome com espaços nas pontas e fuso válido", () => {
    const parsed = profileSchema.safeParse({
      fullName: "  Ana Clara  ",
      timezone: "America/Recife",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.fullName).toBe("Ana Clara");
      expect(parsed.data.timezone).toBe("America/Recife");
    }
  });

  it("explica o que corrigir em nome vazio", () => {
    const parsed = profileSchema.safeParse({
      fullName: "   ",
      timezone: "UTC",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toMatch(/como você quer ser chamado/i);
    }
  });

  it("recusa nome longo e fuso desconhecido", () => {
    const longName = profileSchema.safeParse({
      fullName: "a".repeat(121),
      timezone: "UTC",
    });
    const badZone = profileSchema.safeParse({
      fullName: "Ana",
      timezone: "Marte/Olympus",
    });

    expect(longName.success).toBe(false);
    expect(badZone.success).toBe(false);
    if (!badZone.success) {
      expect(badZone.error.issues[0]?.message).toMatch(/fuso válido/i);
    }
  });
});

import { describe, expect, it } from "vitest";

import { firstName, getInitials } from "@/lib/names";

describe("getInitials", () => {
  it("usa a primeira e a última palavra do nome", () => {
    expect(getInitials("Ana Clara Souza")).toBe("AS");
    expect(getInitials("ana clara souza")).toBe("AS");
  });

  it("usa duas letras quando só existe um nome", () => {
    expect(getInitials("Ana")).toBe("AN");
  });

  it("lida com espaços extras e nome vazio", () => {
    expect(getInitials("   Ana   Clara  ")).toBe("AC");
    expect(getInitials("")).toBe("?");
    expect(getInitials("   ", "Ó")).toBe("Ó");
  });

  it("funciona com acentos e emojis", () => {
    expect(getInitials("Ágata Nóbrega")).toBe("ÁN");
  });
});

describe("firstName", () => {
  it("devolve apenas o primeiro nome", () => {
    expect(firstName("Ana Clara Souza")).toBe("Ana");
    expect(firstName("  Ana  ")).toBe("Ana");
  });

  it("usa um tratamento neutro quando não há nome", () => {
    expect(firstName("")).toBe("você");
    expect(firstName("   ")).toBe("você");
  });
});

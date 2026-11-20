import { describe, expect, it } from "vitest";

import {
  generatePortfolioToken,
  hashPortfolioToken,
  isValidPortfolioLink,
  portfolioErrorMessage,
  portfolioPath,
  publicProgress,
} from "./domain";

describe("portfólio — token e link", () => {
  it("gera token de 43 caracteres e hash SHA-256 hex", () => {
    const { token, hash } = generatePortfolioToken();
    expect(token).toHaveLength(43);
    expect(hash).toHaveLength(64);
    expect(hashPortfolioToken(token)).toBe(hash);
  });

  it("tokens não se repetem", () => {
    expect(generatePortfolioToken().token === generatePortfolioToken().token).toBe(false);
  });

  it("valida o formato do link e rejeita lixo", () => {
    const { token } = generatePortfolioToken();
    expect(isValidPortfolioLink("abcdef012345abcdef012345", token)).toBe(true);
    expect(isValidPortfolioLink("curto", token)).toBe(false);
    expect(isValidPortfolioLink("abcdef012345abcdef012345", "x".repeat(42))).toBe(false);
    expect(isValidPortfolioLink("ABC/../etc/passwd", token)).toBe(false);
  });

  it("monta o caminho com o token no path", () => {
    expect(portfolioPath("slug", "tok")).toBe("/p/slug/tok");
  });

  it("não vaza detalhes de erro desconhecido", () => {
    expect(portfolioErrorMessage("already_published")).toContain("já tem um link");
    expect(portfolioErrorMessage("relation x does not exist")).toBe(
      "Não foi possível concluir. Tente de novo.",
    );
  });

  it("progresso público", () => {
    expect(publicProgress(0, 0)).toBeNull();
    expect(publicProgress(1, 3)).toBe(33);
    expect(publicProgress(5, 4)).toBe(100);
  });
});

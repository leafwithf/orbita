import { createHash, randomBytes } from "node:crypto";

/** 32 bytes em base64url = 43 caracteres, igual ao convite. */
export const PORTFOLIO_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
/** 24 hex gerados pelo banco; aceitamos o mesmo intervalo da constraint. */
export const PORTFOLIO_SLUG_PATTERN = /^[a-z0-9-]{12,80}$/;
export const MAX_PORTFOLIO_SUMMARY = 600;

export function generatePortfolioToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashPortfolioToken(token) };
}

export function hashPortfolioToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** O token vai no caminho (não na query) e a página envia Referrer-Policy: no-referrer. */
export function portfolioPath(slug: string, token: string): string {
  return `/p/${slug}/${token}`;
}

export function isValidPortfolioLink(slug: string, token: string): boolean {
  return PORTFOLIO_SLUG_PATTERN.test(slug) && PORTFOLIO_TOKEN_PATTERN.test(token);
}

const ERRORS: Record<string, string> = {
  forbidden: "Você não tem permissão para publicar neste espaço.",
  already_published: "Este projeto já tem um link ativo. Revogue-o ou troque o token.",
  summary_too_long: `O resumo pode ter no máximo ${MAX_PORTFOLIO_SUMMARY} caracteres.`,
  invalid_token_hash: "Não foi possível gerar o link. Tente de novo.",
};

export function portfolioErrorMessage(code: string | null | undefined): string {
  return (code && ERRORS[code]) || "Não foi possível concluir. Tente de novo.";
}

/** Percentual para exibir publicamente; sem tarefas, não inventa progresso. */
export function publicProgress(done: number, total: number): number | null {
  if (!Number.isFinite(total) || total <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((done / total) * 100)));
}

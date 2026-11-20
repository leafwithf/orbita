import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  hashPortfolioToken,
  isValidPortfolioLink,
} from "@/modules/portfolio/domain";

export type PublicPortfolio = {
  title: string;
  objective: string | null;
  description: string | null;
  stage: string;
  summary: string | null;
  tasksTotal: number;
  tasksDone: number;
  publishedAt: string | null;
};

/** Devolve null para qualquer falha: link inválido, revogado, errado ou erro de banco. */
export async function getPublicPortfolio(
  slug: string,
  token: string,
): Promise<PublicPortfolio | null> {
  if (!isValidPortfolioLink(slug, token)) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_portfolio", {
    p_slug: slug,
    p_token_hash: hashPortfolioToken(token),
  });
  if (error || !Array.isArray(data) || data.length !== 1) return null;

  const row = data[0] as Record<string, unknown>;
  return {
    title: String(row.title),
    objective: (row.objective as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    stage: String(row.stage),
    summary: (row.summary as string | null) ?? null,
    tasksTotal: Number(row.tasks_total ?? 0),
    tasksDone: Number(row.tasks_done ?? 0),
    publishedAt: (row.published_at as string | null) ?? null,
  };
}

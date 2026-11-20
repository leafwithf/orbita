"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { FormActionState } from "@/lib/actions/state";
import { requireUser } from "@/lib/auth/session";
import { getSiteUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_PORTFOLIO_SUMMARY,
  generatePortfolioToken,
  portfolioErrorMessage,
  portfolioPath,
} from "@/modules/portfolio/domain";

export type PortfolioLinkState = FormActionState & { link?: string };

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return getSiteUrl();
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const fail = (code?: string | null): PortfolioLinkState => ({
  status: "error",
  message: portfolioErrorMessage(code),
});

const publishSchema = z.object({
  projectId: z.uuid("Escolha um projeto."),
  summary: z
    .string()
    .trim()
    .max(MAX_PORTFOLIO_SUMMARY, `Use no máximo ${MAX_PORTFOLIO_SUMMARY} caracteres.`),
});

export async function publishPortfolioAction(
  _prev: PortfolioLinkState,
  formData: FormData,
): Promise<PortfolioLinkState> {
  await requireUser();
  const parsed = publishSchema.safeParse({
    projectId: formData.get("projectId"),
    summary: formData.get("summary") ?? "",
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Confira os campos destacados.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const supabase = await createClient();
  const { token, hash } = generatePortfolioToken();
  const { data, error } = await supabase.rpc("publish_portfolio", {
    p_project: parsed.data.projectId,
    p_summary: parsed.data.summary || null,
    p_token_hash: hash,
  });
  if (error || !data) return fail(error?.message?.trim());

  const { data: entry } = await supabase
    .from("portfolio_entries")
    .select("slug")
    .eq("id", String(data))
    .single();
  if (!entry?.slug) return fail(null);

  revalidatePath("/portfolio");
  return {
    status: "success",
    message: "Link criado. Copie agora: o token não será mostrado de novo.",
    link: `${await siteOrigin()}${portfolioPath(entry.slug, token)}`,
  };
}

const entrySchema = z.object({ entryId: z.uuid() });

export async function rotatePortfolioTokenAction(
  _prev: PortfolioLinkState,
  formData: FormData,
): Promise<PortfolioLinkState> {
  await requireUser();
  const parsed = entrySchema.safeParse({ entryId: formData.get("entryId") });
  if (!parsed.success) return fail(null);

  const supabase = await createClient();
  const { token, hash } = generatePortfolioToken();
  const { error } = await supabase.rpc("rotate_portfolio_token", {
    p_entry: parsed.data.entryId,
    p_token_hash: hash,
  });
  if (error) return fail(error.message?.trim());

  const { data: entry } = await supabase
    .from("portfolio_entries")
    .select("slug")
    .eq("id", parsed.data.entryId)
    .single();
  if (!entry?.slug) return fail(null);

  revalidatePath("/portfolio");
  return {
    status: "success",
    message: "Token trocado. O link antigo deixou de funcionar. Copie o novo agora.",
    link: `${await siteOrigin()}${portfolioPath(entry.slug, token)}`,
  };
}

export async function revokePortfolioAction(formData: FormData): Promise<void> {
  await requireUser();
  const parsed = entrySchema.safeParse({ entryId: formData.get("entryId") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.rpc("revoke_portfolio", { p_entry: parsed.data.entryId });
  revalidatePath("/portfolio");
}

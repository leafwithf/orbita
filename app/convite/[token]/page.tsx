import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, Users } from "lucide-react";

import { BrandLockup } from "@/components/brand/logo";
import { acceptInvitationAction } from "@/lib/actions/collab";
import { getCurrentUser } from "@/lib/auth/session";
import { previewInvitation } from "@/lib/data/invitations";
import {
  collabErrorMessage,
  isKnownCollabError,
  isValidInviteToken,
} from "@/modules/collab/domain";
import { hashInviteToken } from "@/modules/collab/token";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/modules/workspaces/domain";

// O token vive na URL: nada de indexação nem de vazar para outros sites.
export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const dynamic = "force-dynamic";

const STATE_MESSAGES = {
  used: "invitation_used",
  revoked: "invitation_revoked",
  expired: "invitation_expired",
} as const;

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md content-center gap-6 px-4 py-10">
      <BrandLockup />
      <div className="orbita-panel rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-1)]">{children}</div>
    </main>
  );
}

function Problem({ message }: { message: string }) {
  return (
    <Shell>
      <p role="alert" className="flex items-start gap-2 text-[14px]">
        <AlertCircle className="mt-0.5 size-5 flex-none text-danger" aria-hidden="true" />
        {message}
      </p>
      <Link href="/" className="mt-4 inline-flex min-h-11 items-center text-[13px] font-semibold text-brand">
        Ir para o início
      </Link>
    </Shell>
  );
}

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { token } = await params;
  const { erro } = await searchParams;

  if (!isValidInviteToken(token)) {
    return <Problem message={collabErrorMessage("invitation_invalid")} />;
  }

  const user = await getCurrentUser();
  const here = `/convite/${token}`;

  // Sem sessão não mostramos nada sobre o espaço: só pedimos para entrar.
  if (!user) {
    const next = encodeURIComponent(here);
    return (
      <Shell>
        <h1 className="text-[18px] font-semibold">Você recebeu um convite</h1>
        <p className="mt-2 text-[14px] text-muted">
          Entre na sua conta ou crie uma para ver o espaço e aceitar o convite.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href={`/login?proximo=${next}`} className="inline-flex min-h-11 items-center rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline">
            Entrar
          </Link>
          <Link href={`/criar-conta?proximo=${next}`} className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 text-[13px] font-semibold text-ink no-underline hover:bg-surface-2 hover:no-underline">
            Criar conta
          </Link>
        </div>
      </Shell>
    );
  }

  const preview = await previewInvitation(hashInviteToken(token));
  if (!preview) return <Problem message={collabErrorMessage("invitation_invalid")} />;

  if (preview.state !== "valid") {
    return <Problem message={collabErrorMessage(STATE_MESSAGES[preview.state])} />;
  }

  const blocked = preview.emailBound && !preview.emailMatches;
  const error = erro && isKnownCollabError(erro) ? collabErrorMessage(erro) : null;

  return (
    <Shell>
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand">
          <Users className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[12px] text-muted">
            {preview.invitedByName ? `${preview.invitedByName} convidou você para` : "Você foi convidado para"}
          </p>
          <h1 className="text-[18px] leading-tight font-semibold">{preview.workspaceName}</h1>
        </div>
      </div>

      <dl className="mt-5 grid gap-1 rounded-md border border-border bg-surface-2 p-3 text-[13px]">
        <dt className="font-semibold">Seu papel: {ROLE_LABELS[preview.role]}</dt>
        <dd className="text-muted">{ROLE_DESCRIPTIONS[preview.role]}</dd>
      </dl>

      {error ? (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          {error}
        </p>
      ) : null}

      {blocked ? (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          {collabErrorMessage("invitation_email_mismatch")}
        </p>
      ) : (
        <form action={acceptInvitationAction} className="mt-5">
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-brand px-5 text-[14px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Aceitar convite
          </button>
          <p className="mt-2 text-[11.5px] text-faint">
            Você só entra no espaço depois de aceitar. O convite vale uma única vez.
          </p>
        </form>
      )}
    </Shell>
  );
}

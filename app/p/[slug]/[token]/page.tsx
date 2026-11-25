import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrandLockup } from "@/components/brand/logo";
import { getPublicPortfolio } from "@/lib/data/portfolio-public";
import { formatDatePtBr } from "@/lib/dates";
import { projectStageLabel } from "@/modules/projects/domain";
import { publicProgress } from "@/modules/portfolio/domain";

export const dynamic = "force-dynamic";

// Nunca indexar, nunca vazar o token por Referer, nunca guardar em cache.
export const metadata: Metadata = {
  title: "Projeto",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { slug, token } = await params;
  const item = await getPublicPortfolio(slug, token);
  if (!item) notFound();

  const progress = publicProgress(item.tasksDone, item.tasksTotal);

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-2xl content-start gap-6 px-4 py-10">
      <BrandLockup />

      <article className="orbita-panel grid gap-5 rounded-lg border border-border bg-surface p-5 sm:p-7">
        <header className="grid gap-2">
          <p className="text-[12px] font-semibold tracking-wide text-brand uppercase">
            {projectStageLabel(item.stage)}
          </p>
          <h1 className="text-2xl leading-tight font-semibold">{item.title}</h1>
          {item.summary ? (
            <p className="text-[15px] leading-relaxed text-muted">{item.summary}</p>
          ) : null}
        </header>

        {item.objective ? (
          <section aria-labelledby="objetivo" className="grid gap-1">
            <h2 id="objetivo" className="text-[13px] font-semibold">
              Objetivo
            </h2>
            <p className="text-[14px] leading-relaxed">{item.objective}</p>
          </section>
        ) : null}

        {item.description ? (
          <section aria-labelledby="sobre" className="grid gap-1">
            <h2 id="sobre" className="text-[13px] font-semibold">
              Sobre
            </h2>
            <p className="text-[14px] leading-relaxed whitespace-pre-line">{item.description}</p>
          </section>
        ) : null}

        {progress !== null ? (
          <section aria-labelledby="progresso" className="grid gap-1.5">
            <h2 id="progresso" className="text-[13px] font-semibold">
              Progresso
            </h2>
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso do projeto: ${progress}%`}
              className="h-2 overflow-hidden rounded-full bg-surface-2"
            >
              <div className="h-full bg-brand" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-[12.5px] text-muted">
              {item.tasksDone} de {item.tasksTotal} tarefas concluídas
            </p>
          </section>
        ) : null}

        {item.publishedAt ? (
          <p className="text-[12px] text-faint">
            Publicado em {formatDatePtBr(item.publishedAt.slice(0, 10))}
          </p>
        ) : null}
      </article>

      <p className="text-center text-[11.5px] text-faint">
        Página compartilhada por link privado. Não aparece em buscadores.
      </p>
    </main>
  );
}

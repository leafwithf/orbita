import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

import { EmptyState } from "@/components/patterns/empty-state";
import { PageHeader } from "@/components/patterns/page-header";
import { ProjectCard } from "@/components/projects/project-card";
import { getAppContext } from "@/lib/data/context";
import { listProjects } from "@/lib/data/projects";

export const metadata: Metadata = { title: "Projetos" };

export default async function ProjectsPage() {
  const context = await getAppContext();

  if (!context.workspace) {
    return (
      <PageHeader
        title="Projetos"
        description="Seu espaço ainda não está disponível. Rode as migrações do Supabase para começar."
      />
    );
  }

  const projects = await listProjects({
    workspaceId: context.workspace.id,
    today: context.today,
  });

  const active = projects.filter((project) => project.status === "active");
  const paused = projects.filter((project) => project.status === "paused");
  const completed = projects.filter((project) => project.status === "completed");

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow={`${projects.length} ${projects.length === 1 ? "projeto" : "projetos"}`}
        title="Projetos"
        description="Tudo o que você está construindo, sem jargão de método. Cada projeto tem um próximo passo claro."
        actions={
          <Link
            href="/criar?tipo=projeto"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3.5 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
          >
            <Plus className="size-4" aria-hidden="true" />
            Novo projeto
          </Link>
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Nenhum projeto ainda"
          description="Um projeto reúne tarefas, prazos, arquivos e o próximo passo. Comece com algo pequeno: uma entrega que caiba nas próximas semanas."
          action={
            <Link
              href="/criar?tipo=projeto"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
            >
              <Plus className="size-4" aria-hidden="true" />
              Criar meu primeiro projeto
            </Link>
          }
        />
      ) : (
        <div className="grid gap-7">
          {active.length > 0 ? (
            <section aria-labelledby="ativos" className="grid gap-3">
              <h2
                id="ativos"
                className="text-[13px] font-semibold tracking-[0.04em] text-muted uppercase"
              >
                Em andamento · {active.length}
              </h2>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {active.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          ) : null}

          {paused.length > 0 ? (
            <section aria-labelledby="pausados" className="grid gap-3">
              <h2
                id="pausados"
                className="text-[13px] font-semibold tracking-[0.04em] text-muted uppercase"
              >
                Pausados · {paused.length}
              </h2>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {paused.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          ) : null}

          {completed.length > 0 ? (
            <section aria-labelledby="concluidos" className="grid gap-3">
              <h2
                id="concluidos"
                className="text-[13px] font-semibold tracking-[0.04em] text-muted uppercase"
              >
                Concluídos · {completed.length}
              </h2>
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {completed.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { Globe2 } from "lucide-react";

import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { LinkBox } from "@/components/portfolio/link-box";
import { publishPortfolioAction, type PortfolioLinkState } from "@/lib/actions/portfolio";
import { MAX_PORTFOLIO_SUMMARY } from "@/modules/portfolio/domain";

const initial: PortfolioLinkState = { status: "idle" };

export function PublishForm({ projects }: { projects: { id: string; title: string }[] }) {
  const [state, formAction, pending] = useActionState(publishPortfolioAction, initial);

  if (projects.length === 0) {
    return (
      <p className="text-[12.5px] leading-relaxed text-muted">
        Todos os projetos já têm link ativo, ou você ainda não criou nenhum projeto.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <form action={formAction} className="grid gap-3">
        <div className="grid gap-1.5">
          <label htmlFor="pf-project" className="text-[13px] font-medium">
            Projeto
          </label>
          <select
            id="pf-project"
            name="projectId"
            required
            aria-invalid={state.fieldErrors?.projectId ? true : undefined}
            className="h-11 rounded-md border border-border-strong bg-surface px-3 text-[15px] md:text-sm"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          {state.fieldErrors?.projectId?.[0] ? (
            <p className="text-xs text-danger">{state.fieldErrors.projectId[0]}</p>
          ) : null}
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="pf-summary" className="text-[13px] font-medium">
            Resumo público <span className="font-normal text-faint">(opcional)</span>
          </label>
          <textarea
            id="pf-summary"
            name="summary"
            rows={3}
            maxLength={MAX_PORTFOLIO_SUMMARY}
            aria-describedby="pf-summary-hint"
            className="rounded-md border border-border-strong bg-surface px-3 py-2 text-[15px] md:text-sm"
          />
          <p id="pf-summary-hint" className="text-xs leading-relaxed text-faint">
            Aparece para quem abrir o link, junto com título, objetivo, descrição, etapa e
            contagem de tarefas concluídas. Riscos, próximo passo, tarefas, arquivos e pessoas
            nunca são exibidos.
          </p>
        </div>

        {state.status === "error" ? <FormMessage status="error" message={state.message} /> : null}

        <div>
          <SubmitButton pending={pending} pendingLabel="Criando…">
            <Globe2 className="size-4" aria-hidden="true" />
            Criar link não listado
          </SubmitButton>
        </div>
      </form>

      {state.status === "success" && state.link ? (
        <LinkBox link={state.link} message={state.message} />
      ) : null}
    </div>
  );
}

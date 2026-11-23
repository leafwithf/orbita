"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  FolderKanban,
  LayoutDashboard,
  Lightbulb,
  Settings2,
  Target,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STORAGE_KEY = "orbita:tour:v1";
const OPEN_EVENT = "orbita:open-tour";

const steps = [
  {
    icon: Compass,
    title: "Bem-vindo ao Órbita",
    description:
      "Seu espaço para organizar trabalho, projetos e ideias. O objetivo ? deixar tudo importante visível sem transformar sua rotina em uma lista interminável.",
    detail: "Vamos conhecer sete partes do aplicativo. Você pode avançar no seu ritmo.",
  },
  {
    icon: LayoutDashboard,
    title: "Seu painel de controle",
    description:
      "O painel reúne uma visão geral da sua atividade, tarefas importantes e atalhos para continuar de onde parou.",
    detail: "Use o painel como ponto de partida para organizar o dia.",
  },
  {
    icon: FolderKanban,
    title: "Projetos e tarefas",
    description:
      "Separe seu trabalho em projetos e transforme objetivos em tarefas menores. Cada tarefa pode ter informações, prazos e acompanhamento próprios.",
    detail: "Acesse Projetos e Tarefas pelo menu principal.",
  },
  {
    icon: Target,
    title: "Quadro e organização",
    description:
      "No quadro Kanban, acompanhe o andamento das tarefas por etapas. Mova os cartões conforme o trabalho evolui.",
    detail: "No celular, deslize entre as colunas e use os controles dos cartões.",
  },
  {
    icon: Lightbulb,
    title: "Foco e produtividade",
    description:
      "A área de Foco ajuda a escolher o que merece atenção agora, reunindo seu próximo passo e uma fila de atividades.",
    detail: "Escolha uma prioridade por vez para manter clareza.",
  },
  {
    icon: FolderKanban,
    title: "Arquivos e portfólio",
    description:
      "Organize arquivos no espaço de trabalho e escolha quais projetos deseja apresentar no portfólio.",
    detail: "Publicações são separadas do conteúdo privado e podem ser revogadas.",
  },
  {
    icon: Settings2,
    title: "Seu espaço, suas regras",
    description:
      "Em Configurações, personalize a aparência, confira seus dados e ajuste as preferências de acessibilidade.",
    detail: "Pronto! Você pode reabrir este guia quando quiser, pelas Configurações.",
  },
];

function readSavedStep() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved || !saved.startsWith("paused:")) return 0;
    const value = Number(saved.slice("paused:".length));
    return Number.isInteger(value) && value >= 0 && value < steps.length
      ? value
      : 0;
  } catch {
    return 0;
  }
}

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let saved = null;

    try {
      saved = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      saved = "completed";
    }

    function handleOpen() {
      setStepIndex(readSavedStep());
      setOpen(true);
    }

    window.addEventListener(OPEN_EVENT, handleOpen);

    if (!saved) {
      try {
        window.localStorage.setItem(STORAGE_KEY, "paused:0");
      } catch {}
      window.dispatchEvent(new Event(OPEN_EVENT));
    }

    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  function pauseTour() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "paused:" + stepIndex);
    } catch {}
    setOpen(false);
  }

  function skipTour() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "completed");
    } catch {}
    setOpen(false);
  }

  function nextStep() {
    if (stepIndex === steps.length - 1) {
      skipTour();
      return;
    }

    const next = stepIndex + 1;
    setStepIndex(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, "paused:" + next);
    } catch {}
  }

  function previousStep() {
    const previous = Math.max(0, stepIndex - 1);
    setStepIndex(previous);
    try {
      window.localStorage.setItem(STORAGE_KEY, "paused:" + previous);
    } catch {}
  }

  const current = steps[stepIndex];
  const StepIcon = current.icon;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) pauseTour();
        else setOpen(true);
      }}
    >
      <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-[24px] border-brand/25 bg-[linear-gradient(145deg,var(--surface),var(--surface-2))] p-5 shadow-[var(--shadow-2)] sm:p-7">
        <DialogHeader className="gap-3 pr-7 text-left">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 text-brand">
            <StepIcon className="size-6" aria-hidden="true" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Guia do Órbita
            </span>
            <span className="text-xs tabular-nums text-muted">
              Etapa {stepIndex + 1} de {steps.length}
            </span>
          </div>
          <div
            className="grid grid-cols-7 gap-1.5"
            aria-label={"Progresso: etapa " + (stepIndex + 1) + " de " + steps.length}
          >
            {steps.map((item, index) => (
              <span
                key={item.title}
                className={
                  "h-1.5 rounded-full " +
                  (index <= stepIndex ? "bg-brand" : "bg-border")
                }
              />
            ))}
          </div>
          <DialogTitle className="pt-2 text-xl leading-tight sm:text-2xl">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-muted">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border bg-surface/80 p-4">
          <p className="text-[12px] font-semibold text-ink">Dica rápida</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            {current.detail}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:items-center">
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 sm:mr-auto"
            onClick={skipTour}
          >
            Pular tour
          </Button>
          {stepIndex > 0 ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11"
              onClick={previousStep}
            >
              <ArrowLeft aria-hidden="true" />
              Voltar
            </Button>
          ) : null}
          <Button
            type="button"
            className="min-h-11"
            onClick={nextStep}
          >
            {stepIndex === steps.length - 1 ? (
              <>
                Concluir
                <CheckCircle2 aria-hidden="true" />
              </>
            ) : (
              <>
                Próxima etapa
                <ArrowRight aria-hidden="true" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

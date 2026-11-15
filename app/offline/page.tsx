import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff, RefreshCw } from "lucide-react";

import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Sem conexão",
  description: "Você está offline. Seus dados continuam no servidor.",
};

export default function OfflinePage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-[var(--shadow-2)] sm:p-8">
        <span className="inline-grid size-11 place-items-center rounded-[12px] bg-gradient-to-br from-[#2c6be0] to-[#1d4fb8] text-white">
          <LogoMark className="size-6" />
        </span>

        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-warning/35 bg-warning-soft px-2.5 py-0.5 text-[11.5px] font-semibold text-[var(--warning-700)]">
          <CloudOff className="size-3" aria-hidden="true" />
          Sem conexão
        </span>

        <h1 className="mt-2 text-[24px] leading-tight font-semibold tracking-[-0.02em]">
          Você está offline.
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          A ÓRBITA não guarda dados do seu espaço no cache do aplicativo. Quando
          a conexão voltar, recarregue para ver as informações mais recentes.
        </p>

        <ul className="mt-4 grid gap-2 rounded-md border border-border bg-surface-2 px-3.5 py-3 text-[12.5px] leading-relaxed text-muted">
          <li>O que você já tinha aberto continua na tela até recarregar.</li>
          <li>Nenhuma alteração é enviada enquanto estiver offline.</li>
          <li>Nada é perdido: os dados ficam no servidor.</li>
        </ul>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white no-underline hover:bg-brand-hover hover:no-underline"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Tentar novamente
          </Link>
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
          Dica: instale a ÓRBITA na tela inicial para abrir mais rápido. A
          instalação não baixa seus projetos para o dispositivo.
        </p>
      </div>
    </main>
  );
}

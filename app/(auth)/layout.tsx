import type { ReactNode } from "react";
import { Check } from "lucide-react";

import { BrandLockup, LogoMark } from "@/components/brand/logo";

const BENEFITS = [
  "Um projeto principal por vez — sem culpa e sem ruído.",
  "Tarefas com prazo claro: atrasada, hoje ou sem prazo.",
  "Projetos, cursos e arquivos no mesmo espaço.",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-[#101827] px-10 py-10 text-white lg:flex lg:flex-col xl:px-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-[420px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 bottom-[-120px] size-[360px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/3 right-16 text-white/10"
        >
          <LogoMark className="size-24" />
        </div>

        <BrandLockup />

        <div className="relative my-auto max-w-[440px] py-16">
          <p className="mb-4 text-[11px] font-semibold tracking-[0.16em] text-[#8fb4ff] uppercase">
            Clareza antes de velocidade
          </p>
          <h2 className="text-[34px] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">
            Menos abas abertas.
            <br />
            Mais clareza sobre o próximo passo.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-[#aab6c8]">
            O ÓRBITA reúne ideias, projetos, tarefas, cursos e arquivos em um só
            lugar — com uma decisão de cada vez.
          </p>

          <ul className="mt-8 grid gap-3">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 text-[14px] leading-relaxed text-[#d6dfec]"
              >
                <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-[#1c3358] text-[#8fb4ff]">
                  <Check className="size-3" aria-hidden="true" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs leading-relaxed text-[#7f8ca3]">
          Alpha privado · Sem cobrança · Sem anúncios
        </p>
      </aside>

      <main
        id="conteudo"
        className="flex min-w-0 items-center justify-center bg-background px-5 py-10 sm:px-8 lg:px-12"
      >
        {children}
      </main>
    </div>
  );
}

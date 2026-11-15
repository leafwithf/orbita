import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { SetupNotice } from "@/components/auth/form-message";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/errors";

export const metadata: Metadata = { title: "Entrar" };

const ERRORS: Record<string, string> = {
  "link-expirado": "Este link expirou ou já foi usado. Solicite um novo.",
  "link-invalido": "O link não é válido. Tente entrar novamente.",
  "sessao-expirada": "Sua sessão expirou. Entre novamente para continuar.",
};

type SearchParams = Promise<{
  proximo?: string;
  erro?: string;
  aviso?: string;
}>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const proximo = safeNextPath(params.proximo ?? "/");
  const message = params.erro ? ERRORS[params.erro] : undefined;
  const notice = params.aviso === "saiu" ? "Você saiu com segurança." : undefined;

  return (
    <AuthCard
      eyebrow="Bem-vindo de volta"
      title="Entrar no ÓRBITA"
      description="Retome de onde parou. Seu foco, suas tarefas e seus arquivos estão aqui."
      footer={
        <>
          Ainda não tem uma conta?{" "}
          <Link
            href={
              proximo === "/"
                ? "/criar-conta"
                : `/criar-conta?proximo=${encodeURIComponent(proximo)}`
            }
            className="font-medium"
          >
            Criar conta
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <LoginForm
        proximo={proximo}
        initialMessage={message ?? notice}
      />
    </AuthCard>
  );
}

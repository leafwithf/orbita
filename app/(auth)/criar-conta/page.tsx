import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SetupNotice } from "@/components/auth/form-message";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { safeNextPath } from "@/lib/auth/errors";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Criar conta" };

type SearchParams = Promise<{ proximo?: string }>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const proximo = safeNextPath(params.proximo ?? "/");

  return (
    <AuthCard
      eyebrow="Comece pelo essencial"
      title="Criar sua conta"
      description="Um espaço pessoal é criado automaticamente. Você pode convidar pessoas depois, sem pressa."
      footer={
        <>
          Já tem uma conta?{" "}
          <Link
            href={
              proximo === "/"
                ? "/login"
                : `/login?proximo=${encodeURIComponent(proximo)}`
            }
            className="font-medium"
          >
            Entrar
          </Link>
        </>
      }
    >
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <SignUpForm proximo={proximo} />
    </AuthCard>
  );
}

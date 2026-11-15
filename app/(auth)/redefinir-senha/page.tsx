import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SetupNotice } from "@/components/auth/form-message";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Criar nova senha" };

export default async function ResetPasswordPage() {
  const user = await getCurrentUser();

  return (
    <AuthCard
      eyebrow="Quase lá"
      title="Criar uma nova senha"
      description={
        user
          ? "Escolha uma senha nova. Você continuará conectado neste aparelho."
          : "Abra o link que enviamos para o seu e-mail para liberar a troca de senha."
      }
      footer={
        <Link href="/login" className="font-medium">
          Voltar para entrar
        </Link>
      }
    >
      {!isSupabaseConfigured() ? <SetupNotice /> : null}

      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="grid gap-4">
          <p className="rounded-md border border-border bg-surface-2 px-4 py-3 text-sm leading-relaxed text-muted">
            Por segurança, este endereço só funciona com um link de recuperação
            válido. Se o link expirou, peça outro.
          </p>
          <Button asChild className="h-11 w-full bg-brand text-white">
            <Link href="/recuperar-senha">Pedir novo link</Link>
          </Button>
        </div>
      )}
    </AuthCard>
  );
}

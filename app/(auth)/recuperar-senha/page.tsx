import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { SetupNotice } from "@/components/auth/form-message";
import { RecoveryForm } from "@/components/auth/recovery-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoveryPage() {
  return (
    <AuthCard
      eyebrow="Acesso à conta"
      title="Recuperar sua senha"
      description="Informe o e-mail da conta. Enviaremos um link para você criar uma nova senha."
      footer={
        <Link href="/login" className="font-medium">
          Voltar para entrar
        </Link>
      }
    >
      {!isSupabaseConfigured() ? <SetupNotice /> : null}
      <RecoveryForm />
    </AuthCard>
  );
}

import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSupabaseConfigured } from "@/lib/env";
import { cn } from "@/lib/utils";

export function SetupNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <Alert className="mb-6 border-warning/40 bg-warning-soft text-ink">
      <AlertCircle className="text-[var(--warning-700)]" aria-hidden="true" />
      <AlertDescription className="text-ink">
        <strong className="font-semibold">Modo de configuração.</strong> Este
        ambiente ainda não tem o Supabase conectado. Copie{" "}
        <code className="rounded bg-black/5 px-1 py-0.5 text-[12px]">
          .env.example
        </code>{" "}
        para{" "}
        <code className="rounded bg-black/5 px-1 py-0.5 text-[12px]">
          .env.local
        </code>{" "}
        e preencha a URL e a chave pública do projeto.
      </AlertDescription>
    </Alert>
  );
}

export function FormMessage({
  status,
  message,
}: {
  status: "error" | "success";
  message?: string;
}) {
  if (!message) return null;

  const isError = status === "error";

  return (
    <Alert
      variant={isError ? "destructive" : "default"}
      className={cn(
        "mb-5",
        isError
          ? "border-danger/30 bg-danger-soft"
          : "border-success/30 bg-success-soft",
      )}
    >
      {isError ? (
        <AlertCircle aria-hidden="true" />
      ) : (
        <CheckCircle2 aria-hidden="true" className="text-[var(--success-700)]" />
      )}
      <AlertDescription className={cn(isError ? "text-danger" : "text-ink")}>
        {message}
      </AlertDescription>
    </Alert>
  );
}

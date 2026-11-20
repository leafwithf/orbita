"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function LinkBox({ link, message }: { link: string; message?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false); // o campo continua selecionável
    }
  }

  return (
    <div role="status" className="grid gap-2 rounded-md border border-success/30 bg-success-soft p-3">
      {message ? <p className="text-[13px] font-medium">{message}</p> : null}
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          aria-label="Link do portfólio"
          onFocus={(event) => event.currentTarget.select()}
          className="h-11 min-w-0 flex-1 rounded-md border border-border-strong bg-surface px-3 text-[13px]"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-[12.5px] font-semibold hover:bg-surface-2"
        >
          {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
    </div>
  );
}

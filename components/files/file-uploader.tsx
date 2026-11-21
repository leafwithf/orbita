"use client";

import { useRef, useState, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Upload, X } from "lucide-react";

import { abortUploadAction } from "@/lib/actions/mvp";
import {
  ALLOWED_TYPES,
  formatBytes,
  validateUploadRequest,
} from "@/modules/files/domain";
import { cn } from "@/lib/utils";

type Phase = "signing" | "uploading" | "verifying" | "ready" | "quarantined" | "error" | "cancelled";

type Upload = {
  key: string;
  file: File;
  phase: Phase;
  progress: number;
  message?: string;
  fileId?: string;
};

const ACCEPT = [
  ...Object.keys(ALLOWED_TYPES),
  ...Object.values(ALLOWED_TYPES).flatMap((rule) => rule.extensions.map((ext) => `.${ext}`)),
].join(",");

const PHASE_LABEL: Record<Phase, string> = {
  signing: "Preparando…",
  uploading: "Enviando",
  verifying: "Conferindo o arquivo…",
  ready: "Pronto",
  quarantined: "Em análise",
  error: "Falhou",
  cancelled: "Cancelado",
};

const ACTIVE: Phase[] = ["signing", "uploading", "verifying"];

export function FileUploader({ workspaceId, projectId }: { workspaceId: string; projectId?: string }) {
  const router = useRouter();
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragging, setDragging] = useState(false);
  const xhrs = useRef(new Map<string, XMLHttpRequest>());
  const cancelled = useRef(new Set<string>());
  const input = useRef<HTMLInputElement>(null);

  const patch = (key: string, change: Partial<Upload>) =>
    setUploads((current) => current.map((item) => (item.key === key ? { ...item, ...change } : item)));

  async function run(key: string, file: File) {
    patch(key, { phase: "signing", progress: 0, message: undefined });

    const check = validateUploadRequest({ name: file.name, size: file.size, mime: file.type });
    if (!check.ok) return patch(key, { phase: "error", message: check.message });

    let fileId: string | undefined;
    try {
      const signRes = await fetch("/api/files/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name: file.name, size: file.size, mime: file.type, ...(projectId ? { entityType: "project", entityId: projectId } : {}) }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) {
        return patch(key, { phase: "error", message: sign.message ?? "Não foi possível iniciar o envio." });
      }
      fileId = sign.fileId as string;
      patch(key, { fileId, phase: "uploading" });

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrs.current.set(key, xhr);
        xhr.open("PUT", sign.signedUrl as string);
        xhr.setRequestHeader("x-upsert", "false");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) patch(key, { progress: Math.round((event.loaded / event.total) * 100) });
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("upload_failed")));
        xhr.onerror = () => reject(new Error("network"));
        xhr.onabort = () => reject(new Error("aborted"));
        const body = new FormData();
        body.append("cacheControl", "3600");
        body.append("", file);
        xhr.send(body);
      });
      xhrs.current.delete(key);

      patch(key, { phase: "verifying", progress: 100 });
      const doneRes = await fetch(`/api/files/${fileId}/complete`, { method: "POST" });
      const done = await doneRes.json();
      if (!doneRes.ok) return patch(key, { phase: "error", message: "Não foi possível concluir o envio." });

      patch(key, done.status === "ready" ? { phase: "ready" } : { phase: "quarantined", message: done.message });
      router.refresh();
    } catch (error) {
      xhrs.current.delete(key);
      if (fileId) void abortUploadAction(fileId);
      if (cancelled.current.has(key) || (error instanceof Error && error.message === "aborted")) {
        patch(key, { phase: "cancelled", message: "Envio cancelado." });
      } else {
        patch(key, { phase: "error", message: "A conexão falhou. Tente de novo." });
      }
      router.refresh();
    }
  }

  async function start(files: FileList | File[]) {
    const list = Array.from(files);
    const added = list.map((file) => ({
      key: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      phase: "signing" as Phase,
      progress: 0,
    }));
    setUploads((current) => [...added, ...current].slice(0, 8));
    for (const item of added) await run(item.key, item.file);
  }

  function cancel(item: Upload) {
    cancelled.current.add(item.key);
    const xhr = xhrs.current.get(item.key);
    if (xhr) xhr.abort();
  }

  function retry(item: Upload) {
    cancelled.current.delete(item.key);
    void run(item.key, item.file);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 0) void start(event.dataTransfer.files);
  }

  return (
    <div className="grid gap-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-lg border border-dashed border-border-strong p-5 text-center",
          dragging && "border-brand bg-brand-soft",
        )}
      >
        <Upload className="mx-auto size-6 text-brand" aria-hidden="true" />
        <p className="mt-2 text-[13px] text-muted">
          Arraste arquivos aqui ou escolha no aparelho. Até 25 MB cada.
        </p>
        <label htmlFor="file-input" className="sr-only">
          Escolher arquivos para enviar
        </label>
        <input
          ref={input}
          id="file-input"
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) void start(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => input.current?.click()}
          className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand px-4 text-[13px] font-semibold text-white hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Upload className="size-4" aria-hidden="true" />
          Escolher arquivos
        </button>
      </div>

      {uploads.length > 0 ? (
        <ul className="grid gap-2" aria-live="polite">
          {uploads.map((item) => {
            const active = ACTIVE.includes(item.phase);
            return (
              <li key={item.key} className="rounded-md border border-border bg-surface p-3">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-[13px] font-medium">{item.file.name}</p>
                  <span className="text-[11.5px] text-faint">{formatBytes(item.file.size)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {active ? (
                    <progress
                      className="h-2 min-w-0 flex-1"
                      max={100}
                      value={item.phase === "signing" ? undefined : item.progress}
                      aria-label={`Progresso do envio de ${item.file.name}`}
                    />
                  ) : (
                    <span className="flex-1" />
                  )}
                  <span className="text-[12px] font-medium">
                    {item.phase === "uploading" ? `${item.progress}%` : PHASE_LABEL[item.phase]}
                  </span>
                  {active && item.phase !== "verifying" ? (
                    <button
                      type="button"
                      onClick={() => cancel(item)}
                      aria-label={`Cancelar envio de ${item.file.name}`}
                      className="grid size-11 place-items-center rounded-md border border-border-strong hover:bg-surface-2"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                  {item.phase === "verifying" ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {item.phase === "error" || item.phase === "cancelled" ? (
                    <button
                      type="button"
                      onClick={() => retry(item)}
                      aria-label={`Tentar de novo: ${item.file.name}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-border-strong px-3 text-[12.5px] font-semibold hover:bg-surface-2"
                    >
                      <RotateCcw className="size-4" aria-hidden="true" />
                      Tentar de novo
                    </button>
                  ) : null}
                </div>
                {item.message ? <p className="mt-1.5 text-[12px] text-muted">{item.message}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

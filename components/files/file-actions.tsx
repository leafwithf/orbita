"use client";

import { useRouter } from "next/navigation";
import { Download, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { restoreItemAction, trashItemAction } from "@/lib/actions/mvp";
import { isInlinePreviewable } from "@/modules/files/domain";

const base =
  "grid size-11 place-items-center rounded-md border border-border-strong bg-surface text-muted no-underline transition-colors hover:bg-surface-2 hover:text-ink hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function FileActions({
  fileId,
  fileName,
  mime,
  ready,
  canManage = true,
}: {
  fileId: string;
  fileName: string;
  mime: string;
  ready: boolean;
  canManage?: boolean;
}) {
  const router = useRouter();

  async function trash() {
    const result = await trashItemAction("files", fileId);
    if (result.status === "error") {
      toast.error(result.message ?? "Não foi possível excluir o arquivo.");
      return;
    }
    router.refresh();
    toast("Arquivo movido para a lixeira.", {
      description: fileName,
      duration: 8000,
      action: {
        label: "Desfazer",
        onClick: () => {
          void restoreItemAction("files", fileId).then(() => router.refresh());
        },
      },
    });
  }

  return (
    <div className="flex flex-none gap-1.5">
      {ready && isInlinePreviewable(mime) ? (
        <a
          href={`/api/files/${fileId}/url`}
          target="_blank"
          rel="noopener noreferrer"
          className={base}
          aria-label={`Visualizar ${fileName}`}
          title="Visualizar"
        >
          <Eye className="size-4" aria-hidden="true" />
        </a>
      ) : null}
      {ready ? (
        <a
          href={`/api/files/${fileId}/url?baixar=1`}
          className={base}
          aria-label={`Baixar ${fileName}`}
          title="Baixar"
        >
          <Download className="size-4" aria-hidden="true" />
        </a>
      ) : null}
      {canManage ? (
        <button type="button" onClick={trash} className={base} aria-label={`Excluir ${fileName}`} title="Excluir">
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

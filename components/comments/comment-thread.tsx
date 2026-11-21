"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FormMessage } from "@/components/auth/form-message";
import { SubmitButton } from "@/components/forms/submit-button";
import { UserAvatar } from "@/components/layout/user-avatar";
import { addCommentAction, deleteCommentAction, editCommentAction } from "@/lib/actions/collab";
import { initialFormState } from "@/lib/actions/state";
import type { CommentEntity, CommentItem } from "@/lib/data/comments";
import { formatDateTimePtBr } from "@/lib/dates";
import { MAX_COMMENT_LENGTH } from "@/modules/collab/domain";

export function CommentThread({
  workspaceId,
  entityType,
  entityId,
  comments,
  viewerId,
  canComment,
  canModerate,
  files = [],
}: {
  workspaceId: string;
  entityType: CommentEntity;
  entityId: string;
  comments: CommentItem[];
  viewerId: string;
  canComment: boolean;
  canModerate: boolean;
  files?: { id: string; fileName: string }[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(addCommentAction, initialFormState);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newBody, setNewBody] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const newBodyRef = useRef<HTMLTextAreaElement>(null);

  function updateComposer(value: string, cursor: number) {
    setNewBody(value);
    const before = value.slice(0, cursor);
    const at = before.lastIndexOf("@");
    const query = at >= 0 ? before.slice(at + 1) : "";
    const previous = at > 0 ? before[at - 1] : " ";
    if (at >= 0 && /\s/.test(previous) && !/[\n@]/.test(query) && query.length <= 60) {
      setMentionQuery(query.toLocaleLowerCase("pt-BR"));
      setMentionStart(at);
    } else {
      setMentionQuery(null);
      setMentionStart(null);
    }
  }

  function insertMention(file: { id: string; fileName: string }) {
    if (mentionStart === null || !newBodyRef.current) return;
    const cursor = newBodyRef.current.selectionStart;
    const token = "[[arquivo:" + file.id + "|" + file.fileName + "]]";
    const next = newBody.slice(0, mentionStart) + token + " " + newBody.slice(cursor);
    setNewBody(next);
    setMentionQuery(null);
    setMentionStart(null);
    requestAnimationFrame(() => {
      const position = mentionStart + token.length + 1;
      newBodyRef.current?.focus();
      newBodyRef.current?.setSelectionRange(position, position);
    });
  }

  function renderBody(body: string) {
    const parts = body.split(/(\\[\\[arquivo:[0-9a-f-]{36}\\|[^\\]]+\\]\\])/gi);
    return parts.map((part, index) => {
      const match = /^\\[\\[arquivo:([0-9a-f-]{36})\\|([^\\]]+)\\]\\]$/i.exec(part);
      return match ? (
        <a key={index} href={"/api/files/" + match[1] + "/url"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-brand-soft px-1.5 py-0.5 font-medium text-brand underline underline-offset-2">
          <FileText className="size-3.5" aria-hidden="true" />{match[2]}
        </a>
      ) : <span key={index}>{part}</span>;
    });
  }
  const commentFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      commentFormRef.current?.reset();
      setNewBody("");
      setMentionQuery(null);
      setMentionStart(null);
    }
  }, [state]);
  async function saveEdit(id: string) {
    const result = await editCommentAction({ commentId: id, body: draft });
    if (result.status === "error") {
      toast.error(result.message ?? "Não foi possível editar.");
      return;
    }
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    const result = await deleteCommentAction(id);
    if (result.status === "error") {
      toast.error(result.message ?? "Não foi possível apagar.");
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="comments-heading" className="grid gap-4">
      <h2 id="comments-heading" className="text-[15px] font-semibold">
        Comentários {comments.length > 0 ? `(${comments.length})` : ""}
      </h2>

      {comments.length === 0 ? (
        <p className="text-[13px] text-muted">Ainda não há comentários.</p>
      ) : (
        <ul className="grid gap-3">
          {comments.map((comment) => {
            const mine = comment.authorId === viewerId;
            return (
              <li key={comment.id} className="flex gap-3">
                <UserAvatar name={comment.authorName} size="lg" />
                <div className="min-w-0 flex-1 rounded-md border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[13px] font-semibold">{mine ? "Você" : comment.authorName}</span>
                    <time dateTime={comment.createdAt} className="text-[11.5px] text-faint">
                      {formatDateTimePtBr(comment.createdAt)}
                    </time>
                    {comment.edited ? <span className="text-[11.5px] text-faint">· editado</span> : null}
                  </div>

                  {editing === comment.id ? (
                    <div className="mt-2 grid gap-2">
                      <label htmlFor={`edit-${comment.id}`} className="sr-only">
                        Editar comentário
                      </label>
                      <textarea
                        id={`edit-${comment.id}`}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        maxLength={MAX_COMMENT_LENGTH}
                        rows={3}
                        className="rounded-md border border-border-strong bg-surface p-2 text-[14px]"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => saveEdit(comment.id)} className="min-h-11 rounded-md bg-brand px-3 text-[12.5px] font-semibold text-white hover:bg-brand-hover">
                          Salvar
                        </button>
                        <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-md border border-border-strong px-3 text-[12.5px] font-semibold hover:bg-surface-2">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[14px] leading-relaxed whitespace-pre-wrap break-words">{renderBody(comment.body)}</p>
                  )}

                  {editing !== comment.id && (mine || canModerate) ? (
                    <div className="mt-2 flex gap-1">
                      {mine ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(comment.id);
                            setDraft(comment.body);
                          }}
                          aria-label="Editar comentário"
                          className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => remove(comment.id)}
                        aria-label="Apagar comentário"
                        className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-danger"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment ? (
        <form ref={commentFormRef} action={formAction} className="grid gap-2">
          <input type="hidden" name="workspaceId" value={workspaceId} />
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <label htmlFor="new-comment" className="text-[13px] font-medium">
            Novo comentário
          </label>
          <div className="relative">
            <textarea
              ref={newBodyRef}
              id="new-comment"
              name="body"
              value={newBody}
              onChange={(event) => updateComposer(event.target.value, event.target.selectionStart)}
              rows={3}
              required
              maxLength={MAX_COMMENT_LENGTH}
              aria-invalid={state.fieldErrors?.body ? true : undefined}
              className="w-full rounded-md border border-border-strong bg-surface p-3 text-[14px]"
              placeholder={files.length ? "Escreva um comentário ou digite @ para mencionar um arquivo…" : "Escreva para quem acompanha este item…"}
            />
            {mentionQuery !== null && files.length > 0 ? (
              <div role="listbox" aria-label="Arquivos para mencionar" className="absolute bottom-full left-0 z-20 mb-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-xl">
                {files.filter((file) => file.fileName.toLocaleLowerCase("pt-BR").includes(mentionQuery)).slice(0, 8).map((file) => (
                  <button key={file.id} type="button" role="option" aria-selected="false" onMouseDown={(event) => event.preventDefault()} onClick={() => insertMention(file)} className="flex min-h-11 w-full items-center gap-2 rounded px-3 text-left text-[13px] hover:bg-surface-2">
                    <FileText className="size-4 flex-none text-brand" aria-hidden="true" />
                    <span className="truncate">{file.fileName}</span>
                  </button>
                ))}
                {files.filter((file) => file.fileName.toLocaleLowerCase("pt-BR").includes(mentionQuery)).length === 0 ? (
                  <p className="px-3 py-2 text-[12px] text-muted">Nenhum arquivo encontrado neste projeto.</p>
                ) : null}
              </div>
            ) : null}
          </div>
          {state.status === "error" ? <FormMessage status="error" message={state.message} /> : null}
          <div>
            <SubmitButton pending={pending} pendingLabel="Enviando…">
              Comentar
            </SubmitButton>
          </div>
        </form>
      ) : (
        <p className="text-[12.5px] text-muted">Seu papel neste espaço não permite comentar.</p>
      )}
    </section>
  );
}

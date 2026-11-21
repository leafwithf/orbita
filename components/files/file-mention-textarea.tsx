"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";

type MentionFile = { id: string; fileName: string };

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toHtml(value: string, files: MentionFile[]) {
  const escaped = escapeHtml(value);
  return escaped.replace(/\[\[arquivo:([0-9a-f-]{36})\]\]/gi, (token, id: string) => {
    const file = files.find((item) => item.id === id);
    return file
      ? '<span contenteditable="false" data-file-mention="' + id + '" class="inline-flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 text-background text-[12px] font-semibold align-baseline"><span>📎</span>' + escapeHtml(file.fileName) + '</span>'
      : escapeHtml(token);
  }).replace(/\n/g, "<br>");
}

function serialize(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof HTMLElement && node.dataset.fileMention) return "[[arquivo:" + node.dataset.fileMention + "]]";
  if (node instanceof HTMLBRElement) return "\n";
  if (node instanceof HTMLElement && node.tagName === "DIV") return Array.from(node.childNodes).map(serialize).join("") + "\n";
  return Array.from(node.childNodes).map(serialize).join("");
}

export function FileMentionTextarea({
  id, name, workspaceId, defaultValue = "", value, onChange, placeholder, maxLength, rows = 4, required = false, className,
}: {
  id: string; name?: string; workspaceId: string; defaultValue?: string; value?: string;
  onChange?: (value: string) => void; placeholder?: string; maxLength?: number; rows?: number; required?: boolean; className?: string;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const [files, setFiles] = useState<MentionFile[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [internalValue, setInternalValue] = useState(defaultValue);
  const current = value ?? internalValue;

  useEffect(() => {
    let active = true;
    fetch("/api/files/mentions?workspaceId=" + encodeURIComponent(workspaceId))
      .then((response) => response.ok ? response.json() : { files: [] })
      .then((data) => { if (active) setFiles(data.files ?? []); })
      .catch(() => { if (active) setFiles([]); });
    return () => { active = false; };
  }, [workspaceId]);

  useEffect(() => {
    if (editor.current && (editor.current.dataset.initialized !== "true" || document.activeElement !== editor.current)) {
      editor.current.innerHTML = toHtml(current, files);
      editor.current.dataset.initialized = "true";
    }
  }, [current, files]);

  function readValue() {
    const next = editor.current ? serialize(editor.current).replace(/\n$/, "") : "";
    if (value === undefined) setInternalValue(next);
    onChange?.(next);
    return next;
  }

  function handleInput() {
    const next = readValue();
    const selection = window.getSelection();
    const cursor = selection?.anchorOffset ?? 0;
    const textBefore = selection?.anchorNode?.textContent?.slice(0, cursor) ?? "";
    const at = textBefore.lastIndexOf("@");
    const previous = at > 0 ? textBefore[at - 1] : " ";
    const term = at >= 0 ? textBefore.slice(at + 1) : "";
    if (at >= 0 && /\s/.test(previous) && !/[\s@]/.test(term) && term.length <= 60) {
      setQuery(term.toLocaleLowerCase("pt-BR"));
    } else {
      setQuery(null);
    }
    if (maxLength && next.length > maxLength) {
      const trimmed = next.slice(0, maxLength);
      if (editor.current) editor.current.innerText = trimmed;
      if (value === undefined) setInternalValue(trimmed);
      onChange?.(trimmed);
    }
  }

  function insert(file: MentionFile) {
    const node = editor.current;
    const selection = window.getSelection();
    if (!node || !selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE || !textNode.parentNode?.isSameNode(node) && !node.contains(textNode)) return;
    const text = textNode.textContent ?? "";
    const cursor = range.startOffset;
    const at = text.lastIndexOf("@", cursor);
    if (at < 0) return;
    range.setStart(textNode, at);
    range.setEnd(textNode, cursor);
    range.deleteContents();
    const chip = document.createElement("span");
    chip.contentEditable = "false";
    chip.dataset.fileMention = file.id;
    chip.className = "inline-flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 text-background text-[12px] font-semibold align-baseline";
    chip.textContent = "📎 " + file.fileName;
    range.insertNode(chip);
    const space = document.createTextNode(" ");
    chip.after(space);
    range.setStartAfter(space);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    setQuery(null);
    readValue();
    node.focus();
  }

  const matches = useMemo(() => files.filter((file) => file.fileName.toLocaleLowerCase("pt-BR").includes(query ?? "")).slice(0, 10), [files, query]);

  return (
    <div className="relative grid gap-1.5">
      {name ? <input type="hidden" name={name} value={current} /> : null}
      <div
        ref={editor}
        id={id}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder ?? "Texto com menções a arquivos"}
        aria-required={required}
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={(event) => { if (event.key === "Escape") setQuery(null); }}
        className={"min-h-24 w-full whitespace-pre-wrap break-words rounded-md border border-input bg-surface px-3 py-2.5 text-[15px] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 empty:before:pointer-events-none empty:before:text-muted empty:before:content-[attr(data-placeholder)] md:text-sm " + (className ?? "")}
        style={{ minHeight: Math.max(96, rows * 24) }}
      />
      {query !== null ? (
        <div role="listbox" aria-label="Arquivos do espaço" className="absolute bottom-full left-0 z-30 mb-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-xl">
          {matches.map((file) => (
            <button key={file.id} type="button" role="option" aria-selected="false" onMouseDown={(event) => event.preventDefault()} onClick={() => insert(file)} className="flex min-h-11 w-full items-center gap-2 rounded px-3 text-left text-[13px] hover:bg-surface-2">
              <FileText className="size-4 flex-none text-brand" />
              <span className="truncate">{file.fileName}</span>
            </button>
          ))}
          {matches.length === 0 ? <p className="px-3 py-2 text-[12px] text-muted">Nenhum arquivo encontrado no espaço atual.</p> : null}
        </div>
      ) : null}
    </div>
  );
}

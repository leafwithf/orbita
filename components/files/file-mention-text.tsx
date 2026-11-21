"use client";

import { useEffect, useState } from "react";

type MentionFile = { id: string; fileName: string };

export function FileMentionText({ workspaceId, text }: { workspaceId: string; text: string }) {
  const [files, setFiles] = useState<MentionFile[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/files/mentions?workspaceId=" + encodeURIComponent(workspaceId))
      .then((response) => response.ok ? response.json() : { files: [] })
      .then((data) => { if (active) { setFiles(data.files ?? []); setLoaded(true); } })
      .catch(() => { if (active) { setFiles([]); setLoaded(true); } });
    return () => { active = false; };
  }, [workspaceId]);

  const parts = text.split(/(\[\[arquivo:[0-9a-f-]{36}\]\])/gi);
  return (
    <>
      {parts.map((part, index) => {
        const match = /^\[\[arquivo:([0-9a-f-]{36})\]\]$/i.exec(part);
        if (!match) return <span key={index}>{part}</span>;
        const file = files.find((item) => item.id === match[1]);
        if (!file) return <span key={index} className="inline-flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 text-[12px] font-semibold text-background">{loaded ? "📎 Arquivo indisponível" : "📎 Carregando arquivo…"}</span>;
        return (
          <a key={index} href={"/api/files/" + file.id + "/url"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md bg-foreground px-1.5 py-0.5 text-[12px] font-semibold text-background underline underline-offset-2">
            <span aria-hidden="true">📎</span>{file.fileName}
          </a>
        );
      })}
    </>
  );
}

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BLOCKED_EXTENSIONS,
  formatBytes,
  isInlinePreviewable,
  looksLikeText,
  quotaState,
  sniffMime,
  validateUploadRequest,
  verifyUploadedObject,
} from "./domain";

const bytes = (...values: number[]) => new Uint8Array(values);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const PDF = new TextEncoder().encode("%PDF-1.7\n");
const ZIP = bytes(0x50, 0x4b, 0x03, 0x04, 0, 0);
const EXE = bytes(0x4d, 0x5a, 0x90, 0x00);

describe("validateUploadRequest", () => {
  const ok = { name: "contrato.pdf", size: 20 * 1024 * 1024, mime: "application/pdf" };
  it("aceita 20 MB de PDF", () => expect(validateUploadRequest(ok).ok).toBe(true));
  it("recusa acima de 25 MB e vazio", () => {
    expect(validateUploadRequest({ ...ok, size: 25 * 1024 * 1024 + 1 })).toMatchObject({ code: "too_large" });
    expect(validateUploadRequest({ ...ok, size: 0 })).toMatchObject({ code: "invalid_size" });
    expect(validateUploadRequest({ ...ok, size: 1.5 })).toMatchObject({ code: "invalid_size" });
  });
  it("aceita exatamente 25 MB", () => {
    expect(validateUploadRequest({ ...ok, size: 25 * 1024 * 1024 }).ok).toBe(true);
  });
  it("recusa extensões bloqueadas mesmo com mime permitido", () => {
    for (const name of ["a.exe", "a.HTML", "a.svg", "a.sh", "a.js"]) {
      expect(validateUploadRequest({ ...ok, name })).toMatchObject({ code: "blocked_type" });
    }
  });
  it("recusa tipo fora da lista e extensão que não combina", () => {
    expect(validateUploadRequest({ ...ok, mime: "application/x-msdownload" })).toMatchObject({ code: "unsupported_type" });
    expect(validateUploadRequest({ ...ok, name: "foto.png" })).toMatchObject({ code: "extension_mismatch" });
  });
  it("recusa nome inválido e limpa controles", () => {
    expect(validateUploadRequest({ ...ok, name: "a/b.pdf" })).toMatchObject({ code: "invalid_name" });
    expect(validateUploadRequest({ ...ok, name: "   " })).toMatchObject({ code: "invalid_name" });
    expect(validateUploadRequest({ ...ok, name: "rel\u0000  final.pdf" })).toMatchObject({ ok: true, name: "rel final.pdf" });
  });
  it("aceita OOXML e jpeg com extensões alternativas", () => {
    expect(validateUploadRequest({ name: "a.docx", size: 10, mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }).ok).toBe(true);
    expect(validateUploadRequest({ name: "a.JPEG", size: 10, mime: "image/jpeg" }).ok).toBe(true);
  });
});

describe("assinatura real do arquivo", () => {
  it("reconhece os formatos", () => {
    expect(sniffMime(PNG)).toBe("image/png");
    expect(sniffMime(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(sniffMime(new TextEncoder().encode("GIF89a.."))).toBe("image/gif");
    expect(sniffMime(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("image/webp");
    expect(sniffMime(PDF)).toBe("application/pdf");
    expect(sniffMime(ZIP)).toBe("application/zip");
    expect(sniffMime(EXE)).toBeNull();
    expect(sniffMime(new Uint8Array())).toBeNull();
  });
  it("aprova quando tamanho e assinatura batem", () => {
    expect(verifyUploadedObject({ declaredMime: "image/png", declaredSize: 10, actualSize: 10, head: PNG })).toEqual({ ok: true });
    expect(verifyUploadedObject({ declaredMime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", declaredSize: 5, actualSize: 5, head: ZIP })).toEqual({ ok: true });
  });
  it("manda para quarentena: executável disfarçado, tipo trocado e tamanho divergente", () => {
    expect(verifyUploadedObject({ declaredMime: "image/png", declaredSize: 4, actualSize: 4, head: EXE })).toMatchObject({ ok: false });
    expect(verifyUploadedObject({ declaredMime: "application/pdf", declaredSize: 10, actualSize: 10, head: PNG })).toMatchObject({ ok: false });
    expect(verifyUploadedObject({ declaredMime: "image/png", declaredSize: 10, actualSize: 11, head: PNG })).toMatchObject({ ok: false, reason: "tamanho divergente do declarado" });
    expect(verifyUploadedObject({ declaredMime: "application/zip", declaredSize: 4, actualSize: 4, head: PNG })).toMatchObject({ ok: false });
  });
  it("texto: aceita UTF-8 e recusa binário", () => {
    const txt = new TextEncoder().encode("olá, mundo — ação");
    expect(looksLikeText(txt)).toBe(true);
    expect(looksLikeText(bytes(0x41, 0x00, 0x42))).toBe(false);
    expect(verifyUploadedObject({ declaredMime: "text/csv", declaredSize: txt.length, actualSize: txt.length, head: txt })).toEqual({ ok: true });
    expect(verifyUploadedObject({ declaredMime: "text/plain", declaredSize: 4, actualSize: 4, head: bytes(0, 1, 2, 3) })).toMatchObject({ ok: false });
  });
  it("não aprova o que não está na lista de permissão", () => {
    expect(verifyUploadedObject({ declaredMime: "text/html", declaredSize: 1, actualSize: 1, head: bytes(60) })).toMatchObject({ ok: false });
  });
});

describe("download e cota", () => {
  it("só imagens e PDF têm preview inline", () => {
    expect(isInlinePreviewable("image/png")).toBe(true);
    expect(isInlinePreviewable("application/zip")).toBe(false);
  });
  it("estado da cota", () => {
    expect(quotaState(0)).toMatchObject({ percent: 0, level: "ok" });
    expect(quotaState(0.8 * 1024 ** 3)).toMatchObject({ level: "warning" });
    expect(quotaState(1024 ** 3)).toMatchObject({ level: "full", remainingBytes: 0, percent: 100 });
    expect(quotaState(2 * 1024 ** 3).percent).toBe(100);
    expect(quotaState(512 * 1024 ** 2).label).toBe("512 MB de 1 GB usados (50%)");
  });
  it("formata bytes em pt-BR", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1536)).toBe("1,5 KB");
    expect(formatBytes(25 * 1024 * 1024)).toBe("25 MB");
  });
});

describe("sincronia com o banco", () => {
  it("a lista de extensões bloqueadas é a mesma da migração", () => {
    const sql = readFileSync("supabase/migrations/20261115000300_files.sql", "utf8");
    const block = /array\[([^\]]+)\]/.exec(sql)?.[1] ?? "";
    const fromSql = [...block.matchAll(/'([a-z0-9]+)'/g)].map((m) => m[1]).sort();
    expect(fromSql).toEqual([...BLOCKED_EXTENSIONS].sort());
  });
});

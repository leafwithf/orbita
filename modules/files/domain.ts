export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const WORKSPACE_LIMIT_BYTES = 1024 * 1024 * 1024;
export const SIGNED_UPLOAD_TTL_SECONDS = 600;
export const SIGNED_READ_TTL_SECONDS = 300;

type FileKind = "image" | "pdf" | "document" | "archive" | "text";

type TypeRule = { kind: FileKind; extensions: string[]; inline: boolean };

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Lista de permissão. Tudo que não está aqui é recusado. */
export const ALLOWED_TYPES: Record<string, TypeRule> = {
  "image/png": { kind: "image", extensions: ["png"], inline: true },
  "image/jpeg": { kind: "image", extensions: ["jpg", "jpeg"], inline: true },
  "image/gif": { kind: "image", extensions: ["gif"], inline: true },
  "image/webp": { kind: "image", extensions: ["webp"], inline: true },
  "application/pdf": { kind: "pdf", extensions: ["pdf"], inline: true },
  "application/zip": { kind: "archive", extensions: ["zip"], inline: false },
  [DOCX]: { kind: "document", extensions: ["docx"], inline: false },
  [XLSX]: { kind: "document", extensions: ["xlsx"], inline: false },
  [PPTX]: { kind: "document", extensions: ["pptx"], inline: false },
  "text/plain": { kind: "text", extensions: ["txt"], inline: false },
  "text/csv": { kind: "text", extensions: ["csv"], inline: false },
  "text/markdown": { kind: "text", extensions: ["md"], inline: false },
};

/** Espelha a lista da migração 0003 (um teste garante que não divergem). */
export const BLOCKED_EXTENSIONS = [
  "exe", "bat", "cmd", "com", "scr", "msi", "dll", "js", "mjs", "cjs", "vbs",
  "ps1", "sh", "jar", "apk", "html", "htm", "xhtml", "svg", "php", "py", "rb",
  "pl", "swf",
] as const;

const OOXML = new Set([DOCX, XLSX, PPTX]);

export type UploadErrorCode =
  | "invalid_name"
  | "invalid_size"
  | "too_large"
  | "blocked_type"
  | "unsupported_type"
  | "extension_mismatch";

export const UPLOAD_ERROR_MESSAGES: Record<UploadErrorCode, string> = {
  invalid_name: "O nome do arquivo é inválido.",
  invalid_size: "O arquivo está vazio.",
  too_large: "O arquivo passa de 25 MB.",
  blocked_type: "Este tipo de arquivo não é permitido por segurança.",
  unsupported_type: "Este tipo de arquivo não é aceito ainda.",
  extension_mismatch: "A extensão não combina com o tipo do arquivo.",
};

export type ValidationResult =
  | { ok: true; name: string; mime: string; extension: string }
  | { ok: false; code: UploadErrorCode; message: string };

const fail = (code: UploadErrorCode): ValidationResult => ({
  ok: false,
  code,
  message: UPLOAD_ERROR_MESSAGES[code],
});

export function sanitizeDisplayName(raw: string): string {
  return raw
    .normalize("NFC")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fileExtension(name: string): string {
  const match = /\.([^.]+)$/.exec(name);
  return match ? match[1].toLowerCase() : "";
}

export function validateUploadRequest(input: {
  name: string;
  size: number;
  mime: string;
}): ValidationResult {
  const name = sanitizeDisplayName(input.name);
  if (name.length < 1 || name.length > 255 || /[/\\]/.test(name)) {
    return fail("invalid_name");
  }
  if (!Number.isInteger(input.size) || input.size <= 0) return fail("invalid_size");
  if (input.size > MAX_FILE_BYTES) return fail("too_large");

  const extension = fileExtension(name);
  if ((BLOCKED_EXTENSIONS as readonly string[]).includes(extension)) {
    return fail("blocked_type");
  }

  const mime = input.mime.trim().toLowerCase();
  const rule = ALLOWED_TYPES[mime];
  if (!rule) return fail("unsupported_type");
  if (!rule.extensions.includes(extension)) return fail("extension_mismatch");

  return { ok: true, name, mime, extension };
}

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);

/** Detecta o tipo pelos primeiros bytes. Retorna null quando não reconhece. */
export function sniffMime(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])) return "image/gif";
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (
    startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(bytes, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(bytes, [0x50, 0x4b, 0x07, 0x08])
  ) {
    return "application/zip";
  }
  return null;
}

/** Texto simples: sem byte nulo e sem sequência UTF-8 inválida na amostra. */
export function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    // A amostra pode cortar um caractere multibyte ao meio no fim.
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, Math.max(bytes.length - 3, 0)));
      return true;
    } catch {
      return false;
    }
  }
}

export type VerifyResult = { ok: true } | { ok: false; reason: string };

/** Decisão do servidor ao concluir o upload (HEAD + primeiros bytes). */
export function verifyUploadedObject(input: {
  declaredMime: string;
  declaredSize: number;
  actualSize: number;
  head: Uint8Array;
}): VerifyResult {
  if (input.actualSize !== input.declaredSize) {
    return { ok: false, reason: "tamanho divergente do declarado" };
  }
  const rule = ALLOWED_TYPES[input.declaredMime];
  if (!rule) return { ok: false, reason: "tipo não permitido" };

  if (rule.kind === "text") {
    return looksLikeText(input.head)
      ? { ok: true }
      : { ok: false, reason: "conteúdo binário em arquivo de texto" };
  }

  const sniffed = sniffMime(input.head);
  const expected = OOXML.has(input.declaredMime) ? "application/zip" : input.declaredMime;
  return sniffed === expected
    ? { ok: true }
    : { ok: false, reason: "assinatura do arquivo diverge do tipo declarado" };
}

export function isInlinePreviewable(mime: string): boolean {
  return ALLOWED_TYPES[mime]?.inline === true;
}

export type QuotaState = {
  percent: number;
  remainingBytes: number;
  level: "ok" | "warning" | "full";
  label: string;
};

export function quotaState(usedBytes: number, limitBytes = WORKSPACE_LIMIT_BYTES): QuotaState {
  const used = Math.max(usedBytes, 0);
  const percent = Math.min(100, Math.round((used / limitBytes) * 100));
  const remainingBytes = Math.max(limitBytes - used, 0);
  const level = used >= limitBytes ? "full" : percent >= 80 ? "warning" : "ok";
  return {
    percent,
    remainingBytes,
    level,
    label: `${formatBytes(used)} de ${formatBytes(limitBytes)} usados (${percent}%)`,
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const rounded = value >= 10 || Number.isInteger(value) ? Math.round(value) : Math.round(value * 10) / 10;
  return `${String(rounded).replace(".", ",")} ${units[unit]}`;
}

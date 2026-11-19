import { createHash, randomBytes } from "node:crypto";

/** Gera um token de convite de 32 bytes. Só o hash vai para o banco. */
export function generateInviteToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashInviteToken(token) };
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

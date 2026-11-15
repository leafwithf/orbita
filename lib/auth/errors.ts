const FRIENDLY_ERRORS: Record<string, string> = {
  invalid_credentials: "E-mail ou senha incorretos. Confira e tente de novo.",
  email_not_confirmed:
    "Seu e-mail ainda não foi confirmado. Abra o link que enviamos para entrar.",
  user_already_exists: "Já existe uma conta com este e-mail. Tente entrar.",
  email_exists: "Já existe uma conta com este e-mail. Tente entrar.",
  weak_password: "Essa senha é muito fraca. Use pelo menos 8 caracteres.",
  same_password: "A nova senha precisa ser diferente da anterior.",
  over_email_send_rate_limit:
    "Muitos e-mails em pouco tempo. Aguarde alguns minutos e tente de novo.",
  over_request_rate_limit:
    "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.",
  signup_disabled: "Novos cadastros estão desativados neste ambiente.",
  session_not_found: "Sua sessão expirou. Entre novamente.",
  otp_expired: "Este link expirou. Solicite um novo.",
};

export function authErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const code =
      "code" in error && typeof error.code === "string" ? error.code : "";
    if (code && FRIENDLY_ERRORS[code]) {
      return FRIENDLY_ERRORS[code];
    }

    const message =
      "message" in error && typeof error.message === "string"
        ? error.message
        : "";
    if (message && message.length < 180 && !message.includes("{")) {
      return message;
    }
  }

  return "Não foi possível concluir agora. Tente novamente em instantes.";
}

export function safeNextPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

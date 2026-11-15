import { z } from "zod";

export const TIMEZONES = [
  "America/Sao_Paulo",
  "America/Bahia",
  "America/Fortaleza",
  "America/Recife",
  "America/Belem",
  "America/Manaus",
  "America/Cuiaba",
  "America/Campo_Grande",
  "America/Porto_Velho",
  "America/Rio_Branco",
  "America/Noronha",
  "America/New_York",
  "Europe/Lisbon",
  "UTC",
] as const;

export type ProfileTimezone = (typeof TIMEZONES)[number];

export const TIMEZONE_LABELS: Record<ProfileTimezone, string> = {
  "America/Sao_Paulo": "Brasília · São Paulo (GMT-3)",
  "America/Bahia": "Salvador (GMT-3)",
  "America/Fortaleza": "Fortaleza (GMT-3)",
  "America/Recife": "Recife (GMT-3)",
  "America/Belem": "Belém (GMT-3)",
  "America/Manaus": "Manaus (GMT-4)",
  "America/Cuiaba": "Cuiabá (GMT-4)",
  "America/Campo_Grande": "Campo Grande (GMT-4)",
  "America/Porto_Velho": "Porto Velho (GMT-4)",
  "America/Rio_Branco": "Rio Branco (GMT-5)",
  "America/Noronha": "Fernando de Noronha (GMT-2)",
  "America/New_York": "Nova York (GMT-5/-4)",
  "Europe/Lisbon": "Lisboa (GMT+0/+1)",
  UTC: "UTC",
};

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Escreva como você quer ser chamado.")
    .max(120, "Use até 120 caracteres."),
  timezone: z.enum(TIMEZONES, { error: "Escolha um fuso válido." }),
});

export function isProfileTimezone(value: string): value is ProfileTimezone {
  return (TIMEZONES as readonly string[]).includes(value);
}

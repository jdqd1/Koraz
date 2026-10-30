import { z } from "zod";

export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 128;
export const NewPasswordSchema = z.string()
  .min(AUTH_PASSWORD_MIN_LENGTH, "Usa al menos 8 caracteres.")
  .max(AUTH_PASSWORD_MAX_LENGTH, "Usa como máximo 128 caracteres.")
  .refine(value => /[a-z]/.test(value), "Incluye al menos una letra minúscula.")
  .refine(value => /[A-Z]/.test(value), "Incluye al menos una letra mayúscula.")
  .refine(value => /[0-9]/.test(value), "Incluye al menos un número.");

export const AUTH_SESSION_SECONDS = 30 * 24 * 60 * 60;
export const AUTH_SESSION_MAX_SECONDS = 90 * 24 * 60 * 60;
export const AUTH_SESSION_UPDATE_SECONDS = 24 * 60 * 60;

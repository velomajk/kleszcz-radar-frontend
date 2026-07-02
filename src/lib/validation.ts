/**
 * Client-side validation mirroring the backend's Zod schemas
 * (src/lib/validation.ts in the backend). Used for fast, friendly feedback
 * before hitting the network; the backend remains the source of truth.
 */

import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Podaj adres email, aby otrzymać link.")
  .max(254, "Adres email jest zbyt długi.")
  .email("To nie wygląda na poprawny adres email.");

/** Returns a Polish error string, or null when valid. */
export function validateEmail(value: string): string | null {
  const result = emailSchema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? "Nieprawidłowy email.");
}

/** Latitude/longitude bounds matching the backend. */
export const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

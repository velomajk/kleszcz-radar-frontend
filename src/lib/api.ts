/**
 * Typed API client for the Radar Kleszczy backend.
 * One place for every network call; parses the backend's `{ error: {...} }`
 * envelope and surfaces a typed ApiError with a Polish, user-facing message.
 */

import { API_BASE_URL } from "./config";
import type {
  ApiErrorBody,
  ConfirmResponse,
  HeatmapQuery,
  HeatmapResponse,
  ReportVerificationInput,
  ReportVerificationResponse,
  SymptomInput,
  SymptomStatusResponse,
  SymptomSubmitResponse,
} from "./types";

/** Error thrown for any non-2xx response (or network failure). */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorBody["error"]["details"];

  constructor(
    status: number,
    code: string,
    message: string,
    details?: ApiErrorBody["error"]["details"],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Maps backend error codes / HTTP statuses to Polish, user-facing copy. */
export function polishErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case "rate_limited":
        return "Zbyt wiele prób. Odczekaj chwilę i spróbuj ponownie.";
      case "challenge_failed":
        return "Weryfikacja antyspamowa nie powiodła się. Odśwież stronę i spróbuj ponownie.";
      case "validation_error":
        return "Formularz zawiera błędy. Sprawdź wprowadzone dane i spróbuj ponownie.";
      case "invalid_or_expired_token":
        return "Link jest nieprawidłowy, wygasł lub został już użyty.";
      case "invalid_symptom_token":
        return "Link do objawów jest nieprawidłowy lub wygasł.";
      case "area_too_large":
        return "Wybrany obszar mapy jest zbyt duży. Przybliż widok i spróbuj ponownie.";
      case "network_error":
        return "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.";
      default:
        if (err.status >= 500)
          return "Wystąpił nieoczekiwany błąd serwera. Spróbuj ponownie za chwilę.";
        return err.message || "Coś poszło nie tak. Spróbuj ponownie.";
    }
  }
  return "Coś poszło nie tak. Spróbuj ponownie.";
}

async function request<T>(
  path: string,
  init?: RequestInit & { rawEmptyOk?: boolean },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    // Network / CORS / DNS failure.
    throw new ApiError(0, "network_error", "Network request failed");
  }

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null;
    const code = errBody?.error?.code ?? "http_error";
    const message = errBody?.error?.message ?? `HTTP ${res.status}`;
    throw new ApiError(res.status, code, message, errBody?.error?.details);
  }

  return body as T;
}

// ---- Endpoints ----

/** POST /v1/report-verifications — submits the report draft + email + Turnstile. */
export function requestReportVerification(
  input: ReportVerificationInput,
): Promise<ReportVerificationResponse> {
  return request<ReportVerificationResponse>("/v1/report-verifications", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** POST /v1/report-verifications/confirm — confirms the emailed magic token. */
export function confirmReport(token: string): Promise<ConfirmResponse> {
  return request<ConfirmResponse>("/v1/report-verifications/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/** GET /v1/symptoms/status — validates a symptom token (via X-Symptom-Token). */
export function getSymptomStatus(
  symptomToken: string,
): Promise<SymptomStatusResponse> {
  return request<SymptomStatusResponse>("/v1/symptoms/status", {
    method: "GET",
    headers: { "X-Symptom-Token": symptomToken },
  });
}

/** PUT /v1/symptoms — upserts structured symptom flags (via X-Symptom-Token). */
export function submitSymptoms(
  symptomToken: string,
  input: SymptomInput,
): Promise<SymptomSubmitResponse> {
  return request<SymptomSubmitResponse>("/v1/symptoms", {
    method: "PUT",
    headers: { "X-Symptom-Token": symptomToken },
    body: JSON.stringify(input),
  });
}

/** GET /v1/heatmap — aggregated, thresholded H3 cells. */
export function getHeatmap(query: HeatmapQuery = {}): Promise<HeatmapResponse> {
  const params = new URLSearchParams();
  if (query.window) params.set("window", query.window);
  if (query.placeType) params.set("placeType", query.placeType);
  if (query.subjectType) params.set("subjectType", query.subjectType);
  if (query.resolution !== undefined) params.set("resolution", String(query.resolution));
  const bbox = [query.north, query.south, query.east, query.west];
  if (bbox.every((v) => typeof v === "number")) {
    params.set("north", String(query.north));
    params.set("south", String(query.south));
    params.set("east", String(query.east));
    params.set("west", String(query.west));
  }
  const qs = params.toString();
  return request<HeatmapResponse>(`/v1/heatmap${qs ? `?${qs}` : ""}`, {
    method: "GET",
  });
}

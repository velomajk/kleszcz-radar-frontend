/**
 * Runtime configuration read from public env vars.
 * NEXT_PUBLIC_* values are inlined at build time and safe for the browser.
 */

export const API_BASE_URL: string =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:3000";

/**
 * Cloudflare Turnstile site key for the report widget.
 * Falls back to Cloudflare's official "always passes" test key, which lets the
 * form work out of the box in local development (backend usually runs with
 * TURNSTILE_BYPASS=true). Replace via NEXT_PUBLIC_TURNSTILE_SITE_KEY in prod.
 */
export const TURNSTILE_SITE_KEY: string =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

/** True when using a Cloudflare test key (always-pass / always-block / forced). */
export const IS_TURNSTILE_TEST_KEY = /^(1x|2x|3x)0{20}/.test(TURNSTILE_SITE_KEY);

/**
 * Base path the app is served under (e.g. "/kleszcz-radar-frontend" for a
 * GitHub project page). Empty for root/custom-domain deployments. Next handles
 * this automatically for <Link>/assets; we only need it for manual path parsing
 * (see the static-export symptom fallback in app/not-found.tsx).
 */
export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH || "";

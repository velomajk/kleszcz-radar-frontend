/**
 * API contract types, derived directly from the backend
 * (velomajk/kleszcz-radar-backend, src/lib/validation.ts + services/*).
 * These mirror the real request bodies and response shapes — nothing invented.
 */

// ---- Enums (exact backend values) ----

export type PlaceType =
  | "forest"
  | "meadow"
  | "park"
  | "garden"
  | "allotment"
  | "urban"
  | "other";

export type SubjectType = "adult" | "child" | "animal";

export type RemovalMethod =
  | "tweezers"
  | "tick_tool"
  | "fingers"
  | "professional"
  | "other"
  | "unknown";

export type HeatmapWindow = "7d" | "14d" | "30d" | "season";

export type Intensity = "low" | "medium" | "high";

// ---- POST /v1/report-verifications ----

export interface ReportVerificationInput {
  email: string;
  turnstileToken: string;
  latitude: number; // -90..90
  longitude: number; // -180..180
  occurredOn: string; // YYYY-MM-DD, not in the future
  placeType: PlaceType;
  subjectType: SubjectType;
  tickRemoved: boolean;
  removalMethod?: RemovalMethod; // only valid when tickRemoved === true
  estimatedAttachmentHours?: number; // 0..720
}

export interface ReportVerificationResponse {
  status: "verification_sent";
  expiresInSeconds: number;
}

// ---- POST /v1/report-verifications/confirm ----

export interface ConfirmResponse {
  status: "report_created";
  symptomUrl: string;
  symptomLinkExpiresAt: string; // ISO
}

// ---- GET /v1/symptoms/status (header X-Symptom-Token) ----

export interface SymptomStatusResponse {
  valid: boolean;
  expiresAt: string; // ISO
  submitted: boolean;
  lastUpdatedAt: string | null;
}

// ---- PUT /v1/symptoms (header X-Symptom-Token) ----

export interface SymptomInput {
  rash: boolean;
  expandingRash: boolean;
  fever: boolean;
  headache: boolean;
  muscleOrJointPain: boolean;
  neckStiffness: boolean;
  nauseaOrVomiting: boolean;
  neurologicalSymptoms: boolean;
  doctorContacted: boolean;
  observedAt: string; // ISO datetime, not in the future
}

export interface SymptomSubmitResponse {
  status: "symptoms_saved";
  disclaimer: string;
}

// ---- GET /v1/heatmap ----

export interface HeatmapQuery {
  window?: HeatmapWindow;
  placeType?: PlaceType;
  subjectType?: SubjectType;
  // Requested H3 aggregation resolution (coarse 3 … fine 7). Wide map views
  // should request coarser cells so areas accumulate enough reports to clear
  // the privacy threshold. Server clamps to its allowed range.
  resolution?: number;
  // Optional bounding box — all four must be provided together.
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}

export interface HeatmapCell {
  cell: string; // H3 index (at HeatmapResponse.resolution)
  countBucket: number; // bucketed count (multiples of 5)
  intensity: Intensity;
}

export interface HeatmapResponse {
  generatedAt: string; // ISO
  window: HeatmapWindow;
  resolution: number; // effective H3 resolution of `cells` (3–7)
  minimumCellCount: number; // suppression threshold k
  // The three fields below are optional: the deployed backend may be older
  // than the frontend during a rolling deploy. Always guard before use.
  matchingReports?: number; // reports matching filters/window, before the per-cell threshold
  totalReports?: number; // all visible reports, country-wide (unfiltered)
  reportsLast24h?: number; // of those, submitted in the last 24 hours
  // Per-country totals under the current filters (no per-cell threshold —
  // national aggregates are privacy-safe). Shown as badges at low zoom.
  countries?: { country: string; count: number }[];
  cells: HeatmapCell[];
}

// ---- Error envelope (stable across all endpoints) ----

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: (string | number)[]; message: string }>;
  };
}

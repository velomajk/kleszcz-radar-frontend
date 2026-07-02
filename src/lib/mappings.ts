/**
 * Maps the design's option keys onto the backend's exact enum values and
 * request fields. Every place where the design and backend diverge is called
 * out here explicitly (search for "DIVERGENCE" / "TODO") rather than silently
 * faked, per the implementation requirements.
 */

import type { PlaceType, SubjectType, SymptomInput } from "./types";

// ---------------------------------------------------------------------------
// "Kiedy doszło do ukłucia?" (when) -> occurredOn (YYYY-MM-DD)
// The design collects a coarse bucket; the backend needs a concrete date that
// is not in the future. We map each bucket to a representative date.
// ---------------------------------------------------------------------------

export type WhenKey = "today" | "yesterday" | "2-3" | "week" | "unknown";

export const WHEN_OPTIONS: { key: WhenKey; label: string }[] = [
  { key: "today", label: "Dziś" },
  { key: "yesterday", label: "Wczoraj" },
  { key: "2-3", label: "2–3 dni temu" },
  { key: "week", label: "Ponad tydzień temu" },
  { key: "unknown", label: "Nie pamiętam dokładnie" },
];

/** Days-ago offset used to derive occurredOn from the coarse bucket. */
const WHEN_DAYS_AGO: Record<WhenKey, number> = {
  today: 0,
  yesterday: 1,
  "2-3": 2, // representative midpoint of "2–3 dni temu"
  week: 8, // "ponad tydzień temu"
  // DIVERGENCE: backend requires a concrete occurredOn, but "nie pamiętam"
  // has no exact date. We fall back to today (most recent, never in the
  // future). TODO: consider a backend field for "date unknown" if this
  // approximation is not acceptable epidemiologically.
  unknown: 0,
};

function formatLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function whenKeyToOccurredOn(key: WhenKey): string {
  const d = new Date();
  d.setDate(d.getDate() - WHEN_DAYS_AGO[key]);
  return formatLocalDate(d);
}

// ---------------------------------------------------------------------------
// "Kogo dotyczyło?" (who) -> subjectType   (1:1)
// ---------------------------------------------------------------------------

export type WhoKey = SubjectType;

export const WHO_OPTIONS: { key: WhoKey; label: string }[] = [
  { key: "adult", label: "Osoba dorosła" },
  { key: "child", label: "Dziecko" },
  { key: "animal", label: "Zwierzę" },
];

// ---------------------------------------------------------------------------
// "Jaki to był teren?" (place) -> placeType
// Backend enum: forest | meadow | park | garden | allotment | urban | other
// ---------------------------------------------------------------------------

export type PlaceKey =
  | "forest"
  | "park"
  | "meadow"
  | "garden"
  | "water"
  | "other";

export const PLACE_OPTIONS: { key: PlaceKey; label: string }[] = [
  { key: "forest", label: "Las" },
  { key: "park", label: "Park / zieleń miejska" },
  { key: "meadow", label: "Łąka / pole" },
  { key: "garden", label: "Ogród / działka" },
  { key: "water", label: "Nad wodą" },
  { key: "other", label: "Inne / nie wiem" },
];

const PLACE_MAP: Record<PlaceKey, PlaceType> = {
  forest: "forest",
  park: "park",
  meadow: "meadow",
  garden: "garden",
  // DIVERGENCE: the design offers "Nad wodą" (near water) but the backend
  // placeType enum has no such value, so it maps to "other".
  water: "other",
  other: "other",
};

export function placeKeyToPlaceType(key: PlaceKey): PlaceType {
  return PLACE_MAP[key];
}

// ---------------------------------------------------------------------------
// "Czy kleszcz był wbity?" (embedded) -> (no backend field)
// The design collects this, but reportInputSchema has no "attached/embedded"
// field. We keep the question for design fidelity but DO NOT send it.
// TODO: add a backend field (e.g. `tickAttached`) if this signal should be
// persisted. Until then it is intentionally dropped, not faked.
// ---------------------------------------------------------------------------

export type EmbeddedKey = "yes" | "no" | "unknown";

export const EMBEDDED_OPTIONS: { key: EmbeddedKey; label: string }[] = [
  { key: "yes", label: "Tak, był wbity w skórę" },
  { key: "no", label: "Nie, tylko chodził po skórze" },
  { key: "unknown", label: "Nie wiem" },
];

// ---------------------------------------------------------------------------
// "Czy kleszcz został usunięty?" (removed) -> tickRemoved (boolean)
// ---------------------------------------------------------------------------

export type RemovedKey = "yes" | "no" | "unknown";

export const REMOVED_OPTIONS: { key: RemovedKey; label: string }[] = [
  { key: "yes", label: "Tak, został usunięty" },
  { key: "no", label: "Nie, jeszcze nie" },
  { key: "unknown", label: "Nie wiem" },
];

export function removedKeyToTickRemoved(key: RemovedKey): boolean {
  // DIVERGENCE: tickRemoved is a required boolean; "Nie wiem" is coerced to
  // false (i.e. "not confirmed removed"). removalMethod is never sent, which
  // keeps the payload valid regardless of this choice.
  return key === "yes";
}

// ---------------------------------------------------------------------------
// Symptom form (design) -> SymptomInput (backend)
// ---------------------------------------------------------------------------

export type RashKey = "yes" | "no" | "unknown";
export type RashGrowKey = "yes" | "no" | "unknown";
export type DoctorKey = "yes" | "planned" | "no";

export interface SymptomDraft {
  rash: RashKey | null;
  rashGrowing: RashGrowKey | null;
  fever: boolean;
  headache: boolean;
  muscle: boolean;
  neck: boolean;
  nausea: boolean;
  neuro: boolean;
  doctor: DoctorKey | null;
}

export function symptomDraftToInput(d: SymptomDraft): SymptomInput {
  return {
    rash: d.rash === "yes",
    expandingRash: d.rashGrowing === "yes",
    fever: d.fever,
    headache: d.headache,
    muscleOrJointPain: d.muscle,
    neckStiffness: d.neck,
    nauseaOrVomiting: d.nausea,
    neurologicalSymptoms: d.neuro,
    // "Mam umówioną wizytę" and "byłem u lekarza" both count as contacting a
    // doctor; only "Jeszcze nie" is false.
    doctorContacted: d.doctor === "yes" || d.doctor === "planned",
    observedAt: new Date().toISOString(),
  };
}

/** Whether the currently selected symptoms warrant the alarm banner (design). */
export function symptomAlarm(d: SymptomDraft): boolean {
  return Boolean(
    d.rashGrowing === "yes" || d.neck || d.neuro || d.fever,
  );
}

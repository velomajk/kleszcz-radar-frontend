/**
 * Approximate label centroids ([lng, lat]) for Polish voivodeships, keyed by
 * the lowercase name the backend stores (same as the boundary data's `nazwa`).
 * Used to place per-voivodeship count badges at regional zoom.
 */
export const REGION_CENTROIDS: Record<string, [number, number]> = {
  "dolnośląskie": [16.4, 51.1],
  "kujawsko-pomorskie": [18.5, 53.05],
  "lubelskie": [22.9, 51.2],
  "lubuskie": [15.3, 52.2],
  "łódzkie": [19.4, 51.6],
  "małopolskie": [20.3, 49.85],
  "mazowieckie": [21.1, 52.35],
  "opolskie": [17.9, 50.6],
  "podkarpackie": [22.2, 49.95],
  "podlaskie": [23.0, 53.3],
  "pomorskie": [17.9, 54.15],
  "śląskie": [19.0, 50.3],
  "świętokrzyskie": [20.8, 50.75],
  "warmińsko-mazurskie": [20.8, 53.85],
  "wielkopolskie": [17.3, 52.3],
  "zachodniopomorskie": [15.5, 53.6],
};

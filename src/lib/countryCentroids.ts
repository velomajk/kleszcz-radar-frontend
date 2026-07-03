/**
 * Approximate label centroids ([lng, lat]) for countries the app may plausibly
 * receive reports from (Europe-centric). Used to place the per-country count
 * badges at continental zoom. Countries missing from this table simply don't
 * get a badge — extend as the app grows.
 */
export const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  PL: [19.4, 52.1],
  DE: [10.4, 51.1],
  CZ: [15.5, 49.8],
  SK: [19.7, 48.7],
  UA: [31.2, 49.0],
  BY: [27.9, 53.7],
  LT: [23.9, 55.3],
  LV: [24.9, 56.9],
  EE: [25.8, 58.7],
  AT: [14.1, 47.6],
  HU: [19.4, 47.2],
  RO: [25.0, 45.9],
  FR: [2.5, 46.6],
  IT: [12.6, 42.8],
  ES: [-3.6, 40.3],
  PT: [-8.1, 39.7],
  NL: [5.3, 52.2],
  BE: [4.6, 50.6],
  LU: [6.1, 49.8],
  CH: [8.2, 46.8],
  GB: [-1.9, 52.9],
  IE: [-8.1, 53.3],
  DK: [9.4, 56.1],
  NO: [8.8, 61.0],
  SE: [15.3, 62.0],
  FI: [26.0, 64.5],
  HR: [15.9, 45.4],
  SI: [14.8, 46.1],
  RS: [20.8, 44.2],
  BA: [17.8, 44.2],
  BG: [25.2, 42.8],
  GR: [22.5, 39.3],
  MD: [28.4, 47.2],
  TR: [35.2, 39.0],
};

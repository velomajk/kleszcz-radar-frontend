import type { StyleSpecification } from "maplibre-gl";

/**
 * Keyless raster basemap using OpenStreetMap tiles, so the map works without an
 * API key. For production traffic, swap in a proper tile provider (MapTiler,
 * Protomaps, self-hosted, …) — OSM's public tiles are rate-limited and not
 * intended for heavy use.
 */
export const osmStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
    },
  ],
};

/** Roughly centres the map on Poland. */
export const POLAND_CENTER: [number, number] = [19.14, 52.0];
/** Opens wide enough to see all of Poland plus neighbours. */
export const POLAND_ZOOM = 4.8;

/**
 * Badge tiers:
 *   zoom <  4           → country badges (Europe-scale view: "PL · N")
 *   4 ≤ zoom < 8        → voivodeship badges (incl. default whole-Poland view)
 *   zoom ≥ 8            → hexagons only
 */
export const COUNTRY_BADGE_MAX_ZOOM = 4;
export const REGION_BADGE_MAX_ZOOM = 8;

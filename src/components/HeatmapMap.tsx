"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import maplibregl, { type Map as MlMap, type Marker, LngLatBounds } from "maplibre-gl";
import { cellToBoundary } from "h3-js";
import type { FeatureCollection, Polygon } from "geojson";
import { osmStyle, POLAND_CENTER, POLAND_ZOOM } from "@/lib/mapStyle";
import { COUNTRY_CENTROIDS } from "@/lib/countryCentroids";
import type { HeatmapCell } from "@/lib/types";

const SOURCE_ID = "risk-cells";
/** Below this zoom the map shows per-country count badges. */
const COUNTRY_BADGE_MAX_ZOOM = 4.5;

function toFeatureCollection(cells: HeatmapCell[]): FeatureCollection<Polygon> {
  return {
    type: "FeatureCollection",
    features: cells.map((c) => {
      // formatAsGeoJson=true => [lng, lat] pairs, ready for GeoJSON.
      const boundary = cellToBoundary(c.cell, true) as [number, number][];
      const ring = [...boundary, boundary[0]];
      return {
        type: "Feature",
        properties: { intensity: c.intensity, count: c.countBucket },
        geometry: { type: "Polygon", coordinates: [ring] },
      };
    }),
  };
}

/** Renders aggregated H3 risk cells as coloured hexagons. Never any point pins. */
export function HeatmapMap({
  cells,
  countries = [],
  onZoomChange,
}: {
  cells: HeatmapCell[];
  /** Per-country totals, rendered as badges when zoomed out beyond Poland. */
  countries?: { country: string; count: number }[];
  /** Called with the map zoom on load and after every zoom gesture. */
  onZoomChange?: (zoom: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const loadedRef = useRef(false);
  const didFitRef = useRef(false);
  const countryMarkersRef = useRef<Marker[]>([]);
  const countriesRef = useRef(countries);
  countriesRef.current = countries;
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  /** (Re)creates or removes badges depending on current zoom. */
  const syncCountryBadges = (map: MlMap) => {
    countryMarkersRef.current.forEach((m) => m.remove());
    countryMarkersRef.current = [];
    if (map.getZoom() >= COUNTRY_BADGE_MAX_ZOOM) return;
    for (const { country, count } of countriesRef.current) {
      const centroid = COUNTRY_CENTROIDS[country];
      if (!centroid || count <= 0) continue;
      const el = document.createElement("div");
      el.style.cssText =
        "background:#14584A;color:#fff;border-radius:999px;padding:4px 10px;" +
        "font:700 12px/1.2 system-ui,sans-serif;box-shadow:0 1px 4px rgba(0,0,0,.25);" +
        "white-space:nowrap;pointer-events:none;";
      el.textContent = `${country} · ${count.toLocaleString("pl-PL")}`;
      countryMarkersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat(centroid).addTo(map),
      );
    }
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmStyle,
      center: POLAND_CENTER,
      zoom: POLAND_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("zoomend", () => {
      onZoomChangeRef.current?.(map.getZoom());
      syncCountryBadges(map);
    });
    map.on("load", () => {
      onZoomChangeRef.current?.(map.getZoom());
      syncCountryBadges(map);
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "risk-fill",
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": [
            "match",
            ["get", "intensity"],
            "low",
            "#86B08A",
            "medium",
            "#E0A24C",
            "high",
            "#CE6A4E",
            "#86B08A",
          ],
          "fill-opacity": 0.5,
        },
      });
      map.addLayer({
        id: "risk-outline",
        type: "line",
        source: SOURCE_ID,
        paint: {
          "line-color": [
            "match",
            ["get", "intensity"],
            "low",
            "#5E8A63",
            "medium",
            "#B87B2E",
            "high",
            "#A64B31",
            "#5E8A63",
          ],
          "line-width": 1,
          "line-opacity": 0.7,
        },
      });
      // Tap a hexagon to see its (bucketed) report count. Counts are shown as
      // "≈ N+", matching the privacy model — exact numbers are never exposed.
      map.on("click", "risk-fill", (e) => {
        const feature = e.features?.[0];
        if (!feature) return;
        const bucket = Number(feature.properties?.count ?? 0);
        const intensity = String(feature.properties?.intensity ?? "low");
        const intensityLabel =
          intensity === "high" ? "wysokie" : intensity === "medium" ? "podwyższone" : "niskie";
        new maplibregl.Popup({ closeButton: false, maxWidth: "220px" })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font: 600 13px/1.4 system-ui, sans-serif; color: #253830; padding: 2px 4px;">` +
              `≈ ${bucket}+ zgłoszeń w tym obszarze<br/>` +
              `<span style="font-weight: 500; color: #5c6f66;">ryzyko: ${intensityLabel}</span>` +
              `</div>`,
          )
          .addTo(map);
      });
      map.on("mouseenter", "risk-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "risk-fill", () => {
        map.getCanvas().style.cursor = "";
      });
      loadedRef.current = true;
      updateData(map, cells, didFitRef);
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map && loadedRef.current) updateData(map, cells, didFitRef);
  }, [cells]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && loadedRef.current) syncCountryBadges(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countries]);

  return (
    <div
      ref={containerRef}
      // Inline style, not Tailwind: maplibre-gl.css sets `.maplibregl-map
      // { position: relative }` which can win over the `.absolute` utility
      // depending on bundle order, collapsing the container to 0 height.
      style={{ position: "absolute", inset: 0 }}
    />
  );
}

function updateData(map: MlMap, cells: HeatmapCell[], didFitRef: { current: boolean }) {
  const fc = toFeatureCollection(cells);
  const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  source?.setData(fc);

  // Auto-fit only on the first non-empty payload. Later refetches (filter or
  // zoom-resolution changes) must not fight the user's current viewport.
  if (cells.length > 0 && !didFitRef.current) {
    didFitRef.current = true;
    const bounds = new LngLatBounds();
    fc.features.forEach((f) =>
      f.geometry.coordinates[0].forEach(([lng, lat]) => bounds.extend([lng, lat])),
    );
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 10, duration: 500 });
    }
  }
}

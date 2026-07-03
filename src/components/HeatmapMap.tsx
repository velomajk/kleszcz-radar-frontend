"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import maplibregl, { type Map as MlMap, LngLatBounds } from "maplibre-gl";
import { cellToBoundary } from "h3-js";
import type { FeatureCollection, Polygon } from "geojson";
import { osmStyle, POLAND_CENTER, POLAND_ZOOM } from "@/lib/mapStyle";
import type { HeatmapCell } from "@/lib/types";

const SOURCE_ID = "risk-cells";

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
  onZoomChange,
}: {
  cells: HeatmapCell[];
  /** Called with the map zoom on load and after every zoom gesture. */
  onZoomChange?: (zoom: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const loadedRef = useRef(false);
  const didFitRef = useRef(false);
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

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
    map.on("zoomend", () => onZoomChangeRef.current?.(map.getZoom()));
    map.on("load", () => {
      onZoomChangeRef.current?.(map.getZoom());
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

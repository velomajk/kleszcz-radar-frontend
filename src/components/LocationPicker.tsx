"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import maplibregl, { type Map as MlMap, Marker } from "maplibre-gl";
import { osmStyle, POLAND_CENTER, POLAND_ZOOM } from "@/lib/mapStyle";

/**
 * Interactive map for choosing the approximate bite location. Emits real
 * lat/lng — the backend converts them to a coarse H3 cell on ingest, so only
 * the aggregated area is ever published (never this exact point).
 */
export function LocationPicker({
  value,
  onPick,
}: {
  value: { lat: number; lng: number } | null;
  onPick: (coords: { lat: number; lng: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: osmStyle,
      center: value ? [value.lng, value.lat] : POLAND_CENTER,
      zoom: value ? 11 : POLAND_ZOOM,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("click", (e) => {
      onPickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [value]);

  // Reflect the selected value as a draggable marker.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#14584A;box-shadow:0 0 0 6px rgba(20,88,74,0.18);border:2px solid #fff;cursor:grab;";
      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([value.lng, value.lat])
        .addTo(map);
      marker.on("dragend", () => {
        const p = marker.getLngLat();
        onPickRef.current({ lat: p.lat, lng: p.lng });
      });
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat([value.lng, value.lat]);
    }
  }, [value]);

  const locate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onPickRef.current(coords);
        mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 12 });
      },
      () => {
        /* user declined or unavailable — ignore silently */
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

  return (
    <div className="relative h-[270px] overflow-hidden rounded-2xl border border-map-border bg-map-bg">
      <div ref={containerRef} className="absolute inset-0" />
      <button
        type="button"
        onClick={locate}
        className="absolute left-3 top-3 z-[1] rounded-[10px] bg-white/90 px-3 py-2 text-[12px] font-semibold text-forest-800 shadow-sm backdrop-blur transition hover:bg-white"
      >
        Użyj mojej lokalizacji
      </button>
      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1] rounded-[10px] bg-white/86 px-[11px] py-[7px] text-[11px] leading-[1.4] text-[#4A574F]">
        Dotknij dowolnego miejsca. Publicznie pokażemy tylko{" "}
        <b>obszar zagregowany</b> (ok. 10 km), nigdy dokładny punkt.
      </div>
    </div>
  );
}

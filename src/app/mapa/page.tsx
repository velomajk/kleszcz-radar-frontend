"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AppShell, Screen, FilterPill, Callout } from "@/components/ui";
import {
  ArrowLeftIcon,
  ShieldIcon,
  ClockIcon,
  InfoIcon,
  SpinnerIcon,
} from "@/components/icons";
import { getHeatmap, polishErrorMessage } from "@/lib/api";
import type {
  HeatmapResponse,
  HeatmapWindow,
  PlaceType,
  SubjectType,
} from "@/lib/types";

const HeatmapMap = dynamic(
  () => import("@/components/HeatmapMap").then((m) => m.HeatmapMap),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 flex items-center justify-center bg-map-bg">
        <SpinnerIcon size={28} className="text-forest" />
      </div>
    ),
  },
);

const WINDOW_FILTERS: { key: HeatmapWindow; label: string }[] = [
  { key: "7d", label: "7 dni" },
  { key: "14d", label: "14 dni" },
  { key: "30d", label: "30 dni" },
  { key: "season", label: "Sezon" },
];

const PLACE_FILTERS: { key: PlaceType | "all"; label: string }[] = [
  { key: "all", label: "Każdy teren" },
  { key: "forest", label: "Las" },
  { key: "park", label: "Park" },
  { key: "meadow", label: "Łąka" },
];

const WHO_FILTERS: { key: SubjectType | "all"; label: string }[] = [
  { key: "all", label: "Wszyscy" },
  { key: "adult", label: "Człowiek" },
  { key: "child", label: "Dziecko" },
  { key: "animal", label: "Zwierzę" },
];

/**
 * Maps the maplibre zoom level to an H3 aggregation resolution. Wide views use
 * coarse cells so regions accumulate enough reports to clear the privacy
 * threshold; zooming in progressively refines the grid (server clamps to its
 * own limits).
 */
function zoomToResolution(zoom: number): number {
  if (zoom < 6) return 3; // whole country (~12,400 km² cells, ⅔ województwa)
  if (zoom < 7) return 4; // region (~1,770 km²)
  if (zoom < 8) return 5; // powiat (~253 km²)
  if (zoom < 9) return 6; // gmina (~36 km²)
  return 7; // local (native storage resolution, ~5 km²)
}

const WINDOW_RANGE_LABEL: Record<HeatmapWindow, string> = {
  "7d": "ostatnie 7 dni",
  "14d": "ostatnie 14 dni",
  "30d": "ostatnie 30 dni",
  season: "cały sezon " + new Date().getFullYear(),
};

/** Explains WHY the map is empty, based on what the API actually returned. */
function emptyMapMessage(data: HeatmapResponse): string {
  if (data.totalReports === 0) {
    return "Nie ma jeszcze żadnych potwierdzonych zgłoszeń. Mapa wypełni się, gdy pojawią się pierwsze.";
  }
  if (data.matchingReports === 0) {
    return "Żadne zgłoszenie nie pasuje do wybranych filtrów lub okresu. Zmień filtry, aby zobaczyć dane.";
  }
  const n = data.matchingReports;
  if (typeof n !== "number") {
    // Older backend without `matchingReports` — fall back to the generic copy.
    return "Za mało zgłoszeń w tym widoku, aby bezpiecznie pokazać dane. Obszary poniżej progu prywatności są ukrywane.";
  }
  const d = n % 10;
  const h = n % 100;
  const phrase =
    n === 1
      ? "jest 1 zgłoszenie"
      : d >= 2 && d <= 4 && !(h >= 12 && h <= 14)
        ? `są ${n.toLocaleString("pl-PL")} zgłoszenia`
        : `jest ${n.toLocaleString("pl-PL")} zgłoszeń`;
  return (
    `Dla wybranych filtrów ${phrase} w całej bazie, ale żaden obszar nie osiągnął ` +
    `progu prywatności (min. ${data.minimumCellCount} zgłoszeń w jednej okolicy), ` +
    `więc dane pozostają ukryte.`
  );
}

/** Polish plural form for "kleszcz" after a number. */
function kleszczeForm(n: number): string {
  if (n === 1) return "kleszcza";
  const d = n % 10;
  const h = n % 100;
  if (d >= 2 && d <= 4 && !(h >= 12 && h <= 14)) return "kleszcze";
  return "kleszczy";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return "przed chwilą";
  if (min < 60) return `${min} min temu`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `${hrs} godz. temu`;
  const days = Math.round(hrs / 24);
  return `${days} dni temu`;
}

export default function HeatmapPage() {
  const [window_, setWindow] = useState<HeatmapWindow>("7d");
  const [place, setPlace] = useState<PlaceType | "all">("all");
  const [who, setWho] = useState<SubjectType | "all">("all");
  const [resolution, setResolution] = useState(zoomToResolution(5.4));

  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getHeatmap({
      window: window_,
      resolution,
      ...(place !== "all" ? { placeType: place } : {}),
      ...(who !== "all" ? { subjectType: who } : {}),
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(polishErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [window_, place, who, resolution]);

  const stats = useMemo(() => {
    if (!data) return null;
    const areas = data.cells.length;
    const approxReports = data.cells.reduce((sum, c) => sum + c.countBucket, 0);
    return { areas, approxReports };
  }, [data]);

  const hasCells = (data?.cells.length ?? 0) > 0;
  // Badges (country tier at res 3, voivodeship tier at res 4–5) count as
  // displayed data — while they're shown the "nothing to display" message
  // would be false.
  const badgesVisible =
    (resolution === 3 && (data?.countries?.some((c) => c.count > 0) ?? false)) ||
    (resolution >= 4 && resolution <= 5 && (data?.regions?.some((r) => r.count > 0) ?? false));

  return (
    <AppShell>
      <Screen>
        <div className="flex items-center justify-between px-5 pb-3 pt-[18px]">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Wróć"
              className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-panel-border bg-white text-slate transition hover:bg-panel"
            >
              <ArrowLeftIcon size={18} strokeWidth={2.4} />
            </Link>
            <h1 className="m-0 font-serif text-[20px] font-semibold text-ink">
              Mapa ryzyka
            </h1>
          </div>
          <Link
            href="/zglos"
            className="rounded-full bg-forest px-3.5 py-[9px] text-[13px] font-bold text-white transition hover:bg-forest-600"
          >
            + Zgłoś
          </Link>
        </div>

        {/* Map */}
        <div className="relative mx-4 h-[300px] overflow-hidden rounded-[18px] border border-map-border bg-map-bg">
          <HeatmapMap
            cells={data?.cells ?? []}
            countries={data?.countries ?? []}
            regions={data?.regions ?? []}
            onZoomChange={(zoom) => setResolution(zoomToResolution(zoom))}
          />

          <div className="pointer-events-none absolute left-3 top-3 z-[1] rounded-full bg-white/85 px-[11px] py-[5px] text-[11.5px] font-semibold text-[#4A574F]">
            {WINDOW_RANGE_LABEL[window_]}
          </div>

          {loading ? (
            <div className="pointer-events-none absolute right-3 top-3 z-[1] flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-[5px] text-[11px] font-semibold text-muted">
              <SpinnerIcon size={12} className="text-forest" /> Ładowanie
            </div>
          ) : null}

          {!loading && !error && !hasCells && !badgesVisible && data ? (
            <div className="absolute inset-x-4 top-1/2 z-[1] -translate-y-1/2 rounded-xl2 bg-white/92 px-4 py-3 text-center text-[13px] font-medium leading-[1.5] text-muted shadow-sm">
              {emptyMapMessage(data)}
            </div>
          ) : null}

          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1] flex items-center gap-2 rounded-[11px] bg-white/90 px-3 py-2">
            <span className="text-[11px] font-semibold text-muted">Niższe</span>
            <div
              className="h-2 flex-1 rounded-full"
              style={{ background: "linear-gradient(90deg,#86B08A,#E0A24C,#CE6A4E)" }}
            />
            <span className="text-[11px] font-semibold text-muted">Wyższe</span>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-1 pt-3.5">
          <div className="rk-scroll flex gap-2 overflow-x-auto pb-1">
            {WINDOW_FILTERS.map((f) => (
              <FilterPill
                key={f.key}
                label={f.label}
                selected={window_ === f.key}
                onClick={() => setWindow(f.key)}
              />
            ))}
          </div>
          <div className="rk-scroll flex gap-2 overflow-x-auto py-2">
            {PLACE_FILTERS.map((f) => (
              <FilterPill
                key={f.key}
                label={f.label}
                selected={place === f.key}
                onClick={() => setPlace(f.key)}
              />
            ))}
          </div>
          <div className="rk-scroll flex gap-2 overflow-x-auto pb-1.5">
            {WHO_FILTERS.map((f) => (
              <FilterPill
                key={f.key}
                label={f.label}
                selected={who === f.key}
                onClick={() => setWho(f.key)}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 pb-7 pt-2">
          {error ? (
            <Callout
              tone="alarm"
              icon={<InfoIcon size={20} strokeWidth={2.1} className="text-alarm-ink" />}
            >
              {error}
            </Callout>
          ) : (
            <>
              <div className="flex gap-2.5">
                <div className="flex-1 rounded-xl2 border border-panel-border bg-white p-3.5">
                  <div className="mb-1.5 text-[11.5px] font-semibold text-faint">
                    Obszary podwyższonego ryzyka
                  </div>
                  <div className="font-serif text-[26px] font-semibold text-ink">
                    {stats ? stats.areas : "—"}
                  </div>
                </div>
                <div className="flex-1 rounded-xl2 border border-panel-border bg-white p-3.5">
                  <div className="mb-1.5 text-[11.5px] font-semibold text-faint">
                    Przybliżone zgłoszenia
                  </div>
                  <div className="font-serif text-[26px] font-semibold text-ink">
                    {stats ? `≈ ${stats.approxReports.toLocaleString("pl-PL")}` : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 px-0.5 text-[12.5px] text-faint">
                <ClockIcon size={14} className="text-hint" />
                {data
                  ? `Ostatnia aktualizacja: ${relativeTime(data.generatedAt)} · próg prywatności: ${data.minimumCellCount}`
                  : "Wczytywanie danych…"}
              </div>
              {data && typeof data.totalReports === "number" ? (
                <div className="mt-1.5 flex items-center gap-2 px-0.5 text-[12.5px] text-faint">
                  <InfoIcon size={14} className="text-hint" />
                  {`Zgłoszono ${data.totalReports.toLocaleString("pl-PL")} ${kleszczeForm(data.totalReports)} (${(data.reportsLast24h ?? 0).toLocaleString("pl-PL")} w ostatnich 24 h)`}
                </div>
              ) : null}

              <Callout
                tone="neutral"
                className="mt-3.5"
                icon={<ShieldIcon size={18} strokeWidth={2} className="text-forest" />}
              >
                Mapa pokazuje wyłącznie <b className="text-slate">dane zagregowane</b>.
                Nie zobaczysz tu pojedynczych zgłoszeń ani dokładnych lokalizacji.
              </Callout>
            </>
          )}
        </div>
      </Screen>
    </AppShell>
  );
}

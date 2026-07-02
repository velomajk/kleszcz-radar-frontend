"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell, Screen, LoadingState, PrimaryButton } from "@/components/ui";
import { SymptomFlow } from "@/components/SymptomFlow";
import { BASE_PATH } from "@/lib/config";

/**
 * On GitHub Pages (static export) there is no server to render the dynamic
 * `/symptoms/{token}` route, so any unknown path is served as this 404 page.
 * We use it as a tiny client-side router: if the path is a symptom link, we
 * render the symptom flow with the token parsed from the URL. This is the
 * standard pattern for hosting client-routed dynamic paths on a static host.
 */
export default function NotFound() {
  const [route, setRoute] = useState<
    { kind: "symptom"; token: string } | { kind: "unknown" } | null
  >(null);

  useEffect(() => {
    let path = window.location.pathname;
    if (BASE_PATH && path.startsWith(BASE_PATH)) path = path.slice(BASE_PATH.length);
    const match = path.match(/^\/symptoms\/([^/]+)\/?$/);
    if (match) {
      setRoute({ kind: "symptom", token: decodeURIComponent(match[1]) });
    } else {
      setRoute({ kind: "unknown" });
    }
  }, []);

  if (route?.kind === "symptom") {
    return <SymptomFlow token={route.token} />;
  }

  if (route === null) {
    return (
      <AppShell>
        <Screen>
          <LoadingState label="Wczytywanie…" />
        </Screen>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Screen>
        <div className="flex flex-1 flex-col items-center justify-center px-[22px] py-16 text-center">
          <div className="mb-4 font-serif text-[52px] font-semibold text-forest">404</div>
          <h1 className="mb-2 font-serif text-[22px] font-semibold text-ink">
            Nie znaleziono strony
          </h1>
          <p className="max-w-[300px] text-[15px] leading-[1.55] text-muted">
            Ten adres nie istnieje lub link jest niekompletny.
          </p>
          <div className="mt-7 w-full">
            <PrimaryButton href="/">Wróć na stronę główną</PrimaryButton>
          </div>
        </div>
      </Screen>
    </AppShell>
  );
}

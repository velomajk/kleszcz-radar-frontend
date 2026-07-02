"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AppShell,
  Screen,
  LoadingState,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  Callout,
} from "@/components/ui";
import {
  CheckIcon,
  LinkIcon,
  InfoIcon,
  AlertTriangleIcon,
  MapLayersIcon,
} from "@/components/icons";
import { confirmReport, polishErrorMessage } from "@/lib/api";
import type { ConfirmResponse } from "@/lib/types";

type Status = "loading" | "success" | "error" | "missing";

export function VerifyReportContent() {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState<Status>("loading");
  const [result, setResult] = useState<ConfirmResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return; // guard React strict-mode double effect
    firedRef.current = true;

    if (!token) {
      setStatus("missing");
      return;
    }
    confirmReport(token)
      .then((res) => {
        setResult(res);
        setStatus("success");
      })
      .catch((err) => {
        setErrorMsg(polishErrorMessage(err));
        setStatus("error");
      });
  }, [token]);

  if (status === "loading") {
    return (
      <AppShell>
        <Screen>
          <LoadingState label="Potwierdzamy zgłoszenie…" />
        </Screen>
      </AppShell>
    );
  }

  if (status === "missing" || status === "error") {
    return (
      <AppShell>
        <Screen>
          <div className="flex flex-1 flex-col items-center justify-center px-[22px] py-14 text-center">
            <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-alarm-bg">
              <AlertTriangleIcon size={34} strokeWidth={2.2} className="text-alarm-ink" />
            </div>
            <h1 className="mb-2.5 font-serif text-[24px] font-semibold text-ink">
              Nie udało się potwierdzić
            </h1>
            <p className="max-w-[300px] text-[15px] leading-[1.55] text-muted">
              {status === "missing"
                ? "Brakuje tokenu w adresie. Otwórz link dokładnie tak, jak przyszedł w wiadomości email."
                : errorMsg}
            </p>
            <div className="mt-7 w-full">
              <PrimaryButton href="/zglos">Zgłoś ukłucie ponownie</PrimaryButton>
            </div>
            <div className="mt-2 w-full">
              <GhostButton href="/">Wróć na stronę główną</GhostButton>
            </div>
          </div>
        </Screen>
      </AppShell>
    );
  }

  // success
  return <SuccessScreen result={result!} />;
}

function SuccessScreen({ result }: { result: ConfirmResponse }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(result.symptomUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — the link is visible for manual copy */
    }
  }

  return (
    <AppShell>
      <Screen>
        <div
          className="px-[22px] pb-[22px] pt-10 text-center text-white"
          style={{ background: "linear-gradient(178deg,#14584A,#0F463B)" }}
        >
          <div className="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/[0.14]">
            <CheckIcon size={38} strokeWidth={2.6} className="text-white" />
          </div>
          <h1 className="mb-2 font-serif text-[25px] font-semibold">
            Zgłoszenie zostało dodane anonimowo
          </h1>
          <p className="mx-auto max-w-[290px] text-[14.5px] leading-[1.5] text-white/80">
            Dziękujemy — Twoje zgłoszenie zasili publiczną mapę ryzyka w Twojej
            okolicy.
          </p>
        </div>

        <div className="flex flex-col gap-3.5 px-[22px] pb-7 pt-5">
          {/* Private symptom link */}
          <div className="rounded-2xl border-[1.5px] border-forest bg-white p-4">
            <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.3px] text-forest">
              <LinkIcon size={15} strokeWidth={2.2} className="text-forest" />
              Twój prywatny link
            </div>
            <div className="break-all rounded-[11px] bg-panel px-3.5 py-3 text-[14px] font-semibold text-forest-800">
              {result.symptomUrl}
            </div>
            <div className="mt-3 flex gap-2.5">
              <button
                onClick={copy}
                className={
                  "flex-1 rounded-[13px] border-[1.5px] border-forest py-3.5 text-[15px] font-semibold transition " +
                  (copied ? "bg-mint text-forest-800" : "bg-forest text-white hover:bg-forest-600")
                }
              >
                {copied ? "Skopiowano ✓" : "Skopiuj link"}
              </button>
              <a
                href={result.symptomUrl}
                className="flex flex-1 items-center justify-center rounded-[13px] border-[1.5px] border-forest bg-white py-3.5 text-center text-[15px] font-semibold text-forest-800 transition hover:bg-mint"
              >
                Otwórz link do objawów
              </a>
            </div>
          </div>

          <Callout
            tone="neutral"
            icon={<InfoIcon size={20} strokeWidth={2} className="text-amber-ink" />}
          >
            <b className="text-ink">Zapisz ten link.</b> Nie wysyłamy przypomnień
            i nie będziemy się z Tobą kontaktować. Bez niego nie da się wrócić do
            tego zgłoszenia.
          </Callout>

          <PrimaryButton href="/mapa">
            <MapLayersIcon size={18} strokeWidth={2.2} />
            Zobacz mapę ryzyka
          </PrimaryButton>

          <div className="mt-1 rounded-xl2 border border-amber-border bg-amber-bg p-4">
            <div className="mb-2 text-[13px] font-bold text-amber-ink">
              Kiedy skontaktować się z lekarzem
            </div>
            <div className="text-[13.5px] leading-[1.55] text-amber-soft">
              Obserwuj miejsce ukłucia przez kilka tygodni. Skontaktuj się z
              lekarzem, jeśli pojawi się <b>rozszerzające się zaczerwienienie</b>,
              gorączka, silny ból głowy lub złe samopoczucie. To nie jest
              diagnoza — w razie wątpliwości pytaj lekarza.
            </div>
          </div>
        </div>
      </Screen>
    </AppShell>
  );
}

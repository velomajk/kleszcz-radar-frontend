"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  AppShell,
  Screen,
  OptionChip,
  PrimaryButton,
  GhostButton,
  Callout,
} from "@/components/ui";
import {
  ArrowLeftIcon,
  ShieldIcon,
  MailIcon,
  LockIcon,
  PinIcon,
  CheckIcon,
  InfoIcon,
} from "@/components/icons";
import { Turnstile } from "@/components/Turnstile";
import { requestReportVerification, polishErrorMessage, ApiError } from "@/lib/api";
import { validateEmail } from "@/lib/validation";
import { IS_TURNSTILE_TEST_KEY } from "@/lib/config";
import {
  WHEN_OPTIONS,
  WHO_OPTIONS,
  PLACE_OPTIONS,
  EMBEDDED_OPTIONS,
  REMOVED_OPTIONS,
  whenKeyToOccurredOn,
  placeKeyToPlaceType,
  removedKeyToTickRemoved,
  type WhenKey,
  type WhoKey,
  type PlaceKey,
  type EmbeddedKey,
  type RemovedKey,
} from "@/lib/mappings";
import type { ReportVerificationInput } from "@/lib/types";

const LocationPicker = dynamic(
  () => import("@/components/LocationPicker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[270px] animate-pulse rounded-2xl border border-map-border bg-map-bg" />
    ),
  },
);

type Coords = { lat: number; lng: number };
type Phase = "wizard" | "email" | "sent";

interface ReportState {
  when: WhenKey | null;
  who: WhoKey | null;
  place: PlaceKey | null;
  embedded: EmbeddedKey | null; // collected for design fidelity; NOT sent (no backend field)
  removed: RemovedKey | null;
  coords: Coords | null;
}

const TOTAL_STEPS = 6;

export default function ReportPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("wizard");
  const [step, setStep] = useState(0);
  const [report, setReport] = useState<ReportState>({
    when: null,
    who: null,
    place: null,
    embedded: null,
    removed: null,
    coords: null,
  });

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [expiresInSeconds, setExpiresInSeconds] = useState(0);

  const progressPct = `${((step + 1) / TOTAL_STEPS) * 100}%`;

  function selectAndAdvance<K extends keyof ReportState>(field: K, value: ReportState[K]) {
    setReport((s) => ({ ...s, [field]: value }));
    if (step < 5) {
      window.setTimeout(() => setStep((s) => Math.min(5, s + 1)), 180);
    }
  }

  function back() {
    if (step === 0) {
      router.push("/");
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  async function submit() {
    setSubmitError("");
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    if (!turnstileToken) {
      setSubmitError("Poczekaj chwilę na weryfikację antyspamową i spróbuj ponownie.");
      return;
    }
    if (!report.when || !report.who || !report.place || !report.removed || !report.coords) {
      setSubmitError("Uzupełnij wszystkie kroki zgłoszenia.");
      return;
    }

    const input: ReportVerificationInput = {
      email: email.trim(),
      turnstileToken,
      latitude: report.coords.lat,
      longitude: report.coords.lng,
      occurredOn: whenKeyToOccurredOn(report.when),
      placeType: placeKeyToPlaceType(report.place),
      subjectType: report.who,
      tickRemoved: removedKeyToTickRemoved(report.removed),
      // NOTE: `removalMethod` and `estimatedAttachmentHours` are optional in the
      // backend and not collected by this design, so they are intentionally
      // omitted. The "tick attached?" answer (report.embedded) has no backend
      // field and is likewise not sent — see mappings.ts (TODO).
    };

    setSubmitting(true);
    try {
      const res = await requestReportVerification(input);
      setExpiresInSeconds(res.expiresInSeconds);
      setPhase("sent");
    } catch (err) {
      setSubmitError(polishErrorMessage(err));
      // A failed challenge means the token is spent — force a fresh one.
      if (err instanceof ApiError && err.code === "challenge_failed") {
        setTurnstileToken("");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (phase === "sent") {
    return <SentScreen email={email} expiresInSeconds={expiresInSeconds} />;
  }

  if (phase === "email") {
    return (
      <AppShell>
        <Screen>
          <div className="flex items-center gap-3 px-5 pb-1.5 pt-[18px]">
            <button
              onClick={() => setPhase("wizard")}
              aria-label="Wróć do zgłoszenia"
              className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-panel-border bg-white text-slate transition hover:bg-panel"
            >
              <ArrowLeftIcon size={18} strokeWidth={2.4} />
            </button>
            <span className="text-[13px] font-semibold text-faint">
              Ostatni krok · potwierdzenie
            </span>
          </div>
          <div className="px-[22px] pb-6 pt-3.5">
            <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-mint">
              <MailIcon size={26} className="text-forest" strokeWidth={2} />
            </div>
            <h1 className="mb-2 font-serif text-[26px] font-semibold leading-[1.22] text-ink">
              Potwierdź email, aby chronić mapę
            </h1>
            <p className="mb-5 text-[15px] leading-[1.5] text-muted">
              To nie jest zakładanie konta. Weryfikacja mailowa zapobiega
              zaśmiecaniu mapy fałszywymi zgłoszeniami.
            </p>

            <label htmlFor="email" className="mb-2 block text-[13.5px] font-semibold text-slate">
              Adres email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="np. jan@przyklad.pl"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              className={
                "w-full rounded-[13px] border-[1.5px] bg-white px-4 py-[15px] text-[16px] text-ink outline-none transition " +
                (emailError ? "border-risk-high" : "border-field-border focus:border-forest")
              }
            />
            {emailError ? (
              <div className="mt-[9px] flex items-center gap-[7px] text-[13.5px] font-semibold text-alarm-strong">
                <InfoIcon size={16} strokeWidth={2.2} className="text-risk-high" />
                {emailError}
              </div>
            ) : null}

            <Callout
              tone="neutral"
              className="mt-4"
              icon={<LockIcon size={20} className="text-forest" strokeWidth={2} />}
            >
              Email służy <b className="text-forest-800">tylko do ochrony mapy przed spamem</b>.
              Nie jest zapisywany razem ze zgłoszeniem i nie łączymy go z Twoimi
              danymi.
            </Callout>

            <div className="mt-4">
              <Turnstile onVerify={setTurnstileToken} className="min-h-[65px]" />
              {IS_TURNSTILE_TEST_KEY ? (
                <p className="mt-1 text-[11px] text-hint">
                  Tryb testowy weryfikacji antyspamowej (klucz deweloperski).
                </p>
              ) : null}
            </div>

            {submitError ? (
              <Callout
                tone="alarm"
                className="mt-4"
                icon={<InfoIcon size={20} strokeWidth={2.1} className="text-alarm-ink" />}
              >
                {submitError}
              </Callout>
            ) : null}

            <div className="mt-5">
              <PrimaryButton onClick={submit} loading={submitting}>
                {submitting ? "Wysyłanie…" : "Wyślij link weryfikacyjny"}
              </PrimaryButton>
            </div>
            <p className="mx-1 mt-3.5 text-center text-[12.5px] leading-[1.5] text-faint">
              Wysyłając link akceptujesz, że zgłoszenia są anonimowe i służą celom
              epidemiologicznym.
            </p>
          </div>
        </Screen>
      </AppShell>
    );
  }

  // phase === "wizard"
  return (
    <AppShell>
      <Screen>
        {/* Header with progress + anonymity chip */}
        <div className="px-5 pb-3.5 pt-[18px]">
          <div className="mb-3.5 flex items-center gap-3">
            <button
              onClick={back}
              aria-label="Wróć"
              className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-panel-border bg-white text-slate transition hover:bg-panel"
            >
              <ArrowLeftIcon size={18} strokeWidth={2.4} />
            </button>
            <div className="flex-1">
              <div className="mb-1.5 flex justify-between text-[12px] font-semibold text-faint">
                <span>Zgłoszenie ukłucia</span>
                <span>
                  Krok {step + 1} z {TOTAL_STEPS}
                </span>
              </div>
              <div className="h-[5px] overflow-hidden rounded-full bg-panel-border">
                <div
                  className="h-full rounded-full bg-forest transition-[width] duration-300"
                  style={{ width: progressPct }}
                />
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-[7px] rounded-full bg-mint px-[11px] py-1.5 text-[11.5px] font-semibold text-forest-800">
            <ShieldIcon size={13} strokeWidth={2.4} className="text-forest" />
            Anonimowo — bez podawania danych osobowych
          </div>
        </div>

        <div className="flex-1 px-[22px] pb-7 pt-1.5">
          {step === 0 && (
            <WizardStep
              title="Kiedy doszło do ukłucia?"
              subtitle="Wystarczy przybliżony czas."
            >
              {WHEN_OPTIONS.map((o) => (
                <OptionChip
                  key={o.key}
                  label={o.label}
                  selected={report.when === o.key}
                  onClick={() => selectAndAdvance("when", o.key)}
                />
              ))}
            </WizardStep>
          )}

          {step === 1 && (
            <WizardStep
              title="Kogo dotyczyło ukłucie?"
              subtitle="Pomaga to rozróżnić ryzyko dla ludzi i zwierząt."
            >
              {WHO_OPTIONS.map((o) => (
                <OptionChip
                  key={o.key}
                  label={o.label}
                  selected={report.who === o.key}
                  onClick={() => selectAndAdvance("who", o.key)}
                />
              ))}
            </WizardStep>
          )}

          {step === 2 && (
            <WizardStep title="Jaki to był teren?" subtitle="Typ miejsca, nie dokładny adres.">
              {PLACE_OPTIONS.map((o) => (
                <OptionChip
                  key={o.key}
                  label={o.label}
                  selected={report.place === o.key}
                  onClick={() => selectAndAdvance("place", o.key)}
                />
              ))}
            </WizardStep>
          )}

          {step === 3 && (
            <WizardStep
              title="Czy kleszcz był wbity?"
              subtitle="Jeśli nie masz pewności, wybierz „Nie wiem”."
            >
              {EMBEDDED_OPTIONS.map((o) => (
                <OptionChip
                  key={o.key}
                  label={o.label}
                  selected={report.embedded === o.key}
                  onClick={() => selectAndAdvance("embedded", o.key)}
                />
              ))}
            </WizardStep>
          )}

          {step === 4 && (
            <WizardStep
              title="Czy kleszcz został usunięty?"
              subtitle="To ostatnie pytanie o samo ukłucie."
            >
              {REMOVED_OPTIONS.map((o) => (
                <OptionChip
                  key={o.key}
                  label={o.label}
                  selected={report.removed === o.key}
                  onClick={() => selectAndAdvance("removed", o.key)}
                />
              ))}
            </WizardStep>
          )}

          {step === 5 && (
            <div>
              <h2 className="mb-1 mt-2 font-serif text-[23px] font-semibold text-ink">
                Gdzie to było?
              </h2>
              <p className="mb-3.5 text-[14px] text-muted">
                Wskaż przybliżony obszar. Nie potrzebujemy dokładnego punktu.
              </p>

              <LocationPicker
                value={report.coords}
                onPick={(coords) => setReport((s) => ({ ...s, coords }))}
              />

              <div className="mt-3 flex items-center gap-[9px] rounded-xl2 bg-mint px-3.5 py-[11px] text-[13.5px] font-semibold text-forest-800">
                <PinIcon size={17} strokeWidth={2.2} className="flex-none text-forest" />
                {report.coords
                  ? "Wskazano przybliżony obszar — publicznie pokażemy tylko okolicę"
                  : "Dotknij mapy, aby wskazać przybliżony obszar"}
              </div>

              {submitError ? (
                <Callout
                  tone="alarm"
                  className="mt-3"
                  icon={<InfoIcon size={20} strokeWidth={2.1} className="text-alarm-ink" />}
                >
                  {submitError}
                </Callout>
              ) : null}

              <div className="mt-4">
                <PrimaryButton
                  onClick={() => {
                    setSubmitError("");
                    setPhase("email");
                  }}
                  disabled={!report.coords}
                >
                  Dodaj anonimowe zgłoszenie
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
      </Screen>
    </AppShell>
  );
}

function WizardStep({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade">
      <h2 className="mb-1 mt-2 font-serif text-[23px] font-semibold text-ink">{title}</h2>
      <p className="mb-[18px] text-[14px] text-muted">{subtitle}</p>
      <div className="flex flex-col gap-[10px]">{children}</div>
    </div>
  );
}

function SentScreen({
  email,
  expiresInSeconds,
}: {
  email: string;
  expiresInSeconds: number;
}) {
  const minutes = Math.max(1, Math.round(expiresInSeconds / 60));
  return (
    <AppShell>
      <Screen>
        <div className="flex items-center gap-3 px-5 pb-1.5 pt-[18px]">
          <Link
            href="/"
            aria-label="Strona główna"
            className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-panel-border bg-white text-slate transition hover:bg-panel"
          >
            <ArrowLeftIcon size={18} strokeWidth={2.4} />
          </Link>
          <span className="text-[13px] font-semibold text-faint">
            Sprawdź skrzynkę
          </span>
        </div>
        <div className="flex flex-col items-center px-[22px] pb-6 pt-9 text-center">
          <div className="relative mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-mint">
            <MailIcon size={36} className="text-forest" strokeWidth={1.9} />
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-card bg-forest">
              <CheckIcon size={14} strokeWidth={3} className="text-white" />
            </div>
          </div>
          <h1 className="mb-2.5 font-serif text-[26px] font-semibold leading-[1.22] text-ink">
            Sprawdź swoją skrzynkę
          </h1>
          <p className="max-w-[300px] text-[15px] leading-[1.55] text-muted">
            Wysłaliśmy link weryfikacyjny. Kliknij go, aby potwierdzić i dodać
            zgłoszenie do mapy ryzyka.
          </p>
          {email ? (
            <p className="mt-3 rounded-full bg-panel px-3.5 py-[9px] text-[14px] font-semibold text-slate">
              {email}
            </p>
          ) : null}

          <Callout
            tone="neutral"
            className="mt-6 text-left"
            icon={<InfoIcon size={20} className="text-faint" strokeWidth={2} />}
          >
            Nie widzisz wiadomości? Sprawdź folder spam. Link jest ważny przez
            około {minutes} min.
          </Callout>

          <div className="mt-6 w-full">
            <PrimaryButton href="/mapa">Zobacz mapę ryzyka</PrimaryButton>
          </div>
          <div className="mt-2 w-full">
            <GhostButton href="/">Wróć na stronę główną</GhostButton>
          </div>
        </div>
      </Screen>
    </AppShell>
  );
}

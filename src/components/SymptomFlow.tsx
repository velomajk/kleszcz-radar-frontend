"use client";

import { useEffect, useRef, useState } from "react";
import {
  AppShell,
  Screen,
  TopBar,
  OptionChip,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  Callout,
  SectionLabel,
  LoadingState,
} from "@/components/ui";
import {
  CheckIcon,
  HeartIcon,
  InfoIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
} from "@/components/icons";
import { getSymptomStatus, submitSymptoms, polishErrorMessage } from "@/lib/api";
import {
  symptomDraftToInput,
  symptomAlarm,
  type SymptomDraft,
  type RashKey,
  type RashGrowKey,
  type DoctorKey,
} from "@/lib/mappings";

type Load = "loading" | "valid" | "invalid";

const RASH_OPTIONS: { key: RashKey; label: string }[] = [
  { key: "yes", label: "Tak, pojawiło się zaczerwienienie" },
  { key: "no", label: "Nie" },
  { key: "unknown", label: "Nie jestem pewien / pewna" },
];

const RASH_GROW_OPTIONS: { key: RashGrowKey; label: string }[] = [
  { key: "yes", label: "Tak, powiększa się" },
  { key: "no", label: "Nie, wygląda tak samo" },
  { key: "unknown", label: "Trudno powiedzieć" },
];

const DOCTOR_OPTIONS: { key: DoctorKey; label: string }[] = [
  { key: "yes", label: "Tak, byłem/byłam u lekarza" },
  { key: "planned", label: "Mam umówioną wizytę" },
  { key: "no", label: "Jeszcze nie" },
];

const TOGGLES: { key: keyof SymptomDraft; label: string }[] = [
  { key: "fever", label: "Gorączka" },
  { key: "headache", label: "Ból głowy" },
  { key: "muscle", label: "Bóle mięśni / stawów" },
  { key: "neck", label: "Sztywność karku" },
  { key: "nausea", label: "Nudności / wymioty" },
  { key: "neuro", label: "Objawy neurologiczne" },
];

const EMPTY_DRAFT: SymptomDraft = {
  rash: null,
  rashGrowing: null,
  fever: false,
  headache: false,
  muscle: false,
  neck: false,
  nausea: false,
  neuro: false,
  doctor: null,
};

export function SymptomFlow({ token }: { token: string }) {
  const [load, setLoad] = useState<Load>("loading");
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [draft, setDraft] = useState<SymptomDraft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    getSymptomStatus(token)
      .then((res) => {
        setAlreadySubmitted(res.submitted);
        setLoad(res.valid ? "valid" : "invalid");
      })
      .catch(() => setLoad("invalid"));
  }, [token]);

  async function submit() {
    setSubmitError("");
    setSubmitting(true);
    try {
      await submitSymptoms(token, symptomDraftToInput(draft));
      setDone(true);
    } catch (err) {
      setSubmitError(polishErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const toggle = (key: keyof SymptomDraft) =>
    setDraft((s) => ({ ...s, [key]: !s[key] }));

  if (load === "loading") {
    return (
      <AppShell>
        <Screen>
          <LoadingState label="Sprawdzamy link…" />
        </Screen>
      </AppShell>
    );
  }

  if (load === "invalid") {
    return (
      <AppShell>
        <Screen>
          <div className="flex flex-1 flex-col items-center justify-center px-[22px] py-14 text-center">
            <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] bg-alarm-bg">
              <AlertTriangleIcon size={34} strokeWidth={2.2} className="text-alarm-ink" />
            </div>
            <h1 className="mb-2.5 font-serif text-[24px] font-semibold text-ink">
              Link jest nieprawidłowy lub wygasł
            </h1>
            <p className="max-w-[300px] text-[15px] leading-[1.55] text-muted">
              Prywatne linki do objawów działają przez ograniczony czas i tylko
              raz na zgłoszenie. Jeśli chcesz, możesz dodać nowe zgłoszenie.
            </p>
            <div className="mt-7 w-full">
              <PrimaryButton href="/">Wróć na stronę główną</PrimaryButton>
            </div>
          </div>
        </Screen>
      </AppShell>
    );
  }

  if (done) {
    return <SymptomDone />;
  }

  const alarm = symptomAlarm(draft);

  return (
    <AppShell>
      <Screen>
        <TopBar label="Prywatny link · uzupełnienie objawów" backHref="/" />
        <div className="px-[22px] pb-7 pt-2.5">
          <h1 className="mb-1.5 font-serif text-[24px] font-semibold leading-[1.22] text-ink">
            Jak się teraz czujesz?
          </h1>
          <p className="mb-4 text-[14px] leading-[1.5] text-muted">
            Wypełnienie jest dobrowolne i anonimowe. Zaznacz tylko to, co Cię
            dotyczy.
          </p>

          {alreadySubmitted ? (
            <Callout
              tone="mint"
              className="mb-4"
              icon={<InfoIcon size={18} strokeWidth={2} className="text-forest" />}
            >
              Objawy zostały już wcześniej uzupełnione. Możesz je zaktualizować —
              nowe dane zastąpią poprzednie.
            </Callout>
          ) : null}

          <Callout
            tone="amber"
            className="mb-5"
            icon={<InfoIcon size={19} strokeWidth={2.1} className="text-amber-ink" />}
          >
            <b className="text-ink">To nie jest diagnoza.</b> Jeśli objawy Cię
            niepokoją, skontaktuj się z lekarzem.
          </Callout>

          <SectionLabel>Rumień (zaczerwienienie)</SectionLabel>
          <div className="mb-2 flex flex-col gap-[9px]">
            {RASH_OPTIONS.map((o) => (
              <OptionChip
                key={o.key}
                label={o.label}
                selected={draft.rash === o.key}
                onClick={() =>
                  setDraft((s) => ({
                    ...s,
                    rash: o.key,
                    rashGrowing: o.key === "yes" ? s.rashGrowing : null,
                  }))
                }
              />
            ))}
          </div>
          {draft.rash === "yes" ? (
            <div className="animate-fade">
              <div className="mb-[9px] mt-3 text-[13px] font-semibold text-muted">
                Czy zaczerwienienie się powiększa?
              </div>
              <div className="flex flex-col gap-[9px]">
                {RASH_GROW_OPTIONS.map((o) => (
                  <OptionChip
                    key={o.key}
                    label={o.label}
                    selected={draft.rashGrowing === o.key}
                    onClick={() => setDraft((s) => ({ ...s, rashGrowing: o.key }))}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-[22px]">
            <SectionLabel>Samopoczucie</SectionLabel>
          </div>
          <div className="flex flex-col gap-[9px]">
            {TOGGLES.map((t) => {
              const checked = Boolean(draft[t.key]);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggle(t.key)}
                  aria-pressed={checked}
                  className={
                    "flex w-full items-center justify-between gap-3 rounded-[13px] border-[1.5px] px-4 py-3.5 text-left text-[15.5px] font-semibold transition " +
                    (checked
                      ? "border-forest bg-mint text-forest-800"
                      : "border-field-border bg-white text-ink hover:border-forest/40")
                  }
                >
                  <span>{t.label}</span>
                  <span
                    className={
                      "flex h-6 w-6 flex-none items-center justify-center rounded-[7px] border-[1.5px] text-[14px] text-white transition " +
                      (checked ? "border-forest bg-forest" : "border-[#CFD8D2] bg-white")
                    }
                  >
                    {checked ? "✓" : ""}
                  </span>
                </button>
              );
            })}
          </div>

          {alarm ? (
            <Callout
              tone="alarm"
              className="mt-4"
              icon={<ShieldAlertIcon size={20} strokeWidth={2.2} className="text-alarm-ink" />}
            >
              Zaznaczone objawy warto skonsultować.{" "}
              <b>Zalecamy kontakt z lekarzem</b> — nie zwlekaj, jeśli czujesz się
              źle.
            </Callout>
          ) : null}

          <div className="mt-[22px]">
            <SectionLabel>Kontakt z lekarzem</SectionLabel>
          </div>
          <div className="flex flex-col gap-[9px]">
            {DOCTOR_OPTIONS.map((o) => (
              <OptionChip
                key={o.key}
                label={o.label}
                selected={draft.doctor === o.key}
                onClick={() => setDraft((s) => ({ ...s, doctor: o.key }))}
              />
            ))}
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

          <div className="mt-[22px]">
            <PrimaryButton onClick={submit} loading={submitting}>
              {submitting ? "Zapisywanie…" : "Uzupełnij anonimowo"}
            </PrimaryButton>
          </div>
        </div>
      </Screen>
    </AppShell>
  );
}

function SymptomDone() {
  return (
    <AppShell>
      <Screen>
        <div className="flex flex-col items-center px-[22px] pb-6 pt-14 text-center">
          <div className="mb-5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-mint">
            <CheckIcon size={38} strokeWidth={2.4} className="text-forest" />
          </div>
          <h1 className="mb-2.5 font-serif text-[25px] font-semibold leading-[1.2] text-ink">
            Dziękujemy za uzupełnienie
          </h1>
          <p className="max-w-[300px] text-[15px] leading-[1.55] text-muted">
            Twoje anonimowe dane pomagają lepiej rozumieć lokalne ryzyko związane
            z kleszczami.
          </p>
        </div>
        <div className="flex flex-col gap-3 px-[22px] pb-7 pt-2">
          <Callout
            tone="amber"
            icon={<HeartIcon size={20} strokeWidth={2} className="text-amber-ink" />}
          >
            <b className="text-ink">Radar Kleszczy nie zastępuje lekarza.</b> Jeśli
            martwią Cię objawy — nawet jeśli wydają się drobne — skontaktuj się z
            lekarzem lub zadzwoń pod 112 w nagłych przypadkach.
          </Callout>
          <PrimaryButton href="/mapa">Zobacz mapę ryzyka</PrimaryButton>
          <SecondaryButton href="/po-ukluciu">Co robić po ukłuciu?</SecondaryButton>
          <GhostButton href="/">Wróć na start</GhostButton>
        </div>
      </Screen>
    </AppShell>
  );
}

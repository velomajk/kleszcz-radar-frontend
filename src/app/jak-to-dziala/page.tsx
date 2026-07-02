import { AppShell, Screen, TopBar, PrimaryButton, Callout } from "@/components/ui";
import { ShieldIcon } from "@/components/icons";

const STEPS = [
  {
    n: "1",
    title: "Potwierdź email",
    body: (
      <>
        Jeden klik w link z wiadomości. To chroni mapę przed spamem —{" "}
        <b className="font-semibold text-slate">nie zakładasz konta</b>.
      </>
    ),
  },
  {
    n: "2",
    title: "Zgłoś ukłucie",
    body: "Kilka pytań: kiedy, gdzie i kogo dotyczyło. Zajmuje mniej niż minutę.",
  },
  {
    n: "3",
    title: "Pomóż zbudować mapę",
    body: (
      <>
        Twoje zgłoszenie zasila publiczną mapę ryzyka. Pokazujemy tylko{" "}
        <b className="font-semibold text-slate">obszary zagregowane</b>, nigdy
        pojedyncze punkty.
      </>
    ),
  },
];

export default function HowPage() {
  return (
    <AppShell>
      <Screen>
        <TopBar label="Krok po kroku" backHref="/" />
        <div className="px-[22px] pb-6 pt-2">
          <h1 className="mb-2 font-serif text-[27px] font-semibold leading-[1.2] text-ink">
            Jak to działa?
          </h1>
          <p className="mb-[22px] text-[15px] leading-[1.5] text-muted">
            Cztery proste kroki. Bez konta, bez publikowania dokładnej
            lokalizacji.
          </p>

          <div className="relative flex flex-col">
            <div className="absolute left-[19px] top-6 bottom-[60px] w-0.5 bg-panel-border" />
            {STEPS.map((s) => (
              <div key={s.n} className="relative flex gap-4 pb-[22px]">
                <div className="z-[1] flex h-10 w-10 flex-none items-center justify-center rounded-full bg-forest text-[16px] font-bold text-white">
                  {s.n}
                </div>
                <div className="pt-0.5">
                  <div className="mb-[3px] text-[16.5px] font-bold text-ink">
                    {s.title}
                  </div>
                  <div className="text-[14px] leading-[1.5] text-muted">
                    {s.body}
                  </div>
                </div>
              </div>
            ))}

            <div className="relative flex gap-4">
              <div className="z-[1] flex h-10 w-10 flex-none items-center justify-center rounded-full border-2 border-forest bg-panel text-[16px] font-bold text-forest">
                4
              </div>
              <div className="pt-0.5">
                <div className="mb-[3px] text-[16.5px] font-bold text-ink">
                  Wróć, jeśli pojawią się objawy{" "}
                  <span className="text-[12px] font-semibold text-faint">
                    (opcjonalnie)
                  </span>
                </div>
                <div className="text-[14px] leading-[1.5] text-muted">
                  Po zgłoszeniu dostajesz prywatny link. Zapisz go — możesz przez
                  niego uzupełnić objawy, jeśli zechcesz. Nie wysyłamy
                  przypomnień.
                </div>
              </div>
            </div>
          </div>

          <Callout
            tone="mint"
            className="mt-[22px]"
            icon={<ShieldIcon size={20} strokeWidth={2.2} className="text-forest" />}
          >
            Aplikacja <b>nie wymaga konta</b> i{" "}
            <b>nie publikuje dokładnej lokalizacji</b>. Ty decydujesz, czy
            kiedykolwiek wrócisz.
          </Callout>

          <div className="mt-5">
            <PrimaryButton href="/zglos">Zacznij zgłoszenie</PrimaryButton>
          </div>
        </div>
      </Screen>
    </AppShell>
  );
}

import { AppShell, Screen, TopBar } from "@/components/ui";
import {
  AlertTriangleIcon,
  BeakerIcon,
  EyeIcon,
  HeartActivityIcon,
} from "@/components/icons";

const CARDS = [
  {
    Icon: BeakerIcon,
    title: "Usuń kleszcza",
    body: "Chwyć go pęsetą tuż przy skórze i wyciągnij powoli, prosto do góry. Nie smaruj tłuszczem ani alkoholem. Miejsce zdezynfekuj.",
  },
  {
    Icon: EyeIcon,
    title: "Obserwuj miejsce ukłucia",
    body: "Przez kilka tygodni zwracaj uwagę na skórę wokół ukłucia — szczególnie na rozszerzające się zaczerwienienie.",
  },
  {
    Icon: HeartActivityIcon,
    title: "Obserwuj samopoczucie",
    body: "Zwróć uwagę na gorączkę, ból głowy, bóle mięśni czy ogólne osłabienie w kolejnych tygodniach.",
  },
];

export default function InfoPage() {
  return (
    <AppShell>
      <Screen>
        <TopBar label="Poradnik" backHref="/" />
        <div className="px-[22px] pb-6 pt-2">
          <h1 className="mb-2 font-serif text-[26px] font-semibold leading-[1.2] text-ink">
            Co robić po ukłuciu?
          </h1>
          <p className="mb-[22px] text-[15px] leading-[1.5] text-muted">
            Spokojnie i po kolei. W większości przypadków nic groźnego się nie
            dzieje.
          </p>

          <div className="flex flex-col gap-3">
            {CARDS.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-[14px] rounded-[15px] border border-panel-border bg-white p-4"
              >
                <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-mint">
                  <Icon size={20} className="text-forest" />
                </div>
                <div>
                  <div className="mb-[3px] text-[16px] font-bold text-ink">
                    {title}
                  </div>
                  <div className="text-[14px] leading-[1.5] text-muted">
                    {body}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-[15px] border-[1.5px] border-alarm-border bg-alarm-bg p-4">
            <div className="mb-[10px] flex items-center gap-[9px] text-[14px] font-bold text-alarm-strong">
              <AlertTriangleIcon size={18} strokeWidth={2.3} className="text-alarm-ink" />
              Skontaktuj się z lekarzem, jeśli…
            </div>
            <div className="flex flex-col gap-2 text-[14px] leading-[1.45] text-alarm-soft">
              {[
                "pojawi się rozszerzające się zaczerwienienie",
                "wystąpi gorączka, silny ból głowy lub sztywność karku",
                "poczujesz się wyraźnie gorzej w kolejnych dniach",
              ].map((t) => (
                <div key={t} className="flex gap-[9px]">
                  <span className="font-extrabold text-alarm-ink">•</span>
                  {t}
                </div>
              ))}
            </div>
          </div>

          <p className="mx-1 mt-4 text-center text-[12.5px] leading-[1.5] text-faint">
            Ten poradnik ma charakter informacyjny i nie zastępuje porady
            lekarza.
          </p>
        </div>
      </Screen>
    </AppShell>
  );
}

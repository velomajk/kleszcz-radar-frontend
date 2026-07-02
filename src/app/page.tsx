import Link from "next/link";
import { AppShell, Screen } from "@/components/ui";
import { Logo, PinIcon, MapLayersIcon, ShieldIcon } from "@/components/icons";
import { MapBlob } from "@/components/MapBlob";

export default function HomePage() {
  return (
    <AppShell>
      <Screen>
        {/* Green hero header */}
        <div
          className="relative overflow-hidden px-[22px] pb-6 pt-[34px] text-white"
          style={{
            background:
              "linear-gradient(178deg,#14584A 0%,#124F43 62%,#0F463B 100%)",
          }}
        >
          <div className="mb-[26px]">
            <Logo onDark />
          </div>
          <h1 className="mb-3 max-w-[320px] font-serif text-[29px] font-semibold leading-[1.18] tracking-[-0.2px]">
            Zgłoś ukłucie. Sprawdź ryzyko w okolicy.
          </h1>
          <p className="m-0 max-w-[300px] text-[15.5px] leading-[1.5] text-white/80">
            Wspólnie tworzymy mapę aktywności kleszczy w Polsce. Anonimowo i bez
            zakładania konta.
          </p>
          <div className="mt-[18px] inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-[13px] py-2 text-[13px] font-semibold">
            <ShieldIcon size={15} strokeWidth={2.2} className="text-gold" />
            Zgłoszenie jest w pełni anonimowe
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 px-[22px] pb-6 pt-5">
          <Link href="/mapa" aria-label="Podgląd mapy ryzyka">
            <MapBlob caption="Aktywność w ostatnich 7 dniach" />
          </Link>

          <Link
            href="/zglos"
            className="inline-flex w-full items-center justify-center gap-[9px] rounded-xl2 bg-forest px-4 py-[17px] text-[17px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(20,88,74,0.6)] transition hover:bg-forest-600"
          >
            <PinIcon size={19} strokeWidth={2.2} />
            Zgłoś ukłucie
          </Link>
          <Link
            href="/mapa"
            className="inline-flex w-full items-center justify-center gap-[9px] rounded-xl2 border-[1.5px] border-forest bg-white px-4 py-[17px] text-[17px] font-bold text-forest-800 transition hover:bg-mint"
          >
            <MapLayersIcon size={19} strokeWidth={2.2} className="text-forest" />
            Zobacz mapę ryzyka
          </Link>

          <div className="mt-0.5 flex gap-[10px]">
            <Link
              href="/jak-to-dziala"
              className="flex-1 rounded-xl2 border border-panel-border bg-panel py-[13px] text-center text-[14px] font-semibold text-slate transition hover:bg-panel/70"
            >
              Jak to działa?
            </Link>
            <Link
              href="/po-ukluciu"
              className="flex-1 rounded-xl2 border border-panel-border bg-panel py-[13px] text-center text-[14px] font-semibold text-slate transition hover:bg-panel/70"
            >
              Co robić po ukłuciu?
            </Link>
          </div>

          {/* What we collect */}
          <div className="mt-2 rounded-xl2 border border-panel-border bg-panel px-4 py-[15px]">
            <div className="mb-[9px] text-[12.5px] font-bold uppercase tracking-[0.3px] text-forest">
              Co zbieramy, a czego nie
            </div>
            <div className="flex flex-col gap-[7px] text-[13.5px] leading-[1.4] text-slate">
              <div className="flex gap-2">
                <span className="font-extrabold text-[#2E7D6B]">+</span>
                przybliżony obszar, data i typ miejsca
              </div>
              <div className="flex gap-2">
                <span className="font-extrabold text-[#CE6A4E]">–</span>
                imię, konto, dokładny adres ani zdjęcia
              </div>
              <div className="flex gap-2">
                <span className="font-extrabold text-[#CE6A4E]">–</span>
                email nie jest zapisywany razem ze zgłoszeniem
              </div>
            </div>
          </div>
        </div>
      </Screen>
    </AppShell>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, SpinnerIcon } from "./icons";

/** Centered mobile-first app column on a warm radial background. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-[100dvh] w-full justify-center"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, #F3EFE4 0%, #ECE7DC 60%)",
      }}
    >
      <div className="relative flex min-h-[100dvh] w-full max-w-[448px] flex-col overflow-hidden bg-card sm:my-5 sm:min-h-[772px] sm:rounded-[30px] sm:border sm:border-black/5 sm:shadow-[0_24px_60px_-20px_rgba(20,50,40,0.34)]">
        {children}
      </div>
    </div>
  );
}

/** Fills the app column vertically so footers/buttons sit correctly. */
export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col animate-fade">{children}</div>;
}

/** Header row with a back link and a small eyebrow label. */
export function TopBar({
  label,
  backHref = "/",
}: {
  label: string;
  backHref?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 pb-1.5 pt-[18px]">
      <Link
        href={backHref}
        aria-label="Wróć"
        className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-panel-border bg-white text-slate transition hover:bg-panel"
      >
        <ArrowLeftIcon size={18} strokeWidth={2.4} />
      </Link>
      <span className="text-[13px] font-semibold text-faint">{label}</span>
    </div>
  );
}

type ButtonBase = {
  children: ReactNode;
  className?: string;
  loading?: boolean;
};

type ActionProps = ButtonBase &
  (
    | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">)
    | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
  );

function classes(variant: "primary" | "secondary" | "ghost", extra?: string) {
  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-xl2 text-[16px] font-bold font-sans transition disabled:cursor-not-allowed";
  const byVariant = {
    primary:
      "px-4 py-[17px] bg-forest text-white shadow-[0_8px_20px_-8px_rgba(20,88,74,0.6)] hover:bg-forest-600 disabled:bg-[#DCE3DC] disabled:text-[#93A29B] disabled:shadow-none",
    secondary:
      "px-4 py-4 bg-white text-forest-800 border-[1.5px] border-forest hover:bg-mint",
    ghost: "px-4 py-[14px] bg-transparent text-faint hover:text-slate font-semibold",
  } as const;
  return `${base} ${byVariant[variant]} ${extra ?? ""}`;
}

function Action({ variant, ...props }: ActionProps & { variant: "primary" | "secondary" | "ghost" }) {
  const { children, className, loading, href, ...rest } = props as ActionProps & {
    href?: string;
  };
  const content = (
    <>
      {loading ? <SpinnerIcon size={18} /> : null}
      {children}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classes(variant, className)} {...(rest as object)}>
        {content}
      </Link>
    );
  }
  return (
    <button
      className={classes(variant, className)}
      disabled={loading || (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).disabled}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {content}
    </button>
  );
}

export const PrimaryButton = (p: ActionProps) => <Action variant="primary" {...p} />;
export const SecondaryButton = (p: ActionProps) => <Action variant="secondary" {...p} />;
export const GhostButton = (p: ActionProps) => <Action variant="ghost" {...p} />;

/** Large single-select option row used throughout the report & symptom flows. */
export function OptionChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "block w-full rounded-[13px] px-4 py-[15px] text-left text-[16px] font-semibold leading-[1.3] outline-none transition " +
        (selected
          ? "border-[1.5px] border-forest bg-mint text-forest-800 shadow-[0_1px_2px_rgba(20,88,74,0.12)]"
          : "border-[1.5px] border-field-border bg-white text-ink hover:border-forest/40")
      }
    >
      {label}
    </button>
  );
}

/** Small pill filter (heatmap). */
export function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={
        "whitespace-nowrap rounded-full border-[1.5px] px-[14px] py-[9px] text-[13.5px] font-semibold transition " +
        (selected
          ? "border-forest bg-forest text-white"
          : "border-[#DED9CC] bg-white text-[#4A574F] hover:border-forest/40")
      }
    >
      {label}
    </button>
  );
}

type CalloutTone = "neutral" | "mint" | "amber" | "alarm";

const calloutTone: Record<CalloutTone, string> = {
  neutral: "bg-panel border-panel-border text-slate",
  mint: "bg-mint border-mint-border text-forest-800",
  amber: "bg-amber-bg border-amber-border text-amber-soft",
  alarm: "bg-alarm-bg border-[1.5px] border-alarm-border text-alarm-soft",
};

/** Inset informational card with an optional leading icon. */
export function Callout({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: CalloutTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex gap-[11px] rounded-xl2 border p-4 text-[13.5px] leading-[1.55] ${calloutTone[tone]} ${className ?? ""}`}
    >
      {icon ? <span className="mt-0.5 flex-none">{icon}</span> : null}
      <div>{children}</div>
    </div>
  );
}

/** Section eyebrow used above symptom groups etc. */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-[10px] text-[13px] font-bold uppercase tracking-[0.3px] text-forest">
      {children}
    </div>
  );
}

/** Full-screen-ish centered loading state inside the app column. */
export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <SpinnerIcon size={34} className="text-forest" />
      <p className="text-[14.5px] font-semibold text-muted">{label}</p>
    </div>
  );
}

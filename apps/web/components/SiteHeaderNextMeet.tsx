import Link from "next/link";

export function SiteHeaderNextMeet({
  dateLine,
  forecast,
  variant = "default",
  href,
}: {
  dateLine: string;
  forecast: { condition: string; highC: number; lowC: number } | null;
  /** `headerBar`: full-width strip between logo and menu on small screens */
  variant?: "default" | "headerBar";
  href?: string;
}) {
  const shell =
    variant === "headerBar"
      ? "block w-full min-w-0 rounded-xl border border-zinc-700/80 bg-zinc-950 px-3 py-2.5 shadow-xl sm:px-4"
      : "block rounded-md border border-zinc-300/90 bg-white px-3 py-2 sm:px-4 sm:py-2.5 dark:border-zinc-600 dark:bg-zinc-900";

  const content =
    variant === "headerBar" ? (
      <>
        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(78,152,255,0.35),transparent_62%)]" />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-950/55 via-zinc-900/45 to-zinc-950/90" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-300">Next meet</p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-blue-300 sm:text-[0.95rem]">{dateLine}</p>
          {forecast ? (
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs text-zinc-300">
              <span className="font-medium text-blue-200">{forecast.condition}</span>
              <span className="text-zinc-500" aria-hidden>
                ·
              </span>
              <span className="tabular-nums font-semibold text-zinc-200">
                {forecast.highC}° high · {forecast.lowC}° low
              </span>
            </p>
          ) : null}
        </div>
      </>
    ) : (
      <>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">Next meet</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-accent sm:text-[0.95rem]">{dateLine}</p>
        {forecast ? (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs text-zinc-600 dark:text-zinc-300">
            <span className="font-medium text-warm">{forecast.condition}</span>
            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden>
              ·
            </span>
            <span className="tabular-nums font-semibold text-zinc-800 dark:text-zinc-200">
              {forecast.highC}° high · {forecast.lowC}° low
            </span>
          </p>
        ) : null}
      </>
    );

  if (href) {
    return (
      <Link
        href={href}
        className={`${shell} ${variant === "headerBar" ? "relative overflow-hidden no-underline transition hover:border-blue-400/60 hover:no-underline" : "no-underline"}`}
      >
        {content}
      </Link>
    );
  }

  return <div className={`${shell} ${variant === "headerBar" ? "relative overflow-hidden" : ""}`}>{content}</div>;
}

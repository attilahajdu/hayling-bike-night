export function SiteHeaderNextMeet({
  dateLine,
  forecast,
}: {
  dateLine: string;
  forecast: { condition: string; highC: number; lowC: number } | null;
}) {
  return (
    <div className="rounded-md border border-zinc-300/90 bg-white px-3 py-2 sm:px-4 sm:py-2.5 dark:border-zinc-600 dark:bg-zinc-900">
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
    </div>
  );
}

const LONDON = "Europe/London";

function londonParts(d: Date) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const o = Object.fromEntries(
    fmt.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]),
  );
  return {
    weekday: o.weekday as string,
    hour: o.hour as string,
    minute: o.minute as string,
    second: o.second as string,
  };
}

function isThursdayMidnightLondon(d: Date): boolean {
  const p = londonParts(d);
  return p.weekday === "Thu" && p.hour === "00" && p.minute === "00" && p.second === "00";
}

/** Latest instant ≤ `now` that is Thursday 00:00:00 Europe/London (start of bike-night week). */
export function getBikeNightWeekStartUtc(now: Date = new Date()): Date {
  let t = new Date(Math.floor(now.getTime() / 3600000) * 3600000);
  const minT = now.getTime() - 9 * 24 * 3600 * 1000;
  while (t.getTime() >= minT) {
    if (isThursdayMidnightLondon(t)) return t;
    t = new Date(t.getTime() - 3600000);
  }
  return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
}

/** Thursday 00:00 London strictly after `weekStart` (end-exclusive bound for the current week). */
export function getBikeNightWeekEndExclusiveUtc(weekStart: Date): Date {
  let t = new Date(weekStart.getTime() + 3600000);
  const maxT = weekStart.getTime() + 8 * 24 * 3600 * 1000;
  while (t.getTime() <= maxT) {
    if (isThursdayMidnightLondon(t) && t.getTime() > weekStart.getTime()) return t;
    t = new Date(t.getTime() + 3600000);
  }
  return new Date(weekStart.getTime() + 7 * 24 * 3600 * 1000);
}

export function getBikeNightWeekIsoRange(now: Date = new Date()): { gte: string; lt: string } {
  const start = getBikeNightWeekStartUtc(now);
  const end = getBikeNightWeekEndExclusiveUtc(start);
  return { gte: start.toISOString(), lt: end.toISOString() };
}

import type { EventAttrs } from "@/lib/strapi";

function formatIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function noteToPlain(note: unknown): string {
  if (typeof note === "string") return note;
  if (Array.isArray(note)) {
    const lines: string[] = [];
    for (const block of note) {
      if (block && typeof block === "object" && "children" in block) {
        const children = (block as { children?: Array<{ text?: string }> }).children ?? [];
        lines.push(children.map((c) => c.text ?? "").join(""));
      }
    }
    return lines.join("\n\n");
  }
  return "";
}

/** Build a minimal VCALENDAR for Bike Night events (Google/Apple Calendar compatible). */
export function buildEventsIcs(events: Array<{ id: number; attributes: EventAttrs }>, calendarName: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hayling Bike Night//EN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "CALSCALE:GREGORIAN",
  ];

  for (const e of events) {
    const a = e.attributes;
    const start = new Date(a.dateStart);
    const end = new Date(a.dateEnd || a.dateStart);
    const uid = `hayling-bike-night-${a.slug}-${e.id}@haylingbikenight.local`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatIcsDate(new Date())}`);
    lines.push(`DTSTART:${formatIcsDate(start)}`);
    lines.push(`DTEND:${formatIcsDate(end)}`);
    lines.push(`SUMMARY:${escapeText(a.title)}`);
    lines.push(`LOCATION:${escapeText(a.location || "John's Café, Hayling Island")}`);
    const desc = noteToPlain(a.note);
    if (desc) {
      lines.push(`DESCRIPTION:${escapeText(desc.slice(0, 2400))}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

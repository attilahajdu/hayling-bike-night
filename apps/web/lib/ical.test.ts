import { describe, expect, it } from "vitest";
import { buildEventsIcs } from "./ical";

describe("buildEventsIcs", () => {
  it("includes VEVENT lines", () => {
    const ics = buildEventsIcs(
      [
        {
          id: 1,
          attributes: {
            title: "Test Night",
            slug: "test-night",
            dateStart: "2026-04-02T17:00:00.000Z",
            dateEnd: "2026-04-02T23:59:00.000Z",
            location: "John's Café",
            note: null,
          },
        },
      ],
      "Test Cal",
    );
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Test Night");
    expect(ics).toContain("END:VCALENDAR");
  });
});

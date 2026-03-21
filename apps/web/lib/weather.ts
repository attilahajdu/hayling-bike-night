const HAYLING_LAT = 50.792;
const HAYLING_LON = -0.975;

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code === 51 || code === 53 || code === 55) return "Drizzle";
  if (code === 61 || code === 63 || code === 65) return "Rain";
  if (code === 71 || code === 73 || code === 75) return "Snow";
  if (code === 80 || code === 81 || code === 82) return "Showers";
  if (code === 95 || code === 96 || code === 99) return "Thunderstorm";
  return "Mixed";
}

export type MeetForecast = {
  condition: string;
  highC: number;
  lowC: number;
};

export async function getMeetForecast(dateIso: string): Promise<MeetForecast | null> {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toISOString().slice(0, 10);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${HAYLING_LAT}&longitude=${HAYLING_LON}` +
    `&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe/London` +
    `&start_date=${day}&end_date=${day}`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      daily?: { weathercode?: number[]; temperature_2m_max?: number[]; temperature_2m_min?: number[] };
    };
    const code = json.daily?.weathercode?.[0];
    const max = json.daily?.temperature_2m_max?.[0];
    const min = json.daily?.temperature_2m_min?.[0];
    if (typeof code !== "number" || typeof max !== "number" || typeof min !== "number") return null;
    return { condition: weatherLabel(code), highC: Math.round(max), lowC: Math.round(min) };
  } catch {
    return null;
  }
}

export async function getForecastForDate(dateIso: string): Promise<string | null> {
  const f = await getMeetForecast(dateIso);
  return f ? `${f.condition} ${f.highC}°/${f.lowC}°` : null;
}

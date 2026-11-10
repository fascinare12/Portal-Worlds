import type { Sky } from './city';

/**
 * The weather over Shibuya, right now. This is the one thing in the project
 * that asks an outside service anything: Open-Meteo, a free public weather
 * service that needs no account. The request names only a spot in Tokyo; it
 * carries nothing about who is asking. If it cannot be reached, the street
 * simply keeps its usual rain.
 */

export interface Weather {
  sky: Sky;
  /** The word for it, to teach. */
  kana: string;
  romaji: string;
  english: string;
  /** Degrees Celsius, if known. */
  degrees: number | null;
}

const WORDS: Record<Sky, [string, string, string]> = {
  clear: ['はれ', 'hare', 'clear skies'],
  cloudy: ['くもり', 'kumori', 'cloudy'],
  rain: ['あめ', 'ame', 'rain'],
  snow: ['ゆき', 'yuki', 'snow'],
  fog: ['きり', 'kiri', 'fog'],
  storm: ['かみなり', 'kaminari', 'thunder'],
};

/** Turns the weather service's code (the standard WMO list) into what the sky is doing. */
function skyFrom(code: number): Sky {
  if (code >= 95) return 'storm';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 51) return 'rain'; // drizzle, rain, freezing rain and showers
  if (code === 45 || code === 48) return 'fog';
  if (code >= 2) return 'cloudy';
  return 'clear';
}

export function describe(sky: Sky, degrees: number | null = null): Weather {
  const [kana, romaji, english] = WORDS[sky];
  return { sky, kana, romaji, english, degrees };
}

export async function tokyoWeather(): Promise<Weather | null> {
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=35.66&longitude=139.70&current=weather_code,temperature_2m&timezone=Asia%2FTokyo';
    const reply = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!reply.ok) return null;
    const data = (await reply.json()) as { current?: { weather_code?: number; temperature_2m?: number } };
    const code = data.current?.weather_code;
    if (typeof code !== 'number') return null;
    const t = data.current?.temperature_2m;
    return describe(skyFrom(code), typeof t === 'number' ? Math.round(t) : null);
  } catch {
    return null; // offline, blocked or slow: carry on without it
  }
}

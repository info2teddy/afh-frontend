// src/components/ClockKioskHeader.jsx
// A live time/date + weather header for the Clock kiosk page — makes the
// shared tablet feel like a dedicated device rather than a browser tab.
// Weather uses the tablet's own geolocation (not the facility's address on
// file), since the same tablet could move between homes, and asking the
// device directly needs no data entry. Both widgets degrade quietly: if
// geolocation is denied/unsupported or the weather fetch fails, the weather
// side just doesn't render — it never blocks or breaks the clock-in flow.

import { useEffect, useState } from "react";

const WEATHER_REFRESH_MS = 30 * 60 * 1000; // weather doesn't change fast enough to poll more often

// WMO weather codes, as returned by Open-Meteo's `current.weather_code`.
const WEATHER_CODES = {
  0: { label: "Clear sky", icon: "☀️" },
  1: { label: "Mostly clear", icon: "🌤️" },
  2: { label: "Partly cloudy", icon: "⛅" },
  3: { label: "Overcast", icon: "☁️" },
  45: { label: "Fog", icon: "🌫️" },
  48: { label: "Fog", icon: "🌫️" },
  51: { label: "Light drizzle", icon: "🌦️" },
  53: { label: "Drizzle", icon: "🌦️" },
  55: { label: "Heavy drizzle", icon: "🌦️" },
  56: { label: "Freezing drizzle", icon: "🌨️" },
  57: { label: "Freezing drizzle", icon: "🌨️" },
  61: { label: "Light rain", icon: "🌧️" },
  63: { label: "Rain", icon: "🌧️" },
  65: { label: "Heavy rain", icon: "🌧️" },
  66: { label: "Freezing rain", icon: "🌨️" },
  67: { label: "Freezing rain", icon: "🌨️" },
  71: { label: "Light snow", icon: "❄️" },
  73: { label: "Snow", icon: "❄️" },
  75: { label: "Heavy snow", icon: "❄️" },
  77: { label: "Snow grains", icon: "❄️" },
  80: { label: "Rain showers", icon: "🌦️" },
  81: { label: "Rain showers", icon: "🌦️" },
  82: { label: "Violent rain showers", icon: "⛈️" },
  85: { label: "Snow showers", icon: "🌨️" },
  86: { label: "Snow showers", icon: "🌨️" },
  95: { label: "Thunderstorm", icon: "⛈️" },
  96: { label: "Thunderstorm with hail", icon: "⛈️" },
  99: { label: "Thunderstorm with hail", icon: "⛈️" },
};

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useWeather() {
  const [weather, setWeather] = useState(null); // null until we have a real reading; stays null on any failure

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let cancelled = false;
    let intervalId;

    function fetchWeather() {
      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Weather request failed");
            const data = await res.json();
            if (cancelled) return;
            setWeather({
              tempF: Math.round(data.current.temperature_2m),
              ...(WEATHER_CODES[data.current.weather_code] || { label: "", icon: "🌡️" }),
            });
          } catch {
            // Leave weather as-is (null on first failure, or the last good reading) —
            // a stale or missing weather widget is harmless, unlike breaking the clock.
          }
        },
        () => {}, // permission denied or unavailable — just don't show weather
        { maximumAge: WEATHER_REFRESH_MS, timeout: 10000 }
      );
    }

    fetchWeather();
    intervalId = setInterval(fetchWeather, WEATHER_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  return weather;
}

export function ClockKioskHeader() {
  const now = useClock();
  const weather = useWeather();

  const time = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" });
  const date = now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
      <div>
        <div className="text-4xl font-semibold tabular-nums tracking-tight text-stone-900">
          {time}
        </div>
        <div className="mt-1 text-sm text-stone-500">{date}</div>
      </div>

      {weather && (
        <div className="flex items-center gap-3">
          <span className="text-4xl" aria-hidden="true">{weather.icon}</span>
          <div>
            <div className="text-2xl font-semibold text-stone-900">{weather.tempF}°F</div>
            <div className="text-sm text-stone-500">{weather.label}</div>
          </div>
        </div>
      )}
    </div>
  );
}

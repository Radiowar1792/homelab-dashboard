/* eslint-disable @next/next/no-img-element */
"use client";

import { useQuery } from "@tanstack/react-query";
import { Wind, Droplets, Thermometer, MapPin } from "lucide-react";
import type { WidgetProps } from "@/types";

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{ description: string; icon: string }>;
  wind: { speed: number };
  name: string;
  sys: { country: string };
}

interface ForecastData {
  list: Array<{
    dt: number;
    main: { temp_min: number; temp_max: number };
    weather: Array<{ icon: string; description: string }>;
  }>;
}

function iconUrl(icon: string) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

async function fetchWeather(
  city: string,
  units: string,
  apiKey: string
): Promise<WeatherData> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${apiKey}&lang=fr`
  );
  if (!res.ok) throw new Error("Ville introuvable");
  return res.json();
}

async function fetchForecast(
  city: string,
  units: string,
  apiKey: string
): Promise<ForecastData> {
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${units}&cnt=24&appid=${apiKey}&lang=fr`
  );
  if (!res.ok) throw new Error("Prévisions indisponibles");
  return res.json();
}

function getDailyForecasts(forecast: ForecastData) {
  const days = new Map<
    string,
    { min: number; max: number; icon: string; desc: string }
  >();
  const today = new Date().toDateString();

  for (const item of forecast.list) {
    const date = new Date(item.dt * 1000);
    const key = date.toDateString();
    if (key === today) continue;

    const firstWeather = item.weather[0];
    if (!days.has(key)) {
      days.set(key, {
        min: item.main.temp_min,
        max: item.main.temp_max,
        icon: firstWeather?.icon ?? "01d",
        desc: firstWeather?.description ?? "",
      });
    } else {
      const d = days.get(key);
      if (d) {
        d.min = Math.min(d.min, item.main.temp_min);
        d.max = Math.max(d.max, item.main.temp_max);
      }
    }
  }

  return Array.from(days.entries())
    .slice(0, 3)
    .map(([dateStr, data]) => ({ date: new Date(dateStr), ...data }));
}

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function WeatherWidget({ config, size }: WidgetProps) {
  const city = (config.city as string) || "Paris";
  const units = (config.units as string) || "metric";
  const apiKey =
    (config.apiKey as string) ||
    process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
    "";
  const unitSymbol = units === "metric" ? "°C" : "°F";
  const isCompact = size === "small";

  const {
    data: weather,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["weather", city, units, apiKey],
    queryFn: () => fetchWeather(city, units, apiKey as string),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
    enabled: !!apiKey && !!city,
  });

  const { data: forecast } = useQuery({
    queryKey: ["weather-forecast", city, units, apiKey],
    queryFn: () => fetchForecast(city, units, apiKey as string),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
    enabled: !!apiKey && !!city && !isCompact,
  });

  if (!apiKey) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
        <Thermometer className="h-8 w-8" />
        <p className="text-sm font-medium">Clé API manquante</p>
        <code className="rounded bg-muted px-2 py-1 text-xs">
          NEXT_PUBLIC_OPENWEATHER_API_KEY
        </code>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-destructive">
        Impossible de charger la météo
      </div>
    );
  }

  const dailyForecasts = forecast ? getDailyForecasts(forecast) : [];
  const windSpeed =
    units === "metric"
      ? Math.round(weather.wind.speed * 3.6)
      : Math.round(weather.wind.speed);
  const speedUnit = units === "metric" ? "km/h" : "mph";

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Localisation */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {weather.name}, {weather.sys.country}
      </div>

      {/* Météo actuelle */}
      <div className="flex items-center gap-3">
        {weather.weather[0] && (
          <img
            src={iconUrl(weather.weather[0].icon)}
            alt={weather.weather[0].description}
            className="h-16 w-16 drop-shadow-md"
          />
        )}
        <div>
          <div className="text-4xl font-bold">
            {Math.round(weather.main.temp)}
            {unitSymbol}
          </div>
          <div className="text-sm capitalize text-muted-foreground">
            {weather.weather[0]?.description}
          </div>
        </div>
      </div>

      {!isCompact && (
        <>
          {/* Détails */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2">
              <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Ressenti</span>
              <span className="font-medium">
                {Math.round(weather.main.feels_like)}
                {unitSymbol}
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2">
              <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Humidité</span>
              <span className="font-medium">{weather.main.humidity}%</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2">
              <Wind className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Vent</span>
              <span className="font-medium">
                {windSpeed} {speedUnit}
              </span>
            </div>
          </div>

          {/* Prévisions 3 jours */}
          {dailyForecasts.length > 0 && (
            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-2">
              {dailyForecasts.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className="flex flex-col items-center gap-0.5 text-xs"
                >
                  <span className="font-medium">
                    {DAY_NAMES[day.date.getDay()]}
                  </span>
                  <img
                    src={iconUrl(day.icon)}
                    alt={day.desc}
                    className="h-8 w-8"
                  />
                  <span className="text-muted-foreground">
                    {Math.round(day.max)}° / {Math.round(day.min)}°
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

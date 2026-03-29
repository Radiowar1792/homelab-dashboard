"use client";

import { useQuery } from "@tanstack/react-query";
import { Wind, Droplets, Thermometer, MapPin } from "lucide-react";
import type { WidgetProps } from "@/types";

interface GeoResult {
  latitude: number;
  longitude: number;
  name: string;
  country_code: string;
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
}

function wmoLabel(code: number): string {
  if (code === 0) return "Ciel dégagé";
  if (code <= 3) return "Partiellement nuageux";
  if (code <= 48) return "Brouillard";
  if (code <= 57) return "Bruine";
  if (code <= 67) return "Pluie";
  if (code <= 77) return "Neige";
  if (code <= 82) return "Averses";
  if (code <= 86) return "Averses de neige";
  return "Orage";
}

function wmoEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code <= 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

async function fetchWeather(city: string, units: string): Promise<{ geo: GeoResult; weather: OpenMeteoResponse }> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`
  );
  if (!geoRes.ok) throw new Error("Ville introuvable");
  const geoData = (await geoRes.json()) as { results?: GeoResult[] };
  const geo = geoData.results?.[0];
  if (!geo) throw new Error("Ville introuvable");

  const tempUnit = units === "metric" ? "celsius" : "fahrenheit";
  const windUnit = units === "metric" ? "kmh" : "mph";
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${geo.latitude}&longitude=${geo.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
    `&temperature_unit=${tempUnit}&wind_speed_unit=${windUnit}&timezone=auto&forecast_days=4`
  );
  if (!weatherRes.ok) throw new Error("Météo indisponible");
  const weather = (await weatherRes.json()) as OpenMeteoResponse;
  return { geo, weather };
}

export function WeatherWidget({ config, size }: WidgetProps) {
  const city = (config.city as string) || "Paris";
  const units = (config.units as string) || "metric";
  const unitSymbol = units === "metric" ? "°C" : "°F";
  const speedUnit = units === "metric" ? "km/h" : "mph";
  const isCompact = size === "small";

  const { data, isLoading, error } = useQuery({
    queryKey: ["weather-openmeteo", city, units],
    queryFn: () => fetchWeather(city, units),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
    enabled: !!city,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
        <Thermometer className="h-8 w-8" />
        <p className="text-sm">Impossible de charger la météo</p>
        <p className="text-xs">Vérifiez le nom de la ville</p>
      </div>
    );
  }

  const { geo, weather } = data;
  const current = weather.current;

  // Next 3 days (skip today at index 0)
  const forecasts = weather.daily.time.slice(1, 4).map((dateStr, i) => ({
    date: new Date(dateStr),
    max: weather.daily.temperature_2m_max[i + 1] ?? 0,
    min: weather.daily.temperature_2m_min[i + 1] ?? 0,
    code: weather.daily.weather_code[i + 1] ?? 0,
  }));

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {/* Localisation */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        {geo.name}, {geo.country_code.toUpperCase()}
      </div>

      {/* Météo actuelle */}
      <div className="flex items-center gap-3">
        <span className="text-5xl leading-none">{wmoEmoji(current.weather_code)}</span>
        <div>
          <div className="text-4xl font-bold">
            {Math.round(current.temperature_2m)}
            {unitSymbol}
          </div>
          <div className="text-sm capitalize text-muted-foreground">
            {wmoLabel(current.weather_code)}
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
              <span className="font-medium">{Math.round(current.apparent_temperature)}{unitSymbol}</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2">
              <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Humidité</span>
              <span className="font-medium">{current.relative_humidity_2m}%</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/40 p-2">
              <Wind className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Vent</span>
              <span className="font-medium">{Math.round(current.wind_speed_10m)} {speedUnit}</span>
            </div>
          </div>

          {/* Prévisions 3 jours */}
          {forecasts.length > 0 && (
            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-2">
              {forecasts.map((day) => (
                <div key={day.date.toISOString()} className="flex flex-col items-center gap-0.5 text-xs">
                  <span className="font-medium">{DAY_NAMES[day.date.getDay()]}</span>
                  <span className="text-xl leading-none">{wmoEmoji(day.code)}</span>
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

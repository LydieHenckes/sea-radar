"use client";

import { useEffect, useRef, useState } from "react";
import type { Vessel } from "../types/vessel";
import Map from "../app/map-client";
import { DEMO_TICK_MS, DEMO_VESSELS } from "../fixture/map-config";
import { VesselCard } from "./VesselCard";

type ScreenState = "idle-demo" | "loading" | "success" | "empty" | "error";

type SnapshotSuccess = {
  ok: true;
  vessels: Vessel[];
  collectedAt: string;
  windowSeconds: number;
  count: number;
  truncated: boolean;
};

type SnapshotError = {
  ok: false;
  attemptedAt: string;
  error: { message: string };
};

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function calculateBearing(
  from: NonNullable<Vessel["route"]>[number],
  to: NonNullable<Vessel["route"]>[number],
): number {
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);
  const deltaLongitude = toRadians(to.lon - from.lon);
  const y = Math.sin(deltaLongitude) * Math.cos(toLatitude);
  const x =
    Math.cos(fromLatitude) * Math.sin(toLatitude) -
    Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(deltaLongitude);

  return ((Math.atan2(y, x) * 180) / Math.PI) % 360 + 360;
}

function formatUtc(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--:-- UTC";
  }

  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(
    date.getUTCMinutes(),
  ).padStart(2, "0")}:${String(date.getUTCSeconds()).padStart(2, "0")} UTC`;
}

export default function MapScreen() {
  const [vessels, setVessels] = useState<readonly Vessel[]>(DEMO_VESSELS);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const [screenState, setScreenState] = useState<ScreenState>("idle-demo");
  const [sourceLabel, setSourceLabel] = useState("Демонстрационные данные");
  const [message, setMessage] = useState<string | null>(null);
  const [resetViewKey, setResetViewKey] = useState(0);
  const routeIndexesRef = useRef(
    new globalThis.Map(DEMO_VESSELS.map((vessel) => [vessel.id, 0])),
  );
  const demoTimerRef = useRef<number | null>(null);
  const hasResetToSnapshotRef = useRef(false);

  useEffect(() => {
    const startedAt = new Date().toISOString();
    setVessels((currentVessels) =>
      currentVessels.map((vessel) => ({ ...vessel, timestamp: startedAt })),
    );

    demoTimerRef.current = window.setInterval(() => {
      setVessels((currentVessels) =>
        currentVessels.map((vessel) => {
          const route = vessel.route;
          const currentIndex = routeIndexesRef.current.get(vessel.id) ?? 0;

          if (!route || currentIndex >= route.length - 1) {
            return vessel;
          }

          const nextIndex = currentIndex + 1;
          const previousPoint = route[currentIndex];
          const nextPoint = route[nextIndex];
          routeIndexesRef.current.set(vessel.id, nextIndex);

          return {
            ...vessel,
            lat: nextPoint.lat,
            lon: nextPoint.lon,
            courseDeg: calculateBearing(previousPoint, nextPoint),
            speedKnots: nextIndex === route.length - 1 ? 0 : vessel.speedKnots,
            timestamp: new Date().toISOString(),
          };
        }),
      );
    }, DEMO_TICK_MS);

    return () => {
      if (demoTimerRef.current !== null) {
        window.clearInterval(demoTimerRef.current);
      }
    };
  }, []);

  const stopDemoTimer = () => {
    if (demoTimerRef.current !== null) {
      window.clearInterval(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  };

  const loadSnapshot = async () => {
    stopDemoTimer();
    setScreenState("loading");
    setSourceLabel("Загрузка…");
    setMessage(null);
    setVessels([]);
    setSelectedVesselId(null);

    try {
      const response = await fetch("/api/snapshot");
      const body = (await response.json()) as SnapshotSuccess | SnapshotError;

      if (!response.ok || !body.ok) {
        if (body.ok) {
          throw new Error("Не удалось получить данные");
        }

        setScreenState("error");
        setSourceLabel("Данных на карте нет");
        setMessage(`Не удалось получить данные: ${body.error.message}`);
        setVessels([]);
        return;
      }

      setVessels(body.vessels);
      setSelectedVesselId(null);
      setSourceLabel(
        `AISStream · снимок за ${body.windowSeconds} с · получен ${formatUtc(
          body.collectedAt,
        )} · судов: ${body.count} · выборка неполная${
          body.truncated ? " · остановлено на лимите 100" : ""
        }`,
      );
      setMessage(body.count === 0 ? "За время сбора позиции не получены" : null);
      setScreenState(body.count === 0 ? "empty" : "success");
      if (body.count > 0 && !hasResetToSnapshotRef.current) {
        hasResetToSnapshotRef.current = true;
        setResetViewKey((current) => current + 1);
      }
    } catch {
      setScreenState("error");
      setSourceLabel("Данных на карте нет");
      setMessage("Не удалось получить данные: Внутренняя ошибка сервера");
      setVessels([]);
      setSelectedVesselId(null);
    }
  };

  const selectedVessel = vessels.find((vessel) => vessel.id === selectedVesselId) ?? null;

  return (
    <main className="sea-radar">
      <div className="map-panel">
        <div className="map-area">
          <Map
            vessels={vessels}
            onSelectVessel={setSelectedVesselId}
            resetViewKey={resetViewKey}
          />
        </div>
        <aside className="info-panel">
          <button type="button" onClick={loadSnapshot} disabled={screenState === "loading"}>
            Загрузить настоящие позиции
          </button>
          <p className="source-label">{sourceLabel}</p>
          {message !== null && <p className="snapshot-message">{message}</p>}
          {selectedVessel !== null && <VesselCard vessel={selectedVessel} />}
        </aside>
      </div>
    </main>
  );
}

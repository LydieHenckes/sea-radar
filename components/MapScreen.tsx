"use client";

import { useEffect, useRef, useState } from "react";
import type { Vessel } from "../types/vessel";
import Map from "../app/map-client";
import { DEMO_TICK_MS, DEMO_VESSELS } from "../fixture/map-config";
import { VesselCard } from "./VesselCard";

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

  return (Math.atan2(y, x) * 180) / Math.PI % 360 + 360;
}

export default function MapScreen() {
  const [vessels, setVessels] = useState<readonly Vessel[]>(DEMO_VESSELS);
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);
  const routeIndexesRef = useRef(
    new globalThis.Map(DEMO_VESSELS.map((vessel) => [vessel.id, 0])),
  );

  useEffect(() => {
    const startedAt = new Date().toISOString();
    setVessels((currentVessels) =>
      currentVessels.map((vessel) => ({ ...vessel, timestamp: startedAt })),
    );

    const timer = window.setInterval(() => {
    //  console.count("tick");
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

    return () => window.clearInterval(timer);
  }, []);

  const selectedVessel = vessels.find((vessel) => vessel.id === selectedVesselId) ?? null;

  return (
    <main className="sea-radar">
      <div className="map-panel">
        <div className="map-area">
          <Map vessels={vessels} onSelectVessel={setSelectedVesselId} />
        </div>
        <aside className="info-panel">
          <div className="button-placeholder" aria-hidden="true" />
          <p className="source-label">Демонстрационные данные</p>
          {selectedVessel !== null && <VesselCard vessel={selectedVessel} />}
        </aside>
      </div>
    </main>
  );
}

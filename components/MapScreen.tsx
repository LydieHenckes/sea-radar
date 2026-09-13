"use client";

import { useState } from "react";
import type { Vessel } from "../types/vessel";
import Map from "../app/map-client";
import { VesselCard } from "./VesselCard";

export default function MapScreen() {
  const [selectedVessel, setSelectedVessel] = useState<Vessel | null>(null);

  return (
    <main className="sea-radar">
      <div className="map-panel">
        <div className="map-area">
          <Map onSelectVessel={setSelectedVessel} />
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

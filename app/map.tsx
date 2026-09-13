"use client";

import { useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Vessel } from "../types/vessel";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DEMO_VESSELS, MAP_CONFIG } from "../fixture/map-config";
import { createVesselIcon } from "../components/VesselMarker";

type MapProps = {
  onSelectVessel: Dispatch<SetStateAction<Vessel | null>>;
};

export default function Map({ onSelectVessel }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current).setView(
      MAP_CONFIG.center,
      MAP_CONFIG.zoom,
    );

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    map.setMaxBounds(MAP_CONFIG.bounds);
    DEMO_VESSELS.forEach((vessel) => {
      L.marker([vessel.lat, vessel.lon], {
        icon: createVesselIcon(vessel),
      })
        .on("click", () => onSelectVessel(vessel))
        .addTo(map);
    });
    map.invalidateSize();

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      map.remove();
    };
  }, [onSelectVessel]);

  return <div ref={mapContainerRef} className="map" aria-label="Carte du détroit de Douvres" />;
}

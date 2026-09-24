"use client";

import { useEffect, useRef } from "react";
import type { Vessel } from "../types/vessel";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MAP_CONFIG } from "../fixture/map-config";
import { createVesselIcon } from "../components/VesselMarker";

type MapProps = {
  vessels: readonly Vessel[];
  onSelectVessel: (id: string) => void;
  resetViewKey: number;
};

export default function Map({ vessels, onSelectVessel, resetViewKey }: MapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef(new globalThis.Map<string, L.Marker>());
  const onSelectVesselRef = useRef(onSelectVessel);

  useEffect(() => {
    onSelectVesselRef.current = onSelectVessel;
  }, [onSelectVessel]);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current).setView(
      MAP_CONFIG.center,
      MAP_CONFIG.zoom,
    );
    mapRef.current = map;

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    map.setMaxBounds(MAP_CONFIG.bounds);
    map.invalidateSize();

    const handleResize = () => map.invalidateSize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const vesselIds = new Set(vessels.map((vessel) => vessel.id));
    markersRef.current.forEach((marker, id) => {
      if (!vesselIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    vessels.forEach((vessel) => {
      let marker = markersRef.current.get(vessel.id);
      if (!marker) {
        marker = L.marker([vessel.lat, vessel.lon], {
          icon: createVesselIcon(vessel),
        }).on("click", () => onSelectVesselRef.current(vessel.id));
        markersRef.current.set(vessel.id, marker);
        marker.addTo(map);
      } else {
        marker.setLatLng([vessel.lat, vessel.lon]);
        marker.setIcon(createVesselIcon(vessel));
      }
    });
  }, [vessels]);

  useEffect(() => {
    mapRef.current?.setView(MAP_CONFIG.center, MAP_CONFIG.zoom);
  }, [resetViewKey]);

  return <div ref={mapContainerRef} className="map" aria-label="Карта Дуврского пролива" />;
}

import type { Vessel } from "../types/vessel";

export const MAP_CONFIG = {
  bounds: [
    [50.75, 0.95],
    [51.25, 1.95],
  ] as [[number, number], [number, number]],
  center: [51.0, 1.45] as [number, number],
  zoom: 10,
} as const;

export const DEMO_VESSELS: readonly Vessel[] = [
   {
    id: "demo-1",
    name: "Демо-судно 1",
    lat: 51.05,
    lon: 1.5,
    speedKnots: 12,
    courseDeg: 135,
    timestamp: "2026-09-13T12:00:00Z",
    source: "demo",
  },
];

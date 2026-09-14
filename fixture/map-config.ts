import type { Vessel } from "../types/vessel";

export const MAP_CONFIG = {
  bounds: [
    [50.75, 0.95],
    [51.25, 1.95],
  ] as [[number, number], [number, number]],
  center: [51.0, 1.45] as [number, number],
  zoom: 10,
} as const;

export const DEMO_TICK_MS = 2000;

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
    route: [
      { lat: 51.05, lon: 1.5 },
      { lat: 51.08, lon: 1.55 },
      { lat: 51.1, lon: 1.62 },
      { lat: 51.12, lon: 1.68 },
      { lat: 51.15, lon: 1.73 },
      { lat: 51.17, lon: 1.8 },
      { lat: 51.2, lon: 1.84 },
      { lat: 51.22, lon: 1.9 },
    ],
  },
  {
    id: "demo-2",
    name: "Демо-судно 2",
    lat: 50.88,
    lon: 1.2,
    speedKnots: 9,
    courseDeg: 45,
    timestamp: "2026-09-13T12:00:00Z",
    source: "demo",
    route: [
      { lat: 50.88, lon: 1.2 },
      { lat: 50.91, lon: 1.25 },
      { lat: 50.94, lon: 1.3 },
      { lat: 50.97, lon: 1.36 },
      { lat: 51.0, lon: 1.4 },
      { lat: 51.03, lon: 1.45 },
      { lat: 51.06, lon: 1.5 },
      { lat: 51.09, lon: 1.56 },
      { lat: 51.12, lon: 1.6 },
    ],
  },
  {
    id: "demo-3",
    name: "Демо-судно 3",
    lat: 51.2,
    lon: 1.8,
    speedKnots: 14,
    courseDeg: 225,
    timestamp: "2026-09-13T12:00:00Z",
    source: "demo",
    route: [
      { lat: 51.2, lon: 1.8 },
      { lat: 51.17, lon: 1.75 },
      { lat: 51.14, lon: 1.69 },
      { lat: 51.11, lon: 1.64 },
      { lat: 51.08, lon: 1.58 },
      { lat: 51.04, lon: 1.52 },
      { lat: 51.0, lon: 1.46 },
      { lat: 50.96, lon: 1.4 },
    ],
  },
];

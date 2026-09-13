export type VesselSource = "demo" | "aisstream";

export type Vessel = {
  id: string;
  name: string | null;
  lat: number;
  lon: number;
  speedKnots: number | null;
  courseDeg: number | null;
  timestamp: string;
  source: VesselSource;
};

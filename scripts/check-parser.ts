import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { positionReportToVessel } from "../lib/ais/position-report";

async function main(): Promise<void> {
  const samplePath = resolve("data/samples/position-report.sample.json");
  const sample = JSON.parse(await readFile(samplePath, "utf8")) as {
    MetaData: Record<string, unknown>;
    Message: { PositionReport: Record<string, unknown> };
  };
  const vessel = positionReportToVessel(sample);

  if (vessel === null) {
    throw new Error("Sample did not produce a vessel");
  }

  const position = sample.Message.PositionReport;
  const sourceValues: Record<string, unknown> = {
    id: sample.MetaData.MMSI,
    name: sample.MetaData.ShipName,
    lat: position.Latitude,
    lon: position.Longitude,
    speedKnots: position.Sog,
    courseDeg: position.Cog,
    timestamp: sample.MetaData.time_utc,
  };

  for (const field of [
    "id",
    "name",
    "lat",
    "lon",
    "speedKnots",
    "courseDeg",
    "timestamp",
  ] as const) {
    console.log(`${field}: ${JSON.stringify(vessel[field])} (source: ${JSON.stringify(sourceValues[field])})`);
  }
  console.log(`source: ${JSON.stringify(vessel.source)} (source: derived from converter)`);
}

void main();

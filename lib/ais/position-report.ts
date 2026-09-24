import type { Vessel } from "../../types/vessel";

type PositionReportMessage = {
  MetaData?: {
    MMSI?: unknown;
    ShipName?: unknown;
    time_utc?: unknown;
  };
  Message?: {
    PositionReport?: {
      Latitude?: unknown;
      Longitude?: unknown;
      Sog?: unknown;
      Cog?: unknown;
    };
  };
};

function parseTimestamp(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})\.(\d{1,9}) ([+-]\d{4}) UTC$/,
  );
  if (!match) {
    return null;
  }

  const [, date, time, fraction, offset] = match;
  const isoFraction = fraction.slice(0, 3).padEnd(3, "0");
  const isoOffset = `${offset.slice(0, 3)}:${offset.slice(3)}`;
  const parsed = new Date(`${date}T${time}.${isoFraction}${isoOffset}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function nullableSpeed(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 102.2
    ? value
    : null;
}

function nullableCourse(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 360
    ? value
    : null;
}

export function positionReportToVessel(message: unknown): Vessel | null {
  if (typeof message !== "object" || message === null) {
    return null;
  }

  const { MetaData, Message } = message as PositionReportMessage;
  const position = Message?.PositionReport;
  const mmsi = MetaData?.MMSI;
  const id = mmsi === undefined || mmsi === null ? "" : String(mmsi).trim();
  const timestamp = parseTimestamp(MetaData?.time_utc);
  const lat = position?.Latitude;
  const lon = position?.Longitude;

  if (
    !id ||
    timestamp === null ||
    typeof lat !== "number" ||
    !Number.isFinite(lat) ||
    lat < -90 ||
    lat > 90 ||
    typeof lon !== "number" ||
    !Number.isFinite(lon) ||
    lon < -180 ||
    lon > 180
  ) {
    return null;
  }

  const name = typeof MetaData?.ShipName === "string" ? MetaData.ShipName.trim() : "";

  return {
    id,
    name: name || null,
    lat,
    lon,
    speedKnots: nullableSpeed(position?.Sog),
    courseDeg: nullableCourse(position?.Cog),
    timestamp,
    source: "aisstream",
  };
}

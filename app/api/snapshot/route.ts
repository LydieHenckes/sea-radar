import { NextResponse } from "next/server";
import {
  collectSnapshot,
  SNAPSHOT_ERROR_MESSAGES,
  SNAPSHOT_MAX_VESSELS,
  SNAPSHOT_WINDOW_MS,
  type SnapshotClock,
} from "../../../lib/ais/collector";
import { createAisStreamSource } from "../../../lib/ais/aisstream-source";

export const runtime = "nodejs";

const BOUNDING_BOXES = [[[50.75, 0.95], [51.25, 1.95]]] as const;

const ERROR_MESSAGES = {
  no_api_key: "Ключ AISStream не настроен",
  ...SNAPSHOT_ERROR_MESSAGES,
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

function errorResponse(code: ErrorCode, attemptedAt: string): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      attemptedAt,
      error: { code, message: ERROR_MESSAGES[code] },
    },
    { status: 502 },
  );
}

const systemClock: SnapshotClock = {
  now: () => new Date(),
  setTimeout: (callback, delayMs) => setTimeout(callback, delayMs),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export async function GET(request: Request): Promise<NextResponse> {
  const apiKey = process.env.AISSTREAM_API_KEY?.trim();
  const attemptedAt = systemClock.now().toISOString();

  if (!apiKey) {
    return errorResponse("no_api_key", attemptedAt);
  }

  const result = await collectSnapshot({
    clock: systemClock,
    signal: request.signal,
    source: createAisStreamSource({ apiKey, boundingBoxes: BOUNDING_BOXES }),
    windowMs: SNAPSHOT_WINDOW_MS,
    maxVessels: SNAPSHOT_MAX_VESSELS,
  });

  if (!result.ok) {
    return errorResponse(result.error.code, result.attemptedAt);
  }

  return NextResponse.json(result);
}

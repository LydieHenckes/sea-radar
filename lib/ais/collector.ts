import type { Vessel } from "../../types/vessel";
import { positionReportToVessel } from "./position-report";

export const SNAPSHOT_WINDOW_MS = 15_000;
export const SNAPSHOT_MAX_VESSELS = 100;

export const SNAPSHOT_ERROR_MESSAGES = {
  connect_failed: "Не удалось подключиться к источнику",
  disconnected: "Соединение с источником разорвано",
  provider_error: "Источник вернул ошибку",
  internal: "Внутренняя ошибка сервера",
} as const;

export type SnapshotErrorCode = keyof typeof SNAPSHOT_ERROR_MESSAGES;

export type SnapshotClock = {
  now: () => Date;
  setTimeout: (callback: () => void, delayMs: number) => unknown;
  clearTimeout: (handle: unknown) => void;
};

export type SnapshotSourceHandlers = {
  onReady: () => void;
  onMessage: (message: unknown) => void;
  onProviderError: () => void;
  onConnectError: () => void;
  onDisconnected: () => void;
};

export type SnapshotConnection = {
  close: () => void;
};

export type SnapshotSource = {
  connect: (handlers: SnapshotSourceHandlers) => SnapshotConnection;
};

export type SnapshotSuccess = {
  ok: true;
  vessels: Vessel[];
  collectedAt: string;
  windowSeconds: number;
  count: number;
  truncated: boolean;
  reason: "window_elapsed" | "limit_reached";
};

export type SnapshotFailure = {
  ok: false;
  attemptedAt: string;
  error: {
    code: SnapshotErrorCode;
    message: string;
  };
};

export type SnapshotResult = SnapshotSuccess | SnapshotFailure;

type CollectSnapshotOptions = {
  source: SnapshotSource;
  clock: SnapshotClock;
  signal?: AbortSignal;
  windowMs?: number;
  maxVessels?: number;
};

function isPositionReport(message: unknown): boolean {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { MessageType?: unknown }).MessageType === "PositionReport"
  );
}

function errorResult(code: SnapshotErrorCode, attemptedAt: string): SnapshotFailure {
  return {
    ok: false,
    attemptedAt,
    error: { code, message: SNAPSHOT_ERROR_MESSAGES[code] },
  };
}

export function collectSnapshot({
  source,
  clock,
  signal,
  windowMs = SNAPSHOT_WINDOW_MS,
  maxVessels = SNAPSHOT_MAX_VESSELS,
}: CollectSnapshotOptions): Promise<SnapshotResult> {
  const attemptedAt = clock.now().toISOString();
  const vesselsById = new Map<string, Vessel>();

  return new Promise((resolve) => {
    let connection: SnapshotConnection | null = null;
    let timer: unknown;
    let ready = false;
    let settled = false;

    const cleanup = () => {
      clock.clearTimeout(timer);
      signal?.removeEventListener("abort", handleAbort);
      connection?.close();
      connection = null;
    };

    const finish = (result: SnapshotResult) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(result);
    };

    const finishError = (code: SnapshotErrorCode) => {
      finish(errorResult(code, attemptedAt));
    };

    const finishSuccess = (
      reason: SnapshotSuccess["reason"],
      truncated: boolean,
    ) => {
      finish({
        ok: true,
        vessels: [...vesselsById.values()],
        collectedAt: clock.now().toISOString(),
        windowSeconds: windowMs / 1000,
        count: vesselsById.size,
        truncated,
        reason,
      });
    };

    const handleAbort = () => finishError("internal");

    const handleMessage = (message: unknown) => {
      if (settled || !isPositionReport(message)) {
        return;
      }

      const vessel = positionReportToVessel(message);
      if (vessel === null) {
        return;
      }

      const previous = vesselsById.get(vessel.id);
      if (
        previous === undefined ||
        Date.parse(vessel.timestamp) > Date.parse(previous.timestamp)
      ) {
        vesselsById.set(vessel.id, vessel);
      }

      if (vesselsById.size >= maxVessels) {
        finishSuccess("limit_reached", true);
      }
    };

    timer = clock.setTimeout(() => {
      if (!ready) {
        finishError("connect_failed");
        return;
      }

      finishSuccess("window_elapsed", false);
    }, windowMs);

    signal?.addEventListener("abort", handleAbort, { once: true });

    try {
      const nextConnection = source.connect({
        onReady: () => {
          if (!settled) {
            ready = true;
          }
        },
        onMessage: handleMessage,
        onProviderError: () => finishError("provider_error"),
        onConnectError: () => finishError("connect_failed"),
        onDisconnected: () => finishError(ready ? "disconnected" : "connect_failed"),
      });

      if (settled) {
        nextConnection.close();
      } else {
        connection = nextConnection;
      }
    } catch {
      finishError("connect_failed");
    }
  });
}

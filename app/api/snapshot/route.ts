import { NextResponse } from "next/server";

export const runtime = "nodejs";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";
const COLLECTION_WINDOW_MS = 15_000;
const BOUNDING_BOXES = [[[50.75, 0.95], [51.25, 1.95]]] as const;

const ERROR_MESSAGES = {
  no_api_key: "Ключ AISStream не настроен",
  connect_failed: "Не удалось подключиться к источнику",
  disconnected: "Соединение с источником разорвано",
  provider_error: "Источник вернул ошибку",
  internal: "Внутренняя ошибка сервера",
} as const;

type ErrorCode = keyof typeof ERROR_MESSAGES;

type ProviderMessage = {
  MessageType?: unknown;
};

function isPositionReport(message: unknown): boolean {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as ProviderMessage).MessageType === "PositionReport"
  );
}

type DiagnosticCategory =
  | "provider_error_message"
  | "provider_malformed_message"
  | "provider_unsupported_message"
  | "socket_error_before_open"
  | "socket_error_after_open"
  | "socket_constructor_failed"
  | "subscription_send_failed"
  | "socket_closed_before_open"
  | "socket_closed_after_open"
  | "internal_exception";

function logDiagnostic(
  category: DiagnosticCategory,
  details: Record<string, string | number | boolean>,
): void {
  console.warn("AISStream diagnostic", { category, ...details });
}

function errorResponse(
  code: ErrorCode,
  attemptedAt: string,
): NextResponse {
  return NextResponse.json(
    {
      ok: false,
      attemptedAt,
      error: { code, message: ERROR_MESSAGES[code] },
    },
    { status: 502 },
  );
}

async function decodeMessage(
  data: string | ArrayBuffer | Blob | ArrayBufferView,
): Promise<string | null> {
  if (typeof data === "string") {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  if (data instanceof Blob) {
    return new TextDecoder().decode(await data.arrayBuffer());
  }

  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    );
  }

  return null;
}

function isProviderError(message: unknown): boolean {
  if (typeof message !== "object" || message === null) {
    return false;
  }

  const messageType = (message as ProviderMessage).MessageType;
  return messageType === "Error" || messageType === "ErrorMessage";
}

export async function GET(request: Request): Promise<NextResponse> {
  const attemptedAt = new Date().toISOString();
  const apiKey = process.env.AISSTREAM_API_KEY?.trim();

  if (!apiKey) {
    return errorResponse("no_api_key", attemptedAt);
  }

  return new Promise((resolve) => {
    let socket: WebSocket | null = null;
    let opened = false;
    let subscriptionSent = false;
    let settled = false;

    const timer = setTimeout(() => {
      if (!opened || !subscriptionSent) {
        finishError("connect_failed");
        return;
      }

      finishSuccess(null);
    }, COLLECTION_WINDOW_MS);

    const cleanup = () => {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", handleAbort);

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
        socket = null;
      }
    };

    const finish = (response: NextResponse) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(response);
    };

    const finishError = (code: ErrorCode) => {
      if (code === "internal") {
        logDiagnostic("internal_exception", {
          opened,
          subscriptionSent,
        });
      }
      finish(errorResponse(code, attemptedAt));
    };

    const finishSuccess = (raw: unknown) => {
      finish(
        NextResponse.json({
          ok: true,
          raw,
          collectedAt: new Date().toISOString(),
        }),
      );
    };

    const handleAbort = () => {
      finishError("internal");
    };

    request.signal.addEventListener("abort", handleAbort, { once: true });

    try {
      socket = new WebSocket(AISSTREAM_URL);

      socket.onopen = () => {
        opened = true;

        try {
          socket?.send(
            JSON.stringify({
              APIKey: apiKey,
              BoundingBoxes: BOUNDING_BOXES,
              FilterMessageTypes: ["PositionReport"],
            }),
          );
          subscriptionSent = true;
        } catch {
          logDiagnostic("subscription_send_failed", {
            opened,
            subscriptionSent,
          });
          finishError("connect_failed");
        }
      };

      socket.onmessage = async (event) => {
        const text = await decodeMessage(event.data);
        if (text === null) {
          logDiagnostic("provider_unsupported_message", {
            opened,
            subscriptionSent,
          });
          finishError("provider_error");
          return;
        }

        try {
          const raw = JSON.parse(text) as unknown;
          if (isProviderError(raw)) {
            logDiagnostic("provider_error_message", {
              opened,
              subscriptionSent,
            });
            finishError("provider_error");
            return;
          }

          if (!isPositionReport(raw)) {
            return;
          }

          finishSuccess(raw);
        } catch {
          logDiagnostic("provider_malformed_message", {
            opened,
            subscriptionSent,
          });
          finishError("provider_error");
        }
      };

      socket.onerror = () => {
        logDiagnostic(opened ? "socket_error_after_open" : "socket_error_before_open", {
          opened,
          subscriptionSent,
        });
        finishError("connect_failed");
      };

      socket.onclose = () => {
        if (!settled) {
          logDiagnostic(
            opened ? "socket_closed_after_open" : "socket_closed_before_open",
            { opened, subscriptionSent },
          );
          finishError(opened ? "disconnected" : "connect_failed");
        }
      };
    } catch {
      logDiagnostic("socket_constructor_failed", {
        opened,
        subscriptionSent,
      });
      finishError("connect_failed");
    }
  });
}

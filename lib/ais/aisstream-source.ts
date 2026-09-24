import type {
  SnapshotConnection,
  SnapshotSource,
  SnapshotSourceHandlers,
} from "./collector";

const AISSTREAM_URL = "wss://stream.aisstream.io/v0/stream";

type AisStreamSourceOptions = {
  apiKey: string;
  boundingBoxes: readonly (readonly (readonly [number, number])[])[];
};

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

  const messageType = (message as { MessageType?: unknown }).MessageType;
  return messageType === "Error" || messageType === "ErrorMessage";
}

export function createAisStreamSource({
  apiKey,
  boundingBoxes,
}: AisStreamSourceOptions): SnapshotSource {
  return {
    connect: (handlers: SnapshotSourceHandlers): SnapshotConnection => {
      let socket: WebSocket | null = null;
      let opened = false;
      let closed = false;

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        if (socket) {
          socket.onopen = null;
          socket.onmessage = null;
          socket.onerror = null;
          socket.onclose = null;
          socket.close();
          socket = null;
        }
      };

      try {
        socket = new WebSocket(AISSTREAM_URL);

        socket.onopen = () => {
          opened = true;

          try {
            socket?.send(
              JSON.stringify({
                APIKey: apiKey,
                BoundingBoxes: boundingBoxes,
                FilterMessageTypes: ["PositionReport"],
              }),
            );
            handlers.onReady();
          } catch {
            handlers.onConnectError();
          }
        };

        socket.onmessage = async (event) => {
          const text = await decodeMessage(event.data);
          if (text === null) {
            handlers.onProviderError();
            return;
          }

          try {
            const message = JSON.parse(text) as unknown;
            if (isProviderError(message)) {
              handlers.onProviderError();
              return;
            }

            handlers.onMessage(message);
          } catch {
            handlers.onProviderError();
          }
        };

        socket.onerror = () => {
          handlers.onConnectError();
        };

        socket.onclose = () => {
          if (!closed) {
            handlers[opened ? "onDisconnected" : "onConnectError"]();
          }
        };
      } catch {
        handlers.onConnectError();
      }

      return { close };
    },
  };
}

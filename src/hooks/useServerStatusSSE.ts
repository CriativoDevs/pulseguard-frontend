import { useEffect, useRef, useState } from "react";
import { baseURL } from "../api/client";

/**
 * Consumes the SSE status stream from the backend using fetch (not EventSource),
 * so we can inject the Authorization header with the JWT token.
 */
export function useServerStatusSSE() {
  const [statuses, setStatuses] = useState<Record<number, any>>({});
  const [pings, setPings] = useState<Record<number, any>>({});
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;

    async function connect() {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const token = localStorage.getItem("access_token");

      try {
        const response = await fetch(`${baseURL}/events/status/`, {
          signal: controller.signal,
          headers: {
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!response.ok || !response.body) {
          setError(`Stream error: ${response.status}`);
          return;
        }

        setError(null);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (active) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          let eventType = "message";
          let dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith("event:")) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith("data:")) {
              dataLines.push(line.slice(5).trim());
            } else if (line === "" && dataLines.length > 0) {
              // Dispatch accumulated event
              try {
                const payload = JSON.parse(dataLines.join("\n"));
                if (eventType === "status") {
                  setStatuses((prev) => ({ ...prev, [payload.server]: payload }));
                } else if (eventType === "ping") {
                  setPings((prev) => ({ ...prev, [payload.server]: payload }));
                }
              } catch {
                // ignore malformed events
              }
              eventType = "message";
              dataLines = [];
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError" && active) {
          console.warn("SSE disconnected, will not retry automatically:", err);
          setError("Stream desligado");
        }
      }
    }

    connect();

    return () => {
      active = false;
      abortRef.current?.abort();
    };
  }, []);

  return { statuses, pings, error };
}

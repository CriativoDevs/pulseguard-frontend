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
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    let retryDelay = 1000;

    const scheduleReconnect = (connect: () => void) => {
      if (!active || retryTimeoutRef.current) return;
      retryTimeoutRef.current = setTimeout(() => {
        retryTimeoutRef.current = null;
        retryDelay = Math.min(retryDelay * 2, 10000);
        connect();
      }, retryDelay);
    };

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
          scheduleReconnect(connect);
          return;
        }

        setError(null);
        retryDelay = 1000;

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

        scheduleReconnect(connect);
      } catch (err: any) {
        if (err.name !== "AbortError" && active) {
          console.warn("SSE disconnected; retrying automatically:", err);
          setError("Stream desligado");
          scheduleReconnect(connect);
        }
      }
    }

    connect();

    return () => {
      active = false;
      abortRef.current?.abort();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  return { statuses, pings, error };
}

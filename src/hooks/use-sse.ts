"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { SessionStatus, SignalSeverity, SignalSource } from "@/lib/types";

interface SSESignal {
  type: string;
  severity: SignalSeverity;
  metadata: Record<string, unknown>;
  source: SignalSource;
}

interface SSEState {
  status: SessionStatus;
  integrityScore: number;
  signals: SSESignal[];
  connected: boolean;
  details?: Record<string, unknown>;
}

export function useSSE(sessionId: string | null) {
  const [state, setState] = useState<SSEState>({
    status: "waiting_for_companion",
    integrityScore: 100,
    signals: [],
    connected: false,
  });
  const eventSourceRef = useRef<EventSource | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setState((prev) => ({ ...prev, connected: false }));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const es = new EventSource(`/api/session/${sessionId}/status`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, connected: true }));
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.event === "status") {
          setState((prev) => ({
            ...prev,
            status: data.status,
            integrityScore: data.integrityScore ?? prev.integrityScore,
            details: data.details,
          }));
        } else if (data.event === "signal") {
          setState((prev) => ({
            ...prev,
            integrityScore: data.integrityScore ?? prev.integrityScore,
            signals: [...prev.signals, data.signal],
          }));
        }
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      setState((prev) => ({ ...prev, connected: false }));
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [sessionId]);

  return { ...state, disconnect };
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { SessionStatus, SignalSeverity, SignalSource } from '@/lib/types';

interface SSESignal {
  type: string;
  severity: SignalSeverity;
  metadata: Record<string, unknown>;
  source: SignalSource;
}

interface SSEState {
  status: SessionStatus;
  integrityScore: number;
  hardWarnings: number;
  signals: SSESignal[];
  connected: boolean;
  details?: Record<string, unknown>;
}

const POLL_INTERVAL_MS = 2000;

export function useSSE(sessionId: string | null) {
  const [state, setState] = useState<SSEState>({
    status: 'waiting_for_companion',
    integrityScore: 100,
    hardWarnings: 0,
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

  // SSE connection for real-time events
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

        if (data.event === 'status') {
          setState((prev) => ({
            ...prev,
            status: data.status,
            integrityScore: data.integrityScore ?? prev.integrityScore,
            hardWarnings: data.hardWarnings ?? prev.hardWarnings,
            details: data.details,
          }));
        } else if (data.event === 'signal') {
          setState((prev) => ({
            ...prev,
            integrityScore: data.integrityScore ?? prev.integrityScore,
            hardWarnings: data.hardWarnings ?? prev.hardWarnings,
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

  // Polling fallback — SSE push events can be silently lost when the
  // ReadableStream controller is enqueued from a different request context.
  // Poll the DB-backed endpoint to catch status changes the SSE missed.
  useEffect(() => {
    if (!sessionId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}/poll`);
        if (!res.ok) return;
        const data = await res.json();

        setState((prev) => {
          if (
            data.status !== prev.status ||
            data.integrityScore !== prev.integrityScore ||
            data.hardWarnings !== prev.hardWarnings
          ) {
            return {
              ...prev,
              status: data.status,
              integrityScore: data.integrityScore,
              hardWarnings: data.hardWarnings ?? prev.hardWarnings,
            };
          }
          return prev;
        });
      } catch {
        // Network error — ignore, will retry next interval
      }
    };

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [sessionId]);

  return { ...state, disconnect };
}

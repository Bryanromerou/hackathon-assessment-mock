"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const ELECTRON_WS_URL = "ws://localhost:18329";
const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 10000;

interface ElectronBridgeState {
  connected: boolean;
  electronReady: boolean;
}

/**
 * WebSocket bridge between the assessment browser and the Electron
 * companion app. Forwards browser-detected signals to Electron's
 * local WS server so they appear in the aggregator alongside OS-level
 * signals. Also exposes connection status so the UI can indicate
 * whether the companion app is reachable.
 */
export function useElectronBridge(enabled: boolean) {
  const [state, setState] = useState<ElectronBridgeState>({
    connected: false,
    electronReady: false,
  });
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const cleanup = useCallback(() => {
    if (pingTimer.current) {
      clearInterval(pingTimer.current);
      pingTimer.current = null;
    }
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState({ connected: false, electronReady: false });
  }, []);

  const connect = useCallback(() => {
    if (!enabledRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(ELECTRON_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setState((prev) => ({ ...prev, connected: true }));

        // Start keepalive pings
        pingTimer.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "handshake") {
            setState((prev) => ({ ...prev, electronReady: true }));
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        setState({ connected: false, electronReady: false });
        if (pingTimer.current) {
          clearInterval(pingTimer.current);
          pingTimer.current = null;
        }
        // Auto-reconnect
        if (enabledRef.current) {
          reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        // onclose will fire after this, which handles reconnect
      };
    } catch {
      // WebSocket constructor can throw if URL is invalid
      if (enabledRef.current) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      cleanup();
    }

    return cleanup;
  }, [enabled, connect, cleanup]);

  /**
   * Send a browser-detected signal through the WS bridge to the
   * Electron aggregator. Signals are fire-and-forget — if the WS
   * isn't connected, the signal is silently dropped (it still reaches
   * the assessment API directly via the HTTP path).
   */
  const sendSignal = useCallback(
    (signal: { type: string; metadata: Record<string, unknown> }) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "signal",
            payload: {
              type: signal.type,
              metadata: signal.metadata,
              source: "browser",
            },
          })
        );
      }
    },
    []
  );

  return {
    connected: state.connected,
    electronReady: state.electronReady,
    sendSignal,
  };
}

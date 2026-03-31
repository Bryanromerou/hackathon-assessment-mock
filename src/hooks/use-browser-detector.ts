"use client";

import { useEffect, useRef } from "react";

const DENY_LIST_ID_PREFIXES = ["claude-", "pplx-", "mynext-", "cluely-"];
const AI_BROWSER_UA_PATTERNS = [
  { pattern: /opera.*neon/i, type: "opera-neon" },
  { pattern: /atlas/i, type: "atlas-browser" },
  { pattern: /dia\s/i, type: "dia-browser" },
  { pattern: /arc\//i, type: "arc-browser" },
];
const USER_EVENT_TYPES = ["mousedown", "keydown", "touchstart", "pointerdown"];
const FORM_ELEMENT_TAGS = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];
const DOM_MUTATION_QUIET_MS = 500;

function isNativeFn(fn: unknown): boolean {
  if (typeof fn !== "function") return true;
  return /\[native code\]/.test(Function.prototype.toString.call(fn));
}

function matchesDenyList(id: string | null): string | null {
  if (!id) return null;
  return DENY_LIST_ID_PREFIXES.find((p) => id.startsWith(p)) ?? null;
}

type SignalCallback = (signal: {
  type: string;
  metadata: Record<string, unknown>;
}) => void;

export function useBrowserDetector(
  enabled: boolean,
  onSignal: SignalCallback
) {
  const lastUserEventAt = useRef(0);
  const callbackRef = useRef(onSignal);
  callbackRef.current = onSignal;

  useEffect(() => {
    if (!enabled) return;

    const emit = (type: string, metadata: Record<string, unknown> = {}) => {
      callbackRef.current({ type, metadata });
    };

    // ── One-time checks ──────────────────────────────
    // Webdriver
    if (navigator.webdriver) {
      emit("webdriver", { webdriverFlag: true });
    }

    // Cypress
    if ((window as unknown as Record<string, unknown>).Cypress) {
      emit("cypress");
    }

    // AI browser CSS variable
    try {
      const sidebarWidth = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-width");
      if (sidebarWidth !== "") {
        emit("ai-browser", { aiBrowserType: "comet", source: "css-variable" });
      }
    } catch {
      /* ignore */
    }

    // AI browser user agent
    const ua = navigator.userAgent;
    for (const { pattern, type } of AI_BROWSER_UA_PATTERNS) {
      if (pattern.test(ua)) {
        emit("ai-browser", { aiBrowserType: type, source: "user-agent" });
      }
    }

    // Claude agent DOM artifacts
    if (
      document.querySelector('[id^="claude-agent"]') ||
      document.querySelector("style#claude-agent-animation-styles")
    ) {
      emit("ai-browser", {
        aiBrowserType: "claude-chrome",
        source: "dom-artifact",
      });
    }

    // Extension runtime
    const chrome = (window as unknown as Record<string, unknown>).chrome as Record<string, unknown> | undefined;
    const browser = (window as unknown as Record<string, unknown>).browser as Record<string, unknown> | undefined;
    const extensionId =
      (chrome?.runtime as Record<string, unknown>)?.id ??
      (browser?.runtime as Record<string, unknown>)?.id;
    if (extensionId) {
      emit("extension-runtime", { extensionId: String(extensionId) });
    }

    // Prototype tampering
    const tampered: string[] = [];
    if (!isNativeFn(window.fetch)) tampered.push("fetch");
    if (!isNativeFn(XMLHttpRequest.prototype.open))
      tampered.push("XMLHttpRequest.open");
    if (!isNativeFn(EventTarget.prototype.addEventListener))
      tampered.push("addEventListener");
    if (!isNativeFn(document.createElement))
      tampered.push("document.createElement");
    if (!isNativeFn(Element.prototype.attachShadow))
      tampered.push("attachShadow");
    if (tampered.length > 0) {
      emit("prototype-tamper", { tampered: tampered.join(",") });
    }

    // iframe embedding
    try {
      if (window.self !== window.top) {
        emit("ai-browser", {
          aiBrowserType: "iframe-overlay",
          source: "frame-check",
        });
      }
    } catch {
      emit("ai-browser", {
        aiBrowserType: "iframe-overlay",
        source: "frame-check-blocked",
      });
    }

    // Extension stylesheets
    try {
      for (const sheet of document.styleSheets) {
        if (sheet.href && /^(chrome|moz)-extension:\/\//.test(sheet.href)) {
          emit("extension-runtime", {
            source: "stylesheet",
            extensionUrl: sheet.href,
          });
        }
      }
    } catch {
      /* cross-origin blocked */
    }

    // ── Continuous monitoring ─────────────────────────
    const cleanups: (() => void)[] = [];

    // User event tracking
    USER_EVENT_TYPES.forEach((eventType) => {
      const handler = () => {
        lastUserEventAt.current = Date.now();
      };
      document.addEventListener(eventType, handler, { passive: true });
      cleanups.push(() => document.removeEventListener(eventType, handler));
    });

    // DOM mutation observer
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            const el = node as Element;

            const matchedPrefix = matchesDenyList(el.id ?? "");
            if (matchedPrefix) {
              emit("dom-mutation", {
                mutationType: "deny-list-injection",
                matchedPrefix,
                elementId: el.id,
                targetTag: el.tagName,
              });
              continue;
            }

            if (
              el.tagName === "IFRAME" &&
              (el as HTMLIFrameElement).src &&
              /^(chrome|moz)-extension:\/\//.test(
                (el as HTMLIFrameElement).src
              )
            ) {
              emit("extension-runtime", {
                source: "iframe-injection",
                extensionUrl: (el as HTMLIFrameElement).src,
              });
              continue;
            }

            const timeSinceUserEvent =
              Date.now() - lastUserEventAt.current;
            if (timeSinceUserEvent >= DOM_MUTATION_QUIET_MS) {
              if (el.tagName === "SCRIPT" || el.tagName === "IFRAME") {
                emit("dom-mutation", {
                  mutationType: "injection",
                  targetTag: el.tagName,
                  src:
                    (el as HTMLScriptElement).src ||
                    el.textContent?.substring(0, 100) ||
                    "",
                });
                continue;
              }
              if (FORM_ELEMENT_TAGS.includes(el.tagName)) {
                emit("dom-mutation", {
                  mutationType: "injected-form-element",
                  targetTag: el.tagName,
                });
              }
            }
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["value", "checked", "selected", "disabled"],
    });
    cleanups.push(() => observer.disconnect());

    // Focus monitoring
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        emit("focus-loss", { source: "visibilitychange" });
      }
    };
    const handleBlur = () => {
      emit("focus-loss", { source: "blur" });
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    cleanups.push(
      () => document.removeEventListener("visibilitychange", handleVisibility),
      () => window.removeEventListener("blur", handleBlur)
    );

    // Keyboard shortcut monitoring
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        emit("suspicious-shortcut", {
          combo: "Ctrl+Enter",
          tool: "cluely-suspected",
        });
      }
      if (e.ctrlKey && e.shiftKey && e.key === "Space") {
        emit("suspicious-shortcut", {
          combo: "Ctrl+Shift+Space",
          tool: "unknown",
        });
      }
    };
    document.addEventListener("keydown", handleKeydown);
    cleanups.push(() =>
      document.removeEventListener("keydown", handleKeydown)
    );

    // Clipboard monitoring
    const clipboardEvents = ["copy", "paste", "cut"] as const;
    clipboardEvents.forEach((eventType) => {
      const handler = (e: Event) => {
        const clipEvent = e as ClipboardEvent;
        emit("clipboard-event", {
          action: eventType,
          hasData:
            eventType === "paste" &&
            (clipEvent.clipboardData?.getData("text")?.length ?? 0) > 0,
        });
      };
      document.addEventListener(eventType, handler);
      cleanups.push(() => document.removeEventListener(eventType, handler));
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [enabled]);
}

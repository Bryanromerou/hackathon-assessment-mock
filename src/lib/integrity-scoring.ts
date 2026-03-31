import type { SignalSeverity } from "./types";

const DANGER_TYPES = [
  "ai-browser",
  "extension-runtime",
  "prototype-tamper",
  "consecutive-fast-answers",
  "high-suspicious-ratio",
  "cheating-app-detected",
  "cheating-app-installed",
  "ai-network-request",
];

const WARNING_TYPES = [
  "dom-mutation",
  "focus-loss",
  "suspicious-shortcut",
  "clipboard-event",
  "fast-answer",
  "clipboard-change",
];

export function getSignalSeverity(signalType: string): SignalSeverity {
  if (DANGER_TYPES.includes(signalType)) return "danger";
  if (WARNING_TYPES.includes(signalType)) return "warning";
  return "info";
}

export function calculateScoreDeduction(severity: SignalSeverity): number {
  switch (severity) {
    case "danger":
      return 15;
    case "warning":
      return 5;
    case "info":
      return 0;
  }
}

export function recalculateScore(
  currentScore: number,
  severity: SignalSeverity
): number {
  return Math.max(0, currentScore - calculateScoreDeduction(severity));
}

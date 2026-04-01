import type { SignalSeverity } from './types';

const DANGER_TYPES = [
  // Browser-detected
  'ai-browser',
  'extension-runtime',
  'prototype-tamper',
  'consecutive-fast-answers',
  'high-suspicious-ratio',
  'cheating-app-detected',
  'cheating-app-installed',
  'ai-network-request',
  // Electron-detected
  'process-detected',
  'network-connection',
  'app-installed',
  'extension-installed',
  'companion-app-closed',
];

const WARNING_TYPES = [
  // Browser-detected
  'dom-mutation',
  'focus-loss',
  'suspicious-shortcut',
  'clipboard-event',
  'fast-answer',
  'clipboard-change',
  // Electron-detected
  'multi-display',
  'display-change',
  'clipboard-rapid-change',
  'clipboard-suspicious-content',
  'clipboard-large-content',
];

// Hard warning types trigger the lockout mechanism.
// After 5 hard warnings the user is permanently locked out.
const HARD_WARNING_TYPES = [
  // AI detection (browser + electron)
  'ai-browser',
  'extension-runtime',
  'prototype-tamper',
  'cheating-app-detected',
  'cheating-app-installed',
  'ai-network-request',
  'process-detected',
  'network-connection',
  'app-installed',
  'extension-installed',
  // Integrity app closed
  'companion-app-closed',
  // Tab/window navigation — only non-suppressed signals reach the backend
  // (switching to the companion app is allowed by the Electron suppression logic)
  'focus-loss',
];

export function isHardWarning(signalType: string): boolean {
  return HARD_WARNING_TYPES.includes(signalType);
}

export function getSignalSeverity(signalType: string): SignalSeverity {
  if (DANGER_TYPES.includes(signalType)) return 'danger';
  if (WARNING_TYPES.includes(signalType)) return 'warning';
  return 'info';
}

export function calculateScoreDeduction(severity: SignalSeverity): number {
  switch (severity) {
    case 'danger':
      return 15;
    case 'warning':
      return 5;
    case 'info':
      return 0;
  }
}

export function recalculateScore(
  currentScore: number,
  severity: SignalSeverity,
): number {
  return Math.max(0, currentScore - calculateScoreDeduction(severity));
}

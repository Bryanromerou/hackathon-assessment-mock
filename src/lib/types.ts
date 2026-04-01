export type SessionStatus =
  | 'waiting_for_companion'
  | 'paired'
  | 'pre_check'
  | 'ready'
  | 'in_progress'
  | 'paused'
  | 'completed';

export type SignalSeverity = 'danger' | 'warning' | 'info';

export type SignalSource = 'electron' | 'browser';

export interface SSEEvent {
  event: string;
  status?: SessionStatus;
  integrityScore?: number;
  signal?: {
    type: string;
    severity: SignalSeverity;
    metadata: Record<string, unknown>;
    source: SignalSource;
  };
  details?: Record<string, unknown>;
}

export interface Question {
  id: string;
  category: 'verbal' | 'math' | 'abstract' | 'spatial';
  text: string;
  options: string[];
}

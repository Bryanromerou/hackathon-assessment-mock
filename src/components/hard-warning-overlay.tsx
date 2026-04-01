'use client';

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';

interface HardWarningOverlayProps {
  sessionId: string;
  hardWarnings: number;
  details?: Record<string, unknown>;
  hasActiveBlockers: boolean;
  onContinue: () => void;
}

const MAX_HARD_WARNINGS = 5;

export function HardWarningOverlay({
  sessionId,
  hardWarnings,
  details,
  hasActiveBlockers,
  onContinue,
}: HardWarningOverlayProps) {
  const [resuming, setResuming] = useState(false);
  const signalType = details?.signalType as string | undefined;
  const warningsLeft = MAX_HARD_WARNINGS - hardWarnings;

  const isCompanionClosed = signalType === 'companion-app-closed';
  const reason = isCompanionClosed
    ? 'The Integrity Companion App was closed'
    : 'AI or prohibited tool usage was detected';

  const handleContinue = useCallback(async () => {
    setResuming(true);
    try {
      await fetch(`/api/session/${sessionId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress', acknowledgeWarning: true }),
      });
      onContinue();
    } finally {
      setResuming(false);
    }
  }, [sessionId, onContinue]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-destructive">Hard Warning</h2>

        <p className="text-muted-foreground">{reason}.</p>

        <p className="text-sm text-muted-foreground">
          This is warning <strong>{hardWarnings}</strong> of{' '}
          <strong>{MAX_HARD_WARNINGS}</strong>.
        </p>

        {hardWarnings >= 2 && (
          <p className="text-sm font-semibold text-destructive">
            You have {warningsLeft} warning{warningsLeft !== 1 ? 's' : ''} left
            before being completely locked out of the assessment.
          </p>
        )}

        {hasActiveBlockers && (
          <p className="text-sm text-muted-foreground">
            Please close the prohibited application before continuing.
          </p>
        )}

        <Button
          size="lg"
          variant="destructive"
          onClick={handleContinue}
          disabled={resuming || hasActiveBlockers}
        >
          {resuming ? 'Resuming...' : 'Continue Assessment'}
        </Button>
      </div>
    </div>
  );
}

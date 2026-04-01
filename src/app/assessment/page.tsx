'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSSE } from '@/hooks/use-sse';
import { useElectronBridge } from '@/hooks/use-electron-bridge';
import { PairingCode } from '@/components/pairing-code';
import { PreCheckStatus } from '@/components/pre-check-status';
import { AssessmentRunner } from '@/components/assessment-runner';
import { IntegrityBanner } from '@/components/integrity-banner';
import { PausedOverlay } from '@/components/paused-overlay';
import { HardWarningOverlay } from '@/components/hard-warning-overlay';
import { LockedOutOverlay } from '@/components/locked-out-overlay';
import { CompletionSummary } from '@/components/completion-summary';
import { Button } from '@/components/ui/button';
import type { Question } from '@/lib/types';

function AssessmentContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [started, setStarted] = useState(false);

  const { status, integrityScore, hardWarnings, signals, connected, details } =
    useSSE(sessionId);
  const {
    connected: electronConnected,
    electronReady,
    sendStatus,
  } = useElectronBridge(status !== 'completed', sessionId, status);

  // Fetch questions when status becomes ready
  useEffect(() => {
    if (!sessionId) return;
    if (status !== 'ready' && status !== 'in_progress') return;
    if (questions.length > 0) return;

    async function fetchQuestions() {
      const res = await fetch(`/api/session/${sessionId}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data.questions);
      }
    }
    fetchQuestions();
  }, [sessionId, status, questions.length]);

  const handleBegin = useCallback(async () => {
    if (!sessionId) return;
    setStarted(true);
    sendStatus('in_progress');
    await fetch(`/api/session/${sessionId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'in_progress' }),
    });
  }, [sessionId, sendStatus]);

  const handleComplete = useCallback(async () => {
    if (!sessionId) return;
    sendStatus('completed');
    await fetch(`/api/session/${sessionId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
  }, [sessionId, sendStatus]);

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          No session found. Please start from the home page.
        </p>
      </div>
    );
  }

  // Derive whether blocking processes are still active from signal history.
  // Used to disable the "Continue Assessment" button on the hard warning overlay.
  const hasActiveBlockers = (() => {
    const active = new Set<string>();
    for (const s of signals) {
      if (s.type === 'process-detected') {
        active.add(s.metadata.name as string);
      } else if (s.type === 'process-disappeared') {
        active.delete(s.metadata.name as string);
      }
    }
    return active.size > 0 || !electronConnected;
  })();

  const showBanner = status !== 'waiting_for_companion';

  return (
    <div className="min-h-screen flex flex-col">
      {showBanner && (
        <IntegrityBanner
          score={integrityScore}
          signalCount={signals.length}
          electronConnected={electronConnected}
        />
      )}

      <main className="flex-1 flex items-center justify-center p-6">
        {status === 'waiting_for_companion' && (
          <PairingCode
            connected={electronConnected}
            electronReady={electronReady}
          />
        )}

        {(status === 'paired' || status === 'pre_check') && (
          <PreCheckStatus details={details} />
        )}

        {status === 'ready' && !started && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to Begin</h2>
            <p className="text-muted-foreground">
              System checks passed. You may now start the assessment.
            </p>
            <Button size="lg" onClick={handleBegin}>
              Begin Assessment
            </Button>
          </div>
        )}

        {(status === 'in_progress' ||
          status === 'paused' ||
          status === 'hard_warning' ||
          (status === 'ready' && started)) &&
          questions.length > 0 && (
            <AssessmentRunner
              questions={questions}
              sessionId={sessionId}
              paused={status === 'paused' || status === 'hard_warning'}
              onComplete={handleComplete}
            />
          )}

        {status === 'completed' && (
          <CompletionSummary
            integrityScore={integrityScore}
            signalCount={signals.length}
            totalQuestions={questions.length}
          />
        )}
      </main>

      {status === 'hard_warning' && (
        <HardWarningOverlay
          sessionId={sessionId}
          hardWarnings={hardWarnings}
          details={details}
          hasActiveBlockers={hasActiveBlockers}
          onContinue={() => {}}
        />
      )}
      {status === 'paused' && <PausedOverlay details={details} />}
      {status === 'locked_out' && <LockedOutOverlay />}
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AssessmentContent />
    </Suspense>
  );
}

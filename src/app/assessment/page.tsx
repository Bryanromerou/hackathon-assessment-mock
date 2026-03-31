"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSSE } from "@/hooks/use-sse";
import { PairingCode } from "@/components/pairing-code";
import { PreCheckStatus } from "@/components/pre-check-status";
import { AssessmentRunner } from "@/components/assessment-runner";
import { IntegrityBanner } from "@/components/integrity-banner";
import { PausedOverlay } from "@/components/paused-overlay";
import { CompletionSummary } from "@/components/completion-summary";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/types";

function AssessmentContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [started, setStarted] = useState(false);

  const { status, integrityScore, signals, connected, details } =
    useSSE(sessionId);

  // Fetch the pairing code on mount
  useEffect(() => {
    if (!sessionId) return;

    fetch(`/api/session/${sessionId}/status`, { method: "GET" }).catch(
      () => {}
    );

    // We need to get the pairing code from the session
    // The SSE connection handles status updates, but we need the code from the DB
    async function fetchSession() {
      // We'll use the create response stored in the URL, but since we redirected
      // we need to fetch it. For simplicity, read from a simple endpoint.
      // The pairing code was returned when the session was created.
      // We'll store it in sessionStorage during the redirect.
      const stored = sessionStorage.getItem(`pairing-${sessionId}`);
      if (stored) {
        setPairingCode(stored);
      }
    }
    fetchSession();
  }, [sessionId]);

  // Fetch questions when status becomes ready
  useEffect(() => {
    if (!sessionId) return;
    if (status !== "ready" && status !== "in_progress") return;
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
    await fetch(`/api/session/${sessionId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    });
  }, [sessionId]);

  const handleComplete = useCallback(async () => {
    if (!sessionId) return;
    await fetch(`/api/session/${sessionId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">
          No session found. Please start from the home page.
        </p>
      </div>
    );
  }

  const showBanner = status !== "waiting_for_companion";

  return (
    <div className="min-h-screen flex flex-col">
      {showBanner && (
        <IntegrityBanner score={integrityScore} signalCount={signals.length} />
      )}

      <main className="flex-1 flex items-center justify-center p-6">
        {status === "waiting_for_companion" && pairingCode && (
          <PairingCode pairingCode={pairingCode} connected={connected} />
        )}

        {status === "waiting_for_companion" && !pairingCode && (
          <PairingCode pairingCode="------" connected={connected} />
        )}

        {(status === "paired" || status === "pre_check") && (
          <PreCheckStatus details={details} />
        )}

        {status === "ready" && !started && (
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

        {(status === "in_progress" || (status === "ready" && started)) &&
          questions.length > 0 && (
            <AssessmentRunner
              questions={questions}
              sessionId={sessionId}
              onComplete={handleComplete}
            />
          )}

        {status === "completed" && (
          <CompletionSummary
            integrityScore={integrityScore}
            signalCount={signals.length}
            totalQuestions={questions.length}
          />
        )}
      </main>

      {status === "paused" && <PausedOverlay details={details} />}
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

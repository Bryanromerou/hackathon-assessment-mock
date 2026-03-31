"use client";

import { useState, useCallback } from "react";
import { AssessmentRunner } from "@/components/assessment-runner";
import { CompletionSummary } from "@/components/completion-summary";
import { Button } from "@/components/ui/button";
import { QUESTIONS } from "@/lib/questions";

export default function AssessmentPage() {
  const [status, setStatus] = useState<"ready" | "in_progress" | "completed">(
    "ready"
  );

  const handleBegin = useCallback(() => {
    setStatus("in_progress");
  }, []);

  const handleComplete = useCallback(() => {
    setStatus("completed");
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center p-6">
        {status === "ready" && (
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to Begin</h2>
            <p className="text-muted-foreground">
              You will answer {QUESTIONS.length} questions. Click below to
              start.
            </p>
            <Button size="lg" onClick={handleBegin}>
              Begin Assessment
            </Button>
          </div>
        )}

        {status === "in_progress" && (
          <AssessmentRunner
            questions={QUESTIONS}
            onComplete={handleComplete}
          />
        )}

        {status === "completed" && (
          <CompletionSummary totalQuestions={QUESTIONS.length} />
        )}
      </main>
    </div>
  );
}

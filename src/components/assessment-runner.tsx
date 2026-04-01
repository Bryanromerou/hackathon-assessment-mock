'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTimingAnalyzer } from '@/hooks/use-timing-analyzer';
import { useBrowserDetector } from '@/hooks/use-browser-detector';
import { useElectronBridge } from '@/hooks/use-electron-bridge';
import type { Question } from '@/lib/types';

interface AssessmentRunnerProps {
  questions: Question[];
  sessionId: string;
  paused?: boolean;
  onComplete: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  abstract: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  verbal: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  math: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  spatial: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
};

export function AssessmentRunner({
  questions,
  sessionId,
  paused = false,
  onComplete,
}: AssessmentRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);

  const { sendSignal: sendToElectron } = useElectronBridge(true, sessionId);

  const sendSignal = useCallback(
    async (signal: { type: string; metadata: Record<string, unknown> }) => {
      // Forward to Electron companion app via WebSocket
      sendToElectron(signal);

      // Also send directly to the assessment API
      try {
        await fetch(`/api/session/${sessionId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...signal, source: 'browser' }),
        });
      } catch {
        /* best effort */
      }
    },
    [sessionId, sendToElectron],
  );

  const { startQuestion, endQuestion } = useTimingAnalyzer(sendSignal);
  useBrowserDetector(true, sendSignal);

  const question = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  // Start timer for current question
  useEffect(() => {
    if (!question) return;

    startQuestion(question.id, question.category);
    setElapsed(0);

    const start = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, question, startQuestion]);

  async function handleAnswer(optionIndex: number) {
    if (!question || paused) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const timing = endQuestion(question.id);

    // Save response to DB
    try {
      await fetch(`/api/session/${sessionId}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'answer-recorded',
          source: 'browser',
          metadata: {
            questionId: question.id,
            selectedOption: optionIndex,
            responseTimeMs: timing?.elapsedMs ?? elapsed,
            timingSeverity: timing?.severity ?? 'normal',
          },
        }),
      });
    } catch {
      /* best effort */
    }

    if (currentIndex + 1 >= questions.length) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (!question) return null;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="font-mono tabular-nums">
            {(elapsed / 1000).toFixed(1)}s
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <Badge
            variant="outline"
            className={CATEGORY_COLORS[question.category] ?? ''}
          >
            {question.category}
          </Badge>

          <p className="text-lg leading-relaxed">{question.text}</p>

          <div className="space-y-2">
            {question.options.map((option, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleAnswer(i)}
              >
                {option}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

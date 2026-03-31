"use client";

import { useRef, useCallback } from "react";

const DIFFICULTY_THRESHOLDS: Record<
  string,
  { suspiciousMs: number; warningMs: number }
> = {
  abstract: { suspiciousMs: 8000, warningMs: 12000 },
  verbal: { suspiciousMs: 6000, warningMs: 10000 },
  math: { suspiciousMs: 10000, warningMs: 15000 },
  spatial: { suspiciousMs: 8000, warningMs: 12000 },
};

export interface TimingResult {
  questionId: string;
  category: string;
  elapsedMs: number;
  severity: "normal" | "warning" | "suspicious";
}

interface TimingState {
  questionTimings: TimingResult[];
  currentQuestion: { questionId: string; category: string; startedAt: number } | null;
  consecutiveFastAnswers: number;
  totalQuestions: number;
  suspiciousCount: number;
}

export function useTimingAnalyzer(
  onAnomaly: (signal: { type: string; metadata: Record<string, unknown> }) => void
) {
  const stateRef = useRef<TimingState>({
    questionTimings: [],
    currentQuestion: null,
    consecutiveFastAnswers: 0,
    totalQuestions: 0,
    suspiciousCount: 0,
  });

  const startQuestion = useCallback((questionId: string, category: string) => {
    stateRef.current.currentQuestion = {
      questionId,
      category,
      startedAt: Date.now(),
    };
  }, []);

  const endQuestion = useCallback(
    (questionId: string): TimingResult | null => {
      const s = stateRef.current;
      if (!s.currentQuestion || s.currentQuestion.questionId !== questionId) {
        return null;
      }

      const elapsed = Date.now() - s.currentQuestion.startedAt;
      const category = s.currentQuestion.category;
      const thresholds =
        DIFFICULTY_THRESHOLDS[category] || DIFFICULTY_THRESHOLDS.abstract;

      const timing: TimingResult = {
        questionId,
        category,
        elapsedMs: elapsed,
        severity: "normal",
      };

      if (elapsed < thresholds.suspiciousMs) {
        timing.severity = "suspicious";
        s.consecutiveFastAnswers++;
        s.suspiciousCount++;
      } else if (elapsed < thresholds.warningMs) {
        timing.severity = "warning";
        s.consecutiveFastAnswers = 0;
      } else {
        s.consecutiveFastAnswers = 0;
      }

      s.totalQuestions++;
      s.questionTimings.push(timing);

      // Emit anomaly signals
      if (timing.severity === "suspicious") {
        onAnomaly({
          type: "fast-answer",
          metadata: {
            questionId,
            category,
            elapsedMs: elapsed,
            thresholdMs: thresholds.suspiciousMs,
            consecutiveFast: s.consecutiveFastAnswers,
          },
        });
      }

      if (s.consecutiveFastAnswers >= 3) {
        onAnomaly({
          type: "consecutive-fast-answers",
          metadata: {
            count: s.consecutiveFastAnswers,
            recentTimings: s.questionTimings.slice(-3).map((t) => ({
              id: t.questionId,
              ms: t.elapsedMs,
              cat: t.category,
            })),
          },
        });
      }

      if (s.totalQuestions >= 5) {
        const ratio = s.suspiciousCount / s.totalQuestions;
        if (ratio > 0.5) {
          onAnomaly({
            type: "high-suspicious-ratio",
            metadata: {
              suspicious: s.suspiciousCount,
              total: s.totalQuestions,
              ratio: Math.round(ratio * 100),
            },
          });
        }
      }

      s.currentQuestion = null;
      return timing;
    },
    [onAnomaly]
  );

  const getStats = useCallback(() => {
    const timings = stateRef.current.questionTimings;
    if (timings.length === 0) {
      return { total: 0, avgMs: 0, suspicious: 0, warnings: 0 };
    }
    const totalMs = timings.reduce((sum, t) => sum + t.elapsedMs, 0);
    return {
      total: timings.length,
      avgMs: Math.round(totalMs / timings.length),
      suspicious: timings.filter((t) => t.severity === "suspicious").length,
      warnings: timings.filter((t) => t.severity === "warning").length,
    };
  }, []);

  const reset = useCallback(() => {
    stateRef.current = {
      questionTimings: [],
      currentQuestion: null,
      consecutiveFastAnswers: 0,
      totalQuestions: 0,
      suspiciousCount: 0,
    };
  }, []);

  return { startQuestion, endQuestion, getStats, reset };
}

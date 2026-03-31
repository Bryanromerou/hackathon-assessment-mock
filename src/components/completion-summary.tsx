"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletionSummaryProps {
  integrityScore: number;
  signalCount: number;
  totalQuestions: number;
}

export function CompletionSummary({
  integrityScore,
  signalCount,
  totalQuestions,
}: CompletionSummaryProps) {
  const scoreColor =
    integrityScore > 70
      ? "text-green-500"
      : integrityScore > 40
        ? "text-yellow-500"
        : "text-red-500";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Assessment Complete</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          You answered {totalQuestions} questions.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground">Integrity Score</div>
            <div className={`text-3xl font-bold ${scoreColor}`}>
              {integrityScore}
            </div>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted">
            <div className="text-sm text-muted-foreground">Signals</div>
            <div className="text-3xl font-bold">{signalCount}</div>
          </div>
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Thank you for completing the assessment. Your results have been
          recorded.
        </p>
      </CardContent>
    </Card>
  );
}

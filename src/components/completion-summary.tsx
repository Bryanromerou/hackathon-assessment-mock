"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletionSummaryProps {
  totalQuestions: number;
}

export function CompletionSummary({ totalQuestions }: CompletionSummaryProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Assessment Complete</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          You answered {totalQuestions} questions.
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-center text-muted-foreground">
          Thank you for completing the assessment.
        </p>
      </CardContent>
    </Card>
  );
}

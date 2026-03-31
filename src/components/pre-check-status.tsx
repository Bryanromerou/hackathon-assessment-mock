"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PreCheckStatusProps {
  details?: Record<string, unknown>;
}

export function PreCheckStatus({ details }: PreCheckStatusProps) {
  const blocker = details?.blocker as boolean | undefined;
  const apps = (details?.apps as string[]) ?? [];

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>System Pre-Check</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          The Companion App is scanning your system...
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        {blocker ? (
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-medium">
                Please close the following apps to continue:
              </span>
            </div>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {apps.map((app) => (
                <li key={app}>{app}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            <span className="text-sm">Running integrity checks...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

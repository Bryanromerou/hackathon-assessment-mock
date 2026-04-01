'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PairingCodeProps {
  connected: boolean;
  electronReady: boolean;
}

export function PairingCode({ connected, electronReady }: PairingCodeProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Connecting to Companion App</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Make sure the Integrity Companion App is running on this computer.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div
            className={`h-2 w-2 rounded-full ${
              electronReady
                ? 'bg-green-500'
                : connected
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-yellow-500 animate-pulse'
            }`}
          />
          {electronReady
            ? 'Connected — pairing automatically...'
            : connected
              ? 'Connected — waiting for companion app...'
              : 'Looking for Companion App...'}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-medium">
            Don&apos;t have the Companion App?
          </p>
          <p className="text-xs text-muted-foreground">
            Download and install the Integrity Companion App, then come back to
            this page. It will connect automatically.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PairingCodeProps {
  pairingCode: string;
  connected: boolean;
}

export function PairingCode({ pairingCode, connected }: PairingCodeProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Connect Companion App</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Enter this code in the Integrity Companion App
        </p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="font-mono text-5xl font-bold tracking-[0.3em] text-primary">
          {pairingCode}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-green-500" : "bg-yellow-500 animate-pulse"
            }`}
          />
          {connected
            ? "Connected — waiting for companion app..."
            : "Waiting for connection..."}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm font-medium">
            Don&apos;t have the Companion App?
          </p>
          <p className="text-xs text-muted-foreground">
            Download and install the Integrity Companion App, then enter the
            code above to pair your session.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

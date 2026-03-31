"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingHero() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    try {
      const res = await fetch("/api/session/create", { method: "POST" });
      const data = await res.json();
      sessionStorage.setItem(`pairing-${data.sessionId}`, data.pairingCode);
      router.push(`/assessment?session=${data.sessionId}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">
            CCAT Practice Assessment
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            A timed cognitive assessment covering verbal, math, abstract, and
            spatial reasoning.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            You will need to install the Integrity Companion App before starting
            the assessment.
          </p>
          <Button
            size="lg"
            onClick={handleStart}
            disabled={loading}
            className="w-full max-w-xs"
          >
            {loading ? "Creating session..." : "Start Assessment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

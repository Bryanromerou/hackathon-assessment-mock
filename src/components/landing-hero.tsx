"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LandingHero() {
  const router = useRouter();

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
          <Button
            size="lg"
            onClick={() => router.push("/assessment")}
            className="w-full max-w-xs"
          >
            Start Assessment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

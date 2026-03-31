import { NextResponse } from "next/server";
import { addSignal, getSession } from "@/lib/sessions";
import type { SignalSource } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { type, metadata = {}, source = "electron" } = body;

  if (!type) {
    return NextResponse.json(
      { error: "type is required" },
      { status: 400 }
    );
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  const updated = await addSignal(
    sessionId,
    type,
    metadata,
    source as SignalSource
  );

  return NextResponse.json({
    sessionId,
    integrityScore: updated?.integrityScore,
  });
}

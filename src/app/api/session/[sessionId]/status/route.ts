import { NextResponse } from "next/server";
import { getSession, updateSessionStatus } from "@/lib/sessions";
import { setSSEController, removeSSEController } from "@/lib/sse";
import type { SessionStatus } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      setSSEController(sessionId, controller);

      // Send current status immediately
      const data = `data: ${JSON.stringify({
        event: "status",
        status: session.status,
        integrityScore: session.integrityScore,
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    },
    cancel() {
      removeSSEController(sessionId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { status, details } = body;

  if (!status) {
    return NextResponse.json(
      { error: "status is required" },
      { status: 400 }
    );
  }

  const session = await updateSessionStatus(
    sessionId,
    status as SessionStatus,
    details
  );

  return NextResponse.json({
    sessionId: session.id,
    status: session.status,
    integrityScore: session.integrityScore,
  });
}

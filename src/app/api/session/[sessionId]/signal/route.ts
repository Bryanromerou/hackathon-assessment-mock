import { NextResponse } from 'next/server';
import { addSignal, getSession } from '@/lib/sessions';
import type { SignalSource } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { type, metadata = {}, source = 'electron' } = body;

  if (!type) {
    return NextResponse.json({ error: 'type is required' }, { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Reject answer submissions when the session is paused or completed.
  // Integrity signals (from Electron/browser detectors) are still allowed
  // so they continue to be recorded even during pause.
  if (
    type === 'answer-recorded' &&
    (session.status === 'paused' || session.status === 'completed')
  ) {
    return NextResponse.json(
      { error: 'Session is not active' },
      { status: 403 },
    );
  }

  const updated = await addSignal(
    sessionId,
    type,
    metadata,
    source as SignalSource,
  );

  return NextResponse.json({
    sessionId,
    integrityScore: updated?.integrityScore,
  });
}

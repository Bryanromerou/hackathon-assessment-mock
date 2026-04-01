import { NextResponse } from 'next/server';
import { getSession } from '@/lib/sessions';
import { QUESTIONS } from '@/lib/questions';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = await getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  if (!['ready', 'in_progress'].includes(session.status)) {
    return NextResponse.json(
      { error: 'Assessment not ready. Current status: ' + session.status },
      { status: 403 },
    );
  }

  return NextResponse.json({ questions: QUESTIONS });
}

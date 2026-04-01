import { prisma } from './db';
import { pushSSE } from './sse';
import { getSignalSeverity, recalculateScore, isHardWarning } from './integrity-scoring';
import type { SessionStatus, SignalSource } from './types';

export async function createSession() {
  const session = await prisma.session.create({
    data: {},
  });
  return { sessionId: session.id };
}

export async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: { signals: true, responses: true },
  });
}

export async function updateSessionStatus(
  sessionId: string,
  status: SessionStatus,
  details?: Record<string, unknown>,
) {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status },
  });

  pushSSE(sessionId, {
    event: 'status',
    status: session.status,
    integrityScore: session.integrityScore,
    details,
  });

  return session;
}

export async function addSignal(
  sessionId: string,
  type: string,
  metadata: Record<string, unknown>,
  source: SignalSource,
) {
  const severity = getSignalSeverity(type);

  // Insert signal
  await prisma.integritySignal.create({
    data: {
      sessionId,
      type,
      severity,
      metadata: JSON.stringify(metadata),
      source,
    },
  });

  // Recalculate score
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
  });
  if (!session) return null;

  const newScore = recalculateScore(session.integrityScore, severity);

  const isHard = isHardWarning(type);
  // Only count a hard warning when transitioning FROM an active assessment state.
  // 'paused' is included because Electron's pauseAssessment() sets status to
  // 'paused' immediately, while the signal is queued and arrives ~1s later.
  // This prevents counting during pre-check (setup) and prevents stacking
  // multiple hard warnings when already in hard_warning.
  const shouldCountHard = isHard && ['in_progress', 'ready', 'paused'].includes(session.status);
  const newHardWarnings = shouldCountHard ? session.hardWarnings + 1 : session.hardWarnings;
  const MAX_HARD_WARNINGS = 5;

  const shouldLockOut = shouldCountHard && newHardWarnings >= MAX_HARD_WARNINGS;
  const shouldPause = shouldCountHard && !shouldLockOut;

  const updateData: Record<string, unknown> = { integrityScore: newScore };
  if (shouldCountHard) updateData.hardWarnings = newHardWarnings;
  if (shouldLockOut) updateData.status = 'locked_out';
  else if (shouldPause) updateData.status = 'hard_warning';

  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: updateData,
  });

  // Push signal event to SSE
  pushSSE(sessionId, {
    event: 'signal',
    signal: { type, severity, metadata, source },
    integrityScore: updated.integrityScore,
    hardWarnings: updated.hardWarnings,
  });

  // Push status change if hard warning triggered pause or lockout
  if (shouldLockOut) {
    pushSSE(sessionId, {
      event: 'status',
      status: 'locked_out',
      integrityScore: updated.integrityScore,
      hardWarnings: updated.hardWarnings,
      details: { reason: 'locked-out', hardWarnings: newHardWarnings },
    });
  } else if (shouldPause) {
    pushSSE(sessionId, {
      event: 'status',
      status: 'hard_warning',
      integrityScore: updated.integrityScore,
      hardWarnings: updated.hardWarnings,
      details: { hardWarnings: newHardWarnings, signalType: type },
    });
  }

  return updated;
}

export async function addResponse(
  sessionId: string,
  questionId: string,
  selectedOption: number,
  responseTimeMs: number,
  timingSeverity: string,
) {
  return prisma.assessmentResponse.create({
    data: {
      sessionId,
      questionId,
      selectedOption,
      responseTimeMs,
      timingSeverity,
    },
  });
}

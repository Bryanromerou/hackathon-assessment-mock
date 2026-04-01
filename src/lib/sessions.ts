import { prisma } from "./db";
import { pushSSE } from "./sse";
import { getSignalSeverity, recalculateScore } from "./integrity-scoring";
import type { SessionStatus, SignalSource } from "./types";

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
  details?: Record<string, unknown>
) {
  const session = await prisma.session.update({
    where: { id: sessionId },
    data: { status },
  });

  pushSSE(sessionId, {
    event: "status",
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
  source: SignalSource
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
  const updated = await prisma.session.update({
    where: { id: sessionId },
    data: { integrityScore: newScore },
  });

  // Push to SSE
  pushSSE(sessionId, {
    event: "signal",
    signal: { type, severity, metadata, source },
    integrityScore: updated.integrityScore,
  });

  return updated;
}

export async function addResponse(
  sessionId: string,
  questionId: string,
  selectedOption: number,
  responseTimeMs: number,
  timingSeverity: string
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

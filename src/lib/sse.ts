/**
 * In-memory map of SSE controllers keyed by sessionId.
 * ReadableStreamDefaultController can't be persisted in DB,
 * so this is the only in-memory state in the app.
 */
const sseControllers = new Map<string, ReadableStreamDefaultController>();

export function setSSEController(
  sessionId: string,
  controller: ReadableStreamDefaultController
) {
  sseControllers.set(sessionId, controller);
}

export function removeSSEController(sessionId: string) {
  sseControllers.delete(sessionId);
}

export function pushSSE(sessionId: string, data: Record<string, unknown>) {
  const controller = sseControllers.get(sessionId);
  if (!controller) return;

  try {
    const encoded = new TextEncoder().encode(
      `data: ${JSON.stringify(data)}\n\n`
    );
    controller.enqueue(encoded);
  } catch {
    // Controller may be closed — clean up
    sseControllers.delete(sessionId);
  }
}

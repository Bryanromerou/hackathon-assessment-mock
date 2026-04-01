/**
 * In-memory map of SSE controllers keyed by sessionId.
 * ReadableStreamDefaultController can't be persisted in DB,
 * so this is the only in-memory state in the app.
 *
 * Stored on globalThis so the map survives Next.js module
 * re-evaluation during development (same pattern as the Prisma client).
 */
const globalForSSE = globalThis as unknown as {
  sseControllers: Map<string, ReadableStreamDefaultController> | undefined;
};

const sseControllers =
  globalForSSE.sseControllers ??
  new Map<string, ReadableStreamDefaultController>();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseControllers = sseControllers;
}

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

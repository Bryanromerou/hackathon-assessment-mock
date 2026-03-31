import { NextResponse } from "next/server";
import { getSessionByPairingCode, updateSessionStatus } from "@/lib/sessions";

export async function POST(request: Request) {
  const body = await request.json();
  const { pairingCode } = body;

  if (!pairingCode) {
    return NextResponse.json(
      { error: "pairingCode is required" },
      { status: 400 }
    );
  }

  const session = await getSessionByPairingCode(pairingCode);
  if (!session) {
    return NextResponse.json(
      { error: "Invalid pairing code" },
      { status: 404 }
    );
  }

  await updateSessionStatus(session.id, "paired");

  return NextResponse.json({
    sessionId: session.id,
    status: "paired",
  });
}

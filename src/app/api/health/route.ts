import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "solarentry",
    ts: new Date().toISOString(),
  });
}

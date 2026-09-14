import { NextRequest, NextResponse } from "next/server";
import { runSolarCheck } from "@/lib/solar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      address?: string;
      latitude?: number;
      longitude?: number;
    };

    const result = await runSolarCheck({
      address: body.address,
      latitude: body.latitude,
      longitude: body.longitude,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Solar check failed unexpectedly.";
    console.error("[api/solar]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") || undefined;
  const lat = searchParams.get("latitude");
  const lng = searchParams.get("longitude");

  try {
    const result = await runSolarCheck({
      address,
      latitude: lat != null ? Number(lat) : undefined,
      longitude: lng != null ? Number(lng) : undefined,
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Solar check failed unexpectedly.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

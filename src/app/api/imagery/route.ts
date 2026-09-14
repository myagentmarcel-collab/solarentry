import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy Google Solar / Maps imagery so API keys never reach the browser.
 * Only allows googleapis.com / google.com / googleusercontent.com hosts.
 */
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  if (!src) {
    return NextResponse.json({ error: "Missing src" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(src);
  } catch {
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  }

  const host = target.hostname;
  const allowed =
    host.endsWith(".googleapis.com") ||
    host.endsWith(".google.com") ||
    host.endsWith(".googleusercontent.com") ||
    host === "googleapis.com" ||
    host === "google.com";

  if (!allowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  // Attach key if Solar imagery URL expects it and key is configured
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (key && !target.searchParams.has("key")) {
    target.searchParams.set("key", key);
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { Accept: "image/*,*/*" },
      next: { revalidate: 3600 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream imagery error (${upstream.status})` },
        { status: 502 }
      );
    }

    const contentType =
      upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    console.error("[api/imagery]", e);
    return NextResponse.json(
      { error: "Failed to fetch imagery" },
      { status: 502 }
    );
  }
}

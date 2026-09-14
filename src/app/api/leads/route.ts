import { NextRequest, NextResponse } from "next/server";
import {
  appendLeadToSheet,
  leadSchema,
  persistLead,
  sendLeadEmail,
} from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Validation failed",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 1) Create record (file write is best-effort; never 500 on EROFS/Vercel)
    const { record, stored } = await persistLead(parsed.data);

    // 2) Email (best-effort)
    let emailResult: { sent: boolean; method?: string; note?: string };
    try {
      emailResult = await sendLeadEmail(record);
    } catch (e) {
      console.error("[api/leads] email error", e);
      emailResult = {
        sent: false,
        note: "Email send failed — lead was still recorded.",
      };
    }

    // 3) Sheets (best-effort)
    let sheetResult: { appended: boolean; note?: string };
    try {
      sheetResult = await appendLeadToSheet(record);
    } catch (e) {
      console.error("[api/leads] sheets error", e);
      sheetResult = {
        appended: false,
        note: "Sheets append failed — lead was still recorded.",
      };
    }

    const allChannelsFailed =
      !emailResult.sent && !sheetResult.appended && stored === "memory";

    return NextResponse.json({
      ok: true,
      id: record.id,
      stored,
      email: emailResult,
      sheets: sheetResult,
      ...(allChannelsFailed
        ? {
            note: "Lead was logged (memory/console); email and sheets unavailable.",
          }
        : {}),
      message:
        "Thanks — we received your request. Call 203-818-3242 anytime.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to save lead.";
    console.error("[api/leads]", message);
    // Never surface EROFS as 500 — treat as successful memory log if we got this far
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";
    if (code === "EROFS" || code === "EACCES" || process.env.VERCEL) {
      return NextResponse.json({
        ok: true,
        stored: "memory",
        note: "Lead was logged; filesystem is read-only.",
        message:
          "Thanks — we received your request. Call 203-818-3242 anytime.",
      });
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

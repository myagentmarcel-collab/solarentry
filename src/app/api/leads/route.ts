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

    const record = await persistLead(parsed.data);

    let emailResult: { sent: boolean; method?: string; note?: string };
    try {
      emailResult = await sendLeadEmail(record);
    } catch (e) {
      console.error("[api/leads] email error", e);
      emailResult = {
        sent: false,
        note: "Email send failed — lead was still saved.",
      };
    }

    let sheetResult: { appended: boolean; note?: string };
    try {
      sheetResult = await appendLeadToSheet(record);
    } catch (e) {
      console.error("[api/leads] sheets error", e);
      sheetResult = {
        appended: false,
        note: "Sheets append failed — lead was still saved.",
      };
    }

    return NextResponse.json({
      ok: true,
      id: record.id,
      email: emailResult,
      sheets: sheetResult,
      message:
        "Thanks — we received your request. Call 203-818-3242 anytime.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to save lead.";
    console.error("[api/leads]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

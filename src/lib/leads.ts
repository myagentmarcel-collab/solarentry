import { promises as fs } from "fs";
import path from "path";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { z } from "zod";
import type { LeadPayload, LeadRecord } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

export const leadSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(10, "Phone number is required")
    .regex(/^[\d\s()+-]{10,20}$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email"),
  address: z.string().trim().min(5, "Home address is required"),
  preferredDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a consult date"),
  preferredTime: z.string().trim().min(1, "Choose a preferred time"),
  suitability: z.enum(["Good", "Fair", "Poor"]).optional(),
  panelCount: z.number().optional(),
  systemSizeKw: z.number().optional(),
  sunHours: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

async function ensureLeadsFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(LEADS_FILE);
  } catch {
    await fs.writeFile(LEADS_FILE, "[]\n", "utf8");
  }
}

export async function persistLead(payload: LeadPayload): Promise<LeadRecord> {
  await ensureLeadsFile();
  const raw = await fs.readFile(LEADS_FILE, "utf8");
  const list = JSON.parse(raw || "[]") as LeadRecord[];
  const record: LeadRecord = {
    ...payload,
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  list.push(record);
  await fs.writeFile(LEADS_FILE, JSON.stringify(list, null, 2) + "\n", "utf8");
  return record;
}

export async function sendLeadEmail(
  record: LeadRecord
): Promise<{ sent: boolean; method?: string; note?: string }> {
  const to =
    process.env.LEAD_EMAIL_TO || "solarx28@gmail.com";
  const subject = `Solar Entry consult request — ${record.address}`;
  const text = [
    "New Solar Entry lead",
    "",
    `Phone: ${record.phone}`,
    `Email: ${record.email}`,
    `Address: ${record.address}`,
    `Preferred consult: ${record.preferredDate} ${record.preferredTime}`,
    `Suitability: ${record.suitability ?? "n/a"}`,
    `Panels / kW: ${record.panelCount ?? "n/a"} / ${record.systemSizeKw ?? "n/a"}`,
    `Sun hours: ${record.sunHours ?? "n/a"}`,
    `Coords: ${record.latitude ?? "?"}, ${record.longitude ?? "?"}`,
    `Lead ID: ${record.id}`,
    `Created: ${record.createdAt}`,
  ].join("\n");

  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${text}</pre>`;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from =
      process.env.RESEND_FROM || "Solar Entry <onboarding@resend.dev>";
    await resend.emails.send({ from, to, subject, text, html });
    return { sent: true, method: "resend" };
  }

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return { sent: true, method: "smtp" };
  }

  return {
    sent: false,
    note: "No RESEND_API_KEY or SMTP_* configured — lead stored locally only.",
  };
}

export async function appendLeadToSheet(
  record: LeadRecord
): Promise<{ appended: boolean; note?: string }> {
  const sheetId =
    process.env.GOOGLE_SHEETS_ID ||
    "1NrsnBsFpWe-crmkhitidAEJGenlO3yyJ0xCiOFdBSmw";
  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!saJson) {
    return {
      appended: false,
      note: "GOOGLE_SERVICE_ACCOUNT_JSON not set — skipped Sheets append.",
    };
  }

  let credentials: object;
  try {
    credentials = JSON.parse(saJson) as object;
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          record.createdAt,
          record.id,
          record.phone,
          record.email,
          record.address,
          record.preferredDate,
          record.preferredTime,
          record.suitability ?? "",
          record.panelCount ?? "",
          record.systemSizeKw ?? "",
          record.sunHours ?? "",
          `${record.latitude ?? ""},${record.longitude ?? ""}`,
        ],
      ],
    },
  });

  return { appended: true };
}

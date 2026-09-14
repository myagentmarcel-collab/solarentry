# Solar Entry

Production-ready Next.js (App Router) + TypeScript + Tailwind site for **Solar Entry** (solarentry.com) — a clean, mobile-first residential solar screening funnel for Connecticut / US homeowners.

**Phone:** [203-818-3242](tel:+12038183242)  
**Lead email:** solarx28@gmail.com

## Features

1. **Address entry** — Google Places Autocomplete when `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set; otherwise a text field with server-side Geocoding (Google) or Nominatim fallback.
2. **Solar check** (server-only) — Google Solar API `buildingInsights:findClosest`, optional `dataLayers` RGB imagery (proxied), **actual panel rectangles** from `solarPotential.solarPanels`, Good/Fair/Poor classification, mid-config panel count / kW.
3. **Consult form** — phone, address (prefilled), email, preferred date/time; client + server validation.
4. **Lead pipeline** — persist to `data/leads.json`, email via Resend or SMTP, append to Google Sheets when credentials are set.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Stepped funnel |
| `/privacy` | Short privacy note |
| `/api/solar` | Address or lat/lng → building insights + panel layout |
| `/api/leads` | POST lead |
| `/api/health` | `{ ok: true }` |
| `/api/imagery` | Proxies Solar/Maps imagery (keeps keys server-side) |

## Setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Google Cloud

1. Create a Google Cloud project and enable billing.
2. Enable **Solar API**, **Geocoding API**, and (optional) **Places API**.
3. Create an API key → set `GOOGLE_MAPS_API_KEY` in `.env.local`.
4. For browser Places Autocomplete, set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (restrict by HTTP referrer). Prefer restricting the server key by IP / API.

### Email & Sheets (optional)

- **Resend:** set `RESEND_API_KEY` (and optionally `RESEND_FROM`).
- **SMTP:** set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, etc.
- **Sheets:** set `GOOGLE_SHEETS_ID` (default already set) and `GOOGLE_SERVICE_ACCOUNT_JSON` (full JSON string). Share the sheet with the service account email.

Without email/Sheets credentials, leads are still saved to `data/leads.json` and the API response notes what was skipped.

## Demo / smoke test

Use **3100 Main Street, Bridgeport, CT 06606** only to verify the solar check.  
**Never auto-submit this address as a lead.**

## Suitability thresholds

Documented in `src/lib/classify.ts`:

- **Good:** ≥20 panels, ≥1400 sun hours/yr, ≥40 m² array area  
- **Fair:** ≥10 panels, ≥1100 sun hours/yr, ≥20 m²  
- **Poor:** below Fair  

Never invent numbers on API failure — the UI shows an honest error + retry.

## Deploy (Vercel)

1. Push to GitHub: `https://github.com/myagentmarcel-collab/solarentry`
2. Import the repo in Vercel.
3. Add the same env vars from `.env.example`.
4. Deploy. Ensure `data/` is writable or switch persistence for serverless (e.g. DB) if you need durable storage on Vercel’s ephemeral filesystem.

```bash
npm run build
npm start
```

## Panel rendering

`RoofMap` converts each `solarPanels[]` entry (`center`, `orientationDegrees`, `panelHeightMeters`, `panelWidthMeters`) into a rotated lat/lng rectangle, projects corners into SVG viewBox space within imagery bounds, and overlays polygons on proxied aerial imagery.

## Scripts

- `npm run dev` — development server  
- `npm run build` — production build  
- `npm start` — serve production build  
- `npm run lint` — ESLint  

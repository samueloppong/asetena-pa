# Asetena Pa

Direct-from-owner rentals for Ghana. Next.js + Postgres + MinIO (Docker), before Supabase.

## Quick start (local web + Docker data services)

### 1. Start Postgres + MinIO

```bash
cp .env.example .env
npm install
npm run docker:up
```

> MinIO image is pulled from `quay.io` (Docker Hub may block anonymous pulls).

### 2. Migrate + seed

```bash
npm run db:generate
npx prisma migrate dev --name init
npm run db:seed
```

### 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Open on your phone (same Wi‑Fi)

1. On the PC, note your Wi‑Fi IP (e.g. `192.168.1.244`).
2. On your phone browser open `http://YOUR_WIFI_IP:3000` — **not** `localhost`, and not the `172.x` Docker/WSL adapter IPs.
3. If the page will not load, allow inbound TCP **3000** in Windows Firewall (run as Admin):

```bat
netsh advfirewall firewall add rule name="Asetena Pa Dev 3000" dir=in action=allow protocol=TCP localport=3000
```

Uploaded photos are served through `/api/v1/media/...` on the same host so they work on mobile.

**Demo accounts** (after seed):

| Email | Password | Role |
|-------|----------|------|
| `renter@sheltergh.local` | `Password123!` | renter (unverified) |
| `kwame@sheltergh.local` | `Password123!` | landlord (verified) |
| `ama@sheltergh.local` | `Password123!` | landlord (verified) |
| `admin@sheltergh.local` | `Password123!` | admin (verification queue) |

MinIO console: [http://localhost:9001](http://localhost:9001) (`sheltergh` / `sheltergh_minio_dev`).

## Full Docker stack (app + db + minio)

```bash
npm run docker:full
```

Web: [http://localhost:3000](http://localhost:3000). The web container runs migrations on startup.

## Core features in this phase

- Email/password registration + Auth.js sessions
- **Ghana Card chip KYC** (UK GOV-style NFC) for landlords via the Android app — Profile → Verify; gates chat, listing, reports, insights until verified
- **Manual ID upload** fallback (Ghana Card / passport / driver’s license + selfie) with **admin review queue** at `/admin/verifications`
- Verified badge in chat when the other party is ID-verified
- **Trust score** (identity + tenure + peer reviews) with badges on chat, profile, and listings
- Two-way **chat reviews** after messaging about a listing
- Property browse / detail from Postgres
- Landlord listing wizard with MinIO photo uploads + on-site GPS
- Favorites persisted per user
- Experiences nearby
- In-app landlord–renter chat (poll-based inbox + unread badge)
- Listing reports with auto-hide after repeated flags
- Crowdsourced neighborhood insights (power / water / safety)
- Ghana move-in cost calculator on property detail
- New-listing chime + “Just added” badge

### Ghana Card chip verification (Android NFC)

Same idea as UK GOV ID Check: unlock the National ID **chip**, prove the data is authentic, then match a live selfie.

1. Build/install the APK (`scripts/build-apk.bat` or `npx cap sync android` + Android Studio).
2. Sign in on the phone → **Profile** → **Verify Ghana Card (chip NFC)** (or open `/verify` in the app WebView).
3. Enter MRZ keys from the card (document number, DOB `YYMMDD`, expiry `YYMMDD`).
4. Hold the Ghana Card flat on the phone NFC area until BAC/PACE unlocks and DG1 + DG2 + SOD are read (jMRTD).
5. Capture a live selfie → submit. The server **re-scores** the payload and **rejects** anything without real NFC provenance (no browser mock path).

**Notes / production hardening**

| Layer | Status |
|-------|--------|
| BAC/PACE + DG1/DG2 read | Implemented (Android jMRTD) |
| Passive Authentication (SOD signature) | Implemented on-device |
| CSCA trust chain (NIA root) | Deferred — load Ghana CSCA/master list next |
| Active Authentication (DG15 challenge) | Stubbed when AA key present |
| Face match / 3D liveness SDK | Presence + score gate; swap in commercial SDK |
| Live NIA registry lookup | Format stub; wire NIA API when credentials available |

Browsers cannot talk to an ICAO chip — use the Asetena Pa Android app.

Seeded landlords are already verified. New sign-ups and the demo renter start **unverified**.

## Deferred

Supabase, Paystack/Hubtel, live NIA API + Ghana CSCA trust store, commercial face/liveness SDK, WebSocket realtime chat.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run docker:up` | Start db + MinIO |
| `npm run db:migrate` | Create/apply migrations |
| `npm run db:seed` | Seed Accra/Kumasi demo listings |
| `npm run docker:full` | Build and run all services including the Next.js app |

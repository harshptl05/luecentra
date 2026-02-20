# DMG Packaging, Signing, Notarization & Licensing

## Part A — DMG build, signing, notarization

### Prerequisites

1. **Apple Developer**
   - Developer ID Application certificate in Keychain (for distribution outside App Store).
   - App-specific password for notarization (or App Store Connect API key).
   - Bundle ID: `com.pickle.glass` (or your own, e.g. `com.yourcompany.pulse`).

2. **Environment variables** (for notarization)
   - `APPLE_ID` – Apple ID email
   - `APPLE_ID_PASSWORD` – App-specific password (not your main Apple password)
   - `APPLE_TEAM_ID` – Team ID from developer.apple.com

### Build and package (Electron)

```bash
# From repo root
npm run build:all
electron-builder --config electron-builder.yml --mac
```

Output: `dist/Glass-<version>.dmg` (and `.app` in `dist/mac-universal/`).

### Sign the app (if not done by electron-builder)

```bash
codesign --force --options runtime --deep --sign "Developer ID Application: YOUR NAME (TEAMID)" "dist/mac-universal/Glass.app"
codesign --verify --deep --strict --verbose=2 "dist/mac-universal/Glass.app"
```

### Notarize (already wired in electron-builder via notarize.js)

Set env vars then build:

```bash
export APPLE_ID=you@email.com
export APPLE_ID_PASSWORD=app-specific-password
export APPLE_TEAM_ID=YOUR_TEAM_ID
npm run build
```

Or use `notarytool` manually after building:

```bash
ditto -c -k --keepParent "dist/mac-universal/Glass.app" "Glass.zip"
xcrun notarytool submit "Glass.zip" --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" --password "$APPLE_ID_PASSWORD" --wait
xcrun stapler staple "dist/mac-universal/Glass.app"
```

### Create DMG (if creating manually)

```bash
mkdir -p dmg_root
cp -R "dist/mac-universal/Glass.app" dmg_root/
hdiutil create -volname "Pulse" -srcfolder dmg_root -ov -format UDZO "Pulse.dmg"
```

### Upload DMG for delivery

Upload the DMG to S3/R2 or your storage. Record the object key (e.g. `releases/Pulse-1.0.0.dmg`). Insert a row into the licensing API `downloads` table:

```sql
INSERT INTO downloads (version, dmg_storage_key) VALUES ('1.0.0', 'releases/Pulse-1.0.0.dmg');
```

Set `DMG_PUBLIC_URL` or `STORAGE_PUBLIC_BASE` so the signed download URL redirects to the real file (e.g. `https://your-bucket.s3.amazonaws.com` or a CDN).

---

## Part B — Licensing backend & dashboard

### Licensing API (`licensing_api/`)

- **Stack:** Node, Express, Postgres, JWT, Stripe.
- **Routes:** `/auth/*`, `/billing/*`, `/device/*`, `/ai/answer`, `/downloads/signed-url`, `/webhooks/stripe`.

### Run locally

1. **Postgres**
   ```bash
   docker compose -f docker-compose.licensing.yml up -d
   ```

2. **Env**
   ```bash
   cp licensing_api/.env.example licensing_api/.env
   # Edit .env: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, Stripe keys, STRIPE_PRICE_ID
   ```

3. **Migrate**
   ```bash
   cd licensing_api && npm install && npm run db:migrate
   npm run db:seed   # optional: adds placeholder download row
   ```

4. **Start API**
   ```bash
   npm run dev
   ```
   Listens on port 4000.

### Dashboard (`pulse_dashboard/`)

- **Stack:** Next.js 14, TypeScript.
- **Pages:** `/` (home), `/login`, `/register`, `/dashboard` (billing + download).

```bash
cd pulse_dashboard
cp .env.local.example .env.local
# Set NEXT_PUBLIC_LICENSING_API_URL=http://localhost:4000
npm install && npm run dev
```
Runs on port 3001. Use `http://localhost:3001` for login, upgrade, and download.

### Stripe

1. Create a **Product** and **Price** (recurring). Set `STRIPE_PRICE_ID` in `licensing_api/.env`.
2. Webhooks: add endpoint `https://your-api-host/webhooks/stripe`, events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`. Set `STRIPE_WEBHOOK_SECRET` in `.env`.
3. For local testing use Stripe CLI: `stripe listen --forward-to localhost:4000/webhooks/stripe`.

---

## Part C — Device binding (Electron app)

- **Device ID:** Generated (UUID) on first run, stored in macOS Keychain via `keytar` (service `com.pickle.glass`, account `pulse_device_id`).
- **Activation:** App calls `POST /device/activate` with `Authorization: Bearer <access_token>` and body `{ device_id, device_name }`. Backend allows at most `MAX_DEVICES_PER_USER` (default 1) per user.
- **Tokens:** Refresh token stored in Keychain; access token kept in memory and refreshed when needed.

### Enabling licensing in the app

Set `LICENSING_API_URL` (or `PULSE_LICENSING_API_URL`) when starting the app so it talks to your licensing API (e.g. `https://api.yourproduct.com`). The in-app licensing APIs are exposed as `window.api.common.licensing` (see `src/preload.js`):

- `getDeviceId()`, `ensureActivated()`, `loginWithCredentials(email, password)`, `loginWithTokens(accessToken, refreshToken)`, `logout()`, `isLicensed()`, `getAccessToken()`.

You can require login on first launch by checking `isLicensed()` and showing a licensing login screen (email/password or redirect to dashboard and deep-link tokens) before allowing use of AI features.

---

## Part D — Gating AI usage

- **Option A (recommended):** App does **not** call OpenAI/Deepgram directly. It calls your licensing backend (e.g. `POST /ai/answer`). Backend validates JWT + device + subscription, then proxies to the provider and returns the response.
- **Option B:** App calls your backend for a “license check” (e.g. `GET /billing/status`); if `premium_active`, app proceeds to call AI providers from the client (current architecture). Option A is more secure and prevents sharing.

The licensing API includes an example `POST /ai/answer` that enforces auth + device + subscription; you can replace the echo with a real proxy to OpenAI/Deepgram.

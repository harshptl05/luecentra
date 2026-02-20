# Pulse Licensing API

Backend for subscription billing, device binding, and gated access. Used by the Pulse dashboard and the Electron app.

## Stack

- Node.js, Express
- Postgres (users, subscriptions, devices, downloads, refresh_tokens)
- JWT (access + refresh)
- Stripe (Checkout, webhooks)

## Setup

1. **Postgres**
   - From repo root: `docker compose -f docker-compose.licensing.yml up -d`
   - Or use any Postgres 14+ and set `DATABASE_URL`.

2. **Environment**
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars).
   - For billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`.
   - Optional: `DOWNLOAD_BASE_URL`, `MAX_DEVICES_PER_USER` (default 1).

3. **Database**
   ```bash
   npm install
   npm run db:migrate
   npm run db:seed   # optional: adds one placeholder download row
   ```

4. **Run**
   ```bash
   npm run dev
   ```
   Server listens on `PORT` (default 4000).

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/register | - | Register (email, password) |
| POST | /auth/login | - | Login |
| POST | /auth/refresh | - | New access token from refresh_token |
| GET | /auth/me | Bearer | Current user |
| GET | /billing/status | Bearer | Subscription status, premium_active |
| POST | /billing/create-checkout-session | Bearer | Stripe Checkout URL for subscription |
| GET | /billing/portal-session | Bearer | Stripe Customer Portal URL |
| POST | /webhooks/stripe | Stripe-Signature | Stripe webhooks (raw body) |
| POST | /device/activate | Bearer | Register this device (body: device_id, device_name) |
| GET | /device/list | Bearer | List user's devices |
| GET | /downloads/signed-url | Bearer | Short-lived download URL (premium only) |
| GET | /downloads/serve/:id | query expires | Serve/redirect DMG (MVP: optional redirect) |
| POST | /ai/answer | Bearer + X-Device-ID | Example gated AI endpoint (echo) |

## Stripe webhook (local)

```bash
stripe listen --forward-to http://localhost:4000/webhooks/stripe
```
Use the printed `whsec_...` as `STRIPE_WEBHOOK_SECRET` in `.env`.

## Downloads

- Insert rows into `downloads` (version, dmg_storage_key). Signed URL endpoint returns a time-limited URL to `/downloads/serve/:id?expires=...`.
- For real file delivery, set `DMG_PUBLIC_URL` or `STORAGE_PUBLIC_BASE` so `/downloads/serve/:id` redirects to your CDN or S3.

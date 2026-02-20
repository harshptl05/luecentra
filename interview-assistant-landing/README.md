# Interview Assistant — Landing Page

Bypassify-style marketing site for **Interview Assistant** (ethical career prep tool). Built with Next.js 14 (App Router), TypeScript, and Tailwind CSS.

## Sections

- **Hero** — Headline, short description, CTAs
- **Features** — 6 feature cards
- **How it works** — 3 steps (Join Discord → Choose plan → Start practicing)
- **Pricing** — Basic ($29/mo) and Pro ($69/mo), each with **“Join our Discord to Purchase”** button
- **FAQ** — Accordion
- **Footer** — Links and copyright

All purchase CTAs link to your Discord invite URL (set via env var).

## Tech

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn-style UI (Card, Button, Badge, Accordion in `components/ui/`)

## Run locally

```bash
npm install
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/YOURINVITE
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy on Vercel

1. Push this folder to a Git repo (or use the root that contains `interview-assistant-landing`).
2. In [Vercel](https://vercel.com), **Import** the repo.
3. Set **Root Directory** to `interview-assistant-landing` (if the repo root is the monorepo root).
4. Add environment variable:
   - **Name:** `NEXT_PUBLIC_DISCORD_INVITE_URL`
   - **Value:** `https://discord.gg/YOURINVITE` (your real Discord invite link)
5. Deploy.

Build command and output directory can stay as default (`next build`, `.next`).

## Env var

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_DISCORD_INVITE_URL` | Discord invite URL used for all “Join Discord to Purchase” and “Join Discord” buttons. Example: `https://discord.gg/XXXX` |

Without it, the app falls back to `https://discord.gg/YOURINVITE` (placeholder).

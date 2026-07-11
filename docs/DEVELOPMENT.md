# Development guide — Clique platform

This is the engineering setup for the **app** (mobile + API). The devotee product
is one Expo/React-Native codebase in [`apps/mobile`](../apps/mobile) that targets
**Android, iOS, and Web** — run the web view with `cd apps/mobile && npm run web`
(http://localhost:8081). Cloud builds: [DEPLOY-MOBILE.md](DEPLOY-MOBILE.md).

## Monorepo layout
```
apps/
  api/        NestJS + Prisma backend
  mobile/     Expo (React Native) app
packages/
  shared/     shared TS types, enums, zod schemas, money helpers
infra/        docker-compose (Postgres, Redis, LiveKit), configs
```
Workspaces are managed with **pnpm** + **Turborepo**.

## Prerequisites
- Node 20 (`.nvmrc`), pnpm 9 (`corepack enable`)
- Docker Desktop (for Postgres/Redis/LiveKit)
- For mobile: Expo Go app on a device, or Android Studio / Xcode

## First-time setup
```bash
# 1. install all workspace deps
pnpm install

# 2. start infra (Postgres + Redis + LiveKit)
pnpm infra:up

# 3. configure env
cp .env.example .env
cp apps/api/.env.example apps/api/.env   # fill Razorpay test keys

# 4. set up the database
pnpm --filter @clique/api prisma:generate
pnpm --filter @clique/api prisma:migrate   # creates tables

# 5. build shared package (api/mobile import it)
pnpm --filter @clique/shared build
```

## Run
```bash
pnpm --filter @clique/shared build   # build shared first (apps import its dist)
pnpm --filter @clique/api dev         # API at http://localhost:3000/api/v1
pnpm --filter @clique/mobile dev      # Expo dev server (press a=Android, i=iOS)
```
Health check: `GET http://localhost:3000/api/v1/health`.

### Running the mobile app
- Install **Expo Go** on your phone, run `pnpm --filter @clique/mobile dev`, and scan the QR code (phone + PC on the same Wi-Fi). Or press `a` (Android emulator) / `i` (iOS simulator).
- The app launches **Splash → Welcome (logo, purpose, accept Terms, Register Now) → Register (OTP) → Home tabs**.
- The mobile app talks to the API via `extra.apiBaseUrl` in `app.json` (default `http://localhost:3000/api/v1`). On a physical device, change `localhost` to your PC's LAN IP.

### Monorepo notes (important)
- `@clique/shared` is consumed as **built JS** (`dist/`), so run its `build` once (and after changing it). `turbo dev`/`turbo build` do this automatically via `dependsOn: ["^build"]`.
- `apps/mobile/metro.config.js` makes Metro resolve the workspace root + shared package under pnpm — don't delete it.
- **`.npmrc` sets `node-linker=hoisted`** — Expo/Metro need a flat `node_modules` to resolve transitive deps (`expo-modules-core`, `@babel/runtime`, …). Don't switch back to pnpm's isolated layout or web/native bundling breaks. After any install, run `pnpm --filter @clique/api prisma:generate`.

### Supabase (registration + login)
The mobile app uses **Supabase** directly for email/password auth + a `profiles`
table. Set it up once per the guide in [`supabase/README.md`](../supabase/README.md):
create a project → run `supabase/schema.sql` → disable email confirmation →
copy URL + anon key into `apps/mobile/.env` (see `apps/mobile/.env.example`).
Without those env vars the app runs in demo mode (no data saved).

### View the app in a PC browser (no emulator)
```bash
pnpm --filter @clique/mobile dev   # then press 'w'
# or directly:
pnpm --filter @clique/mobile exec expo start --web
```
Opens at `http://localhost:8081` (or the next free port). The live‑video screen is a UI shell on web; everything else renders.

## What's implemented (scaffold level)
- **Auth:** OTP request/verify (dev OTP is logged to the API console), JWT issue, register.
- **Hosts:** discovery list, create (PENDING → admin approval), profile + occasions.
- **Occasions:** create (+ first instance), upcoming feed, booking, access checks (free/subscriber/paid).
- **Payments:** Razorpay order creation, signature-verified webhook, ledger split (gross/commission/host-net).
- **Realtime:** LiveKit token issuance gated by access rules; Socket.IO gateway for chat/reactions/raise-hand.
- **Notifications:** in-app inbox + broadcast fan-out to followers/subscribers.
- **Admin:** host verification, commission config, platform metrics, role-guarded.
- **Mobile:** Splash, **Welcome (in-app landing: logo, purpose, accept-T&C gate, Register Now)**, **Terms**, Register, OTP, Home, Rituals, Ritual booking, Live meeting (UI shell), Host profile, Inbox, Subscribe — wired to the API client, themed per branding, i18n in en/hi/te.

## Known TODOs (next vertical slices)
- Wire `@livekit/react-native` into `LiveMeetingScreen` (currently a presentational shell).
- SMS gateway for real OTP delivery (MSG91 / Gupshup).
- Razorpay **Subscriptions** + **Route** payouts (only orders/webhooks scaffolded).
- BullMQ workers for push delivery + recurring-occasion materialization.
- Raw-body middleware for the Razorpay webhook signature (see comment in `payments.controller.ts`).
- Auth on the WebSocket handshake.
- Tests (Jest) — none yet.

## Notes
- **Money** is always integer **paise**; use helpers in `@clique/shared` (`rupeesToPaise`, `splitEarnings`).
- Dependency **versions** are pinned to sensible ranges; run `pnpm install` and, for mobile, `npx expo install --fix` to align native deps with the installed Expo SDK.
- This is a **scaffold**: modules compile and express the architecture, but several flows are stubbed (marked with `TODO`). It is the skeleton for Phase 1 in [ROADMAP.md](ROADMAP.md), not a finished app.

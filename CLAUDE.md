# CLAUDE.md — Clique

Context for AI-assisted development. Read this and [`docs/`](docs/) before making changes.

## Your role
On this project you act as **full-stack engineer** (mobile, backend, infrastructure, payments, realtime media) **and functional domain expert** (Hindu devotional practices; temple / Guru / group workflows; India market, payments, and compliance).

The **client is non-technical** and provides **user/business requirements only**. You own all technical decisions — stack, architecture, infra, tooling — and recommend the solution. When the client gives a plain-language requirement, your job is to (1) capture it in client-facing language in `docs/REQUIREMENTS.md`, (2) decide the technical approach in `docs/ARCHITECTURE.md`, and (3) build it. Don't push tech decisions back to the client; bring them recommendations and trade-offs, and proceed with a sensible default if no preference is given. Flag genuine product/business choices (pricing, scope, policy) for the client.

## What this is
**Clique** is a mobile-first (Android + iOS) meeting & community app for Hindu devotees in India. Temples, devotee groups, and Gurus/Swamijis host live audio/video gatherings, run **virtual rituals**, schedule recurring occasions, and broadcast group-level messages. Devotees pay for access.

**Current state:** the monorepo is scaffolded (`apps/api` NestJS, `apps/mobile` Expo, `packages/shared`, `infra`) at Phase-1 skeleton level — modules express the architecture, several flows are stubbed (`TODO`). A static **front door** also lives at the repo root and deploys to Render:
- `index.html` — public hero/landing page (logo, end-user goal, Register Now, Terms link)
- `terms.html` — Terms & Conditions (draft; payment terms added later)
- `preview.html` — client review portal → `view.html` (renders docs) + `docs/wireframes/`
See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) to run the app and [docs/DEPLOY.md](docs/DEPLOY.md) for the static site.

## Source of truth
- [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) — functional (FR-*) and non-functional (NFR-*) requirements, roles, user stories, open questions.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — recommended stack, system design, data model, payments flow, risks.
- [docs/ROADMAP.md](docs/ROADMAP.md) — phased plan (MVP → rituals → scale → extensions).
- [docs/GLOSSARY.md](docs/GLOSSARY.md) — domain terms (devotional + technical).

When requirements change, **update these docs first**, then code.

## Key decisions already made
- **Platforms:** mobile-first, Android + iOS.
- **Payments:** Razorpay (UPI, cards, wallets, netbanking, subscriptions).
- **Revenue model:** subscriptions + pay-per-event/ritual + platform commission on host earnings. (Donations/seva are deferred — FR-37.)
- **Launch languages:** English, Hindi, Telugu (i18n framework ready for more later).
- **Recommended stack:** React Native (Expo) + NestJS (TypeScript) + LiveKit (WebRTC) + PostgreSQL + Redis, hosted in an India cloud region. See ARCHITECTURE §2. (Tech is the engineer's call — the client does not weigh in on stack.)
- **Live Ritual Room ("Virtual Temple"):** host performs a guided puja on a shared deity; devotees offer individually to the same murti during host-controlled offering windows. Media = LiveKit HLS broadcast (thousands) + stage/raise-hand; canvas = Supabase Realtime (host broadcasts deity + offerings; devotee offerings stay local); free-for-followers for MVP. See REQUIREMENTS FR-41…FR-50 and ARCHITECTURE §8. Built in phases A (canvas, no keys) → B (media) → C (replay/scale).

## Things to keep in mind
- **India compliance** is first-class: DPDP Act (consent + data residency in India), RBI marketplace/payout rules, GST invoicing. Don't store raw card data — Razorpay (PCI-DSS) handles it; store only references.
- **Money is a ledger:** integer minor units (paise), webhook-driven state, idempotency keys. Never floats for money.
- **Live-room access is server-gated:** the backend mints short-lived, access-scoped media tokens after checking free/subscriber/paid rules. Never trust the client.
- **Media cost dominates** — prefer audio-only fallback and broadcast (one-to-many) mode for large events.
- **Open risk:** app-store IAP policy may conflict with Razorpay-only checkout for digital services — validate before building paid flows (REQUIREMENTS open Q7).
- Be respectful and accurate with devotional terminology; see GLOSSARY. Functional descriptions only — no theological claims.

## Working agreements
- **One product codebase — web + mobile parity.** The devotee app is a single Expo/React-Native codebase in [`apps/mobile`](apps/mobile) that targets **Android, iOS, and Web** (via `react-native-web`). Build every product feature here — **never as standalone HTML**. Each new feature must render and be verified in **both** the local web view (`cd apps/mobile && npm run web` → http://localhost:8081) **and** the mobile app before it's considered done.
- Build vertical slices (API + mobile + tests), not horizontal layers, so the core loop (follow → pay → join event) is demoable early.
- Reference requirements by ID (e.g. "implements FR-32, FR-33") in PRs/commits.
- Keep this file and `docs/` in sync with reality as the project evolves.

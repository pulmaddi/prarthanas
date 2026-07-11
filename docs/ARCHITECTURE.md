# Architecture — Clique

**Status:** Proposed (planning phase). This is a recommendation to validate with the client, not a built system.
**Last updated:** 2026-06-22

> **Current build note (Ishta app):** to move fast, the mobile app currently talks to **Supabase** directly (`@supabase/supabase-js`) for registration/login (Supabase Auth — email/password **and Google OAuth**, the latter via a system-browser flow that deep-links back to `ishta://auth-callback`) and stores user data in Supabase Postgres (`profiles` table, Row-Level Security). Supabase is hosted Postgres, so this is consistent with the data model below. The **NestJS API** (`apps/api`, Prisma) is scaffolded and will sit in front of the same Postgres for server-gated concerns (payments, live-room media tokens) — see §5–6. SMS/OTP auth is deferred. Setup: [`supabase/README.md`](../supabase/README.md).

---

## 1. Constraints that shape the design

- **Mobile-first, India** — Android + iOS, low-bandwidth resilience, regional languages (launch: English, Hindi, Telugu; i18n framework for more).
- **Large live audiences** — broadcast events up to 10k+ concurrent (NFR-1); media cost is the dominant spend.
- **Marketplace payments** — collect from devotees, deduct platform commission, pay out to hosts; India compliance (DPDP, GST, RBI).
- **Multi-role** — devotees, three host types, co-hosts/sevaks, admins, with RBAC.

---

## 2. Recommended stack

| Layer | Choice | Why |
| --- | --- | --- |
| **Mobile app** | **React Native + Expo** (TypeScript) | One codebase for Android + iOS, large talent pool in India, OTA updates, mature WebRTC SDKs. |
| **Backend API** | **Node.js + NestJS** (TypeScript) | Shared language with mobile, structured/modular, good for RBAC + REST/WebSocket. |
| **Realtime media** | **LiveKit** (self-host or cloud) | Open-source SFU built for scale; supports interactive rooms + large broadcasts (and egress for recording). Alternative: Agora/100ms (managed, faster start, higher per-minute cost). |
| **Realtime messaging** | WebSocket gateway (NestJS) + Redis pub/sub | In-room chat, reactions, presence, raise-hand. |
| **Primary DB** | **PostgreSQL** | Relational core (users, hosts, occasions, subscriptions, payments, ledger). Strong consistency for money. |
| **Cache / queues** | **Redis** + a job queue (BullMQ) | Sessions, rate limits, reminders, payout jobs, notification fan-out. |
| **Object storage** | S3-compatible (AWS S3 / region in India) | Recordings, media, KYC docs (encrypted). |
| **Search** | Postgres FTS first; OpenSearch later | Host/occasion discovery. |
| **Notifications** | FCM (Android) + APNs (iOS) + in-app inbox | Reminders and broadcasts. |
| **Payments** | **Razorpay** — Checkout, Subscriptions, Route (split/payouts) | India-native: UPI, cards, netbanking, wallets, recurring mandates, marketplace payouts. |
| **Infra** | Containers (Docker) on a cloud with **India region** (AWS ap-south-1 / equivalent), IaC | Data residency, scale, managed Postgres/Redis. |
| **Observability** | OpenTelemetry, centralized logs/metrics, Sentry | NFR-9. |

> If time-to-market trumps cost, start media on a **managed provider (Agora/100ms)** and migrate to self-hosted LiveKit once volume justifies it. Documented as a roadmap decision.

---

## 3. High-level system

```
                 ┌─────────────────────────────────────────────┐
   Mobile app    │                  Backend (NestJS)            │
 (React Native)  │                                             │
      │          │  Auth/OTP   Hosts/Occasions   Payments/Ledger│
      ├── REST ──►│  RBAC       Subscriptions     Payouts        │
      │          │  Discovery  Notifications      Admin/Moderation│
      ├── WS ────►│  Realtime gateway (chat, reactions, presence)│
      │          └───────┬───────────────┬──────────────┬───────┘
      │                  │               │              │
      │            PostgreSQL          Redis         Job queue
      │           (core + ledger)   (cache/pubsub)   (BullMQ)
      │
      └── media ──►  LiveKit SFU  ──►  Egress/recording ──► Object storage (S3, India)

  External:  Razorpay (Checkout / Subscriptions / Route)   FCM / APNs   Festival calendar source
```

- **Media path is separate from the API.** The backend issues short-lived, access-scoped **room tokens**; the app connects to LiveKit directly for low latency. Token issuance enforces access rules (free/subscriber/paid).
- **Money is a ledger.** All payments, commission, and payouts are recorded in an append-only ledger in Postgres; Razorpay webhooks are the source of truth for settlement, reconciled idempotently.

---

## 4. Core data model (initial sketch)

Entities (not exhaustive):

- **User** — id, phone, email?, name, language, location, roles[].
- **Host** — id, type (temple|group|guru), profile, verification/KYC status, payout account, commission_rate.
- **HostMember** — links users to a host with a role (owner, co-host/sevak, moderator).
- **Occasion** — id, host_id, type, access (free|subscriber|paid), price?, recurrence, start/end, format (interactive|broadcast), festival_tag?.
- **OccasionInstance** — concrete dated instance of a recurring occasion.
- **Ritual** — occasion subtype with steps[], offering options, sankalpa schema.
- **Booking / Ticket** — user_id, occasion_instance_id, access grant, sankalpa data?, status.
- **SubscriptionTier** / **Subscription** — host tiers; a user's active subscription + renewal state.
- **Payment** — provider refs (Razorpay order/payment id), amount, GST, status; idempotency key.
- **LedgerEntry** — double-entry style: gross, commission, host_net, refunds.
- **Payout** — host settlement batch + status.
- **Room** — live session for an occasion instance; recording ref.
- **Broadcast / Announcement** — host message to followers/segment.
- **Notification** — per-user delivery + read state.
- **Follow** — user ↔ host.

Money fields use integer minor units (paise) and a currency; never floats.

---

## 5. Access control & live-room gating

1. Devotee requests to join an occasion instance.
2. Backend checks access: free → allow; subscriber-only → active subscription; paid → valid booking/ticket.
3. On success, backend mints a **LiveKit access token** (room name, identity, role grants, short TTL).
4. App joins LiveKit with the token. Co-host/host capabilities (publish, moderate) are encoded in the grant.

RBAC is enforced server-side on every API and at token issuance — never trust the client.

---

## 6. Payments flow (Razorpay)

- **Pay-per-event:** create Razorpay order → app completes Checkout → webhook confirms → backend grants booking + ledger entry (gross/commission/host_net).
- **Subscription:** create plan + subscription with mandate → recurring charges via webhooks → access reflects active/cancelled/expired state.
- **Payouts:** use Razorpay **Route** to split or transfer host_net to verified host accounts on a schedule; reconcile against the ledger.
- **Idempotency & webhooks:** all state transitions driven by verified webhooks with idempotency keys; Razorpay (PCI-DSS) handles card data — Clique stores only references.
- **Tax:** GST computed and shown on invoices/receipts per Indian rules.

---

## 7. Key risks & decisions to track

| Risk / decision | Note |
| --- | --- |
| **App-store IAP policy** | Apple/Google may require in-app purchase (and their cut) for digital services. Selling event/ritual access via Razorpay-only may conflict with store rules. **Validate early**; may need IAP for app-store builds (see REQUIREMENTS open Q7). |
| **Media cost & scale** | Live minutes/egress dominate cost. Mitigate with audio-only fallback, recording controls, and broadcast (one-to-many) mode for big events. Decide managed vs. self-hosted LiveKit. |
| **Compliance** | DPDP (consent, residency), RBI marketplace/payout rules, GST invoicing. Engage legal/CA early. |
| **KYC for hosts** | Required before payouts; gates host go-live. |
| **Recording consent & retention** | Participant consent + retention/storage policy unresolved (open question). |
| **Festival calendar source** | Need a reliable, regionally-correct panchang/festival data source. |
| **Concurrency targets** | NFR-1 numbers are estimates; load-test before committing media tier sizing. |

---

## 8. Live Ritual Rooms ("Virtual Temple")

Implements FR-41…FR-50. Two **independent one-to-many streams** flow from the host — media and canvas — which lets the room scale to thousands cheaply.

### 8.1 Media — "stage" + "audience" tiers
- **Stage** = a low-latency LiveKit (WebRTC) room: the host plus any devotee currently granted the floor (raise-hand, FR-48). Small and cheap.
- **Audience** = thousands watch the stage via **LiveKit Egress → HLS over CDN** (~5–10s latency, listen/watch only — FR-47). Native plays HLS via `expo-av`; web via `hls.js`.
- **Raise-hand** promotes a devotee from Audience (HLS) to Stage (WebRTC publisher, mic only); their audio is mixed into the egress for the audience. Demote returns them to HLS.
- Backend mints access-scoped LiveKit tokens / signed playback per §5. Host grant: publish video+audio+data; devotee grant: subscribe + (audio only when promoted).

### 8.2 Canvas — moderator broadcast over Supabase Realtime
The audience is **not** in the WebRTC room, so LiveKit data messages can't reach them. Canvas sync therefore uses **Supabase Realtime Broadcast**, one channel per meeting:
- The host broadcasts only: **deity placement** (FR-42), **the host's own offerings** (FR-43), **offering-window open/close** (FR-44), **clear**, and the **anonymous tally** (FR-46).
- **Devotee offerings never touch the network** (FR-45) — each devotee decorates their own local copy of the shared deity. Only a lightweight "+1 flower" increment is sent to drive the aggregate tally.
- **Late-join snapshot:** a new joiner announces "hello" on the channel; the host's client replies with the current state (deity + host offerings so far + window state). No backend state store needed for v1 (the host is always present). Move to Redis/DB later for host-independent replay.
- **Coordinate model (FR-50):** offerings are anchored in the **deity's local space**, so a host offering "at the feet" maps to the same relative spot on every device, independent of screen size. This is the trick that makes shared offerings align.

### 8.3 Rendering & interaction
- **`@shopify/react-native-skia`** for the canvas (60fps particles/paint on native **and** Expo web); ports the existing single-user `PoojaScreen` effects (aarti orbit, agarbathi smoke, flowers, turmeric, saffron).
- **`react-native-gesture-handler`** for drag-and-drop: deity is a draggable/resizable sprite; accessories drag from a palette tray onto the murti and animate into place.

### 8.4 Data model additions
- **Meeting** (extends `host_meetings`): `status` (scheduled|live|ended), `livekit_room`, `deity_id`/`deity_image`, `hls_url`, `started_at`, `ended_at`.
- **SpeakerRequest** — raise-hand queue (meeting_id, user_id, status).
- No per-offering persistence in v1 (offerings are ephemeral); optional post-event summary + recording→VOD in a later phase.

### 8.5 Latency note
Canvas events arrive near-instant while HLS video is ~8s behind, so the host's on-screen gesture and the broadcast effect can be slightly out of sync — acceptable for a large broadcast. If needed, timestamp canvas events to the media timeline to align (deferred).

### 8.6 Phasing
- **Phase A (MVP, web-demoable, no LiveKit keys):** drag-drop deity canvas + palette + offering windows + Supabase Realtime sync + anonymous tally. Media stubbed.
- **Phase B:** LiveKit media (HLS audience + stage), raise-hand promotion, participant count, mute/remove.
- **Phase C:** recording→VOD replay, canvas/HLS time-alignment, self-hosted media for cost.

### 8.7 Dependencies / decisions
- **LiveKit Cloud, Mumbai region** recommended (managed egress/HLS, India residency) — needs an account + API keys from the client; self-host later to cut cost (NFR-10).
- **`@livekit/react-native` requires a native dev build** (won't run in Expo Go — needs `expo prebuild` + custom dev client). Web audience (HLS) runs in-browser.

---

## 9. Repository shape (proposed, when build starts)

```
clique/
├── docs/                # this documentation
├── apps/
│   ├── mobile/          # React Native (Expo) app
│   └── api/             # NestJS backend
├── packages/
│   └── shared/          # shared TS types, validation, constants
└── infra/               # IaC, deployment, env config
```

A monorepo (pnpm/Turborepo) lets mobile and API share TypeScript types (e.g. occasion/payment schemas). To be confirmed at build kickoff.

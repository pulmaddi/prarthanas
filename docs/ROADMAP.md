# Roadmap — Clique

**Status:** Proposed. Phases are scoped to validate value early and defer cost/complexity. Refine with the client.
**Last updated:** 2026-07-02

---

## Phase 0 — Foundation & validation (pre-build)
- Confirm open questions in [REQUIREMENTS.md §6](REQUIREMENTS.md#6-open-questions--assumptions).
- Validate app-store IAP policy vs. Razorpay-only checkout (key risk).
- Engage legal/CA on DPDP, RBI marketplace/payout, and GST.
- Decide media provider: managed (Agora/100ms) vs. self-hosted LiveKit.
- Pick a small pilot set of hosts (1–2 temples + 1 Guru) to design around.

## Phase 1 — MVP (prove the core loop)
**Goal:** A devotee can follow a host, pay, and attend a live event; a host can schedule and broadcast.
- OTP auth, profiles, RBAC.
- Host onboarding + admin KYC approval (manual review ok).
- Discovery: search/browse + follow.
- Occasions: create one-off + recurring; free / subscriber / pay-per-event.
- Live rooms: **broadcast mode** (host media, large audience) + chat + reactions; audio-only fallback.
- Payments: Razorpay pay-per-event + subscriptions; ledger; basic receipts/GST.
- Notifications: occasion reminders + host broadcasts (push + in-app inbox).
- Localization: UI in **English, Hindi, Telugu** from launch (i18n framework in place).
- Admin console (minimal): host approval, commission config, refunds.

## Phase 2 — Virtual rituals & interactivity
- **Live Ritual Room ("Virtual Temple")** — the signature experience (FR-41…FR-50, ARCHITECTURE §8). See its own sub-phasing below.
- Ritual occasions with steps, **sankalpa** capture, digital offerings (free + paid add-ons).
- Digital **prasad/blessing** delivery.
- Interactive room mode: raise-hand, promote-to-speaker, co-host/sevak moderation.
- Session recording + published replays with access gating.
- Host earnings dashboard + scheduled **payouts** (Razorpay Route).

### Live Ritual Room ("Virtual Temple") — sub-phases
A host performs a live, guided puja on a shared deity canvas; devotees watch/listen and make their own offerings to the same murti (FR-41…FR-50). Delivered in three slices so the unique value ships before the expensive media tier:
- **Phase A (canvas-first, web-demoable, no LiveKit keys):** drag-drop deity placement + accessory palette (aarti, flowers, kumkuma, chandan, saffron, water/agarbathi) with existing PoojaScreen effects; host-controlled **offering windows**; **Supabase Realtime** sync of the host's deity + offerings; **anonymous collective tally**; devotee offerings render locally. Media pane stubbed. Go-live / join flow.
- **Phase B (media):** LiveKit **HLS broadcast** to the audience (thousands) + low-latency **stage**; **raise-hand** promote/demote; participant count; mute/remove. Requires LiveKit Cloud (Mumbai) keys + a native dev build.
- **Phase C (polish/scale):** recording → **VOD replay**; canvas/HLS **time-alignment**; self-hosted media for cost.

## Phase 3 — Scale, localization & engagement
- Additional regional languages beyond launch set (Tamil, Kannada, Marathi, Bengali, Gujarati) + festival calendar.
- Scale media tier for 10k+ concurrent broadcasts; load testing against NFR-1.
- Richer host feed (media, bhajans, documents), subscriber segments for broadcasts.
- Ratings/reviews, improved discovery (OpenSearch).
- Observability hardening, cost controls on media/storage.

## Phase 4 — Extensions (post-PMF)
- Voluntary **seva/donations** (FR-37).
- Physical prasad fulfilment / logistics.
- White-label/branded presence for large temples.
- Web companion app; additional modules (e.g. astrology) as separate efforts.

---

## Suggested first build steps (when Phase 1 starts)
1. Stand up the monorepo (`apps/mobile`, `apps/api`, `packages/shared`, `infra`).
2. Auth (OTP) + user/profile + RBAC scaffolding.
3. Host + Occasion models and CRUD; admin approval.
4. Razorpay integration behind a payments module + ledger (with webhooks/idempotency).
5. Live broadcast room via chosen media provider with token-gated access.
6. Notifications + reminders.
7. Thin but complete vertical slice: follow → pay → join a live event end-to-end.

> Each item should land as a vertical slice (API + mobile + tests) rather than a horizontal layer, so the core loop is demoable as early as possible.

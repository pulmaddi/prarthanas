# Requirements — Clique

**Product:** A meeting and community app for Hindu devotees in India. Temples, devotee groups, and Gurus/Swamijis host live audio/video gatherings, conduct virtual rituals, run recurring occasions, share information, and broadcast group-level messages. Participants pay for access.

**Last updated:** 2026-06-22 · **Phase:** Requirements

> **Engagement model.** The client is **non-technical** and supplies **user/business requirements only**. All technical decisions — stack, architecture, infrastructure, tooling — are owned and recommended by the engineering side. On this project, the AI assistant acts as both **full-stack engineer** (mobile, backend, infra, payments, media) and **functional domain expert** (Hindu devotional practices, temple/Guru/group workflows, India market & compliance), translating plain-language requirements into a working product. Requirements in this doc are written in client-facing, non-technical language; the "how" lives in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Goals & non-goals

### Goals
- Let devotees discover and follow temples, groups, and Gurus, and join their live events.
- Provide reliable, large-audience audio/video gatherings (satsang, pravachan, bhajan, darshan, Q&A).
- Offer guided, interactive **virtual rituals** (puja/aarti/havan) with sankalpa, offerings, and prasad/blessing follow-up.
- Give hosts tools to schedule recurring occasions, share media/announcements, and broadcast group-level messages.
- Monetize via **subscriptions**, **pay-per-event/ritual**, and **platform commission** on host earnings, using India-native payments (Razorpay).
- Be mobile-first for India (Android + iOS), resilient on low-bandwidth networks and regional languages.

### Non-goals (initial release)
- Physical goods fulfilment/logistics (physical prasad shipping is a later phase; digital blessings only at launch).
- Full social network features (timelines, DMs between arbitrary users) beyond host→follower communication.
- E-commerce storefront / temple merchandise (future).
- Astrology/horoscope services (future, separate module).

---

## 2. Personas & roles

| Role | Description | Key abilities |
| --- | --- | --- |
| **Devotee (Participant)** | End user / follower | Discover, follow, subscribe, pay, join events, participate in rituals, receive broadcasts |
| **Host – Temple** | Organization account | Create occasions/rituals, host live rooms, broadcast, manage subscribers, view payouts |
| **Host – Group** | Community account | Same as Temple, scoped to a devotee community |
| **Host – Guru/Swamiji** | Individual teacher | Same as Temple, plus personal following; can grant co-host roles |
| **Disciple / Sevak (Co-host/Moderator)** | Delegated by a Guru/temple | Co-host rooms, moderate participants, manage event logistics |
| **Platform Admin** | Clique operator | KYC/verification, content moderation, commission config, payouts, dispute handling, analytics |

Access is **role-based (RBAC)**. A single user may hold multiple roles (e.g. a devotee who is also a sevak for one temple).

---

## 3. Functional requirements

### 3.1 Accounts, onboarding & identity
- **FR-1** Users sign up / sign in via mobile number (OTP) as primary, with email as optional secondary.
- **FR-2** Profile: name, photo, preferred language, location (state/city), followed hosts.
- **FR-3** Host onboarding is a **verification flow**: organization/individual details, KYC documents, bank/UPI for payouts. Hosts are not publicly listed until admin-approved.
- **FR-4** A user can request to become a host; a Guru can invite disciples/sevaks as co-hosts with scoped permissions.
- **FR-5** Account languages: UI launches in **English, Hindi, and Telugu**, with an i18n framework ready for more Indian languages (Tamil, Kannada, Marathi, Bengali, Gujarati) in later phases.

### 3.2 Discovery & following
- **FR-6** Browse/search temples, groups, and Gurus by name, tradition/sampradaya, deity, language, and location.
- **FR-7** Follow a host to receive its occasions and broadcasts; following is free.
- **FR-8** Host profile page: about, upcoming occasions, past recordings (if published), subscription tiers, reviews/ratings (later phase).

### 3.3 Occasions & scheduling
- **FR-9** Hosts create **occasions** (events): title, type (satsang/pravachan/bhajan/darshan/ritual/custom), description, language, start time, duration, recurrence (one-off, daily, weekly, festival calendar), cover media.
- **FR-10** Occasions can be **free**, **subscriber-only**, or **pay-per-event** (price set by host).
- **FR-11** Capacity & format per occasion: interactive (limited speakers) vs. broadcast/webinar (large audience, host-only audio/video with participant reactions/chat).
- **FR-12** Devotees can RSVP, add to calendar, and receive reminders (push + in-app) before start.
- **FR-13** Recurring occasions auto-generate upcoming instances; hosts can cancel/reschedule individual instances with attendee notification.
- **FR-14** Hindu festival calendar awareness: hosts can attach occasions to known festivals (Diwali, Navaratri, Janmashtami, etc.). (Calendar data sourced/configurable.)

### 3.4 Live audio/video gatherings
- **FR-15** Live **rooms** support host audio + video and many participants, with two modes: (a) interactive (raise hand → speak), (b) broadcast/webinar (large scale, host-only media).
- **FR-16** In-room features: text chat, emoji/reaction "offerings" (flowers/diya), raise hand, mute/remove participant (host/co-host), pin host video.
- **FR-17** Co-hosts (sevaks) can moderate: admit/remove, mute, promote a participant to speaker.
- **FR-18** Adaptive quality for low bandwidth (audio-only fallback); join via mobile data should be viable.
- **FR-19** Optional session **recording**; host chooses whether to publish a replay (subject to access rules).
- **FR-20** Attendance is gated by access rules (free / subscriber / paid ticket) and verified at join.

### 3.5 Virtual rituals
- **FR-21** A ritual is a structured occasion with steps/stages (e.g. sankalpa → invocation → offerings → aarti → prasad/blessing).
- **FR-22** Participants submit **sankalpa** details (name, gotra, location, intention) when booking a ritual.
- **FR-23** Participants can make **offerings** during the ritual (digital flowers/diya/items), some free, some paid add-ons.
- **FR-24** After the ritual, participants receive a digital **prasad/blessing** (image/audio/video/certificate); physical fulfilment is a later phase.
- **FR-25** Group rituals (many participants in one ceremony) and personal/dedicated rituals (host performs for one devotee/family) are both supported.
- **FR-26a** **Vaara Pooja (weekday deity):** each weekday is associated with a deity (Sun=Aditya, Mon=Shiva, Tue=Hanuman, Wed=Ganesha, Thu=Sai Baba, Fri=Lakshmi, Sat=Venkateswara). The app surfaces a generic **"Vaara Pooja"** entry that opens the pooja for *today's* deity, reusing the deity catalog's image + mantra audio. (Monday=Shiva is a sensible default — confirm.)

### 3.5a Live Ritual Room ("Virtual Temple")
A host (Priest / Spiritual Guru / Temple Executive) performs a live, guided puja on a **shared deity canvas** while associated devotees watch, listen, and make their own offerings to the *same* deity — like a virtual temple where one murti is in the sanctum and each devotee offers personally.

- **FR-41** A host **goes live** from a scheduled meeting (see FR-13/FR-16); state moves scheduled → live → ended. Devotees see a "🔴 Live now" entry and join.
- **FR-42** **Deity placement is the moderator's, and shared.** The host drags a deity image onto the canvas and positions/sizes it. This placement is broadcast so every participant sees the murti in the same spot (the authoritative centerpiece).
- **FR-43** The host performs the puja verbally (**voice**, via the live stream) and offers accessories by **dragging pooja items onto the deity** (water/abhishekam, flowers, kumkuma, chandan/sandal, saffron/akshata, aarti, agarbathi). The host's offerings are the **official puja** and are **broadcast to all** participants.
- **FR-44** **Offering windows:** the host **opens and closes** when devotees may offer (e.g. "offer flowers now"). Devotees can only offer while a window is open.
- **FR-45** **Individual devotee offerings:** while a window is open, each devotee drags an accessory from their **own palette** onto the same (moderator-placed) deity. A devotee sees **the murti + the host's offerings + their own** — **not** other devotees' offerings (personal act, shared deity).
- **FR-46** **Collective presence (anonymous):** an aggregate tally (e.g. "1,240 devotees offered flowers") conveys the shared moment without rendering individual devotee offerings.
- **FR-47** **Audience scale via broadcast:** the host's video/audio reaches thousands via one-to-many broadcast (HLS/CDN, ~5–10s latency, listen/watch). See ARCHITECTURE §8 (NFR-1, NFR-10).
- **FR-48** **Moderated speaking (raise-hand):** devotees are muted by default; a devotee may raise a hand and, if the host approves, is promoted to speak live (then demoted). Host can mute/remove.
- **FR-49** **Access:** for MVP a live ritual room is **free for followers** — any devotee following the host may join. (Paid ritual rooms remain FR-32; deferred pending the app-store IAP question, open Q7.)
- **FR-50** Offering positions are stored **relative to the deity's local coordinate space** (not the screen) so the host's broadcast offerings align on every device regardless of screen size.

### 3.5b Guided self-pooja (solo, data-driven)
A single devotee performs a **self-guided** pooja (Ishta Daiva or Vaara) on their own device — a step-by-step altar setup — distinct from the multi-user Live Ritual Room (§3.5a).

- **FR-51** Tapping **Perform Ishta Daiva Pooja** or **Vaara Pooja** opens **one shared Guided Pooja screen**; the only difference is the **deity** (the chosen Ishta Daiva vs *today's* Vaara weekday deity), whose image/audio come from the deity catalog. If no Ishta Daiva is chosen, tapping routes the user to pick one first.
- **FR-52** Layout: a **left palette** of ritual items (each disabled until its step), a **central canvas** (altar) where items are **dragged and placed** (snap to centre), and a **footer** showing the current instruction, step by step.
- **FR-53** **Items and steps are data-driven** (admin-managed, no app release). `ritual_items` = name (+hi/te), image, order; a **Deity** item is **dynamic** (`image_source='deity'` → uses the pooja's deity, no upload). `pooja_steps` = ordered instructions (+hi/te), an `action` type, and `is_active` to roll steps out one at a time. See `supabase/pooja-ritual.sql`.
- **FR-54** Step `action` types: **`info`** (acknowledge — a **Done** button advances) and **`place`** (the item's palette entry enables; the devotee drags it to the centre, it snaps onto the altar, and the flow **auto-advances** — no Done needed). On a `place` step, tapping **Done** before placing shows a prompt to perform the action first. (New action types — pour, offer, aarti — are added in code as the flow grows.)
- **FR-55** An in-app admin **master form** manages ritual items (Admin → Ritual Items: name/image/order/source/active). Pooja steps are managed via the datastore for now (an in-app steps form is a later nicety).
- **FR-56** After the final step the altar is complete; the devotee can **continue to worship** (the ambient worship screen — deity + aarti/offerings/audio) or return home.

### 3.6 Communication & broadcasts
- **FR-26** Hosts broadcast **group-level messages/announcements** (text + media) to all followers or a subscriber segment; delivered via push + in-app inbox.
- **FR-27** Information sharing: hosts post updates, images, audio (bhajans), and documents to their profile feed.
- **FR-28** In-event chat is moderated; hosts/co-hosts can pin messages and disable chat.
- **FR-29** Notification preferences are user-configurable per host and per category (occasion reminders, broadcasts, payment receipts).

### 3.7 Payments & monetization
- **FR-30** Payments via **Razorpay**: UPI, cards, netbanking, wallets. Support recurring mandates for subscriptions.
- **FR-31** **Subscriptions** — hosts define tiers (monthly/yearly, price, benefits). Devotees subscribe, renew, and cancel; access updates accordingly.
- **FR-32** **Pay-per-event / ritual** — one-time checkout grants access to a specific occasion/ritual (and optional paid offerings).
- **FR-33** **Platform commission** — Clique retains a configurable percentage of host earnings; remainder is paid out to hosts (Razorpay Route/transfers).
- **FR-34** Payouts: hosts see earnings, commission, and settlement status; payouts run on a schedule after KYC verification.
- **FR-35** Receipts/invoices issued to payers; **GST** handling and tax invoices per Indian regulations.
- **FR-36** Refund/cancellation policy enforced (e.g. cancelled event auto-refund); admin can issue manual refunds.
- **FR-37** (Future) Voluntary **seva/donation** offerings to a host, with optional anonymity.

### 3.8 Admin & moderation
- **FR-38** Admin console: review/approve host KYC, configure commission rates, manage festival calendar, view platform analytics.
- **FR-39** Content & conduct moderation: report users/messages/events, suspend accounts, take down content.
- **FR-40** Dispute/refund handling and audit log of administrative actions.

---

## 4. Non-functional requirements

| Area | Requirement |
| --- | --- |
| **NFR-1 Scale** | Support large broadcast events (target 10k+ concurrent viewers per event; interactive rooms in the hundreds). Architecture must scale media horizontally. |
| **NFR-2 Performance** | App cold start < 3s on mid-range Android; join-to-live < 5s; chat/reaction latency < 1s. |
| **NFR-3 Low bandwidth** | Usable on 3G/poor 4G; audio-only fallback; offline access to downloaded recordings/announcements where permitted. |
| **NFR-4 Availability** | 99.9% target for core services; graceful degradation of live media. |
| **NFR-5 Security** | OTP auth, encrypted transport (TLS), encryption at rest for PII/KYC, RBAC, rate limiting, secure media tokens for room access. |
| **NFR-6 Privacy & compliance** | India **DPDP Act** compliance; consent for recordings; data residency in India; PCI-DSS handled by Razorpay (no raw card data stored); **GST** invoicing; RBI rules for payouts/marketplaces. |
| **NFR-7 Localization** | Full i18n; right rendering of Indian scripts; date/time in IST; festival calendar localization. |
| **NFR-8 Accessibility** | Readable fonts/scaling, captions for recorded discourses (later), high-contrast mode. |
| **NFR-9 Observability** | Centralized logging, metrics, crash reporting, payment/payout audit trails. |
| **NFR-10 Cost** | Media (egress/minutes) is the dominant cost; design must allow audio-only and recording controls to manage spend. |

---

## 5. Key user stories (MVP-relevant)

- As a **devotee**, I can find a Guru by language and follow them so I get notified of their satsangs.
- As a **devotee**, I can pay once to join a special Navaratri puja and submit my sankalpa details.
- As a **devotee**, I can subscribe to a temple monthly to access all subscriber-only discourses.
- As a **Guru**, I can schedule a weekly recurring satsang and broadcast a reminder to all followers.
- As a **temple**, I can run a virtual aarti where 2,000 devotees watch live and offer digital diyas.
- As a **sevak**, I can co-host and mute disruptive participants during a live event.
- As a **host**, I can see my earnings, the platform commission deducted, and my next payout date.
- As an **admin**, I can verify a new temple's KYC before it goes live and set its commission rate.

---

## 6. Open questions / assumptions

> These are working assumptions; confirm with the client and update this section.

1. **Donations/seva** were not selected as a launch revenue stream — captured as FR-37 (future). Confirm whether v1 needs basic donations.
2. **Recording storage & retention** policy (how long replays are kept, who pays for storage) — TBD.
3. **Concurrency targets** (NFR-1) are estimates — confirm expected peak event size to size the media tier.
4. **Languages for v1** — confirmed: **English, Hindi, Telugu** at launch. Additional regional languages are a later phase.
5. **Physical prasad fulfilment** — deferred; confirm if any v1 host requires it.
6. **Multi-tenant branding** — do large temples need white-label/branded presence? Affects architecture.
7. **App-store policy** — selling digital event access may trigger Apple/Google in-app-purchase rules; confirm whether Razorpay-only checkout is acceptable for the categories sold (see ARCHITECTURE risks).

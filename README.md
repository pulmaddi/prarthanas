# Clique

A meeting and community app for Hindu devotees in India. Temples, devotee groups, and Gurus/Swamijis host live audio/video gatherings, perform virtual rituals, share information, and deliver group-level messages. Participants pay to access premium services through India-native payments.

> **Status:** Planning / requirements phase. No application code yet — see [`docs/`](docs/) for requirements, architecture, and roadmap.

## What it does

- **Live gatherings** — audio/video meetings hosted by a temple, group, or Guru, with many participants (satsang, pravachan, bhajan, Q&A/darshan).
- **Virtual rituals** — guided, interactive puja/aarti/havan experiences with sankalpa details, offerings, and prasad/blessing follow-up. Includes the **Live Ritual Room ("Virtual Temple")**: a host performs a live puja on a shared deity while devotees make their own offerings to the same murti (see ARCHITECTURE §8).
- **Communities** — temples, devotee groups, and Gurus run recurring occasions, share announcements/media, and broadcast group-level messages.
- **Paid access** — subscriptions, pay-per-event/ritual, and platform commission on host earnings, via Razorpay (UPI, cards, wallets, netbanking).

## Who it's for

- **Devotees / participants** — discover and join temples, groups, and Gurus; attend live events and rituals; pay for access.
- **Hosts** — temples, devotee groups, and Gurus/Swamijis (with their disciples/sevaks who help moderate) who schedule occasions and broadcast to their followers.
- **Platform admins** — operate the marketplace, payouts, moderation, and compliance.

## How this project is run

The **client is non-technical** and provides **user/business requirements only**. All technical decisions are owned and recommended by engineering. The AI assistant acts as **full-stack engineer** and **functional domain expert** — turning plain-language requirements into a working product. See [CLAUDE.md](CLAUDE.md).

## Tech direction (recommended)

Mobile-first (Android + iOS) on **React Native (Expo)**, a **Node.js/TypeScript (NestJS)** backend, **LiveKit** for scalable WebRTC audio/video, **PostgreSQL** for core data, and **Razorpay** for payments. Launch languages: **English, Hindi, Telugu**. Rationale and alternatives are in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Documentation

| Doc | Purpose |
| --- | --- |
| [index.html](index.html) | Public **hero / landing page** (logo, goal, Register Now, Terms) |
| [preview.html](preview.html) | Client review portal (links wireframes + all docs) |
| [register.html](register.html) | Sign-up landing — accept T&C to enable Register Now |
| [terms.html](terms.html) | Terms & Conditions (draft; payment terms TBD) |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Functional and non-functional requirements, roles, user stories |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, tech stack, data model, integrations |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phased delivery plan, MVP scope, milestones |
| [docs/GLOSSARY.md](docs/GLOSSARY.md) | Domain terms (devotional + technical) |
| [docs/BRANDING.md](docs/BRANDING.md) | Devotional name options + visual identity |
| [docs/wireframes/index.html](docs/wireframes/index.html) | Clickable wireframe gallery (open in a browser) |
| [docs/DEPLOY.md](docs/DEPLOY.md) | How to deploy the preview portal to Render |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Engineering setup — run the monorepo (mobile + API) |
| [CLAUDE.md](CLAUDE.md) | Context for AI-assisted development sessions |

# Mobile builds & store release — Prarthanas

How to build the Android/iOS apps with **EAS** (Expo Application Services). No Mac
needed — EAS builds in the cloud.

## Accounts / cost
- **Expo account** — free (sign up at expo.dev). Needed for EAS builds.
- **Google Play Console** — $25 one-time (only for Play Store release, not for phone testing).
- **Apple Developer Program** — $99/year (only for App Store / TestFlight).

Register store accounts as an **Organization** (company as legal seller, company
bank + GSTIN for payouts). See the discussion in chat / ARCHITECTURE §7 (IAP risk).

## One-time setup (already done in the repo)
- `app.json` — bundle id `com.prarthanas.app`, icon/splash, camera/mic permissions,
  `@livekit/react-native` + `expo-build-properties` (min SDK 24) plugins.
- `eas.json` — build profiles:
  - **preview** → installable **APK** for phone testing (sideload).
  - **development** → dev client (APK) for live-reload native debugging.
  - **production** → **AAB** for the Play Store.

> **Auth env (already set):** `apps/mobile/eas.json` carries the public
> `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` in every profile's
> `env` block (anon key is safe to embed; RLS protects data). A built APK has no
> `.env`, so these must live in `eas.json`.
>
> **Google sign-in** works on the native app via a deep-link callback. It requires
> `prarthanas://auth-callback` allow-listed in **Supabase → Auth → URL Configuration →
> Redirect URLs**, plus the Google provider enabled (the Google *Web* OAuth client
> is shared with the web app — no Android client). Full steps:
> [`supabase/README.md` → Google sign-in (OAuth)](../supabase/README.md#google-sign-in-oauth).

## Build an APK to test on your Android phone
```bash
npm i -g eas-cli
cd apps/mobile
eas login                      # your Expo account
eas init                       # links the project, writes extra.eas.projectId
eas build -p android --profile preview
```
When the cloud build finishes (~10–20 min), EAS prints a URL + QR code.
On the phone: open the link → **Download** the `.apk` → tap to install
(allow "install from unknown sources" when prompted). Or run
`eas build:run -p android` to install to a connected device/emulator.

## Later: Play Store release
```bash
eas build -p android --profile production   # produces .aab
eas submit -p android                        # uploads to Play Console
```
Then complete the Play listing: screenshots, description, **privacy policy URL**,
**Data safety** form (DPDP), content rating. New personal Play accounts must run a
**closed test (20 testers, 14 days)** before production; Organization accounts are
generally exempt.

## Notes
- LiveKit native modules are already in the build (min SDK 24) so Phase B media
  works without a rebuild config change.
- The priest camera tile currently uses the browser (`getUserMedia`) — on the
  native app it shows a placeholder until LiveKit media (Phase B) is wired.

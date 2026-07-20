# Supabase setup — Ishta

The mobile app talks to **Supabase** directly (`@supabase/supabase-js`) for
registration and login. Supabase Auth handles email/password securely (hashed
passwords, sessions); a `profiles` table stores name + preferred language.

> Architecture note: this is the current data layer for the **Ishta** app.
> The NestJS API (`apps/api`) can be reintroduced in front of the same Supabase
> Postgres later for payments and live-room token gating (see ARCHITECTURE §).

## One-time setup

### 1. Create the project
1. Go to <https://supabase.com> → **New project**.
2. Pick a name (e.g. `ishta`), a strong DB password, and the region
   **closest to India** (e.g. `ap-south-1` Mumbai / Singapore) for latency
   and data-residency.
3. Wait for it to provision (~2 min).

### 2. Apply the schema
1. In the dashboard: **SQL Editor → New query**.
2. Paste the contents of [`schema.sql`](schema.sql) → **Run**.
   This creates `profiles`, RLS policies, and the signup trigger.

### 3. Turn OFF email confirmation (for the demo)
So signup logs the user straight in (no confirmation email step):
- **Authentication → Providers → Email** → disable **"Confirm email"** → Save.
  (Re-enable before a real launch.)

### 4. Get the client keys
- **Project Settings → API**:
  - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
  - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- These are **public** by design; Row-Level Security protects the data.
  (Never put the **service_role** key in the app.)

### 5. Configure the app
```bash
cp apps/mobile/.env.example apps/mobile/.env
# edit apps/mobile/.env and paste your URL + anon key
```
Restart the Expo dev server after editing `.env`.

> **For EAS cloud builds** the same public URL + anon key are read from the
> `env` block of each profile in [`apps/mobile/eas.json`](../apps/mobile/eas.json)
> (a built APK has no `.env`). These are already set for the Ishta project.

## Google sign-in (OAuth)

Ishta supports **Continue with Google** on web and native (Android/iOS). The app
never talks to Google directly — the flow is **app → Supabase → Google → Supabase
→ app**, so a single Google **Web application** OAuth client serves every platform
(no separate Android client needed).

**Code:** `signInWithGoogle()` + `setSessionFromUrl()` in
[`apps/mobile/src/lib/supabase.ts`](../apps/mobile/src/lib/supabase.ts); the native
deep-link handler + `navigationRef` live in
[`apps/mobile/App.tsx`](../apps/mobile/App.tsx). The app scheme (`ishta`) is set in
`app.json`.

### Setup (once per Supabase project)
1. **Google Cloud → Auth Platform → Clients** — a **Web application** OAuth client
   whose **Authorized redirect URIs** include the Supabase callback:
   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
2. **Google Cloud → Auth Platform → Audience** — set **Publishing status = In
   production** so any Google account can sign in. Ishta requests only basic scopes
   (email, profile, openid), so **no Google verification/review is required**.
   (Leave it in *Testing* to restrict to listed test-user emails instead.)
3. **Supabase → Authentication → Providers → Google** — enable, paste the client's
   **Client ID + secret**.
4. **Supabase → Authentication → URL Configuration → Redirect URLs** — add the
   native deep link (this is the mobile-only addition; web uses its site URL):
   ```
   ishta://auth-callback
   ```

> For the Ishta project (`azeawlwqtiqtbgjrazxl`) the Google client + provider are
> **already configured** (shared with the web app, same project URL). The only
> mobile-specific addition is the `ishta://auth-callback` redirect URL in step 4.

## Deity images (Ishta Daiva)

The deity catalog + images are managed entirely from the Supabase dashboard — **no custom admin page**.

1. **Create the table + seed:** SQL Editor → run [`deities.sql`](deities.sql).
2. **Create a Storage bucket:** Storage → **New bucket** → name **`deities`** → tick **Public bucket** → Create.
3. **Upload images:** open the `deities` bucket → **Upload** files named to match each row's `image_path`
   (e.g. `venkateswara.png`, `shiva.png`, …). Use properly-licensed images.
4. **(Add a new deity later):** Table Editor → `deities` → **Insert row** (`key`, `display_name`, `image_path`),
   then upload the matching image to the bucket. The app's picker and Home card update automatically — no release.

The app reads the catalog for the Ishta Daiva picker and shows the chosen deity's image on Home
(falls back to a 🕉️ icon until an image is uploaded).

### Admin-gated management
Deity/content writes are restricted to **admins** via RLS. Run [`admin.sql`](admin.sql)
to create the `admins` table + `is_admin()`; grant admin with
`insert into public.admins (user_id) select id from auth.users where email = '…'`.
Admins manage the catalog either from the **Supabase dashboard** (Table editor +
Storage) or the app's in-built **Admin screens**. (The old standalone `admin/`
HTML tool was removed — the product is one `apps/mobile` codebase now.)

## SQL files (run in order, in the SQL Editor)

| File | Adds |
| --- | --- |
| [`schema.sql`](schema.sql) | `profiles`, RLS, signup trigger (core auth). |
| [`deities.sql`](deities.sql) | Ishta Daiva deity catalog + seed. |
| [`admin.sql`](admin.sql) | `admins` table + `is_admin()` for the local admin app. |
| [`profiles-roles.sql`](profiles-roles.sql) | Adds `profiles.email` + admin read policy; makes onboarding additive (everyone is a Devotee; host roles are added on top). |
| [`hosts.sql`](hosts.sql) | `host_accounts` — one profile per host, **`host_types` array** (priest / guru / temple_exec / numerologist / astrologer; multiple allowed) + admin-managed RLS. |
| [`follows.sql`](follows.sql) | `follows` table + PII-free `hosts_public` directory view. |
| [`host-content.sql`](host-content.sql) | `host_meetings` (invites) + `host_notifications` (broadcasts); read open to authenticated, writes owner-only. |
| [`pooja-ritual.sql`](pooja-ritual.sql) | Guided-pooja masters: `ritual_items` (name/image/order; Deity is dynamic) + `pooja_steps` (ordered instructions/actions) + `ritual-items` Storage bucket. Public read, admin write. |

> **Coming with the Live Ritual Room (Virtual Temple, ARCHITECTURE §8):** a migration adding
> meeting `status`/`livekit_room`/`deity`/`hls_url` columns and a `speaker_requests` (raise-hand)
> table. The shared canvas syncs over **Supabase Realtime Broadcast** (no schema needed — enable
> Realtime on the project); individual devotee offerings never touch the database.

## Verify
- Register in the app → a row appears in **Authentication → Users** and in
  **Table editor → profiles**.
- Sign out and sign back in with the same email/password.
- Kill and reopen the app → you stay signed in (session persisted) and land on Home.

## Notes
- If `EXPO_PUBLIC_SUPABASE_*` are missing, the app logs a warning and still lets
  you click through (demo mode) without saving anything.
- Data is protected by **RLS** — each user can read/write only their own profile.

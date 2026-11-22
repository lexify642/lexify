# LEXIFYI — Admin Panel

This documents the Admin Panel as actually implemented: who can reach it, how, and what it does. No secret values appear anywhere in this file.

## Who can access it

`/admin` and every `/admin/**` route, plus every `/api/admin/**` endpoint, require the caller's `profiles.role` to be `admin`. There is exactly one way to hold that role: an existing admin sets it (via Users & Roles, or the one-time SQL bootstrap step below). There is no self-registration path and no client-controllable field that sets role — see [database-schema.md](database-schema.md#profiles-0001) for the RLS policy that makes this a database-level guarantee, not just an application check.

Practically, in this deployment the intended sole admin account is `lexify642@gmail.com`, set via the bootstrap step documented at the bottom of `supabase/migrations/0001_foundation.sql`. Nothing in the code hardcodes that address or any password — it's simply the email the operator uses when running the one manual SQL step that grants the first admin role. Every other account, including ones an admin later invites with `role: admin`, works identically; the address itself carries no special-cased logic.

## Authentication (no passwords, anywhere)

Login is a 6-digit emailed code, not a password:

1. User enters their email at `/login`. `POST /api/auth/send-otp` checks a `profiles` row exists for that email (no such row → generic rejection, no account-enumeration signal beyond what OTP flows always leak) and emails a code via Resend.
2. User enters the code. `POST /api/auth/verify-otp` checks it against `login_otps`, then — the part that makes this a *real* session — uses the Supabase service-role client to call `auth.admin.generateLink({type: 'magiclink', email})`, and immediately exchanges that link's `token_hash` via `auth.verifyOtp()` on a server-side `@supabase/ssr` client. That exchange is what sets the actual Supabase Auth session cookies on the response. The custom 6-digit code is purely a UX layer in front of a real, cryptographically issued Supabase session — there is no parallel "fake logged in" state anywhere.
3. `middleware.js` refreshes that session cookie on every request (the standard `@supabase/ssr` refresh pattern) and redirects any request without a valid session to `/login?redirect=<path>`, for every route except `/login` and `/api/auth/*`.
4. `app/(app)/layout.js` re-checks the session server-side (defense in depth beyond middleware) and loads the caller's `profiles` row before rendering anything, so even a request that somehow reached a Server Component without a session cannot render authenticated content.
5. Logout clears the Supabase session via the standard sign-out call, exposed as a button in `Topbar.jsx` next to the signed-in user's name (replacing what was previously an unconditional "Login" link).

Session cookies are `httpOnly`, set by the `@supabase/ssr` package's standard cookie adapter — never written or read by application JavaScript. No session token, role, or user id is ever embedded in a `NEXT_PUBLIC_*` variable or otherwise shipped in a way client code could tamper with; the client only ever sees what `useCurrentUser()` (backed by the server-provided `profiles` row) exposes: id, name, role, email.

## Authorization layers (defense in depth)

Four independent layers all have to agree before an admin action succeeds — bypassing the UI does not bypass the others:

1. **Middleware** — redirects unauthenticated requests before they reach any page or route handler.
2. **`app/(app)/admin/layout.js`** — server-side: loads the caller's profile, redirects (not just hides) to `/` if `role !== 'admin'`.
3. **Route Handlers** — every `/api/admin/**` and other privileged endpoint (matter/task delete, drafting-library writes, deed-config writes) calls a `requireAdmin()`/`requireManager()`/`requireStaff()` guard (`lib/auth/requireStaff.js`) at the top, independent of whether the request came from the Admin UI or a hand-crafted `fetch`/`curl` call. A non-admin calling an admin API endpoint directly gets a 403, identical to what the guard would do for a UI-originated request.
4. **RLS** — even if every application-layer check above were somehow skipped, the database itself refuses the write: `profiles_update_admin_only`/`profiles_insert_admin_only` and the manager-only write policies on `legal_draft_categories`, `clauses`, `deed_clause_options`, `deed_presets`, `deed_settings` etc. mean a non-admin's Supabase credentials (were they ever obtained) still could not perform the mutation. This is the layer that specifically satisfies "verify server-side, not just client-side" and "RLS also enforces it."

The sidebar/topbar Admin link is conditionally rendered only for `role === 'admin'` — purely cosmetic tidiness, not a security boundary. Navigating to `/admin` directly with a non-admin session, or a signed-out session, hits layer 1 or 2 above and is redirected regardless of whether a link was ever shown.

## What lives in the Admin Panel

| Screen | Route | What it manages |
|---|---|---|
| Dashboard | `/admin` | Real counts (staff by role, matters by stage, recent `audit_log` entries) pulled live from Supabase — not a mock array. Includes cards linking to every config screen below. |
| Users & Roles | `/admin/users` | List/search/paginate `profiles`; invite a new user (creates a real `auth.users` row via the service-role client plus a `profiles` row — no password is set, they sign in via the same OTP flow as everyone else); change role; activate/deactivate an account. Every action writes an `audit_log` row. |
| Legal Drafts | `/admin/legal-drafts` | CRUD on `legal_draft_categories` and their sub-types (`legal_draft_subtypes`), publish/unpublish toggle, PDF upload into the private `legal-drafts` bucket. This is the screen that replaced what was previously a handful of hardcoded, non-manageable sub-type entries — every sub-type shown on the public Drafting Library page now comes from this table, editable here. |
| Partnership Deed Config | `/admin/deed-config` | CRUD on `deed_clause_options` (the questions/options the Deed Engine walks through) and `deed_presets` (its quick-start templates), plus the single-row `deed_settings` boilerplate (recitals/closing text). Editing a clause's options or a preset's selections here changes what the live `/partnership-deed` workflow actually generates — this is a real, wired admin→app connection, not a config screen that writes somewhere unused. |
| Activity Log | (part of `/admin`) | Real, append-only `audit_log` table — see [database-schema.md](database-schema.md#audit_log-0001). Select is admin-only, matching its purpose as a security/oversight surface. |

## Content management model

Two tiers exist across the migrated content tables (`legal_draft_categories`, `legal_draft_subtypes`, `clauses`):
- Manager-and-above (`admin` or `senior_advocate`) can write.
- All active staff can read, but only rows with `status/is_published = true` — a manager can preview an unpublished draft in the admin screen before it goes live; regular staff only ever see published content on the real workflow pages.

Partnership Deed config (`deed_*` tables) is admin/senior_advocate write, all-staff read — there's no draft/publish concept there since it's structured configuration, not editorial content.

## Storage security model

Two private Supabase Storage buckets, neither public:
- `firm-files` — chat/task/matter attachments. Read access is scoped per-object to conversation membership (see [database-schema.md](database-schema.md#storage-buckets)) for anything shared through chat; matter-uploaded documents (no source conversation) are staff-wide, matching every other matter-scoped table.
- `legal-drafts` — admin-managed PDFs behind the Drafting Library; staff-read, manager-write.

All file access — download links shown anywhere in the app — is a signed URL generated server-side per request (short expiry), never a public bucket URL. A user changing a file's storage path or document id in a request does not gain access to a file they aren't authorized for: the signed-URL endpoint re-derives authorization from the owning `attachments` row (and, for chat files, `can_access_conversation()`) before issuing the URL, it never trusts a client-supplied path directly.

## What is NOT in the Admin Panel (by design)

`data/calculatorReference.js` (Court-Fee Calculator lookups) and `data/templates.js` (Template Bank) remain static/pre-existing and are not migrated or admin-manageable — this was out of scope for the phases executed in this migration and is called out here rather than silently left inconsistent with everything else.

## Manual steps an operator must perform (not doable from application code)

- Apply all SQL migrations (`supabase/migrations/0001` through `0006`) via the Supabase Dashboard SQL editor or `supabase db push`.
- Set the required environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Resend key) — see `.env.example` for the full list of names (no values are recorded anywhere in this repo).
- Run the one-time admin bootstrap SQL documented at the bottom of `supabase/migrations/0001_foundation.sql` for `lexify642@gmail.com`, after that address has signed in at least once via the normal OTP flow (so its `auth.users`/`profiles` rows exist). Until this step runs, zero accounts have admin access.

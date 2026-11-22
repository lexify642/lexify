# LEXIFYI — Database Schema

This documents the actual Supabase schema created by `supabase/migrations/0001`–`0007`. Every table listed here is real, applied via SQL migration, and enforced by Row Level Security (RLS) — nothing in this document is aspirational.

Two tables predate this migration and are untouched by it: `legal_cases` / `legal_case_ai_analysis` / `legal_case_citations` (the read-only case-law research dataset behind Case Research) and `login_otps` (the 6-digit email code store). They are not covered below.

## Role model

Every RLS policy in this schema is built on three SQL helper functions (`0001_foundation.sql`), all `SECURITY DEFINER` so they can read `profiles` without recursing through its own RLS:

| Function | Meaning |
|---|---|
| `is_admin()` | `profiles.role = 'admin'` for the caller |
| `is_manager()` | role is `admin` or `senior_advocate` — mirrors `MANAGER_ROLES` in the frontend's `components/*/permissions.js` files |
| `is_active_staff()` | role is one of `admin/senior_advocate/junior_advocate/clerk/staff` **and** `is_active = true` |
| `current_full_name()` | the caller's `profiles.full_name` — used to match against denormalized name fields (task assignees, chat members) |
| `current_role_value()` | the caller's raw role string |
| `can_access_conversation(conv_id)` (0006) | real chat access rule, see below |
| `can_access_storage_object(path)` (0006) | resolves a `firm-files` object back to its owning `attachments` row and applies the same rule |

**There is no public/anonymous tier anywhere in this schema.** Every policy requires `auth.uid()` to resolve to an active profile. This is an internal firm tool, not a public site.

## Tables

### profiles (0001)
One row per staff member, `id` = `auth.users.id`.

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | FK to `auth.users` |
| email | text unique | |
| full_name | text | |
| role | text | check in `admin, senior_advocate, junior_advocate, clerk, staff, client` |
| is_active | boolean | deactivation flag, not deletion |
| created_at / updated_at | timestamptz | |

**RLS**: select — self or admin. insert — admin only. update — admin only, **or** self *if the role column is unchanged* (prevents self-escalation at the database level, not just in application code).

### clients (0001)
| Column | Notes |
|---|---|
| id, name, phone, address | `unique index on lower(name)` — dedup key used by matter creation |

RLS: full CRUD for active staff; delete manager-only.

### matters (0001)
The firm's own cases — named `matters`, not `cases`, to avoid colliding with the pre-existing `legal_cases` research table.

| Column | Notes |
|---|---|
| id | uuid PK |
| display_no | text unique — the "01"/"02" shown in the UI |
| number, court, city, room, judge, parties, hearing_date, hearing_time, stage, tone, activity_summary, registered_on, filing_type | scalar fields |
| client_id | FK → clients, nullable |
| assigned_advocate_id | FK → profiles, nullable (not currently populated by the app — `case_details.assignedAdvocate` is the field actually used) |
| case_details | **jsonb** — deliberately unnormalized: per-matter-type fields (Writ/Criminal/Civil/etc.) vary in shape; over-normalizing this would mean a wide, mostly-null table |
| docs | text[] — legacy filename list, superseded by real `attachments` rows (see below) but left in place |
| created_by | FK → profiles |

RLS: full CRUD for active staff; delete manager-only.

### matter_previous_dates / matter_notes (0001)
Child tables, `matter_id` FK `on delete cascade`. Same staff-CRUD / manager-delete RLS as `matters`.

### audit_log (0001)
Cross-cutting security/admin activity trail (user invited, role changed, matter created, etc. — populated by explicit `insert` calls in Route Handlers, not triggers).

RLS: **select is admin-only** (this is a security surface, not general staff data). Insert is staff, but only self-attributed (`actor_id = auth.uid()`). No update/delete — audit entries are immutable.

### tasks / task_comments / task_attachments / task_activity (0002, tightened by 0007)
`tasks.matter_id` FK nullable (independent tasks allowed). `assigned_by_name`/`assigned_to_name` are denormalized text, not FKs — matches how the frontend has always modeled assignment (a display name, not a stored reference).

RLS: `tasks` select/insert — staff; **update (0007)** — manager, or the task's own assignee (`assigned_to_name = current_full_name()`) — matches the UI's `canManageTask()`/`canUpdateStatus()` split exactly; delete — manager-only. `task_comments`/`task_attachments` — staff select/insert, manager-only delete (unchanged — commenting/attaching stays collaborative, not exclusive to the assignee). `task_activity` — staff select/insert, **no update/delete** (immutable history, like audit_log).

### appointments (0002)
Standalone calendar events, `matter_id` nullable FK. **Delete is staff-wide, not manager-restricted** — this intentionally matches the existing UI, which never gated appointment deletion.

The Calendar page itself has no backing table — it's a pure client-side join of `matters` + `tasks` + `appointments`, exactly as it worked before the migration.

### groups / direct_conversations / messages / message_reads (0003, tightened by 0006)
- `groups.member_names` / `direct_conversations.member_names` — `text[]` of full names.
- `messages.conversation_id` is **plain text, not FK-constrained** — it's polymorphic: a real `groups.id`/`direct_conversations.id`, or a synthetic `"case-<display_no>"` / `"client-<name>"` string that has no backing row (Case Discussion Rooms and Client Chats stay virtual, derived from `matters` at read time).
- `messages` soft-deletes via `UPDATE ... SET deleted=true` (no real DELETE policy exists on this table by design).

**RLS (as of 0006 — this supersedes 0003's original broader policies)**:
- `can_access_conversation(conv_id)`: managers see everything; a `case-` room requires being the matter's `case_details->>'assignedAdvocate'` **or** having a task on that matter; a `client-` room is open to all active staff (matches the frontend's own unfiltered behavior for client chats); a group/DM requires `current_full_name() = any(member_names)`.
- `messages` select/insert, `groups` select, `direct_conversations` select all now call this function — a user genuinely cannot read or send into a conversation they don't belong to, at the database level, independent of what the UI shows them.
- Realtime (`supabase_realtime` publication includes `messages`) respects this same RLS per-subscriber, so live updates also stop at the same boundary.

### client_chat_assignments (0003)
"Who's handling this client's chat" — keyed by `client_name` (text PK, matching `clientDirectory.js`'s name-based client model, since there's no separate `clients` FK used for chat). Select: staff. Insert/update: **manager only**.

### attachments (0003, tightened by 0006)
The Document Library's single source of truth, and the backing store for chat/task/matter file references. `storage_path` points into the `firm-files` bucket.

RLS: insert/update — staff. **Select** (0006) — staff, and if `source_conversation_id` is set, must pass `can_access_conversation()` for it (an attachment shared in a private group/case room is only visible to that room's members; a document uploaded directly to a matter, with no `source_conversation_id`, stays staff-wide). Delete — uploader or manager.

### legal_draft_categories / legal_draft_subtypes (0004)
Admin-curated content behind `/legal-drafts`. `translations`/`search_placeholder` are jsonb (4 languages today). `file_path` points into the private `legal-drafts` bucket — verified during migration that `downloadUrl`/`previewUrl` were always identical in the original data, so this is one field, not two.

RLS: **select** — staff, and only `status = 'published'` rows unless the caller is a manager (so Admin can preview drafts before publishing). **write** — manager only.

### clauses (0004)
The 254-entry clause corpus. `id` is the existing business key (e.g. `"INT-TIT--001"`), kept as the primary key. `status` is the clause's own legal-review state (Approved/Draft/Deprecated/...); `is_published` is the separate admin visibility gate this migration added — the two are intentionally not conflated.

RLS: select — staff, published-only unless manager. Write — manager only.

### drafts / draft_versions (0005)
`drafts.layout`/`drafts.design` are jsonb config bags. `draft_versions.content_json` is the actual Tiptap/ProseMirror document (jsonb); `content_text` is a derived plain-text cache used for diffing and the "did content actually change" dedup check. Versions are **append-only** — there is no update/delete policy on `draft_versions`; "restoring" an old version creates a new version copying its content, never rewrites history.

RLS: `drafts` full staff CRUD, manager-delete. `draft_versions` select/insert only (immutable).

### draft_comments / draft_comment_replies (0005)
`draft_comments.id` is **client-supplied** (not `gen_random_uuid()`'s default) — the same id is embedded in the document's own `CommentMark` the instant a comment is created in the editor, so the id has to exist before any network round trip.

RLS: select/insert/update — staff (resolve/reopen has no extra restriction, matching the original app's `canComment()` which was always unconditionally `true`). Delete — comment's own author or a manager.

### draft_review_requests (0005)
Fixes a real trust gap the audit found: previously the "Send for Review" email and the database record were two separate calls (client fetch, then a client-side context write) — a dropped connection between them meant an email could go out with zero record it ever happened. `app/api/draft-review/send` now creates this row server-side, in the same request as the email send, using the authenticated sender's identity — never a client-supplied name.

RLS: staff select/insert/update (no delete — review history is kept).

### clause_collections / clause_saved / clause_recent_use (0005)
`clause_collections` are shared team artifacts (same broad-staff model as matters/tasks). `clause_saved` (bookmarks) and `clause_recent_use` (usage log) are genuinely personal — RLS restricts both to `user_id = auth.uid()` for every operation, not just select.

### deed_clause_options / deed_presets / deed_settings (0005)
Partnership Deed Engine config. `deed_clause_options.text_template` replaces what used to be a JS function (`buildText(optionLabel, extraValue)`) — verified to be pure string interpolation with no branching across all 10 original clauses, so it converts losslessly to a template string with `{{optionLabel}}`/`{{extraValue}}` placeholders, substituted client-side at render time. `deed_settings` is a deliberate single-row table (`id boolean primary key default true check (id)` forces exactly one row) holding the fixed recitals/closing boilerplate and default selections.

RLS: select — staff. Write — manager only.

## Storage buckets

| Bucket | Public? | Read | Write |
|---|---|---|---|
| `firm-files` | No (private) | Active staff, scoped to conversation membership via `can_access_storage_object()` (0006) | Active staff (insert/delete); no update policy — uploads never overwrite (`upsert:false`), so none is needed |
| `legal-drafts` | No (private) | Active staff | Manager only |

Both buckets are accessed exclusively through **signed URLs** generated server-side per request (1-hour expiry) — nothing is ever served from a public/unauthenticated path.

## Indexes

Every foreign key used in a hot lookup path has a supporting index (`matters.client_id`, `matters.hearing_date`, `tasks.matter_id`, `tasks.due_date`, `messages.(conversation_id, created_at)`, `attachments.source_conversation_id`, `draft_versions.(draft_id, created_at)`, `clause_recent_use.(user_id, created_at)`, etc.) — see each migration file for the exact `create index` statements next to the table it belongs to.

## What's intentionally NOT in this schema

- **Court-Fee Calculator** — still 100% `localStorage`, never migrated (out of scope for the phases actually executed; flagged, not silently dropped).
- **Template Bank** (`data/templates.js`) — still a static, barely-populated stub; only Partnership Deed graduated to a real generator.
- Per-user visibility on `matters`/`tasks`/`draft_review_requests`/etc. — this app deliberately uses a single shared "the whole firm sees the whole firm's work" model (matching how the original in-memory version behaved), not per-owner row-level privacy. Chat is the one place that genuinely needed (and now has) real membership-based privacy, because it's structurally a private-conversation feature, unlike the rest of the app.

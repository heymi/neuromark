<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1fuVWlVGedwnC62yh0CJjiqOO-2Y26GeZ

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. (Optional) Configure Supabase cloud storage:
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env.local`
   - Enable Email auth provider (Supabase Dashboard → Authentication → Providers)
   - In Supabase SQL editor, create the table + RLS policy:

```sql
create table if not exists public.neuromark_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.neuromark_state enable row level security;

create policy "neuromark_state_select_own"
on public.neuromark_state
for select
using (auth.uid() = user_id);

create policy "neuromark_state_insert_own"
on public.neuromark_state
for insert
with check (auth.uid() = user_id);

create policy "neuromark_state_update_own"
on public.neuromark_state
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```
4. Run the app: `npm run dev`

## Bookmark API (v1)

Base URL: `https://api.example.com`

**Auth**
- Header: `Authorization: Bearer <token>`

**Common**
- Time format: ISO 8601 (UTC)
- Sort: `updated_at desc, id desc`
- Pagination: cursor

### List bookmarks
`GET /v1/bookmarks`

Query:
- `limit` (default 50, max 200)
- `cursor` (from `next_cursor`)
- `q` (search title/url/description)
- `tag` (repeatable)
- `folder_id`
- `updated_after` (ISO time)
- `include_deleted` (true/false)

Response:
```json
{
  "data": [
    {
      "id": "b_123",
      "title": "Example",
      "url": "https://example.com",
      "description": "",
      "tags": ["dev"],
      "folder_id": "f_1",
      "favicon_url": "https://...",
      "preview_image": "https://...",
      "owner_id": "u_1",
      "shared": false,
      "pinned": false,
      "source": "manual",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-02T10:00:00Z",
      "deleted_at": null
    }
  ],
  "next_cursor": "1"
}
```

### Get bookmark
`GET /v1/bookmarks/{id}`

### Incremental changes
`GET /v1/bookmarks/changes?since=2024-01-02T10:00:00Z`

Response:
```json
{
  "since": "2024-01-02T10:00:00Z",
  "now": "2024-01-03T10:00:00Z",
  "created_or_updated": [
    { "id": "b_123", "updated_at": "2024-01-03T09:00:00Z" }
  ],
  "deleted": [
    { "id": "b_999", "deleted_at": "2024-01-03T08:00:00Z" }
  ]
}
```

### Tags
`GET /v1/tags`

### Folders
`GET /v1/folders`

### Errors
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Token invalid" } }
```

### Field notes
- `owner_id` is required and matches the authenticated user.
- `shared` indicates the bookmark is visible to other users (access control handled server-side).
- `pinned` lets clients keep bookmarks at the top.
- `source` is one of: `manual`, `import`, `clipper`.
- `preview_image` is optional; omit or set to null when unavailable.

## Mock API server

Run:
```
node scripts/mock-bookmarks-api.js
```

Base URL: `http://localhost:8787`

Example:
```
curl "http://localhost:8787/v1/bookmarks?limit=2"
```

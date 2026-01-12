import http from "node:http";

const port = 8787;

const bookmarks = [
  {
    id: "b_123",
    title: "Example",
    url: "https://example.com",
    description: "",
    tags: ["dev"],
    folder_id: "f_1",
    favicon_url: "https://example.com/favicon.ico",
    preview_image: "https://example.com/og.png",
    owner_id: "u_1",
    shared: false,
    pinned: false,
    source: "manual",
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-02T10:00:00Z",
    deleted_at: null,
  },
  {
    id: "b_456",
    title: "Docs",
    url: "https://developer.mozilla.org",
    description: "MDN Web Docs",
    tags: ["docs", "web"],
    folder_id: "f_1",
    favicon_url: "https://developer.mozilla.org/favicon-48x48.cbbd161b.png",
    preview_image: "https://developer.mozilla.org/mdn-social-share.png",
    owner_id: "u_1",
    shared: true,
    pinned: true,
    source: "import",
    created_at: "2024-01-03T10:00:00Z",
    updated_at: "2024-01-03T11:00:00Z",
    deleted_at: null,
  },
  {
    id: "b_999",
    title: "Old Link",
    url: "https://example.org/old",
    description: "",
    tags: ["archive"],
    folder_id: null,
    favicon_url: null,
    preview_image: null,
    owner_id: "u_1",
    shared: false,
    pinned: false,
    source: "clipper",
    created_at: "2023-12-30T10:00:00Z",
    updated_at: "2024-01-01T12:00:00Z",
    deleted_at: "2024-01-03T08:00:00Z",
  },
];

const folders = [
  {
    id: "f_1",
    name: "Work",
    parent_id: null,
    created_at: "2024-01-01T09:00:00Z",
    updated_at: "2024-01-01T09:00:00Z",
  },
];

const tags = ["dev", "docs", "web", "archive"];

const json = (res, status, body) => {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Access-Control-Allow-Origin": "*",
  });
  res.end(payload);
};

const notFound = (res) =>
  json(res, 404, { error: { code: "NOT_FOUND", message: "Not found" } });

const parseBool = (value) => value === "true" || value === "1";

const matchesQuery = (bookmark, q) => {
  if (!q) return true;
  const hay = `${bookmark.title} ${bookmark.url} ${bookmark.description || ""}`.toLowerCase();
  return hay.includes(q.toLowerCase());
};

const filterBookmarks = (url) => {
  const q = url.searchParams.get("q");
  const folderId = url.searchParams.get("folder_id");
  const updatedAfter = url.searchParams.get("updated_after");
  const includeDeleted = parseBool(url.searchParams.get("include_deleted"));
  const tagParams = url.searchParams.getAll("tag");

  return bookmarks.filter((bookmark) => {
    if (!includeDeleted && bookmark.deleted_at) return false;
    if (folderId && bookmark.folder_id !== folderId) return false;
    if (tagParams.length > 0 && !tagParams.every((tag) => bookmark.tags.includes(tag)))
      return false;
    if (updatedAfter && bookmark.updated_at <= updatedAfter) return false;
    return matchesQuery(bookmark, q);
  });
};

const paginate = (items, url) => {
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const cursor = Number(url.searchParams.get("cursor") || 0);
  const page = items.slice(cursor, cursor + limit);
  const nextCursor = cursor + limit < items.length ? String(cursor + limit) : null;
  return { page, nextCursor };
};

const server = http.createServer((req, res) => {
  if (!req.url) return notFound(res);
  const url = new URL(req.url, `http://localhost:${port}`);

  if (req.method === "GET" && url.pathname === "/v1/bookmarks") {
    const filtered = filterBookmarks(url).sort((a, b) => {
      if (a.updated_at === b.updated_at) return b.id.localeCompare(a.id);
      return b.updated_at.localeCompare(a.updated_at);
    });
    const { page, nextCursor } = paginate(filtered, url);
    return json(res, 200, { data: page, next_cursor: nextCursor });
  }

  if (req.method === "GET" && url.pathname.startsWith("/v1/bookmarks/")) {
    const id = url.pathname.split("/").pop();
    const bookmark = bookmarks.find((item) => item.id === id);
    if (!bookmark) return notFound(res);
    return json(res, 200, bookmark);
  }

  if (req.method === "GET" && url.pathname === "/v1/bookmarks/changes") {
    const since = url.searchParams.get("since");
    const now = new Date().toISOString();
    const createdOrUpdated = bookmarks
      .filter((bookmark) => !bookmark.deleted_at && (!since || bookmark.updated_at > since))
      .map((bookmark) => ({ id: bookmark.id, updated_at: bookmark.updated_at }));
    const deleted = bookmarks
      .filter((bookmark) => bookmark.deleted_at && (!since || bookmark.deleted_at > since))
      .map((bookmark) => ({ id: bookmark.id, deleted_at: bookmark.deleted_at }));
    return json(res, 200, { since: since || null, now, created_or_updated: createdOrUpdated, deleted });
  }

  if (req.method === "GET" && url.pathname === "/v1/tags") {
    return json(res, 200, { data: tags });
  }

  if (req.method === "GET" && url.pathname === "/v1/folders") {
    return json(res, 200, { data: folders });
  }

  return notFound(res);
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock bookmarks API running at http://localhost:${port}`);
});

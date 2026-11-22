// Shared fetch() wrapper for Client Components calling this app's Route
// Handlers — every route already responds with the {data, pagination, error}
// envelope from lib/api-response.js. Returns {data, pagination} and throws
// on a non-ok response; callers that don't need pagination can destructure
// just `{ data }`.
export async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const payload = await res.json().catch(() => null);
  if (!res.ok || !payload) {
    throw new Error(payload?.error?.message || "Something went wrong.");
  }
  return { data: payload.data, pagination: payload.pagination };
}

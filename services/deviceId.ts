/**
 * Per-device rate-limit identity.
 *
 * The server keys its rate limiter on the `x-slang-device` header when present
 * (server.ts), because carrier-grade NAT puts many GCC mobile users behind one
 * IP. Until 23 Sep 2026 the client never sent the header, so every caller was
 * keyed by IP despite SECURITY.md saying otherwise. This mints a random token
 * once, stores it in localStorage, and attaches it to every API call.
 *
 * The token is random and not linked to identity. Clearing site data resets it.
 */
const KEY = 'slang_device_id';
const VALID = /^[A-Za-z0-9_-]{8,64}$/;

export function deviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id || !VALID.test(id)) {
      id = crypto.randomUUID().replace(/-/g, '');
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return ''; // storage blocked: the server falls back to IP
  }
}

/** JSON headers plus the device header. Use for every `/api/*` POST. */
export function apiHeaders(): Record<string, string> {
  const id = deviceId();
  return id ? { 'Content-Type': 'application/json', 'x-slang-device': id } : { 'Content-Type': 'application/json' };
}

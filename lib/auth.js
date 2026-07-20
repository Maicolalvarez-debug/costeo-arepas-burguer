const COOKIE_NAME = "costeo_auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 días

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-cambia-esto";
}

// Firma HMAC-SHA256 usando Web Crypto API (funciona tanto en el runtime
// de Node como en el Edge Runtime que usa el middleware de Next.js).
async function hmacHex(message, key) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Token = HMAC(APP_PASSWORD, SESSION_SECRET). No guarda la contraseña en la cookie,
// solo una firma que solo el servidor puede recrear.
export async function expectedToken() {
  const password = process.env.APP_PASSWORD || "";
  return hmacHex(password, secret());
}

export function checkPassword(candidate) {
  return candidate === (process.env.APP_PASSWORD || "");
}

export async function authCookie() {
  const value = await expectedToken();
  const parts = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${MAX_AGE_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function clearAuthCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0`;
}

export async function isRequestAuthed(cookieHeader) {
  if (!cookieHeader) return false;
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;
  const value = match.slice(COOKIE_NAME.length + 1);
  const expected = await expectedToken();
  return value === expected;
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;

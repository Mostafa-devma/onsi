// Shared helpers for the /api functions (files starting with "_" are not exposed as routes).
const crypto = require("crypto");

const MENU_KEY = "onsi:menu";

// Upstash Redis REST (what Vercel's "Upstash for Redis" integration provides). Both env-var
// naming schemes are accepted.
function kvConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

async function kv(command) {
  const cfg = kvConfig();
  if (!cfg) throw Object.assign(new Error("Database is not connected"), { status: 503 });
  const r = await fetch(cfg.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw Object.assign(new Error(data.error || "Database error"), { status: 502 });
  return data.result;
}

function passwordOk(given) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof given !== "string" || !given) return false;
  const a = crypto.createHash("sha256").update(given).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function bearer(req) {
  const h = req.headers.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7) : "";
}

// ---------- menu validation: only accept the shape the site renders ----------
const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
const PHOTO = /^[\w.-]{1,80}\.(jpe?g|png|webp)$/i;
const ID = /^[\w-]{1,60}$/;

function cleanItem(x, withSpecial) {
  if (!x || !ID.test(x.id) || !str(x.en, 120) || !str(x.ar, 120)) return null;
  const price = Number(x.price);
  if (!Number.isFinite(price) || price < 0 || price > 10000) return null;
  const photo = typeof x.photo === "string" && PHOTO.test(x.photo) ? x.photo : "";
  const item = { id: x.id, en: x.en.trim(), ar: x.ar.trim(), price, photo, available: x.available !== false };
  if (withSpecial) item.special = !!x.special;
  if (typeof x.alt === "string" && x.alt.length <= 200) item.alt = x.alt;
  return item;
}

function cleanList(list, withSpecial) {
  if (!Array.isArray(list) || list.length > 100) throw new Error("Invalid list");
  const out = list.map((x) => cleanItem(x, withSpecial));
  if (out.some((x) => !x)) throw new Error("Every dish needs an English name, an Arabic name and a valid price.");
  if (new Set(out.map((x) => x.id)).size !== out.length) throw new Error("Duplicate dish id");
  return out;
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat"];

function validateMenu(m) {
  if (!m || !Array.isArray(m.daily) || m.daily.length !== DAY_KEYS.length) throw new Error("Invalid menu");
  const daily = m.daily.map((d, i) => {
    if (!d || d.key !== DAY_KEYS[i]) throw new Error("Invalid day");
    return { key: d.key, en: String(d.en), short: String(d.short), ar: String(d.ar), dishes: cleanList(d.dishes, true) };
  });
  const menu = {
    version: 1,
    daily,
    mansaf: cleanList(m.mansaf, false),
    appetizers: cleanList(m.appetizers, false),
    salads: cleanList(m.salads, false),
    updatedAt: new Date().toISOString(),
  };
  const ids = [...daily.flatMap((d) => d.dishes), ...menu.mansaf, ...menu.appetizers, ...menu.salads].map((x) => x.id);
  if (new Set(ids).size !== ids.length) throw new Error("Two dishes share the same id");
  return menu;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

module.exports = { MENU_KEY, kv, kvConfig, passwordOk, bearer, validateMenu, send };

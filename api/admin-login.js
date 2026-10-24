// POST /api/admin-login  { password }  → 200 when it matches ADMIN_PASSWORD, and reports whether the database is connected
const { passwordOk, kvConfig, send } = require("./_lib");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(res, 405, { error: "Method not allowed" });
  }
  if (!process.env.ADMIN_PASSWORD) return send(res, 503, { error: "ADMIN_PASSWORD is not set in Vercel" });
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  // small delay makes password guessing slower
  await new Promise((r) => setTimeout(r, 400));
  if (!passwordOk(body.password)) return send(res, 401, { error: "Wrong password" });
  return send(res, 200, { ok: true, database: !!kvConfig() });
};

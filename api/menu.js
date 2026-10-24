// GET  /api/menu  → the live menu from the database (404 when none saved yet: the site then uses data/menu.json)
// PUT  /api/menu  → save the menu (admin only: "Authorization: Bearer <ADMIN_PASSWORD>")
const { MENU_KEY, kv, passwordOk, bearer, validateMenu, send } = require("./_lib");

module.exports = async (req, res) => {
  try {
    if (req.method === "GET") {
      const raw = await kv(["GET", MENU_KEY]);
      if (!raw) return send(res, 404, { error: "No menu saved yet" });
      return send(res, 200, JSON.parse(raw));
    }

    if (req.method === "PUT") {
      if (!passwordOk(bearer(req))) return send(res, 401, { error: "Wrong password" });
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      let menu;
      try {
        menu = validateMenu(body);
      } catch (e) {
        return send(res, 400, { error: e.message });
      }
      await kv(["SET", MENU_KEY, JSON.stringify(menu)]);
      return send(res, 200, { ok: true, updatedAt: menu.updatedAt });
    }

    res.setHeader("Allow", "GET, PUT");
    return send(res, 405, { error: "Method not allowed" });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || "Server error" });
  }
};

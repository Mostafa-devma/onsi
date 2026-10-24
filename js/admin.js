/* =========================================================
   ONSI — أُنسي · Menu admin
   Signs in against /api/admin-login, edits the menu in memory, saves with PUT /api/menu.
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const PASS_KEY = "onsi-admin-pass";
  const SECTIONS = {
    daily: { title: "Daily Meals", special: true },
    mansaf: { title: "Mansaf for Four", special: false },
    appetizers: { title: "Appetizers", special: false },
    salads: { title: "Salads", special: false },
  };

  let password = "";
  let menu = null;
  let original = ""; // JSON of the last saved state, to know when there are unsaved changes
  let section = "daily";
  let dayIdx = 0;
  let canSave = true;

  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ss = {
    get: () => { try { return sessionStorage.getItem(PASS_KEY) || ""; } catch { return ""; } },
    set: (v) => { try { v ? sessionStorage.setItem(PASS_KEY, v) : sessionStorage.removeItem(PASS_KEY); } catch {} },
  };

  /* ---------- feedback ---------- */
  let toastTimer;
  const toast = (msg, isError) => {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.toggle("is-error", !!isError);
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.hidden = true), 3200);
  };
  const notice = (html, isError) => {
    const el = $("#notice");
    el.innerHTML = html || "";
    el.classList.toggle("is-error", !!isError);
    el.hidden = !html;
  };
  const isDirty = () => menu && JSON.stringify(menu) !== original;
  const updateStatus = (text) => {
    const s = $("#status");
    const dirty = isDirty();
    s.className = "status" + (dirty ? " is-dirty" : text === "Saved" ? " is-saved" : "");
    s.textContent = dirty ? "Unsaved changes" : text || "All changes saved";
    $("#save-btn").disabled = !dirty || !canSave;
  };

  /* ---------- API ---------- */
  const api = async (url, opts = {}) => {
    const r = await fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", ...(password ? { Authorization: `Bearer ${password}` } : {}), ...(opts.headers || {}) },
      cache: "no-store",
    });
    let data = {};
    try { data = await r.json(); } catch {}
    return { status: r.status, ok: r.ok, data };
  };

  /* ---------- login ---------- */
  const signIn = async (pass, silent) => {
    const btn = $("#login-btn");
    const err = $("#login-error");
    btn.disabled = true;
    btn.textContent = "Checking…";
    err.hidden = true;
    let res;
    try {
      res = await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pass }) });
    } catch {
      res = null;
    }
    btn.disabled = false;
    btn.textContent = "Sign in";
    const fail = (msg) => {
      ss.set("");
      if (!silent) { err.textContent = msg; err.hidden = false; }
    };
    if (!res) return fail("Can't reach the server. Check your connection.");
    if (res.status === 404) return fail("The admin only works on the live Vercel site (the server functions aren't running here).");
    let data = {};
    try { data = await res.json(); } catch {}
    if (res.status === 503) return fail("ADMIN_PASSWORD isn't set in Vercel yet — add it in Project → Settings → Environment Variables.");
    if (!res.ok) return fail(data.error || "Wrong password");
    password = pass;
    ss.set(pass);
    $("#login").hidden = true;
    $("#app").hidden = false;
    await loadMenu(data.database);
  };

  $("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    signIn($("#password").value);
  });
  $("#logout-btn").addEventListener("click", () => {
    if (isDirty() && !confirm("You have unsaved changes. Log out anyway?")) return;
    ss.set("");
    location.reload();
  });

  /* ---------- load ---------- */
  const loadMenu = async (hasDatabase) => {
    canSave = hasDatabase !== false;
    let source = "database";
    const res = await api("/api/menu");
    if (res.ok && Array.isArray(res.data.daily)) {
      menu = res.data;
    } else {
      const r = await fetch("data/menu.json", { cache: "no-store" });
      menu = await r.json();
      source = res.status === 404 ? "default" : "fallback";
    }
    delete menu.updatedAt;
    original = JSON.stringify(menu);
    if (!canSave || res.status === 503) {
      canSave = false;
      notice("<b>The database isn't connected yet.</b> You can look around, but saving is off. In Vercel: <b>Storage → Create Database → Upstash for Redis</b>, connect it to this project, then redeploy.", true);
    } else if (source === "default") {
      notice("Showing the original menu. Your first <b>Save</b> will store it in the database, and from then on the website uses what you save here.");
    } else if (source === "fallback") {
      notice("Couldn't read the database just now, so this is the original menu. Reload before saving.", true);
    } else {
      notice("");
    }
    fillPhotoList();
    render();
  };

  /* ---------- rendering ---------- */
  const currentList = () => (section === "daily" ? menu.daily[dayIdx].dishes : menu[section]);

  const fillPhotoList = () => {
    const all = new Set();
    menu.daily.forEach((d) => d.dishes.forEach((x) => x.photo && all.add(x.photo)));
    ["mansaf", "appetizers", "salads"].forEach((k) => menu[k].forEach((x) => x.photo && all.add(x.photo)));
    $("#photo-list").innerHTML = [...all].sort().map((p) => `<option value="${esc(p)}"></option>`).join("");
  };

  const renderDays = () => {
    const days = $("#days");
    days.hidden = section !== "daily";
    if (section !== "daily") return;
    days.innerHTML = menu.daily
      .map((d, i) => {
        const on = d.dishes.filter((x) => x.available !== false).length;
        return `<button type="button" role="tab" data-day="${i}" aria-selected="${i === dayIdx}">${esc(d.en)} <span class="ar">${esc(d.ar)}</span> <span class="count">${on}/${d.dishes.length}</span></button>`;
      })
      .join("");
  };

  const dishRow = (x, i, n) => {
    const special = SECTIONS[section].special;
    const off = x.available === false;
    return `
      <li class="dish${off ? " is-off" : ""}" data-i="${i}">
        <div class="dish__thumb">${x.photo ? `<img src="assets/img/${esc(x.photo)}" alt="" onerror="this.replaceWith(document.createTextNode('no photo'))" />` : "no photo"}</div>
        <label class="lbl f-en">English name<input type="text" data-k="en" value="${esc(x.en)}" maxlength="120" placeholder="e.g. Chicken Kabsa" /></label>
        <label class="lbl f-ar">الاسم بالعربي<input type="text" data-k="ar" value="${esc(x.ar)}" maxlength="120" dir="rtl" lang="ar" placeholder="مثلاً: كبسة دجاج" /></label>
        <label class="lbl f-price price">Price<span>$</span><input type="number" data-k="price" value="${esc(x.price)}" min="0" max="10000" step="0.5" inputmode="decimal" /></label>
        <label class="lbl f-photo">Photo file<input type="text" data-k="photo" value="${esc(x.photo)}" list="photo-list" placeholder="daily-kabsa.jpg" /></label>
        <div class="toggles">
          <label class="toggle"><input type="checkbox" data-k="available" ${off ? "" : "checked"} /> Available</label>
          ${special ? `<label class="toggle"><input type="checkbox" class="special" data-k="special" ${x.special ? "checked" : ""} /> ONSI Special</label>` : ""}
        </div>
        <div class="row-actions">
          <button type="button" class="icon-btn" data-act="up" ${i === 0 ? "disabled" : ""} aria-label="Move up">↑</button>
          <button type="button" class="icon-btn" data-act="down" ${i === n - 1 ? "disabled" : ""} aria-label="Move down">↓</button>
          <button type="button" class="icon-btn danger" data-act="del" aria-label="Delete dish">✕</button>
        </div>
      </li>`;
  };

  const render = () => {
    $$(".sections__tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.section === section));
    renderDays();
    const list = currentList();
    $("#list-title").textContent = section === "daily" ? `${menu.daily[dayIdx].en} · ${menu.daily[dayIdx].ar}` : SECTIONS[section].title;
    const on = list.filter((x) => x.available !== false).length;
    $("#list-count").textContent = `${list.length} dish${list.length === 1 ? "" : "es"} · ${on} available`;
    $("#dishes").innerHTML = list.length ? list.map((x, i) => dishRow(x, i, list.length)).join("") : `<li class="empty">No dishes yet — add the first one below.</li>`;
    updateStatus();
  };

  /* ---------- editing ---------- */
  $("#dishes").addEventListener("input", (e) => {
    const input = e.target.closest("[data-k]");
    if (!input) return;
    const row = input.closest(".dish");
    const x = currentList()[Number(row.dataset.i)];
    const k = input.dataset.k;
    if (input.type === "checkbox") {
      x[k] = input.checked;
      if (k === "available") {
        row.classList.toggle("is-off", !input.checked);
        renderDays();
        const list = currentList();
        $("#list-count").textContent = `${list.length} dishes · ${list.filter((d) => d.available !== false).length} available`;
      }
    } else if (k === "price") {
      x.price = input.value === "" ? "" : Number(input.value);
    } else {
      x[k] = input.value;
      if (k === "photo") {
        const thumb = $(".dish__thumb", row);
        const v = input.value.trim();
        thumb.innerHTML = v ? `<img src="assets/img/${esc(v)}" alt="" onerror="this.replaceWith(document.createTextNode('no photo'))" />` : "no photo";
      }
    }
    updateStatus();
  });

  $("#dishes").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const list = currentList();
    const i = Number(btn.closest(".dish").dataset.i);
    if (btn.dataset.act === "up" && i > 0) [list[i - 1], list[i]] = [list[i], list[i - 1]];
    if (btn.dataset.act === "down" && i < list.length - 1) [list[i + 1], list[i]] = [list[i], list[i + 1]];
    if (btn.dataset.act === "del") {
      const name = list[i].en || list[i].ar || "this dish";
      if (!confirm(`Delete “${name}”? (Tip: switching off Available hides it without deleting.)`)) return;
      list.splice(i, 1);
    }
    render();
  });

  $("#add-btn").addEventListener("click", () => {
    const prefix = section === "daily" ? `daily-${menu.daily[dayIdx].key}` : section;
    const item = { id: `${prefix}-${Date.now().toString(36)}`, en: "", ar: "", price: "", photo: "", available: true };
    if (SECTIONS[section].special) item.special = false;
    currentList().push(item);
    render();
    const rows = $$(".dish");
    rows[rows.length - 1]?.querySelector('[data-k="en"]').focus();
  });

  $$(".sections__tab").forEach((t) =>
    t.addEventListener("click", () => {
      section = t.dataset.section;
      render();
    })
  );
  $("#days").addEventListener("click", (e) => {
    const b = e.target.closest("[data-day]");
    if (!b) return;
    dayIdx = Number(b.dataset.day);
    render();
  });

  $("#restore-btn").addEventListener("click", async () => {
    if (!confirm("Replace everything here with the original menu? Nothing changes on the website until you press Save.")) return;
    const r = await fetch("data/menu.json", { cache: "no-store" });
    menu = await r.json();
    fillPhotoList();
    render();
    toast("Original menu loaded — press Save to publish it");
  });

  /* ---------- save ---------- */
  const problems = () => {
    const all = [
      ...menu.daily.flatMap((d) => d.dishes.map((x) => [x, `${d.en}`])),
      ...["mansaf", "appetizers", "salads"].flatMap((k) => menu[k].map((x) => [x, SECTIONS[k].title])),
    ];
    for (const [x, where] of all) {
      if (!String(x.en).trim() || !String(x.ar).trim()) return `A dish in ${where} is missing its English or Arabic name.`;
      if (x.price === "" || !Number.isFinite(Number(x.price)) || Number(x.price) < 0) return `“${x.en || x.ar}” in ${where} needs a valid price.`;
      if (x.photo && !/^[\w.-]{1,80}\.(jpe?g|png|webp)$/i.test(x.photo.trim())) return `The photo name for “${x.en}” looks wrong (use a file name like daily-kabsa.jpg).`;
    }
    return "";
  };

  $("#save-btn").addEventListener("click", async () => {
    const p = problems();
    if (p) return toast(p, true);
    const btn = $("#save-btn");
    btn.disabled = true;
    btn.textContent = "Saving…";
    const body = JSON.parse(JSON.stringify(menu));
    const tidy = (x) => ({ ...x, en: x.en.trim(), ar: x.ar.trim(), photo: (x.photo || "").trim(), price: Number(x.price) });
    body.daily.forEach((d) => (d.dishes = d.dishes.map(tidy)));
    ["mansaf", "appetizers", "salads"].forEach((k) => (body[k] = body[k].map(tidy)));
    const res = await api("/api/menu", { method: "PUT", body: JSON.stringify(body) });
    btn.textContent = "Save changes";
    if (res.ok) {
      menu = body;
      original = JSON.stringify(menu);
      notice("");
      updateStatus("Saved");
      toast("Saved — the website now shows these changes");
    } else if (res.status === 401) {
      toast("Your session expired — sign in again", true);
      ss.set("");
      setTimeout(() => location.reload(), 1500);
    } else {
      toast(res.data.error || "Couldn't save. Try again.", true);
      updateStatus();
    }
  });

  window.addEventListener("beforeunload", (e) => {
    if (isDirty()) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // stay signed in for this browser tab
  const saved = ss.get();
  if (saved) signIn(saved, true);
})();

/* =========================================================
   ONSI — أُنسي · cart → WhatsApp order
   ========================================================= */
(() => {
  const WA_NUMBER = "9613706071";
  const STORE_KEY = "onsi-cart";
  const DETAILS_KEY = "onsi-details";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  const load = (k, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(k)) || fallback;
    } catch {
      return fallback;
    }
  };
  const save = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  };

  // { id: { name, ar, qty, price?, day? } } — insertion order is the order list order
  let cart = load(STORE_KEY, {});

  const { ar: AR, t } = window.ONSI_I18N || { ar: false, t: (s) => s };

  const count = () => Object.values(cart).reduce((n, i) => n + i.qty, 0);
  const total = () => Object.values(cart).reduce((t, i) => t + (i.price || 0) * i.qty, 0);
  const hasUnpriced = () => Object.values(cart).some((i) => !i.price);
  const nameOf = (id) => cart[id].name || id; // older saved carts keyed by name only
  const titleOf = (id) => (AR && cart[id].ar) || nameOf(id); // the name shown in the current language
  const subOf = (id) => (AR ? nameOf(id) : cart[id].ar || "");

  const setQty = (id, item, qty) => {
    if (qty <= 0) delete cart[id];
    else cart[id] = { ...item, qty };
    save(STORE_KEY, cart);
    render();
  };

  /* ---------- Orderable items: Daily Meals rows + Mansaf for four trays ---------- */
  const items = $$("[data-cart-id]").map((el) => ({
    id: el.dataset.cartId,
    slot: $(".js-cart-slot", el),
    item: {
      name: el.dataset.name,
      ar: el.dataset.ar,
      price: Number(el.dataset.price),
      day: el.dataset.day, // Daily Meals: which weekday
      note: el.dataset.note, // e.g. "Mansaf for 4"
    },
  }));

  // Keep a saved cart in step with the live menu (edited from /admin): refresh names and prices,
  // and drop dishes that were removed or marked sold out since they were added.
  const live = new Map(items.map((x) => [x.id, x.item]));
  let changed = false;
  Object.keys(cart).forEach((id) => {
    const now = live.get(id);
    if (!now) {
      delete cart[id];
      changed = true;
    } else if (now.price !== cart[id].price || now.name !== cart[id].name || now.ar !== cart[id].ar) {
      cart[id] = { ...now, qty: cart[id].qty };
      changed = true;
    }
  });
  if (changed) save(STORE_KEY, cart);

  items.forEach(({ id, slot, item }) =>
    slot.addEventListener("click", (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      setQty(id, item, (cart[id]?.qty || 0) + Number(btn.dataset.step));
      if (btn.dataset.step === "1") bump();
    })
  );

  /* ---------- Floating cart + drawer ---------- */
  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <button class="cart-fab" type="button" aria-haspopup="dialog" aria-controls="cart" hidden>
      <span>${t("Your order")}</span><b class="cart-fab__n">0</b>
    </button>
    <div class="cart-overlay" hidden></div>
    <aside class="cart" id="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title" hidden data-lenis-prevent>
      <div class="cart__head">
        <h2 id="cart-title">${AR ? "<em>طلبك</em>" : "Your <em>order</em>"}</h2>
        <button class="cart__close" type="button" aria-label="${t("Close")}">✕</button>
      </div>
      <ul class="cart__list"></ul>
      <p class="cart__total" hidden></p>
      <p class="cart__empty">${t("Nothing here yet. Add a dish from the menu.")}</p>
      <form class="cart__form">
        <label>${t("Name")}<input name="name" autocomplete="name" /></label>
        <label>${t("Delivery address")}<input name="address" autocomplete="street-address" /></label>
        <label>${t("Notes")}<textarea name="notes" rows="2" placeholder="${t("Allergies, timing, extra sauce…")}"></textarea></label>
        <p class="cart__hint">${t("Orders are cooked fresh the next day, 10 AM – 5 PM.")}</p>
        <button class="btn btn--accent cart__send" type="submit">${t("Send order on WhatsApp")}</button>
        <button class="cart__clear" type="button">${t("Clear order")}</button>
      </form>
    </aside>`
  );

  const fab = $(".cart-fab");
  const overlay = $(".cart-overlay");
  const drawer = $(".cart");
  const list = $(".cart__list", drawer);
  const totalEl = $(".cart__total", drawer);
  const form = $(".cart__form", drawer);

  const details = load(DETAILS_KEY, {});
  ["name", "address"].forEach((k) => (form.elements[k].value = details[k] || ""));
  form.addEventListener("input", () =>
    save(DETAILS_KEY, { name: form.elements.name.value, address: form.elements.address.value })
  );

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const stepper = (qty, label) => `
    <div class="qty" role="group" aria-label="${esc(label)} ${t("quantity")}">
      <button type="button" data-step="-1" aria-label="${t("Remove one")}">−</button>
      <span>${qty}</span>
      <button type="button" data-step="1" aria-label="${t("Add one")}">+</button>
    </div>`;

  function render() {
    items.forEach(({ id, slot, item }) => {
      const qty = cart[id]?.qty || 0;
      slot.innerHTML = qty
        ? stepper(qty, AR ? item.ar : item.name)
        : `<button type="button" class="dish__add" data-step="1">${t("Add to order")} <span>+</span></button>`;
    });

    const n = count();
    fab.hidden = n === 0;
    $(".cart-fab__n").textContent = n;
    drawer.classList.toggle("is-empty", n === 0);
    list.innerHTML = Object.keys(cart)
      .map((id) => {
        const { qty, price, day, note } = cart[id];
        const meta = [t(day || note || ""), price && `$${price * qty}`].filter(Boolean).join(" · ");
        return `
        <li data-id="${esc(id)}">
          <div>
            <strong>${esc(titleOf(id))}</strong>
            <span class="cart__ar${AR ? " cart__ar--en" : ""}" lang="${AR ? "en" : "ar"}">${esc(subOf(id))}</span>
            ${meta ? `<span class="cart__meta">${esc(meta)}</span>` : ""}
          </div>
          ${stepper(qty, titleOf(id))}
        </li>`;
      })
      .join("");

    const sum = total();
    totalEl.hidden = !sum;
    totalEl.innerHTML = `<span>${t("Total")}${hasUnpriced() ? ` <small>${t("(menu dishes priced on confirmation)")}</small>` : ""}</span><b>$${sum}</b>`;
  }

  list.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const id = btn.closest("li").dataset.id;
    setQty(id, cart[id], cart[id].qty + Number(btn.dataset.step));
  });

  const bump = () => {
    fab.classList.remove("is-bump");
    void fab.offsetWidth;
    fab.classList.add("is-bump");
  };

  /* ---------- Open / close ---------- */
  const lenis = () => window.onsiLenis;
  const open = () => {
    overlay.hidden = drawer.hidden = false;
    requestAnimationFrame(() => document.body.classList.add("cart-open"));
    lenis()?.stop();
    $(".cart__close", drawer).focus();
  };
  const close = () => {
    document.body.classList.remove("cart-open");
    lenis()?.start();
    setTimeout(() => (overlay.hidden = drawer.hidden = true), 450);
    fab.focus();
  };
  fab.addEventListener("click", open);
  overlay.addEventListener("click", close);
  $(".cart__close", drawer).addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("cart-open")) close();
  });

  $(".cart__clear", drawer).addEventListener("click", () => {
    cart = {};
    save(STORE_KEY, cart);
    render();
  });

  /* ---------- Send ---------- */
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!count()) return;
    const { name, address, notes } = form.elements;
    // The message goes out in the language the customer is using
    const lines = [t("Hi ONSI, I'd like to order:"), ""];
    Object.keys(cart).forEach((id) => {
      const { qty, price, day, note } = cart[id];
      let line = `• ${qty} × ${titleOf(id)}`;
      if (day || note) line += ` (${t(day || note)})`;
      if (price) line += ` — $${price * qty}`;
      lines.push(line);
    });
    const sum = total();
    if (sum) lines.push("", `${t("Total:")} $${sum}${hasUnpriced() ? ` ${t("+ menu dishes")}` : ""}`);
    lines.push("");
    if (name.value.trim()) lines.push(`${t("Name:")} ${name.value.trim()}`);
    if (address.value.trim()) lines.push(`${t("Delivery address:")} ${address.value.trim()}`);
    if (notes.value.trim()) lines.push(`${t("Notes:")} ${notes.value.trim()}`);
    if (!Object.values(cart).some((i) => i.day)) lines.push(t("Delivery: tomorrow"));
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  });

  render();
})();

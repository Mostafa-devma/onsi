/* =========================================================
   ONSI — أُنسي · Daily Meals (Monday → Saturday)
   Dishes come from window.ONSI_MENU.daily (loaded by boot.js, edited in /admin).
   Dishes marked unavailable (sold out) are left out.
   ========================================================= */
(() => {
  const DAYS = (window.ONSI_MENU?.daily || []).map((d) => ({
    ...d,
    dishes: (d.dishes || []).filter((x) => x.available !== false),
  }));

  const root = document.querySelector(".js-daily");
  if (!root) return;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ar: AR, t } = window.ONSI_I18N || { ar: false, t: (s) => s };
  // In Arabic the Arabic name is the title and the English one sits underneath
  const names = (en, ar) => ({
    title: AR ? ar : en,
    sub: AR
      ? `<span class="daily__ar daily__ar--en" lang="en" dir="ltr">${esc(en)}</span>`
      : `<span class="daily__ar" lang="ar" dir="rtl">${esc(ar)}</span>`,
  });

  // Orders go in a day ahead, so open on tomorrow (Sunday has no menu → Monday)
  const tomorrow = (new Date().getDay() + 1) % 7; // 0 = Sunday
  const tomorrowIdx = tomorrow === 0 ? -1 : tomorrow - 1;
  const startIdx = tomorrowIdx === -1 ? 0 : tomorrowIdx;

  const tabs = DAYS.map(
    (d, i) => `
      <button class="daily__tab" type="button" role="tab" id="daily-tab-${d.key}"
        aria-controls="daily-panel-${d.key}" aria-selected="${i === startIdx}" tabindex="${i === startIdx ? 0 : -1}">
        ${
          AR
            ? `<span class="daily__tab-en">${d.ar}</span><span class="daily__tab-ar daily__tab-ar--en" lang="en">${d.short}</span>`
            : `<span class="daily__tab-en"><span class="full">${d.en}</span><span class="short">${d.short}</span></span>
        <span class="daily__tab-ar">${d.ar}</span>`
        }
        ${i === tomorrowIdx ? `<span class="daily__tag">${t("Tomorrow")}</span>` : ""}
      </button>`
  ).join("");

  const panels = DAYS.map(
    (d, i) => `
      <div class="daily__panel" role="tabpanel" id="daily-panel-${d.key}" aria-labelledby="daily-tab-${d.key}" ${i === startIdx ? "" : "hidden"}>
        <ol class="daily__list">
          ${d.dishes.length ? "" : `<li class="daily__empty">${t("Nothing on the menu for this day yet.")}</li>`}
          ${d.dishes
            .map(
              ({ id, en, ar, price, special, photo }, j) => `
            <li class="daily__item" style="--i:${j}"
              data-cart-id="${esc(id)}" data-name="${esc(en)}" data-ar="${esc(ar)}" data-price="${price}" data-day="${d.en}">
              ${
                photo
                  ? `<button type="button" class="daily__thumb" data-full="assets/img/${esc(photo.replace(/\.(jpe?g|png|webp)$/i, "-lg.$1"))}" aria-label="${t("View photo")}: ${esc(names(en, ar).title)}">
                      <img src="assets/img/${esc(photo)}" alt="" loading="lazy" width="240" height="240" />
                    </button>`
                  : `<span class="daily__no">${String(j + 1).padStart(2, "0")}</span>`
              }
              <div class="daily__name">
                <h3>${esc(names(en, ar).title)}${special ? ` <span class="daily__special">${t("ONSI Special")}</span>` : ""}</h3>
                ${names(en, ar).sub}
              </div>
              <span class="daily__price"><small>$</small>${price}</span>
              <div class="daily__cart js-cart-slot"></div>
            </li>`
            )
            .join("")}
        </ol>
      </div>`
  ).join("");

  root.innerHTML = `
    <div class="daily__tabs" role="tablist" aria-label="${t("Day of the week")}">${tabs}</div>
    ${panels}`;

  const tabEls = [...root.querySelectorAll(".daily__tab")];
  const panelEls = [...root.querySelectorAll(".daily__panel")];
  const select = (i, focus) => {
    tabEls.forEach((t, j) => {
      t.setAttribute("aria-selected", j === i);
      t.tabIndex = j === i ? 0 : -1;
    });
    panelEls.forEach((p, j) => (p.hidden = j !== i));
    if (focus) tabEls[i].focus();
  };
  /* ---------- Photo viewer: tap a dish photo to see it large ---------- */
  document.body.insertAdjacentHTML(
    "beforeend",
    `<div class="photo-view" role="dialog" aria-modal="true" aria-label="Dish photo" hidden>
      <button class="photo-view__close" type="button" aria-label="${t("Close photo")}">✕</button>
      <figure class="photo-view__fig">
        <img class="photo-view__img" alt="" />
        <figcaption class="photo-view__cap">
          <span class="photo-view__day"></span>
          <strong class="photo-view__name"></strong>
          <span class="photo-view__ar" lang="ar" dir="rtl"></span>
          <span class="photo-view__price"></span>
        </figcaption>
      </figure>
    </div>`
  );
  const viewer = document.querySelector(".photo-view");
  const vImg = viewer.querySelector(".photo-view__img");
  let opener = null;
  let hideTimer = null;
  let current = ""; // the large image that should be showing; guards against late loads

  // Any [data-full] button inside an orderable item (Daily Meals rows, Mansaf trays) opens the viewer
  const openPhoto = (thumb) => {
    const row = thumb.closest("[data-cart-id]");
    opener = thumb;
    clearTimeout(hideTimer); // a pending close must not hide the photo we are opening now
    // Show the tapped picture at once (its small version is already loaded), never the previous one,
    // then swap in the large version when it has downloaded.
    const full = thumb.dataset.full;
    current = full;
    const small = thumb.querySelector("img");
    vImg.src = small ? small.currentSrc || small.src : full;
    viewer.classList.toggle("is-loading", !!small);
    const big = new Image();
    big.onload = () => {
      if (current !== full) return; // another photo was opened meanwhile
      vImg.src = full;
      viewer.classList.remove("is-loading");
    };
    big.src = full;
    const main = AR ? row.dataset.ar : row.dataset.name;
    const second = viewer.querySelector(".photo-view__ar");
    vImg.alt = main;
    viewer.querySelector(".photo-view__day").textContent = t(row.dataset.day || row.dataset.note || "");
    viewer.querySelector(".photo-view__name").textContent = main;
    second.textContent = AR ? row.dataset.name : row.dataset.ar;
    second.lang = AR ? "en" : "ar";
    second.dir = AR ? "ltr" : "rtl";
    viewer.querySelector(".photo-view__price").textContent = `$${row.dataset.price}`;
    viewer.hidden = false;
    requestAnimationFrame(() => viewer.classList.add("is-open"));
    window.onsiLenis?.stop();
    viewer.querySelector(".photo-view__close").focus();
  };
  const closePhoto = () => {
    viewer.classList.remove("is-open");
    window.onsiLenis?.start();
    current = "";
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      viewer.hidden = true;
      vImg.removeAttribute("src"); // nothing stale left for the next open
    }, 400);
    opener?.focus();
  };

  document.addEventListener("click", (e) => {
    const thumb = e.target.closest("[data-cart-id] [data-full]");
    if (thumb) openPhoto(thumb);
  });
  viewer.addEventListener("click", (e) => {
    if (!e.target.closest(".photo-view__img")) closePhoto();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !viewer.hidden) closePhoto();
  });

  tabEls.forEach((t, i) => {
    t.addEventListener("click", () => select(i));
    t.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      select((i + step + tabEls.length) % tabEls.length, true);
    });
  });
})();

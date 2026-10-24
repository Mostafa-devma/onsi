/* =========================================================
   ONSI — أُنسي · Appetizers, Salads and Mansaf for four
   Items come from window.ONSI_MENU (loaded by boot.js, edited in /admin).
   Items marked unavailable (sold out) are left out.
   ========================================================= */
(() => {
  const MENU = window.ONSI_MENU || {};
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ar: AR, t } = window.ONSI_I18N || { ar: false, t: (s) => s };
  const shown = (list) => (list || []).filter((x) => x.available !== false);
  const large = (photo) => photo.replace(/\.(jpe?g|png|webp)$/i, "-lg.$1");

  /* ---------- Appetizers & Salads: same row markup as Daily Meals (cart + photo viewer reuse it) ---------- */
  const NOTES = { appetizers: "Appetizer", salads: "Salad" };
  document.querySelectorAll(".js-carte").forEach((list) => {
    const key = list.dataset.list;
    list.innerHTML = shown(MENU[key])
      .map(
        ({ id, en, ar, price, photo }, j) => `
        <li class="daily__item" style="--i:${j}"
          data-cart-id="${esc(id)}" data-name="${esc(en)}" data-ar="${esc(ar)}" data-price="${price}" data-note="${NOTES[key]}">
          ${
            photo
              ? `<button type="button" class="daily__thumb" data-full="assets/img/${esc(large(photo))}" aria-label="${t("View photo")}: ${esc(AR ? ar : en)}">
                  <img src="assets/img/${esc(photo)}" alt="" loading="lazy" width="240" height="240" />
                </button>`
              : `<span class="daily__no">${String(j + 1).padStart(2, "0")}</span>`
          }
          <div class="daily__name">
            <h3>${esc(AR ? ar : en)}</h3>
            ${
              AR
                ? `<span class="daily__ar daily__ar--en" lang="en" dir="ltr">${esc(en)}</span>`
                : `<span class="daily__ar" lang="ar" dir="rtl">${esc(ar)}</span>`
            }
          </div>
          <span class="daily__price"><small>$</small>${price}</span>
          <div class="daily__cart js-cart-slot"></div>
        </li>`
      )
      .join("");
  });

  /* ---------- Mansaf for four: photo cards ---------- */
  const grid = document.querySelector(".js-mansaf");
  if (grid) {
    grid.innerHTML = shown(MENU.mansaf)
      .map(({ id, en, ar, price, photo, alt }) => {
        const title = AR ? ar : en;
        const sub = AR ? en : ar;
        const img = photo
          ? `<button type="button" class="tray__zoom" data-full="assets/img/${esc(large(photo))}" aria-label="${t("View photo")}: ${esc(AR ? title : alt || title)}"><img src="assets/img/${esc(photo)}" alt="" loading="lazy" width="640" height="640" /></button>`
          : `<span class="tray__mark" lang="ar">${esc(ar)}</span>`;
        return `
          <li class="tray${photo ? "" : " tray--text"}" data-cart-id="${esc(id)}" data-name="${esc(en)}" data-ar="${esc(ar)}" data-price="${price}" data-note="Mansaf for 4">
            <div class="tray__img">${img}<span class="tray__serves">${t("Serves 4")}</span></div>
            <div class="tray__body">
              <div class="tray__row"><h3>${esc(title)}</h3><span class="tray__price"><small>$</small>${price}</span></div>
              <span class="tray__ar" lang="${AR ? "en" : "ar"}">${esc(sub)}</span>
              <div class="tray__cart js-cart-slot"></div>
            </div>
          </li>`;
      })
      .join("");
  }
})();

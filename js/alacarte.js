/* =========================================================
   ONSI — أُنسي · Appetizers & Salads
   Source: the owner's price notes. [English, Arabic, price $, photo?]
   A photo is only set when it is that exact dish.
   ========================================================= */
(() => {
  const LISTS = {
    appetizers: {
      note: "Appetizer",
      items: [
        ["Fattoush", "فتوش", 6, "app-fattoush.jpg"],
        ["Tabbouleh", "تبولة", 4, "app-tabbouleh.jpg"],
        ["Burghul with Tomato", "برغل على بندورة", 5, "app-burghul.jpg"],
        ["Mdardara", "مدردرة", 5, "app-mdardara.jpg"],
        ["Hindbeh", "هندباء", 5, "app-hindbeh.jpg"],
        ["Mdallal", "مدلل", 5, "app-mdallal.jpg"],
        ["Muhammara", "محمرة", 5, "app-muhammara.jpg"],
        ["Cheese Rakakat", "رقاقات جبنة", 5, "app-rakakat.jpg"],
        ["Kibbeh", "كبب", 5, "app-kibbeh.jpg"],
        ["Warak Enab bi Zeit", "ورق عنب بزيت", 5, "app-warak.jpg"],
      ],
    },
    salads: {
      note: "Salad",
      items: [
        ["Kale Salad with Grilled Chicken", "سلطة الكايل مع الدجاج المشوي", 12, "salad-kale.jpg"],
        ["Marie Salad with Grilled Shrimp", "سلطة ماري مع القريدس المشوي", 12, "salad-marie.jpg"],
        ["Pasta Salad with Boiled Shrimp", "سلطة الباستا مع القريدس المسلوق", 12, "salad-pasta-shrimp.jpg"],
        ["Mexican Salad with Grilled Beef", "سلطة مكسيكية مع اللحم المشوي", 13, "salad-mexican.jpg"],
        ["Tuna Pasta Salad", "سلطة الباستا مع التونا", 10, "salad-tuna.jpg"],
        ["Caesar Salad with Grilled Chicken", "سلطة السيزر مع الدجاج المشوي", 12, "salad-caesar.jpg"],
      ],
    },
  };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const { ar: AR, t } = window.ONSI_I18N || { ar: false, t: (s) => s };

  // Same row markup as Daily Meals, so the cart and the photo viewer pick these up too
  document.querySelectorAll(".js-carte").forEach((list) => {
    const { note, items } = LISTS[list.dataset.list];
    list.innerHTML = items
      .map(
        ([en, ar, price, photo], j) => `
        <li class="daily__item" style="--i:${j}"
          data-cart-id="${list.dataset.list}-${j + 1}" data-name="${esc(en)}" data-ar="${esc(ar)}" data-price="${price}" data-note="${note}">
          ${
            photo
              ? `<button type="button" class="daily__thumb" data-full="assets/img/${photo.replace(".jpg", "-lg.jpg")}" aria-label="${t("View photo")}: ${esc(AR ? ar : en)}">
                  <img src="assets/img/${photo}" alt="" loading="lazy" width="240" height="240" />
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
})();

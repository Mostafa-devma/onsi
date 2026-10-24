/* =========================================================
   ONSI — أُنسي · Daily Meals (Monday → Saturday)
   Source: the weekly menu cards. [English, Arabic, price $, ONSI Kitchen Special?, photo?]
   A photo is only set when it is that exact dish.
   ========================================================= */
(() => {
  const DAYS = [
    {
      key: "mon", en: "Monday", short: "Mon", ar: "الاثنين",
      dishes: [
        ["Chicken Kabsa with Special Sauce", "كبسة دجاج مع صوص خاص", 10, false, "daily-kabsa.jpg"],
        ["Creamy Shrimp Pasta", "معكرونة كريمية بالقريدس", 12, false, "daily-shrimp-pasta.jpg"],
        ["Grilled Kebab with Rice", "كباب مشوي مع رز", 12, false, "daily-kebab.jpg"],
        ["Roast Beef with Mashed Potatoes", "روستو مع بطاطا بوريه", 14, false, "daily-roast-beef.jpg"],
      ],
    },
    {
      key: "tue", en: "Tuesday", short: "Tue", ar: "الثلاثاء",
      dishes: [
        ["Laban Emmo with Rice", "لبن أمو مع رز", 12, false, "daily-laban-emmo.jpg"],
        ["Chicken Stroganoff with Rice", "ستروغنوف دجاج مع رز", 12, false, "daily-stroganoff.jpg"],
        ["Freek with Lamb Shanks", "فريك مع موزات غنم", 13, false, "daily-freek-shanks.jpg"],
        ["Mahshi Koussa and Warak Enab with Lamb Slices", "كوسى وورق عنب مع شرحات غنم", 14, false, "daily-mahshi.jpg"],
      ],
    },
    {
      key: "wed", en: "Wednesday", short: "Wed", ar: "الأربعاء",
      dishes: [
        ["Shrimp Rice with Sauce", "رز بالقريدس مع صوص", 12, false, "daily-shrimp-rice.jpg"],
        ["Fish Sayadieh", "صيادية سمك", 13, false, "daily-sayadieh.jpg"],
        ["Pesto Freek with Shrimp", "فريك بالبيستو مع قريدس", 13, true, "daily-pesto-freek.jpg"],
        ["Shrimp and Spinach Lasagna", "لازانيا بالقريدس والسبانخ", 13, true, "daily-lasagna.jpg"],
      ],
    },
    {
      key: "thu", en: "Thursday", short: "Thu", ar: "الخميس",
      dishes: [
        ["Molokhia with Chicken and Rice", "ملوخية بالدجاج مع رز", 11, false, "daily-molokhia.jpg"],
        ["Kibbeh in Yogurt Sauce with Rice", "كبة بلبن مع رز", 10, false, "daily-kibbeh-laban.jpg"],
        ["Moghrabieh with Chicken", "مغربية بدجاج", 11, false, "daily-moghrabieh.jpg"],
        ["Grilled Beef Steak with Vegetables and Mushroom Sauce", "ستيك لحمة مشوي مع خضار وصوص فطر", 15, false, "daily-beef-steak.jpg"],
      ],
    },
    {
      key: "fri", en: "Friday", short: "Fri", ar: "الجمعة",
      dishes: [
        ["Grilled Chicken Skewers with Rice", "سياخ الدجاج المشوي مع رز", 10, false, "daily-chicken-skewers.jpg"],
        ["Ablama in Yogurt Sauce with Rice", "أبلما بلبن مع رز", 11, false, "daily-ablama.jpg"],
        ["Baked Kibbeh with Cucumber Yogurt", "كبة بالصينية مع لبن وخيار", 13, false, "daily-baked-kibbeh.jpg"],
        ["Grilled Chicken Steak with Vegetables and Mushroom Sauce", "ستيك دجاج مشوي مع خضار وصوص فطر", 13, true, "daily-chicken-steak.jpg"],
      ],
    },
    {
      key: "sat", en: "Saturday", short: "Sat", ar: "السبت",
      dishes: [
        ["Lamb Mansaf", "منسف لحمة", 10, false, "daily-mansaf.jpg"],
        ["Potato Soufflé with Salad", "بطاطا سوفليه مع سلطة", 10, false, "daily-potato-souffle.jpg"],
        ["Shrimp Fajitas with Rice", "فاهيتا بالقريدس مع رز", 11, false, "daily-fajitas.jpg"],
        ["Fettuccine with Grilled Chicken or Grilled Shrimp", "فوتوتشيني مع دجاج مشوي أو قريدس مشوي", 12, false, "daily-fettuccine.jpg"],
      ],
    },
  ];

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
          ${d.dishes
            .map(
              ([en, ar, price, special, photo], j) => `
            <li class="daily__item" style="--i:${j}"
              data-cart-id="daily-${d.key}-${j + 1}" data-name="${esc(en)}" data-ar="${esc(ar)}" data-price="${price}" data-day="${d.en}">
              ${
                photo
                  ? `<button type="button" class="daily__thumb" data-full="assets/img/${photo.replace(".jpg", "-lg.jpg")}" aria-label="${t("View photo")}: ${esc(names(en, ar).title)}">
                      <img src="assets/img/${photo}" alt="" loading="lazy" width="240" height="240" />
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

  // Any [data-full] button inside an orderable item (Daily Meals rows, Mansaf trays) opens the viewer
  const openPhoto = (thumb) => {
    const row = thumb.closest("[data-cart-id]");
    opener = thumb;
    vImg.src = thumb.dataset.full;
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
    setTimeout(() => (viewer.hidden = true), 400);
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

/* =========================================================
   ONSI — أُنسي · Arabic / English
   English is written in the HTML. When Arabic is chosen, this file swaps the
   page text, flips the layout to right-to-left, and gives the other scripts
   window.ONSI_I18N.t() for their own labels. Runs before every other script.
   ========================================================= */
(() => {
  const KEY = "onsi-lang";
  let lang = "en";
  try {
    lang = localStorage.getItem(KEY) === "ar" ? "ar" : "en";
  } catch {}
  const q = new URLSearchParams(location.search).get("lang");
  if (q === "ar" || q === "en") lang = q;
  const AR = lang === "ar";

  // Short labels the other scripts look up by their English text
  const WORDS = {
    Monday: "الاثنين", Tuesday: "الثلاثاء", Wednesday: "الأربعاء", Thursday: "الخميس", Friday: "الجمعة", Saturday: "السبت",
    Tomorrow: "غداً",
    "Serves 4": "لـ ٤ أشخاص",
    "Nothing on the menu for this day yet.": "لا توجد أطباق لهذا اليوم بعد.",
    "ONSI Special": "مميز من أُنسي",
    "Mansaf for 4": "منسف لـ ٤ أشخاص",
    Appetizer: "مقبلات",
    Salad: "سلطة",
    "Day of the week": "يوم الأسبوع",
    "View photo": "عرض الصورة",
    "Close photo": "إغلاق الصورة",
    "Your order": "طلبك",
    "Add to order": "أضف للطلب",
    "Remove one": "أنقص واحد",
    "Add one": "زِد واحد",
    quantity: "الكمية",
    Close: "إغلاق",
    "Nothing here yet. Add a dish from the menu.": "لا يوجد شيء بعد. أضف طبقاً من القائمة.",
    Name: "الاسم",
    "Delivery address": "عنوان التوصيل",
    Notes: "ملاحظات",
    "Allergies, timing, extra sauce…": "حساسية، توقيت، صوص إضافي…",
    "Orders are cooked fresh the next day, 10 AM – 5 PM.": "تُطبخ الطلبات طازجة في اليوم التالي، من 10 صباحاً حتى 5 مساءً.",
    "Send order on WhatsApp": "أرسل الطلب على واتساب",
    "Clear order": "امسح الطلب",
    Total: "المجموع",
    "(menu dishes priced on confirmation)": "(تُسعَّر عند التأكيد)",
    "Hi ONSI, I'd like to order:": "مرحبا أُنسي، بدي اطلب:",
    "Total:": "المجموع:",
    "+ menu dishes": "+ أطباق تُسعَّر لاحقاً",
    "Name:": "الاسم:",
    "Delivery address:": "عنوان التوصيل:",
    "Notes:": "ملاحظات:",
    "Delivery: tomorrow": "التوصيل: بكرا",
  };
  const t = (en) => (AR && WORDS[en]) || en;
  window.ONSI_I18N = { lang, ar: AR, t };

  const root = document.documentElement;
  root.lang = lang;
  root.dir = AR ? "rtl" : "ltr";

  // Language button in the top bar: remember the choice and reload in that language
  const toggle = document.querySelector("[data-lang-toggle]");
  if (toggle) {
    toggle.textContent = AR ? "EN" : "عربي";
    toggle.setAttribute("aria-label", AR ? "Switch to English" : "التبديل إلى العربية");
    toggle.lang = AR ? "en" : "ar";
    toggle.addEventListener("click", () => {
      try {
        localStorage.setItem(KEY, AR ? "en" : "ar");
      } catch {}
      const url = new URL(location.href);
      url.searchParams.delete("lang");
      location.replace(url.toString());
    });
  }
  if (!AR) return;

  document.title = "أُنسي · مطبخ بيتي";
  const $$ = (s) => document.querySelectorAll(s);
  const set = (sel, html) => $$(sel).forEach((el) => (el.innerHTML = html));

  /* ---------- Static page text ---------- */
  [
    // top bar
    ['.nav__links a[href="#menu"]', "القائمة"],
    ['.nav__links a[href="#daily"] .nav__full', "أطباق اليوم"],
    ['.nav__links a[href="#daily"] .nav__short', "اليومي"],
    ['.nav__links a[href="#ritual"]', "كيف نعمل"],
    ['.nav__links a[href="#plan"] .nav__full', "الاشتراك الشهري"],
    ['.nav__links a[href="#plan"] .nav__short', "الاشتراك"],
    ['.nav__links a[href="#kitchen"]', "المطبخ"],
    [".nav__cta-full", 'اطلب · <span dir="ltr">03 706 071</span>'],
    [".nav__cta-short", "اتصل"],
    // hero
    [".hero__meta--l span:nth-child(1)", "مطبخ بيتي"],
    [".hero__meta--l span:nth-child(2)", "لبنان"],
    [".hero__meta--r span:nth-child(1)", "طلبات يومية"],
    [".hero__meta--r span:nth-child(2)", "من 10 صباحاً حتى 5 مساءً"],
    [".hero__sub .line:nth-child(1) > span", "غداء بيتي، مطبوخ على مهل"],
    [".hero__sub .line:nth-child(2) > span", "ويوصل لباب بيتك — كل يوم عمل."],
    [".hero__scroll span", "مرّر للأسفل"],
    // manifesto
    [".manifesto__phon", "اسم · من الأُنس والأُلفة"],
    [".manifesto__mean", "دفء أن تكون بين من تحب."],
    [
      ".manifesto__text",
      "سمّينا مطبخنا على اسم شعور. الطاولة التي لا يستعجل عليها أحد، والطنجرة التي تتّسع دائماً لشخص إضافي. أُنسي يطبخ هذا الشعور كل يوم — على مهل، بكرم، وبصدق — ويرسله إلى بابك وهو لا يزال دافئاً.",
    ],
    // marquee (both rows)
    [
      ".marquee__row",
      '<span>منسف</span><i>✦</i><span class="it">فريك بالبيستو</span><i>✦</i><span>كبة</span><i>✦</i><span class="it">ملوخية</span><i>✦</i><span>كبسة دجاج</span><i>✦</i><span class="it">هندباء</span><i>✦</i><span>سلطات</span><i>✦</i>',
    ],
    // our menu
    [".menu__head .eyebrow", "من مطبخ أُنسي"],
    [".menu__title", "<em>قائمتنا</em>"],
    [".menu__intro", "طبخ لبناني بيتي وأطباق من ابتكارنا، تُحضَّر طازجة كل صباح ومرتّبة حسب الصنف."],
    // daily meals
    [".daily__head .eyebrow", "أطباق اليوم"],
    [".daily__title", "مائدة جديدة، <em>كل يوم.</em>"],
    [".daily__sub", "أربعة أطباق بيتية كل يوم، من الاثنين إلى السبت. اختر يومك واطلب قبل يوم."],
    [
      ".daily__note",
      'تُطبخ طازجة صباح نفس اليوم · التوصيل من 10 صباحاً حتى 5 مساءً · <span class="daily__note-special">مميز من أُنسي</span> = طبق من ابتكارنا',
    ],
    [".panel__close", 'إغلاق <span aria-hidden="true">✕</span>'],
    // mansaf for four
    [".mansaf__head .eyebrow", "طلب مسبق · لـ ٤ أشخاص"],
    [".mansaf__title", "مناسف <em>لأربعة.</em>"],
    [".mansaf__intro", "صوانٍ احتفالية للعائلة كلها، مزيّنة بالكاجو والمكسرات. يرجى الطلب قبل يوم."],
    // appetizers & salads
    ["#appetizers .eyebrow", "مازة"],
    ["#appetizers .carte__title", "مقبلات"],
    ["#appetizers .carte__note", "تُحضَّر طازجة كل صباح · ابتداءً من $4"],
    ["#salads .eyebrow", "حجم كبير"],
    ["#salads .carte__title", "<em>سلطات</em>"],
    ["#salads .carte__note", "كل سلطة مع 100 غرام دجاج أو لحم أو قريدس مشوي"],
    // how it works
    [".ritual .eyebrow", "كيف نعمل"],
    [".ritual__title", "يوم في <em>حياة</em> غدائك"],
    [".js-clock-time", "أمس · 3:00 مساءً"],
    // meal plan
    [".plan__sticker", "جديد"],
    [".plan__copy .eyebrow", "اشتراك أُنسي الشهري"],
    [".plan__title", "غداؤك اليومي، <em>مضمون.</em>"],
    [".plan__price .per", "/ شهرياً"],
    [".plan__list li:nth-child(1)", "<span>01</span> طبق رئيسي كل يوم عمل"],
    [".plan__list li:nth-child(2)", "<span>02</span> سلطة بروتين إلى جانبه"],
    [".plan__list li:nth-child(3)", "<span>03</span> توصيل لباب بيتك"],
    [".plan__list li:nth-child(4)", "<span>04</span> يعني تقريباً <strong>$16 باليوم</strong> لوجبة بيتية حقيقية"],
    [".plan__copy .btn", "اشترك بالخطة"],
    // kitchen
    [".kitchen__text .eyebrow", "هنا نطبخ"],
    [".kitchen__text h2", "مطبخ نظيف ومشرق.<br /><em>مفتوح من العاشرة.</em>"],
    [".kitchen__ar", "المطبخ المركزي"],
    // the onsi world
    [".world__title", "عالم <em>أُنسي</em>"],
    [".stat:nth-child(1) .stat__l", "شخص يتابعون المطبخ"],
    [".stat:nth-child(2) .stat__n", "10<small>ص</small>–5<small>م</small>"],
    [".stat:nth-child(2) .stat__l", "ساعات الطلب اليومية"],
    [".stat:nth-child(3) .stat__n small", "يوم"],
    [".stat:nth-child(3) .stat__l", "اطلب قبل يوم، يُطبخ طازجاً"],
    // footer
    [".cta .eyebrow", "جوعان لبكرا؟"],
    [".cta__title .line:nth-child(1) > span", "اطلب"],
    [".cta__title .line:nth-child(2) > span", "<em>قبل يوم.</em>"],
    [".cta__info span:nth-child(1)", "طلبات يومية · من 10 صباحاً حتى 5 مساءً"],
    [".cta__info span:nth-child(2)", "التوصيل متوفر"],
    [".cta__info span:nth-child(3)", "اطلب قبل يوم"],
    [".cta__bottom > span", '© <span class="js-year">2026</span> مطبخ أُنسي'],
    [".js-totop", "للأعلى ↑"],
  ].forEach(([sel, html]) => set(sel, html));

  /* ---------- Menu category cards: Arabic title on top, English name small ---------- */
  const CARDS = [
    ["أطباق رئيسية", "Main Dishes", "رز بالزعفران مع سياخ الدجاج المشوي، وروستو على بطاطا بوريه ناعمة. أطباق مشبعة لكل يوم.", "أطباق هذا الأسبوع"],
    ["مناسف <em>لأربعة</em>", "Mansaf for Four", "سبع صوانٍ احتفالية لأربعة أشخاص، ابتداءً من $32. لحم، دجاج، سياخ أو قريدس، على الرز أو الفريك.", "الصواني والأسعار"],
    ["مقبلات", "Appetizers", "عشرة أصناف مازة ابتداءً من $4: فتوش، هندباء، محمرة، كبة، رقاقات وغيرها.", "الأصناف والأسعار"],
    ["سلطات", "Salads", "ست سلطات كبيرة مع دجاج أو لحم أو قريدس مشوي، ابتداءً من $10.", "الأصناف والأسعار"],
    ["طلبك <em>الخاص</em>", "Special Orders", "عزائم، غداء عائلي، موائد إفطار. قل لنا شو نفسك فيه ونحنا منطبخو.", "راسلنا"],
  ];
  $$(".menu__grid > .cat").forEach((card, i) => {
    const c = CARDS[i];
    if (!c) return;
    card.querySelector(".cat__title").innerHTML = c[0];
    card.querySelector(".cat__ar").textContent = c[1];
    card.querySelector(".cat__desc").textContent = c[2];
    card.querySelector(".cat__cta").innerHTML = `${c[3]} <i aria-hidden="true">→</i>`;
  });
  set(".cat__badge", "لـ ٤ أشخاص · طلب مسبق");

  /* ---------- How it works: steps and the clock labels ---------- */
  const STEPS = [
    ["قبل بيوم", "تطلب", 'اتصل بنا أو راسلنا على <strong dir="ltr">03 706 071</strong>. يرجى الطلب قبل يوم لنتسوّق لك مكوّنات طازجة.', "أمس · 3:00 مساءً"],
    ["10:00 صباحاً", "نطبخ", "يفتح المطبخ وتبدأ الطناجر. كل شيء يُطبخ صباح نفس اليوم، ولا شيء يُسخَّن من الأمس.", "اليوم · 10:00 صباحاً"],
    ["قبل 5:00 مساءً", "يوصل لعندك", "التوصيل متوفر. وجبتك تصل إلى بابك مغلّفة بعناية، ولا تزال تحمل دفء الطبخ.", "اليوم · 5:00 مساءً"],
  ];
  $$(".ritual__steps .step").forEach((step, i) => {
    const s = STEPS[i];
    if (!s) return;
    step.querySelector(".step__time").textContent = s[0];
    step.querySelector("h3").textContent = s[1];
    step.querySelector("p").innerHTML = s[2];
    step.dataset.label = s[3];
  });

  /* ---------- The ONSI world list: Arabic title, English small ---------- */
  ["أطباق اليوم", "سلطات", "مقبلات", "طلبات خاصة", "آراؤكم"].forEach((ar, i) => {
    const row = $$(".world__list li")[i];
    if (!row) return;
    const en = row.querySelector(".t").textContent;
    row.querySelector(".t").textContent = ar;
    row.querySelector(".a").textContent = en;
  });

  /* ---------- WhatsApp messages and the desktop cursor labels ---------- */
  const WA = {
    "Hi ONSI, I'd like to place a special order": "مرحبا أُنسي، بدي اعمل طلب خاص",
    "Hi ONSI, I'd like to share some feedback": "مرحبا أُنسي، حابب شارككم رأيي",
    "Hi ONSI, I'd like to join the meal plan": "مرحبا أُنسي، بدي اشترك بالخطة الشهرية",
  };
  $$('a[href*="wa.me"][href*="text="]').forEach((a) => {
    const msg = decodeURIComponent(a.getAttribute("href").split("text=")[1]);
    if (WA[msg]) a.setAttribute("href", "https://wa.me/9613706071?text=" + encodeURIComponent(WA[msg]));
  });
  const CURSOR = { View: "عرض", Call: "اتصل", Chat: "راسلنا", Join: "اشترك", Top: "للأعلى", Order: "اطلب" };
  $$("[data-cursor]").forEach((el) => CURSOR[el.dataset.cursor] && (el.dataset.cursor = CURSOR[el.dataset.cursor]));
})();

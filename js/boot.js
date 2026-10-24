/* =========================================================
   ONSI — أُنسي · load the menu, then start the page scripts
   The menu lives in the Vercel database (edited from /admin). If that is not
   set up or not reachable (e.g. local preview), the bundled data/menu.json is used.
   ========================================================= */
(() => {
  const SCRIPTS = ["js/daily.js", "js/alacarte.js", "js/main.js", "js/cart.js"];

  const getJSON = async (url) => {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  };

  const loadInOrder = (list) =>
    list.reduce(
      (chain, src) =>
        chain.then(
          () =>
            new Promise((resolve, reject) => {
              const s = document.createElement("script");
              s.src = src;
              s.onload = resolve;
              s.onerror = reject;
              document.body.appendChild(s);
            })
        ),
      Promise.resolve()
    );

  (async () => {
    let menu = null;
    try {
      menu = await getJSON("/api/menu");
    } catch {}
    if (!menu || !Array.isArray(menu.daily)) menu = await getJSON("data/menu.json");
    window.ONSI_MENU = menu;
    await loadInOrder(SCRIPTS);
  })();
})();

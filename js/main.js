/* =========================================================
   ONSI — أُنسي · scroll motion
   GSAP + ScrollTrigger + Lenis
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  $(".js-year").textContent = new Date().getFullYear();

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduced && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.onsiLenis = lenis; // cart drawer pauses page scroll while open
  }

  const scrollToEl = (target) => {
    if (lenis) {
      lenis.resize(); // page height changes when a panel opens or closes
      lenis.scrollTo(target, { duration: 1.4 });
    } else {
      const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
    }
  };

  /* ---------- Category panels: stay hidden until a category card (or link) opens one ---------- */
  const panels = $$("[data-panel]");
  const markCards = () =>
    $$(".cat__card[href^='#']").forEach((card) => {
      const t = $(card.getAttribute("href"));
      const open = !!t && !t.closest("[data-panel]")?.hidden && !t.closest("[data-col]")?.hidden;
      card.toggleAttribute("aria-current", open && !!t.closest("[data-panel]"));
    });
  const openPanel = (target) => {
    const panel = target.closest("[data-panel]");
    panels.forEach((p) => (p.hidden = p !== panel));
    panel.hidden = false;
    // Appetizers & Salads share one section: show just the column that was asked for
    const col = target.closest("[data-col]");
    $$("[data-col]", panel).forEach((c) => (c.hidden = !!col && c !== col));
    panel.classList.toggle("is-single", !!col);
    if (!reduced) gsap.fromTo(panel, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", clearProps: "transform" });
    ScrollTrigger.refresh();
    markCards();
  };
  const closePanel = (panel) => {
    panel.hidden = true;
    ScrollTrigger.refresh();
    markCards();
    scrollToEl($("#menu"));
  };
  $$("[data-close-panel]").forEach((btn) =>
    btn.addEventListener("click", () => closePanel(btn.closest("[data-panel]")))
  );

  // Anchor links go through Lenis; a link into a hidden panel opens that panel first
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? 0 : $(id);
      if (target === null) return;
      e.preventDefault();
      if (target !== 0 && target.closest("[data-panel]")) {
        openPanel(target);
        requestAnimationFrame(() => scrollToEl(target));
      } else {
        scrollToEl(target);
      }
    });
  });

  /* ---------- Mobile menu ---------- */
  const burger = $(".nav__burger");
  const mnav = $(".mnav");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("mnav-open", open);
    if (open) {
      $(".nav").classList.remove("is-hidden");
      lenis?.stop();
    } else {
      lenis?.start();
    }
  };
  burger.addEventListener("click", () => setMenu(!document.body.classList.contains("mnav-open")));
  // Capture phase: close (and restart Lenis) before the anchor handler above scrolls
  mnav.addEventListener("click", (e) => e.target.closest("a") && setMenu(false), true);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("mnav-open")) setMenu(false);
  });
  window.matchMedia("(min-width: 961px)").addEventListener("change", (e) => e.matches && setMenu(false));

  /* ---------- Clock ticks (built before anything measures) ---------- */
  const ticks = $(".clock__ticks");
  const NS = "http://www.w3.org/2000/svg";
  // Watch-style dial: fine minute dots, slim hour indices, numerals only at 12 / 3 / 6 / 9
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const at = (r) => [200 + Math.sin(a) * r, 200 - Math.cos(a) * r];
    if (i % 15 === 0) {
      const [x, y] = at(146);
      const t = document.createElementNS(NS, "text");
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      t.textContent = i === 0 ? 12 : i / 5;
      ticks.appendChild(t);
    }
    if (i % 5 === 0) {
      const [x1, y1] = at(i % 15 === 0 ? 156 : 160);
      const [x2, y2] = at(170);
      const l = document.createElementNS(NS, "line");
      l.setAttribute("x1", x1);
      l.setAttribute("y1", y1);
      l.setAttribute("x2", x2);
      l.setAttribute("y2", y2);
      l.setAttribute("class", i % 15 === 0 ? "major" : "hour");
      ticks.appendChild(l);
    } else {
      const [cx, cy] = at(168);
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", cx);
      c.setAttribute("cy", cy);
      c.setAttribute("r", 0.9);
      ticks.appendChild(c);
    }
  }

  /* ---------- Split manifesto into words ---------- */
  $$(".js-words").forEach((el) => {
    el.innerHTML = el.textContent
      .trim()
      .split(/\s+/)
      .map((w) => `<span class="w">${w}</span>`)
      .join(" ");
  });

  /* ---------- Loader → hero intro ---------- */
  document.body.classList.add("is-loading");
  if (lenis) lenis.stop();

  // Real progress: fonts + the images visible on first paint. Never hold the page longer than MAX_WAIT.
  const MAX_WAIT = 2500;
  const imgReady = (img) =>
    img.complete
      ? Promise.resolve()
      : new Promise((r) => {
          img.addEventListener("load", r, { once: true });
          img.addEventListener("error", r, { once: true });
        });
  const assets = [
    document.fonts ? document.fonts.ready : Promise.resolve(),
    ...$$('img:not([loading="lazy"])').map(imgReady),
  ];

  const counter = { v: 0 };
  const draw = () => {
    $(".js-count").textContent = String(Math.round(counter.v)).padStart(2, "0");
    gsap.set(".loader__ar", { backgroundPosition: `${counter.v}% 0` });
    gsap.set(".loader__line span", { scaleX: counter.v / 100 });
  };
  let finish;
  const loaded = new Promise((r) => (finish = r));
  let done = 0;
  let forced = false;
  const advance = (pct) =>
    gsap.to(counter, {
      v: pct,
      duration: reduced ? 0.1 : 0.6,
      ease: "power2.out",
      overwrite: true,
      onUpdate: draw,
      onComplete: () => pct === 100 && finish(),
    });
  assets.forEach((p) =>
    p.then(() => {
      if (forced) return;
      done++;
      advance(Math.round((done / assets.length) * 100));
    })
  );
  setTimeout(() => {
    if (done < assets.length) {
      forced = true;
      advance(100);
    }
  }, MAX_WAIT);

  loaded.then(() => {
    const out = gsap.timeline({
      onComplete: () => {
        $(".loader").remove();
        document.body.classList.remove("is-loading");
        if (lenis) lenis.start();
        ScrollTrigger.refresh();
      },
    });
    out
      .to(".loader__inner", { opacity: 0, y: -30, duration: 0.5, ease: "power2.in" })
      .to(".loader__panel--top", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.1")
      .to(".loader__panel--bottom", { yPercent: 100, duration: 1.1, ease: "expo.inOut" }, "<")
      .from(".hero__word .ch", { yPercent: 110, rotate: 8, opacity: 0, duration: 1.3, stagger: 0.07, ease: "expo.out" }, "-=0.55")
      .from(".hero__plate", { scale: 0, rotate: -200, duration: 1.5, ease: "expo.out" }, "<0.1")
      .from(".hero__ring", { opacity: 0, scale: 0.7, duration: 1.2, ease: "expo.out" }, "<0.3")
      .from(".hero__sub .line > span", { yPercent: 105, duration: 1, stagger: 0.1, ease: "expo.out" }, "<0.1")
      .from([".hero__meta", ".hero__scroll"], { opacity: 0, y: 16, duration: 0.9, stagger: 0.06, ease: "power3.out" }, "<0.2")
      .from(".nav", { opacity: 0, duration: 0.9, ease: "power3.out" }, "<"); // opacity only: the hide-on-scroll class owns transform
  });

  /* ---------- RITUAL CLOCK: walks through the day on its own, no scroll-jacking ---------- */
  const steps = $$(".step");
  const hourHand = $(".clock__hand--h");
  const minHand = $(".clock__hand--m");
  const arc = $(".clock__arc");
  const timeLabel = $(".js-clock-time");
  const moments = steps.map((s) => ({ h: Number(s.dataset.h), label: s.dataset.label })); // hours since yesterday 00:00
  const span = moments[moments.length - 1].h - moments[0].h;
  const dial = { hr: (moments[0].h % 12) * 30, min: 0 }; // cumulative, so hands only ever move forward
  let current = 0;

  gsap.set([hourHand, minHand], { svgOrigin: "200 200" });
  gsap.set(hourHand, { rotate: dial.hr });
  gsap.set(arc, { strokeDashoffset: 1 });

  const showMoment = (i) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, j) => s.classList.toggle("is-active", j === i));
    const { h, label } = moments[i];
    dial.hr += ((((h % 12) * 30 - dial.hr) % 360) + 360) % 360;
    dial.min += 360;
    const d = reduced ? 0 : 2.2;
    const soft = "sine.inOut";
    gsap.to(hourHand, { rotate: dial.hr, duration: d, ease: soft, overwrite: true });
    gsap.to(minHand, { rotate: dial.min, duration: d, ease: soft, overwrite: true });
    gsap.to(arc, { strokeDashoffset: 1 - (h - moments[0].h) / span, duration: d, ease: soft, overwrite: true });
    gsap.to(timeLabel, {
      opacity: 0,
      y: -6,
      duration: d * 0.3,
      ease: "power2.in",
      overwrite: true,
      onComplete: () => {
        timeLabel.textContent = label;
        gsap.to(timeLabel, { opacity: 1, y: 0, duration: d * 0.4, ease: "power2.out" });
      },
    });
  };

  let timer = null;
  const play = () => {
    if (reduced || timer) return;
    timer = setInterval(() => showMoment((current + 1) % steps.length), 4800);
  };
  const pause = () => {
    clearInterval(timer);
    timer = null;
  };
  steps.forEach((s, i) => {
    const pick = () => {
      pause();
      showMoment(i);
      play();
    };
    s.addEventListener("click", pick);
    s.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), pick()));
  });
  ScrollTrigger.create({
    trigger: ".ritual",
    start: "top 70%",
    end: "bottom 30%",
    onToggle: (self) => (self.isActive ? play() : pause()),
  });

  if (reduced) {
    document.documentElement.classList.add("reduced");
    $$(".js-price, .js-num").forEach((el) => (el.textContent = Number(el.dataset.to).toLocaleString("en-US")));
    return; // keep the page static and fully readable
  }

  /* ---------- Global: progress bar + hide-on-scroll nav ---------- */
  gsap.to(".progress span", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
  });

  const nav = $(".nav");
  ScrollTrigger.create({
    start: 200,
    end: "max",
    onUpdate: (self) => nav.classList.toggle("is-hidden", self.direction === 1),
    onLeaveBack: () => nav.classList.remove("is-hidden"),
  });

  /* ---------- HERO: scrolls away normally, content eases out ---------- */
  gsap
    .timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 },
    })
    .to(".hero__title", { yPercent: 18, opacity: 0.2, ease: "none" }, 0)
    .to(".hero__plate", { rotate: 50, ease: "none" }, 0)
    .to(".hero__bg img", { yPercent: 10, scale: 1.16, ease: "none" }, 0)
    .to([".hero__sub", ".hero__meta", ".hero__scroll"], { opacity: 0, y: -30, ease: "none", duration: 0.5 }, 0);

  /* ---------- MANIFESTO ---------- */
  gsap.from(".manifesto__def > *", {
    y: 50,
    opacity: 0,
    stagger: 0.1,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".manifesto__def", start: "top 80%" },
  });
  gsap.to(".manifesto__text .w", {
    opacity: 1,
    stagger: 0.08,
    ease: "none",
    scrollTrigger: { trigger: ".manifesto__text", start: "top 78%", end: "bottom 50%", scrub: true },
  });

  /* ---------- MARQUEE: loops, speeds up and flips with scroll ---------- */
  const track = $(".js-marquee");
  gsap.set(track, { rotate: -2.5 });
  const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: "none", repeat: -1 });
  let dir = 1;
  const boost = { v: 1 };
  if (lenis) {
    lenis.on("scroll", ({ velocity, direction }) => {
      if (direction) dir = direction;
      const target = dir * (1 + Math.min(Math.abs(velocity) / 6, 6));
      gsap.to(boost, {
        v: target,
        duration: 0.3,
        overwrite: true,
        onUpdate: () => loop.timeScale(boost.v),
      });
      gsap.to(boost, { v: dir, duration: 1.2, delay: 0.3, ease: "power2.out", onUpdate: () => loop.timeScale(boost.v) });
    });
  }

  /* ---------- MENU: categories fade up as they enter, no pinning ---------- */
  gsap.from(".menu__head > *", {
    y: 40,
    opacity: 0,
    stagger: 0.1,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: { trigger: ".menu", start: "top 75%" },
  });
  ScrollTrigger.batch(".cat", {
    start: "top 88%",
    once: true,
    onEnter: (els) =>
      gsap.from(els, { y: 40, opacity: 0, stagger: 0.08, duration: 1.1, ease: "power3.out" }),
  });

  /* ---------- MANSAF FOR FOUR ---------- */
  gsap.from(".mansaf__head > *", {
    y: 40,
    opacity: 0,
    stagger: 0.1,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: { trigger: ".mansaf", start: "top 75%" },
  });
  ScrollTrigger.batch(".tray", {
    start: "top 88%",
    once: true,
    onEnter: (els) => gsap.from(els, { y: 40, opacity: 0, stagger: 0.08, duration: 1.1, ease: "power3.out" }),
  });

  /* ---------- APPETIZERS & SALADS ---------- */
  gsap.utils.toArray(".carte__head").forEach((head) =>
    gsap.from(head.children, {
      y: 40,
      opacity: 0,
      stagger: 0.1,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: { trigger: head, start: "top 80%" },
    })
  );

  /* ---------- DAILY MEALS ---------- */
  gsap.from([".daily__head > *", ".daily__tabs"], {
    y: 40,
    opacity: 0,
    stagger: 0.1,
    duration: 1.2,
    ease: "power3.out",
    scrollTrigger: { trigger: ".daily", start: "top 72%" },
  });

  /* ---------- RITUAL: reveal (the clock itself runs on a timer, set up above) ---------- */
  gsap.from(".ritual__title, .ritual__left .eyebrow", {
    y: 60,
    opacity: 0,
    stagger: 0.1,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".ritual", start: "top 70%" },
  });
  gsap.from(".ritual__right", {
    scale: 0.94,
    opacity: 0,
    duration: 1.8,
    ease: "power3.out",
    scrollTrigger: { trigger: ".ritual", start: "top 65%" },
  });
  gsap.from(".step", {
    y: 30,
    opacity: 0,
    stagger: 0.12,
    duration: 1.2,
    ease: "power3.out",
    clearProps: "opacity,transform", // hand opacity back to the .is-active CSS
    scrollTrigger: { trigger: ".ritual__steps", start: "top 80%" },
  });

  /* ---------- PLAN ---------- */
  gsap.fromTo(".plan__bg-word", { xPercent: 10 }, {
    xPercent: -40,
    ease: "none",
    scrollTrigger: { trigger: ".plan", start: "top bottom", end: "bottom top", scrub: true },
  });
  gsap.to(".plan__bowl:not(.plan__bowl--2)", {
    rotate: 70,
    y: -40,
    ease: "none",
    scrollTrigger: { trigger: ".plan", start: "top bottom", end: "bottom top", scrub: true },
  });
  gsap.to(".plan__bowl--2", {
    rotate: -90,
    y: 50,
    ease: "none",
    scrollTrigger: { trigger: ".plan", start: "top bottom", end: "bottom top", scrub: true },
  });
  gsap.from(".plan__sticker", {
    scale: 0,
    rotate: -120,
    duration: 1.2,
    ease: "back.out(2)",
    scrollTrigger: { trigger: ".plan__visual", start: "top 70%" },
  });
  gsap.from(".plan__copy > *", {
    y: 50,
    opacity: 0,
    stagger: 0.1,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".plan__copy", start: "top 75%" },
  });

  const countUp = (el) => {
    const to = Number(el.dataset.to);
    const o = { v: 0 };
    gsap.to(o, {
      v: to,
      duration: to > 100 ? 2.2 : 1.2,
      ease: "power3.out",
      onUpdate: () => (el.textContent = Math.round(o.v).toLocaleString("en-US")),
      scrollTrigger: { trigger: el, start: "top 85%" },
    });
  };
  $$(".js-price, .js-num").forEach(countUp);

  /* ---------- KITCHEN: simple fade-in, no pinning ---------- */
  gsap.from([".kitchen__text > *", ".kitchen__frame"], {
    y: 50,
    opacity: 0,
    stagger: 0.1,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".kitchen", start: "top 70%" },
  });

  /* ---------- WORLD: rows rise, image follows the cursor ---------- */
  gsap.from(".world__head > *", {
    y: 60,
    opacity: 0,
    stagger: 0.1,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".world", start: "top 70%" },
  });
  gsap.from(".world__list a", {
    yPercent: 100,
    opacity: 0,
    stagger: 0.07,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".world__list", start: "top 80%" },
  });
  gsap.from(".stat", {
    y: 60,
    opacity: 0,
    stagger: 0.12,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".stats", start: "top 85%" },
  });

  /* ---------- CTA ---------- */
  gsap.from(".cta__title .line > span", {
    yPercent: 105,
    stagger: 0.12,
    duration: 1.3,
    ease: "expo.out",
    scrollTrigger: { trigger: ".cta", start: "top 65%" },
  });
  gsap.from([".cta .eyebrow", ".cta__phone", ".cta__actions", ".cta__info"], {
    y: 40,
    opacity: 0,
    stagger: 0.1,
    duration: 1.1,
    ease: "expo.out",
    scrollTrigger: { trigger: ".cta__title", start: "top 70%" },
  });
  gsap.fromTo(".cta__giant", { yPercent: 40, scale: 0.85 }, {
    yPercent: 0,
    scale: 1,
    ease: "none",
    scrollTrigger: { trigger: ".cta__giant", start: "top bottom", end: "bottom bottom", scrub: true },
  });

  /* ---------- Cursor + magnetic buttons ---------- */
  if (finePointer) {
    const cursor = $(".cursor");
    const label = $(".cursor__label");
    const cx = gsap.quickTo(cursor, "x", { duration: 0.25, ease: "power3.out" });
    const cy = gsap.quickTo(cursor, "y", { duration: 0.25, ease: "power3.out" });
    window.addEventListener("mousemove", (e) => {
      cx(e.clientX);
      cy(e.clientY);
    });
    $$("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => {
        label.textContent = el.dataset.cursor;
        cursor.classList.add("is-big");
      });
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-big"));
    });

    $$(".magnetic").forEach((el) => {
      const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.35);
        my((e.clientY - r.top - r.height / 2) * 0.35);
      });
      el.addEventListener("mouseleave", () => {
        mx(0);
        my(0);
      });
    });
  } else {
    $(".cursor").remove();
  }

  // Images can shift layout once decoded — remeasure
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();

/* ==========================================================================
   Motion layer — GSAP + ScrollTrigger.
   Loaded after main.js. If GSAP failed to load, this file does nothing and
   the CSS fallbacks in style.css (reveal / marquee / splash keyframes) apply.
   ========================================================================== */
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  gsap.registerPlugin(window.ScrollTrigger);
  document.documentElement.classList.add("gsap");

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------ */
  /* Momentum scrolling (ScrollSmoother). Touch devices keep native scroll. */
  /* ------------------------------------------------------------------ */
  var smoother = null;
  if (!reduced && window.ScrollSmoother && document.getElementById("smooth-wrapper")) {
    gsap.registerPlugin(window.ScrollSmoother);
    smoother = window.ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.3,          // seconds to "catch up" to the native scroll position
      smoothTouch: false,
      effects: false
    });
    // in-page links glide instead of jumping
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var hash = a.getAttribute("href");
      var target = hash === "#top" || hash === "#" ? 0 : document.querySelector(hash);
      if (target === null) return;
      e.preventDefault();
      smoother.scrollTo(target, true, target === 0 ? undefined : "top 60px");
    });
  }
  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(s)); };

  /* Split an element's text into word (+ character) spans, keeping inline tags like <em>. */
  function split(el, mode) {
    if (!el || el.dataset.split) return [];
    el.dataset.split = "1";
    if (!el.hasAttribute("aria-label") && !el.closest("[aria-hidden='true']")) {
      el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    }
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 1) { walk(child); return; }
        if (child.nodeType !== 3) return;
        var frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
          var w = document.createElement("span");
          w.className = "w";
          w.setAttribute("aria-hidden", "true");
          if (mode === "words") {
            w.textContent = part;
            out.push(w);
          } else {
            part.split("").forEach(function (c) {
              var ch = document.createElement("span");
              ch.className = "ch";
              ch.textContent = c;
              w.appendChild(ch);
              out.push(ch);
            });
          }
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      });
    })(el);
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Hero intro (plays after the splash, or straight away)               */
  /* ------------------------------------------------------------------ */
  // Built up front (paused) so the hero is already in its "before" state while the splash covers it.
  var heroTl = null;
  if (!reduced) {
    var first = split($(".hero__vname-first"));
    var last = split($(".hero__lastname"));
    heroTl = gsap.timeline({ paused: true, defaults: { ease: "power4.out" } })
      .from(".hero__sky .sky", { clipPath: "inset(100% 0% 0% 0%)", duration: 1.3, ease: "power4.inOut" }, 0)
      .from(first, { opacity: 0, yPercent: -30, duration: 1, stagger: 0.07 }, 0.15)
      .from(".hero .sky__script", { opacity: 0, y: 30, duration: 1 }, 0.7)
      .from(last, { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.045 }, 0.55)
      .from(".hero__rail span", { opacity: 0, y: -10, duration: 0.6, stagger: 0.08 }, 0.6)
      .from(".hero__info > *", { opacity: 0, y: 28, duration: 0.9, stagger: 0.08 }, 0.7)
      .from(".band", { yPercent: 120, opacity: 0, duration: 1 }, 0.9);
  }
  function heroIntro() { if (heroTl) heroTl.play(); }

  /* ------------------------------------------------------------------ */
  /* Splash                                                              */
  /* ------------------------------------------------------------------ */
  (function splash() {
    var el = $("#splash");
    if (!el) { heroIntro(); return; }

    var seen = false;
    try { seen = sessionStorage.getItem("yg-splash") === "1"; } catch (e) { /* ignore */ }
    if (seen || reduced) { el.parentNode.removeChild(el); heroIntro(); return; }

    document.body.classList.add("is-loading");
    if (smoother) smoother.paused(true);
    var bar = $("#splashBar");
    var count = $("#splashCount");
    var prog = { v: 0 };
    function paint() {
      var v = Math.round(prog.v);
      if (bar) bar.style.width = v + "%";
      if (count) count.textContent = ("00" + v).slice(-3);
    }

    gsap.timeline({ defaults: { ease: "power4.out" } })
      .from(".splash__first", { yPercent: 105, duration: 0.9 })
      .from(".splash__last", { yPercent: 105, duration: 0.9 }, "<0.12")
      .from(".splash__script", { opacity: 0, y: 14, duration: 0.7, ease: "power2.out" }, "-=0.4")
      .from(".splash__meta span, .splash__foot", { opacity: 0, y: 8, duration: 0.6, stagger: 0.06 }, 0.1)
      .from(".splash__spark", { scale: 0, rotate: -120, duration: 1, ease: "back.out(2)" }, 0.4);

    // count to 90 while the page loads, then finish
    var counting = gsap.to(prog, { v: 90, duration: 1.5, ease: "power2.inOut", onUpdate: paint });

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      counting.kill();
      try { sessionStorage.setItem("yg-splash", "1"); } catch (e) { /* ignore */ }
      gsap.timeline()
        .to(prog, { v: 100, duration: 0.35, ease: "power1.out", onUpdate: paint })
        .to(".splash__inner", { y: -50, opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.1")
        .to(".splash__foot, .splash__meta, .splash__spark", { opacity: 0, duration: 0.3 }, "<")
        .to(el, { yPercent: -100, duration: 1, ease: "power4.inOut" }, "-=0.15")
        .add(function () { document.body.classList.remove("is-loading"); if (smoother) smoother.paused(false); heroIntro(); }, "-=0.55")
        .add(function () { if (el.parentNode) el.parentNode.removeChild(el); ScrollTrigger.refresh(); });
    }

    var minTime = new Promise(function (r) { setTimeout(r, 1600); });
    var loaded = new Promise(function (r) {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", r);
      setTimeout(r, 4000); // don't wait forever on a slow asset
    });
    Promise.all([minTime, loaded]).then(finish);
    el.addEventListener("click", finish);
    setTimeout(finish, 6000); // hard failsafe
  })();

  if (reduced) return; // everything below is decorative motion

  /* ------------------------------------------------------------------ */
  /* Topbar: hide on scroll down, show on scroll up                      */
  /* ------------------------------------------------------------------ */
  var topbar = $(".topbar");
  var showBar = gsap.from(topbar, { yPercent: -100, paused: true, duration: 0.35, ease: "power2.out" }).progress(1);
  ScrollTrigger.create({
    start: "top -120",
    end: "max",
    onUpdate: function (self) { self.direction === -1 ? showBar.play() : showBar.reverse(); },
    onLeaveBack: function () { showBar.play(); }
  });

  /* ------------------------------------------------------------------ */
  /* Marquee band: endless loop that speeds up / reverses with scroll    */
  /* ------------------------------------------------------------------ */
  var loop = gsap.to(".band__track", { xPercent: -50, duration: 32, ease: "none", repeat: -1 });
  loop.totalTime(32 * 500); // start far into the loop so a reversed timeScale never hits time 0
  var boost = gsap.quickTo(loop, "timeScale", { duration: 0.6, ease: "power2.out" });
  var settle;
  ScrollTrigger.create({
    onUpdate: function (self) {
      var dir = self.direction;
      boost(dir * gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 400));
      clearTimeout(settle);
      settle = setTimeout(function () { boost(dir); }, 160);
    }
  });

  /* ------------------------------------------------------------------ */
  /* Hero parallax                                                       */
  /* ------------------------------------------------------------------ */
  gsap.to(".hero__lastname", {
    xPercent: -10, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });
  gsap.to(".hero__info", {
    yPercent: -12, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  /* ------------------------------------------------------------------ */
  /* Section headers                                                     */
  /* ------------------------------------------------------------------ */
  $$(".sec-head").forEach(function (head) {
    var chars = split($(".sec-head__title", head));
    gsap.timeline({ scrollTrigger: { trigger: head, start: "top 85%" }, defaults: { ease: "power4.out" } })
      .from(chars, { yPercent: 100, opacity: 0, rotate: 6, duration: 0.9, stagger: 0.03 })
      .from($(".sec-head__no", head), { opacity: 0, x: -16, duration: 0.6 }, 0.1)
      .from($(".sec-head__note", head), { opacity: 0, y: 14, rotate: -14, duration: 0.8, ease: "back.out(2)" }, 0.35);
  });

  /* ------------------------------------------------------------------ */
  /* About                                                               */
  /* ------------------------------------------------------------------ */
  var words = split($(".about__big"), "words");
  gsap.fromTo(words, { opacity: 0.15 }, {
    opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: ".about__big", start: "top 80%", end: "bottom 45%", scrub: true }
  });
  gsap.from(".about__copy > p:not(.about__big), .about__interests .eyebrow", {
    opacity: 0, y: 30, duration: 0.9, stagger: 0.12, ease: "power3.out",
    scrollTrigger: { trigger: ".about__copy", start: "top 70%" }
  });
  gsap.from(".stamps li", {
    scale: 0, rotate: -30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "back.out(2.2)",
    scrollTrigger: { trigger: ".stamps", start: "top 90%" }
  });
  gsap.from(".ticket", {
    y: 80, rotate: 14, opacity: 0, duration: 1.1, ease: "power4.out",
    scrollTrigger: { trigger: ".about__side", start: "top 80%" }
  });

  /* ------------------------------------------------------------------ */
  /* Works                                                               */
  /* ------------------------------------------------------------------ */
  $$(".work").forEach(function (work) {
    var cover = $(".work__cover", work);
    var img = $("img", cover);
    var flip = work.classList.contains("work--flip");
    gsap.timeline({ scrollTrigger: { trigger: work, start: "top 78%" }, defaults: { ease: "power4.out" } })
      .from(cover, { clipPath: flip ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)", duration: 1.3, ease: "power4.inOut" })
      .from(img, { scale: 1.45, duration: 1.6 }, 0)
      .from($(".work__fig", cover), { opacity: 0, y: 10, duration: 0.5 }, 0.9)
      .from($$(".work__body > *", work), { opacity: 0, y: 34, duration: 0.9, stagger: 0.07 }, 0.25);
    gsap.fromTo(img, { yPercent: -5 }, {
      yPercent: 5, ease: "none",
      scrollTrigger: { trigger: cover, start: "top bottom", end: "bottom top", scrub: true }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Timeline + skills                                                   */
  /* ------------------------------------------------------------------ */
  var tl = $(".tl");
  if (tl) {
    var line = document.createElement("span");
    line.className = "tl__progress";
    line.setAttribute("aria-hidden", "true");
    tl.appendChild(line);
    gsap.fromTo(line, { scaleY: 0 }, {
      scaleY: 1, ease: "none",
      scrollTrigger: { trigger: tl, start: "top 70%", end: "bottom 65%", scrub: true }
    });
    $$(".tl__item", tl).forEach(function (item) {
      gsap.from(item.children, {
        opacity: 0, x: -30, duration: 0.8, stagger: 0.07, ease: "power3.out",
        scrollTrigger: { trigger: item, start: "top 80%" }
      });
    });
  }
  gsap.from(".skills", {
    opacity: 0, y: 60, rotate: 2, duration: 1, ease: "power4.out",
    scrollTrigger: { trigger: ".skills", start: "top 85%" }
  });
  $$(".skills__group").forEach(function (g) {
    gsap.from($$(".chips li", g), {
      opacity: 0, scale: 0.6, duration: 0.5, stagger: 0.04, ease: "back.out(2)",
      scrollTrigger: { trigger: g, start: "top 88%" }
    });
  });

  /* ------------------------------------------------------------------ */
  /* Credentials ledger                                                  */
  /* ------------------------------------------------------------------ */
  gsap.set(".ledger__row", { opacity: 0, y: 26 });
  ScrollTrigger.batch(".ledger__row", {
    start: "top 92%",
    once: true,
    onEnter: function (rows) {
      gsap.to(rows, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "power3.out", overwrite: true });
    }
  });
  gsap.from(".creds__verify", {
    opacity: 0, y: 16, duration: 0.6,
    scrollTrigger: { trigger: ".creds__verify", start: "top 95%" }
  });

  /* ------------------------------------------------------------------ */
  /* Contact                                                             */
  /* ------------------------------------------------------------------ */
  gsap.fromTo(".sky--contact", { yPercent: -8 }, {
    yPercent: 8, ease: "none",
    scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true }
  });
  gsap.timeline({ scrollTrigger: { trigger: ".contact", start: "top 65%" }, defaults: { ease: "power4.out" } })
    .from(".contact__no", { opacity: 0, y: 14, duration: 0.6 })
    .from(".contact__title", { opacity: 0, y: 80, duration: 1.1 }, 0.1)
    .from(".contact__script", { opacity: 0, scale: 0.6, rotate: -20, duration: 0.8, ease: "back.out(2)" }, 0.5)
    .from(".contact__mail > *, .contact__links li", { opacity: 0, y: 24, duration: 0.7, stagger: 0.08 }, 0.6);

  /* Lazy images change layout height a little; re-measure once everything is in. */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();

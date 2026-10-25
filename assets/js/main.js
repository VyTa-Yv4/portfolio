(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");

  /* ---------- splash (once per visit, skippable) ---------- */
  (function () {
    if (window.gsap) return; // motion.js drives the splash when GSAP is available
    var splash = document.getElementById("splash");
    if (!splash) return;
    var seen = false;
    try { seen = sessionStorage.getItem("yg-splash") === "1"; } catch (e) { /* ignore */ }
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seen || reduced) { splash.parentNode.removeChild(splash); return; }

    document.body.classList.add("is-loading");
    var bar = document.getElementById("splashBar");
    var count = document.getElementById("splashCount");
    var start = performance.now();
    var MIN = 1600, loaded = false, finished = false;

    window.addEventListener("load", function () { loaded = true; });

    function pad(n) { return ("00" + n).slice(-3); }
    function frame(now) {
      if (finished) return;
      var t = Math.min((now - start) / MIN, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      // hold at 90% until the page has loaded (or the 4s failsafe fires)
      var pct = Math.round(eased * (loaded ? 100 : 90));
      if (bar) bar.style.width = pct + "%";
      if (count) count.textContent = pad(pct);
      if (t >= 1 && loaded) { done(); return; }
      requestAnimationFrame(frame);
    }
    function done() {
      if (finished) return;
      finished = true;
      if (bar) bar.style.width = "100%";
      if (count) count.textContent = "100";
      try { sessionStorage.setItem("yg-splash", "1"); } catch (e) { /* ignore */ }
      setTimeout(function () {
        splash.classList.add("is-done");
        document.body.classList.remove("is-loading");
        setTimeout(function () { if (splash.parentNode) splash.parentNode.removeChild(splash); }, 1000);
      }, 250);
    }
    splash.addEventListener("click", done);
    setTimeout(function () { loaded = true; }, 4000);
    setTimeout(done, 5000); // hard failsafe if animation frames are paused (background tab)
    requestAnimationFrame(frame);
  })();

  /* ---------- Philippine time clock ---------- */
  var clock = document.getElementById("clock");
  function tick() {
    if (!clock) return;
    try {
      clock.textContent = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Manila"
      });
    } catch (e) {
      clock.textContent = "";
    }
  }
  tick();
  setInterval(tick, 30000);

  var year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- active nav link ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var navIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { navIo.observe(s); });
  }

  /* ---------- copy email ---------- */
  var toast = document.getElementById("toast");
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 2200);
  }
  var copyBtn = document.getElementById("copyBtn");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var email = copyBtn.getAttribute("data-email");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(
          function () { showToast("Email copied ✦"); },
          function () { showToast(email); }
        );
      } else {
        showToast(email);
      }
    });
  }

})();

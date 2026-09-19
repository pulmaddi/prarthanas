/* Ishta — shared interactions: nav, active link, scroll reveal, countdown, form */
(function () {
  "use strict";

  /* ----- Mobile nav toggle ----- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ----- Highlight the current page in the nav ----- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    var target = a.getAttribute("href");
    if (target === here || (here === "" && target === "index.html")) {
      a.classList.add("active");
    }
  });

  /* ----- Header shadow on scroll ----- */
  var header = document.getElementById("siteHeader");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----- Scroll reveal ----- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ----- Countdown to next festival (Events page) ----- */
  var cd = document.getElementById("countdown");
  if (cd) {
    var targetAttr = cd.getAttribute("data-target");
    var target = targetAttr ? new Date(targetAttr).getTime() : NaN;
    var fields = {
      days: cd.querySelector('[data-unit="days"]'),
      hours: cd.querySelector('[data-unit="hours"]'),
      mins: cd.querySelector('[data-unit="mins"]'),
      secs: cd.querySelector('[data-unit="secs"]')
    };
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    var tick = function () {
      var diff = target - Date.now();
      if (isNaN(target) || diff <= 0) {
        if (fields.days) fields.days.textContent = "00";
        if (fields.hours) fields.hours.textContent = "00";
        if (fields.mins) fields.mins.textContent = "00";
        if (fields.secs) fields.secs.textContent = "00";
        return;
      }
      var s = Math.floor(diff / 1000);
      if (fields.days) fields.days.textContent = pad(Math.floor(s / 86400));
      if (fields.hours) fields.hours.textContent = pad(Math.floor((s % 86400) / 3600));
      if (fields.mins) fields.mins.textContent = pad(Math.floor((s % 3600) / 60));
      if (fields.secs) fields.secs.textContent = pad(s % 60);
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ----- Contact form (front-end only, no backend) ----- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.getElementById("formNote");
      var name = (form.querySelector('[name="name"]') || {}).value || "";
      if (note) {
        note.textContent = "🙏 Thank you" + (name ? ", " + name.trim().split(" ")[0] : "") +
          ". Your message has been received — we will connect with you soon.";
        note.classList.add("show");
      }
      form.reset();
    });
  }

  /* ----- Footer year ----- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

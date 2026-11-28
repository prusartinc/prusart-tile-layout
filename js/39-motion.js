"use strict";
/* ================= motion =================
   Small, quick animations for the brand theme: screens ease in, sheets slide
   up and back down, home cards rise one after another, numbers count up, the
   drawing eases in when you switch surfaces. Everything is skipped when the
   phone is set to reduce motion. Nothing here changes data or timing of logic:
   the real DOM changes happen at once; only how they look is animated. */

const MOTION = () =>
  !(
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches
  );

function motionRestart(el, cls, ms) {
  if (!el || !MOTION()) return;
  el.classList.remove(cls);
  void el.offsetWidth; // restart the CSS animation
  el.classList.add(cls);
  clearTimeout(el["_t" + cls]);
  el["_t" + cls] = setTimeout(() => el.classList.remove(cls), ms || 900);
}

function countUp(root) {
  if (!root || !MOTION()) return;
  root.querySelectorAll("[data-count]").forEach((b) => {
    const to = +b.dataset.count || 0;
    if (to < 2) return;
    const t0 = performance.now(),
      dur = 750;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur),
        e = 1 - Math.pow(1 - k, 3);
      b.textContent = Math.round(to * e);
      if (k < 1 && b.isConnected) requestAnimationFrame(step);
      else b.textContent = to;
    };
    b.textContent = 0;
    requestAnimationFrame(step);
  });
}

/* home: cards rise in when the screen opens (not on every search keystroke) */
{
  const sh = showHome;
  showHome = function (on) {
    const was = S.home;
    sh.apply(this, arguments);
    if (on && !was) {
      const el = $("#home");
      motionRestart(el, "c-anim", 1400);
      countUp(el);
    } else if (!on && was) motionRestart($("#app"), "c-enter", 600);
  };
}

/* tab bar: the screen you switch to eases in */
{
  const ng = navGo;
  navGo = function (k) {
    const from = navCur();
    ng.apply(this, arguments);
    const to = navCur();
    if (to === "mat" && from !== to) countUp($("#matsum"));
    if (from === to || to === "home") return;
    motionRestart(to === "plan" ? $("#plan") : $("#app"), "c-enter", 600);
  };
}

/* sheets: close slides the old sheet down while the real one is already gone,
   so code that checks or reopens the modal right away is not slowed down */
{
  const cm = closeModal;
  closeModal = function () {
    const m = $("#modal"),
      open = m && !m.hidden,
      box =
        open && MOTION() && !window.__mswipe
          ? $("#mbody").cloneNode(true)
          : null;
    cm.apply(this, arguments);
    if (!box) return;
    box.removeAttribute("id");
    box.querySelectorAll("[id]").forEach((x) => x.removeAttribute("id"));
    Promise.resolve().then(() => {
      if (!$("#modal").hidden) return; // another sheet opened at once: no ghost
      const g = document.createElement("div");
      g.className = "mghost";
      g.setAttribute("aria-hidden", "true");
      g.innerHTML = `<div class="bk"></div>`;
      g.appendChild(box);
      document.body.appendChild(g);
      setTimeout(() => g.remove(), 320);
    });
  };
}

/* switching surfaces: the drawing eases in */
{
  const ra = renderAll;
  let last = null;
  renderAll = function () {
    ra.apply(this, arguments);
    if (S.home || S.plan) return;
    const key = (P && P.id) + ":" + S.tab;
    if (last !== null && key !== last) motionRestart($("#svg"), "c-swap", 600);
    last = key;
  };
}

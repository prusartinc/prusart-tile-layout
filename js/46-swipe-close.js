"use strict";
/* ================= bottom sheets close with a swipe down =================
   Phones: pull the sheet (#modal) down by its grip, its title, or anywhere
   once it is scrolled to the top. Let go past a third of its height, or
   flick down, and it closes; a short pull springs back. */
{
  const box = () => $("#mbody"),
    back = () => $("#modal");
  let d = null; // drag state
  const skip = (el) =>
    el.closest('input[type="range"],textarea,select,.kp,.nopull,[data-nopull]');
  const reset = (b) => {
    b.style.transform = b.style.transition = "";
    back().style.background = back().style.transition = "";
  };
  document.addEventListener(
    "touchstart",
    (e) => {
      const b = box();
      d = null;
      if (back().hidden || e.touches.length !== 1 || !narrowW()) return;
      if (!b.contains(e.target) || skip(e.target)) return;
      const y = e.touches[0].clientY,
        top = b.getBoundingClientRect().top;
      d = {
        y0: y,
        x0: e.touches[0].clientX,
        grip: y - top < 70, // the grip and the title row always pull
        st0: b.scrollTop,
        on: false,
        dy: 0,
        t: [[y, performance.now()]],
      };
    },
    { passive: true },
  );
  document.addEventListener(
    "touchmove",
    (e) => {
      if (!d || e.touches.length !== 1) return;
      const b = box(),
        y = e.touches[0].clientY,
        dy = y - d.y0,
        dx = e.touches[0].clientX - d.x0;
      if (!d.on) {
        if (Math.abs(dx) > Math.abs(dy) || dy < 8) {
          if (Math.abs(dx) > 10 || dy < -8) d = null; // sideways or scrolling up
          return;
        }
        if (!d.grip && (d.st0 > 0 || b.scrollTop > 0)) return; // a scrolled list scrolls back up first; the next pull closes
        d.on = true;
        d.y0 = y; // start from here so the sheet does not jump
        b.style.transition = "none";
        back().style.transition = "none";
      }
      e.preventDefault();
      d.dy = Math.max(0, y - d.y0);
      d.t.push([y, performance.now()]);
      if (d.t.length > 5) d.t.shift();
      b.style.transform = `translateY(${d.dy}px)`;
      const k = Math.max(0, 1 - d.dy / b.offsetHeight);
      back().style.background = `rgba(0,0,0,${(0.6 * k).toFixed(3)})`;
    },
    { passive: false },
  );
  const end = () => {
    if (!d || !d.on) return (d = null);
    const b = box(),
      h = b.offsetHeight,
      a = d.t[0],
      z = d.t[d.t.length - 1],
      v = (z[0] - a[0]) / Math.max(1, z[1] - a[1]); // px per ms, + is down
    const close = d.dy > h * 0.3 || (v > 0.6 && d.dy > 30);
    d = null;
    const ease = "0.26s cubic-bezier(.2,.8,.2,1)";
    b.style.transition = `transform ${ease}`;
    back().style.transition = `background ${ease}`;
    if (close) {
      b.style.transform = `translateY(${h + 20}px)`;
      back().style.background = "rgba(0,0,0,0)";
      setTimeout(() => {
        window.__mswipe = true;
        try {
          closeModal();
        } finally {
          window.__mswipe = false;
        }
        reset(b);
      }, 230);
    } else {
      b.style.transform = "";
      back().style.background = "";
      setTimeout(() => reset(b), 280);
    }
  };
  document.addEventListener("touchend", end, { passive: true });
  document.addEventListener("touchcancel", end, { passive: true });
  // a new sheet always opens clean
  const m0 = modal;
  modal = function () {
    reset(box());
    return m0.apply(this, arguments);
  };
}

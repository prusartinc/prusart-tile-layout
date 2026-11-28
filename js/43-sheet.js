"use strict";
/* ================= bottom sheets with a grip =================
   Phones: the layout settings and the plan sheet sit in a sheet you pull by
   its grip — folded / half / full. A tap on the grip steps it up (and from
   full back to half). The drawing above always gets the rest of the screen. */

const SHGT = {
  ru: { pull: "Потяни вверх или вниз" },
  en: { pull: "Pull up or down" },
};

function shPx(l, kind) {
  const H = innerHeight;
  if (kind === "plan") {
    if (l === "peek") return 132;
    const pl = $("#plan"),
      ph = (pl && pl.clientHeight) || H,
      top =
        (($(".plhead") || {}).offsetHeight || 60) +
        (($(".plviews") || {}).offsetHeight || 56);
    if (l === "full") return Math.max(200, ph - top - 130);
    return Math.max(160, Math.round((ph - top) * 0.52));
  }
  if (l === "full") return Math.max(260, H - 92);
  return Math.round(H * 0.42);
}
function btabPx() {
  const b = $("#btab");
  if (!b || document.body.classList.contains("nobtab")) return 0;
  return Math.max(0, innerHeight - b.getBoundingClientRect().top);
}

/* ---------- layout settings sheet ---------- */
function shOn() {
  return (
    typeof narrowW === "function" &&
    narrowW() &&
    !S.client &&
    !S.full &&
    !S.home &&
    !S.plan &&
    S.tab !== "tot" &&
    S.pcol === false
  );
}
let SH_DRAG = null;
function shApply() {
  const on = shOn(),
    st = $("#stage"),
    root = document.documentElement;
  document.body.classList.toggle("sheet", on);
  if (!on) {
    root.style.removeProperty("--shH");
    if (st && st.dataset.sh) {
      st.style.height = "";
      delete st.dataset.sh;
      return true;
    }
    return false;
  }
  const lvl = S.shLvl === "full" ? "full" : "half",
    h = SH_DRAG != null ? SH_DRAG : shPx(lvl);
  root.style.setProperty("--shH", h + "px");
  if (!st || SH_DRAG != null) return false;
  const stat = $("#stat"),
    top = st.getBoundingClientRect().top + (window.scrollY || 0),
    want = Math.max(
      150,
      Math.round(
        innerHeight -
          top -
          (stat ? stat.offsetHeight : 0) -
          Math.min(h, shPx("half")) -
          btabPx() -
          6,
      ),
    );
  if (+st.dataset.sh === want) return false;
  st.style.height = want + "px";
  st.dataset.sh = String(want);
  return true;
}
{
  const ra = renderAll;
  renderAll = function () {
    ra.apply(this, arguments);
    if (shApply()) requestAnimationFrame(() => draw());
  };
  const ap = applyPin;
  applyPin = function () {
    ap.apply(this, arguments);
    if (shApply()) requestAnimationFrame(() => draw());
  };
  addEventListener("resize", () => {
    if (shApply()) draw();
  });
}

/* ---------- plan sheet ---------- */
function plShApply() {
  const el = $("#plsheet");
  if (!el || !S.plan) return;
  if (!narrowW()) {
    el.style.height = "";
    return;
  }
  const l = S.plan.shl || "half",
    h = SH_DRAG != null ? SH_DRAG : shPx(l, "plan");
  const was = el.style.height;
  el.style.height = h + "px";
  el.dataset.shl = l;
  return was !== el.style.height;
}
{
  const ps = planSheet;
  planSheet = function () {
    const h = ps.apply(this, arguments);
    return typeof h === "string" && narrowW()
      ? `<div class="shgrip" data-grip="plan" aria-label="${SHGT[lang === "ru" ? "ru" : "en"].pull}"><i></i></div>` +
          h
      : h;
  };
  const rp = renderPlan;
  renderPlan = function () {
    const r = rp.apply(this, arguments);
    if (plShApply()) planDraw(); // the drawing box changed size: fit again
    return r;
  };
}

/* ---------- dragging the grip ---------- */
{
  let D = null;
  const levels = (kind) =>
    kind === "plan" ? ["peek", "half", "full"] : ["fold", "half", "full"];
  const curLvl = (kind) =>
    kind === "plan"
      ? S.plan.shl || "half"
      : S.shLvl === "full"
        ? "full"
        : "half";
  const setLvl = (kind, l) => {
    SH_DRAG = null;
    document.body.classList.remove("shdrag");
    try {
      getSelection().removeAllRanges();
    } catch (e) {}
    if (kind === "plan") {
      S.plan.shl = l;
      if (l === "peek" && $("#plsheet")) $("#plsheet").scrollTop = 0;
      plShApply();
      requestAnimationFrame(() => planDraw());
      return;
    }
    if (l === "fold") return act("pcol");
    S.shLvl = l;
    if (shApply()) draw();
  };
  document.addEventListener(
    "pointerdown",
    (e) => {
      const g =
        e.target.closest &&
        e.target.closest(".shgrip, body.sheet #panel .pcolbar.open");
      if (!g || !narrowW()) return;
      const kind = g.dataset.grip === "plan" ? "plan" : "lay",
        box = kind === "plan" ? $("#plsheet") : $("#panel");
      if (!box) return;
      D = {
        kind,
        y: e.clientY,
        h0: box.getBoundingClientRect().height,
        moved: false,
      };
    },
    true,
  );
  document.addEventListener(
    "pointermove",
    (e) => {
      if (!D) return;
      const dy = e.clientY - D.y;
      if (!D.moved && Math.abs(dy) < 6) return;
      D.moved = true;
      e.preventDefault();
      document.body.classList.add("shdrag");
      const max = shPx("full", D.kind === "plan" ? "plan" : ""),
        min = D.kind === "plan" ? 96 : 80;
      SH_DRAG = Math.max(min, Math.min(max, D.h0 - dy));
      if (D.kind === "plan") plShApply();
      else document.documentElement.style.setProperty("--shH", SH_DRAG + "px");
    },
    { capture: true, passive: false },
  );
  document.addEventListener(
    "pointerup",
    (e) => {
      if (!D) return;
      const d = D;
      D = null;
      const kind = d.kind,
        L = levels(kind);
      if (!d.moved) {
        // a tap on the grip bar (not on its button) steps the sheet
        if (kind === "lay" && e.target.closest("button")) return;
        const i = L.indexOf(curLvl(kind));
        return setLvl(kind, L[i >= L.length - 1 ? 1 : i + 1]);
      }
      const h = SH_DRAG,
        pk = kind === "plan" ? "plan" : "",
        px = {
          [L[0]]: kind === "plan" ? shPx("peek", "plan") : 60,
          [L[1]]: shPx("half", pk),
          [L[2]]: shPx("full", pk),
        };
      // nearest level, with a little push in the direction of the flick
      const dir = Math.sign(d.h0 - h);
      let best = L[1],
        bd = 1e9;
      L.forEach((l) => {
        const dd =
          Math.abs(px[l] - h) - (Math.sign(px[l] - d.h0) === dir ? 40 : 0);
        if (dd < bd) {
          bd = dd;
          best = l;
        }
      });
      // swallow the click that follows a drag
      const stop = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
      };
      document.addEventListener("click", stop, { capture: true, once: true });
      setTimeout(() => document.removeEventListener("click", stop, true), 60);
      setLvl(kind, best);
    },
    true,
  );
}

/* ================= labels on the plan drawing don't pile up =================
   After a plan view is drawn, labels are checked on screen: sizes (blue) are
   kept, then item names, then the small tile labels; a label that would cover
   one already kept is hidden. Close-ups have room, so most come back there. */
function plDeclutter() {
  const svg = $("#plsvg svg");
  if (!svg) return;
  const all = [...svg.querySelectorAll("text")];
  if (all.length < 2) return;
  const rank = (t) => {
    const f = (t.getAttribute("fill") || "").toLowerCase();
    if (f === PLC.dim.toLowerCase()) return 0;
    if (t.closest("[data-zf]")) return 2;
    return 1;
  };
  const items = all
    .map((t) => {
      t.style.display = "";
      const r = t.getBoundingClientRect();
      return { t, r, k: rank(t) };
    })
    .filter((o) => o.r.width > 0 && o.r.height > 0)
    .sort((a, b) => a.k - b.k);
  const kept = [];
  const hit = (a, b) => {
    const w = Math.min(a.right, b.right) - Math.max(a.left, b.left),
      h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    if (w <= 0 || h <= 0) return false;
    const s = Math.min(a.width * a.height, b.width * b.height) || 1;
    return (w * h) / s > 0.18;
  };
  items.forEach((o) => {
    if (o.k > 0 && kept.some((q) => hit(o.r, q.r))) {
      o.t.style.display = "none";
      return;
    }
    kept.push(o);
  });
}
{
  const pd = planDraw;
  planDraw = function () {
    const r = pd.apply(this, arguments);
    try {
      plDeclutter();
    } catch (e) {}
    return r;
  };
}

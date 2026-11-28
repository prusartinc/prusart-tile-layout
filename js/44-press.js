"use strict";
/* ================= long press: a quick menu =================
   Hold a finger still on a plan item, a tile or a cut-out in the layout for
   about half a second: a short menu opens with what you usually do to it.
   The tap that ends the hold is swallowed so it doesn't also open/select. */

const LPT = {
  ru: {
    props: "Свойства",
    copy: "Копировать",
    del: "Удалить",
    edit: "Изменить размеры",
    card: "Карточка куска",
    done: "Нарезан ✓",
    undone: "Снять «нарезан»",
    joint: "Шов сюда",
    center: "Центр плитки сюда",
    tile: "Плитка",
  },
  en: {
    props: "Properties",
    copy: "Copy",
    del: "Delete",
    edit: "Edit size",
    card: "Tile card",
    done: "Mark cut ✓",
    undone: "Unmark cut",
    joint: "Joint here",
    center: "Tile centre here",
    tile: "Tile",
  },
};
const lpt = (k) => (LPT[lang === "ru" ? "ru" : "en"] || LPT.en)[k];
let LP = null; // what the open menu is about

function lpMenu(title, rows) {
  modal(
    `<h3>${title}</h3><div class="lpm">${rows
      .map(
        ([a, label, cls]) =>
          `<button class="btn ${cls || ""}" data-act="${a}">${label}</button>`,
      )
      .join("")}</div>`,
  );
}
function lpPlan(id) {
  const it = P.plan.items.find((x) => x.id === id);
  if (!it) return;
  LP = { kind: "plan", id };
  lpMenu(`${(PL_KINDS[it.k] || {}).ic || ""} ${esc(pt("k_" + it.k))}`, [
    ["lpGo:props", lpt("props"), "p"],
    ["lpGo:copy", "⧉ " + lpt("copy")],
    ["lpGo:del", lpt("del"), "d"],
  ]);
}
function lpLay(cx, cy) {
  if (typeof hitAt !== "function") return false;
  const h = hitAt(cx, cy);
  if (h && h.op != null) {
    const si = P.surfaces.indexOf(h.it.s),
      o = h.it.s.openings[h.op];
    if (si < 0 || !o) return false;
    LP = { kind: "op", si, j: h.op };
    const rows = [["lpGo:edit", lpt("edit"), "p"]];
    // a cut-out tied to a plan item (pan, tub…) follows that item: no copy / delete here
    if (!o.pi)
      rows.push(
        ["lpGo:opcopy", "⧉ " + lpt("copy")],
        [`delOpenP:${si}:${h.op}`, lpt("del"), "d"],
      );
    lpMenu(esc(typeof opName === "function" ? opName(o) : o.type), rows);
    return true;
  }
  const it = S.items && S.items.find((x) => x.s === cur()),
    p = it && typeof pieceAt === "function" ? pieceAt(it, cx, cy) : null;
  if (!p || isMulti()) return false;
  const s = cur(),
    T = R && R.T,
    key = T ? decoKey(p, T) : "",
    done = !!(s.cutDone && key && s.cutDone[key]);
  LP = { kind: "piece", it, p, key };
  S.qp = { key, c: [p.x0 + p.lw / 2, p.y0 + p.lh / 2] };
  lpMenu(
    `${lpt("tile")} ${p.no ? "№" + p.no : ""}`,
    [
      ["lpGo:card", lpt("card"), "p"],
      key ? [`lpGo:cut`, done ? lpt("undone") : lpt("done")] : null,
      ["qa:joint", "┼ " + lpt("joint")],
      ["qa:center", "◎ " + lpt("center")],
    ].filter(Boolean),
  );
  return true;
}
function lpGo(k) {
  const L = LP;
  if (!L) return closeModal();
  if (L.kind === "plan") {
    S.plan.sel = L.id;
    closeModal();
    if (k === "copy") planAct("plDup");
    else if (k === "del") planAct("plDel");
    else renderPlan();
    return;
  }
  if (L.kind === "op") {
    const s = P.surfaces[L.si],
      o = s && s.openings[L.j];
    closeModal();
    if (!o) return;
    if (k === "edit") return editOpening(L.si, L.j);
    if (k === "opcopy") {
      const c = JSON.parse(JSON.stringify(o));
      delete c.pi;
      if (c.shape === "circle") c.x = +c.x + 3;
      else {
        c.x = +c.x + 3;
        if (Array.isArray(c.pts)) c.pts = c.pts.map((q) => [q[0] + 3, q[1]]);
      }
      s.openings.push(c);
      renderPanel();
      changed();
    }
    return;
  }
  if (L.kind === "piece") {
    if (k === "card") return pieceCard(L.it, L.p);
    if (k === "cut") {
      closeModal();
      const s = cur();
      s.cutDone = s.cutDone || {};
      if (s.cutDone[L.key]) delete s.cutDone[L.key];
      else s.cutDone[L.key] = 1;
      saveSoon();
      drawSoon();
    }
  }
}
{
  const a0 = act;
  act = function (a, arg) {
    if (a === "lpGo") return lpGo(arg);
    return a0.apply(this, arguments);
  };
}

/* ---------- detecting the hold ---------- */
{
  let T = null,
    fired = 0;
  const cancel = () => {
    if (T) clearTimeout(T.t);
    T = null;
  };
  document.addEventListener(
    "pointerdown",
    (e) => {
      cancel();
      if (e.button > 0 || S.client) return;
      const inPlan = e.target.closest && e.target.closest("#plsvg"),
        inLay =
          !inPlan && e.target.closest && e.target.closest("#stage svg#svg");
      if (!inPlan && !inLay) return;
      let what = null;
      if (inPlan) {
        const g = e.target.closest("[data-pi]");
        if (g) what = { plan: g.getAttribute("data-pi") };
        else if (
          S.plan &&
          S.plan.v === "top" &&
          typeof lpPlanWall === "function"
        ) {
          // a corner or a wall on the room outline: add / remove corners
          const pc = e.target.closest("[data-pc]"),
            pw = e.target.closest("[data-pw]"),
            svg = e.target.closest("svg");
          if (pc) what = { pc: +pc.getAttribute("data-pc") };
          else if (pw && svg) {
            const q = plPoint(svg, e);
            what = { pw: +pw.getAttribute("data-pw"), q: [q[0], -q[1]] };
          } else return;
        } else return;
      } else what = { lay: 1 };
      const x = e.clientX,
        y = e.clientY;
      T = {
        x,
        y,
        id: e.pointerId,
        t: setTimeout(() => {
          T = null;
          let ok = false;
          if (what.plan) {
            lpPlan(what.plan);
            ok = true;
          } else if (what.pc != null) {
            // a held corner was being dragged: put it back where it was
            if (
              typeof plDrag !== "undefined" &&
              plDrag &&
              plDrag.kind === "corner"
            ) {
              if (plDrag.moved) return;
              plDrag = null;
            }
            lpPlanCorner(what.pc);
            ok = true;
          } else if (what.pw != null) {
            lpPlanWall(what.pw, what.q);
            ok = true;
          } else ok = lpLay(x, y);
          if (ok) {
            fired = Date.now();
            try {
              navigator.vibrate && navigator.vibrate(12);
            } catch (e2) {}
          }
        }, 520),
      };
    },
    true,
  );
  document.addEventListener(
    "pointermove",
    (e) => {
      if (T && Math.hypot(e.clientX - T.x, e.clientY - T.y) > 9) cancel();
    },
    true,
  );
  ["pointercancel"].forEach((ev) =>
    document.addEventListener(ev, cancel, true),
  );
  // the finger lifting after a hold: not a tap
  const eat = (e) => {
    if (
      Date.now() - fired < 700 &&
      !(e.target.closest && e.target.closest("#modal"))
    ) {
      e.stopPropagation();
      e.preventDefault();
    }
  };
  document.addEventListener(
    "pointerup",
    (e) => {
      cancel();
      eat(e);
    },
    true,
  );
  document.addEventListener("click", eat, true);
  document.addEventListener("touchend", eat, { capture: true, passive: false });
  document.addEventListener("mouseup", eat, true);
  // no text-selection / callout menu while holding on drawings
  document.addEventListener(
    "contextmenu",
    (e) => {
      if (e.target.closest && e.target.closest("#plsvg, #stage"))
        e.preventDefault();
    },
    true,
  );
}

/* ================= swipe the drawing to change surface =================
   A quick sideways flick on the layout drawing goes to the next / previous
   surface. It stays out of the way of real edits: not while zoomed in, not
   when the finger starts on the tiles with the move-tiles tool on, not with
   two fingers. Dots under the drawing show where you are. */
function swDots() {
  let el = $("#sdots");
  const vw = $("#vw"),
    st = $("#stage");
  if (!vw || !st) return;
  if (!el) {
    el = document.createElement("div");
    el.id = "sdots";
    el.setAttribute("aria-hidden", "true");
    st.insertAdjacentElement("afterend", el);
  }
  const n = P.surfaces.length,
    i = +S.tab;
  if (S.home || S.plan || isMulti() || S.tab === "tot" || n < 2 || S.client) {
    el.innerHTML = "";
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.innerHTML =
    n <= 12
      ? P.surfaces
          .map((_, j) => `<i class="${j === i ? "on" : ""}"></i>`)
          .join("")
      : `<b>${i + 1} / ${n}</b>`;
}
{
  const ra = renderAll;
  renderAll = function () {
    ra.apply(this, arguments);
    try {
      swDots();
    } catch (e) {}
  };
  let SW = null;
  document.addEventListener(
    "pointerdown",
    (e) => {
      SW = null;
      if (e.pointerType !== "touch" || !e.isPrimary) return;
      if (!(e.target.closest && e.target.closest("#stage svg#svg"))) return;
      if (S.tab === "tot" || isMulti() || (S.view && S.view.zoom > 1.05))
        return;
      if (S.mode === "tiles" && canEdit() && hitAt(e.clientX, e.clientY))
        return;
      SW = { x: e.clientX, y: e.clientY, t: Date.now(), id: e.pointerId };
    },
    true,
  );
  document.addEventListener(
    "pointerdown",
    (e) => {
      if (SW && e.pointerId !== SW.id) SW = null; // second finger: pinch
    },
    true,
  );
  document.addEventListener(
    "pointerup",
    (e) => {
      const s = SW;
      SW = null;
      if (!s || e.pointerId !== s.id) return;
      const dx = e.clientX - s.x,
        dy = e.clientY - s.y,
        dt = Date.now() - s.t;
      if (dt > 500 || Math.abs(dx) < 70 || Math.abs(dx) < 2 * Math.abs(dy))
        return;
      const d = dx < 0 ? 1 : -1,
        to = (+S.tab || 0) + d;
      if (to < 0 || to >= P.surfaces.length) return;
      siteStep(d);
      const g = $("#svg");
      if (g && typeof motionRestart === "function")
        motionRestart(g, d > 0 ? "c-swl" : "c-swr", 600);
    },
    true,
  );
}

/* plan: mouse wheel zooms around the pointer (computers) */
document.addEventListener(
  "wheel",
  (e) => {
    const svg = e.target.closest && e.target.closest("#plsvg svg");
    if (!svg || !S.plan || !svg.dataset.vb0) return;
    e.preventDefault();
    const V = S.plan,
      [, , bw, bh] = svg.dataset.vb0.split(" ").map(Number),
      r = svg.getBoundingClientRect(),
      z0 = V.z || 1,
      z = Math.max(1, Math.min(10, z0 * (e.deltaY < 0 ? 1.15 : 1 / 1.15))),
      fx = (e.clientX - r.left) / r.width,
      fy = (e.clientY - r.top) / r.height,
      px = (V.zx || 0) + (fx * bw) / z0,
      py = (V.zy || 0) + (fy * bh) / z0;
    V.z = z;
    V.zx = px - (fx * bw) / z;
    V.zy = py - (fy * bh) / z;
    planDraw();
  },
  { passive: false },
);

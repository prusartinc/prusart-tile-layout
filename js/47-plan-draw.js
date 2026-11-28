"use strict";
/* ================= room plan: draw the outline, lock sizes, add / remove corners =================
   - A new plan starts from a sketch: tap the corners (or run a finger along
     the walls), lines straighten to 90° / 45°, then you type the real sizes.
   - A wall size you type is locked 🔒: when you type another wall, the room
     closes by changing walls that are not locked (the closest fit).
   - Hold a finger on a wall: add a corner there. Hold on a corner: remove it. */

const PDT = {
  ru: {
    draw: "Нарисовать контур",
    redraw: "Перерисовать контур",
    drawT: "Контур комнаты",
    drawHint:
      "Ставь точки в углах по очереди или веди пальцем вдоль стен. Линии выпрямятся. Нажми на первую точку — контур замкнётся. Размеры введёшь потом.",
    undoPt: "Точка",
    clear: "Очистить",
    done: "Готово",
    need3: "Нужно минимум 3 угла",
    replaceQ:
      "Заменить комнату новым контуром? Двери, поддон и остальное на плане будут удалены.",
    after:
      "Теперь введи размеры стен. Введённый размер фиксируется 🔒 и больше не меняется.",
    startHint:
      "Нарисуй контур комнаты пальцем и потом введи точные размеры стен. Или возьми готовый шаблон.",
    rect: "Прямоугольник 8′ × 5′",
    tpl: "Шаблоны",
    lockOn: "Размер зафиксирован — не меняется, когда вводишь другие стены",
    lockOff: "Размер свободный — подгоняется, чтобы комната замкнулась",
    lockT: "Зафиксировать размер",
    unlockT: "Снять фиксацию",
    noFit:
      "Не получается замкнуть комнату: все подходящие стены зафиксированы. Сними 🔒 с одной из стен.",
    fitted: "Подогнаны стены",
    addPt: "Добавить угол здесь",
    delPt: "Удалить угол",
    wall: "Стена",
    corner: "Угол",
    props: "Свойства стены",
    min3: "В комнате должно остаться минимум 3 стены",
    holdHint: "Удерживай палец на стене — добавить угол, на углу — удалить.",
  },
  en: {
    draw: "Draw the outline",
    redraw: "Redraw the outline",
    drawT: "Room outline",
    drawHint:
      "Tap the corners in order or run a finger along the walls. Lines straighten. Tap the first point to close it. You type the sizes after.",
    undoPt: "Point",
    clear: "Clear",
    done: "Done",
    need3: "At least 3 corners",
    replaceQ:
      "Replace the room with the new outline? Doors, the pan and the rest of the plan will be removed.",
    after:
      "Now type the wall sizes. A size you type is locked 🔒 and stays put.",
    startHint:
      "Sketch the room with your finger, then type the real wall sizes. Or pick a ready template.",
    rect: "Rectangle 8′ × 5′",
    tpl: "Templates",
    lockOn: "Size locked — stays put when you type other walls",
    lockOff: "Size free — adjusts so the room closes",
    lockT: "Lock this size",
    unlockT: "Unlock",
    noFit:
      "Can't close the room: every wall that could change is locked. Unlock 🔒 one of them.",
    fitted: "Adjusted walls",
    addPt: "Add a corner here",
    delPt: "Remove this corner",
    wall: "Wall",
    corner: "Corner",
    props: "Wall properties",
    min3: "A room needs at least 3 walls",
    holdHint:
      "Hold a finger on a wall to add a corner, on a corner to remove it.",
  },
};
const pdt = (k) => (PDT[lang === "ru" ? "ru" : "en"] || PDT.en)[k];
const PD_LOCK = (on) =>
  `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="${on ? "M8 11V7a4 4 0 0 1 8 0v4" : "M8 11V7a4 4 0 0 1 7.5-2"}"/></svg>`;

/* ---------- closing the room with the walls that are not locked ---------- */
function plHeads(room) {
  let h = ((+room.a0 || 0) * Math.PI) / 180;
  return room.segs.map((g) => {
    const v = [Math.cos(h), Math.sin(h)];
    h += ((+g.a || 0) * Math.PI) / 180;
    return v;
  });
}
/* keep: the wall just typed (never changed here). Returns the walls changed, [] if
   it was closed already, or null if no free walls can close it. */
function plFitLocked(keep) {
  const pl = P.plan,
    g = pl.room.segs,
    n = g.length,
    U = plHeads(pl.room);
  let gx = 0,
    gy = 0;
  g.forEach((q, i) => {
    gx += (+q.l || 0) * U[i][0];
    gy += (+q.l || 0) * U[i][1];
  });
  if (Math.hypot(gx, gy) < 1 / 64) return [];
  const free = [];
  for (let j = 0; j < n; j++)
    if (j !== keep && !(pl.walls[j] && pl.walls[j].lk)) free.push(j);
  const dist = (j) =>
    keep < 0 ? 0 : Math.min((j - keep + n) % n, (keep - j + n) % n);
  let best = null;
  const tryIt = (ch) => {
    if (ch.some(([j, d]) => (+g[j].l || 0) + d < 1)) return;
    const cost =
      ch.reduce((a, [, d]) => a + Math.abs(d), 0) +
      0.001 * ch.reduce((a, [j]) => a + dist(j), 0);
    if (!best || cost < best.cost - 1e-9) best = { cost, ch };
  };
  // one wall along the gap
  free.forEach((j) => {
    const u = U[j];
    if (
      Math.abs(gx * u[1] - gy * u[0]) <
      1e-3 * Math.max(1, Math.hypot(gx, gy))
    )
      tryIt([[j, -(gx * u[0] + gy * u[1])]]);
  });
  // two walls
  for (let a = 0; a < free.length; a++)
    for (let b = a + 1; b < free.length; b++) {
      const j = free[a],
        k = free[b],
        [cj, sj] = U[j],
        [ck, sk] = U[k],
        det = cj * sk - ck * sj;
      if (Math.abs(det) < 1e-3) continue;
      const dj = (-gx * sk + gy * ck) / det,
        dk = (-cj * gy + sj * gx) / det;
      tryIt([
        [j, dj],
        [k, dk],
      ]);
    }
  if (!best) return null;
  best.ch.forEach(([j, d]) => {
    g[j].l = Math.round(((+g[j].l || 0) + d) * 16) / 16;
  });
  return best.ch.filter(([, d]) => Math.abs(d) > 1 / 32).map(([j]) => j);
}
function plFitTell(r) {
  if (r == null) toast(pdt("noFit"), false);
  else if (r.length)
    toast(`${pdt("fitted")}: ${r.map((j) => j + 1).join(", ")}`, false);
}

/* typing a wall length locks it and closes the room with the free walls */
document.addEventListener("change", (e) => {
  const k = e.target && e.target.dataset && e.target.dataset.k;
  const m = k && /^plan\.room\.segs\.(\d+)\.(l|a)$/.exec(k);
  if (!m || !P.plan || !S.plan || e.target.classList.contains("bad")) return;
  const i = +m[1],
    pl = P.plan;
  if (m[2] === "l") {
    pl.walls[i] = pl.walls[i] || { th: 4.5, tile: false, tileH: null };
    pl.walls[i].lk = true;
  }
  plFitTell(plFitLocked(m[2] === "l" ? i : -1));
  saveSoon();
  renderPlan();
});

/* the lock next to every wall length field */
function plLockHtml(html) {
  const pl = P.plan;
  if (!pl) return html;
  return html.replace(
    /(<label class="f[^"]*"><span>)([^<]*)(<\/span><input data-k="plan\.room\.segs\.(\d+)\.l")/g,
    (all, a, lab, b, i) => {
      const on = !!(pl.walls[+i] && pl.walls[+i].lk);
      return `${a}${lab}<button type="button" class="plk ${on ? "on" : ""}" data-act="plLock:${i}" title="${on ? pdt("lockOn") : pdt("lockOff")}" aria-label="${on ? pdt("unlockT") : pdt("lockT")}">${PD_LOCK(on)}</button>${b}`;
    },
  );
}
{
  const ps = planSheet;
  planSheet = function () {
    let h = ps.apply(this, arguments);
    const pl = P.plan,
      V = S.plan;
    // a fresh plan starts from a sketch
    if (V && V.fresh && pl && !pl.items.length && /plTpl:/.test(h))
      h = `<h4>${pt("plNewT")}</h4><p class="hint">${pdt("startHint")}</p><div class="btns"><button class="btn p pldrawb" data-act="plDraw">✏️ ${pdt("draw")}</button><button class="btn" data-act="plBlank">▭ ${pdt("rect")}</button></div><p class="hsec">${pdt("tpl")}</p><div class="btns">${["bath58", "walkin", "kitchen"].map((k2) => `<button class="btn" data-act="plTpl:${k2}">${pt("tpl_" + k2)}</button>`).join("")}</div>`;
    h = plLockHtml(h);
    h = h.replace(
      `<p class="hint">${pt("plNone")}</p>`,
      `<p class="hint">${pt("plNone")} ${pdt("holdHint")}</p>`,
    );
    // redraw button next to "+ wall"
    h = h.replace(
      /(<button[^>]*data-act="plWadd"[^>]*>[^<]*<\/button>)/,
      `$1<button class="btn" data-act="plDraw">✏️ ${pdt("redraw")}</button>`,
    );
    return h;
  };
}
{
  const pa = planAct;
  planAct = function (a, arg) {
    const pl = P.plan;
    if (a === "plDraw") return plDrawModal();
    if (a === "plDrawDone") return plDrawApply();
    if (a === "plDrawUndo") {
      if (DRAW) DRAW.pts.pop();
      return renderDraw();
    }
    if (a === "plDrawClear") {
      if (DRAW) DRAW.pts = [];
      return renderDraw();
    }
    if (a === "plLock" && pl) {
      const i = +arg;
      pl.walls[i] = pl.walls[i] || { th: 4.5, tile: false, tileH: null };
      pl.walls[i].lk = !pl.walls[i].lk;
      saveSoon();
      return renderPlan();
    }
    if (a === "plFit" && pl) {
      const r = plFitLocked(-1);
      if (r == null) {
        if (!closeWalk(pl.room)) return plFitTell(null);
      } else plFitTell(r);
      saveSoon();
      return renderPlan();
    }
    if (a === "plPtAdd") return plPtAdd(arg);
    if (a === "plPtDel") return plPtDel(+arg);
    return pa.apply(this, arguments);
  };
}

/* ---------- sketching the outline ---------- */
function plDrawModal() {
  DRAW = { pts: [], stroke: null, plan: true };
  modal(
    `<h3>✏️ ${pdt("drawT")}</h3><p class="hint">${pdt("drawHint")}</p><svg id="dsvg" class="pldsvg"></svg><div class="btns"><button class="btn" data-act="plDrawUndo">↶ ${pdt("undoPt")}</button><button class="btn" data-act="plDrawClear">${pdt("clear")}</button><button class="btn p" data-act="plDrawDone">${pdt("done")}</button></div>`,
  );
  const el = $("#dsvg");
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    DRAW.W = r.width;
    DRAW.H = r.height;
    el.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    renderDraw();
  });
  const at = (e) => {
    const r = el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    DRAW.stroke = [at(e)];
    renderDraw();
  });
  el.addEventListener("pointermove", (e) => {
    if (!DRAW || !DRAW.stroke) return;
    const q = at(e),
      l = DRAW.stroke[DRAW.stroke.length - 1];
    if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 3) {
      DRAW.stroke.push(q);
      renderDraw();
    }
  });
  const up = () => {
    if (!DRAW || !DRAW.stroke) return;
    const st = DRAW.stroke;
    DRAW.stroke = null;
    let len = 0;
    for (let i = 1; i < st.length; i++)
      len += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]);
    const diag = Math.hypot(DRAW.W, DRAW.H),
      P0 = DRAW.pts[0];
    if (len < 10) {
      // a tap on the first point closes the outline
      if (
        DRAW.pts.length >= 3 &&
        Math.hypot(st[0][0] - P0[0], st[0][1] - P0[1]) < 24
      )
        return plDrawApply();
      DRAW.pts.push(st[0]);
    } else {
      const simp = rdp(st, diag * 0.025),
        last = DRAW.pts[DRAW.pts.length - 1];
      let add =
        last &&
        Math.hypot(simp[0][0] - last[0], simp[0][1] - last[1]) < diag * 0.05
          ? simp.slice(1)
          : simp;
      // a stroke ending on the first point closes the outline
      const end = add[add.length - 1];
      if (
        P0 &&
        DRAW.pts.length + add.length >= 4 &&
        Math.hypot(end[0] - P0[0], end[1] - P0[1]) < diag * 0.05
      ) {
        DRAW.pts.push(...add.slice(0, -1));
        return plDrawApply();
      }
      DRAW.pts.push(...add);
    }
    renderDraw();
  };
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}
function plDrawApply() {
  if (!DRAW || DRAW.pts.length < 3) {
    const h = $("#mbody .hint");
    if (h) h.textContent = pdt("need3");
    return;
  }
  const pl = P.plan;
  if (pl.items.length && !confirm(pdt("replaceQ"))) return;
  const sg = straighten(DRAW.pts, 120);
  if (!sg || sg.length < 3) {
    const h = $("#mbody .hint");
    if (h) h.textContent = pdt("need3");
    return;
  }
  bkBefore(pdt("drawT"));
  let pts = walkPoly({ segs: sg, a0: 0 }).pts;
  if (sArea(pts) < 0) pts = pts.slice().reverse();
  // start at the bottom-left corner, like the templates
  const i0 = pts.reduce(
    (bi, q, i) =>
      q[1] < pts[bi][1] - 1e-6 ||
      (Math.abs(q[1] - pts[bi][1]) < 1e-6 && q[0] < pts[bi][0])
        ? i
        : bi,
    0,
  );
  pts = pts.slice(i0).concat(pts.slice(0, i0));
  const mx = Math.min(...pts.map((q) => q[0])),
    my = Math.min(...pts.map((q) => q[1]));
  pts = pts.map((q) => [q[0] - mx, q[1] - my]);
  ptsToWalk(pl.room, pts);
  pl.room.segs.forEach((g) => {
    g.l = Math.round(g.l * 2) / 2;
    g.a = Math.round(g.a);
  });
  closeWalk(pl.room);
  pl.walls = pl.room.segs.map(() => ({ th: 4.5, tile: false, tileH: null }));
  pl.items = [];
  P.surfaces.forEach((s2) => {
    if (/^(w|z)\d+/.test(s2.fromPlan || "")) delete s2.fromPlan;
  });
  planEnsure();
  DRAW = null;
  const V = S.plan;
  V.fresh = false;
  V.sel = null;
  V.wsel = null;
  V.v = "top";
  V.z = 1;
  V.zx = V.zy = 0;
  S.plOpen = S.plOpen || {};
  S.plOpen.walls = 1;
  closeModal();
  saveSoon();
  renderPlan();
  toast(pdt("after"), false);
}

/* ---------- add / remove a corner ---------- */
function plRemapSurf(map, dropOld) {
  P.surfaces.forEach((s2) => {
    const m = /^(w|z)(\d+)(:.*)?$/.exec(s2.fromPlan || "");
    if (!m) return;
    const j = +m[2];
    if (j === dropOld) delete s2.fromPlan;
    else s2.fromPlan = m[1] + map(j) + (m[3] || "");
  });
}
/* arg "i:x:y" — wall i, the plan point pressed */
function plPtAdd(arg) {
  const [si, sx, sy] = String(arg).split(":"),
    i = +si,
    pl = P.plan,
    pts = planPts(),
    n = pts.length;
  if (!(i >= 0 && i < n)) return;
  const W = planWall(i, pts),
    a = pts[i],
    t0 = Math.max(
      2,
      Math.min(W.L - 2, (+sx - a[0]) * W.u[0] + (+sy - a[1]) * W.u[1]),
    );
  if (!(W.L > 4)) return;
  const t = Math.round(t0 * 2) / 2;
  bkBefore(pdt("addPt"));
  const q = [a[0] + W.u[0] * t, a[1] + W.u[1] * t],
    np = pts.slice(0, i + 1).concat([q], pts.slice(i + 1));
  ptsToWalk(pl.room, np);
  const w0 = pl.walls[i] || { th: 4.5, tile: false, tileH: null },
    w1 = JSON.parse(JSON.stringify(w0));
  delete w0.lk;
  delete w1.lk;
  pl.walls.splice(i + 1, 0, w1);
  pl.items.forEach((it) => {
    if (it.wall == null || PL_KINDS[it.k].floor) return;
    if (it.wall > i) it.wall++;
    else if (it.wall === i && +it.c > t) {
      it.wall = i + 1;
      it.c = +it.c - t;
    }
  });
  plRemapSurf((j) => (j > i ? j + 1 : j), -1);
  planEnsure();
  S.plan.wsel = null;
  saveSoon();
  renderPlan();
}
function plPtDel(c) {
  const pl = P.plan,
    pts = planPts(),
    n = pts.length;
  if (n <= 3) return toast(pdt("min3"), false);
  if (!(c >= 0 && c < n)) return;
  bkBefore(pdt("delPt"));
  const prev = (c - 1 + n) % n,
    Lprev = planWall(prev, pts).L,
    np = pts.filter((_, k) => k !== c);
  // old wall j -> new index
  const map = (j) =>
    c === 0 ? (j === 0 ? n - 2 : j - 1) : j === c ? c - 1 : j > c ? j - 1 : j;
  pl.items.forEach((it) => {
    if (it.wall == null || PL_KINDS[it.k].floor) return;
    const j = +it.wall;
    if (j === c) it.c = +it.c + Lprev;
    it.wall = map(j);
  });
  if (c === 0) pl.walls.shift();
  else pl.walls.splice(c, 1);
  const keep = pl.walls[map(prev)];
  if (keep) delete keep.lk;
  plRemapSurf(map, c);
  if (c === 0) {
    // the walk must start at pts[1] now: rotate so wall numbers follow the map above
    ptsToWalk(pl.room, np);
  } else ptsToWalk(pl.room, np);
  planEnsure();
  S.plan.wsel = null;
  saveSoon();
  renderPlan();
}

/* long press on a wall / a corner (called from the hold detector) */
function lpPlanWall(i, q) {
  LP = null;
  const pl = P.plan,
    on = !!(pl.walls[i] && pl.walls[i].lk);
  lpMenu(`${pdt("wall")} ${i + 1}`, [
    [
      `plPtAdd:${i}:${q[0].toFixed(3)}:${q[1].toFixed(3)}`,
      "＋ " + pdt("addPt"),
      "p",
    ],
    [`plLock:${i}`, on ? pdt("unlockT") : "🔒 " + pdt("lockT")],
    [`plWsel:${i}`, pdt("props")],
  ]);
}
function lpPlanCorner(c) {
  LP = null;
  const n = P.plan.room.segs.length;
  lpMenu(`${pdt("corner")} ${c + 1}`, [
    [`plPtDel:${c}`, pdt("delPt"), n > 3 ? "d" : ""],
  ]);
}
/* menu buttons call plan actions */
{
  const a0 = act;
  act = function (a, arg) {
    if (
      /^pl(PtAdd|PtDel|Lock|Wsel)$/.test(a) &&
      !$("#modal").hidden &&
      S.plan
    ) {
      closeModal();
      planAct(a, arg);
      return renderPlan();
    }
    return a0.apply(this, arguments);
  };
}

/* a new plan project opens the sketch right away */
{
  const ha = homeAct;
  homeAct = function (a) {
    const r = ha.apply(this, arguments);
    if (a === "homeNewPlan" && S.plan && P.plan && !P.plan.items.length)
      setTimeout(() => plDrawModal(), 60);
    return r;
  };
}

"use strict";
/* ================= room plan (top view + wall elevations) =================
   P.plan = { room: {shape:"walk", segs, a0}, walls: [{th, tile, tileH}], H, items: [...] }
   One source of truth for the room: walls with thickness, doors/windows in the walls,
   fixtures and cabinets placed against a wall (wall index + center distance "c" from the
   wall's start corner + depth "dp" into the room + height "h" + bottom "z").
   Floor items (drain, register) keep x/y in the floor frame.
   "Build surfaces" turns the plan into floor / wall / pan surfaces for tile layout. */

const PLT = {
  ru: {
    plT: "План комнаты",
    plTop: "Сверху",
    plWall: "Стена",
    plBack: "Проект",
    plRoom: "Комната",
    plH: "Высота потолка",
    plWalls: "Стены (обход: от левого нижнего угла вправо, против часовой = поворот влево)",
    plLen: "Длина",
    plTurn: "Поворот°",
    plTh: "Толщина",
    plTile: "Плитка на этой стене",
    plTileH: "Плитка до высоты",
    plAddDoor: "+ Дверь",
    plAddWin: "+ Окно",
    plAddItem: "+ Элемент",
    plAddHere: "Добавить на эту стену",
    plBuild: "Создать / обновить поверхности",
    plBuildHint:
      "План сам создаст пол (с порогами, унитазом, ванной), стены с плиткой (с окнами, дверями, нишами, розетками, вырезами под мебель) и поддоны душа. Настройки плитки на уже созданных поверхностях сохраняются.",
    plFromFloor: "Взять контур с пола",
    plGap: "Контур не замыкается",
    plFit: "Подогнать 2 последние стены",
    plC: "Центр от угла",
    plCs: "от угла",
    plW: "Ширина",
    plDp: "Глубина",
    plHh: "Высота",
    plZ: "От пола (низ)",
    plZc: "Высота центра",
    plRi: "Rough-in (центр от стены)",
    plX: "X",
    plY: "Y",
    plDtype: "Тип двери",
    plSwing: "Открывается",
    plHinge: "Петли",
    plDt: "Толщина двери",
    plDup: "Копия",
    plDel: "Удалить",
    plNone: "Нажми на стену или элемент. Элементы и углы можно тянуть пальцем.",
    plBuilt: "Готово: создано {a}, обновлено {b}",
    plLib: "Что добавить",
    plSel: "Выбрано",
    plEdges: "края",
    plOpen: "Раскладка этой стены",
    swing: "распашная",
    pocket: "pocket",
    slide: "раздвижная / barn",
    opening: "проём без двери",
    sw_in: "внутрь комнаты",
    sw_out: "наружу",
    hg_a: "у начала стены",
    hg_b: "у конца стены",
    k_door: "Дверь",
    k_window: "Окно",
    k_toilet: "Унитаз",
    k_vanity: "Vanity",
    k_tub: "Ванна",
    k_shower: "Поддон душа",
    k_cab: "Нижний шкаф",
    k_ucab: "Верхний шкаф",
    k_fridge: "Холодильник",
    k_range: "Плита",
    k_mirror: "Зеркало",
    k_niche: "Ниша",
    k_shelf: "Полка",
    k_valve: "Смеситель",
    k_head: "Лейка",
    k_outlet: "Розетка",
    k_switch: "Выключатель",
    k_drain: "Трап",
    k_register: "Решётка (пол)",
    plFloorName: "Пол (из плана)",
    plPanName: "Поддон душа",
    plTz: "Плитка на стене только по размеру элемента",
    plTzh: "Плитка до высоты",
    plTzo: "Запас по бокам",
    plTzs: "И на боковых стенах (торцы)",
  },
  en: {
    plT: "Room plan",
    plTop: "Top",
    plWall: "Wall",
    plBack: "Project",
    plRoom: "Room",
    plH: "Ceiling height",
    plWalls: "Walls (walk: from the bottom-left corner going right; counter-clockwise = left turn)",
    plLen: "Length",
    plTurn: "Turn°",
    plTh: "Thickness",
    plTile: "Tile on this wall",
    plTileH: "Tile up to",
    plAddDoor: "+ Door",
    plAddWin: "+ Window",
    plAddItem: "+ Item",
    plAddHere: "Add to this wall",
    plBuild: "Create / update surfaces",
    plBuildHint:
      "The plan creates the floor (with thresholds, toilet, tub), tiled walls (with windows, doors, niches, outlets, cut-outs for cabinets) and shower pans. Tile settings on surfaces that already exist are kept.",
    plFromFloor: "Take the outline from the floor",
    plGap: "Outline does not close",
    plFit: "Fit the last 2 walls",
    plC: "Center from corner",
    plCs: "from corner",
    plW: "Width",
    plDp: "Depth",
    plHh: "Height",
    plZ: "Bottom above floor",
    plZc: "Center height",
    plRi: "Rough-in (center from wall)",
    plX: "X",
    plY: "Y",
    plDtype: "Door type",
    plSwing: "Swings",
    plHinge: "Hinges",
    plDt: "Door thickness",
    plDup: "Copy",
    plDel: "Delete",
    plNone: "Tap a wall or an item. Items and corners can be dragged.",
    plBuilt: "Done: {a} created, {b} updated",
    plLib: "Add",
    plSel: "Selected",
    plEdges: "edges",
    plOpen: "Layout of this wall",
    swing: "swing",
    pocket: "pocket",
    slide: "sliding / barn",
    opening: "opening, no door",
    sw_in: "into the room",
    sw_out: "out",
    hg_a: "at wall start",
    hg_b: "at wall end",
    k_door: "Door",
    k_window: "Window",
    k_toilet: "Toilet",
    k_vanity: "Vanity",
    k_tub: "Tub",
    k_shower: "Shower pan",
    k_cab: "Base cabinet",
    k_ucab: "Upper cabinet",
    k_fridge: "Fridge",
    k_range: "Range",
    k_mirror: "Mirror",
    k_niche: "Niche",
    k_shelf: "Shelf",
    k_valve: "Valve",
    k_head: "Shower head",
    k_outlet: "Outlet",
    k_switch: "Switch",
    k_drain: "Drain",
    k_register: "Floor register",
    plFloorName: "Floor (from plan)",
    plPanName: "Shower pan",
    plTz: "Tile on the wall only over this item",
    plTzh: "Tile up to",
    plTzo: "Extra on each side",
    plTzs: "Also on the side walls (ends)",
  },
};
const pt = (k) => (PLT[lang] || PLT.en)[k] || t(k);

/* item kinds: default size; wall = sits against / in a wall; pt = point on the wall; floor = free on the floor */
const PL_KINDS = {
  door: { ic: "🚪", w: 30, h: 80, dp: 0, z: 0, inwall: 1 },
  window: { ic: "🪟", w: 36, h: 36, dp: 0, z: 42, inwall: 1 },
  toilet: { ic: "🚽", w: 20, dp: 28, h: 30, z: 0, ri: 12 },
  vanity: { ic: "🚰", w: 36, dp: 21, h: 34, z: 0, tz: 0, tzh: 40 },
  tub: { ic: "🛁", w: 60, dp: 30, h: 20, z: 0, tz: 1, tzh: 84, side: 1 },
  shower: { ic: "🚿", w: 48, dp: 36, h: 0, z: 0, tz: 1, tzh: 84, side: 1 },
  cab: { ic: "🗄", w: 36, dp: 24, h: 34.5, z: 0, tz: 1, tzh: 54 },
  ucab: { ic: "▭", w: 30, dp: 12, h: 30, z: 54 },
  fridge: { ic: "🧊", w: 36, dp: 30, h: 70, z: 0 },
  range: { ic: "🔥", w: 30, dp: 25, h: 36, z: 0, tz: 1, tzh: 54 },
  mirror: { ic: "🪞", w: 30, dp: 1, h: 36, z: 40 },
  niche: { ic: "▢", w: 12, dp: 3.5, h: 24, z: 42, inwall: 1 },
  shelf: { ic: "▬", w: 36, dp: 10, h: 1.5, z: 54 },
  valve: { ic: "⊗", w: 3, dp: 3, h: 3, z: 48, pt: 1 },
  head: { ic: "◔", w: 3, dp: 6, h: 3, z: 80, pt: 1 },
  outlet: { ic: "⏚", w: 2.25, dp: 1, h: 3.75, z: 44, pt: 1 },
  switch: { ic: "⏻", w: 2.25, dp: 1, h: 3.75, z: 48, pt: 1 },
  drain: { ic: "⊕", w: 4, dp: 4, h: 0, z: 0, floor: 1 },
  register: { ic: "▤", w: 10, dp: 4, h: 0, z: 0, floor: 1 },
};
const PL_ORDER = Object.keys(PL_KINDS);

/* ---------- data ---------- */
function planEnsure() {
  if (!P.plan) {
    P.plan = { room: { shape: "walk", segs: [], a0: 0 }, walls: [], H: 96, items: [] };
    const f = P.surfaces.find((s) => s.type === "floor" && !isShaped(s));
    if (f) planFromFloor(f);
    else ptsToWalk(P.plan.room, rectPoly(0, 0, 96, 60));
  }
  const pl = P.plan;
  pl.room.shape = "walk";
  pl.items = pl.items || [];
  pl.H = +pl.H || 96;
  pl.walls = pl.walls || [];
  while (pl.walls.length < pl.room.segs.length) pl.walls.push({ th: 4.5, tile: false, tileH: null });
  pl.walls.length = pl.room.segs.length;
  pl.items = pl.items.filter((it) => PL_KINDS[it.k] && (PL_KINDS[it.k].floor || it.wall < pl.room.segs.length));
  pl.items.forEach((it) => {
    const K = PL_KINDS[it.k];
    if (K.tzh != null && it.tz == null) Object.assign(it, { tz: !!K.tz, tzh: K.tzh, tzo: 0, tzs: !!K.side });
  });
  return pl;
}
function planFromFloor(f) {
  const pl = P.plan,
    O = outerPoly(f);
  ptsToWalk(pl.room, O.map((q) => q.slice()));
  pl.walls = pl.room.segs.map(() => ({ th: 4.5, tile: false, tileH: null }));
  pl.items = pl.items.filter((it) => it.k !== "door" && it.k !== "toilet");
  pl.src = f.id;
  (f.trans || []).forEach((tr) => {
    tr.pl = 1; // owned by the plan from now on: rebuilt from its doors
    const e = +tr.edge % O.length;
    pl.items.push(
      planNew("door", e, (+tr.from || 0) + (+tr.len || 30) / 2, {
        w: +tr.len || 30,
        dtype: tr.stop === "pocket" || tr.stop === "mid" ? "pocket" : "swing",
        swing: tr.stop === "out" ? "out" : "in",
      }),
    );
  });
  f.openings
    .filter((o) => o.type === "toilet")
    .forEach((o) => {
      o.pl = 1;
      const w = planNearWall(O, [o.x, o.y]);
      if (w) pl.items.push(planNew("toilet", w.i, w.s, { ri: Math.round(w.d * 8) / 8 }));
    });
}
function planNew(k, wall, c, extra) {
  const K = PL_KINDS[k];
  const it = { id: uid(), k, wall: K.floor ? null : wall, c, w: K.w, dp: K.dp, h: K.h, z: K.z };
  if (k === "toilet") it.ri = K.ri;
  if (K.tzh != null) Object.assign(it, { tz: !!K.tz, tzh: K.tzh, tzo: 0, tzs: !!K.side });
  if (k === "door") Object.assign(it, { dtype: "swing", swing: "in", hinge: "a", dt: 1.375 });
  return Object.assign(it, extra || {});
}

/* ---------- geometry ---------- */
function planPts() {
  return walkPoly(P.plan.room).pts;
}
function planWall(i, pts) {
  pts = pts || planPts();
  const n = pts.length,
    a = pts[i % n],
    b = pts[(i + 1) % n],
    L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
    u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L],
    sg = sArea(pts) > 0 ? 1 : -1,
    nout = [u[1] * sg, -u[0] * sg],
    nin = [-nout[0], -nout[1]],
    th = +((P.plan.walls[i] || {}).th ?? 4.5);
  // elevation: seen from inside the room, x grows to the viewer's right
  const r = [nout[1], -nout[0]],
    flip = u[0] * r[0] + u[1] * r[1] < 0;
  return { i, a, b, L, u, nout, nin, th, flip, ex: (c) => (flip ? L - c : c), cx: (x) => (flip ? L - x : x) };
}
const plAt = (W, s, d) => [W.a[0] + W.u[0] * s + W.nin[0] * d, W.a[1] + W.u[1] * s + W.nin[1] * d];
function planNearWall(pts, p) {
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const W = planWall(i, pts),
      s = (p[0] - W.a[0]) * W.u[0] + (p[1] - W.a[1]) * W.u[1],
      d = (p[0] - W.a[0]) * W.nin[0] + (p[1] - W.a[1]) * W.nin[1];
    if (s < -1 || s > W.L + 1) continue;
    const ad = Math.abs(d);
    if (!best || ad < best.ad) best = { i, s: Math.max(0, Math.min(W.L, s)), d, ad };
  }
  return best;
}
/* footprint of an item on the floor (polygon in floor coordinates) */
function planFoot(it, pts) {
  const K = PL_KINDS[it.k];
  if (K.floor) {
    const w = +it.w / 2,
      d = (+it.dp || +it.w) / 2;
    return rectPoly(+it.x - w, +it.y - d, 2 * w, 2 * d);
  }
  const W = planWall(it.wall, pts),
    c = +it.c,
    w = +it.w / 2,
    d0 = K.inwall ? -W.th : 0,
    d1 = K.inwall ? 0 : it.k === "niche" ? -(+it.dp || 0) : +it.dp || 0;
  if (it.k === "niche") return [plAt(W, c - w, 0), plAt(W, c + w, 0), plAt(W, c + w, d1), plAt(W, c - w, d1)];
  return [plAt(W, c - w, d0), plAt(W, c + w, d0), plAt(W, c + w, d1), plAt(W, c - w, d1)];
}
/* the outer face of the walls: each wall line pushed out by its thickness, neighbours intersected */
function planOuter(pts) {
  const n = pts.length,
    L = pts.map((_, i) => {
      const W = planWall(i, pts);
      return { p: [W.a[0] + W.nout[0] * W.th, W.a[1] + W.nout[1] * W.th], u: W.u };
    });
  return L.map((l, i) => {
    const m = L[(i - 1 + n) % n],
      det = m.u[0] * l.u[1] - m.u[1] * l.u[0];
    if (Math.abs(det) < 1e-9) return l.p.slice();
    const dx = l.p[0] - m.p[0],
      dy = l.p[1] - m.p[1],
      k = (dx * l.u[1] - dy * l.u[0]) / det;
    return [m.p[0] + m.u[0] * k, m.p[1] + m.u[1] * k];
  });
}

/* tile zones: tile only over a tub / shower / cabinet run (+ adjustable overlap), per wall,
   in that wall's elevation coordinates. Walls tiled in full are skipped. */
function planZoneBottom(it) {
  const z = +it.z || 0,
    h = +it.h || 0;
  return it.k === "shower" ? 0 : it.k === "cab" ? z + h + 1.5 : z + h;
}
function planZones(pts) {
  const pl = P.plan,
    n = pts.length,
    raw = [];
  pl.items.forEach((it) => {
    const K = PL_KINDS[it.k];
    if (K.tzh == null || !it.tz || K.floor) return;
    const top = Math.min(+pl.H || 96, +it.tzh || 0),
      bot = planZoneBottom(it),
      over = Math.max(0, +it.tzo || 0);
    if (top - bot < 0.5) return;
    const add = (j, s0, s1) => {
      if ((pl.walls[j] || {}).tile) return;
      const W = planWall(j, pts);
      s0 = Math.max(0, s0);
      s1 = Math.min(W.L, s1);
      if (s1 - s0 < 0.5) return;
      const xa = W.cx(s0),
        xb = W.cx(s1);
      raw.push({ wall: j, s0, s1, x0: Math.min(xa, xb), x1: Math.max(xa, xb), z0: bot, z1: top, ids: [it.id], k: it.k });
    };
    add(it.wall, +it.c - it.w / 2 - over, +it.c + it.w / 2 + over);
    if (it.tzs && K.side) {
      const Fp = planFoot(it, pts);
      for (let j = 0; j < n; j++) {
        if (j === it.wall) continue;
        const W = planWall(j, pts),
          ss = Fp.map((q) => (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1]),
          dd = Fp.map((q) => (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1]);
        if (Math.min(...dd) > 1 || Math.min(...dd) < -1 || Math.max(...ss) < 0 || Math.min(...ss) > W.L) continue;
        add(j, Math.min(...ss) - over, Math.max(...ss) + over);
      }
    }
  });
  // merge touching zones on the same wall with about the same bottom (a cabinet run + range)
  const out = [];
  raw
    .sort((a, b) => a.wall - b.wall || a.x0 - b.x0)
    .forEach((z) => {
      const p = out[out.length - 1];
      if (p && p.wall === z.wall && z.x0 <= p.x1 + 0.5 && Math.abs(z.z0 - p.z0) <= 2) {
        p.x1 = Math.max(p.x1, z.x1);
        p.s0 = Math.min(p.s0, z.s0);
        p.s1 = Math.max(p.s1, z.s1);
        p.z0 = Math.max(p.z0, z.z0);
        p.z1 = Math.max(p.z1, z.z1);
        p.ids = p.ids.concat(z.ids);
      } else out.push(Object.assign({}, z));
    });
  return out;
}

/* ---------- page ---------- */
function planEl() {
  let el = $("#plan");
  if (!el) {
    el = document.createElement("div");
    el.id = "plan";
    document.body.appendChild(el);
    el.addEventListener("input", onInp);
    el.addEventListener("change", onInp);
    el.addEventListener("pointerdown", planDown);
  }
  return el;
}
function planOpen() {
  planEnsure();
  closeModal();
  S.plan = { v: "top", sel: null, wsel: null };
  document.body.classList.add("planon");
  renderPlan();
}
function planClose() {
  S.plan = null;
  document.body.classList.remove("planon");
  renderAll();
  requestAnimationFrame(() => draw());
}
function renderPlan() {
  if (!S.plan) return;
  const el = planEl(),
    pl = planEnsure(),
    V = S.plan,
    n = pl.room.segs.length;
  if (typeof V.v === "number" && V.v >= n) V.v = "top";
  if (V.sel && !pl.items.find((x) => x.id === V.sel)) V.sel = null;
  if (V.wsel != null && V.wsel >= n) V.wsel = null;
  let h = `<div class="plhead"><button data-act="plClose">‹ ${pt("plBack")}</button><b>${pt("plT")}</b><button data-act="plUndo" title="Undo">↶</button></div>`;
  h += `<div class="plviews"><button data-act="plView:top" class="${V.v === "top" ? "on" : ""}">▦ ${pt("plTop")}</button>${pl.room.segs
    .map((g, i) => `<button data-act="plView:${i}" class="${V.v === i ? "on" : ""}">▥ ${i + 1} · ${fmt(+g.l)}</button>`)
    .join("")}</div>`;
  h += `<div class="plsvg" id="plsvg"></div><div class="plsheet" id="plsheet">${planSheet()}</div>`;
  el.innerHTML = h;
  planDraw();
}
function planSheet() {
  const pl = P.plan,
    V = S.plan,
    idx = pl.items.findIndex((x) => x.id === V.sel);
  const B = (act, label, cls = "") => `<button class="btn sm ${cls}" data-act="${act}">${label}</button>`;
  if (idx >= 0) {
    const it = pl.items[idx],
      K = PL_KINDS[it.k],
      p = `plan.items.${idx}.`;
    let h = `<h4>${K.ic} ${pt("k_" + it.k)}</h4><div class="grid2">`;
    if (!K.floor) {
      h += `<label class="f"><span>${pt("plWall")}</span><select data-k="${p}wall" data-sc="p" data-t="sel" data-rb="1">${pl.room.segs
        .map((_, i) => `<option value="${i}" ${i === +it.wall ? "selected" : ""}>${pt("plWall")} ${i + 1}</option>`)
        .join("")}</select></label>`;
      h += F(pt("plC"), p + "c", "len", "p");
    } else {
      h += F(pt("plX"), p + "x", "len", "p") + F(pt("plY"), p + "y", "len", "p");
    }
    if (!K.pt) h += F(pt("plW"), p + "w", "len", "p");
    if (!K.inwall && !K.pt && !K.floor) h += F(pt("plDp"), p + "dp", "len", "p");
    if (it.k === "register") h += F(pt("plDp"), p + "dp", "len", "p");
    if (it.k === "niche") h += F(pt("plDp"), p + "dp", "len", "p");
    if (!K.floor && it.k !== "shower") h += F(pt("plHh"), p + "h", "len", "p");
    if (["window", "ucab", "mirror", "niche", "shelf"].includes(it.k)) h += F(pt("plZ"), p + "z", "len", "p");
    if (K.pt) h += F(pt("plZc"), p + "z", "len", "p");
    if (it.k === "toilet") h += F(pt("plRi"), p + "ri", "len", "p");
    if (K.tzh != null) {
      h += `</div>${CHK(pt("plTz"), p + "tz", 1, "p")}`;
      if (it.tz) {
        h += `<div class="grid2">${F(pt("plTzh"), p + "tzh", "len", "p")}${F(pt("plTzo"), p + "tzo", "len", "p")}</div>`;
        if (K.side) h += CHK(pt("plTzs"), p + "tzs", 1, "p");
        const zs = planZones(planPts()).filter((z) => z.ids.includes(it.id));
        if (zs.length)
          h += `<p class="hint">${zs.map((z) => `${pt("plWall")} ${z.wall + 1}: ${fmt(z.x1 - z.x0)} × ${fmt(z.z1 - z.z0)}`).join(" · ")}</p>`;
      }
      h += `<div class="grid2">`;
    }
    if (it.k === "door") {
      h += SEL(pt("plDtype"), p + "dtype", ["swing", "pocket", "slide", "opening"], 1, "p", "", (o) => pt(o));
      if (it.dtype === "swing") {
        h += SEL(pt("plSwing"), p + "swing", ["in", "out"], 1, "p", "", (o) => pt("sw_" + o));
        h += SEL(pt("plHinge"), p + "hinge", ["a", "b"], 1, "p", "", (o) => pt("hg_" + o));
        h += F(pt("plDt"), p + "dt", "len", "p");
      }
    }
    h += `</div>`;
    if (!K.floor && !K.pt) {
      const W = planWall(it.wall);
      h += `<p class="hint">${pt("plEdges")}: ${fmt(+it.c - it.w / 2)} · ${fmt(W.L - +it.c - it.w / 2)} ${pt("plCs")}</p>`;
    }
    h += `<div class="btns plnudge">${B("plNudge:-1:0", "←")}${B("plNudge:1:0", "→")}${B("plNudge:0:1", "↑")}${B("plNudge:0:-1", "↓")}${B("plDup", pt("plDup"))}${B("plDel", pt("plDel"), "danger")}</div>`;
    return h;
  }
  if (V.wsel != null) {
    const i = V.wsel,
      w = pl.walls[i];
    let h = `<h4>▥ ${pt("plWall")} ${i + 1}</h4><div class="grid2">${F(pt("plLen"), `plan.room.segs.${i}.l`, "len", "p")}${F(pt("plTurn"), `plan.room.segs.${i}.a`, "num", "p")}${F(pt("plTh"), `plan.walls.${i}.th`, "len", "p")}</div>`;
    h += CHK(pt("plTile"), `plan.walls.${i}.tile`, 1, "p");
    if (w.tile) h += `<div class="grid2">${F(pt("plTileH"), `plan.walls.${i}.tileH`, "len", "p")}</div>`;
    h += `<p class="hsec">${pt("plAddHere")}</p><div class="pllib">${PL_ORDER.filter((k) => !PL_KINDS[k].floor)
      .map((k) => `<button data-act="plAdd:${k}:${i}"><span>${PL_KINDS[k].ic}</span>${pt("k_" + k)}</button>`)
      .join("")}</div>`;
    const sf = P.surfaces.findIndex((s) => s.fromPlan === "w" + i);
    if (sf >= 0) h += `<div class="btns">${B("plGo:" + sf, "▦ " + pt("plOpen"))}</div>`;
    return h;
  }
  // room
  const wk = walkPoly(pl.room);
  let h = `<div class="btns">${B("plAdd:door", pt("plAddDoor"))}${B("plAdd:window", pt("plAddWin"))}${B("plLib", pt("plAddItem"), "p")}</div>`;
  h += `<p class="hint">${pt("plNone")}</p>`;
  if (wk.gap > 0.1)
    h += `<div class="note">⚠ ${pt("plGap")}: ${fmt(wk.gap)} <button class="btn sm" data-act="plFit">${pt("plFit")}</button></div>`;
  h += `<h4>${pt("plRoom")}</h4><div class="grid2">${F(pt("plH"), "plan.H", "len", "p")}</div>`;
  h += `<p class="hint">${pt("plWalls")}</p><div class="plwalls">${pl.room.segs
    .map(
      (g, i) =>
        `<div class="plwrow"><b data-act="plWsel:${i}">${i + 1}</b>${F(pt("plLen"), `plan.room.segs.${i}.l`, "len", "p")}${F(pt("plTurn"), `plan.room.segs.${i}.a`, "num", "p")}${F(pt("plTh"), `plan.walls.${i}.th`, "len", "p")}<button class="btn sm" data-act="plWdel:${i}" ${pl.room.segs.length <= 3 ? "disabled" : ""}>✕</button></div>`,
    )
    .join("")}</div><div class="btns">${B("plWadd", "+ " + pt("plWall"))}</div>`;
  h += `<div class="btns">${B("plBuild", "⇄ " + pt("plBuild"), "p")}${P.surfaces.some((s) => s.type === "floor") ? B("plFromFloor", pt("plFromFloor")) : ""}</div><p class="hint">${pt("plBuildHint")}</p>`;
  return h;
}

/* ---------- drawing ---------- */
const PLC = { wall: "#4a4743", cut: "#d0342c", sel: "#e07a1f", dim: "#1d5fa8", item: "#141414", fill: "#f6f3ec" };
function plText(x, y, s, size, o = {}) {
  const rot = o.rot ? ` transform="rotate(${o.rot.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})"` : "";
  return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${size.toFixed(2)}" text-anchor="middle" dominant-baseline="central" fill="${o.fill || PLC.dim}" font-weight="${o.fw || 700}" font-family="${FONT}" paint-order="stroke" stroke="${o.bg || "#fff"}" stroke-width="${(size * 0.28).toFixed(2)}"${rot}>${esc(s)}</text>`;
}
/* dimension line from p to q (screen coords), text above */
function plDim(p, q, label, k, off) {
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    L = Math.hypot(dx, dy) || 1,
    ux = dx / L,
    uy = dy / L,
    nx = -uy,
    ny = ux,
    a = [p[0] + nx * off, p[1] + ny * off],
    b = [q[0] + nx * off, q[1] + ny * off],
    tk = 4 * k;
  let ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  if (ang > 90) ang -= 180;
  if (ang <= -90) ang += 180;
  const sl = (c) => `M${(c[0] - (ux - nx) * tk * 0.7).toFixed(2)} ${(c[1] - (uy - ny) * tk * 0.7).toFixed(2)}L${(c[0] + (ux - nx) * tk * 0.7).toFixed(2)} ${(c[1] + (uy - ny) * tk * 0.7).toFixed(2)}`;
  let h = `<path d="M${p[0].toFixed(2)} ${p[1].toFixed(2)}L${(a[0] + nx * 3 * k).toFixed(2)} ${(a[1] + ny * 3 * k).toFixed(2)}M${q[0].toFixed(2)} ${q[1].toFixed(2)}L${(b[0] + nx * 3 * k).toFixed(2)} ${(b[1] + ny * 3 * k).toFixed(2)}" stroke="${PLC.dim}" stroke-width="${(0.6 * k).toFixed(2)}" opacity=".55"/>`;
  h += `<path d="M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}${sl(a)}${sl(b)}" stroke="${PLC.dim}" stroke-width="${(1 * k).toFixed(2)}" fill="none"/>`;
  if (label && L > 9 * k) {
    const fs = Math.min(11 * k, (L / Math.max(3, label.length * 0.62)) * 1.05);
    if (fs > 6.5 * k) h += plText((a[0] + b[0]) / 2 + nx * 7 * k, (a[1] + b[1]) / 2 + ny * 7 * k, label, fs, { rot: ang });
  }
  return h;
}
function planDraw() {
  const box = $("#plsvg");
  if (!box || !S.plan) return;
  const W0 = box.clientWidth || 360,
    H0 = box.clientHeight || 360;
  box.innerHTML = S.plan.v === "top" ? planTopSVG(W0, H0) : planElevSVG(+S.plan.v, W0, H0);
}
function plFit(bb, W0, H0, pad) {
  const w = bb.x1 - bb.x0 || 1,
    h = bb.y1 - bb.y0 || 1,
    k = Math.max(w / Math.max(40, W0 - 2 * pad), h / Math.max(40, H0 - 2 * pad));
  const vw = W0 * k,
    vh = H0 * k,
    x0 = (bb.x0 + bb.x1) / 2 - vw / 2,
    y0 = (bb.y0 + bb.y1) / 2 - vh / 2;
  return { k, vb: `${x0.toFixed(2)} ${y0.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}` };
}
function planTopSVG(W0, H0) {
  const pl = P.plan,
    V = S.plan,
    pts = planPts(),
    n = pts.length,
    out = planOuter(pts),
    // screen coords: y down
    sp = (p) => [p[0], -p[1]],
    pd = (A) => "M" + A.map((q) => sp(q).map((v) => v.toFixed(2)).join(" ")).join("L") + "Z";
  const ob = bboxOf(out),
    m = 34,
    bb = { x0: ob.x0 - m, x1: ob.x1 + m, y0: -ob.y1 - m, y1: -ob.y0 + m },
    F0 = plFit(bb, W0, H0, 6),
    k = F0.k;
  let h = `<svg viewBox="${F0.vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" data-k="${k}">`;
  h += `<defs><pattern id="plh" width="${6 * k}" height="${6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${6 * k}" height="${6 * k}" fill="#d8d3c8"/><path d="M0 0V${6 * k}" stroke="#8d877b" stroke-width="${1.1 * k}"/></pattern></defs>`;
  h += `<path d="${pd(pts)}" fill="${PLC.fill}"/>`;
  h += `<path d="${pd(out)}${pd(pts)}" fill="url(#plh)" fill-rule="evenodd" stroke="${PLC.wall}" stroke-width="${1.4 * k}" data-pwall="1"/>`;
  // wall hit lines + numbers
  for (let i = 0; i < n; i++) {
    const W = planWall(i, pts),
      a = sp(W.a),
      b = sp(W.b),
      mid = sp(plAt(W, W.L / 2, -W.th / 2)),
      on = V.wsel === i;
    h += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${on ? PLC.sel : "transparent"}" stroke-width="${(on ? 3 : 1) * k}" opacity=".9"/>`;
    const q1 = sp(plAt(W, 0, -W.th / 2)),
      q2 = sp(plAt(W, W.L, -W.th / 2));
    h += `<path d="M${q1[0]} ${q1[1]}L${q2[0]} ${q2[1]}" stroke="transparent" stroke-width="${Math.max(W.th, 16 * k)}" data-pw="${i}"/>`;
    const nb = sp(plAt(W, W.L / 2, 11 * k + 2));
    h += `<circle cx="${nb[0]}" cy="${nb[1]}" r="${7 * k}" fill="${on ? PLC.sel : "#fff"}" stroke="${on ? PLC.sel : PLC.wall}" stroke-width="${k}" data-pw="${i}"/>${plText(nb[0], nb[1], String(i + 1), 9 * k, { fill: on ? "#fff" : PLC.wall, bg: "none" }).replace("<text", `<text data-pw="${i}"`)}`;
    void mid;
  }
  // tiled stretches of wall: blue band on the inner face
  for (let i = 0; i < n; i++)
    if ((pl.walls[i] || {}).tile) {
      const W = planWall(i, pts),
        a = sp(plAt(W, 0, 1.2 * k)),
        b = sp(plAt(W, W.L, 1.2 * k));
      h += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#2f7fd0" stroke-width="${2.6 * k}" opacity=".75"/>`;
    }
  planZones(pts).forEach((z) => {
    const W = planWall(z.wall, pts),
      a = sp(plAt(W, z.s0, 1.2 * k)),
      b = sp(plAt(W, z.s1, 1.2 * k));
    h += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#2f7fd0" stroke-width="${2.6 * k}" opacity=".75"/>`;
  });
  // items
  pl.items.forEach((it) => (h += planItemTop(it, pts, k, it.id === V.sel)));
  // dimensions outside each wall: chain of item edges + overall
  for (let i = 0; i < n; i++) {
    const W = planWall(i, pts),
      br = [0, W.L];
    pl.items
      .filter((it) => it.wall === i && !PL_KINDS[it.k].floor)
      .forEach((it) => {
        if (PL_KINDS[it.k].pt || it.k === "toilet") br.push(+it.c);
        else br.push(+it.c - it.w / 2, +it.c + it.w / 2);
      });
    const S2 = [...new Set(br.map((v) => Math.round(Math.max(0, Math.min(W.L, v)) * 16) / 16))].sort((x, y) => x - y);
    const base = (s) => sp(plAt(W, s, -W.th)),
      // offsets are to the left of the a->b direction in screen space; flip sign so it points outward
      sideSign = (() => {
        const a = sp(W.a),
          b = sp(W.b),
          o = sp(plAt(W, W.L / 2, -W.th - 10)),
          mx = (a[0] + b[0]) / 2,
          my = (a[1] + b[1]) / 2,
          dx = b[0] - a[0],
          dy = b[1] - a[1];
        return -dy * (o[0] - mx) + dx * (o[1] - my) > 0 ? 1 : -1;
      })();
    if (S2.length > 2)
      for (let j = 0; j < S2.length - 1; j++)
        if (S2[j + 1] - S2[j] > 0.05) h += plDim(base(S2[j]), base(S2[j + 1]), fmt(S2[j + 1] - S2[j]), k, sideSign * 12 * k);
    h += plDim(base(0), base(W.L), fmt(W.L), k, sideSign * (S2.length > 2 ? 26 : 12) * k);
  }
  // corner handles
  pts.forEach((q, i) => {
    const c = sp(q);
    h += `<g data-pc="${i}"><circle cx="${c[0]}" cy="${c[1]}" r="${14 * k}" fill="transparent"/><circle cx="${c[0]}" cy="${c[1]}" r="${4.5 * k}" fill="#fff" stroke="${PLC.dim}" stroke-width="${1.6 * k}"/></g>`;
  });
  // odd angles
  const A = cornerAngles(pts);
  pts.forEach((q, i) => {
    if (Math.abs(A[i] - 90) < 0.3 || Math.abs(A[i] - 270) < 0.3) return;
    const W = planWall(i, pts),
      Wp = planWall((i - 1 + n) % n, pts),
      d = [W.nin[0] + Wp.nin[0], W.nin[1] + Wp.nin[1]],
      dl = Math.hypot(d[0], d[1]) || 1,
      p = sp([q[0] + (d[0] / dl) * 16 * k, q[1] + (d[1] / dl) * 16 * k]);
    h += plText(p[0], p[1], Math.round(A[i] * 10) / 10 + "°", 9 * k, { fill: "#b4441b" });
  });
  return h + `</svg>`;
}
function planItemTop(it, pts, k, sel) {
  const K = PL_KINDS[it.k],
    sp = (p) => [p[0], -p[1]],
    P2 = (A) => A.map((q) => sp(q).map((v) => v.toFixed(2)).join(",")).join(" "),
    stc = sel ? PLC.sel : PLC.item,
    sw = (sel ? 2 : 1.1) * k;
  const g = (inner) => `<g data-pi="${it.id}" style="cursor:move">${inner}</g>`;
  if (K.floor) {
    const c = sp([+it.x, +it.y]);
    if (it.k === "drain")
      return g(
        `<circle cx="${c[0]}" cy="${c[1]}" r="${Math.max(+it.w / 2, 5 * k)}" fill="#fff" stroke="${stc}" stroke-width="${sw}"/><path d="M${c[0] - 2.5} ${c[1]}h5M${c[0]} ${c[1] - 2.5}v5" stroke="${stc}" stroke-width="${0.7 * k}"/>`,
      );
    const F0 = planFoot(it, pts);
    return g(
      `<polygon points="${P2(F0)}" fill="#fff" stroke="${stc}" stroke-width="${sw}"/><path d="M${c[0] - it.w / 2 + 1.5} ${c[1] - 1}h${it.w - 3}M${c[0] - it.w / 2 + 1.5} ${c[1] + 1}h${it.w - 3}" stroke="${stc}" stroke-width="${0.6 * k}"/>`,
    );
  }
  const W = planWall(it.wall, pts),
    c = +it.c,
    w = +it.w,
    at = (s, d) => sp(plAt(W, s, d)),
    poly = (A) => `<polygon points="${A.map((q) => q.map((v) => v.toFixed(2)).join(",")).join(" ")}"`,
    rect = (s0, s1, d0, d1) => [at(s0, d0), at(s1, d0), at(s1, d1), at(s0, d1)],
    ang = (Math.atan2(-W.u[1], W.u[0]) * 180) / Math.PI;
  const ell = (sc, dc, rs, rd) => {
    const q = at(sc, dc);
    return `<ellipse cx="${q[0].toFixed(2)}" cy="${q[1].toFixed(2)}" rx="${rs}" ry="${rd}" transform="rotate(${ang.toFixed(2)} ${q[0].toFixed(2)} ${q[1].toFixed(2)})"`;
  };
  const lbl = (s, d, txt, fs) => {
    const q = at(s, d);
    let a2 = ang;
    if (a2 > 90) a2 -= 180;
    if (a2 <= -90) a2 += 180;
    return plText(q[0], q[1], txt, fs || 8 * k, { fill: "#6b665c", fw: 600, rot: a2 });
  };
  let h = "";
  const s0 = c - w / 2,
    s1 = c + w / 2,
    dp = +it.dp || 0;
  switch (it.k) {
    case "door": {
      h += poly(rect(s0, s1, -W.th - 0.5, 0.5)) + ` fill="#fff" stroke="none"/>`;
      h += `<path d="M${at(s0, -W.th).join(" ")}L${at(s0, 0).join(" ")}M${at(s1, -W.th).join(" ")}L${at(s1, 0).join(" ")}" stroke="${PLC.wall}" stroke-width="${1.4 * k}"/>`;
      const hs = it.hinge === "b" ? s1 : s0,
        fs = it.hinge === "b" ? s0 : s1;
      if (it.dtype === "swing") {
        const inn = it.swing !== "out",
          d0 = inn ? 0 : -W.th,
          dir = inn ? 1 : -1,
          hp = at(hs, d0),
          tip = at(hs, d0 + dir * w),
          fp = at(fs, d0);
        // the arc's sweep flag depends on the wall direction; pick the one that bulges into the swing side
        const ctl = at((hs + fs) / 2, d0 + dir * w * 0.6),
          cr = (A, B, C) => (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
        const sweep = cr(tip, fp, ctl) > 0 ? 0 : 1;
        h += `<path d="M${hp.join(" ")}L${tip.join(" ")}" stroke="${stc}" stroke-width="${sw * 1.4}"/>`;
        h += `<path d="M${tip.join(" ")}A${w} ${w} 0 0 ${sweep} ${fp.join(" ")}" fill="none" stroke="${stc}" stroke-width="${0.8 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
      } else if (it.dtype === "pocket") {
        h += poly(rect(fs > hs ? s0 - w : s1, fs > hs ? s0 : s1 + w, -W.th / 2 - 0.9, -W.th / 2 + 0.9)) + ` fill="none" stroke="${stc}" stroke-width="${0.9 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
        h += poly(rect(s0, s0 + w * 0.15, -W.th / 2 - 0.9, -W.th / 2 + 0.9)) + ` fill="${stc}"/>`;
      } else if (it.dtype === "slide") {
        h += poly(rect(s0 - 2, s1 + 2, 1.5, 3.2)) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      }
      h += poly(rect(s0, s1, -W.th, 0)) + ` fill="transparent"/>`;
      h += lbl(c, -W.th / 2, `${fmtIn(w)}`, 7 * k);
      break;
    }
    case "window":
      h += poly(rect(s0, s1, -W.th, 0)) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h += `<path d="M${at(s0, -W.th / 2).join(" ")}L${at(s1, -W.th / 2).join(" ")}M${at(s0, -W.th / 2 - 1).join(" ")}L${at(s1, -W.th / 2 - 1).join(" ")}" stroke="${PLC.dim}" stroke-width="${0.8 * k}"/>`;
      break;
    case "toilet": {
      h += poly(rect(c - 9.5, c + 9.5, 0, 8)) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h += ell(c, 8 + (Math.max(dp, 20) - 8) / 2, Math.min(w, 20) * 0.38, (Math.max(dp, 20) - 8) / 2) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      const f = at(c, +it.ri || 12);
      h += `<path d="M${f[0] - 2} ${f[1]}h4M${f[0]} ${f[1] - 2}v4" stroke="${PLC.cut}" stroke-width="${0.8 * k}"/>`;
      break;
    }
    case "vanity":
      h += poly(rect(s0, s1, 0, dp)) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h += ell(c, dp * 0.52, Math.min(w * 0.3, 9), dp * 0.27) + ` fill="none" stroke="${stc}" stroke-width="${0.8 * k}"/>`;
      h += lbl(c, dp - 3, pt("k_vanity"));
      break;
    case "tub":
      h += poly(rect(s0, s1, 0, dp)) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h += poly(rect(s0 + 3, s1 - 3, 3, dp - 3)) + ` fill="none" stroke="${stc}" stroke-width="${0.8 * k}" rx="4"/>`;
      h += lbl(c, dp / 2, pt("k_tub"));
      break;
    case "shower": {
      h += poly(rect(s0, s1, 0, dp)) + ` fill="#eef3f8" stroke="${stc}" stroke-width="${sw}"/>`;
      h += `<path d="M${at(s0, 0).join(" ")}L${at(s1, dp).join(" ")}M${at(s1, 0).join(" ")}L${at(s0, dp).join(" ")}" stroke="${stc}" stroke-width="${0.5 * k}" opacity=".35"/>`;
      const q = at(c, dp / 2);
      h += `<circle cx="${q[0]}" cy="${q[1]}" r="2" fill="#fff" stroke="${stc}" stroke-width="${0.8 * k}"/>`;
      break;
    }
    case "cab":
    case "fridge":
    case "range":
      h += poly(rect(s0, s1, 0, dp)) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      if (it.k === "range")
        [
          [0.3, 0.3],
          [0.7, 0.3],
          [0.3, 0.7],
          [0.7, 0.7],
        ].forEach(([a1, b1]) => {
          const q = at(s0 + w * a1, dp * b1);
          h += `<circle cx="${q[0]}" cy="${q[1]}" r="${Math.min(w, dp) * 0.13}" fill="none" stroke="${stc}" stroke-width="${0.7 * k}"/>`;
        });
      else h += lbl(c, dp / 2, it.k === "fridge" ? "REF" : pt("k_cab"), 7 * k);
      break;
    case "ucab":
    case "shelf":
      h += poly(rect(s0, s1, 0, dp)) + ` fill="none" stroke="${stc}" stroke-width="${sw}" stroke-dasharray="${4 * k} ${3 * k}"/>`;
      break;
    case "mirror":
      h += poly(rect(s0, s1, 0, 1)) + ` fill="#cfe3f2" stroke="${stc}" stroke-width="${sw}"/>`;
      break;
    case "niche":
      h += poly(rect(s0, s1, -dp, 0)) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
      break;
    default: {
      // point items on the wall face
      const q = at(c, 2.2),
        r = 2.4;
      h += `<circle cx="${q[0]}" cy="${q[1]}" r="${Math.max(r, 3.2 * k)}" fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h += plText(q[0], q[1], it.k === "outlet" ? "⏚" : it.k === "switch" ? "S" : it.k === "valve" ? "V" : "H", 5 * k, { fill: stc, bg: "none" });
    }
  }
  if (sel && !K.pt) h += poly(planFoot(it, pts).map(sp)) + ` fill="none" stroke="${PLC.sel}" stroke-width="${1 * k}" stroke-dasharray="${2 * k} ${2 * k}"/>`;
  return g(h);
}

/* elevation of wall i, seen from inside the room */
function planElevSVG(i, W0, H0) {
  const pl = P.plan,
    pts = planPts(),
    n = pts.length,
    W = planWall(i, pts),
    L = W.L,
    H = +pl.H || 96,
    ws = pl.walls[i] || {},
    V = S.plan;
  const thL = planWall(W.flip ? (i + 1) % n : (i - 1 + n) % n, pts).th,
    thR = planWall(W.flip ? (i - 1 + n) % n : (i + 1) % n, pts).th;
  const bb = { x0: -thL - 16, x1: L + thR + 44, y0: -H - 14, y1: 40 },
    F0 = plFit(bb, W0, H0, 6),
    k = F0.k,
    Y = (z) => -z;
  let h = `<svg viewBox="${F0.vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" data-k="${k}">`;
  h += `<defs><pattern id="plh2" width="${6 * k}" height="${6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${6 * k}" height="${6 * k}" fill="#d8d3c8"/><path d="M0 0V${6 * k}" stroke="#8d877b" stroke-width="${1.1 * k}"/></pattern></defs>`;
  h += `<rect x="0" y="${Y(H)}" width="${L}" height="${H}" fill="${PLC.fill}" stroke="${PLC.wall}" stroke-width="${k}"/>`;
  if (ws.tile) {
    const th2 = Math.min(H, +ws.tileH || H);
    h += `<rect x="0" y="${Y(th2)}" width="${L}" height="${th2}" fill="#e6eef5" stroke="${PLC.dim}" stroke-width="${0.8 * k}" stroke-dasharray="${4 * k} ${3 * k}"/>`;
    h += plText(L / 2, Y(th2) + 8 * k, `${t("tile")} ↑ ${fmt(th2)}`, 8 * k, { fill: PLC.dim, fw: 600, bg: "#e6eef5" });
  }
  h += `<rect x="${-thL}" y="${Y(H)}" width="${thL}" height="${H}" fill="url(#plh2)" stroke="${PLC.wall}" stroke-width="${k}"/><rect x="${L}" y="${Y(H)}" width="${thR}" height="${H}" fill="url(#plh2)" stroke="${PLC.wall}" stroke-width="${k}"/>`;
  h += `<path d="M${-thL - 8} 0H${L + thR + 8}" stroke="${PLC.wall}" stroke-width="${2.2 * k}"/>`;
  const xs = [0, L],
    zs = [0, H];
  if (ws.tile) zs.push(Math.min(H, +ws.tileH || H));
  planZones(pts)
    .filter((z) => z.wall === i)
    .forEach((z) => {
      h += `<rect x="${z.x0}" y="${Y(z.z1)}" width="${z.x1 - z.x0}" height="${z.z1 - z.z0}" fill="#e6eef5" stroke="${PLC.dim}" stroke-width="${0.8 * k}" stroke-dasharray="${4 * k} ${3 * k}"/>`;
      h += plText((z.x0 + z.x1) / 2, Y(z.z1) + 8 * k, `${t("tile")} ${fmt(z.x1 - z.x0)} × ${fmt(z.z1 - z.z0)}`, Math.min(8 * k, (z.x1 - z.x0) / 9), { fill: PLC.dim, fw: 600, bg: "#e6eef5" });
      xs.push(z.x0, z.x1);
      zs.push(z.z0, z.z1);
    });
  // items on this wall, then side views of items standing against it from other walls
  const own = pl.items.filter((it) => it.wall === i && !PL_KINDS[it.k].floor);
  const side = [];
  pl.items.forEach((it) => {
    if (it.wall === i || PL_KINDS[it.k].floor || PL_KINDS[it.k].inwall || PL_KINDS[it.k].pt || !(+it.h > 0)) return;
    const Fp = planFoot(it, pts),
      ss = Fp.map((q) => (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1]),
      dd = Fp.map((q) => (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1]);
    if (Math.min(...dd) > 1 || Math.max(...ss) < 0 || Math.min(...ss) > L) return;
    const x0 = W.cx(Math.max(0, Math.min(...ss))),
      x1 = W.cx(Math.min(L, Math.max(...ss)));
    side.push({ it, x0: Math.min(x0, x1), x1: Math.max(x0, x1) });
  });
  side.forEach(({ it, x0, x1 }) => {
    h += `<rect x="${x0}" y="${Y(+it.z + +it.h)}" width="${x1 - x0}" height="${+it.h}" fill="#efebe3" stroke="#8d877b" stroke-width="${k}" stroke-dasharray="${3 * k} ${2 * k}" data-pi="${it.id}"/>`;
    h += plText((x0 + x1) / 2, Y(+it.z + +it.h / 2), pt("k_" + it.k), 7.5 * k, { fill: "#8d877b", fw: 600, bg: "#efebe3" });
    xs.push(x0, x1);
    zs.push(+it.z + +it.h);
  });
  own.forEach((it) => {
    const K = PL_KINDS[it.k],
      sel = it.id === V.sel,
      stc = sel ? PLC.sel : PLC.item,
      sw = (sel ? 2 : 1.1) * k,
      xc = W.ex(+it.c),
      w = +it.w,
      x0 = xc - w / 2,
      z0 = +it.z || 0,
      hh = +it.h || 0;
    let g = "";
    const R = (x, z, ww, hhh, extra) => `<rect x="${x.toFixed(2)}" y="${Y(z + hhh).toFixed(2)}" width="${ww.toFixed(2)}" height="${hhh.toFixed(2)}" ${extra}/>`;
    switch (it.k) {
      case "door": {
        g += R(x0, 0, w, hh, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        g += R(x0 + 1.5, 0, w - 3, hh - 1.5, `fill="none" stroke="${stc}" stroke-width="${0.7 * k}"`);
        if (it.dtype === "swing") {
          // hinge side: dashed triangle pointing to the hinges
          const hingeLeft = W.flip ? it.hinge === "b" : it.hinge !== "b";
          const hx = hingeLeft ? x0 + 1.5 : x0 + w - 1.5,
            fx = hingeLeft ? x0 + w - 1.5 : x0 + 1.5;
          g += `<path d="M${fx} ${Y(0)}L${hx} ${Y(hh / 2)}L${fx} ${Y(hh - 1.5)}" fill="none" stroke="${stc}" stroke-width="${0.7 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
        }
        break;
      }
      case "window":
        g += R(x0, z0, w, hh, `fill="#dfeaf3" stroke="${stc}" stroke-width="${sw}"`);
        g += R(x0 + 1.5, z0 + 1.5, w - 3, hh - 3, `fill="none" stroke="${stc}" stroke-width="${0.7 * k}"`);
        g += `<path d="M${xc} ${Y(z0 + 1.5)}V${Y(z0 + hh - 1.5)}" stroke="${stc}" stroke-width="${0.7 * k}"/>`;
        break;
      case "toilet":
        g += R(xc - 9.5, 15, 19, Math.max(1, hh - 15), `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        g += `<path d="M${xc - 8} ${Y(15)}Q${xc - 9} ${Y(6)} ${xc - 5} ${Y(0)}H${xc + 5}Q${xc + 9} ${Y(6)} ${xc + 8} ${Y(15)}Z" fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
        break;
      case "vanity":
      case "cab":
        g += R(x0, z0, w, hh, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        g += R(x0 - 0.5, z0 + hh - 1.5, w + 1, 1.5, `fill="#d6d0c4" stroke="${stc}" stroke-width="${0.6 * k}"`);
        g += R(x0 + 1, z0 + 4, w - 2, hh - 6.5, `fill="none" stroke="${stc}" stroke-width="${0.6 * k}"`);
        if (w > 20) g += `<path d="M${xc} ${Y(z0 + 4)}V${Y(z0 + hh - 2.5)}" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
        if (it.k === "vanity") g += `<path d="M${xc} ${Y(z0 + hh)}v${-6}h3" fill="none" stroke="${stc}" stroke-width="${1.2 * k}"/>`;
        break;
      case "ucab":
        g += R(x0, z0, w, hh, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        if (w > 20) g += `<path d="M${xc} ${Y(z0 + 1)}V${Y(z0 + hh - 1)}" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
        break;
      case "tub":
        g += R(x0, 0, w, hh, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        g += `<path d="M${x0} ${Y(hh - 2)}H${x0 + w}" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
        break;
      case "shower":
        g += R(x0, 0, w, 4, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        g += R(x0, 0, w, Math.min(H, 80), `fill="none" stroke="${stc}" stroke-width="${0.6 * k}" stroke-dasharray="${4 * k} ${3 * k}"`);
        break;
      case "fridge":
      case "range":
        g += R(x0, 0, w, hh, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        break;
      case "mirror":
        g += R(x0, z0, w, hh, `fill="#cfe3f2" stroke="${stc}" stroke-width="${sw}"`);
        break;
      case "niche":
        g += R(x0, z0, w, hh, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        g += R(x0 + 1.2, z0 + 1.2, w - 2.4, hh - 2.4, `fill="none" stroke="${stc}" stroke-width="${0.6 * k}" stroke-dasharray="${2 * k} ${1.5 * k}"`);
        break;
      case "shelf":
        g += R(x0, z0, w, Math.max(hh, 1), `fill="#d6d0c4" stroke="${stc}" stroke-width="${sw}"`);
        break;
      default: {
        const zc = z0;
        if (it.k === "outlet" || it.k === "switch") {
          g += R(xc - 1.4, zc - 2.25, 2.8, 4.5, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
          g += it.k === "outlet" ? `<path d="M${xc - 0.4} ${Y(zc + 1.2)}v0.9M${xc + 0.4} ${Y(zc + 1.2)}v0.9M${xc - 0.4} ${Y(zc - 1.2)}v0.9M${xc + 0.4} ${Y(zc - 1.2)}v0.9" stroke="${stc}" stroke-width="${0.6 * k}"/>` : "";
        } else if (it.k === "valve") {
          g += `<circle cx="${xc}" cy="${Y(zc)}" r="3.5" fill="#fff" stroke="${stc}" stroke-width="${sw}"/><path d="M${xc} ${Y(zc)}l2.5 -2.5" stroke="${stc}" stroke-width="${1.2 * k}"/>`;
        } else {
          g += `<path d="M${xc} ${Y(zc + 3)}v-3M${xc - 3} ${Y(zc)}h6l-1.5 2.5h-3z" fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
        }
      }
    }
    if (!K.pt && hh > 6 && w > 10 && it.k !== "door")
      g += plText(xc, Y(z0 + (it.k === "shower" ? 10 : hh / 2)), `${pt("k_" + it.k)}`, Math.min(8 * k, w / 7), { fill: "#6b665c", fw: 600 });
    h += `<g data-pi="${it.id}" style="cursor:move">${g}</g>`;
    if (K.pt) xs.push(xc);
    else xs.push(x0, x0 + w);
    if (it.k !== "shower") {
      if (z0 > 0) zs.push(z0);
      if (!K.pt) zs.push(z0 + hh);
    }
  });
  // horizontal chain under the floor, overall below it
  const X = [...new Set(xs.map((v) => Math.round(Math.max(0, Math.min(L, v)) * 16) / 16))].sort((a, b) => a - b);
  if (X.length > 2) for (let j = 0; j < X.length - 1; j++) if (X[j + 1] - X[j] > 0.05) h += plDim([X[j], 0], [X[j + 1], 0], fmt(X[j + 1] - X[j]), k, 12 * k);
  h += plDim([0, 0], [L, 0], fmt(L), k, (X.length > 2 ? 26 : 12) * k);
  // vertical chain of heights at the right
  const Z = [...new Set(zs.map((v) => Math.round(Math.max(0, Math.min(H, v)) * 16) / 16))].sort((a, b) => a - b),
    xr = L + thR;
  for (let j = 0; j < Z.length - 1; j++) if (Z[j + 1] - Z[j] > 0.05) h += plDim([xr, Y(Z[j])], [xr, Y(Z[j + 1])], fmt(Z[j + 1] - Z[j]), k, 12 * k);
  if (Z.length > 2) h += plDim([xr, Y(0)], [xr, Y(H)], fmt(H), k, 28 * k);
  // which corner is which
  const lc = W.flip ? (i + 1) % n : i,
    rc = W.flip ? i : (i + 1) % n;
  h += plText(-thL / 2, Y(H) - 6 * k, `∟${lc + 1}`, 7 * k, { fill: "#8d877b", fw: 600 }) + plText(L + thR / 2, Y(H) - 6 * k, `∟${rc + 1}`, 7 * k, { fill: "#8d877b", fw: 600 });
  return h + `</svg>`;
}

/* ---------- pointer: select, drag items along walls, drag corners ---------- */
let plDrag = null;
function plPoint(svg, e) {
  const m = svg.getScreenCTM();
  if (!m) return [0, 0];
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}
function planDown(e) {
  const svg = e.target.closest && e.target.closest("#plsvg svg");
  if (!svg) return;
  const V = S.plan,
    pl = P.plan,
    pi = e.target.closest("[data-pi]"),
    pc = e.target.closest("[data-pc]"),
    pw = e.target.closest("[data-pw]");
  const p0 = plPoint(svg, e);
  if (pc && V.v === "top") {
    plDrag = { kind: "corner", i: +pc.dataset.pc, p0, pts: planPts().map((q) => q.slice()), svg, vb: svg.getAttribute("viewBox"), moved: false };
  } else if (pi) {
    const it = pl.items.find((x) => x.id === pi.dataset.pi);
    if (!it) return;
    V.sel = it.id;
    V.wsel = null;
    plDrag = { kind: "item", it, p0, c0: +it.c, z0: +it.z, x0: +it.x, y0: +it.y, svg, vb: svg.getAttribute("viewBox"), moved: false };
  } else if (pw && V.v === "top") {
    V.sel = null;
    V.wsel = +pw.dataset.pw;
    $("#plsheet").innerHTML = planSheet();
    planDraw();
    return;
  } else {
    if (V.sel || V.wsel != null) {
      V.sel = null;
      V.wsel = null;
      $("#plsheet").innerHTML = planSheet();
      planDraw();
    }
    return;
  }
  e.preventDefault();
  const mv = (ev) => {
      ev.preventDefault();
      planMove(ev);
    },
    up = () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const d = plDrag;
      plDrag = null;
      if (d && d.moved) saveSoon();
      renderPlan();
    };
  window.addEventListener("pointermove", mv, { passive: false });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  planDraw();
  const s2 = $("#plsvg svg");
  if (s2) s2.setAttribute("viewBox", plDrag.vb);
}
/* inputs on the plan page: keep numbers numeric, keep items inside their wall */
function planInp(k) {
  const pl = P.plan,
    m = k.match(/^plan\.items\.(\d+)\.(\w+)$/),
    mw = k.match(/^plan\.walls\.(\d+)\.tile$/);
  if (mw && pl.walls[+mw[1]].tile && !(+pl.walls[+mw[1]].tileH > 0)) pl.walls[+mw[1]].tileH = +pl.H || 96;
  if (m) {
    const it = pl.items[+m[1]];
    if (it && m[2] === "wall") {
      it.wall = +it.wall;
      const W = planWall(it.wall),
        half = PL_KINDS[it.k].pt ? 0 : +it.w / 2;
      it.c = Math.max(half, Math.min(W.L - half, +it.c));
    }
  }
}
function planMove(e) {
  const d = plDrag;
  if (!d) return;
  const svg = $("#plsvg svg");
  if (!svg) return;
  svg.setAttribute("viewBox", d.vb); // keep the view still while dragging
  const p = plPoint(svg, e),
    dx = p[0] - d.p0[0],
    dy = p[1] - d.p0[1];
  if (!d.moved && Math.hypot(dx, dy) < 1.5) return;
  d.moved = true;
  const r2 = (v) => Math.round(v * 2) / 2;
  const pl = P.plan,
    V = S.plan;
  if (d.kind === "corner") {
    const pts = d.pts.map((q) => q.slice()),
      n = pts.length,
      i = d.i,
      tol = 4 * (+svg.dataset.k || 1);
    let x = Math.round((d.pts[i][0] + dx) * 8) / 8,
      y = Math.round((d.pts[i][1] - dy) * 8) / 8;
    [pts[(i - 1 + n) % n], pts[(i + 1) % n]].forEach((q) => {
      if (Math.abs(q[0] - x) < tol) x = q[0];
      if (Math.abs(q[1] - y) < tol) y = q[1];
    });
    pts[i] = [x, y];
    if (polyArea(pts) < 10) return;
    // shift floor items so they stay put when the outline re-bases at its min corner
    const m0 = [Math.min(...d.pts.map((q) => q[0])), Math.min(...d.pts.map((q) => q[1]))],
      m1 = [Math.min(...pts.map((q) => q[0])), Math.min(...pts.map((q) => q[1]))];
    if (!d.fl) d.fl = pl.items.filter((it) => PL_KINDS[it.k].floor).map((it) => [it, +it.x, +it.y]);
    d.fl.forEach(([it, x0, y0]) => {
      it.x = x0 - (m1[0] - m0[0]);
      it.y = y0 - (m1[1] - m0[1]);
    });
    ptsToWalk(pl.room, pts);
    const box = $("#plsvg"),
      W0 = box.clientWidth,
      H0 = box.clientHeight;
    box.innerHTML = planTopSVG(W0, H0);
    const s2 = $("#plsvg svg");
    // keep the original framing so the finger stays on the corner
    const sh = m1[0] - m0[0],
      shy = m1[1] - m0[1];
    const vb = d.vb.split(" ").map(Number);
    s2.setAttribute("viewBox", `${vb[0] - sh} ${vb[1] + shy} ${vb[2]} ${vb[3]}`);
    s2.setAttribute("data-k", svg.dataset.k);
    return;
  }
  const it = d.it,
    K = PL_KINDS[it.k];
  if (V.v === "top") {
    if (K.floor) {
      it.x = r2(d.x0 + dx);
      it.y = r2(d.y0 - dy);
    } else {
      const pts = planPts(),
        q = [p[0], -p[1]],
        nw = planNearWall(pts, q);
      if (nw && nw.i !== it.wall && Math.abs(nw.d) < 30) {
        it.wall = nw.i;
        d.c0 = nw.s;
        d.p0 = p;
      }
      const W = planWall(it.wall, pts),
        ds = (p[0] - d.p0[0]) * W.u[0] + (-p[1] + d.p0[1]) * W.u[1],
        half = K.pt ? 0 : +it.w / 2;
      it.c = Math.max(half, Math.min(W.L - half, r2(d.c0 + ds)));
    }
  } else {
    const W = planWall(it.wall),
      half = K.pt ? 0 : +it.w / 2;
    if (it.wall === +V.v) {
      it.c = Math.max(half, Math.min(W.L - half, r2(d.c0 + (W.flip ? -dx : dx))));
      if (!["door", "toilet", "vanity", "tub", "shower", "cab", "fridge", "range"].includes(it.k)) it.z = Math.max(0, r2(d.z0 - dy));
    }
  }
  const box = $("#plsvg");
  box.innerHTML = V.v === "top" ? planTopSVG(box.clientWidth, box.clientHeight) : planElevSVG(+V.v, box.clientWidth, box.clientHeight);
  $("#plsvg svg").setAttribute("viewBox", d.vb);
}

/* ---------- actions ---------- */
function planAct(a, arg) {
  const pl = P.plan,
    V = S.plan;
  const sel = () => pl.items.find((x) => x.id === V.sel);
  switch (a) {
    case "plan":
      return planOpen();
    case "plClose":
      return planClose();
    case "plUndo":
      doUndo();
      if (S.plan) renderPlan();
      return;
    case "plView":
      V.v = arg === "top" ? "top" : +arg;
      if (V.v !== "top") V.wsel = V.v;
      break;
    case "plWsel":
      V.wsel = +arg;
      V.sel = null;
      break;
    case "plLib":
      return modal(
        `<h3>${pt("plLib")}</h3><div class="pllib">${PL_ORDER.map((k) => `<button data-act="plAdd:${k}"><span>${PL_KINDS[k].ic}</span>${pt("k_" + k)}</button>`).join("")}</div><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
      );
    case "plAdd": {
      closeModal();
      const [k, wi] = arg.split(":"),
        K = PL_KINDS[k],
        pts = planPts();
      let it;
      if (K.floor) {
        const bb = bboxOf(pts);
        it = planNew(k, null, 0, { x: Math.round((bb.x0 + bb.x1) / 2), y: Math.round((bb.y0 + bb.y1) / 2) });
      } else {
        const w = wi != null && wi !== "" ? +wi : V.wsel != null ? V.wsel : typeof V.v === "number" ? V.v : planLongest(pts),
          W = planWall(w, pts);
        it = planNew(k, w, W.L / 2);
        if (!K.pt) it.w = Math.min(+it.w, W.L);
        if (k === "tub" || k === "shower") it.w = Math.min(W.L, k === "tub" ? 60 : it.w);
        if (k === "tub" && W.L < 66) {
          it.w = W.L;
        }
      }
      pl.items.push(it);
      V.sel = it.id;
      V.wsel = null;
      saveSoon();
      break;
    }
    case "plDup": {
      const it = sel();
      if (!it) break;
      const c = JSON.parse(JSON.stringify(it));
      c.id = uid();
      if (PL_KINDS[it.k].floor) c.x = +c.x + 6;
      else c.c = Math.min(planWall(c.wall).L - (PL_KINDS[c.k].pt ? 0 : c.w / 2), +c.c + (PL_KINDS[c.k].pt ? 6 : +c.w));
      pl.items.push(c);
      V.sel = c.id;
      saveSoon();
      break;
    }
    case "plDel":
      pl.items = pl.items.filter((x) => x.id !== V.sel);
      V.sel = null;
      saveSoon();
      break;
    case "plNudge": {
      const it = sel();
      if (!it) break;
      const [ax, ay] = arg.split(":").map(Number),
        K = PL_KINDS[it.k];
      if (K.floor) {
        it.x = +it.x + ax * 0.5;
        it.y = +it.y + ay * 0.5;
      } else {
        const W = planWall(it.wall),
          half = K.pt ? 0 : +it.w / 2,
          dir = V.v === "top" ? 1 : W.flip ? -1 : 1;
        it.c = Math.max(half, Math.min(W.L - half, +it.c + ax * 0.5 * dir));
        if (ay) it.z = Math.max(0, (+it.z || 0) + ay * 0.5);
      }
      saveSoon();
      break;
    }
    case "plWadd": {
      const g = pl.room.segs,
        last = g[g.length - 1];
      g.push({ l: Math.max(12, Math.round((+last.l || 24) / 2)), a: 90 });
      pl.walls.push({ th: 4.5, tile: false, tileH: null });
      saveSoon();
      break;
    }
    case "plWdel": {
      const i = +arg;
      if (pl.room.segs.length <= 3) break;
      pl.room.segs.splice(i, 1);
      pl.walls.splice(i, 1);
      pl.items = pl.items.filter((x) => x.wall !== i).map((x) => (x.wall != null && x.wall > i ? Object.assign(x, { wall: x.wall - 1 }) : x));
      saveSoon();
      break;
    }
    case "plFit":
      if (closeWalk(pl.room)) saveSoon();
      break;
    case "plFromFloor": {
      const f = P.surfaces.find((s) => s.type === "floor" && !isShaped(s));
      if (f) {
        planFromFloor(f);
        planEnsure();
        saveSoon();
      }
      break;
    }
    case "plGo":
      S.tab = +arg;
      return planClose();
    case "plBuild": {
      const r = planBuild();
      saveSoon();
      toast("✓ " + pt("plBuilt").replace("{a}", r.a).replace("{b}", r.b), false);
      break;
    }
  }
  renderPlan();
}
function planLongest(pts) {
  let b = 0,
    bl = 0;
  for (let i = 0; i < pts.length; i++) {
    const L = planWall(i, pts).L;
    if (L > bl) {
      bl = L;
      b = i;
    }
  }
  return b;
}

/* ---------- plan -> surfaces ---------- */
function planBuild() {
  const pl = planEnsure(),
    pts = planPts(),
    n = pts.length;
  let a = 0,
    b = 0;
  const get = (key, mk) => {
    let s = P.surfaces.find((x) => x.fromPlan === key);
    if (!s && key === "floor" && pl.src) s = P.surfaces.find((x) => x.id === pl.src && x.type === "floor");
    if (s) {
      b++;
      s.fromPlan = key;
      return [s, false];
    }
    s = mk();
    s.fromPlan = key;
    P.surfaces.push(s);
    a++;
    return [s, true];
  };
  const axis = (W) => Math.abs(W.u[0]) > 0.999 || Math.abs(W.u[1]) > 0.999;
  const bbo = (A) => {
    const q = bboxOf(A);
    return { x: q.x0, y: q.y0, w: q.x1 - q.x0, h: q.y1 - q.y0 };
  };
  const fresh = [];
  // floor
  {
    const [f, isNew] = get("floor", () => {
      const s = newSurface("floor");
      s.name = pt("plFloorName");
      s.nk = null;
      s.tile = stdTile("floor");
      return s;
    });
    if (isNew) fresh.push(f);
    f.shape = "walk";
    f.segs = JSON.parse(JSON.stringify(pl.room.segs));
    f.a0 = pl.room.a0;
    f.openings = f.openings.filter((o) => !o.pl);
    f.trans = (f.trans || []).filter((tr) => !tr.pl);
    pl.items.forEach((it) => {
      const K = PL_KINDS[it.k];
      if (K.floor) {
        if (it.k === "drain") f.openings.push({ id: uid(), pl: 1, type: "round", shape: "circle", x: +it.x, y: +it.y, dia: +it.w || 4 });
        else f.openings.push({ id: uid(), pl: 1, type: "duct", shape: "rect", x: +it.x - it.w / 2, y: +it.y - (it.dp || 4) / 2, w: +it.w, h: +it.dp || 4 });
        return;
      }
      const W = planWall(it.wall, pts);
      if (it.k === "door") {
        f.trans.push({
          id: uid(),
          pl: 1,
          edge: it.wall,
          from: Math.max(0, +it.c - it.w / 2),
          len: +it.w,
          adj: "hardwood",
          at: ADJ.hardwood,
          sub: 0,
          prof: "auto",
          stop: it.dtype === "pocket" || it.dtype === "opening" ? "pocket" : it.dtype === "slide" ? "in" : it.swing === "out" ? "out" : "in",
          wt: W.th,
          dt: +it.dt || 1.375,
          ext: 0,
        });
      } else if (it.k === "toilet") {
        const q = plAt(W, +it.c, +it.ri || 12);
        f.openings.push({ id: uid(), pl: 1, type: "toilet", shape: "circle", x: q[0], y: q[1], dia: 5, face: "auto" });
      } else if ((it.k === "tub" || it.k === "shower") && axis(W)) {
        f.openings.push(Object.assign({ id: uid(), pl: 1, type: "cutout", shape: "rect", trim: false }, bbo(planFoot(it, pts))));
      } else if (["vanity", "cab", "fridge", "range"].includes(it.k) && axis(W)) {
        f.openings.push(Object.assign({ id: uid(), pl: 1, type: "noheat", shape: "rect", nohole: true }, bbo(planFoot(it, pts))));
      }
    });
  }
  // walls with tile
  for (let i = 0; i < n; i++) {
    const ws = pl.walls[i];
    if (!ws || !ws.tile) continue;
    const W = planWall(i, pts),
      H = Math.min(+pl.H || 96, +ws.tileH || +pl.H || 96);
    const [s, isNew] = get("w" + i, () => {
      const s2 = newSurface("wall");
      s2.name = `${pt("plWall")} ${i + 1}`;
      s2.nk = null;
      return s2;
    });
    if (isNew) fresh.push(s);
    s.shape = "rect";
    s.w = Math.round(W.L * 16) / 16;
    s.h = H;
    s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
    s.openings = s.openings.filter((o) => !o.pl);
    planWallOps(i, pts, 0, 0, s);
  }
  // tile zones over tubs, shower pans, cabinet runs
  {
    const zones = planZones(pts),
      used = new Set(),
      old = P.surfaces.filter((x) => /^z\d+:/.test(x.fromPlan || ""));
    zones.forEach((z) => {
      const key = `z${z.wall}:${z.ids.slice().sort().join("+")}`;
      let s = P.surfaces.find((x) => x.fromPlan === key);
      // a zone that merged/split keeps the surface (and its tile settings) of an old zone on that wall
      if (!s) s = old.find((x) => !used.has(x) && x.fromPlan.startsWith(`z${z.wall}:`));
      let isNew = false;
      if (s) b++;
      else {
        s = newSurface("wall");
        s.nk = null;
        P.surfaces.push(s);
        fresh.push(s);
        isNew = true;
        a++;
      }
      used.add(s);
      s.fromPlan = key;
      if (isNew || s.name === s.plName) s.name = s.plName = `${pt("k_" + z.k)} · ${pt("plWall")} ${z.wall + 1}`;
      s.shape = "rect";
      s.w = Math.round((z.x1 - z.x0) * 16) / 16;
      s.h = Math.round((z.z1 - z.z0) * 16) / 16;
      s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
      s.openings = s.openings.filter((o) => !o.pl);
      planWallOps(z.wall, pts, z.x0, z.z0, s);
    });
    const gone = old.filter((x) => !used.has(x));
    if (gone.length) P.surfaces = P.surfaces.filter((x) => !gone.includes(x));
  }
  // shower pans
  pl.items
    .filter((it) => it.k === "shower")
    .forEach((it) => {
      const [s, isNew] = get("it" + it.id, () => {
        const s2 = newSurface("pan");
        s2.name = pt("plPanName");
        s2.nk = null;
        s2.tile = stdTile("pan");
        return s2;
      });
      s.shape = "rect";
      s.w = +it.w;
      s.h = +it.dp;
      s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
      if (isNew) {
        s.curb.on = true;
        s.curb.len = s.w;
        s.drain = Object.assign(s.drain || {}, { type: "center", x: s.w / 2, y: s.h / 2 });
        fresh.push(s);
      }
    });
  // drop surfaces whose plan wall lost its tile
  P.surfaces = P.surfaces.filter((s) => {
    const m = /^w(\d+)$/.exec(s.fromPlan || "");
    if (m && !(pl.walls[+m[1]] && pl.walls[+m[1]].tile)) {
      delete s.fromPlan; // keep the surface, just unlink it
    }
    const mi = /^it(.+)$/.exec(s.fromPlan || "");
    if (mi && !pl.items.find((x) => x.id === mi[1])) delete s.fromPlan;
    return true;
  });
  try {
    if (fresh.some((s) => s.type !== "wall")) arrangeFloors(P);
  } catch (e) {}
  P.surfaces.forEach((s) => {
    if (s.fromPlan && (fresh.includes(s) || true)) {
      try {
        if (fresh.includes(s)) autoLayout(s);
      } catch (e) {}
    }
  });
  return { a, b };
}

/* openings of plan wall i, in a surface whose origin sits at (ox, oy) of that wall's elevation */
function planWallOps(i, pts, ox, oy, s) {
  const pl = P.plan,
    W = planWall(i, pts);
    const clip = (o) => {
      if (o.shape === "circle") return o.x >= 0 && o.x <= s.w && o.y >= 0 && o.y <= s.h ? o : null;
      const x0 = Math.max(0, o.x),
        y0 = Math.max(0, o.y),
        x1 = Math.min(s.w, o.x + o.w),
        y1 = Math.min(s.h, o.y + o.h);
      if (x1 - x0 < 0.25 || y1 - y0 < 0.25) return null;
      return Object.assign(o, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    };
    const push = (o) => {
      const c = clip(Object.assign({ id: uid(), pl: 1 }, o, { x: o.x - ox, y: o.y - oy }));
      if (c) s.openings.push(c);
    };
    pl.items.forEach((it) => {
      const K = PL_KINDS[it.k];
      if (K.floor) return;
      if (it.wall === i) {
        const xc = W.ex(+it.c),
          x0 = xc - it.w / 2,
          z = +it.z || 0;
        switch (it.k) {
          case "door":
            push({ type: "cutout", shape: "rect", trim: false, x: x0, y: 0, w: +it.w, h: +it.h });
            break;
          case "window":
            push({ type: "window", shape: "rect", trim: true, x: x0, y: z, w: +it.w, h: +it.h });
            break;
          case "niche":
            push({ type: "niche", shape: "rect", trim: true, x: x0, y: z, w: +it.w, h: +it.h, d: +it.dp || 3.5 });
            break;
          case "outlet":
          case "switch":
            push({ type: "outlet", shape: "rect", x: xc - 1.125, y: z - 1.875, w: 2.25, h: 3.75 });
            break;
          case "valve":
            push({ type: "valve", shape: "circle", x: xc, y: z, dia: 3 });
            break;
          case "head":
            push({ type: "pipe", shape: "circle", x: xc, y: z, dia: 1.125 });
            break;
          case "shelf":
            push({ type: "shelf", shape: "rect", nohole: true, x: x0, y: z, w: +it.w, h: 2 });
            break;
          case "vanity":
          case "cab":
          case "tub":
          case "fridge":
          case "range":
          case "ucab":
            push({ type: "cutout", shape: "rect", trim: false, x: x0, y: z, w: +it.w, h: +it.h });
            break;
        }
        return;
      }
      // items from other walls standing against this one (tub end, vanity side)
      if (K.inwall || K.pt || !(+it.h > 0) || it.k === "toilet" || it.k === "shower" || it.k === "mirror") return;
      const Fp = planFoot(it, pts),
        ss = Fp.map((q) => (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1]),
        dd = Fp.map((q) => (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1]);
      if (Math.min(...dd) > 1) return;
      const x0 = W.cx(Math.max(0, Math.min(...ss))),
        x1 = W.cx(Math.min(W.L, Math.max(...ss)));
      push({ type: "cutout", shape: "rect", trim: false, x: Math.min(x0, x1), y: +it.z || 0, w: Math.abs(x1 - x0), h: +it.h });
    });
}

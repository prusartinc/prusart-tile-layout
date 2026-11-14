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
    plWalls:
      "Стены (обход: от левого нижнего угла вправо, против часовой = поворот влево)",
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
    plTzo: "Запас на торцах",
    plTzs: "И на боковых стенах (торцы)",
    plTzf: "На всю эту стену",
    plTzl: "Растянуть влево на",
    plTzr: "Растянуть вправо на",
    plTzsf: "Боковые стены — целиком",
    plCt: "Столешница",
    plCtt: "Толщина",
    plCtf: "Свес спереди",
    plCtl: "Свес слева",
    plCtr: "Свес справа",
    plDrain: "Трап",
    drn_center: "по центру",
    drn_point: "смещён (от стен)",
    drn_linear: "линейный вдоль стены",
    plDl: "Центр от левой стены",
    plDb: "Центр от задней стены",
    plDhint: "Как смотришь на заднюю стену. До правой: {r}, до бордюра: {f}",
    plLside: "Вдоль какой стороны",
    ls_back: "задняя стена",
    ls_left: "левая стена",
    ls_right: "правая стена",
    ls_front: "у бордюра / входа",
    plLoff: "Отступ от стены",
    plLlen: "Длина трапа",
    k_glass: "Стекло душа",
    plGl: "Длина стекла",
    plAng: "Угол°",
    plGz: "Низ (бордюр)",
    plGdoor: "Дверь",
    gd_none: "без двери (панель)",
    gd_a: "дверь у начала",
    gd_b: "дверь у конца",
    plDw: "Ширина двери",
    plGpan: "По фронту поддона",
    plGflip: "Сторона открывания",
    plNoPan: "Сначала поставь поддон душа",
    plChk: "Проверка зазоров (IRC/NEC, основное):",
    plChkOk: "Зазоры в норме",
    ckToiletSide:
      "Унитаз: от центра до стены/предмета {d} — нужно не меньше 15″",
    ckToiletFront: "Унитаз: спереди нужно 21″ свободного места (по UPC 24″)",
    ckVanityFront: "Vanity: спереди нужно 21″ свободного места",
    ckOutlet: "Нет розетки в пределах 36″ от vanity (NEC — нужна, GFCI)",
    ckShower: "Душ меньше минимума: 30″ по каждой стороне и 900 кв. дюймов",
    ckDoor: "Дверь при открывании задевает предмет",
    plTpl: "Шаблон комнаты",
    plTplQ:
      "Заменить план шаблоном? Текущие элементы удалятся (можно отменить ↶).",
    tpl_bath58: "Ванная 5×8 (ванна)",
    tpl_walkin: "5×8 walk-in душ",
    tpl_kitchen: "Кухня прямая",
    k_fan: "Вентилятор (потолок)",
    plCenterW: "По центру стены",
    plCopyTo: "Копия на стену",
    plMirror: "Отразить",
    k_light: "Светильник (потолок)",
    plElec: "Электрика",
    plTilesL: "Раскладка",
    ckFan: "Санузел без окна и вентилятора — по коду нужен вытяжной вентилятор",
    ckGfci: "Розетка в санузле должна быть GFCI",
    pdfPlan: "План комнаты",
    pdfElev: "Стена {n} — вид изнутри",
    pdfScale: "Масштаб",
    pdfMat: "Материалы",
    pdfSheet: "Лист",
    pdfNote: "Размеры в дюймах, от чистовых стен. Проверить на объекте.",
  },
  en: {
    plT: "Room plan",
    plTop: "Top",
    plWall: "Wall",
    plBack: "Project",
    plRoom: "Room",
    plH: "Ceiling height",
    plWalls:
      "Walls (walk: from the bottom-left corner going right; counter-clockwise = left turn)",
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
    plTzo: "Extra on the ends",
    plTzs: "Also on the side walls (ends)",
    plTzf: "Across this whole wall",
    plTzl: "Stretch left by",
    plTzr: "Stretch right by",
    plTzsf: "Side walls — whole wall",
    plCt: "Countertop",
    plCtt: "Thickness",
    plCtf: "Front overhang",
    plCtl: "Left overhang",
    plCtr: "Right overhang",
    plDrain: "Drain",
    drn_center: "centered",
    drn_point: "off-center (from walls)",
    drn_linear: "linear along a wall",
    plDl: "Center from left wall",
    plDb: "Center from back wall",
    plDhint: "Facing the back wall. To the right: {r}, to the curb: {f}",
    plLside: "Along which side",
    ls_back: "back wall",
    ls_left: "left wall",
    ls_right: "right wall",
    ls_front: "at the curb / entry",
    plLoff: "Gap from wall",
    plLlen: "Drain length",
    k_glass: "Shower glass",
    plGl: "Glass length",
    plAng: "Angle°",
    plGz: "Bottom (curb)",
    plGdoor: "Door",
    gd_none: "no door (panel)",
    gd_a: "door at the start",
    gd_b: "door at the end",
    plDw: "Door width",
    plGpan: "Along the pan front",
    plGflip: "Swing side",
    plNoPan: "Place a shower pan first",
    plChk: "Clearance check (IRC/NEC basics):",
    plChkOk: "Clearances OK",
    ckToiletSide: "Toilet: center to wall/item {d} — needs at least 15″",
    ckToiletFront: "Toilet: needs 21″ clear in front (UPC 24″)",
    ckVanityFront: "Vanity: needs 21″ clear in front",
    ckOutlet: "No outlet within 36″ of the vanity (NEC requires one, GFCI)",
    ckShower: "Shower below minimum: 30″ each way and 900 sq in",
    ckDoor: "Door swing hits an item",
    plTpl: "Room template",
    plTplQ:
      "Replace the plan with a template? Current items will be removed (undo ↶ works).",
    tpl_bath58: "5×8 bath (tub)",
    tpl_walkin: "5×8 walk-in shower",
    tpl_kitchen: "Straight kitchen",
    k_fan: "Exhaust fan (ceiling)",
    plCenterW: "Center on wall",
    plCopyTo: "Copy to wall",
    plMirror: "Mirror",
    k_light: "Light (ceiling)",
    plElec: "Electrical",
    plTilesL: "Layout",
    ckFan: "Bathroom with no window or fan — code requires an exhaust fan",
    ckGfci: "Bathroom outlet must be GFCI",
    pdfPlan: "Room plan",
    pdfElev: "Wall {n} — inside view",
    pdfScale: "Scale",
    pdfMat: "Materials",
    pdfSheet: "Sheet",
    pdfNote: "Dimensions in inches, to finished walls. Verify on site.",
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
  outlet: { ic: "⏚", w: 2.25, dp: 1, h: 3.75, z: 44, pt: 1, el: 1 },
  switch: { ic: "⏻", w: 2.25, dp: 1, h: 3.75, z: 48, pt: 1, el: 1 },
  fan: { ic: "🌀", w: 10, dp: 10, h: 0, z: 0, floor: 1, el: 1, ceil: 1 },
  light: { ic: "💡", w: 6, dp: 6, h: 0, z: 0, floor: 1, el: 1, ceil: 1 },
  drain: { ic: "⊕", w: 4, dp: 4, h: 0, z: 0, floor: 1 },
  glass: { ic: "🔲", w: 60, dp: 0.375, h: 76, z: 4.5, floor: 1, glass: 1 },
  register: { ic: "▤", w: 10, dp: 4, h: 0, z: 0, floor: 1 },
};
const PL_ORDER = Object.keys(PL_KINDS);

/* ---------- data ---------- */
function planEnsure() {
  if (!P.plan) {
    P.plan = {
      room: { shape: "walk", segs: [], a0: 0 },
      walls: [],
      H: 96,
      items: [],
    };
    const f = P.surfaces.find((s) => s.type === "floor" && !isShaped(s));
    if (f) planFromFloor(f);
    else ptsToWalk(P.plan.room, rectPoly(0, 0, 96, 60));
  }
  const pl = P.plan;
  pl.room.shape = "walk";
  pl.items = pl.items || [];
  pl.H = +pl.H || 96;
  pl.walls = pl.walls || [];
  while (pl.walls.length < pl.room.segs.length)
    pl.walls.push({ th: 4.5, tile: false, tileH: null });
  pl.walls.length = pl.room.segs.length;
  pl.items = pl.items.filter(
    (it) =>
      PL_KINDS[it.k] && (PL_KINDS[it.k].floor || it.wall < pl.room.segs.length),
  );
  const pts0 = walkPoly(pl.room).pts;
  pl.items.forEach((it) => {
    const K = PL_KINDS[it.k];
    if (!K.floor && it.wall != null && pts0.length > 2) {
      it.wall = +it.wall;
      const W = planWall(it.wall, pts0),
        half = K.pt ? 0 : Math.min(+it.w || 0, W.L) / 2;
      if (!(+it.c >= half && +it.c <= W.L - half))
        it.c = Math.max(half, Math.min(W.L - half, +it.c || 0));
    }
  });
  pl.items.forEach((it) => {
    const K = PL_KINDS[it.k];
    if (K.tzh != null && it.tz == null)
      Object.assign(it, { tz: !!K.tz, tzh: K.tzh, tzo: 0, tzs: !!K.side });
    if (K.tzh != null && it.tzl == null)
      Object.assign(it, {
        tzl: +it.tzo || 0,
        tzr: +it.tzo || 0,
        tzf: false,
        tzsf: false,
      });
    if (it.k === "cab" && it.ctt == null)
      Object.assign(it, { ctt: 1.5, ctf: 1, ctl: 0, ctr: 0 });
    if (it.k === "shower" && !it.drn)
      Object.assign(it, {
        drn: "center",
        dl: +it.w / 2,
        db: +it.dp / 2,
        lside: "back",
        loff: 1,
        llen: Math.max(12, +it.w - 6),
      });
  });
  return pl;
}
function planFromFloor(f) {
  const pl = P.plan,
    O = outerPoly(f);
  ptsToWalk(
    pl.room,
    O.map((q) => q.slice()),
  );
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
      if (w)
        pl.items.push(
          planNew("toilet", w.i, w.s, { ri: Math.round(w.d * 8) / 8 }),
        );
    });
}
function planNew(k, wall, c, extra) {
  const K = PL_KINDS[k];
  const it = {
    id: uid(),
    k,
    wall: K.floor ? null : wall,
    c,
    w: K.w,
    dp: K.dp,
    h: K.h,
    z: K.z,
  };
  if (k === "toilet") it.ri = K.ri;
  if (K.tzh != null)
    Object.assign(it, {
      tz: !!K.tz,
      tzh: K.tzh,
      tzo: 0,
      tzs: !!K.side,
      tzl: 0,
      tzr: 0,
      tzf: false,
      tzsf: false,
    });
  if (k === "cab") Object.assign(it, { ctt: 1.5, ctf: 1, ctl: 0, ctr: 0 });
  if (k === "glass") Object.assign(it, { ang: 0, door: "a", dw: 24, dsn: 1 });
  if (k === "outlet") it.gfci = true;
  if (k === "shower")
    Object.assign(it, {
      drn: "center",
      dl: K.w / 2,
      db: K.dp / 2,
      lside: "back",
      loff: 1,
      llen: K.w - 6,
    });
  if (k === "door")
    Object.assign(it, { dtype: "swing", swing: "in", hinge: "a", dt: 1.375 });
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
  return {
    i,
    a,
    b,
    L,
    u,
    nout,
    nin,
    th,
    flip,
    ex: (c) => (flip ? L - c : c),
    cx: (x) => (flip ? L - x : x),
  };
}
const plAt = (W, s, d) => [
  W.a[0] + W.u[0] * s + W.nin[0] * d,
  W.a[1] + W.u[1] * s + W.nin[1] * d,
];
function planNearWall(pts, p) {
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    const W = planWall(i, pts),
      s = (p[0] - W.a[0]) * W.u[0] + (p[1] - W.a[1]) * W.u[1],
      d = (p[0] - W.a[0]) * W.nin[0] + (p[1] - W.a[1]) * W.nin[1];
    if (s < -1 || s > W.L + 1) continue;
    const ad = Math.abs(d);
    if (!best || ad < best.ad)
      best = { i, s: Math.max(0, Math.min(W.L, s)), d, ad };
  }
  return best;
}
/* footprint of an item on the floor (polygon in floor coordinates) */
function planGlassEnds(it) {
  const a = ((+it.ang || 0) * Math.PI) / 180,
    u = [Math.cos(a), Math.sin(a)],
    h = +it.w / 2;
  return {
    A: [+it.x - u[0] * h, +it.y - u[1] * h],
    B: [+it.x + u[0] * h, +it.y + u[1] * h],
    u,
    n: [-u[1], u[0]],
  };
}
function planFoot(it, pts) {
  const K = PL_KINDS[it.k];
  if (K.glass) {
    const g = planGlassEnds(it),
      t = 0.25;
    return [
      [g.A[0] + g.n[0] * t, g.A[1] + g.n[1] * t],
      [g.B[0] + g.n[0] * t, g.B[1] + g.n[1] * t],
      [g.B[0] - g.n[0] * t, g.B[1] - g.n[1] * t],
      [g.A[0] - g.n[0] * t, g.A[1] - g.n[1] * t],
    ];
  }
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
  if (it.k === "niche")
    return [
      plAt(W, c - w, 0),
      plAt(W, c + w, 0),
      plAt(W, c + w, d1),
      plAt(W, c - w, d1),
    ];
  return [
    plAt(W, c - w, d0),
    plAt(W, c + w, d0),
    plAt(W, c + w, d1),
    plAt(W, c - w, d1),
  ];
}
/* the outer face of the walls: each wall line pushed out by its thickness, neighbours intersected */
function planOuter(pts) {
  const n = pts.length,
    L = pts.map((_, i) => {
      const W = planWall(i, pts);
      return {
        p: [W.a[0] + W.nout[0] * W.th, W.a[1] + W.nout[1] * W.th],
        u: W.u,
      };
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
  return it.k === "shower"
    ? 0
    : it.k === "cab"
      ? z + h + (it.ctt != null ? +it.ctt : 1.5)
      : z + h;
}
/* item extent on its own wall in elevation x (incl. countertop overhang for cabinets) */
function planItemX(it, W) {
  const xc = W.ex(+it.c),
    w = PL_KINDS[it.k].pt ? 0 : +it.w;
  let x0 = xc - w / 2,
    x1 = xc + w / 2;
  if (it.k === "cab") {
    x0 -= Math.max(0, +it.ctl || 0);
    x1 += Math.max(0, +it.ctr || 0);
  }
  return [x0, x1];
}
/* shower pan drain in pan coordinates: x along the back wall as seen from the curb, y from the curb (back = dp) */
function planDrain(it) {
  const w = +it.w,
    d = +it.dp,
    wid = 2.75;
  if (it.drn === "linear") {
    const side = it.lside || "back",
      off = Math.max(0, +it.loff || 0),
      vert = side === "left" || side === "right",
      len = Math.max(6, Math.min(vert ? d : w, +it.llen || (vert ? d : w) - 6));
    if (side === "back")
      return {
        type: "linear",
        x: (w - len) / 2,
        y: d - off - wid,
        len,
        wid,
        vert: false,
      };
    if (side === "front")
      return {
        type: "linear",
        x: (w - len) / 2,
        y: off,
        len,
        wid,
        vert: false,
      };
    if (side === "left")
      return { type: "linear", x: off, y: (d - len) / 2, len, wid, vert: true };
    return {
      type: "linear",
      x: w - off - wid,
      y: (d - len) / 2,
      len,
      wid,
      vert: true,
    };
  }
  if (it.drn === "point")
    return {
      type: "center",
      x: Math.max(2, Math.min(w - 2, +it.dl)),
      y: Math.max(2, Math.min(d - 2, d - +it.db)),
    };
  return { type: "center", x: w / 2, y: d / 2 };
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
      raw.push({
        wall: j,
        s0,
        s1,
        x0: Math.min(xa, xb),
        x1: Math.max(xa, xb),
        z0: bot,
        z1: top,
        ids: [it.id],
        k: it.k,
      });
    };
    {
      const W = planWall(it.wall, pts),
        e = planItemX(it, W);
      if (it.tzf) add(it.wall, 0, W.L);
      else {
        const xl = e[0] - Math.max(0, +it.tzl || 0),
          xr = e[1] + Math.max(0, +it.tzr || 0),
          sa = W.cx(xl),
          sb = W.cx(xr);
        add(it.wall, Math.min(sa, sb), Math.max(sa, sb));
      }
    }
    if (it.tzs && K.side) {
      const Fp = planFoot(it, pts);
      for (let j = 0; j < n; j++) {
        if (j === it.wall) continue;
        const W = planWall(j, pts),
          ss = Fp.map(
            (q) => (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1],
          ),
          dd = Fp.map(
            (q) => (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1],
          );
        if (
          Math.min(...dd) > 1 ||
          Math.min(...dd) < -1 ||
          Math.max(...ss) < 0 ||
          Math.min(...ss) > W.L
        )
          continue;
        if (it.tzsf) add(j, 0, W.L);
        else add(j, Math.min(...ss) - over, Math.max(...ss) + over);
      }
    }
  });
  // merge touching zones on the same wall with about the same bottom (a cabinet run + range)
  const out = [];
  raw
    .sort((a, b) => a.wall - b.wall || a.x0 - b.x0)
    .forEach((z) => {
      const p = out[out.length - 1];
      if (
        p &&
        p.wall === z.wall &&
        z.x0 <= p.x1 + 0.5 &&
        Math.abs(z.z0 - p.z0) <= 2
      ) {
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

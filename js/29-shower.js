"use strict";
/* ================= shower pan =================
   - with a curb or curbless
   - curbless: layer by layer, how much the shower floor must be dropped so the pan meets the
     finished bathroom floor flush (floor and pan have their own tile and layers)
   - pan shape: rectangle or with a cut (angled) corner
   - drain pipe center measured from the walls around the pan (2 walls in a corner, 3 in an alcove),
     to the framing, to the prep (board) face or to the finished tile — the same reference is used
     in the room plan for the toilet, windows and everything measured from a wall.
   Coordinates inside the app are the prep face (the board): that is what the tile is laid on. */
const SHT = {
  ru: {
    shType: "Душ",
    panW: "Ширина",
    panD: "Глубина",
    sh_curb: "С бордюром (curb)",
    sh_curbless: "Без бордюра (curbless)",
    shShape: "Форма поддона",
    shp_rect: "Прямоугольный / квадратный",
    shp_cut: "Со срезанным углом",
    shCutAt: "Срезан угол",
    cc_fl: "передний левый",
    cc_fr: "передний правый",
    shCutA: "Срез по фронту",
    shCutB: "Срез по боку",
    shWalls: "Стены вокруг поддона",
    sw_b: "Задняя",
    sw_l: "Левая",
    sw_r: "Правая",
    sw_f: "Перед",
    dref: "Расстояния от стены считать до",
    dr_frame: "каркаса (стойки)",
    dr_prep: "основы (board / prep)",
    dr_finish: "готовой плитки",
    shWallLay: "Стена: основа (board)",
    shWallFin: "Стена: клей + плитка",
    shDrainFrom: "Центр трапа от стен",
    shDragHint:
      "Положение трапа: впиши расстояния ниже или тащи трап пальцем на чертеже (тап по трапу — сюда).",
    shFromW: "от стены",
    sideB: "от задней стены",
    sideL: "от левой стены",
    sideR: "от правой стены",
    sideF: "от передней стены",
    shToCurb: "до края у входа",
    shCalc: "Расчёт по слоям (curbless)",
    shMethod: "Основа уклона",
    m_tray: "Готовый поддон (foam tray)",
    m_mortar: "Раствор (mud bed)",
    shTrayH: "Толщина поддона по краю",
    shMinDrain: "Раствор у трапа (мин.)",
    shSlope: "Уклон на фут",
    shFloorFin: "Пол (готовый) над черновым",
    shPanEdge: "Поддон у края над черновым",
    shRun: "Длина уклона",
    shFall: "Перепад уклона",
    shRecess: "Опустить основание в душе на",
    shRaise: "Основание в душе поднять на",
    shFlush: "Пол и поддон сходятся в ноль — ничего опускать не нужно",
    shFloorSrc:
      "Слои пола берутся с поверхности «{n}»; слои поддона — с этого поддона (Основание (пирог)).",
    shNoFloor:
      "Нет поверхности пола — для пола взяты только клей и плитка 3/8″.",
    shFloorL: "Пол",
    shPanL: "Поддон у края",
    shBase: "Основа уклона",
    shRecessL: "Опускание",
    pSys: "Система поддона",
    ps_mudliner: "Раствор + liner 40 mil (pre-slope)",
    ps_mudkerdi: "Раствор + KERDI",
    ps_hbclassic: "HYDRO-BLOK Classic",
    ps_hblow: "HYDRO-BLOK Low-Profile",
    ps_hbss: "HYDRO-BLOK Single Slope + ebbe INNI",
    ps_hbssthin: "HYDRO-BLOK Thin Single Slope + INNI",
    ps_scht: "Schluter KERDI-SHOWER-T / TS",
    ps_schtt: "Schluter KERDI-SHOWER-TT (тонкий)",
    ps_schlt: "Schluter KERDI-SHOWER-LT",
    ps_schlts: "Schluter KERDI-SHOWER-LTS (KERDI-LINE)",
    ps_tray: "Другой готовый поддон",
    pModel: "Модель / размер",
    pPick: "Выбери модель — подставятся размер поддона и толщины.",
    pModelInfo: "По краю {g}″, у трапа {h}″ (над черновым).",
    pDrainEst: "У трапа — расчётно по уклону 1/4″ на фут.",
    pPan: "Поддон",
    pPre: "Pre-slope",
    pLiner: "Liner",
    pBed: "Раствор",
    pBedS: "Раствор с уклоном",
    pPreMin: "Pre-slope у трапа",
    pLinerT: "Liner (40 mil = 0.04)",
    pBedT: "Раствор над liner",
    pAtDrain: "у трапа (готово)",
    pCurbAbove: "Бордюр над готовым полом",
    offC: "смещённый трап",
    pMemNote_k: "Сверху KERDI — мембрана стоит в «Основании (пироге)» поддона.",
    pMemNote_l: "Гидроизоляция — liner внутри раствора, сверху мембраны нет.",
    pMemNote_p:
      "Готовый поддон уже водонепроницаем — отдельной мембраны в «пироге» нет.",
  },
  en: {
    shType: "Shower",
    panW: "Width",
    panD: "Depth",
    sh_curb: "With a curb",
    sh_curbless: "Curbless",
    shShape: "Pan shape",
    shp_rect: "Rectangle / square",
    shp_cut: "With a cut corner",
    shCutAt: "Cut corner",
    cc_fl: "front left",
    cc_fr: "front right",
    shCutA: "Cut along the front",
    shCutB: "Cut along the side",
    shWalls: "Walls around the pan",
    sw_b: "Back",
    sw_l: "Left",
    sw_r: "Right",
    sw_f: "Front",
    dref: "Measure from the wall to",
    dr_frame: "framing (studs)",
    dr_prep: "prep (board) face",
    dr_finish: "finished tile",
    shWallLay: "Wall: prep (board)",
    shWallFin: "Wall: thinset + tile",
    shDrainFrom: "Drain center from the walls",
    shDragHint:
      "Drain position: type the distances below or drag the drain on the drawing (tap it to jump here).",
    shFromW: "from the",
    sideB: "from the back wall",
    sideL: "from the left wall",
    sideR: "from the right wall",
    sideF: "from the front wall",
    shToCurb: "to the entry edge",
    shCalc: "Layers (curbless)",
    shMethod: "Slope base",
    m_tray: "Foam tray",
    m_mortar: "Mortar (mud bed)",
    shTrayH: "Tray thickness at the edge",
    shMinDrain: "Mortar at the drain (min)",
    shSlope: "Slope per foot",
    shFloorFin: "Finished floor above subfloor",
    shPanEdge: "Pan at the edge above subfloor",
    shRun: "Slope run",
    shFall: "Slope fall",
    shRecess: "Drop the shower subfloor by",
    shRaise: "Raise the shower subfloor by",
    shFlush: "Floor and pan meet flush — no drop needed",
    shFloorSrc:
      "Floor layers come from “{n}”; pan layers from this pan (Build-up).",
    shNoFloor: "No floor surface — the floor uses only thinset and 3/8″ tile.",
    shFloorL: "Floor",
    shPanL: "Pan at edge",
    shBase: "Slope base",
    shRecessL: "Drop",
    pSys: "Pan system",
    ps_mudliner: "Mud + 40 mil liner (pre-slope)",
    ps_mudkerdi: "Mud + KERDI",
    ps_hbclassic: "HYDRO-BLOK Classic",
    ps_hblow: "HYDRO-BLOK Low-Profile",
    ps_hbss: "HYDRO-BLOK Single Slope + ebbe INNI",
    ps_hbssthin: "HYDRO-BLOK Thin Single Slope + INNI",
    ps_scht: "Schluter KERDI-SHOWER-T / TS",
    ps_schtt: "Schluter KERDI-SHOWER-TT (thin)",
    ps_schlt: "Schluter KERDI-SHOWER-LT",
    ps_schlts: "Schluter KERDI-SHOWER-LTS (KERDI-LINE)",
    ps_tray: "Other prefab tray",
    pModel: "Model / size",
    pPick: "Pick a model — the pan size and thicknesses fill in.",
    pModelInfo: "{g}″ at the edge, {h}″ at the drain (above subfloor).",
    pDrainEst: "At the drain — estimated from a 1/4″ per foot slope.",
    pPan: "Pan",
    pPre: "Pre-slope",
    pLiner: "Liner",
    pBed: "Mortar bed",
    pBedS: "Sloped mortar bed",
    pPreMin: "Pre-slope at the drain",
    pLinerT: "Liner (40 mil = 0.04)",
    pBedT: "Mortar over the liner",
    pAtDrain: "at the drain (finished)",
    pCurbAbove: "Curb above the finished floor",
    offC: "offset drain",
    pMemNote_k: "KERDI on top — the membrane is in the pan's Build-up.",
    pMemNote_l:
      "Waterproofing is the liner inside the mortar; no membrane on top.",
    pMemNote_p:
      "The prefab pan is waterproof already — no extra membrane in the Build-up.",
  },
};
const sht = (k) => (SHT[lang] || SHT.en)[k] || k;

/* ---------- shower pan systems we build with ----------
   Thicknesses above the subfloor, inches. g = at the perimeter, h = at the drain.
   HYDRO-BLOK: 2022 catalog (Classic / Low-Profile center drain, Single Slope with the ebbe INNI linear drain).
   Schluter: KERDI-SHOWER tray table (T / TS / TT / LT / LTS), perimeter heights as published. */
const PAN_SYS = {
  mudliner: { k: "mud2", mem: "none" }, // pre-slope, 40 mil liner, mortar bed
  mudkerdi: { k: "mud1", mem: "kerdi" }, // one sloped mortar bed, KERDI on top
  hbclassic: {
    k: "pre",
    mem: "none",
    brand: "HYDRO-BLOK Classic",
    drain: "center",
  },
  hblow: {
    k: "pre",
    mem: "none",
    brand: "HYDRO-BLOK Low-Profile",
    drain: "center",
  },
  hbss: {
    k: "pre",
    mem: "none",
    brand: "HYDRO-BLOK Single Slope + ebbe INNI",
    drain: "linear",
  },
  hbssthin: {
    k: "pre",
    mem: "none",
    brand: "HYDRO-BLOK Thin Single Slope + ebbe INNI",
    drain: "linear",
  },
  scht: {
    k: "pre",
    mem: "none",
    brand: "Schluter KERDI-SHOWER-T / TS",
    drain: "center",
  },
  schtt: {
    k: "pre",
    mem: "none",
    brand: "Schluter KERDI-SHOWER-TT (thin)",
    drain: "center",
  },
  schlt: {
    k: "pre",
    mem: "none",
    brand: "Schluter KERDI-SHOWER-LT",
    drain: "center",
  },
  schlts: {
    k: "pre",
    mem: "none",
    brand: "Schluter KERDI-SHOWER-LTS (KERDI-LINE)",
    drain: "linear",
  },
  tray: { k: "tray", mem: "none" }, // any other foam tray: thickness typed in
};
// [model id, width, depth, perimeter g, drain h (null = from the slope), note]
const PAN_MODELS = {
  hbclassic: [
    ["3636", 36, 36, 1.5, 1],
    ["3648", 36, 48, 1.5, 1],
    ["3660", 36, 60, 1.5, 1],
    ["3672", 36, 72, 1.5, 1],
    ["3672o", 36, 72, 2, 1.5, "off"],
    ["4848", 48, 48, 1.5, 1],
    ["4860", 48, 60, 1.5, 1],
    ["4872", 48, 72, 1.5, 1],
    ["4884", 48, 84, 2, 1.5],
    ["6060", 60, 60, 1.5, 1],
    ["6072", 60, 72, 1.5, 1],
    ["6084", 60, 84, 2, 1.5],
    ["7272", 72, 72, 1.5, 1],
  ],
  hblow: [
    ["3636", 36, 36, 1, 0.75],
    ["3648", 36, 48, 1, 0.75],
    ["3660", 36, 60, 1, 0.75],
    ["3672", 36, 72, 1, 0.75],
    ["3672o", 36, 72, 1.25, 1, "off"],
    ["4848", 48, 48, 1, 0.75],
    ["4860", 48, 60, 1, 0.75],
    ["4872", 48, 72, 1, 0.75],
    ["4884", 48, 84, 1.25, 1],
    ["6060", 60, 60, 1, 0.75],
    ["6072", 60, 72, 1, 0.75],
    ["6084", 60, 84, 1.25, 1],
    ["7272", 72, 72, 1, 0.75],
  ],
  hbss: [
    ["3660", 36, 60, 2.25, 1.25],
    ["6036", 60, 36, 1.75, 0.75],
    ["4872", 48, 72, 2.5, 1.5],
    ["7248", 72, 48, 2, 1],
  ],
  hbssthin: [
    ["3660", 36, 60, 1.5, 1.25],
    ["6036", 60, 36, 1, 0.75],
    ["4872", 48, 72, 1.75, 1.5],
    ["7248", 72, 48, 1.25, 1],
  ],
  scht: [
    ["KST965/1525", 38, 60, 1.125, null],
    ["KST1220/1525", 48, 60, 1.09375, null],
    ["KST1220/1830", 48, 72, 1.25, null],
    ["KST1525", 60, 60, 1.1875, null],
    ["KST1830", 72, 72, 1.25, null],
    ["KST965/1525S", 38, 60, 1.125, null, "off"],
  ],
  schtt: [
    ["KST965/810BF", 32, 38, 0.90625, null],
    ["KST915/1220BF", 36, 48, 1, null],
    ["KST915BF", 36, 36, 0.875, null],
    ["KST965BF", 38, 38, 0.90625, null],
    ["KST1220BF", 48, 48, 1, null],
    ["KST965NA/BF", 38, 38, 1.03125, null, "neo"],
  ],
  schlt: [
    ["KSLT1000", 39, 39, 1.25, null],
    ["KSLT1220", 48, 48, 1.375, null],
    ["KSLT1395", 55, 55, 1.4375, null],
  ],
  schlts: [
    ["KSLT1000S", 39, 39, 1.65625, null],
    ["KSLT1220S", 48, 48, 1.8125, null],
    ["KSLT1395S", 55, 55, 2, null],
    ["KSLT915/1395S", 36, 55, 2, null],
    ["KSLT915/1830S", 36, 72, 2.3125, null],
    ["KSLT965/1930S", 38, 76, 2.375, null],
    ["KSLT1930/965S", 76, 38, 1.625, null],
  ],
};
const CURBS = [
  ["hb", "HYDRO-BLOK Curb", 3.5, 4],
  ["hbmini", "HYDRO-BLOK Mini Curb", 2, 2.5],
  ["kerdisc", "Schluter KERDI-BOARD-SC", 4.5, 6],
];
const panModel = (s) =>
  (PAN_MODELS[s.psys] || []).find((m) => m[0] === s.pmodel) || null;
const modelName = (m) =>
  `${m[1]}″ × ${m[2]}″${m[0].match(/^K/) ? " · " + m[0] : ""}${m[5] === "off" ? " · " + sht("offC") : m[5] === "neo" ? " · neo-angle" : ""}`;

/* pick a model: the pan takes its size, drain kind and center */
function panApplyModel(s) {
  const m = panModel(s),
    sy = PAN_SYS[s.psys];
  if (!m || !sy) return;
  s.w = m[1];
  s.h = m[2];
  if (sy.drain === "linear") {
    const len = Math.max(12, s.w - 1);
    s.drain = Object.assign(s.drain || {}, {
      type: "linear",
      vert: false,
      len,
      wid: 2.75,
      x: (s.w - len) / 2,
      y: s.h - 1 - 2.75,
    });
  } else {
    s.drain = Object.assign(s.drain || {}, {
      type: "center",
      x: s.w / 2,
      y: s.h / 2,
    });
    if (m[5] === "off") s.drain.y = s.h * 0.25; // off-center: set the real spot with the fields below
  }
  if (s.panShape !== "cut") {
    s.shape = "rect";
    s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
  }
}

/* ---------- defaults / migration ---------- */
function panNorm(s) {
  if (!s || s.type !== "pan") return;
  if (!s.panType)
    s.panType = s.curb && s.curb.on === false ? "curbless" : "curb";
  if (!s.panShape) s.panShape = "rect";
  if (!s.pcut) s.pcut = { at: "fl", a: 12, b: 12 };
  if (!s.pw) s.pw = { b: true, l: true, r: true, f: false };
  if (!s.wl) s.wl = { prep: null, fin: null };
  if (!s.cb) s.cb = { m: "tray", tray: 1.5, min: 0.75, slope: 0.25 };
  if (s.cb.pre == null)
    Object.assign(s.cb, { pre: 0.5, liner: 0.04, bed: 0.75 });
  if (!s.psys)
    s.psys =
      s.cb.m === "mortar"
        ? "mudkerdi"
        : s.stack && s.stack.under === "kerdi"
          ? "mudkerdi"
          : "tray";
  if (s.panType === "curbless" && s.curb) s.curb.on = false;
  // a shower floor always has a membrane: give older pans one once (the user can still change it)
  if (!s.memDef) {
    s.memDef = 1;
    s.stack = s.stack || {};
    if (!s.stack.under || s.stack.under === "none") s.stack.under = "kerdi";
  }
}

/* ---------- wall layers: framing → prep face → finished tile ---------- */
function wallLayers(s) {
  const wl = (s && s.wl) || {};
  // take them from a wall in this project when there is one
  const w =
    P.surfaces.find(
      (x) =>
        x.type === "wall" &&
        x.stack &&
        x.stack.under &&
        x.stack.under !== "none",
    ) || P.surfaces.find((x) => x.type === "wall");
  let prep = 0.5,
    fin = 0.1875 + 0.375;
  if (w) {
    const st = stackOf(w);
    prep = (st.u2.t || 0) + (st.u.t || 0) || 0.5;
    fin = (st.tb || 0) + (+w.tile.thick || 0.375);
  }
  return {
    prep: wl.prep != null && wl.prep !== "" ? +wl.prep : prep,
    fin: wl.fin != null && wl.fin !== "" ? +wl.fin : fin,
    autoPrep: prep,
    autoFin: fin,
  };
}
/* prep-face distance → distance to the chosen reference (and back) */
function refOff(L) {
  const r = P.dref || "frame";
  return r === "frame" ? L.prep : r === "finish" ? -L.fin : 0;
}

/* ---------- pan shape ---------- */
function panApplyShape(s) {
  const w = +s.w,
    h = +s.h;
  if (s.panShape !== "cut") {
    // only undo a cut we made ourselves (a hand-drawn pan keeps its outline)
    if (s.pcutOn) {
      s.shape = "rect";
      s.segs = polyToSegs(rectPoly(0, 0, w, h));
      s.pcutOn = false;
    }
    return;
  }
  s.pcutOn = true;
  const a = Math.max(1, Math.min(w - 1, +s.pcut.a || 12)),
    b = Math.max(1, Math.min(h - 1, +s.pcut.b || 12));
  const pts =
    s.pcut.at === "fr"
      ? [
          [0, 0],
          [w - a, 0],
          [w, b],
          [w, h],
          [0, h],
        ]
      : [
          [a, 0],
          [w, 0],
          [w, h],
          [0, h],
          [0, b],
        ];
  ptsToWalk(s, pts);
  s.w = w;
  s.h = h;
}

/* ---------- drain distances ---------- */
function drainCenter(s) {
  const d = s.drain || {};
  if (d.type === "linear")
    return d.vert
      ? [+d.x + (+d.wid || 2.75) / 2, +d.y + (+d.len || 0) / 2]
      : [+d.x + (+d.len || 0) / 2, +d.y + (+d.wid || 2.75) / 2];
  return [+d.x || 0, +d.y || 0];
}
function drainSet(s, side, val) {
  // val is measured to the chosen reference; convert to the prep face and move the drain
  const L = wallLayers(s),
    v = val - (s.pw[side] ? refOff(L) : 0),
    d = s.drain,
    c = drainCenter(s),
    w = +s.w,
    h = +s.h;
  let cx = c[0],
    cy = c[1];
  if (side === "l") cx = v;
  if (side === "r") cx = w - v;
  if (side === "b") cy = h - v;
  if (side === "f") cy = v;
  cx = Math.max(1, Math.min(w - 1, cx));
  cy = Math.max(1, Math.min(h - 1, cy));
  if (d.type === "linear") {
    if (d.vert) {
      d.x = cx - (+d.wid || 2.75) / 2;
      d.y = cy - (+d.len || 0) / 2;
    } else {
      d.x = cx - (+d.len || 0) / 2;
      d.y = cy - (+d.wid || 2.75) / 2;
    }
  } else {
    d.x = cx;
    d.y = cy;
  }
}

/* drain center to each side, measured to the chosen reference where there is a wall */
function drainDists(s) {
  const off = refOff(wallLayers(s)),
    c = drainCenter(s),
    w = +s.w,
    h = +s.h,
    v = { l: c[0], r: w - c[0], b: h - c[1], f: c[1] },
    o = {};
  for (const k in v) o[k] = Math.round((v[k] + (s.pw[k] ? off : 0)) * 16) / 16;
  return o;
}
// the side a distance is given from: the user's pick, else the nearest one
function drainSide(s, ax, D) {
  const A = ax === "h" ? ["l", "r"] : ["b", "f"],
    pick = s.dside && s.dside[ax];
  if (A.includes(pick)) return pick;
  return D[A[0]] <= D[A[1]] ? A[0] : A[1];
}
function drainLab(s, k) {
  if (s.pw[k])
    return sht({ l: "sideL", r: "sideR", b: "sideB", f: "sideF" }[k]);
  if (k === "f") return sht("shToCurb");
  return (
    lang === "ru"
      ? { l: "до левого края", r: "до правого края", b: "до заднего края" }
      : { l: "to left edge", r: "to right edge", b: "to back edge" }
  )[k];
}
function drnSideSw(ax) {
  const s = cur();
  if (!s || s.type !== "pan") return;
  const A = ax === "h" ? ["l", "r"] : ["b", "f"],
    k = drainSide(s, ax, drainDists(s));
  s.dside = Object.assign({}, s.dside, { [ax]: k === A[0] ? A[1] : A[0] });
  saveSoon();
  renderPanel();
}
/* live distances from the drain center to the pan walls (shown while dragging) */
function drainDimSVG(s, c, px, fs0) {
  panNorm(s);
  const off = refOff(wallLayers(s)),
    w = +s.w,
    h = +s.h,
    seg = {
      l: [0, c[1], c[0]],
      r: [w, c[1], w - c[0]],
      b: [c[0], h, h - c[1]],
      f: [c[0], 0, c[1]],
    };
  let o = "";
  const DD = drainDists(s);
  [drainSide(s, "h", DD), drainSide(s, "v", DD)].forEach((k) => {
    const [x2, y2, v] = seg[k],
      val = v + (s.pw[k] ? off : 0),
      mx = (c[0] + x2) / 2,
      my = (c[1] + y2) / 2;
    o += `<line x1="${c[0]}" y1="${-c[1]}" x2="${x2}" y2="${-y2}" stroke="#d0342c" stroke-width="${px(1.5)}" stroke-dasharray="${px(4)} ${px(3)}"/>`;
    o += `<text x="${mx}" y="${-my}" font-size="${px(13 * (fs0 || 1))}" text-anchor="middle" dominant-baseline="central" fill="#d0342c" font-weight="800" font-family="${FONT}" paint-order="stroke" stroke="#fff" stroke-width="${px(4)}">${fmtIn(val)}″</text>`;
  });
  return o;
}
/* tap the drain on the drawing: open the pan section at the drain fields */
function drainFocus() {
  S.open.add("pan");
  renderPanel();
  setTimeout(() => {
    const e = document.querySelector("#panel [data-pnv]");
    if (e) {
      e.scrollIntoView({ block: "center", behavior: "smooth" });
      const lab = e.closest(".grid");
      if (lab) {
        lab.classList.add("flash");
        setTimeout(() => lab.classList.remove("flash"), 1400);
      }
    }
  }, 60);
}

/* ---------- curbless build-up ---------- */
function panCalc(s) {
  panNorm(s);
  const floor =
    P.surfaces.find((x) => x.type === "floor" && x.fromPlan === "floor") ||
    P.surfaces.find((x) => x.type === "floor");
  const fl = floor
      ? stackOf(floor)
      : {
          L: [
            { n: t("bondTile"), t: 0.1875 },
            { n: t("tile"), t: 0.375 },
          ],
          total: 0.5625,
        },
    pan = stackOf(s),
    cb = s.cb,
    c = drainCenter(s),
    w = +s.w,
    h = +s.h,
    d = s.drain || {};
  // slope run: linear drain → across to the far side; point drain → to the farthest corner
  let run;
  if (d.type === "linear") {
    run = d.vert ? Math.max(c[0], w - c[0]) : Math.max(c[1], h - c[1]);
  } else {
    run = Math.max(
      ...rectPoly(0, 0, w, h).map((q) => Math.hypot(q[0] - c[0], q[1] - c[1])),
    );
  }
  const slope = +cb.slope || 0.25,
    fall = (run / 12) * slope,
    sy = PAN_SYS[s.psys] || PAN_SYS.tray,
    m = panModel(s);
  let base, atDrain, parts;
  if (sy.k === "mud2") {
    // pre-slope (the fall) + 40 mil liner + an even mortar bed on top
    const pre = +cb.pre || 0,
      li = +cb.liner || 0.04,
      bed = +cb.bed || 0.75;
    base = pre + fall + li + bed;
    atDrain = pre + li + bed;
    parts = [
      { n: sht("pPre"), t: pre + fall, c: "#d9d4c7" },
      { n: sht("pLiner"), t: li, c: "#3a6ea5" },
      { n: sht("pBed"), t: bed, c: "#cfc8b8" },
    ];
  } else if (sy.k === "mud1") {
    const mn = +cb.min || 0.75;
    base = mn + fall;
    atDrain = mn;
    parts = [{ n: sht("pBedS"), t: base, c: "#d9d4c7" }];
  } else if (sy.k === "pre" && m) {
    base = m[3];
    atDrain = m[4] != null ? m[4] : Math.max(0.375, base - fall);
    parts = [{ n: sht("pPan"), t: base, c: "#e9b35c" }];
  } else {
    base = +cb.tray || 1.5;
    atDrain = Math.max(0.25, base - fall);
    parts = [{ n: sht("shBase"), t: base, c: "#d9d4c7" }];
  }
  const edge = base + pan.total,
    recess = edge - fl.total;
  return {
    floor,
    fl,
    pan,
    run,
    fall,
    base,
    atDrain,
    parts,
    edge,
    recess,
    sy,
    m,
  };
}
function panCalcSVG(R) {
  // two stacks side by side, aligned on the finished floor line; the shower side drops by the recess
  const k = 46, // px per inch
    W = 330,
    top = 26,
    fin = top + 10,
    lay = (L, x, y0, wd) => {
      let y = y0,
        h = "";
      L.forEach((l) => {
        const hh = Math.max(2, l.t * k);
        h += `<rect x="${x}" y="${y.toFixed(1)}" width="${wd}" height="${hh.toFixed(1)}" fill="${l.c || "#ccc"}" stroke="#555" stroke-width=".6"/>`;
        if (hh > 9)
          h += `<text x="${x + wd / 2}" y="${(y + hh / 2).toFixed(1)}" font-size="9" text-anchor="middle" dominant-baseline="central" font-family="${FONT}" fill="#222">${esc(fmtIn(l.t))}″</text>`;
        y += hh;
      });
      return [h, y];
    };
  const fL = R.fl.L.slice().reverse(),
    pL = R.pan.L.slice().reverse();
  let h = `<svg viewBox="0 0 ${W} 210" width="100%" style="max-width:${W}px;display:block;margin:6px auto">`;
  h += `<line x1="0" y1="${fin}" x2="${W}" y2="${fin}" stroke="#1d5fa8" stroke-dasharray="4 3"/>`;
  const [fh, fy] = lay(fL, 30, fin, 110);
  h +=
    fh +
    `<rect x="30" y="${fy}" width="110" height="18" fill="#c9a77a" stroke="#555" stroke-width=".6"/>`;
  const [ph, py] = lay(pL, 180, fin, 110);
  const bh = R.base * k;
  h += ph;
  {
    let yy = py;
    R.parts
      .slice()
      .reverse()
      .forEach((pp) => {
        const hh = Math.max(1.5, pp.t * k);
        h += `<rect x="180" y="${yy.toFixed(1)}" width="110" height="${hh.toFixed(1)}" fill="${pp.c}" stroke="#555" stroke-width=".6"/>`;
        yy += hh;
      });
  }
  {
    let yy = py;
    R.parts
      .slice()
      .reverse()
      .forEach((pp) => {
        const hh = Math.max(1.5, pp.t * k);
        if (hh > 11)
          h += `<text x="235" y="${(yy + hh / 2).toFixed(1)}" font-size="9" text-anchor="middle" dominant-baseline="central" font-family="${FONT}">${esc(pp.n)} ${fmtIn(pp.t)}″</text>`;
        yy += hh;
      });
  }
  const sy = py + bh;
  h += `<rect x="180" y="${sy}" width="110" height="18" fill="#c9a77a" stroke="#555" stroke-width=".6"/>`;
  h += `<text x="85" y="${top - 12}" font-size="11" text-anchor="middle" font-weight="700" font-family="${FONT}">${esc(sht("shFloorL"))} ${fmtIn(R.fl.total)}″</text>`;
  h += `<text x="235" y="${top - 12}" font-size="11" text-anchor="middle" font-weight="700" font-family="${FONT}">${esc(sht("shPanL"))} ${fmtIn(R.edge)}″</text>`;
  if (Math.abs(R.recess) > 0.02) {
    const y1 = fy,
      y2 = sy;
    h += `<path d="M296 ${y1}H318M296 ${y2}H318M312 ${Math.min(y1, y2)}V${Math.max(y1, y2)}" stroke="#d0342c" stroke-width="1.6" fill="none"/>`;
    h += `<text x="235" y="${(Math.max(y1, y2) + 34).toFixed(1)}" font-size="12" text-anchor="middle" font-weight="700" fill="#d0342c" font-family="${FONT}">${esc(R.recess > 0 ? sht("shRecessL") : sht("shRaise"))} ${fmtIn(Math.abs(R.recess))}″</text>`;
  }
  const HH = Math.max(fy, sy) + 46;
  h = h
    .replace('viewBox="0 0 ${W} 210"', "")
    .replace(/viewBox="0 0 330 210"/, `viewBox="0 0 ${W} ${HH.toFixed(0)}"`);
  return h + `</svg>`;
}

/* ---------- the pan section on the pan page ---------- */
function panSection(s) {
  panNorm(s);
  const d = s.drain,
    L = wallLayers(s),
    off = refOff(L);
  let h = `<div class="grid">${SEL(sht("shType"), "panType", ["curb", "curbless"], 1, "s", "w2", (o) => sht("sh_" + o))}</div>`;
  if (s.panType === "curb")
    h += `<div class="grid">${F(t("curbLen"), "curb.len")}${F(t("curbW"), "curb.w")}${F(t("curbH"), "curb.h")}</div>${CHK(t("curbTrim"), "curb.trim")}`;
  // shape
  h += `<div class="grid">${SEL(sht("shShape"), "panShape", ["rect", "cut"], 1, "s", "w2", (o) => sht("shp_" + o))}</div>`;
  if (s.panShape === "cut")
    h += `<div class="grid">${F(sht("panW"), "w")}${F(sht("panD"), "h")}${SEL(sht("shCutAt"), "pcut.at", ["fl", "fr"], 1, "s", "w2", (o) => sht("cc_" + o))}${F(sht("shCutA"), "pcut.a")}${F(sht("shCutB"), "pcut.b")}</div>`;
  // drain
  h += `<div class="grid">${SEL(t("drain"), "drain.type", ["none", "center", "linear"], 1, "s", "w2")}${d.type === "linear" ? F(t("drainLen"), "drain.len") + F(t("drainWid"), "drain.wid") : ""}</div>${d.type === "linear" ? CHK(t("drainVert"), "drain.vert", 1) : ""}`;
  // walls + reference
  h += `<p class="hsec">${sht("shWalls")}</p><div class="grid">${["b", "l", "r", "f"].map((k) => CHK(sht("sw_" + k), "pw." + k, 1)).join("")}</div>`;
  h += `<div class="grid">${SEL(sht("dref"), "dref", ["frame", "prep", "finish"], 1, "p", "w2", (o) => sht("dr_" + o))}${optLenS(sht("shWallLay"), "wl.prep", s.wl.prep, L.autoPrep)}${optLenS(sht("shWallFin"), "wl.fin", s.wl.fin, L.autoFin)}</div>`;
  if (d.type !== "none") {
    const D = drainDists(s);
    h += `<p class="hsec">${sht("shDrainFrom")}</p><p class="hint">${sht("shDragHint")}</p><div class="grid">`;
    ["h", "v"].forEach((ax) => {
      const k = drainSide(s, ax, D);
      h += `<label class="f"><span>${drainLab(s, k)} <button type="button" class="btn sm odsw" data-act="drnSideSw:${ax}" title="${odT("sw")}">⇄</button></span><input data-pnv="${k}" data-t="len" value="${fmtIn(D[k])}" autocomplete="off"></label>`;
    });
    h += `</div><p class="hint">${["l", "r", "b", "f"]
      .map((k) => `${drainLab(s, k)}: <b>${fmtIn(D[k])}″</b>`)
      .join(" · ")}</p>`;
  }
  // the pan system and its layers (both with a curb and curbless)
  const R = panCalc(s),
    sy = PAN_SYS[s.psys] || PAN_SYS.tray;
  h += `<p class="hsec">${sht("pSys")}</p><div class="grid">${SEL(sht("pSys"), "psys", Object.keys(PAN_SYS), 1, "s", "w2", (o) => sht("ps_" + o))}`;
  if (sy.k === "pre") {
    const ms = PAN_MODELS[s.psys] || [];
    h += `<label class="f w2"><span>${sht("pModel")}</span><select data-k="pmodel" data-sc="s" data-rb="1"><option value="">—</option>${ms
      .map(
        (m) =>
          `<option value="${esc(m[0])}" ${m[0] === s.pmodel ? "selected" : ""}>${esc(modelName(m))}</option>`,
      )
      .join("")}</select></label>`;
  } else if (sy.k === "mud2")
    h +=
      F(sht("pPreMin"), "cb.pre") +
      F(sht("pLinerT"), "cb.liner") +
      F(sht("pBedT"), "cb.bed") +
      F(sht("shSlope"), "cb.slope");
  else if (sy.k === "mud1")
    h += F(sht("shMinDrain"), "cb.min") + F(sht("shSlope"), "cb.slope");
  else h += F(sht("shTrayH"), "cb.tray") + F(sht("shSlope"), "cb.slope");
  h += `</div>`;
  if (sy.k === "pre" && R.m)
    h += `<p class="hint">${sht("pModelInfo").replace("{g}", fmtIn(R.m[3])).replace("{h}", fmtIn(R.atDrain))}${R.m[4] == null ? " " + sht("pDrainEst") : ""}</p>`;
  if (sy.k === "pre" && !R.m) h += `<p class="note">${sht("pPick")}</p>`;
  h += `<p class="hint">${sht("pMemNote_" + (sy.mem === "kerdi" ? "k" : sy.k === "mud2" ? "l" : "p"))}</p>`;
  if (s.panType === "curb")
    h += `<div class="btns">${CURBS.map((c) => `<button class="btn sm" data-act="curbPreset:${c[0]}">${esc(c[1])} ${fmtIn(c[2])}×${fmtIn(c[3])}</button>`).join("")}</div>`;
  h += `<p class="hsec">${sht("shCalc")}</p>`;
  h += panCalcSVG(R);
  h += `<div class="pcm"><div>${sht("shFloorFin")}: <b>${fmtIn(R.fl.total)}″</b></div><div>${sht("shPanEdge")}: <b>${fmtIn(R.edge)}″</b> · ${sht("pAtDrain")}: <b>${fmtIn(R.atDrain + R.pan.total)}″</b></div><div>${sht("shRun")}: ${fmtIn(R.run)}″ · ${sht("shFall")}: ${fmtIn(R.fall)}″</div>`;
  if (s.panType === "curbless") {
    if (R.recess > 0.03)
      h += `<div style="font-size:16px">${sht("shRecess")} <b>${fmtIn(R.recess)}″</b></div>`;
    else if (R.recess < -0.03)
      h += `<div style="font-size:16px">${sht("shRaise")} <b>${fmtIn(-R.recess)}″</b></div>`;
    else h += `<div>✓ ${sht("shFlush")}</div>`;
  } else if (s.curb)
    h += `<div>${sht("pCurbAbove")}: <b>${fmtIn(Math.max(0, +s.curb.h - R.edge + R.fl.total))}″</b></div>`;
  h += `</div><p class="hint">${R.floor ? sht("shFloorSrc").replace("{n}", esc(R.floor.name)) : sht("shNoFloor")}</p>`;
  return h;
}
function optLenS(label, k, v, auto) {
  return `<label class="f"><span>${label}</span><input data-k="${k}" data-sc="s" data-t="len" data-opt="1" value="${v != null && v !== "" ? fmtIn(+v) : ""}" placeholder="${t("autoV")} ${fmtIn(auto)}" autocomplete="off"></label>`;
}

/* drain distance inputs */
function pnvInp(e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.pnv) return;
  const s = cur();
  if (!s || s.type !== "pan") return;
  const v = parseLen(el.value);
  if (!isFinite(v)) {
    el.classList.add("bad");
    return;
  }
  el.classList.remove("bad");
  drainSet(s, el.dataset.pnv, v);
  const kk = el.dataset.pnv;
  s.dside = Object.assign({}, s.dside, {
    [kk === "l" || kk === "r" ? "h" : "v"]: kk,
  });
  changed();
  if (e.type === "change") renderPanel();
}
document.addEventListener("input", pnvInp);
document.addEventListener("change", pnvInp);

/* keep shape and curb in step with the pan settings */
{
  const ch = changed;
  changed = function () {
    // while the plan page is open, edits belong to the plan: don't push the pan back over it
    const s = typeof cur === "function" && !S.plan ? cur() : null;
    if (s && s.type === "pan") {
      panNorm(s);
      if (s.panType === "curbless") s.curb.on = false;
      else if (s.curb && s.curb.on === false && s.panTypeWas === "curbless")
        s.curb.on = true;
      s.panTypeWas = s.panType;
      if (s.psys !== s.psysWas) {
        const sy = PAN_SYS[s.psys];
        if (sy) {
          s.stack = s.stack || {};
          s.stack.under = sy.mem;
        }
        if (!(PAN_MODELS[s.psys] || []).some((m) => m[0] === s.pmodel))
          s.pmodel = "";
        s.psysWas = s.psys;
      }
      if (s.pmodel !== s.pmodelWas) {
        if (s.pmodel) panApplyModel(s);
        s.pmodelWas = s.pmodel;
      }
      panApplyShape(s);
      panToPlan(s);
      // the floor's cut-out for this pan follows right away
      if (typeof planCutSync === "function") planCutSync();
    }
    return ch.apply(this, arguments);
  };
}

/* a pan built from the room plan: edits made on the pan page go back to the plan item,
   so the next "update from the plan" keeps them */
function panToPlan(s) {
  const m = /^it(.+)$/.exec(s.fromPlan || "");
  if (!m || !P.plan) return;
  const it = P.plan.items.find((x) => x.id === m[1]);
  if (!it) return;
  // a pan against a wall end stays against it when its width changes
  if (Math.abs(+it.w - +s.w) > 1e-6) {
    try {
      const W = planWall(it.wall),
        e = planItemX(it, W),
        nw = +s.w;
      if (e[0] <= 1) it.c = e[0] + nw / 2;
      else if (e[1] >= W.L - 1) it.c = e[1] - nw / 2;
    } catch (er) {}
  }
  it.w = +s.w;
  it.dp = +s.h;
  it.cl = s.panType === "curbless";
  it.psh = s.panShape === "cut" ? "cut" : "rect";
  it.pcut = Object.assign({}, s.pcut || {});
  const d = s.drain || {},
    w = +s.w,
    h = +s.h;
  if (d.type === "linear") {
    it.drn = "linear";
    it.llen = +d.len;
    if (d.vert) {
      const left = +d.x < w / 2;
      it.lside = left ? "left" : "right";
      it.loff = left ? +d.x : w - +d.x - (+d.wid || 2.75);
    } else {
      const back = +d.y > h / 2;
      it.lside = back ? "back" : "front";
      it.loff = back ? h - +d.y - (+d.wid || 2.75) : +d.y;
    }
  } else if (d.type === "center") {
    const centered =
      Math.abs(+d.x - w / 2) < 0.05 && Math.abs(+d.y - h / 2) < 0.05;
    it.drn = centered ? "center" : "point";
    it.dl = +d.x;
    it.db = h - +d.y;
  }
}

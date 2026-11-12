"use strict";
/* ================= state ================= */
const SKEY = "prusart-tile-layout-v1";
let DB,
  P,
  S = {
    tab: 0,
    view: { zoom: 1, panX: 0, panY: 0 },
    labels: true,
    nums: false,
    mode: "tiles",
    layer: "tile",
    client: false,
    step: 0.125,
    open: new Set([
      "prep",
      "surf",
      "tile",
      "layout",
      "res",
      "proj",
      "tot",
      "link",
      "allres",
      "mat",
      "pdfs",
      "zones",
      "heat",
      "trans",
    ]),
    items: [],
    vb: [0, 0, 1, 1],
    upp: 0.1,
  };
function defTile(o) {
  return Object.assign(
    {
      thick: 0.375,
      shape: "rect",
      w: 12,
      h: 24,
      w2: 6,
      g: 0.125,
      pattern: "offset",
      off: 0.5,
      ang: 0,
      rot: true,
      ox: 0,
      oy: 0,
      sqftBox: 0,
      cang: 45,
      checker: false,
      sheet: { on: false, w: 12, h: 12 },
    },
    o || {},
  );
}
function newSurface(type, name) {
  const n = P ? P.surfaces.filter((x) => x.type === type).length : 0;
  const s = {
    id: uid(),
    type,
    name: name ? t(name) : t(type) + (type === "wall" ? " " + (n + 1) : ""),
    nk: name || type,
    nn: name ? 0 : type === "wall" ? n + 1 : 0,
    shape: "rect",
    w: 60,
    h: 96,
    Lw: 24,
    Lh: 24,
    Lc: "tr",
    pts: "0,0; 60,0; 60,40; 30,40; 30,72; 0,72",
    openings: [],
    trim: { l: false, r: false, t: false, b: false },
    extraLF: 0,
    base: 0,
    link: true,
    tile: defTile(),
    curb: { on: false, len: 60, w: 4.5, h: 4.5, trim: true },
    drain: { type: "none", x: 30, y: 18, len: 48, wid: 2.75 },
    wet: type !== "floor",
    uneven: { on: false, l: 0, r: 0, m: 0, mOn: false },
    plumb: { on: false, l: 0, r: 0 },
    tub: { on: false, side: "r", d: 30, h: 15, r: 1.5, rF: 0, rB: 0 },
    pos: { x: 0, y: 0 },
    zlink: false,
    segs: null,
    stack: { under: type === "floor" ? "ditra" : "none", under2: "none", ub: null, tb: null },
    prof: { type: "inherit", size: "auto", vis: null },
    trans: [],
    heat: {
      on: false,
      sys: "ditraheat",
      pattern: "3",
      volt: "120",
      clear: 4,
      conn: null,
      show: true,
      sp: 3,
      wsf: 12,
    },
  };
  if (type === "floor") {
    s.w = 96;
    s.h = 72;
    s.tile = defTile({ w: 24, h: 24, w2: 12, pattern: "grid", rot: false });
  }
  if (type === "pan") {
    s.w = 60;
    s.h = 36;
    s.tile = defTile({ w: 2, h: 2, w2: 1, pattern: "grid", rot: false, sheet: { on: true, w: 12, h: 12 } });
    s.curb.on = true;
    s.drain.type = "center";
  }
  if (type !== "wall" && P) {
    const fl = P.surfaces.filter((x) => x.type !== "wall");
    if (fl.length) {
      s.pos = { x: Math.max(...fl.map((x) => (+x.pos.x || 0) + bboxOf(outerPoly(x)).x1)) + 12, y: 0 };
    }
  }
  s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
  if (type === "wall" && P && P.surfaces.length) {
    const fw = P.surfaces.find((x) => x.type === "wall");
    if (fw) s.tile = JSON.parse(JSON.stringify(fw.tile));
  }
  return s;
}
function newProject(sample) {
  const p = {
    id: uid(),
    nk: sample ? "sample" : "newName",
    name: sample ? t("sample") : t("newName"),
    client: "",
    updated: Date.now(),
    waste: 10,
    minCut: 2,
    edgeGap: 0.125,
    kerf: 0.125,
    sch: { type: "JOLLY", profile: "JOLLY", size: "3/8″ (10 mm)", vis: 0.125 },
    customUnder: [],
    link: { mode: "height", ox: 0, oy: 0 },
    flink: { ox: 0, oy: 0 },
    mat: defMat(),
    surfaces: [],
  };
  const prev = P;
  P = p;
  if (sample) {
    const b = newSurface("wall", "backWall");
    b.trim.t = true;
    b.openings.push(
      { id: uid(), type: "niche", shape: "rect", x: 18, y: 42, w: 24, h: 12, d: 3.5, trim: true },
      { id: uid(), type: "valve", shape: "circle", x: 30, y: 48 - 20, dia: 3 },
      { id: uid(), type: "pipe", shape: "circle", x: 30, y: 80, dia: 1.125 },
    );
    b.openings[1].y = 30;
    const l = newSurface("wall", "leftWall");
    l.w = 36;
    l.trim.t = true;
    l.trim.r = true;
    const r = newSurface("wall", "rightWall");
    r.w = 36;
    r.trim.t = true;
    r.trim.l = true;
    const pn = newSurface("pan");
    const f = newSurface("floor", "bathFloor");
    f.shape = "L";
    f.Lw = 36;
    f.Lh = 30;
    f.openings.push(
      { id: uid(), type: "toilet", shape: "circle", x: 72, y: 12, dia: 5 },
      { id: uid(), type: "duct", shape: "rect", x: 8, y: 60, w: 10, h: 4 },
    );
    p.surfaces.push(b, l, r, pn, f);
  } else p.surfaces.push(newSurface("wall"));
  arrangeFloors(p);
  p.surfaces.forEach((s) => autoLayout(s));
  P = prev;
  return p;
}
function arrangeFloors(p) {
  const fl = p.surfaces.filter((x) => x.type !== "wall");
  if (fl.length < 2) return;
  if (!fl.every((x) => !x.pos || (!+x.pos.x && !+x.pos.y))) return;
  let x = 0;
  fl.forEach((z) => {
    const b = bboxOf(outerPoly(z));
    z.pos = { x: x - b.x0, y: 0 };
    x += b.x1 - b.x0 + 12;
  });
}
function migrate(p) {
  p.link = p.link || { mode: "none", ox: 0, oy: 0 };
  p.sch = p.sch || { profile: "JOLLY", size: "3/8″", vis: 0.125 };
  if (!p.sch.type) p.sch.type = "JOLLY";
  p.surfaces = Array.isArray(p.surfaces) ? p.surfaces.filter((s) => s && typeof s === "object") : [];
  if (p.waste == null) p.waste = 10;
  if (p.minCut == null) p.minCut = 2;
  if (p.edgeGap == null) p.edgeGap = 0.125;
  if (p.kerf == null) p.kerf = 0.125;
  if (!p.id) p.id = uid();
  p.surfaces.forEach((s) => {
    if (!s.type) s.type = "wall";
    if (!s.id) s.id = uid();
    if (!s.shape) s.shape = "rect";
    if (!(+s.w > 0)) s.w = s.type === "floor" ? 96 : 60;
    if (!(+s.h > 0)) s.h = s.type === "floor" ? 72 : 96;
    if (!s.curb) s.curb = { on: false, len: 60, w: 4.5, h: 4.5, trim: true };
    if (!s.drain) s.drain = { type: "none", x: 30, y: 18, len: 48, wid: 2.75 };
  });
  p.customUnder = p.customUnder || [];
  p.flink = p.flink || { ox: 0, oy: 0 };
  p.mat = Object.assign(defMat(), p.mat || {});
  const findKey = (nm, keys) => {
    for (const k of keys) for (const L of ["ru", "en"]) if (I18N[L][k] === nm) return k;
    return null;
  };
  if (!p.nk) {
    const k = findKey(p.name, ["sample", "newName"]);
    if (k) p.nk = k;
  }
  p.surfaces.forEach((s) => {
    if (s.nk !== undefined) return;
    const k = findKey(s.name, ["backWall", "leftWall", "rightWall", "bathFloor", "pan", "floor", "wall"]);
    if (k) {
      s.nk = k;
      s.nn = 0;
      return;
    }
    const m = String(s.name).match(/^(Стена|Wall) (\d+)$/);
    if (m) {
      s.nk = "wall";
      s.nn = +m[2];
    }
  });
  p.sch = p.sch || { profile: "JOLLY", size: "3/8″", vis: 0.125 };
  p.surfaces.forEach((s) => {
    const T = (s.tile = s.tile || defTile());
    if (!T.shape) T.shape = "rect";
    if (T.pattern === "half") {
      T.pattern = "offset";
      T.off = 0.5;
    }
    if (T.pattern === "third") {
      T.pattern = "offset";
      T.off = 1 / 3;
    }
    if (T.pattern === "vhalf") {
      T.pattern = "voffset";
      T.off = 0.5;
    }
    if (T.off == null) T.off = 0.5;
    if (T.ang == null) T.ang = 0;
    if (!T.sheet) T.sheet = { on: false, w: 12, h: 12 };
    if (T.w2 == null) T.w2 = +T.w / 2;
    if (T.cang == null) T.cang = 45;
    if (T.checker == null) T.checker = false;
    s.openings = (s.openings || [])
      .filter((o) => o && typeof o === "object")
      .map((o) => {
        if (o.type === "hole") o.type = "cutout";
        if (!OPT[o.type]) o.type = "cutout";
        const d = OPT[o.type] || {};
        if (!o.id) o.id = uid();
        o.x = isFinite(+o.x) ? +o.x : 0;
        o.y = isFinite(+o.y) ? +o.y : 0;
        if (!(+o.w > 0)) o.w = d.w || 6;
        if (!(+o.h > 0)) o.h = d.h || 6;
        if (o.type === "niche" && !(+o.d > 0)) o.d = d.d || 3.5;
        if (!o.shape) o.shape = (OPT[o.type] || {}).shape || "rect";
        if (o.shape === "circle" && !o.dia) o.dia = 4;
        return o;
      });
    s.trim = s.trim || {};
    if (s.base == null) s.base = 0;
    s.uneven = s.uneven || { on: false, l: 0, r: 0, m: 0, mOn: false };
    if (s.wet == null) s.wet = s.type !== "floor";
    if (!s.pos) s.pos = { x: 0, y: 0 };
    if (s.zlink == null) s.zlink = false;
    if (!s.segs) s.segs = polyToSegs(outerPoly(s));
    if (!s.plumb) s.plumb = { on: false, l: 0, r: 0 };
    if (!s.tub) s.tub = { on: false, side: "r", d: 30, h: 15, r: 1.5, rF: 0, rB: 0 };
    if (!s.stack)
      s.stack = { under: s.type === "floor" ? "ditra" : "none", under2: "none", ub: null, tb: null };
    if (!s.prof) s.prof = { type: "inherit", size: "auto", vis: null };
    if (!s.trans) s.trans = [];
    if (!s.heat)
      s.heat = {
        on: false,
        sys: "ditraheat",
        pattern: "3",
        volt: 120,
        clear: 4,
        conn: null,
        show: true,
        sp: 3,
        wsf: 12,
      };
    if (T.thick == null) T.thick = T.sheet && T.sheet.on ? 0.25 : 0.375;
    if (s.link == null) s.link = true;
    s.curb = s.curb || { on: false, len: 60, w: 4.5, h: 4.5, trim: true };
    s.drain = s.drain || { type: "none", x: 30, y: 18, len: 48, wid: 2.75 };
  });
  arrangeFloors(p);
  return p;
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SKEY));
    if (d && Array.isArray(d.projects)) return d;
  } catch (e) {}
  return null;
}
let saveT = 0;
let UNDO = [],
  REDO = [],
  LAST = null;
function commitUndo() {
  if (!P) return;
  const cur2 = JSON.stringify(P);
  if (LAST === null) {
    LAST = cur2;
    return;
  }
  if (cur2 !== LAST) {
    UNDO.push(LAST);
    if (UNDO.length > 80) UNDO.shift();
    REDO = [];
    LAST = cur2;
    if (typeof renderTools === "function") renderTools();
  }
}
function resetUndo() {
  UNDO = [];
  REDO = [];
  LAST = JSON.stringify(P);
}
function swapP(json) {
  const np = JSON.parse(json);
  const i = DB.projects.findIndex((x) => x.id === P.id);
  if (i >= 0) DB.projects[i] = np;
  P = np;
  LAST = json;
  if (typeof S.tab === "number" && !P.surfaces[S.tab]) S.tab = 0;
  renderAll();
  try {
    localStorage.setItem(SKEY, JSON.stringify(DB));
  } catch (e) {}
}
function doUndo() {
  clearTimeout(saveT);
  commitUndo();
  if (!UNDO.length) return;
  REDO.push(LAST);
  swapP(UNDO.pop());
}
function doRedo() {
  if (!REDO.length) return;
  UNDO.push(LAST);
  swapP(REDO.pop());
}
function saveSoon() {
  clearTimeout(saveT);
  saveT = setTimeout(() => {
    P.updated = Date.now(); // before the undo snapshot, so the timestamp alone never looks like an edit
    commitUndo();
    DB.curId = P.id;
    DB.lang = lang;
    DB.theme = THEME;
    try {
      localStorage.setItem(SKEY, JSON.stringify(DB));
      S.saveErr = false;
    } catch (e) {
      // storage full or blocked: tell the user once, so nothing is lost silently
      if (!S.saveErr && typeof toast === "function") toast(t("saveErr"), false);
      S.saveErr = true;
    }
  }, 400);
}
const cur = () => (typeof S.tab === "number" ? P.surfaces[S.tab] : null);
function getPath(o, k) {
  return k.split(".").reduce((a, x) => (a == null ? a : a[x]), o);
}
function setPath(o, k, v) {
  const ks = k.split(".");
  const last = ks.pop();
  const t2 = ks.reduce((a, x) => a[x], o);
  t2[last] = v;
}

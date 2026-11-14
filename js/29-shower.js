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
  },
};
const sht = (k) => (SHT[lang] || SHT.en)[k] || k;

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
  if (s.panType === "curbless" && s.curb) s.curb.on = false;
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
  const fall = (run / 12) * (+cb.slope || 0.25),
    base = cb.m === "mortar" ? (+cb.min || 0.75) + fall : +cb.tray || 1.5,
    edge = base + pan.total,
    recess = edge - fl.total;
  return { floor, fl, pan, run, fall, base, edge, recess };
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
  h +=
    ph +
    `<rect x="180" y="${py}" width="110" height="${bh.toFixed(1)}" fill="#d9d4c7" stroke="#555" stroke-width=".6"/>`;
  h += `<text x="235" y="${(py + bh / 2).toFixed(1)}" font-size="9" text-anchor="middle" dominant-baseline="central" font-family="${FONT}">${esc(sht("shBase"))} ${fmtIn(R.base)}″</text>`;
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
    const c = drainCenter(s),
      w = +s.w,
      hh = +s.h,
      val = { l: c[0], r: w - c[0], b: hh - c[1], f: c[1] },
      nm = { l: "sideL", r: "sideR", b: "sideB", f: "sideF" };
    h += `<p class="hsec">${sht("shDrainFrom")}</p><div class="grid">`;
    ["b", "l", "r", "f"].forEach((k) => {
      if (!s.pw[k] && k !== "f") return;
      const isW = s.pw[k],
        v = val[k] + (isW ? off : 0),
        lab = isW ? sht(nm[k]) : sht("shToCurb");
      h += `<label class="f"><span>${lab}</span><input data-pnv="${k}" data-t="len" value="${fmtIn(v)}" autocomplete="off"></label>`;
    });
    h += `</div>`;
  }
  // curbless calculation
  if (s.panType === "curbless") {
    const R = panCalc(s);
    h += `<p class="hsec">${sht("shCalc")}</p><div class="grid">${SEL(sht("shMethod"), "cb.m", ["tray", "mortar"], 1, "s", "w2", (o) => sht("m_" + o))}${s.cb.m === "tray" ? F(sht("shTrayH"), "cb.tray") : F(sht("shMinDrain"), "cb.min") + F(sht("shSlope"), "cb.slope")}</div>`;
    h += panCalcSVG(R);
    h += `<div class="pcm"><div>${sht("shFloorFin")}: <b>${fmtIn(R.fl.total)}″</b></div><div>${sht("shPanEdge")}: <b>${fmtIn(R.edge)}″</b></div><div>${sht("shRun")}: ${fmtIn(R.run)}″ · ${sht("shFall")}: ${fmtIn(R.fall)}″</div>`;
    if (R.recess > 0.03)
      h += `<div style="font-size:16px">${sht("shRecess")} <b>${fmtIn(R.recess)}″</b></div>`;
    else if (R.recess < -0.03)
      h += `<div style="font-size:16px">${sht("shRaise")} <b>${fmtIn(-R.recess)}″</b></div>`;
    else h += `<div>✓ ${sht("shFlush")}</div>`;
    h += `</div><p class="hint">${R.floor ? sht("shFloorSrc").replace("{n}", esc(R.floor.name)) : sht("shNoFloor")}</p>`;
  }
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
  changed();
  if (e.type === "change") renderPanel();
}
document.addEventListener("input", pnvInp);
document.addEventListener("change", pnvInp);

/* keep shape and curb in step with the pan settings */
{
  const ch = changed;
  changed = function () {
    const s = typeof cur === "function" ? cur() : null;
    if (s && s.type === "pan") {
      panNorm(s);
      if (s.panType === "curbless") s.curb.on = false;
      else if (s.curb && s.curb.on === false && s.panTypeWas === "curbless")
        s.curb.on = true;
      s.panTypeWas = s.panType;
      panApplyShape(s);
    }
    return ch.apply(this, arguments);
  };
}

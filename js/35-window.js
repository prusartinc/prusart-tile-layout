"use strict";
/* ================= window returns =================
   A window on the plan can have its returns tiled: left / right jambs, head and sill, each
   `depth` deep (wall face to window frame). Every tiled return becomes its own surface
   ("win:<id>:<part>") and its outer edge (where it meets the wall's face) is finished with
   Schluter, pencil liner, bullnose or a 45° miter. The sill can instead be stone / wood. */
const WNT = {
  ru: {
    ret: "Откосы окна в плитке",
    depth: "Глубина откоса (от стены до рамы)",
    parts: "Что облицовать",
    p_l: "Левый откос",
    p_r: "Правый откос",
    p_h: "Верх (перемычка)",
    p_s: "Подоконник",
    sill: "Подоконник из",
    s_tile: "плитки",
    s_stone: "камня / кварца (не плитка)",
    edge: "Внешний край откосов",
    slope: "Уклон подоконника внутрь (душ)",
    hint: "Откосы появятся отдельными поверхностями при выходе из плана. Если край — запил 45°, плитка стены тоже запиливается на углу.",
    name: "Окно",
  },
  en: {
    ret: "Tiled window returns",
    depth: "Return depth (wall face to frame)",
    parts: "What gets tile",
    p_l: "Left jamb",
    p_r: "Right jamb",
    p_h: "Head",
    p_s: "Sill",
    sill: "Sill made of",
    s_tile: "tile",
    s_stone: "stone / quartz (not tile)",
    edge: "Outer edge of the returns",
    slope: "Sill sloped inward (shower)",
    hint: "Returns become their own surfaces when you leave the plan. With a 45° miter the wall tile is mitered at that corner too.",
    name: "Window",
  },
};
const wnt = (k) => (WNT[lang] || WNT.en)[k] || k;
function winNorm(it) {
  it.ret = Object.assign(
    {
      on: false,
      d: 4.5,
      l: true,
      r: true,
      h: true,
      s: true,
      sill: "tile",
      edge: "sch",
      slope: true,
    },
    it.ret || {},
  );
  return it.ret;
}
function winSheet(it, p) {
  const r = winNorm(it);
  let h = `</div>${CHK(wnt("ret"), p + "ret.on", 1, "p")}<div class="grid2">`;
  if (!r.on) return h;
  h += F(wnt("depth"), p + "ret.d", "len", "p");
  h += SEL(wnt("edge"), p + "ret.edge", EDGE_KINDS, 1, "p", "", (x) =>
    edgeKT(x),
  );
  h += `</div><p class="hsec">${wnt("parts")}</p><div class="grid2">`;
  h += ["l", "r", "h", "s"]
    .map((k) => CHK(wnt("p_" + k), p + "ret." + k, 1, "p"))
    .join("");
  if (r.s) {
    h += SEL(wnt("sill"), p + "ret.sill", ["tile", "stone"], 1, "p", "", (x) =>
      wnt("s_" + x),
    );
    h += CHK(wnt("slope"), p + "ret.slope", 1, "p");
  }
  h += `</div><p class="hint">${wnt("hint")}</p><div class="grid2">`;
  return h;
}
function winBuild(pl, get, fresh) {
  const keep = new Set();
  pl.items
    .filter((it) => it.k === "window")
    .forEach((it) => {
      const r = winNorm(it);
      if (!r.on) return;
      const d = Math.max(0.5, +r.d || 4.5),
        W = +it.w,
        H = +it.h,
        // part: [size w, size h, which edge meets the wall face]
        parts = {
          l: [d, H, "l"],
          r: [d, H, "r"],
          h: [W, d, "b"],
          s: [W, d, "b"],
        };
      Object.keys(parts).forEach((k) => {
        if (!r[k] || (k === "s" && r.sill === "stone")) return;
        const key = `win:${it.id}:${k}`;
        keep.add(key);
        const [s, isNew] = get(key, () => {
          const s2 = newSurface("wall");
          s2.nk = null;
          return s2;
        });
        if (isNew || !s.name || s.name === s.plName)
          s.name =
            s.plName = `${wnt("name")} ${pt("plWall")} ${+it.wall + 1} · ${wnt("p_" + k)}${k === "s" && r.slope ? " ↘" : ""}`;
        s.shape = "rect";
        s.w = Math.round(parts[k][0] * 16) / 16;
        s.h = Math.round(parts[k][1] * 16) / 16;
        s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
        s.openings = (s.openings || []).filter((q) => !q.pl);
        s.trim = { l: false, r: false, t: false, b: false };
        s.trimK = { l: "sch", r: "sch", t: "sch", b: "sch" };
        const e = parts[k][2];
        s.trim[e] = true;
        s.trimK[e] = r.edge;
        if (isNew) fresh.push(s);
      });
    });
  P.surfaces = P.surfaces.filter(
    (s) => !/^win:/.test(s.fromPlan || "") || keep.has(s.fromPlan),
  );
  // the wall around a window with tiled returns: no trim on the opening there (the returns carry it),
  // a mitered return means the wall tile is mitered too
  P.surfaces.forEach((s) => {
    (s.openings || []).forEach((o) => {
      if (!o.pl || o.type !== "window" || !o.pi) return;
      const it = pl.items.find((x) => x.id === o.pi);
      if (!it) return;
      const r = winNorm(it);
      if (r.on) {
        o.trim = false;
        o.miter = r.edge === "miter";
      }
    });
  });
}

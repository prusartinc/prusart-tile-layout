"use strict";
/* ================= tub / acrylic pan rim and bowed walls on the plan =================
   Tub item on the plan: tub or acrylic pan, rim corner radius, how much the
   rim rises at its left and right end (level on the rim, lowest point = 0,
   left / right as you face the tub). The tile areas over it follow:
     back wall  → bottom out of level (tapered first row)
     end walls  → raised by that end's rise; with "tile to the floor past the
                  tub" the end wall becomes a tub end wall: the strip down to
                  the floor and the rounded rim corner are cut.
   Bowed wall: how far the middle of a wall sits off a string pulled corner
   to corner (+ into the room, − a hollow). Drawn on the plan; a bulge cuts
   the floor tile along the curve. */

const TBX = {
  ru: {
    rim: "Борт ванны / поддона",
    what: "Это",
    w_tub: "ванна",
    w_acr: "акриловый поддон",
    rad: "Радиус угла борта",
    rl: "Подъём борта слева",
    rr: "Подъём борта справа",
    rimHint:
      "Положи уровень на борт: самая низкая точка = 0, на сколько выше каждый край. Слева / справа — стоя лицом к ванне. Радиус: приложи угольник к углу борта и замерь, где начинается скругление.",
    dn: "На торцевой стене плитка до пола за ванной (рез по радиусу)",
    bowT: "Неровности стены",
    bow: "Выгнута в середине",
    bowHint:
      "Натяни нитку угол–угол и замерь середину: + стена выпирает в комнату, − яма. Углы не в 90° видны на плане рыжим.",
    bowIn: "пузо",
    bowOut: "яма",
    bowFloor:
      "Пол у этой стены режется по дуге (до {v} в середине). Стену выровнять раствором.",
    bowGap:
      "У этой стены у середины будет щель до {v} — закроет плинтус или выровнять стену.",
  },
  en: {
    rim: "Tub / pan rim",
    what: "This is",
    w_tub: "a tub",
    w_acr: "an acrylic shower pan",
    rad: "Rim corner radius",
    rl: "Rim rise, left end",
    rr: "Rim rise, right end",
    rimHint:
      "Put a level on the rim: lowest point = 0, how much higher each end is. Left / right as you face the tub. Radius: hold a square at the rim corner and measure where the curve starts.",
    dn: "On the end wall, tile down to the floor past the tub (radius cut)",
    bowT: "Wall not straight",
    bow: "Bow at the middle",
    bowHint:
      "Pull a string corner to corner and measure the middle: + the wall bulges into the room, − a hollow. Corners off 90° show in orange on the plan.",
    bowIn: "bulge",
    bowOut: "hollow",
    bowFloor:
      "The floor along this wall is cut on a curve (up to {v} at the middle). Float the wall flat.",
    bowGap:
      "A gap up to {v} at the middle of this wall — the baseboard covers it, or float the wall.",
  },
};
const tbx = (k) => (TBX[lang === "ru" ? "ru" : "en"] || TBX.en)[k] || k;

/* ---------- plan sheet: tub rim fields, wall bow ---------- */
{
  const ps = planSheet;
  planSheet = function () {
    let h = ps.apply(this, arguments);
    const pl = P.plan,
      V = S.plan || {};
    if (!pl || typeof h !== "string") return h;
    try {
      if (V.sel != null) {
        const idx = pl.items.findIndex((x) => x.id === V.sel),
          it = pl.items[idx];
        if (it && it.k === "tub") {
          const p = `plan.items.${idx}.`,
            mark = `<label class="c"><input type="checkbox" data-k="${p}tz" `;
          let b = `<p class="hsec">${tbx("rim")}</p><div class="grid2">${SEL(tbx("what"), p + "acr", ["tub", "acr"], 1, "p", "w2", (o) => tbx("w_" + o))}${F(tbx("rad"), p + "rad", "len", "p")}<span></span>${F(tbx("rl"), p + "rl", "len", "p")}${F(tbx("rr"), p + "rr", "len", "p")}</div><p class="hint">${tbx("rimHint")}</p>`;
          if (h.includes(mark)) h = h.replace(mark, b + mark);
          else h += b;
          // "tile to the floor past the tub" sits with the end-wall tile settings
          if (it.tz && it.tzs && !it.tzsf) {
            const dn = CHK(tbx("dn"), p + "tzdn", 1, "p"),
              tag = `data-k="${p}tzo"`,
              at = h.indexOf(tag),
              end = at < 0 ? -1 : h.indexOf("</label></div>", at);
            h =
              end < 0 ? h + dn : h.slice(0, end + 14) + dn + h.slice(end + 14);
          }
        }
      } else if (V.wsel != null) {
        const i = V.wsel,
          w = pl.walls[i] || {},
          bw = +w.bow || 0,
          mark = `<p class="hsec">${pt("plAddHere")}</p>`;
        let b = `<p class="hsec">${tbx("bowT")}</p><div class="grid2">${F(tbx("bow"), `plan.walls.${i}.bow`, "slen", "p")}</div><p class="hint">${tbx("bowHint")}</p>`;
        if (Math.abs(bw) > 0.01)
          b += `<div class="note">⌒ ${(bw > 0 ? tbx("bowFloor") : tbx("bowGap")).replace("{v}", fmt(Math.abs(bw)))}</div>`;
        h = h.includes(mark) ? h.replace(mark, b + mark) : h + b;
      }
    } catch (e) {
      console.error(e);
    }
    return h;
  };
}
/* acrylic pan: a low rim by default */
document.addEventListener("change", (e) => {
  const k = e.target && e.target.dataset && e.target.dataset.k,
    m = k && /^plan\.items\.(\d+)\.acr$/.exec(k);
  if (!m || !P.plan || !S.plan) return;
  const it = P.plan.items[+m[1]];
  if (!it) return;
  if (it.acr === "acr" && (+it.h || 0) >= 14) it.h = 6;
  if (it.acr === "tub" && (+it.h || 0) < 14) it.h = PL_KINDS.tub.h;
  if (it.rad == null) it.rad = it.acr === "acr" ? 1 : 1.5;
  saveSoon();
  renderPlan();
});

/* ---------- surfaces over a tub follow its rim ---------- */
function tubRimPost() {
  const pl = P.plan;
  if (!pl) return;
  const pts = planPts(),
    zones = planZones(pts);
  zones.forEach((z) => {
    const key = `z${z.wall}:${z.ids.slice().sort().join("+")}`,
      s = P.surfaces.find((x) => x.fromPlan === key);
    if (!s) return;
    const it = pl.items.find((x) => z.ids.includes(x.id) && x.k === "tub");
    const was = !!s.rimPl;
    if (!it) {
      if (was) {
        s.uneven.on = false;
        s.tub.on = false;
        delete s.rimPl;
      }
      return;
    }
    const rl = Math.max(0, +it.rl || 0),
      rr = Math.max(0, +it.rr || 0),
      W = planWall(+it.wall, pts),
      e = planItemX(it, W),
      rise = (x) =>
        e[1] - e[0] > 0.5 ? rl + ((rr - rl) * (x - e[0])) / (e[1] - e[0]) : rl;
    s.uneven = s.uneven || { on: false, l: 0, r: 0, m: 0, mOn: false };
    s.tub = s.tub || {
      on: false,
      side: "r",
      d: 30,
      h: 15,
      r: 1.5,
      rF: 0,
      rB: 0,
    };
    if (z.wall === +it.wall) {
      // back wall: the first row follows the rim
      const l = Math.max(0, rise(z.x0)),
        r = Math.max(0, rise(z.x1));
      if (l > 0.01 || r > 0.01) {
        Object.assign(s.uneven, { on: true, l, r, m: 0, mOn: false });
        s.tub.on = false;
        s.rimPl = 1;
      } else if (was) {
        s.uneven.on = false;
        delete s.rimPl;
      }
      return;
    }
    // an end wall: which end of the tub is at it
    const Wj = planWall(z.wall, pts),
      PL = plAt(W, W.cx(e[0]), 0),
      PR = plAt(W, W.cx(e[1]), 0),
      dist = (q) =>
        Math.abs((q[0] - Wj.a[0]) * Wj.nin[0] + (q[1] - Wj.a[1]) * Wj.nin[1]),
      r0 = dist(PL) <= dist(PR) ? rl : rr;
    if (it.tzdn && it.tzs && !it.tzsf) {
      // tile down to the floor past the tub: a tub end wall, strip + radius cut
      const Fp = planFoot(it, pts),
        xs = Fp.map((q) =>
          Wj.cx((q[0] - Wj.a[0]) * Wj.u[0] + (q[1] - Wj.a[1]) * Wj.u[1]),
        ),
        t0 = Math.max(z.x0, Math.min(...xs)),
        t1 = Math.min(z.x1, Math.max(...xs)),
        side = t0 <= z.x0 + 0.5 ? "l" : "r";
      s.h = Math.round(z.z1 * 16) / 16;
      s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
      s.plOrg = [z.x0, 0];
      s.openings = s.openings.filter((o) => !o.pl);
      planWallOps(z.wall, pts, z.x0, 0, s);
      Object.assign(s.tub, {
        on: true,
        side,
        d: Math.round((t1 - t0) * 16) / 16,
        h: Math.round(z.z0 * 16) / 16,
        r: Math.max(0, +it.rad || 0),
        rF: r0,
        rB: r0,
      });
      s.uneven.on = false;
      s.rimPl = 1;
      return;
    }
    s.tub.on = false;
    if (r0 > 0.01) {
      Object.assign(s.uneven, { on: true, l: r0, r: r0, m: 0, mOn: false });
      s.rimPl = 1;
    } else if (was) {
      s.uneven.on = false;
      delete s.rimPl;
    }
  });
}

/* ---------- a bulging wall cuts the floor along the curve ---------- */
const BOW_N = 10;
function bowPts(W, bow) {
  // from a to b, the middle pushed into the room by "bow" (a parabola)
  const out = [];
  for (let k = 0; k <= BOW_N; k++) {
    const t2 = k / BOW_N,
      off = 4 * bow * t2 * (1 - t2);
    out.push([
      W.a[0] + W.u[0] * W.L * t2 + W.nin[0] * off,
      W.a[1] + W.u[1] * W.L * t2 + W.nin[1] * off,
    ]);
  }
  return out;
}
function bowFloorPost() {
  const pl = P.plan,
    f = P.surfaces.find((x) => x.fromPlan === "floor");
  if (!pl || !f) return;
  f.openings = f.openings.filter((o) => !o.bowPl);
  const pts = planPts();
  pl.walls.forEach((w, i) => {
    const bw = +((w || {}).bow || 0);
    if (bw <= 0.05) return;
    const W = planWall(i, pts),
      arc = bowPts(W, bw),
      q = bboxOf(arc);
    f.openings.push({
      id: uid(),
      pl: 1,
      bowPl: 1,
      type: "cutout",
      shape: "rect",
      trim: false,
      x: q.x0,
      y: q.y0,
      w: q.x1 - q.x0,
      h: q.y1 - q.y0,
      pts: arc.map((v) => [v[0], v[1]]),
    });
  });
}
{
  const pb = planBuild;
  planBuild = function () {
    const r = pb.apply(this, arguments);
    try {
      withFin(tubRimPost, this, []);
      bowFloorPost();
    } catch (e) {
      console.error(e);
    }
    return r;
  };
}

/* ---------- the plan: bowed walls drawn as a curve ---------- */
{
  const pd = planDraw;
  planDraw = function () {
    const r = pd.apply(this, arguments);
    try {
      const pl = P.plan,
        V = S.plan;
      if (!pl || !V || V.v !== "top") return r;
      const svg = document.querySelector("#plsvg svg");
      if (!svg) return r;
      const pts = planPts(),
        NS = "http://www.w3.org/2000/svg",
        c0 = svg.querySelector("circle[data-pw]"),
        k = c0 ? +c0.getAttribute("r") / 7 : 1;
      pl.walls.forEach((w, i) => {
        const bw = +((w || {}).bow || 0);
        if (Math.abs(bw) < 0.01) return;
        const W = planWall(i, pts),
          // drawn bigger than life so it can be seen; the label has the real number
          vis = Math.sign(bw) * Math.max(Math.abs(bw) * 4, 6 * k),
          A = bowPts(W, vis).map((q) => [q[0], -q[1]]),
          p = document.createElementNS(NS, "path");
        p.setAttribute(
          "d",
          "M" + A.map((q) => q[0].toFixed(2) + " " + q[1].toFixed(2)).join("L"),
        );
        p.setAttribute("fill", "none");
        p.setAttribute("stroke", "#b4441b");
        p.setAttribute("stroke-width", 1.6 * k);
        p.setAttribute("stroke-dasharray", `${4 * k} ${3 * k}`);
        p.setAttribute("pointer-events", "none");
        svg.appendChild(p);
        const m = A[BOW_N / 2],
          t = document.createElementNS(NS, "text");
        t.setAttribute("x", m[0] + W.nin[0] * 10 * k);
        t.setAttribute("y", m[1] - W.nin[1] * 10 * k);
        t.setAttribute("text-anchor", "middle");
        t.setAttribute("dominant-baseline", "middle");
        t.setAttribute("font-size", 8.5 * k);
        t.setAttribute("font-weight", "800");
        t.setAttribute(
          "font-family",
          typeof FONT === "string" ? FONT : "sans-serif",
        );
        t.setAttribute("fill", "#b4441b");
        t.setAttribute("paint-order", "stroke");
        t.setAttribute("stroke", "#fbfaf7");
        t.setAttribute("stroke-width", 2.5 * k);
        t.setAttribute("pointer-events", "none");
        t.textContent = `⌒ ${bw > 0 ? "+" : "−"}${fmtIn(Math.abs(bw))}″`;
        svg.appendChild(t);
      });
    } catch (e) {
      console.error(e);
    }
    return r;
  };
}

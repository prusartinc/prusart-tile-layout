"use strict";
/* ================= materials ================= */
function defMat() {
  return {
    covS: 95,
    covM: 70,
    covL: 45,
    bb: 1.2,
    groutBag: 25,
    dens: 0.065,
    wp: "kerdi",
    roll: 54,
    band: 33,
    liq: 55,
    board: true,
    boardSf: 15,
    ditra: true,
    ditraSf: 54,
    clips: true,
    silLf: 24,
  };
}
function matSettingsHTML() {
  return `<details data-sec="matset" ${S.open.has("matset") ? "open" : ""} style="margin-top:10px"><summary>${t("matSettings")}</summary><div class="bd"><div class="grid">${SEL(t("wpSys"), "mat.wp", ["kerdi", "liquid", "none"], 1, "p", "w2", (o) => t("w" + o))}
 ${F(t("covS"), "mat.covS", "num", "p")}${F(t("covM"), "mat.covM", "num", "p")}${F(t("covL"), "mat.covL", "num", "p")}${F(t("groutBagLb"), "mat.groutBag", "num", "p")}${F(t("membRoll"), "mat.roll", "num", "p")}${F(t("liqSf"), "mat.liq", "num", "p")}${F(t("ditraRoll"), "mat.ditraSf", "num", "p")}${F(t("silLf"), "mat.silLf", "num", "p")}</div>
 ${CHK(t("clipsOn"), "mat.clips", 0, "p")}</div></details>`;
}
function jointPerArea(T) {
  const s = T.shape;
  if (s === "hex") {
    const sd = +T.w / Math.sqrt(3);
    return 2 / (Math.sqrt(3) * sd);
  }
  if (s === "penny") return 2.8 / +T.w;
  if (patOf(T) === "pinwheel") {
    const a = +T.w,
      b = +T.w2;
    return (2 * a + 2 * b) / (a * a + b * b);
  }
  const L = +T.w,
    W = +T.h || +T.w;
  return (L + W) / (L * W);
}
function trowelOf(T) {
  const mx =
    T.sheet && T.sheet.on
      ? Math.max(+T.w, +T.h || +T.w)
      : T.shape === "hex"
        ? +T.w * 1.15
        : Math.max(+T.w, +T.h || +T.w, +T.w2 || 0);
  return mx <= 8 ? "s" : mx <= 16 ? "m" : "l";
}
function materials() {
  const m = P.mat,
    rows = [];
  const thin = { s: 0, m: 0, l: 0 };
  let grout = 0,
    wetSf = 0,
    clips = 0,
    valves = 0,
    pipes = 0,
    niches = 0,
    band = 0,
    sil = 0,
    curbs = 0;
  const wetWalls = P.surfaces.filter((s) => s.type === "wall" && s.wet);
  for (const s of P.surfaces) {
    const R = compute(s),
      T = R.T,
      sf = R.area / 144,
      tr = trowelOf(T);
    thin[tr] += sf * (tr === "l" ? m.bb : 1);
    grout += sf * 144 * jointPerArea(T) * (+T.g || 0.125) * (+T.thick || 0.375) * m.dens * 1.1;
    if (s.wet) wetSf += sf;
    if (m.clips && T.shape === "rect" && !(T.sheet && T.sheet.on) && Math.max(+T.w, +T.h) >= 12)
      clips += R.need * 2;
    s.openings.forEach((o) => {
      if (o.type === "valve") valves++;
      if (o.type === "pipe") pipes++;
      if (o.type === "niche" && s.wet) {
        niches++;
        band += 4 * (o.w + o.h);
      }
    });
    if (s.type === "pan" && s.wet) {
      band += s.w + 2 * s.h;
      if (s.curb.on) {
        band += 2 * s.curb.len;
        curbs++;
      }
    }
  }
  const H = wetWalls.length ? Math.max(...wetWalls.map((w) => bboxOf(outerPoly(w)).y1)) : 0;
  if (wetWalls.length > 1) {
    band += (wetWalls.length - 1) * H;
    sil += (wetWalls.length - 1) * H;
  }
  sil += wetWalls.reduce((a, w) => a + wallW(w), 0);
  const bagsOf = (sf, cov) => Math.ceil((sf / cov) * 1.05);
  const tn = { s: "1/4×1/4", m: "1/4×3/8", l: "1/2×1/2" },
    cov = { s: m.covS, m: m.covM, l: m.covL };
  const und = {},
    heats = [];
  P.surfaces.forEach((s2) => {
    const st = stackOf(s2),
      sf2 = compute(s2).area / 144;
    [st.u, st.u2].forEach((u) => {
      if (u.k !== "none") und[u.id] = (und[u.id] || 0) + sf2;
    });
    if (s2.heat && s2.heat.on) {
      const R2 = compute(s2);
      if (R2.heat) heats.push({ s: s2, h: R2.heat });
    }
  });
  let memSf =
    (m.wp === "kerdi" ? wetSf : 0) +
    Object.keys(und)
      .filter((id) => ["mem", "heat", "board"].includes(underOf(id).k))
      .reduce((a, id) => a + und[id], 0);
  for (const k of ["s", "m", "l"])
    if (thin[k] > 0.5)
      rows.push([
        t("thinset"),
        `${bagsOf(thin[k], cov[k])} ${t("bags")}`,
        `${t("trowel")} ${tn[k]} · ${thin[k].toFixed(0)} sf${k === "l" ? " · back-butter" : ""}`,
      ]);
  if (memSf > 0.5) rows.push([t("thinset"), `${bagsOf(memSf, m.covS)} ${t("bags")}`, t("under")]);
  if (grout > 0)
    rows.push([
      t("groutM"),
      `${Math.ceil(grout)} ${t("lb")} → ${Math.ceil(grout / (+m.groutBag || 25))} × ${m.groutBag} ${t("lb")}`,
      t("groutNote"),
    ]);
  if (m.wp === "kerdi" && wetSf > 0) {
    rows.push([
      t("membrane"),
      `${Math.ceil((wetSf * 1.15) / m.roll)} × ${m.roll} sf`,
      `${wetSf.toFixed(0)} sf ${t("wetArea")}`,
    ]);
    rows.push([
      t("band"),
      `${Math.ceil(band / 12)} ft → ${Math.ceil(((band / 12) * 1.1) / m.band)} × ${m.band} ft`,
      t("bandNote"),
    ]);
    const ic = Math.max(0, wetWalls.length - 1) * 2 + niches * 4,
      oc = niches * 4 + curbs * 2;
    if (ic) rows.push([t("inCorners"), String(ic), ""]);
    if (oc) rows.push([t("outCorners"), String(oc), ""]);
    if (valves || pipes)
      rows.push([
        t("seals"),
        `${valves + pipes}`,
        `${valves ? valves + " valve" : ""}${valves && pipes ? " + " : ""}${pipes ? pipes + " pipe" : ""}`,
      ]);
  }
  if (m.wp === "liquid" && wetSf > 0)
    rows.push([
      t("liquidGal"),
      `${Math.ceil((wetSf * 1.1) / m.liq)}`,
      `${wetSf.toFixed(0)} sf ${t("wetArea")} · ${t("bandNote2")}`,
    ]);
  const bcnt = {};
  P.surfaces.forEach((s2) => {
    const bo = boardOf(s2);
    if (!bo) return;
    const pp = prepPlan(s2, compute(s2), bo);
    if (!pp) return;
    const k = bo.id + "|" + pp.bs;
    bcnt[k] = bcnt[k] || { u: bo, bs: pp.bs, n: 0, sf: 0 };
    bcnt[k].n += pp.sheets.length;
    bcnt[k].sf += compute(s2).area / 144;
  });
  Object.values(bcnt).forEach((c) =>
    rows.push([c.u.n, `${c.n} × ${c.bs.replace("x", "×")}`, `${c.sf.toFixed(0)} sf · ${t("bySheetLayout")}`]),
  );
  Object.keys(und).forEach((id) => {
    const u = underOf(id),
      sf2 = und[id];
    if (Object.values(bcnt).some((c) => c.u.id === id)) return;
    const us = (u.u || []).filter((q) => q[0] > 0);
    if (!us.length) {
      rows.push([u.n, `${sf2.toFixed(0)} sf`, ""]);
      return;
    }
    const big = us[0],
      small = us[us.length - 1];
    let q;
    if (us.length > 1 && sf2 * 1.1 < big[0] * 0.6) q = `${Math.ceil((sf2 * 1.1) / small[0])} × ${small[1]}`;
    else q = `${Math.ceil((sf2 * 1.1) / big[0])} × ${big[1]}`;
    rows.push([u.n, q, `${sf2.toFixed(0)} sf${u.chk ? " · " + t("chkSpec") : ""}`]);
  });
  heats.forEach(({ s: s2, h: hp }) => {
    hp.cables.forEach((c, i) =>
      rows.push([
        `${t("heatCable")} — ${s2.name}${hp.cables.length > 1 ? " #" + (i + 1) : ""}`,
        `≤ ${c.cableSf} sf`,
        `${t("hs_" + s2.heat.sys)} · ${hp.volt}V · ${((c.cableSf * hp.wsf) / hp.volt).toFixed(1)} A · ≈${Math.round(c.lenFt)} ft`,
      ]),
    );
    rows.push([`${t("thermostat")} — ${s2.name}`, "1", t("thermoNote")]);
  });
  if (clips) rows.push([t("clipsN"), `≈ ${Math.ceil(clips / 100) * 100}`, t("clipsNote")]);
  if (sil > 0)
    rows.push([
      t("silicone"),
      `${Math.ceil(sil / 12 / (+m.silLf || 24))}`,
      `${(sil / 12).toFixed(0)} ft ${t("silNote")}`,
    ]);
  const pf = {};
  P.surfaces.forEach((s2) => {
    const R2 = compute(s2);
    for (const k in R2.profs) pf[k] = (pf[k] || 0) + R2.profs[k];
  });
  Object.keys(pf).forEach((k) =>
    rows.push(["Schluter " + k, `${Math.ceil(pf[k] / 98.5)} × 8′2½″`, `${(pf[k] / 12).toFixed(1)} ft`]),
  );
  return rows;
}
function renderMat() {
  const el = $("#mat");
  if (!el) return;
  const rows = materials();
  el.innerHTML = `<table><tr><th>${t("matItem")}</th><th class="n">${t("matQty")}</th></tr>${rows.map((r) => `<tr><td>${esc(r[0])}${r[2] ? `<br><small style="color:var(--mut)">${esc(r[2])}</small>` : ""}</td><td class="n"><b>${esc(r[1])}</b></td></tr>`).join("")}</table><p class="hint">${t("matNoteAll")}</p>`;
}

/* ================= cut sheet modal ================= */
function cutSheetModal() {
  if (!R) return;
  const s = cur();
  const g = cutSheet(R);
  let h = `<h3>${t("cutSheet")} — ${esc(s.name)}</h3><p class="hint">${esc(tileDesc(R.T))} · ${t("grout")} ${fmt(+R.T.g)} · ${t("gapNote")} (${fmt(+P.edgeGap)})</p>`;
  h += g
    .map(
      (gr) =>
        `<p style="margin:12px 0 4px"><b>${esc(gr.label)}</b>${gr.full ? ` · ${t("fullN")}: ${gr.full}` : ""}</p><table>${gr.items.map((p) => `<tr><td style="width:44px;color:#b4441b;font-weight:800">#${p.no}</td><td><span class="sw" style="background:${COL[p.c]}"></span><b>${esc(pieceSize(p))}</b></td><td style="color:var(--mut)">${esc(pieceNote(p))}</td></tr>`).join("")}</table>`,
    )
    .join("");
  if (R.drill.length)
    h +=
      `<p style="margin:12px 0 4px"><b>${t("drill")}</b></p>` +
      R.drill
        .map(
          (d) =>
            `<div class="dl">${d.p && d.p.no ? "#" + d.p.no + " — " : d.p ? t("fullTile") + " — " : ""}${drillTxt(d)}</div>`,
        )
        .join("");
  h += `<div class="btns">${S.nums ? "" : `<button class="btn p" data-act="nums">${t("showNums")}</button>`}<button class="btn" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
}

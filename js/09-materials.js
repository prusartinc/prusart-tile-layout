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
    grout +=
      sf *
      144 *
      jointPerArea(T) *
      (+T.g || 0.125) *
      (+T.thick || 0.375) *
      m.dens *
      1.1;
    if (s.wet) wetSf += sf;
    if (
      m.clips &&
      T.shape === "rect" &&
      !(T.sheet && T.sheet.on) &&
      Math.max(+T.w, +T.h) >= 12
    )
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
  const nItems = {};
  P.surfaces.forEach((s2) =>
    (compute(s2).nicheItems || []).forEach((it) => {
      const k = t(it.k) + "|" + it.note;
      nItems[k] = (nItems[k] || 0) + it.n;
    }),
  );
  const H = wetWalls.length
    ? Math.max(...wetWalls.map((w) => bboxOf(outerPoly(w)).y1))
    : 0;
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
  if (memSf > 0.5)
    rows.push([
      t("thinset"),
      `${bagsOf(memSf, m.covS)} ${t("bags")}`,
      t("under"),
    ]);
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
    rows.push([
      c.u.n,
      `${c.n} × ${c.bs.replace("x", "×")}`,
      `${c.sf.toFixed(0)} sf · ${t("bySheetLayout")}`,
    ]),
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
    if (us.length > 1 && sf2 * 1.1 < big[0] * 0.6)
      q = `${Math.ceil((sf2 * 1.1) / small[0])} × ${small[1]}`;
    else q = `${Math.ceil((sf2 * 1.1) / big[0])} × ${big[1]}`;
    rows.push([
      u.n,
      q,
      `${sf2.toFixed(0)} sf${u.chk ? " · " + t("chkSpec") : ""}`,
    ]);
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
  if (clips)
    rows.push([
      t("clipsN"),
      `≈ ${Math.ceil(clips / 100) * 100}`,
      t("clipsNote"),
    ]);
  if (sil > 0)
    rows.push([
      t("silicone"),
      `${Math.ceil(sil / 12 / (+m.silLf || 24))}`,
      `${(sil / 12).toFixed(0)} ft ${t("silNote")}`,
    ]);
  const pf = {};
  P.surfaces.forEach((s2) => {
    const R2 = compute(s2);
    for (const k in R2.profs || {}) pf[k] = (pf[k] || 0) + R2.profs[k];
  });
  Object.keys(pf).forEach((k) =>
    rows.push([
      "Schluter " + k,
      `${Math.ceil(pf[k] / 98.5)} × 8′2½″`,
      `${(pf[k] / 12).toFixed(1)} ft`,
    ]),
  );
  // pencil liner, bullnose and miter edges (pony walls, half walls, window returns…)
  {
    const E = { pencil: 0, bull: 0, miter: 0 };
    P.surfaces.forEach((s2) => {
      const R2 = compute(s2);
      if (R2.edgeLF) for (const k in E) E[k] += R2.edgeLF[k] || 0;
    });
    const len = +P.pencilLen || 12;
    if (E.pencil > 0)
      rows.push([
        edgeKT("mPencil"),
        `${Math.ceil((E.pencil / len) * 1.1)} ${edgeKT("pcs")} × ${fmtIn(len)}″`,
        `${(E.pencil / 12).toFixed(1)} ft`,
      ]);
    if (E.bull > 0)
      rows.push([edgeKT("mBull"), `${(E.bull / 12).toFixed(1)} ft`, `+10%`]);
    if (E.miter > 0)
      rows.push([edgeKT("mMiter"), `${(E.miter / 12).toFixed(1)} ft`, ""]);
  }
  // kitchen / backsplash extras
  {
    const bsw = P.surfaces.filter((x) => x.bs && x.bs.on);
    if (bsw.length) {
      let lf = 0;
      bsw.forEach((x) =>
        x.bs.segs.forEach((q) => q.k !== "skip" && (lf += +q.len || 0)),
      );
      lf += Math.max(0, bsw.length - 1) * 18;
      rows.push([
        t("mCaulkCounter"),
        `${Math.ceil(lf / 12)} lf`,
        `≈${Math.max(1, Math.ceil(lf / 12 / 50))} × 10 oz`,
      ]);
    }
    let rings = 0,
      shelves = 0,
      ins = 0,
      insCut = 0,
      stoneSf = 0;
    P.surfaces.forEach((x) => {
      if (x.type === "wall")
        rings += x.openings.filter((o) => o.type === "outlet").length;
      shelves += x.openings.filter((o) => o.type === "shelf").length;
      const R2 = compute(x);
      if (R2.insN) {
        ins += R2.insN;
        insCut += R2.insCut || 0;
      }
      if (x.tile.stone) stoneSf += R2.area / 144;
    });
    if (rings)
      rows.push([
        t("mRings"),
        `${rings} ${t("pcs")}`,
        ringHint(P.surfaces.find((x) => x.type === "wall") || P.surfaces[0]),
      ]);
    if (ins)
      rows.push([
        t("mInserts"),
        `${Math.ceil(ins * (1 + (P.waste || 10) / 100))} ${t("pcs")}`,
        `${insCut} ${t("mInsCut")}`,
      ]);
    if (shelves)
      rows.push([t("mBlocking"), `${shelves} ${t("pcs")}`, t("mBlockingNote")]);
    if (stoneSf > 0) {
      rows.push([
        t("mSealer"),
        `${Math.max(1, Math.ceil(stoneSf / 80))} qt`,
        t("mSealerNote"),
      ]);
      rows.push([t("mWhite"), "✓", ""]);
    }
  }
  Object.keys(nItems).forEach((k) => {
    const [name, note] = k.split("|");
    rows.push([name, `${nItems[k]} ${t("pcs")}`, note]);
  });
  return rows;
}
/* materials grouped by supplier: each line remembers where it is bought (shared by all projects) */
const supKey = (name) =>
  String(name)
    .replace(/\s+\d.*$/, "")
    .trim()
    .toLowerCase();
function supOf(name) {
  DB.sup = DB.sup || {};
  return DB.sup[supKey(name)] || "";
}
function renderMat() {
  const el = $("#mat");
  if (!el) return;
  const rows = materials(),
    ru = lang === "ru",
    none = ru ? "Поставщик не указан" : "No supplier set";
  DB.sup = DB.sup || {};
  const known = [...new Set(Object.values(DB.sup).filter(Boolean))].sort();
  const groups = {};
  rows.forEach((r, i) => {
    const g = supOf(r[0]) || none;
    (groups[g] = groups[g] || []).push([r, i]);
  });
  const order = Object.keys(groups).sort((a, b) =>
    a === none ? 1 : b === none ? -1 : a.localeCompare(b),
  );
  let h = `<datalist id="supl">${known.map((k) => `<option value="${esc(k)}">`).join("")}</datalist>`;
  order.forEach((g) => {
    h += `<p class="hsec" style="margin-top:10px">🏬 ${esc(g)}</p><table><tr><th>${t("matItem")}</th><th class="n">${t("matQty")}</th></tr>${groups[
      g
    ]
      .map(
        ([r, i]) =>
          `<tr><td>${esc(r[0])}${r[2] ? `<br><small style="color:var(--mut)">${esc(r[2])}</small>` : ""}<br><input class="supin" list="supl" data-sup="${esc(r[0])}" value="${esc(supOf(r[0]))}" placeholder="${ru ? "где купить…" : "supplier…"}" autocomplete="off"></td><td class="n"><b>${esc(r[1])}</b></td></tr>`,
      )
      .join("")}</table>`;
  });
  h += `<div class="btns"><button class="btn" data-act="matCopy">📋 ${ru ? "Скопировать заказ по поставщикам" : "Copy order by supplier"}</button></div><p class="hint">${t("matNoteAll")}</p>`;
  el.innerHTML = h;
}
document.addEventListener("change", (e) => {
  const el = e.target;
  if (!el.dataset || el.dataset.sup == null) return;
  DB.sup = DB.sup || {};
  const v = el.value.trim();
  if (v) DB.sup[supKey(el.dataset.sup)] = v;
  else delete DB.sup[supKey(el.dataset.sup)];
  saveSoon();
  renderMat();
});
function matCopy() {
  const rows = materials(),
    ru = lang === "ru",
    none = ru ? "Поставщик не указан" : "No supplier set",
    groups = {};
  rows.forEach((r) => {
    const g = supOf(r[0]) || none;
    (groups[g] = groups[g] || []).push(r);
  });
  const txt =
    `${P.name || ""}${P.addr ? " — " + P.addr : ""}\n\n` +
    Object.keys(groups)
      .map(
        (g) =>
          `${g}:\n` + groups[g].map((r) => `• ${r[0]} — ${r[1]}`).join("\n"),
      )
      .join("\n\n");
  const done = () => toast(ru ? "Заказ скопирован" : "Order copied", false);
  try {
    navigator.clipboard.writeText(txt).then(done, () => {
      modal(
        `<h3>${ru ? "Заказ" : "Order"}</h3><textarea style="width:100%;height:50vh">${esc(txt)}</textarea><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
      );
    });
  } catch (e) {
    modal(
      `<h3>${ru ? "Заказ" : "Order"}</h3><textarea style="width:100%;height:50vh">${esc(txt)}</textarea><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
    );
  }
}

/* ================= cut sheet modal ================= */
/* offcuts: a straight strip left from one cut can become another cut piece.
   Only clean one-way cuts are paired (the strip keeps one factory edge for the joint side). */
function offcutPlan(R) {
  const kerf = 0.125,
    one = (p) =>
      p.k === "r" &&
      !p.full &&
      !p.notch &&
      !p.taper &&
      !p.taperW &&
      !p.hl &&
      !p.niche &&
      p.cutX !== p.cutY;
  const cuts = R.all.filter(one);
  // leftovers: what is left of the tile beside each cut piece
  const left = cuts.map((p) => ({
    from: p,
    w: p.cutX ? p.lw - p.cw - kerf : p.lw,
    h: p.cutY ? p.lh - p.ch - kerf : p.lh,
  }));
  const used = new Map(), // receiver -> source
    srcUsed = new Set(), // pieces whose leftover is taken: they come from a whole tile
    pairs = [];
  // biggest needs first, smallest leftover that fits
  [...cuts]
    .sort((a, b) => b.cw * b.ch - a.cw * a.ch)
    .forEach((q) => {
      if (used.has(q) || srcUsed.has(q)) return;
      let best = null;
      left.forEach((L) => {
        // a source must itself be cut from a whole tile
        if (L.from === q || used.has(L.from)) return;
        const fits =
          (L.w + 1e-6 >= q.cw && L.h + 1e-6 >= q.ch) ||
          (L.h + 1e-6 >= q.cw && L.w + 1e-6 >= q.ch && q.cw === q.ch);
        if (
          fits &&
          L.w > 0.5 &&
          L.h > 0.5 &&
          (!best || L.w * L.h < best.w * best.h)
        )
          best = L;
      });
      if (!best) return;
      pairs.push({ q, from: best.from, rest: [best.w, best.h] });
      used.set(q, best.from);
      srcUsed.add(best.from);
      // the rest of that strip stays available
      if (best.w >= best.h) best.w -= q.cw + kerf;
      else best.h -= q.ch + kerf;
    });
  return pairs;
}
function cutSheetModal() {
  if (!R) return;
  const s = cur(),
    T = R.T,
    ru = lang === "ru";
  s.cutDone = s.cutDone || {};
  const g = cutSheet(R),
    pairs = offcutPlan(R),
    fromOf = new Map(pairs.map((x) => [x.q, x.from]));
  const all = g.reduce((a, gr) => a.concat(gr.items), []),
    done = all.filter((p) => s.cutDone[decoKey(p, T)]).length;
  let h = `<h3>✂ ${t("cutSheet")} — ${esc(s.name)}</h3><p class="hint">${esc(tileDesc(T))} · ${t("grout")} ${fmt(+T.g)} · ${t("gapNote")} (${fmt(+P.edgeGap)})</p>`;
  h += `<div class="cutprog"><b>${ru ? "Нарезано" : "Cut"} ${done} ${ru ? "из" : "of"} ${all.length}</b><span style="width:${all.length ? (100 * done) / all.length : 0}%"></span></div>`;
  if (pairs.length)
    h += `<p class="hint">♻ ${ru ? `${pairs.length} шт. режь из обрезков других кусков (отмечено ♻ ниже) — «Плиток нужно» уже это учитывает.` : `Cut ${pairs.length} pieces from other pieces' offcuts (marked ♻ below) — "Tiles needed" already counts on it.`}</p>`;
  h += g
    .map(
      (gr) =>
        `<p style="margin:12px 0 4px"><b>${esc(gr.label)}</b>${gr.full ? ` · ${t("fullN")}: ${gr.full}` : ""}</p><div class="cutl">${gr.items
          .map((p) => {
            const k = decoKey(p, T),
              ok = !!s.cutDone[k],
              fr = fromOf.get(p);
            return `<div class="cutr ${ok ? "ok" : ""}"><button class="cutck" data-act="cutDone:${k}" aria-label="done">${ok ? "✓" : ""}</button><button class="cutb" data-act="cutCard:${p.no}"><b class="no">#${p.no}</b> <span class="sw" style="background:${COL[p.c]}"></span><b>${esc(pieceSize(p))}</b> <span class="nt">${esc(pieceNote(p))}${fr ? ` · ♻ ${ru ? "из остатка" : "from offcut of"} #${fr.no}` : ""}</span></button></div>`;
          })
          .join("")}</div>`,
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
  h += `<div class="btns">${S.nums ? "" : `<button class="btn p" data-act="nums">${t("showNums")}</button>`}${done ? `<button class="btn" data-act="cutReset">${ru ? "Снять отметки" : "Clear marks"}</button>` : ""}<button class="btn" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
}
function cutAct(a, arg) {
  const s = cur();
  if (!s || !R) return;
  if (a === "cutDone") {
    s.cutDone = s.cutDone || {};
    if (s.cutDone[arg]) delete s.cutDone[arg];
    else s.cutDone[arg] = 1;
    saveSoon();
    drawSoon();
    const y = $("#mbody") ? $("#mbody").scrollTop : 0;
    cutSheetModal();
    if ($("#mbody")) $("#mbody").scrollTop = y;
  }
  if (a === "cutReset") {
    s.cutDone = {};
    saveSoon();
    drawSoon();
    cutSheetModal();
  }
  if (a === "cutCard") {
    const p = R.all.find((x) => String(x.no) === String(arg));
    if (p) pieceCard({ s }, p);
  }
}

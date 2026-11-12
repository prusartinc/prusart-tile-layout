"use strict";
/* ================= heating ================= */
function segDist(px, py, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    L2 = dx * dx + dy * dy;
  let u = L2 ? ((px - a[0]) * dx + (py - a[1]) * dy) / L2 : 0;
  u = Math.max(0, Math.min(1, u));
  return Math.hypot(px - a[0] - u * dx, py - a[1] - u * dy);
}
function snapWall(O, p) {
  return snapWallE(O, p).p;
}
function snapWallE(O, p) {
  let best = p,
    bd = 1e9,
    be = 0;
  for (let i = 0; i < O.length; i++) {
    const a = O[i],
      b = O[(i + 1) % O.length],
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      L2 = dx * dx + dy * dy;
    let u = L2 ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2 : 0;
    u = Math.max(0, Math.min(1, u));
    const q = [a[0] + u * dx, a[1] + u * dy],
      d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (d < bd) {
      bd = d;
      best = q;
      be = i;
    }
  }
  return { p: [Math.round(best[0] * 8) / 8, Math.round(best[1] * 8) / 8], e: be };
}
const HEATCOL = ["#d6331f", "#e07b00", "#7b3fb3", "#1f8a70"];
function heatPlan(s, R) {
  const H = s.heat;
  if (!H || !H.on) return null;
  const G = R.G,
    O = G.outer,
    bb = G.bb,
    W = bb.x1 - bb.x0,
    Hh = bb.y1 - bb.y0,
    res = Math.max(W, Hh) > 160 ? 2 : 1,
    clear = +H.clear || 0;
  const tz = s.openings.filter((o) => o.type === "toilet").map((o) => toiletZone(s, o));
  const obs = s.openings.filter((o) => o.type !== "warm" && o.type !== "toilet").map((o) => ({ o, m: 2 })),
    warm = s.openings.filter((o) => o.type === "warm");
  // A cable can't jump across a toilet (the zone reaches the wall): keep the longer side only.
  const inToilet = (x, y) =>
    tz.some((z) => {
      const [u, v] = z.loc(x, y);
      return u > -z.back - 2 && u < z.front + 1 && Math.abs(v) < z.half + 2;
    });
  const splitAtToilet = (iv, P) => {
    if (iv.length < 2 || !tz.length) return;
    const groups = [[iv[0]]];
    for (let k = 1; k < iv.length; k++) {
      const m = (iv[k - 1][1] + iv[k][0]) / 2;
      if (inToilet(...P(m))) groups.push([iv[k]]);
      else groups[groups.length - 1].push(iv[k]);
    }
    if (groups.length < 2) return;
    const len = (g) => g.reduce((q, r) => q + r[1] - r[0], 0),
      best = groups.reduce((a, b) => (len(b) > len(a) ? b : a));
    iv.splice(0, iv.length, ...best);
  };
  const ok = (x, y) => {
    if (!pip(O, x, y)) return false;
    for (let i = 0; i < O.length; i++) if (segDist(x, y, O[i], O[(i + 1) % O.length]) < clear) return false;
    if (inToilet(x, y)) return false;
    for (const { o, m } of obs) {
      if (o.shape === "circle") {
        if (Math.hypot(x - o.x, y - o.y) < o.dia / 2 + m) return false;
      } else if (x > o.x - m && x < o.x + o.w + m && y > o.y - m && y < o.y + o.h + m) return false;
    }
    if (s.type === "pan" && s.drain.type === "center" && Math.hypot(x - s.drain.x, y - s.drain.y) < 4)
      return false;
    return true;
  };
  let cells = 0;
  for (let x = bb.x0 + res / 2; x < bb.x1; x += res)
    for (let y = bb.y0 + res / 2; y < bb.y1; y += res) if (ok(x, y)) cells++;
  const sf = (cells * res * res) / 144;
  const sys = HEATSYS[H.sys] || {};
  const pat = H.pattern || "3";
  const sp = sys.sp ? sys.sp[pat] : +H.sp || 3,
    wsf = sys.wsf ? sys.wsf[pat] : +H.wsf || 12;
  const volt = +H.volt || 120,
    maxSf = +H.maxSf || (volt === 240 ? 250 : 134.5);
  const SN = snapWallE(O, H.conn || [bb.x0, bb.y0]),
    conn = SN.p;
  const build = (horiz, ex) => {
    const A0 = horiz ? bb.y0 : bb.x0,
      A1 = horiz ? bb.y1 : bb.x1,
      B0 = horiz ? bb.x0 : bb.y0,
      B1 = horiz ? bb.x1 : bb.y1;
    const sp2 = sys.sp ? 2.35 : sp * 0.67,
      wz = warm.filter((o) => (horiz ? o.w : o.h) >= 0.6 * (B1 - B0)),
      inW = (v) => wz.some((o) => (horiz ? v >= o.y && v <= o.y + o.h : v >= o.x && v <= o.x + o.w));
    let alt = 0;
    const lines = [];
    for (
      let v = A0 + clear + sp / 2;
      v <= A1 - clear - sp / 2 + 0.01;
      v += inW(v) ? ((alt ^= 1) ? sp2 : sp) : sp
    ) {
      const iv = [];
      let st = null;
      for (let w = B0 + res / 2; w < B1; w += res) {
        const X = horiz ? w : v,
          Y = horiz ? v : w,
          g = ok(X, Y) && !(ex && ex(X, Y));
        if (g && st == null) st = w;
        if (!g && st != null) {
          if (w - st >= 4) iv.push([st, w]);
          st = null;
        }
      }
      if (st != null && B1 - st >= 4) iv.push([st, B1 - res / 2]);
      splitAtToilet(iv, (w) => (horiz ? [w, v] : [v, w]));
      if (iv.length) lines.push({ v, iv, len: iv.reduce((q, r) => q + r[1] - r[0], 0) });
    }
    return { horiz, lines, wz: wz.length, mid: (B0 + B1) / 2, tot: lines.reduce((q, l) => q + l.len, 0) };
  };
  const pt = (o, b, v) => (o.horiz ? [b, v] : [v, b]);
  const grp = (o, a, b, tg) => {
    tg = tg || conn;
    let best = null;
    for (const rev of [false, true])
      for (const fwd of [true, false]) {
        const idx = [];
        for (let i = a; i <= b; i++) idx.push(i);
        if (rev) idx.reverse();
        const L = o.lines[idx[0]],
          q = fwd ? L.iv[0] : L.iv[L.iv.length - 1],
          p0 = pt(o, fwd ? q[0] : q[1], L.v),
          d = Math.hypot(p0[0] - tg[0], p0[1] - tg[1]);
        if (!best || d < best.d - 0.01) best = { d, idx, fwd, p0 };
      }
    let len = 0;
    for (let i = a; i <= b; i++) len += o.lines[i].len;
    best.gsf = o.tot ? (sf * len) / o.tot : 0;
    return best;
  };
  const nWant = H.n && H.n !== "auto" ? Math.max(1, +H.n) : Math.max(1, Math.ceil(sf / maxSf - 0.001));
  let plan = null;
  const dirW = H.dir === "h" ? true : H.dir === "v" ? false : null;
  for (const o of dirW == null ? [build(W >= Hh), build(W < Hh)] : [build(dirW)]) {
    const L = o.lines.length;
    if (!L) continue;
    const n = Math.min(nWant, L);
    let cands = [];
    if (n === 1) cands = [[0, L - 1]];
    else if (n === 2) {
      for (let j = 1; j < L; j++) cands.push([0, j - 1, j, L - 1]);
    } else {
      let acc = 0,
        k = 1;
      const cut = [0];
      o.lines.forEach((l, i) => {
        acc += l.len;
        if (k < n && acc >= (o.tot * k) / n && i < L - 1) {
          cut.push(i + 1);
          k++;
        }
      });
      const c = [];
      for (let i = 0; i < cut.length; i++) c.push(cut[i], (cut[i + 1] || L) - 1);
      cands = [c];
    }
    for (const c of cands) {
      const gs = [];
      for (let i = 0; i < c.length; i += 2) gs.push(grp(o, c[i], c[i + 1]));
      const over = gs.reduce((q, g) => q + Math.max(0, g.gsf - maxSf), 0),
        mx = Math.max(...gs.map((g) => g.gsf)),
        mn = Math.min(...gs.map((g) => g.gsf));
      const score = gs.reduce((q, g) => q + g.d, 0) + over * 40 + (mx - mn) * 0.3 + L * 0.5;
      if (!plan || score < plan.score) plan = { o, gs, score };
    }
  }
  if (nWant === 1) {
    const ea = O[SN.e],
      eb = O[(SN.e + 1) % O.length],
      EL = Math.hypot(eb[0] - ea[0], eb[1] - ea[1]) || 1,
      u = [(eb[0] - ea[0]) / EL, (eb[1] - ea[1]) / EL],
      sg = sArea(O) > 0 ? 1 : -1,
      inn = [-u[1] * sg, u[0] * sg];
    if (
      (Math.abs(u[0]) < 1e-6 || Math.abs(u[1]) < 1e-6) &&
      (dirW == null || dirW === Math.abs(u[0]) < 1e-6)
    ) {
      const horiz = Math.abs(u[0]) < 1e-6,
        off = clear + sp / 2,
        band = clear + 1.5 * sp,
        q0 = [conn[0] + inn[0] * off, conn[1] + inn[1] * off];
      for (const dir of [-1, 1]) {
        const ex = (x, y) => {
          const dn = (x - conn[0]) * inn[0] + (y - conn[1]) * inn[1],
            al = ((x - conn[0]) * u[0] + (y - conn[1]) * u[1]) * dir;
          return dn < band && al > -sp / 2;
        };
        const o = build(horiz, ex),
          L = o.lines.length;
        if (L < 2) continue;
        const cn = dir > 0 ? eb : ea,
          tg = [cn[0] + inn[0] * band, cn[1] + inn[1] * band];
        const g = grp(o, 0, L - 1, tg);
        const al = (g.p0[0] - q0[0]) * u[0] + (g.p0[1] - q0[1]) * u[1];
        if (al * dir < 0) continue;
        const q1 = [q0[0] + u[0] * al, q0[1] + u[1] * al];
        g.lead = [conn, q0, q1];
        g.d = 0;
        const score = Math.abs(al) * 0.3 + L * 0.5 + Math.max(0, g.gsf - maxSf) * 40;
        if (!plan || score < plan.score) plan = { o, gs: [g], score };
      }
    }
  }
  if (!plan)
    return {
      sf,
      sp,
      wsf,
      cables: [],
      path: [],
      lenFt: 0,
      runs: 0,
      sensor: null,
      conn,
      watts: 0,
      amps: 0,
      volt,
      maxSf,
      irregular: false,
      cableSf: 0,
    };
  const o = plan.o;
  const cables = plan.gs.map((g, ci) => {
    const P2 = g.lead ? g.lead.slice() : [];
    let f = g.fwd;
    let pv = null;
    g.idx.forEach((i) => {
      const ln = o.lines[i];
      const iv = f
        ? ln.iv
        : ln.iv
            .slice()
            .reverse()
            .map((q) => [q[1], q[0]]);
      const a0 = iv[0][0];
      if (pv && Math.abs(a0 - pv.b) > 0.3) {
        // connect rows with a right-angle turn that stays on the heated area
        const c1 = pt(o, a0, pv.v),
          c2 = pt(o, pv.b, ln.v),
          clearRun = (a, b) => {
            const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
            for (let k = 1; k < n; k++)
              if (!ok(a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n)) return false;
            return true;
          },
          from = pt(o, pv.b, pv.v),
          to = pt(o, a0, ln.v),
          okA = clearRun(from, c1) && clearRun(c1, to),
          okB = clearRun(from, c2) && clearRun(c2, to);
        if (okA && !okB) P2.push(c1);
        else if (okB && !okA) P2.push(c2);
        else if (Math.abs(a0 - pv.b) <= 3 * sp || okA)
          P2.push(Math.abs(a0 - o.mid) > Math.abs(pv.b - o.mid) ? c1 : c2);
      }
      iv.forEach((q) => P2.push(pt(o, q[0], ln.v), pt(o, q[1], ln.v)));
      pv = { b: iv[iv.length - 1][1], v: ln.v };
      f = !f;
    });
    let len = 0;
    for (let i = 1; i < P2.length; i++) len += Math.hypot(P2[i][0] - P2[i - 1][0], P2[i][1] - P2[i - 1][1]);
    const eq = (len * sp) / 144;
    return {
      path: P2,
      lenFt: len / 12,
      runs: g.idx.length,
      sf: g.gsf,
      eq,
      cableSf: Math.floor(o.wz ? eq : g.gsf),
      lead: g.d,
      col: HEATCOL[ci % HEATCOL.length],
      idx: g.idx,
    };
  });
  let sensor = null;
  const big = cables.slice().sort((a, b) => b.sf - a.sf)[0];
  if (big && big.idx.length >= 2) {
    const k = Math.floor((big.idx.length - 1) / 2),
      l1 = o.lines[big.idx[k]],
      l2 = o.lines[big.idx[k + 1]],
      iv = l1.iv[0],
      m = (iv[0] + iv[1]) / 2,
      v = (l1.v + l2.v) / 2;
    sensor = pt(o, m, v);
  }
  const watts = o.wz ? cables.reduce((q, c) => q + c.eq * wsf, 0) : sf * wsf,
    amps = watts / volt;
  const irregular = s.shape !== "rect" || s.openings.some((o2) => o2.type !== "duct");
  return {
    warmOff: warm.length > 0 && !o.wz,
    sf,
    sp,
    wsf,
    cables,
    path: cables[0] ? cables[0].path : [],
    lenFt: cables.reduce((q, c) => q + c.lenFt, 0),
    runs: cables.reduce((q, c) => q + c.runs, 0),
    sensor,
    conn,
    watts,
    amps,
    volt,
    maxSf,
    irregular,
    cableSf: Math.floor(sf),
  };
}
function heatSVG(s, R, px0, fs) {
  const pz = (n) => px0(n * (fs || 1));
  const hp = R.heat;
  if (!hp || !heatVis(s)) return "";
  let h = "";
  const c = hp.conn,
    multi = hp.cables.length > 1;
  hp.cables.forEach((cb, i) => {
    if (cb.path.length > 1)
      h += `<polyline points="${cb.path.map((q) => q[0].toFixed(2) + "," + (-q[1]).toFixed(2)).join(" ")}" fill="none" stroke="${cb.col}" stroke-width="${pz(1.6)}" stroke-linejoin="round" opacity=".9"/>`;
  });
  hp.cables.forEach((cb, i) => {
    if (!cb.path.length) return;
    const p0 = cb.path[0];
    if (cb.lead > 1)
      h += `<line x1="${c[0]}" y1="${-c[1]}" x2="${p0[0]}" y2="${-p0[1]}" stroke="#1d5fa8" stroke-width="${pz(1.6)}" stroke-dasharray="${pz(5)} ${pz(3)}"/>`;
    if (cb.lead > 1) h += `<circle cx="${p0[0]}" cy="${-p0[1]}" r="${pz(3)}" fill="${cb.col}"/>`;
    const p1 = cb.path[1] || p0,
      fr = 0.3 + (0.4 * i) / Math.max(1, hp.cables.length - 1),
      mx = p0[0] + (p1[0] - p0[0]) * fr,
      my = p0[1] + (p1[1] - p0[1]) * fr;
    if (multi)
      h += `<circle cx="${mx}" cy="${-my}" r="${pz(8)}" fill="${cb.col}" stroke="#fff" stroke-width="${pz(1.2)}"/><text x="${mx}" y="${-my}" font-size="${pz(10)}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-weight="700" font-family="${FONT}">${i + 1}</text>`;
  });
  h += `<g data-conn="1"><circle cx="${c[0]}" cy="${-c[1]}" r="${pz(18)}" fill="transparent"/><rect x="${c[0] - +pz(10)}" y="${-c[1] - +pz(10)}" width="${pz(20)}" height="${pz(20)}" rx="${pz(4)}" fill="#1d5fa8" stroke="#fff" stroke-width="${pz(1.5)}"/><text x="${c[0]}" y="${-c[1]}" font-size="${pz(11)}" text-anchor="middle" dominant-baseline="central" fill="#fff" font-weight="700" font-family="${FONT}">T</text></g>`;
  if (hp.sensor)
    h += `<circle cx="${hp.sensor[0]}" cy="${-hp.sensor[1]}" r="${pz(6)}" fill="#fff" stroke="#1d5fa8" stroke-width="${pz(1.5)}"/><text x="${hp.sensor[0]}" y="${-hp.sensor[1]}" font-size="${pz(8)}" text-anchor="middle" dominant-baseline="central" fill="#1d5fa8" font-weight="700" font-family="${FONT}">S</text>`;
  return h;
}
function heatResHTML(s, R) {
  const hp = R.heat;
  if (!hp) return "";
  const H = s.heat,
    ruSys = t("hs_" + H.sys),
    multi = hp.cables.length > 1;
  let h = `<p style="margin:12px 0 4px"><b>🔥 ${t("heat")}</b> · ${esc(ruSys)}</p><div class="kp"><div><small>${t("heatSf")}</small><b>${hp.sf.toFixed(1)}</b></div><div><small>${t("wsf")}</small><b>${hp.wsf}</b></div><div><small>${t("watts")}</small><b>${Math.round(hp.watts)}</b></div><div><small>${t("amps")} (${hp.volt}V)</small><b>${hp.amps.toFixed(1)}</b></div><div><small>${t("nCables")}</small><b>${hp.cables.length}</b></div><div><small>${t("cableLen")}</small><b>${Math.round(hp.lenFt)} ft</b></div></div>`;
  if (multi)
    h += hp.cables
      .map(
        (c, i) =>
          `<div class="note"><b style="color:${c.col}">● ${t("cableN")} ${i + 1}</b> — ${c.sf.toFixed(1)} sf · ${c.runs} ${t("runs").toLowerCase()} · ≈${Math.round(c.lenFt)} ft · ${t("cablePick")} <b>${c.cableSf} sf</b></div>`,
      )
      .join("");
  else h += `<div class="note">${t("cablePick")} <b>${hp.cableSf} sf</b>. ${t("cableNoCut")}</div>`;
  if (multi) h += `<div class="note">${t("cableNoCut")}</div>`;
  if (hp.cables.some((c) => c.sf > hp.maxSf + 0.05)) h += `<div class="warnbox">${t("overMax")}</div>`;
  if (hp.amps > 15) h += `<div class="warnbox">${t("heat120warn")}</div>`;
  if (hp.warmOff) h += `<div class="note">${t("warmOff")}</div>`;
  if (hp.cables.some((c) => c.lead > 84)) h += `<div class="note">${t("leadFar")}</div>`;
  if (H.sys === "mat" && hp.irregular) h += `<div class="note">${t("matIrregular")}</div>`;
  h += `<p class="hint">${t("heatNotes")}</p>`;
  return h;
}

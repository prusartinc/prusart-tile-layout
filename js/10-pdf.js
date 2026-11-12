"use strict";
/* ================= PDF ================= */
function exportMenu() {
  modal(
    `<h3>${t("exportT2")}</h3><div class="btns" style="flex-direction:column"><button class="btn p w" data-act="pdf:client">${t("pdfClient")}</button><button class="btn w" data-act="pdf:cut">${t("pdfCut")}</button>${S.tab !== "tot" ? `<button class="btn w" data-act="img">${t("imgThis")}</button>` : ""}<button class="btn w" data-act="closeModal">${t("close")}</button></div><p class="hint">${t("pdfHint")}</p>`,
  );
}
function svgImg(V, W, H) {
  return new Promise((res) => {
    const str = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${V.vb.join(" ")}">${declutterBody(V.body, V.vb, W, H)}</svg>`;
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(str);
  });
}
function Rep() {
  const W = 1275,
    H = 1650,
    M = 72,
    pages = [];
  let c, x, y;
  const font = (sz, b) => `${b ? "700 " : ""}${sz}px -apple-system,Segoe UI,Roboto,Arial,sans-serif`;
  const np = () => {
    c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    x = c.getContext("2d");
    x.fillStyle = "#fff";
    x.fillRect(0, 0, W, H);
    pages.push(c);
    y = M;
  };
  np();
  const wrap = (str, maxW, sz, b) => {
    x.font = font(sz, b);
    const out = [];
    String(str)
      .split("\n")
      .forEach((par) => {
        let line = "";
        par.split(" ").forEach((w) => {
          const tl = line ? line + " " + w : w;
          if (x.measureText(tl).width > maxW && line) {
            out.push(line);
            line = w;
          } else line = tl;
        });
        out.push(line);
      });
    return out;
  };
  const r = {
    W,
    H,
    M,
    np,
    get y() {
      return y;
    },
    set y(v) {
      y = v;
    },
    space(h) {
      if (y + h > H - M - 30) np();
    },
    text(str, o = {}) {
      const sz = o.size || 22,
        b = !!o.bold;
      const xx = o.x || M;
      wrap(str, o.maxW || W - M - xx, sz, b).forEach((ln) => {
        r.space(sz * 1.4);
        x.font = font(sz, b);
        x.fillStyle = o.color || "#1e2226";
        x.fillText(ln, xx, y + sz);
        y += sz * 1.4;
      });
      y += o.after == null ? 6 : o.after;
    },
    cover(img, title, sub) {
      x.fillStyle = "#000";
      x.fillRect(0, 0, W, 250);
      if (img) x.drawImage(img, M - 20, 15, 220, 220);
      x.fillStyle = "#fff";
      x.font = font(44, true);
      const tl = wrap(title, W - M - 280, 44, true);
      tl.slice(0, 2).forEach((ln, i) => x.fillText(ln, 280, 100 + i * 52));
      x.fillStyle = "#a8a390";
      x.font = font(22);
      x.fillText(sub, 280, 100 + Math.min(2, tl.length) * 52 + 10);
      y = 290;
    },
    rule() {
      r.space(12);
      x.fillStyle = "#ddd6cb";
      x.fillRect(M, y + 4, W - 2 * M, 2);
      y += 14;
    },
    table(cols, rows, o = {}) {
      const sz = o.size || 19,
        rh = sz * 1.75,
        tw = W - 2 * M;
      const head = () => {
        r.space(rh * 2);
        x.fillStyle = "#efe9df";
        x.fillRect(M, y, tw, rh);
        x.font = font(sz - 1, true);
        x.fillStyle = "#555";
        let cx = M + 8;
        cols.forEach((cl) => {
          x.textAlign = cl.r ? "right" : "left";
          x.fillText(cl.t, cl.r ? cx + cl.w * tw - 16 : cx, y + rh * 0.66);
          cx += cl.w * tw;
        });
        x.textAlign = "left";
        y += rh;
      };
      head();
      rows.forEach((row) => {
        const cellOf = (i) => {
          const v = row[i];
          return v && typeof v === "object" ? v : { t: v == null ? "" : String(v) };
        };
        const hs = cols.map((cl, i) => {
          const cv = cellOf(i);
          return wrap(cv.t, cl.w * tw - 16 - (cv.sw ? sz * 1.2 : 0), sz, cv.b).length;
        });
        const hh = Math.max(...hs) * sz * 1.3 + sz * 0.5;
        if (y + hh > H - M - 30) {
          np();
          head();
        }
        let cx = M + 8;
        cols.forEach((cl, i) => {
          const cv = cellOf(i);
          let ox = 0;
          if (cv.sw) {
            x.fillStyle = cv.sw;
            x.fillRect(cx, y + sz * 0.45, sz * 0.8, sz * 0.8);
            x.strokeStyle = "#8a847a";
            x.strokeRect(cx, y + sz * 0.45, sz * 0.8, sz * 0.8);
            ox = sz * 1.2;
          }
          const lines = wrap(cv.t, cl.w * tw - 16 - ox, sz, cv.b);
          x.font = font(sz, cv.b);
          x.fillStyle = cv.c || "#1e2226";
          x.textAlign = cl.r ? "right" : "left";
          lines.forEach((ln, k) =>
            x.fillText(ln, cl.r ? cx + cl.w * tw - 16 : cx + ox, y + sz * 1.15 + k * sz * 1.3),
          );
          x.textAlign = "left";
          cx += cl.w * tw;
        });
        y += hh;
        x.fillStyle = "#eee9e0";
        x.fillRect(M, y - 1, tw, 1);
      });
      y += 10;
    },
    image(img, w, h) {
      r.space(h + 10);
      x.drawImage(img, (W - w) / 2, y, w, h);
      y += h + 12;
    },
    finish(title) {
      pages.forEach((p, i) => {
        const cx = p.getContext("2d");
        cx.font = font(16);
        cx.fillStyle = "#888";
        cx.fillText(`PrusArt Inc. · ${title}`, M, H - 36);
        cx.textAlign = "right";
        cx.fillText(`${i + 1} / ${pages.length}`, W - M, H - 36);
        cx.textAlign = "left";
      });
      return pages;
    },
  };
  return r;
}
async function drawSurfInto(rep, items, maxH, mode, layer) {
  const pp = PAL;
  PAL = PAL_L;
  LAYER = layer || null;
  try {
    return await drawSurfInto0(rep, items, maxH, mode);
  } finally {
    PAL = pp;
    LAYER = null;
  }
}
async function drawSurfInto0(rep, items, maxH, mode) {
  if (mode === undefined) mode = items.length > 1 ? "walls" : false;
  const W0 = rep.W - 2 * rep.M;
  const probe = buildViewItems(1000, 0, { zoom: 1, panX: 0, panY: 0 }, 1.6, items, mode);
  if (!probe) return;
  const ratio = probe.Hpx / 1000;
  let w = W0,
    h = w * ratio;
  const avail = Math.min(maxH, rep.H - rep.M * 2 - 80);
  if (h > avail) {
    h = avail;
    w = h / ratio;
  }
  const V = buildViewItems(w * 2, h * 2, { zoom: 1, panX: 0, panY: 0 }, 2.6, items, mode);
  const img = await svgImg(V, Math.round(w * 2), Math.round(h * 2));
  if (img) rep.image(img, w, h);
}
let PDF = null;
async function makePdf(kind) {
  modal(`<h3>${t("building")}</h3><p class="hint">…</p>`);
  await new Promise((r) => setTimeout(r, 40));
  const keep = { l: S.labels, n: S.nums };
  try {
    const rep = Rep(),
      date = new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US");
    rep.cover(
      LOGOIMG,
      P.name,
      [P.client, date, kind === "cut" ? t("pdfCut") : t("pdfClient")].filter(Boolean).join(" · "),
    );
    TEXON = kind !== "cut";
    const all = P.surfaces.map((s) => ({ s, R: compute(s) }));
    rep.table(
      [
        { t: t("surface"), w: 0.28 },
        { t: t("dims"), w: 0.22 },
        { t: t("tile"), w: 0.36 },
        { t: "sf", w: 0.14, r: true },
      ],
      all.map(({ s, R }) => [
        { t: s.name, b: true },
        `${fmt(R.G.bb.x1 - R.G.bb.x0)} × ${fmt(R.G.bb.y1 - R.G.bb.y0)}`,
        `${tileDesc(R.T)} · ${patName(R.T)} · ${t("grout")} ${fmt(+R.T.g)}`,
        sq(R.area),
      ]),
    );
    if (kind === "cut") {
      const g = {};
      all.forEach(({ R }) => {
        for (const k in R.nb) g[k] = (g[k] || 0) + R.nb[k];
      });
      rep.text(t("byTile"), { size: 24, bold: true });
      rep.table(
        [
          { t: t("tile"), w: 0.5 },
          { t: t("need"), w: 0.25, r: true },
          { t: t("order") + " +" + P.waste + "%", w: 0.25, r: true },
        ],
        Object.keys(g).map((k) => [
          k,
          String(g[k]),
          { t: String(Math.ceil(g[k] * (1 + (+P.waste || 0) / 100))), b: true },
        ]),
      );
      rep.text(t("materials"), { size: 24, bold: true });
      rep.table(
        [
          { t: t("matItem"), w: 0.4 },
          { t: t("matQty"), w: 0.27 },
          { t: t("matNote"), w: 0.33 },
        ],
        materials().map((r) => [{ t: r[0], b: true }, r[1], { t: r[2], c: "#666" }]),
        { size: 18 },
      );
      rep.text(t("matNoteAll"), { size: 16, color: "#777" });
    }
    S.labels = kind === "cut";
    S.nums = kind === "cut";
    const walls = P.surfaces.filter((s) => s.type === "wall");
    if (walls.length >= 2) {
      rep.np();
      rep.text(t("allWalls"), { size: 30, bold: true });
      await drawSurfInto(rep, allWallItems(), rep.H * 0.6, "walls");
    }
    if (P.surfaces.filter((x) => x.type !== "wall").length >= 2) {
      rep.np();
      rep.text(t("allFloor"), { size: 30, bold: true });
      await drawSurfInto(rep, floorItems(), rep.H * 0.6, "floor");
    }
    const extraPages = async (s, R) => {
      if (R.heat && s.heat.on && s.heat.show) {
        const hp = R.heat;
        rep.np();
        rep.text(`${t("heat")} — ${s.name}`, { size: 30, bold: true, after: 2 });
        rep.text(
          `${t("hs_" + s.heat.sys)} · ${hp.sf.toFixed(1)} sf · ${Math.round(hp.watts)} W · ${hp.amps.toFixed(1)} A (${hp.volt} V) · ${t("nCables")}: ${hp.cables.length}`,
          { size: 19, color: "#555", after: 10 },
        );
        await drawSurfInto(rep, [{ s, R, dx: 0, dy: 0 }], rep.H * 0.62, false, "wire");
        hp.cables.forEach((c, i) =>
          rep.text(
            `${t("cableN")} ${i + 1}: ${c.sf.toFixed(1)} sf · ${c.runs} ${t("runs").toLowerCase()} · ≈${Math.round(c.lenFt)} ft · ${t("cablePick")} ${c.cableSf} sf`,
            { size: 19, bold: i === 0 && hp.cables.length === 1 },
          ),
        );
        rep.text(t("cableNoCut"), { size: 17, color: "#555" });
        rep.text(t("heatNotes"), { size: 16, color: "#777" });
      }
      if (kind === "cut" && (s.type !== "wall" || boardOf(s))) {
        const pp = prepPlan(s, R);
        if (pp) {
          rep.np();
          rep.text(`${t("lay_prep")} — ${s.name}`, { size: 30, bold: true, after: 2 });
          rep.text(
            prepSummary(s, R)
              .replace(/<\/span><span>/g, " · ")
              .replace(/<[^>]+>/g, ""),
            { size: 19, color: "#555", after: 10 },
          );
          await drawSurfInto(rep, [{ s, R, dx: 0, dy: 0 }], rep.H * 0.62, false, "prep");
          const cr = prepCutRows(pp);
          if (cr.length) {
            rep.text(t("prepCuts"), { size: 21, bold: true, after: 2 });
            rep.table(
              [
                { t: t("size"), w: 0.6 },
                { t: t("unit"), w: 0.4, r: true },
              ],
              cr.map((c) => [
                { t: c.full ? `${t("fullSheet")} ${pp.bs ? pp.bs.replace("x", "×") : ""}` : c.k, b: !c.full },
                String(c.n),
              ]),
              { size: 18 },
            );
          }
        }
      }
    };
    for (const { s, R } of all) {
      rep.np();
      rep.text(s.name, { size: 30, bold: true, after: 2 });
      rep.text(
        `${fmt(R.G.bb.x1 - R.G.bb.x0)} × ${fmt(R.G.bb.y1 - R.G.bb.y0)} · ${tileDesc(R.T)} · ${patName(R.T)} · ${t("grout")} ${fmt(+R.T.g)}${R.lf > 0 ? ` · Schluter ${edgeProf(s).key}` : ""}`,
        { size: 19, color: "#555", after: 10 },
      );
      await drawSurfInto(rep, [{ s, R, dx: 0, dy: 0 }], kind === "cut" ? rep.H * 0.55 : rep.H * 0.72);
      if (kind === "client") {
        rep.text(`${t("area")}: ${sq(R.area)}`, { size: 20 });
        await extraPages(s, R);
        continue;
      }
      rep.text(
        `${t("full")} ${R.full} · ${t("cuts")} ${R.cuts} · ${t("minCut")} ${R.minc < 1e8 ? fmt(R.minc) : "—"} · ${t("need")} ${R.need} · ${t("order")} ${R.order}`,
        { size: 19, bold: true },
      );
      if (R.ledger && R.ledger.y != null)
        rep.text(
          `${t("outLevel")} ${fmt(R.ledger.hi - R.ledger.lo)}. ${t("ledgerTxt")} ${fmt(R.ledger.y)} ${t(R.ledger.tub ? "ledgerFromFloor" : "ledgerFrom")}`,
          { size: 18, color: "#b3261e" },
        );
      if (R.T.shape === "rect" && !(R.T.sheet && R.T.sheet.on)) {
        const rows = [];
        cutSheet(R).forEach((gr) => {
          gr.items.forEach((p, i) =>
            rows.push([
              { t: "#" + p.no, b: true, c: "#b4441b" },
              {
                t:
                  i === 0
                    ? gr.label.replace(" " + t("rowBottom"), "") +
                      (gr.full ? ` (${t("fullN")} ${gr.full})` : "")
                    : "",
                c: "#555",
              },
              { t: pieceSize(p), b: true, sw: COL[p.c] },
              { t: pieceNote(p), c: "#666" },
            ]),
          );
        });
        rep.text(t("cutSheet"), { size: 21, bold: true, after: 2 });
        rep.table(
          [
            { t: "#", w: 0.09 },
            { t: t("row"), w: 0.21 },
            { t: t("size"), w: 0.38 },
            { t: t("matNote"), w: 0.32 },
          ],
          rows,
          { size: 18 },
        );
      }
      if (R.drill.length) {
        rep.text(t("drill"), { size: 21, bold: true, after: 2 });
        R.drill.forEach((d) =>
          rep.text(
            (d.p && d.p.no ? "#" + d.p.no + " — " : d.p ? t("fullTile") + " — " : "") +
              drillTxt(d).replace(/<[^>]+>/g, ""),
            { size: 18 },
          ),
        );
      }
      const st = R.strips.filter((x) => x.count || x.tiles);
      if (st.length) {
        rep.text(t("strips"), { size: 21, bold: true, after: 2 });
        st.forEach((x) => rep.text(stripTxt(x), { size: 18 }));
      }
      await extraPages(s, R);
    }
    const pages = rep.finish(P.name);
    PDF = {
      bytes: pdfFromCanvases(pages),
      name: `${
        (P.name || "project")
          .replace(/[^\wЀ-ӿ -]+/g, "")
          .trim()
          .replace(/\s+/g, "_") || "project"
      }_${kind === "cut" ? "cuts" : "client"}.pdf`,
      n: pages.length,
    };
  } catch (e) {
    console.error(e);
    S.labels = keep.l;
    S.nums = keep.n;
    modal(
      `<h3>Error</h3><p>${esc(e.message)}</p><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
    );
    return;
  }
  S.labels = keep.l;
  S.nums = keep.n;
  const url = URL.createObjectURL(new Blob([PDF.bytes], { type: "application/pdf" }));
  modal(
    `<h3>${t("pdfReady")}</h3><p class="hint">${esc(PDF.name)} · ${PDF.n} ${t("pagesN")}</p><div class="btns" style="flex-direction:column"><button class="btn p w" data-act="sharePdf">${t("sharePdf")}</button><a class="btn w" style="text-align:center;text-decoration:none" href="${url}" download="${esc(PDF.name)}" target="_blank">${t("dlPdf")}</a><button class="btn w" data-act="closeModal">${t("close")}</button></div><p class="hint">${t("pdfHint")}</p>`,
  );
}
async function sharePdf() {
  if (!PDF) return;
  const file = new File([PDF.bytes], PDF.name, { type: "application/pdf" });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: PDF.name });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = PDF.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (e) {}
}
function b64bytes(d) {
  const b = atob(d.split(",")[1]);
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
}
function pdfFromCanvases(pages) {
  const enc = new TextEncoder(),
    parts = [],
    off = [];
  let len = 0;
  const push = (v) => {
    const b = typeof v === "string" ? enc.encode(v) : v;
    parts.push(b);
    len += b.length;
  };
  push(new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10]));
  const N = pages.length,
    kids = [];
  for (let i = 0; i < N; i++) kids.push(`${3 + 3 * i} 0 R`);
  off[1] = len;
  push(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);
  off[2] = len;
  push(`2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${N} >>\nendobj\n`);
  pages.forEach((c, i) => {
    const pg = 3 + 3 * i,
      ct = pg + 1,
      im = pg + 2,
      jp = b64bytes(c.toDataURL("image/jpeg", 0.82));
    const cs = `q 612 0 0 792 0 0 cm /Im0 Do Q`;
    off[pg] = len;
    push(
      `${pg} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /XObject << /Im0 ${im} 0 R >> >> /Contents ${ct} 0 R >>\nendobj\n`,
    );
    off[ct] = len;
    push(`${ct} 0 obj\n<< /Length ${cs.length} >>\nstream\n${cs}\nendstream\nendobj\n`);
    off[im] = len;
    push(
      `${im} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jp.length} >>\nstream\n`,
    );
    push(jp);
    push(`\nendstream\nendobj\n`);
  });
  const max = 2 + 3 * N,
    xo = len;
  let xr = `xref\n0 ${max + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= max; i++) xr += String(off[i]).padStart(10, "0") + " 00000 n \n";
  push(xr + `trailer\n<< /Size ${max + 1} /Root 1 0 R >>\nstartxref\n${xo}\n%%EOF\n`);
  const out = new Uint8Array(len);
  let p = 0;
  parts.forEach((b) => {
    out.set(b, p);
    p += b.length;
  });
  return out;
}

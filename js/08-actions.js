"use strict";
/* ================= actions ================= */
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const [a, arg] = b.dataset.act.split(/:(.*)/);
  act(a, arg, b);
});
function act(a, arg, b) {
  const s = cur();
  if (
    b &&
    b.closest &&
    b.closest("#mbody") &&
    ["tab", "tot", "rotate", "nums", "labels", "fit", "full"].includes(a)
  )
    closeModal();
  if (/^lib/.test(a)) return libAct(a, arg);
  if (/^(bk|sy)[A-Z]/.test(a)) return syncAct(a, arg);
  if (/^(bs|ms)[A-Z]/.test(a)) return kitchenAct(a, arg);
  if (/^(home|nh)/.test(a)) return homeAct(a, arg);
  if (/^tex/.test(a) && a !== "texToggle") {
    if (a === "texPick") closeModal();
    return texAct(a);
  }
  if (/^wiz(Apply|Default|Cancel|Lib)$/.test(a)) return wizAct(a);
  switch (a) {
    case "texToggle":
      S.texOn = !S.texOn;
      closeModal();
      renderPanel();
      draw();
      break;
    case "ptEdit":
      S.ptEdit = !S.ptEdit;
      if (S.ptEdit) S.mode = "tiles";
      renderTools();
      draw();
      if (S.ptEdit) toast(t("ptOn"), false);
      break;
    case "zoneMove":
      S.zoneMove = !S.zoneMove;
      if (S.zoneMove) S.mode = "tiles";
      renderTools();
      toast(S.zoneMove ? t("zonesOn") : t("zonesOff"), false);
      break;
    case "more":
      moreMenu();
      break;
    case "surfList":
      surfList();
      break;
    case "secGo":
      secGo(arg);
      break;
    case "site":
      siteToggle();
      break;
    case "pin":
      S.pin = S.pin === false;
      closeModal();
      applyPin();
      draw();
      break;
    case "wizPick":
      if (S.wiz) S.wiz.src = "l:" + arg;
      wizOpen();
      break;
    case "wizBack":
      wizOpen();
      break;
    case "toastUndo":
      doUndo();
      $("#toast").classList.remove("on");
      break;
    case "tab":
      S.tab = +arg;
      S.view = { zoom: 1, panX: 0, panY: 0 };
      renderAll();
      break;
    case "all":
      S.tab = "all";
      S.view = { zoom: 1, panX: 0, panY: 0 };
      renderAll();
      break;
    case "floorTab":
      S.tab = "floor";
      S.view = { zoom: 1, panX: 0, panY: 0 };
      renderAll();
      break;
    case "autoFloor": {
      const done = new Set();
      P.surfaces
        .filter((x) => x.type !== "wall")
        .forEach((w) => {
          if (isZLinked(w)) {
            if (done.has("z")) return;
            done.add("z");
          }
          autoLayout(w);
        });
      changed();
      break;
    }
    case "tileToFloors": {
      const fs = P.surfaces.filter((x) => x.type === "floor");
      if (fs.length < 2) break;
      const src = fs[0].tile;
      fs.slice(1).forEach((w) => {
        const keep = { ox: w.tile.ox, oy: w.tile.oy };
        w.tile = Object.assign(JSON.parse(JSON.stringify(src)), keep);
      });
      act("autoFloor");
      renderPanel();
      break;
    }
    case "undo":
      doUndo();
      break;
    case "addTrans":
      s.trans = s.trans || [];
      s.trans.push({
        id: uid(),
        edge: 0,
        from: 12,
        len: 30,
        adj: "hardwood",
        at: ADJ.hardwood,
        sub: 0,
        prof: "auto",
        stop: "wall",
        wt: 4.5,
        dt: 1.375,
        ext: 0,
      });
      S.open.add("trans");
      renderPanel();
      changed();
      break;
    case "transStart": {
      const tr = s.trans[+arg];
      if (!tr || !transStart(s, tr)) toast(t("trStartNo"), false);
      else {
        changed();
        renderPanel();
        toast("✓ " + t("trStartOk"));
      }
      break;
    }
    case "delTrans":
      s.trans.splice(+arg, 1);
      renderPanel();
      changed();
      break;
    case "section": {
      const [a1, a2] = arg.split(":").map(Number);
      transModal(a1, a2);
      break;
    }
    case "pickConn":
      S.pickConn = S.pickConn === s.id ? null : s.id;
      renderPanel();
      break;
    case "addUnder":
      modal(
        `<h3>${t("addUnder")}</h3><div class="grid"><label class="f w2"><span>${t("name")}</span><input id="cuN"></label><label class="f"><span>${t("thick")}</span><input id="cuT" placeholder="1/4"></label><label class="f"><span>sf / ${t("unit")}</span><input id="cuS" inputmode="decimal" placeholder="54"></label><label class="f w2"><span>${t("type")}</span><select id="cuK"><option value="mem">${t("ug_mem")}</option><option value="heat">${t("ug_heat")}</option><option value="board">${t("ug_board")}</option><option value="ply">${t("ug_ply")}</option></select></label></div><div class="btns"><button class="btn p" data-act="saveUnder">${t("done")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
      );
      break;
    case "saveUnder": {
      const n = $("#cuN").value.trim(),
        tt = parseLen($("#cuT").value);
      if (!n || !isFinite(tt)) break;
      P.customUnder = P.customUnder || [];
      P.customUnder.push({
        id: "c" + uid(),
        n,
        t: tt,
        sf: parseFloat($("#cuS").value) || 0,
        k: $("#cuK").value,
      });
      closeModal();
      renderPanel();
      changed();
      break;
    }
    case "drawShape":
      drawModal();
      break;
    case "drawUndo":
      if (DRAW) {
        DRAW.pts.pop();
        renderDraw();
      }
      break;
    case "drawClear":
      if (DRAW) {
        DRAW.pts = [];
        renderDraw();
      }
      break;
    case "drawApply": {
      if (!DRAW || DRAW.pts.length < 3) {
        const h = $("#mbody .hint");
        if (h) h.textContent = t("drawNeed3");
        break;
      }
      const target = s.type === "wall" ? +s.h || 96 : Math.max(+s.w || 96, +s.h || 72);
      const sg = straighten(DRAW.pts, target);
      if (!sg) {
        break;
      }
      s.shape = "walk";
      s.segs = sg;
      S.open.add("surf");
      DRAW = null;
      closeModal();
      renderPanel();
      changed();
      autoLayout(s);
      changed();
      break;
    }
    case "walkFixOpen":
      walkFixModal(+arg);
      break;
    case "walkFix": {
      const [si, i, nl] = arg.split(":");
      const ss = P.surfaces[+si];
      if (!ss || !ss.segs[+i]) break;
      ss.segs[+i].l = +nl;
      renderPanel();
      changed();
      walkFixModal(+si);
      break;
    }
    case "closeWalk":
      if (closeWalk(s)) {
        if (b && b.closest && b.closest("#mbody")) {
          closeModal();
          toast("✓ " + t("walkFixOk"));
        }
        renderPanel();
        changed();
      } else {
        b.textContent = t("cantClose");
      }
      break;
    case "help":
      helpModal();
      break;
    case "redo":
      doRedo();
      break;
    case "stepCycle": {
      const st = [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1];
      S.step = st[(st.indexOf(S.step) + 1) % st.length];
      renderPad();
      if (cur()) renderPanel();
      break;
    }
    case "addSeg":
      s.segs.push({ l: 24, a: 90 });
      renderPanel();
      changed();
      break;
    case "delSeg":
      s.segs.splice(+arg, 1);
      renderPanel();
      changed();
      break;
    case "nicheCfg":
      nicheModal(S.tab, +arg);
      break;
    case "delOpenP": {
      const [a1, a2] = arg.split(":").map(Number);
      P.surfaces[a1].openings.splice(a2, 1);
      closeModal();
      renderPanel();
      changed();
      break;
    }
    case "tot":
      S.tab = "tot";
      renderAll();
      break;
    case "addMenu":
      modal(
        `<h3>${t("addWhat")}</h3><div class="btns">${["wall", "floor", "pan"].map((x) => `<button class="btn p" data-act="addSurf:${x}">${ICON[x]} ${t(x)}</button>`).join("")}<button class="btn" data-act="closeModal">${t("close")}</button></div>`,
      );
      break;
    case "addSurf":
      wizStart("new", arg);
      break;
    case "quickSize": {
      if (!s) return;
      const si = S.tab;
      modal(
        `<h3>📐 ${esc(s.name)}</h3><div class="grid">${F(t("width"), `surfaces.${si}.w`, "len", "p")}${F(s.type === "wall" ? t("height") : t("length"), `surfaces.${si}.h`, "len", "p")}</div><div class="btns"><button class="btn p" data-act="closeModal">${t("done")}</button></div>`,
      );
      break;
    }
    case "quickTile": {
      if (!s) return;
      const si = S.tab,
        T = s.tile,
        pre = `surfaces.${si}.tile`;
      const two = !["hex", "penny"].includes(T.shape);
      modal(
        `<h3>▦ ${t("tile")} — ${esc(s.name)}</h3><div class="grid">${
          two
            ? F(t("tileW"), pre + ".w", "len", "p") + F(t("tileL"), pre + ".h", "len", "p")
            : F(t(T.shape === "hex" ? "hexW" : "pennyD"), pre + ".w", "len", "p", "w2")
        }${F(t("grout"), pre + ".g", "len", "p")}${F(t("thick"), pre + ".thick", "len", "p")}</div><p class="hint">${t("qTileHint")}</p><div class="btns"><button class="btn p" data-act="closeModal">${t("done")}</button></div>`,
      );
      break;
    }
    case "clearSurf":
      if (!s) return;
      wizStart("reset");
      break;
    case "delSurfQ":
      if (!s) return;
      modal(
        `<h3>🗑 ${t("qDelT")}</h3><p>${t("qDelMsg").replace("{n}", esc(s.name))}</p><div class="btns"><button class="btn d" data-act="delSurfGo">${t("del")}</button><button class="btn" data-act="closeModal">${t("cancel")}</button></div>`,
      );
      break;
    case "delSurfGo":
      commitUndo();
      closeModal();
      P.surfaces.splice(S.tab, 1);
      if (!P.surfaces.length) P.surfaces.push(newSurface("wall"));
      S.tab = Math.min(S.tab, P.surfaces.length - 1);
      renderAll();
      changed();
      toast(t("toastDeleted"));
      break;
    case "rotate":
      if (!s) return;
      if (S.layer === "prep") {
        const pp = R && prepPlan(s, R);
        s.stack = s.stack || {};
        s.stack.bdir = pp && pp.horiz ? "v" : "h";
        renderPanel();
        changed();
        break;
      }
      s.tile.rot = !s.tile.rot;
      autoLayout(s);
      renderPanel();
      changed();
      break;
    case "grout":
      s.tile.g = +arg;
      autoLayout(s);
      renderPanel();
      changed();
      break;
    case "off":
      s.tile.off = +arg;
      autoLayout(s);
      renderPanel();
      changed();
      break;
    case "offDir":
      s.tile.offDir = arg;
      autoLayout(s);
      renderPanel();
      changed();
      break;
    case "ang":
      s.tile.ang = +arg;
      autoLayout(s);
      renderPanel();
      changed();
      break;
    case "prepReset":
      if (!s) return;
      s.prepO = { x: 0, y: 0 };
      if (s.stack) s.stack.bdir = "auto";
      renderPanel();
      changed();
      break;
    case "auto":
      if (!s) return;
      if (S.layer === "prep") {
        s.prepO = { x: 0, y: 0 };
        if (s.stack) s.stack.bdir = "auto";
        renderPanel();
        changed();
        break;
      }
      autoLayout(s);
      changed();
      break;
    case "autoAll": {
      P.surfaces.filter((x) => x.type === "wall").forEach((w) => autoLayout(w));
      changed();
      break;
    }
    case "tileToAll": {
      const ws = P.surfaces.filter((x) => x.type === "wall");
      if (!ws.length) return;
      const src = ws[0].tile;
      ws.slice(1).forEach((w) => {
        const keep = { ox: w.tile.ox, oy: w.tile.oy };
        w.tile = Object.assign(JSON.parse(JSON.stringify(src)), keep);
      });
      act("autoAll");
      renderPanel();
      break;
    }
    case "gallery":
      if (s) galleryModal();
      break;
    case "preset":
      applyPreset(s, arg);
      closeModal();
      renderPanel();
      renderTools();
      changed();
      break;
    case "cTile":
    case "cJoint": {
      const G = geom(s);
      centerOn(s, (G.rb.x0 + G.rb.x1) / 2, (G.rb.y0 + G.rb.y1) / 2, a === "cJoint");
      changed();
      break;
    }
    case "corner0": {
      const G = geom(s);
      setO(s, G.rb.x0, G.rb.y0);
      normalizeS(s);
      changed();
      break;
    }
    case "dTile":
    case "dJoint":
      centerOn(s, s.drain.x, s.drain.y, a === "dJoint");
      changed();
      break;
    case "nudge":
      nudgeS(s, arg);
      changed();
      break;
    case "step":
      S.step = +arg;
      renderPanel();
      renderPad();
      break;
    case "addOpenMenu": {
      const types = Object.keys(OPT).filter((k) => OPT[k].on.includes(s.type));
      modal(
        `<h3>${t("addWhatOpen")}</h3><div class="btns">${types.map((k) => `<button class="btn" data-act="addOpen:${k}">${t(k)}</button>`).join("")}</div><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
      );
      break;
    }
    case "addOpen": {
      const d = OPT[arg],
        bb = bboxOf(outerPoly(s)),
        cx = (bb.x0 + bb.x1) / 2,
        cy = (bb.y0 + bb.y1) / 2;
      const o = { id: uid(), type: arg, shape: d.shape, trim: !!d.trim };
      if (d.shape === "circle") {
        o.dia = d.dia;
        o.x = cx;
        o.y =
          arg === "toilet"
            ? 12
            : arg === "valve"
              ? Math.min(bb.y1 - 6, 44)
              : arg === "pipe" && s.type === "wall"
                ? Math.min(bb.y1 - 4, 80)
                : cy;
      } else {
        o.w = d.w;
        o.h = d.h;
        o.x = Math.max(0, cx - d.w / 2);
        o.y =
          arg === "niche"
            ? Math.min(42, bb.y1 - d.h - 6)
            : arg === "outlet" && s.type === "wall"
              ? Math.min(44, bb.y1 - 6)
              : Math.max(0, cy - d.h / 2);
        if (d.d) o.d = d.d;
      }
      s.openings.push(o);
      S.open.add("open");
      closeModal();
      renderPanel();
      changed();
      break;
    }
    case "delOpen":
      s.openings.splice(+arg, 1);
      renderPanel();
      changed();
      break;
    case "snap": {
      const o = s.openings[+arg],
        T = effT(s);
      if (+T.ang || T.shape !== "rect") {
        break;
      }
      const { tw, th } = rdims(T),
        px = tw + T.g,
        py = th + T.g,
        e = o.trim ? edgeProf(s).vis : 0;
      const j = Math.round((o.y - e - T.oy) / py);
      o.y = Math.round((T.oy + j * py + e) * 64) / 64;
      const pat = patOf(T),
        f = pat === "offset" ? +T.off : 0,
        sh = offShift(T, j, f) * px;
      if (pat === "grid" || pat === "offset") {
        const i = Math.round((o.x - e - T.ox - sh) / px);
        o.x = Math.round((T.ox + sh + i * px + e) * 64) / 64;
      }
      renderPanel();
      changed();
      break;
    }
    case "applyAll":
      P.surfaces.forEach((x) => {
        if (x !== s && x.type === s.type) {
          const keep = { ox: x.tile.ox, oy: x.tile.oy };
          x.tile = Object.assign(JSON.parse(JSON.stringify(s.tile)), keep);
          if (!isLinked(x)) autoLayout(x);
        }
      });
      b.textContent = t("copied");
      saveSoon();
      break;
    case "zin":
      S.view.zoom = Math.min(14, S.view.zoom * 1.3);
      draw();
      break;
    case "zout":
      S.view.zoom = Math.max(0.4, S.view.zoom / 1.3);
      draw();
      break;
    case "fit":
      S.view = { zoom: 1, panX: 0, panY: 0 };
      draw();
      break;
    case "labels":
      S.labels = !S.labels;
      renderTools();
      draw();
      break;
    case "nums":
      S.nums = !S.nums;
      if (S.nums) S.labels = true;
      renderTools();
      draw();
      if (!$("#modal").hidden && arg !== "x") closeModal();
      break;
    case "cutSheet":
      cutSheetModal();
      break;
    case "exportMenu":
      exportMenu();
      break;
    case "pdf":
      makePdf(arg);
      break;
    case "sharePdf":
      sharePdf();
      break;
    case "full":
      S.full = !S.full;
      document.body.classList.toggle("full", S.full);
      if (!S.full && S.fullFrom != null) {
        // came here by double tap: go back to the view it was opened from
        S.tab = S.fullFrom;
        S.fullFrom = null;
        S.view = { zoom: 1, panX: 0, panY: 0 };
        renderAll();
        break;
      }
      renderTools();
      if (typeof applyPin === "function") applyPin();
      requestAnimationFrame(() => draw());
      break;
    case "layer":
      S.layer = arg;
      if (arg === "prep") S.open.add("prep");
      if (arg === "wire") S.open.add("heat");
      renderTools();
      draw();
      renderStat();
      renderPanel();
      break;
    case "mode":
      S.mode = S.mode === "tiles" ? "view" : S.mode === "view" ? "lock" : "tiles";
      renderTools();
      break;
    case "client":
      S.client = !S.client;
      if (S.client && S.tab === "tot") S.tab = 0;
      renderAll();
      break;
    case "lang":
      lang = lang === "ru" ? "en" : "ru";
      document.documentElement.lang = lang;
      saveSoon();
      renderAll();
      if (S.home) renderHome();
      break;
    case "projects":
      showHome(true);
      break;
    case "theme":
      THEME = arg;
      DB.theme = arg;
      applyTheme();
      saveSoon();
      draw();
      if (!$("#modal").hidden) projectsModal();
      if (S.tab === "tot") renderPanel();
      break;
    case "closeModal":
      closeModal();
      break;
    case "newProj":
      closeModal();
      showHome(true);
      homeAct("nhStart");
      break;
    case "openProj":
      P = DB.projects.find((p) => p.id === arg) || P;
      resetUndo();
      S.tab = 0;
      S.view = { zoom: 1, panX: 0, panY: 0 };
      closeModal();
      renderAll();
      saveSoon();
      break;
    case "dupProj": {
      const src = DB.projects.find((p) => p.id === arg);
      if (!src) return;
      const c = JSON.parse(JSON.stringify(src));
      c.id = uid();
      c.name += " (2)";
      c.updated = Date.now();
      DB.projects.push(c);
      P = c;
      S.tab = 0;
      saveSoon();
      if (S.home) {
        closeModal();
        renderHome();
      } else projectsModal();
      renderAll();
      break;
    }
    case "delProj":
      if (!b.dataset.armed) {
        b.dataset.armed = 1;
        b.textContent = t("confirm");
        return;
      }
      DB.projects = DB.projects.filter((p) => p.id !== arg);
      markDeleted(arg);
      if (P.id === arg) P = DB.projects[0];
      S.tab = 0;
      saveSoon();
      projectsModal();
      renderAll();
      break;
    case "copyExp":
      copyText($("#expTxt").value, b);
      break;
    case "importProj": {
      const prevP = P,
        n0 = DB.projects.length;
      try {
        const d = JSON.parse($("#impTxt").value);
        const arr = Array.isArray(d) ? d : d.projects ? d.projects : [d];
        arr.forEach((p) => {
          if (!p || !Array.isArray(p.surfaces)) throw 0;
          p.id = uid();
          migrate(p);
          DB.projects.push(p);
          P = p;
          p.surfaces.forEach((s) => compute(s)); // reject files that can't be calculated
        });
        S.tab = 0;
        closeModal();
        renderAll();
        saveSoon();
      } catch (e) {
        DB.projects.length = n0;
        P = prevP;
        b.textContent = t("importErr");
      }
      break;
    }
    case "image":
      exportMenu();
      break;
    case "img":
      closeModal();
      exportImage();
      break;
    case "copyCuts":
      copyText(cutsText(), b);
      break;
  }
}

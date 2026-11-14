"use strict";
/* ================= backups ================= */
/* Once a day (on open / save) a snapshot of all projects + tile library goes to a separate storage key.
   The last BK_KEEP days are kept. Photos are left out of snapshots to keep them small. */
const BKEY = "prusart-tile-layout-backups",
  BK_KEEP = 7,
  BK_OPS = 6;
/* a safety copy right before a big change (template, rebuild from plan, wall delete, reset, delete) */
let bkLastOp = 0;
function bkBefore(op) {
  if (Date.now() - bkLastOp < 60000) return; // one copy per minute is plenty
  bkLastOp = Date.now();
  try {
    bkSnapshot(true, op);
  } catch (e) {}
}
const dayOf = (ts) => new Date(ts).toISOString().slice(0, 10);
function bkList() {
  try {
    return JSON.parse(STORE.get(BKEY) || "[]");
  } catch (e) {
    return [];
  }
}
function bkStrip(o) {
  return JSON.parse(JSON.stringify(o), (k, v) => (k === "tex" ? undefined : v));
}
function bkSnapshot(force, op) {
  const L = bkList(),
    today = dayOf(Date.now()),
    daily = L.filter((b) => !b.op);
  if (!force && daily.length && dayOf(daily[daily.length - 1].t) === today)
    return;
  const snap = {
    t: Date.now(),
    n: DB.projects.length,
    d: bkStrip({ projects: DB.projects, tiles: DB.tiles || [] }),
  };
  if (op) snap.op = op;
  L.push(snap);
  // keep the last BK_KEEP daily copies and the last BK_OPS "before a big change" copies
  const cut = (pred, max) => {
    let k = L.filter(pred).length;
    for (let i = 0; i < L.length && k > max; )
      if (pred(L[i])) {
        L.splice(i, 1);
        k--;
      } else i++;
  };
  cut((b) => !b.op, BK_KEEP);
  cut((b) => !!b.op, BK_OPS);
  for (let i = 0; i < 3; i++) {
    try {
      STORE.set(BKEY, JSON.stringify(L));
      return;
    } catch (e) {
      L.shift(); // storage full: drop the oldest and try again
      if (!L.length) return;
    }
  }
}
function backupFile() {
  const data = JSON.stringify({
    app: "prusart-tile-layout",
    t: Date.now(),
    projects: DB.projects,
    tiles: DB.tiles || [],
  });
  const name = `tile-layout-backup-${dayOf(Date.now())}.json`,
    blob = new Blob([data], { type: "application/json" });
  DB.lastFile = Date.now();
  saveSoon();
  const file =
    typeof File === "function"
      ? new File([blob], name, { type: "application/json" })
      : null;
  if (
    file &&
    navigator.canShare &&
    navigator.canShare({ files: [file] }) &&
    /iP(hone|ad|od)|Android/.test(navigator.userAgent)
  ) {
    navigator.share({ files: [file], title: name }).catch(() => {});
    return;
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 1000);
}
function backupsModal() {
  const L = bkList().slice().reverse();
  const fmtD = (ts) =>
    new Date(ts).toLocaleString(lang === "ru" ? "ru-RU" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  let h = `<h3>💾 ${t("bkT")}</h3><p class="hint">${t("bkHint")}</p>`;
  h += L.length
    ? `<div class="liblist">${L.map(
        (b, i) =>
          `<div class="librow"><div><b>${fmtD(b.t)}</b><br><small>${b.op ? `${t("bkBefore")}: ${esc(b.op)} · ` : ""}${b.n} ${t("bkProjects")}</small></div><div class="btns"><button class="btn sm" data-act="bkRestore:${L.length - 1 - i}">${t("bkRestore")}</button></div></div>`,
      ).join("")}</div>`
    : `<p class="hint">${t("bkNone")}</p>`;
  h += `<p style="margin-top:12px"><b>${t("bkFileT")}</b></p><p class="hint">${t("bkFileHint")}${DB.lastFile ? ` ${t("bkLastFile")} ${fmtD(DB.lastFile)}.` : ""}</p><div class="btns"><button class="btn p" data-act="bkFile">⬇ ${t("bkFile")}</button><button class="btn" data-act="bkOpen">⬆ ${t("bkOpen")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
}
function bkRestore(i) {
  const b = bkList()[i];
  if (!b) return;
  modal(
    `<h3>${t("bkRestoreT")}</h3><p>${t("bkRestoreMsg")}</p><div class="btns"><button class="btn d" data-act="bkRestoreGo:${i}">${t("bkRestore")}</button><button class="btn" data-act="closeModal">${t("cancel")}</button></div>`,
  );
}
function bkApply(d) {
  bkSnapshot(true); // keep what we have now, so the restore itself can be undone from the list
  const projects = (d.projects || []).filter(
    (p) => p && Array.isArray(p.surfaces),
  );
  if (!projects.length) return toast(t("importErr"), false);
  projects.forEach((p) => migrate(p));
  DB.projects = projects;
  if (Array.isArray(d.tiles)) DB.tiles = d.tiles;
  P = DB.projects.find((p) => p.id === (P && P.id)) || DB.projects[0];
  S.tab = 0;
  resetUndo();
  closeModal();
  renderAll();
  saveSoon();
  syncSoon(true);
  toast(t("bkDone"), false);
}
function bkOpenFile() {
  const inp = document.createElement("input");
  inp.type = "file";
  inp.accept = ".json,application/json,text/plain";
  inp.onchange = () => {
    const f = inp.files && inp.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const d = JSON.parse(r.result);
        if (Array.isArray(d.projects)) bkApply(d);
        else throw 0;
      } catch (e) {
        toast(t("importErr"), false);
      }
    };
    r.readAsText(f);
  };
  inp.click();
}

/* ================= sync between devices (private GitHub gist) ================= */
/* DB.sync = { token, gist, on, last }. The gist holds one file with { projects, tiles, deleted }.
   Merge rule: per project the newer `updated` wins; a deletion wins over older edits. */
const GIST_FILE = "prusart-tile-layout.json",
  GH = "https://api.github.com";
let syncT = 0,
  syncBusy = false;
const ghHead = () => ({
  Authorization: "Bearer " + DB.sync.token,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
});
async function ghJSON(path, opt = {}) {
  const r = await fetch(GH + path, Object.assign({ headers: ghHead() }, opt));
  if (!r.ok) {
    const e = new Error("gh " + r.status);
    e.status = r.status;
    throw e;
  }
  return r.status === 204 ? null : r.json();
}
async function gistFind() {
  for (let page = 1; page <= 5; page++) {
    const L = await ghJSON(`/gists?per_page=100&page=${page}`);
    const g = L.find((x) => x.files && x.files[GIST_FILE]);
    if (g) return g.id;
    if (L.length < 100) break;
  }
  const g = await ghJSON("/gists", {
    method: "POST",
    body: JSON.stringify({
      description: "PrusArt Tile Layout — projects (synced by the app)",
      public: false,
      files: {
        [GIST_FILE]: {
          content: JSON.stringify({ projects: [], tiles: [], deleted: {} }),
        },
      },
    }),
  });
  return g.id;
}
async function gistRead() {
  const g = await ghJSON("/gists/" + DB.sync.gist);
  const f = g.files && g.files[GIST_FILE];
  if (!f) return { projects: [], tiles: [], deleted: {} };
  let txt = f.content;
  if (f.truncated && f.raw_url) txt = await (await fetch(f.raw_url)).text();
  try {
    return JSON.parse(txt || "{}");
  } catch (e) {
    return { projects: [], tiles: [], deleted: {} };
  }
}
function syncMerge(loc, rem) {
  const del = Object.assign({}, rem.deleted || {}, loc.deleted || {});
  for (const k in rem.deleted || {})
    del[k] = Math.max(del[k] || 0, rem.deleted[k]);
  const map = {};
  [...(rem.projects || []), ...(loc.projects || [])].forEach((p) => {
    if (!p || !p.id) return;
    const q = map[p.id];
    if (!q || (+p.updated || 0) > (+q.updated || 0)) map[p.id] = p;
  });
  const projects = Object.values(map).filter(
    (p) => !(del[p.id] && del[p.id] >= (+p.updated || 0)),
  );
  const tmap = {};
  [...(rem.tiles || []), ...(loc.tiles || [])].forEach((q) => {
    if (q && q.id && !del["t:" + q.id])
      tmap[q.id] = Object.assign({}, tmap[q.id] || {}, q);
  });
  return { projects, tiles: Object.values(tmap), deleted: del };
}
const projKey = (o) =>
  JSON.stringify(o.projects.map((p) => [p.id, p.updated]).sort()) +
  "|" +
  JSON.stringify(o.tiles.map((q) => q.id).sort());
async function syncNow(manual) {
  const C = DB.sync;
  if (!C || !C.on || !C.token || syncBusy) return;
  if (!navigator.onLine) return manual && toast(t("syOffline"), false);
  syncBusy = true;
  setSyncState("busy");
  try {
    if (!C.gist) C.gist = await gistFind();
    const rem = await gistRead();
    const loc = {
      projects: DB.projects,
      tiles: libTiles(),
      deleted: DB.deleted || {},
    };
    const m = syncMerge(loc, rem);
    const changedLocal = projKey(m) !== projKey(loc);
    const changedRemote =
      projKey(m) !==
        projKey({ projects: rem.projects || [], tiles: rem.tiles || [] }) ||
      JSON.stringify(m.deleted) !== JSON.stringify(rem.deleted || {});
    if (changedLocal) {
      const curId = P && P.id;
      m.projects.forEach((p) => migrate(p));
      DB.projects = m.projects.length ? m.projects : DB.projects;
      DB.tiles = m.tiles;
      const np = DB.projects.find((p) => p.id === curId) || DB.projects[0];
      if (np !== P) {
        P = np;
        resetUndo();
      }
      if (!drag) renderAll();
    }
    DB.deleted = m.deleted;
    if (changedRemote)
      await ghJSON("/gists/" + C.gist, {
        method: "PATCH",
        body: JSON.stringify({
          files: {
            [GIST_FILE]: {
              content: JSON.stringify({ v: 1, t: Date.now(), ...m }),
            },
          },
        }),
      });
    C.last = Date.now();
    C.err = null;
    saveLocal();
    setSyncState("ok");
    if (manual) toast(t("syDone"), false);
  } catch (e) {
    C.err =
      e.status === 401
        ? "token"
        : e.status === 403 || e.status === 404
          ? "access"
          : "net";
    if (e.status === 404) C.gist = null;
    saveLocal();
    setSyncState("err");
    if (manual) toast(t("syErr_" + C.err), false);
  } finally {
    syncBusy = false;
  }
}
// write DB without touching the undo history
function saveLocal() {
  try {
    STORE.set(SKEY, JSON.stringify(DB));
  } catch (e) {}
}
function syncSoon(fast) {
  if (!DB.sync || !DB.sync.on) return;
  clearTimeout(syncT);
  syncT = setTimeout(() => syncNow(false), fast ? 300 : 6000);
}
function setSyncState(st) {
  const b = $("#bProj");
  if (b) b.dataset.sync = st || "";
}
function syncModal() {
  const C = (DB.sync = DB.sync || {}),
    fmtD = (ts) =>
      new Date(ts).toLocaleString(lang === "ru" ? "ru-RU" : "en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
  let h = `<h3>🔄 ${t("syT")}</h3>`;
  if (C.on && C.token) {
    h += `<p>${t("syOn")}</p><p class="hint">${C.last ? t("syLast") + " " + fmtD(C.last) : ""}${C.err ? ` · <b style="color:var(--bad,#b3261e)">${t("syErr_" + C.err)}</b>` : ""}</p>`;
    h += `<div class="btns"><button class="btn p" data-act="syNow">🔄 ${t("syNow")}</button><button class="btn d" data-act="syOff">${t("syOffB")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div><p class="hint">${t("syRule")}</p>`;
  } else {
    h += `<p class="hint">${t("syIntro")}</p><ol class="hint syol">${t("sySteps")}</ol><label class="f"><span>${t("syToken")}</span><input id="syTok" type="password" autocomplete="off" placeholder="ghp_… / github_pat_…"></label><div class="btns"><button class="btn p" data-act="syConnect">${t("syConnect")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div><p class="hint">${t("syRule")}</p>`;
  }
  modal(h);
}
async function syncAct(a, arg) {
  if (a === "bkModal") return backupsModal();
  if (a === "bkFile") return backupFile();
  if (a === "bkOpen") return bkOpenFile();
  if (a === "bkRestore") return bkRestore(+arg);
  if (a === "bkRestoreGo") {
    const b = bkList()[+arg];
    return b && bkApply(b.d);
  }
  if (a === "syModal") return syncModal();
  if (a === "syNow") return syncNow(true).then(syncModal);
  if (a === "syOff") {
    DB.sync = { on: false };
    saveLocal();
    setSyncState("");
    return syncModal();
  }
  if (a === "syConnect") {
    const tok = (($("#syTok") || {}).value || "").trim();
    if (!tok) return;
    DB.sync = { token: tok, on: true, gist: null };
    modal(`<h3>🔄 ${t("syT")}</h3><p class="hint">${t("syConnecting")}</p>`);
    await syncNow(true);
    if (DB.sync.err) {
      const err = DB.sync.err;
      DB.sync = { on: false };
      saveLocal();
      modal(
        `<h3>🔄 ${t("syT")}</h3><p class="warnbox">${t("syErr_" + err)}</p><div class="btns"><button class="btn" data-act="syModal">${t("back")}</button></div>`,
      );
      return;
    }
    return syncModal();
  }
}
// remember deletions so they reach the other devices
function markDeleted(id) {
  DB.deleted = DB.deleted || {};
  DB.deleted[id] = Date.now();
}

/* hooks: snapshot + sync after saves, sync on open and when the app comes back to the screen */
{
  const ss = saveSoon;
  saveSoon = function () {
    ss();
    setTimeout(() => {
      bkSnapshot(false);
      syncSoon(false);
    }, 600);
  };
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") syncSoon(true);
  });
  addEventListener("online", () => syncSoon(true));
  setTimeout(() => {
    bkSnapshot(false);
    if (DB.sync && DB.sync.on) {
      setSyncState(DB.sync.err ? "err" : "ok");
      syncSoon(true);
    }
  }, 800);
}

"use strict";
/* ================= client link =================
   The whole project rides in the link itself (compressed, after #v=), so no server is needed.
   Opening the link shows the layout in client view; nothing is saved on the client's phone
   unless they tap "Save a copy". Tile photos are left out to keep the link short. */
const SHR = {
  ru: {
    btn: "🔗 Ссылка для клиента",
    made: "Ссылка скопирована — отправь клиенту",
    long: "Проект большой: ссылка длинная. Если не откроется — отправь PDF.",
    bar: "Раскладка от PrusArt Inc — только просмотр",
    save: "Сохранить копию",
    saved: "Копия сохранена в проекты",
    bad: "Ссылка повреждена или неполная",
    shareT: "Раскладка плитки",
  },
  en: {
    btn: "🔗 Link for the client",
    made: "Link copied — send it to the client",
    long: "Big project: the link is long. If it doesn't open, send the PDF.",
    bar: "Tile layout by PrusArt Inc — view only",
    save: "Save a copy",
    saved: "Copy saved to projects",
    bad: "The link is damaged or incomplete",
    shareT: "Tile layout",
  },
};
const shr = (k) => (SHR[lang] || SHR.en)[k] || k;
const SHARE_BASE = "https://prusartinc.github.io/prusart-tile-layout/";

// drop embedded pictures (tile photos, mosaic sheets): they would make the link huge
function shareStrip(o) {
  if (Array.isArray(o)) return o.map(shareStrip);
  if (o && typeof o === "object") {
    const r = {};
    for (const k in o) {
      const v = o[k];
      if (typeof v === "string" && v.startsWith("data:") && v.length > 300)
        continue;
      r[k] = shareStrip(v);
    }
    return r;
  }
  return o;
}
const b64u = (u8) => {
  let s = "";
  for (let i = 0; i < u8.length; i += 0x8000)
    s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const unb64u = (s) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  const u = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
  return u;
};
async function zip(str) {
  const cs = new CompressionStream("deflate-raw"),
    w = cs.writable.getWriter();
  w.write(new TextEncoder().encode(str));
  w.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}
async function unzip(u8) {
  const ds = new DecompressionStream("deflate-raw"),
    w = ds.writable.getWriter();
  w.write(u8);
  w.close();
  return new TextDecoder().decode(
    await new Response(ds.readable).arrayBuffer(),
  );
}
async function shareLink() {
  const data = JSON.stringify(shareStrip(P));
  let frag;
  try {
    frag = "z" + b64u(await zip(data));
  } catch (e) {
    frag = "j" + b64u(new TextEncoder().encode(data)); // no compression in this browser
  }
  const url = SHARE_BASE + "#v=" + frag;
  if (url.length > 60000) toast(shr("long"));
  try {
    if (navigator.share) {
      await navigator.share({
        title: `${shr("shareT")} — ${P.name || ""}`,
        url,
      });
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast(shr("made"), false);
  } catch (e) {
    modal(
      `<h3>${shr("btn")}</h3><textarea style="width:100%;height:30vh">${esc(url)}</textarea><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
    );
  }
}
// opening a shared link: show it read-only
async function shareOpen() {
  const m = /#v=([zj])([A-Za-z0-9_-]+)/.exec(location.hash || "");
  if (!m) return false;
  try {
    const u8 = unb64u(m[2]),
      txt = m[1] === "z" ? await unzip(u8) : new TextDecoder().decode(u8),
      p = JSON.parse(txt);
    migrate(p);
    S.shared = p;
    P = p;
    S.client = true;
    S.tab = 0;
    resetUndo();
    showHome(false);
    document.body.classList.add("shared");
    renderAll();
    const bar = document.createElement("div");
    bar.id = "shbar";
    bar.innerHTML = `<span>${shr("bar")}</span><button class="btn sm" data-act="shSave">${shr("save")}</button>`;
    document.body.appendChild(bar);
    return true;
  } catch (e) {
    console.warn(e);
    toast(shr("bad"));
    return false;
  }
}
function shareSave() {
  if (!S.shared) return;
  const p = JSON.parse(JSON.stringify(S.shared));
  p.id = uid();
  DB.projects.push(p);
  S.shared = null;
  P = p;
  history.replaceState(null, "", location.pathname);
  document.body.classList.remove("shared");
  const bar = $("#shbar");
  if (bar) bar.remove();
  saveSoon();
  toast(shr("saved"), false);
}
// while a shared project is open nothing of it is written to this phone's projects
{
  const ss = saveSoon;
  saveSoon = function () {
    if (S.shared) return;
    return ss.apply(this, arguments);
  };
}
STORE.ready.then(() => setTimeout(shareOpen, 0));

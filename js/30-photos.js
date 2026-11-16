"use strict";
/* ================= project photos =================
   Site photos kept with the project on this device (IndexedDB, key "photos:<project id>").
   Each photo: { id, t (time), img (JPEG data URL, max 1600 px), note, sid (surface id or "") }.
   They are not part of backups or sync — they stay on the phone. */
const PHT = {
  ru: {
    title: "Фото проекта",
    add: "＋ Добавить фото",
    none: "Пока нет фото. Сними стены и пол до начала работ — пригодится при раскладке и для клиента.",
    note: "Заметка",
    surf: "Поверхность",
    any: "— весь проект —",
    del: "Удалить фото",
    delQ: "Удалить это фото?",
    back: "← Все фото",
    local:
      "Фото хранятся только на этом устройстве (не в резервных копиях и не в синхронизации).",
    noIdb: "В этом браузере нельзя хранить фото.",
    saving: "Сохраняю фото…",
  },
  en: {
    title: "Project photos",
    add: "＋ Add photos",
    none: "No photos yet. Shoot the walls and floor before you start — handy for the layout and for the client.",
    note: "Note",
    surf: "Surface",
    any: "— whole project —",
    del: "Delete photo",
    delQ: "Delete this photo?",
    back: "← All photos",
    local: "Photos stay on this device only (not in backups or sync).",
    noIdb: "This browser can't store photos.",
    saving: "Saving photos…",
  },
};
const pht = (k) => (PHT[lang] || PHT.en)[k] || k;

const PHDB = (() => {
  let dbp = null;
  const open = () =>
    (dbp =
      dbp ||
      new Promise((res) => {
        try {
          const rq = indexedDB.open("prusart-tile-layout", 1);
          rq.onupgradeneeded = () => rq.result.createObjectStore("kv");
          rq.onsuccess = () => res(rq.result);
          rq.onerror = () => res(null);
        } catch (e) {
          res(null);
        }
      }));
  const get = async (k) => {
    const db = await open();
    if (!db) return null;
    return new Promise((res) => {
      const rq = db.transaction("kv").objectStore("kv").get(k);
      rq.onsuccess = () => res(rq.result == null ? null : rq.result);
      rq.onerror = () => res(null);
    });
  };
  const put = async (k, v) => {
    const db = await open();
    if (!db) return false;
    return new Promise((res) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(v, k);
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    });
  };
  return { get, put, ok: () => !!window.indexedDB };
})();

const photoKey = (pid) => "photos:" + (pid || (P && P.id));
let PHOTOS = { pid: null, list: [] };
async function photosLoad(pid) {
  pid = pid || (P && P.id);
  if (PHOTOS.pid === pid) return PHOTOS.list;
  let list = [];
  try {
    const raw = await PHDB.get(photoKey(pid));
    list = raw ? JSON.parse(raw) : [];
  } catch (e) {
    list = [];
  }
  PHOTOS = { pid, list };
  return list;
}
async function photosSave() {
  if (!PHOTOS.pid) return;
  const ok = await PHDB.put(photoKey(PHOTOS.pid), JSON.stringify(PHOTOS.list));
  if (!ok) toast(pht("noIdb"));
}
// shrink a picked image to a JPEG no wider/taller than 1600 px
function photoShrink(file) {
  return new Promise((res) => {
    const url = URL.createObjectURL(file),
      im = new Image();
    im.onload = () => {
      const k = Math.min(1, 1600 / Math.max(im.width, im.height)),
        c = document.createElement("canvas");
      c.width = Math.round(im.width * k);
      c.height = Math.round(im.height * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.72));
    };
    im.onerror = () => {
      URL.revokeObjectURL(url);
      res(null);
    };
    im.src = url;
  });
}
async function photosModal() {
  if (!PHDB.ok()) return toast(pht("noIdb"));
  const list = await photosLoad(),
    sn = (sid) => {
      const s = P.surfaces.find((x) => x.id === sid);
      return s ? s.name : "";
    };
  let h = `<h3>📷 ${pht("title")} — ${esc(P.name || "")}</h3>`;
  h += `<label class="btn p phadd">${pht("add")}<input type="file" accept="image/*" multiple id="phin" hidden></label>`;
  if (!list.length) h += `<p class="hint">${pht("none")}</p>`;
  else
    h += `<div class="phgrid">${list
      .slice()
      .reverse()
      .map(
        (p) =>
          `<button class="phth" data-act="phView:${p.id}"><img src="${p.img}" alt=""><span>${esc(p.note || sn(p.sid) || new Date(p.t).toLocaleDateString())}</span></button>`,
      )
      .join("")}</div>`;
  h += `<p class="hint">${pht("local")}</p><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
  const inp = $("#phin");
  if (inp)
    inp.onchange = async () => {
      const files = [...inp.files];
      if (!files.length) return;
      toast(pht("saving"), false);
      const sid = !isMulti() && cur() ? cur().id : "";
      for (const f of files) {
        const img = await photoShrink(f);
        if (img)
          PHOTOS.list.push({ id: uid(), t: Date.now(), img, note: "", sid });
      }
      await photosSave();
      photosModal();
    };
}
async function photoView(id) {
  const list = await photosLoad(),
    p = list.find((x) => x.id === id);
  if (!p) return photosModal();
  const opts =
    `<option value="">${pht("any")}</option>` +
    P.surfaces
      .map(
        (s) =>
          `<option value="${s.id}" ${s.id === p.sid ? "selected" : ""}>${esc(s.name)}</option>`,
      )
      .join("");
  modal(
    `<h3>📷 ${new Date(p.t).toLocaleString()}</h3><img class="phbig" src="${p.img}" alt=""><label class="f"><span>${pht("note")}</span><textarea data-phn="${p.id}" rows="2">${esc(p.note || "")}</textarea></label><label class="f"><span>${pht("surf")}</span><select data-phs="${p.id}">${opts}</select></label><div class="btns"><button class="btn" data-act="phots">${pht("back")}</button><button class="btn d" data-act="phDel:${p.id}">🗑 ${pht("del")}</button></div>`,
  );
}
document.addEventListener("change", async (e) => {
  const el = e.target;
  if (!el.dataset) return;
  const id = el.dataset.phn || el.dataset.phs;
  if (!id) return;
  const p = PHOTOS.list.find((x) => x.id === id);
  if (!p) return;
  if (el.dataset.phn) p.note = el.value;
  else p.sid = el.value;
  await photosSave();
});
async function photoAct(a, arg) {
  if (a === "phots") return photosModal();
  if (a === "phView") return photoView(arg);
  if (a === "phDel")
    return modal(
      `<h3>${pht("delQ")}</h3><div class="btns"><button class="btn d" data-act="phDelGo:${arg}">🗑 ${t("del")}</button><button class="btn" data-act="phView:${arg}">${t("cancel")}</button></div>`,
    );
  if (a === "phDelGo") {
    await photosLoad();
    PHOTOS.list = PHOTOS.list.filter((x) => x.id !== arg);
    await photosSave();
    photosModal();
  }
}

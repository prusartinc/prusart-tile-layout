"use strict";
/* ================= line icons =================
   The UI text still carries emoji in many places (menus, headings, buttons).
   Instead of editing every string, text nodes the app renders are scanned once
   when they appear: known emoji become a matching thin line icon in the brand
   style, any other colour emoji is shown in greyscale so nothing shouts.
   Drawings (<svg>), inputs and option lists are left alone. */

const ICO_P = {
  ruler: "M3 17L17 3l4 4L7 21z M7 13l2 2 M10 10l2 2 M13 7l2 2",
  trash: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
  sync: "M20 11a8 8 0 0 0-14.3-4.9L4 8 M4 4v4h4 M4 13a8 8 0 0 0 14.3 4.9L20 16 M20 20v-4h-4",
  save: "M5 4h11l3 3v13H5z M8 4v5h8V4 M8 20v-6h8v6",
  camera:
    "M4 8h3l2-3h6l2 3h3v11H4z M15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1 M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
  book: "M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M8 7h7",
  bricks:
    "M3 5h18v14H3z M3 9.7h18 M3 14.3h18 M9 5v4.7 M15 5v4.7 M6 9.7v4.6 M12 9.7v4.6 M18 9.7v4.6 M9 14.3V19 M15 14.3V19",
  flame:
    "M12 21c-4 0-6-2.7-6-6 0-4 4-6 4-10 3 2 8 6 8 10 0 3.3-2 6-6 6z M12 21c-1.7 0-3-1.2-3-3 0-2 3-4 3-4s3 2 3 4c0 1.8-1.3 3-3 3z",
  pan: "M3 10h14v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z M17 11h4",
  pin: "M12 21s-6-5.4-6-11a6 6 0 0 1 12 0c0 5.6-6 11-6 11z M14.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  hat: "M2 18h20 M4 18v-2a8 8 0 0 1 16 0v2 M12 8V5 M8.5 9.5L8 7 M15.5 9.5L16 7",
  bulb: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  studs: "M2 4h20 M2 20h20 M5 4v16 M10 4v16 M15 4v16 M20 4v16",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7z",
  file: "M6 3h9l4 4v14H6z M14 3v5h5 M9 13h6 M9 17h6",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z M5 11a7 7 0 0 0 14 0 M12 18v3",
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  lock: "M6 11h12v10H6z M8 11V7a4 4 0 0 1 8 0v4",
  max: "M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5",
  gear: "M12 2v3 M12 19v3 M4.9 4.9L7 7 M17 17l2.1 2.1 M2 12h3 M19 12h3 M4.9 19.1L7 17 M17 7l2.1-2.1 M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z",
  kbd: "M3 6h18v12H3z M7 10h.01 M11 10h.01 M15 10h.01 M7 14h10",
  scissors:
    "M9 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M8.5 7.5L20 18 M8.5 16.5L20 6",
  warn: "M12 3L2 20h20z M12 10v4 M12 17h.01",
  pencil: "M4 20h4L19 9l-4-4L4 16z M14 6l4 4",
};
const ICO_EMO = {
  "📐": "ruler",
  "🗑": "trash",
  "🔄": "sync",
  "♻": "sync",
  "💾": "save",
  "📷": "camera",
  "📸": "camera",
  "🔗": "link",
  "📚": "book",
  "🧱": "bricks",
  "🔥": "flame",
  "🍳": "pan",
  "📍": "pin",
  "📌": "pin",
  "👷": "hat",
  "💡": "bulb",
  "🪵": "studs",
  "⚡": "bolt",
  "📄": "file",
  "🎤": "mic",
  "🧩": "grid",
  "🔒": "lock",
  "⛶": "max",
  "⚙": "gear",
  "⌨": "kbd",
  "✂": "scissors",
  "⚠": "warn",
  "✏": "pencil",
};
function ico(name) {
  const d = ICO_P[name];
  return d
    ? `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`
    : "";
}
const EMO_RE = /\p{Extended_Pictographic}️?/u,
  EMO_RE_G = /(\p{Extended_Pictographic})️?/gu,
  EMO_SKIP = new Set([
    "SCRIPT",
    "STYLE",
    "TEXTAREA",
    "OPTION",
    "SELECT",
    "TITLE",
    "INPUT",
  ]);

function emoNode(tn) {
  const s = tn.nodeValue;
  if (!s || !EMO_RE.test(s)) return;
  let p = tn.parentNode;
  for (let e = p; e && e !== document.body; e = e.parentNode) {
    if (
      EMO_SKIP.has(e.nodeName) ||
      e.namespaceURI === "http://www.w3.org/2000/svg"
    )
      return;
    if (e.classList && e.classList.contains("emo")) return;
  }
  const html = esc(s).replace(EMO_RE_G, (m, ch) => {
    const k = ICO_EMO[ch];
    return k ? ico(k) : `<span class="emo">${ch}</span>`;
  });
  const t = document.createElement("template");
  t.innerHTML = html;
  p.replaceChild(t.content, tn);
}
function emoScan(root) {
  if (!root) return;
  if (root.nodeType === 3) return emoNode(root);
  if (root.nodeType !== 1) return;
  if (
    root.namespaceURI === "http://www.w3.org/2000/svg" ||
    EMO_SKIP.has(root.nodeName)
  )
    return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT),
    list = [];
  for (let n = w.nextNode(); n; n = w.nextNode())
    if (EMO_RE.test(n.nodeValue)) list.push(n);
  list.forEach(emoNode);
}
try {
  new MutationObserver((ms) => {
    ms.forEach((m) => {
      if (m.type === "characterData") emoNode(m.target);
      else m.addedNodes.forEach(emoScan);
    });
  }).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
  emoScan(document.body);
} catch (e) {}

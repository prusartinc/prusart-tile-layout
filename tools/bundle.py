#!/usr/bin/env python3
"""Build a single self-contained HTML file (CSS + JS inlined, no PWA/service worker).
Used for the Claude artifact version. Usage: python3 tools/bundle.py out.html"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text()
html = html.replace('<link rel="stylesheet" href="css/app.css">', "<style>\n" + (root / "css/app.css").read_text() + "</style>")
html = re.sub(r'<script src="(js/[^"]+)"></script>', lambda m: "<script>\n" + (root / m.group(1)).read_text() + "</script>", html)
html = re.sub(r'<link rel="manifest"[^>]*>\n?', "", html)
html = re.sub(r"<script>if\('serviceWorker'.*?</script>\n?", "", html, flags=re.S)
pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "bundle.html").write_text(html)

#!/usr/bin/env python3
"""Pack the site into ONE standalone HTML file (farix-standalone.html).

Useful for sharing a preview or opening it on a phone without hosting.
Run from anywhere:  python3 scripts/bundle.py
"""
import base64
import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text(encoding="utf-8")

# inline stylesheet
css = (root / "css" / "styles.css").read_text(encoding="utf-8")
html = html.replace('<link rel="stylesheet" href="css/styles.css">', f"<style>\n{css}\n</style>")

# inline scripts, in the same order as index.html
def inline_script(match):
    src = match.group(1)
    code = (root / src).read_text(encoding="utf-8")
    code = code.replace("</script", "<\\/script")
    return f"<script>\n{code}\n</script>"

html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_script, html)

# inline favicon
svg = (root / "assets" / "favicon.svg").read_bytes()
data = "data:image/svg+xml;base64," + base64.b64encode(svg).decode()
html = html.replace('href="assets/favicon.svg"', f'href="{data}"')

out = root / "farix-standalone.html"
out.write_text(html, encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size // 1024} KB)")

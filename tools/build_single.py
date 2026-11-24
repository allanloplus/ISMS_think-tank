#!/usr/bin/env python3
"""把整個智庫打包成單一 HTML 檔(可離線開啟、可用 Email / LINE 傳檔)。
用法:python3 tools/build_single.py   →  dist/Allans-ISMS-ThinkTank-<期別>.html"""
import base64, json, pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
html = (root / "index.html").read_text("utf8")
cur = re.search(r'current:\s*"([^"]+)"', (root / "data/manifest.js").read_text("utf8")).group(1)
b64 = lambda p, mime: f"data:{mime};base64," + base64.b64encode(p.read_bytes()).decode()
chars = {p.stem: b64(p, "image/webp") for p in sorted((root / "assets/img/chars").glob("*.webp"))}
# CSS
html = html.replace('<link rel="stylesheet" href="assets/css/style.css">', "<style>" + (root / "assets/css/style.css").read_text("utf8") + "</style>")
# JS(資料檔 + 本期期別 + 程式),內嵌圖片對照表放最前面
def inline(m):
    return "<script>" + (root / m.group(1)).read_text("utf8").replace("</script", "<\\/script") + "</script>"
issue = f'<script src="data/issues/{cur}.js"></script>\n<script src="assets/js/app.js"></script>'
html = html.replace('<script src="assets/js/app.js"></script>', issue)
html = html.replace('<script src="data/manifest.js"></script>', "<script>window.TT={inline:" + json.dumps(chars) + '};</script>\n<script src="data/manifest.js"></script>')
html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
# 靜態圖片
html = re.sub(r'(src|href)="assets/img/chars/([\w-]+)\.webp"', lambda m: f'{m.group(1)}="{chars[m.group(2)]}"', html)
html = html.replace('href="assets/img/favicon.png"', f'href="{b64(root / "assets/img/favicon.png", "image/png")}"')
out = root / "dist" / f"Allans-ISMS-ThinkTank-{cur}.html"
out.parent.mkdir(exist_ok=True); out.write_text(html, "utf8")
left = re.findall(r'(?:src|href)="(assets/[^"]+|data/[^"]+)"', html)
print(f"{out.relative_to(root)}  {out.stat().st_size/1024:.0f} KB", "未內嵌:" + str(left) if left else "(全部內嵌)")

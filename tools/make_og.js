/* 產生分享縮圖 og-image.png(1200×630)與 favicon。
 * 用法:node tools/make_og.js            (讀 data/manifest.js 的 current 期別)
 * 每月更新期別資料後執行一次,再 commit og-image.png。 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
load("data/manifest.js"); load(`data/issues/${ctx.TT.manifest.current}.js`);
const I = ctx.TT.issue;
const img = (f) => "data:image/webp;base64," + fs.readFileSync(path.join(root, "assets/img/chars", f)).toString("base64");
const og = I.og || {};
const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@500;700;900&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:"Noto Sans TC","WenQuanYi Zen Hei",sans-serif;color:#12224f;position:relative;
 background:radial-gradient(760px 520px at 86% 8%,#cfe0ff,transparent 65%),radial-gradient(640px 520px at 0 100%,#c9f5ec,transparent 60%),#f3f6fc}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(13,148,136,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(13,148,136,.09) 1px,transparent 1px);background-size:40px 40px;mask-image:linear-gradient(90deg,#000,transparent 75%)}
.l{position:absolute;left:60px;top:48px;width:690px}
.brand{display:flex;align-items:center;gap:14px;font:700 34px "Space Grotesk","Noto Sans TC";letter-spacing:.01em}
.brand i{width:52px;height:52px;border-radius:14px;display:grid;place-items:center;font-style:normal;color:#fff;background:linear-gradient(135deg,#0d9488,#f59e0b)}
.brand b{color:#0d9488}
.chip{display:inline-block;margin-top:30px;padding:6px 20px;border-radius:99px;background:#b45309;color:#fff;font-weight:900;font-size:24px}
h1{font-size:62px;font-weight:900;line-height:1.22;margin-top:16px;letter-spacing:-.01em}
h1 em{font-style:normal;color:#0d9488}
.nums{display:flex;gap:14px;margin-top:26px}
.nums div{border:3px solid;border-radius:20px;padding:6px 22px 10px;font:700 58px/1.1 "Space Grotesk";background:#fff;box-shadow:0 6px 20px rgba(50,75,140,.15)}
.nums small{font:700 22px "Noto Sans TC";margin-left:4px}
.tags{position:absolute;left:60px;bottom:40px;font-size:24px;font-weight:500;color:#4a5a80}
.tags b{color:#b45309}
.allan{position:absolute;right:215px;bottom:-30px;height:560px;filter:drop-shadow(0 18px 26px rgba(40,60,120,.3))}
.arale{position:absolute;right:20px;bottom:-20px;height:470px;filter:drop-shadow(0 18px 26px rgba(40,60,120,.3))}
.glow{position:absolute;right:40px;bottom:-60px;width:520px;height:160px;border-radius:50%;background:radial-gradient(ellipse,rgba(13,148,136,.35),transparent 70%);filter:blur(10px)}
</style></head><body><div class="grid"></div>
<div class="l"><div class="brand"><i>A</i><span>Allan's <b>ISMS智庫</b></span></div>
<div class="chip">${I.label}｜${og.kicker || "本期宣導"}</div>
<h1>${og.title || I.headline}</h1>
<div class="nums">${(og.nums || []).map((n) => `<div style="color:${n[2]};border-color:${n[2]}">${n[0]}<small>${n[1]}</small></div>`).join("")}</div></div>
<div class="tags">${og.foot || "內部 ISMS × 外部法規 × 情資雷達 × <b>🎮 本期小遊戲</b>"}</div>
<div class="glow"></div><img class="allan" src="${img("allan-full.webp")}"><img class="arale" src="${img("arale-full.webp")}">
</body></html>`;
(async () => {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const b = await chromium.launch(proxy ? { proxy: { server: proxy } } : {});
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, ignoreHTTPSErrors: false });
  await p.setContent(html, { waitUntil: "networkidle" }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(root, "og-image.png") });
  await p.setViewportSize({ width: 192, height: 192 });
  await p.setContent(`<body style="margin:0;width:192px;height:192px;border-radius:44px;overflow:hidden;background:linear-gradient(135deg,#1b3a7a,#0f5f6a)"><img src="${img("arale-wink.webp")}" style="width:192px;height:192px;object-fit:cover;object-position:top">`);
  await p.screenshot({ path: path.join(root, "assets/img/favicon.png"), omitBackground: true });
  await b.close(); console.log("og-image.png, favicon.png 已產生");
})();

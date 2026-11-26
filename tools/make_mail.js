/* 產生每月訂閱信(純文字為主,不含任何圖片,避免被信箱封鎖)。
 * 用法:node tools/make_mail.js   → mail/<期別>.txt、mail/<期別>.html、mail/latest.json
 * 內容全部取自當期期別檔;寄送平台把 {{UNSUBSCRIBE}} 換成每位收件人的取消訂閱連結。 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.resolve(__dirname, "..");
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
load("data/manifest.js"); load(`data/issues/${ctx.TT.manifest.current}.js`);
const M = ctx.TT.manifest, I = ctx.TT.issue;
const C = M.contact, base = M.url.replace(/\/$/, "/") + "?issue=" + I.id;
const md = (d) => d.slice(5).replace("-", "/");
const N = 5;

const laws = (I.lawUpdates || []).slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, N);
const news = I.intel.map((x, i) => ({ x, i })).filter(({ x }) => x.cat !== "法規政策" && x.cat !== "標準動態")
  .sort((a, b) => (b.x.hot ? 1 : 0) - (a.x.hot ? 1 : 0) || b.x.date.localeCompare(a.x.date)).slice(0, N);
const headline = I.headline.replace(/\n/g, "");
const subject = `【${M.site}】${I.label}:${headline}`;

/* ── 純文字版 ── */
const L = [];
L.push(`您好,`, ``, `${M.site} ${I.label}已發行,以下是本期摘要。`, ``);
L.push(`■ 本期焦點`, headline, I.sub, `→ 完整解說:${base}#feature`, ``);
L.push(`■ 近期法令法規異動(政府機關必看)`);
laws.forEach((u) => L.push(`・${md(u.date)}[${u.st}]${u.title}(${u.who})`));
L.push(`→ 全部 ${(I.lawUpdates || []).length} 則與官方來源:${base}#latest`, ``);
L.push(`■ 近期重要資安情資(民間企業必看)`);
news.forEach(({ x }) => L.push(`・${md(x.date)}[${x.cat}]${x.title}`));
L.push(`→ 全部情資與建議行動:${base}#intel`, ``);
L.push(`■ 本期小遊戲:${I.game.title}`, I.game.tagline, `→ 玩一局(約 2 分鐘):${base}#game`, ``);
L.push(`■ 進入智庫`, `${M.url}`, `(內部 ISMS 文件、外部法規庫、情資皆可搜尋)`, ``);
L.push(`--`, `${C.title} ${C.name}`, C.email, C.web, ``);
L.push(`您會收到這封信,是因為您是 ${C.name} 顧問的客戶,或曾申請訂閱並經同意。`, `本信每月隨新一期發行寄送一次。取消訂閱:{{UNSUBSCRIBE}}`);
const text = L.join("\n") + "\n";

/* ── 極簡 HTML 版(無圖片、無外部資源;給不顯示純文字的信箱用) ── */
const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const a = (href, t) => `<a href="${e(href)}" style="color:#0d7a70">${e(t)}</a>`;
const h = (t) => `<h2 style="font-size:17px;margin:26px 0 8px;padding-left:10px;border-left:4px solid #0d9488;color:#12224f">${e(t)}</h2>`;
const li = (t) => `<li style="margin:0 0 7px">${t}</li>`;
const html = `<!doctype html><html lang="zh-Hant"><body style="margin:0;background:#f3f6fc">
<div style="max-width:620px;margin:0 auto;padding:24px 20px;font-family:'Microsoft JhengHei','PingFang TC',sans-serif;font-size:15px;line-height:1.75;color:#17264f;background:#ffffff">
<p style="margin:0 0 4px;font-size:13px;color:#5d6d92">${e(M.site)}・${e(I.label)}</p>
<h1 style="font-size:22px;line-height:1.4;margin:0 0 10px;color:#0b1740">${e(headline)}</h1>
<p style="margin:0 0 12px">${e(I.sub)}</p>
<p style="margin:0">${a(base + "#feature", "看本期焦點完整解說 →")}</p>
${h("近期法令法規異動(政府機關必看)")}
<ul style="margin:0;padding-left:20px">${laws.map((u) => li(`<b>${md(u.date)}</b>〔${e(u.st)}〕${e(u.title)} <span style="color:#5d6d92">(${e(u.who)})</span>`)).join("")}</ul>
<p style="margin:8px 0 0">${a(base + "#latest", `全部 ${(I.lawUpdates || []).length} 則與官方來源 →`)}</p>
${h("近期重要資安情資(民間企業必看)")}
<ul style="margin:0;padding-left:20px">${news.map(({ x, i }) => li(`<b>${md(x.date)}</b>〔${e(x.cat)}〕${a(base + "#intel-" + i, x.title)}`)).join("")}</ul>
<p style="margin:8px 0 0">${a(base + "#intel", "全部情資與建議行動 →")}</p>
${h("本期小遊戲:" + I.game.title)}
<p style="margin:0">${e(I.game.tagline)} ${a(base + "#game", "玩一局(約 2 分鐘)→")}</p>
<p style="margin:26px 0 0;padding:14px 16px;background:#eef3fb;border-radius:8px">${a(M.url, "進入 " + M.site)}<br><span style="font-size:13px;color:#5d6d92">內部 ISMS 文件、外部法規庫、情資皆可搜尋</span></p>
<p style="margin:26px 0 0;padding-top:14px;border-top:1px solid #dfe6f3;font-size:14px">${e(C.title)} <b>${e(C.name)}</b><br>${a("mailto:" + C.email, C.email)}・${a(C.web, C.web.replace(/^https?:\/\//, ""))}</p>
<p style="margin:14px 0 0;font-size:12.5px;color:#5d6d92">您會收到這封信,是因為您是 ${e(C.name)} 顧問的客戶,或曾申請訂閱並經同意。本信每月隨新一期發行寄送一次。<a href="{{UNSUBSCRIBE}}" style="color:#5d6d92">取消訂閱</a></p>
</div></body></html>
`;

const out = path.join(root, "mail"); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, I.id + ".txt"), `主旨:${subject}\n寄件人:${C.title} ${C.name} <${C.email}>\n${"─".repeat(30)}\n` + text);
fs.writeFileSync(path.join(out, I.id + ".html"), html);
fs.writeFileSync(path.join(out, "latest.json"), JSON.stringify({ issue: I.id, label: I.label, published: I.published, subject, from: { name: `${C.title} ${C.name}`, email: C.email }, text, html }, null, 1));
console.log(`mail/${I.id}.txt、.html、latest.json 已產生\n主旨:${subject}`);

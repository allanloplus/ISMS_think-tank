/* 產生每月訂閱信(純文字版 + 不含任何圖片的 HTML 版,避免被信箱封鎖)。
 * 用法:node tools/make_mail.js   → mail/<期別>.txt、mail/<期別>.html、mail/latest.json
 * 內容全部取自當期期別檔;寄送平台把 {{UNSUBSCRIBE}} 換成每位收件人的取消訂閱連結。 */
const fs = require("fs"), path = require("path"), vm = require("vm");
const root = path.resolve(__dirname, "..");
const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
const load = (f) => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8"), ctx);
load("data/manifest.js"); load(`data/issues/${ctx.TT.manifest.current}.js`);
const M = ctx.TT.manifest, I = ctx.TT.issue;
const HOME = M.home || M.url;
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
L.push(`■ 進入智庫`, `${HOME}`, `(內部 ISMS 文件、外部法規庫、情資皆可搜尋)`, ``);
L.push(`--`, `${C.title} ${C.name}`, C.email, C.web, ``);
L.push(`您會收到這封信,是因為您是 ${C.name} 顧問的客戶,或曾申請訂閱並經同意。`, `本信每月隨新一期發行寄送一次。取消訂閱:{{UNSUBSCRIBE}}`);
const text = L.join("\n") + "\n";

/* ── HTML 版:不用任何圖片與外部資源,靠色塊、徽章、對話泡泡、大數字與 emoji 做出層次。
      全部用 table + 行內樣式,Gmail / Outlook / 手機信箱都能正常顯示。 ── */
const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const F = "font-family:'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif;";
const K = { navy: "#12224f", teal: "#0d9488", tealBg: "#e3faf5", amber: "#b45309", amberBg: "#fff4dc", ink: "#17264f", mut: "#5d6d92", line: "#e1e8f4", bg: "#eef2f9" };
const btn = (href, t, bg, fg) => `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 6px 8px 0"><tr><td style="background:${bg};border-radius:999px;padding:10px 20px"><a href="${e(href)}" style="${F}color:${fg || "#fff"};font-size:15px;font-weight:bold;text-decoration:none">${e(t)}</a></td></tr></table>`;
const badge = (t, bg, fg) => `<span style="display:inline-block;background:${bg};color:${fg};font-size:12px;font-weight:bold;padding:1px 9px;border-radius:999px;white-space:nowrap">${e(t)}</span>`;
const ST = { 已發布: ["#fde8c4", K.amber], 已施行: ["#d1fae5", "#047857"], 已生效: ["#d1fae5", "#047857"], 預告中: ["#dbe7ff", "#1d4ed8"], 待施行: ["#ffe4d1", "#c2410c"], 即將生效: ["#ffe4d1", "#c2410c"] };
const dateBox = (d, c) => `<td width="54" valign="top" style="padding:10px 0"><div style="${F}background:${c};color:#fff;border-radius:8px;text-align:center;font-size:15px;font-weight:bold;line-height:1.3;padding:6px 0">${md(d)}</div></td>`;
const row = (d, c, inner) => `<tr>${dateBox(d, c)}<td valign="top" style="${F}padding:10px 0 10px 12px;border-bottom:1px solid ${K.line};font-size:15px;line-height:1.6;color:${K.ink}">${inner}</td></tr>`;
const card = (icon, title, tag, color, bg, rows, more) => `
<tr><td style="padding:22px 24px 0">
 <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${K.line};border-top:5px solid ${color};border-radius:14px;background:#ffffff">
  <tr><td style="${F}padding:16px 18px 4px;font-size:18px;font-weight:bold;color:${K.navy}">${icon} ${e(title)} &nbsp;${badge(tag, bg, color)}</td></tr>
  <tr><td style="padding:0 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>
  <tr><td style="${F}padding:12px 18px 16px;font-size:14px"><a href="${e(more[0])}" style="color:${color};font-weight:bold;text-decoration:none">${e(more[1])} →</a></td></tr>
 </table></td></tr>`;
const say = (who, name, text, bg, bd, right) => `<tr><td align="${right ? "right" : "left"}" style="padding:0 0 8px"><table role="presentation" cellpadding="0" cellspacing="0" style="max-width:88%"><tr><td style="${F}background:${bg};border:1px solid ${bd};border-radius:${right ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};padding:10px 14px;font-size:14.5px;line-height:1.6;color:${K.ink}"><b style="color:${bd}">${who} ${e(name)}</b><br>${e(text)}</td></tr></table></td></tr>`;
const D = I.dialogue || [], nums = (I.og && I.og.nums) || [];
const who = { arale: ["👧", "阿拉雷", K.tealBg, K.teal], allan: ["👨‍🏫", "Allan 顧問", K.amberBg, K.amber] };
const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(subject)}</title></head>
<body style="margin:0;padding:0;background:${K.bg}">
<div style="display:none;max-height:0;overflow:hidden">${e(I.sub)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${K.bg}"><tr><td align="center" style="padding:18px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden">

<tr><td style="background:${K.teal};padding:12px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
 <td style="${F}color:#ffffff;font-size:17px;font-weight:bold">🛡️ ${e(M.site)}</td>
 <td align="right"><span style="${F}display:inline-block;background:#ffffff;color:${K.teal};font-size:13px;font-weight:bold;padding:3px 12px;border-radius:999px">${e(I.label)}</span></td></tr></table></td></tr>

<tr><td style="background:${K.navy};padding:26px 24px 22px">
 <div style="${F}display:inline-block;border:1px solid #fbbf24;color:#fbbf24;font-size:13px;font-weight:bold;padding:2px 12px;border-radius:999px">📌 本期焦點</div>
 <div style="${F}color:#ffffff;font-size:27px;font-weight:bold;line-height:1.35;margin:12px 0 8px">${e(I.headline).replace(/\n/g, "<br>")}</div>
 <div style="${F}color:#c7d5f5;font-size:15px;line-height:1.7;margin:0 0 16px">${e(I.sub)}</div>
 ${nums.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr>${nums.map((n) => `<td style="padding-right:10px"><div style="${F}background:#ffffff;border-radius:12px;padding:6px 16px;text-align:center"><span style="font-size:30px;font-weight:bold;color:${n[2]};line-height:1.2">${e(n[0])}</span><span style="font-size:14px;font-weight:bold;color:${n[2]}"> ${e(n[1])}</span></div></td>`).join("")}</tr></table>` : ""}
 ${btn(base + "#feature", "看完整解說 →", "#f59e0b", "#1a1300")}${btn(base + "#game", "🎮 玩小遊戲", "#2b3c75", "#ffffff")}
</td></tr>

${D.length >= 2 ? `<tr><td style="padding:20px 24px 4px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
 ${D.slice(0, 3).map((d, i) => say(who[d.who][0], who[d.who][1], d.text, who[d.who][2], who[d.who][3], d.who === "allan")).join("")}
</table></td></tr>` : ""}

${card("🏛️", "近期法令法規異動", "政府機關必看", K.amber, K.amberBg,
  laws.map((u) => row(u.date, K.amber, `${badge(u.st, (ST[u.st] || ST.已發布)[0], (ST[u.st] || ST.已發布)[1])} <span style="color:${K.mut};font-size:13px">${e(u.who)}</span><br><b>${e(u.title)}</b>`)).join(""),
  [base + "#latest", `看全部 ${(I.lawUpdates || []).length} 則與官方來源`])}

${card("🏢", "近期重要資安情資", "民間企業必看", K.teal, K.tealBg,
  news.map(({ x, i }) => row(x.date, x.hot ? "#e11d48" : K.teal, `${badge(x.cat, K.tealBg, K.teal)}${x.hot ? " " + badge("重點", "#ffe4e6", "#e11d48") : ""}<br><a href="${e(base + "#intel-" + i)}" style="color:${K.ink};font-weight:bold;text-decoration:none">${e(x.title)}</a>`)).join(""),
  [base + "#intel", "看全部情資與建議行動"])}

<tr><td style="padding:22px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${K.amberBg};border:2px dashed #f59e0b;border-radius:14px"><tr><td style="${F}padding:18px 20px">
 <div style="font-size:19px;font-weight:bold;color:${K.navy}">🎮 本期小遊戲:${e(I.game.title)}</div>
 <div style="font-size:15px;line-height:1.7;color:${K.ink};margin:6px 0 12px">${e(I.game.tagline)}</div>
 ${btn(base + "#game", "玩一局,約 2 分鐘 ▶", K.amber)}
</td></tr></table></td></tr>

<tr><td align="center" style="padding:22px 24px 6px">
 <div style="${F}font-size:14px;color:${K.mut};margin-bottom:10px">智庫內容都可以搜尋,想找什麼直接進來查 👇</div>
 ${btn(HOME, "🔎 進入智庫", K.teal)}${btn(M.url + "#external", "📚 外部法規庫", "#e8eef9", K.navy)}${btn(M.url + "#internal", "📁 內部 ISMS", "#e8eef9", K.navy)}
</td></tr>

<tr><td style="padding:18px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fc;border-radius:14px"><tr>
 <td width="56" valign="top" style="padding:16px 0 16px 18px;font-size:34px;line-height:1">👨‍🏫</td>
 <td style="${F}padding:16px 18px;font-size:14.5px;line-height:1.7;color:${K.ink}"><b style="font-size:16px">${e(C.name)}</b> <span style="color:${K.mut}">${e(C.title)}</span><br>
  ✉️ <a href="mailto:${e(C.email)}" style="color:${K.teal}">${e(C.email)}</a> &nbsp; 🌐 <a href="${e(C.web)}" style="color:${K.teal}">${e(C.web.replace(/^https?:\/\//, ""))}</a></td></tr></table></td></tr>

<tr><td style="${F}padding:16px 24px 24px;font-size:12.5px;line-height:1.7;color:${K.mut}">您會收到這封信,是因為您是 ${e(C.name)} 顧問的客戶,或曾申請訂閱並經同意。本信每月隨新一期發行寄送一次。不想再收到?<a href="{{UNSUBSCRIBE}}" style="color:${K.mut}">取消訂閱</a></td></tr>
</table></td></tr></table>
</body></html>
`;

// emoji 轉成 &#數字;:直接放進 HTML 信件會被部分寄信服務弄成亂碼
const htmlOut = html.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, (c) => "&#" + c.codePointAt(0) + ";");
const out = path.join(root, "mail"); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, I.id + ".txt"), `主旨:${subject}\n寄件人:${C.title} ${C.name} <${C.email}>\n${"─".repeat(30)}\n` + text);
fs.writeFileSync(path.join(out, I.id + ".html"), htmlOut);
fs.writeFileSync(path.join(out, "latest.json"), JSON.stringify({ issue: I.id, label: I.label, published: I.published, subject, from: { name: `${C.title} ${C.name}`, email: C.email }, text, html: htmlOut }, null, 1));
console.log(`mail/${I.id}.txt、.html、latest.json 已產生\n主旨:${subject}`);

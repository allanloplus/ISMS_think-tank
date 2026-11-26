/**
 * Allan's ISMS智庫 — 訂閱管理(Google Apps Script,綁定在「訂閱名單」試算表上)
 *
 * 做什麼:
 *  1. 接收智庫網站 subscribe.html 的「申請訂閱」→ 寫入名單,狀態為「待審」,並寄信通知 Allan
 *  2. Allan 在試算表把狀態改成「核准」→ 自動補上日期與取消碼,並寄歡迎信
 *  3. 選單「ISMS智庫 → 發送本期」→ 抓智庫最新一期的信件內容,寄給所有「核准」的人(每期每人只寄一次)
 *  4. 收件人按信尾「取消訂閱」→ 狀態改成「取消」,之後不再寄送
 *  5. 選單「主動發送」→ 在「主動發送」工作表寫主旨與內文,隨時寄給全部或指定的核准訂閱者
 *
 * 安裝步驟見同資料夾的 README.md。請用 isms@123hi.org 這個帳號建立,信才會從這個地址寄出。
 */

const CFG = {
  SITE: "https://allanloplus.github.io/ISMS_think-tank/",   // 智庫實際位址(結尾要有 /):訂閱頁、取消連結、信件內容檔都在這裡
  HOME: "https://www.123hi.org/isms%E6%99%BA%E5%BA%AB",        // 對外公布的入口網址
  SENDER_NAME: "ISMS智庫顧問 Allan Lo",
  CONTACT: "isms@123hi.org",                                 // 申請通知寄到這裡;也是信件的回覆地址
  LIST: "訂閱名單",
  LOG: "寄送紀錄",
  COMPOSE: "主動發送",
  HOURLY_CAP: 60                                             // 每小時最多受理幾筆線上申請,防止被灌爆
};
const HEAD = ["Email", "姓名", "單位", "狀態", "來源", "申請時間", "核准時間", "取消時間", "取消碼", "最近寄送期別", "備註"];
const C = { email: 1, name: 2, org: 3, status: 4, source: 5, applied: 6, approved: 7, cancelled: 8, token: 9, last: 10, note: 11 };
const ST = { PENDING: "待審", OK: "核准", CANCEL: "取消", REJECT: "退回" };

/* ───────── 選單與初始化 ───────── */
function onOpen() {
  SpreadsheetApp.getUi().createMenu("ISMS智庫")
    .addItem("① 初始化(第一次使用)", "setup")
    .addSeparator()
    .addItem("預覽本期(只寄給我自己)", "sendPreview")
    .addItem("發送本期給所有「核准」的訂閱者", "sendIssue")
    .addSeparator()
    .addItem("主動發送:開啟撰寫表", "openCompose")
    .addItem("主動發送:預覽(只寄給我自己)", "previewCustom")
    .addItem("主動發送:寄出", "sendCustom")
    .addSeparator()
    .addItem("名單統計", "showStats")
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CFG.LIST) || ss.insertSheet(CFG.LIST, 0);
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, HEAD.length).setValues([HEAD]);
  sh.getRange(1, 1, 1, HEAD.length).setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");
  sh.setFrozenRows(1);
  sh.getRange(2, C.status, sh.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList([ST.PENDING, ST.OK, ST.CANCEL, ST.REJECT], true).setAllowInvalid(false).build());
  [220, 110, 170, 70, 90, 140, 140, 140, 120, 110, 200].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.hideColumns(C.token);
  let lg = ss.getSheetByName(CFG.LOG) || ss.insertSheet(CFG.LOG);
  if (lg.getLastRow() === 0) lg.getRange(1, 1, 1, 6).setValues([["時間", "動作", "期別", "成功", "失敗", "說明"]]).setFontWeight("bold");
  // 可安裝的編輯觸發器:改狀態時才能自動寄歡迎信(一般的 onEdit 沒有寄信權限)
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "onStatusEdit").forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger("onStatusEdit").forSpreadsheet(ss).onEdit().create();
  SpreadsheetApp.getUi().alert("初始化完成 ✅\n\n接下來:\n1. 部署 → 新增部署作業 → 網頁應用程式(執行身分:我;存取權:所有人)\n2. 把部署後的網址交給 Claude 填進智庫網站\n\n之後要手動加人:直接在名單新增一列,填 Email 並把狀態選成「核准」即可。");
}

/* ───────── 試算表:改狀態時自動處理 ───────── */
function onStatusEdit(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== CFG.LIST || e.range.getColumn() !== C.status || e.range.getRow() < 2 || e.range.getNumRows() > 1) return;
  const r = e.range.getRow(), now = new Date(), v = String(e.value || ""), old = String(e.oldValue || "");
  const email = String(sh.getRange(r, C.email).getValue()).trim().toLowerCase();
  if (!sh.getRange(r, C.token).getValue()) sh.getRange(r, C.token).setValue(newToken_());
  if (!sh.getRange(r, C.source).getValue()) sh.getRange(r, C.source).setValue("手動建立");
  if (v === ST.OK && old !== ST.OK) {
    sh.getRange(r, C.approved).setValue(now); sh.getRange(r, C.cancelled).clearContent();
    if (isEmail_(email)) {
      const name = sh.getRange(r, C.name).getValue(), token = sh.getRange(r, C.token).getValue();
      send_(email, "【Allan's ISMS智庫】訂閱已開通",
        (name ? name + " " : "") + "您好,\n\n您的「Allan's ISMS智庫」每月電子報訂閱已開通。\n之後每月新一期發行時,會寄一封本期摘要給您,內容以文字為主,點連結即可進入智庫閱讀。\n\n現在就可以進入智庫:\n" + CFG.HOME +
        "\n\n--\n" + CFG.SENDER_NAME + "\n" + CFG.CONTACT + "\n\n不想再收到?取消訂閱:" + unsubUrl_(token) + "\n");
    }
  }
  if (v === ST.CANCEL) sh.getRange(r, C.cancelled).setValue(now);
}

/* ───────── 網站端 API(subscribe.html 呼叫) ───────── */
function doGet() { return json_({ ok: true, service: "isms-think-tank-subscription" }); }

function doPost(e) {
  try {
    const p = (e && e.parameter) || {}, action = String(p.action || "");
    if (p.website) return json_({ ok: true });                         // 蜜罐欄位:機器人才會填
    if (action === "apply") return json_(apply_(p));
    if (action === "unsubscribe") return json_(unsubscribe_(p));
    if (action === "unsubscribeRequest") return json_(unsubscribeRequest_(p));
    return json_({ ok: false, msg: "不支援的動作" });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, msg: "系統忙碌中,請稍後再試,或來信 " + CFG.CONTACT });
  }
}

function apply_(p) {
  const email = String(p.email || "").trim().toLowerCase(), name = clean_(p.name, 40), org = clean_(p.org, 60);
  if (!isEmail_(email) || !name || !org) return { ok: false, msg: "請完整填寫姓名、單位與正確的 Email。" };
  if (p.consent !== "1") return { ok: false, msg: "請先勾選同意個人資料告知事項。" };
  if (!throttle_("a:" + email, 120) || !hourlyOk_()) return { ok: true };           // 太頻繁:靜默略過
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = list_(), r = findRow_(sh, C.email, email), now = new Date();
    if (r < 0) {
      sh.appendRow([email, safe_(name), safe_(org), ST.PENDING, "線上申請", now, "", "", newToken_(), "", ""]);
      notifyOwner_(email, name, org, "新申請");
    } else {
      const st = String(sh.getRange(r, C.status).getValue());
      if (st === ST.CANCEL || st === ST.REJECT) {                                    // 曾取消或被退回 → 重新送審
        sh.getRange(r, C.name, 1, 2).setValues([[safe_(name), safe_(org)]]);
        sh.getRange(r, C.status).setValue(ST.PENDING); sh.getRange(r, C.applied).setValue(now);
        notifyOwner_(email, name, org, "重新申請(原狀態:" + st + ")");
      }                                                                              // 已待審或已核准:不動
    }
  } finally { lock.releaseLock(); }
  return { ok: true };            // 一律回同樣的訊息,不透露這個 Email 是否已在名單內
}

function unsubscribe_(p) {
  const token = String(p.token || "").trim();
  if (!/^[a-f0-9]{24,64}$/.test(token)) return { ok: false, msg: "取消連結無效或已過期。" };
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = list_(), r = findRow_(sh, C.token, token);
    if (r < 0) return { ok: false, msg: "取消連結無效或已過期。" };
    if (String(sh.getRange(r, C.status).getValue()) !== ST.CANCEL) {
      sh.getRange(r, C.status).setValue(ST.CANCEL); sh.getRange(r, C.cancelled).setValue(new Date());
      sh.getRange(r, C.note).setValue("收件人自行取消");
    }
  } finally { lock.releaseLock(); }
  return { ok: true };
}

/* 沒有信尾連結時:輸入 Email,系統把取消連結寄到那個信箱(避免別人替你取消) */
function unsubscribeRequest_(p) {
  const email = String(p.email || "").trim().toLowerCase();
  if (!isEmail_(email)) return { ok: false, msg: "請輸入正確的 Email。" };
  if (!throttle_("u:" + email, 300) || !hourlyOk_()) return { ok: true };
  const sh = list_(), r = findRow_(sh, C.email, email);
  if (r > 0 && [ST.OK, ST.PENDING].indexOf(String(sh.getRange(r, C.status).getValue())) >= 0) {
    send_(email, "【Allan's ISMS智庫】取消訂閱確認", "您好,\n\n我們收到取消訂閱「Allan's ISMS智庫」電子報的要求。\n請點以下連結完成取消:\n" + unsubUrl_(sh.getRange(r, C.token).getValue()) +
      "\n\n如果這不是您本人的操作,請忽略這封信,訂閱不會有任何變動。\n\n--\n" + CFG.SENDER_NAME + "\n" + CFG.CONTACT + "\n");
  }
  return { ok: true };
}

/* ───────── 寄送本期 ───────── */
function fetchIssue_() {
  const res = UrlFetchApp.fetch(CFG.SITE + "mail/latest.json?t=" + Date.now(), { muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error("讀不到智庫的信件內容(" + res.getResponseCode() + ")。請確認新一期已合併上線。");
  const m = JSON.parse(res.getContentText("UTF-8"));
  if (!m.issue || !m.subject || !m.text || !m.html) throw new Error("信件內容格式不完整。");
  return m;
}

function sendPreview() {
  const ui = SpreadsheetApp.getUi(), me = Session.getActiveUser().getEmail(), m = fetchIssue_();
  sendIssueMail_(me, "[預覽] " + m.subject, m, CFG.SITE + "subscribe.html");
  ui.alert("已寄出預覽 ✅\n\n期別:" + m.label + "\n主旨:" + m.subject + "\n收件人:" + me + "\n\n確認內容與連結都正確後,再執行「發送本期」。");
}

function sendIssue() {
  const ui = SpreadsheetApp.getUi(), m = fetchIssue_(), sh = list_();
  const rows = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getValues();
  const todo = [];
  rows.forEach((v, i) => {
    const email = String(v[C.email - 1]).trim().toLowerCase();
    if (v[C.status - 1] === ST.OK && isEmail_(email) && String(v[C.last - 1]) !== m.issue) todo.push({ row: i + 2, email: email, token: v[C.token - 1] });
  });
  if (!todo.length) return ui.alert("沒有需要寄送的對象。\n\n「核准」的訂閱者都已收過 " + m.label + ",或名單內尚無核准的人。");
  const quota = MailApp.getRemainingDailyQuota();
  if (quota < todo.length) return ui.alert("今日剩餘寄信額度只有 " + quota + " 封,不足以寄給 " + todo.length + " 人。請明天再寄;已寄過的人不會重複收到。");
  if (ui.alert("確認發送", "期別:" + m.label + "\n主旨:" + m.subject + "\n\n將寄給 " + todo.length + " 位「核准」的訂閱者。確定嗎?", ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  let ok = 0; const fail = [];
  todo.forEach((t) => {
    try {
      let token = t.token; if (!token) { token = newToken_(); sh.getRange(t.row, C.token).setValue(token); }
      sendIssueMail_(t.email, m.subject, m, unsubUrl_(token));
      sh.getRange(t.row, C.last).setValue(m.issue); ok++;
    } catch (err) { fail.push(t.email + ":" + err.message); }
  });
  SpreadsheetApp.getActive().getSheetByName(CFG.LOG).appendRow([new Date(), "發送本期", m.issue, ok, fail.length, fail.join(";")]);
  ui.alert("發送完成\n\n成功:" + ok + " 封\n失敗:" + fail.length + " 封" + (fail.length ? "\n\n" + fail.join("\n") + "\n\n失敗的人下次執行「發送本期」會再補寄。" : ""));
}

function sendIssueMail_(to, subject, m, unsub) {
  MailApp.sendEmail(to, subject, m.text.split("{{UNSUBSCRIBE}}").join(unsub),
    { htmlBody: ent_(m.html.split("{{UNSUBSCRIBE}}").join(unsub)), name: CFG.SENDER_NAME, replyTo: CFG.CONTACT });
}

/* ───────── 主動發送:隨時寫一封信寄給訂閱者(重大弱點提醒、活動通知…) ───────── */
const WHO = { ALL: "全部核准的訂閱者", ORG: "單位名稱包含關鍵字", EMAIL: "指定 Email(需在核准名單內)" };
const CP = { subject: 2, body: 3, btnText: 4, btnUrl: 5, who: 6, cond: 7, last: 8 };   // 「主動發送」工作表 B 欄的列號

function openCompose() { compose_().activate(); }

function compose_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(CFG.COMPOSE);
  if (sh) return sh;
  sh = ss.insertSheet(CFG.COMPOSE);
  sh.getRange(1, 1, 8, 3).setValues([
    ["主動發送", "在 B 欄填寫 → 選單「主動發送:預覽」確認 → 「主動發送:寄出」", ""],
    ["主旨", "", "必填。系統會自動在前面加上【Allan's ISMS智庫】"],
    ["內文", "", "必填。直接打字,按 Alt+Enter 換行;貼上網址會自動變成連結。開頭問候與結尾署名系統會自動加,不用寫。"],
    ["按鈕文字", "", "可不填。例如:看完整說明"],
    ["按鈕連結", "", "可不填。填了按鈕文字就要填連結(https:// 開頭)"],
    ["收件對象", WHO.ALL, "下拉選擇"],
    ["對象條件", "", "選「單位名稱包含關鍵字」時填關鍵字;選「指定 Email」時填 Email,多個用逗號分隔"],
    ["上次寄出", "", "系統自動填寫,請勿修改"]
  ]);
  sh.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#0d9488").setFontColor("#ffffff");
  sh.getRange(2, 1, 7, 1).setFontWeight("bold");
  sh.getRange(CP.who, 2).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList([WHO.ALL, WHO.ORG, WHO.EMAIL], true).setAllowInvalid(false).build());
  sh.setColumnWidth(1, 100); sh.setColumnWidth(2, 520); sh.setColumnWidth(3, 420);
  sh.getRange(1, 2, 8, 2).setWrap(true); sh.getRange(1, 1, 8, 3).setVerticalAlignment("top"); sh.setRowHeight(CP.body, 220);
  return sh;
}

function readCompose_() {
  const sh = compose_(), g = (r) => String(sh.getRange(r, 2).getValue() || "").trim();
  const m = { sh: sh, subject: g(CP.subject).replace(/[\r\n]+/g, " ").slice(0, 120), body: g(CP.body), btnText: g(CP.btnText), btnUrl: g(CP.btnUrl), who: g(CP.who) || WHO.ALL, cond: g(CP.cond) };
  if (!m.subject || !m.body) throw new Error("請先在「主動發送」工作表填寫主旨與內文。");
  if (m.btnText && !/^https:\/\/\S+$/.test(m.btnUrl)) throw new Error("有填按鈕文字時,按鈕連結必須是 https:// 開頭的網址。");
  if (!m.btnText) m.btnUrl = "";
  if (m.who !== WHO.ALL && !m.cond) throw new Error("收件對象選了「" + m.who + "」,請填寫「對象條件」。");
  m.fullSubject = "【Allan's ISMS智庫】" + m.subject;
  m.hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, m.subject + "\n" + m.body + "\n" + m.who + "\n" + m.cond, Utilities.Charset.UTF_8)).slice(0, 12);
  return m;
}

/* 收件人一律限於「核准」的訂閱者:沒同意訂閱的人不會收到 */
function recipients_(m) {
  const sh = list_(), rows = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).getValues();
  const want = m.who === WHO.EMAIL ? m.cond.split(/[\s,;,、]+/).map((s) => s.trim().toLowerCase()).filter(String) : [];
  const key = m.cond.toLowerCase(), out = [], seen = {};
  rows.forEach((v, i) => {
    const email = String(v[C.email - 1]).trim().toLowerCase();
    if (v[C.status - 1] !== ST.OK || !isEmail_(email) || seen[email]) return;
    if (m.who === WHO.ORG && String(v[C.org - 1]).toLowerCase().indexOf(key) < 0) return;
    if (m.who === WHO.EMAIL && want.indexOf(email) < 0) return;
    seen[email] = 1; out.push({ row: i + 2, email: email, name: String(v[C.name - 1] || "").replace(/^'/, ""), token: v[C.token - 1] });
  });
  return { list: out, skipped: want.filter((e) => !seen[e]) };
}

/* emoji 等超出基本字元平面的字,直接放進 HTML 信件會被寄信服務弄成亂碼(�);轉成 &#數字; 的純 ASCII 寫法就不受影響 */
function ent_(html) { return String(html).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function (c) { return "&#" + c.codePointAt(0) + ";"; }); }

function esc_(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

function customMail_(m, name, unsub) {
  const hi = (name ? name + " " : "") + "您好,";
  const text = hi + "\n\n" + m.body + (m.btnText ? "\n\n→ " + m.btnText + ":" + m.btnUrl : "") +
    "\n\n進入智庫:" + CFG.HOME + "\n\n--\n" + CFG.SENDER_NAME + "\n" + CFG.CONTACT +
    "\n\n您會收到這封信,是因為您訂閱了 Allan's ISMS智庫。取消訂閱:" + unsub + "\n";
  const F = "font-family:'Microsoft JhengHei','PingFang TC','Noto Sans TC',sans-serif;";
  const para = esc_(m.body).replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?,。;:!?、)」』])/g, '<a href="$1" style="color:#0d7a70">$1</a>')
    .split(/\n{2,}/).map((p) => '<p style="margin:0 0 14px">' + p.replace(/\n/g, "<br>") + "</p>").join("");
  const html = '<!doctype html><html lang="zh-Hant"><body style="margin:0;padding:0;background:#eef2f9">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef2f9"><tr><td align="center" style="padding:18px 10px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden">' +
    '<tr><td style="background:#0d9488;padding:12px 24px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="' + F + 'color:#ffffff;font-size:17px;font-weight:bold">🛡️ Allan\'s ISMS智庫</td>' +
    '<td align="right"><span style="' + F + 'display:inline-block;background:#ffffff;color:#0d9488;font-size:13px;font-weight:bold;padding:3px 12px;border-radius:999px">顧問通知</span></td></tr></table></td></tr>' +
    '<tr><td style="background:#12224f;padding:22px 24px"><div style="' + F + 'color:#ffffff;font-size:23px;font-weight:bold;line-height:1.4">' + esc_(m.subject) + "</div></td></tr>" +
    '<tr><td style="' + F + 'padding:24px 24px 6px;font-size:15.5px;line-height:1.8;color:#17264f"><p style="margin:0 0 14px">' + esc_(hi) + "</p>" + para + "</td></tr>" +
    (m.btnText ? '<tr><td style="padding:0 24px 10px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#f59e0b;border-radius:999px;padding:11px 24px"><a href="' + esc_(m.btnUrl) + '" style="' + F + 'color:#1a1300;font-size:15px;font-weight:bold;text-decoration:none">' + esc_(m.btnText) + " →</a></td></tr></table></td></tr>" : "") +
    '<tr><td style="padding:12px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fc;border-radius:14px"><tr><td width="56" valign="top" style="padding:16px 0 16px 18px;font-size:34px;line-height:1">👨‍🏫</td>' +
    '<td style="' + F + 'padding:16px 18px;font-size:14.5px;line-height:1.7;color:#17264f"><b style="font-size:16px">Allan Lo</b> <span style="color:#5d6d92">ISMS智庫顧問</span><br>✉️ <a href="mailto:' + CFG.CONTACT + '" style="color:#0d9488">' + CFG.CONTACT + '</a> &nbsp; 🔎 <a href="' + CFG.HOME + '" style="color:#0d9488">進入智庫</a></td></tr></table></td></tr>' +
    '<tr><td style="' + F + 'padding:16px 24px 24px;font-size:12.5px;line-height:1.7;color:#5d6d92">您會收到這封信,是因為您訂閱了 Allan\'s ISMS智庫。不想再收到?<a href="' + unsub + '" style="color:#5d6d92">取消訂閱</a></td></tr>' +
    "</table></td></tr></table></body></html>";
  return { text: text, html: html };
}

function previewCustom() {
  const ui = SpreadsheetApp.getUi(), m = readCompose_(), r = recipients_(m), me = Session.getActiveUser().getEmail();
  const mail = customMail_(m, "(收件人姓名)", CFG.SITE + "subscribe.html");
  MailApp.sendEmail(me, "[預覽] " + m.fullSubject, mail.text, { htmlBody: ent_(mail.html), name: CFG.SENDER_NAME, replyTo: CFG.CONTACT });
  ui.alert("已寄出預覽 ✅\n\n主旨:" + m.fullSubject + "\n預覽寄到:" + me + "\n\n正式寄出時的收件人:" + r.list.length + " 位(" + m.who + (m.cond ? ":" + m.cond : "") + ")" +
    (r.skipped.length ? "\n\n⚠ 以下 Email 不在核准名單內,不會寄送:\n" + r.skipped.join("\n") : ""));
}

function sendCustom() {
  const ui = SpreadsheetApp.getUi(), m = readCompose_(), r = recipients_(m);
  if (!r.list.length) return ui.alert("沒有符合條件的收件人。\n\n收件對象:" + m.who + (m.cond ? "(" + m.cond + ")" : "") + "\n只有狀態為「核准」的訂閱者會收到。");
  const quota = MailApp.getRemainingDailyQuota();
  if (quota < r.list.length) return ui.alert("今日剩餘寄信額度只有 " + quota + " 封,不足以寄給 " + r.list.length + " 人。");
  const last = String(m.sh.getRange(CP.last, 2).getValue() || "");
  if (last.indexOf("#" + m.hash) >= 0 && ui.alert("這封信已經寄過", "相同主旨、內文與對象的信已寄出過:\n" + last + "\n\n確定要再寄一次嗎?", ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  if (ui.alert("確認寄出", "主旨:" + m.fullSubject + "\n收件人:" + r.list.length + " 位(" + m.who + (m.cond ? ":" + m.cond : "") + ")" +
    (r.skipped.length ? "\n不在核准名單、不會寄送:" + r.skipped.join("、") : "") + "\n\n寄出後無法收回。確定嗎?", ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  let ok = 0; const fail = [];
  r.list.forEach((t) => {
    try {
      let token = t.token; if (!token) { token = newToken_(); list_().getRange(t.row, C.token).setValue(token); }
      const mail = customMail_(m, t.name, unsubUrl_(token));
      MailApp.sendEmail(t.email, m.fullSubject, mail.text, { htmlBody: ent_(mail.html), name: CFG.SENDER_NAME, replyTo: CFG.CONTACT });
      ok++;
    } catch (err) { fail.push(t.email + ":" + err.message); }
  });
  const now = new Date();
  m.sh.getRange(CP.last, 2).setValue(Utilities.formatDate(now, Session.getScriptTimeZone(), "yyyy/MM/dd HH:mm") + " 寄給 " + ok + " 位 #" + m.hash);
  SpreadsheetApp.getActive().getSheetByName(CFG.LOG).appendRow([now, "主動發送", m.subject, ok, fail.length, m.who + (m.cond ? ":" + m.cond : "") + (fail.length ? ";失敗:" + fail.join(";") : "")]);
  ui.alert("寄送完成\n\n成功:" + ok + " 封\n失敗:" + fail.length + " 封" + (fail.length ? "\n\n" + fail.join("\n") : ""));
}

function showStats() {
  const sh = list_(), n = {}; n[ST.PENDING] = n[ST.OK] = n[ST.CANCEL] = n[ST.REJECT] = 0;
  if (sh.getLastRow() > 1) sh.getRange(2, C.status, sh.getLastRow() - 1, 1).getValues().forEach((v) => { if (v[0] in n) n[v[0]]++; });
  SpreadsheetApp.getUi().alert("名單統計\n\n核准:" + n[ST.OK] + "\n待審:" + n[ST.PENDING] + "\n取消:" + n[ST.CANCEL] + "\n退回:" + n[ST.REJECT] + "\n\n今日剩餘寄信額度:" + MailApp.getRemainingDailyQuota() + " 封");
}

/* ───────── 小工具 ───────── */
function list_() { const sh = SpreadsheetApp.getActive().getSheetByName(CFG.LIST); if (!sh) throw new Error("找不到「" + CFG.LIST + "」工作表,請先執行初始化。"); return sh; }
function findRow_(sh, col, value) {
  if (sh.getLastRow() < 2) return -1;
  const vals = sh.getRange(2, col, sh.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]).trim().toLowerCase() === String(value).toLowerCase()) return i + 2;
  return -1;
}
function isEmail_(s) { return /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[a-z]{2,}$/i.test(s) && s.length <= 120; }
function clean_(s, max) { return String(s || "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, max); }
function safe_(s) { return /^[=+\-@]/.test(s) ? "'" + s : s; }               // 防止有人在表單欄位塞試算表公式
function newToken_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "").slice(0, 40); }
function unsubUrl_(token) { return CFG.SITE + "subscribe.html?u=" + token; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function send_(to, subject, body) { MailApp.sendEmail(to, subject, body, { name: CFG.SENDER_NAME, replyTo: CFG.CONTACT }); }
function throttle_(key, seconds) { const c = CacheService.getScriptCache(); if (c.get(key)) return false; c.put(key, "1", seconds); return true; }
function hourlyOk_() { const c = CacheService.getScriptCache(), k = "h:" + Utilities.formatDate(new Date(), "UTC", "yyyyMMddHH"), n = Number(c.get(k) || 0); if (n >= CFG.HOURLY_CAP) return false; c.put(k, String(n + 1), 3600); return true; }
function notifyOwner_(email, name, org, kind) {
  send_(CFG.CONTACT, "【ISMS智庫】訂閱" + kind + ":" + name + "(" + org + ")",
    "有一筆訂閱" + kind + ",狀態為「待審」:\n\n姓名:" + name + "\n單位:" + org + "\nEmail:" + email +
    "\n\n確認是客戶或同意訂閱後,請到試算表把狀態改成「核准」(系統會自動寄歡迎信);不同意則改成「退回」。\n\n" + SpreadsheetApp.getActive().getUrl() + "\n");
}

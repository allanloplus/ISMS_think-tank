/**
 * Allan's ISMS智庫 — 訂閱管理(Google Apps Script,綁定在「訂閱名單」試算表上)
 *
 * 做什麼:
 *  1. 接收智庫網站 subscribe.html 的「申請訂閱」→ 寫入名單,狀態為「待審」,並寄信通知 Allan
 *  2. Allan 在試算表把狀態改成「核准」→ 自動補上日期與取消碼,並寄歡迎信
 *  3. 選單「ISMS智庫 → 發送本期」→ 抓智庫最新一期的信件內容,寄給所有「核准」的人(每期每人只寄一次)
 *  4. 收件人按信尾「取消訂閱」→ 狀態改成「取消」,之後不再寄送
 *
 * 安裝步驟見同資料夾的 README.md。請用 isms@123hi.org 這個帳號建立,信才會從這個地址寄出。
 */

const CFG = {
  SITE: "https://allanloplus.github.io/ISMS_think-tank/",   // 智庫網址(結尾要有 /)
  SENDER_NAME: "ISMS智庫顧問 Allan Lo",
  CONTACT: "isms@123hi.org",                                 // 申請通知寄到這裡;也是信件的回覆地址
  LIST: "訂閱名單",
  LOG: "寄送紀錄",
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
        (name ? name + " " : "") + "您好,\n\n您的「Allan's ISMS智庫」每月電子報訂閱已開通。\n之後每月新一期發行時,會寄一封本期摘要給您,內容以文字為主,點連結即可進入智庫閱讀。\n\n現在就可以進入智庫:\n" + CFG.SITE +
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
  GmailApp.sendEmail(to, subject, m.text.split("{{UNSUBSCRIBE}}").join(unsub),
    { htmlBody: m.html.split("{{UNSUBSCRIBE}}").join(unsub), name: CFG.SENDER_NAME, replyTo: CFG.CONTACT });
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
function send_(to, subject, body) { GmailApp.sendEmail(to, subject, body, { name: CFG.SENDER_NAME, replyTo: CFG.CONTACT }); }
function throttle_(key, seconds) { const c = CacheService.getScriptCache(); if (c.get(key)) return false; c.put(key, "1", seconds); return true; }
function hourlyOk_() { const c = CacheService.getScriptCache(), k = "h:" + Utilities.formatDate(new Date(), "UTC", "yyyyMMddHH"), n = Number(c.get(k) || 0); if (n >= CFG.HOURLY_CAP) return false; c.put(k, String(n + 1), 3600); return true; }
function notifyOwner_(email, name, org, kind) {
  send_(CFG.CONTACT, "【ISMS智庫】訂閱" + kind + ":" + name + "(" + org + ")",
    "有一筆訂閱" + kind + ",狀態為「待審」:\n\n姓名:" + name + "\n單位:" + org + "\nEmail:" + email +
    "\n\n確認是客戶或同意訂閱後,請到試算表把狀態改成「核准」(系統會自動寄歡迎信);不同意則改成「退回」。\n\n" + SpreadsheetApp.getActive().getUrl() + "\n");
}

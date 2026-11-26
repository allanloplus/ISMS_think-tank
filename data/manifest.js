/* 期別清單:每月新增一筆(最新放最前面),並把 current 改成新期別
 * 欄位:id, label, topic(本期宣導主題), game(小遊戲名稱), gameIcon(emoji) */
window.TT = window.TT || {};
TT.manifest = {
  site: "Allan's ISMS智庫",
  /* home:對外公布的入口(Google Sites 頁面,內嵌本站);url:本站實際位址,深層連結(?issue=、#錨點)、訂閱頁與 mail/latest.json 只能走這裡 */
  home: "https://www.123hi.org/isms%E6%99%BA%E5%BA%AB",
  url: "https://allanloplus.github.io/ISMS_think-tank/",
  /* 訂閱 API:Google Apps Script 網頁應用程式網址(設定方式見 subscription/README.md);留空時訂閱頁會請讀者改用來信申請 */
  subscribeApi: "https://script.google.com/macros/s/AKfycbyfpOY80A2Epvc5c_CoS0IqkNc3VDoKo1cm8jMhI98DgN518YTal0PQzCJ75ipFC2M0IQ/exec",
  contact: { title: "ISMS智庫顧問", name: "Allan Lo", email: "isms@123hi.org", web: "https://www.123hi.org" },
  current: "2026-11",
  issues: [
    { id: "2026-11", label: "2026 年 11 月號", topic: "弱點處置期限評估指引", game: "弱點急診室", gameIcon: "🚑" }
  ]
};

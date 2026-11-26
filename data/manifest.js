/* 期別清單:每月新增一筆(最新放最前面),並把 current 改成新期別
 * 欄位:id, label, topic(本期宣導主題), game(小遊戲名稱), gameIcon(emoji) */
window.TT = window.TT || {};
TT.manifest = {
  site: "Allan's ISMS智庫",
  url: "https://allanloplus.github.io/ISMS_think-tank/",
  /* 訂閱 API:Google Apps Script 網頁應用程式網址(設定方式見 subscription/README.md);留空時訂閱頁會請讀者改用來信申請 */
  subscribeApi: "",
  contact: { title: "ISMS智庫顧問", name: "Allan Lo", email: "isms@123hi.org", web: "https://www.123hi.org" },
  current: "2026-11",
  issues: [
    { id: "2026-11", label: "2026 年 11 月號", topic: "弱點處置期限評估指引", game: "弱點急診室", gameIcon: "🚑" }
  ]
};

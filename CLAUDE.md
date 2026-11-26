# Allan's ISMS智庫 — 專案說明與每月更新 SOP

純靜態網站(無建置步驟、無後端)。Allan 顧問每月在 Claude 執行一次更新,產出新一期智庫。
對象:客戶機關/企業的同仁。語言:繁體中文(臺灣用語)。語氣:專業但活潑,由 Allan 顧問與 AI 助理阿拉雷帶路。

## 架構

| 路徑 | 內容 | 多久動一次 |
|---|---|---|
| `data/manifest.js` | 期別清單、`current` 期別 | 每月 |
| `data/issues/YYYY-MM.js` | 當期:標題、對話、本期宣導 `feature`、小遊戲 `game`、情資 `intel`、`og` 縮圖文字 | 每月新增一檔 |
| `data/regulations.js` | 外部法規庫(`TT.sectors` 身分/產業別、`TT.regs`) | 每月檢視異動 |
| `data/internal-docs.js` | 客戶內部 ISMS 四階文件摘要 | 文件改版時 |
| `data/org.js` | 客戶組織:政策、目標、關注方、內外部議題 | 管審後或有變動時 |
| `assets/js/app.js` | 主程式(渲染、搜尋、角色互動) | 通常不動 |
| `assets/js/games/*.js` | 小遊戲模組,每月新增一個 | 每月 |
| `tools/make_og.js` | 產生 `og-image.png` 分享縮圖與 favicon | 每月執行 |
| `tools/build_single.py` | 打包單一 HTML 到 `dist/`(可離線、可傳檔) | 每月執行 |
| `sources/YYYY-MM/` | 當期引用的原始文件(指引 PDF 等) | 每月 |

## 每月更新 SOP(Allan 說「出下一期」時照做)

1. **確認主題**:問 Allan 本期宣導主題與附件;沒有指定就從近一個月法規異動中提議 2~3 個。
2. **查證情資與法規**(一定要上網查,不可只憑記憶):
   - 公務機關:資安署(moda.gov.tw/ACS)、全國法規資料庫、個資會籌備處、國科會(AI)。
   - 產業別:金管會、證交所、衛福部、NCC、經濟部、數發部;跨國看 EU / CISA / ISO。
   - 弱點:直接比對 CISA KEV 官方清單,不可編造 CVE 編號。
   - 每則情資附來源連結;只有媒體摘要、沒讀到原文者標 `v: "partial"`(畫面顯示「待覆核」)。
   - 第二手資料與官方原文衝突時,以官方原文為準並在回報中說明。
3. **新增期別檔**:複製上一期 `data/issues/YYYY-MM.js` → 改 `id / label / published / headline / sub / focusLinks / og / dialogue / lawUpdates / lawWatch / feature / game / intel / trends / changelog`。
   - **本期焦點**:首頁大標(`headline` + `sub`)整塊連到 `focusLinks` 的第一筆;`focusLinks` 是標題下方的直達按鈕(完整解說、互動元件、小遊戲、官方原文),每期依主題調整。
   - **首頁「最新動態」**:左欄 `lawUpdates`(近期法令法規異動,政府機關最關心;每筆要有日期、狀態、適用對象、官方連結,並以 `reg` 對應法規庫)與 `lawWatch`(尚未生效但要先準備的);右欄自動取 `intel` 中非「法規政策/標準動態」者(民間企業最關心)。每月把新異動加在最前面,超過約一年的舊項目移除。
   - `feature` 的結構可依主題調整;若與弱點指引版型差異大,在 `app.js` 的 `renderFeature` 依 `feature.kind` 分支處理。
4. **新小遊戲**(每期必須不同):在 `assets/js/games/` 新增模組 `TT.games["<type>"] = { mount(root, cfg, TT) }`,並在 `index.html` 加一行 `<script>`。
   - 題材必須扣本期宣導;一局 2 分鐘內;要有阿拉雷/Allan 的表情回饋、分數與「複製成績分享」。
   - 已用過:`vuln-triage` 弱點急診室(2026-11,限時分類)。
   - 點子庫:釣魚信找碴、資安事件通報時序排列、個資分級翻牌配對、通行碼強度拉霸、稽核員找缺失(點圖)、法規條文連連看、是非快問快答、資產曝露面掃雷。
5. **連動內部文件**:若宣導主題會影響客戶程序書,更新 `internal-docs.js` 對應文件並標 `updated: "YYYY-MM"`;`org.js` 的議題、關注方、目標同步檢視。
6. **法規庫**:新增/異動項目標 `isNew: true`(上一期的 `isNew` 移除),更新 `TT.regsChecked`。
7. **更新 `manifest.js`**:`current` 改新期別,`issues` 最前面加一筆。
8. **更新 `index.html` 的 `<title>`、description 與 `og:*` 文字**(社群爬蟲不執行 JS,所以這裡要手動改)。
9. **產出**:
   ```bash
   node tools/make_og.js          # 分享縮圖
   python3 tools/build_single.py  # 單檔版 → dist/
   node tools/make_mail.js        # 訂閱信(純文字 + 極簡 HTML,無圖片)→ mail/
   ```
   訂閱信內容全部取自期別檔,連結一律帶 `?issue=YYYY-MM`;聯絡資訊在 `manifest.js` 的 `contact`。訂閱名單與寄送不在本 repo(名單屬個資,不可提交進來)。
10. **測試**:本機 `python3 -m http.server` 用瀏覽器實測——試算/互動元件、遊戲整局、搜尋、手機寬度 390px 無橫向捲動、console 無錯誤。看過截圖再交付。
11. commit、push;回報本期內容摘要與「待覆核」清單。

## 期別呈現規則(已內建,不需每月處理)

- 首頁英雄區顯眼標示「本智庫每月更新,本期為 X」;導覽列有期別切換選單(手機改點該標示跳到歷期清單)。
- 舊期別以 `?issue=YYYY-MM` 載入,頂端自動出現黃色「過往期別」橫幅與「回到最新一期」。
- 舊期別會還原:標題、對話、本期宣導、小遊戲、情資。法規庫、內部文件、政策目標全站共用,只顯示最新版。
- 「歷期小遊戲」與「歷期智庫」清單由 `manifest.js` 自動產生;每筆連到 `dist/` 的單檔封存版(當月完整原貌)。
  因此 **每期的遊戲模組與 `dist/` 單檔都不可刪除**,`index.html` 的遊戲 `<script>` 只增不減。

## 匯入真實客戶文件(取代模擬的烏托邦機關)

Allan 的優化版程序文件在他本機 `D:\AI_Project\ISMS2027_Allan版\ISMS程序文件_優化版`。
請他把檔案上傳到對話,或放進 repo 的 `sources/internal/`,再逐份讀取後改寫 `data/internal-docs.js` 與 `data/org.js`
(保留欄位結構:`id, tier, title, ver, date, owner, iso, summary, points, forms, tags`),並把 `org.simulated` 改為 `false`。
多客戶時:每個客戶一組 `org.js` + `internal-docs.js`,其餘共用。

## 視覺風格

- 預設為淺色「晨光白」(`<html data-theme="light">`,變數在 `style.css` 末段);原深色版保留在 `:root`,網址加 `?theme=dark` 可看。
- 新增樣式時顏色一律用 CSS 變數(`--tx`、`--card`、`--teal`、`rgba(var(--ovc),…)` 等),不要寫死色碼,兩種主題才都正常。
- 分享縮圖配色在 `tools/make_og.js`,跟著淺色主題;`og.nums` 的顏色要用深一點的色碼。

## 內容原則

- 法規數字(期限、時數、罰鍰、條號)必須有來源;尚未施行的條文要明講「尚未施行」,不可寫成現行義務。
- 內部文件屬客戶機敏資訊:真實客戶版不要放在公開網址,改用單檔版或有存取控制的託管。
- 角色圖在 `assets/img/chars/`(`allan-*`、`arale-*`:smile/laugh/think/confused/surprised/point/wink/talk/explain/cry/cheer/full)。
  角色設定圖由 Allan 提供,不要自行生成或改畫角色。
- 分享縮圖 1200×630,左側文字、右側兩位角色;標題要短,數字要大。

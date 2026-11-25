/* 月刊資料檔:2026 年 11 月號
 * 每月由 Claude 依 CLAUDE.md 的 SOP 複製本檔 → 改期別 → 更新 feature / intel / game / dialogue。 */
window.TT = window.TT || {};
TT.issue = {
  id: "2026-11",
  label: "2026 年 11 月號",
  published: "2026-11-24",
  headline: "弱點修補進入\n「3·14·60」倒數時代",
  sub: "數發部資安署 115/11/6 訂定《各機關基於風險導向之弱點處置期限評估指引》——AI 讓攻擊變快,修補期限也跟著變明確。",

  /* 分享縮圖文字(tools/make_og.js 讀取);nums: [數字, 單位, 顏色] */
  og: { kicker: "公務機關必讀", title: "弱點修補進入<br><em>3·14·60</em> 倒數時代", nums: [["3", "天", "#fb7185"], ["14", "天", "#fb923c"], ["60", "天", "#facc15"]], foot: "資安署新指引一次看懂 × 期限試算器 × <b>🎮 小遊戲:弱點急診室</b>" },

  /* 首頁 Allan × 阿拉雷 開場對話(who: allan|arale, face: 表情檔名) */
  dialogue: [
    { who: "arale", face: "surprised", text: "Allan 顧問!資安署 11/6 出了新指引,弱點最快要在 3 天內處理完?!" },
    { who: "allan", face: "point", text: "沒錯。AI 讓弱點從公開到被武器化的時間越來越短,「有空再修」已經行不通了。" },
    { who: "arale", face: "think", text: "那每個弱點都要 3 天嗎?人力會爆掉耶……" },
    { who: "allan", face: "smile", text: "不用。指引用 4 個指標把弱點分成 16 種類型,對應 3 天、14 天、60 天或下次更新。" },
    { who: "arale", face: "cheer", text: "我懂了!風險導向——先救最危險的!下面有試算器跟小遊戲,大家一起來練!" },
    { who: "allan", face: "wink", text: "記得把它寫進 ISMS 程序書,稽核時我會看紀錄喔。" }
  ],

  /* ───────── 本期宣導 ───────── */
  feature: {
    tag: "本期宣導 · 公務機關必讀",
    title: "各機關基於風險導向之弱點處置期限評估指引",
    issued: "115 年 11 月 6 日訂定",
    issuer: "數位發展部資通安全署",
    basis: "資通安全責任等級分級辦法應辦事項——知悉資通安全弱點時,應適時修補或採行緩解措施",
    why: "因應 AI 快速發展導致自動化攻擊與弱點武器化加速,以風險導向策略決定「哪些弱點要先處理、多久內處理完」。",
    scope: [
      "資通安全管理法第 3 條第 5、6 款之公務機關、特定非公務機關",
      "特定非公務機關之中央目的事業主管機關得另訂處置期限"
    ],
    definition: "弱點處置=安全性更新、關閉有弱點的服務或功能、停用資訊資產、網路隔離,或其他降低風險至可接受程度之緩解/補償性控制措施。",
    indicators: [
      { key: "exposed", n: 1, name: "資訊資產曝露於公眾網路", yes: "是", no: "否", q: "這項資產能被網際網路上未經授權或不被信任的對象直接存取嗎?", tip: "對外網站、VPN、郵件閘道、遠端桌面…都算。內網主機通常為否。" },
      { key: "kev", n: 2, name: "弱點已知被利用", yes: "是", no: "否", q: "這個弱點已被列入美國 CISA 的 KEV(已知被利用之弱點)清單嗎?", tip: "到 CISA KEV Catalog 以 CVE 編號查詢。" },
      { key: "auto", n: 3, name: "弱點能被自動化利用", yes: "是", no: "否", q: "攻擊者能穩定地自動化完成偵察、武器化、傳遞、利用這四個階段嗎?", tip: "免驗證、可遠端、已有公開攻擊程式或掃描工具者,多半為是。" },
      { key: "total", n: 4, name: "技術影響程度", yes: "完全控制", no: "部分控制", q: "弱點遭利用後,攻擊者可完全控制該資產(或全部資訊被揭露)嗎?", tip: "完全控制 Total:取得完整控制權或全部資訊被揭露;部分控制 Partial:有限度控制或部分資訊揭露。" }
    ],
    /* 表一:類型 1~16 → 期限(d: 3 | 14 | 60 | 0=待下次系統更新)
       類型編號 = 1 + (曝露?0:8) + (KEV?0:4) + (自動化?0:2) + (完全控制?0:1) */
    table: [3, 3, 3, 14, 3, 14, 14, 60, 3, 14, 14, 14, 60, 60, 0, 0],
    rules: [
      { h: "起算方式", t: "期限自「知悉日」起算,以日曆天計(含假日)。" },
      { h: "例外核准", t: "因業務需求且已有其他適當防護、或經風險評估影響有限、或無指標可循時,得衡酌營運衝擊,經資訊(安)主管核准後自訂期限,並留存紀錄備查。" },
      { h: "類型 1、2、3、9 加強要求", t: "應先評估受影響範圍,保存與檢視相關日誌,並監控不尋常或未經授權之活動,確認弱點是否已遭利用。" },
      { h: "動態調整", t: "評估事實或條件變動(例如被列入 KEV、資產改為對外)時應重新評估,展延或縮短期限。" },
      { h: "同期限的優先排序", t: "同一處置期限內,得依技術影響、CVSS、EPSS 或其他指標排定先後。" },
      { h: "特別指定", t: "資安署或國家資通安全研究院就特定弱點另行指定處置期限者,從其規定。" }
    ],
    mitigations: [
      { name: "停用資訊資產", icon: "⏻", text: "將受影響或無法修補的系統、設備淘汰、停用或報廢。" },
      { name: "移除易受攻擊的軟體", icon: "🗑", text: "解除安裝或完全移除產生弱點的非核心軟體或元件。" },
      { name: "劃分網段", icon: "▦", text: "將有弱點的資產限縮在嚴格控管的安全網段,防範橫向移動。" },
      { name: "進行網路隔離", icon: "⛔", text: "完全切斷或嚴格限制與內部、外部或公眾網路的實體及邏輯連線。" },
      { name: "強化存取控制", icon: "🔐", text: "導入零信任架構,至少經身分鑑別、設備鑑別後方得存取。" },
      { name: "代理伺服器過濾防護", icon: "⇄", text: "以專屬代理伺服器作為存取中介,監控並過濾、阻擋異常連線與攻擊特徵。" },
      { name: "虛擬修補", icon: "🛡", text: "透過 WAF、IPS 等偵測並阻擋符合已知弱點利用特徵的攻擊行為。" }
    ],
    actions: [
      { who: "資安主管", text: "指定弱點期限評估的權責人員與例外核准層級(資訊/資安主管)。" },
      { who: "資安承辦", text: "修訂「弱點與修補管理程序」,納入四指標評估流程與表一對照。", doc: "ISMS-2-13" },
      { who: "資安承辦", text: "新增「弱點處置期限評估表」與「例外核准單」,留存紀錄備查。", doc: "ISMS-4-00" },
      { who: "資產管理者", text: "資產清冊補上「是否曝露於公眾網路」欄位,並完成對外曝露面盤點。", doc: "ISMS-2-07" },
      { who: "維運人員", text: "訂閱 CISA KEV、TWCERT/CC、廠商公告;高風險類型啟動日誌保全與監控。", doc: "ISMS-3-01" },
      { who: "全體", text: "法規鑑別表、適用性聲明書(A.8.8)與資安目標同步更新。", doc: "ISMS-2-18" }
    ],
    enterpriseNote: "一般企業雖非適用對象,但這套「曝露 × 已被利用 × 可自動化 × 影響」的判斷邏輯與國際 SSVC 方法相通,非常適合直接拿來當作內部修補 SLA 的依據。",
    sourceNote: "內容依指引原文(115/11/6)整理;實際作業請以資安署公告版本為準。"
  },

  /* ───────── 本期小遊戲 ───────── */
  game: {
    type: "vuln-triage",
    title: "弱點急診室",
    tagline: "你是今晚的值班資安官,8 個弱點送進急診——請在時限內判定處置期限!",
    rounds: 8,
    seconds: 25,
    cases: [
      { t: "對外 SSL VPN 閘道", d: "廠商緊急公告:免登入即可遠端執行任意程式。CISA 已列入 KEV,網路上已有自動化攻擊工具在大量掃描。", f: [1, 1, 1, 1] },
      { t: "機關官方網站 CMS 外掛", d: "外掛存在免驗證 SQL Injection,已有公開掃描腳本可批次攻擊,但只能讀出部分公開資料表。尚未列入 KEV。", f: [1, 0, 1, 0] },
      { t: "內網差勤系統", d: "需先登入一般帳號,再手動操作才能看到其他同仁的部分請假資料。未列入 KEV。", f: [0, 0, 0, 0] },
      { t: "內網 AD 網域控制站", d: "權限提升弱點已列入 KEV,公開工具可一鍵打下整個網域。主機不對外。", f: [0, 1, 1, 1] },
      { t: "對外郵件閘道", d: "弱點已列入 KEV。攻擊者需針對目標客製惡意郵件(無法自動化),成功後可完全控制設備。", f: [1, 1, 0, 1] },
      { t: "對外民眾申辦 API", d: "尚未列入 KEV,但 PoC 已公開、可自動化利用,成功後可取得主機完整權限。", f: [1, 0, 1, 1] },
      { t: "對外檔案傳輸服務", d: "已列入 KEV,需手動組合多個步驟才能利用,且只能讀到部分暫存檔。", f: [1, 1, 0, 0] },
      { t: "對外視訊會議主機", d: "未列入 KEV、沒有現成工具,需要高度客製攻擊,但成功可完全接管主機。", f: [1, 0, 0, 1] },
      { t: "對外查詢網站", d: "未列入 KEV、無法自動化利用,最多只會洩漏部分版本資訊。", f: [1, 0, 0, 0] },
      { t: "內網印表機管理介面", d: "已列入 KEV,有自動化工具,但只能取得列印佇列中的部分文件。", f: [0, 1, 1, 0] },
      { t: "內網資料庫主機", d: "已列入 KEV,需手動利用,成功後可取得資料庫完整控制權。", f: [0, 1, 0, 1] },
      { t: "內網檔案伺服器", d: "未列入 KEV,但蠕蟲型弱點可自動化擴散,成功後完全控制主機。", f: [0, 0, 1, 1] },
      { t: "內網監控系統", d: "未列入 KEV、需人工逐步利用,但成功後可完全控制主機。", f: [0, 0, 0, 1] },
      { t: "對外入口網站單一登入", d: "已列入 KEV,自動化工具可繞過驗證,但僅能以一般使用者身分讀取部分頁面。", f: [1, 1, 1, 0] }
    ]
  },

  /* ───────── 首頁「最新動態」左欄:近期法令法規異動(政府機關最關心) ─────────
     date: 發布/生效日;st: 已發布|已施行|已生效|預告中|待施行|即將生效;who: 適用對象
     reg: 對應 regulations.js 的 id(點標題開啟重點);url: 官方或原始來源;v: "partial" = 待覆核
     右欄的資安情資直接取用下方 intel(排除「法規政策」類),不必另外維護。 */
  lawUpdates: [
    { date: "2026-11-11", st: "已發布", who: "電商/數位服務", title: "數發部「五大防護行動」:重大警訊 72 小時內修補、通報並通知當事人", reg: "D02", url: "https://moda.gov.tw/ACS/press/news/press/21422" },
    { date: "2026-11-06", st: "已發布", who: "公務機關/特定非公務機關", hot: true, title: "各機關基於風險導向之弱點處置期限評估指引(3/14/60 天)", reg: "G03", url: "https://moda.gov.tw/ACS/operations/aisec/21256" },
    { date: "2026-11-06", st: "已發布", who: "能源/水資源/科學園區", title: "經濟部所管特定非公務機關資通安全管理作業辦法修正發布", reg: "C02", url: "https://icsda.org.tw/", v: "partial" },
    { date: "2026-10-13", st: "預告中", who: "金融業", title: "金管會「金融業運用代理 AI 安全諮詢文件」徵詢意見", reg: "F06", url: "https://cna.com.tw/news/afe/202610130306.aspx", v: "partial" },
    { date: "2026-09-11", st: "已生效", who: "輸歐數位產品", title: "EU Cyber Resilience Act 弱點與事件通報義務開始適用", reg: "X05", url: "https://digital-strategy.ec.europa.eu/en/policies/cra-reporting" },
    { date: "2026-09-02", st: "預告中", who: "關鍵基礎設施醫院", title: "衛福部所管特定非公務機關資通安全管理作業辦法修正草案預告", reg: "M03", url: "https://www.mohw.gov.tw/", v: "partial" },
    { date: "2026-07-07", st: "已發布", who: "各機關/全產業", title: "數發部「人工智慧風險分類框架 v1.0」", reg: "G10", url: "https://www-api.moda.gov.tw/File/Get/moda/zh-tw/UieEfux5Yv0iJuR" },
    { date: "2026-05-26", st: "已發布", who: "保險業", title: "保險業內控辦法修正:資安長與專責單位適用範圍擴大", reg: "F02", url: "https://www.fsc.gov.tw/ch/home.jsp?id=2&parentpath=0&mcustomize=news_view.jsp&dataserno=202605260002&dtable=News" },
    { date: "2026-01-14", st: "已施行", who: "各機關/全產業", title: "人工智慧基本法公布施行;政府使用 AI 須風險評估並訂內控規範", reg: "G09", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=H0160093" },
    { date: "2026-01-07", st: "已施行", who: "公務機關/特定非公務機關", title: "資安法六部子法修正:責任等級分級辦法、通報應變及演練辦法等(兩部更名)", reg: "G02", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=A0030304" },
    { date: "2025-12-01", st: "已施行", who: "公務機關/特定非公務機關", title: "資通安全管理法全文修正施行:條號全面變動、資安長法制化", reg: "G01", url: "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=A0030297" }
  ],
  /* 追蹤中:尚未生效但要先準備的項目 */
  lawWatch: [
    { when: "2026/12/2", title: "EU AI Act 新增禁止項目生效、生成式內容標記寬限期屆至", reg: "X04" },
    { when: "最快 2026 年底", title: "資安署 AI Agent 安全指引(約 60~70 項控制措施)", url: "https://money.udn.com/money/story/7307/9888953" },
    { when: "2027 年初前", title: "各機關依 AI 基本法完成 AI 內控規範", reg: "G09" },
    { when: "施行日未定", title: "個資法 114 年修正條文(個資保護長、事故通報主管機關)——個資會仍在籌備", reg: "G08" }
  ],

  /* ───────── 情資雷達(由查證結果填入) ───────── */
  intel: [
    { date: "2026-11-06", cat: "法規政策", hot: true, title: "資安署發布《各機關基於風險導向之弱點處置期限評估指引》",
      summary: "以「曝露於公眾網路、已知被利用(KEV)、可自動化利用、技術影響」四指標,把弱點分為 16 種類型,對應 3 天/14 天/60 天/待下次系統更新。官方 FAQ 補充:「曝露」看的是外部能否經網際網路存取服務,而非有無公網 IP——反向代理、Port Forwarding、NAT 後方的資產原則上仍視為曝露。",
      action: "修訂弱點管理程序,由「依 CVSS 嚴重度」改為四指標決策表;資產清冊新增對外曝露欄位;建立 KEV 每日比對。",
      src: [{ n: "資安署公告頁", u: "https://moda.gov.tw/ACS/operations/aisec/21256" }, { n: "資安署 AI 資安專區", u: "https://moda.gov.tw/ACS/operations/aisec/1839" }], v: "ok" },
    { date: "2026-11-11", cat: "AI資安", hot: true, title: "AI 代理網攻波及國內十餘家企業與平台,數發部提出「72 小時」應變要求",
      summary: "資安署指出境外駭客自 2026 年 7 月起以 AI 代理工具發動自動化攻擊,多利用 PHP、Node.js、GitLab 等已知高風險漏洞,再經高權限 API 大量取得個資。數發部要求:重大警訊後 72 小時內完成修補或防護、72 小時內通報並通知當事人、一個月內提出改善計畫。(受影響個資量:11/11 新聞稿稱逾百萬份;11/18 媒體引數發部統計約 800 萬筆,時點不同)",
      action: "把「重大警訊 72 小時處置」與個資外洩通報通知寫入事件應變程序並演練;清查高權限 API 的驗證、頻率限制與回傳資料量。",
      src: [{ n: "資安署新聞稿", u: "https://moda.gov.tw/ACS/press/news/press/21422" }, { n: "聯合報", u: "https://udn.com/news/story/6656/9886069" }], v: "ok" },
    { date: "2026-11-09", cat: "國內事件", hot: true, title: "外交部領事事務局部分網站遭入侵,護照照片檔與授權書掃描檔外洩",
      summary: "領務局 11/4 發現部分網站遭入侵,外洩 72,702 個護照大頭照檔、駐紐約辦事處 26,072 份授權書掃描檔及 774 件 ABTC 線上申請資料;公告稱未發現姓名、身分證字號等文字個資外洩,並將檢視委外廠商是否違反契約資安義務。",
      action: "檢視委外系統變更後的組態複核與上線前檢測;盤點對外服務長期留存的影像與掃描檔,落實保存期限與資料最小化。",
      src: [{ n: "領事事務局公告", u: "https://www.boca.gov.tw/cp-56-8323-50e8c-1.html" }], v: "ok" },
    { date: "2026-11-19", cat: "法規政策", title: "資安署預告:AI Agent 安全指引最快年底發布",
      summary: "資安署表示將發布涵蓋 LLM 與 AI Agent 全生命週期的安全指引(約 60~70 項控制措施,專家諮詢中),最快 2026 年底、最晚 2027 年初;並提出「曝露、授權、個資、修補時間」四個最小化。",
      action: "先盤點內部 AI Agent 與影子 AI 的使用情形與授權範圍,訂定 AI 工具核准清單與最小權限原則。",
      src: [{ n: "經濟日報", u: "https://money.udn.com/money/story/7307/9888953" }], v: "ok" },
    { date: "2026-11-17", cat: "AI資安", title: "Google GTIG:首度觀察到 AI 代理全自動發現弱點並完成利用",
      summary: "GTIG 指出威脅者已能以 AI 代理在無人介入下發現弱點並開發攻擊程式,有案例從初始立足點到取得網域管理員權限僅數分鐘;2026 年零時差利用月均數較 2025 年上升,成長主要來自 n-day 快速武器化(含 AI 自動逆向修補檔)。",
      action: "風險評鑑將「修補公告後數日內即遭武器化」列為預設假設;監控 AI 服務 API 金鑰用量異常,防範 LLMJacking。",
      src: [{ n: "CSO Online", u: "https://www.csoonline.com/article/4230247/ai-accelerates-n-day-attacks-as-flaw-disclosures-and-exploits-double.html" }, { n: "IT Brief", u: "https://itbrief.com.au/story/google-warns-of-autonomous-ai-attacks-finding-flaws" }], v: "ok" },
    { date: "2026-11-10", cat: "重大弱點-KEV", title: "Microsoft 11 月 Patch Tuesday:單月逾千個弱點,Outlook 零時差列入 KEV",
      summary: "微軟修補約 1,094 個弱點(各家統計略有差異)。已遭利用者為 CVE-2026-124194(Outlook,可洩漏 NTLM 雜湊),當日列入 KEV。注意:修補需更新 Office,只裝 Windows 累積更新無效。報導指出弱點數量暴增與 AI 大量發掘舊弱點有關。",
      action: "確認 Office / M365 Apps 更新已派送;評估封鎖對外 NTLM(SMB 445 出站);檢討修補量能是否撐得住每月上千個 CVE。",
      src: [{ n: "CSO Online", u: "https://www.csoonline.com/article/4247015/november-2026-patch-tuesday-63-critical-microsoft-fixes-plus-an-outlook-zero-day.html" }, { n: "CISA KEV", u: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" }], v: "ok" },
    { date: "2026-11-20", cat: "重大弱點-KEV", title: "11 月 KEV:SonicWall SSLVPN、Barracuda、Check Point、VMware vCenter、Cisco Expressway",
      summary: "CVE-2026-19868(SonicWall SonicOS SSLVPN,SAML/MFA 繞過,無緩解措施只能修補)、CVE-2026-116606(Barracuda ESG 驗證繞過)、CVE-2026-123039(Check Point)、CVE-2026-123890(VMware vCenter 驗證繞過)、CVE-2026-76466(Cisco Expressway 寫死憑證)陸續列入 KEV,期限多為 3 天。",
      action: "清查上述產品版本並更新;SonicWall 用戶檢視 SSLVPN 登入紀錄中異常的登入方式與來源。",
      src: [{ n: "CISA KEV", u: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" }, { n: "The Hacker News", u: "https://thehackernews.com/2026/11/cisa-flags-sonicwall-sonicos-mfa-bypass.html" }], v: "ok" },
    { date: "2026-10-30", cat: "重大弱點-KEV", title: "10 月邊界設備零時差密集期:Fortinet、Ivanti、Palo Alto、Cisco 全數上榜",
      summary: "一個月內 FortiMail(CVE-2026-104286)、Ivanti Connect Secure(CVE-2026-104935、CVE-2026-111357)、PAN-OS 管理介面(CVE-2026-0322)、Cisco Secure Email Gateway(CVE-2026-76519)、Cisco ASA/FTD(CVE-2026-76418)、BeyondTrust Remote Support(CVE-2026-102764)皆列入 KEV。",
      action: "管理介面一律限制來源 IP、不對外開放;為 VPN、郵件閘道、防火牆建立緊急修補通道並保全日誌——這些正是新指引的「類型 1」。",
      src: [{ n: "CISA KEV", u: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" }, { n: "Help Net Security", u: "https://www.helpnetsecurity.com/2026/10/15/cve-2026-0322-cve-2026-76519-cve-2026-105133-cve-2026-105134-exploted/" }], v: "ok" },
    { date: "2026-11-18", cat: "重大弱點-KEV", title: "AI 基礎設施元件開始進入 KEV:GPUStack、LiteLLM、MONAI Label",
      summary: "CVE-2026-102895(GPUStack 驗證繞過)、CVE-2026-40217(BerriAI LiteLLM)、CVE-2026-133968(MONAI Label 醫療影像 AI)於 11 月列入 KEV,顯示自建 AI 平台與 LLM 閘道已成實際攻擊目標。同批另有 OpenSSH(CVE-2026-123158,特定環境)與 IBM Aspera Faspex。",
      action: "把 AI 閘道、GPU 叢集管理、模型服務納入資產清冊與弱點掃描範圍;禁止直接對外,API 金鑰改用短效憑證。",
      src: [{ n: "CISA KEV", u: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" }, { n: "eSecurity Planet", u: "https://www.esecurityplanet.com/vulnerabilities/news-cisa-kev-gpustack-freeswitch-openssh-ibm-november-2026/" }], v: "ok" },
    { date: "2026-10-29", cat: "供應鏈", title: "91APP 訂單資料庫遭自動化攻擊,最大影響 1,329 個品牌、約 480 萬名消費者",
      summary: "91APP-KY 公布一座訂單資料庫遭自動化攻擊入侵,主因為第三方工具 AppSmith 的安全漏洞;外洩姓名、電話、地址、電郵與訂單紀錄,已出現假冒「定期購設定錯誤」的詐騙。",
      action: "將 SaaS 與電商平台供應商納入供應者風險評鑑,契約載明通報時限與責任;盤點內部低程式碼與管理工具的曝露面與版本。",
      src: [{ n: "遠見", u: "https://www.gvm.com.tw/article/134160" }, { n: "工商時報", u: "https://www.ctee.com.tw/news/20261025700009-430303" }], v: "partial" },
    { date: "2026-10-29", cat: "供應鏈", title: "Synology NAS 遭 C3RB3R 勒索軟體攻擊,CVE-2024-10441 列入 KEV",
      summary: "Synology 警告未更新的 DSM 正遭 C3RB3R 勒索軟體攻擊;CISA 於 11/18 將 CVE-2024-10441(DSM 未驗證 RCE)列入 KEV 並標註已知用於勒索軟體。",
      action: "盤點機關、分支單位與委外廠商使用的 NAS,關閉對外直連(含 QuickConnect 或埠轉發),更新 DSM 並驗證離線備份可還原。",
      src: [{ n: "BleepingComputer", u: "https://bleepingcomputer.com/news/security/synology-warns-customers-of-ongoing-c3rb3r-ransomware-attacks" }, { n: "CISA KEV", u: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog" }], v: "ok" },
    { date: "2026-10-20", cat: "國內事件", title: "國安局:政府網際服務網(GSN)7 月遭侵擾破億次",
      summary: "國安局報告指出 GSN 2026 年 7 月遭侵擾次數破億,截至 9 月日均約 258 萬餘次,研判不排除為年底選舉預作情蒐與網攻準備;爭議訊息數量亦高於去年同期,手法包含 AI 生成內容。",
      action: "選舉前後提高監控等級與對外服務的 DDoS 及弱點防護;提醒同仁留意社交工程與假訊息。",
      src: [{ n: "聯合報", u: "https://udn.com/news/story/6656/9826544" }], v: "ok" },
    { date: "2026-11-18", cat: "國內事件", title: "上市櫃資安重訊頻傳:10~11 月多家電商、ERP 與製造業者發布事件",
      summary: "元太(8069)11/18 發布重大訊息稱資訊系統疑似遭駭客攻擊,初步評估對營運無重大影響;媒體彙整另有多家電商與 ERP 服務業者於 10 月下旬至 11 月初發布事件或疑慮。",
      action: "上市櫃公司檢視重大訊息發布程序與資安事件分級的對應;製造業確認 IT/OT 區隔與備援復原演練紀錄。",
      src: [{ n: "iThome", u: "https://www.ithome.com.tw/news/180658" }], v: "partial" },
    { date: "2026-06-10", cat: "標準動態", title: "美國 CISA BOD 26-04:聯邦機關改採風險導向修補,最短 3 天",
      summary: "BOD 26-04 取代 BOD 22-01 與 19-02,依資產曝露、KEV 狀態、可否自動化利用、技術影響四變數決定修補期限,並要求修補前先確認系統是否已遭入侵。我國指引的四指標與此(及 SSVC 方法)邏輯相通。",
      action: "跨國企業可用同一套四指標決策表同時對應臺灣與美國要求;修補流程加入「修補前入侵跡象檢查」步驟。",
      src: [{ n: "CISA 公告", u: "https://content.govdelivery.com/accounts/USDHSCISA/bulletins/41b445a" }, { n: "Tenable FAQ", u: "https://www.tenable.com/blog/cisa-bod-26-04-FAQ-vulnerability-remediation-impact" }], v: "ok" },
    { date: "2026-06-15", cat: "標準動態", title: "弱點情資來源洗牌:NVD 不再全面補充資料、EPSS 進入 v5",
      summary: "NIST 自 2026 年 4 月起僅對 KEV、關鍵軟體等高風險 CVE 做完整 enrichment,只依賴 NVD CVSS/CPE 的掃描工具會出現資料缺口;FIRST 於 6 月上線 EPSS v5。另 ISO/IEC 27000:2026(概觀與詞彙)已發布,ISO/IEC 27001:2022(含 2024 氣候變遷修正案)仍為現行版。",
      action: "弱點情資改為 KEV、CISA Vulnrichment(SSVC)、EPSS 與廠商公告並用,不要單靠 NVD。",
      src: [{ n: "NIST", u: "https://www.nist.gov/news-events/news/2026/04/nist-updates-nvd-operations-address-record-cve-growth" }, { n: "DQS", u: "https://www.dqsglobal.com/en/explore/blog/iso-iec-27000-2026-released" }], v: "partial" },
    { date: "2026-06-18", cat: "標準動態", title: "後量子密碼(PQC)進入有期限階段:金管會指引與美國行政命令",
      summary: "金管會 6 月發布「金融業後量子密碼遷移參考指引」,規劃至 2035 年完成高風險系統遷移;美國行政命令要求聯邦高價值系統 2030~2031 年前完成 PQC 轉換,並將延伸至承包商,影響輸美資通產品供應鏈。",
      action: "啟動密碼資產盤點(CBOM),把加密敏捷性列入新採購規格,納入明年度資安計畫。",
      src: [{ n: "中央社", u: "https://www.cna.com.tw/news/afe/202606180393.aspx" }, { n: "Federal Register", u: "https://www.federalregister.gov/documents/2026/06/25/2026-12909/securing-the-nation-against-advanced-cryptographic-attacks" }], v: "partial" }
  ],
  trends: [
    { h: "AI 把「已知漏洞」變成即時威脅", t: "攻擊本質仍是已知弱點加上權限過大的 API,改變的是速度與成本。" },
    { h: "修補期限從「依嚴重度」轉為「依風險、以天計」", t: "臺灣資安署指引與美國 BOD 26-04 都採四指標,最短 3 天。" },
    { h: "修補量能成為瓶頸", t: "微軟連兩個月單月修補逾千個弱點,需投資自動化部署與情資整合。" },
    { h: "邊界設備與 SaaS 供應鏈是主要破口", t: "VPN、防火牆、郵件閘道接連列入 KEV;單一平台商可波及上千品牌。" },
    { h: "個資最小化與通報義務升溫", t: "保存期限、委外責任、通知當事人成為稽核重點;PQC 開始有期程。" }
  ],

  changelog: [
    "創刊號:建立智庫架構(內部 ISMS 知識庫、外部法規庫、情資雷達、全文搜尋)",
    "本期宣導:各機關基於風險導向之弱點處置期限評估指引(115/11/6)",
    "內部文件連動修訂:ISMS-2-13 弱點與修補管理程序 V3.0 等 7 份",
    "本期小遊戲:弱點急診室"
  ]
};

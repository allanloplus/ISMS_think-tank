/* 組織設定檔:政策、目標、關注方、內外部議題
 * 換客戶時只要改這一個檔(加上 internal-docs.js)即可。
 * ※ 烏托邦機關為模擬組織,所有數值皆為示意。 */
window.TT = window.TT || {};
TT.org = {
  name: "烏托邦機關",
  type: "公務機關",
  level: "資通安全責任等級 A 級(模擬)",
  scope: "資訊處所轄核心資通系統之開發、維運,以及機房與相關支援作業",
  cert: "ISO/IEC 27001:2022(CNS 27001)第三方驗證",
  simulated: true,

  policy: {
    docId: "ISMS-1-01",
    version: "V3.0",
    approved: "2026-01-15",
    approver: "資通安全長",
    slogan: "資安人人有責,風險導向,持續改善",
    statement:
      "烏托邦機關為確保業務所需資訊之機密性、完整性與可用性,並符合資通安全管理法、個人資料保護法及相關法令要求,特建立、實作、維持並持續改善資訊安全管理系統(ISMS),以風險管理為基礎保護資訊資產,提供民眾安全可信賴的數位服務。",
    principles: [
      { k: "C", name: "機密性", en: "Confidentiality", text: "資訊僅供經授權者存取;依資訊分級落實最小權限與加密保護。" },
      { k: "I", name: "完整性", en: "Integrity", text: "確保資訊與處理方法正確完整;變更須經授權、留存軌跡。" },
      { k: "A", name: "可用性", en: "Availability", text: "經授權者於需要時可即時取得資訊與服務;核心系統備援並定期演練。" },
      { k: "L", name: "適法性", en: "Compliance", text: "遵循資通安全管理法、個資法、AI 相關法令及契約義務。" }
    ],
    commitments: [
      "全體同仁、委外廠商及第三方人員均應遵守本政策",
      "依風險評鑑結果配置資源,將風險降至可接受等級",
      "知悉資安弱點時,依風險導向期限完成修補或緩解",
      "資安事件依法於時限內通報、應變並檢討改善",
      "每年至少一次管理審查,確保政策持續適切有效"
    ]
  },

  objectives: [
    { id: "O1", name: "核心資通系統可用率", target: "≥ 99.5%", value: 99.82, goal: 99.5, max: 100, min: 98, unit: "%", owner: "資訊處維運科", freq: "每月", cia: "A" },
    { id: "O2", name: "第三、四級資安事件", target: "0 件", value: 0, goal: 0, max: 3, min: 0, unit: "件", owner: "資安推動小組", freq: "每季", cia: "CIA", lowerBetter: true },
    { id: "O3", name: "弱點依限處置率(3/14/60 天)", target: "100%", value: 96, goal: 100, max: 100, min: 0, unit: "%", owner: "資訊處資安科", freq: "每月", cia: "I", isNew: true },
    { id: "O4", name: "社交工程演練點擊率", target: "≤ 3%", value: 2.1, goal: 3, max: 10, min: 0, unit: "%", owner: "資安推動小組", freq: "每半年", cia: "C", lowerBetter: true },
    { id: "O5", name: "資安教育訓練完成率", target: "100%", value: 92, goal: 100, max: 100, min: 0, unit: "%", owner: "人事室/資安科", freq: "每年", cia: "CIA" },
    { id: "O6", name: "營運持續演練 RTO 達成", target: "100%", value: 100, goal: 100, max: 100, min: 0, unit: "%", owner: "資訊處維運科", freq: "每年", cia: "A" },
    { id: "O7", name: "稽核缺失如期改善率", target: "100%", value: 100, goal: 100, max: 100, min: 0, unit: "%", owner: "稽核小組", freq: "每季", cia: "CIA" },
    { id: "O8", name: "委外廠商資安查核完成率", target: "100%", value: 75, goal: 100, max: 100, min: 0, unit: "%", owner: "資訊處/秘書室", freq: "每年", cia: "CIA" }
  ],

  parties: [
    { name: "數位發展部資通安全署", special: true, needs: "遵循資通安全管理法及子法;依限通報事件;配合稽核與演練;落實弱點處置期限指引", how: "法規鑑別表、資安維護計畫、實施情形提報" },
    { name: "上級/主管機關", special: true, needs: "達成資安責任等級應辦事項;資安稽核無重大缺失", how: "年度稽核、管理審查報告" },
    { name: "個人資料保護委員會(籌備處)", special: true, needs: "個資蒐集處理利用適法;事故通知當事人;修正條文施行後之個資保護長與通報義務(預備法遵)", how: "個資盤點、事故通報程序" },
    { name: "民眾/服務使用者", special: false, needs: "線上服務不中斷;個資不外洩;資訊正確", how: "可用率目標、個資保護、對外公告" },
    { name: "機關首長與資通安全長", special: false, needs: "資安風險可視、資源配置有據、法遵無虞", how: "管理審查、風險儀表板" },
    { name: "內部同仁", special: false, needs: "清楚易行的規範、足夠的訓練與工具", how: "教育訓練、本智庫、宣導" },
    { name: "委外廠商/供應鏈", special: true, needs: "明確的資安契約要求、權限與交付標準", how: "委外契約資安條款、廠商查核" },
    { name: "驗證機構 / TAF", special: false, needs: "ISMS 符合 ISO/IEC 27001:2022 並持續有效運作", how: "年度追查、三年重審" },
    { name: "資安聯防夥伴(N-ISAC / SOC 廠商)", special: false, needs: "情資即時交換、告警有效處理", how: "情資分享、SOC 月報" }
  ],

  issues: {
    internal: [
      { title: "資安專職人力不足且流動", impact: "高", note: "A 級機關需 4 名資安專職人力,專業證照與職能訓練需持續補齊" },
      { title: "老舊系統與 EOS 設備仍在線", impact: "高", note: "無法修補之弱點需依新指引採補償性控制並經資訊(安)主管核准" },
      { title: "同仁自行使用生成式 AI(Shadow AI)", impact: "中", note: "需訂定 AI 使用規範,禁止輸入機敏資料與個資" },
      { title: "資產盤點與對外曝露面未完全掌握", impact: "高", note: "弱點期限評估的第一個指標就是『是否曝露於公眾網路』" },
      { title: "委外依賴度高", impact: "中", note: "核心系統維運仰賴廠商,需強化契約、權限與稽核" }
    ],
    external: [
      { title: "AI 加速弱點武器化與自動化攻擊", impact: "高", note: "弱點揭露到遭利用的時間大幅縮短,促成 115/11/6 弱點處置期限指引" },
      { title: "資通安全管理法新法施行(114/12/1)與子法修正", impact: "高", note: "條號全面變動、兩部子法更名;法規鑑別表與程序書引用條文須更新" },
      { title: "個資法修正條文待施行、個資會仍在籌備", impact: "中", note: "個資保護長、事故通報主管機關等新義務尚未生效,先列為預備法遵並追蹤施行日" },
      { title: "人工智慧基本法施行(115/1/14)", impact: "中", note: "政府使用 AI 須風險評估並訂內控規範;2027 年初前應完成" },
      { title: "供應鏈攻擊與邊界設備零時差弱點", impact: "高", note: "VPN、防火牆等對外設備為首要目標" },
      { title: "地緣政治下的國家級網路威脅", impact: "高", note: "政府機關為主要攻擊目標,DDoS、APT、假訊息並行" }
    ]
  }
};

/* Allan's ISMS智庫 — 主程式
 * 資料來源:data/manifest.js、org.js、internal-docs.js、regulations.js、issues/<期別>.js
 * 每月更新只需動 data/ 內的檔案,本檔通常不必修改。 */
(function () {
  "use strict";
  const TT = (window.TT = window.TT || {});
  TT.games = TT.games || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const face = (who, f) => (TT.inline && TT.inline[`${who}-${f}`]) || `assets/img/chars/${who}-${f}.webp`; // TT.inline:單檔版內嵌圖
  const NAMES = { allan: "Allan 顧問", arale: "阿拉雷" };
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  TT.util = { $, $$, esc, face };

  /* ── 弱點期限計算(本期宣導與遊戲共用) ── */
  TT.vuln = {
    type: (f) => 1 + (f[0] ? 0 : 8) + (f[1] ? 0 : 4) + (f[2] ? 0 : 2) + (f[3] ? 0 : 1),
    days: (f, table) => table[TT.vuln.type(f) - 1],
    label: (d) => (d ? d + " 天" : "待下次系統更新"),
    cls: (d) => "d" + d
  };

  /* ── 載入期別 ── */
  const want = new URLSearchParams(location.search).get("issue");
  const known = TT.manifest.issues.map((i) => i.id);
  const issueId = known.includes(want) ? want : TT.manifest.current;
  if (TT.issue && TT.issue.id === issueId) Promise.resolve().then(init); // 單檔版:期別已內嵌
  else {
    const s = document.createElement("script");
    s.src = `data/issues/${issueId}.js`;
    s.onload = init;
    s.onerror = () => (document.body.innerHTML = "<p style='padding:40px;color:#fff'>找不到期別資料:" + esc(issueId) + "</p>");
    document.head.appendChild(s);
  }

  function init() {
    const I = TT.issue, O = TT.org;
    const M = TT.manifest, isPast = I.id !== M.current, single = !!TT.inline;
    $("#issueLabel").innerHTML = isPast ? `過往期別:<b>${esc(I.label)}</b>` : `本智庫每月更新,本期為 <b>${esc(I.label)}</b>`;
    $("#orgName").textContent = O.name + " 專屬版";
    // 期別切換(單檔版只含一期,不提供切換)
    const sel = $("#issueSel");
    sel.innerHTML = M.issues.filter((m) => !single || m.id === I.id).map((m) => `<option value="${m.id}" ${m.id === I.id ? "selected" : ""}>${esc(m.label)}${m.id === M.current ? "(最新)" : ""}</option>`).join("");
    sel.disabled = single || M.issues.length < 2;
    sel.onchange = () => (location.href = sel.value === M.current ? location.pathname : "?issue=" + sel.value);
    if (isPast) {
      const cur = M.issues.find((m) => m.id === M.current);
      $("#pastbar").innerHTML = `📚 您正在看<b>過往期別(${esc(I.label)})</b>,情資與法規重點可能已非最新。<a href="${location.pathname}">回到最新一期${cur ? ":" + esc(cur.label) : ""} →</a>`;
      $("#pastbar").hidden = false; document.body.classList.add("past");
    }
    $("#headline").textContent = I.headline;
    $("#heroSub").textContent = I.sub;
    $("#footIssue").textContent = I.label + " · 發行日 " + I.published;
    document.title = `Allan's ISMS智庫｜${I.label}`;
    renderHero(I);
    renderLatest(I);
    renderFeature(I.feature);
    renderGame(I.game);
    renderPolicy(O);
    renderInternal();
    renderExternal();
    renderIntel(I);
    renderAbout(I);
    buildSearch();
    setupUI();
    setupBuddy();
    bgCanvas();
    reveal();
    if (location.hash.length > 1) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 150);
  }

  /* ───────── HERO ───────── */
  function renderHero(I) {
    const quick = ["弱點", "通報", "個資", "AI", "委外", "KEV", "資安長"];
    $("#quick").innerHTML = "<span>熱門:</span>" + quick.map((k) => `<button type="button" data-q="${k}">${k}</button>`).join("");
    const st = [
      [TT.docs.length, "內部 ISMS 文件"],
      [(TT.regs || []).length, "外部法規/標準"],
      [I.intel.length, "本期情資"],
      [TT.org.objectives.length, "資安目標"]
    ];
    $("#stats").innerHTML = st.map(([n, l]) => `<div><b data-count="${n}">0</b><span>${l}</span></div>`).join("");
    // 對話
    const bubble = $("#bubble"), txt = $("#bubbleText"), who = $("#bubbleWho");
    let idx = -1, timer = null, auto = null;
    function say(i) {
      idx = (i + I.dialogue.length) % I.dialogue.length;
      const d = I.dialogue[idx];
      clearInterval(timer); clearTimeout(auto);
      bubble.className = "bubble from-" + d.who;
      who.innerHTML = `<img src="${face(d.who, d.face)}" alt=""><b>${NAMES[d.who]}</b>`;
      $("#actorAllan").classList.toggle("talking", d.who === "allan");
      $("#actorArale").classList.toggle("talking", d.who === "arale");
      if (reduce) { txt.textContent = d.text; }
      else {
        let n = 0; txt.textContent = "";
        timer = setInterval(() => { txt.textContent = d.text.slice(0, ++n); if (n >= d.text.length) clearInterval(timer); }, 38);
      }
      auto = setTimeout(() => say(idx + 1), d.text.length * 38 + 3800);
    }
    $("#bubbleNext").onclick = () => say(idx + 1);
    $$(".actor").forEach((a) => (a.onclick = () => say(idx + 1)));
    say(0);
  }

  /* 手機版長清單:先顯示前 6 筆,其餘按「顯示全部」展開(桌機不受影響,由 CSS 控制) */
  function more(sel) {
    const el = $(sel); el.classList.add("lim"); el.classList.remove("all");
    const old = el.nextElementSibling;
    if (old && old.classList.contains("more-btn")) old.hidden = true, old.className = "";
    const n = el.children.length; if (n <= 6) return;
    const b = document.createElement("button"); b.className = "more-btn"; b.textContent = `顯示全部 ${n} 筆 ▾`;
    b.onclick = () => { el.classList.add("all"); b.hidden = true; b.className = ""; };
    el.after(b);
  }

  const secHead = (kicker, title, desc, who, f, line) => `
    <div class="sec-head rv">
      <div><div class="kicker">${esc(kicker)}</div><h2>${esc(title)}</h2>${desc ? `<p>${esc(desc)}</p>` : ""}</div>
      ${who ? `<div class="aside-say ${who}"><img src="${face(who, f)}" alt="${NAMES[who]}"><span>${esc(line)}</span></div>` : ""}
    </div>`;

  /* ───────── 最新動態(首頁):法規異動 × 資安情資 ───────── */
  const md = (d) => d.slice(5).replace("-", "/");
  function renderLatest(I) {
    const laws = (I.lawUpdates || []).slice().sort((a, b) => b.date.localeCompare(a.date));
    const news = I.intel.map((x, i) => ({ x, i })).filter(({ x }) => x.cat !== "法規政策" && x.cat !== "標準動態").sort((a, b) => b.x.date.localeCompare(a.x.date));
    $("#heroCta").innerHTML = `<a href="#latest" data-pane="law"><i>🏛</i><span><b>法令法規異動</b><small>政府機關必看 · ${laws.length} 則</small></span></a><a href="#latest" data-pane="news"><i>🏢</i><span><b>重要資安情資</b><small>民間企業必看 · ${news.length} 則</small></span></a>`;
    const st = (s) => `<em class="st st-${{ 已發布: "pub", 已施行: "on", 已生效: "on", 預告中: "draft", 待施行: "wait", 即將生效: "wait" }[s] || "pub"}">${esc(s)}</em>`;
    const lawRow = (u) => `<li class="${u.hot ? "hot" : ""}"><time>${u.date.slice(0, 4)}<b>${md(u.date)}</b></time><div>
        <a class="lt-title" href="#" ${u.reg ? `data-reg="${u.reg}"` : ""}>${esc(u.title)}</a>
        <div class="lt-meta">${st(u.st)}<span>${esc(u.who)}</span>${u.v === "partial" ? '<span class="pv">待覆核</span>' : ""}${u.url ? `<a href="${esc(u.url)}" target="_blank" rel="noopener">${u.v === "partial" ? "參考來源" : "官方來源"} ↗</a>` : ""}</div></div></li>`;
    const newsRow = ({ x, i }) => `<li class="${x.hot ? "hot" : ""}"><time>${x.date.slice(0, 4)}<b>${md(x.date)}</b></time><div>
        <a class="lt-title" href="#intel-${i}" data-intel="${i}">${esc(x.title)}</a>
        <div class="lt-meta"><em class="st st-cat">${esc(x.cat)}</em>${x.v === "partial" ? '<span class="pv">待覆核</span>' : ""}${x.src[0] ? `<a href="${esc(x.src[0].u)}" target="_blank" rel="noopener">${esc(x.src[0].n)} ↗</a>` : ""}</div></div></li>`;
    const watch = (I.lawWatch || []).map((w) => `<li><b>${esc(w.when)}</b>${w.reg ? `<a href="#" data-reg="${w.reg}">${esc(w.title)}</a>` : w.url ? `<a href="${esc(w.url)}" target="_blank" rel="noopener">${esc(w.title)} ↗</a>` : esc(w.title)}</li>`).join("");
    $("#latest").innerHTML = secHead("最新動態 · " + I.label, "近期法規異動與資安情資", "政府機關先看左邊,民間企業先看右邊;點標題看重點,點來源看原文。", "arale", "explain", "每月更新一次,這裡永遠是最新的!") + `
      <div class="lt-tabs rv" id="ltTabs"><button class="on" data-pane="law">🏛 法令法規異動 <i>${laws.length}</i></button><button data-pane="news">🏢 重要資安情資 <i>${news.length}</i></button></div>
      <div class="lt-grid show-law" id="ltGrid">
        <div class="lt-col law rv"><h3><i>🏛</i>近期法令法規異動<small>政府機關最關心</small></h3>
          <ul class="lt-list" id="ltLaw">${laws.map(lawRow).join("")}</ul>
          ${watch ? `<div class="lt-watch"><h4>⏳ 追蹤中:還沒生效,但要先準備</h4><ul>${watch}</ul></div>` : ""}
          <a class="lt-all" href="#external">看完整外部法規庫(${(TT.regs || []).length} 項,可依產業別查)→</a></div>
        <div class="lt-col news rv"><h3><i>🏢</i>近期重要資安情資<small>民間企業最關心</small></h3>
          <ul class="lt-list" id="ltNews">${news.map(newsRow).join("")}</ul>
          <a class="lt-all" href="#intel">看全部情資與建議行動(${I.intel.length} 則)→</a></div>
      </div>`;
    more("#ltLaw"); more("#ltNews");
    const pane = (p) => { $("#ltGrid").className = "lt-grid show-" + p; $$("#ltTabs button").forEach((b) => b.classList.toggle("on", b.dataset.pane === p)); };
    $$("#ltTabs button").forEach((b) => (b.onclick = () => pane(b.dataset.pane)));
    $$("#heroCta a").forEach((a) => a.addEventListener("click", () => pane(a.dataset.pane)));
    $("#ltNews").addEventListener("click", (e) => { const a = e.target.closest("[data-intel]"); if (a) { e.preventDefault(); jump("#intel-" + a.dataset.intel); } });
  }

  /* ───────── 本期宣導 ───────── */
  function renderFeature(F) {
    const V = TT.vuln;
    const rows = F.table.map((d, i) => {
      const b = [(i & 8) === 0, (i & 4) === 0, (i & 2) === 0, (i & 1) === 0];
      return `<tr data-t="${i + 1}"><td>${i + 1}</td>${b.map((x, k) => `<td class="${x ? "y" : "n"}">${k === 3 ? (x ? "完全" : "部分") : x ? "是" : "否"}</td>`).join("")}<td><span class="dl ${V.cls(d)}">${d ? d + " 天" : "下次更新"}</span></td></tr>`;
    }).join("");
    $("#feature").innerHTML = secHead(F.tag, F.title, `${F.issuer} · ${F.issued}`, "allan", "point", "這份指引要寫進 ISMS 程序書,稽核會看紀錄!") + `
    <div class="f-grid">
      <div class="card rv f-why"><h3>為什麼要訂?</h3><p>${esc(F.why)}</p><p class="muted"><b>依據:</b>${esc(F.basis)}</p></div>
      <div class="card rv"><h3>適用對象</h3><ul class="ticks">${F.scope.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
      <div class="card rv"><h3>什麼是「弱點處置」?</h3><p>${esc(F.definition)}</p></div>
    </div>
    <div class="countdown rv">
      <div class="cd d3"><b>3</b><span>天</span><em>最危險:對外 + 已被利用 / 可自動化 + 完全控制</em></div>
      <div class="cd d14"><b>14</b><span>天</span><em>高風險:已被利用,或對外且影響重大</em></div>
      <div class="cd d60"><b>60</b><span>天</span><em>中風險:可自動化但未曝露、未被利用</em></div>
      <div class="cd d0"><b>↻</b><span>下次更新</span><em>內網、未被利用、無法自動化</em></div>
    </div>

    <div class="eval rv" id="eval">
      <div class="eval-q">
        <h3><span class="badge">互動</span> 弱點處置期限試算器</h3>
        <p class="muted">回答 4 個問題,立刻知道這個弱點屬於哪一類型、幾天內要處理完。</p>
        ${F.indicators.map((x, k) => `
          <div class="q" data-k="${k}">
            <div class="q-t"><i>${x.n}</i><div><b>${esc(x.name)}</b><small>${esc(x.q)}</small></div></div>
            <div class="seg"><button data-v="1" class="on">${esc(x.yes)}</button><button data-v="0">${esc(x.no)}</button></div>
            <div class="q-tip">💡 ${esc(x.tip)}</div>
          </div>`).join("")}
      </div>
      <div class="eval-r">
        <div class="r-face"><img id="evalFace" src="${face("arale", "surprised")}" alt=""></div>
        <div class="r-type">類型 <b id="evalType">1</b> / 16</div>
        <div class="r-days" id="evalDays"></div>
        <div class="r-note" id="evalNote"></div>
        <div class="r-path" id="evalPath"></div>
      </div>
    </div>

    <details class="card rv tbl-wrap" open>
      <summary><h3>表一:弱點處置期限評估表(類型 1~16)</h3></summary>
      <div class="tbl-scroll"><table class="tbl" id="evalTable">
        <thead><tr><th>類型</th><th>①曝露於<br>公眾網路</th><th>②已知<br>被利用</th><th>③可自動化<br>利用</th><th>④技術<br>影響</th><th>處置期限</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
    </details>

    <div class="f-two">
      <div class="card rv"><h3>評估結果怎麼處理?</h3><dl class="rules">${F.rules.map((r) => `<dt>${esc(r.h)}</dt><dd>${esc(r.t)}</dd>`).join("")}</dl></div>
      <div class="card rv"><h3>修不了怎麼辦?7 種緩解/補償性控制</h3><div class="mit">${F.mitigations.map((m) => `<div class="mit-i"><i>${m.icon}</i><div><b>${esc(m.name)}</b><span>${esc(m.text)}</span></div></div>`).join("")}</div></div>
    </div>

    <div class="card rv todo"><h3>✅ 烏托邦機關的行動清單</h3>
      <div class="todo-list">${F.actions.map((a) => `<label><input type="checkbox"><span><em>${esc(a.who)}</em>${esc(a.text)}${a.doc ? ` <a href="#" data-doc="${a.doc}">${a.doc} ↗</a>` : ""}</span></label>`).join("")}</div>
      <p class="note">🏢 <b>一般企業:</b>${esc(F.enterpriseNote)}</p>
      <p class="muted small">${esc(F.sourceNote)}</p>
    </div>`;

    const state = [1, 1, 1, 1];
    function upd() {
      const t = V.type(state), d = V.days(state, F.table);
      $("#evalType").textContent = t;
      const el = $("#evalDays");
      el.className = "r-days " + V.cls(d);
      el.innerHTML = d ? `<b>${d}</b><span>天內完成處置</span>` : `<b>↻</b><span>待下次系統更新</span>`;
      el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
      const strict = [1, 2, 3, 9].includes(t);
      $("#evalNote").innerHTML = strict
        ? "⚠️ <b>類型 1、2、3、9:</b>先評估受影響範圍、保存並檢視日誌、監控異常活動,確認是否已遭利用。"
        : d === 0 ? "納入例行維護排程即可,但條件改變(例如被列入 KEV)要重新評估。" : "自知悉日起算、以日曆天計;無法依限完成須採補償性控制並經資訊(安)主管核准。";
      $("#evalFace").src = face("arale", d === 3 ? "surprised" : d === 14 ? "explain" : d === 60 ? "think" : "wink");
      $("#evalPath").innerHTML = F.indicators.map((x, k) => `<span class="${state[k] ? "y" : "n"}">${x.n} ${state[k] ? x.yes : x.no}</span>`).join("<i>→</i>");
      $$("#evalTable tbody tr").forEach((r) => r.classList.toggle("hit", +r.dataset.t === t));
    }
    $$("#eval .q").forEach((q) => {
      $$("button", q).forEach((b) => (b.onclick = () => {
        state[+q.dataset.k] = +b.dataset.v;
        $$("button", q).forEach((x) => x.classList.toggle("on", x === b));
        upd();
      }));
    });
    $$("#evalTable tbody tr").forEach((r) => (r.onclick = () => {
      const i = +r.dataset.t - 1;
      [8, 4, 2, 1].forEach((m, k) => {
        state[k] = (i & m) === 0 ? 1 : 0;
        $$(`#eval .q[data-k="${k}"] button`).forEach((x) => x.classList.toggle("on", +x.dataset.v === state[k]));
      });
      upd();
      $("#eval").scrollIntoView({ behavior: "smooth", block: "center" });
    }));
    upd();
  }

  /* ───────── 小遊戲 ───────── */
  function renderGame(G) {
    $("#game").innerHTML = secHead("本期小遊戲 · 每月換新", G.title, G.tagline, "arale", "cheer", "玩一局只要 2 分鐘,挑戰首席資安官!") + `<div class="game rv" id="gameRoot"></div>
      <div class="arcade rv"><h3>🕹 歷期小遊戲 <small>每月一款,過去的都還能玩</small></h3><div class="arcade-list">${TT.manifest.issues.map((m) => {
        const here = m.id === TT.issue.id, latest = m.id === TT.manifest.current;
        return here ? `<span class="on"><i>${m.gameIcon || "🎮"}</i><b>${esc(m.game)}</b><small>${esc(m.label)} · 正在玩</small></span>`
          : TT.inline ? "" : `<a href="${latest ? location.pathname : "?issue=" + m.id}#game"><i>${m.gameIcon || "🎮"}</i><b>${esc(m.game)}</b><small>${esc(m.label)}${latest ? " · 最新" : ""} · 去玩 ▶</small></a>`;
      }).join("")}<span class="soon"><i>✨</i><b>下個月見</b><small>新主題、新遊戲</small></span></div></div>`;
    const g = TT.games[G.type];
    if (g) g.mount($("#gameRoot"), G, TT);
    else $("#gameRoot").innerHTML = "<p class='muted'>本期遊戲模組未載入。</p>";
  }

  /* ───────── 政策與目標 ───────── */
  function renderPolicy(O) {
    const P = O.policy;
    const ring = (o) => {
      const pct = Math.max(0.03, Math.min(1, (o.value - o.min) / (o.max - o.min || 1)));
      const ok = o.lowerBetter ? o.value <= o.goal : o.value >= o.goal;
      const C = 2 * Math.PI * 34;
      return `<div class="obj ${ok ? "ok" : "warn"} rv">
        <svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" class="tr"/><circle cx="40" cy="40" r="34" class="fg" stroke-dasharray="${C}" stroke-dashoffset="${C}" data-off="${C * (1 - (o.lowerBetter && o.value === 0 ? 1 : pct))}"/></svg>
        <div class="obj-v"><b>${o.value}</b><small>${o.unit}</small></div>
        <div class="obj-t"><b>${esc(o.name)}${o.isNew ? ' <i class="new">NEW</i>' : ""}</b><span>目標 ${esc(o.target)} · ${ok ? "達成" : "待加強"}</span><small>${esc(o.owner)}｜${esc(o.freq)}量測</small></div>
      </div>`;
    };
    const iss = (arr) => arr.map((x) => `<li><span class="imp ${x.impact === "高" ? "hi" : "mid"}">${x.impact}</span><div><b>${esc(x.title)}</b><small>${esc(x.note)}</small></div></li>`).join("");
    $("#policy").innerHTML = secHead("資安政策與目標", `${O.name}的資安承諾`, `${O.level} · ${O.cert}`, "allan", "smile", "政策不是貼牆上的標語,每個人都要說得出來。") + `
    <div class="policy rv">
      <div class="policy-main">
        <div class="slogan">「${esc(P.slogan)}」</div>
        <p>${esc(P.statement)}</p>
        <div class="meta">文件 <a href="#" data-doc="${P.docId}">${P.docId}</a> · ${P.version} · ${P.approved} ${esc(P.approver)}核定 · 驗證範圍:${esc(O.scope)}</div>
      </div>
      <div class="cia">${P.principles.map((p) => `<div class="cia-i" tabindex="0"><i>${p.k}</i><b>${esc(p.name)}</b><small>${p.en}</small><p>${esc(p.text)}</p></div>`).join("")}</div>
      <ul class="commit">${P.commitments.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
    </div>
    <h3 class="sub rv">資安目標達成情形 <small>${O.simulated ? "(模擬數據)" : ""}</small></h3>
    <div class="objs">${O.objectives.map(ring).join("")}</div>
    <div class="f-two">
      <div class="card rv"><h3>關注方與其要求 <small class="muted">★ 為特殊關注方</small></h3>
        <div class="parties">${O.parties.map((p) => `<details class="${p.special ? "sp" : ""}"><summary>${p.special ? "★ " : ""}${esc(p.name)}</summary><p><b>需求與期望:</b>${esc(p.needs)}</p><p><b>因應方式:</b>${esc(p.how)}</p></details>`).join("")}</div>
      </div>
      <div class="card rv"><h3>內外部資安議題</h3>
        <h4>外部議題</h4><ul class="issues">${iss(O.issues.external)}</ul>
        <h4>內部議題</h4><ul class="issues">${iss(O.issues.internal)}</ul>
      </div>
    </div>`;
  }

  /* ───────── 內部 ISMS ───────── */
  const TIER = { 1: "一階 政策/手冊", 2: "二階 程序書", 3: "三階 作業說明", 4: "四階 表單紀錄" };
  function docCard(d) {
    return `<button class="doc t${d.tier} rv" data-doc="${d.id}">
      <span class="doc-id">${d.id}</span>${d.updated === TT.issue.id ? '<i class="new">本期修訂</i>' : ""}
      <b>${esc(d.title)}</b><p>${esc(d.summary)}</p>
      <span class="doc-meta">${d.ver} · ${d.date} · ${esc(d.owner)}</span></button>`;
  }
  function renderInternal() {
    $("#internal").innerHTML = secHead("內部 ISMS 知識庫", `${TT.org.name} ISMS 四階文件`, "點文件卡片看重點摘要;右上角搜尋可全文檢索。", "arale", "explain", "找不到文件?按「/」直接搜尋最快!") + `
      <div class="toolbar rv"><div class="tabs" id="tierTabs"><button class="on" data-t="0">全部 <i>${TT.docs.length}</i></button>${[1, 2, 3, 4].map((t) => `<button data-t="${t}">${TIER[t]} <i>${TT.docs.filter((d) => d.tier === t).length}</i></button>`).join("")}<button data-t="u">本期修訂 <i>${TT.docs.filter((d) => d.updated === TT.issue.id).length}</i></button></div>
      <input class="filter" id="docFilter" type="search" placeholder="篩選文件…"></div>
      <div class="docs" id="docList"></div>`;
    let tier = "0", kw = "";
    const draw = () => {
      const list = TT.docs.filter((d) => (tier === "0" || (tier === "u" ? d.updated === TT.issue.id : d.tier === +tier)) && (!kw || JSON.stringify(d).toLowerCase().includes(kw)));
      $("#docList").innerHTML = list.map(docCard).join("") || "<p class='muted'>沒有符合的文件。</p>";
      $$("#docList .rv").forEach((e) => e.classList.add("in")); more("#docList");
    };
    $$("#tierTabs button").forEach((b) => (b.onclick = () => { tier = b.dataset.t; $$("#tierTabs button").forEach((x) => x.classList.toggle("on", x === b)); draw(); }));
    $("#docFilter").oninput = (e) => { kw = e.target.value.trim().toLowerCase(); draw(); };
    draw();
  }
  function openDoc(id) {
    const d = TT.docs.find((x) => x.id === id); if (!d) return;
    modal(`<div class="m-kick t${d.tier}">${TIER[d.tier]} · ${d.id}${d.updated === TT.issue.id ? ' · <i class="new">本期修訂</i>' : ""}</div>
      <h2>${esc(d.title)}</h2>
      <div class="m-meta">版次 ${d.ver} · 生效 ${d.date} · 權責 ${esc(d.owner)}</div>
      <div class="chips">${d.iso.map((c) => `<span>ISO 27001 ${esc(c)}</span>`).join("")}</div>
      <p class="lead">${esc(d.summary)}</p>
      <h4>重點規定</h4><ol class="pts">${d.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
      ${d.forms ? `<h4>相關表單</h4><ul class="forms">${d.forms.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
      ${d.tags ? `<div class="chips tags">${d.tags.map((t) => `<button data-q="${esc(t)}">#${esc(t)}</button>`).join("")}</div>` : ""}
      <p class="muted small">${TT.org.simulated ? "※ 模擬文件摘要,實際內容以機關核定發行版本為準。" : ""}</p>`);
  }

  /* ───────── 外部法規 ───────── */
  function regCard(r) {
    return `<button class="reg rv" data-reg="${r.id}">${r.isNew ? '<i class="new">本期新增</i>' : ""}
      <b>${esc(r.title)}</b><span class="reg-auth">${esc(r.auth)}</span><p>${esc(r.points[0])}</p>
      <span class="doc-meta">${esc(r.date || "")}${r.v === "partial" ? " · ⚠ 待覆核" : ""}</span></button>`;
  }
  function renderExternal() {
    const S = TT.sectors || [], R = TT.regs || [];
    $("#external").innerHTML = secHead("外部法規庫", "公務機關 × 各產業 法令法規地圖", "先選身分,再看「一定要知道」的法規重點與官方連結。", "allan", "think", "法規鑑別表至少每半年要對一次,這裡幫你先整理好。") + `
      <div class="sectors rv" id="sectorTabs">${S.map((s, i) => `<button class="${i ? "" : "on"}" data-s="${s.id}"><i>${s.icon}</i><b>${esc(s.name)}</b><small>${R.filter((r) => r.sector === s.id).length} 項</small></button>`).join("")}</div>
      <div class="sector-desc rv" id="sectorDesc"></div>
      <div class="regs" id="regList"></div>`;
    const draw = (id) => {
      const s = S.find((x) => x.id === id);
      $("#sectorDesc").innerHTML = s ? `<b>${esc(s.name)}</b> — ${esc(s.desc)}` : "";
      $("#regList").innerHTML = R.filter((r) => r.sector === id).map(regCard).join("");
      $$("#regList .rv").forEach((e) => e.classList.add("in")); more("#regList");
    };
    $$("#sectorTabs button").forEach((b) => (b.onclick = () => { $$("#sectorTabs button").forEach((x) => x.classList.toggle("on", x === b)); draw(b.dataset.s); }));
    if (S[0]) draw(S[0].id);
  }
  function openReg(id) {
    const r = (TT.regs || []).find((x) => x.id === id); if (!r) return;
    const s = (TT.sectors || []).find((x) => x.id === r.sector) || {};
    modal(`<div class="m-kick ext">${esc(s.name || "外部法規")}${r.isNew ? ' · <i class="new">本期新增</i>' : ""}</div>
      <h2>${esc(r.title)}</h2>
      <div class="m-meta">${esc(r.auth)}${r.date ? " · " + esc(r.date) : ""}</div>
      <h4>對 ISMS 的重點要求</h4><ol class="pts">${r.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
      ${r.iso ? `<div class="chips">${r.iso.map((c) => `<span>${esc(c)}</span>`).join("")}</div>` : ""}
      ${r.docs ? `<h4>對應內部文件</h4><div class="chips">${r.docs.map((c) => `<button data-doc="${c}">${c} ↗</button>`).join("")}</div>` : ""}
      ${r.url ? `<p><a class="btn" href="${esc(r.url)}" target="_blank" rel="noopener">開啟官方來源 ↗</a></p>` : ""}
      <p class="muted small">${r.v === "partial" ? "⚠ 本項部分內容尚未以官方原文完成覆核,引用前請再確認。" : "查證日:" + esc(TT.regsChecked || TT.issue.published)}　法規以主管機關公告之最新版本為準。</p>`);
  }

  /* ───────── 情資雷達 ───────── */
  function renderIntel(I) {
    const cats = ["全部"].concat([...new Set(I.intel.map((x) => x.cat))]);
    $("#intel").innerHTML = secHead("情資雷達", "本期內外部資安議題情資", "每則都附「對 ISMS 的建議行動」與來源連結。", "arale", "surprised", "這個月 KEV 清單超熱鬧,邊界設備要顧好!") + `
      <div class="trends rv">${I.trends.map((t, i) => `<div><i>${i + 1}</i><b>${esc(t.h)}</b><span>${esc(t.t)}</span></div>`).join("")}</div>
      <div class="tabs rv" id="intelTabs">${cats.map((c, i) => `<button class="${i ? "" : "on"}" data-c="${c}">${c}</button>`).join("")}</div>
      <div class="intel" id="intelList"></div>`;
    const draw = (c) => {
      $("#intelList").innerHTML = I.intel.map((x, i) => ({ x, i })).filter(({ x }) => c === "全部" || x.cat === c).sort((a, b) => b.x.date.localeCompare(a.x.date))
        .map(({ x, i }) => `<article class="it rv in ${x.hot ? "hot" : ""}" id="intel-${i}">
          <div class="it-h"><time>${x.date}</time><span class="cat">${esc(x.cat)}</span>${x.hot ? '<span class="hotb">重點</span>' : ""}${x.v === "partial" ? '<span class="pv" title="僅依媒體摘要,未讀到原始公告">待覆核</span>' : ""}</div>
          <h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p>
          <div class="act"><b>建議行動</b>${esc(x.action)}</div>
          <div class="src">${x.src.map((s) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.n)} ↗</a>`).join("")}</div><span class="it-more">展開全文與來源 ▾</span></article>`).join("");
      more("#intelList");
    };
    $$("#intelTabs button").forEach((b) => (b.onclick = () => { $$("#intelTabs button").forEach((x) => x.classList.toggle("on", x === b)); draw(b.dataset.c); }));
    $("#intelList").onclick = (e) => { const it = e.target.closest(".it"); if (it && !e.target.closest("a")) it.classList.toggle("open"); };
    draw("全部");
  }

  /* ───────── 關於/更新 ───────── */
  function renderAbout(I) {
    $("#about").innerHTML = secHead("關於本智庫", "每月更新,持續累積", "", null) + `
      <div class="f-two">
        <div class="card rv"><h3>本期更新內容</h3><ul class="ticks">${I.changelog.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
        <div class="card rv"><h3>歷期智庫</h3><div class="archive">${TT.manifest.issues.map((m) => `<div class="arc ${m.id === I.id ? "on" : ""}"><div><b>${esc(m.label)}${m.id === TT.manifest.current ? ' <i class="new">最新</i>' : ""}</b><span>${esc(m.topic)} · ${m.gameIcon || "🎮"} ${esc(m.game)}</span></div>
          ${TT.inline ? "" : `<div class="arc-btns">${m.id === I.id ? "<em>目前顯示</em>" : `<a href="${m.id === TT.manifest.current ? location.pathname : "?issue=" + m.id}">線上看</a>`}<a href="dist/Allans-ISMS-ThinkTank-${m.id}.html" target="_blank" rel="noopener" title="當月完整封存版,含當時的法規庫與內部文件">單檔封存版 ↗</a></div>`}</div>`).join("")}</div>
        <p class="muted small">線上版的法規庫與內部文件一律顯示最新狀態;要看當月原貌請開「單檔封存版」。</p>
        <p class="muted small">系統設計:Allan Lo 顧問,每月彙整法規異動與情資後發行。Allan\'s 分享:<a href="https://www.123hi.org" target="_blank" rel="noopener">www.123hi.org</a></p></div>
      </div>`;
  }

  /* ───────── 搜尋 ───────── */
  let INDEX = [], scope = "all";
  const SCOPES = [["all", "全部"], ["internal", "內部 ISMS"], ["external", "外部法規"], ["intel", "情資"], ["issue", "本期宣導"], ["org", "政策目標"]];
  function buildSearch() {
    const I = TT.issue, O = TT.org, F = I.feature;
    const add = (o) => INDEX.push(Object.assign(o, { hay: (o.title + " " + (o.tags || "") + " " + o.text).toLowerCase() }));
    TT.docs.forEach((d) => add({ scope: "internal", kind: d.id, title: d.title, tags: (d.tags || []).join(" ") + " " + d.id, text: [d.summary].concat(d.points, d.forms || [], d.iso).join(" "), go: () => openDoc(d.id) }));
    (TT.regs || []).forEach((r) => { const s = (TT.sectors || []).find((x) => x.id === r.sector) || {}; add({ scope: "external", kind: s.name || "法規", title: r.title, tags: r.auth + " " + (r.tags || []).join(" "), text: r.points.join(" "), go: () => openReg(r.id) }); });
    (I.lawUpdates || []).forEach((u) => add({ scope: "external", kind: "法規異動 · " + u.st, title: u.title, tags: u.date + " " + u.who, text: u.who + " " + u.st + " " + u.date, go: () => (u.reg ? openReg(u.reg) : jump("#latest")) }));
    I.intel.forEach((x, i) => add({ scope: "intel", kind: x.cat, title: x.title, tags: x.date, text: x.summary + " " + x.action, go: () => jump("#intel-" + i) }));
    add({ scope: "issue", kind: "本期宣導", title: F.title, tags: "弱點 修補 期限 KEV 3天 14天 60天", text: [F.why, F.basis, F.definition].concat(F.scope, F.indicators.map((x) => x.name + x.q + x.tip), F.rules.map((r) => r.h + r.t)).join(" "), go: () => jump("#feature") });
    F.mitigations.forEach((m) => add({ scope: "issue", kind: "補償性控制", title: m.name, text: m.text, go: () => jump("#feature .mit") }));
    add({ scope: "issue", kind: "小遊戲", title: I.game.title, text: I.game.tagline, go: () => jump("#game") });
    add({ scope: "org", kind: "資安政策", title: O.name + " 資訊安全政策", tags: "政策 CIA", text: O.policy.statement + O.policy.slogan + O.policy.principles.map((p) => p.name + p.text).join(" ") + O.policy.commitments.join(" "), go: () => jump("#policy") });
    O.objectives.forEach((o) => add({ scope: "org", kind: "資安目標", title: o.name, text: `目標 ${o.target} 目前 ${o.value}${o.unit} ${o.owner}`, go: () => jump("#policy .objs") }));
    O.parties.forEach((p) => add({ scope: "org", kind: p.special ? "特殊關注方" : "關注方", title: p.name, text: p.needs + " " + p.how, go: () => jump("#policy .parties") }));
    O.issues.internal.concat(O.issues.external).forEach((x) => add({ scope: "org", kind: "內外部議題", title: x.title, text: x.note, go: () => jump("#policy .issues") }));
    $("#scopes").innerHTML = SCOPES.map(([k, l]) => `<button data-s="${k}" class="${k === "all" ? "on" : ""}">${l}</button>`).join("");
    $$("#scopes button").forEach((b) => (b.onclick = () => { scope = b.dataset.s; $$("#scopes button").forEach((x) => x.classList.toggle("on", x === b)); runSearch(); }));
    $("#q").oninput = runSearch;
  }
  const hl = (s, terms) => { let h = esc(s); terms.forEach((t) => { if (t) h = h.replace(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark>${m}</mark>`); }); return h; };
  function runSearch() {
    const raw = $("#q").value.trim(), terms = raw.toLowerCase().split(/\s+/).filter(Boolean), box = $("#results");
    if (!terms.length) {
      box.innerHTML = `<div class="sp-empty"><img src="${face("arale", "think")}" alt=""><p>想找什麼呢?試試:</p><div class="quick">${["弱點 期限", "事件 通報", "個資", "委外", "零信任", "AI", "金融", "上市櫃", "備份"].map((k) => `<button data-q="${k}">${k}</button>`).join("")}</div></div>`;
      return;
    }
    const res = INDEX.filter((e) => (scope === "all" || e.scope === scope) && terms.every((t) => e.hay.includes(t)))
      .map((e) => ({ e, s: terms.reduce((a, t) => a + (e.title.toLowerCase().includes(t) ? 6 : 0) + ((e.tags || "").toLowerCase().includes(t) ? 3 : 0) + 1, 0) }))
      .sort((a, b) => b.s - a.s).slice(0, 40);
    if (!res.length) { box.innerHTML = `<div class="sp-empty"><img src="${face("arale", "cry")}" alt=""><p>找不到「${esc(raw)}」…換個關鍵字,或切換上方範圍試試。</p></div>`; return; }
    const lab = Object.fromEntries(SCOPES);
    box.innerHTML = `<div class="sp-count">找到 ${res.length} 筆</div>` + res.map(({ e }, i) => {
      const lo = e.text.toLowerCase(); let p = -1; terms.some((t) => (p = lo.indexOf(t)) >= 0);
      const snip = (p > 30 ? "…" : "") + e.text.slice(Math.max(0, p - 30), Math.max(0, p - 30) + 110) + "…";
      return `<button class="res s-${e.scope}" data-i="${i}"><span class="res-k">${lab[e.scope]} · ${esc(e.kind)}</span><b>${hl(e.title, terms)}</b><p>${hl(snip, terms)}</p></button>`;
    }).join("");
    $$(".res", box).forEach((b) => (b.onclick = () => { closeOv(); res[+b.dataset.i].e.go(); }));
  }
  function openSearch(q) {
    $("#searchOv").hidden = false; document.body.classList.add("lock");
    if (q != null) $("#q").value = q;
    runSearch(); $("#q").focus();
  }
  function modal(html) { $("#searchOv").hidden = true; $("#modalBody").innerHTML = html; $("#modalOv").hidden = false; document.body.classList.add("lock"); $(".modal").scrollTop = 0; }
  function closeOv() { $("#searchOv").hidden = true; $("#modalOv").hidden = true; document.body.classList.remove("lock"); }
  function jump(sel) {
    const el = $(sel); if (!el) return;
    const lim = el.closest(".lim"); if (lim) lim.classList.add("all");
    if (el.classList.contains("it")) el.classList.add("open");
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1800);
  }
  TT.open = { doc: openDoc, reg: openReg, search: openSearch };

  /* ───────── 共用 UI ───────── */
  function setupUI() {
    document.addEventListener("click", (e) => {
      const d = e.target.closest("[data-doc]"); if (d) { e.preventDefault(); return openDoc(d.dataset.doc); }
      const r = e.target.closest("[data-reg]"); if (r) { e.preventDefault(); return openReg(r.dataset.reg); }
      const q = e.target.closest("[data-q]"); if (q) { e.preventDefault(); $("#modalOv").hidden = true; return openSearch(q.dataset.q); }
      if (e.target.closest("[data-close]") || e.target.classList.contains("overlay")) closeOv();
    });
    $("#heroSearch").onsubmit = (e) => { e.preventDefault(); openSearch($("#heroQ").value); };
    $("#navSearch").onclick = () => openSearch();
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeOv();
      if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); openSearch(); }
    });
    $("#burger").onclick = () => $("#navLinks").classList.toggle("open");
    $$("#navLinks a").forEach((a) => (a.onclick = () => $("#navLinks").classList.remove("open")));
    window.addEventListener("scroll", () => $("#nav").classList.toggle("solid", scrollY > 30), { passive: true });
  }

  /* ───────── 浮動小幫手 ───────── */
  function setupBuddy() {
    const tips = {
      top: ["wink", "嗨!我是阿拉雷,點我可以直接搜尋智庫喔!"],
      latest: ["surprised", "公務機關看法規異動,企業看資安情資,都在這!"],
      feature: ["explain", "試試看試算器:把四個答案切一切,期限會跟著變!"],
      game: ["cheer", "弱點急診室開張!看你能拿幾分~"],
      policy: ["think", "考考你:資安政策的四個原則是哪四個?"],
      internal: ["explain", "標「本期修訂」的文件,記得通知相關同仁重新閱讀。"],
      external: ["surprised", "切換上面的產業別,法規重點都不一樣喔!"],
      intel: ["confused", "每則情資都有建議行動,挑跟你們有關的先做!"],
      about: ["laugh", "下個月見!會有新的宣導主題跟小遊戲~"]
    };
    const tip = $("#buddyTip"), img = $("#buddyImg");
    let cur = "", hideT;
    const show = (k) => {
      if (k === cur || !tips[k]) return; cur = k;
      img.src = face("arale", tips[k][0]); tip.textContent = tips[k][1];
      tip.classList.add("show"); clearTimeout(hideT); hideT = setTimeout(() => tip.classList.remove("show"), 6500);
      img.classList.remove("hop"); void img.offsetWidth; img.classList.add("hop");
    };
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && show(e.target.id || "top")), { rootMargin: "-45% 0px -45% 0px" });
    $$("main > section").forEach((s) => io.observe(s));
    $("#buddyBtn").onclick = () => openSearch();
    // 手機:試算器與遊戲進入畫面時讓小幫手退場,避免蓋住結果與按鈕(由 CSS 限定只在窄螢幕生效)
    const busy = new Set(), hide = new IntersectionObserver((es) => {
      es.forEach((e) => (e.isIntersecting ? busy.add(e.target) : busy.delete(e.target)));
      document.body.classList.toggle("nobuddy", busy.size > 0);
    }, { rootMargin: "-25% 0px -25% 0px" });
    ["#eval", "#gameRoot"].forEach((s) => $(s) && hide.observe($(s)));
    TT.buddy = (f, text) => { cur = ""; img.src = face("arale", f); tip.textContent = text; tip.classList.add("show"); clearTimeout(hideT); hideT = setTimeout(() => tip.classList.remove("show"), 5000); };
  }

  /* ───────── 進場動畫、數字、圓環 ───────── */
  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in"); io.unobserve(e.target);
      $$(".fg[data-off]", e.target).forEach((c) => (c.style.strokeDashoffset = c.dataset.off));
    }), { threshold: 0.08 });
    $$(".rv").forEach((e) => io.observe(e));
    $$("#stats b").forEach((b) => {
      const n = +b.dataset.count; let i = 0;
      if (reduce) return (b.textContent = n);
      const t = setInterval(() => { i += Math.max(1, Math.ceil(n / 25)); if (i >= n) { i = n; clearInterval(t); } b.textContent = i; }, 40);
    });
  }

  /* ───────── 背景粒子網路 ───────── */
  function bgCanvas() {
    const c = $("#bg"), x = c.getContext("2d"); let W, H, P = [], raf;
    const size = () => { W = c.width = innerWidth; H = c.height = innerHeight; const n = Math.min(70, Math.floor((W * H) / 26000)); P = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 })); };
    const draw = () => {
      x.clearRect(0, 0, W, H);
      for (let i = 0; i < P.length; i++) {
        const p = P[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        x.fillStyle = "rgba(94,234,212,.55)"; x.beginPath(); x.arc(p.x, p.y, 1.4, 0, 6.3); x.fill();
        for (let j = i + 1; j < P.length; j++) {
          const q = P[j], d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < 130) { x.strokeStyle = `rgba(94,234,212,${0.13 * (1 - d / 130)})`; x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); }
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    size(); draw();
    addEventListener("resize", () => { cancelAnimationFrame(raf); size(); draw(); });
    document.addEventListener("visibilitychange", () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) draw(); });
  }
})();

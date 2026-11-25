/* 小遊戲模組:弱點急診室(vuln-triage)
 * 介面:TT.games[type] = { mount(root, cfg, TT) }
 * 每月新增遊戲時,在 assets/js/games/ 新增一個檔案並於 index.html 引入,
 * 期別資料檔的 game.type 指向它即可。 */
(function () {
  const TT = (window.TT = window.TT || {});
  TT.games = TT.games || {};
  TT.games["vuln-triage"] = {
    mount(root, cfg, TT) {
      const { esc, face } = TT.util, V = TT.vuln, table = TT.issue.feature.table, ind = TT.issue.feature.indicators;
      const KEY = "tt-best-" + TT.issue.id;
      const best = () => { try { return +localStorage.getItem(KEY) || 0; } catch (e) { return 0; } };
      const save = (n) => { try { if (n > best()) localStorage.setItem(KEY, n); } catch (e) {} };
      const OPTS = [3, 14, 60, 0];
      let deck, i, score, right, streak, left, tick, locked;

      function intro() {
        root.innerHTML = `<div class="g-intro">
          <img class="g-char" src="${face("arale", "cheer")}" alt="">
          <div><h3>🚑 ${esc(cfg.title)}</h3><p>${esc(cfg.tagline)}</p>
          <ul class="g-how"><li>每題 <b>${cfg.seconds} 秒</b>,讀完病歷選出處置期限</li><li>答對 +100,剩餘秒數有加分,連續答對再加成</li><li>口訣:<b>曝露 × 已被利用 × 可自動化 × 完全控制</b></li></ul>
          <button class="btn big" id="gStart">開始值班 ▶</button>
          ${best() ? `<span class="g-best">你的最高分:${best()}</span>` : ""}</div></div>`;
        root.querySelector("#gStart").onclick = start;
      }
      function start() {
        deck = cfg.cases.slice().sort(() => Math.random() - 0.5).slice(0, cfg.rounds);
        i = 0; score = 0; right = 0; streak = 0; round();
      }
      function round() {
        const c = deck[i]; locked = false; left = cfg.seconds;
        root.innerHTML = `<div class="g-top"><span>病患 ${i + 1} / ${deck.length}</span><span class="g-streak">${streak > 1 ? "🔥 連對 " + streak : ""}</span><span>分數 <b id="gScore">${score}</b></span></div>
          <div class="g-bar"><i id="gBar"></i></div>
          <div class="g-case"><img class="g-char" id="gFace" src="${face("arale", "think")}" alt="">
            <div class="g-card"><div class="g-tag">弱點病歷</div><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p><div class="g-reveal" id="gReveal"></div></div></div>
          <div class="g-opts">${OPTS.map((d) => `<button class="g-opt ${V.cls(d)}" data-d="${d}"><b>${d || "↻"}</b><span>${d ? "天" : "下次更新"}</span></button>`).join("")}</div>
          <div class="g-next" id="gNext"></div>`;
        root.querySelectorAll(".g-opt").forEach((b) => (b.onclick = () => answer(+b.dataset.d)));
        if (window.innerWidth <= 640) root.scrollIntoView({ block: "start" }); // 手機:每題把遊戲框對齊畫面頂端,選項與下一題按鈕才不會掉到畫面外
        const bar = root.querySelector("#gBar");
        clearInterval(tick);
        tick = setInterval(() => { left -= 0.1; bar.style.width = Math.max(0, (left / cfg.seconds) * 100) + "%"; bar.classList.toggle("hurry", left < 7); if (left <= 0) answer(-1); }, 100);
      }
      function answer(d) {
        if (locked) return; locked = true; clearInterval(tick);
        const c = deck[i], ans = V.days(c.f, table), ok = d === ans, t = V.type(c.f);
        if (ok) { streak++; right++; score += 100 + Math.round(Math.max(0, left) * 4) + (streak > 1 ? (streak - 1) * 20 : 0); } else streak = 0;
        root.querySelector("#gScore").textContent = score;
        root.querySelectorAll(".g-opt").forEach((b) => { b.disabled = true; if (+b.dataset.d === ans) b.classList.add("right"); else if (+b.dataset.d === d) b.classList.add("wrong"); });
        root.querySelector("#gFace").src = face("arale", ok ? (streak > 2 ? "cheer" : "laugh") : d === -1 ? "confused" : "cry");
        root.querySelector("#gReveal").innerHTML = `<div class="g-verdict ${ok ? "ok" : "ng"}">${ok ? "✔ 判定正確!" : d === -1 ? "⏰ 時間到!" : "✘ 判錯了"} 類型 ${t} → <b>${V.label(ans)}</b></div>
          <div class="g-flags">${ind.map((x, k) => `<span class="${c.f[k] ? "y" : "n"}">${esc(x.name)}:<b>${c.f[k] ? x.yes : x.no}</b></span>`).join("")}</div>
          ${[1, 2, 3, 9].includes(t) ? `<p class="g-extra">⚠️ 這是類型 ${t}:還要保存並檢視日誌,確認是否已遭利用!</p>` : ""}`;
        const last = i === deck.length - 1;
        root.querySelector("#gNext").innerHTML = `<button class="btn">${last ? "看成績 🏁" : "下一位病患 ▶"}</button>`;
        root.querySelector("#gNext button").onclick = () => (last ? finish() : (i++, round()));
        if (window.innerWidth <= 640) root.querySelector("#gNext").scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      function finish() {
        const pct = right / deck.length, prev = best(); save(score);
        const R = pct >= 0.85 ? ["首席資安官", "laugh", "判斷又快又準!可以直接來當我的稽核夥伴了。"]
          : pct >= 0.6 ? ["值班資安官", "smile", "觀念正確!再熟悉一下表一,3 天的類型別漏掉。"]
          : ["實習資安員", "think", "別灰心,回上面用試算器多練幾次,口訣是:曝露、已被利用、可自動化、完全控制。"];
        const share = `我在「Allan's ISMS智庫」${TT.issue.label}小遊戲〈${cfg.title}〉拿到 ${score} 分(${right}/${deck.length}),稱號:${R[0]}!你也來挑戰 → ${location.origin + location.pathname}#game`;
        root.innerHTML = `<div class="g-end"><img class="g-char" src="${face("allan", R[1])}" alt="">
          <div><div class="g-rank">${R[0]}</div><div class="g-final"><b>${score}</b> 分 · 答對 ${right} / ${deck.length}${score > prev && prev ? " · 🎉 刷新紀錄" : ""}</div>
          <p class="g-say"><b>Allan 顧問:</b>${R[2]}</p>
          <div class="g-btns"><button class="btn big" id="gAgain">再玩一次 ↻</button><button class="btn ghost" id="gShare">複製成績分享</button><a class="btn ghost" href="#feature">回去看指引</a></div></div></div>`;
        root.querySelector("#gAgain").onclick = start;
        root.querySelector("#gShare").onclick = (e) => {
          const done = () => (e.target.textContent = "已複製 ✓");
          if (navigator.clipboard) navigator.clipboard.writeText(share).then(done, () => prompt("複製以下文字分享:", share)); else prompt("複製以下文字分享:", share);
        };
        if (TT.buddy) TT.buddy(pct >= 0.6 ? "cheer" : "wink", pct >= 0.6 ? "太強了!分享給同事比比看~" : "再挑戰一次,我幫你加油!");
        if (pct >= 0.85) confetti(root);
      }
      function confetti(host) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const box = document.createElement("div"); box.className = "confetti";
        for (let k = 0; k < 40; k++) { const s = document.createElement("i"); s.style.cssText = `left:${Math.random() * 100}%;background:${["#5eead4", "#fbbf24", "#60a5fa", "#f472b6"][k % 4]};animation-delay:${Math.random() * 0.6}s;transform:rotate(${Math.random() * 360}deg)`; box.appendChild(s); }
        host.appendChild(box); setTimeout(() => box.remove(), 3200);
      }
      intro();
    }
  };
})();

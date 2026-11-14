/* 轻量下拉选择（零依赖，替代 antd AutoComplete）
 * 挂载点：<div class="pick" data-pick="origin" data-list="origin" data-value="肯尼亚">
 *          <input type="hidden" data-f="origin" value="肯尼亚">
 *        </div>
 * 值写回同级 input[type=hidden]（data-f 或 data-d）。
 * 交互：点按钮出面板（桌面贴按钮下方，手机底部弹出），点选项即选；末尾「自己填」可输入自定义值。
 * 不自动聚焦搜索框（手机上会弹键盘、页面跟着跳，是之前「卡且难用」的主因）。
 */
(function () {
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  /* 按当前语言取界面词；中文直接返回原文 */
  const L = () => (window.I18N && window.I18N.lang) || "zh";
  const pickBy = (zh, en, ja, ko) => ({ zh, en, ja, ko })[L()] || zh;
  const customLabel = () => pickBy("＋ 自己填", "＋ Type my own", "＋ 自分で入力", "＋ 직접 입력");
  const searchPh = () => pickBy("搜索", "Search", "検索", "검색");
  const emptyLabel = () => pickBy("没找到", "Nothing found", "見つかりません", "결과 없음");

  let panel = null;
  let maskEl = null;
  let host = null;

  const tr = (s) => (window.I18N && window.I18N.t ? window.I18N.t(s) : s);
  const dataOf = (h) => {
    const dyn = (window.__CUPPING_DYNAMIC || {})[h.dataset.list];
    if (typeof dyn === "function") {
      try {
        const out = dyn(h);
        if (Array.isArray(out) && out.length) return out;
      } catch (err) {
        /* 动态源出错就退回静态表，不让下拉打不开 */
      }
    }
    return (window.__CUPPING_DATA || {})[h.dataset.list] || [];
  };
  const hiddenOf = (h) => h.querySelector('input[type="hidden"]');
  const btnOf = (h) => h.querySelector(".pick-btn");

  function syncBtn(h) {
    const btn = btnOf(h);
    if (!btn) return;
    const hid = hiddenOf(h);
    const v = (hid?.value || "").trim();
    let text;
    if (isMulti(h) && v) {
      /* 多选用「、」显示，比 " / " 窄一截，手机上不容易截断 */
      text = splitVal(v).map((x) => tr(x)).join("、");
    } else {
      text = v ? tr(v) : tr(btn.dataset.ph || "");
    }
    btn.querySelector(".pick-val").textContent = text;
    btn.classList.toggle("empty", !v);
  }

  /* ---------- 面板 ---------- */

  function closePanel() {
    if (panel) panel.remove();
    if (maskEl) maskEl.remove();
    document.body.classList.remove("pick-open");
    panel = null;
    maskEl = null;
    host = null;
  }

  const SEP = " / ";
  const isMulti = (h) => h && h.dataset.multi === "1";
  const splitVal = (v) => String(v || "").split(SEP).map((x) => x.trim()).filter(Boolean);

  function optionHtml(v, cur, multi) {
    const on = multi ? cur.includes(v) : v === cur;
    return `<button type="button" class="pick-opt${on ? " on" : ""}" data-v="${esc(v)}">
      <span>${esc(tr(v))}</span>
      ${on ? '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>' : ""}
    </button>`;
  }

  function listHtml(groups, cur, multi) {
    return groups
      .map(
        (g) => `<div class="pick-group"${g.extra ? ' data-extra="1"' : ""}${g.mem ? (g.memItems ? ' data-mem-mix="1"' : ' data-mem="1"') : ""}>
          ${g.g ? `<div class="pick-gt">${esc(tr(g.g))}</div>` : ""}
          ${(g.items || [])
            .map((it) => {
              if (it && it.set) {
                const all = it.set.every((x) => cur.includes(x));
                return `<button type="button" class="pick-opt set${all ? " on" : ""}" data-set="${esc(it.set.join("|"))}">
                  <span>${esc(tr(it.label))}</span>
                  ${all ? '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>' : ""}
                </button>`;
              }
              let html = optionHtml(it, cur, multi);
              /* 混合组只有并进来的记忆词带角标，组里原有的静态词不带 */
              const isMem = g.memItems ? g.memItems.includes(it) : !!g.mem;
              /* 「已选」组里都是候选表里没有的词（自己填的），也要能长按去掉 */
              const isSel = !!g.extra;
              if (isMem || isSel) {
                const tip = isSel && !isMem
                  ? pickBy("长按可去掉", "Long-press to remove", "長押しで外す", "길게 눌러 빼기")
                  : pickBy("长按可删", "Long-press to remove", "長押しで削除", "길게 눌러 삭제");
                html = html
                  .replace('class="pick-opt', `${isMem ? 'data-mem="1" ' : ""}${isSel ? 'data-sel="1" ' : ""}class="pick-opt`)
                  .replace("<span>", `<span class="pick-opt-t">`)
                  .replace("</span>", `</span><span class="pick-opt-mem">${esc(tip)}</span>`);
              }
              return html;
            })
            .join("")}
        </div>`
      )
      .join("");
  }

  function openPanel(h) {
    closePanel();
    host = h;
    if (window.__onPickOpen) window.__onPickOpen(h);
    const btn = btnOf(h);
    const hid = hiddenOf(h);
    const multi = isMulti(h);
    const curRaw = (hid?.value || "").trim();
    const cur = multi ? splitVal(curRaw) : curRaw;
    const title = tr(btn?.dataset.title || btn?.dataset.ph || "");
    const groups = dataOf(h);
    /* 自己填过的词不在候选表里，单独置顶成「已选」组，否则看不到也取消不掉 */
    const known = new Set();
    groups.forEach((g) => (g.items || []).forEach((it) => (it && it.set ? it.set.forEach((x) => known.add(x)) : known.add(it))));
    const curList = multi ? cur : curRaw ? [curRaw] : [];
    const extras = curList.filter((x) => !known.has(x));
    const allGroups = extras.length ? [{ g: "已选", items: extras, extra: 1 }, ...groups] : groups;
    const mobile = window.matchMedia("(max-width: 860px)").matches;

    /* 弹窗里再开下拉时，面板要抬到弹窗之上，否则会被遮罩盖住、点了像没反应 */
    const liftZ = [...document.querySelectorAll(".mask, .pick-pop, .pick-mask")].reduce(
      (mx, el) => Math.max(mx, Number(getComputedStyle(el).zIndex) || 0),
      0
    );

    panel = document.createElement("div");
    panel.className = "pick-pop" + (mobile ? " sheet" : "") + (multi ? " multi" : "");
    panel.innerHTML = `
      <div class="pick-head">
        <span class="pick-title">${esc(title)}</span>
        <div class="pick-spacer"></div>
        <button type="button" class="pick-x" data-x aria-label="close">
          <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>
        </button>
      </div>
      <div class="pick-search-wrap">
        <input class="pick-search" type="text" placeholder="${esc(searchPh())}" autocomplete="off" spellcheck="false" />
      </div>
      <div class="pick-list">${listHtml(allGroups, cur, multi)}</div>
      <div class="pick-foot">
        <button type="button" class="pick-custom" data-custom>${esc(customLabel())}</button>
        <div class="pick-custom-row" hidden>
          <input class="pick-input" type="text" placeholder="${esc(pickBy("输入自己的", "Type your own", "自分で入力", "직접 입력"))}" autocomplete="off" spellcheck="false" />
          <button type="button" class="pick-ok" data-ok>${pickBy("确定", "OK", "OK", "확인")}</button>
        </div>
        ${multi
          ? `<div class="pick-confirm">
          <button type="button" class="pick-cancel" data-cancel>${pickBy("取消", "Cancel", "キャンセル", "취소")}</button>
          <button type="button" class="pick-confirm-btn" data-confirm></button>
        </div>`
          : ""}
      </div>`;

    /* 多选：先攒在 draft 里，点「确定」才写回，避免边点边存 */
    const draft = new Set(multi ? splitVal(curRaw) : []);
    const confirmBtn = panel.querySelector("[data-confirm]");
    function paintConfirm() {
      if (!confirmBtn) return;
      const n = draft.size;
      confirmBtn.textContent = n
        ? `${pickBy("确定", "OK", "OK", "확인")} · ${n}`
        : pickBy("确定", "OK", "OK", "확인");
      confirmBtn.classList.toggle("is-zero", n === 0);
    }
    function ensureOption(v) {
      const list = panel.querySelector(".pick-list");
      let opt = [...list.querySelectorAll(".pick-opt")].find((b) => b.dataset.v === v);
      if (!opt) {
        let g = list.querySelector('.pick-group[data-extra="1"]');
        if (!g) {
          g = document.createElement("div");
          g.className = "pick-group";
          g.dataset.extra = "1";
          g.innerHTML = `<div class="pick-gt">${esc(pickBy("已选", "Selected", "選択済み", "선택됨"))}</div>`;
          list.insertBefore(g, list.firstChild);
        }
        g.insertAdjacentHTML("beforeend", optionHtml(v, [v], true));
        opt = [...g.querySelectorAll(".pick-opt")].find((b) => b.dataset.v === v);
      }
      if (opt) {
        paintOpt(opt);
        opt.scrollIntoView({ block: "nearest" });
      }
    }
    function paintOpt(b) {
      const on = draft.has(b.dataset.v);
      b.classList.toggle("on", on);
      const tick = b.querySelector("svg");
      if (on && !tick) b.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>');
      if (!on && tick) tick.remove();
    }
    paintConfirm();

    if (liftZ >= 90) panel.style.zIndex = String(liftZ + (mobile ? 2 : 1));

    if (mobile) {
      maskEl = document.createElement("div");
      maskEl.className = "pick-mask";
      if (liftZ >= 90) maskEl.style.zIndex = String(liftZ + 1);
      document.body.appendChild(maskEl);
      document.body.appendChild(panel);
      document.body.classList.add("pick-open");
    } else {
      document.body.appendChild(panel);
      const r = btn.getBoundingClientRect();
      const w = Math.max(Math.round(r.width), 300);
      const maxH = Math.min(360, window.innerHeight - r.bottom - 20);
      panel.style.left = Math.min(Math.round(r.left), window.innerWidth - w - 12) + "px";
      panel.style.top = Math.round(r.bottom + 6) + "px";
      panel.style.width = w + "px";
      panel.style.maxHeight = Math.max(maxH, 200) + "px";
    }

    /* 搜索：只在输入时过滤，不抢焦点 */
    const search = panel.querySelector(".pick-search");
    const list = panel.querySelector(".pick-list");
    search.addEventListener("input", () => {
      const q = search.value.trim().toLowerCase();
      let any = false;
      list.querySelectorAll(".pick-opt").forEach((b) => {
        const raw = (b.dataset.v || b.dataset.set || "").toLowerCase();
        const hit = !q || raw.includes(q) || b.textContent.toLowerCase().includes(q);
        b.hidden = !hit;
        if (hit) any = true;
      });
      list.querySelectorAll(".pick-group").forEach((g) => {
        const visible = [...g.querySelectorAll(".pick-opt")].some((b) => !b.hidden);
        g.hidden = !visible;
      });
      let none = list.querySelector(".pick-none");
      if (!any) {
        if (!none) {
          none = document.createElement("div");
          none.className = "pick-none";
          list.appendChild(none);
        }
        none.textContent = emptyLabel();
        none.hidden = false;
      } else if (none) none.hidden = true;
    });

    /* 长按选项 → 问一句要不要把它从「我填过」里去掉（只清空那条记录里的这个词，不影响别的） */
    let lpTimer = null;
    let lpFired = false;
    /* 能长按的两类：记忆词（从候选里删掉）、已选里自己填的词（从这支样品里去掉） */
    const lpKind = (opt) => {
      if (!opt || opt.dataset.set) return "";
      if (opt.dataset.sel === "1" || opt.closest('.pick-group[data-extra="1"]')) return "sel";
      if (opt.dataset.mem === "1" || opt.closest('.pick-group[data-mem="1"]')) return "mem";
      return "";
    };
    const startLP = (e) => {
      const opt = e.target.closest(".pick-opt");
      const kind = lpKind(opt);
      if (!kind) return;
      /* 记忆词上长按：不让浏览器弹选中/复制菜单 */
      if (e.cancelable) e.preventDefault();
      lpFired = false;
      clearTimeout(lpTimer);
      lpTimer = setTimeout(() => {
        lpFired = true;
        if (kind === "sel") removeSelected(opt.dataset.v);
        else removeMemory(opt.dataset.v);
      }, 550);
    };
    const endLP = () => clearTimeout(lpTimer);
    /* 安卓/iOS 长按有时只发 contextmenu、不发 pointer 序列，这里兜一层 */
    list.addEventListener("contextmenu", (e) => {
      const opt = e.target.closest(".pick-opt");
      const kind = lpKind(opt);
      if (!kind) return;
      e.preventDefault();
      clearTimeout(lpTimer);
      lpFired = true;
      if (kind === "sel") removeSelected(opt.dataset.v);
      else removeMemory(opt.dataset.v);
    });

    list.addEventListener("pointerdown", startLP);
    list.addEventListener("pointerup", endLP);
    list.addEventListener("pointercancel", endLP);
    list.addEventListener("pointerleave", endLP);
    list.addEventListener("touchstart", startLP, { passive: true });
    list.addEventListener("touchend", endLP);
    list.addEventListener("touchmove", endLP);

    /* 已选里自己填的词：不是候选表的词，长按就是把它从这支样品的取值里去掉 */
    async function removeSelected(v) {
      const ask = window.__confirmRemoveValue;
      if (typeof ask !== "function") return;
      const h = host;
      const listEl = list;
      const yes = await ask(v);
      if (!yes) return;
      if (multi) {
        draft.delete(v);
        paintConfirm();
        writeMulti([...draft], h);
      } else {
        commit("", h);
      }
      /* 长按松手时面板可能已被关掉：值已经写回去了，这里只做界面清理 */
      if (!listEl.isConnected) return;
      list.querySelectorAll(".pick-opt").forEach((b) => {
        if (b.dataset.v === v && (b.dataset.sel === "1" || b.closest('.pick-group[data-extra="1"]'))) b.remove();
      });
      list.querySelectorAll('.pick-group[data-extra="1"]').forEach((g) => {
        if (!g.querySelector(".pick-opt")) g.remove();
      });
    }

    async function removeMemory(v) {
      const yes = await window.__forgetKnown(v, host ? host.dataset.list : "variety", host);
      if (!yes) return;
      list.querySelectorAll(".pick-opt").forEach((b) => {
        if (b.dataset.v === v && (b.dataset.mem === "1" || b.closest('.pick-group[data-mem="1"]'))) b.remove();
      });
      list.querySelectorAll('.pick-group[data-extra="1"] .pick-opt[data-v="' + CSS.escape(v) + '"]').forEach((b) => b.remove());
      list.querySelectorAll('.pick-group[data-mem="1"]').forEach((g) => {
        if (!g.querySelector(".pick-opt")) g.remove();
      });
      list.querySelectorAll('.pick-group[data-mem-mix="1"]').forEach((g) => {
        if (!g.querySelector('.pick-opt[data-mem="1"]')) delete g.dataset.memMix;
      });
      if (typeof window.__onPickForget === "function") window.__onPickForget(v);
    }

    /* 选项 */
    list.addEventListener("click", (e) => {
      if (lpFired) {
        lpFired = false;
        return;
      }
      const opt = e.target.closest(".pick-opt");
      if (!opt) return;
      if (opt.dataset.set) return toggleSet(opt.dataset.set.split("|"));
      if (!multi) return commit(opt.dataset.v);
      /* 多选：先改 draft，点确定才落库 */
      if (draft.has(opt.dataset.v)) draft.delete(opt.dataset.v);
      else draft.add(opt.dataset.v);
      paintOpt(opt);
      refreshSets();
      paintConfirm();
    });

    /* 集合项：一次把一整组勾上/取消 */
    function toggleSet(items) {
      const all = items.every((x) => draft.has(x));
      items.forEach((x) => (all ? draft.delete(x) : draft.add(x)));
      list.querySelectorAll(".pick-opt[data-v]").forEach(paintOpt);
      refreshSets();
      paintConfirm();
    }

    function refreshSets() {
      list.querySelectorAll(".pick-opt[data-set]").forEach((b) => {
        const items = b.dataset.set.split("|");
        const all = items.every((x) => draft.has(x));
        b.classList.toggle("on", all);
        const tick = b.querySelector("svg");
        if (all && !tick) b.insertAdjacentHTML("beforeend", '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>');
        if (!all && tick) tick.remove();
      });
    }

    /* 确定 / 取消 */
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        writeMulti([...draft]);
        closePanel();
      });
      panel.querySelector("[data-cancel]").addEventListener("click", closePanel);
    }

    /* 自己填 */
    const row = panel.querySelector(".pick-custom-row");
    const input = panel.querySelector(".pick-input");
    panel.querySelector(".pick-custom").addEventListener("click", () => {
      row.hidden = false;
      panel.querySelector(".pick-custom").hidden = true;
      input.focus();
      row.scrollIntoView({ block: "nearest" });
    });
    const okCustom = () => {
      const v = input.value.trim();
      if (!v) return input.focus();
      if (multi) {
        /* 自定义词也先攒进 draft，仍需点「确定」落库 */
        draft.add(v);
        ensureOption(v);
        paintConfirm();
        input.value = "";
        row.hidden = true;
        panel.querySelector(".pick-custom").hidden = false;
        return;
      }
      commit(v);
    };
    panel.querySelector("[data-ok]").addEventListener("click", okCustom);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        okCustom();
      }
    });

    panel.querySelector("[data-x]").addEventListener("click", closePanel);
    if (maskEl) maskEl.addEventListener("click", closePanel);
  }

  function writeMulti(arr, target) {
    const h = target || host;
    if (!h) return;
    /* 按候选表里的固定顺序排，勾选先后不影响显示，方便前后对照 */
    const order = (window.__CUPPING_ORDER || {})[h.dataset.list] || [];
    const idx = (x) => {
      const i = order.indexOf(x);
      return i < 0 ? 999 : i;
    };
    const v = arr.slice().sort((a, b) => idx(a) - idx(b)).join(SEP);
    const hid = hiddenOf(h);
    if (hid) hid.value = v;
    h.dataset.value = v;
    syncBtn(h);
    if (window.__onPickChange) window.__onPickChange(h, v);
  }

  function commit(v, target) {
    const h = target || host;
    if (!h) return;
    const hid = hiddenOf(h);
    if (hid) hid.value = v;
    h.dataset.value = v;
    syncBtn(h);
    /* 给 app.js 一个变更信号（hidden input 赋 .value 不触发 change） */
    if (window.__onPickChange) window.__onPickChange(h, v);
    closePanel();
  }

  /* ---------- 全局 ---------- */

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".pick-btn");
    if (btn) {
      e.preventDefault();
      const h = btn.closest(".pick");
      if (panel && host === h) return closePanel();
      return openPanel(h);
    }
    /* 点面板外面就关。两处例外：
       ① 确认弹窗里的按钮（点完就已从 DOM 摘掉，isConnected 为 false）；
       ② #layer 里的弹窗本身。
       都不算「点在外面」，否则长按删除的时候下层面板会跟着消失。 */
    if (!panel) return;
    if (e.target.isConnected === false) return;
    if (e.target.closest(".pick-pop")) return;
    if (e.target.closest("#layer")) return;
    closePanel();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !panel) return;
    e.stopPropagation();
    closePanel();
  });

  /* 只有窗口宽度变了（旋屏 / 拖窗口）才关；手机弹键盘引起的高度变化不能关，
     否则点「自己填」聚焦输入框的瞬间面板就消失了，看起来像闪退 */
  let lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    if (!panel) return;
    /* 焦点在面板里（正在输入自定义值）时，任何尺寸变化都只做位置调整，不关闭 */
    if (panel.contains(document.activeElement)) return keepAboveKeyboard();
    const w = window.innerWidth;
    if (Math.abs(w - lastW) < 2) return keepAboveKeyboard();
    lastW = w;
    closePanel();
  }, { passive: true });

  /* 手机底部弹层：键盘弹出时把它顶到键盘上方 */
  function keepAboveKeyboard() {
    if (!panel || !panel.classList.contains("sheet")) return;
    const vv = window.visualViewport;
    const kb = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
    panel.style.bottom = kb ? kb + "px" : "";
    panel.style.maxHeight = kb ? Math.min(vv.height * 0.7, 560) + "px" : "";
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", keepAboveKeyboard, { passive: true });
    window.visualViewport.addEventListener("scroll", keepAboveKeyboard, { passive: true });
  }

  function mount(scope) {
    (scope || document).querySelectorAll(".pick[data-pick]").forEach((h) => {
      if (!h.dataset.ready) {
        h.dataset.ready = "1";
        const btn = btnOf(h);
        if (btn && btn.dataset.ph) btn.title = btn.dataset.ph;
      }
      syncBtn(h);
    });
  }

  function refresh(h) {
    if (h) syncBtn(h);
  }

  window.Picker = { mount, refresh, close: closePanel };
})();
